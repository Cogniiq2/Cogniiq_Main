# COPY-INVENTORY — Cogniiq Website Copy Overhaul (Evidence-Driven)

Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Grundlage: Master-Brief (Evidence-Driven Copy Overhaul, v1.0)

## Scope dieses Durchlaufs: KI-Telefonassistent-Cluster (Gesundheitswesen-Fokus)

Die Website ist eine Agentur-Website mit drei Leistungsbereichen (Webdesign,
Automatisierung, KI-Telefonassistent). Der Brief adressiert Entscheider im
ambulanten Gesundheitswesen; im Repo entspricht das dem
KI-Telefonassistent-Cluster. Unverbundene Flächen (Webdesign, Gastronomie-
Segmente, Kundenportal, Admin) bleiben unangetastet (Brief §1, CLAUDE.md R14).

### In Scope (dieser Durchlauf)

| # | Route | Datei | Seitentyp | Aktuelle H1 | Aktueller Meta-Title | Ziel-Keyword (abgeleitet) | Wörter (Datei) |
|---|---|---|---|---|---|---|---|
| 1 | `/ki-telefonassistent` | `src/pages/KiTelefonassistentPage.tsx` | Service-Hauptseite | "Jeder Anruf beantwortet. Kein Kunde verloren." | "KI Telefonassistent für Unternehmen \| Cogniiq" | KI Telefonassistent | ~4100 |
| 2 | `/ki-telefonassistent-arzt` | `src/pages/industries/KiTelefonassistentArzt.tsx` | Segment (Arztpraxis) | "KI Telefonassistent für Arztpraxen" | "KI Telefonassistent für Arztpraxen \| Automatische Terminbuchung \| Cogniiq" | KI Telefonassistent Arztpraxis | ~900 |
| 3 | `/ki-telefonassistent-praxis` | `src/pages/industries/KiTelefonassistentPraxis.tsx` | Segment (Therapie) | "KI Telefonassistent für Therapeuten & Praxen" | "KI Telefonassistent für Therapeuten & Praxen \| Automatisierte Terminbuchung \| Cogniiq" | KI Telefonassistent Praxis / Therapeut | ~840 |
| 4 | `/kosten-ki-telefonassistent` | `src/pages/costs/KostenKiTelefonassistent.tsx` | Preisseite | "Was kostet ein KI Telefonassistent?" | "Was kostet ein KI Telefonassistent? Preise & Kosten \| Cogniiq" | KI Telefonassistent Kosten | ~810 |
| 5 | `/bayreuth/ki-telefonassistent` | `src/lib/standorte-service-configs.ts` (Z. 24–157) | Stadtseite | "KI Telefonassistent in Bayreuth" | "KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme \| Cogniiq" | KI Telefonassistent Bayreuth | ~1300 |
| 6 | `/regensburg/ki-telefonassistent` | `src/lib/standorte-service-configs.ts` (Z. 414–541) | Stadtseite | "KI Telefonassistent in Regensburg" | "KI Telefonassistent Regensburg – AI Rezeption & Anrufannahme \| Cogniiq" | KI Telefonassistent Regensburg | ~1300 |
| 7 | `/muenchen/ki-telefonassistent` | `src/lib/standorte-service-configs.ts` (Z. 784–912) | Stadtseite | "KI Telefonassistent für Unternehmen in München" | "KI Telefonassistent München – AI Rezeption & Telefonservice \| Cogniiq" | KI Telefonassistent München | ~1350 |

Hinweis Stadtseiten: Rendering über `CityServicePage.tsx`, Inhalte als Config-
Objekte. Die Stadtseiten adressieren mehrere Branchen (Praxen, Gastronomie,
Handwerk); die Branchenbreite bleibt erhalten, Gesundheits-Blöcke werden nach
Brief geschärft, Übertreibungen und erfundene Zahlen entfernt.

### Katalogisiert, in diesem Durchlauf NICHT bearbeitet

| Route | Datei | Grund |
|---|---|---|
| `/` | `src/pages/HomePage.tsx` + Hero-/Stats-Komponenten | Agentur-Homepage für alle drei Leistungsbereiche; Healthcare-Fokussierung wäre eine Scope-Entscheidung des Inhabers → COPY-GAPS.md |
| `/bayern/ki-telefonassistent` | `src/pages/BayernKiTelefonassistentPage.tsx` | Regionalseite, Folgerunde; gleiche Regeln anwendbar → COPY-GAPS.md |
| `/ki-telefonassistent/demo` | `src/pages/KiTelefonassistentDemoPage.tsx` | Funktionsseite (Demo-Flow), Copy eng mit Komponentenlogik verzahnt |
| `/ki-telefonassistent-hotel`, `/ki-telefonassistent-restaurant` | `src/pages/industries/…` | Nicht-Gesundheits-Segmente, unverbundene Fläche |
| `/verpasste-anrufe-verlust` | `src/pages/problems/VerpassteAnrufePage.tsx` | Blog-/Problemseite, Folgerunde |
| Webdesign-/Automatisierungs-Cluster, Stadt-Hubs, Rechtsseiten | diverse | Außerhalb des Briefs |

## Zentrale Befunde der Bestandsaufnahme (Verstoß gegen Brief-Regeln)

1. **Erfundene Zahlen** (Brief §2.1/§5.7): "montags über 80 Anrufe vor 9 Uhr",
   "60–80 Anrufe vor 8:30 Uhr", "zwischen 30 und 80 Anrufe täglich",
   "3–5 Minuten", "Reaktionszeit: unter 2 Sekunden", "ca. 1.500–2.000 €/Monat",
   "ROI … innerhalb weniger Wochen", "Entlastet das Praxisteam täglich um
   mehrere Stunden".
2. **Beispielprojekte als reale Kundenfälle lesbar** (Preisseite): vier
   Projekte mit Stadt, Branche und Preis ohne Kennzeichnung als Illustration.
3. **Verbotene Wörter** (§5.9): "vollautomatisch" (mehrfach), "nahtlos"
   (Bayreuth-Intro), "vollständig automatisieren".
4. **Absolutversprechen** (§2.4): "Jeder Anruf beantwortet. Kein Kunde
   verloren.", "kein verpasster Anruf mehr", "keine verpassten Patienten mehr",
   "verhindert das zuverlässig", "erkennt Notfallsituationen zuverlässig",
   "kaum von einem menschlichen Mitarbeiter zu unterscheiden".
5. **Seiten öffnen mit dem Produkt statt mit der Realität des Besuchers**
   (§3 Beat 1) — Ausnahme: Segment-Intros (Arzt, Praxis) sind bereits
   szenisch, aber mit Überversprechen am Absatzende.
6. **Kein Block "Warum bisherige Versuche gescheitert sind"** (§3 Beat 3,
   §14) auf keiner Seite.
7. **AI-Act-Transparenz (Art. 50), § 203 StGB, § 201 StGB** nirgends
   adressiert (§5.4) — Datenschutz-Aussagen beschränken sich auf
   "DSGVO-konform, europäische Server, AVV".
