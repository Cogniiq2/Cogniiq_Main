# SEO_AUDIT_2026 — cogniiq.de, technical SEO audit and implementation

Date 2026-10-23 · Branch `claude/seo-audit-2026-10` (base `ed0f8e4`) · Nothing deployed.

**Data basis and its limits.** The Search Console export for this pass was announced
but had not arrived when the audit closed; `/mnt/user-data/uploads` stayed empty. Every
figure below comes from (a) the owner's written summary of 2026-10-23 and (b) the
September 2026 exports already documented in `docs/seo/`. Where a decision needs
Query×Page data, it is marked **open** rather than guessed. `scripts/seo/gsc-analyze.mjs`
is ready to run against the export the moment it lands (`node scripts/seo/gsc-analyze.mjs
<folder>`); section 2 should then be re-cut from real rows.

---

## 1 · Executive summary

- The site is technically sound in the ways that matter most (prerendered HTML for every
  indexable route, one route manifest as the only head source, correct canonicals,
  consistent noindex handling, 301 table under test). The remaining technical debt was
  duplicate structured data, a duplicate national pillar, nested landmarks, stale "2025"
  titles and a contradictory `robots.txt` rule — all fixed on this branch.
- The real problem is **not technical**. 6,448 impressions produced 9 clicks (0.14 %) at an
  average position of 35.9. The domain is seen for the right queries and clicked for none
  of them, because almost every commercial query sits on page 3–5 and the one page-1 asset
  (`/ki-telefonassistent-zahnarztpraxis`, pos. 8.9) has 85 impressions. The CTR number is a
  position problem, not a snippet problem.
- Positions are held back by two things the repository could fix and one it cannot:
  (1) the strongest commercial cluster (practice telephone) had three pages for one head
  term and its best URL was frozen for two months — fixed: one owner per intent, Arzt page
  rebuilt; (2) the cost page sat one position short of page 1 with an unanswered generic
  intent — extended; (3) **zero third-party evidence** (no customer release, no audio sample,
  no external mentions in the medical vertical). That is the ceiling, and it is listed in
  `SEO_EXTERNAL_ACTIONS.md`.
- Period-over-period the average position improved from 54.7 to 35.9 while impressions
  fell from 9,458 to 6,448. That pattern is consistent with the September consolidation
  work shedding low-quality long-tail impressions (city × service pages, the collapsed
  `/webdesign` family) rather than with a penalty. It is the expected shape of a
  consolidation and should not be reversed.
- Expected effect of this branch: higher probability of page-1/2 positions for the
  "ki telefonassistent kosten" and "(ki) telefonassistent arztpraxis" families within one
  to two crawl cycles, no loss on the dental winner, cleaner rich-result eligibility
  site-wide. No ranking is guaranteed; every change carries a measured abort criterion in
  `docs/seo/organic-growth-scoreboard.md`.

## 2 · Current GSC diagnosis

| Metric | Last 28 d | Prior comparable | Reading |
|---|---|---|---|
| Clicks | 9 | 12 | Statistically noise; neither number supports a trend claim |
| Impressions | 6,448 | 9,458 | –32 %, concentrated in webdesign city/long-tail pages after September consolidation |
| CTR | 0.14 % | 0.13 % | At pos. 36 any CTR is noise; not a snippet problem |
| Avg. position | 35.9 | 54.7 | +19 positions: fewer, better impressions |

Pages (owner summary): `/kosten-ki-telefonassistent` ≈ 299 impr., pos. 19 ·
`/ki-telefonassistent-zahnarztpraxis` ≈ 85, pos. 8.9 · `/ki-telefonassistent-arzt` ≈ 471,
pos. 35 · `/ki-telefonassistent` ≈ 272, pos. 40 · `/automatisierung-immobilien` pos. 20 ·
`/webdesign-hotel` ≈ 1,184, pos. 18 · `/regensburg/website-relaunch` pos. 11.

