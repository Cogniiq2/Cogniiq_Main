// Pure formatting helpers. No I/O, no environment access, no dependency on the adapter.
//
// Money arrives as integer cents and is rendered in de-DE. The reference dashboard formatted euro
// floats directly, which is why its helpers could not be reused verbatim: doing arithmetic on
// floats before formatting is exactly the rounding hazard the cents convention exists to avoid.

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

/** Integer cents -> "1.234,56 €". Non-finite input renders as an em dash, never as NaN. */
export function formatCents(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null || !Number.isFinite(cents)) return '—';
  return currencyFormatter(currency).format(cents / 100);
}

const numberFormatter = new Intl.NumberFormat('de-DE');

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return numberFormatter.format(value);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(fractionDigits).replace('.', ',')} %`;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
});

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? dateFormatter.format(date) : '—';
}

export function formatTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? timeFormatter.format(date) : '—';
}

export function formatDateTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? `${dateFormatter.format(date)}, ${timeFormatter.format(date)}` : '—';
}

/** "14:00 – 15:30". Both ends must parse, otherwise an em dash. */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
  const start = toDate(startIso);
  const end = toDate(endIso);
  if (!start || !end) return '—';
  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

/**
 * Local calendar date (YYYY-MM-DD) of an ISO timestamp.
 *
 * Deliberately local rather than UTC: a 23:00 booking belongs to the day staff booked it for, and
 * slicing on the UTC date would move late-evening bookings into the next day for a German club.
 */
export function toLocalDateKey(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Share of `part` in `total`, 0–100, guarding division by zero. */
export function percentOf(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return (part / total) * 100;
}
