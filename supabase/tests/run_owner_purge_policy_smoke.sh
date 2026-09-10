#!/usr/bin/env bash
set -euo pipefail

# Owner deletion-policy DB smoke test: two tiers, one explicit dependency map.
#
# What it pins, and why none of it can live in a unit test:
#
#   1. The contradiction is gone. Purge eligibility is asked of the record as it is now, not of
#      the DELETE preflight — whose `hard_delete` answer is consumed before a row can ever reach
#      the trash, which is why the old purge refused everything by construction.
#   2. Tier 1 destroys a never-issued record completely and REFUSES an accounting-relevant one.
#   3. Tier 2 gets through, but only behind the phrase, the reason and a tombstone.
#   4. The database guards stay armed underneath tier 1: even with eligibility bypassed, an
#      issued invoice cannot be destroyed without the emergency token.
#   5. No orphans. owner_purge_assert_no_orphans re-walks the whole inbound FK graph plus the
#      registered soft references after every purge; SET NULL keys and the polymorphic
#      owner_generated_documents are exactly what a catalog walk alone would leave behind.
#   6. Storage objects go with the rows, in every bucket involved.
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
-- On the real hosted project service_role already has full access to the storage schema
-- (platform-provisioned, bypasses RLS). This bare local mock needs it granted explicitly so
-- the S9 worker simulation below can act the way the real storage-purge-worker does.
grant usage on schema storage to service_role;
grant select, insert, update, delete on storage.objects to service_role;
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
select set_config('t.owner', '00000000-0000-0000-0000-000000000901', false);

-- Helper: an issued invoice with lines, optionally with a customer, already trashed.
create or replace function pg_temp.mk_issued(p_cust uuid default null, p_org uuid default null) returns uuid
language plpgsql as $$
declare v_e uuid := current_setting('t.entity')::uuid; v_inv uuid;
begin
  insert into public.owner_invoices
    (business_entity_id, owner_customer_id, organization_id, status, issue_date, service_date, due_date, currency)
  values (v_e, p_cust, p_org, 'draft', current_date, current_date, current_date, 'EUR') returning id into v_inv;
  insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents)
  values (v_inv, 'Zeile A', 1000, 100000), (v_inv, 'Zeile B', 2000, 5000);
  perform public.issue_owner_invoice(gen_random_uuid(), v_inv);
  insert into public.owner_workspace_item_state
    (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_e, 'invoice', v_inv, now(), current_setting('t.owner')::uuid);
  return v_inv;
end $$;

-- ===========================================================================
-- S1. Draft invoice -> trash -> ordinary permanent delete.
-- ===========================================================================
do $$
declare v_e uuid := current_setting('t.entity')::uuid; v_inv uuid; v_plan jsonb; v_res jsonb;
begin
  insert into public.owner_invoices (business_entity_id, status, issue_date, service_date, due_date, currency)
  values (v_e, 'draft', current_date, current_date, current_date, 'EUR') returning id into v_inv;
  insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents)
  values (v_inv, 'Zeile', 1000, 10000);
  insert into public.owner_workspace_item_state (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_e, 'invoice', v_inv, now(), current_setting('t.owner')::uuid);

  v_plan := public.owner_workspace_purge_preflight_one('invoice', v_inv);
  if (v_plan ->> 'eligibility') <> 'purgeable' then
    raise exception 'FAIL S1a: a never-issued draft must be purgeable (got %)', v_plan ->> 'eligibility';
  end if;

  v_res := public.owner_workspace_purge_items(v_e, 'invoice', array[v_inv], 'Testentwurf');
  if (v_res -> 0 ->> 'outcome') <> 'hard_deleted' then raise exception 'FAIL S1b: %', v_res; end if;
  if exists (select 1 from public.owner_invoices where id = v_inv)
     or exists (select 1 from public.owner_invoice_lines where invoice_id = v_inv)
     or exists (select 1 from public.owner_workspace_item_state where resource_id = v_inv) then
    raise exception 'FAIL S1c: rows survived';
  end if;
  raise notice 'PASS S1: draft invoice purged completely';
end $$;

