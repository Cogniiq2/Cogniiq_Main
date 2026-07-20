import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');
const auditScript = join(scriptDir, 'audit-supabase-history.mjs');

const migrationFiles = [
  '20260607194622_create_tasks_table.sql',
  '20260607200426_fix_tasks_rls_policies.sql',
  '20260706121415_20260706120000_create_execution_tables.sql',
  '20260706122833_fix_execution_rls_for_anon.sql',
  '20260709120000_create_richer_oura_tables.sql',
  '20260710120000_phase0_auth_tenancy_rls.sql',
  '20260710133000_phase0_security_hardening.sql',
];

const taskColumns = [
  'id',
  'title',
  'description',
  'category',
  'priority',
  'status',
  'due_date',
  'due_time',
  'money_impact',
  'related_lead_id',
  'related_client_id',
  'source',
  'reason',
  'task_key',
  'created_at',
  'completed_at',
];

const executionDayColumns = [
  'id',
  'plan_date',
  'title',
  'plan_type',
  'total_points',
  'completed_points',
  'score_percent',
  'total_tasks',
  'completed_tasks',
  'status',
  'notes',
  'created_at',
  'updated_at',
];

const executionTaskColumns = [
  'id',
  'execution_day_id',
  'title',
  'description',
  'category',
  'priority',
  'points',
  'is_non_negotiable',
  'sort_order',
  'planned_start',
  'planned_end',
  'is_completed',
  'completed_at',
  'created_at',
  'updated_at',
];

const ouraTables = {
  oura_connections: ['id', 'access_token', 'refresh_token', 'expires_at', 'created_at', 'updated_at'],
  oura_daily_sleep: [
    'id',
    'connection_id',
    'day',
    'score',
    'raw',
    'synced_at',
    'contributors',
    'total_sleep_duration',
    'time_in_bed',
    'efficiency',
    'latency',
    'rem_sleep_duration',
    'deep_sleep_duration',
    'light_sleep_duration',
    'awake_time',
    'restfulness',
    'average_hrv',
    'average_heart_rate',
    'lowest_heart_rate',
    'respiratory_rate',
    'temperature_deviation',
  ],
  oura_daily_readiness: [
    'id',
    'connection_id',
    'day',
    'score',
    'raw',
    'synced_at',
    'contributors',
    'temperature_deviation',
    'hrv_balance',
    'recovery_index',
    'resting_heart_rate_score',
    'body_temperature',
    'previous_day_activity',
    'sleep_balance',
    'activity_balance',
  ],
  oura_daily_activity: [
    'id',
    'connection_id',
    'day',
    'score',
    'steps',
    'raw',
    'synced_at',
    'active_calories',
    'equivalent_walking_distance',
    'high_activity_time',
    'medium_activity_time',
    'low_activity_time',
  ],
  oura_heart_rate: ['id', 'connection_id', 'timestamp', 'bpm', 'source', 'raw', 'synced_at'],
  oura_sleep_sessions: ['id', 'connection_id', 'oura_id', 'day', 'type', 'bedtime_start', 'bedtime_end', 'score', 'raw', 'synced_at'],
  oura_workouts: ['id', 'connection_id', 'oura_id', 'day', 'activity', 'start_datetime', 'end_datetime', 'calories', 'distance', 'raw', 'synced_at'],
  oura_sessions: ['id', 'connection_id', 'oura_id', 'day', 'type', 'start_datetime', 'end_datetime', 'raw', 'synced_at'],
  oura_tags: ['id', 'connection_id', 'oura_id', 'day', 'tag', 'start_datetime', 'end_datetime', 'raw', 'synced_at'],
  oura_spo2: ['id', 'connection_id', 'day', 'spo2_percentage', 'raw', 'synced_at'],
  oura_daily_stress: ['id', 'connection_id', 'day', 'stress_high', 'recovery_high', 'day_summary', 'raw', 'synced_at'],
  oura_daily_resilience: ['id', 'connection_id', 'day', 'level', 'score', 'raw', 'synced_at'],
};

const phase0Tables = {
  profiles: ['id', 'email', 'full_name', 'avatar_url', 'phone', 'platform_role', 'created_at', 'updated_at'],
  organizations: ['id', 'name', 'slug', 'status', 'created_by', 'created_at', 'updated_at'],
  organization_members: ['id', 'organization_id', 'user_id', 'role', 'status', 'created_at', 'updated_at'],
};

