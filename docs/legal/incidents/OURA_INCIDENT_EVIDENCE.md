# OURA — INCIDENT EVIDENCE PRESERVATION

**Dokumenttyp:** Forensische Beweissicherung vor Löschung
**Erstellt:** 2026-09-22
**Anlass:** Geschäftsentscheidung des Inhabers, Oura dauerhaft aus `cogniiq_main` zu entfernen. Diese Dokumentation muss **vor** jeder Löschung abgeschlossen sein.
**Quellenbasis:** Repository `cogniiq2/cogniiq_main`, `origin/main` @ `6f97dd6`, vollständige Git-Historie.
**Nicht enthalten:** keine personenbezogenen Messwerte, keine Tokens, keine Secrets. Alle Geheimnisse sind maskiert.

> **Rechtliche Einordnung dieses Dokuments:** Es stellt Tatsachen fest und benennt Wissenslücken. Es trifft **keine** Aussage darüber, ob eine Meldung nach Art. 33 oder eine Benachrichtigung nach Art. 34 DSGVO erforderlich ist.
> **LAWYER / DPO DECISION REQUIRED.**

---

## ⚠️ VORBEMERKUNG — ZWEI OFFENE LIVE-RISIKEN

Beide müssen **vor** der Löschung geklärt werden, weil die Löschung die Beweismittel vernichtet.

### LIVE-RISK-1 — `sync-oura` ist eine unauthentifizierte Service-Role-Edge-Function

`supabase/config.toml` enthält im gesamten Repository genau eine Aussage zu dieser Funktion:

```toml
[functions.sync-oura]
verify_jwt = false
```

Die Funktion selbst führt **keinerlei** eigene Authentifizierung oder Autorisierung durch — verifiziert durch vollständige Durchsicht von `supabase/functions/sync-oura/index.ts`: kein Lesen des `Authorization`-Headers, kein `auth.getUser()`, kein Shared Secret, kein Origin-Check. Sie verwendet `SUPABASE_SERVICE_ROLE_KEY` (Zeile 453), der RLS grundsätzlich umgeht, und akzeptiert `connection_id` frei aus dem Request-Body (Zeile 470).

Gegenbeweis, dass dies produktiv so wirkt: Das Frontend sendet beim Aufruf **keinen** `Authorization`-Header (`src/pages/OuraAnalyticsPage.tsx:1157-1161` — nur `Content-Type: application/json`). Der Aufruf kann nur funktionieren, wenn `verify_jwt = false` auf dem Hosted-Projekt aktiv ist.

Zusätzlich: `Access-Control-Allow-Origin: *` (`sync-oura/index.ts:9`).

**Was damit möglich ist — präzise, ohne Übertreibung:**

| Möglich | Nicht möglich |
|---|---|
| Unauthentifizierter Aufruf der Funktion durch jeden, der die URL kennt (sie steht im öffentlich abrufbaren JS-Chunk, `OuraAnalyticsPage.tsx:41`) | **Kein Auslesen von Gesundheitsdaten über diese Funktion** — die Antwort enthält ausschließlich Zähler (`total_upserted`, `endpoint_count`, `success_count`, `error_count`) und Fehlertexte, keine Messwerte (Zeilen 509-521) |
| Blindes Orakel: `404 "Oura connection not found or missing access token"` vs. `200` bestätigt, ob eine geratene UUID eine gültige Connection ist | Enumeration ist praktisch nicht durchführbar: `connection_id` ist eine UUIDv4 (`gen_random_uuid()`), ~122 Bit Entropie |
| Mit bekannter `connection_id`: beliebig häufiges Erzwingen eines Syncs → Oura-API-Quota, Schreiblast, Kosten. Kein Rate-Limiting vorhanden | Kein Schreiben beliebiger Werte: die Daten kommen ausschließlich von `api.ouraring.com` |

**Wie eine `connection_id` abfließen könnte:** Sie steht im `localStorage` des Admin-Browsers (`OURA_CONNECTION_STORAGE_KEY`, Zeile 178) und wird im OAuth-Rücklauf über URL-Query **oder URL-Hash** übergeben (Zeilen 398-402) — Query-Parameter landen in Browser-Historie, Referrer und Server-Logs.

**Einstufung:** Fehlkonfiguration mit realem Missbrauchspotenzial, **aber kein nachgewiesener Pfad zur Offenlegung von Gesundheitsdaten.** Wird durch die geplante Entfernung vollständig beseitigt.

### LIVE-RISK-2 — Es ist nicht belegt, dass die schließende Migration jemals auf Produktion angewendet wurde

`20260731122000_case_d_legacy_convergence.sql` ist die Migration, die RLS und Policies auf allen 12 `oura_*`-Tabellen setzt und die drei wide-open Policies entfernt.

**Sie steht NICHT in der Produktions-Allowlist** (`.github/scripts/lib/supabase-migration-allowlist.mjs`). Die Allowlist enthält 13 Einträge: `20260711120000`, dann `20260826120000` bis `20260904120000`. Alles dazwischen fehlt.

**Wichtige Einschränkung, damit hieraus nichts Falsches gefolgert wird:** Die Allowlist steuert nur, was über den GitHub-Actions-Workflow nach Produktion gepusht werden darf. Ihr Kopfkommentar stellt ausdrücklich fest: *„A prerequisite does NOT have to be allowlisted itself — it only has to be applied."* Die gesamte Owner-Finance-Kette (`20260722120000` ff.) fehlt ebenfalls und ist nachweislich angewendet. Das Fehlen beweist also **nicht**, dass die Migration nicht angewendet wurde.