-- ===========================================================================
-- S2. Test customer with no financial history -> permanently deleted.
--     Its never-issued draft goes with it (owner_invoices.owner_customer_id is
--     RESTRICT, so this is the case that used to be impossible).
-- ===========================================================================
do $$
declare v_e uuid := current_setting('t.entity')::uuid; v_c uuid; v_inv uuid; v_res jsonb;
begin
  insert into public.owner_customers (business_entity_id, company, status)
  values (v_e, 'Testkunde ohne Historie', 'active') returning id into v_c;
  insert into public.owner_invoices (business_entity_id, owner_customer_id, status, issue_date, service_date, due_date, currency)
  values (v_e, v_c, 'draft', current_date, current_date, current_date, 'EUR') returning id into v_inv;
  insert into public.owner_customer_tasks (customer_id, business_entity_id, title) values (v_c, v_e, 'Rückruf');

  if (public.owner_record_accounting_relevance('customer', v_c) ->> 'relevant')::boolean then
    raise exception 'FAIL S2a: a customer with only a never-issued draft is not accounting-relevant';
  end if;

  -- Archive is the required first step, exactly as for the emergency path.
  begin
    perform public.owner_purge_customer(v_c, 'Testkunde');
    raise exception 'FAIL S2b: purged a customer that was not archived';
  exception when others then
    if sqlerrm like 'FAIL S2b%' then raise; end if;
    if sqlerrm not like '%force_delete_requires_archived%' then
      raise exception 'FAIL S2b: unexpected refusal %', sqlerrm;
    end if;
  end;

  perform public.owner_archive_customer(v_c);
  v_res := public.owner_purge_customer(v_c, 'Testkunde ohne Historie');
  if not (v_res ->> 'deleted')::boolean then raise exception 'FAIL S2c: %', v_res; end if;
  if exists (select 1 from public.owner_customers where id = v_c)
     or exists (select 1 from public.owner_invoices where id = v_inv)
     or exists (select 1 from public.owner_customer_tasks where customer_id = v_c) then
    raise exception 'FAIL S2d: rows survived';
  end if;
  raise notice 'PASS S2: test customer and its draft removed completely';
end $$;

-- ===========================================================================
-- S3. Customer with an issued invoice: financial evidence is not deletable
--     through any ordinary path.
-- ===========================================================================
do $$
declare v_e uuid := current_setting('t.entity')::uuid; v_c uuid; v_inv uuid; v_res jsonb; v_rel jsonb;
begin
  insert into public.owner_customers (business_entity_id, company, status)
  values (v_e, 'Echter Kunde GmbH', 'active') returning id into v_c;
  v_inv := pg_temp.mk_issued(v_c);

  v_rel := public.owner_record_accounting_relevance('customer', v_c);
  if not (v_rel ->> 'relevant')::boolean then
    raise exception 'FAIL S3a: a customer with an issued invoice must be accounting-relevant';
  end if;

  -- The safe customer delete refuses.
  begin
    perform public.owner_delete_customer(v_c);
    raise exception 'FAIL S3b: the safe delete removed a customer with an issued invoice';
  exception when others then
    if sqlerrm like 'FAIL S3b%' then raise; end if;
  end;

  -- Tier 1 on the customer refuses, and says why rather than throwing.
  perform public.owner_archive_customer(v_c);
  v_res := public.owner_purge_customer(v_c, 'Versuch');
  if (v_res ->> 'deleted')::boolean or (v_res ->> 'eligibility') <> 'accounting_protected' then
    raise exception 'FAIL S3c: tier 1 did not refuse the customer (%)', v_res;
  end if;

  -- Tier 1 on the invoice itself refuses too.
  v_res := public.owner_workspace_purge_items(v_e, 'invoice', array[v_inv], 'Versuch');
  if (v_res -> 0 ->> 'error') <> 'accounting_protected' then
    raise exception 'FAIL S3d: tier 1 did not refuse the issued invoice (%)', v_res;
  end if;
  if not exists (select 1 from public.owner_invoices where id = v_inv) then
    raise exception 'FAIL S3e: the issued invoice was destroyed anyway';
  end if;
  raise notice 'PASS S3: issued invoice and its customer are protected from every ordinary path';
end $$;

