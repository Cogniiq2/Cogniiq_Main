# RECEPTIONIST LEADS — INCIDENT EVIDENCE PRESERVATION

**Dokumenttyp:** Forensische Beweissicherung
**Erstellt:** 2026-09-22
**Betroffenes Objekt:** `public.cogniiq_receptionist_leads` (+ Sequenz `public.cogniiq_receptionist_leads_id_seq`)
**Quellenbasis:** `supabase/migrations/20260730031350_create_cogniiq_receptionist_leads.sql`, `supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql`, Git-Historie, vollständiger Repository-Scan.

> Dieses Dokument stellt Tatsachen fest und benennt Wissenslücken. Es behauptet **keinen** tatsächlichen Missbrauch und trifft **keine** Aussage zur Meldepflicht.
> **LAWYER / DPO DECISION REQUIRED.**

---

## 0. Wesentlicher Unterschied zum Oura-Vorfall

Dieser Vorfall ist **deutlich besser dokumentiert** als der Oura-Vorfall. Die behebende Migration enthält eine eigenständige forensische Untersuchung, die vor dem Schreiben der Migration read-only gegen Produktion durchgeführt wurde. Wo Oura eine Beweislücke hat, liegt hier belastbare Evidenz vor.

**Zwei Dinge sind hier dennoch schlechter:**
1. Die Daten betreffen **Dritte**, nicht den Inhaber — Art. 34 kann nicht leerlaufen.
2. Die Exposition umfasste **Schreibrechte einschließlich DELETE und TRUNCATE**, nicht nur Lesen.

---

## 1. Genaue Felder

Vollständig aus `20260730031350_create_cogniiq_receptionist_leads.sql`:

| Spalte | Typ | Constraint |
|---|---|---|
| `id` | `bigint` | `generated always as identity`, Primärschlüssel |
| `practice_name` | `text` | `not null` |
| `specialty` | `text` | — |
| `contact_person` | `text` | — |
| `city` | `text` | — |
| `street_address` | `text` | — |
| `postal_code` | `text` | — |
| `country` | `text` | `default 'DE'` |
| `phone` | `text` | — |
| `email` | `text` | — |
| `website` | `text` | **`unique`** |
| `google_rating` | `numeric` | — |
| `review_count` | `integer` | — |
| `fit_notes` | `text` | — |
| `fit_score` | `integer` | — |
| `outreach_channel` | `text` | `check (outreach_channel in ('email','phone'))` |
| `sourced_date` | `date` | `not null default current_date` |
| `status` | `text` | `not null default 'new'` |

**Indizes:**
```sql
create index idx_cogniiq_leads_email on public.cogniiq_receptionist_leads (lower(email));
create index idx_cogniiq_leads_phone on public.cogniiq_receptionist_leads (phone);
```

**Was in der Tabelle NICHT steht:** keine `created_at`/`updated_at`-Zeitstempel, kein Erhebungsnachweis, keine Rechtsgrundlage, kein Einwilligungsfeld, kein Widerspruchsfeld, kein Löschdatum, keine Quellenangabe. `sourced_date` ist der einzige zeitliche Anker.

## 2. Personenbezogene Daten

| Feld | Personenbezug | Begründung |
|---|---|---|
| `contact_person` | **Ja, direkt** | Name einer natürlichen Person |
| `email` | **Ja, direkt** | Geschäftliche Adressen sind personenbezogen, sobald sie einer Person zuordenbar sind (typisch `vorname.nachname@praxis.de`); bei Einzelpraxen auch die allgemeine Adresse |
| `phone` | **Ja** | dito |
| `street_address`, `postal_code`, `city` | **Ja, im Kontext** | Anschrift der Praxis = bei Einzelpraxen Anschrift des Inhabers |
| `practice_name` | **Ja, im Kontext** | „Praxis Dr. <Nachname>" ist personenbezogen |
| `specialty` | **Ja, im Kontext** | Berufliche Tätigkeit einer bestimmbaren Person |
| `website` | **Ja, im Kontext** | Führt unmittelbar zur Identifikation |
| `fit_score`, `fit_notes` | **Ja — und rechtlich besonders relevant** | Eine **Bewertung** einer bestimmbaren Person durch Cogniiq. Nach Art. 4 Nr. 4 DSGVO liegt **Profiling** vor, soweit die Bewertung automatisiert erfolgte |
| `google_rating`, `review_count` | **Ja, im Kontext** | Aus öffentlichen Google-Quellen übernommene Bewertungsdaten zur Praxis |
| `outreach_channel`, `status` | **Ja, im Kontext** | Verarbeitungsstatus zu einer bestimmbaren Person |

