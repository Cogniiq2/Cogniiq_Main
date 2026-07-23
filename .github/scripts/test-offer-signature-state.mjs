// Regression tests for the owner-dashboard signed-state derivation (the "still shows Nicht
// unterzeichnet after a real signature was captured" bug). Two layers:
//   (A) BEHAVIOURAL — the pure `offerSignatureState.ts` module is bundled with esbuild and executed,
//       so the real shipped derivation logic is tested (accepted / signatureCaptured /
//       signedDocumentGenerated and the German labels).
//   (B) STRUCTURAL — static source assertions (the repo has no React test runner) that lock in the
//       acceptance-summary loading, the private-bucket short-lived signed-URL signature preview,
//       the absence of any public signature URL, and the focus-based refetch of acceptance data.

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

// ---------------------------------------------------------------- (A) behavioural derivation
const entry = resolve(root, 'src/lib/ownerFinance/offerSignatureState.ts');
const bundled = await build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
const m = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const derive = m.deriveOfferSignatureState;

const SIG = { signature_storage_path: 'entity/offer/sig-123.png', signature_sha256: 'a'.repeat(64) };

// 1. accepted offer with no signature path => "Angenommen, keine Unterschrift erfasst"
{
  const s = derive({ status: 'accepted', acceptance: { accepted: true, signature_storage_path: null, signature_sha256: null } });
  ok(s.accepted === true, '1: accepted true when status accepted');
  ok(s.signatureCaptured === false, '1: signatureCaptured false without path/hash');
  ok(s.primaryLabel === 'Angenommen, keine Unterschrift erfasst', '1: label = Angenommen, keine Unterschrift erfasst');
  ok(s.signatureStatusLabel === 'Nicht erfasst', '1: signature status = Nicht erfasst');
}

// 2. accepted offer with both signature path and hash => "Unterzeichnet"
{
  const s = derive({ status: 'accepted', acceptance: { accepted: true, ...SIG } });
  ok(s.signatureCaptured === true, '2: signatureCaptured true with path+hash');
  ok(s.primaryLabel === 'Unterzeichnet', '2: label = Unterzeichnet');
  ok(s.primaryTone === 'success', '2: tone success');
  ok(s.signatureStatusLabel === 'Erfasst', '2: signature status = Erfasst');
  ok(s.primaryLabel !== 'Nicht unterzeichnet', '2: never "Nicht unterzeichnet" when signed');
}

// 3. signature exists but signed document unavailable => still "Unterzeichnet"
{
  const s = derive({ status: 'accepted', acceptance: { accepted: true, ...SIG }, signedDocumentAvailable: false });
  ok(s.signatureCaptured === true && s.primaryLabel === 'Unterzeichnet', '3: signed even without certificate PDF');
  ok(s.signedDocumentGenerated === false, '3: signedDocumentGenerated false');
  ok(s.certificateStatusLabel === 'Wird vorbereitet', '3: certificate = Wird vorbereitet');
}

// 4. signed_document_available = false does not change signature status
{
  const withDoc = derive({ status: 'accepted', acceptance: { accepted: true, ...SIG }, signedDocumentAvailable: true });
  const withoutDoc = derive({ status: 'accepted', acceptance: { accepted: true, ...SIG }, signedDocumentAvailable: false });
  ok(withDoc.signatureCaptured === withoutDoc.signatureCaptured, '4: signatureCaptured independent of signed doc');
  ok(withDoc.primaryLabel === withoutDoc.primaryLabel && withDoc.primaryLabel === 'Unterzeichnet', '4: primary label unchanged by signed doc');
}

// 5. signed certificate state is shown separately
{
  const s = derive({ status: 'accepted', acceptance: { accepted: true, ...SIG }, signedDocumentAvailable: true });
  ok(s.certificateStatusLabel === 'Verfügbar', '5: certificate available shown separately');
  ok(s.signedDocumentGenerated === true, '5: signedDocumentGenerated true');
}

// 9. offers converted to invoice still retain signed status
{
  const s = derive({ status: 'converted', acceptance: { accepted: true, ...SIG } });
  ok(s.accepted === true, '9: converted counts as accepted');
  ok(s.signatureCaptured === true && s.primaryLabel === 'Unterzeichnet', '9: converted offer stays Unterzeichnet');
}

