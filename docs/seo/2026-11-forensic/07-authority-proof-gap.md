# 07 · Authority and proof gap — what the site can actually show

Audit date: 2026-11-20 · Sources: live prerendered HTML of all 89 public routes (fetched
2026-11-20), repository source, and the repo's own planning documents
(`FINAL_EXTERNAL_AUTHORITY_PLAN.md`, `docs/seo/authority-acquisition-plan.md`,
`SEO_EXTERNAL_ACTIONS.md`, `ASSETS-REQUIRED.md`, `OWNER-INPUT.md`, `HONESTY-AUDIT.md`).

Status vocabulary: **PRESENT** (on the live site, quoted) · **CLAIMED BUT UNVERIFIED** (the site
asserts it; nothing on the site or in the repo substantiates it) · **ABSENT**.

**What cannot be measured from here, stated once:** backlinks, referring domains, brand
mentions, Google Business Profile content and reviews, directory listings, and any Search Console
data. No backlink export exists in the repository; the documents themselves say "Es liegen keine
Backlink-Daten vor". Every statement about external authority below is therefore about *evidence
of work done*, never about the link profile itself. Nothing in this file is inferred proof; where
proof is missing it is marked missing.

---

## 1 · The baseline facts that frame everything

| Fact | Evidence |
|---|---|
| Sole proprietorship, one address | `/impressum`: "Cogniiq · Inhaber: Lazar Popovic · Am Main 3 · 95444 Bayreuth · Telefon: 0160 1832917 · USt-IdNr. DE460292419" |
| Founded 2025-10-15 — 13 months before this audit | `src/lib/seo-data.ts` (`foundingDate`, with the comment that the earlier published "2023" "had no supporting record"); emitted in Organization JSON-LD on every page |
| No public customer, anywhere | `/referenzen` and `/bewertungen` 301 to `/ueber-uns`; `TestimonialBlock.tsx`: "There is deliberately NO exported testimonial constant" |
| The one project the repo documents is **not** a telephone assistant | `ASSETS-REQUIRED.md` A3.1: removed case "SV Heinersreuth – Website + Buchungsautomatisierung" (sports club, Bayreuth region), withdrawn on 2026-08-16 for lack of written consent |
| No telephone-assistant deployment is documented in the repository | No customer, call volume, measurement or recording referenced in any doc; the flagship says: "Keine Zufriedenheits-, Fehler- oder Umsatzquote – wir haben sie nicht erhoben" |
| Zero media on the public site | 0 `<img>`, `<picture>`, `<audio>`, `<video>`, `<iframe>` in the delivered HTML of all 89 routes; `public/` holds only logo, favicon, OG image and `Lazar_Popovic.png` (used only on the non-public `ScanPage`) |
| No social or third-party profile linked | `BUSINESS_INFO.socialMedia` = three empty strings; no `sameAs` in any JSON-LD |

- **FACT.** The site's persuasive strength is transparency (prices, limits, method). Its
  evidence of *having done the work* is nil on the public site.
- **HYPOTHESIS.** For a YMYL-adjacent buyer (a medical practice handing over its phone line),
  and for Google's experience/trust signals, this is the binding constraint — more than text
  volume, architecture or on-page optimisation.
- **ALTERNATIVE EXPLANATION.** A missing link profile alone would produce the same rankings; the
  two gaps cannot be separated without backlink data and without a before/after once proof is
  published.
- **CONFIDENCE.** High on the inventory. Unknown on relative causal weight.
- **WHAT WOULD FALSIFY THIS.** Customer material that exists but simply is not in the repo or
  on the site (then the gap is publication, not substance); or a backlink export showing a
  normal profile for the niche.
- **RECOMMENDED ACTION.** §6 checklist.

---

## 2 · Proof inventory by commercial cluster

### 2.1 KI-Telefonassistent (business priority 1)

