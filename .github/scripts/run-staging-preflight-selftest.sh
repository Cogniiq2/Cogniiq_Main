#!/usr/bin/env bash
# =============================================================================
# Self-test for scripts/staging/preflight.sql
# =============================================================================
# A preflight that cannot fail is worthless. This boots a THROWAWAY local
# PostgreSQL cluster, applies the real migration chain, and asserts the preflight:
#
#   1. passes cleanly against a correctly migrated database — with an EXACT
#      expected assertion count, so a check that silently stops being emitted
#      is caught just as loudly as a check that fails, and
#   2. FAILS, with the right check, against every deliberately broken state
#      below — a public bucket, a service-role-only function granted to
#      authenticated, a customer table left readable by anon, a missing
#      migration, and (for the reusable capability authorization migration
#      20260804120000) a missing table, RLS switched off, a dropped composite
#      foreign key, a wrong authenticated grant, an accidental anon grant, a
#      missing capability, a wrong solution binding, and claim-function drift
#      that loses the functional-role transfer.
#
# Never touches Supabase. Each break is applied inside a transaction that is
# rolled back, so the checks are independent.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"
SQLDIR="$ROOT/.github/scripts/sql"
PREFLIGHT="$ROOT/scripts/staging/preflight.sql"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "postgres server binaries not found (set PGBIN)"; exit 1; }

RUNUSER=""
if [ "$(id -u)" = "0" ]; then
  RUNUSER="${PGTEST_USER:-pgtest}"
  id "$RUNUSER" >/dev/null 2>&1 || useradd -m "$RUNUSER"
fi
WORKBASE="${PGTEST_HOME:-$( [ -n "$RUNUSER" ] && echo "/home/$RUNUSER/preflight.$$" || echo "$(mktemp -d)" )}"
DATA="$WORKBASE/data"; SOCK="$WORKBASE/sock"
rm -rf "$WORKBASE"; mkdir -p "$DATA" "$SOCK"
as() { if [ -n "$RUNUSER" ]; then sudo -u "$RUNUSER" "$@"; else "$@"; fi; }
if [ -n "$RUNUSER" ]; then chown -R "$RUNUSER" "$WORKBASE"; chmod 700 "$DATA"; fi

