# D — Content Quality / Topical Authority / Copy Audit
Cogniiq (cogniiq.de) · read-only audit · evidence from `dist/` (93 prerendered HTML files, fresh build) and repo source.
Binding docs read: `.claude/COPY-BRIEF.md`, `COPY-BRIEF-2.md`, `COPY-BRIEF-3.md`, `COPY-CLAIMS-TO-VERIFY.md`, `COPY-GAPS.md`, `COPY-INVENTORY.md`, `OWNER-INPUT.md`, shared `AUDIT-CONTEXT.md`.

---

## 0. Summary

The site is **two sites wearing one skin.**

**Site A — the healthcare cluster** (`/praxen`, `/ki-telefonassistent`, `/ki-telefonassistent-arzt`, `/ki-telefonassistent-praxis`, `/kosten-ki-telefonassistent`, `/integrationen`, `/datenschutz-sicherheit`, `/referenzen`, `/bewertungen`) has had the COPY-BRIEF passes applied. It is, in places, genuinely excellent — better than almost anything a German AI-receptionist competitor publishes. It names its own limitations, refuses to claim DSGVO conformity, refuses to publish an anonymised testimonial, and refuses to list PVS integrations it does not have.

**Site B — everything else** (homepage, `/webdesign*`, `/automatisierung*`, all 30 city×service cluster pages, all national pillar pages, hotel/restaurant, blog, `/ueber-uns`, `/leistungen`, `/kontakt`, `/bayern`, `/deutschland`) has **not** had that pass. It still carries the pre-overhaul price tiers, the pre-overhaul integration promises, savings percentages, counting-up numbers and template-substituted city copy.

The two halves state **contradictory facts about the same product**. A buyer who arrives on the honest page and then clicks one link — or vice versa — sees Cogniiq contradict itself on price, on delivery time, and on whether the assistant can book into a practice system at all. That is the single most damaging finding in this audit, and it is entirely self-inflicted: no external fact is needed to fix it.

**Counts (all KNOWN, all evidenced below):**
- **13 factual contradiction clusters** across pages about the same product fact.
- **1 contradiction inside a single paragraph pair on the two most commercial pages** (90 % vs 20 % automation rate).
- **9 claims live on the site that `COPY-CLAIMS-TO-VERIFY.md` still lists as unverified**, including the top-priority Z0.
- **408 of 496 FAQ answers (82 %) on 51 pages exist only inside `FAQPage` JSON-LD and are not in the rendered HTML at all.**
- **2 of the 3 highest-information-gain pages on the entire site are `noindex, nofollow`.**
- City pages are 46–80 % "unique" by string comparison but far less by information: the variation is synonym-shuffling inside an identical template, not different facts.

### What is already STRONG — do not touch
| # | What | Where |
|---|---|---|
| S1 | `/integrationen` — says plainly "Eine fertige Standardanbindung … gibt es bei uns heute nicht … Wenn Ihre Bedingung lautet, dass Termine automatisch in Ihrem System stehen, sind wir heute nicht der richtige Anbieter." This is the strongest trust asset on the site. | `dist/integrationen.html`; `src/pages/IntegrationenPage.tsx` |
| S2 | `/datenschutz-sicherheit` — refuses to self-certify ("Diesen Satz schreiben wir nicht"), publishes the **six questions the practice's own DSB should ask Cogniiq**, and admits the TOM list and processing location are unresolved. Nothing comparable exists on any competitor page in this market. | `dist/datenschutz-sicherheit.html` |
| S3 | `M15 Was unser Empfang nicht macht` — seven named limitations including "Der Assistent übernimmt nicht alle Anrufe" and "keine medizinische Einschätzung, keine Triage". Placed **before** price, as COPY-BRIEF-3 §3.2 requires. | `dist/praxen.html`, `dist/ki-telefonassistent.html`, `dist/ki-telefonassistent-arzt.html` |
| S4 | `/referenzen` "Warum hier gerade kein Kundenprojekt steht" and `/bewertungen` "Eine leere Seite ist uns lieber als eine geschönte." Rare and credible. | `dist/referenzen.html`, `dist/bewertungen.html` |
| S5 | The pricing page leads with the cap before the amount, publishes the setup fee, the 12-month term, the 20 % monthly-cancellation surcharge, and a calculator that is allowed to return a **negative** result ("Bei diesen Angaben trägt sich der Empfang rechnerisch nicht"). | `dist/kosten-ki-telefonassistent.html` |
| S6 | Banned-word hygiene in the healthcare cluster is effectively clean — a full scan of `§5.9` terms across all 93 rendered pages returns only 4 hits, none in the healthcare cluster (see F-24). |  |
| S7 | Approved statistics are used correctly: GKV-SV 2025 (39 %), Zi 2026 (46 %), Virchowbund MFA 2026 (2.939,59 €), each with source and year visible. | `dist/ki-telefonassistent-arzt.html`, `dist/kosten-ki-telefonassistent.html` |

---

## 1. FACTUAL CONTRADICTIONS (highest priority)

### F-01 · The calculator's own framing contradicts the calculator, on both money pages
**KNOWN · P0 · blast radius: `/kosten-ki-telefonassistent`, `/praxen` (the two highest commercial-intent pages)**

The framing paragraph and the calculator two screens below state different automation rates.

- Side A: *"Der Rechner ist auf einen **Automatisierungsgrad von 90 %** voreingestellt und zieht unsere eigenen Kosten ab"* — `src/lib/telefonassistent-copy.ts:799` (`RECHNER.rahmung`); rendered in `dist/kosten-ki-telefonassistent.html` and `dist/praxen.html`.
- Side B, same page: slider default **20 %**, and *"Woher der Automatisierungsgrad kommt: **Voreingestellt sind 20 %** — der Anteil der Anrufe, den der Assistent nach Angabe von Cogniiq vollständig übernimmt."* — `src/components/PraxisRechnerWidget.tsx:50` (`AUTOMATISIERUNG_STANDARD = 20`) and `:482`.

The code comment at `PraxisRechnerWidget.tsx:39` reads *"90 % was the single riskiest statement on the website"* — the widget was fixed, the copy constant was not. `COPY-CLAIMS-TO-VERIFY.md` lists this as **Z0, "Höchste Priorität"**, still unresolved (OWNER-INPUT F4 unanswered).

**Blast radius:** a buyer who reads the framing sentence expects a 90 % automation figure, sees 20 %, and concludes the numbers are made up — which destroys the credibility of the entire (otherwise excellent) transparent-calculation section.
**Fix:** delete or rewrite `RECHNER.rahmung` so it states the actual default. No owner input required for this — the correct number is already in the code. Add a guard test asserting `RECHNER.rahmung` contains `AUTOMATISIERUNG_STANDARD` (the repo already uses this pattern in `telefonassistent-copy.test.ts` for `FAKTEN`/`TARIFE`).
**Risk:** none. **Live-experiment overlap:** `/kosten-ki-telefonassistent` is a live experiment, but only its title/H1/canonical/meta are — this is body copy, safe to fix.

### F-02 · Two incompatible price structures for the same product
**KNOWN · P0 · blast radius: `/ki-agentur-deutschland` vs `/kosten-ki-telefonassistent`, `/praxen`, all healthcare pages**

