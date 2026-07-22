-- Signature-proposal SQL test. Runs against a temporary local database that has the
-- bootstrap + all owner-offer migrations (through 20260723125000) applied. Exercises
-- greeting freezing, snapshot-backed public projection, drawn-signature acceptance
-- evidence, idempotent invoice automation, automation-job dedupe, owner-only access
-- and RLS. Any failed assertion RAISEs and aborts (psql ON_ERROR_STOP=1 → non-zero).

\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Fresh fixtures.
truncate table public.owner_offers cascade;
delete from public.owner_automation_jobs;
delete from public.owner_offer_counters;
delete from public.owner_document_settings;
delete from public.owner_finance_requests;
delete from public.owner_invoices cascade;
delete from public.owner_business_entities cascade;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name) values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
-- Complete seller identity so the invoice preflight passes and auto-issue/send are exercised.
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, country_code,
    business_email, vat_id, offer_number_prefix, invoice_number_prefix,
    auto_create_invoice_on_acceptance, auto_issue_invoice_on_acceptance, auto_send_invoice_on_acceptance)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE',
    'info@cogniiq.de','DE123456789','AN','RE', true, true, true);

select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

do $$
declare
  v_entity uuid := '22222222-2222-2222-2222-222222222222';
  r jsonb; v_offer uuid; v_snap jsonb; v_raw text; v_pub jsonb; v_resp jsonb;
  v_sal text; v_first text; v_last text; v_greet text; v_inv_count int; v_job_count int;
  v_threw boolean; v_inv uuid; v_evt uuid; v_hash text; v_ver int;
