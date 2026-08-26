/**
 * Canonical Auswertungszeitraum (reporting period) for the Steuern control center.
 *
 * The single place that maps a tax year + a period choice to an inclusive
 * YYYY-MM-DD range. Every consumer — the owner_tax_period_inputs call, the
 * UStVA/PDF/JSON exports, the recordExportRun audit entry and the on-screen
 * labels — resolves through here, so a period can never drift between what is
 * displayed and what is exported.
 *
 * These are German accounting calendar dates, not UTC instants. The strings are
 * assembled from the year and fixed month/day literals and are never routed
 * through `Date`, so no timezone offset can shift a boundary into the adjacent
 * quarter. Q1 always starts on Jan 1 and ends on Mar 31; Q4 always starts on
 * Oct 1 and ends on Dec 31 — including in leap years, since no quarter boundary
 * touches Feb 29.
 *
 * IMPORTANT: this is a reporting filter only. Selecting a quarter says nothing
 * about the owner's legal Voranmeldungszeitraum (filing frequency), which lives
 * in owner_tax_settings and is not touched here.
 */

export type TaxPeriodKey = 'year' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const TAX_PERIOD_KEYS: readonly TaxPeriodKey[] = ['year', 'Q1', 'Q2', 'Q3', 'Q4'] as const;

/** Inclusive month/day bounds per period. Fixed literals — no date arithmetic. */
const BOUNDS: Record<TaxPeriodKey, { from: string; to: string; short: string }> = {
  year: { from: '01-01', to: '12-31', short: 'Gesamtjahr' },
  Q1: { from: '01-01', to: '03-31', short: 'Q1' },
  Q2: { from: '04-01', to: '06-30', short: 'Q2' },
  Q3: { from: '07-01', to: '09-30', short: 'Q3' },
  Q4: { from: '10-01', to: '12-31', short: 'Q4' },
};

export interface ResolvedTaxPeriod {
  key: TaxPeriodKey;
  taxYear: number;
  /** Inclusive start, YYYY-MM-DD. */
  startDate: string;
  /** Inclusive end, YYYY-MM-DD. */
  endDate: string;
  /** True for the full calendar year. */
  isFullYear: boolean;
  /** Short control label: 'Gesamtjahr' | 'Q1' … */
  shortLabel: string;
  /** Heading label: 'Gesamtjahr 2026' | 'Q2 2026'. */
  label: string;
  /** Secondary label: 'Gesamtjahr 2026 · 01.01.2026–31.12.2026'. */
  rangeLabel: string;
  /** Filename fragment: '2026' for the full year, '2026-Q2' for a quarter. */
  filenameSuffix: string;
  /**
   * Value for owner_tax_estimates.period. 'year' for the annual snapshot so an
   * annual row is explicitly labelled and can never be read as a quarter.
   */
  snapshotPeriod: TaxPeriodKey;
}

export function isTaxPeriodKey(value: unknown): value is TaxPeriodKey {
  return typeof value === 'string' && (TAX_PERIOD_KEYS as readonly string[]).includes(value);
}

/** German day-first rendering of a YYYY-MM-DD accounting date, without Date parsing. */
export function formatPeriodDateDe(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

export function resolveTaxPeriod(taxYear: number, key: TaxPeriodKey): ResolvedTaxPeriod {
  const bounds = BOUNDS[key];
  const startDate = `${taxYear}-${bounds.from}`;
  const endDate = `${taxYear}-${bounds.to}`;
  const label = `${bounds.short} ${taxYear}`;
  return {
    key,
    taxYear,
    startDate,
    endDate,
    isFullYear: key === 'year',
    shortLabel: bounds.short,
    label,
    rangeLabel: `${label} · ${formatPeriodDateDe(startDate)}–${formatPeriodDateDe(endDate)}`,
    filenameSuffix: key === 'year' ? String(taxYear) : `${taxYear}-${key}`,
    snapshotPeriod: key,
  };
}

/** The full-year period for a tax year — the reference range for annual-only figures. */
export function fullYearPeriod(taxYear: number): ResolvedTaxPeriod {
  return resolveTaxPeriod(taxYear, 'year');
}
