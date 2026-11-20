# 06 · Content quality — people-first and spam-policy audit

Audit date: 2026-11-20 · Auditor role: content quality / people-first · Scope: every URL in
`src/lib/routing/publicRoutePaths.ts` (89 routes), measured on the **live prerendered HTML** of
`https://www.cogniiq.de` fetched on 2026-11-20. Research only; no source file was changed.

Bluntness note: this document does not grade effort. It grades what a searcher and a crawler
actually receive.

---

## 0 · Method (reproducible)

| Step | What was done |
|---|---|
| Corpus | All 89 manifest routes fetched from `www.cogniiq.de` (4 concurrent, all HTTP 200). 86 carry `index, follow`; 3 are `noindex` (`/integrationen`, `/datenschutz-sicherheit`, `/anfrage-erhalten`). The live `sitemap.xml` is byte-identical in its `<loc>` set to `public/sitemap.xml`: **86 URLs, not ~115**. |
| Main text | `<main>` element only; `script`, `style`, `svg`, `nav`, `footer`, `template` removed. Navigation and footer are therefore **already excluded** from every number below. |
| Word count | Tokens matching `[a-zäöüß0-9]+` in that main text. This is the *crawlable* body: text that is in the delivered HTML. |
| Literal similarity | Jaccard on 5-word shingles, pairwise over all 86 indexable pages (3,655 pairs). |
| Template similarity | Same, after replacing city tokens (`regensburg*`, `bayreuth*`, `münch*`, `oberpfalz*`, `oberfrank*`, `oberbay*`, `ostbay*`) by one placeholder — "city-normalised Jaccard". This is the number that exposes find-and-replace templating. |
| Topical similarity | TF-IDF cosine (log-TF × smoothed IDF, L2-normalised) — catches paraphrased duplication that shingles miss. |
| Structural similarity | Jaccard of the city-normalised H2/H3 sets — "skeleton". |
| Shared vs unique | Share of a page's city-normalised 5-shingles that also occur on at least one other indexable page ("shared"); the remainder is unique to that page. `Est. unique words` = words × (1 − shared). |
| Reading | Representative pages of every family were read in full; quotes below are verbatim from the live HTML. |

Scripts and raw outputs live in the session scratch directory
(`/tmp/claude-0/-home-user-Cogniiq-Main/9a9701d6-f26f-5cdb-b187-a17e29811981/scratchpad/content/` — `scripts/extract.py`,
`scripts/analyze.py`, `scripts/intent.py`, `scripts/classify.py`, `out/metrics.csv`, `out/analysis.txt`). The scratch directory is
ephemeral; every number needed to check a conclusion is reproduced in this file.

**Limits of the method.** (1) Similarity numbers describe text, not Google's judgement. (2) "Shared"
also counts legitimate reuse — the price calculator and the binding tariff clauses are deliberately
identical on several pages. (3) No Search Console data, no backlink data, no rendered-DOM crawl
were available; where a conclusion depends on them it says so.

---

## 1 · Site-level numbers

| Metric | Value |
|---|---|
| Indexable URLs | 86 |
| Crawlable main-content words, total | 88,705 |
| Median words per page | 683 |
| Pages under 300 words | 6 (`/faq` 104, `/muenchen` 109, `/regensburg` 131, `/bayreuth` 137, `/impressum` 198, `/ki-telefonassistent/demo` 207) |
| Pages under 600 words | 31 of 86 (36 %) |
| Pages with ≥ 1,500 words | 14 of 86 — they hold 43 % of all words |
| Word-weighted share of main text that is shared with another page | 34 % city-normalised (32 % literal) |
| Geo-modified URLs (city hubs, service×city, industry×city, `/bayern`, `/deutschland`) | 39 of 86 = **45 % of the indexable site**, 38 % of its words |
| `<img>`, `<picture>`, `<audio>`, `<video>`, `<iframe>` elements in the delivered HTML of all 89 pages | **0** |
| Pages with `FAQPage` JSON-LD | 68 |
| …of which **no** answer text is in the delivered HTML | **45 pages, 395 answers, 10,691 words** that exist only inside JSON-LD |

Two site-level facts dominate everything else:

1. **The site is two sites.** About fourteen long pages (flagship, cost pages, practice pages,
   the two pillars rewritten in September) are carefully written, state their limits and refuse
   to invent numbers. Around them sit ~55 template or near-template pages from an earlier
   programmatic build, 39 of them geo-modified.
2. **There is not one piece of non-text evidence on the entire public site** — no image, no
   screenshot, no audio, no video, no embedded map. Every claim on every page is prose.

---

## 2 · Template families — similarity summary

Intra-family pairwise statistics (mean / max). "Shared" = mean share of city-normalised 5-shingles
that also occur on another indexable page.

| Family | Pages | Words median (min–max) | Literal Jaccard mean / max | City-norm. Jaccard mean / max | TF-IDF cosine mean / max | Shared |
|---|---:|---|---|---|---|---:|
| City hubs `/{stadt}` | 3 | 131 (109–137) | 0.11 / 0.15 | **0.42 / 0.48** | 0.66 / 0.70 | **64 %** |
| Industry × city `/webdesign-{branche}-{stadt}` | 9 | 1,024 (742–1,677) | 0.10 / 0.39 | 0.13 / **0.53** | 0.43 / **0.86** | **59 %** |
| Service × city `/{stadt}/{leistung}` + `/bayern/ki-telefonassistent` | 25 | 653 (420–1,820) | 0.02 / 0.28 | 0.03 / 0.41 | 0.22 / 0.77 | 35 % |
| Industry phone pages (incl. `/praxen`) | 6 | 2,374 (869–4,373) | 0.06 / 0.20 | 0.06 / 0.20 | 0.36 / 0.62 | 40 % |
| Industry webdesign `/webdesign-{branche}` | 5 | 665 (641–775) | 0.11 / 0.12 | 0.11 / 0.12 | 0.28 / 0.34 | 22 % |
| Industry automation `/automatisierung-{branche}` | 4 | 614 (596–619) | 0.12 / 0.13 | 0.12 / 0.13 | 0.29 / 0.37 | 24 % |
| Problem pages | 5 | 351 (302–419) | 0.05 / 0.07 | 0.05 / 0.07 | 0.19 / 0.31 | 13 % |
| Blog articles | 10 | 611 (493–948) | 0.04 / 0.09 | 0.04 / 0.09 | 0.22 / 0.35 | 20 % |
| Cost pages | 3 | 1,937 (1,292–4,344) | 0.00 | 0.00 | 0.25 / 0.29 | 25 % |
| Pillars | 5 | 2,389 (980–5,072) | 0.00 / 0.02 | 0.00 / 0.02 | 0.24 / 0.38 | 17 % |
| Geo hubs `/bayern`, `/deutschland` | 2 | 1,318 | 0.07 | 0.07 | 0.58 | 18 % |

