# 02 · Git timeline of production changes, 2026-09-01 → 2026-11-20

Forensic SEO investigation, cogniiq.de. Author role: git history / change analyst.
Written 2026-11-20 against `origin/main` @ `a6a54b5`. Research only; no code was changed.

Purpose: make every production change since 2026-09-01 datable and attributable so it can be laid against
Search Console daily data. **This document assigns no blame.** No GSC export was available; every statement
about search impact below is a hypothesis unless it is marked FACT.

## 0 · Read this first

| # | Finding | Date (Europe/Berlin) |
|---|---|---|
| 1 | Last production change is PR #105, merged **2026-11-04 13:44 +01:00** (12:44 UTC). Nothing has reached `main` since. Confirmed. | 2026-11-04 |
| 2 | The window contains **21 merges to `main`** (102 commits reachable, all 21 first-parent commits are PR merges, no direct pushes). 12 of the 21 touch the public site; 9 are admin/CI/analytics only. | — |
| 3 | The single largest head event is **not visible in the route manifest diff**: PR #94 deleted a 560-line edge table that had been overwriting `<title>`/description/canonical at request time. On that merge the served raw-HTML head changed on **28 URLs at once** (6 titles, 27 descriptions). | 2026-09-12 22:58 |
| 4 | Nine days (09-10 → 09-17) contain **11 public-site releases**, including 3 pillar rebuilds, 3 URL retirements with 301s, sitewide nav/footer link changes and the edge-table removal. Changes inside this burst cannot be separated from each other with daily data. | 2026-09-10 → 09-17 |
| 5 | PR #105 bundled 13 commits authored 10-23/10-24/11-04. Repo docs date this work "2026-10-23"; it was **not in production until 11-04**. Served head changed on 22 URLs, one URL retired, global JSON-LD block removed from every page, `x-default` hreflang removed from every page except `/`. | 2026-11-04 13:44 |
| 6 | No indexable URL was ever switched to `noindex`, no canonical logic changed, `robots.txt` lost one `Disallow` line (11-04), `indexability.ts` is byte-identical across the window. | — |
| 7 | Pages added in the window: **1** (`/ki-telefonassistent-zahnarztpraxis`, 09-06). Pages removed: **4**. There was no scaled page creation. Sitemap went 89 → 90 → 89 → 87 → 86 URLs. | — |
| 8 | The repo's canonical host is the apex `https://cogniiq.de` (manifest `SITE_ORIGIN`, sitemap, robots `Sitemap:` line, GSC property `sc-domain:cogniiq.de`). The brief for this investigation names `https://www.cogniiq.de`. No `www` rule exists anywhere in the repo. Which host is primary is decided outside the repo and was not verified here. | — |

## 1 · Method and limits

- Source: `git log origin/main --since=2026-09-01 --first-parent`, then `git diff <merge>^1 <merge>` per release. The clone is
  **shallow**; history starts at `626d400` (2026-08-26). Anything older is out of reach, which is why `git log -S` attributes
  several old strings to that commit.
- Head values were not read off diffs by eye. For the baseline (`6001b68`, 2026-08-31) and each of the 21 merges I parsed
  `src/lib/routing/publicRoutes.ts` (manifest) **and** the per-route table in `functions/_middleware.ts` (edge), and computed the
  value actually written into the served HTML: edge value where the table had one, else manifest. Appendix B and C are generated
  from that, not typed.
- H1 values were extracted from the page components at every snapshot (literal `<h1>` content or the `h1:` config field).
- Not done: no build of historical commits, no fetch of the live site, no Cloudflare deployment log. Body-copy scale is reported
  as lines changed in the page source, which over-states cosmetic class-name edits and under-states shared-copy edits made in
  `src/lib/telefonassistent-copy.ts` (one edit there changes several pages).
- All times are the merge commit's committer time. September/October merges are CEST (+02:00), the November merge is CET (+01:00).
  GSC reports days in America/Los_Angeles: a merge at 22:58 CEST lands on the same Pacific calendar day (13:58 PDT).

## 2 · Is merge date = deploy date?

**FACT.** There is no deploy step in the repository. `.github/workflows/` holds three workflows: `build.yml` (verification only, runs on
PR and on push to `main`), `deploy-golden-agent-functions.yml` and `supabase-production-migration.yml` (backend, not the site).
None publishes the site. `wrangler.jsonc` declares only `name`, `compatibility_date` and `assets.directory = ./dist` with
`not_found_handling: single-page-application`. `README.md:3` carries the comment `<!-- Cloudflare production deployment trigger -->`.
`CLAUDE.md` rule 20 says pushing a branch lets "Cloudflare create a preview deployment". `build.yml:152` calls Cloudflare Pages
"what actually serves cogniiq.de".

**EVIDENCE.** `.github/workflows/build.yml:1-10,152-160`; `wrangler.jsonc`; `README.md:3`; `CLAUDE.md` rules 19–24; `.node-version` (22.22.2).

**HYPOTHESIS.** Production is built by Cloudflare's Git integration on every push to `main`, so deploy time ≈ merge time plus build
duration (minutes).

**ALTERNATIVE EXPLANATION.** (a) A production build failed or was skipped and the previous build stayed live; a later merge then
shipped several releases at once. (b) Production deploys are gated manually in the Cloudflare dashboard. (c) The repo's own
scoreboard writes "Deploy: **UNBEKANNT**" on every ledger row from 09-14 to 11-04 and states "Ein Commit-Datum ist kein
Deploy-Datum … kein Merge-Datum" (`docs/seo/organic-growth-scoreboard.md:1225-1227, 1382-1386`). The people closest to the site did
not treat merge as deploy.

**CONFIDENCE.** Medium (about 70 %) that each merge went live within an hour. Low that this holds for all 21 without exception.

**A second deployment unknown.** `wrangler.jsonc` describes a Workers static-assets project (`assets.directory`), with no
`pages_build_output_dir`. `functions/_middleware.ts` only executes on Cloudflare **Pages**. If the production project were a
Workers-assets deployment, the middleware never ran, the edge head table never applied, and the 2026-09-12 head switch in §4.1 did
not happen at all. The repo's CI and docs consistently assert Pages (`build.yml:152-160`, `public/_headers` comments,
`FINAL_SEO_RELEASE_AUDIT.md:31` reports an observed production `HEAD` 500 carrying the middleware's own `X-Cogniiq-Shell-Error`
header, which only that Function emits). I rate "Pages, middleware active" at about 90 %.

**WHAT WOULD FALSIFY THIS.** The Cloudflare deployment list (production environment) showing a commit hash/time that differs from the
merge list in §3, or showing failed production builds.

**RECOMMENDED ACTION.** Export the Cloudflare production deployment history (commit SHA, start, finish, status) for 2026-09-01 →
today and add a "live at" column to §3 before any causal reading. This is the cheapest missing input in the whole investigation.

## 3 · Release timeline

Legend for the dimension columns: **T** served title · **D** served description · **H1** · **B** body copy · **L** internal links ·
**R** redirects · **C** canonical · **X** robots meta / indexability · **Rb** robots.txt · **S** sitemap · **SD** structured data ·
**P** prerender / SSR / edge pipeline · **Rt** routes. "—" = unchanged. Exact before → after strings are in Appendix B/C.

### 3.1 Releases that did not touch the public site

| Merge (local) | UTC | PR | Merge commit | Content | Public-site effect |
|---|---|---|---|---|---|
| 2026-09-05 16:18 +02 | 14:18 | #84 | `201b2dc` | admin dashboard focus fix | none |
| 2026-09-05 16:51 +02 | 14:51 | #83 | `a2564bc` | admin expense import | none |
| 2026-09-06 10:40 +02 | 08:40 | #86 | `e3db8bb` | CI workflow for backend functions | none |
| 2026-09-11 16:53 +02 | 14:53 | #91 | `ac89955` | owner trash / storage purge | none |
| 2026-09-12 15:39 +02 | 13:39 | #92 | `48499df` | GA4 stream id corrected, retired cookie cleared (`src/lib/consent.ts`, `legal-content.tsx`) | none for crawling. **Analytics discontinuity:** GA4 data before/after is not comparable |
| 2026-09-24 12:09 +02 | 10:09 | #100 | `0714484` | Oura integration removed, incl. route `/admin/oura-analytics` (private, noindex) | none |

All six still triggered a full production rebuild (new asset hashes, same HTML content).

### 3.2 Releases that changed what a crawler receives

