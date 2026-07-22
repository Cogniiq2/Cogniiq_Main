// Unit tests for the pure German 2026 tax engine (de-2026-v1). The tax modules are bundled on the
// fly with esbuild (already a devDependency) and imported directly — no test framework, no DB, no
// deployment. Exercises the real shipped logic.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, '../../src/lib/ownerFinance/tax/index.ts');
const result = await build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
const t = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

let failures = 0;
function eq(actual, expected, msg) {
  if (actual !== expected) { console.error(`FAIL: ${msg} — expected ${expected}, got ${actual}`); failures += 1; }
}
function ok(cond, msg) { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } }

// ---- Calculation-version reproducibility ----
eq(t.RULES_VERSION, 'de-2026-v1', 'rules version');

// ---- Income tax §32a 2026 boundaries ----
eq(t.incomeTaxTariff2026Single(0), 0, 'tariff(0)');
eq(t.incomeTaxTariff2026Single(-5000), 0, 'tariff(negative) clamps to 0');
eq(t.incomeTaxTariff2026Single(12348), 0, 'tariff at Grundfreibetrag upper');
eq(t.incomeTaxTariff2026Single(12349), 0, 'tariff just above Grundfreibetrag rounds to 0');
eq(t.incomeTaxTariff2026Single(100000), 30864, 'zone 4 exact');
eq(t.incomeTaxTariff2026Single(300000), 115529, 'zone 5 exact');
eq(t.incomeTaxTariff2026(200000, 'joint'), 61728, 'joint splitting = 2× half');
// Continuity across zone boundaries (≤ 1 EUR jump) and monotonicity.
for (const [a, b] of [[17799, 17800], [69878, 69879], [277825, 277826]]) {
  const ta = t.incomeTaxTariff2026Single(a);
  const tb = t.incomeTaxTariff2026Single(b);
  ok(tb >= ta && tb - ta <= 1, `continuity/monotonic at ${a}->${b} (${ta} -> ${tb})`);
}

// ---- VAT ----
{
  const l = t.computeInvoiceLine(2000, 10000, 1900, 'standard'); // 2 × 100.00 @ 19%
  eq(l.netCents, 20000, 'invoice net'); eq(l.vatCents, 3800, 'invoice vat 19%'); eq(l.grossCents, 23800, 'invoice gross');
  const r = t.computeInvoiceLine(1000, 10000, 700, 'reduced');
  eq(r.vatCents, 700, 'invoice vat 7%');
  eq(t.computeInvoiceLine(1000, 10000, 1900, 'exempt').vatCents, 0, 'exempt => no vat');
  eq(t.computeInvoiceLine(1000, 10000, 1900, 'reverse_charge').vatCents, 0, 'reverse charge => no output vat on invoice');
  const rc = t.computeExpenseLine(10000, 1900, 'reverse_charge_13b');
  eq(rc.vatCents, 1900, 'reverse charge self-assessed vat'); eq(rc.grossCents, 10000, 'reverse charge supplier gross excludes vat');
  eq(t.eligibleInputVat(1900, 5000), 950, 'partial input vat 50%');
  const sum = t.vatPeriodSummary({ outputVatCents: 3800, reverseChargeOutputCents: 1900, eligibleInputVatCents: 1000, eligibleReverseChargeInputCents: 1900, prepaymentsCents: 500, hasUnresolvedTreatments: false });
  eq(sum.payableCents, 2300, 'vat payable'); eq(sum.reserveCents, 2300, 'vat reserve'); ok(sum.filingReady, 'filing ready when resolved');
  const sum2 = t.vatPeriodSummary({ outputVatCents: 100, reverseChargeOutputCents: 0, eligibleInputVatCents: 0, eligibleReverseChargeInputCents: 0, prepaymentsCents: 0, hasUnresolvedTreatments: true });
  ok(!sum2.filingReady && sum2.warnings.length > 0, 'unknown classification blocks filing-ready');
  // Default (no vatModeConfigured field) stays back-compatible: filing-ready when treatments resolved.
  ok(t.vatPeriodSummary({ outputVatCents: 0, reverseChargeOutputCents: 0, eligibleInputVatCents: 0, eligibleReverseChargeInputCents: 0, prepaymentsCents: 0, hasUnresolvedTreatments: false }).filingReady, 'default vat mode => filing-ready when resolved');
  // USt readiness bug: an unknown Ist/Soll mode must NEVER be filing-ready, even with resolved treatments.
  const noMode = t.vatPeriodSummary({ outputVatCents: 0, reverseChargeOutputCents: 0, eligibleInputVatCents: 0, eligibleReverseChargeInputCents: 0, prepaymentsCents: 0, hasUnresolvedTreatments: false, vatModeConfigured: false });
  ok(!noMode.filingReady, 'missing USt mode is never filing-ready');
  ok(noMode.vatModeConfigured === false, 'missing USt mode surfaced on result');
  ok(noMode.warnings.some((w) => /USt-Modus/.test(w)), 'missing USt mode warns');
  ok(t.vatPeriodSummary({ outputVatCents: 0, reverseChargeOutputCents: 0, eligibleInputVatCents: 0, eligibleReverseChargeInputCents: 0, prepaymentsCents: 0, hasUnresolvedTreatments: false, vatModeConfigured: true }).filingReady, 'configured USt mode + resolved => filing-ready');
}

