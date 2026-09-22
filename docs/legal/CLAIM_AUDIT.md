# LIVE CLAIM AUDIT

**Erstellt:** 2026-09-22
**Prüfgegenstand:** Alle öffentlich sichtbaren Aussagen auf indexierbaren Routen.
**Maßstab:** *Keine Marketing-Aussage darf stärker sein als die tatsächlich technisch nachweisbare Leistung.*
**Legende:** `VERIFIED` · `CONDITIONALLY TRUE` (zutreffend unter benannter Bedingung) · `UNPROVEN` (weder belegt noch widerlegt) · `FALSE` (nachweislich unzutreffend)

## 0. Vorbemerkung — die strukturelle Ursache

Von 93 öffentlichen Routen sind **genau 3** auf `noindex` gesetzt: `/integrationen`, `/datenschutz-sicherheit` und `/anfrage-erhalten` (verifiziert in `src/lib/routing/publicRoutes.ts`).

Die ersten beiden sind zugleich die **sorgfältigsten Seiten des gesamten Projekts**. Ihre Quelldateien tragen bindende Vorgaben des Inhabers:

> *„keine Aussage zu Hosting-Standort, Serverstandort oder EU-Verarbeitung / kein ‚DSGVO-konform' / keine TOM-Liste, auch nicht in Stichworten"* (`DatenschutzSicherheitPage.tsx:13-17`)
> *„Keine Produktnamen von Praxisverwaltungssystemen, solange keine Anbindung existiert (Inhaber-Antwort B)"* (`IntegrationenPage.tsx:13-14`)

**Die Seiten, die sich an diese Vorgaben halten, sind für Suchmaschinen unsichtbar. Die Seiten, die sie verletzen, sind indexiert.** Das ist der Kern fast aller folgenden Befunde — kein Einzelfehler, sondern eine Asymmetrie zwischen Sorgfaltsniveau und Sichtbarkeit.

---

## 1. AVV / Auftragsverarbeitungsvertrag

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-01 | „Zu jedem System liefern wir Datenschutzerklärung, **Auftragsverarbeitungsvertrag** und Cookie-Einwilligung."<br>`src/pages/LeistungenPage.tsx:204` | **Kein AVV-Muster im Repository.** Kein Dokument, keine Vorlage, kein Entwurf | **UNPROVEN**, praktisch **FALSE**, solange kein Muster existiert | **P0** |
| G-02 | „Alle Systeme werden mit den notwendigen **Auftragsverarbeitungsverträgen (AVV)** geliefert."<br>`src/pages/DeutschlandPage.tsx:200` | wie G-01. Formulierung noch absoluter („alle", „notwendigen") | **UNPROVEN / FALSE** | **P0** |
| G-03 | „Datenschutzerklärung, Cookie-Einwilligung und **AVV inklusive**"<br>`src/pages/industries/WebdesignArzt.tsx:52` | wie G-01. Als Leistungsmerkmal in einer Aufzählung — besonders verbindlich | **UNPROVEN / FALSE** | **P0** |
| G-04 | „Reservierungstools binden wir **mit Auftragsverarbeitungsvertrag** ein."<br>`src/pages/industries/WebdesignGastronomie.tsx:111` | wie G-01 | **UNPROVEN / FALSE** | **P0** |
| G-05 | „**Mitgliederdatenverarbeitung mit Auftragsverarbeitungsvertrag**"<br>`src/pages/industries/WebdesignSport.tsx:56`, `AutomatisierungSport.tsx:56` | wie G-01. Besonders relevant, weil das Club-Operations-Modul **real Mitgliederdaten verarbeitet** und dafür selbst kein AVV nachweisbar ist | **UNPROVEN / FALSE** | **P0** |
| G-06 | „**Gästedatenverarbeitung mit Auftragsverarbeitungsvertrag**"<br>`src/pages/industries/WebdesignHotel.tsx:60` | wie G-01 | **UNPROVEN / FALSE** | **P0** |
| G-07 | „Mit klarer Einwilligungsdokumentation und **Auftragsverarbeitungsvertrag (AVV)**. Die Datenschutzerklärung Ihrer Website passen wir entsprechend an."<br>`src/pages/industries/AutomatisierungSport.tsx:113` | wie G-01 | **UNPROVEN / FALSE** | **P0** |
| G-08 | „Wir binden es **mit Auftragsverarbeitungsvertrag** ein und dokumentieren, welche Daten wohin fließen. Den Verarbeitungsort nennt Ihnen der jeweilige Anbieter verbindlich — wir geben ihn nicht aus zweiter Hand weiter."<br>`src/pages/WebdesignGastronomieMuenchen.tsx:209` | AVV-Teil wie G-01. **Der zweite Halbsatz ist vorbildlich** — er verweigert ausdrücklich eine Aussage aus zweiter Hand | AVV-Teil **UNPROVEN**; Verarbeitungsort-Teil **VERIFIED** | **P0** / — |

