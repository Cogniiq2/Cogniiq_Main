-- Client onboarding bridge (20261124120000) — authorization, workflow and regression tests.
-- Runs ONLY on the throwaway cluster booted by run-client-onboarding-bridge-sql-tests.sh, with
-- Supabase-equivalent default privileges emulated. Never run against production.
\set ON_ERROR_STOP 1

-- ---------------------------------------------------------------------------------------------
-- Fixtures (as the migration owner, acting as the platform owner for audit triggers)
-- ---------------------------------------------------------------------------------------------
-- The hosted auth.users table has last_sign_in_at; the local shim does not. Mirror it.
alter table auth.users add column if not exists last_sign_in_at timestamptz;
update public.profiles set platform_role = 'cogniiq_owner' where id = '00000000-0000-0000-0000-000000000901';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', false);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000905', 'member-a@kunde-a.test', now()),
  ('00000000-0000-0000-0000-000000000906', 'viewer-a@kunde-a.test', now()),
  ('00000000-0000-0000-0000-000000000907', 'member-b@kunde-b.test', now()),
  ('00000000-0000-0000-0000-000000000908', 'both@beide.test', now())
on conflict (id) do nothing;

create temp table fx(k text primary key, id uuid);
grant select, insert on fx to anon, authenticated, service_role;

do $$
declare v_e uuid; org_a uuid; org_b uuid; org_free uuid; cust_a uuid; cust_b uuid; cust_c uuid;
  r jsonb; eng_a uuid; eng_b uuid;
begin
  select id into v_e from public.owner_business_entities where slug = 'cogniiq';
  insert into public.organizations (name, status) values ('Praxis A', 'active') returning id into org_a;
  insert into public.organizations (name, status) values ('Praxis B', 'active') returning id into org_b;
  insert into public.organizations (name, status) values ('Freie Organisation', 'active') returning id into org_free;
  insert into public.organization_members (organization_id, user_id, role, status) values
    (org_a, '00000000-0000-0000-0000-000000000905', 'member', 'active'),
    (org_a, '00000000-0000-0000-0000-000000000906', 'viewer', 'active'),
    (org_b, '00000000-0000-0000-0000-000000000907', 'member', 'active'),
    (org_a, '00000000-0000-0000-0000-000000000908', 'member', 'active'),
    (org_b, '00000000-0000-0000-0000-000000000908', 'member', 'active');

  insert into public.owner_customers (business_entity_id, company, contact_name, email, phone, street, postal_code, city, status, organization_id)
  values (v_e, 'Praxis A GmbH', 'Anna Kunde', 'kontakt@kunde-a.test', '+49 921 111111', 'Teststraße 1', '95444', 'Bayreuth', 'active', org_a)
  returning id into cust_a;
  insert into public.owner_customers (business_entity_id, company, email, status, organization_id)
  values (v_e, 'Praxis B GmbH', 'kontakt@kunde-b.test', 'active', org_b) returning id into cust_b;
  insert into public.owner_customers (business_entity_id, company, email, status)
  values (v_e, 'Ohne Portal GmbH', 'kontakt@kunde-c.test', 'active') returning id into cust_c;

  r := public.owner_add_customer_service(gen_random_uuid(), cust_a, 'ai_receptionist');
  r := public.owner_add_customer_service(gen_random_uuid(), cust_b, 'ai_receptionist');
  r := public.owner_add_customer_service(gen_random_uuid(), cust_c, 'ai_receptionist');
  select id into eng_a from public.owner_service_engagements where customer_id = cust_a;
  select id into eng_b from public.owner_service_engagements where customer_id = cust_b;

  insert into fx values ('org_a', org_a), ('org_b', org_b), ('org_free', org_free), ('cust_a', cust_a),
    ('cust_b', cust_b), ('cust_c', cust_c), ('eng_a', eng_a), ('eng_b', eng_b),
    ('eng_c', (select id from public.owner_service_engagements where customer_id = cust_c));
  if (select count(*) from public.owner_engagement_fields where engagement_id = eng_a) <> 132 then
    raise exception 'FIXTURE: engagement A should have the 132 template fields';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- T1. Grant matrix under Supabase default privileges
