# REQUIRED DOCUMENT STACK

**Erstellt:** 2026-09-22
**Klassifikation:**
- **MANDATORY** — gesetzlich zwingend, unabhängig vom Geschäftsmodell
- **CONDITIONALLY REQUIRED** — zwingend, sobald eine benannte Bedingung eintritt
- **CONTRACTUAL PROTECTION** — nicht gesetzlich gefordert, schützt aber vor konkretem wirtschaftlichem Schaden
- **BEST PRACTICE** — empfehlenswert, ohne unmittelbare Rechtsfolge

| # | Dokument | Klassifikation | Status | Rechtsgrundlage / Begründung | Prio |
|---|---|---|---|---|---|
| **D-01** | **Impressum** | **MANDATORY** | ✅ **EXISTS** — rechtlich sauber | § 5 DDG, § 18 Abs. 2 MStV | — |
| **D-02** | **Datenschutzerklärung** | **MANDATORY** | ⚠️ **EXISTS, INCOMPLETE** — 14 fehlende Offenlegungen | Art. 12, 13 DSGVO | **P1** |
| **D-03** | **Cookie-/Consent-Informationen** | **MANDATORY** | ✅ **EXISTS** — integriert in DS-Erklärung Abschn. 5-7. Eine separate Cookie Policy ist **nicht** erforderlich | § 25 TDDDG, Art. 13 DSGVO | — |
| **D-04** | **B2B-AGB** | **CONTRACTUAL PROTECTION** | ❌ **MISSING** | Keine gesetzliche Pflicht, AGB zu stellen. **Ohne sie gilt dispositives BGB:** unbegrenzte Haftung (§ 280), keine Abnahmesteuerung (§ 640), Nutzungsrechte im Zweifel beim Urheber (§ 31 Abs. 5 UrhG), keine Mitwirkungspflichten, keine Regelung zu Drittanbieter-APIs | **P0** |
| **D-05** | **Projekt-/Werkvertrag** (Website, Webanwendung) | **CONTRACTUAL PROTECTION** | ❌ **MISSING** | Werkvertrag §§ 631 ff. BGB. Ohne Leistungsbeschreibung ist der geschuldete Erfolg unbestimmt — die häufigste Streitursache in diesem Geschäft | **P0** |
| **D-06** | **SaaS-/Nutzungsvertrag** (Kundenportal, Club-Operations) | **CONDITIONALLY REQUIRED** | ❌ **MISSING** | Zwingend, sobald ein Portal dauerhaft entgeltlich bereitgestellt wird. Rechtsnatur: Mietvertrag § 535 BGB. **Bedingung ist eingetreten** — das Portal ist produktiv | **P0** |
| **D-07** | **Wartungs-/Supportvertrag** | **CONDITIONALLY REQUIRED** | ❌ **MISSING** | Wird öffentlich beworben („ab ca. 350 €/Monat"). Dienstvertrag § 611 BGB. **Bedingung eingetreten** | **P0** |
| **D-08** | **SLA-Anlage** | **CONTRACTUAL PROTECTION** | ❌ **MISSING** | Ohne SLA gilt „übliche Beschaffenheit" — ein unbestimmter Maßstab, der im Streitfall **gegen** den Anbieter ausgelegt wird. ⚠️ Zugleich der Ort, an dem Verfügbarkeitszusagen **begrenzt** werden | **P1** |
| **D-09** | **AVV nach Art. 28 DSGVO** | **MANDATORY** | ❌ **MISSING** | **Art. 28 Abs. 3 DSGVO: zwingend in Textform**, mit zehn Pflichtinhalten. Bußgeldbewehrt für **beide** Seiten (Art. 83 Abs. 4 lit. a). Zusätzlich auf **sieben** Website-Seiten öffentlich zugesagt | **P0** |
| **D-10** | **TOM (AVV-Anlage)** | **MANDATORY** | ⚠️ **PARTIAL** — materiell zu ~85 % vorhanden, als Dokument nicht existent | Art. 32, Art. 28 Abs. 3 lit. c DSGVO. Quellen: `docs/security-and-tenancy.md`, `docs/phase-0-security-audit.md`, `PROCESSOR_INVENTORY.md` §5 | **P0** |
| **D-11** | **Subprozessorenliste** | **MANDATORY** | ❌ **MISSING** | Art. 28 Abs. 2 und 4 DSGVO. Mindestens 7 Einträge (`PROCESSOR_INVENTORY.md`) | **P0** |
| **D-12** | **Verarbeitungsverzeichnis Art. 30** | **MANDATORY** | ❌ **MISSING** | **Abs. 1** (Verantwortlicher) **und Abs. 2** (Auftragsverarbeiter). Die KMU-Ausnahme nach **Abs. 5 greift nicht**: die Verarbeitung erfolgt nicht nur gelegentlich, und bis zur Oura-Entfernung werden besondere Kategorien verarbeitet | **P0** |
| **D-13** | **Löschkonzept** | **MANDATORY** | ⚠️ **PARTIAL** — technisch vorhanden (`owner_purge_policy`, `storage-purge-worker`), Fristen nicht dokumentiert | Art. 5 Abs. 1 lit. e, Art. 13 Abs. 2 lit. a, Art. 17 DSGVO. **Muss die Backup-Retention einschließen** — sonst ist jede Löschung unvollständig | **P1** |
| **D-14** | **Incident-Response-Plan** | **MANDATORY** | ❌ **MISSING** | Art. 33, 34 DSGVO setzen eine 72-Stunden-Reaktionsfähigkeit voraus. **Zwei Vorfälle sind bereits eingetreten, ohne dass ein Prozess existierte** | **P1** |
| **D-15** | **Data-Breach-Register** | **MANDATORY** | ❌ **MISSING** | **Art. 33 Abs. 5 DSGVO — Dokumentationspflicht gilt unabhängig davon, ob gemeldet wird.** Die beiden Evidenzdokumente unter `docs/legal/incidents/` sind die inhaltliche Grundlage, aber noch kein Register | **P0** |
| **D-16** | **NDA** | **BEST PRACTICE** | ❌ **MISSING** | Kein gesetzlicher Zwang. Relevant bei Praxen und Vereinen, die Einblick in ihre Abläufe gewähren. § 203 StGB-Umfeld bei Heilberufen erhöht das Interesse der Gegenseite | **P2** |
| **D-17** | **IP-/Nutzungsrechte** | **CONTRACTUAL PROTECTION** | ❌ **MISSING** | **§ 31 Abs. 5 UrhG (Zweckübertragungslehre):** Ohne ausdrückliche Einräumung erhält der Kunde nur, was der Vertragszweck zwingend erfordert. Das ist für **beide** Seiten eine Streitquelle. Muss OSS-Bestandteile, wiederverwendbare Cogniiq-Bausteine und KI-Output getrennt regeln | **P0** |
| **D-18** | **Change-Request-Regelung** | **CONTRACTUAL PROTECTION** | ❌ **MISSING** | Ohne sie sind Zusatzwünsche entweder unbezahlt oder streitig. Bei Festpreis (öffentlich zugesagt) besonders kritisch | **P1** |
| **D-19** | **Abnahmeregelung** | **CONTRACTUAL PROTECTION** | ❌ **MISSING** | **§ 640 BGB:** Die Abnahme löst Fälligkeit, Gefahrübergang, Beweislastumkehr und Verjährungsbeginn aus. Ohne Regelung (inkl. Abnahmefiktion nach § 640 Abs. 2) bleibt der Werklohn unbestimmt fällig | **P0** |
| **D-20** | **Exit-/Datenexport-Regelung** | **CONDITIONALLY REQUIRED** | ❌ **MISSING** | Zwingend, falls der Data Act (VO (EU) 2023/2854, Kap. VI) greift → Applicability offen. **Unabhängig davon ein Verkaufsargument**: nimmt dem Mittelstandskunden die Lock-in-Sorge. Technische Basis existiert (`src/lib/ownerFinance/exports/**`) | **P1** |
| **D-21** | **Referenzkunden-/Logo-Einwilligung** | **CONDITIONALLY REQUIRED** | ❌ **MISSING** | Zwingend, **sobald** eine Kundenstimme oder ein Logo veröffentlicht wird. Aktuell wird **keines** verwendet — `TestimonialBlock.tsx:12-22` hält den Verzicht ausdrücklich fest. **Bedingung noch nicht eingetreten**, das Muster aber vorzubereiten | **P2** |
| **D-22** | **Art.-14-Informationsblatt** | **MANDATORY** | ❌ **MISSING** | **Art. 14 Abs. 3 lit. a DSGVO: Frist von einem Monat, seit 2026-08-30 abgelaufen.** Die Ausnahme nach Abs. 5 lit. b (unverhältnismäßiger Aufwand) greift bei 50 Datensätzen mit hinterlegter E-Mail **nicht** | **P0** |
| **D-23** | **Marketing-Suppression-List** | **CONDITIONALLY REQUIRED** | ❌ **MISSING** | Zwingend, sobald Werbung versendet wird — § 7 Abs. 3 Nr. 4 UWG, Art. 21 Abs. 2-3 DSGVO. **Ohne sie ist kein Werbeversand rechtskonform durchführbar, auch nicht mit Einwilligung** | **P1** |
| **D-24** | **AI-Literacy-Dokumentation** | **MANDATORY** | ❌ **MISSING** | **Art. 4 VO (EU) 2024/1689 — seit 02.02.2025 in Kraft**, für Provider **und** Deployer. Kein Formalismus: Es geht um nachweisbare Kompetenz derjenigen, die KI-Systeme einsetzen und ausliefern | **P2** |

## Zusätzlich erforderlich, im Auftrag nicht genannt

| # | Dokument | Klassifikation | Begründung | Prio |
|---|---|---|---|---|
| **D-25** | **Interessenabwägung Art. 6 Abs. 1 lit. f** für die Lead-Datenbank | **MANDATORY** | Ohne dokumentierte Abwägung fehlt die Rechtsgrundlage für die Speicherung der 50 Datensätze. Voraussetzung für D-22 | **P0** |
| **D-26** | **Vorfallsdokumentation Oura** | **MANDATORY** | Art. 33 Abs. 5. Grundlage: `incidents/OURA_INCIDENT_EVIDENCE.md` | **P0** |
| **D-27** | **Vorfallsdokumentation Leads** | **MANDATORY** | Art. 33 Abs. 5. Grundlage: `incidents/LEADS_INCIDENT_EVIDENCE.md` | **P0** |
| **D-28** | **B2B-Klarstellung** (AGB § 1 + Website) | **CONTRACTUAL PROTECTION** | Beschränkung auf Unternehmer nach § 14 BGB **erspart** Widerrufsbelehrung, PAngV-Komplexität, § 312k BGB und mit hoher Wahrscheinlichkeit das BFSG. **Der wirtschaftlichste Einzelposten dieser Liste** | **P1** |
| **D-29** | **Betroffenenrechte-Verfahren** (Auskunft, Export, Löschung) | **MANDATORY** | Art. 15-20 DSGVO. Die Rechte sind in der DS-Erklärung korrekt aufgezählt, aber es existiert **kein Prozess und kein Werkzeug** | **P2** |
| **D-30** | **THIRD-PARTY-NOTICES / OSS-Lizenzinventar** | **CONDITIONALLY REQUIRED** | MIT, BSD und Apache verlangen die Weitergabe des Lizenztexts. **Zwingend, sobald Code an Kunden ausgeliefert wird — was das Geschäftsmodell ist.** Zugleich Schutz vor unbemerkter AGPL/SSPL im transitiven Closure | **P2** |
| **D-31** | **Asset-Register** (Herkunft und Lizenz) | **BEST PRACTICE** | `og-image.png`, Spline-Szene, DejaVu-Fonts (Lizenztext-Weitergabepflicht) mit ungeklärter Herkunft. `ASSETS-REQUIRED.md` ist der Ansatz dafür | **P3** |
| **D-32** | **Accessibility-Erklärung** | **CONDITIONALLY REQUIRED** | Nur bei BFSG-Anwendbarkeit — nach Prüfung **unwahrscheinlich** (kein Verbrauchervertragsschluss über die Website; zusätzlich Kleinstunternehmer-Ausnahme § 3 Abs. 3 BFSG). **Bedingung derzeit nicht eingetreten** | **P3** |
| **D-33** | **Widerrufsbelehrung + Muster-Widerrufsformular** | **CONDITIONALLY REQUIRED** | Nur bei Verbraucherverträgen. **Wird durch D-28 gegenstandslos.** Ohne Belehrung verlängert sich die Widerrufsfrist auf 12 Monate + 14 Tage (§ 356 Abs. 3 S. 2 BGB) — das eigentliche Risiko | **P1** falls kein D-28 |
| **D-34** | **DSFA Oura** | **CONDITIONALLY REQUIRED** | Art. 35 Abs. 3 lit. b. **Entfällt vollständig mit der Entfernung** | entfällt |

## Zusammenfassung

| Klassifikation | Gesamt | EXISTS | PARTIAL | MISSING |
|---|---|---|---|---|
| MANDATORY | 14 | 2 | 3 | **9** |
| CONDITIONALLY REQUIRED | 9 | 0 | 0 | **9** (davon 3 mit noch nicht eingetretener Bedingung) |
| CONTRACTUAL PROTECTION | 7 | 0 | 0 | **7** |
| BEST PRACTICE | 3 | 0 | 0 | 3 |
| **Summe** | **33** | **2** | **3** | **28** |

## Erstellungsreihenfolge

**Warum diese Reihenfolge:** Jeder Block liefert die Eingangsdaten für den nächsten. Das Verarbeitungsverzeichnis ist die Grundlage, weil es die Verarbeitungen benennt, die der AVV regelt und die die Datenschutzerklärung offenlegt. Wer mit den AGB anfängt, schreibt sie zweimal.

### Block 1 — Datenschutz-Fundament (Woche 1-2)
1. **D-12 Verarbeitungsverzeichnis** → Grundlage für alles Weitere
2. **D-10 TOM** → aus `PROCESSOR_INVENTORY.md` §5 ableitbar, zu ~85 % vorhanden
3. **D-11 Subprozessorenliste** → aus `PROCESSOR_INVENTORY.md` ableitbar
4. **D-09 AVV-Muster** → nutzt D-10 und D-11 als Anlagen. **Löst zugleich sieben UWG-Findings**
5. **D-15 / D-26 / D-27 Breach-Register + zwei Vorfallsdokumentationen** → Evidenz liegt vor
6. **D-25 Interessenabwägung** → Voraussetzung für D-22

### Block 2 — Vertragsstack (Woche 3-4, anwaltlich)
7. **D-28 B2B-Klarstellung** → entscheidet über D-33 und vereinfacht alles Folgende
8. **D-04 B2B-AGB** mit D-17, D-19, D-18
9. **D-05 Werkvertrag**, **D-06 SaaS-Vertrag**, **D-07 Wartungsvertrag**
10. **D-08 SLA**, **D-20 Exit-Regelung**

### Block 3 — Betrieb (Woche 5-6)
11. **D-13 Löschkonzept** inkl. Backup-Retention
12. **D-14 Incident-Response-Plan**
13. **D-22 Art.-14-Informationsblatt** + **D-23 Suppression-List**
14. **D-02 Datenschutzerklärung überarbeiten** → **zuletzt**, wenn alle technischen Entscheidungen gefallen sind

### Block 4 — Skalierung
15. D-16, D-21, D-24, D-29, D-30, D-31

> **Der wirtschaftlich stärkste Einzelschritt ist D-09 (AVV-Muster mit TOM-Anlage).** Er erfüllt eine zwingende DSGVO-Pflicht, beseitigt sieben UWG-Findings gleichzeitig, macht die Zusage auf sieben Website-Seiten wahr und ist zugleich das Dokument, nach dem jeder Praxis- und Vereinskunde ohnehin als Erstes fragen wird.
