-- Owner Finance & Tax Cockpit — foundation.
-- Additive only. Owner-only: every table is gated on public.is_platform_owner() (NOT is_platform_admin).
-- Money is bigint integer cents; percentages are integer basis points (100% = 10000). No floats.
-- Depends on Phase 0 auth/tenancy and the PR #10 CRM (organizations, client_accounts, ...).

begin;

do $$
begin
  if to_regprocedure('public.is_platform_owner()') is null
    or to_regprocedure('public.set_updated_at()') is null
    or to_regclass('public.organizations') is null
    or to_regclass('public.client_accounts') is null then
    raise exception 'Owner finance migration requires Phase 0 + client-platform foundations';
  end if;
end;
$$;

-- ===========================================================================
-- Business entities
-- ===========================================================================
create table if not exists public.owner_business_entities (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  display_name text not null,
  legal_name text,
  legal_form text not null default 'sole_proprietorship'
    check (legal_form in ('sole_proprietorship', 'gmbh', 'partnership', 'other')),
  business_type text not null default 'commercial'
    check (business_type in ('commercial', 'freelance', 'other')),
  accounting_method text not null default 'eur'
    check (accounting_method in ('eur', 'balance_sheet')),
  vat_scheme text not null default 'regular_taxation'
    check (vat_scheme in ('regular_taxation', 'small_business_19', 'not_registered')),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  country_code text not null default 'DE' check (country_code ~ '^[A-Z]{2}$'),
  federal_state text,
  municipality text,
  business_start_date date,
  is_active boolean not null default true,
  calculations_enabled boolean not null default true,
  elster_direct_submission_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_business_entities_slug_key unique (slug),
  constraint owner_business_entities_slug_format check (slug ~ '^[a-z][a-z0-9-]+$'),
  constraint owner_business_entities_display_name_not_blank check (length(trim(display_name)) > 0)
);

comment on table public.owner_business_entities is
  'Owner-only business entities. V1 active entity is the Cogniiq Einzelunternehmen; a disabled Cogniiq Family GmbH is seeded for future use with calculations disabled. Legal entities are never combined.';

-- Seed the active Cogniiq sole proprietorship and a disabled future GmbH. No secrets/tax IDs seeded.
insert into public.owner_business_entities
  (slug, display_name, legal_form, business_type, accounting_method, vat_scheme, currency, country_code, federal_state, is_active, calculations_enabled)
values
  ('cogniiq', 'Cogniiq', 'sole_proprietorship', 'commercial', 'eur', 'regular_taxation', 'EUR', 'DE', 'BY', true, true),
  ('cogniiq-family-gmbh', 'Cogniiq Family GmbH', 'gmbh', 'commercial', 'balance_sheet', 'regular_taxation', 'EUR', 'DE', 'BY', false, false)
on conflict (slug) do nothing;

-- ===========================================================================
-- Tax-year settings (per entity/year)
-- ===========================================================================
create table if not exists public.owner_tax_settings (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  tax_year int not null check (tax_year between 2000 and 2100),
  vat_timing text check (vat_timing in ('ist', 'soll')),
  vat_filing_frequency text check (vat_filing_frequency in ('monthly', 'quarterly', 'annual')),
  dauerfristverlaengerung boolean not null default false,
  municipality text,
  trade_tax_hebesatz_bp int check (trade_tax_hebesatz_bp is null or trade_tax_hebesatz_bp >= 20000),
  assessment_mode text not null default 'single' check (assessment_mode in ('single', 'joint')),
  church_tax_enabled boolean not null default false,
  church_tax_rate_bp int check (church_tax_rate_bp is null or (church_tax_rate_bp between 0 and 2000)),
  estimated_other_taxable_income_cents bigint check (estimated_other_taxable_income_cents is null or estimated_other_taxable_income_cents >= 0),
  manual_personal_adjustments_cents bigint,
  total_positive_income_cents bigint check (total_positive_income_cents is null or total_positive_income_cents >= 0),
  income_tax_prepayments_cents bigint not null default 0 check (income_tax_prepayments_cents >= 0),
  trade_tax_prepayments_cents bigint not null default 0 check (trade_tax_prepayments_cents >= 0),
  vat_prepayments_cents bigint not null default 0,
  soli_prepayments_cents bigint not null default 0 check (soli_prepayments_cents >= 0),
  church_tax_prepayments_cents bigint not null default 0 check (church_tax_prepayments_cents >= 0),
  reserve_horizon_days int not null default 90 check (reserve_horizon_days between 0 and 730),
  setup_complete boolean not null default false,
  assumptions_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_tax_settings_entity_year_key unique (business_entity_id, tax_year)
);

comment on table public.owner_tax_settings is
  'Per-entity per-year tax configuration. Owner-only. Never stores ELSTER certificates/passwords, banking credentials, OAuth tokens or identity documents.';

