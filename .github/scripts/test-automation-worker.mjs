// Production automation-worker regression test. Three layers:
//   (A) BEHAVIOURAL — the import-free invoicePdf.ts + email.ts modules are transpiled and
//       executed: valid PDF bytes, HTML escaping of customer values, plain-text alternative,
//       gender-safe greeting, and the EXACT offer portal link (never the app root).
//   (B) STRUCTURAL — static assertions on the worker + migration (auth, atomic claim, real
//       per-job-type ops, Resend idempotency, privacy).
//   (C) INTEGRATION — runs the throwaway-PostgreSQL worker SQL suite end to end (atomic
//       claim, SKIP LOCKED concurrency, idempotent issue, retry/backoff, hash-only link).

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

// ---------------------------------------------------------------- (A) invoice PDF
const pdfMod = await loadTs('supabase/functions/send-offer-document-email/invoicePdf.ts');
const ctx = {
  invoice: { invoice_number: 'RE-2026-0001', issue_date: '2026-07-22', due_date: '2026-08-05', currency: 'EUR',
    net_total_cents: 8000000, vat_total_cents: 1520000, gross_total_cents: 9520000 },
  lines: [{ description: 'Digitale Infrastruktur – Modul 1 (Ü/ä/ö/ß)', quantity_milli: 1000, unit_price_cents: 8000000, net_cents: 8000000, vat_rate_bp: 1900 }],
  recipient: { company: 'Pankofer GmbH', contact_name: 'Herr Pensel', street: 'Weg 2', postal_code: '84359', city: 'Simbach' },
  seller: { legal_name: 'Cogniiq UG', street: 'Beispielstr. 1', postal_code: '10115', city: 'Berlin', email: 'info@cogniiq.de',
    phone: null, vat_id: 'DE123456789', tax_number: null, iban: 'DE00', bic: 'COBADEFF', bank_name: 'Bank', bank_account_holder: 'Cogniiq UG' },
};
const pdf = pdfMod.renderInvoicePdf(ctx);
const head = new TextDecoder().decode(pdf.slice(0, 8));
const tail = new TextDecoder('latin1').decode(pdf.slice(-32));
ok(pdf instanceof Uint8Array && pdf.length > 400, 'invoice PDF renders non-trivial bytes');
ok(head.startsWith('%PDF-1.'), 'invoice PDF has a valid header');
ok(tail.includes('%%EOF'), 'invoice PDF ends with %%EOF');
ok(new TextDecoder('latin1').decode(pdf).includes('startxref'), 'invoice PDF has an xref table');
ok(pdfMod.invoicePdfFilename('RE-2026-0001') === 'Rechnung-RE-2026-0001-Cogniiq.pdf', 'professional invoice filename');
ok(pdfMod.invoicePdfFilename('RE 2026/0001; rm -rf') === 'Rechnung-RE20260001rm-rf-Cogniiq.pdf', 'filename is sanitised');

// ---------------------------------------------------------------- (A) email content
const email = await loadTs('supabase/functions/send-offer-document-email/email.ts');
const xssCtx = {
  invoice: { invoice_number: 'RE-2026-0001', currency: 'EUR', due_date: '2026-08-05', gross_total_cents: 9520000 },
  recipient: { company: 'Pankofer', greeting_name: '<script>alert(1)</script>' },
  seller: { legal_name: 'Cogniiq UG' },
};
const invMail = email.buildInvoiceEmail(xssCtx);
ok(!invMail.html.includes('<script>alert(1)</script>'), 'customer value is HTML-escaped in the email');
ok(invMail.html.includes('&lt;script&gt;'), 'escaped entity is present');
ok(invMail.subject.includes('RE-2026-0001'), 'invoice subject carries the invoice number');
// Plain-text alternative: present and contains no HTML tags (a clean recipient).
const cleanMail = email.buildInvoiceEmail({ ...xssCtx, recipient: { company: 'Pankofer', greeting_name: 'Herr Pensel' } });
ok(cleanMail.text && !/<\/?[a-z][^>]*>/i.test(cleanMail.text), 'a plain-text alternative (no HTML tags) is included');
ok(email.recipientName({ salutation: 'herr', last_name: 'Pensel' }) === 'Herr Pensel', 'greeting: Herr only when explicit');
ok(email.recipientName({ first_name: 'Alex', last_name: 'Meyer' }) === 'Alex Meyer', 'greeting: no gender inference');
// placeholder templating (escaped)
const tplCtx = { ...xssCtx, recipient: { company: 'Pankofer', greeting_name: 'Herr Pensel' },
  templates: { subject: 'Rechnung {{invoice_number}}', body: 'Hallo {{recipient_name}}, {{gross_total}} bis {{due_date}}.' } };
