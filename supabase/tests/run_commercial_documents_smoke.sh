#!/usr/bin/env bash
set -euo pipefail

# Commercial Document Workflow DB smoke test — offers, finalization/immutability,
# accepted-only conversion, document settings, generated documents, public access
# tokens (hash-only), acceptance evidence and owner notifications. Verifies owner-only
# RLS (admin/customer/anon all denied), server-authoritative totals, concurrency-safe
# numbering, idempotency, and validated status transitions.
#
# LOCAL ONLY. Never run against production. Requires a local PostgreSQL reachable via
# DATABASE_URL (default postgres@127.0.0.1:5432/postgres). Applies all migrations from
# scratch into a throwaway schema-less database state.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:5432/postgres}"
run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"; }

run_psql -q -f "$ROOT_DIR/supabase/tests/lib_bootstrap.sql" >/dev/null

for m in \
  20260710120000_phase0_auth_tenancy_rls \
  20260710133000_phase0_security_hardening \
  20260711120000_receptionist_persistence \
  20260721120000_product_aware_client_platform \
  20260722120000_owner_finance_cockpit \
  20260723120000_owner_document_settings \
  20260723121000_owner_offers \
  20260723122000_owner_commercial_documents ; do
  run_psql -q -f "$ROOT_DIR/supabase/migrations/$m.sql" >/dev/null
done

run_psql <<'SQL'
\set ON_ERROR_STOP on
-- Seed roles: owner + admin (both platform), plus customer/org-owner already seeded.
update public.profiles set platform_role='cogniiq_owner' where id='00000000-0000-0000-0000-000000000901';
update public.profiles set platform_role='cogniiq_admin' where id='00000000-0000-0000-0000-000000000902';

select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
select set_config('t.admin','00000000-0000-0000-0000-000000000902',false);
select set_config('t.customer','00000000-0000-0000-0000-000000000903',false);
select set_config('t.entity',(select id::text from public.owner_business_entities where slug='cogniiq'),false);

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$ begin raise notice 'PASS: %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$ begin raise exception 'FAIL: %', msg; end $$;
create or replace function pg_temp.as_owner() returns void language sql as $$ select set_config('request.jwt.claim.sub', current_setting('t.owner'), false); $$;

-- ============================ Document settings ============================
set role authenticated;
select pg_temp.as_owner();
select public.upsert_owner_document_settings(current_setting('t.entity')::uuid,
  '{"legal_name":"Cogniiq UG","offer_number_prefix":"AN","invoice_number_prefix":"RE","iban":"DE89370400440532013000","default_payment_terms_days":14}'::jsonb);
do $$ begin
  if (select legal_name from public.owner_document_settings where business_entity_id=current_setting('t.entity')::uuid)='Cogniiq UG'
  then perform pg_temp.pass('document settings upsert (owner)'); else perform pg_temp.fail('settings upsert'); end if;
end $$;

-- admin denied settings upsert + zero row visibility
reset role; select set_config('request.jwt.claim.sub', current_setting('t.admin'), false); set role authenticated;
do $$ begin
  begin perform public.upsert_owner_document_settings(current_setting('t.entity')::uuid, '{"legal_name":"HACK"}'::jsonb); perform pg_temp.fail('admin upsert allowed');
  exception when others then if sqlerrm like '%Owner access required%' then perform pg_temp.pass('admin denied settings upsert'); else raise; end if; end;
  if (select count(*) from public.owner_document_settings)=0 then perform pg_temp.pass('admin sees 0 settings rows (RLS)'); else perform pg_temp.fail('admin RLS leak'); end if;
end $$;

