#!/usr/bin/env bash
# =============================================================================
# Self-test for the guarded staging seeder
# =============================================================================
# Two halves:
#
#   A. GUARDS. The seeder must refuse — without touching any database — when the
#      opt-in flag is missing, when the project reference is missing or
#      malformed, when DATABASE_URL disagrees with it, and when CI is set. Each
#      case is run with a DATABASE_URL that points at a port where nothing is
#      listening, so a guard that failed to fire would produce a connection
#      error rather than a silent pass.
#
#   B. SEED + CLEANUP. Against a THROWAWAY local cluster carrying the real
#      migration chain, the fixture SQL must apply, produce the intended tenancy
#      (active/suspended/cross-organization), refuse to apply twice, and be
#      removed completely by the cleanup script.
#
# Never touches Supabase.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"
SQLDIR="$ROOT/.github/scripts/sql"
SEEDER="$ROOT/scripts/staging/seed-staging-fixtures.sh"
SEED_SQL="$ROOT/scripts/staging/seed-staging-fixtures.sql"
CLEAN_SQL="$ROOT/scripts/staging/cleanup-staging-fixtures.sql"

FAILURES=0
note_ok()   { echo "ok: $1"; }
note_fail() { echo "FAIL: $1"; FAILURES=$((FAILURES + 1)); }

# ---------------------------------------------------------------- A) guards
# A URL that cannot connect: if a guard does NOT fire, psql fails loudly instead
# of quietly succeeding, so a missing guard can never look like a pass.
DEAD_URL='postgresql://postgres:x@127.0.0.1:1/postgres'
GOOD_REF='abcdefghijklmnop'

expect_refusal() {
  local label="$1"; shift
  local out status
  set +e
  out="$(env -u CI -u GITHUB_ACTIONS -u GITLAB_CI -u BUILDKITE -u JENKINS_URL -u TF_BUILD \
        "$@" bash "$SEEDER" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && printf '%s' "$out" | grep -q 'REFUSING TO SEED'; then
    note_ok "seeder refuses: $label"
  else
    note_fail "seeder did NOT refuse: $label (exit $status)"
    printf '%s\n' "$out" | head -5
  fi
}

expect_refusal "no ALLOW_STAGING_SEED" \
  STAGING_PROJECT_REF="$GOOD_REF" DATABASE_URL="$DEAD_URL"
expect_refusal "ALLOW_STAGING_SEED set to something other than true" \
  ALLOW_STAGING_SEED=yes STAGING_PROJECT_REF="$GOOD_REF" DATABASE_URL="$DEAD_URL"
expect_refusal "no STAGING_PROJECT_REF" \
  ALLOW_STAGING_SEED=true DATABASE_URL="$DEAD_URL"
expect_refusal "a malformed STAGING_PROJECT_REF" \
  ALLOW_STAGING_SEED=true STAGING_PROJECT_REF=production DATABASE_URL="$DEAD_URL"
expect_refusal "no DATABASE_URL" \
  ALLOW_STAGING_SEED=true STAGING_PROJECT_REF="$GOOD_REF"
expect_refusal "a DATABASE_URL for a DIFFERENT project than declared" \
  ALLOW_STAGING_SEED=true STAGING_PROJECT_REF="$GOOD_REF" \
  DATABASE_URL='postgresql://postgres:x@db.zzzzzzzzzzzzzzzz.supabase.co:5432/postgres'

# --- the CI interlock, one variable at a time --------------------------------
# The list is read out of the seeder itself rather than duplicated here, so a
# variable added to the guard is automatically covered and the test cannot
# silently drift away from the thing it is testing.
CI_VARS="$(sed -n 's/^for var in \(.*\); do$/\1/p' "$SEEDER" | head -1)"
if [ -z "$CI_VARS" ]; then
  note_fail "the CI-variable list could not be read out of the seeder"
else
  note_ok "the CI-variable list is read from the seeder itself ($CI_VARS)"
fi

# Every supported CI variable must be UNSET before exactly one is set again.
# This test runs ON a CI runner, which already exports CI=true (and
# GITHUB_ACTIONS=true). The seeder refuses on the FIRST variable it finds set,
# and correctly names that one — so without this isolation, asking it about
# GITHUB_ACTIONS gets an answer about CI and the assertion fails even though the
# guard behaved perfectly. The guard is right; the test has to ask cleanly.
CI_UNSET_ARGS=()
for var in $CI_VARS; do CI_UNSET_ARGS+=(-u "$var"); done

SATISFIED_ENV=(
  ALLOW_STAGING_SEED=true
  STAGING_PROJECT_REF="$GOOD_REF"
  DATABASE_URL="postgresql://postgres:x@db.$GOOD_REF.supabase.co:5432/postgres"
  # Client-side only, so the seeder itself is untouched: the host above does not
  # exist, and this keeps a slow DNS or connect attempt from stalling the test.
  PGCONNECT_TIMEOUT=5
)