const executionIndexes = [
  ['idx_execution_tasks_day', 'execution_tasks'],
  ['idx_execution_tasks_sort', 'execution_tasks'],
  ['idx_execution_days_date', 'execution_days'],
];

const ouraIndexes = [
  ['oura_daily_sleep_connection_day_idx', 'oura_daily_sleep'],
  ['oura_daily_readiness_connection_day_idx', 'oura_daily_readiness'],
  ['oura_daily_activity_connection_day_idx', 'oura_daily_activity'],
  ['oura_heart_rate_connection_timestamp_idx', 'oura_heart_rate'],
  ['oura_sleep_sessions_connection_oura_id_idx', 'oura_sleep_sessions'],
  ['oura_workouts_connection_oura_id_idx', 'oura_workouts'],
  ['oura_sessions_connection_oura_id_idx', 'oura_sessions'],
  ['oura_tags_connection_oura_id_idx', 'oura_tags'],
  ['oura_spo2_connection_day_idx', 'oura_spo2'],
  ['oura_daily_stress_connection_day_idx', 'oura_daily_stress'],
  ['oura_daily_resilience_connection_day_idx', 'oura_daily_resilience'],
];

const phase0Indexes = [
  ['profiles_platform_role_idx', 'profiles'],
  ['organizations_created_by_idx', 'organizations'],
  ['organizations_status_idx', 'organizations'],
  ['organizations_slug_idx', 'organizations'],
  ['organization_members_user_idx', 'organization_members'],
  ['organization_members_org_idx', 'organization_members'],
  ['organization_members_role_status_idx', 'organization_members'],
];

const phase0Functions = [
  'set_updated_at',
  'is_database_admin',
  'request_is_service_role',
  'is_platform_owner',
  'is_platform_admin',
  'is_organization_member',
  'has_organization_role',
  'current_user_organization_ids',
  'handle_new_auth_user',
  'guard_organization_membership_change',
  'create_organization_for_user',
  'sync_auth_user_profile',
  'guard_profile_protected_columns',
  'guard_profile_delete',
  'guard_organization_protected_columns',
];

const phase0Triggers = [
  ['profiles_set_updated_at', 'profiles', 'set_updated_at'],
  ['organizations_set_updated_at', 'organizations', 'set_updated_at'],
  ['organization_members_set_updated_at', 'organization_members', 'set_updated_at'],
  ['organization_members_guard_write', 'organization_members', 'guard_organization_membership_change'],
  ['profiles_guard_protected_columns', 'profiles', 'guard_profile_protected_columns'],
  ['profiles_guard_delete', 'profiles', 'guard_profile_delete'],
  ['organizations_guard_protected_columns', 'organizations', 'guard_organization_protected_columns'],
];

function id(name, quoted) {
  return quoted ? `"${name}"` : name;
}

function publicName(name, quoted) {
  return quoted ? `"public"."${name}"` : `public.${name}`;
}

function roleName(name, quoted) {
  return id(name, quoted);
}

function columnType(tableName, columnName) {
  if (tableName === 'oura_connections') {
    return {
      id: 'uuid NOT NULL',
      access_token: 'text',
      refresh_token: 'text',
      expires_at: 'timestamp with time zone',
      created_at: 'timestamp with time zone',
      updated_at: 'timestamp with time zone',
    }[columnName];
  }

  if (columnName === 'id' || columnName.endsWith('_id') || columnName === 'created_by' || columnName === 'user_id') return 'uuid NOT NULL';
  if (columnName.startsWith('is_')) return 'boolean';
  if (columnName.endsWith('_at') || columnName.includes('datetime') || columnName === 'timestamp') return 'timestamp with time zone';
  if (['day', 'plan_date', 'due_date'].includes(columnName)) return 'date';
  if (['score', 'steps', 'points', 'total_points', 'completed_points', 'score_percent', 'total_tasks', 'completed_tasks'].includes(columnName)) return 'integer';
  if (columnName === 'raw' || columnName === 'contributors') return 'jsonb';
  return 'text';
}

