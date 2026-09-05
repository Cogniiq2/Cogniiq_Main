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
| Z0 | **Automatisierungsgrad 90 %** — Vorgabewert des Praxis-Rechners: der Anteil der Anrufe, den der Assistent vollständig übernimmt | `PraxisRechnerWidget`, `RECHNER.rahmung` — Preisseite und `/praxen` | **Höchste Priorität.** Die Zahl steht als Voreinstellung vor jedem Besucher und ist damit die sichtbarste Produktaussage der Preisseite. OWNER-INPUT **F4** („eigene gemessene Übernahmequote") ist unbeantwortet. Diese Zielgruppe rechnet solche Zahlen nach — ohne Beleg ist sie das größte Einzelrisiko der Seite. Ersetzt die vorherige Fassung, die bewusst am unteren Rand der einzigen dokumentierten Praxisrechnung (10–20 %) rechnete |
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
| Z12 | **Blog-Orientierungspreise** — der einzige Betrag, der den bestätigten `TARIFE` widersprach (200–450 € für den Telefonassistenten), ist am 18.08.2026 entfernt. Offen bleiben die Webdesign- und Automatisierungsbeträge (150–500 €, 2.500–8.000 € u. a.) | `blog-data.ts` | Bestätigen oder entfernen |
| Z13 | **Gründer-Spezialisierungen** | `AboutSection` — heute neutral „Gründer" | Erst nach Bestätigung wieder personenbezogen ausweisen |

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
| Z23 | Abfrage von Angaben vor einer Absage („etwa Name und Geburtsdatum") | ebd., Abschnitt „Absagen" | nach Review als Festlegung der Praxis formuliert, nicht als Produktmechanik; deckt sich mit Prüfgruppe „Verwechslung und Zugriff" |
| Z24 | Ausgehende Anrufe (Recall, Nachbesetzung) | ebd., FAQ und Grenzen | nach Review **keine Aussage** in beide Richtungen: „nicht Gegenstand dieses Beitrags und hier nicht zugesagt". Inhaber entscheidet, ob ein FAKTEN-Satz dazu aufgenommen wird |
| Z25 | SMS-/E-Mail-Terminbestätigung als Produktfunktion | `SolutionShowcase.tsx`, `CostComparisonSection.tsx`, `KiCTASection.tsx`, `AutomatisierungArzt.tsx` (nicht Teil dieser Änderung) | offen — im Blogbeitrag entfernt, weil kein FAKTEN-Satz existiert; auf den genannten Seiten steht die Aussage weiterhin. Bestätigen und in `FAKTEN` aufnehmen oder dort ebenfalls entfernen |

Blogbeitrag `/blog/ki-telefonassistent-arztpraxis` (2026-09-05): entfernt wurden
„Terminbestätigung und -erinnerung per SMS oder E-Mail" (Funktion nicht
belegt), „DSGVO-Protokoll: automatisch" (Klasse §7.7-nah) und die Formulierung
„vollständig übernehmen" (COPY-BRIEF §5.9). Die Aussage zum vzbv-Marktcheck
bleibt (freigegebene Statistik, COPY-BRIEF §5.7).
