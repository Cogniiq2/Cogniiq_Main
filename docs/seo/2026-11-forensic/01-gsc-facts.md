# 01 · GSC facts (export of 2026-11-19, analysed 2026-11-20)

Source: `cogniiq.de-Performance-on-Search-2026-11-20.zip`, property `sc-domain:cogniiq.de`.
All figures below are computed by script from the CSVs (no manual reading). Nothing is estimated
except where a line is explicitly labelled "expected".

## 0. What the export does and does not contain

| File | Rows | Content |
|---|---:|---|
| `Filter.csv` | 2 | Search type **Web**, date **last 28 days** |
| `Diagramm.csv` | 28 | daily totals **2026-10-21 → 2026-11-17** |
| `Suchanfragen.csv` | 448 | queries, **28-day aggregate only** |
| `Seiten.csv` | 57 | pages, **28-day aggregate only** |
| `Geräte.csv` | 3 | devices |
| `Länder.csv` | 37 | countries |
| `Darstellung in der Suche.csv` | 0 | **empty** – no search-appearance rows (no rich-result type reported) |

Consequences that bind every later conclusion:

1. **Only the daily totals can be compared 7 d vs 7 d / 14 d vs 14 d.** Queries and pages exist
   only as one 28-day sum. *Query-level and page-level "winners/losers", "new queries" and "lost
   queries" within this window cannot be calculated from this export.* The only available
   comparison is against the older snapshots recorded in `docs/seo/organic-growth-scoreboard.md`
   (28 days to 2026-09-08 / 2026-09-11) – a ten-week gap, different window, treated as indicative.
2. **No query × page data.** Every cannibalisation statement is a hypothesis.
3. **No previous 28 days.** "28 d vs previous 28 d" is not available.
4. 2026-11-17 (150 impressions, position 30.0) is almost certainly a **partial day**; windows are
   reported with and without it.
5. Query rows cover 6,809 of 7,348 impressions (93 %) but only **14 of 27 clicks (52 %)** –
   13 clicks belong to anonymised/low-volume queries that GSC does not list.
6. All 57 landing pages are reported on host **`https://cogniiq.de`** (apex). No `www` URL and
   no `pages.dev` URL appears.

## 1. Totals (28 days, 2026-10-21 → 2026-11-17)

| Metric | Value |
|---|---:|
| Clicks | **27** |
| Impressions | 7,348 |
| CTR | 0.37 % |
| Impression-weighted position | 44.8 |
| Brand ("cogniiq") | **3 impressions, 1 click** |

Devices: desktop 5,977 impr. / 18 clicks / pos. 47.7 · mobile 1,285 / 9 / 32.2 · tablet 86 / 0.
**81 % of impressions are desktop** at a mean position of ~48.
Countries: Germany 7,014 impr. / 25 clicks; Austria 84 / 2; Italy 111 / 0 at position 12.4
(hotel queries, presumably South Tyrol – not verifiable without a country × query export).

Historical reference (scoreboard, 28 days to 2026-09-08): 12,675 impressions, 14 clicks,
CTR 0.11 %, 5 of 7 listed clicks brand. So versus early September: **impressions −42 %, clicks
+93 % (14 → 27), CTR ×3.4**. Both numbers are tiny; see §3 for what that allows.

## 2. Daily series

| Date | Clicks | Impr. | CTR | Pos. | | Date | Clicks | Impr. | CTR | Pos. |
|---|---:|---:|---:|---:|---|---|---:|---:|---:|---:|
| 10-21 | 0 | 247 | 0 % | 36.1 | | 11-04 | 4 | 258 | 1.55 % | 53.6 |
| 10-22 | 0 | 296 | 0 % | 37.1 | | 11-05 | 3 | 228 | 1.32 % | 56.1 |
| 10-23 | 3 | 289 | 1.04 % | 38.0 | | 11-06 | 0 | 232 | 0 % | 54.3 |
| 10-24 | 0 | 288 | 0 % | 37.2 | | 11-07 | 0 | 208 | 0 % | 54.8 |
| 10-25 | 2 | 352 | 0.57 % | 42.6 | | 11-08 | 0 | 264 | 0 % | 58.3 |
| 10-26 | 1 | 315 | 0.32 % | 35.4 | | 11-09 | 0 | 215 | 0 % | 52.3 |
| 10-27 | 0 | 300 | 0 % | 39.7 | | 11-10 | 0 | 179 | 0 % | 48.0 |
| 10-28 | 1 | 382 | 0.26 % | 42.4 | | 11-11 | 0 | 212 | 0 % | 41.8 |
| 10-29 | 2 | 330 | 0.61 % | 42.7 | | 11-12 | 0 | 177 | 0 % | 46.1 |
| 10-30 | 1 | 302 | 0.33 % | 39.8 | | 11-13 | 1 | 236 | 0.42 % | 48.6 |
| 10-31 | 1 | 274 | 0.36 % | 42.7 | | 11-14 | 0 | 239 | 0 % | 49.3 |
| 11-01 | 0 | 310 | 0 % | 47.6 | | 11-15 | 0 | 263 | 0 % | 48.4 |
| 11-02 | 3 | 290 | 1.03 % | 45.4 | | 11-16 | 0 | 220 | 0 % | 45.5 |
| 11-03 | 5 | 292 | 1.71 % | 49.8 | | 11-17 | 0 | 150 | 0 % | 30.0 (partial) |