function createTable(tableName, columnNames, quoted) {
  const definitions = columnNames.map((columnName) => `  ${id(columnName, quoted)} ${columnType(tableName, columnName)}`);
  return `CREATE TABLE ${publicName(tableName, quoted)} (\n${definitions.join(',\n')}\n);\n`;
}

function createEnum(typeName, values, quoted) {
  const quotedValues = values.map((value) => `'${value}'`).join(', ');
  return `CREATE TYPE ${publicName(typeName, quoted)} AS ENUM (${quotedValues});\n`;
}

function createIndex(indexName, tableName, quoted) {
  return `CREATE INDEX ${id(indexName, quoted)} ON ${publicName(tableName, quoted)} USING btree (${id('id', quoted)});\n`;
}

function addConstraint(tableName, constraintName, body, quoted) {
  return `ALTER TABLE ONLY ${publicName(tableName, quoted)} ADD CONSTRAINT ${id(constraintName, quoted)} ${body};\n`;
}

function addForeignKey(tableName, constraintName, columnName, targetTableName, targetColumnName, quoted) {
  return addConstraint(
    tableName,
    constraintName,
    `FOREIGN KEY (${id(columnName, quoted)}) REFERENCES ${publicName(targetTableName, quoted)}(${id(targetColumnName, quoted)}) ON DELETE CASCADE`,
    quoted
  );
}

function enableRls(tableName, quoted) {
  return `ALTER TABLE ${publicName(tableName, quoted)} ENABLE ROW LEVEL SECURITY;\n`;
}

function createPolicy(policyName, tableName, command, roles, quoted) {
  const roleSql = roles.map((role) => roleName(role, quoted)).join(', ');
  return `CREATE POLICY ${id(policyName, quoted)} ON ${publicName(tableName, quoted)} FOR ${command} TO ${roleSql} USING (true) WITH CHECK (true);\n`;
}

function createFunction(functionName, quoted) {
  return `CREATE FUNCTION ${publicName(functionName, quoted)}() RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END; $$;\n`;
}

function createTrigger(triggerName, tableName, functionName, quoted) {
  return `CREATE TRIGGER ${id(triggerName, quoted)} BEFORE UPDATE ON ${publicName(tableName, quoted)} FOR EACH ROW EXECUTE FUNCTION ${publicName(functionName, quoted)}();\n`;
}

function grantTable(tableName, role, privileges, quoted) {
  return `GRANT ${privileges} ON TABLE ${publicName(tableName, quoted)} TO ${roleName(role, quoted)};\n`;
}

function grantColumns(tableName, role, privilege, columns, quoted) {
  return `GRANT ${privilege} (${columns.map((columnName) => id(columnName, quoted)).join(', ')}) ON TABLE ${publicName(tableName, quoted)} TO ${roleName(role, quoted)};\n`;
}

function grantFunction(functionName, role, quoted) {
  return `GRANT EXECUTE ON FUNCTION ${publicName(functionName, quoted)}() TO ${roleName(role, quoted)};\n`;
}

