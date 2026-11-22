// Production reconciliation guard (PR-1, see docs/ops/production-reconciliation-2026-11.md).
//
// Pins the facts that were verified read-only against the hosted project on 2026-11-22, so the
// repository cannot drift away from them again without a deliberate, reviewed change:
//
//   (A) The two production-only migrations whose applied SQL is recorded in the ledger are
//       imported byte-for-byte: the text after the BEGIN marker hashes to the recorded statement.
//   (B) 20260905120000_ai_receptionist_platform.sql splits into exactly the 47 statements the
//       ledger recorded (Supabase CLI split: semicolon outside quotes/comments, trimmed).
//   (C) The send-offer-document-email source equals the deployed v27 bundle (file sha256).
//       Changing the worker is allowed, but it must update this pin and the reconciliation doc
//       in the same change — that is the point: no silent repo/production divergence.
//   (D) Migration-history hygiene: no duplicate version, the never-applied branch file
//       20260823120000_* is absent, the club-operations versions stay protected.
//
// Read-only: reads repository files only. Never contacts a database or Supabase.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROTECTED_VERSIONS } from './lib/supabase-migration-allowlist.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIG = join(ROOT, 'supabase', 'migrations');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const md5 = (s) => createHash('md5').update(s, 'utf8').digest('hex');
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

let failures = 0;
function ok(cond, label) {
  if (cond) console.log(`ok: ${label}`);
  else { failures += 1; console.error(`FAIL: ${label}`); }
}

// ---------------------------------------------------------------- (A) exact applied statements
const MARKER = '-- ==== BEGIN EXACT APPLIED STATEMENT ====\n';
const EXACT = {
  '20260823102556_offer_invoice_email_recipient_fix.sql': '1f874f3b251aa9d8ea9839cb1a44e57b',
  '20260924202220_p0_revoke_client_role_exposure.sql': '39cd8dda4f4f59dd594d61d8f0f6f143',
};
for (const [file, expected] of Object.entries(EXACT)) {
  const text = read(`supabase/migrations/${file}`);
  const parts = text.split(MARKER);
  ok(parts.length === 2, `${file}: has exactly one BEGIN marker`);
  ok(parts.length === 2 && md5(parts[1]) === expected, `${file}: body equals the recorded production statement (md5 ${expected})`);
}

// ---------------------------------------------------------------- (B) statement-split equality
// Mirrors the Supabase CLI splitter closely enough for this file: ';' terminates a statement
// unless inside a -- comment, /* */ comment, '...' literal or $tag$...$tag$ body.
function splitStatements(sql) {
  const out = [];
  let buf = '';
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith('--', i)) {
      const j = sql.indexOf('\n', i); const end = j < 0 ? sql.length : j;
      buf += sql.slice(i, end); i = end; continue;
    }
    if (sql.startsWith('/*', i)) {
      const end = sql.indexOf('*/', i) + 2; buf += sql.slice(i, end); i = end; continue;
    }
    const c = sql[i];
    if (c === "'") {
      let j = i + 1;
      for (;;) { const k = sql.indexOf("'", j); if (sql[k + 1] === "'") { j = k + 2; continue; } j = k + 1; break; }
      buf += sql.slice(i, j); i = j; continue;
    }
    if (c === '$') {
      const m = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (m) { const end = sql.indexOf(m[0], i + m[0].length) + m[0].length; buf += sql.slice(i, end); i = end; continue; }
    }
    if (c === ';') { out.push(buf + ';'); buf = ''; i += 1; continue; }
    buf += c; i += 1;
  }
  if (buf.trim()) out.push(buf);
  return out.map((s) => s.trim().replace(/;$/, '').trim());
}

