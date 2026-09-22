# LEGAL_COMPLIANCE_AUDIT_2026

**Unternehmen:** Cogniiq, Inhaber Lazar Popovic (Einzelunternehmen)
**Sitz:** Am Main 3, 95444 Bayreuth, Bayern, Deutschland
**Prüfgegenstand:** Repository `cogniiq2/cogniiq_main`, Branch-Stand `claude/friendly-lovelace-tdw6lc` (Basis `origin/main` @ `6f97dd6`)
**Stand der Prüfung:** 22.09.2026
**Prüfmethode:** Vollständige Quellcode-Rekonstruktion (Frontend, Edge Functions, SQL-Migrationen, CI-Skripte, Build-/Routing-Konfiguration). Keine Laufzeitprüfung der Produktivumgebung, keine Einsicht in Verträge, Rechnungen oder die n8n-Instanz.

> **Abgrenzung.** Dieses Dokument ist eine technisch-rechtliche Bestandsaufnahme, **keine Rechtsberatung** und **kein Ersatz für die anwaltliche Einzelfallprüfung**. Jede mit `NEEDS LAWYER REVIEW` markierte Position muss von einer deutschen IT-/Datenschutzkanzlei abschließend bewertet werden. Jede mit `NEEDS BUSINESS CONFIRMATION` markierte Position beruht auf Informationen, die im Repository nicht vorhanden sind.

---

## 1. Executive Summary

Der technische Reifegrad dieses Repositories liegt **deutlich über dem Branchendurchschnitt** für ein Unternehmen dieser Größe. Insbesondere:

- Die Consent-Implementierung (`src/lib/consent.ts`) ist eine saubere Google-Consent-Mode-v2-**Basic**-Umsetzung: vor einer Einwilligung wird nachweislich kein Google-Skript geladen, kein Cookie gesetzt und kein cookieless Ping gesendet. Das ist strenger als das, was die meisten deutschen Websites umsetzen.
- Google Maps ist als Zwei-Klick-Lösung implementiert (`src/components/ConsentMapEmbed.tsx`), Webfonts werden gar nicht geladen (`index.html:83`).
- Die Ehrlichkeit der Marketing-Copy wurde bereits systematisch auditiert (`HONESTY-AUDIT.md`); die beiden gravierendsten UWG-Befunde (fabrizierter Knappheitszähler, Review-Lenkung in Richtung Google) sind **verifiziert nicht mehr im Code** und damit behoben.
- Testimonials sind bewusst vollständig entfernt, bis schriftliche Einwilligungen vorliegen (`src/components/TestimonialBlock.tsx:12-22`). Das ist vorbildlich.
- Die Zugriffsarchitektur der Plattform (RLS, `is_platform_admin()`, signiertes Club-Operations-Gateway mit Replay-Schutz, private Storage-Buckets, JWT-Verifikation in den Edge Functions) ist durchdacht und dokumentiert.

**Das eigentliche Risiko liegt nicht in der Technik, sondern in der rechtlichen Dokumentationsschicht — und in zwei Datenbeständen, die nichts mit dem Website-Geschäft zu tun haben.**

Die fünf bestimmenden Befunde:

1. **Zwei dokumentierte, real eingetretene Datenschutzverletzungen** (anonym lesbare Lead-PII von 50 Praxen; anonym lesbare Oura-Gesundheitsdaten) sind im Code behoben, aber es existiert **nirgends im Repository eine Art.-33-Bewertung, eine Meldeentscheidung oder eine Dokumentation nach Art. 33 Abs. 5 DSGVO**. Die Behebung ersetzt die Meldepflicht nicht.
2. **Gesundheitsbezogene Daten (Art. 9 DSGVO)** aus einem Oura-Ring — Schlaf, Herzfrequenz, HRV, SpO₂, Atemfrequenz, Körpertemperatur, Stress — liegen in derselben Produktivdatenbank wie Kundendaten. Für diese Verarbeitung ist weder eine Rechtsgrundlage nach Art. 9 Abs. 2 noch eine DSFA erkennbar.
3. **Der gesamte Vertrags- und Dokumentationsstack fehlt**: keine AGB, kein AVV-Muster, keine TOM, kein Verarbeitungsverzeichnis, keine Subprozessorenliste, kein Löschkonzept. Gleichzeitig **verspricht die Website ausdrücklich**, dass zu jedem System ein Auftragsverarbeitungsvertrag geliefert wird (`src/pages/LeistungenPage.tsx:204`). Diese Lücke ist zugleich ein DSGVO- und ein UWG-Problem.
4. **50 Datensätze gewerblich gesourcter Kontaktdaten** (Praxisname, Fachrichtung, Ansprechpartner, E-Mail, Telefon, Anschrift) liegen mit Bewertungsfeldern und einem Feld `outreach_channel ∈ {email, phone}` in der Datenbank. Für nicht beim Betroffenen erhobene Daten greift **Art. 14 DSGVO** (Informationspflicht binnen eines Monats); für die Ansprache **§ 7 UWG**. Beides ist im Repository nicht adressiert.
5. **Sicherheits-Header fehlen vollständig** (`public/_headers` enthält ausschließlich `X-Robots-Tag` und `Cache-Control`): keine CSP, kein HSTS, kein `X-Content-Type-Options`, keine `Referrer-Policy`, keine `Permissions-Policy`, kein `frame-ancestors`. Für ein Unternehmen, das Sicherheit verkauft, ist das eine Art.-32-Lücke mit Außenwirkung.

**Gesamteinschätzung:** Keine akute Abmahngefahr aus der öffentlichen Website-Copy — die ist ungewöhnlich sauber. Das Risiko konzentriert sich auf (a) zwei ungemeldete Datenpannen, (b) einen fehlenden Vertragsstack bei laufendem B2B-Geschäft, (c) Gesundheitsdaten ohne Rechtsgrundlage, (d) Kaltakquise-Datenbestand ohne Art.-14-Prozess.

---

## 2. Critical Findings

Nur Befunde, die **vor der nächsten Kundenansprache oder dem nächsten Vertragsabschluss** adressiert werden müssen.

### C-1 — Zwei eingetretene Datenschutzverletzungen ohne dokumentierte Art.-33-Bewertung

**Evidence:**
- `supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql:14-36`
  Wörtlich (gegen das Hosted-Projekt verifiziert): *„pg_class.relrowsecurity = FALSE … `anon` AND `authenticated` each hold DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE. The table holds 50 live rows of third-party contact PII: contact_person, email, phone, street_address, postal_code, city …“*
  Tabelle erstellt am **30.07.2026** (`20260730031350_create_cogniiq_receptionist_leads.sql` — enthält weder `enable row level security` noch `revoke`), abgesichert erst am **02.09.2026**. **Expositionsfenster ≈ 34 Tage.**
- `supabase/migrations/20260731122000_case_d_legacy_convergence.sql:41-47`
  *„public.oura_daily_sleep / oura_daily_readiness / oura_daily_activity: RLS is enabled, but each carries a PERMISSIVE policy … `roles = {public}`, `qual = true` — i.e. every role, anon included, can already SELECT every row of these three tables.“*
  Diese Tabellen enthalten Gesundheitsdaten (s. C-2). Ebenfalls betroffen: `execution_days` (26 Zeilen), `execution_tasks` (349 Zeilen), `execution_templates`, `execution_template_tasks` — jeweils RLS aus **und** volle anon-CRUD-Grants.
- Der `anon`-Key ist per Definition öffentlich und liegt im Browser-Bundle (`src/lib/supabase.ts:4`). Die Exposition war damit für jeden Besucher der Website ausnutzbar, nicht nur theoretisch.

**Rechtliche Einordnung:**
- **Art. 32 Abs. 1 lit. b DSGVO** (Vertraulichkeit) — verletzt, vom Code selbst dokumentiert.
- **Art. 33 Abs. 1 DSGVO** — Meldung an die Aufsichtsbehörde (BayLDA) binnen 72 Stunden, *es sei denn*, ein Risiko ist unwahrscheinlich. Bei Gesundheitsdaten (Oura) ist die Unwahrscheinlichkeit kaum begründbar.
- **Art. 33 Abs. 5 DSGVO** — **Dokumentationspflicht gilt unabhängig davon, ob gemeldet wird.** Diese Dokumentation existiert im Repository nicht.
- **Art. 34 DSGVO** — Benachrichtigung der Betroffenen bei hohem Risiko. Bei den 50 Praxen: Betroffene sind natürliche Personen (`contact_person`), teils im Gesundheitssektor.

**Entscheidend:** Der Migrations-Kommentar argumentiert, *„Neither exposure is justified by any shipped code path“* und dass die Logs keinen Zugriff zeigen. Das ist ein starkes, aber **kein vollständiges** Entlastungsargument: bei `receptionist_leads` wurde ein 24-Stunden-Logfenster ausgewertet (`…pii_rls.sql:55-57`), nicht die vollen 34 Tage. Die Bewertung „Risiko unwahrscheinlich“ ist vertretbar, muss aber **begründet niedergelegt** werden — nicht implizit bleiben.

**Required Fix:** Zwei Vorfallsdokumentationen nach Art. 33 Abs. 5 erstellen (Sachverhalt, Zeitraum, Datenkategorien, Betroffenenzahl, Erkennung, Abhilfe, Risikobewertung, Meldeentscheidung mit Begründung). Meldeentscheidung anwaltlich absichern.
`NEEDS LAWYER REVIEW` · `NEEDS BUSINESS CONFIRMATION` (vollständige Logauswertung über den gesamten Zeitraum möglich?)

---

### C-2 — Gesundheitsdaten (Art. 9 DSGVO) in der Produktivdatenbank ohne erkennbare Rechtsgrundlage

**Evidence:**
- `supabase/migrations/20260709120000_create_richer_oura_tables.sql` — 12 Tabellen `oura_*` mit u. a. `average_heart_rate`, `lowest_heart_rate`, `average_hrv`, `respiratory_rate`, `temperature_deviation`, `body_temperature`, `spo2`, `daily_stress`, `daily_resilience`, `rem_sleep_duration`, `workouts`, `sessions`.
- `supabase/functions/sync-oura/index.ts:1-30` — zieht 11 Endpunkte von `api.ouraring.com` und schreibt sie per Service-Role-Key.
- `src/pages/OuraAnalyticsPage.tsx:40-41` — hart kodierte Projekt-URL, Route `/admin/oura-analytics` (`src/App.tsx:647`), hinter `PlatformAdminRoute`.
- `supabase/migrations/20260709120000_create_richer_oura_tables.sql` enthält **0** Treffer für `enable row level security` / `create policy` (verifiziert). Abgesichert erst durch `20260731122000_case_d_legacy_convergence.sql:730-763`.
- `oura_connections` speichert `access_token` und `refresh_token` **im Klartext** (`…oura_tables.sql:3-10`) — keine Verschlüsselung, obwohl `pgcrypto` in derselben Datei aktiviert wird.

**Rechtliche Einordnung:**
- Schlaf-, Herzfrequenz-, HRV-, SpO₂- und Körpertemperaturdaten sind **Gesundheitsdaten i. S. v. Art. 4 Nr. 15 DSGVO** und damit besondere Kategorien nach **Art. 9 Abs. 1 DSGVO**. Die Verarbeitung ist grundsätzlich **verboten**, soweit keine Ausnahme nach Art. 9 Abs. 2 greift.
- Betrifft die Daten **ausschließlich den Inhaber selbst**, ist die DSGVO nach **Art. 2 Abs. 2 lit. c DSGVO** (persönliche/familiäre Tätigkeit) möglicherweise gar nicht anwendbar — *aber* die Haushaltsausnahme greift nicht mehr sicher, sobald die Daten in einer geschäftlich betriebenen Infrastruktur mit Kundendaten liegen und über eine Admin-Oberfläche des Unternehmens ausgewertet werden.
- Betrifft es **weitere Personen** (Mitarbeiter, Testpersonen): Einwilligung nach **Art. 9 Abs. 2 lit. a** erforderlich, im Beschäftigungskontext zusätzlich **§ 26 Abs. 3 BDSG** und das Freiwilligkeitsproblem.
- **Art. 35 Abs. 3 lit. b DSGVO** — umfangreiche Verarbeitung besonderer Kategorien löst eine DSFA-Prüfpflicht aus; hier eher nicht „umfangreich“, aber zu dokumentieren.
- **Art. 5 Abs. 1 lit. c (Datenminimierung) / lit. f (Integrität)**: Gesundheitsdaten und Kunden-Finanzdaten in einer Datenbank ist das Gegenteil von Zweckbindung.
- **Art. 32 Abs. 1 lit. a**: Klartext-OAuth-Tokens eines Gesundheitsdienstes.

**Required Fix (Empfehlung, geschäftlich zu entscheiden):** Die Oura-Verarbeitung ist ein **privates Nebenprodukt in einer geschäftlichen Produktivumgebung**. Objektiv stärkste Lösung: **vollständig aus diesem Projekt entfernen** (Tabellen, Edge Function, Route, Frontend) und — falls weiter gewünscht — in einem separaten, privaten Projekt betreiben. Das eliminiert Art. 9, die DSFA-Frage, das Token-Problem und einen erheblichen Teil der Breach-Oberfläche in einem Schritt. Ein Löschkonzept für die Bestandsdaten gehört dazu.
`NEEDS BUSINESS CONFIRMATION` (wessen Daten?) · `NEEDS LAWYER REVIEW` (falls Fremddaten)

---

### C-3 — Vertrags- und Dokumentationsstack fehlt vollständig, wird aber öffentlich zugesagt

**Evidence:**
- **Keine AGB**: keine Route `/agb`, kein Dokument im Repository (verifiziert gegen `src/App.tsx` und den Dateibaum).
- **Kein AVV-Muster**, **keine TOM**, **kein Verarbeitungsverzeichnis (Art. 30)**, **keine Subprozessorenliste**, **kein Löschkonzept**, **kein Incident-Response-Plan** — kein Dokument im Repository.
- Dem gegenüber steht die öffentliche Zusage in `src/pages/LeistungenPage.tsx:204`:
  > „Zu jedem System liefern wir Datenschutzerklärung, **Auftragsverarbeitungsvertrag** und Cookie-Einwilligung.“
  und in `src/pages/DeutschlandPage.tsx:200`:
  > „Alle Systeme werden mit den notwendigen **Auftragsverarbeitungsverträgen (AVV)** geliefert.“

**Rechtliche Einordnung:**
- **Art. 28 Abs. 3 DSGVO**: Wo Cogniiq für Kunden personenbezogene Daten verarbeitet — und das tut sie nachweislich, s. Abschnitt 6 — ist ein AVV **zwingend, in Textform**, mit den zehn Pflichtinhalten. Fehlt er, ist das für **beide Seiten** bußgeldbewehrt (Art. 83 Abs. 4 lit. a).
- **Art. 30 Abs. 1 DSGVO**: Verzeichnis für den Verantwortlichen. Die KMU-Ausnahme nach **Art. 30 Abs. 5** greift **nicht**, weil (a) die Verarbeitung nicht nur gelegentlich erfolgt und (b) besondere Kategorien verarbeitet werden. **Art. 30 Abs. 2**: zusätzlich ein Verzeichnis in der Rolle als Auftragsverarbeiter.
- **Art. 32 Abs. 1 DSGVO**: TOM sind materiell teilweise vorhanden (RLS, private Buckets, JWT-Prüfung) und in `docs/security-and-tenancy.md` sowie `docs/phase-0-security-audit.md` technisch beschrieben — **aber nicht als vorlagefähiges TOM-Dokument**, das einem Kunden als AVV-Anlage beigefügt werden kann.
- **§ 5 Abs. 1 Nr. 1 UWG**: Die Zusage „liefern wir AVV“ ist eine Angabe über wesentliche Merkmale der Leistung. Kann sie nicht eingelöst werden, ist sie irreführend. Für laufende Verträge zusätzlich eine vertragliche Nebenpflicht.
- **Ohne AGB** gilt bei jedem Projekt das dispositive Werk-/Dienstvertragsrecht des BGB: unbegrenzte Haftung nach § 280 BGB, Abnahmeregeln nach § 640 BGB ohne Fiktionssteuerung, keine Nutzungsrechtsregelung (§ 31 UrhG — **im Zweifel verbleiben die Rechte beim Urheber**, was bei Kundenprojekten zu Streit führt), keine Mitwirkungspflichten, keine SLA-Grenzen, keine Regelung zu Drittanbieter-API-Änderungen.