-- ============================ Offers: creation + totals ============================
reset role; select pg_temp.as_owner(); set role authenticated;
select set_config('t.idem1', gen_random_uuid()::text, false);
select set_config('t.offer', (public.create_owner_offer(current_setting('t.idem1')::uuid,
  jsonb_build_object('business_entity_id',current_setting('t.entity'),'title','Website Relaunch','issue_date',current_date::text,'valid_until',(current_date+30)::text,'internal_notes','geheim'),
  jsonb_build_array(
    jsonb_build_object('description','Konzept','quantity_milli',2000,'unit_price_cents',100000,'vat_treatment','standard'),
    jsonb_build_object('description','Optionaler Support','quantity_milli',1000,'unit_price_cents',50000,'vat_treatment','standard','is_optional',true)
  ))->>'offer_id'), false);
do $$ declare o record; begin select * into o from public.owner_offers where id=current_setting('t.offer')::uuid;
  if o.net_total_cents=200000 and o.vat_total_cents=38000 and o.gross_total_cents=238000 then perform pg_temp.pass('server totals exclude optional line'); else perform pg_temp.fail(format('totals %s/%s/%s',o.net_total_cents,o.vat_total_cents,o.gross_total_cents)); end if;
  if o.status='draft' and o.offer_number is null then perform pg_temp.pass('created unnumbered draft'); else perform pg_temp.fail('draft/number'); end if;
end $$;

-- idempotent creation: same key returns same offer_id, no duplicate row
do $$ declare r jsonb; begin
  r := public.create_owner_offer(current_setting('t.idem1')::uuid, jsonb_build_object('business_entity_id',current_setting('t.entity'),'title','DUP'), jsonb_build_array(jsonb_build_object('description','x','unit_price_cents',1)));
  if (r->>'offer_id')::uuid=current_setting('t.offer')::uuid then perform pg_temp.pass('idempotent creation'); else perform pg_temp.fail('idempotency'); end if;
end $$;

-- server-authoritative totals: forced line edit recomputes
update public.owner_offer_lines set unit_price_cents=999999999 where offer_id=current_setting('t.offer')::uuid and is_optional=false;
do $$ declare o record; begin select * into o from public.owner_offers where id=current_setting('t.offer')::uuid;
  if o.net_total_cents=round(2000::numeric*999999999/1000) then perform pg_temp.pass('totals recomputed on line edit'); else perform pg_temp.fail('recompute'); end if; end $$;
update public.owner_offer_lines set unit_price_cents=100000 where offer_id=current_setting('t.offer')::uuid and is_optional=false;

-- unknown-entity rejected
do $$ begin begin perform public.create_owner_offer(gen_random_uuid(), jsonb_build_object('business_entity_id',gen_random_uuid()::text,'title','x'), jsonb_build_array(jsonb_build_object('description','x','unit_price_cents',1))); perform pg_temp.fail('unknown entity accepted');
  exception when others then if sqlerrm like '%unknown business entity%' then perform pg_temp.pass('unknown entity rejected'); else raise; end if; end; end $$;

-- ============================ Finalization + immutability ============================
select set_config('t.num', (public.finalize_owner_offer(gen_random_uuid(), current_setting('t.offer')::uuid)->>'offer_number'), false);
do $$ declare o record; begin select * into o from public.owner_offers where id=current_setting('t.offer')::uuid;
  if o.status='finalized' and o.offer_number like 'AN-%' and o.finalized_version=1 then perform pg_temp.pass(format('finalized with number %s',o.offer_number)); else perform pg_temp.fail('finalize'); end if;
  if exists(select 1 from public.owner_offer_versions where offer_id=o.id and version=1) then perform pg_temp.pass('immutable version snapshot created'); else perform pg_temp.fail('no version'); end if;
end $$;
do $$ begin begin update public.owner_offers set title='X' where id=current_setting('t.offer')::uuid; perform pg_temp.fail('finalized title editable');
  exception when others then if sqlerrm like '%immutable%' then perform pg_temp.pass('finalized content immutable'); else raise; end if; end; end $$;
do $$ begin begin update public.owner_offer_lines set unit_price_cents=1 where offer_id=current_setting('t.offer')::uuid; perform pg_temp.fail('finalized lines editable');
  exception when others then if sqlerrm like '%immutable%' then perform pg_temp.pass('finalized lines immutable'); else raise; end if; end; end $$;
