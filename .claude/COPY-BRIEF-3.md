# MASTER PROMPT III — Premium-Wirkung, Konversion & Verkaufspsychologie

> **Zusatz zu `.claude/COPY-BRIEF.md`, `.claude/COPY-BRIEF-2.md` und den Owner-Antworten.**
> Alle bisherigen Regeln bleiben vollständig bindend — insbesondere: nichts erfinden, keine unbelegten Zahlen, keine Kundenandeutung, keine Hosting-Aussagen, kein Wettbewerber negativ benannt.
> Dieser Zusatz regelt **Wirkung, Aufbau und Konversion**, nicht Faktenlage.

---

## 0 · WAS „PREMIUM" FÜR DIESEN KÄUFER BEDEUTET — ZUERST LESEN

Die Zielgruppe ist keine Consumer-Zielgruppe. Es sind Praxisinhaberinnen und -inhaber, MVZ-Leitungen und Zahnärzte, im Schnitt deutlich über 45, die von Software enttäuscht wurden und Verkaufssprache sofort erkennen.

**Für diese Zielgruppe wirkt gestalterischer Aufwand nicht wie Qualität, sondern wie Risiko.** Farbverläufe, Glow-Effekte, animierte Hero-Elemente, Zähler, die hochlaufen, und lächelnde Stockfoto-Ärzte signalisieren: austauschbar, jung, vermutlich nächstes Jahr weg.

**Premium entsteht hier durch fünf Dinge:**

| Prinzip | Konkret |
|---|---|
| **Zurückhaltung** | Wenig Farbe, viel Weißraum, keine Effekte ohne Funktion |
| **Typografische Präzision** | Echte Hierarchie, ruhige Zeilenlängen, saubere Rhythmen |
| **Informationsdichte statt Behauptung** | Ein konkreter Ablauf schlägt drei Adjektive |
| **Ruhe** | Nichts bewegt sich, was nicht bewegt werden muss |
| **Handwerk im Detail** | Konsistente Abstände, korrekte Typografie, geprüfte Zahlen |

**Maßstab für jede Gestaltungsentscheidung:** Wirkt das wie eine Kanzlei oder ein spezialisierter Fachanbieter, der seit Jahren sauber arbeitet — oder wie eine Landingpage, die diese Woche entstanden ist?

---

## 1 · GESTALTUNGSRAHMEN

Bestehende Designtokens und Komponenten weiterverwenden. Nichts neu erfinden, wo etwas Funktionierendes existiert. Diese Regeln gelten für alles, was in diesem Durchgang entsteht oder überarbeitet wird.

### 1.1 Farbe

- Eine ruhige Grundpalette, **ein** Akzent. Der Akzent markiert ausschließlich Handlung (primärer CTA) und wird sonst nicht verwendet.
- Keine Farbverläufe auf Flächen, kein Glow, keine Neontöne.
- Rot ausschließlich für Fehlerzustände — nie für Marketing, nie für Warnhinweise in der Copy.
- Ausreichende Kontraste durchgehend (mindestens WCAG AA). Diese Zielgruppe liest mit über 45 Jahren.

### 1.2 Typografie

- Fließtext mindestens **17–18 px**, Zeilenhöhe ca. 1.6, Zeilenlänge 60–75 Zeichen.
- Klare Größensprünge zwischen H1/H2/H3/Fließtext. Keine drei fast gleich großen Ebenen.
- Kein Text unter 14 px, auch nicht in Fußnoten oder Quellenangaben.
- **Korrekte deutsche Typografie:** „echte Anführungszeichen", Halbgeviertstrich für Einschübe, geschütztes Leerzeichen vor Einheiten (`10 %`, `300 €`, `24 h`), keine geraden Apostrophe.
- Zahlen in Tabellen tabellarisch ausrichten.

### 1.3 Raum und Rhythmus

- Großzügiger, aber **konsistenter** vertikaler Abstand zwischen Abschnitten. Ein einheitlicher Rhythmus wirkt teurer als jedes Detail.
- Abschnitte klar voneinander getrennt — durch Raum, nicht durch Rahmen, Schatten oder Farbflächen.
- Keine vollflächigen Farbblöcke zur Abschnittstrennung.

### 1.4 Bewegung

- Bewegung nur, wenn sie Verständnis unterstützt.
- Maximal **150–200 ms**, `ease-out`, ausschließlich Deckkraft und kleine Verschiebung.
- **Verboten:** Parallax, hochzählende Zahlen, Scroll-getriggerte Sequenzen, pulsierende Elemente, automatische Karussells, Typewriter-Effekte.
- `prefers-reduced-motion` respektieren.

