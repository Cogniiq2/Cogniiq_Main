-- Client service onboarding — throwaway-PostgreSQL regression suite.
--
-- Exercises the REAL migrations 20260830120000 + 20260830121000 end to end against a
-- disposable cluster: service assignment and its uniqueness, template instantiation and its
-- version snapshot, the task lifecycle and the rules that make each status honest, structured
-- field writes and their type/option validation, appointment types, readiness, and the go-live
-- gate as an actual gate rather than a label.
--
-- It also asserts the SECURITY posture that cannot be proven from the browser: which roles hold
-- EXECUTE on which function, which tables are readable, and that RLS is enabled with an
-- owner-only policy everywhere.
--
-- Synthetic data only. No real customer, no external call, no email, no automation.
-- Assertions raise on failure.

\set ON_ERROR_STOP on

select set_config('app.role', 'owner', false);
select set_config('app.uid', '22222222-2222-2222-2222-222222222222', false);
insert into public.profiles (id) values ('22222222-2222-2222-2222-222222222222') on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 1. Template seed integrity.
-- ---------------------------------------------------------------------------
do $$
declare
  v_tpl uuid; v_sections int; v_tasks int; v_fields int; v_orphans int;
begin
  select id into v_tpl from public.owner_service_templates
   where code = 'ai_receptionist_healthcare' and version = 1;
  if v_tpl is null then raise exception 'TEST seed: template v1 was not created'; end if;

  select count(*) into v_sections from public.owner_service_template_sections where template_id = v_tpl;
  select count(*) into v_tasks    from public.owner_service_template_tasks    where template_id = v_tpl;
  select count(*) into v_fields   from public.owner_service_template_fields   where template_id = v_tpl;

  if v_sections <> 20 then raise exception 'TEST seed: expected 20 sections, found %', v_sections; end if;
  -- Exact counts: template v1 is frozen once engagements snapshot it. See the note in
  -- src/lib/serviceOnboarding/aiReceptionistTemplate.test.ts, which asserts the same numbers.
  if v_tasks <> 171 then raise exception 'TEST seed: expected 171 tasks, found %', v_tasks; end if;
  if v_fields <> 132 then raise exception 'TEST seed: expected 132 fields, found %', v_fields; end if;

  -- Every task and field resolved to a real section of THIS template. The scalar-subquery
  -- lookup makes a mistyped section code a NOT NULL violation rather than a silent drop; this
  -- proves nothing was dropped.
  select count(*) into v_orphans
  from public.owner_service_template_tasks t
  where t.template_id = v_tpl
    and not exists (select 1 from public.owner_service_template_sections s
                     where s.id = t.section_id and s.template_id = v_tpl);
  if v_orphans > 0 then raise exception 'TEST seed: % tasks point outside the template', v_orphans; end if;

  -- The phases the onboarding system is required to cover must all be present.
  foreach v_orphans in array array[1] loop null; end loop;
  if exists (
    select unnest(array['commercial','profile','scope','workflow','identity','legal','privacy_infra',
                        'software','integration','knowledge','agent','backend','telephony','testing',
                        'performance','uat','golive','deployment','monitoring','maintenance']) as code
    except
    select code from public.owner_service_template_sections where template_id = v_tpl
  ) then
    raise exception 'TEST seed: a required onboarding phase is missing from the template';
  end if;

  -- Go-live gates that must exist for this product to be safe to launch.
  if exists (
    select unnest(array['COM-001','COM-002','LEG-002','LEG-008','LEG-009','TEL-011','UAT-007','GOL-001']) as code
    except
    select code from public.owner_service_template_tasks where template_id = v_tpl and is_go_live_blocker
  ) then
    raise exception 'TEST seed: a required go-live blocker task is missing or not marked';
  end if;

  -- Post-launch work must never be required: it would depress readiness before launch.
  if exists (
    select 1 from public.owner_service_template_tasks t
    join public.owner_service_template_sections s on s.id = t.section_id
    where t.template_id = v_tpl and s.code in ('monitoring', 'maintenance')
      and (t.is_required or t.is_go_live_blocker)
  ) then
    raise exception 'TEST seed: monitoring/maintenance work must be optional';
  end if;

  raise notice 'seed ok: % sections, % tasks, % fields', v_sections, v_tasks, v_fields;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Service assignment, instantiation, snapshot, duplicate protection.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid; v_cust uuid; v_other uuid; r jsonb;
  v_svc uuid; v_eng uuid; v_eng2 uuid; v_count int;
  v_tasks int; v_fields int; v_sections int; v_ver int; v_code text;
