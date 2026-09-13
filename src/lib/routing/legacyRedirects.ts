// ─────────────────────────────────────────────────────────────────────────────
// PERMANENT REDIRECTS FOR RETIRED PUBLIC ROUTES.
//
// One table, consumed by four places that would otherwise each hold their own
// opinion about a retired URL:
//
//   1. public/_redirects              — the rule a host actually serves (301).
//   2. test-seo-consistency.mjs       — asserts the rule exists, points at an
//                                       indexable manifest route, and does not
//                                       chain into another retired URL.
//   3. src/entry-server.test.tsx      — a link to a retired URL is not a dead
//   4. src/prerender.hydration.test.tsx  link, but it IS one the build has to
//                                       account for page by page.
//
// WHY A REDIRECT AND NOT A CANONICAL. A canonical is a hint; two indexable
// documents on the same head intent stay two documents that a crawler may pick
// between. A retired route is not a variant of the surviving one — it is gone,
// and 301 is the only statement that says so, transfers the signal and cannot
// be overruled.
//
// RULES THIS TABLE MUST SATISFY (all asserted, none assumed):
//   • A source is NOT in PUBLIC_ROUTES — a route cannot be both served and
//     redirected, and leaving it in the manifest would keep prerendering a
//     200 document that competes with its own replacement.
//   • A target IS in PUBLIC_ROUTES and indexable.
//   • A target is never itself a source. No chains: one hop, always.
//   • A source never appears in public/sitemap.xml.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retired route → its surviving owner. Insertion order is the order written to
 * `public/_redirects`, so the table stays readable next to the served rules.
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  /*
    2026-09-14 — /referenzen and /bewertungen retired, owner decision.

    Both pages existed to hold proof (case studies, testimonials) the site does
    not have yet; each said so explicitly rather than fabricating either.
    HONESTY-AUDIT.md and COPY-CLAIMS-TO-VERIFY.md (F3) already tracked why: the
    one real testimonial in the codebase named a real association without
    documented consent and was pulled from rendering — both pages then reached
    the same conclusion the owner has now made final by removing them: no page
    for proof that does not exist yet.

    /ueber-uns survives as the target for both. It is the page a visitor
    looking for "how this company works" or "who is behind it" lands on next,
    and it is exactly what /referenzen ("Arbeitsweise & Projektverständnis")
    and /bewertungen ("woran Sie unsere Arbeit stattdessen prüfen können")
    pointed toward without a page of their own.
  */
  '/referenzen': '/ueber-uns',
  '/bewertungen': '/ueber-uns',
  /*
    2026-09-12 — the automation cluster's owner question, decided.

    `/automatisierung-unternehmen` and `/prozessautomatisierung` were two
    national pages on one head intent: both titled for "Automatisierung für
    Unternehmen", both carrying "KI-Workflows" in the description
    (docs/seo/ARCHITEKTUR.md §4.1, conflict K1). The declared owner was the
    thinner of the two and the linked owner was the other one — so the domain
    entered every generic automation query with two documents and gave each
    half its own authority.

    `/prozessautomatisierung` survives: the exact head term is in the URL and in
    the title, its sitemap priority was already the higher one (0.92 vs 0.90),
    and the query family this cluster is measured on is "Prozessautomatisierung".
    The retiring page's unique material was audited claim by claim and the part
    that survived the audit was rebuilt into the pillar, not copied into it.
  */
  '/automatisierung-unternehmen': '/prozessautomatisierung',
};

const SOURCES: ReadonlySet<string> = new Set(Object.keys(LEGACY_REDIRECTS));

/** True for a URL this site answers with a permanent redirect rather than a page. */
export function isLegacyRedirectSource(pathname: string): boolean {
  return SOURCES.has(pathname);
}

/** The surviving URL for a retired one, or null if the path is not retired. */
export function legacyRedirectTarget(pathname: string): string | null {
  return LEGACY_REDIRECTS[pathname] ?? null;
}
