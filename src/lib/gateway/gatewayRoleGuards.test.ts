// Guards on the gateway role's privileges, and on the accepted D3 constraints.
//
// Two jobs:
//
//   1. Prove the analyser detects the exact failure the D2c spike demonstrated — a mis-applied DML
//      grant combined with a permissive write policy. The spike's own `02_misgrant.sql` is the
//      canonical positive fixture, so the guard is tested against the real thing rather than against
//      a sample written to make it pass.
//
//   2. Scan every committed migration and fail if a prohibited privilege ever appears. Today that
//      scan passes trivially, because no gateway role exists yet. Its value is entirely in the
//      future: the D3 migration that creates the role lands into a repository that already refuses
//      to accept a write grant on it.
//
// No database is contacted. These are static checks over SQL text.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  auditGatewayRoleSql,
  D3_ACCEPTANCE_CONSTRAINTS,
  isGatewayRoleName,
  stripSqlComments,
  type GatewayGuardFindingKind,
} from './gatewayRoleGuards';

const repoRoot = resolve(__dirname, '../../..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function kinds(sql: string): GatewayGuardFindingKind[] {
  return auditGatewayRoleSql(sql).map((finding) => finding.kind);
}

/* ------------------------------------------------------------ Role recognition */

describe('the gateway role is recognised however it is named', () => {
  it('matches the names already in use', () => {
    expect(isGatewayRoleName('cogniiq_readonly')).toBe(true);
    expect(isGatewayRoleName('cq_readonly_spike')).toBe(true);
  });

  it('matches a plausibly named future role, which is the case nobody remembers to register', () => {
    for (const name of [
      'club_ops_readonly',
      'svh_read_only',
      'cogniiq_gateway',
      'gateway_reader',
      '"cogniiq_readonly"',
      'COGNIIQ_READONLY',
    ]) {
      expect(isGatewayRoleName(name), name).toBe(true);
    }
  });

  it('does not claim unrelated roles, which would make the guard noise', () => {
    for (const name of ['postgres', 'authenticated', 'anon', 'service_role', 'cogniiq_audit_owner']) {
      expect(isGatewayRoleName(name), name).toBe(false);
    }
  });
});

/* ----------------------------------------------------------- Prohibited grants */

describe('prohibited privileges are detected', () => {
  const prohibited: Array<[string, GatewayGuardFindingKind, string]> = [
    ['INSERT', 'dml_grant', 'grant insert on public.bookings to cogniiq_readonly;'],
    ['UPDATE', 'dml_grant', 'grant update on public.bookings to cogniiq_readonly;'],
    ['DELETE', 'dml_grant', 'grant delete on public.bookings to cogniiq_readonly;'],
    ['TRUNCATE', 'dml_grant', 'grant truncate on public.bookings to cogniiq_readonly;'],
    ['TRIGGER', 'dml_grant', 'grant trigger on public.bookings to cogniiq_readonly;'],
    ['REFERENCES', 'dml_grant', 'grant references on public.bookings to cogniiq_readonly;'],
    ['ALL PRIVILEGES', 'all_privileges_grant', 'grant all privileges on public.bookings to cogniiq_readonly;'],
    ['ALL', 'all_privileges_grant', 'grant all on public.bookings to cogniiq_readonly;'],
    ['sequence usage', 'sequence_grant', 'grant usage on sequence public.bookings_id_seq to cogniiq_readonly;'],
    ['all sequences', 'sequence_grant', 'grant usage, select on all sequences in schema public to cogniiq_readonly;'],
    ['EXECUTE', 'execute_grant', 'grant execute on function public.do_thing() to cogniiq_readonly;'],
    [
      'default privileges',
      'default_privileges_grant',
      'alter default privileges in schema public grant insert on tables to cogniiq_readonly;',
    ],
    ['BYPASSRLS', 'dangerous_role_attribute', 'alter role cogniiq_readonly bypassrls;'],
    ['SUPERUSER', 'dangerous_role_attribute', 'alter role cogniiq_readonly superuser;'],
    ['CREATEROLE', 'dangerous_role_attribute', 'alter role cogniiq_readonly createrole;'],
    [
      'read-only turned off',
      'read_only_disabled',
      "alter role cogniiq_readonly set default_transaction_read_only = off;",
    ],
  ];

  for (const [what, kind, sql] of prohibited) {
    it(`flags ${what}`, () => {
      expect(kinds(sql), sql).toContain(kind);
    });
  }

  it('flags a multi-role grant that hides the gateway role in a list', () => {
    const sql = 'grant insert on public.bookings to authenticated, cogniiq_readonly, service_role;';
    expect(kinds(sql)).toContain('dml_grant');
  });

  it('flags grants written across several lines', () => {
    const sql = `grant
        insert,
        update
      on public.bookings
      to cogniiq_readonly;`;
    expect(kinds(sql)).toContain('dml_grant');
  });
});

