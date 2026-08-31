import { isBusinessCollection } from '@/lib/ownerFinance/paymentFlows';
import type {
  OwnerCustomerListRow, OwnerExpense, OwnerInvoice, OwnerOffer, OwnerSubscription,
} from '@/lib/ownerFinance/types';

/**
 * The Command Center's derivation layer.
 *
 * Every function here is pure: records in, view model out. Nothing fetches, nothing
 * mutates, and — this is the point — nothing invents a number. Each item traces back
 * to a field the backend already owns:
 *
 *   * "überfällig" is `due_date` against today on an invoice that is genuinely open,
 *     never a status the UI decided on its own.
 *   * open receivable is `gross_total_cents - amount_paid_cents`, the same subtraction
 *     the finance pages already do.
 *   * an offer's pipeline value is explicitly NOT revenue and is labelled as such by
 *     the caller; it never enters a cash or EÜR figure.
 *
 * Keeping it pure is what lets the attention logic be tested without a browser or a
 * backend, and what keeps the page component free of business rules.
 */

/* ------------------------------------------------------------------ helpers */

/** Whole days from `from` to `to`, both `YYYY-MM-DD`. Calendar maths, no timezones. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

/** An invoice still owed something. Cancelled and draft invoices are never receivables. */
export function openAmountCents(invoice: Pick<OwnerInvoice, 'status' | 'gross_total_cents' | 'amount_paid_cents' | 'cancelled_at'>): number {
  if (invoice.cancelled_at) return 0;
  if (!['issued', 'partially_paid', 'overdue'].includes(invoice.status)) return 0;
  return Math.max(0, invoice.gross_total_cents - invoice.amount_paid_cents);
}

/* --------------------------------------------------------------- attention */

export type AttentionKind =
  | 'invoice_overdue'
  | 'invoice_due_soon'
  | 'offer_expired'
  | 'offer_expiring'
  | 'offer_awaiting_send'
  | 'invoice_draft'
  | 'expense_review'
  | 'customer_waiting';

export type AttentionTone = 'danger' | 'attention' | 'neutral';

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  tone: AttentionTone;
  title: string;
  /** One line saying why this is here. Always states the fact, never a judgement. */
  meta: string;
  to: string;
  /** Present only where a real amount is attached to the item. */
  amountCents?: number;
  /** Sort weight — lower is more urgent. */
  rank: number;
}

export interface AttentionInput {
  invoices: OwnerInvoice[];
  offers: OwnerOffer[];
  expenses: OwnerExpense[];
  customers: OwnerCustomerListRow[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** `YYYY-MM-DD` → `DD.MM.YYYY`. Local to this module so it stays dependency-free. */
const de = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/**
 * Everything that wants the owner's decision today, ordered by how much it costs to
 * ignore. Money that is late outranks money that is merely open, which outranks
 * housekeeping.
 */
export function buildAttention(input: AttentionInput, today: string): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const invoice of input.invoices) {
    const open = openAmountCents(invoice);
    if (open <= 0) continue;
    if (!invoice.due_date) continue;
    const overdueDays = daysBetween(invoice.due_date, today);
    if (overdueDays > 0) {
      items.push({
        id: `inv-${invoice.id}`,
        kind: 'invoice_overdue',
        tone: 'danger',
        title: invoice.invoice_number ?? 'Rechnung ohne Nummer',
        meta: `Zahlungsziel seit ${plural(overdueDays, 'Tag', 'Tagen')} überschritten`,
        to: `/admin/finance/invoices/${invoice.id}`,
        amountCents: open,
        // Longer overdue first, and always ahead of everything else.
        rank: 0 - Math.min(overdueDays, 999),
      });
    } else if (overdueDays >= -7) {
      items.push({
        id: `inv-due-${invoice.id}`,
        kind: 'invoice_due_soon',
        tone: 'attention',
        title: invoice.invoice_number ?? 'Rechnung ohne Nummer',
        meta: overdueDays === 0 ? 'Heute fällig' : `Fällig in ${plural(-overdueDays, 'Tag', 'Tagen')}`,
        to: `/admin/finance/invoices/${invoice.id}`,
        amountCents: open,
        rank: 1200 + overdueDays,
      });
    }
  }

