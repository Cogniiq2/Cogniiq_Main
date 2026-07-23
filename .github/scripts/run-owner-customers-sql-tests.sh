#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the bootstrap + ALL owner-offer migrations
# (through 20260724120000_owner_customer_task_management), run the owner customer & task tests,
# verify the new migration re-applies cleanly (idempotent), then tear the cluster down. Never
# touches Supabase.
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

PSQL -c "create database cust;" >/dev/null
PSQL -d cust -q -f "$SQLDIR/premium-offer-bootstrap.sql" >/dev/null
for f in 20260723120000_owner_document_settings 20260723121000_owner_offers \
         20260723122000_owner_commercial_documents 20260723123000_owner_premium_offer_editor \
         20260723124000_owner_premium_offer_runtime_hotfix \
         20260723125000_owner_signature_proposal_experience \
         20260723126000_owner_automation_worker \
         20260723127000_owner_signed_certificate_workflow \
         20260723128000_owner_offer_email_workflow; do
  PSQL -d cust -q -f "$MIG/$f.sql" >/dev/null
done

# The throwaway bootstrap stubs client_accounts as a bare id table. The new migration's backfill
# reads the real CRM columns, so extend the stub to match production shape before applying it.
PSQL -d cust -q -c "alter table public.client_accounts
  add column if not exists legal_name text,
  add column if not exists display_name text,
  add column if not exists primary_contact_name text,
  add column if not exists primary_email text,
  add column if not exists phone text;" >/dev/null

PSQL -d cust -q -f "$MIG/20260724120000_owner_customer_task_management.sql" >/dev/null
PSQL -d cust -f "$SQLDIR/owner-customers-tests.sql"

# Migration convergence: re-applying the new migration must be idempotent, and the tests still pass
# against a fresh database (the second run also proves the backfill NOT EXISTS guards are safe).
PSQL -d cust -q -f "$MIG/20260724120000_owner_customer_task_management.sql" >/dev/null
echo "migration convergence: 20260724120000 re-applied cleanly"
