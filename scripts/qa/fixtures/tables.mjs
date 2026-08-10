// Row fixtures for every PostgREST table the product reads.
//
// Each row is a COMPLETE instance of the corresponding TypeScript interface in
// `src/lib/**/types.ts` — every declared field is present, nullable fields are
// exercised in both states, and enum fields only ever carry values that appear in the
// declared union. That is what makes these fixtures "structurally accurate": a page
// that renders against them is rendering against the real contract, so a missing
// column shows up as a QA failure rather than as a silently empty cell.
//
// TEST-ONLY — never imported from `src/`.

import { ID, NAMES, EMAILS } from './ids.mjs';

/* ----------------------------------------------------------------- identity */

export const profiles = [
  {
    id: ID.ownerUser,
    email: EMAILS.owner,
    full_name: NAMES.ownerPerson,
    platform_role: 'cogniiq_owner',
    created_at: '2025-11-04T09:00:00Z',
    updated_at: '2026-07-30T09:00:00Z',
  },
  {
    id: ID.customerUser,
    email: EMAILS.customer,
    full_name: NAMES.customerPerson,
    platform_role: 'customer',
    created_at: '2026-01-04T09:00:00Z',
    updated_at: '2026-07-30T09:00:00Z',
  },
];

export const organizations = [
  { id: ID.orgA, name: NAMES.orgA, slug: 'musterbau-bayreuth', status: 'active', created_by: ID.ownerUser, created_at: '2026-01-04T09:00:00Z', updated_at: '2026-07-28T14:12:00Z' },
  { id: ID.orgB, name: NAMES.orgB, slug: 'nordlicht-energieverbund', status: 'active', created_by: ID.ownerUser, created_at: '2026-02-17T09:00:00Z', updated_at: '2026-07-11T08:41:00Z' },
];

// Shape mirrors the AuthContext query exactly: it selects `organizations (...)` as an
// embedded resource and filters on `status = 'active'`. Both details matter — a row
// without `status` is filtered out, and an `organization` key (singular) is never read.
export const organization_members = [
  { id: 'mem-1', organization_id: ID.orgA, user_id: ID.ownerUser, role: 'owner', status: 'active', created_at: '2026-01-04T09:00:00Z', updated_at: '2026-01-04T09:00:00Z', organizations: organizations[0] },
  { id: 'mem-2', organization_id: ID.orgA, user_id: ID.customerUser, role: 'member', status: 'active', created_at: '2026-01-04T09:00:00Z', updated_at: '2026-01-04T09:00:00Z', organizations: organizations[0] },
  { id: 'mem-3', organization_id: ID.orgB, user_id: ID.customerUser, role: 'admin', status: 'active', created_at: '2026-02-17T09:00:00Z', updated_at: '2026-02-17T09:00:00Z', organizations: organizations[1] },
];

/* ---------------------------------------------------------------------- CRM */

export const client_accounts = [
  {
    id: ID.accountA,
    organization_id: ID.orgA,
    legal_name: 'Musterbau Heizungstechnik Bayreuth GmbH & Co. Kommanditgesellschaft',
    display_name: NAMES.orgA,
    primary_contact_name: NAMES.customerPerson,
    primary_email: EMAILS.customer,
    phone: '+49 921 7304512',
    website: 'https://musterbau-heizungstechnik-bayreuth.de',
    industry: 'Sanitär, Heizung, Klima',
    address: 'Bahnhofstraße 14, 95444 Bayreuth',
    lifecycle_status: 'active',
    lead_source: 'Empfehlung Handwerkskammer Oberfranken',
    internal_notes: 'Zahlungsverhalten einwandfrei. Ansprechpartner bevorzugt Telefon.',
    estimated_total_budget_cents: 4_800_000,
    estimated_monthly_value_cents: 149_000,
    internal_owner: NAMES.ownerPerson,
    currency: 'EUR',
    created_at: '2026-01-04T09:00:00Z',
    updated_at: '2026-07-28T14:12:00Z',
  },
  {
    id: ID.accountB,
    organization_id: ID.orgB,
    legal_name: null,
    display_name: NAMES.orgB,
    primary_contact_name: NAMES.contactPerson,
    primary_email: EMAILS.contact,
    phone: '+49 431 2298840',
    website: null,
    industry: 'Energieversorgung',
    address: 'Kieler Förde 3, 24103 Kiel',
    lifecycle_status: 'lead',
    lead_source: 'Messe Nortec Hamburg',
    internal_notes: null,
    estimated_total_budget_cents: null,
    estimated_monthly_value_cents: null,
    internal_owner: null,
    currency: 'EUR',
    created_at: '2026-02-17T09:00:00Z',
    updated_at: '2026-07-11T08:41:00Z',
  },
];

export const client_contacts = [
  {
    id: ID.contactA, organization_id: ID.orgA, name: NAMES.customerPerson,
    title: 'Geschäftsführender Gesellschafter', email: EMAILS.customer, phone: '+49 921 7304512',
    is_primary: true, should_invite: true, internal_notes: null,
    created_at: '2026-01-04T09:00:00Z', updated_at: '2026-01-04T09:00:00Z',
  },
  {
    id: ID.contactB, organization_id: ID.orgB, name: NAMES.contactPerson,
    title: 'Leiter Digitalisierung und Prozessentwicklung', email: EMAILS.contact, phone: null,
    is_primary: true, should_invite: false, internal_notes: 'Erreichbar nur dienstags und donnerstags.',
    created_at: '2026-02-17T09:00:00Z', updated_at: '2026-02-17T09:00:00Z',
  },
];

