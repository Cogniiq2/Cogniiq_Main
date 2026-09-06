# Organic growth scoreboard

Angelegt: 2026-08-29 · Basis-Commit `0652c2e` · Messung startet mit dem Merge.

Zweck: den Erfolg der SEO-Arbeit an Sichtbarkeit und qualifizierten Anfragen
messen, nicht an Audit-Punktzahlen. Die Tabellen sind bewusst leer — sie werden
mit echten Zahlen aus der Google Search Console gefüllt, nicht mit Schätzungen.

## Regeln für dieses Dokument

1. **Keine Erfolgsmeldung vor Tag 28.** Neue Seiten schwanken in den ersten
   Wochen stark. Ein Abfall in Woche 2 ist kein Signal, und ein Ausschlag in
   Woche 1 ist keine Bestätigung.
2. **Gemessen wird je URL und je Query-Cluster**, nie nur die Domain-Summe.
   Eine Gesamtsumme verdeckt genau die Bewegung, auf die es hier ankommt.
3. **Marken-Queries werden getrennt geführt.** Im Ausgangszustand waren 11 von
   12 Klicks markengetrieben; würden sie mitgezählt, misst dieses Dokument die
   Bekanntheit statt der SEO-Arbeit.
4. **Keine Zahl ohne Datum und Quelle.** GSC-Zeitraum immer mitschreiben.
5. **Kein Wert wird nachträglich geglättet.** Auch ein Rückgang bleibt stehen.

## Ausgangslage (historische Referenz)

| Kennzahl | Wert | Zeitraum |
|---|---:|---|
| Impressionen | 9.458 | Referenzzeitraum vor dieser Arbeit |
| Klicks | 12 | dito |
| CTR | 0,13 % | dito |
| Ø Position | 54,7 | dito |
| davon Marken-Klicks | 11 von 12 | dito |
| Nicht-Marken-Impressionen ab Position 40 | ≈ 83 % | dito |

Diese Zeilen stammen aus der Aufgabenstellung und sind hier nur als Referenz
festgehalten. **Vor dem ersten Messpunkt sind sie in der Search Console gegen
einen exakt benannten Zeitraum zu prüfen und zu ersetzen** — sonst wird gegen
eine Zahl gemessen, deren Zeitraum niemand mehr kennt.

## Wöchentliche Domain-Sicht (nicht-markenbezogen)

| Woche (Ende) | Impressionen | Klicks | CTR | Ø Position | Keywords Top 50 | Top 20 | Top 10 | Anfragen | Verweisende Domains |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| _(erste Zeile nach dem Merge eintragen)_ | | | | | | | | | |

Marken-Queries separat, damit sie die Nicht-Marken-Entwicklung nicht überdecken:

| Woche (Ende) | Marken-Impressionen | Marken-Klicks |
|---|---:|---:|
| | | |

## Je Asset

### A1 · `/ki-telefonassistent-einfuehren`

- **Zielintention:** „KI Telefonassistent einführen", „KI Telefonassistent in der
  Praxis einführen", „Einführung KI Telefonassistent"
- **Intent-Typ:** informational, nach der Kaufentscheidung, hohe Anfragequalität
- **Veröffentlicht:** _(Merge-Datum eintragen)_
- **Erwartung:** Sichtbarkeit ab Woche 3–6. Diese Intention war laut Recherche
  vom 2026-08-29 nur von dünnen Anbieterbeiträgen besetzt; ein generischer
  Pillar-Beitrag eines Großanbieters rankte mit, was auf eine Inhaltslücke
  hindeutet. Keine Ranking-Zusage.

| Messpunkt | Datum | Impressionen | Klicks | CTR | Ø Position | Beste Query | Position |
|---|---|---:|---:|---:|---:|---|---:|
| Baseline (0) | | 0 | 0 | – | – | – | – |
| Tag 7 | | | | | | | |
| Tag 14 | | | | | | | |
| Tag 28 | | | | | | | |
| Tag 56 | | | | | | | |
| Tag 90 | | | | | | | |

