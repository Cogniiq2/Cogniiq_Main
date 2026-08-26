#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Long project modules must paginate.
//
//   node .github/scripts/test-long-module-pagination.mjs [--verbose] [--keep <dir>]
//
// The premium engine used to render each ModuleCard inside a wrap={false} View, and to
// wrap the "Projektmodule" heading together with the first card. A module carrying enough
// deliverables and prose to exceed one A4 page therefore could not be broken at all:
// react-pdf reported
//
//     Node of type VIEW can't wrap between pages and it's bigger than available page height
//
// and painted the whole module at a single origin. Measured on the Complete-sized fixture
// that produced 2,656 overlapping line pairs and made all 60 deliverables unextractable —
// an unreadable block of overprinted text where the customer's scope of work should be.
//
// The card now wraps. What is still held together is deliberate and asserted here: the
// module header (MODUL n + title + price), each individual bullet row, and a heading that
// is never left alone at the foot of a page.
//
// Fixtures are synthetic. The real Admin / Admin Pro / Complete offers are finalized
// customer documents and are never used or altered to build a test case.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

import { renderPremiumDocument } from './lib/public-offer-pdf-render.mjs';
import {
  hasPoppler, readLayout, findOverlaps, findOutOfBounds, findFooterCollisions,
  renderPagesToPng, writePdf,
} from './lib/pdf-layout.mjs';
import {
  buildAdminProSizedDoc, buildCompleteSizedDoc,
  ADMIN_PRO_DELIVERABLES, COMPLETE_DELIVERABLES,
} from './fixtures/long-module-fixture.mjs';

const VERBOSE = process.argv.includes('--verbose');
const keepAt = process.argv.indexOf('--keep');
const OUT = keepAt > -1 ? resolve(process.argv[keepAt + 1]) : mkdtempSync(join(tmpdir(), 'long-module-'));

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);
const check = (c, pass, bad) => (c ? ok(pass) : fail(bad));

const norm = (t) => t.replace(/\s+/g, ' ');

/** Render, capturing react-pdf's own layout warnings. */
async function render(doc) {
  const warnings = [];
  const realWarn = console.warn;
  console.warn = (...args) => { warnings.push(args.join(' ')); };
  try {
    return { bytes: await renderPremiumDocument(doc), warnings };
  } finally {
    console.warn = realWarn;
  }
}

const CASES = [
  {
    name: 'Admin-Pro-sized module (approaches one page)',
    file: 'admin-pro',
    doc: buildAdminProSizedDoc(),
    deliverables: ADMIN_PRO_DELIVERABLES,
    title: 'Erweiterter Verwaltungsbereich mit Rollen, Freigaben und Auswertungen',
    price: '6.900,00 €',
    minPages: 2,
    moduleMustSpanPages: false,
  },
  {
    name: 'Complete-sized SINGLE module (must span several pages)',
    file: 'complete',
    doc: buildCompleteSizedDoc(),
    deliverables: COMPLETE_DELIVERABLES,
    title: 'Gesamtplattform mit vollständiger Verwaltungs-, Auswertungs- und Betriebsfunktionalität',
    price: '24.000,00 €',
    minPages: 3,
    moduleMustSpanPages: true,
  },
];