begin
  insert into public.owner_business_entities (display_name) values ('Cogniiq Test') returning id into v_entity;

  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Beispielpraxis GmbH', 'email', 'praxis@example.de'));
  v_cust := (r->>'customer_id')::uuid;

  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Muster Dental MVZ', 'email', 'mvz@example.de'));
  v_other := (r->>'customer_id')::uuid;

  -- (1) add the service
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
  v_svc := (r->>'service_id')::uuid;
  v_eng := (r->>'engagement_id')::uuid;
  if not (r->>'created')::boolean then raise exception 'TEST service: first add must report created'; end if;
  if v_eng is null then raise exception 'TEST service: an engagement must be instantiated'; end if;

  -- (2) template version SNAPSHOT
  select template_version, template_code into v_ver, v_code
    from public.owner_service_engagements where id = v_eng;
  if v_ver <> 1 or v_code <> 'ai_receptionist_healthcare' then
    raise exception 'TEST snapshot: engagement must record the template it was born from (got % v%)', v_code, v_ver;
  end if;

  -- (3) content copied, not referenced
  select count(*) into v_sections from public.owner_engagement_sections where engagement_id = v_eng;
  select count(*) into v_tasks    from public.owner_engagement_tasks    where engagement_id = v_eng;
  select count(*) into v_fields   from public.owner_engagement_fields   where engagement_id = v_eng;
  if v_sections <> 20 then raise exception 'TEST instantiate: expected 20 sections, got %', v_sections; end if;
  if v_tasks <> 171 or v_fields <> 132 then
    raise exception 'TEST instantiate: engagement did not receive the full template (% tasks, % fields)', v_tasks, v_fields;
  end if;

  -- (4) DUPLICATE PROTECTION: adding the same service again must not create a second anything
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
  if (r->>'created')::boolean then raise exception 'TEST duplicate: re-adding must not report created'; end if;
  if (r->>'engagement_id')::uuid <> v_eng then raise exception 'TEST duplicate: a second engagement was created'; end if;
  select count(*) into v_count from public.owner_customer_services where customer_id = v_cust and service_key = 'ai_receptionist';
  if v_count <> 1 then raise exception 'TEST duplicate: % service rows exist', v_count; end if;
  select count(*) into v_count from public.owner_service_engagements where customer_id = v_cust;
  if v_count <> 1 then raise exception 'TEST duplicate: % engagements exist', v_count; end if;

  -- (5) the UNIQUE constraint is real, not merely respected by the RPC
  begin
    insert into public.owner_customer_services (business_entity_id, customer_id, service_key)
    values (v_entity, v_cust, 'ai_receptionist');
    raise exception 'TEST duplicate: the unique constraint did not fire';
  exception when unique_violation then null;
  end;

  -- (6) MULTIPLE services on ONE canonical customer
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'automations');
  v_eng2 := (r->>'engagement_id')::uuid;
  if v_eng2 = v_eng then raise exception 'TEST multi: each service needs its own engagement'; end if;
  -- No template for automations yet: a usable but empty workspace, nothing faked.
  select count(*) into v_count from public.owner_engagement_tasks where engagement_id = v_eng2;
  if v_count <> 0 then raise exception 'TEST multi: automations must start empty until it has a template'; end if;
  select count(*) into v_count from public.owner_customers where id = v_cust;
  if v_count <> 1 then raise exception 'TEST multi: the customer must stay a single canonical row'; end if;

  -- (7) CROSS-CUSTOMER ISOLATION: another customer sees none of this
  if jsonb_array_length(public.owner_list_customer_services(v_other)) <> 0 then
    raise exception 'TEST isolation: a different customer must not see these services';
  end if;
  if (public.owner_engagement_detail(v_eng)->'customer'->>'id')::uuid <> v_cust then
    raise exception 'TEST isolation: engagement detail returned the wrong customer';
  end if;

  -- (8) activity was recorded for the meaningful events
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'engagement_created') then
    raise exception 'TEST activity: engagement creation must be recorded';
  end if;

  perform set_config('test.entity', v_entity::text, false);
  perform set_config('test.customer', v_cust::text, false);
  perform set_config('test.other_customer', v_other::text, false);
  perform set_config('test.service', v_svc::text, false);
  perform set_config('test.engagement', v_eng::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- 3. Task lifecycle and the rules that keep each status honest.
-- ---------------------------------------------------------------------------
do $$
declare
  v_eng uuid := current_setting('test.engagement')::uuid;
  v_task uuid; t record; v_threw boolean;
begin
  select id into v_task from public.owner_engagement_tasks where engagement_id = v_eng and code = 'LEG-002';
  if v_task is null then raise exception 'TEST task: LEG-002 missing from the engagement'; end if;

  -- BLOCKED without a reason is refused.
  v_threw := false;
  begin perform public.owner_set_engagement_task(v_task, jsonb_build_object('status', 'blocked'));
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST task: blocked without a reason must be refused'; end if;
  select status into t from public.owner_engagement_tasks where id = v_task;
  if (select status from public.owner_engagement_tasks where id = v_task) <> 'not_started' then
    raise exception 'TEST task: a refused transition must not change the row';
  end if;

  -- WAITING_FOR_CLIENT without the request is refused.
  v_threw := false;
  begin perform public.owner_set_engagement_task(v_task, jsonb_build_object('status', 'waiting_for_client'));
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST task: waiting-for-client must name what is needed'; end if;

  -- With their explanations, both are accepted and the text is stored.
  perform public.owner_set_engagement_task(v_task, jsonb_build_object(
    'status', 'blocked', 'blocker_reason', 'Kunde hat den AVV noch nicht zurückgeschickt'));
  select * into t from public.owner_engagement_tasks where id = v_task;
  if t.status <> 'blocked' or t.blocker_reason is null then raise exception 'TEST task: blocked state not stored'; end if;

  perform public.owner_set_engagement_task(v_task, jsonb_build_object(
    'status', 'waiting_for_client', 'client_request', 'Unterzeichneter AVV im Original'));
  select * into t from public.owner_engagement_tasks where id = v_task;
  if t.status <> 'waiting_for_client' or t.client_request is null then raise exception 'TEST task: client request not stored'; end if;
  -- Leaving BLOCKED clears the stale reason so it cannot linger as evidence.
  if t.blocker_reason is not null then raise exception 'TEST task: a stale blocker reason survived'; end if;

  -- COMPLETE stamps who and when, and carries evidence.
  perform public.owner_set_engagement_task(v_task, jsonb_build_object(
    'status', 'complete', 'evidence_url', 'https://example.invalid/avv.pdf',
    'evidence_note', 'AVV liegt unterzeichnet vor', 'reviewer', 'L. Wagner'));
  select * into t from public.owner_engagement_tasks where id = v_task;
  if t.status <> 'complete' then raise exception 'TEST task: completion failed'; end if;
  if t.completed_at is null or t.completed_by is null then raise exception 'TEST task: completion metadata missing'; end if;
  if t.evidence_url is null or t.reviewer is null then raise exception 'TEST task: evidence not stored'; end if;

  -- Re-opening clears the completion stamp; the CHECK constraint keeps the two consistent.
  perform public.owner_set_engagement_task(v_task, jsonb_build_object('status', 'in_progress'));
  select * into t from public.owner_engagement_tasks where id = v_task;
  if t.completed_at is not null or t.completed_by is not null then
    raise exception 'TEST task: re-opening must clear the completion stamp';
  end if;

  -- The constraint is enforced by the database, not only by the RPC.
  v_threw := false;
  begin
    update public.owner_engagement_tasks set status = 'complete', completed_at = null where id = v_task;
  exception when check_violation then v_threw := true; end;
  if not v_threw then raise exception 'TEST task: completion consistency constraint did not fire'; end if;

  v_threw := false;
  begin
    update public.owner_engagement_tasks set status = 'blocked', blocker_reason = null where id = v_task;
  exception when check_violation then v_threw := true; end;
  if not v_threw then raise exception 'TEST task: blocked-needs-reason constraint did not fire'; end if;

  -- An unknown status is refused.
  v_threw := false;
  begin perform public.owner_set_engagement_task(v_task, jsonb_build_object('status', 'wat'));
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST task: an unknown status must be refused'; end if;

  -- Status changes are recorded in the trail.
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'task_status_changed') then
    raise exception 'TEST activity: task status changes must be recorded';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Structured fields: typed columns, option validation, applicability.
