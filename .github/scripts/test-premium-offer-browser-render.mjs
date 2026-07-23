// Browser-render regression test for the deployed "renderToBuffer is a Node specific API" bug.
//
// Root cause of the original bug: the browser build of @react-pdf/renderer exposes
// `renderToBuffer` as a function-shaped Node-only stub, so `typeof renderToBuffer === 'function'`
// is true even in the browser bundle. The old renderer used exactly that check to decide which
// rendering API to call, so it always picked the Node path in production and crashed the moment
// a user opened the PDF preview.
//
// This test proves the fix structurally rather than by re-reading the source: it bundles the
// REAL renderer module (premiumOfferPdf.tsx) for the browser with esbuild, but swaps in a mock
// @react-pdf/renderer (fixtures/mock-react-pdf-browser.mjs) whose `renderToBuffer` throws and
// whose `pdf().toBlob()` succeeds — exactly the runtime shape of the real browser build. If
// renderPremiumOfferPdfBrowser ever calls renderToBuffer again (feature-detection regression,
// copy-paste mistake, etc.), this test fails immediately with the mock's own error, not a typo
// left in a comment.
//
//   node .github/scripts/test-premium-offer-browser-render.mjs

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { buildFixtureDoc } from './fixtures/premium-offer-fixture.mjs';

const here = dirname(new URL(import.meta.url).pathname);
const root = resolve(here, '../..');
const src = resolve(root, 'src');

let failures = 0;
const ok = (c, m) => { if (!c) { console.error(`FAIL: ${m}`); failures++; } else { console.log(`ok: ${m}`); } };

const mockPath = resolve(here, 'fixtures/mock-react-pdf-browser.mjs');

// Bundle the TSX renderer as the browser build would see it: platform 'browser', and
// @react-pdf/renderer aliased to the mock instead of the real (node-resolved) package.
const bp = resolve(root, 'node_modules/.cache/premium-browser-test.mjs');
mkdirSync(dirname(bp), { recursive: true });
await build({
  entryPoints: [resolve(src, 'lib/ownerFinance/documents/premium/premiumOfferPdf.tsx')],
  bundle: true, format: 'esm', outfile: bp, platform: 'browser', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  alias: { '@react-pdf/renderer': mockPath, '@': src },
  logLevel: 'silent',
});

const bundledSource = readFileSync(bp, 'utf8');
const mod = await import(pathToFileURL(bp).href);
const mockMod = await import(pathToFileURL(mockPath).href);

ok(typeof mod.renderPremiumOfferPdfBrowser === 'function', 'browser entry point (renderPremiumOfferPdfBrowser) is exported');
ok(typeof mod.renderPremiumOfferPdfNode === 'function', 'node entry point (renderPremiumOfferPdfNode) is exported');
ok(mod.renderPremiumOfferPdf === undefined, 'the old ambiguous renderPremiumOfferPdf export (feature-detection) no longer exists');

const doc = buildFixtureDoc({ isDraft: false });
const fonts = { regular: 'https://cdn.example/DejaVuSans.ttf', bold: 'https://cdn.example/DejaVuSans-Bold.ttf' };

// --- Exercise the BROWSER renderer -----------------------------------------------------------
const bytes = await mod.renderPremiumOfferPdfBrowser(doc, { fonts });

const counts = mockMod.__getCallCounts();
ok(counts.pdf === 1, 'browser renderer calls pdf() exactly once');
ok(counts.toBlob === 1, 'browser renderer calls toBlob() exactly once');
ok(counts.renderToBuffer === 0, 'browser renderer NEVER calls renderToBuffer() — the regression this test guards against');
ok(bytes instanceof Uint8Array, 'browser renderer returns a Uint8Array');
ok(bytes.length === 4 && bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70, 'returned bytes are the mocked %PDF payload');

// PremiumPdfPreviewDialog does exactly this with the render() result — prove it's usable.
const blob = new Blob([bytes.slice()], { type: 'application/pdf' });
ok(blob.size === 4 && blob.type === 'application/pdf', 'rendered bytes build a usable Blob (what the preview dialog turns into a Blob URL)');

// --- Sanity: the NODE renderer is genuinely a different code path, not the same function ------
// re-exported under two names. Against the SAME mock, it must exercise renderToBuffer and throw
// the mock's Node-API error, proving the two entry points are structurally distinct.
let nodeThrew = false;
try {
  await mod.renderPremiumOfferPdfNode(doc, { fonts });
} catch (e) {
  nodeThrew = /Node API must not be called/.test(String(e && e.message));
}
ok(nodeThrew, 'node entry point calls renderToBuffer (proves browser/node entry points are structurally separate, not a runtime feature-detection branch)');
ok(mockMod.__getCallCounts().renderToBuffer === 1, 'renderToBuffer was reached exactly once, and only via the Node entry point');

// --- Bundle inspection: renderToBuffer must not be reachable from the browser call path --------
// The string may still appear in this chunk (renderPremiumOfferPdfNode lives in the same source
// file), but the call above already proved the browser function's execution path never reaches
// it. As an extra static check, confirm the browser function body itself doesn't reference it.
const browserFnSource = mod.renderPremiumOfferPdfBrowser.toString();
ok(!/renderToBuffer/.test(browserFnSource), 'renderPremiumOfferPdfBrowser function body contains no reference to renderToBuffer');
ok(/renderToBuffer/.test(bundledSource), 'sanity: renderToBuffer is only present via the separate, unrelated Node export in this shared chunk');

if (failures > 0) { console.error(`\npremium offer browser-render tests: ${failures} FAILED`); process.exit(1); }

rmSync(bp, { force: true });
console.log('premium offer browser-render tests: ALL PASSED');