export const client_engagements = [
  {
    id: ID.engagementA, organization_id: ID.orgA, catalog_key: 'ai_receptionist',
    project_name: 'KI-Telefonassistent Rollout Oberfranken', status: 'active',
    total_budget_cents: 4_800_000, setup_fee_cents: 1_490_000, recurring_fee_cents: 149_000,
    currency: 'EUR', start_date: '2026-02-01', target_go_live_date: '2026-09-15',
    internal_owner: NAMES.ownerPerson, notes: null, metadata: {},
    created_at: '2026-01-18T09:00:00Z', updated_at: '2026-07-28T14:12:00Z',
  },
  {
    id: ID.engagementB, organization_id: ID.orgB, catalog_key: 'automation_workspace',
    project_name: 'Prozessautomatisierung Netzanschlussverwaltung', status: 'draft',
    total_budget_cents: null, setup_fee_cents: null, recurring_fee_cents: null,
    currency: 'EUR', start_date: null, target_go_live_date: null,
    internal_owner: null, notes: 'Budgetfreigabe steht noch aus.', metadata: {},
    created_at: '2026-02-17T09:00:00Z', updated_at: '2026-02-17T09:00:00Z',
  },
];

export const client_invitations = [
  {
    id: ID.invitationA, organization_id: ID.orgA, email: EMAILS.customer,
    organization_role: 'admin', status: 'accepted', invited_by: ID.ownerUser,
    accepted_user_id: ID.customerUser, expires_at: '2026-01-18T09:00:00Z',
    accepted_at: '2026-01-06T11:24:00Z',
    created_at: '2026-01-04T09:00:00Z', updated_at: '2026-01-06T11:24:00Z',
  },
  {
    id: ID.invitationB, organization_id: ID.orgB, email: EMAILS.contact,
    organization_role: 'member', status: 'pending', invited_by: ID.ownerUser,
    accepted_user_id: null, expires_at: '2026-08-18T09:00:00Z', accepted_at: null,
    created_at: '2026-07-19T09:00:00Z', updated_at: '2026-07-19T09:00:00Z',
  },
];

export const organization_solutions = [
  {
    id: ID.solutionA, organization_id: ID.orgA, engagement_id: ID.engagementA,
    catalog_key: 'ai_receptionist', instance_key: 'ai-receptionist-musterbau',
    display_name: 'KI-Telefonassistent', implementation_key: 'ai_receptionist',
    status: 'active', nav_order: 1, config: {},
    created_at: '2026-02-01T09:00:00Z', updated_at: '2026-07-28T14:12:00Z',
  },
  {
    id: ID.solutionB, organization_id: ID.orgB, engagement_id: ID.engagementB,
    catalog_key: 'automation_workspace', instance_key: 'automation-nordlicht',
    display_name: 'Prozessautomatisierung', implementation_key: 'automation_workspace',
    status: 'provisioning', nav_order: 1, config: {},
    created_at: '2026-02-17T09:00:00Z', updated_at: '2026-02-17T09:00:00Z',
  },
];

export const organization_portal_settings = [
  {
    organization_id: ID.orgA, portal_title: 'Musterbau Kundenportal', logo_url: null,
    accent_color: null, default_solution_id: ID.solutionA,
    support_contact: 'betreuung@cogniiq.de', config: {},
  },
];

/* ------------------------------------------------------------ owner finance */

export const owner_business_entities = [
  {
    id: ID.entity, slug: 'cogniiq', display_name: 'Cogniiq', legal_name: 'Cogniiq — Katharina Obermüller-Weißenstein',
    legal_form: 'einzelunternehmen', business_type: 'freiberuflich', accounting_method: 'euer',
    vat_scheme: 'regelbesteuerung', currency: 'EUR', country_code: 'DE', federal_state: 'BY',
    municipality: 'Bayreuth', business_start_date: '2025-10-01',
    is_active: true, calculations_enabled: true, elster_direct_submission_enabled: false,
  },
];

export const owner_tax_settings = [
  {
    id: 'ts-2026', business_entity_id: ID.entity, tax_year: 2026,
    vat_timing: 'ist', vat_filing_frequency: 'quarterly', dauerfristverlaengerung: false,
    municipality: 'Bayreuth', trade_tax_hebesatz_bp: 4_250, assessment_mode: 'single',
    church_tax_enabled: false, church_tax_rate_bp: null,
    estimated_other_taxable_income_cents: null, manual_personal_adjustments_cents: null,
    total_positive_income_cents: null,
    income_tax_prepayments_cents: 480_000, trade_tax_prepayments_cents: 0,
    vat_prepayments_cents: 0, soli_prepayments_cents: 0, church_tax_prepayments_cents: 0,
    reserve_horizon_days: 90, setup_complete: true,
    assumptions_notes: 'Hebesatz Bayreuth 425 %. Keine Kirchensteuerpflicht.',
  },
];

export const owner_document_settings = [
  {
    business_entity_id: ID.entity,
    legal_name: 'Cogniiq — Katharina Obermüller-Weißenstein', owner_name: NAMES.ownerPerson,
    street: 'Maximilianstraße 28', postal_code: '95444', city: 'Bayreuth', country_code: 'DE',
    business_email: 'rechnung@cogniiq.de', business_phone: '+49 921 1500930', website: 'https://cogniiq.de',
    tax_number: '208/815/40021', vat_id: 'DE367214508',
    bank_account_holder: NAMES.ownerPerson, iban: 'DE02 7735 0110 0021 4885 92', bic: 'BYLADEM1SBT',
    bank_name: 'Sparkasse Bayreuth',
    default_payment_terms_days: 14, default_offer_validity_days: 30,
    default_invoice_footer: 'Zahlbar ohne Abzug innerhalb von 14 Tagen nach Rechnungsdatum.',
    default_offer_footer: 'Wir freuen uns auf die Zusammenarbeit.',
    default_offer_intro: 'vielen Dank für Ihr Interesse an unserer Zusammenarbeit.',
    default_offer_closing: 'Für Rückfragen stehe ich Ihnen jederzeit zur Verfügung.',
    invoice_number_prefix: 'RE', offer_number_prefix: 'AN', document_language: 'de',
    logo_storage_path: null, brand_accent: null,
    auto_create_invoice_on_acceptance: true, auto_issue_invoice_on_acceptance: false,
    auto_send_invoice_on_acceptance: false, default_invoice_due_days: 14,
    invoice_email_subject_template: 'Ihre Rechnung {{invoice_number}}',
    invoice_email_body_template: 'Guten Tag {{greeting_name}},\n\nanbei erhalten Sie Ihre Rechnung.',
    auto_generate_signed_certificate_on_acceptance: true,
    auto_send_signed_confirmation_on_acceptance: true,
    confirmation_email_subject_template: 'Ihre Auftragsbestätigung {{offer_number}}',
    confirmation_email_body_template: 'Guten Tag {{greeting_name}},\n\nvielen Dank für Ihre Beauftragung.',
    updated_at: '2026-07-02T10:00:00Z',
  },
];

