# ASSETS-REQUIRED — Beweis-Assets, die Bausteine freischalten

Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Regel: Bausteine mit fehlendem Asset rendern **nichts** — kein Platzhalter im
DOM, keine Ersatzstimme, kein erfundenes Zitat. Jedes Asset unten nennt, was es
freischaltet und wie es beschaffen sein muss.

## A1 · Stimmprobe (M13) — höchste Hebelwirkung

| | |
|---|---|
| Was | Audioaufnahme eines **nachgestellten Beispielanrufs** (Ihre Vorgabe: kein echter Patientenanruf, keine Patientendaten) |
| Schaltet frei | `StimmprobeSection` auf `/ki-telefonassistent`, `/ki-telefonassistent-arzt`, `/ki-telefonassistent-praxis` und den drei Stadtseiten — Komponente ist fertig gebaut und rendert, sobald die Datei eingetragen ist |
| Spezifikation | 30–90 s · MP3 oder M4A, mono, ≥128 kbit/s · Ablage `public/audio/` · Szenario: ein typischer Terminwunsch inkl. Ansage, dass ein Sprachassistent spricht · dazu: vollständiges Transkript (Sprecherwechsel) und eine Caption-Zeile („Terminwunsch am Montagmorgen") |
| Pflicht-Label | fest verdrahtet, nicht abschaltbar: „Beispielanruf, nachgestellt — kein echter Patientenanruf." |
| Einbau | `src/components/StimmprobeSection.tsx` → Konstante `STIMMPROBE` (src, caption, transcript) |
| Einwilligung | Sprecher der nachgestellten Anruferrolle: schriftliche Einwilligung zur Veröffentlichung |

## A2 · Übergabe sichtbar (M14)

| | |
|---|---|
| Was | Screenshot **oder** 20–30-s-Bildschirmaufnahme dessen, was das Team nach einem Anruf tatsächlich sieht (Kalendereintrag / strukturierter Eintrag / Liste) |
| Schaltet frei | M14-Baustein auf Service- und (nach Freigabe) Integrationen-Seite; Text drumherum existiert, der visuelle Slot wartet |
| Spezifikation | PNG ≥1600 px Breite oder MP4/WebM ≤30 s · **ohne echte Patientendaten** — Demodaten verwenden · sichtbar: Anliegen, Rückrufnummer, nächster Schritt |
| Status | **blockiert** zusätzlich durch OWNER-INPUT B (in welches System wird übergeben?) |

## A3 · Referenzpraxis (M22)

| | |
|---|---|
| Was | Eine reale Referenz: Praxistyp, Größe, Region, echtes Zitat, **schriftliche Einwilligung**. Anonymisiert zulässig („Hausarztpraxis mit drei Behandlern, Oberfranken") |
| Schaltet frei | M22-Referenzbaustein (noch nicht gebaut — wird mit dem Asset gebaut, damit kein leerer Slot im DOM existiert) |

### A3.1 · Entfernte Bestandsinhalte — Wiederherstellung nur nach schriftlicher Einwilligung

Am 16.08.2026 wurden alle benannten Kundeninhalte aus dem Rendering entfernt
(Commit siehe `HONESTY-AUDIT.md`). Grund: keine dokumentierte schriftliche
Einwilligung des benannten Dritten im Repository. **Wiederherstellung nur nach
schriftlicher Einwilligung** des Kunden — dann als neuer, freigegebener Inhalt.

**Entferntes Zitat** (war auf `/referenzen`, `/bewertungen` und allen
Cluster-Seiten):

> „Die neue Website und das Buchungssystem funktionieren deutlich zuverlässiger
> als vorher. Besucher finden schneller, was sie suchen, und Reservierungen
> laufen jetzt ohne manuelle Abstimmung. Insgesamt wirkt der Auftritt deutlich
> moderner und professioneller."
>
> — Betreiber, Sportanlage Region Bayreuth
> Projekt: SV Heinersreuth – Website + Buchungsautomatisierung

**Entfernte Fallstudie** (war auf `/referenzen`, inkl. JSON-LD `mainEntity` und
Meta-Description): Vollständige Projektbeschreibung „Digitale Infrastruktur für
den SV Heinersreuth e.V." mit Ausgangslage, Zielbild, Leistungsumfang (Website-
Relaunch, Buchungs- und Zahlungssystem, Admin-Center, Mitglieder- und
Gutscheinverwaltung, Finanz-/Steuerfunktionen, Hosting/Monitoring), der
Flutlicht-Kopplung der Padelanlage und dem Ergebnisabschnitt. Der volle Wortlaut
steht in der Git-Historie (Datei `src/pages/ReferenzenPage.tsx` vor dem
Entfernungs-Commit).

**Warum nicht anonymisiert weiterverwendet:** Sportverein + Padelanlage +
Flutlichtsteuerung + Region Bayreuth identifizieren den Kunden auch ohne Namen.
Eine „anonymisierte" Fassung wäre eine Scheinlösung.

**Was für eine Wiederveröffentlichung nötig ist:** schriftliche Einwilligung des
Vereins, die ausdrücklich Namensnennung, Projektbeschreibung und (falls
gewünscht) das Zitat abdeckt — mit Datum und benannter zeichnungsberechtigter
Person.

## A4 · Ansprechpartner (M18)

| | |
|---|---|
| Was | Foto + Name + Rolle der Person, die Praxen tatsächlich erreichen |
| Schaltet frei | M18 „Änderungen und Betreuung" — Baustein wartet zusätzlich auf OWNER-INPUT D (Erreichbarkeitsfenster, Reaktionszeit, Änderungsfrist) |
| Spezifikation | Foto quadratisch ≥800 px, natürlices Licht, kein Stock · Einwilligung der Person |

## A5 · Gemessene Übernahmequote (F4)

| | |
|---|---|
| Was | Eigene, konservativ gerechnete Quote (netto nach Nacharbeit) aus realem Betrieb |
| Schaltet frei | Erst damit dürfen ROI-Rechner oder Seiten mit einer Cogniiq-Quote werben; bis dahin rechnet der Rechner ausschließlich mit Besucher-Eingaben (so umgesetzt) |

## B1 · Was `/integrationen` indexierbar macht

Stand 17.08.2026: Die Seite ist inhaltlich fertig und ehrlich, steht aber auf
`indexable: false`. Grund ist nicht fehlender Text, sondern fehlende Substanz —
sie beantwortet die Suchintention „KI Telefonassistent Anbindung PVS" derzeit
mit „gibt es bei uns nicht". Das ist als Aussage richtig und gehört auf die
Seite; als *indexierte Landingpage* wäre es eine Seite, die für ihr Hauptkeyword
das Gegenteil dessen liefert, was der Suchende sucht.

**Damit die Seite in den Index kann, reicht eines der beiden:**

| # | Was Sie liefern | Was sich dann ändert |
|---|---|---|
| **B1.1** | **Mindestens eine real bestehende Anbindung** — ein System, in das ein Anrufergebnis heute tatsächlich ohne Handarbeit gelangt. Gebraucht werden: Name des Systems, was genau übertragen wird (Termin? Eintrag? Aufgabe?), ob es bei einem Kunden produktiv läuft, und ob der Systemname genannt werden darf | Die Seite bekommt einen vierten Abschnitt „Was heute angebunden ist" mit dem konkreten System. Erst damit hat sie eine positive Antwort auf ihr Hauptkeyword und wird indexierbar. Der Abschnitt „Was wir nicht behaupten" bleibt trotzdem stehen — er wird dann präziser, nicht kleiner |
| **B1.2** | **Eine belastbare Aussage zur Schnittstellenprüfung** — nicht „wir prüfen das", sondern: welche Schnittstellenarten Sie technisch verarbeiten können (REST-API? Kalender über CalDAV oder ICS? E-Mail-Übergabe in ein festes Format? Webhook?), wie lange die Prüfung dauert und was sie kostet, wenn sie zu einer Anbindung führt | Die Seite kann beschreiben, *woran* sich eine Anbindung entscheidet, statt sie nur zu versprechen. Das beantwortet die Suchintention ebenfalls — „welche Schnittstelle brauche ich?" ist eine echte Frage — und macht die Seite indexierbar, auch ohne ein einziges angebundenes System |

**Was NICHT reicht:** eine Absichtserklärung, eine Liste geplanter Anbindungen,
oder die Nennung von PVS-Namen ohne bestehende Verbindung. Eine Liste
unterstützter Systeme, die in Wahrheit eine Wunschliste ist, wäre genau das
Muster, das `COPY-BRIEF.md` §7.5 untersagt.

**Sobald eines von beidem vorliegt:** `indexable: true` in `publicRoutes.ts`,
Aufnahme in die Sitemap über den bestehenden Generator, Verlinkung von
`/praxen` aus, und Ergänzung des Abschnitts. Bis dahin ist die Seite über die
interne Verlinkung erreichbar und erfüllt ihren Zweck im Verkaufsgespräch.

## B2 · Was `/datenschutz-sicherheit` indexierbar macht

Stand 17.08.2026: Die Seite ist ehrlich und für das Verkaufsgespräch brauchbar,
steht aber auf `indexable: false`. Der Grund ist derselbe wie bei
`/integrationen`: Sie beantwortet ihre eigene Suchintention — „KI
Telefonassistent DSGVO Arztpraxis" — überwiegend mit „können wir noch nicht
belegen". Als Aussage richtig, als indexierte Landingpage die falsche Antwort.

**Anders als bei `/integrationen` reicht hier kein einzelner Baustein.** Der
Datenschutz-Gatekeeper prüft die Kette, und eine Kette mit einem offenen Glied
ist offen. Alle vier Punkte werden gebraucht:

| # | Was Sie liefern | Warum es ohne nicht geht |
|---|---|---|
| **B2.1** | **Signierte Auftragsverarbeitungsverträge mit allen Unterauftragsverarbeitern** — nach Art. 28 Abs. 4 DSGVO, lückenlos für jeden Dienst, über den Gesprächsinhalte laufen | Ohne durchgehende Kette ist die Auftragsverarbeitung nicht sauber abgebildet. Solange hier eine Lücke besteht, darf die Website über Verarbeitung nichts zusagen |
| **B2.2** | **Geklärter Verarbeitungsort** — für jeden beteiligten Dienst: in welchem Land verarbeitet wird, und bei Drittlandbezug, auf welcher Grundlage (Angemessenheitsbeschluss, Standardvertragsklauseln, Zusatzmaßnahmen) | Die erste Frage jedes Datenschutzbeauftragten. Bis sie beantwortet ist, steht auf der gesamten Website keine Aussage zu Servern oder Verarbeitungsort |
| **B2.3** | **Liste der Unterauftragsverarbeiter** — Name, Zweck, Verarbeitungsort, jeweils veröffentlichungsfähig. Praxen brauchen sie für ihr Verarbeitungsverzeichnis und für die Information ihrer Patienten | Ohne diese Liste kann eine Praxis ihr eigenes Verzeichnis nach Art. 30 DSGVO nicht führen — sie kann Sie also gar nicht rechtssicher einsetzen |
| **B2.4** | **TOM-Dokument** — technische und organisatorische Maßnahmen nach Art. 32 DSGVO, in der Form, die als AVV-Anlage taugt | Nachweispflicht. Eine unvollständige oder stichwortartige Fassung ist schlechter als keine, weil sie Vollständigkeit suggeriert |

**Zusätzlich empfehlenswert, nicht zwingend:** die beiden noch offenen
`[[CLAIM]]` aus den Inhaber-Antworten C schließen — die finalisierte
AVV-Vorlage und die ausformulierte Klausel zur Schweigepflicht nach § 203 StGB.
Beide stehen heute als Zusage auf der Seite; ohne fertige Dokumente sind sie
Absichtserklärungen.

**Was sich mit den vier Punkten ändert:** Abschnitt 3 („Was wir nicht
behaupten") schrumpft auf die eine Aussage, die dauerhaft richtig bleibt —
dass „DSGVO-konform" keine Eigenschaft ist, die ein Anbieter sich selbst
ausstellt. Die Fragenliste in Abschnitt 2 bekommt neben jeder Frage die
Antwort. Damit hat die Seite eine positive Antwort auf ihr Hauptkeyword und
wird indexierbar; Downloads für AVV und TOM kommen als eigener Abschnitt dazu.

**Was NICHT reicht:** ein Hinweis, dass Verträge „in Vorbereitung" sind, eine
TOM-Liste in Stichworten, oder die Angabe eines Verarbeitungsorts ohne
unterzeichneten Vertrag dahinter.

## C · Vollständige Liste der ungerenderten Bausteine (Stand 18.08.2026)

Diese Bausteine sind gebaut und geprüft, rendern aber **nichts** — sie warten
auf ein Asset. Keiner hinterlässt einen Platzhalter im DOM; im ausgelieferten
HTML ist an ihrer Stelle nichts. Gegenprobe über alle 92 Dokumente: null
Treffer für „Beispielanruf, nachgestellt" und „Referenzpraxis".

| # | Baustein | Datei | Steht auf | Wartet auf | Was es freischaltet |
|---|---|---|---|---|---|
| 1 | **M13 Stimmprobe** | `components/StimmprobeSection.tsx` (Schalter: `STIMMPROBE.src = null`) | `/praxen`, `/ki-telefonassistent`, beide Segmentseiten, drei Stadtseiten — **7 Seiten** | Audiodatei eines nachgestellten Beispielanrufs, 30–90 s, ohne Patientendaten (A1) | Einwand #1 („Meine Patienten kommen mit einer Computerstimme nicht klar"), den kein Text beantworten kann. Der stärkste Einzelbaustein der Website |
| 2 | **M14 Bildbeleg der Übergabe** | `components/TelefonassistentBeweiskette.tsx` Zeile 234, Textteil rendert bereits | `/praxen`, beide Segmentseiten | Screenshot oder 20–30-s-Bildschirmaufnahme des Dashboards nach einem Anruf (A2) | Einwand #2, der dokumentierte Abbruchgrund Nr. 1. Der Text steht; ihm fehlt der Beleg |
| 3 | **M18 Foto des Ansprechpartners** | `components/TelefonassistentBeweiskette.tsx`, Kommentar im `betreuung`-Abschnitt | `/praxen`, beide Segmentseiten | Foto Lazar Popovic, freigegeben (A4) | Name, Rolle und Erreichbarkeit stehen bereits. Ein Gesicht schlägt bei diesem Käufer ein Ticketsystem-Versprechen deutlich |
| 4 | **M22 Referenz** | `components/TestimonialBlock.tsx` | keine Seite — Komponente ist aus allen Seiten entfernt | Referenzpraxis mit schriftlicher Einwilligung; anonymisiert zulässig (A3) | Die Website hat heute **keine einzige Kundenstimme** |
| 5 | **Referenz-Fallstudie** | `pages/ReferenzenPage.tsx` | `/referenzen` — Seite rendert ohne Fallstudie | Referenzprojekt mit schriftlicher Einwilligung (A3.1) | Die Seite existiert, trägt aber keinen Fall. Der frühere Inhalt benannte einen realen Verein ohne dokumentierte Einwilligung und ist vollständig entfernt, inklusive Meta-Description und JSON-LD |

**Regel, die für alle fünf gilt:** Kein Ersatz, keine Andeutung, kein
Platzhalter. Keine synthetische Stimmprobe, kein Stock-Screenshot, kein
erfundenes Zitat, keine anonymisierte Restfassung, die den Beteiligten
trotzdem identifizierbar lässt. Ein leerer, markierter Platz ist das richtige
Ergebnis, solange das Asset fehlt.

**Reihenfolge nach Wirkung:** 1 vor 2 vor 3 vor 4. Die Stimmprobe steht auf
sieben Seiten und beantwortet den härtesten dokumentierten Einwand; sie ist die
einzige Lieferung, die den Charakter der Website spürbar ändert.

## C1 · Leerer Abzeichen-Streifen im Desktop-Hero der Startseite

Stand 18.08.2026: Der Streifen unter dem Hero (`components/hero/DesktopHero.tsx`)
trug drei Abzeichen, die alle drei in diesem Durchgang entfallen sind —
„DSGVO-konform" (Konformitätszusage ohne Grundlage), „Europäische Server"
(Verarbeitungsort, gesperrt nach HONESTY-AUDIT §7.7) und „Go-Live typischerweise
in 7–14 Tagen" (widersprach der 7-Tage-Garantie). Der Streifen ist damit leer und
vollständig aus dem Markup entfernt.

**Inhaber-Entscheidung 18.08.2026: nicht wieder auffüllen, solange nichts
Belegtes zur Verfügung steht.**

Belegbar wäre heute schon einiges. Alle vier Aussagen stehen bestätigt in
`FAKTEN` und sind durch `telefonassistent-copy.test.ts` gegen Abweichung
gesichert:

| Kandidat | Quelle | Warum er trägt |
|---|---|---|
| **7-Tage-Go-live-Garantie mit Vertragsstrafe** | `FAKTEN.goLive` | Nach COPY-BRIEF-3 §3.3 das stärkste Einzelargument der gesamten Website — eine Zusage mit finanzieller Konsequenz, nicht bloß ein Zeitraum |
| **Änderungen umgesetzt in 3 Tagen** | `FAKTEN.aenderungen` | Kontert den dokumentierten Abbruchgrund Nr. 1 im Betrieb: 52 % nennen unzureichenden Support als Wechselgrund (Zi 2026) |
| **Kündigung mit einem Klick im Dashboard** | `FAKTEN.kuendigung` | Risikoumkehr statt Dringlichkeit (§3.3). „Ich komme nicht mehr raus" ist eine der belegten Kaufängste |
| **10 gleichzeitige Anrufe, kein Besetztzeichen** | `FAKTEN.gleichzeitigeAnrufe` | Spezifität schlägt Superlativ (§3.1) — eine prüfbare Zahl statt „deutliche Entlastung" |

**Warum das trotzdem ein eigener Auftrag ist und nicht beiläufig passiert:**

1. Der Hero der Startseite ist **branchenübergreifend**. Alle vier Kandidaten
   gelten für den Telefonassistenten, nicht für Webdesign oder Automatisierung.
   Ein Abzeichen dort verspricht dem Webdesign-Interessenten etwas, das für ihn
   nicht gilt — dieselbe Fehlerklasse, die in diesem Durchgang mehrfach
   aufgeräumt wurde.
2. `DesktopHero` importiert heute nichts aus `telefonassistent-copy.ts`. Eine
   Kopplung wäre nach HONESTY-AUDIT §7.4.2 zu prüfen, nicht nebenbei zu setzen.
3. Der Streifen ist eine **geteilte Fläche** nach §9 — was dort steht, steht auf
   der Startseite und wirkt auf jeden Besucher.

Empfehlung für den Folgeauftrag: den Streifen nur dann zurückholen, wenn er
produktbezogen ausgespielt wird, und dann mit der Go-live-Garantie an erster
Stelle.

## D · Seiten, die auf `noindex` stehen

Kein Asset im engeren Sinn, aber dieselbe Mechanik: Die Seiten sind fertig und
ehrlich, dürfen aber nicht in den Index, weil sie ihre eigene Suchintention
verneinen.

| Seite | Freischaltbedingung |
|---|---|
| `/integrationen` | eines von B1.1 oder B1.2 |
| `/datenschutz-sicherheit` | **alle vier** Punkte aus B2 |

## Übersicht: Baustein-Status

| Baustein | Gebaut | Sichtbar | Wartet auf |
|---|---|---|---|
| M13 Stimmprobe | ✅ | ❌ (asset-gated) | A1 |
| M14 Übergabe | Text ✅ / Visual ❌ | teilweise | A2 + OWNER-INPUT B |
| M15 Grenzen | ✅ | ✅ | — |
| M16 Nicht passend | ✅ | ✅ | — |
| M17 Onboarding-Rewrite | ❌ | — | OWNER-INPUT E |
| M18 Betreuung | ❌ | — | OWNER-INPUT D + A4 |
| M19 Umkehrbarkeit | ❌ | — | OWNER-INPUT A |
| M20 Patientensicht | ✅ | ✅ | — |
| M21 Praxisteam | ✅ | ✅ | — |
| M22 Referenz | ❌ (bewusst) | — | A3 |
