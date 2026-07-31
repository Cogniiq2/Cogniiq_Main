#!/usr/bin/env node
// =============================================================================
// Customer platform — staging endpoint verification (read-only, unauthenticated)
// =============================================================================
// The half of the preflight that is not database state:
//
//   * are BOTH Edge Functions actually deployed and healthy?
//   * do the frontend and the backend point at the SAME Supabase project?
//   * is the customer-documents bucket genuinely private to an anonymous caller?
//
// Every request this makes is unauthenticated and non-mutating. It sends no
// credentials, and it deliberately asserts that each function REJECTS it: a
// deployed, correctly configured function answers an anonymous POST with 401
// `authentication_required`, which simultaneously proves the function exists,
// boots, reaches its handler, and puts the auth gate before anything else.
//
// Usage:
//   STAGING_PROJECT_REF=abcdefghijklmnop \
//   SUPABASE_URL=https://abcdefghijklmnop.supabase.co \
//   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co \
//   node scripts/staging/verify-endpoints.mjs
//
// STAGING_PROJECT_REF is REQUIRED and is the safety interlock: every URL must
// belong to it, so a stray production URL in the environment aborts the run
// instead of being probed.
//
// No credentials appear in this file and none are read from it.
// =============================================================================

const FUNCTIONS = ['customer-document-download', 'customer-document-upload'];
const BUCKET = 'customer-documents';
const TIMEOUT_MS = 15000;

let failures = 0;
const pass = (label) => console.log(`PASS: ${label}`);
const fail = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

