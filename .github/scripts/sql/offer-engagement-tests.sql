-- Offer ENGAGEMENT SQL tests. Runs against a temporary local database with the bootstrap
-- + all owner-offer migrations (through 20260723128000) + 20260827120000 applied.
--
-- WHY THIS FILE EXISTS
-- --------------------
-- The engagement feature originally shipped with source-PARSING tests only. Those read the
-- migration as text and asserted which symbols it does and does not mention. They passed
-- against a function that was completely broken at runtime:
--
--   ERROR: column reference "business_entity_id" is ambiguous
--
-- owner_engagement_context declares OUT parameters (token_id, offer_id, business_entity_id)
-- which are ALSO PL/pgSQL variables, so an unqualified column of the same name inside the
-- body is ambiguous. PL/pgSQL resolves that only when the statement EXECUTES, so the
-- migration applied cleanly and every text-level check passed while all three public RPCs
-- failed on their first call.
--
-- Everything here therefore CALLS the functions. Test 0 is a direct regression guard for
-- that exact defect; the rest pin the security and anti-inflation behaviour.
--
-- ON_ERROR_STOP=1 → any failed assertion aborts with a non-zero exit.

\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$
begin raise notice 'PASS: %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$
begin raise exception 'FAIL: %', msg; end $$;
create or replace function pg_temp.want(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then perform pg_temp.pass(msg); else perform pg_temp.fail(msg); end if; end $$;

set session_replication_role = replica;
truncate table public.owner_offers cascade;
delete from public.owner_automation_jobs;
delete from public.owner_offer_counters;
delete from public.owner_document_access_tokens;
delete from public.owner_document_settings;
delete from public.owner_business_entities cascade;
set session_replication_role = origin;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name)
  values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city,
    country_code, business_email, vat_id, offer_number_prefix, invoice_number_prefix)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE',
    'info@example.invalid','DE123456789','AN','RE');

select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

