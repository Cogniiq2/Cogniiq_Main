import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Eye, FileCheck2, GitBranch, Link2, Pencil, Save, Trash2, XCircle } from 'lucide-react';

import {
  Button, Card, ConfirmDialog, ErrorState, InfoBanner, PageHeader, SectionHeader, StatusBadge,
  KpiSkeletonGrid, useToast,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { offerStatusTone } from '@/pages/owner/OffersPage';
import { PremiumOfferPreview } from '@/pages/owner/PremiumOfferPreview';
import { PremiumPdfPreviewDialog } from '@/components/finance/PremiumPdfPreviewDialog';
import { SendOfferDialog } from '@/components/finance/SendOfferDialog';
import {
  loadOffer, finalizeOffer, createOfferRevision, setOfferStatus, convertOfferToInvoiceDraft,
  createOfferAccessToken, loadOfferAcceptanceEvents, loadGeneratedDocuments, signedDocumentUrl,
  deleteOfferDraft, loadLatestOfferVersion, loadDocumentSettings,
  loadAcceptanceSummary, signedSignatureUrl, retryAutomationJob, retryOfferAutomation,
  loadOfferAutomationJobs,
} from '@/lib/ownerFinance/offersApi';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { offerToDocument, snapshotToDocument } from '@/lib/ownerFinance/buildTransactionalDoc';
import { validateOfferForFinalization, documentFilename, type TransactionalDocument } from '@/lib/ownerFinance/documents';
import { downloadBytes } from '@/lib/ownerFinance/exports';
import { renderPremiumPdf } from '@/lib/ownerFinance/documents/premium';
import { generateAndStoreDocument } from '@/lib/ownerFinance/generateDocument';
import { formatCents } from '@/lib/clientPlatform/validation';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { deriveOfferSignatureState, isSignedCertificateDocument, deriveCertificateStatus, deriveConfirmationEmailStatus, deriveOfferEmailStatus, findJob } from '@/lib/ownerFinance/offerSignatureState';
import { SIGNATURE_LEVEL_LABEL_DE, type SignatureLevel } from '@/lib/ownerFinance/documents/signatureProvider';
import type { OwnerOffer, OwnerOfferLine, OwnerDocumentSettings, OwnerOfferAcceptanceEvent, OwnerGeneratedDocument, OwnerOfferVersion, OwnerOfferAcceptanceSummary, OwnerAutomationJobStatus } from '@/lib/ownerFinance/types';

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', finalized: 'Finalisiert', sent: 'Versendet', viewed: 'Angesehen',
  accepted: 'Angenommen', rejected: 'Abgelehnt', expired: 'Abgelaufen', cancelled: 'Storniert', converted: 'Umgewandelt',
};

const jobLabel = (t: string): string => ({
  invoice_create: 'Rechnung erstellen', invoice_issue: 'Rechnung ausstellen',
  invoice_pdf_generate: 'Rechnungs-PDF erzeugen',
  invoice_send: 'Rechnung senden', invoice_email: 'Rechnungs-E-Mail', offer_email: 'Angebots-E-Mail',
  signed_offer_certificate_generate: 'Annahmebestätigung erzeugen',
  signed_offer_confirmation_email: 'Bestätigungs-E-Mail',
}[t] ?? t);

const jobTone = (status: string): 'success' | 'danger' | 'neutral' =>
  status === 'sent' || status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'neutral';

/** German label for a stored signature level; falls back to the raw value for unknown levels. */
const signatureLevelLabel = (level: string | null | undefined): string =>
  (level && SIGNATURE_LEVEL_LABEL_DE[level as SignatureLevel]) || 'Einfache elektronische Signatur';

// Short lifetime for the private-bucket signature preview URL (owner context only). 60–300s.
const SIGNATURE_PREVIEW_TTL_SECONDS = 180;

