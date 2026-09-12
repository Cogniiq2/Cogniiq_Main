# Herkunftsprüfung aller kommerziellen Zahlen im Automatisierungs-Cluster

Angelegt: 2026-09-12 · Branch `claude/prozessautomatisierung-pillar-max-2026-09-12`
· Basis-Commit `56707c2` · Gegenstand: jede Zahl mit Geldbezug, Zeitzusage oder
Mengenzusage, die vor diesem Durchgang auf `/kosten-automatisierung`,
`/automatisierung-unternehmen` oder `/prozessautomatisierung` stand.

Diese Datei ist für Automatisierung das, was `docs/preis-wahrheitstabelle.md`
für den Telefonassistenten ist — mit einem Unterschied im Ergebnis: Dort gibt es
eine kanonische Quelle (`TARIFE` in `src/lib/telefonassistent-copy.ts`), hier
gibt es keine.

## Die vier Klassen

| Klasse | Bedeutung |
|---|---|
| **OWNER-CONFIRMED** | Vom Inhaber schriftlich bestätigt, in `OWNER-INPUT.md` oder einem datierten Nachtrag belegt. |
| **SYSTEM-CONFIRMED** | Aus dem Code ableitbar und dort getestet (eine Rechenkonstante, ein Tarifwert). |
| **EXTERNAL-SOURCED** | Aus einer benannten, datierten externen Quelle übernommen und als solche gekennzeichnet. |
| **UNSUPPORTED** | Keine der drei. Steht ohne Grundlage auf einer Verkaufsfläche. |

**Grundsatz.** Eine unbelegte Verkaufszahl wird nicht dadurch belegt, dass sie
schon lange da steht. Sie wird entfernt — und **nicht durch eine andere erfundene
Zahl ersetzt**. „Individuell nach Umfang" ist schwächer als eine Zahl und
stärker als eine falsche.

## Ausgangslage: es gibt keine bestätigte Automatisierungs-Preisquelle

- `OWNER-INPUT.md` **A1–A3** (Preisstaffeln, Staffelinhalte, Einrichtungsgebühr)
  sind unbeantwortet — und sie fragen ohnehin nach dem **Telefonassistenten**.
  Für Automatisierung existiert nicht einmal eine offene Frage mit Beträgen.
- `COPY-CLAIMS-TO-VERIFY.md` **Z12** führt die Automatisierungsbeträge
  ausdrücklich als offen: „Offen bleiben die Webdesign- und
  Automatisierungsbeträge".
- `COPY-CLAIMS-TO-VERIFY.md` **Z6** hält fest, dass Projektdauern für die
  anderen Produkte (also auch Automatisierung) **unbestätigt** sind und nach dem
  dortigen Grundsatz zu entfernen sind, wenn sie nicht bestätigt werden.
- `docs/preis-wahrheitstabelle.md` deckt **ausschließlich** den
  Telefonassistenten ab. Keine ihrer 14 Zeilen betrifft Automatisierung.

Damit ist die Klassifizierung unten in fast allen Zeilen vorentschieden.

## A · `/kosten-automatisierung` (vorher)

