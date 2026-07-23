-- Automation-worker SQL tests. Runs against a temporary local database that has the
-- bootstrap + all owner-offer migrations (through 20260723126000) applied. Exercises the
-- service-role worker primitives: atomic job claiming, idempotent invoice issue, worker
-- context (no tokens/paths), fresh offer-link minting (hash-only), and job completion with
-- bounded retry. Concurrency (FOR UPDATE SKIP LOCKED) is asserted separately by the runner
-- using two connections. ON_ERROR_STOP=1 → any failed assertion aborts.

\set ON_ERROR_STOP on
set client_min_messages = notice;

-- The invoice counter lives in the (unapplied-in-this-harness) finance-cockpit migration.
create table if not exists public.owner_invoice_counters (
  business_entity_id uuid primary key references public.owner_business_entities(id) on delete cascade,
  next_number bigint not null default 1,
  updated_at timestamptz not null default now());

truncate table public.owner_offers cascade;
delete from public.owner_automation_jobs;
delete from public.owner_offer_counters;
delete from public.owner_document_settings;
delete from public.owner_finance_requests;
delete from public.owner_invoices cascade;
delete from public.owner_business_entities cascade;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name) values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, country_code,
    business_email, vat_id, offer_number_prefix, invoice_number_prefix,
    auto_create_invoice_on_acceptance, auto_issue_invoice_on_acceptance, auto_send_invoice_on_acceptance,
    invoice_email_subject_template, invoice_email_body_template)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE',
    'info@cogniiq.de','DE123456789','AN','RE', true, true, true,
    'Ihre Rechnung {{invoice_number}}', 'Guten Tag {{recipient_name}}, anbei {{invoice_number}} über {{gross_total}}.');

select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

