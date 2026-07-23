// Automated OFFER-EMAIL send-workflow regression test. Three layers:
//   (A) BEHAVIOURAL — the import-free email.ts builder is transpiled + executed: the offer email
//       honours an owner-authored subject/message, HTML-escapes customer-controlled content, keeps
//       a plain-text alternative, and ALWAYS uses the exact worker-minted /d/<token> link (the
//       dialog never carries the token).
//   (B) STRUCTURAL — static assertions across the worker, the migration, the API layer, the
//       SendOfferDialog (no mailto, no token/job/Resend on open, secure enqueue, double-click
//       guard, no worker secret, no raw token), and the detail page (job state wired + refetch).
//   (C) INTEGRATION — runs the throwaway-PostgreSQL offer-email SQL suite end to end.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

async function loadTs(rel) {
  const src = read(rel);
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
}

// ---------------------------------------------------------------- (A) email builder
const email = await loadTs('supabase/functions/send-offer-document-email/email.ts');
const LINK = 'https://app.cogniiq.de/d/RAWTOKEN123';
const baseCtx = { offer_number: 'AN-2026-0001', valid_until: '2026-07-31',
  recipient: { greeting_name: 'Herr Pensel' }, seller: { legal_name: 'Cogniiq' } };

// Default (no overrides): premium German body + exact portal link, never the app root.
const def = email.buildOfferEmail(baseCtx, LINK);
ok(def.html.includes(LINK), 'default offer email links to the exact portal URL');
ok(!/href="https:\/\/app\.cogniiq\.de\/"/.test(def.html), 'default offer email never links to the app root');
ok(def.subject.includes('AN-2026-0001'), 'default subject carries the offer number');
ok(def.text && !/<\/?[a-z][^>]*>/i.test(def.text), 'a plain-text alternative (no HTML tags) is included');

// Owner-authored subject + message win, and the message is HTML-escaped.
const custom = email.buildOfferEmail(baseCtx, LINK, {
  subject: 'Individuelles Angebot für Sie',
  message: 'Guten Tag,\nhier <script>alert(1)</script> Ihr Angebot.',
});
ok(custom.subject === 'Individuelles Angebot für Sie', 'owner-authored subject is used');
ok(!custom.html.includes('<script>alert(1)</script>'), 'owner message is HTML-escaped (no raw HTML leaks)');
ok(custom.html.includes('&lt;script&gt;'), 'escaped entity from the owner message is present');
ok(custom.html.includes(LINK), 'the secure link button is still appended to a custom message');
ok(/Guten Tag,<br>/.test(custom.html), 'newlines in the owner message become <br>');
const cleanCustom = email.buildOfferEmail(baseCtx, LINK, { subject: 'S', message: 'Guten Tag,\nhier ist Ihr Angebot.' });
ok(cleanCustom.text.includes(LINK) && !/<\/?[a-z][^>]*>/i.test(cleanCustom.text), 'custom plain-text keeps the link, no HTML tags');

// ---------------------------------------------------------------- (B) worker
const idx = read('supabase/functions/send-offer-document-email/index.ts');
ok(/if \(type === 'offer_email'\)/.test(idx), 'worker handles the offer_email job type');
ok(/owner_worker_mint_offer_link/.test(idx) && /\$\{PUBLIC_APP_URL\}\/d\/\$\{minted\.token\}/.test(idx), 'worker mints a fresh token + builds the exact /d/ link');
ok(/buildOfferEmail\(ctx, link, \{ subject: job\.subject \?\? payload\.subject, message: payload\.message \}\)/.test(idx), 'worker passes the editable subject/message to the builder');
ok(/owner_worker_mark_offer_sent/.test(idx), 'worker advances the offer to sent after a successful send');
ok(/if \(sent\.error\)[\s\S]{0,220}owner_worker_revoke_offer_token/.test(idx), 'worker revokes the minted token when the send fails');
ok(/owner_worker_mark_offer_sent[\s\S]{0,80}return \{ providerId: sent\.id \}/.test(idx), 'offer status is only marked sent AFTER the provider send succeeds');
ok(!/console\.(log|error|info)/.test(idx), 'worker logs nothing (no token/secret/byte leakage)');