**Keine besonderen Kategorien nach Art. 9 DSGVO.** `specialty` beschreibt die Fachrichtung des **Behandlers**, nicht den Gesundheitszustand des Betroffenen. Der Personenkreis ist jedoch berufsrechtlich sensibel (Heilberufe, § 203 StGB-Umfeld), was in der Interessenabwägung Gewicht hat.

## 3. Anzahl Datensätze

**50 Zeilen** — read-only gegen das Hosted-Projekt verifiziert (`20260902120000_receptionist_leads_pii_rls.sql:24`).

Die ID-Sequenz stand exakt bei 50, der ID-Bereich war lückenlos 1..50.

## 4. Quelle

**Aus dem Repository nicht abschließend bestimmbar — aber forensisch stark eingegrenzt.**

Belege aus `…pii_rls.sql:44-60`, jeweils read-only erhoben, **ohne Einsicht in die PII selbst**:

| Beobachtung | Schlussfolgerung |
|---|---|
| Alle 50 Zeilen tragen **denselben `xmin`** | Ein einziger Transaktions-Bulk-Load |
| ID-Bereich lückenlos 1..50, Sequenz bei 50 | Keine zurückgerollten oder gelöschten Inserts |
| `pg_stat_all_tables` über die gesamte Tabellenlebensdauer: `n_tup_ins = 50`, `n_tup_upd = 0`, `n_tup_del = 0` (Statistik zuletzt zurückgesetzt 2026-05-22, also vor Tabellenerstellung) | **Seit dem Load wurde nichts eingefügt, geändert oder gelöscht** |
| Alle Zeilen: identisches `sourced_date` = 2026-07-30, `status` = `'new'`, `country` = `'DE'` | Ein einziger Sourcing-Lauf, **nie bearbeitet** |
| 24 Stunden Unified-Log-Stream (~13.000 Events über `edge_logs`, `postgrest_logs`, `postgres_logs`, `function_logs`) | **Keine einzige Referenz auf die Tabelle**; jeder `/rest/v1/`-Pfad in diesem Fenster ließ sich einer bekannten In-Repo-Oberfläche zuordnen |
| Repository-weite Suche über **alle Commits** | **Kein Ingestionsskript, zu keinem Zeitpunkt** |
| Kontaktformulare der Website | Posten an `https://n8n.cogniiq.co/webhook/*`, **nicht** an Supabase (`ContactSection.tsx:394`, `FAQQuestionModal.tsx`) — also **kein öffentlicher Einreichungspfad** in diese Tabelle |

**Die Felder `google_rating` und `review_count` sind ein starkes Indiz für eine Erhebung aus Google-Quellen** (Google Maps / Places / Business-Profile), kombiniert mit `website`, `practice_name`, `specialty`, `street_address`. Das Muster entspricht einem Scraping- oder Listenkauf-Lauf.

> **NEEDS BUSINESS CONFIRMATION — für Art. 14 Abs. 2 lit. f DSGVO zwingend:** Wurden die Daten gekauft, per Scraping erhoben oder manuell recherchiert? Die Angabe der Quelle ist Pflichtbestandteil der Art.-14-Information.

## 5. Timestamps

| Ereignis | Zeitpunkt | Belegqualität |
|---|---|---|
| Tabelle erstellt (Migrationsdateiname) | **2026-07-30, 03:13:50** (Version `20260730031350`) | PROVEN (Dateiname) |
| Bulk-Load der 50 Zeilen | **2026-07-30** (`sourced_date`, einheitlich) | PROVEN |
| Exposition read-only festgestellt | **vor dem 2026-09-02** | PROVEN (Migrationskommentar) |
| Behebende Migration (Version) | **2026-09-02, 12:00:00** (`20260902120000`) | PROVEN |
| Anwendung auf Produktion | **belegt durch Allowlist-Eintrag** | siehe Abschnitt 13 |

