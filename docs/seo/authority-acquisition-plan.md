# Externe Autorität — Ansatzpunkte

Der größte verbleibende SEO-Engpass ist nicht Technik und nicht Textmenge,
sondern **fehlende Bestätigung durch Dritte**. Code kann das nicht herstellen.

⚠️ Verifikationsstatus: siehe `VERIFIKATION.md`. Die genannten Kategorien sind
Rechercheergebnis, die Eignung im Einzelfall ist **nicht geprüft**.

## Zwei Randbedingungen, die den Plan begrenzen

Beide sind im Repository belegt und ändern, was realistisch ist:

- **Cogniiq besteht seit dem 2025-10-15** (`src/lib/seo-data.ts`, `foundingDate`).
  Ein knapp einjähriges Unternehmen hat kein Jahrzehnt an Erwähnungen, auf das
  sich aufbauen liesse. Jede Zeile unten ist Aufbauarbeit, kein Einsammeln.
- **Es gibt keine öffentlich benannte Kundenreferenz.** `src/pages/ReferenzenPage.tsx`
  nennt Prinzipien, keinen einzigen Namen. Ansatzpunkt 5 beginnt deshalb nicht
  bei „Referenz verlinken", sondern eine Stufe davor: bei der schriftlichen
  Erlaubnis, die Beziehung überhaupt zu nennen.

Daraus folgt die Reihenfolge am Ende dieses Dokuments: erst die Schritte, die
ohne neuen Inhalt und ohne fremde Zustimmung funktionieren.

## Grundregel

**Diese Liste ist keine Outreach-Automatisierung.** Kein Kontakt wurde aufgenommen,
keiner darf automatisiert aufgenommen werden. Jeder Schritt ist eine bewusste
Entscheidung des Inhabers.

Ein Link ohne passenden verlinkbaren Inhalt ist eine Bitte um einen Gefallen.
Ein Link mit passendem Inhalt ist ein Argument. Deshalb steht in jeder Zeile,
**welcher Inhalt** die Anfrage trägt — und wo dieser Inhalt noch fehlt.

## Priorisierte Ansatzpunkte

### 1. Fachverzeichnisse für Praxis-Dienstleister — höchste Priorität
Im Wettbewerbsumfeld sind mehrere Verzeichnisse für Praxisdienstleister
aufgetaucht; Wettbewerber sind dort gelistet, Cogniiq nicht.

- **Warum:** Verzeichniseinträge sind das, was die rankenden Wettbewerber haben
  und Cogniiq fehlt. Niedrigster Aufwand im ganzen Plan.
- **Aufwand:** gering. **Erwarteter Wert:** mittel bis hoch.
- **Nötiger Inhalt:** keiner — nur ein sauberes Profil.
- **Zu prüfen:** Aufnahmekriterien, Kosten, ob bezahlt (dann `nofollow`/`sponsored`
  erwarten — trotzdem sinnvoll als Entitätssignal).

### 2. Regionale Wirtschaftsorganisationen Bayreuth/Oberfranken
IHK für Oberfranken Bayreuth, Wirtschaftsförderung der Stadt, regionale
Digital-/Gründernetzwerke, Hochschulumfeld (Universität Bayreuth).

- **Warum:** echte, belegbare regionale Verankerung. Stützt zugleich die lokalen
  Seiten und das Local-Pack-Signal.
- **Aufwand:** gering bis mittel. **Wert:** mittel, sehr belastbar.
- **Nötiger Inhalt:** Unternehmensprofil; optional ein Praxisbericht.

### 3. Fachmedien Praxisorganisation / Praxis-IT
In der Recherche tauchte mindestens ein etablierter dentaler Fachverlag als
redaktionelle Stimme im Themenfeld auf.

- **Warum:** ein redaktioneller Fachbeitrag ist gleichzeitig Link, Autorensignal
  und Vertriebskanal.
- **Aufwand:** hoch. **Wert:** hoch.
- **Nötiger Inhalt:** ⚠️ **fehlt noch.** Trägt nur mit der verifizierten
  PVS-Integrationsanalyse (`pvs-integration-recherche.md`). Ohne sie ist der
  Pitch „noch eine Agentur, die über KI schreibt".

### 4. Zahnarzt-Segment
Das schwächste Wettbewerbsumfeld der medizinnahen Cluster — dort rankt eine
Exact-Match-Domain, was auf eine niedrige Messlatte hindeutet.

- **Warum:** realistischster erster echter Ranking-Erfolg.
- **Aufwand:** mittel. **Wert:** mittel bis hoch.
- **Nötiger Inhalt:** dentalspezifische operative Inhalte (Anrufspitzen während
  der Behandlung, Prophylaxe-Recall, Notdienst-Routing).

### 5. Bestandskunden als belegbare Referenz
Der stärkste verfügbare Vertrauensbeweis und zugleich der einzige, der
Wettbewerbern nicht offensteht.

- **Warum:** Google fragt „wer verantwortet das und mit welcher Erfahrung".
- **Aufwand:** gering (Beziehung besteht). **Wert:** hoch.
- **Voraussetzung:** ⚠️ **schriftliche Freigabe je Kunde.** Keine
  Kundennennung, keine Fallzahl, kein Logo ohne dokumentierte Zustimmung.
  Keine erfundenen oder anonymisiert-erfundenen Fallstudien.

### 6. Google Business Profile — für „Webdesign Bayreuth" der eigentliche Hebel
Lokale Suchanfragen werden über Business-Profil, Bewertungen und NAP-Konsistenz
entschieden, nicht über Textlänge.

- **Warum:** Content-Investment rankt hier schlecht; das Profil rankt.
- **Aufwand:** gering. **Wert:** mittel.
- **Empfehlung:** Profil vervollständigen und pflegen, Bewertungen regelhaft
  erbitten. **Keine** weiteren Webdesign-Städteseiten bauen.

### 7. Fachbeiträge/Podcasts Mittelstand-Digitalisierung
- **Aufwand:** hoch, unkalkulierbar. **Wert:** streuend.
- **Empfehlung:** nur opportunistisch, nach 1–5.

## Ausdrücklich nicht tun

- Linkkauf, Linktausch, PBNs.
- Massenhafte Verzeichniseintragungen in Linkfarmen.
- Automatisierte Outreach-Mails.
- Erfundene Auszeichnungen, Referenzen, Standorte, Autoren oder Statistiken.
- Weitere programmatisch erzeugte Städte-/Branchenseiten. Der Bestand ist bereits
  breit; zusätzliche Varianten verdünnen die Positionierung weiter (Grund 4 in
  `serp-landschaft-2026-08.md`).

## Reihenfolge

1 und 6 sofort (geringer Aufwand, kein neuer Inhalt nötig) → 2 und 5 kurzfristig
→ 3 und 4 erst, wenn die PVS-Analyse verifiziert vorliegt → 7 opportunistisch.