-- ---------------------------------------------------------------------------
do $$
declare
  v_eng uuid := current_setting('test.engagement')::uuid;
  v_text uuid; v_num uuid; v_bool uuid; v_date uuid; v_select uuid;
  f record; v_threw boolean;
begin
  select id into v_text   from public.owner_engagement_fields where engagement_id = v_eng and code = 'AGT-F004';
  select id into v_num    from public.owner_engagement_fields where engagement_id = v_eng and code = 'PRF-F001';
  select id into v_bool   from public.owner_engagement_fields where engagement_id = v_eng and code = 'LEG-F005';
  select id into v_date   from public.owner_engagement_fields where engagement_id = v_eng and code = 'COM-F001';
  select id into v_select from public.owner_engagement_fields where engagement_id = v_eng and code = 'PRV-F001';

  -- Each value lands in exactly one typed column, chosen from the field's own data_type.
  perform public.owner_set_engagement_field(v_text, jsonb_build_object('value', 'agent_abc123'));
  select * into f from public.owner_engagement_fields where id = v_text;
  if f.value_text <> 'agent_abc123' or f.value_number is not null or f.value_bool is not null or f.value_date is not null then
    raise exception 'TEST field: a text value must populate value_text only';
  end if;

  perform public.owner_set_engagement_field(v_num, jsonb_build_object('value', '420'));
  select * into f from public.owner_engagement_fields where id = v_num;
  if f.value_number <> 420 or f.value_text is not null then raise exception 'TEST field: number column not used'; end if;

  -- FALSE is an answer, not an absence.
  perform public.owner_set_engagement_field(v_bool, jsonb_build_object('value', 'false'));
  select * into f from public.owner_engagement_fields where id = v_bool;
  if f.value_bool is distinct from false then raise exception 'TEST field: boolean false must be stored'; end if;

  perform public.owner_set_engagement_field(v_date, jsonb_build_object('value', '2026-09-01'));
  select * into f from public.owner_engagement_fields where id = v_date;
  if f.value_date <> date '2026-09-01' then raise exception 'TEST field: date column not used'; end if;

  -- A select may only hold one of its own options.
  perform public.owner_set_engagement_field(v_select, jsonb_build_object('value', 'eu'));
  v_threw := false;
  begin perform public.owner_set_engagement_field(v_select, jsonb_build_object('value', 'atlantis'));
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST field: an off-list select value must be refused'; end if;
  select * into f from public.owner_engagement_fields where id = v_select;
  if f.value_text <> 'eu' then raise exception 'TEST field: a refused write must not change the row'; end if;

  -- A malformed number is answered with a sentence, not a driver cast error.
  v_threw := false;
  begin perform public.owner_set_engagement_field(v_num, jsonb_build_object('value', 'zwei'));
  exception when others then
    v_threw := true;
    if sqlerrm not like '%erwartet%' then raise exception 'TEST field: expected a readable message, got: %', sqlerrm; end if;
  end;
  if not v_threw then raise exception 'TEST field: a non-numeric value must be refused'; end if;

  -- Clearing empties every column.
  perform public.owner_set_engagement_field(v_text, jsonb_build_object('value', null));
  select * into f from public.owner_engagement_fields where id = v_text;
  if f.value_text is not null then raise exception 'TEST field: clearing must empty the value'; end if;

  -- Not-applicable is a first-class state and is recorded.
  perform public.owner_set_engagement_field(v_num, jsonb_build_object('not_applicable', true));
  select * into f from public.owner_engagement_fields where id = v_num;
  if not f.not_applicable then raise exception 'TEST field: not_applicable not stored'; end if;
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'field_applicability_changed') then
    raise exception 'TEST activity: an applicability change must be recorded';
  end if;

  -- Filling a field is recorded once, not per keystroke.
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'field_set') then
    raise exception 'TEST activity: filling a field must be recorded';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Engagement settings: healthcare applicability + the integration honesty rule.