Zusätzlich je Messpunkt notieren: indexiert (ja/nein, Datum der ersten
Indexierung), Anfragen über diese Seite, verweisende Domains auf diese URL.

### A3 · `/ki-telefonassistent-zahnarztpraxis`

- **Veröffentlicht:** 2026-09-05 (Merge-Datum eintragen, falls abweichend)
- **Zielintention:** „KI Telefonassistent Zahnarztpraxis", „Telefonassistent
  Zahnarztpraxis", „Zahnarztpraxis Telefon entlasten"; sekundär
  „Terminabsage Zahnarztpraxis Telefon", „was kann ein KI Telefonassistent
  nicht"
- **Intent-Typ:** commercial-investigation mit operativem Kern; Persona
  Praxisinhaber/-in oder Leitung der Anmeldung, mittlere bis späte Phase
- **Seitentyp:** operativer Fachbeitrag (Anrufanlass-Katalog mit Regel je Anlass,
  Behandlungszeit-Muster, Absage-Regeln, zahnärztliche Prüffälle, Grenzen),
  kein Branchen-Landingpage-Klon
- **Hypothese:** Die Ergebnisse zu den Zahnarzt-Intentionen bestehen laut
  Recherche vom 2026-09-05 (`serp-landschaft-2026-08.md`, Nachtrag) aus
  Hersteller-Landingpages, Hersteller-Blogs und einem generisch-medizinischen
  Vergleichsportal; keine Seite beantwortet, welche zahnärztlichen Anrufe
  automatisierbar sind und welche beim Team bleiben. Ein Beitrag, der genau das
  tut, kann ohne zusätzliche Domain-Autorität in die Top 50 gelangen. **Keine
  Ranking-Zusage.**
