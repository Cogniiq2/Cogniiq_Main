# SEO experiment: Bayreuth "Website Relaunch" title alignment (performance demand)

Status: **READY FOR OWNER REVIEW** — not merged, not deployed.

## What changed

Two single-line title edits, kept in sync:

- `src/lib/routing/publicRoutes.ts` (`/bayreuth/website-relaunch` route entry) — this is the
  title `scripts/prerender.mjs` writes into the crawled `<head>`, i.e. what Google actually sees.
- `src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx` (`ClusterPageConfig.seo.title`) — this
  is what a live browser tab shows after client-side hydration.

Before (drifted, two different strings):

- Manifest: "Website Relaunch Bayreuth – Alte Website modernisieren | Cogniiq"
- Component: "Website Relaunch Bayreuth – Modernisierung & SEO-Neustart | Cogniiq"

After (identical in both places):

- "Website Relaunch Bayreuth – Mehr Performance & bessere Rankings | Cogniiq"

No other field changed: description, keywords, canonical, H1, body content, FAQ, internal links,
and sitemap entry are all untouched. No new page, no URL change, no other city touched.

## Why a title change, and why this wording

- GSC (28d, 2026-07-31 → 2026-08-25): `/bayreuth/website-relaunch` ranks position **7.0** for
  "website performance bayreuth" (27 impr) and **7.2** for "website performance optimierung
  bayreuth" (22 impr) — 49 combined impressions, **+729%** vs. the preceding 28-day period, **0
  clicks**. This is a fresh, page-1-adjacent ranking signal with a live CTR problem.
- PageSpeed Insights (mobile, live 2026-08-29): Lighthouse Performance 95/100. The page is
  genuinely fast — the ranking is earned, not a fluke — so it is honest to reference performance
  in the snippet.
- Neither title mentioned "Performance" at all before this change, despite two queries containing
  exactly that word already surfacing the page on page 1. The snippet was the mismatch, not the
  page or its ranking.
- Page content genuinely supports the claim without any rewrite: `deliverables` already lists
  "Performance-Optimierung: Ladezeit unter 2s, Core Web Vitals grün"; `painPoints` already calls
  out "Google straft schlechte Core Web Vitals mit schlechteren Rankings ab"; `localRelevance`
  already promises "Die messbare Verbesserung von Pagespeed und SEO führt in der Regel zu besseren
  Rankings". "Mehr Performance & bessere Rankings" restates existing, verified page content — it
  is not a new promise invented for the title.
- Re-evaluated against the checklist for this task (SERP/search intent, existing title, H1, page
  content, whether "Performance" is genuinely represented, risk to "Website Relaunch Bayreuth",
  title length, truncation, keyword stuffing, click appeal, publicRoutes.ts/hydrated consistency):
  - **Search intent**: the two target queries are performance-diagnosis/optimization intent; a
    relaunch that explicitly delivers measurable performance work is a correct, non-misleading
    match — not a forced keyword insertion.
  - **H1** ("Website Relaunch in Bayreuth") is left unchanged; the task scope is title/metadata
    only, and the H1 already frames the page correctly for its primary "relaunch" identity.
  - **Risk to "Website Relaunch Bayreuth"**: low. "Website Relaunch Bayreuth" remains the leading
    clause of the title, matching the H1, the URL slug, and the page's primary topic — the
    "Performance & Rankings" clause is additive, not a replacement of the relaunch framing.
  - **Title length / truncation**: 73 characters, ≈467px at typical SERP rendering widths — in
    the same range as the two sibling city pages already live and unquestioned (`/muenchen
    /website-relaunch` 71 chars/≈449px, `/regensburg/website-relaunch` 74 chars/≈464px). Not an
    outlier for this codebase's established title-length convention; no evidence it is closer to
    the ~600px desktop truncation point than the accepted siblings.
  - **Keyword stuffing**: rejected. The title does not repeat "Bayreuth" or the literal query
    strings twice, and does not chain both target queries verbatim — it summarizes the underlying
    *benefit* the queries are searching for (relevance + accuracy), which is what the task brief
    requires over exact-match insertion.
  - **Consistency**: both sources now hold the identical string, closing the metadata-drift gap
    confirmed live on this exact page (see `docs/SEO-OVERNIGHT-SHARED-EVIDENCE-2026-08-29.md` §10
    on the `claude/seo-overnight-master-2026-08-29` branch).

Conclusion: the title is the correct, smallest justified lever, and the specific wording already
implemented on `claude/seo-bayreuth-performance` (commit `a77faba`) survives a fresh adversarial
re-check against current `origin/main`. No further wording change was made.

