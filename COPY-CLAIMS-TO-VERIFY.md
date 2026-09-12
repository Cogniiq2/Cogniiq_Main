# COPY-CLAIMS-TO-VERIFY — Aussagen, die der Inhaber bestätigen muss

Stand: **18.08.2026, bereinigt** · Branch `claude/cogniiq-copy-overhaul-mjkdf4`

> **Grundsatz, der diese Liste kürzer macht als früher (18.08.2026):**
> Eine unbelegte Zusage steht nicht auf der Seite — auch nicht markiert. Ein
> `[[CLAIM]]`-Marker schützt intern, der Besucher liest die Zusage trotzdem.
> Marker sind für Angaben, die wir für zutreffend halten und noch bestätigen;
> nicht für Aussagen, die wir nicht belegen können.
>
> Deshalb ist der größte Teil der Liste vom 16.08.2026 nicht „noch offen",
> sondern **von der Website entfernt**. Was unten in §Z steht, ist erledigt.

## Z. Offen — vor dem Merge zu klären

Nur diese Punkte stehen heute noch als Aussage auf der Website und brauchen
eine Bestätigung.

| # | Aussage | Wo | Was ohne Bestätigung passiert |
|---|---|---|---|
| ~~Z0~~ | **erledigt 23.08.2026, hier nachgetragen 2026-09-10.** Der Vorgabewert des Praxis-Rechners steht seit dem 23.08.2026 auf **20 %** statt 90 % (`PraxisRechnerWidget.tsx`, Kommentar an der Konstanten). Die Zeile stand seither zu Unrecht als „höchste Priorität, offen" in dieser Liste und hätte eine spätere Session Arbeit gekostet, die längst erledigt war. **Offen bleibt** nur OWNER-INPUT F4: eine eigene gemessene Übernahmequote gibt es weiterhin nicht — der Startwert ist als zurückhaltendes Beispiel ausgewiesen (`RECHNER.rahmung`, `RECHNER.startwertHinweis`), nicht als Messung |
| Z1 | **Tarifzuordnung nach günstigstem Gesamtpreis** — die Zusage, dass ein Kunde bei dauerhaft höherem Aufkommen dem für ihn günstigsten Tarif zugeordnet wird | `FAKTEN.tarifzuordnung`, Preisseite, `/praxen`, Praxis-Rechner | Muss vertraglich und im Abrechnungsprozess gedeckt sein, nicht nur im Rechner. Sonst von allen Seiten entfernen |
| Z2 | **AVV-Vorlage nach Art. 28 DSGVO** — „stellen wir jedem Kunden bereit" | `DATENSCHUTZ_PUNKTE`, Datenschutz-Seite, Segmentseiten | Vorlage finalisieren. Bis dahin ist es eine Absichtserklärung |
| Z3 | **§ 203 StGB** — „Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis verpflichtet" | wie Z2 | Klausel ausformulieren. Bis dahin Absichtserklärung |
| Z4 | **Verbleib der Ergebnisse nach Vertragsende** | `UMKEHRBARKEIT` — heute bewusst **keine** Aussage | Solange unbeantwortet, bleibt M19 an dieser Stelle stumm. Der Datenschutzbeauftragte einer Praxis wird danach fragen |
| Z5 | **Dauer des Erstgesprächs** | `CTA.microcopy` — heute ohne Minutenangabe | Bleibt ohne Zeitangabe. „15 Minuten" wäre ein starker Mikrotext (COPY-BRIEF-3 §4.2) |
| ~~Z6~~ | **erledigt 18.08.2026** — auf Startseite, Vertrauensflächen, Assistent- und Paketseiten sowie in beiden Metadaten-Ketten entfernt (35 → 7 Dokumente). Es bleiben reine Website-Projektdauern: **Go-Live-Zeitraum „7–14 Tage"** | `StatsSection`, `DesktopHero`, `TrustSection`, `TrustStrip`, `FAQSection`, `KiCTASection`, `FinalCTASection` — Webdesign und Automatisierung | Für den Telefonassistenten ist die Frage beantwortet (7 Tage garantiert). Für die anderen Produkte steht die Zahl unbestätigt auf Startseite und Vertrauensflächen. **Nach dem Grundsatz oben gehört sie entfernt, wenn sie nicht bestätigt wird** |
| ~~Z7~~ | **entschieden 18.08.2026** — die Antwortzeit ist durch D3 allgemein belegt und bleibt; entfernt wurden nur die zwei Stellen, die eine *Leistung* in 24 h versprachen. **Reaktionszeit „in der Regel 24 h"** | `ContactSection`, `FAQQuestionModal`, `ROICalculator`, `FinalCTASection`, `HowItWorksSection` | Für den Telefonassistenten bestätigt (Antwort D3). Für die übrigen Produkte unbestätigt |
| Z8 | **Beispielbetrag 297 €** im Kostenvergleich | `CostComparisonSection` | Weicht von `TARIFE` ab. Als Beispielwert gekennzeichnet, aber unvereinheitlicht |
| Z9 | **JSON-LD-Angaben** — `areaServed` (10+ Städte), `priceRange "€€€"`, `foundingDate 2025-10-15`, `availableLanguage` | `index.html`, `LocalBusinessSchema.tsx` | Strukturierte Daten sind Aussagen wie jede andere |
| ~~Z10~~ | **erledigt 18.08.2026** — Copy entfernt; im Repository keine Implementierung gefunden, außerhalb davon offen. **Review-Lenkung** — „positives Feedback wird in Richtung Google-Bewertung gelenkt" | Webdesign-Gastronomie-Stadtseiten | Rechtlich riskantes Muster (Review-Gating). Empfehlung unverändert: entfernen. Entscheidung liegt beim Inhaber |
| ~~Z11~~ | **erledigt 18.08.2026** — alle Namen entfernt. **PMS-/Systemnamen Hotel und Restaurant** (protel, Apaleo, Lodgit, OpenTable, ResDiary, Resmio) | Hotel-/Restaurant-Segmentseiten | Dieselbe Klasse wie die PVS-Namen, die im Healthcare-Cluster entfernt wurden. Anbindungstiefe bestätigen oder Namen streichen |
| Z12 | **Blog-Orientierungspreise** — der einzige Betrag, der den bestätigten `TARIFE` widersprach (200–450 € für den Telefonassistenten), ist am 18.08.2026 entfernt. Offen bleiben die Webdesign- und Automatisierungsbeträge (150–500 €, 2.500–8.000 € u. a.) | `blog-data.ts` | Bestätigen oder entfernen. **Abgrenzung 12.09.2026:** Diese Zeile betrifft ab jetzt nur noch `blog-data.ts`. Die Automatisierungsbeträge auf den **Verkaufsflächen** sind unter Z26 abgeschlossen |
| Z26 | **Automatisierungs-Preise auf den Verkaufsflächen** — **erledigt 12.09.2026**: alle zwölf unbelegten Beträge auf `/kosten-automatisierung` (Staffeln 500–1.500 / 1.500–5.000 / ab 5.000 €, Wartung ab 99 €/Monat, vier Beispielprojektpreise, „amortisiert sich in 3–6 Monaten", „ein Workflow für 500–1.000 € spart täglich eine Stunde", `Offer.price` im Schema) entfernt und **nicht ersetzt**. Die Zeitzusagen der zurückgezogenen Seite `/automatisierung-unternehmen` („Quick-Wins in 1–3 Wochen", „3–6 Wochen", „30–60 € pro Stunde") sind mit ihr entfallen; die Zeitzusagen auf `/prozessautomatisierung` („1–3 Wochen", „4–8 Wochen", „Festpreise") ebenfalls. Herkunftsprüfung Zeile für Zeile: `docs/seo/preisaudit-automatisierung.md` | `pages/costs/KostenAutomatisierung.tsx`, `pages/ProzessautomatisierungHub.tsx` | **Offen bleibt nur die Rückkehr**: Sobald der Inhaber Automatisierungspreise bestätigt, gehören sie in eine kanonische Codequelle (Muster `TARIFE`), nicht als Literal in eine Seite |
| Z13 | **Gründer-Spezialisierungen** | `AboutSection` — heute neutral „Gründer" | Erst nach Bestätigung wieder personenbezogen ausweisen |

