import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Download, FileWarning } from 'lucide-react';

import {
  Button, Card, ErrorState, KpiCard, KpiSkeletonGrid, PageHeader, SectionHeader, StatusBadge, useToast,
  type BadgeTone,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadAssets, loadTaxPeriodInputs, loadTaxSettings, recordExportRun, saveTaxEstimate } from '@/lib/ownerFinance/api';
import { computeTaxSnapshot, type TaxSnapshot } from '@/lib/ownerFinance/taxSnapshot';
import { RULES_VERSION } from '@/lib/ownerFinance/tax';
import { exportCsv, exportJson, exportReportPdf, pdfMetaLines, EXPORT_DISCLAIMER, formatCentsCurrencyDe } from '@/lib/ownerFinance/exports';
import { formatCents } from '@/lib/clientPlatform/validation';
import type { OwnerTaxSettings } from '@/lib/ownerFinance/types';

type Confidence = 'complete' | 'estimate' | 'incomplete';
const confidenceMeta: Record<Confidence, { label: string; tone: BadgeTone }> = {
  complete: { label: 'exakt', tone: 'success' },
  estimate: { label: 'Schätzung', tone: 'info' },
  incomplete: { label: 'unvollständig', tone: 'warning' },
};

export function TaxesPage() {
  const { entity, taxYear } = useOwnerEntity();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ settings: OwnerTaxSettings | null; calc: TaxSnapshot } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const settings = await loadTaxSettings(entity.id, taxYear);
      // The RPC needs a timing to aggregate cash-basis figures. When the USt mode is still unknown we
      // pass a provisional 'ist' ONLY to gather numbers — computeTaxSnapshot flags the mode as
      // unconfigured so the VAT is never presented as confirmed Istversteuerung / abgabebereit.
      const timing = settings?.vat_timing ?? 'ist';
      const [inputs, assets] = await Promise.all([
        loadTaxPeriodInputs(entity.id, `${taxYear}-01-01`, `${taxYear}-12-31`, timing),
        loadAssets(entity.id),
      ]);
      setData({ settings, calc: computeTaxSnapshot({ inputs, assets, settings, taxYear }) });
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity, taxYear]);

  useEffect(() => { void load(); }, [load]);

  const checklist = useMemo(() => {
    const s = data?.settings;
    return [
      { label: 'Gewerbesteuer-Hebesatz hinterlegt', done: s?.trade_tax_hebesatz_bp != null },
      { label: 'USt-Modus (Ist/Soll) gewählt', done: !!s?.vat_timing },
      { label: 'Veranlagungsart gewählt', done: !!s?.assessment_mode },
      { label: 'Anderes zu versteuerndes Einkommen erfasst', done: s?.estimated_other_taxable_income_cents != null },
      { label: 'Setup als vollständig markiert', done: !!s?.setup_complete },
    ];
  }, [data]);

  const saveSnapshot = async () => {
    if (!entity || !data) return;
    setSaving(true);
    const { error: err } = await saveTaxEstimate(entity.id, {
      tax_year: taxYear, tax_type: 'combined_reserve', rules_version: RULES_VERSION,
      estimated_liability_cents: data.calc.reserve.totalReserveCents,
      remaining_reserve_cents: data.calc.reserve.totalReserveCents,
      confidence: data.calc.confidence, warnings: data.calc.warnings,
      breakdown: data.calc.reserve.breakdown as unknown as Record<string, unknown>,
    });
    setSaving(false);
    if (err) { toast.error('Snapshot konnte nicht gespeichert werden', err); return; }
    toast.success('Steuer-Snapshot gespeichert', 'Unveränderlich abgelegt.');
  };

  const exportUstva = async () => {
    if (!entity || !data) return;
    const v = data.calc.vat;
    exportCsv(`UStVA-${taxYear}.csv`, { entityName: entity.display_name, periodStart: `${taxYear}-01-01`, periodEnd: `${taxYear}-12-31`, valueBasis: 'mixed' },
      ['Kennzahl', 'Bezeichnung', 'Betrag_EUR'],
      [['81', 'Umsatz 19% (USt)', (v.outputVatCents / 100).toFixed(2)], ['—', 'Reverse-Charge USt', (v.reverseChargeOutputCents / 100).toFixed(2)], ['66', 'Vorsteuer', (v.eligibleInputVatCents / 100).toFixed(2)], ['83', 'Zahllast/Erstattung', (v.payableCents / 100).toFixed(2)]]);
    await recordExportRun(entity.id, { export_type: 'ustva_preparation', period_start: `${taxYear}-01-01`, period_end: `${taxYear}-12-31`, rules_version: RULES_VERSION, warnings: data.calc.warnings });
    toast.success('UStVA-Paket erstellt', 'Als Vorbereitung markiert — nicht übermittelt.');
  };
  const exportTaxPdf = async () => {
    if (!entity || !data) return;
    const v = data.calc.vat;
    const meta = { entityName: entity.display_name, periodStart: `${taxYear}-01-01`, periodEnd: `${taxYear}-12-31`, valueBasis: 'estimated' as const };
    try {
      await exportReportPdf(`Steuerübersicht-${taxYear}.pdf`, {
        brand: 'Cogniiq',
        documentTitle: `Steuerübersicht ${taxYear} — Schätzung`,
        entityName: entity.display_name,
        metaLines: pdfMetaLines(meta),
        sections: [
          {
            kind: 'keyvalue', heading: 'Umsatzsteuer (Vorbereitung)',
            rows: [
              ['Umsatzsteuer 19 %', formatCentsCurrencyDe(v.outputVatCents)],
              ['Reverse-Charge USt', formatCentsCurrencyDe(v.reverseChargeOutputCents)],
              ['Abziehbare Vorsteuer', formatCentsCurrencyDe(v.eligibleInputVatCents)],
              ['Zahllast / Erstattung', formatCentsCurrencyDe(v.payableCents)],
            ],
          },
          {
            kind: 'keyvalue', heading: 'Rücklage',
            rows: [
              ['Empfohlene Steuer-Rücklage', formatCentsCurrencyDe(data.calc.reserve.totalReserveCents)],
              ['Konfidenz', data.calc.confidence],
            ],
          },
          ...(data.calc.warnings.length > 0
            ? [{ kind: 'paragraph' as const, heading: 'Hinweise', text: data.calc.warnings.join(' · ') }]
            : []),
          { kind: 'note', text: `Steuerschätzung nach ${RULES_VERSION}. ${EXPORT_DISCLAIMER}` },
        ],
        disclaimer: `Cogniiq · Steuerschätzung — ${EXPORT_DISCLAIMER}`,
      });
      await recordExportRun(entity.id, { export_type: 'tax_overview:pdf', period_start: `${taxYear}-01-01`, period_end: `${taxYear}-12-31`, rules_version: RULES_VERSION, warnings: data.calc.warnings });
      toast.success('Steuerübersicht als PDF erstellt', 'Als Schätzung/Vorbereitung markiert.');
    } catch (e: unknown) {
      toast.error('PDF-Export fehlgeschlagen', e instanceof Error ? e.message : String(e));
    }
  };
  const exportSummary = async () => {
    if (!entity || !data) return;
    exportJson(`Steuerübersicht-${taxYear}.json`, { entityName: entity.display_name, periodStart: `${taxYear}-01-01`, periodEnd: `${taxYear}-12-31`, valueBasis: 'estimated' }, data.calc as unknown as Record<string, unknown>);
    await recordExportRun(entity.id, { export_type: 'tax_summary', rules_version: RULES_VERSION, period_start: `${taxYear}-01-01`, period_end: `${taxYear}-12-31` });
    toast.success('Steuerübersicht exportiert');
  };

  if (!entity) return <KpiSkeletonGrid />;

  const s = data?.settings;
  const openItems = checklist.filter((c) => !c.done);

  return (
    <>
      <PageHeader
        title={`Steuern ${taxYear}`}
        description="Geführtes Steuer-Kontrollzentrum. Exakte Buchwerte, gesetzliche Rechengrößen und Schätzungen sind klar getrennt. Alle Steuerwerte sind Planungsschätzungen, keine Steuerbescheide (Berechnungsversion de-2026-v1)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Download} onClick={() => void exportUstva()} disabled={!data}>UStVA-Paket</Button>
            <Button variant="secondary" icon={Download} onClick={() => void exportTaxPdf()} disabled={!data}>PDF-Übersicht</Button>
            <Button variant="secondary" icon={Download} onClick={() => void exportSummary()} disabled={!data}>Steuerübersicht</Button>
            <Button onClick={() => void saveSnapshot()} loading={saving} disabled={!data}>Snapshot speichern</Button>
          </div>
        }
      />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {loading || !data ? (
        <div className="space-y-6"><KpiSkeletonGrid /><KpiSkeletonGrid count={2} /></div>
      ) : (
        <div className="space-y-6">
          {/* Setup completeness + checklist */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <SectionHeader
                title="Setup-Vollständigkeit"
                description="Fehlende Eingaben mindern die Aussagekraft der Schätzung."
                action={<StatusBadge label={confidenceMeta[data.calc.confidence].label} tone={confidenceMeta[data.calc.confidence].tone} />}
              />
              <ul className="space-y-2.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2.5 text-[13.5px]">
                    {item.done ? <CheckCircle2 size={17} className="shrink-0 text-emerald-600" aria-hidden="true" /> : <Circle size={17} className="shrink-0 text-gray-300" aria-hidden="true" />}
                    <span className={item.done ? 'text-gray-600' : 'font-medium text-gray-950'}>{item.label}</span>
                  </li>
                ))}
              </ul>
              {openItems.length ? (
                <Link to="/admin/finance/settings" className="mt-4 inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950">
                  {openItems.length} offene Eingabe(n) ergänzen
                </Link>
              ) : null}
            </Card>

            <Card>
              <SectionHeader title="Konfiguration" />
              <dl className="space-y-2.5 text-[13px]">
                <ConfigRow label="USt-Modus" value={s?.vat_timing === 'ist' ? 'Ist-Versteuerung' : s?.vat_timing === 'soll' ? 'Soll-Versteuerung' : 'nicht gesetzt'} basis="legal" />
                <ConfigRow label="Veranlagungszeitraum" value={`Kalenderjahr ${taxYear}`} basis="legal" />
                <ConfigRow label="Hebesatz" value={s?.trade_tax_hebesatz_bp ? `${s.trade_tax_hebesatz_bp / 100} %` : 'fehlt'} basis="legal" />
                <ConfigRow label="Veranlagung" value={s?.assessment_mode === 'joint' ? 'Zusammen' : 'Einzel'} basis="legal" />
                <ConfigRow label="Kirchensteuer" value={s?.church_tax_enabled ? `aktiv (${(s.church_tax_rate_bp ?? 0) / 100} %)` : 'inaktiv'} basis="legal" />
                <ConfigRow label="Anderes Einkommen" value={s?.estimated_other_taxable_income_cents != null ? formatCents(s.estimated_other_taxable_income_cents) : 'nicht hinterlegt'} basis="input" />
              </dl>
            </Card>
          </div>

          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="EÜR-Gewinn" valueCents={data.calc.euer.taxableProfitCents} basis="estimate" />
            <KpiCard label="USt-Zahllast" valueCents={data.calc.vat.payableCents} basis="estimate" hint={data.calc.vat.filingReady ? 'abgabebereit' : data.calc.vat.vatModeConfigured ? 'Prüfung offen' : 'USt-Modus fehlt'} />
            <KpiCard label="Gewerbesteuer" valueCents={data.calc.trade.tradeTaxCents} basis="estimate" hint={data.calc.trade.tradeTaxCents == null ? 'Hebesatz fehlt' : undefined} />
            <KpiCard label="Steuerrücklage gesamt" valueCents={data.calc.reserve.totalReserveCents} basis="estimate" />
          </div>

          {/* Warnings */}
          {data.calc.warnings.length ? (
            <Card className="border-amber-100 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <FileWarning size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Hinweise & Annahmen</p>
                  <ul className="mt-2 space-y-1 text-[13px] text-amber-700">{data.calc.warnings.map((w, i) => <li key={i}>• {w}</li>)}</ul>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Detailed sections */}
          <TaxSection title="Umsatzsteuer" confidence={data.calc.vat.filingReady ? 'complete' : 'incomplete'} rows={[
            ['Umsatzsteuer (Output)', data.calc.vat.outputVatCents], ['Reverse-Charge-Umsatzsteuer', data.calc.vat.reverseChargeOutputCents],
            ['abzugsfähige Vorsteuer', -data.calc.vat.eligibleInputVatCents], ['USt-Vorauszahlungen', -(s?.vat_prepayments_cents ?? 0)],
            ['Zahllast / Erstattung', data.calc.vat.payableCents],
          ]} />

          <TaxSection title="EÜR & Einkommensteuer (anteilig)" confidence={data.calc.income.hasPersonalInputs ? 'estimate' : 'incomplete'} rows={[
            ['zu versteuernder Gewinn (EÜR)', data.calc.euer.taxableProfitCents],
            ['ESt ohne Cogniiq', data.calc.income.baselineTaxCents], ['ESt inkl. Cogniiq', data.calc.income.totalTaxCents],
            ['anteilige ESt (Cogniiq)', data.calc.income.incrementalTaxCents], ['§35-Anrechnung', -data.calc.sec35.creditCents],
            ['ESt-Vorauszahlungen', -(s?.income_tax_prepayments_cents ?? 0)], ['verbleibende ESt-Rücklage', data.calc.income.remainingReserveCents],
          ]} />

          <TaxSection title="Gewerbesteuer" confidence={data.calc.trade.tradeTaxCents == null ? 'incomplete' : 'estimate'}
            rows={data.calc.trade.steps.map((step) => [step.label, step.valueCents] as [string, number])} />

          <TaxSection title="Solidaritätszuschlag & Kirchensteuer" confidence="estimate" rows={[
            ['Solidaritätszuschlag (anteilig)', data.calc.soliRemainingCents], ['Kirchensteuer (anteilig)', data.calc.churchRemainingCents],
          ]} />

          <Card>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Annahmen & Berechnungsversion</p>
            <p className="text-[13px] leading-6 text-gray-500">
              Hebesatz {s?.trade_tax_hebesatz_bp ? `${s.trade_tax_hebesatz_bp / 100} %` : 'nicht konfiguriert'} ·
              Veranlagung {s?.assessment_mode === 'joint' ? 'Zusammen' : 'Einzel'} ·
              Kirchensteuer {s?.church_tax_enabled ? 'aktiv' : 'inaktiv'} ·
              anderes Einkommen {s?.estimated_other_taxable_income_cents != null ? formatCents(s.estimated_other_taxable_income_cents) : 'nicht hinterlegt'}.
              Berechnungsversion <span className="font-semibold text-gray-700">{RULES_VERSION}</span>. §11 ±10-Tage-Regel wird markiert, nicht automatisiert.
              Diese Werte sind Schätzungen und ersetzen keine steuerliche Beratung.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}

function ConfigRow({ label, value, basis }: { label: string; value: string; basis: 'legal' | 'input' | 'actual' }) {
  const tone: Record<string, BadgeTone> = { legal: 'info', input: 'warning', actual: 'success' };
  const basisLabel: Record<string, string> = { legal: 'gesetzlich', input: 'Eingabe', actual: 'Ist' };
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{value}</span>
        <StatusBadge label={basisLabel[basis]} tone={tone[basis]} />
      </dd>
    </div>
  );
}

function TaxSection({ title, confidence, rows }: { title: string; confidence: Confidence; rows: [string, number][] }) {
  const meta = confidenceMeta[confidence];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-gray-950">{title}</h3>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, cents], i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              <td className="py-2.5 text-gray-500">{label}</td>
              <td className="py-2.5 text-right tabular-nums font-medium text-gray-900">{formatCents(cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