export const owner_vendors = [
  { id: 'ven-1', name: 'Deutsche Telekom AG', country_code: 'DE', vat_id: 'DE123475223', website: 'https://telekom.de', default_category_id: 'cat-tk', default_vat_treatment: 'standard', notes: null },
  { id: 'ven-2', name: 'Amazon Web Services EMEA SARL', country_code: 'LU', vat_id: 'LU26888617', website: 'https://aws.amazon.com', default_category_id: 'cat-it', default_vat_treatment: 'reverse_charge', notes: 'Reverse-Charge-Verfahren, Leistungsort Deutschland.' },
];

export const owner_expense_categories = [
  { id: 'cat-it', key: 'it_services', label: 'IT-Dienstleistungen und Cloud', default_deductibility_bp: 10_000, default_input_vat_eligibility_bp: 10_000, euer_mapping_label: 'Sonstige betriebliche Aufwendungen', asset_review_default: false, is_active: true, sort_order: 10 },
  { id: 'cat-tk', key: 'telecommunication', label: 'Telekommunikation', default_deductibility_bp: 10_000, default_input_vat_eligibility_bp: 10_000, euer_mapping_label: 'Telefon und Internet', asset_review_default: false, is_active: true, sort_order: 20 },
  { id: 'cat-tr', key: 'travel', label: 'Reisekosten Inland', default_deductibility_bp: 10_000, default_input_vat_eligibility_bp: 10_000, euer_mapping_label: 'Reisekosten', asset_review_default: false, is_active: true, sort_order: 30 },
];

export const owner_invoices = [
  {
    id: ID.invoiceA, business_entity_id: ID.entity, organization_id: ID.orgA,
    client_account_id: ID.accountA, engagement_id: ID.engagementA,
    invoice_number: 'RE-2026-0088', status: 'issued',
    issue_date: '2026-07-01', service_date: '2026-06-30', due_date: '2026-07-15',
    currency: 'EUR', net_total_cents: 360_000, vat_total_cents: 68_400, gross_total_cents: 428_400,
    amount_paid_cents: 0,
    notes: 'Monatliche Betreuungspauschale Juni 2026.', external_reference: 'PO-2026-114',
    issued_at: '2026-07-01T08:00:00Z', archived_at: null,
    created_at: '2026-06-30T16:20:00Z', updated_at: '2026-07-01T08:00:00Z',
  },
  {
    id: ID.invoiceB, business_entity_id: ID.entity, organization_id: ID.orgA,
    client_account_id: ID.accountA, engagement_id: ID.engagementA,
    invoice_number: 'RE-2026-0071', status: 'paid',
    issue_date: '2026-05-02', service_date: '2026-04-30', due_date: '2026-05-16',
    currency: 'EUR', net_total_cents: 1_000_000, vat_total_cents: 190_000, gross_total_cents: 1_190_000,
    amount_paid_cents: 1_190_000,
    notes: null, external_reference: null,
    issued_at: '2026-05-02T08:00:00Z', archived_at: null,
    created_at: '2026-04-30T16:20:00Z', updated_at: '2026-05-14T09:12:00Z',
  },
  {
    id: ID.invoiceC, business_entity_id: ID.entity, organization_id: null,
    client_account_id: null, engagement_id: null,
    invoice_number: null, status: 'draft',
    issue_date: null, service_date: null, due_date: null,
    currency: 'EUR', net_total_cents: 248_000, vat_total_cents: 47_120, gross_total_cents: 295_120,
    amount_paid_cents: 0,
    notes: null, external_reference: null,
    issued_at: null, archived_at: null,
    created_at: '2026-07-29T11:05:00Z', updated_at: '2026-07-29T11:05:00Z',
  },
];

export const owner_invoice_lines = [
  { id: 'il-1', invoice_id: ID.invoiceA, description: 'Betreuungspauschale KI-Telefonassistent, Juni 2026', quantity_milli: 1_000, unit_price_cents: 149_000, net_cents: 149_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 28_310, gross_cents: 177_310, sort_order: 1 },
  { id: 'il-2', invoice_id: ID.invoiceA, description: 'Anpassung Gesprächsleitfaden Notdienstannahme', quantity_milli: 4_000, unit_price_cents: 52_750, net_cents: 211_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 40_090, gross_cents: 251_090, sort_order: 2 },
  { id: 'il-3', invoice_id: ID.invoiceB, description: 'Einrichtung KI-Telefonassistent inklusive Rufnummernportierung', quantity_milli: 1_000, unit_price_cents: 1_000_000, net_cents: 1_000_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 190_000, gross_cents: 1_190_000, sort_order: 1 },
  { id: 'il-4', invoice_id: ID.invoiceC, description: 'Workshop Prozessaufnahme (Entwurf)', quantity_milli: 2_000, unit_price_cents: 124_000, net_cents: 248_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 47_120, gross_cents: 295_120, sort_order: 1 },
];