> ### Befund zur AVV-Gruppe
> **Sieben indexierte Seiten sagen einen AVV zu. Es existiert keiner.**
>
> Das ist die wichtigste Einzelfeststellung dieses Claim-Audits, und zwar in **drei** Dimensionen gleichzeitig:
> - **§ 5 Abs. 1 Nr. 1 UWG** — Angabe über wesentliche Merkmale der Leistung, nicht einlösbar → irreführend, abmahnfähig.
> - **Art. 28 Abs. 3 DSGVO** — wo Cogniiq tatsächlich als Auftragsverarbeiter tätig ist, ist der AVV **ohnehin zwingend**, unabhängig von der Werbeaussage. Das Fehlen ist für **beide** Vertragsparteien bußgeldbewehrt.
> - **Vertragliche Nebenpflicht** — bei Bestandskunden ist die Zusage Vertragsbestandteil geworden.
>
> **Der schnellste Weg aus allen drei Dimensionen gleichzeitig ist, den AVV tatsächlich zu erstellen — nicht, die Aussagen zu streichen.** Die Aussagen sind richtig; ihnen fehlt nur die Grundlage. Ein AVV-Muster mit TOM-Anlage ist in wenigen Tagen erstellbar und löst das Problem an der Wurzel.

---

## 2. „DSGVO-konform"

| # | CLAIM | PROOF | STATUS |
|---|---|---|---|
| G-09 | FAQ-Frage „Sind die Systeme DSGVO-konform?" — Antwort: *„Diesen Satz stellen wir uns nicht selbst aus — konform ist eine Verarbeitung, kein Produkt. … Zum Verarbeitungsort machen wir derzeit keine Angabe … Die Bewertung des konkreten Einsatzes bleibt bei Ihrem Datenschutzbeauftragten."*<br>`src/pages/LeistungenPage.tsx:203-204` | Die Aussage **verweigert** die Konformitätsbehauptung ausdrücklich und ordnet die Bewertung korrekt dem DSB des Kunden zu | **VERIFIED** — rechtlich mustergültig. *(Der eingebettete AVV-Halbsatz ist separat als G-01 erfasst)* |
| G-10 | Gleiche Konstruktion in `src/pages/DeutschlandPage.tsx:200-201` | dito | **VERIFIED** *(AVV-Teil = G-02)* |
| G-11 | „DSGVO-Konformität" als **Prüfdimension** einer Website-Analyse<br>`cluster/muenchen/WebsiteRelaunchMuenchen.tsx:40`, `cluster/regensburg/WebsiteRelaunchRegensburg.tsx:40` | Beschreibt einen Prüfgegenstand, **keine Eigenschaftszusage** | **VERIFIED** |
| G-12 | TrustStrip / HowWeWorkSection enthalten **keine** „DSGVO-konform"-Aussage — der Quellcode hält den Verzicht ausdrücklich fest<br>`TrustStrip.tsx:12`, `HowWeWorkSection.tsx:38-39` | Verifiziert | **VERIFIED** |

