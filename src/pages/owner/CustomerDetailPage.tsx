import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, CheckCircle2, RotateCcw, Archive } from 'lucide-react';

import {
  Button, Card, DataTable, ErrorState, PageHeader, Select, StatusBadge, ConfirmDialog,
  TableSkeleton, useToast, type Column,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadCustomerDetail, setCustomerStatus } from '@/lib/ownerFinance/customersApi';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import {
  customerStatusLabel, customerStatusTone, customerDisplayName, offerStatusLabel, offerStatusTone,
} from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import { CustomerTaskChecklist } from '@/components/finance/CustomerTaskChecklist';
import type { OwnerCustomerDetail, OwnerCustomerOfferRef, OwnerCustomerStatus } from '@/lib/ownerFinance/types';

// Dedicated customer detail workspace: customer information, related offers, the task checklist and
// a sanitized activity timeline. The "als abgeschlossen markieren" action confirms first and warns
// when open tasks remain — completion never touches tasks, offers or history. German throughout.

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<OwnerCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      setDetail(await loadCustomerDetail(customerId));
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  const openTaskCount = useMemo(
    () => (detail?.tasks ?? []).filter((t) => t.status === 'open' || t.status === 'in_progress').length,
    [detail],
  );

  const setStatus = async (status: OwnerCustomerStatus) => {
    if (!customerId) return;
    const { error: err } = await setCustomerStatus(customerId, status);
    if (err) { toast.error('Statusänderung fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    await load();
  };

  const confirmComplete = async () => { await setStatus('completed'); setCompleteOpen(false); toast.success('Kunde abgeschlossen', 'Der Kunde wurde als abgeschlossen markiert. Alle Aufgaben und Angebote bleiben erhalten.'); };
  const confirmArchive = async () => { await setStatus('archived'); setArchiveOpen(false); toast.success('Kunde archiviert', 'Angebote und Aufgaben des Kunden bleiben unverändert.'); };

  if (loading) return <div className="space-y-4"><div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" /><TableSkeleton rows={4} /></div>;
  if (error || !detail) return <ErrorState message={error ?? 'Kunde nicht gefunden'} onRetry={() => void load()} />;

  const c = detail.customer;
  const name = customerDisplayName(c);

  const offerColumns: Column<OwnerCustomerOfferRef>[] = [
    { key: 'number', header: 'Nummer', render: (o) => <span className="font-semibold text-gray-950">{o.offer_number ?? 'Entwurf'}</span> },
    { key: 'title', header: 'Titel', render: (o) => <span className="text-gray-600">{o.title ?? '—'}</span> },
    { key: 'amount', header: 'Betrag', align: 'right', render: (o) => <span className="tabular-nums font-medium text-gray-900">{formatCentsCurrencyDe(o.gross_total_cents, o.currency)}</span> },
    { key: 'status', header: 'Status', render: (o) => (
      <div className="flex items-center gap-1.5">
        <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} />
        {o.archived_at ? <StatusBadge label="Archiviert" tone="neutral" /> : null}
      </div>
    ) },
    { key: 'created', header: 'Erstellt', render: (o) => <span className="text-gray-500">{formatDateDe(o.created_at)}</span>, hideOnMobile: true },
    { key: 'valid', header: 'Gültig bis', render: (o) => <span className="text-gray-500">{o.valid_until ? formatDateDe(o.valid_until) : '—'}</span>, hideOnMobile: true },
    { key: 'sent', header: 'Versendet', render: (o) => <span className="text-gray-500">{o.sent_at ? formatDateDe(o.sent_at) : '—'}</span>, hideOnMobile: true },
    { key: 'accepted', header: 'Angenommen', render: (o) => <span className="text-gray-500">{o.accepted_at ? formatDateDe(o.accepted_at) : '—'}</span>, hideOnMobile: true },
  ];

  return (
    <>
      <PageHeader
        title={name}
        breadcrumb={<button onClick={() => navigate('/admin/finance/customers')} className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-900"><ArrowLeft size={14} /> Kunden &amp; Aufgaben</button>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Bearbeiten</Button>
            {c.status === 'completed' ? (
              <Button variant="secondary" icon={RotateCcw} onClick={() => void setStatus('active')}>Wieder öffnen</Button>
            ) : (
              <Button icon={CheckCircle2} onClick={() => setCompleteOpen(true)}>Als abgeschlossen markieren</Button>
            )}
            {c.status === 'archived' ? (
              <Button variant="secondary" icon={RotateCcw} onClick={() => void setStatus('active')}>Wiederherstellen</Button>
            ) : (
              <Button variant="ghost" icon={Archive} onClick={() => setArchiveOpen(true)}>Archivieren</Button>
            )}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column: offers + tasks */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-950">Angebote</h3>
              <span className="text-[12px] text-gray-400">{detail.offers.length} gesamt</span>
            </div>
            {detail.offers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-[13px] text-gray-500">Noch keine Angebote für diesen Kunden.</div>
            ) : (
              <DataTable columns={offerColumns} rows={detail.offers} getRowKey={(o) => o.id} minWidth={760}
                onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
                mobileTitle={(o) => <div className="flex items-center gap-2"><span>{o.offer_number ?? 'Entwurf'}</span><StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /></div>}
                mobileSubtitle={(o) => formatCentsCurrencyDe(o.gross_total_cents, o.currency)} />
            )}
          </Card>

          <Card className="p-5">
            <CustomerTaskChecklist customerId={c.id} tasks={detail.tasks} onChanged={() => void load()} />
          </Card>
        </div>

        {/* Side column: info + status + activity */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-950">Kundendaten</h3>
              <StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} />
            </div>
            <dl className="space-y-2 text-[13px]">
              <Row label="Firma" value={c.company} />
              <Row label="Ansprechpartner" value={c.contact_name} />
              <Row label="E-Mail" value={c.email} />
              <Row label="Telefon" value={c.phone} />
              <Row label="Adresse" value={[c.street, [c.postal_code, c.city].filter(Boolean).join(' '), c.country_code].filter(Boolean).join(', ') || null} />
              <Row label="Angelegt" value={formatDateDe(c.created_at)} />
              <Row label="Letzte Aktivität" value={formatDateDe(c.last_activity_at)} />
              {c.completed_at ? <Row label="Abgeschlossen am" value={formatDateDe(c.completed_at)} /> : null}
            </dl>
            <div className="mt-4">
              <Select id="cust-status" label="Status ändern" value={c.status} onChange={(v) => void setStatus(v as OwnerCustomerStatus)}
                options={[
                  { value: 'active', label: 'Aktiv' },
                  { value: 'waiting', label: 'Wartend' },
                  { value: 'completed', label: 'Abgeschlossen' },
                  { value: 'archived', label: 'Archiviert' },
                ]} />
            </div>
            {c.notes ? <div className="mt-4 rounded-xl bg-gray-50 p-3 text-[12.5px] text-gray-600 [overflow-wrap:anywhere] whitespace-pre-line">{c.notes}</div> : null}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold text-gray-950">Aktivität</h3>
            {detail.activity.length === 0 ? (
              <p className="text-[13px] text-gray-400">Noch keine Aktivität.</p>
            ) : (
              <ul className="space-y-3">
                {detail.activity.map((a) => (
                  <li key={a.id} className="relative pl-4">
                    <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <div className="text-[13px] text-gray-700 [overflow-wrap:anywhere]">{a.summary}</div>
                    <div className="text-[11px] text-gray-400">{formatDateDe(a.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {entity ? (
        <CustomerFormDialog
          open={editOpen} onClose={() => setEditOpen(false)} entityId={entity.id}
          initial={{ id: c.id, company: c.company ?? '', contact_name: c.contact_name ?? '', email: c.email ?? '', phone: c.phone ?? '', street: c.street ?? '', postal_code: c.postal_code ?? '', city: c.city ?? '', notes: c.notes ?? '' }}
          onSaved={() => void load()} />
      ) : null}

      <ConfirmDialog
        open={completeOpen} onClose={() => setCompleteOpen(false)} onConfirm={confirmComplete}
        title="Kunde als abgeschlossen markieren"
        confirmLabel="Als abgeschlossen markieren"
        tone={openTaskCount > 0 ? 'danger' : 'default'}
        message={openTaskCount > 0
          ? `Dieser Kunde hat noch ${openTaskCount} offene Aufgabe${openTaskCount === 1 ? '' : 'n'}. Möchten Sie den Kunden trotzdem als abgeschlossen markieren? Offene Aufgaben, Angebote und die gesamte Historie bleiben unverändert erhalten.`
          : 'Der Kunde wird als abgeschlossen markiert. Alle Daten, Angebote, Aufgaben und die Historie bleiben erhalten. Sie können den Kunden jederzeit wieder öffnen.'} />

      <ConfirmDialog
        open={archiveOpen} onClose={() => setArchiveOpen(false)} onConfirm={confirmArchive}
        title="Kunde archivieren" confirmLabel="Archivieren"
        message="Der Kunde wird archiviert und bleibt über den Archiv-Filter erreichbar. Zugehörige Angebote und Aufgaben werden dabei NICHT automatisch archiviert." />
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-gray-400">{label}</dt>
      <dd className="min-w-0 text-right text-gray-800 [overflow-wrap:anywhere]">{value || '—'}</dd>
    </div>
  );
}

export default CustomerDetailPage;
