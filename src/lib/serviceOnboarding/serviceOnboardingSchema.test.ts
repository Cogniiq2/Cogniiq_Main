// ─────────────────────────────────────────────────────────────────────────────
// The security and integrity promises of the service onboarding layer are made
// in SQL, so they are asserted against the SQL. A browser test cannot prove that
// a non-owner is refused, that a service cannot be added twice, or that go-live
// is genuinely gated — the database decides all three, and this file holds it to
// its own migration text.
//
// These tests fail loudly if a future edit weakens a grant, drops an owner check,
// removes a uniqueness constraint or quietly opens a table to anon.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SQL = readFileSync('supabase/migrations/20260830120000_client_service_onboarding.sql', 'utf8')
  .replace(/\r\n/g, '\n');

/** Every table this migration introduces. */
const TABLES = [
  'owner_customer_services',
  'owner_service_templates',
  'owner_service_template_sections',
  'owner_service_template_tasks',
  'owner_service_template_fields',
  'owner_service_engagements',
  'owner_engagement_sections',
  'owner_engagement_tasks',
  'owner_engagement_fields',
  'owner_engagement_appointment_types',
  'owner_engagement_activity',
];

/** Every RPC the browser is allowed to call. */
const PUBLIC_RPCS = [
  'owner_add_customer_service',
  'owner_set_customer_service_state',
  'owner_list_customer_services',
  'owner_engagement_detail',
  'owner_update_engagement',
  'owner_set_engagement_status',
  'owner_set_engagement_task',
  'owner_set_engagement_field',
  'owner_upsert_engagement_appointment_type',
  'owner_delete_engagement_appointment_type',
];

/**
 * Everything the migration actually grants to `authenticated`, read out of the grant loop
 * rather than restated by hand.
 *
 * This exists because the first version of this file only checked that each name in
 * PUBLIC_RPCS had an owner check — never the converse. `owner_engagement_go_live_blockers`
 * was granted to `authenticated` while carrying no owner check of its own, and the test
 * passed. Deriving the list from the file closes that hole permanently: a function can no
 * longer become browser-reachable without this test noticing.
 */
function grantedToAuthenticated(): string[] {
  const grants = SQL.slice(SQL.indexOf('-- 12. Grants'));
  return [...grants.matchAll(/^\s*'(\w+)\([^)]*\)',?$/gm)].map((m) => m[1]);
}

