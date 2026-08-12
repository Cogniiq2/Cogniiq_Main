// Club Operations — Monatsberichte.
//
// Read-only monthly close, with the preceding month alongside it so movement is visible rather than
// implied. The reference dashboard can generate, save and delete reports and writes PDF/CSV files
// to storage; none of that exists here.
//
// Composition: comparison is the whole point, so it drives the layout. Three headline figures carry
// their own delta, a column chart puts every available month side by side — so the selected month
// is read in the context of the year rather than only against its predecessor — and the comparison
// table below carries the full line-by-line movement.

import { useMemo, useState } from 'react';

import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { border, focusRingOnSurface, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, RankedBars, type CompositionSlice, type RankedDatum } from '../components/charts';
import { Delta, MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { Panel, SectionShell } from '../components/SectionShell';
import { formatCents, formatCount, formatDayRange, formatPercent, percentOf } from '../formatting';
import { courtLabel, membershipLabels, monthLabel, taxCategoryLabels } from '../labels';
import { chartReveal, feedback } from '../motion';
import type { MonthlyReport, MonthlyReportComparison } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

function ComparisonRow({
  label,
  current,
  previous,
  isMoney,
  comparisonLabel,
  direction = 'up-good',
}: {
  label: string;
  current: number;
  previous: number | null;
  isMoney?: boolean;
  comparisonLabel: string;
  direction?: 'up-good' | 'up-bad' | 'neutral';
}) {
  const format = (value: number) => (isMoney ? formatCents(value) : formatCount(value));
  return (
    <tr className="border-b border-[var(--cq-border-subtle)] last:border-0">
      <th scope="row" className="py-2.5 pr-4 text-[13px] font-normal leading-5 text-[var(--cq-fg)]">
        {label}
      </th>
      <td className={cn('px-4 py-2.5 text-right text-[13px] font-medium leading-5', text.numeric)}>
        {format(current)}
      </td>
      <td className={cn('px-4 py-2.5 text-right text-[13px] leading-5 text-[var(--cq-fg-muted)]', text.numeric)}>
        {previous === null ? '—' : format(previous)}
      </td>
      <td className="py-2.5 pl-4 text-right">
        <Delta
          current={current}
          previous={previous}
          direction={direction}
          comparisonLabel={comparisonLabel}
          format={format}
        />
      </td>
    </tr>
  );
}

export function MonthlyReportsSection({ adapter }: { adapter: ClubOperationsAdapter }) {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const resource = useClubOperationsResource<MonthlyReportComparison>(
    () => adapter.getMonthlyReport({ month }),
    [adapter, month],
  );

  const monthOptions = (resource.data?.availableMonths ?? []).map((value) => ({
    value,
    label: monthLabel(value),
  }));

  return (
    <SectionShell
      title="Monatsberichte"
      description="Monatsabschlüsse mit Vergleich zum Vormonat — was sich bewegt hat und wodurch."
      meta={
        resource.data ? (
          <span className="tabular-nums">
            {formatDayRange(resource.data.report.periodStart, resource.data.report.periodEnd)}
            {resource.data.report.topCourt
              ? ` · Meistgenutzter Platz: ${courtLabel(resource.data.report.topCourt)}`
              : ''}
          </span>
        ) : null
      }
      action={
        monthOptions.length > 0 ? (
          <PremiumSelect
            id="club-ops-report-month"
            label="Berichtsmonat"
            value={month ?? resource.data?.report.month ?? ''}
            onChange={setMonth}
            options={monthOptions}
          />
        ) : undefined
      }
      resource={resource}
      loadingLabel="Monatsbericht wird geladen"
      errorTitle="Monatsbericht konnte nicht geladen werden"
      loadingShape="report"
      notice="Berichte können hier nicht erzeugt, gespeichert oder gelöscht werden."
    >
      {(comparison) => (
        <MonthlyReportView comparison={comparison} onSelectMonth={setMonth} />
      )}
    </SectionShell>
  );
}

function MonthlyReportView({
  comparison,
  onSelectMonth,
}: {
  comparison: MonthlyReportComparison;
  onSelectMonth: (month: string) => void;
}) {
  const { report, previous } = comparison;
  const prev = (pick: (r: MonthlyReport) => number): number | null => (previous ? pick(previous) : null);

  const courtRows: RankedDatum[] = useMemo(() => {
    const peak = Math.max(...report.courts.map((court) => court.revenueCents), 1);
    const busiest = [...report.courts].sort((a, b) => b.bookingCount - a.bookingCount)[0];
    return [...report.courts]
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .map((court) => ({
        key: court.court,
        label: courtLabel(court.court),
        percent: percentOf(court.revenueCents, peak),
        value: formatCents(court.revenueCents),
        hint: `${formatCount(court.bookingCount)} Buchungen · ${formatPercent(court.utilizationPercent)} Auslastung`,
        leading: court.court === busiest?.court && court.bookingCount > 0,
      }));
  }, [report.courts]);

  const membershipSlices: CompositionSlice[] = report.membership.map((slice, index) => ({
    key: slice.classification,
    label: membershipLabels[slice.classification],
    value: slice.revenueCents,
    display: formatCents(slice.revenueCents),
    tone: index,
  }));

  const providerSlices: CompositionSlice[] = [
    { key: 'stripe', label: 'Kartenzahlung', value: report.stripeRevenueCents, tone: 0 },
    { key: 'paypal', label: 'Online-Wallet', value: report.paypalRevenueCents, tone: 2 },
    { key: 'voucher', label: 'Gutschein', value: report.voucherRevenueCents, tone: 3 },
  ]
    .filter((slice) => slice.value > 0)
    .map((slice) => ({ ...slice, display: formatCents(slice.value) }));

  return (
    <div className={space.pageGap}>
      <MetricRow label={`Monatsergebnis ${monthLabel(report.month)}`} columns={3}>
        <PrimaryMetric
          label="Gesamtumsatz"
          value={formatCents(report.totalRevenueCents)}
          current={report.totalRevenueCents}
          previous={prev((r) => r.totalRevenueCents)}
          comparisonLabel="Vormonat"
          direction="up-good"
          format={(value) => formatCents(value)}
        />
        <PrimaryMetric
          label="Buchungen"
          value={formatCount(report.bookingCount)}
          current={report.bookingCount}
          previous={prev((r) => r.bookingCount)}
          comparisonLabel="Vormonat"
          direction="up-good"
          format={(value) => formatCount(value)}
          footnote={`${formatCount(report.successfulCount)} bezahlt`}
        />
        <PrimaryMetric
          label="Erstattet"
          value={formatCents(report.refundedCents)}
          current={report.refundedCents}
          previous={prev((r) => r.refundedCents)}
          comparisonLabel="Vormonat"
          direction="up-bad"
          format={(value) => formatCents(value)}
        />
      </MetricRow>

      <MonthlySeries
        comparison={comparison}
        onSelectMonth={onSelectMonth}
      />

      <Panel
        title="Vergleich zum Vormonat"
        description={
          previous
            ? `Gegenübergestellt mit ${monthLabel(previous.month)}.`
            : 'Für diesen Monat liegt kein Vormonat im Datenbestand vor.'
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 620 }}>
            <caption className="sr-only">Kennzahlen im Vergleich zum Vormonat</caption>
            <thead>
              <tr className="border-b border-[var(--cq-border)]">
                <th scope="col" className={cn('py-2.5 pr-4', text.eyebrow)}>Kennzahl</th>
                <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>{monthLabel(report.month)}</th>
                <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>Vormonat</th>
                <th scope="col" className={cn('py-2.5 pl-4 text-right', text.eyebrow)}>Veränderung</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow label="Gesamtumsatz" current={report.totalRevenueCents} previous={prev((r) => r.totalRevenueCents)} isMoney comparisonLabel="Vormonat" />
              <ComparisonRow label="Kartenzahlung" current={report.stripeRevenueCents} previous={prev((r) => r.stripeRevenueCents)} isMoney comparisonLabel="Vormonat" />
              <ComparisonRow label="Online-Wallet" current={report.paypalRevenueCents} previous={prev((r) => r.paypalRevenueCents)} isMoney comparisonLabel="Vormonat" />
              <ComparisonRow label="Gutschein" current={report.voucherRevenueCents} previous={prev((r) => r.voucherRevenueCents)} isMoney comparisonLabel="Vormonat" />
              <ComparisonRow label="Erstattet" current={report.refundedCents} previous={prev((r) => r.refundedCents)} isMoney comparisonLabel="Vormonat" direction="up-bad" />
              <ComparisonRow label="Buchungen" current={report.bookingCount} previous={prev((r) => r.bookingCount)} comparisonLabel="Vormonat" />
              <ComparisonRow label="Bezahlt" current={report.successfulCount} previous={prev((r) => r.successfulCount)} comparisonLabel="Vormonat" />
              <ComparisonRow label="Ausstehend" current={report.pendingCount} previous={prev((r) => r.pendingCount)} comparisonLabel="Vormonat" direction="up-bad" />
              <ComparisonRow label="Storniert" current={report.cancelledCount} previous={prev((r) => r.cancelledCount)} comparisonLabel="Vormonat" direction="up-bad" />
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Zahlungswege" description="Umsatz nach Anbieter im Monat.">
          <CompositionBar
            slices={providerSlices}
            emptyLabel="Kein Umsatz im Monat."
            totalLabel={`Gesamt ${formatCents(report.totalRevenueCents)}`}
          />
        </Panel>
        <Panel title="Platzauslastung" description="Umsatz und Belegung je Platz.">
          <RankedBars rows={courtRows} emptyLabel="Keine Platzbelegung im Monat." />
        </Panel>
        <Panel title="Mitgliedschaft" description="Umsatz nach steuerlicher Einstufung.">
          <CompositionBar
            slices={membershipSlices}
            emptyLabel="Keine Buchungen im Monat."
            totalLabel={`${formatCount(report.bookingCount)} Buchungen`}
          />
        </Panel>
      </div>

      <MetricStrip
        items={[
          { label: 'Stornierungen erstattet', value: formatCents(report.refundedCancellationCents), hint: 'durch Kunden' },
          { label: 'Doppelbuchungen erstattet', value: formatCents(report.refundedDoubleBookingCents), hint: 'Korrektur' },
          { label: 'Ausstehend', value: formatCount(report.pendingCount), hint: 'Zahlung offen' },
          { label: 'Meistgenutzter Platz', value: report.topCourt ? courtLabel(report.topCourt) : '—', hint: 'nach Buchungen' },
        ]}
      />

      <Panel title="Umsatzsteuer" description="Aufschlüsselung nach Steuerkategorie im Berichtsmonat.">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 520 }}>
            <caption className="sr-only">Umsatzsteuer nach Steuerkategorie im Berichtsmonat</caption>
            <thead>
              <tr className="border-b border-[var(--cq-border)]">
                <th scope="col" className={cn('py-2.5 pr-4', text.eyebrow)}>Kategorie</th>
                <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>Buchungen</th>
                <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>Netto</th>
                <th scope="col" className={cn('py-2.5 pl-4 text-right', text.eyebrow)}>MwSt.</th>
              </tr>
            </thead>
            <tbody>
              {report.vat.categories.map((stat) => (
                <tr key={stat.category} className="border-b border-[var(--cq-border-subtle)] last:border-0">
                  <th scope="row" className="py-2.5 pr-4 text-[13px] font-normal leading-5 text-[var(--cq-fg)]">
                    {taxCategoryLabels[stat.category]}
                  </th>
                  <td className={cn('px-4 py-2.5 text-right text-[13px] leading-5', text.numeric)}>{formatCount(stat.bookingCount)}</td>
                  <td className={cn('px-4 py-2.5 text-right text-[13px] leading-5', text.numeric)}>{formatCents(stat.netCents)}</td>
                  <td className={cn('py-2.5 pl-4 text-right text-[13px] leading-5', text.numeric)}>{formatCents(stat.vatCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.vat.unresolvedCount > 0 ? (
          <p
            className={cn(
              'mt-3 border px-3.5 py-2.5 text-[12.5px] leading-5',
              radius.lg,
              'border-amber-200 bg-amber-50 text-amber-800',
            )}
          >
            {formatCount(report.vat.unresolvedCount)} Padel-Buchungen ohne geklärte Mitgliedschaft
            sind in keiner Steuerkategorie enthalten und müssen vor dem Abschluss geklärt werden.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

/**
 * Every available month as a column, with the selected one marked.
 *
 * The comparison table answers "against last month"; this answers "against the year". Each column
 * is a real control that selects that month, so the chart is also the fastest way to move between
 * reports — faster than the select above, which is kept because a chart is not a substitute for a
 * labelled control.
 */
function MonthlySeries({
  comparison,
  onSelectMonth,
}: {
  comparison: MonthlyReportComparison;
  onSelectMonth: (month: string) => void;
}) {
  const { report, availableMonths } = comparison;

  // Only the selected month and its predecessor carry full figures in the comparison object, so the
  // series is drawn from what the section already knows rather than from a second request.
  const known = new Map<string, number>();
  known.set(report.month, report.totalRevenueCents);
  if (comparison.previous) known.set(comparison.previous.month, comparison.previous.totalRevenueCents);

  const peak = Math.max(...[...known.values()], 1);
  // Oldest first reads left to right as time passing.
  const months = [...availableMonths].sort();

  return (
    <Panel
      title="Monate im Bestand"
      description="Auswahl öffnet den Bericht dieses Monats. Umsatz nur für den gewählten Monat und seinen Vormonat bekannt."
    >
      <ul className="flex items-end gap-2">
        {months.map((value) => {
          const revenue = known.get(value);
          const isActive = value === report.month;
          return (
            <li key={value} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelectMonth(value)}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`Bericht für ${monthLabel(value)} anzeigen${revenue === undefined ? '' : `, Umsatz ${formatCents(revenue)}`}`}
                className={cn(
                  'flex w-full flex-col items-stretch gap-2 p-2',
                  radius.md,
                  feedback,
                  focusRingOnSurface,
                  isActive ? cn(border.strong, surface.card) : 'hover:bg-[var(--cq-hover)]',
                )}
              >
                <span className="flex h-20 items-end" aria-hidden="true">
                  {revenue === undefined ? (
                    <span
                      className={cn('w-full border border-dashed border-[var(--cq-border)]', radius.sm)}
                      style={{ height: 8 }}
                    />
                  ) : (
                    <span
                      className={cn('w-full rounded-t-[2px]', chartReveal)}
                      style={{
                        height: `max(4px, ${(revenue / peak) * 80}px)`,
                        background: isActive ? 'var(--cq-chart-1)' : 'var(--cq-chart-5)',
                      }}
                    />
                  )}
                </span>
                <span className={cn('truncate text-center tabular-nums', isActive ? text.bodyStrong : text.hint)}>
                  {monthLabel(value)}
                </span>
                <span className={cn('truncate text-center tabular-nums', text.hint)}>
                  {revenue === undefined ? '—' : formatCents(revenue)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
