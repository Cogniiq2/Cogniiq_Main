# COPY-CLAIMS-TO-VERIFY — Aussagen, die der Inhaber bestätigen muss

Stand: 2026-08-16 (Pass 2) · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Das Beantwortungsformular zu dieser Liste ist `OWNER-INPUT.md` — die
Gruppen A–D unten entsprechen den dortigen Gruppen. Abschnitt F ergänzt
die im Pass-2-Audit neu gefundenen Punkte.

Regel aus dem Brief (§2.1): Produktaussagen, die weder im Repo belegt noch vom
Inhaber bestätigt sind, dürfen nicht behauptet werden. Die folgenden Aussagen
stehen bereits auf der Live-Website (waren also publiziert) oder wurden in der
neuen Fassung bewusst beibehalten — sie sind **vor dem Merge zu bestätigen oder
zu entfernen**. Marker stehen als Code-Kommentare neben der jeweiligen Stelle
(nicht im gerenderten Text, damit kein Englisch in die Kundensicht gelangt).

## A. Technik & Produkt

| # | Aussage | Wo | Status |
|---|---|---|---|
| A1 | Anbindung an Tomedo, Medistar, Dampsoft, CGM (PVS) | `/ki-telefonassistent-arzt` (FAQ, Benefits) | bereits publiziert — Liste und Anbindungstiefe je System bestätigen |
| A2 | Kein System-/Rufnummernwechsel nötig; bestehende Telefonanlage bleibt | alle Seiten | bereits publiziert — technisch bestätigen (Rufumleitung? SIP? je Anlage?) |
| A3 | Fallback bei technischem Ausfall (Backup-Nummer oder Ansage) | Service-Seite, Stadtseiten (FAQ) | bereits publiziert (Regensburg) — Mechanik technisch bestätigen |
| A4 | Selbstpflege von Öffnungszeiten/Urlaubsansagen über ein Dashboard | Service, Arzt, Bayreuth | bereits publiziert — Funktionsumfang des Dashboards bestätigen |
| A5 | Gespräche werden als strukturierte Zusammenfassung übergeben, Rohaudio wird nicht gespeichert (außer auf Wunsch) | Datenschutz-Blöcke aller Seiten | bereits publiziert (Bayreuth-FAQ) — Speicher- und Löschkonzept bestätigen |
| A6 | Ansage zu Gesprächsbeginn, dass ein Sprachassistent spricht (Art. 50 KI-VO) | alle Seiten | NEU im Copy — im Produkt verifizieren, sonst Aussage entfernen |
| A7 | Anrufer kann jederzeit zu einem Menschen wechseln | alle Seiten | NEU präzisiert — Gesprächslogik verifizieren |
| A8 | Mehrere Anrufe gleichzeitig ohne Warteschleife | Stadtseiten | bereits publiziert — Parallelitätsgrenzen bestätigen |
| A9 | Mehrsprachigkeit (Deutsch/Englisch, weitere auf Anfrage) | München, Regensburg | bereits publiziert, vereinheitlicht — Umfang bestätigen |
| A10 | Eigene, selbst aufgesprochene Ansagen möglich | alle Seiten | NEU als Kernversprechen (P2) — produktseitig bestätigen |
| A11 | Notfall-Routing konfigurierbar (Team / Bereitschaftsdienst / 112-Ansage) | Arzt, Service | bereits publiziert, präzisiert — Konfigurationsmöglichkeit bestätigen |

## B. Prozess & Betreuung

| # | Aussage | Wo | Status |
|---|---|---|---|
| B1 | Einrichtung in der Regel 7–14 Tage | Stadtseiten, HowTo-Schema (P14D) | bereits publiziert — bestätigen |
| B2 | 5-Schritte-Prozess (Aufnahmegespräch → Anliegen-Katalog → Ansagen → Testphase → laufende Anpassung) | Service (HowTo), Stadtseiten | NEU strukturiert — mit tatsächlichem Ablauf abgleichen |
| B3 | Fester persönlicher Ansprechpartner, kein Ticketsystem | alle Seiten | bereits publiziert — Betreuungsmodell bestätigen |
| B4 | Hauptsitz in Bayreuth, Termine vor Ort möglich | Bayreuth | bereits publiziert — bestätigen |
| B5 | Auswertung der Gesprächsverläufe in den ersten Wochen | Bayreuth (FAQ), Service | bereits publiziert — bestätigen |

## C. Preise & Vertrag

| # | Aussage | Wo | Status |
|---|---|---|---|
| C1 | Preisstaffeln: ab 99 € / 199–399 € / ab 499 € pro Monat | `/kosten-ki-telefonassistent` (+ Offer-Schema) | bereits publiziert — **alle Beträge bestätigen** |
| C2 | Beispielkonfigurations-Preise (249/149/199/299 €) | Preisseite | bereits publiziert — bestätigen oder entfernen |
| C3 | Fester Monatsbetrag, keine Abrechnung pro Anruf | alle Seiten (P4) | NEU als Kernversprechen — Preismodell bestätigen |
| C4 | Flexible Laufzeiten, klar benannte Kündigungsfrist | Preisseite (FAQ) | abgeschwächt von "monatlich kündbar" — konkrete Konditionen einsetzen |
| C5 | Einrichtungsgebühr wird vor Vertragsschluss schriftlich ausgewiesen | Preisseite, Stadtseiten | NEU — Angebotsprozess bestätigen |

## D. Datenschutz & Recht