## Verification (this branch, against current `origin/main`)

Run 2026-08-29 on `claude/seo-bayreuth-performance-production-ready-2026-08-29`, based on
`origin/main`:

- `npm run typecheck` — clean.
- `npm run lint` — 0 errors, 24 pre-existing warnings (all in files this change does not touch;
  confirmed present identically on `origin/main` before this change).
- `npm test` — 77 test files, 2039 passed / 20 skipped (0 failures).
- `npm run build` (`build:ssr` → `sitemap` → `build:client` → `prerender` → `clean:ssr`) —
  succeeded. Prerendered 91/91 public routes (88 indexable, 3 noindex).

Rendered-output checks against `dist/`:

- `dist/bayreuth/website-relaunch.html` — `<title>` is exactly "Website Relaunch Bayreuth – Mehr
  Performance & bessere Rankings | Cogniiq"; meta description unchanged.
- `dist/regensburg/website-relaunch.html` — `<title>` unchanged ("...Modernisierung ohne
  Rankingverlust...").
- `dist/muenchen/website-relaunch.html` — `<title>` unchanged ("...Modernisierung ohne
  Rankingverlust...").
- `dist/index.html` (homepage) — `<title>` unchanged.

Diff scope: exactly 2 files, 1 changed line each (`src/lib/routing/publicRoutes.ts`,
`src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx`). No other public route, city page, or
homepage metadata is touched.

## Measurement baseline (captured before this change ships)

- Target URL: `/bayreuth/website-relaunch`
- Target queries: "website performance bayreuth", "website performance optimierung bayreuth"
- Baseline window: 2026-07-31 → 2026-08-25 (28d, GSC `sc-domain:cogniiq.de`)
- Baseline position: 7.0 / 7.2
- Baseline impressions: 27 / 22 (49 combined)
- Baseline clicks: 0 / 0 (0% CTR both)
- Prior-period impressions for this query family: ~14 (28d before baseline) → 49+ current, i.e.
  the +729% growth figure quoted in the original commit refers to the whole "performance" query
  family on this URL (see shared evidence §7b), not just the two headline queries in isolation.

### 7 / 14 / 28-day check-ins (re-pull GSC query×page for `/bayreuth/website-relaunch`)

Primary metrics, both target queries:

- Impressions (vs. 27 / 22 baseline)
- Average position (vs. 7.0 / 7.2 baseline)
- CTR (vs. 0% baseline)
- Clicks (vs. 0 baseline — a single click is already a meaningful signal at this volume)

Secondary metrics (regression check on the page's other ranking queries — must not degrade):

- "website relaunch bayreuth" / "homepage relaunch bayreuth"-style queries on this URL
- "seo bayreuth" (this URL is one of six ranking pages for that query; position was 31.6 at
  baseline — not expected to move materially, but check for a large negative swing)
- Any other query already surfacing `/bayreuth/website-relaunch` in the 28d window before this
  change (page-level GSC pull, not just the two target queries)

### Rollback trigger

Revert the two title lines (back to the pre-experiment strings) if, at any 7/14/28-day check-in:

- Position on either target query degrades by more than 5 spots (e.g. 7.0 → 12+), **or**
- Any other query already ranking for this URL at baseline degrades by more than 5 spots, **or**
- Impressions on the target query family drop sharply (>50%) with no corresponding GSC-wide
  drop (i.e. it's this page, not a sitewide index/crawl issue).

Do not roll back on 0 clicks alone before the 28-day mark — GSC's low-volume noise at 49
impressions makes a single 28-day window insufficient to call a negative click result; position
and impression trend are the earlier, more reliable signals.

## Explicit non-changes (guardrails honored)

- No content rewrite, no new page, no URL change, no canonical change.
- No internal links added or removed.
- Regensburg, München, and all other city/service pages are untouched (verified in rendered
  `dist/` output above).
- `public/sitemap.xml` entry for this route is unaffected (title is not a sitemap field).

## Final decision

**READY FOR OWNER REVIEW.** The experiment's hypothesis, evidence, and implementation hold up
under a fresh adversarial re-check against current `origin/main`; the title change is genuinely
the smallest, most relevant, most accurate lever available for the two target queries; it is not
speculative keyword stuffing; and it is fully synchronized between the crawled (`publicRoutes.ts`)
and hydrated (`ClusterPageConfig.seo`) sources. No experiment change or rejection is recommended.
