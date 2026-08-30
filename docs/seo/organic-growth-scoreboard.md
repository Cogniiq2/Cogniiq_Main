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
| KI Telefonassistent Praxis/Arztpraxis | `/praxen` | schwach | Top 50 |
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