The same statistics for each city triple (same service, three cities) — this is where templating
shows, because the triple is the unit that was cloned:

| Triple | Words (Bayreuth / München / Regensburg) | City-norm. Jaccard range | TF-IDF cosine range | H2/H3 skeleton Jaccard (mean) |
|---|---|---|---|---:|
| `/webdesign-immobilien-{stadt}` | 977 / 1,016 / 1,022 | **0.44–0.53** | **0.80–0.86** | **0.83** |
| `/webdesign-gastronomie-{stadt}` | 1,007 / 995 / 1,000 | 0.32–0.39 | 0.68–0.72 | 0.55 |
| `/{stadt}/webdesign-kosten` | 680 / 676 / 647 | 0.19–0.41 | 0.61–0.77 | 0.42 |
| `/{stadt}/ki-telefonassistent` | 1,866 / 1,697 / 1,770 | 0.25–0.29 | 0.53–0.68 | 0.33 |
| `/{stadt}/landingpage` | 432 / 446 / 404 | 0.13–0.27 | 0.52–0.71 | 0.42 |
| `/webdesign-arzt-{stadt}` | 1,666 / 745 / 1,113 | 0.09–0.29 | 0.54–0.65 | 0.36 |
| `/{stadt}/website-relaunch` | 547 / 543 / 514 | 0.12–0.17 | 0.50–0.63 | 0.32 |
| `/{stadt}/lokales-seo` | 522 / 519 / 466 | 0.09–0.22 | 0.51–0.60 | 0.21 |
| `/{stadt}/website-erstellen` | 538 / 526 / 527 | 0.10–0.18 | 0.42–0.55 | 0.28 |
| `/{stadt}/webdesign` | 1,299 / 1,223 / 1,274 | 0.12–0.14 | 0.38–0.51 | 0.27 |
| `/{stadt}/automatisierung` | 1,291 / 1,152 / 1,109 | 0.11–0.13 | 0.37–0.48 | 0.28 |

### Top near-duplicate pairs (all 3,655 pairs, ranked by city-normalised Jaccard)

| # | City-norm. Jaccard | Literal Jaccard | TF-IDF cosine | Pair |
|---:|---:|---:|---:|---|
| 1 | 0.534 | 0.391 | 0.860 | `/webdesign-immobilien-bayreuth` ↔ `/webdesign-immobilien-regensburg` |
| 2 | 0.483 | 0.146 | 0.688 | `/muenchen` ↔ `/regensburg` |
| 3 | 0.446 | 0.305 | 0.802 | `/webdesign-immobilien-muenchen` ↔ `/webdesign-immobilien-regensburg` |
| 4 | 0.440 | 0.318 | 0.814 | `/webdesign-immobilien-bayreuth` ↔ `/webdesign-immobilien-muenchen` |
| 5 | 0.406 | 0.282 | 0.771 | `/bayreuth/webdesign-kosten` ↔ `/regensburg/webdesign-kosten` |
| 6 | 0.397 | 0.102 | 0.698 | `/bayreuth` ↔ `/muenchen` |
| 7 | 0.386 | 0.276 | 0.717 | `/webdesign-gastronomie-muenchen` ↔ `/webdesign-gastronomie-regensburg` |
| 8 | 0.371 | 0.093 | 0.589 | `/bayreuth` ↔ `/regensburg` |
| 9 | 0.327 | 0.228 | 0.720 | `/webdesign-gastronomie-bayreuth` ↔ `/webdesign-gastronomie-muenchen` |
| 10 | 0.316 | 0.223 | 0.682 | `/webdesign-gastronomie-bayreuth` ↔ `/webdesign-gastronomie-regensburg` |
| 11 | 0.295 | 0.258 | 0.683 | `/bayreuth/ki-telefonassistent` ↔ `/regensburg/ki-telefonassistent` |
| 12 | 0.286 | 0.208 | 0.651 | `/webdesign-arzt-muenchen` ↔ `/webdesign-arzt-regensburg` |
| 13 | 0.279 | 0.278 | 0.738 | `/kosten-ki-telefonassistent` ↔ `/praxen` |
| 14 | 0.270 | 0.148 | 0.711 | `/bayreuth/landingpage` ↔ `/regensburg/landingpage` |
| 15 | 0.264 | 0.230 | 0.583 | `/muenchen/ki-telefonassistent` ↔ `/regensburg/ki-telefonassistent` |
| 16 | 0.248 | 0.215 | 0.532 | `/bayreuth/ki-telefonassistent` ↔ `/muenchen/ki-telefonassistent` |
| 17 | 0.221 | 0.143 | 0.601 | `/bayreuth/lokales-seo` ↔ `/regensburg/lokales-seo` |
| 18 | 0.213 | 0.212 | 0.672 | `/ki-telefonassistent` ↔ `/kosten-ki-telefonassistent` |
| 19 | 0.200 | 0.127 | 0.610 | `/muenchen/webdesign-kosten` ↔ `/regensburg/webdesign-kosten` |
| 20 | 0.198 | 0.197 | 0.624 | `/ki-telefonassistent-praxis` ↔ `/praxen` |

**Reading these numbers honestly.** Literal duplication is *lower* than a typical programmatic
city build: only the Immobilien triple and the city hubs approach near-duplicate territory, and
most city triples sit at 0.10–0.20 city-normalised Jaccard. Someone rewrote the paragraphs per
city. That lowers the risk of a classic duplicate-content filter. It does **not** answer the
people-first question, because the rewriting is paraphrase of the same empty statement, not new
information — the TF-IDF cosine of 0.5–0.86 inside every triple and the skeleton overlap show
the pages still say the same thing in the same order (see §3).

---

## 3 · Findings

### F1 · The geo layer is a doorway-pattern risk, not because it is duplicated but because nothing in it is local

- **FACT.** 39 of 86 indexable URLs (45 %) are geo-modified. Cogniiq has one address
  (`Am Main 3, 95444 Bayreuth`, `/impressum`), was founded on 2025-10-15
  (`src/lib/seo-data.ts`, emitted as `foundingDate` on every page) and names no customer in any
  city. The München and Regensburg pages nevertheless assert local market knowledge.
