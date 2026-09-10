-- ===========================================================================
-- Owner force delete: a real, irreversible removal from the Papierkorb.
--
-- WHY THIS EXISTS
--
-- 20260903120000 gave the owner a Papierkorb and one honest delete path. That
-- path is correct and stays exactly as it is: "Löschen" still asks the server
-- what it may honestly do, still refuses to destroy a numbered document, and
-- still says so truthfully.
--
-- What it did NOT give the owner is a way out. `owner_workspace_purge_items`
-- proceeds only where the preflight still says `hard_delete` — but
-- `owner_workspace_delete_items` hard-deletes such a record straight away and
-- never trashes it. The two conditions are mutually exclusive, so every record
-- that actually reaches the Papierkorb is, by construction, one that purge can
-- never touch. "Endgültig löschen" has been unreachable since the day it
-- shipped. That is the defect this migration fixes.
--
-- WHAT IT DOES INSTEAD
--
-- A SECOND, deliberately separate path — force purge — that destroys the
-- record for real: the row, its lines, its payments, its generated PDFs, its
-- access tokens, its Storage objects, its project links. Nothing about the
-- ordinary delete path changes.
--
-- The safety is procedural rather than prohibitive, because a prohibition is
-- what made the feature useless:
--
--   1. TWO STEPS. A record can only be force purged out of the Papierkorb
--      (invoice / offer / expense) or out of the archive (customer). There is
--      no one-click destruction from a list.
--   2. A TYPED CONFIRMATION. The caller must pass the exact phrase, so an
--      automated or accidental call cannot destroy anything.
--   3. A MANDATORY REASON. Recorded, not merely required.
--   4. A TOMBSTONE, written BEFORE the destruction and inside the same
--      transaction. Append-only: no UPDATE or DELETE grant exists on it for
--      anyone, owner included.
--
-- The tombstone is the point. German retention law (§147 AO, §14b UStG, GoBD)
-- wants the numbered document kept for 8-10 years. This function destroys it
-- on the owner's explicit instruction; the tombstone keeps the number, the
-- totals, the dates and the counterparty so that what was removed, by whom and
-- why remains answerable. It is a documented decision instead of a silent gap.
--
-- HOW THE CASCADE IS BUILT
--
-- Not as a hand-written list of DELETE statements. Such a list rots: the next
-- migration adds a table, nobody updates the list, and the purge starts either
-- failing on a foreign key or leaving orphans behind. Instead the cascade is
-- driven by pg_constraint at run time (`owner_force_destroy_row`), so it is
-- correct for the schema as it actually is, today and after the next feature.
-- CASCADE and SET NULL constraints are left to Postgres; only RESTRICT and
-- NO ACTION children are cleared explicitly, because those are precisely the
-- ones that would otherwise block the delete.
--
-- Depends on: 20260903120000_owner_workspace_organization.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. The tombstone. Append-only by grant, not by convention.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_deletion_tombstones (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid references public.owner_business_entities(id) on delete set null,
  scope text not null,
  resource_id uuid not null,
  -- The human handle: "RE-2026-0100", "AN-2026-0007", the customer's name.
  label text,
  -- Everything the record was, flattened at the moment it stopped existing.
  summary jsonb not null default '{}'::jsonb,
  -- table name -> row count, as actually destroyed.
  destroyed jsonb not null default '{}'::jsonb,
  reason text not null,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz not null default now()
);

create index if not exists owner_deletion_tombstones_lookup_idx
  on public.owner_deletion_tombstones (business_entity_id, scope, deleted_at desc);

comment on table public.owner_deletion_tombstones is
  'Append-only record of every force-purged owner record. Written before the destruction, in the same transaction. Never updated, never deleted.';

alter table public.owner_deletion_tombstones enable row level security;

drop policy if exists owner_deletion_tombstones_owner_read on public.owner_deletion_tombstones;
create policy owner_deletion_tombstones_owner_read
  on public.owner_deletion_tombstones for select to authenticated
  using (public.is_platform_owner());