### Z25 · Bestandsaufnahme der offenen Fundstellen (Stand 2026-09-10)

Vollständig erhoben mit einem Suchlauf über `src/**` nach den Mustern
„bucht Termine", „Termine gebucht", „automatische Terminbuchung",
„Bestätigungs-/Erinnerungs-SMS" und „per SMS oder E-Mail". Die Liste ist die
Arbeitsgrundlage für einen **eigenen Branch** — bewusst nicht mehr für diesen,
weil zwei der Fundstellen `<meta name="description">` und damit das
SERP-Snippet mehrerer Routen ändern. Gebündelt mit der Claim-Bereinigung wäre
danach nicht mehr zuzuordnen, was eine Bewegung verursacht hat.

| Fundstelle | Route | Einordnung |
|---|---|---|
| `publicRoutes.ts:606` — „bucht Termine ins System" | `/ki-telefonassistent-arzt` | **DEFERRED — MEASUREMENT.** Die Route ist ein eingefrorenes Experiment. Die Aussage ist unbelegt und steht trotzdem im Snippet; sie ist mit dem Experimentende zu korrigieren, nicht vorher |
| `publicRoutes.ts:250` — „nimmt Anrufe an, bucht Termine" | `/bayern/ki-telefonassistent` | offen; ändert das SERP-Snippet |
| `seo-data.ts:117` — „bucht Termine direkt ins System" | Organisations-/Service-Schema | offen; strukturierte Daten |
| `KiTelefonassistentPage.tsx:756` — „Bucht Termine nach Ihren Regeln in Ihren Kalender" | `/ki-telefonassistent` | offen; Hub-Seite des Clusters |
| `BayernKiTelefonassistentPage.tsx:128, 194, 310, 420` | `/bayern/ki-telefonassistent` | offen; vier Stellen, darunter „bucht Termine direkt in Ihren Kalender" |
| `KiTelefonassistentDemoPage.tsx:37, 487` | `/ki-telefonassistent/demo` | offen |
| `LeistungenPage.tsx:62` — „Automatische Terminbuchung, Bestätigung und Erinnerung" | `/leistungen` | offen |
| `UeberUnsPage.tsx:60` — „Automatische Terminbuchung und Bestätigung" | `/ueber-uns` | offen |
| `BayernPage.tsx:120`, `DeutschlandPage.tsx:147` | `/bayern`, `/deutschland` (Regionalseiten) | offen |
| `problems/VerpassteAnrufePage.tsx:48` — „bucht Termine automatisch" | `/verpasste-anrufe-verlust` | offen |
| `blog-data.ts:605` — „bucht Termine direkt" | Blogbeitrag verpasste Anrufe | offen |
| `industries/AutomatisierungRestaurant.tsx:51` — „Erinnerungs-SMS/-E-Mail" | `/automatisierung-restaurant` | Automatisierungsprodukt — gehört zur Inhaber-Entscheidung unten, nicht zur Telefonassistent-Klasse |

**Ausdrücklich nicht auf dieser Liste**, weil kein Verstoß: „Online-Terminbuchung"
als Funktion einer von Cogniiq gebauten **Website** (z. B.
`WebdesignArztMuenchen.tsx:134`, `WebdesignArztRegensburg.tsx:204`). Das ist das
Webdesign-Produkt und keine Aussage über eine PVS-Anbindung. Ebenso nicht die
Link-Labels „Keine automatische Terminbuchung" (`RelatedPages.tsx:32`,
`IndustryPage.tsx:723`) — sie benennen ein Kundenproblem, keine Zusage.

**Inhaber-Entscheidung — beantwortet am 10.09.2026.** Die Frage, die den Rest
erst entscheidbar machte, ist geklärt:

- `BOOKING_WRITE` = **ONLY AFTER VERIFIED CUSTOMER INTEGRATION**
- `SMS_EMAIL_CONFIRMATION` = **ONLY FOR SPECIFIC CUSTOMER WORKFLOWS**

Wortlaut, Herleitung und die ausdrücklich **nicht** betroffenen Fälle stehen in
`OWNER-INPUT.md` → „Nachtrag 10.09.2026". Kanonisch im Code:
`FAKTEN.terminaufnahme` und `FAKTEN.bestaetigungen`.

### Z25 · Abarbeitung am 10.09.2026 (Branch `claude/seo-gsc-growth-2026-09-10`)

