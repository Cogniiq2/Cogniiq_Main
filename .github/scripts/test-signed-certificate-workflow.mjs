// Signed acceptance CERTIFICATE + CONFIRMATION workflow regression test. Four layers:
//   (A) BEHAVIOURAL — the import-free certificatePdf.ts + email.ts modules are transpiled and
//       executed: a real 8-bit RGBA PNG is decoded (inflate→unfilter→flatten) and embedded as a
//       DeviceRGB image XObject; the certificate PDF is valid, server-authoritative, contains no
//       private storage path, and is labelled a SIMPLE (not qualified/advanced) signature; the
//       confirmation email has HTML + plain-text bodies, escapes customer values, and a filename.
//   (B) STRUCTURAL (worker) — index.ts handles the new job types, terminates generation-only jobs
//       as 'completed' (never 'sent'), fetches the signature from the PRIVATE bucket, uses a
//       deterministic confirmation idempotency key, and logs nothing.
//   (C) STRUCTURAL (migration) — 127000 adds the settings + job types, enqueues the jobs, exposes
//       the certificate context to service-role only, dedupes the certificate register on the
//       signed flag, gates retry to the owner, and guards the Cron block.
//   (D) INTEGRATION — runs the throwaway-PostgreSQL certificate-workflow SQL suite end to end.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import zlib from 'node:zlib';
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