-- SELECT only for the browser, and no UPDATE or DELETE for anyone but the
-- migration role. The rows are written by SECURITY DEFINER functions, which is
-- why `authenticated` needs no INSERT grant either.
revoke all on table public.owner_deletion_tombstones from public, anon, authenticated;
grant select on table public.owner_deletion_tombstones to authenticated;
grant select, insert on table public.owner_deletion_tombstones to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 1b. The force-delete token, and the one guard that has to honour it.
--
--    owner_guard_invoice (20260831120000) refuses to DELETE any invoice that has
--    left draft, deliberately and for EVERY caller including SECURITY DEFINER
--    functions and the database owner. That is why the force purge cannot simply
--    issue a DELETE: without this section it fails with P0001 on exactly the
--    invoices the owner is trying to remove, which is worse than not shipping —
--    a destroy button that reports failure and leaves the record in place.
--
--    So the guard gains one narrow, named exception rather than being weakened:
--
--      - the token is transaction-local (set_config with is_local = true), so it
--        cannot leak onto a pooled PostgREST connection or outlive its statement;
--      - it carries the id of the single row being destroyed, so it authorises
--        that row and no other — not "deletes are allowed for a while";
--      - the guard still re-checks is_platform_owner(), so a token alone never
--        suffices;
--      - it is set only inside owner_force_destroy_row, which is reachable only
--        from the two entry points below, which have already required the record
--        to be trashed (or archived), the typed phrase, a written reason, and a
--        tombstone committed in the same transaction.
--
--    Everything else about the guard is unchanged and restated verbatim: the
--    draft-only DELETE, the INSERT rules, and the whole post-issuance UPDATE
--    delta analysis (payment-derived, Storno, first-time CRM link).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_delete_token()
returns text language sql stable set search_path = public, pg_temp as $$
  select coalesce(nullif(current_setting('cogniiq.force_delete_id', true), ''), '');
$$;

comment on function public.owner_force_delete_token() is
  'The id of the row a force purge is destroying right now, transaction-local. Empty outside one.';

create or replace function public.owner_guard_invoice()
returns trigger language plpgsql set search_path = public, pg_temp as $guard$
declare
  v_privileged boolean;
  v_was_draft boolean;
  v_changed text[];
  v_paid bigint;
  v_expected_status text;
