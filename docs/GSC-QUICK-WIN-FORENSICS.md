# GSC Quick-Win Forensics — cogniiq.de

**Data source:** Google Search Console (`sc-domain:cogniiq.de`), via `claude-seo run gsc_query.py`, real API data.
**Window:** 2026-07-31 to 2026-08-25 (28 days).
**Site totals in window:** 12 clicks, 9,458 impressions, 0.13% CTR, avg. position 54.7 (dragged down by long-tail rows; not representative of the queries below).
**Status of this document:** analysis only. **No website files were modified to produce this report.**

**Method:** the tool's built-in `quick_wins` heuristic returned only 3 rows (position 4–10 above an internal impression threshold). Per instruction to cover *every* position 4–10 quick win, all 842 query+page rows in the raw dataset were scanned directly for `4.0 ≤ position ≤ 10.0`, regardless of that threshold. That surfaced 6 queries with material impression volume and 8 more with negligible volume (≤8 impressions) or off-topic intent — the latter are logged in the Appendix with reasons for exclusion from full forensic treatment, not silently dropped.

On-page facts (title/meta/H1/internal links/anchor text) come from direct inspection of the repo source — `src/pages/**`, `src/lib/seo-data.ts`, `src/lib/standorte-data.ts`, `src/lib/routing/publicRoutes.ts`, `Footer.tsx`, `Navigation.tsx`, `CityLandingPage.tsx`, `LocationContent.tsx` — the same files that render the pages GSC is measuring. Indexation status comes from `claude-seo run gsc_inspect.py` (URL Inspection API) for each ranking URL discussed. External backlink data was **not** queried for this report — flagged wherever that gap is load-bearing.

---

## Query 1 — "web development"

| Field | Value |
|---|---|
| 1. Exact query | `web development` |
| 2. Ranking URL | `https://cogniiq.de/` (homepage) |
| 3. Clicks | 0 |
| 4. Impressions | 81 |
| 5. CTR | 0% |
| 6. Avg. position | 6.3 |
| 7. Search intent | Broad, English, generic head term. Ambiguous informational/commercial — no city qualifier, no local buying signal. For a Bavaria-focused German-language agency, this reads as low-specificity, possibly low-relevance demand. |
| 8. Correct page? | **No.** The homepage is a brand/company page, not a service page. No page on the site is purpose-built around "web development" / "Webentwicklung" as a topic — see Query 2. |
| 9. Other Cogniiq URLs w/ impressions, same/related query | None for the exact string `web development` in the 842-row dataset — homepage is the only URL. |
| 10. Cannibalization risk | Low for this exact string (single URL holds it) — but shares the underlying content gap driving Queries 2 and 6. |
| 11. Title tag | `Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern` (`src/lib/seo-data.ts`, `PAGE_META.home`) — no "web development" / "Webentwicklung". |
| 12. Meta description | `Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, Websites und Prozessautomatisierung. Erreichbar auch außerhalb der Öffnungszeiten.` — no match either. |
| 13. H1 | `Digitale Systeme, die Unternehmen führen.` (`src/components/MobileHero.tsx`, the prerendered hero) — brand tagline, zero keyword overlap. |
| 14. Internal links pointing to page | Effectively site-wide — every page's nav logo (`Navigation.tsx:182`) and every breadcrumb's "Home" node link to `/`. Highest internal link count of any URL on the site. |
| 15. Anchor text | Logo: `aria-label="Cogniiq Startseite"` (not visible text); breadcrumbs: `"Home"`. No keyword-relevant anchor text feeds this URL. |
| 16. Unique info/evidence | ROI calculator, cost-comparison section, trust strip, process steps, FAQ — real content, but company/brand positioning, not a "web development" service narrative. |
| 17. Likely reason not ranking higher | The page isn't built for this query — it ranks only because it's the domain's strongest page by authority and loosely touches web/website topics. |
| Indexation | `PASS` — submitted and indexed, canonical matches, robots allowed. Not an indexing problem. |

