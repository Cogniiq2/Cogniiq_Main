import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Archive, CheckCircle2, FileSignature, FileText, Mail, MapPin, Pencil, Phone, RotateCcw, Trash2,
  Wallet,
} from 'lucide-react';

import {
  Button, ConfirmDialog, DataTable, DefinitionGrid, ErrorState, HeaderMeta, LinkButton, Panel,
  PanelLink, SectionNav, Select, StatBand, StatBandSkeleton, StatusBadge, TableSkeleton, Timeline,
  WorkspaceHeader, useToast, type Column, type StatItem,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  loadCustomerDetail, setCustomerStatus, archiveCustomer, unarchiveCustomer, deleteCustomer,
} from '@/lib/ownerFinance/customersApi';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import { formatOfferAmount } from '@/lib/ownerFinance/offerAmountDisplay';
import {
  customerStatusLabel, customerStatusTone, customerDisplayName, offerStatusLabel, offerStatusTone,
} from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import { CustomerTaskChecklist } from '@/components/finance/CustomerTaskChecklist';
import { CustomerProjectPanel } from '@/components/finance/CustomerProjectPanel';
import { CustomerServicesPanel } from '@/components/services/CustomerServicesPanel';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';
import { invoiceStatusTone } from '@/pages/owner/ownerUi';
import type {
  OwnerCustomerDetail, OwnerCustomerOfferRef, OwnerCustomerInvoiceRef, OwnerCustomerStatus,
} from '@/lib/ownerFinance/types';

/**
 * Customer 360 — one customer, seen from every side the business has on them.
 *
 * The page is a single document with a sticky section switch rather than a stack of
 * unlabelled cards: identity and money first, then what Cogniiq delivers, then the
 * commercial record, then the work, then the history. Sections are real anchors, so
 * they stay linkable and nothing is hidden behind a tab.
 *
 * It composes; it does not recompute. Every figure in the summary band is a sum over
 * rows owner_customer_detail already returned, and the two that could be confused —
 * what was invoiced and what was actually collected — are labelled apart and never
 * added together. No finance logic is duplicated here, and no mutation reaches the
 * database except through the same owner-gated RPCs as before.
 */

const invoiceStatusLabel: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};

/**
 * Turns the server's blocker counts into the sentence shown in the delete dialog.
 * Only non-zero reasons are named, so the owner reads what actually stands in the
 * way rather than a list of zeroes.
 */
