import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Eye, FileCheck2, GitBranch, Link2, XCircle } from 'lucide-react';

import {
  Button, Card, ConfirmDialog, ErrorState, InfoBanner, PageHeader, SectionHeader, StatusBadge,
  KpiSkeletonGrid, useToast,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { offerStatusTone } from '@/pages/owner/OffersPage';
import {
  loadOffer, finalizeOffer, createOfferRevision, setOfferStatus, convertOfferToInvoiceDraft,
  createOfferAccessToken, loadOfferAcceptanceEvents, loadGeneratedDocuments, signedDocumentUrl,
} from '@/lib/ownerFinance/offersApi';
import { loadDocumentSettings } from '@/lib/ownerFinance/offersApi';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { offerToDocument } from '@/lib/ownerFinance/buildTransactionalDoc';
import { renderTransactionalPdf, exportTransactionalPdf, validateTransactionalDocument } from '@/lib/ownerFinance/documents';
import { generateAndStoreDocument } from '@/lib/ownerFinance/generateDocument';
import { formatCents } from '@/lib/clientPlatform/validation';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { OwnerOffer, OwnerOfferLine, OwnerDocumentSettings, OwnerOfferAcceptanceEvent, OwnerGeneratedDocument } from '@/lib/ownerFinance/types';

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', finalized: 'Finalisiert', sent: 'Versendet', viewed: 'Angesehen',
  accepted: 'Angenommen', rejected: 'Abgelehnt', expired: 'Abgelaufen', cancelled: 'Storniert', converted: 'Umgewandelt',
};