Queries: "ki telefonassistent kosten" 143 / pos. 19 · "ki telefonassistent preise" 33 /
18 · "ki telefonassistent arztpraxis" 111 / 40 · "telefonassistent arztpraxis" 83 / 34 ·
"telefonassistent arzt" 42 / 26.

What this says:

1. **Two query families carry the commercial demand**: cost (≈ 176 impr.) and
   Arztpraxis (≈ 236 impr.). Both are owned by one URL each after this branch.
2. **The dental page is the proof that the content model works**: a page built on a
   call-reason framework with explicit limits reached page 1 in six weeks without a single
   backlink. The Arzt rebuild follows the same model.
3. **`/webdesign-hotel` is the largest impression source and converts nothing** — hotels
   searching "webdesign hotel" at pos. 18 are not Cogniiq's buyer (priority 6). It was
   protected, not invested in.
4. **Open until the export arrives**: whether the September `/webdesign` collapse recovered
   (last known: impressions → 0 on 2026-09-01, canonical question in GSC); whether the
   `/<stadt>/website-erstellen` and `/<stadt>/landingpage` micro pages receive any
   impressions at all (F4); the device split (all practice pages are read at the front desk
   on desktop — if the export shows > 60 % mobile the hero order matters more).

## 3 · Business-priority diagnosis

| Priority | Cluster | State found | State after branch |
|---|---|---|---|
| 1 | KI-Telefonassistent (flagship + cost) | Flagship pos. 40 with generic description; cost page pos. 19 but framed for practices while receiving generic intent; calculator present | Flagship links each segment; cost page answers the generic intent, three price FAQs, market billing-model comparison |
| 2 | Dentists | Page 1, thin inbound links (2), no cost/data-protection follow-ups | Untouched structurally; +2 additive paragraphs; inbound links from Arzt, cost, nav, flagship |
| 3 | Doctors | Best URL frozen and template-driven; sibling page on same term collapsed to 1 impression; blog post on the same head term | Standalone owner page; sibling retargeted to therapy; blog retargeted informational |
| 4 | Automation | Pillar rebuilt in September, windows still open | Only claim hygiene (city FAQs with invented prices/durations removed) |
| 5 | Industry automation | `/automatisierung-immobilien` pos. 20, `/automatisierung-arzt` head promised "Terminbuchung" without PVS evidence | Arzt-automation head corrected; immobilien untouched (measurement open) |
| 6 | Webdesign | Duplicate national pillar; city cost tables with unverified euros; `/webdesign-hotel` large but off-target | Duplicate 301'd; claims hygiene on relaunch pages; cost tables left for owner decision W4 |

## 4 · Technical findings

Severity: H = affects indexing/ranking signals directly · M = quality/eligibility · L = hygiene.

| # | Finding | Sev. | Status |
|---|---|---|---|
| H1 | Duplicate national pillar `/webdesign-agentur-deutschland` vs `/webdesign` | H | **Fixed** (301, route removed) |
| H2 | Static Organization/WebSite/LocalBusiness JSON-LD in `index.html` duplicating the component graph on every page | H | **Fixed** |
| H3 | Edge middleware carried a per-route head override (`frozenHeadOverrides`) — the class of bug that drifted 29/86 heads in September | H | **Fixed** (empty; manifest is the only source) |
| H4 | `publicRoutes.ts` manifest is pulled into the client bundle; chunk-preload hints are emitted for 91 lazy routes | M | **Deferred** — bundle work, own branch (see §18) |
| H5 | Seven blog titles carried "2025"; `publishedAt` dates predated the repository | M | **Fixed** (year removed, dates set to verifiable first-commit dates) |
| M2 | Second `BreadcrumbList` via `WebPage.breadcrumb` | M | **Fixed** |
| M3 | `hreflang x-default` on every URL | L | **Fixed** (only `/`) |
| M4 | Hero image without reserved dimensions on hub pages (CLS risk) | M | **Deferred**, needs field data |
| M6 | `paymentAccepted` in LocalBusiness schema without any page stating it | L | **Fixed** |
| M7 | Articles without `author` entity page / `image` | M | `image` + `@id` fixed; Person authorship **deferred** until an author page exists |
| M9 | Nested `<main>` in 18 components | L | **Fixed** |
| L4 | `robots.txt` Disallow on a `noindex` URL | L | **Fixed** |
| — | `wrangler` `not_found_handling`, repeated anchors on templated city pages, Lighthouse bundle size | L | **Deferred** |