for ci_var in $CI_VARS; do
  set +e
  out="$(env "${CI_UNSET_ARGS[@]}" "$ci_var=true" "${SATISFIED_ENV[@]}" bash "$SEEDER" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && printf '%s' "$out" | grep -q "the environment variable $ci_var is set"; then
    note_ok "seeder refuses to run when $ci_var is set, even with every other interlock satisfied"
  else
    note_fail "seeder ran (or failed differently) with only $ci_var set (exit $status)"
    printf '%s\n' "$out" | head -5
  fi
done

# Falsification: with NO CI variable set the seeder must get PAST the CI
# interlock. Without this, the loop above would still pass against a seeder that
# simply refused everything unconditionally.
set +e
out="$(env "${CI_UNSET_ARGS[@]}" "${SATISFIED_ENV[@]}" bash "$SEEDER" 2>&1)"
status=$?
set -e
if printf '%s' "$out" | grep -q 'This seeder never runs automatically in CI'; then
  note_fail "with no CI variable set, the seeder still refused on the CI interlock"
else
  note_ok "with no CI variable set, the seeder gets past the CI interlock (the loop above is meaningful)"
fi
# It must still refuse — the host in SATISFIED_ENV does not resolve — just for a
# different, later reason. Reaching this point without a refusal would mean the
# seeder had tried to write somewhere.
if [ "$status" -eq 2 ] && printf '%s' "$out" | grep -q 'REFUSING TO SEED'; then
  note_ok "with no CI variable set, an unreachable target is still refused (later interlock)"
else
  note_fail "an unreachable target was not refused with exit 2 (exit $status)"
  printf '%s\n' "$out" | head -5
fi

# The repository must not carry a credential for any of this.
if grep -REqi "postgres://[^ '\"]*:[^ '\"@]{6,}@|service_role_key *=|sb_secret_" "$ROOT/scripts/staging"; then
  note_fail "a credential-shaped string is present in scripts/staging"
else
  note_ok "scripts/staging contains no credential-shaped string"
fi

# ------------------------------------------------------- B) seed + cleanup
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "postgres server binaries not found (set PGBIN)"; exit 1; }

RUNUSER=""
if [ "$(id -u)" = "0" ]; then
  RUNUSER="${PGTEST_USER:-pgtest}"
  id "$RUNUSER" >/dev/null 2>&1 || useradd -m "$RUNUSER"
fi
WORKBASE="${PGTEST_HOME:-$( [ -n "$RUNUSER" ] && echo "/home/$RUNUSER/seedtest.$$" || echo "$(mktemp -d)" )}"
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
Q() { as "$PGBIN/psql" -h "$SOCK" -U postgres -t -A -d seed -c "$1"; }

PSQL -c "create database seed;" >/dev/null
PSQL -d seed -c "alter database seed set client_min_messages = warning;" >/dev/null
PSQL -d seed -q -f "$SQLDIR/customer-platform-bootstrap.sql" >/dev/null
for f in 20260710120000_phase0_auth_tenancy_rls 20260710133000_phase0_security_hardening \
         20260721120000_product_aware_client_platform 20260722120000_owner_finance_cockpit \
         20260723120000_owner_document_settings 20260723121000_owner_offers \
         20260723122000_owner_commercial_documents 20260723123000_owner_premium_offer_editor \
         20260723124000_owner_premium_offer_runtime_hotfix 20260723125000_owner_signature_proposal_experience \
         20260723126000_owner_automation_worker 20260723127000_owner_signed_certificate_workflow \
         20260723128000_owner_offer_email_workflow 20260724120000_owner_customer_task_management \
         20260728120000_customer_project_core 20260728121000_customer_documents \
         20260728122000_customer_billing_link 20260728123000_owner_invoice_organization_assignment \
         20260728124000_customer_document_archive_service_role; do
  PSQL -d seed -q -f "$MIG/$f.sql" >/dev/null
done

if PSQL -d seed -q -f "$SEED_SQL" >/dev/null 2>&1; then
  note_ok "fixture SQL applies against the real migration chain"
else
  note_fail "fixture SQL failed to apply"
  PSQL -d seed -f "$SEED_SQL" 2>&1 | tail -10
fi

# Re-running must be refused, not silently doubled.
if PSQL -d seed -q -f "$SEED_SQL" >/dev/null 2>&1; then
  note_fail "fixture SQL applied a SECOND time (fixtures must be refused, not duplicated)"
else
  note_ok "fixture SQL refuses to apply twice"
fi

# --- the fixtures actually produce the tenancy they promise -------------------
ACTIVE_A='ffffffff-1111-0000-0000-000000000001'
SUSPENDED_A='ffffffff-1111-0000-0000-000000000002'
ACTIVE_B='ffffffff-1111-0000-0000-000000000003'
INTERNAL='ffffffff-1111-0000-0000-000000000004'

