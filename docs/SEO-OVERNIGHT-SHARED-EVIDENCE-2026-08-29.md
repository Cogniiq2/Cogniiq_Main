# SEO Overnight — Shared Evidence Set (2026-08-29)

Raw facts only. No recommendations here — see `SEO-OVERNIGHT-MASTER-REPORT-2026-08-29.md` for
synthesis and prioritization. All GSC figures below are unmodified Search Console API responses
(`sc-domain:cogniiq.de`). All data pulled live during this session unless noted as reused from a
prior analysis.

## 1. Data provenance

| Source | Window | Rows | Totals |
|---|---|---|---|
| GSC query×page (current) | 2026-07-31 → 2026-08-25 (28d) | 842 | 12 clicks / 9,458 impr / 0.13% CTR / pos 54.7 |
| GSC query×page (preceding) | 2026-07-03 → 2026-07-30 (28d) | ~800 | 9 clicks / 11,144 impr / 0.08% CTR / pos 57.9 |
| GSC query×page (90d) | 2026-05-30 → 2026-08-25 | ~800 (capped) | 24 clicks / 22,428 impr / 0.11% CTR / pos 57.0 |
| GSC device (28d) | current | 3 | see §4 |
| GSC country (28d) | current | full | see §4 |
| GSC page-only (28d) | current | 60 pages w/ impressions | reused from `C:\Users\Lazar_PC\seo-scratch\SEO-GSC-GA4-COMBINED-ANALYSIS.md`, prepared 2026-08-28, same window |
| GA4 property 551863316 | any window tested (28d, 365d) | 0 | empty — no GA4 tag ever installed (confirmed again this session; unchanged from the reused analysis) |
| URL Inspection API | live, 2026-08-29 | 4 URLs | see §5 |
| PageSpeed Insights (Lighthouse, mobile) | live, 2026-08-29 | 1 URL | see §6 |
| CrUX field data | live, 2026-08-29 | 1 URL attempted | no data — insufficient Chrome traffic volume for eligibility (expected at this traffic level) |

Site total: 88 URLs in `public/sitemap.xml`; `PUBLIC_ROUTES` in
`src/lib/routing/publicRoutes.ts` is the single authoritative manifest for indexable routes,
prerendered `<head>`, and sitemap generation (enforced bidirectionally against `src/App.tsx` in CI).

## 2. Branded vs. non-branded demand (current 28d, query-level)

| Class | Impressions | Clicks |
|---|---|---|
| Branded (`cogniiq`, `cogniq`, `cogni`, misspellings) | 41 | 4 |
| Non-branded | 10,286* | 1 |

*Non-branded impressions exceed the site total (9,458) because a single query can appear against
multiple ranking pages (see §7 cannibalization) and is counted once per query×page row.

**Only 1 non-branded click in the entire 28-day window** (`website relaunch regensburg` →
`/regensburg/website-relaunch`, position 5.4). Every other click (11 of 12) is branded/navigational
demand for `/ueber-uns` and `/`.

## 3. Ranking-band distribution, non-branded queries only (current 28d)

| Band | Rows | Impressions | Clicks |
|---|---|---|---|
| 1–3 | 7 | 35 | 0 |
| 4–10 | 13 | 288 | 1 |
| 11–20 | 42 | 546 | 0 |
| 21–40 | 112 | 1,608 | 0 |
| 40+ | 651 | 7,809 | 0 |

83% of non-branded impression volume sits at position 40+ (page 4 and beyond). The 4–10 band
— the band with the highest realistic near-term ROI — is only 288 impressions across 13 rows.

## 4. Device / geography (current 28d)

| Device | Clicks | Impr. | CTR | Avg. position |
|---|---|---|---|---|
| Mobile | 7 | 2,626 | 0.27% | 59.3 |
| Desktop | 5 | 6,785 | 0.07% | 52.9 |
| Tablet | 0 | 47 | 0% | 60.6 |

Mobile CTR is ~4× desktop CTR despite a *worse* average position — directionally suggests mobile
searchers who do see Cogniiq are more decisive, not that mobile SERP presentation is broken.