**Ergebnis: Der Anwendungsstatus ist aus dem Repository UNKNOWN.**

**Konsequenz:** Solange nicht verifiziert ist, dass `case_d` auf Produktion gelaufen ist, ist **nicht auszuschließen, dass die drei Policies `Allow frontend read oura activity/readiness/sleep` mit `roles={public}, qual=true` heute noch aktiv sind** — und damit Gesundheitsdaten weiterhin für jeden mit dem öffentlichen anon-Key lesbar wären.

**Das ist die dringendste Einzelprüfung dieses gesamten Dokuments** und muss vor jeder Löschung erfolgen (Verifikationsabfragen in Abschnitt 13).

---

## 1. Welche Datenarten existierten

Rekonstruiert aus `supabase/migrations/20260709120000_create_richer_oura_tables.sql`, `supabase/migrations/20260731122000_case_d_legacy_convergence.sql`, `supabase/functions/sync-oura/index.ts` und `.github/scripts/audit-supabase-history.mjs:282-345`.

| Tabelle | Datenarten |
|---|---|
| `oura_connections` | `access_token`, `refresh_token`, `expires_at` — **OAuth-Credentials im Klartext** |
| `oura_daily_sleep` | Schlafscore, Gesamtschlafdauer, Zeit im Bett, Effizienz, Einschlaflatenz, REM-/Tief-/Leichtschlafdauer, Wachzeit, Erholsamkeit, **durchschnittliche HRV, durchschnittliche Herzfrequenz, niedrigste Herzfrequenz, Atemfrequenz, Temperaturabweichung**, `contributors` (jsonb), `raw` (jsonb) |
| `oura_daily_readiness` | Readiness-Score, Temperaturabweichung, **HRV-Balance, Recovery-Index, Ruhepuls-Score, Körpertemperatur**, Vortagesaktivität, Schlaf-/Aktivitätsbalance, `raw` |
| `oura_daily_activity` | Aktivitätsscore, Schritte, Kalorien, Gehstrecke, Aktivitätszeiten nach Intensität, `raw` |
| `oura_heart_rate` | `timestamp`, **`bpm`**, `source`, `raw` — Herzfrequenz-Zeitreihe |
| `oura_sleep_sessions` | Sitzungs-ID, Typ, `bedtime_start`, `bedtime_end`, Score, `raw` |
| `oura_workouts` | Aktivität, Start/Ende, Kalorien, Distanz, `raw` |
| `oura_sessions` | Typ, Start/Ende, `raw` |
| `oura_tags` | Freitext-Tag, Start/Ende, `raw` |
| `oura_spo2` | **`spo2_percentage`** — Blutsauerstoffsättigung, `raw` |
| `oura_daily_stress` | **`stress_high`, `recovery_high`, `day_summary`**, `raw` |
| `oura_daily_resilience` | **`level`, `score`** — Resilienz, `raw` |

**Besonders zu beachten:** Jede Tabelle führt eine `raw jsonb`-Spalte mit der **unveränderten Oura-API-Antwort**. Deren Inhalt ist aus dem Repository nicht vollständig bestimmbar und kann Felder enthalten, die keine eigene Spalte haben. Der angeforderte OAuth-Scope war (`OuraAnalyticsPage.tsx:43`):

```
email personal daily heartrate workout tag session spo2Daily
```

`email` und `personal` sind darin enthalten. **`personal` liefert bei Oura Stammdaten wie Alter, Geschlecht, Größe und Gewicht.** Ob diese Felder tatsächlich abgerufen und in `raw` gespeichert wurden, ist aus dem Repository **nicht** feststellbar — `sync-oura` ruft keinen `personal`-Endpunkt ab (die 11 konfigurierten Endpunkte sind `daily_sleep`, `daily_readiness`, `daily_activity`, `sleep_sessions`, `workouts`, `sessions`, `tags`, `heartrate`, `spo2`, `daily_stress`, `daily_resilience`). **Der OAuth-Callback ist jedoch nicht im Repository** (Abschnitt 5a) und könnte beim Verbindungsaufbau weitere Daten gezogen haben. → **UNKNOWN, Prüfung erforderlich.**

## 2. Welche Daten personenbezogen waren

Alle. Jeder Datensatz ist über `connection_id` einer Oura-Verbindung und damit einer natürlichen Person zugeordnet (Fremdschlüssel auf `oura_connections(id)` in allen 11 Datentabellen). Es gibt **keine** Anonymisierung, **keine** Pseudonymisierung über die UUID hinaus und **keine** Aggregation.

`access_token` und `refresh_token` sind zusätzlich Authentifizierungsmerkmale, die Zugriff auf das Oura-Konto der betroffenen Person eröffnen.

## 3. Welche davon Gesundheitsdaten nach Art. 9 DSGVO waren

Gesundheitsdaten sind nach **Art. 4 Nr. 15 DSGVO** Daten, die sich auf die körperliche oder geistige Gesundheit einer natürlichen Person beziehen, einschließlich der Erbringung von Gesundheitsdienstleistungen, und aus denen Informationen über deren Gesundheitszustand hervorgehen. **ErwGr 35** stellt klar, dass dies auch Informationen umfasst, die aus der Prüfung oder Untersuchung eines Körperteils oder körpereigener Substanz abgeleitet werden.