| Fundstelle | Route | Ergebnis |
|---|---|---|
| `publicRoutes.ts:606` „bucht Termine ins System" | `/ki-telefonassistent-arzt` | **DEFERRED — MEASUREMENT.** Eingefrorenes Experiment; unverändert. Mit dem Experimentende zu korrigieren |
| `publicRoutes.ts:250` | `/bayern/ki-telefonassistent` | **REWRITE** → „erfasst Terminwünsche nach Ihren Regeln". Ändert das SERP-Snippet |
| `publicRoutes.ts:614` „bestätigen und erinnern" | `/ki-telefonassistent-restaurant` | **REWRITE** → Snippet an den korrigierten Seitenkörper angeglichen. Neu erhoben, nicht Teil der ursprünglichen Liste |
| `seo-data.ts:117` | Organisations-/Service-Schema | **REWRITE** → „erfasst Terminwünsche strukturiert" |
| `KiTelefonassistentPage.tsx:756` | `/ki-telefonassistent` | **REWRITE** → „Nimmt Terminwünsche nach Ihren Regeln auf" |
| `BayernKiTelefonassistentPage.tsx` (4 Stellen) | `/bayern/ki-telefonassistent` | **REWRITE** — alle vier |
| `LeistungenPage.tsx` | `/leistungen` | **REWRITE.** Zusätzlich „Vollständige Synchronisation mit Kalender und CRM" entfernt — der stärkste Verstoß der Seite und in der ursprünglichen Liste nicht erfasst. Ebenso die unbelegten „48 Stunden" |
| `UeberUnsPage.tsx` | `/ueber-uns` | **REWRITE**, inkl. „Synchronisation mit Kalender und CRM-Systemen" |
| `problems/VerpassteAnrufePage.tsx:48` | `/verpasste-anrufe-verlust` | **REWRITE** |

### Z25 · Nachtrag 10.09.2026 (Branch `claude/seo-gsc-opportunities-2026-09-10`)

| Fundstelle | Route | Ergebnis |
|---|---|---|
| `problems/VerpassteAnrufePage.tsx:52` — „Termine automatisch in den Kalender eingetragen" | `/verpasste-anrufe-verlust` | **REWRITE — Nachzügler.** Der Durchgang vom selben Tag hatte auf dieser Seite `solution.text` (Zeile 48) korrigiert, die darunterliegende Aufzählung `solution.bullets` aber nicht. Ergebnis war ein Widerspruch im selben Block: Der Fließtext sagte „erfasst Terminwünsche nach Ihren Regeln", der Aufzählungspunkt unmittelbar darunter sagte den Kalendereintrag unbedingt zu. Wortlaut jetzt an `FAKTEN.terminaufnahme` angeglichen |

**Weiterhin offen und ausdrücklich nicht angefasst:**

- ~~`publicRoutes.ts` (Description `/ki-telefonassistent-arzt`) — „bucht Termine ins
  System"~~ — **ERLEDIGT 11.09.2026**, siehe „Z25 · Nachtrag 11.09.2026" unten.
- `industries/AutomatisierungRestaurant.tsx:51` und
  `problems/KeineTerminbuchungPage.tsx:53` — SMS-/E-Mail-Erinnerungen. Beide
  gehören laut der Einordnung oben zur Klasse „Automatisierungs-/Webdesign-Produkt"
  und nicht zum Telefonassistenten; sie warten auf dieselbe Inhaber-Entscheidung.
  Bewusst nicht mitkorrigiert: Eine Korrektur ohne diese Entscheidung wäre geraten.
| `blog-data.ts:605` | Blogbeitrag verpasste Anrufe | **REWRITE** |
| `KiTelefonassistentHotel.tsx` (3 Stellen) | `/ki-telefonassistent-hotel` | **REWRITE.** Neu erhoben. Die Seite versprach im Fließtext den Systemeintrag unbedingt („trägt sie in Ihr System ein", „Buchung direkt ins System"), während ihr eigenes FAQ die Schnittstellenprüfung korrekt beschrieb — ein Widerspruch auf derselben Seite |
| `KiTelefonassistentRestaurant.tsx:76` | `/ki-telefonassistent-restaurant` | **REWRITE** — Bestätigung/Erinnerung als eingerichteter Ablauf, nicht als Standardumfang |
| `SolutionShowcase.tsx:206` | geteilte Komponente | **REWRITE.** Neu erhoben. Der Demo-Dialog sagte eine SMS-Erinnerung als Selbstverständlichkeit zu |
| `KiTelefonassistentDemoPage.tsx:37, 216, 487` | `/ki-telefonassistent/demo` | **REWRITE** |
| `BayernPage.tsx:23, 120` | `/bayern` | **REWRITE** |
| `DeutschlandPage.tsx:35, 147` | `/deutschland` | **REWRITE** |
| `industries/AutomatisierungRestaurant.tsx:51`, `standorte-service-configs.ts:203` | Automatisierungsprodukt | **KEEP.** Gegenstand dieses Produkts ist das Einrichten kundenspezifischer Abläufe — genau der von `SMS_EMAIL_CONFIRMATION` erlaubte Fall |
| `KiTelefonassistentRestaurant.tsx:30` | `/ki-telefonassistent-restaurant` | **KEEP.** Beschreibt die Marktmechanik von Erinnerungssystemen, nicht eine Zusage von Cogniiq |
| „Online-Terminbuchung" auf Webdesign-Seiten, Kontaktformular-Bestätigungsmails | Webdesign-Produkt | **KEEP** — unverändert kein Verstoß, siehe oben |

### Z25 · Nachtrag 11.09.2026 (Branch `claude/fix-arzt-claim-integrity-2026-09-11`)

| Fundstelle | Route | Ergebnis |
|---|---|---|
| `publicRoutes.ts:605-606` und `functions/_middleware.ts:425-426` — Titel „Termine automatisch buchen", Description „bucht Termine ins System" | `/ki-telefonassistent-arzt` | **REWRITE.** Damit ist die letzte öffentlich sichtbare Fundstelle der Klasse `BOOKING_WRITE` geschlossen |

Der Vermerk **DEFERRED — MEASUREMENT** vom 10.09.2026 ist damit aufgehoben. Die
Abwägung, die dort als Inhaber-Entscheidung offengelassen wurde, ist zugunsten
der Aussagenrichtigkeit entschieden: Eine falsche Zusage im SERP-Snippet einer
Seite mit 543 Impressionen je 28 Tage bleibt nicht stehen, damit eine Messreihe
sauber bleibt.

Wortlaut neu — an `FAKTEN.terminaufnahme` gebunden, ohne pauschale PVS-/Kalender-Schreibzusage:

- Titel: `KI-Telefonassistent für Arztpraxen | Terminwünsche aufnehmen – Cogniiq`
- Description: `Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb der Sprechzeiten. Eintrag ins Praxissystem nach geprüfter Anbindung.`

„Eintrag ins Praxissystem **nach** geprüfter Anbindung" ist bewusst als
Bedingung formuliert und nicht als Zusage mit Zeitplan: Der Schreibvorgang wird
weiterhin nur dort beschrieben, wo die kundenspezifische Schnittstelle geprüft
ist. Universell belegt bleibt allein die **Aufnahme** des Terminwunsches.

Das Experiment auf dieser Route ist dadurch kontaminiert. Das ist protokolliert,
nicht kaschiert: `docs/seo/organic-growth-scoreboard.md` → „Kontamination
`/ki-telefonassistent-arzt` (2026-09-11)". Seitenkörper, H1, interne Links,
Ankertexte und Keyword-Targeting wurden **nicht** angefasst.