begin
  -- "Privileged" means a genuine database-owner context, which is exactly what a
  -- SECURITY DEFINER function gives its body — nothing else. request_is_service_role()
  -- is deliberately NOT part of this: a service-role JWT is a request header, and
  -- treating it as privileged would mean the service key could insert a finished,
  -- numbered, "paid" invoice directly if the revoked grant above were ever restored.
  -- It reaches every legitimate operation through the same RPCs everyone else uses.
  v_privileged := public.is_database_admin();

  if tg_op = 'DELETE' then
    if old.status = 'draft' and old.issued_at is null then
      return old;
    end if;
    -- The ONE sanctioned exception, added by 20260910120000. An issued invoice may be
    -- destroyed only inside owner_force_purge_items / owner_force_delete_customer, which
    -- have already established that the owner asked for it explicitly: the record was
    -- trashed first, the confirmation phrase was typed, a reason was written, and a
    -- tombstone carrying the number, the totals and the dates was inserted in THIS
    -- transaction before the delete was attempted.
    --
    -- The token is transaction-local (set_config with is_local = true) and names the single
    -- row being destroyed, so it cannot leak onto a pooled connection, cannot outlive the
    -- statement that set it, and cannot authorise any invoice other than the one the force
    -- purge is currently holding. is_platform_owner() is re-checked here rather than
    -- inherited, so a token alone is never enough.
    if public.owner_force_delete_token() = old.id::text and public.is_platform_owner() then
      return old;
    end if;
    raise exception
      'invoice % is % and cannot be deleted; accounting history is kept (cancel it instead)',
      coalesce(old.invoice_number, old.id::text), old.status;
  end if;

  if tg_op = 'INSERT' then
    if v_privileged then return new; end if;
    -- A client may only ever create a genuine draft. Number allocation, issuance
    -- and cancellation are server acts; letting an INSERT carry them would be the
    -- same forgery as an UPDATE, one statement earlier.
    if coalesce(new.status, 'draft') <> 'draft'
       or new.invoice_number is not null
       or new.issued_at is not null
       or new.cancelled_at is not null
       or new.cancelled_by is not null
       or new.cancellation_reason is not null then
      raise exception 'invoices can only be created as drafts; use issue_owner_invoice to issue';
    end if;
    return new;
  end if;

  -- ----------------------------- UPDATE ------------------------------------
  v_was_draft := old.status = 'draft' and old.issued_at is null;

  if v_was_draft and new.status = 'issued' and new.issued_at is null then
    new.issued_at := now();
  end if;

  -- A client session may not write this table AT ALL, at any lifecycle stage.
  -- The revoked grant already makes this unreachable; the check is what keeps it
  -- true if a later migration re-grants, and it runs before the post-issuance
  -- whitelist so a client can never reach even a well-formed payment update.
  if not v_privileged then
    raise exception
      'invoices cannot be modified directly; use the invoice RPCs (issue, cancel, record payment)';
  end if;

  if v_was_draft then
    return new;
  end if;

  -- Post-issuance. Caller privilege is deliberately NOT consulted from here on:
  -- among privileged callers the delta is the whole test, because the realistic
  -- threat is a sanctioned RPC with a bug in it.
  select coalesce(array_agg(k order by k), array[]::text[]) into v_changed
  from jsonb_object_keys(to_jsonb(new)) as k
  where k <> 'updated_at'
    and (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k);

  if array_length(v_changed, 1) is null then
    return new;                                   -- no-op update
  end if;

  -- (A) Payment-derived, re-derived from the ledger rather than trusted.
  if v_changed <@ array['amount_paid_cents', 'status'] then
    select coalesce(sum(p.amount_cents), 0) into v_paid
    from public.owner_payments p
    where p.invoice_id = new.id and p.direction = 'inflow';

    v_expected_status := case
      when old.status in ('draft', 'void', 'cancelled', 'credited') then old.status
      when v_paid >= new.gross_total_cents and new.gross_total_cents > 0 then 'paid'
      when v_paid > 0 then 'partially_paid'
      else 'issued'
    end;

    if new.amount_paid_cents = v_paid and new.status = v_expected_status then
      return new;
    end if;
    raise exception
      'invoice % : a payment-derived update must match the payment ledger (ledger %, attempted paid %, expected status %, attempted %)',
      coalesce(new.invoice_number, new.id::text), v_paid, new.amount_paid_cents,
      v_expected_status, new.status;
  end if;

  -- (B) Storno.
  if v_changed <@ array['status', 'cancelled_at', 'cancelled_by', 'cancellation_reason']
     and new.status = 'cancelled'
     and old.status not in ('cancelled', 'void')
     and new.cancelled_at is not null then
    return new;
  end if;

  -- (C) First-time CRM / portal link, null -> value only.
  if v_changed = array['organization_id']
     and old.organization_id is null and new.organization_id is not null then
    return new;
  end if;
  if v_changed = array['owner_customer_id']
     and old.owner_customer_id is null and new.owner_customer_id is not null then
    return new;
  end if;

  raise exception
    'invoice % is % and its issuance-defining fields are immutable; refused change to: %',
    coalesce(old.invoice_number, old.id::text), old.status, array_to_string(v_changed, ', ');
end;
$guard$;

commit;

-- ---------------------------------------------------------------------------
-- 2. The generic destroyer.
--
--    Removes one row and everything that structurally depends on it, following
--    inbound foreign keys from the catalog rather than from a list somebody has
--    to remember to update.
--
--    Only RESTRICT / NO ACTION children are handled here. CASCADE and SET NULL
--    already say what should happen and Postgres does it correctly; touching
--    them would mean deleting rows the schema explicitly wanted kept.
--
--    Outbound references are never followed — a row is destroyed with what
--    points AT it, never with what it points to. Deleting an invoice can never
--    reach the business entity or the profile it references.
-- ---------------------------------------------------------------------------
begin;

