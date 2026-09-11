# COPY-SEO-CHANGELOG — Copy Overhaul KI-Telefonassistent-Cluster

## 2026-09-11 (4) — Ein Rechenkern statt vier Rechnern

Anlass: Der neue Preis- und Wirtschaftlichkeitsrechner auf
`/ki-telefonassistent` ist freigegeben. Er sollte zur Konversionsfunktion des
Clusters werden — und dafür musste zuerst der Widerspruch weg, den vier
unabhängige Rechnungen erzeugten.

**Was sich widersprochen hat.**

| Fundstelle | Widerspruch |
|---|---|
| `CostComparisonSection` | `KI_PRICE_MONTHLY = 297` — ein Festpreis, der in keiner Tarifliste steht. Daraus abgeleitet: „Ihre Ersparnis" und „Jahresersparnis" |
| `ROICalculator` + `CostComparisonSection` | 4,3 Wochen je Monat, während der Praxis-Rechner mit 4,33 rechnete |
| `ROICalculator` | `verpasste Anrufe × Ø-Umsatz = entgangener Umsatz` — jeder verpasste Anruf als verlorener Auftrag |
| `roi-presets.ts` | Frei gewählte Beispielwerte für Umsatz je Anruf, Verpasstquote und Stundensatz, vorbelegt in einem Ergebnis, das autoritativ aussieht |
| `PraxisRechnerWidget` | Eigene Tarifrechnung, eigener Mehrpreis je Minute, `betragZuZahl` (Anzeigestrings zurück in Zahlen), Vorgabewert „Automatisierungsgrad 20 %" |
| `KostenKiTelefonassistent` | `toNumber(t.monatlich)` — Angebots-Schema aus Anzeigestrings geparst |

**Was jetzt gilt.** `src/lib/telefonassistent-rechner.ts` ist der einzige
Rechenkern: Tarifwahl, Deckelung, Mehrverbrauch, Sprachaufschlag, Zeitwert,
Chancenwert, Nettoeffekt, Amortisation, Wochenfaktor. Jede öffentliche
Darstellung konsumiert ihn. `rechner-konsistenz.test.tsx` prüft beides —
die Arithmetik **und** den Quelltext, damit eine neu eingeführte Konstante
sofort auffällt statt erst im nächsten Widerspruch.

| Fläche | Vorher | Jetzt |
|---|---|---|
| `/ki-telefonassistent` | `TelefonRechner` (voll) | unverändert, plus stabiler Anker `#preis-roi-rechner` und Hero-Verweis |
| Startseite | `ROICalculator` + `CostComparisonSection` | `TelefonRechnerSection` (kompakt) + Eigenschaftsvergleich ohne eigene Rechnung |
| `/praxen` | `PraxisRechnerSection` | `TelefonRechnerSection` (voll) |
| `/kosten-ki-telefonassistent` | `PraxisRechnerSection` | **unverändert** (eingefrorenes Experiment) — Arithmetik intern auf den Kern umgestellt, gerenderte Bytes identisch |

**Produktwahrheit Automatisierung.** Der Vorgabewert „20 % Automatisierungsgrad"
war kein Zurückhalten, sondern ein Fehler: Er las sich als Aussage darüber, wie
viel Cogniiq schafft. Zugesichert ist das Gegenteil — ein konfigurierter
Routineablauf wird vollständig abgewickelt, bis zu 100 % der konfigurierten
Routineanrufe. Was schwankt, ist der Anteil der Anrufe eines Betriebs, der
überhaupt dazugehört; danach fragt der Rechner jetzt, ohne einen Wert
vorzugeben.

**Gleichzeitigkeit.** „10 gleichzeitige Anrufe" ist auf allen nicht
eingefrorenen Flächen durch eine Fassung ohne Zahl ersetzt. Begründung und
offene Inhaberfrage: OWNER-INPUT B11a.

**GA4.** Unverändert in diesem Durchgang. Der Branch trägt weiterhin
`G-K7BS3LKT6H`; die Korrektur auf `G-NDN9J2G5LM` ist in `main` noch nicht
gelandet und gehört in ihren eigenen Commit. Neu sind ausschließlich grobe
Ereignisnamen (`calculator_anchor_click`, `price_calculator_started`,
`roi_calculator_started`) — ohne jeden Eingabewert.


## 2026-09-11 (3) — Produktwahrheit korrigiert: `/ki-telefonassistent` verkaufte unter Wert

Anlass: Inhaber-Review der Preview. Die Seite beschrieb ein System, das
Terminwünsche **aufnimmt**, damit ein Mitarbeiter sie **danach erledigt**. Das
ist nicht das Produkt. Der Assistent führt konfigurierte Routineabläufe im
Gespräch zu Ende.