| Datum | Einordnung |
|---|---|
| Herzfrequenz (`bpm`, `average_heart_rate`, `lowest_heart_rate`, `resting_heart_rate_score`) | **Art. 9** — Vitalparameter |
| Herzfrequenzvariabilität (`average_hrv`, `hrv_balance`) | **Art. 9** — Vitalparameter |
| Atemfrequenz (`respiratory_rate`) | **Art. 9** — Vitalparameter |
| Blutsauerstoffsättigung (`spo2_percentage`) | **Art. 9** — Vitalparameter |
| Körpertemperatur / Abweichung (`body_temperature`, `temperature_deviation`) | **Art. 9** — Vitalparameter |
| Schlafarchitektur (REM/Tief/Leicht/Wachzeit, Latenz, Effizienz) | **Art. 9** — medizinisch aussagekräftig (Schlafstörungen, Apnoe-Indikatoren) |
| Stress- und Resilienzwerte | **Art. 9** — Bezug zur geistigen Gesundheit |
| Readiness-/Recovery-Indizes | **Art. 9** — abgeleiteter Gesundheitszustand |
| Schritte, Distanz, Kalorien, Workouts | Art. 9 **nur im Kontext** — isoliert Aktivitätsdaten, zusammen mit den obigen Teil eines Gesundheitsprofils |
| Tags (Freitext) | **UNKNOWN** — Inhalt aus dem Repository nicht bestimmbar; Oura-Tags werden typischerweise für Symptome, Medikamente, Alkohol, Krankheit verwendet → **potenziell Art. 9** |

**Zusammenfassend: Der Datenbestand ist in seiner Gesamtheit ein Gesundheitsprofil nach Art. 9 Abs. 1 DSGVO.** Diese Einordnung ist nicht grenzwertig.

Ob die DSGVO überhaupt anwendbar ist, hängt von Abschnitt 15 ab (Haushaltsausnahme, Art. 2 Abs. 2 lit. c).

## 4. Welche Tabellen betroffen waren

**Auf Produktion tatsächlich vorhanden waren zum Zeitpunkt der Case-D-Prüfung (2026-07-31) fünf Tabellen**, ausdrücklich festgestellt in `20260731122000_case_d_legacy_convergence.sql:23-25` und `:95-97`:

> *„5 of 12 oura_* tables exist, bare-shape, none of the 'richer' columns this file adds"*
> *„5 oura tables present bare-shape with RLS enabled and the policies described above; 7 oura tables + tasks missing"*

| Tabelle | Auf Produktion (Stand 2026-07-31) | RLS-Zustand laut Case-D-Feststellung |
|---|---|---|
| `oura_daily_sleep` | ✅ vorhanden, bare-shape | RLS an, **Policy `roles={public}, qual=true`** → **jede Rolle, anon eingeschlossen, konnte alle Zeilen lesen** |
| `oura_daily_readiness` | ✅ vorhanden, bare-shape | ebenso |
| `oura_daily_activity` | ✅ vorhanden, bare-shape | ebenso |
| `oura_connections` | ✅ vorhanden | RLS an, **null Policies** → deny-all. Ausdrücklich **nicht** Teil dieser Exposition (`:45-47`) |
| `oura_heart_rate` | ✅ vorhanden | RLS an, null Policies → deny-all, **nicht** exponiert |
| `oura_sleep_sessions`, `oura_workouts`, `oura_sessions`, `oura_tags`, `oura_spo2`, `oura_daily_stress`, `oura_daily_resilience` | ❌ **auf Produktion nicht vorhanden** | entfällt |

**Wesentliche Einschränkung des Schadens, die festgehalten werden muss:** Exponiert waren **drei** Tabellen in *bare shape* — also mit den Spalten `id, connection_id, day, score, raw, synced_at` (plus `steps` bei activity), **nicht** mit den „richer"-Spalten, weil `20260709120000` auf Produktion nie angewendet wurde. Die dedizierten Vitalparameter-Spalten (`average_hrv`, `lowest_heart_rate`, `respiratory_rate`, `spo2_percentage` usw.) existierten dort **nicht**.

**Aber:** Die Spalte **`raw jsonb`** war in der bare shape enthalten und enthält die vollständige, unveränderte Oura-API-Antwort. **Die Vitalparameter waren damit trotzdem lesbar — nur in JSON statt in Spalten.** Diese Einschränkung reduziert den Umfang der Exposition also **nicht materiell**.

`oura_spo2`, `oura_daily_stress` und `oura_daily_resilience` existierten auf Produktion nicht und waren damit nicht betroffen.

## 5. Welche Policies existierten

**Vor der Behebung (auf Produktion, festgestellt read-only am/vor 2026-07-31):**

| Policy | Tabelle(n) | Rollen | Qualifier | Wirkung |
|---|---|---|---|---|
| `Allow frontend read oura sleep` | `oura_daily_sleep` | `{public}` | `true` | SELECT für **jede** Rolle, `anon` eingeschlossen, auf **alle** Zeilen |
| `Allow frontend read oura readiness` | `oura_daily_readiness` | `{public}` | `true` | ebenso |
| `Allow frontend read oura activity` | `oura_daily_activity` | `{public}` | `true` | ebenso |
| *(keine)* | `oura_connections`, `oura_heart_rate` | — | — | RLS an, keine Policy → deny-all |

