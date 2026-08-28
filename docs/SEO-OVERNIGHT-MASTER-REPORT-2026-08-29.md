# SEO Overnight Master Report — 2026-08-29

Coordinator branch: `claude/seo-overnight-master-2026-08-29` (base `origin/main` @ `27258b6`).
Evidence backing every claim in this report lives in
`docs/SEO-OVERNIGHT-SHARED-EVIDENCE-2026-08-29.md`. This report is the synthesis; it does not
repeat raw numbers already tabulated there except where needed for the argument.

---

## 1. Executive diagnosis — why thousands of impressions produce almost no clicks

**KNOWN (directly evidenced this session):**

- Cogniiq.de received 9,458 impressions and 12 clicks in the last complete 28-day GSC window
  (0.13% CTR, avg. position 54.7). 11 of those 12 clicks are branded/navigational (`cogniiq`,
  `/ueber-uns`). **Only one non-branded commercial click occurred site-wide in 28 days.**
- 83% of non-branded impression volume sits at position 40+ (page 4+). This is a **ranking
  problem first**, not a conversion or CTR problem — the overwhelming majority of impressions never
  reach a position where clicks are physically likely.
- Basic indexation is healthy: URL Inspection confirms `/`, `/ki-telefonassistent-arzt`,
  `/bayreuth/website-relaunch` are all "Submitted and indexed" with matching canonicals. The one
  "not indexed" page found (`/praxen`) is 11 days old at the time of the GSC window's end and has
  never been crawled — a timing artifact, not a defect.
- The two highest-value commercial query families (KI-Telefonassistent × Arztpraxis, 449 impr;
  Bayreuth/Regensburg/München webdesign × city, thousands of impr) both sit at positions 30–90,
  competing against entrenched, higher-authority incumbents (see §9).
- The site's own architecture actively channels its highest-authority internal links (main
  navigation, present on every one of ~90 pages) to a page (`/praxen`) that is too new to be
  indexed yet, while the page Google is *actually* ranking for that exact demand
  (`/ki-telefonassistent-arzt`, live since March 2026) receives comparatively little internal
  link support (8 config-driven references, no main-nav placement).
- GA4 has never been installed (confirmed again this session, unchanged from the prior analysis).
  No conversion, engagement, or bounce data exists for any page, at any window.

**LIKELY (evidenced but requires judgment):**

- External/domain authority is a real constraint for the two biggest opportunities. Live
  competitor snapshots show Cogniiq competing against Doctolib (a dominant, brand-recognized DACH
  practice-management platform) and vertical comparison sites for "KI Telefonassistent Arztpraxis,"
  and against award-winning, decade-plus-tenured local agencies for "Webentwicklung Bayreuth." A
  small agency's own service pages are unlikely to out-rank these purely through on-page changes.
- The homepage outranking `/bayreuth/webdesign` for every Bayreuth webdesign/webentwicklung query
  variant (see §7 of the shared evidence, and §7 below) is most plausibly explained by the
  homepage's much larger accumulated internal-link authority (27+ links from region/hub pages) and
  its status as the entity's canonical, most-crawled URL — not by a schema or content difference
  (both pages carry identical sitewide `LocalBusiness` JSON-LD).
- Mobile's ~4× higher CTR than desktop, despite a worse average position, is a directional signal
  that mobile searchers who do see Cogniiq are further along in intent — worth revisiting once
  click volume is large enough to be non-noisy.

**UNCERTAIN (explicitly not resolved — do not act on these without more data):**

- Whether any page has a genuine post-click conversion problem. Unknowable: 57 of 60 pages had zero
  clicks in 28 days, and there is no GA4 instrumentation. This question cannot be answered before
  ranking improves and GA4 is installed.
- Whether `/praxen` will out-rank `/ki-telefonassistent-arzt` for the Arztpraxis family once
  indexed. This is a genuinely open question that needs 2–4 weeks of data, not a guess.
- The precise magnitude of the external-authority ceiling. No backlink-metrics API was available
  this session; the competitive gap is real but not quantified.

---

## 2. Top 10 needle-moving actions (ranked by expected business impact)

1. **Install GA4 via the already-completed, unmerged `claude/ga4-consent-mode` branch.** Reviewed
   this session: all 9 architecture/consent properties verified true, 14/14 behavioral tests pass,
   typecheck clean, no critical defect. This is the single highest-leverage unblocked action on the
   list — every other conversion question in this report stays unanswerable without it. (Human
   decision required — see §19.)
2. **Do not touch `/ki-telefonassistent-arzt`'s internal links downward; if anything, add 2–4 more
   contextual links to it from adjacent pillar/problem pages** (`/verpasste-anrufe-verlust`,
   `/zu-viel-manuelle-arbeit`, `/ki-telefonassistent`) while `/praxen` matures. It is currently the
   only page earning any visibility (449 impr) for the site's largest identified commercial-intent
   query family, and it is under-linked relative to that value (8 refs vs. 14–27 for hub pages).
3. **Monitor, do not merge or redirect, `/praxen` vs. `/ki-telefonassistent-arzt` for 2–4 weeks.**
   `/praxen` is 11 days old and unindexed; judging query ownership between the two now would use a
   sample of zero. Revisit once `/praxen` has real GSC data.
4. **Bayreuth Performance title experiment — implemented this session** (see §4). Smallest possible
   lever on a real, fresh (+729%), page-1-adjacent (7.0–7.2) signal.