| # | Aussage | Wo | Status |
|---|---|---|---|
| D1 | Verarbeitung ausschließlich auf europäischen Servern | alle Seiten | bereits publiziert — Hosting-Standorte und Sub-Auftragsverarbeiter dokumentieren |
| D2 | AVV nach Art. 28 DSGVO gehört zur Einrichtung ("inklusive") | alle Seiten | bereits publiziert ("auf Anfrage" → jetzt "inklusive") — bestätigen, sonst zurück zu "auf Anfrage" |
| D3 | Unterstützung bei Dokumentation für den DSB (ohne DSFA-Aussage) | Arzt, Praxis, Stadtseiten | NEU formuliert — Leistungszusage bestätigen |
| D4 | Kein Training auf Patientendaten | **nirgends behauptet** | Brief §5.4 wünscht die Aussage — erst nach Bestätigung ergänzen |

## F. Pass-2-Ergänzungen (Audit repo-weit)

| # | Aussage | Wo | Status |
|---|---|---|---|
| F1 | 297 €/Monat im Kostenvergleichs-Rechner — weicht von den Staffeln (99/199–399/499 €) ab | `CostComparisonSection.tsx` | als Beispielwert gekennzeichnet — vereinheitlichen (OWNER-INPUT A1) |
| F2 | Reaktionszeit „in der Regel 24 h" (Kontakt, Demo, FAQ-Modal, Final-CTA, HowItWorks) | mehrere Komponenten | bereits publiziert — bestätigen (D3) |
| F3 | Testimonial `REAL_TESTIMONIAL` nennt real existierenden Verein (SV Heinersreuth) | `TestimonialBlock.tsx`, `/referenzen`, `/bewertungen` | schriftliche Einwilligung nachweisen oder entfernen (F3 im OWNER-INPUT) |
| F4 | Gründer-Spezialisierungen (wer macht KI, wer Webdesign) | AboutSection (jetzt neutral „Gründer") | erst nach Bestätigung wieder personenbezogen ausweisen |
| F5 | JSON-LD: `areaServed` (10+ Städte), `priceRange "€€€"`, `foundingDate 2025-10-15`, `availableLanguage German/English` | `index.html`, `LocalBusinessSchema.tsx` | bestätigen |
| F6 | Review-Lenkung „Positives Feedback wird in Richtung Google-Bewertung gelenkt" | Webdesign-Gastronomie-Stadtseiten | rechtlich riskantes Muster (Review-Gating) — Empfehlung: entfernen; Entscheidung Inhaber |
| F7 | „Mehrere Anrufe gleichzeitig, ohne Warteschleife" | mehrere Seiten | Parallelitätsgrenzen bestätigen (B11) |
| F8 | Blog-Orientierungspreise (150–500 €, 200–450 €, 300 € u. a.) | `blog-data.ts` | bestätigen oder entfernen |
| F9 | PMS-/Systemnamen Hotel/Restaurant (protel, Apaleo, Lodgit, OpenTable, ResDiary, Resmio) | Hotel-/Restaurant-Segmentseiten | Anbindungstiefe bestätigen |
| F10 | **Tarifzuordnung nach günstigstem Gesamtpreis** — Preisseite, `/praxen` und der Praxis-Rechner sagen zu, dass ein Kunde bei dauerhaft höherem Aufkommen dem Tarif zugeordnet wird, der für seinen Bedarf am günstigsten ist und nicht dauerhaft an der Obergrenze läuft | `telefonassistent-copy.ts` (`DECKELUNG.tarifwechsel`), `KostenKiTelefonassistent.tsx`, `PraxenPage.tsx`, `PraxisRechnerWidget.tsx` | **[[CLAIM: Tarifzuordnung nach günstigstem Gesamtpreis muss im Vertrag und im Abrechnungsprozess so umgesetzt sein — nicht nur im Rechner]]** Die Regel beschreibt inzwischen nicht mehr nur eine Rechnerannahme, sondern eine Zusage an den Kunden. Ohne vertragliche und prozessuale Deckung ist sie von den Seiten zu entfernen |
| F11 | Deckelung im Tarif MVZ liegt bei 1.400 €, während der nächsthöhere Tarif (Enterprise) bei 5.000 € beginnt — die Regel „nie mehr als der nächsthöhere Tarif" trägt dort nicht | `telefonassistent-copy.ts` (`DECKELUNG.text`), beide Preisdarstellungen | Formulierung nennt jetzt beide Fälle getrennt; Obergrenze 1.400 € vom Inhaber als beabsichtigt bestätigt (17.08.2026) — Vertragstext angleichen |

## E. Nicht mehr behauptet (bewusst entfernt, kein Handlungsbedarf)

- 30–80 Anrufe/Tag in Praxen, 3–5 Minuten MFA-Zeit pro Anruf, 40 Termine/Tag
- "montags über 80 Anrufe vor 9 Uhr" / "60–80 Anrufe vor 8:30 Uhr" (Stadtszenarien)
- Annahme "innerhalb von zwei Sekunden" / "Reaktionszeit unter 2 Sekunden"
- ROI "innerhalb weniger Wochen", Vergleich mit Teilzeitgehalt 1.500–2.000 €
- "Kunden bestellen den Service selten wieder ab", "unbegrenzte Anrufe"
- Stimme "kaum von einem menschlichen Mitarbeiter zu unterscheiden"
- Sämtliche "kein Anruf/Patient/Auftrag geht verloren"-Absolutversprechen