// Extra: acceptance.accepted flag alone (status not accepted) still counts as accepted.
{
  const s = derive({ status: 'sent', acceptance: { accepted: true, signature_storage_path: null, signature_sha256: null } });
  ok(s.accepted === true, 'accepted flag honoured even if status not accepted/converted');
}
// Extra: half-populated signature (path but no hash) is NOT captured.
{
  const s = derive({ status: 'accepted', acceptance: { accepted: true, signature_storage_path: SIG.signature_storage_path, signature_sha256: null } });
  ok(s.signatureCaptured === false, 'path without hash is not a captured signature');
}
// isSignedCertificateDocument mirrors the SQL definition (document_type='offer' + render_metadata.signed).
{
  ok(m.isSignedCertificateDocument({ document_type: 'offer', pdf_storage_path: 'p', render_metadata: { signed: 'true' } }) === true, 'signed certificate doc recognised');
  ok(m.isSignedCertificateDocument({ document_type: 'offer', pdf_storage_path: 'p', render_metadata: { signed: true } }) === true, 'signed certificate doc recognised (bool)');
  ok(m.isSignedCertificateDocument({ document_type: 'offer', pdf_storage_path: 'p', render_metadata: {} }) === false, 'unsigned offer doc not a certificate');
  ok(m.isSignedCertificateDocument({ document_type: 'offer', pdf_storage_path: null, render_metadata: { signed: 'true' } }) === false, 'no stored PDF => not a certificate');
}

// ---------------------------------------------------------------- (B) structural wiring
const detail = read('src/pages/owner/OfferDetailPage.tsx');
const api = read('src/lib/ownerFinance/offersApi.ts');
const types = read('src/lib/ownerFinance/types.ts');

// Detail page derives the signed state through the shared helper (single source of truth).
ok(/deriveOfferSignatureState\(/.test(detail), 'B: detail page uses deriveOfferSignatureState');
ok(/isSignedCertificateDocument/.test(detail), 'B: detail page derives signed-certificate availability from generated docs');
ok(!/Nicht unterzeichnet/.test(detail), 'B: detail page never renders the literal "Nicht unterzeichnet"');

// 6. signature preview requests a short-lived signed URL from the private bucket.
ok(/signedSignatureUrl\(/.test(detail), '6: detail page requests a signed signature URL');
ok(/createSignedUrl\(\s*storagePath\s*,\s*expiresIn\s*\)/.test(api) && /owner-offer-signatures/.test(api), '6: signedSignatureUrl uses createSignedUrl on the private owner-offer-signatures bucket');
ok(/SIGNATURE_PREVIEW_TTL_SECONDS\s*=\s*(6\d|[12]\d\d|300)\b/.test(detail), '6: preview TTL is short-lived (60–300s)');

// 7. no public signature URL is created anywhere for the signatures bucket.
ok(!/owner-offer-signatures[\s\S]*getPublicUrl|getPublicUrl[\s\S]*owner-offer-signatures/.test(api), '7: no getPublicUrl for the signatures bucket');
ok(!/getPublicUrl/.test(detail), '7: detail page never builds a public URL');

// 8. owner dashboard refreshes acceptance data (focus/visibility refetch, no hard reload needed).
ok(/loadAcceptanceSummary\(/.test(detail), '8: detail page loads owner_offer_acceptance_summary');
ok(/visibilitychange/.test(detail) && /addEventListener\('focus'/.test(detail), '8: refetches acceptance data on focus/visibility');

// 10. existing offer + invoice functionality preserved (key wiring still present).
ok(/convertOfferToInvoiceDraft\(/.test(detail), '10: convert-to-invoice action preserved');
ok(/finalizeOffer\(/.test(detail) && /createOfferRevision\(/.test(detail), '10: finalize + revision actions preserved');

// Summary interface exposes every field the summary RPC returns (path + hash + level + evidence).
for (const f of ['accepted', 'accepted_at', 'signer_name', 'signer_company', 'signer_email', 'signer_role',
  'signature_level', 'signature_storage_path', 'signature_sha256', 'document_version', 'source_hash', 'invoice', 'automation_jobs']) {
  ok(new RegExp(`${f}\\??:`).test(types.slice(types.indexOf('OwnerOfferAcceptanceSummary'))), `interface: OwnerOfferAcceptanceSummary.${f}`);
}

if (failures) { console.error(`offer signature-state tests: ${failures} FAILED`); process.exit(1); }
console.log('offer signature-state tests: ALL PASSED');
