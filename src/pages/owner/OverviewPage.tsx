import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Building2, Receipt, Wallet } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
  EmptyState, ErrorState, InfoBanner, LinkButton, ListRow, Panel, PanelLink, RowList, Select,
  ShareBar, Sparkline, StatBand, StatBandSkeleton, StatusBadge, TableSkeleton, WorkspaceHeader,
  type StatItem,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadAssets, loadCategories, loadExpenses, loadInvoices, loadPeriodSummary, loadTaxPeriodInputs, loadTaxSettings } from '@/lib/ownerFinance/api';
import { computeTaxSnapshot, type TaxSnapshot } from '@/lib/ownerFinance/taxSnapshot';
import { monthlyCashSeries } from '@/lib/ownerFinance/commandCenter';
import { supabase } from '@/lib/supabase';
import { formatCents } from '@/lib/clientPlatform/validation';
import type { OwnerExpense, OwnerExpenseCategory, OwnerInvoice, PeriodSummary } from '@/lib/ownerFinance/types';

/**
 * The finance overview.
 *
 * Redesigned around the one distinction that matters on this page and was previously
 * flattened into eight identical cards: money that actually moved, money that is owed,
 * and money that is only estimated. The summary band leads with collected cash; the
 * planning figures (tax reserve, available cash after reserve) sit in their own column
 * with the estimate basis stated on every one of them.
 *
 * No accounting semantics changed. Every figure still comes from
 * owner_finance_period_summary and computeTaxSnapshot exactly as before — the tax
 * values remain planning estimates and say so, and nothing on this page writes.
 */

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

interface OverviewData {
  summary: PeriodSummary | null;
  snapshot: TaxSnapshot;
  setupComplete: boolean;
  trend: { month: string; in: number; out: number }[];
  cumulative: { month: string; net: number }[];
  netSeries: number[];
  aging: { label: string; cents: number; tone: 'neutral' | 'warning' | 'danger' }[];
  categoryBreakdown: { label: string; cents: number }[];
}

function chartMoney(v: number) { return formatCents(Math.round(v * 100)); }

