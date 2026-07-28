// EXECUTABLE tests for the customer document download Edge Function handler.
//
// The handler is transpiled with the repo's TypeScript dependency and imported as a
// data URL (the same technique already used by test-signature-offer-portal.mjs), so
// no Deno runtime is required. Unlike a source-text assertion, these tests RUN the
// real control flow with fake deps and spies, which is the only way to prove that:
//   * the JWT is verified BEFORE any authorization or URL minting happens,
//   * every denial reason produces one indistinguishable 404,
//   * the success body contains no bucket id and no object path,
//   * the signed URL is requested with the intended TTL,
//   * the audit event fires exactly once on success and never on a denial.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const src = read('supabase/functions/customer-document-download/handler.ts');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const { handleDownloadRequest, SIGNED_URL_TTL_SECONDS } = mod;

// ---------------------------------------------------------------- fake deps + spies
function makeDeps(overrides = {}) {
  const calls = { verifyJwt: [], authorize: [], mintSignedUrl: [], recordEvent: [] };
  const deps = {
    verifyJwt: async (token) => { calls.verifyJwt.push([token]); return 'user-1'; },
    authorize: async (callerId, documentId) => {
      calls.authorize.push([callerId, documentId]);
      return { bucketId: 'customer-documents', objectPath: 'org-a/_org/dpa.pdf' };
    },
    mintSignedUrl: async (bucketId, objectPath, expiresIn) => {
      calls.mintSignedUrl.push([bucketId, objectPath, expiresIn]);
      return 'https://storage.example/signed?token=abc';
    },
    recordEvent: async (callerId, documentId, eventType) => {
      calls.recordEvent.push([callerId, documentId, eventType]);
    },
    ...overrides,
  };
  return { deps, calls };
}

const AUTH = 'Bearer real-jwt';

// ---------------------------------------------------------------- happy path
{
  const { deps, calls } = makeDeps();
  const res = await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1' });

  ok(res.status === 200, 'authorized request returns 200');
  ok(calls.verifyJwt.length === 1 && calls.verifyJwt[0][0] === 'real-jwt', 'the bearer token is verified exactly once');
  ok(calls.authorize.length === 1 && calls.authorize[0][0] === 'user-1',
    'authorization uses the VERIFIED caller id, not a client-supplied one');

  // The response object is inspected directly, so a stray key fails the test —
  // something a source grep for "objectPath" could never guarantee.
  const keys = Object.keys(res.body).sort();
  ok(JSON.stringify(keys) === JSON.stringify(['expires_in', 'url']),
    `success body has exactly {url, expires_in} (got ${JSON.stringify(keys)})`);
  const serialized = JSON.stringify(res.body);
  ok(!serialized.includes('customer-documents'), 'success body leaks no bucket id');
  ok(!serialized.includes('org-a/_org/dpa.pdf'), 'success body leaks no object path');
  ok(res.body.expires_in === SIGNED_URL_TTL_SECONDS, 'success body reports the real TTL');
}

// ---------------------------------------------------------------- TTL is the intended value
{
  const { deps, calls } = makeDeps();
  await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1' });
  ok(calls.mintSignedUrl.length === 1, 'exactly one signed URL is minted');
  ok(calls.mintSignedUrl[0][2] === 600, 'signed URL is requested with a 600s (10 minute) expiry');
  ok(SIGNED_URL_TTL_SECONDS === 600, 'the exported TTL constant is 600 seconds');
}

// ---------------------------------------------------------------- auth failures short-circuit
for (const [label, header] of [
  ['missing authorization header', null],
  ['empty authorization header', ''],
  ['non-bearer scheme', 'Basic abc'],
  ['bearer with no token', 'Bearer   '],
]) {
  const { deps, calls } = makeDeps();
  const res = await handleDownloadRequest(deps, { authorizationHeader: header, documentId: 'doc-1' });
  ok(res.status === 401, `${label} -> 401`);
  ok(calls.verifyJwt.length === 0, `${label}: no JWT verification attempted`);
  ok(calls.authorize.length === 0, `${label}: authorization never reached`);
  ok(calls.mintSignedUrl.length === 0, `${label}: no signed URL minted`);
  ok(calls.recordEvent.length === 0, `${label}: nothing audited`);
}