| Merge (local) | PR · merge · commits | Affected public URLs | T / D | H1 | B | L | R | C · X · Rb | S | SD | P | Rt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **2026-09-06 00:11 +02** (09-05 22:11 UTC) | #85 `d989a1b` · `210710a`, `513425d` | new `/ki-telefonassistent-zahnarztpraxis`; `/praxen`, `/ki-telefonassistent-einfuehren`, `/blog/ki-telefonassistent-arztpraxis`; footer on all 93 pages | Manifest T+D of the blog post changed, **not served** (edge table kept the old "…Arztpraxis 2025 \| Vorteile & Kosten" until 09-12) | new page: "KI-Telefonassistent in der Zahnarztpraxis: welche Anrufe er übernimmt und welche nicht" | +674 lines new page; `/praxen` +17; blog post body rewritten (`blog-data.ts` +41/−20) | **Sitewide:** new footer column "Leitfäden für Praxen" with 2 links (`/ki-telefonassistent-einfuehren`, `/ki-telefonassistent-zahnarztpraxis`); shell anchors 71 → 73 per page. New card on `/praxen`, "Weiterführend" block on the blog post | — | — | 89 → **90** URLs; lastmod bumped on `/ki-telefonassistent-einfuehren` and the blog post (→ 2026-09-05) | new page's own JSON-LD | — | **+1** |
| **2026-09-10 23:04 +02** | #87 `d9d4361` · 7 commits | `/`, `/webdesign-arzt-{bayreuth,muenchen,regensburg}`, `/kosten-automatisierung`, `/ki-telefonassistent-restaurant`, `/zu-viel-manuelle-arbeit`, city service pages (via `standorte-service-configs.ts`) | — | — | claim removals, 84 lines replaced across 12 files (integration/SMS promises, absolutes) | — | — | — | — | text inside existing JSON-LD follows copy | — | — |
| **2026-09-10 23:51 +02** | #88 `d41088a` · 3 commits | `/bayern/ki-telefonassistent`, `/bayreuth/ki-telefonassistent`, `/regensburg/ki-telefonassistent`, `/ki-telefonassistent-restaurant` (manifest D); bodies of `/ki-telefonassistent`, `/leistungen`, `/ueber-uns`, `/bayern`, `/deutschland`, `/ki-agentur-deutschland`, `/ki-telefonassistent-hotel`, `/ki-telefonassistent/demo`, `/verpasste-anrufe-verlust`, `/` | 4 manifest descriptions changed, **none served** (edge table) | — | "Terminbuchung" → "Terminaufnahme" class of edits, 55 lines replaced | — | — | — | — | follows copy | — | — |
| **2026-09-11 15:04 +02** | #89 `3be481d` · 3 commits | `/webdesign-hotel`, `/verpasste-anrufe-verlust` | manifest T+D changed (hotel: "…Direktbuchungen steigern" → "…Internetagentur für Hotellerie"; missed-calls title), **not served** until 09-12 22:58 | unchanged ("Webdesign für Hotels & Pensionen") | `/webdesign-hotel` +17/−5: new section "Die allgemeine Webagentur kennt die Buchungsstrecke nicht", 2 new FAQs, keyword list, tagline. **Body was live from this merge; the matching title was not** | — | — | — | — | 2 FAQ entries added to FAQPage JSON-LD | — | — |
| **2026-09-11 15:54 +02** | #90 `f4bce75` · `81e7c04` | `/ki-telefonassistent-arzt` | **T+D served immediately** (edited in manifest *and* edge table): "…\| Termine automatisch buchen – Cogniiq" → "…\| Terminwünsche aufnehmen – Cogniiq" | — | — | — | — | — | — | one JSON-LD block embeds the description | — | — |
| **2026-09-12 21:56 +02** | #93 `3e44c84` · 8 commits | `/ki-telefonassistent` (rebuilt), `/kosten-ki-telefonassistent`, `/praxen`, `/`, `/ki-telefonassistent-{praxis,restaurant,hotel}`, `/bayern/ki-telefonassistent`, `/ki-telefonassistent/demo`, `/integrationen`, problem pages, `webdesign-arzt-*`; nav on all pages | `/ki-telefonassistent` **T+D served** (both tables edited): "KI-Telefonassistent für Unternehmen \| Nie wieder verpasste Anrufe – Cogniiq" → "KI Telefonassistent für Unternehmen – Anrufe erledigen \| Cogniiq" | `/ki-telefonassistent`: "Erreichbar, wenn niemand abnehmen kann. Ein KI Telefonassistent, zugeschnitten auf Ihren Betrieb." → "KI-Telefonassistent für Unternehmen: Anrufe nicht nur annehmen. Anliegen erledigen." Hero headlines of `-praxis` and `-restaurant` reworded (H1 unchanged) | `KiTelefonassistentPage.tsx` +1310/−939; shared copy `telefonassistent-copy.ts` +668/−41; new calculator (`TelefonRechner.tsx` +1025, replaces 3 older calculators); `KostenKiTelefonassistent.tsx` +80/−25 | **Sitewide:** `/kosten-ki-telefonassistent` now present in the prerendered nav menu on every page (was hydration-only; `Navigation.tsx`). Many new links to the calculator anchor | — | — | lastmod `/ki-telefonassistent` 2026-06-30 → 2026-09-11 | page JSON-LD rewritten with the page | hash-scroll manager added in `App.tsx` (client only) | — |
| **2026-09-12 22:58 +02** | #94 `56707c2` · `0beabff` | **28 URLs** head switch (Appendix B); body link edits on 13 automation/webdesign pages | **Edge head table deleted.** Served T changed on 6 URLs, served D on 27. Includes `/` (D), `/webdesign` (D), `/kosten-ki-telefonassistent` (T+D), `/webdesign-hotel` (T+D), `/verpasste-anrufe-verlust` (T+D), `/muenchen/webdesign` (T), `/referenzen` (T+D), `/blog/ki-telefonassistent-arztpraxis` (T+D). One override kept: `/bayreuth/website-relaunch` title | — | small, +83 lines over 13 pages (link paragraphs) | 8 new contextual links to `/prozessautomatisierung`; 3 to `/webdesign` (from `/kosten-webdesign`, `/keine-anfragen-website`, `/webdesign-agentur-deutschland`); `/leistungen` loses 2 | — | C: edge no longer rewrites canonical/hreflang/og:url; prerender values take over. Values identical by construction (both `https://cogniiq.de/<path>`) but the *mechanism* changed | — | — | **edge pipeline change** (`functions/_middleware.ts` +83/−537) | — |
| **2026-09-13 11:59 +02** | #95 `729e0e4` · 4 commits | `/prozessautomatisierung` (rebuilt), `/kosten-automatisierung` (rebuilt), `/automatisierung-unternehmen` (retired); footer + nav on all pages | `/prozessautomatisierung` T "…\| KI-Workflows – Cogniiq" → "…\| Abläufe automatisieren – Cogniiq", D new; `/kosten-automatisierung` T "Automatisierung Kosten – Was kostet Prozessautomatisierung?" → "Was kostet Prozessautomatisierung? Kosten, Preistreiber & Rechner", D new | `/prozessautomatisierung`: "Manuelle Prozesse stoppen. KI übernimmt." → "Geschäftsprozesse automatisieren — mit Ausnahmen, die jemand sieht". `/kosten-automatisierung`: "Was kostet Automatisierung für Unternehmen?" → "Was kostet Prozessautomatisierung?" | hub +811/−158; cost page +864/−124; new calculator (+545); retired page −554 | **Sitewide:** footer link and nav item `/automatisierung-unternehmen` → `/prozessautomatisierung`; ~20 body links repointed | **first 301s in `_redirects`:** `/automatisierung-unternehmen` (+ slash form) → `/prozessautomatisierung` | — | 90 → **89**; lastmod + priority bump on hub (0.92 → 0.95), lastmod on cost page | FAQPage/Service JSON-LD of both pages rewritten | build now validates `_redirects` against `legacyRedirects.ts` (`scripts/lib/legacy-redirect-rules.mjs`) | **−1** |
| **2026-09-13 20:53 +02** | #96 `ebe326f` · 9 commits | `/` (hero + sections rebuilt), `/referenzen` and `/bewertungen` (retired), `/ki-telefonassistent/demo`, `/kontakt`, **every public page** (shell wrapper, colour tokens, footer) | — | **Homepage, server-rendered H1:** "Digitale Systeme, die Unternehmen führen." → "Erreichbar, wenn niemand frei ist." (the prerender always emits the mobile hero; desktop-hydrated H1 lost its third line "Auch nachts. Auch samstags.") | 71 files, +1696/−2667. Homepage sections rewritten (`ServicesSection`, `SolutionShowcase`, `FinalCTASection`, heroes −850 lines net); `/ki-telefonassistent/demo` +91/−134; `/kontakt` | **Sitewide:** footer loses "Referenzen" and "Bewertungen"; nav label "Demo anhören" → "Demo-Termin anfragen"; header CTA component swapped | 301 `/referenzen` → `/ueber-uns`, `/bewertungen` → `/ueber-uns` (+ slash forms) | — | 89 → **87** | — | layout shell changed in `App.tsx` (PageReveal / FooterReveal wrappers removed, skip link added); calculator chunk made eager on the homepage | **−2** |
| **2026-09-15 16:20 +02** | #97 `d0f2083` · 6 commits | `/webdesign` (rebuilt), `/kosten-webdesign` (rebuilt), `/bayreuth`, `/muenchen`, `/regensburg`, `/bayreuth/lokales-seo`; colour rollout on all pages; `/anfrage-erhalten` | 6 titles, 3 descriptions. `/webdesign` T "Webdesign Agentur – Hochkonvertierende Websites für Unternehmen" → "Webdesign Agentur – Websites für Unternehmen"; `/kosten-webdesign` T "Webdesign Kosten 2025 – …" → "Was kostet eine Website? Webdesign Kosten & Preistreiber"; three city hubs "AI-Systeme & Webdesign in X \| …" → "Cogniiq in X – KI-Telefonassistent, Websites & Automatisierung"; `/bayreuth/lokales-seo` "Lokales SEO Bayreuth – …" → "SEO Bayreuth – …" | `/webdesign`: "Websites, die ranken. Und konvertieren." → "Webdesign für Unternehmen: Websites mit einem klaren Auftrag". `/kosten-webdesign`: "Was kostet Webdesign? Kosten & Preise" → "Was kostet eine Website?". `/bayreuth/lokales-seo`: "Lokales SEO in Bayreuth – Mehr Sichtbarkeit bei Google" → "SEO in Bayreuth: lokale Sichtbarkeit bei Google für Ihr Unternehmen". City hub H1s changed with the titles (`CityLandingPage.tsx`, `standorte-data.ts`) | `/webdesign` +797/−208 (docs: 578 → ~2,300 words); `/kosten-webdesign` +560/−132 | **Sitewide:** two footer links `/webdesign-agentur-deutschland` → `/webdesign`, anchor "hochkonvertierende Websites" → "Websites für Unternehmen"; hero chips, `ServicesSection`, `CityServicePage` repointed. `/webdesign` body link targets 32 → 19; contextual inbound pages 4 → 21 (docs). `/webdesign-agentur-deutschland` left live but de-linked | — (301 decided, deferred) | — | lastmod + priority on `/webdesign` (0.92 → 0.95), lastmod `/kosten-webdesign` | both pages' JSON-LD rewritten; no `Offer` price on cost page | — | — |
| **2026-09-17 12:09 +02** | #99 `6f97dd6` · `5c20dc2` | 6 blog posts, `/blog/prozessautomatisierung-roi`, `/regensburg/webdesign`, `/muenchen/webdesign`, `/kosten-ki-telefonassistent` (one fact), `/deutschland`; nav/hero/footer on all pages | 1 title (`/blog/prozessautomatisierung-roi`: "…berechnen 2025 \| Leitfaden" → "…berechnen \| Formel, Amortisation, Kostenfallen"), 3 descriptions (`/deutschland`, that post, `/blog/ki-telefonassistent-restaurant`) | — | ROI post +4 sections (`blog-data.ts` +105/−5); city webdesign scenarios reworded | **Sitewide:** nav + hero-chip label "Automatisierung" → "Prozessautomatisierung"; duplicate footer link to `/prozessautomatisierung` removed. Six blog posts gain "weiterführend" links to pillars | — | — | lastmod ROI post → 2026-09-17 | — | — | — |
| **2026-09-30 20:31 +02** | #102 `352569b` · `bdc3cc0` | all pages (mobile navigation component) | — | — | — | mobile nav redesigned as drill-down (`premium-mobile-nav.tsx` +611/−428). Link *targets* come from the unchanged `navigation-data.ts`; whether every link stays in the prerendered DOM was **not verified** | — | — | — | — | — | — |
| **2026-10-01 17:18 +02** | #103 `2309d9e` · 6 commits | `/` (showcase section), every page with the calculator or consent banner | — | — | `SolutionShowcase.tsx` +596/−116 (scroll-driven call transcripts), `TelefonRechner.tsx` +176/−38, `index.css` +347 | — | — | — | — | — | heavier client animation on the homepage; rendering cost not measured | — |
| **2026-10-01 18:08 +02** | #104 `ed0f8e4` · `101e09d` | all pages (search trigger in nav), 404 page | — | — | — | site-search dialog added to header; results are client-side | — | — | — | — | +1,700 lines client JS (`src/lib/search/*`) | — |
| **2026-11-04 13:44 +01** | #105 `a6a54b5` · 12 commits (authored 10-23, 10-24, 11-04) | 22 URLs head; `/ki-telefonassistent-arzt` (rebuilt), `/kosten-ki-telefonassistent`, `/praxen`, `/ki-telefonassistent`, `/ki-telefonassistent-zahnarztpraxis`, `/regensburg/website-relaunch`, `/bayreuth/website-relaunch`, `/muenchen/website-relaunch`, `/ki-agentur-deutschland`, 9 blog posts, city pages; **every page** (JSON-LD, hreflang, nav, CTA colour) | 12 titles, 13 descriptions (Appendix B). Money pages: `/ki-telefonassistent-arzt` T+D, `/ki-telefonassistent-praxis` T+D, `/regensburg/website-relaunch` T ("…Modernisierung ohne Rankingverlust" → "…Modernisierung & SEO-Migration"), D on `/kosten-ki-telefonassistent`, `/praxen`, `/ki-telefonassistent`, `/webdesign`, `/ki-agentur-deutschland`. Seven blog titles lose "2025" | `/praxen`: "Am Tresen steht eine Patientin. Und das Telefon klingelt trotzdem." → "KI-Telefonassistent für Praxen: ein Empfang am Telefon, der Anliegen erledigt." `/ki-telefonassistent-arzt`: "KI Telefonassistent für Arztpraxen" → "KI-Telefonassistent für Arztpraxen: Anrufe erledigen, nicht notieren" | `KiTelefonassistentArzt.tsx` +732/−141 (template page → standalone, docs: ~3,900 words); `KostenKiTelefonassistent.tsx` +239/−83; `PraxenPage.tsx` +103/−113; calculator rewritten (`TelefonRechner.tsx` +639/−674, `telefonassistent-rechner.ts` +427/−536); binding prices (300 € / 0,50 € / 990 €) replace capped model on all telephone pages; guarantee wording removed from three relaunch pages; `/ki-agentur-deutschland` price FAQ replaced | **Sitewide nav:** "Für Arzt- und Zahnarztpraxen" → `/praxen` becomes three links: "Für Praxen – der Überblick" → `/praxen`, "Für Arztpraxen" → `/ki-telefonassistent-arzt`, "Für Zahnarztpraxen" → `/ki-telefonassistent-zahnarztpraxis`. City pages stop linking the two retired pillars. Flagship use-case cards link segment pages | 301 `/webdesign-agentur-deutschland` (+ slash form) → `/webdesign` | C unchanged. X unchanged. **Rb:** `Disallow: /anfrage-erhalten` removed. **hreflang:** `x-default` removed from all pages except `/` (prerender + client) | 87 → **86**; lastmod → 2026-10-23 on seven blog posts, → 2026-09-17 on one | **Sitewide:** static `@graph` (Organization + WebSite + LocalBusiness, ~160 lines) deleted from `index.html`; second BreadcrumbList removed; `publisher` reduced to an `@id` reference; `paymentAccepted` removed; Article gets `image` and `@id` refs; Arzt page gets Service schema; cost page offers restated net with `valueAddedTaxIncluded: false`; setup offers changed | `HEAD` requests answered 200 instead of 500 on prerendered routes; nested `<main>` removed on 18 page templates; frozen-experiment override emptied | **−1** |

### 3.3 Net route and sitemap movement

| Date (local) | PR | Event | Sitemap URLs after | Redirect in place from this merge |
|---|---|---|---|---|
| baseline 2026-08-31 | — | 92 manifest routes, 89 indexable, 3 noindex (`/integrationen`, `/datenschutz-sicherheit`, `/anfrage-erhalten`) | 89 | none |
| 2026-09-06 00:11 | #85 | + `/ki-telefonassistent-zahnarztpraxis` | 90 | — |
| 2026-09-13 11:59 | #95 | − `/automatisierung-unternehmen` | 89 | → `/prozessautomatisierung` (301) |
| 2026-09-13 20:53 | #96 | − `/referenzen`, − `/bewertungen` | 87 | both → `/ueber-uns` (301) |
| 2026-11-04 13:44 | #105 | − `/webdesign-agentur-deutschland` | 86 | → `/webdesign` (301) |

The noindex set is the same three routes at both ends of the window. `src/lib/routing/indexability.ts` has no commit in the window.
`public/_headers` has no commit in the window. `vite.config.ts`, `scripts/generate-sitemap.mjs`, `src/entry-server.tsx` have none either.

Sitemap `lastmod` is hand-maintained and was not updated for several rebuilt pages: `/` still says 2026-03-14 after the 09-13 and
10-01 homepage rebuilds; `/kosten-ki-telefonassistent` and `/ki-telefonassistent-arzt` still say 2026-03-14 and `/praxen` 2026-08-16 after the 11-04
rebuilds; `/regensburg/website-relaunch` says 2026-03-14 after its title change. `lastmod` therefore cannot be used to date changes.

## 4 · High-risk events

Ranked by how much of what a crawler receives changed, not by any observed effect.

### 4.1 Edge head table removed — 28 URLs change title/description in one deploy (2026-09-12 22:58 +02:00)

**FACT.** Until PR #94, `functions/_middleware.ts` held a hard-coded table for 87 paths and rewrote `<title>`, meta description,
canonical, hreflang, `og:*`, `twitter:*` and keywords in the prerendered HTML on every request. At the baseline that table disagreed
with the manifest on 27 routes; by 09-12 on 29–30. PR #94 removed it. From that deploy the served raw HTML carries the manifest
values. Served title changed on `/kosten-ki-telefonassistent`, `/webdesign-hotel`, `/verpasste-anrufe-verlust`, `/muenchen/webdesign`,
`/referenzen`, `/blog/ki-telefonassistent-arztpraxis`; served description on 27 URLs including `/`, `/leistungen`, `/webdesign`,
`/ki-agentur-deutschland`, all three city `ki-telefonassistent` pages, all `webdesign-arzt*` pages.

**EVIDENCE.** `git show 6001b68:functions/_middleware.ts` (table, replacement regexes at end of file) vs `git show 56707c2:functions/_middleware.ts:67-131`;
commit `0beabff`; computed diff in Appendix B; the repo's own account in `docs/seo/organic-growth-scoreboard.md:306-335, 770-805`.

**HYPOTHESIS.** If organic clicks or CTR moved on these URLs in the two to three weeks after 09-12, the snippet rewrite is a
candidate cause, independent of any content work.

**ALTERNATIVE EXPLANATION.** (1) Googlebot renders JavaScript. `PageSEO` has resolved title/description from the manifest since
late August (`src/lib/routing/routeMetadata.ts`, header comment), so the *rendered* DOM already carried the manifest values while the
raw HTML carried the edge values. Google may have been indexing the manifest titles all along, in which case 09-12 changed nothing
it saw. The repo docs assert "the edge won" without a SERP or URL-inspection capture to prove it. (2) Google rewrites titles
frequently at these positions regardless. (3) The same evening and the next three days carry five other releases.

**CONFIDENCE.** High that the raw HTML changed as listed. Low on which version Google had indexed before, hence low on SERP effect.

**WHAT WOULD FALSIFY THIS.** A GSC URL-inspection "crawled page" HTML or a cached SERP title from before 09-12 showing the manifest
value; or the Cloudflare project being Workers-assets (§2), in which case the table never ran.

**RECOMMENDED ACTION.** In the GSC export, cut CTR by page for the 28 URLs in Appendix B with a break at 2026-09-12/13 (Pacific
date 09-12). Treat any page whose position also moved as uninterpretable for CTR.

### 4.2 The 09-10 → 09-17 burst: three pillar rebuilds, three retirements, sitewide link changes

**FACT.** Eleven public-site releases in under seven days: `/ki-telefonassistent` rebuilt with new title/H1 (09-12 21:56);
`/prozessautomatisierung` and `/kosten-automatisierung` rebuilt with new titles/H1s and `/automatisierung-unternehmen` 301'd (09-13 11:59);
homepage rebuilt with a new server-rendered H1 and `/referenzen` + `/bewertungen` 301'd (09-13 20:53); `/webdesign` and
`/kosten-webdesign` rebuilt with new titles/H1s, three city-hub titles and H1s changed (09-15 16:20); nav anchor renamed and blog
links added (09-17 12:09). Sitewide shell links changed on 09-06, 09-12, 09-13 (twice), 09-15 and 09-17.

**EVIDENCE.** §3.2 rows; commits `89fa3f0`, `6e8ffef`, `15f4996`, `8064ce0`, `69da89e`, `8e22406`, `7c78c25`, `5c20dc2`.

**HYPOTHESIS.** A domain-level change in impressions or clicks beginning between 09-13 and early October is more plausibly
connected to this burst than to any later release, simply because this is where almost all structural change sits.

**ALTERNATIVE EXPLANATION.** The repo's own numbers show domain impressions already falling **before** the burst: 3,102 → 2,297
between two consecutive seven-day windows ending 09-11 (`scoreboard:1202-1207`), and `/webdesign` dropping from 1,815 impressions
(08-14 → 08-30) to zero from 09-01 (`scoreboard:865-871`) with no commit touching that page between 08-26 and 09-04. Something
was moving before these releases shipped.

**CONFIDENCE.** High on the facts. No confidence on direction or size of effect.

**WHAT WOULD FALSIFY THIS.** Daily GSC series by page showing the affected pillars flat through 09-12 → 10-10.

**RECOMMENDED ACTION.** Do not attempt to attribute within the burst. Compare a pre-window (≤ 09-09) against a post-window
(09-18 → 09-29, see §5) per page, and report the burst as one event.

### 4.3 URL retirements with 301 (09-13, 09-13, 11-04)

**FACT.** Four indexable URLs were removed from router, manifest and sitemap and given a 301 in `public/_redirects`:
`/automatisierung-unternehmen` → `/prozessautomatisierung`; `/referenzen` → `/ueber-uns`; `/bewertungen` → `/ueber-uns`;
`/webdesign-agentur-deutschland` → `/webdesign`. Each has a slash and a non-slash rule. No chains.

**EVIDENCE.** `git diff 6001b68 origin/main -- public/_redirects`; `src/lib/routing/legacyRedirects.ts:36-82`; commits `15f4996`, `8064ce0`, `cb319b3`.

**HYPOTHESIS.** Low traffic risk: the repo's quoted GSC figures for the retired pages are 8 impressions (`/automatisierung-unternehmen`,
08-14 → 09-10) and 5 impressions, branded (`/webdesign-agentur-deutschland`). No figures exist for `/referenzen` or `/bewertungen`.

**ALTERNATIVE EXPLANATION.** `/referenzen` and `/bewertungen` are redirected to a page with a different intent (`/ueber-uns`); Google
may treat those as soft 404s. That costs nothing if they had no traffic, which is unknown. `/webdesign-agentur-deutschland` was the
page the whole site linked for the national webdesign intent until 09-15, then stood de-linked but indexable for 50 days.

**CONFIDENCE.** High on facts; medium that the traffic effect is negligible.

**WHAT WOULD FALSIFY THIS.** GSC page rows showing clicks on any of the four URLs before their retirement date.

**RECOMMENDED ACTION.** Pull the four URLs from the GSC page export for the 90 days before each retirement; check the live 301s.

### 4.4 November release: 22 heads, the best-ranking webdesign title, sitewide schema and nav (2026-11-04 13:44 +01:00)