Country: 8,353 of 9,458 impressions (88%) are Germany (`deu`), position 54.2. The remaining 12% is
scattered across ~20 countries (India, Indonesia, Colombia, Bangladesh, etc.) at position 60–70,
0 clicks, 0% CTR — not a targeting failure, just noise volume from broad/mismatched query matches.
Geographic relevance is not a material constraint.

## 5. URL Inspection API — live check (2026-08-29)

| URL | Coverage state | Canonical match | Last crawl | Notes |
|---|---|---|---|---|
| `/` | Submitted and indexed | ✅ | 2026-08-28 | Referring URLs include `/bayreuth/webdesign`, `/regensburg/lokales-seo` |
| `/ki-telefonassistent-arzt` | Submitted and indexed | ✅ | 2026-08-19 | Rich result: Breadcrumbs PASS. Referring URL: sitemap.xml only |
| `/bayreuth/website-relaunch` | Submitted and indexed | ✅ | 2026-08-20 | Referring URLs: `/kontakt`, `/prozessautomatisierung`. Rich results PASS |
| `/praxen` | **URL is unknown to Google** | n/a | never crawled | Page created 2026-08-18 (commit `be9a8d0`); wired into main nav same commit. Too new to have been discovered/crawled yet — **not** an indexation defect |

Confirms the task brief's prior finding: basic indexation is healthy for established pages.
`/praxen`'s absence from the index is a timing artifact, not a technical fault (see §8).

## 6. PageSpeed Insights — `/bayreuth/website-relaunch` (mobile, live 2026-08-29)

Lighthouse scores: **Performance 95 / Accessibility 96 / Best Practices 100 / SEO 100.**

| Metric | Value | Score |
|---|---|---|
| First Contentful Paint | 2.1s | 0.81 |
| Largest Contentful Paint | 2.1s | 0.96 |
| Total Blocking Time | 0ms | 1.00 |
| Cumulative Layout Shift | 0 | 1.00 |
| Speed Index | 4.2s | 0.77 |
| Time to Interactive | 2.1s | 0.99 |

Total page weight 257 KiB. No CrUX field data available (traffic volume below CrUX's reporting
threshold — expected for a page with 0 recorded organic clicks). **The page is not slow.** Its
ranking position for performance-related queries is not being suppressed by an actual performance
problem.

## 7. Query families — full data (supports Track B/C/D)

### 7a. Bayreuth "webentwicklung/webdesign" cluster — homepage vs. dedicated page

All rows, current 28d, every ranking page per query:

| Query | Page | Position | Impr. | Clicks |
|---|---|---|---|---|
| webentwicklung bayreuth | `/` | 6.0 | 67 | 0 |
| webentwicklung bayreuth | `/` | 13.1 | 15 | 0 |
| webentwicklung bayreuth | `/bayreuth/webdesign` | 35.3 | 18 | 0 |
| webentwicklung bayreuth | `/bayreuth/webdesign` | 49.7 | 3 | 0 |
| webentwicklung bayreuth | `/bayreuth` | 85.5–100.8 | 8 | 0 |
| webentwicklung bayreuth | `/bayreuth/website-relaunch` | 26.0 | 1 | 0 |
| webentwicklung bayreuth | `/webdesign` | 130 | 6 | 0 |
| webdesign bayreuth | `/` | 13.8 | 55 | 0 |
| webdesign bayreuth | `/bayreuth/webdesign` | 38.8 | 68 | 0 |
| webdesign bayreuth | `/bayreuth/webdesign` | 37.5 | 6 | 0 |
| webdesign bayreuth | `/webdesign` | 74.2–79.5 | 25 | 0 |
| webdesign bayreuth | `/bayreuth` | 84.3 | 22 | 0 |
| webagentur bayreuth | `/` | 16.7 | 25 | 0 |
| webagentur bayreuth | `/bayreuth/webdesign` | 52.7 | 3 | 0 |
| webdesigner bayreuth | `/` | 19.0 | 17 | 0 |
| webdesigner bayreuth | `/bayreuth/webdesign` | 46.0 | 5 | 0 |
| webentwickler bayreuth | `/` | 8.2 | 12 | 0 |
| webentwickler bayreuth | `/bayreuth/webdesign` | 46.5 | 2 | 0 |