- Side A (retired tiers, still live): *"Einfachere Setups beginnen **ab ca. 99 €/Monat**. Mittlere Konfigurationen … **199–399 €/Monat**. Komplexere Lösungen für große Praxen oder Unternehmensgruppen **ab 499 €/Monat**. Genaue Preise auf der Kosten-Seite."* — `src/pages/pillars/KiAgenturDeutschland.tsx:149`, rendered `dist/ki-agentur-deutschland.html`.
- Side B (current tiers): Basis **300 €**, Praxis **500 €**, MVZ **800 €**, Enterprise ab 5.000 € — `dist/kosten-ki-telefonassistent.html`.

The retired page even points the reader at the Kosten page, where the entry price is **3× higher** than the one just promised. `COPY-CLAIMS-TO-VERIFY.md` §Y records C1 as *"ersetzt durch TARIFE"* — the replacement never reached this page.
**Fix:** replace the answer with the current `TARIFE` values (single source already exists).
**Risk:** none. **Live-experiment overlap:** none.

### F-03 · A third price for the same product on the homepage, framed as a fixed price
**KNOWN · P0 · blast radius: `/` (highest-traffic page)**

- Side A: *"Monatliche Investition **297 €** / Monat … Gesamt / Monat 297 € — **Fixpreis. Keine Überraschungen.**"* — `src/components/CostComparisonSection.tsx:21` (`KI_PRICE_MONTHLY = 297`), rendered `dist/index.html`.
- Side B: *"Jeder Tarif enthält ein festes Minutenkontingent. **Über dem Minutenkontingent kostet jede weitere Minute 0,39 €.**"* — `dist/kosten-ki-telefonassistent.html`, `dist/praxen.html`, `dist/ki-telefonassistent.html`.

297 € matches no tier, and "Fixpreis. Keine Überraschungen." contradicts the quota-plus-overage model the pricing page spends its first section explaining. The file carries its own `[[CLAIM]]` marker at `CostComparisonSection.tsx:19-20` and is logged as **Z8**, unresolved.
**Fix:** drive the widget from `TARIFE` and describe the cap, or remove the euro figure entirely.
**Risk:** low. **Live-experiment overlap:** none.

### F-04 · The homepage promises PVS/calendar/CRM integration the site elsewhere says does not exist
**KNOWN · P0 · blast radius: `/`, `/ki-telefonassistent-hotel`, `/blog/ki-telefonassistent-arztpraxis`, `/ki-telefonassistent/demo` vs `/integrationen`, `/praxen`, `/ki-telefonassistent-arzt`**

- Side A, homepage feature list: *"**Automatische Terminbuchung**", "**Integration Kalender & CRM**", "**Sofortbestätigung per SMS oder Mail**"* — `src/components/CostComparisonSection.tsx:336-338`, rendered `dist/index.html`.
- Side A, hotel page: *"Der KI Telefonassistent nimmt Buchungsanfragen … entgegen und **trägt sie nach Ihren Vorgaben in Ihr System ein**"* — `src/pages/industries/KiTelefonassistentHotel.tsx:14`; and *"**Die Buchung wird in Ihr System eingetragen**, der Gast erhält eine schriftliche Bestätigung"* — `:79`.
- Side A, blog: *"Terminbuchung **direkt in das Praxisverwaltungssystem** (z. B. Samedi, Doctolib, Medistar)"* — `src/lib/blog-data.ts:181`; *"Die gängigen deutschen Praxisverwaltungssysteme wie **Medistar, Turbomed oder Samedi** bieten APIs, über die Terminslots abgerufen und Buchungen eingetragen werden können"* — `:192`; FAQ: *"**Ja**, bei Integration mit einer kompatiblen Praxissoftware (Samedi, Doctolib u. a.) **bucht das System Termine direkt – ohne Medienbruch**."* — `:227`.
- Side A, demo page: *"Sehen Sie, wie der Assistent **direkt einen Termin in den Kalender bucht**."* — `dist/ki-telefonassistent/demo.html`.
- Side B: *"**Nein.** Eine fertige Standardanbindung an gängige Praxisverwaltungssysteme gibt es bei uns heute nicht. Wir führen deshalb auch keine Liste unterstützter Systeme — sie wäre entweder leer oder unehrlich."* — `dist/integrationen.html`; identically on `dist/praxen.html`, `dist/ki-telefonassistent-arzt.html` (M15).

This is the market's **hardest documented objection (#2)**. The site answers it honestly on four pages and dishonestly on four others — including naming three real PVS vendors that `COPY-CLAIMS-TO-VERIFY.md` §Y **A1** records as *"entfernt"*. They were removed from the healthcare cluster and survived in `blog-data.ts`.
**Fix:** apply `FAKTEN.keineAnbindung` wording to `blog-data.ts:181/192/227`, `CostComparisonSection.tsx:336-338`, `KiTelefonassistentHotel.tsx:14/79`, and the demo page. Do not invent a new formulation — reuse the existing honest one.
**Risk:** none; it removes claims rather than adding them. **Live-experiment overlap:** none for these files (but see F-05).

### F-05 · The `/ki-telefonassistent-arzt` title and meta description promise automatic booking; the page body denies it
**KNOWN · P1 (CRITICAL DEFECT inside a live experiment) · blast radius: the single highest-intent healthcare query family**

- Side A, live experiment metadata: `title: "KI-Telefonassistent für Arztpraxen | **Termine automatisch buchen** – Cogniiq"` and `description: "… nimmt Patientenanrufe an, **bucht Termine ins System**, …"` — `src/lib/routing/publicRoutes.ts:577-578`, rendered `dist/ki-telefonassistent-arzt.html`.
- Side B, the same page's own body: *"**Eine fertige Standardanbindung an Praxisverwaltungssysteme gibt es heute nicht.** Das Ergebnis eines Anrufs steht strukturiert im Cogniiq-Dashboard; den Übertrag ins Praxissystem macht Ihr Team."*

Per AUDIT-CONTEXT I am not proposing rewording of a live experiment — I am flagging this **as a critical defect with proof**: the experiment's SERP promise is contradicted by the landing page within two screens. Any CTR gain it measures is a gain from a promise the page then withdraws; the experiment is measuring a mismatch, not a headline. It should be corrected on factual grounds and the measurement window restarted.
**Fix (coordinator decision):** correct the description to something the page can keep (the page already has better material: the structured handover, the two-week guarantee, the no-recording stance). **Risk:** resets one experiment's clock. **Live-experiment overlap:** direct — escalate rather than edit.

### F-06 · Delivery time for a website: five different answers
**KNOWN · P1 · blast radius: `/webdesign`, `/ueber-uns`, `/bayern`, `/deutschland`, `/muenchen/webdesign-kosten`, all `website-erstellen` and `website-relaunch` city pages, plus two meta descriptions**

