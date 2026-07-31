#!/usr/bin/env bash
# =============================================================================
# Self-test for scripts/staging/preflight.sql
# =============================================================================
# A preflight that cannot fail is worthless. This boots a THROWAWAY local
# PostgreSQL cluster, applies the real migration chain, and asserts the preflight:
#
#   1. passes cleanly against a correctly migrated database, and
#   2. FAILS, with the right check, against each of four deliberately broken
#      states — a public bucket, a service-role-only function granted to
#      authenticated, a customer table left readable by anon, and a missing
#      migration.
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
    ('20260731122000', 'case_d_legacy_convergence');
" >/dev/null

OUT="$(run_preflight)"
FAILED_LINES="$(printf '%s\n' "$OUT" | grep '^FAIL: ' || true)"
PASS_COUNT="$(printf '%s\n' "$OUT" | grep -c '^PASS: ' || true)"
if [ -z "$FAILED_LINES" ] && [ "$PASS_COUNT" -gt 60 ]; then
  note_ok "preflight passes cleanly against the fully migrated chain, case D converged, and ledger repaired ($PASS_COUNT checks)"
else
  note_fail "preflight reported failures against a correct database:"
  printf '%s\n' "$FAILED_LINES"
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

echo
if [ "$FAILURES" = "0" ]; then
  echo "staging preflight self-test: ALL PASSED"
else
  echo "staging preflight self-test: $FAILURES FAILED"
  exit 1
fi