export const owner_payments = [
  { id: 'pay-1', invoice_id: ID.invoiceB, expense_id: null, amount_cents: 1_190_000, paid_on: '2026-05-14', method: 'ueberweisung', reference: 'RE-2026-0071', created_at: '2026-05-14T09:12:00Z' },
];

export const owner_expenses = [
  {
    id: ID.expenseA, business_entity_id: ID.entity, vendor_id: 'ven-2',
    organization_id: null, client_account_id: null, category_id: 'cat-it', subscription_id: 'sub-1',
    supplier_invoice_number: 'EUINDE26-4471822', invoice_date: '2026-07-03', service_date: '2026-06-30', due_date: '2026-07-17',
    payment_status: 'paid', currency: 'EUR',
    net_total_cents: 41_280, vat_total_cents: 0, gross_total_cents: 41_280,
    input_vat_cents: 7_843, reverse_charge_vat_cents: 7_843, deductible_net_cents: 41_280, amount_paid_cents: 41_280,
    review_status: 'reviewed', review_reason: null,
    notes: 'Reverse-Charge, Leistungsort Deutschland.', archived_at: null, created_at: '2026-07-03T06:12:00Z',
  },
  {
    id: ID.expenseB, business_entity_id: ID.entity, vendor_id: 'ven-1',
    organization_id: null, client_account_id: null, category_id: 'cat-tk', subscription_id: null,
    supplier_invoice_number: '0921-2026-07-114', invoice_date: '2026-07-08', service_date: '2026-07-31', due_date: '2026-07-22',
    payment_status: 'unpaid', currency: 'EUR',
    net_total_cents: 8_403, vat_total_cents: 1_597, gross_total_cents: 10_000,
    input_vat_cents: 1_597, reverse_charge_vat_cents: 0, deductible_net_cents: 8_403, amount_paid_cents: 0,
    review_status: 'pending', review_reason: 'Privatanteil Mobilfunk noch nicht abgegrenzt.',
    notes: null, archived_at: null, created_at: '2026-07-08T06:12:00Z',
  },
];

export const owner_subscriptions = [
  { id: 'sub-1', business_entity_id: ID.entity, vendor_id: 'ven-2', category_id: 'cat-it', name: 'Amazon Web Services — Produktionsumgebung', billing_frequency: 'monthly', expected_net_cents: 41_000, expected_gross_cents: 41_000, vat_treatment: 'reverse_charge', next_billing_date: '2026-08-03', start_date: '2025-10-01', end_date: null, status: 'active', cancellation_notice_date: null, notes: null },
  { id: 'sub-2', business_entity_id: ID.entity, vendor_id: 'ven-1', category_id: 'cat-tk', name: 'Telekom Business Mobil L', billing_frequency: 'monthly', expected_net_cents: 8_403, expected_gross_cents: 10_000, vat_treatment: 'standard', next_billing_date: '2026-08-08', start_date: '2025-10-01', end_date: null, status: 'active', cancellation_notice_date: '2026-09-08', notes: null },
];

export const owner_assets = [
  { id: 'ast-1', business_entity_id: ID.entity, name: 'MacBook Pro 16" M4 Max', category: 'Hardware', serial_reference: 'C02XK1Q4JGH7', purchase_date: '2025-10-14', acquisition_cost_cents: 429_900, business_use_bp: 10_000, depreciation_method: 'straight_line', useful_life_months: 36, depreciation_start_date: '2025-10-01', disposal_date: null, disposal_value_cents: null, status: 'active', notes: null },
];

export const owner_tax_estimates = [
  { id: 'te-1', business_entity_id: ID.entity, tax_year: 2026, period: '2026-Q2', tax_type: 'umsatzsteuer', rules_version: '2026.1', calculated_at: '2026-07-01T04:00:00Z', estimated_liability_cents: 214_300, prepayments_cents: 0, remaining_reserve_cents: 214_300, confidence: 'estimate', warnings: ['Juni-Belege noch nicht vollständig erfasst.'], breakdown: {} },
  { id: 'te-2', business_entity_id: ID.entity, tax_year: 2026, period: null, tax_type: 'einkommensteuer', rules_version: '2026.1', calculated_at: '2026-07-01T04:00:00Z', estimated_liability_cents: 1_284_000, prepayments_cents: 480_000, remaining_reserve_cents: 804_000, confidence: 'incomplete', warnings: ['Sonderausgaben noch nicht hinterlegt.'], breakdown: {} },
];

export const owner_audit_log = [
  { id: 'aud-1', business_entity_id: ID.entity, actor_user_id: ID.ownerUser, action: 'invoice.issued', resource_type: 'owner_invoices', resource_id: ID.invoiceA, before_summary: { status: 'draft' }, after_summary: { status: 'issued', invoice_number: 'RE-2026-0088' }, created_at: '2026-07-01T08:00:00Z' },
  { id: 'aud-2', business_entity_id: ID.entity, actor_user_id: ID.ownerUser, action: 'payment.recorded', resource_type: 'owner_payments', resource_id: 'pay-1', before_summary: null, after_summary: { amount_cents: 1_190_000 }, created_at: '2026-05-14T09:12:00Z' },
];

export const owner_finance_documents = [
  { id: 'fd-1', business_entity_id: ID.entity, storage_object_path: 'belege/2026/07/aws-4471822.pdf', original_filename: 'AWS-Rechnung-Juli-2026.pdf', mime_type: 'application/pdf', file_size_bytes: 118_442, doc_type: 'expense_receipt', invoice_id: null, expense_id: ID.expenseA, asset_id: null, created_at: '2026-07-03T06:14:00Z' },
];

