#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the real tenancy + CRM migration
# chain plus the new provisioning-identity migration, run the duplicate-organization
# regression suite, then run the CONCURRENCY suite in genuinely parallel sessions,
# then tear the cluster down. Never touches Supabase.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"
SQLDIR="$ROOT/.github/scripts/sql"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "postgres server binaries not found (set PGBIN)"; exit 1; }

RUNUSER=""
if [ "$(id -u)" = "0" ]; then
  RUNUSER="${PGTEST_USER:-pgtest}"
  id "$RUNUSER" >/dev/null 2>&1 || useradd -m "$RUNUSER"
fi
WORKBASE="${PGTEST_HOME:-$( [ -n "$RUNUSER" ] && echo "/home/$RUNUSER/pgprov.$$" || echo "$(mktemp -d)" )}"
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

PSQL -c "create database prov;" >/dev/null
PSQL -d prov -c "alter database prov set client_min_messages = warning;" >/dev/null
PSQL -d prov -q -f "$SQLDIR/customer-platform-bootstrap.sql" >/dev/null

for f in 20260710120000_phase0_auth_tenancy_rls \
         20260710133000_phase0_security_hardening \
         20260721120000_product_aware_client_platform; do
  PSQL -d prov -q -f "$MIG/$f.sql" >/dev/null
done

# --- Baseline: prove the ORIGINAL defect is real before asserting it is fixed. ---
# Without this the regression suite could pass against a provisioning path that was
# never broken, and would prove nothing.
echo "--- baseline: the original defect reproduces on the pre-fix schema"
PSQL -d prov -f "$SQLDIR/client-provisioning-baseline-defect.sql"

PSQL -d prov -q -f "$MIG/20260731121000_client_provisioning_identity.sql" >/dev/null
echo "applied: 20260731121000_client_provisioning_identity"

echo "--- client-provisioning-identity-tests"
PSQL -d prov -f "$SQLDIR/client-provisioning-identity-tests.sql"

# ---------------------------------------------------------------------------
# CONCURRENCY: two genuinely parallel sessions, not two statements in one.
#
# Session A opens a transaction, provisions, and holds it open. Session B starts
# while A is still uncommitted and provisions the SAME customer with a DIFFERENT
# idempotency key. B must block on the identity advisory lock rather than racing
# past the candidate check, and once A commits, B must converge (same invitation
# email) or refuse (different invitation email) — never create a second organization.
# ---------------------------------------------------------------------------
concurrent_case() {
  local label="$1" email_a="$2" email_b="$3" expect="$4" company="$5"
  local out_a="$WORKBASE/a.$label.out" out_b="$WORKBASE/b.$label.out"

  # Session A: provision, hold the transaction open for 3s, commit.
  as "$PGBIN/psql" -h "$SOCK" -U postgres -d prov -X -q >"$out_a" 2>&1 <<SQL &
begin;
select set_config('app.uid', (select id::text from public.profiles where email = 'prov-admin@example.test'), false);
select public.provision_client_workspace_with_identity(
  gen_random_uuid(), '$company', null, 'A', null, null, null, null, null, null, 'lead',
  null, null, 'EUR', null, null, 'ai_receptionist', 'Projekt', 'active', null, null, null,
  null, 'Loesung $label', '$email_a', 'owner', null, null) is not null as a_ok;
select pg_sleep(3);
commit;
SQL
  local pid_a=$!

  # Give A time to take the advisory lock before B asks for it.
  sleep 1

  as "$PGBIN/psql" -h "$SOCK" -U postgres -d prov -X -q >"$out_b" 2>&1 <<SQL &
select set_config('app.uid', (select id::text from public.profiles where email = 'prov-admin@example.test'), false);
select public.provision_client_workspace_with_identity(
  gen_random_uuid(), '$company', null, 'A', null, null, null, null, null, null, 'lead',
  null, null, 'EUR', null, null, 'ai_receptionist', 'Projekt', 'active', null, null, null,
  null, 'Loesung $label', '$email_b', 'owner', null, null) as b_result;
SQL
  local pid_b=$!

  wait $pid_a; wait $pid_b || true

  if ! grep -q 'a_ok' "$out_a" || grep -qi 'error' "$out_a"; then
    echo "FAIL[$label]: session A did not provision cleanly"; cat "$out_a"; exit 1
  fi

  local orgs
  orgs=$(as "$PGBIN/psql" -h "$SOCK" -U postgres -d prov -X -A -t \
    -c "select count(*) from public.organizations where public.normalize_client_identity_name(name) = public.normalize_client_identity_name('$company');")

  case "$expect" in
    converge)
      if grep -q 'organization_identity_conflict' "$out_b"; then
        echo "FAIL[$label]: B refused a strong match instead of converging"; cat "$out_b"; exit 1
      fi
      if [ "$orgs" != "1" ]; then
        echo "FAIL[$label]: $orgs organizations exist after concurrent converge, expected 1"; exit 1
      fi
      echo "ok: concurrent same-customer requests with different idempotency keys converge on ONE organization"
      ;;
    conflict)
      if ! grep -q 'organization_identity_conflict' "$out_b"; then
        echo "FAIL[$label]: B did not raise organization_identity_conflict"; cat "$out_b"; exit 1
      fi
      if [ "$orgs" != "1" ]; then
        echo "FAIL[$label]: $orgs organizations exist after concurrent conflict, expected 1"; exit 1
      fi
      echo "ok: concurrent same-name requests with different invitation emails stop at ONE organization and demand a decision"
      ;;
  esac
}

echo "--- concurrency"
concurrent_case "same" "kontakt@nordwerk-technik.de" "kontakt@nordwerk-technik.de" converge "Nordwerk Technik GmbH"
concurrent_case "diff" "erst@sudhaus-labor.de"      "zweit@gmail.com"             conflict "Sudhaus Labor GmbH"

# Determinism: this migration creates indexes, so a second apply must collide.
if as "$PGBIN/psql" -h "$SOCK" -U postgres -v ON_ERROR_STOP=1 -d prov -q \
     -f "$MIG/20260731121000_client_provisioning_identity.sql" >/dev/null 2>&1; then
  echo "FAIL: the provisioning-identity migration re-applied silently"; exit 1
fi
echo "ok: 20260731121000 fails loudly when re-applied (deterministic, not silently idempotent)"

echo "provisioning identity SQL tests: ALL PASSED"
