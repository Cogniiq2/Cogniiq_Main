#!/usr/bin/env bash
# P0 hotfix regression harness (20261123120000_revoke_client_execute_on_internal_purge_helpers).
#
# Boots a THROWAWAY local PostgreSQL cluster, emulates the hosted Supabase default privileges
# for schema public (anon/authenticated/service_role get EXECUTE on every new function), applies
# every migration in order, then:
#   1. proves the production defect is reproduced (a customer session can destroy an owner row),
#   2. applies the hotfix, twice (idempotency),
#   3. runs the regression suite: customer + anon denied on all 16 helpers, owner deletion
#      workflows intact, service_role jobs intact, privileges-only change.
# Never contacts Supabase or any remote database: it only ever talks to its own unix socket.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"
SQLDIR="$ROOT/.github/scripts/sql"
HOTFIX="20261123120000_revoke_client_execute_on_internal_purge_helpers"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "postgres server binaries not found (set PGBIN)"; exit 1; }

RUNUSER=""
if [ "$(id -u)" = "0" ]; then
  RUNUSER="${PGTEST_USER:-pgtest}"
  id "$RUNUSER" >/dev/null 2>&1 || useradd -m "$RUNUSER"
fi
WORKBASE="${PGTEST_HOME:-$( [ -n "$RUNUSER" ] && echo "/home/$RUNUSER/pgpriv.$$" || echo "$(mktemp -d)" )}"
DATA="$WORKBASE/data"; SOCK="$WORKBASE/sock"
rm -rf "$WORKBASE"; mkdir -p "$DATA" "$SOCK"
as() { if [ -n "$RUNUSER" ]; then sudo -u "$RUNUSER" "$@"; else "$@"; fi; }
if [ -n "$RUNUSER" ]; then chown -R "$RUNUSER" "$WORKBASE"; chmod 700 "$DATA"; fi

cleanup() { as "$PGBIN/pg_ctl" -D "$DATA" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$WORKBASE"; }
trap cleanup EXIT

as "$PGBIN/initdb" -D "$DATA" -U postgres --auth=trust >/dev/null
as "$PGBIN/pg_ctl" -D "$DATA" -o "-k $SOCK -c listen_addresses=''" -l "$WORKBASE/pg.log" start >/dev/null
sleep 1
PSQL() { as "$PGBIN/psql" -h "$SOCK" -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }

PSQL -q -f "$ROOT/supabase/tests/lib_bootstrap.sql" >/dev/null
PSQL -q -f "$SQLDIR/internal-helper-privilege-defaults.sql" >/dev/null

# Every migration in order, except the hotfix itself and the two the full-chain purge smoke
# also skips (hosted-only drift reconciliation; unapplied club-operations activation).
SKIP="20260731122000_case_d_legacy_convergence 20260818120000_club_operations_activation $HOTFIX"
for f in "$MIG"/*.sql; do
  name="$(basename "$f" .sql)"
  case " $SKIP " in *" $name "*) continue;; esac
  PSQL -q -f "$f" >/dev/null
done

PSQL -q -f "$SQLDIR/internal-helper-privilege-prefix.sql"

PSQL -q -f "$MIG/$HOTFIX.sql"
PSQL -q -f "$MIG/$HOTFIX.sql"   # idempotency: a second run must succeed and change nothing
echo "hotfix applied twice without error"

PSQL -q -f "$SQLDIR/internal-helper-privilege-tests.sql"