// ---- Trade tax ----
{
  const tt = t.tradeTax({ profitCents: 10000000, hebesatzBp: 49000 }); // 100,000 € @ 490%
  eq(tt.afterAllowanceCents, 7550000, 'gewerbeertrag after 24,500 allowance');
  eq(tt.messbetragCents, 264250, 'messbetrag 3.5%');
  eq(tt.tradeTaxCents, 1294825, 'trade tax × hebesatz');
  eq(t.tradeTax({ profitCents: 2450000, hebesatzBp: 40000 }).messbetragCents, 0, 'at allowance boundary messbetrag=0');
  eq(t.tradeTax({ profitCents: 3009900, hebesatzBp: 40000 }).gewerbeertragRoundedCents, 3000000, 'rounded down to full 100 EUR');
  const missing = t.tradeTax({ profitCents: 10000000, hebesatzBp: null });
  ok(missing.tradeTaxCents === null && missing.warnings.length > 0 && missing.applicable === false, 'missing hebesatz => no calc + warning');
}

// ---- §35 relief three-way minimum ----
{
  eq(t.sec35Credit({ messbetragCents: 264250, actualTradeTaxCents: 1294825, incomeTaxAttributableToCommercialCents: 2000000 }).cappedBy, 'factor', '§35 factor cap (4× messbetrag=1,057,000)');
  eq(t.sec35Credit({ messbetragCents: 264250, actualTradeTaxCents: 900000, incomeTaxAttributableToCommercialCents: 2000000 }).creditCents, 900000, '§35 actual trade tax cap');
  eq(t.sec35Credit({ messbetragCents: 264250, actualTradeTaxCents: 1294825, incomeTaxAttributableToCommercialCents: 500000 }).cappedBy, 'income_tax_cap', '§35 income-tax cap');
}

// ---- Solidaritätszuschlag ----
{
  eq(t.solidaritySurcharge({ incomeTaxBasisCents: 2035000, mode: 'single' }).soliCents, 0, 'soli 0 at single Freigrenze');
  eq(t.solidaritySurcharge({ incomeTaxBasisCents: 5000000, mode: 'single' }).soliCents, 275000, 'soli full 5.5% above phase-in');
  eq(t.solidaritySurcharge({ incomeTaxBasisCents: 4070000, mode: 'joint' }).soliCents, 0, 'soli 0 at joint Freigrenze');
  eq(t.solidaritySurcharge({ incomeTaxBasisCents: 5000000, mode: 'joint' }).soliCents, 110670, 'soli joint phase-in cap');
}