### Window comparisons

| Window | Dates | Clicks | Impr. | CTR | Weighted pos. |
|---|---|---:|---:|---:|---:|
| Latest 7 d (excl. partial day) | 11-10 → 11-16 | **1** | 1,526 | 0.07 % | 46.9 |
| Previous 7 d | 11-03 → 11-09 | **12** | 1,697 | 0.71 % | 54.1 |
| Latest 14 d (excl. partial day) | 11-03 → 11-16 | 13 | 3,223 | 0.40 % | 50.7 |
| Previous 13 d (all that exists) | 10-21 → 11-02 | 14 | 3,975 | 0.35 % | 40.6 |
| Latest 7 d (incl. 11-17) | 11-11 → 11-17 | 1 | 1,497 | 0.07 % | 45.1 |
| Previous 7 d | 11-04 → 11-10 | 7 | 1,584 | 0.44 % | 54.2 |
| Latest 14 d (incl. 11-17) | 11-04 → 11-17 | 8 | 3,081 | 0.26 % | 49.8 |
| Previous 14 d | 10-21 → 11-03 | 19 | 4,267 | 0.45 % | 41.3 |

By ISO week: wk 43 (5 d) 294 impr./day · wk 44 316 · wk 45 253 · wk 46 217 · wk 47 (2 d) 185.

### Three separate movements – they do not coincide

| Movement | Start | Evidence |
|---|---|---|
| A. Weighted position worsens from ~38 to ~55 | **≈ 2026-10-28 → 11-05**, gradual | daily position 37–43 until 10-31, 47.6 on 11-01, 56.1 on 11-05; back to 45–49 from 11-10 |
| B. Click burst | **11-02 → 11-05**: 15 of the 27 clicks of the whole window in 4 days | daily clicks 3/5/4/3 – *while position was at its worst* |
| C. Clicks stop | **from 11-06**: 1 click in 11 full days | conditional binomial test vs. 10-21→11-05, impression-adjusted: p ≈ 0.0002; excluding the burst days (11 clicks in 12 days before vs. 1 in 11 after): p ≈ 0.02 |
| D. Impressions drift down | wk 44 → wk 46: 316 → 217 per day (−31 %) | steady, no step |

Movement C is statistically distinguishable from chance **only under the assumption that clicks
are independent events**. They very probably are not – see §4.

## 3. The clicks: one query

| Query | Clicks | Impr. | CTR | Pos. |
|---|---:|---:|---:|---:|
| webdesign bayern | **12** | 302 | 3.97 % | 28.3 |
| webdesign agentur bayreuth | 1 | 9 | 11.1 % | 26.8 |
| cogniiq | 1 | 3 | 33.3 % | 2.3 |
| all other 445 listed queries | **0** | 6,495 | 0 % | – |
| not listed (anonymised) | 13 | 539 | – | – |

| Page | Clicks | Impr. | Pos. |
|---|---:|---:|---:|
| `/muenchen/webdesign` | **12** | 2,434 | 62.1 |
| `/` | 3 | 42 | 9.7 |
| `/kosten-ki-telefonassistent` | 2 | 210 | 17.5 |
| `/ueber-uns` | 2 | 34 | 9.1 |
| `/regensburg/ki-telefonassistent` | 2 | 25 | 17.3 |
| `/webdesign-arzt-regensburg` | 2 | 5 | 15.8 |
| `/ki-telefonassistent-zahnarztpraxis`, `/impressum`, `/blog/digitalisierung-mittelstand`, `/zu-viel-manuelle-arbeit` | 1 each | | |

