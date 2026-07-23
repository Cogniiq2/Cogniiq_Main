// Offer-acceptance automation integration test. Runs the throwaway-PostgreSQL SQL suite
// (greeting freeze, snapshot projection, signed acceptance evidence, idempotent invoice +
// automation-job dedupe, RLS/owner-only) end to end, then adds static assertions on the
// server pipeline and the (source-only, undeployed) Edge Functions. Never touches Supabase.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

// ---------------------------------------------------------------- run the SQL suite
const runner = resolve(here, 'run-signature-proposal-sql-tests.sh');
if (existsSync('/usr/lib/postgresql') || existsSync('/usr/bin/initdb') || existsSync('/usr/lib/postgresql/16/bin/initdb')) {
  const res = spawnSync('bash', [runner], { encoding: 'utf8' });
  const out = (res.stdout ?? '') + (res.stderr ?? '');
  ok(res.status === 0, 'signature-proposal SQL suite exits 0');
  ok(/signature-proposal SQL tests: ALL PASSED/.test(out), 'SQL suite reports ALL PASSED');
  ok(/migration convergence: 125000 re-applied cleanly/.test(out), 'migration convergence holds (125000 idempotent)');
} else {
  console.log('note: PostgreSQL server binaries not found — skipping live SQL run (static checks still enforced).');
}

// ---------------------------------------------------------------- migration static checks
const mig = read('supabase/migrations/20260723125000_owner_signature_proposal_experience.sql');
ok(/add column if not exists recipient_salutation/.test(mig), 'migration adds greeting fields');
ok(/check \(recipient_salutation is null or recipient_salutation in \('herr','frau','neutral'\)\)/.test(mig), 'salutation constrained to herr/frau/neutral');
ok(/add column if not exists signature_sha256/.test(mig) && /add column if not exists signature_storage_path/.test(mig), 'acceptance signature evidence columns added');
ok(/create table if not exists public\.owner_automation_jobs/.test(mig), 'automation-job / outbox table created');
ok(/constraint owner_automation_jobs_dedupe_unique unique \(dedupe_key\)/.test(mig), 'automation jobs deduped by key (idempotency)');
ok(/auto_create_invoice_on_acceptance boolean not null default true/.test(mig), 'auto_create default on');
ok(/auto_issue_invoice_on_acceptance boolean not null default false/.test(mig) && /auto_send_invoice_on_acceptance boolean not null default false/.test(mig), 'auto issue/send default off');
ok(/function public\.record_offer_acceptance/.test(mig), 'service-role record_offer_acceptance RPC exists');
ok(/request_is_service_role\(\)/.test(mig), 'record_offer_acceptance is service-role gated');
ok(/p_signature_bytes > 400000/.test(mig), 'server-side signature size gate (<=400KB)');
ok(/'\^\[0-9a-f\]\{64\}\$'/.test(mig), 'server-side SHA-256 hash format gate');
ok(/function public\.owner_process_offer_acceptance/.test(mig), 'server-authoritative acceptance pipeline exists');
ok(/owner_convert_offer_internal/.test(mig) && /converted_invoice_id is not null then return/.test(mig), 'idempotent internal invoice conversion');
ok(/function public\.owner_invoice_preflight/.test(mig), 'invoice preflight gate exists');
ok(/if v_ver\.snapshot is not null then/.test(mig), 'public projection is served from the immutable snapshot');
ok(!/'internal_notes'/.test(mig.split('public_offer_by_token')[1] ?? ''), 'public projection never returns internal_notes');
ok(/function public\.owner_offer_acceptance_summary/.test(mig), 'owner acceptance summary RPC exists');
ok(/does not (modify|touch)|ADDITIVE/i.test(mig), 'migration documents itself as additive');

// The five prior migrations must be untouched by this task (additive-only requirement).
const priors = [
  '20260723120000_owner_document_settings.sql', '20260723121000_owner_offers.sql',
  '20260723122000_owner_commercial_documents.sql', '20260723123000_owner_premium_offer_editor.sql',
  '20260723124000_owner_premium_offer_runtime_hotfix.sql',
];
for (const p of priors) ok(existsSync(resolve(root, 'supabase/migrations', p)), `prior migration present: ${p}`);

// ---------------------------------------------------------------- edge function static checks
const accept = read('supabase/functions/process-accepted-offer/index.ts');
ok(/image\/png/.test(accept) && /0x89, 0x50, 0x4e, 0x47/.test(accept), 'signature MIME + PNG magic validated');
ok(/MAX_SIGNATURE_BYTES = 400_000/.test(accept), 'strict max signature size');
ok(/crypto\.subtle\.digest\('SHA-256'/.test(accept), 'signature hashed server-side (SHA-256)');
ok(/SIGNATURE_BUCKET = 'owner-offer-signatures'/.test(accept) && /upsert: false/.test(accept), 'stored in the private signatures bucket');
ok(/crypto\.randomUUID\(\)/.test(accept) && /\$\{businessEntityId\}\/\$\{offerId\}/.test(accept), 'server-generated storage path (not client-chosen)');
ok(/record_offer_acceptance/.test(accept), 'calls the service-role acceptance RPC');
ok(/\.remove\(\[path\]\)/.test(accept), 'compensation removes orphaned signature on RPC failure');
ok(!/console\.(log|error)\([^)]*token/i.test(accept), 'edge function never logs the token');
ok(/SERVICE_ROLE = Deno\.env\.get/.test(accept), 'service role read from env only (never browser)');

const email = read('supabase/functions/send-offer-document-email/index.ts');
ok(/EMAIL_PROVIDER/.test(email) && /RESEND_API_KEY = Deno\.env\.get/.test(email), 'email provider abstraction reads secrets from env');
ok(/owner_complete_automation_job/.test(email) && /'retrying'/.test(email), 'worker records retrying/failed via the completion RPC (bounded retries + backoff in SQL)');
ok(/WORKER_SECRET/.test(email) && /safeEqual/.test(email), 'worker requires a constant-time WORKER_SECRET');
ok(!/console\.(log|error|info)/.test(email), 'email worker logs nothing (no token/secret leakage)');

if (failures) { console.error(`\noffer acceptance automation tests: ${failures} FAILED`); process.exit(1); }
console.log('\noffer acceptance automation tests: ALL PASSED');
