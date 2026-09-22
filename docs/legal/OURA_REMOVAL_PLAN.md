# OURA REMOVAL PLAN

**Erstellt:** 2026-09-22
**Zielzustand:** `cogniiq_main` enthält keine Oura-Funktionalität und keine personenbezogenen Oura-Daten mehr — weder im Repository noch in der Produktionsdatenbank noch in der Supabase-Function-Umgebung.
**Status:** **PLAN — NICHT AUSGEFÜHRT. NICHT DEPLOYT.**

> ## ⛔ SPERRE
> Kein Schritt dieses Plans darf ausgeführt werden, bevor
> **(1)** die Verifikationsabfragen V1–V9 aus `docs/legal/incidents/OURA_INCIDENT_EVIDENCE.md` §13 ausgeführt **und** ihre Ergebnisse außerhalb des Repositories zur Vorfallsakte genommen wurden, und
> **(2)** der Inhaber die Freigabe erteilt hat.
>
> **Grund:** Die Löschung vernichtet die Beweismittel für alle in der Evidenzdokumentation als UNKNOWN markierten Punkte — insbesondere dafür, ob die wide-open Policies heute noch bestehen (LIVE-RISK-2), ob `anon` Schreibrechte hielt, wie viele Personen betroffen sind und welche Schlüssel die `raw`-Spalten führen. Diese Fragen sind nach der Löschung **dauerhaft unbeantwortbar**.

---

## 1. Dependency Graph

```
                        ┌─────────────────────────────────────────┐
                        │  EXTERN (ausserhalb Repo & Datenbank)   │
                        ├─────────────────────────────────────────┤
  [X-1] Oura OAuth-App (cloud.ouraring.com)                       │
        └── Client Secret, Autorisierung der Verbindung           │
  [X-2] Edge Function `oura-callback` (nur auf Supabase gehostet) │
        └── nie im Repository; Quellcode unbekannt                │
                        └─────────────────────────────────────────┘
                                      │ schreibt Tokens
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  DATENBANK                                                               │
├──────────────────────────────────────────────────────────────────────────┤
│  oura_connections  (access_token, refresh_token — Klartext)              │
│        │ FK connection_id (on delete cascade)                            │
│        ├── oura_daily_sleep        ┐                                     │
│        ├── oura_daily_readiness    │ auf Produktion vorhanden (5 Tab.)   │
│        ├── oura_daily_activity     │                                     │
│        ├── oura_heart_rate         ┘                                     │
│        ├── oura_sleep_sessions     ┐                                     │
│        ├── oura_workouts           │                                     │
│        ├── oura_sessions           │ nur in der Migrationsdatei,         │
│        ├── oura_tags               │ auf Produktion NICHT vorhanden      │
│        ├── oura_spo2               │ (Stand 2026-07-31)                  │
│        ├── oura_daily_stress       │                                     │
│        └── oura_daily_resilience   ┘                                     │
│  + je Tabelle: RLS, Policy <t>_admin_all, Grants, Unique-Index           │
└──────────────────────────────────────────────────────────────────────────┘
          ▲ schreibt (service_role)          ▲ liest (anon/browser-client)
          │                                   │
┌─────────────────────────┐      ┌────────────────────────────────────────┐
│  EDGE FUNCTION          │      │  FRONTEND                              │
│  sync-oura              │      │  src/pages/OuraAnalyticsPage.tsx       │
│  + config.toml-Eintrag  │      │   ├─ Route /admin/oura-analytics       │
│    verify_jwt = false   │      │   ├─ App.tsx:522 (lazy import)         │
│    ⚠ LIVE-RISK-1        │      │   ├─ App.tsx:647 (Route)               │
└─────────────────────────┘      │   ├─ internalNavigation.ts (Modul)     │
                                 │   ├─ commandItems.ts (Command Palette) │
                                 │   ├─ index.css (--oura-* Design-Token) │
                                 │   ├─ vite-env.d.ts VITE_OURA_CLIENT_ID │
                                 │   └─ localStorage oura_connection_id   │
                                 └────────────────────────────────────────┘
                                             │
                                 ┌───────────────────────────────────────┐
                                 │  TESTS / DOCS / CI                    │
                                 │  internalNavigation.test.ts           │
                                 │  adminThemeScope.test.tsx (Kommentar) │
                                 │  audit-supabase-history.mjs (§282-414)│
                                 │  docs/admin-center.md, unified-...    │
                                 │  ROUTING_GUIDE.md, phase-0-security-  │
                                 │  audit.md, scripts/staging/*          │
                                 └───────────────────────────────────────┘
```