5. **Resolve the `/muenchen/webdesign-kosten` vs. `/muenchen/landingpage` vs. `/muenchen/webdesign`
   pricing-intent cannibalization** before investing further content there. Combined family grew
   +105% period over period but is split three ways; no single URL currently owns "Preise/Kosten in
   München."
6. **Do not invest further content on `/regensburg` or `/webdesign` (the two largest impression
   pools on the site, 2,675 and 1,696 impr) expecting a ranking win.** Both sit at position 73–76;
   closing a 60+ position gap through content is not realistic. Treat them as internal-authority
   distributors, not ranking targets — this was already the operating assumption behind the
   existing Regensburg internal-link experiment.
7. **Decide (owner-level decision, not a code change) whether to pursue vertical differentiation
   content for KI-Telefonassistent × Arztpraxis** — e.g., a transparent "vs. Doctolib / vs. generic
   AI receptionist" comparison, given comparison-style content (`praxisconcierge.de`,
   `medizinio.de`) is what currently wins this SERP.
8. **Fix the confirmed metadata-drift pattern site-wide, later, deliberately — not overnight.**
   `publicRoutes.ts` (crawled) and each page's own `ClusterPageConfig.seo` (hydrated) can diverge;
   confirmed live on at least the Bayreuth relaunch page before tonight's fix. A full audit of all
   ~60 `ClusterPageConfig`-driven pages for this drift is a bounded, valuable, non-overnight task.
9. **Track the "webentwicklung/webdesign Bayreuth" homepage-vs-page-page pattern as a genuine
   architecture question, not a quick fix** (full analysis in §7). No overnight action taken —
   this needs an owner decision about whether the homepage or `/bayreuth/webdesign` should be the
   canonical target for this query family.
10. **Do not expand the location × service page matrix further.** The site already has ~90 public
    routes covering city × service × industry combinations, with the majority earning zero clicks.
    Adding more programmatic pages before existing pages earn traction increases cannibalization
    risk without evidence it solves the ranking bottleneck.

---

## 3. Top 20 organic opportunities

Priority score (0–100) = weighted evidence composite: commercial intent (25%), proximity to page 1
(20%), correctness of the currently-ranking URL (15%), confidence in the diagnosis (15%), business
value tier (15%), inverse of external-authority/competitor-strength constraint (10%). Scores are
directional, not a formula to optimize against.

