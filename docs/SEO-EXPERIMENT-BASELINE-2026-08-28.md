# SEO Experiment Baseline — 2026-08-28

**Purpose:** frozen pre-change record for three quick-win opportunities, so any post-change measurement has a defensible comparison point.
**Status:** baseline only. **No website files were modified.**

**Measurement window (GSC):** 2026-07-31 → 2026-08-25 (28 days), property `sc-domain:cogniiq.de`, retrieved via `claude-seo run gsc_query.py`.
**Baseline captured:** 2026-08-28.
**Code state:** branch `main`, working tree clean at capture time, HEAD `27258b6`.

> **GSC data-lag caveat:** Search Analytics has a 2–3 day reporting lag, so the window closes 2026-08-25 rather than the capture date. Any post-change comparison must use an equal-length 28-day window, and must start no earlier than ~3 days after the change ships, or the two windows will overlap the change itself.

---

## ⚠️ Metadata source discrepancy (found during baseline capture — read before changing anything)

These pages define their title/description in **two different places**, and the two disagree:

| Source | Used for | Regensburg relaunch title |
|---|---|---|
| `src/lib/routing/publicRoutes.ts` | **Prerendered HTML — what Googlebot receives.** `scripts/prerender.mjs` `buildHead()` writes `route.title` into `<title>`, og:title, twitter:title, and *asserts* the served title matches the manifest (`fail('title does not match the manifest')`). | `Website Relaunch Regensburg – Modernisierung ohne Rankingverlust \| Cogniiq` |
| `src/pages/cluster/**/*.tsx` → `config.seo.title` → `PageSEO` | Client-side `document.title` after hydration. Not what the crawler indexes. | `Website Relaunch Regensburg – Modernisierung & SEO-Neustart \| Cogniiq` |

**The `publicRoutes.ts` values are the baseline that matters** — they are what Google crawled and ranked. All titles/descriptions recorded below are the `publicRoutes.ts` (served) values, with the component value noted separately where it diverges.

This also corrects an error in the earlier `docs/GSC-QUICK-WIN-FORENSICS.md`, which recorded the component-level title as the live one for Opportunity 1. The bottleneck conclusions in that document are unaffected (they rested on internal linking and content framing, not on the exact title string), but the title text quoted there was the client-side value, not the served one.

---

## Opportunity 1 — "website relaunch regensburg"

### Search Console metrics (28d, 2026-07-31 → 2026-08-25)

| Metric | Value |
|---|---|
| Current ranking URL | `https://cogniiq.de/regensburg/website-relaunch` |
| Clicks | 1 |
| Impressions | 61 |
| CTR | 1.64% |
| Average position | 5.4 |

**Competing URLs for the same query (cannibalization baseline):**

| URL | Position | Impressions | Clicks |
|---|---|---|---|
| `/regensburg/website-relaunch` | 5.4 | 61 | 1 |
| `/webdesign` | 70.7 | 37 | 0 |
| `/regensburg` | 56.8 | 15 | 0 |

**Indexation at baseline:** `PASS` · Submitted and indexed · robots ALLOWED · canonical self-matches · crawled as MOBILE · last crawl 2026-08-10 · Breadcrumbs rich result detected.

### Current title (served / prerendered)
`Website Relaunch Regensburg – Modernisierung ohne Rankingverlust | Cogniiq`
*(`src/lib/routing/publicRoutes.ts:443`)*

Component-level divergent value: `Website Relaunch Regensburg – Modernisierung & SEO-Neustart | Cogniiq` (`WebsiteRelaunchRegensburg.tsx:14`).

### Current meta description (served)
`Website Relaunch in Regensburg: alte Website modernisieren, Performance verbessern, lokales SEO optimieren. Professionelle Umsetzung für Unternehmen in Ostbayern.`
*(`publicRoutes.ts:444`)* · keywords field: `Website Relaunch Regensburg, Homepage Relaunch Regensburg, Website modernisieren Regensburg`

### Current H1
`Website Relaunch in Regensburg`
*(`WebsiteRelaunchRegensburg.tsx:22`, `hero.h1`, rendered by `ClusterPage`)*