-- Tables the walker must never delete from, whatever the catalog says.
-- Counters are sequences in table form: removing a row would let a retired
-- invoice number be issued a second time, which is a far worse outcome than
-- the row the owner asked to destroy.
create or replace function public.owner_force_delete_protected_tables()
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select array[
    'profiles', 'organizations', 'client_accounts',
    'owner_business_entities', 'owner_audit_log',
    'owner_invoice_counters', 'owner_offer_counters',
    'owner_deletion_tombstones'
  ]::text[];
$$;

/**
 * Inbound RESTRICT / NO ACTION foreign keys pointing at `p_table`.`id`.
 *
 * Composite keys are handled: `unnest(conkey, confkey)` pairs each child column
 * with the parent column it references, so a two-column key such as
 * customer_project_invoices -> (organization_id, id) still yields its `id` leg
 * and is cleared like any other.
 */
create or replace function public.owner_force_delete_children(p_table text)
returns table (child_table text, child_column text, child_has_id boolean)
language sql stable set search_path = public, pg_temp as $$
  select distinct
    src.relname::text,
    a.attname::text,
    exists (
      select 1 from pg_attribute ia
      where ia.attrelid = c.conrelid and ia.attname = 'id' and ia.attnum > 0 and not ia.attisdropped
    )
  from pg_constraint c
  join pg_class src on src.oid = c.conrelid
  join pg_namespace n on n.oid = src.relnamespace
  join pg_class tgt on tgt.oid = c.confrelid
  join pg_namespace tn on tn.oid = tgt.relnamespace
  cross join lateral unnest(c.conkey, c.confkey) as u(child_attnum, parent_attnum)
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = u.child_attnum
  join pg_attribute pa on pa.attrelid = c.confrelid and pa.attnum = u.parent_attnum
  where c.contype = 'f'
    and tn.nspname = 'public' and tgt.relname = p_table
    and n.nspname = 'public'
    and pa.attname = 'id'
    -- 'a' = NO ACTION, 'r' = RESTRICT. 'c'/'n'/'d' are already correct.
    and c.confdeltype in ('a', 'r')
    and not (src.relname::text = any (public.owner_force_delete_protected_tables()));
$$;

/**
 * Dry run. Counts what a force purge would remove, per table, without removing
 * anything — this is what the confirmation dialog shows the owner.
 *
 * It reports CASCADE and SET NULL children too, which the destroyer does not
 * have to touch, because the owner cares what disappears, not which clause in
 * the schema makes it disappear.
 */
create or replace function public.owner_force_delete_manifest(
  p_table text, p_id uuid, p_depth int default 0)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  r record; v_out jsonb := '{}'::jsonb; v_n bigint; v_ids uuid[]; v_child uuid; v_sub jsonb; k text;
begin
  if p_depth > 5 then return v_out; end if;
  if p_table = any (public.owner_force_delete_protected_tables()) then return v_out; end if;

  for r in
    select distinct src.relname::text as child_table, a.attname::text as child_column,
           c.confdeltype,
           exists (select 1 from pg_attribute ia
                   where ia.attrelid = c.conrelid and ia.attname = 'id'
                     and ia.attnum > 0 and not ia.attisdropped) as child_has_id
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_namespace n on n.oid = src.relnamespace
    join pg_class tgt on tgt.oid = c.confrelid
    join pg_namespace tn on tn.oid = tgt.relnamespace
    cross join lateral unnest(c.conkey, c.confkey) as u(child_attnum, parent_attnum)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = u.child_attnum
    join pg_attribute pa on pa.attrelid = c.confrelid and pa.attnum = u.parent_attnum
    where c.contype = 'f'
      and tn.nspname = 'public' and tgt.relname = p_table
      and n.nspname = 'public' and pa.attname = 'id'
      -- SET NULL / SET DEFAULT children survive; they only lose the link.
      and c.confdeltype in ('a', 'r', 'c')
      and not (src.relname::text = any (public.owner_force_delete_protected_tables()))
  loop
    execute format('select count(*) from public.%I where %I = $1', r.child_table, r.child_column)
      into v_n using p_id;
    if v_n = 0 then continue; end if;

    v_out := v_out || jsonb_build_object(
      r.child_table, coalesce((v_out ->> r.child_table)::bigint, 0) + v_n);

    if r.child_has_id and p_depth < 5 then
      execute format('select coalesce(array_agg(id), array[]::uuid[]) from public.%I where %I = $1',
                     r.child_table, r.child_column)
        into v_ids using p_id;
      foreach v_child in array v_ids loop
        v_sub := public.owner_force_delete_manifest(r.child_table, v_child, p_depth + 1);
        for k in select jsonb_object_keys(v_sub) loop
          v_out := v_out || jsonb_build_object(
            k, coalesce((v_out ->> k)::bigint, 0) + (v_sub ->> k)::bigint);
        end loop;
      end loop;
    end if;
  end loop;

  -- The row itself, but ONLY at the top of the walk. A recursive call is already counted by
  -- its caller, which counted the child rows it found; adding it again here made every
  -- nested table report double (two invoice lines came back as four).
  if p_depth = 0 then
    v_out := v_out || jsonb_build_object(p_table, coalesce((v_out ->> p_table)::bigint, 0) + 1);
  end if;
  return v_out;