function buildSchema({ quoted, omitOuraConnections = false }) {
  const lines = [
    createTable('tasks', taskColumns, quoted),
    enableRls('tasks', quoted),
    createPolicy('select_tasks', 'tasks', 'SELECT', ['anon', 'authenticated'], quoted),
    createPolicy('insert_tasks', 'tasks', 'INSERT', ['anon', 'authenticated'], quoted),
    createPolicy('update_tasks', 'tasks', 'UPDATE', ['anon', 'authenticated'], quoted),
    createPolicy('delete_tasks', 'tasks', 'DELETE', ['anon', 'authenticated'], quoted),
    createTable('execution_days', executionDayColumns, quoted),
    createTable('execution_tasks', executionTaskColumns, quoted),
    addConstraint('execution_days', 'execution_days_plan_date_key', `UNIQUE (${id('plan_date', quoted)})`, quoted),
    addConstraint(
      'execution_days',
      'execution_days_status_check',
      `CHECK (${id('status', quoted)} = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text]))`,
      quoted
    ),
    addConstraint(
      'execution_tasks',
      'execution_tasks_priority_check',
      `CHECK (${id('priority', quoted)} = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))`,
      quoted
    ),
    addForeignKey('execution_tasks', 'execution_tasks_execution_day_id_fkey', 'execution_day_id', 'execution_days', 'id', quoted),
    ...executionIndexes.map(([indexName, tableName]) => createIndex(indexName, tableName, quoted)),
    enableRls('execution_days', quoted),
    enableRls('execution_tasks', quoted),
    createPolicy('execution_days_all', 'execution_days', 'ALL', ['anon', 'authenticated'], quoted),
    createPolicy('execution_tasks_all', 'execution_tasks', 'ALL', ['anon', 'authenticated'], quoted),
    createFunction('recalc_execution_day_stats', quoted),
    createFunction('trigger_recalc_execution_day', quoted),
    createFunction('generate_daily_execution_plan', quoted),
    createTrigger('trg_execution_tasks_recalc', 'execution_tasks', 'trigger_recalc_execution_day', quoted),
  ];

  for (const [tableName, columnNames] of Object.entries(ouraTables)) {
    if (!(omitOuraConnections && tableName === 'oura_connections')) {
      lines.push(createTable(tableName, columnNames, quoted));
    }

    if (tableName !== 'oura_connections') {
      lines.push(addForeignKey(tableName, `${tableName}_connection_id_fkey`, 'connection_id', 'oura_connections', 'id', quoted));
    }
  }

  lines.push(...ouraIndexes.map(([indexName, tableName]) => createIndex(indexName, tableName, quoted)));

  lines.push(
    createEnum('platform_role', ['customer', 'cogniiq_admin', 'cogniiq_owner'], quoted),
    createEnum('organization_status', ['pending', 'active', 'suspended', 'cancelled'], quoted),
    createEnum('organization_role', ['owner', 'admin', 'member', 'viewer'], quoted),
    createEnum('membership_status', ['invited', 'active', 'suspended'], quoted)
  );

  for (const [tableName, columnNames] of Object.entries(phase0Tables)) {
    lines.push(createTable(tableName, columnNames, quoted));
  }

  lines.push(
    addConstraint('organization_members', 'organization_members_org_user_key', `UNIQUE (${id('organization_id', quoted)}, ${id('user_id', quoted)})`, quoted),
    ...phase0Indexes.map(([indexName, tableName]) => createIndex(indexName, tableName, quoted)),
    ...phase0Functions.map((functionName) => createFunction(functionName, quoted)),
    ...phase0Triggers.map(([triggerName, tableName, functionName]) => createTrigger(triggerName, tableName, functionName, quoted)),
    enableRls('profiles', quoted),
    enableRls('organizations', quoted),
    enableRls('organization_members', quoted),
    createPolicy('profiles_select_self_or_platform_admin', 'profiles', 'SELECT', ['authenticated'], quoted),
    createPolicy('profiles_update_self_allowed_columns', 'profiles', 'UPDATE', ['authenticated'], quoted),
    createPolicy('organizations_select_member_or_platform_admin', 'organizations', 'SELECT', ['authenticated'], quoted),
    createPolicy('organizations_update_owner_admin_or_platform_admin', 'organizations', 'UPDATE', ['authenticated'], quoted),
    createPolicy('organization_members_select_same_org_or_platform_admin', 'organization_members', 'SELECT', ['authenticated'], quoted),
    createPolicy('organization_members_insert_admins', 'organization_members', 'INSERT', ['authenticated'], quoted),
    createPolicy('organization_members_update_admins', 'organization_members', 'UPDATE', ['authenticated'], quoted),
    createPolicy('organization_members_delete_admins', 'organization_members', 'DELETE', ['authenticated'], quoted),
    grantTable('profiles', 'authenticated', 'SELECT', quoted),
    grantTable('organizations', 'authenticated', 'SELECT', quoted),
    grantTable('organization_members', 'authenticated', 'SELECT, INSERT, UPDATE, DELETE', quoted),
    grantColumns('profiles', 'authenticated', 'UPDATE', ['full_name', 'avatar_url', 'phone'], quoted),
    grantColumns('organizations', 'authenticated', 'UPDATE', ['name', 'slug'], quoted),
    grantColumns('organization_members', 'authenticated', 'UPDATE', ['role', 'status'], quoted),
    grantFunction('create_organization_for_user', 'service_role', quoted),
    grantFunction('sync_auth_user_profile', 'service_role', quoted),
    grantFunction('guard_profile_protected_columns', 'service_role', quoted),
    grantFunction('guard_profile_delete', 'service_role', quoted),
    grantFunction('guard_organization_protected_columns', 'service_role', quoted),
    grantFunction('guard_organization_membership_change', 'service_role', quoted),
    grantFunction('set_updated_at', 'service_role', quoted)
  );

  return lines.join('\n');
}