-- ---------------------------------------------------------------------------
do $$
declare
  v_eng uuid := current_setting('test.engagement')::uuid;
  e record; v_threw boolean; v_before int; v_after int;
begin
  -- PARTIAL automation without a documented limitation is refused by the RPC ...
  v_threw := false;
  begin perform public.owner_update_engagement(v_eng, jsonb_build_object('integration_mode', 'partial_automation'));
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST integration: partial automation must document its limitation'; end if;

  -- ... and by the table constraint underneath it.
  v_threw := false;
  begin
    update public.owner_service_engagements
       set integration_mode = 'partial_automation', integration_limitations = null where id = v_eng;
  exception when check_violation then v_threw := true; end;
  if not v_threw then raise exception 'TEST integration: the partial-automation constraint did not fire'; end if;

  perform public.owner_update_engagement(v_eng, jsonb_build_object(
    'integration_mode', 'partial_automation',
    'integration_limitations', 'Buchung und Stornierung laufen durch. Umbuchung unterstützt die Schnittstelle nicht.'));
  select * into e from public.owner_service_engagements where id = v_eng;
  if e.integration_mode <> 'partial_automation' then raise exception 'TEST integration: mode not stored'; end if;

  perform public.owner_update_engagement(v_eng, jsonb_build_object('integration_mode', 'full_automation'));
  select * into e from public.owner_service_engagements where id = v_eng;
  if e.integration_mode <> 'full_automation' then raise exception 'TEST integration: full automation not stored'; end if;

  -- Healthcare applicability changes what the gate counts.
  v_before := (public.owner_engagement_go_live_blockers(v_eng)->>'count')::int;
  perform public.owner_update_engagement(v_eng, jsonb_build_object('healthcare', true));
  v_after := (public.owner_engagement_go_live_blockers(v_eng)->>'count')::int;
  if v_after <= v_before then
    raise exception 'TEST healthcare: marking healthcare must add its obligations (% -> %)', v_before, v_after;
  end if;
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'healthcare_changed') then
    raise exception 'TEST activity: the healthcare decision must be recorded';
  end if;
  perform public.owner_update_engagement(v_eng, jsonb_build_object('healthcare', false));
  if (public.owner_engagement_go_live_blockers(v_eng)->>'count')::int <> v_before then
    raise exception 'TEST healthcare: turning it off must restore the general-business gate';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Appointment types (the relational one-to-many).
