import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaPath = 'remote-public-schema.sql';
const migrationListPath = 'supabase-migration-list.txt';
const reportPath = 'supabase-history-audit.txt';
const sourceDir = process.argv[2] ?? '.';
const migrationRoot = join(sourceDir, 'supabase', 'migrations');

const migrations = [
  {
    id: '20260607194622',
    filename: '20260607194622_create_tasks_table.sql',
    description: 'Create tasks table and task RLS policies',
  },
  {
    id: '20260607200426',
    filename: '20260607200426_fix_tasks_rls_policies.sql',
    description: 'Repair final task RLS policies',
  },
  {
    id: '20260706121415',
    filename: '20260706121415_20260706120000_create_execution_tables.sql',
    description: 'Create execution planning tables, indexes, functions, trigger and RLS',
  },
  {
    id: '20260706122833',
    filename: '20260706122833_fix_execution_rls_for_anon.sql',
    description: 'Allow anon and authenticated roles through execution RLS policies',
  },
  {
    id: '20260709120000',
    filename: '20260709120000_create_richer_oura_tables.sql',
    description: 'Create richer Oura public schema tables and unique indexes',
  },
  {
    id: '20260710120000',
    filename: '20260710120000_phase0_auth_tenancy_rls.sql',
    description: 'Create Phase 0 auth tenancy schema, helpers and RLS',
  },
  {
    id: '20260710133000',
    filename: '20260710133000_phase0_security_hardening.sql',
    description: 'Harden Phase 0 profile, organization and membership protections',
  },
];

if (!existsSync(schemaPath)) {
  throw new Error(`Missing ${schemaPath}. Run supabase db dump before this audit.`);
}

if (!existsSync(migrationListPath)) {
  throw new Error(`Missing ${migrationListPath}. Run supabase migration list before this audit.`);
}

for (const migration of migrations) {
  migration.file = join(migrationRoot, migration.filename);

  if (!existsSync(migration.file)) {
    throw new Error(`Missing local migration file: ${migration.file}`);
  }

  migration.sql = readFileSync(migration.file, 'utf8');
}

const schema = readFileSync(schemaPath, 'utf8').replace(/\r\n/g, '\n').toLowerCase();
const migrationList = readFileSync(migrationListPath, 'utf8').trim();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function identifier(name) {
  return `(?:"${escapeRegex(name)}"|${escapeRegex(name)})`;
}

function qualifiedIdentifier(schemaName, objectName) {
  return `${identifier(schemaName)}\\s*\\.\\s*${identifier(objectName)}`;
}

function publicIdentifier(objectName) {
  return qualifiedIdentifier('public', objectName);
}

function tableReference(tableName) {
  return `(?:only\\s+)?${publicIdentifier(tableName)}`;
}

function roleIdentifier(roleName) {
  return identifier(roleName);
}

function roleList(roleNames) {
  return roleNames.map((roleName) => roleIdentifier(roleName)).join('[\\s\\S]*');
}

function quotedOrBareList(values) {
  return values.map((value) => identifier(value)).join('[^)]*');
}

function functionGrantPattern(functionName, roleName) {
  return new RegExp(
    `grant\\s+(?:all|execute)\\s+on\\s+function\\s+${publicIdentifier(functionName)}\\([^;\\n]*\\)\\s+to\\s+${roleIdentifier(roleName)}`
  );
}

function tableGrantPattern(tableName, roleName, privilegePattern) {
  return new RegExp(`grant\\s+${privilegePattern}\\s+on\\s+table\\s+${publicIdentifier(tableName)}\\s+to\\s+${roleIdentifier(roleName)}`);
}

function columnGrantPattern(tableName, roleName, privilege, columnNames) {
  return new RegExp(
    `grant\\s+${privilege}\\s*\\([^)]*${quotedOrBareList(columnNames)}[^)]*\\)\\s+on\\s+table\\s+${publicIdentifier(tableName)}\\s+to\\s+${roleIdentifier(roleName)}`
  );
}

function tableConstraintPattern(tableName, bodyPattern) {
  return new RegExp(`alter\\s+table\\s+${tableReference(tableName)}[\\s\\S]*${bodyPattern}`);
}

function checkValuesPattern(tableName, values) {
  const valuePattern = values.map((value) => escapeRegex(value)).join('[\\s\\S]*');
  return tableConstraintPattern(tableName, `check[\\s\\S]*${valuePattern}`);
}

function foreignKeyPattern(tableName, columnName, targetTableName, targetColumnName) {
  return tableConstraintPattern(
    tableName,
    `foreign\\s+key\\s*\\(${identifier(columnName)}\\)\\s+references\\s+${publicIdentifier(targetTableName)}\\s*\\(${identifier(targetColumnName)}\\)\\s+on\\s+delete\\s+cascade`
  );
}