**Required Fix:** Vollständiger Vertragsstack (Abschnitt 12). Bis dahin die AVV-Zusage auf der Website entweder einlösen oder präzisieren.
`NEEDS LAWYER REVIEW` (zwingend — AGB-Recht nach §§ 305 ff. BGB ist nicht selbst zu entwerfen)

---

### C-4 — Gesourcte Lead-Daten ohne Art.-14-Prozess und ohne § 7 UWG-Grundlage

**Evidence:**
- `supabase/migrations/20260730031350_create_cogniiq_receptionist_leads.sql:3-19` — Felder `practice_name`, `specialty`, `contact_person`, `city`, `street_address`, `postal_code`, `phone`, `email`, `website`, `fit_score`, `fit_notes`, `outreach_channel check (outreach_channel in ('email','phone'))`, `status`.
- `supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql:44-60` — forensische Feststellung: 50 Zeilen, ein einziger `xmin`, ein `sourced_date` (2026-07-30), Status durchgängig `'new'`, **kein Ingestions-Skript im gesamten Repository-Verlauf**. Also ein externer Sourcing-Lauf.

**Rechtliche Einordnung:**
- **Art. 14 DSGVO**: Daten wurden nicht beim Betroffenen erhoben. Informationspflicht **binnen eines Monats** (Art. 14 Abs. 3 lit. a) oder spätestens bei der ersten Ansprache (lit. b). Die Frist ist seit dem 30.08.2026 **abgelaufen**. Ausnahme Art. 14 Abs. 5 lit. b (unverhältnismäßiger Aufwand) ist bei 50 Datensätzen mit E-Mail-Adresse **nicht** einschlägig.
- **Art. 6 Abs. 1 lit. f DSGVO** kommt als Grundlage für das Speichern in Betracht (Direktwerbung, ErwGr 47) — erfordert aber eine dokumentierte Interessenabwägung. Diese existiert nicht.
- **§ 7 Abs. 2 Nr. 2 UWG — Cold E-Mail:** Werbung per E-Mail ist **ohne vorherige ausdrückliche Einwilligung unzulässig**, auch im B2B. Die Ausnahme des § 7 Abs. 3 UWG (Bestandskundenwerbung) greift bei gesourcten Leads nicht. `outreach_channel = 'email'` ist damit der risikoreichere der beiden Pfade. Abmahnfähig; Streitwerte typischerweise vierstellig, zusätzlich Bußgeldrisiko nach § 20 UWG.
- **§ 7 Abs. 2 Nr. 1 UWG — Cold Call B2B:** bei sonstigen Marktteilnehmern genügt die **mutmaßliche Einwilligung**. Der BGH legt das eng aus: es braucht einen konkreten, aus den Umständen ableitbaren Bezug des angebotenen Produkts zur Geschäftstätigkeit des Angerufenen. Bei einem KI-Telefonassistenten für Arztpraxen ist dieser Bezug **argumentierbar** — aber nur bei belegter, praxisbezogener Vorabprüfung (das Feld `fit_notes` könnte genau diesen Nachweis tragen, wenn es entsprechend geführt wird).
- **Praxis-Kontext:** `specialty` deutet auf Heilberufe. Die Kontaktperson einer Praxis ist eine natürliche Person; die Praxisdaten selbst sind, soweit Einzelpraxis, ebenfalls personenbezogen.

**Required Fix:** Vor jeder Ansprache: (1) dokumentierte Interessenabwägung nach Art. 6 Abs. 1 lit. f, (2) Art.-14-Information, (3) Kanalentscheidung — **Cold E-Mail rechtlich nicht tragfähig ohne Einwilligung; Telefon B2B mit dokumentierter Einzelfallbegründung**, (4) Widerspruchs-/Sperrliste (Art. 21 Abs. 2-3), (5) Löschfrist für nicht kontaktierte Leads.
`NEEDS LAWYER REVIEW` · `NEEDS BUSINESS CONFIRMATION` (Herkunft der 50 Datensätze — Kauf, Scraping, Recherche?)

---

### C-5 — Sicherheits-Header fehlen vollständig

**Evidence:** `public/_headers` (99 Zeilen) setzt ausschließlich `X-Robots-Tag` und `Cache-Control`. `functions/_middleware.ts:196-247` setzt zusätzlich nur `Content-Type`, `Cache-Control`, `X-Robots-Tag`. Kein Treffer für `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors` im gesamten Repository.

**Rechtliche Einordnung:** **Art. 32 Abs. 1 DSGVO** verlangt Maßnahmen nach dem Stand der Technik. Sicherheits-Header gehören seit Jahren zum Stand der Technik (BSI TR-03108, OWASP Secure Headers Project) und sind hier **kostenlos und ohne Funktionsrisiko** nachrüstbar. Besonderes Gewicht, weil die Anwendung unter `/admin` und `/owner` Finanz-, Steuer- und Kundendaten führt und unter `/d/<token>` signaturfähige Dokumente ausliefert.

**Konkretes Risiko ohne `frame-ancestors`:** Die Signaturstrecke unter `/d/<token>` (`src/pages/public/PublicDocumentPortal.tsx`) ist framebar — Clickjacking gegen eine rechtsverbindliche Angebotsannahme.

**Required Fix:** Siehe Abschnitt 15.3. Technisch von mir umsetzbar, geringes Risiko, hoher Effekt.

---

## 3. Risk Matrix

Severity: **P0 CRITICAL** · **P1 HIGH** · **P2 MEDIUM** · **P3 LOW** · **P4 BEST PRACTICE**

| ID | Finding | Area | Legal Basis | Sev | Likelihood | Impact | Evidence / File | Required Fix | Lawyer? | Business? |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Lead-PII (50 Praxen) 34 Tage anonym les-/schreibbar; keine Art.-33-Doku | GDPR / Breach | Art. 32, 33 Abs. 1+5, 34 DSGVO | **P0** | Eingetreten | Hoch | `supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql:14-36` | Vorfallsdoku + Meldeentscheidung | ✅ | ✅ |
| R-02 | Oura-Gesundheitsdaten anonym lesbar (3 Tabellen, `qual=true`, `roles={public}`) | GDPR / Breach | Art. 9, 32, 33 DSGVO | **P0** | Eingetreten | Hoch | `supabase/migrations/20260731122000_case_d_legacy_convergence.sql:41-47` | Vorfallsdoku + Meldeentscheidung | ✅ | ✅ |
| R-03 | Gesundheitsdaten ohne Rechtsgrundlage nach Art. 9 Abs. 2 | GDPR | Art. 9, 5, 35 DSGVO | **P0** | Hoch | Hoch | `supabase/migrations/20260709120000_create_richer_oura_tables.sql`; `supabase/functions/sync-oura/index.ts` | Aus Projekt entfernen oder Art.-9-Grundlage + DSFA | ✅ | ✅ |
| R-04 | Kein AVV-Muster, obwohl Website AVV zusagt | Contracts / GDPR / UWG | Art. 28 Abs. 3 DSGVO; § 5 UWG | **P0** | Hoch | Hoch | fehlt; Zusage `src/pages/LeistungenPage.tsx:204`, `src/pages/DeutschlandPage.tsx:200` | AVV-Muster + TOM-Anlage erstellen | ✅ | ✅ |
| R-05 | Kein Verarbeitungsverzeichnis (Art. 30 Abs. 1 und 2) | GDPR | Art. 30 DSGVO | **P0** | Hoch | Mittel | kein Dokument im Repo | VVT für beide Rollen anlegen | ⚠️ | ✅ |
| R-06 | Keine AGB — dispositives BGB-Recht gilt ungefiltert | Contracts | §§ 280, 631, 640, 650 BGB; § 31 UrhG | **P0** | Hoch | Hoch | keine Route `/agb`, kein Dokument | B2B-AGB + Projektvertrag | ✅ | ✅ |
| R-07 | Gesourcte Leads: keine Art.-14-Info, Frist abgelaufen | GDPR | Art. 14 Abs. 3 DSGVO | **P0** | Hoch | Mittel | `…create_cogniiq_receptionist_leads.sql:3-19`; `…pii_rls.sql:44-60` | Art.-14-Information oder Löschung | ✅ | ✅ |
| R-08 | `outreach_channel='email'` — Cold E-Mail ohne Einwilligung | Marketing / UWG | § 7 Abs. 2 Nr. 2 UWG | **P0** | Hoch | Hoch | `…create_cogniiq_receptionist_leads.sql:17` | Kanal auf Telefon beschränken oder Einwilligung | ✅ | ✅ |
| R-09 | Keine Sicherheits-Header (CSP, HSTS, XCTO, Referrer, Permissions, frame-ancestors) | Security | Art. 32 DSGVO; BSI TR-03108 | **P1** | Hoch | Hoch | `public/_headers`; `functions/_middleware.ts:196-247` | Header-Set ergänzen | ❌ | ❌ |
| R-10 | `/d/<token>`-Signaturstrecke framebar → Clickjacking | Security | Art. 32 DSGVO | **P1** | Mittel | Hoch | fehlendes `frame-ancestors`; `src/pages/public/PublicDocumentPortal.tsx` | `frame-ancestors 'none'` | ❌ | ❌ |
| R-11 | Kontaktformular ohne Art.-13-Hinweis am Erhebungspunkt | GDPR | Art. 12 Abs. 1, 13 Abs. 1+2 DSGVO | **P1** | Hoch | Mittel | `src/components/ContactSection.tsx:390-400` (kein Datenschutz-Link; Demo-Seite hat einen: `KiTelefonassistentDemoPage.tsx:428`) | Hinweis + Link an jedes Formular | ❌ | ❌ |
| R-12 | Spline-3D (`prod.spline.design`) lädt ohne Einwilligung, inkl. `preconnect` | TDDDG / GDPR | § 25 Abs. 1 TDDDG; Art. 6 Abs. 1 lit. a DSGVO | **P1** | Hoch | Mittel | `src/components/hero/DesktopHero.tsx:78-96, 206` | Einwilligung, Self-Hosting oder Entfernen | ⚠️ | ❌ |
| R-13 | Spline in der Datenschutzerklärung nicht genannt | GDPR | Art. 13 Abs. 1 lit. e DSGVO | **P1** | Hoch | Mittel | `src/lib/legal-content.tsx` (Abschnitt 3-8 nennen es nicht) | Aufnehmen | ❌ | ❌ |
| R-14 | Google Maps in der Datenschutzerklärung nicht genannt | GDPR | Art. 13 DSGVO | **P1** | Hoch | Mittel | `src/components/ConsentMapEmbed.tsx` vs. `src/lib/legal-content.tsx` | Aufnehmen | ❌ | ❌ |
| R-15 | Demo-Leads gehen an Webhook-Pfad `/webhook/google-ads` | GDPR / TDDDG | Art. 6, 44 ff. DSGVO; § 25 TDDDG | **P1** | Unklar | Hoch | `src/config/externalEndpoints.ts:4` | Datenfluss klären; ggf. Enhanced Conversions abschalten | ⚠️ | ✅ |
| R-16 | n8n-Instanz: Hoster, Standort, Verschlüsselung, Retention unbekannt | GDPR | Art. 28, 30, 32, 44 DSGVO | **P1** | Hoch | Hoch | `src/config/externalEndpoints.ts:1-5`; `src/lib/legal-content.tsx` Abschnitt 4 | Hoster + AVV + Löschfrist dokumentieren | ⚠️ | ✅ |
| R-17 | Keine Löschfristen / kein Löschkonzept in der Datenschutzerklärung | GDPR | Art. 5 Abs. 1 lit. e, 13 Abs. 2 lit. a DSGVO | **P1** | Hoch | Mittel | `src/lib/legal-content.tsx` — kein Abschnitt zu Speicherdauer | Löschkonzept + Ergänzung | ⚠️ | ✅ |
| R-18 | Keine Subprozessorenliste | GDPR | Art. 28 Abs. 2+4 DSGVO | **P1** | Hoch | Mittel | kein Dokument | Liste + Änderungsprozess | ❌ | ✅ |
| R-19 | Keine TOM als vorlagefähiges Dokument | GDPR | Art. 32, 28 Abs. 3 lit. c DSGVO | **P1** | Hoch | Mittel | technisch beschrieben in `docs/security-and-tenancy.md`, aber kein TOM-Dokument | TOM aus vorhandener Doku ableiten | ⚠️ | ❌ |
| R-20 | Kein Incident-Response-/Breach-Prozess | GDPR | Art. 33, 34 DSGVO | **P1** | Hoch | Mittel | kein Dokument | Prozess + 72-h-Meldekette | ⚠️ | ✅ |
| R-21 | `Access-Control-Allow-Origin: *` auf allen Edge Functions | Security | Art. 32 DSGVO | **P2** | Mittel | Mittel | `admin-provision-client/index.ts:18`, `customer-document-download/index.ts:37`, `public-document-portal/index.ts:30`, `process-accepted-offer/index.ts:34`, `sync-oura/index.ts:9` | Origin-Allowlist (Muster: `clubGatewayShell` nutzt bereits `allowedOrigins`) | ❌ | ❌ |
| R-22 | Kein Rate-Limiting auf öffentlichen Endpunkten (`/d/<token>`, Formulare) | Security | Art. 32 DSGVO | **P2** | Mittel | Mittel | kein Limiter außer `clubGatewayShell.ts:351`; `unconfiguredRateLimiter` in `club-operations-read/index.ts:121` | Limiter aktivieren, Turnstile auf Formulare | ❌ | ❌ |
| R-23 | Audit-Log deckt nur Owner-Finance ab; keine Manipulationssicherung | Admin / GDPR | Art. 5 Abs. 2, 32 Abs. 1 lit. b DSGVO | **P2** | Mittel | Mittel | `supabase/migrations/20260722120000_owner_finance_cockpit.sql:462-476, 771-779` | Schema nach Abschnitt 11.4 erweitern | ❌ | ❌ |
| R-24 | Kundendatenzugriffe durch Admin/Support werden nicht protokolliert | GDPR | Art. 5 Abs. 2, 32 DSGVO | **P2** | Mittel | Mittel | kein Access-Log für `/admin/clients/*` | Zugriffsprotokoll | ❌ | ❌ |
| R-25 | OAuth-Tokens (Oura) im Klartext gespeichert | Security | Art. 32 Abs. 1 lit. a DSGVO | **P2** | Mittel | Hoch | `…create_richer_oura_tables.sql:3-10` | Mit R-03 entfallen lassen | ❌ | ❌ |
| R-26 | Datenschutzerklärung nennt Supabase-Storage/Dokumente nicht konkret | GDPR | Art. 13 DSGVO | **P2** | Hoch | Niedrig | `src/lib/legal-content.tsx` Abschnitt 8 (pauschal) | Präzisieren | ❌ | ❌ |
| R-27 | Club-Operations-Gateway: Verarbeitung von Vereinsmitgliederdaten ohne erkennbaren AVV | GDPR | Art. 28 DSGVO | **P2** | Hoch | Hoch | `supabase/functions/club-operations-read/index.ts`; `src/solutions/club-operations/**` | AVV mit dem Vereinskunden | ✅ | ✅ |
| R-28 | Google-Site-Verification-Tag im `<head>` vor jeder Einwilligung | TDDDG | § 25 TDDDG | **P3** | Niedrig | Niedrig | `index.html:23` | Unkritisch (statisches Meta, kein Request) — nur Dokumentation | ❌ | ❌ |
| R-29 | „Ablehnen" optisch schwächer als „Alle akzeptieren" | TDDDG / GDPR | § 25 Abs. 1 TDDDG; Art. 4 Nr. 11, 7 DSGVO | **P3** | Mittel | Niedrig | `src/components/ConsentBanner.tsx:151-160` | Gleiche visuelle Gewichtung | ⚠️ | ❌ |
| R-30 | Kein Consent-Logging (Nachweis nach Art. 7 Abs. 1) | GDPR | Art. 7 Abs. 1 DSGVO | **P2** | Mittel | Mittel | `src/lib/consent.ts:104-112` — nur `localStorage`, kein serverseitiger Nachweis | Serverseitiges Consent-Log | ⚠️ | ❌ |
| R-31 | Paketname `vite-react-typescript-starter`, keine Lizenzangabe | Copyright | § 31 UrhG; OSS-Lizenzpflichten | **P3** | Niedrig | Niedrig | `package.json:2` | Name + `"license": "UNLICENSED"` setzen | ❌ | ❌ |
| R-32 | Keine OSS-Lizenz-Inventur / kein Attribution-Artefakt | Copyright | MIT/BSD/Apache-Attributionspflichten | **P2** | Hoch | Mittel | 60+ Runtime-Dependencies, kein `THIRD-PARTY-NOTICES` | Inventur + Notices generieren | ⚠️ | ❌ |
| R-33 | Assets (Logo, OG-Bild, Foto, Spline-Szene, Fonts) ohne dokumentierte Rechteherkunft | Copyright | §§ 2, 31 UrhG; § 22 KUG | **P2** | Mittel | Mittel | `public/*.png/svg`, `src/assets/fonts/DejaVu*.ttf`, Spline-Szene `kZDDjO5HuC9GJUM2` | Asset-Register (`ASSETS-REQUIRED.md` ausbauen) | ⚠️ | ✅ |
| R-34 | Keine Accessibility-Erklärung, kein Skip-Link | BFSG / A11y | BFSG (Anwendbarkeit offen); EN 301 549 | **P3** | Niedrig | Niedrig | kein `skip-link` im Repo (verifiziert) | Erst Anwendbarkeit klären (Abschnitt 14) | ⚠️ | ✅ |
| R-35 | Preise ohne USt-Angabe; Zielgruppe B2B nirgends verbindlich erklärt | Consumer / PAngV | § 1 PAngV; §§ 312 ff. BGB | **P2** | Mittel | Mittel | `src/pages/cluster/muenchen/WebdesignKostenMuenchen.tsx:130` u. a.; keine B2B-Klausel | B2B-Klarstellung + „zzgl. USt." | ✅ | ✅ |
| R-36 | Paketname „Website Marktführer" / „Marktführer-Setup" | Marketing / UWG | § 5 Abs. 1 UWG | **P3** | Niedrig | Niedrig | `…WebdesignKostenMuenchen.tsx:32,82`; `…WebdesignKostenRegensburg.tsx:32,82` | Als Paketname erkennbar halten, keine Ergebniszusage | ⚠️ | ❌ |
| R-37 | Art.-50-Ansage als Produktfakt behauptet, im Repo nicht verifizierbar | AI Act / UWG | Art. 50 Abs. 1 VO (EU) 2024/1689; § 5 UWG | **P1** | Mittel | Hoch | `src/pages/KiTelefonassistentPage.tsx:218, 590`; `COPY-GAPS.md` §0 Punkt C1 (offen) | Ansage im Produkt verifizieren oder Aussage entfernen | ⚠️ | ✅ |
| R-38 | Keine AI-Literacy-Maßnahme nach Art. 4 AI Act dokumentiert | AI Act | Art. 4 VO (EU) 2024/1689 | **P2** | Hoch | Mittel | kein Dokument | Schulungskonzept | ⚠️ | ✅ |
| R-39 | Data-Act-Anwendbarkeit auf Kundenportal/Club-Operations ungeprüft | Data Act | Art. 23-31 VO (EU) 2023/2854 | **P2** | Mittel | Mittel | `src/components/app/**`, `src/solutions/club-operations/**` | Applicability-Analyse (Abschnitt 13) | ✅ | ✅ |
| R-40 | Dev-Logging gibt Supabase-URL in der Konsole aus | Security | Art. 32 DSGVO | **P4** | Niedrig | Niedrig | `src/lib/supabase.ts:19-23` (nur `import.meta.env.DEV`) | Akzeptabel; optional entfernen | ❌ | ❌ |