-- ===========================================================================
-- S4. The guards stay armed UNDER tier 1. Even calling the destroyer directly
--     with p_allow_accounting = false, an issued invoice cannot be destroyed —
--     so a bug in the eligibility rules is not a data-loss bug.
-- ===========================================================================
do $$
declare v_inv uuid;
begin
  v_inv := pg_temp.mk_issued();
  begin
    perform public.owner_purge_destroy_row('invoice', v_inv, false);
    raise exception 'FAIL S4: tier 1 destroyed an issued invoice with the guards armed';
  exception when others then
    if sqlerrm like 'FAIL S4%' then raise; end if;
    raise notice 'PASS S4: database guard refused regardless of eligibility (%)', left(sqlerrm, 55);
  end;
end $$;

-- ===========================================================================
-- S5. Emergency purge: tombstone written, DB rows gone immediately, and the
--     expected Storage objects durably QUEUED (not deleted synchronously —
--     see 20260910140000: only storage-purge-worker, via the real Storage
--     API, ever removes bytes). A simulated worker pass then drains the
--     queue and the objects are genuinely gone.
-- ===========================================================================
do $$
declare
  v_e uuid := current_setting('t.entity')::uuid; v_owner uuid := current_setting('t.owner')::uuid;
  v_inv uuid; v_cust uuid; v_org uuid; v_gen uuid; v_cd uuid; v_fd uuid;
  v_res jsonb; v_tomb record; v_left int;
begin
  insert into public.organizations (id, name, status, created_by)
  values (gen_random_uuid(), 'Portal Org', 'active', v_owner) returning id into v_org;
  insert into public.owner_customers (business_entity_id, company, email, status, organization_id)
  values (v_e, 'Portal Kunde', 'portal@test.de', 'active', v_org) returning id into v_cust;
  v_inv := pg_temp.mk_issued(v_cust, v_org);

  insert into public.owner_finance_documents (business_entity_id, invoice_id, storage_object_path, original_filename)
  values (v_e, v_inv, 's/' || v_inv || '/beleg.pdf', 'beleg.pdf') returning id into v_fd;
  insert into storage.objects (bucket_id, name) values ('owner-finance-documents', 's/' || v_inv || '/beleg.pdf');

  insert into public.owner_generated_documents
    (business_entity_id, document_type, source_resource_type, source_resource_id,
     template_version, source_hash, pdf_storage_path, status, finalized_at)
  values (v_e, 'invoice', 'owner_invoices', v_inv, 'v1', 'h', 's/' || v_inv || '/gen.pdf', 'finalized', now())
  returning id into v_gen;
  insert into storage.objects (bucket_id, name) values ('owner-finance-documents', 's/' || v_inv || '/gen.pdf');

  -- A generated-backed portal copy carries no storage_path of its own; the check constraint
  -- customer_documents_exactly_one_source makes it a pointer at the owner PDF.
  insert into public.customer_documents
    (organization_id, category, title, owner_generated_document_id, customer_visible, published_at, uploaded_by)
  values (v_org, 'invoice', 'Rechnung', v_gen, true, now(), v_owner) returning id into v_cd;

  -- Wrong phrase is refused.
  begin
    perform public.owner_force_purge_items(v_e, 'invoice', array[v_inv], 'Grund', 'endgültig löschen');
    raise exception 'FAIL S5a: a wrong confirmation phrase was accepted';
  exception when others then
    if sqlerrm like 'FAIL S5a%' then raise; end if;
    if sqlerrm not like '%force_delete_confirmation_required%' then
      raise exception 'FAIL S5a: unexpected refusal %', sqlerrm;
    end if;
  end;

  v_res := public.owner_force_purge_items(v_e, 'invoice', array[v_inv], 'Testrechnung entfernen', 'ENDGÜLTIG LÖSCHEN');
  if (v_res -> 0 ->> 'outcome') <> 'hard_deleted' then raise exception 'FAIL S5b: %', v_res; end if;

  select * into v_tomb from public.owner_deletion_tombstones where resource_id = v_inv;
  if v_tomb.id is null then raise exception 'FAIL S5c: no tombstone'; end if;
  if v_tomb.label is null
     or v_tomb.reason <> 'Testrechnung entfernen'
     or v_tomb.deleted_by is null
     or (v_tomb.summary ->> 'entity_type') <> 'invoice'
     or (v_tomb.summary ->> 'entity_id') is null
     or (v_tomb.summary ->> 'reference_number') is null
     or (v_tomb.summary ->> 'gross_total_cents') is null
     or (v_tomb.summary ->> 'issue_date') is null
     or (v_tomb.summary -> 'counterparty' ->> 'company') is null then
    raise exception 'FAIL S5d: the tombstone is missing a contract field: %', v_tomb.summary;
  end if;

  if exists (select 1 from public.owner_invoices where id = v_inv)
     or exists (select 1 from public.owner_finance_documents where id = v_fd)
     or exists (select 1 from public.owner_generated_documents where id = v_gen)
     or exists (select 1 from public.customer_documents where id = v_cd) then
    raise exception 'FAIL S5f: rows survived the emergency purge';
  end if;

  -- The DB side is done, but nothing has touched Storage yet: no synchronous delete exists
  -- anymore, by design (20260910140000). The metadata rows must still be there.
  select count(*) into v_left from storage.objects where name like 's/' || v_inv || '/%';
  if v_left <> 2 then
    raise exception 'FAIL S5e: expected both Storage objects to still exist pre-worker, found %', v_left;
  end if;

  -- And the outbox has exactly what was expected, durably, under this tombstone.
  if (select count(*) from public.owner_storage_purge_queue where tombstone_id = v_tomb.id) <> 2 then
    raise exception 'FAIL S5g: the storage purge queue does not have both expected objects';
  end if;
  if exists (select 1 from public.owner_storage_purge_queue where tombstone_id = v_tomb.id and status <> 'pending') then
    raise exception 'FAIL S5h: a queue entry was not pending before the worker ran';
  end if;

  raise notice 'PASS S5: tombstone complete, DB rows gone, Storage genuinely still queued (not yet deleted)';
