# 10 · Post-core plan (2026-11-20)

Research and plan only. A later, separate session implements what the owner approves.
Priorities: 1. KI-Telefonassistent · 2. Prozessautomatisierung · 3. Webdesign.

## 1. Position in one paragraph

Cogniiq does not have a traffic drop to repair; it has an organic channel that does not yet
exist (27 clicks in 28 days, 12 of them one low-priority query, 1 brand click). The fortnight 10-23 → 11-05
(26 clicks) was the anomaly; before it the property earned 1–2 non-brand clicks per 28 days. No
technical defect, no release and not the core update (reported start after the clicks had
stopped) explains the movement with more than ≈ 10–20 % probability; the data cannot support
any causal November story. The path to top 10 is therefore not a repair programme. It is:
(1) evidence that the service is real, (2) presence and mentions outside the own domain,
(3) concentrating the site's signals on few owner pages with first-party substance – in that
order, measured one change at a time.

## 2. What top 10, top 3 and #1 each require

| Target | Realistic scope | What it takes | Who |
|---|---|---|---|
| **Top 10** | Long-tail commercial KI intents where Cogniiq already sits at 14–22: `… kosten`, `… preise`, `… zahnarzt`, practice-specific and local variants; `prozessautomatisierung agentur`-type terms; hotel terms at 13–19 | One owner page per intent, first-party specifics competitors do not publish (the cost page shows this works), FAQ content actually delivered, proof on the page | mostly repository work, fed by owner evidence |
| **Top 3** | The same intents | Clicks and trust have to hold up next to known vendors: verifiable reference, recordings/demo, reviews, a snippet that survives comparison with "ab 39 €" offers, third-party listings | owner + off-site; code only places it |
| **#1** | Narrow intents where a done-for-you provider is the best answer (practice-type and region-specific KI telephone queries) – not the head term in the foreseeable future | A recognised entity: brand searches, links from customers/partners/press, a track record. For `ki telefonassistent` itself page one is held by publishers and funded vendors; expecting #1 there within a year would be planning on hope | business building, not SEO production |

## 3. Sequence

### Phase 0 — now until core update complete + 7 days (no site change)

- Freeze every SEO-relevant release (heads, body copy of ranking pages, links, routes, schema).
- Owner delivers the data of P0-1 (`09`), in this order of value:
  1. Query-filtered daily export for "webdesign bayern" and page-filtered queries for
     `/muenchen/webdesign` (settles the burst hypothesis).
  2. 3–6-month daily export (was there ever a baseline?).
  3. Page-filtered query exports for the KI pages (ownership / cannibalisation).
  4. `internetagentur hotel`: pages, countries, devices, days + incognito screenshots from
     Germany, desktop and mobile.
  5. GSC "Links" export and indexing report.
  6. Cloudflare deployment log (turns "merge date ≈ deploy date" into fact).
- Owner answers the proof questions of `07` (item 1: how many telephone assistants are live).
- Start the off-site work that needs no repository change (P1-1): Google Business Profile,
  listing requests.

### Phase 1 — first releases after the freeze (one hypothesis per release)

| Release | Content | Measured on | Earliest verdict |
|---|---|---|---|
| R1 | P0-3 FAQ answers delivered in HTML (or markup removed where not shown) | indexed word count / long-tail impressions of the 45 pages; rich-result errors = 0 | deploy + 28 d |
| R2 | P0-2 proof on `/ki-telefonassistent` and `/kosten-ki-telefonassistent` (only what the owner has actually supplied) | position of the four tracked KI queries; clicks on the two pages | deploy + 28 d |
| R3 | P1-2 cost-normalisation section on the cost page | `… kosten` / `… preise` position (18.4 / 14.6 today) | deploy + 28 d |

R2 and R3 touch the same page; they are sequenced ≥ 28 days apart, or deliberately shipped as
one "cost page" change and judged as one.

### Phase 2 — after the first verdicts

- P1-3 internal ownership clean-up for KI, driven by the query × page exports.
- P1-4 one snippet test on `/webdesign-hotel` – only if exports and screenshots show a real
  page-one presence in Germany.
- P1-5 Prozessautomatisierung pillar and ROI connection.
- P2-1 removal of unsupported claims may ship at any time after the freeze; it is a correctness
  change and needs no measurement window, but it must not be bundled with R1–R3.

### Phase 3 — only with data

- P2-3 geo-page reduction, one family per 28 days.
- P2-2 category comparison / test protocol, if proof exists and the owner wants it as a sales
  asset.
- P3 hygiene and repository measurement discipline.

## 4. Measurement rules

1. One hypothesis per release; no bundles like #105 (22 heads + redirect + schema + nav).
2. Record the Cloudflare deployment timestamp of every release in the scoreboard.
3. Judge at query × landing page, on 28 full days, never on site-wide average position
   (45 % of impressions sit at position 65–70 and steer that average).
4. With < 100 impressions per query, report "insufficient data" instead of a direction.
5. A CTR conclusion needs position ≤ 10, ≥ 200 impressions and a seen German SERP.
6. Restore `PROTECTED_EXPERIMENT_PATHS` for every URL under measurement.

## 5. What must explicitly not be changed

- Hostname routing: apex `https://cogniiq.de` is the canonical host and correct. `www` → apex
  is a later cleanup, not part of any SEO release, and not in this branch.
- Titles, descriptions, H1s, canonicals of any ranking page before the German SERP is seen and
  the core update has settled.
- `/muenchen/webdesign` – the only page with clicks; its click source is not understood.
- `/kosten-ki-telefonassistent` head – performing above expectation at its position.
- `/webdesign-hotel` body and URL – ranking rose from ≈ 36 to ≈ 15 in ten weeks; only a
  snippet test, and only after evidence.
- `/regensburg/website-relaunch` – no rollback of the 11-04 title without page-filtered data.
- No new city, industry or keyword-variant pages; no listicle; no release #105 rollback.
- No invented proof: no customer, figure, review, recording or integration that the owner has
  not supplied and released.

## 6. Owner information and evidence required

Full checklist: `07-authority-proof-gap.md` (27 items). The ones that block the plan:

| # | Needed | Blocks |
|---|---|---|
| 1 | Number of telephone assistants live today; which customers may be named or anonymised | P0-2, P2-2 |
| 2 | Real call recordings or a public demo number; product screenshots | P0-2 |
| 3 | One reference with real figures and written consent | P0-2, top-3 ambitions |
| 4 | GSC exports and screenshots listed in Phase 0 | P0-1, P1-3, P1-4 |
| 5 | GSC "Links" export (or any backlink tool export) | whether authority is the ceiling |
| 6 | Cloudflare deployment log and dashboard redirect rules | timeline certainty, hygiene |
| 7 | Status of Google Business Profile, directory and comparison listings, review profiles | P1-1 |
| 8 | Decisions: owner page for "anbieter"; reduce geo pages or not; comparison resource or not | P1-3, P2-2, P2-3 |
| 9 | Clarification "two founders" vs. "Inhaber: Lazar Popovic"; real, distinct bios | entity trust |