**Ursache.** `BOOKING_WRITE` („only after verified customer integration") war
zu defensiv ausgelegt worden — als Verbot des Wortes „buchen" statt als
Bedingung für Schreibzugriff auf ein Kundensystem. Aus einer Integrationsregel
war eine Produktbeschreibung geworden.

**Die zwei Regeln, die ab jetzt getrennt gelten** (ausgeschrieben im Block
„PRODUKTWAHRHEIT, KORRIGIERT AM 11.09.2026" in `telefonassistent-copy.ts`):

| | Status |
|---|---|
| `AUTOMATISIERTE_ABWICKLUNG` — buchen, verschieben, stornieren, Fragen beantworten | **zugesicherte Produktfähigkeit**, darf so benannt werden |
| `SYSTEM_SCHREIBZUGRIFF` — direkt in Kalender/PVS/CRM/Buchungssystem | **kundenspezifisch**, wird je Kunde eingerichtet und verifiziert |

**Korrigierte Fundstellen** (jede war eine eigene Unterverkaufsaussage):

| Stelle | Vorher | Nachher |
|---|---|---|
| `title` (Manifest + Edge) | `… – Anrufannahme \| Cogniiq` | `… – Anrufe erledigen \| Cogniiq` |
| `description` | „nimmt Anrufe an … erfasst Anliegen" | „bucht, verschiebt und storniert Termine im Gespräch" |
| H1 | „Anrufe annehmen, wenn Ihr Team keine Hand frei hat." | „Anrufe nicht nur annehmen. Anliegen erledigen." |
| Hero-Gespräch | endete mit „Mein Kollege bestätigt Ihnen den Termin." | Anrufer verschiebt im Gespräch; Ergebnis „Termin verschoben · im Gespräch erledigt" + Badge zur Anbindung |
| Dashboard-Karte | „Terminwunsch" / „Nächster Schritt: Termin bestätigen" | „Termin gebucht" / „Offen für Ihr Team: Nichts." |
| Ablauf 03/04 | „Nach Ihren Regeln entscheiden" → „Zusammenfassung & Übergabe" | „Vorgang abschließen" → „Nur die Ausnahme geht weiter" |
| Abschnitt M14 | „Die Übergabe entscheidet. Deshalb ist sie der Kern." | „Und wenn doch ein Mensch ran muss?" — als Ausnahmeweg |
| Fähigkeitenliste | „Nimmt Terminwünsche auf", „Erfasst Anliegen strukturiert" | „Bucht Termine im Gespräch", „Verschiebt Termine und schließt Absagen ab" |
| Branchenkarten | durchgehend „aufnehmen/erfassen/übergeben" | je Branche ein abgeschlossenes Ergebnis + die Ausnahme |
| Anliegen-Katalog | „aufnehmen und zur Bestätigung vorlegen" | „im Gespräch buchen", „Absagen abschließen" |
| Vertrauensstreifen | „Strukturierte Übergabe · Anliegen landen bei Ihrem Team" | „Termine im Gespräch · gebucht, verschoben oder storniert" |
| `Service`-JSON-LD | „erfasst Anliegen und Terminwünsche strukturiert" | Fähigkeit + Anbindungsbedingung in einem Satz |
| FAQ | 6 Antworten in der Erfassungslogik | auf Abwicklung gezogen; zwei neue Fragen (Sprachen, Art. 50) |

**Nicht überkorrigiert.** Kein „übernimmt jeden Anruf", kein „100 %
automatisiert", kein „funktioniert mit jeder Software", keine garantierte
Ersparnis, kein „von einem Menschen nicht zu unterscheiden". Die
Anbindungsbedingung (`ABWICKLUNG.qualifikation`) steht an jeder Stelle, an der
die Seite Schreibzugriff behauptet — im Hero-Badge, an der Fähigkeitenliste, in
der Dashboard-Fußzeile, im Branchen-Abschnittsfuß, im Kaufkriterium 2 und in
der FAQ.

**Neu auf der Seite**

- **„Ein Gespräch, kein Tastenmenü"** — natürliches Gespräch als
  Hauptunterscheidungsmerkmal, mit der Grenze: natürlich klingend UND nach
  Art. 50 erkennbar KI. Keine Täuschungsbehauptung.
- **„Was passiert, nachdem der Anrufer sein Anliegen gesagt hat"** — drei Wege
  (Erledigt · Beantwortet · Übergeben). Weg A ist optisch der Normalfall, Weg C
  bewusst leiser: Eine Gestaltung, die alle drei gleich gewichtet, hätte die
  alte Fehlrahmung wiederhergestellt.
- **Mehrsprachigkeit** als eigener Abschnitt, Zahlen ausschließlich aus `SPRACHEN`.
- **Preis- und Wirtschaftlichkeitsrechner** (siehe unten).

**Rechner.** `src/lib/telefonassistent-rechner.ts` ist reine, getestete
Arithmetik ohne React; `src/components/TelefonRechner.tsx` ist Darstellung ohne
einen einzigen Betrag als Literal. Alle Zahlen aus `TARIFE`,
`FAKTEN.mehrpreisProMinuteEur`, `SPRACHEN_PREISE`. Kein E-Mail-Gate, kein
Countdown, kein verstecktes Add-on; Rechnung läuft lokal im Browser, Eingaben
verlassen ihn nicht.

**Bewusst NICHT gerechnet**, weil die Quelle es nicht eindeutig festlegt:
der 20-%-Aufschlag für monatliche Kündbarkeit (Bemessungsgrundlage offen) und
die Frage, ob der Sprachaufschlag innerhalb der Tarif-Obergrenze liegt. Beides
erscheint als Regel im Text, nicht als Rechenweg. Unbekannte Positionen — die
kundenspezifische Anbindung — werden als „noch offen" ausgewiesen, **nie als 0**.

**Numerische Zwillinge.** `TARIFE` trägt zusätzlich `monatlichEur`,
`obergrenzeEur`, `einrichtungEur`; `FAKTEN` zusätzlich
`mehrpreisProMinuteEur`; neu `SPRACHEN_PREISE`. Rein additiv — die
Anzeigestrings sind byte-identisch geblieben, weshalb die eingefrorene
Preisseite unverändert rendert. Ein Test hält Zahl und String aneinander.

**Eingefrorene Experimente unberührt.** Fingerprint-Suite grün; die
Vorkommenszahlen der geschützten Pfade in der Seite bleiben exakt 1 und 2, alle
neuen Dateien enthalten sie gar nicht. Die Preisseite selbst wurde nicht
angefasst und bleibt Eigentümerin der Preisintention.


## 2026-09-11 (2) — `/ki-telefonassistent` als generische kommerzielle Seite neu gefasst

Anlass: Search Console, Seite `/ki-telefonassistent`, 2026-08-12 – 2026-09-08 —
**155 Impressionen, 0 Klicks, Ø Position 37,2**, verteilt auf den Kopfbegriff
(`ki telefonassistent`, `telefonassistent`, `ki telefon`) und seine Varianten
(`ki anrufassistent`, `ki telefonservice`, `ki telefonzentrale`,
`ki telefonassistent für unternehmen`, `ai telefonassistent`,
`digitaler telefonassistent`). Die Seite ist also indexiert und thematisch
verstanden — sie ist nur nicht die beste Antwort auf diese Intention.

**Befund.** Der Grund stand im Seitenkörper: Die generische Seite benutzte die
Praxis-Bausteine des Clusters mit. Ihre Überschriften handelten von
Patientinnen, vom Praxisteam und von medizinischer Triage, eine Statistik
sprach über Versicherte, der Preisabsatz rechnete „pro Praxis, nicht pro
Behandler". Für jemanden, der einen Telefonassistenten für Handwerk, Kanzlei,
Hausverwaltung oder Gastronomie sucht, war das die falsche Seite; für Google
war die dominante Entität dieser Seite „Arztpraxis" — also genau die Intention,
die die Arzt-Segmentseite und `/praxen` bereits besitzen. Drei Seiten stritten
um eine Intention und die generische Seite bediente ihre eigene nicht.

**Head — die schwerwiegendste Fundstelle.** `functions/_middleware.ts`
überschreibt den vorgerenderten `<head>` an der Edge und war für diese Route
vom Manifest abgedriftet. Ausgeliefert wurde: „… **bucht Termine direkt ins
System** … **Einsatzbereit in 7 Tagen**." Das ist eine universelle
Schreibzusage (durch `BOOKING_WRITE` seit dem 10.09.2026 ausgeschlossen) plus
die am 23.08.2026 korrigierte Frist — beides im SERP-Snippet, also vor Augen,
die dafür nicht klicken mussten. Manifest und Middleware sind jetzt wortgleich:

| Feld | Alt (Edge) | Neu |
|---|---|---|
| `title` | `KI-Telefonassistent für Unternehmen \| Nie wieder verpasste Anrufe – Cogniiq` | `KI Telefonassistent für Unternehmen – Anrufannahme \| Cogniiq` |
| `description` | `… nimmt jeden Anruf an, bucht Termine direkt ins System … Einsatzbereit in 7 Tagen.` | `… nimmt Anrufe an, beantwortet Fragen und erfasst Anliegen nach Ihren Regeln. Keine Gesprächsaufzeichnung, gedeckelte Rechnung.` |

**Produktwahrheit im Seitenkörper.** Vier weitere Fundstellen derselben Klasse
korrigiert, drei davon in Bildern statt in Sätzen — ein Screenshot behauptet
dasselbe wie ein Satz, nur schneller:

- Hero-Gesprächsbeispiel: „Eingetragen. Sie erhalten eine Bestätigung per
  E-Mail." + Fußzeile „Termin automatisch gespeichert · Kalender aktualisiert"
  → Gespräch endet mit Aufnahme des Terminwunsches und Bestätigung durch das
  Team; neu ist die Offenlegung nach Art. 50 im ersten Satz und das Label
  „Nachgestelltes Beispiel".
- Dashboard-Karte: Feld „Vereinbart" → „Terminwunsch", Fußzeile „von Ihrem Team
  zu übertragen" → „zu bestätigen".
- Ablaufschritt 03 „Termin buchen … werden geprüft und eingetragen" → „Nach
  Ihren Regeln entscheiden".
- Branchenkarten: dreimal „buchen" / „in den Kalender buchen" / „Rückrufe
  automatisch einplanen" → aufnehmen, erfassen, übergeben.
- `Service`-JSON-LD: `description` sagte „Termine bucht".

**Struktur.** 22 Abschnitte → 18, bei mehr Inhalt. Entfernt, weil doppelt oder
praxisspezifisch: Patientensicht (M20), Praxisteam (M21), Säulen als eigener
Abschnitt, der zweite CTA-Block und die sechs Einwand-Karten (deckungsgleich
mit der FAQ). Zusammengelegt: Anliegen-Katalog + Grenzen. Neu:

- **„Was ein KI-Telefonassistent ist — und was er nicht ist"** — Definition und
  vier Abgrenzungen (Mailbox, Tastenmenü, externer Telefondienst, Chatbot). Die
  Seite erklärte den gesuchten Begriff bisher nirgends.
- **„Sechs Fragen, an denen sich ein KI-Telefonassistent entscheidet"** —
  Kaufkriterien mit der eigenen Antwort daneben. Die Begründungsspalte ist die
  frühere Sektion „Warum bisherige Versuche gescheitert sind": Jedes Kriterium
  ist ein reales Scheiternsmuster. Kein Wettbewerbervergleich (§ 2.3 UWG), keine
  Vergleichsseite — die Intention „KI Telefonassistent Vergleich" wird laut
  Scoreboard bewusst nicht verfolgt.

**Konversion.** Ein primärer Weg statt vier gleichrangiger Buttons. Die
Beschriftung „Kostenlose Demo ansehen" war unzutreffend — unter
`/ki-telefonassistent/demo` steht ein Formular, mit dem ein Termin **angefragt**
wird; sie heißt jetzt „Demo-Termin anfragen". Sekundär die Telefonnummer, weil
ein Telefonprodukt einen Telefonweg verdient.

**Neue generische Copy-Bausteine** in `src/lib/telefonassistent-copy.ts`
(`WAS_IST`, `ANBIETER_CHECKLISTE`, `GENERISCH_*`) — rein additiv. Die
Praxis-Bausteine sind unverändert; keine Praxisseite ändert dadurch ein Wort.

**Messung.** `trackEvent` in `src/lib/consent.ts`: eine Funktion, geschlossener
Ereignisname, kein PII-Parameter, verworfen ohne Analytics-Einwilligung. Bis
hierher meldete keine öffentliche Seite eine Konversionshandlung.

**Eingefrorene Experimente unberührt.** Fingerprints unverändert; die
Vorkommenszahlen der geschützten Pfade in dieser Datei bleiben exakt 1 (Arzt)
und 2 (Kosten) — deshalb stehen die beiden Pfade in den Kommentaren der Seite
bewusst nicht ausgeschrieben.

**Nicht angefasst:** die sechs eingefrorenen Routen; die 28 weiteren Routen mit
Middleware-/Manifest-Drift (siehe Scoreboard, Folgearbeit); die Besitzfrage im
Arzt-Cluster; die Praxis-Bausteine der Copy-Bibliothek.


## 2026-09-11 — Claim-Integrität `/ki-telefonassistent-arzt` (eingefrorene Route)

Wahrheitskorrektur, **keine** Ranking-Maßnahme. Kein Keyword-Targeting, keine
Strukturarbeit, keine Optimierung irgendeiner Art. Genau ein Head, genau zwei
Felder.

- **Claim-Korrektur** `/ki-telefonassistent-arzt`: Manifest-Titel „Termine
  automatisch buchen" → „Terminwünsche aufnehmen"; Manifest-Description „bucht
  Termine ins System" → „erfasst Terminwünsche nach Ihren Regeln", ergänzt um
  die Bedingung „Eintrag ins Praxissystem nach geprüfter Anbindung". Damit an
  `FAKTEN.terminaufnahme` und an `BOOKING_WRITE` = **ONLY AFTER VERIFIED
  CUSTOMER INTEGRATION** (`OWNER-INPUT.md`, 10.09.2026) gebunden. Dies war die
  letzte öffentlich sichtbare Fundstelle dieser Klasse.
- **Mitgezogen** `functions/_middleware.ts`: dieselben zwei Felder, damit die
  Edge-Metadaten nicht vom Manifest abweichen. Der Head auf Netlify kommt aus
  dem Manifest; die Middleware wäre sonst eine zweite, falsche Wahrheit.
- **Baseline neu aufgenommen** `src/test/fixtures/protected-experiments.baseline.json`
  über `npm run seo:baseline` — nicht von Hand. Es bewegen sich exakt `title`,
  `description` und ein JSON-LD-Digest (der Block, der die Description
  einbettet). `textDigest`, `textLength`, `h1`, `headings`, `outgoingLinks` und
  alle `inboundOccurrences` sind unverändert. Der Guard ist unangetastet: Die
  Route steht weiterhin in `PROTECTED_EXPERIMENT_PATHS`.
- **Experiment kontaminiert.** Die Route ist ein laufendes, eingefrorenes
  Experiment; der geänderte Head macht jede Bewegung ab dem 11.09.2026
  unzuordenbar. Das wird nicht weggeschrieben: Wortlaut alt/neu, Begründung,
  Umfang und Konsequenz für die Auswertung stehen in
  `docs/seo/organic-growth-scoreboard.md` → „Kontamination
  `/ki-telefonassistent-arzt` (2026-09-11)".
- **Nicht angefasst:** Seitenkörper, H1, Tagline, FAQ, JSON-LD-Quelltext,
  interne Links, Ankertexte, `keywords`, Sitemap-Eintrag und `lastmod` dieser
  Route; die übrigen fünf eingefrorenen Routen; die offene Besitzfrage
  `/ki-telefonassistent-arzt` vs. `/praxen` vs. `/ki-telefonassistent-praxis`;
  `/automatisierung-restaurant` und `/keine-terminbuchung-online` (SMS/E-Mail,
  weiterhin Inhaber-Entscheidung).
- **Keine** neue URL, keine Sitemap-Änderung.

## 2026-09-10 (2) — GSC-Auswertung: Hotellerie-Intent, Titel-Deckung, Claim-Nachzügler

Grundlage: zwei echte Search-Console-Exporte (3 Monate 2026-06-09–2026-09-08,
28 Tage 2026-08-12–2026-09-08), am selben Tag an die Sitzung angehängt. Zahlen,
Attributionsgrenzen und Messpunkte in `docs/seo/organic-growth-scoreboard.md`.

- **Geändert** `/webdesign-hotel`: Titel und Description im Manifest und in der
  Seiten-Config auf „Internetagentur für Hotellerie" gezogen; Tagline ergänzt;
  neuer Problem-Abschnitt „Die allgemeine Webagentur kennt die Buchungsstrecke
  nicht"; Lösungsabsatz um die Betriebstypen (Stadt-/Business-, Boutique-/Land-,
  Pension/Gästehaus, Ferienwohnung) erweitert; zwei FAQ-Einträge zur
  Agenturauswahl und zur Betriebsgröße. Anlass: rund 480 Impressionen je 28 Tage
  auf Agentur-/Hotellerie-Queries (Pos. 27–69), die die Seite inhaltlich nicht
  bediente.
- **Geändert** `/verpasste-anrufe-verlust`: Manifest-Titel auf „Verpasste
  Anrufe: Was sie Unternehmen wirklich kosten" — Deckung der Kopf-Query
  „verpasste anrufe kosten unternehmen" (Pos. 11,2; eine der besten
  kommerziellen Nicht-Marken-Platzierungen der Domain — nicht die beste,
  siehe Scoreboard M2).
  Seiten-Config auf denselben Wortlaut gezogen. Wirksam ist ausschließlich das
  Manifest: Der Prerenderer schreibt den Head daraus, und `PageSEO.tsx:104`
  liest im Client `routeMetadata?.title ?? titleProp` — das Manifest gewinnt
  also auch nach der Hydration. Ein abweichender Wert in der Seiten-Config wäre
  toter Code gewesen, kein sichtbarer Fehler; angeglichen wurde er, damit
  niemand ihn später für die wirksame Stelle hält.