/** Isolate one function body so an assertion cannot accidentally match a neighbour. */
function functionBody(name: string): string {
  const start = SQL.indexOf(`create or replace function public.${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThan(-1);
  const end = SQL.indexOf('\n$$;', start);
  expect(end, `function ${name} is not terminated`).toBeGreaterThan(start);
  return SQL.slice(start, end);
}

/* ───────────────────────────── tables and RLS ───────────────────────────── */

describe('schema', () => {
  it('creates every table idempotently', () => {
    for (const table of TABLES) {
      expect(SQL, table).toContain(`create table if not exists public.${table} (`);
    }
  });

  it('enables row level security on every table', () => {
    // Ten tables go through the policy loop; the activity table is enabled explicitly
    // because it is append-only and therefore needs a narrower grant set.
    const looped = SQL.slice(SQL.indexOf('-- 5. RLS + grants'), SQL.indexOf('alter table public.owner_engagement_activity enable row level security'));
    for (const table of TABLES.filter((t) => t !== 'owner_engagement_activity')) {
      expect(looped, table).toContain(`'${table}'`);
    }
    expect(SQL).toContain('alter table public.owner_engagement_activity enable row level security');
    expect(SQL).toContain('execute format(\'alter table public.%I enable row level security\', t)');
  });

  it('gates every policy on is_platform_owner and gives anon nothing', () => {
    expect(SQL).toContain('using (public.is_platform_owner()) with check (public.is_platform_owner())');
    expect(SQL).toContain("revoke all on table public.%I from public, anon, authenticated");
    expect(SQL).toContain('revoke all on table public.owner_engagement_activity from public, anon, authenticated');
    // No table is ever granted back to anon.
    expect(SQL).not.toMatch(/grant\s+[a-z, ]*on table[^\n]*to[^\n]*\banon\b/i);
  });

  it('never grants write access on a table directly to the browser: writes go through RPCs', () => {
    const grants = SQL.slice(SQL.indexOf('-- 5. RLS + grants'));
    expect(grants).toContain("grant select on table public.%I to authenticated");
    expect(grants).not.toMatch(/grant[^\n]*insert[^\n]*to authenticated/);
    expect(grants).not.toMatch(/grant[^\n]*update[^\n]*to authenticated/);
    expect(grants).not.toMatch(/grant[^\n]*delete[^\n]*to authenticated/);
  });

  it('keeps the activity trail append-only for owners', () => {
    expect(SQL).toContain('grant select on table public.owner_engagement_activity to authenticated');
    expect(SQL).toContain('grant select, insert on table public.owner_engagement_activity to service_role');
    expect(SQL).not.toContain('owner_engagement_activity_owner_update');
    expect(SQL).not.toContain('owner_engagement_activity_owner_delete');
  });
});

/* ───────────────────────────── duplicate protection ─────────────────────── */

describe('duplicate protection', () => {
  it('makes a second copy of the same service impossible at the schema level', () => {
    expect(SQL).toContain('constraint owner_customer_services_unique unique (customer_id, service_key)');
  });

  it('binds an engagement one-to-one to its service row', () => {
    expect(SQL).toMatch(/customer_service_id uuid not null unique\s*\n\s*references public\.owner_customer_services\(id\)/);
  });

  it('instantiation returns the existing engagement instead of building a second one', () => {
    const fn = functionBody('owner_instantiate_service_engagement');
    expect(fn).toContain('select id into v_engagement from public.owner_service_engagements where customer_service_id = s.id');
    expect(fn).toContain('if v_engagement is not null then return v_engagement; end if;');
  });

  it('adding a service locks the customer row and is idempotency-keyed', () => {
    const fn = functionBody('owner_add_customer_service');
    expect(fn).toContain('owner_claim_idempotency');
    expect(fn).toContain('from public.owner_customers where id = p_customer_id for update');
  });

  it('re-adding an archived service reactivates it instead of wiping its history', () => {
    const fn = functionBody('owner_add_customer_service');
    expect(fn).toContain("set state = 'active'");
    expect(fn).not.toMatch(/delete from public\.owner_engagement/);
  });
});

/* ───────────────────────────── template versioning ──────────────────────── */

describe('template versioning', () => {
  it('records which template version an engagement was born from', () => {
    expect(SQL).toContain('template_code text');
    expect(SQL).toContain('template_version int');
    const fn = functionBody('owner_instantiate_service_engagement');
    expect(fn).toContain('v_template.code, v_template.version');
  });

  it('picks the highest active version for the service', () => {
    const fn = functionBody('owner_instantiate_service_engagement');
    expect(fn).toContain('where service_key = s.service_key and is_active');
    expect(fn).toContain('order by version desc limit 1');
  });

  it('copies template content into the engagement rather than referencing it', () => {
    const fn = functionBody('owner_instantiate_service_engagement');
    for (const table of ['owner_engagement_sections', 'owner_engagement_tasks', 'owner_engagement_fields']) {
      expect(fn, table).toContain(`insert into public.${table}`);
    }
    // Provenance links must not cascade: editing or removing a template row can
    // never delete a client's instantiated work.
    expect(SQL).toContain('template_task_id uuid references public.owner_service_template_tasks(id) on delete set null');
    expect(SQL).toContain('template_field_id uuid references public.owner_service_template_fields(id) on delete set null');
  });

  it('produces a usable engagement even when a service has no template yet', () => {
    const fn = functionBody('owner_instantiate_service_engagement');
    expect(fn).toContain('if v_template.id is null then return v_engagement; end if;');
  });
});

/* ───────────────────────────── go-live gate ─────────────────────────────── */

describe('go-live gate', () => {
  const gate = SQL.slice(
    SQL.indexOf('create or replace function public.owner_engagement_go_live_blockers'),
    SQL.indexOf('-- 8. Instantiation'),
  );

  it('counts an unfinished blocker task', () => {
    expect(gate).toContain('and t.is_go_live_blocker');
    expect(gate).toContain("and t.status <> 'complete'");
  });

  it('excludes not-applicable and out-of-scope healthcare items — the same rules as the UI engine', () => {
    expect(gate).toContain("and t.status <> 'not_applicable'");
    expect(gate).toContain('and (not t.healthcare_only or e.healthcare)');
    expect(gate).toContain('and not f.not_applicable');
    expect(gate).toContain('and (not f.healthcare_only or e.healthcare)');
  });

  it('counts a missing blocker field across every typed value column', () => {
    expect(gate).toContain('f.value_text is null and f.value_number is null');
    expect(gate).toContain('f.value_bool is null and f.value_date is null');
  });

  it('is ready only when nothing is left', () => {
    expect(gate).toContain("'ready', (select count(*) = 0 from all_blockers)");
  });

  it('refuses the production statuses while blockers remain — enforcement, not decoration', () => {
    const fn = functionBody('owner_set_engagement_status');
    expect(fn).toContain("if p_status in ('ready_for_go_live', 'live', 'monitoring') then");
    expect(fn).toContain('v_gate := public.owner_engagement_go_live_blockers(p_engagement_id);');
    expect(fn).toContain("raise exception 'Go-Live gesperrt: % offene Blocker'");
  });
});

/* ───────────────────────────── status rules ────────────────────────────── */

describe('task status rules', () => {
  it('refuses a blocked task without a reason, in the constraint and in the RPC', () => {
    expect(SQL).toContain('constraint owner_engagement_tasks_blocked_needs_reason check (');
    expect(SQL).toContain("status <> 'blocked' or length(trim(coalesce(blocker_reason, ''))) > 0");
    const fn = functionBody('owner_set_engagement_task');
    expect(fn).toContain("raise exception 'Ein blockierter Schritt braucht eine Begründung'");
  });

  it('refuses waiting-for-client without naming what is needed', () => {
    const fn = functionBody('owner_set_engagement_task');
    expect(fn).toContain("raise exception 'Bitte angeben, was genau vom Kunden benötigt wird'");
  });

  it('keeps completion metadata consistent with the status', () => {
    expect(SQL).toContain("(status = 'complete') = (completed_at is not null)");
    const fn = functionBody('owner_set_engagement_task');
    expect(fn).toContain("completed_at  = case when v_status = 'complete' then coalesce(completed_at, now()) else null end");
    expect(fn).toContain("completed_by  = case when v_status = 'complete' then coalesce(completed_by, auth.uid()) else null end");
  });

  it('validates the status against the allowed set', () => {
    const fn = functionBody('owner_set_engagement_task');
    expect(fn).toContain("if v_status not in ('not_started', 'in_progress', 'waiting_for_client', 'blocked', 'complete', 'not_applicable') then");
  });

  it('rejects an unknown lifecycle status', () => {
    const fn = functionBody('owner_set_engagement_status');
    expect(fn).toContain("raise exception 'invalid engagement status %'");
  });
});

/* ───────────────────────────── honesty constraints ──────────────────────── */

describe('integration honesty', () => {
  it('refuses a partial automation that does not document its limitation', () => {
    expect(SQL).toContain('constraint owner_service_engagements_partial_needs_limitation check (');
    expect(SQL).toContain("integration_mode is distinct from 'partial_automation'");
    const fn = functionBody('owner_update_engagement');
    expect(fn).toContain("raise exception 'Eine Teilautomatisierung muss ihre genaue Einschränkung dokumentieren'");
  });
});

/* ───────────────────────────── audit trail ─────────────────────────────── */

describe('activity trail', () => {
  it('records the events that matter later', () => {
    for (const event of [
      'engagement_created', 'service_state_changed', 'status_changed', 'task_status_changed',
      'blocker_resolved', 'go_live_readiness_changed', 'field_set', 'integration_mode_changed',
      'healthcare_changed', 'appointment_type_added',
    ]) {
      expect(SQL, event).toContain(`'${event}'`);
    }
  });

  it('records a field only when it changes between empty and filled, never per keystroke', () => {
    const fn = functionBody('owner_set_engagement_field');
    expect(fn).toContain('if v_had is distinct from v_has then');
  });

  it('notes when go-live readiness flips in either direction', () => {
    const fn = functionBody('owner_set_engagement_task');
    expect(fn).toContain("if (v_gate_before->>'ready') is distinct from (v_gate_after->>'ready') then");
  });
});

/* ───────────────────────────── authorization ────────────────────────────── */

describe('authorization', () => {
  it('every browser-callable RPC checks owner access first', () => {
    for (const name of PUBLIC_RPCS) {
      const fn = functionBody(name);
      expect(fn, name).toContain("if not public.is_platform_owner() then raise exception 'Owner access required'; end if;");
    }
  });

  it('grants EXACTLY the browser-callable set to authenticated — nothing may sneak in', () => {
    expect(grantedToAuthenticated().sort()).toEqual([...PUBLIC_RPCS].sort());
  });

  it('the go-live gate is NOT reachable from a browser role', () => {
    // SECURITY DEFINER with no owner check of its own: reachable from `authenticated` it
    // would leak blocker titles, reasons and client requests for any engagement id.
    expect(grantedToAuthenticated()).not.toContain('owner_engagement_go_live_blockers');
    expect(SQL).toContain('revoke execute on function public.owner_engagement_go_live_blockers(uuid) from public, anon, authenticated');
    expect(SQL).toContain('grant execute on function public.owner_engagement_go_live_blockers(uuid) to service_role');
  });

  it('does not name an RPC after a table, which would collide in the PostgREST surface', () => {
    const tables = new Set(TABLES);
    for (const name of PUBLIC_RPCS) {
      expect(tables.has(name), `${name} collides with a table of the same name`).toBe(false);
    }
  });

  it('every function is SECURITY DEFINER with a pinned search_path', () => {
    // Signatures wrap differently across the file, so the header is matched up to the end of
    // the `returns` line rather than assuming a particular line break.
    const definitions = SQL.match(/create or replace function public\.\w+\([^)]*\)\s*returns [^\n]*/g) ?? [];
    // Every browser-callable RPC, plus the go-live gate and the two internal helpers
    // (activity recorder, instantiation).
    expect(definitions.length).toBe(PUBLIC_RPCS.length + 3);
    for (const definition of definitions) {
      expect(definition, definition).toContain('security definer');
      expect(definition, definition).toContain('set search_path = public, pg_temp');
    }
  });

  it('revokes execute from anon and grants only to authenticated and service_role', () => {
    const grants = SQL.slice(SQL.indexOf('-- 12. Grants'));
    for (const name of PUBLIC_RPCS) {
      expect(grants, name).toContain(`'${name}(`);
    }
    expect(grants).toContain("revoke execute on function public.%s from public, anon");
    expect(grants).toContain("grant execute on function public.%s to authenticated, service_role");
  });

  it('keeps the internal helpers out of the browser entirely', () => {
    expect(SQL).toContain('revoke execute on function public.owner_record_engagement_activity(uuid, text, text, uuid, text) from public, anon, authenticated');
    expect(SQL).toContain('revoke execute on function public.owner_instantiate_service_engagement(uuid) from public, anon, authenticated');
  });
});