cleanup() { as "$PGBIN/pg_ctl" -D "$DATA" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$WORKBASE"; }
trap cleanup EXIT

as "$PGBIN/initdb" -D "$DATA" -U postgres --auth=trust >/dev/null
as "$PGBIN/pg_ctl" -D "$DATA" -o "-k $SOCK -c listen_addresses=''" -l "$WORKBASE/pg.log" start >/dev/null
sleep 1
PSQL() { as "$PGBIN/psql" -h "$SOCK" -U postgres -v ON_ERROR_STOP=1 "$@"; }

PSQL -c "create database pre;" >/dev/null
PSQL -d pre -c "alter database pre set client_min_messages = warning;" >/dev/null
PSQL -d pre -q -f "$SQLDIR/customer-platform-bootstrap.sql" >/dev/null

CHAIN=(20260710120000_phase0_auth_tenancy_rls
       20260710133000_phase0_security_hardening
       20260721120000_product_aware_client_platform
       20260722120000_owner_finance_cockpit
       20260723120000_owner_document_settings
       20260723121000_owner_offers
       20260723122000_owner_commercial_documents
       20260723123000_owner_premium_offer_editor
       20260723124000_owner_premium_offer_runtime_hotfix
       20260723125000_owner_signature_proposal_experience
       20260723126000_owner_automation_worker
       20260723127000_owner_signed_certificate_workflow
       20260723128000_owner_offer_email_workflow
       20260724120000_owner_customer_task_management)
for f in "${CHAIN[@]}"; do PSQL -d pre -q -f "$MIG/$f.sql" >/dev/null; done

NEW=(20260728120000_customer_project_core
     20260728121000_customer_documents
     20260728122000_customer_billing_link
     20260728123000_owner_invoice_organization_assignment
     20260728124000_customer_document_archive_service_role
     20260730120000_customer_project_organization_scope
     20260731120000_customer_document_publish_guard
     20260731121000_client_provisioning_identity)

FAILURES=0
note_ok()   { echo "ok: $1"; }
note_fail() { echo "FAIL: $1"; FAILURES=$((FAILURES + 1)); }

run_preflight() { as "$PGBIN/psql" -h "$SOCK" -U postgres -q -d pre -f "$PREFLIGHT" 2>&1; }

# --- 1) An INCOMPLETE database must be reported as incomplete -----------------
# Only the first migration is applied so far; the preflight must say so for the
# other four rather than passing.
PSQL -d pre -q -f "$MIG/${NEW[0]}.sql" >/dev/null
OUT="$(run_preflight)"
for missing in "${NEW[@]:1}"; do
  if printf '%s\n' "$OUT" | grep -q "^FAIL:.*${missing} is applied"; then
    note_ok "preflight reports $missing as NOT applied while it is missing"
  else
    note_fail "preflight did not detect that $missing is missing"
  fi
done
if printf '%s\n' "$OUT" | grep -q "^PASS:.*${NEW[0]} is applied"; then
  note_ok "preflight reports ${NEW[0]} as applied once it is"
else
  note_fail "preflight did not detect ${NEW[0]} as applied"
fi

# --- 2) A fully migrated database must pass cleanly ---------------------------
for f in "${NEW[@]:1}"; do PSQL -d pre -q -f "$MIG/$f.sql" >/dev/null; done

# Case D: apply the convergence migration, then repair the ledger exactly as
# the real hosted deployment plan does -- mark the five superseded legacy
# versions and the convergence migration's own version applied, tracking-only
# (no legacy migration SQL is ever executed here either).
PSQL -d pre -q -f "$MIG/20260731122000_case_d_legacy_convergence.sql" >/dev/null

# Reusable capability authorization. Applied at its REAL version — the preflight asserts the
# hosted ledger names 20260804120000 itself, precisely because this project has already been
# burned once by a generated replacement timestamp.
PSQL -d pre -q -f "$MIG/20260804120000_reusable_capability_authorization.sql" >/dev/null

PSQL -d pre -c "
  insert into supabase_migrations.schema_migrations (version, name) values
    ('20260607194622', 'create_tasks_table'),
    ('20260607200426', 'fix_tasks_rls_policies'),
    ('20260706121415', 'create_execution_tables'),
    ('20260706122833', 'fix_execution_rls_for_anon'),
    ('20260709120000', 'create_richer_oura_tables'),
    ('20260710120000', 'phase0_auth_tenancy_rls'),
    ('20260710133000', 'phase0_security_hardening'),
    ('20260711120000', 'receptionist_persistence'),
    ('20260721120000', 'product_aware_client_platform'),
    ('20260722120000', 'owner_finance_cockpit'),
    ('20260723120000', 'owner_document_settings'),
    ('20260723121000', 'owner_offers'),
    ('20260723122000', 'owner_commercial_documents'),
    ('20260723123000', 'owner_premium_offer_editor'),
    ('20260723124000', 'owner_premium_offer_runtime_hotfix'),
    ('20260723125000', 'owner_signature_proposal_experience'),
    ('20260723126000', 'owner_automation_worker'),
    ('20260723127000', 'owner_signed_certificate_workflow'),
    ('20260723128000', 'owner_offer_email_workflow'),
    ('20260724120000', 'owner_customer_task_management'),
    ('20260728120000', 'customer_project_core'),
    ('20260728121000', 'customer_documents'),
    ('20260728122000', 'customer_billing_link'),
    ('20260728123000', 'owner_invoice_organization_assignment'),
    ('20260728124000', 'customer_document_archive_service_role'),
    ('20260730031350', 'create_cogniiq_receptionist_leads'),
    ('20260730120000', 'customer_project_organization_scope'),
    ('20260730130000', 'pankofer_organization_reconciliation'),
    ('20260731120000', 'customer_document_publish_guard'),
    ('20260731121000', 'client_provisioning_identity'),
    ('20260731122000', 'case_d_legacy_convergence'),
    ('20260804120000', 'reusable_capability_authorization');
" >/dev/null

# The EXACT number of assertions the preflight must emit against a correct database.
# A lower bound would let a whole guarded section stop being emitted — a check that never
# runs cannot fail, and would look identical to a clean run. Raise this deliberately when
# checks are added, never to make a red run go green.
EXPECTED_PASS_COUNT="${EXPECTED_PASS_COUNT:-456}"

OUT="$(run_preflight)"
FAILED_LINES="$(printf '%s\n' "$OUT" | grep '^FAIL: ' || true)"
PASS_COUNT="$(printf '%s\n' "$OUT" | grep -c '^PASS: ' || true)"
if [ -n "$FAILED_LINES" ]; then
  note_fail "preflight reported failures against a correct database:"
  printf '%s\n' "$FAILED_LINES"
elif [ "$PASS_COUNT" != "$EXPECTED_PASS_COUNT" ]; then
  note_fail "preflight emitted $PASS_COUNT passing checks, expected exactly $EXPECTED_PASS_COUNT (a check was added or silently stopped being emitted)"
else
  note_ok "preflight passes cleanly against the fully migrated chain, case D converged, capability authorization applied and ledger repaired (exactly $PASS_COUNT checks)"
fi

# --- 3) Each deliberate break must be CAUGHT ----------------------------------
# Applied and rolled back one at a time so the breaks stay independent.
assert_break() {
  local label="$1" break_sql="$2" expect="$3"
  local out
  out="$(as "$PGBIN/psql" -h "$SOCK" -U postgres -q -d pre -v ON_ERROR_STOP=1 <<SQL 2>&1
begin;
$break_sql
\\i $PREFLIGHT
rollback;
SQL
)"
  if printf '%s\n' "$out" | grep -q "^FAIL:.*${expect}"; then
    note_ok "preflight catches: $label"
  else
    note_fail "preflight did NOT catch: $label (expected a FAIL matching '${expect}')"
  fi
}

