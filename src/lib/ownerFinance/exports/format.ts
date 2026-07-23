// Deterministic German-locale formatting helpers for finance exports and generated documents.
// Amounts are stored as integer cents and quantities as integer milli-units; formatting never uses
// floating point on the stored value except at the final division for display. These helpers are
// pure and dependency-free so they run identically in the browser and in the node test harness.

/** Group thousands with a dot and use a comma decimal separator (de-DE), fixed to `fractionDigits`. */
export function formatDecimalDe(value: number, fractionDigits = 2): string {
  const neg = value < 0;
  const abs = Math.abs(value);
  const factor = 10 ** fractionDigits;
  const rounded = Math.round(abs * factor) / factor;
  const [intPart, fracPart = ''] = rounded.toFixed(fractionDigits).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const out = fractionDigits > 0 ? `${grouped},${fracPart}` : grouped;
  return neg && rounded !== 0 ? `-${out}` : out;
}

/** Cents → "1.234,56" (no currency symbol). */
export function formatCentsPlain(cents: number): string {
  return formatDecimalDe(cents / 100, 2);
}

/** Cents → "1.234,56 €" using the given ISO currency (symbol appended, German convention). */
export function formatCentsCurrencyDe(cents: number, currency = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency;
  return `${formatCentsPlain(cents)} ${symbol}`;
}

/** Milli-units → "1,5" (trailing zeros trimmed, max 3 decimals). Used for quantities. */
export function formatQuantityMilli(milli: number): string {
  const value = milli / 1000;
  const s = formatDecimalDe(value, 3);
  // Trim trailing zeros in the fractional part but keep at least the integer part.
  return s.replace(/(,\d*?)0+$/, '$1').replace(/,$/, '');
}

/** Basis points → "19 %" (whole where possible, otherwise up to 2 decimals, trailing zeros trimmed). */
export function formatBpPercentDe(bp: number): string {
  const pct = bp / 100;
  const s = Number.isInteger(pct)
    ? String(pct)
    : formatDecimalDe(pct, 2).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '');
  return `${s} %`;
}

// Customer-facing dates and times are displayed in Germany's civil time zone. Raw values stay in
// UTC in the database (timestamptz); only the *display* is converted. `Intl` applies the correct
// CET/CEST (MEZ/MESZ) offset for the given instant, so daylight-saving transitions are handled
// automatically and a near-midnight UTC timestamp shows the right Berlin calendar day.
export const BERLIN_TIME_ZONE = 'Europe/Berlin';

interface BerlinParts { day: string; month: string; year: string; hour: string; minute: string; zone: string }

function berlinParts(value: string | Date): BerlinParts | null {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('de-DE', {
    timeZone: BERLIN_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: get('day'), month: get('month'), year: get('year'), hour: get('hour'), minute: get('minute'), zone: get('timeZoneName') };
}

/**
 * Berlin-local calendar date of an INSTANT (a UTC timestamp / timestamptz). Use this for
 * timestamp values whose civil date matters to the customer — e.g. the acceptance date — because
 * a late-evening UTC timestamp belongs to the next day in Berlin. A pure date column (no time)
 * has no instant and must use `formatDateDe` instead.
 */
export function formatDateDeFromInstant(value: string | Date | null | undefined): string {
  if (!value) return '';
  const p = berlinParts(value);
  return p ? `${p.day}.${p.month}.${p.year}` : String(value);
}

/**
 * Machine-readable ISO date (YYYY-MM-DD) passthrough. Exports must use machine-readable dates in
 * data columns; German display formatting is reserved for rendered documents, not CSV/XLSX values.
 */
export function isoDate(value: string | null | undefined): string {
  if (!value) return '';
  // Accept already-ISO values and full timestamps; keep only the date component.
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m ? m[1] : value;
}

/** Human German date "31.12.2026" for rendered documents (not for data columns). */
export function formatDateDe(value: string | null | undefined): string {
  const iso = isoDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * German date + time in Germany's civil time zone for document footers, e.g.
 * "31.12.2026, 14:05 Uhr (MEZ)". The zone label (MEZ/MESZ) is included because a bare wall-clock
 * time on a dated artifact is otherwise ambiguous; the correct label for the instant is chosen
 * automatically across the daylight-saving boundary.
 */
export function formatTimestampDe(value: string | Date): string {
  const p = berlinParts(value);
  if (!p) return String(value);
  return `${p.day}.${p.month}.${p.year}, ${p.hour}:${p.minute} Uhr (${p.zone})`;
}
