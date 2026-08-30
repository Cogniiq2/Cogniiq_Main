-- =============================================================================
-- PR 70A — Owner CRM lead foundation: executable security + domain suite
-- =============================================================================
-- Runs against a throwaway database carrying the real phase-0 tenancy chain, the
-- owner finance foundation, the canonical customer layer, and
-- 20260903120000_owner_crm_lead_foundation.sql.
--
-- Everything here is EXECUTED, never source-parsed. The defect this migration
-- exists to avoid -- a browser role holding direct INSERT/UPDATE/DELETE on a
-- gated CRM table, letting a hand-written PostgREST call set
-- owner_lead_integration_checks.status = 'complete' without ever entering the
-- RPC that validates it -- is invisible to any policy-level review: a source
-- check that saw `enable row level security` plus an owner policy would call
-- these tables safe. Only issuing each statement as each role proves the
-- boundary.
--
-- Sections:
--   A. grant matrix, read from the live catalogs
--   B. DIRECT DML denial, as the real platform owner
--   C. anon / customer / cogniiq_admin denial, reads and writes and RPCs
--   D. sanctioned owner RPCs succeed
--   E. identity validation + advisory duplicate warnings
--   F. the pre-offer gate, each of the five conditions independently
--   G. tri-state preservation
--   H. loss / reopen semantics and stage-change containment
--   I. idempotency
--   J. cross-business-entity isolation
--   K. the append-only activity contract
--   L. proof that no pre-existing table was modified
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Fixture: four real profiles with four different platform roles.
-- ---------------------------------------------------------------------------
do $$
declare
  v_owner uuid := gen_random_uuid();
  v_admin uuid := gen_random_uuid();
  v_customer uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, email_confirmed_at) values
    (v_owner, 'owner@cogniiq.test', now()),
    (v_admin, 'admin@cogniiq.test', now()),
    (v_customer, 'customer@cogniiq.test', now());

  -- phase-0's signup trigger creates all three as 'customer'; promote two.
  update public.profiles set platform_role = 'cogniiq_owner' where id = v_owner;
  update public.profiles set platform_role = 'cogniiq_admin' where id = v_admin;

  create table crm_ids (k text primary key, v uuid);
  insert into crm_ids values ('owner', v_owner), ('admin', v_admin), ('customer', v_customer);
end;
$$;

create or replace function crm_id(p_key text) returns uuid
language sql stable as $$ select v from crm_ids where k = p_key $$;

-- Two business entities so cross-entity isolation is a real question.
do $$
declare a uuid; b uuid;
begin
  insert into public.owner_business_entities (slug, display_name) values ('entity-a', 'Entity A') returning id into a;
  insert into public.owner_business_entities (slug, display_name) values ('entity-b', 'Entity B') returning id into b;
  insert into crm_ids values ('entity_a', a), ('entity_b', b);
end;
$$;

-- Become the owner for the RPC sections. auth.uid() reads the app.uid GUC.
select set_config('app.uid', crm_id('owner')::text, false);
select set_config('app.role', 'authenticated', false);

-- ===========================================================================
-- A. THE GRANT MATRIX, read from the live catalogs.
--
--    anon: nothing. authenticated: SELECT and nothing else. service_role:
--    nothing. This is the P0 fix: a table-level write grant would let a browser
--    bypass every RPC below, whatever the policies say.
-- ===========================================================================
do $$
declare
  t text;
  r record;
  v_privs text;
begin
  foreach t in array array['owner_leads','owner_lead_service_interests','owner_lead_follow_ups',
                           'owner_lead_activity','owner_lead_integration_checks'] loop

    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise exception 'TEST A/rls: RLS is not enabled on public.%', t;
    end if;

    -- No policy may permit anything but SELECT.
    for r in select policyname, cmd from pg_policies where schemaname = 'public' and tablename = t loop
      if r.cmd <> 'SELECT' then
        raise exception 'TEST A/policy: public.% carries a % policy (%); only SELECT is permitted', t, r.cmd, r.policyname;
      end if;
    end loop;

    -- anon holds nothing at all.
    select string_agg(privilege_type, ',' order by privilege_type) into v_privs
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = t and grantee = 'anon';
    if v_privs is not null then
      raise exception 'TEST A/anon: anon holds % on public.%', v_privs, t;
    end if;

    -- service_role holds nothing at all: a service-role JWT is not an owner.
    select string_agg(privilege_type, ',' order by privilege_type) into v_privs
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = t and grantee = 'service_role';
    if v_privs is not null then
      raise exception 'TEST A/service_role: service_role holds % on public.%', v_privs, t;
    end if;

    -- authenticated holds SELECT and NOTHING else -- TRUNCATE, REFERENCES and
    -- TRIGGER included, none of which RLS would have covered.
    select string_agg(privilege_type, ',' order by privilege_type) into v_privs
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = t and grantee = 'authenticated';
    if v_privs is distinct from 'SELECT' then
      raise exception 'TEST A/authenticated: authenticated holds "%" on public.%, expected exactly SELECT', coalesce(v_privs, '<none>'), t;
    end if;
  end loop;

  -- The internal helpers must be unreachable from a browser role.
  foreach t in array array[
    'owner_record_lead_activity(uuid, text, text, text, timestamp with time zone)',
    'owner_lead_refresh_follow_up(uuid)',
    'owner_normalize_phone(text)',
    'owner_normalize_domain(text)',
    'owner_write_lead_audit_row()'
  ] loop
    if has_function_privilege('authenticated', 'public.' || t, 'execute') then
      raise exception 'TEST A/helper: authenticated may execute the internal helper public.%', t;
    end if;
    if has_function_privilege('anon', 'public.' || t, 'execute') then
      raise exception 'TEST A/helper: anon may execute the internal helper public.%', t;
    end if;
    if has_function_privilege('service_role', 'public.' || t, 'execute') then
      raise exception 'TEST A/helper: service_role may execute the internal helper public.%', t;
    end if;
  end loop;

  -- Every RPC pins its search_path. An unpinned SECURITY DEFINER function is a
  -- privilege-escalation primitive, not a style problem.
  for r in
    select p.proname, p.proconfig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and (p.proname like 'owner_%lead%' or p.proname = 'owner_list_leads')
  loop
    if r.proconfig is null or not (r.proconfig::text like '%search_path=%') then
      raise exception 'TEST A/search_path: security definer public.% has no pinned search_path', r.proname;
    end if;
  end loop;