Verified sound: canonicals self-referential on all 86 sitemap URLs; `noindex` shell for
non-prerendered routes; prerender output contains a visible H1, manifest title and
description on every route; `_redirects` portable; sitemap generated from the manifest
(never hand-edited); security headers present; Cloudflare cache headers tested.

## 5 · Architecture findings

- The repo already enforces the right model: **one route manifest → head**, **one copy
  source → numbers** (`telefonassistent-copy.ts`), tests that fail when a page types a
  core number itself. Keep it; it is the reason the September consolidation did not
  produce silent regressions.
- Role model (`docs/seo/ARCHITEKTUR.md` §2) was violated in one place: the practice
  cluster had SEGMENT, SEGMENT and REDAKTION pages all addressing "Arztpraxis". Resolved
  (§14.1 there).
- Hub pages (`/ki-telefonassistent`, `/praxen`) linked segments weakly or not at all.
  Resolved: use-case cards and "Nach Branche" list link the owners; nav niche slots point
  at them.
- City × service pages (nine indexable) remain the largest maintenance surface for the
  least business value. Not touched here beyond claim hygiene; decision F4 needs the
  Query×Page export.
- Blog is no longer a dead end (M9 fixed in September); the one post on a commercial head
  term is retargeted.

## 6 · Cannibalization findings

| Term family | Competing URLs found | Resolution |
|---|---|---|
| "ki telefonassistent arztpraxis / telefonassistent arzt" | `/ki-telefonassistent-arzt` (template), `/ki-telefonassistent-praxis` (title "medizinische Praxen"), `/blog/ki-telefonassistent-arztpraxis` (title with the head term) | Arzt page owns; Praxis → therapy; blog → informational |
| "webdesign agentur" | `/webdesign`, `/webdesign-agentur-deutschland` | 301 |
| "ki telefonassistent kosten" (generic) landing on a practice-framed page | one URL, two intents | Generic section + FAQ on the cost page; owner question Q3 decides breadcrumb/schema naming |
| "ki telefonassistent praxis" | `/praxen` (no keyword H1) vs. the segments | `/praxen` keyword H1, declared hub |
| Not resolvable without data | `/<stadt>/website-erstellen` vs `/<stadt>/webdesign`; `/regensburg/webdesign` "website erstellen lassen regensburg" | **open** (F4) |

## 7 · Keyword-to-URL map

Maintained in `SEO_KEYWORD_MAP.md` (URL, purpose, primary intent, keyword family,
secondary terms, GSC signals, action, inbound-link sources, status). Summary of owners:

| Intent | Owner |
|---|---|
| ki telefonassistent (generic, Unternehmen) | `/ki-telefonassistent` |
| … kosten / preise / was kostet | `/kosten-ki-telefonassistent` |
| … praxis (overview) | `/praxen` |
| … arztpraxis / arzt | `/ki-telefonassistent-arzt` |
| … zahnarztpraxis | `/ki-telefonassistent-zahnarztpraxis` |
| … therapie / physiotherapie | `/ki-telefonassistent-praxis` |
| … einführen | `/ki-telefonassistent-einfuehren` |
| … restaurant / hotel | `/ki-telefonassistent-restaurant`, `/ki-telefonassistent-hotel` |
| prozessautomatisierung (+ kosten) | `/prozessautomatisierung`, `/kosten-automatisierung` |
| automatisierung <branche> | `/automatisierung-*` |
| webdesign (+ kosten, + branche, + stadt) | `/webdesign`, `/kosten-webdesign`, `/webdesign-*`, `/<stadt>/webdesign` |

