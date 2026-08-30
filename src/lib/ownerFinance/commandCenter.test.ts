import { describe, expect, it } from 'vitest';

import {
  buildAttention, buildRecent, buildUpcoming, daysBetween, monthlyCashSeries, openAmountCents,
  receivableAging, summarisePipeline,
} from '@/lib/ownerFinance/commandCenter';
import type { OwnerCustomerListRow, OwnerExpense, OwnerInvoice, OwnerOffer, OwnerSubscription } from '@/lib/ownerFinance/types';

/**
 * The Command Center's job is to be right about what is urgent and to never invent a
 * number. These tests pin the parts that would be invisible in a screenshot: that a
 * cancelled invoice is not a receivable, that a paid one is not overdue, that pipeline
 * volume never mixes with cash, and that the ordering actually puts money that is late
 * at the top.
 */

const TODAY = '2026-08-30';

const invoice = (over: Partial<OwnerInvoice> & { id: string }): OwnerInvoice => ({
  id: over.id,
  business_entity_id: 'e1',
  organization_id: null,
  client_account_id: null,
  owner_customer_id: 'c1',
  engagement_id: null,
  invoice_number: 'RE-2026-0001',
  status: 'issued',
  issue_date: '2026-08-01',
  service_date: '2026-08-01',
  due_date: '2026-08-15',
  currency: 'EUR',
  net_total_cents: 100000,
  vat_total_cents: 19000,
  gross_total_cents: 119000,
  amount_paid_cents: 0,
  notes: null,
  external_reference: null,
  issued_at: '2026-08-01T10:00:00Z',
  archived_at: null,
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
  ...over,
});

const offer = (over: Partial<OwnerOffer> & { id: string }): OwnerOffer => ({
  id: over.id,
  business_entity_id: 'e1',
  organization_id: null,
  client_account_id: null,
  engagement_id: null,
  offer_number: 'AN-2026-0001',
  status: 'sent',
  title: 'Angebot',
  issue_date: '2026-08-01',
  valid_until: '2026-09-01',
  currency: 'EUR',
  introduction: null, scope: null, assumptions: null, exclusions: null,
  payment_terms: null, delivery_terms: null, internal_notes: null,
  subtitle: null, executive_summary: null, project_approach: null, next_steps: null,
  desired_outcomes: [], timeline: [], payment_schedule: [],
  template_key: 'premium',
  recipient_source: 'crm',
  recipient_company: null, recipient_contact_name: null, recipient_department: null,
  recipient_street: null, recipient_postal_code: null, recipient_city: null,
  recipient_country_code: null, recipient_email: null, recipient_phone: null, recipient_vat_id: null,
  recipient_salutation: null, recipient_title: null, recipient_first_name: null,
  recipient_last_name: null, recipient_greeting_name: null,
  net_total_cents: 100000, vat_total_cents: 19000, gross_total_cents: 119000,
  recurring_monthly_net_cents: 0, recurring_monthly_vat_cents: 0, recurring_monthly_gross_cents: 0,
  finalized_version: 1,
  accepted_at: null, rejected_at: null, rejection_reason: null, expired_at: null,
  converted_invoice_id: null, converted_at: null,
  owner_customer_id: 'c1', archived_at: null, archived_by: null,
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
  ...over,
});

const emptyInput = {
  invoices: [] as OwnerInvoice[],
  offers: [] as OwnerOffer[],
  expenses: [] as OwnerExpense[],
  customers: [] as OwnerCustomerListRow[],
};

