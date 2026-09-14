# Herkunftsprüfung aller kommerziellen Zahlen und Zusagen im Webdesign-Cluster

Angelegt: 2026-09-13 · Branch `claude/webdesign-recovery-max-2026-09-13`
· Basis-Commit `56707c2` (origin/main) + PR #95 (`3c54634`) · Gegenstand: jede
Zahl mit Geldbezug, Zeitzusage oder Ergebniszusage, die vor diesem Durchgang
auf `/webdesign`, `/webdesign-agentur-deutschland`, `/kosten-webdesign`,
`/bayreuth/lokales-seo`, `/regensburg/webdesign` oder `/muenchen/webdesign` stand.

Dieselben vier Klassen und derselbe Grundsatz wie in
`preisaudit-automatisierung.md`: **OWNER-CONFIRMED · SYSTEM-CONFIRMED ·
EXTERNAL-SOURCED · UNSUPPORTED**. Eine unbelegte Verkaufszahl wird nicht dadurch
belegt, dass sie rankt. Sie wird entfernt — und **nicht durch eine andere
erfundene Zahl ersetzt**.

## Ausgangslage: es gibt keine bestätigte Webdesign-Preisquelle

- `OWNER-INPUT.md` enthält **keine** Webdesign-Preisfrage; Gruppe A deckt
  ausschließlich den Telefonassistenten.
- `COPY-CLAIMS-TO-VERIFY.md` **Z12** führt die Webdesign-Beträge ausdrücklich als
  offen; **Z6** hält die Webdesign-Projektdauer „7–14 Tage" als unbestätigt fest
  und verlangt ihre Entfernung, wenn sie nicht bestätigt wird.
- `docs/preis-wahrheitstabelle.md` deckt ausschließlich den Telefonassistenten.

Damit ist die Klassifizierung unten in fast allen Zeilen vorentschieden.

## A · `/kosten-webdesign` (vorher, `CostPage`-Konfiguration)

| # | Aussage | Ort | Klasse | Entscheidung |
|---|---|---|---|---|
| A1 | Einfach **ab 1.500 €** | `priceRanges[0]` | **UNSUPPORTED** | entfernt |
| A2 | Mittelstand **2.500 – 5.000 €** | `priceRanges[1]` | **UNSUPPORTED** | entfernt |
| A3 | Premium **ab 5.000 €** | `priceRanges[2]` | **UNSUPPORTED** | entfernt |
| A4 | Handwerksbetrieb Bayreuth **1.800 – 2.400 €** | `exampleProjects[0]` | **UNSUPPORTED** | entfernt |
| A5 | Arztpraxis München **3.500 – 5.000 €** | `exampleProjects[1]` | **UNSUPPORTED** | entfernt |
| A6 | Gastronomie Regensburg **2.800 – 4.200 €** | `exampleProjects[2]` | **UNSUPPORTED** | entfernt |
| A7 | Mittelstand deutschlandweit **ab 7.500 €** | `exampleProjects[3]` | **UNSUPPORTED** | entfernt |
| A8 | Einsteiger-Website „beginnt bei **ca. 1.500 €**" | FAQ | **UNSUPPORTED** | entfernt |
| A9 | Wartung „**ab ca. 50–150 €/Monat**" | FAQ | **UNSUPPORTED** | entfernt — ersetzt durch „Umfang und Preis stehen gesondert im Angebot" |
| A10 | Local SEO „**ca. 500–2.000 €** einmalig" | FAQ | **UNSUPPORTED** | entfernt |
| A11 | Terminbuchung „**ca. 800–2.500 €** zusätzlich" | FAQ | **UNSUPPORTED** | entfernt — ersetzt durch Schnittstellenprüfung vor dem Angebot |
| A12 | Texterstellung „**ca. 80–150 € pro Seite**" | FAQ | **UNSUPPORTED** | entfernt |
| A13 | „Angebote … **30 Tage gültig**" | FAQ | **UNSUPPORTED** (keine Vertragsquelle) | entfernt |
| A14 | „Ratenzahlung: Anzahlung, Zwischenzahlung, Rest bei Go-Live" | FAQ | **UNSUPPORTED** | entfernt |
| A15 | Baukasten-Vergleich: „keine laufenden Gebühren, rankt besser und konvertiert messbar mehr" | FAQ | **UNSUPPORTED** (Ergebniszusage) | ersetzt durch Abwägung ohne Ergebnisbehauptung |
| A16 | `Offer.price` = Staffel-Strings im Schema | `CostPage` JSON-LD | **UNSUPPORTED** | Offer-Block entfernt; das neue Service-Schema führt keinen Preis |
| A17 | „Cogniiq entwickelt ausschließlich individuell – kein Copy-Paste" | `priceFactors[1]` | **UNSUPPORTED** („100 % custom"-Klasse) | entfernt |
| A18 | Titel „Webdesign Kosten **2025**" | Manifest | veraltet, kein Jahresdatensatz | Jahr entfernt (immergrün), nicht auf 2026 gebumpt |

