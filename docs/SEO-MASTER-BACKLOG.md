# SEO Master Backlog — 2026-08-29

Curated for quality, not quantity. Full evidence backing each item is in
`docs/SEO-OVERNIGHT-SHARED-EVIDENCE-2026-08-29.md` and the synthesis in
`docs/SEO-OVERNIGHT-MASTER-REPORT-2026-08-29.md`.

---

### BL-01 — Merge GA4 consent-mode analytics

- **Priority:** P0
- **Category:** Measurement infrastructure
- **Affected URL(s):** sitewide
- **Query family:** n/a — measurement, not ranking
- **Evidence:** `claude/ga4-consent-mode` @ `aa5fa52`, reviewed this session — all 9 required
  consent/GA4 properties verified true (file:line citations in master report §14), 14/14 behavioral
  tests pass, typecheck clean, no critical defect.
- **Commercial intent:** n/a
- **Expected business impact:** VERY HIGH (unblocks every conversion-vs-ranking question in this
  audit; currently zero post-click data exists for any page)
- **Confidence:** High (branch reviewed clean)
- **Effort:** Low (already implemented; this is a merge decision, not new work)
- **Risk:** Low-medium — a privacy/consent product decision, not a technical risk
- **Priority score:** 95
- **Recommended action:** Owner reviews and decides on merge; not merged automatically per hard
  safety boundaries.
- **Implementation status:** Complete on its own branch; NOT merged.
- **Measurement method:** Once merged, GA4 property `551863316` will begin receiving hits;
  re-run `ga4_report.py --report top-pages` after ~2 weeks of data.
- **Dependencies:** None technical. Owner decision only.

---

### BL-02 — Add internal links to `/ki-telefonassistent-arzt`

- **Priority:** P1
- **Category:** Internal authority
- **Affected URL(s):** `/ki-telefonassistent-arzt`; link sources: `/verpasste-anrufe-verlust`,
  `/zu-viel-manuelle-arbeit`, `/ki-telefonassistent`
- **Query family:** KI-Telefonassistent × Arztpraxis
- **Evidence:** 449 impressions (28d), 0 clicks, position 28–74, only 8 config-driven internal
  link references — under-linked relative to demonstrated demand (shared evidence §7c, §8)
- **Commercial intent:** Very high
- **Expected business impact:** HIGH
- **Confidence:** Medium-high (internal authority is a plausible, evidenced contributing factor;
  external authority is also a likely constraint — see BL-04)
- **Effort:** Low (2–4 contextual link additions)
- **Risk:** Low — additive, reversible
- **Priority score:** 78
- **Recommended action:** Implement as its own small isolated experiment in a future session, with
  its own baseline capture.