| Proof type | Status | Evidence |
|---|---|---|
| First-party experience (described from operation) | **ABSENT** | Copy is written from design intent ("Für jeden Anrufanlass legen Sie vor dem Start fest, was passiert"). No sentence reports something observed in a live deployment. |
| Original data | **ABSENT** — and honestly declared | `/ki-telefonassistent`: "wir nennen dafür keine Quote, die wir nicht gemessen haben"; calculator: "Die Startwerte sind ein Beispiel … kein Praxisdurchschnitt und keine Branchenstatistik." `ASSETS-REQUIRED.md` A5 (measured take-over rate): open. |
| Real call recording / audio demo | **ABSENT** | `StimmprobeSection` is mounted on the flagship, `/praxen`, city and industry pages and renders nothing (asset-gated, `ASSETS-REQUIRED.md` A1). No `<audio>` on any page; no `public/audio/`. |
| Public demo line (a number to call) | **ABSENT** | `/ki-telefonassistent/demo` is a contact form: "Wir melden uns in der Regel innerhalb von 24 Stunden … Live-Demo per Video". |
| Real screenshots (dashboard, hand-over, calendar entry) | **ABSENT** | 0 images site-wide; `ASSETS-REQUIRED.md` A2 open. |
| Methodology | **PRESENT** | `/ki-telefonassistent` — "So wird Ihr Empfang am Telefon gebaut" (Erstgespräch → Angebot → Vorgaben → Aufbau → Übergabe, Testphase, Go-live); `/ki-telefonassistent-einfuehren` (2,146 words, implementation guide). |
| Pricing transparency | **PRESENT — the strongest asset on the site** | `/kosten-ki-telefonassistent`: "300 € netto im Monat für 500 Minuten, 500 € netto im Monat für 1.000 Minuten, 800 € netto im Monat für 2.000 Minuten … Jede abrechenbare Minute über dem Kontingent kostet 0,50 € netto … Einen Preisdeckel gibt es nicht … Einrichtung einmalig 990 € netto … Laufzeit 12 Monate". |
| Calculator / decision tool | **PRESENT** | Cost calculator on `/kosten-ki-telefonassistent`, `/ki-telefonassistent`, `/praxen` ("sofort, ohne E-Mail und ohne Verkaufsgespräch"); buyer checklist "Sechs Fragen, an denen sich ein KI-Telefonassistent entscheidet". |
| Stated limitations | **PRESENT** | H2 "Wann wir nicht die richtige Lösung sind"; "Was unser Empfang nicht macht"; "Keine fachliche Beratung und keine Bewertung von Dringlichkeit"; "Die Testphase ist kein kostenloser Test." |
| Case studies | **ABSENT** | None. `ASSETS-REQUIRED.md` A3 / M22 "Referenz ❌ (bewusst)". |
| Named customers / outcomes | **ABSENT** | None. |
| Comparison data | **ABSENT** (partial, unsourced) | `/kosten-ki-telefonassistent` H2 "Wie KI-Telefonassistenten am Markt abgerechnet werden" describes four billing patterns without naming a provider or source. One sourced comparison value: "Das Tarifgehalt für Medizinische Fachangestellte beginnt 2026 bei 2.939,59 € monatlich" (source of the figure not linked on the page — **CLAIMED BUT UNVERIFIED** as rendered). |
| Implementation / integration evidence | **ABSENT** | `/integrationen` is noindex pending owner input; `OWNER-INPUT.md` B: "Keine fertige PVS-Standardanbindung". The flagship is honest about it ("Die Anbindung klären wir vor der Unterschrift"). |
| Technology disclosure (which voice/AI platform, sub-processors) | **ABSENT on the public pages** | No vendor is named in the delivered HTML of any indexable page ("ElevenLabs": 0 matches). `OWNER-INPUT.md` B11a names the speech service internally. A data-protection officer cannot verify "Ihre Daten werden nicht zum Training von Modellen verwendet" without it. |
| Compliance claims | **CLAIMED BUT UNVERIFIED** | "Gespräche werden nicht aufgezeichnet", "nicht zum Training von Modellen verwendet", "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO stellen wir jedem Kunden bereit", "gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen (Art. 50 KI-Verordnung)". No sample AVV, no sub-processor list, no document to download. `/datenschutz-sicherheit` remains noindex. |
| Service commitments | **CLAIMED BUT UNVERIFIED** | "Umgesetzt werden die Änderungen von Lazar Popovic persönlich, erreichbar täglich von 6 bis 20 Uhr"; "Die Zwei-Wochen-Garantie"; "Der Preis ist für 24 Monate schriftlich garantiert". Promises, not evidence — acceptable as offers, but nothing shows them kept. |
| Author identity on the pages | **PRESENT on 2 of 16 phone URLs** | `/ki-telefonassistent-zahnarztpraxis` and `/ki-telefonassistent-einfuehren` carry a responsibility block: "Wer für diesen Beitrag geradesteht — Lazar Popovic, Inhaber und Gründer von Cogniiq, 95444 Bayreuth. Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV … Wir schreiben hier aus der Sicht der technischen Ums[etzung]". It names a person and — notably — states the perspective honestly. No such block on the flagship, cost, Arzt or `/praxen` pages; no qualifications given. |