// Build a minimal 8-bit RGBA PNG (checkerboard of opaque-black / transparent) by hand.
function crc32(buf) { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function makePng(W, H) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = [];
  for (let y = 0; y < H; y++) { raw.push(0); for (let x = 0; x < W; x++) { const on = (x + y) % 2 === 0; raw.push(on ? 0 : 255, on ? 0 : 255, on ? 0 : 255, on ? 255 : 0); } }
  const idat = zlib.deflateSync(Buffer.from(raw));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- (A) certificate PDF
const cert = await loadTs('supabase/functions/send-offer-document-email/certificatePdf.ts');
const png = new Uint8Array(makePng(6, 3));
const decoded = await cert.decodePngToRgb(png);
ok(decoded && decoded.width === 6 && decoded.height === 3 && decoded.rgb.length === 6 * 3 * 3, 'PNG decodes to flattened DeviceRGB');
ok(decoded && decoded.rgb[0] === 0 && decoded.rgb[3] === 255, 'alpha is flattened onto white (opaque black stays black, transparent → white)');

const PRIVATE_PATH = '22222222-2222-2222-2222-222222222222/offer/sig-secret.png';
const ctx = {
  offer: { offer_number: 'AN-2026-0001', title: 'Digitale Infrastruktur äöüß', issue_date: '2026-07-01', currency: 'EUR',
    gross_total_cents: 9520000, document_version: 1, source_hash: 'a'.repeat(64), terms_version: 'annahme-v1' },
  signer: { name: 'Thomas Pensel', company: 'Pankofer GmbH', email: 'kunde@pankofer.test', role: 'Geschäftsführer' },
  recipient: { company: 'Pankofer GmbH', greeting_name: 'Herr Pensel' },
  signature: { level: 'simple_electronic_signature', sha256: 'f'.repeat(64), accepted_at: '2026-07-23T10:15:00Z', user_agent: 'Safari', ip_hash_present: true },
  seller: { legal_name: 'Cogniiq UG', owner_name: 'Max Muster', street: 'Beispielstr. 1', postal_code: '10115', city: 'Berlin',
    country_code: 'DE', email: 'info@cogniiq.de', phone: '+49 30 1234', website: 'cogniiq.de', vat_id: 'DE123456789', tax_number: null },
  acceptance_event_id: '11111111-2222-3333-4444-555555555555',
  // A private storage path is intentionally injected to prove it never lands in the customer PDF.
  _private: PRIVATE_PATH,
};
const pdf = await cert.renderAcceptanceCertificatePdf(ctx, png);
const bytesStr = new TextDecoder('latin1').decode(pdf);
ok(pdf instanceof Uint8Array && pdf.length > 1000, 'certificate PDF renders non-trivial bytes');
ok(new TextDecoder().decode(pdf.slice(0, 8)).startsWith('%PDF-1.'), 'certificate PDF has a valid header');
ok(bytesStr.includes('%%EOF') && bytesStr.includes('startxref'), 'certificate PDF has a valid trailer + xref');
ok(bytesStr.includes('/Subtype/Image') && bytesStr.includes('/Im0 Do'), 'the drawn signature is embedded as an image XObject');
ok(!bytesStr.includes('sig-secret.png') && !bytesStr.includes(PRIVATE_PATH), 'no private storage path appears in the customer PDF');
ok(!/qualifiziert|fortgeschritten(?!e und keine)/.test(bytesStr) || /keine qualifizierte/.test(bytesStr), 'never claims a qualified/advanced signature');
ok(cert.certificatePdfFilename('AN-2026-0001') === 'Annahmebestaetigung-AN-2026-0001-Cogniiq.pdf', 'filesystem-safe certificate filename');
ok(cert.certificatePdfFilename('AN 2026/0001; rm -rf') === 'Annahmebestaetigung-AN20260001rm-rf-Cogniiq.pdf', 'certificate filename is sanitised');
// Server-authoritative: rendering does not depend on any browser API, only the trusted ctx + PNG.
const pdfNoImg = await cert.renderAcceptanceCertificatePdf(ctx, null);
ok(new TextDecoder().decode(pdfNoImg.slice(0, 8)).startsWith('%PDF'), 'certificate still renders (graceful) without an embeddable image');

// Customer-facing acceptance timestamp is Berlin civil time (CEST here), with the German zone
// label and no raw UTC. accepted_at 10:15Z on 23.07. is 12:15 in Berlin summer time (MESZ).
ok(bytesStr.includes('12:15 Uhr') && bytesStr.includes('MESZ'), 'acceptance time is shown in Berlin civil time with the MESZ zone label');
ok(!bytesStr.includes(' UTC'), 'certificate no longer shows a raw UTC timestamp');
// Daylight-saving correctness: a winter instant crossing midnight in UTC rolls to the next Berlin
// day and is labelled MEZ (CET), proving the offset is chosen per-instant, not hard-coded.
const winterCtx = { ...ctx, signature: { ...ctx.signature, accepted_at: '2026-01-15T23:40:00Z' } };
const winterStr = new TextDecoder('latin1').decode(await cert.renderAcceptanceCertificatePdf(winterCtx, null));
ok(winterStr.includes('16.01.2026') && winterStr.includes('00:40 Uhr') && winterStr.includes('MEZ'), 'winter acceptance uses MEZ and the correct next-day Berlin date (DST-aware)');

// ---------------------------------------------------------------- (A) confirmation email
const email = await loadTs('supabase/functions/send-offer-document-email/email.ts');
const confCtx = {
  offer: { offer_number: 'AN-2026-0001', currency: 'EUR', gross_total_cents: 9520000 },
  signature: { accepted_at: '2026-07-23T10:15:00Z' },
  signer: { name: 'Thomas Pensel' },
  recipient: { company: 'Pankofer', greeting_name: '<script>alert(1)</script>' },
  seller: { legal_name: 'Cogniiq UG', email: 'info@cogniiq.de', phone: '+49 30 1234', website: 'cogniiq.de' },
};
const conf = email.buildConfirmationEmail(confCtx);
ok(conf.subject.includes('AN-2026-0001') && /best/i.test(conf.subject), 'confirmation subject confirms the accepted offer');
ok(conf.html.includes('95.200,00') && conf.html.includes('23.07.2026'), 'confirmation email shows amount + acceptance date');
ok(!conf.html.includes('<script>alert(1)</script>') && conf.html.includes('&lt;script&gt;'), 'customer value is HTML-escaped');
ok(conf.text.includes('AN-2026-0001'), 'plain-text body carries the offer number');
// Plain-text alternative on a clean recipient contains no HTML tags of its own.
const confClean = email.buildConfirmationEmail({ ...confCtx, recipient: { company: 'Pankofer', greeting_name: 'Herr Pensel' } });
ok(confClean.text && !/<\/?[a-z][^>]*>/i.test(confClean.text), 'a plain-text alternative (no HTML tags) is included');
// Template placeholders (subject not HTML-escaped; body escaped).
const conf2 = email.buildConfirmationEmail({ ...confCtx, recipient: { company: 'Pankofer', greeting_name: 'Herr Pensel' },
  templates: { subject: 'Annahme {{offer_number}} bestätigt', body: 'Hallo {{recipient_name}}, Betrag {{gross_total}}.' } });
ok(conf2.subject === 'Annahme AN-2026-0001 bestätigt', 'confirmation subject template placeholders substituted');
ok(/Herr Pensel/.test(conf2.html) && /95\.200,00/.test(conf2.html), 'confirmation body template placeholders substituted');
// The acceptance date is the Berlin calendar day of the instant: a 22:30Z acceptance already
// belongs to the next day in Germany, so the confirmation must show the 24th, not the 23rd.
const confLate = email.buildConfirmationEmail({ ...confCtx, signature: { accepted_at: '2026-07-23T22:30:00Z' } });
ok(confLate.html.includes('24.07.2026') && !confLate.html.includes('23.07.2026'), 'confirmation acceptance date uses the Berlin calendar day, not the UTC day');

// ---------------------------------------------------------------- (B) worker structural
const idx = read('supabase/functions/send-offer-document-email/index.ts');
ok(/signed_offer_certificate_generate/.test(idx) && /signed_offer_confirmation_email/.test(idx), 'worker handles the signed-offer job types');
ok(/renderAcceptanceCertificatePdf/.test(idx), 'worker renders the certificate from server context');
ok(/SIGNATURE_BUCKET/.test(idx) && /\.download\(sigPath\)/.test(idx), 'worker fetches the signature PNG from the PRIVATE bucket');
ok(/owner_worker_register_certificate/.test(idx), 'worker registers the certificate as a signed document');
ok(/terminal: 'completed'/.test(idx), "generation-only jobs terminate as 'completed', never 'sent'");
ok(/buildConfirmationEmail/.test(idx) && /idempotencyKey: `\$\{job\.id\}:confirmation`/.test(idx), 'confirmation email uses a deterministic idempotency key');
ok(/throw new Error\(`unknown job type/.test(idx), 'unknown job types fail safely (never silently succeed)');
ok(!/console\.(log|error|info)/.test(idx), 'worker logs nothing (no token/secret/byte/path leakage)');
ok(!new RegExp('storage_path[^\\n]*console').test(idx), 'private storage path is never logged');

// ---------------------------------------------------------------- (C) migration structural
const mig = read('supabase/migrations/20260723127000_owner_signed_certificate_workflow.sql');
ok(/auto_generate_signed_certificate_on_acceptance boolean not null default true/.test(mig), 'certificate setting added (default on)');
ok(/auto_send_signed_confirmation_on_acceptance boolean not null default true/.test(mig), 'confirmation setting added (default on)');
ok(/'signed_offer_certificate_generate'/.test(mig) && /'signed_offer_confirmation_email'/.test(mig) && /'invoice_pdf_generate'/.test(mig), 'job_type CHECK extended with the new types');
ok(/owner_enqueue_automation_job\([^)]*'signed_offer_certificate_generate'/.test(mig.replace(/\n/g, ' ')), 'acceptance pipeline enqueues the certificate job');
ok(/function public\.owner_worker_certificate_context/.test(mig) && /request_is_service_role\(\)/.test(mig), 'certificate context is service-role only');
ok(/document_type = 'offer' and status = 'finalized' and render_metadata->>'signed' = 'true'/.test(mig), 'certificate register dedupes on the signed flag');
ok(/function public\.owner_retry_automation_job/.test(mig) && /is_platform_owner\(\)/.test(mig), 'retry RPC is owner-gated');
ok(/completed/.test(mig) && /power\(2/.test(mig), "completion supports 'completed' + keeps exponential backoff");
ok(/pg_cron/.test(mig) && /execute \$q\$/.test(mig) && /NO-OP/.test(mig), 'Cron block is guarded (no-op without Vault + pg_cron)');
ok(/does NOT modify any previously applied migration/i.test(mig), 'migration documents itself as additive');
ok((mig.match(/request_is_service_role\(\)/g) || []).length >= 3, 'worker RPCs are service-role gated');

// ---------------------------------------------------------------- (D) live SQL suite
const runner = resolve(here, 'run-certificate-workflow-sql-tests.sh');
if (existsSync('/usr/lib/postgresql/16/bin/initdb') || existsSync('/usr/bin/initdb') || existsSync('/usr/lib/postgresql')) {
  const res = spawnSync('bash', [runner], { encoding: 'utf8' });
  const out = (res.stdout ?? '') + (res.stderr ?? '');
  ok(res.status === 0, 'certificate-workflow SQL suite exits 0');
  ok(/certificate-workflow SQL tests: ALL PASSED/.test(out), 'certificate-workflow SQL suite reports ALL PASSED');
  ok(/127000 re-applied cleanly/.test(out), '127000 migration convergence holds');
} else {
  console.log('note: PostgreSQL server binaries not found — skipping live SQL run (static+behavioural checks still enforced).');
}

if (failures) { console.error(`\nsigned certificate workflow tests: ${failures} FAILED`); process.exit(1); }
console.log('\nsigned certificate workflow tests: ALL PASSED');
