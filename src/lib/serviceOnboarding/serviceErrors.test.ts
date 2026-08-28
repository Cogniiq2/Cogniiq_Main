import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { describeServiceFailure } from '@/lib/serviceOnboarding/serviceErrors';

/**
 * The services panel used to discard the real error and show only
 * "Leistung konnte nicht hinzugefügt werden" plus the service name. When production returned
 * 23503 from the onboarding audit trigger, the owner therefore saw the same toast an expired
 * session produces, and the actual cause reached nobody.
 *
 * These tests fix the contract that replaced it: a useful sanitised sentence for the owner,
 * the raw error kept for developers, and no SQL in anything renderable.
 */
describe('describeServiceFailure', () => {
  let logged: unknown[][];

  beforeEach(() => {
    logged = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { logged.push(args); });
  });
  afterEach(() => { vi.restoreAllMocks(); });

  // The exact production payload.
  const AUDIT_FK = {
    code: '23503',
    message: 'insert or update on table "owner_audit_log" violates foreign key constraint "owner_audit_log_business_entity_id_fkey"',
    details: 'Key (business_entity_id)=(64e1b3cf-82c3-451c-b54c-636b86073903) is not present in table "owner_business_entities".',
  };

  it('turns the production foreign-key failure into an actionable sentence without leaking SQL', () => {
    const failure = describeServiceFailure(AUDIT_FK, 'AI Receptionist');

    expect(failure.kind).toBe('conflict');
    expect(failure.code).toBe('23503');
    // Specific about WHAT failed, and honest that retrying will not help.
    expect(failure.message).toContain('AI Receptionist');
    expect(failure.message).toContain('23503');
    expect(failure.message).toMatch(/erneuter Versuch ändert nichts/);
    // And nothing a database wrote is in the rendered text.
    expect(failure.message).not.toMatch(/owner_audit_log|foreign key|constraint|insert or update/i);
    expect(failure.message).not.toContain('64e1b3cf-82c3-451c-b54c-636b86073903');
  });

  it('keeps the original error for developer diagnostics and logs it exactly once', () => {
    const failure = describeServiceFailure(AUDIT_FK, 'AI Receptionist');

    expect(failure.cause).toBe(AUDIT_FK);
    expect(logged).toHaveLength(1);
    expect(logged[0][0]).toBe('[serviceOnboarding] RPC failed:');
    expect(logged[0][1]).toBe(AUDIT_FK);
  });

  it('separates a not-yet-migrated environment from a real failure', () => {
    const missing = describeServiceFailure(
      { code: 'PGRST202', message: 'Could not find the function public.owner_add_customer_service' },
      'AI Receptionist',
    );
    expect(missing.kind).toBe('missing');
    expect(missing.message).toMatch(/noch nicht aktiviert/);
    expect(missing.message).not.toMatch(/owner_add_customer_service/);
  });

  it('tells the owner to sign in again when the owner gate refused the call', () => {
    for (const err of [
      { code: '42501', message: 'permission denied for function owner_add_customer_service' },
      { code: 'P0001', message: 'Owner access required' },
    ]) {
      const failure = describeServiceFailure(err, 'AI Receptionist');
      expect(failure.kind).toBe('denied');
      expect(failure.message).toMatch(/neu an/);
    }
  });

  it('falls back to a plain sentence for an unclassified failure', () => {
    const failure = describeServiceFailure(new Error('network down'));
    expect(failure.kind).toBe('server');
    expect(failure.code).toBeNull();
    expect(failure.message).toBe('Die Leistung konnte nicht hinzugefügt werden. Bitte später erneut versuchen.');
    expect(failure.message).not.toContain('network down');
  });

  it('never renders "[object Object]" or an empty message, whatever it is handed', () => {
    for (const err of [null, undefined, {}, 'boom', 42, { code: '' }]) {
      const failure = describeServiceFailure(err, 'AI Receptionist');
      expect(failure.message.trim().length).toBeGreaterThan(0);
      expect(failure.message).not.toContain('[object Object]');
    }
  });
});