**Concentration:** 12 of 14 attributable query clicks (86 %) come from one query; 12 of 27 page
clicks (44 %) fall on one page. **Hypothesis, not fact:** the equal count suggests these are the
same clicks ("webdesign bayern" → `/muenchen/webdesign`). The standard export has no query × page
dimension, so this pairing is unproven: `/muenchen/webdesign` could have earned its 12 clicks from
unlisted queries and "webdesign bayern" could land on `/bayreuth/webdesign`, `/deutschland` or
another page. Export #3 in §9 proves or disproves it.
Impressions are also concentrated by page: top 1 page 32 %, top 5 pages 67.5 %, top 10 pages 80 %
(HHI 0.150). By query they are diffuse (top 10 queries 32 %, HHI 0.015; 166 of 448 queries have
≤ 2 impressions).

**A 3.97 % CTR at an average position of 28 is not a normal organic pattern.** Either the query
ranked on page one for a few days and far lower otherwise (average 28), or the clicks are not
twelve independent searchers.

## 4. Core finding

**FACT.** The whole property received 27 clicks in 28 days; 15 fell on four days (11-02 → 11-05),
12 are one query, the brand produced 1 click from 3 impressions. After 11-05 there was 1 click
in 11 days. KI-Telefonassistent – business priority 1 – received **0 listed query clicks**
(pages of the cluster: 5 clicks in total, all from unlisted queries).

**EVIDENCE.** §2, §3.

**HYPOTHESIS.** There was no "collapse" of an established organic channel. There was a short
click burst on one low-priority query ("webdesign bayern"), whose end looks like a drop. The
steady state before and after is ≈ 0–1 non-brand click per day. The business-relevant problem is
the *level* (rankings mostly beyond page one, no brand demand), not the November change.

**ALTERNATIVE EXPLANATIONS.** (a) The pre-burst rate (11 clicks in 12 days, 10-21 → 11-01) was a
real baseline that has since been lost – then something happened around 11-06 that this export
cannot identify, because the 13 unlisted clicks cannot be attributed. (b) The burst was a single
person/bot clicking repeatedly (clicks are counted per click, not per person). (c) "webdesign
bayern" held a page-one position for some days and lost it around 11-06.

**CONFIDENCE.** High that the 28-day picture is dominated by one query and by small numbers.
Medium that there is no real loss of baseline (alternative (a) is not excluded: p ≈ 0.02).

**WHAT WOULD FALSIFY THIS.** A daily export filtered to query "webdesign bayern" (and to page
`/muenchen/webdesign`) showing clicks spread evenly from 10-21 instead of concentrated on
11-02 → 11-05; or a 3-month daily export showing a stable ≥ 1 click/day baseline before 10-21.

**RECOMMENDED ACTION.** No site change. Obtain the exports in §9 first.

## 5. Ranking vs. CTR separation

Position buckets (queries; impression share): 1–3: 12 impr. (0.2 %) · 4–10: 705 (10 %) ·
11–20: 799 (12 %) · 21–50: 2,140 (31 %) · 51+: 3,153 (46 %).
**77 % of impressions are at position > 20, where a CTR near zero is the expected value.**
For that share the diagnosis is RANKING, not CTR.

Queries at position ≤ 20 with ≥ 15 impressions ("expected" = a deliberately conservative generic
organic curve; `P(0)` = Poisson probability of seeing zero clicks if that curve applied):

| Query | Impr. | Pos. | Clicks | Expected | P(0) | Class |
|---|---:|---:|---:|---:|---:|---|
| internetagentur hotel | 309 | 8.3 | 0 | 6.8 | 0.001 | **CTR PROBLEM (real)** |
| internetagentur hotels | 188 | 9.9 | 0 | 2.8 | 0.06 | CTR PROBLEM (probable) |
| website relaunch regensburg | 74 | 7.2 | 0 | 2.1 | 0.13 | INSUFFICIENT DATA (leaning CTR) |
| homepage relaunch regensburg | 51 | 7.6 | 0 | 1.1 | 0.33 | INSUFFICIENT DATA |
| webdesign hotel | 139 | 13.4 | 0 | 0.7 | 0.50 | RANKING (page two) |
| webdesign für hotels | 76 | 18.6 | 0 | 0.4 | 0.68 | RANKING |
| ki telefonassistent kosten | 110 | 18.4 | 0 | 0.6 | 0.58 | RANKING |
| ki telefonassistent preise | 38 | 14.6 | 0 | 0.2 | 0.83 | RANKING / insufficient |
| roi für prozessautomatisierung | 23 | 15.1 | 0 | 0.1 | 0.89 | INSUFFICIENT DATA |
| website speed verbessern regensburg | 42 | 12.6 | 0 | 0.2 | 0.81 | INSUFFICIENT DATA |
| prozessautomatisierung immobilien | 22 | 15.5 | 0 | 0.1 | 0.90 | INSUFFICIENT DATA |

