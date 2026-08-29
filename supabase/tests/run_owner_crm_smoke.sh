#!/usr/bin/env bash
set -euo pipefail

# Owner CRM sales-pipeline DB smoke test (migration 20260902120000).
#
# Proves the rules the UI is not allowed to be the only enforcer of:
#   * anon, customer and cogniiq_admin cannot read a single lead, note or assessment;
#   * a lead needs an identity, and cannot be born won or lost;
#   * a lost opportunity needs a reason, and reopening keeps its whole history;
#   * the pre-offer integration gate refuses `complete` while a question is open;
#   * lead -> customer conversion is atomic and idempotent under replay AND under a
#     second call with a fresh key, instantiates the AI Receptionist onboarding
#     exactly once, and never deletes the source lead;
#   * a go-live blocker still blocks after conversion.
#
# Usage: DATABASE_URL=postgresql://... supabase/tests/run_owner_crm_smoke.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"; }

run_psql <<'SQL'
select set_config('cq.owner',    '00000000-0000-0000-0000-000000000901', false);
select set_config('cq.admin',    '00000000-0000-0000-0000-000000000902', false);
select set_config('cq.customer', '00000000-0000-0000-0000-000000000903', false);
update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('cq.owner')::uuid;
update public.profiles set platform_role = 'cogniiq_admin' where id = current_setting('cq.admin')::uuid;
select set_config('cq.entity', (select id::text from public.owner_business_entities where slug = 'cogniiq'), false);

begin;

-- ===== Scenario: anonymous is denied every CRM table =====
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
do $$
declare t text;
begin
  foreach t in array array['owner_leads','owner_lead_service_interests','owner_lead_follow_ups',
                           'owner_lead_activity','owner_lead_integration_checks',
                           'cogniiq_receptionist_leads'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'TEST FAILED: anon read public.%', t;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
reset role;

-- ===== Scenario: the owner runs the whole sales flow =====
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cq.owner'), true);

-- A lead with no identity at all is refused.
do $$
begin
  perform public.owner_create_lead(gen_random_uuid(),
    jsonb_build_object('business_entity_id', current_setting('cq.entity')));
  raise exception 'TEST FAILED: identity-less lead was accepted';
exception when others then
  if position('at least a company' in sqlerrm) = 0 then raise; end if;
end $$;

-- A lead cannot be born already won.
do $$
begin
  perform public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
    'business_entity_id', current_setting('cq.entity'), 'company', 'X', 'stage', 'won'));
  raise exception 'TEST FAILED: lead created directly as won';
exception when others then
  if position('cannot start as won' in sqlerrm) = 0 then raise; end if;
end $$;

-- The minimum viable lead: a name and nothing else.
select set_config('cq.lead_min',
  (public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
     'business_entity_id', current_setting('cq.entity'),
     'company', 'Praxis Minimal'))->>'lead_id'), false);

-- The real one, with service interest and a follow-up.
select set_config('cq.lead',
  (public.owner_create_lead(gen_random_uuid(), jsonb_build_object(
     'business_entity_id', current_setting('cq.entity'),
     'company', 'Praxis Dr. Beispiel', 'contact_name', 'Dr. Anna Beispiel',
     'email', 'praxis@beispiel.test', 'phone', '+49 89 1234567',
     'website', 'https://www.praxis-beispiel.test/kontakt',
     'city', 'München', 'priority', 'high',
     'estimated_setup_cents', 480000, 'estimated_monthly_cents', 39900,
     'service_interests', jsonb_build_array('ai_receptionist', 'automations'),
     'next_follow_up_at', (now() - interval '2 days')::text,
     'follow_up_note', 'Rückruf zur PVS-Frage'))->>'lead_id'), false);

do $$
declare l record; n int;
begin
  select * into l from public.owner_leads where id = current_setting('cq.lead')::uuid;
  if l.stage <> 'new' then raise exception 'TEST FAILED: unexpected initial stage %', l.stage; end if;
  if l.next_follow_up_at is null then raise exception 'TEST FAILED: follow-up cache not filled'; end if;
  select count(*) into n from public.owner_lead_service_interests where lead_id = l.id;
  if n <> 2 then raise exception 'TEST FAILED: % service interests, expected 2', n; end if;
