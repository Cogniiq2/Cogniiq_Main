// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SAFETY + BLAST-RADIUS REGRESSION SUITE.
//
// The offer portal is used by real customers with live links. Engagement
// tracking fires on every view and every 15 seconds thereafter. If any of that
// could reach a mail path, a customer would be emailed by the mere act of
// looking at their own offer.
//
// These tests read the ACTUAL migration source and the ACTUAL client modules
// and assert, structurally, that no such path exists. They are deliberately
// source-level rather than behavioural: a behavioural test can only prove that
// the paths it happened to exercise were safe, whereas grepping the whole
// migration proves no mail call was ADDED anywhere in it.
//
// Nothing in this file talks to a database. No row is written anywhere.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATION = 'supabase/migrations/20260827120000_owner_offer_engagement.sql';
const sql = readFileSync(resolve(process.cwd(), MIGRATION), 'utf8');

/** Function bodies only — comments in this file legitimately NAME the forbidden symbols. */
const executable = sql
  .split('\n')
  .filter((l) => !l.trimStart().startsWith('--'))
  .join('\n');

describe('engagement migration cannot produce customer communication', () => {
  it.each([
    'owner_automation_jobs',
    'owner_enqueue_automation_job',
    'owner_enqueue_offer_email',
    'owner_process_offer_acceptance',
    'record_offer_acceptance',
    'respond_offer_by_token',
    'owner_convert_offer_internal',
    'owner_retry_automation_job',
    'send-offer-document-email',
    'process-accepted-offer',
  ])('never references %s', (symbol) => {
    expect(executable).not.toContain(symbol);
  });

  it.each(['pg_net', 'net.http', 'http_post', 'http_get', 'extensions.http', 'supabase_functions'])(
    'performs no outbound call via %s', (symbol) => {
      expect(executable).not.toContain(symbol);
    });

  it('never writes any table outside its own three engagement tables', () => {
    const own = new Set([
      'public.owner_offer_engagement_sessions',
      'public.owner_offer_section_engagement',
      'public.owner_offer_engagement_events',
    ]);
    // Every INSERT INTO / UPDATE target in the executable body.
    const writes = [
      ...executable.matchAll(/\binsert\s+into\s+([a-z_.]+)/gi),
      ...executable.matchAll(/\bupdate\s+(public\.[a-z_]+)\s+set\b/gi),
    ].map((m) => m[1].toLowerCase());

    expect(writes.length).toBeGreaterThan(0);
    for (const target of writes) expect(own.has(target)).toBe(true);
  });

  it('never updates owner_offers — no status change, acceptance or conversion', () => {
    expect(/\bupdate\s+public\.owner_offers\b/i.test(executable)).toBe(false);
  });

  it.each([
    'owner_offer_acceptance_events',
    'owner_finance_notifications',
    'owner_invoices',
    'owner_document_access_events',
  ])('never writes %s', (table) => {
    expect(new RegExp(`insert\\s+into\\s+public\\.${table}`, 'i').test(executable)).toBe(false);
    expect(new RegExp(`update\\s+public\\.${table}`, 'i').test(executable)).toBe(false);
  });

  it('never increments token use_count — that counter gates acceptance via max_uses', () => {
    expect(executable).not.toContain('use_count');
  });
});