**Diese drei Policies existieren in keiner Migrationsdatei des Repositories.** Sie wurden direkt gegen die Hosted-Datenbank angelegt — vermutlich während der Oura-Entwicklung am 08./09.07.2026, um das Dashboard zum Laufen zu bringen. Das ist derselbe Schema-Drift-Befund wie bei `execution_templates` / `execution_template_tasks`.

**Nach `20260731122000` (sofern angewendet — siehe LIVE-RISK-2):** Je Tabelle genau eine Policy `<tabelle>_admin_all`, `for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())`, plus `revoke all ... from public, anon, authenticated` und Neu-Grants ausschließlich an `authenticated` und `service_role` (`:736-762`).

## 6. Wer theoretisch Zugriff hatte

| Rolle | Vor Behebung | Nach Behebung |
|---|---|---|
| `anon` (öffentlicher Browser-Key, liegt im JS-Bundle) | **SELECT auf alle Zeilen** von `oura_daily_sleep`, `oura_daily_readiness`, `oura_daily_activity` | kein Zugriff (alle Grants entzogen, keine Policy) |
| `authenticated` (beliebiger eingeloggter Nutzer) | SELECT auf dieselben drei Tabellen (über dieselbe `{public}`-Policy) | nur bei `is_platform_admin()` |
| `authenticated` ohne Admin-Rolle (Kunde im Portal) | **SELECT auf dieselben drei Tabellen** | kein Zugriff |
| `service_role` (Edge Functions) | vollständig (BYPASSRLS) | unverändert vollständig |
| `postgres` / `supabase_admin` | vollständig | unverändert |
| Frontend-Route `/admin/oura-analytics` | hinter `PlatformAdminRoute` | unverändert |

**Wesentlich:** Die Absicherung der UI-Route über `PlatformAdminRoute` war für die Exposition **irrelevant**. Die Daten waren nicht über die UI exponiert, sondern über die **PostgREST-API** — `https://<projekt>.supabase.co/rest/v1/oura_daily_sleep?select=*` mit dem öffentlichen anon-Key, ohne Login, ohne die Anwendung überhaupt zu benutzen.

## 5a. NICHT IM REPOSITORY: der OAuth-Callback

`src/pages/OuraAnalyticsPage.tsx:40` verweist auf:

```
https://<PROJEKT-REF>.supabase.co/functions/v1/oura-callback
```

**Diese Edge Function existiert in keinem Commit der gesamten Repository-Historie.** Verifiziert durch Durchsuchen aller Commits: das Verzeichnis `supabase/functions/` enthielt zu keinem Zeitpunkt ein `oura-callback`.

Sie ist gleichwohl funktional zwingend: Sie ist die `redirect_uri` des OAuth-Flows (`OuraAnalyticsPage.tsx:1135`), empfängt den Authorization Code, tauscht ihn gegen `access_token`/`refresh_token`, schreibt diese in `oura_connections` und gibt die `connection_id` an das Frontend zurück (`connected` / `connectionId` Parameter, `OuraAnalyticsPage.tsx:398-402`).

**Forensische Konsequenzen:**
- Ihr Quellcode ist **nicht auditierbar**. Was sie sonst noch tut — welche Scopes sie ausliest, ob sie `personal`- oder `email`-Daten speichert, ob sie loggt, ob sie `verify_jwt` gesetzt hat — ist **UNKNOWN**.
- Sie verwaltet das **Client Secret** der Oura-OAuth-App, das nirgends im Repository auftaucht (`VITE_OURA_CLIENT_ID` ist nur die öffentliche Client-ID, `src/vite-env.d.ts:6`).
- **Sie wird durch eine Löschung im Repository nicht entfernt.** Sie muss separat auf Supabase gelöscht werden (Removal Plan, Schritt R-7).

## 7. War anon SELECT möglich?

**JA — PROVEN**, für `oura_daily_sleep`, `oura_daily_readiness`, `oura_daily_activity`.

Beleg, wörtlich aus `20260731122000_case_d_legacy_convergence.sql:41-44`:

> *„public.oura_daily_sleep / oura_daily_readiness / oura_daily_activity: RLS is enabled, but each carries a PERMISSIVE policy ('Allow frontend read oura ...') with `roles = {public}` and `qual = true` -- i.e. every role, anon included, can already SELECT every row of these three tables."*

Die Feststellung wurde ausdrücklich **read-only gegen das Hosted-Projekt verifiziert, bevor eine Zeile dieser Migration geschrieben wurde** (`:33-34`).

**NEIN** für `oura_connections` und `oura_heart_rate` — beide RLS an, null Policies, deny-all. Ausdrücklich als **nicht** Teil dieser Exposition festgehalten (`:45-47`). **Die OAuth-Tokens waren damit nicht anonym lesbar.**

## 8. War anon WRITE möglich?

**UNKNOWN — und diese Lücke ist ernst zu nehmen.**

Die Case-D-Migration stellt für die `oura_*`-Tabellen ausschließlich die **SELECT**-Exposition fest. Für die Execution-Tabellen benennt sie dagegen ausdrücklich Schreibrechte: *„anon/authenticated/service_role all hold full INSERT/SELECT/UPDATE/DELETE grants"* (`:37-40`).