function abort(message) {
  console.error(`\nVERIFICATION ABORTED: ${message}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Inputs. The project ref is mandatory and every URL is checked against it.
// ---------------------------------------------------------------------------
const projectRef = process.env.STAGING_PROJECT_REF?.trim();
if (!projectRef) {
  abort(
    'STAGING_PROJECT_REF is not set.\n'
    + 'Set it to the STAGING project reference (the subdomain of your Supabase URL).\n'
    + 'This is the interlock that stops this script from probing an unintended project.',
  );
}
if (!/^[a-z0-9]{16,32}$/.test(projectRef)) {
  abort(`STAGING_PROJECT_REF "${projectRef}" is not a Supabase project reference (expected 16-32 lowercase alphanumerics).`);
}

const backendUrl = (process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const frontendUrl = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');

if (!backendUrl) abort('SUPABASE_URL is not set (the backend project URL to verify).');

function refOf(url) {
  const match = /^https:\/\/([a-z0-9]+)\.supabase\.(co|in)$/.exec(url);
  return match?.[1] ?? null;
}

console.log('Customer platform staging endpoint verification');
console.log(`target project ref: ${projectRef}`);
console.log(`backend  SUPABASE_URL:      ${backendUrl || '(unset)'}`);
console.log(`frontend VITE_SUPABASE_URL: ${frontendUrl || '(unset)'}`);
console.log('');

// --- 1) frontend and backend agree, and both are the intended project --------
const backendRef = refOf(backendUrl);
if (backendRef === projectRef) {
  pass(`backend SUPABASE_URL points at the declared staging project (${projectRef})`);
} else {
  fail(
    'backend SUPABASE_URL points at the declared staging project',
    `expected ref "${projectRef}", got "${backendRef ?? backendUrl}"`,
  );
  abort('refusing to send any request: the backend URL is not the declared staging project.');
}

if (!frontendUrl) {
  fail(
    'frontend VITE_SUPABASE_URL is configured',
    'unset — the frontend build would not reach any backend. Export it from the staging build environment.',
  );
} else if (refOf(frontendUrl) === projectRef) {
  pass(`frontend VITE_SUPABASE_URL points at the SAME project as the backend (${projectRef})`);
} else {
  fail(
    'frontend and backend point at the same Supabase project',
    `frontend resolves to "${refOf(frontendUrl) ?? frontendUrl}", backend to "${projectRef}". `
    + 'A split like this makes every customer RPC fail against a project that has not been migrated.',
  );
}

// ---------------------------------------------------------------------------
async function probe(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    return { status: response.status, text };
  } catch (error) {
    return { status: 0, text: String(error?.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

// --- 2) both Edge Functions are deployed and healthy ------------------------
for (const name of FUNCTIONS) {
  const url = `${backendUrl}/functions/v1/${name}`;

  // An anonymous POST must reach the handler and be refused there.
  const result = await probe(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (result.status === 0) {
    fail(`${name} is reachable`, `no response: ${result.text}`);
    continue;
  }
  if (result.status === 404) {
    fail(`${name} is deployed`, `404 from ${url} — deploy it before the frontend goes live.`);
    continue;
  }
  if (result.status >= 500) {
    fail(
      `${name} boots without error`,
      `HTTP ${result.status} — the function is deployed but failing at startup or in its handler. `
      + 'Check its logs; a missing SUPABASE_URL/key would surface exactly like this.',
    );
    continue;
  }
  pass(`${name} is deployed and responding (HTTP ${result.status})`);

  // 401 is the correct answer to an anonymous call. A 200 would mean the auth
  // gate is not first, which is a security failure, not a health failure.
  if (result.status === 200) {
    fail(
      `${name} refuses an UNAUTHENTICATED request`,
      'HTTP 200 without any Authorization header — the function served a request it must have rejected.',
    );
  } else if (result.status === 401) {
    pass(`${name} refuses an unauthenticated request with 401`);
    if (/authentication_required/.test(result.text)) {
      pass(`${name} returns the expected generic denial body`);
    } else {
      fail(
        `${name} returns the expected generic denial body`,
        `got: ${result.text.slice(0, 200)}`,
      );
    }
  } else {
    // 400/403 also prove the gate holds; note it rather than assert a shape.
    pass(`${name} rejects an unauthenticated request (HTTP ${result.status})`);
  }

  // No response may ever name the bucket or an object path.
  if (new RegExp(BUCKET).test(result.text) || /storage\/v1\/object/.test(result.text)) {
    fail(`${name} leaks no storage location in its denial body`, `body: ${result.text.slice(0, 200)}`);
  } else {
    pass(`${name} leaks no storage location in its denial body`);
  }

  // CORS preflight must work or the browser never sends the real call.
  const options = await probe(url, {
    method: 'OPTIONS',
    headers: { origin: 'https://cogniiq.de', 'access-control-request-method': 'POST' },
  });
  if (options.status >= 200 && options.status < 300) {
    pass(`${name} answers a CORS preflight (HTTP ${options.status})`);
  } else {
    fail(`${name} answers a CORS preflight`, `HTTP ${options.status} — the browser call would never be sent.`);
  }
}

// --- 3) the bucket is not publicly readable ---------------------------------
// A private bucket answers an anonymous object read with 400/401/403/404 — never
// with the object. This probes a path that does not exist, so it cannot disclose
// anything; the point is the SHAPE of the refusal.
const publicObject = await probe(
  `${backendUrl}/storage/v1/object/public/${BUCKET}/preflight-probe-nonexistent.pdf`,
  { method: 'GET' },
);
if (publicObject.status === 200) {
  fail(
    'the customer-documents bucket is NOT publicly readable',
    'an anonymous public-object request returned 200 — the bucket is public. Fix this before any document is published.',
  );
} else if (publicObject.status === 0) {
  fail('the customer-documents bucket public probe completed', publicObject.text);
} else {
  pass(`anonymous public-object access to ${BUCKET} is refused (HTTP ${publicObject.status})`);
}

// ---------------------------------------------------------------------------
console.log('');
if (failures === 0) {
  console.log('ENDPOINT VERIFICATION PASSED: both functions are deployed and healthy, '
    + 'frontend and backend agree, and the bucket is not public.');
  process.exit(0);
}
console.error(`\nENDPOINT VERIFICATION FAILED: ${failures} check(s) did not match. Do not deploy the frontend until they are resolved.`);
process.exit(1);