const tplMail = email.buildInvoiceEmail(tplCtx);
ok(tplMail.subject === 'Rechnung RE-2026-0001', 'subject template placeholders substituted');
ok(/Herr Pensel/.test(tplMail.html) && /95\.200,00/.test(tplMail.html), 'body template placeholders substituted');
// offer email uses the EXACT portal link, never the app root
const offerMail = email.buildOfferEmail({ offer_number: 'AN-2026-0001', valid_until: '2026-07-31',
  recipient: { greeting_name: 'Herr Pensel' }, seller: { legal_name: 'Cogniiq' } }, 'https://app.cogniiq.de/d/RAWTOKEN123');
ok(offerMail.html.includes('https://app.cogniiq.de/d/RAWTOKEN123'), 'offer email links to the exact portal URL');
ok(!/href="https:\/\/app\.cogniiq\.de\/"/.test(offerMail.html), 'offer email never links to the app root');

// ---------------------------------------------------------------- (B) worker structural
const idx = read('supabase/functions/send-offer-document-email/index.ts');
ok(/WORKER_SECRET = Deno\.env\.get/.test(idx), 'WORKER_SECRET read from env only');
ok(/function safeEqual/.test(idx) && /diff \|=/.test(idx), 'constant-time secret comparison');
ok(/x-worker-secret/.test(idx) && /unauthorized.*401|401\)/.test(idx.replace(/\n/g, ' ')), 'missing/incorrect secret rejected with 401');
ok(/owner_claim_automation_jobs/.test(idx), 'jobs claimed via the atomic claim RPC');
ok(/owner_issue_invoice_internal/.test(idx), 'invoice_issue performs the real issue');
ok(/if \(error\) throw new Error\('invoice issue failed'\); \/\/ NOT marked sent/.test(idx), 'issue failure is not marked sent');
ok(/owner_ensure_offer_invoice_internal/.test(idx), 'invoice_create uses idempotent conversion');
ok(/renderInvoicePdf\(ctx\)/.test(idx) && /FINANCE_BUCKET/.test(idx) && /upsert: true/.test(idx), 'invoice PDF generated + stored privately');
ok(/owner_worker_register_document/.test(idx), 'generated invoice document is registered');
ok(/attachment: \{ filename, contentBase64: toBase64\(pdf\) \}/.test(idx), 'PDF attached as Base64 bytes');
ok(/'Idempotency-Key': opts\.idempotencyKey/.test(idx), 'Resend Idempotency-Key header set');
ok(/idempotencyKey: `\$\{job\.id\}:\$\{version\}`/.test(idx), 'idempotency key is deterministic (jobId:version)');
ok(/owner_worker_mint_offer_link/.test(idx) && /\$\{PUBLIC_APP_URL\}\/d\/\$\{minted\.token\}/.test(idx), 'offer_email mints a fresh token + exact /d/ link');
ok(/owner_complete_automation_job/.test(idx), 'outcomes recorded via complete RPC');
ok(!/console\.(log|error|info)/.test(idx), 'worker logs nothing (no token/secret/byte leakage)');
ok(!/x-worker-secret[^]*console/.test(idx), 'secret never logged');

// ---------------------------------------------------------------- (B) migration structural
const mig = read('supabase/migrations/20260723126000_owner_automation_worker.sql');
ok(/for update skip locked/i.test(mig), 'claim uses FOR UPDATE SKIP LOCKED');
ok((mig.match(/request_is_service_role\(\)/g) || []).length >= 7, 'every worker RPC is service-role gated');
ok(/function public\.owner_issue_invoice_internal/.test(mig) && /due_date is required/.test(mig), 'internal issue runs full preflight');
ok(/function public\.owner_complete_automation_job/.test(mig) && /power\(2/.test(mig), 'completion applies exponential backoff');
ok(/if j\.status = 'sent' then/.test(mig), 'sent jobs are terminal/idempotent');
ok(/Raw token returned ONCE; only its hash is stored/.test(mig) && /token_hash/.test(mig), 'mint stores only the hash');
ok(/does NOT modify any previously applied migration/i.test(mig), 'migration documents itself as additive');

// ---------------------------------------------------------------- (C) live SQL suite
const runner = resolve(here, 'run-automation-worker-sql-tests.sh');
if (existsSync('/usr/lib/postgresql/16/bin/initdb') || existsSync('/usr/bin/initdb')) {
  const res = spawnSync('bash', [runner], { encoding: 'utf8' });
  const out = (res.stdout ?? '') + (res.stderr ?? '');
  ok(res.status === 0, 'automation-worker SQL suite exits 0');
  ok(/automation-worker SQL tests: ALL PASSED/.test(out), 'worker SQL suite reports ALL PASSED');
  ok(/PASS concurrent workers never claim the same job/.test(out), 'two-connection SKIP LOCKED concurrency holds');
  ok(/migration convergence: 126000 re-applied cleanly/.test(out), '126000 migration convergence holds');
} else {
  console.log('note: PostgreSQL server binaries not found — skipping live SQL run (static+behavioural checks still enforced).');
}

if (failures) { console.error(`\nautomation worker tests: ${failures} FAILED`); process.exit(1); }
console.log('\nautomation worker tests: ALL PASSED');