// "<length>:<md5>" per statement, in order, as recorded in supabase_migrations.schema_migrations.
const AI_RECEPTIONIST_RECORDED = `2494:7dcc77523c4c1392f21d6458e491e60b 895:09a7547d28c2dadd9cb46b866456e14d
1534:11285edc4410a8f4cefbe13ff6488671 175:217d3ad406df9b67ab7637fcf5bbb878 96:8a14c72aa937b2e22af05196fb82c94b
88:83830d96e47ad0ba9f73c43ed315b2d1 162:48e2b2b423d938c6cdd40cb09eba6504 81:25b216f321827d21918f06da730aa62b
145:876ac509f2c4fb69a5a5fbee067f0294 676:13283a8747067cb870ef910a3fca70e6 79:a51a75fbf619a122aa445c06efc41f01
167:982c0f962a2f513967411557e120bd25 938:f16df2054b4efd87646f8b17de13f21f 143:ad318706e934d85d0f77ddf8903890af
1088:3f219b707bce74a5dfaed32a33de3beb 133:00d38bae72c3b5beae7f4d82eabea652 1875:d3e154399f72520dc1a52d628b2cedcd
140:5eae20494bc2a18c77003e635d83b866 112:0afa5d2bce9e1b558539c9c3d9f0006c 91:d4154c926121dffaf8fc036f98a74037
155:6cb49a79556fc6bf30a9eabd1bb26a1c 976:331b6f1ca7b5478cbde0519e7d3c8f8c 166:6eb83360863ad1923df4ab7ef75d1bf9
136:28d76d700e0971946255526e9c06572e 1291:dd5ae6d91f126f5dcdb891b281536fa9 139:3735bbb99ae4600eb565616a1ca06c61
993:5a30ecf1dfcebb32360c830deef443e0 131:3462608b2f7c8e972171216b404962f5 1063:b628044f32a59ccbf9a32f261c3c8de2
89:0c08d1378892a6e8d2a04fc26979af59 101:f73dc7baaaffe8537e291235d89a1c7c 742:81fa4e8a5e713ed96e7daa5b50bc5908
645:18e3106af5a0494a416d6cc533a508bf 180:f1f2fa741dec7074fd5b390d93e4a00d 193:83d268106a38609999d7ee8e7736cc77
91:e4230d5f263fd84e7bbd4fd014e0d3c8 203:7c7f63476e72937a6e4c8ea57e214251 479:765775ec54cba2af5ea0023c42539c6a
101:a58a5bc99d673800617d2027759e377c 99:9193ed9e4c36b58e9939dfc895e3be0c 91:d46da2dcdf713c16c5955060a4b0917c
97:f58e190521b4107257f33d15aa1eb7c2 101:58bb70166fcab0156d6478fc207f6a1e 104:0c3e03de8c757c6c3963079349461abb
90:5f9d4daf387f75679f9815ac587a029d 1096:2e588aafd1c48e76baf222cb160d7d40 6:fffca4d67ea0a788813031b8bbc3b329`.split(/\s+/);
const aiStatements = splitStatements(read('supabase/migrations/20260905120000_ai_receptionist_platform.sql'));
ok(aiStatements.length === AI_RECEPTIONIST_RECORDED.length, `20260905120000: ${aiStatements.length} statements (ledger recorded ${AI_RECEPTIONIST_RECORDED.length})`);
const mismatched = aiStatements
  .map((s, n) => (`${s.length}:${md5(s)}` === AI_RECEPTIONIST_RECORDED[n] ? null : n + 1))
  .filter((n) => n !== null);
ok(mismatched.length === 0, `20260905120000: every statement equals the recorded production statement${mismatched.length ? ` (mismatch at ${mismatched.join(', ')})` : ''}`);

// ---------------------------------------------------------------- (C) deployed worker baseline
// sha256 of each file as served by the deployed send-offer-document-email v27 (2026-11-22).
const WORKER_V27 = {
  'index.ts': 'a9acf3e1960cbee77ac8e557af0778ae2cbbc958f9954cf65e786abefcd8735e',
  'certificatePdf.ts': '21b28cfc554c5458e3757e316ef51682e559fa5abd361d9d80dfcbd4977630b7',
  'email.ts': 'd93214f1068137286360459f1630fa34d37184f1a88746bd2dcd3078d989f717',
  'invoicePdf.ts': '2c3a82cd208be0adf8526dca0b9c514373d6145f295be32becaaefb5b81ce666',
};
const workerFiles = readdirSync(join(ROOT, 'supabase/functions/send-offer-document-email')).filter((f) => f.endsWith('.ts')).sort();
ok(JSON.stringify(workerFiles) === JSON.stringify(Object.keys(WORKER_V27).sort()), 'worker consists of exactly the four deployed source files');
for (const [file, expected] of Object.entries(WORKER_V27)) {
  ok(sha256(read(`supabase/functions/send-offer-document-email/${file}`)) === expected, `worker ${file} equals deployed v27`);
}

// ---------------------------------------------------------------- (D) migration-history hygiene
const files = readdirSync(MIG).filter((f) => f.endsWith('.sql'));
const versions = files.map((f) => f.split('_')[0]);
const dupes = versions.filter((v, i) => versions.indexOf(v) !== i);
ok(dupes.length === 0, `no duplicate migration version${dupes.length ? ` (${dupes.join(', ')})` : ''}`);
ok(files.every((f) => /^\d{14}_[a-z0-9_]+\.sql$/.test(f)), 'every migration filename is <14-digit version>_<snake_name>.sql');
ok(!files.some((f) => f.startsWith('20260823120000')), 'never-applied branch version 20260823120000 is not in the repository');
ok(files.some((f) => f.startsWith('20260903120000_owner_workspace_organization')), '20260903120000 belongs to owner_workspace_organization');
for (const v of ['20260811120000', '20260818120000']) {
  ok(PROTECTED_VERSIONS.includes(v) && versions.includes(v), `club-operations ${v} stays present and protected (intentionally unapplied)`);
}
ok(!files.some((f) => f.startsWith('20260804120000')), '20260804120000 (ledger row without statements) is documented, not fabricated as a file');

if (failures) { console.error(`\nproduction reconciliation tests: ${failures} FAILED`); process.exit(1); }
console.log('\nproduction reconciliation tests: ALL PASSED');