**Information gain verdict.** High on *terms of purchase* (genuinely better than most vendor
pages: uncapped overage stated openly, exit route, when-not-to-buy). Zero on *does it work*.

### 2.2 Prozessautomatisierung (business priority 2)

| Proof type | Status | Evidence |
|---|---|---|
| First-party experience | **ABSENT** | `/prozessautomatisierung` is a well-reasoned framework; no sentence is tied to a delivered project. |
| Original data | **ABSENT** | — |
| Screenshots / workflow diagrams of real builds | **ABSENT** | 0 images. |
| Methodology | **PRESENT** | `/prozessautomatisierung`: "Welche Prozesse sich eignen" (six criteria), "Was nicht automatisiert gehört" (six exclusions), "Was passiert, wenn etwas schiefgeht" (seven mechanisms), "Wie eine Umsetzung abläuft" (eleven steps), "Fünf Fragen je System, vor dem Angebot". |
| Pricing transparency | **PARTIAL** | `/kosten-automatisierung` (1,937 words): cost drivers and a calculator, no price list. City pages had invented prices removed (per `SEO_KEYWORD_MAP.md`). |
| Calculator / decision tool | **PRESENT** | `AutomatisierungRechner` on `/kosten-automatisierung`. |
| Stated limitations | **PRESENT** | "Der Abschnitt, den Anbieterseiten meistens weglassen." / "Trägt der realistisch reduzierbare Aufwand die Investition … nicht, ist die Antwort nein." |
| Case studies / named customers / outcomes | **ABSENT** | The only documented automation project (booking automation, SV Heinersreuth) was withdrawn. Industry pages use promises instead: `/automatisierung-arzt` "alles ohne einen einzigen manuellen Schritt". |
| ROI evidence | **ABSENT** | `/blog/prozessautomatisierung-roi`: "Ein frei erfundenes Rechenbeispiel". `/ki-agentur-deutschland`: "Drei Kernbereiche, die sofortigen ROI erzeugen" — **CLAIMED BUT UNVERIFIED**. |
| Tooling / stack named | **ABSENT** | No platform, integration or API is named as actually used. |
| Author identity | **ABSENT** | Blog `Article.author` = the Organization; no byline. |

**Information gain verdict.** The pillar's decision rules are original thinking and useful. The
four industry pages, three city pages and two problem pages add nothing a competitor could not
write without ever having automated anything.

### 2.3 Webdesign / Hotel (business priority 3)

