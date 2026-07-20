import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const migrationPath = 'supabase/migrations/20260711120000_receptionist_persistence.sql';
const migration = readFileSync(migrationPath, 'utf8');
const lower = migration.toLowerCase();

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function countMatches(pattern) {
  return [...migration.matchAll(pattern)].length;
}

function assertIncludes(value, message) {
  assert(lower.includes(value.toLowerCase()), message);
}

function assertNotMatches(pattern, message) {
  assert(!pattern.test(lower), message);
}

assert(basename(migrationPath) === '20260711120000_receptionist_persistence.sql', 'Target migration version filename drifted');
const beginIndex = lower.indexOf('begin;');
const firstMutationIndex = lower.search(/\b(create|alter|drop|revoke|grant|comment)\b/);
assert(beginIndex !== -1, 'Migration must start an explicit transaction');
assert(firstMutationIndex === -1 || beginIndex < firstMutationIndex, 'Migration must open the transaction before schema changes');
assert(/\bcommit\s*;\s*$/i.test(migration), 'Migration must end with commit');

assertNotMatches(/\bdrop\s+table\b/, 'Migration must not drop tables');
assertNotMatches(/\btruncate\b/, 'Migration must not truncate tables');
assertNotMatches(/\bdrop\b[\s\S]{0,120}\bcascade\b/, 'Migration must not use destructive drop cascade');
assertNotMatches(/\bsupabase_migrations\b|\bschema_migrations\b|\bmigration\s+repair\b|\bdb\s+reset\b/, 'Migration must not repair or manually edit migration history');

for (const dependency of [
  "to_regclass('public.organizations')",
  "to_regclass('public.organization_members')",
  "to_regtype('public.organization_role')",
  "to_regprocedure('public.is_database_admin()')",
  "to_regprocedure('public.request_is_service_role()')",
  "to_regprocedure('public.is_platform_admin()')",
  "to_regprocedure('public.is_organization_member(uuid)')",
  "to_regprocedure('public.has_organization_role(uuid, public.organization_role[])')",
]) {
  assertIncludes(dependency, `Missing dependency preflight check: ${dependency}`);
}

for (const tableName of ['public.businesses', 'public.onboarding_sessions', 'public.receptionist_configs', 'public.phone_configs']) {
  assertIncludes(tableName, `Missing target table reference: ${tableName}`);
}

assertIncludes('target_row_count <> 0', 'Migration must fail closed when target tables contain rows');
assertIncludes('create table if not exists public.businesses', 'Migration must support fresh creation of businesses');
assertIncludes('create table if not exists public.onboarding_sessions', 'Migration must support fresh creation of onboarding_sessions');
assertIncludes('create table if not exists public.receptionist_configs', 'Migration must support fresh creation of receptionist_configs');
assertIncludes('create table if not exists public.phone_configs', 'Migration must support fresh creation of phone_configs');
assertIncludes('Receptionist persistence table column structure mismatch', 'Migration must validate existing table column structure');

for (const functionName of [
  'set_customer_product_timestamps',
  'jsonb_text_array_is_subset',
  'onboarding_status_transition_is_allowed',
  'set_onboarding_session_lifecycle_timestamps',
  'guard_onboarding_session_system_fields',
  'guard_phone_config_system_fields',
]) {
  assertIncludes(`create or replace function public.${functionName}`, `Missing CREATE OR REPLACE for ${functionName}`);
}

for (const constraintName of [
  'receptionist_configs_responsibilities_keys_check',
  'receptionist_configs_allowed_actions_keys_check',
  'receptionist_configs_prohibited_actions_keys_check',
]) {
  assertIncludes(`add constraint ${constraintName}`, `Missing safe add for ${constraintName}`);
  assertIncludes(constraintName, `Missing final verification for ${constraintName}`);
}

assertIncludes('onboarding_status_transition_is_allowed(old.status, new.status)', 'Onboarding guard must restrict service-role lifecycle transitions');
assertIncludes('revoke update (', 'Migration must explicitly revoke protected column updates');
assertIncludes('status,', 'Migration must revoke/update-check onboarding_sessions.status');
assertIncludes("has_column_privilege('authenticated', 'public.onboarding_sessions', 'status', 'UPDATE')", 'Migration must verify authenticated cannot update onboarding status');

assert(countMatches(/drop trigger if exists/gi) === 7, 'Migration must reconcile exactly seven named receptionist triggers');
assert(countMatches(/drop policy if exists/gi) === 12, 'Migration must reconcile exactly twelve named receptionist policies');
assert(countMatches(/create index if not exists/gi) === 7, 'Migration must create seven non-constraint indexes idempotently');

assertIncludes('Final verification failed', 'Migration must contain a final fail-closed verification block');
assertIncludes('expected 45 receptionist constraints', 'Final verification must assert expected constraints');
assertIncludes('expected 7 receptionist indexes', 'Final verification must assert expected indexes');
assertIncludes('expected 7 receptionist triggers', 'Final verification must assert expected triggers');
assertIncludes('expected 12 receptionist policies', 'Final verification must assert expected policies');
assertIncludes('relrowsecurity', 'Final verification must assert RLS remains enabled');

console.log('receptionist migration convergence safety checks passed');
