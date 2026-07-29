// Executable + structural tests for the customer-facing failure surface.
//
// Two defects are guarded here:
//
//  1. RAW ERROR LEAKAGE. Every customer page renders the hook's `error` string
//     directly. Before the fix, that string was the raw Supabase/PostgREST
//     `error.message` — English platform text naming schema objects and function
//     signatures ("permission denied for function public.list_customer_invoices").
//     This asserts the translation layer is in place AND that it never returns
//     the raw text under any branch.
//
//  2. STALE QUERIES. `useOrganizationScopedLoad` omitted `loader` from its
//     dependency array, so a param-only route change (which reuses the same
//     component instance rather than remounting) never refired the request and
//     the previous project's rows stayed on screen.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (condition, label) => {
  if (condition) {
    console.log(`ok: ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL: ${label}`);
  }
};

// ---------------------------------------------------------------------------
// 1) The translator itself, executed rather than pattern-matched.
// ---------------------------------------------------------------------------
// The module is TypeScript; strip the types so it can be imported in plain Node.
// Only annotations and `export const/function` markers are removed — the control
// flow under test is untouched.
const source = read('src/lib/customerPlatform/customerErrors.ts');

const stripped = source
  .replace(/^import type .*$/gm, '')
  .replace(/: unknown\b/g, '')
  .replace(/: string\b/g, '')
  .replace(/error is Error/g, '')
  .replace(/ as \{[^}]*\}/g, '')
  .replace(/\{ message\?[^}]*\}/g, 'Object');

const moduleUrl = `data:text/javascript;base64,${Buffer.from(stripped, 'utf8').toString('base64')}`;
const errors = await import(moduleUrl);
const { toCustomerFacingError, CUSTOMER_ERROR_SESSION_EXPIRED, CUSTOMER_ERROR_OFFLINE, CUSTOMER_ERROR_FORBIDDEN } = errors;

// Silence the intentional console.error diagnostics while asserting on returns.
const realConsoleError = console.error;
const logged = [];
console.error = (...args) => { logged.push(args); };

const FALLBACK = 'Die Rechnungen konnten nicht geladen werden.';

// The exact shapes PostgREST / supabase-js actually produce.
const RAW_PERMISSION = {
  code: '42501',
  message: 'permission denied for function public.list_customer_invoices',
  details: null,
  hint: null,
};
const RAW_MISSING_RELATION = {
  code: '42P01',
  message: 'relation "public.customer_documents" does not exist',
};
const RAW_JWT = { code: 'PGRST301', message: 'JWT expired' };
const RAW_NETWORK = new TypeError('Failed to fetch');
const RAW_RLS_CONSTRAINT = {
  code: '23514',
  message: 'new row for relation "customer_documents" violates check constraint "customer_documents_exactly_one_source"',
};

const cases = [
  [RAW_PERMISSION, CUSTOMER_ERROR_FORBIDDEN, 'permission denial becomes the German authorization message'],
  [RAW_JWT, CUSTOMER_ERROR_SESSION_EXPIRED, 'expired JWT becomes the German re-login message'],
  [RAW_NETWORK, CUSTOMER_ERROR_OFFLINE, 'a fetch failure becomes the German connectivity message'],
  [RAW_MISSING_RELATION, FALLBACK, 'an unrecognised backend error collapses to the surface fallback'],
  [RAW_RLS_CONSTRAINT, FALLBACK, 'raw constraint text collapses to the surface fallback'],
  ['authentication required', CUSTOMER_ERROR_SESSION_EXPIRED, 'the RPC null-auth.uid() guard reads as an expired session'],
  [null, FALLBACK, 'a null error still yields German copy, never "null"'],
  [undefined, FALLBACK, 'an undefined error still yields German copy, never "undefined"'],
];

for (const [input, expected, label] of cases) {
  ok(toCustomerFacingError(input, FALLBACK) === expected, label);
}

// The central property: no internal token from ANY of these inputs survives into
// the returned string.
const INTERNAL_TOKENS = [
  'permission denied', 'public.', 'relation', 'constraint', 'PGRST', '42501', '42P01',
  'customer_documents', 'list_customer_invoices', 'JWT', 'Failed to fetch',
];
for (const [input] of cases) {
  const returned = toCustomerFacingError(input, FALLBACK);
  for (const token of INTERNAL_TOKENS) {
    if (returned.includes(token)) {
      failures += 1;
      console.error(`FAIL: internal token "${token}" leaked into customer copy: ${returned}`);
    }
  }
}
ok(true, 'no internal token from any tested backend error reaches customer copy');