export function OverviewPage() {
  const { entity, taxYear } = useOwnerEntity();
  const [period] = useState<'ytd'>('ytd');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const from = `${taxYear}-01-01`;
      const to = `${taxYear}-12-31`;
      const settings = await loadTaxSettings(entity.id, taxYear);
      const timing = settings?.vat_timing ?? 'ist';
      const [summary, taxInputs, assets, payments, invoices, expenses, categories] = await Promise.all([
        loadPeriodSummary(entity.id, from, to),
        loadTaxPeriodInputs(entity.id, from, to, timing),
        loadAssets(entity.id),
        supabase.from('owner_payments').select('payment_date, direction, amount_cents').eq('business_entity_id', entity.id).gte('payment_date', from).lte('payment_date', to),
        loadInvoices(entity.id),
        loadExpenses(entity.id),
        loadCategories(),
      ]);

      const snapshot = computeTaxSnapshot({ inputs: taxInputs, assets, settings, taxYear });

      const rows = (payments.data ?? []) as { payment_date: string; direction: string; amount_cents: number }[];
      const series = monthlyCashSeries(rows);
      const trend = series.inflow.map((value, index) => ({
        month: MONTHS[index], in: value / 100, out: series.outflow[index] / 100,
      }));
      const cumulative = series.net.map((value, index) => ({
        month: MONTHS[index], net: Math.round(value) / 100,
      }));

      setData({
        summary,
        snapshot,
        setupComplete: settings?.setup_complete ?? false,
        trend,
        cumulative,
        netSeries: series.net,
        aging: buildAging(invoices),
        categoryBreakdown: buildCategoryBreakdown(expenses, categories),
      });
      setLoadError(null);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [entity, taxYear]);

  useEffect(() => { void load(); }, [load]);

  if (!entity) {
    return (
      <>
        <WorkspaceHeader eyebrow="Finanzen" title="Übersicht" subtitle="Überblick über Umsatz, Ausgaben, Liquidität und Steuerrücklagen." />
        <EmptyState icon={Building2} title="Keine aktive Geschäftseinheit" description="Es ist keine aktive, berechnungsfähige Entität konfiguriert. Prüfen Sie die Einstellungen." />
      </>
    );
  }

  const s = data?.summary ?? null;
  const snap = data?.snapshot ?? null;
  const cashProfit = s ? s.cash_in_cents - s.cash_out_cents : 0;
  const totalReserve = snap?.reserve.totalReserveCents ?? 0;
  const availableAfterReserve = cashProfit - totalReserve;
  const hasTrend = (data?.trend ?? []).some((t) => t.in > 0 || t.out > 0);
  const agingTotal = (data?.aging ?? []).reduce((sum, a) => sum + a.cents, 0);

  const stats: StatItem[] = s && snap
    ? [
        {
          key: 'cash-in',
          label: `Zahlungseingang ${taxYear}`,
          value: formatCents(s.cash_in_cents),
          hint: 'tatsächlich eingegangene Kundenzahlungen',
          lead: true,
          visual: <Sparkline values={data!.netSeries} tone={cashProfit >= 0 ? 'positive' : 'negative'} label="Kumulierter Netto-Cashflow" />,
        },
        { key: 'cash-out', label: 'Bezahlte Ausgaben', value: formatCents(s.cash_out_cents), hint: 'tatsächlich abgeflossen' },
        {
          key: 'cash-profit',
          label: 'Cash-Betriebsergebnis',
          value: formatCents(cashProfit),
          hint: 'Eingang abzüglich bezahlter Ausgaben',
          tone: cashProfit >= 0 ? 'positive' : 'negative',
        },
        {
          key: 'outstanding',
          label: 'Offene Forderungen',
          value: formatCents(s.outstanding_cents),
          hint: s.overdue_cents > 0 ? `davon ${formatCents(s.overdue_cents)} überfällig` : 'nichts überfällig',
          tone: s.overdue_cents > 0 ? 'attention' : 'neutral',
          to: '/admin/finance/invoices',
        },
        {
          key: 'euer',
          label: 'EÜR-Ergebnis (Schätzung)',
          value: formatCents(snap.euer.taxableProfitCents),
          hint: 'zu versteuernder Gewinn — Planungswert',
          tone: snap.euer.taxableProfitCents >= 0 ? 'positive' : 'negative',
          to: '/admin/finance/taxes',
        },
      ]
    : [];

  return (
    <>
      <WorkspaceHeader
        eyebrow="Finanzen"
        title={`Übersicht ${taxYear}`}
        subtitle="Reale, gebuchte Werte für Ihre Einnahmenüberschussrechnung. Steuerwerte sind gekennzeichnete Planungsschätzungen; es werden keine Beispieldaten angezeigt."
        actions={
          <div className="w-48">
            <Select id="period" value={period} onChange={() => {}} options={[{ value: 'ytd', label: `Geschäftsjahr ${taxYear}` }]} />
          </div>
        }
      />

      {data && !data.setupComplete ? (
        <div className="mb-4">
          <InfoBanner
            tone="warning"
            title="Steuer-Setup unvollständig"
            action={<LinkButton to="/admin/finance/settings" variant="secondary" icon={ArrowUpRight}>Einstellungen</LinkButton>}
          >
            Vervollständigen Sie Hebesatz, USt-Modus und persönliche Angaben, damit vollständige Steuerschätzungen möglich sind.
          </InfoBanner>
        </div>
      ) : null}

      {loadError ? <div className="mb-4"><ErrorState message={loadError} onRetry={() => void load()} /></div> : null}

      {loading || !data || !s || !snap ? (
        <div className="space-y-4">
          <StatBandSkeleton count={5} />
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <div className="space-y-4">
          <StatBand items={stats} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {/* ------------------------------------------------------- what happened */}
            <div className="space-y-4">
              <Panel
                title={`Einnahmen & Ausgaben ${taxYear}`}
                description="Gebuchte Zahlungen pro Monat — keine Forderungen, keine Planwerte"
                icon={Wallet}
              >
                {hasTrend ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.trend} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ee" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name) => [chartMoney(v), name === 'in' ? 'Eingang' : 'Ausgang']} labelStyle={{ color: '#111827', fontWeight: 600 }} />
                        <Bar dataKey="in" name="in" fill="#059669" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="out" name="out" fill="#d1d5db" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <ChartEmpty />}
              </Panel>

              <Panel title="Liquiditätsverlauf" description="Kumulierter Netto-Cashflow aus gebuchten Zahlungen">
                {hasTrend ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.cumulative} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                        <defs>
                          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#111827" stopOpacity={0.12} />
                            <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ee" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [chartMoney(v), 'Netto kumuliert']} labelStyle={{ color: '#111827', fontWeight: 600 }} />
                        <Area type="monotone" dataKey="net" stroke="#111827" strokeWidth={2} fill="url(#cashGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <ChartEmpty />}
              </Panel>

              <Panel
                title="Forderungen nach Alter"
                description="Offene Beträge aus gestellten Rechnungen"
                action={<PanelLink to="/admin/finance/invoices">Rechnungen</PanelLink>}
              >
                {agingTotal > 0 ? (
                  <>
                    <ShareBar
                      className="mb-4 h-2"
                      segments={data.aging.map((a) => ({
                        key: a.label,
                        value: a.cents,
                        label: a.label,
                        className: a.tone === 'danger' ? 'bg-red-500' : a.tone === 'warning' ? 'bg-amber-400' : 'bg-[var(--cq-border-strong)]',
                      }))}
                    />
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                      {data.aging.map((a) => (
                        <div key={a.label} className="min-w-0">
                          <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase leading-4 tracking-[0.04em] text-[var(--cq-fg-subtle)]">
                            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[2px] ${a.tone === 'danger' ? 'bg-red-500' : a.tone === 'warning' ? 'bg-amber-400' : 'bg-[var(--cq-border-strong)]'}`} />
                            <span className="truncate">{a.label}</span>
                          </dt>
                          <dd className="mt-1 text-[15px] font-semibold leading-5 tabular-nums text-[var(--cq-fg)]">{formatCents(a.cents)}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p className="py-6 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">Keine offenen Forderungen.</p>
                )}
              </Panel>
            </div>

            {/* ------------------------------------------------------- what is planned */}
            <div className="space-y-4">
              {/*
                The single most decision-relevant number on the page, so it gets its own
                surface rather than the last row of a card grid — and its own sentence
                saying what it is not: a bank balance.
              */}
              <Panel title="Verfügbares Cash nach Rücklagen" tone="attention">
                <p className={`text-[27px] font-semibold leading-8 tracking-[-0.028em] tabular-nums ${availableAfterReserve >= 0 ? 'text-[var(--cq-fg)]' : 'text-red-600'}`}>
                  {formatCents(availableAfterReserve)}
                </p>
                <p className="mt-2 text-[12.5px] leading-5 text-[var(--cq-fg-muted)]">
                  Operatives Cash ({formatCents(cashProfit)}) abzüglich empfohlener Steuerrücklage ({formatCents(totalReserve)}).
                  Kein Bankkontostand — nur gebuchte Zahlungsflüsse.
                </p>
              </Panel>

              <Panel
                title="Steuerrücklage"
                description="Planungsschätzung, kein Steuerbescheid"
                action={<PanelLink to="/admin/finance/taxes">Details</PanelLink>}
              >
                {totalReserve > 0 ? (
                  <ReserveComposition snapshot={snap} total={totalReserve} />
                ) : (
                  <p className="py-6 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
                    Noch keine Steuerrücklage berechnet. Sobald Zahlungen gebucht und das Setup vervollständigt ist, erscheint hier die Aufteilung.
                  </p>
                )}
              </Panel>

              <Panel title="Prüf-Warteschlange" flush>
                <RowList>
                  <ListRow
                    to="/admin/finance/invoices"
                    tone={s.overdue_count > 0 ? 'danger' : 'neutral'}
                    title="Überfällige Rechnungen"
                    meta={s.overdue_count > 0 ? formatCents(s.overdue_cents) : 'nichts überfällig'}
                    badge={<StatusBadge label={String(s.overdue_count)} tone={s.overdue_count ? 'danger' : 'success'} />}
                  />
                  <ListRow
                    to="/admin/finance/expenses"
                    tone={s.review_expense_count > 0 ? 'attention' : 'neutral'}
                    title="Ausgaben zur Prüfung"
                    meta={s.review_expense_count > 0 ? 'Belege oder Zuordnung fehlen' : 'alles geprüft'}
                    badge={<StatusBadge label={String(s.review_expense_count)} tone={s.review_expense_count ? 'warning' : 'success'} />}
                  />
                  <ListRow
                    to="/admin/finance/settings"
                    title="Steuer-Setup"
                    meta={data.setupComplete ? 'Hebesatz, USt-Modus und persönliche Angaben liegen vor' : 'Angaben fehlen — Schätzungen bleiben unvollständig'}
                    badge={<StatusBadge label={data.setupComplete ? 'vollständig' : 'unvollständig'} tone={data.setupComplete ? 'success' : 'warning'} />}
                  />
                </RowList>
              </Panel>

              <Panel
                title="Ausgaben nach Kategorie"
                description="Netto, laufendes Geschäftsjahr"
                icon={Receipt}
                action={<PanelLink to="/admin/finance/expenses">Alle</PanelLink>}
              >
                {data.categoryBreakdown.length ? (
                  <CategoryBars items={data.categoryBreakdown} />
                ) : (
                  <p className="py-6 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
                    Erfassen Sie Betriebsausgaben, um die Kategorienverteilung zu sehen.
                  </p>
                )}
              </Panel>

              {snap.warnings.length ? (
                <Panel title="Datenqualität & Setup" icon={AlertTriangle} className="border-amber-200">
                  <ul className="space-y-1.5 text-[12.5px] leading-5 text-amber-800">
                    {snap.warnings.slice(0, 6).map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                        <span className="[overflow-wrap:anywhere]">{w}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const tooltipStyle = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 12px 40px rgba(15,23,42,0.10)', fontSize: 12 };

function ChartEmpty() {
  return (
    <div className="flex h-48 items-center justify-center rounded-[10px] border border-dashed border-[var(--cq-border-strong)] px-6 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
      Noch keine Zahlungen erfasst. Sobald echte Zahlungen gebucht sind, erscheint hier der Verlauf.
    </div>
  );
}

function ReserveComposition({ snapshot, total }: { snapshot: TaxSnapshot; total: number }) {
  const items = [
    { label: 'Umsatzsteuer', cents: snapshot.vat.reserveCents, color: 'bg-[var(--cq-fg)]' },
    { label: 'Einkommensteuer', cents: snapshot.income.remainingReserveCents, color: 'bg-[#4b5563]' },
    { label: 'Gewerbesteuer', cents: snapshot.tradeRemainingCents, color: 'bg-[#9ca3af]' },
    { label: 'Solidaritätszuschlag', cents: snapshot.soliRemainingCents, color: 'bg-amber-400' },
    { label: 'Kirchensteuer', cents: snapshot.churchRemainingCents, color: 'bg-sky-400' },
  ].filter((i) => i.cents > 0);

  return (
    <div>
      <p className="mb-3 text-[22px] font-semibold leading-7 tracking-[-0.02em] tabular-nums text-[var(--cq-fg)]">{formatCents(total)}</p>
      <ShareBar
        className="mb-3 h-2"
        segments={items.map((i) => ({ key: i.label, value: i.cents, label: i.label, className: i.color }))}
      />
      <dl className="space-y-1.5">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between gap-3">
            <dt className="flex min-w-0 items-center gap-2 text-[12.5px] text-[var(--cq-fg-muted)]">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[2px] ${i.color}`} />
              <span className="truncate">{i.label}</span>
            </dt>
            <dd className="shrink-0 text-[12.5px] font-semibold tabular-nums text-[var(--cq-fg)]">{formatCents(i.cents)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CategoryBars({ items }: { items: { label: string; cents: number }[] }) {
  const max = Math.max(...items.map((i) => i.cents), 1);
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[12.5px]">
            <span className="min-w-0 truncate text-[var(--cq-fg-muted)]">{i.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-[var(--cq-fg)]">{formatCents(i.cents)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--cq-sunken)]">
            <div className="h-full rounded-full bg-[var(--cq-fg)]" style={{ width: `${(i.cents / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildAging(invoices: OwnerInvoice[]): { label: string; cents: number; tone: 'neutral' | 'warning' | 'danger' }[] {
  const today = new Date();
  const buckets = { notDue: 0, d30: 0, d60: 0, d60plus: 0 };
  for (const inv of invoices) {
    if (!['issued', 'partially_paid', 'overdue'].includes(inv.status)) continue;
    const open = inv.gross_total_cents - inv.amount_paid_cents;
    if (open <= 0) continue;
    if (!inv.due_date) { buckets.notDue += open; continue; }
    const days = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / 86400000);
    if (days <= 0) buckets.notDue += open;
    else if (days <= 30) buckets.d30 += open;
    else if (days <= 60) buckets.d60 += open;
    else buckets.d60plus += open;
  }
  return [
    { label: 'Nicht fällig', cents: buckets.notDue, tone: 'neutral' },
    { label: '1–30 Tage', cents: buckets.d30, tone: 'warning' },
    { label: '31–60 Tage', cents: buckets.d60, tone: 'warning' },
    { label: 'über 60 Tage', cents: buckets.d60plus, tone: 'danger' },
  ];
}

function buildCategoryBreakdown(expenses: OwnerExpense[], categories: OwnerExpenseCategory[]): { label: string; cents: number }[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category_id ?? 'none';
    map.set(key, (map.get(key) ?? 0) + e.net_total_cents);
  }
  const label = (id: string) => (id === 'none' ? 'Ohne Kategorie' : categories.find((c) => c.id === id)?.label ?? 'Sonstige');
  return Array.from(map.entries())
    .map(([id, cents]) => ({ label: label(id), cents }))
    .filter((i) => i.cents > 0)
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 6);
}
