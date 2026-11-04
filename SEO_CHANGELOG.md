# SEO_CHANGELOG — Technical SEO audit, 2026-10-23

> **Nachtrag 23.10.2026:** Korrekturen an diesem Branch stehen in `FINAL_SEO_CHANGELOG.md` (Branch `claude/seo-release-fixes-2026-10`).

Branch `claude/seo-audit-2026-10`, base `ed0f8e4` (origin/main). Four commits:

| Commit | Scope |
|---|---|
| `5150c34` | Graduate the five remaining frozen search experiments |
| `cb319b3` | Technical: duplicate pillar 301, structured-data dedupe, landmarks, stale titles, robots, hreflang |
| `647911b` | Honesty: remove unconfirmed claims the owner questions still leave open |
| `6e0ba3d` | Practice cluster ownership (F3) and priority-page improvements; keyword map, external actions, GSC analyzer |
| (this commit) | Documentation: `SEO_AUDIT_2026.md`, this file, `docs/seo/*` updates, `COPY-SEO-CHANGELOG.md` entry |

Nothing was deployed. Every change below is in the repository only; the Cloudflare
preview builds from the pushed branch.

Legend — **Risk**: L = reversible in one edit, no ranking exposure · M = head or
H1 change on a page with impressions · H = page-1 page or structural consolidation.

---

## 1 · Experiment governance (`5150c34`)

| File | Change | Why | Expected effect | Risk |
|---|---|---|---|---|
| `src/lib/routing/protectedExperiments.ts` | `PROTECTED_EXPERIMENT_PATHS = []`; all six former routes in `GRADUATED_EXPERIMENT_PATHS` | Owner decision 2026-10-23. Four webdesign experiments had run ≥ 2 months without movement; the Arzt experiment was contaminated since 2026-09-11; the Bayreuth relaunch experiment never shipped (edge override). The freezes blocked F3, F9, F10 and claim hygiene | Unblocks every structural change below | L |
| `src/test/fixtures/protected-experiments.baseline.json` | `fingerprints: {}`, `inboundOccurrences: {}` (edited by hand; `npm run seo:baseline` not run) | Repo rule: baselines are never regenerated to make a change pass | — | L |
| `src/protectedExperiments.test.tsx`, `.github/scripts/test-seo-consistency.mjs` | Accept an empty protected list | Tests pinned a non-empty set | — | L |
| `functions/_middleware.ts` | `frozenHeadOverrides = {}` | The edge carried a per-route head override — exactly what ARCHITEKTUR §7 forbids. The manifest is the only head source again | Crawlers receive the reviewed head for `/bayreuth/website-relaunch` | L |
| `src/lib/routing/publicRoutes.ts`, `src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx` | `/bayreuth/website-relaunch` title → "Website Relaunch Bayreuth – Alte Website modernisieren \| Cogniiq"; description without "ohne Rankingverlust" / "bessere Rankings" | The crawled title was the old one, so this is what Google already indexes; "ohne Rankingverlust" is an outcome promise (COPY-BRIEF §5.9) | Neutral for ranking; removes a legal/trust exposure | L |
| `docs/seo/organic-growth-scoreboard.md` | "Messpunkt 2026-10-23 — Graduierung" | Every graduation must be recorded with measured values | — | — |

## 2 · Technical SEO (`cb319b3`)