if (!hasPoppler()) {
  console.log('SKIP: poppler (pdftotext) not installed — rendering only.');
  for (const c of CASES) {
    const { bytes } = await render(c.doc);
    check(Buffer.from(bytes.slice(0, 5)).toString('latin1') === '%PDF-', `${c.name}: renders a PDF`, `${c.name}: not a PDF`);
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

for (const c of CASES) {
  console.log(`\n--- ${c.name}`);
  const { bytes, warnings } = await render(c.doc);
  const pdfPath = writePdf(bytes, join(OUT, `${c.file}.pdf`));
  const raw = execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const flat = norm(raw);
  const pages = readLayout(pdfPath);

  // react-pdf itself tells us when a node cannot be broken and overflows the page.
  const unwrappable = warnings.filter((w) => /can't wrap between pages/i.test(w));
  check(
    unwrappable.length === 0,
    'react-pdf reports no unwrappable oversized node',
    `react-pdf: ${unwrappable[0]}`
  );

  check(pages.length >= c.minPages, `paginates into ${pages.length} pages`, `only ${pages.length} page(s)`);

  // ── geometry ───────────────────────────────────────────────────────────────
  const overlaps = pages.flatMap((p) => findOverlaps(p));
  const oob = pages.flatMap((p) => findOutOfBounds(p));
  const footer = pages.flatMap((p) => findFooterCollisions(p));
  const orphanBullets = pages.flatMap((p) => p.lines.filter((l) => l.text.trim() === '•').map(() => p.number));
  check(overlaps.length === 0, 'zero overlapping text',
    `${overlaps.length} overlapping line pairs, e.g. p${overlaps[0]?.page} "${overlaps[0]?.a}" over "${overlaps[0]?.b}"`);
  check(oob.length === 0, 'zero out-of-bounds text',
    `${oob.length} words outside the page, e.g. "${oob[0]?.text}" @${oob[0]?.box}`);
  check(footer.length === 0, 'zero footer collisions', `${footer.length} footer collisions`);
  check(orphanBullets.length === 0, 'no bullet marker parted from its text',
    `orphaned bullet markers on page(s) ${[...new Set(orphanBullets)].join(', ')}`);

  // ── content completeness: every deliverable EXACTLY once ───────────────────
  const counts = c.deliverables.map((d) => ({ d, n: flat.split(norm(d)).length - 1 }));
  const missing = counts.filter((x) => x.n === 0);
  const duplicated = counts.filter((x) => x.n > 1);
  check(missing.length === 0, `all ${c.deliverables.length} deliverables are present`,
    `${missing.length} deliverable(s) MISSING, e.g. "${missing[0]?.d.slice(0, 60)}"`);
  check(duplicated.length === 0, 'no deliverable is rendered more than once',
    `${duplicated.length} deliverable(s) rendered more than once, e.g. "${duplicated[0]?.d.slice(0, 50)}" x${duplicated[0]?.n}`);
  check(!/…/.test(raw), 'no ellipsis / truncation marker', 'the document contains a truncation ellipsis');
  check(!raw.includes('?'), 'no "?" replacing an intended glyph', 'a "?" glyph is present');
  check(/€/.test(raw), 'the euro glyph renders', 'no euro glyph');

  // ── module identity stays visible and intact ───────────────────────────────
  check(flat.includes(norm(c.title)), 'the module title renders in full', 'the module title is missing or truncated');
  check(flat.includes(c.price), `the module price ${c.price} is visible`, `the module price ${c.price} is missing`);

  // The header block must not split: MODUL n, its title and its price share a page.
  const pageOf = (needle) => pages.find((p) => norm(p.lines.map((l) => l.text).join(' ')).includes(norm(needle)))?.number ?? -1;
  const headPage = pageOf('MODUL 1');
  check(
    headPage > 0 && pageOf(c.title.split(' ').slice(0, 4).join(' ')) === headPage && pageOf(c.price) === headPage,
    `the module header (MODUL 1 + title + price) stays together on page ${headPage}`,
    'the module header split across pages'
  );

  // ── the module body flows forwards across pages, in order ──────────────────
  const deliverablePages = c.deliverables.map((d) => pageOf(d));
  check(deliverablePages.every((p) => p > 0), 'every deliverable is locatable on a page', 'a deliverable has no page');
  check(
    deliverablePages.every((p, i) => i === 0 || p >= deliverablePages[i - 1]),
    'deliverables appear in their original order, never reordered',
    'deliverables were reordered across pages'
  );
  if (c.moduleMustSpanPages) {
    const span = deliverablePages[deliverablePages.length - 1] - deliverablePages[0];
    check(span >= 1, `the single long module continues across ${span + 1} pages`,
      'the long module did not span multiple pages — it may have been forced onto one');
  }

  // ── metadata stays with its own module; later sections stay after ──────────
  check(/Phase: Umsetzung|Phase: Einrichtung/.test(flat), 'module phase metadata renders', 'phase metadata missing');
  check(/Dauer:/.test(flat), 'module duration metadata renders', 'duration metadata missing');
  check(/Mindestlaufzeit: 12 Monate/.test(flat), 'recurring metadata renders on the recurring module', 'recurring metadata missing');
  const lastDeliverablePage = Math.max(...deliverablePages);
  for (const section of ['Investitionsübersicht', 'Zahlungsplan', 'Nächste Schritte']) {
    const sp = pageOf(section);
    check(sp >= lastDeliverablePage, `"${section}" stays after the modules (page ${sp})`,
      `"${section}" appeared on page ${sp}, before the modules ended on ${lastDeliverablePage}`);
  }

  // ── footer + page numbering on every page ─────────────────────────────────
  let numberingOk = true;
  for (const p of pages) {
    const text = norm(p.lines.map((l) => l.text).join(' '));
    if (!new RegExp(`Seite ${p.number} von ${pages.length}`).test(text)) numberingOk = false;
    if (!/Cogniiq/.test(text)) numberingOk = false;
  }
  check(numberingOk, `footer and "Seite n von ${pages.length}" correct on all ${pages.length} pages`,
    'footer or page numbering is wrong on at least one page');

  if (hasPoppler('pdftoppm')) {
    const pngs = renderPagesToPng(pdfPath, join(OUT, `${c.file}-png`), 'page');
    check(pngs.length === pages.length, `every page rasterised (${pngs.length} images)`,
      `rasterised ${pngs.length} of ${pages.length} pages`);
  }
  if (VERBOSE) console.log(`   ${pdfPath} — ${pages.length} pages, ${bytes.length} bytes`);
}

if (keepAt > -1) console.log(`\nArtifacts kept in ${OUT}`);
else rmSync(OUT, { recursive: true, force: true });

console.log(failures.length === 0
  ? '\nLong-module pagination: all checks passed.'
  : `\nLong-module pagination: ${failures.length} failure(s).`);
process.exit(failures.length === 0 ? 0 : 1);