// ---------------------------------------------------------------- (B) migration
const mig = read('supabase/migrations/20260723128000_owner_offer_email_workflow.sql');
ok(/does NOT modify any previously applied migration/i.test(mig), 'migration documents itself as additive');
ok(/function public\.owner_enqueue_offer_email/.test(mig), 'defines owner_enqueue_offer_email');
ok(/is_platform_owner\(\)/.test(mig), 'enqueue is owner-gated');
ok(/status not in \('finalized','sent','viewed'\)/.test(mig), 'enqueue rejects non-sendable offer states (draft/accepted/etc.)');
ok(/invalid recipient email/.test(mig), 'enqueue validates the recipient email');
ok(/offer_email:'\s*\|\|\s*v_version/.test(mig) || /':offer_email:'\s*\|\|\s*v_version/.test(mig), 'enqueue uses a stable versioned dedupe key');
ok(/status = 'retrying'[\s\S]{0,200}attempt_count = 0/.test(mig), 'enqueue safely re-arms a failed job');
ok(!/status\s*=\s*'sent'/.test(mig.replace(/owner_worker_mark_offer_sent[\s\S]*/, '')) , 'enqueue never sets the offer status to sent');
ok(/function public\.owner_worker_mark_offer_sent/.test(mig) && /request_is_service_role\(\)/.test(mig), 'mark-offer-sent is service-role only');
ok(/function public\.owner_worker_revoke_offer_token/.test(mig), 'defines the service-role token revoke helper');
ok((mig.match(/revoke execute on function/g) || []).length >= 3, 'explicit revokes for every new function');
ok((mig.match(/grant execute on function/g) || []).length >= 3, 'explicit grants for every new function');

// ---------------------------------------------------------------- (B) API layer
const api = read('src/lib/ownerFinance/offersApi.ts');
ok(/export async function enqueueOfferEmail/.test(api), 'api: enqueueOfferEmail');
ok(/supabase\.rpc\('owner_enqueue_offer_email'/.test(api), 'enqueueOfferEmail calls only the secure owner RPC');
ok(/jobId: string \| null; status: string \| null; error: string \| null/.test(api), 'enqueueOfferEmail returns { jobId, status, error }');
ok(/export async function loadOfferAutomationJobs/.test(api), 'api: loadOfferAutomationJobs');
ok(!/api\.resend\.com/i.test(api) && !/RESEND_API_KEY/.test(api) && !/WORKER_SECRET/.test(api), 'api never calls Resend directly or references a worker secret');

// ---------------------------------------------------------------- (B) SendOfferDialog
const dlg = read('src/components/finance/SendOfferDialog.tsx');
ok(!/mailto:\$\{/.test(dlg) && !/href=\{?["'`]?mailto/.test(dlg), 'NO mailto: send path remains in SendOfferDialog');
ok(/E-Mail jetzt senden/.test(dlg), 'primary CTA is "E-Mail jetzt senden"');
ok(/enqueueOfferEmail\(/.test(dlg), 'primary action calls the secure enqueue API');
ok(/submittingRef/.test(dlg) && /if \(submittingRef\.current\) return/.test(dlg), 'double-click cannot enqueue twice');
ok(/EMAIL_RE\.test/.test(dlg), 'recipient email is validated before enqueue');
ok(/eingeplant/.test(dlg) && /sicheren Verarbeitung|zur sicheren/.test(dlg), 'success message states the email was scheduled for secure processing');
// Opening the dialog must not create a token / job / call Resend / open mail.
ok(!/useEffect\([^)]*createOfferAccessToken/s.test(dlg), 'opening the dialog does not mint a token in an effect');
ok(!/enqueueOfferEmail[\s\S]{0,40}useEffect/.test(dlg) && !/useEffect\([\s\S]{0,200}enqueueOfferEmail/.test(dlg), 'opening the dialog does not enqueue a job in an effect');
ok(!/setOfferStatus/.test(dlg), 'the dialog never sets the offer status (no false email-sent)');
ok(/createOfferAccessToken/.test(dlg) && /ensureLink/.test(dlg), 'manual link is minted lazily on explicit click only');
ok(/Manuelle Alternativen/.test(dlg), 'manual options are clearly labelled as alternatives');
ok(/Link kopieren/.test(dlg) && /WhatsApp/.test(dlg) && /Teilen/.test(dlg), 'manual copy / WhatsApp / share options are kept');
ok(!/api\.resend\.com/i.test(dlg) && !/RESEND_API_KEY/.test(dlg) && !/x-worker-secret/i.test(dlg) && !/WORKER_SECRET/.test(dlg), 'dialog never calls Resend directly or sends a worker secret');
ok(!/minted\.token|owner_worker_mint/.test(dlg), 'dialog never receives the raw automated-send token');
ok(/deriveOfferEmailStatus/.test(dlg), 'dialog shows the offer_email job status');

// ---------------------------------------------------------------- (B) OfferDetailPage
const detail = read('src/pages/owner/OfferDetailPage.tsx');
ok(/loadOfferAutomationJobs/.test(detail), 'detail page loads the automation jobs');
ok(/offerEmailJob/.test(detail) && /emailJob=\{offerEmailJob\}/.test(detail), 'detail page passes the offer_email job to the dialog');
ok(/deriveOfferEmailStatus/.test(detail), 'detail page derives + shows the offer email status');
ok(/onSent=\{\(\) => \{ void load\(\{ silent: true \}\); \}\}/.test(detail), 'enqueue triggers an owner-detail refetch');
ok(/Erneut versuchen/.test(detail), 'a failed offer email offers a retry on the detail page');

// ---------------------------------------------------------------- (B) status-state helper
const stateSrc = read('src/lib/ownerFinance/offerSignatureState.ts');
ok(/export function deriveOfferEmailStatus/.test(stateSrc), 'helper: deriveOfferEmailStatus');
for (const label of ['Noch nicht versendet', 'Wartet auf Versand', 'Wird versendet', 'Versendet', 'Fehler beim Versand']) {
  ok(stateSrc.includes(label), `helper exposes the German status label "${label}"`);
}

// ---------------------------------------------------------------- (C) live SQL suite
const runner = resolve(here, 'run-offer-email-sql-tests.sh');
if (existsSync('/usr/lib/postgresql/16/bin/initdb') || existsSync('/usr/bin/initdb')) {
  const res = spawnSync('bash', [runner], { encoding: 'utf8' });
  const out = (res.stdout ?? '') + (res.stderr ?? '');
  ok(res.status === 0, 'offer-email SQL suite exits 0');
  ok(/offer-email SQL tests: ALL PASSED/.test(out), 'offer-email SQL suite reports ALL PASSED');
  ok(/128000 re-applied cleanly/.test(out), '128000 migration convergence holds');
} else {
  console.log('note: PostgreSQL server binaries not found — skipping live SQL run (static+behavioural checks still enforced).');
}

if (failures) { console.error(`\nautomated offer-email tests: ${failures} FAILED`); process.exit(1); }
console.log('\nautomated offer-email tests: ALL PASSED');
