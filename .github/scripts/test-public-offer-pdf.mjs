#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// The customer's offer PDF, from the public /d/:token portal.
//
//   node .github/scripts/test-public-offer-pdf.mjs [--verbose] [--keep <dir>]
//
// Why this exists: the PDF the customer downloaded was produced by
// renderTransactionalPdf — the GENERIC finance-report renderer. Its model folds
// paymentTerms, deliveryTerms, assumptions and exclusions into one `keyvalue`
// section, and the keyValue() painter in exports/pdf.ts draws every value as ONE
// right-aligned line and then steps Y by a fixed 15pt. Contractual prose is long,
// so on the real AN-2026-0009 offer the values ran off BOTH page edges and were
// painted straight over the "Zahlungsbedingungen" / "Lieferbedingungen" /
// "Annahmen" / "Ausschlüsse" labels beneath them. The same renderer has no premium
// sections at all, truncates module titles, and its WinAnsi encoder maps "→" to "?".
//
// The portal now renders the PREMIUM engine — the same template that backs
// PremiumOfferWebView — through a pure adapter over the finalized snapshot.
//
// This test renders the REAL artifact through the REAL adapter and engine, then
// checks the things text alone cannot: word-level geometry (overlap, clipping,
// footer collisions) and a PNG of every page for inspection.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';

import {
  renderPublicOfferPdf, buildPublicOfferDocument, renderLegacyTransactionalPdf,
} from './lib/public-offer-pdf-render.mjs';
import {
  hasPoppler, readLayout, findOverlaps, findOutOfBounds, findFooterCollisions,
  renderPagesToPng, writePdf,
} from './lib/pdf-layout.mjs';
import { PDF_OFFER_PROJECTION, EXPECTED_EXCLUSIONS, EXPECTED_ASSUMPTIONS }
  from './fixtures/public-offer-pdf-fixture.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const VERBOSE = process.argv.includes('--verbose');
const keepAt = process.argv.indexOf('--keep');
const OUT = keepAt > -1 ? resolve(process.argv[keepAt + 1]) : mkdtempSync(join(tmpdir(), 'offer-pdf-'));

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);
const check = (c, pass, bad) => (c ? ok(pass) : fail(bad));

// ── 1. The portal must not use the generic transactional renderer ────────────
{
  const portal = readFileSync(resolve(ROOT, 'src/pages/public/PublicDocumentPortal.tsx'), 'utf8');
  // Strip comments first: the download function explains the old renderer by name, and that
  // prose must not read as a usage.
  const code = portal.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  check(
    !/renderTransactionalPdf/.test(code),
    'the public offer portal no longer imports renderTransactionalPdf',
    'the public offer portal still uses renderTransactionalPdf — the generic keyvalue '
      + 'renderer that overlapped the contractual text'
  );
  check(
    /renderPremiumPdf/.test(code) && /publicOfferToPremiumDocument/.test(code),
    'the portal renders the premium engine via the public-offer adapter',
    'the portal does not call renderPremiumPdf(publicOfferToPremiumDocument(...))'
  );
  // Both download buttons must be the same function, so accepting cannot switch the
  // customer onto a different rendering path.
  const downloadProps = [...code.matchAll(/onDownload=\{([^}]*)\}/g)].map((m) => m[1].trim());
  check(
    downloadProps.length >= 2 && new Set(downloadProps).size === 1,
    `both download buttons call the same renderer (${downloadProps.length} call sites, 1 implementation)`,
    `the download buttons diverged: ${JSON.stringify(downloadProps)}`
  );
}

