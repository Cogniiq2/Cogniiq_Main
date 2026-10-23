# FINAL_EXTERNAL_AUTHORITY_PLAN — Aufgaben außerhalb des Codes (Stand 2026-10-23)

Befund: In den geprüften Praxisinhalten fehlen Dritt- und Kundenbelege. Das ist eine
Vertrauenslücke; ohne Backlinkexport ist es **kein** Beweis eines bestimmten
Rankingengpasses. Sie wird nicht mit weiterem Text kompensiert, und fehlende Belege
blockieren keine notwendigen Codekorrekturen.

Ausdrücklich nicht: automatischer Versand, Linkkauf, PBN, Verzeichnis-Spam, erfundene
Beweise, inszenierte Hörproben als Kundenanruf ausgeben, Partnerschaften vortäuschen.

| # | Aufgabe | Verantwortlich | Benötigtes Material | Freigabe | Nächster Schritt | Zielseite | Erfolgskriterium |
|---|---|---|---|---|---|---|---|
| 1 | **Ein realer Praxiseinsatz** mit schriftlicher Veröffentlichungsfreigabe; anonymisierte, aber echte Darstellung, wenn keine Namensnennung erlaubt ist | Inhaber | Praxisart, Region, konfigurierte Anlässe, Zeitraum | Kunde (schriftlich, `ASSETS-REQUIRED.md` A3) | Einwilligungstext an den Kunden senden | `/praxen`, `/ki-telefonassistent-arzt` oder `-zahnarztpraxis` | Block mit Erfahrung live, Quelle benannt |
| 2 | **Hörprobe**: echter Anruf mit Einwilligung ohne Patientendaten, oder ausdrücklich inszeniert und so beschriftet | Inhaber | 30–60 s Audio, Transkript | Sprecher/Kunde | Aufnahme + Kennzeichnung | Flagship, Praxen, Arzt | `StimmprobeSection` rendert; Beschriftung „Demo"/„Kunde" korrekt |
| 3 | **Redigierter Workflow-/Dashboard-Screenshot** plus Nachweis, was im Kalender ankommt und was beim Team bleibt | Inhaber | Screenshot, Kalenderweg | intern | Redaktion (PII entfernen) | Flagship „Übergabe", Arzt „Anbindung" | Bild-Slot gefüllt, Alt-Text sachlich |
| 4 | **Fallstudie mit Methode**: Ausgangslage, Zeitraum, Anzahl Fälle, Anrufdefinition, Erledigung, Restarbeit, Abbrüche, Vorher/Nachher-Methode, Kosten, Einschränkungen | Inhaber + Kunde | Dashboard-Export, Freigabe | Kunde | Messfenster vereinbaren | eigene Unterseite oder Arzt/Zahnarzt | kleine Stichprobe als solche benannt, keine Generalisierung |
| 5 | **PVS-/Kalenderanbieter kontaktieren**, Integration testen, bestätigte Funktionen dokumentieren | Inhaber | Testzugang, Vendor-Antworten | Vendor | E-Mails an RED, medatixx, CGM, tomedo (`docs/seo/pvs-integration-recherche.md`) | Integrationen, Arzt, Zahnarzt | Liste „bestätigt / nicht bestätigt" je System |
| 6 | **Fachmedien / regionale Institutionen / Branchenprofile**: Dental-/Praxis-Fachbeitrag auf Basis von #4–#5, IHK Oberfranken, Bayreuth Wirtschaftsförderung, Verzeichnisse der Praxis-Dienstleister | Inhaber | #1 oder #4 als Substanz | Redaktion des Mediums | Pitch erst nach #4 | Zahnarzt (Seite 1), Arzt | ein redaktioneller Verweis mit echtem Kontext |
| 7 | **Echte Kundenbewertungen** (Google-Unternehmensprofil) ohne Anreiz oder Fake | Inhaber | Profil vollständig | Kunde | Bitte nach Go-live | lokal | erste verifizierte Bewertungen; kein `AggregateRating` vorher |
| 8 | **Originaldaten** nach mehreren echten Einsätzen: Verteilung der Anrufanlässe, Methode offen | Inhaber | ≥ 3 Einsätze, Messfenster | Kunden | nach #1/#4 | eigene Seite, Blog | als Fallserie bezeichnet, nicht als Marktstudie |
| 9 | **Backlink-/Brand-Baseline** (GSC → Links, ein Backlink-Tool) und Lead-Tracking (qualifizierte Anfragen je Seite) | Inhaber | GSC-Zugang, Lead-Inbox | — | Export jetzt | — | Ausgangswerte dokumentiert; Thesen prüfbar |
| 10 | **Geordnete SERP-Snapshots** je Query (Top 10: Domain, URL, Title, Seitentyp; Top 3: Tool, Tabelle, Beispiel, Autor, Erfahrung, Preisquelle, Integration) für die sechs Familien | Inhaber oder SEO-Tool | deutscher Standort, Gerät, Datum | — | einmalig erfassen | alle Prioritätsseiten | Top-3-Gap-Analyse mit echten Rängen statt beobachteter Beispiele |

## Beobachtete Wettbewerber (keine verifizierten Rangplätze)

| Familie | Beobachtet | Muster | Konsequenz für Cogniiq |
|---|---|---|---|
| ki telefonassistent | Dr. Web, titanspear, assistent24, ai-telefonassistenten.de, ki-telefonassistent-test.de, SpeakKI | Vergleiche, Tabellen, Kriterien, teils Autoren | Kaufentscheidung und Produktbeweis stärken; kein eigener „Testsieger"-Vergleich |
| kosten / preise | LexDial, telefonkollege, assistent24, meetergo-Hilfe, grisaki | Preisbausteine, Rechner früh, mehrere Volumenprofile, Zusatzkosten/Vertrag | bestätigte Gesamtkosten nachvollziehbar; fremde Tarife nicht ungeprüft übernehmen |
| arztpraxis | Doctolib, CGM, INDAMED, Dr.wait, PraxisConcierge, medflex | benannte Softwareintegration, Vergleichsratgeber | konkrete Kalenderwege und verbleibende Teamarbeit belegen |
| zahnarztpraxis | Dr. Flex, AskProAI, dentale Fachinhalte | PVS-Namen, Erfolgsgeschichten, Review-Signale | Dentalgewinner erhalten; echte Schnittstellen-/Workflowbelege ergänzen, sobald vorhanden |

Direkt gelesene Primärseiten (23.10.2026, vor diesem Durchgang): `info.doctolib.de/ki-telefonassistent/`,
`dr-flex.de/fachrichtung/zahnmedizin`, `lexdial.de/ki-telefonassistent/kosten`. Anbieterclaims sind
keine unabhängige Wirkungsstudie; keine Quoten oder Sparannahmen übernommen.