## B · `/webdesign-agentur-deutschland` (Konsolidierung beschlossen, aufgeschoben — F9)

| # | Aussage | Klasse | Entscheidung |
|---|---|---|---|
| B1 | „Websites starten **ab 1.500 €** … typischerweise **2.500–5.000 €**" | **UNSUPPORTED** | nicht übernommen |
| B2 | „Einfachere Websites: **4–6 Wochen**. Unternehmenswebsites: **6–10 Wochen**. Komplex: **10–14 Wochen** … und eingehalten" | **UNSUPPORTED** (Z6-Klasse) | nicht übernommen |
| B3 | „Mobile-First, **Ladezeit unter 2 Sekunden**" | **UNSUPPORTED** (Messwert ohne Messung) | nicht übernommen |
| B4 | „**A/B-getestete** Seitenstrukturen" | **UNSUPPORTED** (Prozessbehauptung ohne Beleg) | nicht übernommen |
| B5 | „React/Next.js … WordPress … statische Generatoren" als Technikliste | **UNSUPPORTED** (Herstellerliste als Zusage) | ersetzt durch Entscheidungsregel (Redaktionssystem vs. statisch) ohne Herstellernamen |
| B6 | „Websites, die **nachweislich besser ranken und mehr konvertieren** als das, was die meisten Agenturen liefern" | **UNSUPPORTED** (Ranking- und Conversion-Zusage, Wettbewerbsvergleich) | nicht übernommen |
| B7 | „Kein Team von 30 Personen" / „Kein Münchner Agenturoverhead" | Wettbewerbsvergleich | nicht übernommen |
| B8 | „Millionen Websites in Deutschland ranken nie auf Seite 1" | **UNSUPPORTED** (Statistik ohne Quelle) | nicht übernommen |
| B9 | „Ja, vollständig remote. Persönliche Termine im Raum Bayern" | konsistent mit `BUSINESS_INFO` (Sitz Bayreuth) | sinngemäß **übernommen** (FAQ „Betreut Cogniiq Unternehmen in ganz Deutschland?") |
| B10 | „Die Website gehört vollständig Ihnen" / Wartung optional | Prozessaussage ohne Betrag | sinngemäß **übernommen** |
| B11 | Vier „Beispielszenarien" (Arztpraxis, Restaurant, Handwerk, Makler) mit Vorgehen | als Szenarien gekennzeichnet, keine Kundenprojekte | nicht übernommen (Branchenseiten decken das) |

**Was in den Pillar überging:** die Struktur (Leistungsbild, Ablauf,
Branchen-/Standortverweise, FAQ-Themen), nicht die Substanz. Von 1.158 Wörtern
wurde kein Absatz kopiert. **Die Seite selbst bleibt vorerst unverändert live**
(Inhaber-Review 13.09.2026): Sie trägt Anker in zwei eingefrorene Experimente,
und die 301 wartet auf deren Graduierung. B1–B8 stehen bis dahin öffentlich —
als bekannte, dokumentierte Altlast, nicht als Freigabe.

