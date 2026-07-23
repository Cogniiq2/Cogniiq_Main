-- Signed acceptance CERTIFICATE + CONFIRMATION workflow SQL tests. Runs against a temporary
-- local database with the bootstrap + all owner-offer migrations (through 20260723127000)
-- applied. Exercises: settings defaults, certificate/confirmation job enqueue on acceptance,
-- idempotency, the service-role certificate context (binds offer/event/hashes/signature path),
-- the idempotent certificate register (signed offer document), the owner retry/enqueue RPC,
-- and the 'completed' terminal job state. ON_ERROR_STOP=1 → any failed assertion aborts.

\set ON_ERROR_STOP on
set client_min_messages = warning;

-- Invoice counter lives in the (unapplied-in-this-harness) finance-cockpit migration.
create table if not exists public.owner_invoice_counters (
  business_entity_id uuid primary key references public.owner_business_entities(id) on delete cascade,
  next_number bigint not null default 1,
  updated_at timestamptz not null default now());

-- Cleanup bypasses row triggers (finalized documents are evidence and cannot be deleted by any
-- role in normal operation) so the throwaway test DB can be reset between runs.
set session_replication_role = replica;
truncate table public.owner_offers cascade;
delete from public.owner_automation_jobs;
delete from public.owner_offer_counters;
delete from public.owner_generated_documents;
delete from public.owner_document_settings;
delete from public.owner_invoices cascade;
delete from public.owner_business_entities cascade;
set session_replication_role = origin;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name) values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, country_code,
    business_email, vat_id, offer_number_prefix, invoice_number_prefix)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE',
    'info@cogniiq.de','DE123456789','AN','RE');

-- ---- Settings defaults: certificate + confirmation default ON; invoice issue/send default OFF. ----
do $$
declare s record;
begin
  select * into s from public.owner_document_settings where business_entity_id='22222222-2222-2222-2222-222222222222';
  assert s.auto_generate_signed_certificate_on_acceptance = true, 'certificate default should be true';
  assert s.auto_send_signed_confirmation_on_acceptance = true, 'confirmation default should be true';
  assert s.auto_issue_invoice_on_acceptance = false, 'invoice issue default should be false';
  assert s.auto_send_invoice_on_acceptance = false, 'invoice send default should be false';
end $$;

select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