**Die Tabelle selbst führt keinen `created_at`-Zeitstempel** — der genaue Zeitpunkt des Loads innerhalb des 30.07. ist nur über `xmin`/`pg_stat` rekonstruierbar.

## 6. RLS

**Vor der Behebung:**

> *„pg_class.relrowsecurity = FALSE — RLS was never turned on, not merely 'enabled with no policies'. pg_policies holds zero rows for this table."* (`…pii_rls.sql:18-20`)

Zusätzlich unabhängig bestätigt:

> *„Supabase's own database linter independently reports this table at level=ERROR, facing=EXTERNAL ('rls_disabled_in_public')."* (`…pii_rls.sql:29-30`)

**RLS war also nicht etwa wirkungslos konfiguriert, sondern vollständig deaktiviert.** Es gab keine Policy, die hätte greifen können.

**Nach der Behebung:**
```sql
alter table public.cogniiq_receptionist_leads enable row level security;
create policy cogniiq_receptionist_leads_owner_all on public.cogniiq_receptionist_leads
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());
```

## 7. Grants — der Kern der Exposition

**Vor der Behebung**, aus `information_schema.role_table_grants` verifiziert (`…pii_rls.sql:21-23`):

> *„`anon` AND `authenticated` each hold DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE."*

| Recht | `anon` vorher | `anon` nachher |
|---|---|---|
| SELECT | ✅ | ❌ |
| INSERT | ✅ | ❌ |
| UPDATE | ✅ | ❌ |
| DELETE | ✅ | ❌ |
| **TRUNCATE** | ✅ | ❌ |
| REFERENCES | ✅ | ❌ |
| TRIGGER | ✅ | ❌ |

**Zusätzlich die Identity-Sequenz** (`…pii_rls.sql:25-27`):

> *„The identity sequence public.cogniiq_receptionist_leads_id_seq likewise grants USAGE/SELECT/UPDATE to `anon`, so the primary-key counter itself is resettable by an anonymous caller."*

**Ursache**, im Repository benannt (`…pii_rls.sql:7-11`): Supabase vergibt im `public`-Schema per Default-Privileges `ALL` auf jede neue Tabelle an `anon` und `authenticated`. Die Erstellungsmigration enthält **kein** `revoke` und **kein** `enable row level security`. Die Tabelle ging damit ab Sekunde eins offen in Betrieb.

## 8. anon SELECT / INSERT / UPDATE / DELETE

| Operation | Vor Behebung | Status | Folge |
|---|---|---|---|
| **SELECT** | **MÖGLICH** | PROVEN | Auslesen aller 50 Datensätze inkl. Name, E-Mail, Telefon, Anschrift und der internen Bewertung |
| **INSERT** | **MÖGLICH** | PROVEN | Einschleusen beliebiger Datensätze |
| **UPDATE** | **MÖGLICH** | PROVEN | Verfälschen bestehender Kontaktdaten und Bewertungen |
| **DELETE** | **MÖGLICH** | PROVEN | Löschen einzelner Datensätze |
| **TRUNCATE** | **MÖGLICH** | PROVEN | Leeren der gesamten Tabelle. Besonders relevant: **TRUNCATE wird von RLS grundsätzlich nicht gefiltert** — selbst aktiviertes RLS hätte das nicht verhindert; nur der Grant-Entzug tut es (im Repository ausdrücklich begründet) |
| **Sequenz-`setval`** | **MÖGLICH** | PROVEN | Zurücksetzen des Primärschlüsselzählers in Kollision |

Zusammenfassend die Feststellung aus `…pii_rls.sql:32-36`:

> *„any request bearing only the public anon API key — which ships in the browser bundle and is public by design — can today read every lead's name, e-mail address, telephone number and postal address, rewrite them, DELETE them or TRUNCATE the table."*

## 9. REST-Exposition

**PROVEN.** Supabase exponiert jede Tabelle des `public`-Schemas automatisch über PostgREST unter

```
https://<PROJEKT-REF>.supabase.co/rest/v1/cogniiq_receptionist_leads
```