function has(pattern) {
  return pattern.test(schema);
}

function missing(label, pattern) {
  return {
    label,
    state: has(pattern) ? 'PASS' : 'FAIL',
  };
}

function absent(label, pattern) {
  return {
    label,
    state: has(pattern) ? 'FAIL' : 'PASS',
  };
}

function ambiguous(label, reason) {
  return {
    label,
    state: 'AMBIGUOUS',
    reason,
  };
}

function table(tableName) {
  return missing(`table public.${tableName}`, new RegExp(`create\\s+table\\s+${publicIdentifier(tableName)}\\s*\\(`));
}

function tableBlock(tableName) {
  const match = schema.match(new RegExp(`create\\s+table\\s+${publicIdentifier(tableName)}\\s*\\(([\\s\\S]*?)\\n\\);`));
  return match?.[1] ?? '';
}

function column(tableName, columnName) {
  const block = tableBlock(tableName);
  return {
    label: `column public.${tableName}.${columnName}`,
    state: new RegExp(`\\n\\s*${identifier(columnName)}\\s+`).test(block) ? 'PASS' : 'FAIL',
  };
}

function columns(tableName, columnNames) {
  return columnNames.map((columnName) => column(tableName, columnName));
}

function typeEnum(typeName, values) {
  const valuePattern = values.map((value) => `'${escapeRegex(value)}'`).join('[\\s\\S]*');
  return missing(`type public.${typeName} enum values`, new RegExp(`create\\s+type\\s+${publicIdentifier(typeName)}\\s+as\\s+enum[\\s\\S]*${valuePattern}`));
}

function index(indexName, tableName) {
  return missing(`index ${indexName} on public.${tableName}`, new RegExp(`create\\s+(?:unique\\s+)?index\\s+${identifier(indexName)}\\s+on\\s+${publicIdentifier(tableName)}(?=\\s|;)`));
}

function constraint(constraintName, tableName) {
  return missing(`constraint ${constraintName} on public.${tableName}`, tableConstraintPattern(tableName, `constraint\\s+${identifier(constraintName)}(?=\\s|;)`));
}

function rls(tableName) {
  return missing(`RLS enabled on public.${tableName}`, new RegExp(`alter\\s+table\\s+${publicIdentifier(tableName)}\\s+enable\\s+row\\s+level\\s+security`));
}

function policy(policyName, tableName, details = '') {
  const block = schema.match(
    new RegExp(`create\\s+policy\\s+${identifier(policyName)}\\s+on\\s+${publicIdentifier(tableName)}[\\s\\S]*?;`)
  )?.[0];
  return {
    label: `policy ${policyName} on public.${tableName}`,
    state: block && (!details || new RegExp(details).test(block)) ? 'PASS' : 'FAIL',
  };
}

function functionExists(functionName) {
  return missing(`function public.${functionName}`, new RegExp(`create\\s+function\\s+${publicIdentifier(functionName)}\\s*\\(`));
}

function trigger(triggerName, tableName) {
  return missing(
    `trigger ${triggerName} on public.${tableName}`,
    new RegExp(`create\\s+trigger\\s+${identifier(triggerName)}[\\s\\S]*on\\s+${publicIdentifier(tableName)}(?=\\s|;)`)
  );
}

function grant(label, pattern) {
  return missing(label, pattern);
}

function fkToOuraConnections(tableName) {
  return missing(
    `foreign key public.${tableName}.connection_id -> public.oura_connections(id)`,
    foreignKeyPattern(tableName, 'connection_id', 'oura_connections', 'id')
  );
}

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