-- Build a finalized offer, then record a SIGNED acceptance (service role) which drives the pipeline.
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid; v_raw text; v_evt uuid;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Signatur-Workflow','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Pankofer GmbH','recipient_contact_name','Herr Pensel',
      'recipient_street','Weg 2','recipient_postal_code','84359','recipient_city','Simbach','recipient_email','kunde@pankofer.test',
      'recipient_salutation','herr','recipient_last_name','Pensel','recipient_greeting_name','Herr Pensel'),
    jsonb_build_array(jsonb_build_object('description','Modul 1','unit_price_cents',8000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  r := public.create_offer_access_token(v_offer, null, 30, 20); v_raw := r->>'token';
  perform set_config('app.role','service',false);
  r := public.record_offer_acceptance(v_raw,'Thomas Pensel','Pankofer GmbH','kunde@pankofer.test','Geschäftsführer',
    null,'annahme-v1','22222222-2222-2222-2222-222222222222/'||v_offer||'/sig.png', repeat('a',64), 120000, 'Safari', 'iphash');
  v_evt := (r->>'acceptance_event_id')::uuid;
  perform set_config('app.role','owner',false);
end $$;

-- ---- (1) Exactly one certificate job + one confirmation job were enqueued. ----
do $$
declare v_cert int; v_conf int;
begin
  select count(*) into v_cert from public.owner_automation_jobs where job_type='signed_offer_certificate_generate';
  select count(*) into v_conf from public.owner_automation_jobs where job_type='signed_offer_confirmation_email';
  assert v_cert = 1, format('expected 1 certificate job, got %s', v_cert);
  assert v_conf = 1, format('expected 1 confirmation job, got %s', v_conf);
end $$;

-- ---- (2) Repeated acceptance processing does NOT duplicate the jobs. ----
do $$
declare v_offer uuid; v_cert int; v_conf int;
begin
  select id into v_offer from public.owner_offers limit 1;
  perform public.owner_process_offer_acceptance(v_offer, null);
  perform public.owner_process_offer_acceptance(v_offer, null);
  select count(*) into v_cert from public.owner_automation_jobs where job_type='signed_offer_certificate_generate';
  select count(*) into v_conf from public.owner_automation_jobs where job_type='signed_offer_confirmation_email';
  assert v_cert = 1, format('certificate job duplicated: %s', v_cert);
  assert v_conf = 1, format('confirmation job duplicated: %s', v_conf);
end $$;

-- ---- (3) Certificate context binds the correct offer/event/hashes/signature (service role). ----
do $$
declare v_offer uuid; v_evt uuid; ctx jsonb;
begin
  select id into v_offer from public.owner_offers limit 1;
  select id into v_evt from public.owner_offer_acceptance_events where offer_id=v_offer and decision='accepted' limit 1;
  perform set_config('app.role','service',false);
  ctx := public.owner_worker_certificate_context(v_offer, v_evt);
  assert (ctx->>'offer_id')::uuid = v_offer, 'ctx offer_id mismatch';
  assert (ctx->>'acceptance_event_id')::uuid = v_evt, 'ctx acceptance_event_id mismatch';
  assert ctx->'signature'->>'sha256' = repeat('a',64), 'ctx signature sha256 mismatch';
  assert ctx->'signature'->>'storage_path' like '%/sig.png', 'ctx must expose storage path to worker';
  assert ctx->'offer'->>'source_hash' is not null, 'ctx must carry the offer source hash';
  assert ctx->'signer'->>'name' = 'Thomas Pensel', 'ctx signer name mismatch';
  assert ctx->'seller'->>'legal_name' = 'Cogniiq UG', 'ctx seller mismatch';
  perform set_config('app.role','owner',false);
end $$;

-- ---- (3b) Certificate context is service-role only (owner call is rejected). ----
do $$
declare v_offer uuid; ok boolean := false;
begin
  select id into v_offer from public.owner_offers limit 1;
  begin
    perform public.owner_worker_certificate_context(v_offer, null);  -- app.role='owner'
  exception when others then ok := true;
  end;
  assert ok, 'certificate context must reject non-service-role callers';
end $$;

-- ---- (4) register_certificate creates a SIGNED offer document + is idempotent; it makes the
--          signed_document_available style query true and does NOT collide with the offer PDF. ----
do $$
declare v_offer uuid; v_evt uuid; r1 jsonb; r2 jsonb; v_signed int;
begin
  select id into v_offer from public.owner_offers limit 1;
  select id into v_evt from public.owner_offer_acceptance_events where offer_id=v_offer and decision='accepted' limit 1;
  perform set_config('app.role','service',false);
  r1 := public.owner_worker_register_certificate('22222222-2222-2222-2222-222222222222', v_offer, v_evt,
    'AN-2026-0001','EUR', repeat('b',64), repeat('a',64), '22222222-2222-2222-2222-222222222222/certificates/'||v_offer||'/cert.pdf');
  r2 := public.owner_worker_register_certificate('22222222-2222-2222-2222-222222222222', v_offer, v_evt,
    'AN-2026-0001','EUR', repeat('b',64), repeat('a',64), '22222222-2222-2222-2222-222222222222/certificates/'||v_offer||'/cert.pdf');
  assert (r1->>'idempotent')::boolean = false, 'first register should create';
  assert (r2->>'idempotent')::boolean = true, 'second register must be idempotent';
  assert (r1->>'document_id') = (r2->>'document_id'), 'idempotent register must return the same document';
  select count(*) into v_signed from public.owner_generated_documents
    where source_resource_type='owner_offers' and source_resource_id=v_offer
      and document_type='offer' and render_metadata->>'signed'='true';
  assert v_signed = 1, format('expected exactly one signed offer document, got %s', v_signed);
  perform set_config('app.role','owner',false);
end $$;

-- ---- (4b) The acceptance summary now surfaces the certificate (owner). ----
do $$
declare v_offer uuid; sum jsonb;
begin
  select id into v_offer from public.owner_offers limit 1;
  sum := public.owner_offer_acceptance_summary(v_offer);
  assert sum->'certificate' is not null and sum->'certificate' <> 'null'::jsonb, 'summary must include the certificate';
  assert sum->'certificate'->>'storage_path' like '%/cert.pdf', 'summary certificate path mismatch';
  assert jsonb_array_length(sum->'automation_jobs') >= 2, 'summary must list the automation jobs';
end $$;

-- ---- (5) Owner retry RPC re-arms an existing job and enqueues a missing one. ----
do $$
declare v_offer uuid; v_id uuid; v_status text; v_before int; v_after int;
begin
  select id into v_offer from public.owner_offers limit 1;
  -- Exhaust the certificate job, then retry it -> back to 'retrying', attempts reset.
  update public.owner_automation_jobs set status='failed', attempt_count=max_attempts
    where offer_id=v_offer and job_type='signed_offer_certificate_generate';
  perform public.owner_retry_automation_job(v_offer, 'signed_offer_certificate_generate');
  select status, attempt_count into v_status, v_before from public.owner_automation_jobs
    where offer_id=v_offer and job_type='signed_offer_certificate_generate';
  assert v_status = 'retrying', format('retry should re-arm to retrying, got %s', v_status);
  assert v_before = 0, 'retry should reset the attempt budget';

  -- A job type that was never queued gets created by the retry RPC.
  select count(*) into v_before from public.owner_automation_jobs where offer_id=v_offer and job_type='invoice_pdf_generate';
  perform public.owner_retry_automation_job(v_offer, 'invoice_pdf_generate');
  select count(*) into v_after from public.owner_automation_jobs where offer_id=v_offer and job_type='invoice_pdf_generate';
  assert v_before = 0 and v_after = 1, 'retry must enqueue a missing job';
end $$;

-- ---- (5b) The retry RPC is owner-only (service role is rejected). ----
do $$
declare v_offer uuid; ok boolean := false;
begin
  select id into v_offer from public.owner_offers limit 1;
  perform set_config('app.role','service',false);
  begin
    perform public.owner_retry_automation_job(v_offer, 'signed_offer_certificate_generate');
  exception when others then ok := true;
  end;
  perform set_config('app.role','owner',false);
  assert ok, 'retry RPC must reject non-owner callers';
end $$;

-- ---- (6) Job completion supports the 'completed' terminal state and is idempotent. ----
do $$
declare v_offer uuid; v_id uuid; r jsonb;
begin
  select id into v_offer from public.owner_offers limit 1;
  select id into v_id from public.owner_automation_jobs where offer_id=v_offer and job_type='signed_offer_certificate_generate';
  perform set_config('app.role','service',false);
  update public.owner_automation_jobs set status='processing' where id=v_id;
  r := public.owner_complete_automation_job(v_id, 'completed', null, null, 60, null);
  assert r->>'status' = 'completed', 'certificate job should complete';
  -- Idempotent: completing again does not revive it.
  r := public.owner_complete_automation_job(v_id, 'sent', null, null, 60, null);
  assert (r->>'idempotent')::boolean = true, 'completed job must be terminal/idempotent';
  perform set_config('app.role','owner',false);
end $$;

-- ---- (7) A signed acceptance WITHOUT a captured signature does NOT enqueue a certificate. ----
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid; v_raw text; v_cnt int;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Ohne Unterschrift','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Test GmbH','recipient_street','Weg 3','recipient_postal_code','80331',
      'recipient_city','München','recipient_email','k2@test.test'),
    jsonb_build_array(jsonb_build_object('description','Pos','unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  r := public.create_offer_access_token(v_offer, null, 30, 20); v_raw := r->>'token';
  -- Plain (non-signature) acceptance via the anon RPC path.
  perform set_config('app.role','anon',false);
  perform public.respond_offer_by_token(v_raw,'accepted','Anna Test','Test GmbH','k2@test.test','annahme-v1',null,'ua');
  perform set_config('app.role','owner',false);
  select count(*) into v_cnt from public.owner_automation_jobs where offer_id=v_offer and job_type='signed_offer_certificate_generate';
  assert v_cnt = 0, 'no certificate should be enqueued without a captured signature';
end $$;

select 'certificate-workflow SQL tests: ALL PASSED' as result;