end;
$$;

-- ===========================================================================
-- Seed one lead through the sanctioned path so the denial tests have a target.
-- ===========================================================================
do $$
declare r jsonb;
begin
  r := public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', crm_id('entity_a'),
    'company', 'Praxis Dr. Müller',
    'email', 'kontakt@praxis-mueller.test',
    'phone', '+49 (0)89 12 34 56',
    'website', 'https://www.praxis-mueller.test/kontakt'));
  insert into crm_ids values ('lead_a', (r->>'lead_id')::uuid);

  perform public.owner_upsert_lead_integration_check((r->>'lead_id')::uuid,
    jsonb_build_object('pvs_name', 'Medistar', 'status', 'in_progress'));
end;
$$;

-- ===========================================================================
-- B. DIRECT DML DENIAL, issued AS THE REAL PLATFORM OWNER.
--
--    This is the heart of the fix. The owner is the most privileged human in
--    the product and passes every RLS policy on these tables; the database must
--    still refuse a direct write, because a direct write is exactly how the
--    validating RPC gets bypassed.
-- ===========================================================================
do $$
declare
  v_denied boolean;
  v_status text;
  v_stage text;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  -- The owner really is the owner: the SELECT side works.
  if not public.is_platform_owner() then
    raise exception 'TEST SETUP FAILED: the fixture owner is not recognised as the platform owner';
  end if;
  if (select count(*) from public.owner_leads) <> 1 then
    raise exception 'TEST B/setup: the owner must be able to READ their own leads';
  end if;

  -- (B1) direct UPDATE of the pre-offer gate -> DENIED.
  --      Without this, `PATCH /owner_lead_integration_checks?status=complete`
  --      from the browser would complete the assessment with no PVS, no
  --      interface answer, no confirmed costs and no fallback.
  v_denied := false;
  begin
    update public.owner_lead_integration_checks set status = 'complete' where lead_id = crm_id('lead_a');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then
    raise exception 'TEST B1: the owner completed the pre-offer gate with a DIRECT UPDATE';
  end if;

  -- (B2) direct UPDATE of the sales stage -> DENIED.
  v_denied := false;
  begin
    update public.owner_leads set stage = 'won' where id = crm_id('lead_a');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then
    raise exception 'TEST B2: the owner set stage=won with a DIRECT UPDATE';
  end if;

  -- (B3) direct INSERT into the append-only timeline -> DENIED. The sanctioned
  --      RPC path is intentionally the only writer.
  v_denied := false;
  begin
    insert into public.owner_lead_activity (lead_id, event_type, summary)
    values (crm_id('lead_a'), 'forged', 'forged timeline entry');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then
    raise exception 'TEST B3: the owner INSERTed a timeline row directly';
  end if;

  -- (B3b) and neither may the owner rewrite or erase history.
  v_denied := false;
  begin
    update public.owner_lead_activity set summary = 'rewritten';
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B3b: the owner UPDATEd an append-only timeline row'; end if;

  v_denied := false;
  begin
    delete from public.owner_lead_activity;
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B3c: the owner DELETEd an append-only timeline row'; end if;

  -- (B4) every remaining write verb on every remaining table -> DENIED.
  v_denied := false;
  begin
    insert into public.owner_leads (business_entity_id, company) values (crm_id('entity_a'), 'Direct insert');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B4a: the owner INSERTed a lead directly'; end if;

  v_denied := false;
  begin
    delete from public.owner_leads where id = crm_id('lead_a');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B4b: the owner DELETEd a lead directly'; end if;

  v_denied := false;
  begin
    insert into public.owner_lead_service_interests (lead_id, service_key) values (crm_id('lead_a'), 'website');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B4c: the owner INSERTed a service interest directly'; end if;

  v_denied := false;
  begin
    insert into public.owner_lead_follow_ups (lead_id, due_at) values (crm_id('lead_a'), now());
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B4d: the owner INSERTed a follow-up directly'; end if;

  v_denied := false;
  begin
    insert into public.owner_lead_integration_checks (lead_id, status) values (gen_random_uuid(), 'complete');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B4e: the owner INSERTed an integration check directly'; end if;

  -- (B5) TRUNCATE is not covered by RLS at all, so it is checked explicitly.
  v_denied := false;
  begin
    execute 'truncate table public.owner_lead_activity';
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST B5: the owner TRUNCATEd the timeline'; end if;

  -- Nothing above took effect.
  select status into v_status from public.owner_lead_integration_checks where lead_id = crm_id('lead_a');
  select stage into v_stage from public.owner_leads where id = crm_id('lead_a');
  if v_status <> 'in_progress' or v_stage <> 'new' then
    raise exception 'TEST B/effect: a denied write still changed state (status=%, stage=%)', v_status, v_stage;
  end if;
end;
$$;

-- ===========================================================================
-- C. anon, an ordinary customer, and cogniiq_admin: no reads, no writes, no RPCs.
-- ===========================================================================
do $$
declare t text; v_denied boolean;
begin
  set local role anon;
  perform set_config('app.uid', '', true);

  foreach t in array array['owner_leads','owner_lead_service_interests','owner_lead_follow_ups',
                           'owner_lead_activity','owner_lead_integration_checks'] loop
    v_denied := false;
    begin
      execute format('select count(*) from public.%I', t);
    exception when insufficient_privilege then v_denied := true; end;
    if not v_denied then raise exception 'TEST C/anon-read: anon read public.%', t; end if;

    v_denied := false;
    begin
      execute format('delete from public.%I', t);
    exception when insufficient_privilege then v_denied := true; end;
    if not v_denied then raise exception 'TEST C/anon-write: anon DELETEd from public.%', t; end if;
  end loop;

  -- Not one RPC is reachable without an execute grant.
  v_denied := false;
  begin
    perform public.owner_list_leads(crm_id('entity_a'));
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/anon-rpc: anon executed owner_list_leads'; end if;
end;
$$;