> **Bewertung:** In diesem Punkt ist Cogniiq besser aufgestellt als praktisch jeder Wettbewerber. Die Formulierung *„konform ist eine Verarbeitung, kein Produkt"* ist juristisch präzise und zugleich verkaufsstark. **Unverändert lassen.**

---

## 3. AI Disclosure (Art. 50 KI-VO)

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-13 | *„Der Assistent sagt im ersten Satz, dass er ein KI-System ist (Art. 50 KI-Verordnung); **abschalten lässt sich das nicht**."*<br>`src/pages/KiTelefonassistentPage.tsx:218` | **Das Produkt liegt nicht in diesem Repository.** Kein Voice-Skript, keine Agentenkonfiguration, kein Provider-SDK. **Nicht verifizierbar.** Zusätzlich führt `COPY-GAPS.md` §0 diesen Punkt als **offene Inhaberentscheidung „C1"** — also als *nicht bestätigt* | **UNPROVEN** | **P1** |
| G-14 | *„Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen … Ihre Patientinnen und Patienten wissen von der ersten Sekunde an, mit wem sie sprechen — abschalten lässt sich das nicht."*<br>`src/lib/telefonassistent-copy.ts:200-201` (`FAKTEN.art50`) | dito. Wird auf mehreren Seiten ausgespielt | **UNPROVEN** | **P1** |
| G-15 | Beispieldialog: *„Guten Tag, hier ist der digitale Empfang. Ich bin ein KI-Assistent — wie kann ich helfen?"*<br>`KiTelefonassistentPage.tsx:590` | Als **Beispiel** gekennzeichnet, nicht als Mitschnitt | **VERIFIED** als Beispiel |
| G-16 | *„Anrufer erfahren im ersten Satz, dass ein KI-System spricht, und können jederzeit zu einem Menschen wechseln."*<br>`KiTelefonassistentPage.tsx:166` | Zweiter Halbsatz (Weiterleitung) ebenfalls nicht verifizierbar | **UNPROVEN** | **P1** |
| G-17 | *„Wir behaupten nicht, dass der Unterschied zu einem Menschen unhörbar wäre."*<br>`KiTelefonassistentPage.tsx:218` | Bewusste Negativaussage | **VERIFIED** — vorbildliche Selbstbegrenzung |

