// Unit tests for the pure post-login routing / open-redirect logic (src/lib/auth/authorizedRedirect).
// Bundled on the fly with esbuild (already a devDependency) — no test framework, no DB, no React.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, '../../src/lib/auth/authorizedRedirect.ts');
const result = await build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
const a = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

let failures = 0;
function eq(actual, expected, msg) {
  if (actual !== expected) { console.error(`FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); failures += 1; }
}
function ok(cond, msg) { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } }

const OWNER = { isPlatformAdmin: true, isPlatformOwner: true };
const ADMIN = { isPlatformAdmin: true, isPlatformOwner: false };
const CUSTOMER = { isPlatformAdmin: false, isPlatformOwner: false };

// ---- default destinations by role ----
eq(a.defaultDestinationForRole(OWNER), '/admin/finance/overview', 'owner default');
eq(a.defaultDestinationForRole(ADMIN), '/admin', 'admin default');
eq(a.defaultDestinationForRole(CUSTOMER), '/app', 'customer default');

// ---- sanitizeRedirect: accept known internal paths ----
eq(a.sanitizeRedirect('/app'), '/app', 'accept /app');
eq(a.sanitizeRedirect('/app/settings'), '/app/settings', 'accept /app/settings');
eq(a.sanitizeRedirect('/admin'), '/admin', 'accept /admin');
eq(a.sanitizeRedirect('/admin/finance/taxes'), '/admin/finance/taxes', 'accept /admin/finance/taxes');
eq(a.sanitizeRedirect('/admin/clients?x=1'), '/admin/clients?x=1', 'accept query string');

// ---- sanitizeRedirect: reject unsafe / external ----
eq(a.sanitizeRedirect(null), null, 'reject null');
eq(a.sanitizeRedirect(''), null, 'reject empty');
eq(a.sanitizeRedirect('https://evil.example'), null, 'reject absolute URL');
eq(a.sanitizeRedirect('//evil.example'), null, 'reject protocol-relative //');
eq(a.sanitizeRedirect('/\\evil.example'), null, 'reject backslash authority');
eq(a.sanitizeRedirect('/%2f%2fevil.example'), null, 'reject encoded-slash authority');
eq(a.sanitizeRedirect('javascript:alert(1)'), null, 'reject javascript: scheme');
eq(a.sanitizeRedirect('/marketing'), null, 'reject unknown internal prefix');
eq(a.sanitizeRedirect('/app x'), null, 'reject whitespace');

// ---- legacy mapping ----
eq(a.mapLegacyPath('/owner'), '/admin/finance/overview', 'legacy /owner');
eq(a.mapLegacyPath('/owner/taxes'), '/admin/finance/taxes', 'legacy /owner/taxes');
eq(a.mapLegacyPath('/owner/overview'), '/admin/finance/overview', 'legacy /owner/overview');
eq(a.mapLegacyPath('/owner/clients'), '/admin/clients', 'legacy /owner/clients -> CRM');
eq(a.mapLegacyPath('/owner/clients/abc'), '/admin/clients/abc', 'legacy /owner/clients/:id -> CRM');
eq(a.mapLegacyPath('/admin/login'), '/app/login', 'legacy /admin/login -> /app/login');
eq(a.sanitizeRedirect('/owner/taxes'), '/admin/finance/taxes', 'sanitize maps legacy redirect');

// ---- isPathAuthorized ----
ok(a.isPathAuthorized('/admin/finance/taxes', OWNER), 'owner may access finance');
ok(!a.isPathAuthorized('/admin/finance/taxes', ADMIN), 'admin may NOT access finance');
ok(a.isPathAuthorized('/admin/clients', ADMIN), 'admin may access CRM');
ok(a.isPathAuthorized('/admin', ADMIN), 'admin may access /admin');
ok(!a.isPathAuthorized('/admin', CUSTOMER), 'customer may NOT access /admin');
ok(a.isPathAuthorized('/app', CUSTOMER), 'customer may access /app');
ok(a.isPathAuthorized('/admin/oura-analytics', OWNER), 'owner may access oura');
ok(a.isPathAuthorized('/admin/clients', OWNER), 'owner may access CRM');

// ---- resolvePostLoginDestination ----
eq(a.resolvePostLoginDestination('/admin/finance/taxes', OWNER), '/admin/finance/taxes', 'owner authorized redirect preserved');
eq(a.resolvePostLoginDestination('/admin/clients', ADMIN), '/admin/clients', 'admin authorized redirect preserved');
eq(a.resolvePostLoginDestination('/admin/finance/taxes', ADMIN), '/admin', 'admin unauthorized finance redirect -> /admin default');
eq(a.resolvePostLoginDestination('/admin', CUSTOMER), '/app', 'customer unauthorized admin redirect -> /app default');
eq(a.resolvePostLoginDestination('//evil.example', OWNER), '/admin/finance/overview', 'owner external redirect rejected -> default');
eq(a.resolvePostLoginDestination(null, ADMIN), '/admin', 'no redirect -> admin default');
eq(a.resolvePostLoginDestination('/owner/taxes', OWNER), '/admin/finance/taxes', 'owner legacy redirect mapped + preserved');
eq(a.resolvePostLoginDestination('/owner/taxes', ADMIN), '/admin', 'admin legacy finance redirect -> /admin default');

if (failures) { console.error(`auth routing tests: ${failures} FAILED`); process.exit(1); }
console.log('auth routing tests: ALL PASSED');
