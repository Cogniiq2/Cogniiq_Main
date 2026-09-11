# Post-experiment opportunities

Angelegt: 2026-08-29 · Basis-Commit `0652c2e`

Sechs Routen laufen als Suchexperimente und sind eingefroren. Dieses Dokument
sammelt, was an ihnen auffällt, **damit es nicht am Experiment vorbei umgesetzt
wird**. Nichts hier darf angefasst werden, solange die Route in
`PROTECTED_EXPERIMENT_PATHS` steht (`src/lib/routing/protectedExperiments.ts`).

Der Test `src/protectedExperiments.test.tsx` erzwingt das: Er vergleicht Titel,
Description, Canonical, Robots, H1, Fließtext, JSON-LD und ausgehende Anker mit
einer festgeschriebenen Fassung und zählt zusätzlich, wie oft im Quelltext auf
jede dieser Routen verwiesen wird.

## Ablauf, wenn ein Experiment endet

1. Ergebnis in `docs/seo/organic-growth-scoreboard.md` festhalten.
2. Pfad aus `PROTECTED_EXPERIMENT_PATHS` entfernen.
3. `npm run seo:baseline` ausführen, damit die Fixture die verbleibenden Routen
   abbildet.
4. Die Punkte unten in einem eigenen, kleinen PR umsetzen — nicht gebündelt mit
   anderer Arbeit, damit die Wirkung zurechenbar bleibt.

---

## `/bayreuth/website-relaunch`

