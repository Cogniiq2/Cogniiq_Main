# Suchintentions-Architektur der öffentlichen Seite

Angelegt: 2026-09-12 · Branch `claude/seo-architecture-max-2026-09-12` ·
Basis-Commit `3e44c84` · Datenstand Messung: GSC-Exporte vom 2026-09-10
(3 Monate 2026-06-09–2026-09-08, 28 Tage 2026-08-12–2026-09-08) ·
**§5 neu am 2026-09-13** (Webdesign-Durchgang, Inhaber-Abfrage der Property bis 2026-09-10)

**Zweck.** Eine Regel, die sich ohne dieses Dokument nicht durchhalten lässt:

> **Eine Suchintention → eine Seite, die sie besitzen darf.**

Wer eine öffentliche Seite anfasst oder eine neue anlegt, liest hier nach, welche
Intention diese Seite besitzt und welche sie ausdrücklich **nicht** besitzt.
Zwei Seiten auf denselben Kopfbegriff sind kein Ausdruck von Themenbreite,
sondern geteilte Autorität.

Dieses Dokument ist Architektur, nicht Copy und nicht Messung:

| Frage | Dokument |
|---|---|
| Welche Seite darf welche Intention besitzen? | **hier** |
| Was wurde wann geändert und mit welcher Hypothese? | `organic-growth-scoreboard.md` |
| Was ist entschieden, wartet aber auf ein Experimentende? | `post-experiment-opportunities.md` |
| Welche Wörter sind erlaubt? | `.claude/COPY-BRIEF.md`, `COPY-BRIEF-2.md` |
| Welche Aussage ist belegt? | `COPY-CLAIMS-TO-VERIFY.md`, `HONESTY-AUDIT.md` |
| Welche Routen sind eingefroren? | `src/lib/routing/protectedExperiments.ts` |

**Belegstärke.** Wo unten Impressionen und Positionen stehen, sind es
**Seiten-Aggregate** aus `Pages.csv`, keine Query×Seite-Paare. Welche Query auf
welche URL fällt, ist damit eine begründete Annahme und kein Beleg — dieselbe
Einschränkung wie im Scoreboard. Wo keine Zahl steht, gab es im Export keine.

---

## 1 · Was strukturell falsch war (Befund 2026-09-12)

Vier Befunde, nach Tragweite:

1. **Der ausgelieferte `<head>` war nicht der geprüfte.** `functions/_middleware.ts`
   trug eine eigene Kopie von Titel, Description, Canonical und Keywords für
   86 Routen und überschrieb damit den vorgerenderten Head an der Edge. Auf
   **29 von 86** Routen wichen die beiden Fassungen ab — und die Edge gewann.
   Betroffen waren unter anderem zwei Messpunkte vom 10.09.2026, deren
   Titeländerung deshalb **nie bei einem Crawler angekommen ist**, und mehrere
   Aussagen, die bewusst zurückgenommen worden waren (Terminbuchung ins System,
   pauschales „DSGVO-konform", „kein Anruf geht verloren", „echte Bewertungen").
   Einzelheiten in §7.
2. **Der zweitwichtigste Pillar war ein Navigations-Waise.**
   `/prozessautomatisierung` hatte **null** kontextuelle eingehende Links —
   erreichbar nur über den Footer. `/webdesign` hatte genau einen. Beide sind
   Kerngeschäft. Die Autorität floss stattdessen in die Standort- und
   Problemseiten.
3. **Der erklärte Eigentümer und der verlinkte Eigentümer sind verschiedene
   Seiten.** Im Automatisierungs-Cluster erklärt das Manifest
   `/prozessautomatisierung` zum Pillar (Priorität 0.92), verlinkt wird aber
   `/automatisierung-unternehmen` (Priorität 0.90, Hauptnavigation, 22
   kontextuelle Links, dreifacher Textumfang). Im Webdesign-Cluster dieselbe
   Figur zwischen `/webdesign` und `/webdesign-agentur-deutschland`.
4. **Das Praxis-Telefon-Cluster hat sechs Seiten für eine Intention** — und
   Google entscheidet die Eigentümerfrage gerade selbst (§4.1).

Was **nicht** falsch war: Canonicals (alle selbstreferenziell, 90/90),
Sitemap (deckungsgleich mit den indexierbaren Routen), Titel- und
H1-Eindeutigkeit (keine Dublette auf 93 Routen), interne Links (kein einziger
toter Zielpfad), `lastmod` (aus dem Manifest, nie aus dem Build-Datum).

---

## 2 · Rollen

| Rolle | Bedeutung |
|---|---|
| **PILLAR** | Kanonischer Eigentümer einer kommerziellen Kopf-Intention. Hierhin soll Autorität fließen. |
| **SEGMENT** | Branche oder Ort. Eigene Intention, verweist auf seinen Pillar. |
| **KOSTEN** | Preis-/Kosten-Intention. Eigene Suchabsicht, gehört an ihren Pillar. |
| **PROBLEM** | Problemformulierte Einstiegsintention („verpasste Anrufe"). Führt auf den Pillar. |
| **REDAKTION** | Fachbeitrag. Informational, nie kommerzieller Eigentümer. |
| **HUB** | Geo- oder Themenverteiler. Rankt selten selbst, verteilt Links. |
| **SERVICE** | Funktionale Seite (Kontakt, Demo, Recht). Keine Ranking-Absicht. |
| **NOINDEX** | Absichtlich nicht im Index, meist wegen fehlender Belege. |

Schutzstatus: **FROZEN** = in `PROTECTED_EXPERIMENT_PATHS`, byte-identisch zu
halten. **GRADUIERT** = Schutz bewusst beendet. **NEU** = in Messung.

---

## 3 · KI-Telefonassistent (Geschäftspriorität 1)

### 3.1 Der Kopfbegriff

| Route | Intention (primär) | Rolle | Status |
|---|---|---|---|
| `/ki-telefonassistent` | „ki telefonassistent", „telefonassistent", „ki telefonassistent für unternehmen", „ki telefonservice", „ki telefonzentrale", „ki anrufassistent" | **PILLAR** | Überarbeitung 2026-09-11 live, **Messfenster bis ~09.10.2026** |

**Keine andere Seite darf den generischen Kopfbegriff anvisieren.** Sekundär
besitzt diese Seite auch die Grenzen-Intention („was ein KI-Telefonassistent
nicht kann") über ihren Grenzen-Abschnitt — dafür wird bewusst keine eigene
Seite gebaut.

Zahlen vor der Überarbeitung: 155 Impressionen, Ø Position 37,2, 0 Klicks
(28 Tage bis 2026-09-08). Das ist die **Alt**-Baseline; die neue Fassung hat
noch keine. 32 kontextuelle eingehende Links, 35.000 Zeichen gerenderter
Körper — der mit Abstand am besten vernetzte und umfangreichste Inhalt der
Domain. Hier ist architektonisch nichts zu tun.

> **Schutz in diesem Durchgang.** Kein Titel, keine H1, kein Hero, kein
> Rechner, kein Preismodell, keine Abschnittsreihenfolge und keine
> Neupositionierung angefasst. Nachweis in §9.

### 3.2 Praxis / Arztpraxis — die offene Eigentümerfrage

Die volumenstärkste **kommerzielle** Nicht-Marken-Query-Familie der Domain
(716 Impressionen in 28 Tagen über neun Queries, 943 über die vollständige
„telefonassistent"-Familie) verteilt sich auf sechs Seiten:

| Route | Intention | Rolle | 28D Impr. | 28D Pos. | Status |
|---|---|---|---:|---:|---|
| `/praxen` | „ki telefonassistent praxis", Praxisempfang — **kommerzieller Eigentümer** | PILLAR (Segment) | | | 11 kontextuelle Links, 30.000 Zeichen |
| `/ki-telefonassistent-arzt` | „ki telefonassistent arztpraxis", „telefonassistent arzt" | SEGMENT | 543 | 31,7 | **FROZEN**, kontaminiert 11.09.2026 |
| `/ki-telefonassistent-praxis` | „telefonassistent therapeuten", Therapie-/Facharztpraxen | SEGMENT | **1** | | Einbruch von 514 (3M) auf 1 (28D) |
| `/ki-telefonassistent-zahnarztpraxis` | „ki telefonassistent zahnarztpraxis" + Grenzen | REDAKTION | | | NEU 2026-09-05, nur 2 eingehende Links |
| `/ki-telefonassistent-einfuehren` | „ki telefonassistent einführen" | REDAKTION | | | NEU 2026-09-05, nur 4 eingehende Links |
| `/blog/ki-telefonassistent-arztpraxis` | informational, Abgrenzung Team/System | REDAKTION | | | Neuausrichtung 2026-09-05 |

**Der Befund, der hier zählt:** `/ki-telefonassistent-praxis` fällt von 514
Impressionen (3 Monate) auf **1** (28 Tage), während `/ki-telefonassistent-arzt`
im selben Fenster stabil bleibt. Mit Aggregaten nicht beweisbar, passt aber
genau zu dem Bild, dass Google die Eigentümerfrage selbst entscheidet — gegen
die Therapie-Seite.

**Entscheidung, die ansteht (nicht in diesem Durchgang):** `/praxen` bleibt
kommerzieller Eigentümer. `/ki-telefonassistent-arzt` ist die stärkste URL der
Familie, aber eingefroren. `/ki-telefonassistent-praxis` ist der
Konsolidierungskandidat — sie hat 15.800 Zeichen und 8 eingehende Links für
eine Intention, die faktisch nicht mehr rankt. Reihenfolge: erst Experimentende
abwarten, dann Besitzfrage entscheiden, **dann** Text. Siehe Folgemission F3.

### 3.3 Der Rest des Clusters

| Route | Intention | Rolle | Status |
|---|---|---|---|
| `/kosten-ki-telefonassistent` | „ki telefonassistent kosten", „was kostet ein ki-telefonassistent" | **KOSTEN** (Eigentümer) | **GRADUIERT 2026-09-12** · 364 Impr., Pos. 31,2 (28D) |
| `/ki-telefonassistent-hotel` | „ki telefonassistent hotel" | SEGMENT | |
| `/ki-telefonassistent-restaurant` | „ki telefonassistent restaurant" | SEGMENT | |
| `/ki-telefonassistent/demo` | „ki telefonassistent demo/testen" | SERVICE | Formularseite, 1.347 Zeichen — rankt absichtlich kaum |
| `/bayern/ki-telefonassistent` | „ki telefonassistent bayern" | SEGMENT (Geo) | |
| `/bayreuth,/muenchen,/regensburg + /ki-telefonassistent` | „ki telefonassistent <Stadt>" | SEGMENT (Geo) | je 24 eingehende Links |
| `/verpasste-anrufe-verlust` | „verpasste anrufe kosten unternehmen" (Pos. 11,2 — eine der besten Nicht-Marken-Positionen der Domain) | PROBLEM | Titel 10.09.2026 geändert — **wirkte bis 12.09. nicht**, siehe §7 |
| `/keine-terminbuchung-online` | „keine online terminbuchung" | PROBLEM | |
| `/ki-agentur-deutschland` | „ki agentur deutschland" | PILLAR (Agentur-Intention) | Nicht „ki telefonassistent" — Abgrenzung einhalten |
| `/integrationen` | PVS-/Kalender-Anbindung | **NOINDEX** | Blockiert bis OWNER-INPUT Gruppe B |
| `/datenschutz-sicherheit` | DSGVO, § 203 StGB | **NOINDEX** | Blockiert bis Quellen-/Vertragsprüfung |

Unbesetzt und bewusst unbesetzt: „KI Telefonassistent DSGVO" (erst nach
Quellenprüfung), „KI Telefonassistent PVS/Schnittstelle" (blockiert),
„KI Telefonassistent Vergleich" (nicht verfolgt).

---

## 4 · Prozessautomatisierung (Geschäftspriorität 2)

### 4.1 Die Eigentümerfrage ist entschieden (12.09.2026)

**Inhaber-Entscheidung: `/automatisierung-unternehmen` wird in
`/prozessautomatisierung` überführt.** Folgemission F2 ist damit umgesetzt.

**Empirisch bestätigt (Inhaber-Abfrage `sc-domain:cogniiq.de`, Zeitraum
2026-08-14 bis 2026-09-10):** Der Pillar stand bei 23 Impressionen auf Ø 38,43,
die zurückgezogene Seite bei **8 Impressionen auf Ø 66,62**. Die Richtung der
Konsolidierung ist damit nicht nur begründet, sondern gemessen — die
aufgegebene Seite trug fast keine organische Substanz, ihr Gewicht lag in 22
internen Links. Vollständige Baseline samt Query-Ebene und Beurteilungsfragen:
`organic-growth-scoreboard.md` §M23.

| Route | Titel-Intention | Rolle | Zeichen (vorher) | Status |
|---|---|---|---:|---|
| `/prozessautomatisierung` | „prozessautomatisierung", „geschäftsprozesse automatisieren", „unternehmensprozesse automatisieren", „workflow automatisierung", „ki automatisierung unternehmen" | **PILLAR** (erklärt **und** verlinkt) | 2.746 | Neu aufgebaut, Sitemap-Priorität 0.92 → **0.95** |
| ~~`/automatisierung-unternehmen`~~ | — | **ZURÜCKGEZOGEN** | 7.769 | **301** auf den Pillar, aus Manifest, Router und Sitemap entfernt |
| `/digitale-automatisierung-unternehmen` | „digitale automatisierung unternehmen" | PROBLEM | 2.555 | **unverändert** — ausdrücklich NICHT Teil der Konsolidierung |
| `/zu-viel-manuelle-arbeit` | „zu viel manuelle arbeit" | PROBLEM | 2.581 | unverändert, verweist auf den Pillar |

**Warum diese Richtung.** Der exakte Kopfbegriff steht in URL und Titel, die
Sitemap-Priorität war bereits die höhere (0.92 gegen 0.90), und die
Mission-Zielfamilie heißt „Prozessautomatisierung". Die Gegenrichtung wäre
verteidigbar gewesen, hätte aber den exakten Begriff aufgegeben.

**Was die Konsolidierung technisch umfasst.** Die Regel steht in
`src/lib/routing/legacyRedirects.ts`; `.github/scripts/test-seo-consistency.mjs`
und `src/lib/routing/legacyRedirects.test.ts` halten vier Zusagen:

1. `public/_redirects` beantwortet beide Formen (`/automatisierung-unternehmen`
   und `/automatisierung-unternehmen/`) mit **301** auf `/prozessautomatisierung`
   — eine Weiterleitung, keine Kette, kein Canonical.
2. Die alte URL steht in **keinem** Manifest, in keinem `<Route>` und in keiner
   Sitemap — sonst würde sie weiter als 200 ausgeliefert und die Regel wäre
   wirkungslos.
3. Das Ziel ist eine indexierbare Manifest-Route mit selbstreferenziellem
   Canonical und Sitemap-Eintrag.
4. **Keine lebende Seite verlinkt die alte URL.** Geprüft für alle 92
   vorgerenderten Dokumente in `src/prerender.hydration.test.tsx`.

**Die eine Ausnahme zu Punkt 4.** `/bayreuth/webdesign` ist ein eingefrorenes
Suchexperiment; seine ausgehenden Anker gehören zum gemessenen Fingerabdruck.
Diese eine Seite trägt die alte Adresse in ihrem Fuß-Verweisstreifen weiter —
als Datum in ihrer eigenen Konfiguration (`legacyAutomationLink`), nicht als
Sonderfall im Bauteil. Ein interner Link auf eine 301 wird verfolgt und
konsolidiert; der Verlust ist rechnerisch eine Weiterleitung. Er verschwindet,
sobald das Experiment endet — vermerkt in `post-experiment-opportunities.md`.

**Was mit dem Inhalt der zurückgezogenen Seite geschah.** Nicht kopiert. Jede
Aussage wurde einzeln auf ihre Quelle geprüft; das Ergebnis steht in
`preisaudit-automatisierung.md`. Von 7.769 Zeichen überlebte die **Struktur**
(Leistungsbild, Ablaufmuster, Branchen- und Stadtverweise), nicht die
Substanz: „Quick-Wins in 1–3 Wochen", eine Liste von elf Fremdprodukten als
Kompatibilitätszusage, Preisstaffeln ohne Bestätigung, „ohne Fehler" und „was
früher 30 Minuten dauerte, passiert jetzt in Sekunden" sind ersatzlos
entfallen.

**Was der Pillar jetzt ist.** Er beantwortet sechzehn Käuferfragen in der
Reihenfolge, in der sie gestellt werden: was Prozessautomatisierung ist, welche
Prozesse sich eignen, welche ausdrücklich **nicht**, wo ein KI-Schritt etwas
beiträgt und wo deterministische Regeln genügen, sechs Ablaufmuster mit dem
Punkt, an dem ein Mensch die Kontrolle behält, wie Systeme verbunden werden und
was gilt, wenn eines keine geeignete Schnittstelle hat, sieben
Absicherungsmechanismen, elf Umsetzungsschritte, die Preislogik in vier Sätzen
mit Verweis auf die Kostenseite, Branchen und Standorte, und der nächste
Schritt.

**Zwei Abschnitte, die diese Seite von den Wettbewerbern trennen** und die
bewusst gegen den Verkaufsinstinkt geschrieben sind: „Was nicht automatisiert
gehört" (sechs Fälle) und „Was passiert, wenn etwas schiefgeht" (sieben
Mechanismen, ausdrücklich **nicht** alle in jedem Projekt).

**Preis-Intention bleibt bei `/kosten-automatisierung`.** Der Pillar fasst die
Preislogik in vier Sätzen und verweist. Eine ausgebaute Preisstrecke auf dem
Pillar würde die Kostenseite kannibalisieren — und die ist die einzige Seite
dieses Clusters, die heute schon in Reichweite der ersten Ergebnisseite steht.

### 4.2 Unterstützer

| Route | Intention | Rolle | Notiz |
|---|---|---|---|
| `/kosten-automatisierung` | „automatisierung kosten", „was kostet prozessautomatisierung", „automatisierung projekt kosten" | **KOSTEN** (Eigentümer) | 37 Impr., Ø 16,24 (2026-08-14–09-10, Inhaber-Abfrage); fünf Kostenqueries zwischen Pos. 11 und 20,5 bei null Klicks — die kürzeste Distanz zu messbarem Ergebnis im Cluster · **12.09.2026 neu aufgebaut**: alle zwölf unbelegten Beträge entfernt, acht Kostentreiber, einmalig/laufend getrennt, „wann es sich NICHT lohnt", Wirtschaftlichkeitsrechner ohne Lead-Gate |
| `/automatisierung-arzt` | „automatisierung arztpraxis" | SEGMENT | Überlappt mit `/ki-telefonassistent-arzt` in der Terminintention |
| `/automatisierung-restaurant` | „automatisierung restaurant/gastronomie" | SEGMENT | |
| `/automatisierung-immobilien` | „automatisierung immobilienmakler" | SEGMENT | |
| `/automatisierung-sport` | „automatisierung fitnessstudio/verein" | SEGMENT | Nur 4 eingehende Links |
| `/bayreuth,/muenchen,/regensburg + /automatisierung` | „automatisierung <Stadt>" | SEGMENT (Geo) | je 24 eingehende Links |
| `/blog/prozessautomatisierung-roi` | „prozessautomatisierung roi berechnen" | REDAKTION | Titel trägt „2025" |
| `/blog/ki-automatisierung-kleine-unternehmen` | „ki automatisierung kleine unternehmen" | REDAKTION | Titel und H1 tragen „2025" |
| `/blog/digitalisierung-mittelstand` | „digitalisierung mittelstand" | REDAKTION | Titel trägt „2025", 2 eingehende Links |

---

## 5 · Webdesign (Geschäftspriorität 3)

**Stand 2026-09-13** (Branch `claude/webdesign-recovery-max-2026-09-13`). Der
Abschnitt ist neu geschrieben; die Fassung vom 12.09. steht in der Git-Historie.
Datenquelle für alle Zahlen hier: **Inhaber-Abfrage der echten Search-Console-
Property `sc-domain:cogniiq.de`**, letzter gesetzter Tag 2026-09-10 — nicht die
Pages.csv-Aggregate der Vorläufe.

### 5.1 Eigentümer-Hierarchie

| Route | Besitzt (Query-Familie) | Rolle | Status 13.09.2026 |
|---|---|---|---|
| `/webdesign` | „webdesign agentur", „webdesign für unternehmen", „website erstellen lassen", „professionelle website", „firmenwebsite" — **national, generisch** | **PILLAR** (erklärt **und** verlinkt) | **neu aufgebaut**: 578 → ~2.300 Wörter, 32 → 19 Körper-Linkziele, 21 kontextuelle eingehende Seiten (vorher 4), Priorität 0.95 |
| `/webdesign-agentur-deutschland` | — (überlappt vollständig mit `/webdesign`) | PILLAR-DUBLETTE, **KONSOLIDIERUNG AUFGESCHOBEN (F9)** | bleibt **vorerst live**, unverändert; alle nicht eingefrorenen internen Links zeigen jetzt auf `/webdesign`. Einzig `/bayreuth/webdesign` (FROZEN) verlinkt sie weiter |
| `/kosten-webdesign` | „webdesign kosten", „was kostet eine website", „homepage kosten" — national | **KOSTEN** | neu aufgebaut ohne `CostPage`: 18 unbelegte Beträge/Zusagen entfernt (`preisaudit-webdesign.md`), Titel ohne Jahreszahl |
| `/<stadt>/webdesign-kosten` | „webdesign kosten <stadt>" | KOSTEN (lokal) | unverändert · `/muenchen/webdesign-kosten` FROZEN |
| `/bayreuth/webdesign` | „webdesign bayreuth", „webdesign agentur bayreuth", „website erstellen bayreuth" | SEGMENT (Geo) | **FROZEN**, unverändert |
| `/regensburg/webdesign` | dito Regensburg | SEGMENT (Geo) | FAQ-Preise/-Dauern/Herstellerliste entfernt (D1–D4), sonst unverändert |
| `/muenchen/webdesign` | dito München | SEGMENT (Geo) | FAQ-Preise/-Dauern, Ladezeitwert entfernt (D5–D7), sonst unverändert |
| `/webdesign-hotel` | „webdesign hotel", „internetagentur hotel" | SEGMENT (Branche) | **Messpunkt M1**, nur der Pflicht-Link auf den Pillar geändert |
| `/webdesign-arzt`, `-gastronomie`, `-immobilien`, `-sport` | „webdesign <branche>" | SEGMENT (Branche) | nur der Pflicht-Link auf den Pillar geändert |
| `/webdesign-{branche}-{stadt}` (9) | „webdesign <branche> <stadt>" | SEGMENT (Branche×Ort) | unverändert |
| `/<stadt>/website-relaunch` | „website relaunch <stadt>", Relaunch-Intention | SEGMENT (Relaunch) | unverändert · Bayreuth und Regensburg FROZEN |
| `/<stadt>/website-erstellen`, `/<stadt>/landingpage` | siehe §5.6 | SUPPORT | unverändert (keine Query×Seite-Evidenz) |
| `/bayreuth/lokales-seo` | **„seo bayreuth", „seo agentur bayreuth", „lokales seo bayreuth"** | SEGMENT (SEO, Geo) | Titel/H1 auf den Kopfbegriff gezogen, Preis-FAQ bereinigt, neuer Kontextlink vom Hub |
| `/muenchen/lokales-seo`, `/regensburg/lokales-seo` | „lokales seo <stadt>" | SUPPORT | unverändert |
| `/bayreuth`, `/muenchen`, `/regensburg` | **Marke × Ort** („cogniiq regensburg", Unternehmen-vor-Ort-Suche) | HUB | Titel/H1/Tagline von „AI-Systeme & Webdesign in <Stadt>" auf „Cogniiq in <Stadt> – …" gezogen (§5.5) |
| `/` | Marke, Entität Bayreuth | HUB | Webdesign-Karte verlinkt jetzt den Pillar statt `/leistungen` |
| `/leistungen`, `/deutschland` | Übersicht | HUB | je ein Kontextlink „Webdesign für Unternehmen" auf den Pillar |
| `/keine-anfragen-website` | „website bringt keine anfragen" | PROBLEM | Link auf die zurückgezogene Seite entfernt |
| `/blog/webdesign-konversion-tipps`, `/blog/webdesign-agentur-auswahl` | informational | REDAKTION | „Weiterführend"-Block auf Pillar bzw. Kostenseite |

### 5.2 GSC-Baseline `/webdesign` (Inhaber-verifiziert)

Zeitraum 2026-08-14 → 2026-09-10, Property `sc-domain:cogniiq.de`:

| Fenster | Impressionen | Klicks | Position |
|---|---:|---:|---|
| 14.08.–30.08. (17 Tage) | **1.815** | 0 | überwiegend 70–90 |
| 31.08. | 17 | 0 | |
| 01.09.–10.09. | **0 an jedem Tag** | 0 | — |

Die 1.815 Impressionen waren zu einem großen Teil **keine** nationale
Webdesign-Nachfrage: „seo bayreuth" 45, „webentwicklung regensburg" 71,
„homepage erstellen lassen regensburg" 42, „landingpage optimierung
regensburg" 32, „seo agentur bayreuth" 32, dazu „webdesign bad neustadt",
„webdesign altdorf", „internetagentur erlangen". Position 70–90 auf fremde
lokale Queries ist keine Autorität. **1.815 ist deshalb keine Zielmarke.**
Erfolg nach dem Deploy: relevante generische Impressionen, steigende
Positionen, erste qualifizierte Klicks, weniger lokale Leckage — Messpunkt M5
im Scoreboard.

### 5.3 Der Einbruch vom 31.08.2026 — was bewiesen ist und was nicht

Geprüft wurden alle Commits vom 20.08. bis 06.09. an Manifest, Middleware,
Prerender, `_redirects`, `_headers`, Sitemap, Navigation, Footer, PageSEO,
LocalBusinessSchema, `index.html`, `WebdesignHub.tsx`, `vite.config.ts`, und
die Merge-Zeitlinie auf `main`:

| Datum (Merge) | Änderung | Wirkung auf `/webdesign` |
|---|---|---|
| 24.08. `7a077ca` | Copy-Sweep Garantie, Middleware-Descriptions | `/webdesign` nicht betroffen |
| 25.08. `a9f6957`, `e1c1cfc`, `035eb0c` | Deploy-Fixes für **private** Deep-Links (`/app-shell`), `_headers` Cache-Control | Nur private Präfixe und `/index.html`; öffentliche Routen unverändert |
| 29.08. PR #63 `fc0cd3f` | Navigations-Hierarchie: Footer verliert ~40 Stadt×Branche-/Kosten-Links | Zahl der Quelldateien mit Link auf `/webdesign`: **8 → 8** (unverändert) |
| 29.08. PR #64 `2f7ac20` | LCP: framer `initial opacity:0` → CSS `.cq-rise` (nur `transform`) in `WebdesignHub.tsx` | H1 ab erstem Frame sichtbar; Head, H1-Text, Links byte-identisch (Commit-Nachweis) |
| 29.08. `55d2e3b` | PageSEO liest Metadaten aus dem Manifest | `/webdesign`: Manifest und Komponente trugen denselben Titel |
| 30.08. PR #68, #76, #78 | Hero-SSR, Mobile-Typografie, Perf-Docs | `/webdesign` nicht betroffen |
| 30.08.–06.09. | Middleware-Tabelle `/webdesign`: **identisch** mit Manifest (Titel, Description, Canonical, Keywords) an beiden Enden des Fensters | kein Head-Drift auf dieser Route (der Drift aus §7 betraf 29 **andere** Routen) |
| 05./06.09. PR #85 | Zahnarzt-Beitrag, Blog | nach dem Einbruch, nicht kausal |

Gelieferter Head (Manifest + Middleware-Overlay, beide gleich), `robots`
(`index, follow`), Canonical (selbst), Sitemap-Eintrag (`lastmod 2026-06-30`),
`_redirects`/`_headers` (nur private Präfixe) und Inbound-Topologie waren am
30.08. und am 06.09. für `/webdesign` identisch mit dem Stand vom 24.08.

**`No repository-side causal event proven.`** Kein Commit im Fenster hat Head,
Indexierbarkeit, Canonical, Sitemap, Auslieferung oder Verlinkung dieser
Route verändert. Was das Repository zeigt, ist ein **Zustand**, kein Ereignis:
eine 578-Wörter-Seite, deren Körper aus 32 Links bestand und deren Impressionen
auf Queries fielen, die andere Seiten der Domain wörtlich beantworten. Ein
Impressionsabfall von 137 auf 0 in einem Tag passt zu einer Neubewertung durch
Google (Deduplizierung gegen die Seiten, die diese Queries besitzen, oder ein
anderes von Google gewähltes Canonical), nicht zu einem technischen Fehler —
beweisen kann das nur die URL-Prüfung in der Search Console („von Google
gewähltes Canonical", letztes Crawldatum). **Empfehlung an den Inhaber:** die
URL-Prüfung für `/webdesign` mit dem Stand vor dem Deploy dieses Branches
festhalten.

### 5.4 Bayreuth-SEO: ein Eigentümer statt sieben

„seo bayreuth" verteilte sich auf `/bayreuth/webdesign`, `/bayreuth/lokales-seo`,
`/bayreuth`, `/webdesign`, `/`, `/bayreuth/website-relaunch` und
`/deutschland`. Eigentümer ist **`/bayreuth/lokales-seo`** — die einzige Seite,
deren Körper die Leistung beschreibt. Ausgerichtet wurden Titel („SEO Bayreuth –
Lokales SEO & Google-Sichtbarkeit für Unternehmen"), H1, Keywords und ein
neuer Kontextlink aus dem Hub `/bayreuth` („Lokales SEO für Bayreuth"). Von
`/webdesign` ist der Anker „Lokales SEO Bayreuth" verschwunden, ebenso alle
anderen 14 Stadt-Unterseiten-Anker. Kein Canonical, kein Entfernen von
SEO-Bezügen auf den Webdesign-Seiten; `/bayreuth/webdesign` bleibt eingefroren
und trägt seine SEO-Absätze weiter.

### 5.5 Homepage und Geo-Hubs gegen die Stadt-Webdesign-Seiten

„webdesign bayreuth" fiel auf `/bayreuth/webdesign` (71), `/` (61), `/bayreuth`
(30) und `/webdesign` (23). Die Homepage trägt „Webdesign" im Titel, „Webdesign
Agentur Bayreuth" in den Keywords, die Bayreuther Adresse im Organization- und
LocalBusiness-Schema und „gegründet in Bayreuth" im Körper — legitime Marken-
und Entitätssignale, die **nicht** entfernt werden. Geändert: die
Webdesign-Karte der Startseite verlinkt den Pillar statt `/leistungen`; der
Stadtlink „Bayreuth" → `/bayreuth/webdesign` bleibt. Die drei Geo-Hubs hießen
„AI-Systeme & Webdesign in <Stadt>" mit der Tagline „Webdesign <Stadt> · …" —
also ein zweiter Kandidat für „webdesign <stadt>". Sie heißen jetzt „Cogniiq in
<Stadt> – KI-Telefonassistent, Websites & Automatisierung" und verlinken die
Stadt-Webdesign-Seite mit dem Anker „Webdesign <Stadt>". `/regensburg` bleibt
mit 132 Wörtern ein Verteiler; Substanz ist F7, nicht Teil dieses Durchgangs.

### 5.6 Stadt-Mikroseiten — Klassifikation ohne Query×Seite-Export

| Route(n) | Klasse | Begründung |
|---|---|---|
| `/<stadt>/website-relaunch` (3) | **A** — eigene Intention + Evidenz | Relaunch-Queries; Regensburg Pos. 12,2 / Bayreuth Pos. 14,4 (28D), zwei davon FROZEN |
| `/<stadt>/webdesign-kosten` (3) | **A/B** | Kosten×Ort ist eigene Intention; München FROZEN mit 268 Impr. |
| `/<stadt>/lokales-seo` (3) | **B** (Bayreuth: A, siehe §5.4) | „seo <stadt>" ist eigene Intention; Bayreuth hat GSC-Evidenz, die anderen nicht |
| `/<stadt>/website-erstellen` (3) | **E** — unzureichende Evidenz | K5-Überlappung mit `/<stadt>/webdesign` bleibt Hypothese; **keine Weiterleitung ohne Query×Seite** (F4) |
| `/<stadt>/landingpage` (3) | **E** | „landingpage optimierung regensburg" (32 Impr. auf `/webdesign`!) deutet auf Nachfrage — aber auf der falschen Seite; erst Export, dann entscheiden (F4) |

Keine Massenweiterleitung. Keine Route wurde zurückgezogen; die eine beschlossene
Weiterleitung (F9) wartet auf das Experimentende.

### 5.7 Was auf `/webdesign` jetzt steht

Sechsundzwanzig Käuferfragen in dreizehn Abschnitten: was gebaut wird, für wen
und **für wen nicht** (sechs Fälle), neu oder Relaunch (drei Entscheidungsfragen),
die sieben Ebenen eines Projekts, wer Inhalte liefert, Redaktionssystem vs.
statisch, Suche/Ladezeit/Anfragen/Messung/Einwilligung/Barrierefreiheit mit der
jeweiligen Grenze, Schnittstellen (vorher prüfen, was wenn nicht), die
Relaunch-Prüfliste, Preistreiber in vier Sätzen mit Verweis auf
`/kosten-webdesign`, dreizehn Ablaufschritte **ohne Dauern**, Branchen und
Standorte, sieben FAQ, ein CTA. CTA-Hierarchie: primär „Website-Projekt
besprechen" (`cta_kontakt_click`), sekundär „Was eine Website kostet"
(`cta_kosten_click`), unterstützend Relaunch/Branchen/Standorte. Keine neuen
Tracking-Ereignisse, keine Formularwerte in Analytics.

Was **nicht** darauf steht, obwohl der Markt es zeigt (`serp-webdesign-2026-09.md`):
Preisanker, Projektdauern, Bewertungszahlen, Kundenlogos, Herstellerlisten.
Alles davon ist `BLOCKED — EVIDENCE`, nicht vergessen.

### 5.8 Suchintentions-Trennung — Nachweis über Titel, H1, Körper und Links

| Query-Familie | Eigentümer | Unterstützer (verlinken den Eigentümer) | Dürfen NICHT konkurrieren |
|---|---|---|---|
| generisches „webdesign", „webdesign für unternehmen" | `/webdesign` | `/`, `/leistungen`, `/deutschland`, Branchenseiten, Stadt-Service-Seiten, Blog | Geo-Hubs, `/kosten-webdesign` |
| „webdesign agentur" | `/webdesign` (Titel „Webdesign Agentur – …") | Footer-Absatz, Stadt-Fußverweis „Webdesign Agentur" | `/webdesign-agentur-deutschland` (bleibt bis F9 eine bekannte Dublette, nur noch von einer eingefrorenen Seite verlinkt) |
| „website erstellen lassen" | `/webdesign` (Keywords, Körper) | `/<stadt>/website-erstellen` lokal | `/` |
| „website relaunch" | `/<stadt>/website-relaunch` | `/webdesign` (Entscheidungstabelle + Prüfliste, verlinkt alle drei) | `/webdesign` als Relaunch-Seite |
| „webdesign kosten", „was kostet eine website" | `/kosten-webdesign` | `/webdesign` (vier Sätze + Link), Branchenseiten, Blog | `/webdesign` mit Preistabelle |
| „webdesign hotel" | `/webdesign-hotel` | `/webdesign` (Branchenliste), Kostenseite | `/webdesign-gastronomie` |
| „webdesign arzt" | `/webdesign-arzt` | `/webdesign`, `/webdesign-arzt-<stadt>` | `/praxen` |
| „webdesign bayreuth" | `/bayreuth/webdesign` (FROZEN) | `/`, `/bayreuth` (Anker „Webdesign Bayreuth"), `/webdesign` (Anker „Bayreuth") | `/webdesign` (keine Stadt-Anker mehr), `/bayreuth` (Titel ohne „Webdesign in Bayreuth") |
| „webdesign regensburg" | `/regensburg/webdesign` | `/regensburg` (Anker), `/webdesign` (Anker „Regensburg") | `/regensburg` (Titel geändert), `/webdesign` |
| „webdesign münchen" | `/muenchen/webdesign` | `/muenchen`, `/webdesign` | `/muenchen` (Titel geändert) |
| „seo bayreuth", „seo agentur bayreuth" | `/bayreuth/lokales-seo` | `/bayreuth` (neuer Kontextlink), Bayreuth-Mikroseiten | `/webdesign` (Anker entfernt), `/`, `/deutschland`, `/bayreuth/website-relaunch` |
| „landingpage <stadt>" | `/<stadt>/landingpage` | — (Mikroseiten untereinander) | `/webdesign` (Anker entfernt) |

Kein Canonical auf eine fremde URL. Die Trennung steht in Titeln, H1s, Körpern
und Ankern; die eine 301 (F9) folgt nach Experimentende.

## 6 · Kannibalisierungsmatrix

Reihenfolge nach Tragweite. **Keine Zeile rechtfertigt für sich eine
Zusammenlegung von URLs**, solange kein Query×Seite-Export vorliegt — und
**keine** wird mit einem Canonical „gelöst": ein Canonical ist kein
Keyword-Werkzeug, sondern eine Aussage über Identität.

| # | Seite A | Seite B | Überlappende Query-Familie | Absichtlich? | Gewinner | B soll stattdessen | Links verstärken den Richtigen? |
|---|---|---|---|---|---|---|---|
| ~~K1~~ | `/prozessautomatisierung` | ~~`/automatisierung-unternehmen`~~ | „automatisierung für unternehmen", „prozessautomatisierung", „ki automatisierung" | **Nein** | A | **GELÖST 12.09.2026** — B per 301 in A überführt, F2 umgesetzt (§4.1) | Ja: B existiert nicht mehr, alle 22 Links zeigen auf A (eine Ausnahme, eingefroren) |
| K2 | `/webdesign` | `/webdesign-agentur-deutschland` | „webdesign agentur" | **Nein** | A | **ENTSCHIEDEN, AUFGESCHOBEN (F9, 13.09.2026)** — B hatte 5 Impressionen in 28 Tagen, fast alle markenbezogen, und wird per 301 in A überführt, sobald `/bayreuth/webdesign` und `/bayreuth/website-relaunch` graduieren: B trägt drei Anker in diese Experimente | Ja: A hat 21 kontextuelle eingehende Seiten, B nur noch die eingefrorene |
| K3 | `/praxen` | `/ki-telefonassistent-arzt`, `/ki-telefonassistent-praxis` | „ki telefonassistent praxis/arztpraxis" | Teilweise | A kommerziell | `-praxis` ist Konsolidierungskandidat | Teilweise · B FROZEN (F3) |
| K4 | `/kosten-webdesign` | `/bayreuth,/muenchen,/regensburg + /webdesign-kosten` | „webdesign kosten <stadt>" | Ja, lokal vs. national | je nach Ortsbezug | unverändert | Ja · `/muenchen/webdesign-kosten` FROZEN |
| K5 | `/<stadt>/webdesign` | `/<stadt>/website-erstellen` | „webdesign <stadt>" ↔ „website erstellen <stadt>" | Fraglich | `/<stadt>/webdesign` | `website-erstellen` ist der schwächere Zwilling (F4) | Ja (27 vs. 5–6) |
| K6 | `/regensburg` | `/regensburg/webdesign` | „webdesign regensburg" (700 Impr., Pos. 57,8) | Nein | `/regensburg/webdesign` | **13.09.2026:** Hub auf „Cogniiq in Regensburg" umbenannt, Tagline „Webdesign Regensburg · …" entfernt; Substanz bleibt F7 | Ja: der Hub verlinkt die Service-Seite mit „Webdesign Regensburg" |
| K7 | `/kosten-automatisierung` | `/muenchen/automatisierung` | „automatisierung kosten" | Nein | `/kosten-automatisierung` | beobachten | Beide verlieren Impressionen bei besserer Position |
| K8 | `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen` | `/prozessautomatisierung` | „manuelle arbeit automatisieren" | Nein | Pillar | Problemseiten bleiben Einstieg | Nach diesem Durchgang: ja |
| K9 | `/automatisierung-arzt` | `/ki-telefonassistent-arzt` | „terminbuchung arztpraxis automatisieren" | Teilweise | Telefon-Seite für Anrufe | Automatisierung ohne Telefonfokus | B FROZEN |
| K10 | `/webdesign-hotel` | `/webdesign-gastronomie` | — | — | keine Überlappung | — | Hypothese **nicht gestützt**: Queries lexikalisch getrennt |

---

## 7 · Technischer Befund: der ausgelieferte Head war nicht der geprüfte

**Mechanik.** `scripts/prerender.mjs` schreibt den `<head>` aus dem Manifest
und **validiert** ihn je Route (Titel, Description, Canonical, Robots), mit
HTML-Escaping. `functions/_middleware.ts` überschrieb diesen Head danach an der
Edge aus einer eigenen 560-zeiligen Tabelle — per String-Interpolation, ohne
Escaping. Bei Abweichung gewann die Edge. Die SEO-Konsistenzprüfung verglich
nur, ob jeder Middleware-Pfad im Manifest existiert, nie die Strings.

**Umfang.** 29 von 86 gemeinsamen Routen wichen in Titel oder Description ab.
Das Muster war einheitlich: die Middleware trug durchgehend die **Copy vor der
Überarbeitung**. Die unterdrückten Manifestwerte waren die geprüften.

**Was dadurch öffentlich stand, obwohl es zurückgenommen war:**

| Route | Was die Edge auslieferte | Warum das nicht gilt |
|---|---|---|
| `/blog/ki-telefonassistent-arztpraxis` | „Termine automatisch buchen" + Jahreszahl 2025 im Titel | `BOOKING_WRITE` = nur nach geprüfter Kundenintegration |
| `/bayern/ki-telefonassistent`, `/ki-telefonassistent-praxis`, `/bayreuth,/muenchen,/regensburg + /ki-telefonassistent` | „bucht Termine", „Terminbuchung" | dito |
| `/bewertungen` | „echte Bewertungen … Überzeugen Sie sich" | Die Seite sagt selbst, dass keine Kundenstimme veröffentlicht ist |
| `/referenzen` | „Echte Projekte, messbare Ergebnisse" | Kundenprojekte nur mit schriftlicher Freigabe, derzeit keine |
| `/ki-telefonassistent-restaurant`, `/`, `/leistungen` | „kein Anruf geht verloren", „jeden Anruf beantwortet" | absolute Zusage, nicht an `FAKTEN.gleichzeitigeAnrufe` gebunden |
| 7 Webdesign-/Standortseiten | pauschal „DSGVO-konform" | genau der Grund, warum `/datenschutz-sicherheit` noindex ist |
| `/webdesign` | „die bei Google ranken" | Ranking-Zusage |

**Was dadurch nie gemessen wurde:**

| Route | Geplante Änderung | Tatsächlich ausgeliefert |
|---|---|---|
| `/webdesign-hotel` | Messpunkt M1, 10.09.2026: „Internetagentur für Hotellerie" | „Direktbuchungen steigern" (alte Fassung) |
| `/verpasste-anrufe-verlust` | Messpunkt M2, 10.09.2026: Titel auf die Kopf-Query | alte Fassung |
| `/bayreuth/website-relaunch` | Titel-Experiment seit 29.08.2026: „Mehr Performance & bessere Rankings" | „Alte Website modernisieren" (alte Fassung) |
| `/blog/ki-telefonassistent-arztpraxis` | Neuausrichtung 05.09.2026 | alte Fassung |

**M1, M2 und das Relaunch-Titelexperiment sind damit ungültig, nicht
gescheitert.** Ihre Erfolgskriterien im Scoreboard sind gegen eine Auslieferung
formuliert, die es nicht gab.

**Behebung.** Die Tabelle ist **entfernt**, nicht korrigiert: der vorgerenderte
Head ist bereits der validierte Manifestwert, und jede Neuschrift an der Edge
kann nur wieder davon abweichen. Gleiche Richtung wie
`src/lib/routing/routeMetadata.ts`, das 2026 die dritte Kopie (in den
Seitenkomponenten) aus demselben Grund beseitigt hat: **das Manifest gewinnt,
nie der Konsument.**

Ausnahme mit genau einem Eintrag: `/bayreuth/website-relaunch` ist eingefroren
und wird gegen die Bytes gemessen, die ein Crawler tatsächlich bekommen hat.
Diese werden an der Edge weiter gehalten, bis der Inhaber entscheidet, ob das
Titelexperiment ausgeliefert (bewusster Reset) oder für ungültig erklärt wird.
Die anderen vier eingefrorenen Routen waren auf beiden Seiten identisch — für
sie ändert der Wegfall der Tabelle nichts.

**Damit es nicht wiederkehrt:** `.github/scripts/test-seo-consistency.mjs` prüft
jetzt, dass die Middleware keine `canonical:`- oder `keywords:`-Felder je Route
mehr trägt, dass sie genau einen Override-Mechanismus deklariert und dass
**jeder** Override-Schlüssel eine eingefrorene Route ist. Sobald das letzte
Experiment graduiert, ist jeder verbleibende Eintrag ein Fehler.

### 7.1 Weitere technische Befunde

| Befund | Bewertung |
|---|---|
| Canonicals, hreflang, Sitemap, `lastmod`, Trailing-Slash-Politik | Geprüft, 90/90 korrekt. Keine Dublette, kein Fremd-Canonical, kein Build-Datum. |
| Titel- und H1-Eindeutigkeit | 93 Routen, keine Dublette, genau eine H1 je Seite. |
| Interne Links | Kein toter Zielpfad. Die einzigen nicht auflösbaren Referenzen sind Asset-Pfade in `app-shell.html` (kein Navigationsziel). |
| FAQ-Antworten fehlen im SSR-Körper | **Unverändert offen.** Die Antworten hängen an `{open && …}`, stehen also nur im `FAQPage`-JSON-LD. Betrifft alle Seiten mit dem Accordion. Die Behebung ändert die Fingerprints **aller** eingefrorenen Routen — erst nach Experimentende (F5). |
| `/ki-telefonassistent/demo` Hydration | **Nicht reproduzierbar.** Die Route trägt keinen SSR-unsicheren Code (kein `useLayoutEffect`, kein Datum, kein `window` im Render), der reale Browser-Hydrationstest läuft grün, und im Repository ist kein Befund dokumentiert. Sie ist allerdings auch **nicht** in der Stichprobe von `src/prerender.hydration.test.tsx`. Empfehlung F6: eigener Branch, der die Route in die Stichprobe aufnimmt — das entscheidet die Frage, statt sie zu glauben. |
| `useLayoutEffect`-Warnungen im Prerender | Harmlos und erklärt: `src/App.tsx:115` stellt die Scrollposition beim Routenwechsel her. Dass der Effekt serverseitig nicht läuft, ist beabsichtigt. |
| Prerender-Abdeckung | 93 Routen (90 indexierbar, 3 noindex) + `404.html` + `app-shell.html`. Manifest ⇄ Router bidirektional in CI erzwungen. Kein Drift. |

---

## 8 · Seiten mit geringem Wert

Keine Löschung in diesem Durchgang. Klassifikation:

| Route(n) | Befund | Empfehlung |
|---|---|---|
| `/anfrage-erhalten` | 0 Impressionen, keine eingehenden Links | **KEEP NOINDEX** — Formularbestätigung, korrekt so |
| `/integrationen`, `/datenschutz-sicherheit` | noindex, inhaltlich fertig, Belege fehlen | **KEEP NOINDEX** bis OWNER-INPUT B/C |
| `/bayreuth`, `/muenchen`, `/regensburg` | 946–1.151 Zeichen, reine Verteiler; `/regensburg` 2.623 Impr. auf Pos. 75,8 | **KEEP als HUB + verstärken** — die Nachfrage ist da, die Seite beantwortet sie nicht |
| `/<stadt>/landingpage` (3) | 3.518–3.695 Zeichen, 5 Links, keine erkennbare Query-Familie | **MERGE-Kandidat** in `/<stadt>/webdesign` (F4) |
| `/<stadt>/lokales-seo` (3) | 3.852–4.072 Zeichen, 5 Links; „lokales seo" ist eine eigene Intention, aber nicht Geschäftspriorität | **KEEP als SUPPORT**, nicht weiter ausbauen |
| `/<stadt>/website-erstellen` (3) | 4.108–4.249 Zeichen, 5–6 Links, überlappt mit `/<stadt>/webdesign` (K5) | **MERGE-Kandidat** (F4) |
| `/ki-telefonassistent-praxis` | 514 → 1 Impressionen, 15.800 Zeichen | **CONSOLIDATION** nach Experimentende (F3) |
| `/webdesign-sport`, `/automatisierung-sport` | 4–5 Links, kein Messwert | **KEEP als SEGMENT**, niedrige Priorität |
| `/webdesign-{branche}-{stadt}` (9) | 6–7 Links, 6.259–13.670 Zeichen | **KEEP** — echte Branche×Ort-Intention, aber nicht vermehren |
| 10 Blog-Beiträge | 1–9 Links; sieben Titel tragen „2025" | **KEEP als REDAKTION** · Jahreszahl nur mit echter Inhaltsaktualisierung entfernen, nie als Titelkosmetik |
| `/bewertungen` | 1.209 Zeichen, 1 Link; sagt selbst, dass es keine Kundenstimme gibt | **KEEP** — Ehrlichkeitsbeleg, kein Ranking-Ziel |
| `/faq` | 680 Zeichen gerenderter Körper (FAQ-Antworten nur im JSON-LD), 1 Link | **KEEP + F5** — der Körper wird erst durch F5 bewertbar |

Kein Eintrag in Klasse „truly unnecessary". Keine Route ist ohne Funktion.

---

## 9 · Eingefrorene Experimente — Nachweis für diesen Durchgang

| Route | Fingerprint | Gelieferter Head | Erwähnungen im Quellbaum |
|---|---|---|---|
| `/bayreuth/webdesign` | unverändert | unverändert | unverändert |
| `/bayreuth/website-relaunch` | unverändert | unverändert (Edge-Override gehalten) | unverändert |
| `/regensburg/website-relaunch` | unverändert | unverändert | unverändert |
| `/muenchen/webdesign-kosten` | unverändert | unverändert | unverändert |
| `/ki-telefonassistent-arzt` | unverändert | unverändert | unverändert |

`src/test/fixtures/protected-experiments.baseline.json` ist **nicht angefasst**
worden, und `npm run seo:baseline` ist **nicht** gelaufen. Alle neun Prüfungen
in `src/protectedExperiments.test.tsx` laufen gegen die unveränderte,
eingecheckte Baseline grün. Die Erwähnungszahl blieb auch dort gleich, wo die
Middleware-Tabelle wegfiel: jede der fünf Routen wird in
`functions/_middleware.ts` weiterhin genau zweimal genannt — jetzt in einem
Kommentar, der festhält, ob ihr gelieferter Head gehalten wird oder aus dem
Manifest kommt. Das ist die Angabe, die ein späterer Leser braucht.

`/kosten-ki-telefonassistent` ist seit dem 12.09.2026 **graduiert** und hier
nicht mehr geschützt.

**Nachtrag 13.09.2026 (Webdesign-Durchgang).** Alle fünf Fingerprints
(Head, H1, Überschriften, Text, JSON-LD, ausgehende Anker) und alle
Erwähnungszahlen unverändert; `src/test/fixtures/protected-experiments.baseline.json`
ist **byte-identisch** mit `main`, `npm run seo:baseline` nicht gelaufen.
`/bayreuth/webdesign` behält den Anker „Webdesign Agentur" →
`/webdesign-agentur-deutschland` als Datum `legacyWebdesignLink` in seiner
Konfiguration (Muster `legacyAutomationLink`). Genau deshalb bleibt
`/webdesign-agentur-deutschland` vorerst live (F9): Die Seite verweist zweimal
auf `/bayreuth/webdesign` und einmal auf `/bayreuth/website-relaunch`; sie zu
löschen hätte die gemessene Inbound-Topologie beider Experimente geändert.

---

## 10 · Folgemissionen, nach erwarteter Wirkung

| # | Mission | Warum zuerst / Warum wartet |
|---|---|---|
| **F1** | **Messreihen korrigieren.** M1, M2 und das Relaunch-Titelexperiment im Scoreboard als ungültig kennzeichnen und ab dem Deploy dieses Branches neu starten. Für `/bayreuth/website-relaunch` entscheiden: ausliefern oder für ungültig erklären. | Ohne das wird gegen Zahlen argumentiert, die nie eine Auslieferung hatten. Kostet nichts, verhindert eine falsche Entscheidung. |
| ~~**F2**~~ | **ERLEDIGT 12.09.2026.** `/automatisierung-unternehmen` per 301 in `/prozessautomatisierung` überführt, Pillar neu aufgebaut, Kostenseite von zwölf unbelegten Beträgen befreit und um einen Wirtschaftlichkeitsrechner ergänzt. Einzelheiten §4.1, Herkunftsprüfung `preisaudit-automatisierung.md`. | Größte ungenutzte Strukturchance: zwei nationale Seiten teilten eine Kopf-Intention, und die Geschäftspriorität 2 hing daran. |
| **F3** | **Praxis-Telefon-Cluster entscheiden**, nach Ende des Arzt-Experiments: `/praxen` vs. `/ki-telefonassistent-arzt` vs. `/ki-telefonassistent-praxis`. Erst Besitz, dann Text. | Volumenstärkste kommerzielle Query-Familie der Domain, und sie bewegt sich ohne Zutun. |
| **F4** | **`/<stadt>/website-erstellen` und `/<stadt>/landingpage` prüfen** — Query×Seite-Export beschaffen, dann über Merge in `/<stadt>/webdesign` entscheiden. | 6 Routen, ~24.000 Zeichen Pflegeaufwand für ungeklärten Nutzen. Braucht Daten, nicht Meinung. |
| **F5** | **FAQ-Antworten in den SSR-Körper** (rendern und per CSS klappen, statt bedingt mounten). | Hebt den bewertbaren Körper **aller** FAQ-Seiten. Ändert die Fingerprints aller eingefrorenen Routen — daher erst nach Experimentende. |
| **F6** | **`/ki-telefonassistent/demo` in die Hydrations-Stichprobe** aufnehmen und den dort vermuteten Fehler beweisen oder ausschließen. | Kleiner, isolierter Branch. Der Verdacht ist derzeit unbelegt; ein Test entscheidet ihn dauerhaft. |
| **F7** | **Geo-Hubs mit Substanz versehen** (`/regensburg` zuerst: 2.623 Impressionen auf Position 75,8). | Vorhandene Nachfrage auf einer Seite mit 1.151 Zeichen. Eigene Mission, weil es Inhalt und nicht Architektur ist. |
| ~~**F8**~~ | **ERLEDIGT 13.09.2026.** `/webdesign` neu aufgebaut, `/kosten-webdesign` von 18 unbelegten Beträgen/Zusagen befreit, Bayreuth-SEO-Eigentümer und Geo-Hub-Titel ausgerichtet. Einzelheiten §5, Herkunftsprüfung `preisaudit-webdesign.md`. | Geschäftspriorität 3; nach F2. |
| **F9** | **`/webdesign-agentur-deutschland` per 301 in `/webdesign` überführen** — nach Graduierung von `/bayreuth/webdesign` und `/bayreuth/website-relaunch`. Vorgehen wie F2: Eintrag in `LEGACY_REDIRECTS`, beide Formen in `public/_redirects`, Route aus Manifest/Router/Sitemap, Komponente löschen, `legacyWebdesignLink` entfernen. Die Seite trägt Preise, Dauern, „A/B-getestet", „nachweislich besser ranken" (`preisaudit-webdesign.md` B1–B8) — bis dahin **nicht** neu schreiben, nur nicht mehr verlinken. | Entschieden 13.09.2026, aufgeschoben, weil die Seite Anker in zwei eingefrorene Experimente trägt: Löschen würde deren gemessene Inbound-Topologie ändern (Inhaber-Review). GSC-Beleg bleibt gültig: 5 Impr., 0 Klicks, markenbezogen. |
| **F10** | **Doppeltes Organization/WebSite/LocalBusiness-JSON-LD entfernen** — `index.html` trägt eine statische Kopie des Graphen, den `LocalBusinessSchema.tsx` auf jeder öffentlichen Seite ohnehin ausliefert; dazu die unvollständigen Organization-Knoten in `PageSEO.tsx` (`publisher`) durch `@id`-Referenzen ersetzen. | Seitenweite Head-Änderung, betrifft alle eingefrorenen Routen und die KI-/Automatisierungs-Messgebiete — eigener technischer Branch nach Experimentende, nie gebündelt (Inhaber-Review 13.09.2026). |

---

## 11 · Die drei Gesamtstrategien

| | **A · Konservativ** | **B · Ausgewogen** | **C · Aggressiv** |
|---|---|---|---|
| **Umfang** | Nur Links, Intentionsklarheit, technische Bereinigung. 90 Routen bleiben. | F1–F3 umsetzen: Automatisierungs- und Praxis-Cluster entscheiden, je eine URL zusammenlegen. ~88 Routen. | F1–F4 plus Standort-Unterseiten: `website-erstellen`, `landingpage`, teils `lokales-seo` zusammenlegen. ~78 Routen. |
| **Betroffene Seiten** | 0 URLs entfernt | 2 (`/automatisierung-unternehmen`, `/ki-telefonassistent-praxis`) | 8–11 |
| **Vorteile** | Kein Ranking-Risiko. Sofort. Exakt der Stand dieses Branches. | Löst die beiden echten Kannibalisierungen. Konzentriert Autorität auf den erklärten Pillar. | Maximale Konzentration, deutlich weniger Pflegeaufwand, klarere Themen-Autorität. |
| **Risiken** | K1 und K2 bleiben ungelöst: die Domain tritt weiter mit zwei Seiten gegen eine Kopf-Query an. | 301 auf `/automatisierung-unternehmen` gibt 22 interne Links und dessen Historie auf. Braucht Inhaber-Freigabe. | `/<stadt>/website-erstellen` hat Impressionen, die noch niemand je Query belegt hat — ohne Query×Seite-Export wird hier blind gelöscht. |
| **Erwartete SEO-Wirkung** | Klein, aber positiv und sicher. Der Automatisierungs-Pillar ist überhaupt erst erreichbar. | Am größten **pro Risiko**: zwei geteilte Kopf-Intentionen werden zu je einer. | Potenziell größer, aber die Varianz steigt stärker als der Erwartungswert. |
| **Pflegeaufwand** | unverändert hoch (90 Routen, 3 Städte × 8) | leicht geringer | deutlich geringer |
| **Umkehrbarkeit** | vollständig | mittel — 301 sind praktisch dauerhaft | schlecht — verlorene URL-Historie kommt nicht zurück |

### Empfehlung: **B · Ausgewogen** — in der Reihenfolge F1 → F2 → F3.

Begründung, in der Reihenfolge der Belegstärke:

1. **F1 ist keine Strategie, sondern eine Voraussetzung.** Drei Messreihen sind
   gegen eine Auslieferung formuliert, die es nie gab. Jede Entscheidung auf
   ihrer Basis wäre zufällig.
2. **Die echten Kannibalisierungen sind K1 und K2, und sie sind belegbar ohne
   Query×Seite-Export** — sie folgen aus Titel, URL und Linkstruktur, nicht aus
   einer Messannahme. Genau dort darf konsolidiert werden.
3. **C scheitert an der Datenlage, nicht am Mut.** Die Standort-Unterseiten
   sammeln Impressionen, deren Query-Zuordnung unbekannt ist. Der Scoreboard
   nennt den fehlenden Query×Seite-Export seit dem 10.09.2026 als offenen
   Punkt; ihn zu beschaffen kostet Minuten, eine falsch gelöschte URL kostet
   Monate. Aggressiv konsolidieren, bevor dieser Export vorliegt, ist nicht
   entschlossen, sondern ungeprüft.
4. **A genügt nicht**, weil es die Ursache nicht berührt: solange zwei Seiten
   denselben Kopfbegriff tragen, verteilt jede Linkverbesserung die Autorität
   weiter auf beide.

C bleibt ein legitimes Ziel — **nach** F4, wenn der Export da ist.

---

## 12 · Regeln, die aus diesem Dokument folgen

1. Eine neue indexierbare Seite braucht eine Zeile in §3–§5 **bevor** sie
   gebaut wird. Lässt sich ihre Intention nicht von allen bestehenden Zeilen
   abgrenzen, gehört sie nicht gebaut.
2. Der ausgelieferte `<head>` kommt aus `src/lib/routing/publicRoutes.ts`.
   Keine zweite Kopie — nicht in der Middleware, nicht in der Komponente.
3. Jede neue indexierbare Seite braucht mindestens einen kontextuellen
   eingehenden Link aus einem Seitenkörper und verweist auf ihren Pillar.
   `node .github/scripts/test-prerender-output.mjs` prüft das; für die drei
   Pillars ist es ein harter Fehler.
4. Kannibalisierung wird über Intention und Architektur gelöst, nie über ein
   Canonical auf eine fremde URL.
5. Eingefrorene Routen: kein Head, kein Körper, kein Link, **und keine Änderung
   der Erwähnungszahl im Quellbaum** — Kommentare eingeschlossen.
6. Jede geänderte URL kommt mit Datum, Hypothese und Abbruchkriterium in
   `organic-growth-scoreboard.md`.

---

## 13 · Nachtrag 17.09.2026 — Autoritätslauf (Branch `claude/seo-authority-sprint-2026-09-17`)

Basis-Commit `d0f2083` (main). GSC-Stand laut Auftrag: bis 2026-09-14, als
Query×Seite-Paare genannt (nicht als Seiten-Aggregate) — die Werte stehen in
`organic-growth-scoreboard.md`, Messpunkt 17.09.2026.

### 13.1 Schutzkarte, vor der Umsetzung gebaut

| Klasse | Routen | Regel in diesem Lauf |
|---|---|---|
| **A** · eingefroren, keine Änderung | `/bayreuth/webdesign`, `/bayreuth/website-relaunch`, `/regensburg/website-relaunch`, `/muenchen/webdesign-kosten`, `/ki-telefonassistent-arzt` | Head, Körper, JSON-LD, Anker und Erwähnungszahl im Quellbaum unverändert; Baseline nicht angefasst |
| **A′** · HALT (Messfenster läuft, §HALT in `post-experiment-opportunities.md`) | `/ki-telefonassistent` (A5), `/prozessautomatisierung` (M23), `/kosten-ki-telefonassistent` (graduiert 12.09.) | **Kein** Head, keine H1, kein Körpertext geändert. Auf der Kostenseite genau eine Faktenkorrektur (§13.4), wie es die Graduierung vorgesehen hatte |
| **A″** · Ledger 14.09. (Deploy + 28 d) | `/webdesign`, `/kosten-webdesign`, `/bayreuth`, `/muenchen`, `/regensburg`, `/bayreuth/lokales-seo`, `/webdesign-hotel` (M1), `/verpasste-anrufe-verlust` (M2), `/kosten-automatisierung` | Körper unverändert. Eingehende Links **aus Blogbeiträgen** kommen hinzu (Störgröße, protokolliert) |
| **C** · frei | Blogbeiträge, `/regensburg/webdesign`, `/muenchen/webdesign` (Stadtseiten-Messung seit 14.09. ohnehin kontaminiert), `/deutschland` | optimiert |
| **D** · Unterstützer mit indirekter Wirkung | `/webdesign-agentur-deutschland` (Quelle für zwei eingefrorene Routen) | **nicht** angefasst (F9) |
| **E** · Shell | Navigation, Hero-Chips, Footer | außerhalb `<main>` → kein Fingerabdruck betroffen; Ziel-Pfade unverändert, nur Ankertext |

### 13.2 Befund: Blog als Sackgasse

Vor diesem Lauf verlinkte **kein** Beitrag der Kategorien KI-Automatisierung,
KI-Telefonassistent und Digitalisierung eine kommerzielle Seite — nur andere
Beiträge und `/kontakt`. Das betraf auch `/blog/prozessautomatisierung-roi`,
die einzige Seite des Automatisierungs-Clusters mit einer Seite-1-Query
(„wie berechnet man den roi der automatisierung eines geschäftsprozesses?",
Pos. ~8). Ihre Autorität endete auf der Seite selbst. Die Webdesign-Beiträge
hatten den `weiterfuehrend`-Block seit 13.09.; der Rest nicht.

**Behoben:** sechs Beiträge tragen jetzt `weiterfuehrend` auf ihren Eigentümer
(Tabelle in §13.3). Kein Beitrag zeigt auf eine eingefrorene Route.

### 13.3 Eigentümerkarte — vorher/nachher

Kein Eigentümer hat gewechselt. Was sich geändert hat, ist, **wer den
Eigentümer stützt**:

| Query-Familie | Eigentümer (unverändert) | Neue Unterstützer (17.09.) | Bewusst nicht |
|---|---|---|---|
| „prozessautomatisierung", „geschäftsprozesse automatisieren" | `/prozessautomatisierung` | `/blog/prozessautomatisierung-roi`, `/blog/ki-automatisierung-kleine-unternehmen`, `/blog/digitalisierung-mittelstand`; Navigation und Hero nennen den Kopfbegriff | Körper (HALT) |
| „prozessautomatisierung roi", ROI-Fragen | `/blog/prozessautomatisierung-roi` (REDAKTION) | Beitrag inhaltlich erweitert (§13.5), Jahreszahl aus dem Titel — mit echter Aktualisierung, wie §8 es verlangt | — |
| „automatisierung kosten" | `/kosten-automatisierung` | ROI-Beitrag und KMU-Leitfaden verweisen auf den Rechner | Körper (Ledger) |
| „ki telefonassistent" + Varianten | `/ki-telefonassistent` | `/blog/verpasste-anrufe-kosten`, `/blog/ki-telefonassistent-restaurant` | Körper (HALT A5) |
| „verpasste anrufe kosten" | `/verpasste-anrufe-verlust` (PROBLEM) | `/blog/verpasste-anrufe-kosten` verweist als Rechenbeitrag auf die Problemseite — vorher standen beide ohne Verbindung auf verwandten Queries (**K11**, jetzt Hierarchie statt Konkurrenz) | Titel der Problemseite (M2) |
| „website bringt keine anfragen" | `/keine-anfragen-website` (PROBLEM) | `/blog/website-ohne-anfragen` verweist auf Problemseite und Pillar (**K12**, dito) | — |
| „ki telefonassistent restaurant" | `/ki-telefonassistent-restaurant` | Blogbeitrag verweist auf Segment und Pillar; Description des Beitrags trug „Wartelisten führen, Gäste nachqualifizieren – ohne Personal" — nicht belegte Fähigkeiten, ersetzt | — |
| „webdesign regensburg", „webdesign agentur regensburg" | `/regensburg/webdesign` | Körper bereinigt (§13.6) und verweist kontextuell auf den Pillar | Titel/H1 (passen zur Query-Familie) |
| „webdesign kosten <stadt>" | `/<stadt>/webdesign-kosten` | unverändert | — |

### 13.4 Faktenkorrektur auf der graduierten Kostenseite

`/kosten-ki-telefonassistent` trug unter „Was nicht extra kostet" den Satz
„10 gleichzeitige Anrufe in jedem Tarif". Die Zahl war seit dem 11.09.2026
als **nicht belegt** dokumentiert und überlebte nur, weil die Route
eingefroren war; die Graduierung am 12.09. hatte ausdrücklich festgehalten:
„entweder belegt oder sie verschwindet auch dort". Sie ist jetzt durch
`FAKTEN.gleichzeitigeAnrufeKurz` ersetzt („Mehrere Anrufe zur selben Zeit"),
`FAKTEN.gleichzeitigeAnrufe` ist aus dem Baum entfernt. Titel, Description,
H1, Reihenfolge und Rechner der Seite sind unverändert (HALT).

Geprüft und **nicht** geändert: Die Praxis-Rahmung der Kostenseite
(Breadcrumb „Für Praxen", Tarife Basis/Praxis/MVZ, Schema-Name). Die Tarife
sind laut `telefonassistent-copy.ts` Praxistarife; eine generische Fassung
wäre eine Preisaussage für Kunden, für die kein Preis dokumentiert ist —
`BLOCKED — EVIDENCE`, siehe `post-experiment-opportunities.md`.

### 13.5 `/blog/prozessautomatisierung-roi` — echte Aktualisierung

Neu: welche Kosten in die Rechnung gehören (einmalig/laufend getrennt, in
derselben Systematik wie `/kosten-automatisierung`), die vier Kostentreiber,
Amortisationszeit als zweite Kennzahl, „wann sich Automatisierung nicht
rechnet" (vier Konstellationen), eine FAQ zur Frage, ob eingesparte Zeit ohne
Personalabbau als Ersparnis zählt. Das erfundene Rechenbeispiel bleibt als
solches gekennzeichnet; keine Cogniiq-Ergebnisse, keine Kundenwerte. Titel
ohne Jahreszahl, `updatedAt` und Sitemap-`lastmod` auf 2026-09-17.

### 13.6 Stadt-Webdesign-Seiten Regensburg und München

Beide Seiten trugen unter „Beispielszenarien" Texte, die als Ergebnisse
formuliert waren („steigen Direktbuchungen deutlich", „verbessert sie ihre
Sichtbarkeit deutlich", „steigen Neupatientenanfragen deutlich") — ohne
Kundenfreigabe und ohne Messung, also das Muster, das `HONESTY-AUDIT.md`
§7.7 ausschließt. Regensburg trug zusätzlich einen Absatz, der die eigenen
Ziel-Suchbegriffe wörtlich aufzählte („Wir optimieren … für Suchanfragen wie
'Webdesign Agentur Regensburg'"). Beides ersetzt: Szenarien beschreiben jetzt
die Maßnahme und benennen ausdrücklich, dass das Ergebnis nicht versprochen
wird; der Absatz erklärt stattdessen, was die Stadtseite gegenüber dem Pillar
besitzt, und verlinkt `/webdesign` kontextuell. „Google My Business" →
„Google-Unternehmensprofil". `/bayreuth/webdesign` (eingefroren) trägt dieselben
Muster weiter — F-Eintrag nach Graduierung.

### 13.7 Shell

Navigation und beide Hero-Chips nannten den Automatisierungs-Pillar
„Automatisierung", der Footer verlinkte ihn zweimal (einmal „Automatisierung",
einmal „Prozessautomatisierung"). Jetzt: ein Ankertext, der Kopfbegriff.
Ziel-Pfade unverändert; der Fuß-Verweisstreifen der Stadt-×-Leistung-Seiten
(innerhalb `<main>`, Teil des Bayreuther Fingerabdrucks) ist **nicht**
angefasst.

### 13.8 Technischer Befund

Aus dem vorgerenderten `dist/` (90 indexierbare Routen): Canonicals
selbstreferenziell, `robots` korrekt, genau eine H1 je Seite, keine
H1- und keine Titel-Dublette, Sitemap deckungsgleich, `Article` auf allen zehn
Beiträgen, `BreadcrumbList` auf 90, `FAQPage` auf 71 Seiten. Kein P0-Befund.
F5 (FAQ-Antworten im SSR-Körper) und F10 (doppeltes Organization-JSON-LD)
bleiben, weil beide die Fingerabdrücke der eingefrorenen Routen ändern.