-- ---------------------------------------------------------------------------------------------
do $$
declare r record; bad text[] := '{}';
begin
  for r in select p.oid::regprocedure sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'client\_onboarding\_%' or p.proname like 'owner\_onboarding\_%'
             or p.proname in ('service_onboarding_complete_send', 'owner_link_customer_organization')) loop
    if has_function_privilege('anon', r.sig, 'execute') then bad := bad || ('anon:' || r.sig::text); end if;
    if r.proname in ('client_onboarding_normalize_answer', 'client_onboarding_answer_text', 'client_onboarding_authorize',
                     'client_onboarding_ensure_intake', 'client_onboarding_milestones', 'service_onboarding_complete_send')
       and has_function_privilege('authenticated', r.sig, 'execute') then bad := bad || ('authenticated:' || r.sig::text); end if;
  end loop;
  for r in select unnest(array['client_onboarding_questions', 'client_onboarding_intakes', 'client_onboarding_answers',
      'client_onboarding_requests', 'client_onboarding_invitations', 'client_onboarding_messages']) t loop
    if has_table_privilege('anon', 'public.' || r.t, 'select') or has_table_privilege('authenticated', 'public.' || r.t, 'select')
       or has_table_privilege('authenticated', 'public.' || r.t, 'insert') or has_table_privilege('authenticated', 'public.' || r.t, 'update') then
      bad := bad || ('table:' || r.t);
    end if;
  end loop;
  if cardinality(bad) > 0 then raise exception 'FAIL T1: %', bad; end if;
  raise notice 'PASS T1: no anon access, internal helpers and tables closed to browser roles';
end $$;

-- ---------------------------------------------------------------------------------------------
-- T2. Anonymous caller is refused
-- ---------------------------------------------------------------------------------------------
begin;
set local role anon;
do $$ begin
  begin perform public.client_onboarding_list(); raise exception 'FAIL T2: anon listed';
  exception when insufficient_privilege then null; end;
  begin perform public.client_onboarding_get((select id from fx where k = 'eng_a')); raise exception 'FAIL T2: anon read';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS T2: anonymous callers are refused';
end $$;
commit;

-- Helper to run a block as a given user.
create or replace function pg_temp.as_user(p_uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_uid, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- T3. Authenticated non-member sees nothing and cannot read by id
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000903');
do $$ begin
  if jsonb_array_length(public.client_onboarding_list()) <> 0 then raise exception 'FAIL T3: non-member listed engagements'; end if;
  begin perform public.client_onboarding_get((select id from fx where k = 'eng_a')); raise exception 'FAIL T3: non-member read';
  exception when insufficient_privilege then null; end;
  begin perform public.client_onboarding_get(gen_random_uuid()); raise exception 'FAIL T3: forged id readable';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS T3: non-members get an empty list and the same refusal for real and forged ids';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T4. Member of A: list, read, prefill, healthcare filter
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare l jsonb; g jsonb; begin
  l := public.client_onboarding_list();
  if jsonb_array_length(l) <> 1 or (l->0->>'engagement_id')::uuid <> (select id from fx where k = 'eng_a') then
    raise exception 'FAIL T4: member A must see exactly engagement A, got %', l;
  end if;
  g := public.client_onboarding_get((select id from fx where k = 'eng_a'));
  if g->'prefill'->>'company_name' <> 'Praxis A GmbH' then raise exception 'FAIL T4: prefill missing: %', g->'prefill'; end if;
  if g->'prefill'->>'locations' <> 'Teststraße 1, 95444 Bayreuth' then raise exception 'FAIL T4: address prefill %', g->'prefill'->>'locations'; end if;
  if exists (select 1 from jsonb_array_elements(g->'questions') q where q->>'code' = 'medical_info_limits') then
    raise exception 'FAIL T4: healthcare-only question shown to a non-healthcare engagement';
  end if;
  if g::text ~* '(task|blocker|integration_mode|summary|provider)' then
    raise exception 'FAIL T4: internal engagement data leaked to the customer';
  end if;
  if (g->>'can_edit')::boolean is not true then raise exception 'FAIL T4: member should be able to edit'; end if;
  raise notice 'PASS T4: member sees only their engagement, prefill works, no internal data exposed';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T5. Saving: validation, concurrency, unknown/healthcare questions; data survives a failed save
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  r := public.client_onboarding_save(e, '{"company_name":"Praxis A GmbH","main_contact":"Anna Kunde, Praxismanagerin"}', 0, 'business');
  if (r->>'version')::int <> 1 then raise exception 'FAIL T5: version should be 1, got %', r; end if;
  begin perform public.client_onboarding_save(e, '{"public_phone":"abc"}', 1); raise exception 'FAIL T5: bad phone accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin perform public.client_onboarding_save(e, '{"website":"javascript:alert(1)"}', 1); raise exception 'FAIL T5: bad url accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin perform public.client_onboarding_save(e, '{"company_name":"X"}', 0); raise exception 'FAIL T5: stale version accepted';
  exception when serialization_failure then null; end;
  begin perform public.client_onboarding_save(e, '{"not_a_question":"x"}', 1); raise exception 'FAIL T5: unknown question accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin perform public.client_onboarding_save(e, '{"medical_info_limits":"x"}', 1); raise exception 'FAIL T5: healthcare-only accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin perform public.client_onboarding_save(e, '{"caller_tone":"rude"}', 1); raise exception 'FAIL T5: invalid choice accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin perform public.client_onboarding_save(e, '{"opening_hours":{"mon":{"closed":false,"ranges":[["12:00","08:00"]]}}}', 1);
    raise exception 'FAIL T5: inverted hours accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  if (public.client_onboarding_get(e)->'answers'->'company_name'->>'value') <> 'Praxis A GmbH' then
    raise exception 'FAIL T5: a failed save lost earlier answers';
  end if;
  raise notice 'PASS T5: server validation, optimistic concurrency and no data loss on failed saves';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T6. Viewer can read but not write; T7. cross-tenant and two-organization user
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000906');
do $$ begin
  perform public.client_onboarding_get((select id from fx where k = 'eng_a'));
  begin perform public.client_onboarding_save((select id from fx where k = 'eng_a'), '{"website":"https://a.test"}', 1);
    raise exception 'FAIL T6: viewer wrote';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS T6: viewer reads but cannot write';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000907');