-- The customer and the cogniiq_admin DO hold the authenticated SELECT grant, so
-- for them the boundary is the policy: they must read exactly zero rows, and
-- every RPC must refuse them by name.
create or replace function pg_temp.assert_no_crm_access(p_uid uuid, p_label text)
returns void language plpgsql as $$
declare c bigint; v_denied boolean; t text;
begin
  perform set_config('app.uid', p_uid::text, true);

  foreach t in array array['owner_leads','owner_lead_service_interests','owner_lead_follow_ups',
                           'owner_lead_activity','owner_lead_integration_checks'] loop
    execute format('select count(*) from public.%I', t) into c;
    if c <> 0 then raise exception 'TEST C/%: read % rows from public.%', p_label, c, t; end if;

    v_denied := false;
    begin
      execute format('update public.%I set created_at = now()', t);
    exception when insufficient_privilege then v_denied := true; end;
    if not v_denied then raise exception 'TEST C/%: UPDATEd public.%', p_label, t; end if;
  end loop;

  -- The RPCs are granted to `authenticated`, so these calls REACH the body and
  -- must be refused there by is_platform_owner(). That is the second,
  -- independent check the review asked for.
  v_denied := false;
  begin perform public.owner_list_leads(crm_id('entity_a'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_list_leads', p_label; end if;

  v_denied := false;
  begin perform public.owner_lead_detail(crm_id('lead_a'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_lead_detail', p_label; end if;

  v_denied := false;
  begin perform public.owner_create_lead(gen_random_uuid(),
    jsonb_build_object('business_entity_id', crm_id('entity_a'), 'company', 'Rogue'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_create_lead', p_label; end if;

  v_denied := false;
  begin perform public.owner_set_lead_stage(crm_id('lead_a'), 'won');
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_set_lead_stage', p_label; end if;

  v_denied := false;
  begin perform public.owner_upsert_lead_integration_check(crm_id('lead_a'), jsonb_build_object('status', 'complete'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_upsert_lead_integration_check', p_label; end if;

  v_denied := false;
  begin perform public.owner_log_lead_contact(crm_id('lead_a'), 'call', 'rogue');
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_log_lead_contact', p_label; end if;

  v_denied := false;
  begin perform public.owner_find_lead_duplicates(crm_id('entity_a'), jsonb_build_object('email', 'kontakt@praxis-mueller.test'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST C/%: ran owner_find_lead_duplicates', p_label; end if;
end;
$$;

do $$
begin
  set local role authenticated;
  perform pg_temp.assert_no_crm_access(crm_id('customer'), 'customer');
  perform pg_temp.assert_no_crm_access(crm_id('admin'), 'cogniiq_admin');
end;
$$;

-- ===========================================================================
-- D. The sanctioned owner RPCs work, as the real authenticated owner role.
-- ===========================================================================
do $$
declare r jsonb; v_lead uuid; v_fu uuid; c bigint;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  r := public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', crm_id('entity_a'),
    'contact_name', 'Dr. Schmidt',
    'service_interests', jsonb_build_array('ai_receptionist', 'website'),
    'next_follow_up_at', (now() + interval '3 days')::text,
    'follow_up_note', 'Rückruf'));
  v_lead := (r->>'lead_id')::uuid;

  -- The follow-up cache is deterministic: it is the earliest OPEN follow-up.
  select count(*) into c from public.owner_leads
  where id = v_lead and next_follow_up_at is not null and follow_up_note = 'Rückruf';
  if c <> 1 then raise exception 'TEST D/cache: the next-follow-up cache was not populated'; end if;

  -- An earlier follow-up wins the cache.
  v_fu := (public.owner_upsert_lead_follow_up(v_lead, null, now() + interval '1 day', 'Früher')->>'follow_up_id')::uuid;
  select count(*) into c from public.owner_leads where id = v_lead and follow_up_note = 'Früher';
  if c <> 1 then raise exception 'TEST D/cache: an earlier follow-up did not take over the cache'; end if;

  -- Completing it recomputes the cache from the table rather than guessing.
  perform public.owner_complete_lead_follow_up(v_fu, 'done', 'erledigt');
  select count(*) into c from public.owner_leads where id = v_lead and follow_up_note = 'Rückruf';
  if c <> 1 then raise exception 'TEST D/cache: the cache did not fall back to the remaining follow-up'; end if;

  -- Logged contact moves last_contact_at; a note does not.
  perform public.owner_log_lead_contact(v_lead, 'note', 'interne Notiz');
  select count(*) into c from public.owner_leads where id = v_lead and last_contact_at is not null;
  if c <> 0 then raise exception 'TEST D/contact: a note must not count as contact'; end if;
  perform public.owner_log_lead_contact(v_lead, 'call', 'telefoniert');
  select count(*) into c from public.owner_leads where id = v_lead and last_contact_at is not null;
  if c <> 1 then raise exception 'TEST D/contact: a call must move last_contact_at'; end if;

  -- Patch semantics: absent leaves alone, present-and-empty clears.
  perform public.owner_update_lead(v_lead, jsonb_build_object('city', 'München'));
  perform public.owner_update_lead(v_lead, jsonb_build_object('notes', 'Notiz'));
  select count(*) into c from public.owner_leads where id = v_lead and city = 'München' and notes = 'Notiz';
  if c <> 1 then raise exception 'TEST D/patch: an absent key must not clear a column'; end if;
  perform public.owner_update_lead(v_lead, jsonb_build_object('notes', ''));
  select count(*) into c from public.owner_leads where id = v_lead and notes is null and city = 'München';
  if c <> 1 then raise exception 'TEST D/patch: a present empty key must clear only that column'; end if;

  -- Service interests are replaced wholesale.
  perform public.owner_update_lead(v_lead, jsonb_build_object('service_interests', jsonb_build_array('automations')));
  select count(*) into c from public.owner_lead_service_interests where lead_id = v_lead;
  if c <> 1 then raise exception 'TEST D/interests: wholesale replacement left % rows', c; end if;

  -- Archive and restore, never delete.
  perform public.owner_set_lead_archived(v_lead, true);
  select count(*) into c from public.owner_leads where id = v_lead and archived_at is not null;
  if c <> 1 then raise exception 'TEST D/archive: the lead was not archived'; end if;
  perform public.owner_set_lead_archived(v_lead, false);
  select count(*) into c from public.owner_leads where id = v_lead and archived_at is null;
  if c <> 1 then raise exception 'TEST D/archive: the lead was not restored'; end if;

  -- The read models are shaped the way a surface consumes them.
  r := public.owner_lead_detail(v_lead);
  if r->'lead'->>'display_name' <> 'Dr. Schmidt' then
    raise exception 'TEST D/detail: display_name fell back wrongly (%)', r->'lead'->>'display_name';
  end if;
  if jsonb_typeof(r->'activity') <> 'array' or jsonb_array_length(r->'activity') = 0 then
    raise exception 'TEST D/detail: the timeline is empty';
  end if;
  -- The reserved task seam is present and empty; 70A persists no CRM tasks.
  if r->'tasks' <> '[]'::jsonb then
    raise exception 'TEST D/detail: the task seam must be an empty array in 70A';
  end if;

  if jsonb_array_length(public.owner_list_leads(crm_id('entity_a'))) <> 2 then
    raise exception 'TEST D/list: the list projection returned the wrong number of leads';
  end if;

  insert into crm_ids values ('lead_b', v_lead);
end;
$$;

-- ===========================================================================
-- E. Identity validation and ADVISORY duplicate warnings.
-- ===========================================================================
do $$
declare r jsonb; v_denied boolean; c bigint; v_lead uuid;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  -- (E1) a lead with no recognisable identity is refused.
  v_denied := false;
  begin
    perform public.owner_create_lead(gen_random_uuid(),
      jsonb_build_object('business_entity_id', crm_id('entity_a'), 'city', 'Berlin'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST E1: a lead was created with no company, contact or email'; end if;

  -- (E2) any ONE of the three is enough. Nothing else is mandatory.
  perform public.owner_create_lead(gen_random_uuid(),
    jsonb_build_object('business_entity_id', crm_id('entity_a'), 'email', 'nur-email@example.test'));
  perform public.owner_create_lead(gen_random_uuid(),
    jsonb_build_object('business_entity_id', crm_id('entity_a'), 'contact_name', 'Nur Name'));

  -- (E3) a new lead may not start already won or lost.
  v_denied := false;
  begin
    perform public.owner_create_lead(gen_random_uuid(),
      jsonb_build_object('business_entity_id', crm_id('entity_a'), 'company', 'X', 'stage', 'won'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST E3: a lead started as won'; end if;

  -- (E4) a duplicate is WARNED ABOUT, never blocked and never merged: the same
  --      e-mail creates a SECOND lead and returns a strong-signal warning.
  select count(*) into c from public.owner_leads where lower(email) = 'kontakt@praxis-mueller.test';
  r := public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', crm_id('entity_a'),
    'company', 'Praxis Müller Zweitstelle',
    'email', 'KONTAKT@Praxis-Mueller.test'));
  v_lead := (r->>'lead_id')::uuid;
  if v_lead is null then raise exception 'TEST E4: a duplicate BLOCKED lead creation'; end if;
  if (select count(*) from public.owner_leads where lower(email) = 'kontakt@praxis-mueller.test') <> c + 1 then
    raise exception 'TEST E4: the duplicate was merged instead of created';
  end if;
  if jsonb_array_length(r->'duplicates') < 1 then
    raise exception 'TEST E4: no duplicate warning was returned';
  end if;
  if not exists (select 1 from jsonb_array_elements(r->'duplicates') d
                 where d->>'matched_on' = 'email' and d->>'confidence' = 'strong') then
    raise exception 'TEST E4: e-mail must be reported as a STRONG signal (%)', r->'duplicates';
  end if;

  -- (E5) a phone written differently is still the same number, and still strong.
  r := public.owner_find_lead_duplicates(crm_id('entity_a'), jsonb_build_object('phone', '0049 89 123456'));
  if not exists (select 1 from jsonb_array_elements(r) d
                 where d->>'matched_on' = 'phone' and d->>'confidence' = 'strong') then
    raise exception 'TEST E5: a differently formatted phone number did not match strongly (%)', r;
  end if;

  -- (E6) a website matches on the HOST, ignoring scheme, www and path.
  r := public.owner_find_lead_duplicates(crm_id('entity_a'), jsonb_build_object('website', 'praxis-mueller.test'));
  if not exists (select 1 from jsonb_array_elements(r) d
                 where d->>'matched_on' = 'website' and d->>'confidence' = 'strong') then
    raise exception 'TEST E6: the website host did not match strongly (%)', r;
  end if;

  -- (E7) a shared company name alone is the WEAKEST possible signal.
  r := public.owner_find_lead_duplicates(crm_id('entity_a'), jsonb_build_object('company', 'Praxis Dr. Müller'));
  if not exists (select 1 from jsonb_array_elements(r) d
                 where d->>'matched_on' = 'company' and d->>'confidence' = 'weak') then
    raise exception 'TEST E7: a company-only match must be weak (%)', r;
  end if;

  -- (E8) an existing CUSTOMER is warned about too, so "this is already a
  --      customer" is not missed.
  perform public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', crm_id('entity_a'), 'company', 'Bestandskunde', 'email', 'kunde@example.test'));
  r := public.owner_find_lead_duplicates(crm_id('entity_a'), jsonb_build_object('email', 'kunde@example.test'));
  if not exists (select 1 from jsonb_array_elements(r) d where d->>'kind' = 'customer') then
    raise exception 'TEST E8: an existing customer was not reported as a duplicate (%)', r;
  end if;

  -- (E9) nothing recognisable in, nothing out.
  if public.owner_find_lead_duplicates(crm_id('entity_a'), '{}'::jsonb) <> '[]'::jsonb then
    raise exception 'TEST E9: an empty payload returned matches';
  end if;
end;
$$;

-- ===========================================================================
-- F. THE PRE-OFFER GATE. Two independent layers, tested separately.
--
--    F-A (this block) is the RPC's MESSAGE layer. Each of the five conditions is
--    driven to the brink -- four satisfied, one missing -- and the RPC must
--    answer with the specific domain sentence naming what is missing. A raw
--    check_violation surfacing here is a FAILURE, not a pass: it would mean the
--    RPC validated after issuing the UPDATE, the constraint rejected the
--    statement first, and the owner is being shown a constraint name instead of
--    an explanation.
--
--    F-B (the next block) is the ENFORCEMENT layer: the same five conditions
--    against a raw write by the table owner, which never enters the RPC at all.
--
--    Neither block substitutes for the other. If the constraint were dropped,
--    F-B fails. If the RPC went back to validating after the write, F-A fails.
-- ===========================================================================

-- Asserts BOTH that the RPC refused AND that it refused with its own message.
-- The check_violation arm is the whole point: it converts "validated too late"
-- from a silent behaviour into a test failure.
create or replace function pg_temp.assert_gate_message(
  p_lead uuid, p_patch jsonb, p_expect text, p_label text
) returns void language plpgsql as $$
declare v_msg text; v_raised boolean := false;
begin
  begin
    perform public.owner_upsert_lead_integration_check(p_lead, p_patch);
  exception
    when check_violation then
      raise exception 'TEST %: the RPC surfaced a raw constraint violation (SQLSTATE %) instead of its own message -- validation must happen BEFORE the write', p_label, sqlstate;
    when raise_exception then
      get stacked diagnostics v_msg = message_text;
      v_raised := true;
  end;
  if not v_raised then
    raise exception 'TEST %: the RPC accepted an invalid completion', p_label;
  end if;
  if position(p_expect in v_msg) = 0 then
    raise exception 'TEST %: expected a message containing "%", got "%"', p_label, p_expect, v_msg;
  end if;
end;
$$;

do $$
declare
  v_lead uuid;
  v_ok jsonb := jsonb_build_object(
    'pvs_name', 'Medistar',
    'interface_type', 'official_api',
    'third_party_costs_confirmed', true,
    'third_party_setup_cents', 0,
    'third_party_monthly_cents', 0,
    'integration_mode', 'full_automation');
  v_before jsonb;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  v_lead := (public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', crm_id('entity_a'), 'company', 'Gate Testpraxis'))->>'lead_id')::uuid;
  insert into crm_ids values ('lead_gate', v_lead);

  -- (F0) an assessment that answers nothing cannot be completed.
  perform pg_temp.assert_gate_message(v_lead, jsonb_build_object('status', 'complete'),
    'record the PVS or the appointment system', 'F0');

  -- Every case below uses explicit JSON nulls, not absent keys: an absent key
  -- means "leave alone" under patch semantics, so clearing the column is the
  -- only way to test one condition in isolation.

  -- (F1) no PVS and no appointment system.
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('pvs_name', null, 'appointment_system', null, 'status', 'complete'),
    'record the PVS or the appointment system', 'F1');

  -- (F1b) an appointment system alone is enough for THIS condition.
  perform public.owner_upsert_lead_integration_check(v_lead,
    v_ok || jsonb_build_object('pvs_name', null, 'appointment_system', 'Doctolib', 'status', 'complete'));
  if (select status from public.owner_lead_integration_checks where lead_id = v_lead) <> 'complete' then
    raise exception 'TEST F1b: an appointment system alone should satisfy condition 1';
  end if;
  perform public.owner_upsert_lead_integration_check(v_lead,
    jsonb_build_object('status', 'in_progress', 'appointment_system', ''));

  -- (F2) the interface question is unanswered. NULL is not an answer...
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('interface_type', null, 'status', 'complete'),
    'record which interface exists', 'F2');

  -- ...and neither is 'unknown'.
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('interface_type', 'unknown', 'status', 'complete'),
    'record which interface exists', 'F2b');

  -- ...but 'none' IS an answer. "There is no interface" is a finding, not a gap.
  perform public.owner_upsert_lead_integration_check(v_lead,
    v_ok || jsonb_build_object('interface_type', 'none', 'integration_mode', 'not_possible',
                               'fallback_description', 'Manuelle Terminübergabe per E-Mail', 'status', 'complete'));
  if (select status from public.owner_lead_integration_checks where lead_id = v_lead) <> 'complete' then
    raise exception 'TEST F2c: interface_type = none must be accepted as an answer';
  end if;
  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('status', 'in_progress'));

  -- (F3) third-party costs not confirmed.
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('third_party_costs_confirmed', false, 'status', 'complete'),
    'third-party costs must be confirmed', 'F3');

  -- (F3b) confirmed but with no amount recorded. "Confirmed" without a number
  --       is not a confirmation.
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('third_party_monthly_cents', null, 'status', 'complete'),
    'third-party costs must be confirmed', 'F3b');

  -- (F3c) ZERO is a valid confirmed amount.
  perform public.owner_upsert_lead_integration_check(v_lead, v_ok || jsonb_build_object('status', 'complete'));
  if (select third_party_setup_cents from public.owner_lead_integration_checks where lead_id = v_lead) <> 0 then
    raise exception 'TEST F3c: a confirmed zero third-party cost was not stored as zero';
  end if;
  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('status', 'in_progress'));

  -- (F4) the integration mode is undecided.
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('integration_mode', null, 'status', 'complete'),
    'full or partial automation', 'F4');

  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('integration_mode', 'unknown', 'status', 'complete'),
    'full or partial automation', 'F4b');

  -- (F5) anything short of full automation must state its fallback.
  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('integration_mode', 'partial_automation',
                               'fallback_description', null, 'status', 'complete'),
    'describe its exact fallback', 'F5');

  perform pg_temp.assert_gate_message(v_lead,
    v_ok || jsonb_build_object('integration_mode', 'not_possible',
                               'fallback_description', null, 'status', 'complete'),
    'describe its exact fallback', 'F5b');

  perform public.owner_upsert_lead_integration_check(v_lead,
    v_ok || jsonb_build_object('integration_mode', 'partial_automation',
                               'fallback_description', 'Termine werden per E-Mail gemeldet', 'status', 'complete'));
  if (select status from public.owner_lead_integration_checks where lead_id = v_lead) <> 'complete' then
    raise exception 'TEST F5c: a stated fallback should satisfy condition 5';
  end if;
end;
$$;

-- (F6) A REFUSED completion must write NOTHING. Validating before the UPDATE is
-- what makes this true: the patch that would have accompanied the invalid
-- completion is discarded whole, so a rejected save cannot half-apply.
do $$
declare v_lead uuid; v_before jsonb; v_after jsonb;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);
  v_lead := crm_id('lead_gate');

  select to_jsonb(ic) - 'updated_at' - 'updated_by'
    into v_before from public.owner_lead_integration_checks ic where ic.lead_id = v_lead;

  perform pg_temp.assert_gate_message(v_lead,
    jsonb_build_object('status', 'complete', 'integration_mode', 'unknown',
                       'notes', 'diese Notiz darf nicht gespeichert werden',
                       'pvs_vendor', 'darf nicht gespeichert werden'),
    'full or partial automation', 'F6');

  select to_jsonb(ic) - 'updated_at' - 'updated_by'
    into v_after from public.owner_lead_integration_checks ic where ic.lead_id = v_lead;

  if v_after is distinct from v_before then
    raise exception 'TEST F6: a refused completion still wrote part of its patch (% -> %)', v_before, v_after;
  end if;