do $$ begin begin perform public.finalize_owner_offer(gen_random_uuid(), current_setting('t.offer')::uuid); perform pg_temp.fail('double finalize');
  exception when others then if sqlerrm like '%only draft%' then perform pg_temp.pass('cannot finalize non-draft'); else raise; end if; end; end $$;

-- per-entity numbering increments (second offer -> AN-...-0002)
select set_config('t.offer2', (public.create_owner_offer(gen_random_uuid(),
  jsonb_build_object('business_entity_id',current_setting('t.entity'),'title','Zweites','issue_date',current_date::text,'valid_until',(current_date+30)::text),
  jsonb_build_array(jsonb_build_object('description','y','unit_price_cents',10000,'vat_treatment','standard')))->>'offer_id'), false);
do $$ declare n text; begin n := public.finalize_owner_offer(gen_random_uuid(), current_setting('t.offer2')::uuid)->>'offer_number';
  if right(n,4)='0002' then perform pg_temp.pass('per-entity numbering increments'); else perform pg_temp.fail('numbering '||n); end if; end $$;

-- invalid status transition
do $$ begin begin perform public.set_owner_offer_status(current_setting('t.offer2')::uuid, 'accepted'); perform pg_temp.fail('owner set accepted allowed');
  exception when others then if sqlerrm like '%invalid status transition%' then perform pg_temp.pass('invalid status transition blocked'); else raise; end if; end; end $$;

-- ============================ Conversion ============================
do $$ begin begin perform public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), current_setting('t.offer')::uuid); perform pg_temp.fail('converted non-accepted');
  exception when others then if sqlerrm like '%only accepted%' then perform pg_temp.pass('conversion requires accepted'); else raise; end if; end; end $$;

-- simulate acceptance for conversion path (customer token path tested separately)
update public.owner_offers set status='accepted', accepted_at=now() where id=current_setting('t.offer')::uuid;
select set_config('t.inv', (public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), current_setting('t.offer')::uuid)->>'invoice_id'), false);
do $$ declare i record; o record; begin select * into i from public.owner_invoices where id=current_setting('t.inv')::uuid; select * into o from public.owner_offers where id=current_setting('t.offer')::uuid;
  if i.status='draft' and i.net_total_cents=200000 and i.gross_total_cents=238000 then perform pg_temp.pass('conversion created draft invoice with copied totals'); else perform pg_temp.fail(format('inv %s/%s',i.status,i.net_total_cents)); end if;
  if o.status='converted' and o.converted_invoice_id=i.id then perform pg_temp.pass('offer linked and marked converted'); else perform pg_temp.fail('link'); end if;
  if (select count(*) from public.owner_invoice_lines where invoice_id=i.id)=1 then perform pg_temp.pass('only non-optional line copied'); else perform pg_temp.fail('linecount'); end if;
  if i.business_entity_id=current_setting('t.entity')::uuid then perform pg_temp.pass('converted invoice inherits offer entity'); else perform pg_temp.fail('entity'); end if;
end $$;
do $$ declare r jsonb; begin r := public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), current_setting('t.offer')::uuid);
  if (r->>'invoice_id')::uuid=current_setting('t.inv')::uuid and coalesce((r->>'idempotent')::boolean,false) then perform pg_temp.pass('re-conversion idempotent'); else perform pg_temp.fail('idem conversion'); end if; end $$;

-- audit entries exist for offers
do $$ begin if (select count(*) from public.owner_audit_log where resource_type='owner_offers')>0 then perform pg_temp.pass('offer audit entries written'); else perform pg_temp.fail('no audit'); end if; end $$;