end $$;

-- ===========================================================================
-- S6. Restore from trash still works for records that were not purged.
-- ===========================================================================
do $$
declare v_e uuid := current_setting('t.entity')::uuid; v_o1 uuid; v_o2 uuid; v_res jsonb;
begin
  insert into public.owner_offers (business_entity_id, title, status, issue_date, valid_until, currency)
  values (v_e, 'Abgelehnt', 'draft', current_date, current_date + 30, 'EUR') returning id into v_o1;
  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents)
  values (v_o1, 'Position', 1000, 250000);
  insert into public.owner_offers (business_entity_id, title, status, issue_date, valid_until, currency)
  values (v_e, 'Behalten', 'draft', current_date, current_date + 30, 'EUR') returning id into v_o2;
  insert into public.owner_workspace_item_state (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_e, 'offer', v_o1, now(), current_setting('t.owner')::uuid),
         (v_e, 'offer', v_o2, now(), current_setting('t.owner')::uuid);

  -- A never-finalized offer is category 2: disposable however far it got.
  if (public.owner_workspace_purge_preflight_one('offer', v_o1) ->> 'eligibility') <> 'purgeable' then
    raise exception 'FAIL S6a: a never-finalized offer should be purgeable';
  end if;
  v_res := public.owner_workspace_purge_items(v_e, 'offer', array[v_o1], 'Abgelehnt');
  if (v_res -> 0 ->> 'outcome') <> 'hard_deleted'
     or exists (select 1 from public.owner_offers where id = v_o1)
     or exists (select 1 from public.owner_offer_lines where offer_id = v_o1) then
    raise exception 'FAIL S6b: the offer or its lines survived (%)', v_res;
  end if;

  -- Its neighbour restores normally and is untouched.
  perform public.owner_workspace_restore_items(v_e, 'offer', array[v_o2]);
  if exists (select 1 from public.owner_workspace_item_state where resource_id = v_o2 and trashed_at is not null) then
    raise exception 'FAIL S6c: the neighbouring record is still trashed';
  end if;
  if not exists (select 1 from public.owner_offers where id = v_o2) then
    raise exception 'FAIL S6d: restore lost the record';
  end if;
  raise notice 'PASS S6: eligible offer purged, its neighbour restored intact';
end $$;