- **Claim-Korrektur** `/verpasste-anrufe-verlust`: `solution.bullets` enthielt
  weiterhin „Termine automatisch in den Kalender eingetragen" — Nachzügler aus
  dem Durchgang vom selben Tag, der nur `solution.text` derselben Seite
  korrigiert hatte. Bedingung an `FAKTEN.terminaufnahme` angeglichen:
  geschrieben wird erst, wenn die Schnittstelle es **nachweislich trägt**
  (`BOOKING_WRITE` = nur nach geprüfter Kundenintegration). Bewusst nicht
  „wenn die Schnittstelle geprüft ist" — das wäre auch von einer Prüfung
  erfüllt, die negativ ausfällt. Einschränkung: Die Seite importiert
  `telefonassistent-copy.ts` nicht, der Satz ist eine Paraphrase ohne Guard.
  Eine Bindung wie in `GRENZEN` wäre die saubere Lösung und gehört beim
  nächsten Anfassen dieser Seite nachgezogen.
- **Nicht angefasst:** die sechs eingefrorenen Routen und ihre eingehenden
  Linkzahlen; `/webdesign-gastronomie` (bewusst, damit die Hotel-Änderung
  zurechenbar bleibt); `/automatisierung-restaurant` und
  `/keine-terminbuchung-online` (SMS/E-Mail — wartet auf Inhaber-Entscheidung, siehe
  `COPY-CLAIMS-TO-VERIFY.md`).
- **Keine** neue URL. Keine Sitemap-Änderung (90 indexierbare URLs unverändert).

## 2026-09-05 — Zahnarzt-Fachbeitrag, Blog-Neuausrichtung, Linkpfade

- **Neu** `/ki-telefonassistent-zahnarztpraxis` (indexierbar, Sitemap
  lastmod 2026-09-05): operativer Fachbeitrag mit Anrufanlass-Katalog und Regel je
  Anlass, Behandlungszeit-Mustern, Absage-Regeln, zahnärztlichen Prüffällen,
  Grenzen. Article-Schema mit derselben verantwortlichen Person wie im
  sichtbaren Kasten; **kein** FAQ-Schema. Breadcrumb auf `/praxen`.
- **Geändert** `/blog/ki-telefonassistent-arztpraxis`: Titel/Description in
  Manifest und `blog-data.ts` ohne Jahreszahl; unbelegte Aussagen entfernt;
  Anliegenliste auf `ANLIEGEN_UEBERNIMMT`-Wortlaut; Notfall-Antwort auf
  `GRENZEN`-Wortlaut; Block „Weiterführend" (`/praxen`,
  `/ki-telefonassistent-einfuehren`); `updatedAt`/`lastmod` 2026-09-05.
- **Geändert** `/praxen`: dritte Karte „Zahnarztpraxen" im Wegweiser;
  kontextueller Verweis auf den Einführungsleitfaden unter dem
  Anliegen-Katalog.
- **Geändert** Footer: Spalte „Wissen" um „Leitfäden für Praxen" (Einführung,
  Zahnarztpraxis) ergänzt.
- **Blog-Datenmodell:** optionales Feld `weiterfuehrend` in `BlogArticle`,
  gerendert ohne Bewegungs-Wrapper (crawlersichtbar).
- **Guard:** `test-prerender-output.mjs` §10 — jede indexierbare Seite braucht
  einen Inbound-Link von einer anderen vorgerenderten Seite; Seiten mit
  ausschließlich Shell-Links werden protokolliert.
- **Nicht angefasst:** die sechs eingefrorenen Routen; kein neuer Link auf
  `/ki-telefonassistent-arzt` oder `/kosten-ki-telefonassistent`.


Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Regelbasis: Brief §8 (SEO erhalten und stärken). URLs, Canonicals, Redirects,
Schema-Typen und Routing wurden nicht verändert.

## 1. `/ki-telefonassistent` (Service-Hauptseite)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "Jeder Anruf beantwortet. Kein Kunde verloren." | "Erreichbar, wenn niemand abnehmen kann. Ein KI Telefonassistent, zugeschnitten auf Ihren Betrieb." |
| Title | "KI Telefonassistent für Unternehmen \| Cogniiq" | "KI Telefonassistent – individuell konfiguriert \| Cogniiq" (56 Z.) |
| Description | "…Beantwortet Anrufe automatisch… Jetzt kostenlose Demo buchen." | "KI Telefonassistent mit Ihren Ansagen, Ihren Regeln und strukturierter Übergabe an Ihr Team. Feste monatliche Kosten, kein Systemwechsel, DSGVO-konform." (~152 Z.) |

- Keyword erhalten: ja — "KI Telefonassistent" jetzt auch in der H1 (vorher nur im Title).
- Schema: Service + FAQPage + HowTo erhalten; HowTo von 4 auf 5 Schritte (geteiltes Prozessmodul), FAQPage folgt den neuen FAQ-Inhalten.
- Neue Sektionen: "Warum bisherige Versuche gescheitert sind", "Anliegen-Katalog".
- Interne Links: unverändert erhalten (Branchen-, Stadt- und Themenspalten, ≥ 12 Links).
- Statistik: 1 (GKV-Spitzenverband 2025, Quelle sichtbar). Vorher: unbelegte "Viele"-Kachel.

## 2. `/ki-telefonassistent-arzt` (Segment Arztpraxis)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "KI Telefonassistent für Arztpraxen" | unverändert |
| Title | "KI Telefonassistent für Arztpraxen \| Automatische Terminbuchung \| Cogniiq" (~72 Z.) | "KI Telefonassistent Arztpraxis – Terminannahme \| Cogniiq" (56 Z.) |
| Description | "…DSGVO-konform mit AVV… Entlastung für das Praxisteam ab Tag 1." | "KI Telefonassistent für Arztpraxen: Terminwünsche, Stornierungen und Rezeptbestellungen strukturiert aufnehmen – zugeschnitten auf Ihre Praxis, DSGVO-konform." (~156 Z.) |

- Keyword erhalten: ja ("KI Telefonassistent Arztpraxis" vorn im Title, H1 unverändert).
- Keywords-Feld: "automatische Terminbuchung Arzt / KI Rezeptionistin" ersetzt durch semantische Varianten (Telefonannahme Arztpraxis, telefonische Erreichbarkeit Praxis).
- Interne Links: unverändert (5 Stadt-, 5 Themen-Links).
- Entfernte Zahlen: 30–80 Anrufe/Tag, 3–5 Minuten pro Anruf, 40 Termine, 2-Sekunden-Annahme, 7–14-Tage-Zusage.
- Statistik: 1 (GKV-Spitzenverband 2025, Quelle sichtbar).

## 3. `/ki-telefonassistent-praxis` (Segment Therapie)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "KI Telefonassistent für Therapeuten & Praxen" | unverändert |
| Title | "KI Telefonassistent für Therapeuten & Praxen \| Automatisierte Terminbuchung \| Cogniiq" (~85 Z.) | "KI Telefonassistent für Therapiepraxen \| Cogniiq" (48 Z.) |
| Description | "…keine verpassten Patienten mehr." | "KI Telefonassistent für Physio-, Ergo- und Logopädie-Praxen: erreichbar bleiben, während Sie behandeln. Terminwünsche strukturiert erfasst, DSGVO-konform." (~153 Z.) |

