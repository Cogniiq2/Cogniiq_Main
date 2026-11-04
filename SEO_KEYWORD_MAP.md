# SEO_KEYWORD_MAP — Keyword-to-URL ownership (Stand 2026-10-23)

Rule (from `docs/seo/ARCHITEKTUR.md`): **one search intent → one page that may own it.**
Supporters link to the owner; nobody else targets the head term in title or H1.

GSC columns: figures marked **(brief)** come from the owner's summary of the latest 28-day export
(9 clicks · 6,448 impressions · CTR 0.14 % · Ø pos. 35.9); figures marked **(09/2026)** come from the
Search-Console snapshots stored in `docs/seo/organic-growth-scoreboard.md` (windows ending 2026-09-08,
-11 and -14). The raw export was not available in this session (see `SEO_AUDIT_2026.md` §2), so no
figure below was recomputed from files. Re-run `node scripts/seo/gsc-analyze.mjs <export-dir>` once
the export is in the repo-adjacent folder.

Status legend: **STRENGTHENED** (changed in this run) · **LEFT** (deliberately untouched) ·
**RETARGETED** · **CONSOLIDATED** (301) · **BLOCKED** (needs owner input) · **WATCH**.

---

## 1 · KI-Telefonassistent (business priority 1–3)

| URL | Purpose | Primary intent | Primary keyword family | Secondary terms | Current GSC signals | Action | Internal-link sources (contextual) | Status |
|---|---|---|---|---|---|---|---|---|
| `/ki-telefonassistent` | Flagship pillar, industry-open | commercial + informational head term | ki telefonassistent · telefonassistent · ki telefonservice · ki telefonzentrale · ki anrufassistent | was ist ein ki-telefonassistent, ki telefonassistent für unternehmen, grenzen, anbieter vergleichen | 272 impr. · pos. ~40 (brief); 153 impr. pos. 32.7 on "ki telefonassistent" (09/2026) | Links into `/praxen` + industry cards; description ≤158; open-claim FAQ removed; title/H1/body otherwise untouched (A5 window) | 33 pages (highest on domain); nav + footer | STRENGTHENED (links only) |
| `/kosten-ki-telefonassistent` | Cost page (KOSTEN owner) | commercial-investigational | ki telefonassistent kosten · ki telefonassistent preise · was kostet ein ki-telefonassistent | preis pro minute, preismodelle, setup-kosten, versteckte kosten, anbieter fragen | 299 impr. · pos. ~19 (brief); "ki telefonassistent kosten" 143 impr. pos. 19, "…preise" 33 impr. pos. 18 (brief) | Market pricing-model table (pattern-based, no vendors/figures), "Fragen an jeden Anbieter", generic layer "Gilt das auch außerhalb von Praxen?", 3 FAQs (pro Minute, versteckte Kosten, kleine Praxis), honest hero sentence, links to Zahnarzt/Einführung. Title/H1 unchanged. Praxis framing (breadcrumb, schema, tariff names) kept — **Q3 BLOCKED** until owner says whether tariffs apply to every business | 14 pages; nav "Preise" + footer | STRENGTHENED |
| `/ki-telefonassistent-zahnarztpraxis` | Dental operative guide (page 1) | informational-operational | ki telefonassistent zahnarztpraxis · telefonassistent zahnarzt | schmerzpatienten, recall, absagen, behandlungszeit, notdienst | 85 impr. · pos. 8.9 (brief) | **Protected**: title/H1/body structure untouched. Added: AVV + § 203 sentences, cost paragraph with link, inbound links from flagship, cost page, Arzt page, nav slot | 2 → 6 pages (flagship, Arzt, cost, praxen, einfuehren, automatisierung-arzt) + nav + footer | STRENGTHENED (additive only) |
| `/ki-telefonassistent-arzt` | Doctor segment page (owner of Arztpraxis intent, F3 decided) | commercial | ki telefonassistent arztpraxis · telefonassistent arztpraxis · telefonassistent arzt · ki telefonassistent arzt | akuttermin, rezeptbestellung, überweisung, befund, krankschreibung, praxissoftware, schweigepflicht | 471 impr. · pos. ~35 (brief); "ki telefonassistent arztpraxis" 111 impr. pos. 40, "telefonassistent arztpraxis" 83 impr. pos. 34, "telefonassistent arzt" 42 impr. pos. 26 (brief) | Graduated and rebuilt as a standalone page: Arzt-specific call-reason catalogue (9 Anlässe × 4 rules), Akut/Routine boundary, Rezept/Überweisung section, PVS check, Grenzen, Datenschutz, cost, FAQ (8, FAQPage schema), Service schema. Title 58 ch, description 151 ch | 14 pages; footer "Arztpraxen im Detail"; **new nav slot**; blog `weiterfuehrend` | STRENGTHENED (rebuilt) |
| `/praxen` | Hub for all practice types + full product chain | commercial (segment pillar) | ki telefonassistent praxis · praxisempfang telefon · telefonassistent praxis | für arzt-, zahnarzt- und therapiepraxen; einrichtung; testphase; preise | weak (09/2026: queries fall on `/ki-telefonassistent-arzt` instead) | H1 now carries the keyword ("KI-Telefonassistent für Praxen: ein Empfang am Telefon, der Anliegen erledigt"); scene kept as eyebrow; description 157 ch | 11 pages + nav + footer | STRENGTHENED |
| `/ki-telefonassistent-praxis` | Therapy practices (Physio/Ergo/Logo) | commercial | ki telefonassistent physiotherapie · telefonassistent therapeuten · telefonassistent praxis (therapie) | heilmittel, behandlung ohne empfang, rückrufliste | 514 impr. (3M) → **1** (28D) by 09/2026 — Google removed it from the doctor intent | **RETARGETED**: manifest title/description now match the body (Therapiepraxen), ending the three-way head conflict (title "medizinische Praxen" / desc "Arzt- und Facharztpraxen" / H1 Therapeuten). Consolidation candidate if therapy demand does not appear within 90 days (needs Query×Page export) | 7 pages | RETARGETED · WATCH |
| `/ki-telefonassistent-einfuehren` | Implementation guide | informational | ki telefonassistent einführen · telefonassistent praxis einführen | checkliste, testen, freigabe, erste woche | new (09/2026), no visibility yet | Inbound links added from Arzt page and cost page | 4 → 6 pages + footer | STRENGTHENED (links) |
| `/blog/ki-telefonassistent-arztpraxis` | Editorial, team/system boundary | informational | telefon arztpraxis · was bleibt beim team | rezept, befund, akuttermin | — | **RETARGETED** away from the Arzt head term (H1/title no longer "KI-Telefonassistent für Arztpraxen"); publication date corrected to first verifiable date; `weiterfuehrend` → Arzt page, cost page, Einführung; restaurant cross-link removed | 5 pages | RETARGETED |
| `/verpasste-anrufe-verlust` | Problem page | problem-aware informational | verpasste anrufe kosten unternehmen · verpasste anrufe | erreichbarkeit, stoßzeiten | pos. 11.2 (09/2026) — closest page-1 candidate | Unsupported claims removed ("ohne Mehrkosten", unsourced share); title/H1 untouched (M2 window). Body is 375 words — content expansion is the next step once M2 is evaluated | 22 pages | STRENGTHENED (honesty) · WATCH |
| `/keine-terminbuchung-online` | Problem page (webdesign booking) | problem-aware | keine online terminbuchung | terminbuchung website, erinnerungen | low | Absolutes removed; description rewritten | 18+ pages | STRENGTHENED (honesty) |
| `/ki-telefonassistent-restaurant`, `/ki-telefonassistent-hotel` | Industry segments | commercial | ki telefonassistent restaurant / hotel | reservierungen, rezeption | low | Template chips fixed ("Einrichtung in Tagen" → "Übergabe in zwei Wochen"), 15-Minuten claim removed | nav + footer | LEFT (hygiene only) |
| `/bayern/ki-telefonassistent`, `/{bayreuth,muenchen,regensburg}/ki-telefonassistent` | Geo segments | local commercial | ki telefonassistent bayern / <stadt> | — | low | Open-claim FAQs removed (Ausfall, Startphase) | 24 pages each | LEFT (hygiene only) |
| `/ki-telefonassistent/demo` | Form page | transactional | — | — | — | — | nav | LEFT |
| `/integrationen`, `/datenschutz-sicherheit` | Noindex evidence pages | — | — | — | — | Stay noindex until OWNER-INPUT B/C are answered | — | BLOCKED |

