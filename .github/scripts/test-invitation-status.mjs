// Unit tests for the pure invitation status/result helpers. No test framework or Edge Function
// deployment required: the TypeScript source is transformed on the fly with esbuild (already a
// devDependency) and imported directly, so the tests exercise the real shipped logic.

import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(here, '../../src/lib/clientPlatform/invitationStatus.ts');
const ts = readFileSync(srcPath, 'utf8');
const { code } = transformSync(ts, { loader: 'ts', format: 'esm' });
const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failures += 1;
  }
}

const NOW = Date.parse('2026-07-21T12:00:00Z');
const past = '2026-07-01T00:00:00Z';
const future = '2026-08-01T00:00:00Z';

// effectiveInvitationStatus: a stored-pending invitation past its expiry behaves as expired.
assert(mod.effectiveInvitationStatus({ status: 'pending', expires_at: future }, NOW) === 'pending', 'live pending stays pending');
assert(mod.effectiveInvitationStatus({ status: 'pending', expires_at: past }, NOW) === 'expired', 'pending past expiry -> expired');
assert(mod.effectiveInvitationStatus({ status: 'pending', expires_at: null }, NOW) === 'pending', 'pending without expiry stays pending');
assert(mod.effectiveInvitationStatus({ status: 'accepted', expires_at: past }, NOW) === 'accepted', 'accepted stays accepted');
assert(mod.effectiveInvitationStatus({ status: 'revoked', expires_at: future }, NOW) === 'revoked', 'revoked stays revoked');
assert(mod.effectiveInvitationStatus({ status: 'expired', expires_at: past }, NOW) === 'expired', 'expired stays expired');

// Action gating.
assert(mod.canResendInvitation('pending') === true, 'pending is resendable');
assert(mod.canResendInvitation('expired') === false, 'expired is not normally resendable');
assert(mod.canResendInvitation('accepted') === false, 'accepted is not resendable');
assert(mod.canResendInvitation('revoked') === false, 'revoked is not resendable');
assert(mod.canRenewInvitation('expired') === true, 'expired is renewable');
assert(mod.canRenewInvitation('pending') === false, 'pending is not renewable');

// Email outcome mapping.
assert(mod.isResendEmailOk('sent') === true, 'sent counts as ok');
assert(mod.isResendEmailOk('existing_user') === true, 'existing_user counts as ok');
assert(mod.isResendEmailOk('email_error') === false, 'email_error is not ok');

// Messages must be accurate.
assert(/erneut gesendet/i.test(mod.resendOutcomeMessage('sent', false)), 'sent message mentions resend');
assert(/verifizierten login/i.test(mod.resendOutcomeMessage('existing_user', false)), 'existing_user message explains next-login access');
assert(/fehlgeschlagen/i.test(mod.resendOutcomeMessage('email_error', false)), 'email_error message reports failure');
assert(!/erneut gesendet|erneuert und/i.test(mod.resendOutcomeMessage('email_error', false)), 'email_error must not claim success');
assert(/erneuert/i.test(mod.resendOutcomeMessage('sent', true)), 'renewed+sent message mentions renewal');

if (failures) {
  console.error(`invitation status helper tests: ${failures} FAILED`);
  process.exit(1);
}
console.log('invitation status helper tests: ALL PASSED');
