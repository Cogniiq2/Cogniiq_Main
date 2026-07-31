#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster and prove that
# 20260801120000_case_d_legacy_convergence.sql safely reconciles the five
# unreconciled legacy migrations (20260607194622, 20260607200426, 20260706121415,
# 20260706122833, 20260709120000) against hosted Supabase's ACTUAL verified state,
# on three starting states:
#   (a) a completely fresh migration chain (nothing pre-exists)
#   (b) hosted's exact current partial topology, reproduced structurally
#   (c) idempotent replay of the convergence migration itself (exercised inside
#       both suites below)
# Never touches Supabase. Never marks the five legacy migrations applied.
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
WORKBASE="${PGTEST_HOME:-$( [ -n "$RUNUSER" ] && echo "/home/$RUNUSER/pgwork.$$" || echo "$(mktemp -d)" )}"
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

bootstrap() {
  local db_name="$1"
  PSQL -c "create database \"$db_name\";" >/dev/null
  PSQL -d "$db_name" -c "alter database \"$db_name\" set client_min_messages = warning;" >/dev/null
  PSQL -d "$db_name" -q -f "$SQLDIR/customer-platform-bootstrap.sql" >/dev/null
  # Real phase-0 tenancy chain: profiles, is_platform_admin(), is_platform_owner(), RLS roles.
  PSQL -d "$db_name" -q -f "$MIG/20260710120000_phase0_auth_tenancy_rls.sql" >/dev/null
  PSQL -d "$db_name" -q -f "$MIG/20260710133000_phase0_security_hardening.sql" >/dev/null
  # Real Supabase service_role always carries BYPASSRLS; the shared bootstrap
  # creates the role without it, so set it explicitly (matches
  # supabase/tests/run_receptionist_convergence_smoke.sh's bootstrap).
  PSQL -d "$db_name" -c "alter role service_role bypassrls;" >/dev/null
}

echo "--- scenario (a): fresh migration chain"
bootstrap case_d_fresh
PSQL -d case_d_fresh -q -f "$MIG/20260801120000_case_d_legacy_convergence.sql"
echo "applied: 20260801120000_case_d_legacy_convergence (fresh chain)"
PSQL -d case_d_fresh -f "$SQLDIR/case-d-legacy-convergence-fresh-tests.sql"

echo "--- scenario (b): hosted's exact partial state, converged, then replayed idempotently"
bootstrap case_d_partial
PSQL -d case_d_partial -f "$SQLDIR/case-d-legacy-convergence-partial-tests.sql"

echo "case-d legacy convergence SQL tests: ALL PASSED"
