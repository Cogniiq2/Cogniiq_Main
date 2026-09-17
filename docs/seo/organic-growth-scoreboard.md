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

### A5 · `/ki-telefonassistent` — Neufassung als generische kommerzielle Seite (2026-09-11)

Dies ist ein eigener Messfall und **löst A2 ab**: A2 maß eine Seite, an der nur
ein Link geändert worden war. Ab dem 11.09.2026 sind Head, Seitenkörper und
Konversionsführung geändert; ein Vergleich über dieses Datum hinweg ist nur mit
dieser Notiz zulässig.

- **Zielintention (primär):** `ki telefonassistent`, `ki-telefonassistent`,
  `telefonassistent`, `ki telefonassistent für unternehmen`, `ki telefon`,
  `telefon ki`, `telefonassistent ki`
- **Sekundär (Varianten, je < 10 Impressionen):** `ki anrufassistent`,
  `ki telefonservice`, `ki telefonzentrale`, `ai telefonassistent`,
  `digitaler telefonassistent`
- **Intent-Typ:** kommerziell mit informationellem Vorlauf. Die SERP-Recherche
  vom 2026-09-11 zeigt eine gemischte Seite: Produktseiten finanzierter
  Anbieter (fonio.ai, Parloa, Cognigy, Synthflow, VITAS, famulor, sipgate,
  Placetel, IONOS) **und** Anbieterlisten („Die 7 besten Anbieter", „Top 11",
  „Vergleich 2026"). Alle Produktseiten behaupten dasselbe — Terminbuchung,
  CRM-Integration, DSGVO-Konformität, 24/7 — ohne Prüfbarkeit. Recherchedatum
  und Domains sind hier festgehalten; die Snippets sind **kein** Faktenbeleg.

**Baseline (GSC, 2026-08-12 – 2026-09-08, Seite `/ki-telefonassistent`):**
155 Impressionen · 0 Klicks · CTR 0 % · Ø Position 37,2.
Bester Einzelwert: `ki telefonservice` Position 29,0 (2 Impressionen);
volumenstärkste Query: `ki telefonassistent` 42 Impressionen, Position 34,3.

**Hypothese (H1 Intent-Passung).** Die Seite war indexiert und thematisch
verstanden, aber für die eigene Intention nicht die beste Antwort: Sie benutzte
die Praxis-Copy des Clusters mit und hatte als dominante Entität „Arztpraxis" —
also die Intention, die die Arzt-Segmentseite und `/praxen` besitzen. Drei
Seiten stritten um eine Intention; die generische bediente ihre eigene nicht.
Die Neufassung nimmt die generische Seite aus diesem Streit heraus.

**Hypothese (H2 Informationsgewinn).** Gegen Produktseiten, die alle dasselbe
behaupten, und gegen Listen, die diese Behauptungen nur nebeneinanderstellen,
fehlt die Ebene dazwischen: woran ein Käufer erkennt, ob eine Behauptung trägt.
Der neue Abschnitt „Sechs Fragen, an denen sich ein KI-Telefonassistent
entscheidet" liefert genau das, mit der eigenen Antwort daneben. Dazu eine
Definition mit vier Abgrenzungen (Mailbox, Tastenmenü, externer Telefondienst,
Chatbot), die der Seite bisher vollständig fehlte.

**Hypothese (H3 SERP-Darstellung).** Der an der Edge ausgelieferte Head war vom
Manifest abgedriftet und sagte „bucht Termine direkt ins System … Einsatzbereit
in 7 Tagen" — falsch und zugleich ohne Bezug zur gesuchten Intention. Beides ist
korrigiert. **Ein CTR-Effekt ist bei Position 37 nicht erwartbar**; die Änderung
war zuerst eine Wahrheitskorrektur.

**Erfolg (kumulativ, nicht einzeln):**
- Tag 28: Ø Position der primären Query-Gruppe besser als 30 **und**
  Impressionen nicht unter 120 gefallen.
- Tag 56: mindestens eine primäre Query in den Top 20; erste Klicks > 0.
- Tag 90: `ki telefonassistent` oder `ki telefonassistent für unternehmen`
  stabil in den Top 20; mindestens eine organische Anfrage über diese Seite.

**Scheitern:**
- Tag 28 Impressionen unter 100 **und** Position schlechter als 40 → die
  Entpraxifizierung hat Relevanzsignale gekostet; dann zuerst prüfen, ob die
  verlorenen Impressionen Arzt-Queries waren (dann ist der Verlust gewollt und
  müsste bei `/praxen` bzw. der Arzt-Seite ankommen), bevor irgendetwas
  zurückgenommen wird.
- Tag 90 weiterhin 0 Klicks bei Position < 20 → dann ist das SERP-Snippet das
  Problem, nicht die Seite.

**Nicht ableiten.** Eine Bewegung vor Tag 28 ist kein Signal (Regel 1). Diese
Seite wird nicht nach wenigen Tagen erneut angefasst.

| Messpunkt | Datum | Impressionen | Klicks | CTR | Ø Position | Beste Query | Position |
|---|---|---:|---:|---:|---:|---|---:|
| Baseline (0) | 2026-09-08 | 155 | 0 | 0 % | 37,2 | ki telefonservice | 29,0 |
| Tag 7 | | | | | | | |
| Tag 14 | | | | | | | |
| Tag 28 | | | | | | | |
| Tag 56 | | | | | | | |
| Tag 90 | | | | | | | |

**Störgröße 1 — Nachbarseiten.** `/praxen`, die Arzt-Segmentseite und
`/ki-telefonassistent-praxis` können Impressionen aufnehmen, die diese Seite
abgibt. Sie gehören mitgemessen, sonst liest sich eine gewollte Verschiebung
wie ein Verlust.

**Störgröße 2 — Konversionsmessung.** Seit dem 11.09.2026 meldet die Seite
Konversionsereignisse an GA4 (nur mit Analytics-Einwilligung). Vorher gab es
keine; eine „Steigerung" der Konversionen gegenüber der Zeit davor ist deshalb
bedeutungslos. Die erste verwertbare Reihe beginnt mit dem Merge.

### A5 · Nachtrag 11.09.2026 (2): Produktpositionierung korrigiert, Rechner ergänzt

Die Messreihe A5 startet mit **dieser** Fassung, nicht mit der wenige Stunden
älteren. Grund: Der Inhaber hat im Preview-Review festgestellt, dass die erste
Fassung das Produkt unter Wert verkaufte (Assistent als Erfassungssystem statt
als abwickelndes System). Head, H1 und der gesamte Seitenkörper sind daraufhin
erneut geändert worden. Ein Vergleich gegen die Zwischenfassung wäre
bedeutungslos — sie war nie live.

**Zusätzliche Hypothese (H4 Produktkategorie).** Die Seite konkurrierte in der
SERP mit Anbietern, die Terminbuchung und Automatisierung versprechen, und
beschrieb sich selbst als Anrufannahme. Wer den Kopfbegriff sucht, sucht nach
Automatisierung; ein Snippet über Anrufannahme beantwortet eine kleinere Frage
als die gestellte. Titel und Description sagen jetzt „erledigen" statt
„annehmen".

**Zusätzliche Hypothese (H5 Preistransparenz als Konversionshebel).** Der
Markt beantwortet die Preisfrage fast nie ohne Verkaufsgespräch. Ein Rechner
ohne E-Mail-Gate beantwortet sie sofort und macht die Transparenz selbst zum
Argument. Erwartet wird **kein** Ranking-Effekt, sondern ein Effekt auf
Verweildauer und Demo-Anfragen.

**Kannibalisierung ausgeschlossen — und woran das zu prüfen ist.** Titel,
Description und H1 dieser Seite enthalten keinen Preisbegriff; der Rechner
trägt genau eine H2 und keine Tariftabelle. Die Preisintention bleibt bei der
eingefrorenen Kostenseite. **Prüfpunkt Tag 28:** Falls `/ki-telefonassistent`
für Queries wie „ki telefonassistent kosten" oder „ki telefonassistent preise"
Impressionen aufnimmt, während die Kostenseite dort verliert, ist das der
Kannibalisierungsfall — dann die H2 des Rechnerabschnitts entschärfen, nicht
den Rechner entfernen.

**Neue Konversionsereignisse:** `price_calculator_completed`,
`roi_calculator_completed` (beide nur mit Analytics-Einwilligung, ohne jede
Eingabezahl). Auch hier gilt: Vorher gab es keine Messung, ein Vorher-Nachher
dieser Ereignisse ist also bedeutungslos; die Reihe beginnt mit dem Merge.

### Befund: Middleware und Routen-Manifest driften auf 29 Routen auseinander (2026-09-11)

`functions/_middleware.ts` überschreibt an der Edge `<title>`, `description`,
`canonical`, `keywords` und die OG-/Twitter-Felder des vorgerenderten
Dokuments. Der Manifest-Wert ist damit **nicht** das, was ein Crawler liest —
der Middleware-Wert ist es.

Ein Abgleich am 2026-09-11 ergab: von 86 Routen, die in beiden Dateien stehen,
tragen **29** unterschiedliche Titel oder Descriptions. Betroffen sind unter
anderem `/`, `/leistungen`, `/webdesign`, `/verpasste-anrufe-verlust`,
`/referenzen` — **und zwei eingefrorene Experimente**. Für diese beiden heißt
das: Der Fingerprint friert den Manifest-Head ein, ausgeliefert wird ein
anderer. Der Guard ist deshalb nicht falsch, aber er misst nicht, was in der
SERP steht.

`.github/scripts/test-seo-consistency.mjs` prüft nur, ob jeder
Middleware-Pfad im Manifest vorkommt — nicht, ob die Strings übereinstimmen.

**Folgearbeit (nicht in diesem Durchgang erledigt, bewusst):**
1. Eine Paritätsprüfung Middleware ↔ Manifest in die SEO-Konsistenzprüfung
   aufnehmen, damit diese Klasse nicht erneut entsteht.
2. Die 29 Abweichungen einzeln entscheiden — *welcher* der beiden Werte der
   richtige ist, ist je Route eine inhaltliche Frage, keine mechanische.
3. Die beiden eingefrorenen Routen dabei **zuletzt** und nur mit derselben
   Abwägung wie bei der Kontamination vom 11.09.2026: Eine Korrektur ändert das
   SERP-Snippet eines laufenden Experiments.

In diesem Durchgang wurde genau eine Route angeglichen: `/ki-telefonassistent`,
weil ihr ausgelieferter Head eine Zusage trug, die `BOOKING_WRITE` ausschließt,
und eine Frist, die am 23.08.2026 korrigiert worden war.

## Query-Cluster

Ein Cluster gilt als „gewonnen", wenn eine Cogniiq-URL dafür stabil in den
Top 10 steht — nicht bei einem einzelnen guten Tag.

| Cluster | Kanonischer Eigentümer | Status 2026-08-29 | Ziel 90 Tage |
|---|---|---|---|
| KI Telefonassistent einführen | `/ki-telefonassistent-einfuehren` | neu | Top 20 |
| KI Telefonassistent (Kopf) | `/ki-telefonassistent` | Ø 37,2 · 155 Impr. · 0 Klicks (28 T bis 2026-09-08) | Top 20 bis Tag 90 — Messfall A5 |
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
| `/ki-telefonassistent-arzt` | | | | **KONTAMINIERT 11.09.2026** — Head durch Claim-Integritätskorrektur geändert, siehe Abschnitt unten. Messreihe ab hier unterbrochen |
| `/kosten-ki-telefonassistent` | | | | |

Sobald ein Experiment ausgewertet ist: Ergebnis hier festhalten, Route aus
`PROTECTED_EXPERIMENT_PATHS` entfernen und die Folgearbeit aus
`docs/seo/post-experiment-opportunities.md` einplanen.

### Kontamination `/ki-telefonassistent-arzt` (2026-09-11)

**Das Experiment ist ab dem 11.09.2026 kontaminiert.** Es wird nicht so getan,
als sei die Route unberührt geblieben: Titel und Description im Head haben sich
geändert, also hat sich das geändert, was ein Suchender in der SERP liest. Jede
Bewegung von Impressionen, CTR oder Position ab diesem Datum ist nicht mehr vom
laufenden Experiment zu trennen.

**Grund:** Aussagenrichtigkeit schlägt Messung. Der Head trug eine Zusage, die
nach der Inhaber-Bestätigung vom 10.09.2026 (`BOOKING_WRITE` = **ONLY AFTER
VERIFIED CUSTOMER INTEGRATION**, `OWNER-INPUT.md`) unhaltbar ist. Sie stand im
SERP-Snippet einer Seite mit 543 Impressionen je 28 Tage — vor Augen, die nie
klicken müssen, um sie zu lesen. Ein falsches öffentliches Versprechen für die
Sauberkeit einer Messreihe stehen zu lassen, ist die falsche Abwägung; sie war
als offene Inhaber-Entscheidung protokolliert und ist damit entschieden.

**Vorher → nachher** (Route-Manifest `src/lib/routing/publicRoutes.ts`, dazu
spiegelbildlich `functions/_middleware.ts`):

| Feld | Alt | Neu |
|---|---|---|
| `title` | `KI-Telefonassistent für Arztpraxen \| Termine automatisch buchen – Cogniiq` | `KI-Telefonassistent für Arztpraxen \| Terminwünsche aufnehmen – Cogniiq` |
| `description` | `Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an, bucht Termine ins System, beantwortet häufige Fragen – auch außerhalb der Sprechzeiten, ohne Praxismitarbeiterin am Telefon.` | `Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an und erfasst Terminwünsche nach Ihren Regeln – auch außerhalb der Sprechzeiten. Eintrag ins Praxissystem nach geprüfter Anbindung.` |

**Umfang der Änderung — bewusst nichts darüber hinaus.** Kein H1, kein
Seitenkörper, keine internen Links, kein Ankertext, kein Keyword-Targeting,
keine Sitemap-Priorität, keine `lastmod`. Der Beweis dafür steht in
`src/test/fixtures/protected-experiments.baseline.json`: Im neu aufgenommenen
Fingerprint bewegen sich exakt `title`, `description` und **ein**
JSON-LD-Digest (der Block, der die Description einbettet). `textLength`,
`textDigest`, `h1`, `headings`, `outgoingLinks` und sämtliche
`inboundOccurrences` sind unverändert — der Seitenkörper ist byte-identisch
geblieben. Der Guard wurde nicht abgeschwächt: `PROTECTED_EXPERIMENT_PATHS`
enthält die Route weiterhin, und der Baseline-Eintrag wurde über den dafür
vorgesehenen Weg (`npm run seo:baseline`) neu aufgenommen, nicht von Hand
gelockert.

**Konsequenz für die Auswertung.** Die Route bleibt eingefroren. Ein Vergleich
über den 11.09.2026 hinweg ist unzulässig; wer diese Route auswertet, braucht
eine neue Baseline ab diesem Datum. Der Titelwechsel („Termine automatisch
buchen" → „Terminwünsche aufnehmen") ist der stärkere der beiden Eingriffe und
kann für sich genommen die CTR bewegen. Bei einem CTR-Rückgang gilt dieselbe
Regel wie am 10.09.2026: **Formulierung nachschärfen, nicht die Aussage
zurücknehmen.**

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

---

## B · Claim-Bereinigung Telefonassistent-Mechanik (2026-09-10)

Keine Ranking-Wette, sondern die Beseitigung eines Widerspruchs **innerhalb der
eigenen Domain**: Der Healthcare-Cluster wurde im August auf
`FAKTEN.keineAnbindung` gezogen — „eine Standardanbindung, die auf jedes
Praxisverwaltungssystem sofort passt, gibt es nicht" —, die Startseite und
`/webdesign-arzt-bayreuth` liefen jedoch weiter mit der Fassung davor: „Integration
Kalender & CRM", „Automatische Terminbuchung", „Sofortbestätigung per SMS oder
Mail", „bucht Termine direkt in Ihren Kalender ein" und, am deutlichsten, die
FAQ-Antwort „In den meisten Fällen ja. Der KI-Telefonassistent von Cogniiq kann an
gängige Praxisverwaltungssysteme und Kalendertools angebunden werden."

Das ist dieselbe Vereinfachung, die `pvs-integration-recherche.md` dem
Wettbewerb vorhält — auf der meistbesuchten eigenen Seite und auf einer
Gesundheitsseite.

- **Geändert am:** 2026-09-10
- **Ziel-Query-Familie:** keine. Titel, Description, Canonical und Robots aller
  betroffenen Routen sind unverändert.
- **Ausnahme, die ausdrücklich hierher gehört:** Auf den drei Arzt-Webdesign-Seiten
  hat sich **JSON-LD sehr wohl geändert**. `IndustryPage.tsx:146` reicht `config.faq`
  an `PageSEO` weiter, das daraus `FAQPage`-Markup erzeugt (`PageSEO.tsx:189`), und
  `config.seo.description` steht in der `Service`-Beschreibung (`IndustryPage.tsx:130`).
  Geänderte FAQ-Antworten sind damit Rich-Result-relevant. Eine frühere Fassung
  dieses Abschnitts behauptete das Gegenteil; das war falsch.
- Sonst geändert wurde ausschließlich Fließtext in `<main>`.
- **Hypothese:** Wirkung primär auf Vertrauen und Konversion, nicht auf
  Positionen. Eine indirekte Wirkung über Nutzersignale ist möglich, aber nicht
  von der übrigen Arbeit trennbar und wird hier **nicht** behauptet.
- **Erfolg:** Tag 90 keine Verschlechterung von `/` und
  `/webdesign-arzt-bayreuth` gegenüber Baseline.
- **Scheitern:** Tag 28 Impressionen einer der Routen mehr als ein Drittel unter
  Baseline → nicht mit „Textkürzung" erklären: Gemessen am Diff hat
  `/webdesign-arzt-bayreuth` rund 600 Zeichen **gewonnen**, die Startseite netto
  rund 170. Zu prüfen wäre dann die Wortwahl selbst, nicht die Textmenge —
  insbesondere der Wegfall von „Terminbuchung" als Begriff auf den drei
  Arzt-Webdesign-Seiten.

| Route | Messpunkt | Datum | Impressionen | Klicks | CTR | Ø Position |
|---|---|---|---:|---:|---:|---:|
| `/` | Baseline (0) | 2026-09-10 | | | | |
| `/` | Tag 28 | | | | | |
| `/` | Tag 90 | | | | | |
| `/webdesign-arzt-bayreuth` | Baseline (0) | 2026-09-10 | | | | |
| `/webdesign-arzt-bayreuth` | Tag 28 | | | | | |
| `/webdesign-arzt-bayreuth` | Tag 90 | | | | |
| `/webdesign-arzt-muenchen` | Baseline (0) | 2026-09-10 | | | | |
| `/webdesign-arzt-muenchen` | Tag 90 | | | | | |
| `/webdesign-arzt-regensburg` | Baseline (0) | 2026-09-10 | | | | |
| `/webdesign-arzt-regensburg` | Tag 90 | | | | | |
| `/ki-telefonassistent-restaurant` | Baseline (0) | 2026-09-10 | | | | |
| `/ki-telefonassistent-restaurant` | Tag 90 | | | | | | |

> Die Baseline-Zeilen sind leer, weil in dieser Session **kein** GSC-Export
> vorlag. Sie sind vor dem ersten Messpunkt aus der Search Console für den
> Zeitraum 2026-08-14 bis 2026-09-10 nachzutragen. Keine geschätzte Zahl
> eintragen.

### Bewusst NICHT in diesem Branch

Ein Suchlauf über `src/**` zeigte dieselbe Buchungs-/SMS-Zusage auf rund einem
Dutzend weiterer Routen, darunter zwei `<meta name="description">`. Sie sind
vollständig in `COPY-CLAIMS-TO-VERIFY.md` (§Z25-Bestandsaufnahme) erfasst und
gehören in einen eigenen Branch: Eine Änderung des SERP-Snippets mehrerer Routen
im selben Commit wie diese Copy-Bereinigung macht jede spätere Bewegung
unzuordenbar.

Eine Fundstelle ist dabei **DEFERRED — MEASUREMENT**: Die Manifest-Description
von `/ki-telefonassistent-arzt` (`publicRoutes.ts:606`) sagt „bucht Termine ins
System". Die Aussage ist unbelegt, die Route ist aber ein laufendes Experiment.
Sie wird mit dem Experimentende korrigiert — das ist der Preis der Messung und
gehört ausdrücklich protokolliert, statt stillschweigend hingenommen zu werden.

> **Überholt am 11.09.2026.** Die Korrektur wurde nicht bis zum Experimentende
> aufgeschoben: Aussagenrichtigkeit hat Vorrang vor der Sauberkeit der Messreihe.
> Das Experiment gilt ab dem 11.09.2026 als kontaminiert — Abschnitt
> „Kontamination `/ki-telefonassistent-arzt` (2026-09-11)" oben.

### Mitgeändert, ohne eigene Messreihe

`/bayreuth/ki-telefonassistent` und `/regensburg/ki-telefonassistent`
(„wird jeder angenommen" → an `FAKTEN.gleichzeitigeAnrufe` gebunden: bis zu 10),
`/bayreuth/automatisierung` („nahezu jede Software", „marktführenden"),
`/kosten-automatisierung` und `/zu-viel-manuelle-arbeit` (verbotene Absolutheit
„vollständig automatisiert", COPY-BRIEF §5.9). Jeweils einzelne Sätze; die
Punkte stammen aus der Sammelliste in `post-experiment-opportunities.md`.

`/bayreuth/webdesign` steht auf derselben Liste und wurde **nicht** angefasst —
die Route ist eingefroren.

---

## 2026-09-10 · Claim-Korrektur Terminbuchung/Bestätigungen (Branch `claude/seo-gsc-growth-2026-09-10`)

**Art der Änderung:** Wahrheitskorrektur, **keine** Ranking-Maßnahme. Es wurde
keine Seite auf ein Keyword hin optimiert. Erwartete Wirkung auf Positionen:
keine. Zwei SERP-Snippets ändern sich trotzdem und werden deshalb beobachtet.

**Auslöser:** Inhaber-Antworten vom 10.09.2026 (`BOOKING_WRITE`,
`SMS_EMAIL_CONFIRMATION`) — siehe `OWNER-INPUT.md` „Nachtrag 10.09.2026".
Vollständige Fundstellenliste in `COPY-CLAIMS-TO-VERIFY.md` § „Z25 · Abarbeitung".

### Beobachtete Flächen

| URL | Was sich ändert | Hypothese | Erfolgskriterium | Abbruchkriterium |
|---|---|---|---|---|
| `/bayern/ki-telefonassistent` | Manifest-Description: „bucht Termine" → „erfasst Terminwünsche nach Ihren Regeln"; zugleich von 203 auf 154 Zeichen gekürzt, damit die Erreichbarkeitszusage wieder ins Snippet passt | Snippet bleibt gleichwertig oder wird besser, weil der Haken nicht mehr abgeschnitten wird | CTR nach 28 Tagen mindestens im bisherigen Schwankungsbereich | CTR-Rückgang über die übliche Schwankung hinaus → Formulierung nachschärfen, **nicht** die Aussage zurücknehmen |
| `/ki-telefonassistent-restaurant` | Manifest-Description: „bestätigen und erinnern" entfällt, 156 Zeichen | wie oben | wie oben | wie oben |
| `/bayreuth/ki-telefonassistent` | Manifest-Description: „Terminbuchung" → „Terminaufnahme" | wie oben | wie oben | wie oben |
| `/regensburg/ki-telefonassistent` | Manifest-Description: „Terminbuchung" → „Terminaufnahme" | wie oben | wie oben | wie oben |
| `/leistungen`, `/ueber-uns`, `/ki-telefonassistent`, `/ki-telefonassistent-hotel`, `/ki-telefonassistent/demo`, `/bayern`, `/deutschland`, `/ki-agentur-deutschland`, `/verpasste-anrufe-verlust`, Startseite | nur Seitenkörper bzw. JSON-LD, kein `<head>` | keine Snippet-Wirkung; nur Konversionsrelevanz | keine Verschlechterung | – |

| Messpunkt | Datum | Impressionen | Klicks | CTR | Ø Position |
|---|---|---:|---:|---:|---:|
| Baseline (0) | **offen — siehe unten** | | | | |
| Tag 7 | | | | | |
| Tag 14 | | | | | |
| Tag 28 | | | | | |
| Tag 56 | | | | | |

## GSC-Baseline 10.09.2026 — echte Werte

Quelle: zwei Search-Console-Exporte (Suchtyp Web), am 2026-09-10 an die Sitzung
angehängt und im Container ausgepackt. Zeiträume **aus `Filters.csv` und
`Chart.csv` der Dateien selbst** gelesen, nicht aus der Aufgabenstellung:

| Export | Filter-Angabe | Tatsächliche Tage laut `Chart.csv` |
|---|---|---|
| A | Last 3 months | 2026-06-09 – 2026-09-08 (92 Tage) |
| B | Last 28 days | 2026-08-12 – 2026-09-08 (28 Tage) |

Beide enden am 2026-09-08. Die letzten beiden Tage vor dem Export fehlen, wie
bei GSC üblich.

| Kennzahl | 3 Monate | 28 Tage |
|---|---:|---:|
| Impressionen (`Chart.csv`) | 28.783 | 12.675 |
| Klicks (`Chart.csv`) | 30 | 14 |
| CTR | 0,10 % | 0,11 % |
| Marken-Impressionen (`Queries.csv`) | 58 | 18 |
| Marken-Klicks (`Queries.csv`) | 9 von 12 | 5 von 7 |
| Nicht-Marken-Impressionen (`Queries.csv`) | 27.089 | 12.036 |
| Nicht-Marken-Klicks (`Queries.csv`) | 3 | 2 |

**Drei Zahlenfallen, die beim Weiterschreiben nicht verrutschen dürfen:**

1. `Chart.csv`, `Queries.csv` und `Pages.csv` summieren sich **nicht** auf
   denselben Wert (28.783 / 27.147 / 32.093 Impressionen im 3-Monats-Fenster).
   Das ist kein Fehler im Export, sondern GSC-Aggregation auf drei verschiedenen
   Achsen. Nie Zahlen aus zwei dieser Dateien in einer Zeile mischen.
2. `Queries.csv` des 3-Monats-Exports ist bei **exakt 1000 Zeilen gekappt**. Die
   Query-Summen oben sind damit Untergrenzen, keine Vollerhebung.
3. Die Klick-Spalten stehen unterschiedlich: 12 Klicks in `Queries.csv` gegen 30
   in `Pages.csv` (3 Monate). Auch das ist Aggregationsdifferenz.

**Der Zustand in einem Satz:** Die Domain sammelt fünfstellige Impressionen bei
einer Ø-Position um 50 und praktisch ohne Klicks. Von den 30 Klicks im
3-Monats-Fenster sind 9 markengetrieben; nicht-markenbezogen sind es 3. Das ist
kein CTR-Problem — bei Position 50 ist eine CTR nahe null das erwartete
Ergebnis. Es ist ein Positionsproblem.

### Seiten-Baseline der in diesem Lauf geänderten URLs

Aus `Pages.csv`. **Seiten-Aggregat, kein Query×Seite-Paar.**

| URL | 3M Impr. | 3M Pos. | 28D Impr. | 28D Pos. | Klicks |
|---|---:|---:|---:|---:|---:|
| `/webdesign-hotel` | 814 | 36,0 | 814 | 36,0 | 0 |
| `/verpasste-anrufe-verlust` | 122 | 15,5 | 59 | 18,5 | 0 |

Bemerkenswert an der ersten Zeile: 3-Monats- und 28-Tage-Wert sind **identisch**.
Alle 814 Impressionen dieser URL fielen in die letzten 28 Tage. Die Seite ist
erst in diesem Fenster in den Index gekommen bzw. sichtbar geworden.

---

## Messpunkte dieses Laufs

### M1 · `/webdesign-hotel` — Intent „Internetagentur für Hotellerie"

- **URL:** `https://cogniiq.de/webdesign-hotel`
- **Query-Familie (aus `Queries.csv`, 28-Tage-Fenster):**

  | Query | Impr. | Ø Pos. |
  |---|---:|---:|
  | internetagentur hotel | 193 | 44,7 |
  | internetagentur hotels | 124 | 44,0 |
  | website für hotellerie | 47 | 64,9 |
  | webdesigner hotel | 38 | 27,0 |
  | hotel webdesigners | 24 | 36,6 |
  | hotel webdesign agentur | 23 | 27,7 |
  | hotel website erstellen lassen | 22 | 68,8 |
  | internetagentur für hotels | 6 | 47,7 |
  | webdesign agentur für hotels | 3 | 36,0 |
  | **Summe Agentur-/Hotellerie-Intent** | **480** | — |

  Danebenliegend, bereits besser platziert und **nicht** Ziel der Änderung, aber
  betroffen: „hotel webdesign" 120 Impr. Pos. 20,2 · „webdesign hotel" 74 Impr.
  Pos. 20,9 · „webdesign für hotels" 74 Impr. Pos. 26,5 · „webdesign hotels"
  25 Impr. Pos. 18,8.

- **Attributionsgrenze:** Dass diese Queries auf `/webdesign-hotel` fallen, ist
  eine **begründete Annahme, kein Beleg**. `Queries.csv` und `Pages.csv` sind
  getrennte Aggregate. Die Annahme stützt sich darauf, dass `/webdesign-hotel`
  die einzige Hotel-Webdesign-URL der Domain ist und ihre 814 Impressionen im
  selben 28-Tage-Fenster entstanden wie die Query-Familie. Ein Query×Seite-Export
  würde das entscheiden.
- **Aggregat-Baseline (Seite):** 814 Impressionen · Ø Position 36,0 · 0 Klicks
  (28 Tage bis 2026-09-08).
- **Hypothese:** Die Seite war zu 100 % auf OTA-Provision und Direktbuchung
  gerahmt und enthielt nichts zur **Anbieterauswahl**: „Internetagentur" kam
  auf der Seite gar nicht vor, „Hotellerie" nur als einzelnes Tagline-Wort und
  in den Keywords, und die Betriebstypen (Stadthotel, Boutiquehotel, Landhotel,
  Pension, Gästehaus, Ferienwohnungs-Vermieter) fehlten vollständig.
  Rund 480 Impressionen je 28 Tage suchen aber genau
  danach. Wird dieser Intent im Titel, in der Description und im **gerenderten
  Fließtext** bedient, sollte die Familie aus ihrer heutigen Spanne
  (Pos. 27,0 bis 68,8; volumengewichtet rund 45) in Richtung Position 20
  wandern.
- **Mechanismus:** Begriffsdeckung plus Informationsgewinn. Neu und inhaltlich
  eigenständig sind der Abschnitt „Die allgemeine Webagentur kennt die
  Buchungsstrecke nicht" (Belegungskalender, Ratenlogik, Mindestaufenthalt,
  Stornofristen, Übergabe an das Buchungssystem) und die Betriebstypen-Einordnung
  im Lösungsabsatz. Beides steht im SSR-Körper, nicht nur im JSON-LD.
- **Umgesetzt:** 2026-09-10.
- **Erfolgskriterium:**
  - Tag 7: keine Bewertung. Titeländerungen brauchen einen Re-Crawl.
  - Tag 14: Ø Position der Seite **unter 34,0** (von 36,0), Impressionen nicht
    gefallen.
  - Tag 28: mindestens eine Query der Agentur-Familie **unter Position 25**;
    Seiten-Ø unter 30.
  - Tag 56: erste Klicks auf der Seite (> 0), oder mindestens eine Query der
    Familie in den Top 20.
  - **Abbruchkriterium:** Fällt die Ø Position bis Tag 28 auf über 40 oder
    verlieren „hotel webdesign" / „webdesign hotel" ihre Position-20-Nähe, ist
    die Titeländerung zurückzunehmen — dann hat die Umgewichtung dem
    bestehenden Ranking mehr geschadet als der neue Intent gebracht hat.

### M2 · `/verpasste-anrufe-verlust` — Titel auf die Kopf-Query gezogen

- **URL:** `https://cogniiq.de/verpasste-anrufe-verlust`
- **Query-Familie (`Queries.csv`):** „verpasste anrufe kosten unternehmen"
  39 Impr. Pos. 11,2 (3 Monate) bzw. 28 Impr. Pos. 12,1 (28 Tage) ·
  „verpasste anrufe" 15 Impr. Pos. 23,6 · „entgangene anrufe" 3 Impr. Pos. 24,7.
- **Warum überhaupt:** Position 11,2 ist eine der besten
  Nicht-Marken-Platzierungen der Domain mit klarer kommerzieller Absicht — aber
  **nicht die beste**. Besser stehen im 3-Monats-Fenster unter anderem
  „webentwicklung bayreuth" (178 Impr., Pos. 9,2), „web development" (138 Impr.,
  Pos. 6,1), „it-dienstleistungen" (17 Impr., Pos. 5,2) und „website relaunch
  münchen" (25 Impr., Pos. 10,2). Von diesen ist „webentwicklung bayreuth" die
  eigentlich interessantere Zeile: bessere Position **und** 4,5-fache Menge.
  Sie ist in diesem Lauf nicht angefasst worden, weil ihre wahrscheinliche
  Zielseite `/bayreuth/webdesign` ist — und die läuft als eingefrorenes
  Experiment. Der Titel im Manifest lautete
  „Verpasste Anrufe kosten täglich Umsatz – So hören Sie damit auf" und enthielt
  das Wort „Unternehmen" nicht, obwohl es in der Kopf-Query steht und in der H1
  der Seite bereits vorkam.
- **Aggregat-Baseline (Seite):** 59 Impressionen · Ø Position 18,5 · 0 Klicks
  (28 Tage bis 2026-09-08).
- **Hypothese:** Titel-Query-Deckung an einer Position knapp außerhalb der ersten
  Seite. Das Volumen ist klein — die Änderung ist als billiger Test einer
  Positionsschwelle gedacht, nicht als Wachstumstreiber.
- **Ehrliche Einordnung:** Dies ist **keine CTR-Chance**. Bei Position 11–18 ist
  eine CTR von 0 der Normalfall; wer hier eine CTR-Verbesserung behauptet,
  verwechselt Position mit Snippet.
- **Umgesetzt:** 2026-09-10.
- **Erfolgskriterium:** Tag 14 Position der Seite unter 16 · Tag 28 unter 12 ·
  Tag 56 erster Klick. Bei Verschlechterung über Position 22 zurücknehmen.

### Nicht vergessen: die Gegenprobe

Beide Änderungen laufen gleichzeitig, aber auf **verschiedenen Query-Familien**
und verschiedenen URLs. Sie sind damit getrennt zurechenbar. Eine dritte
gleichzeitige Änderung an derselben Familie wäre es nicht gewesen — deshalb ist
`/webdesign-gastronomie` in diesem Lauf bewusst unangetastet geblieben, obwohl
sie zur selben Branchenlogik gehört.

---

### Warum die Baseline bis zum 10.09.2026 leer war — erledigt

Der Lauf vom 10.09.2026 (Branch `claude/seo-gsc-growth-2026-09-10`) hatte keinen
Zugriff auf die Search-Console-Exporte: Die Sitzung lief in einem Cloud-Container
ohne das `~/Downloads` des Inhabers. Die Baseline blieb deshalb bewusst leer,
statt aus Erinnerung rekonstruiert zu werden.

**Erledigt am 10.09.2026, zweiter Lauf** (`claude/seo-gsc-opportunities-2026-09-10`):
Die Exporte wurden direkt an die Sitzung angehängt. Die echten Werte stehen oben
unter „GSC-Baseline 10.09.2026". Die Tabelle „Ausgangslage (historische
Referenz)" weiter oben stammt weiterhin aus einer Aufgabenstellung ohne
benannten Zeitraum und ist **nicht** als Vergleichsgröße zu verwenden; sie bleibt
nur stehen, damit nachvollziehbar ist, gegen welche Zahl früher argumentiert
wurde.

### Was der nächste Lauf braucht

1. Die GSC-Exporte **im Repository-Container erreichbar** (Anhang an die Sitzung
   oder Ablage in einem lesbaren Pfad) — ohne sie sind Abschnitte zur
   GSC-Auswertung nicht durchführbar.
2. Nach Möglichkeit einen **Query×Seite-Export** (GSC-UI: Seitenfilter setzen,
   dann Queries exportieren). Erst damit lässt sich Kannibalisierung belegen
   statt vermuten.
3. Einen echten **Vorperioden-Export** für Queries, falls Veränderung über die
   Zeit bewertet werden soll.

**Stand nach dem 10.09.2026:** Punkt 1 ist erledigt. Punkt 2 und 3 sind weiter
offen und in dieser Reihenfolge wertvoll:

- **Query×Seite für `/webdesign-hotel`** (in der GSC-UI Seitenfilter auf die URL
  setzen, dann Queries exportieren). Das ist der einzige Export, der aus der
  Annahme in M1 einen Beleg macht — und zugleich der einzige, der die
  Kannibalisierungs-Hypothesen in `docs/seo/post-experiment-opportunities.md`
  entscheiden kann.
- **Query×Seite für `/regensburg/webdesign` und `/regensburg`.** Beide Seiten
  bekommen zusammen rund 5.000 Impressionen in 28 Tagen auf offensichtlich
  überlappende Regensburg-Queries. Ob das eine Kannibalisierung ist oder zwei
  saubere Intents, lässt sich mit den vorliegenden Aggregaten **nicht**
  beantworten.
- **Ein Vorperioden-Query-Export**, um zu trennen, was gewachsen ist und was
  nur neu im Index steht. Ohne ihn ist der auffälligste Befund dieses Laufs —
  die Hotel-Familie ist zu ~95 % in den letzten 28 Tagen entstanden — nur aus
  dem Vergleich zweier Fenster erschlossen.

---

## 2026-09-12 · Architekturlauf (Branch `claude/seo-architecture-max-2026-09-12`)

Vollständige Intentionskarte, Kannibalisierungsmatrix und Strategievergleich:
**`docs/seo/ARCHITEKTUR.md`** — ab jetzt die Quelle dafür, welche Seite welche
Suchintention besitzen darf. Hier stehen nur die Messfolgen.

### Befund, der drei laufende Messreihen ungültig macht

Der am 11.09.2026 protokollierte Drift zwischen `functions/_middleware.ts` und
dem Routen-Manifest war kein Kosmetikproblem. Die Middleware überschrieb den
vorgerenderten `<head>` an der Edge, und **die Edge gewann**. Auf 29 von 86
gemeinsamen Routen trug sie durchgehend die Copy **vor** der Überarbeitung.

Damit ist **nie ausgeliefert worden**, was diese Messreihen messen wollten:

| Messpunkt | Route | Geplanter Titel | Tatsächlich im SERP |
|---|---|---|---|
| M1 (10.09.2026) | `/webdesign-hotel` | „Internetagentur für Hotellerie" | „Direktbuchungen steigern" (alt) |
| M2 (10.09.2026) | `/verpasste-anrufe-verlust` | Titel auf die Kopf-Query | alte Fassung |
| Titel-Experiment (29.08.2026) | `/bayreuth/website-relaunch` | „Mehr Performance & bessere Rankings" | „Alte Website modernisieren" (alt) |
| Neuausrichtung (05.09.2026) | `/blog/ki-telefonassistent-arztpraxis` | Fassung vom 05.09. | alte Fassung, Titel mit „2025" |

**M1 und M2 sind UNGÜLTIG, nicht gescheitert.** Ihre Erfolgs- und
Abbruchkriterien sind gegen eine Auslieferung formuliert, die es nicht gab. Sie
sind mit dem Deploy dieses Branches **neu zu starten**; die Baselines vom
10.09.2026 (`/webdesign-hotel` 814 Impr., Pos. 36,0 · `/verpasste-anrufe-verlust`
59 Impr., Pos. 18,5) bleiben gültig, weil sie den alten Titel gemessen haben —
der bis zum 12.09.2026 tatsächlich ausgeliefert wurde. Tag 0 der Messung ist
der Deploy dieses Branches, nicht der 10.09.2026.

**Das Titel-Experiment auf `/bayreuth/website-relaunch` hat nie begonnen.** Die
Route ist eingefroren und wird gegen die Bytes gemessen, die ein Crawler
bekommen hat — also gegen den alten Titel. Der Edge-Override wird deshalb
bewusst **gehalten**, statt jetzt auf den Manifestwert zu wechseln: das wäre ein
Start, kein Fortsetzen. **Offene Inhaber-Entscheidung:** Titel ausliefern
(bewusster Reset, neue Baseline ab Deploy) oder Experiment für ungültig
erklären und den Manifestwert zurücknehmen.

Nicht vergessen: 29 Routen haben mit diesem Branch einen **neuen**
SERP-Snippet, weil erstmals der geprüfte Manifestwert ausgeliefert wird. Eine
CTR-Bewegung auf diesen Routen ab dem Deploy ist darauf zurückzuführen und nicht
auf Inhaltsarbeit. Die Liste steht in `docs/seo/ARCHITEKTUR.md` §7.

### M3 · `/prozessautomatisierung` — aus der Waisenlage geholt

- **Baseline (Architektur, nicht GSC):** 0 kontextuelle eingehende Links,
  erreichbar nur über den Footer. 2.746 Zeichen gerenderter Körper — die
  dünnste Seite des Automatisierungs-Clusters. Keine GSC-Zeile in den Exporten
  vom 10.09.2026, also unter der Sichtbarkeitsschwelle.
- **Umgesetzt 2026-09-12:** 8 kontextuelle eingehende Links aus dem
  Automatisierungs-Cluster (`/kosten-automatisierung` als Service-Ziel,
  `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen`, die vier
  Branchenseiten, `/automatisierung-unternehmen`). Kein Link von
  `/automatisierung-unternehmen` entfernt — die Eigentümerfrage (K1) bleibt
  offen und wird nicht per Linkumbau vorentschieden.
- **Hypothese:** Eine Seite, auf die kein Seitenkörper verweist, wird als
  Footer-Anhang bewertet. Mit eingehenden Links aus thematisch passenden Körpern
  sollte sie überhaupt erst in die Query-Familie „Prozessautomatisierung"
  eintreten.
- **Ehrliche Einordnung:** Links allein machen aus 2.746 Zeichen keinen Pillar.
  Das ist die Voraussetzung, nicht die Maßnahme. Die Maßnahme ist F2.
- **Erfolgskriterium:** Tag 28 überhaupt eine Impression auf
  „prozessautomatisierung" oder „geschäftsprozesse automatisieren" · Tag 56
  Seiten-Ø unter 60 · Tag 90 eine Query der Familie unter Position 30.
- **Abbruchkriterium:** Verliert `/automatisierung-unternehmen` bis Tag 28
  Impressionen, ohne dass `/prozessautomatisierung` welche gewinnt, ist die
  Autorität geteilt statt verschoben — dann ist K1 sofort zu entscheiden (F2)
  und nicht weiter zu beobachten.

### M4 · `/webdesign` — kontextuelle Links von 1 auf 4

- **Baseline:** 1 kontextueller eingehender Link, 3.103 Zeichen, **34**
  ausgehende Links. Verteilt Autorität, bekommt keine.
- **Umgesetzt 2026-09-12:** Service-Ziel von `/kosten-webdesign` (war
  `/leistungen`), Service-Link von `/keine-anfragen-website` (war `/leistungen`),
  Verwandten-Link von `/webdesign-agentur-deutschland`.
- **Hypothese:** dieselbe wie M3. Zusätzlich wird K2 sichtbar gemacht: der
  nationale Ableger erkennt den generischen Eigentümer erstmals an.
- **Erfolgskriterium:** Tag 28 Seiten-Ø verbessert gegenüber dem ersten
  Messpunkt nach dem Deploy · Tag 56 eine „webdesign agentur"-Query unter
  Position 40.
- **Abbruchkriterium:** Fällt `/webdesign-agentur-deutschland` (19 eingehende
  Links) messbar, während `/webdesign` nicht gewinnt, ist K2 zu entscheiden
  statt weiter zu beobachten.
- **Gegenprobe:** `/leistungen` verliert zwei eingehende Links (58 → 56). Bei
  56 Links ohne eigene kommerzielle Kopf-Intention ist das ohne erwartete
  Wirkung; fällt die Seite dennoch auf, gehört die Änderung hierher notiert.

## Messpunkte 2026-09-13 — Webdesign-Cluster

Branch `claude/webdesign-recovery-max-2026-09-13`, Basis `56707c2` + PR #95.
**Tag 0 = Produktions-Deploy dieses Branches** (Datum nach dem Merge hier
eintragen). Prüfpunkte: Tag 14 nur Indexierung/Auslieferung · Tag 28 erste
Richtung · Tag 56 Trend · Tag 90 Architektur-Urteil. Vor Tag 28 keine
Erfolgs- oder Misserfolgsmeldung.

**Quelle der Baseline:** Inhaber-Abfrage der Property `sc-domain:cogniiq.de`
(nicht Claude, nicht Pages.csv), letzter gesetzter Tag 2026-09-10.

### M5 · `/webdesign` — Pillar neu aufgebaut, `/webdesign-agentur-deutschland` entlinkt (301 aufgeschoben, F9)

- **Baseline (Inhaber-verifiziert, 2026-08-14 → 2026-09-10):**

  | Fenster | Impr. | Klicks | Position |
  |---|---:|---:|---|
  | 14.08.–30.08. | 1.815 | 0 | überwiegend 70–90 |
  | 31.08. | 17 | 0 | |
  | 01.09.–10.09. | 0/Tag | 0 | — |

  Query-Zusammensetzung vor dem Einbruch: überwiegend lokal/SEO („seo bayreuth"
  45, „webentwicklung regensburg" 71, „homepage erstellen lassen regensburg"
  42, „landingpage optimierung regensburg" 32, „seo agentur bayreuth" 32).
  **1.815 ist keine Zielmarke** — es war Leckage.
  `/webdesign-agentur-deutschland`: 5 Impressionen, 0 Klicks, fast alle
  markenbezogen (Pos. 1–3).
- **M4 (12.09.) ist damit abgelöst**, nicht gescheitert: sein Abbruchkriterium
  („K2 entscheiden") wurde ausgeführt.
- **Umgesetzt:** Seite 578 → ~2.300 Wörter, 26 Käuferfragen, 32 → 19
  Körper-Linkziele, 108 → 93 Links gesamt, Stadt-Unterseiten-Anker entfernt,
  Titel „Webdesign Agentur – Websites für Unternehmen | Cogniiq"; kontextuelle
  eingehende Seiten 4 → **21** (Homepage, `/leistungen`, `/deutschland`, fünf
  Branchenseiten, sechs Stadt-Service-Seiten, Kostenseite, Problemseite, KI-Agentur,
  zwei Blogbeiträge); `/webdesign-agentur-deutschland` bleibt **vorerst live**,
  wird aber nur noch von der eingefrorenen `/bayreuth/webdesign` verlinkt
  (Inhaber-Review 13.09.2026: die 301 würde die Inbound-Topologie zweier
  Experimente ändern → F9 nach Graduierung).
- **Hypothese:** Ein Körper, der die nationale Intention vollständig
  beantwortet und keine lokalen Anker trägt, wird von Google für generische
  Webdesign-Queries statt für fremde lokale Queries bewertet; 17 zusätzliche
  Kontextlinks fließen hierher, die Dublette verliert ihre interne Autorität
  schon vor der 301.
- **Erfolgskriterium:** Tag 14 URL indexiert, Canonical = self in der
  URL-Prüfung · Tag 28 überhaupt Impressionen auf einer Query der Familie
  „webdesign agentur / webdesign für unternehmen / website erstellen lassen"
  und Anteil lokaler Queries (`<stadt>`-Modifier) an den Impressionen unter 25 %
  · Tag 56 Seiten-Ø unter 50 · Tag 90 eine Query der Familie unter Position 30
  und der erste Nicht-Marken-Klick.
- **Abbruchkriterium:** Tag 56 weiterhin 0 Impressionen bei bestätigter
  Indexierung → Inhalt ist nicht das Problem; dann URL-Prüfung auf von Google
  gewähltes Canonical und Backlink-Frage (`authority-acquisition-plan.md`).
  Verlieren `/bayreuth/webdesign` oder `/regensburg/webdesign` bis Tag 28
  messbar (Seiten-Ø > +10 Positionen), während `/webdesign` auf ihre lokalen
  Queries gewinnt, ist die Trennung nicht gelungen und der Pillar-Körper auf
  Ortsnennungen zu prüfen.
- **Gegenprobe:** `/webdesign-agentur-deutschland` verliert 18 interne Links,
  behält aber Seite, Head und Sitemap-Eintrag. Gewinnt sie trotzdem Impressionen,
  während `/webdesign` keine bekommt, ist F9 vorzuziehen, nicht abzuwarten.
  Die fünf eingefrorenen Routen: Fingerprints und Inbound-Topologie unverändert
  (Fixture byte-identisch mit `main`).

### M6 · `/kosten-webdesign` — Preise raus, Preistreiber rein, Jahr raus

- **Baseline:** keine Seitenzahl in der Inhaber-Abfrage vorhanden; Pages.csv
  (bis 08.09.) führte die Route nicht unter den Top-Seiten. Erste Messung = Tag 28.
- **Umgesetzt:** Titel „Was kostet eine Website? Webdesign Kosten & Preistreiber"
  (war „Webdesign Kosten 2025 – …"), `CostPage` abgelöst, 18 unbelegte
  Beträge/Zusagen entfernt (`preisaudit-webdesign.md` A1–A18), kein Rechner,
  kein `Offer`-Preis im Schema.
- **Hypothese:** Die Seite verliert nichts, was sie messbar hatte, und gewinnt
  die Kostenintention über Vollständigkeit statt über Zahlen.
- **Erfolgskriterium:** Tag 28 Impressionen auf „webdesign kosten" / „was kostet
  eine website" · Tag 90 Seiten-Ø unter 40.
- **Abbruchkriterium:** Tag 56 keinerlei Impression auf eine Kosten-Query bei
  bestätigter Indexierung → Titel gegen die SERP-Muster in
  `serp-webdesign-2026-09.md` §2.9 prüfen (Jahreszahl-Framing des Marktes).

### M7 · `/bayreuth/lokales-seo` — Eigentümer für „seo bayreuth"

- **Baseline:** „seo bayreuth" verteilt über sieben URLs (Inhaber-Abfrage);
  `/webdesign` allein trug 45 Impressionen darauf. Seitenzahl der Route selbst:
  nicht in der Abfrage.
- **Umgesetzt:** Titel „SEO Bayreuth – Lokales SEO & Google-Sichtbarkeit für
  Unternehmen", H1 „SEO in Bayreuth: …", Keywords geführt vom Kopfbegriff,
  Preis-FAQ ohne Beträge, neuer Kontextlink vom Hub `/bayreuth`.
- **Erfolgskriterium:** Tag 28 „seo bayreuth" oder „seo agentur bayreuth"
  landet auf dieser URL (Query×Seite in der GSC-UI) · Tag 90 Position unter 30.
- **Abbruchkriterium:** Tag 56 fällt die Familie weiter auf `/` oder
  `/bayreuth` → Hub-Körper und Homepage-Keywords erneut prüfen.

### M8 · Geo-Hubs `/bayreuth`, `/muenchen`, `/regensburg` — Titel ohne „Webdesign <Stadt>"

- **Baseline:** `/regensburg` 2.623 Impr. auf Ø 75,8 (Pages.csv 28D); „webdesign
  regensburg"-Familie zwischen Hub und Service-Seite geteilt (K6); „webdesign
  bayreuth" auf `/bayreuth` 30 Impr. (Inhaber-Abfrage).
- **Umgesetzt:** Titel/H1 „Cogniiq in <Stadt> – KI-Telefonassistent, Websites &
  Automatisierung", Tagline ohne Exact-Match-Stapel; Service-Anker „Webdesign
  <Stadt>" bleiben und zeigen auf die Service-Seite.
- **Hypothese:** Der Hub gibt „webdesign <stadt>" an die Service-Seite ab und
  behält Marke×Ort.
- **Erfolgskriterium:** Tag 56 Anteil der Hub-Impressionen auf
  „webdesign <stadt>"-Queries sinkt, Service-Seite steigt.
- **Abbruchkriterium:** Hub verliert Impressionen, ohne dass die Service-Seite
  gewinnt → Autorität ging verloren statt über; dann Tagline zurück.

### Mitgeändert, ohne eigene Messreihe

| Fundstelle | Alt | Neu | Grund |
|---|---|---|---|
| `src/pages/ProzessautomatisierungHub.tsx` (FAQ) | „Wir integrieren alle gängigen Tools: Google Workspace, Microsoft 365, HubSpot, Salesforce, Calendly, Stripe, Shopify, Lexoffice, Datev und viele weitere." | Bedingung statt Liste: Schnittstellenprüfung vor dem Angebot | Zusage über Software Dritter ohne geprüfte Anbindung — dasselbe Muster, wegen dem `/integrationen` noindex ist. Stand im `FAQPage`-JSON-LD und damit öffentlich. |
| `src/pages/ProzessautomatisierungHub.tsx`, `src/pages/pillars/AutomatisierungUnternehmen.tsx` | „API-Integrationen für alle gängigen Tools" | „API-Anbindung, wo Ihr System eine geeignete Schnittstelle hat" | dieselbe Klasse, im sichtbaren SSR-Körper |

### Nicht angefasst — bewusst

- **`/ki-telefonassistent`.** Kein Titel, keine H1, kein Hero, kein Rechner,
  kein Preismodell, keine Abschnittsreihenfolge, keine Neupositionierung. Die
  Überarbeitung vom 11.09.2026 braucht ~28 gesetzte GSC-Tage; dieser Lauf setzt
  sie nicht zurück. Die Seite hat 32 kontextuelle eingehende Links und braucht
  architektonisch nichts.
- **Die fünf eingefrorenen Routen.** Fingerprints, gelieferte Heads und
  Erwähnungszahlen unverändert; `protected-experiments.baseline.json` nicht
  angefasst, `npm run seo:baseline` nicht gelaufen. Nachweis in
  `docs/seo/ARCHITEKTUR.md` §9.
- **Keine Konsolidierung, keine 301, kein Canonical auf eine fremde URL, keine
  Route entfernt.** K1 und K3 sind entschieden dokumentiert und warten auf
  Inhaber-Freigabe bzw. Experimentende.
- **`src/pages/pillars/AutomatisierungUnternehmen.tsx:278`** („zur vollständig
  automatisierten Geschäftsstruktur") bleibt stehen — Grenzfall, gehört in eine
  Copy-Prüfung und nicht in einen Architekturlauf.

---

## M23 · Automatisierungs-Cluster konsolidiert (12.09.2026)

Branch `claude/prozessautomatisierung-pillar-max-2026-09-12`, Basis `56707c2`.
Setzt Folgemission **F2** aus `ARCHITEKTUR.md` §4.1 um. **Tag 0 der Messung ist
der Deploy dieses Branches**, nicht dieses Datum.

### Baseline — vom Inhaber aus der Search Console erhoben (13.09.2026)

**Herkunft, damit sie nicht später verwechselt wird.** Die Zahlen unten hat der
**Inhaber** im Owner-Review aus der verbundenen Search-Console-Property
`sc-domain:cogniiq.de` abgefragt und weitergegeben. **Claude hat die Search
Console nicht abgefragt** — im Umsetzungsdurchgang vom 12.09.2026 stand dort
weder ein API-Zugang noch ein Export zur Verfügung, und die damalige Fassung
dieses Abschnitts führte deshalb nur übernommene Werte aus `ARCHITEKTUR.md` §4.
Diese Fassung ersetzt sie durch gemessene.

**Zeitraum: 2026-08-14 bis 2026-09-10**, letzter vollständig abgeschlossener
Zeitraum zum Zeitpunkt der Abfrage. Jede Zahl unten gilt für genau dieses
Fenster; ein späterer Vergleich, der ein anderes Fenster benutzt, ist kein
Vergleich.

#### Seiten

| URL | Klicks | Impressionen | Ø Position |
|---|---:|---:|---:|
| `/prozessautomatisierung` | 0 | **23** | **38,43** |
| `/automatisierung-unternehmen` (zurückgezogen) | 0 | **8** | **66,62** |
| `/kosten-automatisierung` | 0 | **37** | **16,24** |

**Die Zeile der zurückgezogenen URL bleibt dauerhaft stehen.** 8 Impressionen
bei Position 66,62 sind der Maßstab, an dem sich nach dem 301 beurteilen lässt,
ob Signale gewandert sind oder nur verschwunden. Eine URL, deren Historie mit
ihr gelöscht wird, macht genau diese Frage unbeantwortbar.

**Was die Zahlen bestätigen.** Der Pillar stand bei 23 Impressionen auf Position
38,43 — sichtbar, aber weit von der ersten Ergebnisseite. Die zurückgezogene
Seite hatte mit 8 Impressionen auf 66,62 tatsächlich **fast keine organische
Substanz**: Ihr Gewicht lag in 22 internen Links, nicht in Rankings. Das ist die
empirische Bestätigung dafür, dass die Konsolidierungsrichtung (Pillar behalten,
die andere zurückziehen) die richtige war — die stärkere Seite überlebt.

#### Queries der Kostenseite (dasselbe Fenster)

| Query | Impressionen | Klicks | Ø Position |
|---|---:|---:|---:|
| `automatisierung kosten` | 12 | 0 | **13,0** |
| `automatisierung projekt kosten` | 6 | 0 | **17,17** |
| `automatisierungstechnik kosten` | 4 | 0 | **15,5** |
| `automatisierungslösung preis` | 2 | 0 | **20,5** |
| `welche kosten sind mit automatisierungstechnologien verbunden?` | 2 | 0 | **11,0** |
| `automatisierung überall preis` | 4 | 0 | 34,25 |
| `automatisierung preisauszeichnung` | 1 | 0 | 14,0 |

**Warum das die Reihenfolge der Arbeit rechtfertigt.** Fünf Kostenqueries stehen
zwischen Position 11 und 20,5 — also am Fuß der ersten Ergebnisseite, bei null
Klicks. Das ist die kürzeste Distanz zu messbarem Ergebnis, die dieses Cluster
hat, und der Grund, warum die Kostenseite in diesem Durchgang eine eigene
Überarbeitung samt Rechner bekommen hat statt nur eines Linkumbaus.

**Zwei Einschränkungen, die dabei mitzudenken sind.** Erstens sind das
zweistellige Impressionszahlen: Positionsangaben aus 2–12 Impressionen
schwanken stark und tragen keine Feinsteuerung. Zweitens ist
`automatisierungstechnik kosten` erkennbar **Industrieautomatisierung** —
eine andere Branche. Diese Query wird beobachtet, aber die Seite wird **nicht**
auf sie hin getextet; ein Klick von dort wäre kein qualifizierter Besucher.

### Was geändert wurde

1. **301** `/automatisierung-unternehmen` → `/prozessautomatisierung` (beide
   Formen, mit und ohne Schrägstrich). Alte Route aus Manifest, Router und
   Sitemap entfernt, Seitenkomponente gelöscht.
2. **16 interne Links** auf die alte URL umgestellt (Navigation, Footer,
   Desktop-Hero, vier Branchenseiten, vier Problemseiten, zwei Pillar-Seiten,
   Scan-Seite, Kostenseite, Organisationsschema, KI-Flaggschiff). Eine
   verbleibende Ausnahme auf der eingefrorenen Route `/bayreuth/webdesign`
   (§4.1).
3. **Hauptnavigation**: Der Automatisierungs-Einstieg zeigt jetzt auf den
   Pillar statt auf die zurückgezogene Seite.
4. **Pillar neu aufgebaut**: von 2.746 auf rund 16.000 Zeichen, sechzehn
   Käuferfragen, sechs Ablaufmuster, elf Umsetzungsschritte, ein Abschnitt
   „was nicht automatisiert gehört" und einer zur Ausnahmebehandlung.
5. **Kostenseite neu aufgebaut**: zwölf unbelegte Beträge entfernt
   (`preisaudit-automatisierung.md`), acht Kostentreiber, einmalig und laufend
   getrennt, „wann es sich NICHT lohnt", und ein Wirtschaftlichkeitsrechner
   ohne Lead-Gate.

### Zielquery-Familien

| Seite | Primärcluster |
|---|---|
| `/prozessautomatisierung` | prozessautomatisierung · prozessautomatisierung für unternehmen · geschäftsprozesse automatisieren · unternehmensprozesse automatisieren · workflow automatisierung · ki automatisierung unternehmen · automatisierung für unternehmen (von der zurückgezogenen URL geerbt) |
| `/kosten-automatisierung` | automatisierung kosten · prozessautomatisierung kosten · automatisierung projekt kosten · automatisierungslösung preis · eng verwandte Kostenintentionen (siehe Query-Tabelle oben) |

**Die Copy wird nicht auf diese Zeichenketten hin umgeschrieben.** Die Liste ist
Messraster, nicht Textvorlage — eine Seite, die ihre Zielqueries wörtlich
wiederholt, gewinnt keine Position und verliert Leser.

### Hypothesen

- **H1 (Konsolidierung).** Zwei Seiten auf eine Kopfintention teilten die
  Autorität. Mit einer Seite und 20 statt 8 kontextuellen eingehenden Links
  sollte der Pillar über seine 23 Impressionen hinauskommen.
- **H2 (Substanz).** Links allein machen aus 6.605 Zeichen keinen Pillar
  (M3 sagte das ausdrücklich). Erst die inhaltliche Tiefe macht die Seite zu
  einer möglichen Antwort auf die Kopfqueries.
- **H3 (Kostenseite).** Fünf Queries zwischen Position 11 und 20,5, null
  Klicks. Ein Rechner ohne Gate und ein ehrliches „wann es sich nicht lohnt"
  adressieren diese Absicht direkter als eine Preisstaffel, die ohnehin nicht
  belegt war.

### Beobachtungsfenster und Beurteilung

**Fenster: Tag 28, Tag 56 und Tag 90 nach dem Deploy**, jeweils gegen einen
GSC-Zeitraum gleicher Länge wie die Baseline (28 Tage), damit die Zahlen
vergleichbar sind.

Beurteilt wird an vier Fragen — **nicht an Rangzielen**. „Top 3 in 28 Tagen"
wäre eine Zahl, die niemand einlösen kann und die bei Verfehlung nur dazu
führt, dass die nächste Messung weggelassen wird:

1. **Konsolidieren die Impressionen auf den Pillar?** Bezugspunkt ist die Summe
   der beiden Seiten vor dem Deploy (23 + 8 = 31). Liegt der Pillar danach
   deutlich darüber, ist Autorität gewandert; liegt er darunter, ist sie
   verloren gegangen.
2. **Gewinnt die Kostenseite Impressionen und erste Klicks?** Sie startet bei
   37 Impressionen und **null** Klicks. Der erste Klick auf eine
   Nicht-Marken-Kostenquery ist das aussagekräftigste einzelne Ereignis dieses
   Experiments.
3. **Verbessert sich die Ø Position des Kostenclusters?** Gemessen an den fünf
   genannten Queries einzeln, nicht am Seiten-Ø — ein Seitenmittel verdeckt
   genau die Bewegung, auf die es ankommt.
4. **Verschwindet die zurückgezogene URL, und wandern ihre Signale?** Erwartet
   wird, dass `/automatisierung-unternehmen` aus dem Index fällt. Fällt sie
   heraus, **ohne** dass der Pillar gewinnt, war die Konsolidierung ein
   Verlustgeschäft — dann ist das der Befund, und er wird so notiert.

### Abbruch- und Warnkriterien

- **Warnung:** Verliert `/kosten-automatisierung` bis Tag 28 Position im
  Kostencluster, ohne dass der Pillar gewinnt, ist die Intentionstrennung nicht
  sauber — dann zuerst die Überschneidung „was kostet Prozessautomatisierung"
  zwischen beiden Seiten prüfen, bevor irgendetwas weiter geändert wird.
- **Abbruch:** Bewegt sich bis Tag 56 auf keiner der beiden Seiten etwas,
  liegt das Problem nicht an der Struktur, sondern an der Domain-Autorität
  insgesamt — dann greift `authority-acquisition-plan.md`, nicht die nächste
  Seitenüberarbeitung.

### Was hier bewusst NICHT steht

Keine Signifikanzaussage. Zwei Seiten mit dreistelligen Impressionen tragen
keine statistische Auswertung; was hier gemessen wird, ist Richtung und
Größenordnung, nicht Signifikanz. Und **keine Erfolgsmeldung vor Tag 28**
(Regel 1).

---

# Messpunkt 14.09.2026 — Befund, Ledger und Übergabe

Basis-Commit `ebe326f` (main, PR #96 gemergt 13.09.2026 18:53 UTC).
Arbeitszweig `claude/brave-euler-kud79d`.

GSC-Grundlage: Property `sc-domain:cogniiq.de`, Web-Suche, letztes vollständiges
Datum **2026-09-11**, Zeitzone America/Los_Angeles, Zeitraum
**2026-08-15 bis 2026-09-11 (28 Tage)**. Die Zahlen stammen aus einem
verbundenen Kontozugriff am 14.09.2026, nicht aus öffentlichen Snippets.
Sie sind in dieser Sitzung **nicht** nachgeladen worden — sie stehen hier als
historischer Snapshot und werden beim nächsten Messpunkt gegen frische Daten
geprüft, nicht überschrieben.

## 1 · Was gesichert ist, was Hypothese ist, was unbekannt bleibt

### Gesichert (aus dem Repository, in dieser Sitzung geprüft)

| Befund | Beleg |
|---|---|
| Die Webdesign-Recovery war **nicht** deployt: ein Commit, zehn hinter main, Merge-Base `729e0e4` | `git rev-list --left-right --count` |
| Sie enthält **keinen** 301 `/webdesign-agentur-deutschland` → `/webdesign` | `legacyRedirects.ts`: bewusst leerer Eintrag mit Begründung |
| Der Grund dafür gilt weiterhin | `/bayreuth/webdesign` (eingefroren) trägt den Anker `/webdesign-agentur-deutschland`; dessen Pillar zählt als eingehende Quelle für `/bayreuth/webdesign` (2×) und `/bayreuth/website-relaunch` (1×) |
| `/webdesign` hatte auf main **keinen** kontextuellen Shell-Link für die nationale Intention | Hero, Footer-Fließtext, ServicesSection und CityServicePage zeigten alle auf `/webdesign-agentur-deutschland` |
| Die unbedingte Relaunch-Zusage „ohne Rankingverlust" stand auf der Live-Seite | `WebdesignHub.tsx:60` vor diesem Merge |
| Das Kontaktformular reichte `state.submitted` an die Dankeseite — die es nie gelesen hat | `ContactSection.tsx:406` gegen `AnfrageErhaltenPage.tsx` vor diesem Commit |
| GA4 kannte **27 Absichtssignale und null bestätigte Leads** | alle `trackEvent(`-Aufrufe im Baum |
| Die fünf eingefrorenen Experimente sind unverändert | `src/protectedExperiments.test.tsx`, 9 Tests grün |

### Hypothese (plausibel, nicht bewiesen)

- **K2 — geteilte Kopfintention als Ursache des `/webdesign`-Einbruchs.** Zwei
  indexierbare nationale Webdesign-Seiten, beide mit Sitemap-Priorität 0,92,
  und die intern verlinkte war die andere. Das ist die stärkste verfügbare
  Erklärung für 1.756 Impressionen bis zum 30.08. und **null** ab dem 01.09.
  **Sie ist nicht bewiesen.** Ohne Google-gewählten Canonical ist eine
  Deduplizierung nicht nachweisbar, und der Repository-Verlauf zeigt für den
  26.08.–04.09. keinen Commit, der `/webdesign` berührt hätte — die Arbeit in
  diesem Fenster lag im Admin-Bereich. Ein Ursachenwechsel bei Google ist
  deshalb genauso möglich wie eine Deduplizierung.

  **K2 hat zwei Lesarten, die getrennt zu prüfen sind** und nicht miteinander
  stehen und fallen: die **Canonical-Lesart** (Google führt beide URLs als ein
  Dokument) beantwortet I1; die **Intentionslesart** (zwei getrennt indexierte
  URLs konkurrieren um dieselben Queries) beantwortet I1 **nicht** und bleibt
  auch bei übereinstimmendem Canonical offen. Sie ist nur an Query × Seite zu
  prüfen: erscheinen beide URLs für dieselben Queries?
- Ein Algorithmus-Update als Ursache wird **nicht** angenommen. Ein Datum
  allein ist kein Befund.

### Unbekannt — nicht geschätzt, nicht gefüllt

- **Google-gewählter und nutzerdeklarierter Canonical für `/webdesign`.** Der
  Connector hat beide nicht geliefert. „Submitted and indexed" beantwortet die
  Frage nicht.
- **Letzter Crawl der aktuellen Fassung.** Der bekannte Crawl ist vom
  18.08.2026 und prüft die heutige Seite nicht.
- **GA4-Empfang.** Nullwerte vom 15.08.–11.09. beweisen weder einen Defekt der
  Implementierung vom 12./13.09. noch ausbleibende Anfragen im Geschäft.
- **Backlink-Stand.** Ohne Backlink-Daten wird kein Defizit als „gemessen"
  bezeichnet.

### Zum Rückgang von 3.102 auf 2.297 Impressionen

Der Rückgang von rund 26 % zwischen den beiden Sieben-Tage-Fenstern ist **kein**
Befund über die Arbeit vom 13.09.: er liegt vollständig davor. Die
Aggregatposition verbesserte sich gleichzeitig von 47,72 auf 39,59, was auch
ein verschobener Query-Mix erklären kann. Beides bleibt unbewertet.

## 2 · Änderungs- und Messledger

| URL / Cluster | Änderung | Commit | Merge | Deploy | Wirkung | Status | Frühestes Urteil |
|---|---|---|---|---|---|---|---|
| `/webdesign` | Pillar neu (2.687 Wörter), Titel/Description neu, Priorität 0,95, „hochkonvertierend" und „ohne Rankingverlust" entfernt | `7c78c25` → `f6ada9d` | 14.09.2026 | **UNBEKANNT** | nationale Webdesign-Intention gewinnt einen Eigentümer mit Substanz | offen | Deploy + 28 d |
| `/kosten-webdesign` | Kostenseite neu, Jahreszahl raus, unbelegte Staffeln raus | dito | 14.09.2026 | **UNBEKANNT** | Preistreiber statt Fantasiepreise | offen | Deploy + 28 d |
| Shell-Linktopologie | Hero (Desktop **und** Mobile), Footer, ServicesSection, CityServicePage → `/webdesign` | dito | 14.09.2026 | **UNBEKANNT** | interne Autorität erreicht den erklärten Eigentümer | offen | Deploy + 28 d |
| `/webdesign-agentur-deutschland` | **unverändert live**, Konsolidierung aufgeschoben (F9) | — | — | — | — | BLOCKIERT durch eingefrorene Experimente | nach deren Graduierung |
| `/bayreuth`, `/muenchen`, `/regensburg` | Titel und H1 markenführend statt „Webdesign in X" | dito | 14.09.2026 | **UNBEKANNT** | nimmt den Stadt-Hubs den Kopfbegriff, den `/bayreuth/webdesign` misst | offen | Deploy + 28 d |
| `/bayreuth/lokales-seo` | Titel führt mit „SEO Bayreuth" | dito | 14.09.2026 | **UNBEKANNT** | Eigentümer der Familie „seo bayreuth" | offen | Deploy + 28 d |
| Stadt-FAQs Regensburg/München | unbelegte Fristen und Preise entfernt | dito | 14.09.2026 | **UNBEKANNT** | faktische Korrektur | **kontaminiert alle Stadtseiten-Messungen ab diesem Deploy** | — |
| `lead_submitted` | Konversionsereignis bei bestätigtem 2xx | `2e10c37` | 14.09.2026 | **UNBEKANNT** | Anfragen werden erstmals zählbar | offen | erste echte Anfrage |
| `/ki-telefonassistent` (A5) | Vorarbeit | — | 13.09.2026 | **UNBEKANNT** | — | **HALT** | Deploy + 28 d |
| `/prozessautomatisierung` | Pillar-Konsolidierung | `729e0e4` (PR #95) | 13.09.2026 | **UNBEKANNT** | — | **HALT** | Deploy + 28 d |
| `/kosten-ki-telefonassistent` | graduiert 12.09.2026 | — | 12.09.2026 | **UNBEKANNT** | — | **HALT** | Deploy + 28 d |

**Deploy-Datum ist in jeder Zeile UNBEKANNT und wird nach der Freigabe
eingetragen.** Ein Commit-Datum ist kein Deploy-Datum; der gesamte
Beurteilungskalender hängt am zweiten, nicht am ersten.

### Korrigierte Altstände

- Die Aufgabenstellung beschreibt die Recovery als „Konsolidierung von
  `/webdesign-agentur-deutschland` in `/webdesign` per 301". Das ist **nicht**,
  was der Zweig enthält, und wurde auch jetzt nicht umgesetzt.
- `/kosten-ki-telefonassistent` ist seit dem 12.09.2026 **graduiert** und kein
  eingefrorenes Experiment mehr. Ältere Notizen, die es noch als eingefroren
  führen, sind veraltet.
- Das Arzt-Experiment ist durch die Faktenkorrektur vom 11.09. kontaminiert,
  das Bayreuther Relaunch-Titelexperiment hatte eine Middleware-Diskrepanz.
  Keines von beiden ist ein sauberer Durchlauf.
- Der GSC-Wizard listet null Experimente. Die Experimente im Repository
  bestehen unabhängig davon und bleiben bindend.

## 3 · Was bewusst NICHT geändert wurde

- **Kein 301 für `/webdesign-agentur-deutschland`.** Der Pillar zählt als
  eingehende Quelle für zwei eingefrorene Routen; seine Entfernung würde deren
  gemessene Topologie kippen. Die Konsolidierung bleibt F9.
- **Keine neuen Titel für `/ki-telefonassistent`, `/kosten-ki-telefonassistent`
  oder `/kosten-automatisierung`.** Die Nachfrage ist da (164 + 77 Impressionen
  auf der Kostenseite), aber bei Ø-Position 33 ist eine niedrige CTR die
  erwartete Folge der Position, nicht ein Titelproblem. Ein Titelwechsel jetzt
  würde ein laufendes Fenster zerstören und eine Frage beantworten, die
  niemand gestellt hat.
- **`/verpasste-anrufe-verlust` (Position 11,59) und `/kosten-automatisierung`
  (Position 13,0)** sind die nächstliegenden Chancen und bleiben unberührt:
  beide tragen frische Arbeit aus dem Ledger.
- **Kein Wortzahl-Padding, keine wiederholten Stadt-Blöcke**, keine neuen
  Keyword-Varianten-Seiten.

## 4 · Übergabe an „Cogniiq SEO Autopilot"

Der bestehende Task (täglich 08:00 Europe/Rome, aktiviert) bleibt unverändert —
kein Duplikat, kein Zeitplanwechsel. Der Scheduler hat keinen nächsten Lauf
zurückgegeben; es wird keiner erfunden.

**Vor dem ersten Health-Check einzutragen:** das Deploy-Datum.

| Zeitpunkt | Prüfung | Reaktion |
|---|---|---|
| Deploy + 0 | `/webdesign`, `/kosten-webdesign`, `/anfrage-erhalten`: HTTP 200, Canonical auf sich selbst, Sitemap-Eintrag, `lead_submitted` im Browser sichtbar | technische Abweichung → sofortiger Rollback |
| Deploy + 7 | Indexierungsstatus und Crawl-Datum von `/webdesign`; erste `lead_submitted`-Ereignisse | nur Gesundheitsprüfung, **keine** Rangbewertung |
| Deploy + 14 | Impressionen `/webdesign` gegen null seit 01.09.; Impressionen `/webdesign-agentur-deutschland` | bewegt sich `/webdesign` gar nicht, ist K2 als Ursache geschwächt |
| Deploy + 28 | Vollauswertung Query × Seite gegen 15.08.–11.09. | erste zulässige Beurteilung |
| Deploy + 56 | Zweitauswertung; Entscheidung über F9 | bewegt sich nichts, greift `authority-acquisition-plan.md`, nicht die nächste Seitenüberarbeitung |

**Query-Kohorten, getrennt zu führen:** `webdesign agentur`, `website erstellen
lassen`, `webdesign kosten` / `was kostet eine website`; `seo bayreuth`
getrennt; Marken-Queries immer separat.

**Erwartete Signale, ehrlich begrenzt.** Erwartet wird, dass `/webdesign`
überhaupt wieder Impressionen zeigt und dass `lead_submitted` erstmals eine
zählbare Anfrage liefert. Eine Signifikanzaussage ist bei diesen Mengen nicht
möglich und wird nicht versprochen: **ein technischer Regress rechtfertigt
einen sofortigen Rollback, verrauschte Ranglisten allein nicht.**
Es gilt weiterhin Regel 1: keine Erfolgsmeldung vor Tag 28.

## 5 · Nur der Inhaber kann das prüfen

1. **Canonical für `/webdesign`.** Search Console → URL-Prüfung →
   `https://cogniiq.de/webdesign` → „Vom Nutzer angegebener Canonical" **und**
   „Von Google ausgewählter Canonical". Zusätzlich „Live-URL testen", weil der
   bekannte Crawl vom 18.08. ist.

   Die Prüfung klärt den **Indexzustand**, nicht die Ursache:
   - Abweichung → belegt eine **Canonical-Abweichung**, nicht die Ursache des
     Einbruchs. Das Feld nennt keinen Zeitpunkt; die Nähe zum 01.09. bleibt
     Indiz. F9 wird nach der Graduierung der Bayreuther Experimente vorgezogen,
     weil eine Abweichung ohnehin behoben gehört.
   - Übereinstimmung → schließt **nur die Deduplizierung auf Canonical-Ebene**
     aus. Eine Intentionsüberschneidung bleibt möglich: zwei getrennt
     indexierte URLs können dieselben Queries bedienen und sich Signale
     teilen, ohne zusammengeführt zu werden. K2 ist dann nur in seiner
     Canonical-Lesart erledigt — zu prüfen an Query × Seite.
2. **GA4-Empfang.** Bestätigen, dass Stream `G-NDN9J2G5LM` zur Property
   `properties/551863316` gehört. Dann im Echtzeitbericht mit erteilter
   Analyse-Einwilligung prüfen, ob `page_view` **einmal** je Seitenwechsel
   ankommt — und ob „Seitenaufrufe über Browserverlauf-Ereignisse" im Stream
   aktiviert ist. Ist sie es nicht, zählt die Single-Page-Navigation nicht,
   und **erst dann** ist ein manueller Seitenaufruf im Code gerechtfertigt.
   Ads `AW-17946397271` unberührt lassen, `G-K7BS3LKT6H` nicht reaktivieren.
3. **`lead_submitted` als Schlüsselereignis markieren.** Das Ereignis wird
   gesendet, sobald eine echte Anfrage bestätigt wird; als Conversion zählt es
   erst nach dieser Markierung in GA4. **Keine Testanfrage über das echte
   Formular abschicken** — der Endpunkt löst eine reale Bearbeitung aus.
4. **Proof-Assets.** Siehe `authority-acquisition-plan.md`; ohne sie bleibt die
   Autoritätsarbeit blockiert. Nichts davon wird erfunden.

---

# Nachtrag 15.09.2026 — Farb-Rollout und Umbruchkorrekturen als Störgrößen

Zwei Änderungen sind nach dem Messpunkt vom 14.09. dazugekommen. Beide sind
reine Darstellungsänderungen, und genau deshalb steht dieser Abschnitt hier:
**sie ändern nichts am Inhalt, aber sie können die Konversionsmessung
verschieben — und das ist nicht dasselbe.**

## Der Irrtum, den dieser Abschnitt ausräumt

Die fünf eingefrorenen Fingerabdrücke sind unverändert. Daraus folgt genau
eine Aussage: **der Inhalt ist erhalten** — Titel, Description, Canonical,
Überschriften, sichtbarer Text, JSON-LD und Anker sind identisch. Ein
Fingerabdruck liest keine Klassennamen, keine Farben und keine Umbrüche.

Daraus folgt **nicht**, dass ein Konversionsexperiment unberührt geblieben
ist. Was ein Besucher sieht und anklickt, hat sich sehr wohl geändert:

| Änderung | Warum das die Konversion berühren kann |
|---|---|
| Kontextlinks im Fließtext sind jetzt blau statt Tintenfarbe | Ein erkennbarer Link wird häufiger geklickt. Interne Klickpfade und Verweildauer können sich verschieben, ohne dass eine Seite anders rankt |
| Marker-Icons, Eyebrows, Karten-Hover und Schrittnummern tragen Akzentblau | Lenkt Aufmerksamkeit anders durch die Seite |
| `/prozessautomatisierung` war grün akzentuiert und ist jetzt blau; die primäre Handlung ist von grün auf das etablierte Schwarz gewechselt | Die auffälligste Einzeländerung. Ein Handlungsknopf, der die Farbe wechselt, ist ein klassischer A/B-Testgegenstand — hier ohne Test geändert |
| Aktiver Reiter, Navigations-Indikator, FAQ-Marker und die beiden Rechner-Schieber sind blau | Betrifft Bedienelemente, nicht nur Dekoration |
| Umbruchkorrekturen bei 320/390px | Auf neun Seiten verschwindet ein horizontaler Scrollbalken. Das ist eine **Verbesserung** der mobilen Bedienbarkeit — und damit ebenfalls eine Störgröße: eine steigende Konversion auf diesen Seiten ist danach nicht mehr eindeutig der SEO-Arbeit zuzuschreiben |

## Konsequenz für die Auswertung

1. **`lead_submitted` misst ab dem Deploy eine andere Seite als davor.** Es gibt
   keinen Vorher-Wert: Das Ereignis existiert erst seit dem 14.09. und hat noch
   nie gefeuert. Ein Vergleich „vor/nach Farbe" ist deshalb nicht möglich und
   wird auch nicht behauptet.
2. **Ranking-Auswertungen bleiben gültig.** Positionen und Impressionen hängen
   am Inhalt, und der ist unverändert — das ist die Aussage, die der
   Fingerabdruck trägt.
3. **CTR- und Konversionsbewegungen sind ab dem Deploy konfundiert.** Wer nach
   Tag 28 eine veränderte Konversionsrate sieht, kann sie nicht sauber zwischen
   Inhaltsarbeit, Farbführung und behobenem Mobil-Überlauf aufteilen. Das ist
   der Preis dafür, beides in einem Release zu bündeln, und er wird hier
   notiert statt später wegerklärt.
4. **Sauber trennbar wäre nur ein eigener Test.** Wenn die Wirkung der
   Handlungsfarbe auf `/prozessautomatisierung` wirklich interessiert, gehört
   sie in einen A/B-Test gegen die schwarze Variante — nicht in eine
   Rückrechnung aus diesem Release.

## Betroffene Seiten der Umbruchkorrektur

Gemessen über alle 87 indexierbaren Routen bei 320px und 390px.

Vorher mit horizontalem Überlauf, jetzt sauber:
`/bayreuth/webdesign` (425px bei 390 **und** 320), `/muenchen/webdesign`,
`/kosten-automatisierung`, `/webdesign-arzt`, `/deutschland`,
`/blog/webdesign-agentur-auswahl`, `/webdesign-gastronomie`,
`/webdesign-immobilien` (auch bei 390), `/webdesign-hotel`, `/webdesign-sport`,
`/ki-telefonassistent-arzt`, `/ki-telefonassistent-restaurant`,
`/ki-telefonassistent-hotel`, `/ki-telefonassistent-praxis`,
`/automatisierung-restaurant`, `/automatisierung-arzt`,
`/automatisierung-immobilien` (auch bei 390), `/automatisierung-sport`.

Die ursprüngliche Meldung nannte fünf Seiten. Der vollständige Durchlauf über
alle Routen fand **achtzehn**; die Stichprobe von sechzehn Seitenfamilien hatte
den Rest schlicht nicht berührt.

## Deploy-Datum

**Weiterhin UNBEKANNT — und wird erst eingetragen, wenn ein Deploy bestätigt
ist.** Kein Commit-Datum, kein Preview-Datum, kein Merge-Datum. Alle
Beurteilungsfenster dieses Dokuments zählen ab dem bestätigten Produktivstand.

---

# Messpunkt 17.09.2026 — Autoritätslauf

Basis-Commit `d0f2083` (main). Arbeitszweig
`claude/seo-authority-sprint-2026-09-17`. GSC-Werte laut Auftrag (Stand bis
2026-09-14, Query×Seite; in dieser Sitzung nicht selbst nachgeladen, deshalb
Snapshot ohne Klick-/CTR-Angabe):

| Query | Seite | Impr. | Ø Pos. |
|---|---|---:|---:|
| ki telefonassistent | `/ki-telefonassistent` | 153 | 32,7 |
| ki telefonassistent für unternehmen | `/ki-telefonassistent` | 21 | 29,3 |
| telefonassistent | `/ki-telefonassistent` | 57 | 36,6 |
| ki telefonzentrale | `/ki-telefonassistent` | 21 | 32,0 |
| ki telefonassistent kosten | `/kosten-ki-telefonassistent` | 175 | 30,4 |
| ki telefonassistent preise | `/kosten-ki-telefonassistent` | 18 | 20,1 |
| ki telefonassistent arztpraxis | `/ki-telefonassistent-arzt` | 145 | 33,9 |
| prozessautomatisierung agentur | `/prozessautomatisierung` | — | ~57 |
| prozessautomatisierung kundenservice | `/prozessautomatisierung` | — | ~58,6 |
| prozessautomatisierung münchen | (Cluster) | — | ~30 |
| roi der prozessautomatisierung | `/blog/prozessautomatisierung-roi` | — | 19,7 |
| roi für prozessautomatisierung | `/blog/prozessautomatisierung-roi` | — | 26,5 |
| wie berechnet man den roi der automatisierung eines geschäftsprozesses? | `/blog/prozessautomatisierung-roi` | — | ~8 |
| hotel webdesign / webdesign hotel / webdesign hotels | `/webdesign-hotel` | 158 / 92 / 32 | 19,7 / 20,4 / 18,6 |
| webdesign agentur regensburg | `/regensburg/webdesign` | 220 | 39,0 |
| webdesign regensburg | `/regensburg/webdesign` | 310 | 55,0 |
| website erstellen lassen regensburg | `/regensburg/webdesign` | 175 | 43,6 |
| webdesign agentur bayreuth | `/bayreuth/webdesign` | 49 | 26,8 |

Die HALT-Zeilen des Messpunkts 14.09. gelten unverändert; A5 und M23 wurden
**nicht** im Head oder Körper angefasst.

## Messpunkte dieses Laufs

### M9 · Blog → Eigentümer: sechs Beiträge erhalten `weiterfuehrend`

- **Änderung:** `/blog/prozessautomatisierung-roi`, `/blog/ki-automatisierung-kleine-unternehmen`,
  `/blog/digitalisierung-mittelstand` → `/prozessautomatisierung` (zwei davon
  zusätzlich → `/kosten-automatisierung`); `/blog/verpasste-anrufe-kosten` →
  `/ki-telefonassistent`, `/verpasste-anrufe-verlust`;
  `/blog/ki-telefonassistent-restaurant` → `/ki-telefonassistent-restaurant`,
  `/ki-telefonassistent`; `/blog/website-ohne-anfragen` → `/keine-anfragen-website`,
  `/webdesign`. Kein Link auf eine eingefrorene Route.
- **Hypothese:** Kontextuelle Links aus rankenden Redaktionsseiten geben dem
  Pillar Autorität, die vorher auf der Redaktionsseite endete; die Beiträge
  verlieren nichts, weil ihre Intention (informational) unverändert bleibt.
- **Erfolg (Tag 28 nach Deploy):** `/prozessautomatisierung` Ø Position der
  Kopfquery-Familie besser als vor dem Deploy; die Beiträge halten ihre
  Impressionen (±20 %).
- **Scheitern:** ein Beitrag verliert > 30 % Impressionen ohne Bewegung beim
  Pillar → Block bleibt, aber Ankertexte prüfen.
- **Störgröße:** überlagert A5 (`/ki-telefonassistent`) und M23
  (`/prozessautomatisierung`) — beide haben ab diesem Deploy zusätzliche
  eingehende Links. Bei der Auswertung Tag 28 getrennt ausweisen: Bewegung mit
  vs. ohne diese Quellen ist nicht trennbar; das wird hier notiert, nicht
  später wegerklärt.

### M10 · `/blog/prozessautomatisierung-roi` — inhaltliche Aktualisierung, Titel ohne Jahr

- **Vorher:** 530 Wörter, Titel „… berechnen 2025 | Leitfaden", keine
  kommerzielle Verlinkung. Beste Query Pos. ~8 (Frageform), Kopfquery 19,7.
- **Änderung:** vier neue Abschnitte (Kostenseite einmalig/laufend, vier
  Kostentreiber, Amortisationszeit, wann es sich nicht rechnet), eine neue
  FAQ, Titel „Prozessautomatisierung ROI berechnen | Formel, Amortisation,
  Kostenfallen", `lastmod` 2026-09-17.
- **Erfolg (Tag 28):** „roi der prozessautomatisierung" besser als 19,7;
  Frageform-Query bleibt Top 10.
- **Scheitern:** Frageform-Query fällt aus den Top 20 → Titeländerung
  zurücknehmen (Inhalt bleibt).

### M11 · Shell-Ankertext „Prozessautomatisierung"

- **Änderung:** Navigation, Desktop- und Mobile-Hero-Chip, Footer (Dublette
  entfernt). Ziel-Pfade unverändert. Außerhalb `<main>`, deshalb kein
  Fingerabdruck betroffen — die fünf eingefrorenen Baselines laufen grün.
- **Erwartung:** Entitätssignal für den Pillar auf 90 Dokumenten. Kein
  eigenes Erfolgskriterium; wird mit M23 ausgewertet.

### M12 · `/regensburg/webdesign`, `/muenchen/webdesign` — Ehrlichkeit und Pillar-Link

- **Änderung:** Szenarien ohne behauptete Ergebnisse, Ziel-Suchbegriffe nicht
  mehr wörtlich im Text, kontextueller Link auf `/webdesign`,
  „Google-Unternehmensprofil". Titel/H1/Description unverändert.
- **Erfolg (Tag 28):** „webdesign regensburg" (310 Impr., Pos. 55) und
  „webdesign agentur regensburg" (Pos. 39) nicht schlechter; „website
  erstellen lassen regensburg" (Pos. 43,6) beobachten — diese Query gehört
  laut K5 eigentlich `/regensburg/website-erstellen` (F4).
- **Scheitern:** > 5 Positionen Verlust auf beiden Kopfqueries → Text
  vergleichen, nicht zurückrollen (die entfernten Sätze waren Zusagen ohne
  Beleg und kommen nicht zurück).

### Mitgeändert, ohne eigene Messreihe

- `/kosten-ki-telefonassistent`: „10 gleichzeitige Anrufe" → „Mehrere Anrufe
  zur selben Zeit" (Faktenkorrektur laut Graduierungsvermerk; HALT-Zeile
  bleibt, weil Head, H1 und Struktur unverändert sind).
- `/blog/ki-telefonassistent-restaurant`: Description ohne „Wartelisten
  führen, Gäste nachqualifizieren – ohne Personal".
- `/deutschland`: Description ohne „hochkonvertierende Websites".

### Bewusst NICHT geändert

`/ki-telefonassistent`, `/prozessautomatisierung`, `/kosten-ki-telefonassistent`
(Head/Körper — HALT), `/webdesign`, `/kosten-webdesign`, `/webdesign-hotel`,
`/verpasste-anrufe-verlust`, `/kosten-automatisierung`, Geo-Hubs (Ledger
14.09.), `/webdesign-agentur-deutschland` (F9), alle fünf eingefrorenen
Routen, `/bayreuth` Description (M8). Keine neue Seite.

## Ledger-Ergänzung

| URL / Cluster | Änderung | Commit | Deploy | Status | Frühestes Urteil |
|---|---|---|---|---|---|
| 6 Blogbeiträge | `weiterfuehrend` auf Eigentümer (M9) | dieser Branch | **UNBEKANNT** | offen | Deploy + 28 d |
| `/blog/prozessautomatisierung-roi` | Inhalt erweitert, Titel ohne Jahr (M10) | dieser Branch | **UNBEKANNT** | offen | Deploy + 28 d |
| Shell | Ankertext Pillar (M11) | dieser Branch | **UNBEKANNT** | offen | mit M23 |
| `/regensburg/webdesign`, `/muenchen/webdesign` | Ehrlichkeit, Pillar-Link (M12) | dieser Branch | **UNBEKANNT** | offen | Deploy + 28 d |
| `/kosten-ki-telefonassistent` | Faktenkorrektur P5 | dieser Branch | **UNBEKANNT** | HALT (unverändert) | Deploy + 28 d |
