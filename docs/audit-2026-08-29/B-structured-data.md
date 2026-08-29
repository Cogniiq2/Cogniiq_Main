# B — Structured Data / Entity Audit (Cogniiq)

Scope: all 93 prerendered HTML files in `/home/user/Cogniiq_Main/dist/` plus the
schema-generating source. Extraction script: `scratchpad/extract.mjs`; raw dump:
`scratchpad/jsonld.json`; per-route matrix: `scratchpad/matrix.tsv`.
Read-only audit — no repository file was modified.

## Summary table

| ID | Title | Conf. | Sev | Blast radius |
|----|-------|-------|-----|--------------|
| B-01 | Every page defines `#organization`, `#localbusiness`, `#website` **twice** (3–4×) with contradicting property sets | KNOWN | **P1** | 92 of 93 pages |
| B-02 | `#localbusiness` carries two different `@type` values on the same page (`LocalBusiness` vs `["LocalBusiness","ProfessionalService"]`) | KNOWN | **P1** | 92 pages |
| B-03 | 51 anonymous `Organization` blank nodes named "Cogniiq" with no `@id` — the entity is fragmented, not unified | KNOWN | **P1** | 40 pages |
| B-04 | JSON-LD `WebPage.name`/`description` contradicts the page's own `<title>`/meta description in the same crawled document | KNOWN | **P1** | **74 of 92** pages |
| B-05 | `Offer.price` is a display string (`"ab 1.500 €"`, `"2.500 – 5.000 €"`) — invalid, silently dropped by Google | KNOWN | **P1** | 2 money pages (6 offers) |
| B-06 | FAQ **answers** are absent from the rendered HTML (accordion unmounts closed items) while `FAQPage` asserts them | KNOWN | **P2** | 71 pages, ~600 Q&A pairs |
| B-07 | `sameAs` is effectively absent — the only value is a self-reference to `https://cogniiq.de` | KNOWN | **P2** | sitewide |
| B-08 | Blog `Article.datePublished` (Jan–Mar 2025) predates `Organization.foundingDate` (2025-10-15) by 7–9 months | KNOWN | **P2** | 10 blog posts |
| B-09 | `/ueber-uns`: `AboutPage` and `WebPage` share the identical `@id` with different name/description | KNOWN | **P2** | 1 page |
| B-10 | `/referenzen`: second page entity at `…/referenzen/#webpage` (trailing slash) duplicating `…/referenzen#webpage` | KNOWN | **P3** | 1 page |
| B-11 | Page-level `LocalBusiness` on 13 pages drops `streetAddress` while the same `@id` elsewhere on the page has it | KNOWN | **P2** | 13 pages |
| B-12 | `geo` coordinates are ~357 m from the Google Business Profile pin that `hasMap` links to | LIKELY | **P2** | sitewide + contact map embed |
| B-13 | `BreadcrumbList` emitted on 20 pages that render no visible breadcrumb | KNOWN | **P3** | 20 pages (incl. all 10 blog posts) |
| B-14 | Homepage emits a single-item `BreadcrumbList` and a malformed `@id` (`https://cogniiq.de#webpage`, no slash) | KNOWN | **P3** | 1 page |
| B-15 | 5 pillar pages emit `Article` with no `datePublished`/`dateModified`/`image` | KNOWN | **P3** | 5 pages |
| B-16 | `LocalBusinessSchema.tsx` serialises JSON-LD **without escaping `<`** (latent `</script>` injection) | KNOWN | **P3** | sitewide, latent |
| B-17 | `HowTo` schema on `/ki-telefonassistent` — Google removed HowTo rich results entirely | KNOWN | **P3** | 1 page |
| B-18 | Breadcrumb root label is `"Home"` on 81 pages, `"Start"` on 10 blog posts | KNOWN | **P3** | 10 pages |
| B-19 | `vatID` (DE460292419, visible on Impressum) absent from `Organization` — a free, verifiable entity signal | KNOWN | **P3** | sitewide |

---

## WHAT IS HEALTHY (confirming / challenging the prior "entity clarity is a strength" verdict)

**Verdict: partially confirmed. The *data* is honest and NAP-consistent. The *graph
topology* is not — it is not one entity, it is 2–4 competing definitions of the same
`@id` plus 51 orphan blank nodes on every page. The prior finding is correct about
truthfulness and wrong about coherence.**

Genuinely healthy, evidenced:

1. **No fabricated trust signals anywhere.** `grep` over the full JSON-LD dump for
   `aggregateRating|"Review"|reviewCount|ratingValue|award|hasCredential|numberOfEmployees`
   returns **0** matches across all 93 files. `/bewertungen` exists and correctly emits
   *no* review schema. This is the single strongest thing in the structured data and
   must not be "fixed" by adding ratings.