Dass für die Oura-Tabellen keine entsprechende Feststellung getroffen wurde, lässt zwei Lesarten zu:
1. Es bestanden keine anon-Schreibrechte (dann wäre die Feststellung vollständig).
2. Die Grants wurden für diese Tabellen nicht separat erhoben (dann wäre sie lückenhaft).

**Indiz für Lesart 1:** Die Migration führt für die Oura-Tabellen dennoch ein pauschales `revoke all on table ... from public, anon, authenticated` aus (`:757`) — dieselbe Vorsichtsmaßnahme wie bei den anderen Tabellen.

**Indiz für Lesart 2 — und das ist das gewichtigere:** Supabase vergibt im `public`-Schema per Default-Privileges `ALL` auf jede neu erstellte Tabelle an `anon` und `authenticated`. Genau dieser Mechanismus ist im Repository dokumentiert — in `20260902120000_receptionist_leads_pii_rls.sql:7-11`:

> *„On Supabase the `public` schema carries default privileges that grant ALL on every new table to `anon` and `authenticated`, so a table created without an explicit REVOKE inherits full CRUD for the anonymous role."*

Die Oura-Tabellen wurden ohne expliziten REVOKE erstellt. **Es ist daher wahrscheinlich, aber nicht belegt, dass `anon` auch INSERT/UPDATE/DELETE hielt.** Bei aktivem RLS ohne passende Policy wären Schreibvorgänge allerdings von RLS blockiert worden — **mit Ausnahme von TRUNCATE**, das von RLS grundsätzlich nicht gefiltert wird (ebenfalls im Repository festgehalten, `…pii_rls.sql`, Abschnitt zur REVOKE-Begründung).

**Konkrete Restgefahr in Lesart 2: ein anonymer `TRUNCATE public.oura_daily_sleep` wäre möglich gewesen** — ein Integritäts-, kein Vertraulichkeitsproblem.

→ **Zu verifizieren vor der Löschung** (Abfrage in Abschnitt 13).

## 9. Exakter Zeitraum der möglichen Exposition

| Ereignis | Datum | Belegqualität |
|---|---|---|
| Erster Oura-Commit — `52d4642` „Add Oura Analytics admin integration" | **2026-07-08, 15:52:01 +0200** | PROVEN (Git) |
| `02fc767` „Fix Oura Analytics hash callback state" | 2026-07-08, 16:45:55 +0200 | PROVEN (Git) |
| `5d5b012` „Upgrade Oura Analytics health intelligence dashboard" | 2026-07-09, 08:00:10 +0200 | PROVEN (Git) |
| `f0c8942` „Upgrade Oura sync Edge Function" — Migrationsdatei entsteht | 2026-07-09, 08:10:21 +0200 | PROVEN (Git) |
| `586052c` „Polish admin navigation and Oura theming" | 2026-07-09, 08:44:30 +0200 | PROVEN (Git) |
| **Anlage der Tabellen und der drei `{public}`-Policies auf Produktion** | **UNKNOWN** — kein Migrationsartefakt, direkt gegen Hosted ausgeführt | **NICHT belegbar**; plausibel im Fenster 08.–09.07.2026 |
| `8bbefcd` „Remove Oura changes from Phase 0 migrations" | 2026-07-11, 06:46:22 +0200 | PROVEN (Git) |
| Case-D-Migration verfasst, Exposition read-only festgestellt | **2026-07-31** (`4dde1ee`, 06:46:29 UTC) | PROVEN (Git) |
| **Anwendung von `20260731122000` auf Produktion** | **UNKNOWN** — nicht in der Allowlist, kein Anwendungsnachweis im Repository | **NICHT belegbar** → LIVE-RISK-2 |

**Daraus ergibt sich:**

- **Belegbarer Beginn:** frühestens 2026-07-08 (der Code, der die Policies brauchte, existierte vorher nicht).
- **Belegbares Bestehen:** mindestens bis **2026-07-31** — an diesem Tag wurde die Exposition read-only gegen Produktion verifiziert und war zu diesem Zeitpunkt **aktiv**.
- **Belegbares Ende:** **keines.** Das Ende hängt an der Anwendung von `case_d`, für die kein Nachweis existiert.

> **Mindestdauer: 23 Tage (08.07.–31.07.2026), PROVEN.**
> **Tatsächliche Dauer: UNKNOWN. Ein Fortbestehen bis heute (22.09.2026, 76 Tage) ist aus dem Repository nicht ausgeschlossen.**

## 10. Commit/Migration, die die Exposition erzeugte

**Keine Migration.** Das ist der zentrale Befund.

Die drei Policies `Allow frontend read oura activity/readiness/sleep` und die fünf Tabellen wurden **direkt gegen die Hosted-Datenbank** erstellt, ohne Migrationsdatei. Die einzige Oura-Migration im Repository (`20260709120000_create_richer_oura_tables.sql`) enthält **null** Treffer für `enable row level security` und **null** für `create policy` (verifiziert) — sie kann diese Policies also nicht erzeugt haben, und sie wurde auf Produktion ohnehin nie angewendet.