**Weiterhin offen:** `industries/AutomatisierungRestaurant.tsx:51` und
`problems/KeineTerminbuchungPage.tsx:53` (SMS-/E-Mail-Erinnerungen) — unverändert
wartend auf dieselbe Inhaber-Entscheidung wie am 10.09.2026 festgehalten.

### Nachtrag: die erste Fassung dieser Tabelle war falsch

Der erste Durchgang am 10.09.2026 suchte nach „bucht Termine", „Termine
gebucht" und „automatische Terminbuchung" — aber nie nach dem Substantiv
**„Terminbuchung"** allein und nie nach **„trägt … ein"**. Auf dieser Grundlage
wurden `KiTelefonassistentDemoPage.tsx`, `BayernPage.tsx` und
`DeutschlandPage.tsx` als „kein Befund mehr" eingetragen, obwohl alle drei die
Aussage unverändert trugen. Die Zeile ist oben korrigiert; festgehalten wird der
Fehler, weil ein zu enges Suchmuster hier zweimal dieselbe Lücke erzeugt hat.

Der zweite Durchgang lief über die volle Synonymklasse und fand zusätzlich:

| Fundstelle | Route | Ergebnis |
|---|---|---|
| `KiTelefonassistentPage.tsx:182` — „Er prüft Ihren Kalender und trägt Termine direkt ein … kompatibel mit Google Calendar, Outlook" | `/ki-telefonassistent` | **REWRITE.** Unbedingte Schreibzusage **und** Produktnamen — Letzteres verstößt zusätzlich gegen OWNER-INPUT B3 |
| `BayernKiTelefonassistentPage.tsx:114` (JSON-LD), `:219`, `:292`, `:64` | `/bayern/ki-telefonassistent` | **REWRITE.** Die erste Fassung korrigierte vier Stellen der Seite und ließ die strukturierten Daten stehen — genau der Fehler, den Z9 benennt |
| `standorte-service-configs.ts:136, 528, 808, 826` — „trägt sie nach Ihren Regeln in den Kalender ein" | Stadt-Cluster | **REWRITE** |
| `publicRoutes.ts:294, 430` — „Anrufannahme, Terminbuchung und Weiterleitung" | `/bayreuth/ki-telefonassistent`, `/regensburg/ki-telefonassistent` | **REWRITE.** Ändert zwei weitere SERP-Snippets |
| `ServicesSection.tsx:56` — „Terminbuchung & -änderung in Echtzeit" | Startseite (geteilte Komponente) | **REWRITE.** Stand direkt unter der bereits korrigierten Kartenbeschreibung |
| `KiAgenturDeutschland.tsx:20, 84` | `/ki-agentur-deutschland` | **REWRITE** |
| `KiTelefonassistentRestaurant.tsx:14, 53, 75` | `/ki-telefonassistent-restaurant` | **REWRITE.** Intro und Benefit versprachen weiter unbedingt, was der Prozessschritt inzwischen einschränkte |

**Bewusst nicht geändert, mit Begründung:**

- `LeistungenPage.tsx:108, 120, 133, 156` (`OUTCOMES`, `SYSTEM_PANELS`) — die
  Panels beschreiben **gebaute Gesamtsysteme**; ihr Stack nennt jeweils Website,
  Reservierungs- bzw. Terminlogik und Automatisierung. Erinnerungen und
  Bestätigungen entstehen dort im eingerichteten Ablauf — der von
  `SMS_EMAIL_CONFIRMATION` ausdrücklich erlaubte Fall, kein Verstoß.
- `KiTelefonassistentPage.tsx:182` — die **Frage** „Kann er Termine buchen?"
  bleibt; sie ist die Frage des Besuchers. Korrigiert wurde die Antwort.
- `WebdesignArzt.tsx`, `standorte-service-configs.ts:393, 756`,
  `KostenWebdesign.tsx`, `cluster/**` — Webdesign-Produkt.
- Meta-`keywords` (`KiTelefonassistentPraxis.tsx:12`) — von Suchmaschinen
  ignoriert und keine sichtbare Zusage.
- `PraxenPage.tsx:249` — beschreibt das Scheitern von Patienten (vzbv-Erhebung),
  keine Zusage von Cogniiq.
- `serviceOnboarding/catalog.ts`, `app/customerPortalModel.ts` — interne
  Owner-/Kundenoberflächen, keine öffentliche Werbeaussage.

Damit ist Z25 abgeschlossen, mit **einer** protokollierten Ausnahme:
`/ki-telefonassistent-arzt` (eingefrorenes Experiment, `publicRoutes.ts:605–607`).

**Stand 18.08.2026:** Z6, Z7, Z10 und Z11 sind bereinigt, Z12 teilweise —
Einzelheiten in `MERGE-READINESS.md` §4a. Es galt: nur Entfernung unbelegter
Zusagen, keine Copy-Überarbeitung. Die eigentliche Copy der Nicht-Healthcare-
Seiten steht weiterhin für einen eigenen Durchgang aus.

**Weiterhin offen bleiben Z1–Z5, Z8, Z9, Z13** sowie die Reste aus Z6 und Z12.

## Y. Erledigt seit dem 16.08.2026

| Frühere Nummer | Aussage | Wie erledigt |
|---|---|---|
| A1 | PVS-Namen Tomedo, Medistar, Dampsoft, CGM | **entfernt.** `FAKTEN.keineAnbindung` sagt jetzt, dass es keine Standardanbindung gibt; `/integrationen` führt bewusst keine Liste |
| A2 | „Kein System-/Rufnummernwechsel nötig" | **entfernt** (B4 unbeantwortet). Ersetzt durch `FAKTEN.rufumleitung` |
| A5 | Rohaudio-Speicherung „außer auf Wunsch" | **entfernt.** `FAKTEN.keineAufzeichnung`: es wird gar nicht aufgezeichnet |
| A6 | Art.-50-Ansage | **bestätigt** und nicht abschaltbar — `FAKTEN.art50` |
| A8 / F7 | „Mehrere Anrufe gleichzeitig" | **beziffert:** 10 gleichzeitige Anrufe (`FAKTEN.gleichzeitigeAnrufe`) |
| A10 | Selbst aufgesprochene Ansagen | **abgeschwächt** auf Stimmauswahl und eigenen Begrüßungssatz |
| B1 / E1 | „Einrichtung in 7–14 Tagen" | **überholt** durch die 7-Tage-Garantie; im Cluster und im Footer entfernt |
| C1 / C2 | Preisstaffeln 99/199–399/499 €, Beispielpreise 249/149/199/299 € | **ersetzt** durch `TARIFE` (Basis/Praxis/MVZ) plus Enterprise-Zeile |
| C4 | „Flexible Laufzeiten" | **beziffert:** 12 Monate, 20 % Aufschlag für monatliche Kündbarkeit |
| D1 | „Verarbeitung ausschließlich auf europäischen Servern" | **repo-weit entfernt** — Sperre nach HONESTY-AUDIT §7.7 |
| D4 | „Kein Training auf Patientendaten" | **bestätigt** — `FAKTEN.keinTraining` |
| F1 | Kostenvergleich 297 € | offen, siehe Z8 |
| F3 | Testimonial nennt SV Heinersreuth | **aus dem Rendering entfernt**, inklusive `/referenzen` und JSON-LD. Wiederherstellung nur mit schriftlicher Einwilligung |
| F11 | Deckelung MVZ 1.400 € | **bestätigt** (17.08.2026); `FAKTEN.deckelung` nennt jede Obergrenze einzeln, der Guard-Test prüft die Widerspruchsfreiheit |

