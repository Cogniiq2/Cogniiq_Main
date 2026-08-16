# COPY-GAPS — Offene Punkte und Inhaberentscheidungen

Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4`

## 1. Seiten außerhalb dieses Durchlaufs (Entscheidung / Folgerunde)

| Seite | Empfehlung |
|---|---|
| `/` (Homepage) | Die Homepage bedient alle drei Leistungsbereiche (Webdesign, Automatisierung, Telefonassistent). Der Brief verlangt eine Healthcare-zentrierte Erzählung — das wäre eine strategische Neupositionierung der Startseite und braucht eine Inhaberentscheidung. Bis dahin: mindestens Absolutversprechen und verbotene Wörter in Hero-/Stats-Komponenten prüfen (`src/components/hero/`, `StatsSection.tsx`). |
| `/bayern/ki-telefonassistent` | Gleiche Regeln wie die Stadtseiten anwenden (Folgerunde, ~2.300 Wörter). |
| `/ki-telefonassistent/demo` | Copy eng mit Demo-Komponente verzahnt; nach demselben Regelwerk prüfen. |
| `/verpasste-anrufe-verlust`, Blog | Auf erfundene Zahlen prüfen und auf die Voice-Spezifikation heben. |
| `/ki-telefonassistent-hotel`, `/ki-telefonassistent-restaurant` | Nicht-Gesundheits-Segmente; Banned-Word- und Absolutversprechen-Pass empfohlen (z. B. auf "vollautomatisch" prüfen). |

## 2. Vom Brief gefordert, im Repo nicht vorhanden (Inhaberentscheidung: anlegen?)

Der Brief beschreibt Seiten, die es in der aktuellen Sitestruktur nicht gibt.
Da URL-Struktur nicht ohne Auftrag geändert werden darf (§1, §8.1), wurden sie
nicht angelegt:

- **Integrationen/PVS-Seite** (§7.5) — wichtigste fehlende Seite für Einwand #2
  ("lässt sich nicht in mein PVS integrieren"). Braucht die verifizierte
  Anbindungsliste in drei Stufen (direkt / über Schnittstelle / auf Anfrage).
- **Datenschutz & Sicherheit als Marketingseite** (§7.6) — aktuell existiert nur
  die rechtliche Datenschutzerklärung. Die S4-Inhalte (§ 203 StGB, § 201 StGB,
  Sub-Auftragsverarbeiter, Hosting, kein Training auf Patientendaten) haben
  keinen dedizierten Ort; sie sind derzeit auf FAQ-Antworten verteilt.
- **Gesundheits-Segmentseiten** Hausarzt / Facharzt / Zahnarzt & KFO / MVZ
  (§7.7) — es existieren nur "Arzt" und "Praxis/Therapie". Zahnarzt-Recall und
  MVZ-Mehrstandort-Routing sind unbesetzte, evidenzgestützte Themen.
- **About/Warum-Cogniiq-Inhalte zum Betreuungsmodell** (§7.8) — `UeberUnsPage`
  existiert, adressiert aber Einwand #6 (Support setzt Wünsche nicht um) nicht
  mit konkretem Prozess (wer, wie schnell, wie werden Änderungen umgesetzt).

## 3. Fehlende Belege, die nur der Inhaber liefern kann

- **Echte Testimonials:** Es existieren keine Kundenstimmen im Cluster. Der
  Brief verbietet erfundene; Referenzseite (`/referenzen`, `/bewertungen`)
  wurde nicht angetastet. Echte, freigegebene Zitate wären der stärkste
  fehlende Vertrauensbaustein.
- **Eigene Messwerte:** Übernahmequote (konservativ, netto nach Nacharbeit),
  typische Einrichtungsdauer, Reaktionszeiten im Support. Ohne diese Werte
  bleibt die Seite bewusst zahlenarm.
- **Formular-Folgeprozess:** "Was passiert nach dem Absenden, in welchem
  Zeitfenster?" (§10) konnte mangels bestätigter Reaktionszeit nicht
  beziffert werden.
- **Lokale Fakten:** Für die Stadtseiten wurden nur öffentlich verifizierbare
  Anker verwendet (Festspiele, UNESCO-Altstadt, Uniklinikum). Konkretere lokale
  Gesundheitsstruktur-Daten (Praxisdichte o. Ä.) lagen nicht vor.

## 4. Bekannte Einschränkungen dieses Durchlaufs

- `graphify update .` konnte nicht ausgeführt werden — kein graphify-Binary im
  Container und kein `graphify-out/` im Repo-Stand dieses Branches.
- Die `[[CLAIM]]`-Marker stehen als Code-Kommentare neben den betroffenen
  Stellen (nicht im gerenderten Text): Sichtbare englische Marker würden gegen
  die Sprachregel (§0) verstoßen und auf Cloudflare-Previews erscheinen. Die
  vollständige Liste steht in `COPY-CLAIMS-TO-VERIFY.md`.
- Der Sprachassistenz-Hinweis nach Art. 50 KI-VO wird im Copy als Produktfakt
  beschrieben (A6 in der Claims-Liste). Sollte das Produkt den Hinweis heute
  nicht sprechen, muss entweder das Produkt nachziehen oder die Aussage raus —
  Dritte Option gibt es nicht, die Pflicht gilt unabhängig vom Marketing.