export const owner_exports = [
  { id: 'exp-1', business_entity_id: ID.entity, export_type: 'euer', period_start: '2026-01-01', period_end: '2026-06-30', status: 'completed', rules_version: '2026.1', record_counts: { invoices: 12, expenses: 34 }, warnings: [], generated_at: '2026-07-02T09:30:00Z' },
];

export const owner_finance_notifications = [
  { id: 'nt-1', business_entity_id: ID.entity, category: 'invoice_overdue', title: 'Rechnung RE-2026-0088 wird morgen fällig', body: 'Fällig am 15.07.2026 · 4.284,00 €', resource_type: 'owner_invoices', resource_id: ID.invoiceA, amount_cents: 428_400, priority: 'high', read_at: null, dismissed_at: null, created_at: '2026-07-14T06:00:00Z' },
];

export const owner_generated_documents = [
  { id: 'gd-1', business_entity_id: ID.entity, document_type: 'offer', source_resource_type: 'owner_offers', source_resource_id: ID.offerA, document_number: 'AN-2026-0142', version: 2, status: 'final', language: 'de', currency: 'EUR', template_version: 'premium-2026.1', source_hash: 'a3f19c4e8b2d7016', pdf_storage_path: 'dokumente/2026/AN-2026-0142-v2.pdf', render_metadata: {}, generated_at: '2026-07-14T08:00:00Z', finalized_at: '2026-07-14T08:00:00Z', archived_at: null },
];

export const owner_automation_jobs = [
  { id: 'job-1', job_type: 'offer_email', status: 'succeeded', attempt_count: 1, max_attempts: 5, last_error: null, last_error_at: null, provider_message_id: 'msg-8841', scheduled_at: '2026-07-14T08:01:00Z', sent_at: '2026-07-14T08:01:12Z', completed_at: '2026-07-14T08:01:12Z', updated_at: '2026-07-14T08:01:12Z' },
];

/* --------------------------------------------------------------- owner offers */

const offerRecipient = {
  recipient_source: 'crm',
  recipient_company: NAMES.orgA,
  recipient_contact_name: NAMES.customerPerson,
  recipient_department: 'Geschäftsführung',
  recipient_street: 'Bahnhofstraße 14',
  recipient_postal_code: '95444',
  recipient_city: 'Bayreuth',
  recipient_country_code: 'DE',
  recipient_email: EMAILS.customer,
  recipient_phone: '+49 921 7304512',
  recipient_vat_id: 'DE298471003',
  recipient_salutation: 'herr',
  recipient_title: null,
  recipient_first_name: 'Hans-Jürgen',
  recipient_last_name: 'Schwarzenbeck',
  recipient_greeting_name: 'Herr Schwarzenbeck',
};

