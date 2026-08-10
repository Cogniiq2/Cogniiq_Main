// Response fixtures for every RPC the product calls.
//
// Shapes are derived from the CONSUMER side — the `as X` cast at each `supabase.rpc(...)`
// call site in `src/lib/**` — rather than guessed from the SQL. Read RPCs return the row
// or object the caller declares; write RPCs return the minimal successful result the
// caller destructures, because a QA run must be able to open a form and submit it without
// the UI erroring, while nothing is actually persisted anywhere.
//
// TEST-ONLY — never imported from `src/`.

import { ID, NAMES, EMAILS } from './ids.mjs';
import {
  customer_documents,
  customer_project_milestones,
  customer_projects,
  owner_offers,
} from './tables.mjs';

/* --------------------------------------------------- owner finance analytics */

/** PeriodSummary — src/lib/ownerFinance/types.ts */
const ownerFinancePeriodSummary = {
  entity: ID.entity,
  from: '2026-01-01',
  to: '2026-08-04',
  invoiced_net_cents: 4_182_000,
  invoiced_vat_cents: 794_580,
  invoiced_gross_cents: 4_976_580,
  outstanding_cents: 428_400,
  overdue_cents: 0,
  overdue_count: 0,
  cash_in_cents: 4_548_180,
  cash_out_cents: 612_940,
  expense_net_cents: 498_320,
  expense_gross_cents: 528_140,
  expense_input_vat_cents: 62_180,
  recurring_monthly_cost_cents: 51_000,
  review_expense_count: 1,
};

/** TaxPeriodInputs — src/lib/ownerFinance/api.ts */
const ownerTaxPeriodInputs = {
  vat_timing: 'ist',
  paid_revenue_net_cents: 3_822_000,
  paid_expense_deductible_net_cents: 498_320,
  vat_output_cents: 726_180,
  vat_reverse_charge_output_cents: 7_843,
  vat_input_cents: 62_180,
  has_unlinked_income: false,
  has_unresolved_treatment: true,
  missing_service_date: false,
  recurring_flag_count: 2,
  filing_ready: false,
  warnings: [
    'Ein Beleg wartet noch auf die Zuordnung des Privatanteils.',
    'Die Juni-Belege sind noch nicht vollständig erfasst.',
  ],
};

/* ------------------------------------------------------------ owner customers */

/** OwnerCustomerListRow[] — src/lib/ownerFinance/types.ts */
const ownerListCustomers = [
  {
    id: ID.customerA, company: NAMES.orgA, contact_name: NAMES.customerPerson,
    email: EMAILS.customer, phone: '+49 921 7304512', status: 'active',
    notes: 'Zahlungsverhalten einwandfrei.', client_account_id: ID.accountA,
    last_activity_at: '2026-07-30T10:12:00Z', created_at: '2026-01-04T09:00:00Z', completed_at: null,
    offer_count: 1, open_task_count: 1, completed_task_count: 4,
  },
  {
    id: ID.customerB, company: NAMES.orgB, contact_name: NAMES.contactPerson,
    email: EMAILS.contact, phone: '+49 431 2298840', status: 'waiting',
    notes: null, client_account_id: ID.accountB,
    last_activity_at: '2026-07-28T09:00:00Z', created_at: '2026-02-17T09:00:00Z', completed_at: null,
    offer_count: 1, open_task_count: 1, completed_task_count: 0,
  },
  {
    id: ID.customerC, company: NAMES.orgC, contact_name: 'Elisabeth Baumgartner-Reithofer',
    email: 'e.baumgartner@ov-gebaeudetechnik.de', phone: null, status: 'completed',
    notes: null, client_account_id: null,
    last_activity_at: '2026-05-30T09:00:00Z', created_at: '2025-12-02T09:00:00Z',
    completed_at: '2026-05-30T09:00:00Z',
    offer_count: 2, open_task_count: 0, completed_task_count: 9,
  },
];

/** OwnerCustomer — the full record behind the list row. */
const ownerCustomerRecord = {
  id: ID.customerA, business_entity_id: ID.entity, client_account_id: ID.accountA,
  organization_id: ID.orgA, company: NAMES.orgA, contact_name: NAMES.customerPerson,
  email: EMAILS.customer, phone: '+49 921 7304512',
  street: 'Bahnhofstraße 14', postal_code: '95444', city: 'Bayreuth', country_code: 'DE',
  status: 'active', notes: 'Zahlungsverhalten einwandfrei. Ansprechpartner bevorzugt Telefon.',
  last_activity_at: '2026-07-30T10:12:00Z', completed_at: null, completed_by: null,
  created_by: ID.ownerUser, created_at: '2026-01-04T09:00:00Z', updated_at: '2026-07-30T10:12:00Z',
};