### 1.5 Bilder — die wichtigste Einzelentscheidung

**Keine Stockfotos.** Lächelnde Ärztinnen mit Tablet, generische Empfangstresen, Handshake-Motive: Das ist das deutlichste Erkennungszeichen einer Vorlagen-Website und zerstört genau die Glaubwürdigkeit, die diese Seiten aufbauen sollen.

Erlaubt und erwünscht:

1. **Produkt-Screenshots** — das Dashboard nach einem Anruf. Der stärkste verfügbare Bildinhalt. `[[ASSET]]`
2. **Foto von Lazar Popovic** — echt, professionell, ohne Retusche-Anmutung. `[[ASSET]]`
3. **Typografische und datengetriebene Darstellungen** — Ablaufdiagramme, Tarifvergleiche, der Weg eines Anrufs.
4. **Der Audio-Player** — er ist ein visuelles Element eigener Klasse.

Wo kein echtes Bild existiert: **kein Bild.** Ein sauber gesetzter Textabschnitt wirkt hochwertiger als ein gekauftes Motiv.

### 1.6 Mobil

Ein erheblicher Teil dieser Zielgruppe liest abends auf dem Telefon.

- Fließtext nicht kleiner als in der Desktop-Ansicht.
- Tap-Ziele mindestens 44 px.
- Tabellen mobil in Karten umbrechen, nicht horizontal scrollen lassen.
- Der primäre CTA muss ohne Suchen erreichbar sein — aber **kein** aufdringlicher Sticky-Balken, der Inhalt verdeckt.

### 1.7 Geschwindigkeit als Vertrauenssignal

Eine langsame Seite widerspricht dem Versprechen technischer Kompetenz — und dieser Käufer hat dokumentiert schlechte Erfahrungen mit träger Software.

Ziel: LCP unter 2,5 s, CLS unter 0,1, keine Layoutsprünge beim Laden. Bilder in modernen Formaten, korrekt dimensioniert, Schriften mit `font-display: swap`. Keine Bibliothek für einen Effekt, der auch ohne sie geht.

---

## 2 · DIE BEWEISKETTE — AUFBAU JEDER KOMMERZIELLEN SEITE

Konversion entsteht bei dieser Zielgruppe nicht durch Druck, sondern dadurch, dass **jeder Abschnitt die Frage beantwortet, die der vorherige ausgelöst hat.** Wird eine Frage übersprungen, springt der Leser ab — er kauft nicht, weil er noch einen Einwand hat, den niemand adressiert hat.

Verbindliche Reihenfolge für `/praxen`, die Service-Seite und die drei Stadtseiten:

| # | Abschnitt | Frage, die der Leser gerade hat | Modul |
|---|---|---|---|
| 1 | **Wiedererkennung** | „Versteht der überhaupt, wie es bei mir läuft?" | M1 |
| 2 | **Was es kostet** | „Ist das wirklich ein Problem — oder nur lästig?" | M2 |
| 3 | **Patientensicht** | „Merken meine Patienten das eigentlich?" | M20 |
| 4 | **Warum bisherige Versuche scheiterten** | „Warum sollte das jetzt anders sein?" | M3 |
| 5 | **Stimmprobe** | „Wie klingt das denn?" | M13 |
| 6 | **Die vier Säulen** | „Was macht ihr konkret anders?" | M4 |
| 7 | **Die Übergabe** | „Und wer tippt das dann bei mir ein?" | M14 |
| 8 | **Anliegen-Katalog** | „Was genau kann das — und was nicht?" | M8 |
| 9 | **Grenzen** | „Wo ist der Haken?" | M15 |
| 10 | **Für Ihr Team** | „Machen meine MFA das mit?" | M21 |
| 11 | **Einrichtung** | „Wie läuft das ab, und was kostet mich das an Zeit?" | M17 |
| 12 | **Betreuung** | „Und wenn ich später etwas ändern will?" | M18 |
| 13 | **Preis & Deckelung** | „Was kostet es — und kann es teurer werden?" | M10 |
| 14 | **Umkehrbarkeit** | „Wie komme ich wieder raus?" | M19 |
| 15 | **Wann wir nicht passen** | „Ist der ehrlich?" | M16 |
| 16 | **Datenschutz kurz** | „Was sagt mein Datenschutzbeauftragter dazu?" | M7 |
| 17 | **FAQ** | Restzweifel | M11 |
| 18 | **Nächster Schritt** | „Was passiert, wenn ich klicke?" | M12 |

