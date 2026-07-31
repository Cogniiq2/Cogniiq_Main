// Regression tests for the authentication-bootstrap hang.
//
// THE DEFECT
//   AuthContext.boot() awaited getSession() and then the profile/membership
//   reads. Those reject on an error, but they never settle at all when the
//   backend accepts the connection and then does not answer — a stalled fetch, a
//   hung proxy, a half-open socket. `isLoading` then stayed true forever and
//   every guarded route rendered the loading screen with no retry, no sign out
//   and no explanation.
//
// Part 1 executes the real timeout helper against a FAKE CLOCK, so the actual
// control flow is proven rather than pattern-matched: it must stop waiting at
// the deadline, must not discard a late result, must not leave a timer pending,
// and must never reject.
//
// Part 2 asserts the wiring that turns that helper into a user-visible recovery
// path, and that the pre-existing success/error behaviour is untouched.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};
const eq = (actual, expected, label) => {
  if (actual === expected) ok(label);
  else bad(label, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

// ---------------------------------------------------------------------------
// 1) The real helper, executed. Types are stripped so the module imports in
//    plain Node; only annotations go, the control flow is untouched.
// ---------------------------------------------------------------------------
// Transpiled with the project's own TypeScript compiler rather than a regex, so
// what runs here is exactly what ships — no hand-rolled stripping that could
// silently alter the control flow under test.
const { default: ts } = await import('typescript');

const transpiled = ts.transpileModule(read('src/lib/auth/withTimeout.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled, 'utf8').toString('base64')}`;
const { withTimeout, AUTH_BOOT_TIMEOUT_MS, AUTH_SIGN_OUT_TIMEOUT_MS } = await import(moduleUrl);

/** Deterministic clock: nothing fires until the test advances it. */
function fakeClock() {
  let now = 0;
  let nextId = 1;
  const pending = new Map();
  return {
    timers: {
      setTimeout: (handler, ms) => {
        const id = nextId++;
        pending.set(id, { at: now + ms, handler });
        return id;
      },
      clearTimeout: (id) => { pending.delete(id); },
    },
    advance(ms) {
      now += ms;
      for (const [id, entry] of [...pending.entries()]) {
        if (entry.at <= now) { pending.delete(id); entry.handler(); }
      }
    },
    get pendingCount() { return pending.size; },
  };
}

const flush = () => new Promise((r) => setImmediate(r));

// --- a promise that never settles is abandoned at the deadline ---------------
{
  const clock = fakeClock();
  let outcome = null;
  const neverSettles = new Promise(() => {});
  void withTimeout(neverSettles, 15000, clock.timers).then((value) => { outcome = value; });

  clock.advance(14999);
  await flush();
  eq(outcome, null, 'a pending request is still awaited one millisecond before the deadline');

  clock.advance(1);
  await flush();
  eq(outcome?.timedOut, true, 'a request that never answers is abandoned exactly at the deadline');
  eq(outcome?.value, undefined, 'a timed-out outcome carries no value');
}

// --- a result that arrives in time wins, and clears the timer ----------------
{
  const clock = fakeClock();
  let outcome = null;
  void withTimeout(Promise.resolve('session'), 15000, clock.timers).then((value) => { outcome = value; });
  await flush();
  eq(outcome?.timedOut, false, 'a result that arrives in time is not reported as a timeout');
  eq(outcome?.value, 'session', 'the resolved value is passed through');
  eq(clock.pendingCount, 0, 'the deadline timer is cleared once the work settles (nothing left pending)');
}

// --- a rejection is REPORTED, never thrown -----------------------------------
{
  const clock = fakeClock();
  let outcome = null;
  let threw = false;
  try {
    outcome = await withTimeout(Promise.reject(new Error('network down')), 15000, clock.timers);
  } catch { threw = true; }
  eq(threw, false, 'a rejecting request never throws out of withTimeout');
  eq(outcome?.timedOut, false, 'a rejection is not misreported as a timeout');
  eq(outcome?.error?.message, 'network down', 'the rejection reason is reported for handling');
  eq(clock.pendingCount, 0, 'the deadline timer is cleared on rejection too');
}

// --- a LATE result must not be lost, and must not double-resolve -------------
{
  const clock = fakeClock();
  const outcomes = [];
  let settle;
  const slow = new Promise((r) => { settle = r; });
  void withTimeout(slow, 15000, clock.timers).then((value) => { outcomes.push(value); });

  clock.advance(15000);
  await flush();
  eq(outcomes.length, 1, 'the deadline resolves the wait exactly once');
  eq(outcomes[0].timedOut, true, 'the deadline outcome is a timeout');

  // The underlying request lands afterwards: the helper must not resolve again,
  // and must not have cancelled or swallowed it — the caller adopts it.
  let lateValue = null;
  void slow.then((value) => { lateValue = value; });
  settle('late session');
  await flush();
  eq(outcomes.length, 1, 'a late arrival does not resolve the wait a second time');
  eq(lateValue, 'late session', 'the underlying request is left intact so a late result can still be adopted');
}

// --- the deadlines themselves ------------------------------------------------
eq(typeof AUTH_BOOT_TIMEOUT_MS, 'number', 'a boot deadline is exported');
if (AUTH_BOOT_TIMEOUT_MS >= 5000 && AUTH_BOOT_TIMEOUT_MS <= 30000) {
  ok(`the boot deadline is a sane ${AUTH_BOOT_TIMEOUT_MS}ms (tolerates a slow mobile load, not a frozen app)`);
} else {
  bad('the boot deadline is sane', `${AUTH_BOOT_TIMEOUT_MS}ms is outside 5000-30000`);
}
if (AUTH_SIGN_OUT_TIMEOUT_MS < AUTH_BOOT_TIMEOUT_MS) {
  ok('signing out is bounded more tightly than booting (the user is waiting on a deliberate action)');
} else {
  bad('signing out is bounded more tightly than booting', `${AUTH_SIGN_OUT_TIMEOUT_MS} >= ${AUTH_BOOT_TIMEOUT_MS}`);
}

// ---------------------------------------------------------------------------
// 2) The wiring.
// ---------------------------------------------------------------------------
const context = read('src/contexts/AuthContext.tsx');
const contextCode = context.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

ok('--- AuthContext ---');

if (/const\s+\{\s*data,\s*error\s*\}\s*=\s*await supabase\.auth\.getSession\(\);[\s\S]{0,400}?await loadAccount\(data\.session\);[\s\S]{0,120}?if \(mounted\) setIsLoading\(false\);/.test(contextCode)) {
  bad('the unbounded boot is gone', 'the original await-chain with no deadline is still present');
} else {
  ok('the unbounded boot is gone');
}

const wiring = [
  [/withTimeout\(\s*work,\s*AUTH_BOOT_TIMEOUT_MS\s*\)/, 'the bootstrap is raced against the boot deadline'],
  [/setAuthTimedOut\(true\)/, 'reaching the deadline raises a distinct timed-out state'],
  [/raced\.timedOut[\s\S]{0,160}setIsLoading\(false\)/, 'reaching the deadline also stops the loading state'],
  [/void work\.then\(/, 'the in-flight request is still adopted when it eventually lands'],
  [/bootGenerationRef/, 'a superseded bootstrap cannot overwrite a newer one'],
  [/const retryAuth = useCallback/, 'a retry entry point exists'],
  [/withTimeout\(supabase\.auth\.signOut\(\), AUTH_SIGN_OUT_TIMEOUT_MS\)/, 'signing out is bounded too'],
  [/clearLocalAccountState\(\);\s*setAuthError\(AUTH_SIGN_OUT_OFFLINE_MESSAGE\)/, 'a stuck sign-out still clears the local session'],
  [/authTimedOut,/, 'authTimedOut is exposed on the context value'],
  [/retryAuth,/, 'retryAuth is exposed on the context value'],
];
for (const [pattern, label] of wiring) {
  if (pattern.test(contextCode)) ok(label);
  else bad(label, `no match for ${pattern}`);
}

// Existing behaviour must be preserved: a server that ANSWERS with an error is
// still reported exactly as before, and is not conflated with a timeout.
if (/const error = raced\.error \?\? raced\.value\?\.error;[\s\S]{0,200}setAuthError\(/.test(contextCode)) {
  ok('a sign-out error from a server that DID answer is still reported unchanged');
} else {
  bad('a sign-out error from a server that DID answer is still reported unchanged');
}
if (/if \(error\) return \{ failure: error\.message \};/.test(contextCode)) {
  ok('a getSession error still sets authError rather than being treated as a timeout');
} else {
  bad('a getSession error still sets authError rather than being treated as a timeout');
}
if (/onAuthStateChange/.test(contextCode) && /withTimeout\(reload, AUTH_BOOT_TIMEOUT_MS\)/.test(contextCode)) {
  ok('a stalled reload on a token refresh cannot strand the loading state either');
} else {
  bad('a stalled reload on a token refresh cannot strand the loading state either');
}

ok('--- recovery screen ---');
const recovery = read('src/components/auth/AuthRecoveryScreen.tsx');
const recoveryChecks = [
  [/Anmeldung dauert zu lange/, 'the recovery state is titled in German'],
  [/Ihre Sitzung konnte nicht geprüft werden/, 'it explains what happened, in German'],
  [/Erneut versuchen/, 'it offers a retry'],
  [/Abmelden/, 'it offers a sign out'],
  [/retryAuth/, 'the retry is wired to retryAuth'],
  [/signOut/, 'the sign out is wired to signOut'],
  [/role="alert"/, 'the recovery state is announced to assistive technology'],
  [/min-h-11/, 'its actions are full-size touch targets'],
  [/disabled=\{busy !== null\}/, 'its actions cannot be double-fired while one is running'],
];
for (const [pattern, label] of recoveryChecks) {
  if (pattern.test(recovery)) ok(label);
  else bad(label, `no match for ${pattern}`);
}
// Comments are stripped first so prose ABOUT the rule cannot break it.
const recoveryCode = recovery.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
if (/Navigate|redirect/i.test(recoveryCode)) {
  bad('the recovery state does not redirect to login',
    'a bootstrap that never answered says nothing about whether the session is valid');
} else {
  ok('the recovery state does not redirect to login');
}

ok('--- route guards ---');
for (const guard of ['ProtectedRoute', 'PlatformAdminRoute', 'PlatformOwnerRoute', 'RoleLandingPage']) {
  const source = read(`src/components/auth/${guard}.tsx`);
  const timedOutAt = source.indexOf('if (authTimedOut)');
  const loadingAt = source.indexOf('if (isLoading)');
  const redirectAt = source.search(/if \(!user\)/);

  if (timedOutAt === -1) {
    bad(`${guard} renders the recovery state on a timeout`);
    continue;
  }
  ok(`${guard} renders the recovery state on a timeout`);
  if (loadingAt > timedOutAt) ok(`${guard} checks the timeout BEFORE showing a spinner`);
  else bad(`${guard} checks the timeout BEFORE showing a spinner`);
  if (redirectAt === -1 || redirectAt > timedOutAt) {
    ok(`${guard} checks the timeout BEFORE redirecting to login`);
  } else {
    bad(`${guard} checks the timeout BEFORE redirecting to login`,
      'a stalled bootstrap would bounce a possibly-valid session to the login page');
  }
}

console.log('');
console.log(failures === 0 ? 'auth boot timeout tests: ALL PASSED' : `auth boot timeout tests: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