## 8 · Priority-page analysis

### `/kosten-ki-telefonassistent` (pos. 19, ≈ 299 impr.)
Found: strongest commercial page; calculator; practice framing; competitors on page 1 answer
"pro Minute", "versteckte Kosten", "Modelle am Markt" explicitly. Done: those answers added
from first-party facts; generic-scope section; provider checklist. Not done: head/H1
(position is close to page 1; a head change would reset the signal). Open: Q3 (do tariffs
apply to every business?) decides whether the breadcrumb/schema name drops "Praxis".

### `/ki-telefonassistent-zahnarztpraxis` (pos. 8.9, ≈ 85 impr.)
Found: page 1 with two inbound links and no cost/data-protection follow-up. Done: additive
only; inbound links from Arzt page, cost page, flagship, nav. Not done: anything above the
fold. Abort rule: drop below pos. 12 → remove the two paragraphs.

### `/ki-telefonassistent-arzt` (pos. 35, ≈ 471 impr.)
Found: most impressions in the cluster, template body, frozen, head term shared with two
siblings. Done: standalone page on the dental model (call reasons with rules, limits, PVS
interface facts, data protection, cost, 8 FAQs, Service schema); owner of the intent.
Risk: head change; measured.

### `/ki-telefonassistent` (pos. 40, ≈ 272 impr.)
Found: generic hub competing with national SaaS vendors on a term where Cogniiq's
differentiator (practice depth, German hosting, no recording, capped billing) was not
surfaced in links. Done: segment links, description. Not done: H1/title — the flagship's
ranking is an authority question, not an on-page one; investing copy here before the
segments rank would be the wrong order.

### Others
`/automatisierung-immobilien` (pos. 20): untouched, measurement open; candidate for the
same additive FAQ treatment once the export confirms its queries. `/webdesign-hotel`
(pos. 18, 1,184 impr.): protected; off-priority. `/regensburg/website-relaunch` (pos. 11):
head protected; body claim hygiene only.

## 9 · Changes implemented

Full per-file log: `SEO_CHANGELOG.md`. In one paragraph: five frozen experiments
graduated and the edge head override removed; duplicate webdesign pillar 301'd; structured
data deduplicated and entity-referenced; one `<main>` per page; stale "2025" titles and
unverifiable dates corrected; `robots.txt`/`noindex` contradiction removed; ~40 unconfirmed
claims (prices, durations, fallback, load-time, outcome promises) removed across city
configs and pages; practice cluster given one owner per intent with a rebuilt Arzt page;
cost page extended with market comparison, provider questions, generic scope and price
FAQs; dental page given two additive paragraphs; flagship and navigation link the owner
pages; keyword map, external-actions list and a GSC analyser added; governance docs updated.

## 10 · Pages deliberately left unchanged and why