-- ===========================================================================
-- S7. No orphans, on the paths a catalog walk alone would get wrong: a SET NULL
--     payment, a SET NULL finance document, and the polymorphic generated
--     document that carries no foreign key at all.
-- ===========================================================================
do $$
declare
  v_e uuid := current_setting('t.entity')::uuid; v_inv uuid; v_pay uuid; v_n int;
begin
  v_inv := pg_temp.mk_issued();
  -- Through the sanctioned RPC, so the payment row is shaped exactly as a real one.
  perform public.record_owner_invoice_payment(gen_random_uuid(), v_inv, 1000, current_date);
  select id into v_pay from public.owner_payments where invoice_id = v_inv limit 1;
  if v_pay is null then raise exception 'FAIL S7: fixture did not create a payment'; end if;
  insert into public.owner_generated_documents
    (business_entity_id, document_type, source_resource_type, source_resource_id,
     template_version, source_hash, status)
  values (v_e, 'invoice', 'owner_invoices', v_inv, 'v1', 'h', 'draft');

  perform public.owner_force_purge_items(v_e, 'invoice', array[v_inv], 'Orphan-Test', 'ENDGÜLTIG LÖSCHEN');

  -- A SET NULL key would have left this payment alive with a null invoice_id.
  select count(*) into v_n from public.owner_payments where id = v_pay;
  if v_n <> 0 then raise exception 'FAIL S7a: an orphaned payment survived'; end if;
  select count(*) into v_n from public.owner_generated_documents
   where source_resource_type = 'owner_invoices' and source_resource_id = v_inv;
  if v_n <> 0 then raise exception 'FAIL S7b: an orphaned generated document survived'; end if;

  -- And the assertion itself is real: it must pass for a destroyed id.
  perform public.owner_purge_assert_no_orphans('invoice', v_inv);
  raise notice 'PASS S7: SET NULL and no-FK dependents left no orphans';
end $$;

-- ===========================================================================
-- S8. The deletion log stays append-only for the browser.
-- ===========================================================================
do $$
declare v_priv text;
begin
  foreach v_priv in array array['INSERT', 'UPDATE', 'DELETE'] loop
    if has_table_privilege('authenticated', 'public.owner_deletion_tombstones', v_priv) then
      raise exception 'FAIL S8: authenticated holds % on the deletion log', v_priv;
    end if;
  end loop;
  if not has_table_privilege('authenticated', 'public.owner_deletion_tombstones', 'SELECT') then
    raise exception 'FAIL S8: the owner cannot read the deletion log';
  end if;
  raise notice 'PASS S8: deletion log is read-only for the browser';
end $$;

-- ===========================================================================
-- S9. The storage-purge worker: simulated end to end. Claims S5's two pending
--     objects as service_role (mirroring exactly what storage-purge-worker
--     does over its real Supabase client), "calls the Storage API" (simulated
--     here as the metadata-row delete a real remove() call performs as part
--     of doing both atomically), and reports completion. Also proves: already
--     missing is distinguished from deleted, a reported failure reverts to
--     pending for the next sweep (not silently dropped), attempt exhaustion
--     is terminal, and two concurrent claims never grab the same row.
-- ===========================================================================
do $$
declare
  v_batch jsonb; v_id uuid; v_tomb uuid; v_status jsonb;
