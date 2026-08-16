# HONESTY-AUDIT — Repo-weites Ehrlichkeits-Audit (Pass 2, Phase 1)

Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Scope: alle Seiten, Configs, Komponenten, Copy-Konstanten, `public/`, Meta/OG,
JSON-LD, Formular-Texte. Problemklassen nach Brief II §3:
**[1]** Zahl ohne Quelle · **[2]** Beispielprojekt im Kundencase-Look ·
**[3]** verbotenes Wort · **[4]** Absolutversprechen · **[5]** Wettbewerber-Bezug ·
**[6]** ungedeckter Social Proof · **[7]** Testimonial-Problem · **[8]** unbestätigte Compliance-Aussage.

Gesamtbefund: **~550 Einzeltreffer** in 95+ Dateien. Alle als **Blocker** und
**should-fix** eingestuften Befunde sind behoben (Commits `a3e780f`…`2a3bf68`);
kosmetische Befunde sind dokumentiert und bewusst belassen.

## 1. Blocker (alle behoben)

| Datei | Befund (Klasse) | Fix |
|---|---|---|
| `src/hooks/useAvailability.ts` + `FinalCTASection.tsx` | **Fabrizierter Knappheits-Zähler**: pseudozufälliges „N Plätze frei" als Live-Zustand gerendert [1][6] | Hook gelöscht, Badge entfernt (`ec27865`) |
| `components/hero/DesktopHero.tsx` | H1 „Kein Anruf mehr verpasst. Kein Lead verloren."; „nimmt jeden Anruf an … Kein Kunde verloren" [4] | begrenzte Erreichbarkeits-Formulierung (`9d4602a`) |
| `components/StatsSection.tsx` | „Kein Anruf geht verloren", „Jeder Anruf wird angenommen", „Während Wettbewerber schlafen" [4][5] | begrenzt; Wettbewerber-Zeile ersetzt |
| `components/KiCTASection.tsx` | H2 „Jeder Anruf beantwortet. Jeder Termin gebucht. Automatisch.", „übernimmt jeden Anruf … vollautomatisch" [3][4]; gescriptetes Transkript als „Live Gespräch" mit rotem Puls-Punkt [2] | begrenzt; Label „Beispielgespräch", Puls entfernt |
| `components/SolutionShowcase.tsx` | Erfundene benannte Betriebe in Dialogen („Praxis Dr. Müller", „Ristorante Bella Vista", „Hauptstraße 12") [2][7]; „Live-Demo"-Label mit Puls über Skript [2]; „No-Show-Rate drastisch reduziert" [1] | generalisiert, Label „Beispielgespräch", Wirkaussagen mechanisch formuliert |
| `components/AboutSection.tsx` vs. `seo-data.ts`/`index.html` | Widersprüchliche, unbestätigte Gründer-Spezialisierungen als Fakt über reale Personen [7] | neutrale „Gründer"-Rollen, Spezialisierung als [[CLAIM]] geparkt |
| `lib/seo-data.ts` (PAGE_META) | Homepage-/Leistungen-Description: „Kein Anruf geht verloren", „jeden Anruf beantwortet", „eliminiert" [4] — auch in OG + JSON-LD dupliziert | begrenzt (`9d4602a`) |
| `lib/blog-data.ts` | Fabrizierte Studienzitate (Harvard Business Review 7×, KfW-Studie, „80 % der Patienten akzeptieren"), **„Triage"-Fähigkeitsbehauptung**, Gehaltsvergleiche als Ersatzrechnung, ROI-Musterrechnungen als Fakt [1][2][4] | Zitate entfernt/durch freigegebene Stats ersetzt (vzbv 2025), Triage gestrichen, Rechnungen als „frei erfundenes Rechenbeispiel" gekennzeichnet (`2a3ded9`) |
| `pages/problems/VerpassteAnrufePage.tsx` | Hochrechnung „375.000 € pro Jahr" aus erfundenen Annahmen [1]; „Kein Anruf geht mehr verloren" [4] | Hochrechnung gelöscht → „rechnen Sie mit Ihren eigenen Zahlen"; begrenzt |
| `pages/BayernKiTelefonassistentPage.tsx` | „Nie wieder Anrufe verpassen", „Jeder Anruf wird beantwortet" [4]; implizite Kundenbasis-FAQ [6]; engl. „Made for Mittelstand" [3] | begrenzt, FAQ auf Eignung umformuliert (`6eac52b`) |
| `pages/industries/KiTelefonassistentHotel.tsx` | „100 % Marge" [3], „fünfstellige Einsparungen" aus Musterrechnung [1], „Keine verpassten Direktbuchungen mehr" [4] | begrenzt; Rechnung → „mit Ihren eigenen Zahlen" (`a3e780f`) |
| `pages/industries/KiTelefonassistentRestaurant.tsx` | „Kein verpasster Tisch mehr" [4], „90 Sekunden", „3–4 Minuten" [1], „skaliert ohne Limit" [4] | begrenzt (`a3e780f`) |
| `components/ROICalculator.tsx` | „Typisch: 25–50 €/h" Marktsatz [1]; „konservativ … Realität oft höher" als Faktenbehauptung [1]; „durch vollständige Automatisierung zurückgewinnbar" [3-nah] | Rechner arbeitet erklärtermaßen nur mit Besucher-Eingaben; Presets als freie Beispielwerte deklariert (`f61a1de`) |
| `components/CostComparisonSection.tsx` | Fixpreis 297 € widerspricht publizierten Staffeln [1]; „Unbegrenzte gleichzeitige Anrufe", „kündbar monatlich" unbestätigt [4] | als Beispielwert gekennzeichnet + [[CLAIM]]; begrenzt |
| `standorte-service-configs.ts` (Automatisierung/Webdesign) | 10 konstruierte Kundencases mit realen Stadtvierteln + Leistungszahlen („100 Bestellungen/Tag", „unter 2 Minuten", „innerhalb von 8 Wochen auf ersten Positionen") [1][2]; massierte München-Jabs („Münchner Agenturpreise", „Büroräume in der Maximilianstraße", „drei Hierarchieebenen") [5]; Wix/Jimdo namentlich [5] | Zahlen qualitativ, Jabs → neutrales Remote+Festpreis-Framing, Markennamen entfernt (`612b994`) |

## 2. Should-fix (behoben)

- **Absolutversprechen-Langschwanz** in UeberUns, Leistungen, Bayern, Deutschland,
  Problems-, Pillar-, Industrie- und Webdesign-Stadtseiten („Kein Lead geht
  verloren", „kein Patientenanruf mehr unbeantwortet", „werden nie wieder…",
  „Kein Anrufer landet im Besetzton") → begrenzt (`0314dcb`).
- **`vollautomatisch`/`nahtlos`** repo-weit (~30 Instanzen außerhalb des in
  Pass 1 bereinigten Clusters) → ersetzt.
- **Unbelegte Wirkaussagen** („erhöht Bewertungsrate messbar", „reduziert
  Kündigungen nachweisbar", „< 60 Sekunden", „20–30 Anrufe rentiert sich") →
  qualitativ bzw. „rechnen wir mit Ihren Zahlen".
- **Trust-Optik ohne Substanz**: „Meistgebucht"-Badge → „Im Fokus"; Award-Icon
  im TrustStrip → neutrales Icon; „Made in Bavaria" → „Aus Bayreuth";
  „Was uns von anderen Agenturen trennt" → „Wie wir arbeiten".
- **Demo-Seite**: „Jetzt Demo-Termin sichern" (Verknappungsmuster) → entfernt.
- **Zeit-/Reaktionsversprechen** (7–14 Tage, 24 h) → überall „in der Regel/
  typischerweise" + [[CLAIM]]-Codekommentar (OWNER-INPUT E1/D3); im Review-Modus
  sichtbar umrandet.

## 3. Dokumentiert, bewusst belassen (kosmetisch / zulässig)

- **Publizierte Orientierungspreise** („ab ca. 1.500 €", Staffeln, Wartungspakete)
  — zulässige eigene Preisangaben; Bestätigung via OWNER-INPUT A.
- **Dauerangaben** („4–6 Wochen", „1–3 Wochen") — publizierte Projektzeiträume,
  als Claims gelistet.
- **„Angenommen, …"-Beispielszenarien** der Webdesign-Stadtseiten — bereits als
  hypothetisch gekennzeichnet; Komponente `IndustryPage` labelt zusätzlich
  „Beispielszenario … so könnte ein Projekt ablaufen".
- **Kategorie-Vergleich „Professionell vs. Baukasten"** — objektiver
  Produktkategorien-Vergleich ohne Anbieternennung (UWG-zulässig); Markennamen
  wurden entfernt.
- **Marktdruck-Beschreibungen** („die Konkurrenz ist digital gut aufgestellt")
  — beschreiben das Risiko des Kunden, nicht Herabsetzung eines Wettbewerbers.
- **Puffery ohne Tatsachenkern** („Websites, die konvertieren", „Design, das
  verkauft") — als kosmetisch eingestuft, Ton-Frage für eine Folgerunde.
- `ReferenzenPage`/`BewertungenPage`: rendern **keinen** erfundenen Content;
  einzige Kundenstimme ist `REAL_TESTIMONIAL` (siehe unten).
- **Review-Lenkung** („Positives Feedback wird in Richtung Google-Bewertung
  gelenkt", Gastronomie-Seiten): rechtlich umstrittenes Muster (Review-Gating)
  — **Empfehlung: entfernen**; Entscheidung beim Inhaber, da Funktionsbeschreibung
  eines bestehenden Angebots. → COPY-GAPS.md.

## 4. Offene Punkte mit Inhaber-Abhängigkeit

| Punkt | Abhängigkeit |
|---|---|
| `REAL_TESTIMONIAL` (SV Heinersreuth, anonymer „Betreiber") wird auf Referenzen-/Bewertungen-Seite gerendert. Als „real" markiert, aber schriftliche Einwilligung nicht im Repo nachweisbar. | OWNER-INPUT F3: Einwilligung nachweisen oder Zitat entfernen. Bis dahin unverändert belassen (kein Platzhalter, möglicherweise echt). |
| Art.-50-Ansage („Anrufer erfahren zu Beginn…") steht seit Pass 1 auf allen Telefonassistent-Seiten. | OWNER-INPUT C1. Bei „NEIN" wird die Aussage sofort entfernt — Suchanker: `Sprachassistent` in `telefonassistent-copy.ts`, Seiten-Configs und Workflow-Steps. |
| JSON-LD `areaServed` (10+ Städte) und `priceRange: "€€€"` in `index.html`/`LocalBusinessSchema` | Service-Gebiet ist als Absichtserklärung vertretbar; Bestätigung empfohlen (OWNER-INPUT G2-nah). |
| Blog-Preisspannen und verbleibende Faustregeln („1–3 % der Besucher") | explizit als Faustregel gekennzeichnet; bei Bedarf entfernen. |

## 5. Positivbefunde

- Kein `aggregateRating`, `Review`, `ratingValue` oder Sterne-Markup irgendwo
  im JSON-LD (bewusste Auslassung ist in `BewertungenPage` kommentiert).
- Keine Logo-Wände, keine Kundenzähler, keine Zertifikats-/Partner-Siegel.
- `public/` (robots, headers, redirects, sitemap) frei von Marketing-Claims.

Vollständige Roh-Kataloge beider Scan-Läufe (jede Fundstelle mit Zeile und
Originaltext) liegen den Commits dieser Phase zugrunde; diese Datei ist die
konsolidierte, priorisierte Fassung.