---

## 4. Phase 1 — Application & Third Party Inventory

### 4.1 Application Inventory

| # | Surface | Typ | Route / Ort | Zugriffsschutz | Personenbezug |
|---|---|---|---|---|---|
| A-01 | Öffentliche Marketing-Website | SSG/SPA (Vite + React 18, React Router 7) | `/` und ~85 Routen | öffentlich | IP, Formulardaten |
| A-02 | Blog | SSG | `/blog`, `/blog/:slug` | öffentlich | IP |
| A-03 | Rechtstexte | SSG | `/impressum`, `/datenschutz` | öffentlich | — |
| A-04 | Rechner (Telefon, Automatisierung) | Client-only | `src/components/TelefonRechner.tsx`, `AutomatisierungRechner.tsx` | öffentlich | **keine** — Eingaben verlassen den Browser nicht |
| A-05 | Kontakt-/Demo-/FAQ-Formulare | Client → n8n | `ContactSection.tsx`, `KiTelefonassistentDemoPage.tsx`, `FAQQuestionModal.tsx` | öffentlich | Name, E-Mail, Tel., Firma, Freitext, URL, Referrer |
| A-06 | Kundenportal | SPA (privat) | `/app/**` | Supabase Auth + `ProtectedRoute` + RLS | Konto, Projekte, Dokumente, Rechnungen |
| A-07 | Internes Admin-Workspace | SPA (privat) | `/admin/**` | `PlatformAdminRoute` + `is_platform_admin()` | Kundendaten, Finanzen, Steuern |
| A-08 | Owner-Finance-Cockpit | SPA (privat) | `/owner/**` → `/admin/finance/**` | `PlatformOwnerRoute` + `is_platform_owner()` | Rechnungen, Ausgaben, Steuern, Verträge |
| A-09 | Tokenisiertes Dokumentenportal | SPA (privat) | `/d/:token` | Token-RPC `owner_verify_offer_token` | Angebotsempfänger, Unterschrift, User-Agent |
| A-10 | Auth-Strecke | SPA | `/auth/**`, `/app/login`, `/app/reset-password` | Supabase Auth | E-Mail, Session |
| A-11 | Club-Operations-Modul | SPA + Gateway | `src/solutions/club-operations/**` | Entitlement + signiertes Gateway | **Vereinsmitglieder-Daten (Kundendaten)** |
| A-12 | Oura-Analytics | SPA (privat) | `/admin/oura-analytics` | `PlatformAdminRoute` | **Gesundheitsdaten (Art. 9)** |
| A-13 | Execution-/Task-Dashboard | SPA (privat) | `/admin/tasks`, `ExecutionPage.tsx` | `PlatformAdminRoute` | interne Aufgaben |
| A-14 | Edge Functions (8) | Deno / Supabase | `supabase/functions/**` | s. 4.3 | je nach Funktion |
| A-15 | Pages Function (Edge) | Cloudflare | `functions/_middleware.ts` | öffentlich | keine Speicherung |
| A-16 | Datenbank | PostgreSQL (Supabase, `eu-central-1`) | 45 Migrationen | RLS | alle Kategorien |
| A-17 | Object Storage | Supabase Storage | 3 Buckets, **alle `public=false`** | RLS + signierte URLs | Dokumente, Signaturen |
| A-18 | Automationsumgebung | n8n (self-hosted) | `n8n.cogniiq.co` | **unbekannt** `NEEDS BUSINESS CONFIRMATION` | alle Formulardaten |

**Nicht vorhanden (verifiziert):** kein Payment-System (kein Stripe/PayPal-SDK, keine Checkout-Route), kein CRM-SDK, kein Chat-Widget, kein AI-Provider-SDK (weder OpenAI, Anthropic, Vapi, ElevenLabs noch Twilio), kein Newsletter-System, kein Captcha.

> **Zentrale Erkenntnis für den AI-Act-Teil:** Der verkaufte KI-Telefonassistent und der KI-Chatbot existieren **nicht in diesem Repository**. Die Website bewirbt sie, das Produkt selbst läuft außerhalb (vermutlich n8n + ein externer Voice-Provider). Alle AI-Act-Pflichten hängen damit an einem System, das aus dem Code nicht prüfbar ist. → `NEEDS BUSINESS CONFIRMATION`

### 4.2 Third Party Inventory

| Provider | Zweck | Übertragene Daten | Personenbezug | EU/EWR | Drittland | Einwilligung nötig? | AVV nötig? | In DS-Erkl.? | Fundstelle |
|---|---|---|---|---|---|---|---|---|---|
| **Cloudflare** | Hosting, CDN, Pages Functions | IP, User-Agent, URL, Zeit | Ja | teilweise (Anycast) | Ja (US-Mutter) | Nein (Art. 6 f) | **Ja** | ✅ Abschn. 3 | `wrangler.jsonc`, `functions/_middleware.ts` |
| **Supabase** | Auth, DB, Storage, Edge Functions | Konto, Kunden-, Finanz-, Dokumentdaten, **Gesundheitsdaten** | Ja | `eu-central-1` | Mutter US | Nein (Art. 6 b) | **Ja** | ✅ Abschn. 8 (pauschal) | `src/lib/supabase.ts`, `supabase/**` |
| **n8n (self-hosted)** | Verarbeitung der Formularanfragen | Name, E-Mail, Tel., Firma, Branche, Freitext, URL, Referrer | Ja | **unbekannt** | **unbekannt** | Nein (Art. 6 b/f) | **abhängig vom Hoster** | ✅ Abschn. 4 | `src/config/externalEndpoints.ts:1-5` |
| **Google Ads** | Conversion/Remarketing | Cookie-ID, IP, Seitenaufrufe | Ja | Google Ireland | Ja (US) | **Ja** ✅ umgesetzt | Ja (Controller-Terms) | ✅ Abschn. 6 | `src/lib/consent.ts:30` (`AW-17946397271`) |
| **Google Analytics 4** | Statistik | pseudonyme ID, IP-abgeleiteter Ort, Gerät | Ja | Google Ireland | Ja (US) | **Ja** ✅ umgesetzt | **Ja** | ✅ Abschn. 7 | `src/lib/consent.ts:32` (`G-NDN9J2G5LM`) |
| **Google Maps** | Karten-Embed | IP, User-Agent, Referrer | Ja | Google Ireland | Ja (US) | **Ja** ✅ Zwei-Klick | Ja | ❌ **FEHLT** | `src/components/ConsentMapEmbed.tsx` |
| **Spline** (`prod.spline.design`) | 3D-Hero-Szene | IP, User-Agent, Referrer | Ja | **unbekannt** | wahrscheinlich US | **Ja — NICHT umgesetzt** | Wahrscheinlich | ❌ **FEHLT** | `src/components/hero/DesktopHero.tsx:78-96, 206` |
| **Google Search Console** | Verifikation | keine (statisches Meta-Tag) | Nein | — | — | Nein | Nein | n/a | `index.html:23` |
| **Resend** | Transaktionale E-Mails | Empfängeradresse, Dokumentinhalte | Ja | **unbekannt** | wahrscheinlich US | Nein (Art. 6 b) | **Ja** | ✅ Abschn. 8 | `supabase/functions/send-offer-document-email/email.ts` |
| **Oura Health** | Gesundheitsdaten-Sync | OAuth-Tokens, **Art.-9-Daten** | Ja | Finnland (Mutter) / US-Infra | Möglich | **Art. 9 Abs. 2 lit. a** | Ja | ❌ **FEHLT** | `supabase/functions/sync-oura/index.ts` |
| **Club-Ops-Gateway** (Kundensystem) | Lesezugriff auf Vereinsdaten | Mitglieder, Zahlungen, Rechnungen, Buchungen | Ja (Kundendaten) | **unbekannt** | **unbekannt** | Nein | **Ja (Cogniiq = AV)** | ❌ **FEHLT** | `supabase/functions/club-operations-read/index.ts` |
| **esm.sh / deno.land** | Build-Time-Imports der Edge Functions | keine Nutzerdaten | Nein | US-CDN | — | Nein | Nein | n/a | `sync-oura/index.ts:1-2` |
| **WhatsApp (`wa.me`)** | ausgehender Link | erst beim Klick | Ja (beim Klick) | Meta Ireland | Ja | Link ist einwilligungsfrei | Nein | ❌ fehlt | `src/lib/seo-data.ts` |

**Ausdrücklich nicht gefunden (Negativbefund, geprüft):** Google Tag Manager, Google Fonts (Webfonts werden gar nicht geladen — `index.html:83`), YouTube, Vimeo, Meta Pixel, LinkedIn Insight Tag, TikTok Pixel, Hotjar, Microsoft Clarity, Sentry, PostHog, Make, Calendly, reCAPTCHA, hCaptcha, Turnstile, Ably, Stripe, PayPal, Mailchimp, Brevo, SendGrid, Twilio, Vapi, ElevenLabs, OpenAI, Anthropic, AWS, Hetzner, Netlify (nur als Build-Kompatibilitätspfad, nicht als Produktivhost).

---

## 5. Phase 2 — Data Flow Map

**DF-01 · Kontaktformular**
`ContactSection.tsx` (Name, E-Mail, Firma, Branche, Timeline, Ziel, `page_url`, `referrer`) → `POST https://n8n.cogniiq.co/webhook/contacts` → n8n → **Ziel unbekannt**
Zweck: vorvertragliche Anfragebearbeitung · Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO · Verantwortlicher: Cogniiq · Auftragsverarbeiter: n8n-Hoster `NEEDS BUSINESS CONFIRMATION` · Speicherort/Drittland/Löschfrist: **unbekannt** `NEEDS BUSINESS CONFIRMATION`
*Hinweis:* `referrer` und `page_url` sind zusätzliche Datenpunkte, die die Datenschutzerklärung nicht nennt.

**DF-02 · Demo-Formular**
`KiTelefonassistentDemoPage.tsx` (Name, E-Mail, **Telefon**, Firma, Branche, Unternehmensgröße, Freitext) → `POST https://n8n.cogniiq.co/webhook/google-ads`
Wie DF-01. **Der Pfadname `google-ads` legt nahe, dass Lead-Daten an Google Ads zurückgespielt werden (Offline/Enhanced Conversions).** Wäre das der Fall, läge eine Übermittlung von Klardaten an Google vor — ohne Einwilligung und ohne Erwähnung in der Datenschutzerklärung, die ausdrücklich zusichert: *„Wir übermitteln keine Klardaten wie Namen, E-Mail-Adressen oder Inhalte von Kontaktformularen an Google."* (`src/lib/legal-content.tsx`, Abschnitt 7). → **R-15**, `NEEDS BUSINESS CONFIRMATION` mit hoher Priorität.

**DF-03 · FAQ-Rückfrage** — `FAQQuestionModal.tsx` → `/webhook/faq`. Wie DF-01.

**DF-04 · Consent** — Auswahl → `localStorage['cogniiq_consent_v2']`. Kein Serverkontakt, kein Consent-Nachweis (**R-30**). Löschung: durch Nutzer.

**DF-05 · Google Ads/GA4 (nur nach Einwilligung)** — `consent.ts` injiziert `gtag.js` → Google Ireland → ggf. Google LLC (US). Rechtsgrundlage: Art. 6 Abs. 1 lit. a + § 25 Abs. 1 TDDDG. Drittland: EU-US DPF + SCC. Löschfrist: Google-Property-Einstellung `NEEDS BUSINESS CONFIRMATION`.

**DF-06 · Google Maps** — erst nach Klick (`ConsentMapEmbed.tsx:31`). Rechtsgrundlage: Einwilligung durch Klick. **Nicht in der Datenschutzerklärung (R-14).**