| Proof type | Status | Evidence |
|---|---|---|
| Portfolio — a single website Cogniiq built | **ABSENT** | No URL, screenshot or name of any delivered website on the entire site. For a web design agency this is the most conspicuous gap of all. The blog's own advice, `/blog/webdesign-agentur-auswahl`: "Kriterium 1: Portfolio mit vergleichbaren Projekten". |
| First-party experience | **ABSENT** | — |
| Original data (e.g. Core Web Vitals of a delivered site, before/after) | **ABSENT** | `authority-acquisition-plan.md` W2/W3 open. The site's own build is the only demonstrable artefact and is not presented as one. |
| Methodology | **PRESENT** | `/webdesign` (2,389 words): scope, responsibilities, relaunch checklist, project sequence. |
| Pricing transparency | **INCONSISTENT** | `/kosten-webdesign` explains drivers and refuses to state ranges. `/{stadt}/webdesign-kosten` state them: "Die meisten Webdesign-Projekte in Regensburg liegen zwischen 1.500 € und 8.000 €", tiers to "5.500 € – 12.000 €+". The ranges are **CLAIMED BUT UNVERIFIED** (owner decision W4, open since September). |
| Calculator | **ABSENT** | — |
| Stated limitations | **PARTIAL** | `/regensburg/website-relaunch`: "garantieren lässt sich das nicht". Contradicted by `/muenchen/website-relaunch`: title "ohne Rankingverlust", "Rankings werden erhalten und verbessert". |
| Hotel expertise | **CLAIMED BUT UNVERIFIED** | `/webdesign-hotel`: "Cogniiq arbeitet als Internetagentur für die Hotellerie"; "Die allgemeine Webagentur kennt die Buchungsstrecke nicht". No hotel, no booking engine named ("Welches Buchungssystem passt, richtet sich nach Ihrer Größe"), and "Die Website amortisiert sich in der Regel innerhalb von 6–12 Monaten" without basis. This is the page with the most impressions on the domain. |
| Case studies / named customers | **ABSENT** | The sports-club website would be the natural reference for `/webdesign-sport`; consent missing. |
| Reviews | **ABSENT on site** | — |

**Information gain verdict.** `/webdesign` and `/kosten-webdesign` carry sensible buyer
guidance. Everything industry- or city-specific is assertion.

### 2.4 Local — Regensburg (and Bayreuth, München)

| Proof type | Status | Evidence |
|---|---|---|
| Physical presence in Regensburg | **ABSENT** | One address, Bayreuth. `/regensburg`: "Vor Ort in Regensburg und remote" — **CLAIMED BUT UNVERIFIED**; the site's own FAQ concedes the difference: `/regensburg/webdesign` H3 "Was ist der Unterschied zu einer Webagentur in Regensburg?" under the H1 "Webdesign Agentur in Regensburg". |
| Regensburg customer / project | **ABSENT** | `/bayern`: "betreuen Projekte in Regensburg, München und ganz Bayern" — **CLAIMED BUT UNVERIFIED**. |
| Local knowledge beyond general facts | **ABSENT** | Altstadt, Dom, Uniklinikum, tourism. |
| Local structured data | **PRESENT and honest** | `LocalBusiness` JSON-LD on city pages keeps the Bayreuth address and uses `areaServed: Regensburg` — no fake branch. |
| Google Business Profile | **Existence indicated, content unknown** | Organization JSON-LD `hasMap` points to a Google Maps place ("Cogni IQ", Bayreuth). Reviews, category, completeness: not measurable from here. No review is shown or linked on the site. |
| NAP consistency on site | **PRESENT** | Impressum, footer line "Cogniiq · Bayreuth", JSON-LD agree. Mobile number only, no landline. |
| Regional affiliations (IHK, Wirtschaftsförderung, university) | **ABSENT on site** | No mention. |
| Bayreuth — real location | **PRESENT** (address) / proof **ABSENT** | `/webdesign-immobilien-bayreuth`: "Als Bayreuther Unternehmen mit direktem Ortsbezug verstehen wir den lokalen Markt" — the location is real, the market claim unverified. |

### 2.5 Company-level trust signals