**Unoccupied, deliberately:** "ki telefonassistent dsgvo" (needs source verification), "ki telefonassistent pvs / schnittstelle" (blocked on vendor documentation), "ki telefonassistent vergleich" (not pursued — a vendor comparing itself).

## 2 · Prozessautomatisierung (priority 4–5)

| URL | Purpose | Primary intent | Keyword family | Secondary | GSC | Action | Sources | Status |
|---|---|---|---|---|---|---|---|---|
| `/prozessautomatisierung` | Pillar | commercial | prozessautomatisierung · geschäftsprozesse automatisieren · ki automatisierung unternehmen | workflow automatisierung, agentur | pos. ~57 on "…agentur" (09/2026) | Untouched (M23 window). Q1 (entity sentence, Kundenservice pattern) still pending the day-28 review | 24 pages + nav + footer | LEFT |
| `/kosten-automatisierung` | Cost page | commercial-investigational | automatisierung kosten · was kostet prozessautomatisierung | kostentreiber, wirtschaftlichkeit | 5 cost queries pos. 11–20.5 (09/2026) | Untouched | 11 pages | LEFT · WATCH |
| `/automatisierung-arzt` | Segment | commercial | automatisierung arztpraxis · praxis automatisierung | terminbestätigung, erinnerungen, warteliste | — | Title retargeted off "Terminbuchung" (K9 overlap with the phone page); absolutes and invented prices/durations removed; restaurant link replaced by Zahnarzt link | 13 pages + nav | RETARGETED |
| `/automatisierung-immobilien` | Segment | commercial | automatisierung immobilienmakler | exposé, besichtigung | pos. ~20 (brief) | Untouched; anchor text 63 % exact-match — diversify in a later pass | 8 pages + nav | LEFT · WATCH |
| `/automatisierung-restaurant`, `/automatisierung-sport` | Segments | commercial | automatisierung gastronomie / fitnessstudio | — | low | Untouched | 4–8 pages | LEFT |
| `/{stadt}/automatisierung` | Geo segments | local | automatisierung <stadt> | — | low | Invented price/duration/ROI FAQ answers replaced | 24 pages each | STRENGTHENED (honesty) |
| `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen` | Problem pages | problem-aware | manuelle arbeit automatisieren | — | low | Untouched | — | LEFT |
| `/blog/prozessautomatisierung-roi` | Editorial | informational | prozessautomatisierung roi | amortisation | frage-query pos. ~8 (09/2026) | Untouched | — | LEFT |

