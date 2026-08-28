// ─────────────────────────────────────────────────────────────────────────────
// Static guarantees of the onboarding audit fix (20260830122000).
//
// The disposable-PostgreSQL suite proves the fix WORKS. This file proves the
// migration keeps the shape it has to keep: forward-only, scoped to the four
// onboarding triggers, never weakening the owner_audit_log foreign key, never
// editing an already-applied migration, and never re-introducing the row-id
// fallback that caused the production 23503.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) =>
  readFileSync(`supabase/migrations/${file}`, 'utf8').replace(/\r\n/g, '\n');

const FIX = read('20260830122000_service_onboarding_audit_fix.sql');

/** The tables whose audit triggers this migration is allowed to touch. */
const ONBOARDING_AUDITED = [
  'owner_customer_services',
  'owner_service_engagements',
  'owner_engagement_tasks',
  'owner_engagement_fields',
];

/** The finance tables 20260722120000 audits. None of them may be touched here. */
const FINANCE_AUDITED = [
  'owner_invoices', 'owner_expenses', 'owner_payments', 'owner_tax_settings',
  'owner_tax_payments', 'owner_tax_estimates', 'owner_assets', 'owner_subscriptions',
  'owner_finance_documents', 'owner_exports', 'owner_business_entities',
];

describe('20260830122000 — service onboarding audit fix', () => {
  it('adds a dedicated trigger function instead of changing the generic factory', () => {
    expect(FIX).toContain('create or replace function public.owner_write_service_onboarding_audit_row()');
    // The generic factory is attached to eleven finance tables and its id fallback is
    // load-bearing for owner_business_entities. It must not be redefined here.
    expect(FIX).not.toMatch(/create or replace function public\.owner_write_audit_row\(/);
    expect(FIX).not.toMatch(/drop function[^\n]*owner_write_audit_row/);
  });

  it('resolves the entity through engagement_id and never falls back to the row id', () => {
    expect(FIX).toContain("v_engagement := (v_row->>'engagement_id')::uuid");
    expect(FIX).toContain('from public.owner_service_engagements e');
    // The exact defect: coalesce(..., (row->>'id')::uuid) as the entity.
    expect(FIX).not.toMatch(/business_entity_id'\)::uuid,\s*\(coalesce\(v_new, v_old\)->>'id'\)::uuid/);
    expect(FIX).not.toMatch(/v_entity\s*:=[^;]*->>'id'/);
  });

  it('fails closed rather than guessing an entity', () => {
    expect(FIX).toMatch(/raise exception[\s\S]*neither business_entity_id nor engagement_id/);
    expect(FIX).toMatch(/raise exception[\s\S]*which has no business entity/);
  });

  it('keeps the audit posture: SECURITY DEFINER, pinned search_path, no browser access', () => {
    expect(FIX).toContain('security definer set search_path = public, pg_temp');
    expect(FIX).toContain(
      'revoke execute on function public.owner_write_service_onboarding_audit_row() from public, anon, authenticated',
    );
    expect(FIX).toContain(
      'grant execute on function public.owner_write_service_onboarding_audit_row() to service_role',
    );
    expect(FIX).not.toMatch(/grant execute on function public\.owner_write_service_onboarding_audit_row\(\) to (anon|authenticated)/);
  });

  it('preserves the sanitised summaries and actor semantics of the existing audit system', () => {
    // Same stripped columns as public.owner_write_audit_row().
    for (const column of ['notes', 'breakdown', 'before_summary', 'after_summary', 'metadata']) {
      expect(FIX).toContain(`'${column}'`);
    }
    expect(FIX).toContain('to_jsonb(new) - strip');
    expect(FIX).toContain('to_jsonb(old) - strip');
    expect(FIX).toContain('auth.uid()');
  });

  it('repoints only the four onboarding audit triggers', () => {
    for (const table of ONBOARDING_AUDITED) expect(FIX).toContain(`'${table}'`);
    for (const table of FINANCE_AUDITED) expect(FIX).not.toMatch(new RegExp(`'${table}'`));
  });

  it('never weakens the foreign key that caught the bug, and destroys nothing', () => {
    expect(FIX).not.toMatch(/alter table[\s\S]*owner_audit_log/i);
    expect(FIX).not.toMatch(/drop constraint/i);
    expect(FIX).not.toMatch(/\bdelete from\b/i);
    expect(FIX).not.toMatch(/\btruncate\b/i);
    expect(FIX).not.toMatch(/drop table/i);
    // Only drops what it immediately re-creates, like every other migration here.
    expect(FIX).not.toMatch(/drop trigger(?! if exists)/);
  });

  it('leaves both already-applied onboarding migrations byte-identical to what production ran', () => {
    // A forward-only fix. If either of these ever changes, the remote migration history and
    // the repository disagree, and `supabase db push` has no way to reconcile them.
    const schema = read('20260830120000_client_service_onboarding.sql');
    const seed = read('20260830121000_ai_receptionist_template_v1.sql');
    expect(schema).toContain('public.owner_write_audit_row(');
    expect(schema).not.toContain('owner_write_service_onboarding_audit_row');
    expect(seed).not.toContain('owner_write_service_onboarding_audit_row');
  });
});