begin
  -- ---- create draft with EXPLICIT greeting personalization ----
  r := public.create_owner_offer(
    gen_random_uuid(),
    jsonb_build_object('business_entity_id', v_entity, 'title','Digitale Infrastruktur','subtitle','Persönliches Angebot',
      'issue_date','2026-07-01','valid_until','2026-07-31','introduction','Guten Tag',
      'recipient_source','manual','recipient_company','Pankofer GmbH','recipient_contact_name','Herr Pensel',
      'recipient_street','Weg 2','recipient_postal_code','84359','recipient_city','Simbach','recipient_email','kontakt@pankofer.test',
      'recipient_salutation','herr','recipient_title','','recipient_first_name','Thomas','recipient_last_name','Pensel',
      'recipient_greeting_name','Herr Pensel'),
    jsonb_build_array(
      jsonb_build_object('description','Modul 1','unit_price_cents',4000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0),
      jsonb_build_object('description','Modul 2','unit_price_cents',4000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',1),
      jsonb_build_object('description','Optional','is_optional',true,'unit_price_cents',1000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',2)),
    jsonb_build_object('desired_outcomes', jsonb_build_array('Weniger Aufwand')));
  v_offer := (r->>'offer_id')::uuid;

  -- (1) greeting fields are saved on the draft.
  select recipient_salutation, recipient_first_name, recipient_last_name, recipient_greeting_name
    into v_sal, v_first, v_last, v_greet from public.owner_offers where id = v_offer;
  if v_sal <> 'herr' or v_last <> 'Pensel' or v_greet <> 'Herr Pensel' then
    raise exception 'TEST greeting-save: got sal=% last=% greet=%', v_sal, v_last, v_greet; end if;
  raise notice 'PASS greeting fields are saved';

  -- ---- finalize (freezes the snapshot) ----
  r := public.finalize_owner_offer(gen_random_uuid(), v_offer);
  v_hash := r->>'source_hash'; v_ver := (r->>'version')::int;
  select snapshot into v_snap from public.owner_offer_versions where offer_id = v_offer order by version desc limit 1;

  -- (2) greeting fields are frozen into the finalized snapshot.
  if v_snap->'offer'->>'recipient_salutation' <> 'herr' or v_snap->'offer'->>'recipient_greeting_name' <> 'Herr Pensel' then
    raise exception 'TEST greeting-freeze: snapshot missing greeting'; end if;
  raise notice 'PASS greeting fields are frozen in the finalized snapshot';

  -- (3) later CRM edits must NOT change the frozen greeting: the guard blocks any change
  --     to a finalized offer's greeting, and the immutable snapshot is unaffected regardless.
  v_threw := false;
  begin update public.owner_offers set recipient_greeting_name='Frau Andere', recipient_salutation='frau' where id = v_offer;
  exception when others then v_threw := (sqlerrm like '%immutable%'); end;
  if not v_threw then raise exception 'TEST crm-immut: finalized greeting was mutable'; end if;
  if v_snap->'offer'->>'recipient_greeting_name' <> 'Herr Pensel' then raise exception 'TEST crm-immut: snapshot changed'; end if;
  raise notice 'PASS CRM changes cannot alter the frozen greeting';

  -- ---- token + public projection (served from the snapshot) ----
  r := public.create_offer_access_token(v_offer, null, 30, 20);
  v_raw := r->>'token';
  v_pub := public.public_offer_by_token(v_raw, 'test-agent');

  -- (4) public projection carries the frozen greeting fields, (5)(6)(7) never leaks internals.
  if v_pub->'recipient'->>'greeting_name' <> 'Herr Pensel' then raise exception 'TEST public-greeting: missing'; end if;
  if v_pub->'recipient'->>'salutation' <> 'herr' then raise exception 'TEST public-greeting: salutation missing'; end if;
  if v_pub ? 'internal_notes' or v_pub ? 'pdf_storage_path' or v_pub ? 'snapshot' or v_pub ? 'source_hash' or v_pub ? 'token_hash' then
    raise exception 'TEST public-leak: internal field exposed'; end if;
  -- even after the CRM was edited above, the projection shows the FINALIZED title (snapshot):
  if v_pub->>'title' <> 'Digitale Infrastruktur' then raise exception 'TEST public-snapshot: title not from snapshot (got %)', v_pub->>'title'; end if;
  raise notice 'PASS public projection uses the snapshot and leaks no internals';

  -- ---- drawn-signature acceptance via the service-role Edge-Function RPC ----
  -- (10) oversized signature rejected.
  perform set_config('app.role','service',false);
  v_threw := false;
  begin perform public.record_offer_acceptance(v_raw,'Thomas Pensel','Pankofer GmbH','k@p.test','Geschäftsführer',
    null,'annahme-v1','sig/x.png', repeat('a',64), 500000, 'ua', 'iphash');
  exception when others then v_threw := (sqlerrm like '%out of bounds%'); end;
  if not v_threw then raise exception 'TEST oversized: accepted'; end if;
  -- (11) invalid signature hash rejected.
  v_threw := false;
  begin perform public.record_offer_acceptance(v_raw,'Thomas Pensel','Pankofer GmbH','k@p.test','Geschäftsführer',
    null,'annahme-v1','sig/x.png', 'not-a-hash', 120000, 'ua', 'iphash');
  exception when others then v_threw := (sqlerrm like '%invalid signature hash%'); end;
  if not v_threw then raise exception 'TEST bad-hash: accepted'; end if;
  raise notice 'PASS oversized / invalid-hash signatures are rejected';

  -- (8)(13) valid signature acceptance succeeds and binds evidence to version + source hash.
  v_resp := public.record_offer_acceptance(v_raw,'Thomas Pensel','Pankofer GmbH','k@p.test','Geschäftsführer',
    'Passt','annahme-v1','signatures/22222222/'||v_offer||'.png', repeat('a',64), 120000, 'ua', 'iphash');
  if v_resp->>'decision' <> 'accepted' then raise exception 'TEST accept: not accepted'; end if;
  v_evt := (v_resp->>'acceptance_event_id')::uuid;
  select signature_sha256, source_hash, document_version into v_greet, v_hash, v_ver
    from public.owner_offer_acceptance_events where id = v_evt;
  if v_greet <> repeat('a',64) then raise exception 'TEST evidence: hash not stored'; end if;
  if v_hash is null or v_ver is null then raise exception 'TEST evidence: version/source not bound'; end if;
  raise notice 'PASS valid signature acceptance succeeds and binds version + source hash';

  -- (15) accepted offer creates exactly one invoice (auto_create=true).
  select count(*) into v_inv_count from public.owner_invoices where business_entity_id = v_entity;
  if v_inv_count <> 1 then raise exception 'TEST invoice: expected 1 got %', v_inv_count; end if;

  -- (17) automation issue+send jobs queued (preflight passes, both settings enabled).
  select count(*) into v_job_count from public.owner_automation_jobs where offer_id = v_offer;
  if v_job_count <> 2 then raise exception 'TEST jobs: expected 2 (issue+send) got %', v_job_count; end if;

  -- (12)(14) duplicate acceptance is idempotent — no new invoice, no duplicate job.
  perform set_config('app.uid','11111111-1111-1111-1111-111111111111',false);
  v_resp := public.respond_offer_by_token(v_raw,'accepted','Thomas Pensel','Pankofer GmbH','k@p.test','annahme-v1','again','ua');
  if (v_resp->>'already_recorded')::boolean is not true then raise exception 'TEST idem: not idempotent'; end if;
  perform public.owner_process_offer_acceptance(v_offer, null); -- re-run pipeline; must not duplicate
  select count(*) into v_inv_count from public.owner_invoices where business_entity_id = v_entity;
  select count(*) into v_job_count from public.owner_automation_jobs where offer_id = v_offer;
  if v_inv_count <> 1 then raise exception 'TEST idem-invoice: duplicated (%).', v_inv_count; end if;
  if v_job_count <> 2 then raise exception 'TEST idem-jobs: duplicated (%).', v_job_count; end if;
  raise notice 'PASS acceptance is idempotent (one invoice, one issue+send job, no duplicates)';
end $$;

-- (16) a REJECTED offer creates no invoice and no automation job.
select set_config('app.role','owner',false);
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid; v_raw text; v_cnt int;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Ablehnung','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Reject GmbH','recipient_street','W 1','recipient_city','Berlin'),
    jsonb_build_array(jsonb_build_object('description','M','unit_price_cents',1000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  r := public.create_offer_access_token(v_offer, null, 30, 20); v_raw := r->>'token';
  perform public.respond_offer_by_token(v_raw,'rejected','','','','annahme-v1','zu teuer','ua');
  select count(*) into v_cnt from public.owner_offers where id=v_offer and status='rejected';
  if v_cnt <> 1 then raise exception 'TEST reject: status not rejected'; end if;
  select count(*) into v_cnt from public.owner_automation_jobs where offer_id=v_offer;
  if v_cnt <> 0 then raise exception 'TEST reject: automation queued on rejection'; end if;
  select count(*) into v_cnt from public.owner_invoices where external_reference = 'Angebot '||(select offer_number from public.owner_offers where id=v_offer);
  if v_cnt <> 0 then raise exception 'TEST reject: invoice created on rejection'; end if;
  raise notice 'PASS rejected offer creates no invoice and no automation job';
end $$;

-- (20) revoked / expired token cannot accept.
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid; v_raw text; v_tokid uuid; v_threw boolean;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Revoke','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','R GmbH','recipient_street','W 1','recipient_city','Berlin'),
    jsonb_build_array(jsonb_build_object('description','M','unit_price_cents',1000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  r := public.create_offer_access_token(v_offer, null, 30, 20); v_raw := r->>'token';
  update public.owner_document_access_tokens t set revoked_at = now() where t.offer_id = v_offer;
  v_threw := false;
  begin perform public.respond_offer_by_token(v_raw,'accepted','X','','','annahme-v1',null,'ua');
  exception when others then v_threw := (sqlerrm like '%revoked%'); end;
  if not v_threw then raise exception 'TEST revoked-accept: accepted with revoked token'; end if;
  raise notice 'PASS revoked token cannot accept';
end $$;

-- (18)(19) owner-only + private evidence: anon/customer cannot read acceptance/automation, nor invoke owner ops.
select set_config('app.role','anon',false);
do $$ declare v_threw boolean := false; begin
  begin perform public.owner_offer_acceptance_summary('00000000-0000-0000-0000-000000000000');
  exception when others then v_threw := (sqlerrm like '%Owner access required%'); end;
  if not v_threw then raise exception 'TEST owner-only: anon invoked owner summary'; end if;
  raise notice 'PASS anon cannot invoke owner-only acceptance summary';
end $$;

set role anon;
do $$ declare v_ok boolean := false; begin
  begin perform 1 from public.owner_offer_acceptance_events limit 1;
  exception when insufficient_privilege then v_ok := true; end;
  if not v_ok then raise exception 'TEST rls: acceptance events anonymously readable'; end if;
  v_ok := false;
  begin perform 1 from public.owner_automation_jobs limit 1;
  exception when insufficient_privilege then v_ok := true; end;
  if not v_ok then raise exception 'TEST rls: automation jobs anonymously readable'; end if;
  raise notice 'PASS private signature/automation records are not anonymously readable';
end $$;
reset role;

select 'signature-proposal SQL tests: ALL PASSED' as result;
