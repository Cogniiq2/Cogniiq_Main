-- ===========================================================================
-- Owner workspace organization: folders, trash, and one coherent delete path.
--
-- ADDITIVE. Nothing here is business, accounting or tax truth.
--
-- Two ideas, kept strictly apart:
--
--  1. ORGANIZATION. `owner_workspace_folders` and `owner_workspace_item_state`
--     record where the owner filed a record and whether it should still appear
--     in the day-to-day list. That is a view preference and nothing else. No
--     tax, EÜR, VAT, payment, receivable or invoice figure anywhere in this
--     schema reads either table, and no query in this file adds a
--     `trashed_at is null` predicate to an accounting statement. Putting a paid
--     expense in the Papierkorb leaves it in the EÜR; putting an issued invoice
--     there leaves the receivable exactly where it was.
--
--  2. DELETION. `owner_workspace_delete_preflight` states, per record and
--     server-side, what "Löschen" can honestly mean for it, and
--     `owner_workspace_delete_items` performs precisely that. The browser never
--     decides. The three honest outcomes are a genuine hard delete, the
--     record's own sanctioned correction (Storno / archive) followed by removal
--     from the workspace, and removal from the workspace alone.
--
-- What this migration deliberately does NOT do: reuse an invoice number, roll
-- back a counter, weaken the issued-invoice guard, cascade a payment away,
-- destroy an offer's immutable version, acceptance evidence or generated
-- documents, or grant anon or a non-owner any access at all.
--
-- One correction is intentional and is the reason the expense path is new
-- rather than reusing delete_owner_draft_expense: `review_status = 'reviewed'`
-- BY ITSELF no longer blocks deletion. Clicking "Geprüft" by mistake is a
-- review-workflow event, not an accounting fact, and it left the owner editing
-- Supabase by hand. Real dependencies — a recorded payment, a non-zero paid
-- amount, a linked finance document — still block, and still always will.
-- The old RPC is left untouched for its existing callers and tests.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Scope vocabulary.
--
--    A folder belongs to exactly ONE resource type, so an invoice folder can
--    never appear in Expenses. The constraint carries the full owner-record
--    vocabulary so a later surface needs no schema change, but the delete
--    preflight below models only the three scopes that have a real collection
--    surface today (invoice, offer, expense) and refuses every other one.
-- ---------------------------------------------------------------------------
create or replace function public.owner_workspace_scopes()
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select array[
    'invoice', 'offer', 'expense', 'payment', 'revenue_contract',
    'subscription', 'asset', 'document', 'customer'
  ]::text[];
$$;

comment on function public.owner_workspace_scopes() is
  'Resource types the owner workspace organization layer accepts. Organization only — never business truth.';