assert_break "a bucket flipped public" \
  "update storage.buckets set public = true where id = 'customer-documents';" \
  "bucket is PRIVATE"

assert_break "the bucket's MIME allow-list widened" \
  "update storage.buckets set allowed_mime_types = allowed_mime_types || array['application/x-msdownload'] where id = 'customer-documents';" \
  "restricts MIME types"

assert_break "the bucket's size cap removed" \
  "update storage.buckets set file_size_limit = null where id = 'customer-documents';" \
  "caps objects at 25 MiB"

assert_break "a service-role-only function granted to authenticated" \
  "grant execute on function public.authorize_customer_document_download(uuid, uuid) to authenticated;" \
  "SERVICE-ROLE ONLY: authorize_customer_document_download.*NOT executable by authenticated"

assert_break "the service-role archive RPC granted to authenticated" \
  "grant execute on function public.archive_customer_document_as(uuid, uuid) to authenticated;" \
  "SERVICE-ROLE ONLY: archive_customer_document_as.*NOT executable by authenticated"

assert_break "a customer RPC exposed to anon" \
  "grant execute on function public.list_customer_invoices(uuid) to anon;" \
  "list_customer_invoices.*NOT executable by anon"

assert_break "a customer table granted to anon" \
  "grant select on public.customer_documents to anon;" \
  "anon holds NO table privilege on public.customer_documents"

assert_break "RLS switched off on a customer table" \
  "alter table public.customer_projects disable row level security;" \
  "RLS is enabled on public.customer_projects"

assert_break "a customer-reachable policy added to a customer table" \
  "create policy leak on public.customer_documents for select to authenticated using (true);" \
  "customer_documents has NO policy reachable without is_platform_admin"