Erforderlich ist allein der `anon`-Key, der im ausgelieferten Browser-Bundle steht und öffentlich ist (`src/lib/supabase.ts:4`, `VITE_SUPABASE_ANON_KEY`). Die Projekt-Referenz ist ebenfalls öffentlich (`VITE_SUPABASE_URL`, zusätzlich hartkodiert in `src/pages/OuraAnalyticsPage.tsx:40-41`).

**Entscheidend:** Der Zugriff hätte die Anwendung überhaupt nicht berührt. Weder eine UI-Route noch `ProtectedRoute` noch ein Login wären beteiligt gewesen.

## 10. Enumeration

**Trivial möglich — und das unterscheidet diesen Vorfall wesentlich vom Oura-Vorfall.**

| Faktor | Bewertung |
|---|---|
| Primärschlüssel | `bigint generated always as identity`, **fortlaufend 1..50** — kein Rateaufwand |
| PostgREST-Massenabruf | `GET /rest/v1/cogniiq_receptionist_leads?select=*` liefert **alle Zeilen in einer Anfrage**; kein Filter erforderlich |
| Rate-Limiting | **nicht vorhanden** |
| Tabellenname | Erratbar bzw. über die OpenAPI-Beschreibung von PostgREST (`GET /rest/v1/`) **auflistbar** |
| Erforderliches Vorwissen | Nur die öffentliche Projekt-URL und der öffentliche anon-Key |

> Während bei Oura eine 122-Bit-UUID als faktische Hürde wirkte, existierte hier **keinerlei Hürde**. Ein einziger HTTP-GET genügte.

## 11. Zeitraum

| Marke | Datum |
|---|---|
| Tabelle erstellt, offen ab Erstellung | **2026-07-30** |
| Daten geladen (50 Zeilen) | **2026-07-30** |
| Behebende Migration (Version/Commit) | **2026-09-02** |

> **Expositionsdauer: 2026-07-30 bis 2026-09-02 = 34 Tage.**
> **Davon mit PII belegt: der gesamte Zeitraum** — der Load erfolgte am Tag der Tabellenerstellung.

Diese Dauer ist deutlich belastbarer als beim Oura-Vorfall, weil Anfang und Ende jeweils durch ein Repository-Artefakt markiert sind und die Anwendung der behebenden Migration belegt ist (Abschnitt 13).

## 12. Tatsächliche Zugriffslogs

**Teilweise vorhanden, für den entscheidenden Zeitraum jedoch nicht.**

| Auswertung | Ergebnis |
|---|---|
| 24-Stunden-Fenster des Unified Log Stream (~13.000 Events, `edge_logs` + `postgrest_logs` + `postgres_logs` + `function_logs`), ausgewertet vor dem 2026-09-02 | **Keine einzige Referenz auf die Tabelle.** Jeder `/rest/v1/`-Pfad war einer bekannten In-Repo-Oberfläche zuzuordnen |
| `pg_stat_all_tables` über die gesamte Lebensdauer | `n_tup_ins = 50`, `n_tup_upd = 0`, `n_tup_del = 0` — **keine Schreibvorgänge durch Dritte** |
| Zeilenzahl bei Behebung | unverändert 50 — **kein Datenverlust** |
| Logs für den Zeitraum 30.07. bis ca. 01.09.2026 | **Nicht vorhanden.** Das Supabase-Logfenster ist auf ca. 24 Stunden begrenzt (`…pii_rls.sql:70-71`) |

**Daraus folgt, präzise formuliert:**

- **Ein unberechtigter SELECT-Zugriff ist weder belegt noch ausgeschlossen.** Lesezugriffe hinterlassen keine Spur in `pg_stat_all_tables`; die einzige Quelle wären die PostgREST-Logs, die für 33 der 34 Tage nicht mehr existieren.
- **Ein unberechtigter Schreibzugriff ist mit hoher Sicherheit auszuschließen.** `n_tup_upd = 0`, `n_tup_del = 0` über die gesamte Lebensdauer ist ein belastbares Negativ-Indiz — ein UPDATE oder DELETE hätte diese Zähler verändert, unabhängig von der Logaufbewahrung.
- **Ein TRUNCATE ist ausgeschlossen**, da alle 50 Zeilen vorhanden blieben.

