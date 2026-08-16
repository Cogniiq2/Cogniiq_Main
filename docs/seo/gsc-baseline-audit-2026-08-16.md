# GSC Baseline Audit — 88-Route SEO Portfolio

**Source:** Google Search Console export `cogniiq.de-Performance-on-Search-2026-08-16.xlsx`
**Window:** 15 May – 14 Aug 2026 (Search type: Web, per the export's Filters sheet)
**Status:** Pre-Gate-1/2/3 baseline. This export does **not** reflect the recently deployed
technical fixes — treat every number here as the "before" picture.
**Scope:** Read-only audit. No route was modified, deleted, consolidated, redirected or
noindexed as part of this work. Route inventory = the 88 routes in
`src/lib/routing/publicRoutePaths.ts` (87 indexable + `/anfrage-erhalten`, which is
intentionally noindex and robots-disallowed).

All worksheets of the export were incorporated: Chart (92 daily rows), Queries (982),
Pages (57 URLs), Countries (103), Devices (3), Search appearance (empty), Filters.

---

## 1. Headline numbers

| Metric (Chart sheet, 91 days) | Value |
|---|---|
| Total clicks | **16** |
| Total impressions | **17,515** |
| Site-wide CTR | **~0.09 %** |
| Impressions, first half vs second half of window | 1,495 → 16,020 (**~10.7×**) |

Monthly trend (Chart sheet):

| Month | Clicks | Impressions | Avg daily position |
|---|---|---|---|
| May (17 days) | 0 | 177 | 25.1 |
| June | 1 | 1,409 | 42.9 |
| July | 11 | 11,762 | 58.2 |
| Aug (14 days) | 4 | 4,167 | 55.4 |

Reading: visibility ramped sharply in July — consistent with the city/service portfolio
getting indexed — while average position *worsened* as many new, low-ranking pages entered
the measurement. The portfolio is being seen but not yet clicked: only 3 of 982 queries
produced any click, and 2 of those are brand ("cogniiq" 3 clicks pos 4.3, "cogni iq"
1 click pos 3.6). The single non-brand click came from "webdesign bayreuth"
(325 impressions, pos 26.8).

Sheet totals differ slightly (Pages 18,791 impr / Queries 16,556 impr / Chart 17,515 impr)
— normal GSC privacy filtering and aggregation differences; not a data-quality problem.

**Countries:** Germany = 15/16 clicks and 16,018 impressions (91 %). The remaining ~9 %
is scattered across 102 countries at position ~60+ — noise, no action implied.
**Devices:** Desktop 13,011 impr / 11 clicks, Mobile 4,002 / 5, Tablet 502 / 0.
**Search appearance:** the sheet is empty — no rich-result type (FAQ, review snippet,
sitelinks, etc.) registered a single measured impression in the window. Structured-data
work had, as of this export, no measured SERP-feature footprint.

---

## 2. Route coverage: 55 measured, 33 with zero visibility

Of the 88 routes, **55 appear in the Pages sheet** (≥1 impression) and **33 have zero
measured impressions** in 91 days.

### Zero-visibility routes (no row in the Pages sheet)

Expected / low concern (3): `/anfrage-erhalten` (noindex by design), `/impressum`,
`/datenschutz` (legal, no search intent).

**The entire blog cluster (11 routes):** `/blog` and all 10 posts
(`/blog/ki-automatisierung-kleine-unternehmen`, `/blog/ki-telefonassistent-arztpraxis`,
`/blog/webdesign-konversion-tipps`, `/blog/lokales-seo-unternehmen`,
`/blog/prozessautomatisierung-roi`, `/blog/verpasste-anrufe-kosten`,
`/blog/ki-telefonassistent-restaurant`, `/blog/website-ohne-anfragen`,
`/blog/digitalisierung-mittelstand`, `/blog/webdesign-agentur-auswahl`).
Zero impressions across 91 days strongly suggests these were not indexed (or not crawled)
during the window — worth verifying in URL Inspection once post-fix data arrives.

**Trust pages (2):** `/referenzen`, `/bewertungen` — zero impressions even for brand-adjacent
queries.

**Geo/city pages (7):** `/bayern` (hub), `/bayreuth/webdesign-kosten`,
`/bayreuth/website-erstellen`, `/bayreuth/landingpage`, `/muenchen/website-erstellen`,
`/muenchen/lokales-seo`, `/regensburg/website-erstellen`.
Notable: "website erstellen lassen regensburg" + "webseite erstellen lassen regensburg"
together drew **362 impressions** (pos ~49–51) while the matching route
`/regensburg/website-erstellen` recorded **zero** impressions — those queries are being
served by other pages (see cannibalization, §4).

**Branchen pages (8):** `/webdesign-gastronomie-bayreuth`, `/webdesign-immobilien-bayreuth`,
`/webdesign-gastronomie-muenchen`, `/webdesign-immobilien-muenchen`,
`/webdesign-gastronomie-regensburg`, `/webdesign-immobilien`, `/webdesign-hotel`,
`/webdesign-sport`.

**Problem/solution pages (2):** `/keine-terminbuchung-online`,
`/digitale-automatisierung-unternehmen`.

### Pages in GSC that are NOT canonical routes

Two `www.` host variants received impressions:

| URL | Impressions | Position |
|---|---|---|
| `https://www.cogniiq.de/muenchen/webdesign-kosten` | 19 | 31.4 |
| `https://www.cogniiq.de/muenchen/website-relaunch` | 3 | 14.0 |

The same paths also appear under the bare host (181 impr / pos 31.0 and 7 impr / pos 13.4
respectively) — measured evidence of a **www vs non-www split** in the baseline window.
Whether the deployed fixes already resolve this cannot be read from this export; flagged
for verification only, no change proposed here.

---

## 3. Query-to-page opportunities (evidence-ranked)

The export has no query→page join (GSC UI exports never do), so mappings below pair query
clusters with the route whose measured position/topic best matches. Confirmation needs a
Search Analytics API pull with `query,page` dimensions.

### Tier 1 — striking distance (position ≤ 15, measurable demand, 0 clicks)

| Query | Impr | Pos | Best-matching route (measured pos) | Evidence note |
|---|---|---|---|---|
| webentwicklung bayreuth | 124 | **9.3** | `/bayreuth/webdesign` (50.2) | Best non-brand ranking on the property. "Webentwicklung" appears exactly **once** in the whole route manifest (Bayreuth description, `publicRoutes.ts:231`) — never in a title. |
| webdesign für arzt münchen | 54 | 10.3 | `/webdesign-arzt-muenchen` (24.4) | Plus "arztpraxis webdesign münchen" 16 impr pos 13.9 and "website für arzt münchen" 45 impr pos 19.1 — a coherent cluster already near page 1. |
| verpasste anrufe kosten unternehmen | 13 | 10.4 | `/verpasste-anrufe-verlust` (14.1) | Page and query already aligned; CTR 0 at pos ~10–14. |
| web development | 84 | 6.3 | unclear | Generic English query; likely low intent for a German local portfolio. |
| conversational ai bayreuth | 25 | 13.1 | `/bayreuth/ki-telefonassistent` (16.8) | |

### Tier 2 — page-2 head terms with real volume

| Cluster (all queries matched) | Impr | Weighted pos | Matching route(s) |
|---|---|---|---|
| ki telefonassistent kosten (+ ki-anrufbeantworter kosten…) | 356 | 32.6 | `/kosten-ki-telefonassistent` — 452 impr, pos **28.5**, the strongest high-volume page by position. "Anrufbeantworter" appears **nowhere** in the route manifest despite 41 impressions. |
| webdesign bayreuth cluster (23 queries) | 1,087 | **28.1** | `/bayreuth/webdesign` — the only city cluster near page 2; source of the sole non-brand click. |
| telefonassistent arzt/praxis (41 queries) | 818 | 43.4 | `/ki-telefonassistent-arzt` (783 impr, 45.3) + `/ki-telefonassistent-praxis` (513 impr, 58.1) — see cannibalization §4. |

### Tier 3 — high demand, weak ranking (volume proof, position 50–80)

| Cluster | Impr | Weighted pos | Matching route (measured) |
|---|---|---|---|
| webdesign münchen cluster (108 queries) | 2,587 | 67.9 | `/muenchen/webdesign` — 2,857 impr, pos 73.1. Largest single demand pool in the export. |
| webdesign regensburg cluster (29 queries) | 2,372 | 58.5 | `/regensburg/webdesign` — 2,248 impr, pos 57.8. |
| seo regensburg (13 queries) | 1,149 | 68.7 | `/regensburg/lokales-seo` — 1,921 impr, pos 71.0. |
| ki/ai agentur (14 queries, incl. "ai agentur" 280 impr) | 528 | 60.8 | `/ki-agentur-deutschland` — 865 impr, pos 61.7. |
| seo bayreuth (13 queries) | 503 | 53.5 | `/bayreuth/lokales-seo` — only 71 impr, pos 56.8. |
| webdesign kosten/preis generic (42 queries) | 425 | 54.0 | `/kosten-webdesign` — 303 impr, pos 61.7. |
| automatisierung (71 queries) | 755 | 58.9 | Split across `/automatisierung-unternehmen` (490 impr, 78.7), `/prozessautomatisierung` (21 impr), `/muenchen/automatisierung` (148 impr, 38.6). |

### Vocabulary gaps with measured demand (term absent from route metadata)

Verified by grep against `src/lib/routing/publicRoutes.ts`:

| Term with impressions | Cluster demand | Occurrences in manifest |
|---|---|---|
| webdesigner (bayreuth/münchen/regensburg) | 163+141+135 = 439 impr | **0** |
| internetagentur / internet agentur | 300+ impr (Regensburg alone) | **0** |
| seo agentur (bayreuth/regensburg) | 316 impr | **0** |
| webentwicklung (4 cities) | 400+ impr | 1 (one description) |
| ki anrufbeantworter | 41 impr | **0** |

---

## 4. Potential cannibalization (inferred — needs query-page API confirmation)

Ordered by strength of evidence in this export:

1. **Host-level duplication (measured, strongest evidence):** `www.cogniiq.de` variants of
   `/muenchen/webdesign-kosten` and `/muenchen/website-relaunch` earned impressions in
   parallel with the bare-host URLs at nearly identical positions (31.4 vs 31.0; 14.0 vs
   13.4) — classic signal-splitting. Post-fix export should show the www rows disappear.

2. **Arzt vs Praxis phone-assistant pages:** the 818-impression query cluster uses
   "arzt", "arztpraxis" and "praxis" interchangeably ("ki telefonassistent arztpraxis" 213,
   "telefonassistent arztpraxis" 183, "telefonassistent arzt" 99, "telefonassistent praxis"
   99). Three routes target it: `/ki-telefonassistent-arzt` (783 impr, pos 45.3),
   `/ki-telefonassistent-praxis` (513 impr, pos 58.1), and
   `/blog/ki-telefonassistent-arztpraxis` (zero visibility). Two nearly co-extensive
   commercial pages both sitting at pos 45–58 on one intent is the portfolio's clearest
   on-site cannibalization candidate.

3. **"Website erstellen (lassen) <stadt>" served by the wrong pages:** 362 impressions for
   the Regensburg variants while `/regensburg/website-erstellen` has zero impressions —
   the `/regensburg/webdesign` page (or hub) is absorbing the queries. Same pattern for
   München and Bayreuth, whose `website-erstellen` routes are also at zero.

4. **Generic vs city Kosten pages:** `/kosten-webdesign` (pos 61.7) vs
   `/bayreuth|muenchen|regensburg/webdesign-kosten`. Generic queries ("webdesign kosten"
   60 impr, "webdesign preise" 58 impr) rank in the 40s–60s while city-suffixed cost
   queries ("webdesign münchen preise" 53 impr pos 35.1) sit closer to the city pages —
   the boundary is leaky but directionally working; watch, don't act.

5. **City hub vs city service pages:** `/regensburg` hub (1,690 impr, pos 71.5) competes in
   the same impression pool as `/regensburg/webdesign` (2,248, 57.8) and
   `/regensburg/lokales-seo` (1,921, 71.0). Hubs earning thousands of impressions at
   pos ~70 alongside the dedicated service pages is dilution typical of thin hub pages.

6. **Generic Webdesign intent split:** `/webdesign` (1,209 impr, pos 74.1) vs
   `/webdesign-agentur-deutschland` (33 impr, pos 60.4) — both chase "webdesign agentur"
   Germany-wide intent; neither ranks.

7. **Automatisierung trio:** `/automatisierung-unternehmen` (490 impr, 78.7),
   `/digitale-automatisierung-unternehmen` (zero), `/prozessautomatisierung` (21 impr,
   33.3) — three routes over one 755-impression cluster, none above pos ~33.

**Explicitly out of scope per the task:** no consolidation, redirects, canonicals or
noindex changes are proposed or performed here. Items 1–7 are verification targets for the
post-fix measurement window.

---

## 5. CTR anomalies worth tracking against the post-fix export

- Homepage: pos 12.1 with 1,089 impressions → 6 clicks (0.55 %). At pos ~12 a ~1–2 % CTR
  would be ordinary; the shortfall is consistent with a title/snippet problem in the
  baseline window (cannot be diagnosed further from this export).
- "webentwicklung bayreuth": pos 9.3, 124 impressions, **zero** clicks — a page-1 ranking
  earning nothing is the single oddest datapoint in the export.
- `/leistungen`: pos 5.0 but only 3 impressions — ranks well for something nobody searches.
- `/bayern/ki-telefonassistent`: 1 impression at pos 1.0 (anecdotal, but the only pos-1
  measurement on the property).

---

## 6. Baseline reference values (for post-Gate comparison)

| KPI | Baseline (15 May – 14 Aug 2026) |
|---|---|
| Clicks / Impressions / CTR | 16 / 17,515 / 0.09 % |
| Non-brand clicks | 1 |
| Routes with ≥1 impression | 55 / 88 |
| Routes at zero | 33 (30 excluding noindex+legal) |
| Blog cluster impressions | 0 |
| www-host impressions | 22 |
| Rich-result impressions (Search appearance) | 0 |
| Best non-brand position (≥50 impr) | webentwicklung bayreuth, 9.3 |
| Largest demand cluster | webdesign münchen, 2,587 impr @ wpos 67.9 |

**Methodology notes.** Query clusters were built by keyword matching over the 982-query
sheet; weighted position = impression-weighted mean. The GSC UI export caps and privacy-
filters rows, so sheet totals disagree by design. Query→page attribution is inferred
(the export lacks that dimension); every cannibalization claim in §4 except the www split
is therefore marked inferred. Route inventory and metadata evidence come from
`src/lib/routing/publicRoutePaths.ts` and `src/lib/routing/publicRoutes.ts` at commit time
of this audit.