Same deliverable ("eine einfache Unternehmenswebsite"):
- *"Einfache Unternehmenswebsites gehen in **7–14 Tagen** live."* — `src/pages/WebdesignHub.tsx:45`
- *"**Websites: 4–12 Wochen.**"* — `src/pages/BayernPage.tsx:186`
- *"**Websites je nach Umfang in 4–12 Wochen.**"* — `src/pages/DeutschlandPage.tsx:213`
- *"Einzellösungen wie eine Website … sind in **7 bis 14 Tagen** einsatzbereit."* — `src/pages/UeberUnsPage.tsx:246`
- *"Erste Systeme sind in **ein bis zwei Wochen** eingerichtet"* — `src/pages/UeberUnsPage.tsx:102`
- *"Launch: **7–14 Tage**. Wachstum: **3–6 Wochen**. Marktführer: **6–10 Wochen**."* — `src/pages/cluster/muenchen/WebdesignKostenMuenchen.tsx:138`
- Relaunch: *"Projektdauer **3–8 Wochen**"* — `src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx:32` and `.../regensburg/WebsiteRelaunchRegensburg.tsx:32`
- Meta descriptions still shipping the figure: *"Go-Live in **7–14 Tagen**"* — `src/lib/routing/publicRoutes.ts:292` and `:360`.

7–14 days and 4–12 weeks differ by an order of magnitude. `COPY-CLAIMS-TO-VERIFY.md` **Z6** explicitly leaves this unresolved: *"Für die anderen Produkte steht die Zahl unbestätigt auf Startseite und Vertrauensflächen … Nach dem Grundsatz oben gehört sie entfernt, wenn sie nicht bestätigt wird."*
**Fix:** one number, or none. Applying the site's own stated principle ("Unbelegte Zusagen werden entfernt, nicht markiert", OWNER-INPUT 18.08.2026) means removing all of them until the owner confirms one.
**Risk:** two meta descriptions change — check against the SEO agent's list first.

### F-07 · Delivery time for the telephone assistant: "in wenigen Tagen" vs the Two-Week Guarantee, on the same page
**KNOWN · P1 · blast radius: `/ki-telefonassistent-arzt`, `/ki-telefonassistent-praxis`, `/ki-telefonassistent-hotel`, `/ki-telefonassistent-restaurant`, `/ueber-uns`, `/bayern/ki-telefonassistent`**

- Side A, hero badges on all four `NationalIndustryPage` variants: *"**Einrichtung in wenigen Tagen**"* — `src/components/NationalIndustryPage.tsx:221` — and *"**Einrichtung in Tagen**"* — `:272`.
- Side B, the same pages' body: *"**Spätestens zwei Wochen nach dem Start** ist Ihr KI-Empfang vollständig eingerichtet und bereit für Ihre Freigabe."*
- Side C: *"Einzellösungen wie … ein KI-Telefonassistent sind in **7 bis 14 Tagen einsatzbereit**"* — `src/pages/UeberUnsPage.tsx:246`. Note "einsatzbereit" also overstates the guarantee, which promises *readiness for approval*, not go-live.

The guarantee — described in COPY-BRIEF-3 §3.3 as *"das stärkste Einzelargument der gesamten Website"* — is undercut by a badge three centimetres above it.
**Fix:** replace both badge strings with the guarantee's own wording. **Risk:** none.

### F-08 · Automation project duration differs by city for the same service
**KNOWN · P2 · blast radius: `/bayreuth/automatisierung`, `/muenchen/automatisierung`, `/regensburg/automatisierung`, `/automatisierung-arzt`, `/automatisierung-restaurant`, `/digitale-automatisierung-unternehmen`**

- *"Einfache Workflows: 1–2 Wochen. Komplexere Integrationen: **3–6 Wochen**."* — `src/lib/standorte-service-configs.ts:611` (Bayreuth)
- *"Einfache Workflows: 1–2 Wochen. Komplexe Integrationen: **4–8 Wochen**."* — `src/lib/standorte-service-configs.ts:975` (München)
- *"Einfache Quick-Win-Automatisierungen in **1–3 Wochen**. Mittlere Projekte in 3–6 Wochen."* — `src/pages/pillars/AutomatisierungUnternehmen.tsx:137`
- *"Einrichtung in **2–4 Wochen**, ohne Praxisunterbrechung"* — `src/pages/industries/AutomatisierungArzt.tsx:56`

Delivery capacity does not vary by which city page the reader landed on. This is a pure template-substitution artefact and it is visible to anyone who opens two tabs.
**Fix:** single shared constant. **Risk:** none.

### F-09 · Two billing models for automation
**KNOWN · P2 · blast radius: `/kosten-automatisierung`, `/automatisierung-unternehmen`, `/deutschland`, `/bayern`, `/blog/ki-automatisierung-kleine-unternehmen`**

- One-off model: *"Einfache Automatisierungen (ein Workflow, ein Use Case) beginnen **ab ca. 500–1.500 €**"* — `dist/automatisierung-unternehmen.html`; `/kosten-automatisierung`: `500 – 1.500 €`, `1.500 – 5.000 €`, `ab 5.000 €`, plus *"Wartungspakete **ab 99 €/Monat**"*.
- Subscription model: *"Ein einfaches Automatisierungssystem … ist **ab 150 € monatlich** umsetzbar. Komplexere Lösungen … liegen bei **300–800 € pro Monat**."* — `src/lib/blog-data.ts:107`.

A buyer cannot tell whether automation is bought once or rented. `COPY-CLAIMS-TO-VERIFY.md` **Z12** leaves the blog figures open.
**Fix:** decide one model, or state both explicitly as different offerings. **Risk:** none.

### F-10 · Four different lengths for the same free first call
**KNOWN · P2 · blast radius: sitewide (every CTA)**

- **Ca. 15 Minuten** — `src/pages/KiTelefonassistentPage.tsx:798` and `:1395`; `src/components/NationalIndustryPage.tsx:359`
- **30 Minuten** — `src/lib/routing/publicRoutes.ts:79` (the `/kontakt` meta description) and `src/lib/seo-data.ts:226`; blog CTA *"30 Minuten, in denen wir konkrete Potenziale … identifizieren"*
- **30–45 Minuten** — 24 rendered pages (all city pages, `/bayern`, `/deutschland`, `/ueber-uns`, `/leistungen`, `/bewertungen`, homepage `dist/index.html`)
- **45 Min. · Video** — `dist/kontakt.html`

`/kontakt` alone shows three of the four (`30 Minuten` in the meta, `30–45 Min.` in the H2 area, `45 Min.` on the booking card). `COPY-CLAIMS-TO-VERIFY.md` **Z5** states the duration is unconfirmed and was deliberately left out of the CTA microcopy — yet four variants are live.
**Fix:** one number sitewide, or the confirmed "Kein Verkaufsgespräch, keine Präsentation" without a duration (the wording `/integrationen` already uses). **Risk:** none.

### F-11 · Two different response-time promises
**KNOWN · P3 · blast radius: `/`, healthcare cluster**
- *"Antwort **in der Regel** innerhalb 24 h"* — `src/components/ROICalculator.tsx:361`, rendered `dist/index.html`.
- *"Antwort **spätestens** innerhalb von 24 Stunden"* — `dist/kosten-ki-telefonassistent.html`, `dist/praxen.html`, `dist/ki-telefonassistent-arzt.html` (M18, from the confirmed OWNER-INPUT D3).
"In der Regel" is a hedge on a commitment the owner has actually made; it weakens a confirmed fact.
**Fix:** use the confirmed wording everywhere. **Risk:** none.