| Signal | Status | Evidence |
|---|---|---|
| Impressum | **PRESENT, complete for a sole proprietor** | Name, address, phone, e-mail, USt-IdNr., § 18 MStV responsible person. No Handelsregister entry (none required for this legal form). |
| Datenschutzerklärung | **PRESENT** | `/datenschutz`, 955 words. |
| Founder identity | **PRESENT but empty** | `/ueber-uns` names Lazar and Djordje Popovic. Both biographies are the same paragraph with names swapped and the same four focus areas. No photo, education, prior employer, year, certification, talk, publication or profile link. |
| Founder / legal-form consistency | **INCONSISTENT** | `/ueber-uns` title: "Lazar & Djordje Popovic", two "Gründer"; `/impressum` and JSON-LD `legalName`: "Cogniiq, Inhaber Lazar Popovic" (one owner). A careful buyer will notice. |
| Author bylines / editorial responsibility | **PRESENT on 2 pages, ABSENT elsewhere** | A named responsibility block ("Wer für diesen Beitrag geradesteht — Lazar Popovic …") renders on `/ki-telefonassistent-zahnarztpraxis` and `/ki-telefonassistent-einfuehren` only. No blog article names an author (`Article.author` = Organization); all ten blog posts share `datePublished` 2026-03-16. |
| Company age stated to visitors | **ABSENT in copy** | `foundingDate` is only in JSON-LD. `/ueber-uns` does not say the firm is one year old. Honest schema, silent page. |
| Reviews / ratings | **ABSENT** | No review, no `AggregateRating` (correctly not faked). |
| Third-party mentions, press, awards, partner status, certifications | **ABSENT** | None on site; `HONESTY-AUDIT.md`: "Keine Logo-Wände, keine Kundenzähler, keine Zertifikats-/Partner-Siegel." |
| External profiles (`sameAs`) | **ABSENT** | LinkedIn / Instagram / Facebook fields empty. |
| Scale claims | **CLAIMED BUT UNVERIFIED** | `/ueber-uns`: "Projekte deutschlandweit"; `/deutschland`: "betreuen wir Projekte in ganz Deutschland". |

---

## 3 · Planned authority work vs. evidence that it happened

Three documents plan off-site work: `docs/seo/authority-acquisition-plan.md` (7 approaches + W1–W5,
August/September 2026), `SEO_EXTERNAL_ACTIONS.md` (17 actions, 2026-10-23),
`FINAL_EXTERNAL_AUTHORITY_PLAN.md` (10 tasks, 2026-10-23). All three assign every item to the
owner and state that no contact was made. The check below asks one question per item: **is there
any trace — on the live site, in code, or in a later repo document — that it was done?**

