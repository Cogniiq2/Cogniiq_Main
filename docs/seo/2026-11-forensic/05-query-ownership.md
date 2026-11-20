# 05 · Query ownership — rebuilt from live titles, H1s, headings and anchors

Audit date: 2026-11-20 · Rule under test: **one primary intent → one primary owner**
(`docs/seo/ARCHITEKTUR.md`). Source of truth for this file is the **live prerendered HTML** of all
89 manifest routes (86 indexable), not the ownership documents. Where the documents and the live
site disagree, §4 lists the difference.

## 0 · What this file can and cannot prove

- **No query×page Search Console data exists in the repository.** `FINAL_KEYWORD_OWNERSHIP.md`
  says so itself ("kein Query×Page"). Every statement below about two pages "competing" is
  therefore an **on-page overlap = risk indicator**. Nothing here asserts cannibalisation as a
  fact. A page pair is only cannibalising if Google alternates or splits URLs for the *same
  query* — that is visible in a query×page export and nowhere else.
- Impression and position figures quoted below are copied from `FINAL_KEYWORD_OWNERSHIP.md` /
  `SEO_KEYWORD_MAP.md` (28-day window 24.09.–21.10.2026, page aggregates). They were not
  re-measured.
- Method: for each intent a regular expression was matched against title, H1, meta description,
  H2/H3, body text and the anchor text of every internal link in `<main>` of all 86 indexable
  pages (script `scripts/intent.py` in the session scratch directory; nav/footer anchors counted
  separately). "Targets the intent" below means: phrase in **title or H1**, or ≥ 2 H2/H3, or ≥ 3
  matching inbound anchors.

### The standard confirmation export (referred to as **EXPORT-A** below)

Search Console → Performance → Search results, search type Web, country Germany, last 3 months
(and the previous 3 months for comparison), **dimensions Query + Page together** (API or Looker
Studio; the UI export does not combine them), no row limit, plus device as secondary dimension.
For each suspected case below the test is always the same three numbers per query:

1. number of distinct URLs with impressions for that query,
2. share of impressions on the intended owner,
3. whether the ranking URL changes between weeks (date × query × page).

A case is **confirmed** if a non-owner holds > 20 % of impressions for an owner query or the
ranking URL flips between weeks; **refuted** if the owner holds > 90 % and is stable.

Classification vocabulary: *clean ownership · intent overlap · probable cannibalisation (risk) ·
supporting page · obsolete · thin · search-engine-first*.

---

## 1 · Priority 1 — KI-Telefonassistent

### 1.1 `ki telefonassistent` (generic head)

| | |
|---|---|
| **Primary owner** | `/ki-telefonassistent` — title "KI Telefonassistent für Unternehmen – Anrufe erledigen \| Cogniiq", H1 "KI-Telefon­assistent für Unternehmen: Anrufe nicht nur annehmen. Anliegen erledigen.", 5,072 words, 30 matching in-content inbound anchors from 25 pages |
| Docs' signal | 272 impressions, pos. 39.6 |

Other pages with the head term in **title and H1**, unmodified by anything but a location:

| Page | Title / H1 | In-content inbound anchors containing the term | Class |
|---|---|---|---|
| `/bayreuth/ki-telefonassistent` | "KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme" / "KI Telefonassistent in Bayreuth" | **33 from 23 pages** | intent overlap · search-engine-first (location modifier on a remote product) |
| `/muenchen/ki-telefonassistent` | "KI Telefonassistent München – AI Rezeption & Telefonservice" / "KI Telefonassistent für Unternehmen in München" | **32 from 23 pages** | **probable cannibalisation (risk)** — the H1 is the flagship's H1 plus "in München" |
| `/regensburg/ki-telefonassistent` | "KI Telefonassistent Regensburg – …" / "KI Telefonassistent in Regensburg" | **32 from 23 pages** | intent overlap · search-engine-first |
| `/bayern/ki-telefonassistent` | "KI-Telefonassistent Bayern \| AI-Rezeptionistin für bayerische Unternehmen" / "KI Telefonassistent für Unternehmen in Bayern" | 5 from 5 | intent overlap |
| `/bayreuth`, `/muenchen`, `/regensburg` | "Cogniiq in {Stadt} – KI-Telefonassistent, Websites & Automatisierung" (title + H1) | 2 each | thin (109–137 words) |
| `/` | title "Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern"; H1 "Erreichbar, wenn niemand frei ist." (no keyword) | — | supporting (brand) |
| `/leistungen`, `/ki-telefonassistent/demo` | term in title only | — | supporting |
| 9 × `/webdesign-{branche}-{stadt}` | H1 "Webdesign **& KI-Telefonassistent** für … in {Stadt}" — term in H1, absent from title | 0 | intent overlap · search-engine-first (three services in one H1) |

- **FACT.** Each of the three city phone pages receives **more** exact-phrase in-content anchors
  (32–33) than the flagship (30). 22 indexable pages carry the head term in title *and* H1.
- **HYPOTHESIS.** Internal linking tells Google that four URLs are equally "the KI
  Telefonassistent page"; for the unmodified head query this dilutes the flagship. The Munich H1
  is the highest-risk single element.