| # | Aussage | Ort | Klasse | Entscheidung |
|---|---|---|---|---|
| A1 | Einzel-Workflow **500 – 1.500 €** | `priceRanges[0]` | **UNSUPPORTED** | entfernt |
| A2 | System-Integration **1.500 – 5.000 €** | `priceRanges[1]` | **UNSUPPORTED** | entfernt |
| A3 | Durchgehende Digitalisierung **ab 5.000 €** | `priceRanges[2]` | **UNSUPPORTED** | entfernt |
| A4 | Wartungspakete **ab 99 €/Monat** | `priceFactors[4]` | **UNSUPPORTED** | entfernt |
| A5 | Wartungspakete **ab ca. 99 €/Monat** (zweite Nennung) | FAQ | **UNSUPPORTED** | entfernt |
| A6 | Lead-Management **800 – 1.200 €** | `exampleProjects[0]` | **UNSUPPORTED** | entfernt |
| A7 | Rechnungsautomatisierung **1.500 – 2.500 €** | `exampleProjects[1]` | **UNSUPPORTED** | entfernt |
| A8 | Onboarding **2.000 – 3.500 €** | `exampleProjects[2]` | **UNSUPPORTED** | entfernt |
| A9 | Prozessdigitalisierung **ab 6.000 €** | `exampleProjects[3]` | **UNSUPPORTED** | entfernt |
| A10 | „amortisiert sich … innerhalb von **3–6 Monaten**" | FAQ | **UNSUPPORTED** | entfernt — ersetzt durch den Rechner, der die Dauer aus **Nutzereingaben** ableitet |
| A11 | Schwelle „täglich **30 Minuten** oder mehr" | FAQ | **UNSUPPORTED** | entfernt (Faustregel als Tatsache ausgegeben) |
| A12 | „ein Workflow für **500–1.000 €** kann **täglich eine Stunde** sparen" | FAQ | **UNSUPPORTED** | entfernt (Preis **und** Wirkung, beides unbelegt) |
| A13 | `Offer.price` = die Staffel-Strings im Schema | `CostPage` JSON-LD | **UNSUPPORTED** | Offer-Block entfernt; das neue Service-Schema führt keinen Preis |
| A14 | „Beispielhafte Projektzuschnitte … keine abgerechneten Kundenprojekte" | Abschnittslead | korrekt | sinngemäß **behalten** — die Zuschnitte bleiben, die Beträge gehen |
| A15 | Verarbeitungsort-Formulierung im Datenschutz-FAQ | FAQ | **OWNER-CONFIRMED** (Nachtrag 10.09.2026, negativ formuliert) | **wörtlich behalten** |

**Zwölf entfernte Beträge, kein einziger ersetzt.**

## B · `/automatisierung-unternehmen` (zurückgezogen, 301 auf den Pillar)