## G · Zweiter Durchgang 13.09.2026 — neue Aussagen der neuen Seiten

Klassen: **GENERIC PRINCIPLE** (bleibt), **UNSUPPORTED COGNIIQ COMMITMENT**
(korrigiert), **OVER-ABSOLUTE GENERALIZATION** (korrigiert).

| # | Seite | Aussage (vorher) | Klasse | Jetzt |
|---|---|---|---|---|
| G1 | `/webdesign` | „Fehlende Inhalte sind der häufigste Grund, warum ein Website-Projekt stillsteht" | OVER-ABSOLUTE | „können ein Website-Projekt ausbremsen" |
| G2 | `/webdesign` | „Ein Baukasten löst das günstiger" | OVER-ABSOLUTE | „kann … die wirtschaftlichere Lösung sein" |
| G3 | `/webdesign` | „Ein Neubau riskiert nichts, was Sie haben" | OVER-ABSOLUTE (Backlinks, Direktzugriffe, indexierte URLs) | Migrationsrisiko „geringer", Prüfung vor Neubau |
| G4 | `/webdesign` | „Relaunch mit Weiterleitungsplan der sichere Weg — Signale werden mitgenommen" | OVER-ABSOLUTE | „möglichst zu erhalten. Vollständig garantieren lässt sich ihre Übertragung nicht." |
| G5 | `/webdesign` | „Cookies und Tracking laufen erst, wenn jemand zugestimmt hat" | OVER-ABSOLUTE (notwendige Speicherung) | „Nicht notwendiges Tracking wird erst nach … Einwilligung aktiviert" |
| G6 | `/webdesign`, `/kosten-webdesign` | Barrierefreiheitsmerkmale „gehören zur Umsetzung" | UNSUPPORTED COMMITMENT (Pauschalumfang) | „entsprechend dem vereinbarten technischen Umfang" |
| G7 | `/webdesign` | „Jede Seite bekommt …", „… dass Google jede Seite erreicht" | OVER-ABSOLUTE | ohne „jede", Umfang laut Angebot |
| G8 | `/webdesign` | „die erste sichtbare Fläche wird ohne Wartezeit auf Skripte gezeichnet" | OVER-ABSOLUTE | als Grundsatz, mit Abhängigkeit von Hosting/Inhalt/Gerät |
| G9 | `/webdesign` | „jede alte Adresse auf ihren neuen Eigentümer, ohne Ketten" | OVER-ABSOLUTE | „alte Adressen …, möglichst ohne Ketten" |
| G10 | `/webdesign` | „Messung und Indexierung nach dem Start kontrolliert" | UNSUPPORTED COMMITMENT | „geprüft, soweit vereinbart" |
| G11 | `/webdesign` | „Die Grundlagen … gehören zu jedem Projekt" (FAQ SEO) | UNSUPPORTED COMMITMENT | „können Bestandteil des vereinbarten Umfangs sein; der konkrete Umfang steht im Angebot" |
| G12 | `/webdesign` | „Domain, Hosting und Redaktionssystem laufen auf Ihren Namen", „Sie erhalten die Zugänge" | UNSUPPORTED COMMITMENT (Eigentumspolitik) | „wird im Angebot festgelegt" |
| G13 | `/webdesign`, `/kosten-webdesign` | Anbindung „mit Ihren echten Daten getestet und dokumentiert" | UNSUPPORTED COMMITMENT | „getestet und beschrieben, nach Möglichkeit mit realen Testfällen" |
| G14 | `/kosten-webdesign` | „Zwanzig Leistungsseiten nach einer Vorlage kosten weniger als fünf Seiten …" | OVER-ABSOLUTE (Zahlen) | ohne Zahlen, „Entscheidend ist der konkrete Aufbau" |
| G15 | `/kosten-webdesign` | „Domain und Hosting — auf Ihren Namen" | UNSUPPORTED COMMITMENT | „wer die Verträge hält, wird im Angebot festgelegt" |
| G16 | `/kosten-webdesign` | „… kein Bestandteil des Projektpreises. Betreuung ist eine Option" (zweimal) | UNSUPPORTED COMMITMENT | „ergibt sich aus dem konkreten Angebot" |
| G17 | `/kosten-webdesign` | „Die Struktur und das Setzen Ihrer Inhalte ja" | UNSUPPORTED COMMITMENT | „Welche Inhaltsleistungen enthalten sind, wird im Angebot festgelegt" |
| G18 | `/kosten-webdesign` | „… ist bei einer gefundenen Website unverzichtbar", „nur richtig, wenn", „reicht ein Baukasten", „meist günstiger", „Bruchteil des Aufwands" | OVER-ABSOLUTE | abgeschwächt („sollte", „passt meist", „kann genügen", „kann wirtschaftlicher sein") |