export const owner_offers = [
  {
    id: ID.offerA, business_entity_id: ID.entity, organization_id: ID.orgA,
    client_account_id: ID.accountA, engagement_id: ID.engagementA,
    offer_number: 'AN-2026-0142', status: 'accepted',
    title: 'KI-Telefonassistent für die Notdienstannahme',
    issue_date: '2026-07-14', valid_until: '2026-08-13', currency: 'EUR',
    introduction: 'vielen Dank für das ausführliche Gespräch zur Entlastung Ihrer Notdienstannahme.',
    scope: 'Einrichtung, Rufnummernportierung, Gesprächsleitfaden und Einweisung des Teams.',
    assumptions: 'Die bestehende Telefonanlage unterstützt SIP-Trunking.',
    exclusions: 'Hardwarebeschaffung und Verkabelung vor Ort.',
    payment_terms: '50 % bei Auftragserteilung, 50 % bei Go-Live.',
    delivery_terms: 'Go-Live innerhalb von acht Wochen nach Auftragserteilung.',
    internal_notes: null,
    subtitle: 'Angebot für Musterbau Heizungstechnik Bayreuth GmbH & Co. KG',
    executive_summary: 'Ihre Notdienstannahme verliert außerhalb der Geschäftszeiten nachweislich Aufträge. Der KI-Telefonassistent nimmt jeden Anruf an, qualifiziert ihn und leitet echte Notfälle sofort weiter.',
    project_approach: 'Wir starten mit einer Prozessaufnahme, bauen den Gesprächsleitfaden gemeinsam auf und gehen nach einer zweiwöchigen Testphase in den Regelbetrieb.',
    next_steps: 'Rücksendung des unterzeichneten Angebots und Terminvereinbarung für den Workshop.',
    desired_outcomes: [
      'Kein unbeantworteter Anruf außerhalb der Geschäftszeiten',
      'Echte Notfälle innerhalb von zwei Minuten beim Bereitschaftsdienst',
      'Vollständige Dokumentation jedes Anrufs',
    ],
    timeline: [
      { phase: '1', title: 'Prozessaufnahme', duration: '1 Woche', description: 'Workshop vor Ort in Bayreuth.' },
      { phase: '2', title: 'Aufbau und Konfiguration', duration: '3 Wochen', description: 'Gesprächsleitfaden, Portierung, Testrufnummer.' },
      { phase: '3', title: 'Testbetrieb', duration: '2 Wochen', description: 'Paralleler Betrieb mit Auswertung.' },
      { phase: '4', title: 'Go-Live', duration: '2 Wochen', description: 'Umstellung und Einweisung des Teams.' },
    ],
    payment_schedule: [
      { label: 'Bei Auftragserteilung', percentage_bp: 5_000, amount_cents: 745_000, note: null },
      { label: 'Bei Go-Live', percentage_bp: 5_000, amount_cents: 745_000, note: null },
    ],
    template_key: 'premium',
    ...offerRecipient,
    net_total_cents: 1_252_100, vat_total_cents: 237_899, gross_total_cents: 1_489_999,
    finalized_version: 2, accepted_at: '2026-07-21T10:32:00Z',
    rejected_at: null, rejection_reason: null, expired_at: null,
    converted_invoice_id: null, converted_at: null,
    owner_customer_id: ID.customerA, archived_at: null, archived_by: null,
    created_at: '2026-07-10T09:00:00Z', updated_at: '2026-07-21T10:32:00Z',
  },
  {
    id: ID.offerB, business_entity_id: ID.entity, organization_id: ID.orgB,
    client_account_id: ID.accountB, engagement_id: ID.engagementB,
    offer_number: 'AN-2026-0151', status: 'sent',
    title: 'Prozessautomatisierung Netzanschlussverwaltung',
    issue_date: '2026-07-28', valid_until: '2026-08-27', currency: 'EUR',
    introduction: 'anbei erhalten Sie unser Angebot zur Automatisierung der Netzanschlussverwaltung.',
    scope: 'Analyse, Automatisierungsstrecke und Schnittstelle zum Bestandssystem.',
    assumptions: null, exclusions: null,
    payment_terms: '30 Tage netto.', delivery_terms: null, internal_notes: 'Budgetfreigabe erwartet Ende August.',
    subtitle: 'Angebot für Nordlicht Energieverbund Schleswig-Holstein AG',
    executive_summary: 'Die manuelle Bearbeitung von Netzanschlussanfragen bindet derzeit zwei Vollzeitstellen. Eine durchgängige Automatisierung reduziert die Bearbeitungszeit je Vorgang deutlich.',
    project_approach: null, next_steps: null,
    desired_outcomes: [], timeline: [], payment_schedule: [],
    template_key: 'premium',
    recipient_source: 'crm',
    recipient_company: NAMES.orgB,
    recipient_contact_name: NAMES.contactPerson,
    recipient_department: 'Digitalisierung und Prozessentwicklung',
    recipient_street: 'Kieler Förde 3',
    recipient_postal_code: '24103', recipient_city: 'Kiel', recipient_country_code: 'DE',
    recipient_email: EMAILS.contact, recipient_phone: null, recipient_vat_id: null,
    recipient_salutation: 'neutral', recipient_title: 'Prof. Dr.-Ing.',
    recipient_first_name: 'Maximilian', recipient_last_name: 'von Hohenberg-Lindau',
    recipient_greeting_name: 'Prof. Dr.-Ing. von Hohenberg-Lindau',
    net_total_cents: 2_840_000, vat_total_cents: 539_600, gross_total_cents: 3_379_600,
    finalized_version: 1, accepted_at: null, rejected_at: null, rejection_reason: null,
    expired_at: null, converted_invoice_id: null, converted_at: null,
    owner_customer_id: ID.customerB, archived_at: null, archived_by: null,
    created_at: '2026-07-24T09:00:00Z', updated_at: '2026-07-28T09:00:00Z',
  },
  {
    id: ID.offerC, business_entity_id: ID.entity, organization_id: null,
    client_account_id: null, engagement_id: null,
    offer_number: null, status: 'draft', title: 'Website-Relaunch (Entwurf)',
    issue_date: null, valid_until: null, currency: 'EUR',
    introduction: null, scope: null, assumptions: null, exclusions: null,
    payment_terms: null, delivery_terms: null, internal_notes: null,
    subtitle: null, executive_summary: null, project_approach: null, next_steps: null,
    desired_outcomes: [], timeline: [], payment_schedule: [],
    template_key: 'premium',
    recipient_source: 'manual',
    recipient_company: null, recipient_contact_name: null, recipient_department: null,
    recipient_street: null, recipient_postal_code: null, recipient_city: null,
    recipient_country_code: 'DE', recipient_email: null, recipient_phone: null, recipient_vat_id: null,
    recipient_salutation: null, recipient_title: null, recipient_first_name: null,
    recipient_last_name: null, recipient_greeting_name: null,
    net_total_cents: 0, vat_total_cents: 0, gross_total_cents: 0,
    finalized_version: null, accepted_at: null, rejected_at: null, rejection_reason: null,
    expired_at: null, converted_invoice_id: null, converted_at: null,
    owner_customer_id: null, archived_at: null, archived_by: null,
    created_at: '2026-08-01T07:40:00Z', updated_at: '2026-08-01T07:40:00Z',
  },
];

export const owner_offer_lines = [
  { id: 'ol-1', offer_id: ID.offerA, description: 'Einrichtung KI-Telefonassistent', details: 'Inklusive Rufnummernportierung und SIP-Anbindung.', deliverables: ['Konfigurierte Instanz', 'Portierte Rufnummer', 'Testprotokoll'], phase_label: 'Phase 2', duration_label: '3 Wochen', quantity_milli: 1_000, unit: 'pauschal', unit_price_cents: 1_000_000, net_cents: 1_000_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 190_000, gross_cents: 1_190_000, is_optional: false, sort_order: 1 },
  { id: 'ol-2', offer_id: ID.offerA, description: 'Workshop Prozessaufnahme vor Ort', details: null, deliverables: ['Prozesslandkarte', 'Gesprächsleitfaden-Entwurf'], phase_label: 'Phase 1', duration_label: '1 Woche', quantity_milli: 2_000, unit: 'tag', unit_price_cents: 126_050, net_cents: 252_100, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 47_899, gross_cents: 299_999, is_optional: false, sort_order: 2 },
  { id: 'ol-3', offer_id: ID.offerA, description: 'Erweiterte Auswertung und Reporting', details: 'Optional buchbar.', deliverables: [], phase_label: null, duration_label: null, quantity_milli: 1_000, unit: 'monat', unit_price_cents: 29_000, net_cents: 29_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 5_510, gross_cents: 34_510, is_optional: true, sort_order: 3 },
  { id: 'ol-4', offer_id: ID.offerB, description: 'Automatisierungsstrecke Netzanschluss', details: null, deliverables: [], phase_label: null, duration_label: null, quantity_milli: 1_000, unit: 'pauschal', unit_price_cents: 2_840_000, net_cents: 2_840_000, vat_rate_bp: 1_900, vat_treatment: 'standard', vat_cents: 539_600, gross_cents: 3_379_600, is_optional: false, sort_order: 1 },
];