2. **NAP is byte-identical** between JSON-LD, Impressum, Kontakt and the footer:
   `Cogniiq` / `Am Main 3` / `95444` / `Bayreuth` / `info@cogniiq.de`.
   `dist/impressum.html` visible text: "Cogniiq … Am Main 3 … 95444 Bayreuth …
   Telefon: 0160 1832917 … E-Mail: info@cogniiq.de"; schema `telephone: "+49 160
   1832917"` is the same number in international form, which is correct.
   `src/lib/seo-data.ts:9-26` is a genuine single source of truth. **No NAP variant
   was found anywhere** — no P1 local-SEO NAP finding to report.
3. **All 93 JSON-LD payloads parse.** Zero `JSON.parse` failures across 435 blocks.
4. **BreadcrumbList is structurally correct.** 91/93 pages carry one; `position` is
   1..n on every list; the last item's `item` equals the page's own canonical URL on
   **100%** of pages. No missing-hierarchy families were found — breadcrumbs are done.
5. **`PageSEO`'s JSON-LD is properly escaped** — `src/components/PageSEO.tsx:77`
   `JSON.stringify(data).replace(/</g, "\\u003c")`, and it is rendered as JSX so it is
   present in the prerendered HTML rather than injected in `useEffect`. There is no
   generated-but-never-injected schema and no double injection from PageSEO.
6. **Prior over-reach was already removed and the comment documents why** —
   `src/components/LocalBusinessSchema.tsx:135-144` explains that sitewide `Service`
   nodes and a fake sitewide breadcrumb were deleted because they asserted services on
   `/impressum`, `/datenschutz`, `/blog` and the 404. That reasoning is right; the same
   reasoning has simply not yet been applied to the duplicated core entities.
7. **Geo is not city-swapped.** `src/components/CityServicePage.tsx:86-92` explicitly
   refuses to rewrite `geo` to the target city and expresses the city via `areaServed`.
   That is the correct modelling and a real strength.
8. **`/kosten-ki-telefonassistent` models pricing correctly** — numeric
   `priceSpecification.price: 300`, `priceCurrency: "EUR"`, `unitCode: "MON"`. The
   correct pattern already exists in this repo (see B-05).
9. **Image assets match their declared dimensions**: `dist/logo.png` is 512×512 (claimed
   512×512), `dist/og-image.png` is 1200×630.
10. **Noindexed pages are correctly noindexed** — `dist/404.html` and
    `dist/anfrage-erhalten.html` carry `noindex, nofollow`; `dist/app-shell.html` adds
    `noarchive`. Schema on those pages therefore cannot pollute the index.

---

## Findings

### B-01 — `#organization`, `#localbusiness`, `#website` are each defined 2–4 times per page, with conflicting properties — **P1, KNOWN**

**Evidence.** Two independent emitters put a full `@graph` into every page:
`index.html:84-241` (static template) and `src/components/LocalBusinessSchema.tsx:6-146`
(rendered sitewide via `src/App.tsx:131-134`). Duplicate-`@id` count across `dist/`:

```
92  https://cogniiq.de/#organization
92  https://cogniiq.de/#localbusiness
92  https://cogniiq.de/#website
```

They disagree. Diff of the two `#organization` nodes on `dist/index.html`:

| property | `index.html:84` block | `LocalBusinessSchema` block |
|---|---|---|
| `logo` | `ImageObject` without `@id`/`contentUrl`/`caption` | `@id: …/#logo`, `contentUrl`, `caption` |
| `image` | *absent* | `https://cogniiq.de/og-image.png` |
| `hasMap` | *absent* | Google Maps place URL |
| `areaServed` | 11 entries, **no Fürth** | 12 entries, **includes Fürth** |
| `founder[].@id` | `#lazar-popovic`, `#djordje-popovic` | **no `@id`** — creates 2 more orphan Persons |
| `contactPoint.availableLanguage` | `["German"]` | `["German","English"]` |
| `contactPoint.hoursAvailable` | *absent* | Mon–Fri 09:00–18:00 |
| `knowsAbout` / `hasOfferCatalog` | present | absent |

The `#localbusiness` nodes disagree on `openingHoursSpecification` shape (one array with
a `dayOfWeek` array vs five objects with `https://schema.org/<Day>` URIs), on
`description`, `currenciesAccepted`, `paymentAccepted`, `areaServed`, `parentOrganization`
and `sameAs`.

**Why it matters.** A consumer merging by `@id` gets a node with two `logo` values, two
`availableLanguage` sets and two `founder` lists — one of which has stable IDs and one of
which does not. This is the opposite of the "one coherent entity" the site is trying to
publish, and it is the direct cause of B-02 and B-03.

**Blast radius.** 92 of 93 files (all but `404.html`, which has 3 blocks but the same
duplication).