const checksByMigration = {
  '20260607194622': [
    table('tasks'),
    ...columns('tasks', taskColumns),
    rls('tasks'),
    policy('select_tasks', 'tasks', `[\\s\\S]*for\\s+select[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('insert_tasks', 'tasks', `[\\s\\S]*for\\s+insert[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('update_tasks', 'tasks', `[\\s\\S]*for\\s+update[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('delete_tasks', 'tasks', `[\\s\\S]*for\\s+delete[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
  ],
  '20260607200426': [
    rls('tasks'),
    policy('select_tasks', 'tasks', `[\\s\\S]*for\\s+select[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('insert_tasks', 'tasks', `[\\s\\S]*for\\s+insert[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('update_tasks', 'tasks', `[\\s\\S]*for\\s+update[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('delete_tasks', 'tasks', `[\\s\\S]*for\\s+delete[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
  ],
  '20260706121415': [
    table('execution_days'),
    ...columns('execution_days', executionDayColumns),
    table('execution_tasks'),
    ...columns('execution_tasks', executionTaskColumns),
    constraint('execution_days_plan_date_key', 'execution_days'),
    missing(
      'execution_days.status check allows pending/in_progress/completed',
      checkValuesPattern('execution_days', ['pending', 'in_progress', 'completed'])
    ),
    missing(
      'execution_tasks.priority check allows critical/high/medium/low',
      checkValuesPattern('execution_tasks', ['critical', 'high', 'medium', 'low'])
    ),
    missing(
      'foreign key execution_tasks.execution_day_id -> execution_days(id)',
      foreignKeyPattern('execution_tasks', 'execution_day_id', 'execution_days', 'id')
    ),
    index('idx_execution_tasks_day', 'execution_tasks'),
    index('idx_execution_tasks_sort', 'execution_tasks'),
    index('idx_execution_days_date', 'execution_days'),
    rls('execution_days'),
    rls('execution_tasks'),
    policy('execution_days_all', 'execution_days'),
    policy('execution_tasks_all', 'execution_tasks'),
    functionExists('recalc_execution_day_stats'),
    functionExists('trigger_recalc_execution_day'),
    functionExists('generate_daily_execution_plan'),
    trigger('trg_execution_tasks_recalc', 'execution_tasks'),
  ],
  '20260706122833': [
    policy('execution_days_all', 'execution_days', `[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
    policy('execution_tasks_all', 'execution_tasks', `[\\s\\S]*to[\\s\\S]*${roleList(['anon', 'authenticated'])}`),
  ],
  '20260709120000': [
    ...Object.entries(ouraTables).flatMap(([tableName, columnNames]) => [table(tableName), ...columns(tableName, columnNames)]),
    ...Object.keys(ouraTables)
      .filter((tableName) => tableName !== 'oura_connections')
      .map((tableName) => fkToOuraConnections(tableName)),
    index('oura_daily_sleep_connection_day_idx', 'oura_daily_sleep'),
    index('oura_daily_readiness_connection_day_idx', 'oura_daily_readiness'),
    index('oura_daily_activity_connection_day_idx', 'oura_daily_activity'),
    index('oura_heart_rate_connection_timestamp_idx', 'oura_heart_rate'),
    index('oura_sleep_sessions_connection_oura_id_idx', 'oura_sleep_sessions'),
    index('oura_workouts_connection_oura_id_idx', 'oura_workouts'),
    index('oura_sessions_connection_oura_id_idx', 'oura_sessions'),
    index('oura_tags_connection_oura_id_idx', 'oura_tags'),
    index('oura_spo2_connection_day_idx', 'oura_spo2'),
    index('oura_daily_stress_connection_day_idx', 'oura_daily_stress'),
    index('oura_daily_resilience_connection_day_idx', 'oura_daily_resilience'),
  ],
  '20260710120000': [
    typeEnum('platform_role', ['customer', 'cogniiq_admin', 'cogniiq_owner']),
    typeEnum('organization_status', ['pending', 'active', 'suspended', 'cancelled']),
    typeEnum('organization_role', ['owner', 'admin', 'member', 'viewer']),
    typeEnum('membership_status', ['invited', 'active', 'suspended']),
    table('profiles'),
    ...columns('profiles', ['id', 'email', 'full_name', 'avatar_url', 'phone', 'platform_role', 'created_at', 'updated_at']),
    table('organizations'),
    ...columns('organizations', ['id', 'name', 'slug', 'status', 'created_by', 'created_at', 'updated_at']),
    table('organization_members'),
    ...columns('organization_members', ['id', 'organization_id', 'user_id', 'role', 'status', 'created_at', 'updated_at']),
    constraint('organization_members_org_user_key', 'organization_members'),
    index('profiles_platform_role_idx', 'profiles'),
    index('organizations_created_by_idx', 'organizations'),
    index('organizations_status_idx', 'organizations'),
    index('organizations_slug_idx', 'organizations'),
    index('organization_members_user_idx', 'organization_members'),
    index('organization_members_org_idx', 'organization_members'),
    index('organization_members_role_status_idx', 'organization_members'),
    functionExists('set_updated_at'),
    functionExists('is_database_admin'),
    functionExists('request_is_service_role'),
    functionExists('is_platform_owner'),
    functionExists('is_platform_admin'),
    functionExists('is_organization_member'),
    functionExists('has_organization_role'),
    functionExists('current_user_organization_ids'),
    functionExists('handle_new_auth_user'),
    functionExists('guard_organization_membership_change'),
    functionExists('create_organization_for_user'),
    trigger('profiles_set_updated_at', 'profiles'),
    trigger('organizations_set_updated_at', 'organizations'),
    trigger('organization_members_set_updated_at', 'organization_members'),
    trigger('organization_members_guard_write', 'organization_members'),
    rls('profiles'),
    rls('organizations'),
    rls('organization_members'),
    policy('profiles_select_self_or_platform_admin', 'profiles'),
    policy('profiles_update_self_allowed_columns', 'profiles'),
    policy('organizations_select_member_or_platform_admin', 'organizations'),
    policy('organizations_update_owner_admin_or_platform_admin', 'organizations'),
    policy('organization_members_select_same_org_or_platform_admin', 'organization_members'),
    policy('organization_members_insert_admins', 'organization_members'),
    policy('organization_members_update_admins', 'organization_members'),
    policy('organization_members_delete_admins', 'organization_members'),
    grant('grant select public.profiles to authenticated', tableGrantPattern('profiles', 'authenticated', 'select')),
    grant('grant select public.organizations to authenticated', tableGrantPattern('organizations', 'authenticated', 'select')),
    grant(
      'grant organization_members table access to authenticated',
      tableGrantPattern('organization_members', 'authenticated', '(?:select,\\s*)?insert[\\s\\S]*delete')
    ),
  ],
  '20260710133000': [
    functionExists('sync_auth_user_profile'),
    functionExists('guard_profile_protected_columns'),
    functionExists('guard_profile_delete'),
    functionExists('guard_organization_protected_columns'),
    functionExists('guard_organization_membership_change'),
    functionExists('create_organization_for_user'),
    trigger('profiles_guard_protected_columns', 'profiles'),
    trigger('profiles_guard_delete', 'profiles'),
    trigger('organizations_guard_protected_columns', 'organizations'),
    trigger('organization_members_guard_write', 'organization_members'),
    grant(
      'grant update(full_name, avatar_url, phone) on profiles to authenticated',
      columnGrantPattern('profiles', 'authenticated', 'update', ['full_name', 'avatar_url', 'phone'])
    ),
    grant(
      'grant update(name, slug) on organizations to authenticated',
      columnGrantPattern('organizations', 'authenticated', 'update', ['name', 'slug'])
    ),
    grant(
      'grant update(role, status) on organization_members to authenticated',
      columnGrantPattern('organization_members', 'authenticated', 'update', ['role', 'status'])
    ),
    grant(
      'grant execute create_organization_for_user to service_role',
      functionGrantPattern('create_organization_for_user', 'service_role')
    ),
    absent(
      'no execute grant for create_organization_for_user to authenticated',
      functionGrantPattern('create_organization_for_user', 'authenticated')
    ),
    grant('grant execute sync_auth_user_profile to service_role', functionGrantPattern('sync_auth_user_profile', 'service_role')),
    grant(
      'grant execute guard_profile_protected_columns to service_role',
      functionGrantPattern('guard_profile_protected_columns', 'service_role')
    ),
    grant('grant execute guard_profile_delete to service_role', functionGrantPattern('guard_profile_delete', 'service_role')),
    grant(
      'grant execute guard_organization_protected_columns to service_role',
      functionGrantPattern('guard_organization_protected_columns', 'service_role')
    ),
    grant(
      'grant execute guard_organization_membership_change to service_role',
      functionGrantPattern('guard_organization_membership_change', 'service_role')
    ),
    grant('grant execute set_updated_at to service_role', functionGrantPattern('set_updated_at', 'service_role')),
    ambiguous(
      'trigger on_auth_user_profile_sync on auth.users',
      'The audit intentionally dumps only --schema public, so auth.users triggers are not visible in remote-public-schema.sql.'
    ),
    ambiguous(
      'existing auth.users profile backfill',
      'The audit is schema-only and read-only, so it cannot confirm data backfill without reading production rows.'
    ),
  ],
};

function statusFor(checks) {
  if (checks.some((check) => check.state === 'FAIL')) return 'MISSING';
  if (checks.some((check) => check.state === 'AMBIGUOUS')) return 'AMBIGUOUS';
  return 'CONFIRMED_PRESENT';
}

const lines = [
  'Supabase Migration History Audit',
  `Generated at: ${new Date().toISOString()}`,
  '',
  'Inputs:',
  `- Selected source directory: ${sourceDir}`,
  `- Migration source directory: ${migrationRoot}`,
  `- Public schema dump: ${schemaPath}`,
  `- Migration list output: ${migrationListPath}`,
  '',
  'Read-only guarantee:',
  '- This audit script reads migration files from the selected source directory and the saved public schema dump only.',
  '- It does not connect to Supabase and does not execute SQL.',
  '- The workflow audit mode uses supabase migration list and supabase db dump --linked --schema public only.',
  '',
  'Saved migration list output:',
  migrationList || '(empty output)',
  '',
  'Migration checks:',
];

for (const migration of migrations) {
  const checks = checksByMigration[migration.id];
  const status = statusFor(checks);

  lines.push('');
  lines.push(`${migration.id} ${migration.description}: ${status}`);
  lines.push(`Local SQL file: ${migration.file}`);

  for (const check of checks) {
    const suffix = check.reason ? ` - ${check.reason}` : '';
    lines.push(`  [${check.state}] ${check.label}${suffix}`);
  }
}

writeFileSync(reportPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${reportPath}`);