check_count() {
  local label="$1" uid="$2" query="$3" expected="$4" actual
  actual="$(Q "select public.test_become('$uid'); $query" | tail -1)"
  if [ "$actual" = "$expected" ]; then
    note_ok "$label (got $actual)"
  else
    note_fail "$label (expected $expected, got $actual)"
  fi
}

check_count "active member of A sees exactly 1 project"      "$ACTIVE_A"    "select count(*) from public.list_customer_projects();" 1
check_count "active member of A sees exactly 1 document"     "$ACTIVE_A"    "select count(*) from public.list_customer_documents(null);" 1
check_count "active member of A sees exactly 2 invoices"     "$ACTIVE_A"    "select count(*) from public.list_customer_invoices(null);" 2
check_count "active member of A sees 3 milestones"           "$ACTIVE_A"    "select count(*) from public.list_customer_project_milestones('ffffffff-2222-0000-0000-000000000001');" 3
check_count "SUSPENDED member of A sees no project"          "$SUSPENDED_A" "select count(*) from public.list_customer_projects();" 0
check_count "SUSPENDED member of A sees no document"         "$SUSPENDED_A" "select count(*) from public.list_customer_documents(null);" 0
check_count "SUSPENDED member of A sees no invoice"          "$SUSPENDED_A" "select count(*) from public.list_customer_invoices(null);" 0
check_count "member of B cannot read A's project by id"      "$ACTIVE_B"    "select count(*) from public.get_customer_project('ffffffff-2222-0000-0000-000000000001');" 0
check_count "member of B cannot read A's milestones"         "$ACTIVE_B"    "select count(*) from public.list_customer_project_milestones('ffffffff-2222-0000-0000-000000000001');" 0
check_count "member of B sees only its own invoice"          "$ACTIVE_B"    "select count(*) from public.list_customer_invoices(null);" 1
check_count "the unassigned-organization invoice reaches nobody" "$ACTIVE_A" \
  "select count(*) from public.list_customer_invoices(null) where invoice_number = 'ZZ-FIXTURE-UNASSIGNED-0001';" 0

# Download authorization, through the service-role entry point the Edge Function uses.
check_count "the published fixture document authorizes a download for A" "$INTERNAL" \
  "select count(*) from public.authorize_customer_document_download('$ACTIVE_A', 'ffffffff-4444-0000-0000-000000000001');" 1
check_count "the UNPUBLISHED fixture document is refused" "$INTERNAL" \
  "select count(*) from public.authorize_customer_document_download('$ACTIVE_A', 'ffffffff-4444-0000-0000-000000000002');" 0
check_count "the ARCHIVED fixture document is refused" "$INTERNAL" \
  "select count(*) from public.authorize_customer_document_download('$ACTIVE_A', 'ffffffff-4444-0000-0000-000000000003');" 0
check_count "organization B's document is refused for A" "$INTERNAL" \
  "select count(*) from public.authorize_customer_document_download('$ACTIVE_A', 'ffffffff-4444-0000-0000-00000000000b');" 0
check_count "the suspended member is refused the published document" "$INTERNAL" \
  "select count(*) from public.authorize_customer_document_download('$SUSPENDED_A', 'ffffffff-4444-0000-0000-000000000001');" 0

# --- cleanup must remove EVERYTHING ------------------------------------------
if PSQL -d seed -q -f "$CLEAN_SQL" >/dev/null 2>&1; then
  note_ok "cleanup SQL runs"
else
  note_fail "cleanup SQL failed"
  PSQL -d seed -f "$CLEAN_SQL" 2>&1 | tail -10
fi

for pair in "public.organizations:2" "public.customer_projects:2" "public.customer_project_milestones:3" \
            "public.customer_documents:4" "public.owner_invoices:4" "public.profiles:4"; do
  table="${pair%%:*}"
  left="$(Q "select count(*) from $table where id::text like 'ffffffff-%';" | tail -1)"
  if [ "$left" = "0" ]; then
    note_ok "cleanup removed every fixture row from $table"
  else
    note_fail "cleanup left $left fixture row(s) in $table"
  fi
done

# Cleanup must be safe to repeat.
if PSQL -d seed -q -f "$CLEAN_SQL" >/dev/null 2>&1; then
  note_ok "cleanup SQL is safe to run again when nothing is left"
else
  note_fail "cleanup SQL failed on a second run"
fi

# And the seed must work again afterwards — proving cleanup is complete.
if PSQL -d seed -q -f "$SEED_SQL" >/dev/null 2>&1; then
  note_ok "fixtures can be re-seeded after cleanup (cleanup is complete)"
else
  note_fail "re-seeding after cleanup failed — cleanup left conflicting state"
fi
PSQL -d seed -q -f "$CLEAN_SQL" >/dev/null 2>&1 || true

echo
if [ "$FAILURES" = "0" ]; then
  echo "staging seed self-test: ALL PASSED"
else
  echo "staging seed self-test: $FAILURES FAILED"
  exit 1
fi