### Current internal links pointing to this page

Code-derived (6 sources):

| Source file | Line | Anchor text |
|---|---|---|
| `src/components/Footer.tsx` | 329 | `Website Relaunch` (in Regensburg-labeled column) |
| `src/pages/WebdesignHub.tsx` | 84 | `Website Relaunch Regensburg` |
| `src/pages/cluster/regensburg/WebsiteErstellenRegensburg.tsx` | 118 | `Website Relaunch Regensburg` |
| `src/pages/cluster/regensburg/WebdesignKostenRegensburg.tsx` | 160 | `Website Relaunch Regensburg` |
| `src/pages/cluster/regensburg/LokalesSEORegensburg.tsx` | 113 | `Website Relaunch Regensburg` |
| `src/pages/cluster/regensburg/LandingpageRegensburg.tsx` | 113 | `Website Relaunch Regensburg` |

**Known gaps at baseline** (these are the intended change targets — recorded as absent, not yet fixed):
- `/regensburg` city hub does **not** link here — `CITY_LINKS.regensburg` in `src/lib/standorte-data.ts` lists only Webdesign / KI-Telefonassistent / Automatisierung.
- Homepage does **not** link here — `LocationContent.tsx` uses the same restricted 3-service-per-city list.

**Google-reported referring URLs** (URL Inspection API, a sample — not exhaustive, and notably does not overlap the code-derived list): `/muenchen/ki-telefonassistent`, `/sitemap.xml`, `/regensburg/webdesign-kosten`.

### Current relevant content sections
- `hero` — h1 + lead (relaunch triggers: outdated site, poor rankings, slow load) + trustTags `["Regensburg", "SEO-Migration", "Pagespeed", "Kein Ranking-Verlust"]`
- `tldr` — 4 items: Für wen / Typische Ziele / Projektdauer (3–8 Wochen) / Preisrahmen (ab ca. 2.000 €)
- `intro` — "Wann ist ein Relaunch in Regensburg sinnvoll?", 3 paragraphs
- `painPoints` — 6 items (load >4s, dated design, DSGVO, mobile, local competition, legacy CMS)
- `deliverables` — "Was ein Relaunch mit Cogniiq umfasst", 10 items incl. `Performance-Optimierung: Core Web Vitals grün`
- `localRelevance` — "Website Relaunch für Regensburger Unternehmen", 3 paragraphs (incl. Gastronomie/tourism angle)
- `faq` — 9 Q&A incl. explicit pricing (2.000 € / 3.500–7.000 €)
- `internalLinks` — 6 outbound (5 Regensburg siblings + `/leistungen`)

---

## Opportunity 2 — "website performance bayreuth"

### Search Console metrics (28d, 2026-07-31 → 2026-08-25)

| Metric | Value |
|---|---|
| Current ranking URL | `https://cogniiq.de/bayreuth/website-relaunch` |
| Clicks | 0 |
| Impressions | 27 |
| CTR | 0% |
| Average position | 7.0 |

**Competing URLs for the same query:**

| URL | Position | Impressions | Clicks |
|---|---|---|---|
| `/bayreuth/website-relaunch` | 7.0 | 27 | 0 |
| `/bayreuth/webdesign` | 47.5 | 2 | 0 |
| `/bayreuth/lokales-seo` | 93.0 | 1 | 0 |

**Indexation at baseline:** `PASS` · Submitted and indexed · robots ALLOWED · canonical self-matches · crawled as MOBILE · last crawl 2026-08-20 · Breadcrumbs rich result detected.

### Current title (served / prerendered)
`Website Relaunch Bayreuth – Alte Website modernisieren | Cogniiq`
*(`publicRoutes.ts:307`)* — **contains no "Performance" token.**

Component-level divergent value: `Website Relaunch Bayreuth – Modernisierung & SEO-Neustart | Cogniiq` (`WebsiteRelaunchBayreuth.tsx:14`) — also no "Performance".