do $$ begin
  begin perform public.client_onboarding_get((select id from fx where k = 'eng_a')); raise exception 'FAIL T7: tenant B read A';
  exception when insufficient_privilege then null; end;
  begin perform public.client_onboarding_save((select id from fx where k = 'eng_a'), '{"website":"https://x.test"}', 1);
    raise exception 'FAIL T7: tenant B wrote A';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS T7: another organization cannot read or write';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000908');
do $$ begin
  if jsonb_array_length(public.client_onboarding_list()) <> 2 then raise exception 'FAIL T7b: two-org member should see both'; end if;
  raise notice 'PASS T7b: a member of two organizations sees exactly both engagements';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T8. Customers cannot reach owner RPCs, service RPCs or engagement fields
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); n int; begin
  begin perform public.owner_onboarding_detail(e); raise exception 'FAIL T8: customer read owner detail';
  exception when others then if sqlerrm not like '%Owner access required%' then raise; end if; end;
  begin perform public.owner_onboarding_review(e, '[{"code":"company_name","action":"approve"}]'); raise exception 'FAIL T8: customer approved';
  exception when others then if sqlerrm not like '%Owner access required%' then raise; end if; end;
  begin perform public.owner_onboarding_begin_send(e, 'invitation', 'x@y.test', null, 'de', 'Betreff', null, false, gen_random_uuid());
    raise exception 'FAIL T8: customer sent mail';
  exception when others then if sqlerrm not like '%Owner access required%' then raise; end if; end;
  begin perform public.service_onboarding_complete_send(gen_random_uuid(), true, 'x', null); raise exception 'FAIL T8: customer completed send';
  exception when insufficient_privilege then null; end;
  begin perform public.owner_set_engagement_status(e, 'live'); raise exception 'FAIL T8: customer changed lifecycle';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin
    update public.owner_engagement_fields set value_text = 'hacked' where engagement_id = e and code = 'WFL-F004';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL T8: customer updated an engagement field directly'; end if;
  exception when insufficient_privilege then null;  -- even stronger: no table privilege at all
  end;
  raise notice 'PASS T8: owner/service RPCs, lifecycle and engagement fields are out of the customer''s reach';
end $$;
commit;

-- Approve decisions carry the exact value the owner saw (expected_value).
create or replace function pg_temp.approve(p_engagement uuid, p_code text) returns jsonb language sql as $f$
  select jsonb_build_object('code', p_code, 'action', 'approve',
    'expected_value', public.owner_onboarding_detail(p_engagement)->'answers'->p_code->'value');
$f$;

-- ---------------------------------------------------------------------------------------------
-- T8c. Lifecycle: nothing is reviewable before the customer submits (drafts exist from T5)
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); begin
  if public.owner_onboarding_detail(e)->'answers'->'company_name' is null then raise exception 'FAIL T8c: fixture has no draft'; end if;
  begin perform public.owner_onboarding_review(e, jsonb_build_array(pg_temp.approve(e, 'company_name')));
    raise exception 'FAIL T8c: a draft answer was approved before submission';
  exception when others then if sqlerrm not like '%noch nicht übermittelt%' then raise; end if; end;
  begin perform public.owner_onboarding_review(e, '[{"code":"company_name","action":"request_changes","comment":"x"}]');
    raise exception 'FAIL T8c: changes requested on a draft before submission';
  exception when others then if sqlerrm not like '%noch nicht übermittelt%' then raise; end if; end;
  if exists (select 1 from public.owner_engagement_fields where engagement_id = e and code = 'PRO-F001' and value_text is not null) then
    raise exception 'FAIL T8c: a draft reached an engagement field';
  end if;
  raise notice 'PASS T8c: review is refused until the customer submits';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T9. Fill, submit (missing required → refused), duplicate submit, edit after submit refused
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); v int; r jsonb; begin
  v := (public.client_onboarding_get(e)->'intake'->>'version')::int;
  begin perform public.client_onboarding_submit(e, v); raise exception 'FAIL T9: incomplete submit accepted';
  exception when others then if sqlerrm not like '%Pflichtangaben%' then raise; end if; end;
  r := public.client_onboarding_save(e, jsonb_build_object(
    'industry', 'Zahnarztpraxis', 'locations', 'Teststraße 1, 95444 Bayreuth', 'public_phone', '+49 921 111111',
    'languages', '["Deutsch","Englisch"]'::jsonb,
    'opening_hours', '{"mon":{"closed":false,"ranges":[["08:00","12:00"],["14:00","18:00"]]},"sun":{"closed":true,"ranges":[]}}'::jsonb,
    'services_offered', 'Prophylaxe, Füllungen', 'common_inquiries', 'Terminwunsch', 'caller_tone', 'warm',
    'scheduling_software', 'Doctolib', 'appointment_types', 'Kontrolle – 20 Minuten',
    'desired_capabilities', '["faq","callback"]'::jsonb, 'faq', 'Parkplätze? – Ja.', 'uncertain_handling', 'callback',
    'reception_phone', '+49 921 222222', 'transfer_hours', 'Mo–Fr 08:00–17:00',
    'no_answer_behavior', 'Rückrufbitte aufnehmen', 'after_hours', 'Öffnungszeiten nennen',
    'urgent_handling', 'Bei Notfällen auf 112 hinweisen'), v, 'review');
  v := (r->>'version')::int;
  r := public.client_onboarding_submit(e, v);
  if r->>'status' <> 'submitted' or (r->>'already')::boolean then raise exception 'FAIL T9: submit %', r; end if;
  r := public.client_onboarding_submit(e, v);
  if not (r->>'already')::boolean then raise exception 'FAIL T9: duplicate submit not idempotent'; end if;
  begin perform public.client_onboarding_save(e, '{"website":"https://a.test"}', v + 1); raise exception 'FAIL T9: edit after submit';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  raise notice 'PASS T9: required check, idempotent submit, no edits after submission';