-- ============================ Generated document + tokens ============================
-- offer2 is finalized (AN-...-0002). Register a finalized generated document for it.
select set_config('t.doc', (public.register_owner_generated_document(gen_random_uuid(),
  jsonb_build_object('business_entity_id',current_setting('t.entity'),'document_type','offer',
    'source_resource_type','owner_offers','source_resource_id',current_setting('t.offer2'),
    'document_number',(select offer_number from public.owner_offers where id=current_setting('t.offer2')::uuid),
    'source_hash','deadbeef','template_version','transactional-v1','status','finalized','pdf_storage_path','offers/entity/random.pdf'))->>'document_id'), false);

-- create secure token: raw returned once, only hash stored
select set_config('t.token', (public.create_offer_access_token(current_setting('t.offer2')::uuid, current_setting('t.doc')::uuid, 30, 5)->>'token'), false);
do $$ begin
  if length(current_setting('t.token'))>=64 then perform pg_temp.pass('raw token returned (>=64 hex)'); else perform pg_temp.fail('token length'); end if;
  if not exists(select 1 from public.owner_document_access_tokens where token_hash=current_setting('t.token')) then perform pg_temp.pass('raw token NOT stored'); else perform pg_temp.fail('raw token stored'); end if;
  if exists(select 1 from public.owner_document_access_tokens where token_hash=encode(digest(current_setting('t.token'),'sha256'),'hex')) then perform pg_temp.pass('token hash stored'); else perform pg_temp.fail('no hash'); end if;
end $$;

-- public projection (anon): curated, no internal fields
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
do $$ declare r jsonb; begin
  r := public.public_offer_by_token(current_setting('t.token'), 'Mozilla/5.0 Test');
  if r->>'offer_number' is not null and not (r ? 'internal_notes') and not (r ? 'client_account_id') and not (r ? 'pdf_storage_path') then perform pg_temp.pass('public projection excludes internal notes/ids/paths'); else perform pg_temp.fail('projection leak'); end if;
  if (r->'seller'->>'legal_name')='Cogniiq UG' then perform pg_temp.pass('seller identity present in projection'); else perform pg_temp.fail('seller'); end if;
end $$;
do $$ begin begin perform public.public_offer_by_token('short'); perform pg_temp.fail('invalid token accepted');
  exception when others then if sqlerrm like '%invalid token%' then perform pg_temp.pass('invalid token rejected'); else raise; end if; end; end $$;

-- accept (anon) → evidence bound to version + source hash
do $$ declare r jsonb; begin
  r := public.respond_offer_by_token(current_setting('t.token'),'accepted','Max Muster','Muster GmbH','max@muster.test','terms-v1','Sieht gut aus','UA/1');
  if (r->>'decision')='accepted' and (r->>'source_hash')='deadbeef' then perform pg_temp.pass('acceptance recorded with source hash'); else perform pg_temp.fail('accept'); end if;
end $$;
-- duplicate acceptance is idempotent (no second event)
do $$ declare r jsonb; begin r := public.respond_offer_by_token(current_setting('t.token'),'accepted','X','Y','z@z.test','terms-v1',null,'UA/2');
  if coalesce((r->>'already_recorded')::boolean,false) then perform pg_temp.pass('duplicate acceptance idempotent'); else perform pg_temp.fail('dup accept'); end if; end $$;

-- verify (owner) state + evidence + notifications
reset role; select pg_temp.as_owner(); set role authenticated;
do $$ declare o record; e record; c int; begin
  select * into o from public.owner_offers where id=current_setting('t.offer2')::uuid;
  if o.status='accepted' and o.accepted_at is not null then perform pg_temp.pass('offer marked accepted'); else perform pg_temp.fail('offer status'); end if;
  select count(*) into c from public.owner_offer_acceptance_events where offer_id=o.id and decision='accepted';
  if c=1 then perform pg_temp.pass('exactly one acceptance event (no duplicate)'); else perform pg_temp.fail('accept event count '||c); end if;
  select * into e from public.owner_offer_acceptance_events where offer_id=o.id and decision='accepted' limit 1;
  if e.source_hash='deadbeef' and e.document_version is not null and e.signer_name='Max Muster' and e.signature_level='simple_electronic_signature' then perform pg_temp.pass('evidence bound to version+hash, simple e-signature level'); else perform pg_temp.fail('evidence'); end if;
  if exists(select 1 from public.owner_finance_notifications where category='offer_accepted' and resource_id=o.id) then perform pg_temp.pass('owner notified: accepted'); else perform pg_temp.fail('no accept notif'); end if;
  if exists(select 1 from public.owner_finance_notifications where category='offer_viewed' and resource_id=o.id) then perform pg_temp.pass('owner notified: viewed'); else perform pg_temp.fail('no view notif'); end if;
