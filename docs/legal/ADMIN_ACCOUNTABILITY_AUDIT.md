# ADMIN ACCOUNTABILITY AUDIT & AUDIT-LOG-HARDENING-PLAN

**Erstellt:** 2026-09-22
**Rechtsgrundlage:** Art. 5 Abs. 2 (Rechenschaftspflicht), Art. 32 Abs. 1 lit. b DSGVO (Integrität), Art. 30 Abs. 1 lit. g; ergänzend GoBD für die steuerrelevanten Vorgänge.

## 0. Korrektur gegenüber dem Erstaudit

Das Erstaudit stufte das Audit-Log als „deckt nur Owner-Finance ab, keine Manipulationssicherung" ein. Nach vollständiger Prüfung ist diese Einschätzung **zu negativ** gewesen und wird hiermit korrigiert.

Tatsächlich vorhanden:

| Eigenschaft | Umsetzung | Beleg |
|---|---|---|
| **Trigger-basiert, nicht anwendungsseitig** | `after insert or update or delete ... for each row` | `20260722120000:1076-1080` |
| **Nicht umgehbar** | Auch ein direkter Tabellenschreibvorgang oder ein RPC löst den Trigger aus. Ein anwendungsseitiges Log hätte diese Eigenschaft nicht | Trigger-Semantik |
| **Vorher-/Nachher-Zustand vollständig** | `to_jsonb(old)` und `to_jsonb(new)` | `:1058-1059` |
| **Datenminimierung im Log** | 11 Freitext-/Metadatenfelder werden vor dem Schreiben entfernt (`strip`-Array: `notes`, `breakdown`, `validation_result`, `file_metadata`, `metadata`, …) | `:1051-1053` |
| **Akteur** | `auth.uid()` — die reale aufrufende Identität, auch unter `security definer` | `:1063` |
| **Zeitstempel** | `created_at timestamptz not null default now()` | `:474` |
| **Append-only auf Grant-Ebene** | `authenticated` erhält **nur** `select`; `service_role` **nur** `select, insert`. Kein UPDATE, kein DELETE an irgendeine browser-erreichbare Rolle | `:775-779` |
| **Schreibfunktion abgeschottet** | `revoke execute ... from public, anon, authenticated` | `:1067-1068` |
| **`security definer` mit gepinntem `search_path`** | `set search_path = public, pg_temp` | `:1049` |

**Abdeckung: 19 Tabellen** — 11 über die Trigger-Schleife (`owner_invoices`, `owner_expenses`, `owner_payments`, `owner_tax_settings`, `owner_tax_payments`, `owner_tax_estimates`, `owner_assets`, `owner_subscriptions`, `owner_finance_documents`, `owner_exports`, `owner_business_entities`), plus `owner_document_settings`, `owner_offers`, `owner_generated_documents`, `owner_customers`, `owner_customer_tasks`, sowie vier Tabellen aus dem Service-Onboarding über eine eigene Variante (`20260830122000`).

> **Für den Finanz- und Kundenbereich ist die Nachvollziehbarkeit gut gelöst.** Die Lücke liegt woanders — und sie ist präzise benennbar.

## 1. Die tatsächliche Lücke

**Der gesamte Client-Platform-Bereich hat null Audit-Abdeckung.** Verifiziert: `20260721120000_product_aware_client_platform.sql`, `20260731121000_client_provisioning_identity.sql` und `20260818120000_club_operations_activation.sql` enthalten **jeweils 0 Treffer** für „audit".

Betroffen sind damit genau die Vorgänge, die **Zugriffsrechte auf Kundendaten** verändern:

| Vorgang | Wirkung | Protokolliert? |
|---|---|---|
| Kunde provisionieren (`admin-provision-client`) | Legt Organisation, Mitgliedschaft und Portal-Einladung an | ❌ |
| Solution-Entitlement gewähren/entziehen | Öffnet oder schließt den Zugriff auf ein ganzes Modul | ❌ |
| Einladung versenden/widerrufen | Erzeugt einen Zugangsweg | ❌ |
| Organisationsmitgliedschaft ändern | Ändert, wer welche Kundendaten sieht | ❌ |
| `platform_role` ändern | **Die folgenreichste Aktion überhaupt** | ❌ |
| Kundendaten einsehen (`/admin/clients/:id`) | Lesezugriff auf fremde personenbezogene Daten | ❌ |
| Kundendokument herunterladen | Zugriff auf Vertragsinhalte | ⚠️ nur für `/d`-Portal, nicht für Admin-Zugriff |