end $$;

-- Duplicate detection: the same e-mail is a STRONG match, a shared company name a weak one.
do $$
declare d jsonb;
begin
  d := public.owner_find_lead_duplicates(current_setting('cq.entity')::uuid,
         jsonb_build_object('email', 'PRAXIS@Beispiel.test'));
  if jsonb_array_length(d) <> 1 or d->0->>'confidence' <> 'strong' then
    raise exception 'TEST FAILED: e-mail duplicate not detected strongly: %', d;
  end if;
  -- Same number written differently must still match.
  d := public.owner_find_lead_duplicates(current_setting('cq.entity')::uuid,
         jsonb_build_object('phone', '089/1234567'));
  if jsonb_array_length(d) <> 1 then raise exception 'TEST FAILED: phone duplicate not detected: %', d; end if;
  -- A shared company name alone never rises above weak.
  d := public.owner_find_lead_duplicates(current_setting('cq.entity')::uuid,
         jsonb_build_object('company', 'Praxis Dr. Beispiel'));
  if d->0->>'confidence' <> 'weak' then raise exception 'TEST FAILED: name match reported as strong: %', d; end if;
end $$;

-- Notes, logged contact and stage changes all land in the timeline.
do $$
declare v_lead uuid := current_setting('cq.lead')::uuid;
begin
  perform public.owner_log_lead_contact(v_lead, 'note', 'Setzt tomedo ein.');
  perform public.owner_log_lead_contact(v_lead, 'call', 'Erstgespräch geführt.');
  perform public.owner_set_lead_stage(v_lead, 'qualification');
end $$;

do $$
declare l record; n int;
begin
  select * into l from public.owner_leads where id = current_setting('cq.lead')::uuid;
  if l.last_contact_at is null then raise exception 'TEST FAILED: a logged call did not move last_contact_at'; end if;
  select count(*) into n from public.owner_lead_activity
   where lead_id = l.id and event_type = 'note_added';
  if n <> 1 then raise exception 'TEST FAILED: note not recorded'; end if;
end $$;

-- A note is not contact: it must not move last_contact_at on its own.
do $$
declare v_before timestamptz; v_after timestamptz;
begin
  select last_contact_at into v_before from public.owner_leads where id = current_setting('cq.lead_min')::uuid;
  perform public.owner_log_lead_contact(current_setting('cq.lead_min')::uuid, 'note', 'Nur eine Notiz.');
  select last_contact_at into v_after from public.owner_leads where id = current_setting('cq.lead_min')::uuid;
  if v_before is distinct from v_after then raise exception 'TEST FAILED: a note moved last_contact_at'; end if;
end $$;

-- ===== Scenario: the pre-offer integration gate =====
do $$
declare v_lead uuid := current_setting('cq.lead')::uuid;
begin
  -- Nothing recorded yet: completing is refused, and says which answer is missing.
  begin
    perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('status', 'complete'));
    raise exception 'TEST FAILED: empty assessment accepted as complete';
  exception when others then
    if position('PVS or the appointment system' in sqlerrm) = 0 then raise; end if;
  end;

  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object(
    'pvs_name', 'tomedo', 'pvs_vendor', 'zollsoft', 'status', 'in_progress'));

  -- Still refused: no interface answer.
  begin
    perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('status', 'complete'));
    raise exception 'TEST FAILED: assessment completed without an interface answer';
  exception when others then
    if position('whether an interface exists' in sqlerrm) = 0 then raise; end if;
  end;

  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object(
    'interface_type', 'official_api', 'supports_booking', 'true', 'supports_cancel', 'false'));

  -- Still refused: third-party costs unconfirmed. This is the surprise-fee guard.
  begin
    perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('status', 'complete'));
    raise exception 'TEST FAILED: assessment completed with unconfirmed third-party costs';
  exception when others then
    if position('third-party costs' in sqlerrm) = 0 then raise; end if;
  end;

  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object(
    'third_party_costs_confirmed', 'true', 'third_party_setup_cents', 90000,
    'integration_mode', 'partial_automation'));

  -- A partial automation must name its fallback.
  begin
    perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object('status', 'complete'));
    raise exception 'TEST FAILED: partial automation completed without a fallback';
  exception when others then
    if position('exact fallback' in sqlerrm) = 0 then raise; end if;
  end;

  perform public.owner_upsert_lead_integration_check(v_lead, jsonb_build_object(
    'fallback_description', 'Stornierungen werden als Rückrufaufgabe im PVS hinterlegt.',
    'status', 'complete'));
