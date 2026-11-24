// Static regression guard: public (no-JWT) Edge Functions must never forward raw database,
// storage or provider error text to the caller.
//
// Background: the DEPLOYED build of process-accepted-offer returned raw Postgres error text to
// the anonymous signer. The repository source is already safe (fixed strings only). This test
// keeps it that way: every json(...) / new Response(...) body in the listed functions may carry
// only literals or explicitly safe fields, never `.message`, `.details`, `.hint`, `.code` of an
// error, a stringified error, or a template literal that interpolates one. console.* calls may
// not log error objects either (logs are readable by anyone with dashboard access).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PUBLIC_FUNCTIONS = ['supabase/functions/process-accepted-offer/index.ts'];

const FORBIDDEN = [
  /\b\w*(?:err|error|Err|Error)\w*\??\.(?:message|details|hint|code|stack)\b/,
  /String\(\s*\w*(?:err|error)\w*\s*\)/i,
  /\$\{\s*\w*(?:err|error)\w*/i,
  /JSON\.stringify\(\s*\w*(?:err|error)\w*\s*\)/i,
];

/** Returns the source text of every call to one of `names`, balanced on parentheses. */
export function callBodies(src, names) {
  const out = [];
  const re = new RegExp(`(?:${names.join('|')})\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(src))) {
    let depth = 1; let i = m.index + m[0].length;
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
    }
    out.push({ text: src.slice(m.index, i), line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

export function findLeaks(src) {
  const leaks = [];
  for (const call of callBodies(src, ['\\bjson', 'new Response', 'console\\.(?:log|error|warn|info)'])) {
    for (const re of FORBIDDEN) if (re.test(call.text)) leaks.push({ line: call.line, text: call.text.slice(0, 120) });
  }
  return leaks;
}

// Self-test: the checker must catch the shapes that leaked before.
assert.equal(findLeaks(`return json({ ok: false, error: error.message }, 400);`).length, 1);
assert.equal(findLeaks(`return json({ ok: false, error: \`failed: \${error}\` }, 400);`).length, 1);
assert.equal(findLeaks(`console.error('x', err.details);`).length, 1);
assert.equal(findLeaks(`return json({ ok: false, error: 'acceptance could not be recorded' }, 400);`).length, 0);

let failed = false;
for (const file of PUBLIC_FUNCTIONS) {
  const src = readFileSync(file, 'utf8');
  const leaks = findLeaks(src);
  // Bare error objects passed to console.* would also serialise their message.
  for (const call of callBodies(src, ['console\\.(?:log|error|warn|info)'])) {
    if (/\b\w*(?:err|error)\w*\b/i.test(call.text.replace(/'[^']*'|"[^"]*"/g, ''))) leaks.push({ line: call.line, text: call.text.slice(0, 120) });
  }
  for (const l of leaks) { failed = true; console.error(`${file}:${l.line} may expose raw error text: ${l.text}`); }
}
if (failed) process.exit(1);
console.log(`public edge function error surface: ${PUBLIC_FUNCTIONS.length} function(s) clean`);
