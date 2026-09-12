# Preis-Wahrheitstabelle — `/kosten-ki-telefonassistent` und der kanonische Rechner

Stand 12.09.2026. Erstellt VOR der Copy-Korrektur an der Obergrenze, damit die
Korrektur an einer Tabelle gemessen werden kann und nicht an einem Eindruck.

**Kanonische Quelle für jede Zahl:** `src/lib/telefonassistent-copy.ts`
(`TARIFE`, `FAKTEN`, `SPRACHEN_PREISE`, `TARIF_ENTERPRISE`). In
`src/lib/telefonassistent-rechner.ts` steht kein Betrag als Literal.

**„Im Rechner-Gesamtbetrag?"** meint: geht die Position in
`monatlichGesamtEur` bzw. `einrichtungEur` ein.
**„In der Telefonie-Obergrenze?"** meint: begrenzt `obergrenzeEur` diese
Position. `BESTÄTIGT` nur, wo die Preislogik es beweist; sonst `OFFEN`.

| # | Position | Kanonische Quelle | Wert | Statische Seite | Rechner | Im Rechner-Gesamtbetrag? | In der Telefonie-Obergrenze? | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Grundpreis Basis | `TARIFE[0].monatlichEur` | 300 € / Monat | Tarifkachel „300 €" | `szenario.tarif.monatlichEur` | ja | **ja** | BESTÄTIGT |
| 2 | Grundpreis Praxis | `TARIFE[1].monatlichEur` | 500 € / Monat | Tarifkachel „500 €" | dito | ja | **ja** | BESTÄTIGT |
| 3 | Grundpreis MVZ | `TARIFE[2].monatlichEur` | 800 € / Monat | Tarifkachel „800 €" | dito | ja | **ja** | BESTÄTIGT |
| 4 | Inklusivminuten | `TARIFE[n].minuten` | 500 / 1.000 / 2.000 | Tarifkachel | `szenarioFuer()` | — (Mengengerüst) | — | BESTÄTIGT |
| 5 | Mehrverbrauch je Minute | `FAKTEN.mehrpreisProMinuteEur` | 0,39 € | „jede weitere Minute 0,39 €" | Zeile „Mehrverbrauch" | ja | **ja** | BESTÄTIGT |
| 6 | Telefonie-Obergrenze | `TARIFE[n].obergrenzeEur` | 500 / 800 / 1.400 € | Liste „Telefonie höchstens … im Monat" | Zeile „Telefonie pro Monat" | ja | ist die Grenze | BESTÄTIGT — gilt für **Grundpreis + Mehrverbrauch** (`szenarioFuer`: `min(monatlich + mehrverbrauch, obergrenze)`) |
| 7 | Einrichtung | `TARIFE[n].einrichtungEur` | 1.490 / 2.490 / 3.490 € | Tarifkachel | Zeile „Einmalige Einrichtung" | ja (einmalig) | **nein** — einmalig, nicht monatlich | BESTÄTIGT |
| 8 | Eine Zusatzsprache | `SPRACHEN_PREISE.proSpracheEur` | 79 € / Monat | „Eine weitere Sprache kostet 79 €" | Zeile „Zusatzsprachen pro Monat" | ja | **OFFEN** | Preis BESTÄTIGT, Zuordnung zur Obergrenze OFFEN |
| 9 | Zwei oder mehr Zusatzsprachen | `sprachenAufschlagEur()` → `OFFEN` | **kein Betrag** | „Paketpreis … im schriftlichen Angebot" | Zeile „noch offen"; Gesamtbetrag wird `UNBEKANNT` | nein — Summe wird unbezifferbar | **OFFEN** | OFFEN (OWNER-INPUT H3) |
| 10 | Aufschlag monatliche Kündbarkeit | `FAKTEN.monatlichAufschlag` / `FAKTEN.laufzeit` | 20 % | „zahlt 20 % Aufschlag" | als Regel genannt, **nicht gerechnet** | nein | **OFFEN** | Regel BESTÄTIGT, Bemessungsgrundlage OFFEN (Grundpreis? Mehrverbrauch? Obergrenze? Einrichtung?) |
| 11 | Kundenspezifische Anbindung | `PreisErgebnis.anbindungEur` | `UNBEKANNT` | „nach der technischen Prüfung" | Zeile „noch offen" | nein | **OFFEN** | OFFEN — nie als 0 dargestellt |
| 12 | Gebühren Dritter für eine Schnittstelle | dito (in Position 11 enthalten) | `UNBEKANNT` | im selben Hinweis | im selben Hinweis | nein | **OFFEN** | OFFEN |
| 13 | Enterprise | `TARIF_ENTERPRISE` | **ab** 5.000 € / Monat | Fließtextzeile | `modus: "individuell"`, kein Betrag | nein — Summe wird `UNBEKANNT` | — | BESTÄTIGT als Untergrenze, kein berechenbarer Preis |
| 14 | Preisgarantie | `FAKTEN.preisgarantie` | 24 Monate | genannt | genannt | — | — | BESTÄTIGT |

## Was die Tabelle über die alte Copy zeigt

Positionen 8–12 sind im Rechner seit jeher **eigene Zeilen**, teils mit
`OFFEN`/`UNBEKANNT`. Die Prosa sagte gleichzeitig „Mehr zahlen Sie in diesem
Monat nicht" und „Mehr als die ausgewiesene Obergrenze kostet es nie". Das ist
der Widerspruch: Der Rechner wies fünf Positionen aus, die die Obergrenze
nicht nachweislich begrenzt, während der Fließtext die Obergrenze als Deckel
der Endsumme verkaufte.

**Belegbar ist nur Zeile 6:** `min(Grundpreis + Mehrverbrauch, Obergrenze)`.

## Was bewusst NICHT behauptet wird

Dass die Positionen 8–12 **außerhalb** der Obergrenze liegen, ist genauso
unbelegt wie das Gegenteil. Die korrigierte Copy sagt deshalb, dass sie
separat ausgewiesen werden und dass das Angebot ihre Zuordnung festlegt — und
dass die Telefonie-Obergrenze allein noch nicht die Endsumme ist.

## Warum 339 € aus einem 300-€-Tarif kein Fehler ist

Basis = 300 € für 500 Minuten. Bei 600 Minuten: 100 Minuten × 0,39 € = 39 €
Mehrverbrauch → 339 € Telefonie, gedeckelt bei 500 €. Die Tarifkachel nennt
den **Grundpreis**, der Rechner den **Telefoniepreis bei diesem Aufkommen**.
Beide stimmen; die Seite muss den Unterschied nur benennen — das tut die
Zeile „Mehrverbrauch" zusammen mit dem Geltungssatz zur Obergrenze.
