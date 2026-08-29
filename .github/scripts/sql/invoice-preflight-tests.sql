-- owner_invoice_preflight: missing-field reporting (20260901120000).
--
-- These tests EXECUTE the function against a real Postgres. That matters more than usual here:
-- the bug being fixed is an OPERATOR RESOLUTION bug. `missing := missing || 'literal'` compiles
-- fine, passes every source-level check, and only fails when the branch actually runs — which is
-- why it survived from 20260723125000 until now. Only a suite that reaches each branch with real
-- data can prove it is gone.
--
-- Covered:
--   1  nothing missing -> the pre-existing happy path, unchanged
--   2  ONE missing field -> no exception, that field reported
--   3  every field individually -> all seven identifiers reachable
--   4  MANY missing fields -> all of them, in the fixed check order
--   5  everything missing -> all seven, deterministic
--   6  the result SHAPE callers rely on: exactly {ok, missing}, ok boolean, missing an array
--   7  repeated calls are byte-identical (deterministic ordering)
--   8  owner_process_offer_acceptance no longer propagates the error and still completes
--   9  the preflight-gated automation branches still behave as before
--
-- ON_ERROR_STOP=1 -> any failed assertion aborts with a non-zero exit.

\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$
begin raise notice 'PASS: %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$
begin raise exception 'FAIL: %', msg; end $$;
create or replace function pg_temp.want(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then perform pg_temp.pass(msg); else perform pg_temp.fail(msg); end if; end $$;

select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('t.owner')::uuid;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);
select set_config('request.jwt.claim.role', 'authenticated', false);

set session_replication_role = replica;
delete from public.owner_invoice_versions;
delete from public.owner_payments;
delete from public.owner_invoice_lines;
delete from public.owner_invoices;
delete from public.owner_offer_lines;
delete from public.owner_offer_acceptance_events;
delete from public.owner_offers;
delete from public.owner_finance_notifications;
delete from public.owner_automation_jobs;
delete from public.owner_document_settings;
set session_replication_role = origin;

select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

-- ---------------------------------------------------------------------------
-- Fixtures. A COMPLETE settings row and a COMPLETE offer are the baseline; each
-- test below removes exactly the fields it is about and puts them back after.
-- ---------------------------------------------------------------------------
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city,
  tax_number, vat_id, invoice_number_prefix, business_email)
values (current_setting('t.entity')::uuid, 'Cogniiq UG', 'Erststr. 1', '10115', 'Berlin',
  'TAX-1', 'DE1', 'RE', 'rechnung@cogniiq.example');

insert into public.owner_offers (id, business_entity_id, status, title, offer_number, currency, created_by,
  recipient_company, recipient_street, recipient_postal_code, recipient_city, recipient_email)
values ('11111111-1111-1111-1111-111111111111', current_setting('t.entity')::uuid, 'draft', 'Vollstaendig',
  'AN-OK', 'EUR', current_setting('t.owner')::uuid,
  'Kunde AG', 'Kundenstr. 1', '20095', 'Hamburg', 'kunde@example.test');

-- An offer carrying NO recipient data at all.
insert into public.owner_offers (id, business_entity_id, status, title, offer_number, currency, created_by)
values ('22222222-2222-2222-2222-222222222222', current_setting('t.entity')::uuid, 'draft', 'Ohne Empfaenger',
  'AN-BARE', 'EUR', current_setting('t.owner')::uuid);

create or replace function pg_temp.pre(p_offer uuid) returns jsonb language sql as $$
  select public.owner_invoice_preflight(current_setting('t.entity')::uuid, p_offer) $$;
create or replace function pg_temp.missing_of(p_offer uuid) returns text[] language sql as $$
  select array(select jsonb_array_elements_text(pg_temp.pre(p_offer) -> 'missing')) $$;