create table if not exists public.owner_workspace_folders (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  scope text not null check (scope = any (public.owner_workspace_scopes())),
  name text not null check (btrim(name) <> '' and char_length(btrim(name)) <= 60),
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness inside one entity + scope. "Archiv" and "archiv"
-- are the same folder to a human, so they are the same folder here.
create unique index if not exists owner_workspace_folders_unique_name
  on public.owner_workspace_folders (business_entity_id, scope, lower(btrim(name)));

create index if not exists owner_workspace_folders_scope_idx
  on public.owner_workspace_folders (business_entity_id, scope, sort_order, created_at);

-- One row per organised record. Absent means "Ohne Ordner, not trashed", which
-- is why nothing has to be backfilled and why an unorganised workspace costs
-- exactly zero rows.
create table if not exists public.owner_workspace_item_state (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  scope text not null check (scope = any (public.owner_workspace_scopes())),
  resource_id uuid not null,
  -- SET NULL, not CASCADE: deleting a folder must never delete the records in it.
  folder_id uuid references public.owner_workspace_folders(id) on delete set null,
  trashed_at timestamptz,
  trashed_by uuid references public.profiles(id) on delete set null,
  trash_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_workspace_item_state_unique unique (business_entity_id, scope, resource_id)
);

create index if not exists owner_workspace_item_state_folder_idx
  on public.owner_workspace_item_state (folder_id) where folder_id is not null;

create index if not exists owner_workspace_item_state_trash_idx
  on public.owner_workspace_item_state (business_entity_id, scope) where trashed_at is not null;

drop trigger if exists owner_workspace_folders_touch on public.owner_workspace_folders;
create trigger owner_workspace_folders_touch before update on public.owner_workspace_folders
  for each row execute function public.set_updated_at();

drop trigger if exists owner_workspace_item_state_touch on public.owner_workspace_item_state;
create trigger owner_workspace_item_state_touch before update on public.owner_workspace_item_state
  for each row execute function public.set_updated_at();

comment on table public.owner_workspace_folders is
  'Owner-only workspace folders. Organization, never accounting or legal state.';
comment on table public.owner_workspace_item_state is
  'Owner-only folder assignment and workspace-trash flag per record. Read by no tax, VAT, EÜR or receivable query.';

commit;

-- ---------------------------------------------------------------------------
-- 2. Security. Platform owner only, through RPCs. No anon, no broad
--    authenticated grant, and no table write privilege at all for the browser:
--    `authenticated` may SELECT (so the UI can read its own state directly if
--    it ever needs to) and nothing else. Every mutation goes through a named,
--    owner-gated SECURITY DEFINER function below.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array['owner_workspace_folders', 'owner_workspace_item_state'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())',
      t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 3. Reads. ONE call per scope returns every folder and every item state, so a
--    list of a thousand rows still costs one request and never one per row.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_workspace_state(p_entity uuid, p_scope text)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_folders jsonb; v_items jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f.id, 'name', f.name, 'sort_order', f.sort_order, 'created_at', f.created_at
         ) order by f.sort_order, f.created_at), '[]'::jsonb)
    into v_folders
  from public.owner_workspace_folders f
  where f.business_entity_id = p_entity and f.scope = p_scope;

  select coalesce(jsonb_agg(jsonb_build_object(
           'resource_id', s.resource_id, 'folder_id', s.folder_id, 'trashed_at', s.trashed_at
         )), '[]'::jsonb)
    into v_items
  from public.owner_workspace_item_state s
  where s.business_entity_id = p_entity and s.scope = p_scope
    and (s.folder_id is not null or s.trashed_at is not null);

  return jsonb_build_object('scope', p_scope, 'folders', v_folders, 'items', v_items);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 4. Folder lifecycle.
--
--    Deleting a folder deletes NO record. The FK is ON DELETE SET NULL, so
--    every item inside simply becomes "Ohne Ordner" — which is exactly what the
--    confirmation dialog promises the owner.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_create_workspace_folder(p_entity uuid, p_scope text, p_name text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_name text; v_next int; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;

  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' then raise exception 'folder_name_required'; end if;
  if char_length(v_name) > 60 then raise exception 'folder_name_too_long'; end if;

  if exists (
    select 1 from public.owner_workspace_folders
    where business_entity_id = p_entity and scope = p_scope and lower(btrim(name)) = lower(v_name)
  ) then
    raise exception 'folder_name_taken';
  end if;

  select coalesce(max(sort_order), -1) + 1 into v_next
  from public.owner_workspace_folders where business_entity_id = p_entity and scope = p_scope;

  insert into public.owner_workspace_folders (business_entity_id, scope, name, sort_order, created_by)
  values (p_entity, p_scope, v_name, v_next, auth.uid())
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'name', v_name, 'sort_order', v_next);
end;
$$;

