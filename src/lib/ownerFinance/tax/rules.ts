// Versioned German 2026 tax rules for a sole proprietorship (Einzelunternehmen, Gewerbebetrieb)
// using EÜR + regular VAT taxation. Every value is configurable and carries its source metadata.
//
// VERIFICATION NOTE: constants below were verified during research against WebSearch result snippets
// quoting the official statutory text (gesetze-im-internet.de, BMF LStH 2026). Direct WebFetch of the
// primary hosts was blocked by the session egress proxy, so "search-verified" is a genuine but weaker
// guarantee than a direct primary-source fetch. Re-verify against a direct primary fetch before any
// production filing. Nothing here is tax advice; all outputs are planning estimates.

export const RULES_VERSION = 'de-2026-v1';

export type Verification = 'search-verified' | 'knowledge-based';
export type ResultKind = 'exact' | 'estimate';

export interface RuleMeta<T = number> {
  value: T;
  source: string;
  statutory: string;
  effectiveFrom: string;
  lastVerified: string;
  verification: Verification;
  result: ResultKind;
  note?: string;
}

const LAST_VERIFIED = '2026-07-21';

// Income tax tariff §32a EStG 2026 — piecewise zones (single assessment).
export interface TariffZone {
  // Upper bound of taxable income (whole EUR) for this zone; Infinity for the top zone.
  upTo: number;
  compute: (x: number) => number;
}

export const incomeTaxZones2026: TariffZone[] = [
  { upTo: 12348, compute: () => 0 },
  { upTo: 17799, compute: (x) => { const y = (x - 12348) / 10000; return (914.51 * y + 1400) * y; } },
  { upTo: 69878, compute: (x) => { const z = (x - 17799) / 10000; return (173.1 * z + 2397) * z + 1034.87; } },
  { upTo: 277825, compute: (x) => 0.42 * x - 11135.63 },
  { upTo: Infinity, compute: (x) => 0.45 * x - 19470.38 },
];

export const rules = {
  vatStandardBp: {
    value: 1900, source: 'UStG §12(1)', statutory: 'UStG §12 Abs. 1', effectiveFrom: '2007-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  vatReducedBp: {
    value: 700, source: 'UStG §12(2)', statutory: 'UStG §12 Abs. 2', effectiveFrom: '2020-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
    note: 'Reduced-rate catalogue is Anlage 2; a rate alone never implies input-VAT deductibility (§15).',
  } as RuleMeta,
  incomeTaxGrundfreibetragEur: {
    value: 12348, source: 'EStG §32a(1) 2026', statutory: 'EStG §32a Abs. 1', effectiveFrom: '2026-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  tradeTaxAllowanceEur: {
    value: 24500, source: 'GewStG §11(1) S.3 Nr.1', statutory: 'GewStG §11 Abs. 1', effectiveFrom: '2008-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
    note: 'Applies to natural persons and Personengesellschaften.',
  } as RuleMeta,
  tradeTaxMeasurementBp: {
    value: 350, source: 'GewStG §11(2)', statutory: 'GewStG §11 Abs. 2', effectiveFrom: '2008-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  tradeTaxHebesatzMinBp: {
    value: 20000, source: 'GewStG §16(4) S.2', statutory: 'GewStG §16 Abs. 4', effectiveFrom: '2004-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
    note: 'Minimum Hebesatz 200%. Actual Hebesatz is per-municipality configuration.',
  } as RuleMeta,
  sec35FactorBp: {
    value: 40000, source: 'EStG §35(1)', statutory: 'EStG §35 Abs. 1', effectiveFrom: '2020-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'estimate',
    note: '4.0× the Gewerbesteuer-Messbetrag; capped by actual trade tax and the Ermäßigungshöchstbetrag.',
  } as RuleMeta,
  soliRateBp: {
    value: 550, source: 'SolzG §4 S.1', statutory: 'SolzG §4', effectiveFrom: '1998-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  soliMarginalRateBp: {
    value: 1190, source: 'SolzG §4 S.2', statutory: 'SolzG §4', effectiveFrom: '2021-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  soliFreigrenzeSingleEur: {
    value: 20350, source: 'SolzG §3(3) 2026', statutory: 'SolzG §3 Abs. 3', effectiveFrom: '2026-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  soliFreigrenzeJointEur: {
    value: 40700, source: 'SolzG §3(3)/(4a) 2026', statutory: 'SolzG §3', effectiveFrom: '2026-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
  } as RuleMeta,
  churchTaxBavariaBp: {
    value: 800, source: 'Bayerisches KirchStG', statutory: 'Landes-KiStG (BY/BW 8%)', effectiveFrom: '2018-01-01',
    lastVerified: LAST_VERIFIED, verification: 'knowledge-based', result: 'estimate',
    note: '8% in Bayern/Baden-Württemberg, 9% elsewhere. Opt-in and Land are per-user configuration.',
  } as RuleMeta,
  gwgImmediateThresholdEur: {
    value: 800, source: 'EStG §6(2)', statutory: 'EStG §6 Abs. 2', effectiveFrom: '2018-01-01',
    lastVerified: LAST_VERIFIED, verification: 'search-verified', result: 'exact',
    note: 'GWG net ≤800€ immediate; ≤250€ without register; 250.01–1,000€ optional Sammelposten over 5 years (§6(2a)).',
  } as RuleMeta,
} as const;

// Plain numeric constants for the calculation functions.
export const VAT_STANDARD_BP = rules.vatStandardBp.value;
export const VAT_REDUCED_BP = rules.vatReducedBp.value;
export const TRADE_TAX_ALLOWANCE_CENTS = rules.tradeTaxAllowanceEur.value * 100;
export const TRADE_TAX_MEASUREMENT_BP = rules.tradeTaxMeasurementBp.value;
export const SEC35_FACTOR_BP = rules.sec35FactorBp.value;
export const SOLI_RATE_BP = rules.soliRateBp.value;
export const SOLI_MARGINAL_RATE_BP = rules.soliMarginalRateBp.value;
export const SOLI_FREIGRENZE_SINGLE_CENTS = rules.soliFreigrenzeSingleEur.value * 100;
export const SOLI_FREIGRENZE_JOINT_CENTS = rules.soliFreigrenzeJointEur.value * 100;