/** OwnerCustomerDetail — src/lib/ownerFinance/types.ts */
const ownerCustomerDetail = {
  customer: ownerCustomerRecord,
  offers: [
    {
      id: ID.offerA, offer_number: 'AN-2026-0142',
      title: 'KI-Telefonassistent für die Notdienstannahme',
      status: 'accepted', currency: 'EUR', gross_total_cents: 1_489_999,
      created_at: '2026-07-10T09:00:00Z', valid_until: '2026-08-13',
      accepted_at: '2026-07-21T10:32:00Z', archived_at: null, sent_at: '2026-07-14T08:01:12Z',
    },
  ],
  tasks: [
    {
      id: ID.taskA, business_entity_id: ID.entity, customer_id: ID.customerA,
      title: 'Gesprächsleitfaden Notdienst mit Kunden abstimmen',
      description: 'Abstimmung mit Herrn Schwarzenbeck zur Eskalationslogik.',
      status: 'in_progress', priority: 'high', due_date: '2026-08-05', sort_order: 1,
      notes: null, completed_at: null, completed_by: null, created_by: ID.ownerUser,
      created_at: '2026-07-28T09:00:00Z', updated_at: '2026-07-30T10:12:00Z',
    },
    {
      id: ID.taskB, business_entity_id: ID.entity, customer_id: ID.customerA,
      title: 'Rufnummernportierung mit Telekom final bestätigen',
      description: null, status: 'open', priority: 'urgent', due_date: '2026-08-07',
      sort_order: 2, notes: null, completed_at: null, completed_by: null,
      created_by: ID.ownerUser, created_at: '2026-07-29T09:00:00Z', updated_at: '2026-07-29T09:00:00Z',
    },
  ],
  activity: [
    { id: 'act-1', event_type: 'offer_accepted', summary: 'Angebot AN-2026-0142 wurde angenommen.', created_at: '2026-07-21T10:32:00Z', related_offer_id: ID.offerA, related_task_id: null },
    { id: 'act-2', event_type: 'offer_sent', summary: 'Angebot AN-2026-0142 wurde per E-Mail versendet.', created_at: '2026-07-14T08:01:12Z', related_offer_id: ID.offerA, related_task_id: null },
    { id: 'act-3', event_type: 'task_created', summary: 'Aufgabe „Gesprächsleitfaden Notdienst mit Kunden abstimmen" wurde angelegt.', created_at: '2026-07-28T09:00:00Z', related_offer_id: null, related_task_id: ID.taskA },
  ],
};

/* ------------------------------------------------------- offer acceptance */

/** OwnerOfferAcceptanceSummary — src/lib/ownerFinance/types.ts */
const ownerOfferAcceptanceSummary = {
  offer_id: ID.offerA, offer_number: 'AN-2026-0142',
  title: 'KI-Telefonassistent für die Notdienstannahme',
  status: 'accepted', accepted: true, accepted_at: '2026-07-21T10:32:00Z',
  signer_name: NAMES.customerPerson, signer_company: NAMES.orgA,
  signer_email: EMAILS.customer, signer_role: 'Geschäftsführender Gesellschafter',
  accepted_gross_cents: 1_489_999, currency: 'EUR', terms_version: 'agb-2026.1',
  signature_level: 'simple', signature_storage_path: 'signaturen/2026/AN-2026-0142.png',
  signature_sha256: '9f2c4b71e08a35d6c1f7b48e2093ad55',
  document_version: 2, source_hash: 'a3f19c4e8b2d7016',
  invoice: { id: ID.invoiceA, invoice_number: 'RE-2026-0088', status: 'issued', gross_total_cents: 428_400, due_date: '2026-07-15' },
  certificate: { document_id: 'gd-1', version: 2, storage_path: 'dokumente/2026/AN-2026-0142-v2.pdf', document_number: 'AN-2026-0142', generated_at: '2026-07-14T08:00:00Z' },
  automation_jobs: [
    { id: 'job-1', job_type: 'offer_email', status: 'succeeded', attempt_count: 1, max_attempts: 5, last_error: null, last_error_at: null, provider_message_id: 'msg-8841', scheduled_at: '2026-07-14T08:01:00Z', sent_at: '2026-07-14T08:01:12Z', completed_at: '2026-07-14T08:01:12Z', updated_at: '2026-07-14T08:01:12Z' },
  ],
};

/* -------------------------------------------------------------- execution */

const generateDailyExecutionPlan = {
  day_id: 'ed-1',
  day: '2026-08-04',
  generated: 3,
  focus: 'Go-Live-Vorbereitung Musterbau',
};

/* ------------------------------------------------------------------ table */

/**
 * READ RPCs — the ones a page needs in order to render at all. Values here are what
 * decides whether a route reaches a populated state.
 */
