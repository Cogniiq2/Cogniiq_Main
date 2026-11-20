# 08 · Adversarial review of documents 01–07

Date: 2026-11-20. Role: falsification. Research only; nothing but this file was written.
Scripts (stdlib Python, run with `python3 -I`):
`/tmp/claude-0/-home-user-Cogniiq-Main/9a9701d6-f26f-5cdb-b187-a17e29811981/scratchpad/adversarial/` (`a.py`, `b.py`, `c.py`, `cfgdiff.py`, `live.py`; fetched pages in `live/`).

Evidence tags: **[RECOMPUTED]** from the raw CSVs · **[GIT]** from `origin/main` · **[LIVE]** curl
against `cogniiq.de` on 2026-11-20 · **[ASSUMPTION]** my own unverified reasoning.

What I could not check: any Google SERP, any Google update date (they post-date my knowledge and
come from one web-search proxy), backlinks, Cloudflare deployment times, query × page.

---

## 0 · Headline results

1. **The analysts' central framing ("no real loss, just the end of a one-query burst") is only
   half supported by their own data.** Even if all 12 "webdesign bayern" clicks sat inside the
   11-02 → 11-05 burst, the *other* clicks went from 14 in 16 days to 1 in 11 days (p ≈ 0.005–0.017,
   §2.2). The burst hypothesis explains 12 of 26 lost clicks, not 26.
2. **But "loss" is still the wrong word.** Against the repo's own history the 11 silent days are
   the normal state: 2 non-brand clicks in 28 days to 09-08; 1 non-brand click in the "prior
   comparable" window (11 of 12 brand); 9 clicks in 28 days to 10-21. The anomaly is the fortnight
   10-23 → 11-05 (26 clicks), not what followed it.
3. **New finding the analysts missed: impressions are flat across weekends (weekend/weekday
   ratio 1.04) while clicks are 89 % weekday.** For a B2B query set that is the signature of
   scheduled, non-human impression sources (rank trackers/scrapers). 46 % of listed impressions
   sit at average position > 50, i.e. results page 6+. Every CTR figure in 01, including the
   "internetagentur hotel" anomaly, has a contaminated denominator.
4. **The content audit's consolidation list contains the pages that earned 16 of the 27 clicks
   (59 %)**, including the single page with 44 % of all clicks. Implementing it is the most
   value-destructive recommendation in the set.
5. Arithmetic in 01 reproduces almost exactly. The numbers are right; several readings of them
   are too confident.

---

## 1 · Recomputation of 01 (all [RECOMPUTED])

| Item | 01 says | My value | Verdict |
|---|---|---|---|
| Totals | 27 clicks · 7,348 impr. · pos. 44.8 | 27 · 7,348 · 44.84 | match |
| Latest 7 d excl. 11-17 / previous 7 d | 1 · 1,526 · 46.9 / 12 · 1,697 · 54.1 | identical | match |
| 14 d vs 13 d | 13 · 3,223 · 50.7 / 14 · 3,975 · 40.6 | identical | match |
| Windows incl. 11-17 | 1/1,497 · 7/1,584 · 8/3,081 · 19/4,267 | identical | match |
| Query rows | 448 · 6,809 impr. · 14 clicks | 448 · 6,809 · 14 (file has 459 lines because 11 rows contain line breaks) | match |
| Page rows | 57, all apex | 57, host `cogniiq.de` only; page impressions sum to **7,510**, not 7,348 | match; 01's "top-5 pages 67.5 %" uses the 7,510 base without saying so |
| Country rows | 37 | **38** | trivial discrepancy |
| Position buckets | 12 / 705 / 799 / 2,140 / 3,153 | identical | match |
| Movement C test | p ≈ 0.0002; excl. burst p ≈ 0.02 | 0.00020; 0.0200 (impression-weighted), 0.0049 (day-weighted) | match — but see fragility below |
| Brand | 3 impr., 1 click | exact string "cogniiq": 3/1. Near-brand rows also exist: `cogniq ai` (1 impr., pos. 10), `cogniud` (2), `cogni` (1), `iq.cogniu` (1) | understated by ≤ 5 impressions; irrelevant in size |
| München family | 95 queries · 2,148 · 64.8 | 96 · 2,150 · 64.8 with `schwabing` | match |
| KI families | 932 impr. (13.7 %) | 934 with a `telefon\|anruf\|voice\|sprach` regex | match |
| Hotel family | 16 queries · 961 | 19 queries · 970 contain "hotel" (01 evidently puts the 3 `ki telefonassistent hotel`-type rows elsewhere) | consistent |

Fragile assumptions behind the statistics:

- **Post-hoc split.** 11-06 was chosen as the split because it minimises p. Scanning all 22
  candidate split days, 11-06 is the best (p = 0.0002), 11-07 second (0.0006). After a
  look-elsewhere correction (× ~20) the full-window test is still ≈ 0.004; the burst-excluded
  test (0.02 × 20) is not significant at all.
- **Independence.** Daily clicks are over-dispersed: variance/mean = 2.08 over 27 days, 1.55 in
  the pre-period. A Poisson/binomial model overstates significance by roughly that factor.
- **Expected-CTR curve.** 01 calls its curve "deliberately conservative". Back-solving its
  expected values gives 2.2 % at position 8.3, 1.5 % at 9.9, 2.8 % at 7.2. That is a 2019-style
  desktop curve, not a conservative 2026 one for commercial German SERPs with ads, local packs and
  (per 04, unverified) AI Overviews on > 50 % of keywords. Under a 1.3 % assumption at position 8
  `internetagentur hotel` has expected 4.0 clicks, P(0) = 0.018; under 0.6 % expected 1.8,
  P(0) = 0.17.
