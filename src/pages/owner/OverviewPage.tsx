import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Building2, Receipt, Wallet } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
  Card, EmptyState, ErrorState, InfoBanner, KpiCard, KpiSkeletonGrid, PageHeader, SectionHeader,
  Select, StatusBadge, TableSkeleton,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadAssets, loadCategories, loadExpenses, loadInvoices, loadPeriodSummary, loadTaxPeriodInputs, loadTaxSettings } from '@/lib/ownerFinance/api';
import { computeTaxSnapshot, type TaxSnapshot } from '@/lib/ownerFinance/taxSnapshot';
import { supabase } from '@/lib/supabase';
import { formatCents } from '@/lib/clientPlatform/validation';
import type { OwnerExpense, OwnerExpenseCategory, OwnerInvoice, PeriodSummary } from '@/lib/ownerFinance/types';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

interface OverviewData {
  summary: PeriodSummary | null;
  snapshot: TaxSnapshot;
  setupComplete: boolean;
  trend: { month: string; in: number; out: number }[];
  cumulative: { month: string; net: number }[];
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

      // Monthly cash in/out
      const byMonth = Array.from({ length: 12 }, () => ({ in: 0, out: 0 }));
      for (const p of (payments.data ?? []) as { payment_date: string; direction: string; amount_cents: number }[]) {
        const idx = Number(p.payment_date.slice(5, 7)) - 1;
        if (idx < 0 || idx > 11) continue;
        if (p.direction === 'inflow') byMonth[idx].in += p.amount_cents; else byMonth[idx].out += p.amount_cents;
      }
      const trend = byMonth.map((v, i) => ({ month: MONTHS[i], in: v.in / 100, out: v.out / 100 }));
      let running = 0;
      const cumulative = byMonth.map((v, i) => { running += (v.in - v.out) / 100; return { month: MONTHS[i], net: Math.round(running * 100) / 100 }; });