| Planned item | Planned in | Trace of completion (2026-11-20) |
|---|---|---|
| GSC export incl. **Query×Page** uploaded and analysed | EXT-1, FINAL-9 | **None.** `FINAL_KEYWORD_OWNERSHIP.md` (23.10.) still says "kein Query×Page". |
| One written customer release (telephone assistant) | EXT-2, FINAL-1, plan §5 | **None.** No reference block on any page; `TestimonialBlock` has no data. |
| Stimmprobe audio | EXT-3, FINAL-2, A1 | **None.** No audio file in `public/`, no `<audio>` rendered. |
| Redacted dashboard / hand-over screenshot | EXT-4, FINAL-3, A2 | **None.** 0 images site-wide. |
| Case study with method | FINAL-4 | **None.** |
| Open owner questions (B4, B9, B11a, E3, H1, H3, Erstgespräch duration) | EXT-6 | **Partly.** Pricing was decided (commits `2936360`, `29e37c9`: binding tariffs, 0,50 € overage, 990 € setup, net + VAT). Technical questions: no trace; `/integrationen` and `/datenschutz-sicherheit` are still noindex. |
| Confirm or retire city webdesign price tables (W4) | EXT-7, plan W4 | **None.** All three city tables are live with euro ranges. |
| Directory profiles for practice service providers | EXT-8, plan §1 ("höchste Priorität", "sofort") | **No trace.** Not measurable from here; no `sameAs`, no mention. |
| Google Business Profile completed, first reviews | EXT-9, FINAL-7, plan §6 / W5 ("sofort") | **Profile appears to exist** (`hasMap`). Completion and reviews: not measurable; nothing on site. |
| Regional anchors (IHK Oberfranken, Wirtschaftsförderung, university) | EXT-10, FINAL-6, plan §2 | **No trace.** |
| PVS vendor contact (RED, medatixx, CGM, tomedo) | EXT-11, FINAL-5 | **No trace.** `docs/seo/pvs-integration-recherche.md` still lists vendor facts as "offenbar" with open questions. |
| Dental trade-press piece | EXT-12, plan §3 | **No trace** (and correctly sequenced after substance that does not exist yet). |
| Expert commentary / podcasts | EXT-13, plan §7 | **No trace.** |
| Original data asset ("Anrufanlässe in Praxen") | EXT-14, FINAL-8 | **None.** Requires ≥ 3 deployments; none documented. |
| Backlink baseline | EXT-15, FINAL-9 | **None.** No export in the repo. |
| Hosted GSC checks (Google-selected canonical for `/webdesign`) | EXT-16 | **No trace.** |
| Homepage positioning decision | EXT-17 | **Not taken.** Title still carries three services. |
| Ordered SERP snapshots per query | FINAL-10 | **None** beyond the August/September landscape notes. |
| Webdesign project reference (W1), relaunch before/after (W2), CWV of a client site (W3) | plan Nachtrag 14.09. | **None.** |

- **FACT.** Of roughly twenty planned external actions, the repository shows completion of one
  class only: the pricing decisions. For everything else there is no trace four to ten weeks
  after the plans were written (and about three months after the first plan).
- **HYPOTHESIS.** The project has substituted repository work (thirteen SEO documents, repeated
  copy and architecture passes) for the off-site and evidence work that the same documents
  identify as the bottleneck.
- **ALTERNATIVE EXPLANATION.** The owner may have done some of it without recording it in the
  repo (directory entries, GBP reviews, vendor e-mails leave no code trace). Absence of a trace
  is not proof of inaction — which is exactly why it must be asked rather than assumed.
- **CONFIDENCE.** High that nothing reached the site; medium that little was done.
- **WHAT WOULD FALSIFY THIS.** A list from the owner of completed listings/contacts, a GBP
  screenshot with reviews, a backlink export showing new referring domains since September.
- **RECOMMENDED ACTION.** Ask the owner for a one-page status of the 20 items before any further
  on-page work is commissioned; record answers in the repo.

---

## 4 · Claims that should be evidenced or withdrawn (public, live)

| Claim (verbatim) | Page | Status |
|---|---|---|
| "Vor Ort in München und remote" / "Vor Ort in Regensburg und remote" | `/muenchen`, `/regensburg` | CLAIMED BUT UNVERIFIED |
| "Ja. Wir kennen die lokale Wettbewerbssituation in Bayreuth und Oberfranken" | `/bayreuth/webdesign` (FAQ JSON-LD) | CLAIMED BUT UNVERIFIED |
| "Habt ihr Erfahrung mit dem Münchner Premium-Segment? — Ja." | `/muenchen/webdesign` (FAQ JSON-LD) | CLAIMED BUT UNVERIFIED |
| "Kein Ranking-Verlust" / "Rankings werden erhalten und verbessert" | `/muenchen/website-relaunch` | Unsupportable guarantee |
| "Google-Dominanz im härtesten Markt … Top-3 Google Maps" | `/muenchen/lokales-seo` | Unsupportable promise |
| "Die meisten Webdesign-Projekte in {Stadt} liegen zwischen 1.500 € und 8.000 €" | 3 city cost pages | CLAIMED BUT UNVERIFIED (W4) |
| "Die Website amortisiert sich in der Regel innerhalb von 6–12 Monaten" | `/webdesign-hotel` (FAQ JSON-LD) | CLAIMED BUT UNVERIFIED |
| "Cogniiq arbeitet als Internetagentur für die Hotellerie" | `/webdesign-hotel` | CLAIMED BUT UNVERIFIED |
| "zwei Bereichen, die sofort ROI erzeugen" | `/ki-agentur-deutschland` | CLAIMED BUT UNVERIFIED |
| "Projekte deutschlandweit" / "betreuen Projekte in Regensburg, München und ganz Bayern" | `/ueber-uns`, `/bayern`, `/deutschland` | CLAIMED BUT UNVERIFIED |
| "Sehen Sie, wie der Assistent direkt einen Termin in den Kalender bucht." | `/ki-telefonassistent/demo` | Inconsistent with the flagship's conditional wording |
| "erreichbar täglich von 6 bis 20 Uhr" | `/kosten-ki-telefonassistent` | Service promise — fine if true; owner to confirm it is sustainable |
| "Das Tarifgehalt für Medizinische Fachangestellte beginnt 2026 bei 2.939,59 €" | `/kosten-ki-telefonassistent` | Likely sourced (tariff table) but no source shown on the page |

