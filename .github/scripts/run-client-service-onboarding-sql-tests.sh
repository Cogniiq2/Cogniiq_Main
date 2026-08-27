#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the bootstrap + the owner-offer/customer
# migrations that 20260830120000 genuinely depends on, then apply the two service-onboarding
# migrations IN ORDER, run the regression suite, prove both migrations re-apply cleanly
# (idempotent) and that re-seeding the template does not duplicate or mutate an existing
# engagement. Never touches Supabase.
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

PSQL -c "create database svc;" >/dev/null
PSQL -d svc -q -f "$SQLDIR/premium-offer-bootstrap.sql" >/dev/null
for f in 20260723120000_owner_document_settings 20260723121000_owner_offers \
         20260723122000_owner_commercial_documents 20260723123000_owner_premium_offer_editor \
         20260723124000_owner_premium_offer_runtime_hotfix \
         20260723125000_owner_signature_proposal_experience \
         20260723126000_owner_automation_worker \
         20260723127000_owner_signed_certificate_workflow \
         20260723128000_owner_offer_email_workflow; do
  PSQL -d svc -q -f "$MIG/$f.sql" >/dev/null
done

# The throwaway bootstrap stubs client_accounts as a bare id table; the customer migration's
# backfill reads the real CRM columns.
PSQL -d svc -q -c "alter table public.client_accounts
  add column if not exists legal_name text,
  add column if not exists display_name text,
  add column if not exists primary_contact_name text,
  add column if not exists primary_email text,
  add column if not exists phone text;" >/dev/null

PSQL -d svc -q -f "$MIG/20260724120000_owner_customer_task_management.sql" >/dev/null

# ---------------------------------------------------------------------------
# Dependency order is a real property, not a convention: the seed cannot run
# before the tables exist. Prove the failure before proving the success.
# ---------------------------------------------------------------------------
if PSQL -d svc -q -f "$MIG/20260830121000_ai_receptionist_template_v1.sql" >/dev/null 2>&1; then
  echo "FAIL: the template seed applied without its schema migration"
  exit 1
fi
echo "dependency order: 20260830121000 correctly refuses to apply before 20260830120000"

PSQL -d svc -q -f "$MIG/20260830120000_client_service_onboarding.sql" >/dev/null
PSQL -d svc -q -f "$MIG/20260830121000_ai_receptionist_template_v1.sql" >/dev/null

PSQL -d svc -f "$SQLDIR/client-service-onboarding-tests.sql"

# ---------------------------------------------------------------------------
# Convergence: both migrations must re-apply cleanly, and re-seeding the template
# must NOT touch an engagement that was already instantiated from it. That is the
# promise the whole snapshot design rests on.
# ---------------------------------------------------------------------------
BEFORE="$(PSQL -d svc -tAc "select md5(string_agg(code || status || coalesce(blocker_reason,''), '|' order by code)) from public.owner_engagement_tasks;")"
BEFORE_COUNT="$(PSQL -d svc -tAc "select count(*) from public.owner_service_engagements;")"

PSQL -d svc -q -f "$MIG/20260830120000_client_service_onboarding.sql" >/dev/null
PSQL -d svc -q -f "$MIG/20260830121000_ai_receptionist_template_v1.sql" >/dev/null

AFTER="$(PSQL -d svc -tAc "select md5(string_agg(code || status || coalesce(blocker_reason,''), '|' order by code)) from public.owner_engagement_tasks;")"
AFTER_COUNT="$(PSQL -d svc -tAc "select count(*) from public.owner_service_engagements;")"
DUP_TEMPLATES="$(PSQL -d svc -tAc "select count(*) from public.owner_service_templates where code = 'ai_receptionist_healthcare';")"
DUP_TASKS="$(PSQL -d svc -tAc "select count(*) from public.owner_service_template_tasks t join public.owner_service_templates x on x.id = t.template_id where x.code = 'ai_receptionist_healthcare' and x.version = 1;")"

[ "$BEFORE" = "$AFTER" ] || { echo "FAIL: re-seeding the template mutated an existing engagement"; exit 1; }
[ "$BEFORE_COUNT" = "$AFTER_COUNT" ] || { echo "FAIL: re-applying created extra engagements"; exit 1; }
[ "$DUP_TEMPLATES" = "1" ] || { echo "FAIL: the template was duplicated on re-seed ($DUP_TEMPLATES rows)"; exit 1; }

echo "migration convergence: both migrations re-applied cleanly"
echo "  engagements unchanged: $AFTER_COUNT | template rows: 1 | template tasks: $DUP_TASKS"
echo "  existing engagement snapshot unchanged by re-seeding the template"