- **Multiple testing.** 16 queries qualify (position ≤ 20, ≥ 15 impressions; 01 tabulates 11).
  The smallest of 16 p-values being 0.001 is worth ≈ 0.016 after Bonferroni under 01's own curve,
  and nothing under a more pessimistic curve.
- **"KI money queries did not move between the 4 November reading and now"** (01 §7). The
  "11-04 reading" is `organic-growth-scoreboard.md:1590` — "GSC-Werte aus dem Auftrag", window
  not stated. `ki telefonassistent kosten` 18.40 then, 18.37 now. Two 28-day means that overlap
  by 14+ days (or are the same 3-month export) will agree to the decimal without proving
  stability. Meanwhile page impressions fell: `/ki-telefonassistent` 272 → 121 (−56 %),
  `/kosten-ki-telefonassistent` 299 → 210 (−30 %), `/ki-telefonassistent-arzt` 471 → 382 (−19 %)
  versus the 09-24 → 10-21 figures in `SEO_AUDIT_2026.md`. "Did not move" is true for average
  position on ≤ 110 impressions and false for impressions.

New measurements not in 01:

| Measure | Value |
|---|---|
| Mean impressions Sat/Sun vs Mon–Fri (27 full days, 8 weekend days) | 275 vs 263 → ratio **1.04** |
| Clicks on weekdays | **24 of 27 (89 %)**; expected 70 % if uniform; one-sided p ≈ 0.02 |
| Burst days 11-02 → 11-05 | Monday to Thursday of one working week |
| Listed impressions at average position > 50 / > 30 | 3,153 (46 %) / 4,417 (65 %) |
| Queries of ≥ 8 words or containing line breaks (LLM-prompt style, e.g. a 60-word "vergleiche könnerkreis …" instruction at position 1.0) | 12 queries, 43 impressions — direct evidence that machine-generated queries are in the data |
| Impressions for `prozessautomatisierung`, `prozessautomatisierung agentur`, `ki agentur`, `webdesign agentur`, any `… vergleich` / `… anbieter` query | **0 rows each** |
| `ki telefonassistent` (head term) | 28 impressions in 28 days, position 36.5 |
| Clicks on geo-modified URLs | 16 of 27 (59 %); geo URLs hold 47.8 % of page impressions |
| Clicks on `/`, `/ueber-uns`, `/impressum` | 6 of 27, at positions 9–11 with 88 impressions in total |

---

## 2 · Attack 1 — "Repository changes caused the click loss" (analysts: ≈ 15 %)

**CLAIM AS STATED.** 02 §9.2 T1: "CONFIDENCE that #105 caused the stop: **low (≈ 15 %)**";
02 §0 #1: "Last production change is PR #105 … Nothing has reached `main` since. Confirmed."

### 2.1 Strongest case that the release DID cause it

- Timing fits better than the analysts admit. Merge 2026-11-04 13:44 CET = 04:44 Pacific on
  11-04. GSC days are Pacific. Clicks 4 (11-04), 3 (11-05), then 0 for seven days. A 40–48 hour
  lag between deploy and effect is exactly what a recrawl of an 86-URL site produces. "Starts two
  days after the release" is an argument *for*, not against.
- The analysts' control argument ("the page that carried the clicks was not edited") covers 12
  clicks. The other 14 pre-stop clicks landed on pages the release did touch: `/` (homepage
  compaction tests changed, `AboutSection.tsx`), `/kosten-ki-telefonassistent` (pricing rewritten,
  description now leads with "990 € Einrichtung"), `/regensburg/ki-telefonassistent` (5 changed
  config lines), `/ki-telefonassistent-zahnarztpraxis`, `/ueber-uns`. [GIT: `git diff a6a54b5^1
  a6a54b5 --name-only`, 100 files, +5,672/−4,709.]
- `/muenchen/webdesign` itself was not byte-stable. Its own config block is unchanged
  ([GIT] `cfgdiff.py`: only 7 of 24 city blocks changed, München webdesign not among them), but
  its template `CityServicePage.tsx` was: the page's `<main>` wrapper became a `<div>`, three CTA
  class strings changed, and the sitewide nav, the `index.html` JSON-LD block (−162 lines) and the
  `x-default` hreflang changed. 02 says "not edited"; correct for head and copy, not for markup.
- "Last production change … Confirmed" is an overclaim. It is the last *repository* change. The
  live `robots.txt` carries a Cloudflare-managed block (AI-crawler disallows incl. `GoogleOther`
  and `Google-Extended`, `Content-Signal: search=yes,ai-train=no`) and Cloudflare email
  obfuscation rewrites every page [LIVE]. Neither is in git; neither has a date. Dashboard changes
  are an unlogged production channel the timeline cannot see. 02 itself rates merge = deploy at
  only ≈ 70 %.

### 2.2 The case that the premise "click loss" is wrong

- 28 days to 09-08: 14 clicks, of which 2 non-brand. "Prior comparable" window: 12 clicks, 11
  brand. 28 days to 10-21: 9 clicks. 28 days to 11-17: 27 clicks, 26 non-brand
  (`organic-growth-scoreboard.md:575-581`, `SEO_AUDIT_2026.md:49-56`).
- Post-stop rate: 1 click in 11 days ≈ 2.5 per 28 days = the historical non-brand rate.
- The 26-click fortnight is the outlier. It has three odd properties: a 3.97 % CTR at average
  position 28; 2 clicks from 5 impressions on `/webdesign-arzt-regensburg`; 6 clicks on
  `/`, `/ueber-uns` and `/impressum` — pages people open when checking out a company they already
  know of. That pattern fits a handful of people (prospects after outreach, acquaintances, one
  evaluator) better than it fits organic discovery. [ASSUMPTION — testable, see below.]