**Bottleneck: C (insufficient topical relevance)**, secondary **B (search-intent mismatch)**.

---

## Query 2 — "webentwicklung bayreuth"

| Field | Value |
|---|---|
| 1. Exact query | `webentwicklung bayreuth` |
| 2. Ranking URL | `https://cogniiq.de/` (homepage) — best-ranked of 5 competing URLs |
| 3. Clicks | 0 |
| 4. Impressions | 67 |
| 5. CTR | 0% |
| 6. Avg. position | 6.0 |
| 7. Search intent | Commercial, local — "web development [in] Bayreuth." High buyer specificity: city + service. |
| 8. Correct page? | **No.** `/bayreuth/webdesign` is the intended city+service page but ranks far worse (position 35.3) than the homepage. |
| 9. Other Cogniiq URLs, same query | `/` — 6.0, 67 impr (winning) · `/bayreuth/webdesign` — 35.3, 18 impr (intended page) · `/bayreuth/website-relaunch` — 26.0, 1 impr · `/bayreuth` — 100.8, 6 impr (city hub) · `/webdesign` — 130.0, 6 impr (generic hub). **5 URLs splitting one query.** |
| 10. Cannibalization risk | **High** — 5 competing URLs, and the *wrong* one is winning. See also Query 6 (`webentwickler bayreuth`), the same fight under a lexical variant. |
| 11. Title tag | Ranking URL (homepage): as Query 1 — no "Bayreuth", no "Webentwicklung". Intended page (`/bayreuth/webdesign`, `publicRoutes.ts:257`): `Webdesign Agentur Bayreuth – Website erstellen & SEO \| Cogniiq` — has "Bayreuth" but never "Webentwicklung"/"Entwicklung" in title or `keywords`. |
| 12. Meta description | Homepage: as Query 1. Intended page: `...professionelle Webentwicklung mit lokalem Ansprechpartner.` (`publicRoutes.ts:258`) — **the only place "Webentwicklung" appears anywhere in this cluster**, buried at the tail of a meta description. |
| 13. H1 | Homepage: `Digitale Systeme, die Unternehmen führen.` — no "Bayreuth", no "Webentwicklung". |
| 14. Internal links pointing to page | Homepage: site-wide. `/bayreuth/webdesign`: linked from `WebdesignHub.tsx`, Bayreuth column of `Footer.tsx`, and sibling cluster pages' `internalLinks` arrays — moderate, Bayreuth-cluster-scoped, not site-wide. |
| 15. Anchor text | Every link into `/bayreuth/webdesign` uses `"Webdesign Bayreuth"` — never `"Webentwicklung Bayreuth"`. No page anywhere uses "Webentwicklung" as anchor text. |
| 16. Unique info/evidence | `/bayreuth/webdesign` has genuine local content (Oberfranken references, pricing, delivery process) but is entirely framed around **"Webdesign"** (visual/design), not **"Webentwicklung"** (engineering/development). |
| 17. Likely reason not ranking higher | (a) No page — including the "correct" one — targets "Webentwicklung" in title/H1/keywords/anchor text. (b) Homepage's domain-wide authority beats the topically closer but term-mismatched page, and the 5-way split dilutes whichever page should win. |
| Indexation | Homepage `PASS`; `/bayreuth/webdesign` not separately inspected in this pass (already confirmed indexable via sitemap `indexable: true`, priority 0.9). Not an indexing problem. |

**Bottleneck: C (topical relevance / vocabulary gap) + D (cannibalization)** — co-primary.

---

## Query 3 — "website relaunch regensburg"

