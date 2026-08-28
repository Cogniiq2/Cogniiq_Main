#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the bootstrap + the owner-offer/customer
# migrations that 20260830120000 genuinely depends on, then apply the three service-onboarding
# migrations IN ORDER, run the regression suite, prove all three re-apply cleanly (idempotent)
# and that re-seeding the template does not duplicate or mutate an existing engagement.
#
# A SECOND throwaway database reproduces the confirmed production failure: with only
# 20260830120000 + 20260830121000 applied, owner_add_customer_service raises 23503 on
# owner_audit_log_business_entity_id_fkey, and applying 20260830122000 makes the same call
# succeed. Never touches Supabase.
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

# The baseline every onboarding database starts from: the shared bootstrap plus the
# owner-offer / owner-customer migrations 20260830120000 genuinely depends on. Extracted into
# a function because the audit regression below needs a SECOND, independent database to reach
# the pre-fix state without disturbing this one.
provision() {
  local db="$1"
  PSQL -c "create database $db;" >/dev/null
  PSQL -d "$db" -q -f "$SQLDIR/premium-offer-bootstrap.sql" >/dev/null
  for f in 20260723120000_owner_document_settings 20260723121000_owner_offers \
           20260723122000_owner_commercial_documents 20260723123000_owner_premium_offer_editor \
           20260723124000_owner_premium_offer_runtime_hotfix \
           20260723125000_owner_signature_proposal_experience \
           20260723126000_owner_automation_worker \
           20260723127000_owner_signed_certificate_workflow \
           20260723128000_owner_offer_email_workflow; do
    PSQL -d "$db" -q -f "$MIG/$f.sql" >/dev/null
  done

  # The throwaway bootstrap stubs client_accounts as a bare id table; the customer migration's
  # backfill reads the real CRM columns.
  PSQL -d "$db" -q -c "alter table public.client_accounts
    add column if not exists legal_name text,
    add column if not exists display_name text,
    add column if not exists primary_contact_name text,
    add column if not exists primary_email text,
    add column if not exists phone text;" >/dev/null

  PSQL -d "$db" -q -f "$MIG/20260724120000_owner_customer_task_management.sql" >/dev/null
}

provision svc

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
PSQL -d svc -q -f "$MIG/20260830122000_service_onboarding_audit_fix.sql" >/dev/null

PSQL -d svc -f "$SQLDIR/client-service-onboarding-tests.sql"
PSQL -d svc -f "$SQLDIR/client-service-onboarding-audit-tests.sql"

# ---------------------------------------------------------------------------
# Convergence: all three migrations must re-apply cleanly, and re-seeding the
# template must NOT touch an engagement that was already instantiated from it.
# That is the promise the whole snapshot design rests on.
#
# The ORDER matters: 20260830120000 recreates the four onboarding audit triggers
# pointing at the generic factory, so 20260830122000 must always be the last of
# the three to run. The trigger check after this block makes that a proven
# property rather than a comment.
# ---------------------------------------------------------------------------
BEFORE="$(PSQL -d svc -tAc "select md5(string_agg(code || status || coalesce(blocker_reason,''), '|' order by code)) from public.owner_engagement_tasks;")"
BEFORE_COUNT="$(PSQL -d svc -tAc "select count(*) from public.owner_service_engagements;")"

PSQL -d svc -q -f "$MIG/20260830120000_client_service_onboarding.sql" >/dev/null
PSQL -d svc -q -f "$MIG/20260830121000_ai_receptionist_template_v1.sql" >/dev/null
PSQL -d svc -q -f "$MIG/20260830122000_service_onboarding_audit_fix.sql" >/dev/null

