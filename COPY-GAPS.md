# COPY-GAPS — Offene Punkte und Inhaberentscheidungen

Stand: 2026-08-16 (nach Pass 2 Phase 1–2) · Branch `claude/cogniiq-copy-overhaul-mjkdf4`

## 0. Aktueller Stand nach Pass 2 (Teilfreigabe)

**Erledigt:** repo-weites Ehrlichkeits-Audit + Fixes (HONESTY-AUDIT.md),
SEO-Baseline, Review-Banner (`VITE_REVIEW_MODE`, default aus), Option-B-
Trennung der Healthcare-Journey (Routing-Vorschlag wartet auf Freigabe:
ROUTING-PROPOSAL.md), Module M15/M16/M20/M21 live, M13-Komponente gebaut
(unsichtbar bis Audiodatei, Pflicht-Label fest verdrahtet).

**Blockiert bis OWNER-INPUT A–F beantwortet ist:** M14 (Übergabe-Visual),
M17 (Onboarding mit echten Schritten und Dauern), M18 (Betreuung mit Person),
M19 (Umkehrbarkeit), M22 (Referenz), Preisseite, Integrationen-Seite,
Datenschutz-Sicherheit-Seite.

**Erledigt nach Ihrer Teilfreigabe vom 16.08.2026:**
- Benannte Kundeninhalte vollständig aus dem Rendering entfernt (`4f135aa`).
- Routen `/praxen`, `/integrationen`, `/datenschutz-sicherheit` angelegt
  (`e060c94`); die beiden letzteren als Grundgerüst ohne Fachaussagen und
  bewusst `noindex`.
- Expositionszeitraum des Knappheits-Zählers und Vollständigkeitsprüfung der
  fabrizierten Zitate dokumentiert (`HONESTY-AUDIT.md` §1a/§1b).

**Weiterhin offen — Entscheidungen, die nur Sie treffen können:**
1. **C1 (Art.-50-Ansage)** — steht als Produktfakt auf allen Telefonassistent-
   Seiten; bei „NEIN" fliegt die Aussage sofort raus.
2. **Review-Lenkung** (Gastronomie-Webdesign-Seiten) — Mechanismus beschrieben
   in `HONESTY-AUDIT.md` §6, **unverändert belassen** bis zu Ihrer Entscheidung.
3. **OWNER-INPUT A–F** — schaltet M14, M17, M18, M19, M22, die Preisseite sowie
   die Inhalte von `/integrationen` und `/datenschutz-sicherheit` frei.
4. **Merge des Branches** — der fabrizierte Knappheits-Zähler ist auf
   `origin/main` weiterhin aktiv; seine Entfernung wird erst mit dem Merge
   dieses Branches wirksam (siehe `HONESTY-AUDIT.md` §1a).


## 1. Seiten außerhalb dieses Durchlaufs (Entscheidung / Folgerunde)

| Seite | Empfehlung |
|---|---|
| `/` (Homepage) | Die Homepage bedient alle drei Leistungsbereiche (Webdesign, Automatisierung, Telefonassistent). Der Brief verlangt eine Healthcare-zentrierte Erzählung — das wäre eine strategische Neupositionierung der Startseite und braucht eine Inhaberentscheidung. Bis dahin: mindestens Absolutversprechen und verbotene Wörter in Hero-/Stats-Komponenten prüfen (`src/components/hero/`, `StatsSection.tsx`). |
| `/bayern/ki-telefonassistent` | Gleiche Regeln wie die Stadtseiten anwenden (Folgerunde, ~2.300 Wörter). |
| `/ki-telefonassistent/demo` | Copy eng mit Demo-Komponente verzahnt; nach demselben Regelwerk prüfen. |
| `/verpasste-anrufe-verlust`, Blog | Auf erfundene Zahlen prüfen und auf die Voice-Spezifikation heben. |
| `/ki-telefonassistent-hotel`, `/ki-telefonassistent-restaurant` | Nicht-Gesundheits-Segmente; Banned-Word- und Absolutversprechen-Pass empfohlen (z. B. auf "vollautomatisch" prüfen). |

## 2. Vom Brief gefordert, im Repo nicht vorhanden (Inhaberentscheidung: anlegen?)

Der Brief beschreibt Seiten, die es in der aktuellen Sitestruktur nicht gibt.
Da URL-Struktur nicht ohne Auftrag geändert werden darf (§1, §8.1), wurden sie
nicht angelegt:

- **Integrationen/PVS-Seite** (§7.5) — wichtigste fehlende Seite für Einwand #2
  ("lässt sich nicht in mein PVS integrieren"). Braucht die verifizierte
  Anbindungsliste in drei Stufen (direkt / über Schnittstelle / auf Anfrage).
- **Datenschutz & Sicherheit als Marketingseite** (§7.6) — aktuell existiert nur
  die rechtliche Datenschutzerklärung. Die S4-Inhalte (§ 203 StGB, § 201 StGB,
  Sub-Auftragsverarbeiter, Hosting, kein Training auf Patientendaten) haben
  keinen dedizierten Ort; sie sind derzeit auf FAQ-Antworten verteilt.
