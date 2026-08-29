# Cogniiq Website Improvement — Master Report, 2026-08-29

Coordinator branch: `claude/cogniiq-website-audit-rswgrv`, based on `origin/main` @ `7d9c532`.
Seven specialist audit reports: `docs/audit-2026-08-29/`.
Prior evidence reused, not repeated: `claude/seo-overnight-master-2026-08-29`.

---

## 1. Inventory of available skills and agents

This section is deliberately blunt, because the honest answer changes how the rest
of the report should be read.

**There are no domain-specialist agents installed in this environment.** The agent
roster is generic:

| Agent type | Specialty | Used? |
|---|---|---|
| `general-purpose` | none — a general agent with full tools | **Yes, ×7** (see §2) |
| `Explore` | read-only fan-out search | No — the seven briefs already covered the surface |
| `Plan` | implementation planning | No — the coordinator owned sequencing |
| `claude` | catch-all | No |
| `claude-code-guide` | Claude Code/SDK/API questions | No — not a website task |
| `statusline-setup` | status line config | No |

Enabled skills:

| Skill | Specialty | Used? |
|---|---|---|
| `graphify` (project-local) | repo knowledge graph | **Yes** — architecture orientation before any grep |
| `docx` / `pptx` / `pdf` / `xlsx` | document formats | No — deliverables are code + Markdown |
| `skill-creator` | authoring skills | No |
| `morning`, `import-memory` | personal workflow | No |
| `code-review`, `security-review`, `simplify` | code quality | No — see §3 |
| `artifact-*`, `design`, `dataviz` | visual artifacts | No — the deliverable is a repo change |
| `run`, `loop`, `init`, `update-config` | workflow | No |

Enabled plugins: `sales`, `productivity`, `cowork-plugin-management` — none relevant.

MCP servers available: `github` (used), `Supabase` (**deliberately untouched**),
`Google_Drive`, `Google_Calendar`, `Microsoft_365` (not relevant).

**So there was no "technical SEO agent", no "accessibility agent", no "CRO agent"
to invoke.** What follows was produced by seven scoped, read-only briefs I wrote
over the generic `general-purpose` agent, each bound to an evidence standard
(`file:line` or rendered-HTML quote), a KNOWN/LIKELY/UNCERTAIN discipline, a
no-fabrication rule, and the live-experiment protection list. Any report that
describes these as installed specialists would be overstating the environment.

## 2. Which agents were used, and for what

| # | Role assigned | Scope | Verified in a real browser? |
|---|---|---|---|
| A | Technical SEO | metadata drift, canonicals, robots, sitemap, headings, link graph, prerender scripts | no (static + dist HTML) |
| B | Structured data / entity | all 435 JSON-LD blocks across 93 documents, entity coherence, NAP | no |
| C | Information architecture | route inventory, real link graph from dist, orphans, thin/redundant pages | no |
| D | Content quality / topical authority | contradictions, unverified live claims, information gain, city-page substitution | no |
| E | Trust / E-E-A-T | Impressum vs §5 DDG, NAP, claims vs evidence, honest-credibility options | no |
| F | CRO / UX / mobile / accessibility | five journeys, WCAG audit, consent banner, forms | **yes** — Playwright/Chromium, 390×844 and 1440×900 |
| G | Performance / CWV | bundles, dependencies, fonts, images, measured CWV, hydration | **yes** — Playwright, throttled mobile profile |

Every P0/P1 I acted on I re-verified myself before implementing. That mattered:
**three specialist claims were wrong or overstated and were corrected** (§4).

## 3. What was not used, and why

- `code-review` / `security-review` / `simplify` — these review a diff for bugs and
  quality. The task was an audit of a live website, and the diffs produced are
  small and individually verified. Running them would have added process, not
  evidence.
- `Explore` / `Plan` agents — the seven briefs were already scoped; adding a
  planning agent would have diluted coordinator ownership, which the task
  explicitly required to stay single-owner.
- `Supabase` MCP — out of bounds by the task's own guardrails. Not called once.
- Artifact/design skills — the deliverable is repository change plus this report.

---

## 4. Specialist claims I corrected

Recording these because an audit that laundered them would be worse than useless.

1. **"5 of 7 live experiments are contaminated and unmeasurable" (agent A) — overstated.**
   The drift is real, but four of those five experiments' treatments were *internal
   links and FAQ content*, not title/description. I verified München's treatment is
   present in the crawled document. The two experiments that genuinely were metadata
   changes (`/bayreuth/website-relaunch` title, `/kosten-ki-telefonassistent`
   description) had **both sides correctly synced** by the prior session. Corrected
   verdict: drift adds measurement noise to four pages; it makes no experiment's
   treatment undefined.