describe('permitted statements are not flagged', () => {
  const permitted = [
    'grant select on public.bookings to cogniiq_readonly;',
    'grant select (id, reference, court_key) on public.bookings to cogniiq_readonly;',
    'grant usage on schema public to cogniiq_readonly;',
    'create policy p on public.bookings for select to cogniiq_readonly using (true);',
    "alter role cogniiq_readonly set default_transaction_read_only = on;",
    "alter role cogniiq_readonly set statement_timeout = '2s';",
    'alter role cogniiq_readonly connection limit 24;',
    'create role cogniiq_readonly login nosuperuser nocreatedb nocreaterole noreplication nobypassrls;',
    // Writes granted to roles that are not the gateway role are none of this guard's business.
    'grant insert on public.bookings to service_role;',
    'grant all privileges on public.bookings to postgres;',
  ];

  for (const sql of permitted) {
    it(`allows: ${sql.slice(0, 62)}`, () => {
      expect(auditGatewayRoleSql(sql), sql).toEqual([]);
    });
  }

  it('does not trip on a comment that documents the rule it enforces', () => {
    const sql = `
      -- Never: grant insert on public.bookings to cogniiq_readonly;
      /* and never grant all privileges on public.bookings to cogniiq_readonly either */
      grant select on public.bookings to cogniiq_readonly;
    `;
    expect(auditGatewayRoleSql(sql)).toEqual([]);
    expect(stripSqlComments(sql)).not.toMatch(/grant insert/i);
  });

  it('keeps line numbers meaningful after comments are stripped', () => {
    const sql = ['-- a comment', '-- another', 'grant insert on t to cogniiq_readonly;'].join('\n');
    expect(auditGatewayRoleSql(sql)[0].line).toBe(3);
  });
});

/* ------------------------------------------------- Permissive write policies */

describe('permissive write policies are detected', () => {
  const dangerous: Array<[string, string]> = [
    ['FOR INSERT', 'create policy w on public.bookings for insert to cogniiq_readonly with check (true);'],
    ['FOR UPDATE', 'create policy w on public.bookings for update to cogniiq_readonly using (true);'],
    ['FOR DELETE', 'create policy w on public.bookings for delete to cogniiq_readonly using (true);'],
    ['FOR ALL', 'create policy w on public.bookings for all to cogniiq_readonly using (true);'],
    [
      'no FOR clause, which defaults to ALL',
      'create policy w on public.bookings to cogniiq_readonly using (true);',
    ],
  ];

  for (const [what, sql] of dangerous) {
    it(`flags a policy ${what}`, () => {
      expect(kinds(sql), sql).toContain('permissive_write_policy');
    });
  }

  it('allows a select-only policy, which is the one the design requires', () => {
    expect(
      auditGatewayRoleSql('create policy r on public.bookings for select to cogniiq_readonly using (true);'),
    ).toEqual([]);
  });
});

/* --------------------------------------- The spike fixtures as real fixtures */