**FACT.** After 34 days without a public change, PR #105 shipped 12 commits at once. Besides the items in §3.2: the title of
`/regensburg/website-relaunch` was changed. The repo's last quoted figures for that page are 331 impressions at position 10.9 with
two queries at position 5.8 (window 09-24 → 10-21). Two docs written on 10-23 say its head was left untouched; a later pass on the
same day changed it and it shipped. `/ki-telefonassistent-arzt` (471 impressions, pos. 35.4, same window) was rebuilt from a shared
template into a standalone page with a new title, description and H1. The global Organization/WebSite/LocalBusiness `@graph` was
removed from the static HTML of every page; the docs say an equivalent node is rendered by `LocalBusinessSchema.tsx`.

**EVIDENCE.** Commits `5150c34`, `cb319b3`, `647911b`, `6e0ba3d`, `dfb97ad`, `98ca6dd`, `2936360`, `4516338`, `29e37c9`;
`git diff a6a54b5^1 a6a54b5 -- index.html` (6 insertions, 162 deletions); `src/pages/cluster/regensburg/WebsiteRelaunchRegensburg.tsx`;
`FINAL_KEYWORD_OWNERSHIP.md:20`; `SEO_CHANGELOG.md` §6 vs `FINAL_SEO_CHANGELOG.md` (P1 · Inhalt, Regensburg row).

**HYPOTHESIS.** Any organic click change that begins after about 11-05 has exactly one repo candidate, this release. Within it the
candidates cannot be separated: title changes, a full page rebuild, sitewide nav links, schema removal, hreflang removal and a
redirect all share one timestamp.

**ALTERNATIVE EXPLANATION.** Sixteen days of post-release data (to 11-20, minus GSC lag) is short; a recrawl of 86 URLs with new
heads produces transient position noise by itself. Seasonal demand and Google updates are not visible from the repo.

**CONFIDENCE.** High on facts. On effect: none claimed.

**WHAT WOULD FALSIFY THIS.** A click change whose onset in daily data precedes 11-04, or sits on URLs whose head and body the
release did not touch (for example `/webdesign-hotel`, `/prozessautomatisierung`, `/kosten-webdesign`, `/kosten-automatisierung`).
Those four pages are the nearest thing to controls: title, description and H1 untouched, own source files changed by 0–4 lines (wrapper element, button classes). They are not perfect controls: they still received the sitewide nav, schema, hreflang and CTA-colour changes, and `/webdesign-hotel` renders through `NationalIndustryPage.tsx`, where three trust chips were reworded ("Einrichtung in wenigen Tagen" → "Übergabe in zwei Wochen", "Ca. 15 Minuten" → "Kein Verkaufsgespräch").

**RECOMMENDED ACTION.** Per-page daily series for `/regensburg/website-relaunch`, `/ki-telefonassistent-arzt`,
`/kosten-ki-telefonassistent`, `/praxen` against the four control pages, break at 11-04. Verify in a rich-results test that the
rendered HTML still carries one Organization node (not checked here; no build was run).

### 4.5 Homepage server-rendered H1 changed (2026-09-13 20:53 +02:00)

**FACT.** The prerender emits the mobile hero for `/` (`HeroSection.tsx`: `useState(false)`, "the server markup is always MobileHero").
At the baseline the mobile hero's H1 was "Digitale Systeme, die Unternehmen führen."; the desktop hero, swapped in after hydration,
read "Erreichbar, wenn niemand frei ist. Auch nachts. Auch samstags." PR #96 made both "Erreichbar, wenn niemand frei ist."
The same release rewrote most homepage sections.

**EVIDENCE.** `git show 6001b68:src/components/MobileHero.tsx:355-357,440-448`; `git show 6001b68:src/components/hero/DesktopHero.tsx:329-337`;
`git show ebe326f:src/components/MobileHero.tsx`; commits `8e22406`, `69da89e`.

**HYPOTHESIS.** Relevant only if homepage non-brand impressions moved after 09-13.

**ALTERNATIVE EXPLANATION.** Neither H1 contains a search term; the homepage title did not change at any point in the window.

**CONFIDENCE.** High on the fact; this change appears in no SEO document in the repo.

**WHAT WOULD FALSIFY THIS.** n/a (fact). **RECOMMENDED ACTION.** Include `/` in the per-page series; note it as undocumented.

### 4.6 Items checked and found unchanged or low-risk

| Dimension | Result | Evidence |
|---|---|---|
| noindex added/removed on an indexable URL | none in window | manifest snapshots: noindex set identical at `6001b68` and `a6a54b5` |
| canonical logic | unchanged. `canonicalFor()` and `CanonicalManager` have no commit in window. Edge rewrite of canonical ended 09-12; the edge table's canonicals were `https://cogniiq.de/<path>`, same as prerender | `publicRoutes.ts` (`canonicalFor`), `CanonicalManager.tsx`, baseline middleware |
| robots.txt | one line removed on 11-04: `Disallow: /anfrage-erhalten` (a noindex thank-you page) | `git diff 6001b68 origin/main -- public/robots.txt` |
| X-Robots-Tag headers | unchanged | `public/_headers`: no commit in window |
| prerender / SSR build | two edits only: redirect-rule validation (09-13), `x-default` rule (11-04) | `git log -- scripts vite.config.ts src/entry-server.tsx` |
| `HEAD` → 500 on prerendered routes | present for the whole window until 11-04; origin predates the shallow history. `GET` unaffected. Googlebot indexes with `GET`; uptime monitors, some link checkers and social scrapers use `HEAD` | `FINAL_SEO_RELEASE_AUDIT.md:31-32, 42-43`; commit `dfb97ad` |
| scaled page creation | none. +1 page in 80 days | §3.3 |
| hreflang | `de-DE` self-reference kept; `x-default` dropped on every page except `/` on 11-04 | `scripts/prerender.mjs:116-127` at `a6a54b5` |

## 5 · Windows with no production change

"Public-clean" ignores the six admin/CI/analytics-only merges, which rebuilt the site without changing its HTML content.

| Window (Europe/Berlin) | Length | State | Use |
|---|---|---|---|
| 2026-08-31 19:50 → 09-05 16:18 | 4.8 d | no merge at all | too short; also sits on the `/webdesign` impression collapse of 08-31/09-01 that predates the window |
| 2026-09-06 00:11 → 09-10 23:04 | 4.9 d | public-clean (one CI-only merge 09-06 10:40) | isolates the dental page launch + footer column; too short for ranking |
| **2026-09-17 12:09 → 09-30 20:31** | **13.3 d** | public-clean (one admin-only merge 09-24) | first usable read after the burst. Nothing about the crawlable content changed |
| 2026-09-30 20:31 → 10-01 18:08 | — | three UI releases (mobile nav, homepage showcase, site search) | no head, H1, route, redirect, sitemap or schema change; body change on `/` only |
| **2026-10-01 18:08 → 11-04 13:44** | **33.8 d** | **no merge at all** | the cleanest window in the investigation. A click change with onset inside 10-02 → 11-03 has **no** repo-side candidate |
| **2026-11-04 13:44 → 2026-11-20 (today)** | **16 d, open** | no merge at all | post-release window; `origin/main` head is still `a6a54b5` |

Combined reading: from 09-17 12:09 to 11-04 13:44 (48 days) the only changes were the three UI releases of 09-30/10-01. Titles,
descriptions, H1s, URLs, redirects, sitemap, robots and structured data were constant for those 48 days.

**FACT / HYPOTHESIS split for the later analyst.** FACT: these are windows without merges. HYPOTHESIS: they are windows without
*production* change — that depends on §2. Google also reacts with a lag of days to weeks, so an effect of the September burst can
legitimately surface inside the October window; a clean window rules out a new cause, not a delayed one.

## 6 · Documentation versus code

### 6.1 Documented, but not what shipped (or not when the docs say)