## Historische Fassung (16.08.2026)

Unverändert erhalten, damit nachvollziehbar bleibt, was zu welchem Zeitpunkt
offen war. Die Gruppen A–F unten sind durch §Z und §Y oben abgelöst.

Stand: 2026-08-16 (Pass 2) · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Das Beantwortungsformular zu dieser Liste ist `OWNER-INPUT.md` — die
Gruppen A–D unten entsprechen den dortigen Gruppen. Abschnitt F ergänzt
die im Pass-2-Audit neu gefundenen Punkte.

Regel aus dem Brief (§2.1): Produktaussagen, die weder im Repo belegt noch vom
Inhaber bestätigt sind, dürfen nicht behauptet werden. Die folgenden Aussagen
stehen bereits auf der Live-Website (waren also publiziert) oder wurden in der
neuen Fassung bewusst beibehalten — sie sind **vor dem Merge zu bestätigen oder
zu entfernen**. Marker stehen als Code-Kommentare neben der jeweiligen Stelle
(nicht im gerenderten Text, damit kein Englisch in die Kundensicht gelangt).

## A. Technik & Produkt

| # | Aussage | Wo | Status |
|---|---|---|---|
| A1 | Anbindung an Tomedo, Medistar, Dampsoft, CGM (PVS) | `/ki-telefonassistent-arzt` (FAQ, Benefits) | bereits publiziert — Liste und Anbindungstiefe je System bestätigen |
| A2 | Kein System-/Rufnummernwechsel nötig; bestehende Telefonanlage bleibt | alle Seiten | bereits publiziert — technisch bestätigen (Rufumleitung? SIP? je Anlage?) |
| A3 | Fallback bei technischem Ausfall (Backup-Nummer oder Ansage) | Service-Seite, Stadtseiten (FAQ) | bereits publiziert (Regensburg) — Mechanik technisch bestätigen |
| A4 | Selbstpflege von Öffnungszeiten/Urlaubsansagen über ein Dashboard | Service, Arzt, Bayreuth | bereits publiziert — Funktionsumfang des Dashboards bestätigen |
| A5 | Gespräche werden als strukturierte Zusammenfassung übergeben, Rohaudio wird nicht gespeichert (außer auf Wunsch) | Datenschutz-Blöcke aller Seiten | bereits publiziert (Bayreuth-FAQ) — Speicher- und Löschkonzept bestätigen |
| A6 | Ansage zu Gesprächsbeginn, dass ein Sprachassistent spricht (Art. 50 KI-VO) | alle Seiten | NEU im Copy — im Produkt verifizieren, sonst Aussage entfernen |
| A7 | Anrufer kann jederzeit zu einem Menschen wechseln | alle Seiten | NEU präzisiert — Gesprächslogik verifizieren |
| A8 | Mehrere Anrufe gleichzeitig ohne Warteschleife | Stadtseiten | bereits publiziert — Parallelitätsgrenzen bestätigen |
| A9 | Mehrsprachigkeit (Deutsch/Englisch, weitere auf Anfrage) | München, Regensburg | bereits publiziert, vereinheitlicht — Umfang bestätigen |
| A10 | Eigene, selbst aufgesprochene Ansagen möglich | alle Seiten | NEU als Kernversprechen (P2) — produktseitig bestätigen |
| A11 | Notfall-Routing konfigurierbar (Team / Bereitschaftsdienst / 112-Ansage) | Arzt, Service | bereits publiziert, präzisiert — Konfigurationsmöglichkeit bestätigen |

## B. Prozess & Betreuung

| # | Aussage | Wo | Status |
|---|---|---|---|
| B1 | Einrichtung in der Regel 7–14 Tage | Stadtseiten, HowTo-Schema (P14D) | bereits publiziert — bestätigen |
| B2 | 5-Schritte-Prozess (Aufnahmegespräch → Anliegen-Katalog → Ansagen → Testphase → laufende Anpassung) | Service (HowTo), Stadtseiten | NEU strukturiert — mit tatsächlichem Ablauf abgleichen |
| B3 | Fester persönlicher Ansprechpartner, kein Ticketsystem | alle Seiten | bereits publiziert — Betreuungsmodell bestätigen |
| B4 | Hauptsitz in Bayreuth, Termine vor Ort möglich | Bayreuth | bereits publiziert — bestätigen |
| B5 | Auswertung der Gesprächsverläufe in den ersten Wochen | Bayreuth (FAQ), Service | bereits publiziert — bestätigen |

## C. Preise & Vertrag

| # | Aussage | Wo | Status |
|---|---|---|---|
| C1 | Preisstaffeln: ab 99 € / 199–399 € / ab 499 € pro Monat | `/kosten-ki-telefonassistent` (+ Offer-Schema) | bereits publiziert — **alle Beträge bestätigen** |
| C2 | Beispielkonfigurations-Preise (249/149/199/299 €) | Preisseite | bereits publiziert — bestätigen oder entfernen |
| C3 | Fester Monatsbetrag, keine Abrechnung pro Anruf | alle Seiten (P4) | NEU als Kernversprechen — Preismodell bestätigen |
| C4 | Flexible Laufzeiten, klar benannte Kündigungsfrist | Preisseite (FAQ) | abgeschwächt von "monatlich kündbar" — konkrete Konditionen einsetzen |
| C5 | Einrichtungsgebühr wird vor Vertragsschluss schriftlich ausgewiesen | Preisseite, Stadtseiten | NEU — Angebotsprozess bestätigen |

## D. Datenschutz & Recht

