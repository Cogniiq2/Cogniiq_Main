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

/** German timestamp for document footers, e.g. "31.12.2026 14:05". */
export function formatTimestampDe(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