**DF-07 · Spline-3D** — `DesktopHero.tsx` lädt bei Desktop + WebGL automatisch `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode` und setzt zuvor einen `preconnect` (Zeile 93-96). **Ohne jede Einwilligung, ohne Nennung.** IP + User-Agent gehen an Spline. **R-12/R-13.**

**DF-08 · Kundenportal** — Login → Supabase Auth (`eu-central-1`) → RLS-geschützte Tabellen. Art. 6 Abs. 1 lit. b. Löschfrist: Purge-Policy vorhanden (`20260910130000_owner_purge_policy.sql`, `storage-purge-worker`) — **Fristen aber nicht öffentlich dokumentiert (R-17).**

**DF-09 · Angebots-/Signaturstrecke** — Owner erstellt Angebot → Resend-Mail → `/d/<token>` → `public_offer_by_token(p_token, p_user_agent)` protokolliert `event_type` und `user_agent_summary` (max. 200 Zeichen) in `owner_document_access_events` → Annahme erzeugt `simple_electronic_signature` mit Signaturbild in privatem Bucket + SHA-256.
Rechtsgrundlage: Art. 6 Abs. 1 lit. b. **Positiv:** Rohtoken und Signaturbytes werden nie zurückgegeben (`20260723125000_...sql:21-23`). Signaturniveau: einfache elektronische Signatur nach Art. 25 eIDAS — für formfreie B2B-Verträge **ausreichend**; nicht ausreichend, wo § 126 BGB Schriftform verlangt.

**DF-10 · Kundendokumente** — Upload/Download über Edge Functions mit JWT-Verifikation; Bucket `customer-documents` privat, 25 MB, MIME-Allowlist (`20260728121000_customer_documents.sql:320-332`). Sauber.

**DF-11 · Club-Operations** — Browser → `club-operations-read` (Ed25519-signiert, Zeitfenster, Replay-Schutz, Body-Limit, geschlossene Operationsliste) → Kundensystem. **Cogniiq verarbeitet hier Mitgliederdaten eines Kunden → Auftragsverarbeitung, AVV zwingend (R-27).**

**DF-12 · Oura** — Oura Cloud → `sync-oura` (Service Role) → 12 `oura_*`-Tabellen. **Art.-9-Daten. Keine Rechtsgrundlage, keine Löschfrist, Tokens im Klartext.** → C-2.

**DF-13 · Lead-Datenbank** — externer Sourcing-Lauf → `cogniiq_receptionist_leads` (50 Zeilen). Kein Erhebungspfad im Code. → C-4.

**DF-14 · Logging** — `club-operations-read` loggt ausschließlich Reason-Codes und Korrelations-ID, **nie Payload, Header, Token oder URL** (`index.ts:124`). Frontend-Logging beschränkt sich auf vier `console.error`-Stellen ohne PII (verifiziert). **Dieser Bereich ist sauber.**

---

## 6. Phase 3 — DSGVO-Audit

### 6.1 Rollenzuordnung

| Konstellation | Cogniiq | Kunde | Grundlage |
|---|---|---|---|
| Öffentliche Website, Formulare, Analytics | **Verantwortlicher** | — | Art. 4 Nr. 7 |
| Kundenportal `/app` (eigene Kundenbeziehung) | **Verantwortlicher** | — | Art. 4 Nr. 7 |
| Betrieb von Kundensystemen (Website, Chatbot, Telefonassistent, Automationen) | **Auftragsverarbeiter** | Verantwortlicher | Art. 4 Nr. 8, Art. 28 |
| Club-Operations (Mitgliederdaten) | **Auftragsverarbeiter** | Verein = Verantwortlicher | Art. 28 |
| Lead-Datenbank / Kaltakquise | **Verantwortlicher** | — | Art. 4 Nr. 7 |
| Oura | **Verantwortlicher** (oder außerhalb der DSGVO) | — | Art. 2 Abs. 2 lit. c offen |
| GA4 / Google Ads | **gemeinsame Verantwortlichkeit** für die Erhebung/Übermittlung — herrschende Aufsichtspraxis; Google stellt Controller-Controller-Terms bereit | Google | Art. 26 `NEEDS LAWYER REVIEW` |

### 6.2 Artikelweise Bewertung

| Artikel | Befund | Status |
|---|---|---|
| **Art. 5 Abs. 1 lit. a** Rechtmäßigkeit/Transparenz | Datenschutzerklärung solide, aber unvollständig (Spline, Maps, Oura, Club-Ops, `referrer`/`page_url`) | ⚠️ |
| **Art. 5 Abs. 1 lit. b** Zweckbindung | Gesundheitsdaten in Geschäftsdatenbank verletzt sie | ❌ |
| **Art. 5 Abs. 1 lit. c** Datenminimierung | Rechner verarbeiten bewusst nichts serverseitig; Analytics-Events tragen nachweislich keine PII (`consent.ts:339-379`) | ✅ **vorbildlich** |
| **Art. 5 Abs. 1 lit. e** Speicherbegrenzung | Purge-Worker existiert, Fristen nicht definiert/publiziert | ⚠️ |
| **Art. 5 Abs. 2** Rechenschaftspflicht | Kein VVT, keine TOM, kein Consent-Log, kein Breach-Register | ❌ |
| **Art. 6** Rechtsgrundlagen | Für Website-Verarbeitungen benannt und plausibel; für Leads und Oura fehlend | ⚠️ |
| **Art. 9** Besondere Kategorien | Oura-Gesundheitsdaten ohne Ausnahmetatbestand | ❌ **P0** |
| **Art. 12** Transparenz/Form | Texte klar, verständlich, unentgeltlich, gut auffindbar (Footer) | ✅ |
| **Art. 13** Informationspflicht | Kein Hinweis am Kontaktformular (R-11); Empfängerkategorien unvollständig; Speicherdauer fehlt | ❌ |
| **Art. 14** Nicht beim Betroffenen erhoben | 50 Leads — Frist abgelaufen | ❌ **P0** |
| **Art. 15-22** Betroffenenrechte | In der Erklärung korrekt aufgezählt; **kein technischer Prozess** (kein Export, keine Löschstrecke, keine Auskunfts-Vorlage) | ⚠️ |
| **Art. 22** Automatisierte Entscheidung | Keine gefunden (Abschnitt 10) | ✅ |
| **Art. 24** Verantwortlichkeit | Technisch gut, dokumentarisch nicht belegt | ⚠️ |
| **Art. 25** Privacy by Design/Default | Consent-Default „denied", Maps-Zwei-Klick, keine Webfonts, private Buckets, geschlossene Event-Liste | ✅ **stark** — Ausnahme: Spline |
| **Art. 28** Auftragsverarbeitung | Kein AVV-Muster, keine Subprozessorenliste | ❌ **P0** |
| **Art. 30** Verzeichnis | Fehlt; Ausnahme Abs. 5 greift nicht | ❌ **P0** |
| **Art. 32** Sicherheit | RLS, Tenant-Isolation, signiertes Gateway, private Buckets stark — **aber** keine Sicherheits-Header, CORS `*`, kein Rate-Limiting, Klartext-Tokens | ⚠️ |
| **Art. 33/34** Meldepflicht | Zwei eingetretene Verletzungen ohne Doku/Meldeentscheidung | ❌ **P0** |
| **Art. 35** DSFA | Für Oura zu prüfen; sonst wohl nicht erforderlich | ⚠️ |
| **Art. 44 ff.** Drittland | Google: DPF + SCC in der Erklärung benannt ✅; Cloudflare, Resend, Spline, Oura: **kein TIA, keine SCC-Dokumentation** | ⚠️ |

### 6.3 Besonders geprüft

- **PII in Logs:** Verifiziert sauber. `club-operations-read` loggt bewusst nur Reason-Codes (`index.ts:124`), das Frontend hat vier `console.error`-Stellen ohne Personenbezug. **Keine Secrets in Logs.**
- **Secrets:** Kein hartkodiertes Secret im Repository (vollständiger Regex-Scan auf `eyJ…`, `sk-…`, `re_…`, Service-Role-Literale: **0 Treffer**). `.env` ist in `.gitignore:23`. **Vorbildlich.**
- **Service-Role-Key:** Ausschließlich in `Deno.env` der Edge Functions; explizit dokumentiert, dass er nie zum Browser gelangt (`public-document-portal/index.ts:11`).
- **Testdaten vs. Produktionsdaten:** Umfangreiche Fixtures (`src/solutions/club-operations/fixtures/**`) sind synthetisch; Staging-Skripte (`scripts/staging/**`) arbeiten mit eigenen Fixtures. **Kein Hinweis auf Produktionsdaten in Tests.**
- **Backups:** Verifikationsskripte vorhanden (`.github/scripts/verify-supabase-backups.mjs`, `verify-supabase-backup-encryption.mjs`, `verify-supabase-restore-point.mjs`). **Backup-Retention als Löschkonzept-Bestandteil aber nicht dokumentiert.**
- **Admin-/Support-Zugriffe:** Kein Zugriffsprotokoll auf Kundendaten (R-24).

---

## 7. Phase 4 — Cookie / Tracking / TDDDG

### 7.1 Was vor der Einwilligung geladen wird

| Technologie | Vor Consent? | Bewertung |
|---|---|---|
| Google Ads (`AW-17946397271`) | **Nein** | ✅ konform |
| GA4 (`G-NDN9J2G5LM`) | **Nein** | ✅ konform |
| `gtag.js`-Bibliothek | **Nein** — wird nur bei mindestens einer Erteilung injiziert (`consent.ts:148-168`) | ✅ |
| Cookieless Pings (Advanced Consent Mode) | **Nein** — bewusst Basic (`consent.ts:13-16`) | ✅ **strenger als üblich** |
| Google Fonts | **Nie** — Systemschriften (`index.html:83`) | ✅ |
| Google Maps | **Nein** — Zwei-Klick | ✅ |
| **Spline 3D** | **JA — automatisch, inkl. `preconnect`** | ❌ **R-12** |
| `localStorage` (Consent, Theme) | Ja | ✅ § 25 Abs. 2 Nr. 2 TDDDG |
| Public-Theme-Inline-Skript | Ja | ✅ kein Speicherzugriff, kein Request |
| Google-Site-Verification-Meta | Ja | ✅ statisches Meta, kein Request |

### 7.2 Einwilligungsmechanik

| Anforderung | Befund | Fundstelle |
|---|---|---|
| Default „denied" | ✅ | `consent.ts:211-218` |
| Granular (Marketing/Analytics getrennt, in beliebiger Reihenfolge) | ✅ | `consent.ts:270-290` |
| „Ablehnen" auf erster Ebene | ✅ | `ConsentBanner.tsx:153` |
| Gleiche visuelle Gewichtung | ⚠️ gleiche Größe (`h-11 px-5`), aber Outline vs. gefüllt | `ConsentBanner.tsx:151-160` — **R-29** |
| Widerruf jederzeit | ✅ Footer „Cookie-Einstellungen" | `Footer.tsx:396`, `consent.ts:311-317` |
| Cookie-Löschung beim Widerruf | ✅ inkl. Alt-Stream-Cookies | `consent.ts:175-200` |
| Link zur Datenschutzerklärung im Banner | ✅ | `ConsentBanner.tsx:135` |
| Kein Nudging / kein Dark Pattern | ✅ keine Cookie-Wall, Seite ohne Einwilligung voll nutzbar | `legal-content.tsx` Abschn. 7 |
| **Consent-Nachweis (Art. 7 Abs. 1)** | ❌ nur `localStorage`, kein serverseitiges Log | **R-30** |
| Re-Consent nach Ablauf | ❌ kein Verfallsdatum (`ts` wird gespeichert, aber nie geprüft) | `consent.ts:104-112` — P3 |

**Gesamtbewertung Cookie/TDDDG: überdurchschnittlich gut.** Die einzige echte § 25 Abs. 1 TDDDG-Lücke ist Spline. Das 3D-Modell ist dekorativ und damit **nicht „unbedingt erforderlich"** i. S. v. § 25 Abs. 2 Nr. 2 TDDDG. Streng genommen ist der Abruf einer Ressource von einem Drittserver kein Speicher-/Auslesevorgang auf dem Endgerät — aber die dabei zwingend übermittelte IP-Adresse ist eine Verarbeitung nach Art. 6 DSGVO, für die keine tragfähige Grundlage benannt ist. Die saubere Lösung ist das Self-Hosting der Szene (löst das Rechtsproblem **und** spart ~2 MB Drittanbieter-Payload).

---

## 8. Phase 5 — Website Legal Audit

### 8.1 Impressum (§ 5 DDG)

| Pflichtangabe | Status | Fundstelle |
|---|---|---|
| Name + Rechtsform | ✅ „Cogniiq, Inhaber: Lazar Popovic" | `legal-content.tsx:31-33` |
| Anschrift (ladungsfähig) | ✅ Am Main 3, 95444 Bayreuth | `legal-content.tsx:35-39` |
| E-Mail | ✅ | `legal-content.tsx:49` |
| Telefon | ✅ | `legal-content.tsx:47` |
| USt-IdNr. § 27a UStG | ✅ DE460292419 | `legal-content.tsx:53` |
| Handelsregister | ✅ **zu Recht nicht** — Einzelunternehmen ohne HR-Eintrag `NEEDS BUSINESS CONFIRMATION` | — |
| § 18 Abs. 2 MStV | ✅ vorhanden (wegen Blog sachgerecht) | `legal-content.tsx:56-62` |
| **§ 5 DDG statt § 5 TMG** | ✅ korrekt aktualisiert | `legal-content.tsx:29` |
| **Kein EU-ODR-Link** | ✅ korrekt — Plattform 2025 eingestellt; **repo-weit 0 Treffer verifiziert** | — |
| § 36 VSBG | ✅ neutrale Nichtteilnahmeerklärung; bei ≤ 10 Beschäftigten ohnehin keine Pflicht nach § 36 Abs. 3 VSBG | `legal-content.tsx:64-68` |
| Wirtschafts-ID § 139c AO | ⚠️ derzeit keine Angabepflicht nach § 5 DDG | — |
| Berufshaftpflicht | n/a (kein reglementierter Beruf) | — |

**Bewertung: Das Impressum ist rechtlich sauber.** Einer der wenigen Bereiche ohne Handlungsbedarf.

### 8.2 Datenschutzerklärung — Soll/Ist-Abgleich

**Liste A — Verarbeitung findet statt, fehlt aber in der Datenschutzerklärung:**

| # | Verarbeitung | Evidence |
|---|---|---|
| A-1 | **Spline 3D** — IP an `prod.spline.design` ohne Einwilligung | `DesktopHero.tsx:78-96, 206` |
| A-2 | **Google Maps** — Zwei-Klick-Embed | `ConsentMapEmbed.tsx:23-33` |
| A-3 | **Oura** — Gesundheitsdaten | `sync-oura/index.ts` |
| A-4 | **Club-Operations-Gateway** — Kundendaten Dritter | `club-operations-read/index.ts` |
| A-5 | **Lead-Datenbank** — gesourcte Kontaktdaten | `cogniiq_receptionist_leads` |
| A-6 | `referrer` + `page_url` werden mit jeder Formularübermittlung gesendet | `ContactSection.tsx:397-398` |
| A-7 | **Speicherdauer/Löschfristen** durchgängig nicht genannt | Art. 13 Abs. 2 lit. a |
| A-8 | **Empfängerkategorien** nur teilweise (Art. 13 Abs. 1 lit. e) | — |
| A-9 | User-Agent-Protokollierung in der Signaturstrecke | `20260723125000_...sql:370-371` |
| A-10 | Drittlandgarantien für Cloudflare, Resend, Spline, Oura | Art. 13 Abs. 1 lit. f |

**Liste B — In der Datenschutzerklärung genannt, findet aber (so) nicht statt:**