2. **"FAQ answers appear in 0 of 71 pages" (agent B) — wrong count.**
   Measured: **21 of 71** pages do render them. Two different FAQ code paths exist;
   only one is broken. (Agent D's independent 408/496 across 51 pages is the
   accurate framing.)

3. **My own earlier statement that München's FAQ treatment was "in the crawled
   HTML" — imprecise, corrected mid-session.** It is in the document, but **only
   inside JSON-LD**, not as visible body text. Half that experiment's treatment
   reaches Google as schema only.

4. **BL-10 (`.bolt/config.json` crash in `test-seo-consistency.mjs`) — refuted.**
   Ran it; exits 0. Backlog item can be closed.

Also corrected: a `grep` of mine returned a false negative because the copy uses a
non-breaking space (`90 %`). The agent was right and I was briefly wrong.

---

## 5. Executive diagnosis — the real remaining constraints

The prior session's core finding stands and I did not find evidence against it:
**this is a ranking problem, not a CTR or conversion problem.** 83% of non-branded
impressions sit at position 40+; one non-branded click site-wide in 28 days.

What this session adds are **three structural constraints the previous audit did
not identify**, all mechanical rather than strategic:

**Constraint 1 — Google is not being shown a site hierarchy.** The prerendered
homepage's `<nav>` contains **4 links**. The mega-menu panels are `useState`-gated,
so the SSR output emits `<button aria-expanded="false" aria-controls="nav-panel-…">`
where **no element with that id exists in the document**. All 21 designed navigation
destinations reach a crawler only through a **98-link footer** replicated on all 91
pages. Of the homepage's 79 unique internal destinations, **78 are in the footer and
1 is not**. Internal PageRank is therefore near-uniform: `/impressum` is treated like
`/bayreuth/webdesign`. A site that cannot express which pages matter cannot ask a
crawler to rank them differentially. This is the single most credible mechanical
explanation for "90+ indexable pages, almost all at position 40+".

**Constraint 2 — the site contradicts itself, and the contradictions are on the
money pages.** 74 of 92 documents shipped schema that disagreed with their own
`<title>`. `/automatisierung-arzt` claimed four named PVS integrations that
`/integrationen` explicitly denies and that `OWNER-INPUT` B3 ordered removed.
`/kosten-ki-telefonassistent` stated a 90% automation rate one screen above a widget
defaulting to 20%. `/bewertungen` promised "echte Bewertungen" in its SERP snippet
above a page saying none are published. None of that is an SEO tactic problem; it is
a credibility problem in a market (medical practices) that verifies claims.

**Constraint 3 — the conversion path was mechanically broken on mobile.** The
consent banner covered the only navigation that exists below `lg`. Measured, not
inferred. Mobile is where this site's CTR is several times desktop's.

**Beneath all three, the prior session's conclusion remains true and is the binding
constraint: external authority.** The two highest-value query families compete
against Doctolib and against awarded local agencies with a decade of tenure. Nothing
in this repository fixes that. Fixing Constraints 1–3 makes the site *deserve* and
*capture* the ranking it can get; it does not manufacture domain authority.

---

## 6. Top 10 highest-impact improvements

Ranked by expected contribution to qualified leads, not by SEO tidiness.