| File(s) | Issue | Change | Rationale | Target | Effect | Risk |
|---|---|---|---|---|---|---|
| `src/lib/routing/legacyRedirects.ts`, `public/_redirects`, `src/lib/routing/legacyRedirects.test.ts` | Duplicate national webdesign pillar (`/webdesign-agentur-deutschland`, 5 impr./28 d, brand queries) competed with `/webdesign` for one intent (F9) | 301 → `/webdesign`, both trailing-slash forms; test asserts the redirect | ARCHITEKTUR §5.1 K2: one owner per intent; the page carried unverified prices, durations, "A/B-getestet" | `/webdesign` | Consolidates the little signal there is; removes 8 unverifiable claims from the index | L |
| `src/lib/routing/publicRoutes.ts`, `publicRoutePaths.ts`, `src/App.tsx`, `src/lib/search/lexicon.ts`, `src/pages/pillars/WebdesignAgenturDeutschland.tsx` (deleted) | same | Route, manifest entry, lazy import, search lexicon entry and component removed | A redirected route must not stay in the manifest or sitemap | — | — | L |
| `src/lib/standorte-service-configs.ts`, `standorte-data.ts`, `src/components/CityServicePage.tsx` | City pages linked the duplicate pillar via `legacyWebdesignLink` / `legacyAutomationLink` | Fields removed; hrefs fixed to `/webdesign` and `/prozessautomatisierung` | No internal link may point at a 301 | city pages | Link equity flows to the owners directly | L |
| `index.html` | Static Organization/WebSite/LocalBusiness JSON-LD duplicated what `LocalBusinessSchema.tsx` renders on every page (F10) | Static block removed (comment left as marker) | Two Organization nodes with partially different properties on every URL | all | One entity graph per page; no conflicting `@id`s | L |
| `src/components/PageSEO.tsx` | Second `BreadcrumbList` injected via `WebPage.breadcrumb`; inline `publisher` Organization object; `x-default` hreflang on every URL | One BreadcrumbList; `publisher: { "@id": ".../#organization" }`; `x-default` only on `/` | A single `x-default` per site is the documented pattern; duplicate breadcrumb lists produce "duplicate field" warnings | all | Cleaner rich-result eligibility | L |
| `scripts/prerender.mjs` | mirrored the `x-default` rule in the prerender regex | — | keep SSR and client identical | all | — | L |
| `src/pages/blog/BlogPostPage.tsx` | Article `author`/`publisher` were inline objects without `@id`; no `image` | `@id` references to `#organization`; `image: /og-image.png` | Article rich results require `image`; entity consistency | blog | Eligible Article markup | L |
| `src/components/LocalBusinessSchema.tsx` | `paymentAccepted` listed payment types no page states | Removed | Unverified claim in schema | all | — | L |
| `public/robots.txt` | `Disallow: /anfrage-erhalten` on a `noindex` page | Removed | Disallow prevents Google from seeing the `noindex`; the directives contradict each other | — | Page can be read and dropped properly | L |
| 18 page components (`CityServicePage`, `ClusterPage`, `CostPage`, `IndustryPage`, `NationalIndustryPage`, `ProblemPage`, `AnfrageErhaltenPage`, `BayernKiTelefonassistentPage`, `DatenschutzSicherheitPage`, `KiTelefonassistentDemoPage`, `KiTelefonassistentPage`, `NotFoundPage`, `PraxenPage`, `ProzessautomatisierungHub`, `WebdesignHub`, `KostenAutomatisierung`, `KostenKiTelefonassistent`, `KostenWebdesign`) | Nested `<main>` inside the layout `<main>` | Inner `<main className=` → `<div className=` | One main landmark per document (accessibility + consistent content extraction) | all | Lighthouse a11y, cleaner main-content detection | L |
| `src/lib/blog-data.ts` (7 posts), `publicRoutes.ts` | Titles carried " 2025" while `updatedAt` was 2025-03 and `publishedAt` predated the repository's history | Year removed from titles; `updatedAt` set to the date of the real content touch (2026-10-23; `verpasste-anrufe-kosten` 2026-09-17); `publishedAt` set to the first commit that introduced each slug (2026-03-16) | A stale year in a 2026 SERP depresses CTR; invented dates are an honesty issue; the rule "no year bumps without a content update" was respected by dropping the year, not bumping it | blog | CTR; accurate `dateModified` | L |
| `src/lib/seo-data.ts`, manifest descriptions (`/`, `/bayreuth`, `/deutschland`, `/kontakt`, blog restaurant) | "hochkonvertierende", "Chatbots", "30 Minuten" | Reworded without banned words or unconfirmed facts | COPY-BRIEF §5.9, OWNER-INPUT CLAIM 616 | — | — | L |
| `public/sitemap.xml` | regenerated via `npm run build:ssr && npm run sitemap` (86 URLs) | — | never hand-edited | — | — | L |

## 3 · Honesty and claim hygiene (`647911b`)

Rule: a claim without owner confirmation becomes a precise statement about what
we do know, never a vaguer promise (`.claude/rules/seo-public-site.md`).

