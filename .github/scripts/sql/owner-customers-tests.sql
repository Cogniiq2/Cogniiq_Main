-- Owner customer & task management — throwaway-PostgreSQL regression suite. Exercises the real
-- migration 20260724120000 end to end: customer creation + de-duplication, the task lifecycle
-- (create/complete/reopen/cancel/delete/reorder), customer completion with and without open tasks,
-- customer + task-count aggregation, offer archive vs. draft delete, accepted-offer protection,
-- signed-evidence preservation, and owner-only access enforcement. Assertions raise on failure.

\set ON_ERROR_STOP on

-- A real profile so auth.uid() (the app.uid GUC) satisfies the created_by/completed_by FKs.
select set_config('app.role', 'owner', false);
select set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);
insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Main owner-role flow.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid; v_a uuid; v_a2 uuid; v_c1 uuid; v_c2 uuid;
  v_t1 uuid; v_t2 uuid; v_t3 uuid; r jsonb;
  v_open int; v_done int; v_offer_count int;
  v_draft uuid; v_final uuid; v_acc uuid; v_client uuid;
  v_threw boolean; v_status text; v_archived timestamptz;
begin
  insert into public.owner_business_entities (display_name) values ('Test Entity') returning id into v_entity;
  insert into public.client_accounts (id) values (gen_random_uuid()) returning id into v_client;

  -- (1) create customer
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'Firma A', 'email', 'a@example.de'));
  v_a := (r->>'customer_id')::uuid;
  if (r->>'matched')::boolean then raise exception 'TEST create: first create must not match'; end if;

  -- (2) de-dup by normalized email (different case) returns the SAME customer
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'Firma A GmbH', 'email', 'A@EXAMPLE.DE'));
  v_a2 := (r->>'customer_id')::uuid;
  if v_a2 <> v_a or not (r->>'matched')::boolean then raise exception 'TEST dedup-email: normalized email must reuse the existing customer'; end if;

  -- (3) company-only NEVER merges: two customers, same company, no email → two distinct rows
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'Same GmbH'));
  v_c1 := (r->>'customer_id')::uuid;
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'Same GmbH'));
  v_c2 := (r->>'customer_id')::uuid;
  if v_c1 = v_c2 then raise exception 'TEST no-company-merge: same company without email must not merge'; end if;

  -- (3b) de-dup by linked client_account_id
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'Linked', 'client_account_id', v_client));
  v_c1 := (r->>'customer_id')::uuid;
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'Linked 2', 'client_account_id', v_client));
  if (r->>'customer_id')::uuid <> v_c1 or not (r->>'matched')::boolean then raise exception 'TEST dedup-account: same client_account must reuse the customer'; end if;

  -- (4) tasks: create three, complete one, reopen, cancel one
  v_t1 := (public.owner_create_customer_task(gen_random_uuid(), jsonb_build_object('customer_id', v_a, 'title', 'Aufgabe 1'))->>'task_id')::uuid;
  v_t2 := (public.owner_create_customer_task(gen_random_uuid(), jsonb_build_object('customer_id', v_a, 'title', 'Aufgabe 2', 'priority', 'high'))->>'task_id')::uuid;
  v_t3 := (public.owner_create_customer_task(gen_random_uuid(), jsonb_build_object('customer_id', v_a, 'title', 'Aufgabe 3'))->>'task_id')::uuid;

  perform public.owner_set_customer_task_status(v_t1, 'completed');
  select status, completed_at is not null into v_status, v_threw from public.owner_customer_tasks where id = v_t1;
  if v_status <> 'completed' or not v_threw then raise exception 'TEST complete-task: status/completed_at not set'; end if;

  perform public.owner_set_customer_task_status(v_t1, 'open');
  select status, completed_at is null into v_status, v_threw from public.owner_customer_tasks where id = v_t1;
  if v_status <> 'open' or not v_threw then raise exception 'TEST reopen-task: reopen must clear completed_at'; end if;

  perform public.owner_set_customer_task_status(v_t2, 'cancelled');

  -- (5) aggregation: open counts open+in_progress; completed counts ONLY status=completed (cancelled excluded)
  perform public.owner_set_customer_task_status(v_t3, 'completed');
  select (c->>'open_task_count')::int, (c->>'completed_task_count')::int
    into v_open, v_done
    from jsonb_array_elements(public.owner_list_customers(v_entity)) c
    where (c->>'id')::uuid = v_a;
  if v_open <> 1 then raise exception 'TEST counts: open_task_count expected 1, got %', v_open; end if;
  if v_done <> 1 then raise exception 'TEST counts: completed_task_count expected 1 (cancelled excluded), got %', v_done; end if;

  -- (6) reorder persists sort_order
  perform public.owner_reorder_customer_tasks(v_a, array[v_t3, v_t1]);
  if (select sort_order from public.owner_customer_tasks where id = v_t3) <> 0
     or (select sort_order from public.owner_customer_tasks where id = v_t1) <> 1 then
    raise exception 'TEST reorder: sort_order not persisted';
  end if;

  -- (7) delete a task
  perform public.owner_delete_customer_task(v_t2);
  if exists (select 1 from public.owner_customer_tasks where id = v_t2) then raise exception 'TEST delete-task: task not removed'; end if;

  -- (8) customer completion WITH open tasks: tasks + history preserved, status flips
  perform public.owner_set_customer_status(v_a, 'completed');
  select status into v_status from public.owner_customers where id = v_a;
  if v_status <> 'completed' then raise exception 'TEST complete-customer: status not completed'; end if;
  if (select status from public.owner_customer_tasks where id = v_t1) <> 'open' then
    raise exception 'TEST complete-customer: open task must NOT be auto-completed';
  end if;
  if not exists (select 1 from public.owner_customer_activity where customer_id = v_a and event_type = 'customer_completed') then
    raise exception 'TEST complete-customer: activity not recorded';
  end if;

  -- reopen customer
  perform public.owner_set_customer_status(v_a, 'active');
  if (select status from public.owner_customers where id = v_a) <> 'active' then raise exception 'TEST reopen-customer: not reopened'; end if;

  -- (9) offers: draft / finalized / accepted, all linked to customer A
  insert into public.owner_offers (business_entity_id, owner_customer_id, status) values (v_entity, v_a, 'draft') returning id into v_draft;
  insert into public.owner_offers (business_entity_id, owner_customer_id, status, finalized_version) values (v_entity, v_a, 'finalized', 1) returning id into v_final;
  insert into public.owner_offers (business_entity_id, owner_customer_id, status) values (v_entity, v_a, 'accepted') returning id into v_acc;
  insert into public.owner_offer_acceptance_events (business_entity_id, offer_id, decision, event_order, signer_name)
    values (v_entity, v_acc, 'accepted', 1, 'Max Muster');

  -- archive finalized: flag set, legal status unchanged
  perform public.owner_archive_offer(v_final);
  select status, archived_at into v_status, v_archived from public.owner_offers where id = v_final;
  if v_archived is null then raise exception 'TEST archive-finalized: archived_at not set'; end if;
  if v_status <> 'finalized' then raise exception 'TEST archive-finalized: legal status must not change'; end if;

  -- archiving the CUSTOMER must NOT archive its offers
  perform public.owner_set_customer_status(v_a, 'archived');
  if (select archived_at from public.owner_offers where id = v_draft) is not null then
    raise exception 'TEST archive-customer: must not archive offers';
  end if;
  perform public.owner_set_customer_status(v_a, 'active');

  -- archive accepted: only a flag; acceptance evidence preserved; status stays accepted
  perform public.owner_archive_offer(v_acc);
  if (select status from public.owner_offers where id = v_acc) <> 'accepted' then raise exception 'TEST archive-accepted: legal status changed'; end if;
  if not exists (select 1 from public.owner_offer_acceptance_events where offer_id = v_acc) then
    raise exception 'TEST evidence: acceptance event was deleted by archive';
  end if;

  -- (10) draft may NOT be archived (drafts are deleted instead)
  v_threw := false;
  begin perform public.owner_archive_offer(v_draft); exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST archive-draft-blocked: archiving a draft must raise'; end if;

  -- accepted offer may NEVER be hard-deleted (DB guard), even for the owner
  v_threw := false;
  begin delete from public.owner_offers where id = v_acc; exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST accepted-delete-blocked: deleting an accepted offer must raise'; end if;
  if not exists (select 1 from public.owner_offers where id = v_acc) then raise exception 'TEST accepted-delete-blocked: accepted offer was deleted'; end if;

  -- draft may be permanently deleted via the RPC
  perform public.delete_owner_offer_draft(gen_random_uuid(), v_draft);
  if exists (select 1 from public.owner_offers where id = v_draft) then raise exception 'TEST draft-delete: draft not removed'; end if;

  -- unarchive restores the accepted offer to the active view (status still accepted)
  perform public.owner_unarchive_offer(v_acc);
  if (select archived_at from public.owner_offers where id = v_acc) is not null then raise exception 'TEST unarchive: archived_at not cleared'; end if;

  -- offer_count aggregation reflects the two remaining linked offers (finalized + accepted)
  select (c->>'offer_count')::int into v_offer_count
    from jsonb_array_elements(public.owner_list_customers(v_entity)) c where (c->>'id')::uuid = v_a;
  if v_offer_count <> 2 then raise exception 'TEST offer-count: expected 2, got %', v_offer_count; end if;

  raise notice 'owner-customers: owner-role flow OK';