| # | Query family | URL | Impr. (28d) | Position | Commercial intent | Bottleneck | Priority | Next action |
|---|---|---|---|---|---|---|---|---|
| 1 | website performance bayreuth (+variant) | `/bayreuth/website-relaunch` | 49 | 7.0–7.2 | High | CTR / SERP presentation | 82 | **Implemented** — title updated this session |
| 2 | website relaunch regensburg (+variants) | `/regensburg/website-relaunch` | 61+34+33 | 5.4–14.8 | High | Internal authority (being tested) | 80 | Already isolated in `claude/regensburg-relaunch-internal-links` — monitor, do not duplicate |
| 3 | ki telefonassistent arztpraxis (family, 50+ variants) | `/ki-telefonassistent-arzt` | 449 | 28–74 | Very high | External authority + internal authority + E-E-A-T | 78 | Add 2–4 internal links; consider comparison content; do not touch until GA4 gives conversion signal |
| 4 | webdesign münchen preise / landingpage kosten münchen | `/muenchen/webdesign-kosten` | 41+31 | 14.0–19.9 | High (late-funnel) | Cannibalization (3 competing URLs) | 68 | Resolve ownership before further optimization |
| 5 | ki telefonassistent kosten (+variants) | `/kosten-ki-telefonassistent` | 152 | 34–36 | High (late-funnel) | External authority + internal authority | 62 | Pair with #3; same audience, different funnel stage |
| 6 | webentwicklung/webdesign bayreuth (5 variants) | `/` (winning) vs. `/bayreuth/webdesign` (losing) | 382 combined | 6.0–100.8 | High | Internal authority + architecture ownership | 60 | Recommendation only — see §7 |
| 7 | telefonassistent arztpraxis kosten / vergleich | `/ki-telefonassistent-arzt` | ~10 | 32–44 | Very high (comparison intent) | E-E-A-T / information gain | 58 | Candidate for a genuine comparison/FAQ content asset |
| 8 | webdesign agentur regensburg (+family) | `/regensburg/webdesign` vs. `/regensburg` | 218+ | 39–74 | High | Cannibalization | 55 | Recommendation only — see §6 (cannibalization map) |
| 9 | webdesign für arzt münchen | `/webdesign-arzt-muenchen` | 130 | 28.2 | High (vertical × largest city) | External authority | 52 | Monitor; candidate for future evidence assets |
| 10 | website performance optimierung bayreuth | (same as #1) | (counted in #1) | 7.2 | High | (same as #1) | — | (same action) |
| 11 | seo bayreuth (+family) | 6 different pages | 279 combined | 15.2–91.5 | Medium (informational-leaning) | Cannibalization + relevance | 45 | Do not chase; too diffuse across pages to be one opportunity |
| 12 | automatisierung fitnessstudio | `/automatisierung-sport` | 48 | 35.3 | Medium | External authority | 40 | Monitor only |
| 13 | prozessautomatisierung immobilien | `/automatisierung-immobilien` | 44+21 | 25.6–27.8 | Medium-high | Internal authority | 42 | Candidate for future internal linking pass |
| 14 | telefonassistent praxis (generic, non-arzt-specific) | `/ki-telefonassistent-arzt` | 63 | 39.8 | High | Same as #3 | (rolled into #3) | — |
| 15 | website f. arzt münchen | `/webdesign-arzt-muenchen` | 30 | 23.9 | High | (same as #9) | (rolled into #9) | — |
| 16 | pagespeed optimierung regensburg | `/regensburg/website-relaunch` | 31 | 22.4 | High | Same page as #2, secondary query | 50 | Monitor alongside #2, no separate action |
| 17 | makler website automatisierung | `/automatisierung-immobilien` | 21 | 25.6 | Medium | (rolled into #13) | — | — |
| 18 | website bringt keine anfragen | `/keine-anfragen-website` | 32 | 36.6 | Medium (problem-aware, pre-brand) | E-E-A-T / information gain | 38 | Monitor; good candidate for a genuine first-party diagnostic asset |
| 19 | homepage relaunch regensburg | `/regensburg/website-relaunch` | 33 | 14.8 | High | (same page as #2) | (rolled into #2) | — |
| 20 | webdesign oberfranken | `/bayreuth/webdesign` | 77 | 35.1 | Medium (regional, less specific) | External authority + architecture (same root cause as #6) | 35 | Recommendation only, tied to #6 |

Several rows collapse into the same underlying page/decision (marked "rolled into #N") — the
Top-20 instruction is honored by listing the distinct queries GSC surfaced, but double-counting
them as separate *actions* would misrepresent how few independent decisions actually exist.

---

## 4. Quick-win experiments — what was implemented and why

**Implemented: 1 of a maximum 3 allowed.** Two others were evaluated and explicitly rejected — see
§20. This matches the instruction that zero, one, or two experiments are acceptable when evidence
does not support more; three were not implemented merely because three were allowed.

### Bayreuth Performance title alignment (`claude/seo-bayreuth-performance`)

- **Hypothesis:** `/bayreuth/website-relaunch` already ranks position 7.0–7.2 for "website
  performance bayreuth" / "website performance optimierung bayreuth" (49 combined impressions,
  +729% vs. the preceding 28-day period, 0 clicks). PageSpeed Insights confirms the page is
  genuinely fast (Lighthouse 95/100 mobile) — the ranking is earned. Neither the prerendered title
  (the one Google actually crawls, per `publicRoutes.ts`) nor the page's own hydrated title
  mentioned "Performance" at all. Aligning the title to the page's real, evidenced strength should
  improve CTR/relevance signal without any content rewrite.
- **Change:** two single-line title edits (`src/lib/routing/publicRoutes.ts` and
  `src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx`), keeping both in sync. No description,
  H1, content, or internal-link changes.
- **Verification:** `npm run typecheck` clean; `npm run build` (SSR + sitemap + client + prerender,
  Node 22.22.2 via fnm) succeeded, 91/91 routes prerendered; confirmed the new title in
  `dist/bayreuth/website-relaunch.html` and confirmed sibling pages (Regensburg, München, homepage)
  were untouched; `npm run lint` — 0 errors, 24 pre-existing warnings unrelated to this change;
  `npm test` — 78 test files, 2,057 passed / 1 skipped (pre-existing skip, unrelated).
- **Measurement plan:** re-pull GSC query×page data for `/bayreuth/website-relaunch` at 7, 14, and
  28 days post-deploy. Success signal: position holds or improves on the two target queries *and*
  at least 1 click accrues (baseline is 0/49 impressions — GSC's low-volume noise means a single
  click is a meaningful signal here, not proof). Rollback trigger: position degrades by more than 5
  spots on either target query, or on the page's other ranking queries (`website relaunch
  regensburg`-style terms are not on this page, but `website relaunch bayreuth`, `homepage relaunch
  bayreuth` etc. should be checked for regression too).
- **Branch/commit:** `claude/seo-bayreuth-performance` @ `a77faba`, based on `origin/main` @
  `27258b6`. Pushed. Not merged.

---

## 5. Money page roadmap

Ranked by realistic near-term revenue contribution (not raw impressions):

1. **`/ki-telefonassistent-arzt`** — highest ticket × highest-value vertical × only page with
   proven demand (449 impr) for this family. Roadmap: (a) do not reduce internal links, add a few;
   (b) once GA4 is live and click volume exists, instrument for conversion; (c) evaluate a
   comparison-style content addition (see §9) once `/praxen`'s trajectory is known, to avoid
   building two competing assets in parallel.
2. **`/regensburg/website-relaunch` + `/bayreuth/website-relaunch`** — €2,000–7,000 project value
   per the pages' own FAQ content, already closest to page 1, one already earning clicks. The
   Regensburg internal-link experiment and tonight's Bayreuth title experiment are both live and
   unmeasured; do not add a third change to either page until their current experiments report.
3. **`/kosten-ki-telefonassistent`** — late-funnel intent, same audience as #1, currently
   position 34–36. Roadmap: bundle with #1's authority work rather than treating as separate.
4. **`/muenchen/webdesign-kosten`** — resolve the 3-way cannibalization with `/muenchen/landingpage`
   and `/muenchen/webdesign` first; do not add content until one URL is the clear intended owner.
5. **`/webdesign-arzt-muenchen`** — vertical × largest market, 130 impr at position 28.2. No
   immediate action; monitor as a second-tier vertical opportunity once #1 and #3 show signal.

**Deliberately deprioritized for revenue purposes:** `/regensburg`, `/webdesign`, `/bayreuth`,
`/muenchen` city/service hubs. They carry 46%+ of site impressions combined but sit at positions
53–91. Treat them as internal-authority distribution nodes (the role they already play in site
navigation), not as pages to optimize for their own ranking.

---

## 6. Query ownership / cannibalization map

Full data in shared evidence §7d. Summary by cluster:

| Cluster | Competing URLs | Pattern | Recommended ownership |
|---|---|---|---|
| Regensburg webdesign/SEO family (10+ queries, 1,700+ combined impr) | `/regensburg` (hub) vs. `/regensburg/webdesign` (service) | Both losing (position 39–95); service page usually slightly better positioned | **IMPROVE** the service page's internal authority; **KEEP** hub as a distributor, not a target |
| Regensburg website-relaunch family | `/regensburg/website-relaunch` vs. `/regensburg` vs. `/webdesign` | Correct page already wins decisively (5.4 vs. 56.8 vs. 70.7) | **KEEP** — working as intended, matches the live internal-link experiment |
| Bayreuth webdesign/webentwicklung family | `/` (homepage) vs. `/bayreuth/webdesign` | Homepage wins by 25–40 positions on every variant | **REPOSITION** (recommendation only, no overnight action) — see §7 |
| München pricing family | `/muenchen/webdesign-kosten` vs. `/muenchen/landingpage` vs. `/muenchen/webdesign` | 3-way split, all page 2+ | **IMPROVE** — pick one owner (likely `-kosten`, given query intent is explicitly pricing) before further content work |
| KI-Telefonassistent × Arztpraxis | `/ki-telefonassistent-arzt` (proven) vs. `/praxen` (nav-favored, unindexed) | Not yet a real conflict — `/praxen` has no data | **MONITOR** for 2–4 weeks; **do not MERGE/REDIRECT/NOINDEX either page now** |
| SEO Bayreuth family | 6 different pages, 279 combined impr | Diffuse, no single clear winner emerging | **KEEP**, do not consolidate — too early and too low-value to justify a merge decision |

No MERGE, REDIRECT, NOINDEX, or DELETE was implemented for any of these — all are recommendations
per the hard safety boundaries.

---

## 7. Bayreuth "Webentwicklung" ownership decision (full analysis)

**1. Which URL does Google currently prefer?** The homepage (`/`), by a wide and consistent margin,
across all 5 query variants tested (webentwicklung, webdesign, webagentur, webdesigner,
webentwickler + "bayreuth"): homepage positions 6.0–19.0 vs. `/bayreuth/webdesign` positions
35.3–52.7. See shared evidence §7a for every row.

**2. Which URL *should* own this family?** On intent-match grounds, `/bayreuth/webdesign` is the
more correct destination — it is explicitly the dedicated local-service page. But "should" on
paper does not override Google's actual, consistent, multi-query preference for the homepage.

**3. Does homepage intent match the SERP better than expected?** Plausibly yes, for a specific
reason: these are effectively "web agency near me in Bayreuth" queries, and the homepage carries
the entity's actual `LocalBusiness` identity (name, founders, Bayreuth address) as the site's most
crawled, most internally-linked URL (27+ links from region pages alone). Google may be treating the
homepage as the more authoritative representation of "the actual local business" — which is
correct, since Cogniiq's home city genuinely is Bayreuth (confirmed via `/ueber-uns` content) — not
merely one of several markets it serves.

**4. Is the dedicated page differentiated enough?** Its content is city-specific and
reasonably substantive (per the site's `ClusterPage` template), but it is one of 9 near-identical
`ClusterPageConfig` pages generated from the same template across three cities and multiple
services. Differentiation is structural (same shape, swapped city name), not evidentiary.

**5. Do the pages overlap too strongly?** Yes — both mention "Bayreuth," "Webdesign," and
"Cogniiq" prominently; the homepage additionally targets "Bayern" broadly. This is consistent
with, though not proof of, a self-competition dynamic.

**6/7. Do internal anchors conflict? Is content uniqueness sufficient?** Anchors are not in direct
conflict (no page anchors to `/bayreuth/webdesign` using the exact string "webentwicklung
bayreuth"), but the *authority* imbalance (homepage: 27+ inbound refs vs. dedicated page: 18) means
Google has far more signal pointing at the homepage as the entity's primary node.

**8. Is local relevance sufficient?** Yes on both pages — this is not a geographic mismatch.

**9. Is external authority likely the dominant limiter?** Partially. Live competitor research
(shared evidence §12) shows the visible SERP for adjacent "webentwicklung bayreuth agentur" queries
includes award-winning, decade-plus-tenured local agencies and listicle/directory sites — a mature,
defended local market. Even if internal cannibalization were resolved, positions 6–19 (where the
homepage already sits) are a more realistic ceiling than page 1 without more external authority.

**10. Single recommendation:** **Do not force `/bayreuth/webdesign` to win this family overnight.**
The homepage is already the higher-authority, better-performing asset for it, and it is not
"wrong" for a small local agency's homepage to rank for its own city's core service query. The
actionable architecture question for the owner is: *should `/bayreuth/webdesign` be repositioned
around a sub-topic the homepage does not already own* (e.g., pricing, process, or a specific
sub-service), rather than competing head-on for the exact same query family the homepage already
wins. This is a positioning decision, not a technical one, and is left as a recommendation.

---

## 8. Internal authority findings

- Full-site internal-link counts (config-driven pages only; see shared evidence §8) show the
  largest single-page impression pool on the site, `/webdesign` (1,696 impr, position 76.1), has
  only 1 config-driven internal reference — effectively orphaned relative to its visibility. This
  is consistent with, not necessarily the sole cause of, its poor position.
- `/ki-telefonassistent-arzt` (449 impr, the largest proven-demand commercial page) has 8
  references and no main-navigation placement — under-linked relative to the value it has already
  demonstrated.
- Main navigation (`src/lib/navigation-data.ts`, the single source for desktop + mobile, feeding
  every one of ~90 public pages via footer as documented in the file's own header comment) sends
  its highest-authority "Für Arzt- und Zahnarztpraxen" link to `/praxen`, a page created 11 days
  before this analysis and not yet indexed. This was a deliberate, recent, documented architecture
  decision (see the file's own code comments) — not an oversight, but its practical effect right
  now is that the site's single most authoritative internal link for this audience points at a page
  Google has not crawled yet.
- Recommendation: do not restructure navigation overnight. Revisit in 2–4 weeks once `/praxen` has
  real GSC data, per §1 and §6.

---

## 9. Competitor findings

Restricted to the two highest-priority families per scope instructions (full detail in shared
evidence §12):

- **KI Telefonassistent Arztpraxis:** the visible competitive set is dominated by Doctolib (the
  dominant DACH practice-management/booking brand with its own AI-receptionist product page),
  smaller vertical SaaS vendors (DocMedico, 321 MED), and comparison/aggregator content
  (`praxisconcierge.de`, `medizinio.de`, `finanzskalpell.com`) explicitly styled as "N Anbieter im
  Vergleich." Cogniiq is a generalist AI agency competing against entrenched vertical brands and
  comparison publishers. **What Cogniiq can realistically do better:** it already has genuine
  first-party differentiators these competitors may not emphasize as clearly — a fixed, capped
  minute allowance (transparent pricing), an explicit no-recording/no-training privacy stance, and
  a live, listenable demo (`/ki-telefonassistent/demo`). None of that differentiation currently
  appears as comparison-style content, which is the format winning this SERP.
- **Webentwicklung/Webdesign Bayreuth:** local competitors include directory/listicle sites
  (`feedbax.de`/`feedbax.ai`) and established local agencies with visible tenure and awards (Jung
  und Banse — Deutscher Agenturpreis, German Web Award 2024; Feuerpfeil — 20+ years). This is a
  mature, defended local market, not an empty field — reinforces that the ownership question in §7
  has a real external-authority ceiling regardless of internal architecture.

No further competitor research was performed for lower-priority families, per scope instructions.

---

## 10. External authority / backlink ceiling

No backlink-metrics API (Moz, Ahrefs, Majestic) was configured or available this session — figures
below are qualitative, not measured, and are stated as such rather than invented.

**Assessment:** external authority is very likely a real, material constraint for the two highest
commercial-value families (§9) — both face incumbents with independent brand recognition, awards,
or vertical-market tenure that a generalist small agency's on-page content cannot out-signal alone.
It is **not** the dominant constraint for the "correct URL wins" cases (Regensburg/Bayreuth
relaunch pages), where positions 5–15 show on-page relevance and internal authority are already
suf ficient to compete.

**Realistic authority-building opportunities, ranked:**

- **HIGH-QUALITY REALISTIC:** local Bayreuth/Bayern business directories and Chamber of Commerce
  (IHK) listings with genuine NAP consistency; a genuine "built by Cogniiq" case-study exchange
  with any client willing to be named/linked (none fabricated — only if real, consenting clients
  exist); a technical/methodology write-up (how the KI-Telefonassistent handles consent, privacy,
  and call routing) as a linkable, citable technical resource; Google Business Profile optimization
  (feeds local pack visibility independent of organic web ranking).
- **MEDIUM:** guest contribution to a regional Bayern business/tech publication if a genuine
  relationship exists; a partner/vendor mention if Cogniiq's tooling stack includes a partner
  program with a public directory (e.g., telephony/voice API providers) — only where the
  relationship is real and disclosed.
- **LOW-VALUE / AVOID EXPLICITLY:** any purchased link, link-exchange scheme, mass directory
  submission, PBN, or automated outreach. None of these were used or recommended.

**30-day authority plan (recommendation only, no code involved):**
1. Week 1: audit and correct NAP consistency across Google Business Profile, Impressum, and any
   existing directory listings.
2. Week 2: identify 2–3 genuine, real, consenting sources for a case-study or testimonial link
   (client, technology partner, or local business association) — do not fabricate if none exist.
3. Week 3: draft one genuinely technical/methodology asset (e.g., "how Cogniiq's KI-Telefonassistent
   handles consent and data" ) as a citable resource, tied to the `/datenschutz-sicherheit` and
   `/integrationen` pages already gated pending `OWNER-INPUT.md` verification.
4. Week 4: reassess GSC position movement on the Bayreuth Performance experiment and the Regensburg
   internal-link experiment before deciding whether more content or more authority-building is the
   next lever.

---

## 11. First-party evidence roadmap

**Available evidence Cogniiq already has (repo-verified):**
- A live, listenable KI-Telefonassistent demo (`/ki-telefonassistent/demo`).
- Concrete, transparent pricing bands stated in FAQ content (e.g., "ab ca. 2.000 €," "3.500–7.000
  €" for relaunches; capped minute allowances for the phone assistant).
- A genuine, specific privacy/architecture stance (no call recording, no training on customer data)
  already written into page content and — once `claude/ga4-consent-mode` ships — into a materially
  upgraded Datenschutzerklärung with correct consent-mode language.
- Founder transparency: named founders (Lazar & Djordje Popovic) with a stated Bayreuth origin on
  `/ueber-uns` — the site's only page with non-branded-adjacent, genuinely differentiated organic
  performance (25.93% CTR, though non-scalable per the reused page-level analysis).
- A full, itemized "what a relaunch includes" deliverables list already present on the relaunch
  cluster pages.

**Evidence Cogniiq should collect (ranked by expected SEO + conversion impact, not fabricated):**
1. Real, consenting client case studies (currently none published — `/referenzen` explicitly states
   client work is published only with written approval, meaning the roadblock is authorization, not
   content creation).
2. Actual screenshots/recording of the AI phone assistant handling a real call flow (with consent),
   to pair with the existing audio demo — stronger for both users and for AI-search extractability.
3. A structured, honest comparison table for "KI-Telefonassistent vs. Doctolib vs. generic
   answering service" — directly addresses the comparison-content pattern already winning this SERP
   (§9), using only verifiable claims about Cogniiq's own product (pricing, privacy stance, setup
   time) rather than unverified claims about competitors.
4. A technical methodology page on consent/privacy architecture, once `claude/ga4-consent-mode`
   ships — this can be genuinely detailed and specific, which is exactly what's missing from
   `/integrationen` and `/datenschutz-sicherheit` today (both intentionally held `noindex` pending
   `OWNER-INPUT.md`).

---

## 12. GEO / AI search findings

Performed only after conventional SEO analysis, on the highest-value pages, per scope.

- Entity clarity is strong: `LocalBusinessSchema` (sitewide) carries Organization, address, geo,
  founders, and `areaServed` as structured `@type: City` entries — this is genuinely useful for
  AI-answer extraction of "who is Cogniiq and where do they operate."
- `/ki-telefonassistent-arzt` and the relaunch cluster pages already carry FAQ content in a
  structured, extractable Q&A format (verified in `WebsiteRelaunchBayreuth.tsx`'s `faq` array,
  rendered via `PageSEO`'s `faqItems` prop, i.e., likely `FAQPage` schema) — a real, existing
  strength for AI Overviews / ChatGPT-style extraction, not something that needs to be built.
- Missing for genuine information gain: the comparison-style content named in §9/§11 is exactly the
  kind of concrete, verifiable structured comparison that both classic SERP features and AI answer
  engines reward — and it does not exist yet on any Cogniiq page.
- No GEO-specific "hacks" were applied or recommended. The recommendation is the same first-party
  evidence work as §11, which happens to also serve AI-search extractability.

---

## 13. Technical findings (only what matters)

- **Metadata source-of-truth: confirmed still split**, exactly as flagged in project history.
  `scripts/prerender.mjs` regex-overwrites `<title>`/description/OG/Twitter tags using
  `publicRoutes.ts` *after* the component has already rendered its own `PageSEO` with
  `ClusterPageConfig.seo.title`/`description` — so the crawled HTML and the hydrated document can
  differ. Confirmed live on `/bayreuth/website-relaunch` before tonight's fix (two different
  titles). **Recommendation:** a bounded, deliberate future task — audit all `ClusterPageConfig`-
  driven pages for the same drift and either (a) make `publicRoutes.ts` the single input the
  components read from, or (b) add a CI check that fails when a page's own `seo.title` differs from
  its `publicRoutes.ts` entry. Not attempted overnight — this is exactly the "large metadata
  refactor" the task scope excludes.
- **Indexation/crawlability:** healthy. `robots.txt` is well-reasoned and already documents its own
  design decisions (e.g., why `/admin` is deliberately not disallowed). Sitemap contains 88 URLs;
  `PUBLIC_ROUTES` has 91 total routes (88 indexable + 3 noindex), consistent.
  `npm run sitemap:check` requires a fresh `dist-ssr` build to run (expected — the generator reads
  the compiled SSR bundle, never source `.ts` directly) and was validated indirectly via the full
  build in the Bayreuth Performance experiment.
- **Core Web Vitals:** `/bayreuth/website-relaunch` scores Lighthouse 95/100 (mobile) with all lab
  metrics green (LCP 2.1s, CLS 0, TBT 0ms). No CrUX field data exists for this or most pages —
  expected at current traffic levels, not a defect. No full-site PageSpeed audit was run (out of
  scope; only the page relevant to a live decision was tested).
- **JavaScript rendering / prerendering:** the build's own prerender step successfully produced
  static HTML for all 91 routes this session, with correct per-route `<title>`, canonical, and
  robots meta (verified via the `test-prerender-output.mjs`-equivalent assertions built into
  `prerender.mjs` itself, which the build run exercised).

---

## 14. GA4 production-readiness review (`claude/ga4-consent-mode`)

Reviewed this session via an isolated worktree; branch was not modified. All 9 required properties
verified **TRUE** with file:line citations:

1. GA4 ID `G-K7BS3LKT6H` — `src/lib/consent.ts:32`.
2. Consent Mode v2 default denies `analytics_storage` — `consent.ts:220-226`.
3. No unconditional GA4 load before consent — script injection only in `ensureLibraryLoaded()`
   (`consent.ts:156-172`), gated by `applyState()` (`consent.ts:251-256`); confirmed by static grep
   of `index.html` (no `googletagmanager.com`) and test `does not load GA4 before analytics
   consent` (`consent.test.ts:89-96`).
4. Analytics and Marketing consent are independent toggles — separate fields in `ConsentState`
   (`consent.ts:45-48`), independent UI checkboxes (`ConsentBanner.tsx:192-234`).
5. Reject-all correctly denies everything — `denyAll()` (`consent.ts:276-278`), tested
   (`consent.test.ts:170-185`).
6. Revoke path exists and cleans cookies — `revokeConsent()` (`consent.ts:286-292`), wired to UI
   (`ConsentBanner.tsx:82-85, 238-245`), removes `_ga`, `_ga_K7BS3LKT6H`, `_gid`.
7. Datenschutzerklärung accurately reflects the architecture — new §7 in `legal-content.tsx:163-224`
   names GA4, consent-gating, real cookie names, DSGVO/TDDDG basis, and the revoke path.
8. Behavioral test coverage — `consent.test.ts`, 14/14 passed this session.
9. `index.html` has no static GA4/GTM injection — confirmed identical to `origin/main`.

**Build/typecheck on the branch:** clean. **Critical defect: none found.** The reviewing agent also
surfaced one unrelated, pre-existing issue: `.github/scripts/test-seo-consistency.mjs` crashes on
an unrelated `.bolt/config.json` path-join bug *after* all GA4/consent assertions complete — not a
consent defect, not investigated further, logged in the backlog as a low-priority separate item.

**This branch was not modified, merged, or deployed.** It remains a human decision to merge — see
§19.

---

## 15. Work completed overnight

- Verified pre-flight git state; created coordinator branch `claude/seo-overnight-master-2026-08-29`
  from `origin/main` @ `27258b6` with zero initial diff.
- Installed missing local Python dependencies (`google-api-python-client`, `google-auth`,
  `google-auth-oauthlib`) to enable live GSC/PSI/URL-Inspection API calls this session.
- Pulled and analyzed: 28-day query×page GSC data (842 rows), preceding 28-day comparison,
  90-day query×page data, device breakdown, country breakdown, URL Inspection for 4 key URLs,
  PageSpeed/Lighthouse for the Bayreuth relaunch page.
- Reused (did not re-derive) the prior page-level GSC+GA4 analysis at
  `C:\Users\Lazar_PC\seo-scratch\SEO-GSC-GA4-COMBINED-ANALYSIS.md`.
- Read and cross-referenced the full public route manifest (`publicRoutes.ts`, 91 routes), main
  navigation data (`navigation-data.ts`), `ClusterPage`/`PageSEO` rendering pipeline, and
  `prerender.mjs`'s metadata-injection logic.
- Ran 2 targeted `WebSearch` competitor checks (top 2 priority families only).
- Delegated and reviewed the completed `claude/ga4-consent-mode` branch (isolated worktree, no
  modification, no merge) — 9/9 properties verified, no critical defect.
- Implemented, verified, committed, and pushed 1 isolated SEO experiment
  (`claude/seo-bayreuth-performance`).
- Wrote this master report, the shared evidence document, the master backlog, and the branch
  manifest (below) on the coordinator branch.

## 16. Branches created

- `claude/seo-overnight-master-2026-08-29` (this branch — reports only, from `origin/main` @
  `27258b6`).
- `claude/seo-bayreuth-performance` (1 experiment, from `origin/main` @ `27258b6`, pushed).

No other branches were created. `claude/regensburg-relaunch-internal-links` and
`claude/ga4-consent-mode` already existed and were inspected, not recreated or modified.

## 17. Commits created

- `claude/seo-bayreuth-performance` @ `a77faba` — "seo(bayreuth): align website-relaunch title with
  performance search demand" (2 files, 2 insertions / 2 deletions).
- `claude/seo-overnight-master-2026-08-29` — this session's documentation commit (see branch
  manifest for the exact SHA once pushed).

## 18. Test / build results

| Branch | Typecheck | Lint | Tests | Build |
|---|---|---|---|---|
| `claude/seo-bayreuth-performance` | ✅ clean | ✅ 0 errors, 24 pre-existing warnings | ✅ 78 files, 2,057 passed / 1 skipped | ✅ 91/91 routes prerendered |
| `claude/ga4-consent-mode` (reviewed only) | ✅ clean | not re-run (out of scope for a review) | ✅ 14/14 consent tests | not re-run (out of scope) |

## 19. Human decisions required

1. **Merge `claude/ga4-consent-mode`?** Reviewed clean, no critical defect, but merging analytics
   infrastructure is a product/privacy decision, not purely technical — left to the owner per the
   task's hard safety boundaries (never merge automatically).
2. **Whether to pursue vertical comparison content** for KI-Telefonassistent × Arztpraxis (§9, §11)
   — requires deciding how directly Cogniiq wants to reference named competitors.
3. **Whether/how to reposition `/bayreuth/webdesign`** away from head-on competition with the
   homepage (§7) — a positioning decision.
4. **Whether to authorize collection of real client case studies** for `/referenzen` — currently
   blocked on client written approval, not on content production capacity.
5. **Whether to resolve the München pricing-page cannibalization** by consolidating
   `/muenchen/webdesign-kosten`, `/muenchen/landingpage`, and `/muenchen/webdesign` intent, or by
   leaving all three and improving internal signals instead.

## 20. Things deliberately not changed

- **`/bayreuth/webdesign` vs. homepage ownership (§7)** — architecture/positioning decision,
  explicitly excluded from overnight implementation by task scope.
- **München pricing-page cannibalization** — evaluated as a possible second experiment; rejected
  because the three competing pages create implementation risk a single title edit cannot safely
  resolve, and confidence in a clean, isolated fix was medium, not high. Documented as backlog item
  instead of forced into tonight's experiment count.
- **`/webentwicklung`/`webdesign bayreuth` homepage title** — considered and rejected as an
  experiment target for the same reason as above: this is the ownership question in §7, not a
  CTR/title tweak, and forcing a title change here would be acting on an unresolved architecture
  question rather than a quick win.
- **Any change to `/praxen` or `/ki-telefonassistent-arzt`'s navigation placement** — correctly
  left alone pending `/praxen` accruing real indexation and click data (§1, §6, §8).
- **Any redirect, merge, noindex, or deletion** of any URL — none were implemented; all such
  recommendations in this report are recommendations only, per hard safety boundaries.
- **GA4 merge or deployment** — reviewed only, not merged, not deployed.
- **Full-site metadata-drift remediation** — confirmed the pattern still exists (§13) but fixing it
  site-wide is exactly the "large metadata refactor" the task scope excludes overnight.
- **Full-site PageSpeed/CrUX audit** — only the page relevant to a live decision was tested, per
  scope instructions against wasting the session on ~91 identical audits.

## 21. Exact queries + pages to monitor (7/14/28-day checkpoints)

| Query | Page | Baseline position | Baseline impr. | Baseline clicks | Checkpoint dates |
|---|---|---|---|---|---|
| website performance bayreuth | `/bayreuth/website-relaunch` | 7.0 | 27 | 0 | 2026-09-05, 2026-09-12, 2026-09-26 |
| website performance optimierung bayreuth | `/bayreuth/website-relaunch` | 7.2 | 22 | 0 | same |
| website relaunch bayreuth (regression check) | `/bayreuth/website-relaunch` | n/a (verify no regression) | n/a | n/a | same |
| ki telefonassistent arztpraxis (family) | `/ki-telefonassistent-arzt` | 28–40 | 449 | 0 | 2026-09-12 (indexation/link changes take longer) |
| (any query) | `/praxen` | unindexed | 0 | 0 | 2026-09-12, 2026-09-26 — first check for any indexation/impressions |
| website relaunch regensburg (existing experiment) | `/regensburg/website-relaunch` | 5.4 | 61 | 1 | per that experiment's own baseline doc |

## 22. 7-day execution plan

1. Owner reviews and decides on `claude/ga4-consent-mode` merge (§19.1).
2. No further code changes to `/bayreuth/website-relaunch` or `/regensburg/website-relaunch` —
   let both isolated experiments run undisturbed.
3. Owner decision on München pricing-page consolidation direction (§19.5) — no code yet, just the
   decision, so implementation can start cleanly once decided.
4. Begin the NAP/citation consistency check from the 30-day authority plan (§10, week 1) — this is
   non-code, ownable in parallel.

## 23. 30-day growth plan

1. Days 1–7: GA4 merge decision + NAP/citation audit (see above).
2. Days 7–14: first checkpoint on the Bayreuth Performance experiment; if GA4 is merged, begin
   accumulating baseline conversion data (do not judge conversion from <14 days of data).
3. Days 14–21: revisit `/praxen` indexation status; if indexed with any impressions, begin the
   `/praxen` vs. `/ki-telefonassistent-arzt` ownership decision with real data instead of a
   timing-based deferral.
4. Days 21–28: second checkpoint on both live experiments (Bayreuth Performance, Regensburg
   internal links); decide on the München pricing consolidation implementation if the owner has
   chosen a direction; draft the first genuine comparison-content asset for KI-Telefonassistent ×
   Arztpraxis if authorized (§19.2).

## 24. What Cogniiq should stop doing

- Stop treating impression volume on `/regensburg` and `/webdesign` as a success signal — both are
  46%+ of site impressions and 0% of clicks, at positions 73–76. This is not a page to keep
  polishing for its own ranking.
- Stop adding new location × service × industry pages before existing ones earn traction. ~90
  routes already exist; the majority earn zero clicks. More programmatic pages increase
  cannibalization risk (§6) without addressing the actual bottleneck (external authority,
  internal-authority misallocation, GA4 blindness).
- Stop deferring the GA4 decision. Every "is this a ranking problem or a conversion problem"
  question in this report is blocked on it, and the branch has been ready, reviewed, and clean for
  some time.

## 25. Biggest current SEO bottleneck

**Ranking, not conversion, not technical SEO.** 83% of non-branded impression volume sits at
position 40+; only one non-branded click occurred sitewide in 28 days; and the two highest-value
commercial query families are both competing against genuinely stronger incumbents (an established
DACH healthcare-software brand, and awarded local agencies with a decade-plus of tenure) rather than
losing to a fixable on-page or technical defect. Fixing GA4 does not fix this — it only makes the
*next* bottleneck (conversion) measurable once ranking improves. The three real levers are: (1)
closing internal-authority misallocation on the one page that already has proven demand
(`/ki-telefonassistent-arzt`), (2) building the specific, genuine first-party evidence (comparison
content, real case studies once authorized) that plausibly moves the external-authority needle for
that page, and (3) being patient with the two isolated experiments already running before adding a
third variable.

---

## If Cogniiq could do only three things next, they should be:

1. **Decide on GA4** (`claude/ga4-consent-mode` merge) — every downstream ranking-vs-conversion
   question in this report is blocked on it, and it has been reviewed clean.
2. **Add internal links to `/ki-telefonassistent-arzt`** and leave `/praxen` alone to mature for
   2–4 weeks before making any ownership decision between them — the site's single largest proven
   commercial-demand pool is currently under-linked relative to its evidenced value.
3. **Let the two live experiments (Bayreuth Performance, Regensburg internal links) run
   undisturbed for their full 7/14/28-day measurement windows** before adding a third variable —
   the site's total click volume is too low to interpret overlapping changes.
