#!/usr/bin/env bash
# PR 70A -- boot a THROWAWAY local PostgreSQL cluster, apply the real migration
# chain plus 20260903120000_owner_crm_lead_foundation.sql, and EXECUTE the
# owner-CRM security and domain suite against it.
#
# Executable rather than source-parsing, and emphatically so here. The defect
# this migration exists to avoid is an ACCESS CONTROL defect: a browser role
# holding a direct INSERT/UPDATE/DELETE grant on a gated CRM table lets a
# hand-written PostgREST call set owner_lead_integration_checks.status =
# 'complete' without ever entering the RPC that validates it. A source-text
# review that saw `enable row level security` plus an owner policy would call
# those tables safe. Only issuing each statement as each role -- anon, an
# ordinary customer, a cogniiq_admin, and the real platform owner -- proves the
# boundary. The same reasoning applies to TRUNCATE, which no policy covers.
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

# The prerequisite chain the migration's fail-closed preamble names, and nothing
# beyond what it genuinely needs: phase-0 tenancy (profiles, is_platform_owner,
# set_updated_at), the client platform (client_accounts, referenced by
# owner_customers), the finance foundation (owner_business_entities,
# owner_audit_log, owner_finance_requests, owner_claim_idempotency, owner_offers,
# owner_invoices) and the canonical customer layer.
MIGRATIONS=(
  20260710120000_phase0_auth_tenancy_rls
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
  20260724120000_owner_customer_task_management
  20260903120000_owner_crm_lead_foundation
)

prepare_db() {
  local db="$1"
  PSQL -c "create database $db;" >/dev/null
  PSQL -d "$db" -c "alter database $db set client_min_messages = warning;" >/dev/null
  PSQL -d "$db" -q -f "$SQLDIR/customer-platform-bootstrap.sql" >/dev/null
  # Real Supabase service_role always carries BYPASSRLS; the shared bootstrap
  # creates it without. Without this, "service_role holds nothing" would pass for
  # the wrong reason.
  PSQL -d "$db" -c "alter role service_role bypassrls;" >/dev/null
  # Supabase's hosted default privileges hand anon/authenticated ALL on every new
  # table in `public`. A bare local cluster does not, so reproduce it here --
  # otherwise the grant-matrix assertions would pass without the migration's
  # REVOKE doing any work at all.
  PSQL -d "$db" -c "alter default privileges in schema public grant all on tables to anon, authenticated, service_role;" >/dev/null
  local f
  for f in "${MIGRATIONS[@]}"; do
    PSQL -d "$db" -q -f "$MIG/$f.sql" >/dev/null
  done
}

prepare_db crm
PSQL -d crm -f "$SQLDIR/owner-crm-lead-foundation-tests.sql"

# Replay safety: the migration must be re-appliable onto a populated schema
# without error and without changing any assertion's answer.
prepare_db crm_replay
PSQL -d crm_replay -f "$SQLDIR/owner-crm-lead-foundation-tests.sql" >/dev/null
PSQL -d crm_replay -q -f "$MIG/20260903120000_owner_crm_lead_foundation.sql" >/dev/null
PSQL -d crm_replay -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
do $$
declare t text; v_privs text; c bigint;
begin
  -- The replay must not have re-opened the grant matrix or lost any data.
  foreach t in array array['owner_leads','owner_lead_service_interests','owner_lead_follow_ups',
                           'owner_lead_activity','owner_lead_integration_checks'] loop
    select string_agg(privilege_type, ',' order by privilege_type) into v_privs
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = t and grantee = 'authenticated';
    if v_privs is distinct from 'SELECT' then
      raise exception 'REPLAY: authenticated holds "%" on public.% after a replay', coalesce(v_privs,'<none>'), t;
    end if;
  end loop;
  select count(*) into c from public.owner_leads;
  if c = 0 then raise exception 'REPLAY: the replay emptied public.owner_leads'; end if;
  -- The gate constraint survives a replay exactly once.
  select count(*) into c from pg_constraint
  where conrelid = 'public.owner_lead_integration_checks'::regclass
    and conname = 'owner_lead_integration_checks_complete_gate';
  if c <> 1 then raise exception 'REPLAY: the pre-offer gate constraint count is %', c; end if;
end;
$$;
SQL
echo "migration replay: 20260903120000 re-applied cleanly, grants and data unchanged"

echo "owner CRM lead foundation SQL tests: ALL PASSED"