- **Gesundheits-Segmentseiten** Hausarzt / Facharzt / Zahnarzt & KFO / MVZ
  (§7.7) — es existieren nur "Arzt" und "Praxis/Therapie". Zahnarzt-Recall und
  MVZ-Mehrstandort-Routing sind unbesetzte, evidenzgestützte Themen.
- **About/Warum-Cogniiq-Inhalte zum Betreuungsmodell** (§7.8) — `UeberUnsPage`
  existiert, adressiert aber Einwand #6 (Support setzt Wünsche nicht um) nicht
  mit konkretem Prozess (wer, wie schnell, wie werden Änderungen umgesetzt).

## 3. Fehlende Belege, die nur der Inhaber liefern kann

- **Echte Testimonials:** Es existieren keine Kundenstimmen im Cluster. Der
  Brief verbietet erfundene; Referenzseite (`/referenzen`, `/bewertungen`)
  wurde nicht angetastet. Echte, freigegebene Zitate wären der stärkste
  fehlende Vertrauensbaustein.
- **Eigene Messwerte:** Übernahmequote (konservativ, netto nach Nacharbeit),
  typische Einrichtungsdauer, Reaktionszeiten im Support. Ohne diese Werte
  bleibt die Seite bewusst zahlenarm.
- **Formular-Folgeprozess:** "Was passiert nach dem Absenden, in welchem
  Zeitfenster?" (§10) konnte mangels bestätigter Reaktionszeit nicht
  beziffert werden.
- **Lokale Fakten:** Für die Stadtseiten wurden nur öffentlich verifizierbare
  Anker verwendet (Festspiele, UNESCO-Altstadt, Uniklinikum). Konkretere lokale
  Gesundheitsstruktur-Daten (Praxisdichte o. Ä.) lagen nicht vor.

## 4. Bekannte Einschränkungen dieses Durchlaufs

- `graphify update .` konnte nicht ausgeführt werden — kein graphify-Binary im
  Container und kein `graphify-out/` im Repo-Stand dieses Branches.
- Die `[[CLAIM]]`-Marker stehen als Code-Kommentare neben den betroffenen
  Stellen (nicht im gerenderten Text): Sichtbare englische Marker würden gegen
  die Sprachregel (§0) verstoßen und auf Cloudflare-Previews erscheinen. Die
  vollständige Liste steht in `COPY-CLAIMS-TO-VERIFY.md`.
- Der Sprachassistenz-Hinweis nach Art. 50 KI-VO wird im Copy als Produktfakt
  beschrieben (A6 in der Claims-Liste). Sollte das Produkt den Hinweis heute
  nicht sprechen, muss entweder das Produkt nachziehen oder die Aussage raus —
  Dritte Option gibt es nicht, die Pflicht gilt unabhängig vom Marketing.

---

# Nachtrag 2026-08-29 — Lücken, die diese Runde geschlossen und offen gelassen hat

## Geschlossen

- **Einführung als eigene Absicht.** Es gab keine Seite, die beschreibt, was die
  Praxis für eine Einführung entscheiden und prüfen muss. Jetzt
  `/ki-telefonassistent-einfuehren`.
- **Redaktionelle Verantwortung.** Kein Fachbeitrag der Website nannte bisher
  eine verantwortliche Person. `RedaktionelleVerantwortung` schließt das für neue
  Beiträge; die bestehenden Blogbeiträge tragen weiterhin nur `Organization` als
  `author` (siehe offen).

## Weiterhin offen

| Lücke | Warum sie offen bleibt |
|---|---|
| Rechtsrahmen-Seite (§ 203 StGB, Art. 9/28/32 DSGVO, Art. 50 KI-VO) | Stärkste unbesetzte Absicht des Clusters. Ohne geprüfte Primärquellen nicht publizierbar; Einzelheiten in `docs/seo/serp-research-2026-08-29.md`. |
| PVS-/Schnittstellen-Seite | Gesperrt durch OWNER-INPUT B1–B3 und die fehlende Unterauftragnehmerliste (`ASSETS-REQUIRED.md` §B2.3). |
| Terminbuchung als eigene Absicht | Nahe an einer Buchungszusage; erst nach B1–B4 sinnvoll. |
| Kanonischer Eigentümer für „KI Telefonassistent Arztpraxis" | `/praxen`, `/ki-telefonassistent-praxis` und die eingefrorene Route `/ki-telefonassistent-arzt` konkurrieren um dieselbe Absicht. Nicht auflösbar, solange zwei der drei Seiten eingefroren sind — vorgemerkt in `docs/seo/post-experiment-opportunities.md`. |
| Titel-/H1-Widerspruch auf `/ki-telefonassistent-praxis` | Manifest-Title spricht von medizinischen Praxen, die H1 von Therapeuten. Nicht Teil dieser Runde. |
| Blogbeiträge ohne benannte Verantwortung | `RedaktionelleVerantwortung` ist gebaut, aber nur auf der neuen Seite eingesetzt. Ein Einsatz im Blog verlangt, das `Article`-Schema in `BlogPostPage.tsx` im selben Schritt von `Organization` auf `Person` umzustellen, sonst widerspricht die Auszeichnung dem sichtbaren Text. |
| Autoritäts-Aufbau off-site | Der eigentliche Engpass. Plan in `docs/seo/authority-acquisition-plan.md`; on-site nicht lösbar. |