> ### Befund zur AI-Disclosure-Gruppe
> Der **Inhalt** der Aussage ist genau das, was Art. 50 Abs. 1 KI-VO seit dem 02.08.2026 verlangt: Information **rechtzeitig, spätestens bei der ersten Interaktion**. Inhaltlich ist nichts zu beanstanden.
>
> Das Problem ist die **Verifizierbarkeit**. Die Aussage ist als harte Tatsachenbehauptung formuliert („abschalten lässt sich das nicht"), während die projekteigene Statusdokumentation sie als unbestätigt führt. Trifft sie nicht zu, ist sie **doppelt** angreifbar: als § 5 UWG-Irreführung **und** als Verstoß gegen Art. 50 selbst.
>
> **Erforderlich:** eine einzige Bestätigung des Inhabers — mit Beleg (Agentenkonfiguration, Begrüßungsskript, oder eine Testanruf-Aufzeichnung der ersten Sekunden). Danach ist `COPY-GAPS.md` §0 C1 zu schließen.

---

## 4. Datensicherheit / Aufzeichnung / Training

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-18 | *„Gespräche werden nicht aufgezeichnet — gespeichert wird ausschließlich das strukturierte Ergebnis: Anliegen, Name, Rückrufnummer, Terminwunsch."*<br>`telefonassistent-copy.ts:195-196`, ausgespielt u. a. in `TrustStrip.tsx:13` | Produkt außerhalb des Repositories. **Technisch anspruchsvolle Zusage:** Sprach-KI erfordert regelmäßig eine zumindest transiente Audio-Übertragung zur Transkription | **UNPROVEN** | **P1** |
| G-19 | *„Ihre Daten werden nicht zum Training von Modellen verwendet."*<br>`telefonassistent-copy.ts:198` | Setzt eine vertragliche Zusicherung des Voice-Providers voraus (No-Training-Klausel). Kein Vertrag im Repository | **UNPROVEN** | **P1** |
| G-20 | Kein Hosting-, Serverstandort- oder EU-Verarbeitungs-Claim auf den öffentlichen Seiten | Repository-weit verifiziert: **kein Treffer** für „Serverstandort", „Rechenzentrum", „Server in Deutschland", „Hosting in der EU" | **VERIFIED** — und ausdrücklich so gewollt | — |
| G-21 | Keine Verschlüsselungs-Claims („Ende-zu-Ende", „AES", „SSL-verschlüsselt") | Repository-weit **kein Treffer** | **VERIFIED** | — |
| G-22 | Keine Zertifizierungs-Claims (ISO 27001, TÜV, Trust-Siegel) | Repository-weit **kein Treffer**; TrustStrip nutzt bewusst neutrale Icons ohne Siegelcharakter (`TrustStrip.tsx:7`) | **VERIFIED** | — |

> **Bewertung:** G-20 bis G-22 sind gelebte Zurückhaltung — genau richtig. G-18 und G-19 sind dagegen die **inhaltlich stärksten Vertrauensaussagen der gesamten Website** und gleichzeitig unbelegt. Sie sind auch die Aussagen, die ein Datenschutzbeauftragter einer Arztpraxis als Erstes prüfen wird.
>
> **G-18 ist besonders zu beachten:** „Nicht aufgezeichnet" und „Audio wird zur Transkription übertragen" sind nicht dasselbe. Wenn Audio transient an einen Transkriptionsdienst geht, ist die Aussage in dieser Absolutheit angreifbar, auch wenn nichts dauerhaft gespeichert wird. Eine präzisere Formulierung („keine dauerhafte Speicherung von Audioaufnahmen; für die Transkription wird das Gespräch transient verarbeitet") wäre **verteidigungsfähiger und verkauft genauso gut**.

---

## 5. 24/7 und Verfügbarkeit

| # | CLAIM | PROOF | STATUS |
|---|---|---|---|
| G-23 | „rund um die Uhr" — bezogen auf **Nachfrage/Patientenverhalten**<br>`WebdesignArztMuenchen.tsx:34`, `WebdesignArztRegensburg.tsx:34` | Beschreibt das Verhalten der Zielgruppe, keine eigene Verfügbarkeit | **VERIFIED** |
| G-24 | „Rund um die Uhr" als Leistungsmerkmal<br>`WebdesignArztBayreuth.tsx:117, 210` | Kein SLA, keine Verfügbarkeitszusage im Vertragsstack. Grenzwertig zwischen Beschreibung und Zusage | **CONDITIONALLY TRUE** — nur solange kein Verfügbarkeitsgrad zugesagt wird |
| G-25 | „Kunden erwarten … 24/7-Erreichbarkeit"<br>`problems/DigitaleAutomatisierungPage.tsx:42` | Erwartungsbeschreibung | **VERIFIED** |
| G-26 | „Erreichbar auch dann, wenn niemand abnehmen kann"<br>`LeistungenPage.tsx:108` | Bewusst begrenzte Formulierung (Ergebnis des Honesty-Audits) | **VERIFIED** |
| G-27 | Keine Uptime-Zusage (99,9 % o. ä.) | Repository-weit **kein Treffer** | **VERIFIED** |

> **Bewertung:** Die Umformulierung von „Kein Anruf geht verloren" zu „Erreichbar auch dann, wenn niemand abnehmen kann" ist genau die richtige Bewegung — und im Honesty-Audit belegt. **Ohne SLA im Vertragsstack darf keine Verfügbarkeitszahl hinzukommen.**

---

## 6. Automatische Terminbuchung

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-28 | „trägt Tischbuchungen **ins System ein**"<br>`WebdesignGastronomieMuenchen.tsx:121` | **Schreibender** Zugriff auf ein Drittsystem. Keine Integration im Repository nachweisbar | **UNPROVEN** | **P1** |
| G-29 | „Interessenten buchen Besichtigungstermine direkt über die Website oder per KI-Assistent. Bestätigungen, Erinnerungen und Nachfassaktionen laufen automatisch"<br>`WebdesignImmobilienMuenchen.tsx:139` | dito | **UNPROVEN** | **P1** |
| G-30 | „Zimmerverfügbarkeit prüfen … **Was Sie freigegeben haben, wickelt der Assistent im selben Gespräch ab.**"<br>`industries/KiTelefonassistentHotel.tsx:75` | **Stärkster Buchungs-Claim der Website.** Setzt schreibenden PMS-Zugriff voraus | **UNPROVEN** | **P1** |
| G-31 | „Online-Terminbuchung" für Praxis-Websites<br>`industries/WebdesignArzt.tsx:51, 69` | Website-Terminbuchung ist gängiges Handwerk und plausibel umsetzbar | **CONDITIONALLY TRUE** — zutreffend, soweit das Buchungstool des Kunden es hergibt |

> **Bewertung:** `HONESTY-AUDIT.md` dokumentiert, dass eine frühere `BOOKING_WRITE`-Aussage bereits korrigiert wurde. Auf den **Branchen- und Stadtseiten** ist die schreibende Buchung sprachlich jedoch weiterhin präsent. `/integrationen` sagt zum selben Thema das genaue Gegenteil — und ist `noindex`.

---

## 7. Integrationen — der schärfste Widerspruch

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-32 | „Wir integrieren in gängige Kalender-, CRM-, Buchungs- und Kassensysteme: **von Tomedo und CGM über OnOffice und HubSpot bis zu Lightspeed und Magicline.**"<br>`src/pages/LeistungenPage.tsx:207` | **Sechs namentlich genannte Fremdprodukte.** Keine Integration zu einem davon im Repository. **Und:** `IntegrationenPage.tsx:13-14` hält als bindende Inhaber-Entscheidung fest: *„Keine Produktnamen von Praxisverwaltungssystemen, solange keine Anbindung existiert (Inhaber-Antwort B)"* | **UNPROVEN** — und **direkter Widerspruch zu einer bindenden Projektvorgabe** | **P0** |
| G-33 | „Integration in Magicline, Eversports oder ClubDesk"<br>`industries/WebdesignSport.tsx:95` | wie G-32 | **UNPROVEN** | **P1** |
| G-34 | „Integration des Direktbuchungssystems **(Anbindung wird vor der Beauftragung geprüft)**"<br>`industries/WebdesignHotel.tsx:73` | **Vorbildlich** — der Klammerzusatz begrenzt die Zusage exakt richtig | **VERIFIED** |
| G-35 | `/integrationen`: „Was wir ohne Prüfung des konkreten Systems nicht zusagen" als **gleichrangiger** dritter Abschnitt, bewusst nicht kleiner gesetzt und nicht ans Ende geschoben | Verifiziert (`IntegrationenPage.tsx:8-11`) | **VERIFIED** — und **noindex**, also unsichtbar |

> ### Befund zur Integrations-Gruppe
> **G-32 ist der Befund mit dem klarsten Beweis in diesem gesamten Dokument.** Es ist keine Auslegungsfrage: Eine schriftlich festgehaltene Inhaber-Entscheidung untersagt genau das, was eine indexierte Seite tut.
>
> Zusätzlich markenrechtlich relevant: Tomedo, CGM, OnOffice, HubSpot, Lightspeed und Magicline sind **fremde Marken**. Ihre Nennung ist als beschreibende Verwendung zulässig, **solange sie zutrifft**. Trifft sie nicht zu, kommen neben § 5 UWG auch § 14 Abs. 2 MarkenG und § 6 UWG in Betracht.
>
> **Empfohlene Korrektur** — nicht Streichung, sondern Präzisierung nach dem Muster von G-34:
> *„Wir prüfen die Anbindung an Ihr bestehendes System vor der Beauftragung. Ob eine Schnittstelle besteht und was sie zulässt, klären wir verbindlich im Erstgespräch."*
> Das ist ehrlich, verkauft genauso gut und ist der Formulierung nachempfunden, die auf der Hotel-Seite bereits richtig steht.

---

## 8. Kommerzielle Garantien

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-36 | *„Spätestens zwei Wochen nach dem Start ist Ihr KI-Empfang vollständig eingerichtet und bereit für Ihre Freigabe. **Halten wir diesen Termin nicht ein, entfällt die zweite Hälfte der Einrichtungsgebühr.**"*<br>`telefonassistent-copy.ts:146` (`FAKTEN.uebergabeGarantie`) | **Eine einseitig verbindliche Leistungszusage mit konkreter Rechtsfolge — öffentlich abgegeben, ohne AGB dahinter.** Die Fristbeginn-Bedingungen sind in derselben Datei definiert (Geldeingang + Mitwirkung), stehen aber **nicht zwingend in derselben Sichtbarkeit** wie die Garantie | **CONDITIONALLY TRUE** — wirksam, aber ungeregelt | **P1** |
| G-37 | „Go-Live erst nach Ihrer Freigabe — Kein Start gegen Ihren Willen"<br>`TrustStrip.tsx:14` | Organisatorische Zusage, einhaltbar | **VERIFIED** |
| G-38 | „Festpreis — Einmalposten stehen im Angebot"<br>`TrustStrip.tsx:17` | Deckt sich mit der Angebotsmechanik (`owner_offers`, fixierte Positionen) | **VERIFIED** |
| G-39 | „Direkter Ansprechpartner — Kein Ticket-System"<br>`TrustStrip.tsx:15` | Bei zwei Gründern plausibel | **VERIFIED**, skalierungsabhängig |
| G-40 | „Keine Templates — Gebaut für Ihren Prozess"<br>`TrustStrip.tsx:16` | Der Code belegt individuelle Seitenkomponenten | **VERIFIED** |

> **Zu G-36:** Das ist die einzige Aussage der Website, die unmittelbar eine **Zahlungsfolge** auslöst. Sie ist damit faktisch eine AGB-Klausel, die außerhalb von AGB steht. Ohne vertragliche Einbettung sind Fristbeginn, Mitwirkungspflichten, höhere Gewalt und Abnahmewirkung ungeregelt — zum Nachteil **beider** Seiten. **Gehört in den Projektvertrag, nicht nur auf die Website.**

---

## 9. Preise und Umsatzsteuer

| # | CLAIM | PROOF | STATUS | PRIO |
|---|---|---|---|---|
| G-41 | „Monatliche Betreuung ab ca. 350 € / Monat"<br>`cluster/muenchen/WebdesignKostenMuenchen.tsx:130` | **Keine USt-Angabe.** Repository-weit kein „zzgl. USt." auf öffentlichen Seiten | **CONDITIONALLY TRUE** — unproblematisch im reinen B2B, unzureichend bei Verbraucheransprache (PAngV) | **P2** |
| G-42 | „Sport- und Fitness-Websites beginnen bei ca. 1.800 €"<br>`industries/WebdesignSport.tsx:95` | dito | **CONDITIONALLY TRUE** | **P2** |
| G-43 | „Einzellösungen starten im niedrigen vierstelligen Bereich"<br>`LeistungenPage.tsx:200` | Bewusst unbestimmt, mit Verweis auf das Erstgespräch | **VERIFIED** |
| G-44 | Paketname „Website Marktführer" / „Marktführer-Setup"<br>`WebdesignKostenMuenchen.tsx:32,82`, `…Regensburg.tsx:32,82` | **Paketbezeichnung**, keine Selbstberühmung Cogniiqs und keine Ergebniszusage. Risiko liegt in der Lesart als Ergebnisversprechen | **CONDITIONALLY TRUE** | **P3** |

---

## 10. Social Proof

| # | Prüfpunkt | Befund | STATUS |
|---|---|---|---|
| G-45 | Testimonials | `TestimonialBlock.tsx` exportiert **bewusst keine** Testimonial-Konstante; der Kommentar hält fest, dass die frühere Kundenstimme ohne dokumentierte schriftliche Einwilligung **vollständig aus dem Rendering entfernt** wurde (`:12-22`). **Null Verwendungen** repository-weit | **VERIFIED** — vorbildlich |
| G-46 | Kundenlogos / Partnerlogos | keine | **VERIFIED** |
| G-47 | Bewertungen / Sterne / Bewertungszahlen | keine auf der Website | **VERIFIED** |
| G-48 | Zertifizierungen / Trust Badges | keine | **VERIFIED** |
| G-49 | Fabrizierter Knappheitszähler („N Plätze frei") | `src/hooks/useAvailability.ts` existiert **weder lokal noch auf `origin/main`** — entfernt | **behoben, VERIFIED** |
| G-50 | Review-Lenkung („Positives Feedback wird in Richtung Google-Bewertung gelenkt") | repository-weit **0 Treffer** — entfernt | **behoben, VERIFIED** |

> **Bewertung:** Dies war beim Erstaudit der gefährlichste Bereich (Review-Gating verstößt gegen § 5 Abs. 1 Nr. 3 UWG und Nr. 23b des Anhangs zu § 3 Abs. 3 UWG). **Er ist vollständig bereinigt.** Der Verzicht auf jede Kundenstimme bis zur schriftlichen Einwilligung ist strenger als erforderlich und genau richtig.

---

## 11. Vergleichende Werbung

| # | Prüfpunkt | Befund | STATUS |
|---|---|---|---|
| G-51 | Namentliche Wettbewerbernennung | Bewusst unterlassen; im Quellcode als Vorgabe festgehalten (`KiTelefonassistentPage.tsx:1236`: *„Bewusst KEIN Vergleich mit benannten Wettbewerbern (§ 2.3 UWG)"*). Wix/Jimdo wurden laut `HONESTY-AUDIT.md` entfernt | **VERIFIED** |
| G-52 | Pauschale Abwertung von Agenturen („Münchner Agenturpreise", „drei Hierarchieebenen") | Laut `HONESTY-AUDIT.md` zu neutralem Remote-/Festpreis-Framing umformuliert | **behoben, VERIFIED** |

---

## 12. Zusammenfassung

| Status | Anzahl | Davon P0 |
|---|---|---|
| **VERIFIED** | 26 | — |
| **CONDITIONALLY TRUE** | 7 | — |
| **UNPROVEN** | 18 | 9 |
| **FALSE** | 0 | — |

**Kein Claim ist nachweislich falsch.** Alle problematischen Aussagen sind **unbelegt**, nicht unwahr — der Unterschied ist rechtlich und praktisch erheblich.

### Die P0-Gruppe in einem Satz
**Sieben Seiten sagen einen AVV zu, den es nicht gibt (G-01 bis G-08), und eine Seite nennt sechs Fremdprodukte entgegen einer bindenden Projektvorgabe (G-32).**

### Empfohlene Reihenfolge
1. **AVV erstellen** — löst G-01 bis G-08 auf einen Schlag und erfüllt zugleich eine ohnehin bestehende Pflicht aus Art. 28.
2. **G-32 korrigieren** — Formulierung nach dem Muster von G-34, das auf der Hotel-Seite bereits vorbildlich ist.
3. **Inhaberbestätigung einholen** für G-13/G-14 (Art. 50), G-18 (keine Aufzeichnung), G-19 (kein Training) — drei Fragen, die die Vertrauensaussagen der Website tragen.
4. **G-28 bis G-30** an das Muster von G-34 angleichen.
5. **G-36** in den Projektvertrag überführen.
6. **B2B-Klarstellung + „zzgl. USt."** (G-41/G-42).

### Was nicht angefasst werden sollte
Die „DSGVO-konform"-Antworten (G-09/G-10), der Verzicht auf Hosting-, Verschlüsselungs- und Zertifizierungsaussagen (G-20 bis G-22), die Testimonial-Disziplin (G-45) und der Verzicht auf Wettbewerbervergleiche (G-51). **Das ist belastbare Substanz, die Cogniiq vom Marktumfeld positiv abhebt.**
