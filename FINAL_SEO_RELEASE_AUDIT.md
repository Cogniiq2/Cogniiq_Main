# FINAL_SEO_RELEASE_AUDIT — Cogniiq, Korrekturdurchgang 23.10.2026

Branch `claude/seo-release-fixes-2026-10` (von `claude/seo-audit-2026-10` @ `226512f`).
Nichts deployt, nichts nach `main` gemergt. Kein Formular abgesendet, kein Outreach.

## Entscheidung

**NOT READY TO DEPLOY.** Technik und Nutzenrechner sind korrigiert und getestet; die
verbindlichen Tarifregeln (J1–J8 in `OWNER-INPUT.md`) sind weiterhin unbestätigt. Der Rechner
nennt deshalb keinen „günstigsten Tarif" mehr und jede Summe als Teilsumme aus bekannten
Positionen – das ist ein ehrliches Fallback, keine Freigabe. Außerdem konnten Produktion und
Preview aus diesem Container nicht erreicht werden (Netzwerk 403); der HEAD-Fix ist lokal
gegen `wrangler pages dev` und per Unit-Test mit bodyloser HEAD-Antwort belegt, nicht gegen die
Edge.

## Prioritäten

| Stufe | Punkt | Status |
|---|---|---|
| P0 | HEAD 500 auf prerenderten Routen | **behoben** (Code + 2 Tests) |
| P0 | Tarifempfehlung ohne bestätigte Zuordnungsregel; stiller Sprachaufschlag | **entschärft** (Vergleich offengelegt, Spanne statt Summe) – **Regel bleibt Owner-Blocker** |
| P0/P1 | ROI-Rechner: Zeitwert als Cash, Doppelzählung, Kapazität, Eingabefehler | **neu modelliert** (drei Bausteine, 71 Kerntests) |
| P1 | Claims/Quellen (Notfall-Erkennung, 39 %, vzbv, Hälfte, Normalfall, Besetztzeichen, „..") | **korrigiert**; vzbv-Original nicht abrufbar → NOT VERIFIED |
| P1 | Rollen: Praxen-Router, Arzt-Dopplung, Flagship-Wiederholung, Regensburg-Garantie, Descriptions | **umgesetzt**, minimal |
| P2 | Webdesign-Projektbelege | **OWNER TODO**, nichts erfunden |
| P2/P3 | Autorität außerhalb des Codes | `FINAL_EXTERNAL_AUTHORITY_PLAN.md` |

## Gesicherte Befunde vs. Annahmen

**Gesichert (reproduziert oder aus dem Export):**
- HEAD 500 ist die Folge von `response.text()` auf einer bodylosen HEAD-Antwort plus
  Dokumentprüfung; der Unit-Test reproduziert 4/6 rote Fälle am alten Code.
- `waehleSzenario` wählt den günstigsten Tarif ohne Deckel für EINEN Monatswert;
  1.000 × 2 Min → MVZ 800 € (Basis mit Deckel 500 € wäre rechnerisch niedriger).
- `monatlichGesamtEur` addierte den Sprachaufschlag immer; der Dateikopf behauptete das Gegenteil.
- Alter ROI: 300 × 2 Min, 100 %, 50 €/h, 0 verpasste → +161 €/Monat, 9,3 Monate „hereingeholt" aus
  reinem Zeitwert (im Kern nachgerechnet: 500 − 339).
- GSC 24.09.–21.10.: 9 Klicks / 6.448 Impr. / Pos. 35,9; Seiten- und Querytabelle wie im Auftrag;
  `/ki-telefonassistent-praxis` nicht in der Seitentabelle; Geräte 4.692 / 1.668 / 88 domainweit.
- Arzt-Seite im Prerender: „Terminwunsch..", „verwendet..", „nicht.." (Join auf Sätze mit Punkt).

**Annahmen (so benannt, nicht als Fakt verwendet):**
- Die 500 kommt in Produktion auf *jeder* prerenderten Route – aus dem Codepfad geschlossen,
  nur `/ki-telefonassistent-arzt` wurde im Review beobachtet.
- vzbv-Formulierung („befragte Nutzer von Terminportalen") folgt dem Review-Befund; Original
  nicht geöffnet.
- Kein Query×Page: alle Eigentümer-Zuordnungen sind Inhaltsentscheidungen.

## GSC- und SERP-Lücken (REQUIRED INPUT)

Query×Page mit identischem Fenster/Filtern; vergleichbare Vorperiode; von Google gewählter
Canonical und Indexstatus für `/webdesign`, `/webdesign-agentur-deutschland`,
`/ki-telefonassistent-praxis`; geordnete deutsche Top-10-Snapshots je Query (Standort, Gerät,
Datum); Backlink-Baseline. Ohne sie: keine 301, keine Löschung, keine Top-3-Gap-Analyse.

## Query Ownership

Siehe `FINAL_KEYWORD_OWNERSHIP.md`. Kurz: Flagship = Kategorie; Kosten = Preis; Praxen = Router;
Arzt / Zahnarzt / Therapie = Segmente; Blog = informational; Webdesign-Pillar = Ziel der 301;
Regensburg-Relaunch geschützt.

## URL-Tabelle

| URL | Urteil | Problem (Review) | Was getan wurde | SEO-Risiko | Priorität |
|---|---|---|---|---|---|
| `/ki-telefonassistent-arzt` | ÄNDERN → **geändert, gezielt** | HEAD 500; Dopplung mit `/praxen`; „Hälfte", Notfall-Erkennung, „.."; Description ohne Bedingung | HEAD-Fix; Patientensicht-Abschnitt entfernt; Claims korrigiert; Join repariert; Description mit Kalenderweg. 9 Anrufanlässe, Regeln, FAQ, Struktur unverändert; kein Rewrite | mittel (Head/Body des SEO-Branches wirken gleichzeitig) | P0 Technik / P1 Inhalt |
| `/kosten-ki-telefonassistent` | ÄNDERN → **geändert** | Tarifwahl ohne bestätigte Regel; Sprachaufschlag; Description „gedeckelte Rechnung", „Zwei-Wochen-Garantie" | Rechner (gemeinsame Komponente), Description. Titel/H1 erhalten | hoch bei falschen Preisen → Owner-Blocker bleibt | P0 |
| `/ki-telefonassistent-zahnarztpraxis` | GRÜN → **unverändert** | — | nur gemeinsame `GRENZEN`-Korrektur wirkt; Finder im Code angepasst, damit der Build läuft | hoch bei Umbau – keiner erfolgt | P1 Schutz |
| `/ki-telefonassistent` | ÄNDERN → **geändert** | Rechner; Wiederholungen; „Eingesetzt in Branchen"; „sofort wieder frei"; FAQ-Dopplung | Rechner neu; Hero-Absätze zusammengeführt; Formulierungen korrigiert. Titel/H1/Anker unverändert; Kostenblock existiert im Rechner | mittel | P0 Rechner / P1 |
| `/praxen` | ÄNDERN → **geändert** | Router am Ende; wie zweite Arztseite | „Welche Praxis sind Sie?" nach dem Hero; GKV-Zahl korrekt attribuiert; vzbv präzisiert. Head/H1 unverändert | mittel | P1 |
| `/webdesign` | ÄNDERN → **teilweise** | Description zu lang; Projektbelege fehlen | Description verdichtet; Belege: OWNER TODO, kein Platzhalter | niedrig | P2 |
| `/regensburg/website-relaunch` | ÄNDERN, punktuell → **geändert minimal** | Title/Lead/Tag/FAQ garantierten Ranking-Erhalt | Garantien → Ziel + Restrisiko; Title „Modernisierung & SEO-Migration"; H1/Struktur/Preise unverändert | hoch; kleinster Diff; nicht zurückrollen | P1 Schutz |
| `/webdesign-agentur-deutschland` | GRÜN | — | 301 getestet (Unit, wrangler, prerender-Skript) | niedrig | P1 Regressionstest |
| Rechner (alle Instanzen) | ÄNDERN → **geändert** | Geschäftsregeln, Semantik, Eingaben | ein Kern, eine Komponente, zwei Darstellungen; Kompaktfassung rechnet identisch | hoch Vertrauen | P0 |
| `/ki-telefonassistent-praxis` | GRÜN | nicht im Export | unverändert; keine 301 ohne Query×Page | — | — |

Kein ZURÜCKROLLEN-Urteil vergeben: Keine Änderung des SEO-Branches war so fehlerhaft, dass eine
Rücknahme sicherer gewesen wäre als die Korrektur.

## Rechnermodell und freigegebene Business Rules

**Eingaben** (alle `null` = leer, nie 0; Prozent 0–100 geklemmt; Mengen ganzzahlig gerundet;
Feld-Max getrennt vom Slider-Max):

| Baustein | Pflicht | Optional |
|---|---|---|
| Preis | Anrufe/Monat, Minuten/Anruf (KI-Gespräch) | Zusatzsprachen 0–3 |
| A Zeit | Teamanrufe heute, Team-Bearbeitungsminuten, übernommener Anteil % | Restaufwand % (leer → „bedingt"), Stundensatz € (nur Zeitwert) |
| B Kosten | tatsächlich entfallende Ausgaben €/Monat (0 gültig) | — |
| C Termine | zusätzliche wahrgenommene Termine, Deckungsbeitrag € | freie Kapazität (leer → nur Potenzial) |

**Formeln:** Minuten = Anrufe × Dauer · Telefonie = min(Grundpreis + Mehrminuten × 0,39 €,
Obergrenze) je Tarif · Zuordnung = günstigster Tarif ohne Deckel (veröffentlichte Regel, auf einen
Monatswert; Vergleich aller drei offengelegt) · Summe = Telefonie + Sprachaufschlag nur wenn ≤
Obergrenze, sonst Spanne [Obergrenze, Telefonie + Aufschlag] · Netto-Teamzeit = Anrufe × Minuten ÷
60 × übernommen % × (1 − Restaufwand %) (kann negativ = Mehrarbeit) · Zeitwert = Netto-Teamzeit ×
Stundensatz (nie im Saldo) · Realisierbarer Beitrag = min(Termine, Kapazität) × Deckungsbeitrag ·
Geldsaldo = B + C(realisierbar) − bekannte laufende Kosten · Erstjahr = 12 × Saldo − Einrichtung
(12 gleiche Monate benannt) · Amortisation = Einrichtung ÷ Saldo, nur Saldo > 0 und Kosten bekannt
· ROI-% wird nicht ausgewiesen (kein belastbarer Nenner).

**Einheiten/Basis:** Euro wie Preisliste; Steuerbasis laut Angebot (J8 offen); Zeit in Stunden/Monat.
**Offene Kosten:** Anbindung/Drittanbieter – immer als offen, nie 0; jede Summe „bekannte Kosten".
**Nicht modelliert:** Saison, Standorte, Steuern, Liquidität, gemessene Quoten.
**Beispielausgabe (Testfixture):** 300 × 2 Min: Basis, 339 €/Monat, 1.490 € Einrichtung; B 600 € +
C 5 × 40 € (Kapazität 8) → Saldo 461 €/Monat, Erstjahr 4.042 €, 3,23 Monate; Konflikt B∧C gemeldet.
**Testmatrix:** `src/lib/telefonassistent-rechner.test.ts` (71), `…grenzfaelle.test.ts`,
`src/lib/rechner-konsistenz.test.tsx`, `src/pages/KiTelefonassistentPage.rechner.test.tsx`,
`src/pages/costs/KostenKiTelefonassistent.test.tsx`, `src/components/homepageVerdichtung.test.tsx`.
**Freigegebene Business Rules:** nur die in `FAKTEN`/`TARIFE`/`SPRACHEN_PREISE` veröffentlichten
Beträge und Sätze. **Nicht freigegeben:** J1–J8.

## Geschützte Seiten

Dental (keine Änderung), Regensburg-Relaunch (nur Garantie-Korrektur), `/webdesign-hotel`
(unverändert), Homepage-Titel (unverändert).

## Restrisiken

1. Tarifregeln unbestätigt → Preisangaben können im Vertrag anders ausfallen (deshalb NOT READY).
2. Edge-Verhalten nicht live verifiziert (Netzwerk gesperrt); Preview-`X-Robots-Tag: noindex` muss
   produktionsseitig fehlen – im Repo gibt es keinen Preview-Sonderpfad, die Umgebung setzt ihn.
3. Echtes Mobile-Rendering (360/390/768) nicht geprüft: kein Browser-Screenshot-Lauf möglich;
   nur Hydration-Headless-Test. NOT VERIFIED in `RELEASE_CHECKLIST.md`.
4. Gleichzeitige Head- und Körperänderungen auf `/ki-telefonassistent-arzt` (SEO-Branch + dieser)
   erschweren die Zuordnung in GSC; Messzeilen im Scoreboard benennen das.
5. vzbv-Attribution nicht am Original geprüft.

## Owner-Inputs (blockierend / nicht blockierend)

Blockierend für Release: J1–J8 (`OWNER-INPUT.md`). Nicht blockierend, aber nötig für Inhalte:
Projektbelege Webdesign, Kundenfreigabe, Hörprobe, Screenshot, PVS-Antworten, Backlink-Baseline,
Query×Page-Export, SERP-Snapshots, GSC-Canonical-Prüfung, J9-Bestätigung.

## Externe Aufgaben

`FINAL_EXTERNAL_AUTHORITY_PLAN.md`.
