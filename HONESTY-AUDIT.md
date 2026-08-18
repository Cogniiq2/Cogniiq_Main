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

## 1a. Expositionszeitraum — fabrizierter Knappheits-Zähler

Reine Faktenaufstellung, keine Bewertung.

| Frage | Befund |
|---|---|
| Eingeführt | Commit `3db541a`, **06.07.2026**, Commit-Nachricht „Create Execution page and Supabase integration" |
| Datei | `src/hooks/useAvailability.ts` (Generator) + `src/components/FinalCTASection.tsx` (Anzeige als bernsteinfarbenes Badge) |
| Beides im selben Commit? | Ja — Hook und anzeigende Komponente entstanden gemeinsam in `3db541a` |
| Auf `main`? | Ja. `git merge-base --is-ancestor 3db541a origin/main` = wahr |
| Gerenderte Route | **Ausschließlich `/` (Startseite)** — `FinalCTASection` wird nur von `src/pages/HomePage.tsx` eingebunden |
| Im vorgerenderten HTML? | Nein. Der Wert entsteht clientseitig in einem `useEffect`; das statische Prerender-HTML enthält den Text nicht. Sichtbar wurde er erst nach der Hydration im Browser. |
| Anzeigewert | 1–3 („N Platz/Plätze frei"), deterministisch aus dem Tag des Jahres abgeleitet (`dayOfYear * 2654435761 % 3 + 1`), zusätzlich 30 Minuten in der `sessionStorage` festgehalten |
| Entfernt | Commit `ec27865`, **16.08.2026**, auf dem Branch `claude/cogniiq-copy-overhaul-mjkdf4` |
| **Status in Produktion** | **Noch vorhanden.** `origin/main` enthält `src/hooks/useAvailability.ts` unverändert — die Entfernung liegt bislang nur auf dem Feature-Branch und wird erst mit dessen Merge wirksam. |
| Zeitraum auf `main` | 06.07.2026 bis heute (16.08.2026) = **41 Tage und andauernd** |

## 1b. Vollständigkeitsprüfung — fabrizierte Zitate und Triage außerhalb der Blogartikel

Geprüft wurden: `src/**` (inkl. Kommentare), `public/**`, `index.html`,
Meta-Tags, OG-Descriptions, JSON-LD, das Prerender-Manifest sowie
Dateianhänge. Ergebnis:

| Gesucht | Fundstellen außerhalb der Blogartikel |
|---|---|
| „Harvard Business Review" / „7× höhere Abschlusswahrscheinlichkeit" | **keine** |
| „KfW-Studie" (fabrizierte Studienzuschreibung) | **keine.** Verbleibender KfW-Treffer in `blog-data.ts:860` ist die Nennung realer Förderprogramme („KfW-Digitalisierungskredite") — keine Studienbehauptung |
| „laut einer Studie" / „Studien zeigen" o. ä. ohne Quelle | **keine** |
| „80 % der Patienten akzeptieren" | **keine.** Alle verbleibenden „80 %"-Treffer sind CSS-Gradientwerte |
| **Triage** (jede Schreibweise) | **Keine Fähigkeitsbehauptung.** Zwei Trefferklassen, beide unproblematisch: (1) `src/lib/telefonassistent-copy.ts` — ausdrückliche *Verneinung* im M15-Block („Keine medizinische Einschätzung, keine Triage, keine Beratung"); (2) `src/solutions/club-operations/**` — internes, authentifiziertes Betriebsmodul, „Triage" im softwaretechnischen Sinn (Alert-/Severity-Triage), keine öffentliche Marketingfläche |
| PDFs mit Marketingtext | **keine** — im Repository existiert keine PDF-Datei |
| `public/` | Enthält nur Icons, Logo, OG-Bild, robots.txt, _headers, _redirects, sitemap.xml. Kein Fließtext mit den geprüften Behauptungen. `Lazar_Popovic.png` ist ein Foto eines Gründers, kein Drittkunde. |

**Nebenbefund aus derselben Prüfung** (behoben in `e060c94`): Das
Prerender-Manifest `src/lib/routing/publicRoutes.ts` führt **eigene** Title-
und Description-Texte und ist die Quelle des ausgelieferten `<head>`. Dort
standen 15 Einträge noch im Wortlaut von vor dem Audit — darunter „Nie wieder
verpasste Anrufe", „nimmt jeden Anruf an", „Kein Anruf geht verloren", „ohne
Agentur-Overhead" sowie die Description der entfernten Fallstudie. Die
Seiten-Komponenten allein zu korrigieren hätte diese Texte nicht erreicht.

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
  gelenkt", Gastronomie-Seiten): **unverändert belassen** — der Inhaber hat
  ausdrücklich angeordnet, hier vor seiner Entscheidung nichts zu ändern. Der
  Mechanismus laut Copy ist in §6 beschrieben.

## 4. Offene Punkte mit Inhaber-Abhängigkeit

| Punkt | Abhängigkeit |
|---|---|
| ~~`REAL_TESTIMONIAL` wird gerendert~~ | **Erledigt am 16.08.2026 (`4f135aa`).** Auf Anweisung des Inhabers vollständig aus dem Rendering entfernt — Zitat, Fallstudie, JSON-LD und Meta-Description. Wortlaut gesichert in `ASSETS-REQUIRED.md` §A3.1; Wiederherstellung nur nach schriftlicher Einwilligung. |
| Art.-50-Ansage („Anrufer erfahren zu Beginn…") steht seit Pass 1 auf allen Telefonassistent-Seiten. | OWNER-INPUT C1. Bei „NEIN" wird die Aussage sofort entfernt — Suchanker: `Sprachassistent` in `telefonassistent-copy.ts`, Seiten-Configs und Workflow-Steps. |
| JSON-LD `areaServed` (10+ Städte) und `priceRange: "€€€"` in `index.html`/`LocalBusinessSchema` | Service-Gebiet ist als Absichtserklärung vertretbar; Bestätigung empfohlen (OWNER-INPUT G2-nah). |
| Blog-Preisspannen und verbleibende Faustregeln („1–3 % der Besucher") | explizit als Faustregel gekennzeichnet; bei Bedarf entfernen. |

## 6. Review-Lenkung — Befund zur Entscheidung des Inhabers (nichts geändert)

Wichtige Einschränkung vorab: Das Produkt selbst liegt nicht in diesem
Repository. Hier steht nur, **was die Website über den Mechanismus behauptet** —
was tatsächlich implementiert ist, kann nur der Inhaber beantworten.

**Was die Copy sagt.** Auf zwei Seiten
(`WebdesignGastronomieMuenchen.tsx:159`, `WebdesignGastronomieRegensburg.tsx:159`)
steht unter der Überschrift „Automatisierter Feedback-Prozess": Gäste erhalten
nach dem Besuch automatisch eine Feedback-Anfrage, und „**Positives Feedback wird
in Richtung Google-Bewertung gelenkt**". Damit beschreibt die Website eine
zweistufige Weiche: erst eine interne Abfrage der Zufriedenheit, dann eine je
nach Ergebnis unterschiedliche Weiterleitung — positives Feedback zur
öffentlichen Plattform, negatives implizit nicht dorthin. Das entspricht Ihrer
**Variante 2**. Wohin negatives Feedback stattdessen geht, sagt die Copy nicht;
ein internes Formular wird nicht ausdrücklich genannt, ist aber die logische
Ergänzung der beschriebenen Weiche.

**Abgrenzung: ähnlich klingende, aber andere Aussagen.** Drei weitere Seiten
beschreiben etwas Milderes und sind nicht dasselbe Muster:
`AutomatisierungArzt.tsx:42` und `AutomatisierungRestaurant.tsx:38` sagen, ein
automatischer Follow-up „macht es zufriedenen Patienten/Gästen leichter, eine
Bewertung zu hinterlassen" — eine Erleichterung, keine Weiche.
`AutomatisierungSport.tsx:42/55/74` formuliert „Bewertungsanfragen nach positiven
Erlebnissen" und „zufriedene Mitglieder werden um Bewertungen gebeten" — das
beschreibt eine **Auswahl der Angefragten nach erwarteter Zufriedenheit** und
liegt damit näher an Ihrer Variante 1 als an einer neutralen Bitte.

**Was das bedeutet.** Trifft Variante 2 tatsächlich zu, ist die Aussage nicht nur
eine Formulierungsfrage: Google untersagt in seinen Richtlinien das selektive
Einwerben von Bewertungen ausdrücklich, und in Deutschland ist ein solches
Vorgehen wettbewerbsrechtlich angreifbar (irreführende Gesamtdarstellung der
Bewertungslage). Zusätzlich beschreibt die Website den Mechanismus offen — sie
dokumentiert das Muster also selbst.

**Nichts geändert, wie angeordnet.** Wenn Variante 1 oder 2 zutrifft, entferne
ich auf Ihr Wort hin die Beschreibung ersatzlos — und empfehle, in derselben
Runde auch die Sport-Formulierung auf eine neutrale Bewertungsbitte an *alle*
Kunden umzustellen. Falls der tatsächliche Ablauf ein anderer ist, beschreiben
Sie ihn mir; dann formuliere ich die Copy passend zum echten Mechanismus.

## 7. Zweite Wahrheitsquellen — vollständige Karte der Metadaten

Stand: 17.08.2026. Anlass: Drei Korrekturrunden mussten nachgebessert werden,
weil dieselbe Aussage an einer zweiten, nicht offensichtlichen Stelle noch
einmal stand. Diese Karte listet **jeden** Ort, an dem Title, Description oder
OG-Text entsteht, damit keine Korrektur mehr eine Quelle übersieht.

### 7.1 Zwei parallele Ketten — der Kern des Problems

Das ausgelieferte `<head>` entsteht **zweimal**, aus **verschiedenen Quellen**:

| | Statische Kette (Crawler ohne JS) | Laufzeit-Kette (Browser nach Hydration) |
|---|---|---|
| Quelle | `src/lib/routing/publicRoutes.ts` | `<PageSEO>`-Props der Seitenkomponente |
| Mechanik | `scripts/prerender.mjs` ersetzt `<title>`, `description`, `robots`, `og:*`, `twitter:*` im HTML | `PageSEO.tsx` schreibt dieselben Tags per `useEffect` in den DOM |
| Vorlage | `index.html` | — |

**Konsequenz:** Eine Seitenkomponente zu korrigieren ändert nicht, was ein
Crawler ohne JavaScript liest — und umgekehrt. Beide Ketten müssen bei jeder
Textänderung gemeinsam angefasst werden. Genau dieser Fehler lag dem Nachtrag
in `e060c94` und den Nachbesserungen vom 17.08.2026 zugrunde.

### 7.2 Alle Definitionsorte

| # | Ort | Rolle | Umfang | Status |
|---|---|---|---|---|
| 1 | `index.html` | Statische Vorlage; gilt für alles, was der Prerender nicht überschreibt | 1 Title, 1 Description, OG/Twitter-Block | geprüft |
| 2 | `scripts/prerender.mjs` | Rewrite-Mechanik, erzeugt keinen eigenen Text | — | geprüft |
| 3 | `src/lib/routing/publicRoutes.ts` | **Autoritativ für das ausgelieferte `<head>`** | 91 Routen mit eigenem Title + Description | geprüft, korrigiert |
| 4 | `src/components/PageSEO.tsx` | Laufzeit-Head, erzeugt keinen eigenen Text | — | geprüft |
| 5 | `src/lib/seo-data.ts` → `PAGE_META` | Zentrale Meta für 5 Seiten (`/`, `/leistungen`, `/ueber-uns`, `/faq`, `/kontakt`) | 5 Einträge | geprüft |
| 6 | `src/lib/seo-data.ts` → `BUSINESS_INFO.description` | Speist `LocalBusinessSchema` und JSON-LD | 1 Eintrag | geprüft |
| 7 | ~~`src/lib/seo-metadata.ts`~~ | **Gelöscht am 17.08.2026.** War toter Code ohne Importeure, erzeugte ungeprüfte Title/Description-Vorlagen | — | entfernt |
| 8 | `src/lib/standorte-service-configs.ts` → `seo:{}` | Stadt-Service-Seiten, eigene Title/Description **zusätzlich** zum Manifest | 9 Konfigurationen | geprüft, korrigiert |
| 9 | `src/pages/industries/*.tsx` | Config-Objekte für `IndustryPage` (9) und `NationalIndustryPage` (13) | 22 Seiten | geprüft |
| 10 | `src/pages/cluster/**/*.tsx` | Config-Objekte für `ClusterPage` | 15 Seiten | geprüft |
| 11 | `src/pages/costs/*.tsx` | Config-Objekte für `CostPage` | 3 Seiten | geprüft, korrigiert |
| 12 | `src/pages/problems/*.tsx` | Config-Objekte für `ProblemPage` | 5 Seiten | geprüft |
| 13 | 27 Seiten mit direktem `<PageSEO … />` | Title/Description inline in der Komponente | 27 Dateien | geprüft |
| 14 | `src/lib/blog-data.ts` | Blogartikel-Meta und Fließtext | 11 Descriptions | geprüft, korrigiert |
| 15 | `src/components/LocalBusinessSchema.tsx` | JSON-LD-Descriptions aus `BUSINESS_INFO` | 3 Stellen | geprüft |
| 16 | JSON-LD-Blöcke in Seitenkomponenten (`additionalSchema`) | `Service`/`FAQPage`-Descriptions, unabhängig von der Meta-Description | u. a. `/praxen`, Cluster-Seiten | geprüft |

**Nebenbefund, erledigt:** `src/lib/seo-metadata.ts` (#7) war eine vierte,
schlafende Quelle — sie erzeugte Marketing-Text („AI Rezeptionistin",
„hochkonvertierende Websites"), wurde aber von keiner Datei importiert. Auf
Anweisung des Inhabers am 17.08.2026 gelöscht.

### 7.5 Dritter Befund: JSON-LD erreicht das statische HTML nicht

Bei der Verifikation der Preisseite festgestellt und noch **nicht behoben**:

`PageSEO` schreibt sämtliches Seiten-Schema (`Service`, `FAQPage`,
`BreadcrumbList`, `additionalSchema`) in einem `useEffect` in den DOM und gibt
selbst `null` zurück. `useEffect` läuft im SSR nicht — das vorgerenderte HTML
enthält deshalb **nur** die beiden global in `index.html` eingebetteten Blöcke
(`Organization`, `LocalBusiness`, `WebSite`). Geprüft an `dist/praxen.html` und
`dist/kosten-ki-telefonassistent.html`: In beiden fehlen `Service`, `FAQPage`
und `BreadcrumbList` im ausgelieferten Dokument; sie entstehen erst nach der
Hydration.

Google rendert JavaScript und liest solches Schema in der Regel trotzdem, aber
später, unzuverlässiger und ohne Garantie — für Rich Results ist das die
schwächere Grundlage. Betroffen ist **jede** Seite des Projekts, nicht nur die
in diesem Pass geänderten.

Zwei mögliche Wege, beide außerhalb des Copy-Auftrags:
1. `PageSEO` gibt die JSON-LD-Blöcke als echte `<script>`-Elemente im JSX
   zurück, statt sie per Effekt einzufügen. Dann rendert sie der SSR mit.
2. `scripts/prerender.mjs` injiziert das Schema analog zu Title und
   Description aus einer Manifest-Quelle.

**Behoben am 17.08.2026 (Weg 1).** `PageSEO` gibt die vier JSON-LD-Blöcke
jetzt als echte `<script type="application/ld+json">`-Elemente im JSX zurück;
`react-dom/server` rendert sie mit. Die Einfügung per Effekt ist entfallen, es
gibt also genau eine Instanz je Block statt einer per SSR und einer per Effekt.
Verifikation über alle 92 ausgelieferten HTML-Dokumente: `WebPage` in 92,
`BreadcrumbList` in 91, `FAQPage` in 69, `Service` in 55 — keine doppelte
Script-ID, kein ungültiges JSON, kein doppelter Knotentyp.

**Nebenbefund aus derselben Umstellung:** 34 Seiten trugen `FAQPage`
**zweimal** — einmal von `PageSEO` aus `faqItems`, einmal zusätzlich im
`additionalSchema` der Seite bzw. der Konfigurations-Komponente. Solange beide
Blöcke per Effekt entstanden, fiel das nicht auf; im statischen HTML wäre es
crawlbare Doppelauszeichnung geworden. Die zweite Fassung ist entfernt in
`NationalIndustryPage`, `ClusterPage`, `CostPage`, `KiTelefonassistentPage`,
`BayernKiTelefonassistentPage`, `PraxenPage` und `KostenKiTelefonassistent`.

### 7.6 Gegenprobe: erzeugt dieselbe Mechanik noch anderes fehlendes HTML?

Geprüft wurde, ob weitere `<head>`-Elemente nur nach der Hydration existieren.
Ergebnis: **nein.** `scripts/prerender.mjs` schreibt `<title>`, `meta
description`, `meta robots`, `link canonical`, beide `hreflang`-Alternates
sowie den vollständigen `og:`- und `twitter:`-Block aus dem Manifest in das
statische HTML und **validiert** Canonical und Robots anschließend (Zeilen
80–140 und 182–210). An `dist/praxen.html` einzeln nachgewiesen: alle zwölf
Elemente vorhanden.

Das Schema war damit die einzige Lücke — es kam als einziges Element nicht aus
dem Manifest, sondern ausschließlich aus der Komponente.

`CanonicalManager` arbeitet weiterhin per Effekt, entfernt dort aber nur
Canonicals auf Seiten ohne öffentliche Adresse (`/d/:token`, `/auth/*`,
unbekannte URLs). Das ist eine Korrektur nach der Hydration, kein fehlender
Inhalt: Der Prerender vergibt für diese Routen ohnehin keinen Canonical.

### 7.3 Prüfung gegen die bisherigen Korrekturen

Alle Quellen aus 7.2 wurden gegen die vier Muster geprüft:

| Muster | Ergebnis |
|---|---|
| Hosting-Standort / EU-Verarbeitung / „DSGVO-konform" als Zusage | **Ein Restbefund**, behoben: `blog-data.ts:198` — Callout „Ein DSGVO-konformer KI-Telefonassistent verarbeitet Patientendaten auf europäischen Servern" → umformuliert zu einer Prüffrage an den Leser, ohne Zusage. Verbleibende Treffer sind ausschließlich FAQ-**Fragen** („Ist der KI Telefonassistent DSGVO-konform?"), deren Antworten korrigiert sind |
| Eigenaufnahme-Zusage | keine Treffer in irgendeiner Metadatenquelle |
| Absolutversprechen | keine Treffer in Title, Description oder OG-Text |
| PVS-Andeutung (Produktnamen, „direkt angebunden") | keine Treffer |

**~~Außerhalb des Telefonassistenten unverändert~~ — überholt am 18.08.2026.**
Die Festlegung vom 17.08.2026 (Option B) ließ „DSGVO-konform / europäische
Server" auf den Webdesign- und Automatisierungsseiten stehen, mit der
Begründung, dort werde ein anderes Produkt auf anderer Infrastruktur
beschrieben. Diese Begründung trägt nicht: Die AVV-Kette mit den
Unterauftragsverarbeitern ist unsigniert, **unabhängig davon, auf welcher
Produktseite der Satz steht**. Eine Hosting-Aussage auf der Restaurant-Seite ist
genauso unbelegt wie auf der Praxis-Seite. Die Festlegung stammt aus der Zeit
vor dem AVV-Befund und ist damit hinfällig.

**Ersetzt durch die Sperre in 7.7.** Beide Aussagen sind am 18.08.2026
repo-weit entfernt worden — auf allen Produkten, nicht nur im
Healthcare-Cluster.

### 7.4 Arbeitsregel für alle weiteren Änderungen

> Wird ein Title, eine Description oder ein OG-Text geändert, ist die Änderung
> erst vollständig, wenn **beide** Ketten aus 7.1 angefasst sind: die
> Seitenkomponente *und* der Eintrag in `publicRoutes.ts`. Bei Stadtseiten
> kommt `standorte-service-configs.ts` als dritte Stelle hinzu.

### 7.7 Gesperrte Aussagenklassen (Inhaber-Entscheidung, 18.08.2026)

> Jede Aussage über **Verarbeitungsort**, **Datenschutzkonformität** oder
> **Zertifizierung** ist gesperrt, bis die Auftragsverarbeitungsverträge
> signiert sind und der Verarbeitungsort geklärt ist. Das gilt auf **allen
> Produkten** — Telefonassistent, Webdesign, Automatisierung —, nicht nur im
> Healthcare-Cluster.

**Umfasste Formulierungen** (die Liste ist nicht abschließend, das Muster
zählt): europäische Server · EU-Server · Serverstandort Deutschland ·
Verarbeitung in der EU · Hosting in Deutschland · deutsche bzw. europäische
Server · „Daten bleiben in Europa" · Europa-Hosting · „DSGVO-konform" in jeder
Beugung · „datenschutzkonforme Architektur" · „rechtssicher" ·
„sicherheitszertifiziert".

**Ein [[CLAIM]]-Marker ist kein Ausweg.** Der Marker schützt intern, der
Besucher liest die Zusage trotzdem. Marker sind für Angaben, die wir für
zutreffend halten und noch bestätigen — nicht für Aussagen, die wir nicht
belegen können. Eine unbelegte Zusage steht nicht auf der Seite, auch nicht
markiert.

**Was stehen bleiben darf:**

| Zulässig | Beispiel |
|---|---|
| Die Frage in Frageform | „Sind die Systeme DSGVO-konform?" — die Antwort darf sie nicht bejahen |
| Konformität als Prüfkriterium einer Leistung | „Cogniiq analysiert die bestehende Website: … DSGVO-Konformität" |
| Das benannte Kundenbedenken | „Bedenken wegen Datenschutz und DSGVO-Konformität" |
| Die Frage des Datenschutzbeauftragten | „Wo werden die Daten verarbeitet …?" |
| Allgemeine Markteinschätzung ohne Cogniiq-Bezug | Blogtext: „Systeme mit europäischen Servern sind verfügbar" |
| Der Verweigerungssatz selbst | `DATENSCHUTZ_SEITE.nichtBehauptet` |
| Was tatsächlich geliefert wird | Datenschutzerklärung, Impressum, Cookie-Einwilligung, AVV, dokumentierte Datenflüsse |

**Ausdrücklich NICHT gesperrt: der Standort Dritter, die der Kunde selbst
beauftragt.** Die Sperre gilt für Aussagen über **unsere** Verarbeitung. Ein
Satz über einen Hoster, den der Kunde selbst bucht und bezahlt, spricht über
einen Dritten — dessen Rechenzentrumsstandort ist öffentlich belegbar und hat
mit unserer Sprachverarbeitung nichts zu tun. Diese Unterscheidung steht hier,
damit die Regel beim nächsten Durchgang nicht zu breit ausgelegt wird.

| | Beispiel | Status |
|---|---|---|
| Über **unsere** Verarbeitung | „Alle Daten werden auf europäischen Servern verarbeitet" | **gesperrt** |
| Über einen **Dritten**, den der Kunde beauftragt | „Wir empfehlen passende Anbieter mit europäischen Rechenzentren" (Hosting und Domain sind separate Positionen) | zulässig |

Zulässig ist die zweite Zeile nur, solange erkennbar bleibt, dass es sich um
eine Empfehlung für eine vom Kunden selbst beauftragte Leistung handelt — nicht
um Infrastruktur, auf der wir verarbeiten. Konkret betroffen sind heute die
beiden Hosting-Antworten in `WebdesignKostenBayreuth.tsx` und
`WebsiteErstellenBayreuth.tsx` (Inhaber-Entscheidung 18.08.2026).

**Standardformulierung**, wo die Frage im Text auftaucht und beantwortet
werden muss:

> Zum Verarbeitungsort machen wir derzeit keine Angabe — die Verträge mit den
> beteiligten Anbietern sind nicht abschließend unterzeichnet.

**Was die Sperre aufhebt:** die vier Punkte aus `ASSETS-REQUIRED.md` §B2
(signierte AVV mit allen Unterauftragsverarbeitern, geklärter
Verarbeitungsort, veröffentlichungsfähige Unterauftragsverarbeiter-Liste,
TOM-Dokument). Bis dahin bleibt jede Aussage dieser Klasse draußen.

#### 7.4.1 Kernaussagen: technisch zusammengeführt (17.08.2026)

Die Regel oben ist ein Merkposten und hat dreimal nicht gehalten. Für die
Aussagen, die mehr als einmal vorkommen, ist sie deshalb durch Technik ersetzt:

**`FAKTEN` in `src/lib/telefonassistent-copy.ts`** ist die einzige Quelle für
Deckelung, Obergrenzen, Tarifzuordnung, Go-live-Garantie, 3-Tage-Zusage,
Kündigung, Laufzeit, Preisgarantie, Erreichbarkeit, Antwortzeit, fehlende
Aufzeichnung, kein Training, Art.-50-Ansage und fehlende PVS-Anbindung.
Modultexte, FAQ-Antworten, Stadt-Configs und Segmentseiten setzen diese Sätze
ein, statt sie neu zu formulieren.

**`src/lib/telefonassistent-copy.test.ts`** hält das durch: Der Test schlägt an,
sobald eine Kernzahl (0,39 €, 1.400 €, 7 Tage nach Zahlungseingang, 3 Tage,
12 / 24 Monate, 20 % Aufschlag, 6–20 Uhr) in einer der neun Cluster-Dateien als
Literal auftaucht. Er prüft zusätzlich, dass `FAKTEN` und `TARIFE`
widerspruchsfrei bleiben — die Deckelungsaussage muss jede Obergrenze aus
`TARIFE` wörtlich enthalten.

**Was der Test beim ersten Lauf gefunden hat:** nicht nur Duplikate, sondern
**sieben Stellen mit der bereits als falsch erkannten Formulierung** „nie mehr
als der nächsthöhere Tarif" — in drei Stadt-Configs, drei Stadt-FAQ, der
Serviceseite, beiden Segmentseiten und einem Fließtext der München-Seite. Sie
war zweimal korrigiert worden und lebte an sieben weiteren Stellen weiter. Alle
behoben; das Muster kommt im Repository nicht mehr vor.

#### 7.4.2 Offene Strukturschuld

Nicht zusammengeführt, bewusst:

| Bereich | Grund |
|---|---|
| Hotel-, Restaurant-, Webdesign- und Automatisierungsseiten | Eigene Produkte mit eigenen Aussagen; eine gemeinsame Konstante mit dem Telefonassistenten würde falsche Kopplung erzeugen |
| `blog-data.ts` | Redaktionelle Texte, die bewusst frei formuliert sind; Kernzahlen kommen dort nicht vor |
| Meta-Descriptions in `publicRoutes.ts` | Sind auf Länge optimiert (140–158 Zeichen) und müssen frei formulierbar bleiben; der Test deckt sie trotzdem gegen Kernzahlen ab |
| Prosa-Varianten derselben Aussage | Formulierungen dürfen sich je nach Kontext unterscheiden — der Test bindet die Zahlen, nicht den Satzbau. Das ist Absicht: Ein Zwang zur wörtlichen Wiederholung würde die Texte schlechter machen |

Bleibt als Restrisiko: Eine Kernaussage ohne Zahl (etwa „keine Triage") kann
weiterhin an einer Stelle abweichend formuliert werden, ohne dass der Test
anschlägt. Für diese Fälle gilt weiter die Arbeitsregel aus 7.4.

## 8. Umgebung

### 8.1 Build bricht ohne Secrets vor dem Prerender ab

Festgestellt am 18.08.2026. Kein Fehler im Code, aber eine Stolperfalle für
jeden, der ohne `.env` baut.

`npm run build` ist eine Kette:

```
build:ssr → sitemap → build:client → prerender → clean:ssr
```

`npm run sitemap` (`scripts/generate-sitemap.mjs`) zieht über seine
Importkette `src/lib/supabase.ts` herein, und die wirft beim Laden
`Missing VITE_SUPABASE_URL`, wenn die Variable fehlt. Weil `sitemap` an
**zweiter** Stelle steht, bricht die Kette ab, **bevor** `build:client` und
`prerender` laufen.

**Wirkung:** `dist/` enthält dann kein einziges HTML-Dokument. Der Abbruch sieht
nach einem Sitemap-Problem aus, kostet aber den gesamten Prerender — und damit
jede Prüfung, die am ausgelieferten HTML hängt (Metadaten, JSON-LD,
Unique-Anteil der Stadtseiten).

**Was zu tun ist:** Vor einem lokalen Build `VITE_SUPABASE_URL` und
`VITE_SUPABASE_ANON_KEY` setzen. Für reine Copy- und SEO-Prüfungen genügen
Platzhalterwerte; die Sitemap fragt zur Bauzeit keine Daten ab. Auf CI mit
gesetzten Variablen tritt der Fall nicht auf.

**Nicht geändert:** Die Reihenfolge der Build-Kette und die Fehlerbehandlung
in `supabase.ts` bleiben, wie sie sind — beides liegt außerhalb des
Copy-Auftrags. Vermerkt, damit der nächste Build nicht als kaputt gilt.

## 5. Positivbefunde

- Kein `aggregateRating`, `Review`, `ratingValue` oder Sterne-Markup irgendwo
  im JSON-LD (bewusste Auslassung ist in `BewertungenPage` kommentiert).
- Keine Logo-Wände, keine Kundenzähler, keine Zertifikats-/Partner-Siegel.
- `public/` (robots, headers, redirects, sitemap) frei von Marketing-Claims.

Vollständige Roh-Kataloge beider Scan-Läufe (jede Fundstelle mit Zeile und
Originaltext) liegen den Commits dieser Phase zugrunde; diese Datei ist die
konsolidierte, priorisierte Fassung.