- Keyword erhalten: ja. Interne Links unverändert.
- Absolutversprechen entfernt ("kein verpasster Patient mehr", "verhindert No-Shows zuverlässig", "vollständig automatisieren").

## 4. `/kosten-ki-telefonassistent` (Preisseite)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "Was kostet ein KI Telefonassistent?" | unverändert |
| Title | "Was kostet ein KI Telefonassistent? Preise & Kosten \| Cogniiq" (~61 Z.) | "Was kostet ein KI Telefonassistent? Preise \| Cogniiq" (52 Z.) |
| Description | "…Transparente Preisübersicht… KI Anrufbeantworter Kosten für Arztpraxen, Gastronomie und Mittelstand." | "Was kostet ein KI Telefonassistent? Feste monatliche Kosten statt Abrechnung pro Anruf: Preisstaffeln, Einflussfaktoren und Beispielkonfigurationen im Überblick." (~158 Z.) |

- Seite führt jetzt mit Planbarkeit (fester Monatsbetrag) statt mit Kosteneffizienz-Behauptung.
- Beispielprojekte → "Beispielkonfiguration: …" ohne Ergebnisbehauptungen (vorher als reale Kundenfälle lesbar).
- Entfernt: ROI-in-Wochen-Behauptung, Gehaltsvergleich (1.500–2.000 €), "Kunden bestellen selten ab", "unbegrenzte Anrufe".
- FAQPage-Schema folgt den neuen FAQ; Preisstaffeln (Offer-Schema) unverändert in Struktur, Beträge beibehalten (→ COPY-CLAIMS-TO-VERIFY.md).
- Interne Links unverändert.

## 5. `/bayreuth/ki-telefonassistent` (Stadtseite)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "KI Telefonassistent in Bayreuth" | unverändert |
| Title | "KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme \| Cogniiq" (~68 Z.) | "KI Telefonassistent Bayreuth – Anrufannahme \| Cogniiq" (53 Z.) |
| Description | "…DSGVO-konform, auch außerhalb der Öffnungszeiten, Einrichtung in 7–14 Tagen." | "KI Telefonassistent für Betriebe in Bayreuth: Anrufannahme mit Ihren Ansagen und Regeln, strukturierte Übergabe an Ihr Team, Betreuung vor Ort. DSGVO-konform." (~157 Z.) |

- Stadtname: von >25 Nennungen im Body auf natürliche Nutzung reduziert (§8.3).
- Lokale Substanz erhalten: Oberfranken, Festspielzeit, Hauptsitz Bayreuth, Umland-Handwerk.
- Entfernt: "montags über 80 Anrufe vor 9 Uhr" (erfunden), "nahtlos", "vollautomatisch", "kein verpasster Anruf/Auftrag mehr", Stimme "kaum von Mensch zu unterscheiden".
- Prozess-Schritte jetzt aus geteiltem Modul (zulässige Duplikation nach Brief §7.3).
- Interne Links unverändert (Städte untereinander + Services in der Stadt + Hauptseite über Komponente).

## 6. `/regensburg/ki-telefonassistent` (Stadtseite)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "KI Telefonassistent in Regensburg" | unverändert |
| Title | "KI Telefonassistent Regensburg – AI Rezeption & Anrufannahme \| Cogniiq" (~70 Z.) | "KI Telefonassistent Regensburg – Anrufannahme \| Cogniiq" (55 Z.) |
| Description | "…Auch außerhalb der Öffnungszeiten, DSGVO-konform, Einrichtung in 7–14 Tagen." | "KI Telefonassistent für Praxen, Gastronomie und Betriebe in Regensburg: Anrufannahme mit Ihren Ansagen und Regeln, strukturierte Übergabe. DSGVO-konform." (~153 Z.) |

- Lokale Substanz erhalten: Uniklinikum-Umfeld, UNESCO-Altstadt, Tourismus, Landkreis.
- Entfernt: "60–80 Anrufe vor 8:30 Uhr" (erfunden), "Kein Anruf geht verloren" (absolut), "übernimmt die Terminvergabe vollständig"; Superlativ "einer der meistbesuchten Städte" abgeschwächt.
- Dialekt- und Tourismussaison-FAQ erhalten und ehrlich umformuliert.

## 7. `/muenchen/ki-telefonassistent` (Stadtseite)

| Element | Vorher | Nachher |
|---|---|---|
| H1 | "KI Telefonassistent für Unternehmen in München" | unverändert |
| Title | "KI Telefonassistent München – AI Rezeption & Telefonservice \| Cogniiq" (~70 Z.) | "KI Telefonassistent München – Telefonservice \| Cogniiq" (54 Z.) |
| Description | "…mehrsprachig, DSGVO-konform. Ohne Münchner Agentur-Overhead." | "KI Telefonassistent für Unternehmen in München: Anrufannahme mit Ihren Ansagen und Regeln, mehrsprachig möglich, strukturierte Übergabe. DSGVO-konform." (~150 Z.) |

- Wettbewerbs-Seitenhiebe entfernt ("Münchner Agenturpreise", "Büroräume in der Maximilianstraße", "anonyme Massenanbieter" auf Bayreuth-Seite) — UWG-konforme Musterbeschreibung statt Herabsetzung.
- Mehrsprachigkeits-Aussage vereinheitlicht: "möglich, üblicherweise Deutsch und Englisch" (vorher widersprüchlich "Standard" vs. "auf Anfrage").
- Lokale Substanz erhalten: Schwabing, Maxvorstadt, Oktoberfest/Messen, internationales Publikum, Remote-Betreuungshinweis (locationNote) unverändert.

## Pass 2 — Metadaten-Änderungen (Ehrlichkeits-Audit & Vertrauensebene)

Vorher-Werte aller Zeilen: siehe `SEO-BASELINE.md`. H1s und Canonicals blieben
in Pass 2 unverändert, außer wo genannt.