**Regel:** Kein Abschnitt darf einen späteren vorwegnehmen, und keiner darf ausgelassen werden, weil die Seite lang wird. **Länge ist hier kein Problem — Lücken sind es.** Dieser Käufer liest lange, wenn der Text präzise ist, und springt ab, sobald eine Frage offenbleibt.

---

## 3 · VERKAUFSPSYCHOLOGIE — AN DIE RECHERCHE GEBUNDEN

Jeder eingesetzte Hebel muss auf eine dokumentierte Angst oder einen dokumentierten Wunsch antworten. Keine allgemeinen Konversionstricks.

### 3.1 Spezifität schlägt Superlativ

Der stärkste Wirkmechanismus bei dieser Zielgruppe. Sie hat gelernt, dass Anbieter übertreiben — Präzision ist deshalb selbst schon ein Beweis.

| Statt | Besser |
|---|---|
| „Deutliche Entlastung" | „10 gleichzeitige Anrufe, kein Besetztzeichen" |
| „Schneller Support" | „Antwort spätestens in 24 Stunden, erreichbar täglich 6–20 Uhr" |
| „Individuelle Einrichtung" | Die acht Schritte aus M17, mit Dauer |
| „Planbare Kosten" | „Basis läuft nie über 500 € im Monat" |
| „Schnelle Inbetriebnahme" | „7 Tage — sonst entfällt die zweite Hälfte der Einrichtung" |

**Jede Zahl auf der Seite muss überprüfbar sein.** Eine einzige nicht haltbare Zahl entwertet alle anderen.

### 3.2 Genannte Grenzen als Vertrauensbeweis

M15 und M16 sind keine Pflichtübung, sondern Konversionsinstrumente. Wer sagt, was er **nicht** kann, wird bei dem geglaubt, was er kann.

- M15 (was der Empfang nicht macht) steht **vor** dem Preis, nicht danach.
- M16 (wann wir nicht passen) enthält zwei bis drei konkrete Konstellationen, sachlich, ohne versteckte Eigenwerbung.
- Nie abschwächen, nie in ein Akkordeon verstecken, nie kleiner setzen.

### 3.3 Risikoumkehr statt Dringlichkeit

Dieser Markt reagiert nicht auf Verknappung — auf dieser Website lief bereits ein erfundener Verfügbarkeitszähler, und genau das ist das Muster, das hier Vertrauen zerstört.

**Stattdessen wird jedes Risiko sichtbar entfernt:**

| Risiko im Kopf des Käufers | Antwort auf der Seite |
|---|---|
| „Es dauert ewig" | 7-Tage-Go-live-Garantie **mit Vertragsstrafe** |
| „Es wird teurer als gedacht" | Deckelung auf den nächsthöheren Tarif, 24 Monate Preisgarantie |
| „Ich komme nicht mehr raus" | Kündigung mit einem Klick im Dashboard |
| „Es passt nicht zu meiner Praxis" | 2 Tage Testphase, Go-live erst bei Zufriedenheit |
| „Später kümmert sich keiner" | Änderungen garantiert in 3 Tagen |
| „Meine Patienten kommen nicht klar" | Stimmprobe, hörbar, vor jedem Preis |

**Die Go-live-Garantie mit finanzieller Konsequenz ist das stärkste Einzelargument der gesamten Website.** Sie gehört auf `/praxen`, die Preisseite und in die FAQ — jeweils als eigener, ruhig gesetzter Block, nicht als Aufzählungspunkt.

### 3.4 Verankerung — sachlich, nie rechnerisch aufgebläht

Die legitime Ankerzahl ist die Personalkostenbasis: Eine MFA kostet nach Tarif 2026 monatlich ab 2.939,59 € brutto, mit Arbeitgeberkosten deutlich mehr.

Sachlich danebenstellen, ohne Ersparnisbehauptung, ohne Suggestivfrage, ohne „ersetzt eine halbe Stelle". Der Vergleich wirkt von selbst. Quelle und Jahr sichtbar.

### 3.5 Persönliche Ansprechbarkeit statt Firmenfassade

Dass Lazar Popovic persönlich betreut, ist ein echter Vorteil gegenüber Ticketsystemen — und 52 % der Praxen nennen unzureichenden Support als Grund, ein System aufzugeben.

Name, Foto, Erreichbarkeitsfenster, Antwortzeit — an einer Stelle, ruhig gesetzt. Kein Team-Grid mit erfundenen Rollen. Kein „unser Support-Team".

### 3.6 Mikro-Verpflichtungen statt einem großen Sprung

Eine Praxis unterschreibt nicht beim ersten Besuch. Die Seite bietet eine Leiter kleiner Schritte:

1. Stimmprobe anhören (kein Formular)
2. ROI-Rechner mit eigenen Zahlen ausfüllen (kein Formular)
3. Ablauf der Einrichtung lesen
4. Erstgespräch vereinbaren

**Kein Schritt außer dem letzten verlangt Kontaktdaten.** Kein Gating, kein „Ergebnis per E-Mail erhalten", kein Download gegen Adresse. Bei dieser Zielgruppe kostet ein Gate mehr Vertrauen, als die Adresse wert ist.

### 3.7 Die Sprache des Lesers, in eigenen Sätzen

Die Wiedererkennung entsteht aus Genauigkeit, nicht aus Behauptung. **Nie** schreiben: „Wir wissen, wie stressig Ihr Praxisalltag ist."

Belegte Situationen, aus denen gearbeitet wird — **in eigenen Sätzen, nie als Zitat, nie einer Person zugeschrieben:**

- Das Telefon klingelt, während jemand am Tresen steht und wartet.
- Die Diskussion über die schlechte Erreichbarkeit dauert länger als das medizinische Anliegen selbst.
- Anrufende, die es zehnmal versuchen und dann aufgeben.
- Patientinnen, die einen Termin nicht absagen können und eine Ausfallgebühr fürchten.
- Der Verdacht auf Patientenseite, die Leitung sei absichtlich stillgelegt.
- Telefonzeiten, die immer weiter eingeschränkt werden, weil es anders nicht geht.
- Rückrufe, die abends nach der Sprechstunde selbst erledigt werden.

Vokabular des Marktes: `die Flut an Anrufen` · `zu Stoßzeiten` · `ständig unterbrochen` · `spürbar entlasten` · `keiner geht ans Telefon` · `immer besetzt` · `nicht durchkommen`.

---

## 4 · CALL-TO-ACTION UND MIKROTEXTE

### 4.1 CTA-Regeln

- **Ein** primärer CTA pro Seite, höchstens dreimal wiederholt, im Akzentfarbton.
- Immer benennen, was danach passiert.

**Erlaubt:**
`Unverbindliches Erstgespräch vereinbaren` · `Ihren Empfang gemeinsam durchgehen` · `Stimmprobe anhören` · `Mit Ihren Zahlen rechnen`

**Verboten:**
`Jetzt kostenlos starten` · `Sichern Sie sich…` · `Nur noch wenige Plätze` · alles mit Ausrufezeichen · jede Form von Countdown, Verknappung oder künstlicher Dringlichkeit

### 4.2 Mikrotexte — hier entsteht der Premium-Eindruck

| Ort | Text |
|---|---|
| Unter dem primären CTA | „15 Minuten. Kein Verkaufsgespräch, keine Präsentation." `[[CLAIM: Dauer bestätigen]]` |
| Formularabschluss | „Sie erhalten innerhalb von 24 Stunden eine persönliche Antwort — von mir, nicht von einem Ticketsystem." |
| Beim Rechner | „Rechnung mit Ihren Angaben — keine Zusage." |
| Bei der Stimmprobe | „Beispielanruf, nachgestellt — kein echter Patientenanruf." *(fest verdrahtet, nicht entfernbar)* |
| Bei den Statistiken | Quelle und Jahr sichtbar, klein, aber nicht versteckt |
| Bei der Deckelung | „Mehr als der nächsthöhere Tarif kostet es nie." |

**Formulare:** so wenige Felder wie möglich. Keine Pflichtfelder ohne Grund. Fehlermeldungen konkret und freundlich, nie rot-schreiend. Nach dem Absenden eine echte Bestätigungsseite mit dem nächsten Schritt — kein Toast, der verschwindet.

---

## 5 · DIE PREISSEITE — REIHENFOLGE IST ENTSCHEIDEND

Nicht mit dem Betrag beginnen. Mit der **Planbarkeit** beginnen, weil das die dokumentierte Kaufangst ist.

1. **Die Deckelung** — vor jeder Zahl: über dem Kontingent 0,39 €/Min., nie mehr als der nächsthöhere Tarif. Mit konkreten Obergrenzen je Tarif.
2. **Die drei Tarife** — Praxis visuell als naheliegende Wahl, ohne aufdringliches „Beliebt"-Etikett. Minuten **und** ungefähre Anrufzahl angeben; Praxen denken nicht in Minuten.
3. **Nicht pro Behandler** — als eigener, kurzer Punkt.
4. **Einrichtung Ihres Empfangs** — als Projekt mit den acht Schritten, nicht als Gebühr. 50 / 50, mit der Go-live-Garantie direkt darunter.
5. **Zusätzliche Sprachen** — 79 € je Sprache, ab 3 Sprachen 230 € für bis zu 5, Wechsel im Gespräch möglich.
6. **Laufzeit, Kündigung, Preisgarantie** — kompakter Faktenblock.
7. **Was nicht extra kostet** — ausdrücklich benennen. Dieser Käufer rechnet mit versteckten Posten; 46 % nennen genau das als Grund, ein System aufzugeben.
8. **FAQ zum Preis** — die unangenehmen Fragen zuerst.

