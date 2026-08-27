// Presentation rules the E2E browser test caught the UI getting wrong.
//
// Each of these once shipped: a raw `bank_transfer` next to a dialog that said
// "Überweisung", a negative "Offen: -0,01 €" on a legacy overpaid invoice, and a
// historical-composer banner promising an open balance of 0,00 € after instalments made
// that untrue. They are pinned here so they cannot come back quietly.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PAYMENT_METHOD_LABEL_DE, PAYMENT_METHOD_OPTIONS, paymentMethodLabel,
} from '@/lib/ownerFinance/paymentMethods';

const read = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');

describe('payment-method labels', () => {
  it('maps the stored token to German', () => {
    expect(paymentMethodLabel('bank_transfer')).toBe('Überweisung');
    expect(paymentMethodLabel('direct_debit')).toBe('Lastschrift');
    expect(paymentMethodLabel('card')).toBe('Karte');
    expect(paymentMethodLabel('cash')).toBe('Bar');
    expect(paymentMethodLabel('paypal')).toBe('PayPal');
    expect(paymentMethodLabel('other')).toBe('Sonstige');
  });

  it('never leaks a raw snake_case token to the owner', () => {
    for (const value of Object.keys(PAYMENT_METHOD_LABEL_DE)) {
      expect(paymentMethodLabel(value)).not.toContain('_');
    }
  });

  it('degrades safely on an unknown or legacy value instead of crashing', () => {
    expect(paymentMethodLabel('sepa_direct_debit')).toBe('Sepa direct debit');
    expect(paymentMethodLabel('')).toBe('—');
    expect(paymentMethodLabel(null)).toBe('—');
    expect(paymentMethodLabel(undefined)).toBe('—');
  });

  it('offers every known method as a selectable option', () => {
    expect(PAYMENT_METHOD_OPTIONS.map((o) => o.value).sort())
      .toEqual(Object.keys(PAYMENT_METHOD_LABEL_DE).sort());
    expect(PAYMENT_METHOD_OPTIONS[0].value).toBe('bank_transfer');
  });

  it('is used by the invoice surfaces rather than a private copy', () => {
    // The duplicated inline arrays are what produced the inconsistency in the first place.
    const detail = read('src/pages/owner/InvoiceDetailPage.tsx');
    const list = read('src/pages/owner/InvoicesPage.tsx');
    expect(detail).toContain('paymentMethodLabel');
    expect(detail).toContain('PAYMENT_METHOD_OPTIONS');
    expect(list).toContain('PAYMENT_METHOD_OPTIONS');
    for (const src of [detail, list]) {
      expect(src).not.toContain("{ value: 'bank_transfer', label: 'Überweisung' }");
    }
  });
});

describe('legacy overpayment is never shown as a negative receivable', () => {
  const detail = read('src/pages/owner/InvoiceDetailPage.tsx');
  const list = read('src/pages/owner/InvoicesPage.tsx');

  it('floors the open balance at zero on the invoice detail page', () => {
    expect(detail).toContain('Math.max(invoice.gross_total_cents - invoice.amount_paid_cents, 0)');
  });

  it('names the excess separately as Überzahlung', () => {
    expect(detail).toContain('Überzahlung');
    expect(detail).toContain('invoice.amount_paid_cents - invoice.gross_total_cents');
  });

  it('floors the open column in the invoice list too', () => {
    expect(list).toContain('inv.amount_paid_cents > inv.gross_total_cents');
    expect(list).toContain('Überzahlung');
  });

  it('the arithmetic itself never yields a negative open balance', () => {
    const open = (gross: number, paid: number) => Math.max(gross - paid, 0);
    const over = (gross: number, paid: number) => (paid > gross ? paid - gross : 0);
    expect(open(119000, 119001)).toBe(0);
    expect(over(119000, 119001)).toBe(1);
    expect(open(119000, 70000)).toBe(49000);
    expect(over(119000, 70000)).toBe(0);
  });
});

describe('historical composer copy is accurate about partial settlement', () => {
  const src = read('src/pages/owner/InvoicesPage.tsx');

  it('no longer claims every historical invoice settles in full', () => {
    expect(src).not.toContain('Diese Rechnung wird direkt als bezahlt gebucht');
    expect(src).not.toContain('der offene Betrag ist 0,00 €');
  });

  it('names both possible outcomes', () => {
    expect(src).toContain('Teilbezahlt');
    expect(src).toContain('Je nach Summe der Zahlungen');
  });

  it('still promises no customer contact', () => {
    // Whitespace-insensitive: the phrase wraps across lines in JSX, and line endings differ.
    expect(src.replace(/\s+/g, ' ')).toContain('keine E-Mail, keine Zahlungserinnerung und keine Benachrichtigung');
  });
});

