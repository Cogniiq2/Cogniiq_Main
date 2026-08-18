# MERGE-READINESS — Stand vor dem Merge

Branch `claude/cogniiq-copy-overhaul-mjkdf4` · Stand 18.08.2026
Grundlage: `.claude/COPY-BRIEF-2.md` §10.

> **Nicht gemergt. Nicht deployt.** Dieses Dokument beschreibt den Zustand und
> das, was vor einem Merge entschieden werden muss — es ist keine Freigabe.

## 1. Umfang

50 Commits, 128 Dateien, +8.735 / −2.307 Zeilen gegenüber `origin/main`.

Drei neue Routen: `/praxen`, `/integrationen`, `/datenschutz-sicherheit`.
Die beiden letzteren stehen auf `indexable: false` und sind nur über interne
Verlinkung erreichbar — Freischaltbedingungen in `ASSETS-REQUIRED.md` §B1/§B2.
Keine bestehende URL, kein Canonical, kein Redirect wurde geändert.

## 2. Prüfgatter

| Prüfung | Ergebnis |
|---|---|
| `npm run typecheck` | sauber |
| `npm test` | 1.427 grün, 1 übersprungen, 46 Dateien |
| `npm run build` | erfolgreich, 91 öffentliche Routen vorgerendert + 404 + App-Shell |
| `npm run lint` | 0 Fehler, 22 Warnungen (alle vorbestehend, keine in neuen Dateien) |

Der Guard-Test `telefonassistent-copy.test.ts` deckt 13 Cluster-Dateien ab und
schlägt an, sobald eine Kernzahl als Literal auftaucht statt aus `FAKTEN` oder
`TARIFE` zu kommen.

## 3. Gemessene Kennzahlen

Einzigartiger Anteil, Satzvergleich über das vorgerenderte HTML:

| Seite | Wert | Schwelle |
|---|---|---|
| Bayreuth | 58,7 % | ≥ 40 % (`COPY-BRIEF.md` §7.3), Ziel 50 % |
| Regensburg | 57,1 % | dito |
| München | 62,7 % | dito |
| `/ki-telefonassistent-arzt` | 48,1 % | dito |
| `/ki-telefonassistent-praxis` | 47,6 % | dito |

Typografie: null ungeschützte Zahl-Einheit-Paare im sichtbaren Text, mit einer
dokumentierten Ausnahme (`HONESTY-AUDIT.md` §10.2).

## 4. Was vor dem Merge entschieden werden muss

Keiner dieser Punkte ist ein Fehler im Code. Es sind Entscheidungen.

| # | Punkt | Referenz |
|---|---|---|
| 1 | **13 offene Aussagen** — davon 5 außerhalb des Healthcare-Clusters | `COPY-CLAIMS-TO-VERIFY.md` §Z |
| 2 | **Fünf fehlende Beweis-Assets** — fünf Bausteine rendern nicht, darunter die Stimmprobe auf sieben Seiten | `ASSETS-REQUIRED.md` §C |
| 3 | **Zwei Seiten auf `noindex`** — bewusst, bis die Freischaltbedingungen erfüllt sind | `ASSETS-REQUIRED.md` §B1/§B2, §D |
| 4 | **Nicht-Healthcare-Copy** — Hotel, Restaurant, Webdesign, Automatisierung und Blog haben den Ehrlichkeits- und Gestaltungspass **nicht** vollständig durchlaufen. Verarbeitungsort und „DSGVO-konform" sind dort entfernt, Zeiträume und Reaktionszeiten stehen unbestätigt | `COPY-CLAIMS-TO-VERIFY.md` Z6, Z7, Z10–Z12 |

## 4a. Bereinigung der Rest-Aussagen (18.08.2026, abgeschlossen)

Die fünf Punkte aus §4.1, die außerhalb des Healthcare-Clusters lagen, sind
bereinigt. **Nur Entfernung unbelegter Zusagen — keine Copy-Überarbeitung.**
Jede Zeile mit der Gegenprobe aus `HONESTY-AUDIT.md` §9 gegen `dist` geprüft,
nicht gegen die Quelldateien.

| # | Aussage | Dokumente vorher | nachher |
|---|---|---|---|
| 1 | „7–14 Tage" auf Startseite und Vertrauensflächen | 35 | **7** |
| 2 | „24 h" — siehe Aufteilung unten | 17 | 16 |
| 3 | Review-Lenkung | 3 | **0** |
| 4 | Hotel-/Restaurant-Systemnamen | 5 | **0** |
| 5 | Blog-Preis gegen `TARIFE` | 1 | **0** |

### Zu 1 — was entfernt wurde und was bleibt

Entfernt: jede Nennung auf Startseite, Vertrauensstreifen, Kontaktseite, den
Assistent-Segmentseiten, den Paketseiten, die den Assistenten einschließen, und
in den Meta-Descriptions beider Ketten.

**Es bleiben 7 Dokumente**, alle reine Website-Projektdauern
(`*/webdesign-kosten`, `*/website-erstellen`, `/webdesign`). Das ist ein anderes
Produkt mit eigener Laufzeit; die Angabe widerspricht der 7-Tage-Garantie des
Telefonassistenten nicht. Sie ist weiterhin unbestätigt (OWNER-INPUT E1 bezog
sich auf den Assistenten) und gehört in den Copy-Durchgang für die
Nicht-Healthcare-Seiten.

### Zu 2 — Abweichung von beiden angebotenen Optionen

Weder „auf den Cluster begrenzen" noch „entfernen", sondern eine Aufteilung.
Begründung: In den Fundstellen steckten **zwei verschiedene Aussagen**.