AFTER="$(PSQL -d svc -tAc "select md5(string_agg(code || status || coalesce(blocker_reason,''), '|' order by code)) from public.owner_engagement_tasks;")"
AFTER_COUNT="$(PSQL -d svc -tAc "select count(*) from public.owner_service_engagements;")"
DUP_TEMPLATES="$(PSQL -d svc -tAc "select count(*) from public.owner_service_templates where code = 'ai_receptionist_healthcare';")"
DUP_TASKS="$(PSQL -d svc -tAc "select count(*) from public.owner_service_template_tasks t join public.owner_service_templates x on x.id = t.template_id where x.code = 'ai_receptionist_healthcare' and x.version = 1;")"

[ "$BEFORE" = "$AFTER" ] || { echo "FAIL: re-seeding the template mutated an existing engagement"; exit 1; }
[ "$BEFORE_COUNT" = "$AFTER_COUNT" ] || { echo "FAIL: re-applying created extra engagements"; exit 1; }
[ "$DUP_TEMPLATES" = "1" ] || { echo "FAIL: the template was duplicated on re-seed ($DUP_TEMPLATES rows)"; exit 1; }

# After the full ordered chain, all four onboarding audit triggers must use the dedicated
# entity-resolving function -- and no finance trigger may have been repointed with them.
ONBOARDING_GENERIC="$(PSQL -d svc -tAc "select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_proc p on p.oid = t.tgfoid where not t.tgisinternal and t.tgname like '%_audit' and c.relname in ('owner_customer_services','owner_service_engagements','owner_engagement_tasks','owner_engagement_fields') and p.proname <> 'owner_write_service_onboarding_audit_row';")"
FINANCE_REPOINTED="$(PSQL -d svc -tAc "select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_proc p on p.oid = t.tgfoid where not t.tgisinternal and t.tgname like '%_audit' and c.relname in ('owner_invoices','owner_expenses','owner_payments','owner_tax_settings','owner_tax_payments','owner_tax_estimates','owner_assets','owner_subscriptions','owner_finance_documents','owner_exports','owner_business_entities') and p.proname <> 'owner_write_audit_row';")"
[ "$ONBOARDING_GENERIC" = "0" ] || { echo "FAIL: $ONBOARDING_GENERIC onboarding audit trigger(s) still use the generic factory after the ordered chain"; exit 1; }
[ "$FINANCE_REPOINTED" = "0" ] || { echo "FAIL: $FINANCE_REPOINTED finance audit trigger(s) were repointed by the onboarding fix"; exit 1; }

echo "migration convergence: all three migrations re-applied cleanly"
echo "  engagements unchanged: $AFTER_COUNT | template rows: 1 | template tasks: $DUP_TASKS"
echo "  existing engagement snapshot unchanged by re-seeding the template"
echo "  onboarding audit triggers resolve through owner_write_service_onboarding_audit_row; finance triggers untouched"

# ---------------------------------------------------------------------------
# PRODUCTION REGRESSION: the exact confirmed failure, on its own database.
#
# Production returned, when AI Receptionist was added to a customer:
#   23503 -- insert or update on table "owner_audit_log" violates foreign key
#   constraint "owner_audit_log_business_entity_id_fkey"
#
# because the generic audit factory fell back to (row->>'id') for
# owner_engagement_tasks / owner_engagement_fields, which carry no
# business_entity_id. Reproduce it with ONLY the two already-applied migrations,
# then prove 20260830122000 fixes it. If this ever stops failing before the fix,
# the reproduction has silently stopped reproducing anything.
# ---------------------------------------------------------------------------
provision svc_defect
PSQL -d svc_defect -q -f "$MIG/20260830120000_client_service_onboarding.sql" >/dev/null
PSQL -d svc_defect -q -f "$MIG/20260830121000_ai_receptionist_template_v1.sql" >/dev/null

PSQL -d svc_defect -f "$SQLDIR/client-service-onboarding-audit-defect.sql"

PSQL -d svc_defect -q -f "$MIG/20260830122000_service_onboarding_audit_fix.sql" >/dev/null
PSQL -d svc_defect -f "$SQLDIR/client-service-onboarding-audit-fixed.sql"
