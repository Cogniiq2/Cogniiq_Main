#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the bootstrap + the owner-offer migrations
# the engagement feature depends on (through 20260723128000) + 20260827120000, then EXECUTE the
# engagement RPCs. Tears the cluster down afterwards. Never touches Supabase.
#
# This harness exists because the engagement feature originally shipped with source-PARSING
# tests only, which passed against a function that failed on its first real call
# (OUT-parameter/column ambiguity in owner_engagement_context). Only execution catches that.
#
# The deliberately EXCLUDED migrations are the ones unrelated to offers whose chain is known
# not to apply from scratch (the Case D tasks/execution_*/oura_* cluster and the
# club_operations catalog rows). They are not in the engagement dependency closure.
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

PSQL -c "create database eng;" >/dev/null
PSQL -d eng -q -f "$SQLDIR/premium-offer-bootstrap.sql" >/dev/null
for f in 20260723120000_owner_document_settings 20260723121000_owner_offers \
         20260723122000_owner_commercial_documents 20260723123000_owner_premium_offer_editor \
         20260723124000_owner_premium_offer_runtime_hotfix \
         20260723125000_owner_signature_proposal_experience \
         20260723126000_owner_automation_worker \
         20260723127000_owner_signed_certificate_workflow \
         20260723128000_owner_offer_email_workflow \
         20260827120000_owner_offer_engagement; do
  PSQL -d eng -q -f "$MIG/$f.sql" >/dev/null
done
PSQL -d eng -f "$SQLDIR/offer-engagement-tests.sql"

# Migration convergence: the engagement migration must be safely re-appliable, and the
# behavioural tests must still pass afterwards.
PSQL -d eng -q -f "$MIG/20260827120000_owner_offer_engagement.sql" >/dev/null
PSQL -d eng -f "$SQLDIR/offer-engagement-tests.sql" >/dev/null
echo "migration convergence: 20260827120000 re-applied cleanly and engagement tests still pass"
