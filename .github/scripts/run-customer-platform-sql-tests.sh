#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the customer-platform bootstrap plus the
# REAL tenancy/CRM/finance migration chain, then the three new customer-platform migrations,
# run the customer-platform authorization tests, verify the new migrations re-apply
# DETERMINISTICALLY (they must FAIL loudly on a second apply — they are intentionally not
# written with IF NOT EXISTS guards), then tear the cluster down. Never touches Supabase.
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
# Prior migrations use drop-if-exists guards that emit a lot of harmless NOTICEs.
PSQL -d cust -c "alter database cust set client_min_messages = warning;" >/dev/null
PSQL -d cust -q -f "$SQLDIR/customer-platform-bootstrap.sql" >/dev/null

# Real dependency chain: tenancy -> hardening -> CRM -> finance -> offers -> documents -> owner customers.
for f in 20260710120000_phase0_auth_tenancy_rls \
         20260710133000_phase0_security_hardening \
         20260721120000_product_aware_client_platform \
         20260722120000_owner_finance_cockpit \
         20260723120000_owner_document_settings \
         20260723121000_owner_offers \
         20260723122000_owner_commercial_documents \
         20260723123000_owner_premium_offer_editor \
         20260723124000_owner_premium_offer_runtime_hotfix \
         20260723125000_owner_signature_proposal_experience \
         20260723126000_owner_automation_worker \
         20260723127000_owner_signed_certificate_workflow \
         20260723128000_owner_offer_email_workflow \
         20260724120000_owner_customer_task_management; do
  PSQL -d cust -q -f "$MIG/$f.sql" >/dev/null
done

# The new customer-platform migrations under test. Applied progressively so each
# implementation phase can run this suite against exactly the migrations it has shipped.
NEW_MIGRATIONS=()
for f in 20260728120000_customer_project_core \
         20260728121000_customer_documents \
         20260728122000_customer_billing_link \
         20260728123000_owner_invoice_organization_assignment \
         20260728124000_customer_document_archive_service_role \
         20260730120000_customer_project_organization_scope; do
  [ -f "$MIG/$f.sql" ] || continue
  PSQL -d cust -q -f "$MIG/$f.sql" >/dev/null
  NEW_MIGRATIONS+=("$f")
  echo "applied: $f"
done
[ ${#NEW_MIGRATIONS[@]} -gt 0 ] || { echo "no customer-platform migrations found"; exit 1; }

# pankofer-organization-reconciliation-tests runs LAST: it seeds the production
# duplicate-organization topology and then executes the real forward-only data
# migration (20260730130000) itself via \ir, so that migration is deliberately
# absent from the schema chain above — on a database without the duplicate it is
# designed to abort rather than guess.
for t in customer-projects-tests customer-documents-tests customer-billing-tests customer-invoice-organization-tests customer-project-organization-scope-tests \
         pankofer-organization-reconciliation-tests; do
  [ -f "$SQLDIR/$t.sql" ] || continue
  echo "--- $t"
  PSQL -d cust -f "$SQLDIR/$t.sql"
done

# Determinism check: these migrations are intentionally NOT idempotent. Re-applying one
# must FAIL (and roll back), proving it would surface schema drift loudly in production
# rather than silently no-opping.
for f in "${NEW_MIGRATIONS[@]}"; do
  # Migrations containing only `create or replace function`/grant/revoke statements
  # are legitimately re-appliable: there is no structural state to drift, replacing
  # a function with an identical body is deterministic by definition. Only
  # migrations with structural DDL (create table/type, alter table) are required
  # to fail loudly on a second apply.
  if ! grep -qiE '^\s*(create table|create type|alter table)' "$MIG/$f.sql"; then
    echo "skip: $f has no structural DDL (function-only migration; re-apply is expected to succeed)"
    continue
  fi
  if as "$PGBIN/psql" -h "$SOCK" -U postgres -v ON_ERROR_STOP=1 -d cust -q -f "$MIG/$f.sql" >/dev/null 2>&1; then
    echo "FAIL: $f re-applied silently; migrations must fail loudly on drift"; exit 1
  fi
  echo "ok: $f fails loudly when re-applied (deterministic, not silently idempotent)"
done

echo "customer platform SQL tests: ALL PASSED"
