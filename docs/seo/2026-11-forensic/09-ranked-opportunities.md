# 09 · Ranked opportunities (2026-11-20)

Research and plan only. Nothing here is implemented. Inputs: `01`–`08` of this folder.

## 0. How to read the scores

`Score = Business impact × Search opportunity × Evidence confidence ÷ Effort`

| Factor | Scale | Meaning |
|---|---|---|
| Business impact (B) | 1–5 | 5 = KI-Telefonassistent revenue · 3–4 = Prozessautomatisierung · 1–2 = Webdesign; +1 if the action lifts the whole domain |
| Search opportunity (S) | 1–5 | demand that exists in the export × ranking proximity (4–10 with a CTR anomaly and 11–20 commercial score highest; position 30+ scores low however attractive the keyword) |
| Evidence confidence (E) | 0.1–1.0 | how well the diagnosis behind the action is supported; capped at 0.5 where it rests on the proxy SERP or on unmeasured backlinks |
| Effort (F) | 1–5 | 1 = hours · 3 = days · 5 = weeks or dependent on third parties |

The scores rank; they do not forecast. With 27 clicks in 28 days no click forecast is honest.
The plan is capped at **3 P0, 5 P1, 5 P2/P3**. Everything else found by the investigations is in
§5 "discarded".

Action types: **CODE** (repository change) · **CONTENT** (repository change that needs real
substance) · **OFF-SITE** (authority; cannot be done in source files) · **OWNER** (evidence or
decision only the owner has).

## 1. The diagnosis the ranking rests on

| Problem type | What belongs here | Evidence |
|---|---|---|
| **RANKING** (dominant) | 77 % of impressions at position > 20. KI head and practice terms 30–40; KI cost terms 15–22; hotel terms other than "internetagentur" 13–19; Prozessautomatisierung ≈ 40 with almost no impressions; München/cost webdesign 60–75 | `01` §5, §6 |
| **CTR** (one candidate) | `internetagentur hotel` (309 impr., pos. 8.3, 0 clicks) is the main anomaly, but only ≈ 35–60 % likely real: P(0) ranges 0.001–0.17 depending on the assumed CTR, and part of the impressions may be rank-tracker traffic (`08`). Plural and Regensburg relaunch pair weaker. Positions 13–19 with small samples are **not** CTR failures | `01` §5 |
| **TECHNICAL** (no causal defect) | FAQ answers in JSON-LD but not in the HTML on 45–46 pages; minor hygiene. Canonical host is the apex and consistent – closed. No defect explains any traffic movement | `03` |

Beneath the ranking problem: no evidence of delivered work on the site, almost no brand demand
(3 impressions), a young entity, 45 % geo-modified URLs against one address. Backlinks were
**not measured**; "authority" is inferred, not observed.

## 2. KI-Telefonassistent — the specific questions

**Why is `/ki-telefonassistent` in the 30s, not the top 10?**
Page: 121 impressions, pos. 32.8; query "ki telefonassistent": 28 impressions, pos. 36.5;
unchanged since at least 4 November.

| Candidate constraint | Evidence for | Evidence against / missing | Weight |
|---|---|---|---|
| Result-type and entity fit | Proxy SERP: roughly half multi-vendor lists (OMR, Dr. Web, it-daily, zeeg), half SaaS vendors with self-service product, trial and public pricing. Cogniiq is a done-for-you service by an unknown provider | German SERP not observed (LOW confidence) | high |
| Proof and trust | Zero customers, recordings, screenshots, reviews, case studies on the site; no image, audio or video on any page; founder bios duplicated; entity founded 2025-10 | Causal link to ranking unproven | high |
| External authority / links / brand | 3 brand impressions in 28 days; no `sameAs`; none of ~20 planned off-site actions has a trace | **No backlink data at all**; hotel queries rose 44 → 8 without any known authority change, so authority is not a universal ceiling on this domain | medium–high, unverified |
| Internal signal dilution | Each city phone page receives more exact-match anchors (32–33) than the flagship (30); München H1 ≈ flagship H1; nine industry × city H1s append "& KI-Telefonassistent"; three practice pages overlap | No query × page data → cannibalisation unproven | medium |
| Content relevance | Page is on-topic, rebuilt 09-12 with clean head, SSR, indexable | – | **not** the constraint |
| Age of current version | Rebuilt 09-12, sitewide changes again 11-04 | Ten weeks is enough for re-evaluation | low |