## 3 · Webdesign (priority 6)

| URL | Purpose | Intent | Keyword family | GSC | Action | Status |
|---|---|---|---|---|---|---|
| `/webdesign` | National pillar | commercial | webdesign agentur · webdesign für unternehmen · website erstellen lassen | 0 impressions since 2026-09-01 (09/2026) | Untouched (M5 window); now the **only** national webdesign URL | LEFT |
| `/webdesign-agentur-deutschland` | Duplicate pillar | — | — | 5 impr., branded (09/2026) | **301 → `/webdesign`** (F9, decided 2026-09-13, executed now) | CONSOLIDATED |
| `/webdesign-hotel` | Industry segment | commercial | webdesign hotel · hotel webdesign · internetagentur hotel | 1,184 impr. · pos. 18 (brief) | Untouched (M1 window). The domain's largest impression source sits here; it is not the business priority but it is real demand — leave it alone, do not feed it more links | LEFT · WATCH |
| `/kosten-webdesign` | Cost page | commercial-investigational | webdesign kosten · was kostet eine website | — | Untouched (M6) | LEFT |
| `/{stadt}/website-relaunch` (3) | Local relaunch | local commercial | website relaunch <stadt> | Regensburg pos. 11–12 (brief/09/2026), Bayreuth pos. 14 | Graduated. **Heads untouched** (Regensburg is page-1 adjacent); only the unverified price/duration figures in TL;DR and FAQ were removed (Bayreuth, München, Regensburg) | STRENGTHENED (honesty) · WATCH |
| `/{stadt}/webdesign` (3) | Local | local commercial | webdesign <stadt> | Regensburg 310 impr. pos. 55 (09/2026) | Bayreuth graduated: FAQ prices/durations, "2 Sekunden", vendor list, hosting sentence, result-promising scenarios cleaned (D1–D7 pattern) | STRENGTHENED (honesty) |
| `/{stadt}/webdesign-kosten` (3) | Local cost | local | webdesign kosten <stadt> | München 268 impr. pos. 37 (09/2026) | München graduated: "350 €/Monat" and durations removed. The remaining price tables on all three (14–16 € figures each) are **owner decision W4**: confirm the ranges or give them the `/kosten-webdesign` treatment | BLOCKED |
| `/webdesign-arzt|gastronomie|immobilien|sport`, `/webdesign-{branche}-{stadt}` (9) | Segments | commercial | webdesign <branche> (<stadt>) | low | Untouched | LEFT |
| `/{stadt}/website-erstellen`, `/{stadt}/landingpage`, `/{stadt}/lokales-seo` (9) | Micro pages | local | — | no Query×Page evidence | Untouched; merge decision (F4) **needs the export** | WATCH |

