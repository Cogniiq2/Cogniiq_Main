# Authority acquisition plan — Cogniiq

Erstellt: 2026-08-29 · Basis-Commit `0652c2e` · Status: **Vorschlag, keine Outreach durchgeführt**

Dieses Dokument ist bewusst kein generischer Linkbuilding-Plan. Es benennt
konkrete Zielkategorien mit dem Asset, das ihnen tatsächlich etwas nützt.

## Warum das der harte Engpass ist

Die Domain ist technisch indexierbar, sauber vorgerendert und metadatenseitig
konsistent. Was fehlt, ist extern bezeugte Autorität. Das lässt sich **nicht**
on-site herstellen. Rahmenbedingungen, die dieser Plan ernst nimmt:

- Cogniiq besteht seit **2025-10-15** (`src/lib/seo-data.ts`, `foundingDate`).
  Ein zehn Monate altes Unternehmen hat kein Jahrzehnt an Erwähnungen.
- Es gibt derzeit **keine öffentlich benannte Kundenreferenz** im Repository
  (`src/pages/ReferenzenPage.tsx` nennt Prinzipien, keine Namen). Tier A
  beginnt damit nicht bei „bestehende Links einsammeln", sondern bei
  „Erlaubnis einholen, die Beziehung überhaupt zu nennen".
- Die Wettbewerber im Cluster (Doctolib/aaron.ai, CGM, Dr. Flex, fonio.ai,
  PraxisConcierge, DocMedico) sind finanziert und publizieren jährlich
  aktualisierte Vergleichstabellen. Ein Wettlauf um dieselben Links ist
  nicht gewinnbar.

Die realistische Strategie ist deshalb **nicht** „mehr Links", sondern:
eine kleine Zahl zitierfähiger Fachartefakte, die genau dort Lücken füllen,
wo die Anbieterlandschaft aus Eigeninteresse schweigt — PVS-Integrationsrealität,
Rechtsrahmen, Einführungspraxis.

## Die Assets, auf die sich dieser Plan stützt

| Asset | Status | Warum jemand darauf verlinken würde |
|---|---|---|
| A1 — Einführungsleitfaden Arztpraxis (`/ki-telefonassistent-einfuehren`) | in diesem PR | Vollständige, aus echten Projekten abgeleitete Einführungsmethodik statt Feature-Liste. Die einzige öffentliche Darstellung, die Abbruchkriterien und Go-Live-Gate benennt. |
| A2 — PVS-Integrations-Entscheidungsbaum (`/pvs-integration-ki-telefonassistent`) | in diesem PR | Beantwortet die Frage, an der jede Anbieterseite vorbeischreibt: *welche Art* von Schnittstelle liegt vor und was folgt daraus. Herstellerneutral. |
| A3 — Rechtsrahmen-Seite (§ 203 StGB, Art. 9/28/32 DSGVO, Art. 50 KI-VO) | **zurückgestellt**, siehe `docs/seo/serp-research-2026-08-29.md` | Höchste Nachfrage, keine belastbare Konkurrenz — aber ohne verifizierte Primärquellen nicht publizierbar. |

A3 ist der stärkste Link-Magnet des Clusters und bleibt die wichtigste offene
Aufgabe. Reihenfolge nicht umdrehen: A3 ohne geprüfte Quellen veröffentlichen
würde genau die Glaubwürdigkeit kosten, die der Plan aufbauen soll.

---

## TIER A — bestehende Beziehungen und einfachste legitime Links

Höchste Abschlusswahrscheinlichkeit, geringster Aufwand. Der Engpass ist hier
Einwilligung, nicht Überzeugung.