Bleibt als GENERIC PRINCIPLE: Redaktionssystem vs. statisch, Preistreiber-Logik,
einmalig/laufend, Relaunch-Prüfliste als Vorgehen, „Rankings vergibt Google",
Schnittstellenprüfung vor dem Angebot, Sitz Bayreuth/remote (`BUSINESS_INFO`).

## C · `/webdesign` (vorher, 578 Wörter)

| # | Aussage | Klasse | Entscheidung |
|---|---|---|---|
| C1 | Titel „**Hochkonvertierende** Websites" | **UNSUPPORTED** (gemessene Ergebniszusage) | ersetzt durch „Websites für Unternehmen"; im Körper „konversionsorientiert"/„mit klarem Auftrag" |
| C2 | Description „Websites, die bei Google **ranken**" | **UNSUPPORTED** (Ranking-Zusage; ARCHITEKTUR §7 hatte sie bereits gerügt) | entfernt |
| C3 | „**Go-Live in 7–14 Tagen**" (Hero) und „Einfache Unternehmenswebsites gehen in **7–14 Tagen** live … **3–6 Wochen**" (FAQ) | **UNSUPPORTED** (Z6) | entfernt; Ablauf nennt keine Dauern |
| C4 | „**Ladezeit unter 2 Sek.**" | **UNSUPPORTED** | entfernt; Core Web Vitals „als Prüfmaß, nicht als Garantie" |
| C5 | „Wir arbeiten mit **Festpreisen** – keine versteckten Kosten" | **UNSUPPORTED** (Vertragsaussage ohne Quelle) | entfernt |
| C6 | „Wir modernisieren bestehende Websites **ohne Rankingverlust**" | **UNSUPPORTED** (Ranking-Garantie) | ersetzt durch Prüfliste „senkt das Risiko, garantiert kein Ergebnis" |
| C7 | „Wir bauen **keine Templates** … Jede Website wird individuell entwickelt" | **UNSUPPORTED** („no templates"-Klasse) | entfernt |
| C8 | „Technisches SEO und On-Page Optimierung sind **immer inklusive**" | Umfangszusage | abgeschwächt: Grundlagen gehören zu jedem Projekt, laufende SEO-Arbeit gesondert; „Der konkrete Umfang wird im Angebot festgelegt" |
| C9 | 15 Anker „Lokales SEO <Stadt>", „Landingpage <Stadt>", „Website erstellen <Stadt>" u. a. | keine Aussage, aber Query-Verschmutzung | entfernt; Stadtseiten mit Ortsnamen verlinkt |

## D · Stadtseiten (nicht eingefroren)