-- Build an accepted offer -> invoice draft + queued issue/send jobs.
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid; v_raw text; v_inv uuid;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Automatik','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Pankofer GmbH','recipient_contact_name','Herr Pensel',
      'recipient_street','Weg 2','recipient_postal_code','84359','recipient_city','Simbach','recipient_email','kunde@pankofer.test',
      'recipient_salutation','herr','recipient_last_name','Pensel','recipient_greeting_name','Herr Pensel'),
    jsonb_build_array(jsonb_build_object('description','Modul 1','unit_price_cents',8000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  r := public.create_offer_access_token(v_offer, null, 30, 20); v_raw := r->>'token';
  perform set_config('app.role','service',false);
  perform public.record_offer_acceptance(v_raw,'Thomas Pensel','Pankofer GmbH','kunde@pankofer.test','GF',
    null,'annahme-v1','signatures/x.png', repeat('a',64), 120000, 'ua', 'iphash');
  select converted_invoice_id into v_inv from public.owner_offers where id = v_offer;
  -- The test harness lacks the finance-cockpit recalc triggers, so set positive totals explicitly.
  update public.owner_invoice_lines set net_cents=8000000, vat_cents=1520000, gross_cents=9520000 where invoice_id=v_inv;
  update public.owner_invoices set net_total_cents=8000000, vat_total_cents=1520000, gross_total_cents=9520000 where id=v_inv;
end $$;

-- ---- (auth) non-service-role cannot invoke worker primitives ----
select set_config('app.role','owner',false);
do $$ declare v_threw boolean := false; begin
  begin perform public.owner_claim_automation_jobs(10, null);
  exception when others then v_threw := (sqlerrm like '%service role required%'); end;
  if not v_threw then raise exception 'TEST auth: owner claimed jobs'; end if;
  v_threw := false;
  begin perform public.owner_issue_invoice_internal('00000000-0000-0000-0000-000000000000');
  exception when others then v_threw := (sqlerrm like '%service role required%'); end;
  if not v_threw then raise exception 'TEST auth: owner issued invoice'; end if;
  raise notice 'PASS worker primitives are service-role only';
end $$;

select set_config('app.role','service',false);

-- ---- (claim) atomic claim moves rows to processing + increments attempt, no reclaim ----
do $$
declare v_n int; v_n2 int; v_status text; v_att int; j jsonb;
begin
  select count(*) into v_n from public.owner_automation_jobs where status='pending';
  if v_n < 2 then raise exception 'TEST setup: expected >=2 queued jobs, got %', v_n; end if;
  select count(*) into v_n from public.owner_claim_automation_jobs(10, null) t(j);
  if v_n < 2 then raise exception 'TEST claim: claimed % (<2)', v_n; end if;
  -- all claimed jobs are now processing with attempt_count 1
  select count(*) into v_att from public.owner_automation_jobs where status='processing' and attempt_count=1;
  if v_att < 2 then raise exception 'TEST claim: processing/attempt not set'; end if;
  -- a second immediate claim returns nothing (already processing, not due)
  select count(*) into v_n2 from public.owner_claim_automation_jobs(10, null) t(j);
  if v_n2 <> 0 then raise exception 'TEST claim: reclaimed processing jobs (%).', v_n2;  end if;
  raise notice 'PASS atomic claim transitions to processing and never reclaims';
end $$;

-- ---- (issue) idempotent internal issue assigns a final number + issued status ----
do $$
declare v_inv uuid; r jsonb; v_num text; v_status text;
begin
  select converted_invoice_id into v_inv from public.owner_offers where converted_invoice_id is not null limit 1;
  r := public.owner_issue_invoice_internal(v_inv);
  if r->>'status' <> 'issued' then raise exception 'TEST issue: not issued'; end if;
  if (r->>'invoice_number') !~ '^RE-2026-[0-9]{4}$' then raise exception 'TEST issue: bad number %', r->>'invoice_number'; end if;
  select invoice_number, status into v_num, v_status from public.owner_invoices where id=v_inv;
  if v_status <> 'issued' or v_num is null then raise exception 'TEST issue: not persisted'; end if;
  -- idempotent: second call returns the same number, no re-numbering
  r := public.owner_issue_invoice_internal(v_inv);
  if (r->>'idempotent')::boolean is not true or r->>'invoice_number' <> v_num then raise exception 'TEST issue: not idempotent'; end if;
  raise notice 'PASS invoice issue is idempotent and server-authoritative';
end $$;

-- ---- (issue failure) a draft missing due_date is NOT issued (raises) ----
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; v_bad uuid; v_threw boolean := false;
begin
  insert into public.owner_invoices (business_entity_id, status, issue_date, service_date, due_date, currency,
    net_total_cents, vat_total_cents, gross_total_cents)
  values (v_entity, 'draft', current_date, current_date, null, 'EUR', 1000000, 190000, 1190000)
  returning id into v_bad;
  insert into public.owner_invoice_lines (invoice_id, description, unit_price_cents, net_cents, vat_cents, gross_cents)
  values (v_bad, 'L', 1000000, 1000000, 190000, 1190000);
  begin perform public.owner_issue_invoice_internal(v_bad);
  exception when others then v_threw := (sqlerrm like '%due_date is required%'); end;
  if not v_threw then raise exception 'TEST issue-fail: issued without due_date'; end if;
  if (select status from public.owner_invoices where id=v_bad) <> 'draft' then raise exception 'TEST issue-fail: status changed'; end if;
  raise notice 'PASS incomplete invoice is not issued (preflight enforced)';
end $$;

-- ---- (context) curated worker context: recipient/invoice/seller, NO tokens/paths ----
do $$
declare v_inv uuid; ctx jsonb;
begin
  select converted_invoice_id into v_inv from public.owner_offers where converted_invoice_id is not null limit 1;
  ctx := public.owner_worker_invoice_context(v_inv);
  if ctx->'recipient'->>'email' <> 'kunde@pankofer.test' then raise exception 'TEST ctx: recipient email wrong'; end if;
  if ctx->'invoice'->>'invoice_number' is null then raise exception 'TEST ctx: no invoice number'; end if;
  if ctx->'seller'->>'legal_name' <> 'Cogniiq UG' then raise exception 'TEST ctx: seller missing'; end if;
  if ctx ? 'token' or ctx ? 'token_hash' or ctx::text like '%storage_path%' or ctx::text like '%signature%' then
    raise exception 'TEST ctx: leaked token/path/signature'; end if;
  raise notice 'PASS worker invoice context is curated (no tokens/paths/signatures)';
end $$;

-- ---- (offer link) fresh secure link: raw token returned once, only hash stored ----
do $$
declare v_offer uuid; r jsonb; v_raw text; v_cnt int;
begin
  select id into v_offer from public.owner_offers limit 1;
  r := public.owner_worker_mint_offer_link(v_offer, 30);
  v_raw := r->>'token';
  if v_raw is null or length(v_raw) < 32 then raise exception 'TEST mint: no raw token'; end if;
  -- the raw token is NOT stored anywhere (only its hash lives in the token table)
  select count(*) into v_cnt from public.owner_document_access_tokens where token_hash = v_raw;
  if v_cnt <> 0 then raise exception 'TEST mint: raw token stored as hash'; end if;
  select count(*) into v_cnt from public.owner_document_access_tokens
    where token_hash = encode(extensions.digest(convert_to(v_raw,'UTF8'),'sha256'::text),'hex');
  if v_cnt <> 1 then raise exception 'TEST mint: hash not stored'; end if;
  -- never persisted in an automation job
  select count(*) into v_cnt from public.owner_automation_jobs where payload::text like '%' || v_raw || '%';
  if v_cnt <> 0 then raise exception 'TEST mint: raw token persisted in a job'; end if;
  raise notice 'PASS offer link mint stores only the hash (raw token never persisted)';
end $$;

-- ---- (complete) sent stores provider id + timestamp; retrying schedules backoff; idempotent ----
do $$
declare v_job uuid; r jsonb; v_sched timestamptz; v_status text;
begin
  select id into v_job from public.owner_automation_jobs where status='processing' limit 1;
  r := public.owner_complete_automation_job(v_job, 'sent', 'resend_abc123', null, 60);
  if r->>'status' <> 'sent' then raise exception 'TEST complete: not sent'; end if;
  select status into v_status from public.owner_automation_jobs where id=v_job;
  if v_status <> 'sent' or (select provider_message_id from public.owner_automation_jobs where id=v_job) <> 'resend_abc123' then
    raise exception 'TEST complete: provider id / status not persisted'; end if;
  if (select sent_at from public.owner_automation_jobs where id=v_job) is null then raise exception 'TEST complete: no sent_at'; end if;
  -- idempotent: completing a sent job again does not revive/overwrite it
  r := public.owner_complete_automation_job(v_job, 'failed', null, 'boom', 60);
  if (r->>'idempotent')::boolean is not true then raise exception 'TEST complete: sent not idempotent'; end if;
  if (select status from public.owner_automation_jobs where id=v_job) <> 'sent' then raise exception 'TEST complete: sent overwritten'; end if;

  -- retrying schedules a future run (backoff)
  select id into v_job from public.owner_automation_jobs where status='processing' limit 1;
  if v_job is not null then
    r := public.owner_complete_automation_job(v_job, 'retrying', null, 'provider 500', 60);
    if r->>'status' <> 'retrying' then raise exception 'TEST retry: not retrying'; end if;
    select scheduled_at into v_sched from public.owner_automation_jobs where id=v_job;
    if v_sched <= now() then raise exception 'TEST retry: not scheduled into the future'; end if;
  end if;
  raise notice 'PASS job completion: sent is terminal/idempotent, retry backs off';
end $$;

-- ---- (attempt cap) retrying at the cap is coerced to failed ----
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; v_job uuid; r jsonb;
begin
  insert into public.owner_automation_jobs (business_entity_id, job_type, status, dedupe_key, attempt_count, max_attempts)
  values (v_entity, 'invoice_email', 'processing', 'capjob:invoice_email', 5, 5) returning id into v_job;
  r := public.owner_complete_automation_job(v_job, 'retrying', null, 'still failing', 60);
  if r->>'status' <> 'failed' then raise exception 'TEST cap: not coerced to failed (%).', r->>'status'; end if;
  raise notice 'PASS retry at the attempt cap becomes failed';
end $$;

select 'automation-worker SQL tests: ALL PASSED' as result;
