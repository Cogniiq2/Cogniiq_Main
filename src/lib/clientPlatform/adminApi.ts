import { FunctionsHttpError } from '@supabase/supabase-js';

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
  idempotencyKey: string;
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
  invitationEmail: string;
  organizationRole: string;
  sendInvitation: boolean;
  /**
   * Only sent on a SECOND submission, after the owner has been shown the matching
   * organizations and has explicitly chosen. Never defaulted client-side: an absent
   * decision is what makes the server refuse an ambiguous match instead of guessing.
   */
  identityDecision?: 'reuse' | 'create_separate' | null;
  /** Required when identityDecision is 'reuse'. */
  targetOrganizationId?: string | null;
}

/**
 * An organization that may already be this customer, as reported by the server when
 * provisioning stops for a decision.
 *
 * `match_strength` is 'name_only' when nothing beyond the normalized company name
 * matched — which is exactly the case that must never be resolved automatically.
 */
export interface OrganizationIdentityCandidate {
  organization_id: string;
  organization_name: string;
  organization_status: string;
  match_strength: 'strong' | 'name_only';
  matched_on: string[];
  created_at: string | null;
}

export interface ProvisionClientResult {
  ok: boolean;
  workspace?: Record<string, unknown>;
  invitation?: Record<string, unknown>;
  error?: string;
  /**
   * Present only when provisioning stopped because an existing organization might be
   * this same customer. Not an error to retry — a choice to make.
   */
  identityConflict?: OrganizationIdentityCandidate[];
}

/** German copy for the identity signals the server reports, for the decision UI. */
export const identityMatchLabels: Record<string, string> = {
  normalized_name: 'Firmenname',
  contact_email: 'Kontakt-E-Mail',
  corporate_email_domain: 'Firmen-E-Mail-Domain',
  website_host: 'Website',
  website_matches_email_domain: 'Website entspricht E-Mail-Domain',
};

export async function provisionClientViaEdge(payload: ProvisionClientPayload): Promise<ProvisionClientResult> {
  const { data, error } = await supabase.functions.invoke('admin-provision-client', {
    body: { action: 'provision', ...payload },
  });

  // A 409 identity conflict arrives as a FunctionsHttpError: `data` is null and the
  // structured body lives on error.context, so it has to be read from the response
  // rather than from `data`.
  if (error) {
    const body = await readFunctionErrorBody(error);
    if (body?.error === 'organization_identity_conflict') {
      return {
        ok: false,
        error: 'organization_identity_conflict',
        identityConflict: Array.isArray(body.candidates) ? body.candidates : [],
      };
    }
    return { ok: false, error: typeof body?.error === 'string' ? body.error : error.message };
  }
  return data as ProvisionClientResult;
}

interface ProvisionErrorBody {
  error?: string;
  candidates?: OrganizationIdentityCandidate[];
  hint?: string | null;
}

/** Reads a non-2xx Edge Function body without consuming the caller's response. */
async function readFunctionErrorBody(error: unknown): Promise<ProvisionErrorBody | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    return (await error.context.clone().json()) as ProvisionErrorBody;
  } catch {
    return null;
  }
}

// Resend is scoped to a controlled invitation record (never a free-form email). Expired
// invitations require an explicit renewExpired flag so renewal is a deliberate action. The email
// outcome ('sent' | 'existing_user' | 'email_error') is surfaced so the UI can report accurately.
export async function resendInvitationViaEdge(
  invitationId: string,
  renewExpired = false,
): Promise<{ ok: boolean; outcome?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('admin-provision-client', {
    body: { action: 'resend', invitationId, renewExpired },
  });
  const result = data as { ok?: boolean; error?: string; invitation?: { status?: string } } | null;
  const outcome = result?.invitation?.status;
  if (error) {
    // On a non-2xx, `data` is null — the structured body lives on the error's Response and has to
    // be read out explicitly. Without this every real reason ("Invitation not found", "Cannot
    // resend a revoked invitation", "Invitation is expired") surfaced to the operator as the
    // generic "Edge Function returned a non-2xx status code". provisionClientViaEdge already does
    // this via readFunctionErrorBody; resend never did.
    const body = await readFunctionErrorBody(error);
    return { ok: false, outcome, error: body?.error ?? result?.error ?? error.message };
  }
  return { ok: Boolean(result?.ok), outcome, error: result?.error };
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