| # | Aussage | Wo | Status |
|---|---|---|---|
| D1 | Verarbeitung ausschließlich auf europäischen Servern | alle Seiten | bereits publiziert — Hosting-Standorte und Sub-Auftragsverarbeiter dokumentieren |
| D2 | AVV nach Art. 28 DSGVO gehört zur Einrichtung ("inklusive") | alle Seiten | bereits publiziert ("auf Anfrage" → jetzt "inklusive") — bestätigen, sonst zurück zu "auf Anfrage" |
| D3 | Unterstützung bei Dokumentation für den DSB (ohne DSFA-Aussage) | Arzt, Praxis, Stadtseiten | NEU formuliert — Leistungszusage bestätigen |
| D4 | Kein Training auf Patientendaten | **nirgends behauptet** | Brief §5.4 wünscht die Aussage — erst nach Bestätigung ergänzen |

## F. Pass-2-Ergänzungen (Audit repo-weit)

| # | Aussage | Wo | Status |
|---|---|---|---|
| F1 | 297 €/Monat im Kostenvergleichs-Rechner — weicht von den Staffeln (99/199–399/499 €) ab | `CostComparisonSection.tsx` | als Beispielwert gekennzeichnet — vereinheitlichen (OWNER-INPUT A1) |
| F2 | Reaktionszeit „in der Regel 24 h" (Kontakt, Demo, FAQ-Modal, Final-CTA, HowItWorks) | mehrere Komponenten | bereits publiziert — bestätigen (D3) |
| F3 | Testimonial `REAL_TESTIMONIAL` nennt real existierenden Verein (SV Heinersreuth) | `TestimonialBlock.tsx`, `/referenzen`, `/bewertungen` | schriftliche Einwilligung nachweisen oder entfernen (F3 im OWNER-INPUT) |
| F4 | Gründer-Spezialisierungen (wer macht KI, wer Webdesign) | AboutSection (jetzt neutral „Gründer") | erst nach Bestätigung wieder personenbezogen ausweisen |
| F5 | JSON-LD: `areaServed` (10+ Städte), `priceRange "€€€"`, `foundingDate 2025-10-15`, `availableLanguage German/English` | `index.html`, `LocalBusinessSchema.tsx` | bestätigen |
| F6 | Review-Lenkung „Positives Feedback wird in Richtung Google-Bewertung gelenkt" | Webdesign-Gastronomie-Stadtseiten | rechtlich riskantes Muster (Review-Gating) — Empfehlung: entfernen; Entscheidung Inhaber |
| F7 | „Mehrere Anrufe gleichzeitig, ohne Warteschleife" | mehrere Seiten | Parallelitätsgrenzen bestätigen (B11) |
| F8 | Blog-Orientierungspreise (150–500 €, 200–450 €, 300 € u. a.) | `blog-data.ts` | bestätigen oder entfernen |
| F9 | PMS-/Systemnamen Hotel/Restaurant (protel, Apaleo, Lodgit, OpenTable, ResDiary, Resmio) | Hotel-/Restaurant-Segmentseiten | Anbindungstiefe bestätigen |
| F10 | **Tarifzuordnung nach günstigstem Gesamtpreis** — Preisseite, `/praxen` und der Praxis-Rechner sagen zu, dass ein Kunde bei dauerhaft höherem Aufkommen dem Tarif zugeordnet wird, der für seinen Bedarf am günstigsten ist und nicht dauerhaft an der Obergrenze läuft | `telefonassistent-copy.ts` (`DECKELUNG.tarifwechsel`), `KostenKiTelefonassistent.tsx`, `PraxenPage.tsx`, `PraxisRechnerWidget.tsx` | **[[CLAIM: Tarifzuordnung nach günstigstem Gesamtpreis muss im Vertrag und im Abrechnungsprozess so umgesetzt sein — nicht nur im Rechner]]** Die Regel beschreibt inzwischen nicht mehr nur eine Rechnerannahme, sondern eine Zusage an den Kunden. Ohne vertragliche und prozessuale Deckung ist sie von den Seiten zu entfernen |
| F11 | Deckelung im Tarif MVZ liegt bei 1.400 €, während der nächsthöhere Tarif (Enterprise) bei 5.000 € beginnt — die Regel „nie mehr als der nächsthöhere Tarif" trägt dort nicht | `telefonassistent-copy.ts` (`DECKELUNG.text`), beide Preisdarstellungen | Formulierung nennt jetzt beide Fälle getrennt; Obergrenze 1.400 € vom Inhaber als beabsichtigt bestätigt (17.08.2026) — Vertragstext angleichen |

## E. Nicht mehr behauptet (bewusst entfernt, kein Handlungsbedarf)

- 30–80 Anrufe/Tag in Praxen, 3–5 Minuten MFA-Zeit pro Anruf, 40 Termine/Tag
- "montags über 80 Anrufe vor 9 Uhr" / "60–80 Anrufe vor 8:30 Uhr" (Stadtszenarien)
- Annahme "innerhalb von zwei Sekunden" / "Reaktionszeit unter 2 Sekunden"
- ROI "innerhalb weniger Wochen", Vergleich mit Teilzeitgehalt 1.500–2.000 €
- "Kunden bestellen den Service selten wieder ab", "unbegrenzte Anrufe"
- Stimme "kaum von einem menschlichen Mitarbeiter zu unterscheiden"
- Sämtliche "kein Anruf/Patient/Auftrag geht verloren"-Absolutversprechen

---

# Nachtrag 2026-08-29 — offene Punkte der Seite `/ki-telefonassistent-einfuehren`

Die Seite beschreibt das eigene Einführungsvorgehen. Diese Aussagen sind aus der
internen Projektvorlage abgeleitet und im Repository nachvollziehbar, aber vom
Inhaber nicht bestätigt. Sie stehen als `[[CLAIM: verify]]` im Quelltext von
`src/pages/guides/KiTelefonassistentEinfuehren.tsx`.

| ID | Aussage | Fundstelle | Status |
|---|---|---|---|
| Z14 | „Vor einer Freigabe gehören vier Gruppen von Fällen geprüft" — dass genau diese vier Prüfkategorien (normale Abläufe, Verwechslung und Zugriff, deutsche Sprachqualität, Ernstfall) das Vorgehen abbilden | `KiTelefonassistentEinfuehren.tsx`, Konstante `PRUEFGRUPPEN` | offen — Bestätigung des Inhabers |
| Z15 | Die sechs Beobachtungspunkte der ersten Betriebswoche | ebd., Konstante `ERSTE_WOCHE` | offen — Bestätigung des Inhabers |
| Z16 | Die empfohlene Freigabereihenfolge (erst Anmeldung, dann Leitung) und die sieben einzeln freigegebenen Punkte | ebd., Abschnitt „Wer freigibt" | als Empfehlung formuliert, nicht als eigener Ablauf — Bestätigung des Inhabers weiterhin sinnvoll |
| Z17 | Die drei Prüffragen je Anrufanlass als unser vorgeschlagenes Entscheidungsraster | ebd., Abschnitt „Die Trennlinie ziehen" | offen — als Vorschlag formuliert, nicht als Zusage |

Bewusst **nicht** auf der Seite, weil gesperrt: jede Aussage zum Verhalten bei
Störung oder Ausfall und jede Frist für eine Rückschaltung (OWNER-INPUT B9 ist
unbeantwortet; die Folgezeile dort verlangt, dass Fallback-Aussagen von allen
Seiten verschwinden). Die Seite sagt nur, dass der Rückweg vor dem Umschalten
vereinbart wird — nicht, wie schnell er greift.

Ebenfalls nicht auf der Seite: Verarbeitungsort und Konformität (§7.7), Namen
von Praxisverwaltungssystemen und Anbindungszusagen (B1–B3), ein Anteil
automatisierter Anrufe (F4/Z0), Namen eingesetzter Dienstleister (B6).

## Nachtrag 2026-08-30 — Fremdstatistiken, am Primaerbeleg geprueft

Zwei Fremdzahlen standen im ersten Entwurf von `/ki-telefonassistent-einfuehren`.
Sie wurden zwischenzeitlich entfernt, weil die Primärquellen in der
Arbeitsumgebung nicht zu öffnen waren. **Der Inhaber hat beide anschließend
selbst am Primärbeleg geprüft.** Sie stehen wieder im Text — ausschließlich in
der geprüften, eng gefassten Fassung.

| ID | Aussage im Text | Beleg | Status |
|---|---|---|---|
| Z18 | „Unter den wechselwilligen Teilnehmenden des Zi-PVS-Monitorings 2025 nannten 52,1 % mangelnden Kundensupport als einen ausschlaggebenden Grund für einen möglichen PVS-Wechsel." | Zi, *Praxisverwaltungssysteme (PVS) in Praxen und MVZ — Eine Befragung zur Zufriedenheit und Leistungsfähigkeit in 2025*, Zi-Paper 32/2026, veröffentlicht 14.01.2026. Datensatz: **PVS-Monitoring 2025**. Bezugsgröße: 901 wechselwillige Teilnehmende. | **geprüft** |
| Z19 | „39 % der Befragten bewerteten die Erreichbarkeit medizinischer Versorgung außerhalb der üblichen Praxisöffnungszeiten – etwa abends oder am Wochenende – als schwierig." | GKV-Spitzenverband, GKV-Versichertenbefragung 2025, n = 3.520. | **geprüft** |

**Grenzen, die beim Bearbeiten erhalten bleiben müssen:**

- Die Studie heißt **PVS-Monitoring 2025**, nicht 2026. 2026 ist das
  Erscheinungsjahr des Zi-Papers, nicht der Erhebung.
- Die 52,1 % beziehen sich auf die **wechselwilligen** Teilnehmenden, nicht auf
  alle Praxen. „52 % der Praxen sind mit dem Kundensupport unzufrieden" wäre
  falsch.
- Die 39 % betreffen die **Erreichbarkeit medizinischer Versorgung** insgesamt,
  nicht die Erreichbarkeit einer einzelnen Praxis am Telefon.
- Beide Zahlen betreffen **keine Telefonassistenten**. Der Beitrag sagt das an
  beiden Stellen ausdrücklich dazu.


# Nachtrag 2026-09-05 — offene Punkte der Seite `/ki-telefonassistent-zahnarztpraxis`

Die Seite zitiert Produktzusagen ausschließlich aus `FAKTEN`, `GRENZEN` und
`ANBINDUNG`. Neu sind Aussagen über das eigene Vorgehen, als Vorschlag
formuliert:

| # | Aussage | Fundstelle | Status |
|---|---|---|---|
| Z20 | Der Anrufanlass-Katalog (neun Anlässe mit Regel „übernimmt / immer Mensch / entscheidet die Praxis") ist der Ausgangspunkt einer Einrichtung in einer Zahnarztpraxis | `KiTelefonassistentZahnarztpraxis.tsx`, Konstante `ANLAESSE` | offen — Bestätigung des Inhabers; als Vorschlag formuliert |
| Z21 | Die sieben zahnärztlichen Prüffälle ergänzen die vier Prüfgruppen aus Z14 | ebd., Konstante `PRUEFFAELLE` | offen — Fallkategorien, keine Zusage über Ergebnisse |
| Z22 | Die drei Zeitmuster (Überlauf, Behandlungsfenster, außerhalb der Sprechzeit) | ebd., Abschnitt „Behandlungszeit" | nach Review als „kommen als Ausgangspunkt infrage" formuliert — keine Erfahrungsaussage mehr; Bestätigung des Inhabers, dass alle drei konfigurierbar sind, weiterhin sinnvoll |
| Z23 | Abfrage und Prüfung von Angaben vor einer Absage | ebd., Abschnitt „Absagen" | **geschlossen 2026-09-05 (Review).** Das Beispiel „Name und Geburtsdatum" ist entfernt: Das Geburtsdatum steht in keinem der vier gespeicherten Felder (`ANBINDUNG.heute.punkte`, `FAKTEN.keineAufzeichnung`) und ist ohne Inhaber-Freigabe keine zusagbare Datenkategorie. Ebenfalls entfernt: „Dass eine falsche Angabe abgewiesen wird" — eine Prüfung gegen einen Datensatz setzt die Anbindung voraus, die `NICHT_PASSEND` vor der Systemprüfung ausdrücklich nicht zusagt. Die Stelle verweist jetzt auf das Ergebnis der Anbindungsprüfung |
| Z24 | Ausgehende Anrufe (Recall, Nachbesetzung) | ebd., FAQ und Grenzen | nach Review **keine Aussage** in beide Richtungen: „nicht Gegenstand dieses Beitrags und hier nicht zugesagt". Inhaber entscheidet, ob ein FAKTEN-Satz dazu aufgenommen wird |
| Z25 | Terminbuchung und SMS-/E-Mail-Bestätigung als Produktfunktion des Telefonassistenten | siehe Bestandsaufnahme unten | **teilweise geschlossen 2026-09-10.** Bereinigt sind: die vollständige Startseite (`ServicesSection`, `SolutionShowcase`, `CostComparisonSection`, `KiCTASection` — alle vier rendern ausschließlich dort), die drei Arzt-Webdesign-Seiten Bayreuth/München/Regensburg, `/ki-telefonassistent-restaurant` und der Restaurant-Blogbeitrag. **Nicht bereinigt** ist der Rest der Website; die vollständige Liste steht direkt unter dieser Tabelle. Die frühere Fassung dieser Zeile behauptete, der Telefonassistent-Teil sei vollständig geschlossen — das war falsch |

| Z26 | „welche Termine sofort ans Team gemeldet werden" / „die Meldung an das Team kommt sofort an" | ebd., Abschnitt „Absagen" und `PRUEFFAELLE` | **geschlossen 2026-09-05 (Review).** `ANLIEGEN_UEBERNIMMT` deckt „frei werdende Termine sind sofort **sichtbar**" — eine aktive Benachrichtigung deckt kein FAKTEN-Satz, und `ANBINDUNG.heute` beschreibt die Liste ausdrücklich als asynchron („arbeitet die Liste ab, wenn es in den Ablauf passt"). Wortlaut auf „sichtbar" gezogen |
| Z27 | „wie der Bezug zur Erinnerung im Ergebnis vermerkt wird" (Recall) und „vermerkt den Zeitpunkt" (Absage) | ebd., `ANLAESSE` und Abschnitt „Absagen" | offen — beides sind Felder über die vier aus `ANBINDUNG.heute.punkte` hinaus. Als Konfigurationsfrage formuliert, nicht als Zusage; Inhaber bestätigt, ob das Ergebnis weitere Felder trägt, oder die beiden Stellen entfallen |
| Z28 | Die Seite formuliert die Zeilen „Übernimmt der Assistent" frei nach `ANLIEGEN_UEBERNIMMT`, statt sie wie `GRENZEN` wörtlich zu zitieren | ebd., `ANLAESSE` | offen — kein inhaltlicher Fehler, aber die Seite bricht den Build nur bei Drift in `GRENZEN`, nicht bei Drift in `ANLIEGEN_UEBERNIMMT`. Beim nächsten Anfassen dieselbe Guard-Konstruktion nachziehen |

Blogbeitrag `/blog/ki-telefonassistent-arztpraxis` (2026-09-05): entfernt wurden
„Terminbestätigung und -erinnerung per SMS oder E-Mail" (Funktion nicht
belegt), „DSGVO-Protokoll: automatisch" (Klasse §7.7-nah) und die Formulierung
„vollständig übernehmen" (COPY-BRIEF §5.9). Die Aussage zum vzbv-Marktcheck
bleibt (freigegebene Statistik, COPY-BRIEF §5.7).


## Z30 · Rechner-Vereinheitlichung, 11.09.2026

| # | Aussage | Status |
|---|---|---|
| F1 | Kostenvergleich 297 €/Monat | **erledigt.** `CostComparisonSection` rechnet nicht mehr, sondern vergleicht Eigenschaften. Es gibt keinen zweiten Preis mehr; `rechner-konsistenz.test.tsx` schlägt an, sobald 297 € irgendwo im Produktionsquelltext auftaucht |
| Z0 / F4 | Vorgabewert „Automatisierungsgrad" 20 % | **erledigt auf allen lebenden Flächen.** Der kanonische Rechner setzt für den Routineanteil GAR KEINEN Wert mehr ein. Die Zahl überlebt ausschließlich im eingefrorenen `PraxisRechnerWidget` und damit ausschließlich auf der Preisseite (post-experiment-opportunities P3). Eine gemessene eigene Übernahmequote wird weiterhin nicht veröffentlicht und für die Rechnung auch nicht gebraucht |
| — | Automatisierungs-Semantik | **neu und vom Inhaber bestätigt (11.09.2026):** Ein konfigurierter Routineablauf wird vollständig abgewickelt — bis zu 100 % der konfigurierten Routineanrufe. Ausnahmen (Notfälle, Anliegen außerhalb des konfigurierten Umfangs, bewusst menschliche Fälle, Eskalationsregeln) bleiben menschlich. Die Eingabe im Rechner fragt den ANTEIL DER ANRUFE DES KUNDEN ab, der zu solchen Abläufen gehört — nicht eine Erfolgsquote von Cogniiq |
| A8 / F7 | „Mehrere Anrufe gleichzeitig", beziffert mit 10 | **zurückgestuft.** Die Bezifferung war nicht durch eine dokumentierte Bereitstellung gedeckt; die Gleichzeitigkeit des Sprachdienstes ist eine Konto-Grenze, keine Kundenzusage. Siehe OWNER-INPUT B11a. Bis zur Bestätigung steht überall die Fassung ohne Zahl |
| — | „kein Anruf geht verloren" | **wird nicht behauptet.** Überlauf, Warteschlange und Rückfallnummer hängen am Setup (B9/B11) und sind nicht dokumentiert |
| F10 | Tarifzuordnung nach günstigstem Gesamtpreis | **unverändert offen** — die Zusage muss vertraglich und im Abrechnungsprozess gedeckt sein. Neu ist nur, dass sie jetzt an genau einer Stelle im Code steht (`waehleSzenario`) und nicht mehr an zweien |


## Z31 · Wirtschaftlichkeit und Produktwahrheit, 11.09.2026 (2)

| # | Aussage | Status |
|---|---|---|
| — | Negativer Nettoeffekt aus unvollständigen Angaben | **behoben.** Fehlende Chancenangaben gingen als 0 in die Rechnung ein. Der Rechner kennt jetzt einen ausdrücklichen Zustand „unvollständig" und zeigt dort KEINE Zahl — weder negativ noch positiv. Ein vollständiges negatives Ergebnis wird unverändert gezeigt |
| H3 | „ab drei Sprachen 230 €", „bis zu fünf Sprachen" | **offen und jetzt wirksam.** Der Rechner beziffert nur die eindeutigen Fälle und weist den Rest als offene Position aus, inklusive der Monatssumme. Zwei ja/nein-Fragen an den Inhaber, siehe OWNER-INPUT H3 |
| — | Produktbild „aufnehmen und übergeben" auf Segmentseiten | **korrigiert** auf `/praxen`, `/ki-telefonassistent-praxis`, `/ki-telefonassistent-restaurant`, `/ki-telefonassistent-hotel` und in 13 Stadt-Konfigurationen. Normalfall ist die Abwicklung im Gespräch; die Übergabe ist als Rückfallweg und Ausnahme benannt |
| A8 / F7 / B11a | „ohne Warteschleife", „kein Besetztzeichen", „egal wie voll" | **entfernt** auf allen nicht eingefrorenen Flächen und durch einen Test gesperrt. Verbleibende Stelle: eingefrorene Arzt-Route (post-experiment P10) |
| — | BOOKING_WRITE-Dokumentation | **korrigiert.** Der Kommentar leitete aus der Anbindungsbedingung eine Produktbeschreibung ab („universell gilt die Aufnahme des Terminwunsches"). Jetzt stehen beide Regeln getrennt: `AUTOMATED_WORKFLOW_COMPLETION` als zugesicherte Fähigkeit, `SYSTEM_SCHREIBZUGRIFF` als kundenspezifische Bedingung |
