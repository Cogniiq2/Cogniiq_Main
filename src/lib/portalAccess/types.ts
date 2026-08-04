// Typed shape of public.current_user_portal_context().
//
// The RPC returns one jsonb document. Everything here is parsed defensively: a malformed or
// partial payload must degrade to "no access", never to "all access".

import type { MembershipStatus, OrganizationRole, PlatformRole } from '@/contexts/AuthContext';
import type { OrganizationSolutionStatus } from '@/lib/clientPlatform/types';

export interface PortalFunctionalRole {
  id: string;
  role_key: string;
  label: string;
  description: string | null;
}

export interface PortalSolution {
  id: string;
  catalog_key: string;
  instance_key: string;
  implementation_key: string;
  display_name: string;
  status: OrganizationSolutionStatus;
  nav_order: number;
}

export interface PortalSettings {
  organization_id: string;
  portal_title: string | null;
  logo_url: string | null;
  accent_color: string | null;
  support_contact: string | null;
}

export interface PortalOrganizationAccess {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string | null;
  organizationStatus: string;
  /** The COARSE governance role (owner/admin/member/viewer), unchanged by this feature. */
  organizationRole: OrganizationRole;
  membershipStatus: MembershipStatus;
  /** Organization-specific functional roles this membership holds. */
  roles: PortalFunctionalRole[];
  /** Deduplicated effective capability keys, already solution-filtered by the database. */
  capabilities: string[];
  solutions: PortalSolution[];
  portalSettings: PortalSettings | null;
}

export interface PortalContext {
  userId: string;
  platformRole: PlatformRole;
  isPlatformAdmin: boolean;
  organizations: PortalOrganizationAccess[];
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseRole(raw: unknown): PortalFunctionalRole | null {
  const row = record(raw);
  if (!row) return null;
  const id = str(row.id);
  const roleKey = str(row.role_key);
  const label = str(row.label);
  if (!id || !roleKey || !label) return null;
  return { id, role_key: roleKey, label, description: str(row.description) };
}

function parseSolution(raw: unknown): PortalSolution | null {
  const row = record(raw);
  if (!row) return null;
  const id = str(row.id);
  const instanceKey = str(row.instance_key);
  const catalogKey = str(row.catalog_key);
  if (!id || !instanceKey || !catalogKey) return null;
  return {
    id,
    catalog_key: catalogKey,
    instance_key: instanceKey,
    implementation_key: str(row.implementation_key) ?? 'unavailable',
    display_name: str(row.display_name) ?? catalogKey,
    status: (str(row.status) ?? 'disabled') as OrganizationSolutionStatus,
    nav_order: typeof row.nav_order === 'number' ? row.nav_order : 0,
  };
}

function parseSettings(raw: unknown, organizationId: string): PortalSettings | null {
  const row = record(raw);
  if (!row) return null;
  return {
    organization_id: str(row.organization_id) ?? organizationId,
    portal_title: str(row.portal_title),
    logo_url: str(row.logo_url),
    accent_color: str(row.accent_color),
    support_contact: str(row.support_contact),
  };
}

function parseOrganization(raw: unknown): PortalOrganizationAccess | null {
  const row = record(raw);
  if (!row) return null;
  const membershipId = str(row.membership_id);
  const organizationId = str(row.organization_id);
  if (!membershipId || !organizationId) return null;

  // A membership that is not active must never produce portal access. The RPC already filters
  // these out; parsing enforces the same rule so a stale or hand-crafted payload cannot widen it.
  const membershipStatus = (str(row.membership_status) ?? 'invited') as MembershipStatus;
  if (membershipStatus !== 'active') return null;

  return {
    membershipId,
    organizationId,
    organizationName: str(row.organization_name) ?? 'Organisation',
    organizationSlug: str(row.organization_slug),
    organizationStatus: str(row.organization_status) ?? 'pending',
    organizationRole: (str(row.organization_role) ?? 'viewer') as OrganizationRole,
    membershipStatus,
    roles: Array.isArray(row.roles)
      ? row.roles.map(parseRole).filter((role): role is PortalFunctionalRole => role !== null)
      : [],
    capabilities: strArray(row.capabilities),
    solutions: Array.isArray(row.solutions)
      ? row.solutions.map(parseSolution).filter((s): s is PortalSolution => s !== null)
      : [],
    portalSettings: parseSettings(row.portal_settings, organizationId),
  };
}

/**
 * Parses the RPC payload. Returns null for anything that is not a usable context — the caller
 * treats null as "no access", so a malformed payload can only ever remove access.
 */
export function parsePortalContext(raw: unknown): PortalContext | null {
  const row = record(raw);
  if (!row) return null;
  const userId = str(row.user_id);
  if (!userId) return null;

  return {
    userId,
    platformRole: (str(row.platform_role) ?? 'customer') as PlatformRole,
    isPlatformAdmin: row.is_platform_admin === true,
    organizations: Array.isArray(row.organizations)
      ? row.organizations
          .map(parseOrganization)
          .filter((org): org is PortalOrganizationAccess => org !== null)
      : [],
  };
}