// ── 2. The adapter keeps every field the customer saw ────────────────────────
{
  const doc = await buildPublicOfferDocument(PDF_OFFER_PROJECTION);
  const p = PDF_OFFER_PROJECTION;
  const expectations = [
    ['documentNumber', doc.documentNumber === p.offer_number],
    ['title', doc.title === p.title],
    ['subtitle', doc.subtitle === p.subtitle],
    ['introduction', doc.introduction === p.introduction],
    ['executiveSummary', doc.executiveSummary === p.executive_summary],
    ['projectApproach', doc.projectApproach === p.project_approach],
    ['desiredOutcomes', doc.desiredOutcomes.length === p.desired_outcomes.length],
    ['nextSteps', doc.nextSteps === p.next_steps],
    ['paymentTerms', doc.paymentTerms === p.payment_terms],
    ['deliveryTerms', doc.deliveryTerms === p.delivery_terms],
    ['assumptions', doc.assumptions === p.assumptions],
    ['exclusions', doc.exclusions === p.exclusions],
    ['timeline', doc.timeline.length === p.timeline.length],
    ['paymentSchedule', doc.paymentSchedule.length === p.payment_schedule.length],
    ['lines', doc.lines.length === p.lines.length],
    ['seller', doc.seller.name === p.seller.legal_name && doc.seller.vatId === p.seller.vat_id],
    ['recipient', doc.recipient.name === p.recipient.company],
    ['issue/valid dates', doc.issueDate === p.issue_date && doc.validUntil === p.valid_until],
    ['net/vat/gross totals', doc.netTotalCents === p.net_total_cents
      && doc.vatTotalCents === p.vat_total_cents && doc.grossTotalCents === p.gross_total_cents],
    ['module deliverables', doc.lines[0].deliverables.length === p.lines[0].deliverables.length],
  ];
  for (const [field, held] of expectations) {
    check(held, `adapter preserves ${field}`, `adapter DROPPED or altered ${field}`);
  }
  check(doc.isDraft === false, 'the customer document is never a draft', 'the customer document is marked draft');
  check(
    doc.lines[1].pricingType === 'recurring' && doc.lines[1].netCents === 39000,
    'the recurring position stays 390,00 EUR PER MONTH (never multiplied by the term)',
    `the recurring position was altered: ${doc.lines[1].pricingType} ${doc.lines[1].netCents}`
  );
  // Determinism: the same snapshot must give byte-identical input, before and after
  // acceptance.
  const again = await buildPublicOfferDocument(PDF_OFFER_PROJECTION);
  check(
    JSON.stringify(doc) === JSON.stringify(again),
    'the adapter is deterministic — the same snapshot always yields the same document',
    'the adapter produced two different documents for one snapshot'
  );
  const accepted = await buildPublicOfferDocument({
    ...PDF_OFFER_PROJECTION, accepted: true, accepted_signer_name: 'Alex Muster', accepted_at: '2026-08-26T09:00:00Z',
  });
  check(
    JSON.stringify(doc) === JSON.stringify(accepted),
    'accepting the offer does not change the rendered document',
    'the document changed after acceptance — the customer would get a different PDF'
  );
}

// ── 3. Render the real PDF ───────────────────────────────────────────────────
const bytes = await renderPublicOfferPdf(PDF_OFFER_PROJECTION);
const pdfPath = writePdf(bytes, join(OUT, 'public-offer.pdf'));
check(
  Buffer.from(bytes.slice(0, 5)).toString('latin1') === '%PDF-',
  `renders a real PDF (${bytes.length} bytes)`,
  'output is not a PDF'
);

if (!hasPoppler()) {
  console.log('SKIP: poppler (pdftotext) not installed — text and layout checks not run.');
  console.log(failures.length === 0 ? '\nPublic offer PDF: all runnable checks passed.' : `\nPublic offer PDF: ${failures.length} failure(s).`);
  if (keepAt === -1) rmSync(OUT, { recursive: true, force: true });
  process.exit(failures.length === 0 ? 0 : 1);
}

const text = execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' });
const flat = text.replace(/\s+/g, ' ');
const pages = readLayout(pdfPath);

// ── 4. Pagination: long content is allowed to need more pages ────────────────
check(pages.length >= 2, `the long offer paginates properly (${pages.length} pages)`,
  `the offer was forced onto ${pages.length} page(s)`);
if (VERBOSE) {
  const legacy = await renderLegacyTransactionalPdf(PDF_OFFER_PROJECTION);
  const legacyPages = readLayout(writePdf(legacy, join(OUT, 'legacy.pdf'))).length;
  console.log(`   generic transactional renderer: ${legacyPages} page(s); premium engine: ${pages.length} page(s)`);
}