**Fix.** Delete the `<script type="application/ld+json">` block from `index.html:84-241`
entirely and let `LocalBusinessSchema` be the sole emitter; then fold `knowsAbout`,
`hasOfferCatalog` and the founder `@id`s into `LocalBusinessSchema.tsx` so nothing is
lost. One emitter, one definition per `@id`.

**Risk.** Low — pure deletion plus a merge into an existing component; the prerenderer
never touches JSON-LD, so nothing else depends on the template block.
`.github/scripts/test-seo-consistency.mjs` should be checked for assertions on the
template block before removal.

**Live-experiment overlap.** None — the experiments (PRs #50–#56) touch title/H1/
canonical/meta/anchors, not JSON-LD.

---

### B-02 — Same `@id`, two different `@type` values — **P1, KNOWN**

**Evidence.** On all 92 pages:
`https://cogniiq.de/#localbusiness :: ["LocalBusiness"]` (from `index.html:197-229`)
vs `["LocalBusiness","ProfessionalService"]` (from `LocalBusinessSchema.tsx:76`).
Also, on one page, `https://cogniiq.de/ueber-uns#webpage :: ["AboutPage"] VS ["WebPage"]`
(see B-09).

A single node asserting two type sets is the clearest possible signal to a consumer that
the publisher does not have one authoritative description of itself.

**Fix.** Resolved automatically by B-01. Keep
`["LocalBusiness","ProfessionalService"]` — it is the more specific and accurate typing.
**Risk.** Low. **Overlap.** None.

---

### B-03 — 51 anonymous `Organization` blank nodes named "Cogniiq" — **P1, KNOWN**

**Evidence.** 40 pages emit a `Service` (or `Article`) whose `provider`/`author`/
`publisher`/`seller` is an inline `Organization` **without `@id`**, e.g.

`dist/praxen.html` block 5:
```json
{"@type":"Service","name":"KI Telefonassistent für Praxen",
 "provider":{"@type":"Organization","name":"Cogniiq","url":"https://cogniiq.de"}}
```
`dist/kosten-webdesign.html` block 5: three `Offer.seller` values of
`{"@type":"Organization","name":"Cogniiq"}` — not even a `url`.
All 10 blog posts do it twice (`author` + `publisher`).

Counts over the whole `dist/`: `Service.provider` shape —
`@id`-reference only: **34**, inline **without** `@id`: **17**, inline **with** `@id`: 4.
Total anonymous `Organization` nodes: **51** across 40 pages.

**Why it matters.** Each of these is a fresh blank node. A crawler sees "some
organization called Cogniiq provides this service" instead of "the Cogniiq entity at
`https://cogniiq.de/#organization` provides this service". Every one of them is a lost
opportunity to reinforce the single entity — on exactly the money pages
(`/praxen`, `/ki-telefonassistent`, `/kosten-*`, all industry pages).

**Contrast with what already works:** `src/components/ClusterPage.tsx:135` and
`CityServicePage.tsx:126` correctly use `provider: {"@id": ".../#localbusiness"}`.
The pattern exists; it is just not applied consistently.

**Fix.** Replace every inline `{"@type":"Organization","name":"Cogniiq",...}` with
`{"@id":"https://cogniiq.de/#organization"}`. Affected sources include
`src/components/IndustryPage.tsx`, `src/components/NationalIndustryPage.tsx`,
`src/components/CostPage.tsx` (`seller`), the blog article schema helper, and
`src/pages/PraxenPage.tsx`, `WebdesignHub.tsx`, `ProzessautomatisierungHub.tsx`,
`KiTelefonassistentPage.tsx`.
**Risk.** Low, mechanical. **Overlap.** `/kosten-ki-telefonassistent` and
`/ki-telefonassistent-arzt` are live-experiment pages, but the change is in JSON-LD only
— it does not touch title/H1/canonical/meta/anchor text, so it does not contaminate the
experiments.

---

### B-04 — JSON-LD contradicts the page's own `<title>` and meta description — **P1, KNOWN**

**Evidence.** `scripts/prerender.mjs:92-97` rewrites `<title>` and
`<meta name="description">` from the `publicRoutes` manifest **after** React has already
serialised `PageSEO`'s `WebPage` JSON-LD from the component's own title/description.
The prerenderer never touches JSON-LD (no `ld+json` handling anywhere in
`scripts/prerender.mjs`). Result, measured over `dist/`:

- **65 of 92** pages: `WebPage.name` ≠ `<title>`
- **72 of 92** pages: `WebPage.description` ≠ `<meta name="description">`
- **74 of 92** pages affected by at least one (**80%**)

Concrete, from `dist/bayern.html`:
```
<title>      AI-Systeme & Webdesign für Unternehmen in Bayern | Cogniiq
WebPage.name KI Agentur Bayern – KI Telefonassistent, Automatisierung & Webdesign | Cogniiq
```
`dist/bewertungen.html`:
```
<title>      Bewertungen & Kundenstimmen | Cogniiq AI-Agentur Bayern
WebPage.name Bewertungen – Kundenmeinungen zu Cogniiq | Webdesign Bayreuth
```

**Which version is correct.** Three-way: the crawled `<title>` = `publicRoutes`; the
JSON-LD = the component config; and after hydration `PageSEO.tsx:94`
(`document.title = title`) flips the live DOM title **back** to the component value.
So the JSON-LD agrees with the *hydrated* DOM and disagrees with the *served* HTML.
Google renders JS, so it can observe both. **What matters for the crawl is the served
HTML** — and there the structured data contradicts the head on 80% of the site.
The `publicRoutes` value is the intended one (`prerender.mjs:200` even asserts
`title[1] === escapeText(route.title)`); the JSON-LD is the stale side.

**Blast radius.** 74 indexable pages. This is the structured-data half of the already-known
metadata drift, and it quantifies it: **the drift is systemic, not isolated.**

**Fix.** Make `PageSEO` read title/description from the same `publicRoutes` manifest the
prerenderer uses (or have `prerender.mjs` rewrite `WebPage.name`/`description` in the
`page-webpage-schema` block alongside the `<title>`). The first is the durable fix.
**Risk.** Medium — touches the manifest↔component boundary on every page; needs the
existing `test-seo-consistency.mjs` extended to assert JSON-LD name == title.
**Live-experiment overlap.** **Yes, direct.** The experiment pages' titles live in
`publicRoutes`. Do **not** change any title text; only make the JSON-LD follow the
already-shipped title. `dist/bayreuth/website-relaunch.html` currently has a matching
title but a drifting description — that is the shape of the exposure.

---

### B-05 — `Offer.price` is an unparseable display string — **P1, KNOWN**

**Evidence.** `src/components/CostPage.tsx:94-99` — `price: p.range` where `p.range` is
the human display string. Rendered output:

`dist/kosten-webdesign.html`: `"price":"ab 1.500 €"`, `"2.500 – 5.000 €"`, `"ab 5.000 €"`
`dist/kosten-automatisierung.html`: `"500 – 1.500 €"`, `"1.500 – 5.000 €"`, `"ab 5.000 €"`

schema.org requires `price` to be a number; Google's documentation explicitly forbids
currency symbols and ranges in `price`. All six `Offer` nodes are therefore invalid and
discarded — on the two pages whose entire purpose is pricing.

The underlying claims **are** supported by visible copy: "1.500", "2.500", "5.000",
"Einfach", "Mittelstand", "Premium" all appear in the rendered body text of
`dist/kosten-webdesign.html`. So this is a formatting bug, not an honesty problem.

**Fix.** Use the pattern this repo already ships on `/kosten-ki-telefonassistent`:
```json
"priceSpecification":{"@type":"PriceSpecification","minPrice":1500,"priceCurrency":"EUR"}
```
(`minPrice`+`maxPrice` for ranges, `minPrice` alone for "ab X"). Requires adding numeric
`min`/`max` fields alongside the display `range` in the cost-page configs.
**Risk.** Low, but the numbers must be transcribed from the visible copy exactly — do not
invent or round. **Overlap.** None (`/kosten-webdesign`, `/kosten-automatisierung` are not
experiment pages; `/kosten-ki-telefonassistent` is, and is already correct — leave it).

---

### B-06 — FAQ answers are not in the rendered HTML — **P2, KNOWN**

**Evidence.** Automated check over all 71 pages carrying `FAQPage`
(`scratchpad/faqcheck.mjs`): **questions found in the rendered body on 71/71 pages;
answers found on 0.** Roughly 600 `acceptedAnswer.text` strings are asserted by schema
and absent from the document.

Root cause: `src/components/FAQSection.tsx:79` `const [openIndex, setOpenIndex] =
useState<number | null>(null)` and line 201 `{isOpen && (` — the answer is *conditionally
rendered*, so closed items are not in the DOM at all (not merely `display:none`).
Verified directly on `dist/faq.html`: the string
`"Das hängt von Ziel und Umfang ab"` occurs **only inside the JSON-LD**; the surrounding
markup shows the question inside a `<button>` with a plus icon and no answer node.

Google's structured-data policy requires FAQ content to be visible to the user on the
page. Google explicitly *permits* accordions where the content is in the DOM but hidden —
this implementation does not qualify, because nothing is there until a click.

**Mitigating context (why P2 not P1):** Google restricted FAQ rich results to
authoritative government and health sites in August 2023, so these 71 FAQPage blocks are
already producing no rich results. The exposure is policy/manual-action risk and wasted
payload, not lost SERP real estate.

**Fix.** Render answers into the DOM always and collapse them with CSS
(`max-height`/`hidden` attribute) instead of unmounting. This also improves the
crawlable text on 71 pages, which matters more than the schema does given the ranking
problem. Alternative, cheaper: drop `FAQPage` schema from pages where the answers are not
rendered.
**Risk.** Low-medium — a visual/animation change to a component used on 71 pages; needs a
visual check of the accordion transition.
**Overlap.** Touches experiment pages' bodies. The change adds no visible text in the
default state (answers stay collapsed) and changes no title/H1/copy, so it should not
disturb the experiments — but coordinate the timing.

---

### B-07 — `sameAs` is a self-reference; no external identity anchors — **P2, KNOWN**

**Evidence.** `"sameAs"` occurs exactly **93 times** in the whole dump — once per file —
and every occurrence is `index.html:226-228`:
```json
"sameAs": ["https://cogniiq.de"]
```
`src/lib/seo-data.ts:79-83` has `socialMedia: { linkedin: "", instagram: "", facebook: "" }`,
so `LocalBusinessSchema.tsx:4,72` filters them out and emits **no** `sameAs` at all.

`sameAs` is defined as a URL of a reference page that *unambiguously indicates the item's
identity*. Pointing an entity at its own homepage carries zero disambiguating
information; it is noise.

**Why it matters here specifically.** The audit baseline says external authority is the
ceiling for the two top query families. `sameAs` is the cheapest available entity-
reconciliation signal, and the business demonstrably *has* at least one external profile:
`src/lib/seo-data.ts:236-238` links a real Google Business Profile place
("Cogni IQ", CID `0x47a1a30b011831f5:0x9a1f8b5c17a30837`).

**Fix.** Remove the self-referencing `sameAs`. Add real profile URLs **only** once the
owner supplies them — this is Phase-0 `OWNER-INPUT.md` territory. **Do not invent, guess,
or construct any social URL.** Candidates to *ask the owner for*: LinkedIn company page,
Instagram, the Google Business Profile share URL, a Handelsregister/Northdata entry.
**Risk.** None for the removal. **Overlap.** None.

---

### B-08 — Blog articles are dated before the company existed — **P2, KNOWN**

**Evidence.** Every blog post's `Article` node vs the sitewide `Organization`:

```
Organization.foundingDate                              2025-10-15   (seo-data.ts:7)
blog/ki-automatisierung-kleine-unternehmen  published  2025-01-20
blog/ki-telefonassistent-arztpraxis         published  2025-01-28
blog/webdesign-konversion-tipps             published  2025-02-03
blog/lokales-seo-unternehmen                published  2025-02-10
blog/prozessautomatisierung-roi             published  2025-02-17
blog/verpasste-anrufe-kosten                published  2025-02-24
blog/website-ohne-anfragen                  published  2025-03-06
blog/digitalisierung-mittelstand            published  2025-03-10
blog/webdesign-agentur-auswahl              published  2025-03-13
blog/ki-telefonassistent-restaurant         published  2025-03-03
```

All 10 are dated 7–9 months **before** the founding date the same graph asserts, and all
`dateModified` values are stale (latest 2025-03-16; today is 2026-08-29). The
`foundingDate` comment at `seo-data.ts:5-7` says it was "confirmed by the operator" and
replaced an unsupported "2023" — so the founding date is the trusted value and the
article dates are the unverified ones.

**Why it matters.** These are self-contradicting first-party claims in a single graph, on
a young domain whose entire problem is trust and authority. Also: `dateModified` nearly
18 months stale on every post signals abandonment.

**Fix.** This is an **owner question, not a code fix** — `OWNER-INPUT.md`. Either the
posts were genuinely written before the business was formally founded (plausible, and
then `foundingDate` may need a note), or the dates are placeholders. If they are
placeholders, replace them with the real publication dates; **do not** backdate or
forward-date to make the graph look better, and do not bump `dateModified` without an
actual content update.
**Risk.** Low technically; high honesty cost if done carelessly. **Overlap.** None.

---

### B-09 — `/ueber-uns` defines the same `@id` as both `WebPage` and `AboutPage` — **P2, KNOWN**

**Evidence.** `dist/ueber-uns.html` block 2 (from `PageSEO.tsx:146`) and block 4 (from
`src/pages/UeberUnsPage.tsx:386`) both claim `@id: "https://cogniiq.de/ueber-uns#webpage"`:

```
block2  "@type":"WebPage"   "name":"Über Uns | KI-Agentur Bayreuth – Lazar & Djordje Popovic – Cogniiq"
block4  "@type":"AboutPage" "name":"Über Cogniiq – AI Agentur Bayreuth"
```
Different `@type`, different `name`, different `description`, one identical `@id`.

Positive note: block 4 is the **only** place on the site where the two founder `Person`
nodes are given stable `@id`s *and* `worksFor` back to `#organization`
(`https://cogniiq.de/#lazar-popovic`, `#djordje-popovic`) — that part is well modelled and
should be preserved.

**Fix.** Give the `AboutPage` node its own `@id` and have it reference the `WebPage`
(`"mainEntityOfPage"` / `isPartOf`), or promote the page's type to `AboutPage` inside
`PageSEO` and delete the duplicate node. Second option is cleaner.
**Risk.** Low. **Overlap.** None.

---

### B-10 — `/referenzen` duplicate page entity via trailing slash — **P3, KNOWN**

**Evidence.** `src/pages/ReferenzenPage.tsx:56` — `"@id": \`${base}/referenzen/#webpage\``
(trailing slash) while `PageSEO.tsx:146` produces `…/referenzen#webpage`. `dist/referenzen.html`
therefore carries two page nodes with different names ("Referenzen – Arbeitsweise &
Projektverständnis | Cogniiq" vs "Referenzen – Arbeitsweise und Projektverständnis |
Cogniiq"). The same block also emits a fourth `#localbusiness` definition with no `geo`.

**Fix.** Drop the trailing slash and reference the existing node; delete the redundant
`LocalBusiness` (the sitewide one already covers it). **Risk.** None. **Overlap.** None.

---

### B-11 — Page-level `LocalBusiness` drops `streetAddress` on 13 pages — **P2, KNOWN**

**Evidence.** `src/components/CityServicePage.tsx:82-88` builds a `PostalAddress` with
`addressLocality`/`addressRegion`/`postalCode`/`addressCountry` but **no**
`streetAddress`, under `@id: …/#localbusiness`. Affected:

```
bayern.html, bayreuth.html, muenchen.html, regensburg.html,
{bayreuth,muenchen,regensburg}/{automatisierung,ki-telefonassistent,webdesign}.html
```
(13 files). `src/components/ClusterPage.tsx:118` does include `streetAddress`, so 28 other
page-level `LocalBusiness` nodes are complete — the inconsistency is within the codebase.

`streetAddress` is a required property for a Google `LocalBusiness`. Because the same
`@id` on the same page *also* appears complete (from `index.html` and
`LocalBusinessSchema`), the practical damage is a third contradictory address record
rather than a missing one — but these 13 are the city landing pages, the highest-value
local-SEO surface on the site.

**Fix.** Delete the page-level `LocalBusiness` from `CityServicePage` entirely and keep
only the `Service` node with `provider: {"@id": ".../#localbusiness"}` — the sitewide
node already supplies the full business record, and `areaServed` on the `Service`
carries the city relationship. That removes a duplicate *and* a defect in one change.
**Risk.** Low. **Overlap.** `/bayreuth/webdesign` and `/muenchen/webdesign` are live
experiment pages — JSON-LD only, no visible/head change, so acceptable, but coordinate.

---

### B-12 — `geo` is ~357 m from the Google Business Profile pin — **P2, LIKELY**

**Evidence.**
- `src/lib/seo-data.ts:17-20` — `latitude: "49.948260", longitude: "11.578270"`.
- `src/lib/seo-data.ts:236-238` (`getGoogleMapsUrl`, emitted as `hasMap` on every page) —
  the GBP place URL contains `!3d49.9471651!4d11.5735834`.

Δlat 0.001095° ≈ 122 m; Δlon 0.004687° at 49.95°N ≈ 336 m; combined ≈ **357 m**.
The same `BUSINESS_INFO.geo` also drives the embedded map on the contact/location pages
(`getGoogleMapsEmbedUrl`, `src/components/LocationContent.tsx:317`), so the embedded pin
and the "open in Maps" link on the same page point to different spots.

**UNCERTAIN part:** I cannot verify from the repository which coordinate is the true
address of "Am Main 3, 95444 Bayreuth" — that would require an external geocoding lookup,
which is outside the read-only scope. The *discrepancy* is KNOWN; *which value is wrong*
is LIKELY-the-`seo-data`-one (the GBP place is an externally verified record).

**Fix.** Owner/verification question: confirm the coordinates of Am Main 3 against the
Google Business Profile and set `BUSINESS_INFO.geo` to match the GBP pin so schema,
`hasMap`, and the embedded map agree. **Do not** guess a third value.
**Risk.** Low. **Overlap.** None.

---

### B-13 — `BreadcrumbList` on 20 pages with no visible breadcrumb — **P3, KNOWN**

**Evidence.** 71 of 93 files contain `aria-label="Breadcrumb"` in the rendered body. The
22 that do not, minus the two with no breadcrumb schema (`404.html`, `app-shell.html`),
leaves **20 pages emitting breadcrumb schema with nothing on the page**:
`anfrage-erhalten`, `blog` + all **10 blog posts**, `datenschutz`, `faq`, `impressum`,
`index`, `ki-telefonassistent`, `kontakt`, `prozessautomatisierung`, `webdesign`.

Google's breadcrumb guidance expects the structured data to reflect a breadcrumb the user
can see. Tolerated in practice, hence P3 — but the blog family is the one worth fixing,
because those posts have a genuine `Home > Blog > Post` hierarchy that is real and simply
not rendered. Note `/webdesign` is in this list and is the known 1,696-impression /
position-76 page.

**Fix.** Render the existing breadcrumb component on the blog family and on the three
service hubs (`/webdesign`, `/ki-telefonassistent`, `/prozessautomatisierung`) — the data
already exists in the schema, so it is a render-only change. Leave `/`, `/impressum`,
`/datenschutz`, `/kontakt`, `/faq` alone (flat pages).
**Risk.** Low (visual). **Overlap.** None of the 20 are experiment pages.

---

### B-14 — Homepage: one-item breadcrumb and a malformed `@id` — **P3, KNOWN**

**Evidence.** `dist/index.html` block 3:
`{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://cogniiq.de"}]}` — the only single-item breadcrumb on the site; it
expresses nothing.
Block 2: `"@id":"https://cogniiq.de#webpage"` — no slash before the fragment, because
`PageSEO.tsx:146` does `\`${canonical}#webpage\`` and the homepage canonical
(`seo-data.ts:207`) has no trailing slash. Every other page produces
`https://cogniiq.de/<path>#webpage`. Cosmetic, but it is the site's most important page
and the one `@id` that does not follow the pattern.

**Fix.** Suppress `breadcrumbs` on the homepage; normalise the `@id` to
`https://cogniiq.de/#webpage`. **Risk.** None. **Overlap.** None.

---

### B-15 — 5 pillar pages emit `Article` with no dates and no image — **P3, KNOWN**

**Evidence.** `digitale-automatisierung-unternehmen`, `keine-anfragen-website`,
`keine-terminbuchung-online`, `verpasste-anrufe-verlust`, `zu-viel-manuelle-arbeit` each
emit an `Article` with `headline`, `description`, `url`, `author` (anonymous
`Organization`, see B-03) and **no** `datePublished`, `dateModified`, `image`, or
`publisher`. All 10 blog `Article`s likewise have **no `image`** and **no
`publisher.logo`**.

`datePublished` and `image` are Google-recommended for `Article`; `publisher.logo` is
recommended. Nothing here is invalid, but these nodes carry almost no information.

**Fix.** Either add real dates + `image` + `publisher: {"@id": ".../#organization"}`, or —
more honestly for the 5 pillar pages, which read as evergreen service/problem pages
rather than articles — drop `Article` and let the `WebPage` node stand. Do not invent
publication dates.
**Risk.** Low. **Overlap.** None.

---

### B-16 — Unescaped JSON-LD serialisation in `LocalBusinessSchema.tsx` — **P3, KNOWN (latent)**

**Evidence.** `src/components/LocalBusinessSchema.tsx:149-152`:
```jsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(graph, null, 0) }} />
```
No `<` escaping. Contrast `src/components/PageSEO.tsx:77`, which does
`.replace(/</g, "\\u003c")` and documents exactly why.

**Currently not exploitable:** every value in this graph comes from the static
`BUSINESS_INFO` constant; I checked the rendered output and no `<` appears in any of the
93 emitted blocks. But this component is one string edit away from a broken document —
any future value containing `</script>` (a description, a founder title, an owner-supplied
field) terminates the script element early and injects raw markup into every page.

**Fix.** Apply the same `.replace(/</g, "\\u003c")`, or better, export the `JsonLd`
helper from `PageSEO.tsx` and reuse it. **Risk.** None. **Overlap.** None.

---

### B-17 — `HowTo` schema on `/ki-telefonassistent` — **P3, KNOWN**

**Evidence.** `dist/ki-telefonassistent.html` emits
`{"@type":"HowTo","name":"So wird Ihr Empfang am Telefon gebaut – in 5 Schritten",
"totalTime":"P14D","step":[…]}`. Google removed HowTo rich results from search entirely
in 2023; the markup produces nothing. It is valid and truthful (the steps match the
visible copy), just inert. Note `totalTime: "P14D"` restates the two-week handover
commitment — keep it consistent with whatever `FAKTEN.uebergabeGarantie` says.
**Fix.** Optional removal to reduce payload. Not worth a code change on its own.
**Risk.** None. **Overlap.** `/ki-telefonassistent` is not itself an experiment page.

---

### B-18 — Breadcrumb root label inconsistency — **P3, KNOWN**

**Evidence.** First `ListItem.name` across the site is `"Home"` on 81 pages and
`"Start"` on the 10 blog posts (`dist/blog/*.html`). Both point at
`https://cogniiq.de`. Harmless but sloppy; pick one.
**Fix.** Normalise the blog breadcrumb builder to `"Home"`. **Risk.** None. **Overlap.** None.

---

### B-19 — `vatID` missing from `Organization` — **P3, KNOWN**

**Evidence.** `dist/impressum.html` visible text: "USt-IdNr. gemäß § 27a UStG:
**DE460292419**". The string `vatID` / `taxID` / `identifier` appears **0 times** in the
entire JSON-LD dump.

`Organization.vatID` is a verifiable, externally checkable identifier (VIES) and is
exactly the kind of entity anchor a young domain with no `sameAs` (B-07) is missing. It
is already published on the site, so adding it asserts nothing new.

**Fix.** Add `vatID: "DE460292419"` to the `Organization` node in `LocalBusinessSchema.tsx`
(sourced from a constant in `seo-data.ts`, so it stays a single source of truth with the
Impressum). Consider `legalName` alignment too: schema says
`"Cogniiq, Inhaber Lazar Popovic"`, the Impressum renders "Cogniiq / Inhaber: Lazar
Popovic" — same content, and the schema form is fine.
**Risk.** None. **Overlap.** None.

---

## Schema-type validation summary

| Type | Instances | Verdict |
|---|---|---|
| `Organization` | 2 keyed + 51 anonymous per site | **Defective** — duplicated (B-01), fragmented (B-03), no `sameAs` (B-07), no `vatID` (B-19). Required `name`+`url` present everywhere. |
| `LocalBusiness` / `ProfessionalService` | 2–4 per page | **Defective** — type conflict (B-02), 13 pages missing `streetAddress` (B-11), geo/GBP mismatch (B-12). `priceRange: "€€€"` is present but Google no longer documents it for LocalBusiness — harmless, ignored. `openingHoursSpecification` values are valid `HH:MM` in both shapes. |
| `WebSite` | 2 per page | Duplicated (B-01) but otherwise valid. No `potentialAction`/`SearchAction` — **correct**, the site has no search endpoint; do not add one. |
| `WebPage` | 92 (1 per page) | Structurally valid; `name`/`description` drift on 74 pages (B-04); homepage `@id` malformed (B-14). |
| `BreadcrumbList` | 91 pages, ×2 each (inline in `WebPage.breadcrumb` + standalone) | **Valid.** Positions 1..n correct on 100%; last item == page URL on 100%. The double emission is intentional and legal. Visibility gap on 20 pages (B-13). |
| `FAQPage` | 71 pages, ~600 Q&A | Valid syntax; **answers not visible** (B-06). No FAQ family found with visible Q&A but no schema. |
| `Service` | 55 page-level + 279 in `hasOfferCatalog` | Valid; 17 have anonymous providers (B-03). |
| `Offer` | 6 with `price` + tariff offers | 6 **invalid** `price` strings (B-05); `/kosten-ki-telefonassistent` correct. |
| `Article` | 15 | 10 with contradictory dates (B-08); 5 with no dates/image (B-15); all with anonymous `author`/`publisher` and no `image`. |
| `Person` | 2 keyed (`/ueber-uns`) + 2 anonymous per page | Keyed pair is well modelled with `worksFor`; the sitewide `founder[]` duplicates them without `@id` (B-01). |
| `HowTo` | 1 | Valid, inert (B-17). |
| `AboutPage` / `CollectionPage` | 1 each | `@id` collisions (B-09, B-10). |
| `AggregateRating` / `Review` | **0** | **Correct and commendable** — see HEALTHY §1. |

## Prerender vs. hydration drift (scope item 8)

- **JSON-LD itself does not drift.** `PageSEO`'s blocks are JSX (`PageSEO.tsx:165-189`),
  not `useEffect` injections — the comment at `PageSEO.tsx:58-71` documents that this was
  deliberately fixed. `LocalBusinessSchema` likewise renders in the tree. React hydrates
  over the identical markup; no block is added, removed, or rewritten after hydration.
  The `index.html` template block is inert static markup outside `#root` and survives
  hydration untouched. **The prerendered JSON-LD is what a crawler gets, and it is what
  the hydrated app produces.**
- **The head drifts around it.** `PageSEO.tsx:93-128` rewrites `document.title` and the
  meta tags on mount from the component's props, undoing `prerender.mjs:92-97`. So after
  hydration the DOM title matches the JSON-LD and no longer matches the served HTML.
  **The crawled version is the served HTML, and the served `<title>` (from
  `publicRoutes`) is the intended one** — which makes the JSON-LD the side that is wrong
  on 74 pages (B-04).

## Explicitly NOT recommended

- Do **not** add `AggregateRating`, `Review`, `award`, `hasCredential`,
  `numberOfEmployees`, or client-count/ROI properties. Nothing on the site substantiates
  them, and their current absence is the healthiest thing in this graph.
- Do **not** add `sameAs` URLs that have not been supplied by the owner.
- Do **not** add `SearchAction` — there is no site search.
- Do **not** add schema to raise schema count. The site already emits 435 blocks across
  93 files; the problem is contradiction and fragmentation, not volume. Every fix above
  except B-19 either **removes** or **de-duplicates** markup.
