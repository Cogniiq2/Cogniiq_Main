# Suchintentions-Architektur der öffentlichen Seite

Angelegt: 2026-09-12 · Branch `claude/seo-architecture-max-2026-09-12` ·
Basis-Commit `3e44c84` · Datenstand Messung: GSC-Exporte vom 2026-09-10
(3 Monate 2026-06-09–2026-09-08, 28 Tage 2026-08-12–2026-09-08)

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

### 5.1 Die fünf Eigentümerfragen der Mission, beantwortet

1. **Generisches `webdesign`** → `/webdesign`. Heute mit 3.103 Zeichen und (vor
   diesem Durchgang) einem kontextuellen eingehenden Link die schwächste
   Pillar-Seite der Domain — bei 34 ausgehenden Links. Sie verteilt Autorität
   und bekommt keine.
2. **Lokale kommerzielle Intention** → `/<stadt>/webdesign`. Das funktioniert
   bereits: 27–28 eingehende Links je Seite, und sie sind die
   impressionsstärksten URLs der Domain (`/regensburg/webdesign` 2.347 Impr. in
   28 Tagen).
3. **Kosten-Intention** → `/kosten-webdesign` national, `/<stadt>/webdesign-kosten`
   lokal. Vier Seiten auf eine Preisfrage ist die zweitgrößte Überlappung der
   Domain (§6).
4. **Hotel** → `/webdesign-hotel`, eindeutig und sauber getrennt. Seit 10.09.2026
   auf „Internetagentur für Hotellerie" gezogen — **hat bis 12.09. nicht
   gewirkt**, siehe §7.
5. **Substanzielle Überlappung** → `/webdesign` ↔ `/webdesign-agentur-deutschland`
   (beide „webdesign agentur"), und `/<stadt>/webdesign` ↔
   `/<stadt>/website-erstellen` (§6).

| Route | Intention | Rolle | Kontext-Links vorher → nachher |
|---|---|---|---|
| `/webdesign` | „webdesign agentur", „website erstellen lassen" | **PILLAR** | **1 → 4** |
| `/webdesign-agentur-deutschland` | „webdesign agentur deutschland" (national, nicht generisch) | PILLAR (national) | 19 |
| `/kosten-webdesign` | „webdesign kosten", „was kostet eine website" | **KOSTEN** | 9 |
| `/webdesign-hotel` | „internetagentur hotel", „webdesign hotel" | SEGMENT | 10 · 814 Impr., Pos. 36,0 |
| `/webdesign-arzt` | „webdesign arztpraxis" | SEGMENT | 12 |
| `/webdesign-gastronomie` | „webdesign restaurant/gastronomie" | SEGMENT | 11 |
| `/webdesign-immobilien` | „webdesign immobilienmakler" | SEGMENT | 11 |
| `/webdesign-sport` | „webdesign sportverein/fitnessstudio" | SEGMENT | 5 |
| `/webdesign-{arzt,gastronomie,immobilien}-{bayreuth,muenchen,regensburg}` | „webdesign <branche> <stadt>" | SEGMENT (Branche×Ort) | je 6–7 |
| `/keine-anfragen-website` | „website bringt keine anfragen" | PROBLEM | 19 |
| `/blog/webdesign-konversion-tipps`, `/blog/website-ohne-anfragen`, `/blog/webdesign-agentur-auswahl`, `/blog/lokales-seo-unternehmen` | informational | REDAKTION | 1–6 · Titel mit „2025" |

### 5.2 Standort-Familien

Je Stadt (`/bayreuth`, `/muenchen`, `/regensburg`) existieren acht
Unterseiten: `webdesign`, `ki-telefonassistent`, `automatisierung`,
`webdesign-kosten`, `website-erstellen`, `landingpage`, `website-relaunch`,
`lokales-seo`. Die drei erstgenannten tragen die Familie (24–28 eingehende
Links, 9.500–14.000 Zeichen). Die übrigen fünf liegen bei 3.500–5.300 Zeichen
und 5–6 eingehenden Links.

Die Geo-Hubs selbst (`/bayreuth` 952, `/muenchen` 946, `/regensburg` 1.151
Zeichen) sind **die dünnsten indexierbaren Seiten der Domain** bei 15
eingehenden Links — reine Verteiler. `/regensburg` sammelt dabei 2.623
Impressionen in 28 Tagen auf Ø Position **75,8**: viel Nachfrage, die auf einer
Seite landet, die nichts beantwortet.

---

## 6 · Kannibalisierungsmatrix

Reihenfolge nach Tragweite. **Keine Zeile rechtfertigt für sich eine
Zusammenlegung von URLs**, solange kein Query×Seite-Export vorliegt — und
**keine** wird mit einem Canonical „gelöst": ein Canonical ist kein
Keyword-Werkzeug, sondern eine Aussage über Identität.

| # | Seite A | Seite B | Überlappende Query-Familie | Absichtlich? | Gewinner | B soll stattdessen | Links verstärken den Richtigen? |
|---|---|---|---|---|---|---|---|
| ~~K1~~ | `/prozessautomatisierung` | ~~`/automatisierung-unternehmen`~~ | „automatisierung für unternehmen", „prozessautomatisierung", „ki automatisierung" | **Nein** | A | **GELÖST 12.09.2026** — B per 301 in A überführt, F2 umgesetzt (§4.1) | Ja: B existiert nicht mehr, alle 22 Links zeigen auf A (eine Ausnahme, eingefroren) |
| K2 | `/webdesign` | `/webdesign-agentur-deutschland` | „webdesign agentur" | Nein | A generisch, B national | B schärft auf „deutschlandweit/remote" | Nein → A 4, B 19 |
| K3 | `/praxen` | `/ki-telefonassistent-arzt`, `/ki-telefonassistent-praxis` | „ki telefonassistent praxis/arztpraxis" | Teilweise | A kommerziell | `-praxis` ist Konsolidierungskandidat | Teilweise · B FROZEN (F3) |
| K4 | `/kosten-webdesign` | `/bayreuth,/muenchen,/regensburg + /webdesign-kosten` | „webdesign kosten <stadt>" | Ja, lokal vs. national | je nach Ortsbezug | unverändert | Ja · `/muenchen/webdesign-kosten` FROZEN |
| K5 | `/<stadt>/webdesign` | `/<stadt>/website-erstellen` | „webdesign <stadt>" ↔ „website erstellen <stadt>" | Fraglich | `/<stadt>/webdesign` | `website-erstellen` ist der schwächere Zwilling (F4) | Ja (27 vs. 5–6) |
| K6 | `/regensburg` | `/regensburg/webdesign` | „webdesign regensburg" (700 Impr., Pos. 57,8) | Nein | `/regensburg/webdesign` | Hub bleibt Verteiler, braucht eigene Substanz | Unklar — **nicht entscheidbar ohne Query×Seite** |
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
| **F8** | **`/webdesign` als Pillar ausbauen** — 3.103 Zeichen bei 34 ausgehenden Links sind kein Pillar, und K2 gegen `/webdesign-agentur-deutschland` bleibt sonst ungelöst. | Geschäftspriorität 3; nach F2. |

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
