// =============================================================================
// Fixtured Supabase responses for Admin Center browser QA
// =============================================================================
// Every value here is INVENTED. Nothing in this file is production data, and no
// script that imports it may talk to a real Supabase project: the browser QA
// runners intercept the network and answer from this module instead.
//
// Why it exists: the shell QA (qa-admin-shell.mjs) answers every read with an
// empty array, which is exactly right for measuring rail geometry but leaves
// every page in its empty state. Composition, density, table rhythm and the
// Command Center's attention logic can only be judged with rows on screen, so
// the visual runner answers from a small, deliberately-shaped business:
// receivables that are overdue, offers waiting on the customer, tasks that are
// due, and a customer with a real commercial history.

export const ENTITY_ID = 'e0000000-0000-4000-8000-000000000001';
export const USER_ID = '11111111-1111-1111-1111-111111111111';
export const CUSTOMER_ID = 'c0000000-0000-4000-8000-000000000001';

const YEAR = 2026;
const iso = (m, d) => `${YEAR}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const at = (m, d) => `${iso(m, d)}T09:12:00Z`;

/* ------------------------------------------------------------------ entity */

const ENTITY = {
  id: ENTITY_ID,
  slug: 'cogniiq',
  display_name: 'Cogniiq',
  legal_name: 'Cogniiq (Einzelunternehmen)',
  legal_form: 'einzelunternehmen',
  business_type: 'services',
  accounting_method: 'euer',
  vat_scheme: 'regular',
  currency: 'EUR',
  country_code: 'DE',
  federal_state: 'BY',
  municipality: 'Bayreuth',
  business_start_date: '2025-04-01',
  is_active: true,
  calculations_enabled: true,
  elster_direct_submission_enabled: false,
};

const TAX_SETTINGS = {
  id: 't0000000-0000-4000-8000-000000000001',
  business_entity_id: ENTITY_ID,
  tax_year: YEAR,
  vat_timing: 'ist',
  vat_filing_frequency: 'quarterly',
  dauerfristverlaengerung: false,
  municipality: 'Bayreuth',
  trade_tax_hebesatz_bp: 4250,
  assessment_mode: 'single',
  church_tax_enabled: false,
  church_tax_rate_bp: null,
  estimated_other_taxable_income_cents: 0,
  manual_personal_adjustments_cents: 0,
  total_positive_income_cents: null,
  income_tax_prepayments_cents: 120000,
  trade_tax_prepayments_cents: 0,
  vat_prepayments_cents: 0,
  soli_prepayments_cents: 0,
  church_tax_prepayments_cents: 0,
  reserve_horizon_days: 90,
  setup_complete: true,
  assumptions_notes: null,
};

/* --------------------------------------------------------------- customers */

const CUSTOMERS = [
  {
    id: CUSTOMER_ID,
    company: 'Zahnarztpraxis Dr. Merten',
    contact_name: 'Dr. Anna Merten',
    email: 'praxis@merten-dental.invalid',
    phone: '+49 921 1234567',
    street: 'Maximilianstraße 14',
    postal_code: '95444',
    city: 'Bayreuth',
    status: 'active',
    notes: 'Empfangsassistent seit Mai aktiv. Zweiter Standort in Vorbereitung.',
    client_account_id: null,
    organization_id: null,
    archived_at: null,
    last_activity_at: at(8, 27),
    created_at: at(4, 8),
    completed_at: null,
    offer_count: 3,
    invoice_count: 5,
    open_invoice_count: 2,
    revenue_gross_cents: 1487500,
    open_task_count: 3,
    completed_task_count: 11,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    company: 'Gasthof Sonnenhof GmbH',
    contact_name: 'Michael Brandt',
    email: 'info@sonnenhof.invalid',
    phone: '+49 9241 998877',
    street: 'Am Marktplatz 3',
    postal_code: '95445',
    city: 'Bayreuth',
    status: 'active',
    notes: null,
    client_account_id: null,
    organization_id: null,
    archived_at: null,
    last_activity_at: at(8, 25),
    created_at: at(5, 19),
    completed_at: null,
    offer_count: 2,
    invoice_count: 3,
    open_invoice_count: 1,
    revenue_gross_cents: 654500,
    open_task_count: 1,
    completed_task_count: 6,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    company: 'Immobilien Kettner & Partner',
    contact_name: 'Sabine Kettner',
    email: 's.kettner@kettner-immo.invalid',
    phone: '+49 941 445566',
    street: 'Donaustraße 22',
    postal_code: '93047',
    city: 'Regensburg',
    status: 'waiting',
    notes: 'Wartet auf Freigabe der Telefonanlage durch den IT-Dienstleister.',
    client_account_id: null,
    organization_id: null,
    archived_at: null,
    last_activity_at: at(8, 12),
    created_at: at(6, 2),
    completed_at: null,
    offer_count: 1,
    invoice_count: 1,
    open_invoice_count: 1,
    revenue_gross_cents: 297500,
    open_task_count: 4,
    completed_task_count: 2,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    company: 'Physiotherapie Aktiv Regensburg',
    contact_name: 'Tobias Lang',
    email: 'kontakt@aktiv-physio.invalid',
    phone: '+49 941 223344',
    street: 'Landshuter Straße 8',
    postal_code: '93053',
    city: 'Regensburg',
    status: 'active',
    notes: null,
    client_account_id: null,
    organization_id: null,
    archived_at: null,
    last_activity_at: at(8, 21),
    created_at: at(3, 14),
    completed_at: null,
    offer_count: 2,
    invoice_count: 4,
    open_invoice_count: 0,
    revenue_gross_cents: 892500,
    open_task_count: 0,
    completed_task_count: 9,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    company: 'Steuerkanzlei Hofmann',
    contact_name: 'Peter Hofmann',
    email: 'p.hofmann@kanzlei-hofmann.invalid',
    phone: '+49 89 776655',
    street: 'Leopoldstraße 101',
    postal_code: '80802',
    city: 'München',
    status: 'completed',
    notes: null,
    client_account_id: null,
    organization_id: null,
    archived_at: null,
    last_activity_at: at(7, 30),
    created_at: at(2, 3),
    completed_at: at(7, 30),
    offer_count: 1,
    invoice_count: 2,
    open_invoice_count: 0,
    revenue_gross_cents: 476000,
    open_task_count: 0,
    completed_task_count: 5,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000006',
    company: 'Autohaus Weber',
    contact_name: 'Jonas Weber',
    email: 'j.weber@autohaus-weber.invalid',
    phone: '+49 921 556677',
    street: 'Bayreuther Straße 90',
    postal_code: '95448',
    city: 'Bayreuth',
    status: 'archived',
    notes: null,
    client_account_id: null,
    organization_id: null,
    archived_at: at(6, 30),
    last_activity_at: at(6, 30),
    created_at: at(1, 22),
    completed_at: null,
    offer_count: 1,
    invoice_count: 0,
    open_invoice_count: 0,
    revenue_gross_cents: 0,
    open_task_count: 0,
    completed_task_count: 1,
  },
];

/* ---------------------------------------------------------------- invoices */

const invoice = (over) => ({
  id: over.id,
  business_entity_id: ENTITY_ID,
  organization_id: null,
  client_account_id: null,
  owner_customer_id: over.owner_customer_id ?? CUSTOMER_ID,
  engagement_id: null,
  invoice_number: over.invoice_number ?? null,
  status: over.status,
  issue_date: over.issue_date ?? null,
  service_date: over.issue_date ?? null,
  due_date: over.due_date ?? null,
  currency: 'EUR',
  net_total_cents: over.net_total_cents,
  vat_total_cents: Math.round(over.net_total_cents * 0.19),
  gross_total_cents: over.net_total_cents + Math.round(over.net_total_cents * 0.19),
  amount_paid_cents: over.amount_paid_cents ?? 0,
  notes: null,
  external_reference: null,
  // Only a genuinely issued invoice carries issued_at — a draft must never look
  // like it was ever put in front of a customer.
  issued_at: over.status === 'draft' || !over.issue_date ? null : `${over.issue_date}T10:00:00Z`,
  archived_at: null,
  historical_entry: false,
  cancelled_at: over.cancelled_at ?? null,
  cancelled_by: null,
  cancellation_reason: over.cancellation_reason ?? null,
  created_at: over.created_at ?? `${over.issue_date ?? iso(8, 1)}T10:00:00Z`,
  updated_at: at(8, 28),
});

const INVOICES = [
  invoice({ id: 'i1', invoice_number: 'RE-2026-0018', status: 'overdue', issue_date: iso(6, 12), due_date: iso(6, 26), net_total_cents: 285000 }),
  invoice({ id: 'i2', invoice_number: 'RE-2026-0021', status: 'overdue', issue_date: iso(7, 3), due_date: iso(7, 17), net_total_cents: 142000, owner_customer_id: 'c0000000-0000-4000-8000-000000000003' }),
  invoice({ id: 'i3', invoice_number: 'RE-2026-0024', status: 'partially_paid', issue_date: iso(8, 1), due_date: iso(8, 15), net_total_cents: 380000, amount_paid_cents: 190000, owner_customer_id: 'c0000000-0000-4000-8000-000000000002' }),
  invoice({ id: 'i4', invoice_number: 'RE-2026-0026', status: 'issued', issue_date: iso(8, 18), due_date: iso(9, 1), net_total_cents: 96000 }),
  invoice({ id: 'i5', invoice_number: 'RE-2026-0027', status: 'issued', issue_date: iso(8, 26), due_date: iso(9, 9), net_total_cents: 240000, owner_customer_id: 'c0000000-0000-4000-8000-000000000004' }),
  invoice({ id: 'i6', invoice_number: 'RE-2026-0012', status: 'paid', issue_date: iso(4, 9), due_date: iso(4, 23), net_total_cents: 450000, amount_paid_cents: 535500 }),
  invoice({ id: 'i7', invoice_number: 'RE-2026-0014', status: 'paid', issue_date: iso(5, 6), due_date: iso(5, 20), net_total_cents: 320000, amount_paid_cents: 380800, owner_customer_id: 'c0000000-0000-4000-8000-000000000004' }),
  invoice({ id: 'i8', invoice_number: 'RE-2026-0016', status: 'paid', issue_date: iso(5, 28), due_date: iso(6, 11), net_total_cents: 175000, amount_paid_cents: 208250, owner_customer_id: 'c0000000-0000-4000-8000-000000000002' }),
  invoice({ id: 'i9', invoice_number: null, status: 'draft', issue_date: iso(8, 29), due_date: null, net_total_cents: 128000, owner_customer_id: 'c0000000-0000-4000-8000-000000000003' }),
  invoice({ id: 'i10', invoice_number: 'RE-2026-0009', status: 'cancelled', issue_date: iso(3, 11), due_date: iso(3, 25), net_total_cents: 88000, cancelled_at: at(3, 18), cancellation_reason: 'Doppelt erfasst' }),
];

/* ------------------------------------------------------------------ offers */

const offer = (over) => ({
  id: over.id,
  business_entity_id: ENTITY_ID,
  organization_id: null,
  client_account_id: null,
  engagement_id: null,
  offer_number: over.offer_number ?? null,
  status: over.status,
  title: over.title,
  issue_date: over.issue_date ?? null,
  valid_until: over.valid_until ?? null,
  currency: 'EUR',
  introduction: null, scope: null, assumptions: null, exclusions: null,
  payment_terms: null, delivery_terms: null, internal_notes: null,
  subtitle: null, executive_summary: null, project_approach: null, next_steps: null,
  desired_outcomes: [], timeline: [], payment_schedule: [],
  template_key: 'premium',
  recipient_source: 'crm',
  recipient_company: over.recipient_company ?? null,
  recipient_contact_name: null, recipient_department: null, recipient_street: null,
  recipient_postal_code: null, recipient_city: null, recipient_country_code: 'DE',
  recipient_email: null, recipient_phone: null, recipient_vat_id: null,
  recipient_salutation: null, recipient_title: null, recipient_first_name: null,
  recipient_last_name: null, recipient_greeting_name: null,
  net_total_cents: over.net_total_cents ?? 0,
  vat_total_cents: Math.round((over.net_total_cents ?? 0) * 0.19),
  gross_total_cents: (over.net_total_cents ?? 0) + Math.round((over.net_total_cents ?? 0) * 0.19),
  recurring_monthly_net_cents: over.recurring ?? 0,
  recurring_monthly_vat_cents: Math.round((over.recurring ?? 0) * 0.19),
  recurring_monthly_gross_cents: (over.recurring ?? 0) + Math.round((over.recurring ?? 0) * 0.19),
  finalized_version: over.status === 'draft' ? null : 1,
  accepted_at: over.accepted_at ?? null,
  rejected_at: null, rejection_reason: null, expired_at: null,
  converted_invoice_id: null, converted_at: null,
  owner_customer_id: over.owner_customer_id ?? CUSTOMER_ID,
  archived_at: null, archived_by: null,
  created_at: over.created_at ?? at(8, 1),
  updated_at: at(8, 28),
});

const OFFERS = [
  offer({ id: 'o1', offer_number: 'AN-2026-0031', status: 'sent', title: 'KI-Telefonassistent — Zweitstandort', recipient_company: 'Zahnarztpraxis Dr. Merten', issue_date: iso(8, 20), valid_until: iso(9, 17), net_total_cents: 480000, recurring: 39000, created_at: at(8, 20) }),
  offer({ id: 'o2', offer_number: 'AN-2026-0029', status: 'viewed', title: 'Prozessautomatisierung Angebotswesen', recipient_company: 'Immobilien Kettner & Partner', owner_customer_id: 'c0000000-0000-4000-8000-000000000003', issue_date: iso(8, 11), valid_until: iso(9, 8), net_total_cents: 690000, created_at: at(8, 11) }),
  offer({ id: 'o3', offer_number: 'AN-2026-0026', status: 'accepted', title: 'Reservierungsannahme rund um die Uhr', recipient_company: 'Gasthof Sonnenhof GmbH', owner_customer_id: 'c0000000-0000-4000-8000-000000000002', issue_date: iso(7, 14), valid_until: iso(8, 11), net_total_cents: 380000, recurring: 24900, accepted_at: at(7, 22), created_at: at(7, 14) }),
  offer({ id: 'o4', offer_number: 'AN-2026-0024', status: 'finalized', title: 'Website-Relaunch inkl. Terminbuchung', recipient_company: 'Physiotherapie Aktiv Regensburg', owner_customer_id: 'c0000000-0000-4000-8000-000000000004', issue_date: iso(8, 5), valid_until: iso(9, 2), net_total_cents: 265000, created_at: at(8, 5) }),
  offer({ id: 'o5', offer_number: null, status: 'draft', title: 'Erweiterung Wissensdatenbank', recipient_company: 'Zahnarztpraxis Dr. Merten', net_total_cents: 145000, created_at: at(8, 28) }),
  offer({ id: 'o6', offer_number: 'AN-2026-0018', status: 'expired', title: 'Pilot Sprachassistent', recipient_company: 'Steuerkanzlei Hofmann', owner_customer_id: 'c0000000-0000-4000-8000-000000000005', issue_date: iso(5, 2), valid_until: iso(5, 30), net_total_cents: 210000, created_at: at(5, 2) }),
];

/* ---------------------------------------------------------------- payments */

const PAYMENTS = [
  { id: 'p1', payment_date: iso(4, 21), direction: 'inflow', amount_cents: 535500, invoice_id: 'i6' },
  { id: 'p2', payment_date: iso(5, 18), direction: 'inflow', amount_cents: 380800, invoice_id: 'i7' },
  { id: 'p3', payment_date: iso(6, 9), direction: 'inflow', amount_cents: 208250, invoice_id: 'i8' },
  { id: 'p4', payment_date: iso(8, 12), direction: 'inflow', amount_cents: 190000, invoice_id: 'i3' },
  { id: 'p5', payment_date: iso(4, 4), direction: 'outflow', amount_cents: 71400, invoice_id: null },
  { id: 'p6', payment_date: iso(5, 5), direction: 'outflow', amount_cents: 64260, invoice_id: null },
  { id: 'p7', payment_date: iso(6, 5), direction: 'outflow', amount_cents: 83300, invoice_id: null },
  { id: 'p8', payment_date: iso(7, 5), direction: 'outflow', amount_cents: 59500, invoice_id: null },
  { id: 'p9', payment_date: iso(8, 5), direction: 'outflow', amount_cents: 76160, invoice_id: null },
];

/* ---------------------------------------------------------------- expenses */

const CATEGORIES = [
  { id: 'cat1', label: 'Software & Lizenzen', code: 'software', is_active: true },
  { id: 'cat2', label: 'Telekommunikation', code: 'telco', is_active: true },
  { id: 'cat3', label: 'Fremdleistungen', code: 'external', is_active: true },
  { id: 'cat4', label: 'Bürobedarf', code: 'office', is_active: true },
];

const expense = (over) => ({
  id: over.id,
  business_entity_id: ENTITY_ID,
  vendor_id: null, organization_id: null, client_account_id: null,
  category_id: over.category_id,
  subscription_id: null,
  supplier_invoice_number: over.supplier_invoice_number ?? null,
  invoice_date: over.invoice_date,
  service_date: over.invoice_date,
  due_date: over.invoice_date,
  payment_status: over.payment_status ?? 'paid',
  currency: 'EUR',
  net_total_cents: over.net_total_cents,
  vat_total_cents: Math.round(over.net_total_cents * 0.19),
  gross_total_cents: over.net_total_cents + Math.round(over.net_total_cents * 0.19),
  input_vat_cents: Math.round(over.net_total_cents * 0.19),
  reverse_charge_vat_cents: 0,
  deductible_net_cents: over.net_total_cents,
  amount_paid_cents: over.payment_status === 'unpaid' ? 0 : over.net_total_cents + Math.round(over.net_total_cents * 0.19),
  review_status: over.review_status ?? 'reviewed',
  review_reason: over.review_status === 'pending' ? 'Beleg fehlt' : null,
  notes: null,
  archived_at: null,
  created_at: `${over.invoice_date}T08:00:00Z`,
});

const EXPENSES = [
  expense({ id: 'x1', category_id: 'cat1', supplier_invoice_number: 'SF-8821', invoice_date: iso(8, 3), net_total_cents: 24900 }),
  expense({ id: 'x2', category_id: 'cat2', supplier_invoice_number: 'TK-4412', invoice_date: iso(8, 5), net_total_cents: 18600 }),
  expense({ id: 'x3', category_id: 'cat3', supplier_invoice_number: 'FL-0091', invoice_date: iso(7, 28), net_total_cents: 145000 }),
  expense({ id: 'x4', category_id: 'cat1', supplier_invoice_number: 'SF-8790', invoice_date: iso(7, 3), net_total_cents: 24900 }),
  expense({ id: 'x5', category_id: 'cat4', supplier_invoice_number: null, invoice_date: iso(8, 22), net_total_cents: 8400, payment_status: 'unpaid', review_status: 'pending' }),
  expense({ id: 'x6', category_id: 'cat2', supplier_invoice_number: 'TK-4498', invoice_date: iso(8, 27), net_total_cents: 18600, payment_status: 'unpaid', review_status: 'pending' }),
];

const subscription = (over) => ({
  id: over.id,
  business_entity_id: ENTITY_ID,
  vendor_id: null,
  category_id: over.category_id,
  name: over.name,
  billing_frequency: 'monthly',
  expected_net_cents: over.net,
  expected_gross_cents: over.net + Math.round(over.net * 0.19),
  vat_treatment: 'standard',
  next_billing_date: over.next,
  start_date: iso(1, 5),
  end_date: null,
  status: 'active',
  cancellation_notice_date: null,
  notes: null,
});

const SUBSCRIPTIONS = [
  subscription({ id: 's1', category_id: 'cat1', name: 'Telefonie-Gateway', net: 12900, next: iso(9, 1) }),
  subscription({ id: 's2', category_id: 'cat1', name: 'Design-Suite', net: 5900, next: iso(9, 12) }),
  subscription({ id: 's3', category_id: 'cat2', name: 'Rufnummern-Pool', net: 3900, next: iso(9, 5) }),
];

const ASSETS = [
  { id: 'a1', business_entity_id: ENTITY_ID, name: 'MacBook Pro 14"', category: 'Hardware', serial_reference: null, purchase_date: iso(2, 14), acquisition_cost_cents: 249000, business_use_bp: 10000, depreciation_method: 'straight_line', useful_life_months: 36, depreciation_start_date: iso(2, 14), disposal_date: null, disposal_value_cents: null, status: 'active', notes: null },
  { id: 'a2', business_entity_id: ENTITY_ID, name: 'Studio-Mikrofon & Interface', category: 'Hardware', serial_reference: null, purchase_date: iso(3, 2), acquisition_cost_cents: 68000, business_use_bp: 10000, depreciation_method: 'straight_line', useful_life_months: 60, depreciation_start_date: iso(3, 2), disposal_date: null, disposal_value_cents: null, status: 'active', notes: null },
];

/* ------------------------------------------------------------- aggregates */

const PERIOD_SUMMARY = {
  entity: ENTITY_ID,
  from: `${YEAR}-01-01`,
  to: `${YEAR}-12-31`,
  invoiced_net_cents: 2216000,
  invoiced_vat_cents: 421040,
  invoiced_gross_cents: 2637040,
  outstanding_cents: 1074430,
  overdue_cents: 508130,
  overdue_count: 2,
  cash_in_cents: 1314550,
  cash_out_cents: 354620,
  expense_net_cents: 240400,
  expense_gross_cents: 286076,
  expense_input_vat_cents: 45676,
  recurring_monthly_cost_cents: 27013,
  review_expense_count: 2,
};

const TAX_PERIOD_INPUTS = {
  vat_timing: 'ist',
  paid_revenue_net_cents: 1104664,
  paid_expense_deductible_net_cents: 240400,
  vat_output_cents: 209886,
  vat_reverse_charge_output_cents: 0,
  vat_input_cents: 45676,
  advance_payment_count: 0,
  has_unlinked_income: false,
  has_unresolved_treatment: false,
  missing_service_date: false,
  recurring_flag_count: 3,
  filing_ready: true,
  warnings: [],
};

const REVENUE_CONTRACT_OVERVIEW = {
  entity: ENTITY_ID,
  mrr_net_cents: 63900,
  arr_net_cents: 766800,
  active_contract_count: 3,
  contracts: [],
};

/* --------------------------------------------------------- customer detail */

const CUSTOMER_TASKS = [
  { id: 'ct1', business_entity_id: ENTITY_ID, customer_id: CUSTOMER_ID, title: 'Rufnummernportierung Zweitstandort bestätigen', description: 'Freigabe des Providers steht aus.', status: 'open', priority: 'high', due_date: iso(9, 2), sort_order: 0, notes: null, completed_at: null, completed_by: null, created_by: USER_ID, created_at: at(8, 20), updated_at: at(8, 20) },
  { id: 'ct2', business_entity_id: ENTITY_ID, customer_id: CUSTOMER_ID, title: 'Begrüßungstext final abstimmen', description: null, status: 'in_progress', priority: 'normal', due_date: iso(9, 5), sort_order: 1, notes: null, completed_at: null, completed_by: null, created_by: USER_ID, created_at: at(8, 22), updated_at: at(8, 26) },
  { id: 'ct3', business_entity_id: ENTITY_ID, customer_id: CUSTOMER_ID, title: 'Zahlungserinnerung RE-2026-0018', description: null, status: 'open', priority: 'urgent', due_date: iso(8, 28), sort_order: 2, notes: null, completed_at: null, completed_by: null, created_by: USER_ID, created_at: at(8, 26), updated_at: at(8, 26) },
  { id: 'ct4', business_entity_id: ENTITY_ID, customer_id: CUSTOMER_ID, title: 'Onboarding-Termin durchgeführt', description: null, status: 'completed', priority: 'normal', due_date: iso(5, 12), sort_order: 3, notes: null, completed_at: at(5, 12), completed_by: USER_ID, created_by: USER_ID, created_at: at(5, 2), updated_at: at(5, 12) },
];

const CUSTOMER_DETAIL = {
  customer: {
    ...CUSTOMERS[0],
    business_entity_id: ENTITY_ID,
    country_code: 'DE',
    completed_by: null,
    archived_by: null,
    created_by: USER_ID,
    updated_at: at(8, 27),
  },
  offers: [
    { id: 'o1', offer_number: 'AN-2026-0031', title: 'KI-Telefonassistent — Zweitstandort', status: 'sent', currency: 'EUR', gross_total_cents: 571200, recurring_monthly_gross_cents: 46410, created_at: at(8, 20), valid_until: iso(9, 17), accepted_at: null, archived_at: null, sent_at: at(8, 20) },
    { id: 'o5', offer_number: null, title: 'Erweiterung Wissensdatenbank', status: 'draft', currency: 'EUR', gross_total_cents: 172550, recurring_monthly_gross_cents: 0, created_at: at(8, 28), valid_until: null, accepted_at: null, archived_at: null, sent_at: null },
    { id: 'o0', offer_number: 'AN-2026-0011', title: 'KI-Telefonassistent — Hauptstandort', status: 'accepted', currency: 'EUR', gross_total_cents: 535500, recurring_monthly_gross_cents: 34510, created_at: at(4, 10), valid_until: iso(5, 8), accepted_at: at(4, 24), archived_at: null, sent_at: at(4, 11) },
  ],
  invoices: [
    { id: 'i1', invoice_number: 'RE-2026-0018', status: 'overdue', currency: 'EUR', gross_total_cents: 339150, amount_paid_cents: 0, issue_date: iso(6, 12), due_date: iso(6, 26), issued_at: at(6, 12), cancelled_at: null, cancellation_reason: null, created_at: at(6, 12) },
    { id: 'i4', invoice_number: 'RE-2026-0026', status: 'issued', currency: 'EUR', gross_total_cents: 114240, amount_paid_cents: 0, issue_date: iso(8, 18), due_date: iso(9, 1), issued_at: at(8, 18), cancelled_at: null, cancellation_reason: null, created_at: at(8, 18) },
    { id: 'i6', invoice_number: 'RE-2026-0012', status: 'paid', currency: 'EUR', gross_total_cents: 535500, amount_paid_cents: 535500, issue_date: iso(4, 9), due_date: iso(4, 23), issued_at: at(4, 9), cancelled_at: null, cancellation_reason: null, created_at: at(4, 9) },
    { id: 'i10', invoice_number: 'RE-2026-0009', status: 'cancelled', currency: 'EUR', gross_total_cents: 104720, amount_paid_cents: 0, issue_date: iso(3, 11), due_date: iso(3, 25), issued_at: at(3, 11), cancelled_at: at(3, 18), cancellation_reason: 'Doppelt erfasst', created_at: at(3, 11) },
  ],
  payments: [
    { id: 'p1', amount_cents: 535500, direction: 'inflow', payment_date: iso(4, 21), invoice_id: 'i6' },
  ],
  tasks: CUSTOMER_TASKS,
  activity: [
    { id: 'ac1', event_type: 'offer_sent', summary: 'Angebot AN-2026-0031 versendet', created_at: at(8, 20), related_offer_id: 'o1', related_task_id: null },
    { id: 'ac2', event_type: 'invoice_issued', summary: 'Rechnung RE-2026-0026 gestellt', created_at: at(8, 18), related_offer_id: null, related_task_id: null },
    { id: 'ac3', event_type: 'task_created', summary: 'Aufgabe „Rufnummernportierung Zweitstandort bestätigen" angelegt', created_at: at(8, 20), related_offer_id: null, related_task_id: 'ct1' },
    { id: 'ac4', event_type: 'payment_recorded', summary: 'Zahlung über 5.355,00 € erfasst', created_at: at(4, 21), related_offer_id: null, related_task_id: null },
  ],
  delete_blockers: {
    issued_invoices: 3, payments: 1, finalized_offers: 2, subscriptions: 0,
    portal_documents: 0, draft_invoices: 0, draft_offers: 1, deletable: false,
  },
};

const CUSTOMER_SERVICES = [
  {
    id: 'sv1', customer_id: CUSTOMER_ID, service_key: 'ai_receptionist', label: 'KI-Telefonassistent',
    state: 'live', engagement_id: 'eng1', status: 'live', progress_done: 12, progress_total: 12,
    open_task_count: 0, blocked_task_count: 0, updated_at: at(8, 20),
  },
];

/* ------------------------------------------------------- internal tasks db */

const TASKS = [
  { id: 'tk1', title: 'Follow-up Angebot Kettner', description: 'Nach Ansicht des Angebots nachfassen.', category: 'follow_up', priority: 'high', status: 'open', due_date: iso(8, 30), money_impact: 690000, reason: 'Angebot seit 19 Tagen angesehen', created_at: at(8, 25) },
  { id: 'tk2', title: 'Zahlungserinnerung RE-2026-0018', description: null, category: 'finance', priority: 'critical', status: 'open', due_date: iso(8, 30), money_impact: 339150, reason: 'Überfällig seit 65 Tagen', created_at: at(8, 26) },
  { id: 'tk3', title: 'Onboarding-Call Sonnenhof', description: null, category: 'delivery', priority: 'medium', status: 'open', due_date: iso(8, 30), money_impact: 0, reason: null, created_at: at(8, 27) },
  { id: 'tk4', title: 'Rechnungslauf August prüfen', description: null, category: 'finance', priority: 'medium', status: 'completed', due_date: iso(8, 30), money_impact: 0, reason: null, created_at: at(8, 20) },
];

const OVERDUE_TASKS = [
  { id: 'tk5', title: 'Beleg TK-4498 anfordern', description: null, category: 'admin', priority: 'medium', status: 'open', due_date: iso(8, 27), money_impact: 0, reason: null, created_at: at(8, 22) },
  { id: 'tk6', title: 'Angebot Wissensdatenbank fertigstellen', description: null, category: 'sales', priority: 'high', status: 'open', due_date: iso(8, 26), money_impact: 172550, reason: 'Entwurf seit 2 Tagen offen', created_at: at(8, 24) },
];

/* ------------------------------------------------------------- CRM tables */

const ORGANIZATIONS = [
  { id: 'org1', name: 'Zahnarztpraxis Dr. Merten', status: 'active' },
  { id: 'org2', name: 'Gasthof Sonnenhof GmbH', status: 'active' },
];

const CLIENT_ACCOUNTS = [
  { id: 'acc1', organization_id: 'org1', legal_name: 'Zahnarztpraxis Dr. Merten', primary_contact_name: 'Dr. Anna Merten', primary_email: 'praxis@merten-dental.invalid', industry: 'Gesundheit', lifecycle_status: 'active', estimated_monthly_value_cents: 39000, updated_at: at(8, 27), created_at: at(4, 8) },
  { id: 'acc2', organization_id: 'org2', legal_name: 'Gasthof Sonnenhof GmbH', primary_contact_name: 'Michael Brandt', primary_email: 'info@sonnenhof.invalid', industry: 'Gastronomie', lifecycle_status: 'active', estimated_monthly_value_cents: 24900, updated_at: at(8, 25), created_at: at(5, 19) },
];

/* ------------------------------------------------------------------ router */

const TABLES = {
  owner_business_entities: [ENTITY],
  owner_tax_settings: [TAX_SETTINGS],
  owner_invoices: INVOICES,
  owner_offers: OFFERS,
  owner_payments: PAYMENTS,
  owner_expenses: EXPENSES,
  owner_expense_categories: CATEGORIES,
  owner_vendors: [],
  owner_subscriptions: SUBSCRIPTIONS,
  owner_assets: ASSETS,
  owner_automation_jobs: [],
  owner_finance_documents: [],
  owner_exports: [],
  owner_tax_estimates: [],
  owner_finance_notifications: [],
  owner_generated_documents: [],
  owner_invoice_lines: [],
  owner_offer_lines: [],
  owner_offer_versions: [],
  owner_invoice_versions: [],
  owner_document_settings: [],
  organizations: ORGANIZATIONS,
  client_accounts: CLIENT_ACCOUNTS,
  organization_solutions: [],
  client_engagements: [],
  client_invitations: [],
  client_contacts: [],
  organization_members: [],
  customer_projects: [],
};

const RPCS = {
  owner_finance_period_summary: PERIOD_SUMMARY,
  owner_tax_period_inputs: TAX_PERIOD_INPUTS,
  owner_revenue_contract_overview: REVENUE_CONTRACT_OVERVIEW,
  owner_list_customers: CUSTOMERS,
  owner_customer_detail: CUSTOMER_DETAIL,
  owner_list_customer_services: CUSTOMER_SERVICES,
  owner_customer_delete_blockers: CUSTOMER_DETAIL.delete_blockers,
};

const PROFILE = {
  id: USER_ID,
  email: 'owner@cogniiq.invalid',
  full_name: 'Owner QA',
  platform_role: 'cogniiq_owner',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

/**
 * Answers one intercepted Supabase request.
 *
 * `accept` decides shape, not the caller: PostgREST returns a bare object for
 * `.single()`/`.maybeSingle()` (Accept: application/vnd.pgrst.object+json) and an
 * array otherwise. Getting that wrong makes `loadActiveEntity()` return an array
 * and every finance page fall into its "no entity" empty state.
 */
export function fixtureFor(url, { accept = '' } = {}) {
  if (url.includes('/auth/v1/user')) {
    return { id: USER_ID, aud: 'authenticated', email: PROFILE.email, user_metadata: {}, app_metadata: {} };
  }
  if (url.includes('/auth/v1/token')) {
    return {
      access_token: 'qa-token', token_type: 'bearer', expires_in: 3600,
      refresh_token: 'qa-refresh', user: { id: USER_ID, email: PROFILE.email },
    };
  }

  const single = accept.includes('pgrst.object');

  const rpc = url.match(/\/rest\/v1\/rpc\/([a-z0-9_]+)/i);
  if (rpc) {
    const value = RPCS[rpc[1]];
    if (value !== undefined) return value;
    return null;
  }

  const table = url.match(/\/rest\/v1\/([a-z0-9_]+)/i);
  if (table) {
    const name = table[1];
    if (name === 'profiles') return single ? PROFILE : [PROFILE];
    if (name === 'tasks') {
      // The task dashboard asks three ways: due today + open, due today +
      // completed, overdue + open. The query string is the only thing that
      // distinguishes them.
      if (url.includes('status=eq.completed')) return [TASKS[3]];
      if (url.includes('due_date=lt.')) return OVERDUE_TASKS;
      return TASKS.filter((t) => t.status === 'open');
    }
    const rows = TABLES[name] ?? [];
    return single ? (rows[0] ?? null) : rows;
  }

  return single ? null : [];
}

export const FIXTURE_IDS = { ENTITY_ID, USER_ID, CUSTOMER_ID };