describe('engagement migration security posture', () => {
  it('grants anon exactly the three engagement RPCs and nothing else', () => {
    const anonGrants = [...executable.matchAll(/grant execute on function ([^\s(]+)\([^)]*\) to ([^;]+);/gi)]
      .filter((m) => m[2].includes('anon'))
      .map((m) => m[1]);
    expect(anonGrants.sort()).toEqual([
      'public.public_offer_engagement_event',
      'public.public_offer_engagement_heartbeat',
      'public.public_offer_engagement_start',
    ]);
  });

  it('never grants anon a table privilege', () => {
    const tableGrants = [...executable.matchAll(/grant [^;]*on table [^;]+;/gi)].map((m) => m[0]);
    for (const g of tableGrants) expect(g).not.toMatch(/\banon\b/);
  });

  it('revokes all table access from anon and enables RLS on every engagement table', () => {
    expect(executable).toContain('revoke all on table public.%I from public, anon, authenticated');
    expect(executable).toContain('alter table public.%I enable row level security');
    expect(executable).toContain('using (public.is_platform_owner())');
  });

  it('keeps the token-verification helper away from anon', () => {
    expect(executable).toContain('revoke execute on function public.owner_engagement_context(text) from public, anon, authenticated');
  });

  it('gates both owner read RPCs on is_platform_owner', () => {
    for (const fn of ['owner_offer_engagement_summary', 'owner_offer_engagement_overview']) {
      const body = executable.slice(executable.indexOf(`function public.${fn}`));
      expect(body.slice(0, 1200)).toContain("if not public.is_platform_owner() then raise exception 'Owner access required'");
    }
  });

  it('never persists a raw token, IP, user agent or any customer identity', () => {
    const tables = executable.slice(0, executable.indexOf('-- PUBLIC engagement RPCs'));
    for (const forbidden of ['token_hash', 'ip_address', 'ip_hash', 'user_agent', 'recipient_email', 'signer_name']) {
      expect(tables).not.toContain(forbidden);
    }
  });

  it('clamps heartbeat time against the SERVER clock and a hard ceiling', () => {
    const hb = executable.slice(executable.indexOf('function public.public_offer_engagement_heartbeat'));
    // accepted = greatest(0, least(client delta, server elapsed + grace, max))
    expect(hb).toContain('v_server_elapsed := floor(extract(epoch from (now() - s.last_heartbeat_at)))::int');
    expect(hb).toMatch(/v_accepted\s*:=\s*greatest\(0,\s*least\(/);
    expect(hb).toContain('c_max_delta constant int := 30');
  });

  it('binds every ANONYMOUS session lookup to the offer resolved from the token', () => {
    // A session id alone must never address a session; in the anon RPCs the offer always
    // co-keys it, so a link to offer A cannot read or write offer B's metrics. (The owner
    // read RPCs below are keyed by offer id directly — they are gated on is_platform_owner
    // instead, which the test above pins.)
    const anonSection = sql.slice(
      sql.indexOf('-- PUBLIC engagement RPCs'),
      sql.indexOf('-- OWNER read RPCs'),
    );
    expect(anonSection.length).toBeGreaterThan(0);
    const lookups = [...anonSection.matchAll(/from public\.owner_offer_engagement_sessions\s+where ([^;]+?)(?:for update|;)/gis)]
      .map((m) => m[1]);
    expect(lookups.length).toBeGreaterThanOrEqual(3);
    for (const w of lookups) expect(w).toContain('offer_id = ctx.offer_id');
  });
});

describe('the public engagement client never touches a business RPC', () => {
  const clientSources = [
    'src/lib/offerEngagement/api.ts',
    'src/lib/offerEngagement/tracker.ts',
    'src/lib/offerEngagement/useOfferEngagement.ts',
  ].map((f) => readFileSync(resolve(process.cwd(), f), 'utf8'));

  it.each([
    'respond_offer_by_token',
    'owner_enqueue_offer_email',
    'process-accepted-offer',
    'owner_automation_jobs',
    'functions.invoke',
  ])('never references %s', (symbol) => {
    for (const src of clientSources) {
      const executableSrc = src.split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')).join('\n');
      expect(executableSrc).not.toContain(symbol);
    }
  });

  it('does not re-enter public_offer_by_token from the heartbeat', () => {
    // Re-entering it would record a spurious 'viewed' access event, re-advance the offer
    // status and re-notify the owner on every single beat.
    for (const src of clientSources) {
      const executableSrc = src.split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')).join('\n');
      expect(executableSrc).not.toContain('public_offer_by_token');
    }
  });
});