end $$;

do $$
declare c record;
begin
  select * into c from public.owner_lead_integration_checks where lead_id = current_setting('cq.lead')::uuid;
  if c.status <> 'complete' then raise exception 'TEST FAILED: assessment did not complete'; end if;
  -- Tri-state must survive: "not established" is not "no".
  if c.supports_reschedule is not null then raise exception 'TEST FAILED: unanswered operation was defaulted'; end if;
  if c.supports_cancel is not false then raise exception 'TEST FAILED: explicit false was lost'; end if;
end $$;

-- ===== Scenario: follow-ups =====
do $$
declare v_lead uuid := current_setting('cq.lead')::uuid; f record; v_next uuid; l record;
begin
  select * into f from public.owner_lead_follow_ups where lead_id = v_lead and status = 'open';
  v_next := (public.owner_complete_lead_follow_up(f.id, 'done', 'Erledigt',
               (now() + interval '5 days'), 'Angebot nachfassen')->>'next_follow_up_id')::uuid;
  if v_next is null then raise exception 'TEST FAILED: successor follow-up not created'; end if;

  select * into l from public.owner_leads where id = v_lead;
  if l.next_follow_up_at is null or l.follow_up_note <> 'Angebot nachfassen' then
    raise exception 'TEST FAILED: follow-up cache not refreshed to the successor';
  end if;

  -- A closed follow-up cannot be closed twice.
  begin
    perform public.owner_complete_lead_follow_up(f.id, 'done');
    raise exception 'TEST FAILED: follow-up completed twice';
  exception when others then
    if position('already closed' in sqlerrm) = 0 then raise; end if;
  end;
end $$;

-- ===== Scenario: lost needs a reason, and reopening keeps history =====
do $$
declare v_lead uuid := current_setting('cq.lead_min')::uuid; n_before int; n_after int;
begin
  select count(*) into n_before from public.owner_lead_activity where lead_id = v_lead;
  begin
    perform public.owner_set_lead_stage(v_lead, 'lost');
    raise exception 'TEST FAILED: lost accepted without a reason';
  exception when others then
    if position('needs a reason' in sqlerrm) = 0 then raise; end if;
  end;

  perform public.owner_set_lead_stage(v_lead, 'lost', 'Budget für 2026 gestrichen');
  if (select lost_reason from public.owner_leads where id = v_lead) is null then
    raise exception 'TEST FAILED: loss reason not stored';
  end if;

  -- Reopening clears the loss and keeps every activity row.
  perform public.owner_set_lead_stage(v_lead, 'contacted');
  select count(*) into n_after from public.owner_lead_activity where lead_id = v_lead;
  if n_after <= n_before then raise exception 'TEST FAILED: reopening lost the timeline'; end if;
  if (select lost_at from public.owner_leads where id = v_lead) is not null then
    raise exception 'TEST FAILED: reopened lead still marked lost';
  end if;
end $$;

-- ===== Scenario: CRM tasks live in the ONE task table =====
do $$
declare v_task uuid;
begin
  v_task := (public.owner_create_lead_task(gen_random_uuid(), jsonb_build_object(
    'lead_id', current_setting('cq.lead'), 'title', 'Angebot vorbereiten',
    'due_date', (current_date - 1)::text, 'priority', 'high'))->>'task_id')::uuid;

  if (select customer_id from public.owner_customer_tasks where id = v_task) is not null then
    raise exception 'TEST FAILED: a lead task also carries a customer';
  end if;

  -- The one-owner constraint is a database fact, not a convention.
  begin
    update public.owner_customer_tasks set customer_id = gen_random_uuid() where id = v_task;
    raise exception 'TEST FAILED: a task was allowed to belong to both a lead and a customer';
  exception when check_violation or foreign_key_violation then null; end;

  perform public.owner_set_lead_task_status(v_task, 'completed');
  if (select completed_at from public.owner_customer_tasks where id = v_task) is null then
    raise exception 'TEST FAILED: completion was not stamped';
  end if;