  for (const offer of input.offers) {
    if (offer.archived_at) continue;
    const awaitingCustomer = offer.status === 'sent' || offer.status === 'viewed';
    if (awaitingCustomer && offer.valid_until) {
      const expiredDays = daysBetween(offer.valid_until, today);
      if (expiredDays > 0) {
        items.push({
          id: `offer-exp-${offer.id}`,
          kind: 'offer_expired',
          tone: 'attention',
          title: offer.title ?? offer.offer_number ?? 'Angebot',
          meta: `Gültigkeit seit ${plural(expiredDays, 'Tag', 'Tagen')} abgelaufen — noch keine Antwort`,
          to: `/admin/finance/offers/${offer.id}`,
          rank: 1000 - Math.min(expiredDays, 200),
        });
      } else if (expiredDays >= -10) {
        items.push({
          id: `offer-expiring-${offer.id}`,
          kind: 'offer_expiring',
          tone: 'attention',
          title: offer.title ?? offer.offer_number ?? 'Angebot',
          meta: expiredDays === 0
            ? 'Läuft heute ab — noch keine Antwort'
            : `Läuft in ${plural(-expiredDays, 'Tag', 'Tagen')} ab — noch keine Antwort`,
          to: `/admin/finance/offers/${offer.id}`,
          rank: 1300 + expiredDays,
        });
      }
    }
    if (offer.status === 'finalized') {
      items.push({
        id: `offer-send-${offer.id}`,
        kind: 'offer_awaiting_send',
        tone: 'attention',
        title: offer.title ?? offer.offer_number ?? 'Angebot',
        meta: 'Finalisiert, aber noch nicht versendet',
        to: `/admin/finance/offers/${offer.id}`,
        rank: 1400,
      });
    }
  }

  for (const invoice of input.invoices) {
    if (invoice.status !== 'draft') continue;
    items.push({
      id: `draft-${invoice.id}`,
      kind: 'invoice_draft',
      tone: 'neutral',
      title: 'Rechnungsentwurf offen',
      meta: invoice.issue_date ? `Angelegt am ${de(invoice.issue_date)}` : 'Noch nicht gestellt',
      to: `/admin/finance/invoices/${invoice.id}`,
      amountCents: invoice.gross_total_cents,
      rank: 2200,
    });
  }

  const pendingExpenses = input.expenses.filter((e) => e.review_status === 'pending' && !e.archived_at);
  if (pendingExpenses.length) {
    items.push({
      id: 'expense-review',
      kind: 'expense_review',
      tone: 'neutral',
      title: `${plural(pendingExpenses.length, 'Ausgabe', 'Ausgaben')} zur Prüfung`,
      // `review_status = 'pending'` says only that nobody has reviewed the row yet. It
      // does not state that a receipt or an assignment is missing, so neither does this.
      meta: 'Noch nicht geprüft',
      to: '/admin/finance/expenses',
      rank: 2300,
    });
  }

  const waiting = input.customers.filter((c) => c.status === 'waiting');
  for (const customer of waiting) {
    items.push({
      id: `cust-wait-${customer.id}`,
      kind: 'customer_waiting',
      tone: 'neutral',
      title: customer.company?.trim() || customer.contact_name?.trim() || customer.email?.trim() || 'Kunde',
      meta: customer.open_task_count > 0
        ? `Wartend · ${plural(customer.open_task_count, 'offene Aufgabe', 'offene Aufgaben')}`
        : 'Wartend',
      to: `/admin/finance/customers/${customer.id}`,
      rank: 2000,
    });
  }

  return items.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title, 'de'));
}

/* ---------------------------------------------------------------- upcoming */