export function OfferDetailPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<OwnerOffer | null>(null);
  const [lines, setLines] = useState<OwnerOfferLine[]>([]);
  const [settings, setSettings] = useState<OwnerDocumentSettings | null>(null);
  const [events, setEvents] = useState<OwnerOfferAcceptanceEvent[]>([]);
  const [docs, setDocs] = useState<OwnerGeneratedDocument[]>([]);
  const [recipient, setRecipient] = useState<{ name: string; addressLines: string[]; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const load = useCallback(async () => {
    if (!offerId || !entity) return;
    setLoading(true);
    try {
      const [res, settingsRow, evts, generated, clients] = await Promise.all([
        loadOffer(offerId), loadDocumentSettings(entity.id).catch(() => null),
        loadOfferAcceptanceEvents(offerId).catch(() => []),
        loadGeneratedDocuments(entity.id, { type: 'owner_offers', id: offerId }).catch(() => []),
        loadAdminClients().catch(() => []),
      ]);
      if (!res) { setError('Angebot nicht gefunden'); return; }
      setOffer(res.offer); setLines(res.lines); setSettings(settingsRow); setEvents(evts); setDocs(generated);
      const c = clients.find((x) => x.organizationId === res.offer.organization_id);
      setRecipient(c ? { name: c.account?.legal_name ?? c.organizationName, addressLines: (c.account?.address ?? '').split('\n').filter(Boolean), email: c.account?.primary_email ?? null } : null);
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [offerId, entity]);

  useEffect(() => { void load(); }, [load]);

  const doc = useMemo(() => (offer ? offerToDocument(offer, lines, settings, recipient, entity?.display_name ?? 'Cogniiq') : null), [offer, lines, settings, recipient, entity]);
  const validation = useMemo(() => (doc ? validateTransactionalDocument(doc) : null), [doc]);

  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } finally { setBusy(null); } };

  const previewPdf = () => run('preview', async () => {
    if (!doc) return;
    const bytes = await renderTransactionalPdf(doc);
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });

  const downloadPdf = () => run('download', async () => { if (doc) await exportTransactionalPdf(doc); });

  const finalize = () => run('finalize', async () => {
    if (!offer) return;
    const { error: err, offerNumber } = await finalizeOffer(offer.id);
    if (err) { toast.error('Finalisierung fehlgeschlagen', err); return; }
    toast.success('Angebot finalisiert', `Nummer ${offerNumber ?? ''} vergeben.`);
    void load();
  });

  const generateStore = () => run('generate', async () => {
    if (!offer || !doc || !entity) return;
    const res = await generateAndStoreDocument(entity.id, offer.id, doc);
    if (res.error) { toast.error('PDF konnte nicht gespeichert werden', res.error); return; }
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
    toast.success('Revision erstellt'); navigate(`/admin/finance/offers/${id}`);
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

  const isDraft = offer.status === 'draft';
  const canConvert = offer.status === 'accepted';

  return (
    <>
      <button onClick={() => navigate('/admin/finance/offers')} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-950"><ArrowLeft size={15} /> Zurück zu Angeboten</button>
      <PageHeader
        title={offer.offer_number ?? 'Angebot (Entwurf)'}
        description={offer.title ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={Eye} onClick={previewPdf} loading={busy === 'preview'}>Vorschau</Button>
            <Button size="sm" variant="secondary" icon={Download} onClick={downloadPdf} loading={busy === 'download'}>PDF</Button>
            {isDraft ? <Button size="sm" icon={FileCheck2} onClick={finalize} loading={busy === 'finalize'}>Finalisieren</Button> : null}
            {!isDraft ? <Button size="sm" variant="secondary" icon={FileCheck2} onClick={generateStore} loading={busy === 'generate'}>PDF speichern</Button> : null}
            {!isDraft ? <Button size="sm" variant="secondary" icon={Link2} onClick={createLink} loading={busy === 'link'}>Sicherer Link</Button> : null}
            {canConvert ? <Button size="sm" icon={Copy} onClick={convert} loading={busy === 'convert'}>Rechnungsentwurf erstellen</Button> : null}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusBadge label={statusLabel[offer.status] ?? offer.status} tone={offerStatusTone[offer.status]} />
        <span className="text-[13px] text-gray-500">Gültig bis {formatDateDe(offer.valid_until)}</span>
        {offer.converted_invoice_id ? <button className="text-[13px] text-gray-700 underline" onClick={() => navigate(`/admin/finance/invoices/${offer.converted_invoice_id}`)}>Zur Rechnung</button> : null}
      </div>

      {isDraft && validation && validation.missing.length > 0 ? (
        <div className="mb-5"><InfoBanner tone="warning" title="Fehlende Angaben für ein vollständiges Dokument">{validation.missing.join(' · ')}. Keine Zusicherung rechtlicher Vollständigkeit.</InfoBanner></div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6">
            <SectionHeader title="Positionen" />
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                <th className="py-2">Beschreibung</th><th className="py-2 text-right">Menge</th><th className="py-2 text-right">Einzelpreis</th><th className="py-2 text-right">USt</th><th className="py-2 text-right">Netto</th>
              </tr></thead>
              <tbody>{lines.map((l) => (
                <tr key={l.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-800">{l.description}{l.is_optional ? <span className="ml-2 text-[11px] text-gray-400">optional</span> : null}</td>
                  <td className="py-2 text-right tabular-nums text-gray-500">{(l.quantity_milli / 1000).toLocaleString('de-DE')} {l.unit}</td>
                  <td className="py-2 text-right tabular-nums text-gray-600">{formatCents(l.unit_price_cents, offer.currency)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-500">{(l.vat_rate_bp / 100).toLocaleString('de-DE')} %</td>
                  <td className="py-2 text-right tabular-nums font-medium text-gray-900">{formatCents(l.net_cents, offer.currency)}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Netto</dt><dd className="tabular-nums">{formatCents(offer.net_total_cents, offer.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums">{formatCents(offer.vat_total_cents, offer.currency)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5"><dt className="font-semibold text-gray-950">Gesamt brutto</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(offer.gross_total_cents, offer.currency)}</dd></div>
            </dl>
          </Card>

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
            <SectionHeader title="Aktionen" />
            <div className="flex flex-col gap-2">
              {!isDraft && offer.status !== 'converted' && offer.status !== 'cancelled' ? (
                <>
                  <Button variant="secondary" icon={GitBranch} onClick={revision} loading={busy === 'revision'}>Revision erstellen</Button>
                  {['finalized', 'sent', 'viewed'].includes(offer.status) ? <Button variant="ghost" icon={XCircle} onClick={() => setConfirmReject(true)}>Als abgelehnt markieren</Button> : null}
                  <Button variant="ghost" onClick={() => setConfirmCancel(true)}>Angebot stornieren</Button>
                </>
              ) : null}
            </div>
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
    </>
  );
}
