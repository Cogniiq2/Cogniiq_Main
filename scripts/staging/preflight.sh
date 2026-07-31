#!/usr/bin/env bash
# =============================================================================
# Customer platform — staging preflight runner
# =============================================================================
# Runs scripts/staging/preflight.sql against a target database and FAILS LOUDLY
# on any mismatch: a single failed check exits non-zero and prints only the
# failures, so this is usable as a deployment gate.
#
# Strictly read-only. The script issues nothing but SELECTs and it sets the
# session to read-only before running them, so a mistake cannot write.
#
# Usage:
#   DATABASE_URL='postgresql://...' bash scripts/staging/preflight.sh
#   bash scripts/staging/preflight.sh --verbose      # also print passing checks
#
# There are no credentials in this file and none are accepted as arguments —
# the connection string comes from the environment only, so it never lands in
# shell history or in CI logs.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL="$ROOT/scripts/staging/preflight.sql"

VERBOSE=0
[ "${1:-}" = "--verbose" ] && VERBOSE=1

if [ -z "${DATABASE_URL:-}" ]; then
  cat >&2 <<'EOF'
DATABASE_URL is not set.

Set it to the STAGING database connection string and re-run, e.g.

  export DATABASE_URL='postgresql://postgres:<password>@db.<staging-ref>.supabase.co:5432/postgres'
  bash scripts/staging/preflight.sh

Never point this at production: the checks are read-only, but the output
enumerates schema state you may not want in a shared log.
EOF
  exit 2
fi

command -v psql >/dev/null 2>&1 || { echo "psql not found on PATH" >&2; exit 2; }
[ -f "$SQL" ] || { echo "missing $SQL" >&2; exit 2; }

echo "Customer platform staging preflight"
echo "target: $(printf '%s' "$DATABASE_URL" | sed -E 's#(://[^:]*):[^@]*@#\1:****@#')"
echo

OUTPUT="$(psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -c 'set default_transaction_read_only = on;' \
  -f "$SQL" 2>&1)" || {
    echo "$OUTPUT" >&2
    echo >&2
    echo "PREFLIGHT ABORTED: the checks could not be executed (connection, permissions, or a missing auth/storage schema)." >&2
    exit 1
  }

PASSED="$(printf '%s\n' "$OUTPUT" | grep -c '^PASS: ' || true)"
FAILED="$(printf '%s\n' "$OUTPUT" | grep -c '^FAIL: ' || true)"

if [ "$VERBOSE" = "1" ]; then
  printf '%s\n' "$OUTPUT" | grep -E '^(PASS|FAIL): ' || true
else
  printf '%s\n' "$OUTPUT" | grep '^FAIL: ' || true
fi

echo
echo "checks passed: $PASSED"
echo "checks failed: $FAILED"

if [ "$PASSED" = "0" ]; then
  echo >&2
  echo "PREFLIGHT FAILED: no checks ran at all — the script produced no results." >&2
  exit 1
fi

if [ "$FAILED" != "0" ]; then
  echo >&2
  echo "PREFLIGHT FAILED: $FAILED check(s) do not match the state this release requires." >&2
  echo "Do not deploy until every one of them is resolved." >&2
  exit 1
fi

echo
echo "PREFLIGHT PASSED: the target database matches the state this release requires."
