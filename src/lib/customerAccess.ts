import type { Organization, OrganizationMembership } from '@/contexts/AuthContext';

export const productKeys = [
  'client_hub',
  'ai_receptionist',
  'pankofer_operations',
  'document_automation',
  'installation_management',
  'inventory_management',
] as const;

export type ProductKey = (typeof productKeys)[number];

export const serviceEntitlementStatuses = [
  'pending_payment',
  'provisioning',
  'active',
  'past_due',
  'suspended',
  'cancelled',
] as const;

export type ServiceEntitlementStatus = (typeof serviceEntitlementStatuses)[number];

export type CustomerAccessState =
  | 'unauthenticated'
  | 'authenticated_without_organization'
  | 'pending_payment'
  | 'provisioning'
  | 'mfa_required'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'cancelled';

export interface ServiceEntitlement {
  id: string;
  organizationId: string;
  productKey: ProductKey;
  status: ServiceEntitlementStatus;
  startsAt: string | null;
  endsAt: string | null;
  activationSource: string | null;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceEntitlementRow {
  id: string;
  organization_id: string;
  product_key: ProductKey;
  status: ServiceEntitlementStatus;
  starts_at: string | null;
  ends_at: string | null;
  activation_source: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
}

export function mapServiceEntitlementRow(row: ServiceEntitlementRow): ServiceEntitlement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productKey: row.product_key,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    activationSource: row.activation_source,
    externalReference: row.external_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getServiceEntitlement(
  entitlements: ServiceEntitlement[],
  productKey: ProductKey
): ServiceEntitlement | null {
  return entitlements.find((entitlement) => entitlement.productKey === productKey) ?? null;
}

export function hasActiveEntitlement(entitlements: ServiceEntitlement[], productKey: ProductKey): boolean {
  const entitlement = getServiceEntitlement(entitlements, productKey);
  if (!entitlement || entitlement.status !== 'active') return false;

  const now = Date.now();
  const startsAt = entitlement.startsAt ? Date.parse(entitlement.startsAt) : null;
  const endsAt = entitlement.endsAt ? Date.parse(entitlement.endsAt) : null;

  if (startsAt !== null && Number.isFinite(startsAt) && startsAt > now) return false;
  if (endsAt !== null && Number.isFinite(endsAt) && endsAt <= now) return false;
  return true;
}

export function getCustomerAccessState({
  userPresent,
  activeMembership,
  activeOrganization,
  entitlements,
  aal,
}: {
  userPresent: boolean;
  activeMembership: OrganizationMembership | null;
  activeOrganization: Organization | null;
  entitlements: ServiceEntitlement[];
  aal: string | null;
}): CustomerAccessState {
  if (!userPresent) return 'unauthenticated';
  if (!activeMembership || !activeOrganization) return 'authenticated_without_organization';

  if (activeOrganization.status === 'cancelled') return 'cancelled';
  if (activeOrganization.status === 'suspended') return 'suspended';
  if (activeOrganization.status === 'pending') return 'provisioning';

  const clientHub = getServiceEntitlement(entitlements, 'client_hub');
  if (!clientHub) return 'pending_payment';

  if (clientHub.status === 'pending_payment') return 'pending_payment';
  if (clientHub.status === 'provisioning') return 'provisioning';
  if (clientHub.status === 'past_due') return 'past_due';
  if (clientHub.status === 'suspended') return 'suspended';
  if (clientHub.status === 'cancelled') return 'cancelled';

  if (!hasActiveEntitlement(entitlements, 'client_hub')) return 'provisioning';
  if (aal !== 'aal2') return 'mfa_required';

  return 'active';
}