> Zugespitzt: **Eine Rechnungsänderung über 50 € ist lückenlos protokolliert. Die Erteilung eines Zugriffsrechts auf sämtliche Daten eines Kunden ist es nicht.** Das ist die Asymmetrie, die zu schließen ist.

## 2. Aktionsmatrix

Legende: ✅ vorhanden · ⚠️ teilweise · ❌ fehlt

| Aktion | Server-Autorisierung | Bestätigung | Audit-Log | Akteur | Zeit | Vorher | Nachher | Request-ID | Unveränderlich genug? |
|---|---|---|---|---|---|---|---|---|---|
| **Rechnung erstellen** | ✅ RPC + RLS + `is_platform_owner()` | ⚠️ implizit | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Rechnung stornieren** | ✅ `owner_cancel_invoice(p_invoice_id, p_reason)` | ✅ Grund verpflichtend | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Rechnungsentwurf löschen** | ✅ `delete_owner_draft_invoice` | ✅ Dialog | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Rechnung fixieren (Snapshot)** | ✅ `20260830123000` + Integritäts-Guard `20260831120000` | n/a | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ **stark** |
| **Rückerstattung / Zahlungsänderung** | ✅ `owner_apply_invoice_payments` | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Ausgabe anlegen/ändern/löschen** | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Kunde archivieren** | ✅ `owner_archive_customer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Kunde löschen (Force-Delete)** | ✅ `owner_delete_customer` + `owner_customer_delete_blockers` | ✅ Dialog mit Blocker-Vorprüfung | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Angebot anlegen/ändern** | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Angebot archivieren** | ✅ `delete_owner_offer_draft` | ✅ Dialog | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Angebot per E-Mail versenden** | ✅ Edge Function | ✅ Dialog | ⚠️ über `owner_generated_documents` | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| **Umsatzvertrag ändern** | ✅ | ⚠️ | ⚠️ nicht in der Triggerliste | — | — | — | — | ❌ | ❌ |
| **Kunde provisionieren** | ✅ Edge Function prüft `getUser()`, RPC prüft **erneut** `is_platform_admin()` | ⚠️ Wizard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Entitlement gewähren/entziehen** | ✅ RLS | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Einladung versenden/widerrufen** | ✅ RLS | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`platform_role` ändern** | ✅ `guard_profile_protected_columns()` verhindert clientseitige Änderung vollständig | n/a | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Kundendaten einsehen** | ✅ RLS | n/a | ❌ | ❌ | ❌ | n/a | n/a | ❌ | ❌ |
| **Kundendokument hoch-/herunterladen** | ✅ Edge Function mit JWT-Verifikation | n/a | ❌ | ❌ | ❌ | n/a | n/a | ❌ | ❌ |
| **Dokumentzugriff über `/d/<token>`** | ✅ `owner_verify_offer_token` | n/a | ✅ `owner_document_access_events` | ⚠️ nur `user_agent_summary` | ✅ | n/a | n/a | ❌ | ⚠️ |
| **Angebotsannahme / Signatur** | ✅ Token-RPC | ✅ Signatur | ✅ `owner_offer_acceptance_events` | ✅ Signaturname | ✅ | n/a | ✅ | ❌ | ✅ **stark** (SHA-256 des Signaturbilds) |
| **Storage-Purge** | ✅ konstantzeitiger `WORKER_SECRET`-Vergleich | n/a | ⚠️ teilweise | Worker | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| **Export erzeugen** | ✅ | n/a | ✅ `owner_exports` | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |

## 3. Bewertung „unveränderlich genug?"

| Ebene | Bewertung |
|---|---|
| **Grant-Ebene** | ✅ Weder `anon` noch `authenticated` hält UPDATE oder DELETE auf `owner_audit_log`. Ein Client kann Einträge **nicht** verändern |
| **Trigger-Ebene** | ❌ **Kein `BEFORE UPDATE/DELETE`-Trigger.** Die Append-only-Eigenschaft beruht allein auf Grants |
| **Kryptografische Ebene** | ❌ Keine Hash-Kette, keine Signatur. Eine nachträgliche Änderung wäre nicht erkennbar |
| **Externe Ebene** | ❌ Kein Export in ein unabhängiges System |
| **Rolle `postgres` / `supabase_admin`** | ❌ Beide können frei ändern. Auf Supabase hat der Projektinhaber über den SQL-Editor Zugriff darauf |

> **Fazit:** Das Log ist **gegen die Anwendung** gut geschützt und **gegen den Betreiber** gar nicht. Für Art. 5 Abs. 2 gegenüber einer Aufsichtsbehörde reicht das; für einen Nachweis gegenüber einem Kunden, der eine Manipulation behauptet, nicht.
>
> Praktisch relevant wird das bei den Finanzdaten: `owner_invoices` unterliegt der GoBD. Die Unveränderbarkeit ist dort über den **Invoice-Snapshot** und den **Integritäts-Guard** (`20260830123000`, `20260831120000`) bereits deutlich stärker abgesichert als über das Audit-Log — das ist der richtige Ort dafür und gut gelöst.

## 4. Fehlende Felder im bestehenden Schema

| Feld | Status |
|---|---|
| `correlation_id text` | **Spalte existiert** (`:471`) — wird aber **von keiner Schreibstelle befüllt**. `owner_write_audit_row()` setzt sie nicht |
| `actor_ip` | fehlt |
| `actor_role` | fehlt — die Rolle zum Zeitpunkt der Aktion ist nicht rekonstruierbar |
| `outcome` | fehlt — **nur erfolgreiche Aktionen werden protokolliert.** Ein abgewehrter Autorisierungsversuch hinterlässt keine Spur |
| `user_agent` | fehlt (im `/d`-Portal dagegen vorhanden) |
| Hash-Kette | fehlt |

> Der letzte Punkt ist der sicherheitsrelevanteste: **Fehlgeschlagene Zugriffsversuche werden nirgends festgehalten.** Ein Angreifer, der Autorisierungsgrenzen abtastet, erzeugt kein einziges Protokollereignis.

## 5. Audit-Log-Hardening-Plan

### Stufe 1 — Lücken schließen, ohne Bestehendes anzufassen (P2)

Neue Tabelle **neben** `owner_audit_log`, nicht statt ihr. Das bestehende Log funktioniert und soll nicht angefasst werden.

```sql
create table public.platform_audit_log (
  id              bigint generated always as identity primary key,
  occurred_at     timestamptz not null default clock_timestamp(),
  actor_user_id   uuid references public.profiles(id) on delete set null,
  actor_role      text,
  action          text not null,          -- 'entitlement.grant', 'client.provision', ...
  resource_type   text not null,
  resource_id     text,
  organization_id uuid,
  outcome         text not null check (outcome in ('success','denied','error')),
  before_state    jsonb,
  after_state     jsonb,
  correlation_id  text,
  prev_hash       bytea,
  row_hash        bytea
);

