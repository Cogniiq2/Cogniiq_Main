import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Building2, CalendarClock, CheckCircle2, FileSignature, FileText,
  LayoutGrid, ListChecks, Mail, Receipt, Users, Wallet,
} from 'lucide-react';

import {
  Button, EmptyState, HeaderMeta, LinkButton, ListRow, Panel, PanelError, PanelLink, RowList,
  RowListSkeleton, ShareBar, Sparkline, StatBand, StatBandSkeleton, StatusBadge, Timeline,
  WorkspaceHeader, type StatItem,
} from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { loadActiveEntity, loadExpenses, loadInvoices, loadPeriodSummary, loadSubscriptions } from '@/lib/ownerFinance/api';
import { loadOffers } from '@/lib/ownerFinance/offersApi';
import { loadCustomers } from '@/lib/ownerFinance/customersApi';
import { loadRevenueContractOverview } from '@/lib/ownerFinance/financeExtendedApi';
import {
  buildAttention, buildRecent, buildUpcoming, monthlyCashSeries, receivableAging, summarisePipeline,
  type AttentionItem, type RecentItem, type UpcomingItem,
} from '@/lib/ownerFinance/commandCenter';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import { customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import type {
  OwnerBusinessEntity, OwnerCustomerListRow, OwnerExpense, OwnerInvoice, OwnerOffer,
  OwnerSubscription, PeriodSummary,
} from '@/lib/ownerFinance/types';

/**
 * The Command Center — the Admin Center's landing surface.
 *
 * It answers one question: what does today need from me? Four zones, in the order the
 * owner actually reads them:
 *
 *   ATTENTION  what is late, expiring or blocked, with the amount attached
 *   PULSE      a restrained band of figures, each labelled with exactly what it counts
 *   UPCOMING   dated commitments in the next month
 *   RECENT     what actually moved
 *
 * Everything is composed from the existing owner-finance reads. It computes no
 * accounting semantics of its own: cash is cash, receivables are receivables, and the
 * offer pipeline is labelled as unbooked volume rather than folded into either.
 *
 * The reads are independent, so they run together and are settled independently: a
 * failing subscriptions read costs the "Demnächst" panel its renewals, not the page.
 */

type Section<T> = { status: 'loading' | 'ready' | 'error'; data: T; error: string | null };

const settled = <T,>(result: PromiseSettledResult<T>, fallback: T): Section<T> =>
  result.status === 'fulfilled'
    ? { status: 'ready', data: result.value, error: null }
    : { status: 'error', data: fallback, error: result.reason instanceof Error ? result.reason.message : String(result.reason) };

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function greetingFor(hour: number): string {
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

interface OwnerData {
  entity: OwnerBusinessEntity | null;
  summary: Section<PeriodSummary | null>;
  invoices: Section<OwnerInvoice[]>;
  offers: Section<OwnerOffer[]>;
  customers: Section<OwnerCustomerListRow[]>;
  expenses: Section<OwnerExpense[]>;
  subscriptions: Section<OwnerSubscription[]>;
  payments: Section<{ id: string; payment_date: string | null; direction: string; amount_cents: number; invoice_id: string | null }[]>;
  contracts: Section<{ mrr_net_cents: number; active_contract_count: number } | null>;
  tasks: Section<{ today: { id: string; title: string; due_date: string | null }[]; overdue: { id: string; title: string; due_date: string | null }[] }>;
}

export function CommandCenterPage() {
  const { isPlatformOwner, profile, user } = useAuth();
  const today = useMemo(todayIso, []);
  const year = Number(today.slice(0, 4));

  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setBootError(null);
    try {
      // The internal task queue is available to every admin, so it is read first and
      // independently of the owner-only finance surface.
      const from = `${year}-01-01`;
      const to = `${year}-12-31`;

      const taskReads = Promise.all([
        supabase.from('tasks').select('id, title, due_date').eq('due_date', today).eq('status', 'open'),
        supabase.from('tasks').select('id, title, due_date').lt('due_date', today).eq('status', 'open'),
      ]).then(([todayRes, overdueRes]) => {
        if (todayRes.error) throw todayRes.error;
        if (overdueRes.error) throw overdueRes.error;
        return {
          today: (todayRes.data ?? []) as { id: string; title: string; due_date: string | null }[],
          overdue: (overdueRes.data ?? []) as { id: string; title: string; due_date: string | null }[],
        };
      });

      if (!isPlatformOwner) {
        const tasks = await Promise.allSettled([taskReads]);
        setData({
          entity: null,
          summary: { status: 'ready', data: null, error: null },
          invoices: { status: 'ready', data: [], error: null },
          offers: { status: 'ready', data: [], error: null },
          customers: { status: 'ready', data: [], error: null },
          expenses: { status: 'ready', data: [], error: null },
          subscriptions: { status: 'ready', data: [], error: null },
          payments: { status: 'ready', data: [], error: null },
          contracts: { status: 'ready', data: null, error: null },
          tasks: settled(tasks[0], { today: [], overdue: [] }),
        });
        return;
      }

      const entity = await loadActiveEntity();
      if (!entity) {
        setData(null);
        setBootError(null);
        return;
      }

      const [
        summary, invoices, offers, customers, expenses, subscriptions, payments, contracts, tasks,
      ] = await Promise.allSettled([
        loadPeriodSummary(entity.id, from, to),
        loadInvoices(entity.id),
        loadOffers(entity.id),
        loadCustomers(entity.id),
        loadExpenses(entity.id),
        loadSubscriptions(entity.id),
        supabase
          .from('owner_payments')
          .select('id, payment_date, direction, amount_cents, invoice_id')
          .eq('business_entity_id', entity.id)
          .gte('payment_date', from).lte('payment_date', to)
          .then((res) => {
            if (res.error) throw res.error;
            return (res.data ?? []) as OwnerData['payments']['data'];
          }),
        loadRevenueContractOverview(entity.id),
        taskReads,
      ]);

      setData({
        entity,
        summary: settled(summary, null),
        invoices: settled(invoices, []),
        offers: settled(offers, []),
        customers: settled(customers, []),
        expenses: settled(expenses, []),
        subscriptions: settled(subscriptions, []),
        payments: settled(payments, []),
        contracts: settled(contracts, null),
        tasks: settled(tasks, { today: [], overdue: [] }),
      });
    } catch (error: unknown) {
      setBootError(error instanceof Error ? error.message : String(error));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isPlatformOwner, today, year]);

  useEffect(() => { void load(); }, [load]);

  const firstName = (profile?.full_name ?? '').trim().split(' ')[0];
  const greeting = `${greetingFor(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`;

  const attention = useMemo<AttentionItem[]>(() => {
    if (!data) return [];
    return buildAttention({
      invoices: data.invoices.data,
      offers: data.offers.data,
      expenses: data.expenses.data,
      customers: data.customers.data,
    }, today);
  }, [data, today]);

  const upcoming = useMemo<UpcomingItem[]>(() => {
    if (!data) return [];
    return buildUpcoming({
      invoices: data.invoices.data,
      offers: data.offers.data,
      subscriptions: data.subscriptions.data,
    }, today);
  }, [data, today]);

  const recent = useMemo<RecentItem[]>(() => {
    if (!data) return [];
    return buildRecent({
      invoices: data.invoices.data,
      offers: data.offers.data,
      payments: data.payments.data,
    });
  }, [data]);

  const pipeline = useMemo(() => summarisePipeline(data?.offers.data ?? []), [data]);
  const cash = useMemo(() => monthlyCashSeries(data?.payments.data ?? []), [data]);
  const aging = useMemo(() => receivableAging(data?.invoices.data ?? [], today), [data, today]);

  const summary = data?.summary.data ?? null;
  const activeCustomers = (data?.customers.data ?? []).filter((c) => c.status === 'active').length;
  const openTaskTotal = (data?.customers.data ?? []).reduce((sum, c) => sum + c.open_task_count, 0);

  const stats: StatItem[] = summary
    ? [
        {
          key: 'cash-in',
          label: `Zahlungseingang ${year}`,
          value: formatCentsCurrencyDe(summary.cash_in_cents),
          hint: 'tatsächlich eingegangene Kundenzahlungen',
          lead: true,
          to: '/admin/finance/revenue',
          visual: <Sparkline values={cash.net} tone={cash.net[cash.net.length - 1] >= 0 ? 'positive' : 'negative'} label="Kumulierter Netto-Cashflow" />,
        },
        {
          key: 'outstanding',
          label: 'Offene Forderungen',
          value: formatCentsCurrencyDe(summary.outstanding_cents),
          hint: summary.overdue_cents > 0
            ? `davon ${formatCentsCurrencyDe(summary.overdue_cents)} überfällig`
            : 'nichts überfällig',
          tone: summary.overdue_cents > 0 ? 'attention' : 'neutral',
          to: '/admin/finance/invoices',
        },
        {
          key: 'pipeline',
          label: 'Angebote in Prüfung',
          value: formatCentsCurrencyDe(pipeline.openOneTimeGrossCents),
          hint: pipeline.openRecurringMonthlyGrossCents > 0
            ? `+ ${formatCentsCurrencyDe(pipeline.openRecurringMonthlyGrossCents)}/Monat · kein Umsatz`
            : `${pipeline.openCount} versendet · kein Umsatz`,
          to: '/admin/finance/offers',
        },
        {
          key: 'recurring',
          label: 'Vertraglich wiederkehrend',
          value: formatCentsCurrencyDe(data?.contracts.data?.mrr_net_cents ?? 0),
          hint: `netto pro Monat · ${data?.contracts.data?.active_contract_count ?? 0} Verträge`,
          to: '/admin/finance/contracts',
        },
        {
          key: 'customers',
          label: 'Aktive Kunden',
          value: String(activeCustomers),
          hint: openTaskTotal > 0 ? `${openTaskTotal} offene Kundenaufgaben` : 'keine offenen Aufgaben',
          to: '/admin/finance/customers',
        },
      ]
    : [];

  /* ------------------------------------------------------- non-owner variant */

  if (!loading && data && !isPlatformOwner) {
    return (
      <>
        <WorkspaceHeader
          eyebrow="Command Center"
          title={greeting}
          subtitle="Ihr Einstieg in den internen Arbeitsbereich. Finanzdaten sind dem Inhaber vorbehalten."
          meta={<HeaderMeta label="Angemeldet als">{profile?.email ?? user?.email ?? '—'}</HeaderMeta>}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <TaskPanel section={data.tasks} onRetry={() => void load()} />
          <Panel title="Kundenportal" description="Was Sie hier verwalten können" flush>
            <RowList>
              <ListRow to="/admin/clients" icon={Building2} title="Portalzugänge" meta="Organisationen und Kundenkonten" />
              <ListRow to="/admin/solutions" icon={LayoutGrid} title="Lösungen" meta="Freigeschaltete Module je Kunde" />
              <ListRow to="/admin/invitations" icon={Mail} title="Einladungen" meta="Offene und versendete Portal-Einladungen" />
            </RowList>
          </Panel>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------ owner boot */

  if (!loading && !data && !bootError) {
    return (
      <>
        <WorkspaceHeader eyebrow="Command Center" title={greeting} />
        <EmptyState
          icon={Building2}
          title="Keine aktive Geschäftseinheit"
          description="Es ist keine aktive, berechnungsfähige Entität konfiguriert. Ohne sie können weder Finanzzahlen noch Kunden geladen werden."
          action={<Button variant="secondary" onClick={() => void load()}>Erneut versuchen</Button>}
        />
      </>
    );
  }

  const criticalCount = attention.filter((item) => item.tone === 'danger').length;

  return (
    <>
      <WorkspaceHeader
        eyebrow="Command Center"
        title={greeting}
        subtitle={
          loading
            ? 'Ihr Tag wird zusammengestellt …'
            : criticalCount > 0
              ? `${criticalCount} ${criticalCount === 1 ? 'überfälliger Vorgang' : 'überfällige Vorgänge'} — insgesamt ${attention.length} offen.`
              : attention.length > 0
                ? `Nichts ist überfällig. ${attention.length} ${attention.length === 1 ? 'Vorgang wartet' : 'Vorgänge warten'} trotzdem auf Sie.`
                : 'Nichts ist überfällig und nichts wartet auf eine Entscheidung.'
        }
        meta={
          data?.entity ? (
            <>
              <HeaderMeta label="Einheit">{data.entity.display_name}</HeaderMeta>
              <HeaderMeta label="Geschäftsjahr">{year}</HeaderMeta>
              <HeaderMeta label="Stand">{formatDateDe(today)}</HeaderMeta>
            </>
          ) : undefined
        }
        actions={
          isPlatformOwner ? (
            <>
              <LinkButton to="/admin/finance/offers/new" icon={FileSignature}>Neues Angebot</LinkButton>
              <LinkButton to="/admin/finance/invoices" variant="primary" icon={FileText}>Rechnungen</LinkButton>
            </>
          ) : undefined
        }
      />

      {bootError ? (
        <div className="mb-4">
          <Panel title="Command Center konnte nicht geladen werden" flush>
            <PanelError message={bootError} onRetry={() => void load()} />
          </Panel>
        </div>
      ) : null}

      <div className="space-y-4">
        {loading ? <StatBandSkeleton count={5} /> : stats.length ? <StatBand items={stats} /> : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* -------------------------------------------------------- attention */}
          <div className="space-y-4">
            <Panel
              title="Braucht Ihre Entscheidung"
              description="Überfälliges zuerst, dann was demnächst kippt"
              count={loading ? undefined : attention.length}
              tone={criticalCount > 0 ? 'attention' : 'default'}
              icon={AlertTriangle}
              flush
              footer={
                !loading && attention.length > ATTENTION_VISIBLE ? (
                  <p className="text-[12.5px] leading-5 text-[var(--cq-fg-muted)]">
                    {attention.length - ATTENTION_VISIBLE} weitere Vorgänge — geöffnet über{' '}
                    <Link to="/admin/finance/invoices" className="font-medium text-[var(--cq-fg)] underline underline-offset-2">Rechnungen</Link>
                    {' '}und{' '}
                    <Link to="/admin/finance/offers" className="font-medium text-[var(--cq-fg)] underline underline-offset-2">Angebote</Link>.
                  </p>
                ) : undefined
              }
            >
              {loading ? (
                <RowListSkeleton rows={5} />
              ) : attention.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </span>
                  <p className="text-[14px] font-semibold leading-5 text-[var(--cq-fg)]">Alles erledigt</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-[var(--cq-fg-muted)]">
                    Keine überfälligen Rechnungen, keine ablaufenden Angebote und keine offenen Prüfungen.
                  </p>
                </div>
              ) : (
                <RowList>
                  {attention.slice(0, ATTENTION_VISIBLE).map((item) => (
                    <ListRow
                      key={item.id}
                      to={item.to}
                      tone={item.tone}
                      icon={attentionIcon(item)}
                      title={item.title}
                      meta={item.meta}
                      value={item.amountCents != null ? formatCentsCurrencyDe(item.amountCents) : undefined}
                      valueHint={item.amountCents != null ? attentionValueHint(item) : undefined}
                    />
                  ))}
                </RowList>
              )}
            </Panel>

            {/* Receivables composition: one bar, not another grid of cards. */}
            {!loading && aging.total > 0 ? (
              <Panel
                title="Offene Forderungen nach Alter"
                description="Nur gestellte, nicht stornierte Rechnungen"
                action={<PanelLink to="/admin/finance/invoices">Rechnungen</PanelLink>}
                icon={Wallet}
              >
                <ShareBar
                  className="mb-4 h-2"
                  segments={[
                    { key: 'notDue', value: aging.notDue, className: 'bg-[var(--cq-border-strong)]', label: 'Nicht fällig' },
                    { key: 'd30', value: aging.d30, className: 'bg-amber-400', label: '1–30 Tage' },
                    { key: 'd60', value: aging.d60, className: 'bg-amber-600', label: '31–60 Tage' },
                    { key: 'd60plus', value: aging.d60plus, className: 'bg-red-500', label: 'über 60 Tage' },
                  ]}
                />
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                  {[
                    { label: 'Nicht fällig', value: aging.notDue, dot: 'bg-[var(--cq-border-strong)]' },
                    { label: '1–30 Tage', value: aging.d30, dot: 'bg-amber-400' },
                    { label: '31–60 Tage', value: aging.d60, dot: 'bg-amber-600' },
                    { label: 'über 60 Tage', value: aging.d60plus, dot: 'bg-red-500' },
                  ].map((bucket) => (
                    <div key={bucket.label} className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase leading-4 tracking-[0.04em] text-[var(--cq-fg-subtle)]">
                        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[2px] ${bucket.dot}`} />
                        <span className="truncate">{bucket.label}</span>
                      </dt>
                      <dd className="mt-1 text-[15px] font-semibold leading-5 tabular-nums text-[var(--cq-fg)]">
                        {formatCentsCurrencyDe(bucket.value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            ) : null}

            <TaskPanel section={data?.tasks ?? { status: 'loading', data: { today: [], overdue: [] }, error: null }} onRetry={() => void load()} />
          </div>

          {/* ------------------------------------------------ upcoming + recent */}
          <div className="space-y-4">
            <Panel
              title="Demnächst"
              description="Nächste 30 Tage"
              count={loading ? undefined : upcoming.length}
              icon={CalendarClock}
              flush
            >
              {loading ? (
                <RowListSkeleton rows={4} />
              ) : upcoming.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
                  In den nächsten 30 Tagen wird nichts fällig.
                </p>
              ) : (
                <RowList>
                  {upcoming.slice(0, 6).map((item) => (
                    <ListRow
                      key={item.id}
                      to={item.to}
                      title={item.title}
                      meta={`${formatDateDe(item.date)} · ${item.meta}`}
                      value={item.amountCents != null ? formatCentsCurrencyDe(item.amountCents) : undefined}
                    />
                  ))}
                </RowList>
              )}
            </Panel>

            <Panel title="Zuletzt passiert" icon={ListChecks}>
              {loading ? (
                <RowListSkeleton rows={4} />
              ) : recent.length === 0 ? (
                <p className="py-6 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
                  Noch keine gebuchten Vorgänge in diesem Geschäftsjahr.
                </p>
              ) : (
                <Timeline
                  items={recent.map((item) => ({
                    id: item.id,
                    tone: item.tone,
                    title: (
                      <Link
                        to={item.to}
                        className="rounded-[4px] font-medium text-[var(--cq-fg)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cq-focus)]"
                      >
                        {item.title}
                      </Link>
                    ),
                    time: `${formatDateDe(item.date)} · ${item.meta}`,
                  }))}
                />
              )}
            </Panel>

            {!loading && data ? <CustomerFocusPanel customers={data.customers} onRetry={() => void load()} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function attentionIcon(item: AttentionItem) {
  switch (item.kind) {
    case 'invoice_overdue':
    case 'invoice_due_soon':
    case 'invoice_draft':
      return FileText;
    case 'offer_expired':
    case 'offer_expiring':
    case 'offer_awaiting_send':
      return FileSignature;
    case 'expense_review':
      return Receipt;
    case 'customer_waiting':
      return Users;
    default:
      return ListChecks;
  }
}

/** How many attention rows fit before the panel starts hiding the tail. */
const ATTENTION_VISIBLE = 9;

function attentionValueHint(item: AttentionItem): string | undefined {
  if (item.kind === 'invoice_overdue' || item.kind === 'invoice_due_soon') return 'offen';
  if (item.kind === 'invoice_draft') return 'brutto';
  return undefined;
}

/** The internal task queue, surfaced contextually instead of as its own module. */
function TaskPanel({
  section, onRetry,
}: {
  section: Section<{ today: { id: string; title: string; due_date: string | null }[]; overdue: { id: string; title: string; due_date: string | null }[] }>;
  onRetry: () => void;
}) {
  const { today, overdue } = section.data;
  const total = today.length + overdue.length;
  return (
    <Panel
      title="Interne Aufgaben"
      description="Aus dem Task-Dashboard"
      count={section.status === 'ready' ? total : undefined}
      icon={ListChecks}
      action={<PanelLink to="/admin/tasks">Task-Dashboard</PanelLink>}
      flush
    >
      {section.status === 'loading' ? (
        <RowListSkeleton rows={3} />
      ) : section.status === 'error' ? (
        <PanelError message={section.error ?? 'Unbekannter Fehler'} onRetry={onRetry} />
      ) : total === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
          Für heute ist nichts geplant und nichts überfällig.
        </p>
      ) : (
        <RowList>
          {overdue.slice(0, 4).map((task) => (
            <ListRow
              key={task.id}
              to="/admin/tasks/overdue"
              tone="danger"
              title={task.title}
              meta={task.due_date ? `Überfällig seit ${formatDateDe(task.due_date)}` : 'Überfällig'}
              badge={<StatusBadge label="Überfällig" tone="danger" />}
            />
          ))}
          {today.slice(0, 4).map((task) => (
            <ListRow key={task.id} to="/admin/tasks/today" title={task.title} meta="Heute fällig" />
          ))}
        </RowList>
      )}
    </Panel>
  );
}

/** Customers with the most open work — the fastest read on where delivery is stuck. */
function CustomerFocusPanel({ customers, onRetry }: { customers: Section<OwnerCustomerListRow[]>; onRetry: () => void }) {
  const focus = [...customers.data]
    .filter((c) => c.status !== 'archived' && (c.open_task_count > 0 || c.open_invoice_count > 0))
    .sort((a, b) => (b.open_task_count + b.open_invoice_count) - (a.open_task_count + a.open_invoice_count))
    .slice(0, 5);

  return (
    <Panel
      title="Kunden im Fokus"
      description="Offene Aufgaben oder offene Rechnungen"
      icon={Users}
      action={<PanelLink to="/admin/finance/customers">Alle Kunden</PanelLink>}
      flush
    >
      {customers.status === 'error' ? (
        <PanelError message={customers.error ?? 'Unbekannter Fehler'} onRetry={onRetry} />
      ) : focus.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
          Kein Kunde hat gerade offene Aufgaben oder offene Rechnungen.
        </p>
      ) : (
        <RowList>
          {focus.map((customer) => (
            <ListRow
              key={customer.id}
              to={`/admin/finance/customers/${customer.id}`}
              title={customerDisplayName(customer)}
              meta={[
                customer.open_task_count > 0 ? `${customer.open_task_count} offene Aufgaben` : null,
                customer.open_invoice_count > 0 ? `${customer.open_invoice_count} offene Rechnungen` : null,
              ].filter(Boolean).join(' · ')}
              value={formatCentsCurrencyDe(customer.revenue_gross_cents)}
              valueHint="fakturiert"
            />
          ))}
        </RowList>
      )}
    </Panel>
  );
}

export default CommandCenterPage;
