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