alter table public.platform_audit_log enable row level security;
revoke all on table public.platform_audit_log from public, anon, authenticated;
grant select on table public.platform_audit_log to authenticated;   -- via RLS nur Owner
grant insert on table public.platform_audit_log to service_role;

create policy platform_audit_log_owner_select on public.platform_audit_log
  for select to authenticated using (public.is_platform_owner());
```

**Trigger anhängen an:** `organizations`, `organization_members`, `profiles` (nur `platform_role`), die Entitlement-Tabellen aus `20260721120000`, die Einladungstabellen aus `20260731121000` und die Aktivierungstabellen aus `20260818120000`.

**Wiederverwenden statt neu bauen:** `owner_write_audit_row()` ist bereits die richtige Vorlage — inklusive des `strip`-Arrays zur Datenminimierung. Eine Variante davon genügt.

### Stufe 2 — Append-only erzwingen (P2)

```sql
create or replace function public.audit_log_is_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'audit log is append-only: % on % refused', tg_op, tg_table_name;
end; $$;

create trigger platform_audit_log_no_change
  before update or delete on public.platform_audit_log
  for each row execute function public.audit_log_is_append_only();

-- Gleiche Absicherung fuer das bestehende Log:
create trigger owner_audit_log_no_change
  before update or delete on public.owner_audit_log
  for each row execute function public.audit_log_is_append_only();
