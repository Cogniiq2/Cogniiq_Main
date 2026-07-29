// EXECUTABLE tests for supabase/functions/_shared/env.ts.
//
// The module's only Deno dependency is Deno.env.get, so a minimal shim lets it run
// under Node (same transpile-and-import-as-data-URL technique used elsewhere in this
// repo). Each test case gets its own fresh module instance (a new data URL) so env
// state from one case can never leak into another.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const src = readFileSync(resolve(root, 'supabase/functions/_shared/env.ts'), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function loadWithEnv(vars) {
  globalThis.Deno = { env: { get: (name) => vars[name] } };
  // A unique data URL per load defeats the module cache, so each test gets a fresh
  // read of `vars` at call time rather than a memoized first-call result.
  const unique = `\n// cache-buster:${Math.random()}`;
  return import('data:text/javascript;base64,' + Buffer.from(js + unique).toString('base64'));
}

// ---------------------------------------------------------------- modern JSON key maps
{
  const mod = await loadWithEnv({
    SUPABASE_URL: 'https://proj.supabase.co',
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'sb_publishable_default_abc', rotated: 'sb_publishable_old_xyz' }),
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_default_123', rotated: 'sb_secret_old_999' }),
  });
  ok(mod.getSupabaseUrl() === 'https://proj.supabase.co', 'URL read from the scalar var');
  ok(mod.getSupabasePublishableKey() === 'sb_publishable_default_abc',
    'publishable key map: the `default` entry is selected, not the raw JSON blob');
  ok(mod.getSupabaseSecretKey() === 'sb_secret_default_123',
    'secret key map: the `default` entry is selected, not the raw JSON blob');
  ok(!mod.getSupabasePublishableKey().includes('{'), 'publishable key is never the raw JSON string');
  ok(!mod.getSupabaseSecretKey().includes('rotated'), 'non-default rotated entries are never selected');
}

// ---------------------------------------------------------------- legacy scalar fallback
{
  const mod = await loadWithEnv({
    SUPABASE_URL: 'https://proj.supabase.co',
    SUPABASE_ANON_KEY: 'legacy-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role-key',
  });
  ok(mod.getSupabasePublishableKey() === 'legacy-anon-key', 'falls back to SUPABASE_ANON_KEY when no modern map is set');
  ok(mod.getSupabaseSecretKey() === 'legacy-service-role-key', 'falls back to SUPABASE_SERVICE_ROLE_KEY when no modern map is set');
}
{
  // Singular modern names (SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY) sit between
  // the JSON map and the oldest legacy names in priority.
  const mod = await loadWithEnv({
    SUPABASE_PUBLISHABLE_KEY: 'singular-publishable',
    SUPABASE_SECRET_KEY: 'singular-secret',
    SUPABASE_ANON_KEY: 'should-not-be-used',
    SUPABASE_SERVICE_ROLE_KEY: 'should-not-be-used',
  });
  ok(mod.getSupabasePublishableKey() === 'singular-publishable', 'singular modern name wins over the oldest legacy name');
  ok(mod.getSupabaseSecretKey() === 'singular-secret', 'singular modern name wins over the oldest legacy name');
}
{
  // The JSON map, when present and valid, wins over ALL scalar fallbacks.
  const mod = await loadWithEnv({
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'map-wins' }),
    SUPABASE_PUBLISHABLE_KEY: 'should-not-be-used',
    SUPABASE_ANON_KEY: 'should-not-be-used',
  });
  ok(mod.getSupabasePublishableKey() === 'map-wins', 'a valid JSON map takes priority over every scalar fallback');
}

// ---------------------------------------------------------------- missing / malformed values
{
  const mod = await loadWithEnv({});
  ok(mod.getSupabaseUrl() === '', 'missing URL resolves to empty string, not undefined/throw');
  ok(mod.getSupabasePublishableKey() === '', 'missing publishable key resolves to empty string');
  ok(mod.getSupabaseSecretKey() === '', 'missing secret key resolves to empty string');
}
{
  // Malformed JSON must fall through to the legacy scalar, never throw.
  const mod = await loadWithEnv({
    SUPABASE_PUBLISHABLE_KEYS: '{not valid json',
    SUPABASE_ANON_KEY: 'legacy-fallback-after-malformed-json',
  });
  let threw = false;
  let value;
  try { value = mod.getSupabasePublishableKey(); } catch { threw = true; }
  ok(!threw, 'malformed JSON in the key map never throws');
  ok(value === 'legacy-fallback-after-malformed-json', 'malformed JSON falls back to the legacy scalar');
}
{
  // Structurally valid JSON but not an object (array, number, string, null) is rejected.
  for (const malformed of ['[1,2,3]', '"just a string"', '42', 'null', '{}', '{"default": 123}', '{"default": ""}']) {
    const mod = await loadWithEnv({ SUPABASE_SECRET_KEYS: malformed, SUPABASE_SERVICE_ROLE_KEY: 'fallback-ok' });
    ok(mod.getSupabaseSecretKey() === 'fallback-ok',
      `non-object/empty-default JSON (${malformed}) falls back to the legacy scalar, not a coerced value`);
  }
}

// ---------------------------------------------------------------- no key exposure
{
  const secretValue = 'sb_secret_should_never_be_logged_0xDEADBEEF';
  const calls = [];
  const originalLog = console.log, originalError = console.error, originalWarn = console.warn;
  console.log = (...args) => calls.push(args);
  console.error = (...args) => calls.push(args);
  console.warn = (...args) => calls.push(args);
  try {
    const mod = await loadWithEnv({
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: secretValue }),
      SUPABASE_PUBLISHABLE_KEYS: '{malformed',
      SUPABASE_ANON_KEY: 'anon-fallback-value',
    });
    mod.getSupabaseSecretKey();
    mod.getSupabasePublishableKey();
    mod.getSupabaseUrl();
  } finally {
    console.log = originalLog; console.error = originalError; console.warn = originalWarn;
  }
  ok(calls.length === 0, 'resolving keys (including a malformed map) never logs anything at all');
}
{
  // Source-level guarantee, independent of runtime behavior: no console.* call in the
  // module can reference the key variables at all.
  ok(!/console\.(log|error|warn|info|debug)/.test(src), 'the env helper source contains no console.* calls whatsoever');
}

if (failures) { console.error(`\nenv helper tests: ${failures} FAILED`); process.exit(1); }
console.log('\nenv helper tests: ALL PASSED');