**EVIDENCE I CHECKED.** Merge time and diff [GIT]; per-city config diff [GIT]; daily series and
split scan [RECOMPUTED]; served JSON-LD today: `Organization`, `WebSite`, `LocalBusiness` present
in raw HTML on 10 of 10 fetched pages, so the "global JSON-LD removed" item is a de-duplication
in served output, not a removal [LIVE]. The FAQ accordion (answers not in DOM) predates the
shallow history start of 2026-08-26 (`git log -S` finds no later commit) and cannot be a
November cause [GIT].

**WHAT SURVIVES.** No mechanism in #105 plausibly removes rankings on an untouched-copy page
within 48 hours. Movement A (position worsening) starts 10-28, a week before the release. The
release is not the origin of the burst.

**WHERE EVIDENCE IS WEAK.** The pairing query → page is unproven; the composition of the 13
unlisted clicks is unknown; deploy time is inferred; nobody has a per-page daily series.

**RESIDUAL CONFIDENCE (mine).** Release #105 is the main cause of the post-11-05 silence: **10 %**.
It contributed to part of it (e.g. the cost-page snippet): **20 %**. The premise "a real organic
channel was lost" is false: **75 %**.

**CHEAPEST TEST.** GSC UI, 3 months, daily, page filter `/muenchen/webdesign`, then query filter
"webdesign bayern": five minutes. Plus the Cloudflare deployment list for 11-04.

---

## 3 · Attack 2 — "Google's core update caused the click loss" (analysts: < 10 %)

**CLAIM AS STATED.** 02 §9.2 T2: "very low (< 10 %) – the effect precedes the cause"; date from
04 §4: "November 2026 core update · 2026-11-10, 10:06 PT".

**STRONGEST COUNTER-ARGUMENT.** (a) The date is hearsay: a US web-search tool returning trade-press
URLs; the Search Status Dashboard was unreachable for every analyst and for me, and the event
post-dates my own knowledge. A four-day error would put the update on top of the click stop.
(b) Announced start dates are not effect start dates; pre-announcement volatility is routinely
reported, and 04 itself records unconfirmed volatility on 10-16 and 10-20/21. (c) Movement A — a
17-position worsening of the weighted mean between 10-28 and 11-05 with no repo change — is
exactly what "something on Google's side" looks like, and 02 leaves it unexplained.

**EVIDENCE I CHECKED.** Daily series only. On 11-10 → 11-16 the mean position improves (54 → 47)
and impressions stay ≈ 215/day. Nothing visible at the reported start.

**WHAT SURVIVES.** If the date is right, causation of the 11-06 stop is excluded by ordering. A
core update that removed a ranking would cut impressions on the affected query; site impressions
did not step on 11-06 (232 vs 228 the day before).

**WHERE EVIDENCE IS WEAK.** The date; the absence of per-query series; 04's AI-Overview
percentages are snippet-level and may be equally unreliable. 02 §9.1 prints the dates without
the proxy caveat in the table itself.

**RESIDUAL CONFIDENCE.** Core update caused the 11-06 stop: **5 %** given the reported date,
**15 %** unconditional on the date. An unannounced Google-side change contributed to movement A:
**30 %** — the analysts gave this no number at all.

**CHEAPEST TEST.** Owner opens `status.search.google.com` and reads the incident start time. One
minute.

---

## 4 · Attack 3 — "CTR is not the dominant problem; only `internetagentur hotel(s)` is a real CTR anomaly"

**CLAIM AS STATED.** 01 §5: "Only **one** query in the entire export has statistically abnormal
zero clicks: `internetagentur hotel`"; class "CTR PROBLEM (real)", "expected 6.8", "P(0) 0.001".
01 §8: "CTR PROBLEM | `internetagentur hotel` (certain)".

**STRONGEST COUNTER-ARGUMENT — the anomaly is an artifact.**

1. *Denominator.* Weekend/weekday impression ratio 1.04 on a B2B query set, 81 % desktop, 46 % of
   impressions at page 6+. A human reaches position 60–75 only by paging six times. The plain
   reading is that a large share of impressions is produced by rank trackers that run daily,
   desktop, seven days a week. "internetagentur hotel" is precisely the kind of phrase a hotel-web
   agency tracks. 309 impressions in 28 days (11 per day) for a query that awkward exceeds any
   plausible human demand. [ASSUMPTION on search volume; the weekday test is measured.]
   If 30 % of the 309 impressions are human, P(0) = 0.13 under 01's own curve; at 20 %, 0.26.
2. *Curve.* See §1: under a 1.3 % position-8 CTR P(0) = 0.018; under 0.6 % it is 0.17.
3. *Position averaging.* 8.3 is a mean over days, devices and countries. Italy has 111
   impressions at 12.4 and Germany carries the rest; no Südtirol/Italy term appears in the query
   list, so the Italian impressions are on ordinary German-language queries, plausibly these.
4. *Multiple testing.* ≈ 0.016 after correction even on 01's terms.
5. *04 contradicts 01 on the same query.* 04 §6 lists position "(~18)" for
   `internetagentur hotel` and calls the main constraint a "query-mix artifact / intent mismatch";
   01 has it at 8.3 and calls it certain CTR. 04 was written from older repo docs and never
   reconciled.

**COUNTER-ARGUMENT IN THE OTHER DIRECTION — CTR may be worse than stated.** `/webdesign-hotel`
(995 impr., 14.85) and `/regensburg/website-relaunch` (210, 9.85) have zero clicks at page level
too, and the title of `/webdesign-hotel` ("Webdesign für Hotels | Internetagentur für Hotellerie")
answers an agency-seeking query with a page that has zero hotel proof and zero images [LIVE: 0
`<img>` on all 10 pages fetched]. If the impressions are human, the snippet is losing.