assert_break "a storage policy opened to customers" \
  "create policy leak_obj on storage.objects for select to authenticated using (bucket_id = 'customer-documents');" \
  "no storage.objects policy grants a customer access"

assert_break "a SECURITY DEFINER function losing its pinned search_path" \
  "alter function public.list_customer_projects() reset search_path;" \
  "list_customer_projects.*pins search_path"

assert_break "an RPC signature drifting" \
  "drop function public.list_customer_documents(uuid);" \
  "RPC public.list_customer_documents(p_project_id uuid) exists"

assert_break "a composite tenant-integrity FK dropped" \
  "alter table public.customer_documents drop constraint customer_documents_project_fk;" \
  "composite tenant-integrity FKs are present"

assert_break "the published-document delete guard removed" \
  "drop trigger customer_documents_no_hard_delete_if_published on public.customer_documents;" \
  "hard-delete guard trigger is installed"

# --- Case D falsifications -----------------------------------------------
assert_break "case-d table execution_days granted to anon" \
  "grant select on public.execution_days to anon;" \
  "anon holds NO table privilege on public.execution_days"

assert_break "case-d table execution_templates granted to anon" \
  "grant select on public.execution_templates to anon;" \
  "anon holds NO table privilege on public.execution_templates"

assert_break "RLS switched off on execution_templates" \
  "alter table public.execution_templates disable row level security;" \
  "RLS is enabled on public.execution_templates"

assert_break "a customer-reachable policy added to execution_tasks" \
  "create policy leak on public.execution_tasks for select to authenticated using (true);" \
  "execution_tasks has NO policy reachable without is_platform_admin"

assert_break "recalc_execution_day_stats loses its pinned search_path" \
  "alter function public.recalc_execution_day_stats(uuid) reset search_path;" \
  "recalc_execution_day_stats.*pins search_path"

assert_break "the execution_tasks recalc trigger removed" \
  "drop trigger trg_execution_tasks_recalc on public.execution_tasks;" \
  "trg_execution_tasks_recalc is installed"

assert_break "a legacy migration missing from the ledger" \
  "delete from supabase_migrations.schema_migrations where version = '20260607194622';" \
  "ledger names legacy migration 20260607194622 as applied"

assert_break "the convergence migration missing from the ledger" \
  "delete from supabase_migrations.schema_migrations where version = '20260731122000';" \
  "ledger names the convergence migration 20260731122000 as applied"

assert_break "a future-dated shadow version in the ledger" \
  "insert into supabase_migrations.schema_migrations (version, name) values ('99999999999999', 'shadow');" \
  "no version dated after the newest repository migration"

assert_break "a generated-shadow version in the ledger (Class A pattern, no repository file)" \
  "insert into supabase_migrations.schema_migrations (version, name) values ('20260730183911', 'shadow');" \
  "no generated-shadow or otherwise unrecognized version"

# --- Capability authorization falsifications (20260804120000) ----------------
# Each of these breaks a representative object of the reusable authorization layer and
# proves the preflight refuses the database afterwards. Without them, adding checks and
# raising EXPECTED_PASS_COUNT would prove nothing at all.

# Structure -------------------------------------------------------------------
assert_break "an authorization table missing entirely" \
  "drop table public.client_invitation_roles cascade;" \
  "required table public.client_invitation_roles exists"

assert_break "RLS switched off on public.capabilities" \
  "alter table public.capabilities disable row level security;" \
  "RLS is enabled on public.capabilities"

assert_break "RLS switched off on public.organization_member_roles" \
  "alter table public.organization_member_roles disable row level security;" \
  "RLS is enabled on public.organization_member_roles"

assert_break "the composite member foreign key dropped (cross-tenant assignment becomes possible)" \
  "alter table public.organization_member_roles drop constraint organization_member_roles_member_fk;" \
  "COMPOSITE foreign key organization_member_roles_member_fk"