end;
$$;


-- F-B. THE ENFORCEMENT LAYER: the same five conditions against a RAW write by
-- the table owner -- the one caller no grant can stop and which never enters the
-- RPC at all. Each statement must be rejected by
-- owner_lead_integration_checks_complete_gate specifically (check_violation is
-- the only condition caught below, so a different failure is still a test
-- failure). If the gate lived only in the RPC, every statement here would
-- succeed.
do $$
declare v_lead uuid; v_denied boolean; s text;
begin
  v_lead := crm_id('lead_gate');
  update public.owner_lead_integration_checks set
    status = 'in_progress', pvs_name = 'Medistar', appointment_system = null,
    interface_type = 'official_api', third_party_costs_confirmed = true,
    third_party_setup_cents = 0, third_party_monthly_cents = 0,
    integration_mode = 'full_automation', fallback_description = null
  where lead_id = v_lead;

  foreach s in array array[
    'pvs_name = null',
    'interface_type = null',
    'interface_type = ''unknown''',
    'third_party_costs_confirmed = false',
    'third_party_monthly_cents = null',
    'integration_mode = null',
    'integration_mode = ''unknown''',
    'integration_mode = ''partial_automation'''
  ] loop
    v_denied := false;
    begin
      execute format('update public.owner_lead_integration_checks set status = ''complete'', %s where lead_id = %L', s, v_lead);
    exception when check_violation then v_denied := true; end;
    if not v_denied then
      raise exception 'TEST F/raw: a DIRECT superuser write completed the gate with %', s;
    end if;
  end loop;

  -- A satisfied assessment is of course still allowed through the raw path.
  update public.owner_lead_integration_checks set status = 'complete' where lead_id = v_lead;
  if (select status from public.owner_lead_integration_checks where lead_id = v_lead) <> 'complete' then
    raise exception 'TEST F/raw: a fully satisfied assessment was refused';
  end if;