-- ---------------------------------------------------------------------------
do $$
declare
  v_eng uuid := current_setting('test.engagement')::uuid;
  r jsonb; v_id uuid; a record; v_threw boolean; v_count int;
begin
  r := public.owner_upsert_engagement_appointment_type(v_eng, null, jsonb_build_object(
        'spoken_name', 'Kontrolluntersuchung', 'duration_minutes', '30',
        'location', 'Standort Nord', 'new_patients_allowed', true));
  v_id := (r->>'appointment_type_id')::uuid;
  select * into a from public.owner_engagement_appointment_types where id = v_id;
  if a.spoken_name <> 'Kontrolluntersuchung' or a.duration_minutes <> 30 then
    raise exception 'TEST appointment: creation did not store the values';
  end if;

  -- Update in place, not a second row.
  perform public.owner_upsert_engagement_appointment_type(v_eng, v_id, jsonb_build_object(
    'spoken_name', 'Kontrolluntersuchung', 'existing_patients_only', true,
    'cancellation_rules', 'Bis 24 Stunden vorher'));
  select count(*) into v_count from public.owner_engagement_appointment_types where engagement_id = v_eng;
  if v_count <> 1 then raise exception 'TEST appointment: an update created a second row'; end if;

  -- A nameless appointment type is refused: the agent could not speak it.
  v_threw := false;
  begin perform public.owner_upsert_engagement_appointment_type(v_eng, null, jsonb_build_object('spoken_name', '   '));
  exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST appointment: a blank spoken name must be refused'; end if;

  -- A non-numeric duration is refused with a readable message.
  v_threw := false;
  begin perform public.owner_upsert_engagement_appointment_type(v_eng, null, jsonb_build_object(
          'spoken_name', 'Beratung', 'duration_minutes', 'halbe Stunde'));
  exception when others then
    v_threw := true;
    if sqlerrm not like '%ganze Zahl%' then raise exception 'TEST appointment: expected a readable message, got: %', sqlerrm; end if;
  end;
  if not v_threw then raise exception 'TEST appointment: a non-numeric duration must be refused'; end if;

  perform public.owner_delete_engagement_appointment_type(v_id);
  select count(*) into v_count from public.owner_engagement_appointment_types where engagement_id = v_eng;
  if v_count <> 0 then raise exception 'TEST appointment: deletion failed'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Readiness + the go-live gate as a real gate.
-- ---------------------------------------------------------------------------
do $$
declare
  v_eng uuid := current_setting('test.engagement')::uuid;
  v_gate jsonb; v_count int; v_independent int; v_threw boolean;
  v_required int; v_done int;