export const owner_offer_versions = [
  { id: 'ov-1', offer_id: ID.offerA, version: 1, offer_number: 'AN-2026-0142', snapshot: {}, source_hash: '5c81be0f7a4d2931', template_key: 'premium', template_version: 'premium-2026.1', finalized_at: '2026-07-11T15:20:00Z' },
  { id: 'ov-2', offer_id: ID.offerA, version: 2, offer_number: 'AN-2026-0142', snapshot: {}, source_hash: 'a3f19c4e8b2d7016', template_key: 'premium', template_version: 'premium-2026.1', finalized_at: '2026-07-14T08:00:00Z' },
  { id: 'ov-3', offer_id: ID.offerB, version: 1, offer_number: 'AN-2026-0151', snapshot: {}, source_hash: 'd0271fa9c3e84b65', template_key: 'premium', template_version: 'premium-2026.1', finalized_at: '2026-07-28T09:00:00Z' },
];

export const owner_offer_acceptance_events = [
  { id: 'ae-1', offer_id: ID.offerA, document_id: 'gd-1', document_version: 2, source_hash: 'a3f19c4e8b2d7016', decision: 'accepted', signature_level: 'simple', signer_name: NAMES.customerPerson, signer_company: NAMES.orgA, signer_email: EMAILS.customer, signer_role: 'Geschäftsführender Gesellschafter', signature_storage_path: 'signaturen/2026/AN-2026-0142.png', signature_sha256: '9f2c4b71e08a35d6c1f7b48e2093ad55', accepted_gross_cents: 1_489_999, currency: 'EUR', accepted_terms_version: 'agb-2026.1', comment: 'Wir freuen uns auf den Start.', event_order: 1, created_at: '2026-07-21T10:32:00Z' },
];

/* -------------------------------------------------------------- ops surfaces */

export const tasks = [
  { id: ID.taskA, title: 'Gesprächsleitfaden Notdienst mit Kunden abstimmen', description: 'Abstimmung mit Herrn Schwarzenbeck zur Eskalationslogik.', status: 'open', priority: 'high', due_date: '2026-08-05', revenue_cents: null, organization_id: ID.orgA, created_at: '2026-07-28T09:00:00Z', updated_at: '2026-07-28T09:00:00Z', completed_at: null },
  { id: ID.taskB, title: 'Angebot AN-2026-0151 nachfassen', description: null, status: 'open', priority: 'normal', due_date: '2026-08-11', revenue_cents: 3_379_600, organization_id: ID.orgB, created_at: '2026-07-28T09:00:00Z', updated_at: '2026-07-28T09:00:00Z', completed_at: null },
  { id: ID.taskC, title: 'Juni-Belege vollständig erfassen', description: null, status: 'completed', priority: 'normal', due_date: '2026-07-10', revenue_cents: null, organization_id: null, created_at: '2026-07-01T09:00:00Z', updated_at: '2026-07-09T16:00:00Z', completed_at: '2026-07-09T16:00:00Z' },
];

export const execution_days = [
  { id: 'ed-1', day: '2026-08-04', status: 'in_progress', focus: 'Go-Live-Vorbereitung Musterbau', generated_at: '2026-08-04T04:00:00Z', notes: null },
];

export const execution_tasks = [
  { id: 'et-1', day_id: 'ed-1', title: 'Testrufnummer gegen Bereitschaftsplan prüfen', status: 'done', estimated_minutes: 45, actual_minutes: 40, sort_order: 1, category: 'delivery', notes: null },
  { id: 'et-2', day_id: 'ed-1', title: 'Angebot AN-2026-0151 nachfassen', status: 'in_progress', estimated_minutes: 20, actual_minutes: null, sort_order: 2, category: 'sales', notes: null },
  { id: 'et-3', day_id: 'ed-1', title: 'Quartalsvoranmeldung Q2 vorbereiten', status: 'todo', estimated_minutes: 90, actual_minutes: null, sort_order: 3, category: 'admin', notes: null },
];

export const oura_daily_readiness = [
  { id: 'or-1', day: '2026-08-03', score: 84, temperature_deviation: -0.2, hrv_balance: 78, resting_heart_rate: 52, recovery_index: 91 },
  { id: 'or-2', day: '2026-08-02', score: 71, temperature_deviation: 0.4, hrv_balance: 62, resting_heart_rate: 56, recovery_index: 74 },
];

export const oura_daily_sleep = [
  { id: 'os-1', day: '2026-08-03', score: 79, total_sleep_duration: 26_100, deep_sleep_duration: 5_400, rem_sleep_duration: 6_300, efficiency: 91, latency: 780 },
  { id: 'os-2', day: '2026-08-02', score: 68, total_sleep_duration: 21_600, deep_sleep_duration: 3_900, rem_sleep_duration: 4_500, efficiency: 86, latency: 1_320 },
];

export const oura_daily_activity = [
  { id: 'oa-1', day: '2026-08-03', score: 88, steps: 11_482, active_calories: 612, total_calories: 2_884, equivalent_walking_distance: 8_940 },
  { id: 'oa-2', day: '2026-08-02', score: 74, steps: 6_310, active_calories: 388, total_calories: 2_512, equivalent_walking_distance: 4_820 },
];

/* ------------------------------------------------------ customer portal rows */