| # | Aussage | Befund |
|---|---|---|
| B-1 | „Schlüssel `cogniiq_consent_v2`" | ✅ korrekt — aber `cogniiq_consent_v1` (Legacy, wird gelesen) ist nicht genannt (`consent.ts:39`) |
| B-2 | „Wir übermitteln keine Klardaten … an Google" | ⚠️ **möglicherweise unzutreffend** wegen `/webhook/google-ads` → **R-15** |
| B-3 | `_ga_NDN9J2G5LM` | ✅ korrekt; Legacy-Cookie `_ga_K7BS3LKT6H` wird bereinigt, aber nicht erwähnt (`consent.ts:196`) |
| B-4 | „Angebote … rechtsgültig signiert" | ⚠️ zutreffend für formfreie Verträge; „rechtsgültig" ist bei einfacher elektronischer Signatur eine Vereinfachung |

**Fehlender Pflichtabschnitt:** Keine Angabe zur **Nichtbenennung eines Datenschutzbeauftragten**. Bei einem Einzelunternehmen ist nach § 38 Abs. 1 BDSG regelmäßig keiner zu benennen (< 20 Personen mit automatisierter Verarbeitung) — **aber** § 38 Abs. 1 S. 2 BDSG i. V. m. Art. 37 Abs. 1 lit. b/c DSGVO ist wegen der Verarbeitung besonderer Kategorien (Oura) und der Lead-Datenbank **zu prüfen**. `NEEDS LAWYER REVIEW`

### 8.3 Verbraucherschlichtung

✅ Korrekt. Formulierung neutral, EU-ODR-Verweis zutreffend entfernt (die Plattform wurde zum 20.07.2025 eingestellt; Verweise darauf sind seither selbst irreführend). **Repo-weit keine veralteten OS-Links.**

---

## 9. Phase 6 — Marketing & UWG

### 9.1 Vorgeschichte

Das Repository enthält mit `HONESTY-AUDIT.md` ein bereits durchgeführtes, ungewöhnlich gründliches Ehrlichkeitsaudit (~550 Einzeltreffer, 95+ Dateien). **Verifiziert behoben:**

