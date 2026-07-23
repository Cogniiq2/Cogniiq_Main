-- Owner OFFER-EMAIL send-workflow SQL tests. Runs against a temporary local database with the
-- bootstrap + all owner-offer migrations (through 20260723128000) applied. Exercises: the secure
-- owner enqueue RPC (sendable-state gate, recipient validation/normalization, safe payload, stable
-- + versioned dedupe key, dedupe of an in-flight job, safe re-arm of a failed job, explicit resend
-- as a new versioned attempt), the fact that enqueue MINTS NO TOKEN and NEVER sets the offer to
-- 'sent', and the service-role worker helpers (mark-sent only after a send; token revoke on
-- failure). ON_ERROR_STOP=1 → any failed assertion aborts.

\set ON_ERROR_STOP on
set client_min_messages = warning;

-- Invoice counter lives in the (unapplied-in-this-harness) finance-cockpit migration.
create table if not exists public.owner_invoice_counters (
  business_entity_id uuid primary key references public.owner_business_entities(id) on delete cascade,
  next_number bigint not null default 1,
  updated_at timestamptz not null default now());

set session_replication_role = replica;
truncate table public.owner_offers cascade;
delete from public.owner_automation_jobs;
delete from public.owner_offer_counters;
delete from public.owner_document_access_tokens;
delete from public.owner_generated_documents;
delete from public.owner_document_settings;
delete from public.owner_business_entities cascade;
set session_replication_role = origin;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name) values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, country_code,
    business_email, vat_id, offer_number_prefix, invoice_number_prefix)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE',
    'info@cogniiq.de','DE123456789','AN','RE');

select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

