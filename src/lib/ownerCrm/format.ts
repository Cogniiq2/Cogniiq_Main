/**
 * Local-time formatting for the CRM.
 *
 * `formatTimestampDe` in the finance exports renders UTC and says so, which is
 * exactly right for an invoice or offer footer: a legal document needs one
 * unambiguous instant that does not shift with the reader's clock.
 *
 * A follow-up is the opposite kind of fact. "Rückruf am 31.08. um 10:00" is a
 * time in the owner's day, and rendering it as "10:00 UTC" makes them do
 * timezone arithmetic to answer "is that before or after lunch". So the CRM
 * formats in the browser's timezone and does not label it — the same way a
 * calendar does.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** "31.08.2026 12:00", in the reader's own timezone. */
export function formatLocalDateTimeDe(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "31.08.2026", in the reader's own timezone. */
export function formatLocalDateDe(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * The value a `datetime-local` input expects: local wall-clock, no zone suffix.
 * Building this with `toISOString().slice(0, 16)` is the classic bug — it shows
 * the owner a UTC time in a field labelled as their own.
 */
export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * A euro amount as the owner typed it → cents.
 *
 * German and plain notation both have to work, and they disagree about what a
 * dot means. The rule:
 *
 *   - a comma present  → the comma is the decimal point and every dot is a
 *                        thousands separator ("1.234,56" = 123456)
 *   - no comma, and a single dot with one or two digits after it at the end
 *                      → that dot is the decimal point ("399.5" = 39950)
 *   - otherwise        → every dot is a thousands separator ("1.234" = 123400)
 *
 * The last case is the deliberate one: to a German owner typing into a field
 * whose placeholder reads "4.800,00", "1.234" means one thousand two hundred
 * thirty-four euros, not one euro twenty-three.
 *
 * An empty field stays empty rather than becoming 0: "no estimate yet" and
 * "estimated at nothing" are different answers, and only one of them is true.
 */
export function parseEuroToCents(input: string): number | null {
  const cleaned = input.replace(/[^0-9.,-]/g, '').trim();
  if (!cleaned) return null;

  const decimalIsDot = !cleaned.includes(',') && /^-?\d*\.\d{1,2}$/.test(cleaned);
  const normalized = decimalIsDot
    ? cleaned
    : cleaned.replace(/\./g, '').replace(',', '.');

  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Cents → the "1234,56" shape the euro inputs above round-trip. */
export function centsToEuroInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}
