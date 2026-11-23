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

echo "PostgreSQL server under test: $(PSQL -tAc 'select version()')"

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

# ---- T9. The hotfix can never report success without securing all 16 helpers. -------------
# Hide one expected helper and re-expose another, then run the hotfix: it must FAIL, and because
# it fails inside its transaction, the re-exposed grant must still be there (nothing changed).
PSQL -q -c "alter function public.owner_purge_merge_counts(jsonb, jsonb) rename to owner_purge_merge_counts_hidden"
PSQL -q -c "grant execute on function public.owner_force_destroy_row(text, uuid, integer) to authenticated"
if PSQL -q -f "$MIG/$HOTFIX.sql" >"$WORKBASE/t9.log" 2>&1; then
  echo "FAIL T9: hotfix reported success although an expected helper was missing"; exit 1
fi
grep -q "expected internal helper public.owner_purge_merge_counts(jsonb, jsonb) does not exist" "$WORKBASE/t9.log" \
  || { echo "FAIL T9: unexpected failure reason:"; cat "$WORKBASE/t9.log"; exit 1; }
[ "$(PSQL -tAc "select has_function_privilege('authenticated','public.owner_force_destroy_row(text, uuid, integer)','execute')")" = "t" ] \
  || { echo "FAIL T9: the aborted run changed privileges (no rollback)"; exit 1; }
PSQL -q -c "alter function public.owner_purge_merge_counts_hidden(jsonb, jsonb) rename to owner_purge_merge_counts"
PSQL -q -f "$MIG/$HOTFIX.sql" >/dev/null 2>&1
[ "$(PSQL -tAc "select has_function_privilege('authenticated','public.owner_force_destroy_row(text, uuid, integer)','execute')")" = "f" ] \
  || { echo "FAIL T9: re-running after restoring the helper did not re-secure it"; exit 1; }
echo "PASS T9: a missing helper aborts the hotfix with full rollback; a complete set is re-secured"

# ---- T10. An unexpected extra overload of a helper name is secured too. ------------------------
# Created by the migration owner, so the emulated platform defaults give authenticated EXECUTE.
PSQL -q -c "create function public.owner_force_destroy_row(p_table text) returns integer language sql security definer as 'select 1'"
[ "$(PSQL -tAc "select has_function_privilege('authenticated','public.owner_force_destroy_row(text)','execute')")" = "t" ] \
  || { echo "FAIL T10: harness did not reproduce the default grant on a new overload"; exit 1; }
PSQL -q -f "$MIG/$HOTFIX.sql" >/dev/null 2>&1
[ "$(PSQL -tAc "select has_function_privilege('authenticated','public.owner_force_destroy_row(text)','execute')")" = "f" ] \
  || { echo "FAIL T10: an extra overload stayed client-executable"; exit 1; }
PSQL -q -c "drop function public.owner_force_destroy_row(text)"
echo "PASS T10: an unexpected overload of a helper name is revoked as well"

echo "internal-helper privilege harness: ALL STAGES PASSED"