describe('recurring contract creation is a forecast-only action', () => {
  const dialog = read('src/components/finance/RevenueContractFormDialog.tsx');
  const page = read('src/pages/owner/RevenueContractsPage.tsx');

  it('is reachable from the contracts page without bulk import', () => {
    expect(page).toContain('+ Vertrag anlegen');
    expect(page).toContain('RevenueContractFormDialog');
  });

  it('creates a contract and nothing else', () => {
    const code = dialog.split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')).join('\n');
    expect(code).toContain('createRevenueContract');
    for (const forbidden of [
      'recordHistoricalInvoiceWithPayments', 'addInvoicePayment', 'postRevenueContractMonth',
      'owner_automation_jobs', 'functions.invoke', 'runBulkImport',
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });

  it('sends no authoritative total to the server', () => {
    const call = dialog.slice(dialog.indexOf('createRevenueContract('), dialog.indexOf('}, lineInputs)'));
    for (const forbidden of ['expected_net_cents', 'expected_vat_cents', 'expected_gross_cents', 'mrr', 'arr']) {
      expect(call).not.toContain(forbidden);
    }
  });

  it('labels its summary as expected, never as actual revenue', () => {
    expect(dialog).toContain('Erwartet · vertraglich');
    expect(dialog).toContain('keine Rechnung, keine Zahlung und kein tatsächlicher Umsatz');
    expect(dialog).toContain('nichts an den Kunden versendet');
  });

  it('treats monthly as the first-class default', () => {
    const freq = dialog.slice(dialog.indexOf('const frequencies'), dialog.indexOf('const rateForTreatment'));
    expect(freq.indexOf("'monthly'")).toBeLessThan(freq.indexOf("'quarterly'"));
    expect(dialog).toContain("useState<BillingFrequency>('monthly')");
  });
});

describe('the Umsatz page separates actual from forecast', () => {
  const src = read('src/pages/owner/miscPages.tsx');
  const revenue = src.slice(src.indexOf('export function RevenuePage'), src.indexOf('// ---------------- Subscriptions'));

  it('labels the actual block Ist and the forecast block Erwartet', () => {
    expect(revenue).toContain('Ist · tatsächlich');
    expect(revenue).toContain('Erwartet · vertraglich');
  });

  it('shows MRR, ARR and the active contract count', () => {
    expect(revenue).toContain('MRR (netto)');
    expect(revenue).toContain('ARR (netto)');
    expect(revenue).toContain('Aktive Verträge');
  });

  it('marks the forecast tiles with the forecast basis, not actual', () => {
    const forecastBlock = revenue.slice(revenue.indexOf('Erwartet · vertraglich'));
    expect(forecastBlock).toContain('basis="forecast"');
    expect(forecastBlock).not.toContain('basis="actual"');
  });

  it('never adds a forecast figure into an actual total', () => {
    // The actual KpiCards must read only from `summary`; the forecast only from `forecast`.
    // Only the actual KpiCards themselves — the block between them also contains the
    // JSX guard that decides whether the forecast section renders at all.
    const actualCards = revenue
      .slice(revenue.indexOf('Ist · tatsächlich'), revenue.indexOf('Erwartet · vertraglich'))
      .split(/\r?\n/).filter((l) => l.includes('<KpiCard')).join('\n');
    expect(actualCards).not.toContain('forecast');
    expect(actualCards).not.toContain('mrr');
    expect(actualCards.split('<KpiCard').length - 1).toBe(4);
    // And no arithmetic anywhere mixes the two objects together.
    expect(revenue).not.toMatch(/summary\.[a-z_]+\s*\+\s*forecast\./);
    expect(revenue).not.toMatch(/forecast\.[a-z_]+\s*\+\s*summary\./);
  });

  it('states in words that the forecast is outside EÜR and VAT', () => {
    expect(revenue).toContain('Nicht in „Ist", EÜR oder Umsatzsteuer enthalten.');
  });
});

describe('none of the new UI can contact a customer', () => {
  it.each([
    'src/components/finance/RevenueContractFormDialog.tsx',
    'src/pages/owner/RevenueContractsPage.tsx',
    'src/lib/ownerFinance/paymentMethods.ts',
  ])('%s references no mail or automation path', (file) => {
    const code = read(file).split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')).join('\n');
    for (const forbidden of [
      'owner_automation_jobs', 'owner_enqueue_offer_email', 'owner_enqueue_automation_job',
      'send-offer-document-email', 'process-accepted-offer', 'functions.invoke', 'mailto:',
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });
});