// ---- Church tax ----
eq(t.churchTax(5000000, 800, false), 0, 'church tax disabled => 0');
eq(t.churchTax(5000000, 800, true), 400000, 'church tax 8% enabled');

// ---- Income-tax reserve (requires personal inputs) ----
{
  const withInputs = t.incomeTaxReserve({ cogniiqTaxableProfitCents: 3000000, otherTaxableIncomeCents: 5000000, mode: 'single', incomeTaxPrepaymentsCents: 200000, sec35CreditCents: 100000 });
  ok(withInputs.hasPersonalInputs, 'has personal inputs');
  eq(withInputs.incrementalTaxCents, withInputs.totalTaxCents - withInputs.baselineTaxCents, 'incremental = total - baseline');
  ok(withInputs.incrementalTaxCents > 0, 'positive incremental tax');
  const noInputs = t.incomeTaxReserve({ cogniiqTaxableProfitCents: 3000000, otherTaxableIncomeCents: null, mode: 'single', incomeTaxPrepaymentsCents: 0, sec35CreditCents: 0 });
  ok(!noInputs.hasPersonalInputs && noInputs.warnings.some((w) => /unvollständig/i.test(w)), 'missing personal inputs flagged');
}

// ---- EÜR + reserve ----
{
  const e = t.euerResult({ paidRevenueNetCents: 10000000, paidDeductibleExpenseCents: 3000000, depreciationCents: 500000, manualAdjustmentsCents: 0 });
  eq(e.taxableProfitCents, 6500000, 'euer taxable profit');
  const r = t.combinedReserve({ vatReserveCents: 2300, businessIncomeTaxReserveCents: 500000, tradeTaxRemainingCents: 300000, soliRemainingCents: 20000, churchTaxRemainingCents: 0 });
  eq(r.totalReserveCents, 822300, 'combined reserve total');
  const cash = t.safelyAvailableCash({ recordedCashCents: null, totalReserveCents: 822300, upcomingCommittedCents: 0 });
  ok(cash.availableCents === null && cash.exact === false, 'safely available cash not exact without bank balance');
}

// ---- Depreciation timing (start month, reproducible cents, accumulated ≤ base) ----
{
  const sum = (s) => s.years.reduce((a, y) => a + y.depreciationCents, 0);
  const jan = t.depreciationSchedule({ acquisitionCostCents: 360000, businessUseBp: 10000, method: 'straight_line', usefulLifeMonths: 36, startYear: 2026, startMonth: 1, years: 6 });
  eq(jan.years[0].depreciationCents, 120000, 'Jan: full first year');
  eq(sum(jan), 360000, 'Jan: accumulated equals base');
  eq(jan.years[jan.years.length - 1].bookValueEndCents, 0, 'Jan: final book value 0');

  const jul = t.depreciationSchedule({ acquisitionCostCents: 360000, businessUseBp: 10000, method: 'straight_line', usefulLifeMonths: 36, startYear: 2026, startMonth: 7, years: 6 });
  eq(jul.years[0].depreciationCents, 60000, 'Jul: 6/12 first year');
  eq(sum(jul), 360000, 'Jul: accumulated equals base');
  ok(jul.years.length === 4, 'Jul: completes over 4 calendar years');

  const dec = t.depreciationSchedule({ acquisitionCostCents: 360000, businessUseBp: 10000, method: 'straight_line', usefulLifeMonths: 36, startYear: 2026, startMonth: 12, years: 6 });
  eq(dec.years[0].depreciationCents, 10000, 'Dec: 1/12 first year');
  eq(sum(dec), 360000, 'Dec: accumulated equals base');

  const rem = t.depreciationSchedule({ acquisitionCostCents: 100000, businessUseBp: 10000, method: 'straight_line', usefulLifeMonths: 36, startYear: 2026, startMonth: 1, years: 6 });
  eq(sum(rem), 100000, 'Rounding remainder: accumulated equals base');
  ok(rem.years.every((y) => y.bookValueEndCents >= 0), 'book value never negative (never exceeds base)');

  const businessUse = t.depreciationSchedule({ acquisitionCostCents: 200000, businessUseBp: 5000, method: 'straight_line', usefulLifeMonths: 24, startYear: 2026, startMonth: 1, years: 4 });
  eq(businessUse.base, 100000, 'business-use fraction applied to base');
}