begin
  v_gate := public.owner_engagement_go_live_blockers(v_eng);
  v_count := (v_gate->>'count')::int;
  if v_count = 0 then raise exception 'TEST gate: a fresh engagement must have open blockers'; end if;
  if (v_gate->>'ready')::boolean then raise exception 'TEST gate: ready must be false while blockers remain'; end if;
  if jsonb_array_length(v_gate->'blockers') <> v_count then
    raise exception 'TEST gate: the blocker list and the count disagree';
  end if;

  -- The same number computed a different way: parity between the gate and the plain rules.
  select
    (select count(*) from public.owner_engagement_tasks t
      where t.engagement_id = v_eng and t.is_go_live_blocker
        and t.status not in ('complete', 'not_applicable') and not t.healthcare_only)
  + (select count(*) from public.owner_engagement_fields f
      where f.engagement_id = v_eng and f.is_go_live_blocker and not f.not_applicable
        and not f.healthcare_only
        and f.value_text is null and f.value_number is null and f.value_bool is null and f.value_date is null)
  into v_independent;
  if v_independent <> v_count then
    raise exception 'TEST gate: independent count % disagrees with the gate %', v_independent, v_count;
  end if;

  -- The gate is enforced: the production statuses are refused while blockers remain.
  foreach v_gate in array array['"ready_for_go_live"'::jsonb, '"live"'::jsonb, '"monitoring"'::jsonb] loop
    v_threw := false;
    begin perform public.owner_set_engagement_status(v_eng, v_gate #>> '{}');
    exception when others then
      v_threw := true;
      if sqlerrm not like '%Go-Live gesperrt%' then raise exception 'TEST gate: unexpected refusal: %', sqlerrm; end if;
    end;
    if not v_threw then raise exception 'TEST gate: % must be refused while blockers remain', v_gate; end if;
  end loop;
  if (select lifecycle_status from public.owner_service_engagements where id = v_eng) = 'live' then
    raise exception 'TEST gate: a refused transition must not change the status';
  end if;

  -- Non-gated statuses stay freely available.
  perform public.owner_set_engagement_status(v_eng, 'building');
  if (select lifecycle_status from public.owner_service_engagements where id = v_eng) <> 'building' then
    raise exception 'TEST status: an ordinary transition must be allowed';
  end if;

  -- Resolve EVERY applicable blocker: tasks complete, fields answered.
  --
  -- All but one are closed with a direct UPDATE for speed; the LAST one goes through the RPC,
  -- because the readiness-flip event is raised there and asserting it is the point.
  update public.owner_engagement_tasks
     set status = 'complete', completed_at = now(), completed_by = auth.uid(), blocker_reason = null
   where engagement_id = v_eng and is_go_live_blocker and not healthcare_only
     and status <> 'complete'
     and id <> (select id from public.owner_engagement_tasks
                 where engagement_id = v_eng and is_go_live_blocker and not healthcare_only
                   and status <> 'complete' order by code limit 1);
  update public.owner_engagement_fields
     set value_text = 'erfasst'
   where engagement_id = v_eng and is_go_live_blocker and not healthcare_only and not not_applicable
     and data_type not in ('select', 'number', 'boolean', 'date')
     and value_text is null;
  -- Select/date/number blockers get a value of the right shape.
  update public.owner_engagement_fields f
     set value_text = (select o->>'value' from jsonb_array_elements(f.options) o limit 1)
   where f.engagement_id = v_eng and f.is_go_live_blocker and not f.healthcare_only
     and f.data_type = 'select' and f.value_text is null;

  -- One blocker remains, and closing it THROUGH THE RPC is what flips readiness.
  if (public.owner_engagement_go_live_blockers(v_eng)->>'count')::int <> 1 then
    raise exception 'TEST gate: expected exactly one blocker left before the final close, got %',
      (public.owner_engagement_go_live_blockers(v_eng)->>'count')::int;
  end if;
  perform public.owner_set_engagement_task(
    (select id from public.owner_engagement_tasks
      where engagement_id = v_eng and is_go_live_blocker and not healthcare_only and status <> 'complete'),
    jsonb_build_object('status', 'complete'));

  v_gate := public.owner_engagement_go_live_blockers(v_eng);
  if not (v_gate->>'ready')::boolean then
    raise exception 'TEST gate: still not ready after resolving everything: %', v_gate->'blockers';
  end if;
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'blocker_resolved') then
    raise exception 'TEST activity: resolving a go-live blocker must be recorded';
  end if;

  -- Now the production statuses are reachable, and going live is stamped.
  perform public.owner_set_engagement_status(v_eng, 'ready_for_go_live');
  perform public.owner_set_engagement_status(v_eng, 'live');
  if (select went_live_at from public.owner_service_engagements where id = v_eng) is null then
    raise exception 'TEST gate: going live must be stamped';
  end if;
  if not exists (select 1 from public.owner_engagement_activity
                  where engagement_id = v_eng and event_type = 'go_live_readiness_changed') then
    raise exception 'TEST activity: a readiness flip must be recorded';
  end if;

  -- Readiness counts only required, applicable items (the same rule the UI engine uses).
  select count(*) filter (where is_required and status <> 'not_applicable' and not healthcare_only),
         count(*) filter (where is_required and status = 'complete' and not healthcare_only)
    into v_required, v_done
  from public.owner_engagement_tasks where engagement_id = v_eng;
  if v_required = 0 or v_done = 0 then raise exception 'TEST readiness: expected countable progress'; end if;
  if v_done > v_required then raise exception 'TEST readiness: done exceeds the required total'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Service state changes preserve history; nothing is destroyed.
-- ---------------------------------------------------------------------------
do $$
declare
  v_svc uuid := current_setting('test.service')::uuid;
  v_cust uuid := current_setting('test.customer')::uuid;
  v_eng uuid := current_setting('test.engagement')::uuid;
  v_tasks_before int; v_tasks_after int; r jsonb;