function blockerSentence(b: OwnerCustomerDetail['delete_blockers']): string {
  const parts: string[] = [];
  if (b.issued_invoices > 0) parts.push(`${b.issued_invoices} ausgestellte Rechnung${b.issued_invoices === 1 ? '' : 'en'}`);
  if (b.payments > 0) parts.push(`${b.payments} Zahlung${b.payments === 1 ? '' : 'en'}`);
  if (b.finalized_offers > 0) parts.push(`${b.finalized_offers} verbindliche${b.finalized_offers === 1 ? 's' : ''} Angebot${b.finalized_offers === 1 ? '' : 'e'}`);
  if (b.subscriptions > 0) parts.push(`${b.subscriptions} Abonnement${b.subscriptions === 1 ? '' : 's'}`);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`;
}

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* Reported by the services panel so the edit dialog can show which services are already
     provisioned — and refuse to offer them for removal there. */
  const [activeServices, setActiveServices] = useState<ServiceKey[]>([]);
  /* Bumped after the edit dialog provisions a service, so the panel reloads its summaries. */
  const [servicesVersion, setServicesVersion] = useState(0);

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

  /**
   * Money, kept honest.
   *
   * `invoiced` counts every invoice that was actually issued and not cancelled.
   * `collected` counts recorded inbound payments — the only figure that means the
   * customer paid. `open` is what those issued invoices still owe. They are three
   * different facts and the band labels them as three different facts.
   */
  const money = useMemo(() => {
    const invoices = detail?.invoices ?? [];
    const live = invoices.filter((i) => !i.cancelled_at && i.status !== 'draft');
    const invoiced = live.reduce((sum, i) => sum + i.gross_total_cents, 0);
    const open = live
      .filter((i) => ['issued', 'partially_paid', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + Math.max(0, i.gross_total_cents - i.amount_paid_cents), 0);
    const collected = (detail?.payments ?? [])
      .filter((p) => p.direction === 'inflow')
      .reduce((sum, p) => sum + p.amount_cents, 0);
    const cancelled = invoices.filter((i) => i.cancelled_at).length;
    return { invoiced, open, collected, cancelled, liveCount: live.length };
  }, [detail]);

  const setStatus = async (status: OwnerCustomerStatus) => {
    if (!customerId) return;
    const { error: err } = await setCustomerStatus(customerId, status);
    if (err) { toast.error('Statusänderung fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    await load();
  };

  const confirmComplete = async () => { await setStatus('completed'); setCompleteOpen(false); toast.success('Kunde abgeschlossen', 'Der Kunde wurde als abgeschlossen markiert. Alle Aufgaben und Angebote bleiben erhalten.'); };

  const confirmArchive = async () => {
    if (!customerId) return;
    const { error: err } = await archiveCustomer(customerId);
    setArchiveOpen(false);
    if (err) { toast.error('Archivieren fehlgeschlagen', err); return; }
    await load();
    toast.success('Kunde archiviert', 'Rechnungen, Angebote und Aufgaben bleiben unverändert erhalten.');
  };

  const restore = async () => {
    if (!customerId) return;
    const { error: err } = await unarchiveCustomer(customerId);
    if (err) { toast.error('Wiederherstellen fehlgeschlagen', err); return; }
    await load();
  };

  /*
    Permanent deletion. The server re-evaluates the blockers and the ON DELETE
    RESTRICT foreign keys refuse independently, so this can never remove
    accounting data even if the dialog was opened against stale counts.
  */
  const confirmDelete = async () => {
    if (!customerId) return;
    const { deleted, deletedDraftOffers, deletedDraftInvoices, error: err } = await deleteCustomer(customerId);
    setDeleteOpen(false);
    if (err || !deleted) { toast.error('Löschen nicht möglich', err ?? 'Unbekannter Fehler'); return; }
    const removed = [
      deletedDraftOffers > 0 ? `${deletedDraftOffers} Angebotsentwurf${deletedDraftOffers === 1 ? '' : 'e'}` : null,
      deletedDraftInvoices > 0 ? `${deletedDraftInvoices} Rechnungsentwurf${deletedDraftInvoices === 1 ? '' : 'e'}` : null,
    ].filter(Boolean).join(' und ');
    toast.success('Kunde gelöscht', removed ? `Mitgelöscht: ${removed}.` : undefined);
    navigate('/admin/finance/customers');
  };

  if (loading) {
    return (
      <>
        <WorkspaceHeader crumbs={[{ label: 'Kunden', to: '/admin/finance/customers' }, { label: 'Wird geladen …' }]} title="Kunde" />
        <div className="space-y-4">
          <StatBandSkeleton count={5} />
          <TableSkeleton rows={4} />
        </div>
      </>
    );
  }
  if (error || !detail) {
    return (
      <>
        <WorkspaceHeader crumbs={[{ label: 'Kunden', to: '/admin/finance/customers' }]} title="Kunde" />
        <ErrorState message={error ?? 'Kunde nicht gefunden'} onRetry={() => void load()} />
      </>
    );
  }

  const c = detail.customer;
  const name = customerDisplayName(c);
  const address = [c.street, [c.postal_code, c.city].filter(Boolean).join(' '), c.country_code]
    .filter(Boolean).join(', ');

  const stats: StatItem[] = [
    {
      key: 'collected',
      label: 'Tatsächlich bezahlt',
      value: formatCentsCurrencyDe(money.collected),
      hint: 'erfasste Zahlungseingänge dieses Kunden',
      lead: true,
      tone: money.collected > 0 ? 'positive' : 'neutral',
    },
    {
      key: 'invoiced',
      label: 'Fakturiert',
      value: formatCentsCurrencyDe(money.invoiced),
      hint: `${money.liveCount} gestellte Rechnungen${money.cancelled > 0 ? ` · ${money.cancelled} storniert` : ''}`,
    },
    {
      key: 'open',
      label: 'Noch offen',
      value: formatCentsCurrencyDe(money.open),
      hint: money.open > 0 ? 'aus gestellten Rechnungen' : 'nichts offen',
      tone: money.open > 0 ? 'attention' : 'neutral',
    },
    {
      key: 'offers',
      label: 'Angebote',
      value: String(detail.offers.length),
      hint: `${detail.offers.filter((o) => o.accepted_at).length} angenommen`,
    },
    {
      key: 'tasks',
      label: 'Offene Aufgaben',
      value: String(openTaskCount),
      hint: `${detail.tasks.filter((t) => t.status === 'completed').length} erledigt`,
      tone: openTaskCount > 0 ? 'attention' : 'neutral',
    },
  ];

  const offerColumns: Column<OwnerCustomerOfferRef>[] = [
    {
      key: 'offer',
      header: 'Angebot',
      render: (o) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--cq-fg)]">{o.offer_number ?? 'Entwurf'}</div>
          <div className="truncate text-[12px] text-[var(--cq-fg-subtle)]">{o.title ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} />
          {o.archived_at ? <StatusBadge label="Archiviert" tone="neutral" /> : null}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Betrag',
      align: 'right',
      render: (o) => <span className="font-medium text-[var(--cq-fg)]">{formatOfferAmount(o, o.currency, formatCentsCurrencyDe)}</span>,
    },
    {
      key: 'timeline',
      header: 'Verlauf',
      align: 'right',
      hideOnMobile: true,
      render: (o) => (
        <div className="text-[12px] leading-4 text-[var(--cq-fg-subtle)]">
          <div>Erstellt {formatDateDe(o.created_at)}</div>
          <div>
            {o.accepted_at ? `Angenommen ${formatDateDe(o.accepted_at)}`
              : o.sent_at ? `Versendet ${formatDateDe(o.sent_at)}`
              : o.valid_until ? `Gültig bis ${formatDateDe(o.valid_until)}`
              : 'Noch nicht versendet'}
          </div>
        </div>
      ),
    },
  ];

  const invoiceColumns: Column<OwnerCustomerInvoiceRef>[] = [
    {
      key: 'number',
      header: 'Rechnung',
      render: (i) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--cq-fg)]">{i.invoice_number ?? 'Entwurf'}</div>
          <div className="truncate text-[12px] text-[var(--cq-fg-subtle)]">
            {i.issue_date ? `Gestellt ${formatDateDe(i.issue_date)}` : 'Noch nicht gestellt'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={invoiceStatusLabel[i.status] ?? i.status} tone={invoiceStatusTone[i.status]} />
          {i.cancelled_at ? <StatusBadge label="Storno" tone="neutral" /> : null}
        </div>
      ),
    },
    {
      key: 'gross',
      header: 'Brutto',
      align: 'right',
      render: (i) => <span className="font-medium text-[var(--cq-fg)]">{formatCentsCurrencyDe(i.gross_total_cents, i.currency)}</span>,
    },
    {
      key: 'open',
      header: 'Offen',
      align: 'right',
      render: (i) => {
        const open = i.cancelled_at ? 0 : Math.max(0, i.gross_total_cents - i.amount_paid_cents);
        return (
          <span className={open > 0 ? 'font-medium text-amber-700' : 'text-[var(--cq-fg-subtle)]'}>
            {formatCentsCurrencyDe(open, i.currency)}
          </span>
        );
      },
    },
    {
      key: 'due',
      header: 'Fällig',
      align: 'right',
      hideOnMobile: true,
      render: (i) => <span className="text-[var(--cq-fg-subtle)]">{i.due_date ? formatDateDe(i.due_date) : '—'}</span>,
    },
  ];

  const sections = [
    { id: 'leistungen', label: 'Leistungen' },
    { id: 'angebote', label: 'Angebote', count: detail.offers.length },
    { id: 'rechnungen', label: 'Rechnungen', count: detail.invoices.length },
    { id: 'aufgaben', label: 'Aufgaben', count: openTaskCount },
    { id: 'projekt', label: 'Projekt' },
    { id: 'stammdaten', label: 'Stammdaten' },
  ];

  return (
    <>
      <WorkspaceHeader
        crumbs={[{ label: 'Kunden', to: '/admin/finance/customers' }, { label: name }]}
        title={name}
        status={<StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} />}
        meta={
          <>
            {c.email ? <HeaderMeta label="E-Mail">{c.email}</HeaderMeta> : null}
            {c.phone ? <HeaderMeta label="Telefon">{c.phone}</HeaderMeta> : null}
            {c.city ? <HeaderMeta label="Ort">{c.city}</HeaderMeta> : null}
            <HeaderMeta label="Kunde seit">{formatDateDe(c.created_at)}</HeaderMeta>
            <HeaderMeta label="Letzte Aktivität">{formatDateDe(c.last_activity_at)}</HeaderMeta>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Bearbeiten</Button>
            {c.status === 'completed' ? (
              <Button variant="secondary" icon={RotateCcw} onClick={() => void setStatus('active')}>Wieder öffnen</Button>
            ) : c.status !== 'archived' ? (
              <Button icon={CheckCircle2} onClick={() => setCompleteOpen(true)}>Abschließen</Button>
            ) : null}
            {c.status === 'archived' ? (
              <Button variant="secondary" icon={RotateCcw} onClick={() => void restore()}>Wiederherstellen</Button>
            ) : (
              <Button variant="ghost" icon={Archive} onClick={() => setArchiveOpen(true)}>Archivieren</Button>
            )}
            {/*
              Deletion is offered only when it is actually possible. A customer
              with protected financial records gets archiving instead — the
              button explains why rather than failing on click.
            */}
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => setDeleteOpen(true)}
              disabled={!detail.delete_blockers.deletable}
              title={
                detail.delete_blockers.deletable
                  ? undefined
                  : `Nicht löschbar: ${blockerSentence(detail.delete_blockers)}. Archivieren Sie den Kunden stattdessen.`
              }
            >
              Löschen
            </Button>
          </>
        }
      />

      <div className="mb-4"><StatBand items={stats} /></div>

      <SectionNav sections={sections} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {/* Services first: which Cogniiq services this customer receives, and how far each
              delivery has progressed, is the fastest read on the whole relationship. */}
          <section id="leistungen" className="scroll-mt-20">
            <CustomerServicesPanel
              key={servicesVersion}
              customerId={c.id}
              onServicesChanged={() => void load()}
              onLoaded={(services) => setActiveServices(services.filter((s) => s.state !== 'archived').map((s) => s.service_key))}
            />
          </section>

          <Panel
            id="angebote"
            className="scroll-mt-20"
            title="Angebote"
            description="Der kommerzielle Verlauf dieses Kunden"
            count={detail.offers.length}
            icon={FileSignature}
            action={<PanelLink to="/admin/finance/offers">Alle Angebote</PanelLink>}
            flush={detail.offers.length > 0}
          >
            {detail.offers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] leading-5 text-[var(--cq-fg-muted)]">Für diesen Kunden gibt es noch kein Angebot.</p>
                <div className="mt-3"><LinkButton to="/admin/finance/offers/new" icon={FileSignature}>Angebot erstellen</LinkButton></div>
              </div>
            ) : (
              <DataTable
                columns={offerColumns}
                rows={detail.offers}
                getRowKey={(o) => o.id}
                minWidth={640}
                density="compact"
                rowHref={(o) => `/admin/finance/offers/${o.id}`}
                onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
                mobileTitle={(o) => (
                  <div className="flex items-center gap-2">
                    <span>{o.offer_number ?? 'Entwurf'}</span>
                    <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} />
                  </div>
                )}
                mobileSubtitle={(o) => o.title ?? formatOfferAmount(o, o.currency, formatCentsCurrencyDe)}
              />
            )}
          </Panel>

          {/*
            Invoices belong on the customer, not only in the finance list: this is
            the view that shows the commercial relationship around one canonical
            record. Cancelled invoices stay visible — a Storno is part of the
            history, not its removal.
          */}
          <Panel
            id="rechnungen"
            className="scroll-mt-20"
            title="Rechnungen & Zahlungen"
            description="Stornierte Rechnungen bleiben sichtbar — ein Storno ist Teil der Historie"
            count={detail.invoices.length}
            icon={FileText}
            action={<PanelLink to="/admin/finance/invoices">Alle Rechnungen</PanelLink>}
            flush={detail.invoices.length > 0}
            footer={
              detail.payments.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12.5px] leading-5 text-[var(--cq-fg-muted)]">
                    {detail.payments.filter((p) => p.direction === 'inflow').length} erfasste Zahlungseingänge
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--cq-fg)]">
                    {formatCentsCurrencyDe(money.collected)} tatsächlich bezahlt
                  </span>
                </div>
              ) : undefined
            }
          >
            {detail.invoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] leading-5 text-[var(--cq-fg-muted)]">Für diesen Kunden gibt es noch keine Rechnung.</p>
                <div className="mt-3"><LinkButton to="/admin/finance/invoices" icon={Wallet}>Zu den Rechnungen</LinkButton></div>
              </div>
            ) : (
              <DataTable
                columns={invoiceColumns}
                rows={detail.invoices}
                getRowKey={(i) => i.id}
                minWidth={620}
                density="compact"
                rowHref={(i) => `/admin/finance/invoices/${i.id}`}
                onRowClick={(i) => navigate(`/admin/finance/invoices/${i.id}`)}
                mobileTitle={(i) => (
                  <div className="flex items-center gap-2">
                    <span>{i.invoice_number ?? 'Entwurf'}</span>
                    <StatusBadge label={invoiceStatusLabel[i.status] ?? i.status} tone={invoiceStatusTone[i.status]} />
                  </div>
                )}
                mobileSubtitle={(i) => formatCentsCurrencyDe(i.gross_total_cents, i.currency)}
              />
            )}
          </Panel>

          {/* The checklist owns its own header and "Aufgabe" action, so it sits in a
              bare panel — wrapping it in a titled one would name the section twice. */}
          <Panel id="aufgaben" className="scroll-mt-20">
            <CustomerTaskChecklist customerId={c.id} tasks={detail.tasks} onChanged={() => void load()} />
          </Panel>

          {/* Customer-VISIBLE project projection. Deliberately separate from the internal
              task checklist above: nothing edited there ever reaches the portal. */}
          <section id="projekt" className="scroll-mt-20">
            <CustomerProjectPanel
              ownerCustomerId={c.id}
              organizationId={c.organization_id}
              clientAccountId={c.client_account_id}
            />
          </section>
        </div>

        {/* Context column: identity, status, notes, history. */}
        <div className="space-y-4">
          <Panel id="stammdaten" className="scroll-mt-20" title="Stammdaten">
            <DefinitionGrid
              items={[
                { label: 'Firma', value: c.company || '—' },
                { label: 'Ansprechpartner', value: c.contact_name || '—' },
                {
                  label: 'E-Mail',
                  value: c.email ? (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
                      <Mail size={12} aria-hidden="true" />{c.email}
                    </a>
                  ) : '—',
                },
                {
                  label: 'Telefon',
                  value: c.phone ? (
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
                      <Phone size={12} aria-hidden="true" />{c.phone}
                    </a>
                  ) : '—',
                },
                {
                  label: 'Adresse',
                  value: address ? (
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />{address}
                    </span>
                  ) : '—',
                },
                { label: 'Portalzugang', value: c.organization_id ? 'Verknüpft' : 'Nicht verknüpft' },
                ...(c.completed_at ? [{ label: 'Abgeschlossen am', value: formatDateDe(c.completed_at) }] : []),
              ]}
            />
            <div className="mt-4">
              <Select
                id="cust-status"
                label="Status ändern"
                value={c.status}
                onChange={(v) => void setStatus(v as OwnerCustomerStatus)}
                options={[
                  { value: 'active', label: 'Aktiv' },
                  { value: 'waiting', label: 'Wartend' },
                  { value: 'completed', label: 'Abgeschlossen' },
                  { value: 'archived', label: 'Archiviert' },
                ]}
                hint="Rein operativ — Rechnungen, Zahlungen und Angebote bleiben unverändert."
              />
            </div>
          </Panel>

          {c.notes ? (
            <Panel title="Notiz">
              <p className="whitespace-pre-line text-[12.5px] leading-5 text-[var(--cq-fg-muted)] [overflow-wrap:anywhere]">{c.notes}</p>
            </Panel>
          ) : null}

          <Panel title="Aktivität" count={detail.activity.length}>
            {detail.activity.length === 0 ? (
              <p className="py-4 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">Noch keine Aktivität erfasst.</p>
            ) : (
              <Timeline
                items={detail.activity.map((a) => ({
                  id: a.id,
                  title: a.summary,
                  time: formatDateDe(a.created_at),
                }))}
              />
            )}
          </Panel>
        </div>
      </div>

      {entity ? (
        <CustomerFormDialog
          open={editOpen} onClose={() => setEditOpen(false)} entityId={entity.id}
          initial={{ id: c.id, company: c.company ?? '', contact_name: c.contact_name ?? '', email: c.email ?? '', phone: c.phone ?? '', street: c.street ?? '', postal_code: c.postal_code ?? '', city: c.city ?? '', notes: c.notes ?? '' }}
          existingServices={activeServices}
          onSaved={() => { setServicesVersion((v) => v + 1); void load(); }} />
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
        title="Kunde archivieren" confirmLabel="Kunde archivieren"
        message={
          <>
            <p>
              <span className="font-semibold text-[var(--cq-fg)]">{name}</span> wird aus der aktiven
              Kundenliste und aus den Auswahlfeldern im Finanzbereich ausgeblendet.
            </p>
            <p className="mt-2">
              Nichts wird gelöscht: Rechnungen, Zahlungen, Angebote und Aufgaben bleiben unverändert
              erhalten, und Sie können den Kunden jederzeit wiederherstellen.
            </p>
          </>
        } />

      {/*
        The one genuinely destructive action in this workspace. It names the
        customer, states that it cannot be undone, and lists the drafts that
        disappear with it — nothing else can be reached from here.
      */}
      <ConfirmDialog
        open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete}
        tone="danger" title="Kunde löschen?" confirmLabel="Kunde löschen"
        message={
          <>
            <p>
              <span className="font-semibold text-[var(--cq-fg)]">{name}</span> wird dauerhaft gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            {detail.delete_blockers.draft_invoices + detail.delete_blockers.draft_offers > 0 ? (
              <p className="mt-2">
                Mitgelöscht werden{' '}
                {[
                  detail.delete_blockers.draft_invoices > 0
                    ? `${detail.delete_blockers.draft_invoices} Rechnungsentwurf${detail.delete_blockers.draft_invoices === 1 ? '' : 'e'}`
                    : null,
                  detail.delete_blockers.draft_offers > 0
                    ? `${detail.delete_blockers.draft_offers} Angebotsentwurf${detail.delete_blockers.draft_offers === 1 ? '' : 'e'}`
                    : null,
                ].filter(Boolean).join(' und ')}
                .
              </p>
            ) : null}
            {/*
              Deleting a customer cascades into its service engagements — the whole onboarding
              record: every completed step, every piece of evidence, every note and the full
              activity history. That is not visible from the offer/invoice counts the server
              returns, so the dialog says it explicitly rather than letting the owner find out
              afterwards.
            */}
            {activeServices.length > 0 ? (
              <p className="mt-2 text-amber-700">
                Mitgelöscht wird außerdem das vollständige Onboarding von{' '}
                {activeServices.length === 1 ? 'einer Leistung' : `${activeServices.length} Leistungen`}
                {' '}— erledigte Schritte, Nachweise, Notizen und der gesamte Verlauf. Archivieren
                Sie den Kunden, wenn diese Historie erhalten bleiben soll.
              </p>
            ) : null}
            {detail.delete_blockers.portal_documents > 0 ? (
              <p className="mt-2 text-amber-700">
                Hinweis: {detail.delete_blockers.portal_documents} Kundendokument
                {detail.delete_blockers.portal_documents === 1 ? '' : 'e'} im Kundenportal bleiben
                bei der verknüpften Organisation bestehen.
              </p>
            ) : null}
          </>
        } />
    </>
  );
}

export default CustomerDetailPage;