- **Implementation status:** Not implemented — recommendation only, per this session's evidence
  threshold (wanted to keep this session's single implemented experiment focused and isolated).
- **Measurement method:** GSC position/impression trend on the Arztpraxis family, 14/28-day
  checkpoints.
- **Dependencies:** None.

---

### BL-03 — Monitor `/praxen` vs. `/ki-telefonassistent-arzt` before any ownership decision

- **Priority:** P1
- **Category:** Cannibalization / architecture
- **Affected URL(s):** `/praxen`, `/ki-telefonassistent-arzt`
- **Query family:** KI-Telefonassistent × Arztpraxis
- **Evidence:** `/praxen` created 2026-08-18 (commit `be9a8d0`), confirmed via live URL Inspection
  API as "URL is unknown to Google" (never crawled). `/ki-telefonassistent-arzt` live since March
  2026, holds all 449 impressions for this family. Main nav sends its highest-authority link to
  `/praxen` (shared evidence §8).
- **Commercial intent:** Very high
- **Expected business impact:** HIGH (this decision determines where the site's biggest single
  commercial opportunity should live)
- **Confidence:** High confidence that it is premature to decide now; zero confidence either way
  once decided
- **Effort:** None yet — this is a "wait and observe" item
- **Risk:** High if acted on prematurely (could suppress the only page currently earning any
  visibility for this family)
- **Priority score:** 70 (as a monitoring item; not an implementation item)
- **Recommended action:** Re-run URL Inspection + GSC query for `/praxen` in 2–4 weeks. Do not
  merge, redirect, or noindex either page before then.
- **Implementation status:** Not implemented (correctly — see master report §6, §20).
- **Measurement method:** URL Inspection API + GSC query×page for `/praxen`, checkpoint
  2026-09-12 and 2026-09-26.
- **Dependencies:** Time (Google indexation lag), nothing else.

---

### BL-04 — Bayreuth Performance title alignment

- **Priority:** P1 (implemented)
- **Category:** Quick-win / CTR-SERP presentation
- **Affected URL(s):** `/bayreuth/website-relaunch`
- **Query family:** website performance bayreuth (+ variant)
- **Evidence:** Position 7.0–7.2, 49 combined impressions, +729% period-over-period, 0 clicks;
  Lighthouse mobile performance 95/100 confirms the ranking is earned, not accidental; title
  omitted the word "Performance" entirely (shared evidence §7b, §6, §9)
- **Commercial intent:** High
- **Expected business impact:** MEDIUM-HIGH (small page-1-adjacent opportunity, real €2–7k service
  line)
- **Confidence:** High
- **Effort:** Very low (2-line diff)
- **Risk:** Low — reversible, isolated, verified
- **Priority score:** 82
- **Recommended action:** Implemented this session.
- **Implementation status:** **DONE.** `claude/seo-bayreuth-performance` @ `a77faba`, pushed, not
  merged. Full verification passed (typecheck, build/prerender, lint, 2,057 tests).
- **Measurement method:** GSC query×page re-pull at 7/14/28 days (2026-09-05, 2026-09-12,
  2026-09-26); rollback trigger = position degrades >5 spots on either target query or on the
  page's other ranking queries.
- **Dependencies:** None.

---

### BL-05 — Resolve München pricing-page cannibalization

- **Priority:** P2
- **Category:** Cannibalization
- **Affected URL(s):** `/muenchen/webdesign-kosten`, `/muenchen/landingpage`, `/muenchen/webdesign`
- **Query family:** webdesign münchen preise / landingpage kosten münchen
- **Evidence:** Combined family +105% period-over-period (102→209 impr), split across 3 URLs,
  best position 14.0–19.9, no single clear owner (shared evidence §7, cannibalization table)
- **Commercial intent:** High (pricing = late-funnel)
- **Expected business impact:** MEDIUM
- **Confidence:** Medium — cannibalization pattern is clear, but the correct resolution (which URL
  should own "Preise/Kosten in München") requires an owner content decision, not just a technical
  fix
- **Effort:** Medium (requires content/internal-link changes across 3 pages)
- **Risk:** Medium — touching 3 interlinked pages without a clear single-owner decision could
  worsen rather than resolve the cannibalization
- **Priority score:** 60
- **Recommended action:** Owner decides which URL should own pricing intent for München before any
  code change; implement as an isolated experiment afterward.
- **Implementation status:** Not implemented — evaluated as a candidate second experiment this
  session and explicitly rejected for insufficient confidence in a single clean fix (master report
  §20).
- **Measurement method:** GSC query×page trend on the pricing family once a direction is chosen.
- **Dependencies:** Owner decision (master report §19.5).

---

### BL-06 — Bayreuth "Webentwicklung" ownership / positioning decision

- **Priority:** P2
- **Category:** Architecture / positioning
- **Affected URL(s):** `/` (homepage), `/bayreuth/webdesign`
- **Query family:** webentwicklung/webdesign/webagentur/webdesigner/webentwickler bayreuth
- **Evidence:** Homepage outranks `/bayreuth/webdesign` by 25–40 positions on every one of 5 query
  variants tested, 382 combined impressions, 0 clicks anywhere (shared evidence §7a; full analysis
  in master report §7)
- **Commercial intent:** High
- **Expected business impact:** MEDIUM (positions are still 6–19 on the winning page, page-1
  proximity exists but external authority likely caps further gains — see competitor findings)
- **Confidence:** High on the diagnosis (homepage wins due to internal authority + entity-identity
  signal); low on what to do about it (genuine positioning question)
- **Effort:** Unknown — depends entirely on the direction chosen
- **Risk:** High if forced — the homepage is currently the better-performing asset; suppressing or
  redirecting it to favor the weaker page would likely reduce total visibility
- **Priority score:** 55 (recommendation-quality item, not a queued implementation)
- **Recommended action:** Owner decides whether `/bayreuth/webdesign` should be repositioned around
  a sub-topic the homepage does not already own (pricing, process, a specific sub-service) rather
  than competing head-on. No overnight action.
- **Implementation status:** Not implemented — explicitly out of scope for overnight architecture
  changes.
- **Measurement method:** n/a until a direction is chosen.
- **Dependencies:** Owner decision (master report §19.3).

---

### BL-07 — Site-wide metadata source-of-truth audit

- **Priority:** P2
- **Category:** Technical / metadata consistency
- **Affected URL(s):** All `ClusterPageConfig`-driven pages (~60 pages: bayreuth/muenchen/regensburg
  city-service and cluster pages)
- **Query family:** n/a — technical hygiene
- **Evidence:** Confirmed live drift on `/bayreuth/website-relaunch` before tonight's fix:
  `publicRoutes.ts` title ("...Alte Website modernisieren...") differed from the page's own
  `ClusterPageConfig.seo.title` ("...Modernisierung & SEO-Neustart..."). `prerender.mjs` always
  writes the `publicRoutes.ts` version into the crawled HTML; the component's own title only
  affects the post-hydration document (shared evidence §10; master report §13).
- **Commercial intent:** n/a
- **Expected business impact:** MEDIUM (affects CTR/relevance signal accuracy across many pages;
  also a UX inconsistency — the browser tab can change title after JS hydrates)
- **Confidence:** High that the pattern exists broadly (confirmed on 1 of ~60 candidate pages;
  not yet audited across all of them)
- **Effort:** Medium — either add a CI check that fails on drift, or make `publicRoutes.ts` the
  single input every `ClusterPageConfig` reads from
- **Risk:** Low if done as a CI guard first (detection before remediation)
- **Priority score:** 50
- **Recommended action:** Audit all `ClusterPageConfig` pages for title/description drift against
  `publicRoutes.ts` in a dedicated future session; consider a CI assertion rather than a one-time
  fix, so new pages can't reintroduce the drift.
- **Implementation status:** Not implemented (fixed only for the one page touched by BL-04, as a
  side effect of that experiment's own scope).
- **Measurement method:** A CI check (pass/fail), not a GSC metric.
- **Dependencies:** None.

---

### BL-08 — KI-Telefonassistent × Arztpraxis comparison content

- **Priority:** P2
- **Category:** First-party evidence / E-E-A-T / GEO
- **Affected URL(s):** `/ki-telefonassistent-arzt` (or a new linked asset)
- **Query family:** KI-Telefonassistent × Arztpraxis (comparison-intent sub-queries: "...vergleich",
  "...kosten")
- **Evidence:** Live competitor research shows this SERP is currently won by comparison/aggregator
  content (`praxisconcierge.de`, `medizinio.de`) and an established vertical brand (Doctolib).
  Cogniiq already has genuine, verifiable differentiators (capped pricing, no-recording privacy
  stance, live demo) not yet presented in comparison format (master report §9, §11).
- **Commercial intent:** Very high
- **Expected business impact:** HIGH
- **Confidence:** Medium — the content gap is clear; whether it moves rankings against an
  entrenched incumbent brand is uncertain
- **Effort:** Medium — requires only verifiable claims about Cogniiq's own product, no fabricated
  competitor claims
- **Risk:** Low if strictly limited to Cogniiq's own verifiable facts; reputational/legal risk if
  it makes unverified claims about named competitors
- **Priority score:** 58
- **Recommended action:** Owner authorizes scope (can it name competitors directly, or should it
  stay generic "vs. traditional answering services"?) before drafting.
- **Implementation status:** Not implemented — content creation, requires owner authorization on
  competitor-naming scope (master report §19.2).
- **Measurement method:** GSC position/impressions on comparison-intent sub-queries once published.
- **Dependencies:** Owner decision on scope; ties to BL-02 and BL-03 (don't build competing assets
  in parallel with the `/praxen` question unresolved).

---

### BL-09 — NAP/citation and local authority pass

- **Priority:** P2
- **Category:** External authority
- **Affected URL(s):** sitewide (Google Business Profile, directories, not code)
- **Query family:** all local/city query families
- **Evidence:** Competitor findings (master report §9) show entrenched local incumbents;
  qualitative assessment that external authority is a real ceiling (master report §10)
- **Commercial intent:** n/a (foundational)
- **Expected business impact:** MEDIUM (foundational, compounds with other work)
- **Confidence:** Medium — directionally correct, magnitude unmeasured (no backlink API available)
- **Effort:** Low-medium, non-code
- **Risk:** Low
- **Priority score:** 45
- **Recommended action:** Execute the 30-day authority plan in master report §10, starting with
  Week 1 NAP consistency check.
- **Implementation status:** Not implemented — non-code, owner/operations task.
- **Measurement method:** Google Business Profile insights; GSC position trend on local queries
  over 60–90 days (slow-moving signal, not a quick check).
- **Dependencies:** None technical.

---

### BL-10 — Minor: unrelated `.bolt/config.json` crash in `test-seo-consistency.mjs`

- **Priority:** P3
- **Category:** Technical (test tooling)
- **Affected URL(s):** none (build tooling only)
- **Query family:** n/a
- **Evidence:** Surfaced incidentally during this session's GA4 branch review: the SEO consistency
  test script crashes on a path-join bug involving `.bolt/config.json`, but only *after* all
  GA4/consent-specific assertions have already completed successfully. Not investigated further —
  out of scope for the GA4 review it was found during.
- **Commercial intent:** n/a
- **Expected business impact:** LOW (does not block the GA4 branch's own correctness; may mask
  other CI signal if the script exits before running later checks)
- **Confidence:** Medium — confirmed to occur, root cause not fully diagnosed
- **Effort:** Low, once diagnosed
- **Risk:** Low
- **Priority score:** 25
- **Recommended action:** Diagnose and fix in a future session; verify no other CI assertions are
  silently skipped because of the crash.
- **Implementation status:** Not implemented — flagged only.
- **Measurement method:** CI passing green end-to-end.
- **Dependencies:** None.