| # | Ziel | Relevanz | Passendes Asset | Winkel | Schwierigkeit | Wert |
|---|---|---|---|---|---|---|
| A-01 | Bestandskunden mit öffentlich sichtbarer Zusammenarbeit | hoch | Referenzseite | Freigabe für Nennung + „Umgesetzt von"-Fußzeile auf der Kundenwebsite | niedrig | hoch |
| A-02 | Bestandskunden ohne öffentliche Nennung | hoch | A1 | Freigabe für anonymisierte Fallbeschreibung („Praxis mit 4 Behandlern") | niedrig | mittel |
| A-03 | Webdesign-Kunden (Website-Projekte) | mittel | Referenzseite | Portfolio-Eintrag + Credit-Link, branchenüblich | niedrig | mittel |
| A-04 | Steuerberater / Rechtsanwalt / Versicherungsmakler des eigenen Betriebs | mittel | A1 | Partnerliste bzw. „Mandanten aus der Region" | niedrig | niedrig |
| A-05 | Hosting-/Infrastrukturpartner (Hetzner-Ökosystem) | mittel | A2 | Referenzarchitektur eines deutschen Kunden | mittel | mittel |
| A-06 | Telefonie-/SIP-Trunk-Anbieter | hoch | A2 | Integrationsbeschreibung aus Betreiberperspektive | mittel | hoch |
| A-07 | n8n-Ökosystem (Community-Workflows, Templates) | hoch | A2 | Veröffentlichter, generalisierter Workflow-Baustein | mittel | hoch |
| A-08 | ElevenLabs-Ökosystem (Showcase, Community) | hoch | A1/A2 | Implementierungsbericht deutscher Telefonie-Einsatz | mittel–hoch | hoch |
| A-09 | Lokale Unternehmensnetzwerke Bayreuth / Oberfranken | mittel | Firmenprofil | Mitgliedseintrag mit Website | niedrig | niedrig |
| A-10 | IHK Oberfranken Bayreuth | mittel | A1 | Mitgliederverzeichnis, ggf. Fachbeitrag Digitalisierung | niedrig–mittel | mittel |
| A-11 | Handwerkskammer / Branchenverbände regionaler Kunden | niedrig | A1 | Dienstleisterverzeichnis | niedrig | niedrig |
| A-12 | Universität Bayreuth — Gründungs-/Transferstellen | mittel | A1 | Startup-Verzeichnis der Region | mittel | mittel |
| A-13 | Regionale Gründer- und Digitalinitiativen Oberfranken | mittel | A1 | Projektvorstellung | mittel | mittel |
| A-14 | Lieferanten / eingesetzte SaaS-Anbieter | niedrig | — | Kundenreferenz auf deren Website | niedrig | niedrig |
| A-15 | Partneragenturen (Design, Text, Fotografie) | mittel | A2 | Wechselseitige Empfehlungsseite, thematisch begründet | niedrig | mittel |

**Wichtig für A-01 bis A-03:** ohne schriftliche Freigabe keine Nennung. Kein
Kundenname, kein Logo, keine Fallzahl ohne Einwilligung — bei Praxen zusätzlich
wegen § 203 StGB und weil die Zusammenarbeit selbst schon eine Information über
die Praxis ist.

---

## TIER B — verdiente Fachöffentlichkeit

Mittlere Wahrscheinlichkeit, deutlich höherer Autoritätswert. Voraussetzung ist
immer ein Artefakt, das ohne Cogniiq-Werbung Bestand hat.

| # | Ziel | Relevanz | Passendes Asset | Winkel | Schwierigkeit | Wert |
|---|---|---|---|---|---|---|
| B-01 | `arzt-wirtschaft.de` | sehr hoch | A2 | „Was PVS-Integration technisch wirklich bedeutet" | mittel–hoch | sehr hoch |
| B-02 | Deutsches Ärzteblatt (Praxis-IT-Ressort) | sehr hoch | A3 | Rechtsrahmen KI-Telefonie — **erst nach A3** | hoch | sehr hoch |
| B-03 | `Der Hausarzt` / Hausärzteverband-Medien | hoch | A1 | Einführung ohne Praxisstillstand | mittel–hoch | hoch |
| B-04 | `ZWP online` / Spitta (Dental) | hoch | A1 | Zahnarztspezifische Anrufarten | mittel | hoch |
| B-05 | `Dental Magazin` / dzw | hoch | A1 | Recall und Terminausfälle | mittel | hoch |
| B-06 | `E-HEALTH-COM` | hoch | A2 | Interoperabilität jenseits der Vendor-Claims | mittel–hoch | sehr hoch |
| B-07 | `kma Online` / Gesundheitswirtschaft | mittel–hoch | A2 | Digitalisierung der Patientenkommunikation | hoch | hoch |
| B-08 | `Ärzte Zeitung` (Praxisführung) | hoch | A1 | Entlastung der Anmeldung, realistisch gerechnet | hoch | sehr hoch |
| B-09 | Praxisführungs-Newsletter / MFA-Fachmedien | mittel | A1 | Team-Einführung, Einwände der Anmeldung | mittel | mittel |
| B-10 | `heise online` / c't (Sicherheit, KI) | mittel | A3 | Schweigepflicht und externe KI-Dienstleister | sehr hoch | sehr hoch |
| B-11 | `Golem` / t3n (KI-Praxis) | mittel | A2 | Ehrlicher Erfahrungsbericht Sprach-KI-Telefonie | hoch | hoch |
| B-12 | Nordbayerischer Kurier (Bayreuth) | mittel | Firmenprofil | Regionales Unternehmensporträt | niedrig–mittel | mittel |
| B-13 | `Wirtschaft in Oberfranken` / IHK-Magazin | mittel | A1 | Mittelstand und KI, regional verankert | mittel | mittel |
| B-14 | Bayerischer Rundfunk (Wirtschaft Oberfranken) | niedrig–mittel | A1 | Regionale KI-Anwendung | hoch | hoch |
| B-15 | Deutschsprachige KI-/Automatisierungs-Podcasts | mittel | A1 | Implementierungsrealität statt Hype | mittel | mittel |
| B-16 | Praxisführungs-/Gesundheits-IT-Podcasts | hoch | A1 | Einführung aus Sicht des Umsetzers | mittel | hoch |
| B-17 | `Praxis-Management`-Fachtitel (PVS-nah) | hoch | A2 | GDT/HL7 verständlich erklärt | mittel | hoch |
| B-18 | Datenschutz-Fachmedien (`datenschutz-notizen`, `activeMind`-Magazin) | hoch | A3 | § 203 Abs. 3 und Auftragsverarbeitung — **erst nach A3** | mittel–hoch | sehr hoch |
| B-19 | Regionale Wirtschaftsförderung Oberfranken Offensiv | mittel | A1 | Digitalisierungsbeispiel | mittel | mittel |
| B-20 | Fachkonferenzen (DMEA, conhIT-Nachfolge) — Vortrag/Recap | hoch | A2 | Sprecherprofil mit Link | hoch | sehr hoch |

---

## TIER C — Ressourcenseiten und Fachbeiträge

Planbar, geringere Einzelwirkung, gut skalierbar ohne Spam.

| # | Ziel | Relevanz | Passendes Asset | Winkel | Schwierigkeit | Wert |
|---|---|---|---|---|---|---|
| C-01 | Kuratierte Listen „Digitalisierung Arztpraxis" | hoch | A1/A2 | Aufnahme als Fachressource | mittel | mittel |
| C-02 | PVS-Hersteller-Wissensdatenbanken / Foren (z. B. tomedo-Forum) | sehr hoch | A2 | Sachbeitrag zu einer offenen Integrationsfrage | niedrig–mittel | hoch |
| C-03 | Praxis-/MFA-Fachforen | hoch | A1 | Antwort auf konkrete Einführungsfragen | niedrig | mittel |
| C-04 | Reddit `r/de_EDV`, `r/Arztpraxis`-nahe Communities | mittel | A2 | Fachlicher Beitrag, kein Produktlink | niedrig | niedrig–mittel |
| C-05 | Stack Overflow / Fach-Q&A zu GDT, HL7, FHIR | mittel | A2 | Belegte technische Antwort | mittel | mittel |
| C-06 | n8n Community Forum | hoch | A2 | Workflow-Muster Telefonie → Backend | niedrig–mittel | mittel |
| C-07 | ElevenLabs Community / Discord-Showcase | mittel | A1 | Deutscher Telefonie-Einsatz | niedrig | mittel |
| C-08 | Awesome-Listen (Voice AI, Healthcare IT) | mittel | A2 | Pull Request mit Ressource | niedrig | mittel |
| C-09 | Wikipedia-Belege (Praxisverwaltungssystem, GDT) | mittel | A2 | Nur wenn A2 unstrittig neutral ist | hoch | hoch |
| C-10 | Gastbeiträge in Agentur-/Beraterblogs | mittel | A1 | Fachbeitrag ohne Verkaufsrahmen | mittel | mittel |
| C-11 | Verzeichnisse für KI-Dienstleister DACH | mittel | Firmenprofil | Redaktionell geprüfte Verzeichnisse | niedrig | niedrig |
| C-12 | Fachbeiträge in HR-/Praxisorganisations-Medien | mittel | A1 | Entlastung statt Personalabbau | mittel | mittel |
| C-13 | Hochschul-Lehrmaterial Gesundheitsinformatik | mittel | A2 | Verwendung als Anschauungsmaterial | hoch | hoch |
| C-14 | Branchen-Glossare (GDT, HL7, FHIR) | niedrig–mittel | A2 | Vertiefungslink | niedrig | niedrig |
| C-15 | `Digital Health`-Newsletter | mittel | A2 | Kuratierte Erwähnung | mittel | mittel |

---

## Die zehn realistischen ersten Ziele

Nach Verhältnis von Abschlusswahrscheinlichkeit zu Wert, in dieser Reihenfolge:

1. **A-01/A-02** — Freigaben bestehender Kunden einholen. Ohne diesen Schritt
   bleibt jede Fallbeschreibung unbelegbar. Blockiert nichts anderes, dauert
   aber am längsten. Deshalb zuerst starten.
2. **C-02** — PVS-Foren. Dort steht die ehrlichste Antwort des gesamten SERP
   bereits von Nutzern geschrieben; ein fachlich sauberer Beitrag ist willkommen.
3. **C-06** — n8n-Community. Bestehende Kompetenz, niedrige Hürde.
4. **A-10** — IHK Oberfranken. Formal, planbar, regional wirksam.
5. **B-01** — `arzt-wirtschaft.de`. Publiziert bereits Anbietervergleiche und
   hat sichtbaren Bedarf an technischer Tiefe.
6. **B-04/B-05** — Dentalfachmedien. Schwächster Wettbewerb im gesamten Cluster.
7. **A-06** — Telefonieanbieter. Beidseitiges Interesse an Integrationsdoku.
8. **B-06** — `E-HEALTH-COM`. Interoperabilität ist Kernthema des Titels.
9. **B-12** — Nordbayerischer Kurier. Regionales Porträt, geringe Hürde.
10. **B-16** — Praxisführungs-Podcast. Ein Format, das Umsetzerwissen belohnt.

## Was dieser Plan ausdrücklich nicht vorsieht

- Keine automatisierte Outreach, keine Massen-E-Mails.
- Keine gekauften Links, keine Linktausch-Netzwerke, keine PBNs.
- Keine Gastbeiträge, deren einziger Zweck der Link ist.
- Keine Nennung von Kunden ohne schriftliche Freigabe.
- Keine Fachbeiträge zu Rechtsfragen, bevor A3 mit geprüften Primärquellen steht.

## Messung

Fortschritt wird in `docs/seo/organic-growth-scoreboard.md` geführt
(verweisende Domains, nicht Einzel-Links). Ein Ziel gilt erst als erreicht,
wenn der Link live und crawlbar ist — nicht bei Zusage.
