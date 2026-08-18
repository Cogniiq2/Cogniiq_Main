# ROUTING-PROPOSAL — Neue Routen (wartet auf Freigabe)

Stand: 2026-08-16 · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Regel: Keine Route wird angelegt, bevor dieses Dokument freigegeben ist
(Brief II §6; Ihre Vorgabe: „Routing-Vorschlag vorlegen und auf Freigabe warten").
Bestehende URLs, Canonicals und Redirects bleiben in jedem Fall unverändert.

## 1. Healthcare-Einstiegsseite (Option B)

| Vorschlag | Wert |
|---|---|
| Route | **`/praxen`** (Alternative: `/gesundheitswesen`) |
| H1 | „Ein Empfang am Telefon für Ihre Praxis" |
| Zweck | In sich geschlossene Healthcare-Journey: Einstieg → Arzt / Therapie / Kosten / Stadtseiten, ohne Hotel-/Restaurant-Inhalte in Navigation oder Links |
| Inhalt | M1-Szene, vier Säulen, M13-Stimmprobe (asset-gated), M15 Grenzen, M20 Patientensicht, M21 Team, Segment- und Stadtlinks, FAQ-Kern |
| Meta-Title (≤60) | „KI Telefonassistent für Praxen – Ihr Empfang \| Cogniiq" (55) |
| Schema | Service + FAQPage + BreadcrumbList |
| Navigation | Eintrag „Für Praxen" im Hauptmenü; auf Healthcare-Seiten ersetzt er die generische Branchen-Navigation |

Begründung für `/praxen`: kurz, deutsch, deckt Arzt-, Zahn- und Therapiepraxen
ab und kollidiert nicht mit `/ki-telefonassistent-praxis` (Therapie-Segment).

## 2. Integrationen / PVS (von Ihnen freigegeben, Route noch zu bestätigen)

| Vorschlag | Wert |
|---|---|
| Route | **`/integrationen`** |
| H1 | „Anbindung an Ihr System: PVS, Kalender, Telefonanlage" |
| Inhalt | Dreistufige Liste (direkt angebunden / über Schnittstelle möglich / auf Anfrage prüfen) aus OWNER-INPUT B1–B4; was „Anbindung" für die MFA konkret bedeutet; was heute noch nicht geht; M14-Übergabe (asset-gated) |
| Blocker | Inhalt erst baubar, wenn OWNER-INPUT B1–B4 beantwortet ist — die Seite ohne verifizierte Liste wäre genau das leere Versprechen, das der Brief verbietet |

## 3. Datenschutz & Sicherheit (von Ihnen freigegeben, Route noch zu bestätigen)

| Vorschlag | Wert |
|---|---|
| Route | **`/datenschutz-sicherheit`** |
| Abgrenzung | Getrennt von der Rechtsseite `/datenschutz` (Datenschutzerklärung); Marketing-/S4-Seite für den Gatekeeper |
| Inhalt | AVV Art. 28 · § 203 StGB · Aufzeichnung/Speicherung + § 201 StGB · Hosting & Sub-Auftragsverarbeiter · Kein Training auf Patientendaten (nur falls B7 = nein) · Art. 50 KI-VO als Vertrauensmerkmal (nur falls C1 = ja) · DSB-Unterstützung ohne DSFA-Aussage · Downloads (falls C4 = ja) |
| Blocker | OWNER-INPUT B5–B8, C1–C5 |

## 4. Umsetzungsreihenfolge nach Freigabe

1. `/praxen` (kein Owner-Input nötig — baubar aus vorhandenen Modulen; M13 bleibt bis zur Audiodatei unsichtbar)
2. `/datenschutz-sicherheit` (nach C-Antworten)
3. `/integrationen` (nach B-Antworten)

Sitemap: neue Routen werden über den bestehenden deterministischen Generator
aufgenommen (`scripts/generate-sitemap.mjs`); keine manuellen Sitemap-Einträge.

**Freigabe bitte als Antwort auf dieses Dokument: Routen-Namen bestätigen oder
korrigieren.** Bis dahin wird keine Route angelegt.