end;
$$;

/**
 * The destruction itself. Same walk, but it deletes, and it returns what it
 * actually removed so the tombstone records facts rather than a forecast.
 */
create or replace function public.owner_force_destroy_row(
  p_table text, p_id uuid, p_depth int default 0)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r record; v_out jsonb := '{}'::jsonb; v_ids uuid[]; v_child uuid; v_sub jsonb; k text; v_n bigint;
begin
  if p_depth > 5 then raise exception 'force_delete_depth_exceeded'; end if;
  if p_table = any (public.owner_force_delete_protected_tables()) then
    raise exception 'force_delete_protected_table';
  end if;

  for r in select * from public.owner_force_delete_children(p_table) loop
    if r.child_has_id and p_depth < 5 then
      -- Recurse first: the grandchild's own RESTRICT children have to go before
      -- the child row can.
      execute format('select coalesce(array_agg(id), array[]::uuid[]) from public.%I where %I = $1',
                     r.child_table, r.child_column)
        into v_ids using p_id;
      foreach v_child in array v_ids loop
        v_sub := public.owner_force_destroy_row(r.child_table, v_child, p_depth + 1);
        for k in select jsonb_object_keys(v_sub) loop
          v_out := v_out || jsonb_build_object(
            k, coalesce((v_out ->> k)::bigint, 0) + (v_sub ->> k)::bigint);
        end loop;
      end loop;
    else
      execute format('delete from public.%I where %I = $1', r.child_table, r.child_column) using p_id;
      get diagnostics v_n = row_count;
      if v_n > 0 then
        v_out := v_out || jsonb_build_object(
          r.child_table, coalesce((v_out ->> r.child_table)::bigint, 0) + v_n);
      end if;
    end if;
  end loop;

  -- Transaction-local and scoped to this exact row: owner_guard_invoice reads it and lets
  -- THIS delete through, nothing else. Set immediately before the statement rather than once
  -- per call, so a recursion into a sibling row can never inherit its parent's authorisation.
  perform set_config('cogniiq.force_delete_id', p_id::text, true);
  execute format('delete from public.%I where id = $1', p_table) using p_id;
  get diagnostics v_n = row_count;
  perform set_config('cogniiq.force_delete_id', '', true);

  v_out := v_out || jsonb_build_object(p_table, coalesce((v_out ->> p_table)::bigint, 0) + v_n);
  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 3. Storage.
