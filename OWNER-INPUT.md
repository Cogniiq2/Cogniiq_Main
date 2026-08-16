# OWNER-INPUT — Bitte ausfüllen, bevor Pass 2 weiterläuft

Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4` · Grundlage: `.claude/COPY-BRIEF-2.md` (Phase 0)

**So funktioniert dieses Dokument:** Jede Zeile ist eine Frage. Tragen Sie die
Antwort direkt in die Spalte „Ihre Antwort" ein (Datei editieren genügt).
„Wenn leer" beschreibt, was ohne Antwort passiert — in der Regel: die
betroffene Aussage fliegt von der Website oder der Baustein bleibt unsichtbar.
Nichts wird erfunden; eine leere Antwort führt nie zu einer erfundenen Angabe.

**Blockierend:** Die Arbeit an Vertrauensbausteinen, Restseiten und
Positionierung beginnt erst, wenn dieses Dokument zurückkommt — mindestens
Gruppe G (eine Ankreuz-Entscheidung) und Gruppe C1 (Art.-50-Ansage).

---

## A · Preis & Vertrag

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| A1 | Stimmen die publizierten Staffeln: Basis ab 99 €, Professionell 199–399 €, Enterprise ab 499 €/Monat? (ggf. korrigieren) | | Preisstaffeln und Offer-Schema werden entfernt; Preisseite nennt nur das Modell |
| A2 | Was ist in jeder Staffel konkret enthalten (Anrufkontingent? Anbindungen? Anpassungen?) | | Staffel-Beschreibungen bleiben bewusst vage |
| A3 | Gibt es eine Einrichtungsgebühr? (ja/nein + Betrag oder Spanne) | | Formulierung bleibt „je nach Umfang" — schwächer als eine klare Zahl |
| A4 | Mindestlaufzeit? (Monate) | | Umkehrbarkeits-Block (M19) kann nicht gebaut werden |
| A5 | Kündigungsfrist? | | dito — M19 blockiert |
| A6 | Fällt jemals eine Abrechnung pro Anruf oder pro Minute an? (ja/nein; wenn ja, wann) | | Kernversprechen „keine Abrechnung pro Anruf" (P4) muss von allen Seiten entfernt werden |
| A7 | Gibt es eine Testphase? (Dauer, Kosten, Bedingungen, was passiert danach) | | M19 nennt keine Testphase; „Sie hören den Assistenten vor dem Start" bleibt die einzige Probe-Aussage |
| A8 | Stimmen die Beispielkonfigurations-Preise 249/149/199/299 €/Monat? | | Beispielkonfigurationen verlieren die Preisangabe |

## B · Produkt & Technik

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| B1 | PVS-Liste **direkt angebunden** (Termin/Eintrag landet ohne Zutun im System): welche? | | Keine Integrationen-Seite möglich; Arzt-Seite behält nur „prüfen wir vor dem Angebot" |
| B2 | PVS-Liste **über Schnittstelle möglich**: welche? | | dito |
| B3 | PVS-Liste **auf Anfrage prüfen**: welche? Und: stimmt die publizierte Nennung Tomedo, Medistar, Dampsoft, CGM? | | Die vier PVS-Namen werden von der Arzt-Seite entfernt |
| B4 | Welche Telefonanlagen/Anschlussarten sind kompatibel? Wie läuft die Einbindung technisch (Rufumleitung, SIP, …)? | | „Ihre Rufnummer und Telefonanlage bleiben" wird abgeschwächt |
| B5 | Hosting-Standort(e) konkret (Land, Anbieter)? | | Es bleibt bei „europäische Server" ohne Detail; Datenschutz-Seite nicht baubar |
| B6 | Sub-Auftragsverarbeiter (Liste)? | | Datenschutz-Seite nicht baubar |
| B7 | Werden Patientendaten oder Gesprächsdaten zum Training von Modellen genutzt? (ja/nein) | | Die Aussage „kein Training auf Patientendaten" darf weiterhin nirgends stehen |
| B8 | Was wird aufgezeichnet/gespeichert (Rohaudio? Transkript? Zusammenfassung?), wo, wie lange, wann gelöscht? | | Die publizierte Aussage „keine Rohaudio-Speicherung außer auf Wunsch" muss raus |
| B9 | Verhalten bei Störung/Ausfall: Was passiert technisch konkret (Weiterleitung auf Backup-Nummer? Ansage? automatisch?) | | Fallback-FAQ auf allen Seiten muss raus — Einwand #9 bleibt unbeantwortet |
| B10 | Unterstützte Sprachen heute (nicht geplant): welche? | | „mehrsprachig möglich, üblicherweise Deutsch und Englisch" muss raus (München/Regensburg) |
| B11 | Wie viele Anrufe können tatsächlich parallel angenommen werden? | | „mehrere Anrufe gleichzeitig ohne Warteschleife" wird abgeschwächt |
| B12 | Dashboard zur Selbstpflege (Öffnungszeiten, Urlaubsansagen): existiert es heute, was kann es? | | Selbstpflege-Versprechen (P1/§5.5-6) muss von Service-, Arzt- und Bayreuth-Seite entfernt werden |
| B13 | Eigene, selbst aufgesprochene Ansagen der Praxis: heute möglich? Wie läuft die Aufnahme? | | Kernversprechen P2 („Ihre Stimme") muss überall abgeschwächt werden auf „abgestimmte Ansagen" |
| B14 | Notfall-Routing (Team / Bereitschaftsdienst / 112-Ansage) frei konfigurierbar? | | Notfall-Beschreibung wird auf das Minimum reduziert |

## C · Compliance

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| C1 | **Sagt der Assistent heute zu Gesprächsbeginn an, dass ein KI-System spricht? (ja/nein)** Wenn nein: bis wann wird das umgesetzt? | | **Blocker.** Die Aussage steht seit Pass 1 auf allen Seiten. Bei „nein" muss sie sofort raus — und unabhängig vom Marketing gilt die Pflicht aus Art. 50 KI-VO |
| C2 | Wird der AVV nach Art. 28 DSGVO standardmäßig gestellt („inklusive")? Oder nur auf Anfrage? | | Formulierung fällt zurück auf „auf Anfrage" |
| C3 | Existiert eine TOM-Liste (technische und organisatorische Maßnahmen)? | | Datenschutz-Seite bleibt ohne TOM-Abschnitt |
| C4 | Sind AVV/TOM/Datenschutz-Unterlagen als Download bereitstellbar? | | Kein Download-Abschnitt |
| C5 | Wie wird § 203 StGB (Schweigepflicht, Gehilfen) vertraglich behandelt? | | Die S4-Seite kann den Punkt nur benennen, nicht beantworten |

## D · Service & Betreuung

| # | Frage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| D1 | Wen erreicht die Praxis konkret? (Name + Rolle; darf er/sie mit Foto auf die Website?) | | M18 („Änderungen und Betreuung") bleibt ohne Person — deutlich schwächer |
| D2 | Erreichbarkeitsfenster (Wochentage, Uhrzeiten, Kanäle)? | | M18 nennt kein Fenster |
| D3 | Zugesagte Reaktionszeit auf Anfragen? | | Formular-Zusage („was passiert nach dem Absenden, in welchem Zeitfenster") entfällt |
| D4 | Wie schnell wird eine Änderung an Ansage oder Regel umgesetzt? (Frist, die zugesagt werden darf) | | M18 kann Einwand #6 (52 % nennen Support als Wechselgrund, Zi 2026) nicht kontern |
| D5 | Wie werden Änderungswünsche eingereicht (Anruf? Mail? Dashboard?) und wer setzt sie um? | | dito |

## E · Onboarding-Prozess (trägt das gesamte „für Ihre Praxis gebaut"-Versprechen)

Bitte die **tatsächlichen** Schritte von Vertragsschluss bis Live-Gang aufschreiben —
so wie sie wirklich ablaufen, nicht wie sie klingen sollen. Pro Schritt: Was
passiert, wer macht es (Cogniiq/Praxis), wie lange dauert es, was muss die
Praxis beitragen.

| Schritt | Was passiert | Wer | Dauer | Beitrag der Praxis |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 (optional) | | | | |

| # | Zusatzfrage | Ihre Antwort | Wenn leer |
|---|---|---|---|
| E1 | Stimmt die Gesamtdauer „in der Regel 7–14 Tage"? | | Zeitangabe fliegt aus Stadtseiten und HowTo-Schema (P14D) |
| E2 | Gibt es ein Aufnahmegespräch, in dem Anrufanlässe kartiert werden? Wie lange dauert es? | | Der 5-Schritte-Block bleibt generisch — genau das kritisiert Brief II §4.5 |
| E3 | Werden Gesprächsverläufe in den ersten Wochen aktiv ausgewertet? In welchem Rhythmus? | | Aussage wird entfernt |

## F · Proof-Assets (ohne diese bleiben die stärksten Bausteine unsichtbar)

| # | Asset | Vorhanden? (ja/nein/bis wann) | Wenn leer |
|---|---|---|---|
| F1 | **Audioaufnahme eines echten Anrufs** (mit Einwilligung, ohne Patientendaten, 30–90 s) | | M13 „Stimmprobe" — der stärkste Baustein der Website — rendert nicht. Keine Ersatzstimme, keine synthetische Probe |
| F2 | **Screenshot oder 20–30-s-Bildschirmaufnahme der Übergabe** (was das Team nach dem Anruf sieht) | | M14 zeigt nur Text, kein Beweisbild |
| F3 | **Referenzpraxis** mit schriftlicher Einwilligung (anonymisiert ok: „Hausarztpraxis mit drei Behandlern, Oberfranken" + echtes Zitat) | | M22 rendert nicht; die Website bleibt ohne jede Kundenstimme |
| F4 | Eigene gemessene Übernahmequote (konservativ, netto nach Nacharbeit) | | Es bleibt zahlenlos — kein Rechner, keine Quote |
| F5 | Foto + Name des festen Ansprechpartners (für M18) | | M18 ohne Person |

## G · Positionierung (genau EINE Option ankreuzen — ohne diese Entscheidung keine Phase 4)

| Option | Bedeutung | Ihre Wahl |
|---|---|---|
| **A — Healthcare-Fokus** | Der Gesundheits-Cluster bekommt eigenen Einstieg, eigene Navigation, eigene Landingpage; Hotel/Restaurant nur noch über die Unternehmens-Startseite erreichbar. Gesundheitsseiten verlinken nie in Hotel-/Restaurant-Inhalte. Achtung: braucht voraussichtlich neue Routen → Vorschlag kommt zur Freigabe | ☐ |
| **B — Horizontal mit klarer Trennung** | Branchen bleiben nebeneinander, aber jede Vertikale bekommt einen in sich geschlossenen Einstieg; Querverlinkungen zwischen Branchen innerhalb einer Customer Journey werden entfernt (z. B. „KI Telefonassistent Restaurant" verschwindet aus den Links der Arzt-Seite) | ☐ |
| **C — Horizontal wie bisher** | Struktur unverändert; die Spezifität muss vollständig aus Onboarding-Prozess und Segmenttiefe kommen; keine Healthcare-Exklusivität im Text | ☐ |

| # | Zusatzfrage | Ihre Antwort |
|---|---|---|
| G1 | Sollen die im Brief geforderten, noch fehlenden Seiten angelegt werden (Integrationen/PVS, Datenschutz & Sicherheit, Segmente Zahnarzt/MVZ)? Das ändert die URL-Struktur → nur mit Ihrer Freigabe, Routenvorschlag folgt | |
| G2 | Hauptsitz Bayreuth mit Vor-Ort-Terminen: bestätigt? (steht auf der Bayreuth-Seite) | |

---

## Was nach Rückgabe passiert (Reihenfolge aus `.claude/COPY-BRIEF-2.md`)

1. **Phase 1:** Repo-weites Ehrlichkeits-Audit (`HONESTY-AUDIT.md`) + Fixes — läuft unabhängig von den meisten Antworten, wartet aber vereinbarungsgemäß auf dieses Dokument.
2. **Phase 2:** Vertrauensbausteine M13–M22; Bausteine mit fehlendem Asset werden gebaut, bleiben aber unsichtbar (kein Platzhalter im DOM).
3. **Phase 3:** Restseiten (Bayern, Demo, Hotel/Restaurant-Ehrlichkeitspass, Homepage je nach G).
4. **Phase 4:** Umsetzung der Positionierungs-Entscheidung G.
5. **Phase 5:** `SEO-BASELINE.md`, Schema-Erweiterung, Review-Banner (`VITE_REVIEW_MODE`, standardmäßig aus).
