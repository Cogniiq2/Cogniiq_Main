# A — Technical SEO audit (rendered `dist/` HTML)

Scope: 93 prerendered HTML files in `/home/user/Cogniiq_Main/dist` (91 public routes
+ `404.html` + `app-shell.html`), plus `scripts/prerender.mjs`,
`scripts/generate-sitemap.mjs`, `src/lib/routing/publicRoutes.ts`,
`src/lib/routing/indexability.ts`, `public/{robots.txt,_headers,sitemap.xml}`,
`.github/scripts/test-seo-consistency.mjs`, `.github/scripts/test-prerender-output.mjs`.

Analysis scripts (scratch only, never written into the repo):
`scratchpad/drift.mjs`, `scratchpad/structure.mjs`, `scratchpad/ctx.mjs`
→ `scratchpad/pages.json`, `scratchpad/structure.json`.

---

## Summary table

| ID | Title | Conf. | Sev. | Blast radius | Live exp.? |
|----|-------|-------|------|--------------|-----------|
| A1 | Metadata drift: 73 of 92 pages serve one title/description to the crawler and a different one to the renderer | KNOWN | **P0** | Site-wide (79% of pages) | **YES — 5 of 7** |
| A2 | No CI guard exists for A1; `test-prerender-output.mjs` only checks the manifest against itself | KNOWN | P1 | All routes | no |
| A3 | Mega-footer links 78 of 91 routes from every page → internal link graph is flat; `/webdesign` has exactly 1 contextual inbound link | KNOWN | P1 | Site-wide | no |
| A4 | `/faq` ships with zero `<h1>` | KNOWN | P1 | `/faq` | no |
| A5 | Three conflicting `#localbusiness` JSON-LD nodes on 41 pages (plus duplicate `#organization` / `#website` on all 92) | KNOWN | P1 | 41 cluster/industry/city pages; dup Org on all | no |
| A6 | Orphaned hubs: `/prozessautomatisierung` and `/impressum` have 0 contextual inbound; 10 blog posts have 0 chrome + ≤9 contextual | KNOWN | P2 | `/prozessautomatisierung`, `/webdesign`, `/blog/*` | no |
| A7 | `sitemap.xml` `lastmod` is stale for the 7 pages rewritten on 2026-08-29; `--check` cannot catch it | KNOWN | P2 | 7 experiment routes + 71 others on 2026-03-14 | **YES (indirectly)** |
| A8 | Homepage `keywords` meta leaks onto 17 pages (`prerender.mjs:151`) — prerender's own "no inherited metadata" invariant is violated | KNOWN | P2 | 10 blog posts, `/impressum`, `/datenschutz`, `/integrationen`, `/datenschutz-sicherheit`, `/anfrage-erhalten`, `404`, `app-shell` | no |
| A9 | 69 titles > 65 chars, 1 title < 30, 24 descriptions > 165 chars | KNOWN | P2 | 70 routes | YES (4 of 7) |
| A10 | Zero `<img>` elements on the entire public site | KNOWN | P2 | All 91 routes | no |
| A11 | City hub pages are the thinnest commercial pages on the site (309–329 words) | KNOWN | P2 | `/bayreuth`, `/muenchen`, `/regensburg` | no |
| A12 | Homepage `WebPage @id`/`url` is `https://cogniiq.de` but canonical is `https://cogniiq.de/` | KNOWN | P3 | `/` | no |
| A13 | `/anfrage-erhalten` is both `Disallow`-ed in robots.txt and `noindex` — the Disallow suppresses the noindex | KNOWN | P3 | 1 route | no |
| A14 | 7 indexable pages link to `noindex` `/datenschutz-sicherheit`, which is the only inbound path to `/integrationen` | KNOWN | P3 | 2 routes | no |
| A15 | `prerender.mjs` regex fragility + `escapeAttr`/`escapeText` asymmetry in `validate()` | LIKELY | P3 | Build correctness | no |
| A16 | **REFUTED**: `.bolt/config.json` path-join crash in `test-seo-consistency.mjs` | KNOWN | — | — | no |

---

## HEALTHY — areas checked and found correct

These are genuinely in good shape; do not spend effort here.

* **Canonicals.** All 91 public HTML files carry exactly one `<link rel="canonical">`.
  Every one is absolute, `https://`, self-referencing, and matches
  `https://cogniiq.de<path>` with no trailing slash. Zero duplicates, zero
  cross-page inheritance. `404.html` and `app-shell.html` correctly carry none
  (`prerender.mjs:357-366`, `379-389`).
* **Sitemap ⇄ routes ⇄ robots meta.** `public/sitemap.xml` has 88 `<loc>`, zero
  duplicates, zero `http://`, zero trailing slashes. The set of sitemap URLs is
  *exactly* the set of dist pages whose robots meta is not `noindex`
  (91 public − 3 noindex = 88). Nothing in the sitemap is missing from `dist/`;
  nothing indexable is missing from the sitemap.
* **`indexability.ts` ⇄ `_headers` ⇄ `robots.txt`.** No page is noindex in one
  place and indexable in another. `/app`, `/admin`, `/owner`, `/auth`, `/d`,
  `/404.html`, `/app-shell.html` all carry `X-Robots-Tag` (`public/_headers:52-91`)
  *and* a meta noindex, and are deliberately **not** `Disallow`-ed so the noindex
  is actually readable — the reasoning is written out in `public/robots.txt:6-16`
  and it is correct.
* **`public/*` ⇄ `dist/*` parity.** `_headers`, `robots.txt`, `sitemap.xml` are
  byte-identical between `public/` and `dist/`.
* **Duplicate titles/descriptions across routes: none.** Zero exact-duplicate
  `<title>` and zero exact-duplicate `<meta name="description">` across the 91
  public pages.
* **Heading order.** Zero `h1→h3` (or any) skips across all 93 documents.
  Only one page has an `<h1>` problem (A4); no page has more than one `<h1>`.
* **Broken internal links: none.** Every internal `href` in every rendered body
  resolves to a prerendered route. The only non-prerendered target is `/app/login`
  (present on 92 pages) which is the intentional private SPA surface, not a 404.