**Kritische Kanten:**
- `oura_connections` ist Parent aller Datentabellen mit `on delete cascade`. Ein `drop table oura_connections cascade` reißt alles mit — das ist bequem, aber für die Beweissicherung **nach** dem Export zu tun.
- `audit-supabase-history.mjs` **erwartet** die Oura-Tabellen im Schema-Dump (`:282-345`, `:400-414`). Wird die Datenbank bereinigt, ohne dieses Skript anzupassen, **schlägt die CI fehl**.
- `internalNavigation.test.ts:64-66` behauptet, dass Oura **nicht** in der Business-Navigation erscheint. Dieser Test bleibt nach der Entfernung grün, muss aber inhaltlich angepasst werden, weil er sonst eine Route referenziert, die es nicht mehr gibt.
- Die `--oura-*`-CSS-Variablen werden laut `adminThemeScope.test.tsx:9` **auch von `ExecutionPage` gelesen**. → **Nicht blind löschen** (Abschnitt 4, Schritt R-5).

## 2. Was NICHT gelöscht werden darf

| Objekt | Warum |
|---|---|
| `supabase/migrations/20260709120000_create_richer_oura_tables.sql` | **Historische Migrationsdatei.** Sie ist Teil der deklarierten Migrationshistorie und wird von `audit-supabase-history.mjs:31-35` namentlich erwartet. Löschen würde die Historie verfälschen und ist zugleich **Beweismittelvernichtung** — die Datei dokumentiert, welche Datenarten existierten. **Bleibt im Repository.** |
| `supabase/migrations/20260731122000_case_d_legacy_convergence.sql` | Dieselben Gründe. Sie ist zusätzlich das **zentrale Beweisdokument** des Vorfalls (Feststellung der Exposition). **Bleibt unverändert.** |
| `.github/scripts/sql/case-d-legacy-convergence-*.sql` | Regressionstests zur behebenden Migration; Teil der Beweiskette |
| `docs/legal/incidents/OURA_INCIDENT_EVIDENCE.md` | Die Vorfallsakte selbst |
| `HONESTY-AUDIT.md`, `docs/phase-0-security-audit.md` | Historische Auditartefakte |

**Regel:** Migrationshistorie ist ein Protokoll, kein Zustand. Der Zustand wird durch eine **neue, additive Migration** geändert — nicht durch Umschreiben der Vergangenheit.

## 3. Migration Requirements

**Eine neue, destruktive Migration ist erforderlich.** Begründung:

- Das Repository zu bereinigen entfernt **keine einzige Zeile** aus der Produktionsdatenbank. Die Gesundheitsdaten blieben dort liegen.
- Die Tabellen wurden überwiegend **direkt gegen Hosted** erstellt, ohne Migrationsdatei. Es gibt also kein „Zurückrollen", nur ein explizites Entfernen.
- Art. 17 DSGVO und die Geschäftsentscheidung verlangen die **tatsächliche Löschung der Daten**, nicht nur den Rückbau der Oberfläche.

**Entwurf** — `supabase/migrations/<TS>_remove_oura_integration.sql`:

```sql
-- =============================================================================
-- Remove the Oura integration in full.
--
-- BUSINESS DECISION (2026-09-22): Oura is no longer part of this project.
-- The data is health data under Art. 9 GDPR and has no business purpose here.
--
-- PRECONDITION, NON-NEGOTIABLE: the forensic verification queries V1-V9 in
-- docs/legal/incidents/OURA_INCIDENT_EVIDENCE.md must have been executed and
-- their results filed BEFORE this migration runs. This migration destroys the
-- evidence for every question still marked UNKNOWN there.
--
-- Historical migrations 20260709120000 and 20260731122000 are NOT edited. They
-- remain the record of what existed and what was fixed.
-- =============================================================================

begin;

-- 1. Record what is about to be destroyed (row counts only, NEVER values).
--    Print this before dropping; it is the last chance to capture the scale.
do $$
declare t text; c bigint;
begin
  foreach t in array array[
    'oura_connections','oura_daily_sleep','oura_daily_readiness','oura_daily_activity',
    'oura_heart_rate','oura_sleep_sessions','oura_workouts','oura_sessions','oura_tags',
    'oura_spo2','oura_daily_stress','oura_daily_resilience'
  ] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('select count(*) from public.%I', t) into c;
      raise notice 'oura removal: public.% held % rows', t, c;
    else
      raise notice 'oura removal: public.% absent', t;
    end if;
  end loop;
end;
$$;

-- 2. Drop the child tables first, then the parent. Explicit order instead of a
--    single CASCADE so nothing outside this list can be swept along silently.
drop table if exists public.oura_daily_resilience;
drop table if exists public.oura_daily_stress;
drop table if exists public.oura_spo2;
drop table if exists public.oura_tags;
drop table if exists public.oura_sessions;
drop table if exists public.oura_workouts;
drop table if exists public.oura_sleep_sessions;
drop table if exists public.oura_heart_rate;
drop table if exists public.oura_daily_activity;
drop table if exists public.oura_daily_readiness;
drop table if exists public.oura_daily_sleep;
drop table if exists public.oura_connections;

-- 3. Post-condition: nothing named oura* may remain in the public schema.
do $$
declare leftover text;
begin
  select string_agg(relname, ', ' order by relname) into leftover
  from pg_class
  where relnamespace = 'public'::regnamespace
    and relkind in ('r','v','m','p')
    and relname like 'oura%';
  if leftover is not null then
    raise exception 'oura removal incomplete: % still present', leftover;
  end if;
end;
$$;

commit;
```

**Eigenschaften:** forward-only, idempotent (`if exists`), in einer Transaktion, mit Post-Condition-Assertion, ohne Anfassen historischer Dateien. Policies, Grants, Indizes und Trigger verschwinden mit den Tabellen — sie brauchen kein eigenes `drop`.

**Anwendung:** über den bestehenden Produktions-Workflow. Dafür ist ein **Allowlist-Eintrag** in `.github/scripts/lib/supabase-migration-allowlist.mjs` erforderlich. `requires: []` — die Migration referenziert kein Objekt außerhalb der Oura-Tabellen.

> ⚠️ **Der Workflow erzwingt ein Backup vor der Anwendung.** Das Backup enthält dann die Gesundheitsdaten. Das ist für den Rollback erforderlich, bedeutet aber: **die Backup-Retention wird Teil des Löschkonzepts.** Nach Ablauf der Rollback-Frist (Vorschlag: 30 Tage) muss dieses Backup nachweislich vernichtet werden, sonst ist die Löschung nach Art. 17 unvollständig. Dieser Punkt ist in der Vorfallsakte zu vermerken.

## 4. Removal Order

Reihenfolge ist bewusst gewählt: erst die Datenquelle abklemmen, dann die Daten, dann der Code. So entsteht zu keinem Zeitpunkt ein Zustand, in dem eine Funktion auf ein fehlendes Objekt greift.

| # | Schritt | Ort | Deploy? | Migration? | Risiko |
|---|---|---|---|---|---|
| **R-0** | **V1–V9 ausführen, Ergebnisse zur Vorfallsakte nehmen** | Supabase SQL Editor (read-only) | nein | nein | keines |
| **R-1** | **Autorisierung der Oura-OAuth-App widerrufen** (Oura-Konto → Verbundene Apps). Damit werden `access_token`/`refresh_token` sofort wertlos | cloud.ouraring.com | nein | nein | keines — die wirksamste Sofortmaßnahme |
| **R-2** | **Edge Function `sync-oura` auf Supabase löschen** (`supabase functions delete sync-oura`). Beendet **LIVE-RISK-1** | Supabase | nein | nein | gering — danach schlägt der Sync-Button fehl, was in R-6 ohnehin entfällt |
| **R-3** | **Edge Function `oura-callback` auf Supabase löschen** — die out-of-repo-Funktion (Evidence §5a). **Wird durch keine Repository-Änderung erfasst** | Supabase | nein | nein | gering |
| **R-4** | **Function Secrets entfernen**, die nur Oura betrafen (Oura Client Secret o. ä.). `SUPABASE_SERVICE_ROLE_KEY` bleibt — er wird von anderen Funktionen gebraucht | Supabase | nein | nein | mittel — genau prüfen, welches Secret nur Oura diente |
| **R-5** | **Repository-Bereinigung** (Abschnitt 5) | Git | **ja** | nein | gering |
| **R-6** | **Deploy der bereinigten Anwendung** — Route, UI, Navigation und Client-Zugriffe verschwinden | Cloudflare | **ja** | nein | gering |
| **R-7** | **Destruktive Migration anwenden** (Abschnitt 3) | Produktions-DB | nein | **ja** | **hoch — irreversibel** |
| **R-8** | **Residual-Data-Checks** (Abschnitt 7) | Supabase + Browser | nein | nein | keines |
| **R-9** | **Backup-Vernichtung nach Ablauf der Rollback-Frist** dokumentieren | Supabase | nein | nein | keines |
| **R-10** | **Datenschutzerklärung und Verarbeitungsverzeichnis fortschreiben** — Oura war dort nie genannt; der Vorgang ist im Löschkonzept und in der Vorfallsakte zu dokumentieren | Dokumente | nein | nein | keines |

