-- Premium-offer SQL smoke test. Runs against a temporary local database that has the
-- bootstrap + the four owner-offer migrations applied. Exercises the draft-edit lifecycle,
-- optimistic concurrency, atomic rollback, idempotency, owner-only access, revision cloning
-- and the complete finalization snapshot. Any failed assertion RAISEs and aborts (psql
-- ON_ERROR_STOP=1 → non-zero exit).

\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Fresh fixtures.
truncate table public.owner_offers cascade;
delete from public.owner_offer_counters;
delete from public.owner_document_settings;
delete from public.owner_finance_requests;
delete from public.owner_business_entities cascade;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name) values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, country_code, business_email, offer_number_prefix)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE','info@cogniiq.de','AN');

-- Act as the owner for the whole script.
select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

do $$
declare
  v_entity uuid := '22222222-2222-2222-2222-222222222222';
  r jsonb; v_offer uuid; v_updated timestamptz; v_updated2 timestamptz;
  v_net bigint; v_gross bigint; v_cnt int; v_id_after uuid; v_status text; v_threw boolean;
  v_rev uuid; v_snap jsonb;
begin
  -- ---- create draft with structured content + rich lines + recipient ----
  r := public.create_owner_offer(
    gen_random_uuid(),
    jsonb_build_object('business_entity_id', v_entity, 'title','Digitalisierung','subtitle','Angebot',
      'issue_date','2026-07-01','valid_until','2026-07-31','introduction','Guten Tag',
      'executive_summary','Kurzfassung','recipient_source','manual','recipient_company','Pankofer GmbH',
      'recipient_contact_name','Herr Muster','recipient_street','Weg 2','recipient_postal_code','84359','recipient_city','Simbach',
      'recipient_email','kontakt@pankofer.test'),
    jsonb_build_array(
      jsonb_build_object('description','Modul 1','details','Details 1','deliverables', jsonb_build_array('A','B'),
        'quantity_milli',1000,'unit','Pauschal','unit_price_cents',4000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0),
      jsonb_build_object('description','Modul 2','quantity_milli',1000,'unit','Pauschal','unit_price_cents',4000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',1),
      jsonb_build_object('description','Optional','is_optional',true,'unit_price_cents',1000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',2)),
    jsonb_build_object('desired_outcomes', jsonb_build_array('Weniger Aufwand','Mehr Transparenz'),
      'timeline', jsonb_build_array(jsonb_build_object('phase','Phase 1','title','Analyse','duration','3 Wochen')),
      'payment_schedule', jsonb_build_array(
        jsonb_build_object('label','Bei Auftrag','percentage_bp',3000),
        jsonb_build_object('label','Kernmodule','percentage_bp',4000),
        jsonb_build_object('label','Abnahme','percentage_bp',3000))));
  v_offer := (r->>'offer_id')::uuid;
  if v_offer is null then raise exception 'TEST create: no offer id'; end if;

  select net_total_cents, gross_total_cents, status, desired_outcomes into v_net, v_gross, v_status, v_snap from public.owner_offers where id = v_offer;
  if v_net <> 8000000 then raise exception 'TEST create: net expected 8000000 got %', v_net; end if;   -- optional excluded
  if v_gross <> 9520000 then raise exception 'TEST create: gross expected 9520000 got %', v_gross; end if;
  if v_status <> 'draft' then raise exception 'TEST create: status not draft'; end if;
  if jsonb_array_length(v_snap) <> 2 then raise exception 'TEST create: desired_outcomes not stored'; end if;
  raise notice 'PASS create draft with structured content (net=% gross=%)', v_net, v_gross;

  -- ---- edit: add line, edit line, remove line, reorder, edit sections ----
  select updated_at into v_updated from public.owner_offers where id = v_offer;
  r := public.update_owner_offer_draft(gen_random_uuid(), v_offer, v_updated,
    jsonb_build_object('title','Digitalisierung v2','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_company','Pankofer GmbH','recipient_street','Weg 2','recipient_city','Simbach'),
    jsonb_build_array(
      jsonb_build_object('description','Modul B','unit_price_cents',5000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0),
      jsonb_build_object('description','Modul A','unit_price_cents',3000000,'vat_rate_bp',700,'vat_treatment','reduced','sort_order',1)),
    jsonb_build_object('desired_outcomes', jsonb_build_array('Nur ein Ziel')));
  v_id_after := (r->>'offer_id')::uuid;
  if v_id_after <> v_offer then raise exception 'TEST edit: offer id changed!'; end if;

  select count(*) into v_cnt from public.owner_offer_lines where offer_id = v_offer;
  if v_cnt <> 2 then raise exception 'TEST edit: expected 2 lines got %', v_cnt; end if;
  select net_total_cents into v_net from public.owner_offers where id = v_offer;
  if v_net <> 8000000 then raise exception 'TEST edit: net recalc expected 8000000 got %', v_net; end if;  -- 5m + 3m
  if (select title from public.owner_offers where id = v_offer) <> 'Digitalisierung v2' then raise exception 'TEST edit: title not updated'; end if;
  if (select jsonb_array_length(desired_outcomes) from public.owner_offers where id = v_offer) <> 1 then raise exception 'TEST edit: sections not synced'; end if;
  if (select status from public.owner_offers where id = v_offer) <> 'draft' then raise exception 'TEST edit: status left draft'; end if;
  if (select offer_number from public.owner_offers where id = v_offer) is not null then raise exception 'TEST edit: number assigned on edit!'; end if;
  raise notice 'PASS draft edit keeps id/draft/no-number and recalculates totals';

  -- ---- stale expected_updated_at rejected ----
  -- (Within one transaction now() is constant, so pass a deliberately-wrong timestamp.)
  v_threw := false;
  begin
    perform public.update_owner_offer_draft(gen_random_uuid(), v_offer, v_updated - interval '1 second', -- stale timestamp
      jsonb_build_object('title','x'), jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',100,'vat_treatment','standard')), '{}'::jsonb);
  exception when others then v_threw := (sqlerrm like '%stale%'); end;
  if not v_threw then raise exception 'TEST stale: concurrent edit not rejected'; end if;
  raise notice 'PASS stale expected_updated_at rejected';

  -- ---- atomic rollback on invalid line (null unit_price violates NOT NULL) ----
  select updated_at into v_updated2 from public.owner_offers where id = v_offer;
  select count(*) into v_cnt from public.owner_offer_lines where offer_id = v_offer;
  v_threw := false;
  begin
    perform public.update_owner_offer_draft(gen_random_uuid(), v_offer, v_updated2,
      jsonb_build_object('title','should rollback'),
      jsonb_build_array(
        jsonb_build_object('description','Gut','unit_price_cents',1000,'vat_treatment','standard'),
        jsonb_build_object('description','Kaputt','vat_treatment','standard')),  -- missing unit_price_cents -> NOT NULL
      '{}'::jsonb);
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST rollback: invalid line not rejected'; end if;
  if (select title from public.owner_offers where id = v_offer) = 'should rollback' then raise exception 'TEST rollback: header change leaked'; end if;
  if (select count(*) from public.owner_offer_lines where offer_id = v_offer) <> v_cnt then raise exception 'TEST rollback: line count changed'; end if;
  raise notice 'PASS atomic rollback on invalid line (no partial write)';

  -- ---- idempotent repeated request ----
  declare k uuid := gen_random_uuid(); r2 jsonb;
  begin
    select updated_at into v_updated2 from public.owner_offers where id = v_offer;
    r := public.update_owner_offer_draft(k, v_offer, v_updated2,
      jsonb_build_object('title','Idem'), jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',100,'vat_treatment','standard')), '{}'::jsonb);
    r2 := public.update_owner_offer_draft(k, v_offer, v_updated2,  -- same key replays stored result, even though timestamp now stale
      jsonb_build_object('title','SHOULD NOT APPLY'), jsonb_build_array(jsonb_build_object('description','X','unit_price_cents',999,'vat_treatment','standard')), '{}'::jsonb);
    if r2->>'offer_id' <> r->>'offer_id' then raise exception 'TEST idem: replay differs'; end if;
    if (select title from public.owner_offers where id = v_offer) <> 'Idem' then raise exception 'TEST idem: replay re-applied changes'; end if;
  end;
  raise notice 'PASS idempotent repeated update replays stored result';

  -- ---- revision copies structured fields (finalize first) ----
  -- Make it finalizable: single non-optional line, valid dates already set.
  select updated_at into v_updated2 from public.owner_offers where id = v_offer;
  perform public.update_owner_offer_draft(gen_random_uuid(), v_offer, v_updated2,
    jsonb_build_object('title','Final Offer','subtitle','Sub','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_company','Pankofer GmbH','recipient_street','Weg 2','recipient_city','Simbach','recipient_email','k@p.test'),
    jsonb_build_array(jsonb_build_object('description','Hauptmodul','details','lang','deliverables',jsonb_build_array('X','Y'),
      'unit_price_cents',8000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    jsonb_build_object('desired_outcomes', jsonb_build_array('Ziel A','Ziel B'),
      'payment_schedule', jsonb_build_array(
        jsonb_build_object('label','A','percentage_bp',3000), jsonb_build_object('label','B','percentage_bp',4000), jsonb_build_object('label','C','percentage_bp',3000))));
  r := public.finalize_owner_offer(gen_random_uuid(), v_offer);
  if (r->>'offer_number') is null then raise exception 'TEST finalize: no number'; end if;
  if (select status from public.owner_offers where id = v_offer) <> 'finalized' then raise exception 'TEST finalize: not finalized'; end if;
  raise notice 'PASS finalize assigns number % and freezes', r->>'offer_number';

  -- non-draft update rejected
  v_threw := false;
  begin
    perform public.update_owner_offer_draft(gen_random_uuid(), v_offer, now(),
      jsonb_build_object('title','x'), jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',1,'vat_treatment','standard')), '{}'::jsonb);
  exception when others then v_threw := (sqlerrm like '%only draft%'); end;
  if not v_threw then raise exception 'TEST non-draft update: not rejected'; end if;
  raise notice 'PASS non-draft update rejected';

  -- final snapshot includes parties + template data + structured content
  select snapshot into v_snap from public.owner_offer_versions where offer_id = v_offer and version = 1;
  if v_snap->'seller'->>'legal_name' <> 'Cogniiq UG' then raise exception 'TEST snapshot: seller missing'; end if;
  if v_snap->'recipient'->>'company' <> 'Pankofer GmbH' then raise exception 'TEST snapshot: recipient missing'; end if;
  if v_snap->>'template_key' <> 'cogniiq-premium-offer-v2' then raise exception 'TEST snapshot: template_key missing'; end if;
  if v_snap->>'template_version' is null then raise exception 'TEST snapshot: template_version missing'; end if;
  if jsonb_array_length(v_snap->'offer'->'desired_outcomes') <> 2 then raise exception 'TEST snapshot: structured content missing'; end if;
  if v_snap->'document_settings'->>'document_language' is null then raise exception 'TEST snapshot: settings missing'; end if;
  raise notice 'PASS final snapshot includes parties, template and structured content';

  -- final snapshot unchanged after CRM/settings changes
  declare v_hash_before text; v_hash_now text;
  begin
    select source_hash into v_hash_before from public.owner_offer_versions where offer_id = v_offer and version = 1;
    update public.owner_document_settings set legal_name = 'Renamed AG', street = 'Neue Str. 9', city = 'München' where business_entity_id = v_entity;
    select source_hash into v_hash_now from public.owner_offer_versions where offer_id = v_offer and version = 1;
    if v_hash_before <> v_hash_now then raise exception 'TEST immutability: snapshot hash changed'; end if;
    if (select snapshot->'seller'->>'legal_name' from public.owner_offer_versions where offer_id = v_offer and version=1) <> 'Cogniiq UG'
      then raise exception 'TEST immutability: snapshot seller changed with settings'; end if;
  end;
  raise notice 'PASS finalized snapshot unchanged after CRM/settings change';

  -- revision clones structured fields into a new editable draft
  r := public.create_owner_offer_revision(gen_random_uuid(), v_offer);
  v_rev := (r->>'offer_id')::uuid;
  if v_rev = v_offer then raise exception 'TEST revision: same id'; end if;
  if (select status from public.owner_offers where id = v_rev) <> 'draft' then raise exception 'TEST revision: not draft'; end if;
  if (select jsonb_array_length(desired_outcomes) from public.owner_offers where id = v_rev) <> 2 then raise exception 'TEST revision: structured not copied'; end if;
  if (select deliverables from public.owner_offer_lines where offer_id = v_rev limit 1) is null then raise exception 'TEST revision: line deliverables not copied'; end if;
  raise notice 'PASS revision clones structured fields into new draft';

  -- delete draft rules: finalized cannot be deleted; fresh draft can
  v_threw := false;
  begin perform public.delete_owner_offer_draft(gen_random_uuid(), v_offer); exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST delete: finalized offer was deletable'; end if;
  r := public.delete_owner_offer_draft(gen_random_uuid(), v_rev);
  if (select count(*) from public.owner_offers where id = v_rev) <> 0 then raise exception 'TEST delete: draft not removed'; end if;
  raise notice 'PASS delete rules (finalized blocked, pristine draft removed)';
end $$;

-- ---- owner-only access: admin denied, customer(anon) denied ----
select set_config('app.role','admin',false);
do $$ declare v_threw boolean := false; begin
  begin perform public.create_owner_offer(gen_random_uuid(), jsonb_build_object('business_entity_id','22222222-2222-2222-2222-222222222222'),
    jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',1,'vat_treatment','standard')), '{}'::jsonb);
  exception when others then v_threw := (sqlerrm like '%Owner access required%'); end;
  if not v_threw then raise exception 'TEST access: admin was allowed'; end if;
  raise notice 'PASS admin denied';
end $$;

select set_config('app.role','anon',false);
do $$ declare v_threw boolean := false; begin
  begin perform public.update_owner_offer_draft(gen_random_uuid(), gen_random_uuid(), now(),
    '{}'::jsonb, jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',1,'vat_treatment','standard')), '{}'::jsonb);
  exception when others then v_threw := (sqlerrm like '%Owner access required%'); end;
  if not v_threw then raise exception 'TEST access: customer/anon was allowed'; end if;
  raise notice 'PASS customer/anon denied';
end $$;

select 'premium-offer SQL tests: ALL PASSED' as result;