* **Zero `http://` internal links** anywhere in `dist/`.
* **hreflang.** Every one of the 91 public pages has exactly one `de-DE` and one
  `x-default` alternate, both pointing at its own canonical. `404` and `app-shell`
  correctly have none.
* **JSON-LD syntax.** All 300+ JSON-LD blocks across `dist/` parse as valid JSON;
  the `</script>`-escaping in `PageSEO.tsx:77` works. (The *content* has an
  entity-duplication problem — see A5 — but nothing is malformed.)
* **Sitemap generator design.** `scripts/generate-sitemap.mjs` is well built:
  it reads the compiled SSR bundle rather than parsing TS, refuses to emit
  non-indexable routes, has an explicit determinism guard (`:86-88`), and
  deliberately refuses to use build date as `lastmod` (`:15-17`). Its only gap
  is A7, which is a data problem in the manifest, not a generator bug.
* **Prerender atomicity.** `prerender.mjs` renders everything into memory and
  writes nothing until all routes validate (`:296-447`), fails closed on any
  missed head rewrite (`replaceOnce`, `:69-75`), and correctly passes *functions*
  to `String.replace` so a literal `$&` in German copy cannot corrupt output
  (`:64-68`). This is unusually careful code.

---

## A1 — Metadata drift: 73 of 92 pages serve two different titles/descriptions

**Confidence: KNOWN. Severity: P0. Touches live experiments: YES (5 of 7).**

### Mechanism (evidence)

1. `src/components/PageSEO.tsx:93-97` sets the head *in a `useEffect`*:
   ```
    93	  useEffect(() => {
    94	    document.title = title;
    95	
    96	    setMeta("description", description);
   ```
   `useEffect` does not run during `react-dom/server` rendering, so **none** of
   the component's title/description/OG reaches the prerendered HTML.
2. `scripts/prerender.mjs:92-99` then overwrites the template's `<title>` and
   `<meta name="description">` with `route.title` / `route.description` from
   `src/lib/routing/publicRoutes.ts`.
3. `prerender.mjs:200` *asserts* the served title equals the manifest — so the
   manifest always wins in the crawled document, by design.