### F-12 · Different company facts: one founder or two
**KNOWN · P3 · blast radius: `/ueber-uns`, `/referenzen`, `/bewertungen` vs the healthcare cluster**
- *"Cogniiq wurde 2025 von **Lazar und Djordje Popovic** in Bayreuth gegründet."* — `src/components/AboutSection.tsx:126`; also `publicRoutes.ts:87` and `seo-data.ts:216` meta; *"Persönliche Umsetzung durch **Lazar und Djordje Popovic** – kein Outsourcing"* — `dist/bewertungen.html`; *"**Lazar und Djordje Popovic** arbeiten direkt am Projekt"* — `dist/referenzen.html`.
- Healthcare cluster M18: *"Sie sprechen mit **einer Person**, nicht mit einem Ticketsystem und nicht mit einem wechselnden Support-Team. **Lazar Popovic** · Gründer und Leiter"* — `dist/ki-telefonassistent-arzt.html`, `dist/praxen.html`.
- Impressum/Datenschutz: *"**Inhaber: Lazar Popovic**"* — `dist/impressum.html`, `dist/datenschutz.html`.
Not necessarily false (a second founder can exist without being the support contact) but the pages read as contradicting each other, and `COPY-CLAIMS-TO-VERIFY.md` **Z13** flags founder role attribution as unconfirmed.
**Fix:** state the roles once, consistently. **Risk:** none.

### F-13 · Four different hourly personnel costs, one asserted as fact
**KNOWN · P2 · blast radius: `/`, `/kosten-ki-telefonassistent`, `/praxen`, `/automatisierung-unternehmen`, blog**
- **18 €/h** — pricing calculator default, correctly sourced to the MFA-Tarif 2026 (`dist/kosten-ki-telefonassistent.html`).
- **28 €/h** — homepage calculators, "inkl. Arbeitgeberkosten", unsourced (`dist/index.html`).
- **35 €/h** and **40 €/Std.** — `dist/blog/prozessautomatisierung-roi.html` (labelled "frei erfundenes Rechenbeispiel" — acceptable).
- **30–60 € pro Stunde** — asserted as fact, not as an input: *"Jede dieser Aufgaben **kostet 30–60 € pro Stunde in Personalkosten**."* — `src/pages/pillars/AutomatisierungUnternehmen.tsx:53`.
The first three are user-adjustable assumptions; the fourth is a bare unsourced statistic, banned by COPY-BRIEF §2.1 and COPY-BRIEF-2 §3.1.
**Fix:** remove the assertion at `AutomatisierungUnternehmen.tsx:53` or source it. Align defaults. **Risk:** none.

---

## 2. UNSUPPORTED / UNVERIFIABLE CLAIMS LIVE ON THE SITE

Cross-checked against `COPY-CLAIMS-TO-VERIFY.md` §Z and `OWNER-INPUT.md`. All of these are **live in `dist/`** while still recorded as unverified.

| # | Claim (live) | Evidence | Claims-doc status | Sev |
|---|---|---|---|---|
| F-14 | Automation rate 90 % as calculator default framing | `src/lib/telefonassistent-copy.ts:799` | **Z0 "Höchste Priorität"**, OWNER-INPUT F4 unanswered | **P0** |
| F-15 | *"ordnen wir Sie dem Tarif zu, der für Ihren Bedarf am günstigsten ist"* (`dist/kosten-ki-telefonassistent.html`, `dist/praxen.html`) | rendered text | **Z1** — must be covered contractually, otherwise remove | P1 |
| F-16 | *"Einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO stellen wir jedem Kunden bereit"* (`dist/datenschutz-sicherheit.html`, all healthcare + hotel/restaurant pages, homepage trust strip) | rendered text | **Z2** — template not finalised; today an Absichtserklärung | P1 |
| F-17 | *"Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet"* (`dist/datenschutz-sicherheit.html`) | rendered text | **Z3** — clause not drafted | P1 |
| F-18 | JSON-LD `areaServed` (10+ cities), `priceRange "€€€"`, `foundingDate 2025-10-15`, `availableLanguage` | `index.html`, `LocalBusinessSchema.tsx` | **Z9** | P2 |
| F-19 | *"Go-Live in 7–14 Tagen"* for websites | `publicRoutes.ts:292`, `:360`; `WebdesignHub.tsx:45` | **Z6 residual**, explicitly "gehört entfernt, wenn nicht bestätigt" | P1 |
| F-20 | Blog orientation prices for webdesign/automation (150–500 €, 2.500–8.000 €, 300–800 €/Monat) | `src/lib/blog-data.ts:107`, `:590`; `dist/blog/webdesign-agentur-auswahl.html`, `dist/blog/webdesign-konversion-tipps.html` | **Z12 residual** | P2 |
| F-21 | Beispielbetrag 297 € in the comparison widget | `CostComparisonSection.tsx:21` | **Z8** | P1 |
| F-22 | *"**DE · AT · CH**"* in the homepage hero trust row (`dist/index.html`) — a service-area claim for two additional countries | rendered text | not in the claims doc at all; no Austrian/Swiss presence evidenced anywhere in repo or Impressum | P2 |
| F-23 | *"DSGVO-Protokoll: Manuell \| **Automatisch**"* — a compliance capability claim in a comparison table | `src/lib/blog-data.ts:213` | not in claims doc; no such feature described anywhere | P2 |

**Additional unverified performance/ROI claims (KNOWN, none in the claims doc):**
- **F-24a** Homepage savings block: *"Sie sparen jeden Monat **1.780 €** … = **86 % weniger als heute** … Jahresersparnis **21.360 €**"* — `src/components/CostComparisonSection.tsx:385-403`, rendered `dist/index.html`. COPY-BRIEF §5.7 bans *"any 'X % Zeitersparnis' claim, any ROI number not calculated transparently"*; the healthcare pricing page explicitly refuses to derive a saving (*"Zum Vergleich, **ohne daraus eine Ersparnis abzuleiten**"*). The homepage does exactly what the pricing page promises not to do.
- **F-24b** Homepage potential calculator projects *"Summe Ihrer Eingaben, auf zwölf Monate **374.616 €**"* from defaults the user has not touched. The disclaimer is present and good, but the headline number is generated before any input.
- **F-24c** *"Websites, die ranken."* as the `/webdesign` H1 — `src/pages/WebdesignHub.tsx:159`. A ranking outcome promise with no evidence anywhere on the site.
- **F-24d** *"Auch bei Anrufspitzen in der Tourismussaison wird **jeder Anruf** angenommen – ohne Warteschleife"* — `src/lib/standorte-service-configs.ts:451`, rendered `dist/regensburg/ki-telefonassistent.html`. An absolute promise banned by COPY-BRIEF-2 §3.4, and contradicted by the site's own M15 (*"Der Assistent übernimmt nicht alle Anrufe"*) and by the stated limit of 10 concurrent calls.

---

## 3. BANNED-WORD AND VOICE-SPEC VIOLATIONS

Full scan of COPY-BRIEF §5.9 across all 93 rendered pages. **The result is largely clean — this is a genuine strength (S6).** Remaining hits:

| # | Violation | Evidence | Sev |
|---|---|---|---|
| F-25 | `einzigartig` — *"Regensburg hat eine **einzigartige** SEO-Dynamik"* | `src/pages/cluster/regensburg/LokalesSEORegensburg.tsx:62` | P3 |
| F-26 | `vollautomatisch` — *"**Vollautomatisches** Kunden-Onboarding"* | `dist/kosten-automatisierung.html` | P3 |
| F-27 | `nie wieder`-class absolute — *"Interessenten … werden **nie wieder** kontaktiert"* | `dist/automatisierung-immobilien.html` | P3 |
| F-28 | `jeder Anruf` absolute promise | `standorte-service-configs.ts:451` (see F-24d) | P2 |
| F-29 | **Sie-Form violated** — *"**Lass uns dein** digitales System aufbauen."* (du-form, addressed to the reader) | `src/pages/UeberUnsPage.tsx:1018`, rendered `dist/ueber-uns.html` | **P1** — this is the hard language rule (COPY-BRIEF §0), on the About page, in an H2 |
| F-30 | Informal `ihr/euch` register in FAQ questions: *"Arbeitet **ihr** nur in Bayreuth …?", "Könnt **ihr** bestehende Systeme übernehmen …?", "Was unterscheidet **euch** …?"* while every answer is in Sie-Form | `dist/index.html`, `dist/faq.html`, `dist/ueber-uns.html` | P2 |
| F-31 | Counting-up numbers, explicitly banned by COPY-BRIEF-3 §1.4 and §6 (*"keine hochlaufenden Zahlen"*) — `AnimatedNumber` animates every euro figure over 700 ms | `src/components/CostComparisonSection.tsx:23-41`, used at `:249, :255, :261, :391, :394, :403` | P2 |
| F-32 | Anglicism density in the un-passed cluster, against COPY-BRIEF §6 ("Avoid *our* tech terms") — rendered-text counts: `Conversion` 63, `Local SEO` 48, `Setup` 42, `Workflow` 37, `On-Page` 29, `Performance` 25, `Monitoring` 24, `Onboarding` 22, `Launch` 20, `Pagespeed` 13, `Scale-ups`, `Use Case`, `Channel-Manager`. Also inconsistent casing: `Go-live` (34) vs `Go-Live` (25). | all `webdesign-*`, `automatisierung-*`, city cluster pages | P3 |
| F-33 | Homepage H1 *"Digitale Systeme, die Unternehmen führen."* + *"Wir entwickeln operative KI-Strukturen, die Anfragen übernehmen, Prozesse steuern und **Wachstum automatisieren**."* — abstract, technology-first, no concrete outcome. COPY-BRIEF §7.1 requires the hero to name the concrete relief and forbids leading with the technology. | `dist/index.html` | P2 |

---

## 4. GENERIC / TEMPLATE COPY AND CITY SUBSTITUTION

### F-34 · City pages are template substitution, not local content
**KNOWN · P1 · blast radius: 30 city×service pages**

I compared each city triple line-by-line after normalising city names and adjectives (Bayreuth/Bayreuther → CITY). Literal duplication:

| Page family | identical-after-city-swap lines (Bayreuth vs Regensburg) | "unique" words per page |
|---|---|---|
| `webdesign-immobilien-*` | 100 of 142 | 36 % / 51 % / 40 % |
| `*/webdesign-kosten` | 92 of 130 | 49 % / 62 % / 46 % |
| `webdesign-gastronomie-*` | 85 of 142 | 62 % / 53 % / 54 % |
| `*/ki-telefonassistent` | 116 of 221 | 56 % / 57 % / 55 % |
| `*/website-relaunch` | 43 of 86 | 69 % / 75 % / 66 % |

But the "unique" figure **overstates the real variation**, because most non-identical lines are paraphrases of the same sentence. Side-by-side, `/bayreuth/website-relaunch` vs `/regensburg/website-relaunch` (`dist/`):

| Bayreuth | Regensburg |
|---|---|
| "Website-Analyse und Audit (Pagespeed, SEO, DSGVO)" | "Website-Audit: Pagespeed, SEO, DSGVO, Conversion" |
| "SEO-Migrationsplan: Weiterleitungen für alle relevanten URLs" | "SEO-Migrationsplan mit vollständigen 301-Weiterleitungen" |
| "On-Page SEO: vollständige Neuoptimierung aller Seiten" | "On-Page SEO: vollständige Neuoptimierung" |
| "DSGVO-Seiten vollständig neu: Impressum, Datenschutz, Consent" | "DSGVO-Seiten vollständig erneuert" |
| "Übergabe mit CMS und Schulung" | "CMS-Übergabe und Schulung" |
| "Design ist veraltet – potenzielle Kunden verlieren sofort das Vertrauen" | "Design veraltet: Regensburger Zielgruppe verliert sofort Vertrauen" |

Sections are in identical order with identical headings ("Typische Ausgangssituationen", "Was ein Relaunch mit Cogniiq umfasst", "Häufige Fragen", "Weiterführende Seiten"), and the price/duration boxes carry **identical** values ("3–8 Wochen", "ab ca. 2.000 €").

**Genuinely city-specific information per page: 1–3 sentences.** For `/regensburg/website-relaunch` the entire local content is: *"In Regensburg haben viele Betriebe Websites aus den Jahren 2015–2019"*, *"besonders problematisch bei touristischer Zielgruppe in Regensburg"*, and *"Besonders in der Gastronomie – einem der stärksten Wirtschaftssektoren in Regensburg"*. That is roughly **5 % genuinely local**, against COPY-BRIEF §7.3's floor of **40 %**.

`COPY-GAPS.md` §3 already concedes this: *"Konkretere lokale Gesundheitsstruktur-Daten (Praxisdichte o. Ä.) lagen nicht vor."*

**Fix (within constraints — no new location×service pages, no invented local facts):** COPY-BRIEF §7.3 already prescribes the answer — *"keep the page thin rather than padding it with filler."* Collapse the shared 60 % into components, cut each city page to the genuinely local material plus a link to the hub, and let the hub carry the depth. **Risk:** word counts fall; that is the intended outcome, not a regression. **Live-experiment overlap:** `/bayreuth/website-relaunch`, `/regensburg/website-relaunch`, `/bayreuth/webdesign`, `/muenchen/webdesign`, `/muenchen/webdesign-kosten` are live experiments — body restructuring should wait for the measurement window to close.

### F-35 · Template placeholder rendered to visitors
**KNOWN · P1 · blast radius: 3 pages**
*"…bei lokalen Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth', 'Zahnarzt Bayreuth' oder **'[Fachrichtung] Bayreuth'** deutlich verbessert."*
— `src/pages/WebdesignArztBayreuth.tsx:235`, `src/pages/WebdesignArztMuenchen.tsx:88`, `src/pages/WebdesignArztRegensburg.tsx:159`; rendered in `dist/webdesign-arzt-bayreuth.html`, `-muenchen`, `-regensburg`.
An unfilled placeholder in customer-facing body copy is the clearest possible signal of machine-generated template content, on pages selling professional web work.
**Fix:** name real specialities or delete the clause. **Risk:** none.

### F-36 · Keyword stuffing measurably above the brief's own limit
**KNOWN · P2 · blast radius: 30 cluster pages**
COPY-BRIEF §8.3: city name in H1, title, description, intro *"und 2–3 mal im Body. **Nicht mehr.**"* Measured occurrences in rendered body text (footer excluded):