---

## 5 · Synthesis

- **FACT.** Per cluster, the count of *PRESENT* proof types that demonstrate delivered work
  (experience, data, screenshots, recordings, case studies, customers, reviews, third-party
  mentions) is **0 / 0 / 0 / 0**. What is present in every strong page is method, limits and —
  for the telephone assistant only — a real price list and calculator.
- **HYPOTHESIS.** The site has reached the ceiling of what honest copy can do without evidence.
  Further text will not move trust; one recording, one screenshot and one consented reference will.
- **ALTERNATIVE EXPLANATION.** If no live telephone-assistant customer exists yet, the gap is not
  a publishing problem but a business-stage fact; then the right asset is a clearly labelled
  staged demo and a callable demo line, and the SEO expectation for commercial head terms should
  be lowered accordingly.
- **CONFIDENCE.** High.
- **WHAT WOULD FALSIFY THIS.** A measured improvement in clicks/leads on the priority pages from
  copy changes alone, with no proof asset added.
- **RECOMMENDED ACTION.** Freeze copy work on priority-1 pages; complete items 1–6 of the
  checklist below; then measure.

---

## 6 · EVIDENCE MISSING — owner to supply

Ordered by business priority, then by effort. Each item names the page it unlocks. Nothing here
may be simulated; a staged asset must be labelled as staged (the component already enforces
"Beispielanruf, nachgestellt — kein echter Patientenanruf").

### Priority 1 — KI-Telefonassistent

- [ ] **1. A straight answer first: how many telephone-assistant customers are live today?**
  (0 / 1–2 / 3+). Every item below depends on it. If 0: say so internally and build items 2, 3, 5.
- [ ] **2. Audio sample, 30–90 s**, staged and labelled, with transcript and speaker consent
  (`ASSETS-REQUIRED.md` A1). → `/ki-telefonassistent`, `/praxen`, `/ki-telefonassistent-arzt`.
  The slot is built and empty on at least six pages.
- [ ] **3. A demo number anyone can call**, or a recorded full call on the demo page.
  → `/ki-telefonassistent/demo` (207 words, a form).
- [ ] **4. One redacted screenshot or 20–30 s screen capture of what the team sees after a call**
  (A2), demo data only. → flagship "Übergabe", Arzt page.
- [ ] **5. Named technology and sub-processor list + sample AVV (PDF)**: which speech/LLM
  provider, where data is processed, retention. → unblocks `/datenschutz-sicherheit` (noindex)
  and substantiates "keine Aufzeichnung / kein Training".