end $$;
commit;

do $$ declare e uuid := (select id from fx where k = 'eng_a'); begin
  if (select value_text from public.owner_engagement_fields where engagement_id = e and code = 'WFL-F004') is not null
     or (select value_text from public.owner_engagement_fields where engagement_id = e and code = 'PRO-F001') is not null then
    raise exception 'FAIL T9b: a customer submission changed canonical engagement fields';
  end if;
  if exists (select 1 from public.owner_engagement_tasks where engagement_id = e and status = 'complete') then
    raise exception 'FAIL T9b: a submission completed tasks';
  end if;
  raise notice 'PASS T9b: submission alone changes no engagement field and completes no task';
end $$;

-- ---------------------------------------------------------------------------------------------
-- T10. Owner review: approve → field written via existing RPC; request changes; blockers intact
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; d jsonb; begin
  d := public.owner_onboarding_detail(e);
  if d->'intake'->>'status' <> 'submitted' then raise exception 'FAIL T10: owner sees status %', d->'intake'->>'status'; end if;
  if (d->'answers'->'company_name'->>'updated_by_email') <> 'member-a@kunde-a.test' then
    raise exception 'FAIL T10: submitter not attributed';
  end if;
  begin perform public.owner_onboarding_review(e, '[{"code":"faq","action":"request_changes"}]');
    raise exception 'FAIL T10: change request without explanation accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin perform public.owner_onboarding_review(e, '[{"code":"company_name","action":"approve"}]');
    raise exception 'FAIL T10: approval without the reviewed value accepted';
  exception when serialization_failure then null; end;
  begin perform public.owner_onboarding_review(e, '[{"code":"company_name","action":"approve","expected_value":"Etwas anderes"}]');
    raise exception 'FAIL T10: approval of a value the owner did not see accepted';
  exception when serialization_failure then null; end;
  r := public.owner_onboarding_review(e, jsonb_build_array(
    pg_temp.approve(e, 'company_name'), pg_temp.approve(e, 'urgent_handling'),
    pg_temp.approve(e, 'languages'), pg_temp.approve(e, 'opening_hours'),
    '{"code":"faq","action":"request_changes","comment":"Bitte ergänzen Sie die Frage nach Rezepten."}'::jsonb));
  if (r->>'approved')::int <> 4 or (r->>'changes_requested')::int <> 1 then raise exception 'FAIL T10: review result %', r; end if;
  if (r->>'intake_status') <> 'changes_requested' then raise exception 'FAIL T10: intake status %', r->>'intake_status'; end if;
  if (select value_text from public.owner_engagement_fields where engagement_id = e and code = 'PRO-F001') <> 'Praxis A GmbH' then
    raise exception 'FAIL T10: approved answer not written to PRO-F001';
  end if;
  if (select value_text from public.owner_engagement_fields where engagement_id = e and code = 'PRO-F011') <> 'Deutsch, Englisch' then
    raise exception 'FAIL T10: multi-choice not rendered into PRO-F011';
  end if;
  if (r->'go_live'->>'ready')::boolean then raise exception 'FAIL T10: go-live became ready from customer data'; end if;
  if not exists (select 1 from public.owner_engagement_activity where engagement_id = e and event_type = 'client_intake_reviewed') then
    raise exception 'FAIL T10: review not audited';
  end if;
  r := public.owner_onboarding_review(e, jsonb_build_array(pg_temp.approve(e, 'company_name')));
  if (r->>'approved')::int <> 0 then raise exception 'FAIL T10: re-approval not idempotent'; end if;
  raise notice 'PASS T10: explicit approval writes fields through the canonical RPC; go-live gate unaffected';