**WHAT SURVIVES.** The classification rule is right and must be kept: zero clicks at positions
13–19 on < 150 impressions is a RANKING state, not a CTR failure. 77 % of impressions beyond
position 20 is a ranking diagnosis. Nothing in the export supports a title rewrite on the KI cost
queries.

**WHERE EVIDENCE IS WEAK.** "certain" for `internetagentur hotel`. It is the best CTR *candidate*,
not a certainty. The whole expected-CTR table presumes human impressions.

**RESIDUAL CONFIDENCE.** Ranking, not CTR, is the dominant constraint: **90 %**.
`internetagentur hotel` is a genuine snippet/CTR failure on human impressions: **35 %**.
A material share (> 30 %) of all impressions is non-human: **65 %**.

**CHEAPEST TEST.** GSC query filter "internetagentur hotel": Devices, Countries, Dates tabs. If
impressions are ≈ constant per day including weekends and ≥ 90 % desktop, it is tracker traffic and
the CTR case is void. If the daily position series shows real page-one days with mobile
impressions, it stands. One incognito google.de screenshot settles the SERP layout.

---

## 5 · Attack 4 — "Cogniiq has enough content already"

**CLAIM AS STATED.** 06 §5: "34 URLs (40 %) are candidates for removal from the index in one form
or another"; "Do not write new pages until at least one first-party artefact exists"; 06 §1:
"39 of 86 = 45 % of the indexable site" geo-modified.

**STRONGEST COUNTER-ARGUMENT.**