| Page | City mentions | Body words | Density |
|---|---|---|---|
| `/regensburg/landingpage` | 33 | 428 | **7.7 %** |
| `/muenchen/lokales-seo` | 38 | 544 | 7.0 % |
| `/muenchen/webdesign-kosten` | 44 | 700 | 6.3 % |
| `/regensburg/webdesign` | 68 | 1 209 | 5.6 % |
| `/webdesign-arzt-regensburg` | 54 | 1 063 | 5.1 % |

Worst readable examples: *"Wer bei 'Klempner **Regensburg** express' oder 'Reinigung **Regensburg** buchen' eine fokussierte Landingpage hat…"* and *"Cogniiq entwickelt Landingpages mit Verständnis für die **Regensburger** Zielgruppe – mit optionalen Vor-Ort-Terminen in **Regensburg**."* (`dist/regensburg/landingpage.html`); *"Ihre Praxis-Website wird … bei lokalen Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth', 'Zahnarzt Bayreuth' oder '[Fachrichtung] Bayreuth' …"* (F-35 again). Reading a bare keyword list back to the visitor is the pattern COPY-BRIEF §8.3 calls *"instantly readable as inauthentic"*.

### F-37 · Constructed scenarios narrated with real outcomes
**KNOWN · P2 · blast radius: `/regensburg/webdesign`, `/bayreuth/webdesign`, `/bayern`, `/deutschland`, `/ki-agentur-deutschland`, `webdesign-*-*` pages**
Two different conventions coexist. The Arzt pages use the subjunctive correctly: *"**Angenommen**, eine Allgemeinpraxis in Bayreuth … **So könnte** die Rezeption sich auf Anliegen konzentrieren"* (`dist/webdesign-arzt-bayreuth.html`). The city hubs do not: *"Ein inhabergeführtes Hotel nahe dem Dom hat eine veraltete Website … Nach dem Website-Relaunch … **steigen** Direktbuchungen"*, *"Eine Zahnarztpraxis in **Regensburg West** findet sich … erst auf Seite 3. Durch eine neue Website … **verbessert sie ihre Sichtbarkeit deutlich**"* (`dist/regensburg/webdesign.html`). Section headers say "Beispielszenarien", but the results are narrated in the indicative as things that happened. COPY-BRIEF-2 §3.2 requires every instance of this pattern to be reframed as an explicit `Beispielkonfiguration` or removed.
**Fix:** apply the subjunctive convention already used on the Arzt pages, or drop the outcome sentence. **Risk:** none; this reduces UWG exposure.

---

## 5. DUPLICATED FAQ ANSWERS ACROSS ROUTES

### F-38 · Verbatim FAQ duplication (schema-level, exact Q **and** A)
**KNOWN · P3**
Eight question/answer pairs appear byte-identical on both `dist/index.html` and `dist/faq.html`:
"Was unterscheidet euch von einer klassischen Webdesign-Agentur?", "Was kostet ein Projekt mit euch?", "Wie läuft ein Projekt typischerweise ab?", "Wie schnell könnt ihr starten?", "Muss ich mich nach dem Launch um Technik und Wartung kümmern?", "Könnt ihr bestehende Systeme übernehmen und verbessern?", "Für welche Unternehmensgrößen seid ihr geeignet?", "Arbeitet ihr nur in Bayreuth und Regensburg?" (source: `src/components/FAQSection.tsx:10-55`).
This is the acceptable-duplication case (one component, two routes) but it means `/faq` adds no information over the homepage.

### F-39 · Near-verbatim FAQ duplication across the city triples
**KNOWN · P2**
Beyond the exact matches, each city triple repeats the same nine to twelve questions with only the city name swapped — e.g. "Was kostet ein Website Relaunch in **Bayreuth**/**Regensburg**?", "Wie lange dauert ein Relaunch?" (identical on both), "Wann ist ein Relaunch notwendig?" (identical on both), "Verliere ich meine bestehenden Google-Rankings beim Relaunch?" vs "Verliere ich meine Rankings beim Relaunch?". Same pattern across `webdesign-kosten`, `website-erstellen`, `landingpage`, `lokales-seo`, `automatisierung`, `ki-telefonassistent` — **roughly 300 near-duplicate FAQ entries** over 30 pages.

### F-40 · 82 % of all FAQ answers are invisible — they exist only in JSON-LD
**KNOWN · P1 · blast radius: 51 pages · this is the largest single content-loss defect on the site**

I compared every `FAQPage` `acceptedAnswer.text` against the visible HTML of the same file.

**496 FAQ answers in schema sitewide. 408 (82 %) are absent from the rendered HTML. 51 of 71 pages carrying FAQ schema are affected.**

Cause: the answer body is conditionally mounted. `src/components/FAQSection.tsx:201` renders `{isOpen && (<motion.div>…{faq.answer}…)}` — the answer element does not exist in the DOM until the visitor clicks. `src/components/ClusterPage.tsx:559-563` uses a Radix `AccordionContent`, which likewise unmounts closed content. `PageSEO` writes the answers into `application/ld+json` regardless.

Worst-affected pages (missing/total): every city cluster page 9–12 of 9–12; `dist/index.html` 8/8; `dist/faq.html` 8/8; `dist/kosten-webdesign.html` 8/8; `dist/webdesign-arzt-bayreuth.html` 7/7; `dist/ki-telefonassistent-hotel.html` 5/5. Notably **`dist/praxen.html` is 0/7** — the healthcare hub renders its answers correctly, proving the fix is available in-repo.

Three consequences:
1. **Content loss.** The most query-shaped, most answer-shaped content on the site — hundreds of first-party answers — is not in the crawled HTML. A `/regensburg/website-relaunch` page whose visible body is ~560 words is actually carrying another ~700 words of answers that nothing can read.
2. **Schema violation.** COPY-BRIEF §8.2: *"Never mark up content that isn't visible on the page."* Google's FAQ structured-data policy requires the marked-up content to be visible to the user. 408 violations.
3. **Query satisfaction.** A visitor who lands on a page and scans it sees a list of questions with no answers.

**Fix:** render answers in the DOM and hide them with CSS/height animation rather than unmounting (`hidden`/`max-height`, not conditional mount), matching whatever `/praxen` already does. **Risk:** low; layout only. **Live-experiment overlap:** affects experiment pages, but this is a defect fix, not a copy change — escalate to the coordinator so the SEO agent's measurement is not confounded.

---

## 6. QUERY-SATISFACTION GAPS