end $$;
commit;

-- Customer can fix the requested answer, cannot alter an approved one, and resubmit.
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); g jsonb; v int; r jsonb; begin
  g := public.client_onboarding_get(e);
  if g->'answers'->'faq'->>'owner_comment' is null then raise exception 'FAIL T11: customer cannot see the request'; end if;
  v := (g->'intake'->>'version')::int;
  begin perform public.client_onboarding_save(e, '{"company_name":"Andere GmbH"}', v); raise exception 'FAIL T11: approved answer changed';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  r := public.client_onboarding_save(e, '{"faq":"Parkplätze? – Ja. Rezepte? – Bitte per Telefon bestellen."}', v);
  r := public.client_onboarding_submit(e, (r->>'version')::int);
  if r->>'status' <> 'submitted' then raise exception 'FAIL T11: resubmit %', r; end if;
  raise notice 'PASS T11: changes-requested loop works; approved facts are locked for the customer';
end $$;
commit;

-- T11b. Partial review during rework, drafts never reviewable, resubmission reviewable, stale
-- values refused. (faq was resubmitted in T11.)
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  r := public.owner_onboarding_review(e, '[{"code":"services_offered","action":"request_changes","comment":"Bitte genauer."}]');
  if r->>'intake_status' <> 'changes_requested' then raise exception 'FAIL T11b: status %', r->>'intake_status'; end if;
end $$;
commit;
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); v int; begin
  v := (public.client_onboarding_get(e)->'intake'->>'version')::int;
  perform public.client_onboarding_save(e, '{"services_offered":"Prophylaxe, Füllungen, Implantologie"}', v);
end $$;
commit;
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  -- the customer's unsent rework is a draft: not reviewable
  begin perform public.owner_onboarding_review(e, jsonb_build_array(pg_temp.approve(e, 'services_offered')));
    raise exception 'FAIL T11b: a draft under rework was approved';
  exception when others then if sqlerrm not like '%noch nicht (erneut) übermittelt%' then raise; end if; end;
  -- other submitted answers stay reviewable while the customer reworks one (partial review)
  r := public.owner_onboarding_review(e, jsonb_build_array(pg_temp.approve(e, 'industry'), pg_temp.approve(e, 'faq')));
  if (r->>'approved')::int <> 2 then raise exception 'FAIL T11b: partial review %', r; end if;
  if r->>'intake_status' <> 'changes_requested' then raise exception 'FAIL T11b: partial review changed status to %', r->>'intake_status'; end if;
end $$;
commit;
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); v int; r jsonb; begin
  v := (public.client_onboarding_get(e)->'intake'->>'version')::int;
  r := public.client_onboarding_submit(e, v);
  if r->>'status' <> 'submitted' then raise exception 'FAIL T11b: resubmit %', r; end if;
  if public.client_onboarding_get(e)->'answers'->'faq'->>'status' <> 'approved' then
    raise exception 'FAIL T11b: resubmission reset an approved answer';
  end if;
end $$;
commit;
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  r := public.owner_onboarding_review(e, jsonb_build_array(pg_temp.approve(e, 'services_offered')));
  if (r->>'approved')::int <> 1 then raise exception 'FAIL T11b: resubmitted answer not reviewable'; end if;
  raise notice 'PASS T11b: partial review, rework drafts refused, resubmission reviewable, stale values refused';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T12. Targeted requests
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); t uuid; r jsonb; begin
  select id into t from public.owner_engagement_tasks where engagement_id = e order by sort_order limit 1;
  r := public.owner_onboarding_create_request(e, 'An welche Nummer sollen dringende Anrufe außerhalb der Öffnungszeiten gehen?', 'urgent_contact', t);
  insert into fx values ('req', (r->>'id')::uuid);
  if (select status from public.owner_engagement_tasks where id = t) <> 'waiting_for_client' then
    raise exception 'FAIL T12: linked task not set to waiting_for_client';
  end if;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000907');
do $$ begin
  begin perform public.client_onboarding_respond_request((select id from fx where k = 'req'), 'hack'); raise exception 'FAIL T12: other tenant answered';
  exception when insufficient_privilege then null; end;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000905');
