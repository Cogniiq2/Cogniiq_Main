// Club Operations — Buchungen.
//
// Read-only bookings workspace. The filter query is the single source of truth and is handed to the
// adapter, so filtering already runs where it will eventually run for real: behind the adapter
// boundary, not in the component.
//
// Composition: this is the section people arrive at with a name or a reference in hand, so search
// leads and everything else supports it. There is no metric row above the table — a booking search
// does not need a revenue total on top of it, and the previous layout's card grid pushed the first
// result below the fold. The date/time column carries the slot, which is the field staff actually
// scan for.

import { useCallback, useMemo, useState } from 'react';
import { CalendarRange, Lightbulb, SearchX } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { DetailLayout, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricStrip } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { SectionShell } from '../components/SectionShell';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, formatTimeRange } from '../formatting';
import {
  bookingStatusLabels,
  bookingStatusTones,
  courtLabel,
  membershipLabels,
  paymentProviderLabels,
  paymentStatusLabels,
  paymentStatusTones,
  taxCategoryLabels,
  taxCategoryTones,
} from '../labels';
import { bookingStatusOptions, courtOptions } from '../options';
import type { Booking, BookingPage, BookingQuery } from '../types';
import { bookingStatuses, emptyBookingQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

export function BookingsSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<BookingQuery>(() => withSeed(emptyBookingQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, dateFrom, dateTo, status, court } = query;
  const resource = useClubOperationsResource<BookingPage>(
    () => adapter.listBookings({ search, dateFrom, dateTo, status, court }),
    [adapter, search, dateFrom, dateTo, status, court],
  );

  const reset = useCallback(() => {
    setQuery(emptyBookingQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<BookingQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<Booking>[] = useMemo(
    () => [
      {
        key: 'reference',
        header: 'Referenz',
        width: '112px',
        render: (row) => <span className={cn(text.bodyStrong, 'tabular-nums')}>{row.reference}</span>,
        sortValue: (row) => row.reference,
        mobile: 'hidden',
      },
      {
        key: 'customer',
        header: 'Kunde',
        render: (row) => <span className="break-words">{row.customerName}</span>,
        sortValue: (row) => row.customerName,
        mobile: 'hidden',
      },
      {
        key: 'court',
        header: 'Platz',
        width: '116px',
        render: (row) => (
          <span className="inline-flex items-center gap-1.5">
            {courtLabel(row.court)}
            {row.lightsRequested ? (
              <Lightbulb
                size={11}
                className="shrink-0 text-amber-600"
                aria-label="Flutlicht angefordert"
              />
            ) : null}
          </span>
        ),
        sortValue: (row) => row.court,
        mobile: 'primary',
      },
      {
        key: 'date',
        header: 'Datum',
        width: '184px',
        render: (row) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(row.startsAt)}
            <span className={cn('ml-2', text.hint)}>{formatTimeRange(row.startsAt, row.endsAt)}</span>
          </span>
        ),
        sortValue: (row) => row.startsAt,
        mobile: 'primary',
      },
      {
        key: 'status',
        header: 'Status',
        width: '122px',
        render: (row) => (
          <StatusBadge label={bookingStatusLabels[row.status]} tone={bookingStatusTones[row.status]} />
        ),
        sortValue: (row) => bookingStatuses.indexOf(row.status),
        mobile: 'hidden',
      },
      {
        key: 'payment',
        header: 'Zahlung',
        width: '142px',
        render: (row) => (
          <StatusBadge
            label={paymentStatusLabels[row.paymentStatus]}
            tone={paymentStatusTones[row.paymentStatus]}
          />
        ),
        sortValue: (row) => paymentStatusLabels[row.paymentStatus],
        mobile: 'secondary',
      },
      {
        key: 'tax',
        header: 'Steuer',
        width: '186px',
        render: (row) => (
          <span
            className={
              row.taxCategory === 'padel_unresolved'
                ? 'text-[12.5px] font-medium leading-4 text-amber-700'
                : text.hint
            }
          >
            {taxCategoryLabels[row.taxCategory]}
          </span>
        ),
        sortValue: (row) => taxCategoryLabels[row.taxCategory],
        mobile: 'secondary',
      },
      {
        key: 'amount',
        header: 'Betrag',
        align: 'right',
        width: '108px',
        render: (row) => (
          <span className={row.amountCents > 0 ? text.bodyStrong : 'text-[var(--cq-fg-subtle)]'}>
            {row.amountCents > 0 ? formatCents(row.amountCents, row.currency) : 'kostenlos'}
          </span>
        ),
        sortValue: (row) => row.amountCents,
        mobile: 'primary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Buchungen"
      description="Alle Platzbuchungen durchsuchen und filtern — nach Kunde, Referenz, Zeitraum, Platz und Status."
      resource={resource}
      loadingLabel="Buchungen werden geladen"
      errorTitle="Buchungen konnten nicht geladen werden"
      notice="Änderungen an Buchungen, Zahlungen oder Rechnungen sind in dieser Ausbaustufe nicht möglich."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Buchung', 'Buchungen']}
          facets={[
            { kind: 'text', key: 'booking-search', label: 'Suche', value: search ?? '', placeholder: 'Kundenname oder Buchungsreferenz', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'booking-status', label: 'Status', value: status ?? 'all', options: bookingStatusOptions, onChange: (value) => patch({ status: value as BookingQuery['status'] }) },
            { kind: 'select', key: 'booking-court', label: 'Platz', value: court ?? 'all', options: courtOptions, onChange: (value) => patch({ court: value as BookingQuery['court'] }) },
            { kind: 'date', key: 'booking-from', label: 'Von', value: dateFrom ?? '', onChange: (value) => patch({ dateFrom: value }) },
            { kind: 'date', key: 'booking-to', label: 'Bis', value: dateTo ?? '', onChange: (value) => patch({ dateTo: value }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.bookings.find((booking) => booking.id === selectedId) ?? null;

        if (page.bookings.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={CalendarRange} title="Noch keine Buchungen" description="Sobald Buchungen vorliegen, erscheinen sie hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Buchungen für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const paid = page.bookings.filter((booking) => booking.paymentStatus === 'paid');
        const unresolved = page.bookings.filter((booking) => booking.taxCategory === 'padel_unresolved');

        return (
          <div className={space.pageGap}>
            {/* One dense strip rather than a card grid: on a search page these are context, not
                the point of the page. */}
            <MetricStrip
              items={[
                { label: 'Umsatz im Filter', value: formatCents(paid.reduce((total, booking) => total + booking.amountCents, 0)), hint: `${formatCount(paid.length)} bezahlt` },
                { label: 'Storniert', value: formatCount(page.bookings.filter((booking) => booking.status === 'cancelled').length), hint: 'im aktuellen Filter' },
                { label: 'Kostenlos', value: formatCount(page.bookings.filter((booking) => booking.paymentStatus === 'not_required').length), hint: 'ohne Zahlung' },
                { label: 'Steuer ungeklärt', value: formatCount(unresolved.length), hint: unresolved.length > 0 ? 'blockiert den Abschluss' : 'alle klassifiziert' },
              ]}
            />

            <DetailLayout
              list={
                <RecordTable
                  caption="Platzbuchungen"
                  columns={columns}
                  rows={page.bookings}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) => `Buchung ${row.reference} von ${row.customerName}`}
                  mobileTitle={(row) => row.customerName}
                  mobileSubtitle={(row) => `${row.reference} · ${courtLabel(row.court)}`}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={bookingStatusLabels[row.status]}
                      tone={bookingStatusTones[row.status]}
                    />
                  )}
                  initialSort={{ key: 'date', direction: 'desc' }}
                  minWidth={1120}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Buchung"
                    title={selected.reference}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <>
                        <StatusBadge
                          label={bookingStatusLabels[selected.status]}
                          tone={bookingStatusTones[selected.status]}
                        />
                        <StatusBadge
                          label={paymentStatusLabels[selected.paymentStatus]}
                          tone={paymentStatusTones[selected.paymentStatus]}
                        />
                      </>
                    }
                    groups={[
                      {
                        label: 'Termin',
                        rows: [
                          { label: 'Kunde', value: <span className="break-words">{selected.customerName}</span> },
                          { label: 'Platz', value: courtLabel(selected.court) },
                          { label: 'Datum', value: <span className={text.numeric}>{formatDate(selected.startsAt)}</span> },
                          { label: 'Zeit', value: <span className={text.numeric}>{formatTimeRange(selected.startsAt, selected.endsAt)}</span> },
                          { label: 'Flutlicht', value: selected.lightsRequested ? 'Angefordert' : 'Nicht angefordert' },
                        ],
                      },
                      {
                        label: 'Abrechnung',
                        rows: [
                          { label: 'Zahlungsweg', value: paymentProviderLabels[selected.provider] },
                          { label: 'Betrag', value: <span className={cn(text.numeric, text.bodyStrong)}>{formatCents(selected.amountCents, selected.currency)}</span> },
                          { label: 'Mitgliedschaft', value: membershipLabels[selected.membership] },
                          {
                            label: 'Steuerkategorie',
                            value: (
                              <StatusBadge
                                label={taxCategoryLabels[selected.taxCategory]}
                                tone={taxCategoryTones[selected.taxCategory]}
                              />
                            ),
                          },
                          {
                            label: 'Steuersatz',
                            value: (
                              <span className={text.numeric}>
                                {selected.taxRatePercent == null ? '—' : `${selected.taxRatePercent} %`}
                              </span>
                            ),
                          },
                        ],
                      },
                    ]}
                  />
                ) : null
              }
            />
          </div>
        );
      }}
    </SectionShell>
  );
}