assert_break "the composite invitation foreign key dropped" \
  "alter table public.client_invitation_roles drop constraint client_invitation_roles_invitation_fk;" \
  "COMPOSITE foreign key client_invitation_roles_invitation_fk"

assert_break "the composite key the assignment FKs depend on dropped" \
  "alter table public.organization_members drop constraint organization_members_id_organization_id_key cascade;" \
  "unique constraint organization_members_id_organization_id_key exists"

assert_break "the invitation role uniqueness constraint dropped" \
  "alter table public.client_invitation_roles drop constraint client_invitation_roles_unique;" \
  "unique constraint client_invitation_roles_unique exists"

assert_break "the namespaced capability-key format check dropped" \
  "alter table public.capabilities drop constraint capabilities_key_format;" \
  "check constraint capabilities_key_format exists"

assert_break "a required authorization index dropped" \
  "drop index public.organization_member_roles_member_idx;" \
  "index public.organization_member_roles_member_idx exists"

assert_break "the invitation-roles admin policy dropped" \
  "drop policy client_invitation_roles_platform_admin_all on public.client_invitation_roles;" \
  "RLS policy client_invitation_roles_platform_admin_all exists"

assert_break "a self-service write policy added to organization_member_roles" \
  "create policy leak_assign on public.organization_member_roles for update to authenticated using (true) with check (true);" \
  "organization_member_roles has NO write policy reachable without is_platform_admin"

# Grants ----------------------------------------------------------------------
assert_break "membership_effective_capability_keys granted to authenticated (membership-id probe)" \
  "grant execute on function public.membership_effective_capability_keys(uuid) to authenticated;" \
  "membership_effective_capability_keys.*NOT executable by authenticated"

assert_break "current_user_portal_context revoked from authenticated (portal cannot boot)" \
  "revoke execute on function public.current_user_portal_context() from authenticated;" \
  "current_user_portal_context() IS executable by authenticated"

assert_break "an authorization RPC exposed to anon" \
  "grant execute on function public.current_user_portal_context() to anon;" \
  "current_user_portal_context.*NOT executable by anon"

assert_break "an authorization table exposed to anon" \
  "grant select on public.organization_member_roles to anon;" \
  "anon holds NO table privilege on public.organization_member_roles"

assert_break "the capability catalog exposed to anon" \
  "grant select on public.capabilities to anon;" \
  "anon holds NO table privilege on public.capabilities"

assert_break "a browser write path opened on an authorization table" \
  "grant insert on public.organization_member_roles to authenticated;" \
  "authenticated holds NO INSERT/UPDATE/DELETE on public.organization_member_roles"

assert_break "internal invitation-role CRM data exposed to authenticated" \
  "grant select on public.client_invitation_roles to authenticated;" \
  "authenticated holds NO privilege at all on public.client_invitation_roles"

assert_break "authenticated losing SELECT on the capability catalog" \
  "revoke select on public.capabilities from authenticated;" \
  "authenticated holds SELECT on public.capabilities"

assert_break "an authorization helper exposed to anon" \
  "grant execute on function public.portal_baseline_capability_keys() to anon;" \
  "helper portal_baseline_capability_keys.*NOT executable by anon"

# Function identity ------------------------------------------------------------
assert_break "an authorization RPC signature drifting" \
  "drop function public.set_client_invitation_roles(uuid, uuid[]);" \
  "RPC public.set_client_invitation_roles"

assert_break "a capability RPC losing its pinned search_path" \
  "alter function public.current_user_portal_context() reset search_path;" \
  "current_user_portal_context.*pins search_path"

# The claim function keeps its exact signature here — only the additive role-transfer step
# is lost. That is the drift that looks like a working login and silently strands every
# invited user on the baseline, so it must be detected by content, not by signature.
assert_break "claim_my_client_invitations drifting back to a version without the role transfer" \
  "create or replace function public.claim_my_client_invitations() returns table (organization_id uuid, membership_id uuid) language plpgsql security definer set search_path = public, auth, pg_temp as 'begin return; end';" \
  "transfers the invitation"

