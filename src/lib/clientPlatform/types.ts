// Explicit types for the product-aware client platform.

export const solutionCatalogKeys = [
  'ai_receptionist',
  'automation_workspace',
  'custom_client_portal',
  'website_management',
] as const;
export type SolutionCatalogKey = (typeof solutionCatalogKeys)[number];

export const implementationKeys = [
  'ai_receptionist',
  'automation_workspace',
  'pankofer_operations',
  'unavailable',
] as const;
export type ImplementationKey = (typeof implementationKeys)[number];

export const organizationSolutionStatuses = ['provisioning', 'active', 'paused', 'disabled'] as const;
export type OrganizationSolutionStatus = (typeof organizationSolutionStatuses)[number];

export const clientLifecycleStatuses = [
  'lead',
  'qualified',
  'active',
  'paused',
  'churned',
  'archived',
] as const;
export type ClientLifecycleStatus = (typeof clientLifecycleStatuses)[number];

export const engagementStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled'] as const;
export type EngagementStatus = (typeof engagementStatuses)[number];

export const invitationStatuses = ['pending', 'accepted', 'revoked', 'expired'] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationSolution {
  id: string;
  organization_id: string;
  engagement_id: string | null;
  catalog_key: SolutionCatalogKey;
  instance_key: string;
  display_name: string;
  implementation_key: ImplementationKey;
  status: OrganizationSolutionStatus;
  nav_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationPortalSettings {
  organization_id: string;
  portal_title: string | null;
  logo_url: string | null;
  accent_color: string | null;
  default_solution_id: string | null;
  support_contact: string | null;
  config: Record<string, unknown>;
}

export interface SolutionCatalogEntry {
  key: SolutionCatalogKey;
  label: string;
  description: string | null;
  default_implementation_key: ImplementationKey;
  is_active: boolean;
  sort_order: number;
}

export interface ClientAccount {
  id: string;
  organization_id: string;
  legal_name: string | null;
  display_name: string;
  primary_contact_name: string | null;
  primary_email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  address: string | null;
  lifecycle_status: ClientLifecycleStatus;
  lead_source: string | null;
  internal_notes: string | null;
  estimated_total_budget_cents: number | null;
  estimated_monthly_value_cents: number | null;
  internal_owner: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  id: string;
  organization_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  should_invite: boolean;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientEngagement {
  id: string;
  organization_id: string;
  catalog_key: SolutionCatalogKey;
  project_name: string;
  status: EngagementStatus;
  total_budget_cents: number | null;
  setup_fee_cents: number | null;
  recurring_fee_cents: number | null;
  currency: string;
  start_date: string | null;
  target_go_live_date: string | null;
  internal_owner: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClientInvitation {
  id: string;
  organization_id: string;
  email: string;
  organization_role: OrganizationRole;
  status: InvitationStatus;
  invited_by: string | null;
  accepted_user_id: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Result of provision_client_workspace RPC.
export interface ProvisionWorkspaceResult {
  organization_id: string;
  client_account_id: string;
  client_contact_id: string;
  engagement_id: string;
  organization_solution_id: string;
  instance_key: string;
  invitation_id: string;
  invitation_email: string;
}