| Route | Element | Änderung |
|---|---|---|
| `/` | Description (PAGE_META → OG + JSON-LD) | „Kein Anruf geht verloren. Go-Live in 7–14 Tagen." → „…Erreichbar auch außerhalb der Öffnungszeiten." |
| `/` | Hero-H1 (sichtbar) | „Kein Anruf mehr verpasst. Kein Lead verloren." → „Erreichbar, wenn niemand frei ist. Auch nachts. Auch samstags." |
| `/leistungen` | Description | „…jeden Anruf beantwortet … eliminiert" → begrenzte Formulierung |
| `/ki-telefonassistent-hotel` | Description | Absolutversprechen entfernt („Keine verpassten Direktbuchungen mehr") |
| `/ki-telefonassistent-restaurant` | Description | Absolutversprechen entfernt („Kein verpasster Tisch mehr") |
| `/bayern/ki-telefonassistent` | Description | „Made for Mittelstand" (engl.) und Automatik-Absolutheit entfernt |
| `/ki-telefonassistent/demo` | Description | Verknappungsmuster „Jetzt Demo-Termin sichern" entfernt |
| `/muenchen/webdesign` | Title + Description | „ohne Agentur-Overhead"-Jab entfernt (UWG) |
| `/automatisierung-immobilien` | Description + H1-nahe Zeile | „Kein Lead geht mehr verloren – vollautomatisch" begrenzt |
| `/ki-telefonassistent`, Segment- & Stadtseiten | Sichtbare Struktur | Neue Sektionen M15/M16/M20/M21; M13-Slot asset-gated (kein DOM-Knoten ohne Audio) — kein Schema-Markup für verborgene Slots |

Schema-Hinweis: Es wurde **kein** Schema für unsichtbare oder asset-gated
Inhalte ergänzt (Brief II §7.1). FAQPage-Schemata folgen automatisch den
korrigierten sichtbaren FAQ-Texten (FAQSection, CostPage, Seiten-Configs).

## Gesamtbilanz

- 7 Seiten umgeschrieben, 0 URLs/Canonicals/Slugs verändert, 0 Schema-Typen entfernt.
- Alle Title ≤ 60 Zeichen, alle Descriptions 140–158 Zeichen, aktiv formuliert.
- Interne Verlinkung vollständig erhalten; jede Seite ≥ 3 interne Links mit beschreibenden Ankern.
- Semantische Keyword-Varianten ergänzt: Telefonannahme, telefonische Erreichbarkeit, Anrufannahme, Praxisempfang.
- Statistiken: ausschließlich aus der freigegebenen Liste, je Seite max. 1, immer mit Quelle und Jahr sichtbar.

---

# Pass 3 — Beweiskette, Preise, Keyword-Erhalt (ab 17.08.2026)

Stehende Regel dieses Passes: **Das Suchwort bleibt, die Behauptung geht.**
Vor jeder Änderung an H1, Title, Description oder H2 wird geprüft, welches
Suchwort dort steht; verloren gehen darf keines.

## Stufe 1 · `/praxen`

| Element | Vorher | Nachher | Keyword erhalten |
|---|---|---|---|
| H1 | „Am Tresen steht eine Patientin. Und das Telefon klingelt trotzdem." | unverändert | — (bewusst keywordfrei, Wiedererkennung geht vor) |
| Title | „KI Telefonassistent für Praxen – Ihr Empfang \| Cogniiq" (55) | unverändert | ja |
| Description | „…mit Ihren Ansagen, Ihren Regeln … Keine Triage, feste monatliche Kosten." | „…Ihre Stimmauswahl, Ihre Regeln, strukturierte Übergabe. Keine Triage, Kontingent mit Obergrenze, Go-live in 7 Tagen." (156) | ja |
| Manifest | `publicRoutes.ts` synchron nachgezogen | | |

Neue H2 als echte Suchfragen (SEO-Regel 2): „Was es kostet, wenn niemand
abnehmen kann" (M2) · „Und wer tippt das dann bei Ihnen ein?" (M14) ·
„Einrichtung Ihres Empfangs" (M17) · „Wer sich kümmert, wenn Sie etwas ändern
wollen" (M18) · „Zuerst die Obergrenze, dann der Preis" (M10) · „Wie Sie wieder
herauskommen" (M19) · „Was Ihr Datenschutzbeauftragter wissen will" (M7).

Interne Links: 4 ausgehend (Kosten, Arzt, Therapie, Service) plus drei
Stadtseiten. Schema: `Service` + `FAQPage` (7 Fragen statt 4) +
`BreadcrumbList`. Kein Markup für den ungerenderten Stimmproben-Slot.

## Stufe 2 · `/kosten-ki-telefonassistent`

| Element | Vorher | Nachher | Keyword erhalten |
|---|---|---|---|
| H1 | „Was kostet ein KI Telefonassistent?" | unverändert | ja |
| Title | „KI-Telefonassistent Kosten – Was kostet ein AI Rezeptionist? \| Cogniiq" (70) | „Was kostet ein KI Telefonassistent? Preise \| Cogniiq" (52) | ja — „KI Telefonassistent Kosten/Preise" bleibt; „AI Rezeptionist" entfällt (siehe unten) |
| Description | „Transparente Preisübersicht … ROI-Berechnung … für Praxen, Restaurants und Dienstleister?" | „Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung, Einrichtung und Go-live-Garantie." (157) | ja |

**Gemeldeter Keyword-Verlust (SEO-Regel 1):** Der alte Title enthielt „AI
Rezeptionist". Der Begriff fällt aus Title und Description, weil der Title
sonst über 60 Zeichen läge und weil die Seite nach Positionierung Option B auf
Praxen zugeschnitten ist. „AI Rezeptionist" bleibt im `keywords`-Feld des
Manifests und im `BUSINESS_INFO`-Text erhalten. **Zur Entscheidung des
Inhabers:** Soll der Begriff im Title bleiben, geht dafür „Preise" verloren.

Zweiter, kleinerer Verlust: Die Seite adressiert jetzt Praxen statt
„Praxen, Restaurants und Dienstleister". Restaurant- und Hotel-Suchanfragen
laufen weiterhin über `/ki-telefonassistent-restaurant` und
`/ki-telefonassistent-hotel`, die in den Industrie-Links verlinkt bleiben.

Neue H2 als Suchfragen: „Welcher Tarif passt zu wie vielen Anrufen?" ·
„Wofür zahlen Sie die Einrichtung?" · „Können Sie den Empfang vorher testen?" ·
„Was kostet eine weitere Sprache?" · „Was nicht extra kostet".

Interne Links: 4 ausgehend, `/praxen` als Hub im Breadcrumb und im
Weiterlesen-Block. Schema: `Service` mit **6 Offers** (3 Tarife als
`UnitPriceSpecification` monatlich, 3 Einrichtungen als einmalige
`PriceSpecification`) + `FAQPage` (7 Fragen) + `BreadcrumbList`.
Die Deckelung steht bewusst **nicht** im Schema — sie ist bedingt und wäre dort
nur als nackter Preis darstellbar, also unehrlicher als der sichtbare Text.

## FAQ-Fragen: Keyword erhalten, Behauptung entfernt

| Vorher | Nachher | Orte |
|---|---|---|
| „Ist der KI Telefonassistent DSGVO-konform?" | „Worauf müssen Sie bei DSGVO und KI Telefonassistent achten?" | Serviceseite, 3 Stadt-Configs |
| „Ist das für Gesundheitsdaten in Therapiepraxen DSGVO-konform?" | „Worauf müssen Sie bei DSGVO und Gesundheitsdaten in Therapiepraxen achten?" | Therapieseite |
| „Ist das System DSGVO-konform für den Einsatz in Deutschland?" | „Worauf müssen Sie bei DSGVO und KI-Telefonie in Deutschland achten?" | Bayern-Seite |

Die Antworten nennen zuerst die vier Punkte, die der Leser bei **jedem**
Anbieter abfragen sollte, danach die fünf freigegebenen Aussagen über Cogniiq.

## Entfernt

`src/lib/seo-metadata.ts` — toter Code ohne Importeure, erzeugte ungeprüfte
Title- und Description-Vorlagen. Siehe `HONESTY-AUDIT.md` §7.2 Nr. 7.

## Stufe 3 · Praxis-Rechner

Neue Komponenten, keine Routenänderung. Eingebunden auf `/praxen` (nach dem
Preisblock M10) und auf `/kosten-ki-telefonassistent` (nach „Was nicht extra
kostet", vor der FAQ).

| Element | Wert |
|---|---|
| H2 | „Was spart eine Praxis durch einen KI Telefonassistenten?" — Suchfrage statt „ROI-Rechner" |
| Schema | **keines.** Berechnete Werte sind keine Produktaussagen |
| Zahlen | ausschließlich aus `TARIFE`; keine Zahl zweimal im Code |
| Prerender | Überschrift, Einleitung, Rahmung und PVS-Hinweis stehen statisch im HTML; nur das interaktive Widget liegt in einem eigenen Chunk |

Titles und Descriptions beider Seiten unverändert — der Rechner ergänzt Inhalt,
er ersetzt keine Metadaten.

Der Rechner auf der Startseite (`ROICalculator`) bleibt branchenübergreifend
und behält seine Metadaten; korrigiert wurden dort nur die vier Verstöße gegen
`COPY-BRIEF-3` §1 (siehe Commit-Nachricht).

## Stufe 4 · `/integrationen`

Route und Metadaten unverändert indexierungsseitig: `indexable: false` bleibt.

| Element | Vorher | Nachher |
|---|---|---|
| H1 | „Anbindung an Ihr System" | unverändert |
| Title | „Anbindungen an Ihr System \| Cogniiq" | „Anbindung an Ihr System \| Cogniiq" (Singular, konsistent mit H1) |
| Description | „…Die verifizierte Übersicht folgt an dieser Stelle." | „Was nach einem Anruf passiert, was wir für Ihr System prüfen — und was wir nicht behaupten: eine fertige Standardanbindung an Praxissysteme gibt es nicht." (154) |

Aus dem Grundgerüst wird eine Seite mit Substanz: drei Abschnitte, alle mit
derselben H2-Größe, alle als echte Suchfrage formuliert — „Was passiert nach
einem Anruf?" · „Lässt sich das an mein System anbinden?" · „Gibt es eine
fertige Anbindung an mein Praxisverwaltungssystem?". Dazu drei FAQ und vier
interne Links, `/praxen` als Hub im Breadcrumb.

Keine PVS-Namen. Schema: `WebPage`, `BreadcrumbList`, `FAQPage` — bei noindex
ohne Ranking-Wirkung, aber konsistent mit dem sichtbaren Inhalt.

Freischaltbedingungen für den Index stehen in `ASSETS-REQUIRED.md` §B1.

## Stufe 5 · `/datenschutz-sicherheit`

`indexable: false` bleibt.

| Element | Vorher | Nachher |
|---|---|---|
| H1 | (Grundgerüst) | „Datenschutz und Sicherheit" |
| Title | „Datenschutz & Sicherheit – die Prüfpunkte \| Cogniiq" | unverändert |
| Description | „…AVV, Schweigepflicht, Speicherung, **Hosting**, KI-Transparenz." | „Was beim Praxis-Empfang gilt, was Ihr Datenschutzbeauftragter uns fragen sollte und was wir nicht behaupten. Keine Aufzeichnung, kein Training." (143) |

Das Wort „Hosting" fällt aus der Description — es kündigte eine Aussage an, die
die Seite nicht machen darf.

Drei gleichrangige Abschnitte, H2 als Suchfrage: „Was passiert mit dem, was am
Telefon gesagt wird?" · „Was fragt Ihr Datenschutzbeauftragter — und was
bekommt er von uns?" · „Ist der Empfang DSGVO-konform?". Dazu vier FAQ und
vier interne Links, darunter erstmals ein Verweis auf die rechtliche
`/datenschutz`-Seite zur Abgrenzung.

Freischaltbedingungen in `ASSETS-REQUIRED.md` §B2 — anders als bei
`/integrationen` sind alle vier Punkte nötig, nicht einer.

## Stufe 6a · Service-Seite `/ki-telefonassistent`

Title, Description und H1 unverändert — die Angleichung betrifft die Struktur,
nicht die Metadaten.

Reihenfolge nach der Beweiskette gesetzt, mit `/praxen` als Referenz. Neu:
M4 (Säulen), M18 (Betreuung), M10 (Preislogik **ohne Beträge** — die Tarife
sind auf Praxen zugeschnitten, diese Seite ist branchenübergreifend), M19
(Umkehrbarkeit), M7 (Datenschutz). Verschoben: M13 von Position 2 auf 5,
M16 hinter M19.

Zwei inhaltliche Korrekturen im Übergabe-Abschnitt:
- „…wenn das Ergebnis **ohne Abtippen** bei Ihrem Team ankommt" und
  „Automatische Weiterleitung an Ihr Team" → ersetzt durch M14, das den
  tatsächlichen Weg beschreibt.
- Das Beispiel-Protokoll war nicht als Beispiel gekennzeichnet, nannte einen
  erfundenen Namen und behauptete „Kalender aktualisiert · Team
  benachrichtigt" → Label „Beispiel eines Dashboard-Eintrags", Hinweis
  „Nachgestelltes Beispiel, kein echter Anruf", Name generalisiert, die
  Automatik-Zeile ersetzt durch „Eintrag im Dashboard · von Ihrem Team zu
  übertragen".

Neue interne Links: `/kosten-ki-telefonassistent`, `/datenschutz-sicherheit`.

## Stufe 6b · Stadtseiten — Faktenkorrekturen (Beweiskette zurückgestellt)

| Befund | Stellen | Korrektur |
|---|---|---|
| „Einrichtung dauert in der Regel 7–14 Tage" — widerspricht der 7-Tage-Garantie | 4 | aus `FAKTEN.goLive` |
| „Ihre Rufnummer bleibt, Ihre Telefonanlage bleibt" (B4 unbeantwortet) | 1 | „Ihre Anrufe werden auf den Assistenten umgeleitet" |
| Lokale Superlative ohne Beleg | 5 | neutralisiert, siehe unten |

Neutralisiert: „gehört zu den wachstumsstärksten Städten Bayerns" →
Universitätsstadt mit Uniklinikum und Welterbe-Altstadt (alles belegbar) ·
„einer der dichtesten Dienstleistungsmärkte Deutschlands" (2×) → beschreibende
Formulierung ohne Superlativ · „dichter Besatz an Praxen" und „Dichte an
Praxen hoch" → neutral. Verifizierbare lokale Fakten (UNESCO-Welterbe,
Universität, Uniklinikum, Oberfranken) bleiben.

**Unique-Anteil gemessen** (Satzvergleich über das vorgerenderte HTML, mit
normalisiertem Stadtnamen, damit reines Austauschen nicht als unique zählt):

| Seite | vorher | nach den Korrekturen |
|---|---|---|
| Bayreuth | 70,8 % | 69,7 % |
| Regensburg | 70,5 % | 69,5 % |
| München | 73,0 % | 72,9 % |

Die vollständige Beweiskette ist **zurückgestellt** — Begründung in der
Rückmeldung an den Inhaber: Sie brächte 9.711 Zeichen geteilten Text je Seite
und drückte alle drei unter die 40-%-Schwelle (38,5 / 37,4 / 39,0 %).

## Stufe 6c · Stadtseiten — Kompaktfassungen (Option A)

Title, Description und H1 der drei Seiten unverändert. Die Änderung betrifft
den Seitenkörper, nicht die Metadaten — die Ketten aus HONESTY-AUDIT §7.1
mussten deshalb nicht angefasst werden.

### Was dazugekommen ist

Ein Abschnitt „Preis, Vertrag und Datenschutz — kurz gefasst" mit vier
Kompaktfassungen, in der Reihenfolge der Beweiskette (COPY-BRIEF-3 §2):

| Modul | Vollversion | Kompaktfassung auf der Stadtseite | Verweis |
|---|---|---|---|
| M4 Säulen | vier Absätze | die vier Titel als Zeilen | `/praxen` |
| M10 Kosten | Absatz mit Einrichtung und Preisgarantie | `FAKTEN.deckelung`, zwei Sätze | `/kosten-ki-telefonassistent` |
| M19 Umkehrbarkeit | vier Fakten plus Vetorecht | Laufzeit und Kündigung | `/praxen` |
| M7 Datenschutz | sechs Punkte | die drei belegbaren Punkte | `/datenschutz-sicherheit` |

Die Fassungen stehen als `KOMPAKT_*` in `src/lib/telefonassistent-copy.ts` und
leiten sich aus `SAEULEN`, `FAKTEN`, `UMKEHRBARKEIT` und `DATENSCHUTZ_PUNKTE`
ab — kein eigener Fließtext, damit keine zweite Wahrheitsquelle entsteht. Der
Guard-Test deckt jetzt zusätzlich `CityServicePage.tsx` und
`TelefonassistentKompaktSection.tsx` ab.

Platzierung nach dem lokalen Teil und vor dem FAQ: Die Stadtseite beginnt
lokal, die Tiefe liegt auf `/praxen`. Drei neue interne Links je Stadtseite.

**Abweichung von der Vorgabe, bewusst:** M4 ist mit vier Zeilen umgesetzt, nicht
mit drei. P1–P4 tragen zusammen die Positionierung; eine Säule wegzulassen
hätte Information entfernt statt sie zu verkürzen. Verkürzt sind die
Beschreibungen, nicht die Zahl der Säulen.

### Unique-Anteil, gemessen

Satzvergleich über das vorgerenderte HTML, Stadtname normalisiert, damit reines
Austauschen nicht als unique zählt. Beide Spalten mit demselben Skript gemessen
(die Werte aus Stufe 6b stammen aus einer anderen Tokenisierung und sind nicht
direkt vergleichbar).

| Seite | ohne Kompaktblock | mit Kompaktblock | Differenz |
|---|---|---|---|
| Bayreuth | 66,7 % | **58,7 %** | −8,0 pp |
| Regensburg | 65,8 % | **57,1 %** | −8,7 pp |
| München | 72,2 % | **62,7 %** | −9,5 pp |

Alle drei liegen über dem Ziel von 50 % und deutlich über der 40-%-Schwelle aus
`COPY-BRIEF.md` §7.3. Zum Vergleich: Die vollständige Beweiskette hätte sie auf
38,5 / 37,4 / 39,0 % gedrückt.

### Faktenkorrekturen in derselben Stufe

Fünf Aussagen, die den freigegebenen Fakten widersprachen:

| Stelle | Befund | Korrektur |
|---|---|---|
| `CityServicePage.tsx` TrustStrip | „Einrichtung in 7–14 Tagen" | aus `FAKTEN.goLiveTage` — die Angabe war in den Stadt-Configs bereits viermal korrigiert worden und lebte in der geteilten Komponente weiter |
| `CityServicePage.tsx` Hero-Badge und TrustStrip | „DSGVO-konform" | für den Telefonassistenten ersetzt durch „Keine Gesprächsaufzeichnung"; auf Webdesign- und Automatisierungsseiten bleibt die Angabe (Option B, 17.08.2026) |
| Bayreuth `warumCogniiq` | „Ihre Rufnummer und Ihre Telefonanlage bleiben" | Umleitung statt Zusage (B4 unbeantwortet) |
| Regensburg FAQ | „Der Assistent läuft auf Ihrer bestehenden Rufnummer" | Frage umformuliert auf das, was zugesagt werden darf |
| Regensburg `warumCogniiq` | „übergeben dorthin, wo Ihr Team arbeitet: Kalender, CRM oder Buchungssystem" | widersprach `FAKTEN.keineAnbindung` — jetzt Eintrag im Dashboard plus Schnittstellenprüfung |
| Bayreuth und Regensburg FAQ | „Gängige Buchungs- und Kalendertools binden wir an" | es gibt keine Liste unterstützter Systeme (`ANBINDUNG.nichtBehauptet`) — zugesagt wird die Prüfung vor dem Angebot |

Die beiden Treffer im Hero-Badge und im TrustStrip sind erneut die Fehlerklasse
aus HONESTY-AUDIT §7: Die Aussage stand in einer geteilten Komponente, nicht in
den neunmal geprüften Configs.

### Offen, nicht in dieser Stufe geändert

`src/pages/KiTelefonassistentPage.tsx` trägt „Ihre Rufnummer bleibt" an zwei
Stellen (Zeile 75 mit `[[CLAIM]]`-Marker, Zeile 416 als Vertrauensangabe ohne
Marker). Die Service-Seite gilt als abgeschlossen; die Entscheidung, die Aussage
dort mit Marker zu belassen, wurde am 17.08.2026 bewusst getroffen. Sie fällt
oder bleibt mit der Antwort auf OWNER-INPUT B4.

## Stufe 7 · Segmentseiten `/ki-telefonassistent-arzt` und `/ki-telefonassistent-praxis`

Title, Description und H1 beider Seiten unverändert — die Angleichung betrifft
Inhalt und Struktur, nicht die Metadaten. Beide Metadaten-Ketten mussten
deshalb nicht angefasst werden.

### Faktenkorrekturen (Blocker-Klasse)

| Stelle | Befund | Korrektur |
|---|---|---|
| Arzt, FAQ „Praxissoftware" | Nannte Tomedo, Medistar, Dampsoft und CGM und stellte in Aussicht, das Ergebnis komme „als Termin im Kalender" an | Aus `FAKTEN.keineAnbindung`; keine Produktnamen, keine Liste unterstützter Systeme |
| Arzt, Benefit | „Anbindung an Ihre Praxissoftware wird vor dem Angebot geprüft" ließ eine bestehende Anbindung vermuten | Prüfung zugesagt, fehlende Standardanbindung ausdrücklich benannt |
| Arzt, Ablaufschritt 3 | „Der Termin steht im Kalender" | Strukturierter Eintrag im Dashboard, Übertrag durch das Team |
| Therapie, Ablaufschritt 3 | „Termine stehen im Kalender" | dito |
| Beide, Datenschutz-FAQ | Handgeschriebene Zweitfassung von `DATENSCHUTZ_PUNKTE` | Aus der Konstante zusammengesetzt |

Die beiden `[[CLAIM]]`-Marker auf den PVS-Namen sind entfallen, nicht ersetzt:
Nach der Regel aus HONESTY-AUDIT §7.7 ist ein Marker kein Ausweg für eine
Aussage, die wir nicht belegen können.

### Beweiskette

Neu: `src/components/TelefonassistentBeweiskette.tsx`, eingebunden über das
Opt-in `beweiskette` in `NationalIndustryPageConfig`. Die elf
Nicht-Healthcare-Seiten, die dieselbe Komponente nutzen, bleiben unverändert.

Reihenfolge nach COPY-BRIEF-3 §2, in drei Teilen, weil die segmentspezifischen
Abschnitte dazwischenliegen und M15 vor dem Preis stehen muss:

| Position | Module |
|---|---|
| nach den Problemen | M20 Patientensicht · M3 Gescheiterte Versuche · M4 Säulen (kompakt) |
| nach dem Ablauf | M14 Übergabe · M8 Anliegen-Katalog |
| aus der Config | M15 Grenzen |
| vor dem FAQ | M21 Team · M17 Einrichtung · M18 Betreuung · M10 Preis (kompakt) · M19 Umkehrbarkeit (kompakt) · M16 Nicht passend · M7 Datenschutz (kompakt) |

M13 bleibt asset-gated und rendert nicht. M22 existiert nicht. Vier Module
stehen in der Kompaktfassung aus Stufe 6c — sie sind produktweit gleich und
verlinken auf ihre Vollversion.

### Einzigartiger Anteil, gemessen

Satzvergleich über das vorgerenderte HTML, gegen `/praxen`,
`/ki-telefonassistent`, die Preisseite und eine Stadtseite.

| Seite | ohne Kette | **mit voller Kette** | Kette ohne M20/M8/M21/M17 |
|---|---|---|---|
| Arzt | 76,4 % | **40,0 %** | 49,5 % |
| Therapie | 75,9 % | **39,5 %** | 48,9 % |
| Arzt ∩ Therapie | 38,2 % | **71,7 %** | 64,2 % |

**Befund:** Die volle Kette drückte beide Seiten auf die 40-%-Schwelle aus
`COPY-BRIEF.md` §7.3 und machte sie untereinander zu 71,7 % identisch —
dasselbe Muster, das für die Stadtseiten in Stufe 6b abgelehnt wurde (dort
38,5 / 37,4 / 39,0 %).

**Entscheidung des Inhabers (18.08.2026): getrimmt.** M20, M8, M21 und M17
stehen jetzt als Kompaktfassung mit Verweis auf `/praxen`; M3, M14 und M16
bleiben voll. Ergebnis:

| Seite | ohne Kette | volle Kette | **umgesetzt: getrimmt** |
|---|---|---|---|
| Arzt | 76,4 % | 40,0 % | **48,1 %** |
| Therapie | 75,9 % | 39,5 % | **47,6 %** |
| Arzt ∩ Therapie | 38,2 % | 71,7 % | **67,3 %** |

Beide Seiten liegen wieder deutlich über der 40-%-Schwelle. Die gegenseitige
Überschneidung bleibt hoch, ist aber sachlich begründet: Zwei Segmentseiten
desselben Produkts teilen notwendigerweise Preis, Vertrag, Grenzen und
Datenschutz. Der unterscheidende Teil — Anrufanlässe, Problembeschreibung,
Ablauf, FAQ — ist vollständig segmentspezifisch.

## Seitenhierarchie — verbindlich ab 18.08.2026

Damit die Frage nicht bei jeder Seite neu verhandelt wird:

| Ebene | Seiten | Beweiskette |
|---|---|---|
| **Hub** | `/praxen`, `/ki-telefonassistent` | **vollständig**, alle 18 Abschnitte aus COPY-BRIEF-3 §2 |
| **Einstieg** | Stadtseiten, Segmentseiten | M3, M13, M14, M15, M16 und der Abschluss **voll**; die generischen Tiefenblöcke **gekürzt mit Verweis auf `/praxen`** |

Begründung: `/praxen` ist der Hub, die anderen sind Einstiege. Ein Einstieg
muss den Einwand benennen und die Tiefe erreichbar machen — er muss sie nicht
wiederholen. Wiederholung verdünnt den einzigartigen Anteil und erzeugt genau
das Muster, das nachgeordnete Seiten abwerten lässt.

Wer eine Kette erweitert oder eine neue nachgeordnete Seite anlegt, misst den
einzigartigen Anteil und meldet ihn, statt ihn aufzufüllen. Ziel mindestens
50 %, harte Untergrenze 40 % (`COPY-BRIEF.md` §7.3).

## Stufe 8 · Gestaltungs-Pass (COPY-BRIEF-3 §1)

Keine Metadaten berührt. Zehn Seiten geprüft: `/praxen`, Preisseite,
`/ki-telefonassistent`, beide Segmentseiten, `/integrationen`,
`/datenschutz-sicherheit`, drei Stadtseiten.

### Bewegung (§1.4)

| Datei | vorher | nachher |
|---|---|---|
| `NationalIndustryPage.tsx` | 580 ms, y 22 px, Staffelung `i * 0.06` | 180 ms, y 8 px, keine Staffelung |
| `CityServicePage.tsx` | 550 ms, y 24 px, Staffelung | dito |
| `KiTelefonassistentPage.tsx` | 600 ms, y 20 px, Staffelung | dito |

Die Staffelung war der eigentliche Verstoß: Bei sechs Karten ergab `i * 0.06`
eine halbe Sekunde Nachlauf — genau die scroll-getriggerte Sequenz, die §1.4
untersagt. Referenz ist jetzt durchgehend die Fassung von `/praxen`.

**`animate-pulse` und `animate-ping` entfernt**, website-weit auf öffentlichen
Seiten (Inhaber-Entscheidung: §1.4 gilt für die ganze Website, nicht nur für
den Cluster): beide Hero-Abzeichen in `NationalIndustryPage` (wirkt auf 13
Seiten), drei in `KiTelefonassistentPage`, eines in der Demo-Seite, eines in
`ScanPage`, der Ping-Ring auf `AnfrageErhaltenPage`. Ladeindikatoren
(`animate-spin`, Skeletons) bleiben — Bewegung, die Verständnis unterstützt,
ist nach §1.4 ausdrücklich erlaubt.

### Typografie (§1.2)

115 Klassenfolgen angepasst. Fließtext durchgehend ≥ 17 px, **kein Text mehr
unter 14 px** — vorher gab es `text-[10px]` bis `text-[13px]` in Auszeichnungen,
Quellenangaben und Fußzeilen. Die Sperrung der Versal-Labels wurde von
`0.2em` auf `0.12em` zurückgenommen, weil gesperrte Versalien bei 14 px
schlechter lesbar sind als bei 11 px.

Geschützte Leerzeichen vor jeder Einheit: 24 in einfachen Strings, dazu die
zusammengesetzten Fälle (`${FAKTEN.goLiveTage} Tage`) und die JSX-Textknoten.
Konvention nach Dateityp, weil ESLint `no-irregular-whitespace` literale
U+00A0 in Template-Literalen und JSX-Text verbietet:

| Ort | Schreibweise |
|---|---|
| Template-Literal | ` ` |
| JSX-Textknoten | `&nbsp;` |
| einfacher String | literales U+00A0 (von ESLint erlaubt) |

Kontrolle am ausgelieferten HTML: **null** ungeschützte Zahl-Einheit-Paare auf
allen zehn Seiten.

### Zwei Funde im Footer — auf jeder Seite der Website

| Chip | Befund |
|---|---|
| `DSGVO` | Konformitätsabzeichen ohne Grundlage — fällt unter die Sperre aus HONESTY-AUDIT §7.7 |
| `7–14 Tage` | Widersprach der 7-Tage-Garantie aus `FAKTEN.goLive` und trug nur einen `[[CLAIM]]`-Marker |

Beide ersatzlos entfernt, nicht umformuliert. Es bleiben `Festpreis` und
`Aus Bayreuth`. Der Streifen stand auf **jedem** Dokument der Website — dieselbe
Fehlerklasse wie beim TrustStrip in Stufe 6c: die Aussage lag in einer
geteilten Komponente, nicht in den geprüften Seiten-Configs.

### Außerhalb dieses Durchgangs, gemeldet statt geändert

Ungeschützte Zahl-Einheit-Paare bestehen weiterhin auf Blog-, Hotel-,
Restaurant-, Webdesign- und Automatisierungsseiten (rund 30 Muster in etwa 60
Dokumenten). Der Gestaltungs-Pass war auf die Seiten dieses Durchgangs
beauftragt; die Regel selbst gilt website-weit und wäre der nächste Schritt.

## Stufe 8b · Typografie website-weit

Ausschließlich Typografie. Kein Wort Copy auf den Nicht-Healthcare-Seiten
geändert — nachgewiesen: 303 geänderte Zeilen, nach Normalisierung der
Leerzeichen **null** inhaltliche Abweichung zwischen Vorher und Nachher.

Geschützte Leerzeichen vor jeder Einheit in 77 Dateien. Schreibweise je
Kontext, weil ESLint `no-irregular-whitespace` literale U+00A0 in
Template-Literalen und JSX-Text verbietet: ` ` im Template, `&nbsp;` im
JSX-Text, literales Zeichen im einfachen String.

Nicht angefasst: Meta-Descriptions in `publicRoutes.ts` und `seo-data.ts` — dort
ist ein geschütztes Leerzeichen wirkungslos und kostet Zeichenbudget. Ebenso
alle nicht-öffentlichen Bereiche.

Im ausgelieferten HTML der gesamten Website bleibt **ein** Fall: Der ROI-Rechner
der Startseite setzt Zahl und Einheit in getrennte Elemente; das Leerzeichen
entsteht dort aus dem Markup. Vermerkt als technische Schuld in
`HONESTY-AUDIT.md` §10.2.

## Stufe 9 · Dokumentation

Keine Codeänderung, keine Metadaten berührt.

| Dokument | Was daran neu ist |
|---|---|
| `OWNER-INPUT.md` | Von „blockierend" auf **beantwortet** umgestellt. Zusammenfassung der Antworten A–G mit ihrer Wirkung auf die Website, dazu die sieben Nachgangs-Entscheidungen vom 18.08.2026. Die ursprünglichen Fragen bleiben unverändert darunter stehen |
| `COPY-CLAIMS-TO-VERIFY.md` | Neu gegliedert in **§Z offen** (13 Punkte) und **§Y erledigt** (14 Punkte). Die Liste ist kürzer als früher, weil unbelegte Zusagen entfernt statt markiert werden. Fünf der offenen Punkte liegen außerhalb des Healthcare-Clusters |
| `ASSETS-REQUIRED.md` | **§C** — vollständige Liste der fünf ungerenderten Bausteine mit Datei, betroffenen Seiten, benötigtem Asset und freigeschaltetem Einwand. **§D** — die beiden `noindex`-Seiten mit ihrer Freischaltbedingung |
| `HONESTY-AUDIT.md` | **§9** — die geteilten Flächen, nach gemessener Reichweite, mit den sechs Vorfällen und der Gegenprobe-Regel. **§10** — offene technische Schuld: Build-Reihenfolge und ROI-Rechner-Markup |

### Warum §9 der wichtigste neue Abschnitt ist

Sechsmal ist in diesem Durchgang eine Aussage durch die Prüfung gerutscht, immer
aus demselben Grund: Die Prüfung zielte auf Seiten und Configs, die Aussage
stand in einer geteilten Komponente. Der Footer trug „DSGVO" und „7–14 Tage" auf
**allen 92** ausgelieferten Dokumenten und tauchte in keiner Seitenprüfung auf.

§9 listet die Flächen nach gemessener Reichweite — nicht nach Import-Zählung,
die Layout-Komponenten systematisch unterschätzt — und gibt die Gegenprobe an:

```
npm run build && grep -rl "<Aussage>" dist --include=*.html | wc -l
```

Diese Zahl ist mehrfach höher ausgefallen als erwartet.

## Stufe 10 · `/kosten-ki-telefonassistent` — Rankingpass (2026-08-29)

Auslöser: `docs/SEO-OVERNIGHT-MASTER-REPORT-2026-08-29.md` (Branch
`claude/seo-overnight-master-2026-08-29`). Belegte Zahlen für die Abfragefamilie
„ki telefonassistent kosten" (+Varianten): **152 Impressionen in 28 Tagen
(vorher 261, −42 %), Position 34–36**, Bottleneck-Klasse „External authority +
internal authority", Priorität 62/100. Empfehlung des Reports: mit der
Arztpraxis-Seite bündeln statt isoliert zu behandeln (dieselbe Zielgruppe,
andere Funnel-Stufe).

**Diagnose:** Die Seite selbst ist bereits gut ausgestattet — drei Tarife mit
Deckelung, acht-Schritte-Einrichtung, sieben FAQ-Einträge, `Service`+`Offer`-
Schema, Verlinkung aus Hauptnavigation (Leistungen-Panel), Footer, `/praxen`
und allen Branchen-/Problem-Seiten. Title (52 Z.) und H1 treffen die
Kernabfrage. Einzige gefundene Regelverletzung: Meta-Description lag bei 161
Zeichen, außerhalb des in Brief §8.2 vorgegebenen Korridors (140–158). Die
Arztpraxis-Seite (`/ki-telefonassistent-arzt`, dieselbe Zielgruppe, Objection
#5 „Kosten nicht planbar" laut Brief §5.6 mid-hardness) hatte bislang **keine**
Preis-FAQ — nur zwei CTA-Buttons zur Kostenseite, keinen inhaltlichen Absatz.
Externe Autorität (Domain-Alter, Backlinks) bleibt der dominante,
seitenübergreifende Faktor und ist mit On-Page-Mitteln nicht behebbar.

| Element | Vorher | Nachher |
|---|---|---|
| Meta-Description `/kosten-ki-telefonassistent` (Komponente **und** `publicRoutes.ts`-Manifest — beide trugen denselben Text getrennt, siehe Stufe 8b/§9-Fehlerklasse) | „…gedeckelter Rechnung, Einrichtung und Zwei-Wochen-Garantie." (161 Z.) | „…gedeckelter Rechnung und Zwei-Wochen-Garantie." (148 Z., im Korridor) |
| Title `/kosten-ki-telefonassistent` | unverändert (52 Z., bereits korrekt) | unverändert |
| Canonical, Schema, H1, FAQ-Anzahl | unverändert | unverändert |
| FAQ `/ki-telefonassistent-arzt` | keine Preisfrage | neu: „Sind die monatlichen Kosten planbar oder wird pro Anruf abgerechnet?" — beantwortet aus `FAKTEN.deckelung`, keine neue Zahl, nennt die Kostenseite als Textverweis |

- Keyword erhalten: ja (Title/H1 unverändert, nur Description gekürzt).
- Schema: `FAQPage` auf `/ki-telefonassistent-arzt` um einen validen Eintrag erweitert (Text = sichtbarer Absatz, keine Diskrepanz).
- Interne Verlinkung: Bestand bereits bidirektional (`/kosten-ki-telefonassistent` ↔ `/ki-telefonassistent-arzt` ↔ `/praxen`); die neue FAQ verstärkt die inhaltliche Relevanz des bestehenden Links, ohne einen weiteren Link-Slot zu erzwingen.
- Statistik: keine neue; `FAKTEN.deckelung` ist bereits an anderer Stelle im Cluster verwendete Konstante (kein neues Literal, siehe `telefonassistent-copy.test.ts`).
- Cannibalization: keine neue Überschneidung geschaffen. `/praxen` bleibt der Hub mit eigener Preis-Kurzfassung (Seitenhierarchie-Entscheidung aus `OWNER-INPUT.md`); `/kosten-ki-telefonassistent` bleibt die alleinige Tiefenseite für die Kostenfrage.

**Nicht umgesetzt (außerhalb der Evidenzlage):** zusätzliche Content-Blöcke,
Titel-Umformulierung, neue Vergleichstabellen. Die Wettbewerbsrecherche
(Phase 2) zeigte vergleichbare oder geringere Preistransparenz bei
Mitbewerber-Inhalten; die Seite unterbietet sie inhaltlich bereits. Die externe
Autoritätslücke bleibt unadressiert — außerhalb des Umfangs von Copy-/Onpage-
Änderungen.

### Messplan

Baseline (2026-08-29, aus dem Overnight-Report): 152 Impressionen/28 Tage,
Position 34–36, 0 Klicks für die Abfragefamilie „ki telefonassistent kosten".

| Check-in | Was prüfen | Kriterium |
|---|---|---|
| Tag 7 (2026-09-05) | GSC: Impressionen, Position, CTR, Klicks für die Abfragefamilie; Indexierungsstatus der Description-Änderung (URL-Kontrolle) | Nur Beobachtung — 7 Tage sind zu kurz für ein Urteil |
| Tag 14 (2026-09-12) | dito, plus: hat sich die rankende URL geändert (Ownership-Check ggü. `/praxen`, `/ki-telefonassistent-arzt`)? | Wenn Position sich um mehr als 5 Plätze verschlechtert: Ursache prüfen, ggf. Description-Änderung zurücknehmen |
| Tag 28 (2026-09-26) | dito, vollständiger 28-Tage-Vergleich ggü. Baseline | Wenn Position sich nicht um mindestens einige Plätze verbessert und CTR trotz kürzerer Description nicht steigt: Änderung war wirkungslos — nächster Hebel ist externe Autorität (Backlinks, E-E-A-T), nicht weiteres Onpage-Tuning an dieser Seite |

Rollback-Kriterium: Sollte die CTR bei gleicher oder besserer Position fallen,
Description auf die vorherige Fassung zurücksetzen (siehe Diff oben, beide
Dateien betroffen). Ein Revert der FAQ-Ergänzung ist nur nötig, falls der
Inhaber eine der genannten Zahlen widerruft — bis dahin bleibt sie stehen, weil
sie ausschließlich bereits geprüfte `FAKTEN`-Werte referenziert.

---

# Nachtrag 2026-08-29 · Branch `claude/graphify-repo-navigation-xb3aj2`

## Neue Seite: `/ki-telefonassistent-einfuehren`

| Element | Wert |
|---|---|
| H1 | „Einen KI-Telefonassistenten in der Praxis einführen" |
| Title | „KI-Telefonassistent in der Praxis einführen \| Cogniiq" (53 Z.) |
| Description | „Wie eine Praxis einen KI-Telefonassistenten einführt: welche Anrufe infrage kommen, wie die Übergabe geklärt wird und was vor der Freigabe geprüft gehört." (154 Z.) |
| Canonical | `https://cogniiq.de/ki-telefonassistent-einfuehren` |
| Indexierbar | ja · Sitemap `lastmod 2026-08-29`, `priority 0.85` |
| Schema | WebPage, BreadcrumbList, FAQPage (5 Fragen), Article (`author` = Person Lazar Popovic, `image` = og-image.png) |
| Statistiken | 2 — Zi PVS-Monitoring 2026 (52 %, ausdrücklich als Aussage über Praxisverwaltungssysteme gekennzeichnet) und GKV-Spitzenverband 2025 (39 %), beide mit Quelle und Jahr im sichtbaren Text |
| Interne Links | ausgehend: `/ki-telefonassistent` (3×, davon einer auf `#einrichtung`), `/praxen`, `/ki-telefonassistent/demo`, `/kontakt`, `/impressum` |
| Datei | `src/pages/guides/KiTelefonassistentEinfuehren.tsx` |

Zielintention: „KI Telefonassistent in der Praxis einführen". Diese Absicht war
bisher unbesetzt. Die Seite beschreibt ausschließlich die Entscheidungen und
Prüfungen, die bei der Praxis liegen; der Einrichtungsablauf auf unserer Seite
(M17 / `EINRICHTUNG_PROJEKT`) bleibt allein auf der Produktseite und wird von
hier verlinkt. Bewusst **kein** zweiter nummerierter Prozess.

Ausdrücklich nicht enthalten, weil gesperrt oder unbeantwortet: Aussagen zu
Verarbeitungsort, Konformität oder Zertifizierung (HONESTY-AUDIT §7.7), Namen
von Praxisverwaltungssystemen oder Anbindungszusagen (OWNER-INPUT B1–B3),
Aussagen zum Verhalten bei Störung oder Ausfall und jede Frist für eine
Rückschaltung (OWNER-INPUT B9), Anteil automatisierter Anrufe (F4/Z0), Namen
eingesetzter Dienstleister. Alle Kernzahlen stammen aus `FAKTEN`; die Datei
steht dafür in der CLUSTER-Liste von `telefonassistent-copy.test.ts`.

## Geänderte Seite: `/ki-telefonassistent`

| Element | Vorher | Nachher |
|---|---|---|
| Abschnitt „Einrichtung" | nur Fließtext | zusätzlich ein kontextueller Verweis auf den Einführungsleitfaden |
| Schriftgrad dieses Absatzes | — | 17 px (Brief III §1.2) |

H1, Title, Description, Canonical, Schema und alle übrigen internen Links
unverändert.

## Neue Komponente

`src/components/RedaktionelleVerantwortung.tsx` — nennt die nach
§ 18 Abs. 2 MStV verantwortliche Person (identisch mit dem Impressum) und grenzt
den Beitrag ausdrücklich von ärztlicher, rechtlicher und
datenschutzrechtlicher Beratung ab. Keine Qualifikationen, keine Berufsjahre,
keine Aufgabenteilung zwischen den Gründern. Kein Foto (Asset nicht freigegeben).

## Eingefrorene Experimente

Keine der sechs Routen wurde verändert, und es wurde **kein** neuer interner
Link auf sie gesetzt — auch nicht bei Kostenfragen, wo er naheliegend gewesen
wäre. Abgesichert durch `src/protectedExperiments.test.tsx`.
