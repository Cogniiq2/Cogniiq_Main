// Owner-side access & roles API.
//
// EVERY call in this file is a SECURITY DEFINER RPC that re-authorizes the caller as a Cogniiq
// platform admin server-side. There is deliberately no direct table access here at all: the
// browser has no INSERT/UPDATE/DELETE grant on any authorization table, so a raw table write would
// fail anyway — routing through the RPCs keeps the authorization in one auditable place.

import { supabase } from '@/lib/supabase';

/** The RPCs this module is allowed to call. Asserted by a test so the list cannot quietly grow. */
export const ACCESS_ADMIN_RPCS = [
  'admin_organization_access_overview',
  'assign_organization_member_role',
  'remove_organization_member_role',
  'set_client_invitation_roles',
  'apply_sports_club_role_presets',
] as const;

export interface AccessRole {
  id: string;
  role_key: string;
  label: string;
  description: string | null;
  sort_order: number;
  capabilities: string[];
}

export interface AccessMember {
  membership_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  organization_role: string;
  membership_status: string;
  role_ids: string[];
  effective_capabilities: string[];
}

export interface AccessInvitation {
  id: string;
  email: string;
  organization_role: string;
  status: string;
  expires_at: string | null;
  role_ids: string[];
}

export interface AccessCapability {
  key: string;
  label: string;
  description: string | null;
  solution_catalog_key: string | null;
  is_active: boolean;
}

export interface OrganizationAccessOverview {
  organizationId: string;
  roles: AccessRole[];
  members: AccessMember[];
  invitations: AccessInvitation[];
  capabilityCatalog: AccessCapability[];
}

function array<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadOrganizationAccessOverview(
  organizationId: string
): Promise<OrganizationAccessOverview> {
  const { data, error } = await supabase.rpc('admin_organization_access_overview', {
    p_organization_id: organizationId,
  });
  if (error) throw new Error(error.message);

  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    organizationId,
    roles: array<AccessRole>(payload.roles),
    members: array<AccessMember>(payload.members),
    invitations: array<AccessInvitation>(payload.invitations),
    capabilityCatalog: array<AccessCapability>(payload.capability_catalog),
  };
}

export async function assignMemberRole(
  membershipId: string,
  organizationRoleId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('assign_organization_member_role', {
    p_organization_member_id: membershipId,
    p_organization_role_id: organizationRoleId,
  });
  return { error: error?.message ?? null };
}

export async function removeMemberRole(
  membershipId: string,
  organizationRoleId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('remove_organization_member_role', {
    p_organization_member_id: membershipId,
    p_organization_role_id: organizationRoleId,
  });
  return { error: error?.message ?? null };
}

/** Replaces the functional roles configured on a PENDING invitation. */
export async function setInvitationRoles(
  invitationId: string,
  organizationRoleIds: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_client_invitation_roles', {
    p_invitation_id: invitationId,
    p_organization_role_ids: organizationRoleIds,
  });
  return { error: error?.message ?? null };
}

/** Creates the reusable sports-club role presets in this organization. Assigns them to nobody. */
export async function applySportsClubRolePresets(
  organizationId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('apply_sports_club_role_presets', {
    p_organization_id: organizationId,
  });
  return { error: error?.message ?? null };
}