export function OfferDetailPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<OwnerOffer | null>(null);
  const [lines, setLines] = useState<OwnerOfferLine[]>([]);
  const [settings, setSettings] = useState<OwnerDocumentSettings | null>(null);
  const [events, setEvents] = useState<OwnerOfferAcceptanceEvent[]>([]);
  const [docs, setDocs] = useState<OwnerGeneratedDocument[]>([]);
  const [version, setVersion] = useState<OwnerOfferVersion | null>(null);
  const [summary, setSummary] = useState<OwnerOfferAcceptanceSummary | null>(null);
  const [automationJobs, setAutomationJobs] = useState<OwnerAutomationJobStatus[]>([]);
  const [recipient, setRecipient] = useState<{ name: string; addressLines: string[]; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  // Inline signature preview via a short-lived signed URL from the PRIVATE owner-offer-signatures bucket.
  const [sigPreview, setSigPreview] = useState<{ url: string | null; loading: boolean; error: boolean }>({ url: null, loading: false, error: false });

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!offerId || !entity) return;
    if (!opts?.silent) setLoading(true);
    try {
      const [res, settingsRow, evts, generated, clients, ver, jobs] = await Promise.all([
        loadOffer(offerId), loadDocumentSettings(entity.id).catch(() => null),
        loadOfferAcceptanceEvents(offerId).catch(() => []),
        loadGeneratedDocuments(entity.id, { type: 'owner_offers', id: offerId }).catch(() => []),
        loadAdminClients().catch(() => []),
        loadLatestOfferVersion(offerId).catch(() => null),
        loadOfferAutomationJobs(offerId).catch(() => []),
      ]);
      if (!res) { setError('Angebot nicht gefunden'); return; }
      setOffer(res.offer); setLines(res.lines); setSettings(settingsRow); setEvents(evts); setDocs(generated); setVersion(ver); setAutomationJobs(jobs);
      if (['accepted', 'converted'].includes(res.offer.status)) {
        loadAcceptanceSummary(offerId).then(setSummary).catch(() => setSummary(null));
      } else setSummary(null);
      const c = clients.find((x) => x.organizationId === res.offer.organization_id);
      setRecipient(c ? { name: c.account?.legal_name ?? c.organizationName, addressLines: (c.account?.address ?? '').split('\n').filter(Boolean), email: c.account?.primary_email ?? null } : null);
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { if (!opts?.silent) setLoading(false); }
  }, [offerId, entity]);

  useEffect(() => { void load(); }, [load]);

  // Refetch offer + acceptance summary when the tab regains focus, so an acceptance that happened
  // in another window (the customer portal) is reflected WITHOUT a hard refresh — no stale
  // "not signed" value lingers in React state.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void load({ silent: true }); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible); };
  }, [load]);

  // Fetch a fresh short-lived signed URL for the private signature PNG. Never builds a public URL.
  const loadSignaturePreview = useCallback(async (path: string) => {
    setSigPreview({ url: null, loading: true, error: false });
    const { url } = await signedSignatureUrl(path, SIGNATURE_PREVIEW_TTL_SECONDS);
    setSigPreview({ url: url ?? null, loading: false, error: !url });
  }, []);

  // Auto-load the inline preview whenever a stored signature path becomes available. The signed URL
  // expires after SIGNATURE_PREVIEW_TTL_SECONDS; an expired <img> load triggers an on-demand refresh.
  const signaturePath = summary?.signature_storage_path ?? null;
  useEffect(() => {
    if (signaturePath) void loadSignaturePreview(signaturePath);
    else setSigPreview({ url: null, loading: false, error: false });
  }, [signaturePath, loadSignaturePreview]);

  const openSignature = useCallback(async (path: string) => {
    const { url } = await signedSignatureUrl(path, SIGNATURE_PREVIEW_TTL_SECONDS);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast.error('Unterschrift konnte nicht geladen werden.');
  }, [toast]);

  const retryJob = useCallback(async (job: { id: string }) => {
    const { error } = await retryAutomationJob(job.id);
    if (error) toast.error('Erneuter Versuch fehlgeschlagen.'); else { toast.success('Wird erneut versucht.'); void load(); }
  }, [toast, load]);

  // Secure owner retry/enqueue by (offer, job type). The sensitive work runs only in the worker.
  const retryOffer = useCallback(async (jobType: Parameters<typeof retryOfferAutomation>[1]) => {
    if (!offer) return;
    const { error } = await retryOfferAutomation(offer.id, jobType);
    if (error) toast.error('Aktion fehlgeschlagen', error); else { toast.success('Wird verarbeitet', 'Die Automatisierung wurde neu eingeplant.'); void load(); }
  }, [offer, toast, load]);

  const isDraft = offer?.status === 'draft';

  // The document model: for a finalized offer, ALWAYS build from the immutable version snapshot
  // (never current CRM/settings), so the customer-facing document stays byte-stable.
  const doc: TransactionalDocument | null = useMemo(() => {
    if (!offer) return null;
    if (!isDraft && version?.snapshot) return snapshotToDocument(version.snapshot as Record<string, unknown>);
    return offerToDocument(offer, lines, settings, recipient, entity?.display_name ?? 'Cogniiq');
  }, [offer, lines, settings, recipient, entity, isDraft, version]);

  const validation = useMemo(() => (doc ? validateOfferForFinalization(doc) : null), [doc]);

  // Downstream signed-certificate availability, derived from the generated-documents list (never
  // from the acceptance summary). This is a SEPARATE state and must not gate "signatureCaptured".
  const signedDocumentAvailable = useMemo(() => docs.some(isSignedCertificateDocument), [docs]);

  // The three independent signed states (accepted / signatureCaptured / signedDocumentGenerated).
  const sigState = useMemo(
    () => deriveOfferSignatureState({ status: offer?.status, acceptance: summary, signedDocumentAvailable }),
    [offer?.status, summary, signedDocumentAvailable],
  );

  // Certificate + confirmation-email display states (available/pending/failed + retry).
  const certJob = useMemo(() => findJob(summary?.automation_jobs, 'signed_offer_certificate_generate'), [summary]);
  const confirmJob = useMemo(() => findJob(summary?.automation_jobs, 'signed_offer_confirmation_email'), [summary]);
  const certState = useMemo(
    () => deriveCertificateStatus({ hasCertificateDocument: Boolean(summary?.certificate) || signedDocumentAvailable, signatureCaptured: sigState.signatureCaptured, job: certJob }),
    [summary?.certificate, signedDocumentAvailable, sigState.signatureCaptured, certJob],
  );
  const confirmState = useMemo(() => deriveConfirmationEmailStatus(confirmJob), [confirmJob]);

  // Owner-triggered offer-email job (newest first from loadOfferAutomationJobs) + its display state.
  const offerEmailJob = useMemo(() => automationJobs.find((j) => j.job_type === 'offer_email') ?? null, [automationJobs]);
  const offerEmailState = useMemo(() => deriveOfferEmailStatus(offerEmailJob), [offerEmailJob]);
  const canSend = ['finalized', 'sent', 'viewed'].includes(offer?.status ?? '');

  // Hardened async wrapper: unexpected errors surface as a toast + full console log, never silently.
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); }
    catch (e: unknown) {
      console.error(`[OfferDetailPage] action "${key}" failed:`, e);
      toast.error('Aktion fehlgeschlagen', e instanceof Error ? e.message : String(e));
    } finally { setBusy(null); }
  };

  // The preview PDF producer (stable per doc). For finalized offers `doc` is built from the
  // immutable snapshot, so the preview never uses current CRM / current document settings.
  const renderPreview = useCallback(() => renderPremiumPdf(doc!), [doc]);

  const downloadPdf = () => run('download', async () => { if (doc) { const bytes = await renderPremiumPdf(doc); downloadBytes(documentFilename(doc), bytes, 'application/pdf'); } });

  const finalize = useCallback(() => run('finalize', async () => {
    if (!offer) return;
    const { error: err, offerNumber } = await finalizeOffer(offer.id);
    if (err) { toast.error('Finalisierung fehlgeschlagen', err); return; }
    toast.success('Angebot finalisiert', `Nummer ${offerNumber ?? ''} vergeben.`);
    void load();
  }), [offer, toast, load]);

  // Auto-finalize when arriving from the editor's Finalisieren action (?finalize=1).
  useEffect(() => {
    if (searchParams.get('finalize') === '1' && offer?.status === 'draft' && !busy) {
      setSearchParams({}, { replace: true });
      void finalize();
    }
  }, [searchParams, offer, busy, finalize, setSearchParams]);

  const generateStore = () => run('generate', async () => {
    if (!offer || !doc || !entity) return;
    const res = await generateAndStoreDocument(entity.id, offer.id, doc, { requireValid: true, render: renderPremiumPdf });
    if (res.error) { toast.error('PDF konnte nicht gespeichert werden', res.blocked?.length ? res.blocked.join(', ') : res.error); return; }
    toast.success('PDF erzeugt und gespeichert', `Version ${res.version ?? 1}`);
    void load();
  });

  const createLink = () => run('link', async () => {
    if (!offer || !entity) return;
    const latestDoc = docs[0]?.id ?? null;
    const { token, error: err } = await createOfferAccessToken(offer.id, latestDoc, settings?.default_offer_validity_days ?? 30);
    if (err || !token) { toast.error('Link konnte nicht erstellt werden', err ?? 'Unbekannt'); return; }
    const url = `${window.location.origin}/d/${token}`;
    try { await navigator.clipboard.writeText(url); toast.success('Sicherer Link kopiert', 'Der Link wurde in die Zwischenablage kopiert.'); }
    catch { toast.success('Sicherer Link erstellt', url); }
  });

  const revision = () => run('revision', async () => {
    if (!offer) return;
    const { id, error: err } = await createOfferRevision(offer.id);
    if (err || !id) { toast.error('Revision fehlgeschlagen', err ?? 'Unbekannt'); return; }
    toast.success('Revision erstellt', 'Bearbeiten Sie den neuen Entwurf.'); navigate(`/admin/finance/offers/${id}/edit`);
  });

  const convert = () => run('convert', async () => {
    if (!offer) return;
    const { invoiceId, error: err } = await convertOfferToInvoiceDraft(offer.id);
    if (err || !invoiceId) { toast.error('Umwandlung fehlgeschlagen', err ?? 'Unbekannt'); return; }
    toast.success('Rechnungsentwurf erstellt', 'Bitte prüfen und stellen.');
    navigate(`/admin/finance/invoices/${invoiceId}`);
  });

  const downloadStored = (path: string) => run('stored', async () => {
    const { url, error: err } = await signedDocumentUrl(path);
    if (err || !url) { toast.error('Download fehlgeschlagen', err ?? 'Kein Link'); return; }
    window.open(url, '_blank', 'noopener');
  });

  if (loading) return <div className="space-y-6"><div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" /><KpiSkeletonGrid count={3} /></div>;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!offer || !doc) return <ErrorState message="Angebot nicht verfügbar" />;

  const canConvert = offer.status === 'accepted';

  return (
    <>
      <button onClick={() => navigate('/admin/finance/offers')} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-950"><ArrowLeft size={15} /> Zurück zu Angeboten</button>
      <PageHeader
        title={offer.offer_number ?? 'Angebot (Entwurf)'}
        description={offer.title ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDraft ? (
              <>
                <Button size="sm" icon={Pencil} onClick={() => navigate(`/admin/finance/offers/${offer.id}/edit`)}>Bearbeiten</Button>
                <Button size="sm" variant="secondary" icon={Eye} onClick={() => setPreviewOpen(true)}>Vorschau</Button>
                <Button size="sm" variant="secondary" icon={Download} onClick={downloadPdf} loading={busy === 'download'}>Entwurf herunterladen</Button>
                <Button size="sm" icon={FileCheck2} onClick={finalize} loading={busy === 'finalize'} disabled={!validation?.canFinalize} title={validation?.canFinalize ? undefined : 'Pflichtangaben fehlen'}>Finalisieren</Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>Entwurf löschen</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" icon={Eye} onClick={() => setPreviewOpen(true)}>Vorschau</Button>
                <Button size="sm" variant="secondary" icon={Download} onClick={downloadPdf} loading={busy === 'download'}>PDF herunterladen</Button>
                <Button size="sm" variant="secondary" icon={Save} onClick={generateStore} loading={busy === 'generate'}>PDF speichern</Button>
                {['finalized', 'sent', 'viewed'].includes(offer.status) ? <Button size="sm" icon={Link2} onClick={() => setSendOpen(true)}>Angebot versenden</Button> : null}
                {offer.status !== 'converted' && offer.status !== 'cancelled' ? <Button size="sm" variant="ghost" icon={Copy} onClick={createLink} loading={busy === 'link'}>Nur Link kopieren</Button> : null}
                {offer.status !== 'converted' && offer.status !== 'cancelled' ? <Button size="sm" variant="secondary" icon={GitBranch} onClick={revision} loading={busy === 'revision'}>Revision erstellen</Button> : null}
                {canConvert ? <Button size="sm" icon={Copy} onClick={convert} loading={busy === 'convert'}>Rechnungsentwurf erstellen</Button> : null}
              </>
            )}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusBadge label={statusLabel[offer.status] ?? offer.status} tone={offerStatusTone[offer.status]} />
        {canSend ? (
          <span className="flex items-center gap-1.5">
            <span className="text-[13px] text-gray-500">E-Mail:</span>
            <StatusBadge label={offerEmailState.label} tone={offerEmailState.tone} />
            {offerEmailState.canRetry ? <button onClick={() => setSendOpen(true)} className="text-[12px] text-gray-700 underline">Erneut versuchen</button> : null}
          </span>
        ) : null}
        <span className="text-[13px] text-gray-500">Gültig bis {formatDateDe(offer.valid_until)}</span>
        {!isDraft && version ? <span className="text-[12px] text-gray-400">Version {version.version} · Quell-Hash {version.source_hash.slice(0, 12)}…</span> : null}
        {offer.converted_invoice_id ? <button className="text-[13px] text-gray-700 underline" onClick={() => navigate(`/admin/finance/invoices/${offer.converted_invoice_id}`)}>Zur Rechnung</button> : null}
      </div>

      {isDraft && validation && !validation.canFinalize ? (
        <div className="mb-5"><InfoBanner tone="warning" title="Für die Finalisierung fehlen noch Angaben">{validation.missing.join(' · ')}. <button className="underline" onClick={() => navigate(`/admin/finance/offers/${offer.id}/edit`)}>Im Editor ergänzen</button>.</InfoBanner></div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <PremiumOfferPreview doc={doc} />

          {summary?.accepted ? (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <SectionHeader
                  title={sigState.primaryLabel}
                  description={sigState.signatureCaptured ? 'Online-Annahme mit erfasster einfacher elektronischer Signatur.' : 'Online-Annahme ohne erfasste Unterschrift.'}
                />
                <StatusBadge label={sigState.primaryLabel} tone={sigState.primaryTone} />
              </div>

              {/* Independent, explicitly separated statuses: signature · certificate · confirmation email. */}
              <div className="mb-4 grid gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-[13px] sm:grid-cols-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Unterschrift</span>
                  <StatusBadge label={sigState.signatureStatusLabel} tone={sigState.signatureCaptured ? 'success' : 'warning'} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Signierter Nachweis</span>
                  <span className="flex items-center gap-1.5">
                    <StatusBadge label={certState.label} tone={certState.tone} />
                    {certState.canRetry ? <button onClick={() => void retryOffer('signed_offer_certificate_generate')} className="text-[11px] text-gray-700 underline">Erneut</button> : null}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Bestätigung</span>
                  <span className="flex items-center gap-1.5">
                    <StatusBadge label={confirmState.label} tone={confirmState.tone} />
                    {confirmState.canRetry ? <button onClick={() => void retryOffer('signed_offer_confirmation_email')} className="text-[11px] text-gray-700 underline">Erneut</button> : null}
                  </span>
                </div>
              </div>

              {/* Signed certificate document: preview / download / metadata once generated. */}
              {summary.certificate ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-[13px]">
                  <div>
                    <p className="font-medium text-emerald-900">Annahmebestätigung verfügbar</p>
                    <p className="text-[12px] text-emerald-700/80">
                      {summary.certificate.document_number ?? '—'} · v{summary.certificate.version ?? '—'}
                      {summary.certificate.generated_at ? ` · ${formatDateDe(summary.certificate.generated_at)}` : ''}
                    </p>
                  </div>
                  {summary.certificate.storage_path ? (
                    <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadStored(summary.certificate!.storage_path!)} loading={busy === 'stored'}>Nachweis öffnen</Button>
                  ) : null}
                </div>
              ) : certState.state === 'failed' ? (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3 text-[13px]">
                  <span className="text-red-800">Die Annahmebestätigung konnte nicht erzeugt werden.</span>
                  <button onClick={() => void retryOffer('signed_offer_certificate_generate')} className="text-[12px] font-medium text-red-800 underline">Erneut versuchen</button>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <dl className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">Unterschrieben von</dt><dd className="text-gray-800">{summary.signer_name ?? '—'}</dd></div>
                  {summary.signer_company ? <div className="flex justify-between gap-4"><dt className="text-gray-400">Unternehmen</dt><dd className="text-gray-800">{summary.signer_company}</dd></div> : null}
                  {summary.signer_role ? <div className="flex justify-between gap-4"><dt className="text-gray-400">Rolle</dt><dd className="text-gray-800">{summary.signer_role}</dd></div> : null}
                  {summary.signer_email ? <div className="flex justify-between gap-4"><dt className="text-gray-400">E-Mail</dt><dd className="text-gray-800">{summary.signer_email}</dd></div> : null}
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">Zeitpunkt</dt><dd className="text-gray-800">{formatDateDe(summary.accepted_at ?? undefined)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">Signaturniveau</dt><dd className="text-gray-800">{signatureLevelLabel(summary.signature_level)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">Betrag</dt><dd className="tabular-nums font-semibold text-gray-900">{formatCents(summary.accepted_gross_cents ?? 0, summary.currency ?? 'EUR')}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-400">Version / Hash</dt><dd className="text-gray-600">v{summary.document_version ?? '—'} · {summary.source_hash ? summary.source_hash.slice(0, 12) + '…' : '—'}</dd></div>
                  {summary.signature_sha256 ? <div className="flex justify-between gap-4"><dt className="text-gray-400">Signatur-SHA-256</dt><dd className="font-mono text-[11px] text-gray-600">{summary.signature_sha256.slice(0, 16)}…</dd></div> : null}
                </dl>
                <div>
                  {summary.signature_storage_path ? (
                    <div className="mb-3">
                      <p className="mb-1.5 text-[12px] font-medium text-gray-500">Erfasste Unterschrift</p>
                      <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-gray-200 bg-white p-3">
                        {sigPreview.loading ? (
                          <span className="text-[12px] text-gray-400">Wird geladen…</span>
                        ) : sigPreview.url ? (
                          <img
                            src={sigPreview.url}
                            alt="Erfasste Unterschrift"
                            className="max-h-32 w-auto max-w-full object-contain"
                            onError={() => setSigPreview({ url: null, loading: false, error: true })}
                          />
                        ) : (
                          <button onClick={() => summary.signature_storage_path && void loadSignaturePreview(summary.signature_storage_path)} className="text-[12px] text-gray-500 underline">
                            {sigPreview.error ? 'Vorschau abgelaufen — erneut laden' : 'Unterschrift laden'}
                          </button>
                        )}
                      </div>
                      <button onClick={() => void openSignature(summary.signature_storage_path!)} className="mt-2 text-[12px] text-gray-500 underline">In neuem Tab öffnen</button>
                    </div>
                  ) : null}
                  {summary.invoice ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-[13px]">
                      <div className="flex items-center justify-between"><span className="text-gray-500">Rechnung</span><StatusBadge label={summary.invoice.status} tone={summary.invoice.status === 'draft' ? 'warning' : 'success'} /></div>
                      <p className="mt-1 text-gray-700">{summary.invoice.invoice_number ?? 'Entwurf'} · {formatCents(summary.invoice.gross_total_cents, summary.currency ?? 'EUR')}</p>
                      <button onClick={() => navigate(`/admin/finance/invoices/${summary.invoice!.id}`)} className="mt-1 text-[12px] text-gray-700 underline">Rechnung öffnen</button>
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-400">Noch keine Rechnung erstellt.</p>
                  )}
                  {summary.automation_jobs.length ? (
                    <ul className="mt-3 space-y-1.5 text-[12px]">
                      {summary.automation_jobs.map((j, i) => (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span className="text-gray-500">
                            {jobLabel(j.job_type)}
                            {/* Provider message id lives in a subtle technical-detail area, never prominent. */}
                            {j.provider_message_id ? <span className="ml-1.5 font-mono text-[10px] text-gray-300" title={j.provider_message_id}>#{j.provider_message_id.slice(0, 6)}</span> : null}
                          </span>
                          <span className="flex items-center gap-2">
                            <StatusBadge label={j.status} tone={jobTone(j.status)} />
                            {j.status === 'failed' ? <button onClick={() => void retryJob(j)} className="text-[11px] text-gray-700 underline">Erneut versuchen</button> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {events.length > 0 ? (
            <Card className="p-6">
              <SectionHeader title="Annahme-Historie" description="Online-Annahme / einfache elektronische Signatur — keine qualifizierte Signatur." />
              <ul className="space-y-3">{events.map((e) => (
                <li key={e.id} className="rounded-xl border border-gray-100 p-3 text-[13px]">
                  <div className="flex items-center justify-between">
                    <StatusBadge label={e.decision === 'accepted' ? 'Angenommen' : 'Abgelehnt'} tone={e.decision === 'accepted' ? 'success' : 'danger'} />
                    <span className="text-gray-400">{formatDateDe(e.created_at)}</span>
                  </div>
                  <p className="mt-2 text-gray-700">{e.signer_name}{e.signer_company ? ` · ${e.signer_company}` : ''}</p>
                  {e.comment ? <p className="mt-1 text-gray-500">„{e.comment}"</p> : null}
                  <p className="mt-1 text-[11px] text-gray-400">Version {e.document_version ?? '—'} · Quell-Hash {e.source_hash ? e.source_hash.slice(0, 12) + '…' : '—'}</p>
                </li>
              ))}</ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="p-6">
            <SectionHeader title="Summen" />
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Netto</dt><dd className="tabular-nums">{formatCents(offer.net_total_cents, offer.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums">{formatCents(offer.vat_total_cents, offer.currency)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5"><dt className="font-semibold text-gray-950">Gesamt brutto</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(offer.gross_total_cents, offer.currency)}</dd></div>
            </dl>
            {!isDraft && offer.status !== 'converted' && offer.status !== 'cancelled' ? (
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
                {['finalized', 'sent', 'viewed'].includes(offer.status) ? <Button variant="ghost" icon={XCircle} onClick={() => setConfirmReject(true)}>Als abgelehnt markieren</Button> : null}
                <Button variant="ghost" onClick={() => setConfirmCancel(true)}>Angebot stornieren</Button>
              </div>
            ) : null}
            <p className="mt-4 text-[12px] leading-relaxed text-gray-400">Angenommene Angebote werden zu einem Rechnungsentwurf. Rechnungen werden nie automatisch gestellt.</p>
          </Card>

          {docs.length > 0 ? (
            <Card className="p-6">
              <SectionHeader title="Erzeugte Dokumente" />
              <ul className="space-y-2">{docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-[13px]">
                  <span className="text-gray-700">v{d.version} · {formatDateDe(d.generated_at)} {d.status === 'finalized' ? <span className="ml-1 text-[11px] text-emerald-600">final</span> : null}</span>
                  {d.pdf_storage_path ? <button className="text-gray-500 hover:text-gray-950" onClick={() => downloadStored(d.pdf_storage_path as string)} disabled={busy === 'stored'}><Download size={15} /></button> : null}
                </li>
              ))}</ul>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog open={confirmCancel} onClose={() => setConfirmCancel(false)} tone="danger" title="Angebot stornieren?"
        message="Das Angebot wird storniert und bleibt zur Historie erhalten." confirmLabel="Stornieren"
        onConfirm={async () => { setConfirmCancel(false); const { error: e } = await setOfferStatus(offer.id, 'cancelled'); if (e) toast.error('Storno fehlgeschlagen', e); else { toast.success('Angebot storniert'); void load(); } }} />
      <ConfirmDialog open={confirmReject} onClose={() => setConfirmReject(false)} title="Als abgelehnt markieren?"
        message="Markiert das Angebot als vom Kunden abgelehnt." confirmLabel="Abgelehnt"
        onConfirm={async () => { setConfirmReject(false); const { error: e } = await setOfferStatus(offer.id, 'rejected'); if (e) toast.error('Fehlgeschlagen', e); else { toast.success('Als abgelehnt markiert'); void load(); } }} />
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} tone="danger" title="Entwurf löschen?"
        message="Dieser Angebotsentwurf wird unwiderruflich gelöscht. Nur möglich, solange keine Version finalisiert und kein Link erstellt wurde." confirmLabel="Löschen"
        onConfirm={async () => { setConfirmDelete(false); const { error: e } = await deleteOfferDraft(offer.id); if (e) toast.error('Löschen fehlgeschlagen', e); else { toast.success('Entwurf gelöscht'); navigate('/admin/finance/offers'); } }} />

      <PremiumPdfPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        render={renderPreview}
        filename={documentFilename(doc)}
        title={isDraft ? 'Vorschau (Entwurf)' : `Vorschau · ${offer.offer_number ?? ''}`}
        description={isDraft ? 'Entwurf — noch nicht finalisiert.' : 'Finalisiertes Angebot aus dem unveränderlichen Snapshot.'}
      />

      {sendOpen ? (
        <SendOfferDialog
          offer={offer}
          documentId={docs[0]?.id ?? null}
          validDays={settings?.default_offer_validity_days ?? 30}
          sellerName={settings?.legal_name ?? entity?.display_name ?? 'Cogniiq'}
          emailJob={offerEmailJob}
          onClose={() => setSendOpen(false)}
          onSent={() => { void load({ silent: true }); }}
        />
      ) : null}
    </>
  );
}