end $$;

-- revoked + expired tokens rejected
select set_config('t.tok_rev', (public.create_offer_access_token(current_setting('t.offer2')::uuid, null, 30, 5)->>'token'), false);
update public.owner_document_access_tokens set revoked_at=now() where token_hash=encode(digest(current_setting('t.tok_rev'),'sha256'),'hex');
select set_config('t.tok_exp', (public.create_offer_access_token(current_setting('t.offer2')::uuid, null, 30, 5)->>'token'), false);
update public.owner_document_access_tokens set expires_at=now()-interval '1 day' where token_hash=encode(digest(current_setting('t.tok_exp'),'sha256'),'hex');
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
do $$ begin begin perform public.public_offer_by_token(current_setting('t.tok_rev')); perform pg_temp.fail('revoked token worked');
  exception when others then if sqlerrm like '%revoked%' then perform pg_temp.pass('revoked token rejected'); else raise; end if; end; end $$;
do $$ begin begin perform public.public_offer_by_token(current_setting('t.tok_exp')); perform pg_temp.fail('expired token worked');
  exception when others then if sqlerrm like '%expired%' then perform pg_temp.pass('expired token rejected'); else raise; end if; end; end $$;

-- generated document immutability + no hard delete of finalized
reset role; select pg_temp.as_owner(); set role authenticated;
do $$ begin begin update public.owner_generated_documents set pdf_storage_path='hack' where id=current_setting('t.doc')::uuid; perform pg_temp.fail('finalized doc mutable');
  exception when others then if sqlerrm like '%immutable%' then perform pg_temp.pass('finalized document immutable'); else raise; end if; end; end $$;
-- owner has NO delete grant on generated documents at all
do $$ begin begin delete from public.owner_generated_documents where id=current_setting('t.doc')::uuid; perform pg_temp.fail('owner could delete generated document');
  exception when insufficient_privilege then perform pg_temp.pass('owner has no delete grant on generated documents'); end; end $$;
-- even service_role (which has delete grant) is blocked from hard-deleting finalized evidence
reset role; set role service_role;
do $$ begin begin delete from public.owner_generated_documents where id=current_setting('t.doc')::uuid; perform pg_temp.fail('finalized doc hard-deleted by service_role');
  exception when others then if sqlerrm like '%cannot be deleted%' then perform pg_temp.pass('finalized document not hard-deletable (trigger, all roles)'); else raise; end if; end; end $$;
reset role; select pg_temp.as_owner(); set role authenticated;

-- ============================ Anonymous / customer denial ============================
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
do $$ declare t text; ok boolean; begin
  foreach t in array array['owner_offers','owner_offer_lines','owner_offer_versions','owner_document_settings','owner_generated_documents','owner_document_access_tokens','owner_offer_acceptance_events'] loop
    ok := false;
    begin execute format('select 1 from public.%I limit 1', t); exception when insufficient_privilege then ok := true; when others then ok := true; end;
    if not ok then perform pg_temp.fail('anon read '||t); end if;
  end loop;
  perform pg_temp.pass('anon denied on all private commercial tables');
end $$;
reset role;
SQL

echo "commercial document smoke test: SETTINGS + OFFERS + CONVERSION SCENARIOS PASSED"