| File | Removed / changed | Rule violated |
|---|---|---|
| `src/lib/telefonassistent-copy.ts` | `UEBERGABE` is now an alias of `UEBERGABE_ABWICKLUNG` (the frozen copy described *other* systems' manual re-typing as if it were ours); `FAKTEN.aenderungen` sentence uses `FAKTEN.aenderungTage` | Factual accuracy; single source of numbers |
| `src/components/NationalIndustryPage.tsx` | chips "Einrichtung in wenigen Tagen"/"Einrichtung in Tagen" → "Übergabe in zwei Wochen"; "Ca. 15 Minuten" removed from the Erstgespräch chip | CLAIM 616 (Erstgespräch duration unconfirmed); FAKTEN says two weeks |
| `src/components/ProblemPage.tsx`, `src/pages/problems/*` | "Problem jetzt lösen" → "Erstgespräch vereinbaren"; "schnellsten ROI" → honest framing; "vollständig automatisiert" removed | §5.9 banned words; outcome promises |
| `src/components/AboutSection.tsx` | "hochkonvertierende … messbar Resultate" → operational wording | §5.9 |
| `src/lib/standorte-service-configs.ts` | Removed: "Was passiert bei einem technischen Ausfall?" FAQ (B9 fallback unconfirmed, 3×); price FAQs with "ab ca. 500–1.500 €" / "ab ca. 1.500 €" (no verified price list); duration FAQs "1–2 Wochen"/"4–6 Wochen"/"4–8 Wochen ROI"; "Ladezeiten unter 2 Sekunden"; "Google My Business" → "Google-Unternehmensprofil"; hosting promise narrowed; case-study wording "nach dem Launch …" → "Die Maßnahme: …" (no implied result); support FAQ uses `${FAKTEN.aenderungen}` | HONESTY-AUDIT §7.7; OWNER-INPUT B9, E3; `telefonassistent-copy.test.ts` "tippt keine Kernzahl selbst" |
| `src/pages/cluster/**` (Bayreuth/München/Regensburg relaunch, München Kosten) | "ohne Rankingverlust", "DSGVO-konform" as a deliverable, fixed week counts | outcome promises, legal claim |
| `src/pages/industries/AutomatisierungArzt.tsx`, `KiTelefonassistentPraxis.tsx`, `src/pages/WebdesignGastronomieMuenchen.tsx`, `src/pages/CityLandingPage.tsx`, `src/pages/KiTelefonassistentPage.tsx`, `src/pages/PraxenPage.tsx`, `src/pages/blog/BlogPostPage.tsx` | same classes (durations, "vollautomatisch", "nahtlos", implied results) | §5.9 |
| `src/lib/routing/publicRoutes.ts`, `src/lib/seo-data.ts`, `src/lib/blog-data.ts` | Heads for `/automatisierung-arzt` ("Terminbuchung" → "Erinnerungen, Warteliste & Kommunikation", "mit Mensch an den Entscheidungsstellen"), `/keine-terminbuchung`, `/kontakt`, `/deutschland`, `/bayreuth` | heads must not promise what the body cannot back |

**Not changed here (owner decision pending):** the euro tables on `/{stadt}/webdesign-kosten` (W4) — see `SEO_EXTERNAL_ACTIONS.md` #7.

## 4 · Practice cluster and priority pages (`6e0ba3d`)

### 4.1 `/ki-telefonassistent-arzt` — rebuilt (priority 3, "improve aggressively")

| Field | Before | After |
|---|---|---|
| Title | KI-Telefonassistent für Arztpraxen \| Terminwünsche aufnehmen – Cogniiq | **KI-Telefonassistent Arztpraxis: Anrufe erledigen \| Cogniiq** (57 chars) |
| Description | Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an und erfasst Terminwünsche nach Ihren Regeln … | KI-Telefonassistent für Arztpraxen: Termine im Gespräch vergeben, verschieben, absagen; Rezept- und Überweisungswünsche strukturiert ans Team. Keine Triage. (151 chars) |
| H1 | KI Telefonassistent für Arztpraxen | KI-Telefonassistent für Arztpraxen: Anrufe erledigen, nicht notieren |
| Body | 149-line `NationalIndustryPage` config, shared template | 757-line standalone page: 9 call reasons with a rule each (erledigt / team / mensch / praxis), data-protection block from `DATENSCHUTZ_PUNKTE`, limits from `GRENZEN`, interface section from `ANBINDUNG`, team block, cost paragraph with `KOMPAKT_KOSTEN` + `RechnerCta`, 8 FAQs, Service JSON-LD; ~3,900 words rendered |
| Internal links | template defaults | → `/praxen`, `/kosten-ki-telefonassistent`, `/ki-telefonassistent-zahnarztpraxis`, `/ki-telefonassistent-einfuehren`, `/integrationen`, `/datenschutz-sicherheit`, blog |

Rationale: ARCHITEKTUR §3.2 / F3. The URL is the strongest of the "arztpraxis" family (471 impr., pos. 35 per the owner summary) but shared the term with a template body and a sibling page. The new body answers the questions the ranking competitors answer (which calls, triage, PVS, data protection, price) with first-party facts only. Target: "ki telefonassistent arztpraxis" (111 impr., pos. 40), "telefonassistent arztpraxis" (83, pos. 34), "telefonassistent arzt" (42, pos. 26). Risk **M**: a head change on a page with impressions; the abort criterion is in the scoreboard.

### 4.2 `/ki-telefonassistent-praxis` — retargeted (manifest only)

Title "KI-Telefonassistent für medizinische Praxen | Terminverwaltung automatisieren – Cogniiq" → **"KI-Telefonassistent für Therapiepraxen | Cogniiq"**; description now names Physio/Ergo/Logopädie. Rationale: the page had collapsed to 1 impression in 28 days while carrying the same head term as the Arzt page — the only genuine cannibalisation in the cluster. The body already addressed therapy practices. Consolidation into `/praxen` stays the fallback (scoreboard abort criterion). Risk **L** (nothing to lose).

### 4.3 `/praxen` — hub (priority 2–3)

H1 "Am Tresen steht eine Patientin. / Und das Telefon klingelt trotzdem." → **"KI-Telefonassistent für Praxen: ein Empfang am Telefon, der Anliegen erledigt."**; the scene sentence became the eyebrow line. Description now names all three practice types. Rationale: the hub owns "ki telefonassistent praxis" (58 impr., pos. 31) but had no keyword in its H1. Risk **M**.

### 4.4 `/kosten-ki-telefonassistent` — extended (priority 1; pos. 19 on "ki telefonassistent kosten")

Head, H1 and existing sections **untouched**. Added below the existing content:
"Wie KI-Telefonassistenten am Markt abgerechnet werden" (4-row model comparison; no competitor named), "Welche Fragen Sie jedem Anbieter zum Preis stellen sollten" (from `ANBIETER_CHECKLISTE`), "Gilt das auch außerhalb von Praxen?" (from `GENERISCH_DECKELUNG`; answers the generic intent that lands here), three FAQs ("pro Minute" computed from `TARIFE[0]`, "versteckte Kosten", "kleine Praxis"), Weiterlesen → Zahnarzt, Einführen. Every number comes from `TARIFE`/`FAKTEN` (`rechner-konsistenz.test.tsx` enforces it). Target: page 1 for "ki telefonassistent kosten/preise" (176 impr. combined). Risk **L**.

### 4.5 `/ki-telefonassistent-zahnarztpraxis` — protected winner (page 1, pos. 8.9)

Title, H1, section order and existing text **unchanged**. Two additive paragraphs (data protection from `DATENSCHUTZ_PUNKTE[3..4]`; cost sentence with link) and two Weiterlesen links (Arzt, Kosten). Single, isolated change so it can be reverted alone. Risk **H** by position, mitigated by minimal, additive scope and an explicit abort rule.

### 4.6 `/ki-telefonassistent` — flagship hub (priority 1)

Use-case cards link to their segment pages (`/ki-telefonassistent-restaurant`, `/praxen`), "Nach Branche" list points at the owners (`/praxen`, Arzt, Zahnarzt, Therapie, Restaurant, Hotel); description ends "Rechner ohne Anmeldung." (158-char rule). No H1/title change. Risk **L**.

### 4.7 `/blog/ki-telefonassistent-arztpraxis` — retargeted off the head term

Title "KI-Telefonassistent für Arztpraxen: was er übernimmt, was beim Team bleibt" → **"Telefon in der Arztpraxis: was beim Team bleiben muss | Cogniiq"**; `weiterfuehrend` → Arzt + Kosten pages. Rationale: a blog post must not compete with its commercial owner for the same head term (ARCHITEKTUR §2 roles). Risk **L**.

### 4.8 Navigation (`src/lib/navigation-data.ts`)

Telephone-assistant niche slots: "Für Praxen – der Überblick" → `/praxen`, "Für Arztpraxen" → `/ki-telefonassistent-arzt`, "Für Zahnarztpraxen" → `/ki-telefonassistent-zahnarztpraxis`, Restaurants, Hotels. Site-wide links now reach the owner pages. `Navigation.test.tsx` updated for the label. Risk **L**.

### 4.9 Copy source (`src/lib/telefonassistent-copy.ts`)

`GENERISCH_GRENZEN`: generic wording replaces the practice-specific `FAKTEN.keineAnbindung` on non-practice pages ("auf jede Software sofort passt" claim removed).

### 4.10 Tests and tooling

- `src/lib/rechner-konsistenz.test.tsx`: "verweist von keiner eingefrorenen Seite auf den Rechner" now iterates `PROTECTED_EXPERIMENT_PATHS` via a route→source map instead of pinning the graduated Arzt page.
- `scripts/seo/gsc-analyze.mjs`: Node CSV analyser for Search Console exports (clusters, position buckets, page-1 candidates, CTR gaps, Query×Page cannibalisation, period compare).
- `SEO_KEYWORD_MAP.md`, `SEO_EXTERNAL_ACTIONS.md`: see those files.

## 5 · Documentation (this commit)

- `docs/seo/ARCHITEKTUR.md`: §10 marks F1, F3, F9, F10 done; new §14 (F3 decision, technical status, new rules).
- `docs/seo/organic-growth-scoreboard.md`: measurement rows for every changed URL (hypothesis, success at day 28, abort criterion) and the "deliberately not changed" list.
- `docs/seo/post-experiment-opportunities.md`: graduation status on each former experiment.
- `COPY-SEO-CHANGELOG.md`: metadata old → new entry as COPY-BRIEF §8.4 requires.

## 6 · Deliberately not changed

| Surface | Why |
|---|---|
| `/ki-telefonassistent-zahnarztpraxis` head, H1, structure | page 1 (pos. 8.9) |
| `/regensburg/website-relaunch` head | pos. 11–12, closest webdesign page to page 1 |
| `/webdesign-hotel` | 1,184 impr., pos. 18 — largest webdesign impression source; no text touched |
| Homepage title | positioning decision (three claims vs. phone-first) belongs to the owner — `SEO_EXTERNAL_ACTIONS.md` #17 |
| `/{stadt}/webdesign-kosten` euro tables | owner decision W4 pending |
| `/prozessautomatisierung`, `/kosten-webdesign`, `/kosten-automatisierung` | rebuilt in September; measurement windows open |
| No new indexable page, no FAQ schema added by default, no AggregateRating | repo rules |
| Authentication, admin, owner and customer surfaces | out of scope; untouched |

## 7 · Verification (all on `6e0ba3d` + docs)

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` (vitest) | 114 files, 2,801 passed, 1 skipped, 0 failed |
| `npm run build` (incl. prerender, sitemap, `_redirects` check) | pass |
| `npm run lint` | 0 errors, 34 warnings (all pre-existing on `main`) |
| `.github/scripts/test-seo-consistency.mjs` | pass |
| `.github/scripts/test-prerender-output.mjs` | pass (inbound links to every indexable route) |
| `test-pages-routing`, `test-deploy-cache-headers`, `test-public-theme`, `test-browser-hydration` | pass |
| Prerendered HTML of changed routes | one H1, manifest title, canonical, description, JSON-LD present on `/ki-telefonassistent-arzt`, `/kosten-ki-telefonassistent`, `/praxen`, `/ki-telefonassistent`, `/ki-telefonassistent-zahnarztpraxis`, `/ki-telefonassistent-praxis` |
| Pre-existing failures on `main`, not caused here | `.github/scripts/test-signature-offer-portal.mjs`, `test-offer-acceptance-automation.mjs` (offer-portal scripts outside the public site) |
