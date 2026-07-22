#!/usr/bin/env bash
# Boot a THROWAWAY local PostgreSQL cluster, apply the bootstrap + ALL owner-offer
# migrations (through 20260723125000_owner_signature_proposal_experience), run the
# signature-proposal SQL tests, then tear the cluster down. Never touches Supabase.
# Also verifies migration convergence: re-applying 125000 is idempotent. Requires
# PostgreSQL 15/16 client+server binaries.
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
         20260723125000_owner_signature_proposal_experience; do
  PSQL -d prem -q -f "$MIG/$f.sql" >/dev/null
done
PSQL -d prem -f "$SQLDIR/signature-proposal-tests.sql"

# Migration convergence: re-applying 125000 must be idempotent, and the tests still pass.
PSQL -d prem -q -f "$MIG/20260723125000_owner_signature_proposal_experience.sql" >/dev/null
PSQL -d prem -f "$SQLDIR/signature-proposal-tests.sql" >/dev/null
echo "migration convergence: 125000 re-applied cleanly and signature-proposal tests still pass"
