// Render the complex premium-offer fixture to a real PDF locally (node), using the same
// @react-pdf engine the browser uses. Fonts are registered from the on-disk DejaVu TTFs.
// Output: scratch/premium-offer.pdf (+ scratch/premium-offer-draft.pdf). Rasterize with
// pdftoppm to inspect. NEVER touches Supabase.
//
//   node .github/scripts/render-premium-offer-fixture.mjs [outDir]

import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { buildFixtureDoc } from './fixtures/premium-offer-fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const src = resolve(root, 'src');
const outDir = resolve(process.argv[2] ?? resolve(root, 'scratch'));
mkdirSync(outDir, { recursive: true });

// Bundle the TSX renderer for node, leaving react + @react-pdf external (resolved from node_modules).
// Write the bundle to a real file inside the repo so Node resolves react/@react-pdf from
// the project's node_modules (a data: URL has no package-resolution context).
const bundlePath = resolve(root, 'node_modules/.cache/premium-renderer.mjs');
mkdirSync(dirname(bundlePath), { recursive: true });
await build({
  entryPoints: [resolve(src, 'lib/ownerFinance/documents/premium/premiumOfferPdf.tsx')],
  bundle: true, format: 'esm', outfile: bundlePath, platform: 'node', jsx: 'automatic',
  external: ['@react-pdf/renderer', 'react', 'react/jsx-runtime'], alias: { '@': src }, logLevel: 'silent',
});
const mod = await import(pathToFileURL(bundlePath).href);
rmSync(bundlePath, { force: true });

const fonts = {
  regular: resolve(src, 'assets/fonts/DejaVuSans.ttf'),
  bold: resolve(src, 'assets/fonts/DejaVuSans-Bold.ttf'),
};

for (const [name, isDraft] of [['premium-offer', false], ['premium-offer-draft', true]]) {
  const doc = buildFixtureDoc({ isDraft });
  const bytes = await mod.renderPremiumOfferPdfNode(doc, { fonts });
  const path = resolve(outDir, `${name}.pdf`);
  writeFileSync(path, Buffer.from(bytes));
  console.log(`wrote ${path} (${bytes.length} bytes)`);
}
