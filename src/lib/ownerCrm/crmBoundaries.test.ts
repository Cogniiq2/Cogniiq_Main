// ─────────────────────────────────────────────────────────────────────────────
// Structural guarantees about the owner CRM, enforced against the source itself
// rather than against a rendered screen.
//
// Two promises are being kept here, and both are the kind that decay quietly:
//
//   1. NO LEAKAGE. Sales notes, pipeline stages, estimated value, internal
//      commercial figures and the pre-offer cost assessment are owner-only.
//      The customer portal must not be able to import them even by accident —
//      an import is how a "just this one field" leak begins.
//
//   2. MANUAL ONLY. Leads exist because a human typed them. There is no
//      sourcing, no scraping, no enrichment and no automated outreach, and a
//      later contributor must not be able to add one without this test noticing.
//
// A rendering test cannot prove either. A file-level assertion can.
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { out = out.concat(walk(full)); continue; }
    if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Production sources only: a test file naturally names the things it forbids. */
function sourcesUnder(...dirs: string[]): { path: string; code: string }[] {
  return dirs
    .flatMap((d) => {
      try { return walk(join(ROOT, d)); } catch { return []; }
    })
    .filter((path) => !/\.test\.tsx?$/.test(path))
    .map((path) => ({ path: relative(ROOT, path), code: readFileSync(path, 'utf8') }));
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;

function importsOf(code: string): string[] {
  const out: string[] = [];
  for (const match of code.matchAll(IMPORT_RE)) out.push(match[1]);
  for (const match of code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(match[1]);
  return out;
}

const CRM_MODULES = ['@/lib/ownerCrm', '@/components/crm'];

describe('the customer portal cannot reach the CRM', () => {
  // Everything a logged-in customer can render lives under these three trees.
  const portal = sourcesUnder('pages/app', 'components/app', 'lib/customerPlatform');

  it('has portal sources to check at all', () => {
    // Guards the guard: a path typo would otherwise make this suite vacuous.
    expect(portal.length).toBeGreaterThan(5);
  });

  it('imports no CRM module anywhere under /app', () => {
    const violations: string[] = [];
    for (const { path, code } of portal) {
      for (const specifier of importsOf(code)) {
        if (CRM_MODULES.some((m) => specifier === m || specifier.startsWith(`${m}/`))) {
          violations.push(`${path} -> ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('never names a CRM RPC or table in portal code', () => {
    // Belt and braces: RLS already refuses a customer, but a portal screen that
    // asks at all is a bug worth failing the build over.
    const forbidden = [
      'owner_leads', 'owner_lead_activity', 'owner_lead_follow_ups',
      'owner_lead_integration_checks', 'owner_lead_service_interests',
      'owner_list_leads', 'owner_lead_detail', 'owner_command_center',
      'owner_convert_lead_to_customer', 'cogniiq_receptionist_leads',
    ];
    const violations: string[] = [];
    for (const { path, code } of portal) {
      for (const name of forbidden) {
        if (code.includes(name)) violations.push(`${path} -> ${name}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('the CRM reaches the server only through owner-gated RPCs', () => {
  const crm = sourcesUnder('lib/ownerCrm', 'components/crm');

  it('has CRM sources to check at all', () => {
    expect(crm.length).toBeGreaterThan(3);
  });

  it('touches Supabase from the API module only', () => {
    // One entry point means one place where authorization can be reasoned about.
    const violations = crm
      .filter(({ code }) => code.includes("from '@/lib/supabase'"))
      .map(({ path }) => path)
      .filter((path) => path !== join('lib', 'ownerCrm', 'api.ts'));
    expect(violations).toEqual([]);
  });

  it('never selects, inserts or updates a table directly from the browser', () => {
    // supabase.from(...) would bypass the SECURITY DEFINER rules entirely and
    // leave RLS as the only line of defence.
    const violations = crm
      .filter(({ code }) => /supabase\s*\.\s*from\s*\(/.test(code))
      .map(({ path }) => path);
    expect(violations).toEqual([]);
  });

  it('calls only owner_-prefixed RPCs', () => {
    const violations: string[] = [];
    for (const { path, code } of crm) {
      for (const match of code.matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)) {
        if (!match[1].startsWith('owner_')) violations.push(`${path} -> ${match[1]}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('leads are manual only', () => {
  const crm = sourcesUnder('lib/ownerCrm', 'components/crm');
  const crmPages = sourcesUnder('pages/owner')
    .filter(({ path }) => /Lead|CommandCenter/.test(path));

  it('has the CRM pages to check', () => {
    expect(crmPages.map((s) => s.path).sort()).toEqual([
      join('pages', 'owner', 'CommandCenterPage.tsx'),
      join('pages', 'owner', 'LeadDetailPage.tsx'),
      join('pages', 'owner', 'LeadsPage.tsx'),
    ]);
  });

  it('makes no network call of its own — no fetch, no third-party client', () => {
    // Sourcing, enrichment and outreach all need an outbound call. There is
    // none: every byte the CRM sends goes through the Supabase RPC layer.
    const violations: string[] = [];
    for (const { path, code } of [...crm, ...crmPages]) {
      if (/\bfetch\s*\(/.test(code)) violations.push(`${path} -> fetch()`);
      if (/\bXMLHttpRequest\b/.test(code)) violations.push(`${path} -> XMLHttpRequest`);
      if (/\bnavigator\.sendBeacon\b/.test(code)) violations.push(`${path} -> sendBeacon`);
    }
    expect(violations).toEqual([]);
  });

  it('exposes no sourcing, enrichment or outreach entry point', () => {
    const api = readFileSync(join(ROOT, 'lib/ownerCrm/api.ts'), 'utf8');
    const exported = Array.from(api.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)).map((m) => m[1]);

    expect(exported.length).toBeGreaterThan(10);
    // Every write is something a human does to Cogniiq's own records. Nothing
    // here fetches a prospect, enriches one, or contacts one.
    const forbidden = /scrape|enrich|source(?:Leads|Prospects)|discover|prospect|outreach|sequence|campaign|sendEmail|sendMail|dial|call(?:Prospect|Lead)/i;
    expect(exported.filter((name) => forbidden.test(name))).toEqual([]);
  });

  it('creates a lead only through the one manual RPC', () => {
    const api = readFileSync(join(ROOT, 'lib/ownerCrm/api.ts'), 'utf8');
    const creators = Array.from(api.matchAll(/\.rpc\(\s*['"](owner_\w+)['"]/gi))
      .map((m) => m[1])
      // A LEAD, not a task or a follow-up hanging off one.
      .filter((name) => /^owner_(create|import|bulk|insert)_lead$/.test(name));
    expect(creators).toEqual(['owner_create_lead']);
  });
});

describe('the CRM migration is locked down', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260903120000_owner_crm_sales_pipeline.sql'),
    'utf8',
  );

  const NEW_TABLES = [
    'owner_leads', 'owner_lead_service_interests', 'owner_lead_follow_ups',
    'owner_lead_activity', 'owner_lead_integration_checks',
  ];

  it('enables row level security on every new table', () => {
    for (const table of NEW_TABLES) {
      // Either named directly or driven by the loop over the table array.
      const enabled = migration.includes(`alter table public.${table} enable row level security`)
        || (migration.includes(`'${table}'`) && migration.includes("enable row level security', t"));
      expect(enabled, `${table} has no RLS`).toBe(true);
    }
  });

  it('revokes every new table from anon', () => {
    for (const table of NEW_TABLES) {
      const revoked = migration.includes(`revoke all on table public.${table} from public, anon, authenticated`)
        || (migration.includes(`'${table}'`) && migration.includes("revoke all on table public.%I from public, anon, authenticated"));
      expect(revoked, `${table} is not revoked from anon`).toBe(true);
    }
  });

  it('does not touch the legacy sourcing table, which another migration owns', () => {
    // 20260902120000_receptionist_leads_pii_rls.sql sets that table's access
    // matrix deliberately (sequence revoked, TRUNCATE withheld,
    // SELECT/INSERT/UPDATE/DELETE for owners). Re-granting the same table from
    // the CRM migration would silently narrow it, so this one only mentions it
    // in a comment.
    const statements = migration
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');
    expect(statements).not.toContain('cogniiq_receptionist_leads');
  });

  it('gates every browser-callable RPC on is_platform_owner()', () => {
    // The grant loop is the definitive list of what a browser may call. Each of
    // those functions must check the owner in its own body, because a grant to
    // `authenticated` is a grant to every logged-in customer.
    const grantBlock = migration.slice(migration.indexOf('foreach sig in array array['));
    const granted = Array.from(grantBlock.matchAll(/'(owner_\w+)\(/g)).map((m) => m[1]);

    expect(granted.length).toBeGreaterThan(15);
    expect(granted).toContain('owner_convert_lead_to_customer');
    expect(granted).toContain('owner_command_center');

    const ungated = granted.filter((name) => {
      const start = migration.indexOf(`create or replace function public.${name}(`);
      if (start === -1) return true;  // granted but never defined
      const body = migration.slice(start, migration.indexOf('\n$$;', start));
      return !body.includes('is_platform_owner()');
    });
    expect(ungated).toEqual([]);
  });

  it('keeps the internal helpers away from the browser entirely', () => {
    // These carry no owner check because no caller can reach them: they run only
    // inside a SECURITY DEFINER body that has already checked.
    for (const helper of ['owner_normalize_phone(text)', 'owner_record_lead_activity', 'owner_lead_refresh_follow_up(uuid)']) {
      expect(migration).toMatch(
        new RegExp(`revoke execute on function public\\.${helper.replace(/[()]/g, '\\$&')}[^;]*from public, anon, authenticated`),
      );
    }
  });

  it('leaves the legacy sourcing table closed, where its own migration put it', () => {
    const legacy = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql'),
      'utf8',
    );
    expect(legacy).toContain('cogniiq_receptionist_leads enable row level security');
    expect(legacy).toContain('revoke all on table public.cogniiq_receptionist_leads from public, anon, authenticated');
    // The identity sequence is a separate securable that `revoke ... on table`
    // does not reach.
    expect(legacy).toContain('revoke all on sequence public.cogniiq_receptionist_leads_id_seq from public, anon, authenticated');
  });

  it('never grants a CRM function to anon', () => {
    expect(migration).not.toMatch(/grant execute on function public\.owner_\w+[^;]*\bto\b[^;]*\banon\b/);
  });
});