end $$;

-- ===== Scenario: lead -> customer conversion =====
select set_config('cq.conv_key', gen_random_uuid()::text, false);
select set_config('cq.conv',
  public.owner_convert_lead_to_customer(current_setting('cq.conv_key')::uuid, jsonb_build_object(
    'lead_id', current_setting('cq.lead'),
    'services', jsonb_build_array('ai_receptionist', 'website')))::text, false);

do $$
declare v jsonb := current_setting('cq.conv')::jsonb; l record; n int;
begin
  if (v->>'customer_id') is null then raise exception 'TEST FAILED: no customer created'; end if;
  if (v->>'matched_existing')::boolean then raise exception 'TEST FAILED: unexpectedly matched an existing customer'; end if;

  select * into l from public.owner_leads where id = current_setting('cq.lead')::uuid;
  if l.id is null then raise exception 'TEST FAILED: the source lead was deleted'; end if;
  if l.stage <> 'won' or l.converted_customer_id::text <> (v->>'customer_id') then
    raise exception 'TEST FAILED: lead not marked won and linked';
  end if;
  -- Everything the owner typed survives the conversion.
  if l.email is null or l.phone is null or l.estimated_setup_cents is null then
    raise exception 'TEST FAILED: lead data lost on conversion';
  end if;
  select count(*) into n from public.owner_lead_activity where lead_id = l.id;
  if n < 5 then raise exception 'TEST FAILED: sales history truncated (% rows)', n; end if;

  -- Two services, and the AI Receptionist got a real onboarding engagement.
  select count(*) into n from public.owner_customer_services where customer_id = (v->>'customer_id')::uuid;
  if n <> 2 then raise exception 'TEST FAILED: % services attached, expected 2', n; end if;
  if (select engagement_id from jsonb_to_recordset(v->'services') as s(service_key text, engagement_id text)
      where s.service_key = 'ai_receptionist') is null then
    raise exception 'TEST FAILED: no engagement for the AI Receptionist';
  end if;
end $$;

-- Replaying the SAME key returns the stored result and changes nothing.
do $$
declare v jsonb; n int;
begin
  v := public.owner_convert_lead_to_customer(current_setting('cq.conv_key')::uuid,
         jsonb_build_object('lead_id', current_setting('cq.lead')));
  if v::text <> current_setting('cq.conv') then raise exception 'TEST FAILED: replay returned a different result'; end if;
  select count(*) into n from public.owner_customers
   where business_entity_id = current_setting('cq.entity')::uuid and company = 'Praxis Dr. Beispiel';
  if n <> 1 then raise exception 'TEST FAILED: replay created % customers', n; end if;
end $$;

-- A FRESH key on an already-converted lead — the double-click that happened in
-- another tab — must still land on the same customer and the same engagement.
do $$
declare v jsonb; n int; v_first jsonb := current_setting('cq.conv')::jsonb;
begin
  v := public.owner_convert_lead_to_customer(gen_random_uuid(), jsonb_build_object(
         'lead_id', current_setting('cq.lead'),
         'services', jsonb_build_array('ai_receptionist')));
  if (v->>'customer_id') <> (v_first->>'customer_id') then
    raise exception 'TEST FAILED: a second conversion produced a different customer';
  end if;
  select count(*) into n from public.owner_service_engagements e
    join public.owner_customer_services cs on cs.id = e.customer_service_id
   where cs.customer_id = (v->>'customer_id')::uuid and cs.service_key = 'ai_receptionist';
  if n <> 1 then raise exception 'TEST FAILED: % AI Receptionist engagements, expected exactly 1', n; end if;
  select count(*) into n from public.owner_customers
   where business_entity_id = current_setting('cq.entity')::uuid and company = 'Praxis Dr. Beispiel';
  if n <> 1 then raise exception 'TEST FAILED: a second customer was created'; end if;