- **EVIDENCE.**
  - `/muenchen` hero: "Vor Ort in München und remote · drei Leistungen · ein Ansprechpartner".
    `/regensburg`: "Vor Ort in Regensburg und remote". Neither city has an address anywhere on the site.
  - `/muenchen/webdesign`, FAQ answer (JSON-LD only): "Habt ihr Erfahrung mit dem Münchner
    Premium-Segment? — Ja. Ton, Ästhetik und technisches Niveau werden auf das Premiumsegment
    angepasst". The answer asserts experience and then describes an intention.
  - `/bayreuth/webdesign`: "Habt ihr Erfahrung mit dem Bayreuth-Markt? — Ja. Wir kennen die
    lokale Wettbewerbssituation in Bayreuth und Oberfranken".
  - `/regensburg/webdesign`: "Als Webdesign-Agentur mit Bayern-Verwurzelung verstehen wir die
    Anforderungen des Regensburger Markts: die Mischung aus Tourismus, Universitätspublikum,
    internationalem Mittelstand und der historischen Altstadt als Markenidentität der Stadt."
    Every local fact on the Regensburg pages (Altstadt, Dom, Uniklinikum, tourism) is
    encyclopaedia-level; none requires having worked there.
  - `/regensburg/website-relaunch`: "Das Regensburger Stadtbild hat sich digital
    weiterentwickelt" — a sentence that means nothing.
  - `/muenchen/website-relaunch`: "In München gelten höhere Schwellenwerte als in anderen
    Städten." and "Ladezeit über 3s: direkter Ranking-Malus im Münchner Hochkompetitionsmarkt" —
    presented as fact; Google has no city-specific thresholds.
  - Visible copy that names the queries it was written for: `/bayreuth/webdesign` — "gezielt für
    Suchanfragen wie 'Webdesign Agentur Bayreuth', 'Website erstellen Bayreuth'";
    `/webdesign-immobilien-regensburg` — "On-Page SEO für 'Immobilienmakler Regensburg'".
  - Find-and-replace residue: the FAQ question "Was liefert Cogniiq zum Datenschutz einer
    Makler-Website in Regensburg erstellen?" (ungrammatical, identical on the Bayreuth page with
    the city swapped).
- **HYPOTHESIS.** A quality rater or a site-level quality system reading these 39 pages would
  classify most of the non-Bayreuth ones as pages "created to rank for specific, similar search
  queries" that funnel to one contact form — the definition of doorway pages in Google's spam
  policies — and the weight of that layer (45 % of URLs) depresses the evaluation of the fourteen
  genuinely good pages.
- **ALTERNATIVE EXPLANATION.** The domain is 13 months old with (per the repo docs) 9 clicks in
  28 days; weak performance is fully explainable by age and missing external authority alone.
  Google also tolerates service-area pages from real regional providers, and Bayreuth →
  Regensburg (~130 km) / München (~230 km) is a plausible service area. The geo layer may simply
  be ignored rather than held against the site.
- **CONFIDENCE.** High that the pages contain no first-hand local information (measured and
  read). Low-to-medium that they cause a site-level demotion — that is not observable from here.
- **WHAT WOULD FALSIFY THIS.** A GSC query×page export showing that non-Bayreuth geo pages earn
  impressions *and clicks* on their own local queries at competitive positions (e.g.
  `/regensburg/website-relaunch` genuinely holding pos. ≤ 10 with clicks); or a named customer
  per city. Either would make the affected page a legitimate local landing page.
