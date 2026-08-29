#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster and prove that
# 20260902120000_receptionist_leads_pii_rls.sql closes the anonymous exposure of
# public.cogniiq_receptionist_leads without breaking the internal owner surface or
# trusted service-role ingestion.
#
# Executable rather than source-parsing on purpose. The defect is an ACCESS
# CONTROL defect spread across three independent mechanisms -- RLS, table grants
# and sequence grants -- and two of them (TRUNCATE, and the identity sequence) are
# invisible to any policy-level review: a source-text check that saw
# `enable row level security` plus a policy would call this table safe while anon
# could still empty it. Only executing each operation as each role proves the
# boundary.
#
# Never touches Supabase. Never opens a network listener.
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
  # Real phase-0 tenancy chain: profiles, is_platform_owner(), is_platform_admin(), RLS roles.
  PSQL -d "$db_name" -q -f "$MIG/20260710120000_phase0_auth_tenancy_rls.sql" >/dev/null
  PSQL -d "$db_name" -q -f "$MIG/20260710133000_phase0_security_hardening.sql" >/dev/null
  # Real Supabase service_role always carries BYPASSRLS; the shared bootstrap
  # creates the role without it. Without this the "trusted ingestion still works"
  # assertion would pass for the wrong reason.
  PSQL -d "$db_name" -c "alter role service_role bypassrls;" >/dev/null
  # The table exactly as it ships today, with no security of any kind.
  PSQL -d "$db_name" -q -f "$MIG/20260730031350_create_cogniiq_receptionist_leads.sql" >/dev/null
}

bootstrap leads_rls
PSQL -d leads_rls -f "$SQLDIR/receptionist-leads-rls-tests.sql"

echo "receptionist-leads RLS SQL tests: ALL PASSED"