-- ===========================================================================
-- Expense categories (seeded) and vendors
-- ===========================================================================
create table if not exists public.owner_expense_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  default_deductibility_bp int not null default 10000 check (default_deductibility_bp between 0 and 10000),
  default_input_vat_eligibility_bp int not null default 10000 check (default_input_vat_eligibility_bp between 0 and 10000),
  euer_mapping_label text,
  asset_review_default boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_expense_categories_key_unique unique (key),
  constraint owner_expense_categories_key_format check (key ~ '^[a-z][a-z0-9_]+$')
);

insert into public.owner_expense_categories (key, label, euer_mapping_label, asset_review_default, sort_order) values
  ('ai_api', 'KI & API-Kosten', 'Bezogene Leistungen', false, 10),
  ('software', 'Software-Abonnements', 'Bezogene Leistungen', false, 20),
  ('cloud_hosting', 'Cloud & Hosting', 'Bezogene Leistungen', false, 30),
  ('domains_email', 'Domains & E-Mail', 'Bezogene Leistungen', false, 40),
  ('hardware', 'Hardware & Ausstattung', 'Anlagevermögen / GWG', true, 50),
  ('office', 'Büro', 'Sonstige Betriebsausgaben', false, 60),
  ('telecom', 'Telekommunikation', 'Sonstige Betriebsausgaben', false, 70),
  ('marketing', 'Marketing', 'Werbekosten', false, 80),
  ('travel', 'Reisekosten', 'Reisekosten', false, 90),
  ('vehicle', 'Fahrzeug', 'Kfz-Kosten', false, 100),
  ('professional_services', 'Beratung & Dienstleistungen', 'Rechts- und Beratungskosten', false, 110),
  ('banking_fees', 'Bank- & Zahlungsgebühren', 'Sonstige Betriebsausgaben', false, 120),
  ('insurance', 'Versicherungen', 'Sonstige Betriebsausgaben', false, 130),
  ('education', 'Weiterbildung', 'Fortbildungskosten', false, 140),
  ('client_direct', 'Kundenspezifische Direktkosten', 'Bezogene Leistungen', false, 150),
  ('taxes_public', 'Steuern & öffentliche Abgaben', 'Nicht abziehbar / gesondert', false, 160),
  ('other', 'Sonstiges', 'Sonstige Betriebsausgaben', false, 170),
  ('review_required', 'Prüfung erforderlich', 'Prüfung erforderlich', true, 180)
on conflict (key) do nothing;

create table if not exists public.owner_vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  vat_id text,
  website text,
  default_category_id uuid references public.owner_expense_categories(id) on delete set null,
  default_vat_treatment text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_vendors_name_not_blank check (length(trim(name)) > 0)
);

-- ===========================================================================
-- Invoices + lines
-- ===========================================================================
create table if not exists public.owner_invoices (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  engagement_id uuid references public.client_engagements(id) on delete set null,
  invoice_number text,
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void', 'cancelled', 'credited')),
  issue_date date,
  service_date date,
  service_period_start date,
  service_period_end date,
  due_date date,
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  net_total_cents bigint not null default 0,
  vat_total_cents bigint not null default 0,
  gross_total_cents bigint not null default 0,
  amount_paid_cents bigint not null default 0,
  notes text,
  external_reference text,
  issued_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists owner_invoices_entity_number_key
  on public.owner_invoices (business_entity_id, invoice_number)
  where invoice_number is not null;

create table if not exists public.owner_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.owner_invoices(id) on delete cascade,
  description text not null,
  quantity_milli bigint not null default 1000 check (quantity_milli > 0),
  unit_price_cents bigint not null,
  net_cents bigint not null default 0,
  vat_rate_bp int not null default 1900 check (vat_rate_bp between 0 and 10000),
  vat_treatment text not null default 'standard'
    check (vat_treatment in ('standard', 'reduced', 'zero_rated', 'exempt', 'outside_scope', 'reverse_charge', 'unknown')),
  vat_cents bigint not null default 0,
  gross_cents bigint not null default 0,
  service_period_start date,
  service_period_end date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_invoice_lines_description_not_blank check (length(trim(description)) > 0)
);

-- ===========================================================================
-- Expenses + lines
-- ===========================================================================
create table if not exists public.owner_expenses (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  vendor_id uuid references public.owner_vendors(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  engagement_id uuid references public.client_engagements(id) on delete set null,
  category_id uuid references public.owner_expense_categories(id) on delete set null,
  subscription_id uuid,
  supplier_invoice_number text,
  invoice_date date,
  service_date date,
  due_date date,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partially_paid', 'paid', 'void')),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  net_total_cents bigint not null default 0,
  vat_total_cents bigint not null default 0,
  gross_total_cents bigint not null default 0,
  input_vat_cents bigint not null default 0,
  reverse_charge_vat_cents bigint not null default 0,
  deductible_net_cents bigint not null default 0,
  amount_paid_cents bigint not null default 0,
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'needs_info')),
  review_reason text,
  notes text,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_expense_lines (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.owner_expenses(id) on delete cascade,
  category_id uuid references public.owner_expense_categories(id) on delete set null,
  description text not null,
  net_cents bigint not null,
  vat_rate_bp int not null default 1900 check (vat_rate_bp between 0 and 10000),
  vat_treatment text not null default 'domestic_standard'
    check (vat_treatment in ('domestic_standard', 'domestic_reduced', 'no_vat', 'exempt', 'outside_scope', 'reverse_charge_13b', 'intra_community', 'unknown')),
  vat_cents bigint not null default 0,
  gross_cents bigint not null default 0,
  input_vat_eligibility_bp int not null default 10000 check (input_vat_eligibility_bp between 0 and 10000),
  deductibility_bp int not null default 10000 check (deductibility_bp between 0 and 10000),
  asset_candidate boolean not null default false,
  euer_classification text,
  review_reason text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_expense_lines_description_not_blank check (length(trim(description)) > 0)
);