**Verursachender Commit im Sinne der auslösenden Entwicklungsarbeit:** `52d4642` (2026-07-08) bis `586052c` (2026-07-09). Die Policies wurden manuell ergänzt, damit `OuraAnalyticsPage.tsx:1076-1078` — drei `supabase.from('oura_daily_*').select('*')`-Aufrufe über den Browser-Client — überhaupt Zeilen zurückgeben.

**Die eigentliche Ursache ist damit ein Architekturfehler, kein Tippfehler:** Ein Admin-Dashboard las Gesundheitsdaten über den öffentlichen Browser-Client statt über eine authentifizierte serverseitige Funktion. Um das zum Laufen zu bringen, wurde die Leseberechtigung auf `{public}` geöffnet.

## 11. Commit/Migration, die sie schloss

`supabase/migrations/20260731122000_case_d_legacy_convergence.sql`, Abschnitt 3 (`:730-763`), erstmals als `4dde1ee` am **2026-07-31** in das Repository aufgenommen.

Wirkung je `oura_*`-Tabelle:
```sql
alter table public.<t> enable row level security;
drop policy if exists 'Allow frontend read oura activity'  on public.<t>;
drop policy if exists 'Allow frontend read oura readiness' on public.<t>;
drop policy if exists 'Allow frontend read oura sleep'     on public.<t>;
create policy <t>_admin_all on public.<t>
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on table public.<t> from public, anon, authenticated;
grant select, insert, update, delete on table public.<t> to authenticated;
grant select, insert, update, delete on table public.<t> to service_role;
```

**Diese Migration schließt die Lücke im Code korrekt und vollständig.** Ob sie auf Produktion gelaufen ist: **UNKNOWN** (LIVE-RISK-2).

## 12. Sind tatsächliche unberechtigte Zugriffe nachweisbar?

**NEIN — und ebenso wenig ist ihr Ausbleiben nachweisbar.**

Aus dem Repository lässt sich kein einziger Zugriff belegen oder ausschließen. Es existiert **keine** Logauswertung für die Oura-Tabellen — anders als bei den Leads, wo ein 24-Stunden-Fenster geprüft wurde.

Die Case-D-Migration argumentiert (`:48-53`) lediglich, dass **kein ausgelieferter Codepfad** die Exposition benötigte:

> *„Neither exposure is justified by any shipped code path: every frontend surface that reads these tables (TaskDashboardContent, ExecutionPage, OuraAnalyticsPage) is mounted behind PlatformAdminRoute (authenticated + is_platform_admin()) and sync-oura writes via the service_role key, which always bypasses RLS regardless of policy contents."*

**Diese Aussage ist zutreffend, beantwortet aber eine andere Frage.** Sie zeigt, dass die eigene Anwendung die offene Policy nicht brauchte — nicht, dass niemand sie genutzt hat. Ein Zugriff über PostgREST mit dem anon-Key hätte die Anwendung gar nicht berührt.

**Eine belastbare Aussage ist daher aus dem Repository nicht möglich. UNKNOWN.**

## 13. Welche Logs dafür vorhanden sind

