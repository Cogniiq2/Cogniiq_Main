#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the full owner-finance migration chain plus
# 20260903120000_owner_workspace_organization.sql, then EXECUTE the folder/trash/delete surface
# against it. Tears the cluster down afterwards. Never touches Supabase, never opens a listener.
#
# Executable rather than source-parsing on purpose. The claims this migration makes are claims
# about what the DATABASE refuses: that a reviewed-but-unencumbered expense CAN now be deleted,
# that an issued invoice CANNOT, that its number is never released, that a folder deletion never
# reaches a record, and that trash state changes no accounting figure. None of that is provable
# by reading SQL — only by running it.
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

MIGRATIONS=(
  20260710120000_phase0_auth_tenancy_rls
  20260710133000_phase0_security_hardening
  20260711120000_receptionist_persistence
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
  20260724120000_owner_customer_task_management
  20260728120000_customer_project_core
  20260728121000_customer_documents
  20260728122000_customer_billing_link
  20260728123000_owner_invoice_organization_assignment
  20260728124000_customer_document_archive_service_role
  20260730031350_create_cogniiq_receptionist_leads
  20260730120000_customer_project_organization_scope
  20260730130000_pankofer_organization_reconciliation
  20260731120000_customer_document_publish_guard
  20260731121000_client_provisioning_identity
  20260824171403_canonical_customer_and_deletion
  20260825064048_offer_recurring_pricing
  20260826120000_owner_historical_paid_invoice
  20260828120000_owner_finance_multipay_recurring_bulk
  20260829120000_owner_finance_advance_payments
  20260830123000_owner_invoice_immutable_snapshot
  20260831120000_owner_invoice_integrity_guard
  20260901120000_owner_invoice_preflight_array_fix
  20260903120000_owner_workspace_organization
)

prepare_db() {
  local db="$1"
  PSQL -c "create database $db;" >/dev/null
  PSQL -d "$db" -q -f "$ROOT/supabase/tests/lib_bootstrap.sql" >/dev/null
  PSQL -d "$db" -q -c "create schema if not exists extensions; alter extension pgcrypto set schema extensions;" >/dev/null
  PSQL -d "$db" -q <<'SQL' >/dev/null
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[], created_at timestamptz not null default now());
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id) on delete cascade,
  name text not null, owner uuid, metadata jsonb, created_at timestamptz not null default now());
alter table storage.objects enable row level security;
SQL
  local f
  for f in "${MIGRATIONS[@]}"; do
    PSQL -d "$db" -q -f "$MIG/$f.sql" >/dev/null
  done
}

prepare_db workspace
PSQL -d workspace -f "$SQLDIR/workspace-organization-tests.sql"

# The delete path calls delete_owner_draft_invoice, owner_cancel_invoice, owner_archive_offer and
# delete_owner_offer_draft. If this migration had weakened any of them, the suites that pin the
# invoice guard and the immutable snapshot would be the first to notice — so both are re-run
# against the patched schema, each in its own database because both wipe the finance tables.
prepare_db integrity
PSQL -d integrity -f "$SQLDIR/invoice-integrity-tests.sql" >/dev/null
echo "regression: the invoice-integrity suite still passes with workspace organization applied"

prepare_db snapshot
PSQL -d snapshot -f "$SQLDIR/finance-invoice-snapshot-tests.sql" >/dev/null
echo "regression: the invoice snapshot suite still passes with workspace organization applied"

# Convergence: the migration must be safely re-appliable and the tests must still pass.
PSQL -d workspace -q -f "$MIG/20260903120000_owner_workspace_organization.sql" >/dev/null
PSQL -d workspace -f "$SQLDIR/workspace-organization-tests.sql" >/dev/null
echo "migration convergence: 20260903120000 re-applied cleanly and the workspace tests still pass"
