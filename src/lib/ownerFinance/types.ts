// Types for the owner finance cockpit. Money is integer cents; percentages are basis points.

export interface OwnerBusinessEntity {
  id: string;
  slug: string;
  display_name: string;
  legal_name: string | null;
  legal_form: string;
  business_type: string;
  accounting_method: string;
  vat_scheme: string;
  currency: string;
  country_code: string;
  federal_state: string | null;
  municipality: string | null;
  business_start_date: string | null;
  is_active: boolean;
  calculations_enabled: boolean;
  elster_direct_submission_enabled: boolean;
}

export interface OwnerTaxSettings {
  id: string;
  business_entity_id: string;
  tax_year: number;
  vat_timing: 'ist' | 'soll' | null;
  vat_filing_frequency: 'monthly' | 'quarterly' | 'annual' | null;
  dauerfristverlaengerung: boolean;
  municipality: string | null;
  trade_tax_hebesatz_bp: number | null;
  assessment_mode: 'single' | 'joint';
  church_tax_enabled: boolean;
  church_tax_rate_bp: number | null;
  estimated_other_taxable_income_cents: number | null;
  manual_personal_adjustments_cents: number | null;
  total_positive_income_cents: number | null;
  income_tax_prepayments_cents: number;
  trade_tax_prepayments_cents: number;
  vat_prepayments_cents: number;
  soli_prepayments_cents: number;
  church_tax_prepayments_cents: number;
  reserve_horizon_days: number;
  setup_complete: boolean;
  assumptions_notes: string | null;
}

export interface OwnerInvoice {
  id: string;
  business_entity_id: string;
  organization_id: string | null;
  client_account_id: string | null;
  engagement_id: string | null;
  invoice_number: string | null;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void' | 'cancelled' | 'credited';
  issue_date: string | null;
  service_date: string | null;
  due_date: string | null;
  currency: string;
  net_total_cents: number;
  vat_total_cents: number;
  gross_total_cents: number;
  amount_paid_cents: number;
  notes: string | null;
  external_reference: string | null;
  issued_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerInvoiceLine {
  id: string;
  invoice_id: string;
  description: string;
  quantity_milli: number;
  unit_price_cents: number;
  net_cents: number;
  vat_rate_bp: number;
  vat_treatment: string;
  vat_cents: number;
  gross_cents: number;
  sort_order: number;
}

export interface OwnerExpense {
  id: string;
  business_entity_id: string;
  vendor_id: string | null;
  organization_id: string | null;
  client_account_id: string | null;
  category_id: string | null;
  subscription_id: string | null;
  supplier_invoice_number: string | null;
  invoice_date: string | null;
  service_date: string | null;
  due_date: string | null;
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'void';
  currency: string;
  net_total_cents: number;
  vat_total_cents: number;
  gross_total_cents: number;
  input_vat_cents: number;
  reverse_charge_vat_cents: number;
  deductible_net_cents: number;
  amount_paid_cents: number;
  review_status: 'pending' | 'reviewed' | 'needs_info';
  review_reason: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface OwnerSubscription {
  id: string;
  business_entity_id: string;
  vendor_id: string | null;
  category_id: string | null;
  name: string;
  billing_frequency: 'monthly' | 'quarterly' | 'annual' | 'custom';
  expected_net_cents: number | null;
  expected_gross_cents: number | null;
  vat_treatment: string | null;
  next_billing_date: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'paused' | 'cancelled';
  cancellation_notice_date: string | null;
  notes: string | null;
}

export interface OwnerAsset {
  id: string;
  business_entity_id: string;
  name: string;
  category: string | null;
  serial_reference: string | null;
  purchase_date: string | null;
  acquisition_cost_cents: number | null;
  business_use_bp: number;
  depreciation_method: 'immediate' | 'straight_line' | 'pool' | 'manual';
  useful_life_months: number | null;
  depreciation_start_date: string | null;
  disposal_date: string | null;
  disposal_value_cents: number | null;
  status: 'active' | 'disposed' | 'written_off';
  notes: string | null;
}

export interface OwnerVendor {
  id: string;
  name: string;
  country_code: string | null;
  vat_id: string | null;
  website: string | null;
  default_category_id: string | null;
  default_vat_treatment: string | null;
  notes: string | null;
}

export interface OwnerExpenseCategory {
  id: string;
  key: string;
  label: string;
  default_deductibility_bp: number;
  default_input_vat_eligibility_bp: number;
  euer_mapping_label: string | null;
  asset_review_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface OwnerTaxEstimate {
  id: string;
  business_entity_id: string;
  tax_year: number;
  period: string | null;
  tax_type: string;
  rules_version: string;
  calculated_at: string;
  estimated_liability_cents: number | null;
  prepayments_cents: number;
  remaining_reserve_cents: number | null;
  confidence: 'complete' | 'estimate' | 'incomplete';
  warnings: string[];
  breakdown: Record<string, unknown>;
}

export interface OwnerAuditEntry {
  id: string;
  business_entity_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  before_summary: Record<string, unknown> | null;
  after_summary: Record<string, unknown> | null;
  created_at: string;
}

export interface OwnerFinanceDocument {
  id: string;
  business_entity_id: string;
  storage_object_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  doc_type: string | null;
  invoice_id: string | null;
  expense_id: string | null;
  asset_id: string | null;
  created_at: string;
}

export interface OwnerExportRun {
  id: string;
  business_entity_id: string;
  export_type: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  rules_version: string | null;
  record_counts: Record<string, number>;
  warnings: string[];
  generated_at: string;
}

export interface PeriodSummary {
  entity: string;
  from: string;
  to: string;
  invoiced_net_cents: number;
  invoiced_vat_cents: number;
  invoiced_gross_cents: number;
  outstanding_cents: number;
  overdue_cents: number;
  overdue_count: number;
  cash_in_cents: number;
  cash_out_cents: number;
  expense_net_cents: number;
  expense_gross_cents: number;
  expense_input_vat_cents: number;
  recurring_monthly_cost_cents: number;
  review_expense_count: number;
}