| # | Improvement | Status | Why |
|---|---|---|---|
| 1 | Consent banner no longer blocks mobile navigation | **DONE (PR #61)** | Every phone visitor was blocked from navigating. Measured. |
| 2 | Remove unsubstantiated PVS integration claims | **DONE (PR #60)** | Live, indexable, contradicts own pages + blocking Phase-0 rule. Highest due-diligence risk. |
| 3 | Server-render the navigation so the hierarchy is crawlable | **NOT DONE — see §8** | Biggest structural SEO lever found; also the riskiest mid-experiment. |
| 4 | Fix the 90% vs 20% contradiction (Z0) | **DONE (PR #60)** | Project's own doc calls it the single largest page risk. |
| 5 | Align schema to the served head on 74 routes + CI guard | **DONE (PR #59)** | Removes a contradictory signal sitewide; zero risk to indexed titles. |
| 6 | Contact form labels + focus indicators | **DONE (PR #61)** | WCAG A/AA on the one page every lead passes through. |
| 7 | Render FAQ answers into the DOM (408 answers, 51 pages) | **NOT DONE — see §8** | Large genuine content gain, but would perturb 5 of 7 experiments. |
| 8 | Strip framer-motion `opacity:0` from prerendered output | **NOT DONE — see §8** | Measured **−1.6s LCP**; `/kontakt` paints nothing for 2.4s. |
| 9 | Un-noindex `/integrationen` + `/datenschutz-sicherheit` | **NOT DONE — owner call** | The two most credible pages on the site are hidden from Google. |
| 10 | Reduce the footer from 98 links to a real hierarchy | **NOT DONE — see §8** | Same root cause as #3; needs #3 decided first. |

---

## 7. What was implemented

### PR #59 — technical / metadata / schema
`scripts/prerender.mjs`, `.github/scripts/test-prerender-output.mjs`, `src/pages/FAQPage.tsx`

- WebPage JSON-LD `name`/`description` realigned to `PUBLIC_ROUTES` on **74 routes**.
- New CI assertion comparing schema to the **served** head (the previous title check
  compared the manifest to itself, so it structurally could not catch this).
  Negative-tested: fails on an unaligned build.
- `/faq` given an `<h1>` — it was the only public route without one.

### PR #60 — trust / content honesty
`AutomatisierungArzt.tsx`, `blog-data.ts`, `telefonassistent-copy.ts`,
`WebdesignArzt{Muenchen,Regensburg,Bayreuth}.tsx`, `publicRoutes.ts`, `BewertungenPage.tsx`

- PVS names (Tomedo, Medistar, Dampsoft, CGM, Samedi, Doctolib, Turbomed) removed;
  replaced with the site's own established honest wording from `/integrationen`.
- 90% automation claim removed; prose now describes the slider rather than
  duplicating a value maintained in two places.
- Literal `[Fachrichtung]` placeholder removed from visible copy on 3 pages.
- `/bewertungen` description made truthful in both manifest and component.

### PR #61 — UX / CRO / accessibility
`ConsentBanner.tsx`, `ContactSection.tsx`

- Consent banner lifted clear of the mobile nav pill; footprint 43% → 36% of a
  390×844 viewport. **No consent text altered** — layout only.
- Contact form: five controls bound to labels; visible focus ring restored;
  placeholder contrast raised off 1.47:1.

---

## 8. What was deliberately NOT implemented, and why

This is the more important list.

| Finding | Severity | Why not now |
|---|---|---|
| **Server-render nav panels** (4 crawlable header links today) | P1, high value | Adds ~21 sitewide links, changing global internal-authority distribution — which is precisely the variable the three live internal-link experiments (`dee7545`, `57cab33`, `ca9549e`) are measuring. Shipping it now would confound all three. **Do this immediately after the 28-day readout.** |
| **FAQ answers into the DOM** (408 answers, 51 pages) | P1, high value | Measured: **5 of 7 experiment routes** would each gain 9–12 answers of crawlable body text. That is a material mid-flight content change to every one of them. |
| **Hydration title drift** (~65 routes) | P1 | The correct fix removes duplicate strings from 34 call sites; the cheap fix imports the 54 KB manifest into the client bundle, which the performance audit shows is already oversized. Would also change the *rendered* title on all 7 experiment pages. |
| **framer-motion `opacity:0` in SSR** (−1.6s LCP measured) | P1 | Genuinely valuable and metadata-neutral, but a sitewide render-behaviour change with real animation-regression risk. Deserves its own PR and visual review, not a bundle-in. |
| **Supabase in the entry chunk** (54 KB gz on all 93 pages; blocks mount on 46 chunks) | P1 | Architectural. `vite.config.ts` and `main.tsx` both document a React #421 hazard that the current arrangement exists to avoid. Not a change to make casually. |
| **Duplicate `@id` nodes** (`#organization`/`#localbusiness`/`#website` each defined twice on 92 pages) | P1 | Real entity defect. Requires deciding which of two emitters is canonical — an architecture call I did not want to bundle into a PR whose value is already proven. |
| **Un-noindex `/integrationen`, `/datenschutz-sicherheit`** | P1 | Indexing decisions are the owner's, and these pages sit closest to unanswered `OWNER-INPUT` items. Recommended, not taken. |
| **`<form>` element on `/kontakt`** | P1 | Changes submission semantics. Own PR. |
| **Any redirect, noindex, merge, deletion, or consolidation** | — | Forbidden without overwhelming evidence. None taken. The thin/redundant list in `C-architecture.md` is flagged for owner review only. |
| **Any new page, city×service combination, or content matrix** | — | Explicitly rejected. The site has ~91 routes and a hierarchy problem, not a page-count problem. |

---

## 9. Exact files changed

```
PR #59  scripts/prerender.mjs                        +46
        .github/scripts/test-prerender-output.mjs    +64
        src/pages/FAQPage.tsx                         +5

PR #60  src/lib/blog-data.ts                          3 answers rewritten
        src/lib/telefonassistent-copy.ts             +12 / -8
        src/lib/routing/publicRoutes.ts               description + rationale
        src/pages/BewertungenPage.tsx                 description
        src/pages/industries/AutomatisierungArzt.tsx  FAQ answer
        src/pages/WebdesignArzt{Muenchen,Regensburg,Bayreuth}.tsx  placeholder

PR #61  src/components/ConsentBanner.tsx             +19 / -4
        src/components/ContactSection.tsx            +43 / -17
```

## 10. PRs

- https://github.com/Cogniiq2/Cogniiq_Main/pull/59 — technical / metadata / schema
- https://github.com/Cogniiq2/Cogniiq_Main/pull/60 — trust / content honesty
- https://github.com/Cogniiq2/Cogniiq_Main/pull/61 — UX / CRO / accessibility

**None merged. None deployed.**

## 11. Preview URLs

Cloudflare Pages builds a preview per pushed branch. The three branches are pushed;
preview URLs are assigned by Cloudflare and appear on each PR once the build
completes. I cannot mint or predict those URLs, so I am not quoting any.

## 12. Test / build results

| Check | PR #59 | PR #60 | PR #61 |
|---|---|---|---|
| `typecheck` | clean | clean | clean |
| `lint` | 0 errors, 24 pre-existing warnings | same | same |
| `test` | 79 files, **2071 passed** / 1 skipped | 2070 passed, 1 pre-existing flake | 2070 passed, 1 pre-existing flake |
| `build` | 91/91 prerendered | 91/91 | 91/91 |
| `test-prerender-output.mjs` | pass (+ new assertion, 91 routes) | pass | pass |
| `test-seo-consistency.mjs` | pass | pass | pass |
| `consent.test.ts` | — | — | **14/14 pass** |

**Pre-existing failure, present on untouched `origin/main`:**
`src/pages/owner/serviceOnboarding.test.tsx > pre-migration behaviour > saves the
customer and explains the service could not be provisioned yet`. Timing-sensitive
(fails 1–2 of 2072 in a full run, passes in some runs, unrelated owner/admin
surface). **Not introduced by this work and not fixed by it.**

## 13. Risks

- **PR #59** — lowest risk of the three. Verified by diffing all 93 documents: zero
  head-field changes. Residual risk: the schema realignment runs at build time; if
  `PageSEO`'s block id ever changes, the function silently no-ops. The new CI
  assertion is what catches that.
- **PR #60** — copy changes on live pages. The replacement wording is reused from
  `/integrationen`, not invented. Residual risk: if the PVS integrations *are*
  substantiable, the site is now under-claiming. That is the correct direction of
  error while `OWNER-INPUT` B3 is unanswered.
- **PR #61** — layout change to a consent surface. Consent *behaviour* is untested by
  me beyond the 14 existing tests, which pass; the change is CSS-class only.
  Should be eyeballed on a real phone before merge — my verification was headless
  Chromium at one viewport.

## 14. Effect on the live 2026-08-29 experiments

Verified against a byte-for-byte snapshot of the pre-change build, not asserted.

| Experiment URL | title | description | canonical | robots | h1 | links | visible text |
|---|---|---|---|---|---|---|---|
| `/bayreuth/website-relaunch` | = | = | = | = | = | = | = |
| `/regensburg/website-relaunch` | = | = | = | = | = | = | = |
| `/ki-telefonassistent-arzt` | = | = | = | = | = | = | = |
| `/bayreuth/webdesign` | = | = | = | = | = | = | = |
| `/muenchen/webdesign` | = | = | = | = | = | = | = |
| `/muenchen/webdesign-kosten` | = | = | = | = | = | = | = |
| `/kosten-ki-telefonassistent` | = | **=** | = | = | = | = | **1 sentence (Z0)** |

The only change on any experiment URL is the Z0 honesty fix on
`/kosten-ki-telefonassistent`. That page's measured variable — its meta description —
is unchanged. Flagging it explicitly rather than deciding silently: fixing a
contradiction the project ranks as its largest single risk was judged to outweigh a
one-sentence body delta.

Additionally, PR #59 changes the JSON-LD `name`/`description` on the experiment
pages (that is its purpose). This *removes* a contradictory signal; it does not
alter any tested string.

## 15. Off-site constraints that code cannot solve

Unchanged from the prior audit, and I found no evidence against them:

- Domain authority against Doctolib (KI-Telefonassistent × Arztpraxis) and against
  awarded, decade-tenured local agencies (Webdesign Bayreuth).
- **Zero published customer proof.** `/referenzen` and `/bewertungen` are honest
  about this; the blocker is client authorisation, not content capacity.
- `sameAs` is a self-reference and all social profiles are empty strings — the
  entity has no external corroboration. Owner input required; nothing invented.
- **Zero photographs across all 93 documents**, and zero `<img>` elements at all.
  A web design agency with no visual evidence of its work and no image-search surface.
- Google Business Profile / NAP citation work — entirely off-repo.

## 16. Measurement plan

**Day 7 (2026-09-05)** — do not judge rankings yet.
- Confirm the three PRs' effect in production HTML: schema matches title on 91 routes;
  PVS names, 90%, `[Fachrichtung]` absent; consent banner clear of the nav on a real phone.
- GA4 (now live): first mobile engagement data. Specifically compare mobile
  bounce/engagement before vs after the banner fix — that is the one change with a
  fast, observable behavioural signal.
- Continue the existing Bayreuth Performance and Regensburg checkpoints unchanged.

**Day 14 (2026-09-12)**
- GSC: position on the seven experiment URLs. Expect no movement attributable to
  this work; the point is to confirm **no regression**.
- `/praxen` indexation check (still the open BL-03 question).
- GA4: mobile conversion path — does anyone now reach `/kontakt` from a phone?

**Day 28 (2026-09-26)**
- Full readout on the 2026-08-29 experiments. **This is the gate.** Once they read
  out, the deferred items in §8 (server-rendered nav, FAQ answers, hydration title
  drift) become safe to ship and should be sequenced first.
- Re-pull impressions for the 74 realigned routes: the hypothesis is that removing
  the schema/title contradiction is neutral-to-slightly-positive. If any of those
  pages regressed, the realignment is the first thing to examine.

## 17. Prioritised 30-day backlog

Extends `docs/SEO-MASTER-BACKLOG.md` (BL-01 done, BL-02 done, BL-04 done, BL-05
partly done, **BL-10 refuted — close it**).

| # | Item | Priority | Gate |
|---|---|---|---|
| N-01 | Server-render nav panels; then cut the 98-link footer to a real hierarchy | P1 | **After 28-day readout** |
| N-02 | Render FAQ answers into the DOM (408 answers, 51 pages) | P1 | After readout |
| N-03 | Strip framer-motion `opacity:0` from SSR output (−1.6s LCP) | P1 | Anytime; own PR + visual review |
| N-04 | Owner decision: un-noindex `/integrationen` + `/datenschutz-sicherheit` | P1 | Owner |
| N-05 | Answer `OWNER-INPUT` B3 (PVS) and F4 (Übernahmequote) | P1 | Owner — unblocks restoring real claims |
| N-06 | De-duplicate `#organization`/`#localbusiness`/`#website` `@id` nodes | P1 | Anytime |
| N-07 | Remove duplicate title/description strings from 34 `PageSEO` call sites | P1 | After readout |
| N-08 | Wrap `/kontakt` fields in a real `<form>`; add error identification | P1 | Anytime |
| N-09 | Move Supabase/AuthProvider off the public entry chunk | P2 | Needs care (React #421) |
| N-10 | `Offer.price` "ab 1.500 €" → `priceSpecification` on 2 cost pages | P2 | Anytime |
| N-11 | Publish real photographs / any visual proof of work | P2 | Owner — assets |
| N-12 | Fix remaining contradictions agent D catalogued (delivery time has 5 answers; first-call duration has 4) | P2 | Anytime |
| N-13 | `/kosten-ki-telefonassistent` sole CTA at 92% scroll depth | P2 | After readout (experiment page) |
| N-14 | Mobile horizontal overflow 49–63px on 4 pages | P2 | Anytime |
| N-15 | Two `<main>` landmarks on most route families | P2 | Anytime |
| N-16 | NAP/GBP citation work; earn external links | P1 (off-repo) | Owner |

## 18. What I would do first, if only one thing

Not an SEO change. **Answer `OWNER-INPUT` B3 and F4.** Two unanswered questions are
currently forcing the site to either make claims it cannot support or stay silent
where it has genuine differentiators. Agent D found substantial verifiable
first-party material sitting unpublished in this repository — a 16-phase go-live
process with a server-enforced gate, a pre-go-live test battery including
prompt-injection and vulnerable-caller handling, three named outage routes. That is
exactly the "information gain" the site lacks, it is real, and it is blocked on
owner confirmation rather than on writing.
