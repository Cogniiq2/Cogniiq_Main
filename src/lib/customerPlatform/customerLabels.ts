// German presentation vocabulary for the ACCOUNT-level values the Customer Portal shows.
//
// `src/lib/customerPlatform/types.ts` already owns the labels for the customer RPC
// vocabulary (project status, milestone status, document category, invoice status).
// What it does not cover is the handful of auth/organization enums that the portal
// settings page renders: `profiles.platform_role`, `organizations.status` and
// `organization_memberships.role`. Those were previously printed raw, so a customer
// could read `cogniiq_admin` or `pending` on their own settings page.
//
// The stored values are the contract with the database and are never changed here.
// This module only decides how they are spelled to a human.

import type { MembershipStatus, OrganizationRole, PlatformRole } from '@/contexts/AuthContext';

/** `organizations.status`. */
export type CustomerOrganizationStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

export const customerPlatformRoleLabels: Record<PlatformRole, string> = {
  customer: 'Kundenzugang',
  cogniiq_admin: 'Cogniiq Administration',
  cogniiq_owner: 'Cogniiq Inhaber',
};

export const customerOrganizationStatusLabels: Record<CustomerOrganizationStatus, string> = {
  pending: 'Wird eingerichtet',
  active: 'Aktiv',
  suspended: 'Ausgesetzt',
  cancelled: 'Beendet',
};

export const customerOrganizationRoleLabels: Record<OrganizationRole, string> = {
  owner: 'Inhaber',
  admin: 'Administrator',
  member: 'Mitglied',
  viewer: 'Leseberechtigt',
};

export const customerMembershipStatusLabels: Record<MembershipStatus, string> = {
  invited: 'Eingeladen',
  active: 'Aktiv',
  suspended: 'Ausgesetzt',
};

/**
 * Look a value up in one of the maps above.
 *
 * Values arriving from PostgREST are typed but not validated, so an unrecognised
 * token is possible in principle. It renders as a neutral placeholder rather than as
 * the raw enum — an em dash is a more honest answer to a customer than a database
 * token they cannot interpret.
 */
function lookup<T extends string>(map: Record<T, string>, value: string | null | undefined): string {
  if (!value) return '—';
  return (map as Record<string, string>)[value] ?? '—';
}

export const customerPlatformRoleLabel = (v: string | null | undefined) =>
  lookup(customerPlatformRoleLabels, v);
export const customerOrganizationStatusLabel = (v: string | null | undefined) =>
  lookup(customerOrganizationStatusLabels, v);
export const customerOrganizationRoleLabel = (v: string | null | undefined) =>
  lookup(customerOrganizationRoleLabels, v);
export const customerMembershipStatusLabel = (v: string | null | undefined) =>
  lookup(customerMembershipStatusLabels, v);

/**
 * Every raw token that must never appear as rendered text in the Customer Portal.
 * Derived from the maps themselves so the list cannot drift from the unions, and
 * consumed by the portal's falsification test.
 */
export const rawCustomerAccountEnumValues: readonly string[] = [
  ...Object.keys(customerPlatformRoleLabels),
  ...Object.keys(customerOrganizationStatusLabels),
  ...Object.keys(customerMembershipStatusLabels),
];
