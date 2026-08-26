import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Download, FileWarning } from 'lucide-react';

import {
  Button, Card, ErrorState, KpiCard, KpiSkeletonGrid, PageHeader, SectionHeader, StatusBadge, Tabs, useToast,
  type BadgeTone,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadAssets, loadTaxPeriodInputs, loadTaxSettings, recordExportRun, saveTaxEstimate, type TaxPeriodInputs } from '@/lib/ownerFinance/api';
import { computeTaxSnapshot, type TaxSnapshot } from '@/lib/ownerFinance/taxSnapshot';
import { RULES_VERSION } from '@/lib/ownerFinance/tax';
import { resolveTaxPeriod, TAX_PERIOD_KEYS, type TaxPeriodKey } from '@/lib/ownerFinance/taxPeriod';
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
  /**
   * `calc` is scoped to the selected Auswertungszeitraum; `annual` is always the
   * full calendar year. Both are kept because German income tax, trade tax, the
   * §35 credit, Soli/Kirchensteuer and the depreciation schedule are annual
   * constructs — there is no lawful way to derive a quarterly figure for them,
   * and dividing an annual liability by four would be an invented rule. So the
   * transactional inputs (Umsatz, Ausgaben, USt) are filtered by the period,
   * while those annual figures are shown FROM the annual snapshot and labelled
   * as such. For "Gesamtjahr" the two are the same object.
   */
  const [data, setData] = useState<{ settings: OwnerTaxSettings | null; calc: TaxSnapshot; annual: TaxSnapshot; inputs: TaxPeriodInputs | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [periodKey, setPeriodKey] = useState<TaxPeriodKey>('year');

  const period = useMemo(() => resolveTaxPeriod(taxYear, periodKey), [taxYear, periodKey]);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const settings = await loadTaxSettings(entity.id, taxYear);
      // The RPC needs a timing to aggregate cash-basis figures. When the USt mode is still unknown we
      // pass a provisional 'ist' ONLY to gather numbers — computeTaxSnapshot flags the mode as
      // unconfigured so the VAT is never presented as confirmed Istversteuerung / abgabebereit.
      const timing = settings?.vat_timing ?? 'ist';
      const annualPeriod = resolveTaxPeriod(taxYear, 'year');
      const [inputs, assets, annualInputs] = await Promise.all([
        loadTaxPeriodInputs(entity.id, period.startDate, period.endDate, timing),
        loadAssets(entity.id),
        // Skip the second round trip when the selection already IS the full year.
        period.isFullYear
          ? Promise.resolve(null)
          : loadTaxPeriodInputs(entity.id, annualPeriod.startDate, annualPeriod.endDate, timing),
      ]);
      // Depreciation is an annual amount tied to the tax year, so it must not be
      // subtracted from a single quarter's EÜR. The period snapshot therefore runs
      // without assets and its profit is labelled "vor AfA"; the annual snapshot
      // carries the full depreciation schedule.
      const calc = computeTaxSnapshot({ inputs, assets: period.isFullYear ? assets : [], settings, taxYear });
      const annual = period.isFullYear
        ? calc
        : computeTaxSnapshot({ inputs: annualInputs, assets, settings, taxYear });
      setData({ settings, calc, annual, inputs });
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity, taxYear, period]);

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

  /**
   * The combined_reserve snapshot is an ANNUAL figure (it aggregates ESt, GewSt,
   * Soli and Kirchensteuer, all of which are assessed per calendar year). It is
   * therefore always written from the annual snapshot and always stamped
   * period = 'year', whichever Auswertungszeitraum is on screen — a quarter can
   * never be stored as if it were the full year. The button says so in quarter
   * view rather than silently doing something else than it reads.
   */
  const saveSnapshot = async () => {
    if (!entity || !data) return;
    setSaving(true);
    const { error: err } = await saveTaxEstimate(entity.id, {
      tax_year: taxYear, period: 'year', tax_type: 'combined_reserve', rules_version: RULES_VERSION,
      estimated_liability_cents: data.annual.reserve.totalReserveCents,
      remaining_reserve_cents: data.annual.reserve.totalReserveCents,
      confidence: data.annual.confidence, warnings: data.annual.warnings,
      breakdown: data.annual.reserve.breakdown as unknown as Record<string, unknown>,
    });
    setSaving(false);
    if (err) { toast.error('Snapshot konnte nicht gespeichert werden', err); return; }
    toast.success(`Jahres-Snapshot ${taxYear} gespeichert`, 'Unveränderlich abgelegt — Steuerrücklagen werden jahresbezogen bewertet.');
  };

  // Every period-dependent export resolves its range and its filename from the
  // SAME `period` object that drives the on-screen figures, so an exported file
  // can never disagree with what was selected.
  const exportUstva = async () => {
    if (!entity || !data) return;
    const v = data.calc.vat;
    exportCsv(`UStVA-${period.filenameSuffix}.csv`,
      { entityName: entity.display_name, periodStart: period.startDate, periodEnd: period.endDate, valueBasis: 'mixed', filtersLabel: period.label },
      ['Kennzahl', 'Bezeichnung', 'Betrag_EUR'],
      [['81', 'Umsatz 19% (USt)', (v.outputVatCents / 100).toFixed(2)], ['—', 'Reverse-Charge USt', (v.reverseChargeOutputCents / 100).toFixed(2)], ['66', 'Vorsteuer', (v.eligibleInputVatCents / 100).toFixed(2)], ['83', 'Zahllast/Erstattung', (v.payableCents / 100).toFixed(2)]]);
    await recordExportRun(entity.id, { export_type: 'ustva_preparation', period_start: period.startDate, period_end: period.endDate, rules_version: RULES_VERSION, warnings: data.calc.warnings, file_metadata: { period: period.key, period_label: period.label } });
    toast.success(`UStVA-Paket ${period.label} erstellt`, 'Als Vorbereitung markiert — nicht übermittelt.');
  };
  const exportTaxPdf = async () => {
    if (!entity || !data) return;
    const v = data.calc.vat;
    const meta = { entityName: entity.display_name, periodStart: period.startDate, periodEnd: period.endDate, valueBasis: 'estimated' as const, filtersLabel: period.label };
    try {
      await exportReportPdf(`Steuerübersicht-${period.filenameSuffix}.pdf`, {
        brand: 'Cogniiq',
        documentTitle: `Steuerübersicht ${period.label} — Schätzung`,
        entityName: entity.display_name,
        metaLines: [`Auswertungszeitraum: ${period.rangeLabel}`, ...pdfMetaLines(meta)],
        sections: [
          {
            kind: 'keyvalue', heading: `Umsatzsteuer (Vorbereitung) — ${period.label}`,
            rows: [
              ['Umsatzsteuer 19 %', formatCentsCurrencyDe(v.outputVatCents)],
              ['Reverse-Charge USt', formatCentsCurrencyDe(v.reverseChargeOutputCents)],
              ['Abziehbare Vorsteuer', formatCentsCurrencyDe(v.eligibleInputVatCents)],
              ['Zahllast / Erstattung', formatCentsCurrencyDe(v.payableCents)],
            ],
          },
          {
            kind: 'keyvalue', heading: `EÜR-Werte — ${period.label}`,
            rows: [
              ['Betriebseinnahmen (netto, vereinnahmt)', formatCentsCurrencyDe(data.inputs?.paid_revenue_net_cents ?? 0)],
              ['Betriebsausgaben (netto, abziehbar)', formatCentsCurrencyDe(data.inputs?.paid_expense_deductible_net_cents ?? 0)],
              [period.isFullYear ? 'zu versteuernder Gewinn (EÜR)' : 'Ergebnis im Zeitraum (vor AfA)', formatCentsCurrencyDe(data.calc.euer.taxableProfitCents)],
            ],
          },
          {
            // Annual by law — never a quarterly liability, and labelled as such.
            kind: 'keyvalue', heading: `Rücklage — jahresbezogen (Gesamtjahr ${taxYear})`,
            rows: [
              ['Empfohlene Steuer-Rücklage', formatCentsCurrencyDe(data.annual.reserve.totalReserveCents)],
              ['Konfidenz', data.annual.confidence],
            ],
          },
          ...(data.calc.warnings.length > 0
            ? [{ kind: 'paragraph' as const, heading: 'Hinweise', text: data.calc.warnings.join(' · ') }]
            : []),
          {
            kind: 'paragraph', heading: 'Zum Auswertungszeitraum',
            text: `Umsatzsteuer- und EÜR-Werte beziehen sich auf ${period.rangeLabel}. Einkommensteuer, Gewerbesteuer, Solidaritätszuschlag, Kirchensteuer und die Steuerrücklage sind gesetzlich jahresbezogen und werden für das Gesamtjahr ${taxYear} ausgewiesen. Der Auswertungszeitraum ist ein Auswertungsfilter und sagt nichts über den gesetzlichen Voranmeldungszeitraum aus.`,
          },
          { kind: 'note', text: `Steuerschätzung nach ${RULES_VERSION}. ${EXPORT_DISCLAIMER}` },
        ],
        disclaimer: `Cogniiq · Steuerschätzung — ${EXPORT_DISCLAIMER}`,
      });
      await recordExportRun(entity.id, { export_type: 'tax_overview:pdf', period_start: period.startDate, period_end: period.endDate, rules_version: RULES_VERSION, warnings: data.calc.warnings, file_metadata: { period: period.key, period_label: period.label } });
      toast.success(`Steuerübersicht ${period.label} als PDF erstellt`, 'Als Schätzung/Vorbereitung markiert.');
    } catch (e: unknown) {
      toast.error('PDF-Export fehlgeschlagen', e instanceof Error ? e.message : String(e));
    }
  };
  const exportSummary = async () => {
    if (!entity || !data) return;
    exportJson(`Steuerübersicht-${period.filenameSuffix}.json`,
      { entityName: entity.display_name, periodStart: period.startDate, periodEnd: period.endDate, valueBasis: 'estimated', filtersLabel: period.label },
      {
        period: { key: period.key, label: period.label, start: period.startDate, end: period.endDate, is_full_year: period.isFullYear },
        period_scoped: data.calc as unknown as Record<string, unknown>,
        // Always the full calendar year, so a consumer of a quarterly export can
        // never mistake an annual liability for a quarterly one.
        annual_reference: { tax_year: taxYear, snapshot: data.annual as unknown as Record<string, unknown> },
      });
    await recordExportRun(entity.id, { export_type: 'tax_summary', rules_version: RULES_VERSION, period_start: period.startDate, period_end: period.endDate, file_metadata: { period: period.key, period_label: period.label } });
    toast.success(`Steuerübersicht ${period.label} exportiert`);
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
            <Button onClick={() => void saveSnapshot()} loading={saving} disabled={!data}>
              {period.isFullYear ? 'Snapshot speichern' : 'Jahres-Snapshot speichern'}
            </Button>
          </div>
        }
      />

      {/* Auswertungszeitraum — a reporting filter, NOT the legal Voranmeldungszeitraum. */}
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Auswertungszeitraum</p>
            <p className="mt-1 text-[13px] font-medium text-gray-900">{period.rangeLabel}</p>
          </div>
          <div className="sm:shrink-0">
            <Tabs
              value={periodKey}
              onChange={(v) => setPeriodKey(v as TaxPeriodKey)}
              tabs={TAX_PERIOD_KEYS.map((k) => ({ value: k, label: resolveTaxPeriod(taxYear, k).shortLabel }))}
            />
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-5 text-gray-500">
          Auswertungsfilter für Umsatzsteuer-, EÜR- und Exportwerte. Er ändert nicht Ihren gesetzlichen
          Voranmeldungszeitraum und stellt keine Abgabepflicht fest. Einkommensteuer, Gewerbesteuer,
          Solidaritätszuschlag, Kirchensteuer und die Steuerrücklage bleiben jahresbezogen.
        </p>
      </Card>

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
          {/* The first two KPIs follow the selected period; the last two are annual
              by law and say so, so a quarterly label never sits beside an annual value. */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={period.isFullYear ? 'EÜR-Gewinn' : `EÜR-Ergebnis ${period.shortLabel}`}
              valueCents={data.calc.euer.taxableProfitCents}
              basis="estimate"
              hint={period.isFullYear ? undefined : 'Zeitraum, vor Jahres-AfA'}
            />
            <KpiCard
              label={period.isFullYear ? 'USt-Zahllast' : `USt-Zahllast ${period.shortLabel}`}
              valueCents={data.calc.vat.payableCents}
              basis="estimate"
              hint={data.calc.vat.filingReady ? 'abgabebereit' : data.calc.vat.vatModeConfigured ? 'Prüfung offen' : 'USt-Modus fehlt'}
            />
            <KpiCard label="Gewerbesteuer" valueCents={data.annual.trade.tradeTaxCents} basis="estimate" hint={data.annual.trade.tradeTaxCents == null ? 'Hebesatz fehlt' : `Gesamtjahr ${taxYear}`} />
            <KpiCard label="Steuerrücklage gesamt" valueCents={data.annual.reserve.totalReserveCents} basis="estimate" hint={`Gesamtjahr ${taxYear}`} />
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
          {/* Period-scoped. The USt figures come straight from owner_tax_period_inputs
              for the selected range, so the configured Ist/Soll timing decides which
              transactions fall into it — never a naive invoice-date filter. */}
          <TaxSection
            title={`Umsatzsteuer — ${period.label}`}
            scope={`${period.rangeLabel} · ${s?.vat_timing === 'soll' ? 'Soll-Versteuerung' : s?.vat_timing === 'ist' ? 'Ist-Versteuerung' : 'USt-Modus nicht gesetzt'}`}
            confidence={data.calc.vat.filingReady ? 'complete' : 'incomplete'}
            rows={[
              ['Umsatzsteuer (Output)', data.calc.vat.outputVatCents], ['Reverse-Charge-Umsatzsteuer', data.calc.vat.reverseChargeOutputCents],
              ['abzugsfähige Vorsteuer', -data.calc.vat.eligibleInputVatCents], ['USt-Vorauszahlungen', -(s?.vat_prepayments_cents ?? 0)],
              ['Zahllast / Erstattung', data.calc.vat.payableCents],
            ]}
          />

          {/* Period-scoped transactional EÜR figures. */}
          <TaxSection
            title={`EÜR-Werte — ${period.label}`}
            scope={period.isFullYear ? undefined : 'Zeitraumwerte ohne die jahresbezogene AfA'}
            confidence="estimate"
            rows={[
              ['Betriebseinnahmen (netto, vereinnahmt)', data.inputs?.paid_revenue_net_cents ?? 0],
              ['Betriebsausgaben (netto, abziehbar)', -(data.inputs?.paid_expense_deductible_net_cents ?? 0)],
              [period.isFullYear ? 'zu versteuernder Gewinn (EÜR)' : 'Ergebnis im Zeitraum (vor AfA)', data.calc.euer.taxableProfitCents],
            ]}
          />

          {/* Annual by law — computed from the full calendar year regardless of the
              selection. Quarterly income/trade tax liabilities do not exist in German
              law and are deliberately not invented here. */}
          <TaxSection title="Einkommensteuer (anteilig)" scope={`Jahresbezogen · Gesamtjahr ${taxYear}`} confidence={data.annual.income.hasPersonalInputs ? 'estimate' : 'incomplete'} rows={[
            ['zu versteuernder Gewinn (EÜR, Jahr)', data.annual.euer.taxableProfitCents],
            ['ESt ohne Cogniiq', data.annual.income.baselineTaxCents], ['ESt inkl. Cogniiq', data.annual.income.totalTaxCents],
            ['anteilige ESt (Cogniiq)', data.annual.income.incrementalTaxCents], ['§35-Anrechnung', -data.annual.sec35.creditCents],
            ['ESt-Vorauszahlungen', -(s?.income_tax_prepayments_cents ?? 0)], ['verbleibende ESt-Rücklage', data.annual.income.remainingReserveCents],
          ]} />

          <TaxSection title="Gewerbesteuer" scope={`Jahresbezogen · Gesamtjahr ${taxYear}`} confidence={data.annual.trade.tradeTaxCents == null ? 'incomplete' : 'estimate'}
            rows={data.annual.trade.steps.map((step) => [step.label, step.valueCents] as [string, number])} />

          <TaxSection title="Solidaritätszuschlag & Kirchensteuer" scope={`Jahresbezogen · Gesamtjahr ${taxYear}`} confidence="estimate" rows={[
            ['Solidaritätszuschlag (anteilig)', data.annual.soliRemainingCents], ['Kirchensteuer (anteilig)', data.annual.churchRemainingCents],
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

function TaxSection({ title, scope, confidence, rows }: { title: string; scope?: string; confidence: Confidence; rows: [string, number][] }) {
  const meta = confidenceMeta[confidence];
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-gray-950">{title}</h3>
          {scope ? <p className="mt-0.5 text-[12px] text-gray-500">{scope}</p> : null}
        </div>
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