--
--    "Fully deleted" has to include the PDFs, or the invoice is gone from every
--    list and still sitting in a bucket. The rows carrying the paths are about
--    to be destroyed by the walker, so the paths are collected and the objects
--    removed FIRST, while they can still be found.
--
--    Guarded on to_regclass: the smoke database has no storage schema.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_purge_storage(p_scope text, p_id uuid)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare v_paths text[] := array[]::text[]; v_removed int := 0;
begin
  if to_regclass('storage.objects') is null then return 0; end if;

  if p_scope = 'invoice' then
    select coalesce(array_agg(storage_object_path), array[]::text[]) into v_paths
      from public.owner_finance_documents where invoice_id = p_id and storage_object_path is not null;
    select v_paths || coalesce(array_agg(pdf_storage_path), array[]::text[]) into v_paths
      from public.owner_generated_documents
     where source_resource_type = 'owner_invoices' and source_resource_id = p_id
       and pdf_storage_path is not null;

  elsif p_scope = 'offer' then
    select coalesce(array_agg(pdf_storage_path), array[]::text[]) into v_paths
      from public.owner_generated_documents
     where source_resource_type = 'owner_offers' and source_resource_id = p_id
       and pdf_storage_path is not null;

  elsif p_scope = 'expense' then
    select coalesce(array_agg(storage_object_path), array[]::text[]) into v_paths
      from public.owner_finance_documents where expense_id = p_id and storage_object_path is not null;
  end if;

  if array_length(v_paths, 1) is null then return 0; end if;

  -- Bucket-scoped, not name-only: a path is unique within its bucket, not across the project,
  -- and an owner document must never be able to take a same-named customer-portal object with it.
  execute 'delete from storage.objects where bucket_id = any ($1) and name = any ($2)'
    using array['owner-finance-documents', 'owner-offer-signatures']::text[], v_paths;
  get diagnostics v_removed = row_count;
  return v_removed;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 4. What the record WAS. Captured before it stops existing.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_delete_summary(p_scope text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare i record; o record; e record; c record;
begin
  if p_scope = 'invoice' then
    select * into i from public.owner_invoices where id = p_id;
    if i.id is null then return null; end if;
    return jsonb_build_object(
      'label', i.invoice_number, 'status', i.status,
      'issue_date', i.issue_date, 'due_date', i.due_date, 'issued_at', i.issued_at,
      'currency', i.currency, 'net_total_cents', i.net_total_cents,
      'vat_total_cents', i.vat_total_cents, 'gross_total_cents', i.gross_total_cents,
      'amount_paid_cents', i.amount_paid_cents, 'owner_customer_id', i.owner_customer_id,
      'organization_id', i.organization_id);

  elsif p_scope = 'offer' then
    select * into o from public.owner_offers where id = p_id;
    if o.id is null then return null; end if;
    return jsonb_build_object(
      'label', coalesce(o.offer_number, o.title), 'status', o.status,
      'finalized_version', o.finalized_version, 'converted_invoice_id', o.converted_invoice_id,
      'owner_customer_id', o.owner_customer_id, 'created_at', o.created_at);

  elsif p_scope = 'expense' then
    select * into e from public.owner_expenses where id = p_id;
    if e.id is null then return null; end if;
    return jsonb_build_object(
      'label', coalesce(e.supplier_invoice_number, nullif(left(coalesce(e.notes, ''), 60), ''), e.id::text),
      'supplier_invoice_number', e.supplier_invoice_number,
      'invoice_date', e.invoice_date, 'service_date', e.service_date,
      'currency', e.currency, 'net_total_cents', e.net_total_cents,
      'vat_total_cents', e.vat_total_cents, 'gross_total_cents', e.gross_total_cents,
      'amount_paid_cents', e.amount_paid_cents, 'owner_customer_id', e.owner_customer_id);

  elsif p_scope = 'customer' then
    select * into c from public.owner_customers where id = p_id;
    if c.id is null then return null; end if;
    return jsonb_build_object(
      'label', coalesce(c.company, c.contact_name, c.email, c.id::text),
      'email', c.email, 'status', c.status, 'organization_id', c.organization_id,
      'created_at', c.created_at);
  end if;
  return null;
end;
$$;

/** The table behind a scope. One place, so nothing else has to know the mapping. */
create or replace function public.owner_force_delete_table(p_scope text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case p_scope
    when 'invoice'  then 'owner_invoices'
    when 'offer'    then 'owner_offers'
    when 'expense'  then 'owner_expenses'
    when 'customer' then 'owner_customers'
  end;
$$;

/**
 * The confirmation dialog's data source: what this record is, and everything
 * that will cease to exist with it. Read-only; destroys nothing.
 */
create or replace function public.owner_force_delete_preview(p_scope text, p_resource_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_table text; v_summary jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_table := public.owner_force_delete_table(p_scope);
  if v_table is null then
    return jsonb_build_object('resource_id', p_resource_id, 'found', false, 'reason', 'scope_not_supported');
  end if;

  v_summary := public.owner_force_delete_summary(p_scope, p_resource_id);
  if v_summary is null then
    return jsonb_build_object('resource_id', p_resource_id, 'found', false, 'reason', 'not_found');
  end if;

  return jsonb_build_object(
    'resource_id', p_resource_id, 'found', true,
    'label', v_summary ->> 'label',
    'summary', v_summary,
    'manifest', public.owner_force_delete_manifest(v_table, p_resource_id));
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 5. Force purge from the Papierkorb.
--
--    Refuses anything that is not currently trashed. That is the whole safety
--    model: the ordinary delete decides what a record IS, the Papierkorb is the
--    deliberate second step, and only from there can something be destroyed.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_delete_phrase()
returns text language sql immutable set search_path = public, pg_temp as $$
  select 'ENDGÜLTIG LÖSCHEN'::text;
$$;

create or replace function public.owner_force_purge_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[],
  p_reason text, p_confirmation text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_out jsonb := '[]'::jsonb; v_id uuid; v_table text; v_summary jsonb;
  v_destroyed jsonb; v_outcome text; v_error text; v_reason text; v_trashed boolean;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;

  v_table := public.owner_force_delete_table(p_scope);
  if v_table is null or p_scope = 'customer' then
    -- A customer never lives in a workspace Papierkorb; it has its own entry
    -- point below, with the archive as its second step.
    raise exception 'unsupported force purge scope';
  end if;

  if p_confirmation is distinct from public.owner_force_delete_phrase() then
    raise exception 'force_delete_confirmation_required';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 3 then raise exception 'force_delete_reason_required'; end if;

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_outcome := null; v_error := null; v_destroyed := '{}'::jsonb;

    begin
      select (s.trashed_at is not null) into v_trashed
        from public.owner_workspace_item_state s
       where s.business_entity_id = p_entity and s.scope = p_scope and s.resource_id = v_id;

      if coalesce(v_trashed, false) is not true then
        v_outcome := 'blocked';
        v_error := 'not_trashed';
      else
        v_summary := public.owner_force_delete_summary(p_scope, v_id);
        if v_summary is null then
          -- The record is already gone; clear the orphaned organization row so
          -- the Papierkorb stops showing a row that refers to nothing.
          delete from public.owner_workspace_item_state
           where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
          v_outcome := 'hard_deleted';
        else
          -- Tombstone FIRST, in this transaction: if the destruction fails,
          -- the tombstone rolls back with it and no phantom record is left.
          insert into public.owner_deletion_tombstones
            (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
          values (p_entity, p_scope, v_id, v_summary ->> 'label', v_summary,
                  public.owner_force_delete_manifest(v_table, v_id), v_reason, auth.uid());

          perform public.owner_force_purge_storage(p_scope, v_id);
          v_destroyed := public.owner_force_destroy_row(v_table, v_id);

          delete from public.owner_workspace_item_state
           where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
          v_outcome := 'hard_deleted';
        end if;
      end if;
    exception when others then
      v_outcome := 'failed';
      v_error := sqlstate;
    end;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', 'force_delete', 'outcome', v_outcome,
      'reasons', to_jsonb(array[]::text[]), 'destroyed', v_destroyed, 'error', v_error));
  end loop;

  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6. Force delete of a customer.
--
--    The archive is the customer's Papierkorb, so the same two-step rule
--    applies: archive first, destroy second. Everything belonging to the
--    customer goes with it, because the RESTRICT foreign keys on
--    owner_invoices / owner_offers / owner_subscriptions make them structural
--    dependents. The preview says so explicitly before the owner confirms —
--    it is not allowed to be a surprise.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_delete_customer(
  p_customer_id uuid, p_reason text, p_confirmation text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  c record; v_reason text; v_summary jsonb; v_destroyed jsonb; v_child uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  if p_confirmation is distinct from public.owner_force_delete_phrase() then
    raise exception 'force_delete_confirmation_required';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 3 then raise exception 'force_delete_reason_required'; end if;

  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  if c.status is distinct from 'archived' then
    raise exception 'force_delete_requires_archived';
  end if;

  v_summary := public.owner_force_delete_summary('customer', p_customer_id);

  insert into public.owner_deletion_tombstones
    (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
  values (c.business_entity_id, 'customer', p_customer_id, v_summary ->> 'label', v_summary,
          public.owner_force_delete_manifest('owner_customers', p_customer_id), v_reason, auth.uid());

  -- Storage first, per document-bearing child, while the paths are findable.
  for v_child in select id from public.owner_invoices where owner_customer_id = p_customer_id loop
    perform public.owner_force_purge_storage('invoice', v_child);
  end loop;
  for v_child in select id from public.owner_offers where owner_customer_id = p_customer_id loop
    perform public.owner_force_purge_storage('offer', v_child);
  end loop;

  -- Expenses reference the customer only for cost allocation and the FK is
  -- SET NULL, so the walker leaves them alone. That is correct: someone else's
  -- bookkeeping is not this customer's dependent.
  v_destroyed := public.owner_force_destroy_row('owner_customers', p_customer_id);

  -- Organization rows are the workspace state of records that no longer exist.
  delete from public.owner_workspace_item_state s
   where not exists (select 1 from public.owner_invoices i where i.id = s.resource_id)
     and s.scope = 'invoice';
  delete from public.owner_workspace_item_state s
   where not exists (select 1 from public.owner_offers o where o.id = s.resource_id)
     and s.scope = 'offer';

  return jsonb_build_object(
    'customer_id', p_customer_id, 'deleted', true,
    'label', v_summary ->> 'label', 'destroyed', v_destroyed);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Grants. anon reaches nothing; every function refuses immediately unless
--    is_platform_owner() holds.
-- ---------------------------------------------------------------------------
begin;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.owner_force_delete_protected_tables()',
    'public.owner_force_delete_token()',
    'public.owner_force_delete_children(text)',
    'public.owner_force_delete_manifest(text, uuid, int)',
    'public.owner_force_destroy_row(text, uuid, int)',
    'public.owner_force_purge_storage(text, uuid)',
    'public.owner_force_delete_summary(text, uuid)',
    'public.owner_force_delete_table(text)',
    'public.owner_force_delete_preview(text, uuid)',
    'public.owner_force_delete_phrase()',
    'public.owner_force_purge_items(uuid, text, uuid[], text, text)',
    'public.owner_force_delete_customer(uuid, text, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
  end loop;

  -- Only the three the browser actually calls are reachable from a session.
  -- The walker primitives stay service_role-only: they take a table name and
  -- must never be callable with one the owner chose.
  foreach fn in array array[
    'public.owner_force_delete_preview(text, uuid)',
    'public.owner_force_delete_phrase()',
    'public.owner_force_purge_items(uuid, text, uuid[], text, text)',
    'public.owner_force_delete_customer(uuid, text, text)',
    -- Read-only, and read by owner_guard_invoice on every invoice DELETE. It must be
    -- callable from whatever context that trigger runs in; it reveals nothing and
    -- authorises nothing on its own.
    'public.owner_force_delete_token()'
  ]
  loop
    execute format('grant execute on function %s to authenticated', fn);
  end loop;

  foreach fn in array array[
    'public.owner_force_delete_protected_tables()',
    'public.owner_force_delete_token()',
    'public.owner_force_delete_children(text)',
    'public.owner_force_delete_manifest(text, uuid, int)',
    'public.owner_force_destroy_row(text, uuid, int)',
    'public.owner_force_purge_storage(text, uuid)',
    'public.owner_force_delete_summary(text, uuid)',
    'public.owner_force_delete_table(text)',
    'public.owner_force_delete_preview(text, uuid)',
    'public.owner_force_delete_phrase()',
    'public.owner_force_purge_items(uuid, text, uuid[], text, text)',
    'public.owner_force_delete_customer(uuid, text, text)'
  ]
  loop
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

commit;