| Page | Why |
|---|---|
| `/ki-telefonassistent-zahnarztpraxis` (head, H1, structure) | page 1; only additive paragraphs with their own abort rule |
| `/regensburg/website-relaunch` (head) | pos. 11–12 |
| `/webdesign-hotel` | largest impression source; priority 6; a change would trade measurable impressions for nothing |
| `/kosten-ki-telefonassistent` (head, H1) | pos. 19 — one position from page 1; the signal should not be reset |
| Homepage title | positioning decision for the owner (`SEO_EXTERNAL_ACTIONS.md` #17); needs a measured experiment |
| `/prozessautomatisierung`, `/kosten-webdesign`, `/kosten-automatisierung`, `/webdesign` | rebuilt in September; measurement windows open |
| `/<stadt>/webdesign-kosten` euro tables | owner decision W4 pending; removing them changes the page's reason to exist |
| City × service micro pages (F4) | need Query×Page data before consolidation |
| All auth/admin/owner/customer surfaces | out of scope; untouched |

## 11 · Pages needing consolidation

| Candidate | Into | Evidence needed | Status |
|---|---|---|---|
| `/ki-telefonassistent-praxis` | `/praxen` | 56 days on the therapy head with 0–5 impressions | retargeted now; 301 if the abort criterion fires |
| `/<stadt>/website-erstellen` (3) | `/<stadt>/webdesign` | Query×Page export: do they hold any query the parent does not | **open** (F4) |
| `/<stadt>/landingpage` (3) | `/<stadt>/webdesign` or national `/webdesign` | same | **open** (F4) |
| `/blog/webdesign-konversion-tipps` + `/blog/website-ohne-anfragen` | one post | both informational on "website bringt keine anfragen"; export decides | **open** |
| `/webdesign-agentur-deutschland` | `/webdesign` | done | **done** (301) |

## 12 · External authority gaps

- No backlink data has ever been available to a session (`SEO_EXTERNAL_ACTIONS.md` #15).
  The authority thesis is argued from ranking shape (page-1 content with no links in a
  low-competition dental niche; page 3–4 for the same model where national vendors
  compete), not measured.
- Zero third-party evidence on the practice cluster: no customer release, no audio sample,
  no dashboard screenshot, no directory presence, no trade-press mention.
- Entity signals: Organization/LocalBusiness schema is complete and now deduplicated;
  Google Business Profile status unknown to the repo; no regional anchors (IHK,
  Wirtschaftsförderung) verified.
- Author entity: posts carry an "Redaktionelle Verantwortung" block but no Person page;
  deferred until the owner approves a public author profile.

## 13 · Backlink / digital PR plan

Priority order from `SEO_EXTERNAL_ACTIONS.md`: (1) GSC export + backlink baseline
(trivial, this week); (2) one written customer release and the audio sample — they unlock
every pitch below; (3) directory profiles in the medical-service-provider category the
competitors use; (4) Google Business Profile completion with consented reviews; (5)
regional anchors (IHK Oberfranken, Bayreuth Wirtschaftsförderung); (6) PVS vendor contact
→ the "what PVS integration really means" page → dental trade-press pitch (Spitta/ZWP) built
on the Zahnarzt call-reason framework; (7) original data asset "Anrufanlässe in Praxen"
once ≥ 3 deployments exist; (8) podcast/expert commentary with the Arzt page as artefact.
Explicitly not: bought links, PBNs, mass directories, invented awards, review schema before
real reviews.

## 14 · Missing real-world proof/content I need from the business

1. The Search Console export (Queries, Pages, Query×Page, Dates, Devices, Countries).
2. One customer release for the telephone assistant (anonymised is fine) with signed
   consent (`ASSETS-REQUIRED.md` A3).
3. Stimmprobe audio (A1) and a redacted dashboard screenshot (A2).
4. Answers to Q3 (tariffs generic or practice-only) and the open OWNER-INPUT items B4 (SIP /
   phone systems), B9 (fallback), B11a (concurrent calls), E3 (onboarding), H1 (surcharge
   basis), H3 (language package), CLAIM 616 (Erstgespräch duration).
5. Decision W4 on the city webdesign cost tables.
6. Decision on a public author profile (name, role, photo) for Person schema.
7. PVS vendor correspondence (RED, medatixx, CGM, tomedo) on interface capabilities.
8. Google Business Profile access or a screenshot of its current state.

## 15 · 30-day action plan

| Week | Action | Owner |
|---|---|---|
| 1 | Merge branch after preview review; request indexing in GSC for `/ki-telefonassistent-arzt`, `/kosten-ki-telefonassistent`, `/praxen`, `/ki-telefonassistent-praxis`; URL-inspect `/webdesign` canonical | Owner (deploy), Claude (prep) |
| 1 | Upload GSC export → run `scripts/seo/gsc-analyze.mjs`; re-cut §2, decide F4 and the blog merge | Owner → Claude |
| 1 | Backlink baseline (GSC Links + one free tool) | Owner |
| 2 | Answer Q3 and the OWNER-INPUT items; each answer becomes a FAQ on the owner page | Owner → Claude |
| 2 | Google Business Profile completion; first consented review requests | Owner |
| 3 | Customer release + audio sample collected; `TestimonialBlock`/`StimmprobeSection` go live (code exists) | Owner → Claude |
| 4 | First measurement read (day 28 is too early for verdicts; check for crawl, index and head adoption only) | Claude |

## 16 · 90-day action plan

- Day 28–56: verdicts on every scoreboard row; act on abort criteria (dental paragraphs,
  `/ki-telefonassistent-praxis` 301, `/praxen` H1).
- Deferred technical branch: manifest/bundle split (H4), hero CLS (M4), `not_found_handling`,
  anchor repetition on templates.
- Content, in this order and only with evidence in hand: PVS-integration page (needs vendor
  input), "Anrufanlässe" data asset (needs deployments), Person author page (needs
  approval).
- Authority: directory profiles, IHK/regional anchors, one trade-press pitch.
- Homepage positioning experiment (phone-first title) as a measured
  `PROTECTED_EXPERIMENT_PATHS` run — only after the cluster pages have moved, so the
  effect is attributable.
- F4 consolidation of city micro pages if the export shows no distinct queries.

## 17 · Expected leading indicators to monitor

| Indicator | Where | Early signal (2–4 weeks) | Verdict (8 weeks) |
|---|---|---|---|
| Crawl + head adoption | GSC URL inspection | new titles shown in SERP for Arzt, Praxis, Praxen | — |
| "ki telefonassistent arztpraxis" position | GSC Queries | movement out of 34–40 | ≤ 20 |
| Cost family position | GSC Queries | 19 → ≤ 15 | page 1 |
| Dental page | GSC Pages | pos. ≤ 9 held | no abort |
| Impressions per owner page vs. siblings | Query×Page | Arzt gains what Praxis/blog lose | one URL per query |
| Rich results | GSC Enhancements | 0 schema errors | — |
| Internal links to owner pages | GSC Links → internal | Arzt/Zahnarzt/Praxen counts rise | — |
| Form submissions from practice pages | Analytics / lead inbox | first qualified practice lead | ≥ 1/month |

## 18 · Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Arzt head change resets a pos. 35 signal before the new body is evaluated | medium | abort criterion; body stays, head can be compared |
| Dental page drops after additive paragraphs | low | single isolated change; remove-and-measure rule |
| Export reveals the therapy intent had real demand | low (1 impr./28 d) | title can be restored from git; nothing else changed |
| Impressions keep falling as consolidation sheds long tail | expected | judge by clicks and positions on the owner pages, not total impressions |
| Owner questions stay unanswered → pages stay silent on buyer questions competitors answer | medium | section 14; each is one sentence |
| Deferred bundle work (H4) left as is | low SEO impact | prerender delivers full HTML; it is a CWV/cost item |
| Repo-public exposure of the security branch (separate task) | — | handled in the security audit; unrelated to this branch |

## 19 · Build/test results

On `6e0ba3d` plus the documentation commit, Node 22.22.2:

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | 114 files · 2,801 passed · 1 skipped · 0 failed |
| `npm run build` (SSR build, prerender, sitemap, redirects check) | pass |
| `npm run lint` | 0 errors · 34 warnings (all pre-existing on `main`) |
| `node .github/scripts/test-seo-consistency.mjs` | pass |
| `node .github/scripts/test-prerender-output.mjs` | pass |
| `test-pages-routing.mjs`, `test-deploy-cache-headers.mjs`, `test-public-theme.mjs`, `test-browser-hydration.mjs` | pass |
| Pre-existing failures on `main`, not introduced here | `.github/scripts/test-signature-offer-portal.mjs`, `test-offer-acceptance-automation.mjs` (offer portal, not public site) |

One test was adapted, not weakened: `rechner-konsistenz.test.tsx` pinned the Arzt page as
frozen; it now follows `PROTECTED_EXPERIMENT_PATHS`, so it will guard any future frozen
route automatically.
