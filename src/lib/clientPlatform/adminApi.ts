import { supabase } from '@/lib/supabase';
import type {
  ClientAccount,
  ClientContact,
  ClientEngagement,
  ClientInvitation,
  OrganizationSolution,
  OrganizationSolutionStatus,
} from '@/lib/clientPlatform/types';

export interface AdminOrganization {
  id: string;
  name: string;
  status: string;
}

export interface AdminClientRow {
  organizationId: string;
  organizationName: string;
  organizationStatus: string;
  account: ClientAccount | null;
  solutions: OrganizationSolution[];
  engagements: ClientEngagement[];
  invitations: ClientInvitation[];
}

export interface AdminClientDetail extends AdminClientRow {
  contacts: ClientContact[];
}

function indexBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}

export async function loadAdminClients(): Promise<AdminClientRow[]> {
  const [orgs, accounts, solutions, engagements, invitations] = await Promise.all([
    supabase.from('organizations').select('id, name, status'),
    supabase.from('client_accounts').select('*'),
    supabase.from('organization_solutions').select('*'),
    supabase.from('client_engagements').select('*'),
    supabase.from('client_invitations').select('*'),
  ]);

  const firstError = orgs.error || accounts.error || solutions.error || engagements.error || invitations.error;
  if (firstError) throw firstError;

  const accountByOrg = new Map<string, ClientAccount>();
  for (const a of (accounts.data ?? []) as ClientAccount[]) accountByOrg.set(a.organization_id, a);
  const solutionsByOrg = indexBy((solutions.data ?? []) as OrganizationSolution[], (s) => s.organization_id);
  const engagementsByOrg = indexBy((engagements.data ?? []) as ClientEngagement[], (e) => e.organization_id);
  const invitationsByOrg = indexBy((invitations.data ?? []) as ClientInvitation[], (i) => i.organization_id);

  // Only surface organizations that have a CRM account (client platform managed clients).
  return ((accounts.data ?? []) as ClientAccount[])
    .map((account) => {
      const org = ((orgs.data ?? []) as AdminOrganization[]).find((o) => o.id === account.organization_id);
      return {
        organizationId: account.organization_id,
        organizationName: org?.name ?? account.display_name,
        organizationStatus: org?.status ?? 'unknown',
        account,
        solutions: solutionsByOrg.get(account.organization_id) ?? [],
        engagements: engagementsByOrg.get(account.organization_id) ?? [],
        invitations: invitationsByOrg.get(account.organization_id) ?? [],
      };
    })
    .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
}

export async function loadClientDetail(organizationId: string): Promise<AdminClientDetail | null> {
  const [account, org, solutions, engagements, invitations, contacts] = await Promise.all([
    supabase.from('client_accounts').select('*').eq('organization_id', organizationId).maybeSingle(),
    supabase.from('organizations').select('id, name, status').eq('id', organizationId).maybeSingle(),
    supabase.from('organization_solutions').select('*').eq('organization_id', organizationId).order('nav_order'),
    supabase.from('client_engagements').select('*').eq('organization_id', organizationId),
    supabase.from('client_invitations').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
    supabase.from('client_contacts').select('*').eq('organization_id', organizationId).order('is_primary', { ascending: false }),
  ]);

  const firstError = account.error || org.error || solutions.error || engagements.error || invitations.error || contacts.error;
  if (firstError) throw firstError;
  if (!account.data) return null;

  const orgRow = org.data as AdminOrganization | null;
  return {
    organizationId,
    organizationName: orgRow?.name ?? (account.data as ClientAccount).display_name,
    organizationStatus: orgRow?.status ?? 'unknown',
    account: account.data as ClientAccount,
    solutions: (solutions.data ?? []) as OrganizationSolution[],
    engagements: (engagements.data ?? []) as ClientEngagement[],
    invitations: (invitations.data ?? []) as ClientInvitation[],
    contacts: (contacts.data ?? []) as ClientContact[],
  };
}

export interface ProvisionClientPayload {
  displayName: string;
  legalName?: string | null;
  primaryContactName?: string | null;
  primaryEmail?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  address?: string | null;
  leadSource?: string | null;
  lifecycleStatus: string;
  internalNotes?: string | null;
  internalOwner?: string | null;
  currency: string;
  estimatedTotalBudgetCents?: number | null;
  estimatedMonthlyValueCents?: number | null;
  catalogKey: string;
  projectName: string;
  engagementStatus: string;
  totalBudgetCents?: number | null;
  setupFeeCents?: number | null;
  recurringFeeCents?: number | null;
  targetGoLiveDate?: string | null;
  solutionDisplayName: string;
  implementationKey: string;
  instanceKey?: string | null;
  invitationEmail: string;
  organizationRole: string;
  sendInvitation: boolean;
}

export interface ProvisionClientResult {
  ok: boolean;
  workspace?: Record<string, unknown>;
  invitation?: Record<string, unknown>;
  error?: string;
}

export async function provisionClientViaEdge(payload: ProvisionClientPayload): Promise<ProvisionClientResult> {
  const { data, error } = await supabase.functions.invoke('admin-provision-client', {
    body: { action: 'provision', ...payload },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return data as ProvisionClientResult;
}

export async function resendInvitationViaEdge(email: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('admin-provision-client', {
    body: { action: 'resend', email },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: Boolean((data as { ok?: boolean })?.ok) };
}

export async function setSolutionStatus(
  solutionId: string,
  status: OrganizationSolutionStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('organization_solutions').update({ status }).eq('id', solutionId);
  return { error: error?.message ?? null };
}

export async function revokeInvitation(invitationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_invitations').update({ status: 'revoked' }).eq('id', invitationId);
  return { error: error?.message ?? null };
}

export async function addClientContact(
  organizationId: string,
  contact: { name: string; title?: string | null; email?: string | null; phone?: string | null },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_contacts').insert({
    organization_id: organizationId,
    name: contact.name,
    title: contact.title ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
  });
  return { error: error?.message ?? null };
}

export async function updateClientAccount(
  organizationId: string,
  patch: Partial<Pick<ClientAccount,
    'display_name' | 'legal_name' | 'primary_contact_name' | 'primary_email' | 'phone' | 'website' |
    'industry' | 'address' | 'lifecycle_status' | 'lead_source' | 'internal_notes' | 'internal_owner' |
    'estimated_total_budget_cents' | 'estimated_monthly_value_cents'>>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('client_accounts').update(patch).eq('organization_id', organizationId);
  return { error: error?.message ?? null };
}

export function portalLinkForInstance(instanceKey: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cogniiq.de';
  return `${origin}/app/solutions/${instanceKey}`;
}