4. On hydration in a real browser (and in Google's WRS, which does execute JS),
   the `useEffect` fires and **replaces** `document.title` and the description
   with the component's values.

The component's values are independently observable in the shipped HTML because
`PageSEO`'s JSON-LD *is* a real JSX element (`PageSEO.tsx:72-80`, `165-167`) and
therefore SSR-rendered. `WebPage.name` and `WebPage.description` in
`<script id="page-webpage-schema">` are the component's `title`/`description`
props verbatim (`PageSEO.tsx:143-149`). Comparing those two values in `dist/`
measures the drift exactly, with no inference.

### Quantification

92 public pages carry `page-webpage-schema` (`/app-shell` has none, correctly).

| Metric | Count | Share of 92 |
|---|---|---|
| `<title>` ≠ `WebPage.name` | **65** | 71% |
| `<meta description>` ≠ `WebPage.description` (substantive) | **71** | 77% |
| whitespace-only description difference | 1 (`/kosten-ki-telefonassistent`, NBSP before `€`) | 1% |
| both title **and** description drifted | **63** | 68% |
| **fully aligned** | **19** | 21% |
| **at least one drift** | **73** | **79%** |

Fully aligned (the only 19): `/`, `/404`, `/bayreuth/webdesign`,
`/regensburg/webdesign`, `/datenschutz-sicherheit`, `/faq`, `/impressum`,
`/ki-telefonassistent`, `/kosten-ki-telefonassistent`, `/leistungen`, `/praxen`,
`/prozessautomatisierung`, `/referenzen`, and 6 of 10 `/blog/*`.

### Live-experiment contamination (highest urgency)

5 of the 7 pages under active measurement (PRs #50–#56, deployed 2026-08-29)
serve a different title and/or description to the crawler than to the renderer.
The experiment therefore has **no defined treatment**: whether Googlebot indexes
the tested string or the manifest string depends on whether the render queue
processed the page, so the measurement cannot be attributed either way.

| Route | title drift | desc drift |
|---|---|---|
| `/bayreuth/webdesign` | — | — |
| `/kosten-ki-telefonassistent` | — | whitespace only |
| `/bayreuth/website-relaunch` | — | **YES** |
| `/regensburg/website-relaunch` | **YES** | **YES** |
| `/ki-telefonassistent-arzt` | **YES** | **YES** |
| `/muenchen/webdesign` | **YES** | **YES** |
| `/muenchen/webdesign-kosten` | **YES** | **YES** |

Concrete pairs (crawled ‖ hydrated):

* `/ki-telefonassistent-arzt`
  * crawled: `KI-Telefonassistent für Arztpraxen | Termine automatisch buchen – Cogniiq` (73 ch)
  * hydrated: `KI Telefonassistent Arztpraxis – Terminannahme | Cogniiq` (55 ch)
  * The **hydrated** value is better: 55 chars (no SERP truncation) and it carries
    the unhyphenated head term "KI Telefonassistent Arztpraxis" that German
    searchers actually type. The crawled value truncates and spends its opening
    characters on a hyphenated variant.
* `/muenchen/webdesign-kosten`
  * crawled: `Webdesign Kosten München – Preise für professionelle Websites | Cogniiq` (71 ch)
  * hydrated: `Webdesign Kosten München 2025 – Was kostet eine Website? | Cogniiq` (65 ch)
  * The **hydrated** value is better: it is inside the length budget and matches
    the actual question query ("was kostet eine website").
* `/regensburg/website-relaunch`
  * crawled: `… – Modernisierung ohne Rankingverlust | Cogniiq` (74 ch)
  * hydrated: `… – Modernisierung & SEO-Neustart | Cogniiq` (64 ch)
  * The **hydrated** value is better on length; the crawled value's
    "ohne Rankingverlust" is the stronger differentiator. Genuinely a toss-up —
    but the point is that *nobody chose*, and the two disagree.

### Full drift table

The complete route-by-route table (crawled vs hydrated title, and the same for
description) is in `scratchpad/pages.json` — fields `title`/`cName` and
`desc`/`cDesc` per `url`. The 65 title-drifted routes are:

`/anfrage-erhalten`, `/automatisierung-arzt`, `/automatisierung-immobilien`,
`/automatisierung-restaurant`, `/automatisierung-sport`,
`/automatisierung-unternehmen`, `/bayern`, `/bayern/ki-telefonassistent`,
`/bayreuth`, `/bayreuth/automatisierung`, `/bayreuth/ki-telefonassistent`,
`/bayreuth/landingpage`, `/bayreuth/lokales-seo`, `/bayreuth/webdesign-kosten`,
`/bayreuth/website-erstellen`, `/bewertungen`, `/blog`, `/deutschland`,
`/digitale-automatisierung-unternehmen`, `/integrationen`,
`/keine-anfragen-website`, `/keine-terminbuchung-online`,
`/ki-agentur-deutschland`, `/ki-telefonassistent-arzt`,
`/ki-telefonassistent-hotel`, `/ki-telefonassistent-praxis`,
`/ki-telefonassistent-restaurant`, `/ki-telefonassistent/demo`, `/kontakt`,
`/kosten-automatisierung`, `/kosten-webdesign`, `/muenchen`,
`/muenchen/automatisierung`, `/muenchen/ki-telefonassistent`,
`/muenchen/landingpage`, `/muenchen/lokales-seo`, `/muenchen/webdesign`,
`/muenchen/webdesign-kosten`, `/muenchen/website-erstellen`,
`/muenchen/website-relaunch`, `/regensburg`, `/regensburg/automatisierung`,
`/regensburg/ki-telefonassistent`, `/regensburg/landingpage`,
`/regensburg/lokales-seo`, `/regensburg/webdesign-kosten`,
`/regensburg/website-erstellen`, `/regensburg/website-relaunch`,
`/verpasste-anrufe-verlust`, `/webdesign-agentur-deutschland`, `/webdesign-arzt`,
`/webdesign-arzt-bayreuth`, `/webdesign-arzt-muenchen`,
`/webdesign-arzt-regensburg`, `/webdesign-gastronomie`,
`/webdesign-gastronomie-bayreuth`, `/webdesign-gastronomie-muenchen`,
`/webdesign-gastronomie-regensburg`, `/webdesign-hotel`, `/webdesign-immobilien`,
`/webdesign-immobilien-bayreuth`, `/webdesign-immobilien-muenchen`,
`/webdesign-immobilien-regensburg`, `/webdesign-sport`, `/zu-viel-manuelle-arbeit`.

### Which value is better, in aggregate

Neither source is systematically better — that is precisely the problem. But
there is a consistent pattern worth acting on: the **component** values are
shorter and closer to head-term phrasing (they average well inside the 65-char
budget on the pages where they differ), while the **manifest** values are longer
and more descriptive. 69 of the 91 crawled titles exceed 65 characters (A9);
adopting the shorter component titles on the drifted routes would fix most of A9
as a side effect. A per-route editorial decision is still required — the point of
the fix is that the decision must be made *once*, in *one* place.

### Proposed fix

Make one source authoritative and delete the other. The cleanest version:

1. `publicRoutes.ts` stays the single source of truth (it already drives
   prerender, sitemap and validation).
2. Every page component stops passing its own `title`/`description` literals and
   instead reads them from the manifest for its own path — i.e. `PageSEO` takes
   the route path and looks up `PUBLIC_ROUTES`, or the page components are passed
   the manifest entry. `ClusterPageConfig.seo.title/description`,
   `CityServicePage`/`IndustryPage`/`CostPage` props and the direct `<PageSEO>`
   literals become derived, not independent.
3. Before doing that, run a **one-time editorial merge** for the 73 drifted
   routes: choose the better of the two strings and write the winner into
   `publicRoutes.ts`. This is copy work, not code work, and it is where the
   actual SERP value is.
4. Add the CI guard from A2 so it cannot regress.

**Risk of the fix:** Medium. This touches every public route's metadata at once,
which is the largest single SERP-visible change the site can make. Rankings will
move; with 88 pages at avg. position 54.7 that is more likely upside than
downside, but it should not ship in the same window as the 7 live experiments.
**Sequencing recommendation:** first align *only* the 5 contaminated experiment
routes to their intended (hydrated) treatment — that repairs the experiments
rather than disturbing them — then do the remaining 68 as a separate change once
the experiments have read out.

**Touches live experiments: YES.** This is the CRITICAL-DEFECT flag the audit
brief asks for. The experiments are not merely "worded differently"; they are
serving two different documents and are therefore unmeasurable as designed.

---

## A2 — No CI guard catches A1

**Confidence: KNOWN. Severity: P1.**

`.github/scripts/test-seo-consistency.mjs` (466 lines) checks route table ⇄
sitemap ⇄ middleware ⇄ blog data, legal invariants and the consent contract.
It contains **no occurrence of the strings `title` or `description`** — verified
by grep over the whole file. It cannot see A1.

`.github/scripts/test-prerender-output.mjs` gets closer but still cannot:

```
   107	// 2e. titles are actually distinct
   108	const titles = report.routes.map((r) => r.title);
   109	const dupeTitles = [...new Set(titles.filter((t, i) => titles.indexOf(t) !== i))];
```

`report.routes[].title` is written by `prerender.mjs:460` straight from
`PUBLIC_ROUTES`. The test compares the manifest to itself, so it is structurally
incapable of detecting a divergence between the manifest and the component. Lines
`:76-79` only assert the title and description are *non-empty*.

`prerender.mjs:200` (`if (title[1] !== escapeText(route.title)) fail(...)`) is the
same tautology from the other side: it asserts prerender's own overwrite took
effect, which it always does.

**Proposed fix:** add an assertion to `test-prerender-output.mjs` that, for every
`dist/*.html`, parses `<script id="page-webpage-schema">` and requires
`WebPage.name === <title>` and `WebPage.description === <meta description>`.
This is a ~15-line check that needs no new dependency and no SSR bundle, and it
would have caught all 73 drifts. **Risk: none** (test-only), though it will fail
red until A1 is fixed — which is the point.

---

## A3 — Mega-footer flattens the internal link graph

**Confidence: KNOWN. Severity: P1. Blast radius: site-wide.**

Measured on `dist/webdesign.html` (representative; the footer is identical on all
91 pages, from `src/lib/navigation-data.ts`):

* footer: **98 `<a>` elements, 78 distinct internal targets**
* nav: 4 `<a>`, 4 distinct internal targets
* in-content: 34 distinct internal targets
* whole document: 137 `<a>`

So **78 of the 91 public routes are linked from every single page**. Measured
across all 93 documents (`scratchpad/ctx.mjs`), 78 routes have a chrome-inbound
count of exactly 91 — i.e. every other page.

Consequence: internal PageRank is distributed nearly uniformly. There is no
topical hierarchy for Google to read — `/impressum` receives the same sitewide
link treatment as `/bayreuth/webdesign`. In-content links, which are the only
signal that *does* differentiate, are diluted to ~25% of each page's link equity
(34 of 137 anchors). This is a plausible structural contributor to
"83% of non-branded impressions at position 40+": the site has 91 pages and no
declared priority among them.

### Contextual (in-content, footer+nav excluded) inbound links — full table, ascending

| contextual in | chrome in | route |
|---:|---:|---|
| 0 | 0 | `/404` |
| 0 | 0 | `/anfrage-erhalten` |
| 0 | 91 | `/impressum` |
| 0 | 91 | **`/prozessautomatisierung`** |
| 1 | 0 | `/blog/webdesign-agentur-auswahl` |
| 1 | 0 | `/integrationen` |
| 1 | 91 | `/bewertungen` |
| 1 | 91 | `/datenschutz` |
| 1 | 91 | `/faq` |
| 1 | 91 | **`/webdesign`** |
| 2 | 0 | `/blog/digitalisierung-mittelstand` |
| 2 | 91 | `/ki-telefonassistent/demo` |
| 2 | 91 | `/ueber-uns` |
| 3 | 0 | `/blog/ki-telefonassistent-restaurant` |
| 3 | 0 | `/blog/prozessautomatisierung-roi` |
| 3 | 0 | `/blog/verpasste-anrufe-kosten` |
| 3 | 91 | `/digitale-automatisierung-unternehmen` |
| 4 | 0 | `/blog/lokales-seo-unternehmen` |
| 4 | 0 | `/blog/website-ohne-anfragen` |
| 4 | 91 | `/automatisierung-sport` |
| 4 | 91 | `/referenzen` |
| 5 | 0 | `/blog/ki-telefonassistent-arztpraxis` |
| 5 | 91 | `/bayreuth/landingpage` |
| 5 | 91 | `/bayreuth/lokales-seo` |
| 5 | 91 | `/bayreuth/webdesign-kosten` |
| 5 | 91 | `/muenchen/landingpage` |
| 5 | 91 | `/muenchen/lokales-seo` |
| 5 | 91 | `/muenchen/website-relaunch` |
| 5 | 91 | `/regensburg/landingpage` |
| 5 | 91 | `/regensburg/lokales-seo` |
| 5 | 91 | `/regensburg/webdesign-kosten` |
| 5 | 91 | `/regensburg/website-erstellen` |
| 5 | 91 | `/webdesign-sport` |
| 6 | 0 | `/blog/webdesign-konversion-tipps` |
| 6 | 91 | `/bayern/ki-telefonassistent` |
| 6 | 91 | `/bayreuth/website-erstellen` |
| 6 | 91 | `/bayreuth/website-relaunch` |
| 6 | 91 | `/muenchen/webdesign-kosten` |
| 6 | 91 | `/muenchen/website-erstellen` |
| 6 | 91 | `/webdesign-arzt-muenchen` |
| 6 | 91 | `/webdesign-arzt-regensburg` |
| 6 | 91 | `/webdesign-gastronomie-bayreuth` |
| 6 | 91 | `/webdesign-gastronomie-regensburg` |
| 6 | 91 | `/webdesign-immobilien-bayreuth` |
| 6 | 91 | `/webdesign-immobilien-muenchen` |
| 7 | 0 | `/datenschutz-sicherheit` |
| 7 | 91 | `/bayreuth` |
| 7 | 91 | `/muenchen` |
| 7 | 91 | `/regensburg` |
| 7 | 91 | `/regensburg/website-relaunch` |
| 7 | 91 | `/webdesign-arzt-bayreuth` |
| 7 | 91 | `/webdesign-gastronomie-muenchen` |
| 7 | 91 | `/webdesign-immobilien-regensburg` |
| 8 | 91 | `/ki-telefonassistent-hotel` |
| 8 | 91 | `/ki-telefonassistent-praxis` |
| 8 | 91 | `/praxen` |
| 9 | 0 | `/blog/ki-automatisierung-kleine-unternehmen` |
| 9 | 91 | `/automatisierung-immobilien` |
| 9 | 91 | `/kosten-webdesign` |
| 10 | 91 | `/blog` |
| 10 | 91 | `/ki-telefonassistent-restaurant` |
| 10 | 91 | `/kosten-automatisierung` |
| 10 | 91 | `/webdesign-hotel` |
| 11 | 91 | `/webdesign-gastronomie` |
| 11 | 91 | `/webdesign-immobilien` |
| 12 | 91 | `/webdesign-arzt` |
| 13 | 91 | `/automatisierung-restaurant` |
| 14 | 91 | `/automatisierung-arzt` |
| 14 | 91 | `/` |
| 15 | 91 | `/ki-telefonassistent-arzt` |
| 15 | 91 | `/kosten-ki-telefonassistent` |
| 16 | 91 | `/deutschland` |
| 18 | 91 | `/keine-terminbuchung-online` |
| 19 | 91 | `/keine-anfragen-website` |
| 19 | 91 | `/webdesign-agentur-deutschland` |
| 20 | 91 | `/ki-agentur-deutschland` |
| 22 | 91 | `/automatisierung-unternehmen` |
| 22 | 91 | `/verpasste-anrufe-verlust` |
| 23 | 91 | `/zu-viel-manuelle-arbeit` |
| 24 | 91 | `/bayreuth/automatisierung` |
| 24 | 91 | `/bayreuth/ki-telefonassistent` |
| 24 | 91 | `/muenchen/automatisierung` |
| 24 | 91 | `/muenchen/ki-telefonassistent` |
| 24 | 91 | `/regensburg/automatisierung` |
| 24 | 91 | `/regensburg/ki-telefonassistent` |
| 27 | 91 | `/muenchen/webdesign` |
| 27 | 91 | `/regensburg/webdesign` |
| 28 | 91 | `/bayreuth/webdesign` |
| 29 | 91 | `/ki-telefonassistent` |
| 35 | 91 | `/bayern` |
| 58 | 91 | `/leistungen` |
| 87 | 91 | `/kontakt` |

**Proposed fix:** cut the footer from 78 internal targets to ~15–20 (legal, the
3 city hubs, the 3 service hubs, `/kontakt`, `/blog`), and move the removed links
into contextual, topically-relevant in-body modules on the pages that actually
relate to them. Add contextual inbound links to `/webdesign` from the ~28 pages
that already link to `/bayreuth/webdesign`.

**Risk:** Medium. Removing sitewide links will reduce crawl paths to some deep
pages; they must be re-linked contextually in the same change, and the sitemap
already guarantees discovery. **Does not touch live experiments** provided the
experiment-specific anchor text on `/bayreuth/webdesign` etc. is left alone —
those are in-content anchors, not footer anchors.

---

## A4 — `/faq` has zero `<h1>`

**Confidence: KNOWN. Severity: P1. Blast radius: `/faq`.**

`dist/faq.html` rendered body contains exactly one heading:

```
h2  HäufigeFragen.
```

No `<h1>` anywhere in `#root`. Cause: `src/pages/FAQPage.tsx:6-29` renders only
`<PageSEO>` plus `<FAQSection />`, and `FAQSection` is written to be embedded on
the homepage, so its own heading is an `<h2>`. `/faq` is the only public page in
`dist/` with this problem — the other 90 all have exactly one non-empty `<h1>`.

(Note the rendered text is `HäufigeFragen.` with no space — the two words are in
separate inline elements. Cosmetically fine for screen readers via the DOM, but
worth a look.)

`/faq` is also thin (301 words, 4th-shortest document on the site) and has only
1 contextual inbound link (from `/`).

**Proposed fix:** give `FAQPage` its own `<h1>` above `<FAQSection />` (and have
`FAQSection` render `h2` for the section subtitle as it already does).
**Risk: minimal.** Not a live experiment.

---

## A5 — Conflicting duplicate JSON-LD entities

**Confidence: KNOWN. Severity: P1.**

Every public page emits `https://cogniiq.de/#organization`,
`https://cogniiq.de/#localbusiness` and `https://cogniiq.de/#website`
**at least twice**, from two independent sources:

* the static block in `index.html:83-84` (`<!-- Global Structured Data: Organization + WebSite + LocalBusiness -->`),
* `src/components/LocalBusinessSchema.tsx:3+`, mounted globally at `src/App.tsx:134`.

On **41 pages** the same `@id` appears a **third** time from
`page-additional-schema`. Verified on `dist/bayreuth/webdesign.html`:

```
BLOCK id=<none>                  -> Organization @id=…/#organization ; LocalBusiness @id=…/#localbusiness ; WebSite @id=…/#website
BLOCK id=<none>                  -> Organization @id=…/#organization ; ["LocalBusiness","ProfessionalService"] @id=…/#localbusiness ; WebSite @id=…/#website
BLOCK id=page-webpage-schema     -> WebPage
BLOCK id=page-breadcrumb-schema  -> BreadcrumbList
BLOCK id=page-faq-schema         -> FAQPage
BLOCK id=page-additional-schema  -> LocalBusiness @id=…/#localbusiness ; Service
```

The three `#localbusiness` nodes are **not** identical — they disagree on
`@type` and on which properties exist:

| node | `@type` | properties |
|---|---|---|
| from `index.html` | `LocalBusiness` | `name,url,telephone,email,image,priceRange,address,geo,openingHoursSpecification,sameAs` |
| from `LocalBusinessSchema.tsx` | `["LocalBusiness","ProfessionalService"]` | `…,description,hasMap,currenciesAccepted,paymentAccepted,areaServed,parentOrganization` |
| from `ClusterPage.tsx:106-111` | `LocalBusiness` | `name,url,telephone,email,address,geo,areaServed` (no `priceRange`, no `openingHours`, no `sameAs`) |

Two definitions of the same `@id` with different `@type` arrays and
mutually-missing required-ish properties is exactly the ambiguity Google's
structured-data parser resolves non-deterministically. Notably,
`src/components/CityServicePage.tsx:88-92` contains a comment showing the team
already found and fixed this class of bug for `geo` on that component — but
`ClusterPage.tsx` still emits a third, sparser `#localbusiness`, so the fix was
never generalised.

41 affected pages: all 24 city×service pages under `/bayreuth`, `/muenchen`,
`/regensburg`; all 9 `webdesign-{arzt,gastronomie,immobilien}-{city}` pages;
the 3 city hubs; `/bayern`, `/webdesign`, `/prozessautomatisierung`, `/referenzen`.

**Proposed fix:** delete the static `@graph` from `index.html:83+` (it is fully
superseded by `LocalBusinessSchema`, which renders on every page via `App.tsx:134`),
and change `ClusterPage.tsx:106` to reference the business by
`{"@id": "https://cogniiq.de/#localbusiness"}` instead of redefining it — keeping
only the page-specific `Service` node. **Risk: low-medium.** Structured data is
not currently earning rich results (12 clicks/28d), so the downside is small; test
the result in the Rich Results Test before merging. Not a live experiment.

---

## A6 — Orphaned hubs and a near-orphaned blog

**Confidence: KNOWN. Severity: P2.** (Extends the known `/webdesign` issue.)

* **`/prozessautomatisierung`** — 0 contextual inbound links, 497 words. It is
  reachable only through the footer. It is also the *only* contextual inbound
  link to `/webdesign`, so the site's webdesign hub hangs off an orphan.
* **`/webdesign`** — confirmed at 1 contextual inbound (from
  `/prozessautomatisierung`). It links *out* to 34 distinct internal targets. It
  is a pure link sink with no support — which is consistent with its reported
  1,696 impressions at position 76.
* **The blog is structurally isolated.** All 10 `/blog/*` posts have
  **chrome-inbound = 0** (they are not in the footer at all). Their only inbound
  links are `/blog` plus a handful of contextual ones (0–9). `/blog` itself has
  10 contextual inbound. Meanwhile the blog posts are the pages whose
  `lastmod` is most recent (2026-07-23) and the most natural home for
  informational queries.
* `/impressum` — 0 contextual inbound. Normal and fine for a legal page.

**Proposed fix:** link `/webdesign` contextually from the ~28 pages that already
link to `/bayreuth/webdesign` (the city webdesign pages should point up to the
national hub), and from `/leistungen`. Link individual blog posts contextually
from the commercial pages they support. **Risk: low.** Not a live experiment
— but note `/bayreuth/webdesign` anchor text is under experiment (PR #54), so
add *new* anchors rather than editing the existing ones there.

---

## A7 — Stale `lastmod` on the pages that just changed

**Confidence: KNOWN. Severity: P2.**

`public/sitemap.xml` `lastmod` distribution across its 88 URLs:

| lastmod | count |
|---|---|
| 2026-03-14 | 71 |
| 2026-07-23 | 13 (10 blog posts, `/blog`, `/impressum`, `/datenschutz`) |
| 2026-06-30 | 3 |
| 2026-08-16 | 1 (`/praxen`) |

All 7 live-experiment routes still report **`2026-03-14`**:

```
/bayreuth/website-relaunch    lastmod 2026-03-14  priority 0.78
/regensburg/website-relaunch  lastmod 2026-03-14  priority 0.75
/ki-telefonassistent-arzt     lastmod 2026-03-14  priority 0.87
/bayreuth/webdesign           lastmod 2026-03-14  priority 0.9
/muenchen/webdesign           lastmod 2026-03-14  priority 0.9
/muenchen/webdesign-kosten    lastmod 2026-03-14  priority 0.78
/kosten-ki-telefonassistent   lastmod 2026-03-14  priority 0.88
```

but `git log` shows `src/lib/routing/publicRoutes.ts` and
`src/lib/standorte-service-configs.ts` were rewritten on **2026-08-29**
(`d4581fd`, `4a7b578`, `dee7545`, merged as `7d9c532`), while
`public/sitemap.xml` was last touched on **2026-08-18** (`be9a8d0`). The
experiments were shipped with a sitemap telling Google the pages had not changed
in 5½ months — which is the single worst moment to suppress recrawl priority.

`npm run sitemap -- --check` **cannot** catch this: `lastmod` is a literal string
in the manifest (`generate-sitemap.mjs:43`), so the generated and committed files
agree perfectly as long as nobody edits the literal. The determinism guarantee
documented at `generate-sitemap.mjs:15-17` ("the build date is NEVER used") is
correct and worth keeping — the gap is that nothing *reminds* an author to bump
the literal when they change a page's copy.

Secondary, cosmetic: priority values mix `0.9`/`0.90` and `1.0` formats
(9× `0.9`, 2× `0.90`) — inconsistent but harmless; Google ignores `priority`.

**Proposed fix:** add a CI check that, for any route whose `title`,
`description` or backing config file changed in the diff, asserts its
`sitemap.lastmod` also changed. Cheap to write against `git diff`, and it keeps
the "no fabricated dates" invariant. As a one-off, bump `lastmod` on the 7
experiment routes to 2026-08-29 — that is truthful, not fabricated.
**Risk: low.** Touches live experiments only in a way that helps them (faster
recrawl of the treatment).

---

## A8 — Homepage `keywords` meta leaks onto 17 pages

**Confidence: KNOWN. Severity: P2.**

```
scripts/prerender.mjs
   151	  if (route.keywords) {
   152	    out = replaceOnce(
   153	      out,
   154	      /<meta name="keywords" content="[^"]*" \/>/,
   ...
   159	  }
```

Every other head rewrite is unconditional and asserts it matched. This one is
conditional, so when a route has no `keywords` the **template's** value survives:

```
index.html:33
<meta name="keywords" content="AI Agentur Deutschland, Webdesign Agentur Bayreuth, KI Automationen, AI Rezeptionistin, KI-Telefonassistent, Prozessautomatisierung, AI Chatbot für Unternehmen, Webdesign für lokale Unternehmen, Website Performance Optimierung, Automationen" />
```

That exact string appears in 17 dist files: all 10 `/blog/*` posts,
`/integrationen`, `/datenschutz`, `/datenschutz-sicherheit`, `/impressum`,
`/anfrage-erhalten`, `404.html`, `app-shell.html`. (76 of 91 routes declare
`keywords:` in `publicRoutes.ts`; the other 15 public ones do not.)

This directly contradicts the invariant stated in the file's own comment at
`prerender.mjs:60-63`: *"A silently missed replacement would leave the homepage's
metadata on another page — exactly the soft-duplicate this gate exists to
remove."*

**SEO impact is close to zero** — Google has ignored `meta keywords` since 2009 —
so this is P2 as a correctness/hygiene defect, not a ranking defect. It is
however evidence that the "no inherited metadata" guarantee is not airtight,
which is the same class of bug as A1.

**Proposed fix:** either delete the `keywords` meta from `index.html` entirely
(recommended — no search engine uses it) or make the rewrite unconditional with
an empty-string fallback. **Risk: none.** Not a live experiment.

---

## A9 — Title and description length overruns

**Confidence: KNOWN. Severity: P2.** (Measured on the crawled values.)

* **Titles > 65 chars: 69 of 91.** Longest: `/regensburg` (86),
  `/ki-telefonassistent-praxis` (87), `/bayreuth` (84), `/` (84),
  `/bayern/ki-telefonassistent` (83), `/muenchen` (83),
  `/ki-telefonassistent-restaurant` (83), `/digitale-automatisierung-unternehmen` (82),
  `/ki-telefonassistent-hotel` (82).
* **Titles < 30 chars: 1** — `/impressum` (19). Fine for a legal page.
* **Descriptions > 165 chars: 24.** Worst:
  `/regensburg/ki-telefonassistent` (236), `/bayreuth/ki-telefonassistent` (215),
  `/bayern/ki-telefonassistent` (196), `/praxen` (189),
  `/ki-telefonassistent/demo` (188), `/ki-telefonassistent-arzt` (186),
  `/zu-viel-manuelle-arbeit` (179).
* **Descriptions < 70 chars: 0.**

4 of the 7 live-experiment routes are affected: `/ki-telefonassistent-arzt`
(title 73, desc 186), `/muenchen/webdesign` (desc 174),
`/muenchen/webdesign-kosten` (title 71), `/bayreuth/webdesign` (desc 180).

At avg. position 54.7, truncation is not currently the binding constraint — but
because the hydrated (component) titles are consistently shorter, resolving A1 in
favour of the component values would fix a large share of this for free. That is
the reason to treat A9 as an input to the A1 editorial merge rather than as
separate work.

**Risk of the fix:** it is the same change as A1 — see A1's sequencing note.
**Touches live experiments: yes**, so do not rewrite the 7 experiment routes for
length alone; only align them (A1).

---

## A10 — Zero `<img>` elements on the entire public site

**Confidence: KNOWN. Severity: P2. Blast radius: all 91 routes.**

Across all 93 files in `dist/`, the count of `<img` occurrences is **0**. The
only `<img>` in the public codebase are on private surfaces
(`src/pages/public/PublicDocumentPortal.tsx:432`, `src/pages/ScanPage.tsx:370`).
Visual content is 100% inline `<svg>` (202 `<svg>` on the homepage alone — lucide
icons).

`dist/og-image.png`, `dist/Lazar_Popovic.png` and `dist/logo.png` exist as files;
`og-image.png` and `logo.png` are referenced from meta/JSON-LD only.
**`Lazar_Popovic.png` is referenced by no HTML file at all** — an unused asset.

Consequences: nothing is eligible for Google Images or the image thumbnail in
mobile SERPs, there is no `ImageObject` beyond the logo, and — for an agency
selling *webdesign* — the pages contain no visual proof of work whatsoever.

Because there are zero images, the sub-questions in the brief are all vacuously
clean: 0 images without `alt`, 0 without `width`/`height`, 0 non-lazy below-fold
images, 0 referenced-but-missing files.

**Proposed fix:** out of scope for a technical fix — this needs real assets
(see the repo's own `ASSETS-REQUIRED.md`). Do not fabricate screenshots or
portfolio images. **Risk of the fix: n/a.** Not a live experiment.

---

## A11 — City hub pages are the thinnest commercial pages on the site

**Confidence: KNOWN. Severity: P2.**

Rendered word counts (text inside `#root`, tags/scripts stripped), ascending:

```
   1  app-shell.html          (correct — empty SPA shell)
 229  anfrage-erhalten.html
 233  404.html
 301  faq.html
 309  muenchen.html
 311  bayreuth.html
 329  regensburg.html
 350  bewertungen.html
 389  ki-telefonassistent/demo.html
 404  impressum.html
 438  referenzen.html
 493  keine-terminbuchung-online.html
 497  prozessautomatisierung.html
 507  zu-viel-manuelle-arbeit.html
 514  digitale-automatisierung-unternehmen.html
```

`/bayreuth`, `/muenchen` and `/regensburg` are the canonical local-intent landing
pages — the exact queries a Bayreuth agency needs — and they are the three
thinnest commercial documents on the site, each with only 7 contextual inbound
links. Their titles are also the longest on the site (84/83/86 chars, A9).

**Proposed fix:** expand each city hub with genuine local substance (which
services are delivered there, real local context) rather than link lists.
Coordinate with the copy brief — do not invent local clients or references.
**Risk: low.** Not a live experiment.

---

## A12 — Homepage canonical/JSON-LD URL mismatch

**Confidence: KNOWN. Severity: P3.**

`dist/index.html`:
* `<link rel="canonical" href="https://cogniiq.de/">`
* JSON-LD `WebPage`: `"@id": "https://cogniiq.de#webpage"`, `"url": "https://cogniiq.de"`

The component passes `BUSINESS_INFO.website` (no trailing slash) as `canonical`,
while `canonicalFor('/')` produces the slashed form. On hydration, `PageSEO.tsx:105`
(`setLink("canonical", canonical)`) **rewrites the homepage canonical from
`https://cogniiq.de/` to `https://cogniiq.de`** — a third instance of the A1
pattern, this time on the canonical rather than the title. Both forms resolve to
the same page and Google normalises them, so real-world impact is negligible,
but it is a self-inconsistency and it means the homepage canonical is also
crawl-vs-render dependent. This is the only canonical drift on the site.

**Proposed fix:** make `BUSINESS_INFO.website` and `canonicalFor('/')` agree.
**Risk: minimal.** Not a live experiment.

---

## A13 — `/anfrage-erhalten` is both `Disallow`-ed and `noindex`

**Confidence: KNOWN. Severity: P3.**

`public/robots.txt:7` — `Disallow: /anfrage-erhalten`
`dist/anfrage-erhalten.html` — `<meta name="robots" content="noindex, nofollow" />`

A crawler that obeys the `Disallow` never fetches the page and therefore never
reads the `noindex`, which is the classic way a URL ends up as a URL-only listing.
The repo already documents this exact reasoning correctly for `/admin`
(`public/robots.txt:6-16`) — the same logic was just not applied here.

Impact is minimal: the page has **0 inbound links of any kind** (verified across
all 93 documents), so there is nothing to discover it from.

**Proposed fix:** drop the `Disallow` line and rely on the `noindex`, consistent
with the `/admin` policy. **Risk: minimal.** Not a live experiment.

---

## A14 — Link paths into `noindex` pages

**Confidence: KNOWN. Severity: P3.**

7 indexable pages carry contextual links to `/datenschutz-sicherheit`, which is
`noindex`. `/datenschutz-sicherheit` is in turn the **only** contextual inbound
link to `/integrationen`, which is also `noindex`. So `/integrationen` is
reachable from the indexable site only through a noindex intermediary.

Both are deliberate — `src/lib/routing/publicRoutes.ts:128-142` documents them as
skeletons held out of the index until `OWNER-INPUT.md` items are verified:

> *"Grundgerüste ohne Fachinhalt: bewusst NICHT indexierbar, bis die Angaben aus
> OWNER-INPUT.md (Gruppe B bzw. C) geprüft vorliegen."*

That is the right call and I am **not** proposing to index them. The finding is
narrower: 7 in-content links from indexable commercial pages currently spend
their link equity on a page Google is told to drop, and the DSGVO/Sicherheit
question is a real B2B objection for the practice audience that currently has no
indexable answer anywhere on the site.

**Proposed fix:** unblock the `OWNER-INPUT.md` items so these two pages can carry
verified content and be indexed. No copy change until then. **Risk: n/a.**
Not a live experiment.

---

## A15 — `prerender.mjs` / `generate-sitemap.mjs` correctness review

**Confidence: LIKELY (no failure observed). Severity: P3.**

Both scripts were read in full. They are careful, and most of the obvious hazards
are already handled and commented. What remains:

1. **A8 is the one genuine correctness bug** (conditional `keywords` rewrite,
   `prerender.mjs:151`). Filed separately.
2. **Regex fragility, mitigated.** All 12 head rewrites hard-code the exact
   serialisation `<meta … content="…" />` with a space before the self-closing
   slash (`:95, :102, :109, :116, :121, :126-145, :154`). If `index.html` is ever
   reformatted, minified, or a meta tag is written without the space-slash, the
   rewrite finds no match. This **fails closed** — `replaceOnce` (`:69-75`) throws
   and the whole build aborts with `dist/` untouched (`:485-517`) — so it is a
   build-fragility risk, not a silent-corruption risk. The single exception is
   `keywords`, which is exactly why A8 is silent.
3. **`escapeAttr` / `escapeText` asymmetry in `validate()`.**
   `prerender.mjs:207` compares `canonicalTag[1] !== escapeAttr(canonical)`, but
   the value read out of the HTML has *not* been unescaped. For canonicals (URLs
   containing none of `& < > " '`) the two agree, so this is currently a no-op.
   It would produce a confusing false failure the day a URL contains an
   ampersand. Same shape at `:200` for the title, which does hit `escapeText` —
   that one is correct because `escapeText`'s output is what is in the document.
4. **`replaceAll` does not assert** (`:77-79`). The two hreflang rewrites at
   `:114-123` use it, so a missing hreflang tag in the template would silently
   leave the homepage's hreflang on every page. Today the template has them, so
   no page is affected (verified: all 91 public pages have correct self-pointing
   hreflang). Worth an assertion for the same reason A8 exists.
5. **`validate()` cannot detect A1** — see A2. `:200` compares the document to
   the manifest that produced it.
6. **`generate-sitemap.mjs`: no bug found.** The determinism guard (`:86-88`),
   the refusal to use build dates (`:15-17`), and the `--check` mode are all
   sound. Its blind spot is A7 (stale literal `lastmod`), which is a data
   problem, not a script defect.
7. **Ordering:** no ordering hazard found. Each rewrite targets a distinct,
   mutually exclusive pattern, and the `() => replacement` function form
   correctly neutralises `$&` / `` $` `` / `$'` in German copy (`:64-68`, `:74`) —
   a real bug class the authors already anticipated.

**Proposed fix:** make `keywords` unconditional (A8); make `replaceAll` assert at
least one match; unescape before comparing in `validate()`. **Risk: low**
(build-time only, fails closed). Not a live experiment.

---

## A16 — REFUTED: the `.bolt/config.json` path-join crash

**Confidence: KNOWN (tested). Not a defect.**

`node .github/scripts/test-seo-consistency.mjs` was executed at
`7d9c532`. It ran to completion, printed
`✓ SEO/consent consistency checks passed.` and **exited 0**. No crash, no
stack trace, no `.bolt` error.

The reported area does exist and does traverse `.bolt/`: the whole-repo walk at
`.github/scripts/test-seo-consistency.mjs:422-434` recurses from `ROOT` and skips
only `node_modules`, `dist`, `dist-ssr`, `.git` (`:421`). `.bolt/config.json`
(32 bytes) matches the `\.json$` filter at `:429` and is read at `:445+`. It
parses and matches nothing. `.bolt/` was present on disk during the run
(`config.json`, `ignore`, `prompt`).

The one latent hazard in that walk: `statSync` at `:427` will throw
`ENOENT` on a broken symlink anywhere in the repo, which would abort the script
*after* its assertions have printed — which matches the shape of the original
report. That is a plausible explanation for a historical sighting, but it does
not reproduce here.

**No fix proposed.** If defensive hardening is wanted, wrap `:427` in a
`try`/`catch` and skip unreadable entries. **Risk: none.**

---

## Notes on method

* All counts come from the shipped `dist/` HTML, not from React source.
* "Crawled value" = the string in `<title>` / `<meta name="description">` of the
  static document. "Hydrated value" = the string in the SSR-rendered
  `page-webpage-schema` JSON-LD, which is a verbatim copy of the component's
  `PageSEO` props and therefore an exact proxy for what `useEffect` writes into
  the DOM after hydration.
* Chrome (nav + footer) links were separated from in-content links by removing
  `<footer>…</footer>` and `<nav>…</nav>` from each rendered `#root` before
  counting anchors.
* No repository file was created, edited or deleted. No build was run. No live
  URL was fetched.
