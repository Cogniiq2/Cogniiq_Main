// Browser entry for the premium transactional document engine. Wires the deterministic
// source model + the @react-pdf renderer together with the bundled DejaVu fonts. React
// components import from HERE (never the node test harness, which registers fonts from disk).
//
// Imports ONLY the browser-safe renderer (pdf().toBlob()). Never import
// renderPremiumOfferPdfNode (renderToBuffer) here — that's the Node-only entry point used by the
// local fixture renderer and PDF test scripts.

import type { TransactionalDocument } from '../documentModel';
import { renderPremiumOfferPdfBrowser } from './premiumOfferPdf';
import { PREMIUM_FONTS } from './premiumFonts.browser';

export { buildPremiumSource } from './premiumSource';
export type { PremiumSource, PremiumModule, PremiumPaymentRow } from './premiumSource';
export { PREMIUM_OFFER_TEMPLATE_KEY } from './premiumOfferPdf';

/** Render the premium PDF (offers + invoices) with the embedded Cogniiq fonts. Browser only. */
export async function renderPremiumPdf(doc: TransactionalDocument): Promise<Uint8Array> {
  return renderPremiumOfferPdfBrowser(doc, { fonts: PREMIUM_FONTS });
}
