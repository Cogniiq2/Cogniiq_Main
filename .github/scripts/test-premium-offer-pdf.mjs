// Premium offer PDF test. Renders the complex 8-module fixture through the real @react-pdf
// engine (node), then asserts on the extracted text + structure: paragraph/bullet
// preservation, all eight modules, long descriptions, no broken "?" glyph, correct VAT +
// totals, optional module separated, payment plan, assumptions/exclusions, footer, page
// numbers, no large generic legal disclaimer, and the draft watermark only in draft.
//
// Text is extracted with `pdftotext` (poppler). If pdftotext is unavailable the text
// assertions are skipped with a warning, but the render itself is still validated.

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildFixtureDoc } from './fixtures/premium-offer-fixture.mjs';

const here = dirname(new URL(import.meta.url).pathname);
const root = resolve(here, '../..');
const src = resolve(root, 'src');

let failures = 0;
const ok = (c, m) => { if (!c) { console.error(`FAIL: ${m}`); failures++; } };

// Bundle the TSX renderer for node (react + @react-pdf external).
const bp = resolve(root, 'node_modules/.cache/premium-test.mjs');
mkdirSync(dirname(bp), { recursive: true });
await build({
  entryPoints: [resolve(src, 'lib/ownerFinance/documents/premium/premiumOfferPdf.tsx')],
  bundle: true, format: 'esm', outfile: bp, platform: 'node', jsx: 'automatic',
  external: ['@react-pdf/renderer', 'react', 'react/jsx-runtime'], alias: { '@': src }, logLevel: 'silent',
});
const mod = await import(pathToFileURL(bp).href);
rmSync(bp, { force: true });

const fonts = { regular: resolve(src, 'assets/fonts/DejaVuSans.ttf'), bold: resolve(src, 'assets/fonts/DejaVuSans-Bold.ttf') };

function hasPdftotext() {
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; }
}
function extract(bytes, extraArgs = []) {
  const tmp = resolve(root, 'node_modules/.cache/_p.pdf');
  writeFileSync(tmp, Buffer.from(bytes));
  const out = execFileSync('pdftotext', [...extraArgs, tmp, '-'], { encoding: 'utf8' });
  rmSync(tmp, { force: true });
  return out;
}

const finalDoc = buildFixtureDoc({ isDraft: false });
const draftDoc = buildFixtureDoc({ isDraft: true });

const finalBytes = await mod.renderPremiumOfferPdf(finalDoc, { fonts });
const draftBytes = await mod.renderPremiumOfferPdf(draftDoc, { fonts });

ok(finalBytes.length > 4000, 'final PDF has content');
const head = Buffer.from(finalBytes.slice(0, 8)).toString('latin1');
ok(head.startsWith('%PDF-'), 'renders a real PDF');

if (!hasPdftotext()) {
  console.warn('WARN: pdftotext not found — skipping text assertions (render still validated).');
} else {
  const text = extract(finalBytes);
  const layout = extract(finalBytes, ['-layout']);

  // No broken glyph.
  ok(!text.includes('?'), 'no broken "?" glyph in premium PDF');
  // German + euro glyphs present.
  ok(/€/.test(text), 'euro glyph renders');
  ok(/beträgt|Gültig|Ausschlüsse|Zusammenarbeit/.test(text), 'German umlaut words render');

  // All eight modules with full (untruncated) titles.
  for (const t of ['Digitale Montageplanung und Monteur-Kommunikation', 'Zentrale Auftrags- und Projektdatenbank',
    'Angebots- und Kalkulationsmodul', 'Materialwirtschaft und Bestellwesen', 'Zeiterfassung und Lohnvorbereitung',
    'Kunden- und Serviceportal', 'Auswertungen und Management-Dashboard', 'Schulung, Einführung und Hypercare']) {
    ok(text.replace(/\s+/g, ' ').includes(t), `module title present & untruncated: "${t.slice(0, 32)}…"`);
  }
  ok((text.match(/MODUL \d/gi) || []).length >= 8, 'eight numbered modules rendered');

  // Paragraph + bullet preservation.
  ok(/Sehr geehrter Herr Pankofer/.test(text), 'introduction paragraph preserved');
  ok(/Wochenplan je Monteur/.test(text) && /Mobile Nutzung auf Tablets/.test(text), 'deliverable bullets preserved');
  ok(/Weniger manueller Verwaltungsaufwand/.test(text), 'desired-outcome bullet preserved');

  // Totals + VAT breakdown.
  ok(/80\.000,00\s*€/.test(text), 'net total 80.000,00 € present');
  ok(/15\.200,00\s*€/.test(text), 'VAT total 15.200,00 € present');
  ok(/95\.200,00\s*€/.test(text), 'gross total 95.200,00 € present');
  ok(/Umsatzsteuer/.test(text) && /19\s*%/.test(text), 'VAT breakdown labelled in German (19 %)');
  ok(!/vat_treatment|standard\b/.test(text), 'no technical VAT labels leaked');

  // Optional module separated + excluded.
  ok(/Optionale Zusatzmodule/.test(text), 'optional modules in a separate section');
  ok(/OPTION 1/i.test(text), 'optional module labelled as option');

  // Payment plan rendered (30/40/30).
  ok(/Bei Auftragserteilung/.test(text) && /Nach Abnahme/.test(text), 'payment milestones rendered');
  ok(/30\s*%/.test(text) && /40\s*%/.test(text), 'payment percentages rendered');
  ok(/24\.000,00\s*€/.test(text) && /32\.000,00\s*€/.test(text), 'payment amounts computed against base net');

  // Assumptions + exclusions as distinct sections.
  ok(/Annahmen/.test(text), 'assumptions rendered');
  ok(/Nicht enthalten|Ausschlüsse/.test(text), 'exclusions rendered');

  // Timeline.
  ok(/Analyse & zentrale Datenbasis/.test(text) && /Einführung & Hypercare/.test(text), 'timeline phases rendered');

  // Footer + page numbers.
  ok(/Seite 1 von \d+/.test(layout), 'page numbers rendered');
  ok(/info@cogniiq\.de/.test(text), 'configured footer rendered');

  // NO large generic legal disclaimer in the final customer PDF.
  ok(!/Keine Zusicherung rechtlicher/.test(text), 'no large generic legal disclaimer in final PDF');

  // Draft watermark only in draft.
  ok(/ENTWURF/.test(extract(draftBytes)), 'draft watermark present in draft');
  ok(!/ENTWURF/.test(text), 'no draft watermark in finalized PDF');

  // Long-document pagination is balanced (fixture spans multiple pages, no empty trailer).
  const finalLayout = extract(finalBytes, ['-layout']);
  const pageCount = (finalLayout.match(/\f/g) || []).length + 1;
  ok(pageCount >= 5 && pageCount <= 9, `balanced pagination (pages=${pageCount})`);
  console.log(`premium PDF fixture: ${pageCount} pages`);
}

if (failures > 0) { console.error(`\npremium offer PDF tests: ${failures} FAILED`); process.exit(1); }
console.log('premium offer PDF tests: ALL PASSED');