> **Es wird ausdrücklich kein Missbrauch behauptet.** Für Schreibvorgänge liegt ein belastbares Negativ-Indiz vor; für Lesevorgänge liegt **keine Evidenz in beide Richtungen** vor.

## 13. Anwendungsnachweis der Behebung

**Belegt — im Unterschied zum Oura-Vorfall.**

`20260902120000_receptionist_leads_pii_rls.sql` ist im Produktions-Allowlist-Modul eingetragen (`.github/scripts/lib/supabase-migration-allowlist.mjs:183-197`). Der Eintrag ist die ausdrückliche Autorisierung, die Datei über den Produktions-Workflow anzuwenden; der Kopfkommentar des Moduls hält fest: *„Adding an entry here is a deliberate act: it authorises a file to be pushed to the PRODUCTION database."*

Der Eintrag selbst stellt zudem fest, dass die Abhängigkeiten *„already present in the production remote history when this entry was added"* waren.

> **Verbleibende Unschärfe:** Der Allowlist-Eintrag belegt die **Autorisierung**, nicht zwingend die **Ausführung**. Zur abschließenden Klärung ist dieselbe Abfrage wie bei Oura auszuführen:
> ```sql
> select version, name, executed_at from supabase_migrations.schema_migrations
> where version = '20260902120000';
> ```

## 14. Zugriffsmodell nach der Behebung

| Rolle | Zugriff |
|---|---|
| `anon` | **nichts** — alle Grants entzogen, RLS an, keine anon-Policy |
| `authenticated` ohne Owner-Rolle | **null Zeilen**, jeder Schreibvorgang abgelehnt |
| `authenticated` mit `is_platform_owner()` | SELECT, INSERT, UPDATE, DELETE |
| `service_role` | unverändert vollständig (BYPASSRLS) |
| Sequenz | nur noch `service_role` |

**Bemerkenswert und richtig entschieden:** Es wurde `is_platform_owner()` gewählt und **nicht** `is_platform_admin()` — die strengere der beiden Rollen, ausdrücklich begründet damit, dass ein später hinzugefügter `cogniiq_admin` sonst stillschweigend Zugriff auf Lead-PII erhielte. **DELETE wurde bewusst an den Owner vergeben**, damit ein Löschverlangen nach Art. 17 DSGVO ohne Service-Role-Key erfüllbar ist. Beides ist vorausschauende Datenschutz-Gestaltung.

## 15. Unbekannte Punkte

| # | Offener Punkt | Warum es zählt |
|---|---|---|
| U-1 | **Herkunft der 50 Datensätze** — Kauf, Scraping, manuelle Recherche? | Art. 14 Abs. 2 lit. f DSGVO verlangt die Quellenangabe. Ohne sie ist keine rechtskonforme Information möglich |
| U-2 | **Wurde bereits jemand kontaktiert?** `status = 'new'` bei allen 50 spricht dagegen, schließt eine Ansprache außerhalb der Datenbank aber nicht aus | Entscheidet über § 7 UWG und über die Art.-14-Frist nach Abs. 3 lit. b |
| U-3 | **Wurde `fit_score` automatisiert vergeben?** | Entscheidet über Profiling nach Art. 4 Nr. 4 und die Informationspflicht nach Art. 14 Abs. 2 lit. g |
| U-4 | **Lesezugriffe im Zeitraum 30.07.–01.09.2026** | Dauerhaft unbeantwortbar (Logrotation) |
| U-5 | **Wurde die Behebung tatsächlich ausgeführt?** | Abfrage in Abschnitt 13 |
| U-6 | **Verarbeitet die n8n-Umgebung dieselben Leads?** Das Repository weist ausdrücklich darauf hin, dass n8n-Workflows nicht einsehbar sind | Eine Zweitkopie außerhalb Supabase wäre ein eigener Datenbestand mit eigenen Pflichten |
| U-7 | **Existiert eine dokumentierte Interessenabwägung nach Art. 6 Abs. 1 lit. f?** | Ohne sie fehlt die Rechtsgrundlage für die Speicherung |
| U-8 | **Enthalten die Datensätze Einzelpraxen oder Gemeinschaftspraxen?** | Beeinflusst, wie weit der Personenbezug reicht |

## 16. Offene Fragen für Art. 33 DSGVO

