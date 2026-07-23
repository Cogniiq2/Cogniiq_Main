import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Eye, FileCheck2 } from 'lucide-react';

import {
  Button, Card, ErrorState, InfoBanner, KpiSkeletonGrid, Modal, PageHeader, SectionHeader,
  StatusBadge, Field, Select, useToast,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { invoiceStatusTone } from '@/pages/owner/ownerUi';
import { loadInvoiceDetail, loadDocumentSettings, loadGeneratedDocuments, signedDocumentUrl } from '@/lib/ownerFinance/offersApi';
import { issueOwnerInvoice, recordInvoicePayment } from '@/lib/ownerFinance/api';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { invoiceToDocument } from '@/lib/ownerFinance/buildTransactionalDoc';
import { renderTransactionalPdf, exportTransactionalPdf, validateTransactionalDocument, vatBreakdown } from '@/lib/ownerFinance/documents';
import { generateAndStoreDocument } from '@/lib/ownerFinance/generateDocument';
import { runFinanceExport } from '@/lib/ownerFinance/financeExportRunner';
import { invoiceExportTable, invoiceMetadataSheet, invoiceReportModel } from '@/lib/ownerFinance/exports/datasets';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import { formatDateDe, formatCentsCurrencyDe, formatBpPercentDe, type ExportFormat, type ExportMode, type ExportMeta } from '@/lib/ownerFinance/exports';
import { ExportMenu } from '@/components/finance/ExportMenu';
import type { OwnerInvoice, OwnerInvoiceLine, OwnerDocumentSettings, OwnerGeneratedDocument } from '@/lib/ownerFinance/types';

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<OwnerInvoice | null>(null);
  const [lines, setLines] = useState<OwnerInvoiceLine[]>([]);
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [settings, setSettings] = useState<OwnerDocumentSettings | null>(null);
  const [docs, setDocs] = useState<OwnerGeneratedDocument[]>([]);
  const [recipient, setRecipient] = useState<{ name: string; addressLines: string[]; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [includeIds, setIncludeIds] = useState(false);

  const load = useCallback(async () => {
    if (!invoiceId || !entity) return;
    setLoading(true);
    try {
      const [res, settingsRow, generated, clients] = await Promise.all([
        loadInvoiceDetail(invoiceId), loadDocumentSettings(entity.id).catch(() => null),
        loadGeneratedDocuments(entity.id, { type: 'owner_invoices', id: invoiceId }).catch(() => []),
        loadAdminClients().catch(() => []),
      ]);
      if (!res) { setError('Rechnung nicht gefunden'); return; }
      setInvoice(res.invoice); setLines(res.lines); setPayments(res.payments); setSettings(settingsRow); setDocs(generated);
      const c = clients.find((x) => x.organizationId === res.invoice.organization_id);
      setRecipient(c ? { name: c.account?.legal_name ?? c.organizationName, addressLines: (c.account?.address ?? '').split('\n').filter(Boolean), email: c.account?.primary_email ?? null } : null);
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [invoiceId, entity]);

  useEffect(() => { void load(); }, [load]);

  const doc = useMemo(() => (invoice ? invoiceToDocument(invoice, lines, settings, recipient, entity?.display_name ?? 'Cogniiq') : null), [invoice, lines, settings, recipient, entity]);
  const validation = useMemo(() => (doc ? validateTransactionalDocument(doc) : null), [doc]);
  const breakdown = useMemo(() => (doc ? vatBreakdown(doc.lines) : []), [doc]);
  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } finally { setBusy(null); } };

  const previewPdf = () => run('preview', async () => {
    if (!doc) return;
    const bytes = await renderTransactionalPdf(doc);
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }));
    window.open(url, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  const downloadPdf = () => run('download', async () => { if (doc) await exportTransactionalPdf(doc); });
  const generateStore = () => run('generate', async () => {
    if (!invoice || !doc || !entity) return;
    const res = await generateAndStoreDocument(entity.id, invoice.id, doc, { requireValid: invoice.status !== 'draft' });
    if (res.error) { toast.error('PDF konnte nicht erzeugt werden', res.blocked ? res.blocked.join(', ') : res.error); return; }
    toast.success('Rechnungs-PDF gespeichert', `Version ${res.version ?? 1}`); void load();
  });
  const issue = () => run('issue', async () => {
    if (!invoice) return;
    const { error: err } = await issueOwnerInvoice(invoice.id);
    if (err) { toast.error('Rechnung konnte nicht gestellt werden', err); return; }
    toast.success('Rechnung gestellt'); void load();
  });
  const copyPaymentInfo = async () => {
    const parts = [settings?.bank_account_holder ? `Kontoinhaber: ${settings.bank_account_holder}` : null, settings?.iban ? `IBAN: ${settings.iban}` : null, settings?.bic ? `BIC: ${settings.bic}` : null, invoice?.invoice_number ? `Verwendungszweck: ${invoice.invoice_number}` : null].filter(Boolean).join('\n');
    if (!parts) { toast.error('Keine Zahlungsinformationen', 'Bitte IBAN in den Dokumenteinstellungen hinterlegen.'); return; }
    try { await navigator.clipboard.writeText(parts); toast.success('Zahlungsinformationen kopiert'); } catch { toast.error('Kopieren fehlgeschlagen'); }
  };
  const downloadStored = (path: string) => run('stored', async () => {
    const { url, error: err } = await signedDocumentUrl(path);
    if (err || !url) { toast.error('Download fehlgeschlagen', err ?? 'Kein Link'); return; }
    window.open(url, '_blank', 'noopener');
  });
  const exportData = async (format: ExportFormat, mode: ExportMode) => {
    if (!entity || !invoice) return;
    const rows = [invoice];
    const meta: ExportMeta = { entityName: entity.display_name, valueBasis: 'actual', filtersLabel: invoice.invoice_number ?? 'Entwurf', mode };
    const spec = { entityId: entity.id, exportType: 'invoice', baseFilename: `Rechnung-${invoice.invoice_number ?? 'Entwurf'}`, meta, table: invoiceExportTable(rows, () => recipient?.name ?? '—') as never, metadataSheet: invoiceMetadataSheet(rows, meta), reportModel: invoiceReportModel(rows, meta, () => recipient?.name ?? '—'), jsonPayload: { invoice, lines }, snapshot: { id: invoice.id, gross: invoice.gross_total_cents }, counts: { invoices: 1 }, includeIds };
    try { const { warning } = await runFinanceExport(format, mode, spec); if (warning) toast.error('Hinweis', warning); else toast.success('Export erstellt', format.toUpperCase()); }
    catch (e: unknown) { toast.error('Export fehlgeschlagen', e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" /><KpiSkeletonGrid count={3} /></div>;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!invoice || !doc) return <ErrorState message="Rechnung nicht verfügbar" />;

  const open = invoice.gross_total_cents - invoice.amount_paid_cents;
  const isDraft = invoice.status === 'draft';

  return (
    <>
      <button onClick={() => navigate('/admin/finance/invoices')} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-950"><ArrowLeft size={15} /> Zurück zu Rechnungen</button>
      <PageHeader
        title={invoice.invoice_number ?? 'Rechnung (Entwurf)'}
        description={recipient?.name ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={Eye} onClick={previewPdf} loading={busy === 'preview'}>Vorschau</Button>
            <Button size="sm" variant="secondary" icon={Download} onClick={downloadPdf} loading={busy === 'download'}>PDF</Button>
            {!isDraft ? <Button size="sm" variant="secondary" icon={FileCheck2} onClick={generateStore} loading={busy === 'generate'}>PDF speichern</Button> : null}
            {isDraft ? <Button size="sm" icon={FileCheck2} onClick={issue} loading={busy === 'issue'}>Rechnung stellen</Button> : null}
            <ExportMenu onExport={exportData} formats={['csv', 'xlsx', 'pdf']} includeIds={includeIds} onIncludeIdsChange={setIncludeIds} />
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusBadge label={statusLabel[invoice.status] ?? invoice.status} tone={invoiceStatusTone[invoice.status]} />
        <span className="text-[13px] text-gray-500">Datum {formatDateDe(invoice.issue_date)} · Fällig {formatDateDe(invoice.due_date)}</span>
        {invoice.external_reference?.startsWith('Angebot') ? <span className="text-[13px] text-gray-400">aus {invoice.external_reference}</span> : null}
      </div>

      {isDraft && validation && validation.missing.length > 0 ? (
        <div className="mb-5"><InfoBanner tone="warning" title="Vor dem finalen PDF fehlen Pflichtangaben">{validation.missing.join(' · ')}. Ein finales Rechnungs-PDF wird erst nach Vervollständigung erzeugt (keine Zusicherung rechtlicher/steuerlicher Vollständigkeit).</InfoBanner></div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6">
            <SectionHeader title="Positionen" />
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400"><th className="py-2">Beschreibung</th><th className="py-2 text-right">Menge</th><th className="py-2 text-right">Einzelpreis</th><th className="py-2 text-right">USt</th><th className="py-2 text-right">Netto</th></tr></thead>
              <tbody>{lines.map((l) => (
                <tr key={l.id} className="border-b border-gray-50"><td className="py-2 text-gray-800">{l.description}</td><td className="py-2 text-right tabular-nums text-gray-500">{(l.quantity_milli / 1000).toLocaleString('de-DE')}</td><td className="py-2 text-right tabular-nums text-gray-600">{formatCents(l.unit_price_cents, invoice.currency)}</td><td className="py-2 text-right tabular-nums text-gray-500">{formatBpPercentDe(l.vat_rate_bp)}</td><td className="py-2 text-right tabular-nums font-medium text-gray-900">{formatCents(l.net_cents, invoice.currency)}</td></tr>
              ))}</tbody>
            </table></div>
            {breakdown.length > 0 ? (
              <div className="mt-4 border-t border-gray-100 pt-3 text-[13px] text-gray-500">
                {breakdown.map((b) => <div key={`${b.rateBp}-${b.vatTreatment}`} className="flex justify-between"><span>USt {formatBpPercentDe(b.rateBp)} auf {formatCentsCurrencyDe(b.netCents, invoice.currency)}</span><span className="tabular-nums">{formatCentsCurrencyDe(b.vatCents, invoice.currency)}</span></div>)}
              </div>
            ) : null}
            <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Netto</dt><dd className="tabular-nums">{formatCents(invoice.net_total_cents, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums">{formatCents(invoice.vat_total_cents, invoice.currency)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5"><dt className="font-semibold text-gray-950">Gesamt brutto</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(invoice.gross_total_cents, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Bezahlt</dt><dd className="tabular-nums text-gray-600">{formatCents(invoice.amount_paid_cents, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="font-medium text-gray-700">Offen</dt><dd className="tabular-nums font-semibold text-gray-950">{formatCents(open, invoice.currency)}</dd></div>
            </dl>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Zahlungen" action={['issued', 'partially_paid', 'overdue'].includes(invoice.status) ? <Button size="sm" variant="secondary" onClick={() => setPayOpen(true)}>Zahlung erfassen</Button> : undefined} />
            {payments.length === 0 ? <p className="text-[13px] text-gray-400">Noch keine Zahlungen erfasst.</p> : (
              <ul className="space-y-2">{payments.map((p) => (
                <li key={String(p.id)} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-[13px]"><span className="text-gray-600">{formatDateDe(String(p.payment_date ?? ''))} · {String(p.method ?? '')}</span><span className="tabular-nums font-medium text-gray-900">{formatCents(Number(p.amount_cents ?? 0), invoice.currency)}</span></li>
              ))}</ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-6">
            <SectionHeader title="Zahlungsinformationen" />
            <div className="space-y-1 text-[13px] text-gray-600">
              <p>{settings?.bank_account_holder ?? '—'}</p>
              <p className="tabular-nums">{settings?.iban ?? 'IBAN in Einstellungen hinterlegen'}</p>
              {settings?.bic ? <p className="tabular-nums">{settings.bic}</p> : null}
            </div>
            <Button className="mt-3" size="sm" variant="secondary" icon={Copy} onClick={copyPaymentInfo}>Kopieren</Button>
          </Card>

          {docs.length > 0 ? (
            <Card className="p-6">
              <SectionHeader title="Erzeugte Dokumente" />
              <ul className="space-y-2">{docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-[13px]"><span className="text-gray-700">v{d.version} · {formatDateDe(d.generated_at)} {d.status === 'finalized' ? <span className="ml-1 text-[11px] text-emerald-600">final</span> : null}</span>{d.pdf_storage_path ? <button className="text-gray-500 hover:text-gray-950" onClick={() => downloadStored(d.pdf_storage_path as string)} disabled={busy === 'stored'}><Download size={15} /></button> : null}</li>
              ))}</ul>
            </Card>
          ) : null}
        </div>
      </div>

      <PaymentModal open={payOpen} invoice={invoice} onClose={() => setPayOpen(false)}
        onDone={() => { setPayOpen(false); toast.success('Zahlung erfasst'); void load(); }}
        onError={(m) => toast.error('Zahlung fehlgeschlagen', m)} />
    </>
  );
}

function PaymentModal({ open, invoice, onClose, onDone, onError }: { open: boolean; invoice: OwnerInvoice; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const outstanding = invoice.gross_total_cents - invoice.amount_paid_cents;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('bank_transfer');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (open) { setAmount((outstanding / 100).toFixed(2).replace('.', ',')); setErr(null); setMethod('bank_transfer'); setDate(new Date().toISOString().slice(0, 10)); } }, [open, outstanding]);

  const submit = async () => {
    const p = parseAmountToCents(amount);
    if ('error' in p) { setErr('Bitte gültigen Betrag eingeben.'); return; }
    const cents = p.cents;
    if (cents == null || cents <= 0) { setErr('Bitte gültigen Betrag eingeben.'); return; }
    if (cents > outstanding) { setErr(`Betrag übersteigt den offenen Betrag (${formatCents(outstanding)}).`); return; }
    setBusy(true);
    const { error } = await recordInvoicePayment(invoice.id, cents, date, { method, reference: null, note: null });
    setBusy(false);
    if (error) { onError(error); return; }
    onDone();
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Zahlung erfassen" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void submit()} loading={busy}>Buchen</Button></>}>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3"><span className="text-[13px] text-gray-500">Offener Betrag</span><span className="text-base font-semibold tabular-nums text-gray-950">{formatCents(outstanding)}</span></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="amt" label="Betrag" prefix="€" value={amount} onChange={setAmount} inputMode="decimal" autoFocus />
        <Field id="dt" label="Datum" type="date" value={date} onChange={setDate} />
        <Select id="m" label="Zahlungsart" value={method} onChange={setMethod} options={[{ value: 'bank_transfer', label: 'Überweisung' }, { value: 'card', label: 'Karte' }, { value: 'cash', label: 'Bar' }, { value: 'paypal', label: 'PayPal' }, { value: 'other', label: 'Sonstige' }]} />
      </div>
      {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : null}
    </Modal>
  );
}