**Pattern is consistent across all 5 query variants in this family: the homepage outranks
`/bayreuth/webdesign` by 25–40 positions every time**, despite the homepage title not mentioning
Bayreuth specifically (it targets "Bayern"). Zero clicks anywhere in the family.

### 7b. Bayreuth "performance" cluster (target of the implemented experiment — see §9)

| Query | Page | Position | Impr. | Clicks | Prior-period impr. |
|---|---|---|---|---|---|
| website performance bayreuth | `/bayreuth/website-relaunch` | 7.0 | 27 | 0 | 0 (new this period) |
| website performance bayreuth | `/bayreuth/webdesign` | 47.5 | 2 | 0 | — |
| website performance bayreuth | `/bayreuth/lokales-seo` | 93.0 | 1 | 0 | — |
| website performance optimierung bayreuth | `/bayreuth/website-relaunch` | 7.2 | 22 | 0 | 0 (new this period) |
| website performance optimierung bayreuth | `/bayreuth/webdesign` | 47.2 | 4 | 0 | — |
| website performance optimierung bayreuth | `/webdesign` | 95.0 | 1 | 0 | — |

Family total impressions: 14 (preceding 28d) → 116 (current 28d), **+729%**. This is a newly
emerging query pattern Google is actively testing `/bayreuth/website-relaunch` against, at a
genuinely competitive position (7.0–7.2, page 1).

### 7c. KI-Telefonassistent × Arztpraxis cluster (largest commercial opportunity)

Landing page: `/ki-telefonassistent-arzt` exclusively (56 distinct query variants, current 28d).
Top rows by impressions:

| Query | Position | Impr. |
|---|---|---|
| telefonassistent arztpraxis | 35.0 | 129 |
| ki telefonassistent arztpraxis | 34.7 | 118 |
| telefonassistent praxis | 39.8 | 63 |
| telefonassistent arzt | 28.3 | 49 |
| ki telefonassistent praxis | 38.6 | 21 |
| ki-telefonassistent arztpraxis | 35.0 | 20 |
| telefonassistentin arzt | 34.3 | 18 |
| ki terminvereinbarung telefon | 42.7 | 15 |
| ki telefon arztpraxis | 35.7 | 12 |

Cluster total: **449 impressions (current), down from 616 (preceding, −27%)**, 0 clicks, all on one
page, positions 28–74. `/praxen` — the page the site's own main navigation sends this exact
audience to (see §8) — has **zero impressions** because it is not yet indexed.

Related, same family: `ki telefonassistent kosten` / `ki-telefonassistent kosten` /
`ki anrufbeantworter kosten` → `/kosten-ki-telefonassistent`, 152 impr (down from 261, −42%),
positions 34–36.

### 7d. Cannibalization — non-branded queries ranking on 2+ distinct Cogniiq URLs (current 28d)

131 such queries exist. The 15 largest by combined impressions:

| Query | Impr. total | Pages (position, impr.) |
|---|---|---|
| webdesign regensburg | 351 | `/regensburg/webdesign`(59.3,102); `/regensburg`(70.3,249) |
| seo bayreuth | 279 | `/`(15.2,9); `/bayreuth/lokales-seo`(25.9,58); `/bayreuth/website-relaunch`(31.6,5); `/bayreuth/webdesign`(53.5,81); `/webdesign`(80.0,71); `/bayreuth`(91.5,55) |
| seo regensburg | 273 | `/regensburg/webdesign`(50.8,103); `/regensburg`(76.4,170) |
| webentwicklung regensburg | 223 | `/regensburg/webdesign`(59.8,54); `/regensburg`(75.0,114); `/webdesign`(91.6,55) |
| webdesign agentur regensburg | 218 | `/regensburg/webdesign`(39.0,80); `/regensburg`(73.9,138) |
| internetagentur regensburg | 183 | `/regensburg/webdesign`(55.3,95); `/regensburg`(79.7,88) |
| webdesign bayreuth | 168 | `/`(13.8,55); `/bayreuth/webdesign`(38.8,68); `/webdesign`(74.2,23); `/bayreuth`(84.3,22) |
| website erstellen lassen regensburg | 167 | `/regensburg/webdesign`(45.2,56); `/regensburg`(77.2,111) |
| regensburg webdesign | 161 | `/regensburg/webdesign`(55.9,50); `/regensburg`(73.6,111) |
| webdesigner regensburg | 154 | `/regensburg/webdesign`(60.9,49); `/regensburg`(73.5,105) |
| webseite erstellen lassen regensburg | 138 | `/regensburg/webdesign`(50.7,90); `/regensburg`(83.5,48) |
| homepage erstellen lassen regensburg | 134 | `/regensburg/webdesign`(50.1,47); `/regensburg`(76.8,69); `/webdesign`(81.8,18) |
| seo agentur bayreuth | 121 | `/bayreuth/webdesign`(42.6,62); `/bayreuth/lokales-seo`(65.6,29); `/webdesign`(80.5,30) |
| website relaunch regensburg | 113 | `/regensburg/website-relaunch`(5.4,61) — winning; `/regensburg`(56.8,15); `/webdesign`(70.7,37) |
| landingpage optimierung regensburg | 104 | `/regensburg/webdesign`(54.7,3); `/regensburg/landingpage`(57.6,8); `/webdesign`(61.4,52); `/regensburg`(84.7,41) |

The Regensburg city-hub vs. service-page pair (`/regensburg` vs. `/regensburg/webdesign`) is the
dominant cannibalization pattern site-wide, all at positions 39–95 (not a near-term win either way).
`website relaunch regensburg` is the one query in this list where the *correct* page already wins
decisively — consistent with the existing `claude/regensburg-relaunch-internal-links` experiment.

## 8. Internal link signals (grep-based, config-driven pages only — main nav/footer counted
separately; not a full crawl graph)

| Page | Config-driven internal link refs | In main nav? | Page age (first commit) |
|---|---|---|---|
| `/bayern` | 27 | ✅ (region link) | — |
| `/leistungen` | 24 | ✅ (escape hatch) | — |
| `/regensburg/webdesign` | 17 | via city hub | 2026-03-14 |
| `/bayreuth/webdesign` | 18 | via city hub | 2026-03-14 |
| `/ki-telefonassistent` | 14 | ✅ (Leistungen panel) | 2026-03-14 |
| `/kosten-ki-telefonassistent` | 10 | ✅ (Leistungen panel) | — |
| `/ki-telefonassistent-arzt` | 8 | ❌ not in main nav | 2026-03-14 |
| `/bayreuth/website-relaunch` | 6 | ❌ (reached via city hub → service page → cluster pages) | — |
| `/webdesign` | 1 | ✅ (Leistungen panel, label only) | — |
| `/praxen` | 0 (config-driven); 1 (main nav, added 2026-08-18) | ✅ **replaces** `/ki-telefonassistent-arzt` as the nav destination for "AI phone assistant for medical practices" | 2026-08-18 |

`src/lib/navigation-data.ts` (single source for desktop + mobile nav, 92 pages read from it)
documents its own routing decision explicitly in code comments: the "Für Arzt- und
Zahnarztpraxen" nav item under KI-Telefonassistent points to `/praxen`, not
`/ki-telefonassistent-arzt`, because `/praxen` is "the hub with the full evidence chain" — a
deliberate, recent architecture decision, not an oversight.

## 9. Baseline for the implemented experiment (Bayreuth Performance)

Captured 2026-08-29, before any code change, from the data in §7b:

