-- =============================================================================
-- Service-onboarding audit fix: resolve the business entity through the
-- engagement instead of mistaking a row id for one.
--
-- PRODUCTION DEFECT
-- -----------------
-- owner_add_customer_service(...) failed with 23503:
--
--   insert or update on table "owner_audit_log" violates foreign key constraint
--   "owner_audit_log_business_entity_id_fkey"
--   Key (business_entity_id)=(64e1b3cf-...) is not present in
--   table "owner_business_entities".
--
-- Migration 20260830120000 attached the GENERIC audit factory
-- public.owner_write_audit_row() (20260722120000) to four tables:
--
--   owner_customer_services      -- has business_entity_id
--   owner_service_engagements    -- has business_entity_id
--   owner_engagement_tasks       -- has ONLY engagement_id
--   owner_engagement_fields      -- has ONLY engagement_id
--
-- The generic factory resolves the entity as
--
--   coalesce((row->>'business_entity_id')::uuid, (row->>'id')::uuid)
--
-- That `id` fallback is correct for exactly one table -- owner_business_entities,
-- where the row's own id IS the entity -- and is wrong for every table that
-- simply lacks the column. For owner_engagement_tasks / owner_engagement_fields
-- it silently promoted the TASK's or FIELD's primary key into
-- owner_audit_log.business_entity_id, which the foreign key then rejected. The
-- failing UUID was therefore never a business entity at all; it was the first
-- instantiated engagement task. Because instantiation runs inside the RPC's
-- transaction, the whole call rolled back and no customer could be given a
-- service.
--
-- FIX
-- ---
-- A dedicated trigger function for the onboarding tables that resolves the
-- entity honestly:
--
--   1. the row's own business_entity_id when it has one;
--   2. otherwise owner_service_engagements.business_entity_id, looked up by the
--      row's engagement_id;
--   3. otherwise it FAILS -- it never substitutes an arbitrary row id.
--
-- The generic owner_write_audit_row() is deliberately NOT modified: it is
-- attached to eleven finance tables whose behaviour is asserted elsewhere, and
-- its `id` fallback is load-bearing for owner_business_entities. Only the four
-- onboarding triggers are repointed. No finance trigger changes. The foreign
-- key on owner_audit_log is untouched -- it did its job.
--
-- FULLY ADDITIVE + IDEMPOTENT: CREATE OR REPLACE plus DROP/CREATE of the four
-- onboarding triggers only. No previously applied migration is edited, no
-- customer data is read or written, nothing is deleted.
-- =============================================================================

begin;

create or replace function public.owner_write_service_onboarding_audit_row()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  -- Identical sanitisation list to public.owner_write_audit_row(): free-text and
  -- blob-ish columns never reach the audit log, so before/after summaries stay
  -- equivalent to the rest of the audit system rather than a second dialect.
  strip text[] := array['notes', 'breakdown', 'before_summary', 'after_summary', 'depreciation_snapshot',
    'validation_result', 'file_metadata', 'record_counts', 'assumptions_notes', 'review_reason', 'metadata'];
  v_new jsonb;
  v_old jsonb;
  v_row jsonb;
  v_entity uuid;
  v_engagement uuid;
  v_rid uuid;
begin
  if tg_op <> 'DELETE' then v_new := to_jsonb(new) - strip; end if;
  if tg_op <> 'INSERT' then v_old := to_jsonb(old) - strip; end if;
  v_row := coalesce(v_new, v_old);
  v_rid := (v_row->>'id')::uuid;

  -- 1. The row carries the entity itself (owner_customer_services,
  --    owner_service_engagements). Both declare it NOT NULL, so this branch is
  --    always taken for them.
  v_entity := (v_row->>'business_entity_id')::uuid;

  -- 2. Otherwise the row is engagement-scoped (owner_engagement_tasks,
  --    owner_engagement_fields) and the entity is resolved through its parent.
  if v_entity is null then
    v_engagement := (v_row->>'engagement_id')::uuid;
    if v_engagement is null then
      raise exception
        'onboarding audit: % row % carries neither business_entity_id nor engagement_id',
        tg_argv[0], v_rid;
    end if;
    select e.business_entity_id into v_entity
      from public.owner_service_engagements e
     where e.id = v_engagement;
  end if;

  -- 3. Fail closed. The row id is NEVER promoted to a business entity: writing a
  --    wrong entity is worse than writing none, and silently guessing is what
  --    produced the production failure this migration exists to fix.
  if v_entity is null then
    if tg_op = 'DELETE' then
      -- The only legitimate way here: the parent engagement was deleted in this
      -- same statement and these rows are its ON DELETE CASCADE children (a
      -- customer, a service or an engagement being removed). Raising would abort
      -- that cascade. The engagement's own audit row already records the delete
      -- WITH its entity, so the child rows are logged with a null entity rather
      -- than a fabricated one -- the column is nullable exactly for this.
      v_entity := null;
    else
      raise exception
        'onboarding audit: % row % references engagement % which has no business entity',
        tg_argv[0], v_rid, v_engagement;
    end if;
  end if;

  insert into public.owner_audit_log
    (business_entity_id, actor_user_id, action, resource_type, resource_id, before_summary, after_summary)
  values (v_entity, auth.uid(), tg_argv[0] || '.' || lower(tg_op), tg_argv[0], v_rid, v_old, v_new);
  return coalesce(new, old);
end;
$$;

-- Same posture as every other owner-side SECURITY DEFINER function here: the
-- browser can neither call it nor forge an audit row through it. PostgreSQL does
-- not check EXECUTE on trigger functions, so these grants are belt-and-braces
-- against anyone ever calling it directly.
revoke execute on function public.owner_write_service_onboarding_audit_row() from public, anon, authenticated;
grant execute on function public.owner_write_service_onboarding_audit_row() to service_role;

commit;

-- ---------------------------------------------------------------------------
-- Repoint ONLY the four onboarding audit triggers. The finance triggers created
-- by 20260722120000 keep the generic factory and are not touched.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_customer_services', 'owner_service_engagements',
    'owner_engagement_tasks', 'owner_engagement_fields'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I '
      || 'for each row execute function public.owner_write_service_onboarding_audit_row(%L)',
      t || '_audit', t, t);
  end loop;
end;
$$;

commit;
