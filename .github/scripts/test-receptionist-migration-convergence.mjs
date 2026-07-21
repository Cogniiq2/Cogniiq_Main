import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const migrationPath = 'supabase/migrations/20260711120000_receptionist_persistence.sql';
const convergenceSmokePath = 'supabase/tests/run_receptionist_convergence_smoke.sh';
const migration = readFileSync(migrationPath, 'utf8');
const convergenceSmoke = readFileSync(convergenceSmokePath, 'utf8');
const lower = migration.toLowerCase();

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertIncludes(haystack, value, message) {
  assert(haystack.includes(value), message);
}

function assertNotMatches(pattern, message) {
  assert(!pattern.test(lower), message);
}

function extractBetween(startPattern, endPattern, label) {
  const startMatch = migration.match(startPattern);
  assert(startMatch?.index !== undefined, `Missing start of ${label}`);
  const startIndex = startMatch.index;
  const rest = migration.slice(startIndex);
  const endMatch = rest.match(endPattern);
  assert(endMatch?.index !== undefined, `Missing end of ${label}`);
  return rest.slice(0, endMatch.index + endMatch[0].length);
}

function countRows(block) {
  return [...block.matchAll(/^\s*\('/gm)].length;
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
  assertIncludes(lower, dependency, `Missing dependency preflight check: ${dependency}`);
}

for (const tableName of ['public.businesses', 'public.onboarding_sessions', 'public.receptionist_configs', 'public.phone_configs']) {
  assertIncludes(lower, tableName, `Missing target table reference: ${tableName}`);
}

assert((migration.match(/target_row_count <> 0/g) ?? []).length >= 2, 'Migration must check zero target rows before reconciliation and before commit');
assertIncludes(lower, 'create table if not exists public.businesses', 'Migration must support fresh creation of businesses');
assertIncludes(lower, 'create table if not exists public.onboarding_sessions', 'Migration must support fresh creation of onboarding_sessions');
assertIncludes(lower, 'create table if not exists public.receptionist_configs', 'Migration must support fresh creation of receptionist_configs');
assertIncludes(lower, 'create table if not exists public.phone_configs', 'Migration must support fresh creation of phone_configs');
assertIncludes(lower, 'validate_receptionist_columns', 'Migration must validate exact column structure through a reusable final validator');

const constraintBlock = extractBetween(
  /insert into receptionist_expected_constraints\s*\(/i,
  /;\s*\r?\n\s*create temporary table receptionist_expected_indexes/i,
  'expected constraint inventory',
);
assert(countRows(constraintBlock) === 45, `Expected 45 constraint inventory rows, found ${countRows(constraintBlock)}`);

for (const requiredConstraint of [
  'businesses_name_not_blank',
  'businesses_organization_id_fkey',
  'onboarding_sessions_organization_business_fk',
  'onboarding_sessions_status_check',
  'onboarding_sessions_selected_goals_check',
  'receptionist_configs_responsibilities_keys_check',
  'receptionist_configs_allowed_actions_keys_check',
  'receptionist_configs_prohibited_actions_keys_check',
  'phone_configs_test_status_check',
]) {
  assertIncludes(constraintBlock, requiredConstraint, `Missing expected constraint inventory row for ${requiredConstraint}`);
}

for (const semanticConstraintCheck of [
  'con.contype',
  'unnest(con.conkey)',
  'unnest(con.confkey)',
  'con.confdeltype',
  'con.confupdtype',
  'pg_get_constraintdef(con.oid)',
  'con.convalidated',
  'constraint_definition !~ e.check_pattern',
  'unexpected receptionist constraint',
]) {
  assertIncludes(lower, semanticConstraintCheck.toLowerCase(), `Constraint validator does not inspect ${semanticConstraintCheck}`);
}

for (const repairableConstraint of [
  'receptionist_configs_responsibilities_keys_check',
  'receptionist_configs_allowed_actions_keys_check',
  'receptionist_configs_prohibited_actions_keys_check',
]) {
  assertIncludes(lower, `add constraint ${repairableConstraint}`, `Missing safe add for repairable JSON constraint ${repairableConstraint}`);
}
assert(!/add constraint (?!receptionist_configs_(responsibilities|allowed_actions|prohibited_actions)_keys_check)/i.test(
  migration.replace(/create table if not exists[\s\S]*?;\s*/gi, ''),
), 'Migration must not add non-JSON constraints during reconciliation');

const indexBlock = extractBetween(
  /insert into receptionist_expected_indexes\s*\(/i,
  /;\s*\r?\n\s*create temporary table receptionist_expected_authenticated_column_privileges/i,
  'expected index inventory',
);
assert(countRows(indexBlock) === 7, `Expected 7 non-constraint index inventory rows, found ${countRows(indexBlock)}`);
for (const structuralIndexCheck of [
  'indisunique',
  'indisprimary',
  'indpred is not null',
  'indexprs is not null',
  'indnatts',
  'indnkeyatts',
  'indisvalid',
  'indisready',
  "am.amname",
  'unexpected non-constraint receptionist index',
]) {
  assertIncludes(lower, structuralIndexCheck.toLowerCase(), `Index validator does not inspect ${structuralIndexCheck}`);
}

const privilegeBlock = extractBetween(
  /insert into receptionist_expected_authenticated_column_privileges\s*\(/i,
  /;\s*\r?\n\s*create or replace function pg_temp\.validate_receptionist_constraints/i,
  'expected authenticated column privilege inventory',
);
assert(countRows(privilegeBlock) === 68, `Expected 68 authenticated column privilege inventory rows, found ${countRows(privilegeBlock)}`);
for (const forbiddenUpdate of [
  "('onboarding_sessions', 'status', 'UPDATE')",
  "('onboarding_sessions', 'last_error', 'UPDATE')",
  "('onboarding_sessions', 'started_at', 'UPDATE')",
  "('onboarding_sessions', 'completed_at', 'UPDATE')",
  "('phone_configs', 'assigned_ai_number', 'UPDATE')",
  "('phone_configs', 'test_status', 'UPDATE')",
  "('businesses', 'environment', 'UPDATE')",
]) {
  assert(!privilegeBlock.includes(forbiddenUpdate), `Protected field is in authenticated UPDATE privilege inventory: ${forbiddenUpdate}`);
}
assertIncludes(lower, 'revoke insert (%s) on table public.%i from authenticated', 'Migration must explicitly revoke authenticated INSERT on every column before grants');
assertIncludes(lower, 'revoke update (%s) on table public.%i from authenticated', 'Migration must explicitly revoke authenticated UPDATE on every column before grants');
assertIncludes(lower, 'validate_receptionist_authenticated_column_privileges', 'Final verification must compare exact authenticated column privilege sets');

for (const finalValidation of [
  "perform pg_temp.validate_receptionist_columns('final verification')",
  "perform pg_temp.validate_receptionist_constraints('final verification')",
  "perform pg_temp.validate_receptionist_indexes('final verification')",
  'pg_get_triggerdef',
  'tr.tgfoid',
  'tr.tgenabled',
  'pg_policies',
  'policyname',
  'roles',
  'with_check',
  'provolatile',
  'prosecdef',
  'proconfig',
  'aclexplode',
  'obj_description',
  'col_description',
  'has_table_privilege',
  'has_function_privilege',
  'relrowsecurity',
]) {
  assertIncludes(lower, finalValidation.toLowerCase(), `Final verification is missing ${finalValidation}`);
}

assert(!/expected\s+(45|7|12)\s+receptionist/i.test(migration), 'Final verification must not rely on count-only checks');
assertIncludes(lower, 'onboarding_status_transition_is_allowed(old.status, new.status)', 'Onboarding guard must restrict service-role lifecycle transitions');

for (const functionName of [
  'set_customer_product_timestamps',
  'jsonb_text_array_is_subset',
  'onboarding_status_transition_is_allowed',
  'set_onboarding_session_lifecycle_timestamps',
  'guard_onboarding_session_system_fields',
  'guard_phone_config_system_fields',
]) {
  assertIncludes(lower, `create or replace function public.${functionName}`, `Missing CREATE OR REPLACE for ${functionName}`);
}

for (const smokeRequirement of [
  'rp_convergence_partial',
  'drop constraint receptionist_configs_responsibilities_keys_check',
  'drop function public.jsonb_text_array_is_subset(jsonb, text[])',
  'drop function public.onboarding_status_transition_is_allowed(text, text)',
  'grant update (status) on table public.onboarding_sessions to authenticated',
  'has_column_privilege',
  'service_role bypassed the explicit lifecycle transition allow-list',
  'rp_convergence_bad_constraint',
  'add constraint businesses_name_not_blank check (name is not null)',
  'rp_convergence_non_empty',
  'Refusing to run receptionist convergence smoke against a hosted database URL.',
]) {
  assertIncludes(convergenceSmoke, smokeRequirement, `Convergence smoke is missing fixture/assertion: ${smokeRequirement}`);
}

console.log('receptionist migration convergence safety checks passed');