/* ───────────────────────────── additivity ───────────────────────────────── */

describe('additivity', () => {
  it('does not redefine or drop anything the finance and customer migrations own', () => {
    expect(SQL).not.toContain('create or replace function public.owner_customer_detail');
    expect(SQL).not.toContain('create or replace function public.owner_list_customers');
    expect(SQL).not.toMatch(/drop table/i);
    expect(SQL).not.toMatch(/drop function/i);
    expect(SQL).not.toMatch(/alter table public\.owner_customers/i);
    expect(SQL).not.toMatch(/alter table public\.owner_offers/i);
  });

  it('only drops the objects it re-creates in the same file', () => {
    const drops = SQL.match(/drop (trigger|policy) if exists/g) ?? [];
    expect(drops.length).toBeGreaterThan(0);
    expect(SQL).not.toMatch(/drop (trigger|policy)(?! if exists)/);
  });

  it('stores credential STATUS only — no secret ever lands in a browser-readable column', () => {
    expect(SQL).not.toMatch(/\b(api_key|secret|password|token|private_key)\b\s+text/i);
    expect(SQL).toContain('credential fields record STATUS only');
  });

  it('reuses the existing helpers instead of inventing a weaker authorization system', () => {
    expect(SQL).toContain('public.set_updated_at()');
    expect(SQL).toContain('public.owner_write_audit_row(');
    expect(SQL).toContain('public.owner_claim_idempotency(');
    expect(SQL).toContain('public.owner_record_customer_activity(');
  });
});