### Current meta description (served)
`Website Relaunch in Bayreuth: Ihre bestehende Website modernisieren ohne Rankingverlust. Neues Design, bessere Performance, stärkeres SEO – persönliche Betreuung.`
*(`publicRoutes.ts:308`)* — **"Performance" appears here, in the description only.**
keywords field: `Website Relaunch Bayreuth, Website modernisieren Bayreuth, Homepage Relaunch Bayreuth` — no Performance token.

### Current H1
`Website Relaunch in Bayreuth`
*(`WebsiteRelaunchBayreuth.tsx:22`)* — **contains no "Performance" token.**

### Current internal links pointing to this page

Code-derived (7 sources — note this is **more** than Opportunity 1's page receives):

| Source file | Line | Anchor text |
|---|---|---|
| `src/components/Footer.tsx` | 303 | `Website Relaunch` (in Bayreuth-labeled column) |
| `src/pages/WebdesignHub.tsx` | 74 | `Website Relaunch Bayreuth` |
| `src/pages/pillars/WebdesignAgenturDeutschland.tsx` | 101 | `Website Relaunch` |
| `src/pages/cluster/bayreuth/WebsiteErstellenBayreuth.tsx` | 128 | `Website Relaunch Bayreuth` |
| `src/pages/cluster/bayreuth/WebdesignKostenBayreuth.tsx` | 170 | `Website Relaunch Bayreuth` |
| `src/pages/cluster/bayreuth/LandingpageBayreuth.tsx` | 123 | `Website Relaunch Bayreuth` |
| `src/pages/cluster/bayreuth/LokalesSEOBayreuth.tsx` | 123 | `Website Relaunch Bayreuth` |

No anchor text anywhere on the site uses "Performance", "Pagespeed", or "Ladezeit" pointing to this URL.

Same structural gaps as Opportunity 1: `CITY_LINKS.bayreuth` (`standorte-data.ts`) and `LocationContent.tsx` both restrict to Webdesign / KI-Telefonassistent / Automatisierung, so neither the `/bayreuth` hub nor the homepage links here.

**Google-reported referring URLs** (URL Inspection sample): `/kontakt`, `/prozessautomatisierung`.

### Current relevant content sections
Performance-relevant material **already present** (the reason this page ranks at all for the query):
- `painPoints[0]` — `Website lädt langsam – Google straft schlechte Core Web Vitals mit schlechteren Rankings ab`
- `deliverables.items[3]` — `Performance-Optimierung: Ladezeit unter 2s, Core Web Vitals grün`
- `deliverables.items[0]` — `Website-Analyse und Audit (Pagespeed, SEO, DSGVO)`
- `intro` paragraph 2 — analysis covers "Pagespeed, SEO-Status, Core Web Vitals, Conversion-Struktur, DSGVO-Konformität"
- `faq[4]` — relaunch necessity criteria incl. `Ladezeit über 3 Sekunden`
- `localRelevance` paragraph 2 — "messbare Verbesserung von Pagespeed und SEO"

Full section inventory: `hero` (h1 + lead + trustTags `["Bayreuth", "SEO-Neustart", "Pagespeed", "Kein Datenverlust"]`), `tldr` (4 items, ab ca. 2.000 €), `intro` (3 paragraphs), `painPoints` (6), `deliverables` (10), `localRelevance` (3 paragraphs), `faq` (9), `internalLinks` (6 outbound).

**Baseline characterization:** performance content exists and is substantive, but it is distributed across supporting fields. No `<h2>`/section heading, no title, no H1, and no keywords entry is organized around "Performance" as a subject.

---

## Opportunity 3 — "website performance optimierung bayreuth"

### Search Console metrics (28d, 2026-07-31 → 2026-08-25)

| Metric | Value |
|---|---|
| Current ranking URL | `https://cogniiq.de/bayreuth/website-relaunch` |
| Clicks | 0 |
| Impressions | 22 |
| CTR | 0% |
| Average position | 7.2 |

**Competing URLs for the same query:**

| URL | Position | Impressions | Clicks |
|---|---|---|---|
| `/bayreuth/website-relaunch` | 7.2 | 22 | 0 |
| `/bayreuth/webdesign` | 47.2 | 4 | 0 |
| `/webdesign` | 95.0 | 1 | 0 |

**Indexation, title, meta description, H1, internal links, content sections:** identical to Opportunity 2 — same URL (`/bayreuth/website-relaunch`), same code, same crawl record. See Opportunity 2 above; not duplicated here to avoid two records drifting apart on re-measurement.

**Relationship to Opportunity 2:** these are the same page answering two near-duplicate phrasings of one searcher need. **Measure them together.** A change to `/bayreuth/website-relaunch` moves both simultaneously, so neither can serve as a control for the other.

---

## Combined baseline totals (the numbers to beat)

| Opportunity | URL | Clicks | Impr. | CTR | Position |
|---|---|---|---|---|---|
| website relaunch regensburg | `/regensburg/website-relaunch` | 1 | 61 | 1.64% | 5.4 |
| website performance bayreuth | `/bayreuth/website-relaunch` | 0 | 27 | 0% | 7.0 |
| website performance optimierung bayreuth | `/bayreuth/website-relaunch` | 0 | 22 | 0% | 7.2 |
| **Total** | — | **1** | **110** | **0.91%** | **6.5 (unweighted mean)** |

Site-wide context at baseline: 12 clicks, 9,458 impressions, 0.13% CTR, avg. position 54.7. These three opportunities are 1.2% of site impressions but 8.3% of site clicks.

---

## How to re-measure (so the comparison is honest)

1. **Wait ≥3 days after the change ships** before starting the post window (GSC lag), then take a full 28-day window.
2. Re-run: `claude-seo run gsc_query.py --property sc-domain:cogniiq.de --json` and pull the same query+page rows.
3. Compare per-query: position, impressions, clicks, CTR — **and** the competing-URL tables above (a fix that works should *reduce* impressions on the cannibalizing URLs, not just raise the target).
4. Re-run `claude-seo run gsc_inspect.py <url>` to confirm indexation stayed `PASS` and the canonical did not change.
5. Re-derive the internal-link table from source; confirm the intended new links exist and no unintended ones were added.

### Falsifiability — what would show the change failed
- **Opportunity 1 (internal-link fix):** if position does not improve within two full 28-day windows *and* `/webdesign` + `/regensburg` impressions for the query are unchanged, the internal-authority hypothesis (bottleneck **E**) is wrong — investigate external backlinks (**F**) via `/seo backlinks` before further internal-link work.
- **Opportunities 2+3 (vocabulary/emphasis fix):** if adding explicit Performance framing does not move position from ~7 while the page's internal links stay constant, the topical-relevance hypothesis (**C**) is wrong — the constraint is more likely competitor strength (**J**), which no on-page edit will resolve.
- **Any opportunity:** if impressions rise but CTR stays 0%, the problem was never ranking — it is SERP presentation (**H**), and the next lever is title/description rewriting, not content or links.

### Leading indicators (checkable without a full re-audit)
- Weekly average position for the three exact queries (moves before clicks do).
- Impression share shifting *away* from cannibalizing URLs toward the target URL.
- First non-zero click on either Bayreuth performance query — the single clearest signal the emphasis change worked.

---

## Confirmation

- No files under `src/`, `public/`, or any website surface were modified.
- Only `docs/SEO-EXPERIMENT-BASELINE-2026-08-28.md` was written.
- All GSC figures are real API responses, not estimates.
- All on-page facts are read from committed source at HEAD `27258b6`.

---

# Change log

> Appended after baseline capture. **The baseline measurements above are frozen and must not be edited.**

## Entry 1 — 2026-08-28 · Opportunity 1: internal-link reinforcement

**Implementation date:** 2026-08-28
**Branch:** `claude/regensburg-relaunch-internal-links` (not merged, not deployed)
**Baseline reference:** the Opportunity 1 block above (position 5.4 · 61 impr · 1 click · 1.64% CTR)
**Target page:** `https://cogniiq.de/regensburg/website-relaunch` — **not modified**

### Changed source pages

| File | Change |
|---|---|
| `src/pages/CityLandingPage.tsx` | Added optional `deepDive` field to `CityConfig`, populated for `regensburg` only; rendered under the existing service grid. |
| `src/components/LocationContent.tsx` | Added one contextual sentence with a link, inside the existing "Lokal verwurzelt, digital vernetzt" block on the homepage. |

### Anchors added

| # | Surface | Anchor text | Target |
|---|---|---|---|
| 1 | `/regensburg` city hub | `Relaunch der bestehenden Website` | `/regensburg/website-relaunch` |
| 2 | Homepage (`LocationContent`) | `bestehende Websites modernisieren` | `/regensburg/website-relaunch` |

Both anchors are deliberately **non-exact-match**. The 6 pre-existing links all use `Website Relaunch Regensburg` / `Website Relaunch`; these two add descriptive variation rather than repeating the exact query string.

**Internal link count for the target page: 6 → 8.**

### Architectural note — why `CITY_LINKS.regensburg` was *not* used

The original plan named `CITY_LINKS.regensburg` as the insertion point. Inspection showed this would violate two of the experiment's own constraints:

1. `CITY_LINKS[slug].services` renders into `grid md:grid-cols-3` on the city page — a 4th entry leaves an orphan card in a second row, i.e. a **visual design change**.
2. The same array also renders in the "Weitere Standorte" lists on `/bayreuth` and `/muenchen` — a Regensburg entry there would **change what the Bayreuth page renders**, which the experiment explicitly forbids.

The `deepDive` field on `CITY_CONFIGS` was used instead: it is city-scoped, sits beside the existing per-city copy (`intro`, `tagline`), and is `undefined` for Bayreuth and München, so those pages render byte-identically. Verified post-build: `grep -c 'Sie betreiben bereits eine Website' dist/bayreuth.html dist/muenchen.html` → `0` for both.

### Hypothesis being tested

**H1 (bottleneck E — weak internal authority):** `/regensburg/website-relaunch` ranks at position 5.4 despite correct on-page targeting because it is absent from the two highest-authority surfaces in its own silo (the `/regensburg` city hub and the homepage). Adding contextual links from both should increase the internal link equity flowing to it and improve average position for `website relaunch regensburg`.

**Predicted direction:** average position improves from 5.4; impressions on the cannibalizing URLs (`/webdesign` at 70.7, `/regensburg` at 56.8) should hold or fall, not rise.

**Falsification (per the baseline's criteria):** if after two full 28-day windows position has not improved *and* competing-URL impressions are unchanged, hypothesis E is wrong — investigate external authority (**F**) via `/seo backlinks` before any further internal-link work.

**Deliberately unchanged, so the experiment stays single-variable:** target page title, meta description, H1, body copy, schema, canonical, routing, URL; `publicRoutes.ts`; all Bayreuth pages; Opportunities 2, 3 and 4; the duplicated SEO metadata system.

### Verification results (2026-08-28)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass, no errors |
| `npm run lint` | 0 errors, 24 warnings — all pre-existing, none in the two changed files |
| `npm test` | 78 files, 2057 passed, 1 skipped, 0 failed |
| `npm run build` | Pass — 91 public routes prerendered (88 indexable, 3 noindex) |
| Target page prerenders | `dist/regensburg/website-relaunch.html` generated |
| Served title | `Website Relaunch Regensburg – Modernisierung ohne Rankingverlust \| Cogniiq` — **unchanged vs. baseline** |
| Served canonical | `https://cogniiq.de/regensburg/website-relaunch` — **unchanged** |
| Served robots | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` — **unchanged** |
| Served meta description | unchanged vs. baseline |
| Served H1 | `Website Relaunch in Regensburg` — **unchanged** |
| New link in `dist/regensburg.html` | present, 1 occurrence |
| New link in `dist/index.html` | present, 1 occurrence |
| `dist/bayreuth.html` / `dist/muenchen.html` | no new markup (0 occurrences) |
| `dist/bayreuth/website-relaunch.html` title | unchanged |
| Files changed | exactly 2 (`CityLandingPage.tsx`, `LocationContent.tsx`), +42 lines, 0 deletions |

**Build environment note:** the build's prerender step requires Node 22.22.2 (pinned in `.node-version`); it aborts on Node 24. Node 22.22.2 was installed via `fnm` to complete the build. No project files were changed for this.

**Not deployed.** Branch not pushed, not merged.
