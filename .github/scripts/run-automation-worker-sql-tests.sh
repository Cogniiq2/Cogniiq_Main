#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the bootstrap + ALL owner-offer
# migrations (through 20260723126000_owner_automation_worker), run the automation-worker
# SQL tests, then a genuine two-connection FOR UPDATE SKIP LOCKED concurrency check, then
# tear the cluster down. Never touches Supabase. Also verifies 126000 re-applies cleanly.
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

PSQL -c "create database prem;" >/dev/null
PSQL -d prem -q -f "$SQLDIR/premium-offer-bootstrap.sql" >/dev/null
for f in 20260723120000_owner_document_settings 20260723121000_owner_offers \
         20260723122000_owner_commercial_documents 20260723123000_owner_premium_offer_editor \
         20260723124000_owner_premium_offer_runtime_hotfix \
         20260723125000_owner_signature_proposal_experience \
         20260723126000_owner_automation_worker; do
  PSQL -d prem -q -f "$MIG/$f.sql" >/dev/null
done
PSQL -d prem -f "$SQLDIR/automation-worker-tests.sql"

# ---- Concurrency: FOR UPDATE SKIP LOCKED. Session A claims inside an OPEN transaction
# (locks + sets processing, uncommitted); a concurrent Session B must claim ZERO of them. ----
PSQL -d prem -q -c "delete from public.owner_automation_jobs;" >/dev/null
PSQL -d prem -q -c "insert into public.owner_automation_jobs (business_entity_id, job_type, status, dedupe_key)
  select '22222222-2222-2222-2222-222222222222','invoice_email','pending','conc:'||g from generate_series(1,4) g;" >/dev/null

B_CMD="$PGBIN/psql -h $SOCK -U postgres -d prem -q -tA -c \"set app.role='service';\" -c \"select count(*) from public.owner_claim_automation_jobs(10,null) t(j);\""
CONC=$(as "$PGBIN/psql" -h "$SOCK" -U postgres -d prem -v ON_ERROR_STOP=1 -q -tA <<SQL
set app.role='service';
begin;
select count(*) from public.owner_claim_automation_jobs(10,null) t(j);
\! $B_CMD
rollback;
SQL
)
# Output is: "<A_claimed>" then "<B_claimed>" (from the \! subprocess).
A_CLAIMED=$(printf '%s\n' "$CONC" | sed -n '1p')
B_CLAIMED=$(printf '%s\n' "$CONC" | sed -n '2p')
echo "concurrency: session A claimed=$A_CLAIMED, concurrent session B claimed=$B_CLAIMED"
if [ "${A_CLAIMED:-0}" -lt 1 ] || [ "${B_CLAIMED:-x}" != "0" ]; then
  echo "FAIL: concurrent workers claimed the same jobs (SKIP LOCKED not effective)"; exit 1
fi
echo "PASS concurrent workers never claim the same job (FOR UPDATE SKIP LOCKED)"

# Migration convergence: re-applying 126000 must be idempotent, and the tests still pass.
PSQL -d prem -q -f "$MIG/20260723126000_owner_automation_worker.sql" >/dev/null
PSQL -d prem -f "$SQLDIR/automation-worker-tests.sql" >/dev/null
echo "migration convergence: 126000 re-applied cleanly and automation-worker tests still pass"