export const readRpc = {
  // Capability authorization. Added after PR #21: every /app route now renders behind
  // CapabilityRoute, which fails CLOSED without this context — so a fixture run that
  // omitted it would capture the denial screen on every customer route rather than the
  // page. The customer is given the BASELINE capability set, which is exactly what an
  // existing customer with no functional role holds.
  current_user_portal_context: {
    user_id: ID.customerUser,
    platform_role: 'customer',
    is_platform_admin: false,
    organizations: [
      {
        membership_id: ID.membershipA,
        organization_id: ID.orgA,
        organization_name: NAMES.orgA,
        organization_slug: 'musterbau-bayreuth',
        organization_status: 'active',
        organization_role: 'member',
        membership_status: 'active',
        roles: [],
        capabilities: [
          'portal.overview.view',
          'portal.projects.view',
          'portal.documents.view',
          'portal.billing.view',
          'portal.support.create',
          'portal.support.view_own',
        ],
        solutions: [],
        portal_settings: null,
      },
    ],
  },

  // customer portal
  list_customer_projects: customer_projects,
  // Returns a SET, not a row: fetchCustomerProject does `(data ?? [])` then `rows[0]`.
  // Handing it a bare object silently yields undefined and the page shows its empty state.
  get_customer_project: [customer_projects[0]],
  list_customer_project_milestones: customer_project_milestones,
  list_customer_documents: customer_documents,
  list_customer_invoices: [
    { invoice_id: ID.invoiceA, project_id: ID.projectA, invoice_number: 'RE-2026-0088', status: 'issued', issue_date: '2026-07-01', due_date: '2026-07-15', currency: 'EUR', net_total_cents: 360_000, vat_total_cents: 68_400, gross_total_cents: 428_400, amount_paid_cents: 0, outstanding_cents: 428_400, pdf_document_id: ID.documentA },
    { invoice_id: ID.invoiceB, project_id: ID.projectA, invoice_number: 'RE-2026-0071', status: 'paid', issue_date: '2026-05-02', due_date: '2026-05-16', currency: 'EUR', net_total_cents: 1_000_000, vat_total_cents: 190_000, gross_total_cents: 1_190_000, amount_paid_cents: 1_190_000, outstanding_cents: 0, pdf_document_id: null },
  ],

  // owner finance
  owner_finance_period_summary: ownerFinancePeriodSummary,
  owner_tax_period_inputs: ownerTaxPeriodInputs,
  owner_list_customers: ownerListCustomers,
  owner_customer_detail: ownerCustomerDetail,
  owner_offer_acceptance_summary: ownerOfferAcceptanceSummary,

  // public document portal
  public_offer_by_token: { offer: owner_offers[0], lines: [], settings: null, terms_version: 'agb-2026.1' },

  // execution
  generate_daily_execution_plan: generateDailyExecutionPlan,
};

/**
 * WRITE RPCs — a QA run must be able to submit a form without the UI throwing, but
 * nothing is persisted. Each entry is the minimal value the caller destructures.
 */
export const writeRpc = {
  archive_customer_document: null,
  archive_customer_project: null,
  assign_invoice_organization: null,
  claim_my_client_invitations: { claimed: 0 },
  convert_owner_offer_to_invoice_draft: ID.invoiceC,
  create_crm_only_client: { organization_id: ID.orgA, client_account_id: ID.accountA },
  create_customer_project_for_organization: ID.projectA,
  create_customer_project_for_owner_customer: ID.projectA,
  create_customer_project_milestone: ID.milestoneC,
  create_offer_access_token: 'qa-offer-token-0142',
  create_owner_expense: ID.expenseA,
  create_owner_invoice: ID.invoiceC,
  create_owner_offer: ID.offerC,
  create_owner_offer_revision: ID.offerA,
  delete_customer_project_milestone: null,
  delete_owner_draft_invoice: null,
  delete_owner_offer_draft: null,
  finalize_owner_offer: { offer_id: ID.offerA, version: 3, offer_number: 'AN-2026-0142' },
  issue_owner_invoice: { invoice_id: ID.invoiceC, invoice_number: 'RE-2026-0092' },
  link_customer_project_invoice: null,
  owner_archive_offer: null,
  owner_create_customer: ID.customerA,
  owner_create_customer_task: ID.taskA,
  owner_delete_customer_task: null,
  owner_enqueue_offer_email: { job_id: 'job-1' },
  owner_link_offer_customer: null,
  owner_reorder_customer_tasks: null,
  owner_retry_automation_job: null,
  owner_set_customer_status: null,
  owner_set_customer_task_status: null,
  owner_unarchive_offer: null,
  owner_update_customer: null,
  owner_update_customer_task: null,
  record_owner_expense_payment: null,
  record_owner_invoice_payment: null,
  register_customer_document_from_owner_source: ID.documentC,
  register_owner_generated_document: 'gd-1',
  respond_offer_by_token: { accepted: true },
  set_customer_document_visibility: null,
  set_customer_project_next_action: null,
  set_owner_offer_status: null,
  unlink_customer_project_invoice: null,
  update_customer_project: null,
  update_customer_project_milestone: null,
  update_owner_offer_draft: null,
  upsert_owner_document_settings: null,
};

export const rpc = { ...readRpc, ...writeRpc };

/** Names the harness treats as "must be answered or the route cannot render". */
export const requiredReadRpcNames = Object.keys(readRpc);