do $$ declare g jsonb; begin
  g := public.client_onboarding_get((select id from fx where k = 'eng_a'));
  if jsonb_array_length(g->'requests') <> 1 then raise exception 'FAIL T12: customer does not see the request'; end if;
  perform public.client_onboarding_respond_request((select id from fx where k = 'req'), '+49 921 999999, Mo–So 18–22 Uhr');
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare d jsonb; begin
  d := public.owner_onboarding_detail((select id from fx where k = 'eng_a'));
  if d->'requests'->0->>'status' <> 'answered' then raise exception 'FAIL T12: owner does not see the answer'; end if;
  perform public.owner_onboarding_close_request((select id from fx where k = 'req'), 'accepted');
  raise notice 'PASS T12: request → customer answer → owner acceptance, tenant-isolated';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T13. Sending: recipient validation, idempotency, rate limit, test, unlinked customer
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); v_key uuid := gen_random_uuid(); r jsonb; r2 jsonb; i int; begin
  begin perform public.owner_onboarding_begin_send(e, 'invitation', 'fremd@andere.test', null, 'de', 'Ihr Projektstart', null, false, gen_random_uuid());
    raise exception 'FAIL T13: foreign recipient accepted';
  exception when others then if sqlerrm not like '%gehört nicht zu den Kontakten%' then raise; end if; end;
  begin perform public.owner_onboarding_begin_send(e, 'invitation', 'member-b@kunde-b.test', null, 'de', 'Ihr Projektstart', null, false, gen_random_uuid());
    raise exception 'FAIL T13: other tenant''s member accepted as recipient';
  exception when others then if sqlerrm not like '%gehört nicht zu den Kontakten%' then raise; end if; end;
  r := public.owner_onboarding_begin_send(e, 'invitation', 'Kontakt@Kunde-A.test', 'Anna Kunde', 'de', 'Ihr Projektstart mit Cogniiq – Praxis A', null, false, v_key);
  r2 := public.owner_onboarding_begin_send(e, 'invitation', 'kontakt@kunde-a.test', 'Anna Kunde', 'de', 'Ihr Projektstart mit Cogniiq – Praxis A', null, false, v_key);
  if not (r2->>'replay')::boolean or r2->>'message_id' <> r->>'message_id' then raise exception 'FAIL T13: replay produced a second message'; end if;
  if jsonb_array_length(public.owner_onboarding_detail(e)->'messages') <> 1 then raise exception 'FAIL T13: duplicate message rows'; end if;
  if not exists (select 1 from public.client_invitations where email = 'kontakt@kunde-a.test' and status = 'pending'
                 and organization_id = (select id from fx where k = 'org_a') and organization_role = 'member') then
    raise exception 'FAIL T13: portal invitation not prepared through client_invitations';
  end if;
  insert into fx values ('msg', (r->>'message_id')::uuid);
  if not (r->>'portal_invitation_pending')::boolean or (r->>'is_member')::boolean then
    raise exception 'FAIL T13: non-member invitation must allow an activation link';
  end if;
  -- an already-active member gets no new portal invitation and no activation link
  r := public.owner_onboarding_begin_send(e, 'invitation', 'member-a@kunde-a.test', null, 'de', 'Ihr Projektstart', null, false, gen_random_uuid());
  if (r->>'portal_invitation_pending')::boolean or not (r->>'is_member')::boolean then
    raise exception 'FAIL T13: active member must get the login link, not an activation link';
  end if;
  if exists (select 1 from public.client_invitations where email = 'member-a@kunde-a.test') then
    raise exception 'FAIL T13: active member got a duplicate portal invitation';
  end if;
  r := public.owner_onboarding_begin_send(e, 'invitation', 'member-b@kunde-b.test', null, 'de', 'Test', null, true, gen_random_uuid());
  if r->>'recipient_email' <> 'owner@x.test' then raise exception 'FAIL T13: test mail not forced to the owner: %', r->>'recipient_email'; end if;
  for i in 1..3 loop
    perform public.owner_onboarding_begin_send(e, 'reminder', 'kontakt@kunde-a.test', null, 'de', 'Erinnerung', null, false, gen_random_uuid());
  end loop;
  begin perform public.owner_onboarding_begin_send(e, 'reminder', 'kontakt@kunde-a.test', null, 'de', 'Erinnerung', null, false, gen_random_uuid());
    raise exception 'FAIL T13: rate limit not enforced';
  exception when others then if sqlerrm not like '%Zu viele Nachrichten%' then raise; end if; end;
  begin perform public.owner_onboarding_begin_send((select id from fx where k = 'eng_c'), 'invitation', 'kontakt@kunde-c.test', null, 'de', 'Start', null, false, gen_random_uuid());
    raise exception 'FAIL T13: unlinked customer invited';
  exception when others then if sqlerrm not like '%keiner Portal-Organisation%' then raise; end if; end;
  -- test sends never mint activation links
  if (public.owner_onboarding_begin_send(e, 'invitation', null, null, 'de', 'Test 2', null, true, gen_random_uuid())
        ->>'portal_invitation_pending')::boolean then
    raise exception 'FAIL T13: test send allowed an activation link';
  end if;
  raise notice 'PASS T13: recipients validated server-side, idempotent, rate-limited; tests go to the owner';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T14. Provider result is service-role only and idempotent; owner cannot forge it
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ begin
  begin perform public.service_onboarding_complete_send((select id from fx where k = 'msg'), true, 'fake', null);
    raise exception 'FAIL T14: owner browser forged a provider result';
  exception when insufficient_privilege then null; end;