| # | Query family | Landing page | The question the searcher asked | What the page actually does | Sev |
|---|---|---|---|---|---|
| F-41 | *KI Telefonassistent Arztpraxis Kosten* | `/kosten-ki-telefonassistent` | "Was kostet das, und kann es teurer werden?" | **Answers it well** — cap before price, three tiers with quota, approximate call counts, setup fee, term, cancellation, "Was nicht extra kostet". This is the best-satisfying page on the site. Only defect: the 90 % framing sentence (F-01). | — |
| F-42 | *KI Telefonassistent Arztpraxis* | `/ki-telefonassistent-arzt` | "Kann das Termine in mein PVS buchen?" | The **title promises yes**, the body says **no** (F-05). The searcher's actual question is answered — honestly — but only after the page has already mis-set the expectation. | P1 |
| F-43 | *Webdesign Preise / Kosten + Stadt* | `/{stadt}/webdesign-kosten` | "Was kostet eine Website — konkret, und woraus setzt sich das zusammen?" | Gives three bands (ab 1.500 € / 2.800–5.500 € / 5.500–12.000 €+) but **never says what drives a project from one band to the next**, never breaks a price into components (Seitenzahl? Texte? Fotos? CMS? Migration?), and never states what is *not* included. The page's own FAQ *"Sind Hosting und Domain im Preis enthalten?"* is present but its **answer is invisible** (F-40). Net: a range without a method. | P2 |
| F-44 | *Website Relaunch + Stadt* | `/{stadt}/website-relaunch` | "Verliere ich meine Rankings? Wie lange dauert es? Lohnt es sich?" | All three questions appear as FAQ headings — **and all nine answers are invisible** (F-40, 9/9 missing on both Bayreuth and Regensburg). The visible body answers only "wann ist ein Relaunch sinnvoll" in generalities. | P1 |
| F-45 | *Webdesign Agentur* (1,696 impressions, position 76) | `/webdesign` | "Was bekomme ich, was kostet es, wie läuft es, kann ich Arbeit sehen?" | ~500 visible words, of which ~60 % is a link list of 30 other pages. No price, no process, no timeline that agrees with the rest of the site (F-06), no work shown, no named limitation. The H1 *"Websites, die ranken."* is an unsupported outcome promise (F-24c). | P1 |
| F-46 | *KI Telefonassistent Demo / anhören* | `/ki-telefonassistent/demo` | "Wie klingt das?" | Title: *"**Live-Vorführung** AI-Rezeptionistin"*, description: *"Testen Sie … live. **Hören Sie**, wie die AI-Rezeptionistin Anrufe annimmt"*. The page contains **no audio and no phone number** — it is a seven-field lead form with *"Wir melden uns in der Regel innerhalb von 24 Stunden"*. COPY-BRIEF-3 §3.6 requires the voice sample to be ungated: *"Kein Schritt außer dem letzten verlangt Kontaktdaten."* The page gates the one thing objection #1 needs, and its `<title>` promises the ungated version. | **P0** |

---

## 7. INFORMATION GAIN — and the first-party assets that exist in the repo but nowhere on the site

**This is the most valuable section of this audit.** The prior audit identified three assets (listenable demo, capped minute allowance, no-recording stance). Two of the three are already on the site; the demo is not (F-46). Searching the repository surfaced **substantially more genuine, verifiable, first-party material that is currently invisible to customers.**

### F-47 · The 16-phase go-live process exists in production code and is not on the site
**KNOWN · P1 opportunity · evidence: `src/lib/serviceOnboarding/catalog.ts:191-215`, `supabase/migrations/20260830121000_ai_receptionist_template_v1.sql` (477 lines)**

Cogniiq runs a formally defined AI-receptionist delivery process: **16 canonical phases**, stored as 20 template sections, displayed as 9 workspace tabs, scored across **10 readiness categories**, with a **server-enforced go-live gate** (`GATED_STATUSES`, `owner_engagement_go_live_blockers()` in SQL; `src/lib/serviceOnboarding/readiness.ts:1-30`).

The phases, verbatim from `catalog.ts`: Kundenprofil & Leistungsumfang · Bestandssysteme & Integrationsfähigkeit · Recht & Datenschutz · Datenschutz-Produktionsinfrastruktur · Workflow-Discovery · Wissensdatenbank · Golden Agent · Backend · Telefonie · Automatisierte Tests · Performance · Kundenabnahme (UAT) · Go-Live-Gate · Produktivsetzung · Monitoring erste Woche · Laufende Wartung.

The site shows **eight generic steps** ("Erstgespräch, Angebot, Unterschrift, Rechnung und Zugang, Ihre Vorgaben, Aufbau, Übergabe zur Freigabe, Testphase und Go-live") — a sales sequence, not the delivery process. COPY-BRIEF-2 §4.5 is explicit: *"Dieses Modul trägt das gesamte 'persönlich gebaut'-Versprechen. Adjektive können es nicht ersetzen."* The material to fulfil it already exists and is verifiable, because it is the system the business actually runs on.

### F-48 · The pre-go-live test battery — the strongest unused trust asset on this site
**KNOWN · P1 opportunity · evidence: `supabase/migrations/20260830121000_ai_receptionist_template_v1.sql`, task rows in sections `testing`, `uat`, `telephony`, `maintenance`**

Named, required, blocking checks that must pass before any practice goes live, verbatim from the migration:

- `Zugriffsversuch auf fremde Patientendaten abgewehrt`
- `Prompt Injection abgewehrt`
- `Korrekter Patient erkannt`
- `Notfall korrekt behandelt` · `Korrektes Eskalationsverhalten insgesamt`
- `Verärgerter Anrufer` · `Verwirrter oder vulnerabler Anrufer` · `Anrufer ändert seine Meinung`
- `Latenzmessung durchgeführt` · `Lasttest durchgeführt` · `Getestete Parallelität`
- `Empfangsteam hat getestet` · `Inhaber oder Leitung hat getestet` · `Feedback des Praxisteams eingeholt`
- `Kontrollierter Erstanruf` · `Nachtest durchgeführt`
- `Quartal: Failover erneut getestet` (`:441`)

**No competitor page in this market publishes anything like this.** It is exactly what COPY-BRIEF §14 identifies as the decisive market insight — failures happen *after* the call is answered — and it is uncomfortable-honest in the way COPY-BRIEF-2 §10 says builds trust. It requires no owner input and no new fact: it is a description of an existing internal artefact.

### F-49 · The fallback/outage path is defined internally and the site says nothing
**KNOWN · P1 opportunity · evidence: `..._ai_receptionist_template_v1.sql:209` `TEL-F009 'Failover-Ziel' — 'Wohin Anrufe laufen, wenn der Assistent nicht erreichbar ist'`; `:333-335` `Ausfallroute bei ElevenLabs-Störung` / `bei Cogniiq-Backend-Störung` / `bei Internet-/SIP-Störung`; `:338` `Failover getestet`; `:352` `n8n nicht erreichbar`; section `telephony` titled `Telefonie & Failover — 'Rufnummern, Routing und die Ausfallwege'` (`:56`)**

`COPY-GAPS.md` records objection #9 ("Meine Software fällt sowieso ständig aus") as unanswered, and `OWNER-INPUT.md` B9 as unanswered — but the process defines **three named failure routes, each a required go-live blocker, plus a quarterly re-test.** The answer exists; only the copy is missing. Note the migration also names the underlying vendors (ElevenLabs, n8n) — which is a sub-processor disclosure decision for the owner, tied to the HONESTY-AUDIT §7.7 block, not something to publish unilaterally.

