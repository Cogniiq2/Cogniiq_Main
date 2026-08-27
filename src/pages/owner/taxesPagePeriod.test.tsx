// ─────────────────────────────────────────────────────────────────────────────
// Steuern — Auswertungszeitraum (period filter).
//
// Pins that the selected period actually reaches the data layer and every
// period-dependent export, so no hard-coded Jan 1 / Dec 31 can survive: the
// owner_tax_period_inputs range, the export filenames, the export metadata and
// the recordExportRun audit entry must all agree with the selection.
//
// Also pins the deliberate asymmetry: annual-only figures (ESt/GewSt/Soli/KiSt/
// Rücklage, and the stored snapshot) stay annual and are never relabelled as a
// quarterly liability.
// ─────────────────────────────────────────────────────────────────────────────
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
  src/lib/supabase.ts validates its configuration at module scope and throws
  without it, and this page reaches it transitively through the dashboard
  components. Stubbed here (as in canonicalCustomer.test.tsx) so the client is
  constructible; every data path below is mocked and no request is ever made.
*/
vi.stubEnv('VITE_SUPABASE_URL', 'https://taxes-period-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

/* Explicit argument tuples: the assertions below read positional call arguments
   (the from/to range, the export filename, the audit run), so the mocks are typed
   rather than left to infer an empty tuple. */
type Meta = Record<string, unknown>;
type Payload = Record<string, unknown>;

const loadTaxPeriodInputs = vi.fn<(entityId: string, from: string, to: string, timing: string) => Promise<unknown>>();
const loadTaxSettings = vi.fn<(entityId: string, year: number) => Promise<unknown>>();
const loadAssets = vi.fn<(entityId: string) => Promise<unknown[]>>();
const recordExportRun = vi.fn<(entityId: string, run: Payload) => Promise<{ error: string | null }>>(async () => ({ error: null }));
const saveTaxEstimate = vi.fn<(entityId: string, snapshot: Payload) => Promise<{ error: string | null }>>(async () => ({ error: null }));

vi.mock('@/lib/ownerFinance/api', () => ({
  loadTaxPeriodInputs, loadTaxSettings, loadAssets, recordExportRun, saveTaxEstimate,
}));

const exportCsv = vi.fn<(filename: string, meta: Meta, headers: string[], rows: unknown[][]) => void>();
const exportJson = vi.fn<(filename: string, meta: Meta, payload: Payload) => void>();
const exportReportPdf = vi.fn<(filename: string, model: { metaLines: string[] }) => Promise<void>>(async () => {});

vi.mock('@/lib/ownerFinance/exports', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/exports')>('@/lib/ownerFinance/exports');
  return { ...actual, exportCsv, exportJson, exportReportPdf };
});

// The real provider hands out a stable value; the stub must too, or the page's
// load() callback would be re-created on every render and re-fire its effect.
const OWNER_CONTEXT = { entity: { id: 'entity-1', display_name: 'Cogniiq' }, taxYear: 2026 };
vi.mock('@/pages/owner/ownerContext', () => ({ useOwnerEntity: () => OWNER_CONTEXT }));

const { TaxesPage } = await import('@/pages/owner/TaxesPage');
const { ToastProvider } = await import('@/components/dashboard');

function inputsFixture(revenueCents: number) {
  return {
    vat_timing: 'ist',
    paid_revenue_net_cents: revenueCents,
    paid_expense_deductible_net_cents: 10000,
    vat_output_cents: Math.round(revenueCents * 0.19),
    vat_reverse_charge_output_cents: 0,
    vat_input_cents: 1900,
    has_unlinked_income: false,
    has_unresolved_treatment: false,
    missing_service_date: false,
    recurring_flag_count: 0,
    filing_ready: true,
    warnings: [],
  };
}

/** Distinct revenue per range so a stale/annual figure is visible in assertions. */
function inputsForRange(from: string) {
  const byQuarter: Record<string, number> = {
    '2026-01-01': 100000, '2026-04-01': 200000, '2026-07-01': 300000, '2026-10-01': 400000,
  };
  return inputsFixture(byQuarter[from] ?? 1000000);
}