## 4 · Brand, hubs, service

| URL | Intent | Action | Status |
|---|---|---|---|
| `/` | brand + entity | Static duplicate JSON-LD removed; Organization description without "hochkonvertierend"; title untouched (positioning decision pending) | STRENGTHENED (technical) |
| `/leistungen`, `/deutschland`, `/bayern`, `/{stadt}` | hubs | Untouched (M8 window for city hubs) | LEFT |
| `/ueber-uns`, `/kontakt`, `/faq`, `/impressum`, `/datenschutz` | service | "/kontakt" description without unconfirmed "30 Minuten" | LEFT |
| `/blog/*` (10) | editorial | 7 stale "2025" titles removed with real `updatedAt`; all `publishedAt` set to the first verifiable date (2026-03-16) | STRENGTHENED (trust) |

## 5 · Query → owner quick index

| Query family | Owner | Supporters | Must not compete |
|---|---|---|---|
| ki telefonassistent (head) | `/ki-telefonassistent` | all cluster pages, blog | — |
| ki telefonassistent kosten / preise / was kostet | `/kosten-ki-telefonassistent` | flagship (calculator), all segment pages, blog | flagship (no tariff table) |
| ki telefonassistent arztpraxis / telefonassistent arzt | `/ki-telefonassistent-arzt` | `/praxen`, Zahnarzt page, Einführung, blog, cost page | blog (retargeted), `/ki-telefonassistent-praxis` (retargeted) |
| ki telefonassistent zahnarztpraxis | `/ki-telefonassistent-zahnarztpraxis` | `/praxen`, Arzt page, cost page, flagship, nav | — |
| ki telefonassistent praxis / praxisempfang | `/praxen` | nav, footer, all practice pages | — |
| telefonassistent physiotherapie / therapeuten | `/ki-telefonassistent-praxis` | `/praxen`, cost page | — |
| ki telefonassistent einführen | `/ki-telefonassistent-einfuehren` | Arzt, Zahnarzt, cost, praxen | — |
| verpasste anrufe kosten | `/verpasste-anrufe-verlust` | blog, city pages | — |
| prozessautomatisierung | `/prozessautomatisierung` | blog, problem pages, nav | — |
| automatisierung kosten | `/kosten-automatisierung` | pillar, blog | `/muenchen/automatisierung` (K7, watch) |
| automatisierung arztpraxis | `/automatisierung-arzt` | Arzt phone page | phone page (title no longer says Terminbuchung) |
| webdesign agentur / webdesign für unternehmen | `/webdesign` | everything | former duplicate (301) |
| webdesign hotel | `/webdesign-hotel` | pillar, cost page | — |
| website relaunch <stadt> | `/{stadt}/website-relaunch` | pillar | — |
