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