-- Two synthetic offers of the same entity: A under test, B to prove cross-offer isolation.
do $$
declare v_entity uuid := '22222222-2222-2222-2222-222222222222'; r jsonb; v_a uuid; v_b uuid;
begin
  r := public.create_owner_offer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id',v_entity,'title','Engagement A','issue_date','2026-07-01','valid_until','2099-07-31',
        'recipient_source','manual','recipient_company','Testkunde GmbH','recipient_email','test@example.invalid',
        'recipient_contact_name','Max Mustermann','recipient_street','Teststrasse 1','recipient_postal_code','10115',
        'recipient_city','Berlin','recipient_country_code','DE'),
      jsonb_build_array(jsonb_build_object('description','Position A','quantity_milli',1000,'unit','Pauschal',
        'unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)), '{}'::jsonb);
  v_a := (r->>'offer_id')::uuid;
  r := public.create_owner_offer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id',v_entity,'title','Engagement B','issue_date','2026-07-01','valid_until','2099-07-31',
        'recipient_source','manual','recipient_company','Testkunde GmbH','recipient_email','test@example.invalid',
        'recipient_contact_name','Max Mustermann','recipient_street','Teststrasse 1','recipient_postal_code','10115',
        'recipient_city','Berlin','recipient_country_code','DE'),
      jsonb_build_array(jsonb_build_object('description','Position B','quantity_milli',1000,'unit','Pauschal',
        'unit_price_cents',200000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)), '{}'::jsonb);
  v_b := (r->>'offer_id')::uuid;

  perform public.finalize_owner_offer(gen_random_uuid(), v_a);
  perform public.finalize_owner_offer(gen_random_uuid(), v_b);

  -- Tokens are seeded directly with the SAME hash the verifier computes, so no offer
  -- email workflow is involved and nothing is ever enqueued.
  insert into public.owner_document_access_tokens (id, business_entity_id, offer_id, token_hash, expires_at, max_uses)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', v_entity, v_a,
          encode(extensions.digest(convert_to('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA','UTF8'),'sha256'),'hex'),
          now() + interval '30 days', 500),
         ('dddddddd-dddd-dddd-dddd-dddddddddddd', v_entity, v_b,
          encode(extensions.digest(convert_to('ENGAGEMENT-SQL-TEST-TOKEN-BBBBBBBBBBBBBBBB','UTF8'),'sha256'),'hex'),
          now() + interval '30 days', 500);

  perform set_config('t.offer_a', v_a::text, false);
  perform set_config('t.offer_b', v_b::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- 0. REGRESSION: the RPCs must actually EXECUTE.
--
-- Before the fix this raised 'column reference "business_entity_id" is ambiguous'
-- from owner_engagement_context. A text-parsing test cannot see that; this can.
-- ---------------------------------------------------------------------------
select set_config('app.role','anon',false);

do $$
declare r jsonb;
begin
  begin
    r := public.public_offer_engagement_start(
           'ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
           '99999999-0000-0000-0000-0000000000aa'::uuid, false);
  exception when others then
    perform pg_temp.fail('engagement start raised at runtime: ' || sqlerrm ||
      ' (this is the OUT-parameter/column ambiguity class of defect)');
  end;
  perform pg_temp.want(coalesce((r->>'ok')::boolean,false), 'public_offer_engagement_start executes and returns ok');
  perform pg_temp.want((r->>'session_id') is not null, 'start returns a session id');
  perform pg_temp.want((r->>'resumed')::boolean = false, 'first start is not a resume');
end $$;

do $$
declare r jsonb;
begin
  r := public.public_offer_engagement_start(
         'ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
         '99999999-0000-0000-0000-0000000000aa'::uuid, false);
  perform pg_temp.want((r->>'resumed')::boolean, 'same client session id resumes rather than counting a second visit');
  perform pg_temp.want((select count(*) from public.owner_offer_engagement_sessions
                        where offer_id = current_setting('t.offer_a')::uuid) = 1,
                       'a refresh does not create a second session row');
end $$;

-- ---------------------------------------------------------------------------
-- 1. ANTI-INFLATION: the server must never trust the client's active-time claim.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb;
begin
  -- Zero server time has elapsed since the session was created, so only the small
  -- scheduling grace may be credited — never the 500000 seconds claimed.
  r := public.public_offer_engagement_heartbeat(
         'ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
         '99999999-0000-0000-0000-0000000000aa'::uuid, 500000, 2500, null);
  perform pg_temp.want((r->>'accepted_seconds')::int <= 2,
    'a 500000s claim with no elapsed server time is clamped to the grace window (got ' || (r->>'accepted_seconds') || ')');
  perform pg_temp.want((select active_seconds from public.owner_offer_engagement_sessions
                        where offer_id = current_setting('t.offer_a')::uuid) <= 2,
    'stored active_seconds never reflects the inflated claim');
end $$;

do $$
declare r jsonb; v_before int;
begin
  select active_seconds into v_before from public.owner_offer_engagement_sessions
   where offer_id = current_setting('t.offer_a')::uuid;
  -- Backdate the server anchor by an hour: elapsed server time is now huge, so ONLY
  -- the hard per-heartbeat ceiling stands between the caller and a fabricated hour.
  update public.owner_offer_engagement_sessions set last_heartbeat_at = now() - interval '1 hour'
   where offer_id = current_setting('t.offer_a')::uuid;
  r := public.public_offer_engagement_heartbeat(
         'ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
         '99999999-0000-0000-0000-0000000000aa'::uuid, 500000, 2500, null);
  perform pg_temp.want((r->>'accepted_seconds')::int = 30,
    'with an hour of elapsed server time the 30s hard ceiling still applies (got ' || (r->>'accepted_seconds') || ')');
  perform pg_temp.want((select active_seconds from public.owner_offer_engagement_sessions
                        where offer_id = current_setting('t.offer_a')::uuid) = v_before + 30,
    'exactly the accepted 30s is added, never the elapsed hour');
end $$;

-- ---------------------------------------------------------------------------
-- 2. SCROLL DEPTH ratchets upward only, and stays inside 0..10000 bp.
-- ---------------------------------------------------------------------------
do $$
declare v int;
begin
  perform public.public_offer_engagement_heartbeat('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
    '99999999-0000-0000-0000-0000000000aa'::uuid, 1, 8000, null);
  perform public.public_offer_engagement_heartbeat('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
    '99999999-0000-0000-0000-0000000000aa'::uuid, 1, 4000, null);
  select max_scroll_bp into v from public.owner_offer_engagement_sessions
   where offer_id = current_setting('t.offer_a')::uuid;
  perform pg_temp.want(v = 8000, 'scroll depth keeps the maximum (80%) and ignores the later 40%');

  perform public.public_offer_engagement_heartbeat('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
    '99999999-0000-0000-0000-0000000000aa'::uuid, 1, 999999, null);
  select max_scroll_bp into v from public.owner_offer_engagement_sessions
   where offer_id = current_setting('t.offer_a')::uuid;
  perform pg_temp.want(v = 10000, 'an out-of-range scroll value is clamped to 100%, not stored raw');
end $$;

-- ---------------------------------------------------------------------------
-- 3. SECTION payloads: canonical ids persist, anything else is ignored safely.
--    An anonymous caller must not be able to turn this into free-form storage.
-- ---------------------------------------------------------------------------
do $$
declare v_rows int; v_bad int;
begin
  update public.owner_offer_engagement_sessions set last_heartbeat_at = now() - interval '1 minute'
   where offer_id = current_setting('t.offer_a')::uuid;
  perform public.public_offer_engagement_heartbeat('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
    '99999999-0000-0000-0000-0000000000aa'::uuid, 20, 10000,
    jsonb_build_object(
      'investment', 5,                       -- canonical
      'hero', 3,                             -- canonical
      'not_a_section', 9,                    -- unknown key
      'drop table public.owner_offers', 9,   -- hostile key
      '__proto__', 9,                        -- prototype-pollution style key
      repeat('x', 400), 9));                 -- oversized key

  select count(*) into v_rows from public.owner_offer_section_engagement
   where offer_id = current_setting('t.offer_a')::uuid;
  perform pg_temp.want(v_rows = 2, 'only the two canonical sections were stored (got ' || v_rows || ')');

  select count(*) into v_bad from public.owner_offer_section_engagement
   where offer_id = current_setting('t.offer_a')::uuid
     and section_id::text not in ('investment','hero');
  perform pg_temp.want(v_bad = 0, 'no non-canonical section id reached the table');

  perform pg_temp.want((select active_seconds from public.owner_offer_section_engagement
     where offer_id = current_setting('t.offer_a')::uuid and section_id = 'investment') <= 20,
    'a section can never be credited more time than the page heartbeat accepted');
end $$;

-- ---------------------------------------------------------------------------
-- 4. FUNNEL events are observational: they record, they never act.
-- ---------------------------------------------------------------------------
do $$
declare v_status text;
begin
  perform public.public_offer_engagement_event('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
    '99999999-0000-0000-0000-0000000000aa'::uuid, 'pdf_download');
  perform public.public_offer_engagement_event('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
    '99999999-0000-0000-0000-0000000000aa'::uuid, 'acceptance_opened');

  perform pg_temp.want((select pdf_download_count from public.owner_offer_engagement_sessions
     where offer_id = current_setting('t.offer_a')::uuid) = 1, 'pdf_download is counted');
  perform pg_temp.want((select acceptance_open_count from public.owner_offer_engagement_sessions
     where offer_id = current_setting('t.offer_a')::uuid) = 1, 'acceptance_opened is counted');

  select status into v_status from public.owner_offers where id = current_setting('t.offer_a')::uuid;
  perform pg_temp.want(v_status = 'finalized',
    'opening the acceptance dialog does NOT accept the offer (status still ' || v_status || ')');
  perform pg_temp.want((select accepted_at is null from public.owner_offers
     where id = current_setting('t.offer_a')::uuid), 'accepted_at is untouched');
end $$;

do $$
begin
  begin
    perform public.public_offer_engagement_event('ENGAGEMENT-SQL-TEST-TOKEN-AAAAAAAAAAAAAAAA',
      '99999999-0000-0000-0000-0000000000aa'::uuid, 'offer_accepted');
    perform pg_temp.fail('an arbitrary event type was accepted');
  exception when others then
    perform pg_temp.pass('an unknown event type is rejected: ' || sqlerrm);
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 5. CROSS-OFFER ISOLATION: a session id is only ever addressable together with
--    the offer its token resolves to.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    perform public.public_offer_engagement_heartbeat('ENGAGEMENT-SQL-TEST-TOKEN-BBBBBBBBBBBBBBBB',
      '99999999-0000-0000-0000-0000000000aa'::uuid, 100, 10000, null);
    perform pg_temp.fail('offer B token accepted offer A session id');
  exception when others then
    perform pg_temp.want(sqlerrm like '%unknown session%',
      'offer B token cannot write offer A session (rejected: ' || sqlerrm || ')');
  end;
  perform pg_temp.want((select count(*) from public.owner_offer_engagement_sessions
     where offer_id = current_setting('t.offer_b')::uuid) = 0, 'offer B has no session rows');
end $$;

-- The SAME client session id under a DIFFERENT token yields an independent session,
-- because sessions are keyed by (offer_id, client_session_id).
do $$
declare r jsonb;
begin
  r := public.public_offer_engagement_start('ENGAGEMENT-SQL-TEST-TOKEN-BBBBBBBBBBBBBBBB',
         '99999999-0000-0000-0000-0000000000aa'::uuid, false);
  perform pg_temp.want((r->>'ok')::boolean, 'the same client session id starts a separate session on offer B');
  perform pg_temp.want((select active_seconds from public.owner_offer_engagement_sessions
     where offer_id = current_setting('t.offer_b')::uuid) = 0,
    'offer B session starts at zero and inherited nothing from offer A');
end $$;

-- ---------------------------------------------------------------------------
-- 6. TOKEN BUDGET: engagement must never consume use_count. That counter gates
--    acceptance via max_uses; a 15s heartbeat spending it would lock the
--    customer out of accepting their own offer.
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.want((select use_count from public.owner_document_access_tokens
     where offer_id = current_setting('t.offer_a')::uuid) = 0,
    'after a session, many heartbeats and two events, token use_count is still 0');
end $$;

-- ---------------------------------------------------------------------------
-- 7. EMAIL / BUSINESS-ACTION SAFETY.
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.want((select count(*) from public.owner_automation_jobs) = 0,
    'engagement traffic created NO automation jobs (no email can exist without one)');
  perform pg_temp.want((select count(*) from public.owner_offer_acceptance_events) = 0,
    'engagement traffic created no acceptance events');
  perform pg_temp.want((select count(*) from public.owner_document_access_events) = 0,
    'engagement never writes the existing access audit — the "viewed" semantics are untouched');
  perform pg_temp.want((select count(*) from public.owner_finance_notifications) = 0,
    'engagement never creates owner notifications');
  perform pg_temp.want((select count(*) from public.owner_offers where status <> 'finalized') = 0,
    'no offer status was changed by any engagement call');
end $$;

-- ---------------------------------------------------------------------------
-- 8. AUTHORIZATION: anon may not read aggregates; the owner may.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    perform public.owner_offer_engagement_summary(current_setting('t.offer_a')::uuid);
    perform pg_temp.fail('anon called the owner summary RPC');
  exception when others then
    perform pg_temp.pass('anon cannot call owner_offer_engagement_summary: ' || sqlerrm);
  end;
end $$;

select set_config('app.role','owner',false);

do $$
declare s jsonb;
begin
  s := public.owner_offer_engagement_summary(current_setting('t.offer_a')::uuid);
  perform pg_temp.want((s->>'total_sessions')::int = 1, 'summary reports one session');
  perform pg_temp.want((s->>'max_scroll_bp')::int = 10000, 'summary reports 100% scroll depth');
  perform pg_temp.want((s->>'pdf_download_count')::int = 1, 'summary reports the PDF download');
  perform pg_temp.want((s->>'acceptance_open_count')::int = 1, 'summary reports the acceptance-dialog open');
  perform pg_temp.want(jsonb_array_length(s->'sections') = 2, 'summary reports both canonical sections');
  perform pg_temp.want((s->>'total_active_seconds')::int < 120,
    'summary total active time reflects the CLAMPED values, not the ~1,000,000s claimed');
  -- Pre-feature opens are reported separately and never become a duration.
  perform pg_temp.want((s->>'historical_view_count')::int = 0, 'no historical opens in this fixture');
end $$;

do $$
declare v jsonb;
begin
  v := public.owner_offer_engagement_overview('22222222-2222-2222-2222-222222222222');
  perform pg_temp.want(jsonb_array_length(v) = 2, 'overview returns both offers of the entity');
end $$;

do $$ begin raise notice '--- offer-engagement SQL tests: ALL ASSERTIONS PASSED ---'; end $$;
