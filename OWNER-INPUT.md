# OWNER-INPUT — beantwortet

Stand: **18.08.2026, abgeschlossen** · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Grundlage: `.claude/COPY-BRIEF-2.md` (Phase 0). Antworten des Inhabers vom
17. und 18.08.2026.

> **Dieses Dokument ist nicht mehr blockierend.** Die Antworten sind in
> `src/lib/telefonassistent-copy.ts` eingearbeitet — `FAKTEN` und `TARIFE` sind
> die einzige Quelle aller Kernzahlen, `telefonassistent-copy.test.ts` hält das
> durch. Was hier steht, ist die Begründung; der Code ist die Fassung.
>
> **Was noch offen ist, steht gesammelt in `COPY-CLAIMS-TO-VERIFY.md`.**
> Fehlende Beweis-Assets stehen in `ASSETS-REQUIRED.md` §C.

## Zusammenfassung der Antworten

| Gruppe | Ergebnis | Wirkung auf die Website |
|---|---|---|
| **A · Preis & Vertrag** | beantwortet | Drei Tarife (Basis/Praxis/MVZ) mit Kontingent, Obergrenze und Einrichtungsgebühr in `TARIFE`; Enterprise als Fließtextzeile. Laufzeit 12 Monate, 20 % Aufschlag für monatliche Kündbarkeit, Preisgarantie 24 Monate, Kündigung per Klick im Dashboard, Testphase 2 Tage nach Zahlung der ersten Hälfte |
| **B · Produkt & Technik** | teilweise | **Keine fertige PVS-Standardanbindung** — daraus folgt `FAKTEN.keineAnbindung`, die Seite `/integrationen` und die Streichung aller PVS-Namen. Keine Gesprächsaufzeichnung, kein Training auf Kundendaten. 10 gleichzeitige Anrufe. **B4 (Anschlussart/Telefonanlage) blieb unbeantwortet** → jede Zusage dazu ist entfernt, es bleibt die Rufumleitung |
| **C · Compliance** | teilweise | Art.-50-Ansage: **ja**, nicht abschaltbar. AVV wird gestellt, § 203 StGB vertraglich. **Keine TOM-Liste, Verarbeitungsort ungeklärt, AVV mit Unterauftragsverarbeitern unsigniert** → Sperre nach HONESTY-AUDIT §7.7 |
| **D · Service & Betreuung** | beantwortet | Lazar Popovic persönlich, erreichbar täglich 6–20 Uhr, Antwort spätestens in 24 Stunden, Änderungen an Ansagen und Regeln in 3 Tagen |
| **E · Onboarding** | beantwortet | Acht reale Schritte in `EINRICHTUNG_PROJEKT`. Dauern liegen nur für Testphase (2 Tage) und Go-live (7 Tage nach Zahlungseingang) vor — erfundene Dauern sind ausgeschlossen. **E1 („7–14 Tage") ist damit überholt** und aus dem Cluster entfernt |
| **F · Proof-Assets** | offen | Alle fünf fehlen. Fünf Bausteine rendern deshalb nicht — vollständige Liste in `ASSETS-REQUIRED.md` §C |
| **G · Positionierung** | **Option B** | Branchen bleiben nebeneinander, jede Vertikale bekommt einen geschlossenen Einstieg. Innerhalb einer Healthcare-Journey keine Links in Hotel- oder Restaurant-Inhalte |

## Entscheidungen aus dem Nachgang (18.08.2026)

| Thema | Entscheidung |
|---|---|
| Stadtseiten | Kompaktfassungen der geteilten Module mit Verweis auf `/praxen` (Option A) |
| Segmentseiten | Beweiskette getrimmt: M3, M14, M16 voll, der Rest kompakt mit Verweis |
| Seitenhierarchie | `/praxen` und die Service-Seite sind Hub mit voller Kette; Stadt- und Segmentseiten sind Einstiege — siehe `COPY-SEO-CHANGELOG.md` „Seitenhierarchie" |
| Unbelegte Zusagen | Werden entfernt, nicht markiert. Ein `[[CLAIM]]`-Marker schützt intern, der Besucher liest die Zusage trotzdem |
| Verarbeitungsort, Konformität, Zertifizierung | Auf **allen** Produkten gesperrt, bis AVV signiert und Verarbeitungsort geklärt (HONESTY-AUDIT §7.7). Ausnahme: der Standort Dritter, die der Kunde selbst beauftragt |
| Bewegung | COPY-BRIEF-3 §1.4 gilt website-weit, nicht nur im Cluster |
| Typografie | §1.2 gilt website-weit; Durchgang erfolgt, ohne Copy zu ändern |

---

## Nachtrag 10.09.2026 — Terminbuchung und Bestätigungen (abschließend)

Der Inhaber hat die beiden Fragen beantwortet, die `COPY-CLAIMS-TO-VERIFY.md`
Z25 als blockierend geführt hat. **Diese Antworten sind abschließend. Ihr Umfang
wird nicht erweitert, auch nicht sinngemäß.**

| Schlüssel | Antwort des Inhabers | Was daraus für die Website folgt |
|---|---|---|
| `BOOKING_WRITE` | **ONLY AFTER VERIFIED CUSTOMER INTEGRATION** | Der Assistent darf **nicht** als System dargestellt werden, das Termine allgemein oder automatisch in ein Kunden-, Praxis- oder Kalendersystem schreibt. Diese Fähigkeit darf nur dort beschrieben werden, wo die kundenspezifische Anbindung technisch geprüft ist. Universell belegt ist die **Aufnahme** des Terminwunsches, nicht der Schreibvorgang |
| `SMS_EMAIL_CONFIRMATION` | **ONLY FOR SPECIFIC CUSTOMER WORKFLOWS** | SMS- und E-Mail-Bestätigungen sind **keine** Standardfunktion des KI-Telefonassistenten. Generische bzw. öffentliche Copy darf sie nicht als für jeden Kunden enthalten darstellen. Sie dürfen als Bestandteil eines konkret eingerichteten Kundenablaufs beschrieben werden |

**Kanonische Fassung im Code:** `FAKTEN.terminaufnahme` und
`FAKTEN.bestaetigungen` in `src/lib/telefonassistent-copy.ts`. Wer diese Frage
erneut aufwirft, liest zuerst dort.

**Ausdrücklich nicht betroffen** — und deshalb nicht "mit zu korrigieren":

- **Online-Terminbuchung als Funktion einer von Cogniiq gebauten Website.** Das
  ist das Webdesign-Produkt und keine Aussage über eine PVS-Anbindung.
- **Bestätigungs-Mails eines Kontaktformulars** auf einer solchen Website.
- **Das Automatisierungsprodukt**, dessen Gegenstand gerade das Einrichten
  kundenspezifischer Abläufe ist — das ist der von `SMS_EMAIL_CONFIRMATION`
  ausdrücklich erlaubte Fall, kein Verstoß gegen ihn.

---

## Die ursprünglichen Fragen

Zur Nachvollziehbarkeit unverändert erhalten. Leer gebliebene Felder bedeuten:
Die betroffene Aussage steht **nicht** auf der Website.

Stand der Fassung unten: 2026-08-16

**So funktioniert dieses Dokument:** Jede Zeile ist eine Frage. Tragen Sie die
Antwort direkt in die Spalte „Ihre Antwort" ein (Datei editieren genügt).
„Wenn leer" beschreibt, was ohne Antwort passiert — in der Regel: die
betroffene Aussage fliegt von der Website oder der Baustein bleibt unsichtbar.
Nichts wird erfunden; eine leere Antwort führt nie zu einer erfundenen Angabe.

**Blockierend:** Die Arbeit an Vertrauensbausteinen, Restseiten und
Positionierung beginnt erst, wenn dieses Dokument zurückkommt — mindestens
Gruppe G (eine Ankreuz-Entscheidung) und Gruppe C1 (Art.-50-Ansage).

---

## A · Preis & Vertrag

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| A1 | Stimmen die publizierten Staffeln: Basis ab 99 €, Professionell 199–399 €, Enterprise ab 499 €/Monat? (ggf. korrigieren) | | Preisstaffeln und Offer-Schema werden entfernt; Preisseite nennt nur das Modell |
| A2 | Was ist in jeder Staffel konkret enthalten (Anrufkontingent? Anbindungen? Anpassungen?) | | Staffel-Beschreibungen bleiben bewusst vage |
| A3 | Gibt es eine Einrichtungsgebühr? (ja/nein + Betrag oder Spanne) | | Formulierung bleibt „je nach Umfang" — schwächer als eine klare Zahl |
| A4 | Mindestlaufzeit? (Monate) | | Umkehrbarkeits-Block (M19) kann nicht gebaut werden |
| A5 | Kündigungsfrist? | | dito — M19 blockiert |
| A6 | Fällt jemals eine Abrechnung pro Anruf oder pro Minute an? (ja/nein; wenn ja, wann) | | Kernversprechen „keine Abrechnung pro Anruf" (P4) muss von allen Seiten entfernt werden |
| A7 | Gibt es eine Testphase? (Dauer, Kosten, Bedingungen, was passiert danach) | | M19 nennt keine Testphase; „Sie hören den Assistenten vor dem Start" bleibt die einzige Probe-Aussage |
| A8 | Stimmen die Beispielkonfigurations-Preise 249/149/199/299 €/Monat? | | Beispielkonfigurationen verlieren die Preisangabe |

## B · Produkt & Technik

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| B1 | PVS-Liste **direkt angebunden** (Termin/Eintrag landet ohne Zutun im System): welche? | | Keine Integrationen-Seite möglich; Arzt-Seite behält nur „prüfen wir vor dem Angebot" |
| B2 | PVS-Liste **über Schnittstelle möglich**: welche? | | dito |
| B3 | PVS-Liste **auf Anfrage prüfen**: welche? Und: stimmt die publizierte Nennung Tomedo, Medistar, Dampsoft, CGM? | | Die vier PVS-Namen werden von der Arzt-Seite entfernt |
| B4 | Welche Telefonanlagen/Anschlussarten sind kompatibel? Wie läuft die Einbindung technisch (Rufumleitung, SIP, …)? | | „Ihre Rufnummer und Telefonanlage bleiben" wird abgeschwächt |
| B5 | Hosting-Standort(e) konkret (Land, Anbieter)? | | Es bleibt bei „europäische Server" ohne Detail; Datenschutz-Seite nicht baubar |
| B6 | Sub-Auftragsverarbeiter (Liste)? | | Datenschutz-Seite nicht baubar |
| B7 | Werden Patientendaten oder Gesprächsdaten zum Training von Modellen genutzt? (ja/nein) | | Die Aussage „kein Training auf Patientendaten" darf weiterhin nirgends stehen |
| B8 | Was wird aufgezeichnet/gespeichert (Rohaudio? Transkript? Zusammenfassung?), wo, wie lange, wann gelöscht? | | Die publizierte Aussage „keine Rohaudio-Speicherung außer auf Wunsch" muss raus |
| B9 | Verhalten bei Störung/Ausfall: Was passiert technisch konkret (Weiterleitung auf Backup-Nummer? Ansage? automatisch?) | | Fallback-FAQ auf allen Seiten muss raus — Einwand #9 bleibt unbeantwortet |
| B10 | Unterstützte Sprachen heute (nicht geplant): welche? | | „mehrsprachig möglich, üblicherweise Deutsch und Englisch" muss raus (München/Regensburg) |
| B11 | Wie viele Anrufe können tatsächlich parallel angenommen werden? | | „mehrere Anrufe gleichzeitig ohne Warteschleife" wird abgeschwächt |
| **B11a** | **ERNEUT GEÖFFNET am 11.09.2026 — die einzige offene Entscheidung aus dem Rechner-Durchgang.** Die Gleichzeitigkeit des eingesetzten Sprachdienstes (ElevenAgents) ist laut dessen öffentlicher Preisseite eine **Workspace-Grenze**, die sich ALLE Agenten eines Kontos teilen: Free 4, Starter 6, Creator 10, Pro 20, Scale 30, Business 40, Enterprise nach Vereinbarung. Damit ist „10 gleichzeitige Anrufe" eine Konto-Obergrenze, keine Zusage JE KUNDE, sobald zwei Kunden zur selben Zeit telefonieren. **Frage: Wird je Kunde eine eigene Umgebung bereitgestellt oder eine Mindestkapazität vertraglich reserviert? Wenn ja: welche, und ab welchem Tarif?** | | Die Zahl 10 bleibt auf allen nicht eingefrorenen Flächen entfernt; es steht `FAKTEN.gleichzeitigeAnrufeSatz` („Mehrere Anrufe zur selben Zeit — die Kapazität wird auf Ihr Aufkommen ausgelegt und im Angebot ausgewiesen."). Auf der eingefrorenen Preisseite steht sie bis zum Ende der Messung weiter, siehe docs/seo/post-experiment-opportunities.md P5 |
| B12 | Dashboard zur Selbstpflege (Öffnungszeiten, Urlaubsansagen): existiert es heute, was kann es? | | Selbstpflege-Versprechen (P1/§5.5-6) muss von Service-, Arzt- und Bayreuth-Seite entfernt werden |
| B13 | Eigene, selbst aufgesprochene Ansagen der Praxis: heute möglich? Wie läuft die Aufnahme? | | Kernversprechen P2 („Ihre Stimme") muss überall abgeschwächt werden auf „abgestimmte Ansagen" |
| B14 | Notfall-Routing (Team / Bereitschaftsdienst / 112-Ansage) frei konfigurierbar? | | Notfall-Beschreibung wird auf das Minimum reduziert |

## C · Compliance

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| C1 | **Sagt der Assistent heute zu Gesprächsbeginn an, dass ein KI-System spricht? (ja/nein)** Wenn nein: bis wann wird das umgesetzt? | | **Blocker.** Die Aussage steht seit Pass 1 auf allen Seiten. Bei „nein" muss sie sofort raus — und unabhängig vom Marketing gilt die Pflicht aus Art. 50 KI-VO |
| C2 | Wird der AVV nach Art. 28 DSGVO standardmäßig gestellt („inklusive")? Oder nur auf Anfrage? | | Formulierung fällt zurück auf „auf Anfrage" |
| C3 | Existiert eine TOM-Liste (technische und organisatorische Maßnahmen)? | | Datenschutz-Seite bleibt ohne TOM-Abschnitt |
| C4 | Sind AVV/TOM/Datenschutz-Unterlagen als Download bereitstellbar? | | Kein Download-Abschnitt |
| C5 | Wie wird § 203 StGB (Schweigepflicht, Gehilfen) vertraglich behandelt? | | Die S4-Seite kann den Punkt nur benennen, nicht beantworten |

## D · Service & Betreuung

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| D1 | Wen erreicht die Praxis konkret? (Name + Rolle; darf er/sie mit Foto auf die Website?) | | M18 („Änderungen und Betreuung") bleibt ohne Person — deutlich schwächer |
| D2 | Erreichbarkeitsfenster (Wochentage, Uhrzeiten, Kanäle)? | | M18 nennt kein Fenster |
| D3 | Zugesagte Reaktionszeit auf Anfragen? | | Formular-Zusage („was passiert nach dem Absenden, in welchem Zeitfenster") entfällt |
| D4 | Wie schnell wird eine Änderung an Ansage oder Regel umgesetzt? (Frist, die zugesagt werden darf) | | M18 kann Einwand #6 (52 % nennen Support als Wechselgrund, Zi 2026) nicht kontern |
| D5 | Wie werden Änderungswünsche eingereicht (Anruf? Mail? Dashboard?) und wer setzt sie um? | | dito |

## E · Onboarding-Prozess (trägt das gesamte „für Ihre Praxis gebaut"-Versprechen)

Bitte die **tatsächlichen** Schritte von Vertragsschluss bis Live-Gang aufschreiben —
so wie sie wirklich ablaufen, nicht wie sie klingen sollen. Pro Schritt: Was
passiert, wer macht es (Cogniiq/Praxis), wie lange dauert es, was muss die
Praxis beitragen.

| Schritt | Was passiert | Wer | Dauer | Beitrag der Praxis |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 (optional) | | | | |

| # | Zusatzfrage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| E1 | Stimmt die Gesamtdauer „in der Regel 7–14 Tage"? | | Zeitangabe fliegt aus Stadtseiten und HowTo-Schema (P14D) |
| E2 | Gibt es ein Aufnahmegespräch, in dem Anrufanlässe kartiert werden? Wie lange dauert es? | | Der 5-Schritte-Block bleibt generisch — genau das kritisiert Brief II §4.5 |
| E3 | Werden Gesprächsverläufe in den ersten Wochen aktiv ausgewertet? In welchem Rhythmus? | | Aussage wird entfernt |

## F · Proof-Assets (ohne diese bleiben die stärksten Bausteine unsichtbar)

| # | Asset | Vorhanden? (ja/nein/bis wann) | Wenn leer |
|---|---|---|---|
| F1 | **Audioaufnahme eines echten Anrufs** (mit Einwilligung, ohne Patientendaten, 30–90 s) | | M13 „Stimmprobe" — der stärkste Baustein der Website — rendert nicht. Keine Ersatzstimme, keine synthetische Probe |
| F2 | **Screenshot oder 20–30-s-Bildschirmaufnahme der Übergabe** (was das Team nach dem Anruf sieht) | | M14 zeigt nur Text, kein Beweisbild |
| F3 | **Referenzpraxis** mit schriftlicher Einwilligung (anonymisiert ok: „Hausarztpraxis mit drei Behandlern, Oberfranken" + echtes Zitat) | | M22 rendert nicht; die Website bleibt ohne jede Kundenstimme |
| F4 | Eigene gemessene Übernahmequote (konservativ, netto nach Nacharbeit) | | Es bleibt zahlenlos — kein Rechner, keine Quote |
| F5 | Foto + Name des festen Ansprechpartners (für M18) | | M18 ohne Person |

## G · Positionierung (genau EINE Option ankreuzen — ohne diese Entscheidung keine Phase 4)

| Option | Bedeutung | Ihre Wahl |
|---|---|---|
| **A — Healthcare-Fokus** | Der Gesundheits-Cluster bekommt eigenen Einstieg, eigene Navigation, eigene Landingpage; Hotel/Restaurant nur noch über die Unternehmens-Startseite erreichbar. Gesundheitsseiten verlinken nie in Hotel-/Restaurant-Inhalte. Achtung: braucht voraussichtlich neue Routen → Vorschlag kommt zur Freigabe | ☐ |
| **B — Horizontal mit klarer Trennung** | Branchen bleiben nebeneinander, aber jede Vertikale bekommt einen in sich geschlossenen Einstieg; Querverlinkungen zwischen Branchen innerhalb einer Customer Journey werden entfernt (z. B. „KI Telefonassistent Restaurant" verschwindet aus den Links der Arzt-Seite) | ☐ |
| **C — Horizontal wie bisher** | Struktur unverändert; die Spezifität muss vollständig aus Onboarding-Prozess und Segmenttiefe kommen; keine Healthcare-Exklusivität im Text | ☐ |

| # | Zusatzfrage | Ihre Antwort |
|---|---|---|
| G1 | Sollen die im Brief geforderten, noch fehlenden Seiten angelegt werden (Integrationen/PVS, Datenschutz & Sicherheit, Segmente Zahnarzt/MVZ)? Das ändert die URL-Struktur → nur mit Ihrer Freigabe, Routenvorschlag folgt | |
| G2 | Hauptsitz Bayreuth mit Vor-Ort-Terminen: bestätigt? (steht auf der Bayreuth-Seite) | |

---

## Was nach Rückgabe passiert (Reihenfolge aus `.claude/COPY-BRIEF-2.md`)

1. **Phase 1:** Repo-weites Ehrlichkeits-Audit (`HONESTY-AUDIT.md`) + Fixes — läuft unabhängig von den meisten Antworten, wartet aber vereinbarungsgemäß auf dieses Dokument.
2. **Phase 2:** Vertrauensbausteine M13–M22; Bausteine mit fehlendem Asset werden gebaut, bleiben aber unsichtbar (kein Platzhalter im DOM).
3. **Phase 3:** Restseiten (Bayern, Demo, Hotel/Restaurant-Ehrlichkeitspass, Homepage je nach G).
4. **Phase 4:** Umsetzung der Positionierungs-Entscheidung G.
5. **Phase 5:** `SEO-BASELINE.md`, Schema-Erweiterung, Review-Banner (`VITE_REVIEW_MODE`, standardmäßig aus).

---

## Nachtrag 11.09.2026 (2) — offene Punkte aus dem Preisrechner

Der Preisrechner auf `/ki-telefonassistent` rechnet bewusst NICHT, was die
vorhandenen Quellen nicht eindeutig festlegen. Alle drei Punkte sind heute im
Rechner als Regel im Text sichtbar und nicht als Zahl — sobald sie beantwortet
sind, kann die Arithmetik sie aufnehmen.

### H1 · Bemessungsgrundlage des 20-%-Aufschlags (monatliche Kündbarkeit)

`FAKTEN.laufzeit` sagt: „Die Laufzeit beträgt 12 Monate; wer monatlich kündbar
bleiben möchte, zahlt 20 % Aufschlag." **Worauf** bemisst sich der Aufschlag?

- nur auf den Grundpreis des Tarifs
- auf Grundpreis **und** Mehrverbrauch
- auf die Obergrenze
- zusätzlich auf den Sprachaufschlag
- zusätzlich auf die Einrichtungsgebühr

Fünf Lesarten, fünf verschiedene Rechnungen. Der Rechner zeigt den Aufschlag
deshalb als Vertragsregel an und bietet keinen Schalter dafür. Sobald die
Grundlage feststeht, wird daraus ein Schalter.

### H2 · Sprachaufschlag und Tarif-Obergrenze

Liegt der monatliche Sprachaufschlag **innerhalb** der Obergrenze des Tarifs
(also gedeckelt) oder **daneben** (also zusätzlich)? Der Rechner weist ihn heute
als eigene Zeile aus und sagt dazu, dass die Zuordnung im Angebot steht — er
rechnet ihn weder still in die Obergrenze hinein noch still darüber hinaus.

### H3 · Bedeutung von „ab drei Sprachen" und „bis zu fünf Sprachen gleichzeitig"

> **ERNEUT GEÖFFNET am 11.09.2026 — blockiert eine Zahl im öffentlichen Rechner.**
> Der Preisrechner beziffert den Sprachaufschlag seither nur noch dort, wo die
> Preisliste eindeutig ist: nur Deutsch (0 €) und eine Zusatzsprache (79 €). Ab
> zwei Zusatzsprachen weist er die Position als offen aus und nennt keine
> Monatssumme mehr.
>
> **Zwei Fragen, beide mit ja/nein beantwortbar:**
> 1. Meint „ab drei Sprachen sind es 230 € im Monat" drei Sprachen INKLUSIVE
>    Deutsch (die Schwelle läge dann bei zwei Zusatzsprachen) oder drei
>    ZUSATZsprachen neben Deutsch?
> 2. Zählt Deutsch bei „bis zu fünf Sprachen gleichzeitig" mit?
>
> Bis dahin bleibt die Position offen. Sie auf 0 zu setzen wäre falsch, und sie
> zu raten hieße, eine Vertragsbedingung aus wirtschaftlicher Plausibilität zu
> erschließen — der Kunde bekommt am Ende, was im Vertrag steht.



`SPRACHEN` sagt: „Jede weitere Sprache kostet 79 € im Monat; ab drei Sprachen
sind es 230 € im Monat für bis zu fünf Sprachen gleichzeitig."

- „ab drei Sprachen" ist als **drei ZUSATZsprachen** gelesen, weil nur diese
  Lesart wirtschaftlich aufgeht (2 × 79 € = 158 € wäre günstiger als ein Paket
  zu 230 €; erst 3 × 79 € = 237 € macht das Paket sinnvoll). **Bitte bestätigen.**
- Zählt „fünf Sprachen" Deutsch mit — also Deutsch + vier, oder Deutsch + fünf?
  Der Rechner bietet deshalb oberhalb des Pakets keine weitere Stufe an.

### H4 · Gemessene Übernahmequote (weiterhin offen, siehe F4)

Der Wirtschaftlichkeitsrechner lässt den Anteil automatisierbarer Anrufe vom
Besucher eintragen und nennt daneben ausdrücklich, dass Cogniiq keine eigene
Quote behauptet. Der Startwert bleibt bei 20 % — dem oberen Rand der einzigen
dokumentierten Spanne —, solange F4 unbeantwortet ist. **Nicht anheben, bevor
eine gemessene Zahl vorliegt:** Der Wert steht als Vorgabe vor jedem Besucher.

### H5 · Stimmprobe fehlt weiterhin (Asset)

Die Seite argumentiert jetzt prominent mit natürlichem Gespräch als
Hauptunterscheidungsmerkmal — hat dafür aber kein Hörbeispiel.
`StimmprobeSection` ist vorhanden und rendert nichts, solange
`STIMMPROBE.src` null ist. Eine freigegebene, nachgestellte Audiodatei wäre der
stärkste einzelne Beleg auf dieser Seite (Spezifikation in
`ASSETS-REQUIRED.md`). Es wird keine Stimme erfunden oder eingekauft.

---

## Nachtrag 14.09.2026 — drei Prüfungen, die nur Sie durchführen können

Alle drei blockieren eine Schlussfolgerung, nicht eine Umsetzung: die Arbeit
ist gemacht, aber ohne Ihre Antwort bleibt sie unbewertet.

### I1 · Von Google ausgewählter Canonical für `/webdesign` — **blockiert die Diagnose**

`/webdesign` hatte 1.756 Impressionen bis zum 30.08.2026 und **null** an jedem
Tag vom 01. bis 11.09. Die Seite ist indexierbar, in der Sitemap, auf sich
selbst kanonisiert und antwortet mit 200. Die stärkste Erklärung ist, dass
Google sie mit `/webdesign-agentur-deutschland` zusammengelegt hat — **bewiesen
ist das nicht**, weil der verbundene Zugriff den ausgewählten Canonical nicht
zurückgegeben hat.

So prüfen: Search Console → URL-Prüfung →
`https://cogniiq.de/webdesign` → Felder **„Vom Nutzer angegebener Canonical"**
und **„Von Google ausgewählter Canonical"** notieren. Danach **„Live-URL
testen"**, weil der letzte bekannte Crawl vom 18.08.2026 stammt und die heutige
Fassung nicht kennt.

**Was die Antwort belegt — und was nicht.** Diese Prüfung beantwortet eine
Frage über den Indexzustand, keine Frage über die Ursache des Einbruchs. Beide
Ausgänge sind enger, als sie wirken:

- **Weichen die beiden Werte ab** → belegt ist damit eine
  **Canonical-Abweichung**: Google führt `/webdesign` nicht als eigenständiges
  Dokument. Das ist ein Befund über den Index, **kein Kausalnachweis für den
  Verkehrseinbruch**. Wann Google diese Auswahl getroffen hat, sagt das Feld
  nicht; sie kann lange vor dem 01.09. bestanden haben oder unabhängig davon
  entstanden sein. Die zeitliche Nähe bleibt ein Indiz, kein Beweis. Der Befund
  rechtfertigt, F9 vorzuziehen, sobald die beiden Bayreuther Experimente
  graduieren — weil eine Abweichung unabhängig von ihrer Ursache behoben
  gehört, nicht weil die Ursache damit geklärt wäre.
- **Stimmen sie überein** → ausgeschlossen ist damit **nur die Deduplizierung
  auf Canonical-Ebene**. Eine Überschneidung der Suchintention ist damit
  **nicht** ausgeschlossen: zwei getrennt indexierte URLs können weiterhin um
  dieselben Queries konkurrieren, Relevanzsignale untereinander aufteilen und
  je Query abwechselnd ausgespielt werden, ohne dass ein Canonical sie
  zusammenführt. K2 wäre dann in seiner Canonical-Lesart erledigt, als
  Intentionskonflikt aber weiterhin offen — zu prüfen an Query × Seite, ob
  beide URLs für dieselben Queries erscheinen.

In **keinem** der beiden Fälle wird `/webdesign` weiter geändert, bevor die
Auswertung an Query × Seite vorliegt (Deploy + 28 Tage).

### I2 · GA4: gehört der Stream zur Property, und zählt er Seitenwechsel?

GA4 `properties/551863316` meldet für den 15.08.–11.09.2026 null Sitzungen.
Das beweist **weder**, dass die Implementierung vom 12./13.09. defekt ist,
**noch**, dass keine Anfragen eingegangen sind.

1. Bestätigen, dass Stream **`G-NDN9J2G5LM`** zu genau dieser Property gehört.
2. Die Website mit erteilter Analyse-Einwilligung öffnen und im
   Echtzeitbericht prüfen, ob `page_view` beim ersten Aufruf **und** bei jedem
   Seitenwechsel **genau einmal** ankommt.
3. In den Stream-Einstellungen prüfen, ob **„Seitenaufrufe über
   Browserverlauf-Ereignisse"** aktiviert ist. Die Website ist eine
   Single-Page-Anwendung: ohne diese Einstellung zählt nur der erste Aufruf.

**Erst wenn Punkt 3 negativ ist**, ist ein manueller Seitenaufruf im Code
gerechtfertigt. Vorher würde er die Aufrufe verdoppeln. Ads
`AW-17946397271` bleibt unberührt, der stillgelegte Stream `G-K7BS3LKT6H` wird
nicht reaktiviert.

### I3 · `lead_submitted` in GA4 als Schlüsselereignis markieren

Seit dem 14.09.2026 meldet die Website ein Ereignis namens **`lead_submitted`**,
sobald der Endpunkt den Eingang einer Anfrage mit einem lesbaren 2xx bestätigt
hat — für das Kontaktformular und für das Demo-Formular, jeweils mit dem Label
`kontakt` bzw. `demo`. Bis dahin kannte GA4 27 Absichtssignale und keinen
einzigen bestätigten Lead.

Damit es als Conversion zählt, muss es in GA4 unter *Verwaltung →
Ereignisse* als **Schlüsselereignis** markiert werden. Es erscheint dort erst,
nachdem es zum ersten Mal ausgelöst wurde.

**Bitte keine Testanfrage über das echte Formular abschicken** — der Endpunkt
löst eine reale Bearbeitung aus. Das Ereignis erscheint mit der ersten echten
Anfrage.