| # | Aussage | Klasse | Entscheidung bei der Überführung |
|---|---|---|---|
| B1 | „Quick-Wins **in 1–3 Wochen** live" (4 Stellen: Leistungskachel, Vertrauensstreifen, Hero, FAQ) | **UNSUPPORTED** (Z6) | nicht übernommen |
| B2 | „Mittlere Projekte **in 3–6 Wochen**" | **UNSUPPORTED** | nicht übernommen |
| B3 | „**30–60 €** pro Stunde in Personalkosten" | **UNSUPPORTED** | nicht übernommen — der Stundensatz ist jetzt eine **Eingabe** des Besuchers |
| B4 | FAQ-Preisstaffeln 500–1.500 / 1.500–5.000 / ab 5.000 € | **UNSUPPORTED** | nicht übernommen |
| B5 | „Was früher **30 Minuten** dauerte, passiert jetzt **in Sekunden**" | **UNSUPPORTED** | nicht übernommen |
| B6 | „Prozesse, die heute manuell **30 Minuten** kosten, laufen automatisch in Sekunden" | **UNSUPPORTED** | nicht übernommen |
| B7 | Werkzeugliste: HubSpot, Pipedrive, Salesforce, Google Workspace, Microsoft 365, Calendly, Stripe, Lexoffice, Datev, Slack „**und Hunderte weitere**" | **UNSUPPORTED** (Zusage über fremde Software) | nicht übernommen — ersetzt durch die fünf Prüffragen je System |
| B8 | „**Ohne Fehler**, ohne Personalaufwand, ohne Urlaub" | **UNSUPPORTED** (verbotene Absolutheit) | nicht übernommen |
| B9 | „Fehlerüberwachung und Alerting **für alle** kritischen Workflows" | **UNSUPPORTED** (Zusage über alle Projekte) | umgeschrieben: die Absicherung wird **je Ablauf** festgelegt und steht im Angebot |
| B10 | „Wettbewerber bereits effizienter", „Der Produktivitätsunterschied wächst jeden Monat" | **UNSUPPORTED** (Behauptung über Dritte) | nicht übernommen |
| B11 | „Skalierbar **ohne Mehrpersonal**" | **UNSUPPORTED** | nicht übernommen |
| B12 | Datenschutz-FAQ (Verarbeitungsort) | **OWNER-CONFIRMED** | sinngemäß auf der Kostenseite erhalten |
| B13 | Branchen-, Stadt- und Themenverweise | trägt keine Zahl | übernommen und neu geordnet |
| B14 | Die vier Use-Case-Beschreibungen (E-Mail→CRM, Termin, Onboarding, Report) | Struktur belegbar, Wirkungszusagen nicht | **Struktur übernommen**, als Muster („was ein Ablauf tun KANN") neu geschrieben, ohne Zeit- und Wirkungszusagen, jeweils mit dem Punkt, an dem ein Mensch die Kontrolle behält |

## C · `/prozessautomatisierung` (vorher)

| # | Aussage | Klasse | Entscheidung |
|---|---|---|---|
| C1 | „Einfache Workflows sind **in 1–3 Wochen** live" | **UNSUPPORTED** | entfernt |
| C2 | „Komplexe Systeme … **4–8 Wochen**" | **UNSUPPORTED** | entfernt |
| C3 | „Wir arbeiten mit **Festpreisen** nach transparenter Analyse" | **UNSUPPORTED** (Vertragszusage) | entfernt |
| C4 | „wo Automatisierung **sofort** wirkt" / „**sofort messbar** wirkt" | **UNSUPPORTED** | entfernt |
| C5 | „Die Kosten hängen von Komplexität und Anzahl der Integrationen ab" | Logik, keine Zahl | **behalten** und ausgebaut (acht Kostentreiber) |
| C6 | Integrations-FAQ „Das entscheidet die Schnittstelle Ihres Systems, nicht eine Liste" | bereits korrigiert (12.09.2026) | **behalten** und zum eigenen Abschnitt ausgebaut |

## D · Welche Zahlen die neuen Seiten überhaupt noch enthalten

| Zahl | Ort | Klasse | Beleg |
|---|---|---|---|
| **4,33** Wochen je Monat | Rechnerhinweis „Wochenstunden × 4,33" | **SYSTEM-CONFIRMED** | `WOCHEN_PRO_MONAT` in `src/lib/zeitrechnung.ts`, hergeleitet als 365 ÷ 7 ÷ 12; nicht getippt, sondern über `zahl(WOCHEN_PRO_MONAT, 2)` gerendert; `rechner-konsistenz.test.tsx` verbietet eine zweite Fassung |
| **12** Monate je Jahr | Jahresrechnung | **SYSTEM-CONFIRMED** | `MONATE_PRO_JAHR`, dito |
| Alle Beträge im Rechner | Ergebniszeilen | **Eingaben des Besuchers** | Kein Feld ist vorbelegt; `rechner-konsistenz.test.tsx` prüft, dass jeder `useState<number \| null>` auf `null` startet |

**Sonst keine.** Weder der Pillar noch die Kostenseite nennt einen
Cogniiq-Betrag, eine Projektdauer, eine Ersparnis, eine Quote oder eine
Amortisationsdauer.

## Was passiert, wenn der Inhaber Beträge bestätigt

Dann gehören sie zurück — aber nicht als Literal in eine Seite. Der Weg ist
derselbe wie beim Telefonassistenten:

1. Antwort in `OWNER-INPUT.md` eintragen, datiert.
2. Kanonische Quelle im Code anlegen (Muster: `TARIFE` in
   `src/lib/telefonassistent-copy.ts`), als einzige Datei, die Beträge als
   Literale tragen darf — die Ausnahmeliste dafür steht in
   `rechner-konsistenz.test.tsx` (`KANONISCHE_ZAHLENQUELLEN`).
3. Diese Tabelle um eine Zeile je Betrag ergänzen, Klasse OWNER-CONFIRMED.
4. Erst dann Copy und Schema.

Ein Preis, der diesen Weg nicht gegangen ist, gehört nicht auf die Website.