end;
$$;

-- ===========================================================================
-- G. TRI-STATE PRESERVATION. NULL means "not yet established" and must stay
--    semantically different from FALSE, through every patch shape.
-- ===========================================================================
do $$
declare v_lead uuid; r record;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);
  v_lead := crm_id('lead_gate');

  -- Baseline: never touched -> NULL.
  select * into r from public.owner_lead_integration_checks where lead_id = v_lead;
  if r.supports_booking is not null then raise exception 'TEST G1: an untouched capability is not NULL'; end if;

  -- Explicit false is stored as false, not as NULL.
  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('supports_booking', false));
  select * into r from public.owner_lead_integration_checks where lead_id = v_lead;
  if r.supports_booking is distinct from false then raise exception 'TEST G2: explicit false was not stored as false'; end if;

  -- Explicit true is stored as true.
  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('supports_booking', true));
  select * into r from public.owner_lead_integration_checks where lead_id = v_lead;
  if r.supports_booking is distinct from true then raise exception 'TEST G3: explicit true was not stored as true'; end if;

  -- An ABSENT key leaves the value alone; it must not decay to false.
  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('notes', 'unrelated'));
  select * into r from public.owner_lead_integration_checks where lead_id = v_lead;
  if r.supports_booking is distinct from true then raise exception 'TEST G4: an absent key changed a tri-state value'; end if;

  -- An explicit JSON null returns the value to "unknown" -- NOT to false.
  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('supports_booking', null));
  select * into r from public.owner_lead_integration_checks where lead_id = v_lead;
  if r.supports_booking is not null then raise exception 'TEST G5: explicit null did not restore "unknown"'; end if;

  -- The other four capabilities are untouched by all of the above: still NULL,
  -- never coerced.
  if r.supports_availability is not null or r.supports_reschedule is not null
     or r.supports_cancel is not null or r.supports_patient_write is not null then
    raise exception 'TEST G6: an unrelated capability was coerced away from NULL';
  end if;