- *The classification is taste plus similarity scores, not harm evidence.* 06 says so itself
  ("low on the causal link to rankings", "cannot tell you whether any of this currently suppresses
  rankings") and then orders the removal anyway as steps 3–4. No page in the list is shown to hurt
  another page. No query × page data exists.
- *The click evidence points the other way.* 16 of 27 clicks land on geo URLs. `/muenchen/webdesign`
  (12 clicks, 2,434 impressions, 32 % of all impressions) is a **CONSOLIDATION CANDIDATE**
  (06 line 417). `/regensburg/ki-telefonassistent` (2 clicks at position 17, above expectation per
  01) is a CONSOLIDATION CANDIDATE. `/webdesign-arzt-regensburg` (2 clicks) is a CONSOLIDATION
  CANDIDATE. The three page-one assets of the domain — `/webdesign-hotel`,
  `/regensburg/website-relaunch`, `/regensburg/webdesign-kosten` (position 3.7) — are all
  template geo/industry pages. The nine "pages a searcher would be glad to have found" earned
  3 clicks between them (`/kosten-ki-telefonassistent` 2, zahnarzt 1; flagship 0).
- *There is a real gap.* 05 finds four intents with no owner (vergleich, anbieter,
  prozessautomatisierung agentur, dsgvo/schnittstelle); two of the relevant pages exist and are
  held at `noindex, nofollow` [LIVE: `/integrationen`, `/datenschutz-sicherheit`]. "More pages are
  not the constraint" and "four commercial intents have no page" cannot both be the whole truth.

**COUNTER-COUNTER.** The gap is unproven as *demand on this domain*: the export has zero
impressions for any vergleich/anbieter query and zero for `prozessautomatisierung agentur`. That
is what "no owner" predicts, so it neither confirms nor refutes demand. And the click-earning geo
page earns clicks for a low-priority query at a CTR that does not look organic.

**WHAT SURVIVES.** FAQ answers missing from the DOM [LIVE: 8/8 on `/`, 8/8 on `/faq`, 11/11 on
`/muenchen/webdesign`, 9/9 on `/regensburg/website-relaunch`, 7/7 on `/webdesign-hotel`, 11/13 on
`/ki-telefonassistent`; 0 missing on the cost page and the pillar]. Unsupported local claims are
a honesty problem regardless of ranking. Not multiplying city × service pages further is sound.

**WHERE EVIDENCE IS WEAK.** Any causal statement that the template layer suppresses the strong
pages. 06's own falsifier requires doing the consolidation to find out — an irreversible
experiment on the only traffic-bearing pages.

**RESIDUAL CONFIDENCE.** "More pages are not the binding constraint": **70 %**. "The 34
candidates hurt the domain today": **20 %**. "Removing them would cost measurable clicks and
impressions in the short term": **80 %** (they carry 59 % of clicks and ≈ 48 % of impressions).

**CHEAPEST TEST.** GSC Pages export, 3 months: list every candidate URL with its clicks and
impressions. Any candidate with ≥ 1 click or ≥ 50 impressions leaves the list until query × page
exists. Do not test by deleting.

---

## 6 · Attack 5 — "External authority / brand is a major constraint"

**CLAIM AS STATED.** 07 §1: "this is the binding constraint — more than text volume, architecture
or on-page optimisation"; 07 §5 confidence "High"; 01: "Brand … 3 impressions, 1 click".

**STRONGEST COUNTER-ARGUMENT.**

- *Nothing was measured.* 07 says so ("backlinks, referring domains … cannot be measured from
  here") and still rates the synthesis High. Absence of `sameAs` and of images is evidence about
  the website, not about the link graph. "No trace in the repo" of directory work is not evidence
  of no links.
- *The domain ranks where competition is thin.* `internetagentur hotel` 44.7 → 8.3 and
  `internetagentur hotels` 44.0 → 9.9 in ten weeks; `/webdesign-hotel` 36.0 → 14.85;
  `/regensburg/webdesign-kosten` position 3.7; `/regensburg/website-relaunch` 9.85. No authority
  event is known in that period. A domain capped by authority does not move 36 positions on a
  title match. That is relevance/competition-limited behaviour.
- *Brand is not 3 impressions.* Six clicks on `/`, `/ueber-uns`, `/impressum` come from unlisted
  queries at positions 9–11 — almost certainly name/brand-type navigational searches that GSC
  anonymises. Earlier windows had 18 brand impressions and 5 brand clicks in 28 days. Brand demand
  is tiny, but the "3" is a floor produced by anonymisation, and 02/07 should not quote it as a
  measurement of demand.
- *Founding date ≠ domain age.* `foundingDate` 2025-10-15 is a schema value; the first-indexed
  date of the domain is not in any document.

**WHAT SURVIVES.** Zero non-text proof on the site is a fact (0 `<img>` on every page I fetched;
no `sameAs`, no `aggregateRating` [LIVE]). On competitive head terms (`ki telefonassistent` 36.5,
`webdesign münchen` 72) the domain is nowhere, and those are the queries where links and brand
decide. Lack of proof is very likely a *conversion* constraint whatever it does to ranking.

**WHERE EVIDENCE IS WEAK.** The word "binding". The data cannot separate authority from relevance,
quality or SERP format.

**RESIDUAL CONFIDENCE.** Authority/brand is *a* major constraint on competitive head terms:
**65 %**. It is *the* binding constraint sitewide: **35 %**. Proof assets would lift conversion
of existing visits: **75 %** (unmeasurable at 27 clicks).

**WHAT WOULD DISCRIMINATE (owner-obtainable).**

| Data | Authority-limited predicts | Relevance/quality-limited predicts |
|---|---|---|
| GSC → Links → Top linking sites (count of referring domains) | < 10 domains, mostly directories | a normal small-business profile (30+) with rankings still at 30–70 |
| Position by query competitiveness (3-month query export) | top-10 only on queries without commercial competitors; flat 30–70 on all contested terms regardless of page quality | positions track page fit: exact-intent pages rank, mismatched ones do not, also on contested terms |
| URL Inspection on 10 priority URLs | all indexed, canonical self | "Crawled – currently not indexed" or Google-selected canonical differs |
| After one proof asset on the flagship, no link work (28 d) | no position change | position gain on `ki telefonassistent …` |
| After 5 relevant referring domains, no page change (56 d) | broad lift across clusters | no change |

---

## 7 · Attack 6 — "A KI comparison page would add distinct information gain"

**CLAIM AS STATED.** 04 §8: "A criteria + category + test-protocol page offers information gain
… it may still not rank for 'vergleich' because the query appears to reward enumerated vendor
lists", confidence low–medium; "the higher-leverage route … is being listed in the existing
third-party comparisons".

**STRONGEST COUNTER-ARGUMENT.**

- *Zero observed demand.* No query containing `vergleich`, `anbieter`, `beste`, `erfahrungen`
  about telephone assistants has a single impression in 448 rows (the regex hits are
  `ki telefonassistent testen` at 66 and unrelated strings). 04's own SERP evidence is a US proxy
  without German ranking order, and the competitor pages were never opened ("snippet-level only").
  The format analysis rests on titles the tool itself mangled.
- *It duplicates what exists.* The proposed three components already have owners: the buyer's
  test protocol → `/ki-telefonassistent-einfuehren`; cost normalisation → the calculator and the
  H2 "Wie KI-Telefonassistenten am Markt abgerechnet werden" on `/kosten-ki-telefonassistent`;
  provider questions → the flagship's "Sechs Fragen". A new URL would be a fourth page on the
  same material — the practice-trio problem 05 complains about, created on purpose.
- *It collides with the repo's rules.* `.claude/rules/seo-public-site.md`: a new indexable page
  "must do a distinct job and carry information a generic summary of page one could not produce";
  "no keyword-variant landing pages"; claims about prices and integrations are
  `BLOCKED — EVIDENCE` without proof. `ARCHITEKTUR.md:156` records "KI Telefonassistent
  Vergleich" as "nicht verfolgt". A category comparison without competitor prices is a page whose
  target query it cannot honestly satisfy; one with competitor prices is blocked.
- *The authority premise cuts against it.* If 07 is right that the domain lacks trust, a
  vendor-authored comparison is the page type for which trust matters most.
- *The "get listed" alternative is equally unevidenced.* No analyst opened OMR, Dr. Web or
  hosttest; listing criteria, cost and whether a sole proprietor with no public customer
  qualifies are unknown.

**WHAT SURVIVES.** "Do not build a self-ranking listicle" — unbreakable. The page as
sales-enablement (not SEO) may be useful; that is a different decision with a different metric.

**RESIDUAL CONFIDENCE.** A new comparison URL would rank top-20 for a vergleich/anbieter query
within 90 days: **10 %**. It adds information not already on the site: **25 %**. Strengthening
the existing "Sechs Fragen" section beats a new URL: **70 %**.

**CHEAPEST TEST.** One incognito google.de screenshot each for `ki telefonassistent vergleich` and
`… anbieter`. If page one is only enumerated vendor lists, the format cannot rank and the idea is
closed for SEO. Zero build cost.

---

## 8 · Competing explanations (owner-mandated)

| | Explanation | Supporting evidence | Contradicting evidence | Confidence | Data that would settle it |
|---|---|---|---|---|---|
| **A** | Cogniiq suffered a sitewide ranking loss | Weighted position 38 → 55 between 10-28 and 11-05; impressions/day 316 → 217 (wk 44 → 46); flagship impressions 272 → 121 vs the prior window; daily impressions and daily position correlate at −0.45 (days with fewer impressions have a worse mean position), which fits losing shallow impressions rather than gaining deep ones and runs against 01's query-mix reading of movement A | Hotel queries gained 36 positions; KI cost terms flat at 18; total impressions +14 % vs the previous 28-day window; position recovered to 46 by 11-16 without any change; no step on any single day; 65 % of impressions sit beyond position 30, so the mean is a mix statistic | **10 %** | 3-month daily export with query filter on 10 fixed queries; compare-mode 28 d vs previous 28 d |
| **B** | The November core update caused the initial click collapse | Unexplained movement A; update dates are second-hand | Clicks stop 11-06, reported start 11-10; no step in impressions or position on 11-10 | **5 %** (15 % if the date is unverified) | Search Status Dashboard start time; post-rollout 7-day comparison |
| **C** | October/November repository changes caused the collapse | 40–48 h lag fits a recrawl; 100 files changed; cost-page snippet now leads with a higher set-up price; template markup of the click page changed | No October production change at all (34 quiet days before 11-04); click page's head and copy untouched; burst began two days *before* the release; position drift began a week before | **10 %** main cause · **20 %** partial contributor | Cloudflare deployment log; per-page daily series for the 22 changed URLs vs 4 untouched ones |
| **D** | Traffic only looked stronger because one low-priority query produced a temporary burst | 12 of 14 listed clicks are one query; 15 of 27 clicks in 4 weekdays; 3.97 % CTR at position 28 is not an organic pattern; historical non-brand baseline is 1–2 clicks per 28 days | The burst as defined explains at most 12 clicks; 14 other clicks also vanished after 11-05 (p ≈ 0.005–0.017 before look-elsewhere correction); whether the 12 clicks fall in the burst days is unverified | **45 %** as literally stated (one query) · **75 %** in the wider form "10-23 → 11-05 was an anomalous fortnight driven by a few actors/queries" | Query-filtered daily chart for "webdesign bayern"; page-filtered query list for `/`, `/ueber-uns`, `/impressum`; the owner's own outreach calendar for that fortnight |
| **E** | The real problem is weak, undiversified rankings/authority across commercial queries | 77 % of impressions beyond position 20; priority-1 cluster has 15 page-one impressions in 28 days; head term at 36.5; zero impressions for the priority-2 head terms; one query = 86 % of listed clicks | "Authority" as the cause is unmeasured; low-competition terms rank fine | **95 %** for the descriptive half (rankings weak and undiversified) · **50 %** that authority is the main reason | GSC Links report; URL Inspection; the discrimination table in §6 |

D and E are compatible. A, B and C all assume there was something to lose; the history says
there was not. One open point against the analysts: 01 §6 explains movement A as "more
deep-position impressions served". The −0.45 correlation says the opposite direction (fewer
impressions on the worse-position days). Movement A is therefore unexplained, not explained.

---

## 9 · The KI-Telefonassistent diagnosis, attacked separately

**Analysts' position.** 01: head and practice terms at 30–40 are a RANKING problem, cost terms at
15–22 likewise. 04 C1: result-type mismatch (multi-vendor comparisons rewarded). 07: no proof is
"the binding constraint". 06: flagship and cost page are KEEP-quality. These four cannot all be
the main reason, and no document ranks them.

**Why is `/ki-telefonassistent` at 33–36 while `/kosten-ki-telefonassistent` is at 17.5?**
Facts: flagship page 121 impressions, position 32.8; head query 28 impressions, 36.5. Cost page
210 impressions, 17.5, 2 clicks; cost query 110 impressions, 18.4. Both live on the same domain
with the same authority, the same absence of proof, zero images each, and comparable length
(5,385 vs 4,673 words in served HTML [LIVE]).

That comparison already eliminates some candidates:

| Candidate constraint | Verdict from the within-domain comparison | What would discriminate further |
|---|---|---|
| Domain authority / links | Cannot explain an 18-position gap between two pages of one domain. It can explain why *neither* is top-10. | GSC Links → per-page linking sites for both URLs |
| Brand demand | Same for both pages; not a differentiator | — |
| Proof / trust | Same for both pages (none); not a differentiator. May cap both | Add one proof asset to one page only, hold the other |
| Relevance / intent fit | **Leading candidate.** The cost page has an exact-match title ("Was kostet ein KI Telefonassistent? Preise") for a narrow informational query; the flagship ("KI Telefonassistent für Unternehmen – Anrufe erledigen") competes for a head term where product vendors (fonio, IONOS, Placetel, Parloa per 04) hold the SERP with product pages | Incognito SERP for both queries: count vendor product pages vs agency/service pages on pages 1–3 |
| Competition / SERP format | **Co-leading.** Head terms attract every vendor; long-tail cost terms attract fewer strong pages | Same screenshots; Keyword Planner competition level |
| Information gain | The cost page carries a real price list, calculator and `Offer`/`UnitPriceSpecification` markup [LIVE]; the flagship's distinct information is method and limits. Plausible secondary factor | Compare which passages Google quotes in the snippet for each |
| Internal cannibalisation | Unproven. Four geo phone pages share the head intent (05 §1.1); `/muenchen/ki-telefonassistent` sits at 20.5 and `/regensburg/ki-telefonassistent` at 17.3 — both *better* than the flagship. Either they are winning the flagship's queries or they rank for city variants only | Query × page for queries without a city modifier |
| FAQ answers hidden | Flagship: 11 of 13 answers absent from the DOM; cost page: 0 of 10 absent [LIVE]. A real asymmetry that matches the ranking asymmetry. Small sample of one pair | Render the flagship answers; nothing else changes for 28 days |
| Measurement | 28 impressions. Position 36.5 on 28 impressions, probably mostly tracker-generated, is not a stable estimate | 3-month export |

Reading: the within-domain gap is about intent fit, competition level and possibly the hidden FAQ
text; the across-the-board absence from the top 10 is where authority and proof may apply. 07's
"binding constraint" claim is not supported for the gap, and 01's flat "RANKING PROBLEM" label
says nothing about *why*. The single cleanest experiment available without new content is the FAQ
rendering fix on the flagship alone.

Also unaddressed by all analysts: the practice cluster's best asset by position is
`/ki-telefonassistent-zahnarztpraxis` (11.95, 112 impressions, 1 click) — a narrow-intent page,
consistent with the relevance reading and not with a domain-wide authority cap.

---

## 10 · Internal contradictions between the seven documents

| # | Contradiction | Where |
|---|---|---|
| 1 | `internetagentur hotel` position "~18" with main constraint "query-mix artifact / intent mismatch" vs position 8.3, "CTR PROBLEM (certain)" | 04 §6 vs 01 §5/§8 |
| 2 | Same for `webdesign hotel` "(~18)" vs 13.4; `ki telefonassistent kosten` "~19" vs 18.4; relaunch pair "~136 impressions" vs 125 | 04 §6 vs 01 |
| 3 | FAQ: 70 pages with `FAQPage`, 46 fully missing vs 68 pages, 45 fully missing, 395 answers | 03 D1 vs 06 §1 |
| 4 | `/ki-telefonassistent` partial FAQ: "10/13" missing (03) vs my count 11/13 | 03 D1 |
| 5 | Average position "~36" used as the current state vs 44.8 | 06 §5 vs 01 §1 |
| 6 | Pricing rewrite and Arzt rebuild dated "2026-10-23/24" as if live then vs "not in production until 11-04" | 03 §1 and D3 vs 02 §0 #5 |
| 7 | "Last production change … Confirmed" vs "merge = deploy ≈ 70 %" in the same document; Cloudflare-side changes exist outside git | 02 §0 #1 vs 02 §2, 03 O12 |
| 8 | Route counts: "92 manifest routes, 89 indexable" (historical row) vs 89 routes / 86 indexable everywhere else — unlabelled as historical where quoted | 02 §3.3 vs 03, 05, 06 |
| 9 | Audit host: 03 and 04 fetched `www.cogniiq.de`; 01/02/05 treat apex as the site. Harmless (identical bodies) but 04's "[LIVE-FETCH] from www" titles are from the secondary host | 03 App., 04 §0 |
| 10 | "steady state before and after is ≈ 0–1 non-brand click per day" vs the same document's 11 clicks in 12 days before and 1 in 11 after | 01 §4 vs 01 §2 |
| 11 | "KI money queries did not move" vs flagship impressions −56 % | 01 §7 vs `SEO_AUDIT_2026.md` figures quoted in 02 App. A |
| 12 | 07: proof is "the binding constraint"; 04 C1: result-type mismatch; 06: template layer "is what the domain is being judged on"; 02/01: no cause assignable. Four different primary diagnoses, never reconciled | 04, 06, 07 |
| 13 | 06 recommends consolidating pages that 01 shows carry 59 % of clicks; 01 recommends "No site change" | 06 §5 vs 01 §4 |
| 14 | 05 recommends title/H1 edits "regardless of the export"; 02 §9.2 forbids changes inside the core update and demands one hypothesis per deploy | 05 §1.1, §3.5 vs 02 §9.2/9.4 |

**Query → page pairing stated as fact (owner constraint 2).** 01 §3 says the pairing is
"near-certain (not proven: no query × page)" — acceptable. 02 §9.2 says "**presumed**" —
acceptable. But 01 §4 then builds on it without the qualifier ("a short click burst on one
low-priority query"), 02 §9.1's table states "burst starts 2 days before the release" as if the
burst *were* that query, and 01 §8 never lists the pairing among its unknowns. No document states
it flatly as fact; several reason from it as if it were. My independent check: München web
queries (78 rows, 1,922 impressions, position 67.8) plus "webdesign bayern" (302 at 28.3) give
2,224 impressions at **62.45**; the page reports 2,434 at **62.08**. Without that query the page
mean would be ≈ 67. No other listed page has ≥ 12 clicks, and no `/bayern` URL has more than one
impression. That raises the pairing to roughly **90 %** — still a hypothesis. It says nothing
about *when* the 12 clicks happened; "the burst is that query" remains at about **60 %**.

---

## 11 · Conclusions stated with more confidence than 27 clicks allow

| Statement | Document | Problem |
|---|---|---|
| "`internetagentur hotel` (certain)" | 01 §8 | One query, zero events, curve and denominator both unverified |
| "p ≈ 0.0002" for the click stop | 01 §2 | Post-hoc split, over-dispersed counts; honest range 0.004–0.02 |
| "`/kosten-ki-telefonassistent` … and `/regensburg/ki-telefonassistent` perform *above* expectation" | 01 §5 | Two clicks each |
| "impressions −42 %, clicks +93 %, CTR ×3.4" | 01 §1 | 14 → 27 with 12 from one query; percentage language on counts this small misleads |
| "The latest window is the best click window on record" | 01 §7 | True and meaningless: three windows, one query |
| "brand demand ≈ none, falling" (18 → 3) | 01 §7 | Low-volume brand queries are anonymised; 6 clicks on navigational pages suggest otherwise |
| "Nine URLs — 10 % of the indexable site — are content a searcher would be glad to have found" | 06 §5 | An editorial judgement presented as a count; those nine earned 3 clicks |
| "CONFIDENCE. High." for "the site has reached the ceiling of what honest copy can do" | 07 §5 | No backlink data, no conversion data, no experiment |
| "the release cannot be its origin" (movement A) | 02 §9.1 | Sound on ordering, but movement A itself is a mix statistic on tracker-heavy impressions and may not be a ranking movement at all |
| "A sitewide ranking loss on the KI cluster after 11-04 [is ruled out]" | 02 §9.3 | Rests on four queries with 28–110 impressions and a comparison value of unknown window |
| AI Overviews "> 50 % of German keywords" as context for zero clicks | 04 §5 | Snippet of a secondary source; not observed for any Cogniiq query |

---

## 12 · Live spot-checks of 03 and 06 [LIVE, 2026-11-20]

| Claim | Result |
|---|---|
| Canonical host = apex; `www` answers 200 (not redirected) | **Confirmed.** `https://www.cogniiq.de/` → 200; canonical on all 10 fetched pages is `https://cogniiq.de/…`. Closed as a cause; cleanup only |
| Zero `<img>` in served HTML | **Confirmed** on 10 of 10 pages |
| FAQ answers only in JSON-LD | **Confirmed** on `/`, `/faq`, `/muenchen/webdesign`, `/webdesign-hotel`, `/regensburg/website-relaunch`; **not** on `/kosten-ki-telefonassistent`, `/prozessautomatisierung` (0 missing) |
| `/integrationen`, `/datenschutz-sicherheit` are `noindex, nofollow` with self-canonical | **Confirmed** |
| `/cdn-cgi/l/email-protection` → 404, linked from every page | **Confirmed** (404; link present on 10 of 10) |
| Unknown URL → real 404 | **Confirmed** |
| Sitemap 86 URLs; 65 with `lastmod` 2026-03-14 | **Confirmed** (86; 65) |
| `x-default` only on `/` | **Confirmed** |
| No `sameAs`, no `aggregateRating` | **Confirmed** |
| Global JSON-LD "removed from every page" on 11-04 (02) | **Misleading.** `Organization`, `WebSite`, `LocalBusiness` are in the raw HTML of every fetched page today. The release removed a duplicate source, not the served schema |
| `/muenchen/webdesign` not changed on 11-04 (02) | **Confirmed for head and copy; false for markup** (`<main>` → `<div>`, CTA classes, sitewide blocks) |

03 survived every check I ran. Its one soft spot is dating content changes by commit instead of
deploy (contradiction 6).

---

## 13 · The three most dangerous recommendations

1. **06 §5 steps 3–4: consolidate/noindex the 34 candidates, industry × city and city micro pages
   first.** The list includes `/muenchen/webdesign` (44 % of clicks, 32 % of impressions),
   `/regensburg/ki-telefonassistent` and `/webdesign-arzt-regensburg`. Candidates carry 16 of 27
   clicks. There is no evidence any of them harms another page. 301s are slow to reverse and
   would erase the only before/after baseline the domain has. 06's falsifier ("consolidate, then
   see whether the strong pages move") is the experiment and the damage in one step.
2. **05 §1.1 and §3.5: change the München H1 and strip "Website erstellen & SEO" from the three
   `/{stadt}/webdesign` titles "regardless of / independently of the export".** That edits the
   title of the only click-earning URL, with no query × page data, inside an unfinished core
   update, 16 days after a release that already changed 22 heads at once. It would make the
   11-04 release permanently unmeasurable and risks the one ranking that produced clicks.
3. **Any CTR-driven rewrite of `/webdesign-hotel` or the hotel title on the strength of the
   "certain" CTR anomaly (01 §8), and any rollback of the Regensburg title (02 T3, correctly
   deferred there).** The anomaly may be tracker impressions; the page moved 36 positions on its
   current title. A rewrite trades a measured ranking gain for a hypothetical CTR gain on a
   priority-3 topic.

Runner-up: building the comparison page (04 §8) before a single SERP screenshot exists — low
destruction, high waste, and a rule violation.

Not dangerous but worth stating: 07's "freeze copy work on priority-1 pages" would also freeze the
FAQ-rendering fix on the flagship, the one cheap change with a measurable hypothesis.

---

## 14 · The three findings I could not break

1. **The dataset is too small and too concentrated to support any causal story about November.**
   27 clicks, 12 from one query, 15 on four days, no query × page, no previous period. Every
   attack I made on a causal claim succeeded for that reason; every attack on this statement
   failed. The analysts' "no site change, get the exports first" (01 §4) stands.
2. **There is no technical cause.** Status codes, canonicals, robots, sitemap, noindex set,
   redirects and prerendered content all check out live; no indexability change exists in git;
   the FAQ defect predates the window. 03's verdict stands, including the closed host question.
3. **The business-priority inversion is real and is a ranking problem.** KI-Telefonassistent holds
   13.7 % of listed impressions with 15 at page one in 28 days; Prozessautomatisierung head terms
   have zero impressions; ≈ 80 % of visibility is priority-3 webdesign, most of it at page 6+.
   Whatever the denominator contamination, no reading of the export puts priority 1 or 2 on page
   one.

---

## 15 · Requests to the owner, in order of information per minute

1. GSC UI, last 3 months, daily: (a) query filter "webdesign bayern"; (b) page filter
   `/muenchen/webdesign` → Queries; (c) page filters `/`, `/ueber-uns`, `/impressum` → Queries.
2. GSC query filter "internetagentur hotel" → Devices, Countries, Dates.
3. `status.search.google.com` incident start time for the November core update.
4. Cloudflare Pages production deployment list (SHA, time, status) and the date the managed
   `robots.txt` / AI-bot setting was enabled.
5. GSC → Links → Top linking sites (export).
6. Incognito google.de screenshots: `ki telefonassistent`, `ki telefonassistent kosten`,
   `ki telefonassistent vergleich`, `internetagentur hotel`.
7. Whether outreach, a mailing, or any personal sharing of the site happened between 10-23 and
   11-05.

No site change is justified before items 1–3 are in hand.