// ── 5. Layout geometry — what text extraction alone cannot see ───────────────
{
  const overlaps = pages.flatMap((p) => findOverlaps(p));
  const oob = pages.flatMap((p) => findOutOfBounds(p));
  const footer = pages.flatMap((p) => findFooterCollisions(p));
  check(overlaps.length === 0, 'no overlapping text anywhere in the document',
    `overlapping text: ${overlaps.slice(0, 3).map((o) => `p${o.page} "${o.a}" over "${o.b}"`).join(' | ')}`);
  check(oob.length === 0, 'no text outside the printable page area',
    `text outside the page: ${oob.slice(0, 3).map((o) => `p${o.page} "${o.text}" @${o.box}`).join(' | ')}`);
  check(footer.length === 0, 'no body text collides with the footer band',
    `footer collisions: ${footer.slice(0, 3).map((f) => `p${f.page} "${f.text}"`).join(' | ')}`);

  // A bullet split across a page break leaves its marker behind and its text unmarked.
  const emptyBullets = pages.flatMap((p) => p.lines.filter((l) => l.text.trim() === '•').map(() => p.number));
  check(emptyBullets.length === 0, 'no list bullet is orphaned at a page break',
    `orphaned bullets on page(s) ${[...new Set(emptyBullets)].join(', ')}`);

  // A section heading must not be the last thing on a page.
  const HEADINGS = ['Projektmodule', 'Investitionsübersicht', 'Zahlungsplan', 'Annahmen & Ausschlüsse', 'Nächste Schritte', 'Zeitplan & Zusammenarbeit'];
  const orphanHeadings = [];
  for (const p of pages) {
    const last = [...p.lines].sort((a, b) => b.yMax - a.yMax).filter((l) => l.text.trim() && !/Seite \d+|cogniiq/i.test(l.text))[0];
    if (last && HEADINGS.some((h) => last.text.trim() === h)) orphanHeadings.push(`p${p.number}: ${last.text.trim()}`);
  }
  check(orphanHeadings.length === 0, 'no section heading is orphaned at the foot of a page',
    `orphaned headings: ${orphanHeadings.join(', ')}`);
}

// ── 6. Glyphs ────────────────────────────────────────────────────────────────
check(!text.includes('?'), 'no "?" replacing an intended symbol',
  `a "?" is present: ${(/.{0,30}\?.{0,20}/.exec(text) || [''])[0]}`);
check(/€/.test(text), 'the euro glyph renders', 'no euro glyph');
check(/Ausschlüsse|Gültig|beträgt/.test(text), 'German umlauts render', 'umlauts are broken');