-- Build a finalized offer for the primary tests.
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Angebots-Versand','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Pankofer GmbH','recipient_contact_name','Herr Pensel',
      'recipient_street','Weg 2','recipient_postal_code','84359','recipient_city','Simbach','recipient_email','kunde@pankofer.test',
      'recipient_salutation','herr','recipient_last_name','Pensel','recipient_greeting_name','Herr Pensel'),
    jsonb_build_array(jsonb_build_object('description','Modul 1','unit_price_cents',8000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  perform set_config('test.offer', v_offer::text, false);
end $$;

-- ---- Enqueue: creates ONE pending offer_email job, mints NO token, does NOT set 'sent'. ----
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; res jsonb; j record; v_tokens int; v_status text;
begin
  res := public.owner_enqueue_offer_email(v_offer, 'Kunde@Pankofer.TEST ', 'Mein Betreff', 'Hallo Welt');
  assert res->>'job_id' is not null, 'enqueue returns a job id';
  assert res->>'status' = 'pending', 'a fresh offer_email job is pending';

  select * into j from public.owner_automation_jobs where offer_id = v_offer and job_type = 'offer_email';
  assert j.status = 'pending', 'job persisted as pending';
  assert j.recipient_email = 'kunde@pankofer.test', 'recipient email normalized (lowercased/trimmed)';
  assert j.payload->>'subject' = 'Mein Betreff', 'editable subject stored in payload';
  assert j.payload->>'message' = 'Hallo Welt', 'editable message stored in payload';
  assert j.dedupe_key = v_offer::text || ':offer_email:1', 'stable versioned dedupe key (v1)';

  select count(*) into v_tokens from public.owner_document_access_tokens where offer_id = v_offer;
  assert v_tokens = 0, 'enqueue mints NO access token (token minted only in the worker)';

  select status into v_status from public.owner_offers where id = v_offer;
  assert v_status = 'finalized', 'enqueue does NOT set the offer status to sent';
end $$;

-- ---- Enqueue again while in-flight → dedupes (same job, refreshed payload), never duplicates. ----
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; res jsonb; v_count int;
begin
  res := public.owner_enqueue_offer_email(v_offer, 'kunde@pankofer.test', 'Neuer Betreff', 'Neu');
  assert (res->>'reused')::boolean is true, 'an in-flight job is reused, not duplicated';
  select count(*) into v_count from public.owner_automation_jobs where offer_id = v_offer and job_type = 'offer_email';
  assert v_count = 1, 'still exactly one offer_email job while in-flight';
end $$;

-- ---- Recipient validation: an invalid email is rejected. ----
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; v_raised boolean := false;
begin
  begin perform public.owner_enqueue_offer_email(v_offer, 'not-an-email', null, null);
  exception when others then v_raised := true; end;
  assert v_raised, 'invalid recipient email is rejected';
end $$;

-- ---- Sendable-state gate: a DRAFT offer cannot be enqueued. ----
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_draft uuid; v_raised boolean := false;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Entwurf','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','X','recipient_email','x@y.test'),
    jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',1000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_draft := (r->>'offer_id')::uuid;
  begin perform public.owner_enqueue_offer_email(v_draft, 'x@y.test', null, null);
  exception when others then v_raised := true; end;
  assert v_raised, 'a draft offer is not in a sendable state';
end $$;

-- ---- Worker (service role): mint a fresh token, mark the offer sent ONLY after send, revoke. ----
select set_config('app.role','service',false);
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; minted jsonb; marked jsonb; again jsonb;
  v_status text; v_tok uuid; rev jsonb; v_rev timestamptz;
begin
  minted := public.owner_worker_mint_offer_link(v_offer, 30);
  assert minted->>'token' is not null, 'worker mints a raw token (returned once)';
  v_tok := (minted->>'token_id')::uuid;
  assert v_tok is not null, 'worker mint returns the token id (for revoke on failure)';

  marked := public.owner_worker_mark_offer_sent(v_offer);
  assert (marked->>'changed')::boolean is true and marked->>'status' = 'sent', 'finalized offer advances to sent after send';
  select status into v_status from public.owner_offers where id = v_offer;
  assert v_status = 'sent', 'offer status is now sent';

  again := public.owner_worker_mark_offer_sent(v_offer);
  assert (again->>'changed')::boolean is false, 'mark-sent is idempotent (no double transition)';

  -- Token revoke (used by the worker when a send fails permanently).
  rev := public.owner_worker_revoke_offer_token(v_tok);
  assert (rev->>'revoked')::boolean is true, 'worker revokes a minted token';
  select revoked_at into v_rev from public.owner_document_access_tokens where id = v_tok;
  assert v_rev is not null, 'revoked token carries a revoked_at timestamp';
end $$;

-- ---- Explicit resend: a NEW versioned attempt is created; the prior SENT job is preserved. ----
select set_config('app.role','service',false);
update public.owner_automation_jobs set status = 'sent', sent_at = now()
  where offer_id = current_setting('test.offer')::uuid and job_type = 'offer_email';
select set_config('app.role','owner',false);
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; res jsonb; v_count int; v_sent int;
begin
  res := public.owner_enqueue_offer_email(v_offer, 'kunde@pankofer.test', 'Resend', 'Erneuter Versand');
  assert res->>'version' = '2', 'explicit resend creates a v2 attempt';
  assert res->>'status' = 'pending', 'the new resend attempt is pending';
  select count(*) into v_count from public.owner_automation_jobs where offer_id = v_offer and job_type = 'offer_email';
  assert v_count = 2, 'the prior SENT job is preserved as history (two attempts now)';
  select count(*) into v_sent from public.owner_automation_jobs where offer_id = v_offer and job_type = 'offer_email' and status = 'sent';
  assert v_sent = 1, 'the historical SENT attempt remains sent';
end $$;

-- ---- Safe re-arm of a FAILED job (separate offer): status → retrying, same row reused. ----
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_offer uuid; res jsonb; j record; v_count int;
begin
  r := public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',v_entity,'title','Rearm','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Z GmbH','recipient_contact_name','Frau Z',
      'recipient_street','Weg 9','recipient_postal_code','80331','recipient_city','München','recipient_email','z@z.test'),
    jsonb_build_array(jsonb_build_object('description','L','unit_price_cents',1000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  perform public.owner_enqueue_offer_email(v_offer, 'z@z.test', null, null);
  -- Simulate a permanent failure.
  update public.owner_automation_jobs set status = 'failed', attempt_count = 5, last_error = 'boom'
    where offer_id = v_offer and job_type = 'offer_email';
  res := public.owner_enqueue_offer_email(v_offer, 'z@z.test', 'Wieder', 'Nochmal');
  assert (res->>'rearmed')::boolean is true, 'a failed job is re-armed in place';
  assert res->>'status' = 'retrying', 're-armed job is set to retrying';
  select * into j from public.owner_automation_jobs where offer_id = v_offer and job_type = 'offer_email';
  assert j.attempt_count = 0 and j.last_error is null, 're-arm resets the attempt budget + clears the error';
  select count(*) into v_count from public.owner_automation_jobs where offer_id = v_offer and job_type = 'offer_email';
  assert v_count = 1, 're-arm reuses the same row (no duplicate)';
end $$;

-- ---- Authorization: enqueue is owner-only (anon is rejected). ----
select set_config('app.role','anon',false);
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; v_raised boolean := false;
begin
  begin perform public.owner_enqueue_offer_email(v_offer, 'kunde@pankofer.test', null, null);
  exception when others then v_raised := true; end;
  assert v_raised, 'enqueue requires the platform owner';
end $$;

-- ---- Worker helpers are service-role only (owner cannot call them). ----
select set_config('app.role','owner',false);
do $$
declare v_offer uuid := current_setting('test.offer')::uuid; v_raised boolean := false;
begin
  begin perform public.owner_worker_mark_offer_sent(v_offer);
  exception when others then v_raised := true; end;
  assert v_raised, 'mark-offer-sent is service-role only';
end $$;

select 'offer-email SQL tests: ALL PASSED' as result;