-- ---------------------------------------------------------------------------
-- 1. Nothing missing: the behaviour that already worked, unchanged.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb;
begin
  r := pg_temp.pre('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want((r->>'ok')::boolean, 'a complete offer + complete settings still pass');
  perform pg_temp.want(r->'missing' = '[]'::jsonb, 'and report an empty missing array');
  perform pg_temp.want(r = '{"ok": true, "missing": []}'::jsonb,
    'the passing result is byte-identical to the pre-fix behaviour');
end $$;

-- ---------------------------------------------------------------------------
-- 2. ONE missing field. Before the fix this raised
--    `malformed array literal: "recipient_legal_name"` instead of returning.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; v_err text;
begin
  begin
    r := public.owner_invoice_preflight(current_setting('t.entity')::uuid,
      '22222222-2222-2222-2222-222222222222');
    v_err := null;
  exception when others then v_err := sqlerrm;
  end;
  perform pg_temp.want(v_err is null,
    format('a missing field no longer raises (got: %s)', coalesce(v_err, 'no error')));
  perform pg_temp.want(not (r->>'ok')::boolean, 'an incomplete offer does not pass');
  perform pg_temp.want(r->'missing' @> '["recipient_legal_name"]'::jsonb, 'the missing recipient name is reported');
  perform pg_temp.want(r->'missing' @> '["recipient_address"]'::jsonb, 'the missing recipient address is reported');
end $$;

-- ---------------------------------------------------------------------------
-- 3. EVERY identifier is individually reachable. The bug fired on whichever
--    branch ran first, so each one has to be proven on its own.
-- ---------------------------------------------------------------------------
do $$
declare m text[];
begin
  -- seller_legal_name
  update public.owner_document_settings set legal_name = '' where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['seller_legal_name'], 'seller_legal_name alone is reported');
  update public.owner_document_settings set legal_name = 'Cogniiq UG' where business_entity_id = current_setting('t.entity')::uuid;

  -- seller_address (street empty is enough; city is the other half of the same check)
  update public.owner_document_settings set street = '' where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['seller_address'], 'seller_address alone is reported (street)');
  update public.owner_document_settings set street = 'Erststr. 1', city = '' where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['seller_address'], 'seller_address alone is reported (city)');
  update public.owner_document_settings set city = 'Berlin' where business_entity_id = current_setting('t.entity')::uuid;

  -- seller_tax_information needs BOTH to be empty
  update public.owner_document_settings set vat_id = '' where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array[]::text[], 'a tax number alone still satisfies seller_tax_information');
  update public.owner_document_settings set tax_number = '' where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['seller_tax_information'], 'seller_tax_information alone is reported');
  update public.owner_document_settings set vat_id = 'DE1', tax_number = 'TAX-1' where business_entity_id = current_setting('t.entity')::uuid;

  -- recipient_legal_name
  update public.owner_offers set recipient_company = '' where id = '11111111-1111-1111-1111-111111111111';
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['recipient_legal_name'], 'recipient_legal_name alone is reported');
  update public.owner_offers set recipient_company = 'Kunde AG' where id = '11111111-1111-1111-1111-111111111111';

  -- recipient_address
  update public.owner_offers set recipient_street = '' where id = '11111111-1111-1111-1111-111111111111';
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['recipient_address'], 'recipient_address alone is reported (street)');
  update public.owner_offers set recipient_street = 'Kundenstr. 1', recipient_city = '' where id = '11111111-1111-1111-1111-111111111111';
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['recipient_address'], 'recipient_address alone is reported (city)');
  update public.owner_offers set recipient_city = 'Hamburg' where id = '11111111-1111-1111-1111-111111111111';

  -- sender_email_configuration. NULL, not '': business_email carries a format
  -- check that an empty string fails, so "not configured" is genuinely NULL.
  update public.owner_document_settings set business_email = null where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array['sender_email_configuration'], 'sender_email_configuration alone is reported');
  update public.owner_document_settings set business_email = 'rechnung@cogniiq.example' where business_entity_id = current_setting('t.entity')::uuid;

  -- ...and the baseline is genuinely restored.
  m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
  perform pg_temp.want(m = array[]::text[], 'the complete baseline passes again after every single-field probe');
end $$;