Only **one** query in the entire export has statistically abnormal zero clicks:
`internetagentur hotel` (plus its plural as a probable second). Combining the two Regensburg
relaunch queries (125 impr., pos. ≈ 7.4, expected ≈ 3.2, P(0) ≈ 0.04) makes that pair a
second, weaker CTR case. **Everything else on the "CTR suspect" list – including
`ki telefonassistent kosten/preise`, `webdesign hotel`, `webdesign für hotels`,
`roi für prozessautomatisierung` – is at positions 13–19, where zero clicks at these impression
counts is what chance predicts.** Those are ranking problems; changing their titles for CTR would
be optimising noise.

Caveat on "average position 8.3": it is an average over days, devices and countries. A query
that sits at 4 on some days and 14 on others yields the same mean with far fewer page-one
impressions. Italy contributes 111 impressions at position 12.4, plausibly to exactly these hotel
queries. A query-filtered daily export (§9) resolves this.

Pages at position ≤ 20: `/regensburg/website-relaunch` 210 impr., pos. 9.8, 0 clicks
(expected ≈ 3) and `/webdesign-hotel` 995 impr., pos. 14.8, 0 clicks (expected ≈ 5) are the two
page-level CTR anomalies. `/kosten-ki-telefonassistent` (210, 17.5, **2 clicks**) and
`/regensburg/ki-telefonassistent` (25, 17.3, 2 clicks) perform *above* expectation.

## 6. Query families (448 listed queries)

| Family | Queries | Clicks | Impr. | Share | Weighted pos. | Impr. at pos ≤ 10 | at 11–20 |
|---|---:|---:|---:|---:|---:|---:|---:|
| München web (webdesign/website … münchen) | 95 | 0 | 2,148 | 31.5 % | 64.8 | 1 | 16 |
| Hotel web | 16 | 0 | 961 | 14.1 % | 14.7 | 511 | 269 |
| Webdesign cost (generic) | 45 | 0 | 917 | 13.5 % | 70.0 | 3 | 18 |
| Bayern web | 12 | 12 | 415 | 6.1 % | 31.0 | 0 | 22 |
| KI-Telefon praxis/arzt | 33 | 0 | 411 | 6.0 % | 34.7 | 1 | 14 |
| Bayreuth/Oberfranken | 41 | 1 | 329 | 4.8 % | 31.8 | 36 | 59 |
| KI-Telefon other | 52 | 0 | 288 | 4.2 % | 31.6 | 10 | 55 |
| Webdesign other | 48 | 0 | 263 | 3.9 % | 55.0 | 5 | 42 |
| Automation | 30 | 0 | 246 | 3.6 % | 40.6 | 2 | 64 |
| KI-Telefon cost | 8 | 0 | 233 | 3.4 % | 22.2 | 4 | 162 |
| Regensburg (relaunch etc.) | 13 | 0 | 215 | 3.2 % | 12.3 | 128 | 65 |
| Fitness/Sport | 14 | 0 | 165 | 2.4 % | 44.7 | 2 | 6 |
| KI-Agentur | 12 | 0 | 136 | 2.0 % | 49.3 | 0 | 4 |
| other | 28 | 0 | 79 | 1.2 % | 52.4 | | |
| Brand | 1 | 1 | 3 | 0.04 % | 2.3 | 3 | 0 |

Readings:

- **Business priority vs. visibility are inverted.** KI-Telefonassistent (all three KI families)
  = 932 impressions = **13.7 %** of listed impressions, 15 of them on page one.
  Prozessautomatisierung = 3.6 %. Webdesign (priority 3) ≈ 80 %.
- **45 % of all impressions (München web + generic webdesign cost) sit at position 65–70.**
  They are commercially worthless today and they dominate the average position. The site-wide
  "average position" is therefore mostly a statement about how many of these deep impressions
  were served on a given day, not about ranking quality. This is the query-mix effect behind
  movement A in §2 – as a hypothesis; a per-day query export is needed to prove it.
- The only family with real page-one exposure is Hotel web (511 impr. at ≤ 10) – and it earns
  zero clicks.

## 7. Comparison with earlier snapshots (indicative only)