- **RECOMMENDED ACTION.** Keep the Bayreuth set (real location) and the one Regensburg page with
  documented demand (`/regensburg/website-relaunch`, plus its parent `/regensburg/webdesign`);
  fold the micro pages into their `/{stadt}/webdesign` parent; retire or noindex the München set
  unless a München customer or office exists. Decide per URL with query×page data, not in bulk.
  Remove every "Ja, wir haben Erfahrung mit …" answer that no project backs. Build no further
  city or industry×city pages (the repo's own `authority-acquisition-plan.md` already says so).

### F2 · Industry × city pages: nine URLs, three texts, zero real projects

- **FACT.** The nine `/webdesign-{arzt|gastronomie|immobilien}-{stadt}` pages share on average
  59 % of their text with a sibling. The Immobilien triple is the closest thing to duplicate
  content on the site (city-norm. Jaccard 0.44–0.53, cosine 0.80–0.86, heading skeleton 0.83;
  estimated unique text 248–351 words per ~1,000-word page).
- **EVIDENCE.** All nine carry an H1 that sells three services at once ("Webdesign &
  KI-Telefonassistent für Immobilienmakler in Regensburg") under a title that names one
  ("Webdesign für Immobilienmakler in Regensburg | Leads gewinnen"). Their "proof" section is
  explicitly hypothetical: "Beispielszenario aus dem Bereich Immobilien – so könnte ein typisches
  Projekt ablaufen. … Angenommen, ein Immobilienmakler in Regensburg erhält täglich mehrere
  Anfragen". Three priced-looking packages ("Start / Growth / Premium") are listed with identical
  bullet points across cities. Section header: "Was sich konkret verändert — Messbare Unterschiede
  für Immobilien-Betriebe – nach dem ersten Live-System", followed by unmeasured promises.
- **HYPOTHESIS.** These are the pages most exposed to the scaled-content-abuse and doorway
  policies: many URLs, one template, keyword-swapped, no unique value per URL.
- **ALTERNATIVE EXPLANATION.** Labelling the scenario as hypothetical is honest and may be read
  as acceptable illustrative content; with almost no impressions these pages may be irrelevant
  to Google either way.
- **CONFIDENCE.** High on the measurement; medium on the policy reading.
- **WHAT WOULD FALSIFY THIS.** Query×page data showing distinct, converting queries per city
  variant; or one real, consented project per page.
- **RECOMMENDED ACTION.** Consolidate each triple into its national industry page
  (`/webdesign-immobilien`, `/webdesign-gastronomie`, `/webdesign-arzt`) by 301. Exception:
  `/webdesign-arzt-bayreuth` (1,677 words, 79 % unique, HQ city) can stay if it gets a real
  practice reference.

### F3 · 395 FAQ answers exist only in structured data — the pages are thinner than they look

- **FACT.** On 45 indexable pages the `FAQPage` JSON-LD contains answers that are absent from the
  delivered HTML: 395 answers, 10,691 words. The visible page shows the questions only.
- **EVIDENCE.** `/faq` delivers 104 words of main text: eight questions as buttons, zero answers.
  `src/components/NationalIndustryPage.tsx` lines 119–136 mount the answer only when
  `open === true`; `src/components/FAQSection.tsx` and the Radix accordions in
  `CityServicePage.tsx` / `IndustryPage.tsx` behave the same. Every accordion in the prerender has
  `aria-expanded="false"` (18 of 18 on `/faq`). 19 pages built on newer components
  (`/kosten-ki-telefonassistent`, `/prozessautomatisierung`, `/webdesign`, `/praxen`, blog) render
  all their answers; 4 render some (`/ki-telefonassistent` 3 of 13, the three city phone pages 1–2 of 10–11).
- **HYPOTHESIS.** Googlebot renders but does not click; for it, these answers do not exist as
  page content. Two consequences: (a) the affected pages are valued on 400–650 words of
  template text, not on the answers that contain most of their specific information; (b) FAQ
  markup describing content that is not visible on the page conflicts with Google's structured
  data guidelines for `FAQPage`.
- **ALTERNATIVE EXPLANATION.** Google may read the JSON-LD text for understanding regardless,
  and FAQ rich results are no longer shown for commercial sites, so the practical penalty may be
  nil. The answers are reachable by a user click, which is the accepted pattern *if* the text is
  in the DOM.
- **CONFIDENCE.** High for the delivered HTML (measured on all 86 pages). Medium-high for the
  rendered DOM (from reading the components, not from a headless render).
- **WHAT WOULD FALSIFY THIS.** A URL Inspection "View crawled page → HTML" for `/faq` or
  `/regensburg/website-relaunch` that contains an answer sentence.
- **RECOMMENDED ACTION.** Render every answer into the HTML (collapsed with CSS / `hidden` until
  opened, or `forceMount`). This is the cheapest content gain on the site: +10.7k words of
  already-written, mostly specific text on 45 pages, and it removes a structured-data mismatch.
  Before doing it, purge the unsupported answers listed in F1/F5 — otherwise the fix publishes them.

### F4 · Generic prose with nothing only Cogniiq could have written

- **FACT.** Outside the fourteen long pages, the copy describes categories ("Hotels", "Praxen",
  "Münchner Startups") rather than cases. The whole indexable site contains 0 screenshots,
  0 recordings, 0 named customers, 0 measured outcomes; 24 pages contain explicitly hypothetical
  scenarios (70 occurrences of "Beispielszenario / Angenommen / so könnte").
- **EVIDENCE.**
  - `/webdesign-hotel` (the domain's largest impression source per `FINAL_KEYWORD_OWNERSHIP.md`:
    1,184 impressions, pos. 17.7, 0 clicks): "Die allgemeine Webagentur kennt die Buchungsstrecke
    nicht … Wer Belegungskalender, Ratenlogik, Mindestaufenthalt, Stornofristen und die Übergabe
    an das Buchungssystem nicht kennt, baut eine Broschüre". The page then names no booking
    engine ("Welches Buchungssystem passt, richtet sich nach Ihrer Größe"), no hotel and no
    result. Its hero chips read "Keine Gesprächsaufzeichnung · Übergabe in zwei Wochen" — phone
    assistant chips on a webdesign page.
  - `/deutschland`: "Nordrhein-Westfalen — Größtes Bundesland mit der höchsten
    Unternehmensdichte in Deutschland." A list of federal states on an agency page.
  - `/ki-agentur-deutschland`: "Drei Kernbereiche, die sofortigen ROI erzeugen."
  - `/ueber-uns`: both founder biographies are the same paragraph with the names swapped
    ("Gründer von Cogniiq. Arbeitet gemeinsam mit Djordje Popovic an …" / "… mit Lazar Popovic an
    …") and the same four "Schwerpunkte". No background, no year, no prior work.
  - Blog: all ten articles carry `datePublished` 2026-03-16, the author in `Article` JSON-LD is
    the Organization, there is no byline, and the worked example in
    `/blog/prozessautomatisierung-roi` is introduced as "Ein frei erfundenes Rechenbeispiel".
    `/blog/ki-automatisierung-kleine-unternehmen` is titled "Der komplette Leitfaden" at 661 words.
- **HYPOTHESIS.** Measured against "Does the content provide original information, reporting,
  research or analysis?" and "Does it demonstrate first-hand expertise?", roughly three quarters
  of the URLs fail; the content is interchangeable with any other agency's.
- **ALTERNATIVE EXPLANATION.** For a 13-month-old two-person firm the absence of case material
  is a fact of life, not a writing failure; the copy is deliberately honest about it (invented
  examples are labelled as invented). Honest-but-empty is still empty for a searcher, but it is
  not deceptive.
- **CONFIDENCE.** High.
- **WHAT WOULD FALSIFY THIS.** Any first-party artefact on these pages. See `07-authority-proof-gap.md`.
- **RECOMMENDED ACTION.** Stop adding text. Replace category prose with one real artefact per
  priority page (a recording, a redacted dashboard, a consented project, a measured number).

### F5 · Unsupported or internally contradictory claims still live

- **FACT.** The repo's honesty passes cleaned the priority pages; the legacy layer still carries
  claims with no evidence in the repository, some of them contradicting the cleaned pages.
- **EVIDENCE (all live on 2026-11-20).**

| Page | Claim | Why it is a problem |
|---|---|---|
| `/muenchen/website-relaunch` | Title "… Modernisierung ohne Rankingverlust"; hero chip "Kein Ranking-Verlust"; FAQ (JSON-LD): "Bei sorgfältiger SEO-Migration nicht. … Rankings werden erhalten und verbessert." | Outcome guarantee. `/regensburg/website-relaunch` says the opposite: "garantieren lässt sich das nicht". |
| `/muenchen/lokales-seo` | H1 "Google-Dominanz im härtesten Markt"; "Ziel: Top-3 Google Maps, erste Seite organisch"; "Erste Verbesserungen in 6–14 Wochen"; "ab ca. 1.000 €" | Ranking promises and prices with no source; sold by a domain that itself has no documented top-3 ranking. |
| `/{stadt}/webdesign-kosten` (3) | "Die meisten Webdesign-Projekte in Regensburg liegen zwischen 1.500 € und 8.000 €."; tiers up to "Marktführer-Setup 5.500 € – 12.000 €+" incl. "Dominanz-SEO Regensburg/Oberpfalz" | A market statistic the firm cannot have; contradicts `/kosten-webdesign`, which refuses to state ranges. Flagged as open owner decision W4 in `SEO_KEYWORD_MAP.md` — still open. |
| `/webdesign-hotel` | FAQ (JSON-LD): "Die Website amortisiert sich in der Regel innerhalb von 6–12 Monaten." | No hotel project documented. |
| `/keine-anfragen-website` | "Interessenten entscheiden innerhalb von 3 Sekunden, ob sie bleiben oder gehen." | Unsourced statistic. |
| `/ki-agentur-deutschland` | "zwei Bereichen, die sofort ROI erzeugen" | Unmeasured outcome claim; the flagship explicitly says no quota was measured. |
| `/faq` | "Wir bauen keine Websites – wir bauen Systeme." | Contradicts three webdesign clusters. |
| `/ki-telefonassistent/demo` | "Sehen Sie, wie der Assistent direkt einen Termin in den Kalender bucht." | The flagship makes calendar booking conditional on a verified interface. |
| `/ueber-uns`, `/bayern`, `/deutschland` | "Projekte deutschlandweit", "betreuen Projekte in Regensburg, München und ganz Bayern" | CLAIMED BUT UNVERIFIED — no project outside the Bayreuth region is documented in the repo. |

- **HYPOTHESIS.** Besides the legal exposure the repo already notes (PAngV/UWG), these claims
  undercut the one differentiator the good pages have — demonstrable restraint.
- **ALTERNATIVE EXPLANATION.** The owner may be able to substantiate some of them (real price
  range, real München client). Then they stop being problems — but nothing in the repo shows it.
- **CONFIDENCE.** High that the claims are live and unsourced in the repo.
- **WHAT WOULD FALSIFY THIS.** Owner-supplied evidence per row.
- **RECOMMENDED ACTION.** Apply the existing honesty standard to the legacy layer, starting with
  the München relaunch guarantee and the three city price tables.

### F6 · What is genuinely good — and should not be touched by any clean-up

- **FACT.** `/ki-telefonassistent` (5,072 words), `/kosten-ki-telefonassistent` (4,344),
  `/ki-telefonassistent-arzt`, `/ki-telefonassistent-zahnarztpraxis`,
  `/ki-telefonassistent-einfuehren`, `/prozessautomatisierung`, `/kosten-automatisierung`,
  `/webdesign`, `/kosten-webdesign` have near-zero literal overlap with each other outside the
  shared calculator and contain information a searcher cannot get from a generic agency page.
- **EVIDENCE.** Binding public prices ("300 € netto im Monat für 500 Minuten … 0,50 € netto …
  Einen Preisdeckel gibt es nicht … Einrichtung einmalig 990 € netto"); an interactive cost
  calculator; stated limits ("Wann wir nicht die richtige Lösung sind", "Was nicht automatisiert
  gehört"); explicit refusals to invent ("Gemessene Quoten. Keine Zufriedenheits-, Fehler- oder
  Umsatzquote – wir haben sie nicht erhoben und setzen sie nicht ein."); a buyer checklist
  ("Sechs Fragen, an denen sich ein KI-Telefonassistent entscheidet … stellen Sie sie jedem
  Anbieter, uns eingeschlossen").
- **HYPOTHESIS.** These pages meet the people-first bar on *transparency* and *usefulness* and
  fail it only on *demonstrated experience* — they describe a product nobody is shown using.
- **ALTERNATIVE EXPLANATION.** Length itself can be a weakness: 5,000 words with heavy internal
  repetition of the tariff clause (the string "0,50 €" occurs 7 times on the flagship and 9 times
  on `/praxen`) may read as padding.
- **CONFIDENCE.** High.
- **RECOMMENDED ACTION.** Protect these pages; give them evidence, not more words.

---

## 4 · Per-page classification

Classes: **KEEP** (no content action needed beyond proof) · **IMPROVE** (legitimate intent, weak
execution or missing evidence) · **CONSOLIDATION CANDIDATE** (intent already owned by a stronger
page; 301 once query×page data confirms no unique demand) · **NOINDEX CANDIDATE** (no defensible
unique intent or evidence; keep for navigation at most).

Every CONSOLIDATION / NOINDEX label is a *candidate*: `FINAL_KEYWORD_OWNERSHIP.md` rightly demands
query×page evidence before any 301. The labels say where to look first.

| URL | Family | Words | Shared 5-shingles (city-norm.) | Est. unique words | Nearest neighbour (Jaccard city-norm. / TF-IDF cos) | Class | Evidence |
|---|---|---:|---:|---:|---|---|---|
| `/blog` | core/service | 487 | 63 % | 181 | `/blog/ki-telefonassistent-restaurant` (0.07 / 0.31) | **KEEP** | functional/legal page, not a ranking asset |
| `/datenschutz` | core/service | 955 | 1 % | 950 | `/impressum` (0.01 / 0.13) | **KEEP** | functional/legal page, not a ranking asset |
| `/impressum` | core/service | 198 | 6 % | 186 | `/kontakt` (0.01 / 0.09) | **KEEP** | functional/legal page, not a ranking asset |
| `/ki-telefonassistent/demo` | core/service | 207 | 6 % | 194 | `/kontakt` (0.02 / 0.26) | **KEEP** | functional/legal page, not a ranking asset |
| `/kontakt` | core/service | 419 | 11 % | 375 | `/ki-telefonassistent/demo` (0.02 / 0.26) | **KEEP** | functional/legal page, not a ranking asset |
| `/ki-telefonassistent-arzt` | industry-telefon | 3523 | 37 % | 2227 | `/praxen` (0.14 / 0.60) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/ki-telefonassistent-zahnarztpraxis` | industry-telefon | 2429 | 27 % | 1777 | `/ki-telefonassistent-arzt` (0.10 / 0.61) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/kosten-automatisierung` | kosten | 1937 | 11 % | 1720 | `/prozessautomatisierung` (0.04 / 0.50) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/kosten-ki-telefonassistent` | kosten | 4344 | 57 % | 1850 | `/praxen` (0.28 / 0.74) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/kosten-webdesign` | kosten | 1292 | 8 % | 1193 | `/webdesign` (0.03 / 0.50) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/ki-telefonassistent` | pillar | 5072 | 42 % | 2932 | `/kosten-ki-telefonassistent` (0.21 / 0.67) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/ki-telefonassistent-einfuehren` | pillar | 2146 | 20 % | 1713 | `/ki-telefonassistent-zahnarztpraxis` (0.08 / 0.51) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/prozessautomatisierung` | pillar | 2925 | 8 % | 2688 | `/kosten-automatisierung` (0.04 / 0.50) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/webdesign` | pillar | 2389 | 4 % | 2283 | `/kosten-webdesign` (0.03 / 0.50) | **KEEP** | pillar/owner with real information gain (limits, pricing, calculator, method) |
| `/blog/ki-automatisierung-kleine-unternehmen` | blog | 661 | 18 % | 540 | `/blog` (0.06 / 0.34) | **IMPROVE** | generic listicle, no author, no first-hand material |
| `/blog/ki-telefonassistent-arztpraxis` | blog | 847 | 22 % | 657 | `/blog/verpasste-anrufe-kosten` (0.05 / 0.27) | **IMPROVE** | editorial support for Arzt page; slug + 5 headings still carry the head term |
| `/blog/lokales-seo-unternehmen` | blog | 678 | 18 % | 558 | `/blog/webdesign-konversion-tipps` (0.07 / 0.26) | **IMPROVE** | generic listicle, no author, no first-hand material |
| `/blog/prozessautomatisierung-roi` | blog | 948 | 12 % | 830 | `/blog/verpasste-anrufe-kosten` (0.05 / 0.26) | **IMPROVE** | editorial owner of ROI intent; org-as-author, invented example |
| `/blog/webdesign-agentur-auswahl` | blog | 582 | 20 % | 463 | `/blog/website-ohne-anfragen` (0.08 / 0.29) | **IMPROVE** | generic listicle, no author, no first-hand material |
| `/blog/webdesign-konversion-tipps` | blog | 635 | 18 % | 521 | `/blog/website-ohne-anfragen` (0.07 / 0.35) | **IMPROVE** | generic listicle, no author, no first-hand material |
| `/bayreuth` | city-hub | 137 | 55 % | 61 | `/muenchen` (0.40 / 0.70) | **IMPROVE** | only real location (HQ); hub is a 137-word link list |
| `/regensburg` | city-hub | 131 | 62 % | 49 | `/muenchen` (0.48 / 0.69) | **IMPROVE** | 131-word link list; "Vor Ort in Regensburg" without address |
| `/` | core/service | 1343 | 31 % | 926 | `/faq` (0.07 / 0.31) | **IMPROVE** | brand/entity page; no proof, generic claims |
| `/faq` | core/service | 104 | 92 % | 8 | `/` (0.07 / 0.31) | **IMPROVE** | 104 crawlable words; all 8 answers exist only in JSON-LD |
| `/leistungen` | core/service | 702 | 16 % | 592 | `/ueber-uns` (0.08 / 0.52) | **IMPROVE** | brand/entity page; no proof, generic claims |
| `/ueber-uns` | core/service | 620 | 18 % | 507 | `/leistungen` (0.08 / 0.52) | **IMPROVE** | brand/entity page; no proof, generic claims |
| `/bayern` | geo-hub | 1375 | 15 % | 1172 | `/deutschland` (0.07 / 0.58) | **IMPROVE** | geo/agency hub; title-H1 mismatch; overlaps /ki-agentur-deutschland |
| `/automatisierung-arzt` | industry-automation | 618 | 23 % | 476 | `/automatisierung-restaurant` (0.12 / 0.37) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/automatisierung-immobilien` | industry-automation | 619 | 25 % | 464 | `/automatisierung-sport` (0.12 / 0.25) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/automatisierung-restaurant` | industry-automation | 610 | 24 % | 462 | `/automatisierung-sport` (0.13 / 0.26) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/automatisierung-sport` | industry-automation | 596 | 24 % | 453 | `/automatisierung-restaurant` (0.13 / 0.26) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/ki-telefonassistent-hotel` | industry-telefon | 869 | 24 % | 658 | `/ki-telefonassistent-restaurant` (0.12 / 0.42) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/ki-telefonassistent-praxis` | industry-telefon | 2319 | 59 % | 951 | `/praxen` (0.20 / 0.62) | **IMPROVE** | 59 % shared; H1 "Therapeuten & Praxen" still overlaps /praxen |
| `/ki-telefonassistent-restaurant` | industry-telefon | 913 | 21 % | 718 | `/ki-telefonassistent-hotel` (0.12 / 0.42) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/praxen` | industry-telefon | 4373 | 72 % | 1227 | `/kosten-ki-telefonassistent` (0.28 / 0.74) | **IMPROVE** | strong page but 72 % of 5-shingles shared with cost page/flagship modules; carries calculator + 35 euro figures |
| `/webdesign-arzt` | industry-webdesign | 647 | 23 % | 500 | `/webdesign-immobilien` (0.12 / 0.28) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/webdesign-gastronomie` | industry-webdesign | 641 | 23 % | 494 | `/webdesign-immobilien` (0.11 / 0.27) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/webdesign-hotel` | industry-webdesign | 775 | 18 % | 632 | `/webdesign-sport` (0.10 / 0.26) | **IMPROVE** | largest impression source of the domain, zero hotel proof, unsourced 6-12 month amortisation claim, phone-template chips |
| `/webdesign-immobilien` | industry-webdesign | 665 | 24 % | 509 | `/webdesign-sport` (0.12 / 0.25) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/webdesign-sport` | industry-webdesign | 686 | 23 % | 529 | `/webdesign-immobilien` (0.12 / 0.25) | **IMPROVE** | template industry page (~650-900 w), generic problem/solution prose, no industry proof |
| `/webdesign-arzt-bayreuth` | industry×city | 1677 | 22 % | 1317 | `/webdesign-arzt-regensburg` (0.12 / 0.58) | **IMPROVE** | most individual industry x city page (1,677 w, 79 % unique) in the HQ city |
| `/ki-agentur-deutschland` | pillar | 980 | 12 % | 867 | `/deutschland` (0.04 / 0.43) | **IMPROVE** | owner of "ki agentur"; "sofort ROI" claims, no proof |
| `/keine-anfragen-website` | problem | 351 | 10 % | 317 | `/zu-viel-manuelle-arbeit` (0.05 / 0.14) | **IMPROVE** | thin problem page (345-351 w) |
| `/keine-terminbuchung-online` | problem | 359 | 14 % | 310 | `/verpasste-anrufe-verlust` (0.07 / 0.31) | **IMPROVE** | thin problem page (345-351 w) |
| `/verpasste-anrufe-verlust` | problem | 419 | 16 % | 353 | `/keine-terminbuchung-online` (0.07 / 0.31) | **IMPROVE** | problem page with ranking signal (docs: pos. 11.2) but 419 words |
| `/bayern/ki-telefonassistent` | service×city | 779 | 7 % | 725 | `/regensburg/ki-telefonassistent` (0.01 / 0.30) | **IMPROVE** | regional variant, 93 % unique text; natural merge target for city phone pages |
| `/bayreuth/automatisierung` | service×city | 1268 | 22 % | 986 | `/regensburg/automatisierung` (0.12 / 0.48) | **IMPROVE** | HQ city; individually written but unsupported local-expertise claims |
| `/bayreuth/ki-telefonassistent` | service×city | 1820 | 49 % | 935 | `/regensburg/ki-telefonassistent` (0.29 / 0.68) | **IMPROVE** | HQ city; individually written but unsupported local-expertise claims |
| `/bayreuth/webdesign` | service×city | 1298 | 24 % | 983 | `/regensburg/webdesign` (0.12 / 0.51) | **IMPROVE** | HQ city; individually written but unsupported local-expertise claims |
| `/bayreuth/website-relaunch` | service×city | 552 | 31 % | 382 | `/regensburg/website-relaunch` (0.17 / 0.63) | **IMPROVE** | HQ city; individually written but unsupported local-expertise claims |
| `/regensburg/webdesign` | service×city | 1265 | 27 % | 919 | `/muenchen/webdesign` (0.14 / 0.48) | **IMPROVE** | only non-HQ local page with demand evidence (docs: 331 impr., pos. 10.9); no Regensburg proof |
| `/regensburg/website-relaunch` | service×city | 520 | 33 % | 349 | `/bayreuth/website-relaunch` (0.17 / 0.63) | **IMPROVE** | only non-HQ local page with demand evidence (docs: 331 impr., pos. 10.9); no Regensburg proof |
| `/blog/ki-telefonassistent-restaurant` | blog | 510 | 24 % | 385 | `/blog/verpasste-anrufe-kosten` (0.09 / 0.28) | **CONSOLIDATION CANDIDATE** | blog twin of a commercial/problem page with the same head term |
| `/blog/verpasste-anrufe-kosten` | blog | 493 | 26 % | 364 | `/blog/ki-telefonassistent-restaurant` (0.09 / 0.28) | **CONSOLIDATION CANDIDATE** | blog twin of a commercial/problem page with the same head term |
| `/blog/website-ohne-anfragen` | blog | 565 | 22 % | 442 | `/blog/webdesign-agentur-auswahl` (0.08 / 0.29) | **CONSOLIDATION CANDIDATE** | blog twin of a commercial/problem page with the same head term |
| `/webdesign-arzt-muenchen` | industry×city | 742 | 60 % | 293 | `/webdesign-arzt-regensburg` (0.29 / 0.65) | **CONSOLIDATION CANDIDATE** | industry x city; Muenchen 61 % / Regensburg 55 % shared |
| `/webdesign-arzt-regensburg` | industry×city | 1109 | 55 % | 504 | `/webdesign-arzt-muenchen` (0.29 / 0.65) | **CONSOLIDATION CANDIDATE** | industry x city; Muenchen 61 % / Regensburg 55 % shared |
| `/webdesign-gastronomie-bayreuth` | industry×city | 1024 | 55 % | 460 | `/webdesign-gastronomie-muenchen` (0.33 / 0.72) | **CONSOLIDATION CANDIDATE** | industry x city template (city-norm. Jaccard 0.32-0.39, cosine 0.68-0.72) |
| `/webdesign-gastronomie-muenchen` | industry×city | 1013 | 63 % | 379 | `/webdesign-gastronomie-regensburg` (0.39 / 0.72) | **CONSOLIDATION CANDIDATE** | industry x city template (city-norm. Jaccard 0.32-0.39, cosine 0.68-0.72) |
| `/webdesign-gastronomie-regensburg` | industry×city | 1008 | 61 % | 389 | `/webdesign-gastronomie-muenchen` (0.39 / 0.72) | **CONSOLIDATION CANDIDATE** | industry x city template (city-norm. Jaccard 0.32-0.39, cosine 0.68-0.72) |
| `/webdesign-immobilien-bayreuth` | industry×city | 1005 | 75 % | 248 | `/webdesign-immobilien-regensburg` (0.53 / 0.86) | **CONSOLIDATION CANDIDATE** | industry x city near-duplicates (city-norm. Jaccard 0.44-0.53, cosine 0.80-0.86, H2/H3 skeleton 0.83); hypothetical scenarios only |
| `/webdesign-immobilien-muenchen` | industry×city | 1042 | 66 % | 351 | `/webdesign-immobilien-regensburg` (0.45 / 0.80) | **CONSOLIDATION CANDIDATE** | industry x city near-duplicates (city-norm. Jaccard 0.44-0.53, cosine 0.80-0.86, H2/H3 skeleton 0.83); hypothetical scenarios only |
| `/webdesign-immobilien-regensburg` | industry×city | 1048 | 76 % | 248 | `/webdesign-immobilien-bayreuth` (0.53 / 0.86) | **CONSOLIDATION CANDIDATE** | industry x city near-duplicates (city-norm. Jaccard 0.44-0.53, cosine 0.80-0.86, H2/H3 skeleton 0.83); hypothetical scenarios only |
| `/digitale-automatisierung-unternehmen` | problem | 307 | 14 % | 265 | `/zu-viel-manuelle-arbeit` (0.06 / 0.23) | **CONSOLIDATION CANDIDATE** | two ~300-word problem pages on the same intent as /prozessautomatisierung |
| `/zu-viel-manuelle-arbeit` | problem | 302 | 14 % | 259 | `/digitale-automatisierung-unternehmen` (0.06 / 0.23) | **CONSOLIDATION CANDIDATE** | two ~300-word problem pages on the same intent as /prozessautomatisierung |
| `/bayreuth/landingpage` | service×city | 449 | 42 % | 259 | `/regensburg/landingpage` (0.27 / 0.71) | **CONSOLIDATION CANDIDATE** | same intent as /{city}/webdesign (whose title already says "Website erstellen & SEO"); 400-540 w |
| `/bayreuth/lokales-seo` | service×city | 523 | 38 % | 326 | `/regensburg/lokales-seo` (0.22 / 0.60) | **CONSOLIDATION CANDIDATE** | same intent as /{city}/webdesign (whose title already says "Website erstellen & SEO"); 400-540 w |
| `/bayreuth/webdesign-kosten` | service×city | 683 | 59 % | 278 | `/regensburg/webdesign-kosten` (0.41 / 0.77) | **CONSOLIDATION CANDIDATE** | unverified local price tables contradict /kosten-webdesign; 35-61 % template-shared |
| `/bayreuth/website-erstellen` | service×city | 539 | 33 % | 360 | `/regensburg/website-erstellen` (0.18 / 0.56) | **CONSOLIDATION CANDIDATE** | same intent as /{city}/webdesign (whose title already says "Website erstellen & SEO"); 400-540 w |
| `/muenchen/automatisierung` | service×city | 1155 | 25 % | 866 | `/regensburg/automatisierung` (0.13 / 0.41) | **CONSOLIDATION CANDIDATE** | no office/customer in city; generic local colour |
| `/muenchen/ki-telefonassistent` | service×city | 1648 | 45 % | 900 | `/regensburg/ki-telefonassistent` (0.26 / 0.58) | **CONSOLIDATION CANDIDATE** | location modifier on a remote product; 45-50 % shared; no office/customer in city |
| `/muenchen/webdesign` | service×city | 1228 | 29 % | 871 | `/regensburg/webdesign` (0.14 / 0.48) | **CONSOLIDATION CANDIDATE** | no office/customer in city; generic local colour |
| `/muenchen/webdesign-kosten` | service×city | 682 | 35 % | 441 | `/regensburg/webdesign-kosten` (0.20 / 0.61) | **CONSOLIDATION CANDIDATE** | unverified local price tables contradict /kosten-webdesign; 35-61 % template-shared |
| `/muenchen/website-relaunch` | service×city | 555 | 26 % | 413 | `/regensburg/website-relaunch` (0.13 / 0.50) | **CONSOLIDATION CANDIDATE** | no office/customer in city; generic local colour |
| `/regensburg/automatisierung` | service×city | 1094 | 26 % | 807 | `/muenchen/automatisierung` (0.13 / 0.41) | **CONSOLIDATION CANDIDATE** | no office/customer in city; generic local colour |
| `/regensburg/ki-telefonassistent` | service×city | 1727 | 50 % | 869 | `/bayreuth/ki-telefonassistent` (0.29 / 0.68) | **CONSOLIDATION CANDIDATE** | location modifier on a remote product; 45-50 % shared; no office/customer in city |
| `/regensburg/landingpage` | service×city | 420 | 48 % | 219 | `/bayreuth/landingpage` (0.27 / 0.71) | **CONSOLIDATION CANDIDATE** | same intent as /{city}/webdesign (whose title already says "Website erstellen & SEO"); 400-540 w |
| `/regensburg/lokales-seo` | service×city | 469 | 42 % | 271 | `/bayreuth/lokales-seo` (0.22 / 0.60) | **CONSOLIDATION CANDIDATE** | same intent as /{city}/webdesign (whose title already says "Website erstellen & SEO"); 400-540 w |
| `/regensburg/webdesign-kosten` | service×city | 653 | 61 % | 254 | `/bayreuth/webdesign-kosten` (0.41 / 0.77) | **CONSOLIDATION CANDIDATE** | unverified local price tables contradict /kosten-webdesign; 35-61 % template-shared |
| `/regensburg/website-erstellen` | service×city | 523 | 37 % | 332 | `/bayreuth/website-erstellen` (0.18 / 0.56) | **CONSOLIDATION CANDIDATE** | same intent as /{city}/webdesign (whose title already says "Website erstellen & SEO"); 400-540 w |
| `/blog/digitalisierung-mittelstand` | blog | 587 | 16 % | 493 | `/blog/ki-automatisierung-kleine-unternehmen` (0.05 / 0.32) | **NOINDEX CANDIDATE** | generic off-priority article, no author/first-hand content |
| `/muenchen` | city-hub | 109 | 75 % | 28 | `/regensburg` (0.48 / 0.69) | **NOINDEX CANDIDATE** | 109-word link list, 75 % template-shared, claims "Vor Ort in Muenchen" with no office |
| `/deutschland` | geo-hub | 1261 | 21 % | 997 | `/bayern` (0.07 / 0.58) | **NOINDEX CANDIDATE** | geo filler (federal-state list), same intent as /ki-agentur-deutschland |
| `/muenchen/landingpage` | service×city | 471 | 27 % | 346 | `/regensburg/landingpage` (0.15 / 0.52) | **NOINDEX CANDIDATE** | Muenchen micro pages: no presence, no demand evidence, guarantee-style claims |
| `/muenchen/lokales-seo` | service×city | 524 | 21 % | 416 | `/regensburg/lokales-seo` (0.10 / 0.52) | **NOINDEX CANDIDATE** | Muenchen micro pages: no presence, no demand evidence, guarantee-style claims |
| `/muenchen/website-erstellen` | service×city | 532 | 26 % | 394 | `/regensburg/website-erstellen` (0.11 / 0.42) | **NOINDEX CANDIDATE** | Muenchen micro pages: no presence, no demand evidence, guarantee-style claims |
---

## 5 · Site-level quality-signal estimate

| Class | Pages | Share of indexable URLs | Share of crawlable words |
|---|---:|---:|---:|
| KEEP | 14 | 16.3 % | 31.9 % |
| IMPROVE | 38 | 44.2 % | 38.8 % |
| CONSOLIDATION CANDIDATE | 28 | 32.6 % | 25.4 % |
| NOINDEX CANDIDATE | 6 | 7.0 % | 3.9 % |

Of the 14 KEEP pages, 5 are functional or legal pages. **Nine URLs — 10 % of the indexable site —
are content a searcher would be glad to have found.** 34 URLs (40 %) are candidates for removal
from the index in one form or another, and 38 (44 %) are legitimate intents executed as template
prose without evidence.

- **FACT.** By URL count the site is predominantly low-differentiation content; by word count
  the good pages weigh more (32 %) because they are long.
- **HYPOTHESIS.** If Google's site-level quality assessment is closer to a per-URL average than
  to a per-word average, the template layer is what the domain is being judged on.
- **ALTERNATIVE EXPLANATION.** At this domain's age and visibility, site-level quality
  classifiers may not be the binding constraint at all; missing external authority (unmeasured —
  see `07-authority-proof-gap.md`) and missing experience signals are equally sufficient
  explanations for position ~36 on average.
- **CONFIDENCE.** High on the classification counts (they follow from stated rules and measured
  numbers); low on the causal link to rankings.
- **WHAT WOULD FALSIFY THIS.** After consolidating/noindexing the ~34 candidates and fixing F3,
  no change in impressions or average position of the nine strong pages over two comparable
  28-day windows — that would indicate the template layer was neutral and authority is the constraint.
- **RECOMMENDED ACTION (ordered).**
  1. Fix F3 (render FAQ answers) *after* purging unsupported answers — pure gain, no URL risk.
  2. Remove the F5 claims (München relaunch guarantee, city price tables, "Dominanz", hotel amortisation).
  3. Pull a GSC query×page export; then decide the 28 consolidation and 6 noindex candidates per URL.
  4. Consolidate the industry×city triples and the city micro pages first (lowest demand evidence, highest similarity).
  5. Do not write new pages until at least one first-party artefact exists for the telephone assistant.

**What this audit cannot tell you.** Whether any of this currently suppresses rankings; whether
Google has indexed all 86 URLs; which page Google selects per query. Those need Search Console.