-- ===========================================================================
-- Subscriptions (forecast commitments; not paid expenses until an expense/payment exists)
-- ===========================================================================
create table if not exists public.owner_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  vendor_id uuid references public.owner_vendors(id) on delete set null,
  category_id uuid references public.owner_expense_categories(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  engagement_id uuid references public.client_engagements(id) on delete set null,
  name text not null,
  billing_frequency text not null default 'monthly'
    check (billing_frequency in ('monthly', 'quarterly', 'annual', 'custom')),
  custom_interval_days int check (custom_interval_days is null or custom_interval_days > 0),
  expected_net_cents bigint check (expected_net_cents is null or expected_net_cents >= 0),
  expected_gross_cents bigint check (expected_gross_cents is null or expected_gross_cents >= 0),
  vat_rate_bp int check (vat_rate_bp is null or (vat_rate_bp between 0 and 10000)),
  vat_treatment text,
  next_billing_date date,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  cancellation_notice_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_subscriptions_name_not_blank check (length(trim(name)) > 0)
);

alter table public.owner_expenses
  drop constraint if exists owner_expenses_subscription_fk;
alter table public.owner_expenses
  add constraint owner_expenses_subscription_fk
  foreign key (subscription_id) references public.owner_subscriptions(id) on delete set null;

-- ===========================================================================
-- Assets & depreciation
-- ===========================================================================
create table if not exists public.owner_assets (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  source_expense_line_id uuid references public.owner_expense_lines(id) on delete set null,
  name text not null,
  category text,
  serial_reference text,
  purchase_date date,
  acquisition_cost_cents bigint check (acquisition_cost_cents is null or acquisition_cost_cents >= 0),
  business_use_bp int not null default 10000 check (business_use_bp between 0 and 10000),
  depreciation_method text not null default 'straight_line'
    check (depreciation_method in ('immediate', 'straight_line', 'pool', 'manual')),
  useful_life_months int check (useful_life_months is null or useful_life_months > 0),
  depreciation_start_date date,
  disposal_date date,
  disposal_value_cents bigint check (disposal_value_cents is null or disposal_value_cents >= 0),
  depreciation_snapshot jsonb,
  status text not null default 'active' check (status in ('active', 'disposed', 'written_off')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_assets_name_not_blank check (length(trim(name)) > 0)
);

-- ===========================================================================
-- Tax estimates (immutable snapshots) + tax payments
-- ===========================================================================
create table if not exists public.owner_tax_estimates (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  tax_year int not null,
  period text,
  tax_type text not null
    check (tax_type in ('vat', 'income_tax', 'trade_tax', 'solidarity', 'church_tax', 'combined_reserve')),
  rules_version text not null,
  input_hash text,
  calculated_at timestamptz not null default now(),
  exact_totals jsonb not null default '{}'::jsonb,
  estimated_adjustments jsonb not null default '{}'::jsonb,
  breakdown jsonb not null default '{}'::jsonb,
  estimated_liability_cents bigint,
  prepayments_cents bigint not null default 0,
  remaining_reserve_cents bigint,
  confidence text not null default 'estimate' check (confidence in ('complete', 'estimate', 'incomplete')),
  warnings jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_tax_payments (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  tax_type text not null
    check (tax_type in ('vat', 'income_tax', 'trade_tax', 'solidarity', 'church_tax', 'other')),
  tax_year int,
  period text,
  direction text not null default 'outflow' check (direction in ('outflow', 'inflow')),
  amount_cents bigint not null check (amount_cents > 0),
  payment_date date not null,
  reference text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Payments / cash-transaction ledger
-- ===========================================================================
create table if not exists public.owner_payments (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  kind text not null
    check (kind in ('income', 'expense', 'owner_contribution', 'owner_withdrawal', 'tax_payment', 'tax_refund', 'transfer')),
  direction text not null check (direction in ('inflow', 'outflow')),
  payment_date date not null,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  payment_method text,
  counterparty text,
  reference text,
  invoice_id uuid references public.owner_invoices(id) on delete set null,
  expense_id uuid references public.owner_expenses(id) on delete set null,
  tax_payment_id uuid references public.owner_tax_payments(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Documents (metadata only), exports, ELSTER V2 prep, audit, idempotency
-- ===========================================================================
create table if not exists public.owner_finance_documents (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  storage_object_path text not null,
  original_filename text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or (file_size_bytes > 0 and file_size_bytes <= 26214400)),
  doc_type text,
  checksum text,
  invoice_id uuid references public.owner_invoices(id) on delete set null,
  expense_id uuid references public.owner_expenses(id) on delete set null,
  asset_id uuid references public.owner_assets(id) on delete set null,
  tax_estimate_id uuid references public.owner_tax_estimates(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  archived_at timestamptz,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_finance_documents_mime_check check (
    mime_type is null or mime_type in (
      'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  ),
  constraint owner_finance_documents_path_key unique (storage_object_path)
);

create table if not exists public.owner_exports (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  export_type text not null,
  period_start date,
  period_end date,
  status text not null default 'ready' check (status in ('generating', 'ready', 'failed', 'archived')),
  rules_version text,
  source_hash text,
  file_object_path text,
  file_metadata jsonb not null default '{}'::jsonb,
  record_counts jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.owner_elster_submissions (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  export_id uuid references public.owner_exports(id) on delete set null,
  tax_type text not null,
  period text,
  status text not null default 'draft'
    check (status in ('draft', 'validation_pending', 'validated', 'ready', 'submitted', 'accepted', 'rejected')),
  transfer_ticket text,
  protocol_document_id uuid references public.owner_finance_documents(id) on delete set null,
  eric_version text,
  tax_form_version text,
  validation_result jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.owner_elster_submissions is
  'ELSTER V2 preparation only. No transmission occurs in V1; elster_direct_submission_enabled defaults false. No certificates/passwords are ever stored here.';

create table if not exists public.owner_audit_log (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid references public.owner_business_entities(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_summary jsonb,
  after_summary jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_finance_requests (
  idempotency_key uuid primary key,
  kind text not null,
  result jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Indexes
-- ===========================================================================
create index if not exists owner_tax_settings_entity_idx on public.owner_tax_settings(business_entity_id);
create index if not exists owner_invoices_entity_date_idx on public.owner_invoices(business_entity_id, issue_date);
create index if not exists owner_invoices_status_idx on public.owner_invoices(status);
create index if not exists owner_invoices_due_idx on public.owner_invoices(due_date);
create index if not exists owner_invoices_client_idx on public.owner_invoices(client_account_id);
create index if not exists owner_invoices_org_idx on public.owner_invoices(organization_id);
create index if not exists owner_invoice_lines_invoice_idx on public.owner_invoice_lines(invoice_id);
create index if not exists owner_expenses_entity_date_idx on public.owner_expenses(business_entity_id, invoice_date);
create index if not exists owner_expenses_status_idx on public.owner_expenses(payment_status);
create index if not exists owner_expenses_vendor_idx on public.owner_expenses(vendor_id);
create index if not exists owner_expenses_category_idx on public.owner_expenses(category_id);
create index if not exists owner_expense_lines_expense_idx on public.owner_expense_lines(expense_id);
create index if not exists owner_payments_entity_date_idx on public.owner_payments(business_entity_id, payment_date);
create index if not exists owner_payments_invoice_idx on public.owner_payments(invoice_id);
create index if not exists owner_payments_expense_idx on public.owner_payments(expense_id);
create index if not exists owner_subscriptions_entity_idx on public.owner_subscriptions(business_entity_id, status);
create index if not exists owner_assets_entity_idx on public.owner_assets(business_entity_id, status);
create index if not exists owner_tax_estimates_entity_year_idx on public.owner_tax_estimates(business_entity_id, tax_year, tax_type);
create index if not exists owner_tax_payments_entity_idx on public.owner_tax_payments(business_entity_id, tax_year);
create index if not exists owner_documents_entity_idx on public.owner_finance_documents(business_entity_id);
create index if not exists owner_exports_entity_idx on public.owner_exports(business_entity_id, generated_at);
create index if not exists owner_audit_entity_idx on public.owner_audit_log(business_entity_id, created_at);

commit;

-- ===========================================================================
-- Triggers, RLS, grants, RPCs, storage, post-conditions
-- ===========================================================================
begin;

-- updated_at maintenance
do $$
declare t text;
begin
  foreach t in array array[
    'owner_business_entities', 'owner_tax_settings', 'owner_expense_categories', 'owner_vendors',
    'owner_invoices', 'owner_invoice_lines', 'owner_expenses', 'owner_expense_lines',
    'owner_subscriptions', 'owner_assets', 'owner_tax_payments', 'owner_payments',
    'owner_finance_documents', 'owner_elster_submissions'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end;
$$;

-- Server-authoritative invoice-line math (never trusts submitted net/vat/gross).
create or replace function public.owner_recalc_invoice_line()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.net_cents := round((new.quantity_milli::numeric * new.unit_price_cents) / 1000.0);
  if new.vat_treatment in ('standard', 'reduced') then
    new.vat_cents := round((new.net_cents::numeric * new.vat_rate_bp) / 10000.0);
  else
    new.vat_cents := 0;
  end if;
  new.gross_cents := new.net_cents + new.vat_cents;
  return new;
end;
$$;

create or replace function public.owner_recalc_invoice_totals()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare target_invoice uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  update public.owner_invoices i
  set net_total_cents = coalesce(agg.net, 0),
      vat_total_cents = coalesce(agg.vat, 0),
      gross_total_cents = coalesce(agg.gross, 0)
  from (
    select sum(net_cents) net, sum(vat_cents) vat, sum(gross_cents) gross
    from public.owner_invoice_lines where invoice_id = target_invoice
  ) agg
  where i.id = target_invoice;
  return coalesce(new, old);
end;
$$;

-- Server-authoritative expense-line VAT/gross and header aggregation.
create or replace function public.owner_recalc_expense_line()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.vat_treatment in ('domestic_standard', 'domestic_reduced', 'reverse_charge_13b', 'intra_community') then
    new.vat_cents := round((new.net_cents::numeric * new.vat_rate_bp) / 10000.0);
  else
    new.vat_cents := 0;
  end if;
  -- Supplier gross excludes self-assessed reverse-charge/intra-community VAT.
  if new.vat_treatment in ('domestic_standard', 'domestic_reduced') then
    new.gross_cents := new.net_cents + new.vat_cents;
  else
    new.gross_cents := new.net_cents;
  end if;
  return new;
end;
$$;

create or replace function public.owner_recalc_expense_totals()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare target_expense uuid := coalesce(new.expense_id, old.expense_id);
begin
  update public.owner_expenses e
  set net_total_cents = coalesce(agg.net, 0),
      vat_total_cents = coalesce(agg.vat, 0),
      gross_total_cents = coalesce(agg.gross, 0),
      input_vat_cents = coalesce(agg.input_vat, 0),
      reverse_charge_vat_cents = coalesce(agg.rc_vat, 0),
      deductible_net_cents = coalesce(agg.deductible_net, 0)
  from (
    select
      sum(net_cents) net,
      sum(vat_cents) vat,
      sum(gross_cents) gross,
      sum(round((vat_cents::numeric * input_vat_eligibility_bp) / 10000.0)) input_vat,
      sum(case when vat_treatment in ('reverse_charge_13b', 'intra_community') then vat_cents else 0 end) rc_vat,
      sum(round((net_cents::numeric * deductibility_bp) / 10000.0)) deductible_net
    from public.owner_expense_lines where expense_id = target_expense
  ) agg
  where e.id = target_expense;
  return coalesce(new, old);
end;
$$;

-- Payment direction/allocation validation.
create or replace function public.owner_validate_payment()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare inv_status text; exp_status text;
begin
  if new.kind in ('income', 'owner_contribution', 'tax_refund') and new.direction <> 'inflow' then
    raise exception 'payment kind % must be an inflow', new.kind;
  end if;
  if new.kind in ('expense', 'owner_withdrawal', 'tax_payment') and new.direction <> 'outflow' then
    raise exception 'payment kind % must be an outflow', new.kind;
  end if;
  if new.invoice_id is not null then
    if new.direction <> 'inflow' then
      raise exception 'invoice payments must be inflows';
    end if;
    select status into inv_status from public.owner_invoices where id = new.invoice_id;
    if inv_status in ('void', 'cancelled') then
      raise exception 'cannot record a payment against a % invoice', inv_status;
    end if;
  end if;
  if new.expense_id is not null then
    if new.direction <> 'outflow' then
      raise exception 'expense payments must be outflows';
    end if;
    select payment_status into exp_status from public.owner_expenses where id = new.expense_id;
    if exp_status = 'void' then
      raise exception 'cannot record a payment against a void expense';
    end if;
  end if;
  return new;
end;
$$;

-- Recompute invoice/expense paid amounts and derived status from allocations.
create or replace function public.owner_apply_payment()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare inv_id uuid; exp_id uuid;
begin
  for inv_id in select unnest(array_remove(array[new.invoice_id, old.invoice_id], null))
  loop
    update public.owner_invoices i
    set amount_paid_cents = coalesce((
          select sum(amount_cents) from public.owner_payments p
          where p.invoice_id = i.id and p.direction = 'inflow'), 0),
        status = case
          when i.status in ('draft', 'void', 'cancelled', 'credited') then i.status
          when coalesce((select sum(amount_cents) from public.owner_payments p where p.invoice_id = i.id and p.direction = 'inflow'), 0) >= i.gross_total_cents
               and i.gross_total_cents > 0 then 'paid'
          when coalesce((select sum(amount_cents) from public.owner_payments p where p.invoice_id = i.id and p.direction = 'inflow'), 0) > 0 then 'partially_paid'
          else 'issued'
        end
    where i.id = inv_id;
  end loop;
  for exp_id in select unnest(array_remove(array[new.expense_id, old.expense_id], null))
  loop
    update public.owner_expenses e
    set amount_paid_cents = coalesce((
          select sum(amount_cents) from public.owner_payments p
          where p.expense_id = e.id and p.direction = 'outflow'), 0),
        payment_status = case
          when e.payment_status = 'void' then 'void'
          when coalesce((select sum(amount_cents) from public.owner_payments p where p.expense_id = e.id and p.direction = 'outflow'), 0) >= e.gross_total_cents
               and e.gross_total_cents > 0 then 'paid'
          when coalesce((select sum(amount_cents) from public.owner_payments p where p.expense_id = e.id and p.direction = 'outflow'), 0) > 0 then 'partially_paid'
          else 'unpaid'
        end
    where e.id = exp_id;
  end loop;
  return coalesce(new, old);
end;
$$;

-- Preserve accounting history: issued invoices cannot be hard-deleted or silently renumbered.
create or replace function public.owner_guard_invoice()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if public.is_database_admin() or public.request_is_service_role() then
    if tg_op = 'DELETE' then return old; end if;
  end if;
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'issued invoices cannot be deleted; void or cancel instead';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if old.status <> 'draft' and new.invoice_number is distinct from old.invoice_number then
      raise exception 'issued invoice numbers cannot be changed';
    end if;
    if new.status = 'issued' and new.issued_at is null then
      new.issued_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists owner_invoice_lines_recalc_line on public.owner_invoice_lines;
create trigger owner_invoice_lines_recalc_line before insert or update on public.owner_invoice_lines
  for each row execute function public.owner_recalc_invoice_line();
drop trigger if exists owner_invoice_lines_recalc_totals on public.owner_invoice_lines;
create trigger owner_invoice_lines_recalc_totals after insert or update or delete on public.owner_invoice_lines
  for each row execute function public.owner_recalc_invoice_totals();

drop trigger if exists owner_expense_lines_recalc_line on public.owner_expense_lines;
create trigger owner_expense_lines_recalc_line before insert or update on public.owner_expense_lines
  for each row execute function public.owner_recalc_expense_line();
drop trigger if exists owner_expense_lines_recalc_totals on public.owner_expense_lines;
create trigger owner_expense_lines_recalc_totals after insert or update or delete on public.owner_expense_lines
  for each row execute function public.owner_recalc_expense_totals();

drop trigger if exists owner_payments_validate on public.owner_payments;
create trigger owner_payments_validate before insert or update on public.owner_payments
  for each row execute function public.owner_validate_payment();
drop trigger if exists owner_payments_apply on public.owner_payments;
create trigger owner_payments_apply after insert or update or delete on public.owner_payments
  for each row execute function public.owner_apply_payment();

drop trigger if exists owner_invoices_guard on public.owner_invoices;
create trigger owner_invoices_guard before update or delete on public.owner_invoices
  for each row execute function public.owner_guard_invoice();

-- ---------------------------------------------------------------------------
-- RLS: every owner-finance table is gated strictly on public.is_platform_owner()
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'owner_business_entities', 'owner_tax_settings', 'owner_expense_categories', 'owner_vendors',
    'owner_invoices', 'owner_invoice_lines', 'owner_expenses', 'owner_expense_lines',
    'owner_subscriptions', 'owner_assets', 'owner_tax_payments', 'owner_payments',
    'owner_finance_documents', 'owner_exports', 'owner_elster_submissions', 'owner_finance_requests'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())',
      t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

-- Append-only / immutable tables: select + insert only for owners (no update/delete).
alter table public.owner_tax_estimates enable row level security;
drop policy if exists owner_tax_estimates_owner_select on public.owner_tax_estimates;
create policy owner_tax_estimates_owner_select on public.owner_tax_estimates for select to authenticated using (public.is_platform_owner());
drop policy if exists owner_tax_estimates_owner_insert on public.owner_tax_estimates;
create policy owner_tax_estimates_owner_insert on public.owner_tax_estimates for insert to authenticated with check (public.is_platform_owner());
revoke all on table public.owner_tax_estimates from public, anon, authenticated;
grant select, insert on table public.owner_tax_estimates to authenticated;
grant select, insert, update, delete on table public.owner_tax_estimates to service_role;

alter table public.owner_audit_log enable row level security;
drop policy if exists owner_audit_log_owner_select on public.owner_audit_log;
create policy owner_audit_log_owner_select on public.owner_audit_log for select to authenticated using (public.is_platform_owner());
drop policy if exists owner_audit_log_owner_insert on public.owner_audit_log;
create policy owner_audit_log_owner_insert on public.owner_audit_log for insert to authenticated with check (public.is_platform_owner());
revoke all on table public.owner_audit_log from public, anon, authenticated;
grant select, insert on table public.owner_audit_log to authenticated;
grant select, insert on table public.owner_audit_log to service_role;

-- Computed money columns are trigger-owned. A table-wide UPDATE grant would let a client forge
-- header totals, and a column-level REVOKE cannot subtract from a table-wide grant, so instead we
-- revoke the whole-table UPDATE and re-grant UPDATE only on the client-editable columns.
revoke update on table public.owner_invoices from authenticated;
grant update (
  organization_id, client_account_id, engagement_id, invoice_number, status, issue_date, service_date,
  service_period_start, service_period_end, due_date, currency, notes, external_reference, archived_at
) on table public.owner_invoices to authenticated;

revoke update on table public.owner_invoice_lines from authenticated;
grant update (
  description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment,
  service_period_start, service_period_end, sort_order
) on table public.owner_invoice_lines to authenticated;

revoke update on table public.owner_expenses from authenticated;
grant update (
  vendor_id, organization_id, client_account_id, engagement_id, category_id, subscription_id,
  supplier_invoice_number, invoice_date, service_date, due_date, payment_status, currency,
  review_status, review_reason, notes, archived_at
) on table public.owner_expenses to authenticated;

revoke update on table public.owner_expense_lines from authenticated;
grant update (
  category_id, description, net_cents, vat_rate_bp, vat_treatment,
  input_vat_eligibility_bp, deductibility_bp, asset_candidate, euer_classification, review_reason, sort_order
) on table public.owner_expense_lines to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: create_crm_only_client — idempotent CRM record, no portal/solution/membership/invitation
-- ---------------------------------------------------------------------------
create or replace function public.create_crm_only_client(
  p_idempotency_key uuid,
  p_display_name text,
  p_legal_name text,
  p_primary_email text,
  p_phone text,
  p_industry text,
  p_lifecycle_status text,
  p_primary_contact_name text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_lifecycle text := coalesce(nullif(trim(p_lifecycle_status), ''), 'lead');
  v_existing jsonb;
  v_org_id uuid;
  v_account_id uuid;
  v_contact_id uuid;
  v_result jsonb;
begin
  -- Owner or admin may create CRM-only clients (admin includes owner).
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform admins/owners may create CRM clients';
  end if;
  if p_idempotency_key is null then
    raise exception 'an idempotency key is required';
  end if;
  if length(trim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'display_name is required';
  end if;
  if v_lifecycle not in ('lead', 'qualified', 'active', 'paused', 'churned', 'archived') then
    raise exception 'invalid lifecycle_status';
  end if;
  if p_primary_email is not null and trim(p_primary_email) <> '' and p_primary_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid primary_email';
  end if;

  insert into public.owner_finance_requests (idempotency_key, kind, created_by)
  values (p_idempotency_key, 'create_crm_only_client', auth.uid())
  on conflict (idempotency_key) do nothing;

  select r.result into v_existing
  from public.owner_finance_requests r
  where r.idempotency_key = p_idempotency_key
  for update;
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.organizations (name, status, created_by)
  values (trim(p_display_name), 'pending', auth.uid())
  returning id into v_org_id;

  insert into public.client_accounts (
    organization_id, display_name, legal_name, primary_email, phone, industry, primary_contact_name, lifecycle_status
  )
  values (
    v_org_id, trim(p_display_name), nullif(trim(coalesce(p_legal_name, '')), ''),
    nullif(trim(coalesce(p_primary_email, '')), ''), nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_industry, '')), ''), nullif(trim(coalesce(p_primary_contact_name, '')), ''), v_lifecycle
  )
  returning id into v_account_id;

  if length(trim(coalesce(p_primary_contact_name, ''))) > 0 then
    insert into public.client_contacts (organization_id, name, email, phone, is_primary)
    values (v_org_id, trim(p_primary_contact_name), nullif(trim(coalesce(p_primary_email, '')), ''), nullif(trim(coalesce(p_phone, '')), ''), true)
    returning id into v_contact_id;
  end if;

  v_result := jsonb_build_object(
    'organization_id', v_org_id,
    'client_account_id', v_account_id,
    'client_contact_id', v_contact_id
  );
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

comment on function public.create_crm_only_client is
  'Owner/admin-only idempotent CRM-only client creation: organization + client_account (+ optional primary contact). Creates no solution, membership or invitation and exposes no customer portal.';

-- ---------------------------------------------------------------------------
-- RPC: owner_finance_period_summary — owner-only scoped aggregates for the dashboard
-- ---------------------------------------------------------------------------
create or replace function public.owner_finance_period_summary(
  p_entity uuid,
  p_from date,
  p_to date
)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not public.is_platform_owner() then
    raise exception 'Owner access required';
  end if;
  if p_entity is null or p_from is null or p_to is null or p_from > p_to then
    raise exception 'a valid entity and date range are required';
  end if;

  select jsonb_build_object(
    'entity', p_entity,
    'from', p_from,
    'to', p_to,
    'invoiced_net_cents', coalesce((select sum(net_total_cents) from public.owner_invoices
        where business_entity_id = p_entity and issue_date between p_from and p_to
          and status in ('issued', 'partially_paid', 'paid', 'overdue')), 0),
    'invoiced_vat_cents', coalesce((select sum(vat_total_cents) from public.owner_invoices
        where business_entity_id = p_entity and issue_date between p_from and p_to
          and status in ('issued', 'partially_paid', 'paid', 'overdue')), 0),
    'invoiced_gross_cents', coalesce((select sum(gross_total_cents) from public.owner_invoices
        where business_entity_id = p_entity and issue_date between p_from and p_to
          and status in ('issued', 'partially_paid', 'paid', 'overdue')), 0),
    'outstanding_cents', coalesce((select sum(gross_total_cents - amount_paid_cents) from public.owner_invoices
        where business_entity_id = p_entity and status in ('issued', 'partially_paid', 'overdue')), 0),
    'overdue_cents', coalesce((select sum(gross_total_cents - amount_paid_cents) from public.owner_invoices
        where business_entity_id = p_entity and status in ('issued', 'partially_paid', 'overdue')
          and due_date is not null and due_date < current_date and gross_total_cents > amount_paid_cents), 0),
    'overdue_count', coalesce((select count(*) from public.owner_invoices
        where business_entity_id = p_entity and status in ('issued', 'partially_paid', 'overdue')
          and due_date is not null and due_date < current_date and gross_total_cents > amount_paid_cents), 0),
    'cash_in_cents', coalesce((select sum(amount_cents) from public.owner_payments
        where business_entity_id = p_entity and direction = 'inflow' and payment_date between p_from and p_to), 0),
    'cash_out_cents', coalesce((select sum(amount_cents) from public.owner_payments
        where business_entity_id = p_entity and direction = 'outflow' and payment_date between p_from and p_to), 0),
    'expense_net_cents', coalesce((select sum(net_total_cents) from public.owner_expenses
        where business_entity_id = p_entity and invoice_date between p_from and p_to and payment_status <> 'void'), 0),
    'expense_gross_cents', coalesce((select sum(gross_total_cents) from public.owner_expenses
        where business_entity_id = p_entity and invoice_date between p_from and p_to and payment_status <> 'void'), 0),
    'expense_input_vat_cents', coalesce((select sum(input_vat_cents) from public.owner_expenses
        where business_entity_id = p_entity and invoice_date between p_from and p_to and payment_status <> 'void'), 0),
    'recurring_monthly_cost_cents', coalesce((select sum(
        case billing_frequency
          when 'monthly' then coalesce(expected_gross_cents, 0)
          when 'quarterly' then round(coalesce(expected_gross_cents, 0) / 3.0)
          when 'annual' then round(coalesce(expected_gross_cents, 0) / 12.0)
          else 0 end)
        from public.owner_subscriptions where business_entity_id = p_entity and status = 'active'), 0),
    'review_expense_count', coalesce((select count(*) from public.owner_expenses
        where business_entity_id = p_entity and review_status <> 'reviewed'), 0)
  ) into v;
  return v;
end;
$$;

comment on function public.owner_finance_period_summary(uuid, date, date) is
  'Owner-only scoped dashboard aggregates so overview pages never load every financial row.';

-- Function grants
revoke execute on function public.create_crm_only_client(uuid, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_crm_only_client(uuid, text, text, text, text, text, text, text) to authenticated, service_role;
revoke execute on function public.owner_finance_period_summary(uuid, date, date) from public, anon;
grant execute on function public.owner_finance_period_summary(uuid, date, date) to authenticated, service_role;
revoke execute on function public.owner_recalc_invoice_line() from public, anon, authenticated;
revoke execute on function public.owner_recalc_invoice_totals() from public, anon, authenticated;
revoke execute on function public.owner_recalc_expense_line() from public, anon, authenticated;
revoke execute on function public.owner_recalc_expense_totals() from public, anon, authenticated;
revoke execute on function public.owner_apply_payment() from public, anon, authenticated;
grant execute on function public.owner_recalc_invoice_line() to service_role;
grant execute on function public.owner_recalc_invoice_totals() to service_role;
grant execute on function public.owner_recalc_expense_line() to service_role;
grant execute on function public.owner_recalc_expense_totals() to service_role;
grant execute on function public.owner_apply_payment() to service_role;

-- ---------------------------------------------------------------------------
-- Private storage bucket + owner-only policies (guarded: absent in the bare smoke DB)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('owner-finance-documents', 'owner-finance-documents', false)
    on conflict (id) do nothing;

    execute 'drop policy if exists owner_finance_docs_select on storage.objects';
    execute 'drop policy if exists owner_finance_docs_insert on storage.objects';
    execute 'drop policy if exists owner_finance_docs_update on storage.objects';
    execute 'drop policy if exists owner_finance_docs_delete on storage.objects';
    execute $p$create policy owner_finance_docs_select on storage.objects for select to authenticated
      using (bucket_id = 'owner-finance-documents' and public.is_platform_owner())$p$;
    execute $p$create policy owner_finance_docs_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'owner-finance-documents' and public.is_platform_owner())$p$;
    execute $p$create policy owner_finance_docs_update on storage.objects for update to authenticated
      using (bucket_id = 'owner-finance-documents' and public.is_platform_owner())
      with check (bucket_id = 'owner-finance-documents' and public.is_platform_owner())$p$;
    execute $p$create policy owner_finance_docs_delete on storage.objects for delete to authenticated
      using (bucket_id = 'owner-finance-documents' and public.is_platform_owner())$p$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Post-conditions: RLS enabled on every owner-finance table.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'owner_business_entities', 'owner_tax_settings', 'owner_expense_categories', 'owner_vendors',
    'owner_invoices', 'owner_invoice_lines', 'owner_expenses', 'owner_expense_lines',
    'owner_subscriptions', 'owner_assets', 'owner_tax_estimates', 'owner_tax_payments',
    'owner_payments', 'owner_finance_documents', 'owner_exports', 'owner_elster_submissions',
    'owner_audit_log', 'owner_finance_requests'
  ]
  loop
    if not exists (select 1 from pg_class where oid = format('public.%I', t)::regclass and relrowsecurity) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
  end loop;
end;
$$;

commit;