| # | Route | Aussage | Klasse | Entscheidung |
|---|---|---|---|---|
| D1 | `/regensburg/webdesign` | FAQ „**4–6 Wochen** … **8–12 Wochen**" | **UNSUPPORTED** | ersetzt durch Zeitplan nach Erstgespräch |
| D2 | `/regensburg/webdesign` | FAQ „**ab ca. 1.500 €** … **2.500–5.000 €**" | **UNSUPPORTED** | ersetzt durch Preistreiber + Verweis Kostenseite |
| D3 | `/regensburg/webdesign` | FAQ „WordPress … React/Next.js" | Herstellerliste | ersetzt durch Entscheidungsregel |
| D4 | `/regensburg/webdesign` | „schnell (**unter 2 Sekunden** Ladezeit)" | **UNSUPPORTED** | Klammer entfernt |
| D5 | `/muenchen/webdesign` | FAQ „**ab ca. 1.500 €**" | **UNSUPPORTED** | ersetzt |
| D6 | `/muenchen/webdesign` | FAQ „**4–6 Wochen** … **8–12 Wochen**" | **UNSUPPORTED** | ersetzt |
| D7 | `/muenchen/webdesign` | „Ladezeiten **unter 1,5 Sekunden**, Core Web Vitals im grünen Bereich" | **UNSUPPORTED** | „Kurze Ladezeiten, Core Web Vitals als Prüfmaß" |
| D8 | `/bayreuth/lokales-seo` | FAQ „SEO-Setup **ab ca. 800 €** … Betreuung **ab ca. 250 €/Monat**" | **UNSUPPORTED** | ersetzt |

## E · Bewusst NICHT angefasst (eingefroren oder Messgebiet)

| Route | Aussage | Warum nicht |
|---|---|---|
| `/bayreuth/webdesign` (FROZEN) | „Ladezeiten unter 2 Sekunden" (zweimal), FAQ-Preise und -Dauern nach demselben Muster wie D1–D4 | Eingefrorenes Experiment; vermerkt in `post-experiment-opportunities.md` |
| `/muenchen/webdesign-kosten` (FROZEN) | „Betreuung ab ca. 350 €/Monat", „Launch: 7–14 Tage …" | bereits in `post-experiment-opportunities.md` vermerkt |
| `/webdesign-hotel` (Messpunkt M1, neu gestartet 12.09.) | FAQ „Die Website amortisiert sich in der Regel innerhalb von 6–12 Monaten" | **UNSUPPORTED**, aber die Seite ist ein laufender Messpunkt; einzige Änderung war der Link `Webdesign Deutschland → Webdesign für Unternehmen` (Pflicht wegen 301). **Inhaber-Entscheidung**: Satz beim nächsten geplanten Eingriff entfernen |
| `/deutschland` | Service-Karte „Mobile-First, Ladezeit unter 2 Sekunden" | außerhalb des Webdesign-Clusters; nur ein Pillar-Link ergänzt |
| `src/lib/seo-data.ts` `BUSINESS_INFO.description` | „hochkonvertierende Websites" | Teil des Organization-JSON-LD auf **jeder** Seite → Fingerprint aller eingefrorenen Routen. Nach Experimentende ändern (`post-experiment-opportunities.md`) |
| `src/lib/blog-data.ts` | Webdesign-Orientierungspreise (Z12) | Redaktion, nicht Verkaufsfläche; unverändert offen unter Z12 |

## F · Was an die Stelle der Zahlen trat

Kein Rechner. Für Webdesign gibt es kein vertretbares Nutzermodell: Jede
Eingabe („Seitenzahl", „Funktionen") müsste mit einem erfundenen Preis pro
Einheit multipliziert werden — genau die Zahl, die es nicht gibt. Stattdessen
auf `/kosten-webdesign`: elf Preistreiber im Einzelnen, einmalig/laufend
getrennt, vier Projektzuschnitte ohne Betrag, „wann sich eine neue Website
nicht lohnt", fünf Hebel, mit denen der Kunde den Preis senkt, und der Weg zum
Angebot in drei Schritten.

Sobald der Inhaber Webdesign-Beträge bestätigt, gehören sie in eine kanonische
Codequelle nach dem Muster `TARIFE` — nicht als Literal in eine Seite.