create or replace function public.owner_rename_workspace_folder(p_folder_id uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare f record; v_name text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into f from public.owner_workspace_folders where id = p_folder_id for update;
  if f.id is null then raise exception 'folder not found'; end if;

  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' then raise exception 'folder_name_required'; end if;
  if char_length(v_name) > 60 then raise exception 'folder_name_too_long'; end if;

  if exists (
    select 1 from public.owner_workspace_folders
    where business_entity_id = f.business_entity_id and scope = f.scope
      and lower(btrim(name)) = lower(v_name) and id <> p_folder_id
  ) then
    raise exception 'folder_name_taken';
  end if;

  update public.owner_workspace_folders set name = v_name where id = p_folder_id;
  return jsonb_build_object('id', p_folder_id, 'name', v_name);
end;
$$;

create or replace function public.owner_delete_workspace_folder(p_folder_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare f record; v_unassigned int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into f from public.owner_workspace_folders where id = p_folder_id for update;
  if f.id is null then raise exception 'folder not found'; end if;

  select count(*) into v_unassigned from public.owner_workspace_item_state where folder_id = p_folder_id;

  -- The records themselves are never touched. The FK sets their folder_id to
  -- NULL, which is "Ohne Ordner".
  delete from public.owner_workspace_folders where id = p_folder_id;

  -- An item state row that now carries neither a folder nor a trash flag says
  -- nothing, so it is removed rather than left behind as noise.
  delete from public.owner_workspace_item_state
  where business_entity_id = f.business_entity_id and scope = f.scope
    and folder_id is null and trashed_at is null;

  return jsonb_build_object('folder_id', p_folder_id, 'deleted', true, 'unassigned_count', v_unassigned);
end;
$$;

create or replace function public.owner_reorder_workspace_folders(p_entity uuid, p_scope text, p_folder_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_index int := 0;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;
  foreach v_id in array coalesce(p_folder_ids, array[]::uuid[]) loop
    update public.owner_workspace_folders set sort_order = v_index
    where id = v_id and business_entity_id = p_entity and scope = p_scope;
    v_index := v_index + 1;
  end loop;
  return jsonb_build_object('reordered', v_index);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 5. Moving records between folders. One statement for the whole selection —
--    a bulk move of 200 rows is one request, not 200.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_move_workspace_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[], p_folder_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ids uuid[]; v_moved int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;

  v_ids := coalesce(p_resource_ids, array[]::uuid[]);
  if array_length(v_ids, 1) is null then return jsonb_build_object('moved', 0); end if;

  if p_folder_id is not null and not exists (
    select 1 from public.owner_workspace_folders
    where id = p_folder_id and business_entity_id = p_entity and scope = p_scope
  ) then
    raise exception 'folder does not belong to this scope';
  end if;

  insert into public.owner_workspace_item_state (business_entity_id, scope, resource_id, folder_id)
  select p_entity, p_scope, rid, p_folder_id from unnest(v_ids) as rid
  on conflict (business_entity_id, scope, resource_id)
  do update set folder_id = excluded.folder_id, updated_at = now();

  get diagnostics v_moved = row_count;

  -- Moving to "Ohne Ordner" can leave a row that states nothing at all.
  delete from public.owner_workspace_item_state
  where business_entity_id = p_entity and scope = p_scope and resource_id = any (v_ids)
    and folder_id is null and trashed_at is null;

  return jsonb_build_object('moved', v_moved, 'folder_id', p_folder_id);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6. Deletion preflight.
--
--    THE server decides what "Löschen" means for a given record. The browser
--    only renders the answer. Reasons are stable machine codes, never SQL text.
--
--    action:
--      hard_delete       the record is genuinely disposable
--      cancel_and_trash  legally protected: use its own Storno, then remove it
--                        from the workspace
--      archive_and_trash history-bearing: use its own archive, then remove it
--      trash_only        must remain exactly as it is; only the view changes
--      blocked           nothing honest can be done from here
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_workspace_delete_preflight_one(p_scope text, p_resource_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  inv record; o record; e record;
  v_payments int; v_documents int; v_generated int; v_tokens int; v_acceptance int; v_projects int;
  -- array_append, never `v_reasons || 'literal'`: the latter resolves as array||array and
  -- dies with "malformed array literal" the first time the branch actually runs. That exact
  -- defect shipped once already and 20260901120000 exists to undo it.
  v_reasons text[] := array[]::text[];
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  if p_scope = 'invoice' then
    select * into inv from public.owner_invoices where id = p_resource_id;
    if inv.id is null then return jsonb_build_object('resource_id', p_resource_id, 'action', 'blocked',
      'reasons', to_jsonb(array['not_found']), 'dependencies', '{}'::jsonb); end if;

    select count(*) into v_payments from public.owner_payments where invoice_id = p_resource_id;
    select count(*) into v_documents from public.owner_finance_documents where invoice_id = p_resource_id;
    select count(*) into v_projects from public.customer_project_invoices where invoice_id = p_resource_id;

    if inv.status = 'draft' and inv.issued_at is null then
      if v_payments = 0 and v_documents = 0 then
        return jsonb_build_object('resource_id', p_resource_id, 'action', 'hard_delete',
          'reasons', to_jsonb(array['never_issued_draft']),
          'dependencies', jsonb_build_object('payments', v_payments, 'documents', v_documents));
      end if;
      if v_payments > 0 then v_reasons := array_append(v_reasons, 'has_payments'); end if;
      if v_documents > 0 then v_reasons := array_append(v_reasons, 'has_documents'); end if;
      return jsonb_build_object('resource_id', p_resource_id, 'action', 'trash_only',
        'reasons', to_jsonb(v_reasons),
        'dependencies', jsonb_build_object('payments', v_payments, 'documents', v_documents));
    end if;

    -- Numbered, issued document. The number, the totals, the lines, the issue
    -- date and every payment stay exactly where they are, whatever happens next.
    if inv.status in ('cancelled', 'void') or inv.cancelled_at is not null then
      return jsonb_build_object('resource_id', p_resource_id, 'action', 'trash_only',
        'reasons', to_jsonb(array['already_cancelled', 'invoice_number_retained']),
        'dependencies', jsonb_build_object('payments', v_payments, 'documents', v_documents,
          'project_links', v_projects, 'invoice_number', inv.invoice_number));
    end if;

    return jsonb_build_object('resource_id', p_resource_id, 'action', 'cancel_and_trash',
      'reasons', to_jsonb(array['issued_invoice_requires_storno', 'invoice_number_retained']),
      'dependencies', jsonb_build_object('payments', v_payments, 'documents', v_documents,
        'project_links', v_projects, 'invoice_number', inv.invoice_number));

  elsif p_scope = 'offer' then
    select * into o from public.owner_offers where id = p_resource_id;
    if o.id is null then return jsonb_build_object('resource_id', p_resource_id, 'action', 'blocked',
      'reasons', to_jsonb(array['not_found']), 'dependencies', '{}'::jsonb); end if;

    select count(*) into v_generated from public.owner_generated_documents
      where source_resource_type = 'owner_offers' and source_resource_id = p_resource_id;
    select count(*) into v_tokens from public.owner_document_access_tokens where offer_id = p_resource_id;
    select count(*) into v_acceptance from public.owner_offer_acceptance_events where offer_id = p_resource_id;

    if o.status = 'draft'
       and o.finalized_version is null and o.converted_invoice_id is null
       and v_generated = 0 and v_tokens = 0 and v_acceptance = 0 then
      return jsonb_build_object('resource_id', p_resource_id, 'action', 'hard_delete',
        'reasons', to_jsonb(array['pristine_draft']), 'dependencies', '{}'::jsonb);
    end if;

    if o.finalized_version is not null then v_reasons := array_append(v_reasons, 'has_immutable_version'); end if;
    if o.converted_invoice_id is not null then v_reasons := array_append(v_reasons, 'converted_to_invoice'); end if;
    if v_generated > 0 then v_reasons := array_append(v_reasons, 'has_generated_documents'); end if;
    if v_tokens > 0 then v_reasons := array_append(v_reasons, 'has_access_tokens'); end if;
    if v_acceptance > 0 then v_reasons := array_append(v_reasons, 'has_acceptance_evidence'); end if;
    if v_reasons = array[]::text[] then v_reasons := array['not_a_pristine_draft']; end if;

    -- owner_archive_offer refuses drafts by design, so an encumbered draft can
    -- only leave the workspace, never change its commercial state.
    if o.status = 'draft' or o.archived_at is not null then
      return jsonb_build_object('resource_id', p_resource_id, 'action', 'trash_only',
        'reasons', to_jsonb(v_reasons),
        'dependencies', jsonb_build_object('generated_documents', v_generated,
          'access_tokens', v_tokens, 'acceptance_events', v_acceptance));
    end if;

    return jsonb_build_object('resource_id', p_resource_id, 'action', 'archive_and_trash',
      'reasons', to_jsonb(v_reasons),
      'dependencies', jsonb_build_object('generated_documents', v_generated,
        'access_tokens', v_tokens, 'acceptance_events', v_acceptance));

  elsif p_scope = 'expense' then
    select * into e from public.owner_expenses where id = p_resource_id;
    if e.id is null then return jsonb_build_object('resource_id', p_resource_id, 'action', 'blocked',
      'reasons', to_jsonb(array['not_found']), 'dependencies', '{}'::jsonb); end if;

    select count(*) into v_payments from public.owner_payments where expense_id = p_resource_id;
    select count(*) into v_documents from public.owner_finance_documents where expense_id = p_resource_id;

    -- review_status is DELIBERATELY not consulted. "Geprüft" is a workflow
    -- marker, not an accounting dependency, and treating it as one is what
    -- forced the owner into the Supabase table editor.
    if v_payments = 0 and v_documents = 0 and coalesce(e.amount_paid_cents, 0) = 0 then
      return jsonb_build_object('resource_id', p_resource_id, 'action', 'hard_delete',
        'reasons', to_jsonb(array['no_protected_dependency']),
        'dependencies', jsonb_build_object('payments', 0, 'documents', 0, 'amount_paid_cents', 0));
    end if;

    if v_payments > 0 then v_reasons := array_append(v_reasons, 'has_payments'); end if;
    if v_documents > 0 then v_reasons := array_append(v_reasons, 'has_documents'); end if;
    if coalesce(e.amount_paid_cents, 0) > 0 then v_reasons := array_append(v_reasons, 'partially_or_fully_paid'); end if;

    return jsonb_build_object('resource_id', p_resource_id, 'action', 'trash_only',
      'reasons', to_jsonb(v_reasons),
      'dependencies', jsonb_build_object('payments', v_payments, 'documents', v_documents,
        'amount_paid_cents', coalesce(e.amount_paid_cents, 0)));
  end if;

  -- A scope with no modelled semantics can never be deleted from here. It is
  -- refused rather than guessed at.
  return jsonb_build_object('resource_id', p_resource_id, 'action', 'blocked',
    'reasons', to_jsonb(array['scope_not_supported']), 'dependencies', '{}'::jsonb);
end;
$$;

create or replace function public.owner_workspace_delete_preflight(p_scope text, p_resource_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_out jsonb := '[]'::jsonb; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;
  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_out := v_out || jsonb_build_array(public.owner_workspace_delete_preflight_one(p_scope, v_id));
  end loop;
  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Hard delete of an unencumbered expense.
--
--    Separate from delete_owner_draft_expense, which stays exactly as it is for
--    its existing caller and its pinned tests. The difference is one rule:
--    review_status no longer blocks. Everything that is a genuine dependency
--    still does, and the check is made here rather than in the browser.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_delete_expense_if_unencumbered(p_expense_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare e record; v_payments int; v_documents int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into e from public.owner_expenses where id = p_expense_id for update;
  if e.id is null then raise exception 'expense not found'; end if;

  select count(*) into v_payments from public.owner_payments where expense_id = p_expense_id;
  select count(*) into v_documents from public.owner_finance_documents where expense_id = p_expense_id;

  if v_payments > 0 then raise exception 'expense has payments'; end if;
  if v_documents > 0 then raise exception 'expense has linked documents'; end if;
  if coalesce(e.amount_paid_cents, 0) <> 0 then raise exception 'expense is partially or fully paid'; end if;

  -- Lines first, so the line-level recalculation trigger still resolves its
  -- parent instead of firing against a row that is already gone.
  delete from public.owner_expense_lines where expense_id = p_expense_id;
  delete from public.owner_expenses where id = p_expense_id;

  return jsonb_build_object('expense_id', p_expense_id, 'deleted', true);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 8. The one delete entry point.
--
--    Runs the preflight per record and then does exactly what it said. Each
--    record is handled in its own subtransaction so one refusal cannot leave
--    the rest of a batch in an unexplained partial state; the caller gets a
--    per-item result ledger rather than a single opaque success or failure.
-- ---------------------------------------------------------------------------
begin;

-- Trash / restore are pure view state. Neither reads nor writes a single
-- accounting column.
create or replace function public.owner_workspace_trash_item(
  p_entity uuid, p_scope text, p_resource_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  insert into public.owner_workspace_item_state
    (business_entity_id, scope, resource_id, trashed_at, trashed_by, trash_reason)
  values (p_entity, p_scope, p_resource_id, now(), auth.uid(), nullif(btrim(p_reason), ''))
  on conflict (business_entity_id, scope, resource_id) do update
    set trashed_at = now(), trashed_by = auth.uid(),
        trash_reason = nullif(btrim(p_reason), ''), updated_at = now();
end;
$$;

create or replace function public.owner_workspace_delete_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[], p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_out jsonb := '[]'::jsonb; v_id uuid; v_plan jsonb; v_action text; v_outcome text; v_error text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_plan := public.owner_workspace_delete_preflight_one(p_scope, v_id);
    v_action := v_plan ->> 'action';
    v_outcome := null;
    v_error := null;

    begin
      if v_action = 'hard_delete' then
        if p_scope = 'invoice' then
          perform public.delete_owner_draft_invoice(v_id);
        elsif p_scope = 'offer' then
          perform public.delete_owner_offer_draft(gen_random_uuid(), v_id);
        elsif p_scope = 'expense' then
          perform public.owner_delete_expense_if_unencumbered(v_id);
        else
          raise exception 'scope_not_supported';
        end if;
        -- The record is gone; its organization row would be an orphan.
        delete from public.owner_workspace_item_state
        where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
        v_outcome := 'hard_deleted';

      elsif v_action = 'cancel_and_trash' then
        perform public.owner_cancel_invoice(v_id, coalesce(nullif(btrim(p_reason), ''), 'Aus Arbeitsbereich entfernt'));
        perform public.owner_workspace_trash_item(p_entity, p_scope, v_id, p_reason);
        v_outcome := 'cancelled_and_trashed';

      elsif v_action = 'archive_and_trash' then
        perform public.owner_archive_offer(v_id);
        perform public.owner_workspace_trash_item(p_entity, p_scope, v_id, p_reason);
        v_outcome := 'archived_and_trashed';

      elsif v_action = 'trash_only' then
        perform public.owner_workspace_trash_item(p_entity, p_scope, v_id, p_reason);
        v_outcome := 'trashed';

      else
        v_outcome := 'blocked';
      end if;
    exception when others then
      v_outcome := 'failed';
      -- SQLSTATE only. The message can carry schema detail and never reaches the UI.
      v_error := sqlstate;
    end;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', v_action, 'outcome', v_outcome,
      'reasons', v_plan -> 'reasons', 'error', v_error));
  end loop;

  return v_out;
end;
$$;

-- Restoring puts the record back in the folder it was filed in — the folder
-- assignment was never cleared — or in "Ohne Ordner" if it had none. It does
-- not reverse a Storno, un-archive an offer, or alter any other business state.
create or replace function public.owner_workspace_restore_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ids uuid[]; v_restored int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;
  v_ids := coalesce(p_resource_ids, array[]::uuid[]);
  if array_length(v_ids, 1) is null then return jsonb_build_object('restored', 0); end if;

  update public.owner_workspace_item_state
  set trashed_at = null, trashed_by = null, trash_reason = null, updated_at = now()
  where business_entity_id = p_entity and scope = p_scope and resource_id = any (v_ids);
  get diagnostics v_restored = row_count;

  delete from public.owner_workspace_item_state
  where business_entity_id = p_entity and scope = p_scope and resource_id = any (v_ids)
    and folder_id is null and trashed_at is null;

  return jsonb_build_object('restored', v_restored);
end;
$$;

-- "Endgültig löschen" from the Papierkorb. Re-runs the preflight and proceeds
-- ONLY where it still says hard_delete, so a protected record can never be
-- destroyed by having been in the trash for a while.
create or replace function public.owner_workspace_purge_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_out jsonb := '[]'::jsonb; v_id uuid; v_plan jsonb; v_outcome text; v_error text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_plan := public.owner_workspace_delete_preflight_one(p_scope, v_id);
    v_outcome := null; v_error := null;
    if (v_plan ->> 'action') <> 'hard_delete' then
      v_outcome := 'blocked';
    else
      begin
        if p_scope = 'invoice' then perform public.delete_owner_draft_invoice(v_id);
        elsif p_scope = 'offer' then perform public.delete_owner_offer_draft(gen_random_uuid(), v_id);
        elsif p_scope = 'expense' then perform public.owner_delete_expense_if_unencumbered(v_id);
        else raise exception 'scope_not_supported';
        end if;
        delete from public.owner_workspace_item_state
        where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
        v_outcome := 'hard_deleted';
      exception when others then
        v_outcome := 'failed'; v_error := sqlstate;
      end;
    end if;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', v_plan ->> 'action', 'outcome', v_outcome,
      'reasons', v_plan -> 'reasons', 'error', v_error));
  end loop;

  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 9. Execution grants. anon reaches nothing; `authenticated` may call, and
--    every function refuses immediately unless is_platform_owner() holds.
-- ---------------------------------------------------------------------------
begin;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.owner_workspace_scopes()',
    'public.owner_workspace_state(uuid, text)',
    'public.owner_create_workspace_folder(uuid, text, text)',
    'public.owner_rename_workspace_folder(uuid, text)',
    'public.owner_delete_workspace_folder(uuid)',
    'public.owner_reorder_workspace_folders(uuid, text, uuid[])',
    'public.owner_move_workspace_items(uuid, text, uuid[], uuid)',
    'public.owner_workspace_delete_preflight_one(text, uuid)',
    'public.owner_workspace_delete_preflight(text, uuid[])',
    'public.owner_delete_expense_if_unencumbered(uuid)',
    'public.owner_workspace_delete_items(uuid, text, uuid[], text)',
    'public.owner_workspace_trash_item(uuid, text, uuid, text)',
    'public.owner_workspace_restore_items(uuid, text, uuid[])',
    'public.owner_workspace_purge_items(uuid, text, uuid[])'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end;
$$;

commit;