end $$;

-- ---------------------------------------------------------------------------
-- Owner-only enforcement: non-owner (authenticated) and anon are rejected by the RPCs.
-- ---------------------------------------------------------------------------
do $$
declare v_entity uuid; v_threw boolean;
begin
  select id into v_entity from public.owner_business_entities limit 1;

  perform set_config('app.role', 'authenticated', false);
  v_threw := false;
  begin perform public.owner_create_customer(gen_random_uuid(), jsonb_build_object('business_entity_id', v_entity, 'company', 'X')); exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST owner-only: authenticated non-owner could create a customer'; end if;

  v_threw := false;
  begin perform public.owner_list_customers(v_entity); exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST owner-only: authenticated non-owner could list customers'; end if;

  perform set_config('app.role', 'anon', false);
  v_threw := false;
  begin perform public.owner_create_customer_task(gen_random_uuid(), jsonb_build_object('customer_id', gen_random_uuid(), 'title', 'x')); exception when others then v_threw := true; end;
  if not v_threw then raise exception 'TEST owner-only: anon could create a task'; end if;

  perform set_config('app.role', 'owner', false);
  raise notice 'owner-customers: owner-only enforcement OK';
end $$;

-- ---------------------------------------------------------------------------
-- Structural: RLS is enabled and owner policies + grants exist.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='owner_customers' and policyname='owner_customers_owner_all') then
    raise exception 'TEST rls: owner_customers owner policy missing';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='owner_customer_tasks' and policyname='owner_customer_tasks_owner_all') then
    raise exception 'TEST rls: owner_customer_tasks owner policy missing';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='owner_customer_activity' and policyname='owner_customer_activity_owner_select') then
    raise exception 'TEST rls: owner_customer_activity select policy missing';
  end if;
  if (select relrowsecurity from pg_class where oid = 'public.owner_customers'::regclass) is not true then
    raise exception 'TEST rls: RLS not enabled on owner_customers';
  end if;
  raise notice 'owner-customers: RLS structure OK';
end $$;

select 'owner-customers SQL tests: ALL PASSED' as result;