| Quelle | Verfügbarkeit | Reichweite |
|---|---|---|
| Supabase `edge_logs` (PostgREST-Zugriffe) | vorhanden | **ca. 24 Stunden** auf dem in diesem Projekt genutzten Plan (im Repository festgestellt: `…pii_rls.sql:55-57`, „the log window Supabase exposes is capped at 24 hours") |
| Supabase `postgrest_logs`, `postgres_logs`, `function_logs` | vorhanden | dieselbe Begrenzung |
| Anwendungsseitiges Zugriffsprotokoll | **existiert nicht** | — |
| `owner_audit_log` | existiert, deckt **nur** Owner-Finance-Tabellen ab | keine Oura-Abdeckung |
| Cloudflare-Logs | **irrelevant** — PostgREST-Zugriffe laufen direkt gegen `*.supabase.co`, nicht über die Website | — |

**Ohne Aufbewahrung über 24 Stunden hinaus kann der Zeitraum vom 08.07. bis mindestens 31.07.2026 nachträglich nicht mehr ausgewertet werden.** Die Logs dieses Zeitraums sind seit langem rotiert.

### Verifikationsabfragen — VOR jeder Löschung auszuführen

Read-only, gegen die Produktionsdatenbank. Ergebnisse als Screenshot oder Textausgabe zur Vorfallsakte nehmen.

```sql
-- V1: Bestehen die wide-open Policies HEUTE noch? (entscheidet LIVE-RISK-2)
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename like 'oura%'
order by tablename, policyname;

-- V2: Ist RLS je Tabelle aktiv?
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relname like 'oura%'
order by relname;

-- V3: Welche Rollen halten heute welche Grants? (beantwortet Abschnitt 8)
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type)
from information_schema.role_table_grants
where table_schema = 'public' and table_name like 'oura%'
group by table_name, grantee
order by table_name, grantee;

-- V4: Wurde die schliessende Migration je angewendet?
select version, name, executed_at
from supabase_migrations.schema_migrations
where version in ('20260709120000','20260731122000','20260902120000')
order by version;

-- V5: Welche Oura-Tabellen existieren heute, und wie viele Zeilen?
select c.relname, (select count(*) from pg_class x where x.oid = c.oid) as exists_marker
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname like 'oura%'
order by c.relname;
-- je Tabelle anschliessend: select count(*) from public.<tabelle>;

-- V6: Wie viele betroffene Personen? (Zeilenzahl, KEINE Inhalte)
select count(*) as connection_count from public.oura_connections;

-- V7: Zeitlicher Rahmen der Daten (Metadaten, keine Messwerte)
select min(synced_at), max(synced_at), min(day), max(day) from public.oura_daily_sleep;

-- V8: Existiert die out-of-repo Edge Function oura-callback noch?
--     Nicht per SQL: Supabase Dashboard -> Edge Functions, bzw.
--     supabase functions list --project-ref <REF>

-- V9: Enthaelt raw jsonb Stammdaten aus dem `personal`-Scope?
--     NUR Schluesselnamen ausgeben, KEINE Werte:
select distinct jsonb_object_keys(raw) as key_name
from public.oura_daily_sleep
where raw is not null
limit 100;
```

> **Achtung:** V9 gibt Schlüsselnamen aus, keine Werte. Die Ergebnisse von V1–V9 gehören in die Vorfallsakte, **nicht** in dieses Repository.

## 14. Welche Logs fehlen

1. **PostgREST-Zugriffslogs vom 08.07. bis 31.07.2026** — rotiert, unwiederbringlich. Das ist die Lücke, die eine definitive Aussage zu unberechtigten Zugriffen dauerhaft verhindert.
2. **Jede Logauswertung für die Oura-Tabellen überhaupt** — anders als bei den Leads wurde für Oura nie eine 24-Stunden-Stichprobe erhoben und dokumentiert.
3. **Logs der Edge Function `oura-callback`** — die Funktion ist nicht im Repository; ob sie loggt, ist UNKNOWN.
4. **Ein Anwendungsnachweis für `20260731122000`** — ohne ihn ist das Ende des Expositionszeitraums unbestimmt.
5. **Anlagezeitpunkt der drei `{public}`-Policies** — nur über `pg_stat`-Metadaten oder Supabase-Audit-Historie rekonstruierbar, falls dort verfügbar.

## 15. Anzahl potentiell betroffener Personen

**Aus dem Repository nicht bestimmbar.** Die Zahl entspricht der Zeilenzahl in `oura_connections` (Abfrage V6).

**Starke Indizien für genau eine betroffene Person:**
- Die Route liegt unter `/admin/oura-analytics`, hinter `PlatformAdminRoute`, also im internen Bereich.
- Die `connection_id` wird in **einem einzelnen** `localStorage`-Schlüssel gehalten (`OURA_CONNECTION_STORAGE_KEY`), ohne jede Mandantenfähigkeit.
- Das Dashboard lädt ohne jeden `connection_id`-Filter: `supabase.from('oura_daily_sleep').select('*').order('day').limit(30)` (`:1076-1078`) — es geht implizit davon aus, dass alle Zeilen derselben Person gehören.
- Es gibt keine Nutzerverwaltung, keine Verknüpfung zu `profiles`, keine Auswahl mehrerer Verbindungen.

**Vorbehaltlich der Bestätigung durch V6: eine Person, mutmaßlich der Inhaber selbst.**
→ **NEEDS BUSINESS CONFIRMATION.** Diese Frage ist für die Art.-33/34-Bewertung entscheidend (Abschnitt 17/18).

## 16. Bereits getroffene Maßnahmen

| Maßnahme | Datum | Status |
|---|---|---|
| Exposition read-only gegen Produktion festgestellt und schriftlich dokumentiert | 2026-07-31 | ✅ erfolgt, im Migrationskommentar festgehalten |
| Schließende Migration verfasst: RLS an, `{public}`-Policies entfernt, anon-Grants entzogen, `is_platform_admin()`-Policy gesetzt | 2026-07-31 | ✅ im Code erfolgt |
| Datenerhaltung abgesichert (Snapshot vor DDL, Zeilenzahl-Assertion nach DDL) | 2026-07-31 | ✅ (`:765-786`) |
| Idempotenz und Lauffähigkeit auf drei Ausgangszuständen sichergestellt | 2026-07-31 | ✅ (`:81-90`) |
| Regressionstests | — | ✅ `.github/scripts/sql/case-d-legacy-convergence-fresh-tests.sql`, `-partial-tests.sql` |
| **Anwendung auf Produktion** | — | ❌ **nicht belegt** |
| **Vorfallsdokumentation nach Art. 33 Abs. 5** | — | ❌ **bis heute nicht erstellt** — dieses Dokument ist der erste Schritt dazu |
| **Meldeentscheidung** | — | ❌ nicht getroffen |
| **Absicherung von `sync-oura`** (`verify_jwt = false`) | — | ❌ unverändert offen (LIVE-RISK-1) |
| **Verschlüsselung der OAuth-Tokens** | — | ❌ unverändert Klartext |
| **Widerruf der Oura-OAuth-Autorisierung** | — | ❌ offen — gehört in den Removal Plan |

## 17. Offene Fragen für Art. 33 DSGVO

**LAWYER / DPO DECISION REQUIRED.** Die folgenden Punkte sind zu klären, bevor über eine Meldung entschieden werden kann:

1. **Ist die DSGVO überhaupt anwendbar?** Betrifft der Datenbestand ausschließlich den Inhaber selbst, greift möglicherweise die Haushaltsausnahme nach **Art. 2 Abs. 2 lit. c DSGVO**. Dagegen spricht, dass die Verarbeitung in einer geschäftlich betriebenen Infrastruktur mit Kundendaten stattfand und über eine Admin-Oberfläche des Unternehmens ausgewertet wurde. **Dies ist die Vorfrage, von der alles Weitere abhängt.**
2. **Liegt eine Verletzung des Schutzes personenbezogener Daten nach Art. 4 Nr. 12 DSGVO vor?** Eine unbefugte Offenlegung setzt keinen nachgewiesenen Zugriff voraus; die Herstellung der Zugriffsmöglichkeit kann genügen. Bewertung erforderlich.
3. **Ist ein Risiko für die Rechte und Freiheiten „unwahrscheinlich"** i. S. v. Art. 33 Abs. 1 Hs. 2? Abwägungsfaktoren: besondere Datenkategorie (spricht dagegen), sehr kleine Betroffenenzahl (spricht dafür), fehlende Direktidentifikatoren in den drei exponierten Tabellen — dort steht keine E-Mail, kein Name, nur eine UUID (spricht dafür), unbestimmte Expositionsdauer (spricht dagegen), fehlende Logauswertung (spricht dagegen).
4. **Wann begann die 72-Stunden-Frist nach Art. 33 Abs. 1?** Kandidat: 2026-07-31, der Tag der positiven Feststellung. Falls meldepflichtig, wäre die Frist deutlich überschritten — Art. 33 Abs. 1 S. 2 verlangt dann eine **Begründung der Verzögerung**.
5. **Ist LIVE-RISK-2 ein fortdauernder Vorfall?** Ergibt Abfrage V1, dass die Policies noch bestehen, läuft die Exposition bis heute. Das ändert Fristbeginn und Bewertung grundlegend.
6. **Ist `sync-oura` mit `verify_jwt = false` ein eigener meldepflichtiger Sachverhalt** oder nur eine Schwachstelle ohne Offenlegung? Nach hier vertretener technischer Analyse besteht **kein Pfad zur Offenlegung von Gesundheitsdaten** über diese Funktion — die rechtliche Einordnung bleibt dem Anwalt vorbehalten.
7. **Sind die nicht ausgewerteten Execution-Tabellen Teil desselben Vorfalls?** `execution_days` (26 Zeilen), `execution_tasks` (349 Zeilen), `execution_templates` (7), `execution_template_tasks` (94) waren **ohne RLS und mit vollen anon-CRUD-Grants** exponiert. Ob sie personenbezogene Daten enthalten, ist aus dem Repository nicht bestimmbar → separate Prüfung erforderlich.

## 18. Offene Fragen für Art. 34 DSGVO

**LAWYER / DPO DECISION REQUIRED.**

1. **Besteht ein „hohes Risiko" für die betroffene Person?** Gesundheitsdaten sprechen dafür; eine einzelne, identische Person als Betroffene und Verantwortliche spricht dagegen.
2. **Ist die Person mit dem Verantwortlichen identisch?** Ist die betroffene Person der Inhaber selbst, läuft Art. 34 praktisch leer — die Benachrichtigung erfolgte durch die Kenntnis selbst. **Bestätigung über V6 und die Inhaberauskunft erforderlich.**
3. **Greift eine Ausnahme nach Art. 34 Abs. 3?** Insbesondere lit. a (Verschlüsselung — hier **nicht** gegeben, Klartext) oder lit. b (nachträgliche Maßnahmen, die das hohe Risiko ausschließen — die Behebung im Code spricht dafür, die ungeklärte Anwendung dagegen).
4. **Falls weitere Personen betroffen sind:** Benachrichtigung in klarer und einfacher Sprache, mit Art, Folgen und Maßnahmen — und dann auch mit der Angabe, dass der Expositionszeitraum nach oben nicht abschließend bestimmbar ist.

---

## 19. Zusammenfassung der Beweislage

| Feststellung | Status |
|---|---|
| Gesundheitsdaten nach Art. 9 wurden verarbeitet | **PROVEN** |
| Drei Tabellen waren für `anon` per SELECT lesbar | **PROVEN** (read-only gegen Hosted verifiziert) |
| Vitalparameter waren über die Spalte `raw` mit erfasst | **PROVEN** |
| OAuth-Tokens waren **nicht** anonym lesbar | **PROVEN** |
| Die Exposition bestand mindestens vom 08.07. bis 31.07.2026 | **PROVEN** (23 Tage) |
| Die Exposition wurde im Code korrekt geschlossen | **PROVEN** |
| Die Behebung wurde auf Produktion angewendet | **UNKNOWN** ← kritisch |
| `anon` hatte auch Schreibrechte | **UNKNOWN**, eher wahrscheinlich |
| Tatsächliche unberechtigte Zugriffe fanden statt | **UNKNOWN** — weder belegbar noch ausschließbar |
| Anzahl Betroffener | **UNKNOWN**, mutmaßlich 1 |
| `sync-oura` ist unauthentifiziert erreichbar | **PROVEN** |
| Über `sync-oura` sind Gesundheitsdaten auslesbar | **FALSE** — die Antwort enthält nur Zähler |
| Der OAuth-Callback ist nicht auditierbar | **PROVEN** (existiert in keinem Commit) |

**Bis V1–V9 ausgeführt sind, darf nichts gelöscht werden.** Die Löschung vernichtet die Beweismittel für die Punkte, die heute noch UNKNOWN sind.