Keine durchgestrichenen Preise, keine Rabattinszenierung, kein „ab"-Preis, der die tatsächlichen Kosten verschleiert.

---

## 6 · DER ROI-RECHNER — PREMIUM HEISST HIER RUHE

Die Umsetzung entscheidet über die Wirkung. Ein zappelnder Rechner wirkt billig, ein ruhiger wirkt teuer.

- Eingaben als saubere Regler oder Zahlenfelder, sofortige Aktualisierung, **keine hochlaufenden Zahlen**.
- Ergebnis als **Spanne**, klar getrennt: `Angenommene Anrufe ≈ 100 %` und `Eingesparte Bearbeitungszeit 20 %` (einstellbar 10–40 %).
- **Cogniiq-Kosten sichtbar gegengerechnet**, Einrichtung und Monatspreis.
- Rechenweg aufklappbar, vollständig nachvollziehbar.
- Rahmung: „Wir rechnen bewusst vorsichtig. Der Rechner unterstellt eine Zeitersparnis am unteren Rand dessen, was Praxen berichten, und zieht unsere eigenen Kosten ab."
- **Kein Gate.** Ergebnis wird sofort angezeigt, nicht gegen E-Mail-Adresse.
- Mobil vollwertig bedienbar.

---

## 7 · VERTRAUENSANKER IM SEITENGERÜST

Diese Elemente gehören dauerhaft ins Layout, nicht in einzelne Abschnitte:

- **Impressum, Datenschutz, AGB** im Footer, gut auffindbar. Vollständige Firmenangaben. Bei deutschen Käufern ein hartes Prüfkriterium.
- **Echter Firmensitz und echte Kontaktdaten**, keine reine Formularadresse.
- **Keine Vertrauenssiegel, keine Bewertungssterne, keine Kundenlogos** — es gibt keine, und Andeutung ist ausgeschlossen.
- **`Organization`-Schema** mit echten Unternehmensdaten.
- Konsistentes Rendering ohne Layoutsprünge — technische Sauberkeit ist bei einem Technikanbieter selbst ein Argument.

---

## 8 · QA-ERGÄNZUNG FÜR DIESEN DURCHGANG

Zusätzlich zu allen bisherigen Gates, pro Seite:

- [ ] Kein Stockfoto, kein generisches Symbolbild
- [ ] Keine Bewegung ohne Funktion; nichts pulsiert, nichts zählt hoch
- [ ] Fließtext ≥ 17 px, Kontraste mindestens WCAG AA
- [ ] Deutsche Typografie korrekt: Anführungszeichen, Gedankenstriche, geschütztes Leerzeichen vor Einheiten
- [ ] Abschnittsreihenfolge entspricht der Beweiskette aus §2, kein Schritt ausgelassen
- [ ] M15 steht vor dem Preis
- [ ] Go-live-Garantie als eigener Block sichtbar
- [ ] Deckelung vor dem ersten Preisbetrag genannt
- [ ] Genau ein primärer CTA, höchstens dreimal
- [ ] Kein Gate vor Rechner, Stimmprobe oder Inhalten
- [ ] Keine Verknappung, kein Countdown, kein Ausrufezeichen im Fließtext
- [ ] Jede Zahl überprüfbar, mit Quelle und Jahr wo nötig
- [ ] Mobil: Tabellen als Karten, Tap-Ziele ≥ 44 px, kein verdeckender Sticky-Balken
- [ ] Keine Layoutsprünge beim Laden
- [ ] Vorlesetest: klingt es nach jemandem, der um 8:05 an einer Anmeldung gestanden hat — oder nach einer Verkaufsseite?

---

## 9 · DER MASSSTAB

> Diese Zielgruppe kauft nicht, weil eine Seite überzeugend ist. Sie kauft, wenn **kein Zweifel mehr übrig** ist.
>
> Jeder Abschnitt hat genau eine Aufgabe: den nächsten Zweifel auszuräumen, bevor der Leser ihn formulieren muss.
>
> Wenn ein Element weder einen Zweifel ausräumt noch einen Beweis liefert, gehört es nicht auf die Seite — egal wie gut es aussieht.