begin
  select count(*) into v_tasks_before from public.owner_engagement_tasks where engagement_id = v_eng;

  perform public.owner_set_customer_service_state(v_svc, 'paused');
  perform public.owner_set_customer_service_state(v_svc, 'archived');
  if (select state from public.owner_customer_services where id = v_svc) <> 'archived' then
    raise exception 'TEST service state: archiving failed';
  end if;

  select count(*) into v_tasks_after from public.owner_engagement_tasks where engagement_id = v_eng;
  if v_tasks_after <> v_tasks_before then raise exception 'TEST service state: archiving destroyed onboarding data'; end if;
  if not exists (select 1 from public.owner_service_engagements where id = v_eng) then
    raise exception 'TEST service state: archiving removed the engagement';
  end if;

  -- Re-adding an archived service reactivates it and keeps the SAME engagement.
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
  if (r->>'engagement_id')::uuid <> v_eng then raise exception 'TEST service state: reactivation created a new engagement'; end if;
  if (select state from public.owner_customer_services where id = v_svc) <> 'active' then
    raise exception 'TEST service state: reactivation failed';
  end if;
  if (select count(*) from public.owner_engagement_tasks where engagement_id = v_eng) <> v_tasks_before then
    raise exception 'TEST service state: reactivation changed the task set';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Authorization: non-owner and anon are refused by every browser-callable RPC.
-- ---------------------------------------------------------------------------
do $$
declare
  v_cust uuid := current_setting('test.customer')::uuid;
  v_eng uuid := current_setting('test.engagement')::uuid;
  v_role text; v_threw boolean;
begin
  foreach v_role in array array['anon', 'admin', 'service'] loop
    perform set_config('app.role', v_role, false);

    v_threw := false;
    begin perform public.owner_list_customer_services(v_cust);
    exception when others then v_threw := true; end;
    if not v_threw then raise exception 'TEST authz: % could list services', v_role; end if;

    v_threw := false;
    begin perform public.owner_engagement_detail(v_eng);
    exception when others then v_threw := true; end;
    if not v_threw then raise exception 'TEST authz: % could read an engagement', v_role; end if;

    v_threw := false;
    begin perform public.owner_add_customer_service(gen_random_uuid(), v_cust, 'website');
    exception when others then v_threw := true; end;
    if not v_threw then raise exception 'TEST authz: % could add a service', v_role; end if;

    v_threw := false;
    begin perform public.owner_set_engagement_status(v_eng, 'lead');
    exception when others then v_threw := true; end;
    if not v_threw then raise exception 'TEST authz: % could change the lifecycle status', v_role; end if;
  end loop;

  perform set_config('app.role', 'owner', false);
end $$;

-- ---------------------------------------------------------------------------
-- 10. Grants and RLS: what the browser roles can actually reach.
-- ---------------------------------------------------------------------------
do $$
declare t text; v_missing text;
begin
  foreach t in array array[
    'owner_customer_services', 'owner_service_templates', 'owner_service_template_sections',
    'owner_service_template_tasks', 'owner_service_template_fields', 'owner_service_engagements',
    'owner_engagement_sections', 'owner_engagement_tasks', 'owner_engagement_fields',
    'owner_engagement_appointment_types', 'owner_engagement_activity'
  ] loop
    -- RLS on, with an owner-only policy.
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise exception 'TEST rls: % does not have row level security enabled', t;
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t
                    and qual like '%is_platform_owner%') then
      raise exception 'TEST rls: % has no owner-gated policy', t;
    end if;

    -- anon reaches nothing at all.
    if has_table_privilege('anon', 'public.' || t, 'SELECT')
       or has_table_privilege('anon', 'public.' || t, 'INSERT') then
      raise exception 'TEST grants: anon can reach %', t;
    end if;

    -- authenticated may READ (RLS then decides), but never write directly.
    if has_table_privilege('authenticated', 'public.' || t, 'INSERT')
       or has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
       or has_table_privilege('authenticated', 'public.' || t, 'DELETE') then
      raise exception 'TEST grants: authenticated can write directly to %', t;
    end if;
  end loop;

  -- The internal helpers are out of reach from BOTH browser roles.
  --
  -- These three are the only SECURITY DEFINER functions in this feature without an
  -- is_platform_owner() check of their own. That is sound only for as long as no browser role
  -- can execute them, so the absence of the grant IS the authorization boundary here — which is
  -- why it is asserted rather than assumed. They remain executable by the `service_role`
  -- DATABASE role, which already has unrestricted access by design and is never used from a
  -- browser session.
  foreach t in array array[
    'owner_engagement_go_live_blockers(uuid)',
    'owner_instantiate_service_engagement(uuid)',
    'owner_record_engagement_activity(uuid, text, text, uuid, text)'
  ] loop
    if has_function_privilege('authenticated', 'public.' || t, 'EXECUTE') then
      raise exception 'TEST grants: internal helper % must not be callable by authenticated', t;
    end if;
    if has_function_privilege('anon', 'public.' || t, 'EXECUTE') then
      raise exception 'TEST grants: internal helper % must not be callable by anon', t;
    end if;
    if not has_function_privilege('service_role', 'public.' || t, 'EXECUTE') then
      raise exception 'TEST grants: internal helper % must remain callable by service_role', t;
    end if;
  end loop;

  -- Every browser-callable RPC IS reachable by authenticated and NOT by anon.
  foreach t in array array[
    'owner_add_customer_service(uuid, uuid, text)',
    'owner_set_customer_service_state(uuid, text)',
    'owner_list_customer_services(uuid)',
    'owner_engagement_detail(uuid)',
    'owner_update_engagement(uuid, jsonb)',
    'owner_set_engagement_status(uuid, text)',
    'owner_set_engagement_task(uuid, jsonb)',
    'owner_set_engagement_field(uuid, jsonb)',
    'owner_upsert_engagement_appointment_type(uuid, uuid, jsonb)',
    'owner_delete_engagement_appointment_type(uuid)'
  ] loop
    if not has_function_privilege('authenticated', 'public.' || t, 'EXECUTE') then
      raise exception 'TEST grants: authenticated cannot execute %', t;
    end if;
    if has_function_privilege('anon', 'public.' || t, 'EXECUTE') then
      raise exception 'TEST grants: anon can execute %', t;
    end if;
  end loop;

  -- Every SECURITY DEFINER function this feature adds must pin its search_path.
  select string_agg(p.proname, ', ') into v_missing
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (p.proname like 'owner_%engagement%' or p.proname like 'owner_%customer_service%')
    and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');
  if v_missing is not null then
    raise exception 'TEST security: SECURITY DEFINER without a pinned search_path: %', v_missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 11. No secrets, and no external side effect.
