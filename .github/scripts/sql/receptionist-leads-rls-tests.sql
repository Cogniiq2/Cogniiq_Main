-- =============================================================================
-- Receptionist lead PII — RLS / grant boundary regression suite
-- =============================================================================
-- Runs against a throwaway database that has had the real phase-0 tenancy chain
-- and 20260730031350_create_cogniiq_receptionist_leads.sql applied, and NOTHING
-- else. This file then:
--   1. reproduces the Supabase default-privilege state the table really ships
--      with (anon/authenticated hold ALL), because a bare local `create table`
--      does NOT reproduce it -- hosted's exposure comes from `alter default
--      privileges in schema public grant all on tables to anon, authenticated`,
--      which no migration in this repository contains;
--   2. PROVES the exposure is real by exercising it as anon -- read, write and
--      TRUNCATE -- so the fix is measured against a demonstrated vulnerability
--      rather than an assumed one;
--   3. applies 20260902120000_receptionist_leads_pii_rls.sql;
--   4. proves the boundary holds for every role, against the live catalogs
--      (pg_class.relrowsecurity, pg_policies, information_schema grants) and by
--      real statement execution, not by reading migration source text;
--   5. proves the 50-row-equivalent fixture survived untouched;
--   6. replays the migration to prove idempotence.
-- =============================================================================

\set ON_ERROR_STOP on

do $$
declare
  v_owner uuid := gen_random_uuid();
  v_customer uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, email_confirmed_at) values
    (v_owner, 'owner@cogniiq.de', now()),
    (v_customer, 'customer@cogniiq.de', now());

  -- phase-0's signup trigger creates both as 'customer'; promote exactly one.
  update public.profiles set platform_role = 'cogniiq_owner' where id = v_owner;

  create table test_ids (k text primary key, v uuid);
  insert into test_ids values ('owner', v_owner), ('customer', v_customer);
end;
$$;

create or replace function test_id(p_key text) returns uuid
language sql stable as $$ select v from test_ids where k = p_key $$;

-- ---------------------------------------------------------------------------
-- Reproduce hosted's REAL pre-migration grant state.
-- ---------------------------------------------------------------------------
grant insert, select, update, delete, truncate, references, trigger
  on table public.cogniiq_receptionist_leads to anon, authenticated, service_role;
grant usage, select, update
  on sequence public.cogniiq_receptionist_leads_id_seq to anon, authenticated, service_role;

-- Fixture standing in for hosted's 50 rows. No real personal data: every value is
-- synthetic. Shapes match hosted (all status 'new', one sourced_date, country DE).
insert into public.cogniiq_receptionist_leads
  (practice_name, specialty, contact_person, city, street_address, postal_code,
   phone, email, website, google_rating, review_count, fit_notes, fit_score,
   outreach_channel, sourced_date, status)
select
  'Praxis ' || i, 'Allgemeinmedizin', 'Kontakt ' || i, 'Teststadt',
  'Teststrasse ' || i, lpad(i::text, 5, '0'),
  '+49 000 ' || lpad(i::text, 6, '0'), 'lead' || i || '@example.invalid',
  'https://example.invalid/praxis-' || i,
  4.2, 10 + i, 'synthetic fixture row', 70 + (i % 30),
  case when i % 2 = 0 then 'email' else 'phone' end,
  date '2026-07-30', 'new'
from generate_series(1, 50) as i;

-- ---------------------------------------------------------------------------
-- BEFORE: prove the exposure is real, exercised as anon.
-- ---------------------------------------------------------------------------
do $$
declare
  v_count bigint;
  v_id bigint;
begin
  if (select relrowsecurity from pg_class where oid = 'public.cogniiq_receptionist_leads'::regclass) then
    raise exception 'TEST SETUP FAILED: RLS is already enabled pre-migration; fixture does not reproduce hosted state';
  end if;

  set local role anon;

  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 50 then
    raise exception 'TEST SETUP FAILED: anon cannot read lead PII pre-migration (count=%)', v_count;
  end if;

  update public.cogniiq_receptionist_leads set status = 'anon-write-proof' where id = 1;
  if not found then
    raise exception 'TEST SETUP FAILED: anon UPDATE did not take effect pre-migration';
  end if;
  update public.cogniiq_receptionist_leads set status = 'new' where id = 1;

  insert into public.cogniiq_receptionist_leads (practice_name, website)
  values ('anon-insert-proof', 'https://example.invalid/anon-proof')
  returning id into v_id;
  delete from public.cogniiq_receptionist_leads where id = v_id;

  reset role;
end;
$$;

-- TRUNCATE is proven separately, in its own aborted subtransaction: it is the
-- privilege RLS would NOT have covered even once policies existed, so it is the
-- sharpest demonstration that the grant layer is doing the work here.
do $$
declare v_count bigint;
begin
  begin
    set local role anon;
    truncate table public.cogniiq_receptionist_leads;
    get diagnostics v_count = row_count;
    raise exception 'ANON_TRUNCATE_SUCCEEDED';
  exception
    when others then
      if sqlerrm <> 'ANON_TRUNCATE_SUCCEEDED' then
        raise exception 'TEST SETUP FAILED: anon TRUNCATE was refused pre-migration (%), fixture does not reproduce hosted grants', sqlerrm;
      end if;
  end;
  reset role;
  -- The raise rolled the truncate back; the fixture must be intact.
  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 50 then
    raise exception 'TEST SETUP FAILED: fixture lost after truncate probe (count=%)', v_count;
  end if;
end;
$$;

\echo 'BEFORE-migration exposure proven: anon could SELECT, UPDATE, INSERT and TRUNCATE lead PII.'

-- ---------------------------------------------------------------------------
-- Apply the migration under test.
-- ---------------------------------------------------------------------------
\ir ../../../supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql

-- ===========================================================================
-- 1. RLS is enabled; FORCE is deliberately not set.
-- ===========================================================================
do $$
declare
  v_rls boolean;
  v_force boolean;
  v_owner_bypass boolean;
begin
  select c.relrowsecurity, c.relforcerowsecurity
    into v_rls, v_force
  from pg_class c where c.oid = 'public.cogniiq_receptionist_leads'::regclass;

  if not v_rls then
    raise exception 'TEST FAILED: pg_class.relrowsecurity is false on cogniiq_receptionist_leads';
  end if;

  -- Asserted as an intentional decision, not an oversight. FORCE constrains only
  -- the table owner, and the owner carries BYPASSRLS (hosted `postgres` does),
  -- which defeats FORCE outright -- so setting it would change nobody's access
  -- while deviating from all 97 other RLS-enabled tables. If a future change
  -- means to adopt FORCE, it must do so deliberately and update this assertion.
  select r.rolbypassrls into v_owner_bypass
  from pg_class c join pg_roles r on r.oid = c.relowner
  where c.oid = 'public.cogniiq_receptionist_leads'::regclass;

  if v_force then
    raise exception 'TEST FAILED: relforcerowsecurity was set; this repository deliberately does not force RLS (owner bypassrls=%)', v_owner_bypass;
  end if;
end;
$$;

-- ===========================================================================
-- 2. Policy shape: exactly one, authenticated-only, owner-gated on BOTH clauses.
-- ===========================================================================
do $$
declare
  v_n integer;
  v_qual text;
  v_check text;
  v_roles text;
begin
  select count(*) into v_n from pg_policies
  where schemaname = 'public' and tablename = 'cogniiq_receptionist_leads';
  if v_n <> 1 then
    raise exception 'TEST FAILED: expected exactly 1 policy, found %', v_n;
  end if;

  select p.qual, p.with_check, array_to_string(p.roles, ',')
    into v_qual, v_check, v_roles
  from pg_policies p
  where p.schemaname = 'public' and p.tablename = 'cogniiq_receptionist_leads';

  if v_qual is null or v_qual not like '%is_platform_owner%' then
    raise exception 'TEST FAILED: policy USING clause is not gated on is_platform_owner(): %', v_qual;
  end if;
  if v_check is null or v_check not like '%is_platform_owner%' then
    raise exception 'TEST FAILED: policy WITH CHECK clause is not gated on is_platform_owner(): %', v_check;
  end if;
  if v_roles <> 'authenticated' then
    raise exception 'TEST FAILED: policy must apply to authenticated only, found roles=%', v_roles;
  end if;
end;
$$;

-- ===========================================================================
-- 3. FINAL GRANT MATRIX, read from information_schema rather than asserted.
--    anon: nothing. authenticated: SELECT/INSERT/UPDATE/DELETE and nothing more
--    (specifically NO TRUNCATE, NO REFERENCES). service_role: full CRUD.
-- ===========================================================================
do $$
declare
  v_privs text;
begin
  select coalesce(string_agg(distinct privilege_type, ',' order by privilege_type), '(none)')
    into v_privs
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'cogniiq_receptionist_leads' and grantee = 'anon';
  if v_privs <> '(none)' then
    raise exception 'TEST FAILED: anon still holds table privileges: %', v_privs;
  end if;

  select coalesce(string_agg(distinct privilege_type, ',' order by privilege_type), '(none)')
    into v_privs
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'cogniiq_receptionist_leads' and grantee = 'authenticated';
  if v_privs <> 'DELETE,INSERT,SELECT,UPDATE' then
    raise exception 'TEST FAILED: authenticated grant set is %, expected exactly DELETE,INSERT,SELECT,UPDATE', v_privs;
  end if;

  select coalesce(string_agg(distinct privilege_type, ',' order by privilege_type), '(none)')
    into v_privs
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'cogniiq_receptionist_leads' and grantee = 'service_role';
  if v_privs not like '%SELECT%' or v_privs not like '%INSERT%'
     or v_privs not like '%UPDATE%' or v_privs not like '%DELETE%' then
    raise exception 'TEST FAILED: service_role lost full CRUD, has: %', v_privs;
  end if;
end;
$$;

-- Explicit TRUNCATE assertion via has_table_privilege, because TRUNCATE is the
-- one privilege RLS cannot mitigate: if it ever comes back, policies will not
-- save the table.
do $$
begin
  if has_table_privilege('anon', 'public.cogniiq_receptionist_leads', 'TRUNCATE') then
    raise exception 'TEST FAILED: anon holds TRUNCATE -- RLS does not filter TRUNCATE, the table could be emptied wholesale';
  end if;
  if has_table_privilege('authenticated', 'public.cogniiq_receptionist_leads', 'TRUNCATE') then
    raise exception 'TEST FAILED: authenticated holds TRUNCATE -- RLS does not filter TRUNCATE';
  end if;
  if has_table_privilege('anon', 'public.cogniiq_receptionist_leads', 'REFERENCES') then
    raise exception 'TEST FAILED: anon holds REFERENCES on lead PII';
  end if;
  if has_table_privilege('authenticated', 'public.cogniiq_receptionist_leads', 'REFERENCES') then
    raise exception 'TEST FAILED: authenticated holds REFERENCES on lead PII';
  end if;
end;
$$;

-- Sequence is a separate securable; anon UPDATE on it means setval().
do $$
begin
  if has_sequence_privilege('anon', 'public.cogniiq_receptionist_leads_id_seq', 'USAGE')
     or has_sequence_privilege('anon', 'public.cogniiq_receptionist_leads_id_seq', 'SELECT')
     or has_sequence_privilege('anon', 'public.cogniiq_receptionist_leads_id_seq', 'UPDATE') then
    raise exception 'TEST FAILED: anon retains privileges on the identity sequence';
  end if;
  if has_sequence_privilege('authenticated', 'public.cogniiq_receptionist_leads_id_seq', 'UPDATE') then
    raise exception 'TEST FAILED: authenticated can setval() the identity sequence';
  end if;
end;
$$;

-- ===========================================================================
-- 4. anon is refused every operation, by real execution.
-- ===========================================================================
do $$
declare
  v_count bigint;
  v_sql text;
  v_ops text[] := array[
    'select count(*) from public.cogniiq_receptionist_leads',
    'update public.cogniiq_receptionist_leads set status = ''hacked'' where id = 1',
    'delete from public.cogniiq_receptionist_leads where id = 1',
    'insert into public.cogniiq_receptionist_leads (practice_name, website) values (''x'', ''https://x.invalid'')',
    'truncate table public.cogniiq_receptionist_leads'
  ];
begin
  foreach v_sql in array v_ops loop
    begin
      set local role anon;
      execute v_sql;
      reset role;
      raise exception 'TEST FAILED: anon was permitted: %', v_sql;
    exception
      when insufficient_privilege then
        reset role;
      when others then
        reset role;
        if sqlerrm like 'TEST FAILED:%' then raise; end if;
        -- Any other refusal is still a refusal, but must not be a silent success.
        if sqlerrm not like '%permission denied%' and sqlerrm not like '%row-level security%' then
          raise exception 'TEST FAILED: anon op "%" failed for an unexpected reason: %', v_sql, sqlerrm;
        end if;
    end;
  end loop;

  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 50 then
    raise exception 'TEST FAILED: fixture altered by anon attempts (count=%)', v_count;
  end if;
end;
$$;

\echo 'anon is refused SELECT, UPDATE, DELETE, INSERT and TRUNCATE.'

-- ===========================================================================
-- 5. An ordinary authenticated (non-owner) user reads nothing and mutates nothing.
--    Note the two distinct shapes: SELECT/UPDATE/DELETE are FILTERED by the USING
--    clause (0 rows, no error), while INSERT is REFUSED by WITH CHECK (an error).
--    Asserting "raises" for all five would pass for the wrong reason.
-- ===========================================================================
do $$
declare
  v_count bigint;
  v_affected bigint;
begin
  perform public.test_become(test_id('customer'));
  set local role authenticated;

  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 0 then
    raise exception 'TEST FAILED: ordinary authenticated user can read % lead rows', v_count;
  end if;

  update public.cogniiq_receptionist_leads set status = 'hacked';
  get diagnostics v_affected = row_count;
  if v_affected <> 0 then
    raise exception 'TEST FAILED: ordinary authenticated user updated % lead rows', v_affected;
  end if;

  delete from public.cogniiq_receptionist_leads;
  get diagnostics v_affected = row_count;
  if v_affected <> 0 then
    raise exception 'TEST FAILED: ordinary authenticated user deleted % lead rows', v_affected;
  end if;

  reset role;
  perform public.test_become(null);
end;
$$;

do $$
begin
  perform public.test_become(test_id('customer'));
  set local role authenticated;
  begin
    insert into public.cogniiq_receptionist_leads (practice_name, website)
    values ('customer-insert', 'https://example.invalid/customer-insert');
    reset role;
    raise exception 'TEST FAILED: ordinary authenticated user inserted a lead row';
  exception
    when insufficient_privilege then reset role;
    when others then
      reset role;
      if sqlerrm like 'TEST FAILED:%' then raise; end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'TEST FAILED: non-owner INSERT refused for an unexpected reason: %', sqlerrm;
      end if;
  end;
  perform public.test_become(null);
end;
$$;

\echo 'ordinary authenticated non-owner: 0 rows readable, 0 mutable, INSERT refused by WITH CHECK.'

-- ===========================================================================
-- 6. The platform owner CAN do the internal work the application requires,
--    including INSERT after the identity sequence was locked down.
-- ===========================================================================
do $$
declare
  v_count bigint;
  v_id bigint;
  v_affected bigint;
begin
  perform public.test_become(test_id('owner'));
  set local role authenticated;

  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 50 then
    raise exception 'TEST FAILED: platform owner reads % lead rows, expected 50', v_count;
  end if;

  -- INSERT proves the sequence REVOKE did not break identity generation.
  insert into public.cogniiq_receptionist_leads (practice_name, website, phone)
  values ('Owner Added Practice', 'https://example.invalid/owner-added', '+49 000 999999')
  returning id into v_id;
  if v_id is null then
    raise exception 'TEST FAILED: platform owner INSERT did not return an identity id';
  end if;

  update public.cogniiq_receptionist_leads set status = 'contacted' where id = v_id;
  get diagnostics v_affected = row_count;
  if v_affected <> 1 then
    raise exception 'TEST FAILED: platform owner UPDATE affected % rows', v_affected;
  end if;

  -- DELETE is granted on purpose: DSGVO Art. 17 erasure must not need service_role.
  delete from public.cogniiq_receptionist_leads where id = v_id;
  get diagnostics v_affected = row_count;
  if v_affected <> 1 then
    raise exception 'TEST FAILED: platform owner DELETE affected % rows', v_affected;
  end if;

  reset role;
  perform public.test_become(null);
end;
$$;

\echo 'platform owner retains full read/insert/update/delete on the internal surface.'

-- ===========================================================================
-- 7. Trusted service-role ingestion still works (BYPASSRLS + grants intact).
-- ===========================================================================
do $$
declare
  v_id bigint;
  v_count bigint;
begin
  set local role service_role;

  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 50 then
    raise exception 'TEST FAILED: service_role reads % lead rows, expected 50', v_count;
  end if;

  insert into public.cogniiq_receptionist_leads (practice_name, website, email)
  values ('Service Ingested Practice', 'https://example.invalid/service-ingest', 'ingest@example.invalid')
  returning id into v_id;

  update public.cogniiq_receptionist_leads set status = 'qualified' where id = v_id;
  delete from public.cogniiq_receptionist_leads where id = v_id;

  reset role;
end;
$$;

\echo 'service_role ingestion path unaffected.'

-- ===========================================================================
-- 8. The pre-existing rows are byte-for-byte untouched by the migration.
-- ===========================================================================
do $$
declare
  v_count bigint;
  v_ids text;
  v_statuses bigint;
begin
  select count(*), string_agg(id::text, ',' order by id) into v_count, v_ids
  from public.cogniiq_receptionist_leads;

  if v_count <> 50 then
    raise exception 'TEST FAILED: expected the original 50 rows, found %', v_count;
  end if;
  if v_ids <> (select string_agg(i::text, ',' order by i) from generate_series(1, 50) as i) then
    raise exception 'TEST FAILED: the original id range 1..50 was not preserved';
  end if;

  select count(*) into v_statuses from public.cogniiq_receptionist_leads
  where status <> 'new' or sourced_date <> date '2026-07-30' or country <> 'DE';
  if v_statuses <> 0 then
    raise exception 'TEST FAILED: % pre-existing rows had their content changed', v_statuses;
  end if;
end;
$$;

-- ===========================================================================
-- 9. Idempotent replay: applying the migration again changes nothing.
-- ===========================================================================
\ir ../../../supabase/migrations/20260902120000_receptionist_leads_pii_rls.sql

do $$
declare
  v_n integer;
  v_count bigint;
  v_privs text;
begin
  select count(*) into v_n from pg_policies
  where schemaname = 'public' and tablename = 'cogniiq_receptionist_leads';
  if v_n <> 1 then
    raise exception 'TEST FAILED (replay): expected exactly 1 policy, found %', v_n;
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.cogniiq_receptionist_leads'::regclass) then
    raise exception 'TEST FAILED (replay): RLS was turned off';
  end if;

  select coalesce(string_agg(distinct privilege_type, ',' order by privilege_type), '(none)')
    into v_privs
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'cogniiq_receptionist_leads' and grantee = 'anon';
  if v_privs <> '(none)' then
    raise exception 'TEST FAILED (replay): anon regained privileges: %', v_privs;
  end if;

  select count(*) into v_count from public.cogniiq_receptionist_leads;
  if v_count <> 50 then
    raise exception 'TEST FAILED (replay): row count changed to %', v_count;
  end if;
end;
$$;

\echo 'migration replay is idempotent; boundary and data unchanged.'
\echo 'receptionist-leads RLS suite: ALL PASSED'