Läuft seit 2026-08-29 mit einem Titel-Experiment (Aufnahme des Begriffs
„Performance"); Protokoll in
`docs/SEO-EXPERIMENT-BAYREUTH-PERFORMANCE-TITLE-2026-08-29.md`.

- **Nach dem Experiment:** Falls der Titel die CTR hebt, dieselbe Prüfung für
  `/regensburg/website-relaunch` und `/muenchen/website-relaunch` wiederholen —
  aber einzeln und nacheinander, nicht als Sammeländerung. Sonst ist wieder
  nicht zuzuordnen, was gewirkt hat.
- **Beobachtung, nicht umsetzen:** Die H1 („Website Relaunch in Bayreuth")
  nennt „Performance" nicht, der Titel jetzt schon. Ob die Angleichung der H1
  hilft oder das Relaunch-Signal verwässert, ist offen und wäre das nächste
  saubere Einzelexperiment.

## `/regensburg/website-relaunch`

- Beschreibt Prüfkriterien einer Leistung, darunter „DSGVO-Konformität"
  (`src/pages/cluster/regensburg/WebsiteRelaunchRegensburg.tsx:40`). Das ist
  nach HONESTY-AUDIT §7.7 zulässig, weil es ein Prüfpunkt einer Dienstleistung
  ist und keine Aussage über das eigene Produkt. **Kein Handlungsbedarf** —
  hier nur vermerkt, damit es bei einer späteren Claim-Runde nicht
  fälschlich als Verstoß angestrichen wird.

## `/muenchen/webdesign-kosten`

Nach dem Experiment zu prüfen — alles **Claim-Hygiene**, kein SEO-Gewinn:

- `src/pages/cluster/muenchen/WebdesignKostenMuenchen.tsx:130` — „Monatliche
  Betreuung ab ca. 350 € / Monat" ist ein Preis ohne bestätigte Grundlage
  (Klasse Z6/Z12 in `COPY-CLAIMS-TO-VERIFY.md`).
- Ebd. `:138` — „Launch: 7–14 Tage. Wachstum: 3–6 Wochen. Marktführer: 6–10
  Wochen." Fristen ohne Beleg. Für den Telefonassistenten wurde die Frist
  bereits korrigiert; für Webdesign steht diese Prüfung noch aus.
- Ebd. `:32`, `:82` — „Marktführer" als Paketname. Reklamehafte Übertreibung,
  keine Aussage über Cogniiq. Geringes Risiko, nur der Vollständigkeit halber.

## `/bayreuth/webdesign`

- `src/lib/standorte-service-configs.ts:357` — „Auf Wunsch organisieren wir das
  Hosting bei einem deutschen oder europäischen Anbieter." Grenzfall zu
  §7.7: Die Ausnahme für einen vom Kunden selbst beauftragten Dritten greift
  vermutlich, „organisieren wir" rückt es aber näher an eine Aussage über die
  eigene Infrastruktur. **Nach dem Experiment neu formulieren**, sodass der
  Auftrag des Kunden eindeutig im Satz steht.
- Die Seite trägt mit 38 Quelltext-Verweisen die meisten internen Links aller
  eingefrorenen Routen. Nach dem Experiment lohnt eine Prüfung, ob diese
  Linkmenge noch der Bedeutung der Seite entspricht.

## `/ki-telefonassistent-arzt`

- Claim-Scan sauber: keine verbotene Formulierung gefunden.
- **Die eigentliche Frage ist die Struktur, nicht der Text.** Diese Route,
  `/praxen` und `/ki-telefonassistent-praxis` konkurrieren um dieselbe
  medizinische Suchintention. Der Einstieg dieser Seite und die H1 von
  `/praxen` erzählen fast dieselbe Szene. Nach dem Experiment gehört
  entschieden, welche Seite die Intention „KI Telefonassistent Arztpraxis"
  kanonisch besitzt — und die beiden anderen darauf ausgerichtet oder
  zusammengeführt. Das ist die größte ungenutzte Struktur­reserve im Cluster
  und lässt sich vorher nicht angehen, weil zwei der drei Seiten eingefroren
  sind.

## `/kosten-ki-telefonassistent`

- Claim-Scan sauber.
- `src/components/Navigation.tsx:362` setzt
  `GEMESSEN_NUR_NACH_HYDRATION = '/kosten-ki-telefonassistent'` als expliziten
  Experiment-Schutz. Diese Zeile gehört mit dem Experiment ausgewertet und
  danach entfernt oder begründet beibehalten.
- Der neue Einführungsleitfaden verweist bei Kostenfragen bewusst **nicht**
  hierher, obwohl es der naheliegende Verweis wäre. Nach dem Experiment gehört
  dieser Verweis ergänzt — er ist inhaltlich richtig und fehlt derzeit nur,
  weil er die eingehende Linkstruktur der Messung verändert hätte.

---

# GSC-Befunde 10.09.2026 zu eingefrorenen Routen

Quelle: die beiden Search-Console-Exporte vom 2026-09-10 (3 Monate
2026-06-09–2026-09-08, 28 Tage 2026-08-12–2026-09-08). Aggregatwerte, kein
Query×Seite-Beleg. Alles hier ist **HIGH-EV — DEFERRED UNTIL EXPERIMENT END**
und wurde nicht angefasst.

## Seiten-Aggregate der eingefrorenen Routen (plus eine Vergleichszeile)

| Route | 3M Impr. | 3M Pos. | 28D Impr. | 28D Pos. | Klicks 3M |
|---|---:|---:|---:|---:|---:|
| `/regensburg/webdesign` | 4.519 | 54,5 | 2.347 | 51,4 | 0 |
| `/bayreuth/webdesign` | 1.858 | 51,1 | 853 | 52,0 | 0 |
| `/ki-telefonassistent-arzt` | 1.258 | 40,1 | 543 | 31,7 | 0 |
| `/kosten-ki-telefonassistent` | 802 | 29,6 | 364 | 31,2 | 0 |
| `/muenchen/webdesign-kosten` | 420 | 34,6 | 268 | 37,2 | 0 |
| `/regensburg/website-relaunch` | 364 | 12,3 | 358 | 12,2 | 1 |
| `/bayreuth/website-relaunch` | 139 | 14,7 | 131 | 14,4 | 0 |

`/regensburg/webdesign` steht in `PROTECTED_EXPERIMENT_PATHS` nicht — nur
`/regensburg/website-relaunch` tut das. Die Zeile steht hier trotzdem, weil sie
für die Einordnung der übrigen Regensburg-Zahlen gebraucht wird.

## Die größte eingefrorene Chance: das Telefonassistent-Arzt-Cluster

Die Query-Familie rund um den KI-Telefonassistenten für Praxen ist die
volumenstärkste **kommerzielle** Nicht-Marken-Familie der Domain und liegt
positionsmäßig deutlich näher an der ersten Seite als die Webdesign-Familien:

| Query | 3M Impr. | 3M Pos. | 28D Impr. | 28D Pos. |
|---|---:|---:|---:|---:|
| ki telefonassistent arztpraxis | 342 | 38,8 | 148 | 33,1 |
| telefonassistent arztpraxis | 316 | 39,4 | 147 | 31,6 |
| ki telefonassistent kosten | 302 | 30,2 | 151 | 34,3 |
| ki-telefonassistent kosten | 165 | 29,6 | 75 | 33,4 |
| telefonassistent praxis | 150 | 40,0 | 58 | 31,2 |
| telefonassistent arzt | 147 | 34,2 | 54 | 26,8 |
| was kostet ein ki-telefonassistent? | 77 | 28,7 | 32 | 33,6 |
| ki telefonassistent praxis | 64 | 40,8 | 19 | 33,7 |
| ki-telefonassistent arztpraxis | 58 | 38,6 | 32 | 32,6 |

Diese neun Zeilen summieren sich auf **716** Impressionen in 28 Tagen (1.621 in
drei Monaten). Nimmt man die vollständige Familie aller Queries mit
„telefonassistent" hinzu — 73 Zeilen, überwiegend Longtail —, sind es **943**.
Die frühere Fassung dieses Absatzes sagte „rund 1.000" direkt unter der Tabelle
und ließ damit die Tabellensumme größer erscheinen, als sie ist. Die beiden Seiten, die diese
Intention plausibel besitzen — `/ki-telefonassistent-arzt` und
`/kosten-ki-telefonassistent` — sind **beide eingefroren**. Das ist der
Kernbefund dieses Laufs: Die attraktivste Query-Familie der Domain ist genau
die, an der derzeit nicht gearbeitet werden darf.

Die Positionen verbessern sich im 28-Tage-Fenster gegenüber dem 3-Monats-Schnitt
(z. B. 38,8 → 33,1) — die Seiten bewegen sich also ohne Zutun. Das ist ein
zusätzlicher Grund, den Freeze auszuhalten statt ihn abzukürzen: Eine Änderung
jetzt wäre von dieser laufenden Bewegung nicht mehr zu trennen.

**Nach dem Experiment zuerst:** die Besitzfrage aus dem Abschnitt
`/ki-telefonassistent-arzt` oben entscheiden (diese Route vs. `/praxen` vs.
`/ki-telefonassistent-praxis`) — und erst danach am Text arbeiten. Auffällig:
`/ki-telefonassistent-praxis` fällt von 514 Impressionen (3M) auf **1** (28D),
während `/ki-telefonassistent-arzt` im selben Zeitraum stabil bleibt. Das ist
mit Aggregaten nicht beweisbar, passt aber zu dem Bild, dass Google die
Besitzfrage gerade selbst entscheidet.

## Faktische Altlast auf einer eingefrorenen Route

Die Description von `/ki-telefonassistent-arzt` im Routen-Manifest sagt „bucht
Termine ins System". Nach der Inhaber-Bestätigung vom 10.09.2026
(`BOOKING_WRITE` = nur nach geprüfter Kundenintegration) ist das als
Standardzusage nicht haltbar. Die Route ist eingefroren, die Aussage steht aber
im **SERP-Snippet** einer Seite mit 543 Impressionen in 28 Tagen — also vor
Augen, die nie klicken müssen, um sie zu lesen.

Freeze und Aussagenrichtigkeit stehen hier gegeneinander. Vollständige
Einordnung in `COPY-CLAIMS-TO-VERIFY.md` → „Z25 · Nachtrag 10.09.2026".

**Erledigt am 11.09.2026** (Branch `claude/fix-arzt-claim-integrity-2026-09-11`).
Die Abwägung ist zugunsten der Aussagenrichtigkeit entschieden: Titel und
Description im Manifest und in `functions/_middleware.ts` sind korrigiert, das
Experiment ist damit **kontaminiert** und als solches protokolliert — Wortlaut
alt/neu, Umfang und Konsequenz für die Auswertung in
`docs/seo/organic-growth-scoreboard.md` → „Kontamination `/ki-telefonassistent-arzt`
(2026-09-11)". Der Seitenkörper wurde nicht angefasst; die offene Besitzfrage
(`/ki-telefonassistent-arzt` vs. `/praxen` vs. `/ki-telefonassistent-praxis`)
bleibt unberührt und weiterhin Folgearbeit.

---

# Kannibalisierungs-HYPOTHESEN 10.09.2026

Ausdrücklich **Hypothesen**. `Queries.csv` und `Pages.csv` sind getrennte
Aggregate und belegen nie, dass zwei URLs auf dieselbe Query ranken. Grundlage
ist Repository-Architektur plus Semantik, nicht Messung. **Nichts davon
rechtfertigt eine Zusammenlegung von URLs, solange kein Query×Seite-Export
vorliegt.**

1. **Regensburg-Webdesign.** `/regensburg` (2.623 Impr., Pos. 75,8 im 28-Tage-Fenster)
   und `/regensburg/webdesign` (2.347 Impr., Pos. 51,4) sind zusammen die
   größte Impressionsmenge der Domain. Queries wie „webdesign regensburg" (700
   Impr., Pos. 57,8), „regensburg webdesign" (286, 57,8) und „webdesign agentur
   regensburg" (435, 47,4) passen semantisch auf beide. Zwei Seiten auf
   Position 51 und 76 für eine Familie sehen nach geteilter Autorität aus —
   sind aber genauso gut mit „die Domain ist für diese Familie schlicht zu
   schwach" erklärbar. **Nicht entscheidbar ohne Query×Seite.**
2. **Kosten-Automatisierung.** `/kosten-automatisierung` (Pos. 35,2 → 16,3) und
   `/muenchen/automatisierung` (Pos. 37,2 → 23,3) verlieren beide stark an
   Impressionen (127 → 33 bzw. 163 → 41), während ihre Positionen sich
   verbessern. Muster passt zu einer Neuzuordnung durch Google innerhalb des
   Automatisierungs-Clusters. Beobachten, nicht anfassen.
3. **Hotel vs. Gastronomie.** `/webdesign-hotel` und `/webdesign-gastronomie`
   teilen sich die Query „internetagentur hotel/hotels" **nicht** erkennbar —
   die Gastronomie-Queries sind lexikalisch klar getrennt (gastronomie,
   restaurant) und ranken deutlich schlechter (Pos. 48–76 gegen 20–45).
   Hypothese **nicht gestützt** — was nach der Vorbemerkung oben auch das
   Höchste ist, was Aggregate hergeben: „widerlegt" wäre hier ein
   Denkfehler, weil dieselben Daten die Frage nicht entscheiden können. Die
   lexikalische Trennung reicht aber, um in diesem Lauf nur die Hotel-Seite
   anzufassen, ohne eine gemeinsame Query-Familie zu stören.

---

# Technischer Befund am Rande: FAQ-Antworten stehen nicht im SSR-Körper

Aufgefallen bei der Prüfung des gerenderten Outputs von `/webdesign-hotel`, gilt
aber für **alle** Seiten mit dem FAQ-Accordion (`NationalIndustryPage`,
`IndustryPage` und Verwandte): Die Antworten hängen an
`const [open, setOpen] = useState(false)` und `{open && (...)}`. Im
vorgerenderten HTML steht deshalb nur die **Frage** (im Button), die **Antwort**
ausschließlich im `FAQPage`-JSON-LD.

Nachprüfbar an `dist/webdesign-hotel.html` am Antworttext selbst: „Den
Unterschied macht nicht das Design" kommt genau **einmal** vor (JSON-LD), die
zugehörige Frage **zweimal** (Button + JSON-LD).

Nicht als Beleg taugt „Boutique- und Landhotels": Der Begriff steht seit diesem
Lauf zusätzlich in `solution.text` und damit im sichtbaren Körper — er kommt
deshalb zweimal vor, aus einem anderen Grund. Genau deshalb ist die
Betriebstypen-Aufzählung dorthin gezogen worden.

Das ist kein Fehler — JSON-LD wird ausgewertet — aber es heißt, dass FAQ-Text
für die Bewertung des Seitenkörpers praktisch nicht zählt. Wer über FAQ-Einträge
Intent abdecken will, deckt ihn nur strukturiert ab. In diesem Lauf wurde
deshalb die Betriebstypen-Aufzählung zusätzlich in `solution.text` gezogen, wo
sie im SSR-Körper landet.

**Empfehlung für einen eigenen, kleinen PR** (nicht hier, weil es eine geteilte
Komponente ist und sechs eingefrorene Routen dieselbe Komponente rendern): Die
Antwort immer rendern und nur per CSS/`hidden` ein- und ausklappen, statt sie
bedingt zu mounten. Das würde die Fingerprints **aller** eingefrorenen Routen
verändern und darf deshalb erst nach dem Experimentende geschehen.

## Nicht experimentbezogen, aber hier notiert

> **Stand 2026-09-10: erledigt bis auf eine Zeile.** Alle Fundstellen unten
> außer `standorte-service-configs.ts:357` sind auf Branch
> `claude/seo-growth-max-2026-09-10` bereinigt — alle sieben Zeilen.
> `standorte-service-configs.ts:357` (Hosting-FAQ, §7.7-nah) steht **nicht** in
> dieser Tabelle, sondern im Abschnitt `/bayreuth/webdesign` weiter oben; die
> Route ist eingefroren und wurde zu Recht nicht angefasst.

Diese Punkte betreffen **nicht** eingefrorene Routen und könnten sofort
angegangen werden. Sie stehen hier, weil sie in derselben Prüfung aufgefallen
sind und sonst verloren gingen. Sie waren nicht Teil dieses PRs, weil sie
nichts mit Rankings zu tun haben.

| Fundstelle | Text | Regel |
|---|---|---|
| `src/pages/costs/KostenAutomatisierung.tsx:71` | „Vollautomatisches Kunden-Onboarding" | wörtlich verbotenes Wort, COPY-BRIEF §5.9 |
| `src/pages/costs/KostenAutomatisierung.tsx:29` | „… vollständig automatisiert." | dieselbe Klasse |
| `src/pages/WebdesignArztBayreuth.tsx:199` | „… laufen bei Cogniiq vollständig automatisiert ab." | dieselbe Klasse, zusätzlich absolute Zusage auf einer Gesundheitsseite |
| `src/pages/problems/ZuVielManuelleArbeitPage.tsx:13,51` | „vollständig automatisiert" | dieselbe Klasse |
| `src/lib/standorte-service-configs.ts:227` | „Wir verbinden nahezu jede Software mit einer API" | Muster „funktioniert mit allen" |
| `src/lib/standorte-service-configs.ts:93` | „… wird jeder angenommen – ohne Warteschleife." | absolute Zusage; gehört an `FAKTEN.gleichzeitigeAnrufe` gebunden |
| `src/lib/standorte-service-configs.ts:186` | „marktführenden Automatisierungsplattformen" | unbelegter Superlativ über Dritte |

Höchste Priorität davon bleibt unverändert **Z0** aus
`COPY-CLAIMS-TO-VERIFY.md`: der Vorgabewert des Praxis-Rechners. Er steht
weiterhin vor jedem Besucher der Preisseite und hängt an einer Messung, die
noch aussteht.

---

## Nach dem Ende des Preisseiten-Experiments (aufgenommen 11.09.2026)

Diese Punkte sind **fertig entschieden und absichtlich nicht umgesetzt**, weil
sie die gerenderten Bytes eines laufenden Experiments verändern würden. Sie
gehören in eine eigene, kontrollierte Änderung, sobald die Messung endet.

| # | Was | Warum es wartet |
|---|---|---|
| P1 | Den kanonischen Rechner (`TelefonRechnerSection` + `TelefonRechner`) auf der Preisseite montieren, bevorzugt in einer preis-zuerst-Fassung | Die Seite rendert heute `PraxisRechnerSection`. Ein Austausch verändert Text, Bauteile und Reihenfolge im `<main>` |
| P2 | `PraxisRechnerWidget` und `PraxisRechnerSection` löschen | Sie bedienen nach dem 11.09.2026 nur noch diese eine Seite. Ihre Arithmetik ist bereits auf `telefonassistent-rechner.ts` umgestellt, ihre Anzeige ist eingefroren |
| P3 | Den voreingestellten „Automatisierungsgrad" von 20 % entfernen | Er überlebt ausschließlich in `PraxisRechnerWidget` und damit ausschließlich auf dieser Seite. Auf jeder anderen Fläche ist er entfernt; die Ausnahme ist in `rechner-konsistenz.test.tsx` als `EINGEFROREN` benannt und fällt mit P2 weg |
| P4 | `RECHNER.rahmung` durch `RECHNER.rahmungRoutine` ersetzen | `rahmung` beschreibt einen Vorgabewert, den der kanonische Rechner nicht mehr setzt. `/praxen` nutzt bereits die korrigierte Fassung; die Preisseite bekommt sie mit P1/P2 |
| P5 | `NICHT_EXTRA` — „10 gleichzeitige Anrufe in jedem Tarif" | Siehe unten. Die Zahl ist auf allen nicht eingefrorenen Flächen durch `FAKTEN.gleichzeitigeAnrufeSatz` ersetzt. Hier steht sie noch, weil die Seite eingefroren ist — **nicht**, weil sie belegt wäre |

### Zur Gleichzeitigkeit (Grundlage für P5)

Öffentliche ElevenAgents-Preisangaben, geprüft am 11.09.2026: Die
Gleichzeitigkeit ist eine **Workspace-Grenze**, die sich alle Agenten eines
Kontos teilen — Free 4, Starter 6, Creator 10, Pro 20, Scale 30, Business 40,
Enterprise nach Vereinbarung; „Burst" hebt sie je Agent auf das Dreifache bei
doppeltem Minutenpreis.

Daraus folgt: Eine Konto-Obergrenze von 10 ist **keine** Zusage von zehn
Gesprächen je Kunde, sobald mehr als ein Kunde gleichzeitig telefoniert. Sie
wäre es nur bei einer eigenen Umgebung je Kunde oder bei vertraglich
reservierter Kapazität. Im Repository ist weder das eine noch das andere
dokumentiert: Das Kunden-Onboarding erfasst eine Agent-ID und eine Umgebung
(EU/US), aber kein Kapazitäts- oder Tarifmerkmal.

Bis der Inhaber die Bereitstellung bestätigt (OWNER-INPUT B11), gilt überall
die Fassung ohne Zahl. Wird sie bestätigt, kann die Zahl zurück — dann aber
belegt, und mit einer Aussage dazu, was bei Überlauf geschieht (B9).