// ---- taxSnapshot USt readiness (computeTaxSnapshot) ----
// Bundle the aggregation layer separately. Its imports from ./api and ./types are type-only and are
// erased by esbuild, so no Supabase client or DB is pulled in.
{
  const snapEntry = resolve(here, '../../src/lib/ownerFinance/taxSnapshot.ts');
  const snapBuild = await build({ entryPoints: [snapEntry], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
  const s = await import('data:text/javascript;base64,' + Buffer.from(snapBuild.outputFiles[0].text).toString('base64'));

  const readyInputs = {
    vat_timing: 'ist', paid_revenue_net_cents: 1000000, paid_expense_deductible_net_cents: 200000,
    vat_output_cents: 190000, vat_reverse_charge_output_cents: 0, vat_input_cents: 38000,
    has_unlinked_income: false, has_unresolved_treatment: false, missing_service_date: false,
    recurring_flag_count: 0, filing_ready: true, warnings: [],
  };
  const completeSettings = {
    business_entity_id: 'x', tax_year: 2026, vat_timing: 'ist', vat_filing_frequency: 'monthly',
    trade_tax_hebesatz_bp: 49000, assessment_mode: 'single', church_tax_enabled: false, church_tax_rate_bp: null,
    estimated_other_taxable_income_cents: 5000000, income_tax_prepayments_cents: 0, trade_tax_prepayments_cents: 0,
    soli_prepayments_cents: 0, church_tax_prepayments_cents: 0, vat_prepayments_cents: 0,
    manual_personal_adjustments_cents: 0, reserve_horizon_days: 90, setup_complete: true,
  };

  // Null tax settings: incomplete, VAT never filing-ready, mode unconfigured.
  const nullCalc = s.computeTaxSnapshot({ inputs: null, assets: [], settings: null, taxYear: 2026 });
  eq(nullCalc.confidence, 'incomplete', 'null settings => incomplete');
  ok(!nullCalc.vat.filingReady, 'null settings => VAT not filing-ready');
  ok(nullCalc.vatModeConfigured === false, 'null settings => USt mode unconfigured');

  // The core bug: settings present & RPC filing_ready=true, but vat_timing is null.
  const noModeCalc = s.computeTaxSnapshot({ inputs: readyInputs, assets: [], settings: { ...completeSettings, vat_timing: null }, taxYear: 2026 });
  ok(!noModeCalc.vat.filingReady, 'missing USt mode never appears filing-ready (never abgabebereit)');
  eq(noModeCalc.confidence, 'incomplete', 'missing USt mode => estimate stays incomplete');
  ok(noModeCalc.warnings.some((w) => /USt-Modus/.test(w)), 'missing USt mode produces a warning');

  // Configured USt mode with complete inputs behaves as expected (estimate + VAT filing-ready).
  const okCalc = s.computeTaxSnapshot({ inputs: readyInputs, assets: [], settings: completeSettings, taxYear: 2026 });
  ok(okCalc.vat.filingReady, 'configured USt mode + resolved => VAT filing-ready');
  ok(okCalc.vatModeConfigured === true, 'configured USt mode surfaced');
  eq(okCalc.confidence, 'estimate', 'complete setup => estimate');
}

if (failures) { console.error(`owner-finance tax engine tests: ${failures} FAILED`); process.exit(1); }
console.log('owner-finance tax engine tests: ALL PASSED');