      setData({
        summary,
        snapshot,
        setupComplete: settings?.setup_complete ?? false,
        trend,
        cumulative,
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
        <PageHeader title="Übersicht" description="Executive-Überblick über Umsatz, Ausgaben, Liquidität und Steuerrücklagen." />
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

  return (
    <>
      <PageHeader
        title={`Übersicht — ${entity.display_name}`}
        description="Reale, gebuchte Werte für Ihre Einnahmenüberschussrechnung. Schätzungen sind gekennzeichnet; es werden keine Beispieldaten angezeigt."
        actions={<Select id="period" value={period} onChange={() => {}} options={[{ value: 'ytd', label: `Geschäftsjahr ${taxYear}` }]} />}
      />

      {data && !data.setupComplete ? (
        <div className="mb-6">
          <InfoBanner
            tone="warning"
            title="Steuer-Setup unvollständig"
            action={<Link to="/admin/finance/settings" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-[13px] font-semibold text-white hover:bg-amber-600">Einstellungen <ArrowUpRight size={14} /></Link>}
          >
            Vervollständigen Sie Hebesatz, USt-Modus und persönliche Angaben, damit vollständige Steuerschätzungen möglich sind.
          </InfoBanner>
        </div>
      ) : null}

      {loadError ? <div className="mb-6"><ErrorState message={loadError} onRetry={() => void load()} /></div> : null}

      {loading || !data || !s || !snap ? (
        <div className="space-y-6">
          <KpiSkeletonGrid count={4} />
          <KpiSkeletonGrid count={4} />
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Primary KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Zahlungseingang (Ist)" valueCents={s.cash_in_cents} basis="actual" icon={Wallet} />
            <KpiCard label="Bezahlte Ausgaben" valueCents={s.cash_out_cents} basis="actual" icon={Receipt} />
            <KpiCard label="EÜR-Ergebnis" valueCents={snap.euer.taxableProfitCents} basis="estimate" tone={snap.euer.taxableProfitCents >= 0 ? 'positive' : 'negative'} hint="zu versteuernder Gewinn" />
            <KpiCard label="Cash-Betriebsergebnis" valueCents={cashProfit} basis="actual" tone={cashProfit >= 0 ? 'positive' : 'negative'} />
          </div>

          {/* Receivables & reserves */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Offene Forderungen" valueCents={s.outstanding_cents} basis="actual" to="/admin/finance/invoices" />
            <KpiCard label="Überfällige Forderungen" valueCents={s.overdue_cents} basis="actual" tone={s.overdue_cents > 0 ? 'negative' : 'neutral'} hint={s.overdue_count ? `${s.overdue_count} Rechnung(en)` : 'keine'} to="/admin/finance/invoices" />
            <KpiCard label="Wiederkehrende Kosten / Monat" valueCents={s.recurring_monthly_cost_cents} basis="forecast" to="/admin/finance/subscriptions" />
            <KpiCard label="Empfohlene Steuerrücklage" valueCents={totalReserve} basis="estimate" to="/admin/finance/taxes" hint="Gesamt (USt + ESt + GewSt + …)" />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title={`Einnahmen & Ausgaben ${taxYear}`} description="Gebuchte Zahlungen pro Monat" />
              {hasTrend ? (
                <div className="h-64">
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
            </Card>

            <Card>
              <SectionHeader title="Liquiditätsverlauf" description="Kumulierter Netto-Cashflow" />
              {hasTrend ? (
                <div className="h-64">
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
            </Card>
          </div>

          {/* Reserve composition + obligations */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <SectionHeader title="Zusammensetzung der Steuerrücklage" description="Reale Schätzung auf Basis gebuchter Zahlungen und Ihrer Einstellungen" action={<Link to="/admin/finance/taxes" className="text-[13px] font-semibold text-gray-950 hover:underline">Details</Link>} />
              {totalReserve > 0 ? (
                <ReserveComposition snapshot={snap} />
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">Noch keine Steuerrücklage berechnet. Sobald Zahlungen gebucht und das Setup vervollständigt ist, erscheint hier die Aufteilung.</p>
              )}
            </Card>

            <Card>
              <SectionHeader title="Prüf-Warteschlange" />
              <div className="space-y-2.5">
                <AlertRow label="Überfällige Rechnungen" value={s.overdue_count} to="/admin/finance/invoices" />
                <AlertRow label="Ausgaben zur Prüfung" value={s.review_expense_count} to="/admin/finance/expenses" />
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
                  <span className="text-[13px] text-gray-600">Steuer-Setup</span>
                  <StatusBadge label={data.setupComplete ? 'vollständig' : 'unvollständig'} tone={data.setupComplete ? 'success' : 'warning'} />
                </div>
              </div>
              <p className="mt-4 text-[11.5px] leading-5 text-gray-400">Steuerwerte sind Planungsschätzungen, keine Steuerbescheide.</p>
            </Card>
          </div>

          {/* Aging + category breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeader title="Forderungen nach Alter" description="Offene Rechnungsbeträge" />
              {data.aging.some((a) => a.cents > 0) ? (
                <div className="space-y-2.5">
                  {data.aging.map((a) => (
                    <div key={a.label} className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        {a.tone !== 'neutral' ? <span className={`h-2 w-2 rounded-full ${a.tone === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} /> : <span className="h-2 w-2 rounded-full bg-gray-300" />}
                        <span className="text-[13px] text-gray-600">{a.label}</span>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-gray-900">{formatCents(a.cents)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="py-6 text-center text-sm text-gray-500">Keine offenen Forderungen.</p>}
            </Card>

            <Card>
              <SectionHeader title="Ausgaben nach Kategorie" description="Netto, laufendes Jahr" action={<Link to="/admin/finance/expenses" className="text-[13px] font-semibold text-gray-950 hover:underline">Alle</Link>} />
              {data.categoryBreakdown.length ? (
                <CategoryBars items={data.categoryBreakdown} />
              ) : (
                <EmptyState icon={Receipt} className="border-0 py-8" title="Keine Ausgaben" description="Erfassen Sie Betriebsausgaben, um die Kategorienverteilung zu sehen." />
              )}
            </Card>
          </div>

          {/* Data quality */}
          {snap.warnings.length ? (
            <Card className="border-amber-100 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Datenqualität & Setup</p>
                  <ul className="mt-2 space-y-1 text-[13px] text-amber-700">
                    {snap.warnings.slice(0, 6).map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              </div>
            </Card>
          ) : null}

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Verfügbares Cash nach Rücklagen</p>
            <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${availableAfterReserve >= 0 ? 'text-gray-950' : 'text-red-600'}`}>{formatCents(availableAfterReserve)}</p>
            <p className="mt-1 text-[12px] text-gray-500">Operatives Cash ({formatCents(cashProfit)}) abzüglich empfohlener Steuerrücklage ({formatCents(totalReserve)}). Kein Bankkontostand — nur gebuchte Zahlungsflüsse.</p>
          </div>
        </div>
      )}
    </>
  );
}

const tooltipStyle = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 12px 40px rgba(15,23,42,0.10)', fontSize: 12 };

function ChartEmpty() {
  return <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">Noch keine Zahlungen erfasst. Sobald echte Zahlungen gebucht sind, erscheint hier der Verlauf.</div>;
}

function AlertRow({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-2.5 transition-colors hover:bg-gray-50">
      <span className="text-[13px] text-gray-600">{label}</span>
      <StatusBadge label={String(value)} tone={value ? 'warning' : 'success'} />
    </Link>
  );
}

function ReserveComposition({ snapshot }: { snapshot: TaxSnapshot }) {
  const items = [
    { label: 'Umsatzsteuer', cents: snapshot.vat.reserveCents, color: 'bg-gray-900' },
    { label: 'Einkommensteuer', cents: snapshot.income.remainingReserveCents, color: 'bg-gray-600' },
    { label: 'Gewerbesteuer', cents: snapshot.tradeRemainingCents, color: 'bg-gray-400' },
    { label: 'Solidaritätszuschlag', cents: snapshot.soliRemainingCents, color: 'bg-amber-400' },
    { label: 'Kirchensteuer', cents: snapshot.churchRemainingCents, color: 'bg-sky-400' },
  ].filter((i) => i.cents > 0);
  const total = items.reduce((s, i) => s + i.cents, 0) || 1;
  return (
    <div>
      <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {items.map((i) => <div key={i.label} className={i.color} style={{ width: `${(i.cents / total) * 100}%` }} title={i.label} />)}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-2.5">
            <span className="flex items-center gap-2 text-[13px] text-gray-600"><span className={`h-2.5 w-2.5 rounded-sm ${i.color}`} /> {i.label}</span>
            <span className="text-[13px] font-semibold tabular-nums text-gray-900">{formatCents(i.cents)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBars({ items }: { items: { label: string; cents: number }[] }) {
  const max = Math.max(...items.map((i) => i.cents), 1);
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.label}>
          <div className="mb-1 flex items-center justify-between text-[12.5px]">
            <span className="text-gray-600">{i.label}</span>
            <span className="font-semibold tabular-nums text-gray-900">{formatCents(i.cents)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gray-800" style={{ width: `${(i.cents / max) * 100}%` }} />
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
    { label: '1–30 Tage überfällig', cents: buckets.d30, tone: 'warning' },
    { label: '31–60 Tage überfällig', cents: buckets.d60, tone: 'warning' },
    { label: 'Über 60 Tage überfällig', cents: buckets.d60plus, tone: 'danger' },
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