// Every branch must still be developer-diagnosable.
ok(logged.length === cases.length * 2, 'every translated failure is logged in full to the console');

console.error = realConsoleError;

// All returned strings are German customer copy, not codes.
for (const message of [CUSTOMER_ERROR_SESSION_EXPIRED, CUSTOMER_ERROR_OFFLINE, CUSTOMER_ERROR_FORBIDDEN]) {
  ok(/[a-zäöüß]/.test(message) && message.trim().endsWith('.'), `customer message is a complete German sentence: "${message}"`);
}
ok(/erneut an/.test(CUSTOMER_ERROR_SESSION_EXPIRED), 'the expired-session message tells the customer to sign in again');
ok(/erneut/.test(CUSTOMER_ERROR_OFFLINE), 'the connectivity message points at a retry');

// ---------------------------------------------------------------------------
// 2) The API layer routes every failure through the translator.
// ---------------------------------------------------------------------------
const customerApi = read('src/lib/customerPlatform/customerApi.ts');
const customerApiCode = customerApi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

ok(/toCustomerFacingError/.test(customerApiCode), 'customerApi imports the translator');
ok(!/error instanceof Error \? error\.message/.test(customerApiCode),
  'customerApi no longer places a raw error.message into a customer-visible string');

// Each `fail(...)` call must supply a German fallback sentence.
const failCalls = customerApiCode.match(/fail<[^>]*>\([^;]*?\);/gs) ?? [];
ok(failCalls.length >= 6, `every RPC wrapper reports through fail() (found ${failCalls.length})`);
for (const call of failCalls) {
  ok(/'[^']*konnte[^']*'|'[^']*Konnte[^']*'/.test(call),
    `fail() call carries a German fallback: ${call.replace(/\s+/g, ' ').slice(0, 80)}…`);
}

// ---------------------------------------------------------------------------
// 3) The workspace hook: no raw auth error, and no stale query.
// ---------------------------------------------------------------------------
const hook = read('src/hooks/useCustomerWorkspace.ts');
const hookCode = hook.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

ok(!/setError\(authError\)/.test(hookCode),
  'the raw authError string is never placed straight into customer-visible state');
ok(/toCustomerFacingError\(authError/.test(hookCode),
  'the auth-layer error is translated before it reaches a customer surface');

const deps = /\}, \[([^\]]*)\]\);/.exec(hookCode);
ok(deps !== null, 'the load callback declares a dependency array');
const depList = (deps?.[1] ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
ok(depList.includes('loader'),
  `loader is a dependency of load, so a project-id change refetches (got ${JSON.stringify(depList)})`);
ok(!/eslint-disable-next-line react-hooks\/exhaustive-deps/.test(hookCode),
  'no exhaustive-deps suppression remains hiding a missing dependency');
ok(/fallbackRef/.test(hookCode),
  'the inline `fallback` literal is held in a ref rather than becoming a render-identity dependency');

// ---------------------------------------------------------------------------
// 4) Partial data is never presented as a fact.
// ---------------------------------------------------------------------------
const projectDetail = read('src/pages/app/ProjectDetailPage.tsx');
ok(/milestonesStatus === 'ready'/.test(projectDetail),
  '"Kein offener Meilenstein" is claimed only after the milestones actually loaded');
ok(/milestonesStatus === 'error'/.test(projectDetail),
  'a failed milestone load reads as unknown, not as "no open milestone"');

// ---------------------------------------------------------------------------
// 5) No PostgREST filter expression is built from an unvalidated value.
// ---------------------------------------------------------------------------
const ownerApi = read('src/lib/customerPlatform/ownerProjectsApi.ts');
ok(/isUuid\(input\.organizationId\) && isUuid\(input\.clientAccountId\)/.test(ownerApi),
  'the .or() filter expression is only built from UUID-shaped ids');

console.log(failures === 0 ? '\ncustomer error-surface tests: ALL PASSED' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
