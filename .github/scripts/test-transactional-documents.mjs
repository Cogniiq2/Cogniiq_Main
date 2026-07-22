// Unit tests for the shared transactional document system (offers + invoices): the model + VAT
// breakdown, pre-generation validation, deterministic document hash, and PDF rendering via the
// existing renderReportPdf. Bundled with esbuild; no framework, no DB.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../src');
async function bundle(rel) {
  const result = await build({
    entryPoints: [resolve(src, rel)], bundle: true, format: 'esm', write: false,
    platform: 'neutral', logLevel: 'silent', alias: { '@': src },
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const [model, validation, hash, txpdf, pdf] = await Promise.all([
  bundle('lib/ownerFinance/documents/documentModel.ts'),
  bundle('lib/ownerFinance/documents/documentValidation.ts'),
  bundle('lib/ownerFinance/documents/documentHash.ts'),
  bundle('lib/ownerFinance/documents/transactionalPdf.ts'),
  bundle('lib/ownerFinance/exports/pdf.ts'),
]);
const fname = await bundle('lib/ownerFinance/documents/documentFilename.ts');
const structured = await bundle('lib/ownerFinance/documents/structuredInvoice.ts');
const sig = await bundle('lib/ownerFinance/documents/signatureProvider.ts');

let failures = 0;
const eq = (a, b, m) => { if (a !== b) { console.error(`FAIL: ${m} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); failures++; } };
const ok = (c, m) => { if (!c) { console.error(`FAIL: ${m}`); failures++; } };

function line(over) {
  const q = over.quantityMilli ?? 1000, up = over.unitPriceCents ?? 10000, rate = over.vatRateBp ?? 1900;
  const treat = over.vatTreatment ?? 'standard';
  const net = Math.round((q * up) / 1000);
  const vat = treat === 'standard' || treat === 'reduced' ? Math.round((net * rate) / 10000) : 0;
  return { description: over.description ?? 'Pos', quantityMilli: q, unit: over.unit ?? 'Stück', unitPriceCents: up, vatRateBp: rate, vatTreatment: treat, netCents: net, vatCents: vat, grossCents: net + vat, isOptional: over.isOptional ?? false };
}

const seller = { name: 'Cogniiq UG', addressLines: ['Beispielstr. 1', '10115 Berlin'], email: 'info@cogniiq.de', vatId: 'DE123456789' };
const recipient = { name: 'Kunde GmbH', addressLines: ['Kundenweg 2', '20095 Hamburg'], email: 'kunde@example.test' };

const lines = [line({ description: 'Konzept', quantityMilli: 2000, unitPriceCents: 100000 }), line({ description: 'Reduziert', vatRateBp: 700, vatTreatment: 'reduced', unitPriceCents: 50000 }), line({ description: 'Optionaler Support', isOptional: true, unitPriceCents: 30000 })];
const net = lines.filter((l) => !l.isOptional).reduce((s, l) => s + l.netCents, 0);
const vat = lines.filter((l) => !l.isOptional).reduce((s, l) => s + l.vatCents, 0);

const baseOffer = {
  kind: 'offer', language: 'de', documentNumber: 'AN-2026-0001', title: 'Website Relaunch',
  seller, recipient, issueDate: '2026-03-01', validUntil: '2026-03-31', serviceDate: '2026-03-15',
  currency: 'EUR', introduction: 'Vielen Dank für Ihre Anfrage — €uro & Umlaute: äöüß.', lines,
  netTotalCents: net, vatTotalCents: vat, grossTotalCents: net + vat, paymentTerms: '14 Tage netto',
  isDraft: false, templateVersion: 'transactional-v1',
};

/* ---- VAT breakdown ---- */
const bd = model.vatBreakdown(lines);
eq(bd.length, 2, 'vat breakdown groups by rate (optional excluded)');
eq(bd[0].rateBp, 1900, 'breakdown sorted desc by rate');
ok(bd.every((b) => !Number.isNaN(b.netCents)), 'breakdown net numeric');

/* ---- Validation ---- */
const okOffer = validation.validateTransactionalDocument(baseOffer);
ok(okOffer.canFinalize, 'complete offer can finalize');
const invIncomplete = { ...baseOffer, kind: 'invoice', dueDate: null, bank: null };
const vInv = validation.validateTransactionalDocument(invIncomplete);
ok(!vInv.canFinalize, 'invoice missing due date + payment info cannot finalize');
ok(vInv.missing.some((m) => /Fälligkeit/.test(m)), 'missing due date reported');
ok(vInv.missing.some((m) => /Zahlungsinformationen/.test(m)), 'missing payment info reported');
const invComplete = { ...baseOffer, kind: 'invoice', documentNumber: 'RE-2026-0001', dueDate: '2026-03-15', bank: { iban: 'DE89370400440532013000', holder: 'Cogniiq UG' } };
ok(validation.validateTransactionalDocument(invComplete).canFinalize, 'complete invoice can finalize');
const draftNoNumber = { ...baseOffer, documentNumber: null, isDraft: true };
ok(validation.validateTransactionalDocument(draftNoNumber).items.find((i) => i.key === 'number').ok, 'draft may lack a number');

/* ---- Document hash ---- */
const h1 = hash.documentHash(baseOffer);
const h2 = hash.documentHash({ ...baseOffer });
eq(h1, h2, 'document hash deterministic on same content');
ok(hash.documentHash({ ...baseOffer, title: 'Anders' }) !== h1, 'document hash changes with content');
ok(/^[0-9a-f]{64}$/.test(h1), 'document hash is sha256 hex');

/* ---- Filenames ---- */
eq(fname.documentFilename(baseOffer), 'Angebot-AN-2026-0001.pdf', 'offer filename');
eq(fname.documentFilename({ ...baseOffer, kind: 'invoice', documentNumber: null }), 'Rechnung-Entwurf.pdf', 'invoice draft filename');
ok(/^ent\//.test(fname.documentStoragePath('ent', 'offer', 1, 'abc123')), 'storage path entity-prefixed');

/* ---- Report model + PDF render ---- */
const rm = txpdf.buildTransactionalReportModel(baseOffer);
eq(rm.documentTitle, 'Angebot AN-2026-0001', 'report title');
ok(rm.sections.some((s) => s.kind === 'table'), 'has line-item table');
ok(rm.sections.some((s) => s.kind === 'keyvalue' && s.heading === 'Empfänger'), 'has recipient section');
ok(rm.sections.some((s) => s.kind === 'keyvalue' && s.heading === 'Summen'), 'has totals section');

const bytes = pdf.renderReportPdf(rm);
const str = Buffer.from(bytes).toString('latin1');
ok(str.startsWith('%PDF-1.4'), 'renders real PDF');
ok(str.includes('/BaseFont /Helvetica'), 'selectable text base font');
ok(str.includes('Seite 1 von '), 'page numbers');
ok(str.includes(' Tj'), 'text-show operators');

// Draft marker
const draftModel = txpdf.buildTransactionalReportModel({ ...baseOffer, isDraft: true, documentNumber: null });
ok(draftModel.sections.some((s) => s.kind === 'note' && /ENTWURF/.test(s.text)), 'draft renders ENTWURF marker');

// Long document paginates with repeated headers
const manyLines = [];
for (let i = 0; i < 60; i++) manyLines.push(line({ description: 'Leistung Position Nummer ' + i, unitPriceCents: 12345 }));
const bigNet = manyLines.reduce((s, l) => s + l.netCents, 0), bigVat = manyLines.reduce((s, l) => s + l.vatCents, 0);
const bigModel = txpdf.buildTransactionalReportModel({ ...baseOffer, kind: 'invoice', documentNumber: 'RE-2026-0002', dueDate: '2026-04-01', bank: { iban: 'DE89370400440532013000' }, lines: manyLines, netTotalCents: bigNet, vatTotalCents: bigVat, grossTotalCents: bigNet + bigVat });
const bigStr = Buffer.from(pdf.renderReportPdf(bigModel)).toString('latin1');
const pages = (bigStr.match(/\/Type \/Page[^s]/g) || []).length;
ok(pages >= 2, `long invoice paginates (pages=${pages})`);
ok(bigStr.includes('Seite 1 von ' + pages), 'page total matches');

/* ---- Structured e-invoice (experimental, never certified) ---- */
const invForStructured = { ...baseOffer, kind: 'invoice', documentNumber: 'RE-2026-9', dueDate: '2026-04-01', recipient };
const sv = structured.validateStructuredSource(invForStructured);
ok(typeof sv.ok === 'boolean', 'structured source validation returns ok flag');
ok(sv.notes.some((n) => /KEINE EN-16931/.test(n)), 'structured validation disclaims EN 16931 conformance');
// disabled by default -> throws (no silent fake XRechnung)
let threw = false;
try { structured.buildStructuredIntermediate(invForStructured, 'xrechnung'); } catch { threw = true; }
ok(threw, 'structured generation blocked when flag disabled (no fake XRechnung)');
const inter = structured.buildStructuredIntermediate(invForStructured, 'xrechnung', { xrechnung: 'experimental', zugferd: 'disabled' });
eq(inter.status, 'not_certified', 'structured intermediate is never certified');
ok(/experimentell/.test(inter.disclaimer), 'structured intermediate carries experimental disclaimer');

/* ---- Signature levels ---- */
const cfg = sig.DEFAULT_SIGNATURE_CONFIG;
eq(cfg.maxLevel, 'simple_electronic_signature', 'native config caps at simple e-signature');
ok(sig.levelSupported(cfg, 'electronic_acceptance'), 'native supports online acceptance');
ok(sig.levelSupported(cfg, 'simple_electronic_signature'), 'native supports simple e-signature');
ok(!sig.levelSupported(cfg, 'advanced_provider_signature'), 'native does NOT claim advanced signature');
ok(!sig.levelSupported(cfg, 'qualified_provider_signature'), 'native does NOT claim qualified signature');
ok(!sig.levelSupported({ mode: 'disabled', maxLevel: 'qualified_provider_signature' }, 'electronic_acceptance'), 'disabled mode supports nothing');
eq(sig.EXTERNAL_PROVIDER_NOT_CONFIGURED, 'Externer Signaturdienst nicht konfiguriert', 'unconfigured provider message');

if (failures > 0) { console.error(`\ntransactional document tests: ${failures} FAILED`); process.exit(1); }
console.log('transactional document tests: ALL PASSED');
