// Club Operations — Übersicht.
//
// Read-only operational picture. There are no action buttons anywhere in this section by design:
// every mutation in the reference dashboard needs its own server-side permission check and audit
// trail before it can appear here.

import { Activity, CalendarRange, Euro, Receipt } from 'lucide-react';

import {
  Card,
  EmptyState,
  ErrorState,
  KpiCard,
  KpiSkeletonGrid,
  SectionHeader,
  Skeleton,
  StatusBadge,
} from '@/components/dashboard/primitives';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { DistributionList, type DistributionRow } from '../components/DistributionList';
import { formatCents, formatCount, formatDateTime, formatPercent, percentOf } from '../formatting';
import {
  activityKindLabels,
  courtLabel,
  overviewPeriodLabels,
  paymentStatusLabels,
  taxCategoryLabels,
} from '../labels';
import type { OverviewPeriod, OverviewSnapshot } from '../types';
import { overviewPeriods } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

const periodOptions = overviewPeriods.map((period) => ({
  value: period,
  label: overviewPeriodLabels[period],
}));

export function OverviewSection({
  adapter,
  period,
  onPeriodChange,
}: {
  adapter: ClubOperationsAdapter;
  period: OverviewPeriod;
  onPeriodChange: (period: OverviewPeriod) => void;
}) {
  const { status, data, error, reload } = useClubOperationsResource<OverviewSnapshot>(
    () => adapter.getOverview({ period }),
    [adapter, period],
  );

  return (
    <div className={space.pageGap}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title="Übersicht"
          description="Operativer Überblick über Umsatz, Buchungen, Zahlungen und Umsatzsteuer."
        />
        <div className="w-full sm:w-56">
          <PremiumSelect
            id="club-ops-period"
            label="Zeitraum"
            value={period}
            onChange={(value) => onPeriodChange(value as OverviewPeriod)}
            options={periodOptions}
          />
        </div>
      </div>

      {status === 'loading' ? <OverviewSkeleton /> : null}

      {status === 'error' ? (
        <ErrorState
          title="Übersicht konnte nicht geladen werden"
          message={error ?? 'Unbekannter Fehler.'}
          onRetry={reload}
        />
      ) : null}

      {status === 'ready' && data ? <OverviewContent snapshot={data} /> : null}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className={space.pageGap} role="status" aria-label="Übersicht wird geladen">
      <KpiSkeletonGrid count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className={space.cardPadding}>
            <Skeleton className="h-3 w-32" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row}>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="mt-2 h-1.5 w-full" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OverviewContent({ snapshot }: { snapshot: OverviewSnapshot }) {
  const { revenue, bookings, paymentStatus, vat, courts, activity } = snapshot;

  if (bookings.total === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Keine Daten im gewählten Zeitraum"
        description="Für diesen Zeitraum liegen keine Buchungen vor. Wählen Sie einen anderen Zeitraum, um Kennzahlen zu sehen."
      />
    );
  }

  const paymentRows: DistributionRow[] = paymentStatus.map((slice) => ({
    key: slice.status,
    label: paymentStatusLabels[slice.status],
    percent: percentOf(slice.count, bookings.total),
    value: formatCount(slice.count),
    hint: slice.amountCents > 0 ? formatCents(slice.amountCents) : undefined,
  }));

  const courtRows: DistributionRow[] = courts.map((court) => ({
    key: court.court,
    label: courtLabel(court.court),
    percent: court.utilizationPercent,
    value: formatPercent(court.utilizationPercent),
    hint: `${formatCount(court.bookingCount)} Buchungen · ${formatCents(court.revenueCents)}`,
  }));

  return (
    <div className={space.pageGap}>
      {/* Umsatz */}
      <section aria-labelledby="club-ops-revenue" className={space.sectionGap}>
        <h3 id="club-ops-revenue" className={text.eyebrow}>Umsatz</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Gesamtumsatz" valueCents={revenue.totalCents} icon={Euro} tone="positive" />
          <KpiCard label="Ø Buchungswert" valueCents={revenue.averageBookingValueCents} icon={Euro} />
          <KpiCard label="Buchungen gesamt" value={formatCount(bookings.total)} icon={CalendarRange} />
          <KpiCard
            label="MwSt. gesamt"
            valueCents={vat.totalVatCents}
            icon={Receipt}
            hint={vat.unresolvedCount > 0 ? `${formatCount(vat.unresolvedCount)} ungeklärt` : 'Alle klassifiziert'}
          />
        </div>
      </section>

      {/* Buchungen */}
      <section aria-labelledby="club-ops-bookings-kpi" className={space.sectionGap}>
        <h3 id="club-ops-bookings-kpi" className={text.eyebrow}>Buchungen</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Bezahlt" value={formatCount(bookings.paid)} />
          <KpiCard label="Kostenlos" value={formatCount(bookings.free)} />
          <KpiCard label="Storniert" value={formatCount(bookings.cancelled)} />
          <KpiCard
            label="Umsatz nach Anbieter"
            value={formatCount(revenue.byProvider.length)}
            hint="Aktive Zahlungswege"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={space.cardPadding}>
          <SectionHeader title="Zahlungsstatus" description="Verteilung aller Buchungen im Zeitraum." />
          <div className="mt-4">
            <DistributionList rows={paymentRows} emptyLabel="Keine Zahlungen im Zeitraum." />
          </div>
        </Card>

        <Card className={space.cardPadding}>
          <SectionHeader title="Platzauslastung" description="Belegung und Umsatz je Platz." />
          <div className="mt-4">
            <DistributionList rows={courtRows} emptyLabel="Keine Platzbelegung im Zeitraum." />
          </div>
        </Card>
      </div>

      {/* Umsatzsteuer */}
      <Card className={space.cardPadding}>
        <SectionHeader
          title="Umsatzsteuer"
          description="Padel wird nach Mitgliedschaft besteuert, Tennis ist steuerfrei."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 520 }}>
            <caption className="sr-only">Umsatzsteuer nach Steuerkategorie</caption>
            <thead>
              <tr className="border-b border-[var(--cq-border)]">
                <th scope="col" className={cn('py-2.5 pr-4', text.eyebrow)}>Kategorie</th>
                <th scope="col" className={cn('py-2.5 px-4 text-right', text.eyebrow)}>Buchungen</th>
                <th scope="col" className={cn('py-2.5 px-4 text-right', text.eyebrow)}>Netto</th>
                <th scope="col" className={cn('py-2.5 pl-4 text-right', text.eyebrow)}>MwSt.</th>
              </tr>
            </thead>
            <tbody>
              {vat.categories.map((stat) => (
                <tr key={stat.category} className="border-b border-[var(--cq-border-subtle)] last:border-0">
                  <th scope="row" className="py-2.5 pr-4 text-[13px] font-normal leading-5 text-[var(--cq-fg)]">
                    {taxCategoryLabels[stat.category]}
                  </th>
                  <td className={cn('py-2.5 px-4 text-right text-[13px] leading-5', text.numeric)}>
                    {formatCount(stat.bookingCount)}
                  </td>
                  <td className={cn('py-2.5 px-4 text-right text-[13px] leading-5', text.numeric)}>
                    {formatCents(stat.netCents)}
                  </td>
                  <td className={cn('py-2.5 pl-4 text-right text-[13px] leading-5', text.numeric)}>
                    {formatCents(stat.vatCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vat.unresolvedCount > 0 ? (
          <p className={cn('mt-3', text.hint)}>
            {formatCount(vat.unresolvedCount)} Padel-Buchungen ohne geklärte Mitgliedschaft. Die
            Klärung erfolgt in einer späteren Ausbaustufe.
          </p>
        ) : null}
      </Card>

      {/* Aktivität */}
      <Card className={space.cardPadding}>
        <SectionHeader title="Letzte Aktivität" description="Jüngste operative Ereignisse." />
        <ul className="mt-4 space-y-3">
          {activity.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <StatusBadge label={activityKindLabels[entry.kind]} tone="neutral" />
              <span className={cn('min-w-0 flex-1', text.body)}>{entry.summary}</span>
              <span className={cn('shrink-0', text.hint)}>{formatDateTime(entry.occurredAt)}</span>
            </li>
          ))}
        </ul>
        {activity.length === 0 ? <p className={cn('mt-3', text.hint)}>Keine Aktivität im Zeitraum.</p> : null}
      </Card>

      <p className={text.hint}>
        <Activity size={12} className="mr-1 inline align-[-1px]" aria-hidden="true" />
        Beispieldaten zur Ansicht des Aufbaus. Es besteht keine Verbindung zu einem Live-System.
      </p>
    </div>
  );
}