# Catalog content ---------------------------------------------------------------
assert_break "a capability missing from the catalog" \
  "delete from public.capabilities where key = 'svh.finance.manage';" \
  "capability svh.finance.manage exists"

assert_break "a baseline portal capability missing from the catalog" \
  "delete from public.capabilities where key = 'portal.billing.view';" \
  "capability portal.billing.view exists"

assert_break "a capability bound to the wrong solution (product gate removed)" \
  "update public.capabilities set solution_catalog_key = null where key = 'svh.devices.manage';" \
  "capability svh.devices.manage exists, is active and is bound to sports_club_operations"

assert_break "a general-portal capability wrongly bound to a solution (existing customers lose access)" \
  "update public.capabilities set solution_catalog_key = 'sports_club_operations' where key = 'portal.projects.view';" \
  "capability portal.projects.view exists, is active and is bound to the general portal"

assert_break "a capability deactivated in the catalog" \
  "update public.capabilities set is_active = false where key = 'svh.members.manage';" \
  "capability svh.members.manage exists"

assert_break "an unrecognized capability key appearing in the catalog" \
  "insert into public.capabilities (key, label) values ('rogue.capability.view', 'Rogue');" \
  "no unrecognized capability key"

assert_break "the backward-compatibility baseline changing" \
  "create or replace function public.portal_baseline_capability_keys() returns text[] language sql immutable set search_path = public as 'select array[''portal.overview.view'']::text[];';" \
  "returns exactly the six general-portal capabilities"

# Live data ---------------------------------------------------------------------
assert_break "a cross-organization invitation role assignment present in the data" \
  "insert into public.organizations (id, name, slug, status) values
     ('aaaaaaaa-0000-4000-8000-000000000001', 'Falsify A', 'falsify-a', 'active'),
     ('bbbbbbbb-0000-4000-8000-000000000002', 'Falsify B', 'falsify-b', 'active');
   insert into public.organization_roles (id, organization_id, role_key, label)
     values ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', 'kassenwart', 'Kassenwart');
   insert into public.client_invitations (id, organization_id, email)
     values ('dddddddd-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001', 'falsify@example.test');
   alter table public.client_invitation_roles drop constraint client_invitation_roles_role_fk;
   insert into public.client_invitation_roles (organization_id, client_invitation_id, organization_role_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000003');" \
  "no invitation role assignment crosses organizations"

assert_break "a duplicate functional role key inside one organization" \
  "alter table public.organization_roles drop constraint organization_roles_org_key_unique;
   insert into public.organizations (id, name, slug, status)
     values ('aaaaaaaa-0000-4000-8000-000000000011', 'Falsify C', 'falsify-c', 'active');
   insert into public.organization_roles (organization_id, role_key, label) values
     ('aaaaaaaa-0000-4000-8000-000000000011', 'kassenwart', 'Kassenwart'),
     ('aaaaaaaa-0000-4000-8000-000000000011', 'kassenwart', 'Kassenwart (Duplikat)');" \
  "no duplicate functional role key exists inside one organization"

# Migration ledger ---------------------------------------------------------------
assert_break "the capability authorization migration missing from the ledger" \
  "delete from supabase_migrations.schema_migrations where version = '20260804120000';" \
  "ledger names the capability authorization migration 20260804120000 as applied"

# The exact defect this project has already suffered once: the CLI generating a fresh
# timestamp instead of applying the repository's own version.
assert_break "a generated replacement timestamp for the capability authorization migration" \
  "insert into supabase_migrations.schema_migrations (version, name) values ('20260806094512', 'reusable_capability_authorization');" \
  "NO generated replacement timestamp"

echo
if [ "$FAILURES" = "0" ]; then
  echo "staging preflight self-test: ALL PASSED"
else
  echo "staging preflight self-test: $FAILURES FAILED"
  exit 1
fi