-- ---------------------------------------------------------------------------
do $$
declare v_bad text;
begin
  -- Credential fields record STATUS only; no column in this feature is named like a secret.
  select string_agg(table_name || '.' || column_name, ', ') into v_bad
  from information_schema.columns
  where table_schema = 'public'
    and (table_name like 'owner_engagement%' or table_name like 'owner_service%' or table_name = 'owner_customer_services')
    and (column_name ~* '(secret|password|api_key|token|private_key)');
  if v_bad is not null then raise exception 'TEST secrets: secret-shaped column(s): %', v_bad; end if;

  -- This feature enqueues no job and sends nothing. The automation worker table exists in the
  -- bootstrap chain; it must be untouched by everything above.
  if to_regclass('public.owner_automation_jobs') is not null then
    if (select count(*) from public.owner_automation_jobs) <> 0 then
      raise exception 'TEST side effects: an automation job was created';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 12. Existing customer compatibility: a customer with no service still works.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := current_setting('test.entity')::uuid;
  v_legacy uuid; r jsonb; d jsonb;
begin
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Demo Kunde GmbH'));
  v_legacy := (r->>'customer_id')::uuid;

  -- No service is created implicitly.
  if jsonb_array_length(public.owner_list_customer_services(v_legacy)) <> 0 then
    raise exception 'TEST legacy: an existing customer must not gain a service on its own';
  end if;

  -- And the untouched customer detail RPC still answers exactly as before.
  --
  -- The keys checked here are the ones the version in THIS baseline chain
  -- (20260724120000) returns. Later migrations add invoices/payments/delete_blockers;
  -- asserting those here would test the baseline, not this feature. What matters is that
  -- applying 20260830120000 removed nothing — and the migration never touches this function,
  -- which src/lib/serviceOnboarding/serviceOnboardingSchema.test.ts asserts against the file.
  d := public.owner_customer_detail(v_legacy);
  if d->'customer'->>'id' is null then raise exception 'TEST legacy: owner_customer_detail broke'; end if;
  foreach r in array array['"offers"'::jsonb, '"tasks"'::jsonb, '"activity"'::jsonb] loop
    if not (d ? (r #>> '{}')) then raise exception 'TEST legacy: owner_customer_detail lost key %', r; end if;
  end loop;

  -- The customer's own task checklist is a separate layer and must be unaffected by the
  -- service engagements: adding a service adds no general customer task.
  if (select count(*) from public.owner_customer_tasks
       where customer_id = current_setting('test.customer')::uuid) <> 0 then
    raise exception 'TEST legacy: the general customer task list was polluted by the service layer';
  end if;
end $$;

select 'client service onboarding SQL tests passed' as result;