-- invoice_number_configuration cannot be probed on its own: the column is
-- NOT NULL DEFAULT 'RE' with a ^[A-Z0-9-]{1,8}$ check, so it can never be blank
-- while a settings row exists. Its real trigger is the owner who has not created
-- document settings AT ALL — which fires all five seller-side checks at once, and
-- is the single most likely way a real user meets this function.
do $$
declare m text[]; v_err text; s_row public.owner_document_settings;
begin
  select * into s_row from public.owner_document_settings where business_entity_id = current_setting('t.entity')::uuid;
  delete from public.owner_document_settings where business_entity_id = current_setting('t.entity')::uuid;

  begin
    m := pg_temp.missing_of('11111111-1111-1111-1111-111111111111');
    v_err := null;
  exception when others then v_err := sqlerrm;
  end;
  perform pg_temp.want(v_err is null,
    format('an owner with NO document settings gets a report, not an exception (got: %s)', coalesce(v_err, 'no error')));
  perform pg_temp.want(m = array[
    'seller_legal_name', 'seller_address', 'seller_tax_information',
    'invoice_number_configuration', 'sender_email_configuration'],
    format('all five seller-side checks report, invoice_number_configuration included (got: %s)', array_to_string(m, ', ')));

  insert into public.owner_document_settings select s_row.*;
  perform pg_temp.want(pg_temp.missing_of('11111111-1111-1111-1111-111111111111') = array[]::text[],
    'the settings row is restored and the baseline passes again');
end $$;

-- ---------------------------------------------------------------------------
-- 4. MANY missing fields at once, in the order the checks run.
-- ---------------------------------------------------------------------------
do $$
declare m text[];
begin
  update public.owner_document_settings set legal_name = '', business_email = null
    where business_entity_id = current_setting('t.entity')::uuid;
  m := pg_temp.missing_of('22222222-2222-2222-2222-222222222222');
  perform pg_temp.want(
    m = array['seller_legal_name', 'recipient_legal_name', 'recipient_address', 'sender_email_configuration'],
    format('four missing fields are all reported, in check order (got: %s)', array_to_string(m, ', ')));
  update public.owner_document_settings set legal_name = 'Cogniiq UG', business_email = 'rechnung@cogniiq.example'
    where business_entity_id = current_setting('t.entity')::uuid;
end $$;

-- ---------------------------------------------------------------------------
-- 5. EVERYTHING missing: all seven identifiers, deterministic order.
-- ---------------------------------------------------------------------------
do $$
declare m text[]; r jsonb; s_row public.owner_document_settings;
begin
  -- No document settings at all, plus an offer with no recipient: every one of the
  -- seven checks fires. Before the fix this raised on the very first one.
  select * into s_row from public.owner_document_settings where business_entity_id = current_setting('t.entity')::uuid;
  delete from public.owner_document_settings where business_entity_id = current_setting('t.entity')::uuid;

  r := pg_temp.pre('22222222-2222-2222-2222-222222222222');
  m := array(select jsonb_array_elements_text(r->'missing'));

  perform pg_temp.want(not (r->>'ok')::boolean, 'everything missing does not pass');
  perform pg_temp.want(array_length(m, 1) = 7, format('all seven checks report (got %s)', coalesce(array_length(m,1), 0)));
  perform pg_temp.want(m = array[
    'seller_legal_name', 'seller_address', 'seller_tax_information', 'invoice_number_configuration',
    'recipient_legal_name', 'recipient_address', 'sender_email_configuration'],
    format('all seven identifiers, in the fixed check order (got: %s)', array_to_string(m, ', ')));

  insert into public.owner_document_settings select s_row.*;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Result SHAPE. Callers read r->>'ok' and r->'missing'; nothing else may
--    appear and the types must not drift.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; k text[];
begin
  r := pg_temp.pre('22222222-2222-2222-2222-222222222222');
  select array(select jsonb_object_keys(r) order by 1) into k;
  perform pg_temp.want(k = array['missing', 'ok'], format('exactly the keys {ok, missing} (got: %s)', array_to_string(k, ', ')));
  perform pg_temp.want(jsonb_typeof(r->'ok') = 'boolean', 'ok is a json boolean');
  perform pg_temp.want(jsonb_typeof(r->'missing') = 'array', 'missing is a json array');

  r := pg_temp.pre('11111111-1111-1111-1111-111111111111');
  select array(select jsonb_object_keys(r) order by 1) into k;
  perform pg_temp.want(k = array['missing', 'ok'], 'the passing result carries the same two keys');
  perform pg_temp.want(jsonb_typeof(r->'missing') = 'array', 'missing is an array even when empty');
end $$;

-- ---------------------------------------------------------------------------
-- 7. Deterministic: the same inputs give byte-identical output every time.
-- ---------------------------------------------------------------------------
do $$
declare a jsonb; b jsonb; c jsonb;
begin
  a := pg_temp.pre('22222222-2222-2222-2222-222222222222');
  b := pg_temp.pre('22222222-2222-2222-2222-222222222222');
  c := pg_temp.pre('22222222-2222-2222-2222-222222222222');
  perform pg_temp.want(a::text = b::text and b::text = c::text, 'repeated calls are byte-identical');
