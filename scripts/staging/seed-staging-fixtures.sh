#!/usr/bin/env bash
# =============================================================================
# Customer platform — guarded staging fixture seeder
# =============================================================================
# This is the ONLY supported way to run scripts/staging/seed-staging-fixtures.sql.
# It WRITES to the target database, so every interlock below must pass before
# psql is invoked at all:
#
#   1. ALLOW_STAGING_SEED must be exactly "true".
#   2. STAGING_PROJECT_REF must be set and must be a Supabase project reference.
#   3. DATABASE_URL must be set and must contain that exact project reference,
#      so a connection string for a different project is refused.
#   4. CI must not be set — this never runs automatically anywhere.
#   5. The target must already carry all five customer-platform migrations.
#
# NO CREDENTIALS live in this file or in the repository. The connection string
# comes from the environment only.
#
# Usage:
#   export DATABASE_URL='postgresql://postgres:<password>@db.<staging-ref>.supabase.co:5432/postgres'
#   export STAGING_PROJECT_REF='<staging-ref>'
#   export ALLOW_STAGING_SEED=true
#   bash scripts/staging/seed-staging-fixtures.sh
#
# Cleanup (always run this when done):
#   psql "$DATABASE_URL" -f scripts/staging/cleanup-staging-fixtures.sql
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SEED="$ROOT/scripts/staging/seed-staging-fixtures.sql"
CLEANUP="$ROOT/scripts/staging/cleanup-staging-fixtures.sql"

refuse() {
  echo >&2
  echo "REFUSING TO SEED: $1" >&2
  echo >&2
  exit 2
}

# --- 4) never in CI ----------------------------------------------------------
# Checked first: an automated environment must be stopped before it is even told
# what the other interlocks are.
for var in CI GITHUB_ACTIONS GITLAB_CI BUILDKITE JENKINS_URL TF_BUILD; do
  if [ -n "${!var:-}" ]; then
    refuse "the environment variable $var is set. This seeder never runs automatically in CI."
  fi
done

# --- 1) explicit opt-in ------------------------------------------------------
if [ "${ALLOW_STAGING_SEED:-}" != "true" ]; then
  refuse "ALLOW_STAGING_SEED is not set to \"true\".

This script writes disposable test fixtures into a database. Set
ALLOW_STAGING_SEED=true only when you are certain the target is STAGING."
fi

# --- 2) explicit target ------------------------------------------------------
STAGING_PROJECT_REF="${STAGING_PROJECT_REF:-}"
[ -n "$STAGING_PROJECT_REF" ] || refuse "STAGING_PROJECT_REF is not set. Name the staging project explicitly; there is no default."

if ! printf '%s' "$STAGING_PROJECT_REF" | grep -Eq '^[a-z0-9]{16,32}$'; then
  refuse "STAGING_PROJECT_REF \"$STAGING_PROJECT_REF\" is not a Supabase project reference (16-32 lowercase alphanumerics)."
fi

# --- 3) the connection string must BE that target ----------------------------
[ -n "${DATABASE_URL:-}" ] || refuse "DATABASE_URL is not set."

if ! printf '%s' "$DATABASE_URL" | grep -q "$STAGING_PROJECT_REF"; then
  refuse "DATABASE_URL does not contain the declared project reference \"$STAGING_PROJECT_REF\".

The connection string and the declared target must agree. This is the interlock
that stops fixtures from landing in an unintended — possibly production — project."
fi

command -v psql >/dev/null 2>&1 || refuse "psql not found on PATH."
[ -f "$SEED" ] || refuse "missing $SEED"

# --- 5) the target must be fully migrated ------------------------------------
MIGRATED="$(psql "$DATABASE_URL" -t -A -c "
  select case when
    to_regclass('public.customer_projects') is not null
    and to_regclass('public.customer_documents') is not null
    and to_regclass('public.customer_project_invoices') is not null
    and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname='public' and p.proname='assign_invoice_organization')
    and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname='public' and p.proname='archive_customer_document_as')
  then 'yes' else 'no' end;" 2>/dev/null || echo 'unreachable')"

case "$MIGRATED" in
  yes) ;;
  no)  refuse "the target database is missing one or more of the five customer-platform migrations.
Run scripts/staging/preflight.sh first and apply what it reports as missing." ;;
  *)   refuse "could not reach the target database to verify its migration state (got: $MIGRATED)." ;;
esac

echo "Seeding disposable staging fixtures"
echo "target project ref: $STAGING_PROJECT_REF"
echo "target: $(printf '%s' "$DATABASE_URL" | sed -E 's#(://[^:]*):[^@]*@#\1:****@#')"
echo

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SEED"

cat <<EOF

Fixtures created. All of them are named "ZZ STAGING FIXTURE" / "ZZ-FIXTURE" and
carry the ffffffff-… id prefix, so they are unmistakable in every list and sort
to the end of it.

WHAT TO EXERCISE
  * organization A's active member sees exactly one project, one document and
    two invoices
  * organization A's SUSPENDED member sees nothing at all
  * organization B's member sees none of organization A's data
  * the unpublished and archived documents never appear, and their ids are
    refused by the download function
  * ZZ-FIXTURE-UNASSIGNED-0001 has no organization: use it to exercise the
    assign-and-link flow

CLEANUP — run this when you are finished:
  psql "\$DATABASE_URL" -f $CLEANUP

Fixture documents reference storage paths that were never uploaded, so nothing
needs removing from the bucket unless you uploaded files during testing.
EOF