end;
$$;

-- ===========================================================================
-- H. Loss, reopening, and the containment of a stage change.
-- ===========================================================================
do $$
declare v_lead uuid; r record; v_denied boolean;
  v_customers bigint; v_offers bigint; v_invoices bigint; v_audit_before bigint;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);
  v_lead := crm_id('lead_b');

  select count(*) into v_customers from public.owner_customers;
  select count(*) into v_offers from public.owner_offers;
  select count(*) into v_invoices from public.owner_invoices;

  -- (H1) a loss needs a reason.
  v_denied := false;
  begin perform public.owner_set_lead_stage(v_lead, 'lost');
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST H1: a lead was lost with no reason'; end if;

  -- (H2) a loss with a reason records both.
  perform public.owner_set_lead_stage(v_lead, 'lost', 'Budget gestrichen');
  select * into r from public.owner_leads where id = v_lead;
  if r.stage <> 'lost' or r.lost_at is null or r.lost_reason <> 'Budget gestrichen' then
    raise exception 'TEST H2: the loss was not recorded';
  end if;

  -- (H3) reopening keeps the history and clears only the stale reason.
  perform public.owner_set_lead_stage(v_lead, 'negotiation');
  select * into r from public.owner_leads where id = v_lead;
  if r.stage <> 'negotiation' or r.lost_at is not null or r.lost_reason is not null then
    raise exception 'TEST H3: reopening did not clear the loss';
  end if;
  if r.city <> 'München' then raise exception 'TEST H3b: reopening lost lead data'; end if;
  if not exists (select 1 from public.owner_lead_activity where lead_id = v_lead and event_type = 'lead_lost') then
    raise exception 'TEST H3c: the loss disappeared from the timeline when the lead was reopened';
  end if;

  -- (H4) WON IS REFUSED IN 70A. A project starts at Won, so winning must create
  --      the customer, the project and the sold services atomically. That path
  --      does not exist yet, and a lead parked at 'won' with none of them would
  --      be an orphan the rest of the system cannot represent. The transition is
  --      withheld; the schema value stays valid so the successor migration needs
  --      no destructive change.
  v_denied := false;
  begin perform public.owner_set_lead_stage(v_lead, 'won');
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST H4: a lead was set to won with no customer and no project'; end if;

  -- The refusal left the lead exactly where it was.
  select * into r from public.owner_leads where id = v_lead;
  if r.stage <> 'negotiation' then
    raise exception 'TEST H4a: the refused transition still moved the stage to %', r.stage;
  end if;
  if r.won_at is not null then
    raise exception 'TEST H4b: the refused transition stamped won_at';
  end if;

  -- And created nothing anywhere else.
  if (select count(*) from public.owner_customers) <> v_customers then
    raise exception 'TEST H4c: a stage change created or removed a customer';
  end if;
  if (select count(*) from public.owner_offers) <> v_offers then
    raise exception 'TEST H4d: a stage change touched owner_offers';
  end if;
  if (select count(*) from public.owner_invoices) <> v_invoices then
    raise exception 'TEST H4e: a stage change touched owner_invoices';
  end if;
  if exists (select 1 from public.owner_lead_activity where lead_id = v_lead and event_type = 'lead_won') then
    raise exception 'TEST H4f: the refused transition still wrote a lead_won timeline row';
  end if;

  -- 'won' is still a legal value of the CHECK -- it is the TRANSITION that is
  -- withheld, not the value, so the conversion migration needs no schema change.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.owner_leads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%stage%'
      and pg_get_constraintdef(oid) like '%''won''%') then
    raise exception 'TEST H4g: ''won'' is no longer a valid schema stage value';
  end if;

  -- No other sanctioned path can produce a won lead either: creation refuses it
  -- (E3 above) and owner_update_lead cannot write `stage` at all.
  perform public.owner_update_lead(v_lead, jsonb_build_object('stage', 'won'));
  if (select stage from public.owner_leads where id = v_lead) <> 'negotiation' then
    raise exception 'TEST H4h: owner_update_lead wrote the pipeline stage';
  end if;
  if (select count(*) from public.owner_leads where stage = 'won') <> 0 then
    raise exception 'TEST H4i: a won lead exists after 70A''s sanctioned RPCs';
  end if;

  -- (H5) an invalid stage is refused outright.
  v_denied := false;
  begin perform public.owner_set_lead_stage(v_lead, 'converted');
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST H5: an unknown pipeline stage was accepted'; end if;

  -- (H6) 70A ships no conversion RPC at all. Its absence is the assertion.
  if to_regprocedure('public.owner_convert_lead_to_customer(uuid, jsonb)') is not null then
    raise exception 'TEST H6: a lead->customer conversion RPC exists in 70A; the atomic conversion is a later PR';
  end if;