| Field | Value |
|---|---|
| 1. Exact query | `website relaunch regensburg` |
| 2. Ranking URL | `https://cogniiq.de/regensburg/website-relaunch` — correct dedicated page, already best of 3 URLs |
| 3. Clicks | 1 |
| 4. Impressions | 61 |
| 5. CTR | 1.64% |
| 6. Avg. position | 5.4 |
| 7. Search intent | Commercial, local, high intent — an existing site owner in Regensburg actively looking to relaunch. Maps to a priced service line. |
| 8. Correct page? | **Yes.** Already the top-ranking URL among the site's own competing pages. |
| 9. Other Cogniiq URLs, same query | `/regensburg/website-relaunch` — 5.4, 61 impr, 1 click (correct, best) · `/regensburg` — 56.8, 15 impr (city hub) · `/webdesign` — 70.7, 37 impr (generic hub — highest impressions of the three despite being least relevant). |
| 10. Cannibalization risk | **Moderate** — the right page wins, but `/webdesign` still pulls 37 impressions, diluting the relevance signal. |
| 11. Title tag | `Website Relaunch Regensburg – Modernisierung & SEO-Neustart \| Cogniiq` — exact match. |
| 12. Meta description | `Website Relaunch in Regensburg: Cogniiq modernisiert veraltete Websites für Unternehmen in Regensburg und der Oberpfalz. Pagespeed, SEO, DSGVO – komplett neu aufgesetzt.` — on-topic. |
| 13. H1 | `Website Relaunch in Regensburg` — exact match. |
| 14. Internal links pointing to page | `Footer.tsx:329` (Regensburg column), `WebdesignHub.tsx:84`, `internalLinks` arrays of `WebsiteErstellenRegensburg.tsx`, `WebdesignKostenRegensburg.tsx`, `LokalesSEORegensburg.tsx`, `LandingpageRegensburg.tsx` — 6 sources. **Absent:** the `/regensburg` city hub (`CityLandingPage.tsx` via `CITY_LINKS` in `standorte-data.ts`) does not link to it — that config only lists Webdesign / KI-Telefonassistent / Automatisierung per city. Also absent from the homepage's `LocationContent.tsx` service links (same restricted 3-service list). |
| 15. Anchor text | `"Website Relaunch Regensburg"` in cluster pages and `WebdesignHub`; `"Website Relaunch"` in the Footer's Regensburg column. |
| 16. Unique info/evidence | 9 unique FAQ items, explicit price range (ab ca. 2.000 €; 3.500–7.000 € with migration), sector-specific local color (Regensburg Gastronomie/tourism), pain-point list, stated redirect/SEO-migration methodology — genuinely differentiated content. |
| 17. Likely reason not ranking higher | On-page relevance is already correct and strong — **not** a content problem. Reachable only from secondary placements; never linked from the two highest-authority pages in its own silo (the `/regensburg` hub and the homepage), so it isn't accumulating the internal link equity a 5→top-3 push needs. External backlinks not queried — can't rule in/out. |
| Indexation | `PASS` — submitted and indexed, canonical matches, last crawled 2026-08-10. Not an indexing problem. |

**Bottleneck: E (weak internal authority)** primary; **F (external authority)** unverified/possible secondary. **On-page copy is already correct — do not rewrite it.**

---

## Query 4 — "website performance bayreuth"