**Warum R-5/R-6 vor R-7:** Läuft die Migration zuerst, greift die noch ausgelieferte `OuraAnalyticsPage` auf nicht mehr existente Tabellen zu und erzeugt Fehler im Admin-Bereich. Umgekehrt ist die Reihenfolge sauber: Der Code ist weg, bevor die Tabellen es sind.

## 5. Repository-Bereinigung (R-5) — vollständige Dateiliste

Erhoben durch repo-weiten Scan (53 Dateien mit Oura-Treffern, davon 44 reine Kommentar-/Nachbarschaftstreffer ohne funktionalen Bezug).

### 5.1 Vollständig zu löschen

| Datei | Anmerkung |
|---|---|
| `src/pages/OuraAnalyticsPage.tsx` | Die gesamte UI (~1.200 Zeilen) |
| `supabase/functions/sync-oura/index.ts` | Die Edge Function |
| `supabase/functions/sync-oura/` | Verzeichnis |

### 5.2 Gezielt zu bearbeiten

| Datei | Zeile(n) | Änderung |
|---|---|---|
| `src/App.tsx` | 522 | `const OuraAnalyticsContent = lazyNamed(...)` entfernen |
| `src/App.tsx` | 647 | `<Route path="/admin/oura-analytics" ... />` entfernen |
| `supabase/config.toml` | 1-2 | Block `[functions.sync-oura] verify_jwt = false` entfernen. **Die Golden-Agent-Blöcke bleiben** |
| `src/pages/admin/internalNavigation.ts` | 34 | `'oura'` aus `ModuleKey` entfernen |
| `src/pages/admin/internalNavigation.ts` | 184-193 | Modul-Definition entfernen |
| `src/pages/admin/internalNavigation.ts` | 204 | `'oura'` aus `DISPLAY_ORDER` entfernen |
| `src/pages/admin/internalNavigation.ts` | 30 | Kommentar anpassen (nennt Oura als Beispiel) |
| `src/pages/admin/commandItems.ts` | 14 | Kommentar anpassen |
| `src/pages/admin/InternalWorkspace.tsx` | 10, 23 | Kommentare anpassen |
| `src/vite-env.d.ts` | 6 | `readonly VITE_OURA_CLIENT_ID?: string;` entfernen |
| `src/pages/admin/internalNavigation.test.ts` | 15, 30, 64-66 | Oura-Assertions entfernen; die Assertion für den Task-OS bleibt |
| `src/pages/admin/adminThemeScope.test.tsx` | 9 | Kommentar anpassen (nennt OuraAnalyticsPage) |
| `.github/scripts/audit-supabase-history.mjs` | 31-35, 222-227, 282-345, 400-414 | **Sorgfältig.** Das Skript rekonstruiert die *historische* Migrationshistorie. Zwei Optionen in Abschnitt 6 |

### 5.3 CSS-Token — NICHT blind entfernen

`src/index.css:604-621` definiert 18 `--oura-*`-Variablen. `adminThemeScope.test.tsx:9` hält fest, dass sie **von `ExecutionPage` und `OuraAnalyticsPage`** gelesen werden.

**Vorgehen:**
1. Prüfen, welche Token `src/pages/ExecutionPage.tsx` tatsächlich nutzt.
2. Die dort genutzten **umbenennen** (z. B. `--admin-accent`) und in `ExecutionPage.tsx` nachziehen.
3. Nur die ausschließlich von `OuraAnalyticsPage` genutzten entfernen.

Ein pauschales Löschen des Blocks würde die Execution-Oberfläche visuell zerstören — ohne dass ein Test das zwingend aufdeckt.

### 5.4 Dokumentation

`docs/admin-center.md`, `docs/unified-workspace.md`, `ROUTING_GUIDE.md`, `docs/phase-0-security-audit.md`, `scripts/staging/README.md`, `scripts/staging/preflight.sql`: Oura-Erwähnungen aktualisieren. **`docs/phase-0-security-audit.md` ist ein historisches Auditartefakt** — dort wird nicht umgeschrieben, sondern ein Hinweis auf die Entfernung ergänzt.