end;
$$;

-- (H7) The RPC refusal is a domain rule, not the boundary. A browser that
-- skipped the RPC entirely and issued the UPDATE itself is still refused -- by
-- the table grants, as the real platform owner. Without this, "no won lead can
-- exist in 70A" would rest on the RPC alone.
do $$
declare v_denied boolean;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  v_denied := false;
  begin
    update public.owner_leads set stage = 'won', won_at = now() where id = crm_id('lead_b');
  exception when insufficient_privilege then v_denied := true; end;
  if not v_denied then raise exception 'TEST H7: the owner set stage=won with a DIRECT UPDATE'; end if;

  if (select count(*) from public.owner_leads where stage = 'won') <> 0 then
    raise exception 'TEST H7b: a won lead exists after the direct write was refused';
  end if;
end;
$$;

-- ===========================================================================
-- I. Idempotency: a replayed key returns the stored result and creates nothing.
-- ===========================================================================
do $$
declare k uuid := gen_random_uuid(); r1 jsonb; r2 jsonb; c bigint; v_denied boolean;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  select count(*) into c from public.owner_leads;
  r1 := public.owner_create_lead(k, jsonb_build_object(
    'business_entity_id', crm_id('entity_a'), 'company', 'Idempotenz GmbH'));
  r2 := public.owner_create_lead(k, jsonb_build_object(
    'business_entity_id', crm_id('entity_a'), 'company', 'Idempotenz GmbH'));

  if r1->>'lead_id' is distinct from r2->>'lead_id' then
    raise exception 'TEST I1: a replayed idempotency key produced a second lead';
  end if;
  if (select count(*) from public.owner_leads) <> c + 1 then
    raise exception 'TEST I2: a replayed idempotency key changed the row count';
  end if;

  -- The key is bound to its operation.
  v_denied := false;
  begin perform public.owner_create_customer(k, jsonb_build_object(
    'business_entity_id', crm_id('entity_a'), 'company', 'Falsche Verwendung'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST I3: an idempotency key was reused for a different operation'; end if;
end;
$$;

-- ===========================================================================
-- J. Cross-business-entity isolation.
-- ===========================================================================
do $$
declare v_b uuid; r jsonb; v_denied boolean;
begin
  set local role authenticated;
  perform set_config('app.uid', crm_id('owner')::text, true);

  v_b := (public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', crm_id('entity_b'),
    'company', 'Praxis Dr. Müller',
    'email', 'kontakt@praxis-mueller.test'))->>'lead_id')::uuid;

  -- Entity A's list must not contain entity B's lead, and vice versa.
  if exists (select 1 from jsonb_array_elements(public.owner_list_leads(crm_id('entity_a'))) d
             where (d->>'id')::uuid = v_b) then
    raise exception 'TEST J1: entity B''s lead leaked into entity A''s list';
  end if;
  if jsonb_array_length(public.owner_list_leads(crm_id('entity_b'))) <> 1 then
    raise exception 'TEST J2: entity B''s list is wrong';
  end if;

  -- Duplicate detection is entity-scoped: the identical e-mail in entity B must
  -- not be reported when scanning entity A.
  r := public.owner_find_lead_duplicates(crm_id('entity_b'), jsonb_build_object('email', 'kontakt@praxis-mueller.test'));
  if exists (select 1 from jsonb_array_elements(r) d where (d->>'id')::uuid = crm_id('lead_a')) then
    raise exception 'TEST J3: duplicate detection crossed a business-entity boundary';
  end if;

  -- An unknown entity is refused rather than silently returning nothing.
  v_denied := false;
  begin perform public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', gen_random_uuid(), 'company', 'Nirgendwo'));
  exception when raise_exception then v_denied := true; end;
  if not v_denied then raise exception 'TEST J4: a lead was created against an unknown business entity'; end if;
