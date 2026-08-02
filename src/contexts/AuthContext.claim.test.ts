import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Automatic invitation claiming must stay exactly where it is: once per authenticated user, inside
// the AuthContext account load. The confirmation page deliberately does not call the RPC, so a
// second call site would mean the claim runs twice per activation.

const CALL_PATTERN = /supabase\.rpc\(\s*['"]claim_my_client_invitations['"]\s*\)/;

const SRC = resolve(process.cwd(), 'src');

function read(relative: string): string {
  return readFileSync(resolve(SRC, relative), 'utf8');
}

function sourceFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter(
    (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file)
  );
}

describe('claim_my_client_invitations', () => {
  it('is still invoked from AuthContext, guarded per user', () => {
    const context = read('contexts/AuthContext.tsx');
    expect(CALL_PATTERN.test(context)).toBe(true);
    // The per-user ref is what stops token refreshes from re-running the claim.
    expect(context).toContain('claimedForUserRef.current !== userId');
  });

  it('is not duplicated by the confirmation page', () => {
    const page = read('pages/app/AuthConfirmationPage.tsx');
    expect(CALL_PATTERN.test(page)).toBe(false);
    expect(page).not.toContain('supabase.rpc');
  });

  it('has exactly one call site in the whole app', () => {
    const callSites = sourceFiles().filter((file) => CALL_PATTERN.test(read(file)));
    expect(callSites).toEqual(['contexts/AuthContext.tsx']);
  });
});