describe('daysBetween', () => {
  it('counts calendar days without timezone drift', () => {
    expect(daysBetween('2026-08-01', '2026-08-30')).toBe(29);
    expect(daysBetween('2026-08-30', '2026-08-01')).toBe(-29);
    // Across a DST change in Europe/Berlin — still whole days.
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('openAmountCents', () => {
  it('is the unpaid remainder of a genuinely open invoice', () => {
    expect(openAmountCents(invoice({ id: 'a', amount_paid_cents: 19000 }))).toBe(100000);
  });

  it('is zero for a draft — a draft was never a receivable', () => {
    expect(openAmountCents(invoice({ id: 'a', status: 'draft' }))).toBe(0);
  });

  it('is zero for a cancelled invoice, whose totals are retained but no longer owed', () => {
    expect(openAmountCents(invoice({ id: 'a', cancelled_at: '2026-08-20T00:00:00Z' }))).toBe(0);
  });

  it('is zero for a paid invoice and never negative on an overpayment', () => {
    expect(openAmountCents(invoice({ id: 'a', status: 'paid', amount_paid_cents: 119000 }))).toBe(0);
    expect(openAmountCents(invoice({ id: 'a', amount_paid_cents: 200000 }))).toBe(0);
  });
});

describe('buildAttention', () => {
  it('puts the longest-overdue invoice first and states how late it is', () => {
    const items = buildAttention({
      ...emptyInput,
      invoices: [
        invoice({ id: 'recent', invoice_number: 'RE-2', due_date: '2026-08-25' }),
        invoice({ id: 'old', invoice_number: 'RE-1', due_date: '2026-06-01' }),
      ],
    }, TODAY);

    expect(items[0].title).toBe('RE-1');
    expect(items[0].tone).toBe('danger');
    expect(items[0].meta).toContain('90 Tagen');
    expect(items[1].title).toBe('RE-2');
  });

  it('never lists a paid or cancelled invoice', () => {
    const items = buildAttention({
      ...emptyInput,
      invoices: [
        invoice({ id: 'paid', status: 'paid', amount_paid_cents: 119000, due_date: '2026-06-01' }),
        invoice({ id: 'storno', cancelled_at: '2026-07-01T00:00:00Z', due_date: '2026-06-01' }),
      ],
    }, TODAY);
    expect(items.filter((i) => i.kind === 'invoice_overdue')).toHaveLength(0);
  });

  it('warns about an invoice falling due inside a week, but not one further out', () => {
    const items = buildAttention({
      ...emptyInput,
      invoices: [
        invoice({ id: 'soon', invoice_number: 'RE-SOON', due_date: '2026-09-03' }),
        invoice({ id: 'later', invoice_number: 'RE-LATER', due_date: '2026-10-01' }),
      ],
    }, TODAY);
    expect(items.map((i) => i.title)).toEqual(['RE-SOON']);
    expect(items[0].meta).toBe('Fällig in 4 Tagen');
  });

  it('flags an offer the customer has not answered past its validity', () => {
    const items = buildAttention({
      ...emptyInput,
      offers: [offer({ id: 'o1', status: 'viewed', valid_until: '2026-08-10', title: 'Pilot' })],
    }, TODAY);
    expect(items[0].kind).toBe('offer_expired');
    expect(items[0].meta).toContain('20 Tagen');
  });

  it('flags a finalized offer that was never sent, and ignores archived offers entirely', () => {
    const items = buildAttention({
      ...emptyInput,
      offers: [
        offer({ id: 'o1', status: 'finalized', valid_until: null, title: 'Bereit' }),
        offer({ id: 'o2', status: 'finalized', valid_until: null, title: 'Abgelegt', archived_at: '2026-08-01T00:00:00Z' }),
      ],
    }, TODAY);
    expect(items.map((i) => i.title)).toEqual(['Bereit']);
    expect(items[0].kind).toBe('offer_awaiting_send');
  });

  it('collapses expenses awaiting review into one row rather than one per receipt', () => {
    const expense = (id: string, review: OwnerExpense['review_status']): OwnerExpense =>
      ({ id, review_status: review, archived_at: null } as OwnerExpense);
    const items = buildAttention({
      ...emptyInput,
      expenses: [expense('x1', 'pending'), expense('x2', 'pending'), expense('x3', 'reviewed')],
    }, TODAY);
    expect(items.filter((i) => i.kind === 'expense_review')).toHaveLength(1);
    expect(items[0].title).toBe('2 Ausgaben zur Prüfung');
  });

  it('is empty when nothing is late, expiring or unreviewed', () => {
    expect(buildAttention(emptyInput, TODAY)).toEqual([]);
  });
});

describe('buildUpcoming', () => {
  const subscription = (over: Partial<OwnerSubscription> & { id: string }): OwnerSubscription => ({
    id: over.id, business_entity_id: 'e1', vendor_id: null, category_id: null,
    name: 'Abo', billing_frequency: 'monthly', expected_net_cents: 1000,
    expected_gross_cents: 1190, vat_treatment: 'standard', next_billing_date: '2026-09-05',
    start_date: null, end_date: null, status: 'active', cancellation_notice_date: null, notes: null,
    ...over,
  });

  it('looks forward only — anything already late belongs to the attention list', () => {
    const items = buildUpcoming({
      invoices: [
        invoice({ id: 'late', invoice_number: 'RE-LATE', due_date: '2026-08-01' }),
        invoice({ id: 'next', invoice_number: 'RE-NEXT', due_date: '2026-09-10' }),
      ],
      offers: [],
      subscriptions: [],
    }, TODAY);
    expect(items.map((i) => i.title)).toEqual(['RE-NEXT']);
  });

  it('orders invoices, expiring offers and subscription renewals by date', () => {
    const items = buildUpcoming({
      invoices: [invoice({ id: 'i', invoice_number: 'RE', due_date: '2026-09-12' })],
      offers: [offer({ id: 'o', title: 'Angebot', valid_until: '2026-09-02' })],
      subscriptions: [subscription({ id: 's', name: 'Abo', next_billing_date: '2026-09-05' })],
    }, TODAY);
    expect(items.map((i) => i.title)).toEqual(['Angebot', 'Abo', 'RE']);
    expect(items[1].amountCents).toBe(1190);
  });

  it('respects the horizon', () => {
    const items = buildUpcoming({
      invoices: [invoice({ id: 'i', due_date: '2026-10-20' })], offers: [], subscriptions: [],
    }, TODAY, 30);
    expect(items).toHaveLength(0);
  });
});

describe('buildRecent', () => {
  it('reports a storno as a storno rather than as an issued invoice', () => {
    const items = buildRecent({
      invoices: [invoice({ id: 'i', invoice_number: 'RE-9', cancelled_at: '2026-08-20T00:00:00Z', cancellation_reason: 'Doppelt' })],
      offers: [], payments: [],
    });
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('RE-9 storniert');
    expect(items[0].meta).toBe('Doppelt');
  });

  it('lists newest first and ignores outgoing payments', () => {
    const items = buildRecent({
      invoices: [],
      offers: [offer({ id: 'o', offer_number: 'AN-1', accepted_at: '2026-08-10T00:00:00Z' })],
      payments: [
        { id: 'p1', payment_date: '2026-08-20', direction: 'inflow', amount_cents: 1000, invoice_id: null },
        { id: 'p2', payment_date: '2026-08-25', direction: 'outflow', amount_cents: 500, invoice_id: null },
      ],
    });
    expect(items.map((i) => i.date)).toEqual(['2026-08-20', '2026-08-10']);
  });
});

describe('summarisePipeline', () => {
  it('counts only offers still with the customer and keeps recurring separate from one-time', () => {
    const summary = summarisePipeline([
      offer({ id: 'a', status: 'sent', gross_total_cents: 100000, recurring_monthly_gross_cents: 5000 }),
      offer({ id: 'b', status: 'viewed', gross_total_cents: 50000 }),
      offer({ id: 'c', status: 'accepted', gross_total_cents: 900000 }),
      offer({ id: 'd', status: 'draft', gross_total_cents: 900000 }),
      offer({ id: 'e', status: 'sent', gross_total_cents: 700000, archived_at: '2026-08-01T00:00:00Z' }),
    ]);
    expect(summary.openCount).toBe(2);
    expect(summary.openOneTimeGrossCents).toBe(150000);
    expect(summary.openRecurringMonthlyGrossCents).toBe(5000);
  });
});

describe('monthlyCashSeries', () => {
  it('accumulates net cash across the year and separates direction', () => {
    const series = monthlyCashSeries([
      { payment_date: '2026-01-15', direction: 'inflow', amount_cents: 1000 },
      { payment_date: '2026-02-15', direction: 'outflow', amount_cents: 400 },
      { payment_date: '2026-03-15', direction: 'inflow', amount_cents: 200 },
    ]);
    expect(series.inflow[0]).toBe(1000);
    expect(series.outflow[1]).toBe(400);
    expect(series.net.slice(0, 4)).toEqual([1000, 600, 800, 800]);
  });
});

describe('receivableAging', () => {
  it('buckets open amounts by how late they are and totals only what is owed', () => {
    const aging = receivableAging([
      invoice({ id: 'a', due_date: '2026-09-15' }),
      invoice({ id: 'b', due_date: '2026-08-20' }),
      invoice({ id: 'c', due_date: '2026-07-10' }),
      invoice({ id: 'd', due_date: '2026-05-10' }),
      invoice({ id: 'e', status: 'paid', amount_paid_cents: 119000, due_date: '2026-05-10' }),
    ], TODAY);
    expect(aging.notDue).toBe(119000);
    expect(aging.d30).toBe(119000);
    expect(aging.d60).toBe(119000);
    expect(aging.d60plus).toBe(119000);
    expect(aging.total).toBe(476000);
  });
});