- **Mechanismus:** Intent-Passung (operativ statt Verkauf) + eigenständiger
  Informationsgewinn + zwei kontextuelle Inbound-Links aus Seiteninhalten
  (`/praxen`-Karte, „Weiterlesen" in `/ki-telefonassistent-einfuehren`) +
  Shell-Link in der Footer-Spalte „Leitfäden für Praxen" auf allen Seiten +
  Breadcrumb auf `/praxen` als kommerziellen Eigentümer
- **Konversionspfad:** Suche → Beitrag → `/kontakt` (Abschluss-CTA) oder
  Beitrag → `/praxen` → `/kontakt`; Nebenpfad → `/ki-telefonassistent-einfuehren`
- **Erfolg:** Tag 56 nicht-markenbezogene Impressionen für mindestens eine
  Zahnarzt-Query; Tag 90 eine Query aus dem Cluster in den Top 50
- **Scheitern:** Tag 28 nicht indexiert → Technik prüfen. Tag 90 keine
  Impressionen für Zahnarzt-Queries → Intention oder Seitentyp falsch
  eingeschätzt; dann nicht nachschreiben, sondern off-site (Autoritätsplan 4)

| Messpunkt | Datum | Impressionen | Klicks | CTR | Ø Position | Beste Query | Position |
|---|---|---:|---:|---:|---:|---|---:|
| Baseline (0) | 2026-09-05 | 0 | 0 | – | – | – | – |
| Tag 7 | | | | | | | |
| Tag 14 | | | | | | | |
| Tag 28 | | | | | | | |
| Tag 56 | | | | | | | |
| Tag 90 | | | | | | | |

### A4 · `/blog/ki-telefonassistent-arztpraxis` (Neuausrichtung)

- **Geändert am:** 2026-09-05
- **Was:** Titel und H1 ohne Jahreszahl, auf den tatsächlichen Inhalt gezogen
  (was er übernimmt, was beim Team bleibt); „Kosten" bewusst nicht im Titel, weil
  der Beitrag die Preisseite nicht verlinken darf (eingefroren); nicht belegte Aussagen entfernt (SMS/E-Mail-Erinnerung,
  „DSGVO-Protokoll automatisch", „vollständig übernehmen"); Anliegenliste und
  Notfall-Antwort auf den Wortlaut von `ANLIEGEN_UEBERNIMMT` und `GRENZEN`
  gezogen; neuer crawlersichtbarer Block „Weiterführend" mit Links auf
  `/praxen` und `/ki-telefonassistent-einfuehren`.
- **Hypothese (H3/H5/H6):** Der Beitrag konkurrierte mit `/praxen` und der
  eingefrorenen Arzt-Segmentseite um dieselbe Intention und endete als
  Sackgasse. Als Unterstützer mit Weiterleitung an den Eigentümer verliert er
  nichts an eigener Sichtbarkeit und gibt kontextuelle Autorität weiter.
- **Erfolg:** Tag 90 Impressionen des Beitrags nicht gesunken **und** `/praxen`
  nicht gesunken. **Scheitern:** Beitrag verliert mehr als die Hälfte seiner
  Impressionen ohne Zugewinn bei `/praxen` → Titel-Änderung zurücknehmen.

| Messpunkt | Datum | Impressionen | Klicks | Ø Position |
|---|---|---:|---:|---:|
| Baseline (0) | 2026-09-05 | | | |
| Tag 28 | | | | |
| Tag 90 | | | | |

### A1 · Änderung an der Linkstruktur (2026-09-05)

`/ki-telefonassistent-einfuehren` hatte bis zum 2026-09-05 genau einen
kontextuellen Inbound-Link (von `/ki-telefonassistent`). Seit dem 2026-09-05
kommen hinzu: `/praxen` (Absatz unter dem Anliegen-Katalog), der Blogbeitrag
Arztpraxis („Weiterführend"), `/ki-telefonassistent-zahnarztpraxis` (zwei
Stellen) und die Footer-Spalte „Leitfäden für Praxen" auf allen Seiten. Das ist
eine Änderung der Messbedingungen von A1 und wird deshalb hier datiert; ein
Sprung ab Tag 7 nach dem Merge ist der Linkstruktur zuzurechnen, nicht dem
Inhalt.

### Bekannte Störgröße für die eingefrorenen Experimente (2026-09-05)

Die Footer-Spalte „Leitfäden für Praxen" fügt der geteilten Shell zwei neue
sitewide Links hinzu (71 → 73 Shell-Anker je Seite). Der Experiment-Guard sieht
das nicht und soll es auch nicht: Sein Body-Fingerabdruck endet an `<main>`, und
seine Inbound-Prüfung zählt Vorkommen der geschützten Pfade — beide sind
unverändert, der Guard ist zu Recht grün.

Kausal bleibt trotzdem eine Änderung: `/ki-telefonassistent-arzt` und
`/kosten-ki-telefonassistent` stehen selbst in der Shell, ihr Anteil an der
internen Verlinkung sinkt also um rund 3 % auf allen 93 Seiten. Zusätzlich steht
die Arzt-Karte auf `/praxen` jetzt in einem Raster mit drei statt zwei Karten
neben einer neuen Zahnarzt-Karte; Anker und Ziel sind unverändert, die
Klickverteilung ist es nicht.

Beides ist klein gegenüber dem Rauschen einer Positionsmessung und war die
bewusste Alternative dazu, die Beiträge des Clusters unverlinkt zu lassen. Es
steht hier, damit eine Bewegung in den beiden Messreihen ab dem Merge-Datum
nicht dem Experiment zugeschrieben wird. Wer die Störgröße ausschließen will,
nimmt die Footer-Spalte heraus: Beide Beiträge haben kontextuelle Inbound-Links
aus Seiteninhalten und sind auch ohne sie nicht verwaist.

### A2 · `/ki-telefonassistent` (bestehende Hub-Seite)

Verändert wurde nur ein kontextueller interner Verweis. Die Seite wird
mitgeführt, um eine **Verschlechterung** auszuschließen — nicht, um eine
Verbesserung zu behaupten.

| Messpunkt | Datum | Impressionen | Klicks | Ø Position |
|---|---|---:|---:|---:|
| Baseline (0) | | | | |
| Tag 28 | | | | |
| Tag 90 | | | | |

## Query-Cluster

Ein Cluster gilt als „gewonnen", wenn eine Cogniiq-URL dafür stabil in den
Top 10 steht — nicht bei einem einzelnen guten Tag.

| Cluster | Kanonischer Eigentümer | Status 2026-08-29 | Ziel 90 Tage |
|---|---|---|---|
| KI Telefonassistent einführen | `/ki-telefonassistent-einfuehren` | neu | Top 20 |
| KI Telefonassistent (Kopf) | `/ki-telefonassistent` | Position ≫ 50 | keine Erwartung |
| KI Telefonassistent Praxis/Arztpraxis | `/praxen` (Unterstützer: `/blog/ki-telefonassistent-arztpraxis` seit 2026-09-05) | schwach | Top 50 |
| KI Telefonassistent Zahnarztpraxis | `/ki-telefonassistent-zahnarztpraxis` (kommerziell: `/praxen`) | neu 2026-09-05 | Top 50 |
| Was ein KI Telefonassistent nicht kann / Grenzen | `/ki-telefonassistent` (Abschnitt Grenzen); zahnärztlich `/ki-telefonassistent-zahnarztpraxis` | unbekannt | Beobachten, keine eigene Seite |
| KI Telefonassistent Kosten | eingefrorenes Experiment | in Messung | nicht anfassen |
| KI Telefonassistent DSGVO / § 203 StGB | **unbesetzt** | keine Seite | erst nach Quellenprüfung |
| KI Telefonassistent PVS / Schnittstelle | **unbesetzt** | keine Seite | blockiert (OWNER-INPUT B) |
| KI Telefonassistent Vergleich | bewusst nicht verfolgt | – | – |

## Eingefrorene Experimente

Diese sechs Routen werden **nur beobachtet**, nicht optimiert. Änderungen an
ihnen scheitern am Test in `src/protectedExperiments.test.tsx`.

| Route | Impressionen | Klicks | Ø Position | Notiz |
|---|---:|---:|---:|---|
| `/bayreuth/webdesign` | | | | |
| `/bayreuth/website-relaunch` | | | | Titel-Experiment „Performance" seit 2026-08-29 |
| `/regensburg/website-relaunch` | | | | |
| `/muenchen/webdesign-kosten` | | | | |
| `/ki-telefonassistent-arzt` | | | | |
| `/kosten-ki-telefonassistent` | | | | |

Sobald ein Experiment ausgewertet ist: Ergebnis hier festhalten, Route aus
`PROTECTED_EXPERIMENT_PATHS` entfernen und die Folgearbeit aus
`docs/seo/post-experiment-opportunities.md` einplanen.

## Autorität

| Woche | Verweisende Domains | Neue Links (live und crawlbar) | Quelle | Tier |
|---|---:|---|---|---|
| | | | | |

Gezählt wird erst, wenn der Link live und crawlbar ist — nicht bei Zusage.
Zielkategorien in `docs/seo/authority-acquisition-plan.md`.

## Wann diese Arbeit als gescheitert gilt

Damit das Ergebnis nicht im Nachhinein schöngeredet werden kann, hier vorab:

- **Tag 28:** A1 ist nicht indexiert → technisches Problem, sofort prüfen.
- **Tag 56:** A1 hat keine nicht-markenbezogenen Impressionen → die Intention
  wurde falsch eingeschätzt oder der Inhalt reicht nicht.
- **Tag 90:** keine Query aus dem Cluster in den Top 50 und keine verweisende
  Domain hinzugekommen → die Annahme „Autorität ist der Engpass" bestätigt sich,
  und die Arbeit gehört off-site, nicht in weitere Seiten.