- Target URL: `/bayreuth/website-relaunch`
- Target queries: `website performance bayreuth`, `website performance optimierung bayreuth`
- Baseline window: 2026-07-31 → 2026-08-25
- Baseline position: 7.0 / 7.2
- Baseline impressions: 27 / 22 (49 combined)
- Baseline clicks: 0 / 0
- Baseline CTR: 0% / 0%
- Current `<title>` (both `publicRoutes.ts` and the page's own `ClusterPageConfig` — see §10):
  manifest says *"Website Relaunch Bayreuth – Alte Website modernisieren | Cogniiq"*; component
  config says *"Website Relaunch Bayreuth – Modernisierung & SEO-Neustart | Cogniiq"* — **the two
  differ**, confirming the metadata-drift pattern flagged in project history is still live on this
  exact page.
- PageSpeed Lighthouse mobile performance score: 95/100 (§6) — the page's actual performance is not
  the bottleneck; SERP presentation of that strength is.

## 10. Metadata source-of-truth (technical, verified this session)

Confirmed by reading `scripts/prerender.mjs:82-155`: prerendering regex-replaces `<title>`,
meta description, OG/Twitter tags in the SSR-rendered HTML using `route.title` /
`route.description` from `src/lib/routing/publicRoutes.ts` — **after** the component has already
rendered its own `<PageSEO title={config.seo.title} .../>` (e.g.
`src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx:14`). `prerender.mjs:200` asserts the final
`<title>` matches the manifest, so **`publicRoutes.ts` is what Google actually crawls**; the
component's own `config.seo.title`/`description` only affects the client-side hydrated document
(what a live browser tab shows after JS runs), which can differ from the crawled snapshot as shown
above. This is a pre-existing architecture note (see `CLAUDE.md` and the file's own header comment)
— confirmed still true, not newly introduced.

## 11. GA4 / measurement status (confirmed, not re-litigated — see master report §14 for the
completed-branch review)

Property `properties/551863316` returns empty result sets for every report tested (organic,
top-pages, device, country; 28d and 365d windows). Root cause, verified in
`src/lib/consent.ts` and repo-wide search: **no GA4 tag has ever been installed on the live site.**
The only Google tag present is Google Ads `AW-17946397271`. This matches the prior analysis exactly
and was not re-derived from scratch — see `C:\Users\Lazar_PC\seo-scratch\SEO-GSC-GA4-COMBINED-ANALYSIS.md`
for the full page-level breakdown reused in this document (§ "single most important finding",
"page-level performance", "classification").

## 12. Competitor snapshot (top 2 priority families only, per scope instructions)

**KI Telefonassistent Arztpraxis** — live web search shows the visible competitive set is
dominated by (a) Doctolib (the dominant DACH practice-management/booking brand, publishing its own
"KI-Telefonassistent" product page), (b) vertical SaaS vendors (DocMedico, 321 MED,
PraxisConcierge), and (c) comparison/aggregator content (`medizinio.de`,
`praxisconcierge.de/telefonassistent-arztpraxis-vergleich`, `finanzskalpell.com`) — several of which
are explicit "N Anbieter im Vergleich" listicles. Cogniiq is a generalist AI agency competing
against entrenched vertical-specific brands and comparison-content publishers for these terms.

**Webentwicklung/Webdesign Bayreuth** — live web search shows local competitors include
`feedbax.de`/`feedbax.ai` (directory/listicle sites — "Die 10 besten Webdesign Agenturen in
Bayreuth"), and established local agencies with visible tenure/awards (Jung und Banse — Deutscher
Agenturpreis, German Web Award 2024; Feuerpfeil — 20+ years; Seiten-Werk; Ucentric Media). This is a
mature local market with entrenched, awarded incumbents, not an empty field.

## 13. What was NOT collected (documented per scope instructions)

- Full backlink-metric data (no Moz/Ahrefs/Majestic API configured this session) — external
  authority discussed qualitatively in the master report, explicitly flagged as uncertain.
- CrUX historical trend (`crux_history.py`) — skipped; the single CrUX attempt in §6 already
  returned "insufficient traffic," so a 25-week history would return the same for every week.
- Full-site PageSpeed audit across all 88 URLs — explicitly out of scope per instructions; only
  the page relevant to the Bayreuth Performance decision was tested.
- GA4 re-query beyond confirming the prior analysis's finding still holds — re-running the full
  GA4 report set would have produced identical empty results; not worth repeating.