{
  // A syntactically valid but unverifiable token must never reach authorization.
  const { deps, calls } = makeDeps({ verifyJwt: async () => null });
  const res = await handleDownloadRequest(deps, { authorizationHeader: 'Bearer forged', documentId: 'doc-1' });
  ok(res.status === 401, 'invalid JWT -> 401');
  ok(calls.authorize.length === 0, 'invalid JWT: authorization never reached');
  ok(calls.mintSignedUrl.length === 0, 'invalid JWT: no signed URL minted');
}

// ---------------------------------------------------------------- all denials are identical
{
  // The DB function collapses cross-org / suspended / invisible / archived / missing
  // into a single null, and the handler must not re-expand them.
  const bodies = new Set();
  const statuses = new Set();
  for (const _reason of ['cross_org', 'suspended', 'invisible', 'archived', 'nonexistent']) {
    const { deps, calls } = makeDeps({ authorize: async () => null });
    const res = await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-x' });
    statuses.add(res.status);
    bodies.add(JSON.stringify(res.body));
    ok(calls.mintSignedUrl.length === 0, `${_reason}: no signed URL minted on denial`);
    ok(calls.recordEvent.length === 0, `${_reason}: denial is not audited as url_issued`);
  }
  ok(statuses.size === 1 && statuses.has(404), 'every denial reason returns the same 404 status');
  ok(bodies.size === 1, 'every denial reason returns a byte-identical body (no existence oracle)');
}

// ---------------------------------------------------------------- bad input
{
  const { deps, calls } = makeDeps();
  const res = await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: '   ' });
  ok(res.status === 400, 'blank document id -> 400');
  ok(calls.authorize.length === 0, 'blank document id: authorization never reached');
}
{
  const { deps } = makeDeps();
  const res = await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: { id: 'x' } });
  ok(res.status === 400, 'non-string document id -> 400');
}

// ---------------------------------------------------------------- storage failure
{
  const { deps, calls } = makeDeps({ mintSignedUrl: async () => null });
  const res = await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1' });
  ok(res.status === 502, 'signed URL failure -> 502');
  ok(calls.recordEvent.length === 0, 'no url_issued audited when no URL was actually issued');
}

// ---------------------------------------------------------------- audit correctness
{
  const { deps, calls } = makeDeps();
  await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1' });
  ok(calls.recordEvent.length === 1, 'exactly one audit event on success');
  ok(calls.recordEvent[0][2] === 'url_issued',
    'the audited event is named url_issued (not viewed/downloaded, which we cannot observe)');
  ok(calls.recordEvent[0][0] === 'user-1' && calls.recordEvent[0][1] === 'doc-1',
    'the audit event records the verified caller and the requested document');
}

// ---------------------------------------------------------------- pointer rows use the canonical bucket
{
  const { deps, calls } = makeDeps({
    authorize: async () => ({ bucketId: 'owner-finance-documents', objectPath: 'invoices/a-v1.pdf' }),
  });
  const res = await handleDownloadRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-ptr' });
  ok(res.status === 200, 'a canonical-registry pointer resolves successfully');
  ok(calls.mintSignedUrl[0][0] === 'owner-finance-documents',
    'pointer rows mint against the canonical owner bucket (no duplicated PDF)');
  ok(!JSON.stringify(res.body).includes('owner-finance-documents'),
    'the owner bucket name never reaches the response body');
}

// ---------------------------------------------------------------- the entrypoint wires the real clients
{
  const index = read('supabase/functions/customer-document-download/index.ts');
  ok(/handleDownloadRequest/.test(index), 'the entrypoint delegates to the tested handler');
  ok(/anon\.auth\.getUser\(token\)/.test(index), 'identity comes from verifying the caller JWT');
  ok(/authorize_customer_document_download/.test(index), 'authorization goes through the service_role RPC');
  ok(/getSupabaseSecretKey\(\)/.test(index), 'the service role key is read via the shared getSupabaseSecretKey() helper');
  ok(!/Deno\.env\.get\('SUPABASE_/.test(index), 'no reserved SUPABASE_ env var is read directly (that prefix is rejected by supabase secrets set)');
  ok(!/document_id.*caller|p_caller_id:\s*body/.test(index), 'the caller id is never taken from the request body');
}

if (failures) { console.error(`\ncustomer document download handler tests: ${failures} FAILED`); process.exit(1); }
console.log('\ncustomer document download handler tests: ALL PASSED');
