// Booking filter bar: search, date range, status, court.
//
// Every control is labelled and keyboard reachable. The reset button only appears once something is
// actually filtered, so the bar stays quiet in its resting state.

import { Search, X } from 'lucide-react';

import { Button, Field } from '@/components/dashboard/primitives';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { text } from '@/components/dashboard/tokens';

import { activeFilterCount } from '../filtering';
import { bookingStatusLabels, courtLabels } from '../labels';
import type { BookingQuery, BookingStatus, CourtKey } from '../types';
import { bookingStatuses, courtKeys } from '../types';

const statusOptions = [
  { value: 'all', label: 'Alle Status' },
  ...bookingStatuses.map((status: BookingStatus) => ({
    value: status,
    label: bookingStatusLabels[status],
  })),
];

const courtOptions = [
  { value: 'all', label: 'Alle Plätze' },
  ...courtKeys.map((court: CourtKey) => ({ value: court, label: courtLabels[court] })),
];

export function BookingFilters({
  query,
  onChange,
  onReset,
  resultCount,
}: {
  query: BookingQuery;
  onChange: (next: BookingQuery) => void;
  onReset: () => void;
  resultCount: number;
}) {
  const activeCount = activeFilterCount(query);
  const patch = (partial: Partial<BookingQuery>) => onChange({ ...query, ...partial });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="sm:col-span-2 xl:col-span-1">
          <Field
            id="club-ops-booking-search"
            label="Suche"
            value={query.search ?? ''}
            onChange={(value) => patch({ search: value })}
            placeholder="Name oder Referenz"
          />
        </div>
        <Field
          id="club-ops-booking-from"
          label="Von"
          type="date"
          value={query.dateFrom ?? ''}
          onChange={(value) => patch({ dateFrom: value })}
        />
        <Field
          id="club-ops-booking-to"
          label="Bis"
          type="date"
          value={query.dateTo ?? ''}
          onChange={(value) => patch({ dateTo: value })}
        />
        <PremiumSelect
          id="club-ops-booking-status"
          label="Status"
          value={query.status ?? 'all'}
          onChange={(value) => patch({ status: value as BookingQuery['status'] })}
          options={statusOptions}
        />
        <PremiumSelect
          id="club-ops-booking-court"
          label="Platz"
          value={query.court ?? 'all'}
          onChange={(value) => patch({ court: value as BookingQuery['court'] })}
          options={courtOptions}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={text.hint} role="status">
          <Search size={12} className="mr-1 inline align-[-1px]" aria-hidden="true" />
          {resultCount === 1 ? '1 Buchung' : `${resultCount} Buchungen`}
          {activeCount > 0 ? ` · ${activeCount === 1 ? '1 Filter aktiv' : `${activeCount} Filter aktiv`}` : ''}
        </p>
        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" icon={X} onClick={onReset}>
            Filter zurücksetzen
          </Button>
        ) : null}
      </div>
    </div>
  );
}