### F-50 · The Anliegen-Katalog is a real 16-item configuration decision list, published only as prose
**KNOWN · P2 opportunity · evidence: `..._ai_receptionist_template_v1.sql:98-113` (`SCO-F001`–`SCO-F016`)**
`FAQ beantworten · Öffnungszeiten nennen · Anfahrt & Parken erklären · Terminverfügbarkeit nennen · Termin anlegen · Termin finden · Termin verschieben · Termin stornieren · Patienten-/Kundensuche · Rückruf anlegen · SMS-Bestätigung · E-Mail-Bestätigung · Weiterleitung an Menschen · Ausgehende Anrufe · Erinnerungen / Recall · Weitere Abläufe` — each a per-practice on/off decision. Plus `WFL-F002 'Grenze medizinischer Auskunft — Was der Assistent ausdrücklich NICHT beantworten darf'`, `WFL-F003 'Verbotene Themen'`, `WFL-F004 'Notfallprozedur — Wortlaut und Ablauf im Notfall'`. The site describes the catalogue in six bullets; the real thing is a 16-switch decision sheet the practice fills in. Publishing the actual list would let a practice owner see, before any call, exactly what they will be asked to decide.

### F-51 · § 203 StGB and the DSFA threshold analysis are go-live blockers, not marketing lines
**KNOWN · P2 opportunity · evidence: `..._ai_receptionist_template_v1.sql` fields `'§ 203 StGB: Bewertung'`, `'DSFA-Schwellwertanalyse: Ergebnis'` (*"Das Ergebnis der Bewertung — **nicht die Annahme, dass immer eine DSFA nötig ist**"*), `'DSFA: Begründung'`; tasks `'§ 203 StGB bewertet'`, `'DSFA-Schwellwertanalyse durchgeführt und dokumentiert'`, `'Freigabe: Notfallregeln'`**
`/datenschutz-sicherheit` already handles the DSFA question with exactly the right posture. What it does not say is that Cogniiq **runs and documents a threshold analysis per client as a blocking step** — which is materially stronger than the current "wir liefern die Unterlagen zu", and is directly evidenced.

### F-52 · The customer dashboard is a real product surface, mentioned once
**KNOWN · P2 opportunity · evidence: `src/pages/owner/` (Offers, OfferEditor, Invoices, InvoiceDetail, RevenueContracts, ServiceEngagement, CustomerDetail, DocumentSettings), `src/lib/clientPlatform/`, `supabase/migrations/20260731121000_client_provisioning_identity.sql`, `20260825064048_offer_recurring_pricing.sql`**
The pricing page says *"Zugang zum geschützten Kundendashboard: alle Daten, der Vertrag, der Leistungsumfang und die Kündigung mit einem Klick"* — one sentence for what is, in code, a full contract/offer/invoice/engagement platform with e-signature and per-customer document archive. "Kündigung mit einem Klick im Dashboard" is COPY-BRIEF-3 §3.3's second-strongest risk-reversal argument and it currently has no screenshot slot, no description, and no page.

### Information-gain verdict per target topic

| Topic | Does the site contain anything a competent competitor page does not? | The specific untapped first-party asset |
|---|---|---|
| **KI-Telefonassistent / KI-Rezeptionist** | **Yes, materially.** The named-limitations block, the "keine Aufzeichnung" stance framed as a decision rather than a gap, the capped-quota pricing with per-tier ceilings, the Two-Week Guarantee with a financial consequence. | The test battery (F-48), the failover routes (F-49), the 16-switch catalogue (F-50). |
| **Arztpraxen / healthcare** | **Yes.** The refusal to claim DSGVO conformity plus the six DSB questions (S2) is unique in this market. | §203/DSFA as blocking steps (F-51); the healthcare-only field/task flags in the template, which prove the healthcare path is a different process, not a different landing page. |
| **Webdesign / Website-Relaunch** | **No.** `/webdesign` is a link hub; the relaunch pages are interchangeable checklists. Nothing here that a template agency page lacks. | Nothing published: no before/after, no Core Web Vitals numbers from a real project, no migration method. The honest options are a documented method (how the 301 map is built and verified) or accepting thin pages. |
| **Automatisierung** | **No.** Generic workflow lists, contradictory pricing and durations (F-08, F-09). | `SERVICE_DEFINITIONS` in `catalog.ts:31-49` records `hasOnboarding: false` for automations, website and custom projects — i.e. **only the receptionist has a defined delivery process today.** Saying that plainly would be more differentiating than the current copy. |
| **Bayreuth** | **Marginal.** The one real local fact — Hauptsitz, Vor-Ort-Termine möglich — is genuine and is used (`dist/bayreuth/ki-telefonassistent.html`). Everything else is substitution. | Nothing further available; keep thin and honest per COPY-BRIEF §7.3. |
| **München** | **No.** *"Enterprise-Qualität ohne Münchner Agenturpreise"* is the only differentiator and it is a price claim with no substantiation. Remote-only is stated, which is honest. | None. |
| **Regensburg** | **No.** Tourism/university framing is generic and repeated across three unrelated services. | None. |

---

## 8. PRIORITISED FIX ORDER

**P0 — trust-destroying, fixable today with facts already in the repo**
1. F-01 · 90 % → 20 % in `telefonassistent-copy.ts:799` + guard test.
2. F-02 · retired 99/199–399/499 € tiers in `KiAgenturDeutschland.tsx:149`.
3. F-03/F-21 · 297 € "Fixpreis" on the homepage.
4. F-04 · integration promises in `blog-data.ts:181/192/227`, `CostComparisonSection.tsx:336-338`, `KiTelefonassistentHotel.tsx:14/79`, demo page.
5. F-46 · `/ki-telefonassistent/demo` title/description promise audio the page does not have.

**P1**
6. F-40 · render the 408 hidden FAQ answers (one component change, two files).
7. F-05 · escalate the `/ki-telefonassistent-arzt` metadata defect to the coordinator (live experiment).
8. F-06/F-07 · one delivery time per product, or none.
9. F-29 · du-form on `/ueber-uns`.
10. F-35 · `[Fachrichtung]` placeholder on three pages.
11. F-16/F-17/F-19 · apply the site's own "unbelegte Zusagen werden entfernt" rule to the AVV, §203 and 7–14-Tage claims.
12. F-47/F-48/F-49 · write the real process, the test battery and the failover paths. **Highest-value new content on this site, and it needs no new facts.**
13. **Coordinator note:** `/integrationen` and `/datenschutz-sicherheit` are `noindex, nofollow` (verified in `dist/`). The two pages carrying the site's only genuine information gain are invisible to search and pass no internal link equity. Content-side recommendation: index them. Routing/indexability decision belongs to the SEO agent.

**P2/P3** — F-08 to F-13, F-22 to F-28, F-30 to F-34, F-36 to F-39, F-43, F-45, F-50 to F-52.

---

## 9. METHOD AND LIMITS

- Visible text extracted from all 93 `dist/*.html` files with a script written to the scratchpad (`extract.py`); FAQ schema-vs-visible comparison and city-page similarity measured with `faq.py` and `sim.py` in the same directory. No repository file was created or modified.
- City "uniqueness" percentages are **string-level** and therefore an upper bound on real informational uniqueness; F-34 shows the qualitative reality.
- I did not verify whether any claim is *true in the world* — only whether the site contradicts itself, or asserts something the project's own `COPY-CLAIMS-TO-VERIFY.md` / `OWNER-INPUT.md` records as unconfirmed.
- I did not re-derive the SEO baseline, and I have not proposed rewording inside live experiments; F-05 and F-40 are flagged as defects for coordinator escalation, not as copy proposals.
- Not assessed: the `/app`, `/owner`, `/admin` authenticated surfaces (out of scope, and protected per AUDIT-CONTEXT).