| Ehemaliger Befund | Heutiger Status |
|---|---|
| Fabrizierter Knappheitszähler („N Plätze frei", pseudozufällig) | ✅ `src/hooks/useAvailability.ts` existiert weder lokal noch auf `origin/main` — **entfernt** |
| Review-Lenkung „Positives Feedback wird in Richtung Google-Bewertung gelenkt" | ✅ repo-weit **0 Treffer** — entfernt. Das war der schärfste Befund: Review-Gating verstößt gegen § 5 Abs. 1 Nr. 3 UWG und Nr. 23b der Schwarzen Liste (Anh. zu § 3 Abs. 3 UWG) |
| Erfundene Kundencases mit realen Straßennamen | ✅ generalisiert |
| Fabrizierte Studienzitate (Harvard Business Review u. a.) | ✅ entfernt |
| Benannte Kundenstimme ohne Einwilligung | ✅ Komponente enthält bewusst keine Testimonial-Konstante (`TestimonialBlock.tsx:12-22`) |

**Das ist ein außergewöhnlich guter Ausgangspunkt.** Die verbleibenden UWG-Befunde sind vergleichsweise geringfügig.

### 9.2 Verbleibende Befunde

| Befund | Bewertung | Fundstelle |
|---|---|---|
| **„DSGVO-konform"** | ✅ **kein Verstoß** — der Begriff erscheint nur als *Frage* in FAQs, und die Antwort weist ihn ausdrücklich zurück: *„Diesen Satz stellen wir uns nicht selbst aus — konform ist eine Verarbeitung, kein Produkt."* Das ist rechtlich mustergültig | `LeistungenPage.tsx:203-204`, `DeutschlandPage.tsx:200-201` |
| **Aber:** dieselbe Antwort verspricht „liefern wir … Auftragsverarbeitungsvertrag" | ❌ § 5 UWG, solange kein AVV existiert | `LeistungenPage.tsx:204` → **R-04** |
| „Website Marktführer" / „Marktführer-Setup" | ⚠️ Paketname, keine Selbstberühmung. Risiko, dass er als Ergebniszusage gelesen wird | `WebdesignKostenMuenchen.tsx:32,82`; `…Regensburg.tsx:32,82` → **R-36** |
| „rund um die Uhr" / „24/7" | ✅ bezieht sich auf Nachfrage-/Erreichbarkeitsbeschreibung, nicht auf eine Verfügbarkeitsgarantie | `WebdesignArztBayreuth.tsx:117` u. a. |
| „garantiert" | ✅ nur **negierend** verwendet („sie garantiert kein Ergebnis", „Sie erwarten garantierte Google-Positionen" als Ausschlusskriterium) | `WebdesignHub.tsx:109, 725` |
| „100 %" | ✅ nur als Eingabeparameter in Rechnern, ausführlich erläutert | `TelefonRechner.tsx:744` |
| Art.-50-Ansage als Produktfakt | ❌ **R-37** — die Aussage *„Der Assistent sagt im ersten Satz, dass er ein KI-System ist … abschalten lässt sich das nicht"* ist eine harte Tatsachenbehauptung über ein Produkt, das nicht in diesem Repository liegt. `COPY-GAPS.md` §0 führt sie unter „C1" **als noch offene Inhaberentscheidung** | `KiTelefonassistentPage.tsx:218` |
| Preise ohne USt-Hinweis | ⚠️ **R-35** — relevant nur bei Verbraucheransprache | `WebdesignKostenMuenchen.tsx:130` |
| Testimonials / Kundenlogos / Trust-Badges / Zertifizierungen | ✅ **keine vorhanden** — repo-weit verifiziert. Keine Siegel, keine Partnerlogos, keine erfundenen Bewertungen | — |
| TrustStrip-Aussagen | ✅ bewusst als Arbeitsweise formuliert, mit explizitem Verzicht auf Hosting-/Serverstandort-/„DSGVO-konform"-Aussagen | `TrustStrip.tsx:12-18` |
| Vergleichende Werbung | ✅ bewusst keine Wettbewerbernennung (§ 6 UWG) | `KiTelefonassistentPage.tsx:1236` |

---

## 10. Phase 7 — Urheberrecht / Marken / Assets

### 10.1 Asset-Inventar

| Asset | Ort | Herkunft | Lizenz | Bewertung |
|---|---|---|---|---|
| `logo.png`, `logo.svg`, `favicon.png`, `apple-touch-icon.png`, `iq-mask.svg` | `public/` | generiert via `scripts/generate-brand-assets.mjs` | Eigenentwicklung anzunehmen | ✅ `NEEDS BUSINESS CONFIRMATION` (Marke angemeldet?) |
| `og-image.png` | `public/` | unbekannt | **unbekannt** | ⚠️ **R-33** |
| `Lazar_Popovic.png` | `public/` | Personenfoto | Recht am eigenen Bild (§ 22 KUG) | ✅ eigene Person, unkritisch |
| `DejaVuSans.ttf`, `DejaVuSans-Bold.ttf` | `src/assets/fonts/` | DejaVu-Projekt | **DejaVu Fonts License** (Bitstream Vera-basiert, frei, kommerziell nutzbar) — **verlangt Beibehaltung des Copyright-Vermerks** | ⚠️ Lizenztext nicht im Repo → **R-32** |
| Spline-Szene `kZDDjO5HuC9GJUM2` | `prod.spline.design` | Spline-Plattform | **unbekannt** — Eigenerstellung oder Community-Szene? | ⚠️ **R-33** `NEEDS BUSINESS CONFIRMATION` |
| Icons | `lucide-react`, `@heroicons/react`, `@radix-ui/react-icons` | npm | **ISC** / **MIT** | ✅ |
| shadcn/ui-Komponenten (`src/components/ui/**`, 50+ Dateien) | kopierter Code | shadcn/ui | **MIT** | ⚠️ Attribution fehlt → **R-32** |

### 10.2 Open-Source-Lizenzen

Rund 60 Runtime- und 28 Dev-Dependencies. Stichprobe der Hauptabhängigkeiten:

| Paket | Lizenz | Copyleft-Risiko |
|---|---|---|
| react, react-dom, react-router-dom, vite, typescript, tailwindcss, zod, date-fns, clsx, framer-motion, recharts, @radix-ui/* | **MIT** | keines |
| lucide-react | **ISC** | keines |
| @supabase/supabase-js | **MIT** | keines |
| @react-pdf/renderer | **MIT** | keines |
| `@splinetool/runtime`, `@splinetool/react-spline` | **zu prüfen** | ⚠️ proprietär? |

**Befund: Kein AGPL-, GPL- oder SSPL-Paket in den direkten Abhängigkeiten gefunden.** Das transitive Closure wurde **nicht** vollständig geprüft — `package-lock.json` umfasst 385 KB.

> **Wichtig für das Geschäftsmodell:** Cogniiq liefert Kundenprojekte auf dieser Codebasis aus. Ein einziges AGPL-Paket im Bundle könnte die Offenlegung des Kundenprojekts auslösen. Eine automatisierte Lizenzprüfung (`license-checker`, `oss-review-toolkit`) gehört in die CI — **nicht als Compliance-Übung, sondern als Schutz des Auslieferungsmodells.** → **R-32**

**`package.json:2`** trägt noch `"name": "vite-react-typescript-starter"` und keine `license`-Angabe. Ohne Lizenzangabe gilt bei einem privaten Repo zwar ohnehin das gesetzliche Urheberrecht, aber `"license": "UNLICENSED"` ist die saubere Aussage. → **R-31**

---

## 11. Phase 8 — AI Act (VO (EU) 2024/1689)

### 11.1 Zeitliche Anwendbarkeit zum 22.09.2026

| Regelung | Geltung seit |
|---|---|
| Art. 1-5 (Verbotene Praktiken, AI Literacy) | **02.02.2025** — in Kraft |
| Kap. V (GPAI), Governance, Sanktionen | **02.08.2025** — in Kraft |
| **Art. 50 (Transparenzpflichten)** | **02.08.2026** — **in Kraft** |
| Hochrisiko nach Anhang III | 02.08.2026 |
| Hochrisiko nach Art. 6 Abs. 1 (Produktsicherheit) | 02.08.2027 |

**Art. 50 ist zum Prüfstichtag seit sieben Wochen anwendbar.** Das ist die zentrale Pflicht für Cogniiq.

### 11.2 Rollenanalyse

| System | AI-System (Art. 3 Nr. 1)? | Cogniiq-Rolle | Kunden-Rolle |
|---|---|---|---|
| KI-Telefonassistent | Ja | **Deployer** beim Betrieb für Kunden; **Provider**, soweit unter eigenem Namen bereitgestellt (Art. 25 Abs. 1 lit. b/c) | Deployer |
| KI-Chatbot | Ja | wie oben | Deployer |
| n8n-Automationen | nur soweit KI-Komponenten eingebunden | Deployer | Deployer |
| Website, Portal, Admin | **Nein** — deterministische Software | n/a | n/a |
| Rechner | **Nein** — feste Formeln | n/a | n/a |

> **Kritisch:** Baut Cogniiq den Assistenten aus Fremdmodellen zusammen, konfiguriert ihn, vergibt ihm eine Stimme und liefert ihn **unter Cogniiq-Marke** aus, ist Cogniiq nach **Art. 25 Abs. 1 lit. c** sehr wahrscheinlich **Provider** und nicht bloß Deployer. Das ist die folgenreichste Einordnung des gesamten AI-Act-Teils. `NEEDS LAWYER REVIEW`

### 11.3 Pflichtenprüfung

| Vorschrift | Befund |
|---|---|
| **Art. 4 — AI Literacy** | Gilt für Provider **und** Deployer, seit 02.02.2025. Keine Schulungs-/Kompetenzdokumentation im Repository. → **R-38** |
| **Art. 5 — Verbotene Praktiken** | Kein Social Scoring, keine Emotionserkennung am Arbeitsplatz, keine biometrische Kategorisierung, kein Predictive Policing, keine unterschwellige Beeinflussung erkennbar. ⚠️ Zu prüfen: Erkennt der Telefonassistent Emotionen? Art. 5 Abs. 1 lit. f betrifft nur Arbeitsplatz/Bildung — Kundenservice ist **nicht** erfasst, fällt aber unter **Art. 50 Abs. 3** (Offenlegungspflicht). `NEEDS BUSINESS CONFIRMATION` |
| **Art. 50 Abs. 1 — Interaktion mit KI offenlegen** | Die Website behauptet die Umsetzung (`KiTelefonassistentPage.tsx:218, 590`). **Im Repository nicht verifizierbar**, und `COPY-GAPS.md` führt genau diesen Punkt als offene Inhaberfrage „C1". → **R-37** |
| **Art. 50 Abs. 2 — Kennzeichnung synthetischer Inhalte (maschinenlesbar)** | Betrifft KI-generierte Sprachausgabe. Umsetzung nicht prüfbar. `NEEDS BUSINESS CONFIRMATION` |
| **Art. 50 Abs. 4 — KI-generierte Texte** | Relevant für Blog-Inhalte, **soweit** sie KI-generiert und über Angelegenheiten öffentlichen Interesses informieren. `src/lib/blog-data.ts` enthält Fachbeiträge — die Ausnahme „menschliche Überprüfung mit redaktioneller Verantwortung" greift, und `src/components/RedaktionelleVerantwortung.tsx` existiert bereits. ✅ wahrscheinlich erfüllt |
| **Anhang III — Hochrisiko** | Keine der beschriebenen Anwendungen fällt darunter, **solange** der Assistent keine Bewerbervorauswahl (Nr. 4), keine Kreditwürdigkeitsprüfung (Nr. 5b) und keine Triage im Gesundheitsbereich (Nr. 5a) vornimmt. `HONESTY-AUDIT.md` dokumentiert, dass eine frühere **„Triage"-Fähigkeitsbehauptung gestrichen** wurde — das war zugleich die Vermeidung einer Hochrisiko-Einstufung. ✅ |

### 11.4 Die entscheidende Frage: Wann erfährt der Anrufer von der KI?

Die Website formuliert die richtige Antwort — **„im ersten Satz"** (`KiTelefonassistentPage.tsx:590`: *„Guten Tag, hier ist der digitale Empfang. Ich bin ein KI-Assistent — wie kann ich helfen?"*). Art. 50 Abs. 1 verlangt genau das: Information **rechtzeitig, spätestens bei der ersten Interaktion**. Eine Offenlegung erst am Gesprächsende wäre nicht ausreichend.

**Das ist nicht aus dem Code verifizierbar.** Die Voice-Skripte liegen außerhalb dieses Repositories. → `NEEDS BUSINESS CONFIRMATION` mit hoher Priorität, denn die Website behauptet die Umsetzung als harte Tatsache.

---

## 12. Phase 9 — Automatisierte Entscheidungen (Art. 22 DSGVO)

**Systematische Suche durchgeführt** nach: Refund, Kündigung, Storno, Sperrung, Preisänderung, Vertragsänderung, Rechnung, Bonität, Bewerberbewertung, medizinische Entscheidung, Nutzerklassifizierung.

| Aktion | Auslöser | Automatisierung | Risiko |
|---|---|---|---|
| Rechnungserstellung aus angenommenem Angebot | Kundenannahme unter `/d/<token>` | **Vollautomatisch** (`process-accepted-offer/index.ts`, `20260723126000_owner_automation_worker.sql`) | **LOW** — der Kunde löst sie durch eigene Willenserklärung aus; Vertragserfüllung, keine „Entscheidung über" den Kunden |
| Angebots-E-Mail-Versand | Owner-Aktion | Halbautomatisch | **LOW** |
| Storage-Purge | Zeitgesteuert nach Purge-Policy | **Vollautomatisch** (`storage-purge-worker`) | **MEDIUM** — löscht Daten; Fehlkonfiguration wäre ein Verfügbarkeits-/Integritätsrisiko nach Art. 32, keine Art.-22-Entscheidung |
| Force-Delete (Kunde/Rechnung) | Owner-Aktion | Manuell mit Bestätigung (`forceDelete.test.tsx`) | **LOW** |
| `fit_score` in der Lead-Datenbank | externer Sourcing-Lauf | unbekannt | **MEDIUM** — eine automatisierte Bewertung natürlicher Personen. Art. 22 greift nur bei rechtlicher Wirkung/ähnlich erheblicher Beeinträchtigung; „wird angerufen oder nicht" erreicht diese Schwelle regelmäßig **nicht**. Profiling i. S. v. Art. 4 Nr. 4 liegt aber vor → Informationspflicht nach Art. 14 Abs. 2 lit. g. `NEEDS BUSINESS CONFIRMATION` |
| Terminbuchung durch KI-Assistent | Anrufer | außerhalb des Repos | **MEDIUM** `NEEDS BUSINESS CONFIRMATION` |

**Ergebnis: Kein Art.-22-Verstoß gefunden.** Es gibt keine automatisierte Ablehnung, Sperrung, Bonitäts- oder Bewerberentscheidung.

**Empfehlung für die Zukunft:** Sobald der Telefonassistent bei Kunden verbindliche Termine vergibt, Stornierungen vornimmt oder Anrufer priorisiert, gilt das Muster
`KI-Vorschlag → menschliche Bestätigung → Ausführung`
für alles mit wirtschaftlicher oder gesundheitlicher Konsequenz. In Arztpraxen ist das nicht nur Art.-22-Vorsorge, sondern Haftungsvorsorge.

---

## 13. Phase 10 — Admin Dashboard: Security & Accountability

### 13.1 Zugriffskontrolle

| Prüfpunkt | Befund | Bewertung |
|---|---|---|
| Authentifizierung | Supabase Auth, JWT, `persistSession`, `autoRefreshToken` | ✅ |
| Autorisierung serverseitig | `is_platform_admin()` / `is_platform_owner()` als `security definer` mit `set search_path = public`, liest `profiles.platform_role` — **vertraut keinen Frontend-Rollen** | ✅ **korrekt** (`20260710120000_...sql:141-160`) |
| Rollen-Eskalation | `guard_profile_protected_columns()` verhindert Selbstbeförderung: `platform_role`, `email`, `id` sind clientseitig nicht änderbar | ✅ **stark** (`20260710133000_...sql:52-80`) |
| RBAC | Drei Ebenen: `customer`, `cogniiq_admin`, `cogniiq_owner` | ✅ |
| RLS | Auf allen geprüften Tabellen aktiv; `anon` hat nach der Konvergenz-Migration **null Grants** | ✅ |
| Tenant-Isolation | `is_organization_member(target_organization_id)` | ✅ |
| IDOR | Dokumentzugriff läuft über Edge Functions mit JWT-Verifikation, nicht über rohe IDs | ✅ |
| CSRF | Token im `Authorization`-Header, nicht in Cookies → strukturell CSRF-resistent | ✅ |
| XSS | React escaped per Default. **Ausnahme:** `functions/_middleware.ts:225-247` ersetzt `<title>`/Meta per String-Interpolation — die Werte stammen aus einer hartkodierten Server-Konstante, **nicht** aus Nutzereingaben | ✅ unkritisch |
| SQL Injection | Ausschließlich parametrisierte RPCs und der Supabase-Client; `format(%I)` mit Identifier-Quoting in den DO-Blöcken | ✅ |
| Webhook-Verifikation | `storage-purge-worker`: konstantzeitiger `WORKER_SECRET`-Vergleich (`index.ts:69-71`); Club-Gateway: Ed25519 + Zeitfenster + Replay-Schutz | ✅ **sehr gut** |
| Rate-Limiting | `unconfiguredRateLimiter` in `club-operations-read/index.ts:121`; sonst keins | ❌ **R-22** |
| CORS | `*` auf fünf Edge Functions | ⚠️ **R-21** |
| Passwort-Policy / MFA | Supabase-seitig, im Repo nicht konfiguriert | `NEEDS BUSINESS CONFIRMATION` |
| Reset-Flow | `src/pages/app/ResetPasswordPage.tsx`, `authConfirmation.ts` mit Timeout-Schutz | ✅ |
| Service-Role-Key | Nur `Deno.env`, nie im Bundle | ✅ |
| Storage-Permissions | Alle drei Buckets `public=false`, MIME-Allowlist, 25-MB-Limit | ✅ |

**Gesamtbewertung: Die Zugriffsarchitektur ist stark.** Das ist kein Gefälligkeitsurteil — die Kombination aus `security definer`-Predicates mit gepinntem `search_path`, spaltenweiser Grant-Reduktion (`20260722120000_...sql:781-785`) und einem signierten, replay-geschützten Gateway ist deutlich besser als das, was man in dieser Unternehmensgröße üblicherweise sieht.

### 13.2 Sensible Aktionen — Nachvollziehbarkeit

| Aktion | Wer darf? | Bestätigung? | Serverseitig autorisiert? | Geloggt? | WHO/WHAT/WHEN/BEFORE/AFTER? |
|---|---|---|---|---|---|
| Rechnung erstellen/stornieren | Owner | ✅ | ✅ RPC + RLS | ✅ `owner_audit_log` | ✅ `before_summary`/`after_summary` |
| Force-Delete Kunde | Owner | ✅ Dialog | ✅ | ✅ | ✅ |
| Angebot archivieren | Owner | ✅ | ✅ | ✅ | ✅ |
| Kunde provisionieren | Admin | ⚠️ Wizard | ✅ RPC prüft erneut `is_platform_admin()` | ❌ **nicht in `owner_audit_log`** | ❌ |
| Solution-Entitlement ändern | Admin | ⚠️ | ✅ | ❌ | ❌ |
| Einladung versenden/widerrufen | Admin | ⚠️ | ✅ | ❌ | ❌ |
| Kundendokument lesen/herunterladen | Admin/Kunde | n/a | ✅ Edge Function | ⚠️ nur `owner_document_access_events` für `/d`-Portal | ⚠️ |
| Kundendaten einsehen (`/admin/clients/*`) | Admin | n/a | ✅ RLS | ❌ **kein Zugriffsprotokoll** | ❌ **R-24** |
| Storage-Purge ausführen | Worker | n/a | ✅ `WORKER_SECRET` | ⚠️ teilweise | ⚠️ |
| Oura-Sync | Admin | n/a | ⚠️ `verify_jwt`-Konfiguration nicht im Repo | ❌ | ❌ |

**Manipulationsschutz des Audit-Logs:** `owner_audit_log` hat **kein** `UPDATE`- oder `DELETE`-Grant für `authenticated` (`20260722120000_...sql:775-779`) — faktisch append-only auf Grant-Ebene. **Aber:** kein `BEFORE UPDATE/DELETE`-Trigger, keine Hash-Kette, kein externer Export. Wer die Datenbank-Owner-Rolle hat, kann Einträge verändern. Für Art. 5 Abs. 2 DSGVO ist das grenzwertig.

**Unnötig geloggte Daten:** Keine gefunden. `user_agent_summary` ist auf 200 Zeichen begrenzt (`left(coalesce(p_user_agent,''), 200)`) — bewusste Datenminimierung. ✅

### 13.3 Empfohlenes Audit-Log-Schema

```sql
create table public.platform_audit_log (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default clock_timestamp(),
  actor_user_id uuid        references public.profiles(id) on delete set null,
  actor_role    text        not null,
  actor_ip      inet,                    -- Art. 32; Löschfrist beachten
  action        text        not null,    -- 'customer.delete', 'entitlement.grant', ...
  resource_type text        not null,
  resource_id   text,
  organization_id uuid,
  outcome       text        not null check (outcome in ('success','denied','error')),
  before_state  jsonb,                   -- nur geänderte Felder, keine Rohdaten
  after_state   jsonb,
  correlation_id text        not null,
  prev_hash     bytea,                   -- Hash-Kette
  row_hash      bytea       not null     -- sha256(prev_hash || kanonische Zeile)
);

alter table public.platform_audit_log enable row level security;
revoke all on table public.platform_audit_log from public, anon, authenticated;
grant select on table public.platform_audit_log to authenticated;  -- via RLS: nur Owner
grant insert on table public.platform_audit_log to service_role;

-- Unveränderlichkeit erzwingen, nicht nur per Grant
create or replace function public.audit_log_is_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'platform_audit_log is append-only';
end; $$;

create trigger platform_audit_log_no_update
  before update or delete on public.platform_audit_log
  for each row execute function public.audit_log_is_append_only();
```

**Aufzunehmende Aktionen:** jede Admin-Ansicht von Kundendaten, jede Entitlement-Änderung, jede Provisionierung, jeder Dokumentzugriff, jede Löschung, jede Rollenänderung, jeder fehlgeschlagene Autorisierungsversuch.
**Aufbewahrung:** 12 Monate (Art. 5 Abs. 1 lit. e), IP-Adressen kürzer.

---

## 14. Phase 11 — Contract Stack

### 14.1 Bedarfsanalyse

| # | Dokument | Bedarf | Vorhanden | Priorität |
|---|---|---|---|---|
| 1 | **B2B-AGB** | **Zwingend** — sonst gilt dispositives BGB | ❌ | **P0** |
| 2 | Individueller Projektvertrag / Angebotsanlage | Zwingend | ⚠️ Angebote existieren technisch, Vertragstext unbekannt | **P0** |
| 3 | Softwareentwicklungsvertrag (Werkvertrag, § 631 BGB) | Zwingend für Website-/App-Projekte | ❌ | **P0** |
| 4 | SaaS-Vertrag (Mietvertrag, § 535 BGB) | Zwingend für Kundenportal/Club-Operations | ❌ | **P0** |
| 5 | Wartungs-/Betreuungsvertrag (Dienstvertrag, § 611 BGB) | Zwingend — wird beworben („ab ca. 350 €/Monat") | ❌ | **P0** |
| 6 | Support-/SLA-Anlage | Sehr empfohlen | ❌ | P1 |
| 7 | **AVV nach Art. 28 DSGVO** | **Zwingend** und öffentlich zugesagt | ❌ | **P0** |
| 8 | **TOM (AVV-Anlage)** | **Zwingend** | ⚠️ technisch beschrieben, nicht als Dokument | **P0** |
| 9 | **Subprozessorenliste** | **Zwingend** (Art. 28 Abs. 2) | ❌ | **P0** |
| 10 | NDA | Empfohlen | ❌ | P2 |
| 11 | IP-/Nutzungsrechte-Klausel | **Zwingend** (§ 31 UrhG) | ❌ | **P0** |
| 12 | Data Ownership / Datenherausgabe | Zwingend | ❌ | P1 |
| 13 | Exit-/Export-Regelung | Zwingend (auch Data Act, Abschnitt 15) | ❌ | P1 |
| 14 | Change-Request-Verfahren | Sehr empfohlen | ❌ | P1 |
| 15 | Abnahmeregelung (§ 640 BGB) | **Zwingend** bei Werkverträgen | ❌ | **P0** |
| 16 | Zahlungsbedingungen | Zwingend | ⚠️ in Angeboten | P1 |
| 17 | Verzugsregelung (§§ 286, 288 BGB) | Empfohlen | ❌ | P1 |
| 18 | Laufzeit / 19 Kündigung / 20 Post-Termination | Zwingend bei Dauerschuldverhältnissen | ❌ | **P0** |

### 14.2 Kritische Klauselhinweise (deutsches AGB-Recht)

- **§ 310 Abs. 1 BGB** privilegiert B2B gegenüber B2C, aber die **Inhaltskontrolle nach § 307 BGB gilt auch dort.** Klauselverbote der §§ 308, 309 BGB wirken über § 307 Abs. 2 als Indiz in den B2B-Verkehr hinein.
- **Haftung:** Ein pauschaler Ausschluss ist **unwirksam**. Zulässig ist regelmäßig nur:
  unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben/Körper/Gesundheit, bei arglistig verschwiegenen Mängeln und nach ProdHaftG;
  bei einfacher Fahrlässigkeit nur für **Kardinalpflichten**, begrenzt auf den **vertragstypisch vorhersehbaren Schaden**.
  Ein Ausschluss für **Datenverlust** ist in dieser Form unwirksam — zulässig ist die Begrenzung auf den Wiederherstellungsaufwand bei ordnungsgemäßer Datensicherung, kombiniert mit einer **Backup-Mitwirkungspflicht des Kunden**.
- **Nutzungsrechte:** Ohne ausdrückliche Einräumung gilt die **Zweckübertragungslehre (§ 31 Abs. 5 UrhG)** — der Kunde erhält im Zweifel nur, was der Vertragszweck zwingend erfordert. Das ist für **beide Seiten** eine Streitquelle. Regeln Sie ausdrücklich: einfach oder ausschließlich, räumlich/zeitlich/inhaltlich, Bearbeitungsrecht, Übertragbarkeit, und was mit **Open-Source-Bestandteilen und wiederverwendbaren Cogniiq-Bausteinen** geschieht (dort typischerweise nur ein einfaches Nutzungsrecht).
- **KI-Output:** Rein KI-generierte Inhalte sind mangels menschlicher Schöpfung **nicht urheberrechtlich geschützt** (§ 2 Abs. 2 UrhG). Es können daher keine Rechte daran übertragen werden, die nicht bestehen. Regeln Sie stattdessen **Nutzungsfreiheit und Freistellung**.
- **Drittanbieter-APIs:** Cogniiq hat keinen Einfluss auf Änderungen bei Google, Supabase, Resend oder dem Voice-Provider. Eine Klausel zu API-Änderungen, Preisänderungen und Einstellung von Diensten ist **geschäftskritisch**, nicht kosmetisch — sonst haftet Cogniiq für fremde Produktentscheidungen.
- **Referenzkundennennung:** Nur mit ausdrücklicher Einwilligung; Widerruf für die Zukunft vorsehen. Die bereits getroffene Entscheidung, die Kundenstimme ohne schriftliche Einwilligung zu entfernen, ist genau richtig — die Klausel muss das künftig sauber abbilden.

---

## 15. Phase 12 — Data Act (VO (EU) 2023/2854)

### 15.1 Applicability Analysis — keine Pauschalaussage

Die Kapitel VI (Art. 23-31, Wechsel zwischen Datenverarbeitungsdiensten) gelten seit **12.09.2025**; die Verordnung ist insgesamt seit **12.09.2025** anwendbar. Die Wechselentgelt-Regelung des Art. 29 greift stufenweise (vollständige Abschaffung ab **12.01.2027**).

| Prüfschritt | Bewertung |
|---|---|
| Ist Cogniiq „Anbieter eines Datenverarbeitungsdienstes" (Art. 2 Nr. 8)? | Die Definition erfasst digitale Dienste, die **skalierbaren, elastischen, gemeinsam genutzten** Zugang zu Rechenressourcen ermöglichen (IaaS/PaaS/SaaS). |
| Kundenportal `/app` | ⚠️ **Möglich.** Ein SaaS-Kundenportal kann erfasst sein — entscheidend ist, ob es als **eigenständiger, elastischer Dienst** vermarktet wird oder als projektbezogene Beigabe. |
| Club-Operations-Modul | ⚠️ **Eher ja**, wenn es als laufend entgeltliches SaaS-Produkt vermittelt wird. |
| Individuelle Websites / Webanwendungen für Kunden | ❌ **Nein.** Maßgefertigte Software ist kein „Datenverarbeitungsdienst" im Sinne der Verordnung. |
| KI-Telefonassistent, Automationen | ⚠️ **Abhängig** von der Bereitstellungsform. |
| Greift eine Ausnahme? | Die Verordnung kennt für Kap. VI **keine KMU-Bereichsausnahme** (anders als Kap. II für vernetzte Produkte, Art. 7). Art. 31 nimmt nur Dienste aus, die überwiegend maßgeschneidert oder als Test-/Bewertungsdienst erbracht werden — **diese Ausnahme ist für Cogniiq ernsthaft prüfenswert.** |

**Ergebnis: Die Anwendbarkeit ist offen und hängt vom Vertriebsmodell ab, nicht vom Code.**

### 15.2 Falls anwendbar — Pflichten

Vorvertragliche Transparenz über Wechselmodalitäten (Art. 26), maximal **30 Tage Übergangsfrist** plus 30 Tage Datenabruf (Art. 25), **keine Wechselentgelte** ab 12.01.2027 (Art. 29), Bereitstellung exportierbarer Daten in einem **strukturierten, gängigen, maschinenlesbaren Format** (Art. 25 Abs. 2 lit. e), Kündigungsfrist maximal **zwei Monate** (Art. 25 Abs. 2 lit. a).

**Pragmatische Empfehlung, unabhängig von der Rechtsfrage:** Eine Exit-/Export-Klausel mit definiertem Format und 30-Tage-Frist ist ohnehin ein **Verkaufsargument** im deutschen Mittelstand — sie nimmt dem Kunden die Lock-in-Sorge. Bauen Sie sie ein, statt die Anwendbarkeit auszufechten. Das technische Fundament existiert bereits (`src/lib/ownerFinance/exports/**`, `ExportMenu.tsx`).
`NEEDS LAWYER REVIEW` · `NEEDS BUSINESS CONFIRMATION`

---

## 16. Phase 13 — Verbraucherrecht

### 16.1 Vorfrage: Bietet Cogniiq Verbrauchern Verträge an?

**Befund aus dem Code: uneindeutig — und das ist selbst das Problem.**

Dafür, dass es B2B ist: Zielgruppenansprache durchgängig „Unternehmen, Praxen, Betriebe"; keine Verbraucherprodukte; kein Online-Checkout; die Impressum-Klausel verweist auf Verbraucherschlichtung (was eher für gelegentlichen B2C-Kontakt spricht).
Dagegen: **Es gibt nirgends eine Klarstellung, dass sich das Angebot ausschließlich an Unternehmer i. S. v. § 14 BGB richtet.** Die Kontaktformulare sind für jeden ausfüllbar. Ein Solo-Selbstständiger ist Unternehmer — ein Vereinsvorstand im Ehrenamt unter Umständen **nicht**, und Vereine sind ausdrücklich Zielgruppe.

### 16.2 Prüfung für den Fall, dass Verbraucher erreicht werden

| Vorschrift | Anwendbarkeit | Befund |
|---|---|---|
| §§ 312 ff. BGB, Fernabsatz (§ 312c) | Ja bei B2C-Fernabsatzverträgen | ❌ Keine Informationen vorhanden |
| Art. 246a EGBGB | Ja | ❌ Fehlt |
| Widerrufsrecht § 355 BGB + Belehrung | Ja | ❌ Fehlt. **Ohne Belehrung verlängert sich die Frist auf 12 Monate + 14 Tage (§ 356 Abs. 3 S. 2 BGB)** — bei Dienstleistungsverträgen ein erhebliches Rückabwicklungsrisiko |
| Muster-Widerrufsformular | Ja | ❌ Fehlt |
| **§ 312j BGB (Buttonlösung)** | **Nein** — kein Online-Bestellprozess, nur Kontaktformulare | ✅ nicht einschlägig |
| **§ 312k BGB (Kündigungsbutton)** | **Nein** — Verträge werden nicht über die Website geschlossen | ✅ nicht einschlägig |
| PAngV (Gesamtpreis inkl. USt) | Nur bei Verbraucheransprache | ⚠️ Preise ohne USt-Hinweis → **R-35** |
| § 309 Nr. 9 BGB (Laufzeit/Verlängerung) | Nur B2C | ⚠️ zu beachten bei Wartungsverträgen |

### 16.3 Empfehlung

**Die objektiv stärkste Lösung ist eine klare B2B-Beschränkung**, nicht der Aufbau eines vollständigen Verbraucherrechts-Apparats:

1. AGB § 1: *„Diese Bedingungen gelten ausschließlich gegenüber Unternehmern i. S. v. § 14 BGB, juristischen Personen des öffentlichen Rechts und öffentlich-rechtlichen Sondervermögen."*
2. Kontaktformulare: Pflichtfeld „Unternehmen/Organisation" (bei `ContactSection.tsx` bereits vorhanden ✅, bei `FAQQuestionModal.tsx` prüfen).
3. Preisangaben: durchgängig „zzgl. gesetzlicher USt.".
4. Vor Vertragsschluss: Unternehmereigenschaft bestätigen lassen.

Das spart Widerrufsbelehrung, PAngV-Komplexität und — wie Abschnitt 17 zeigt — mit hoher Wahrscheinlichkeit auch die BFSG-Pflichten.
`NEEDS LAWYER REVIEW` · `NEEDS BUSINESS CONFIRMATION`

---

## 17. Phase 14 — BFSG / Accessibility

### 17.1 Anwendbarkeitsprüfung — keine Pauschalaussage

Das BFSG gilt seit **28.06.2025**.

| Prüfschritt | Bewertung |
|---|---|
| Erfasst das BFSG diese Website? | Erfasst sind u. a. **„Dienstleistungen im elektronischen Geschäftsverkehr"** (§ 1 Abs. 3 Nr. 5 BFSG) — definiert in § 2 Nr. 26 BFSG als Dienstleistungen, die über Websites **für Verbraucher** erbracht werden und auf den **Abschluss eines Verbrauchervertrags** gerichtet sind. |
| Führt die Website zum Vertragsschluss? | ❌ **Nein.** Kein Warenkorb, kein Checkout, keine Bestellfunktion, keine Online-Buchung — nur Kontaktformulare. Die Anbahnung allein genügt nach herrschender Auffassung **nicht**. |
| Richtet sie sich an Verbraucher? | ⚠️ Nicht ausdrücklich ausgeschlossen (s. Abschnitt 16) |
| **Kleinstunternehmer-Ausnahme (§ 3 Abs. 3 BFSG)** | Greift **für Dienstleistungen** (nicht für Produkte) bei < 10 Beschäftigten **und** ≤ 2 Mio. € Jahresumsatz oder Bilanzsumme. Bei einem Einzelunternehmen mit zwei Gründern **mit hoher Wahrscheinlichkeit erfüllt** → `NEEDS BUSINESS CONFIRMATION` |
| Ist das Kundenportal `/app` erfasst? | ❌ Nein — B2B, hinter Login, kein Verbrauchervertragsschluss |

**Ergebnis: Das BFSG ist mit hoher Wahrscheinlichkeit nicht anwendbar** — doppelt abgesichert über (a) fehlenden Verbrauchervertragsschluss und (b) die Kleinstunternehmer-Ausnahme. **Eine pauschale Behauptung der Anwendbarkeit wäre falsch.**

> **Aber:** Beide Ausnahmen sind fragil. Der Moment, in dem Cogniiq eine Online-Buchung, einen Self-Service-Kauf oder ein Abo mit Checkout einführt, **oder** die Schwellen überschreitet, kippt die Bewertung. Rechnen Sie es ein, bevor Sie es bauen.

### 17.2 Accessibility als Geschäftsentscheidung

Unabhängig von der Rechtspflicht: **Cogniiq verkauft Websites an Arztpraxen, Hotels und Vereine.** Für einige dieser Kunden ist das BFSG anwendbar — und für die öffentliche Hand die BITV 2.0. Barrierefreiheit ist damit kein Compliance-Posten, sondern **Produktqualität und Verkaufsargument**.

Stichprobenbefunde (kein vollständiger EN-301-549-Audit):

| Prüfpunkt | Befund |
|---|---|
| `lang="de"` | ✅ `index.html:2` |
| `alt`-Attribute | ✅ Kein `<img>` ohne `alt` gefunden |
| `aria-label` / `aria-labelledby` | ✅ Durchgängig verwendet |
| Fokus-Sichtbarkeit | ✅ `focus-visible:ring-2` konsistent |
| Semantisches HTML | ✅ `<section>`, `<address>`, `aria-labelledby` |
| **Skip-Link** | ❌ **Nicht vorhanden** (repo-weit 0 Treffer) → **R-34** |
| `prefers-reduced-motion` | ⚠️ zu prüfen — die Seite nutzt intensiv `framer-motion` |
| Kontrastwerte | ⚠️ nicht geprüft; Hilfstexte in `text-gray-400`/`text-pub-ink-3` sind Kandidaten für < 4,5:1 |
| Spline-3D / Canvas | ⚠️ keine Textalternative |

---

## 18. Phase 15 — Security Audit

### 18.1 Positivbefunde (verifiziert)

- **Keine Secrets im Repository.** Vollständiger Scan auf JWT-, `sk-`-, `re_`-Muster und Service-Role-Literale: **0 Treffer.** `.env` in `.gitignore`.
- **Keine Debug-/Dev-Routen** in Produktion. `VITE_REVIEW_MODE` ist standardmäßig aus.
- **Keine Test-Admin-Accounts** im Code.
- **Alle Storage-Buckets privat.**
- **Keine Open Redirects** — `src/lib/auth/authorizedRedirect.ts` validiert Ziele.
- **Keine PII und keine Secrets in Logs.**
- **Backup-Verifikation automatisiert**, inkl. Verschlüsselungsprüfung.
- **Migration-Ledger und Allowlist** in der CI (`.github/scripts/audit-supabase-history.mjs`).

### 18.2 Security Header Review

| Header | Status | Empfohlener Wert |
|---|---|---|
| `Content-Security-Policy` | ❌ **fehlt** | s. u. |
| `Strict-Transport-Security` | ❌ **fehlt** | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | ❌ **fehlt** | `nosniff` |
| `Referrer-Policy` | ❌ **fehlt** | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | ❌ **fehlt** | `camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()` |
| `frame-ancestors` / `X-Frame-Options` | ❌ **fehlt** | `frame-ancestors 'none'` für `/admin`, `/owner`, `/app`, `/d` |
| `Cross-Origin-Opener-Policy` | ❌ fehlt | `same-origin` |

**CSP-Entwurf** (muss gegen den Consent-Mechanismus getestet werden — `gtag.js` wird dynamisch injiziert):

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://prod.spline.design;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://maps.gstatic.com https://*.googleapis.com;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co https://n8n.cogniiq.co https://www.google-analytics.com https://*.analytics.google.com https://prod.spline.design;
frame-src https://www.google.com https://maps.google.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

> **Hinweis:** `'unsafe-inline'` im `script-src` ist nötig, solange das Theme-Inline-Skript (`index.html:14`) und die JSON-LD-Blöcke ohne Nonce laufen. Eine Nonce-basierte CSP wäre sauberer, erfordert aber die Ausgabe über `functions/_middleware.ts`. Schrittweise: zuerst per `Content-Security-Policy-Report-Only` ausrollen.

### 18.3 Weitere Befunde

| Befund | Bewertung |
|---|---|
| CORS `*` auf fünf Edge Functions | **R-21** — Muster für die Korrektur existiert bereits in `clubGatewayShell` (`allowedOrigins`) |
| Kein Rate-Limiting | **R-22** — `/d/<token>` ist ohne Limit brute-force-bar; Formulare sind ohne Captcha spam-bar |
| OAuth-Tokens im Klartext | **R-25** |
| `generate_daily_execution_plan` ist `SECURITY INVOKER` ohne gepinnten `search_path` | ⚠️ Vom Team selbst dokumentiert (`20260731122000_...sql:75-79`) und als außerhalb des Migrations-Scopes eingestuft. Da nicht `SECURITY DEFINER`, ist das Risiko gering — **sollte aber geschlossen werden** |
| `execution_templates` / `execution_template_tasks` haben **keine Migrationsdatei** | ⚠️ Direkt gegen Hosted erstellt; Schema-Drift ist ein Betriebsrisiko, in der Konvergenz-Migration aber sauber nachdokumentiert |

---

## 19. Phase 16 — E-Mail / Sales / Outreach

| Funktion | Im Repo vorhanden? | Bewertung |
|---|---|---|
| Newsletter | ❌ Nein | — |
| Marketing-E-Mail-System | ❌ Nein | — |
| Transaktionale E-Mails | ✅ Resend, Angebots-/Signaturstrecke | ✅ Art. 6 Abs. 1 lit. b; **kein Werbeinhalt** — wichtig, weil eine eingebettete Werbebotschaft die Mail in § 7 UWG ziehen würde |
| **Cold E-Mail** | ⚠️ `outreach_channel = 'email'` vorbereitet, **kein Versandcode** | ❌ **C-4 / R-08** |
| **Cold Calling** | ⚠️ `outreach_channel = 'phone'` vorbereitet | ⚠️ **C-4** |
| Lead-Datenbank | ✅ 50 Zeilen | ❌ **C-4** |
| CRM | ❌ kein SDK | — |
| Abmeldelink / Suppression List | ❌ **nicht vorhanden** | ❌ bei jeder Werbe-E-Mail zwingend (§ 7 Abs. 3 Nr. 4 UWG) |
| Consent-Speicherung für Werbung | ❌ **nicht vorhanden** | ❌ |

### 19.1 Die entscheidende Unterscheidung

| | **Cold E-Mail B2B** | **Cold Call B2B** |
|---|---|---|
| Norm | § 7 Abs. 2 Nr. 2 UWG | § 7 Abs. 2 Nr. 1 UWG |
| Anforderung | **Vorherige ausdrückliche Einwilligung** | **Mutmaßliche Einwilligung** |
| Praktisch | Ohne Opt-in **unzulässig** — auch B2B, auch bei „passendem" Angebot | Zulässig, wenn ein konkreter, aus den Umständen ableitbarer sachlicher Bezug zur Geschäftstätigkeit besteht |
| Nachweis | Double-Opt-in mit Protokoll | Dokumentierte Vorabrecherche pro Adressat |
| Ausnahme | § 7 Abs. 3 UWG nur bei **bestehender** Kundenbeziehung | — |
| Risiko | Abmahnung, Unterlassungserklärung, Vertragsstrafe; Bußgeld § 20 UWG bis 300.000 € | Gleiche Rechtsfolgen, aber deutlich bessere Verteidigungsposition |
| **Empfehlung** | ❌ **Nicht nutzen** ohne Einwilligung | ✅ **Gangbarer Weg** mit sauberer Dokumentation |

**Konkret für die 50 Praxis-Leads:** Der telefonische Weg ist rechtlich der belastbare. Das Feld `fit_notes` ist dafür bereits der richtige Ort — dort gehört die **praxisbezogene Begründung** hinein, warum gerade dieser Adressat ein sachliches Interesse an einem KI-Telefonassistenten hat (z. B. dokumentierte telefonische Nichterreichbarkeit). Das ist der Nachweis der mutmaßlichen Einwilligung. Zusätzlich zwingend: Art.-14-Information beim Erstkontakt und eine Sperrliste.

---

## 20. Phase 17 — Legal Document Inventory

| Dokument | Status | Ort / Anmerkung |
|---|---|---|
| Impressum | ✅ **EXISTS** | `src/lib/legal-content.tsx:24-93`, Route `/impressum` — rechtlich sauber |
| Datenschutzerklärung | ⚠️ **EXISTS, INCOMPLETE** | `src/lib/legal-content.tsx:95-257` — s. Listen A/B |
| Cookie-Hinweise | ✅ **EXISTS** (integriert in Abschnitte 5-7) | Eigene Cookie-Policy nicht zwingend |
| **AGB** | ❌ **MISSING** | — |
| **AVV / DPA** | ❌ **MISSING** — aber öffentlich zugesagt | — |
| **TOM** | ⚠️ **PARTIAL** | Technisch in `docs/security-and-tenancy.md`, `docs/phase-0-security-audit.md`; kein vorlagefähiges Dokument |
| **Subprozessorenliste** | ❌ **MISSING** | — |
| **Verarbeitungsverzeichnis (Art. 30)** | ❌ **MISSING** | — |
| **Löschkonzept** | ⚠️ **PARTIAL** | Technisch: `20260910130000_owner_purge_policy.sql`; keine dokumentierten Fristen |
| **Incident-Response-Plan** | ❌ **MISSING** | — |
| **Breach-Register (Art. 33 Abs. 5)** | ❌ **MISSING** — trotz zweier eingetretener Verletzungen | — |
| SLA | ❌ **MISSING** | — |
| Individualverträge | ❓ **UNKNOWN** | Nicht im Repository `NEEDS BUSINESS CONFIRMATION` |
| NDA | ❌ **MISSING** | — |
| Disclaimer | ✅ **EXISTS** | Haftung für Inhalte/Links im Impressum |
| **AI-Hinweis (Art. 50)** | ⚠️ **CLAIMED, UNVERIFIED** | `KiTelefonassistentPage.tsx:218` — Produkt außerhalb des Repos |
| Accessibility Statement | ❌ **MISSING** | Nach Abschnitt 17 wahrscheinlich nicht pflichtig |
| Widerrufsbelehrung | ❌ **MISSING** | Nur bei B2C erforderlich — B2B-Klarstellung vorziehen |
| DSFA | ❌ **MISSING** | Für Oura zu prüfen |
| Interne Compliance-Doku | ✅ **EXISTS, STARK** | `HONESTY-AUDIT.md`, `COPY-CLAIMS-TO-VERIFY.md`, `docs/PHASE0_LEGAL_OPEN_ITEMS.md`, `docs/phase-0-security-audit.md` |

---

## 21. Required Technical Changes

Priorisiert nach Risiko/Aufwand. Alle ohne Anwalt umsetzbar.

| # | Änderung | Datei(en) | Aufwand |
|---|---|---|---|
| T-01 | Sicherheits-Header ergänzen (CSP zunächst `Report-Only`) | `public/_headers`, `functions/_middleware.ts` | M |
| T-02 | `frame-ancestors 'none'` für `/admin`, `/owner`, `/app`, `/d` | `public/_headers` | S |
| T-03 | Art.-13-Hinweis + Datenschutz-Link an **jedes** Formular | `ContactSection.tsx`, `FAQQuestionModal.tsx` | S |
| T-04 | Spline: Self-Hosting der Szene **oder** Einwilligungs-Gate **oder** Entfernen | `hero/DesktopHero.tsx:78-96` | M |
| T-05 | Datenschutzerklärung um Liste A ergänzen (Spline, Maps, `referrer`/`page_url`, Speicherdauer, Empfänger, Drittlandgarantien) | `src/lib/legal-content.tsx` | M |
| T-06 | Oura vollständig entfernen (Tabellen, Function, Route, Frontend, Bestandsdaten) | `supabase/functions/sync-oura/`, `src/pages/OuraAnalyticsPage.tsx`, `src/App.tsx:522,647`, neue Migration | M |
| T-07 | CORS-Allowlist statt `*` | 5 Edge Functions | S |
| T-08 | Rate-Limiting aktivieren; Turnstile auf Formulare | `club-operations-read/index.ts:121`, Formulare | M |
| T-09 | `platform_audit_log` nach Abschnitt 13.3 einführen | neue Migration + Call-Sites | L |
| T-10 | Serverseitiges Consent-Log (Art. 7 Abs. 1) | neue Tabelle + Edge Function | M |
| T-11 | Consent-Ablauf (Re-Consent nach 12 Monaten) | `src/lib/consent.ts` | S |
| T-12 | „Ablehnen" und „Alle akzeptieren" visuell gleichgewichtig | `ConsentBanner.tsx:151-160` | S |
| T-13 | Skip-Link + `prefers-reduced-motion` | `App.tsx`, Motion-Komponenten | S |
| T-14 | OSS-Lizenzprüfung in die CI + `THIRD-PARTY-NOTICES` generieren | `.github/workflows/build.yml` | M |
| T-15 | `package.json`: Name korrigieren, `"license": "UNLICENSED"` | `package.json:2` | S |
| T-16 | `generate_daily_execution_plan`: `search_path` pinnen | neue Migration | S |
| T-17 | Preisangaben „zzgl. gesetzlicher USt." | Preisseiten | S |
| T-18 | Löschfristen technisch durchsetzen (Leads, Formularanfragen, Logs) | Purge-Policy erweitern | M |
| T-19 | Betroffenenrechte-Werkzeug (Export/Löschung je Kunde) | neue Admin-Funktion | L |

---

## 22. Required Legal Documents

**Block 1 — vor der nächsten Kundenansprache:**
1. AVV-Muster nach Art. 28 Abs. 3 DSGVO (mit den zehn Pflichtinhalten)
2. TOM als AVV-Anlage — ableitbar aus `docs/security-and-tenancy.md` und `docs/phase-0-security-audit.md`
3. Subprozessorenliste (Cloudflare, Supabase, Resend, n8n-Hoster, Google) mit Änderungs-/Widerspruchsprozess
4. Verarbeitungsverzeichnis Art. 30 Abs. 1 **und** Abs. 2
5. Zwei Vorfallsdokumentationen nach Art. 33 Abs. 5 + Meldeentscheidung
6. Incident-Response-Plan mit 72-Stunden-Meldekette
7. Löschkonzept mit Fristen je Datenkategorie

**Block 2 — vor dem nächsten Vertragsabschluss:**
8. B2B-AGB mit Unternehmerbeschränkung nach § 14 BGB
9. Softwareentwicklungsvertrag (Werkvertrag) mit Abnahme nach § 640 BGB
10. SaaS-/Nutzungsvertrag für Portal und Club-Operations
11. Wartungs-/Betreuungsvertrag mit SLA-Anlage
12. Nutzungsrechte-Regelung nach § 31 UrhG (inkl. OSS und wiederverwendbarer Bausteine)
13. Exit-/Datenexport-Regelung
14. Change-Request-Verfahren

**Block 3 — vor der Skalierung:**
15. NDA-Muster
16. Referenzkunden-/Logo-Einwilligung
17. AI-Literacy-Konzept nach Art. 4 AI Act
18. Art.-14-Informationstext für gesourcte Leads + Sperrlistenprozess
19. DSFA für Oura, falls dort nicht entfernt wird
20. Interessenabwägung Art. 6 Abs. 1 lit. f für die Lead-Datenbank

---

## 23. Questions For Founder

1. **Oura:** Wessen Gesundheitsdaten sind das? Ausschließlich Ihre eigenen, oder auch die anderer Personen? Ist das ein privates Projekt oder ein Produkt-Prototyp?
2. **Die 50 Leads:** Woher stammen sie — gekauft, recherchiert, gescraped? Wurde bereits jemand kontaktiert? Über welchen Kanal?
3. **`/webhook/google-ads`:** Was macht dieser n8n-Workflow? Werden Lead-Daten (E-Mail, Telefon) an Google Ads zurückgespielt (Offline/Enhanced Conversions)?
4. **n8n:** Bei welchem Hoster läuft `n8n.cogniiq.co`? In welchem Land? Existiert ein AVV? Wie lange bleiben Anfragedaten dort?
5. **KI-Telefonassistent:** Welcher Anbieter (Vapi, Retell, ElevenLabs, Eigenbau)? Wo läuft er? Existiert ein AVV mit diesem Anbieter?
6. **Art.-50-Ansage:** Sagt der Assistent tatsächlich im **ersten Satz**, dass er ein KI-System ist? (Die Website behauptet es als Fakt — `COPY-GAPS.md` führt es als offene Frage „C1".)
7. **Gesprächsaufzeichnung:** Die Website sagt „Keine Gesprächsaufzeichnung — gespeichert wird nur das strukturierte Ergebnis". Trifft das zu? Wird für Transkription/Modellverarbeitung zwischenzeitlich Audio übertragen?
8. **Bestehende Kundenverträge:** Welche Dokumente liegen heute zugrunde? Existiert irgendein AVV mit einem Bestandskunden?
9. **Club-Operations:** Welcher Verein? Liegt ein AVV vor? Welche Mitgliederdaten werden gelesen?
10. **Mitarbeiterzahl und Jahresumsatz:** Entscheidend für BFSG (§ 3 Abs. 3), § 36 VSBG und § 38 BDSG.
11. **Verbraucher:** Haben Sie jemals mit einer Privatperson einen Vertrag geschlossen? Wollen Sie das künftig ausschließen?
12. **Assets:** Woher stammen `og-image.png` und die Spline-Szene? Ist „Cogniiq" als Marke angemeldet?
13. **Google-Konten:** Welche Aufbewahrungsdauer ist in der GA4-Property eingestellt? Ist „Google-Signale" aktiv?
14. **MFA:** Ist Zwei-Faktor-Authentifizierung für Admin-/Owner-Konten in Supabase aktiviert?
15. **Handelsregister:** Ist das Einzelunternehmen im HR eingetragen (e. K.)?

---

## 24. Questions For Lawyer

1. **Art. 33/34:** Sind die beiden dokumentierten Expositionen meldepflichtig? Reicht die vorhandene technische Forensik als Grundlage für ein „Risiko unwahrscheinlich"?
2. **Art. 9:** Unter welchen Umständen fallen die Oura-Daten unter die Haushaltsausnahme (Art. 2 Abs. 2 lit. c)? Kippt die geschäftliche Infrastruktur diese Bewertung?
3. **Art. 14:** Wie ist mit der abgelaufenen Frist umzugehen — nachholen oder löschen?
4. **§ 7 UWG:** Ist bei Arztpraxen eine mutmaßliche Einwilligung für Telefonakquise eines KI-Telefonassistenten begründbar? Welcher Dokumentationsstandard ist nötig?
5. **AI Act:** Ist Cogniiq bei White-Label-Auslieferung unter eigener Marke **Provider** nach Art. 25 Abs. 1 lit. c oder Deployer?
6. **Art. 26 DSGVO:** Besteht bei GA4/Google Ads gemeinsame Verantwortlichkeit? Ist eine Vereinbarung erforderlich?
7. **AGB:** Entwurf B2B-AGB mit wirksamer Haftungsbegrenzung, Abnahmeregelung und Nutzungsrechten.
8. **Data Act:** Greift die Ausnahme nach Art. 31 für überwiegend maßgeschneiderte Dienste?
9. **§ 38 BDSG:** Ist wegen der Lead-Datenbank und Art.-9-Daten ein Datenschutzbeauftragter zu benennen?
10. **BFSG:** Bestätigung, dass mangels Verbrauchervertragsschluss und über § 3 Abs. 3 keine Anwendbarkeit besteht.
11. **§ 5 UWG:** Wie ist die AVV-Zusage zu bewerten, solange kein AVV existiert? Bestehen Ansprüche von Bestandskunden?
12. **eIDAS:** Genügt die einfache elektronische Signatur für die abgeschlossenen Vertragstypen? Beweislastfolgen nach § 371a ZPO?
13. **Nutzungsrechte:** Wie sind Kundenprojekte, wiederverwendbare Bausteine und KI-generierter Output sauber zu trennen?
14. **Referenzkunden:** Anforderungen an eine wirksame, widerrufliche Einwilligung.
15. **Vereine als Kunden:** Kann ein ehrenamtlicher Vereinsvorstand als Verbraucher auftreten?

---

## 25. Remediation Roadmap

### PHASE A — SOFORT (innerhalb von 7 Tagen)

| # | Maßnahme | Verantwortlich |
|---|---|---|
| A-1 | Vorfallsdokumentation nach Art. 33 Abs. 5 für beide Expositionen erstellen; Meldeentscheidung anwaltlich absichern (**Fristen laufen bereits**) | Inhaber + Anwalt |
| A-2 | **Keine Cold E-Mail** an die 50 Leads, bis Art.-14-Information und Rechtsgrundlage stehen | Inhaber |
| A-3 | Oura-Entscheidung treffen: entfernen (empfohlen) oder Art.-9-Grundlage + DSFA | Inhaber |
| A-4 | Fragen 3, 5, 6 (Google-Ads-Webhook, Voice-Anbieter, Art.-50-Ansage) beantworten — alle drei betreffen **öffentliche Zusagen** | Inhaber |
| A-5 | Sicherheits-Header ausrollen (T-01, T-02) | technisch |
| A-6 | Art.-13-Hinweis an alle Formulare (T-03) | technisch |
| A-7 | Prüfen, ob die Aussage „Wir übermitteln keine Klardaten an Google" haltbar ist; andernfalls Webhook **oder** Text korrigieren | Inhaber + technisch |

### PHASE B — VOR DEM NÄCHSTEN KUNDEN (2-4 Wochen)

| # | Maßnahme |
|---|---|
| B-1 | AVV-Muster + TOM + Subprozessorenliste (Legal Block 1) |
| B-2 | Verarbeitungsverzeichnis Art. 30 Abs. 1 und 2 |
| B-3 | B2B-AGB + Projektvertrag + Wartungsvertrag (Legal Block 2) |
| B-4 | Nutzungsrechte-Regelung nach § 31 UrhG |
| B-5 | Datenschutzerklärung um Liste A ergänzen (T-05) |
| B-6 | Spline-Entscheidung umsetzen (T-04) |
| B-7 | Löschkonzept + technische Durchsetzung (T-18) |
| B-8 | Incident-Response-Plan |
| B-9 | B2B-Klarstellung + USt-Hinweis (T-17) |
| B-10 | AVV mit dem Club-Operations-Kunden |

### PHASE C — VOR DER SKALIERUNG (1-3 Monate)

| # | Maßnahme |
|---|---|
| C-1 | `platform_audit_log` mit Hash-Kette (T-09) |
| C-2 | Serverseitiges Consent-Log (T-10) |
| C-3 | Rate-Limiting + Bot-Schutz (T-08) |
| C-4 | CORS-Allowlist (T-07) |
| C-5 | Betroffenenrechte-Werkzeug (T-19) |
| C-6 | OSS-Lizenzprüfung in der CI (T-14) |
| C-7 | Asset-Register vervollständigen |
| C-8 | AI-Literacy-Konzept (Art. 4 AI Act) |
| C-9 | Data-Act-Entscheidung + Exit-Klausel |
| C-10 | Art.-14-Prozess + Sperrliste für Outreach |
| C-11 | SLA-Anlage, NDA-Muster |

### PHASE D — BEST PRACTICE (fortlaufend)

| # | Maßnahme |
|---|---|
| D-1 | CSP von `Report-Only` auf Nonce-basiert umstellen |
| D-2 | Vollständiger Accessibility-Audit nach EN 301 549 — **als Produktqualität, nicht als Pflicht** |
| D-3 | Skip-Link, `prefers-reduced-motion`, Kontrastprüfung (T-13) |
| D-4 | Penetrationstest der Admin-/Owner-Oberflächen |
| D-5 | Jährliches Compliance-Review; `HONESTY-AUDIT.md` als wiederkehrenden CI-Gate etablieren |
| D-6 | Markenanmeldung „Cogniiq" prüfen |
| D-7 | MFA-Pflicht für Admin-/Owner-Konten |
| D-8 | Consent-Ablauf (T-11), Banner-Parität (T-12) |
| D-9 | `search_path`-Pinning (T-16), `package.json`-Metadaten (T-15) |

---

## 26. Methodik und Grenzen dieses Audits

**Geprüft:** 45 SQL-Migrationen, 8 Supabase Edge Functions, 1 Cloudflare Pages Function, ~400 TypeScript-/TSX-Dateien, Build- und Routing-Konfiguration, CI-Skripte, `public/_headers`, `public/_redirects`, `robots.txt`, `index.html`, vorhandene interne Audit-Dokumente.

**Nicht geprüft (außerhalb der Repository-Grenze):**
- Der laufende Produktivzustand der Datenbank (nur Migrationsstand)
- Die n8n-Instanz und ihre Workflows
- Der KI-Telefonassistent und der Chatbot
- Vertragsdokumente, Rechnungen, Anbietervereinbarungen
- Google-Ads-/GA4-Property-Einstellungen
- Supabase-Projekteinstellungen (Auth-Policies, MFA, Backup-Retention)
- Das transitive npm-Dependency-Closure
- Tatsächliche Kontrastwerte und Screenreader-Verhalten

**Nicht behauptet:** Keine Aussage dieses Dokuments bestätigt „DSGVO-Konformität". Konform ist eine konkrete Verarbeitung, kein Produkt und kein Repository — eine Formulierung, die dieses Unternehmen auf seiner eigenen Website bereits richtig verwendet.