beforeEach(() => {
  loadTaxPeriodInputs.mockReset();
  loadTaxSettings.mockReset();
  loadAssets.mockReset();
  recordExportRun.mockClear();
  saveTaxEstimate.mockClear();
  exportCsv.mockClear();
  exportJson.mockClear();
  exportReportPdf.mockClear();
  loadTaxSettings.mockResolvedValue({
    vat_timing: 'ist', trade_tax_hebesatz_bp: 40000, assessment_mode: 'single',
    estimated_other_taxable_income_cents: 0, setup_complete: true,
  });
  loadAssets.mockResolvedValue([]);
  loadTaxPeriodInputs.mockImplementation(async (_e: string, from: string) => inputsForRange(from));
});

const renderPage = () => render(<MemoryRouter><ToastProvider><TaxesPage /></ToastProvider></MemoryRouter>);
/** The period control is the dashboard Tabs primitive: role="tab" inside a tablist. */
const selectPeriod = (label: string) => fireEvent.click(screen.getByRole('tab', { name: label }));

/** The ranges passed to owner_tax_period_inputs, as [from, to] pairs. */
const requestedRanges = () => loadTaxPeriodInputs.mock.calls.map((c) => [c[1], c[2]]);

describe('period selector drives loadTaxPeriodInputs', () => {
  it('defaults to the full calendar year with exactly one request', async () => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    expect(requestedRanges()).toEqual([['2026-01-01', '2026-12-31']]);
    // 'ist' from settings, not a silent fallback.
    expect(loadTaxPeriodInputs.mock.calls[0][3]).toBe('ist');
  });

  it.each([
    ['Q1', '2026-01-01', '2026-03-31'],
    ['Q2', '2026-04-01', '2026-06-30'],
    ['Q3', '2026-07-01', '2026-09-30'],
    ['Q4', '2026-10-01', '2026-12-31'],
  ])('selecting %s reloads with %s .. %s', async (label, from, to) => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    loadTaxPeriodInputs.mockClear();
    selectPeriod(label);
    await waitFor(() => expect(requestedRanges()).toContainEqual([from, to]));
    // The annual reference range is fetched alongside — and is never used as the
    // period range itself.
    expect(requestedRanges()).toContainEqual(['2026-01-01', '2026-12-31']);
  });

  it('keeps the configured Ist/Soll timing when the period changes', async () => {
    loadTaxSettings.mockResolvedValue({ vat_timing: 'soll', trade_tax_hebesatz_bp: 40000, assessment_mode: 'single', setup_complete: true });
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    selectPeriod('Q2');
    await waitFor(() => expect(loadTaxPeriodInputs.mock.calls.length).toBeGreaterThan(1));
    // The server aggregation stays the authority for VAT timing — the page never
    // substitutes a naive invoice-date filter for a quarter.
    for (const call of loadTaxPeriodInputs.mock.calls) expect(call[3]).toBe('soll');
  });

  it('shows the active period and its exact range', async () => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    selectPeriod('Q2');
    await waitFor(() => expect(screen.getByText(/Q2 2026 · 01\.04\.2026–30\.06\.2026/)).toBeTruthy());
  });
});