describe('the analyser catches the failure the spike actually demonstrated', () => {
  const spikeSql = (name: string) =>
    readFileSync(resolve(repoRoot, 'docs/club-operations/d2-spike/sql', name), 'utf8');

  it('flags every prohibited grant in the deliberate mis-grant fixture', () => {
    const findings = auditGatewayRoleSql(spikeSql('02_misgrant.sql'));
    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(new Set(findings.map((f) => f.kind))).toEqual(new Set(['dml_grant', 'sequence_grant']));
    expect(findings.every((f) => f.role === 'cq_readonly_spike')).toBe(true);
  });

  it('flags the EXECUTE grant the base fixture needed for its timeout test', () => {
    // 01_fixture.sql deliberately grants EXECUTE on one sleep helper so criterion 5 could be tested.
    // The guard flags it, which is correct: that grant is exactly what D3 must never carry.
    expect(kinds(spikeSql('01_fixture.sql'))).toContain('execute_grant');
  });

  it('would have flagged the mis-grant before it ever reached a database', () => {
    // The spike had to run a live database to discover that the write succeeded. This guard reaches
    // the same conclusion from the SQL text alone, which is the point of having it.
    const combined = `${spikeSql('02_misgrant.sql')}
      create policy spike_bookings_write on spike.synthetic_bookings
        for insert to cq_readonly_spike with check (true);`;
    const found = kinds(combined);
    expect(found).toContain('dml_grant');
    expect(found).toContain('permissive_write_policy');
  });
});

/* ------------------------------------------------- The repository-wide scan */

describe('no committed migration grants the gateway role anything prohibited', () => {
  const migrationsDir = resolve(repoRoot, 'supabase/migrations');
  const migrations = walk(migrationsDir).filter((file) => file.endsWith('.sql'));

  it('found migrations to scan, so the scan cannot pass by globbing nothing', () => {
    expect(migrations.length).toBeGreaterThanOrEqual(30);
  });

  it('every migration is clean', () => {
    const offenders: string[] = [];
    for (const file of migrations) {
      for (const finding of auditGatewayRoleSql(readFileSync(file, 'utf8'))) {
        offenders.push(
          `${relative(repoRoot, file).replace(/\\/g, '/')}:${finding.line} ${finding.kind} (${finding.role}) — ${finding.statement}`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no migration for the gateway role exists yet, which is why this is a design-time guard', () => {
    // Recorded so the guard's scope is not overstated: it proves a property of committed SQL, not of
    // any deployed database.
    const mentioning = migrations.filter((file) =>
      /cogniiq_readonly|club_operations_connections/i.test(readFileSync(file, 'utf8')),
    );
    expect(mentioning).toEqual([]);
  });
});

/* --------------------------------------------- Accepted D3 constraints */

describe('the accepted D3 constraints are recorded and consistent', () => {
  const contract = readFileSync(
    resolve(repoRoot, 'docs/club-operations/phase-d2-contract.md'),
    'utf8',
  );

  it('holds the values the owner accepted', () => {
    expect(D3_ACCEPTANCE_CONSTRAINTS).toEqual({
      connectionLimit: 24,
      supavisorPoolSize: 4,
      statementTimeout: '2s',
      supavisorPort: 6543,
      preparedStatements: false,
      clientPattern: 'per-request',
      signatureAlgorithm: 'Ed25519',
    });
  });

  it('the contract document states the same values, so the two cannot drift', () => {
    expect(contract).toContain('CONNECTION LIMIT 24');
    expect(contract).toContain(`pool size ${D3_ACCEPTANCE_CONSTRAINTS.supavisorPoolSize}`);
    expect(contract).toContain(`statement_timeout = '${D3_ACCEPTANCE_CONSTRAINTS.statementTimeout}'`);
    expect(contract).toContain('per-request');
    expect(contract).toContain('Ed25519');
  });

  it('the contract still records the failed criterion honestly', () => {
    // The owner's decision was explicit: the mis-grant failure stays on the record. A later edit that
    // quietly promotes all seven criteria to passing must break a test.
    expect(contract).toMatch(/criterion 3[\s\S]{0,400}\*\*FAIL/i);
    expect(contract).not.toMatch(/all seven criteria pass/i);
    expect(contract).toContain('overridable default');
  });

  it('the contract records the edge-runtime import requirement', () => {
    expect(contract).toMatch(/bundl\w+|\.ts.{0,20}specifier/i);
  });

  it('states plainly that only the local mechanism is proven', () => {
    // Asserted positively rather than by hunting for forbidden phrases. A negative phrase match
    // cannot tell an overclaim from its denial — the first version of this test failed on the very
    // sentence that disclaims the overclaim.
    expect(contract).toContain('disposable local stack');
    expect(contract).toContain('Not proven, and not claimed');
    expect(contract).toMatch(/No gateway role, migration or Edge Function exists/i);
  });

  it('records that the module stays inert', () => {
    expect(contract).toMatch(/club_operations.{0,60}(inactive|unavailable fallback)/is);
  });
});
