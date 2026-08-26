// Node harness that renders the customer-facing offer PDF exactly as the browser does.
//
// The portal's download path is: PublicOfferProjection -> publicOfferToPremiumDocument ->
// renderPremiumPdf. This bundles the same two modules for Node (react + @react-pdf stay
// external) and calls the Node-only renderPremiumOfferPdfNode entry point, so the test
// exercises the real adapter and the real premium engine rather than a re-implementation.
//
// `renderLegacyTransactionalPdf` renders the SAME projection through the OLD generic
// finance-report renderer, so the regression test can state the before/after difference in
// measured terms instead of asserting it from memory.
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const SRC = resolve(ROOT, 'src');

const FONTS = {
  regular: resolve(SRC, 'assets/fonts/DejaVuSans.ttf'),
  bold: resolve(SRC, 'assets/fonts/DejaVuSans-Bold.ttf'),
};

async function bundle(entry, name) {
  const out = resolve(ROOT, `node_modules/.cache/${name}.mjs`);
  mkdirSync(dirname(out), { recursive: true });
  await build({
    entryPoints: [entry],
    bundle: true, format: 'esm', outfile: out, platform: 'node', jsx: 'automatic',
    external: ['@react-pdf/renderer', 'react', 'react/jsx-runtime'],
    alias: { '@': SRC }, logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(out).href);
  rmSync(out, { force: true });
  return mod;
}

/**
 * Render a public offer projection the way the customer portal does.
 * @returns {Promise<Uint8Array>}
 */
export async function renderPublicOfferPdf(projection) {
  const [renderer, adapter] = await Promise.all([
    bundle(resolve(SRC, 'lib/ownerFinance/documents/premium/premiumOfferPdf.tsx'), 'public-offer-premium'),
    bundle(resolve(SRC, 'lib/ownerFinance/documents/premium/publicOfferToPremium.ts'), 'public-offer-adapter'),
  ]);
  const doc = adapter.publicOfferToPremiumDocument(projection);
  return renderer.renderPremiumOfferPdfNode(doc, { fonts: FONTS });
}

/**
 * Render an already-built TransactionalDocument through the real premium engine.
 * Used by the long-module pagination regression, which needs to drive the renderer
 * directly rather than through the public-offer projection adapter.
 * @returns {Promise<Uint8Array>}
 */
export async function renderPremiumDocument(doc) {
  const renderer = await bundle(
    resolve(SRC, 'lib/ownerFinance/documents/premium/premiumOfferPdf.tsx'), 'premium-document'
  );
  return renderer.renderPremiumOfferPdfNode(doc, { fonts: FONTS });
}

/** The document the adapter produces, for field-level assertions. */
export async function buildPublicOfferDocument(projection) {
  const adapter = await bundle(
    resolve(SRC, 'lib/ownerFinance/documents/premium/publicOfferToPremium.ts'), 'public-offer-adapter-only'
  );
  return adapter.publicOfferToPremiumDocument(projection);
}

/** The OLD path: the same projection through the generic transactional renderer. */
export async function renderLegacyTransactionalPdf(projection) {
  const [adapter, legacy] = await Promise.all([
    bundle(resolve(SRC, 'lib/ownerFinance/documents/premium/publicOfferToPremium.ts'), 'legacy-adapter'),
    bundle(resolve(SRC, 'lib/ownerFinance/documents/transactionalPdf.ts'), 'legacy-transactional'),
  ]);
  return legacy.renderTransactionalPdf(adapter.publicOfferToPremiumDocument(projection));
}