// ── 7. Content completeness ──────────────────────────────────────────────────
{
  const missingExclusions = EXPECTED_EXCLUSIONS.filter((e) => !flat.includes(e.replace(/\s+/g, ' ')));
  check(missingExclusions.length === 0,
    `all ${EXPECTED_EXCLUSIONS.length} exclusion entries are present and complete`,
    `${missingExclusions.length} exclusion(s) missing or truncated: ${missingExclusions.slice(0, 2).join(' | ').slice(0, 160)}`);

  const missingAssumptions = EXPECTED_ASSUMPTIONS.filter((a) => !flat.includes(a.replace(/\s+/g, ' ')));
  check(missingAssumptions.length === 0,
    `all ${EXPECTED_ASSUMPTIONS.length} assumption entries are present and complete`,
    `${missingAssumptions.length} assumption(s) missing or truncated`);

  check(flat.includes(PDF_OFFER_PROJECTION.payment_terms.replace(/\s+/g, ' ')),
    'the full payment terms are present, unclipped', 'the payment terms are clipped');
  check(flat.includes(PDF_OFFER_PROJECTION.delivery_terms.replace(/\s+/g, ' ')),
    'the full delivery terms are present, unclipped', 'the delivery terms are clipped');

  for (const [label, needle] of [
    ['offer number', 'AN-2026-0009'],
    ['title', 'SV Heinersreuth'],
    ['subtitle', 'Zentrale Verwaltung für Buchungen'],
    ['introduction', 'Der Verein verfügt bereits'],
    ['executive summary', 'operative Grundlage für die interne Verwaltung'],
    ['project approach', 'zentrale, geschützte Verwaltungsoberfläche'],
    ['desired outcomes', 'Zentrale interne Verwaltungsoberfläche'],
    ['module section', 'Projektmodule'],
    ['investment overview', 'Investitionsübersicht'],
    ['timeline', 'Zeitplan'],
    ['payment schedule', 'Zahlungsplan'],
    ['assumptions/exclusions section', 'Annahmen & Ausschlüsse'],
    ['next steps', 'Nächste Schritte'],
    ['recipient', 'Testverein Musterstadt'],
    ['seller VAT id', 'DE460292419'],
  ]) {
    check(flat.includes(needle), `the PDF contains the ${label}`, `the PDF is missing the ${label} ("${needle}")`);
  }

  // Module titles are not truncated (the generic renderer ellipsised them).
  check(flat.includes('Admin-Dashboard & Verwaltungsoberfläche'),
    'module titles are complete, not truncated', 'a module title is truncated');
  check(!/…/.test(text), 'no ellipsis truncation marker in the document', 'the document contains a truncation ellipsis');
}

// ── 8. Pricing: one-time stays one-time, recurring stays recurring ───────────
{
  check(flat.includes('2.490,00 €'), 'the one-time net 2.490,00 € is shown', 'the one-time net is missing');
  check(/Einmalige Investition \(brutto\) 2\.963,10 €/.test(flat),
    'the one-time headline stays 2.963,10 € brutto',
    'the one-time headline is not 2.963,10 € — a recurring amount may have been folded in');
  check(/390,00 € \/ Monat/.test(flat), 'the recurring net is shown as 390,00 € / Monat',
    'the recurring amount lost its interval');
  check(/Laufende Betreuung \(brutto\) 464,10 € \/ Monat/.test(flat),
    'the recurring commitment is a visually distinct per-month block',
    'the recurring gross block is missing or not per-month');
  check(/Mindestlaufzeit: 12 Monate/.test(flat), 'the minimum term is stated', 'the minimum term is missing');

  // The 12-month value may appear ONLY as the clearly-secondary transparency figure.
  const termTotal = '7.170,00 €';
  check(flat.includes(termTotal), 'the minimum-term total is disclosed as a secondary figure',
    'the minimum-term total is not disclosed');
  check(/Nicht sofort fällig/.test(flat),
    'the minimum-term total is explicitly marked as not immediately due',
    'the minimum-term total is not marked as deferred — it could read as the headline price');
  const headline = pages.flatMap((p) => p.lines).find((l) => /Einmalige Investition \(brutto\)/.test(l.text));
  check(
    Boolean(headline) && !headline.text.includes(termTotal) && !headline.text.includes('4.680,00'),
    'no 12-month multiplication leaked into the immediate headline total',
    `the headline row carries a multiplied figure: ${headline?.text}`
  );
}

// ── 9. Rasterise every page for visual inspection ────────────────────────────
if (hasPoppler('pdftoppm')) {
  const pngs = renderPagesToPng(pdfPath, join(OUT, 'png'));
  check(pngs.length === pages.length,
    `every page rendered to PNG for inspection (${pngs.length} images)`,
    `PNG count ${pngs.length} does not match page count ${pages.length}`);
  if (VERBOSE) for (const p of pngs) console.log(`   ${p}`);
} else {
  console.log('SKIP: pdftoppm unavailable — page images not rendered.');
}

if (keepAt > -1) console.log(`\nArtifacts kept in ${OUT}`);
else rmSync(OUT, { recursive: true, force: true });

console.log(failures.length === 0
  ? `\nPublic offer PDF: all checks passed (${pages.length} pages).`
  : `\nPublic offer PDF: ${failures.length} failure(s).`);
process.exit(failures.length === 0 ? 0 : 1);
