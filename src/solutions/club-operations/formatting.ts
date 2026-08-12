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

/**
 * "2026-03-02" -> "02.03." — a chart axis tick.
 *
 * Built from the string parts rather than a Date, because a chart bucket key is already a calendar
 * date and parsing it back into a Date would reintroduce the timezone shift the key exists to avoid.
 */
export function formatDayTick(dayKey: string): string {
  const [, month, day] = dayKey.split('-');
  return month && day ? `${day}.${month}.` : dayKey;
}

/** "2026-03-02" -> "02.03.2026". Same reasoning as `formatDayTick`. */
export function formatDayKey(dayKey: string): string {
  const [year, month, day] = dayKey.split('-');
  return year && month && day ? `${day}.${month}.${year}` : dayKey;
}

/** Inclusive window as "01.03.2026 – 31.03.2026". */
export function formatDayRange(start: string, end: string): string {
  return start === end ? formatDayKey(start) : `${formatDayKey(start)} – ${formatDayKey(end)}`;
}

/**
 * Signed percentage change, or null when the baseline is zero.
 *
 * Null rather than Infinity or 100: growth from nothing has no meaningful rate, and rendering one
 * invites the reader to compare it against rates that do.
 */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** "+12,4 %" / "−8,0 %". Uses a real minus sign, not a hyphen. */
export function formatSignedPercent(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(fractionDigits).replace('.', ',')} %`;
}

/** Share of `part` in `total`, 0–100, guarding division by zero. */
export function percentOf(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return (part / total) * 100;
}
