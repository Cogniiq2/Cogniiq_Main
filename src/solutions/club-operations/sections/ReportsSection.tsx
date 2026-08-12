// Club Operations — Berichte.
//
// The reference dashboard renders this content into a PDF and a CSV and offers both as downloads.
// Here it is shown on screen instead: the aggregation is the valuable part and is reproduced
// faithfully, while generating, downloading, e-mailing or persisting a document is not.
//
// Nothing is written. In the reference system, exporting a report also records an audit entry —
// itself a mutation, and therefore absent.
//
// Composition: this reads as a document, so it is laid out as one — a masthead stating the period,
// then summary, composition, utilisation and the tax schedule in the order a treasurer works
// through them. The previous version scattered the same content across a 2×2 card grid, which is a
// layout for dashboards, not for something meant to be read top to bottom.

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/primitives';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { border, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, RankedBars, type CompositionSlice, type RankedDatum } from '../components/charts';
import { MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { Panel, SectionShell } from '../components/SectionShell';
import { formatCents, formatCount, formatDayRange, formatPercent, percentOf } from '../formatting';
import {
  courtLabel,
  membershipLabels,
  paymentProviderLabels,
  paymentStatusLabels,
  reportRangeLabels,
  taxCategoryLabels,
} from '../labels';
import type { ReportRange, ReportSnapshot } from '../types';
import { reportRanges } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

const rangeOptions = reportRanges.map((range) => ({ value: range, label: reportRangeLabels[range] }));

/** Fixed palette index per payment status — the same mapping the overview uses. */
const statusTone: Record<string, number> = {
  paid: 2,
  pending: 3,
  refunded: 1,
  failed: 0,
  not_required: 4,
};

export function ReportsSection({ adapter }: { adapter: ClubOperationsAdapter }) {
  const [range, setRange] = useState<ReportRange>('month');
  const resource = useClubOperationsResource<ReportSnapshot>(
    () => adapter.getReport({ range }),
    [adapter, range],
  );

  return (
    <SectionShell
      title="Berichte"
      description="Finanzbericht für einen frei wählbaren Zeitraum — dieselbe Aufstellung, die der Monatsabschluss verwendet."
      meta={
        resource.data ? (
          <span className="tabular-nums">
            Berichtszeitraum {formatDayRange(resource.data.periodStart, resource.data.periodEnd)}
          </span>
        ) : null
      }
      action={
        <PremiumSelect
          id="club-ops-report-range"
          label="Zeitraum"
          value={range}
          onChange={(value) => setRange(value as ReportRange)}
          options={rangeOptions}
        />
      }
      resource={resource}
      loadingLabel="Bericht wird erstellt"
      errorTitle="Bericht konnte nicht erstellt werden"
      loadingShape="report"
      notice="Der Bericht wird ausschließlich angezeigt. Es werden keine Dateien erzeugt, versendet oder gespeichert."
    >
      {(report) => {
        if (report.bookings.total === 0) {
          return (
            <EmptyState
              icon={BarChart3}
              title="Keine Daten im gewählten Zeitraum"
              description="Für diesen Zeitraum liegen keine Buchungen vor. Wählen Sie einen anderen Zeitraum."
            />
          );
        }

        const providerSlices: CompositionSlice[] = report.revenue.byProvider.map((slice, index) => ({
          key: slice.provider,
          label: paymentProviderLabels[slice.provider],
          value: slice.amountCents,
          display: formatCents(slice.amountCents),
          tone: index,
        }));

        const statusSlices: CompositionSlice[] = report.paymentStatus.map((slice) => ({
          key: slice.status,
          label: paymentStatusLabels[slice.status],
          value: slice.count,
          display: formatCount(slice.count),
          tone: statusTone[slice.status] ?? 4,
        }));

        const membershipSlices: CompositionSlice[] = report.membership.map((slice, index) => ({
          key: slice.classification,
          label: membershipLabels[slice.classification],
          value: slice.revenueCents,
          display: formatCents(slice.revenueCents),
          tone: index,
        }));

        const busiest = [...report.courts].sort((a, b) => b.bookingCount - a.bookingCount)[0];
        const courtRows: RankedDatum[] = [...report.courts]
          .sort((a, b) => b.revenueCents - a.revenueCents)
          .map((court) => ({
            key: court.court,
            label: courtLabel(court.court),
            percent: percentOf(court.revenueCents, Math.max(...report.courts.map((c) => c.revenueCents), 1)),
            value: formatCents(court.revenueCents),
            hint: `${formatCount(court.bookingCount)} Buchungen · ${formatPercent(court.utilizationPercent)} Auslastung`,
            leading: court.court === busiest?.court && court.bookingCount > 0,
          }));

        const refundShare = percentOf(report.refunds.totalCents, report.revenue.totalCents);

        return (
          <div className={space.pageGap}>
            {/* Masthead: what this document is, before any figure in it. */}
            <div
              className={cn(
                'flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between',
                surface.card,
              )}
            >
              <p className={text.cardTitle}>Finanzbericht · {reportRangeLabels[report.range]}</p>
              <p className={cn('tabular-nums', text.hint)}>
                {formatDayRange(report.periodStart, report.periodEnd)}
              </p>
            </div>

            <MetricRow label="Zusammenfassung" columns={3}>
              <PrimaryMetric
                label="Gesamtumsatz"
                value={formatCents(report.revenue.totalCents)}
                footnote={`Ø ${formatCents(report.revenue.averageBookingValueCents)} je bezahlter Buchung`}
              />
              <PrimaryMetric
                label="Buchungen"
                value={formatCount(report.bookings.total)}
                footnote={`${formatCount(report.bookings.paid)} bezahlt · ${formatCount(report.bookings.free)} kostenlos`}
              />
              <PrimaryMetric
                label="MwSt. gesamt"
                value={formatCents(report.vat.totalVatCents)}
                footnote={
                  report.vat.unresolvedCount > 0
                    ? `${formatCount(report.vat.unresolvedCount)} Buchungen noch ungeklärt`
                    : 'Alle Buchungen klassifiziert'
                }
              />
            </MetricRow>

            <MetricStrip
              items={[
                { label: 'Erstattet gesamt', value: formatCents(report.refunds.totalCents), hint: `${formatPercent(refundShare, 1)} des Umsatzes` },
                { label: 'Davon Stornierungen', value: formatCents(report.refunds.cancellationCents), hint: 'durch Kunden' },
                { label: 'Davon Doppelbuchungen', value: formatCents(report.refunds.doubleBookingCents), hint: 'Korrektur' },
                { label: 'Stornierte Buchungen', value: formatCount(report.bookings.cancelled), hint: 'im Zeitraum' },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Zahlungswege" description="Umsatz nach Anbieter.">
                <CompositionBar
                  slices={providerSlices}
                  emptyLabel="Kein Umsatz im Zeitraum."
                  totalLabel={`Gesamt ${formatCents(report.revenue.totalCents)}`}
                />
              </Panel>
              <Panel title="Zahlungsstatus" description="Verteilung der Buchungen im Zeitraum.">
                <CompositionBar
                  slices={statusSlices}
                  emptyLabel="Keine Buchungen im Zeitraum."
                  totalLabel={`${formatCount(report.bookings.total)} Buchungen`}
                />
              </Panel>
              <Panel title="Platzauslastung" description="Umsatz und Belegung je Platz.">
                <RankedBars rows={courtRows} emptyLabel="Keine Platzbelegung im Zeitraum." />
              </Panel>
              <Panel title="Mitgliedschaft" description="Umsatz nach steuerlicher Einstufung.">
                <CompositionBar
                  slices={membershipSlices}
                  emptyLabel="Keine Buchungen im Zeitraum."
                  totalLabel={`${formatCount(report.bookings.total)} Buchungen`}
                />
              </Panel>
            </div>

            <Panel
              title="Umsatzsteuer"
              description="Aufschlüsselung nach Steuerkategorie — die Aufstellung für die Voranmeldung."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 560 }}>
                  <caption className="sr-only">Umsatzsteuer nach Steuerkategorie im Berichtszeitraum</caption>
                  <thead>
                    <tr className="border-b border-[var(--cq-border)]">
                      <th scope="col" className={cn('py-2.5 pr-4', text.eyebrow)}>Kategorie</th>
                      <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>Buchungen</th>
                      <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>Netto</th>
                      <th scope="col" className={cn('px-4 py-2.5 text-right', text.eyebrow)}>MwSt.</th>
                      <th scope="col" className={cn('py-2.5 pl-4 text-right', text.eyebrow)}>Brutto</th>
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
                        <td className={cn('px-4 py-2.5 text-right text-[13px] leading-5', text.numeric)}>{formatCents(stat.vatCents)}</td>
                        <td className={cn('py-2.5 pl-4 text-right text-[13px] leading-5', text.numeric)}>{formatCents(stat.grossCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--cq-border)]">
                      <th scope="row" className={cn('py-2.5 pr-4 text-left', text.eyebrow)}>Summe</th>
                      <td className={cn('px-4 py-2.5 text-right', text.bodyStrong, text.numeric)}>
                        {formatCount(report.vat.categories.reduce((total, stat) => total + stat.bookingCount, 0))}
                      </td>
                      <td className={cn('px-4 py-2.5 text-right', text.bodyStrong, text.numeric)}>
                        {formatCents(report.vat.categories.reduce((total, stat) => total + stat.netCents, 0))}
                      </td>
                      <td className={cn('px-4 py-2.5 text-right', text.bodyStrong, text.numeric)}>
                        {formatCents(report.vat.totalVatCents)}
                      </td>
                      <td className={cn('py-2.5 pl-4 text-right', text.bodyStrong, text.numeric)}>
                        {formatCents(report.vat.categories.reduce((total, stat) => total + stat.grossCents, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {report.vat.unresolvedCount > 0 ? (
                <p
                  className={cn(
                    'mt-3 border px-3.5 py-2.5 text-[12.5px] leading-5',
                    radius.lg,
                    border.hairline,
                    'border-amber-200 bg-amber-50 text-amber-800',
                  )}
                >
                  {formatCount(report.vat.unresolvedCount)} Padel-Buchungen ohne geklärte
                  Mitgliedschaft sind in keiner Steuerkategorie enthalten. Die Summe oben ist
                  entsprechend unvollständig.
                </p>
              ) : null}
            </Panel>
          </div>
        );
      }}
    </SectionShell>
  );
}