describe('exports respect the selected period', () => {
  async function openQuarter(label: string) {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    selectPeriod(label);
    await waitFor(() => expect(loadTaxPeriodInputs.mock.calls.length).toBeGreaterThan(1));
  }

  it('names the UStVA file after the quarter and stamps the quarter range', async () => {
    await openQuarter('Q1');
    fireEvent.click(screen.getByRole('button', { name: /UStVA-Paket/ }));
    await waitFor(() => expect(exportCsv).toHaveBeenCalled());
    expect(exportCsv.mock.calls[0][0]).toBe('UStVA-2026-Q1.csv');
    expect(exportCsv.mock.calls[0][1]).toMatchObject({ periodStart: '2026-01-01', periodEnd: '2026-03-31' });
    await waitFor(() => expect(recordExportRun).toHaveBeenCalled());
    expect(recordExportRun.mock.calls[0][1]).toMatchObject({
      export_type: 'ustva_preparation', period_start: '2026-01-01', period_end: '2026-03-31',
    });
  });

  it('keeps the plain year filename for Gesamtjahr', async () => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /UStVA-Paket/ }));
    await waitFor(() => expect(exportCsv).toHaveBeenCalled());
    expect(exportCsv.mock.calls[0][0]).toBe('UStVA-2026.csv');
    expect(exportCsv.mock.calls[0][1]).toMatchObject({ periodStart: '2026-01-01', periodEnd: '2026-12-31' });
  });

  it('names the PDF after the quarter and prints the Auswertungszeitraum', async () => {
    await openQuarter('Q2');
    fireEvent.click(screen.getByRole('button', { name: /PDF-Übersicht/ }));
    await waitFor(() => expect(exportReportPdf).toHaveBeenCalled());
    expect(exportReportPdf.mock.calls[0][0]).toBe('Steuerübersicht-2026-Q2.pdf');
    const model = exportReportPdf.mock.calls[0][1] as { metaLines: string[] };
    expect(model.metaLines[0]).toContain('Auswertungszeitraum: Q2 2026 · 01.04.2026–30.06.2026');
    expect(model.metaLines.join(' ')).toContain('2026-04-01');
    expect(model.metaLines.join(' ')).toContain('2026-06-30');
    expect(recordExportRun.mock.calls.at(-1)?.[1]).toMatchObject({ period_start: '2026-04-01', period_end: '2026-06-30' });
  });

  it('names the JSON after the quarter and carries the period in its payload', async () => {
    await openQuarter('Q3');
    fireEvent.click(screen.getByRole('button', { name: /^Steuerübersicht$/ }));
    await waitFor(() => expect(exportJson).toHaveBeenCalled());
    expect(exportJson.mock.calls[0][0]).toBe('Steuerübersicht-2026-Q3.json');
    expect(exportJson.mock.calls[0][1]).toMatchObject({ periodStart: '2026-07-01', periodEnd: '2026-09-30' });
    const payload = exportJson.mock.calls[0][2] as { period: Record<string, unknown> };
    expect(payload.period).toMatchObject({ key: 'Q3', start: '2026-07-01', end: '2026-09-30', is_full_year: false });
    expect(recordExportRun.mock.calls.at(-1)?.[1]).toMatchObject({
      export_type: 'tax_summary', period_start: '2026-07-01', period_end: '2026-09-30',
    });
  });

  it('leaves no annual hard-coded range in any Q4 export', async () => {
    await openQuarter('Q4');
    fireEvent.click(screen.getByRole('button', { name: /UStVA-Paket/ }));
    fireEvent.click(screen.getByRole('button', { name: /PDF-Übersicht/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Steuerübersicht$/ }));
    await waitFor(() => expect(recordExportRun).toHaveBeenCalledTimes(3));
    for (const call of recordExportRun.mock.calls) {
      const run = call[1] as { period_start: string; period_end: string };
      expect(run.period_start).toBe('2026-10-01');
      expect(run.period_end).toBe('2026-12-31');
    }
  });
});

describe('annual-only figures are never stored or shown as quarterly', () => {
  it('always saves the combined reserve as an annual snapshot, even in quarter view', async () => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    selectPeriod('Q2');
    await waitFor(() => expect(loadTaxPeriodInputs.mock.calls.length).toBeGreaterThan(1));

    // The label changes so the button never reads as saving the quarter.
    fireEvent.click(screen.getByRole('button', { name: /Jahres-Snapshot speichern/ }));
    await waitFor(() => expect(saveTaxEstimate).toHaveBeenCalled());
    const snapshot = saveTaxEstimate.mock.calls[0][1] as Record<string, unknown>;
    expect(snapshot.tax_year).toBe(2026);
    expect(snapshot.period).toBe('year');
    expect(snapshot.tax_type).toBe('combined_reserve');
  });

  it('labels income and trade tax as annual while a quarter is selected', async () => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    selectPeriod('Q3');
    await waitFor(() => expect(screen.getByText(/Q3 2026 ·/)).toBeTruthy());
    expect(screen.getAllByText(/Jahresbezogen · Gesamtjahr 2026/).length).toBeGreaterThanOrEqual(3);
    // The VAT section stays scoped to the selection.
    expect(screen.getByText(/Umsatzsteuer — Q3 2026/)).toBeTruthy();
  });

  it('does not claim a quarterly filing obligation', async () => {
    renderPage();
    await waitFor(() => expect(loadTaxPeriodInputs).toHaveBeenCalled());
    selectPeriod('Q1');
    await waitFor(() => expect(screen.getByText(/Q1 2026 ·/)).toBeTruthy());
    expect(screen.getByText(/ändert nicht Ihren gesetzlichen[\s\S]*Voranmeldungszeitraum/)).toBeTruthy();
  });
});