function prepareWorkspace(schemaSql) {
  const root = mkdtempSync(join(tmpdir(), 'supabase-history-audit-test-'));
  const migrationRoot = join(root, 'migration-source', 'supabase', 'migrations');

  mkdirSync(migrationRoot, { recursive: true });

  for (const filename of migrationFiles) {
    copyFileSync(join(repoRoot, 'supabase', 'migrations', filename), join(migrationRoot, filename));
  }

  writeFileSync(join(root, 'remote-public-schema.sql'), schemaSql);
  writeFileSync(join(root, 'supabase-migration-list.txt'), 'Local | Remote | Time\nfixture migration list\n');

  return root;
}

function cleanupWorkspace(root) {
  const resolved = resolve(root);
  const tempRoot = resolve(tmpdir());

  if (resolved.startsWith(tempRoot)) {
    rmSync(resolved, { recursive: true, force: true });
  }
}

function runAudit(name, schemaSql) {
  const root = prepareWorkspace(schemaSql);

  try {
    const result = spawnSync(process.execPath, [auditScript, 'migration-source'], {
      cwd: root,
      encoding: 'utf8',
    });

    if (result.status !== 0) {
      throw new Error(`${name} audit failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    }

    return readFileSync(join(root, 'supabase-history-audit.txt'), 'utf8');
  } finally {
    cleanupWorkspace(root);
  }
}

function expectStatus(report, migrationId, expectedStatus) {
  const pattern = new RegExp(`^${migrationId} .+: ${expectedStatus}$`, 'm');

  if (!pattern.test(report)) {
    throw new Error(`Expected ${migrationId} to be ${expectedStatus}.\n${report}`);
  }
}

function expectReportLine(report, text) {
  if (!report.includes(text)) {
    throw new Error(`Expected report to include: ${text}\n${report}`);
  }
}

const testCases = {
  quoted() {
    const report = runAudit('quoted fixture', buildSchema({ quoted: true }));
    expectStatus(report, '20260607194622', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260607200426', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260706121415', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260706122833', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260709120000', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260710120000', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260710133000', 'AMBIGUOUS');
    expectReportLine(report, '[PASS] table public.oura_connections');
    expectReportLine(report, '[PASS] RLS enabled on public.tasks');
    expectReportLine(report, '[PASS] index oura_daily_sleep_connection_day_idx on public.oura_daily_sleep');
    expectReportLine(report, '[PASS] constraint execution_days_plan_date_key on public.execution_days');
    expectReportLine(report, '[PASS] foreign key execution_tasks.execution_day_id -> execution_days(id)');
    expectReportLine(report, '[PASS] policy select_tasks on public.tasks');
    expectReportLine(report, '[PASS] function public.set_updated_at');
    expectReportLine(report, '[PASS] trigger profiles_set_updated_at on public.profiles');
    expectReportLine(report, '[PASS] grant update(full_name, avatar_url, phone) on profiles to authenticated');
    expectReportLine(report, '[PASS] grant execute create_organization_for_user to service_role');
  },
  unquoted() {
    const report = runAudit('unquoted fixture', buildSchema({ quoted: false }));
    expectStatus(report, '20260709120000', 'CONFIRMED_PRESENT');
    expectStatus(report, '20260710133000', 'AMBIGUOUS');
  },
  missing() {
    const report = runAudit('missing-object fixture', buildSchema({ quoted: true, omitOuraConnections: true }));
    expectStatus(report, '20260709120000', 'MISSING');
    expectReportLine(report, '[FAIL] table public.oura_connections');
  },
};

const requestedCases = process.argv.slice(2);
const selectedCases = requestedCases.length > 0 ? requestedCases : Object.keys(testCases);

for (const testCase of selectedCases) {
  if (!testCases[testCase]) {
    throw new Error(`Unknown test case: ${testCase}`);
  }

  testCases[testCase]();
  console.log(`${testCase} audit fixture test passed`);
}
