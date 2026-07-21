// Trusted admin edge function for provisioning a client workspace and issuing an Auth invitation.
//
// Security posture:
//   * The caller is authenticated via their own bearer token.
//   * Platform-admin status is confirmed independently from the database (profiles.platform_role),
//     never from user metadata or the request body.
//   * provision_client_workspace() runs under the caller's identity so its own is_platform_admin()
//     check applies. Only the Auth invite step uses the service-role key, which is read from the
//     server environment and is never returned or logged.
//
// Environment (server-side only, never a VITE_* variable):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, CUSTOMER_PORTAL_INVITE_REDIRECT

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const INVITE_REDIRECT =
  Deno.env.get("CUSTOMER_PORTAL_INVITE_REDIRECT") ?? "https://cogniiq.de/app/login";

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    return json({ error: "Server is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Missing bearer token" }, 401);
  }

  // Caller-scoped client: identity + RLS use the caller's JWT.
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return json({ error: "Invalid session" }, 401);
  }

  // Independently confirm platform-admin status from the database.
  const { data: profile, error: profileError } = await callerClient
    .from("profiles")
    .select("platform_role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const role = (profile as { platform_role?: string } | null)?.platform_role;
  if (profileError || (role !== "cogniiq_admin" && role !== "cogniiq_owner")) {
    return json({ error: "Platform administrator access required" }, 403);
  }

  let body: JsonRecord;
  try {
    body = (await req.json()) as JsonRecord;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = asString(body.action) ?? "provision";
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- Resend path ----
  if (action === "resend") {
    const email = asString(body.email)?.toLowerCase() ?? null;
    if (!email || !EMAIL_RE.test(email)) return json({ error: "A valid email is required" }, 400);
    const invite = await sendInvite(adminClient, email);
    return json({ ok: true, action: "resend", email, invitation: invite });
  }

  // ---- Provision path ----
  const displayName = asString(body.displayName);
  const projectName = asString(body.projectName);
  const solutionDisplayName = asString(body.solutionDisplayName);
  const catalogKey = asString(body.catalogKey);
  const implementationKey = asString(body.implementationKey);
  const invitationEmail = asString(body.invitationEmail)?.toLowerCase() ?? null;

  if (!displayName) return json({ error: "displayName is required" }, 400);
  if (!projectName) return json({ error: "projectName is required" }, 400);
  if (!solutionDisplayName) return json({ error: "solutionDisplayName is required" }, 400);
  if (!catalogKey) return json({ error: "catalogKey is required" }, 400);
  if (!implementationKey) return json({ error: "implementationKey is required" }, 400);
  if (!invitationEmail || !EMAIL_RE.test(invitationEmail)) {
    return json({ error: "A valid invitationEmail is required" }, 400);
  }

  // Atomic DB provisioning under the caller's identity (RPC re-checks is_platform_admin()).
  const { data: provisionResult, error: provisionError } = await callerClient.rpc(
    "provision_client_workspace",
    {
      p_display_name: displayName,
      p_legal_name: asString(body.legalName),
      p_primary_contact_name: asString(body.primaryContactName),
      p_primary_email: asString(body.primaryEmail),
      p_phone: asString(body.phone),
      p_website: asString(body.website),
      p_industry: asString(body.industry),
      p_address: asString(body.address),
      p_lead_source: asString(body.leadSource),
      p_lifecycle_status: asString(body.lifecycleStatus) ?? "lead",
      p_internal_notes: asString(body.internalNotes),
      p_internal_owner: asString(body.internalOwner),
      p_currency: asString(body.currency) ?? "EUR",
      p_estimated_total_budget_cents: asInt(body.estimatedTotalBudgetCents),
      p_estimated_monthly_value_cents: asInt(body.estimatedMonthlyValueCents),
      p_catalog_key: catalogKey,
      p_project_name: projectName,
      p_engagement_status: asString(body.engagementStatus) ?? "active",
      p_total_budget_cents: asInt(body.totalBudgetCents),
      p_setup_fee_cents: asInt(body.setupFeeCents),
      p_recurring_fee_cents: asInt(body.recurringFeeCents),
      p_target_go_live_date: asString(body.targetGoLiveDate),
      p_solution_display_name: solutionDisplayName,
      p_implementation_key: implementationKey,
      p_instance_key: asString(body.instanceKey),
      p_invitation_email: invitationEmail,
      p_organization_role: asString(body.organizationRole) ?? "owner",
    },
  );

  if (provisionError || !provisionResult) {
    return json({ error: provisionError?.message ?? "Provisioning failed" }, 400);
  }

  // Send the invitation only if requested. Existing users are preserved, not recreated.
  let invite: JsonRecord | null = null;
  if (body.sendInvitation !== false) {
    invite = await sendInvite(adminClient, invitationEmail);
  }

  return json({
    ok: true,
    action: "provision",
    workspace: provisionResult as JsonRecord,
    invitation: invite ?? { skipped: true },
  });
});

// Issue an Auth invite. Handles the case where the user already exists without deleting or
// recreating them: the pending database invitation remains, so they gain access on next login.
async function sendInvite(
  adminClient: ReturnType<typeof createClient>,
  email: string,
): Promise<JsonRecord> {
  try {
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: INVITE_REDIRECT,
    });
    if (!error) return { status: "sent", email };

    const message = error.message ?? "invite failed";
    if (/already|registered|exists/i.test(message)) {
      return {
        status: "existing_user",
        email,
        note: "User already has an account. The pending database invitation grants access on next verified login.",
      };
    }
    // Recoverable email error: provisioning succeeded, invitation remains pending.
    return { status: "email_error", email, message };
  } catch {
    return { status: "email_error", email, message: "Invite request failed" };
  }
}