- [ ] **6. One consented practice reference** — anonymised is enough ("Hausarztpraxis, drei
  Behandler, Oberfranken"): which call reasons were configured, since when, one quote, written
  consent (A3). → `/praxen`, `/ki-telefonassistent-arzt` or `-zahnarztpraxis`.
- [ ] **7. One measured number with method**: calls handled, share completed without staff,
  share handed over, over a stated window, from one deployment (A5). Small sample named as such.
- [ ] **8. Integration facts**: for each calendar/PVS actually connected in a real project —
  system name, what is written where, what stays manual. → unblocks `/integrationen` (noindex).
- [ ] **9. Source link for the MFA tariff figure** and confirmation of "täglich 6–20 Uhr".
- [ ] **10. Author box on the flagship, cost, Arzt and `/praxen` pages** (it exists on the
  Zahnarzt and Einführung pages only), backed by a real biography (see 21).

### Priority 2 — Prozessautomatisierung

- [ ] **11. Written consent from SV Heinersreuth** (or anonymised release) for the booking
  automation project already described in git history — the only documented project the firm
  has. → `/prozessautomatisierung`, `/automatisierung-sport`, `/webdesign-sport`.
- [ ] **12. One real workflow shown**: trigger, systems, exception path, as a redacted diagram or
  screenshot from a delivered build. → `/prozessautomatisierung` "Sechs Ablaufmuster".
- [ ] **13. One real before/after**: minutes per case and cases per month, measured by the
  customer, with method. → replaces "Ein frei erfundenes Rechenbeispiel" in
  `/blog/prozessautomatisierung-roi` and feeds `/kosten-automatisierung`.
- [ ] **14. The stack actually used** (tools, platforms, hosting) — named.
- [ ] **15. A real price range or one redacted offer** for an automation project.

### Priority 3 — Webdesign / Hotel / local

- [ ] **16. A portfolio: every website Cogniiq has delivered** — URL, screenshot, scope, date,
  consent. Even two entries change the cluster. → `/webdesign`, city pages.
- [ ] **17. One relaunch with before/after data** (GSC or analytics of the client site, with
  consent) (W2). → `/regensburg/website-relaunch`, `/webdesign`.
- [ ] **18. Core Web Vitals of one delivered site** (CrUX or lab, URL and date) (W3).
- [ ] **19. Decision on the three city price tables (W4)**: confirm the ranges from real
  invoices/offers, or remove them. Open since September.
- [ ] **20. Hotel: yes or no.** Has Cogniiq built a hotel website or integrated a booking engine?
  If yes: which hotel, which engine, consent. If no: the sentence "Cogniiq arbeitet als
  Internetagentur für die Hotellerie" and the 6–12-month amortisation claim must go.
- [ ] **21. Founder biographies that differ**: for each of the two founders — role, background,
  what they personally build, a photo (one already exists in `public/`), a profile link
  (LinkedIn or similar → `sameAs`). And one sentence resolving "two founders" vs "Inhaber:
  Lazar Popovic".
- [ ] **22. München and Regensburg: any real customer or regular on-site presence?** If not,
  "Vor Ort in München/Regensburg" and the "Ja, wir haben Erfahrung mit dem Münchner …" answers
  must be withdrawn (see `06-content-quality.md` F1).

### Off-site (cannot be verified from the repository — owner to report status)

- [ ] **23. Search Console query×page export** (specification: `05-query-ownership.md` §0) and
  URL Inspection result for `/webdesign`.
- [ ] **24. Backlink baseline**: GSC → Links export plus one third-party tool export.
- [ ] **25. Google Business Profile**: screenshot of the profile (category, services, number of
  reviews). First reviews from real clients, no incentives.
- [ ] **26. Status list of the planned listings and contacts**: practice-service directories,
  IHK Oberfranken, Wirtschaftsförderung Bayreuth, PVS vendors (RED, medatixx, CGM, tomedo) —
  for each: done / requested / not started, with date.
- [ ] **27. Lead tracking**: number of qualified enquiries per landing page per month — the only
  figure that tells whether any of the above matters commercially.

Items 1–6 and 23–24 are the minimum before another on-page SEO pass is worth commissioning.