```

> **Wichtige Einschränkung, die ausgesprochen gehört:** Auch das hindert `postgres` nicht — der Trigger ließe sich löschen. Es hebt die Schwelle von „unbemerkt möglich" auf „bewusster, protokollierter DDL-Vorgang". Mehr leistet ein datenbankinterner Mechanismus nicht.

### Stufe 3 — Hash-Kette (P3)

`row_hash = sha256(prev_hash || kanonische Zeilendarstellung)`, befüllt im Insert-Trigger. Verifikation über einen Durchlauf der Kette.

**Ehrliche Bewertung:** Die Hash-Kette schützt nicht gegen jemanden, der die gesamte Kette neu berechnet. Ihren Wert entfaltet sie erst mit **Stufe 4**. Wer Stufe 3 ohne Stufe 4 baut, gewinnt wenig.

Bausteine sind vorhanden: `src/lib/gateway/canonicalJson.ts` (kanonische JSON-Serialisierung) und `src/lib/ownerFinance/exports/sourceHash.ts`.

### Stufe 4 — Externe Verankerung (P3)

Täglicher Export des Tages-Root-Hash in ein System außerhalb der Datenbank — E-Mail an eine Archivadresse, ein Git-Commit in ein separates Repository oder ein Objekt in einem WORM-Bucket. **Erst damit wird die Manipulation nachträglich erkennbar**, weil der Vergleichswert außerhalb der Reichweite des Betreibers liegt.

Infrastruktur dafür existiert bereits: `storage-purge-worker` ist die Vorlage für einen `WORKER_SECRET`-geschützten, per `pg_cron` getriggerten Worker.

### Stufe 5 — Lesezugriffe protokollieren (P2)

**Rechtlich der wichtigste Punkt dieses Abschnitts.**

Art. 5 Abs. 2 und Art. 32 verlangen, dass nachvollziehbar ist, **wer wann auf welche personenbezogenen Daten Dritter zugegriffen hat**. Ein reines Schreib-Log leistet das nicht.

Erforderliche Ereignisse (mit `outcome`):

| Ereignis | `action` |
|---|---|
| Admin öffnet Kundendetailseite | `client.view` |
| Admin lädt Kundendokument herunter | `document.download` |
| Admin exportiert Finanzdaten | `export.generate` |
| Zugriff auf Lead-Datenbank | `leads.read` |
| **Abgewiesener Autorisierungsversuch** | `*.denied` |

**Umsetzungsort:** Für Downloads die bestehenden Edge Functions (`customer-document-download`), die den Zugriff ohnehin zentral durchleiten. Für Seitenaufrufe ein schlanker RPC-Aufruf beim Laden der Detailansicht.

> **Datenminimierung beachten:** Das Zugriffsprotokoll ist selbst eine Verarbeitung personenbezogener Daten (Mitarbeiterdaten). Es braucht eine eigene Löschfrist — Vorschlag: **12 Monate**, IP-Adressen **30 Tage** — und einen Eintrag im Verarbeitungsverzeichnis.

## 6. Priorisierung

| Stufe | Maßnahme | Aufwand | Wirkung | Prio |
|---|---|---|---|---|
| 1 | `platform_audit_log` + Trigger auf Client-Platform | M | **Schließt die eigentliche Lücke** | **P2** |
| 2 | Append-only-Trigger auf beide Logs | S | Hoch bei geringem Aufwand | **P2** |
| 5 | Lesezugriffe + abgewiesene Versuche | M | **Rechtlich der wichtigste Punkt** | **P2** |
| 3 | Hash-Kette | M | Gering ohne Stufe 4 | P3 |
| 4 | Externe Verankerung | M | Erst hiermit vollwertig | P3 |
| — | `correlation_id` tatsächlich befüllen | S | Erleichtert die Vorfallsanalyse erheblich | P3 |

## 7. Was nicht geändert werden sollte

- **Das `strip`-Array** in `owner_write_audit_row()` — bewusste Datenminimierung im Protokoll. Für ein neues Log übernehmen, nicht weglassen.
- **`left(user_agent, 200)`** in der Dokumentenstrecke — dieselbe Haltung.
- **Trigger statt Anwendungscode** — die tragende Architekturentscheidung dieses Logs und der Grund, warum es nicht umgehbar ist.
- **Der Invoice-Snapshot und der Integritäts-Guard** — der stärkste Unveränderbarkeitsmechanismus im System, am richtigen Ort.
- **`is_platform_owner()` statt `is_platform_admin()`** für Lead-PII und Owner-Finance — die strengere Wahl war richtig.
