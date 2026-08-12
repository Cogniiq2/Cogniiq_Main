// Booking detail, shown beside (desktop) or below (mobile) the table.
//
// Read-only by construction: there is no action row. Tax override, cancellation, refund and
// invoice creation all exist in the reference dashboard and are all deliberately absent until each
// has an independently authorised, audited server-side write behind it.

import { X } from 'lucide-react';

import { Card, IconButton, StatusBadge } from '@/components/dashboard/primitives';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { formatCents, formatDate, formatTimeRange } from '../formatting';
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
import type { Booking } from '../types';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
      <dt className={cn('shrink-0', text.eyebrow)}>{label}</dt>
      <dd className={cn('min-w-0 text-right', text.body)}>{children}</dd>
    </div>
  );
}

export function BookingDetailPanel({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <Card className={space.cardPadding} as="section">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={text.eyebrow}>Buchung</p>
          <h3 className={cn('mt-0.5 break-words', text.cardTitle)}>{booking.reference}</h3>
        </div>
        <IconButton icon={X} label="Detailansicht schließen" variant="ghost" onClick={onClose} />
      </div>

      <dl className="divide-y divide-[var(--cq-border-subtle)]">
        <Row label="Kunde">
          <span className="break-words">{booking.customerName}</span>
        </Row>
        <Row label="Platz">{courtLabel(booking.court)}</Row>
        <Row label="Datum">{formatDate(booking.startsAt)}</Row>
        <Row label="Zeit">{formatTimeRange(booking.startsAt, booking.endsAt)}</Row>
        <Row label="Status">
          <StatusBadge
            label={bookingStatusLabels[booking.status]}
            tone={bookingStatusTones[booking.status]}
          />
        </Row>
        <Row label="Zahlungsstatus">
          <StatusBadge
            label={paymentStatusLabels[booking.paymentStatus]}
            tone={paymentStatusTones[booking.paymentStatus]}
          />
        </Row>
        <Row label="Zahlungsweg">{paymentProviderLabels[booking.provider]}</Row>
        <Row label="Betrag">
          <span className={text.numeric}>{formatCents(booking.amountCents, booking.currency)}</span>
        </Row>
        <Row label="Mitgliedschaft">{membershipLabels[booking.membership]}</Row>
        <Row label="Steuerkategorie">
          <StatusBadge
            label={taxCategoryLabels[booking.taxCategory]}
            tone={taxCategoryTones[booking.taxCategory]}
          />
        </Row>
        <Row label="Steuersatz">
          {booking.taxRatePercent == null ? '—' : `${booking.taxRatePercent} %`}
        </Row>
        <Row label="Flutlicht">{booking.lightsRequested ? 'Angefordert' : 'Nicht angefordert'}</Row>
      </dl>
    </Card>
  );
}