Most probable reading: a **combination of entity trust/proof and external authority on a head
term whose page one is held by publishers and funded vendors**, aggravated by internal dilution.
Not relevance. Confidence: medium–low, because the two heaviest factors (German SERP, backlinks)
were not observed.

**Why does `/kosten-ki-telefonassistent` perform materially better (page pos. 17.5, 210
impressions, 2 clicks; "… kosten" 18.4, "… preise" 14.6)?**
It is the one KI page where Cogniiq has genuine information gain: binding public tariffs, a
calculator, stated limits, a net/VAT statement – classed "present and strong" in `07`. The
intent is narrower, the competing set thinner, and a page that actually states prices matches
the query better than most vendor pages that hide them. It is also the page with a unique job:
no sibling competes for it. This is the template for what works on this domain: **a single owner
page with first-party specifics on a long-tail commercial intent.**

**What separates the German top 10 from Cogniiq?** (proxy evidence, LOW confidence)
Known brand or publisher; enumerated comparison with counts and year; self-service trial or free
minutes; lower visible entry prices ("ab 27/39/99 €" against Cogniiq's "ab 300 €"); third-party
reviews (OMR Reviews); visible product media. Cogniiq's differentiators – done-for-you setup,
practice-specific rules, stated limits – are real but appear in neither title nor snippet in a
form a searcher can compare.

**Which changes have the highest probability of moving commercial KI queries upward?**

1. Real proof on the flagship and cost page: a callable demo line or genuine call recordings,
   one consenting reference with numbers, product screenshots (OWNER → CONTENT). → P0-2
2. Presence in the third-party comparisons that already hold page one, plus entity basics
   (Google Business Profile, `sameAs`, review profile) (OFF-SITE). → P1-1
3. Make the 10,700 words of FAQ answers part of the delivered page instead of markup only
   (CODE). → P0-3
4. Deepen the cost page – the nearest KI page to page one – with a cost-normalisation method
   across billing units (CONTENT). → P1-2
5. Concentrate internal signals on one owner per KI intent (CODE/CONTENT, gated on query × page
   data). → P1-3

**Which require repository changes?** 3, 4, 5, and the placement part of 1.
**Which require owner or business action that cannot be manufactured in code?** The existence
of customers, consent, recordings, reviews, listings, links and brand demand – 1 and 2 entirely.
Without them the repository changes polish a page that still has nothing verifiable to show.

**Would a genuine `/ki-telefonassistent-vergleich` resource create distinct search value?**
As a "best N providers" list: **no** – the most saturated page type in the space, structurally
biased, dependent on competitor prices Cogniiq cannot verify, and contrary to the repo's own rule
against pages without a distinct job. As a category comparison with a buyer's test protocol and a
cost-normalisation method: **distinct information, but uncertain search value** – it may be the
wrong result type for "vergleich"/"anbieter", which appear to reward enumerated lists. It is a
P2 item, justified first as a sales asset, and only after proof exists (P0-2). Being listed in
existing comparisons (P1-1) is the stronger route to those queries.

## 3. Ranked plan

### P0 — do first (max 3)

| # | Action | Type | B | S | E | F | Score |
|---|---|---|---:|---:|---:|---:|---:|
| P0-1 | **Measurement freeze and missing data.** No SEO-relevant release until Google reports the core update complete + 7 full days. Owner supplies: 3–6-month daily export, the page- and query-filtered exports of `01` §9, the indexing report, German SERP screenshots for the CTR-suspect queries, the Cloudflare deployment log, a backlink export (GSC "Links") | OWNER | 5 | 4 | 0.9 | 1 | **18.0** |
| P0-2 | **KI proof package.** Owner answers: how many assistants are live; supplies one consenting reference with real figures, real call recordings or a public demo number, product screenshots. Then placed on `/ki-telefonassistent` and `/kosten-ki-telefonassistent` | OWNER → CONTENT | 5 | 4 | 0.6 | 3 | **4.0** |
| P0-3 | **Deliver FAQ answers in the HTML** (45–46 pages incl. the KI cluster; 395 answers, ≈ 10,700 words exist only in JSON-LD). Either render the answers server-side or remove FAQPage markup where the answer is not shown. One release, nothing else in it | CODE | 4 | 3 | 0.7 | 2 | **4.2** |

### P1 — next (max 5)

| # | Action | Type | B | S | E | F | Score |
|---|---|---|---:|---:|---:|---:|---:|
| P1-1 | **Measure, then build, external presence.** First the GSC "Links" export (authority is assumed, not measured – 50 % that it is the ceiling). Then: get listed where page one already is, and establish the entity: OMR Reviews category, the existing vendor lists (Dr. Web, it-daily, hosttest), Google Business Profile for the real address, review profile, `sameAs` once profiles exist | OFF-SITE (+ small CODE for `sameAs`) | 5 | 4 | 0.5 | 4 | **2.5** |
| P1-2 | **Cost page from ≈ 17 to page one:** add the cost-normalisation method (per call / per minute / per user / flat → one figure for the reader's volume), a worked example with real invoice logic, "when we are the expensive option". Title/description untouched until the German SERP is seen | CONTENT | 5 | 4 | 0.5 | 2 | **5.0** |
| P1-3 | **One owner per KI intent.** After query × page exports: rebalance internal anchors toward the flagship, differentiate or merge the practice trio (`/ki-telefonassistent-arzt`, `/praxen`, `/ki-telefonassistent-praxis`), strip "& KI-Telefonassistent" from industry × city H1s | CODE/CONTENT, gated on OWNER data | 5 | 3 | 0.4 | 3 | **2.0** |
| P1-4 | **`internetagentur hotel` CTR investigation** – the only page-one exposure the domain has (511 impressions at ≤ 10). Query-filtered export (pages, countries, devices, days) + SERP screenshots first; a snippet test on `/webdesign-hotel` only if those confirm real page-one presence in Germany. Investigation, not a rewrite | OWNER (→ CONTENT only if confirmed) | 2 | 5 | 0.35 | 2 | **1.75** |
| P1-5 | **Prozessautomatisierung: give "prozessautomatisierung agentur" an owner and connect the ROI assets.** The pillar never uses the word "Agentur"; `roi für prozessautomatisierung` (pos. 15.1) lands on a blog post while the calculator lives elsewhere. Pillar has 4 impressions in 28 days – demand evidence is thin | CONTENT | 4 | 2 | 0.4 | 2 | **1.6** |

### P2 / P3 — later (max 5)

| # | Action | Type | B | S | E | F | Score |
|---|---|---|---:|---:|---:|---:|---:|
| P2-1 | **Remove live unsupported claims** ("ohne Rankingverlust", "Vor Ort in München/Regensburg", "Google-Dominanz … Top-3", city price tables, "amortisiert sich in 6–12 Monaten"). Trust and legal exposure rather than ranking | CONTENT | 3 | 1 | 0.9 | 1 | **2.7** |
| P2-2 | **Category comparison + buyer's test protocol for KI-Telefonassistenten** – only after P0-2, as a sales asset. The export shows **zero** impressions for any "vergleich"/"anbieter" query and its components already have owner pages; without a distinct job it violates the repo rule. Default: do not build | CONTENT | 5 | 1 | 0.3 | 3 | **0.5** |
| P2-3 | **Staged reduction of geo-modified pages**, beginning with the 6 noindex candidates and the `/webdesign-immobilien-{stadt}` set, one family per 28 days, only with query × page data per URL. `/muenchen/webdesign` is excluded until its click source is understood | CODE/CONTENT | 3 | 2 | 0.3 | 4 | **0.45** |
| P3-1 | **Hygiene bundle:** `www` → apex 301 (Cloudflare, cleanup only), Cloudflare email obfuscation producing a sitewide 404 link, real `lastmod` values, Article schema dates, React error #421 on `/bayreuth/webdesign`, HSTS, preview-host noindex | CODE / Cloudflare | 2 | 1 | 0.9 | 2 | **0.9** |
| P3-2 | **Restore measurement discipline in the repo:** `PROTECTED_EXPERIMENT_PATHS` is empty while the docs say "FROZEN"; three docs misstate what shipped on 11-04; decide the `/regensburg/website-relaunch` title on page-filtered data | CODE (docs/tests) | 2 | 2 | 0.8 | 1 | **3.2** |

P3-2 scores above some P1 items arithmetically; it stays P3 because it produces no ranking
effect – it protects the ability to measure the others.

## 4. By type

| CODE | CONTENT | OFF-SITE | OWNER EVIDENCE REQUIRED |
|---|---|---|---|
| P0-3 FAQ answers in HTML | P0-2 placement of proof | P1-1 listings, GBP, reviews, profiles | P0-1 exports, screenshots, deploy log, links report |
| P1-3 anchors / H1 clean-up | P1-2 cost-normalisation method | brand demand (follows from real customers and visibility, not from code) | P0-2 customers live, consent, recordings, screenshots, figures |
| P3-1 hygiene | P1-5 automation pillar / ROI | links from real partners and customers | P1-4 hotel query exports + screenshots |
| P3-2 protection list, doc corrections | P2-1 claim removal, P2-2 category comparison | | decisions: "anbieter" ownership, geo-page reduction, comparison page |

## 5. Discarded – found, ranked, deliberately not in the plan

| Item | Why discarded |
|---|---|
| Chasing "webdesign bayern" / München webdesign terms | Priority 3; positions 28–75; the 12 clicks are an unexplained burst, not a channel |
| Title/description rewrites on KI cost, hotel, relaunch, ROI pages now | Positions 13–19 are ranking problems; no German SERP seen; inside a core update |
| New city, industry or keyword-variant pages | 45 % of the site is already geo-modified; contrary to repo rules |
| A "best KI-Telefonassistenten 2026" listicle | Saturated, biased, unverifiable competitor data |
| Rolling back release #105 | ≈ 15 % probability it caused anything; rollback destroys measurement |
| Performance work (Spline bundle, cache TTL) | No evidence of a ranking effect at this visibility level; fold into hygiene only if cheap |
| Blog expansion | 14 long pages already hold 43 % of the words; information gain, not volume, is missing |
| 68 titles over 60 characters | Cosmetic without SERP evidence |
| Chasing `prozessautomatisierung` head term | Definitional SERP (SAP, IBM, Haufe); not winnable by an agency page |

## 6. Changes after the adversarial review

- Hotel CTR item (P1-4) confidence 0.6 → 0.35; it is an investigation, not a rewrite.
- Comparison resource (P2-2) search opportunity 2 → 1; default is not to build.
- Authority is treated as a 50 % hypothesis: P1-1 starts with measurement (links export).
- The consolidation/noindex list of `06` and the city-title edits of `05` are **not** actions;
  the geo pages concerned carry 16 of 27 clicks.
- KI diagnosis: the reviewer could not discriminate between proof, authority and result type
  either. The discriminating data are the links export, the German SERP screenshots and the
  page-filtered query exports – all in P0-1.