| Aussage | Beleg | Ergebnis |
|---|---|---|
| **Antwortzeit** — „Wir melden uns in der Regel innerhalb von 24 Stunden" | OWNER-INPUT **D3** fragt allgemein nach der „Reaktionszeit auf Anfragen", nicht produktbezogen. Die Antwort lautet „spätestens innerhalb von 24 Stunden" — die Website sagt „in der Regel", also **schwächer als die Zusage** und damit gedeckt | **bleibt.** Nur die erledigten `[[CLAIM]]`-Marker sind entfernt. `COPY-BRIEF.md` §10 verlangt außerdem, dass jedes Formular sagt, was in welcher Frist passiert — eine Streichung hätte das gebrochen |
| **Leistung in 24 h** — „Systemanalyse · Innerhalb 24 h" (`ContactSection`) und „Innerhalb 24 h" (`HowItWorksSection`) | D3 deckt eine **Antwort**, keine gelieferte Analyse | **entfernt** — das war die eigentliche Überdehnung |

Falls die Antwortzeit doch clusterintern gemeint war, ist die Rücknahme zwei
Zeilen; die Fundstellen stehen in `COPY-CLAIMS-TO-VERIFY.md` Z7.

### Zu 3 — Review-Lenkung

Entfernt in `WebdesignGastronomieMuenchen`, `WebdesignGastronomieRegensburg`
(die Regensburger Fassung fand erst die Gegenprobe gegen `dist`, nicht die
Quellensuche) sowie die Formulierungen „nach positiven Erlebnissen" in
`AutomatisierungSport` und die gleichgelagerte Zielgruppenverengung in
`AutomatisierungArzt`.

**Produktseite geprüft:** Im Repository findet sich **keine Implementierung**
einer Bewertungsweiche — keine Verzweigung nach Bewertungshöhe, kein
Review-Gating im Code. Die Aussage war Copy ohne Funktion. Sollte die Weiche
außerhalb dieses Repositories existieren (etwa im Automatisierungs-Workflow beim
Kunden), ist sie rechtlich zu prüfen; das lässt sich von hier aus nicht
feststellen. **Offener Punkt.**

### Zu 4 — Systemnamen

`protel`, `Apaleo`, `Lodgit`, `OpenTable`, `ResDiary`, `Resmio`, `TheFork`,
`Little Hotelier`, `Beds24` sind aus Hotel- und Restaurant-Segmentseiten, den
Webdesign-Branchenseiten und einem Blogartikel entfernt — dieselbe Behandlung
wie bei den PVS-Namen. An ihre Stelle tritt die Schnittstellenprüfung vor dem
Angebot. Die beiden `[[CLAIM]]`-Marker darauf sind entfallen, nicht ersetzt.

Nebenbefund, mitgenommen: In derselben Antwort stand „vollautomatisch" — ein
Wort von der Verbotsliste (`COPY-BRIEF.md` §5.9).

### Zu 5 — Blog-Preise

Gegen `TARIFE` geprüft. Ein Betrag widersprach: „Die monatlichen Kosten eines
KI-Telefonassistenten für eine mittelgroße Praxis liegen zwischen 200 und
450 €" — die bestätigten Tarife beginnen bei 300 € (Basis) und liegen für eine
mittelgroße Praxis bei 500 €. **Entfernt, nicht korrigiert**, mit Verweis auf
die Kostenseite.

Die übrigen Blog-Beträge betreffen Webdesign und Automatisierung, nicht die
bestätigten Tarife. Sie stehen weiter als Z12 offen.

### Methodischer Nachtrag

Die Gegenprobe gegen `dist` hat in dieser Runde **drei Fundstellen** aufgedeckt,
welche die Quellensuche verfehlte, jedes Mal aus demselben Grund: Der
Typografie-Durchgang hatte zwischen Zahl und Einheit geschützte Leerzeichen
gesetzt — mal als literales U+00A0, mal als `\u00A0`, mal als `&nbsp;`. Ein
Suchmuster mit gewöhnlichem Leerzeichen findet dann nichts und meldet trotzdem
Erfolg. Dieselbe Fehlerklasse wie beim Muster `€\b`. **Konsequenz für die
nächste Prüfung:** Suchmuster über Zahlen und Einheiten müssen jede
Leerzeichen-Schreibweise abdecken, und die Zählung gehört gegen `dist`.

## 5. Was nach dem Merge sofort zu tun ist

1. **`HONESTY-AUDIT.md` §9 lesen, bevor irgendetwas geprüft wird.** Die Liste der
   geteilten Flächen ist der teuerste Lernpunkt dieses Durchgangs.
2. Die Gegenprobe am ausgelieferten HTML gewöhnen, nicht am Quelltext:
   `npm run build && grep -rl "<Aussage>" dist --include=*.html | wc -l`
3. Vor jedem lokalen Build `VITE_SUPABASE_URL` setzen — sonst bricht die Kette
   vor dem Prerender ab und jede HTML-Prüfung entfällt (§8.1, §10.1).

## 6. Ausdrücklich nicht getan

- Nicht gemergt, nicht deployt, keine Datenbankmigration, kein Produktionszugriff
- Keine URL, kein Canonical, kein Redirect, kein Robots-Eintrag geändert
- Keine Copy auf den Nicht-Healthcare-Seiten geändert (nur Typografie und die
  gesperrten Aussagenklassen)
- Kein Platzhalter für ein fehlendes Asset in den DOM gesetzt
