---
paths:
  - "src/lib/routing/**"
  - "src/pages/**"
  - "src/components/PageSEO.tsx"
  - "src/components/Footer.tsx"
  - "src/components/Navigation.tsx"
  - "src/lib/blog-data.ts"
  - "src/lib/telefonassistent-copy.ts"
  - "scripts/prerender.mjs"
  - "scripts/generate-sitemap.mjs"
  - "public/sitemap.xml"
  - "docs/seo/**"
---

# SEO work on the public site

Durable rules for any change that affects what a crawler sees. The copy briefs
(`.claude/COPY-BRIEF*.md`) govern wording; this file governs SEO decisions.

## Before changing a public page

1. Read `docs/seo/organic-growth-scoreboard.md` (query-cluster owners, live
   measurements) and `docs/seo/post-experiment-opportunities.md` (deferred ideas)
   before proposing anything. Most obvious ideas were already assessed.
2. `PROTECTED_EXPERIMENT_PATHS` in `src/lib/routing/protectedExperiments.ts` is
   the authoritative list of frozen routes. Never change their head, body,
   JSON-LD, outgoing links, or the number of places in the source tree that
   mention their path, comments and docs under scan roots included. Never run
   `npm run seo:baseline` to make a change pass. A conflicting idea is recorded
   as `DEFERRED — EXPERIMENT` in the post-experiment doc.
3. One route manifest: `src/lib/routing/publicRoutes.ts` (title, description,
   indexability, sitemap) mirrored path-for-path in `publicRoutePaths.ts` and
   registered in `src/App.tsx`. Blog posts additionally carry the same title in
   `src/lib/blog-data.ts`. Regenerate `public/sitemap.xml` with `npm run sitemap`;
   never hand-edit it, never invent `lastmod`.
4. Product facts come only from `FAKTEN`, `GRENZEN`, `ANLIEGEN_*`, `ANBINDUNG`
   in `src/lib/telefonassistent-copy.ts`. Import them; do not retype them.

## Deciding what to build

- Measure at query × landing page. Use Search Console exports when provided;
  never fabricate their values. Without them, lower confidence and say so.
- Validate intent against live results before writing. Record domains, page
  types and the research date in `docs/seo/`; snippets are not evidence for facts.
- A new indexable page must do a distinct job and carry information a generic
  summary of page one could not produce: an operational framework, decision
  rules, a test protocol, first-party methodology. Otherwise improve an existing
  page or do nothing.
- No keyword-variant landing pages, no city × service multiplication, no year
  bumps in titles without a real content update, no FAQ schema by default.
- Every new indexable page gets at least one contextual inbound link from a page
  body and points to its commercial owner. Check with
  `node .github/scripts/test-prerender-output.mjs` after a build.
- Claims about integrations, hosting, DSGVO conformity, response times,
  customer results or prices follow `HONESTY-AUDIT.md` §7.7 and
  `COPY-CLAIMS-TO-VERIFY.md`. Missing evidence makes an idea `BLOCKED — EVIDENCE`,
  not a vaguer sentence.

## Before claiming done

Run `npm run typecheck`, `npm test`, `npm run build`, `npm run lint`,
`node .github/scripts/test-seo-consistency.mjs`,
`node .github/scripts/test-prerender-output.mjs`, and inspect the prerendered
HTML of every changed route (one H1, manifest title, canonical, robots,
JSON-LD, visible content, inbound links). Add every changed or new URL to the
scoreboard with date, hypothesis, and success and failure criteria.