export const customer_projects = [
  {
    id: ID.projectA, organization_id: ID.orgA,
    title: 'KI-Telefonassistent Rollout Standort Oberfranken',
    business_objective: 'Kein unbeantworteter Anruf außerhalb der Geschäftszeiten.',
    status: 'on_track', phase: 'Umsetzung', progress_percent: 62,
    start_date: '2026-02-01', target_date: '2026-09-15',
    next_action_summary: 'Telefonansagen zur Freigabe prüfen',
    next_action_owner: 'customer', next_action_due_date: '2026-08-08',
    customer_safe_blocker_summary: null,
    contact_display_name: NAMES.ownerPerson,
    contact_role_label: 'Projektleitung',
    contact_business_email: 'betreuung@cogniiq.de',
    created_at: '2026-01-18T09:00:00Z', updated_at: '2026-07-30T10:12:00Z',
  },
  {
    id: ID.projectB, organization_id: ID.orgA,
    title: 'Anbindung Warenwirtschaft und Auftragsdisposition',
    business_objective: 'Aufträge ohne Medienbruch in die Disposition übergeben.',
    status: 'attention_needed', phase: 'Konzeption', progress_percent: 28,
    start_date: '2026-05-04', target_date: '2026-11-30',
    next_action_summary: 'Schnittstellenfreigabe durch Ihre IT',
    next_action_owner: 'customer', next_action_due_date: '2026-08-06',
    customer_safe_blocker_summary: 'Wir warten auf den Zugang zum Testsystem Ihrer Warenwirtschaft.',
    contact_display_name: NAMES.ownerPerson,
    contact_role_label: 'Projektleitung',
    contact_business_email: 'betreuung@cogniiq.de',
    created_at: '2026-04-20T09:00:00Z', updated_at: '2026-07-28T15:40:00Z',
  },
];

export const customer_project_milestones = [
  { id: ID.milestoneA, project_id: ID.projectA, title: 'Prozessaufnahme abgeschlossen', description: 'Workshop vor Ort in Bayreuth durchgeführt und protokolliert.', status: 'completed', target_date: '2026-02-28', completed_at: '2026-02-26T16:00:00Z', sort_order: 1 },
  { id: ID.milestoneB, project_id: ID.projectA, title: 'Testbetrieb gestartet', description: 'Paralleler Betrieb mit täglicher Auswertung.', status: 'in_progress', target_date: '2026-08-14', completed_at: null, sort_order: 2 },
  { id: ID.milestoneC, project_id: ID.projectA, title: 'Go-Live Vorbereitung', description: null, status: 'upcoming', target_date: '2026-08-21', completed_at: null, sort_order: 3 },
];

export const customer_documents = [
  { id: ID.documentA, project_id: ID.projectA, organization_id: ID.orgA, category: 'offer', title: 'Angebot AN-2026-0142 — KI-Telefonassistent Notdienstannahme.pdf', version: 2, content_type: 'application/pdf', size_bytes: 284_113, uploaded_at: '2026-07-14T08:00:00Z' },
  { id: ID.documentB, project_id: ID.projectA, organization_id: ID.orgA, category: 'contract', title: 'Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.pdf', version: 1, content_type: 'application/pdf', size_bytes: 1_204_882, uploaded_at: '2026-06-02T08:00:00Z' },
  { id: ID.documentC, project_id: ID.projectB, organization_id: ID.orgA, category: 'concept', title: 'Schnittstellenkonzept Warenwirtschaft — Entwurfsfassung.pdf', version: 3, content_type: 'application/pdf', size_bytes: 642_991, uploaded_at: '2026-07-22T13:30:00Z' },
];

export const customer_project_invoices = [
  { project_id: ID.projectA, invoice_id: ID.invoiceA, linked_at: '2026-07-01T08:05:00Z' },
];

export const businesses = [
  { id: 'biz-1', name: 'Cogniiq', slug: 'cogniiq', created_at: '2025-10-01T09:00:00Z' },
];

export const onboarding_sessions = [
  { id: 'ob-1', organization_id: ID.orgA, status: 'completed', current_step: 'done', completed_at: '2026-02-10T12:00:00Z', created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-10T12:00:00Z' },
];

export const receptionist_configs = [
  { id: 'rc-1', organization_id: ID.orgA, business_name: NAMES.orgA, greeting: 'Guten Tag, Sie sind mit dem Assistenten der Firma Musterbau Heizungstechnik verbunden.', voice: 'de-DE-standard', escalation_number: '+49 921 7304599', updated_at: '2026-07-28T14:12:00Z' },
];

export const phone_configs = [
  { id: 'pc-1', organization_id: ID.orgA, phone_number: '+49 921 7304500', status: 'active', provider: 'telekom', porting_status: 'completed', updated_at: '2026-06-14T10:00:00Z' },
];

/** Every table above, addressable by its PostgREST name. */
export const tables = {
  businesses,
  client_accounts,
  client_contacts,
  client_engagements,
  client_invitations,
  customer_documents,
  customer_project_invoices,
  customer_project_milestones,
  customer_projects,
  execution_days,
  execution_tasks,
  onboarding_sessions,
  organization_members,
  organization_portal_settings,
  organization_solutions,
  organizations,
  oura_daily_activity,
  oura_daily_readiness,
  oura_daily_sleep,
  owner_assets,
  owner_audit_log,
  owner_automation_jobs,
  owner_business_entities,
  owner_document_settings,
  owner_expense_categories,
  owner_expenses,
  owner_exports,
  owner_finance_documents,
  owner_finance_notifications,
  owner_generated_documents,
  owner_invoice_lines,
  owner_invoices,
  owner_offer_acceptance_events,
  owner_offer_lines,
  owner_offer_versions,
  owner_offers,
  owner_payments,
  owner_subscriptions,
  owner_tax_estimates,
  owner_tax_settings,
  owner_vendors,
  phone_configs,
  profiles,
  receptionist_configs,
  tasks,
};