end $$;
commit;
begin;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$ declare r jsonb; begin
  r := public.service_onboarding_complete_send((select id from fx where k = 'msg'), true, 're_123', null);
  r := public.service_onboarding_complete_send((select id from fx where k = 'msg'), false, null, 'late_failure');
  if not (r->>'already')::boolean then raise exception 'FAIL T14: accepted message was overwritten by a later failure'; end if;
  raise notice 'PASS T14: only the service role records provider results; accepted is final';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T15. Claim compatibility (new user) and revocation
-- ---------------------------------------------------------------------------------------------
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-0000-0000-000000000909', 'kontakt@kunde-a.test', now());
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000909');
do $$ begin
  perform public.claim_my_client_invitations();
  if jsonb_array_length(public.client_onboarding_list()) <> 1 then
    raise exception 'FAIL T15: invited contact does not reach the engagement after the existing claim flow';
  end if;
  raise notice 'PASS T15: the existing claim flow grants access; no new account mechanism';
end $$;
commit;
-- age out the hourly rate limit (as the migration owner; the table is RPC-only)
update public.client_onboarding_messages set created_at = created_at - interval '2 days'
 where engagement_id = (select id from fx where k = 'eng_a');
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare inv uuid; e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  insert into public.client_invitations (organization_id, email, organization_role, status, expires_at)
  values ((select id from fx where k = 'org_a'), 'spaeter@kunde-a.test', 'member', 'pending', now() + interval '1 day');
  r := public.owner_onboarding_begin_send(e, 'invitation', 'spaeter@kunde-a.test', null, 'de', 'Start', null, false, gen_random_uuid());
  select (x->>'id')::uuid into inv from jsonb_array_elements(public.owner_onboarding_detail(e)->'invitations') x
   where x->>'recipient_email' = 'spaeter@kunde-a.test' and x->>'status' = 'active';
  r := public.owner_onboarding_revoke_invitation(inv);
  if (select status from public.client_invitations where email = 'spaeter@kunde-a.test') <> 'revoked' then
    raise exception 'FAIL T15b: pending portal invitation not revoked';
  end if;
  r := public.owner_onboarding_revoke_invitation(inv);
  if not (r->>'already')::boolean then raise exception 'FAIL T15b: revoke not idempotent'; end if;
  raise notice 'PASS T15b: revocation withdraws the pending portal invitation, idempotently';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T13b. Fresh activation links: designated test mailbox via client contacts, repeated invitations
--       reuse ONE portal invitation, account state drives the link type, link expiry is recorded
--       separately from the 30-day invitation, and claiming never duplicates memberships.
-- ---------------------------------------------------------------------------------------------
update public.client_onboarding_messages set created_at = created_at - interval '2 days'
 where engagement_id = (select id from fx where k = 'eng_a');
insert into public.client_contacts (organization_id, name, email) values
  ((select id from fx where k = 'org_a'), 'Cogniiq Testpostfach', 'Testpostfach@Cogniiq.test'),
  ((select id from fx where k = 'org_b'), 'Fremder Kontakt', 'fremdkontakt@kunde-b.test');
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; r2 jsonb; begin
  begin perform public.owner_onboarding_begin_send(e, 'invitation', 'fremdkontakt@kunde-b.test', null, 'de', 'Start', null, false, gen_random_uuid());
    raise exception 'FAIL T13b: another organization''s contact accepted';
  exception when others then if sqlerrm not like '%gehört nicht zu den Kontakten%' then raise; end if; end;
  r := public.owner_onboarding_begin_send(e, 'invitation', 'testpostfach@cogniiq.test', 'Test', 'de', 'Start', null, false, gen_random_uuid());
  if r->>'recipient_account' <> 'none' or not (r->>'portal_invitation_pending')::boolean then
    raise exception 'FAIL T13b: new contact state %', r;
  end if;
  insert into fx values ('msg_act', (r->>'message_id')::uuid);
  r2 := public.owner_onboarding_begin_send(e, 'invitation', 'testpostfach@cogniiq.test', 'Test', 'de', 'Start', null, false, gen_random_uuid());
  if (select count(*) from public.client_invitations where email = 'testpostfach@cogniiq.test') <> 1 then
    raise exception 'FAIL T13b: a repeated invitation duplicated the portal invitation';
  end if;
  if (select count(*) from jsonb_array_elements(public.owner_onboarding_detail(e)->'invitations') x
      where x->>'recipient_email' = 'testpostfach@cogniiq.test' and x->>'status' = 'active') <> 1 then
    raise exception 'FAIL T13b: more than one active onboarding invitation per address';
  end if;
  if not exists (select 1 from jsonb_array_elements(public.owner_onboarding_detail(e)->'contacts') x
                 where x->>'email' = 'testpostfach@cogniiq.test' and x->>'source' = 'contact') then
    raise exception 'FAIL T13b: client contact not offered as recipient';
  end if;
