// Club Operations — Buchungen.
//
// Read-only bookings workspace. The filter query is the single source of truth and is handed to the
// adapter, so filtering already runs where it will eventually run for real: behind the adapter
// boundary, not in the component.

import { useCallback, useMemo, useState } from 'react';
import { CalendarRange, SearchX } from 'lucide-react';

import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  SectionHeader,
  StatusBadge,
  TableSkeleton,
  type Column,
} from '@/components/dashboard/primitives';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { BookingDetailPanel } from '../components/BookingDetailPanel';
import { BookingFilters } from '../components/BookingFilters';
import { isEmptyQuery } from '../filtering';
import { formatCents, formatDate, formatTimeRange } from '../formatting';
import {
  bookingStatusLabels,
  bookingStatusTones,
  courtLabel,
  paymentStatusLabels,
  paymentStatusTones,
  taxCategoryLabels,
} from '../labels';
import type { Booking, BookingPage, BookingQuery } from '../types';
import { emptyBookingQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

export function BookingsSection({ adapter }: { adapter: ClubOperationsAdapter }) {
  const [query, setQuery] = useState<BookingQuery>(emptyBookingQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, dateFrom, dateTo, status, court } = query;
  const { status: loadStatus, data, error, reload } = useClubOperationsResource<BookingPage>(
    () => adapter.listBookings({ search, dateFrom, dateTo, status, court }),
    [adapter, search, dateFrom, dateTo, status, court],
  );

  // Memoised so the empty-array fallback keeps a stable identity between renders.
  const bookings = useMemo(() => data?.bookings ?? [], [data]);
  const selected = useMemo(
    () => bookings.find((booking) => booking.id === selectedId) ?? null,
    [bookings, selectedId],
  );

  const reset = useCallback(() => {
    setQuery(emptyBookingQuery);
    setSelectedId(null);
  }, []);

  const columns: Column<Booking>[] = useMemo(
    () => [
      {
        key: 'reference',
        header: 'Referenz',
        render: (row) => <span className={text.bodyStrong}>{row.reference}</span>,
        hideOnMobile: true,
      },
      {
        key: 'customer',
        header: 'Kunde',
        render: (row) => <span className="break-words">{row.customerName}</span>,
        hideOnMobile: true,
      },
      { key: 'court', header: 'Platz', render: (row) => courtLabel(row.court) },
      {
        key: 'date',
        header: 'Datum',
        render: (row) => (
          <span className="whitespace-nowrap">
            {formatDate(row.startsAt)}
            <span className={cn('ml-2', text.hint)}>{formatTimeRange(row.startsAt, row.endsAt)}</span>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <StatusBadge label={bookingStatusLabels[row.status]} tone={bookingStatusTones[row.status]} />
        ),
      },
      {
        key: 'payment',
        header: 'Zahlung',
        render: (row) => (
          <StatusBadge
            label={paymentStatusLabels[row.paymentStatus]}
            tone={paymentStatusTones[row.paymentStatus]}
          />
        ),
      },
      {
        key: 'tax',
        header: 'Steuer',
        render: (row) => <span className={text.hint}>{taxCategoryLabels[row.taxCategory]}</span>,
      },
      {
        key: 'amount',
        header: 'Betrag',
        align: 'right',
        render: (row) => formatCents(row.amountCents, row.currency),
      },
    ],
    [],
  );

  return (
    <div className={space.pageGap}>
      <SectionHeader
        title="Buchungen"
        description="Alle Platzbuchungen im Verein durchsuchen und filtern."
      />

      <Card className={space.cardPadding}>
        <BookingFilters
          query={query}
          onChange={setQuery}
          onReset={reset}
          resultCount={data?.total ?? 0}
        />
      </Card>

      {loadStatus === 'loading' ? (
        <div role="status" aria-label="Buchungen werden geladen">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : null}

      {loadStatus === 'error' ? (
        <ErrorState
          title="Buchungen konnten nicht geladen werden"
          message={error ?? 'Unbekannter Fehler.'}
          onRetry={reload}
        />
      ) : null}

      {loadStatus === 'ready' && bookings.length === 0 ? (
        isEmptyQuery(query) ? (
          <EmptyState
            icon={CalendarRange}
            title="Noch keine Buchungen"
            description="Sobald Buchungen vorliegen, erscheinen sie hier."
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Keine Buchungen für diese Filter"
            description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen."
          />
        )
      ) : null}

      {loadStatus === 'ready' && bookings.length > 0 ? (
        <div className={cn('grid gap-4', selected && 'xl:grid-cols-[minmax(0,1fr)_340px]')}>
          <div className="min-w-0">
            <DataTable
              columns={columns}
              rows={bookings}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedId(row.id)}
              mobileTitle={(row) => row.customerName}
              mobileSubtitle={(row) => `${row.reference} · ${courtLabel(row.court)}`}
              minWidth={880}
            />
          </div>
          {selected ? (
            <BookingDetailPanel booking={selected} onClose={() => setSelectedId(null)} />
          ) : null}
        </div>
      ) : null}

      <p className={text.hint}>
        Beispieldaten zur Ansicht des Aufbaus. Es besteht keine Verbindung zu einem Live-System.
        Änderungen an Buchungen, Zahlungen oder Rechnungen sind in dieser Ausbaustufe nicht möglich.
      </p>
    </div>
  );
}
