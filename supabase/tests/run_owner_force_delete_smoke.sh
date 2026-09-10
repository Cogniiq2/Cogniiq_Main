#!/usr/bin/env bash
set -euo pipefail

# Owner force-delete DB smoke test.
#
# What it pins, and why each one is here rather than in a unit test:
#
#   1. The defect. The ordinary preflight answers trash_only / cancel_and_trash for exactly the
#      records the owner wants gone, so the pre-existing owner_workspace_purge_items — which
#      proceeds only on `hard_delete` — could never remove any of them. The Papierkorb had no exit.
#   2. The guards are the server's, not the browser's: the typed phrase, the written reason, and
#      "must be in the Papierkorb (or archived) first" are all re-checked here.
#   3. owner_guard_invoice still refuses an ordinary DELETE of an issued invoice. The force path
#      is an exception scoped to one row inside one transaction, not a hole in the guard — if a
#      later change made plain DELETEs pass, this test fails.
#   4. The cascade actually removes the dependents, and the tombstone records what went.
#
# FOR LOCAL TESTING ONLY — never run against production.
#
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres \
#     supabase/tests/run_owner_force_delete_smoke.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"; }

run_psql -q -f "$ROOT_DIR/supabase/tests/lib_bootstrap.sql"

# pgcrypto in `extensions`, which is where the hosted project has it and where the invoice
# snapshot hash looks for digest().
run_psql -q <<'SQL'
create schema if not exists extensions;
do $$ begin
  if not exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
                 where e.extname = 'pgcrypto' and n.nspname = 'extensions') then
    drop extension if exists pgcrypto cascade;
    create extension pgcrypto schema extensions;
  end if;
end $$;
grant usage on schema extensions to public;
create or replace function public.gen_random_uuid() returns uuid
  language sql as $f$ select extensions.gen_random_uuid() $f$;
SQL

# A minimal `storage` schema. The hosted project has it; a bare cluster does not, and several
# migrations insert a bucket. Only the two columns this repository touches are modelled.
run_psql -q <<'SQL'
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (
  id uuid primary key default extensions.gen_random_uuid(),
  bucket_id text, name text, owner uuid, metadata jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now());
SQL