| Field | Value |
|---|---|
| 1. Exact query | `website performance bayreuth` |
| 2. Ranking URL | `https://cogniiq.de/bayreuth/website-relaunch` — best of 3 URLs |
| 3. Clicks | 0 |
| 4. Impressions | 27 |
| 5. CTR | 0% |
| 6. Avg. position | 7.0 |
| 7. Search intent | Commercial/technical, local — someone diagnosing a slow site in Bayreuth, adjacent to (but narrower than) a full relaunch. Mid-funnel: may want a speed fix, not necessarily a full redesign. |
| 8. Correct page? | **Partially.** `/bayreuth/website-relaunch` is the closest topical match on the site (it covers pagespeed as a pain point/deliverable) and already wins internally, but it is not built around "Performance" as its primary subject. |
| 9. Other Cogniiq URLs, same query | `/bayreuth/website-relaunch` — 7.0, 27 impr (winning) · `/bayreuth/webdesign` — 47.5, 2 impr · `/bayreuth/lokales-seo` — 93.0, 1 impr. |
| 10. Cannibalization risk | Low — the strongest page already wins clearly; the other two are marginal. |
| 11. Title tag | `Website Relaunch Bayreuth – Modernisierung & SEO-Neustart \| Cogniiq` — no "Performance". |
| 12. Meta description | Mentions relaunch/modernization, not "Performance" as a headline term. |
| 13. H1 | `Website Relaunch in Bayreuth` — no "Performance". |
| 14. Internal links pointing to page | `Footer.tsx:303`, `WebdesignHub.tsx:74`, `WebdesignAgenturDeutschland.tsx:101`, sibling Bayreuth cluster pages' `internalLinks` (website-erstellen, webdesign-kosten, landingpage, lokales-seo) — **7 known sources, more than the Regensburg equivalent** (see Query 3), yet still only reaches position 7. |
| 15. Anchor text | `"Website Relaunch"` / `"Website Relaunch Bayreuth"` everywhere — never "Performance" or "Pagespeed". |
| 16. Unique info/evidence | Page content does substantively cover performance: pain point `"Website lädt langsam – Google straft schlechte Core Web Vitals..."` and deliverable `"Performance-Optimierung: Ladezeit unter 2s, Core Web Vitals grün"` — genuine relevant content exists, it's just framed as one of several relaunch deliverables, not the page's identity. |
| 17. Likely reason not ranking higher | Unlike Query 3, this page already has *more* internal links than the Regensburg equivalent and still can't crack top 5 — so authority is not the binding constraint here. The limiting factor is that "Performance" is a supporting deliverable on a page whose title/H1/keywords are organized around "Relaunch," not a standalone topical target. This is the clearest evidence in the dataset that internal-link volume alone does not fix a vocabulary-targeting gap. |

**Bottleneck: C (insufficient topical relevance)** — specifically under-targeted vocabulary on an otherwise strong, well-linked page. **Not E** (link volume already exceeds the comparable Regensburg page) and **not on-page absence** (the content exists, it just isn't the page's primary framing).

---

## Query 5 — "website performance optimierung bayreuth"

| Field | Value |
|---|---|
| 1. Exact query | `website performance optimierung bayreuth` |
| 2. Ranking URL | `https://cogniiq.de/bayreuth/website-relaunch` — best of 3 URLs |
| 3. Clicks | 0 |
| 4. Impressions | 22 |
| 5. CTR | 0% |
| 6. Avg. position | 7.2 |
| 7. Search intent | Same cluster as Query 4, slightly more explicit ("Optimierung" = optimization) — still commercial/technical, local. |
| 8. Correct page? | Same as Query 4 — partially. |
| 9. Other Cogniiq URLs, same query | `/bayreuth/website-relaunch` — 7.2, 22 impr (winning) · `/bayreuth/webdesign` — 47.2, 4 impr · `/webdesign` — 95.0, 1 impr. |
| 10. Cannibalization risk | Low, same pattern as Query 4 — dominant page already wins clearly. |
| 11–16. Title/meta/H1/links/anchors/content | Identical to Query 4 — same URL, same evidence. |
| 17. Likely reason not ranking higher | Same as Query 4: this is the near-duplicate query variant of the same underlying searcher need, hitting the same page, with the same root cause. Treat Queries 4 and 5 as one fix, not two. |

**Bottleneck: C (insufficient topical relevance)** — identical diagnosis to Query 4; queries 4+5 should be resolved together.

---

## Query 6 — "webentwickler bayreuth"