end $$;
commit;
-- the address now has an account that never signed in (activation link not used)
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-0000-0000-000000000910', 'testpostfach@cogniiq.test', null);
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  r := public.owner_onboarding_begin_send(e, 'invitation', 'testpostfach@cogniiq.test', null, 'de', 'Neuer Link', null, false, gen_random_uuid());
  if r->>'recipient_account' <> 'pending_activation' or not (r->>'portal_invitation_pending')::boolean then
    raise exception 'FAIL T13b: unused account must get a fresh activation link: %', r;
  end if;
end $$;
commit;
update auth.users set email_confirmed_at = now(), last_sign_in_at = now() where id = '00000000-0000-0000-0000-000000000910';
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000910');
do $$ begin
  perform public.claim_my_client_invitations();
  perform public.claim_my_client_invitations();
  if (select count(*) from public.organization_members where user_id = '00000000-0000-0000-0000-000000000910') <> 1 then
    raise exception 'FAIL T13b: claiming twice duplicated the membership';
  end if;
end $$;
commit;
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); r jsonb; begin
  r := public.owner_onboarding_begin_send(e, 'reminder', 'testpostfach@cogniiq.test', null, 'de', 'Erinnerung', null, false, gen_random_uuid());
  if r->>'recipient_account' <> 'active' or (r->>'portal_invitation_pending')::boolean then
    raise exception 'FAIL T13b: an activated member must get the login link: %', r;
  end if;
end $$;
commit;
begin;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$ declare m uuid := (select id from fx where k = 'msg_act'); begin
  begin perform public.service_onboarding_complete_send(m, true, 're_x', null, 'magic', now());
    raise exception 'FAIL T13b: invalid link kind accepted';
  exception when others then if sqlerrm not like '%invalid link kind%' then raise; end if; end;
  perform public.service_onboarding_complete_send(m, true, 're_x', null, 'activation', now() + interval '1 hour');
end $$;
commit;
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare e uuid := (select id from fx where k = 'eng_a'); x jsonb; begin
  select y into x from jsonb_array_elements(public.owner_onboarding_detail(e)->'messages') y where y->>'id' = (select id from fx where k = 'msg_act')::text;
  if x->>'link_kind' <> 'activation' or x->>'link_expires_at' is null then raise exception 'FAIL T13b: link validity not recorded: %', x; end if;
  if (select expires_at from public.client_invitations where email = 'testpostfach@cogniiq.test') < now() + interval '29 days' then
    raise exception 'FAIL T13b: portal invitation validity tied to the short link lifetime';
  end if;
  raise notice 'PASS T13b: test mailbox via contacts, one portal invitation, link type by account state, link expiry recorded separately';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T16. Organization linking never duplicates or re-homes
-- ---------------------------------------------------------------------------------------------
begin;
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000901');
do $$ declare r jsonb; begin
  begin perform public.owner_link_customer_organization((select id from fx where k = 'cust_c'), (select id from fx where k = 'org_a'));
    raise exception 'FAIL T16: linked to an organization another customer owns';
  exception when others then if sqlerrm not like '%bereits einem anderen Kunden%' then raise; end if; end;
  r := public.owner_link_customer_organization((select id from fx where k = 'cust_c'), (select id from fx where k = 'org_free'));
  r := public.owner_link_customer_organization((select id from fx where k = 'cust_c'), (select id from fx where k = 'org_free'));
  if not (r->>'already')::boolean then raise exception 'FAIL T16: relink not idempotent'; end if;
  begin perform public.owner_link_customer_organization((select id from fx where k = 'cust_a'), (select id from fx where k = 'org_free'));
    raise exception 'FAIL T16: an existing link was moved';
  exception when others then if sqlerrm not like '%bereits mit einer anderen%' then raise; end if; end;
  if (select count(*) from public.organizations) <> 3 then raise exception 'FAIL T16: organizations were created'; end if;
  raise notice 'PASS T16: linking is explicit, idempotent, never creates or moves organizations';
end $$;
commit;

-- ---------------------------------------------------------------------------------------------
-- T17. Regression: P0-protected helpers stay closed; legacy portal tables untouched
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if has_function_privilege('authenticated', 'public.owner_force_destroy_row(text, uuid, integer)', 'execute')
     or has_function_privilege('authenticated', 'public.owner_purge_destroy_row(text, uuid, boolean)', 'execute') then
    raise exception 'FAIL T17: P0 protection regressed';
  end if;
  if (select count(*) from public.businesses) <> 0 or (select count(*) from public.onboarding_sessions) <> 0 then
    raise exception 'FAIL T17: legacy portal tables were written';
  end if;
  raise notice 'PASS T17: P0 helpers still closed; legacy portal tables untouched';
end $$;

\echo 'client onboarding bridge SQL tests: ALL PASSED'