### 5.5 Nicht anzufassen

`src/components/finance/SignaturePad.tsx`, `src/components/dashboard/primitives.tsx`, `src/lib/consent.test.ts`, `src/lib/ownerFinance/*`, sämtliche `qa-*.mjs` und die übrigen `test-*.mjs`: Diese enthalten das Wort „Oura" ausschließlich in Kommentaren oder als Bestandteil unbeteiligter Bezeichner (Scan-Artefakte). **Keine Änderung.**

## 6. Umgang mit `audit-supabase-history.mjs`

Das Skript prüft einen `supabase db dump` gegen die erwartete Struktur der historischen Migrationen. Es erwartet alle 12 Oura-Tabellen samt Spalten, Indizes und Fremdschlüsseln.

| Option | Vorgehen | Bewertung |
|---|---|---|
| **A — Oura-Erwartungen entfernen** | `ouraTables`, `fkToOuraConnections`, die Index-Assertions und den Historieneintrag `20260709120000` streichen | ❌ **Nicht empfohlen.** Das Skript verlöre die Fähigkeit, die historische Migrationshistorie zu rekonstruieren, und wäre damit als forensisches Werkzeug entwertet |
| **B — Erwartungen konditionalisieren** | Die Oura-Assertions hinter einen Schalter legen (`--post-oura-removal` bzw. Erkennung, dass keine `oura*`-Tabelle im Dump ist), mit erklärendem Kommentar und Verweis auf diesen Plan | ✅ **Empfohlen.** Das Skript bleibt für Altbestände nutzbar und akzeptiert den neuen Zielzustand |

Gleiche Logik gilt für `scripts/staging/preflight.sql`, falls dort Oura-Objekte erwartet werden.

## 7. Verification Tests

### 7.1 Vor R-7 (nach Repository-Bereinigung und Deploy)

```bash
npm run typecheck    # keine Referenz auf entfernte Module
npm test             # internalNavigation.test.ts, adminThemeScope.test.tsx gruen
npm run build        # Prerender laeuft durch, Route existiert nicht mehr
npm run lint
grep -ri "oura" src/ supabase/functions/ | grep -v "\.test\."   # erwartet: leer
```

Manuell:
- `/admin/oura-analytics` → muss auf `/admin` umleiten (greift über `<Route path="/admin/*" element={<Navigate to="/admin" replace />} />`, `App.tsx:653`)
- Command Palette → kein Oura-Eintrag
- Admin-Navigation → kein Oura-Modul
- `/admin/execution` → **visuell unverändert** (CSS-Token-Prüfung aus 5.3)

### 7.2 Nach R-7 (Datenbank)

```sql
-- Keine Relation mehr
select relname, relkind from pg_class
where relnamespace = 'public'::regnamespace and relname like 'oura%';
-- erwartet: 0 Zeilen

-- Keine Policy mehr
select * from pg_policies where schemaname='public' and tablename like 'oura%';
-- erwartet: 0 Zeilen

-- Keine Grants mehr
select * from information_schema.role_table_grants
where table_schema='public' and table_name like 'oura%';
-- erwartet: 0 Zeilen

-- Keine Funktion, kein Trigger, keine Sequenz
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and proname ilike '%oura%';
select sequencename from pg_sequences where schemaname='public' and sequencename like 'oura%';
-- erwartet: jeweils 0 Zeilen

-- Migration verzeichnet
select version, name, executed_at from supabase_migrations.schema_migrations
where name ilike '%remove_oura%';
```

### 7.3 Edge Functions

```bash
supabase functions list --project-ref <REF>
# erwartet: weder sync-oura noch oura-callback
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://<REF>.supabase.co/functions/v1/sync-oura \
  -H 'Content-Type: application/json' -d '{"connection_id":"00000000-0000-0000-0000-000000000000"}'
# erwartet: 404 (Funktion existiert nicht)
```

## 8. Residual-Data Checks

