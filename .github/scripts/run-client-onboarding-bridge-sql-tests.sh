#!/usr/bin/env bash
# Client onboarding bridge (20261124120000) — SQL authorization and workflow harness.
#
# Boots a THROWAWAY local PostgreSQL cluster with the hosted Supabase default privileges
# emulated (anon/authenticated/service_role get EXECUTE on every new function and ALL on every
# new table), applies every migration in order, applies the bridge migration a second time
# (replay safety) and runs .github/scripts/sql/client-onboarding-bridge-tests.sql.
# Never contacts Supabase or any remote database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"
SQLDIR="$ROOT/.github/scripts/sql"
BRIDGE="20261124120000_client_onboarding_bridge"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "postgres server binaries not found (set PGBIN)"; exit 1; }

RUNUSER=""
if [ "$(id -u)" = "0" ]; then
  RUNUSER="${PGTEST_USER:-pgtest}"
  id "$RUNUSER" >/dev/null 2>&1 || useradd -m "$RUNUSER"
fi
WORKBASE="${PGTEST_HOME:-$( [ -n "$RUNUSER" ] && echo "/home/$RUNUSER/pgonb.$$" || echo "$(mktemp -d)" )}"
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

# Same skip list as the full-chain purge smoke: hosted-only drift reconciliation and the
# deliberately unapplied club-operations activation.
SKIP="20260731122000_case_d_legacy_convergence 20260818120000_club_operations_activation"
for f in "$MIG"/*.sql; do
  name="$(basename "$f" .sql)"
  case " $SKIP " in *" $name "*) continue;; esac
  PSQL -q -f "$f" >/dev/null
done
PSQL -q -f "$MIG/$BRIDGE.sql" >/dev/null   # replay safety: a second application must succeed
echo "bridge migration applied twice without error"

PSQL -q -f "$SQLDIR/client-onboarding-bridge-tests.sql"