| Field | Value |
|---|---|
| 1. Exact query | `webentwickler bayreuth` ("web developer Bayreuth" — noun-agent variant of Query 2's "webentwicklung") |
| 2. Ranking URL | `https://cogniiq.de/` (homepage) — best of 4 URLs |
| 3. Clicks | 0 |
| 4. Impressions | 12 |
| 5. CTR | 0% |
| 6. Avg. position | 8.2 |
| 7. Search intent | Commercial, local — functionally the same buyer intent as Query 2, different surface wording (agent noun vs. process noun). |
| 8. Correct page? | **No** — same diagnosis as Query 2: homepage wins over the dedicated `/bayreuth/webdesign` page. |
| 9. Other Cogniiq URLs, same query | `/` — 8.2, 12 impr (winning) · `/bayreuth/webdesign` — 46.5, 2 impr · `/webdesign` — 80.3, 3 impr · `/bayreuth` — 91.7, 3 impr. A near-identical variant, `"web entwickler bayreuth"` (two words), also exists in the data at position 72.3–82.3 across `/bayreuth` and `/bayreuth/webdesign` — worse positions still, confirming the site has no page that wins for *any* phrasing of "web developer/development in Bayreuth" except by accident (the homepage). |
| 10. Cannibalization risk | **High** — same 4–5-way split as Query 2, same root cause, different lexical surface. |
| 11–16. Title/meta/H1/links/anchors/content | Identical underlying facts to Query 2 — no page targets "Webentwickler"/"Webentwicklung" vocabulary anywhere in title/H1/keywords/anchor text. |
| 17. Likely reason not ranking higher | Same as Query 2. This query (and its `"web entwickler bayreuth"` cousin) is evidence the Query 2 problem is a **query-family** problem, not a single-keyword problem — fixing `/bayreuth/webdesign`'s targeting for "Webentwicklung" should be evaluated against this whole cluster, not one exact string. |

**Bottleneck: C (topical relevance / vocabulary gap) + D (cannibalization)** — same as Query 2; cross-reference, not a separate root cause.

---

## Bottleneck summary

| Query | Ranking URL | Position | Impr. | Bottleneck |
|---|---|---|---|---|
| website relaunch regensburg | `/regensburg/website-relaunch` | 5.4 | 61 | **E** (internal authority), possible **F** (unverified) |
| webentwicklung bayreuth | `/` | 6.0 | 67 | **C** + **D** (co-primary) |
| web development | `/` | 6.3 | 81 | **C**, secondary **B** |
| website performance bayreuth | `/bayreuth/website-relaunch` | 7.0 | 27 | **C** |
| website performance optimierung bayreuth | `/bayreuth/website-relaunch` | 7.2 | 22 | **C** (same as above) |
| webentwickler bayreuth | `/` | 8.2 | 12 | **C** + **D** (same as webentwicklung bayreuth) |

None of the six is bottlenecked on indexation — every ranking URL inspected returned `PASS`. Only 2 of 6 (`website relaunch regensburg`; `website performance*` pair, structurally) already have correct on-page targeting; the other 4 would not be fixed by editing titles/meta/H1 on the URL currently ranking, because the URL currently ranking (the homepage, in 3 of 6 cases) is not the page that should be targeting the query at all.

---

## Appendix — reviewed, excluded from full forensic treatment

Every row in the 842-row dataset with position 4.0–10.0 was reviewed. These fell below material impression volume or were off-topic; each was still individually checked rather than dropped by threshold alone.

| Query | Page | Position | Impr. | Reason excluded |
|---|---|---|---|---|
| `individuelle softwareentwicklung bayreuth` | `/` | 7.9 | 8 | Relevant (reinforces the Query 2/6 vocabulary-gap pattern with a third variant, "Softwareentwicklung") but below the 10-impression materiality line used for full write-ups. Worth folding into any future fix for the Bayreuth web-dev term cluster. |
| `cogniiq` | `/kontakt` | 4.3 | 6 | Branded/navigational query. Note: elsewhere in the dataset "cogniiq" ranks position 1 on other URLs (regensburg, regensburg/webdesign, webdesign-agentur-deutschland, etc.) — position 4.3 specifically on `/kontakt` is a minor anomaly, not a growth opportunity (brand queries aren't acquisition levers). |
| `webentwickler bayreuth` (page: `/bayreuth`) | `/bayreuth` | 91.7 | 3 | Not position 4–10 (listed for context only — see Query 6). |
| `web entwickler bayreuth` | `/bayreuth`, `/bayreuth/webdesign` | 72.3–82.3 | 3 each | Not position 4–10; supporting evidence for Query 6's cluster note. |
| `bayern?` | `/bayern/ki-telefonassistent` | 5.0 | 1 | Malformed/likely autocomplete fragment query. Negligible volume. |
| `computer in der nähe` | `/` | 4.0 | 2 | Off-topic intent ("computer near me" — hardware/retail search, not a match for Cogniiq's services). Negligible volume. |
| `it-dienstleistungen` | `/` | 5.2 | 4 | Generic, no city/service specificity. Negligible volume. |
| `preisvergleich für automatisierungstechnik` | `/kosten-automatisierung` | 7.0 | 1 | Price-comparison-tool intent, not a service-buyer query. Negligible volume. |
| `"ki rezeption" zahnarzt telefon` | `/webdesign-arzt-bayreuth` | 9.0 | 1 | Negligible volume. |
| `web design` | `/` | 7.0 | 1 | English generic variant of Query 1, negligible volume on its own. |

---

## Ranked priority: easiest to improve → traffic gain → commercial value

### 1. "website relaunch regensburg" — highest priority
- **Effort: Low.** No content rewrite needed — on-page is already correct. Fix is structural: link `/regensburg/website-relaunch` from the `/regensburg` city hub and the homepage's `LocationContent.tsx` Regensburg service list; consider whether `/webdesign` (37 unrelated impressions at position 70.7) should route relevance away from itself for this term.
- **Traffic gain:** Already converting (1 click, 1.64% CTR) at position 5.4 — closest of all six to page-1 prominence.
- **Commercial value: High** — tied to a priced service line (€2,000–7,000+) with buyer intent already evidenced by the existing click.

### 2. "website performance bayreuth" + "website performance optimierung bayreuth" — second priority
- **Effort: Low–Medium.** Content already exists on the winning page (`/bayreuth/website-relaunch`); the fix is emphasis, not creation — e.g., a dedicated "Performance & Ladezeit" subheading/section using the exact terms, rather than leaving them folded into relaunch pain points/deliverables. No new page, no internal-link campaign needed (linking is already strong here).
- **Traffic gain:** Combined 49 impressions at 0% CTR, position 7.0–7.2 — realistic near-term upside since the right page already wins the internal contest; this is a targeting refinement, not a rebuild.
- **Commercial value: Medium-High** — narrower intent than a full relaunch (possible smaller ticket), but a clean upsell/qualification path into the relaunch service once on the page.

### 3. "webentwicklung bayreuth" + "webentwickler bayreuth" (+ the sub-material "web entwickler bayreuth" / "individuelle softwareentwicklung bayreuth" variants) — third priority
- **Effort: Medium.** Requires a real decision, not just link edits: either (a) add "Webentwicklung"/"Webentwickler" to `/bayreuth/webdesign`'s title/H1/keywords and redirect anchor text across the cluster toward it, consolidating the current 4–5-way split, or (b) deliberately cede this term family to the homepage and reinforce it there instead. Either path is a content + IA change.
- **Traffic gain:** ~79 impressions combined across the two material variants, 0% CTR — real upside if consolidated, since right now no single page is even trying to own this vocabulary.
- **Commercial value: High** — same city/service intent class as #1, just unresolved at the content-strategy level.

### 4. "web development" — lowest priority
- **Effort: High.** No existing page targets this term or a clear intent; a real fix means deciding whether to build new positioning around it at all.
- **Traffic gain: Uncertain.** 81 impressions but 0 clicks over 28 days at position 6.3 — for a German-language, Bavaria-local business, this generic English head term may include low-relevance traffic that wouldn't convert even at position 1.
- **Commercial value: Uncertain** — recommend checking searcher geography/language mix (GSC country/device breakdown) before investing content effort here.