- **ALTERNATIVE EXPLANATION.** Location-modified titles usually only surface for location-modified
  queries; Google may separate them cleanly and the anchors (mostly "KI-Telefonassistent
  {Stadt}") carry the modifier.
- **CONFIDENCE.** High on the on-page facts; low on any SERP effect.
- **WHAT WOULD FALSIFY / CONFIRM.** EXPORT-A filtered to query = `ki telefonassistent`,
  `telefonassistent`, `ki telefonassistent für unternehmen`: if any `/{stadt}/ki-telefonassistent`
  or `/bayern/ki-telefonassistent` URL holds impressions for these *unmodified* queries → risk
  confirmed. If they appear only for `… münchen|regensburg|bayreuth|bayern` → refuted.
- **RECOMMENDED ACTION.** Regardless of the export: change the Munich H1 so it no longer equals
  the flagship H1; drop "& KI-Telefonassistent" from the nine industry×city H1s. After the export:
  consolidate city phone pages without own-query demand into `/bayern/ki-telefonassistent` or the flagship.

### 1.2 `ki telefonassistent kosten / preise / was kostet`

| | |
|---|---|
| **Primary owner** | `/kosten-ki-telefonassistent` — title "Was kostet ein KI Telefonassistent? Preise \| Cogniiq", H1 "Was kostet ein KI Telefonassistent?", 4,344 words, 26 in-content inbound links from 14 pages; nav anchor "Preise" |
| Docs' signal | 299 impressions, pos. 19.1; "ki telefonassistent kosten" 143 / 19.2 — the best commercial position on the domain |

| Other page | What targets the intent | Class |
|---|---|---|
| `/ki-telefonassistent` | H2 "Was das bei Ihrem Anrufaufkommen kostet — und ob es sich rechnet", the full calculator, 28 euro figures, FAQ answers on price | intent overlap |
| `/praxen` | Calculator, **35 euro figures**, "990 €" × 5, "0,50 €" × 9; 39 % of its 8-word shingles are identical to the cost page (5-shingle Jaccard 0.28, cosine 0.74) | **probable cannibalisation (risk)** for practice-modified price queries |
| `/blog/verpasste-anrufe-kosten` | Title "Verpasste Anrufe Kosten berechnen \| KI-Telefonassistent" — "Kosten" + head term in one title | intent overlap (different object of "Kosten", same words) |
| `/{stadt}/ki-telefonassistent` (3) | Block "Alle Tarife und Kontingente … Laufzeit … 20 % Aufschlag" | supporting |
| `/ki-telefonassistent-arzt`, `-zahnarztpraxis`, `-praxis` | 1–4 euro figures, link to owner | supporting — clean |

- **FACT.** The owner is unambiguous in title/H1; no second page has the price phrase in title
  and H1. The overlap is in the body: three pages render the same calculator and tariff clauses.
- **EVIDENCE vs docs.** `FINAL_KEYWORD_OWNERSHIP.md` (Nachtrag 24.10.2026) states `/praxen`
  "trägt keine zweite Tarifkarten-Darstellung … mehr". Live, `/praxen` is still the page with the
  highest text overlap to the cost page on the whole site. `SEO_KEYWORD_MAP.md` §5 lists the
  flagship under "must not compete (no tariff table)"; the flagship carries the calculator and
  the full overage wording.
- **HYPOTHESIS.** Low real risk: the shared element is a tool, and the owner has the explicit
  title. The stated "price intent sits entirely on the cost page" is nevertheless not what the
  HTML shows.
- **ALTERNATIVE EXPLANATION.** Showing price on the product page is what buyers expect; the
  overlap may help conversions and be irrelevant to ranking.
- **CONFIDENCE.** High (facts) / low (effect).
- **CONFIRM / REFUTE.** EXPORT-A, queries containing `kosten|preis|kostet` + `telefonassistent`:
  share of impressions on `/kosten-ki-telefonassistent` vs `/ki-telefonassistent` vs `/praxen`.
- **RECOMMENDED ACTION.** None before the export. Correct the documents (§4).

### 1.3 `ki telefonassistent vergleich` — **NO OWNER**

- **FACT.** No indexable page has "Vergleich" in title or H1. The word occurs in three blog H3s
  ("Vergleich: Anmeldung und KI-Telefonassistent", "Vergleich: Ohne vs. mit
  KI-Telefonassistent", "Vergleich: Manuell vs. automatisiert") and 27 times in body text across
  18 pages, never as a provider comparison. `/ki-telefonassistent-vergleich` returns 404.
- **Docs.** Deliberately unoccupied ("not pursued — a vendor comparing itself",
  `SEO_KEYWORD_MAP.md`; "kein eigener Testsieger-Vergleich", `FINAL_EXTERNAL_AUTHORITY_PLAN.md`).
- **Class.** No owner — by decision. Closest partial coverage: `/kosten-ki-telefonassistent` H2
  "Wie KI-Telefonassistenten am Markt abgerechnet werden" (four billing models, no vendor names).
- **Assessment.** The decision is defensible: a self-authored "Vergleich" without disclosed
  method and verified third-party data would be exactly the low-trust page type this audit
  criticises elsewhere. The cost is that the SERP for this intent (per the docs' observation:
  comparison tables, criteria, test sites) is conceded entirely.
- **CONFIRM DEMAND.** EXPORT-A, queries containing `vergleich|test|beste|erfahrungen`: if
  impressions exist they land on a non-owner by definition — list which URL.

### 1.4 `ki telefonassistent anbieter` — **NO OWNER**

- **FACT.** No title or H1 contains "Anbieter". One H2 does: `/kosten-ki-telefonassistent` —
  "Welche Fragen Sie jedem Anbieter zum Preis stellen sollten". The flagship has the H2 "Sechs
  Fragen, an denen sich ein KI-Telefonassistent entscheidet" (body: "stellen Sie sie jedem
  Anbieter, uns eingeschlossen"). "Anbieter" occurs 66 times on 30 pages, 7–8 times each on the
  flagship and the cost page.
- **Docs.** `SEO_KEYWORD_MAP.md` lists "anbieter vergleichen" as a *secondary* term of the
  flagship. No document names an owner for "anbieter".
- **Class.** No explicit owner; de-facto split between flagship and cost page (intent overlap
  between the two "questions to ask a provider" sections, which also repeat one paragraph verbatim).
- **RECOMMENDED ACTION.** Decide it explicitly. The natural owner is the flagship's "Sechs
  Fragen" section (a buyer's checklist is legitimate first-party content); the cost page should
  keep only the price questions and link up. No new URL is needed.
- **CONFIRM.** EXPORT-A, queries containing `anbieter`: which of the two URLs is shown.

### 1.5 `ki telefonassistent arztpraxis / telefonassistent arzt`

| | |
|---|---|
| **Primary owner** | `/ki-telefonassistent-arzt` — title "KI-Telefonassistent Arztpraxis: Anrufe erledigen \| Cogniiq", H1 "KI-Telefonassistent für Arztpraxen: Anrufe erledigen, nicht notieren", 3,523 words, 13 matching inbound anchors from 13 pages |
| Docs' signal | 471 impressions, pos. 35.4, 0 clicks — the largest commercial query family of priority 1 |

| Other page | Targeting | Class |
|---|---|---|
| `/praxen` | Title "KI Telefonassistent für Praxen – Ihr Empfang", H1 "KI-Telefonassistent für Praxen: …"; nav anchor "Für Arzt- und Zahnarztpraxen"; in-content anchor "Der KI-Empfang für Arzt- und Zahnarztpraxen" | **probable cannibalisation (risk)** — "Praxis" ⊃ "Arztpraxis" for most searchers; the docs themselves record that practice queries landed on the Arzt page instead of `/praxen` |
| `/ki-telefonassistent-praxis` | Title "KI-Telefonassistent für Therapiepraxen", but H1 "KI Telefonassistent für Therapeuten **& Praxen**"; URL slug `-praxis` | intent overlap; docs: impressions fell from 514 (3 months) to 1 (28 days) → possibly already **obsolete** for this intent |
| `/ki-telefonassistent-zahnarztpraxis` | contains "arztpraxis" as substring of "Zahnarztpraxis" in title/H1 | supporting — distinct intent, clean |
| `/blog/ki-telefonassistent-arztpraxis` | Title/H1 retargeted ("Telefon in der Arztpraxis: …"), but slug unchanged, 5 H2/H3 still contain "KI-Telefonassistent", 5 inbound anchors match | supporting, residual overlap |
| `/ki-telefonassistent-einfuehren` | Title "KI-Telefonassistent in der Praxis einführen" | supporting (informational) |
| `/webdesign-arzt-{stadt}` (3) | H1 "Webdesign & KI-Telefonassistent für Arztpraxen in {Stadt}" / "Webdesign Arztpraxis Bayreuth & KI-Telefonassistent" | intent overlap · search-engine-first |
| `/automatisierung-arzt` | "Automatisierung für Arztpraxen" — different service | clean |

- **FACT.** Six URLs have "Telefonassistent" and a practice term together in title or H1; four
  more (three `/webdesign-arzt-*`, the blog) carry the combination in H1 or headings.
- **HYPOTHESIS.** This is the cluster where real cannibalisation is most likely, because the
  queries ("ki telefonassistent praxis" vs "… arztpraxis") are near-synonyms and two long,
  strong pages (`/praxen` 4,373 words, `/ki-telefonassistent-arzt` 3,523 words) each claim one.
- **ALTERNATIVE EXPLANATION.** Position ~35–56 on both pages can be entirely an authority
  problem; splitting or merging would then change nothing.
- **CONFIDENCE.** Medium that overlap exists in Google's eyes (the docs' own page-level history
  points that way); it remains unproven.
- **CONFIRM / REFUTE.** EXPORT-A for the nine queries of the family (`ki telefonassistent
  arztpraxis`, `telefonassistent arztpraxis`, `telefonassistent arzt`, `ki telefonassistent
  praxis`, `telefonassistent praxis`, `ki telefonassistent arzt`, `ki assistent arztpraxis`,
  `telefonassistent für arztpraxen`, `praxis telefonassistent`): per query, URLs shown and their
  impression share; plus date × page for `/ki-telefonassistent-praxis` to see when it dropped out.
- **RECOMMENDED ACTION.** After the export: either make `/praxen` a true router (short, three
  doors, no product chain) or merge it with the Arzt page. Independently: fix the Therapie H1
  ("… für Therapiepraxen", no "& Praxen"); remove "& KI-Telefonassistent" from the three
  `/webdesign-arzt-*` H1s.

### 1.6 `ki telefonassistent zahnarztpraxis`

| | |
|---|---|
| **Primary owner** | `/ki-telefonassistent-zahnarztpraxis` — title "KI-Telefonassistent in der Zahnarztpraxis: Anrufe und Grenzen", H1 "… welche Anrufe er übernimmt und welche nicht", 2,429 words |
| Others | `/praxen` (one H2/H3, meta description, 4 anchors — router mention); `/bayreuth/webdesign` (2 H3 "Arztpraxen & Zahnarztpraxen", webdesign context) |
| **Class** | **Clean ownership.** The cleanest intent on the site. |
| Docs' signal | 85 impressions, page pos. 8.9 (the docs correctly warn this is not a top-10 for the head query) |
| Confirm | EXPORT-A, queries containing `zahnarzt`: expect a single URL. |

### 1.7 Other phone intents (short)

| Intent | Owner | Also targeting | Class |
|---|---|---|---|
| `ki telefonassistent restaurant` | `/ki-telefonassistent-restaurant` (938 w) | `/blog/ki-telefonassistent-restaurant` — title "KI-Telefonassistent Restaurant \| Reservierungen automatisieren", H1 "KI-Telefonassistent für Restaurants: …" | **probable cannibalisation (risk)**: two URLs, same head term in title and H1 |
| `ki telefonassistent hotel` | `/ki-telefonassistent-hotel` (895 w) | `/muenchen/ki-telefonassistent` (2 H3 with "Hotel") | clean; template page |
| `verpasste anrufe (kosten)` | `/verpasste-anrufe-verlust` (419 w, 30 anchors from 21 pages; docs: pos. 11.2) | `/blog/verpasste-anrufe-kosten` — title "Verpasste Anrufe Kosten berechnen", H1 "Was verpasste Anrufe Ihr Unternehmen wirklich kosten" vs owner title "Verpasste Anrufe: Was sie Unternehmen wirklich kosten" | **probable cannibalisation (risk)**: near-identical titles |
| `ki telefonassistent einführen` | `/ki-telefonassistent-einfuehren` | — | clean |
| `ki telefonassistent demo / testen` | `/ki-telefonassistent/demo` (207 w, form) | `/kosten-ki-telefonassistent` H2 "Können Sie den Empfang vorher testen?" | thin owner; acceptable for a form page |
| `ki telefonassistent dsgvo` | none indexable (`/datenschutz-sicherheit` is noindex) | flagship H2 "Was Ihr Datenschutzbeauftragter wissen will" | **no owner** (by decision, blocked on source verification) |
| `ki telefonassistent praxissoftware / schnittstelle` | none indexable (`/integrationen` is noindex) | — | **no owner** (blocked on vendor verification) |

Confirm for the two risk rows: EXPORT-A with page filter = the blog URL; any impressions on
`restaurant` / `verpasste anrufe` head queries on the blog URL confirm the overlap.

---

## 2 · Priority 2 — Prozessautomatisierung

### 2.1 `prozessautomatisierung`

| | |
|---|---|
| **Primary owner** | `/prozessautomatisierung` — title "Prozessautomatisierung für Unternehmen \| Abläufe automatisieren – Cogniiq"; **H1 "Geschäftsprozesse automatisieren — mit Ausnahmen, die jemand sieht" (head term absent from H1)**; 2,925 words; 30 in-content inbound links from 21 pages, but the anchors are split: "Automatisierung" 9, "Prozessautomatisierung" 8, "Automatisierung Deutschland" 4, "Automatisierung für Unternehmen" 3, "Automatisierung Unternehmen" 3 |

| Other page | Targeting | Class |
|---|---|---|
| `/kosten-automatisierung` | Title **and H1** "Was kostet Prozessautomatisierung?" | supporting (cost intent) — but it is the only page with the exact head term in an H1 |
| `/bayreuth/automatisierung`, `/muenchen/automatisierung`, `/regensburg/automatisierung` | Titles "Prozessautomatisierung {Stadt} \| KI-Workflows für …"; H1 "Automatisierung für Unternehmen in {Stadt}" | intent overlap · search-engine-first |
| `/blog/prozessautomatisierung-roi` | Title + H1 with head term + ROI | supporting |
| `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen` | "Automatisierung" in H1, 300–307 words each | thin; overlap with each other and with the pillar's informational part |
| `/blog/ki-automatisierung-kleine-unternehmen`, `/blog/digitalisierung-mittelstand` | "KI-Automatisierung … Der komplette Leitfaden" (661 w) | thin · search-engine-first title |
| `/automatisierung-{arzt,immobilien,restaurant,sport}` | "Automatisierung für {Branche}" | clean segment intents |

- **FACT.** Five pages have "Prozessautomatisierung" in the title; the designated owner is the
  only one of the commercial ones whose H1 does not contain it. The 301 from
  `/automatisierung-unternehmen` is live and correct.
- **HYPOTHESIS.** Ownership is clear by links and depth; the missing H1 term is a small
  self-inflicted relevance gap, and the three city titles add noise.
- **ALTERNATIVE EXPLANATION.** Google rarely needs the exact term in the H1 when title, URL and
  anchors agree; the effect may be zero.
- **CONFIDENCE.** High (facts), low (effect).
- **CONFIRM.** EXPORT-A, query = `prozessautomatisierung`, `geschäftsprozesse automatisieren`,
  `prozesse automatisieren`: expect one URL. Any impressions on `/kosten-automatisierung` or a
  city URL for the unmodified head term confirm overlap.

### 2.2 `prozessautomatisierung agentur` — **NO EXPLICIT OWNER**

- **FACT.** The word "Agentur" does not occur once in the 2,925 words of
  `/prozessautomatisierung` (title, H1, headings, body: 0 matches). No indexable page has
  "Automatisierung" and "Agentur" together in title or H1. The agency page is
  `/ki-agentur-deutschland` (H1 "KI Agentur Deutschland – Telefonassistent & Automatisierung für
  Ihr Unternehmen").
- **Docs.** `SEO_KEYWORD_MAP.md` lists "agentur" as a secondary term of the pillar and records
  "pos. ~57 on '…agentur' (09/2026)" for it.
- **Class.** No owner on page. Whatever ranks at ~57 does so without the page using the word.
- **HYPOTHESIS.** The intent ("who can do this for me") is commercially the most valuable
  modifier in this cluster and is currently unaddressed by the page that is supposed to own it.
- **ALTERNATIVE EXPLANATION.** The query volume may be negligible; the documented figure is a
  single September snapshot.
- **CONFIRM.** EXPORT-A, queries containing `agentur` + (`automatisierung|prozess`): impressions,
  and whether they land on the pillar or on `/ki-agentur-deutschland`.
- **RECOMMENDED ACTION.** If demand exists: name the service provider role on the pillar (one
  honest sentence — "Cogniiq setzt als Agentur …" — and an H2), not a new URL.

### 2.3 `roi prozessautomatisierung`

| | |
|---|---|
| **Primary owner** | `/blog/prozessautomatisierung-roi` — title "Prozessautomatisierung ROI berechnen \| Formel, Amortisation, Kostenfallen", H1 "Prozessautomatisierung ROI: So messen Sie den echten Nutzen", 948 words; only page with ROI in title/H1 |
| Others | `/kosten-automatisierung` (calculator, "Wirtschaftlichkeit"; no ROI in title/H1); `/ki-agentur-deutschland` ("sofort ROI erzeugen" ×3 in body) |
| **Class** | **Clean ownership**, but by an article whose only worked example is introduced as "Ein frei erfundenes Rechenbeispiel", with the Organization as author and no in-content link from any pillar (inbound: 5 anchors from 3 pages, all blog/related-article modules). |
| Docs' signal | "frage-query pos. ~8 (09/2026)" |
| Risk | The interactive calculator — the stronger asset for this intent — lives on `/kosten-automatisierung`, not on the owner. |
| Confirm | EXPORT-A, queries containing `roi|amortis|lohnt`: URL split between the article and `/kosten-automatisierung`. |

### 2.4 `automatisierung kosten`

Owner `/kosten-automatisierung` (title + H1). `/muenchen/automatisierung` was flagged in the docs
(K7, "watch"); on the live page the phrase is not in title/H1. **Clean ownership.**

---

## 3 · Priority 3 — Webdesign, hotel, local

### 3.1 `ki agentur`

| | |
|---|---|
| **Primary owner** | `/ki-agentur-deutschland` — title "KI Agentur Deutschland \| AI-Systeme für Unternehmen", H1 "KI Agentur Deutschland – …", 980 words, 17 exact anchors from 15 pages |

| Other page | Targeting | Class |
|---|---|---|
| `/bayern` | **H1 "KI Agentur Bayern – Webdesign, KI-Telefonassistent & Automatisierung"**, but title "AI-Systeme & Webdesign für Unternehmen in Bayern"; 9 inbound anchors containing "KI Agentur" | intent overlap; title/H1 mismatch |
| `/kontakt` | Title "Kostenloses Erstgespräch vereinbaren – Cogniiq \| KI-Agentur Bayern" | search-engine-first title on a form page |
| `/ueber-uns` | Title "Über Uns \| KI-Agentur Bayreuth – Lazar & Djordje Popovic" | supporting (entity) |
| `/deutschland` | H1 "Webdesign, KI-Telefonassistent & Automatisierung in Deutschland"; body "Cogniiq ist eine spezialisierte KI-Agentur"; TF-IDF cosine to `/bayern` 0.58, nearest neighbour of `/ki-agentur-deutschland` (0.43) | **obsolete** — second national hub with no intent of its own |
| `/` | H2 "Ihre AI & Webdesign Agentur in Bayreuth" | supporting |

- **Assessment.** One national owner, one regional variant with a contradictory title, one
  redundant national hub. Risk indicator only.
- **CONFIRM.** EXPORT-A, queries containing `ki agentur|ai agentur|ki-agentur`: URL split across
  `/ki-agentur-deutschland`, `/bayern`, `/deutschland`, `/`.

### 3.2 `webdesign agentur` (national)

Owner `/webdesign` — title "Webdesign Agentur – Websites für Unternehmen", H1 "Webdesign für
Unternehmen: Websites mit einem klaren Auftrag", 2,389 words, 23 in-content
links from 20 pages ("Webdesign für Unternehmen" 11, "Webdesign Agentur" 9). Others with "Webdesign
Agentur" in title: `/bayreuth/webdesign` (+H1), `/regensburg/webdesign` (+H1), `/muenchen/webdesign`
(title), `/blog/webdesign-agentur-auswahl` (title + H1, informational). The 301 from
`/webdesign-agentur-deutschland` is live. **Class: clean at national level; the city pages are the
intended local variants.** Docs note 0–3 impressions for `/webdesign` and an open Google-canonical
check — that check (URL Inspection for `/webdesign`) is still the first thing to do.

### 3.3 `internetagentur hotel(s)` / `webdesign hotel` / `webdesign für hotels`

| | |
|---|---|
| **Primary owner** | `/webdesign-hotel` — title "Webdesign für Hotels \| Internetagentur für Hotellerie – Cogniiq", H1 "Webdesign für Hotels & Pensionen", 775 crawlable words (plus 345 words of FAQ answers that exist only in JSON-LD), 9 in-content anchors from 9 pages ("Webdesign für Hotels" 5, "Webdesign Hotel" 4); footer/nav anchor "Für Hotels" |
| Docs' signal | **1,184 impressions, pos. 17.7, 0 clicks — the largest impression source of the entire domain** |

| Other page | Targeting | Class |
|---|---|---|
| `/ki-telefonassistent-hotel` | "KI-Telefonassistent für Hotels" — different product | clean |
| `/regensburg/webdesign` | 2 H3 + 9 body mentions of Hotel/Hotellerie | supporting |
| `/webdesign-gastronomie` | sibling (Gastronomie) | clean |

- **FACT.** "Internetagentur" appears on exactly one page of the site: in the title, the meta
  description and three times in the body of `/webdesign-hotel`; not in its H1 and in **no**
  inbound anchor. Ownership is clean — there is no second hotel-webdesign URL.
- **The real problem is not ownership but fit.** The page is a 775-word template page
  (`NationalIndustryPage`) carrying phone-assistant chips ("Keine Gesprächsaufzeichnung"), naming
  no booking engine and no hotel, for a query family that is the domain's biggest visibility and
  the lowest of the three business priorities. `SEO_KEYWORD_MAP.md` instructs "leave it alone, do
  not feed it more links" — yet a sitewide footer link "Für Hotels" exists.
- **HYPOTHESIS.** 1,184 impressions at 0 clicks means the page is shown for hotel-agency queries
  and nobody picks it; whether that is position (17.7) or snippet/fit cannot be told without
  query-level data.
- **CONFIRM.** EXPORT-A with page = `/webdesign-hotel`: the query list with impressions,
  position and CTR per query. This single export decides whether the hotel demand is
  "internetagentur hotel" (agency-seeking, commercial) or informational/navigational noise.
- **RECOMMENDED ACTION.** Owner decision, not an SEO decision: either invest (one real hotel
  reference, named booking systems) or accept it as incidental. Do not create further hotel URLs.

### 3.4 `website relaunch regensburg` (and Bayreuth / München)

| | |
|---|---|
| **Primary owner** | `/regensburg/website-relaunch` — title "Website Relaunch Regensburg – Modernisierung & SEO-Migration", H1 "Website Relaunch in Regensburg", 520 crawlable words (154 more in JSON-LD-only FAQ answers), 7 in-content anchors from 7 pages, sitewide footer link "Website Relaunch" |
| Docs' signal | 331 impressions, pos. 10.9; two queries at pos. 5.8 — the only local page with documented page-1 visibility |

| Other page | Targeting | Class |
|---|---|---|
| `/regensburg/webdesign` | body mentions; links to owner | supporting — clean |
| `/webdesign` | 4 H2/H3 + 17 body mentions of "Relaunch" (national relaunch checklist) | supporting — different (non-local) intent |
| `/kosten-webdesign` | 2 H2/H3 | supporting |
| `/bayreuth/website-relaunch`, `/muenchen/website-relaunch` | own city | clean per city; Munich title promises "ohne Rankingverlust" |

**Class: clean ownership.** The owner is thin (520 words) and contains no Regensburg project; its
ranking is the strongest argument on the site that these pages can work — and the page that
would gain most from one real artefact. Confirm with EXPORT-A page filter (queries, clicks).

### 3.5 `webdesign regensburg` and the other city terms

| Intent | Owner (title / H1) | Other pages in the same city that target a neighbouring intent | Class |
|---|---|---|---|
| `webdesign regensburg` | `/regensburg/webdesign` — "Webdesign Agentur Regensburg – **Website erstellen & SEO**" / "Webdesign Agentur in Regensburg"; 42 exact anchors from 25 pages; docs: 310 impr., pos. 55 | `/regensburg/website-erstellen` (title/H1 "Website erstellen lassen in Regensburg"), `/regensburg/lokales-seo` ("Lokales SEO Regensburg"), `/regensburg/landingpage`, `/regensburg/webdesign-kosten`, `/webdesign-{arzt,gastronomie,immobilien}-regensburg` | **probable cannibalisation (risk)**: the owner's own title claims "Website erstellen & SEO", the intents of two sibling URLs |
| `webdesign bayreuth` | `/bayreuth/webdesign` — "Webdesign Agentur Bayreuth – Website erstellen & SEO" / "Webdesign Agentur in Bayreuth"; 45 anchors from 26 pages | same sibling set for Bayreuth; `/bayreuth/lokales-seo` is titled "**SEO Bayreuth** – Lokales SEO & Google-Sichtbarkeit" | same risk |
| `webdesign münchen` | `/muenchen/webdesign` — "Webdesign Agentur München – Website erstellen" / "Webdesign für Unternehmen in München"; 42 anchors from 25 pages | same sibling set; `/muenchen/webdesign-kosten` (docs: 268 impr., pos. 37) | same risk; additionally search-engine-first (no presence in München) |
| `webdesign kosten {stadt}` | `/{stadt}/webdesign-kosten` — "Webdesign Kosten in {Stadt} – Was kostet eine Website?" | national `/kosten-webdesign` — H1 "Was kostet eine Website?" — **the same question as the second half of each city H1** | intent overlap; and factual contradiction (city pages state euro ranges, the national page refuses to) |
| `website erstellen {stadt}` | `/{stadt}/website-erstellen` (523–539 w) | `/{stadt}/webdesign` (title), `/webdesign-arzt-{stadt}` (titles "… \| Praxis-Website erstellen") | **thin** · probable cannibalisation (risk) |
| `landingpage {stadt}` | `/{stadt}/landingpage` (420–471 w) | — | thin · search-engine-first |
| `lokales seo {stadt}` / `seo {stadt}` | `/{stadt}/lokales-seo` (469–524 w) | `/blog/lokales-seo-unternehmen` (national informational), `/{stadt}/webdesign` (title "& SEO" for Bayreuth, Regensburg) | thin · intent overlap |
| `{stadt}` hub | `/bayreuth`, `/muenchen`, `/regensburg` — identical title/H1 pattern, 109–137 words | — | thin |

- **FACT.** Per city there are 8 service URLs + 3 industry×city URLs + 1 hub = **12 URLs**, of
  which 5 (webdesign, website-erstellen, landingpage, website-relaunch, webdesign-kosten) answer
  variants of "someone to build my website in {Stadt}".
- **HYPOTHESIS.** For `webdesign {stadt}`, Google has up to five candidate URLs per city; position
  55 for `/regensburg/webdesign` despite 42 exact-match anchors is consistent with a split —
  and equally consistent with a new domain facing established local agencies.
- **CONFIDENCE.** Medium on overlap, low on effect.
- **CONFIRM / REFUTE.** EXPORT-A restricted to queries containing `regensburg` (then `bayreuth`,
  `münchen`): build a query × URL matrix. Overlap is confirmed where one query shows ≥ 2 of the
  sibling URLs. This is also the evidence the docs demand before merging the nine micro pages
  ("merge decision F4 needs the export").
- **RECOMMENDED ACTION.** Independently of the export: remove "Website erstellen & SEO" from the
  three `/{stadt}/webdesign` titles **or** merge the sibling pages into them — holding both is
  the contradiction. Note the docs' warning that `/regensburg/website-relaunch` and (formerly)
  `/muenchen/webdesign-kosten` were measurement routes; `PROTECTED_EXPERIMENT_PATHS` is empty in
  current code, so nothing is technically frozen any more.

### 3.6 `keine anfragen website`

Owner `/keine-anfragen-website` — title "Warum Ihre Website keine Anfragen bringt – und wie Sie das
ändern". `/blog/website-ohne-anfragen` — H1 "**Warum Ihre Website keine Anfragen bringt – und wie
Sie das ändern**". The blog H1 is character-for-character the problem page's title.
**Class: probable cannibalisation (risk)** — the clearest title-level duplicate on the site.
Confirm: EXPORT-A, queries containing `keine anfragen|website bringt`.

---

## 4 · Where the documents differ from the live site

| Document claim | Live / code reality (2026-11-20) |
|---|---|
| `ARCHITEKTUR.md` §1: 93 routes, 90 canonicals; `publicRoutePaths.ts` header comment: "all 88 routes" | 89 routes in `PUBLIC_ROUTE_PATHS`, 86 indexable, 86 sitemap URLs |
| `ARCHITEKTUR.md` §3.2: `/ki-telefonassistent-arzt` "**FROZEN**"; several routes "eingefroren" | `PROTECTED_EXPERIMENT_PATHS = []` in `src/lib/routing/protectedExperiments.ts`; six routes listed as graduated. Nothing is frozen. |
| `ARCHITEKTUR.md` §3.2: `/praxen` = "kommerzieller Eigentümer" / PILLAR (Segment) | `FINAL_KEYWORD_OWNERSHIP.md`: `/praxen` = "Hub / Router". Live page: 4,373 words with the full product chain and calculator — neither a router nor clearly distinct from the Arzt page. The two documents contradict each other and the page matches neither cleanly. |
| `ARCHITEKTUR.md`: `/ki-telefonassistent-zahnarztpraxis` role REDAKTION | `FINAL_KEYWORD_OWNERSHIP.md`: SEGMENT. Live: 2,429-word commercial-informational page. |
| `FINAL_KEYWORD_OWNERSHIP.md` Nachtrag 24.10.: `/praxen` carries no second tariff presentation; price intent "vollständig" on the cost page | `/praxen`: calculator rendered, 35 euro figures, highest text overlap with the cost page on the site (cosine 0.74) |
| `SEO_KEYWORD_MAP.md` §5: flagship "must not compete (no tariff table)" on price | Flagship: H2 on cost, calculator, 28 euro figures |
| `SEO_KEYWORD_MAP.md`: `/ki-telefonassistent-praxis` "RETARGETED … (Therapiepraxen)" | Title retargeted; H1 still "KI Telefonassistent für Therapeuten & Praxen" |
| `SEO_KEYWORD_MAP.md`: blog Arztpraxis "RETARGETED away from the Arzt head term" | Title/H1 yes; URL slug and five H2/H3 still carry the term |
| `SEO_KEYWORD_MAP.md`: `/prozessautomatisierung` secondary term "agentur" | The word "Agentur" is absent from the page |
| `SEO_KEYWORD_MAP.md`: `/webdesign-hotel` "do not feed it more links" | Sitewide nav/footer link "Für Hotels" + 9 in-content links |
| `SEO_KEYWORD_MAP.md`: `/verpasste-anrufe-verlust` "Body is 375 words" | 419 crawlable words (still thin) |
| Sitemap / canonical host | All canonicals and sitemap `<loc>` use `https://cogniiq.de/…`; the site answers 200 on `https://www.cogniiq.de/…` and its own 301s (`/referenzen`, `/automatisierung-unternehmen`) redirect to `www`. Not an ownership issue, but it means "the owner URL" exists under two hosts — flag for the technical audit. |
| Docs list `/referenzen`, `/bewertungen` in older inventories | Both 301 to `/ueber-uns`; no reference or review page exists |

---

## 5 · Summary table

| Intent | Owner | Verdict | Needs EXPORT-A filter |
|---|---|---|---|
| ki telefonassistent | `/ki-telefonassistent` | intent overlap with 4 geo pages (H1/anchors) — risk | unmodified head queries |
| … kosten / preise | `/kosten-ki-telefonassistent` | clean in title/H1; body overlap with flagship + `/praxen` | `kosten\|preis\|kostet` |
| … vergleich | **none** (by decision) | no owner | `vergleich\|test\|beste` |
| … anbieter | **none** (undecided) | no owner; split flagship/cost | `anbieter` |
| … arztpraxis | `/ki-telefonassistent-arzt` | probable cannibalisation risk with `/praxen`, `/ki-telefonassistent-praxis` | 9-query practice family |
| … zahnarztpraxis | `/ki-telefonassistent-zahnarztpraxis` | clean | `zahnarzt` |
| … restaurant | `/ki-telefonassistent-restaurant` | risk: blog twin | page = blog URL |
| verpasste anrufe | `/verpasste-anrufe-verlust` | risk: blog twin | `verpasste anrufe` |
| prozessautomatisierung | `/prozessautomatisierung` | clean by links; head term missing in H1; 3 city titles | head queries |
| prozessautomatisierung agentur | **none** | no owner (word absent from pillar) | `agentur` |
| roi prozessautomatisierung | `/blog/prozessautomatisierung-roi` | clean; weak owner | `roi\|amortis` |
| ki agentur | `/ki-agentur-deutschland` | overlap with `/bayern` H1, `/deutschland` | `ki agentur` |
| webdesign agentur | `/webdesign` | clean nationally | URL Inspection first |
| internetagentur hotel / webdesign hotel | `/webdesign-hotel` | clean; thin; off-priority; top impressions | page = `/webdesign-hotel` |
| website relaunch regensburg | `/regensburg/website-relaunch` | clean; thin | page filter |
| webdesign {stadt} | `/{stadt}/webdesign` | risk: up to 5 sibling URLs per city | `regensburg`, `bayreuth`, `münchen` |
| keine anfragen website | `/keine-anfragen-website` | risk: blog H1 = owner title | `keine anfragen` |

**Bottom line.** Title/H1 uniqueness — the thing the September architecture work fixed — holds:
there is no duplicate title or H1 on the site. What remains is one level down: (a) four intents
with **no owner** (vergleich, anbieter, prozessautomatisierung agentur, dsgvo/schnittstelle),
(b) blog twins of three commercial/problem pages, (c) the practice trio, and (d) per-city sibling
sets that subdivide one local intent into five URLs. None of (b)–(d) can be called cannibalisation
until EXPORT-A exists; all of them are where to look first when it does.
