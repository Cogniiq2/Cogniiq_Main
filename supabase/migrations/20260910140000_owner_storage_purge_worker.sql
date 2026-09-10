-- ===========================================================================
-- Real Storage byte deletion: a durable outbox, drained by a trusted worker.
--
-- WHAT THIS CLOSES
--
-- Every purge/force-delete path up to this migration deleted `storage.objects`
-- rows directly via SQL — that removes Postgres's METADATA row only. The actual
-- file bytes live behind Supabase's Storage API service (S3 or equivalent), and
-- nothing reachable from plain SQL calls that service. A raw `DELETE FROM
-- storage.objects` therefore looked like cleanup and was not: it left orphaned
-- bytes in the bucket, invisible to any query because the row that would have
-- pointed at them is gone.
--
-- THE FIX: a transactional outbox, exactly the shape this codebase already uses
-- for exactly this class of problem (DB transaction + external side effect that
-- cannot share it). `owner_automation_jobs` / `send-offer-document-email` is the
-- precedent: a durable job row is written INSIDE the business transaction, and a
-- separate worker — authenticated by a Vault-stored secret, invoked every
-- minute by pg_cron + pg_net, running with the service-role key that only an
-- Edge Function ever holds — drains it with FOR UPDATE SKIP LOCKED claiming and
-- idempotent completion. This migration is that same pattern, once, for Storage
-- deletion:
--
--   owner_storage_purge_queue    the outbox row: which (bucket, path) is owed
--                                 a real deletion, and its current status
--   owner_storage_purge_enqueue  writes it — service_role only, called from
--                                 inside the purge RPCs in the SAME transaction
--                                 as the row destruction and the tombstone
--   owner_storage_purge_claim_batch    FOR UPDATE SKIP LOCKED batch claim
--   owner_storage_purge_complete       the ONLY place a claim leaves
--                                       'processing' — idempotent
--   owner_storage_purge_retry_failed   owner lever to force a retry
--   owner_storage_purge_status         owner-readable live rollup per tombstone
--
-- storage-purge-worker (Edge Function, supabase/functions/) is the only thing
-- in this system that ever calls the real Storage API to remove bytes. Nothing
-- else does, before or after this migration.
--
-- WHAT NO LONGER HAPPENS
--
-- owner_purge_destroy_row (20260910130000) no longer deletes storage.objects.
-- It still collects the expected (bucket, path) list — while the rows carrying
-- those paths still exist, exactly as before — but only RETURNS that list. The
-- four purge entry points (owner_workspace_purge_items, owner_force_purge_items,
-- owner_force_delete_customer, owner_purge_customer) enqueue it, in the same
-- transaction as the tombstone insert, after destruction succeeds. Nothing in
-- this file, or any file before it, issues `delete from storage.objects` again.
--
-- Depends on: 20260910120000, 20260910130000
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. The outbox table.
--
--    One row per (bucket, path) a purge is owed. `tombstone_id` ties it to the
--    IMMUTABLE record of what was expected — the tombstone's own
--    destroyed._storage_cleanup.objects is the frozen "what we intended to
--    remove", written once and never touched again; this table is the LIVE,
--    mutable status of actually doing it, kept deliberately separate so the
--    tombstone's append-only guarantee is never in tension with a status that
--    legitimately needs to change from pending -> processing -> deleted.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_storage_purge_queue (
  id uuid primary key default gen_random_uuid(),
  tombstone_id uuid not null references public.owner_deletion_tombstones(id) on delete cascade,
  bucket_id text not null,
  object_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'deleted', 'already_missing', 'failed')),
  attempt_count int not null default 0 check (attempt_count >= 0),
  max_attempts int not null default 8 check (max_attempts > 0),
  last_error text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Defensive, not load-bearing: a specific storage path belongs to exactly one
  -- document row, destroyed at most once, so this should never actually fire.
  -- It exists so a bug that re-enqueues the same tombstone twice fails loudly
  -- (constraint violation, caught and reported) rather than double-queueing.
  constraint owner_storage_purge_queue_unique unique (tombstone_id, bucket_id, object_name)
);

create index if not exists owner_storage_purge_queue_status_idx
  on public.owner_storage_purge_queue (status, updated_at) where status in ('pending', 'failed');