| # | Ort | Prüfung | Maßnahme |
|---|---|---|---|
| RD-1 | **Produktions-Backups / PITR** | Enthalten die Gesundheitsdaten bis zum Ablauf der Retention | **Retention dokumentieren, Löschung nach Fristablauf nachweisen.** Der wichtigste Restposten |
| RD-2 | **Backup aus dem Migrations-Workflow (R-7)** | Wird unmittelbar vor der Löschung erzeugt | Nach Rollback-Frist (30 Tage) nachweislich vernichten |
| RD-3 | **`localStorage` im Admin-Browser** | Schlüssel `oura_connection_id` | Manuell löschen. Keine Gesundheitsdaten, nur eine UUID |
| RD-4 | **Supabase-Logs** | Können Funktionsaufrufe und Pfade enthalten | Rotieren nach ca. 24 h von selbst |
| RD-5 | **Oura-Cloud** | Die Originaldaten liegen weiterhin bei Oura | **Nicht Cogniiqs Datenbestand.** Löschung dort erfolgt über das Oura-Konto der betroffenen Person |
| RD-6 | **`raw jsonb`** | Wird mit den Tabellen entfernt | Durch 7.2 abgedeckt |
| RD-7 | **Git-Historie** | `OuraAnalyticsPage.tsx` und `sync-oura/index.ts` bleiben in alten Commits | **Kein Handlungsbedarf:** Diese Dateien enthalten **Code, keine personenbezogenen Daten.** Eine History-Rewrite wäre unverhältnismäßig und würde zugleich Beweismittel vernichten |
| RD-8 | **Dist-/Build-Artefakte, Cloudflare-Cache** | Alter JS-Chunk mit der Oura-Seite | Verschwindet mit dem nächsten Deploy; Chunks sind content-hashed |
| RD-9 | **`oura_connections`-Tokens** | Werden mit der Tabelle gelöscht | Durch R-1 bereits vorher entwertet |

## 9. Rollback Considerations

**Bis R-6 einschließlich: vollständig reversibel.** Git-Revert plus Deploy stellt die Anwendung wieder her; die Datenbank ist unberührt.

**Ab R-7: nicht reversibel.**

| Aspekt | Bewertung |
|---|---|
| Datenverlust | **Vollständig und gewollt.** Das ist der Zweck |
| Technischer Rollback | Nur über die Wiederherstellung des Backups aus dem Migrations-Workflow — also eine **vollständige Datenbank-Wiederherstellung**, die auch alle seither erfolgten Finanz- und Kundendaten zurücksetzt. **Praktisch keine Option** |
| Rollback-Migration | Könnte die *Struktur* wiederherstellen, **nicht die Daten** |
| Realistische Rollback-Strategie | **Es gibt keine.** Deshalb ist R-0 (Beweissicherung) nicht optional |
| Auswirkungen auf andere Module | **Keine.** Kein anderer Bereich referenziert `oura_*`; die einzigen Fremdschlüssel verlaufen innerhalb der Oura-Gruppe. Verifiziert |
| Auswirkung auf die CI | `audit-supabase-history.mjs` schlägt fehl, wenn Abschnitt 6 nicht umgesetzt ist |

**Empfehlung:** R-7 in einem separaten, einzeln freigegebenen Schritt ausführen — nicht gebündelt mit anderen Migrationen, damit die Backup-Zuordnung eindeutig bleibt.

## 10. Was dieser Plan ausdrücklich NICHT tut

- Er **löscht keine historischen Migrationsdateien**.
- Er **schreibt die Git-Historie nicht um**.
- Er **verändert die Vorfallsakte nicht**.
- Er **entfernt die Execution-/Task-Tabellen nicht** — die waren Teil derselben Exposition, sind aber ein eigener Sachverhalt mit eigener Entscheidung.
- Er **beseitigt die Meldepflicht nicht.** Die Löschung ist Abhilfe nach Art. 32, keine Erledigung von Art. 33/34.

## 11. Sofort wirksame Zwischenmaßnahme

Falls die Freigabe für den vollständigen Plan Zeit braucht, ist **R-1 (Widerruf der OAuth-Autorisierung bei Oura)** sofort und ohne Risiko ausführbar. Sie:

- macht `access_token` und `refresh_token` in `oura_connections` wertlos,
- stoppt jeden weiteren Datenzufluss,
- entwertet **LIVE-RISK-1** praktisch vollständig (`sync-oura` kann ohne gültiges Token nichts mehr abrufen),
- **vernichtet kein Beweismittel** — die Datenbankinhalte bleiben unverändert.

**Das ist die empfohlene Sofortmaßnahme.** Alternativ oder ergänzend beendet **R-2** (Löschen der Edge Function `sync-oura`) LIVE-RISK-1 unmittelbar und ist ebenfalls beweisneutral.