# Every migration, in order. The two skipped ones reconcile drift in the HOSTED database
# against tables a bare cluster does not have; neither touches the delete paths under test.
SKIP='20260731122000_case_d_legacy_convergence 20260818120000_club_operations_activation'
for f in "$ROOT_DIR"/supabase/migrations/*.sql; do
  name="$(basename "$f" .sql)"
  case " $SKIP " in *" $name "*) continue;; esac
  run_psql -q -f "$f" >/dev/null
done

run_psql <<'SQL'
update public.profiles set platform_role = 'cogniiq_owner'
 where id = '00000000-0000-0000-0000-000000000901';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', false);
select set_config('t.entity', (select id::text from public.owner_business_entities where slug = 'cogniiq'), false);

-- ===========================================================================
-- Fixture: an ISSUED invoice, in the Papierkorb, owned by an ARCHIVED customer.
-- This is the shape the owner is stuck on and the shape the old purge refused.
-- ===========================================================================
do $$
declare v_entity uuid := current_setting('t.entity')::uuid; v_inv uuid; v_cust uuid;
begin
  insert into public.owner_customers (business_entity_id, company, status)
  values (v_entity, 'Smoke Kunde GmbH', 'archived') returning id into v_cust;

  insert into public.owner_invoices
    (business_entity_id, owner_customer_id, status, issue_date, service_date, due_date, currency)
  values (v_entity, v_cust, 'draft', current_date, current_date, current_date, 'EUR')
  returning id into v_inv;
  insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents)
  values (v_inv, 'Zeile A', 1000, 100000), (v_inv, 'Zeile B', 2000, 5000);
  perform public.issue_owner_invoice(gen_random_uuid(), v_inv);

  insert into public.owner_workspace_item_state
    (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_entity, 'invoice', v_inv, now(), '00000000-0000-0000-0000-000000000901');

  perform set_config('t.inv', v_inv::text, false);
  perform set_config('t.cust', v_cust::text, false);
end $$;

-- ===========================================================================
-- 1. The defect itself: the ordinary path never offers a hard delete here, and
--    the old purge therefore never had anything to act on.
-- ===========================================================================
do $$
declare v_action text; v_outcome text;
begin
  v_action := public.owner_workspace_delete_preflight_one('invoice', current_setting('t.inv')::uuid) ->> 'action';
  if v_action = 'hard_delete' then
    raise exception 'FAIL 1a: the ordinary preflight should never hard-delete an issued invoice (got %)', v_action;
  end if;

  v_outcome := public.owner_workspace_purge_items(
    current_setting('t.entity')::uuid, 'invoice', array[current_setting('t.inv')::uuid]) -> 0 ->> 'outcome';
  if v_outcome <> 'blocked' then
    raise exception 'FAIL 1b: the legacy purge is expected to refuse this record (got %)', v_outcome;
  end if;
  raise notice 'PASS 1: the ordinary path still refuses (% / legacy purge %)', v_action, v_outcome;
end $$;

-- ===========================================================================
-- 2. An ordinary DELETE is still refused. The force path must be an exception
--    scoped to one row, never a weakening of owner_guard_invoice.
-- ===========================================================================
do $$
begin
  begin
    delete from public.owner_invoices where id = current_setting('t.inv')::uuid;
    raise exception 'FAIL 2: a plain DELETE removed an issued invoice — the guard is broken';
  exception when others then
    if sqlerrm like 'FAIL 2%' then raise; end if;
    raise notice 'PASS 2: plain DELETE still refused (%)', left(sqlerrm, 60);
  end;
end $$;

-- ===========================================================================
-- 3. The three guards on the force path.
-- ===========================================================================
do $$
declare v_err text;
begin
  begin
    perform public.owner_force_purge_items(current_setting('t.entity')::uuid, 'invoice',
      array[current_setting('t.inv')::uuid], 'Testdatensatz', 'endgültig löschen');
    raise exception 'FAIL 3a: a wrong confirmation phrase was accepted';
  exception when others then
    if sqlerrm like 'FAIL 3a%' then raise; end if;
    if sqlerrm not like '%force_delete_confirmation_required%' then
      raise exception 'FAIL 3a: unexpected refusal %', sqlerrm;
    end if;
  end;

  begin
    perform public.owner_force_purge_items(current_setting('t.entity')::uuid, 'invoice',
      array[current_setting('t.inv')::uuid], '  ', 'ENDGÜLTIG LÖSCHEN');
    raise exception 'FAIL 3b: an empty reason was accepted';
  exception when others then
    if sqlerrm like 'FAIL 3b%' then raise; end if;
    if sqlerrm not like '%force_delete_reason_required%' then
      raise exception 'FAIL 3b: unexpected refusal %', sqlerrm;
    end if;
  end;

  -- Out of the Papierkorb: refused, and the record survives untouched.
  update public.owner_workspace_item_state set trashed_at = null
   where resource_id = current_setting('t.inv')::uuid;
  v_err := public.owner_force_purge_items(current_setting('t.entity')::uuid, 'invoice',
    array[current_setting('t.inv')::uuid], 'Testdatensatz', 'ENDGÜLTIG LÖSCHEN') -> 0 ->> 'error';
  if v_err is distinct from 'not_trashed' then
    raise exception 'FAIL 3c: an untrashed record was not refused (%)', v_err;
  end if;
  if not exists (select 1 from public.owner_invoices where id = current_setting('t.inv')::uuid) then
    raise exception 'FAIL 3c: an untrashed record was destroyed anyway';
  end if;

  update public.owner_workspace_item_state set trashed_at = now()
   where resource_id = current_setting('t.inv')::uuid;
  raise notice 'PASS 3: phrase, reason and Papierkorb-first are all enforced';
end $$;

-- ===========================================================================
-- 4. The manifest counts each dependent ONCE. It is the only thing the owner
--    sees before confirming, so an inflated count is a correctness bug.
-- ===========================================================================
do $$
declare v_manifest jsonb;
begin
  v_manifest := public.owner_force_delete_manifest('owner_invoices', current_setting('t.inv')::uuid);
  if (v_manifest ->> 'owner_invoices')::int <> 1 then
    raise exception 'FAIL 4a: expected exactly one invoice in the manifest, got %', v_manifest;
  end if;
  if (v_manifest ->> 'owner_invoice_lines')::int <> 2 then
    raise exception 'FAIL 4b: two lines were created; the manifest says % (double-counting?)',
      v_manifest ->> 'owner_invoice_lines';
  end if;
  raise notice 'PASS 4: manifest is %', v_manifest;
end $$;

-- ===========================================================================
-- 5. The destruction, the tombstone, and no leaked token.
-- ===========================================================================
do $$
declare v_outcome text; v_tomb record;
begin
  v_outcome := public.owner_force_purge_items(current_setting('t.entity')::uuid, 'invoice',
    array[current_setting('t.inv')::uuid], 'Testdatensatz', 'ENDGÜLTIG LÖSCHEN') -> 0 ->> 'outcome';
  if v_outcome <> 'hard_deleted' then
    raise exception 'FAIL 5a: force purge did not destroy the invoice (%)', v_outcome;
  end if;

  if exists (select 1 from public.owner_invoices where id = current_setting('t.inv')::uuid)
     or exists (select 1 from public.owner_invoice_lines where invoice_id = current_setting('t.inv')::uuid)
     or exists (select 1 from public.owner_workspace_item_state where resource_id = current_setting('t.inv')::uuid) then
    raise exception 'FAIL 5b: rows survived the force purge';
  end if;

  select * into v_tomb from public.owner_deletion_tombstones
   where resource_id = current_setting('t.inv')::uuid;
  if v_tomb.id is null then raise exception 'FAIL 5c: no tombstone was written'; end if;
  if v_tomb.label is null or v_tomb.reason <> 'Testdatensatz' then
    raise exception 'FAIL 5d: the tombstone lost the number or the reason (%)', to_jsonb(v_tomb);
  end if;

  if public.owner_force_delete_token() <> '' then
    raise exception 'FAIL 5e: the force-delete token outlived the statement that set it';
  end if;
  raise notice 'PASS 5: destroyed, tombstoned as %, token cleared', v_tomb.label;
end $$;

-- ===========================================================================
-- 6. The customer. Archive first; then it goes, and its issued invoices with it.
-- ===========================================================================
do $$
declare v_entity uuid := current_setting('t.entity')::uuid; v_c uuid; v_inv uuid; v_res jsonb;
begin
  -- An ACTIVE customer is refused outright.
  insert into public.owner_customers (business_entity_id, company, status)
  values (v_entity, 'Aktiv AG', 'active') returning id into v_c;
  begin
    perform public.owner_force_delete_customer(v_c, 'Testkunde', 'ENDGÜLTIG LÖSCHEN');
    raise exception 'FAIL 6a: a non-archived customer was destroyed';
  exception when others then
    if sqlerrm like 'FAIL 6a%' then raise; end if;
    if sqlerrm not like '%force_delete_requires_archived%' then
      raise exception 'FAIL 6a: unexpected refusal %', sqlerrm;
    end if;
  end;

  -- The archived one, with an issued invoice the safe path can never remove.
  insert into public.owner_invoices
    (business_entity_id, owner_customer_id, status, issue_date, service_date, due_date, currency)
  values (v_entity, current_setting('t.cust')::uuid, 'draft', current_date, current_date, current_date, 'EUR')
  returning id into v_inv;
  insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents)
  values (v_inv, 'Zeile', 1000, 50000);
  perform public.issue_owner_invoice(gen_random_uuid(), v_inv);

  v_res := public.owner_force_delete_customer(current_setting('t.cust')::uuid, 'Testkunde', 'ENDGÜLTIG LÖSCHEN');
  if not (v_res ->> 'deleted')::boolean then
    raise exception 'FAIL 6b: the archived customer was not destroyed (%)', v_res;
  end if;
  if exists (select 1 from public.owner_customers where id = current_setting('t.cust')::uuid)
     or exists (select 1 from public.owner_invoices where id = v_inv) then
    raise exception 'FAIL 6c: the customer or its issued invoice survived';
  end if;
  raise notice 'PASS 6: archived customer destroyed together with its issued invoice';
end $$;

-- ===========================================================================
-- 7. Offers and expenses take the same path.
-- ===========================================================================
do $$
declare v_entity uuid := current_setting('t.entity')::uuid; v_off uuid; v_exp uuid; v_outcome text;
begin
  insert into public.owner_offers (business_entity_id, title, status, issue_date, valid_until, currency)
  values (v_entity, 'Smoke Angebot', 'draft', current_date, current_date + 30, 'EUR') returning id into v_off;
  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents)
  values (v_off, 'Position', 1000, 250000);
  update public.owner_offers set status = 'sent', offer_number = 'AN-SMOKE-1', finalized_version = 1
   where id = v_off;
  insert into public.owner_workspace_item_state (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_entity, 'offer', v_off, now(), '00000000-0000-0000-0000-000000000901');

  v_outcome := public.owner_force_purge_items(v_entity, 'offer', array[v_off], 'Testangebot', 'ENDGÜLTIG LÖSCHEN')
    -> 0 ->> 'outcome';
  if v_outcome <> 'hard_deleted'
     or exists (select 1 from public.owner_offers where id = v_off)
     or exists (select 1 from public.owner_offer_lines where offer_id = v_off) then
    raise exception 'FAIL 7a: the offer or its lines survived (%)', v_outcome;
  end if;

  insert into public.owner_expenses
    (business_entity_id, invoice_date, service_date, currency, amount_paid_cents, gross_total_cents)
  values (v_entity, current_date, current_date, 'EUR', 5000, 5000) returning id into v_exp;
  insert into public.owner_workspace_item_state (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_entity, 'expense', v_exp, now(), '00000000-0000-0000-0000-000000000901');

  v_outcome := public.owner_force_purge_items(v_entity, 'expense', array[v_exp], 'Testbeleg', 'ENDGÜLTIG LÖSCHEN')
    -> 0 ->> 'outcome';
  if v_outcome <> 'hard_deleted' or exists (select 1 from public.owner_expenses where id = v_exp) then
    raise exception 'FAIL 7b: the expense survived (%)', v_outcome;
  end if;
  raise notice 'PASS 7: offers and expenses take the same path';
end $$;

-- ===========================================================================
-- 8. The tombstone is append-only for the browser: readable, never writable.
-- ===========================================================================
do $$
declare v_priv text;
begin
  foreach v_priv in array array['INSERT', 'UPDATE', 'DELETE'] loop
    if has_table_privilege('authenticated', 'public.owner_deletion_tombstones', v_priv) then
      raise exception 'FAIL 8: authenticated holds % on the deletion log', v_priv;
    end if;
  end loop;
  if not has_table_privilege('authenticated', 'public.owner_deletion_tombstones', 'SELECT') then
    raise exception 'FAIL 8: the owner cannot read the deletion log';
  end if;
  raise notice 'PASS 8: the deletion log is read-only for the browser';
end $$;

\echo 'owner force-delete smoke: all checks passed'
SQL