create index if not exists owner_storage_purge_queue_tombstone_idx
  on public.owner_storage_purge_queue (tombstone_id);

drop trigger if exists owner_storage_purge_queue_touch on public.owner_storage_purge_queue;
create trigger owner_storage_purge_queue_touch before update on public.owner_storage_purge_queue
  for each row execute function public.set_updated_at();

comment on table public.owner_storage_purge_queue is
  'Durable outbox for real Storage-API deletions. Written once per expected object, inside the same transaction as the row destruction and the tombstone; drained asynchronously by storage-purge-worker. The only thing that ever deletes storage.objects for a purge is that worker, through the real Storage API — nothing here issues a SQL DELETE against it.';

-- RLS: the owner may READ (to see cleanup status); nothing else, for anyone
-- reachable through PostgREST. Every write happens through the SECURITY
-- DEFINER functions below, executing as the function owner regardless of grants.
alter table public.owner_storage_purge_queue enable row level security;

drop policy if exists owner_storage_purge_queue_owner_read on public.owner_storage_purge_queue;
create policy owner_storage_purge_queue_owner_read
  on public.owner_storage_purge_queue for select to authenticated
  using (public.is_platform_owner());

-- authenticated: SELECT only — not INSERT, not UPDATE, not DELETE. This is what
-- makes requirement 4 ("Storage objects to delete must come only from the
-- server-calculated purge manifest") a database fact rather than a convention:
-- there is no grant path by which a client, however it got the JWT, can insert
-- an arbitrary path into this table and have the worker act on it. service_role
-- gets INSERT/SELECT/UPDATE for the worker and the enqueue function to use, but
-- never DELETE — a queue row is a permanent record of what was expected, and it
-- ages out of "needs attention" by reaching a terminal status, not by vanishing.
revoke all on table public.owner_storage_purge_queue from public, anon, authenticated;
grant select on table public.owner_storage_purge_queue to authenticated;
grant select, insert, update on table public.owner_storage_purge_queue to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 2. Enqueue. The ONLY way a row gets into the queue.
--
--    Bucket-allowlisted, defense in depth beyond the grant: even a future bug
--    that constructs a path from the wrong source cannot queue a deletion
--    against a bucket this system does not own.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_storage_purge_allowed_buckets()
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select array['owner-finance-documents', 'owner-offer-signatures', 'customer-documents']::text[];
$$;

/**
 * Enqueues the expected (bucket, path) pairs for one tombstone. Called ONLY from inside the
 * purge RPCs (owner_workspace_purge_items, owner_force_purge_items, owner_force_delete_customer,
 * owner_purge_customer), in the same transaction as the tombstone insert — so either the whole
 * purge commits (rows gone, tombstone written, queue populated) or none of it does. `p_objects`
 * is the JSONB array owner_purge_destroy_row itself already collected from
 * owner_purge_storage_paths — never a path supplied by a caller, browser included.
 *
 * service_role only: not reachable directly by `authenticated`, even though the browser never
 * has a tombstone_id to call it with anyway (tombstones are written by the same trusted
 * functions this runs inside).
 */
create or replace function public.owner_storage_purge_enqueue(p_tombstone_id uuid, p_objects jsonb)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int := 0; v_bad text[];
begin
  -- Deliberately NO request_is_service_role() / is_platform_owner() check here — this is an
  -- internal helper, called only from inside the owner-gated purge RPCs (already checked
  -- is_platform_owner() at their own entry point, before this ever runs) in the SAME
  -- transaction as the tombstone it references. Matches owner_purge_destroy_row and every
  -- other internal helper in this file: the gate is the GRANT (service_role only, never
  -- authenticated/anon), checked once at the true entry point, not re-litigated at each
  -- internal step. A `request_is_service_role()` check here would be actively wrong: that
  -- function reads request.jwt.claim.role, which reflects the ORIGINAL CALLER's identity
  -- (the owner's session) and stays that way through every SECURITY DEFINER layer — it is
  -- never 'service_role' for a call nested inside an owner-invoked RPC, only for a call the
  -- worker itself makes as the true top level of its own request (claim_batch / complete,
  -- below, which correctly keep the check because that IS how they are reached).
  if p_objects is null or jsonb_typeof(p_objects) <> 'array' or jsonb_array_length(p_objects) = 0 then
    return 0;
  end if;

  select coalesce(array_agg(distinct o ->> 'bucket_id'), array[]::text[]) into v_bad
    from jsonb_array_elements(p_objects) o
   where (o ->> 'bucket_id') <> all (public.owner_storage_purge_allowed_buckets());
  if array_length(v_bad, 1) is not null then
    raise exception 'storage_purge_bucket_not_allowed: %', array_to_string(v_bad, ', ');
  end if;

  insert into public.owner_storage_purge_queue (tombstone_id, bucket_id, object_name)
  select p_tombstone_id, o ->> 'bucket_id', o ->> 'object_name'
    from jsonb_array_elements(p_objects) o
   where (o ->> 'bucket_id') is not null and (o ->> 'object_name') is not null
  on conflict (tombstone_id, bucket_id, object_name) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 3. Claim. Mirrors owner_claim_automation_jobs exactly: FOR UPDATE SKIP
--    LOCKED, status flip + attempt increment in the SAME statement, so two
--    concurrent worker invocations can never claim the same row.
-- ---------------------------------------------------------------------------
begin;

-- A 'processing' row whose claim is older than this is treated as abandoned — the Edge
-- Function invocation that claimed it crashed, timed out, or was killed by the platform before
-- it could report an outcome, and nothing else will ever move that row again on its own.
-- Comfortably longer than any single Supabase Edge Function invocation's wall-clock limit, and
-- short enough that a genuinely abandoned object is not stuck for long.
create or replace function public.owner_storage_purge_stale_after()
returns interval language sql immutable set search_path = public, pg_temp as $$
  select interval '5 minutes';
$$;

create or replace function public.owner_storage_purge_claim_batch(p_limit int default 25)
returns setof jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  return query
  with claimable as (
    select q.id
    from public.owner_storage_purge_queue q
    where q.attempt_count < q.max_attempts
      and (
        q.status in ('pending', 'failed')
        -- Reclaim an abandoned in-flight claim. Incrementing attempt_count here is
        -- deliberate: whatever claimed it before never reported an outcome, so this IS a
        -- new attempt, and it keeps a consistently crash-inducing object bounded toward
        -- the same attempt cap as any other failure mode rather than retried forever.
        or (q.status = 'processing' and q.claimed_at < now() - public.owner_storage_purge_stale_after())
      )
    order by q.updated_at
    limit greatest(1, least(coalesce(p_limit, 25), 100))
    for update skip locked
  )
  update public.owner_storage_purge_queue q
    set status = 'processing', attempt_count = q.attempt_count + 1,
        claimed_at = now(), updated_at = now()
  from claimable c
  where q.id = c.id
  returning jsonb_build_object(
    'id', q.id, 'bucket_id', q.bucket_id, 'object_name', q.object_name,
    'attempt_count', q.attempt_count, 'max_attempts', q.max_attempts);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 4. Complete. The ONLY place a claimed row leaves 'processing'. Idempotent —
--    a row already in a terminal state ('deleted' / 'already_missing') is
--    never overwritten, so a duplicate/replayed completion call (the worker
--    retried its own report after a network blip, say) is harmless.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_storage_purge_complete(
  p_id uuid, p_status text, p_error text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare q record; v_status text;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  if p_status not in ('deleted', 'already_missing', 'failed') then
    raise exception 'invalid completion status';
  end if;

  select * into q from public.owner_storage_purge_queue where id = p_id for update;
  if q.id is null then raise exception 'queue entry not found'; end if;

  if q.status in ('deleted', 'already_missing') then
    return jsonb_build_object('id', q.id, 'status', q.status, 'idempotent', true);
  end if;

  v_status := p_status;
  -- 'failed' is a retry signal, not necessarily terminal: falling back to
  -- 'pending' (rather than staying 'failed') means the SAME claim query in
  -- owner_storage_purge_claim_batch picks it straight back up next sweep,
  -- without a second code path for "retry a failed row" vs. "claim a pending
  -- one" — they are the same query. Once attempt_count reaches max_attempts,
  -- claim_batch's own `attempt_count < max_attempts` predicate stops selecting
  -- it, and 'failed' becomes genuinely terminal — visible, queryable, and
  -- reachable again only through owner_storage_purge_retry_failed.
  if p_status = 'failed' and q.attempt_count < q.max_attempts then
    v_status := 'pending';
  end if;

  update public.owner_storage_purge_queue
    set status = v_status,
        last_error = case when v_status in ('deleted', 'already_missing') then null
                          else left(coalesce(p_error, last_error), 400) end,
        updated_at = now()
    where id = p_id;

  return jsonb_build_object('id', p_id, 'status', v_status, 'idempotent', false);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 5. Owner-facing: force a retry, and read live status.
--
--    Both owner-gated (is_platform_owner()), not service_role — these are the
--    two things a human legitimately needs: "try again" and "did it work".
-- ---------------------------------------------------------------------------
begin;

/** Resets every 'failed' entry for a tombstone back to 'pending' with a fresh attempt budget. */
create or replace function public.owner_storage_purge_retry_failed(p_tombstone_id uuid)
returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  update public.owner_storage_purge_queue
    set status = 'pending', attempt_count = 0, last_error = null, updated_at = now()
    where tombstone_id = p_tombstone_id and status = 'failed';
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

/** The live rollup for one tombstone: what is still pending, what genuinely failed, what is done. */
create or replace function public.owner_storage_purge_status(p_tombstone_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_out jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select jsonb_build_object(
    'expected', count(*),
    'deleted', count(*) filter (where status = 'deleted'),
    'already_missing', count(*) filter (where status = 'already_missing'),
    'failed', count(*) filter (where status = 'failed'),
    'pending', count(*) filter (where status in ('pending', 'processing')),
    'all_resolved', count(*) filter (where status not in ('deleted', 'already_missing')) = 0,
    'objects', coalesce(jsonb_agg(jsonb_build_object(
      'bucket_id', bucket_id, 'object_name', object_name, 'status', status,
      'attempt_count', attempt_count, 'last_error', last_error)) , '[]'::jsonb))
    into v_out
  from public.owner_storage_purge_queue where tombstone_id = p_tombstone_id;
  return coalesce(v_out, jsonb_build_object('expected', 0, 'deleted', 0, 'already_missing', 0,
    'failed', 0, 'pending', 0, 'all_resolved', true, 'objects', '[]'::jsonb));
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6. owner_purge_destroy_row, restated: no more direct storage.objects DELETE.
--
--    Still collects the expected paths first, while the rows that carry them
--    exist — that part is unchanged. What changes is what happens to that
--    list: it is now only RETURNED (as `_storage_cleanup.objects`, an array of
--    {bucket_id, object_name} — no status field, because nothing has attempted
--    a deletion yet at this point). The caller enqueues it after this function
--    returns, in the same transaction, alongside the tombstone.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_destroy_row(
  p_scope text, p_id uuid, p_allow_accounting boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r record; v_root text; v_sql text; v_n bigint; v_locked uuid; v_rel jsonb;
  v_counts jsonb := '{}'::jsonb; v_paths jsonb; v_child uuid;
begin
  v_root := public.owner_force_delete_table(p_scope);
  if v_root is null then raise exception 'scope_not_supported'; end if;

  -- ---------------------------------------------------------------------
  -- THE race-condition gate — unchanged from 20260910130000. Lock the root
  -- row FOR UPDATE first, before reading or deleting anything; for tier 1
  -- (p_allow_accounting = false) re-verify relevance under that lock and
  -- abort if it changed since the preflight ran. See that migration for the
  -- full account of the race this closes (proven with two concurrent
  -- sessions before the fix existed).
  execute format('select id from public.%I where id = $1 for update', v_root)
    into v_locked using p_id;
  if v_locked is null then
    return '{}'::jsonb;
  end if;

  if not p_allow_accounting then
    v_rel := public.owner_record_accounting_relevance(p_scope, p_id);
    if v_rel is not null and (v_rel ->> 'relevant')::boolean then
      raise exception 'purge_race_accounting_relevant';
    end if;
  end if;

  if p_allow_accounting then
    perform set_config('cogniiq.force_delete_id', p_id::text, true);
  end if;

  -- Expected storage paths, collected while the rows carrying them still exist.
  -- NOT deleted here — see the header of this migration for why.
  select coalesce(jsonb_agg(jsonb_build_object('bucket_id', s.bucket_id, 'object_name', s.object_name)), '[]'::jsonb)
    into v_paths from public.owner_purge_storage_paths(p_scope, p_id) s;

  if p_scope = 'customer' then
    for v_child in select id from public.owner_invoices where owner_customer_id = p_id loop
      v_counts := v_counts || jsonb_build_object('_nested_invoice',
        coalesce((v_counts ->> '_nested_invoice')::bigint, 0) + 1);
      v_counts := public.owner_purge_merge_counts(v_counts,
        public.owner_purge_destroy_row('invoice', v_child, p_allow_accounting));
    end loop;
    for v_child in select id from public.owner_offers where owner_customer_id = p_id loop
      v_counts := v_counts || jsonb_build_object('_nested_offer',
        coalesce((v_counts ->> '_nested_offer')::bigint, 0) + 1);
      v_counts := public.owner_purge_merge_counts(v_counts,
        public.owner_purge_destroy_row('offer', v_child, p_allow_accounting));
    end loop;
    if p_allow_accounting then
      perform set_config('cogniiq.force_delete_id', p_id::text, true);
    end if;
  end if;

  for r in select * from public.owner_purge_dependencies(p_scope) loop
    if r.mode = 'delete' then
      v_sql := format('delete from public.%I where %s', r.dep_table, r.predicate);
    elsif r.mode = 'detach' then
      v_sql := format('update public.%I set %s where %s', r.dep_table,
        (select string_agg(format('%I = null', col), ', ') from unnest(r.null_columns) col),
        r.predicate);
    else
      continue;
    end if;
    execute v_sql using p_id;
    get diagnostics v_n = row_count;
    if v_n > 0 then
      v_counts := v_counts || jsonb_build_object(
        r.dep_table || case when r.mode = 'detach' then ' (entkoppelt)' else '' end,
        coalesce((v_counts ->> (r.dep_table || case when r.mode = 'detach' then ' (entkoppelt)' else '' end))::bigint, 0) + v_n);
    end if;
  end loop;

  execute format('delete from public.%I where id = $1', v_root) using p_id;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object(v_root, coalesce((v_counts ->> v_root)::bigint, 0) + v_n);

  perform public.owner_purge_assert_no_orphans(p_scope, p_id);

  -- Merged with whatever the recursion already accumulated (a customer's nested
  -- invoices/offers), not assigned — this level's OWN paths (v_paths, empty for
  -- 'customer', which carries no storage path itself) are added on top.
  v_counts := public.owner_purge_merge_counts(v_counts, jsonb_build_object(
    '_storage_cleanup', jsonb_build_object('expected', jsonb_array_length(v_paths), 'objects', v_paths)));

  perform set_config('cogniiq.force_delete_id', '', true);
  return v_counts;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. owner_purge_merge_counts, restated: the _storage_cleanup shape simplified
--    to {expected, objects} — status ('deleted'/'already_missing') no longer
--    exists at this layer, because nothing has attempted a Storage deletion
--    synchronously anymore. `expected` sums; `objects` concatenates.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_merge_counts(p_acc jsonb, p_next jsonb)
returns jsonb language plpgsql immutable set search_path = public, pg_temp as $$
declare v_out jsonb; k text; v_acc_sc jsonb; v_next_sc jsonb;
begin
  v_out := coalesce(p_acc, '{}'::jsonb);
  if p_next is null then return v_out; end if;

  for k in select jsonb_object_keys(p_next) loop
    if k = '_storage_cleanup' then continue; end if;
    if jsonb_typeof(p_next -> k) = 'number' then
      v_out := v_out || jsonb_build_object(k, coalesce((v_out ->> k)::bigint, 0) + (p_next ->> k)::bigint);
    end if;
  end loop;

  if p_next ? '_storage_cleanup' then
    v_acc_sc := coalesce(v_out -> '_storage_cleanup', jsonb_build_object('expected', 0, 'objects', '[]'::jsonb));
    v_next_sc := p_next -> '_storage_cleanup';
    v_out := v_out || jsonb_build_object('_storage_cleanup', jsonb_build_object(
      'expected', coalesce((v_acc_sc ->> 'expected')::int, 0) + coalesce((v_next_sc ->> 'expected')::int, 0),
      'objects', coalesce(v_acc_sc -> 'objects', '[]'::jsonb) || coalesce(v_next_sc -> 'objects', '[]'::jsonb)));
  end if;

  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 8. The four purge entry points, restated to enqueue after destroying.
--
--    Same shape in all four: tombstone insert (as before) THEN
--    owner_storage_purge_enqueue(tombstone_id, destroyed -> '_storage_cleanup'
--    -> 'objects'), both inside the transaction the RPC itself runs in — so
--    "the rows are gone, the tombstone exists, the queue has the expected
--    objects" is one atomic fact, never a partial one.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_workspace_purge_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[], p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_out jsonb := '[]'::jsonb; v_id uuid; v_plan jsonb; v_summary jsonb;
  v_outcome text; v_error text; v_destroyed jsonb; v_trashed boolean; v_reason text; v_tombstone uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;
  v_reason := coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Papierkorb geleert');

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_outcome := null; v_error := null; v_destroyed := '{}'::jsonb; v_tombstone := null;

    begin
      select (s.trashed_at is not null) into v_trashed
        from public.owner_workspace_item_state s
       where s.business_entity_id = p_entity and s.scope = p_scope and s.resource_id = v_id;

      if coalesce(v_trashed, false) is not true then
        v_outcome := 'blocked'; v_error := 'not_trashed';
      else
        v_plan := public.owner_workspace_purge_preflight_one(p_scope, v_id);

        if (v_plan ->> 'eligibility') = 'not_found' then
          delete from public.owner_workspace_item_state
           where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
          v_outcome := 'hard_deleted';

        elsif (v_plan ->> 'eligibility') <> 'purgeable' then
          v_outcome := 'blocked'; v_error := 'accounting_protected';

        else
          v_summary := coalesce(
            public.owner_force_delete_summary(p_scope, v_id),
            public.owner_record_accounting_relevance(p_scope, v_id));

          v_destroyed := public.owner_purge_destroy_row(p_scope, v_id, false);

          insert into public.owner_deletion_tombstones
            (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
          values (p_entity, p_scope, v_id, v_summary ->> 'label', v_summary,
                  v_destroyed, v_reason, auth.uid())
          returning id into v_tombstone;

          -- Real byte deletion is now the worker's job, not this transaction's.
          -- See owner_storage_purge_enqueue / storage-purge-worker.
          perform public.owner_storage_purge_enqueue(
            v_tombstone, v_destroyed -> '_storage_cleanup' -> 'objects');

          v_outcome := 'hard_deleted';
        end if;
      end if;
    exception when others then
      if sqlerrm like '%purge_race_accounting_relevant%' then
        v_outcome := 'blocked'; v_error := 'accounting_protected';
      else
        v_outcome := 'failed'; v_error := sqlstate;
      end if;
    end;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', 'purge', 'outcome', v_outcome,
      'reasons', coalesce(v_plan -> 'reasons', to_jsonb(array[]::text[])),
      'destroyed', v_destroyed, 'tombstone_id', v_tombstone, 'error', v_error));
  end loop;

  return v_out;
end;
$$;

create or replace function public.owner_force_purge_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[],
  p_reason text, p_confirmation text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_out jsonb := '[]'::jsonb; v_id uuid; v_summary jsonb; v_rel jsonb;
  v_destroyed jsonb; v_outcome text; v_error text; v_reason text; v_trashed boolean; v_tombstone uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if public.owner_force_delete_table(p_scope) is null or p_scope = 'customer' then
    raise exception 'unsupported force purge scope';
  end if;
  if p_confirmation is distinct from public.owner_force_delete_phrase() then
    raise exception 'force_delete_confirmation_required';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 3 then raise exception 'force_delete_reason_required'; end if;

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_outcome := null; v_error := null; v_destroyed := '{}'::jsonb; v_tombstone := null;

    begin
      select (s.trashed_at is not null) into v_trashed
        from public.owner_workspace_item_state s
       where s.business_entity_id = p_entity and s.scope = p_scope and s.resource_id = v_id;

      if coalesce(v_trashed, false) is not true then
        v_outcome := 'blocked'; v_error := 'not_trashed';
      else
        v_summary := public.owner_force_delete_summary(p_scope, v_id);
        if v_summary is null then
          delete from public.owner_workspace_item_state
           where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
          v_outcome := 'hard_deleted';
        else
          v_rel := public.owner_record_accounting_relevance(p_scope, v_id);

          v_destroyed := public.owner_purge_destroy_row(p_scope, v_id, true);

          insert into public.owner_deletion_tombstones
            (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
          values (p_entity, p_scope, v_id, v_summary ->> 'label',
                  v_summary || jsonb_build_object('accounting_relevance', v_rel),
                  v_destroyed, v_reason, auth.uid())
          returning id into v_tombstone;

          perform public.owner_storage_purge_enqueue(
            v_tombstone, v_destroyed -> '_storage_cleanup' -> 'objects');

          v_outcome := 'hard_deleted';
        end if;
      end if;
    exception when others then
      v_outcome := 'failed'; v_error := sqlstate;
    end;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', 'force_delete', 'outcome', v_outcome,
      'reasons', to_jsonb(array[]::text[]), 'destroyed', v_destroyed,
      'tombstone_id', v_tombstone, 'error', v_error));
  end loop;

  return v_out;
end;
$$;

create or replace function public.owner_force_delete_customer(
  p_customer_id uuid, p_reason text, p_confirmation text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; v_reason text; v_summary jsonb; v_rel jsonb; v_destroyed jsonb; v_tombstone uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_confirmation is distinct from public.owner_force_delete_phrase() then
    raise exception 'force_delete_confirmation_required';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 3 then raise exception 'force_delete_reason_required'; end if;

  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  if c.status is distinct from 'archived' then raise exception 'force_delete_requires_archived'; end if;

  v_summary := public.owner_force_delete_summary('customer', p_customer_id);
  v_rel := public.owner_record_accounting_relevance('customer', p_customer_id);

  v_destroyed := public.owner_purge_destroy_row('customer', p_customer_id, true);

  insert into public.owner_deletion_tombstones
    (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
  values (c.business_entity_id, 'customer', p_customer_id, v_summary ->> 'label',
          v_summary || jsonb_build_object('accounting_relevance', v_rel),
          v_destroyed, v_reason, auth.uid())
  returning id into v_tombstone;

  perform public.owner_storage_purge_enqueue(
    v_tombstone, v_destroyed -> '_storage_cleanup' -> 'objects');

  return jsonb_build_object('customer_id', p_customer_id, 'deleted', true,
    'label', v_summary ->> 'label', 'destroyed', v_destroyed, 'tombstone_id', v_tombstone);
end;
$$;

create or replace function public.owner_purge_customer(p_customer_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; v_rel jsonb; v_summary jsonb; v_destroyed jsonb; v_reason text; v_tombstone uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  if c.status is distinct from 'archived' then raise exception 'force_delete_requires_archived'; end if;

  v_rel := public.owner_record_accounting_relevance('customer', p_customer_id);
  if (v_rel ->> 'relevant')::boolean then
    return jsonb_build_object('customer_id', p_customer_id, 'deleted', false,
      'eligibility', 'accounting_protected', 'reasons', v_rel -> 'reasons');
  end if;

  v_reason := coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Kunde ohne Buchhaltungsrelevanz');
  v_summary := public.owner_force_delete_summary('customer', p_customer_id);

  begin
    v_destroyed := public.owner_purge_destroy_row('customer', p_customer_id, false);
  exception when others then
    if sqlerrm like '%purge_race_accounting_relevant%' then
      return jsonb_build_object('customer_id', p_customer_id, 'deleted', false,
        'eligibility', 'accounting_protected',
        'reasons', to_jsonb(array['became_accounting_relevant_during_purge']::text[]));
    end if;
    raise;
  end;

  insert into public.owner_deletion_tombstones
    (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
  values (c.business_entity_id, 'customer', p_customer_id, v_summary ->> 'label',
          coalesce(v_summary, v_rel), v_destroyed, v_reason, auth.uid())
  returning id into v_tombstone;

  perform public.owner_storage_purge_enqueue(
    v_tombstone, v_destroyed -> '_storage_cleanup' -> 'objects');

  return jsonb_build_object('customer_id', p_customer_id, 'deleted', true,
    'eligibility', 'purgeable', 'label', v_summary ->> 'label',
    'destroyed', v_destroyed, 'tombstone_id', v_tombstone);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 9. Dead code removed. owner_purge_delete_storage issued the direct
--    `delete from storage.objects` this whole migration exists to stop doing;
--    nothing calls it anymore, so it is dropped rather than left as a loaded
--    gun for a future caller to find and reach for.
-- ---------------------------------------------------------------------------
begin;

drop function if exists public.owner_purge_delete_storage(jsonb);

commit;

-- ---------------------------------------------------------------------------
-- 10. Grants.
-- ---------------------------------------------------------------------------
begin;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.owner_storage_purge_allowed_buckets()',
    'public.owner_storage_purge_stale_after()',
    'public.owner_storage_purge_enqueue(uuid, jsonb)',
    'public.owner_storage_purge_claim_batch(int)',
    'public.owner_storage_purge_complete(uuid, text, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;

  foreach fn in array array[
    'public.owner_storage_purge_retry_failed(uuid)',
    'public.owner_storage_purge_status(uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 11. SECURE SUPABASE CRON SCHEDULING (documented + guarded; a NO-OP in local
--     tests). Mirrors section 9 of 20260723127000_owner_signed_certificate_
--     workflow.sql exactly — same guard shape, same Vault-only credential
--     source, same every-minute cadence — for the new worker.
--
--   -- One-time: store the secrets in Vault (Dashboard: SQL Editor).
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/storage-purge-worker',
--                              'storage_purge_worker_url');
--   select vault.create_secret('<the WORKER_SECRET value>', 'storage_purge_worker_secret');
--
--   -- Create the every-minute schedule (idempotent — unschedule first if it exists):
--   select cron.unschedule('cogniiq-storage-purge-worker')
--     where exists (select 1 from cron.job where jobname = 'cogniiq-storage-purge-worker');
--   select cron.schedule('cogniiq-storage-purge-worker', '* * * * *', $cron$
--     select net.http_post(
--       url     := (select decrypted_secret from vault.decrypted_secrets where name='storage_purge_worker_url'),
--       headers := jsonb_build_object(
--         'content-type','application/json',
--         'x-worker-secret',(select decrypted_secret from vault.decrypted_secrets where name='storage_purge_worker_secret')),
--       body    := '{}'::jsonb) as request_id;
--   $cron$);
--
--   -- Inspect: select * from cron.job where jobname='cogniiq-storage-purge-worker';
--   -- Pause:   select cron.unschedule('cogniiq-storage-purge-worker');
--
--     A DIFFERENT secret name from the automation worker's — a leaked or
--     rotated automation_worker_secret must never also grant Storage-delete
--     dispatch, and vice versa. Two workers, two secrets.
-- ---------------------------------------------------------------------------
do $$
declare v_has_url boolean := false; v_has_secret boolean := false;
begin
  if not (exists (select 1 from pg_extension where extname = 'pg_cron')
      and exists (select 1 from pg_extension where extname = 'pg_net')
      and exists (select 1 from information_schema.schemata where schema_name = 'vault')) then
    return;  -- NO-OP: local tests / any DB without Vault + pg_cron + pg_net.
  end if;
  execute $q$ select exists (select 1 from vault.decrypted_secrets where name = 'storage_purge_worker_url') $q$ into v_has_url;
  execute $q$ select exists (select 1 from vault.decrypted_secrets where name = 'storage_purge_worker_secret') $q$ into v_has_secret;
  if not (v_has_url and v_has_secret) then
    return;  -- NO-OP until an operator stores both secrets in Vault.
  end if;
  execute $q$ select cron.unschedule('cogniiq-storage-purge-worker')
    where exists (select 1 from cron.job where jobname = 'cogniiq-storage-purge-worker') $q$;
  execute $q$ select cron.schedule('cogniiq-storage-purge-worker', '* * * * *', $cron$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name='storage_purge_worker_url'),
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-worker-secret',(select decrypted_secret from vault.decrypted_secrets where name='storage_purge_worker_secret')),
      body    := '{}'::jsonb) as request_id;
  $cron$) $q$;
end
$$;
