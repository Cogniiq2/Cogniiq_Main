// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE public URL set.
//
// The full manifest in ./publicRoutes.ts carries a title, description and
// keyword string for all 88 routes — roughly 39 KiB of the entry chunk. None of
// that text is used in the browser: the prerendered <head> already carries the
// real metadata, and the only thing the hydrated app asks is the yes/no
// question "does this site publish this URL?" (RouteIndexabilityManager in
// src/App.tsx and CanonicalManager). Shipping the prose to answer a set-membership
// question is initial JavaScript nobody executes, so the paths live here on their
// own and publicRoutes.ts re-exports these helpers for its build-time consumers.
//
// This list and PUBLIC_ROUTES are held in exact agreement — same paths, same
// order — by publicRoutes.test.ts. Adding a route to one and not the other
// fails that test, so there is no second source of truth to drift.
// ─────────────────────────────────────────────────────────────────────────────

export const PUBLIC_ROUTE_PATHS: readonly string[] = [
  "/",
  "/leistungen",
  "/kontakt",
  "/ueber-uns",
  "/faq",
  "/referenzen",
  "/bewertungen",
  "/praxen",
  "/integrationen",
  "/datenschutz-sicherheit",
  "/ki-telefonassistent",
  "/webdesign",
  "/prozessautomatisierung",
  "/webdesign-agentur-deutschland",
  "/ki-agentur-deutschland",
  "/automatisierung-unternehmen",
  "/ki-telefonassistent/demo",
  "/ki-telefonassistent-einfuehren",
  "/ki-telefonassistent-zahnarztpraxis",
  "/deutschland",
  "/bayern",
  "/bayern/ki-telefonassistent",
  "/bayreuth",
  "/muenchen",
  "/regensburg",
  "/bayreuth/webdesign",
  "/bayreuth/ki-telefonassistent",
  "/bayreuth/automatisierung",
  "/bayreuth/webdesign-kosten",
  "/bayreuth/website-erstellen",
  "/bayreuth/landingpage",
  "/bayreuth/website-relaunch",
  "/bayreuth/lokales-seo",
  "/muenchen/webdesign",
  "/muenchen/ki-telefonassistent",
  "/muenchen/automatisierung",
  "/muenchen/webdesign-kosten",
  "/muenchen/website-erstellen",
  "/muenchen/landingpage",
  "/muenchen/website-relaunch",
  "/muenchen/lokales-seo",
  "/regensburg/webdesign",
  "/regensburg/ki-telefonassistent",
  "/regensburg/automatisierung",
  "/regensburg/webdesign-kosten",
  "/regensburg/website-erstellen",
  "/regensburg/landingpage",
  "/regensburg/website-relaunch",
  "/regensburg/lokales-seo",
  "/webdesign-arzt-bayreuth",
  "/webdesign-gastronomie-bayreuth",
  "/webdesign-immobilien-bayreuth",
  "/webdesign-arzt-muenchen",
  "/webdesign-gastronomie-muenchen",
  "/webdesign-immobilien-muenchen",
  "/webdesign-arzt-regensburg",
  "/webdesign-gastronomie-regensburg",
  "/webdesign-immobilien-regensburg",
  "/webdesign-gastronomie",
  "/webdesign-arzt",
  "/webdesign-immobilien",
  "/webdesign-hotel",
  "/webdesign-sport",
  "/ki-telefonassistent-arzt",
  "/ki-telefonassistent-restaurant",
  "/ki-telefonassistent-hotel",
  "/ki-telefonassistent-praxis",
  "/automatisierung-restaurant",
  "/automatisierung-arzt",
  "/automatisierung-immobilien",
  "/automatisierung-sport",
  "/kosten-webdesign",
  "/kosten-ki-telefonassistent",
  "/kosten-automatisierung",
  "/verpasste-anrufe-verlust",
  "/keine-anfragen-website",
  "/keine-terminbuchung-online",
  "/zu-viel-manuelle-arbeit",
  "/digitale-automatisierung-unternehmen",
  "/blog",
  "/blog/ki-automatisierung-kleine-unternehmen",
  "/blog/ki-telefonassistent-arztpraxis",
  "/blog/webdesign-konversion-tipps",
  "/blog/lokales-seo-unternehmen",
  "/blog/prozessautomatisierung-roi",
  "/blog/verpasste-anrufe-kosten",
  "/blog/ki-telefonassistent-restaurant",
  "/blog/website-ohne-anfragen",
  "/blog/digitalisierung-mittelstand",
  "/blog/webdesign-agentur-auswahl",
  "/impressum",
  "/datenschutz",
  "/anfrage-erhalten",
];

const PUBLIC_PATHS: ReadonlySet<string> = new Set(PUBLIC_ROUTE_PATHS);

/** Trailing slashes are not part of a route's identity; only "/" keeps one. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/**
 * True only for a URL this site actually publishes.
 *
 * Netlify serves dist/404.html for everything else, and the SEO managers use
 * this to keep the client in agreement with that: an unknown URL must stay
 * noindex and must never claim a canonical, before OR after hydration. Search
 * engines execute JavaScript, so a server-only noindex is not enough.
 */
export function isKnownPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(normalizePath(pathname));
}