| Item | Earlier | Now (28 d to 11-17) | Reading |
|---|---|---|---|
| Property, 28 d | 12,675 impr. · 14 clicks · CTR 0.11 % (to 09-08) | 7,348 · 27 · 0.37 % | impressions −42 %, clicks up; neither is a channel |
| Property, 28 d (adjacent window) | 6,448 impr. · 9 clicks · CTR 0.14 % · pos. 35.9 (09-24 → 10-21, export of 10-23 as quoted in `FINAL_SEO_RELEASE_AUDIT.md`) | 7,348 · 27 · 0.37 % · pos. 44.8 | **vs. the directly preceding 28 days: impressions +14 %, clicks ×3.** The latest window is the best click window on record (14 → 9 → 27). Average position is worse while impressions rose – the signature of more deep-position impressions, not of lost rankings |
| Brand impressions, 28 d | 18 (to 09-08) | 3 | brand demand ≈ none, falling |
| `internetagentur hotel` | 193 impr. · pos. 44.7 (to 09-08) | 309 · **8.3** | **large ranking gain** |
| `internetagentur hotels` | 124 · 44.0 | 188 · **9.9** | large ranking gain |
| `/webdesign-hotel` (page) | 814 · 36.0 | 995 · **14.8** | ranking gain |
| `ki telefonassistent` | 42.84 (value quoted on 11-04) | 28 impr. · 36.5 | unchanged/slightly better, still page 4 |
| `ki telefonassistent arztpraxis` | 39.48 (11-04) | 90 · 39.4 | unchanged |
| `ki telefonassistent kosten` | 18.40 (11-04) | 110 · 18.4 | unchanged |
| `ki telefonassistent preise` | 16.17 (11-04) | 38 · 14.6 | unchanged/slightly better |
| `website relaunch regensburg` | pos. 5.8 (quoted 10-23) | 74 · 7.2 | slightly worse, same page |
| `/ki-telefonassistent-zahnarztpraxis` | page pos. 8.9 · 85 impr. (10-23) | 112 · 11.95 | slightly worse – inside noise for 112 impressions |

**The KI money queries did not move between the 4 November reading and now.** Whatever happened
to clicks on 11-06 did not happen through the KI cluster's rankings.

## 8. Classification summary

| Class | Items |
|---|---|
| RANKING PROBLEM | KI-Telefonassistent head and praxis terms (pos. 30–40); KI cost terms (pos. 15–22); `webdesign hotel`, `webdesign für hotels` (13–19); all München and generic webdesign-cost terms (60–75); Prozessautomatisierung (≈ 40; pillar page has 4 impressions in 28 days) |
| CTR PROBLEM | `internetagentur hotel` (certain), `internetagentur hotels` (probable), Regensburg relaunch pair (weak) |
| CONVERSION / UNKNOWN | everything after the click – the export says nothing; 27 clicks cannot support a conversion statement |
| INSUFFICIENT DATA | `roi für prozessautomatisierung`, `ki telefonassistent preise`, all queries < 50 impressions; the cause of the 11-06 click stop |

## 9. Additional exports that would settle open questions

| # | Export | Settles |
|---|---|---|
| 1 | Performance, **last 3 months (or 6)**, daily chart + queries + pages | whether a click baseline existed before 10-21; the impression decline since September |
| 2 | Same report **filtered to query = "webdesign bayern"**, daily chart | whether the 12 clicks are the 11-02 → 11-05 burst (hypothesis §4) |
| 3 | Filtered to **page = `/muenchen/webdesign`** → Queries tab | query × page for the only page with clicks |
| 4 | Filtered to page, Queries tab, for: `/webdesign-hotel`, `/regensburg/website-relaunch`, `/kosten-ki-telefonassistent`, `/ki-telefonassistent`, `/ki-telefonassistent-arzt`, `/praxen`, `/ki-agentur-deutschland`, `/kosten-webdesign`, `/muenchen/webdesign-kosten` | query ownership; cannibalisation (currently unprovable) |
| 5 | Filtered to **query = "internetagentur hotel"**: Pages tab, Countries tab, Devices tab, daily chart | which URL(s) rank, whether Italy/desktop distort the position-8 average, real page-one days |
| 6 | Compare mode: last 28 d vs previous 28 d, Queries and Pages | genuine winners/losers |
| 7 | Pages report → Indexing ("Seiten") status export + Crawl stats | whether impressions fell because pages left the index |
| 8 | Search type = **all**, plus the "Generative AI"/AI-feature filter if offered | AI Overview exposure |

Scripts: session scratchpad `gsc-scripts/an.py` (stdlib Python, reads the unpacked ZIP).
The repo's `scripts/seo/gsc-analyze.mjs` can reproduce the cluster and bucket tables.