**LAWYER / DPO DECISION REQUIRED.**

1. Liegt eine Verletzung nach Art. 4 Nr. 12 DSGVO vor? Die **Zugriffsmöglichkeit** bestand unstreitig, ein tatsächlicher Zugriff ist nicht belegt.
2. Ist ein Risiko „unwahrscheinlich" i. S. v. Art. 33 Abs. 1? Abwägung: **dafür** — kein Logtreffer im geprüften Fenster, keine Schreibspuren, unbeworbene Nischendatei, keine besonderen Kategorien. **Dagegen** — triviale Enumerierbarkeit, 34 Tage, Direktidentifikatoren (Name, E-Mail, Telefon, Anschrift), Drittbetroffene, kein Logbeweis für 33 der 34 Tage.
3. Wann begann die 72-Stunden-Frist? Kandidat ist der Tag der positiven Feststellung vor dem 2026-09-02. Bei Meldepflicht wäre die Frist überschritten → Begründung nach Art. 33 Abs. 1 S. 2 erforderlich.
4. Ist die zusätzlich bestehende **Integritätsgefährdung** (INSERT/UPDATE/DELETE/TRUNCATE durch `anon`) eigenständig zu würdigen? Art. 32 Abs. 1 lit. b schützt Vertraulichkeit **und** Integrität.
5. Bildet dieser Vorfall mit dem Oura-Vorfall und der Execution-Tabellen-Exposition **einen** Sachverhalt (gleiche Ursache: fehlende REVOKE/RLS-Disziplin bei direkt gegen Hosted erstellten Tabellen) oder drei getrennte?

## 17. Offene Fragen für Art. 34 DSGVO

**LAWYER / DPO DECISION REQUIRED.**

1. Besteht ein **hohes** Risiko für die 50 betroffenen Personen? Die Daten sind weitgehend öffentlich verfügbar (Praxisanschriften stehen auf den Praxiswebsites). **Nicht öffentlich sind jedoch `fit_score` und `fit_notes`** — die interne Bewertung der Person durch Cogniiq. Deren Offenlegung ist das qualitativ eigenständige Risiko und der Punkt, der rechtlich am schwersten wiegt.
2. Greift Art. 34 Abs. 3 lit. b (nachträgliche Maßnahmen)? Die Behebung ist vollständig und belegt.
3. Wäre eine Benachrichtigung mit **unverhältnismäßigem Aufwand** verbunden (Art. 34 Abs. 3 lit. c)? Bei 50 Datensätzen mit hinterlegter E-Mail-Adresse **eher nicht**.
4. **Praktische Verschränkung mit Art. 14:** Eine Art.-14-Information ist ohnehin geschuldet und überfällig. Fällt eine Art.-34-Benachrichtigung hinzu, sind beide **in einer Mitteilung zusammenzuführen** — nicht in zwei getrennten Anschreiben, die denselben Empfänger zweimal irritieren.

## 18. Zusammenfassung der Beweislage

| Feststellung | Status |
|---|---|
| Tabelle ohne RLS und ohne REVOKE in Betrieb genommen | **PROVEN** |
| `anon` hielt SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER | **PROVEN** |
| Identity-Sequenz durch `anon` manipulierbar | **PROVEN** |
| 50 Datensätze mit Direktidentifikatoren Dritter betroffen | **PROVEN** |
| Über PostgREST ohne Login vollständig abrufbar | **PROVEN** |
| Enumeration trivial (fortlaufende IDs, kein Rate-Limiting) | **PROVEN** |
| Expositionsdauer 34 Tage | **PROVEN** |
| Keine unberechtigten **Schreib**zugriffe | **PROVEN** (starkes Negativ-Indiz aus `pg_stat_all_tables`) |
| Keine unberechtigten **Lese**zugriffe | **UNKNOWN** — für 33 von 34 Tagen dauerhaft unbeantwortbar |
| Behebung vollständig und korrekt | **PROVEN** |
| Behebung auf Produktion autorisiert | **PROVEN** (Allowlist); Ausführung per Abfrage zu bestätigen |
| Herkunft der Daten | **UNKNOWN** |
| Bereits erfolgte Ansprache | **UNKNOWN**, `status='new'` spricht dagegen |
