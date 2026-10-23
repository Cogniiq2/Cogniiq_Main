# FINAL_KEYWORD_OWNERSHIP — Intent-Eigentümer (Stand 2026-10-23, Korrekturdurchgang)

Datenbasis: GSC-Export `cogniiq.de-Performance-on-Search-2026-10-23.zip`, Tagesfenster
24.09.–21.10.2026, Suchtyp Web, **kein Query×Page**. Deshalb gilt für jede Zeile: Die
Zuordnung Query → Seite ist eine **Inhaltsentscheidung**, keine gemessene. Echte
SERP-Kannibalisierung ist bislang nicht nachgewiesen, semantische Überschneidung schon.

Keywords dürfen natürlich in mehreren Texten vorkommen. Entscheidend sind Intent,
Seitentyp, Titel/H1, Schwerpunkt und kontextuelle Verlinkung – kein Verbot gleicher Wörter.

| Intent / Queryfamilie | Eigentümer | Rolle | GSC-Signal (28 d) | Unterstützende Seiten | Kontextuelle Links (Ist) | Query×Page-Validierung |
|---|---|---|---|---|---|---|
| ki telefonassistent, telefonassistent (generisch) | `/ki-telefonassistent` | Produkt-/Kategorie-Hub | 272 Impr., Pos. 39,6, 1 Klick; „ki telefonassistent" 49 / 42,8 | Kosten, Praxen, Integrationen, Einführen | → Kosten (Rechner), Praxen, Arzt, Zahnarzt, Therapie, Restaurant, Hotel, Integrationen | **offen** |
| kosten, preise, was kostet ein ki telefonassistent | `/kosten-ki-telefonassistent` | Preis-Owner | 299 Impr., Pos. 19,1, 1 Klick; „ki telefonassistent kosten" 143 / 19,2; „… preise" 33 / 17,8 | Flagship (Kostenblock), Arzt, Zahnarzt | ← Flagship, Arzt, Zahnarzt, Praxen, Nav; → Zahnarzt, Einführen, Flagship | **offen** |
| praxis, telefonassistent praxis, Auswahl Praxisform | `/praxen` | Hub / Router | 48 Impr., Pos. 55,9; „telefonassistent praxis" 34 / 39,4; „ki telefonassistent praxis" 24 / 41,8 | Arzt, Zahnarzt, Therapie | → drei Segmentseiten direkt nach dem Hero (neu), Kosten, Flagship | **offen** |
| arztpraxis, telefonassistent arztpraxis, telefonassistent arzt | `/ki-telefonassistent-arzt` | SEGMENT | 471 Impr., Pos. 35,4, 0 Klicks; „ki telefonassistent arztpraxis" 111 / 40,3; „telefonassistent arztpraxis" 83 / 34,3; „telefonassistent arzt" 42 / 25,7 | Blog Arztpraxis, Einführen, Integrationen | ← Praxen, Flagship, Nav, Zahnarzt, Blog; → Praxen, Kosten, Zahnarzt, Einführen, Integrationen, Datenschutz | **offen** |
| zahnarztpraxis, zahnarzt | `/ki-telefonassistent-zahnarztpraxis` | SEGMENT, geschützt | 85 Impr., Pos. 8,9, 0 Klicks; Dental-Queries 5 / 24,8 · 3 / 19,7 · 2 / 26,5 – die Seitenposition 8,9 belegt **keine** Top-10 für das Hauptkeyword | Arzt, Kosten | ← Praxen, Arzt, Flagship, Nav, Kosten; → Arzt, Kosten | **offen** |
| physiotherapie, ergotherapie, logopädie (vorläufig) | `/ki-telefonassistent-praxis` | SEGMENT, vorläufig | nicht in der Seitentabelle – kein Nachweis fehlender Nachfrage | Praxen | ← Praxen, Flagship, Nav | **offen**; keine 301 ohne Query×Page |
| informational „was beim Team bleibt" | `/blog/ki-telefonassistent-arztpraxis` | REDAKTION | — | Arzt | → Arzt, Kosten | — |
| ki telefonassistent einführen | `/ki-telefonassistent-einfuehren` | REDAKTION | — | Arzt, Zahnarzt, Kosten | ← Arzt, Kosten, Zahnarzt | — |
| webdesign agentur, unternehmenswebsite | `/webdesign` | PILLAR | 3 Impr., Pos. 66 | Kosten Webdesign, Branchen, Städte | ← `/webdesign-agentur-deutschland` (301, 1 Impr. / Pos. 9 im Export – die alte URL wurde im Fenster noch ausgespielt) | Index-/Canonical-Prüfung in GSC **offen** |
| website relaunch regensburg, homepage relaunch regensburg | `/regensburg/website-relaunch` | lokal, geschützt | 331 Impr., Pos. 10,9; Queries 82 / 5,8 und 54 / 5,8 | Webdesign | ← Regensburg-Hub, Webdesign | geschützt; nur Garantie-Korrektur |
| webdesign hotel | `/webdesign-hotel` | Branche, sekundär | 1.184 Impr., Pos. 17,7, 0 Klicks | — | — | unverändert |

## Was aus dem Export NICHT folgt

- Dass Konsolidierung kausal Rankings verbessert hat (Query-/Seitenmix verschiebt
  den Aggregatdurchschnitt).
- Dass Position 19 „einen Rang von Seite 1" entfernt ist.
- Dass null Klicks falsche Käufer, fehlende Nachfrage oder schlechte Conversion beweisen.
- Dass Praxisbesucher Desktop-Nutzer sind: 4.692 Desktop-, 1.668 Mobile-, 88
  Tablet-Impressionen gelten für die ganze Domain, nicht für das Praxis-Segment.

## REQUIRED INPUT für jede weitere Konsolidierung

Query×Page mit identischem Zeitraum, Suchtyp und Land-/Gerätefilter; vergleichbare
frühere Zeiträume; Google-selected canonical / Indexierungsdaten für `/webdesign`,
`/webdesign-agentur-deutschland`, `/ki-telefonassistent-praxis`. Keine URL-Löschung
oder 301 allein aus semantischer Ähnlichkeit.