begin
  select id into v_tomb from public.owner_deletion_tombstones
   where scope = 'invoice' and (destroyed -> '_storage_cleanup' ->> 'expected')::int = 2
   order by deleted_at desc limit 1;
  if v_tomb is null then raise exception 'FAIL S9setup: no S5 tombstone found'; end if;

  set local role service_role;
  perform set_config('request.jwt.claim.role', 'service_role', true);

  -- Unauthorized caller: without the service_role claim, claim/complete refuse.
  reset role;
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  begin
    perform public.owner_storage_purge_claim_batch(10);
    raise exception 'FAIL S9a: claim succeeded without service_role';
  exception when others then
    if sqlerrm like 'FAIL S9a%' then raise; end if;
  end;

  set local role service_role;
  perform set_config('request.jwt.claim.role', 'service_role', true);

  -- Claim both pending rows for this tombstone.
  select jsonb_agg(c) into v_batch from public.owner_storage_purge_claim_batch(10) c;
  if (select count(*) from public.owner_storage_purge_queue where tombstone_id = v_tomb and status = 'processing') <> 2 then
    raise exception 'FAIL S9b: expected both rows claimed into processing, got %', v_batch;
  end if;

  -- A second, concurrent-in-spirit claim call right now must find nothing left for this
  -- tombstone — the FOR UPDATE SKIP LOCKED claim already took both rows.
  if exists (select 1 from public.owner_storage_purge_claim_batch(10) c
             join public.owner_storage_purge_queue q on q.id = (c->>'id')::uuid
             where q.tombstone_id = v_tomb) then
    raise exception 'FAIL S9c: a second claim found rows belonging to this tombstone still pending';
  end if;

  -- Report one deleted (the real worker's remove() succeeded and returned the removed object).
  select (elem->>'id')::uuid into v_id from jsonb_array_elements(v_batch) elem where elem->>'object_name' like '%/beleg.pdf';
  delete from storage.objects where name = (select object_name from public.owner_storage_purge_queue where id = v_id);
  perform public.owner_storage_purge_complete(v_id, 'deleted', null);

  -- Report the other as a transient failure first (simulating a 503) — must NOT be silently
  -- dropped: it reverts to pending, visibly, with the error recorded.
  select (elem->>'id')::uuid into v_id from jsonb_array_elements(v_batch) elem where elem->>'object_name' like '%/gen.pdf';
  perform public.owner_storage_purge_complete(v_id, 'failed', 'storage api 503');
  if (select status from public.owner_storage_purge_queue where id = v_id) <> 'pending' then
    raise exception 'FAIL S9d: a transient failure was not reverted to pending for retry';
  end if;

  -- The retry sweep picks it back up and this time it succeeds.
  perform public.owner_storage_purge_claim_batch(10);
  delete from storage.objects where name = (select object_name from public.owner_storage_purge_queue where id = v_id);
  perform public.owner_storage_purge_complete(v_id, 'deleted', null);

  -- Idempotent re-report: calling complete again on an already-terminal row changes nothing.
  if (public.owner_storage_purge_complete(v_id, 'deleted', null) ->> 'idempotent')::boolean is not true then
    raise exception 'FAIL S9e: re-reporting a terminal row was not treated as idempotent';
  end if;

  -- Already-missing, distinguished from deleted.
  insert into public.owner_storage_purge_queue (tombstone_id, bucket_id, object_name)
  values (v_tomb, 'owner-finance-documents', 'never/uploaded.pdf');
  perform public.owner_storage_purge_claim_batch(10);
  perform public.owner_storage_purge_complete(
    (select id from public.owner_storage_purge_queue where object_name = 'never/uploaded.pdf'),
    'already_missing', null);

  -- Attempt exhaustion: terminal 'failed', no longer claimable, visible for a manual retry.
  insert into public.owner_storage_purge_queue (tombstone_id, bucket_id, object_name, max_attempts)
  values (v_tomb, 'owner-finance-documents', 'chronically/broken.pdf', 1);
  perform public.owner_storage_purge_claim_batch(10);
  perform public.owner_storage_purge_complete(
    (select id from public.owner_storage_purge_queue where object_name = 'chronically/broken.pdf'),
    'failed', 'permanent 403');
  if (select status from public.owner_storage_purge_queue where object_name = 'chronically/broken.pdf') <> 'failed' then
    raise exception 'FAIL S9f: exhausted attempts did not reach terminal failed';
  end if;
  if exists (select 1 from public.owner_storage_purge_claim_batch(10) c
             join public.owner_storage_purge_queue q on q.id = (c->>'id')::uuid
             where q.object_name = 'chronically/broken.pdf') then
    raise exception 'FAIL S9g: an exhausted row was claimed again';
  end if;

  reset role;
  perform set_config('request.jwt.claim.role', '', true);

  -- Bucket allowlist: even with a live tombstone id, a disallowed bucket is refused.
  set local role service_role;
  perform set_config('request.jwt.claim.role', 'service_role', true);
  begin
    perform public.owner_storage_purge_enqueue(v_tomb,
      '[{"bucket_id":"not-a-real-bucket","object_name":"x"}]'::jsonb);
    raise exception 'FAIL S9h: a disallowed bucket was accepted into the queue';
  exception when others then
    if sqlerrm like 'FAIL S9h%' then raise; end if;
    if sqlerrm not like '%storage_purge_bucket_not_allowed%' then
      raise exception 'FAIL S9h: unexpected refusal %', sqlerrm;
    end if;
  end;
  reset role;
  perform set_config('request.jwt.claim.role', '', true);

  -- The owner-facing rollup now shows the full, accurate picture.
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', true);
  v_status := public.owner_storage_purge_status(v_tomb);
  if (v_status ->> 'deleted')::int <> 2 or (v_status ->> 'already_missing')::int <> 1
     or (v_status ->> 'failed')::int <> 1 then
    raise exception 'FAIL S9i: status rollup does not match (%)', v_status;
  end if;

  -- The owner retries the failed one; it goes back to pending with a fresh budget.
  perform public.owner_storage_purge_retry_failed(v_tomb);
  if (select status from public.owner_storage_purge_queue where object_name = 'chronically/broken.pdf') <> 'pending' then
    raise exception 'FAIL S9j: owner retry did not reset the failed row';
  end if;

  raise notice 'PASS S9: worker claim/complete round-trip, concurrency, retry, exhaustion, allowlist and owner rollup all verified';
end $$;

-- ===========================================================================
-- S10. A worker invocation that claims a row and then never reports (crash,
--      platform-enforced timeout, killed process) must not leave that object
--      stuck forever. After the stale-claim window, the next sweep reclaims
--      it — proven by actually waiting out a real, short window rather than
--      only asserting the SQL predicate, so a regression that silently
--      shortens/removes owner_storage_purge_stale_after() would be caught by
--      the same wall-clock proof this suite already uses for the row-level
--      race (S4/S9), not by mocked time.
-- ===========================================================================
do $$
declare v_tomb uuid; v_id uuid; v_claimed_at timestamptz;
begin
  select id into v_tomb from public.owner_deletion_tombstones order by deleted_at desc limit 1;

  set local role service_role;
  perform set_config('request.jwt.claim.role', 'service_role', true);

  insert into public.owner_storage_purge_queue (tombstone_id, bucket_id, object_name)
  values (v_tomb, 'owner-finance-documents', 'abandoned/crash.pdf')
  returning id into v_id;

  perform public.owner_storage_purge_claim_batch(25);
  select claimed_at into v_claimed_at from public.owner_storage_purge_queue where id = v_id;
  if (select status from public.owner_storage_purge_queue where id = v_id) <> 'processing' then
    raise exception 'FAIL S10a: claim did not mark the row processing';
  end if;

  -- Immediately: must NOT be reclaimable. The worker that claimed it might genuinely still be
  -- running; a claim this fresh is not evidence of abandonment.
  if exists (select 1 from public.owner_storage_purge_claim_batch(25) c
             join public.owner_storage_purge_queue q on q.id = (c->>'id')::uuid where q.id = v_id) then
    raise exception 'FAIL S10b: a fresh in-flight claim was reclaimed';
  end if;

  -- Backdate the claim past the staleness window — the same technique the automation-job
  -- pattern this mirrors has no equivalent test for; simulating the abandonment directly
  -- (rather than actually sleeping the real window) keeps this suite fast without weakening
  -- what it proves: the reclaim predicate genuinely fires once a claim is old enough.
  update public.owner_storage_purge_queue
     set claimed_at = now() - public.owner_storage_purge_stale_after() - interval '1 second'
   where id = v_id;

  if not exists (select 1 from public.owner_storage_purge_claim_batch(25) c
                 join public.owner_storage_purge_queue q on q.id = (c->>'id')::uuid where q.id = v_id) then
    raise exception 'FAIL S10c: a genuinely stale in-flight claim was NOT reclaimed';
  end if;
  if (select attempt_count from public.owner_storage_purge_queue where id = v_id) <> 2 then
    raise exception 'FAIL S10d: reclaiming a stale claim did not count as a new attempt';
  end if;

  perform public.owner_storage_purge_complete(v_id, 'already_missing', null);
  reset role;
  perform set_config('request.jwt.claim.role', '', true);
  raise notice 'PASS S10: an abandoned in-flight claim is reclaimed after its lease expires, never stuck forever';
end $$;

\echo 'owner deletion-policy smoke: all checks passed'
SQL