end;
$$;

-- ===========================================================================
-- K. The append-only activity contract, and the audit trail.
-- ===========================================================================
do $$
declare c bigint; v_entity uuid;
begin
  -- Every RPC that changed something left exactly one timeline row per action,
  -- and every row names a real actor.
  select count(*) into c from public.owner_lead_activity where actor_user_id is null;
  if c <> 0 then raise exception 'TEST K1: % timeline rows have no actor', c; end if;

  -- The loss and the reopen are both on the timeline. There is no 'lead_won'
  -- row anywhere, because 70A cannot produce a won lead at all.
  select count(*) into c from public.owner_lead_activity
  where lead_id = crm_id('lead_b') and event_type = 'lead_lost';
  if c <> 1 then raise exception 'TEST K2: the loss is missing from the timeline (% rows)', c; end if;
  select count(*) into c from public.owner_lead_activity
  where lead_id = crm_id('lead_b') and event_type = 'stage_changed';
  if c < 1 then raise exception 'TEST K2b: the reopen is missing from the timeline'; end if;
  select count(*) into c from public.owner_lead_activity where event_type = 'lead_won';
  if c <> 0 then raise exception 'TEST K2c: a lead_won timeline row exists in 70A'; end if;

  -- The audit trigger resolved the business entity HONESTLY -- through the lead
  -- for owner_lead_integration_checks, which carries no business_entity_id and
  -- whose primary key is lead_id. The generic factory's `id` fallback would have
  -- written a row id into a foreign key here and failed, exactly as it did in
  -- production for the onboarding tables.
  select count(*) into c from public.owner_audit_log where resource_type = 'owner_lead_integration_checks';
  if c = 0 then raise exception 'TEST K3: no audit rows were written for the integration check'; end if;

  select business_entity_id into v_entity from public.owner_audit_log
  where resource_type = 'owner_lead_integration_checks' limit 1;
  if v_entity is null or not exists (select 1 from public.owner_business_entities where id = v_entity) then
    raise exception 'TEST K4: the audit trail recorded a business entity that does not exist (%)', v_entity;
  end if;

  -- Free-text sales columns never reach the audit log.
  if exists (select 1 from public.owner_audit_log
             where resource_type like 'owner_lead%'
               and (after_summary ? 'notes' or after_summary ? 'pain_points'
                    or after_summary ? 'lost_reason' or after_summary ? 'fallback_description')) then
    raise exception 'TEST K5: free-text sales content leaked into the audit log';
  end if;
end;
$$;

-- ===========================================================================
-- L. Proof that PR 70A modified NOTHING that already existed.
-- ===========================================================================
do $$
begin
  -- owner_customer_tasks: no lead_id, customer_id still NOT NULL.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'owner_customer_tasks' and column_name = 'lead_id') then
    raise exception 'TEST L1: owner_customer_tasks gained a lead_id column; that is out of scope for 70A';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'owner_customer_tasks'
               and column_name = 'customer_id' and is_nullable = 'YES') then
    raise exception 'TEST L2: owner_customer_tasks.customer_id lost its NOT NULL';
  end if;

  -- owner_offers: no lead provenance column.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'owner_offers' and column_name = 'owner_lead_id') then
    raise exception 'TEST L3: owner_offers gained owner_lead_id; offer provenance is a later phase';
  end if;
  if to_regprocedure('public.owner_link_offer_lead(uuid, uuid)') is not null then
    raise exception 'TEST L4: an offer<->lead linking RPC exists; offer provenance is a later phase';
  end if;

  -- No command center, no project architecture.
  if to_regprocedure('public.owner_command_center(uuid, date)') is not null then
    raise exception 'TEST L5: a command-center RPC exists; that is the Command Center phase';
  end if;
  if to_regclass('public.owner_projects') is not null then
    raise exception 'TEST L6: owner_projects exists; the project spine is a later phase';
  end if;
end;
$$;

-- ===========================================================================
-- Everything above ran against the real migration. Report.
-- ===========================================================================
do $$ begin raise notice 'owner CRM lead foundation: all assertions passed'; end $$;