export interface UpcomingItem {
  id: string;
  date: string;
  title: string;
  meta: string;
  to: string;
  amountCents?: number;
}

/**
 * The next `horizonDays` of dated commitments — invoices falling due, offers running
 * out, subscriptions renewing. Strictly forward-looking: anything already late lives
 * in the attention list instead, so the two never say the same thing twice.
 */
export function buildUpcoming(
  input: { invoices: OwnerInvoice[]; offers: OwnerOffer[]; subscriptions: OwnerSubscription[] },
  today: string,
  horizonDays = 30,
): UpcomingItem[] {
  const items: UpcomingItem[] = [];

  for (const invoice of input.invoices) {
    const open = openAmountCents(invoice);
    if (open <= 0 || !invoice.due_date) continue;
    const inDays = daysBetween(today, invoice.due_date);
    if (inDays < 0 || inDays > horizonDays) continue;
    items.push({
      id: `inv-${invoice.id}`,
      date: invoice.due_date,
      title: invoice.invoice_number ?? 'Rechnung',
      meta: 'Zahlungsziel',
      to: `/admin/finance/invoices/${invoice.id}`,
      amountCents: open,
    });
  }

  for (const offer of input.offers) {
    if (offer.archived_at || !offer.valid_until) continue;
    if (offer.status !== 'sent' && offer.status !== 'viewed' && offer.status !== 'finalized') continue;
    const inDays = daysBetween(today, offer.valid_until);
    if (inDays < 0 || inDays > horizonDays) continue;
    items.push({
      id: `offer-${offer.id}`,
      date: offer.valid_until,
      title: offer.title ?? offer.offer_number ?? 'Angebot',
      meta: 'Angebot läuft ab',
      to: `/admin/finance/offers/${offer.id}`,
    });
  }

  for (const subscription of input.subscriptions) {
    if (subscription.status !== 'active' || !subscription.next_billing_date) continue;
    const inDays = daysBetween(today, subscription.next_billing_date);
    if (inDays < 0 || inDays > horizonDays) continue;
    items.push({
      id: `sub-${subscription.id}`,
      date: subscription.next_billing_date,
      title: subscription.name,
      meta: 'Abo wird abgerechnet',
      to: '/admin/finance/subscriptions',
      // Expected, not booked: the subscription's own planned amount, which is why
      // this panel is titled "Demnächst" and never contributes to a cash figure.
      amountCents: subscription.expected_gross_cents ?? undefined,
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'de'));
}

/* ------------------------------------------------------------------ recent */

export interface RecentItem {
  id: string;
  date: string;
  title: string;
  meta: string;
  /**
   * Where the event can actually be inspected. Absent when the ledger row has no record
   * page of its own — an unlinked payment is shown, but not sent to a list it is not in.
   */
  to?: string;
  tone: 'positive' | 'neutral' | 'attention';
}

/**
 * What actually happened, newest first. Payments received, invoices issued, offers
 * accepted — the events that moved the business, not a change log of every field.
 *
 * Only `kind = 'income'` inflows appear as a payment. The other inflow kinds — a private
 * capital contribution, a tax refund, a transfer between the owner's own accounts — are
 * real cash movements but not business events, and showing them here as
 * "Zahlungseingang" (let alone linking them to the invoice list) would claim a customer
 * paid when none did. They are left out; the liquidity figures on the finance overview
 * are where they belong.
 */
export function buildRecent(
  input: {
    invoices: OwnerInvoice[];
    offers: OwnerOffer[];
    payments: { id: string; payment_date: string | null; direction: string; kind: string; amount_cents: number; invoice_id: string | null }[];
  },
  limit = 8,
): RecentItem[] {
  const items: RecentItem[] = [];

  for (const payment of input.payments) {
    if (!payment.payment_date) continue;
    if (!isBusinessCollection(payment)) continue;
    const invoice = payment.invoice_id
      ? input.invoices.find((i) => i.id === payment.invoice_id)
      : undefined;
    items.push({
      id: `pay-${payment.id}`,
      date: payment.payment_date,
      title: 'Zahlungseingang verbucht',
      meta: payment.invoice_id ? (invoice?.invoice_number ?? 'Rechnung') : 'Ohne Rechnungsbezug',
      // Only an invoice-linked payment has a destination. Without a link there is no
      // payments workspace to open, so the entry stays a statement rather than becoming
      // a link into a list the payment does not appear in.
      to: payment.invoice_id ? `/admin/finance/invoices/${payment.invoice_id}` : undefined,
      tone: 'positive',
    });
  }

  for (const invoice of input.invoices) {
    if (invoice.cancelled_at) {
      items.push({
        id: `inv-cancel-${invoice.id}`,
        date: invoice.cancelled_at.slice(0, 10),
        title: `${invoice.invoice_number ?? 'Rechnung'} storniert`,
        meta: invoice.cancellation_reason ?? 'Storno erfasst',
        to: `/admin/finance/invoices/${invoice.id}`,
        tone: 'attention',
      });
      continue;
    }
    if (!invoice.issued_at) continue;
    items.push({
      id: `inv-issued-${invoice.id}`,
      date: invoice.issued_at.slice(0, 10),
      title: `${invoice.invoice_number ?? 'Rechnung'} gestellt`,
      meta: 'Rechnung ausgestellt',
      to: `/admin/finance/invoices/${invoice.id}`,
      tone: 'neutral',
    });
  }

  for (const offer of input.offers) {
    if (offer.accepted_at) {
      items.push({
        id: `offer-acc-${offer.id}`,
        date: offer.accepted_at.slice(0, 10),
        title: `${offer.offer_number ?? 'Angebot'} angenommen`,
        meta: offer.title ?? 'Angebot',
        to: `/admin/finance/offers/${offer.id}`,
        tone: 'positive',
      });
    }
  }

  return items
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'de'))
    .slice(0, limit);
}