| # | Claim in docs | What git shows | Where |
|---|---|---|---|
| D1 | Graduation of five experiments, 301 of `/webdesign-agentur-deutschland`, Arzt rebuild, schema dedupe etc. are dated **2026-10-23** ("ERLEDIGT 23.10.2026", "graduated on 2026-10-23", "executed now") | Authored 10-23/10-24, **merged 2026-11-04 13:44 +01:00**. For 12 days the docs on the branch described a site that was not live | `ARCHITEKTUR.md:586`, `protectedExperiments.ts:53-80`, `legacyRedirects.ts:71-80`, `SEO_KEYWORD_MAP.md:57`, `FINAL_KEYWORD_OWNERSHIP.md:20` |
| D2 | `FINAL_KEYWORD_OWNERSHIP.md:20` reads the 09-24 → 10-21 export as "`/webdesign-agentur-deutschland` (301, 1 Impr. / Pos. 9 … die alte URL wurde im Fenster noch ausgespielt)" | In that window the URL was a normal live, indexable 200 page. The 301 did not exist in production | merge `a6a54b5` |
| D3 | `/regensburg/website-relaunch`: "Head bleibt in diesem Durchgang unverändert", "Heads untouched", "GRADUIERT … Head unverändert" | Title changed in the shipped release: "…Modernisierung ohne Rankingverlust" → "…Modernisierung & SEO-Migration". Only `FINAL_SEO_CHANGELOG.md` and one scoreboard row record it | `scoreboard:1520,1555`, `SEO_CHANGELOG.md` §6, `SEO_KEYWORD_MAP.md:60`, `post-experiment-opportunities.md:62` |
| D4 | `SEO_CHANGELOG.md` §4.1: Arzt description "…Rezept- und Überweisungswünsche strukturiert ans Team. Keine Triage. (151 chars)" | Shipped: "…Termine im Gespräch vergeben, verschieben, absagen – über den geprüften Kalenderweg. Rezeptwünsche ans Team. Keine Triage." The documented string never reached production | manifest at `a6a54b5` |
| D5 | `FINAL_SEO_CHANGELOG.md`: `/kosten-ki-telefonassistent` description "gedeckelter Telefonie und Übergabe in zwei Wochen"; `/webdesign` description "…was eine Website **bei Cogniiq** umfasst…" | Shipped: "…Ab 300 € netto im Monat mit 500 Inklusivminuten, jede weitere Minute 0,50 €, Einrichtung einmalig 990 €, zzgl. USt." and "Webdesign für Unternehmen: was eine Website umfasst, …". Three intermediate cost-page descriptions (10-23, 10-24, 10-24 Nachtrag) were never live | manifest at `a6a54b5`; `scoreboard:1580,1585,1598` |
| D6 | Scoreboard ledger of 09-14 lists "Merge 14.09.2026" for the webdesign rebuild and colour rollout | PR #97 merged **2026-09-15 16:20 +02:00** | `scoreboard:1213-1220` vs `d0f2083` |
| D7 | `legacyRedirects.ts:38`: "2026-09-14 — /referenzen and /bewertungen retired" | merged 2026-09-13 20:53 +02:00 (PR #96) | `ebe326f` |
| D8 | A5 `/ki-telefonassistent` rewrite dated "2026-09-11"; M23 automation consolidation dated "12.09.2026"; M5–M8 dated "2026-09-13"; M1/M2 "Umgesetzt 2026-09-10" | production: 09-12 21:56; 09-13 11:59; 09-15 16:20; body 09-11 15:04 and title 09-12 22:58 | §3.2 |
| D9 | `protectedExperiments.ts:65` and `scoreboard:1519`: the Bayreuth relaunch title experiment "never reached a crawler", "the edge served the OLD title" | True for raw HTML. Not established for Google's rendered view: `PageSEO` wrote the manifest title into the DOM after hydration throughout. The claim is stronger than its evidence | `routeMetadata.ts` header; §4.1 |
| D10 | `SEO_AUDIT_2026.md:49-56` and `ARCHITEKTUR.md:759` compare the last 28 days (6,448 impressions, 9 clicks, pos. 35.9) with a "prior comparable" period of 9,458 / 12 / 54.7 and read a +19-position improvement | 9,458 / 12 / 0.13 % / 54.7 are the undated "Ausgangslage" figures from August, which the scoreboard itself says are "**nicht** als Vergleichsgröße zu verwenden" because their period is unknown. The only dated earlier 28-day figure is 12,675 impressions / 14 clicks (08-12 → 09-08) | `scoreboard:22-36, 727-731, 573-577` |
| D11 | Scoreboard: `/ki-telefonassistent-zahnarztpraxis` "Veröffentlicht: 2026-09-05" | merged 2026-09-06 00:11 CEST = 09-05 22:11 UTC. Consistent in UTC and Pacific time; off by one day in local time | `d989a1b` |
| D12 | `protectedExperiments.ts:31` comment: "The global navigation and footer render on all 92 routes" | 89 routes at head | stale comment, no effect |
| D13 | Scoreboard weekly domain table, A1/A3/A4 measurement tables, frozen-experiment table | never filled in. Day-7/14/28/56/90 rows are empty for every asset | `scoreboard:40-48, 63-70, 107-114, 359-366` |

### 6.2 In production, but absent from the SEO documentation

| # | Change | Date | Evidence |
|---|---|---|---|
| U1 | Homepage server-rendered H1 changed; homepage sections rebuilt | 09-13 20:53 | §4.5. No entry in scoreboard, ARCHITEKTUR or COPY-SEO-CHANGELOG |
| U2 | `/referenzen` and `/bewertungen` retired with 301 to `/ueber-uns`; footer links removed | 09-13 20:53 | documented only in the code comment and `ARCHITEKTUR.md`; no scoreboard row, no baseline figures recorded for either URL |
| U3 | Layout shell change (`PageReveal`/`PremiumFooterReveal` removed, skip link) on every page | 09-13 20:53 | `git diff ebe326f^1 ebe326f -- src/App.tsx` |
| U4 | Mobile navigation rebuilt as drill-down | 09-30 20:31 | PR #102; zero mentions in any SEO doc |
| U5 | Homepage "showcase" scroll story, +347 lines CSS, calculator UI | 10-01 17:18 | PR #103; zero mentions |
| U6 | Site search added to the global header | 10-01 18:08 | PR #104; zero mentions |
| U7 | GA4 stream id corrected | 09-12 15:39 | PR #92; mentioned in COPY-SEO-CHANGELOG only as a merge note. Breaks GA4 continuity |
| U8 | `/kosten-ki-telefonassistent` joined the prerendered nav on every page (was hydration-only) | 09-12 21:56 | `Navigation.tsx` diff in `3e44c84`; mentioned in code and post-experiment doc, not in the scoreboard ledger |
| U9 | Served title of `/kosten-ki-telefonassistent` changed from "KI-Telefonassistent Kosten – Was kostet ein AI Rezeptionist? \| Cogniiq" to "Was kostet ein KI Telefonassistent? Preise \| Cogniiq" | 09-12 22:58 | Appendix B. The scoreboard names only four routes affected by the edge removal (`:779-784`); the cost page, a money page under measurement, is not among them |

### 6.3 Documented and confirmed in code

Zahnarzt page and footer column (09-06); claim corrections of 09-10; hotel and missed-calls retitle (manifest 09-11, served 09-12);
Arzt head contamination (09-11, served at once because both tables were edited); edge table removal and the 29-route drift (09-12; my
count is 27 drifting routes at baseline, 29–30 by 09-12, 28 URLs whose served head changed plus one held override — consistent);
automation consolidation and 301 (09-13); webdesign rebuild, city-hub retitles, deferred F9 (09-15); authority sprint (09-17);
`HEAD` fix, x-default, robots.txt line, JSON-LD dedupe, blog "2025" removal, nav slots, F9 301 (11-04).

## 7 · Per-URL head and H1 history (money pages)

Title and description history is in Appendix C (generated). H1 history, extracted from the page components:

| URL | H1 | Live from |
|---|---|---|
| `/` (server-rendered) | Digitale Systeme, die Unternehmen führen. | ≤ 2026-08-31 |
| `/` (server-rendered) | Erreichbar, wenn niemand frei ist. | 2026-09-13 20:53 (#96) |
| `/` (desktop, after hydration) | Erreichbar, wenn niemand frei ist. Auch nachts. Auch samstags. → third line dropped | ≤ 08-31 → 2026-09-13 20:53 |
| `/ki-telefonassistent` | Erreichbar, wenn niemand abnehmen kann. Ein KI Telefonassistent, zugeschnitten auf Ihren Betrieb. | ≤ 2026-08-31 |
| `/ki-telefonassistent` | KI-Telefonassistent für Unternehmen: Anrufe nicht nur annehmen. Anliegen erledigen. | 2026-09-12 21:56 (#93); soft hyphen added 09-13 (#96), text same |
| `/kosten-ki-telefonassistent` | Was kostet ein KI Telefonassistent? | whole window, unchanged |
| `/praxen` | Am Tresen steht eine Patientin. Und das Telefon klingelt trotzdem. | ≤ 2026-08-31 |
| `/praxen` | KI-Telefonassistent für Praxen: ein Empfang am Telefon, der Anliegen erledigt. | 2026-11-04 13:44 (#105) |
| `/ki-telefonassistent-arzt` | KI Telefonassistent für Arztpraxen | ≤ 2026-08-31 |
| `/ki-telefonassistent-arzt` | KI-Telefonassistent für Arztpraxen: Anrufe erledigen, nicht notieren | 2026-11-04 13:44 (#105) |
| `/ki-telefonassistent-praxis` | KI Telefonassistent für Therapeuten & Praxen | whole window, unchanged (title retargeted 11-04) |
| `/ki-telefonassistent-zahnarztpraxis` | KI-Telefonassistent in der Zahnarztpraxis: welche Anrufe er übernimmt und welche nicht | 2026-09-06 00:11 (#85), unchanged since |
| `/ki-telefonassistent-restaurant` | KI Telefonassistent für Restaurants & Gastronomie | unchanged |
| `/ki-telefonassistent-hotel` | KI Telefonassistent für Hotels & Pensionen | unchanged |
| `/bayern/ki-telefonassistent` | KI Telefonassistent für Unternehmen in Bayern | unchanged |
| `/ki-agentur-deutschland` | KI Agentur Deutschland – Telefonassistent & Automatisierung für Ihr Unternehmen | unchanged |
| `/prozessautomatisierung` | Manuelle Prozesse stoppen. KI übernimmt. | ≤ 2026-08-31 |
| `/prozessautomatisierung` | Geschäftsprozesse automatisieren — mit Ausnahmen, die jemand sieht | 2026-09-13 11:59 (#95) |
| `/automatisierung-unternehmen` | Automatisierung für Unternehmen – manuelle Prozesse ein für allemal lösen | until 2026-09-13 11:59, then 301 |
| `/kosten-automatisierung` | Was kostet Automatisierung für Unternehmen? | ≤ 2026-08-31 |
| `/kosten-automatisierung` | Was kostet Prozessautomatisierung? | 2026-09-13 11:59 (#95) |
| `/webdesign` | Websites, die ranken. Und konvertieren. | ≤ 2026-08-31 |
| `/webdesign` | Webdesign für Unternehmen: Websites mit einem klaren Auftrag | 2026-09-15 16:20 (#97) |
| `/webdesign-agentur-deutschland` | Webdesign Agentur Deutschland – Websites, die gefunden werden und konvertieren | until 2026-11-04 13:44, then 301 |
| `/kosten-webdesign` | Was kostet Webdesign? Kosten & Preise | ≤ 2026-08-31 |
| `/kosten-webdesign` | Was kostet eine Website? | 2026-09-15 16:20 (#97) |
| `/webdesign-hotel` | Webdesign für Hotels & Pensionen | whole window, unchanged |
| `/regensburg/website-relaunch` | Website Relaunch in Regensburg | whole window, unchanged |
| `/bayreuth/website-relaunch` | Website Relaunch in Bayreuth | whole window, unchanged |
| `/bayreuth/lokales-seo` | Lokales SEO in Bayreuth – Mehr Sichtbarkeit bei Google → SEO in Bayreuth: lokale Sichtbarkeit bei Google für Ihr Unternehmen | 2026-09-15 16:20 (#97) |

City-hub H1s (`/bayreuth`, `/muenchen`, `/regensburg`) changed on 2026-09-15 together with their titles; the docs give the new
form as "Cogniiq in <Stadt> – KI-Telefonassistent, Websites & Automatisierung". I did not extract the old strings.

Pages whose title, description **and** H1 were constant for the entire window: none of the money pages except by field —
`/webdesign-hotel` (title/description changed 09-12, nothing since), `/regensburg/website-relaunch` (constant until 11-04),
`/ki-telefonassistent-zahnarztpraxis` (constant since launch), `/ki-agentur-deutschland` (description only, 09-12 and 11-04).

## 8 · Pre-window context visible in the shallow history

Not part of the brief's window, but the later analyst will see their echo in September data. Between 2026-08-29 09:50 and
08-30 22:20 `main` received 27 merges, among them six SEO releases (PRs #51–#56: Regensburg and Bayreuth "production-ready",
München pricing, cost-page ranking pass, Bayreuth webdesign ownership), a navigation-hierarchy change that removed about 40
city × industry links from the footer (PR #63, `ARCHITEKTUR.md` §5.3), the switch of `PageSEO` to manifest metadata, and the
homepage SSR hero. The repo's own post-mortem of the `/webdesign` impression collapse on 08-31 concludes "No repository-side causal
event proven" (`ARCHITEKTUR.md:317-333`). I did not re-audit that period.

## Appendix A · Historical GSC figures quoted in the repo

This is the only pre-existing baseline. Every row is a quotation from a repo document, not a measurement made here. Property:
`sc-domain:cogniiq.de`, search type Web. "Owner" = relayed by the owner, not read from an export by the author of the doc.

### A.1 Domain level

| Window | Metric | Value | Source in repo | Provenance / caveat |
|---|---|---|---|---|
| undated ("Referenzzeitraum") | impressions / clicks / CTR / avg pos | 9,458 / 12 / 0.13 % / 54.7; 11 of 12 clicks branded; ≈ 83 % of non-brand impressions at pos ≥ 40 | `scoreboard:24-31` | from a task brief; period unknown; doc says do not use as comparison |
| 2026-06-09 → 09-08 (92 d) | impressions / clicks / CTR (Chart.csv) | 28,783 / 30 / 0.10 % | `scoreboard:573-581` | export read in session |
| same | brand impressions / brand clicks (Queries.csv) | 58 / 9 of 12 | same | Queries.csv capped at 1,000 rows |
| same | non-brand impressions / clicks (Queries.csv) | 27,089 / 3 | same | lower bound |
| same | impressions by file | Chart 28,783 · Queries 27,147 · Pages 32,093 | `scoreboard:585-587` | three aggregations, never mix |
| 2026-08-12 → 09-08 (28 d) | impressions / clicks / CTR (Chart.csv) | 12,675 / 14 / 0.11 % | `scoreboard:573-581` | export |
| same | brand impressions / clicks; non-brand impressions / clicks | 18 / 5 of 7; 12,036 / 2 | same | export |
| two consecutive 7-day windows ending 2026-09-11 | impressions; avg position | 3,102 → 2,297 (−26 %); 47.72 → 39.59 | `scoreboard:1202-1207` | connected account 09-14; decline lies before the 09-13 work |
| 2026-09-24 → 10-21 (28 d) | clicks / impressions / CTR / avg pos | 9 / 6,448 / 0.14 % / 35.9 | `FINAL_SEO_RELEASE_AUDIT.md:38`, `SEO_AUDIT_2026.md:49-56` | export `cogniiq.de-Performance-on-Search-2026-10-23.zip`, no Query×Page |
| same | impressions by device | desktop 4,692 · mobile 1,668 · tablet 88 | `FINAL_SEO_RELEASE_AUDIT.md:40` | export |

Dated 28-day impression series available from the repo: **12,675** (to 09-08) → **6,448** (to 10-21). Clicks 14 → 9.

### A.2 Page level

| Window | Page | Impr. | Clicks | Avg pos | Source |
|---|---|---|---|---|---|
| 08-12 → 09-08 | `/ki-telefonassistent` | 155 | 0 | 37.2 | `scoreboard:206-209` |
| 08-12 → 09-08 | `/webdesign-hotel` | 814 (3 M: 814) | 0 | 36.0 | `scoreboard:604-607` |
| 08-12 → 09-08 | `/verpasste-anrufe-verlust` | 59 (3 M: 122) | 0 | 18.5 (3 M: 15.5) | same |
| 08-12 → 09-08 | `/regensburg/webdesign` | 2,347 (3 M: 4,519) | 0 | 51.4 (54.5) | `post-experiment:224-232` |
| 08-12 → 09-08 | `/regensburg` | 2,623 | — | 75.8 | `scoreboard:945` |
| 08-12 → 09-08 | `/bayreuth/webdesign` | 853 (3 M: 1,858) | 0 | 52.0 (51.1) | `post-experiment:224-232` |
| 08-12 → 09-08 | `/ki-telefonassistent-arzt` | 543 (3 M: 1,258) | 0 | 31.7 (40.1) | same |
| 08-12 → 09-08 | `/kosten-ki-telefonassistent` | 364 (3 M: 802) | 0 | 31.2 (29.6) | same |
| 08-12 → 09-08 | `/muenchen/webdesign-kosten` | 268 (3 M: 420) | 0 | 37.2 (34.6) | same |
| 08-12 → 09-08 | `/regensburg/website-relaunch` | 358 (3 M: 364) | 1 (3 M) | 12.2 (12.3) | same |
| 08-12 → 09-08 | `/bayreuth/website-relaunch` | 131 (3 M: 139) | 0 | 14.4 (14.7) | same |
| 3 M vs 28 d to 09-08 | `/ki-telefonassistent-praxis` | 514 → 1 | — | — | `post-experiment:274` |
| 3 M vs 28 d to 09-08 | `/kosten-automatisierung` | 127 → 33 | — | 35.2 → 16.3 | `post-experiment:319-321` |
| 3 M vs 28 d to 09-08 | `/muenchen/automatisierung` | 163 → 41 | — | 37.2 → 23.3 | same |
| 08-14 → 08-30 | `/webdesign` | 1,815 (another passage: 1,756 "to 08-30") | 0 | mostly 70–90 | `scoreboard:865-871, 1174` — owner; the two figures disagree |
| 08-31 | `/webdesign` | 17 | 0 | — | same |
| 09-01 → 09-10 | `/webdesign` | 0 per day | 0 | — | same |
| 08-14 → 09-10 | `/webdesign-agentur-deutschland` | 5 | 0 | 1–3 (branded) | `scoreboard:877-878` — owner |
| 08-14 → 09-10 | `/prozessautomatisierung` | 23 | 0 | 38.43 | `scoreboard:1008-1012` — owner |
| 08-14 → 09-10 | `/automatisierung-unternehmen` | 8 | 0 | 66.62 | same |
| 08-14 → 09-10 | `/kosten-automatisierung` | 37 | 0 | 16.24 | same |
| ≈ 28 d to 09-10 | `/bayreuth` on "webdesign bayreuth" | 30 | — | — | `scoreboard:947` — owner |
| 09-24 → 10-21 | `/ki-telefonassistent` | 272 | 1 | 39.6 | `FINAL_KEYWORD_OWNERSHIP.md:14-24` |
| 09-24 → 10-21 | `/kosten-ki-telefonassistent` | 299 | 1 | 19.1 | same |
| 09-24 → 10-21 | `/praxen` | 48 | — | 55.9 | same |
| 09-24 → 10-21 | `/ki-telefonassistent-arzt` | 471 | 0 | 35.4 | same |
| 09-24 → 10-21 | `/ki-telefonassistent-zahnarztpraxis` | 85 | 0 | 8.9 | same |
| 09-24 → 10-21 | `/ki-telefonassistent-praxis` | not in page table | — | — | same |
| 09-24 → 10-21 | `/webdesign` | 3 | — | 66 | same |
| 09-24 → 10-21 | `/webdesign-agentur-deutschland` | 1 | — | 9 | same |
| 09-24 → 10-21 | `/regensburg/website-relaunch` | 331 | — | 10.9 | same |
| 09-24 → 10-21 | `/webdesign-hotel` | 1,184 | 0 | 17.7 | same |
| 09-24 → 10-21 | `/automatisierung-immobilien` | — | — | ≈ 20 | `SEO_AUDIT_2026.md:58-60` — owner summary |

Page-level change the repo's own figures show across the burst (different windows, read with care): `/kosten-ki-telefonassistent`
pos 31.2 → 19.1; `/webdesign-hotel` 814 impr. at 36.0 → 1,184 at 17.7; `/ki-telefonassistent` 155 at 37.2 → 272 at 39.6;
`/ki-telefonassistent-arzt` 543 at 31.7 → 471 at 35.4; `/webdesign` ~0 → 3. These are quotations, not conclusions.

### A.3 Query level

| Window | Query | Impr. | Avg pos | Page (if stated) | Source |
|---|---|---|---|---|---|
| 08-12 → 09-08 | ki telefonassistent | 42 | 34.3 | `/ki-telefonassistent` | `scoreboard:208-209` |
| 08-12 → 09-08 | ki telefonservice | 2 | 29.0 | `/ki-telefonassistent` | same |
| 08-12 → 09-08 | internetagentur hotel / internetagentur hotels | 193 / 124 | 44.7 / 44.0 | assumed `/webdesign-hotel` | `scoreboard:622-638` |
| 08-12 → 09-08 | website für hotellerie / webdesigner hotel / hotel webdesigners | 47 / 38 / 24 | 64.9 / 27.0 / 36.6 | same | same |
| 08-12 → 09-08 | hotel webdesign agentur / hotel website erstellen lassen / internetagentur für hotels / webdesign agentur für hotels | 23 / 22 / 6 / 3 | 27.7 / 68.8 / 47.7 / 36.0 | same | same |
| 08-12 → 09-08 | hotel webdesign / webdesign hotel / webdesign für hotels / webdesign hotels | 120 / 74 / 74 / 25 | 20.2 / 20.9 / 26.5 / 18.8 | same | same |
| 3 M / 28 d to 09-08 | verpasste anrufe kosten unternehmen | 39 / 28 | 11.2 / 12.1 | `/verpasste-anrufe-verlust` | `scoreboard:680-682` |
| to 09-08 | verpasste anrufe / entgangene anrufe | 15 / 3 | 23.6 / 24.7 | same | same |
| 3 M to 09-08 | webentwicklung bayreuth / web development / it-dienstleistungen / website relaunch münchen | 178 / 138 / 17 / 25 | 9.2 / 6.1 / 5.2 / 10.2 | — | `scoreboard:686-689` |
| 3 M / 28 d to 09-08 | ki telefonassistent arztpraxis | 342 / 148 | 38.8 / 33.1 | — | `post-experiment:244-254` |
| same | telefonassistent arztpraxis | 316 / 147 | 39.4 / 31.6 | — | same |
| same | ki telefonassistent kosten | 302 / 151 | 30.2 / 34.3 | — | same |
| same | ki-telefonassistent kosten | 165 / 75 | 29.6 / 33.4 | — | same |
| same | telefonassistent praxis | 150 / 58 | 40.0 / 31.2 | — | same |
| same | telefonassistent arzt | 147 / 54 | 34.2 / 26.8 | — | same |
| same | was kostet ein ki-telefonassistent? | 77 / 32 | 28.7 / 33.6 | — | same |
| same | ki telefonassistent praxis | 64 / 19 | 40.8 / 33.7 | — | same |
| same | ki-telefonassistent arztpraxis | 58 / 32 | 38.6 / 32.6 | — | same |
| 28 d to 09-08 | webdesign regensburg / regensburg webdesign / webdesign agentur regensburg | 700 / 286 / 435 | 57.8 / 57.8 / 47.4 | — | `post-experiment:313-315` |
| 08-14 → 08-30 | on `/webdesign`: webentwicklung regensburg / seo bayreuth / homepage erstellen lassen regensburg / landingpage optimierung regensburg / seo agentur bayreuth | 71 / 45 / 42 / 32 / 32 | 70–90 | `/webdesign` | `scoreboard:873-875` — owner |
| 08-14 → 09-10 | automatisierung kosten / automatisierung projekt kosten / automatisierungstechnik kosten | 12 / 6 / 4 | 13.0 / 17.17 / 15.5 | `/kosten-automatisierung` | `scoreboard:1028-1036` — owner |
| same | automatisierungslösung preis / welche kosten sind mit automatisierungstechnologien verbunden? / automatisierung überall preis / automatisierung preisauszeichnung | 2 / 2 / 4 / 1 | 20.5 / 11.0 / 34.25 / 14.0 | same | same |
| to 2026-09-14 (Query×Page, "laut Auftrag") | ki telefonassistent | 153 | 32.7 | `/ki-telefonassistent` | `scoreboard:1397-1416` |
| same | ki telefonassistent für unternehmen / telefonassistent / ki telefonzentrale | 21 / 57 / 21 | 29.3 / 36.6 / 32.0 | `/ki-telefonassistent` | same |
| same | ki telefonassistent kosten / ki telefonassistent preise | 175 / 18 | 30.4 / 20.1 | `/kosten-ki-telefonassistent` | same |
| same | ki telefonassistent arztpraxis | 145 | 33.9 | `/ki-telefonassistent-arzt` | same |
| same | prozessautomatisierung agentur / … kundenservice / … münchen | — | ~57 / ~58.6 / ~30 | `/prozessautomatisierung` (cluster) | same |
| same | roi der prozessautomatisierung / roi für prozessautomatisierung / "wie berechnet man den roi …" | — | 19.7 / 26.5 / ~8 | `/blog/prozessautomatisierung-roi` | same |
| same | hotel webdesign / webdesign hotel / webdesign hotels | 158 / 92 / 32 | 19.7 / 20.4 / 18.6 | `/webdesign-hotel` | same |
| same | webdesign agentur regensburg / webdesign regensburg / website erstellen lassen regensburg | 220 / 310 / 175 | 39.0 / 55.0 / 43.6 | `/regensburg/webdesign` | same |
| same | webdesign agentur bayreuth | 49 | 26.8 | `/bayreuth/webdesign` | same |
| ≈ 28 d before 08-29 | website performance bayreuth / website performance optimierung bayreuth | 27 / 22 | — / 7.2 | `/bayreuth/website-relaunch` | `docs/SEO-EXPERIMENT-BAYREUTH-PERFORMANCE-TITLE-2026-08-29.md:29-30` |
| 09-24 → 10-21 | ki telefonassistent | 49 | 42.8 | — | `FINAL_KEYWORD_OWNERSHIP.md:14-24` |
| 09-24 → 10-21 | ki telefonassistent kosten / ki telefonassistent preise | 143 / 33 | 19.2 / 17.8 | — | same |
| 09-24 → 10-21 | telefonassistent praxis / ki telefonassistent praxis | 34 / 24 | 39.4 / 41.8 | — | same |
| 09-24 → 10-21 | ki telefonassistent arztpraxis / telefonassistent arztpraxis / telefonassistent arzt | 111 / 83 / 42 | 40.3 / 34.3 / 25.7 | — | same |
| 09-24 → 10-21 | dental queries (three, unnamed) | 5 / 3 / 2 | 24.8 / 19.7 / 26.5 | — | same |
| 09-24 → 10-21 | website relaunch regensburg / homepage relaunch regensburg | 82 / 54 | 5.8 / 5.8 | — | same |
| "Auftrag" 2026-11-04, window unstated | KI Telefonassistent / … Arztpraxis / … Kosten / … Preise | — | 42.84 / 39.48 / 18.40 / 16.17 | — | `scoreboard:1590-1591` |

Caveats that travel with this appendix: the repo never held a Query×Page export for the October window; several September
figures were relayed by the owner rather than read from files; no raw export is committed (`git ls-files` has no `.csv`/`.zip`;
only the analyser `scripts/seo/gsc-analyze.mjs`). All clicks figures are single or low double digits, so the domain's click series
is noise-dominated at daily resolution: 14 clicks in 28 days to 09-08, 9 clicks in 28 days to 10-21.


## Appendix B · Every change to the served `<head>`, per release (generated)

Computed from the manifest and the edge table at each merge. "Served" = the value in the raw HTML response. Rows for 2026-09-12 22:58 are the edge-table removal: the manifest strings in the "After" column had mostly been in the repo for weeks; that merge is when they were first delivered.

| Merge (local) | PR | URL | Field | Before (served) | After (served) |
|---|---|---|---|---|---|
| 2026-09-06 00:11 +02:00 | #85 | `/ki-telefonassistent-zahnarztpraxis` | ROUTE ADDED | — | KI-Telefonassistent in der Zahnarztpraxis: Anrufe und Grenzen \| Cogniiq |
| 2026-09-11 15:54 +02:00 | #90 | `/ki-telefonassistent-arzt` | title | KI-Telefonassistent für Arztpraxen \| Termine automatisch buchen – Cogniiq | KI-Telefonassistent für Arztpraxen \| Terminwünsche aufnehmen – Cogniiq |
| 2026-09-11 15:54 +02:00 | #90 | `/ki-telefonassistent-arzt` | description | Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an, bucht Termine ins System, beantwortet häufige Fragen – auch außerhalb der Sprechzeiten, ohne Praxismitarbeiterin am Telefon. | Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb der Sprechzeiten. Eintrag ins Praxissystem nach geprüfter Anbindung. |
| 2026-09-12 21:56 +02:00 | #93 | `/ki-telefonassistent` | title | KI-Telefonassistent für Unternehmen \| Nie wieder verpasste Anrufe – Cogniiq | KI Telefonassistent für Unternehmen – Anrufe erledigen \| Cogniiq |
| 2026-09-12 21:56 +02:00 | #93 | `/ki-telefonassistent` | description | Der KI-Telefonassistent von Cogniiq nimmt jeden Anruf an, bucht Termine direkt ins System und beantwortet Fragen – auch außerhalb regulärer Geschäftszeiten, ohne Wartezeit. Einsatzbereit in 7 Tagen. | KI Telefonassistent, der Anrufe nicht nur annimmt: bucht, verschiebt und storniert Termine im Gespräch und beantwortet Ihre Fragen. Mit Preisrechner, ohne Anmeldung. |
| 2026-09-12 22:58 +02:00 | #94 | `/` | description | Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung. Kein Anruf geht verloren. Erste Systeme in ein bis zwei Wochen einsatzbereit. | Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, Websites und Prozessautomatisierung. Erreichbar auch außerhalb der Öffnungszeiten. |
| 2026-09-12 22:58 +02:00 | #94 | `/leistungen` | description | Drei operative Systeme für Ihr Unternehmen: KI-Telefonassistent, der jeden Anruf beantwortet – Webdesign, das konvertiert – Automatisierung, die manuelle Arbeit eliminiert. | Drei operative Systeme für Ihr Unternehmen: KI-Telefonassistent für die Anrufannahme, Webdesign für mehr Anfragen, Automatisierung gegen manuelle Handarbeit. |
| 2026-09-12 22:58 +02:00 | #94 | `/ueber-uns` | description | Cogniiq wurde von Lazar und Djordje Popovic in Bayreuth gegründet. Wir bauen operative KI-Systeme – keine Beratungsfolien, keine generischen Pakete. Direkter Kontakt, messbare Ergebnisse. | Cogniiq wurde von Lazar und Djordje Popovic in Bayreuth gegründet. Wir bauen operative KI-Systeme – keine Beratungsfolien, keine generischen Pakete. Direkter Kontakt. |
| 2026-09-12 22:58 +02:00 | #94 | `/referenzen` | title | Referenzen & Projektbeispiele \| Cogniiq KI- und Webdesign-Projekte | Referenzen – Arbeitsweise & Projektverständnis \| Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | `/referenzen` | description | Echte Projekte, messbare Ergebnisse: Webdesign, KI-Telefonassistenten und Automatisierungslösungen von Cogniiq für Unternehmen in Bayern und Deutschland. | Wie Cogniiq arbeitet: Nutzerführung, Geschäftslogik, Verwaltung und Betrieb als ein System. Kundenprojekte veröffentlichen wir nur mit schriftlicher Freigabe. |
| 2026-09-12 22:58 +02:00 | #94 | `/bewertungen` | description | Was Kunden über Cogniiq sagen: echte Bewertungen zu Webdesign, KI-Telefonassistenten und Automatisierung. Überzeugen Sie sich von unserer Arbeit. | Kundenstimmen veröffentlichen wir nur mit schriftlicher Freigabe. Derzeit ist keine veröffentlicht — hier steht, warum, und woran Sie unsere Arbeit stattdessen prüfen können. |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign` | description | Cogniiq entwickelt individuelle Websites, die bei Google ranken und Besucher in Anfragen verwandeln. Kein Template, kein Baukasten – sauberer Code, Core Web Vitals, Local SEO. | Cogniiq entwickelt individuelle Websites, die bei Google sichtbar sind und Besucher zu Anfragen führen: sauberer Code, Core Web Vitals, Local SEO. |
| 2026-09-12 22:58 +02:00 | #94 | `/ki-agentur-deutschland` | description | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt, einsatzbereit in ein bis zwei Wochen. | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt. |
| 2026-09-12 22:58 +02:00 | #94 | `/bayern/ki-telefonassistent` | description | Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an, bucht Termine, beantwortet Fragen – auch außerhalb regulärer Geschäftszeiten. Persönliche Einrichtung durch Cogniiq in Bayreuth. | Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb regulärer Geschäftszeiten. |
| 2026-09-12 22:58 +02:00 | #94 | `/muenchen` | description | Cogniiq betreut Unternehmen in München mit KI-Telefonassistenten, Webdesign und Prozessautomatisierung. Kein Template, kein Overhead – Systeme, die täglich arbeiten. | Cogniiq betreut Unternehmen in München mit KI-Telefonassistenten, Webdesign und Prozessautomatisierung – remote, mit festem Ansprechpartner und Festpreis. |
| 2026-09-12 22:58 +02:00 | #94 | `/regensburg` | description | Cogniiq entwickelt KI-Telefonassistenten, Webdesign und Automatisierungslösungen für Unternehmen in Regensburg. Persönliche Betreuung, erste Systeme in ein bis zwei Wochen einsatzbereit. | Cogniiq entwickelt KI-Telefonassistenten, Webdesign und Automatisierungslösungen für Unternehmen in Regensburg. Persönliche Betreuung. |
| 2026-09-12 22:58 +02:00 | #94 | `/bayreuth/ki-telefonassistent` | description | KI Telefonassistent Bayreuth: Automatische Anrufannahme, Terminbuchung & Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI Telefonassistent Bayreuth: Anrufannahme, Terminaufnahme und Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |
| 2026-09-12 22:58 +02:00 | #94 | `/bayreuth/website-erstellen` | description | Website in Bayreuth erstellen lassen: individuelle Entwicklung, SEO von Anfang an, DSGVO-konform. Go-Live in 7–14 Tagen. Persönliche Betreuung in Bayreuth. | Website in Bayreuth erstellen lassen: individuelle Entwicklung, SEO von Anfang an, kein Baukasten. Go-Live in 7–14 Tagen. Persönliche Betreuung in Bayreuth. |
| 2026-09-12 22:58 +02:00 | #94 | `/muenchen/webdesign` | title | Webdesign Agentur München – Website erstellen ohne Agentur-Overhead \| Cogniiq | Webdesign Agentur München – Website erstellen \| Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | `/muenchen/ki-telefonassistent` | description | KI Telefonassistent München: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Unternehmen. Auch außerhalb der Öffnungszeiten, mehrsprachig, DSGVO-konform. Ohne Münchner Agentur-Overhead. | KI Telefonassistent für Unternehmen in München: Anrufannahme mit Ihren Regeln, bis zu fünf Sprachen, strukturierte Übergabe, keine Gesprächsaufzeichnung. |
| 2026-09-12 22:58 +02:00 | #94 | `/muenchen/website-erstellen` | description | Website in München erstellen lassen: maßgeschneiderte Entwicklung, SEO, DSGVO-konform. Keine Templates, kein Baukasten – Go-Live in 7–14 Tagen. | Website in München erstellen lassen: maßgeschneiderte Entwicklung, SEO, individuelles Design. Keine Fertigvorlagen – Go-Live typischerweise in 7–14 Tagen. |
| 2026-09-12 22:58 +02:00 | #94 | `/regensburg/ki-telefonassistent` | description | KI Telefonassistent Regensburg: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI Telefonassistent Regensburg: Anrufannahme, Terminaufnahme und Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |
| 2026-09-12 22:58 +02:00 | #94 | `/regensburg/website-erstellen` | description | Website in Regensburg erstellen lassen: individuelle Entwicklung, SEO von Anfang an, DSGVO-konform. Persönliche Betreuung vor Ort in Regensburg. | Website in Regensburg erstellen lassen: individuelle Entwicklung, SEO von Anfang an, kein Baukasten. Persönliche Betreuung vor Ort in Regensburg. |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign-arzt-bayreuth` | description | Webdesign für Arztpraxen in Bayreuth: DSGVO-konforme Praxis-Websites mit Online-Terminbuchung, Patienteninformationen und lokalem SEO für mehr Neupatienten in Bayreuth. | Webdesign für Arztpraxen in Bayreuth: Praxis-Websites mit Online-Terminbuchung, Patienteninformationen und lokalem SEO für mehr Neupatienten in Bayreuth. |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign-arzt-muenchen` | description | Webdesign für Arztpraxen in München: DSGVO-konforme Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in München. | Webdesign für Arztpraxen in München: Praxis-Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in München. |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign-arzt-regensburg` | description | Webdesign für Arztpraxen in Regensburg: DSGVO-konforme Praxis-Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in Regensburg. | Webdesign für Arztpraxen in Regensburg: Praxis-Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in Regensburg. |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign-arzt` | description | Professionelle Websites für Arztpraxen und medizinische Einrichtungen. DSGVO-konform, mit Online-Terminbuchung, lokales SEO für mehr Neupatienten. | Professionelle Websites für Arztpraxen und medizinische Einrichtungen. Mit Online-Terminbuchung, lokales SEO für mehr Neupatienten. |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign-hotel` | title | Webdesign für Hotels & Pensionen \| Direktbuchungen steigern – Cogniiq | Webdesign für Hotels \| Internetagentur für Hotellerie – Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | `/webdesign-hotel` | description | Professionelle Hotel-Websites: Direktbuchungssystem, Zimmerpräsentation, SEO für mehr organische Buchungen. Weniger OTA-Provisionen, mehr Direktgäste. | Internetagentur für Hotellerie: Hotel-Websites mit Direktbuchungsstrecke, Zimmerpräsentation und lokalem SEO – für Stadthotels, Boutiquehotels und Pensionen. |
| 2026-09-12 22:58 +02:00 | #94 | `/ki-telefonassistent-restaurant` | description | KI-Telefonassistent für Restaurants: Tischreservierungen automatisch annehmen, Fragen beantworten, Öffnungszeiten mitteilen – kein Anruf geht mehr verloren. | KI Telefonassistent für Restaurants: Tischreservierungen entgegennehmen und strukturiert an Ihr Team übergeben – auch während des Service und am Wochenende. |
| 2026-09-12 22:58 +02:00 | #94 | `/ki-telefonassistent-praxis` | description | KI-Telefonassistent für Arzt- und Facharztpraxen: Termine buchen, Rezeptanfragen bearbeiten, Patientenkommunikation automatisieren – DSGVO-konform. | KI-Telefonassistent für Arzt- und Facharztpraxen: Termine aufnehmen, Rezeptanfragen strukturiert erfassen, Anmeldung entlasten – ohne Gesprächsaufzeichnung. |
| 2026-09-12 22:58 +02:00 | #94 | `/kosten-ki-telefonassistent` | title | KI-Telefonassistent Kosten – Was kostet ein AI Rezeptionist? \| Cogniiq | Was kostet ein KI Telefonassistent? Preise \| Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | `/kosten-ki-telefonassistent` | description | Transparente Preisübersicht für KI-Telefonassistenten: Einrichtung, monatliche Kosten, ROI-Berechnung. Was kostet ein AI-Rezeptionist für Praxen, Restaurants und Dienstleister? | Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung und Zwei-Wochen-Garantie. |
| 2026-09-12 22:58 +02:00 | #94 | `/verpasste-anrufe-verlust` | title | Verpasste Anrufe kosten täglich Umsatz – So hören Sie damit auf \| Cogniiq | Verpasste Anrufe: Was sie Unternehmen wirklich kosten \| Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | `/verpasste-anrufe-verlust` | description | Jeder verpasste Anruf ist ein verlorener Auftrag. Der KI-Telefonassistent von Cogniiq stellt sicher, dass kein Anruf mehr unbeantwortet bleibt – auch nachts und am Wochenende. | Verpasste Anrufe sind verlorene Aufträge. Der KI-Telefonassistent von Cogniiq nimmt Anrufe an, wenn Ihr Team gebunden ist – auch abends und am Wochenende. |
| 2026-09-12 22:58 +02:00 | #94 | `/digitale-automatisierung-unternehmen` | description | Digitale Automatisierung für KMU: Vom Erstgespräch bis zum laufenden System in ein bis zwei Wochen. Cogniiq entwickelt Automatisierungssysteme, die wirklich eingesetzt werden. | Digitale Automatisierung für KMU: Cogniiq entwickelt Automatisierungssysteme, die wirklich eingesetzt werden. |
| 2026-09-12 22:58 +02:00 | #94 | `/blog/ki-telefonassistent-arztpraxis` | title | KI-Telefonassistent Arztpraxis 2025 \| Vorteile & Kosten | KI-Telefonassistent für Arztpraxen: was er übernimmt, was beim Team bleibt \| Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | `/blog/ki-telefonassistent-arztpraxis` | description | Wie ein KI-Telefonassistent Arztpraxen dabei hilft, verpasste Anrufe zu eliminieren, Termine automatisch zu buchen und das Praxisteam zu entlasten. | Was ein KI-Telefonassistent in der Arztpraxis übernimmt, was immer beim Team bleibt und woran die Anbindung an die Praxissoftware hängt. |
| 2026-09-13 11:59 +02:00 | #95 | `/prozessautomatisierung` | title | Prozessautomatisierung für Unternehmen \| KI-Workflows – Cogniiq | Prozessautomatisierung für Unternehmen \| Abläufe automatisieren – Cogniiq |
| 2026-09-13 11:59 +02:00 | #95 | `/prozessautomatisierung` | description | Cogniiq automatisiert wiederkehrende Prozesse: Buchungen, Lead-Nachverfolgung, E-Mail-Workflows und mehr. Weniger manuelle Arbeit, mehr Kapazität für das Wesentliche. | Welche Prozesse sich automatisieren lassen, welche nicht, wie Ausnahmen und Schnittstellen behandelt werden und wie eine Umsetzung abläuft. Prozessautomatisierung für Unternehmen in Deutschland. |
| 2026-09-13 11:59 +02:00 | #95 | `/kosten-automatisierung` | title | Automatisierung Kosten – Was kostet Prozessautomatisierung? \| Cogniiq | Was kostet Prozessautomatisierung? Kosten, Preistreiber & Rechner \| Cogniiq |
| 2026-09-13 11:59 +02:00 | #95 | `/kosten-automatisierung` | description | Realistische Kostenübersicht für Prozessautomatisierung: von einfachen Workflows bis zu komplexen KI-Systemen. ROI und Amortisierungszeiten für verschiedene Unternehmensgrößen. | Was eine Prozessautomatisierung kostet, hängt an Ausnahmen, Schnittstellen und Absicherung. Alle Preistreiber erklärt, einmalige und laufende Kosten getrennt — plus Rechner für Ihren Prozess. |
| 2026-09-13 11:59 +02:00 | #95 | `/automatisierung-unternehmen` | ROUTE REMOVED | Automatisierung für Unternehmen \| KI-gestützte Workflows – Cogniiq | — |
| 2026-09-13 20:53 +02:00 | #96 | `/referenzen` | ROUTE REMOVED | Referenzen – Arbeitsweise & Projektverständnis \| Cogniiq | — |
| 2026-09-13 20:53 +02:00 | #96 | `/bewertungen` | ROUTE REMOVED | Bewertungen & Kundenstimmen \| Cogniiq AI-Agentur Bayern | — |
| 2026-09-15 16:20 +02:00 | #97 | `/webdesign` | title | Webdesign Agentur – Hochkonvertierende Websites für Unternehmen \| Cogniiq | Webdesign Agentur – Websites für Unternehmen \| Cogniiq |
| 2026-09-15 16:20 +02:00 | #97 | `/webdesign` | description | Cogniiq entwickelt individuelle Websites, die bei Google sichtbar sind und Besucher zu Anfragen führen: sauberer Code, Core Web Vitals, Local SEO. | Was eine Website bei Cogniiq umfasst, wer Inhalte liefert, wie SEO, Performance, Tracking und Barrierefreiheit ins Projekt kommen, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft. |
| 2026-09-15 16:20 +02:00 | #97 | `/bayreuth` | title | AI-Systeme & Webdesign in Bayreuth \| KI-Telefonassistent & Automatisierung – Cogniiq | Cogniiq in Bayreuth – KI-Telefonassistent, Websites & Automatisierung |
| 2026-09-15 16:20 +02:00 | #97 | `/muenchen` | title | AI-Systeme & Webdesign in München \| KI-Telefonassistent & Automatisierung – Cogniiq | Cogniiq in München – KI-Telefonassistent, Websites & Automatisierung |
| 2026-09-15 16:20 +02:00 | #97 | `/regensburg` | title | AI-Systeme & Webdesign in Regensburg \| KI-Telefonassistent & Automatisierung – Cogniiq | Cogniiq in Regensburg – KI-Telefonassistent, Websites & Automatisierung |
| 2026-09-15 16:20 +02:00 | #97 | `/bayreuth/lokales-seo` | title | Lokales SEO Bayreuth – Google Maps & lokale Suche optimieren \| Cogniiq | SEO Bayreuth – Lokales SEO & Google-Sichtbarkeit für Unternehmen \| Cogniiq |
| 2026-09-15 16:20 +02:00 | #97 | `/bayreuth/lokales-seo` | description | Lokales SEO für Unternehmen in Bayreuth: Google Maps Optimierung, lokale Suchanfragen, NAP-Konsistenz. Mehr Kunden aus der Region durch bessere lokale Sichtbarkeit. | SEO für Unternehmen in Bayreuth: Google-Business-Profil, lokale Suchanfragen, strukturierte Daten und NAP-Konsistenz. Was lokales SEO umfasst, wann es sich lohnt und wie Cogniiq es umsetzt. |
| 2026-09-15 16:20 +02:00 | #97 | `/kosten-webdesign` | title | Webdesign Kosten 2025 – Was kostet eine professionelle Website? \| Cogniiq | Was kostet eine Website? Webdesign Kosten & Preistreiber \| Cogniiq |
| 2026-09-15 16:20 +02:00 | #97 | `/kosten-webdesign` | description | Was kostet Webdesign wirklich? Preise für individuelle Websites, Ladezeiten, SEO-Optimierung und Wartung. Transparente Kostenübersicht von der AI-Agentur Cogniiq. | Was eine professionelle Website kostet, hängt an Seitenumfang, Inhalten, Design, Schnittstellen, Barrierefreiheit und Betreuung. Alle Preistreiber erklärt, einmalig und laufend getrennt — ohne Fantasiepreise. |
| 2026-09-17 12:09 +02:00 | #99 | `/deutschland` | description | Cogniiq entwickelt KI-Telefonassistenten, hochkonvertierende Websites und Automatisierungssysteme für Unternehmen in ganz Deutschland. Remote oder persönlich in Bayern. | Cogniiq entwickelt KI-Telefonassistenten, Websites für Unternehmen und Prozessautomatisierung für Unternehmen in ganz Deutschland. Remote oder persönlich in Bayern. |
| 2026-09-17 12:09 +02:00 | #99 | `/blog/prozessautomatisierung-roi` | title | Prozessautomatisierung ROI berechnen 2025 \| Leitfaden | Prozessautomatisierung ROI berechnen \| Formel, Amortisation, Kostenfallen |
| 2026-09-17 12:09 +02:00 | #99 | `/blog/prozessautomatisierung-roi` | description | Wie Sie den Return on Investment einer Prozessautomatisierung korrekt berechnen – mit Formel, konkreten Beispielen und typischen Kostenfallen. | Wie Sie den ROI einer Prozessautomatisierung berechnen: Formel, welche Kosten in die Rechnung gehören, Amortisationszeit statt Prozentwert und wann sich Automatisierung nicht rechnet. |
| 2026-09-17 12:09 +02:00 | #99 | `/blog/ki-telefonassistent-restaurant` | description | Wie Restaurants mit einem KI-Telefonassistenten Reservierungen automatisch annehmen, Wartelisten führen und Gäste nachqualifizieren – ohne Personal. | Wie Restaurants mit einem KI-Telefonassistenten Reservierungsanfragen auch in der Stoßzeit annehmen, was der Assistent übernimmt, was beim Team bleibt und woran die Anbindung an ein Reservierungssystem hängt. |
| 2026-11-04 13:44 +01:00 | #105 | `/kontakt` | description | 30 Minuten – wir schauen uns Ihre konkrete Situation an und zeigen, wo KI-Telefonie, Webdesign oder Automatisierung sofort wirkt. Kein Pitch. Kein Standardangebot. | Ein kurzes Gespräch – wir schauen uns Ihre konkrete Situation an und zeigen, wo KI-Telefonie, Webdesign oder Automatisierung sofort wirkt. Kein Pitch. Kein Standardangebot. |
| 2026-11-04 13:44 +01:00 | #105 | `/praxen` | description | Ein Empfang am Telefon für Ihre Praxis: Ihre Stimmauswahl, Ihre Regeln, strukturierte Übergabe. Keine Triage, Kontingent mit Obergrenze, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI-Telefonassistent für Arzt-, Zahnarzt- und Therapiepraxen: Wegweiser zur passenden Praxisseite – plus Kalenderweg, Übergabe und Datenschutz für alle. |
| 2026-11-04 13:44 +01:00 | #105 | `/ki-telefonassistent` | description | KI Telefonassistent, der Anrufe nicht nur annimmt: bucht, verschiebt und storniert Termine im Gespräch und beantwortet Ihre Fragen. Mit Preisrechner, ohne Anmeldung. | KI Telefonassistent, der Anrufe nicht nur annimmt: bucht, verschiebt und storniert Termine im Gespräch und beantwortet Ihre Fragen. Rechner ohne Anmeldung. |
| 2026-11-04 13:44 +01:00 | #105 | `/webdesign` | description | Was eine Website bei Cogniiq umfasst, wer Inhalte liefert, wie SEO, Performance, Tracking und Barrierefreiheit ins Projekt kommen, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft. | Webdesign für Unternehmen: was eine Website umfasst, wer die Inhalte liefert, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft. |
| 2026-11-04 13:44 +01:00 | #105 | `/ki-agentur-deutschland` | description | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt. | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten und Automatisierungssysteme – entwickelt für den deutschen Markt. |
| 2026-11-04 13:44 +01:00 | #105 | `/bayreuth` | description | Cogniiq – Ihre AI-Agentur in Bayreuth. KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung für Unternehmen in Oberfranken. Persönliche Betreuung vor Ort. | Cogniiq – Ihre AI-Agentur in Bayreuth. KI-Telefonassistent, Websites und Prozessautomatisierung für Unternehmen in Oberfranken. Persönliche Betreuung vor Ort. |
| 2026-11-04 13:44 +01:00 | #105 | `/bayreuth/website-relaunch` | description | Website Relaunch in Bayreuth: Ihre bestehende Website modernisieren ohne Rankingverlust. Neues Design, bessere Performance, stärkeres SEO – persönliche Betreuung. | Website Relaunch in Bayreuth: bestehende Website modernisieren, Weiterleitungen und Inhalte vor dem Umzug geprüft. Neues Design, schnellere Ladezeit, persönliche Betreuung. |
| 2026-11-04 13:44 +01:00 | #105 | `/regensburg/website-relaunch` | title | Website Relaunch Regensburg – Modernisierung ohne Rankingverlust \| Cogniiq | Website Relaunch Regensburg – Modernisierung & SEO-Migration \| Cogniiq |
| 2026-11-04 13:44 +01:00 | #105 | `/ki-telefonassistent-arzt` | title | KI-Telefonassistent für Arztpraxen \| Terminwünsche aufnehmen – Cogniiq | KI-Telefonassistent Arztpraxis: Anrufe erledigen \| Cogniiq |
| 2026-11-04 13:44 +01:00 | #105 | `/ki-telefonassistent-arzt` | description | Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb der Sprechzeiten. Eintrag ins Praxissystem nach geprüfter Anbindung. | KI-Telefonassistent für Arztpraxen: Termine im Gespräch vergeben, verschieben, absagen – über den geprüften Kalenderweg. Rezeptwünsche ans Team. Keine Triage. |
| 2026-11-04 13:44 +01:00 | #105 | `/ki-telefonassistent-praxis` | title | KI-Telefonassistent für medizinische Praxen \| Terminverwaltung automatisieren – Cogniiq | KI-Telefonassistent für Therapiepraxen \| Cogniiq |
| 2026-11-04 13:44 +01:00 | #105 | `/ki-telefonassistent-praxis` | description | KI-Telefonassistent für Arzt- und Facharztpraxen: Termine aufnehmen, Rezeptanfragen strukturiert erfassen, Anmeldung entlasten – ohne Gesprächsaufzeichnung. | KI-Telefonassistent für Physio-, Ergo- und Logopädie-Praxen: erreichbar bleiben, während Sie behandeln. Termine im Gespräch vergeben, verschieben, absagen – ohne Mitschnitt. |
| 2026-11-04 13:44 +01:00 | #105 | `/automatisierung-arzt` | title | Automatisierung für Arztpraxen \| Terminbuchung & Kommunikation – Cogniiq | Automatisierung für Arztpraxen \| Erinnerungen, Warteliste & Kommunikation – Cogniiq |
| 2026-11-04 13:44 +01:00 | #105 | `/automatisierung-arzt` | description | Prozessautomatisierung für Arztpraxen: Terminbuchung, Erinnerungen, Patientenkommunikation und Dokumentenverwaltung automatisieren. Mehr Zeit für Patienten. | Prozessautomatisierung für Arztpraxen: Terminbestätigungen, Erinnerungen, Wartelistenkontakt und Patientenkommunikation regelbasiert automatisieren – mit Mensch an den Entscheidungsstellen. |
| 2026-11-04 13:44 +01:00 | #105 | `/kosten-ki-telefonassistent` | description | Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung und Zwei-Wochen-Garantie. | Was kostet ein KI Telefonassistent für Praxen? Ab 300 € netto im Monat mit 500 Inklusivminuten, jede weitere Minute 0,50 €, Einrichtung einmalig 990 €, zzgl. USt. |
| 2026-11-04 13:44 +01:00 | #105 | `/keine-terminbuchung-online` | description | Ohne Online-Terminbuchung verlieren Sie Patienten und Kunden an Wettbewerber. Cogniiq integriert Terminbuchungssysteme in Ihre Website – in wenigen Tagen. | Ohne Online-Terminbuchung buchen Patienten und Kunden dort, wo es abends noch geht. Was eine Terminbuchung auf der Website leistet, was sie voraussetzt und wie Cogniiq sie einrichtet. |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/ki-automatisierung-kleine-unternehmen` | title | KI-Automatisierung für kleine Unternehmen 2025 \| Leitfaden | KI-Automatisierung für kleine Unternehmen \| Leitfaden |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/ki-telefonassistent-arztpraxis` | title | KI-Telefonassistent für Arztpraxen: was er übernimmt, was beim Team bleibt \| Cogniiq | Telefon in der Arztpraxis: was beim Team bleiben muss \| Cogniiq |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/ki-telefonassistent-arztpraxis` | description | Was ein KI-Telefonassistent in der Arztpraxis übernimmt, was immer beim Team bleibt und woran die Anbindung an die Praxissoftware hängt. | Rezept, Befund, Akuttermin, Krankschreibung: welche Anrufe in einer Arztpraxis ein Mensch führen muss, welche ein Assistent erledigen kann – und woran die Praxissoftware-Anbindung hängt. |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/webdesign-konversion-tipps` | title | Webdesign für mehr Anfragen & Konversion 2025 \| 8 Tipps | Webdesign für mehr Anfragen & Konversion \| 8 Tipps |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/lokales-seo-unternehmen` | title | Lokales SEO für Unternehmen 2025 \| Google Maps & lokale Suche | Lokales SEO für Unternehmen \| Google Maps & lokale Suche |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/ki-telefonassistent-restaurant` | title | KI-Telefonassistent Restaurant 2025 \| Reservierungen automatisieren | KI-Telefonassistent Restaurant \| Reservierungen automatisieren |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/website-ohne-anfragen` | title | Website bringt keine Anfragen? Ursachen & Lösungen 2025 | Website bringt keine Anfragen? Ursachen & Lösungen |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/digitalisierung-mittelstand` | title | Digitalisierung Mittelstand 2025 \| Wo anfangen & was vermeiden | Digitalisierung Mittelstand \| Wo anfangen & was vermeiden |
| 2026-11-04 13:44 +01:00 | #105 | `/blog/webdesign-agentur-auswahl` | title | Webdesign Agentur auswählen 2025 \| 7 entscheidende Kriterien | Webdesign Agentur auswählen \| 7 entscheidende Kriterien |
| 2026-11-04 13:44 +01:00 | #105 | `/webdesign-agentur-deutschland` | ROUTE REMOVED | Webdesign Agentur Deutschland \| Individuelle Websites national – Cogniiq | — |

### B.1 Counts per release

| Merge (local) | PR | Manifest routes | Indexable (= sitemap URLs) | Routes added | Routes removed | Served title changes | Served description changes | Edge-table entries | Edge≠manifest drift |
|---|---|---|---|---|---|---|---|---|---|
| 2026-08-31 19:50 +02:00 | baseline | 92 | 89 | 0 | 0 | 0 | 0 | 87 | 27 |
| 2026-09-05 16:18 +02:00 | #84 | 92 | 89 | 0 | 0 | 0 | 0 | 87 | 27 |
| 2026-09-05 16:51 +02:00 | #83 | 92 | 89 | 0 | 0 | 0 | 0 | 87 | 27 |
| 2026-09-06 00:11 +02:00 | #85 | 93 | 90 | /ki-telefonassistent-zahnarztpraxis | 0 | 0 | 0 | 87 | 28 |
| 2026-09-06 10:40 +02:00 | #86 | 93 | 90 | 0 | 0 | 0 | 0 | 87 | 28 |
| 2026-09-10 23:04 +02:00 | #87 | 93 | 90 | 0 | 0 | 0 | 0 | 87 | 28 |
| 2026-09-10 23:51 +02:00 | #88 | 93 | 90 | 0 | 0 | 0 | 0 | 87 | 29 |
| 2026-09-11 15:04 +02:00 | #89 | 93 | 90 | 0 | 0 | 0 | 0 | 87 | 30 |
| 2026-09-11 15:54 +02:00 | #90 | 93 | 90 | 0 | 0 | 1 | 1 | 87 | 30 |
| 2026-09-11 16:53 +02:00 | #91 | 93 | 90 | 0 | 0 | 0 | 0 | 87 | 30 |
| 2026-09-12 15:39 +02:00 | #92 | 93 | 90 | 0 | 0 | 0 | 0 | 87 | 30 |
| 2026-09-12 21:56 +02:00 | #93 | 93 | 90 | 0 | 0 | 1 | 1 | 87 | 29 |
| 2026-09-12 22:58 +02:00 | #94 | 93 | 90 | 0 | 0 | 6 | 27 | 1 | 1 |
| 2026-09-13 11:59 +02:00 | #95 | 92 | 89 | 0 | /automatisierung-unternehmen | 2 | 2 | 1 | 1 |
| 2026-09-13 20:53 +02:00 | #96 | 90 | 87 | 0 | /referenzen, /bewertungen | 0 | 0 | 1 | 1 |
| 2026-09-15 16:20 +02:00 | #97 | 90 | 87 | 0 | 0 | 6 | 3 | 1 | 1 |
| 2026-09-17 12:09 +02:00 | #99 | 90 | 87 | 0 | 0 | 1 | 3 | 1 | 1 |
| 2026-09-24 12:09 +02:00 | #100 | 90 | 87 | 0 | 0 | 0 | 0 | 1 | 1 |
| 2026-09-30 20:31 +02:00 | #102 | 90 | 87 | 0 | 0 | 0 | 0 | 1 | 1 |
| 2026-10-01 17:18 +02:00 | #103 | 90 | 87 | 0 | 0 | 0 | 0 | 1 | 1 |
| 2026-10-01 18:08 +02:00 | #104 | 90 | 87 | 0 | 0 | 0 | 0 | 1 | 1 |
| 2026-11-04 13:44 +01:00 | #105 | 89 | 86 | 0 | /webdesign-agentur-deutschland | 12 | 13 | 0 | 0 |

## Appendix C · Title / description history per money page (generated)

The right-hand column is filled only where the manifest held a different string from the one served. Until 2026-09-12 22:58 that manifest string was also what `PageSEO` wrote into the DOM after hydration, so a rendering crawler may have seen it (see §4.1).

#### `/`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung. Kein Anruf geht verloren. Erste Systeme in ein bis zwei Wochen einsatzbereit. | Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, Websites und Prozessautomatisierung. Erreichbar auch außerhalb der Öffnungszeiten. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-12 22:58 +02:00 | #94 | description | Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, Websites und Prozessautomatisierung. Erreichbar auch außerhalb der Öffnungszeiten. |  |

#### `/ki-telefonassistent`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent für Unternehmen \| Nie wieder verpasste Anrufe – Cogniiq | KI Telefonassistent – individuell konfiguriert \| Cogniiq |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Der KI-Telefonassistent von Cogniiq nimmt jeden Anruf an, bucht Termine direkt ins System und beantwortet Fragen – auch außerhalb regulärer Geschäftszeiten, ohne Wartezeit. Einsatzbereit in 7 Tagen. | KI Telefonassistent mit Ihrer Stimmauswahl, Ihren Regeln und strukturierter Übergabe an Ihr Team. Festes Minutenkontingent mit Obergrenze, keine Gesprächsaufzeichnung. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-06-30 | |
| 2026-09-12 21:56 +02:00 | #93 | title | KI Telefonassistent für Unternehmen – Anrufe erledigen \| Cogniiq |  |
| 2026-09-12 21:56 +02:00 | #93 | description | KI Telefonassistent, der Anrufe nicht nur annimmt: bucht, verschiebt und storniert Termine im Gespräch und beantwortet Ihre Fragen. Mit Preisrechner, ohne Anmeldung. |  |
| 2026-09-12 21:56 +02:00 | #93 | indexable / sitemap lastmod | index,follow / 2026-09-11 | |
| 2026-11-04 13:44 +01:00 | #105 | description | KI Telefonassistent, der Anrufe nicht nur annimmt: bucht, verschiebt und storniert Termine im Gespräch und beantwortet Ihre Fragen. Rechner ohne Anmeldung. |  |

#### `/kosten-ki-telefonassistent`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent Kosten – Was kostet ein AI Rezeptionist? \| Cogniiq | Was kostet ein KI Telefonassistent? Preise \| Cogniiq |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Transparente Preisübersicht für KI-Telefonassistenten: Einrichtung, monatliche Kosten, ROI-Berechnung. Was kostet ein AI-Rezeptionist für Praxen, Restaurants und Dienstleister? | Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung und Zwei-Wochen-Garantie. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-12 22:58 +02:00 | #94 | title | Was kostet ein KI Telefonassistent? Preise \| Cogniiq |  |
| 2026-09-12 22:58 +02:00 | #94 | description | Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung und Zwei-Wochen-Garantie. |  |
| 2026-11-04 13:44 +01:00 | #105 | description | Was kostet ein KI Telefonassistent für Praxen? Ab 300 € netto im Monat mit 500 Inklusivminuten, jede weitere Minute 0,50 €, Einrichtung einmalig 990 €, zzgl. USt. |  |

#### `/praxen`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI Telefonassistent für Praxen – Ihr Empfang \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Ein Empfang am Telefon für Ihre Praxis: Ihre Stimmauswahl, Ihre Regeln, strukturierte Übergabe. Keine Triage, Kontingent mit Obergrenze, in zwei Wochen eingerichtet und bereit zur Freigabe. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-08-16 | |
| 2026-11-04 13:44 +01:00 | #105 | description | KI-Telefonassistent für Arzt-, Zahnarzt- und Therapiepraxen: Wegweiser zur passenden Praxisseite – plus Kalenderweg, Übergabe und Datenschutz für alle. |  |

#### `/ki-telefonassistent-arzt`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent für Arztpraxen \| Termine automatisch buchen – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an, bucht Termine ins System, beantwortet häufige Fragen – auch außerhalb der Sprechzeiten, ohne Praxismitarbeiterin am Telefon. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-11 15:54 +02:00 | #90 | title | KI-Telefonassistent für Arztpraxen \| Terminwünsche aufnehmen – Cogniiq |  |
| 2026-09-11 15:54 +02:00 | #90 | description | Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb der Sprechzeiten. Eintrag ins Praxissystem nach geprüfter Anbindung. |  |
| 2026-11-04 13:44 +01:00 | #105 | title | KI-Telefonassistent Arztpraxis: Anrufe erledigen \| Cogniiq |  |
| 2026-11-04 13:44 +01:00 | #105 | description | KI-Telefonassistent für Arztpraxen: Termine im Gespräch vergeben, verschieben, absagen – über den geprüften Kalenderweg. Rezeptwünsche ans Team. Keine Triage. |  |

#### `/ki-telefonassistent-praxis`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent für medizinische Praxen \| Terminverwaltung automatisieren – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | KI-Telefonassistent für Arzt- und Facharztpraxen: Termine buchen, Rezeptanfragen bearbeiten, Patientenkommunikation automatisieren – DSGVO-konform. | KI-Telefonassistent für Arzt- und Facharztpraxen: Termine aufnehmen, Rezeptanfragen strukturiert erfassen, Anmeldung entlasten – ohne Gesprächsaufzeichnung. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-12 22:58 +02:00 | #94 | description | KI-Telefonassistent für Arzt- und Facharztpraxen: Termine aufnehmen, Rezeptanfragen strukturiert erfassen, Anmeldung entlasten – ohne Gesprächsaufzeichnung. |  |
| 2026-11-04 13:44 +01:00 | #105 | title | KI-Telefonassistent für Therapiepraxen \| Cogniiq |  |
| 2026-11-04 13:44 +01:00 | #105 | description | KI-Telefonassistent für Physio-, Ergo- und Logopädie-Praxen: erreichbar bleiben, während Sie behandeln. Termine im Gespräch vergeben, verschieben, absagen – ohne Mitschnitt. |  |

#### `/ki-telefonassistent-zahnarztpraxis`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| 2026-09-06 00:11 +02:00 | #85 | ROUTE | **new route added** | |
| 2026-09-06 00:11 +02:00 | #85 | title | KI-Telefonassistent in der Zahnarztpraxis: Anrufe und Grenzen \| Cogniiq |  |
| 2026-09-06 00:11 +02:00 | #85 | description | Welche Anrufe einer Zahnarztpraxis ein KI-Telefonassistent übernimmt, welche beim Team bleiben – und wie Absagen, Recall-Rückrufe und Behandlungszeit geregelt werden. |  |
| 2026-09-06 00:11 +02:00 | #85 | indexable / sitemap lastmod | index,follow / 2026-09-05 | |

#### `/ki-telefonassistent-einfuehren`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent in der Praxis einführen \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Wie eine Praxis einen KI-Telefonassistenten einführt: welche Anrufe infrage kommen, wie die Übergabe geklärt wird und was vor der Freigabe geprüft gehört. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-08-29 | |
| 2026-09-06 00:11 +02:00 | #85 | indexable / sitemap lastmod | index,follow / 2026-09-05 | |

#### `/ki-telefonassistent-restaurant`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent für Restaurants \| Reservierungen automatisch annehmen – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | KI-Telefonassistent für Restaurants: Tischreservierungen automatisch annehmen, Fragen beantworten, Öffnungszeiten mitteilen – kein Anruf geht mehr verloren. | KI Telefonassistent für Restaurants: Tischreservierungen entgegennehmen, bestätigen und erinnern – auch während des Service, abends und am Wochenende. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-10 23:51 +02:00 | #88 | description (manifest-only change, NOT served) | KI-Telefonassistent für Restaurants: Tischreservierungen automatisch annehmen, Fragen beantworten, Öffnungszeiten mitteilen – kein Anruf geht mehr verloren. | KI Telefonassistent für Restaurants: Tischreservierungen entgegennehmen und strukturiert an Ihr Team übergeben – auch während des Service und am Wochenende. |
| 2026-09-12 22:58 +02:00 | #94 | description | KI Telefonassistent für Restaurants: Tischreservierungen entgegennehmen und strukturiert an Ihr Team übergeben – auch während des Service und am Wochenende. |  |

#### `/ki-telefonassistent-hotel`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent für Hotels \| Buchungsanfragen auch nachts bearbeiten – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | KI-Telefonassistent für Hotels: Buchungsanfragen annehmen, Zimmerverfügbarkeiten mitteilen, Fragen beantworten – auch außerhalb der Rezeptionszeiten, ohne zusätzliches Personal. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |

#### `/ki-telefonassistent/demo`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent Demo \| Live-Vorführung AI-Rezeptionistin – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Testen Sie den KI-Telefonassistenten von Cogniiq live. Hören Sie, wie die AI-Rezeptionistin Anrufe annimmt, Termine bucht und Fragen beantwortet – auch außerhalb regulärer Geschäftszeiten. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |

#### `/bayern/ki-telefonassistent`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI-Telefonassistent Bayern \| AI-Rezeptionistin für bayerische Unternehmen – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an, bucht Termine, beantwortet Fragen – auch außerhalb regulärer Geschäftszeiten. Persönliche Einrichtung durch Cogniiq in Bayreuth. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-10 23:51 +02:00 | #88 | description (manifest-only change, NOT served) | Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an, bucht Termine, beantwortet Fragen – auch außerhalb regulärer Geschäftszeiten. Persönliche Einrichtung durch Cogniiq in Bayreuth. | Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb regulärer Geschäftszeiten. |
| 2026-09-12 22:58 +02:00 | #94 | description | Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb regulärer Geschäftszeiten. |  |

#### `/bayreuth/ki-telefonassistent`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | KI Telefonassistent Bayreuth: Automatische Anrufannahme, Terminbuchung & Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI Telefonassistent Bayreuth: Anrufannahme, Terminbuchung und Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-10 23:51 +02:00 | #88 | description (manifest-only change, NOT served) | KI Telefonassistent Bayreuth: Automatische Anrufannahme, Terminbuchung & Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI Telefonassistent Bayreuth: Anrufannahme, Terminaufnahme und Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |
| 2026-09-12 22:58 +02:00 | #94 | description | KI Telefonassistent Bayreuth: Anrufannahme, Terminaufnahme und Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |  |

#### `/muenchen/ki-telefonassistent`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI Telefonassistent München – AI Rezeption & Telefonservice \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | KI Telefonassistent München: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Unternehmen. Auch außerhalb der Öffnungszeiten, mehrsprachig, DSGVO-konform. Ohne Münchner Agentur-Overhead. | KI Telefonassistent für Unternehmen in München: Anrufannahme mit Ihren Regeln, bis zu fünf Sprachen, strukturierte Übergabe, keine Gesprächsaufzeichnung. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-12 22:58 +02:00 | #94 | description | KI Telefonassistent für Unternehmen in München: Anrufannahme mit Ihren Regeln, bis zu fünf Sprachen, strukturierte Übergabe, keine Gesprächsaufzeichnung. |  |

#### `/regensburg/ki-telefonassistent`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI Telefonassistent Regensburg – AI Rezeption & Anrufannahme \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | KI Telefonassistent Regensburg: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI Telefonassistent Regensburg: Anrufannahme, Terminbuchung und Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-10 23:51 +02:00 | #88 | description (manifest-only change, NOT served) | KI Telefonassistent Regensburg: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, in zwei Wochen eingerichtet und bereit zur Freigabe. | KI Telefonassistent Regensburg: Anrufannahme, Terminaufnahme und Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |
| 2026-09-12 22:58 +02:00 | #94 | description | KI Telefonassistent Regensburg: Anrufannahme, Terminaufnahme und Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, in zwei Wochen eingerichtet und bereit zur Freigabe. |  |

#### `/ki-agentur-deutschland`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | KI Agentur Deutschland \| AI-Systeme für Unternehmen – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt, einsatzbereit in ein bis zwei Wochen. | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-12 22:58 +02:00 | #94 | description | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt. |  |
| 2026-11-04 13:44 +01:00 | #105 | description | Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten und Automatisierungssysteme – entwickelt für den deutschen Markt. |  |

#### `/prozessautomatisierung`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Prozessautomatisierung für Unternehmen \| KI-Workflows – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Cogniiq automatisiert wiederkehrende Prozesse: Buchungen, Lead-Nachverfolgung, E-Mail-Workflows und mehr. Weniger manuelle Arbeit, mehr Kapazität für das Wesentliche. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-06-30 | |
| 2026-09-13 11:59 +02:00 | #95 | title | Prozessautomatisierung für Unternehmen \| Abläufe automatisieren – Cogniiq |  |
| 2026-09-13 11:59 +02:00 | #95 | description | Welche Prozesse sich automatisieren lassen, welche nicht, wie Ausnahmen und Schnittstellen behandelt werden und wie eine Umsetzung abläuft. Prozessautomatisierung für Unternehmen in Deutschland. |  |
| 2026-09-13 11:59 +02:00 | #95 | indexable / sitemap lastmod | index,follow / 2026-09-12 | |

#### `/automatisierung-unternehmen`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Automatisierung für Unternehmen \| KI-gestützte Workflows – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Automatisieren Sie wiederkehrende Aufgaben in Ihrem Unternehmen. Cogniiq entwickelt KI-gestützte Workflows für Gastronomie, Praxen, Immobilien und Handwerk. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-13 11:59 +02:00 | #95 | ROUTE | **removed from manifest/router** (see redirects) | |

#### `/kosten-automatisierung`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Automatisierung Kosten – Was kostet Prozessautomatisierung? \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Realistische Kostenübersicht für Prozessautomatisierung: von einfachen Workflows bis zu komplexen KI-Systemen. ROI und Amortisierungszeiten für verschiedene Unternehmensgrößen. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-13 11:59 +02:00 | #95 | title | Was kostet Prozessautomatisierung? Kosten, Preistreiber & Rechner \| Cogniiq |  |
| 2026-09-13 11:59 +02:00 | #95 | description | Was eine Prozessautomatisierung kostet, hängt an Ausnahmen, Schnittstellen und Absicherung. Alle Preistreiber erklärt, einmalige und laufende Kosten getrennt — plus Rechner für Ihren Prozess. |  |
| 2026-09-13 11:59 +02:00 | #95 | indexable / sitemap lastmod | index,follow / 2026-09-12 | |

#### `/webdesign`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign Agentur – Hochkonvertierende Websites für Unternehmen \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Cogniiq entwickelt individuelle Websites, die bei Google ranken und Besucher in Anfragen verwandeln. Kein Template, kein Baukasten – sauberer Code, Core Web Vitals, Local SEO. | Cogniiq entwickelt individuelle Websites, die bei Google sichtbar sind und Besucher zu Anfragen führen: sauberer Code, Core Web Vitals, Local SEO. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-06-30 | |
| 2026-09-12 22:58 +02:00 | #94 | description | Cogniiq entwickelt individuelle Websites, die bei Google sichtbar sind und Besucher zu Anfragen führen: sauberer Code, Core Web Vitals, Local SEO. |  |
| 2026-09-15 16:20 +02:00 | #97 | title | Webdesign Agentur – Websites für Unternehmen \| Cogniiq |  |
| 2026-09-15 16:20 +02:00 | #97 | description | Was eine Website bei Cogniiq umfasst, wer Inhalte liefert, wie SEO, Performance, Tracking und Barrierefreiheit ins Projekt kommen, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft. |  |
| 2026-09-15 16:20 +02:00 | #97 | indexable / sitemap lastmod | index,follow / 2026-09-13 | |
| 2026-11-04 13:44 +01:00 | #105 | description | Webdesign für Unternehmen: was eine Website umfasst, wer die Inhalte liefert, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft. |  |

#### `/webdesign-agentur-deutschland`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign Agentur Deutschland \| Individuelle Websites national – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Cogniiq ist Ihre Webdesign Agentur für ganz Deutschland. Wir entwickeln individuelle, SEO-optimierte Websites die konvertieren – remote oder persönlich in Bayern. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-11-04 13:44 +01:00 | #105 | ROUTE | **removed from manifest/router** (see redirects) | |

#### `/kosten-webdesign`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign Kosten 2025 – Was kostet eine professionelle Website? \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Was kostet Webdesign wirklich? Preise für individuelle Websites, Ladezeiten, SEO-Optimierung und Wartung. Transparente Kostenübersicht von der AI-Agentur Cogniiq. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-15 16:20 +02:00 | #97 | title | Was kostet eine Website? Webdesign Kosten & Preistreiber \| Cogniiq |  |
| 2026-09-15 16:20 +02:00 | #97 | description | Was eine professionelle Website kostet, hängt an Seitenumfang, Inhalten, Design, Schnittstellen, Barrierefreiheit und Betreuung. Alle Preistreiber erklärt, einmalig und laufend getrennt — ohne Fantasiepreise. |  |
| 2026-09-15 16:20 +02:00 | #97 | indexable / sitemap lastmod | index,follow / 2026-09-13 | |

#### `/webdesign-hotel`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign für Hotels & Pensionen \| Direktbuchungen steigern – Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Professionelle Hotel-Websites: Direktbuchungssystem, Zimmerpräsentation, SEO für mehr organische Buchungen. Weniger OTA-Provisionen, mehr Direktgäste. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-11 15:04 +02:00 | #89 | title (manifest-only change, NOT served) | Webdesign für Hotels & Pensionen \| Direktbuchungen steigern – Cogniiq | Webdesign für Hotels \| Internetagentur für Hotellerie – Cogniiq |
| 2026-09-11 15:04 +02:00 | #89 | description (manifest-only change, NOT served) | Professionelle Hotel-Websites: Direktbuchungssystem, Zimmerpräsentation, SEO für mehr organische Buchungen. Weniger OTA-Provisionen, mehr Direktgäste. | Internetagentur für Hotellerie: Hotel-Websites mit Direktbuchungsstrecke, Zimmerpräsentation und lokalem SEO – für Stadthotels, Boutiquehotels und Pensionen. |
| 2026-09-12 22:58 +02:00 | #94 | title | Webdesign für Hotels \| Internetagentur für Hotellerie – Cogniiq |  |
| 2026-09-12 22:58 +02:00 | #94 | description | Internetagentur für Hotellerie: Hotel-Websites mit Direktbuchungsstrecke, Zimmerpräsentation und lokalem SEO – für Stadthotels, Boutiquehotels und Pensionen. |  |

#### `/regensburg/website-relaunch`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Website Relaunch Regensburg – Modernisierung ohne Rankingverlust \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Website Relaunch in Regensburg: alte Website modernisieren, Performance verbessern, lokales SEO optimieren. Professionelle Umsetzung für Unternehmen in Ostbayern. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-11-04 13:44 +01:00 | #105 | title | Website Relaunch Regensburg – Modernisierung & SEO-Migration \| Cogniiq |  |

#### `/bayreuth/website-relaunch`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Website Relaunch Bayreuth – Alte Website modernisieren \| Cogniiq | Website Relaunch Bayreuth – Mehr Performance & bessere Rankings \| Cogniiq |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Website Relaunch in Bayreuth: Ihre bestehende Website modernisieren ohne Rankingverlust. Neues Design, bessere Performance, stärkeres SEO – persönliche Betreuung. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-11-04 13:44 +01:00 | #105 | title (manifest-only change, NOT served) | Website Relaunch Bayreuth – Alte Website modernisieren \| Cogniiq |  |
| 2026-11-04 13:44 +01:00 | #105 | description | Website Relaunch in Bayreuth: bestehende Website modernisieren, Weiterleitungen und Inhalte vor dem Umzug geprüft. Neues Design, schnellere Ladezeit, persönliche Betreuung. |  |

#### `/bayreuth/webdesign`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign Agentur Bayreuth – Website erstellen & SEO \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Webdesign Bayreuth: Individuelle Websites für lokale Unternehmen. Schnell, SEO-optimiert, Mobile-First. Keine Templates – professionelle Webentwicklung mit lokalem Ansprechpartner. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |

#### `/regensburg/webdesign`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign Agentur Regensburg – Website erstellen & SEO \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Webdesign Regensburg: Individuelle Websites für Unternehmen, Praxen und Gastronomie. Schnell, lokal SEO-optimiert, Mobile-First. Website Agentur mit persönlicher Betreuung. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |

#### `/muenchen/webdesign-kosten`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Webdesign Kosten München – Preise für professionelle Websites \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Was kostet Webdesign in München? Ehrliche Preisübersicht für individuelle Website-Entwicklung im Münchner Markt. Jetzt kostenlosen Kostenvoranschlag anfragen. |  |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |

#### `/verpasste-anrufe-verlust`

| Live from (merge, local time) | PR | Field | Value served in raw HTML (edge-effective) | Manifest value if different at that time |
|---|---|---|---|---|
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | title | Verpasste Anrufe kosten täglich Umsatz – So hören Sie damit auf \| Cogniiq |  |
| ≤ 2026-08-31 19:50 +02:00 (baseline, value predates window) | baseline | description | Jeder verpasste Anruf ist ein verlorener Auftrag. Der KI-Telefonassistent von Cogniiq stellt sicher, dass kein Anruf mehr unbeantwortet bleibt – auch nachts und am Wochenende. | Verpasste Anrufe sind verlorene Aufträge. Der KI-Telefonassistent von Cogniiq nimmt Anrufe an, wenn Ihr Team gebunden ist – auch abends und am Wochenende. |
| baseline | baseline | indexable / sitemap lastmod | index,follow / 2026-03-14 | |
| 2026-09-11 15:04 +02:00 | #89 | title (manifest-only change, NOT served) | Verpasste Anrufe kosten täglich Umsatz – So hören Sie damit auf \| Cogniiq | Verpasste Anrufe: Was sie Unternehmen wirklich kosten \| Cogniiq |
| 2026-09-12 22:58 +02:00 | #94 | title | Verpasste Anrufe: Was sie Unternehmen wirklich kosten \| Cogniiq |  |
| 2026-09-12 22:58 +02:00 | #94 | description | Verpasste Anrufe sind verlorene Aufträge. Der KI-Telefonassistent von Cogniiq nimmt Anrufe an, wenn Ihr Team gebunden ist – auch abends und am Wochenende. |  |

---

## 9 · Change-point analysis against the real daily GSC data (added 2026-11-20, lead analyst)

Sections 0–8 and the appendices were written before the Search Console export was available.
This section lays the daily series of `01-gsc-facts.md` (2026-10-21 → 2026-11-17) and the dated
28-day domain totals over the release timeline. Update dates are taken from
`04-serp-analysis.md` (web-search proxy; the Search Status Dashboard itself was not reachable).

### 9.1 Timeline

| Date (Berlin) | GSC movement | Repository / production | Google event | Possible relationship |
|---|---|---|---|---|
| 08-12 → 09-08 | 28 d: 12,675 impr. · 14 clicks · 0.11 % | pre-burst state | – | baseline 1 |
| 09-10 → 09-17 | no daily data in hand | 11 public releases; edge head table removed (28 heads), three pillar rebuilds, three 301s | – | not testable – needs a 3- or 6-month daily export |
| 09-17 → 11-04 | 28 d to 10-21: 6,448 impr. · 9 clicks · pos. 35.9 | **no head, URL, schema change for 48 days** (three UI-only releases 09-30/10-01) | spam update 09-24 → 10-08 | impressions halved between baseline 1 and this window; the halving overlaps both the September burst and the spam update and cannot be assigned to either from 28-day sums |
| 10-21 → 10-31 | 247–382 impr./day, pos. 36–43, 11 clicks in 11 days | none | unconfirmed volatility 10-16, 10-20/21 | – |
| 10-28 → 11-05 | weighted position worsens gradually 39.7 → 56.1 (movement A) | none until 11-04 13:44 | none reported | **starts ≥ 4 days before the release → the release cannot be its origin** |
| 11-02 → 11-05 | 15 clicks in 4 days (movement B) | release #105 on 11-04 13:44 (22 heads, 1 × 301, global JSON-LD removed, x-default removed, 3 nav links) | none | burst starts **2 days before** the release; 8 of the 15 clicks are on 11-02/11-03 |
| 11-06 → 11-16 | 1 click in 11 days (movement C); impressions 177–264/day | none | – | starts 2 days after the release and **4 days before** the core update |
| 11-10 → (ongoing) | position *improves* 52 → 46; impressions flat ≈ 215/day; clicks 1 | none | November core update from 11-10, not confirmed finished | no visible negative step on 11-10 |
| 28 d to 11-17 | 7,348 impr. · 27 clicks · pos. 44.8 | – | – | best click window of the three dated ones |

### 9.2 Tests of temporal plausibility

**T1 — Did release #105 (11-04) cause the click stop of 11-06?**

- FACT. Clicks: 3, 5 on the two days before the release, 4, 3 on the release day and the day
  after, then 0.
- EVIDENCE. `Diagramm.csv`; merge time `a6a54b5` 2026-11-04 13:44 +01:00.
- HYPOTHESIS. A head/title change needs a recrawl and re-evaluation before it can change
  ranking or snippet; a two-day lag is possible for a small site but fast.
- ALTERNATIVE. The stop is the end of the "webdesign bayern" burst (12 of 14 attributable
  clicks; landing page **presumed** `/muenchen/webdesign` because that page also shows 12 clicks –
  a hypothesis without query × page proof). Appendix B lists head changes to
  `/muenchen/webdesign` only on 09-12 and 09-17; it is **not** among the 22 URLs changed on 11-04
  (checked by search of Appendix B/C). If the pairing holds, the page that carried the clicks was not edited, and the
  only release effects that could reach it are sitewide: removed global JSON-LD, removed
  `x-default`, three new nav links.
- CONFIDENCE that #105 caused the stop: **low (≈ 15 %)**.
- FALSIFIER. Daily data for query "webdesign bayern": if its position was stable through
  11-05 and stepped down on 11-06/07, the release moves up to a serious candidate; if clicks
  and impressions for that query simply appear on 11-02 and vanish on 11-06 without a position
  step, it is a transient (or non-human) burst.
- ACTION. None on the site. Export #2 and #3 of `01-gsc-facts.md` §9.

**T2 — Did the November core update cause it?**

- FACT. Reported start 11-10. Clicks were already at zero from 11-06; weighted position had
  been deteriorating since ≈ 10-28 and *improved* from 11-10.
- CONFIDENCE that the core update caused the click stop: **very low (< 10 %)** – the effect
  precedes the cause. Confidence that the update has had *any* measurable effect so far:
  not assessable; 7 days of data at ≈ 215 impressions/day.
- FALSIFIER. Google confirming an earlier start; or post-rollout data showing a step.
- ACTION. Re-measure 7 full days after Google reports the rollout complete. Change nothing
  before.

**T3 — Did release #105 hurt `/regensburg/website-relaunch`?**

- FACT. Its title changed on 11-04 ("… ohne Rankingverlust" → "… Modernisierung & SEO-Migration");
  three docs wrongly state the head was untouched (§6.1). Query "website relaunch regensburg":
  position 5.8 (quoted 10-23, 28 d to 10-21) → 7.2 (28 d to 11-17). Page: 10.9 → 9.85.
- HYPOTHESIS. The title change cost ≈ 1.4 positions on the head query.
- ALTERNATIVE. Noise: 74 impressions. The 28-day mean mixes 14 pre-release and 14
  post-release days, so a real step would be larger than the visible 1.4. Page-level position
  moved the other way.
- CONFIDENCE: **low**. This is the one protected page that was changed against its own
  protection rule, so it deserves the page-filtered daily export (#4) regardless.
- ACTION. No rollback now (a rollback inside a core update destroys the measurement). Decide
  after export #4.

**T4 — Did the September burst (09-10 → 09-17) cause the impression halving 12,675 → 6,448?**

- FACT. Two 28-day sums five weeks apart; in between: 11 releases incl. 28 head changes at the
  edge, and the spam update 09-24 → 10-08.
- ALTERNATIVE. (a) spam update; (b) loss of deep-position impressions only (average position
  *improved* 50 → 35.9 while impressions halved – what losing impressions at positions 60–90
  looks like); (c) retirement of pages/indexing changes.
- CONFIDENCE in any single cause: **low**. Clicks were 14 → 9: nothing of commercial size was
  lost either way.
- ACTION. 6-month daily export (#1) and the indexing report (#7) – only if the owner wants the
  September question answered; it does not change the forward plan.

### 9.3 What the timeline rules out

- A **technical incident** in the window: none in the repo (no noindex, canonical, robots,
  sitemap-shrink event), none live (`03-technical-audit.md`).
- **Scaled page creation** as a trigger: net −3 routes since September.
- A **sitewide ranking loss on the KI cluster** after 11-04: the four tracked KI queries are at
  the same positions as on 11-04 (`01-gsc-facts.md` §7).

### 9.4 Measurement hygiene, for the plan

1. Deploy dates are inferred from merges (≈ 70 % confidence). Record the Cloudflare deployment
   timestamp per release from now on.
2. Release #105 bundled 22 head changes, one 301, two sitewide schema/hreflang removals and
   nav links in one deploy. No effect of that release can ever be attributed to one of them.
   Future SEO releases: one hypothesis per deploy, ≥ 28 days apart per URL.

### 9.5 Corrections after the adversarial review (`08-adversarial-review.md`)

- **"Global JSON-LD graph removed" (§4.4, §9.1) is wrong as a statement about served output.**
  Organization, WebSite and LocalBusiness JSON-LD are still served on every page the reviewer
  fetched; the 11-04 change moved where the graph is emitted. It is not a sitewide schema loss.
- **"`/muenchen/webdesign` was not edited on 11-04"** holds for head and copy only. Shared
  template markup on that page did change (`<main>` → `<div>`, CTA classes).
- **"Last production change 11-04"** is the last *repository* change. Cloudflare-side settings
  (managed robots.txt, email obfuscation, redirect rules) are undated and outside git.
- **T1 wording.** The burst accounts for at most 12 of 26 missing clicks; the remaining clicks
  also stopped (14 in 16 days → 1 in 11). The reviewer's confidences: repository changes as main
  cause 10 % (partial contributor 20 %); core update 5 % (15 % if its reported start date is
  wrong – the date is unverified); sitewide ranking loss 10 %; "anomalous fortnight" 75 %.