end $$;

-- Restore the complete settings row for the pipeline tests below.
update public.owner_document_settings
  set legal_name = 'Cogniiq UG', street = 'Erststr. 1', city = 'Berlin', vat_id = 'DE1',
      tax_number = 'TAX-1', invoice_number_prefix = 'RE', business_email = 'rechnung@cogniiq.example'
  where business_entity_id = current_setting('t.entity')::uuid;

do $$ begin
  perform pg_temp.want(pg_temp.missing_of('11111111-1111-1111-1111-111111111111') = array[]::text[],
    'the complete baseline is restored before the pipeline tests');
end $$;

-- ---------------------------------------------------------------------------
-- 8. The real caller. owner_process_offer_acceptance() calls the preflight
--    unguarded and has no exception handler, so before the fix the malformed
--    array literal aborted the WHOLE acceptance transaction — invoice draft,
--    signed certificate, confirmation e-mail and notification with it.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; v_err text; v_pre jsonb;
begin
  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents,
    vat_rate_bp, vat_treatment, is_optional, sort_order, pricing_type)
  values ('22222222-2222-2222-2222-222222222222', 'Einmalige Einrichtung', 1000, 200000, 1900, 'standard', false, 0, 'one_time');
  update public.owner_offers set status = 'accepted', accepted_at = now()
    where id = '22222222-2222-2222-2222-222222222222';

  begin
    r := public.owner_process_offer_acceptance('22222222-2222-2222-2222-222222222222', null);
    v_err := null;
  exception when others then v_err := sqlerrm;
  end;

  perform pg_temp.want(v_err is null,
    format('accepting an offer with an incomplete recipient no longer raises (got: %s)', coalesce(v_err, 'no error')));
  perform pg_temp.want((r->>'processed')::boolean, 'the acceptance pipeline completes instead of aborting');

  v_pre := r->'preflight';
  perform pg_temp.want(not (v_pre->>'ok')::boolean, 'and it reports the preflight as failed');
  perform pg_temp.want(v_pre->'missing' @> '["recipient_legal_name"]'::jsonb,
    'with the actual missing field, which is what the owner needs to act on');

  -- The invoice draft the pipeline owes is still created (invoice creation does not
  -- depend on the preflight; only issue/send are gated on it).
  perform pg_temp.want((r->>'invoice_created')::boolean, 'the invoice draft is still created');
end $$;

-- The preflight-gated automation branches behave exactly as documented: a FAILED
-- preflight queues no issue/send job and raises the owner notification instead.
do $$
declare v_jobs int; v_notes int;
begin
  select count(*) into v_jobs from public.owner_automation_jobs
    where offer_id = '22222222-2222-2222-2222-222222222222' and job_type in ('invoice_issue', 'invoice_send');
  perform pg_temp.want(v_jobs = 0, 'a failed preflight queues no invoice issue/send job');

  select count(*) into v_notes from public.owner_finance_notifications
    where category = 'automation_attention' and resource_id = '22222222-2222-2222-2222-222222222222';
  perform pg_temp.want(v_notes = 1, 'and raises the "Automatisierung benötigt Aufmerksamkeit" notification');
end $$;

-- ---------------------------------------------------------------------------
-- 9. A COMPLETE offer still passes the gate through the same pipeline, so the
--    fix did not turn the gate into a rubber stamp.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb;
begin
  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents,
    vat_rate_bp, vat_treatment, is_optional, sort_order, pricing_type)
  values ('11111111-1111-1111-1111-111111111111', 'Einmalige Einrichtung', 1000, 200000, 1900, 'standard', false, 0, 'one_time');
  update public.owner_offers set status = 'accepted', accepted_at = now()
    where id = '11111111-1111-1111-1111-111111111111';

  r := public.owner_process_offer_acceptance('11111111-1111-1111-1111-111111111111', null);
  perform pg_temp.want((r->>'processed')::boolean, 'a complete offer still processes');
  perform pg_temp.want((r->'preflight'->>'ok')::boolean, 'and still passes the preflight gate');
  perform pg_temp.want(r->'preflight'->'missing' = '[]'::jsonb, 'with nothing reported missing');
end $$;

\echo 'ok: owner_invoice_preflight missing-field reporting'