/* ------------------------------------------------------------------- pulse */

export interface PipelineSummary {
  /** Offers sent or viewed and not yet decided. */
  openCount: number;
  /** One-time gross of those offers. Deliberately separate from recurring. */
  openOneTimeGrossCents: number;
  /** Committed recurring gross per month across those offers. */
  openRecurringMonthlyGrossCents: number;
}

/**
 * Offer pipeline. This is NOT revenue and never enters a cash, EÜR or VAT figure —
 * the caller labels it as expected, unbooked volume. Split one-time from recurring
 * because adding a monthly fee to a project total would misstate both.
 */
export function summarisePipeline(offers: OwnerOffer[]): PipelineSummary {
  const open = offers.filter((o) => !o.archived_at && (o.status === 'sent' || o.status === 'viewed'));
  return {
    openCount: open.length,
    openOneTimeGrossCents: open.reduce((sum, o) => sum + o.gross_total_cents, 0),
    openRecurringMonthlyGrossCents: open.reduce((sum, o) => sum + o.recurring_monthly_gross_cents, 0),
  };
}

// The monthly cash series moved to `paymentFlows.ts` as `monthlyPaymentFlows`, which
// separates customer collections from total liquidity instead of returning one pair of
// series that two pages then labelled differently.

/** Open receivables split by how late they are. Same buckets the overview aging uses. */
export function receivableAging(invoices: OwnerInvoice[], today: string): {
  notDue: number; d30: number; d60: number; d60plus: number; total: number;
} {
  const buckets = { notDue: 0, d30: 0, d60: 0, d60plus: 0, total: 0 };
  for (const invoice of invoices) {
    const open = openAmountCents(invoice);
    if (open <= 0) continue;
    buckets.total += open;
    if (!invoice.due_date) { buckets.notDue += open; continue; }
    const days = daysBetween(invoice.due_date, today);
    if (days <= 0) buckets.notDue += open;
    else if (days <= 30) buckets.d30 += open;
    else if (days <= 60) buckets.d60 += open;
    else buckets.d60plus += open;
  }
  return buckets;
}