end $$;

-- ===== Scenario: the go-live gate still blocks the converted customer =====
do $$
declare v jsonb := current_setting('cq.conv')::jsonb; v_eng uuid; g jsonb;
begin
  select e.id into v_eng from public.owner_service_engagements e
    join public.owner_customer_services cs on cs.id = e.customer_service_id
   where cs.customer_id = (v->>'customer_id')::uuid and cs.service_key = 'ai_receptionist';

  -- Read the gate the way the UI does: through the granted detail projection.
  -- owner_engagement_go_live_blockers itself is internal and revoked, which is
  -- exactly why the browser cannot ask it a friendlier question.
  g := public.owner_engagement_detail(v_eng)->'go_live';
  if (g->>'ready')::boolean then raise exception 'TEST FAILED: a brand-new engagement claims to be go-live ready'; end if;
  if (g->>'count')::int = 0 then raise exception 'TEST FAILED: no blockers on a brand-new engagement'; end if;

  begin
    perform public.owner_set_engagement_status(v_eng, 'live');
    raise exception 'TEST FAILED: go-live succeeded with open blockers';
  exception when others then
    if position('TEST FAILED' in sqlerrm) > 0 then raise; end if;
  end;
end $$;

-- ===== Scenario: the command center reports real rows, not estimates =====
do $$
declare v jsonb;
begin
  v := public.owner_command_center(current_setting('cq.entity')::uuid, current_date);
  if jsonb_typeof(v->'pipeline') <> 'array' then raise exception 'TEST FAILED: no pipeline'; end if;
  -- The overdue lead task created above must surface.
  if not exists (select 1 from jsonb_array_elements(v->'overdue_tasks') t
                 where t->>'title' = 'Angebot vorbereiten') then
    -- completed above, so it must NOT surface. Assert the opposite.
    null;
  else
    raise exception 'TEST FAILED: a completed task is still listed as overdue';
  end if;
  -- A converted lead is no longer chased for follow-ups.
  if exists (select 1 from jsonb_array_elements(v->'follow_ups') f
             where f->>'lead_id' = current_setting('cq.lead')) then
    raise exception 'TEST FAILED: a converted lead still appears in the follow-up queue';
  end if;
end $$;

-- ===== Scenario: cogniiq_admin and customers see nothing =====
create or replace function pg_temp.assert_no_crm_access(p_sub text, p_label text)
returns void language plpgsql as $$
declare c integer; blocked boolean;
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
  select count(*) into c from public.owner_leads;
  if c <> 0 then raise exception 'TEST FAILED: % read % leads', p_label, c; end if;
  select count(*) into c from public.owner_lead_activity;
  if c <> 0 then raise exception 'TEST FAILED: % read % sales notes', p_label, c; end if;
  select count(*) into c from public.owner_lead_integration_checks;
  if c <> 0 then raise exception 'TEST FAILED: % read % assessments', p_label, c; end if;

  blocked := false;
  begin
    perform public.owner_list_leads(current_setting('cq.entity')::uuid);
  exception when others then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: % could call owner_list_leads', p_label; end if;

  blocked := false;
  begin
    perform public.owner_command_center(current_setting('cq.entity')::uuid, current_date);
  exception when others then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: % could call owner_command_center', p_label; end if;

  blocked := false;
  begin
    perform public.owner_convert_lead_to_customer(gen_random_uuid(),
      jsonb_build_object('lead_id', current_setting('cq.lead')));
  exception when others then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: % could convert a lead', p_label; end if;
end $$;

select pg_temp.assert_no_crm_access(current_setting('cq.admin'),    'cogniiq_admin');
select pg_temp.assert_no_crm_access(current_setting('cq.customer'), 'customer');

reset role;
rollback;
SQL

echo "owner CRM smoke: PASS"
