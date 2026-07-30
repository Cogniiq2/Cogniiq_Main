import { supabase } from '@/lib/supabase';

// Organization-scoped commercial summary for the canonical customer detail page.
//
// Scoped by organization_id ONLY. It deliberately does not touch owner_customers: most
// real portal customers (Pankofer among them) have no CRM/owner_customers row at all,
// and requiring one is precisely what made the commercial side of the canonical
// /admin/clients/:organizationId page invisible. Nothing here creates, backfills or
// merges an owner_customers row.
//
// Both tables are owner-only under RLS, so this returns data only for a platform admin.

export interface OrganizationOfferSummary {
  id: string;
  offer_number: string | null;
  title: string | null;
  status: string;
  issue_date: string | null;
  valid_until: string | null;
  currency: string;
  gross_total_cents: number;
}

export interface OrganizationInvoiceSummary {
  id: string;
  invoice_number: string | null;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  gross_total_cents: number;
  amount_paid_cents: number;
}

export interface OrganizationCommercialOverview {
  offers: OrganizationOfferSummary[];
  invoices: OrganizationInvoiceSummary[];
  /** Sum of gross totals of invoices that are actually outstanding, by currency. */
  outstandingCentsByCurrency: Record<string, number>;
}

/** Statuses where money is still owed. Draft, void, cancelled and credited are not. */
const OUTSTANDING_INVOICE_STATUSES = ['issued', 'partially_paid', 'overdue'];

function toMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? 'Unbekannter Fehler');
}

export async function loadOrganizationCommercialOverview(
  organizationId: string,
): Promise<{ data: OrganizationCommercialOverview; error: string | null }> {
  const empty: OrganizationCommercialOverview = {
    offers: [], invoices: [], outstandingCentsByCurrency: {},
  };

  const [offersResult, invoicesResult] = await Promise.all([
    supabase
      .from('owner_offers')
      .select('id, offer_number, title, status, issue_date, valid_until, currency, gross_total_cents')
      .eq('organization_id', organizationId)
      .order('issue_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('owner_invoices')
      .select('id, invoice_number, status, issue_date, due_date, currency, gross_total_cents, amount_paid_cents')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('issue_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ]);

  if (offersResult.error) return { data: empty, error: toMessage(offersResult.error) };
  if (invoicesResult.error) return { data: empty, error: toMessage(invoicesResult.error) };

  const invoices = (invoicesResult.data ?? []) as OrganizationInvoiceSummary[];

  const outstandingCentsByCurrency: Record<string, number> = {};
  for (const invoice of invoices) {
    if (!OUTSTANDING_INVOICE_STATUSES.includes(invoice.status)) continue;
    const open = Math.max(invoice.gross_total_cents - invoice.amount_paid_cents, 0);
    if (open === 0) continue;
    outstandingCentsByCurrency[invoice.currency] =
      (outstandingCentsByCurrency[invoice.currency] ?? 0) + open;
  }

  return {
    data: {
      offers: (offersResult.data ?? []) as OrganizationOfferSummary[],
      invoices,
      outstandingCentsByCurrency,
    },
    error: null,
  };
}
