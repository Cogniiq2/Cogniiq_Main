import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { OwnerCard, OwnerEmpty, OwnerError, OwnerKpi, OwnerLoading, OwnerPageHeader, OwnerPill, OwnerSelect } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadPeriodSummary, loadTaxSettings } from '@/lib/ownerFinance/api';
import { supabase } from '@/lib/supabase';
import { formatCents } from '@/lib/clientPlatform/validation';
import type { PeriodSummary } from '@/lib/ownerFinance/types';

type PeriodKey = 'month' | 'quarter' | 'ytd';

function periodRange(key: PeriodKey, year: number): { from: string; to: string } {
  const now = new Date();
  const y = year;
  if (key === 'ytd') return { from: `${y}-01-01`, to: `${y}-12-31` };
  if (key === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const startMonth = q * 3;
    const from = new Date(y, startMonth, 1);
    const to = new Date(y, startMonth + 3, 0);
    return { from: iso(from), to: iso(to) };
  }
  const from = new Date(y, now.getMonth(), 1);
  const to = new Date(y, now.getMonth() + 1, 0);
  return { from: iso(from), to: iso(to) };
}
function iso(d: Date): string { return d.toISOString().slice(0, 10); }

export function OverviewPage() {
  const { entity, status, error, taxYear } = useOwnerEntity();
  const [period, setPeriod] = useState<PeriodKey>('ytd');
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [trend, setTrend] = useState<{ month: string; in: number; out: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const range = useMemo(() => periodRange(period, taxYear), [period, taxYear]);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [sum, settings, payments] = await Promise.all([
        loadPeriodSummary(entity.id, range.from, range.to),
        loadTaxSettings(entity.id, taxYear),
        supabase.from('owner_payments').select('payment_date, direction, amount_cents')
          .eq('business_entity_id', entity.id)
          .gte('payment_date', `${taxYear}-01-01`).lte('payment_date', `${taxYear}-12-31`),
      ]);
      setSummary(sum);
      setSetupComplete(settings?.setup_complete ?? false);
      const byMonth = new Map<string, { in: number; out: number }>();
      for (let m = 0; m < 12; m += 1) byMonth.set(String(m + 1).padStart(2, '0'), { in: 0, out: 0 });
      for (const p of (payments.data ?? []) as { payment_date: string; direction: string; amount_cents: number }[]) {
        const mm = p.payment_date.slice(5, 7);
        const bucket = byMonth.get(mm);
        if (bucket) { if (p.direction === 'inflow') bucket.in += p.amount_cents; else bucket.out += p.amount_cents; }
      }
      setTrend(Array.from(byMonth.entries()).map(([month, v]) => ({ month, in: v.in / 100, out: v.out / 100 })));
      setLoadError(null);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [entity, range.from, range.to, taxYear]);

  useEffect(() => { void load(); }, [load]);

  if (status === 'loading') return <OwnerLoading label="Cockpit wird geladen" />;
  if (status === 'error') return <OwnerError message={error ?? 'unbekannt'} />;
  if (!entity) {
    return <OwnerEmpty icon={Building2} title="Keine aktive Geschäftseinheit" description="Es ist keine aktive, berechnungsfähige Entität konfiguriert." />;
  }

  const hasTrend = trend.some((t) => t.in > 0 || t.out > 0);
  const cashProfit = summary ? summary.cash_in_cents - summary.cash_out_cents : 0;
  const vatReserve = summary ? Math.max(0, summary.invoiced_vat_cents - summary.expense_input_vat_cents) : 0;

  return (
    <>
      <OwnerPageHeader
        title={`Übersicht — ${entity.display_name}`}
        description="Reale, gebuchte Werte für Ihre Einnahmenüberschussrechnung. Schätzungen sind klar gekennzeichnet; es werden keine Beispieldaten angezeigt."
        actions={
          <OwnerSelect id="period" label="" value={period} onChange={(v) => setPeriod(v as PeriodKey)} options={[
            { value: 'month', label: 'Aktueller Monat' }, { value: 'quarter', label: 'Aktuelles Quartal' }, { value: 'ytd', label: `Jahr ${taxYear}` },
          ]} />
        }
      />

      {setupComplete === false ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 text-amber-300" aria-hidden="true" />
            <p className="text-sm text-amber-200">Steuer-Setup unvollständig. Vervollständigen Sie Hebesatz, USt-Modus und persönliche Angaben, damit vollständige Steuerschätzungen möglich sind.</p>
          </div>
          <Link to="/owner/settings" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-amber-400/90 px-3 text-[13px] font-semibold text-slate-950 hover:bg-amber-300">Einstellungen <ArrowUpRight size={14} /></Link>
        </div>
      ) : null}

      {loadError ? <OwnerError message={loadError} /> : null}
      {loading && !summary ? <OwnerLoading label="Kennzahlen werden geladen" /> : null}

      {summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OwnerKpi label="Fakturierter Umsatz (netto)" valueCents={summary.invoiced_net_cents} basis="actual" hint={`${range.from} – ${range.to}`} />
            <OwnerKpi label="Zahlungseingang (Ist)" valueCents={summary.cash_in_cents} basis="actual" />
            <OwnerKpi label="Offene Forderungen" valueCents={summary.outstanding_cents} basis="actual" hint={summary.overdue_count ? `${summary.overdue_count} überfällig` : undefined} />
            <OwnerKpi label="Bezahlte Ausgaben" valueCents={summary.cash_out_cents} basis="actual" />
            <OwnerKpi label="Cash-Betriebsergebnis" valueCents={cashProfit} basis="actual" />
            <OwnerKpi label="Wiederkehrende Kosten / Monat" valueCents={summary.recurring_monthly_cost_cents} basis="forecast" />
            <OwnerKpi label="USt-Rücklage (Zeitraum)" valueCents={vatReserve} basis="estimate" hint="Output − Vorsteuer" />
            <OwnerKpi label="Steuerrücklage gesamt" value="Siehe Steuern" basis="estimate" hint="Vollständige Schätzung im Bereich Steuern" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <OwnerCard>
              <p className="mb-4 text-sm font-semibold text-white">Zahlungsfluss {taxYear}</p>
              {hasTrend ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={48} />
                      <Tooltip contentStyle={{ background: '#0c1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0' }} formatter={(v: number) => formatCents(Math.round(v * 100))} />
                      <Bar dataKey="in" name="Eingang" fill="#22d3ee" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="out" name="Ausgang" fill="#475569" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center text-center text-sm text-slate-500">Noch keine Zahlungen erfasst. Sobald echte Zahlungen gebucht sind, erscheint hier der Verlauf.</div>
              )}
            </OwnerCard>

            <OwnerCard>
              <p className="mb-4 text-sm font-semibold text-white">Hinweise</p>
              <div className="space-y-3 text-sm">
                <AlertRow label="Überfällige Rechnungen" value={summary.overdue_count} tone={summary.overdue_count ? 'danger' : 'success'} to="/owner/invoices" />
                <AlertRow label="Ausgaben zur Prüfung" value={summary.review_expense_count} tone={summary.review_expense_count ? 'warning' : 'success'} to="/owner/expenses" />
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
                  <span className="text-slate-300">Setup</span>
                  <OwnerPill label={setupComplete ? 'vollständig' : 'unvollständig'} tone={setupComplete ? 'success' : 'warning'} />
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-slate-500">Steuerwerte sind Planungsschätzungen, keine Steuerbescheide.</p>
            </OwnerCard>
          </div>
        </>
      ) : null}
    </>
  );
}

function AlertRow({ label, value, tone, to }: { label: string; value: number; tone: 'success' | 'warning' | 'danger'; to: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10">
      <span className="text-slate-300">{label}</span>
      <OwnerPill label={String(value)} tone={value ? tone : 'success'} />
    </Link>
  );
}
