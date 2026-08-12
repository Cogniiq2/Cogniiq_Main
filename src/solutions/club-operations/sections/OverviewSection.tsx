// Club Operations — Übersicht.
//
// The command centre. It answers, in reading order:
//   1. Is anything wrong?            — the attention list, first on the page and ranked
//   2. How did the period go?        — three primary figures, each against the previous window
//   3. Where did the money come from and how healthy is it? — composition and status
//   4. What moved over time?         — the trend
//   5. What is the tax position?     — VAT, which gates the monthly close
//   6. What just happened?           — recent activity
//
// Attention leads rather than trails, which is the substantive change from the previous version: it
// opened with sixteen equally weighted KPI cards across four rows, so the four unresolved payment
// discrepancies sat below the fold beneath "Zahlungswege: 3".
//
// There are no action buttons: every mutation in the reference dashboard needs its own server-side
// permission check and audit trail before it can appear here. The controls that do exist — the
// period select and the drill-down rows — navigate and filter, nothing more.

import { AlertTriangle, CalendarRange, Euro, Receipt } from 'lucide-react';

import { EmptyState, ErrorState, StatusBadge } from '@/components/dashboard/primitives';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { AttentionPanel } from '../components/AttentionPanel';
import { CompositionBar, RankedBars, TrendChart, type CompositionSlice, type RankedDatum } from '../components/charts';
import { Metric, MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { FixtureNotice, Panel, SectionIntro, SectionSkeleton } from '../components/SectionShell';
import {
  formatCents,
  formatCount,
  formatDateTime,
  formatDayRange,
  formatPercent,
} from '../formatting';
import {
  activityKindLabels,
  courtLabel,
  overviewPeriodLabels,
  paymentProviderLabels,
  paymentStatusLabels,
  taxCategoryLabels,
} from '../labels';
import { sectionEnter } from '../motion';
import type { AttentionTarget, OverviewPeriod, OverviewSnapshot } from '../types';
import { overviewPeriods } from '../types';
import type { ResourceState } from '../useClubOperationsResource';

const periodOptions = overviewPeriods.map((period) => ({
  value: period,
  label: overviewPeriodLabels[period],
}));

export function OverviewSection({
  resource,
  period,
  onPeriodChange,
  onOpenTarget,
}: {
  /** Owned by the module shell, so the header's health and this page's list are one object. */
  resource: ResourceState<OverviewSnapshot>;
  period: OverviewPeriod;
  onPeriodChange: (period: OverviewPeriod) => void;
  onOpenTarget: (target: AttentionTarget) => void;
}) {
  const { status, data, error, reload } = resource;

  return (
    <div className={space.pageGap}>
      <SectionIntro
        title="Übersicht"
        description="Was heute läuft, was Aufmerksamkeit braucht und wie sich der Zeitraum gegenüber dem vorherigen entwickelt."
        meta={
          data ? (
            <span className="tabular-nums">
              {formatDayRange(data.bounds.start, data.bounds.end)} · Vergleich:{' '}
              {formatDayRange(data.previousBounds.start, data.previousBounds.end)}
            </span>
          ) : null
        }
        action={
          <PremiumSelect
            id="club-ops-period"
            label="Zeitraum"
            value={period}
            onChange={(value) => onPeriodChange(value as OverviewPeriod)}
            options={periodOptions}
          />
        }
      />

      {status === 'loading' ? (
        <div role="status" aria-label="Übersicht wird geladen">
          <SectionSkeleton shape="report" />
        </div>
      ) : null}

      {status === 'error' ? (
        <ErrorState
          title="Übersicht konnte nicht geladen werden"
          message={error ?? 'Unbekannter Fehler.'}
          onRetry={reload}
        />
      ) : null}

      {status === 'ready' && data ? (
        <div className={sectionEnter}>
          <OverviewContent snapshot={data} onOpenTarget={onOpenTarget} />
        </div>
      ) : null}

      <FixtureNotice>
        Kennzahlen, Vergleiche und Hinweise sind aus demselben Beispieldatensatz berechnet.
      </FixtureNotice>
    </div>
  );
}

function OverviewContent({
  snapshot,
  onOpenTarget,
}: {
  snapshot: OverviewSnapshot;
  onOpenTarget: (target: AttentionTarget) => void;
}) {
  const {
    revenue,
    bookings,
    paymentStatus,
    vat,
    courts,
    activity,
    invoices,
    reconciliation,
    openAlerts,
    totals,
    previous,
    trend,
    attention,
    comparisonLabel,
  } = snapshot;

  const openAlertTotal = openAlerts.reduce((total, entry) => total + entry.count, 0);
  const criticalAlerts = openAlerts.find((entry) => entry.severity === 'critical')?.count ?? 0;

  // A period with no bookings is a real answer, not a failure — but the attention list still
  // applies, because an overdue invoice does not stop being overdue on a quiet week.
  const quiet = bookings.total === 0;

  const providerSlices: CompositionSlice[] = revenue.byProvider.map((slice, index) => ({
    key: slice.provider,
    label: paymentProviderLabels[slice.provider],
    value: slice.amountCents,
    display: formatCents(slice.amountCents),
    tone: index,
  }));

  const statusSlices: CompositionSlice[] = paymentStatus.map((slice) => ({
    key: slice.status,
    label: paymentStatusLabels[slice.status],
    value: slice.count,
    display: formatCount(slice.count),
    // Fixed tone per status, so "Fehlgeschlagen" is the same colour on every page it appears.
    tone: statusTone[slice.status] ?? 4,
  }));

  const busiest = courts.reduce(
    (leader, court) => (court.bookingCount > (leader?.bookingCount ?? -1) ? court : leader),
    courts[0],
  );
  const courtRows: RankedDatum[] = [...courts]
    .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
    .map((court) => ({
      key: court.court,
      label: courtLabel(court.court),
      percent: court.utilizationPercent,
      value: formatPercent(court.utilizationPercent),
      hint: `${formatCount(court.bookingCount)} Buchungen · ${formatCents(court.revenueCents)}`,
      leading: court.court === busiest?.court && court.bookingCount > 0,
    }));

  return (
    <div className={space.pageGap}>
      {/* 1 — What needs a human. */}
      <section aria-labelledby="club-ops-attention" className="space-y-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id="club-ops-attention" className={cn('inline-flex items-center gap-1.5', text.eyebrow)}>
            <AlertTriangle size={12} aria-hidden="true" />
            Aufmerksamkeit erforderlich
          </h3>
          {attention.length > 0 ? (
            <p className={text.hint}>
              Nach Dringlichkeit sortiert. Auswahl öffnet den zugehörigen Bereich mit gesetztem
              Filter.
            </p>
          ) : null}
        </div>
        <AttentionPanel items={attention} onOpen={(item) => onOpenTarget(item.target)} />
      </section>

      {/* 2 — How the period went. Three figures, each against the previous window. */}
      <MetricRow label={`Zeitraum im Vergleich zum ${comparisonLabel}`} columns={3}>
        <PrimaryMetric
          label="Umsatz"
          icon={Euro}
          value={formatCents(totals.revenueCents)}
          current={totals.revenueCents}
          previous={previous.revenueCents}
          comparisonLabel={comparisonLabel}
          direction="up-good"
          format={(value) => formatCents(value)}
          spark={trend.map((point) => point.revenueCents)}
          footnote={`Ø ${formatCents(totals.averageBookingValueCents)} je bezahlter Buchung`}
        />
        <PrimaryMetric
          label="Buchungen"
          icon={CalendarRange}
          value={formatCount(totals.bookingCount)}
          current={totals.bookingCount}
          previous={previous.bookingCount}
          comparisonLabel={comparisonLabel}
          direction="up-good"
          format={(value) => formatCount(value)}
          spark={trend.map((point) => point.bookingCount)}
          footnote={`${formatCount(totals.paidCount)} bezahlt · ${formatCount(bookings.free)} kostenlos`}
        />
        <PrimaryMetric
          label="Erstattungen und Stornos"
          icon={Receipt}
          value={formatCount(totals.refundedCount + totals.cancelledCount)}
          current={totals.refundedCount + totals.cancelledCount}
          previous={previous.refundedCount + previous.cancelledCount}
          comparisonLabel={comparisonLabel}
          // More cancellations is bad news, so the arrow's colour has to invert.
          direction="up-bad"
          format={(value) => formatCount(value)}
          footnote={`${formatCount(totals.refundedCount)} erstattet · ${formatCount(totals.cancelledCount)} storniert`}
        />
      </MetricRow>

      {quiet ? (
        <EmptyState
          icon={CalendarRange}
          title="Keine Daten im gewählten Zeitraum"
          description="Für diesen Zeitraum liegen keine Buchungen vor. Wählen Sie einen anderen Zeitraum. Offene Rechnungen, Abgleich und Meldungen oben gelten unabhängig vom Zeitraum."
        />
      ) : (
        <>
          {/* 3 — Trend. */}
          <Panel
            title="Umsatz- und Buchungsverlauf"
            description={`${formatDayRange(snapshot.bounds.start, snapshot.bounds.end)} · Balken zeigen Umsatz, die Marke die Anzahl Buchungen.`}
          >
            <TrendChart data={trend} emptyLabel="Keine Bewegung im Zeitraum." />
          </Panel>

          {/* 4 — Where the money came from, and whether it arrived. */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Zahlungswege" description="Woher der Umsatz im Zeitraum kam.">
              <CompositionBar
                slices={providerSlices}
                emptyLabel="Kein Umsatz im Zeitraum."
                totalLabel={`Gesamt ${formatCents(revenue.totalCents)}`}
              />
            </Panel>
            <Panel title="Zahlungsstatus" description="Ob das Geld tatsächlich angekommen ist.">
              <CompositionBar
                slices={statusSlices}
                emptyLabel="Keine Zahlungen im Zeitraum."
                totalLabel={`${formatCount(bookings.total)} Buchungen im Zeitraum`}
              />
            </Panel>
          </div>

          {/* 5 — Utilisation and tax, side by side: the two things the close depends on. */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <Panel
              title="Platzauslastung"
              description="Belegte Slots je Platz, meistgenutzter Platz hervorgehoben."
            >
              <RankedBars rows={courtRows} emptyLabel="Keine Platzbelegung im Zeitraum." />
            </Panel>

            {/* A table, not a composition bar. The tax position is four related figures per
                category — net, VAT and a count — and a chart that showed only the share would drop
                the two columns the monthly close is actually reconciled against. */}
            <Panel
              title="Umsatzsteuer"
              description="Padel wird nach Mitgliedschaft besteuert, Tennis ist steuerfrei."
              action={
                vat.unresolvedCount > 0 ? (
                  <StatusBadge
                    label={`${formatCount(vat.unresolvedCount)} ungeklärt`}
                    tone="warning"
                  />
                ) : (
                  <StatusBadge label="Alle klassifiziert" tone="success" />
                )
              }
            >
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full text-left" style={{ minWidth: 420 }}>
                  <caption className="sr-only">Umsatzsteuer nach Steuerkategorie</caption>
                  <thead>
                    <tr className="border-b border-[var(--cq-border)]">
                      <th scope="col" className={cn('py-2 pr-4', text.eyebrow)}>Kategorie</th>
                      <th scope="col" className={cn('px-3 py-2 text-right', text.eyebrow)}>Buchungen</th>
                      <th scope="col" className={cn('px-3 py-2 text-right', text.eyebrow)}>Netto</th>
                      <th scope="col" className={cn('py-2 pl-3 text-right', text.eyebrow)}>MwSt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vat.categories.map((stat) => (
                      <tr key={stat.category} className="border-b border-[var(--cq-border-subtle)] last:border-0">
                        <th scope="row" className="py-2 pr-4 text-[13px] font-normal leading-5 text-[var(--cq-fg)]">
                          {taxCategoryLabels[stat.category]}
                        </th>
                        <td className={cn('px-3 py-2 text-right text-[13px] leading-5', text.numeric)}>
                          {formatCount(stat.bookingCount)}
                        </td>
                        <td className={cn('px-3 py-2 text-right text-[13px] leading-5', text.numeric)}>
                          {formatCents(stat.netCents)}
                        </td>
                        <td className={cn('py-2 pl-3 text-right text-[13px] leading-5', text.numeric)}>
                          {formatCents(stat.vatCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--cq-border)]">
                      <th scope="row" className={cn('py-2 pr-4 text-left', text.eyebrow)}>
                        MwSt. gesamt
                      </th>
                      <td colSpan={3} className={cn('py-2 pl-3 text-right', text.bodyStrong, text.numeric)}>
                        {formatCents(vat.totalVatCents)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {vat.unresolvedCount > 0 ? (
                <p className={cn('mt-3', text.hint)}>
                  {formatCount(vat.unresolvedCount)} Padel-Buchungen ohne geklärte Mitgliedschaft sind
                  in keiner Kategorie enthalten und blockieren den Monatsabschluss.
                </p>
              ) : null}
            </Panel>
          </div>
        </>
      )}

      {/* 6 — Standing figures. These are dataset-wide, not period-scoped: a receivable does not
          stop being open because the reader narrowed the window. Each is a way into its section. */}
      <MetricRow label="Forderungen, Abgleich und Meldungen (gesamter Datenbestand)">
        <Metric
          label="Offene Rechnungen"
          value={formatCount(invoices.open)}
          hint={`${formatCents(invoices.outstandingCents)} ausstehend`}
          onSelect={() => onOpenTarget({ section: 'invoices', filter: { status: 'open' } })}
          selectLabel="Offene Rechnungen in Rechnungen öffnen"
        />
        <Metric
          label="Überfällig"
          value={formatCount(invoices.overdue)}
          tone={invoices.overdue > 0 ? 'negative' : 'neutral'}
          hint="Fälligkeit überschritten"
          onSelect={() => onOpenTarget({ section: 'invoices', filter: { status: 'open' } })}
          selectLabel="Überfällige Rechnungen in Rechnungen öffnen"
        />
        <Metric
          label="Offene Prüfungen"
          value={formatCount(reconciliation.openReview)}
          tone={reconciliation.openReview > 0 ? 'negative' : 'neutral'}
          hint={`${formatCents(reconciliation.moneyToRecoverCents)} nachzufordern`}
          onSelect={() => onOpenTarget({ section: 'reconciliation', filter: {} })}
          selectLabel="Offene Prüfungen im Zahlungsabgleich öffnen"
        />
        <Metric
          label="Offene Meldungen"
          value={formatCount(openAlertTotal)}
          tone={openAlertTotal > 0 ? 'negative' : 'neutral'}
          hint={
            criticalAlerts > 0
              ? `${formatCount(criticalAlerts)} kritisch`
              : 'keine kritischen Meldungen'
          }
          onSelect={() => onOpenTarget({ section: 'alerts', filter: { status: 'unresolved' } })}
          selectLabel="Offene Meldungen im Alert Center öffnen"
        />
      </MetricRow>

      <MetricStrip
        items={[
          { label: 'Eingezogen', value: formatCents(invoices.collectedCents), hint: `${formatCount(invoices.paid)} Rechnungen` },
          { label: 'Entwürfe', value: formatCount(invoices.draft), hint: 'noch nicht versendet' },
          { label: 'Geprüfte Zahlungen', value: formatCount(reconciliation.totalPayments), hint: `${formatCount(reconciliation.matched)} abgeglichen` },
          { label: 'Erstattet gesamt', value: formatCents(reconciliation.refundedTotalCents), hint: 'alle Vorgänge' },
        ]}
      />

      {/* 7 — What just happened. */}
      <Panel
        title="Letzte Aktivität"
        description="Operative Ereignisse im gewählten Zeitraum, neueste zuerst."
      >
        {activity.length === 0 ? (
          <p className={text.hint}>Keine Aktivität im gewählten Zeitraum.</p>
        ) : (
          <ol className="relative space-y-3.5">
            {activity.map((entry, index) => (
              <li key={entry.id} className="relative flex gap-3 pl-1">
                {/* Connector between events, stopping before the last so the line does not dangle. */}
                {index < activity.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[-14px] left-[7px] top-4 w-px bg-[var(--cq-border)]"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--cq-fg-subtle)] ring-4',
                    'ring-[var(--cq-surface)]',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className={text.body}>{entry.summary}</span>
                    <span className={cn('shrink-0 tabular-nums', text.hint)}>
                      {formatDateTime(entry.occurredAt)}
                    </span>
                  </div>
                  <span className={cn('mt-0.5 inline-block', text.hint)}>
                    {activityKindLabels[entry.kind]}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

/**
 * Fixed palette index per payment status, so a status keeps its colour across every page that
 * charts it. Derived colouring by array position would recolour "Fehlgeschlagen" whenever a status
 * above it dropped out of the data.
 */
const statusTone: Partial<Record<string, number>> = {
  paid: 2,
  pending: 3,
  refunded: 1,
  failed: 0,
  not_required: 4,
};
