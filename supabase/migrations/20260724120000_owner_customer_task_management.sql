-- =============================================================================
-- Owner customer & task management — the owner-side operational workspace.
--
-- Introduces a DEDICATED owner_customers spine (NOT the CRM client_accounts,
-- which is left untouched apart from an OPTIONAL reference for provenance), a
-- per-customer task checklist, and a sanitized customer activity timeline. Also
-- adds an offer↔customer link plus an archive flag on owner_offers so offers can
-- be archived without ever mutating their legal status or touching signed
-- acceptance evidence, offer versions, generated documents or signature files.
--
-- FULLY ADDITIVE + IDEMPOTENT: only CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT
-- EXISTS, CREATE OR REPLACE FUNCTION and DROP/CREATE for triggers & policies. It
-- does NOT modify any previously applied migration and re-applies cleanly.
--
-- Owner-only throughout: every table is RLS-guarded by is_platform_owner() and
-- every mutation goes through a SECURITY DEFINER, owner-gated RPC. The browser
-- never gets direct DELETE, and non-owner authenticated / anon roles get nothing.
-- Reuses the phase-0/finance helpers: is_platform_owner, is_database_admin,
-- request_is_service_role, set_updated_at, owner_write_audit_row,
-- owner_claim_idempotency, owner_finance_requests.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_customers (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  -- OPTIONAL provenance link to the CRM. Never written back to; client_accounts is not modified.
  client_account_id uuid references public.client_accounts(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  company text,
  contact_name text,
  email text,
  phone text,
  street text,
  postal_code text,
  city text,
  country_code text,
  status text not null default 'active'
    check (status in ('active', 'waiting', 'completed', 'archived')),
  notes text,
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A customer must carry at least one human-recognisable identifier.
  constraint owner_customers_has_identity check (
    length(trim(coalesce(company, ''))) > 0
    or length(trim(coalesce(contact_name, ''))) > 0
    or length(trim(coalesce(email, ''))) > 0
  )
);
create index if not exists owner_customers_entity_status_idx on public.owner_customers (business_entity_id, status);
create index if not exists owner_customers_client_account_idx on public.owner_customers (business_entity_id, client_account_id) where client_account_id is not null;
-- Normalized-email lookup key for de-duplication (case/space-insensitive). NOT unique:
-- manual customers may legitimately share no email, and matching is advisory, not enforced.
create index if not exists owner_customers_entity_email_idx on public.owner_customers (business_entity_id, lower(btrim(email))) where email is not null;
create index if not exists owner_customers_last_activity_idx on public.owner_customers (business_entity_id, last_activity_at desc);

create table if not exists public.owner_customer_tasks (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  customer_id uuid not null references public.owner_customers(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  sort_order int not null default 0,
  notes text,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_customer_tasks_title_not_blank check (length(trim(title)) > 0)
);
create index if not exists owner_customer_tasks_customer_idx on public.owner_customer_tasks (customer_id, sort_order);
create index if not exists owner_customer_tasks_entity_status_idx on public.owner_customer_tasks (business_entity_id, status);

-- Sanitized, append-only activity timeline. summary is human German text; it NEVER
-- contains secure tokens, storage paths, signature file locations or secrets.
create table if not exists public.owner_customer_activity (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  customer_id uuid not null references public.owner_customers(id) on delete cascade,
  event_type text not null,
  summary text not null,
  related_offer_id uuid references public.owner_offers(id) on delete set null,
  related_task_id uuid references public.owner_customer_tasks(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists owner_customer_activity_customer_idx on public.owner_customer_activity (customer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Offer ↔ customer link + archive flag (additive columns only).
--    NOTE ON owner_guard_offer: that trigger enforces finalized immutability via an
--    explicit BLOCKLIST of commercial columns (title, totals, recipient_*, valid_until,
--    …). owner_customer_id / archived_at / archived_by are deliberately NOT in that list,
--    so linking and archiving are permitted on finalized offers WITHOUT modifying the
--    guard, while every commercial field stays frozen. Archiving never changes `status`.
-- ---------------------------------------------------------------------------
alter table public.owner_offers
  add column if not exists owner_customer_id uuid references public.owner_customers(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;
create index if not exists owner_offers_owner_customer_idx on public.owner_offers (owner_customer_id) where owner_customer_id is not null;
create index if not exists owner_offers_archived_idx on public.owner_offers (business_entity_id, archived_at) where archived_at is not null;

commit;

-- ---------------------------------------------------------------------------
-- 3. Triggers: updated_at + append-only audit (reuses the security-definer factory).
-- ---------------------------------------------------------------------------
begin;

drop trigger if exists owner_customers_set_updated_at on public.owner_customers;
create trigger owner_customers_set_updated_at before update on public.owner_customers
  for each row execute function public.set_updated_at();
drop trigger if exists owner_customer_tasks_set_updated_at on public.owner_customer_tasks;
create trigger owner_customer_tasks_set_updated_at before update on public.owner_customer_tasks
  for each row execute function public.set_updated_at();

drop trigger if exists owner_customers_audit on public.owner_customers;
create trigger owner_customers_audit after insert or update or delete on public.owner_customers
  for each row execute function public.owner_write_audit_row('owner_customers');
drop trigger if exists owner_customer_tasks_audit on public.owner_customer_tasks;
create trigger owner_customer_tasks_audit after insert or update or delete on public.owner_customer_tasks
  for each row execute function public.owner_write_audit_row('owner_customer_tasks');

commit;

-- ---------------------------------------------------------------------------
-- 4. RLS + grants (owner-only). Activity is append-only for owners (no update/delete);
--    inserts happen only inside SECURITY DEFINER RPCs.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array['owner_customers', 'owner_customer_tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())', t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

alter table public.owner_customer_activity enable row level security;
drop policy if exists owner_customer_activity_owner_select on public.owner_customer_activity;
create policy owner_customer_activity_owner_select on public.owner_customer_activity for select to authenticated using (public.is_platform_owner());
drop policy if exists owner_customer_activity_owner_insert on public.owner_customer_activity;
create policy owner_customer_activity_owner_insert on public.owner_customer_activity for insert to authenticated with check (public.is_platform_owner());
revoke all on table public.owner_customer_activity from public, anon, authenticated;
grant select, insert on table public.owner_customer_activity to authenticated;
grant select, insert, update, delete on table public.owner_customer_activity to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 5. Activity helper (SECURITY DEFINER): records one sanitized event and bumps the
--    customer's last_activity_at. Only ever called from the owner-gated RPCs below.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_record_customer_activity(
  p_customer_id uuid, p_event_type text, p_summary text,
  p_offer_id uuid default null, p_task_id uuid default null
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_entity uuid;
begin
  select business_entity_id into v_entity from public.owner_customers where id = p_customer_id;
  if v_entity is null then return; end if;
  insert into public.owner_customer_activity (business_entity_id, customer_id, event_type, summary, related_offer_id, related_task_id, actor_user_id)
  values (v_entity, p_customer_id, p_event_type, left(p_summary, 500), p_offer_id, p_task_id, auth.uid());
  update public.owner_customers set last_activity_at = now() where id = p_customer_id;
end;
$$;
revoke execute on function public.owner_record_customer_activity(uuid, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.owner_record_customer_activity(uuid, text, text, uuid, uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6. Customer RPCs (owner-only, SECURITY DEFINER with safe search_path).
--    De-duplication rules (create): prefer an exact client_account_id match, else a
--    normalized-email match; NEVER merge on company name alone; when uncertain, create
--    a separate record.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_create_customer(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; v_entity uuid; v_client uuid; v_email text; v_norm text;
  v_company text; v_contact text; v_id uuid; v_match uuid; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_create_customer');
  if v_existing is not null then return v_existing; end if;

  v_entity := nullif(p_payload->>'business_entity_id','')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = v_entity) then raise exception 'unknown business entity'; end if;

  v_client  := nullif(p_payload->>'client_account_id','')::uuid;
  v_email   := nullif(btrim(p_payload->>'email'), '');
  v_norm    := lower(v_email);
  v_company := nullif(btrim(p_payload->>'company'), '');
  v_contact := nullif(btrim(p_payload->>'contact_name'), '');
  if v_company is null and v_contact is null and v_email is null then
    raise exception 'a customer needs at least a company, a contact or an email';
  end if;

  -- De-dup: strongest key first (linked CRM account), then normalized email. Company alone never matches.
  if v_client is not null then
    select id into v_match from public.owner_customers where business_entity_id = v_entity and client_account_id = v_client limit 1;
  end if;
  if v_match is null and v_norm is not null then
    select id into v_match from public.owner_customers where business_entity_id = v_entity and lower(btrim(email)) = v_norm limit 1;
  end if;
  if v_match is not null then
    v_result := jsonb_build_object('customer_id', v_match, 'matched', true);
    update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
    return v_result;
  end if;

  insert into public.owner_customers (business_entity_id, client_account_id, organization_id, company, contact_name,
    email, phone, street, postal_code, city, country_code, status, notes, created_by)
  values (v_entity, v_client, nullif(p_payload->>'organization_id','')::uuid, v_company, v_contact,
    v_email, nullif(btrim(p_payload->>'phone'),''), nullif(btrim(p_payload->>'street'),''),
    nullif(btrim(p_payload->>'postal_code'),''), nullif(btrim(p_payload->>'city'),''),
    nullif(btrim(p_payload->>'country_code'),''),
    coalesce(nullif(p_payload->>'status',''), 'active'), nullif(btrim(p_payload->>'notes'),''), auth.uid())
  returning id into v_id;

  perform public.owner_record_customer_activity(v_id, 'customer_created', 'Kunde angelegt: ' || coalesce(v_company, v_contact, v_email));

  v_result := jsonb_build_object('customer_id', v_id, 'matched', false);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

create or replace function public.owner_update_customer(p_customer_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into c from public.owner_customers where id = p_customer_id;
  if c.id is null then raise exception 'customer not found'; end if;

  update public.owner_customers set
    company        = case when p_patch ? 'company'        then nullif(btrim(p_patch->>'company'),'')        else company end,
    contact_name   = case when p_patch ? 'contact_name'   then nullif(btrim(p_patch->>'contact_name'),'')   else contact_name end,
    email          = case when p_patch ? 'email'          then nullif(btrim(p_patch->>'email'),'')          else email end,
    phone          = case when p_patch ? 'phone'          then nullif(btrim(p_patch->>'phone'),'')          else phone end,
    street         = case when p_patch ? 'street'         then nullif(btrim(p_patch->>'street'),'')         else street end,
    postal_code    = case when p_patch ? 'postal_code'    then nullif(btrim(p_patch->>'postal_code'),'')    else postal_code end,
    city           = case when p_patch ? 'city'           then nullif(btrim(p_patch->>'city'),'')           else city end,
    country_code   = case when p_patch ? 'country_code'   then nullif(btrim(p_patch->>'country_code'),'')   else country_code end,
    notes          = case when p_patch ? 'notes'          then nullif(btrim(p_patch->>'notes'),'')          else notes end
  where id = p_customer_id;
  return jsonb_build_object('customer_id', p_customer_id);
end;
$$;

-- Status transitions (active|waiting|completed|archived). Completing NEVER touches
-- tasks or offers; all history is preserved; reopening is allowed. Archiving a customer
-- likewise does not archive its offers or tasks.
create or replace function public.owner_set_customer_status(p_customer_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; v_event text; v_summary text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_status not in ('active', 'waiting', 'completed', 'archived') then raise exception 'invalid customer status %', p_status; end if;
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;

  update public.owner_customers set
    status = p_status,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end,
    completed_by = case when p_status = 'completed' then coalesce(completed_by, auth.uid()) else null end
  where id = p_customer_id;

  v_event := case
    when p_status = 'completed' then 'customer_completed'
    when c.status = 'completed' and p_status <> 'completed' then 'customer_reopened'
    when p_status = 'archived' then 'customer_archived'
    else 'customer_status_changed' end;
  v_summary := case
    when p_status = 'completed' then 'Kunde als abgeschlossen markiert'
    when v_event = 'customer_reopened' then 'Kunde wieder geöffnet'
    when p_status = 'archived' then 'Kunde archiviert'
    when p_status = 'waiting' then 'Kunde auf „Wartend" gesetzt'
    else 'Kunde auf „Aktiv" gesetzt' end;
  perform public.owner_record_customer_activity(p_customer_id, v_event, v_summary);
  return jsonb_build_object('customer_id', p_customer_id, 'status', p_status);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Task RPCs (owner-only). Cancelled is a distinct terminal state and is NEVER
--    counted as completed. Reordering persists sort_order for the customer's tasks.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_create_customer_task(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_customer uuid; v_entity uuid; v_status text; v_id uuid; v_sort int; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_create_customer_task');
  if v_existing is not null then return v_existing; end if;

  v_customer := nullif(p_payload->>'customer_id','')::uuid;
  select business_entity_id into v_entity from public.owner_customers where id = v_customer;
  if v_entity is null then raise exception 'customer not found'; end if;
  if length(trim(coalesce(p_payload->>'title',''))) = 0 then raise exception 'a task title is required'; end if;
  v_status := coalesce(nullif(p_payload->>'status',''), 'open');
  if v_status not in ('open','in_progress','completed','cancelled') then raise exception 'invalid task status %', v_status; end if;

  select coalesce(max(sort_order), -1) + 1 into v_sort from public.owner_customer_tasks where customer_id = v_customer;

  insert into public.owner_customer_tasks (business_entity_id, customer_id, title, description, status, priority,
    due_date, sort_order, notes, completed_at, completed_by, created_by)
  values (v_entity, v_customer, btrim(p_payload->>'title'), nullif(btrim(p_payload->>'description'),''),
    v_status, coalesce(nullif(p_payload->>'priority',''), 'normal'),
    nullif(p_payload->>'due_date','')::date, coalesce((p_payload->>'sort_order')::int, v_sort),
    nullif(btrim(p_payload->>'notes'),''),
    case when v_status = 'completed' then now() else null end,
    case when v_status = 'completed' then auth.uid() else null end, auth.uid())
  returning id into v_id;

  perform public.owner_record_customer_activity(v_customer, 'task_created', 'Aufgabe erstellt: ' || btrim(p_payload->>'title'), null, v_id);

  v_result := jsonb_build_object('task_id', v_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

create or replace function public.owner_update_customer_task(p_task_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into t from public.owner_customer_tasks where id = p_task_id;
  if t.id is null then raise exception 'task not found'; end if;
  if (p_patch ? 'priority') and (p_patch->>'priority') not in ('low','normal','high','urgent') then raise exception 'invalid task priority'; end if;

  update public.owner_customer_tasks set
    title       = case when p_patch ? 'title'       then btrim(p_patch->>'title')                else title end,
    description = case when p_patch ? 'description' then nullif(btrim(p_patch->>'description'),'') else description end,
    priority    = case when p_patch ? 'priority'    then p_patch->>'priority'                     else priority end,
    due_date    = case when p_patch ? 'due_date'    then nullif(p_patch->>'due_date','')::date    else due_date end,
    notes       = case when p_patch ? 'notes'       then nullif(btrim(p_patch->>'notes'),'')       else notes end
  where id = p_task_id;
  return jsonb_build_object('task_id', p_task_id);
end;
$$;

create or replace function public.owner_set_customer_task_status(p_task_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record; v_event text; v_summary text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_status not in ('open','in_progress','completed','cancelled') then raise exception 'invalid task status %', p_status; end if;
  select * into t from public.owner_customer_tasks where id = p_task_id for update;
  if t.id is null then raise exception 'task not found'; end if;

  update public.owner_customer_tasks set
    status = p_status,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end,
    completed_by = case when p_status = 'completed' then coalesce(completed_by, auth.uid()) else null end
  where id = p_task_id;

  v_event := case
    when p_status = 'completed' then 'task_completed'
    when t.status = 'completed' and p_status <> 'completed' then 'task_reopened'
    when p_status = 'cancelled' then 'task_cancelled'
    else 'task_status_changed' end;
  v_summary := case
    when p_status = 'completed' then 'Aufgabe erledigt: ' || t.title
    when v_event = 'task_reopened' then 'Aufgabe wieder geöffnet: ' || t.title
    when p_status = 'cancelled' then 'Aufgabe abgebrochen: ' || t.title
    else 'Aufgabe aktualisiert: ' || t.title end;
  perform public.owner_record_customer_activity(t.customer_id, v_event, v_summary, null, p_task_id);
  return jsonb_build_object('task_id', p_task_id, 'status', p_status);
end;
$$;

create or replace function public.owner_delete_customer_task(p_task_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into t from public.owner_customer_tasks where id = p_task_id;
  if t.id is null then raise exception 'task not found'; end if;
  delete from public.owner_customer_tasks where id = p_task_id;
  perform public.owner_record_customer_activity(t.customer_id, 'task_deleted', 'Aufgabe gelöscht: ' || t.title);
  return jsonb_build_object('task_id', p_task_id, 'deleted', true);
end;
$$;

-- Reorder: assign sort_order by array position for the ids that belong to this customer.
create or replace function public.owner_reorder_customer_tasks(p_customer_id uuid, p_ordered_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_entity uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select business_entity_id into v_entity from public.owner_customers where id = p_customer_id;
  if v_entity is null then raise exception 'customer not found'; end if;
  update public.owner_customer_tasks t
  set sort_order = ord.pos
  from (select id, (ordinality - 1)::int as pos from unnest(p_ordered_ids) with ordinality as u(id, ordinality)) ord
  where t.id = ord.id and t.customer_id = p_customer_id;
  return jsonb_build_object('customer_id', p_customer_id, 'count', coalesce(array_length(p_ordered_ids, 1), 0));
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 8. Offer archive / link RPCs (owner-only). Archiving is a flag; it NEVER changes the
--    legal offer status and NEVER deletes acceptance events, versions, generated
--    documents or signature files. Drafts are deleted (delete_owner_offer_draft), not
--    archived. Accepted offers may only be archived.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_archive_offer(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status = 'draft' then raise exception 'draft offers are deleted, not archived'; end if;
  if o.archived_at is not null then
    return jsonb_build_object('offer_id', p_offer_id, 'archived', true, 'idempotent', true);
  end if;
  -- Only the archive flag changes. status and all commercial fields are left untouched.
  update public.owner_offers set archived_at = now(), archived_by = auth.uid() where id = p_offer_id;
  if o.owner_customer_id is not null then
    perform public.owner_record_customer_activity(o.owner_customer_id, 'offer_archived',
      'Angebot archiviert: ' || coalesce(o.offer_number, o.title, 'Entwurf'), p_offer_id);
  end if;
  return jsonb_build_object('offer_id', p_offer_id, 'archived', true);
end;
$$;

create or replace function public.owner_unarchive_offer(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  update public.owner_offers set archived_at = null, archived_by = null where id = p_offer_id;
  return jsonb_build_object('offer_id', p_offer_id, 'archived', false);
end;
$$;

-- Link (or unlink with NULL) an offer to an owner customer. Permitted on finalized offers
-- because owner_customer_id is outside the guard's immutability blocklist.
create or replace function public.owner_link_offer_customer(p_offer_id uuid, p_owner_customer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; v_cust_entity uuid; v_prev uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  v_prev := o.owner_customer_id;
  if p_owner_customer_id is not null then
    select business_entity_id into v_cust_entity from public.owner_customers where id = p_owner_customer_id;
    if v_cust_entity is null then raise exception 'customer not found'; end if;
    if v_cust_entity <> o.business_entity_id then raise exception 'customer belongs to a different business entity'; end if;
  end if;
  update public.owner_offers set owner_customer_id = p_owner_customer_id where id = p_offer_id;
  if p_owner_customer_id is not null and p_owner_customer_id is distinct from v_prev then
    perform public.owner_record_customer_activity(p_owner_customer_id, 'offer_linked',
      'Angebot zugeordnet: ' || coalesce(o.offer_number, o.title, 'Entwurf'), p_offer_id);
  end if;
  return jsonb_build_object('offer_id', p_offer_id, 'owner_customer_id', p_owner_customer_id);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 9. Read RPCs (owner-only): enriched customer list + full customer detail.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_list_customers(p_entity uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select coalesce(jsonb_agg(row order by row->>'last_activity_at' desc), '[]'::jsonb) into v_result
  from (
    select jsonb_build_object(
      'id', c.id, 'company', c.company, 'contact_name', c.contact_name, 'email', c.email, 'phone', c.phone,
      'status', c.status, 'notes', c.notes, 'client_account_id', c.client_account_id,
      'last_activity_at', c.last_activity_at, 'created_at', c.created_at, 'completed_at', c.completed_at,
      'offer_count', (select count(*) from public.owner_offers o where o.owner_customer_id = c.id),
      'open_task_count', (select count(*) from public.owner_customer_tasks t where t.customer_id = c.id and t.status in ('open','in_progress')),
      'completed_task_count', (select count(*) from public.owner_customer_tasks t where t.customer_id = c.id and t.status = 'completed')
    ) as row
    from public.owner_customers c
    where c.business_entity_id = p_entity
  ) s;
  return v_result;
end;
$$;

create or replace function public.owner_customer_detail(p_customer_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_customer jsonb; v_offers jsonb; v_tasks jsonb; v_activity jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select to_jsonb(c) into v_customer from public.owner_customers c where c.id = p_customer_id;
  if v_customer is null then raise exception 'customer not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id, 'offer_number', o.offer_number, 'title', o.title, 'status', o.status,
      'currency', o.currency, 'gross_total_cents', o.gross_total_cents,
      'created_at', o.created_at, 'valid_until', o.valid_until, 'accepted_at', o.accepted_at,
      'archived_at', o.archived_at,
      'sent_at', (select max(j.sent_at) from public.owner_automation_jobs j where j.offer_id = o.id and j.job_type = 'offer_email')
    ) order by o.created_at desc), '[]'::jsonb) into v_offers
  from public.owner_offers o where o.owner_customer_id = p_customer_id;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.sort_order, t.created_at), '[]'::jsonb) into v_tasks
  from public.owner_customer_tasks t where t.customer_id = p_customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'event_type', a.event_type, 'summary', a.summary, 'created_at', a.created_at,
      'related_offer_id', a.related_offer_id, 'related_task_id', a.related_task_id
    ) order by a.created_at desc), '[]'::jsonb) into v_activity
  from (select * from public.owner_customer_activity where customer_id = p_customer_id order by created_at desc limit 100) a;

  return jsonb_build_object('customer', v_customer, 'offers', v_offers, 'tasks', v_tasks, 'activity', v_activity);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 10. Grants for the owner RPCs. Browser owners may execute; service_role for server
--     contexts. Never anon/public.
-- ---------------------------------------------------------------------------
begin;
do $$
declare sig text;
begin
  foreach sig in array array[
    'owner_create_customer(uuid, jsonb)',
    'owner_update_customer(uuid, jsonb)',
    'owner_set_customer_status(uuid, text)',
    'owner_create_customer_task(uuid, jsonb)',
    'owner_update_customer_task(uuid, jsonb)',
    'owner_set_customer_task_status(uuid, text)',
    'owner_delete_customer_task(uuid)',
    'owner_reorder_customer_tasks(uuid, uuid[])',
    'owner_archive_offer(uuid)',
    'owner_unarchive_offer(uuid)',
    'owner_link_offer_customer(uuid, uuid)',
    'owner_list_customers(uuid)',
    'owner_customer_detail(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', sig);
    execute format('grant execute on function public.%s to authenticated, service_role', sig);
  end loop;
end;
$$;
commit;

-- ---------------------------------------------------------------------------
-- 11. Backfill (idempotent + additive): materialize owner_customers from existing
--     linked offers so counts populate immediately. Grouping keys ONLY: CRM
--     client_account_id (strongest), else normalized recipient_email. Offers with
--     neither are left unlinked (owner links them later) — company name is NEVER used
--     as a merge key. Re-running is safe (NOT EXISTS guards + owner_customer_id IS NULL).
-- ---------------------------------------------------------------------------
begin;

-- (a) One customer per (entity, client_account_id) drawn from the CRM snapshot.
insert into public.owner_customers (business_entity_id, client_account_id, organization_id, company, contact_name, email, phone, status)
select distinct on (o.business_entity_id, o.client_account_id)
  o.business_entity_id, o.client_account_id, o.organization_id,
  coalesce(ca.legal_name, ca.display_name), ca.primary_contact_name, ca.primary_email, ca.phone, 'active'
from public.owner_offers o
join public.client_accounts ca on ca.id = o.client_account_id
where o.client_account_id is not null
  and not exists (
    select 1 from public.owner_customers c
    where c.business_entity_id = o.business_entity_id and c.client_account_id = o.client_account_id)
order by o.business_entity_id, o.client_account_id, o.created_at;

update public.owner_offers o
set owner_customer_id = c.id
from public.owner_customers c
where o.owner_customer_id is null and o.client_account_id is not null
  and c.business_entity_id = o.business_entity_id and c.client_account_id = o.client_account_id;

-- (b) One customer per (entity, normalized recipient_email) for manual-recipient offers.
insert into public.owner_customers (business_entity_id, organization_id, company, contact_name, email, phone, status)
select distinct on (o.business_entity_id, lower(btrim(o.recipient_email)))
  o.business_entity_id, o.organization_id, o.recipient_company, o.recipient_contact_name,
  lower(btrim(o.recipient_email)), o.recipient_phone, 'active'
from public.owner_offers o
where o.client_account_id is null
  and nullif(btrim(o.recipient_email), '') is not null
  and not exists (
    select 1 from public.owner_customers c
    where c.business_entity_id = o.business_entity_id and lower(btrim(coalesce(c.email, ''))) = lower(btrim(o.recipient_email)))
order by o.business_entity_id, lower(btrim(o.recipient_email)), o.created_at;

update public.owner_offers o
set owner_customer_id = c.id
from public.owner_customers c
where o.owner_customer_id is null and o.client_account_id is null
  and nullif(btrim(o.recipient_email), '') is not null
  and c.business_entity_id = o.business_entity_id
  and lower(btrim(coalesce(c.email, ''))) = lower(btrim(o.recipient_email));

commit;

-- =============================================================================
-- End of additive owner customer & task management migration.
-- =============================================================================
