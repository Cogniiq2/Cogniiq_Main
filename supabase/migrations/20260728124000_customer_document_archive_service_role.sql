-- =============================================================================
-- Service-role archive RPC for the customer-document-upload Edge Function's
-- retire ("archive" mode) path.
-- =============================================================================
-- BUG FIXED: the Edge Function's retire flow called `archive_customer_document()`
-- using a SERVICE-ROLE client. That function is gated by `is_platform_admin()`,
-- which reads `auth.uid()` -- and a service-role connection has no session
-- `auth.uid()` (it is NULL), so every archive request routed through the Edge
-- Function was unconditionally rejected with "not authorized", and any audit
-- event it did manage to write would have recorded a NULL actor.
--
-- Fix: a dedicated, service_role-only RPC that takes the caller id explicitly
-- (already verified by the Edge Function via the caller's own JWT) and re-checks
-- admin status with `is_platform_admin_as(p_caller_id)` -- the same pattern
-- already used by `register_customer_document_from_upload` and
-- `delete_unpublished_customer_document`. The verified caller, not a null actor,
-- is what lands in the audit event.
--
-- `archive_customer_document()` (the `authenticated`-granted, auth.uid()-based
-- version used by the owner's own browser session in CustomerProjectPanel) is
-- untouched and remains the correct path for that direct, non-service-role call.
--
-- Function-only migration (create-or-replace + grants) -- safely re-appliable,
-- no structural DDL to drift.
-- =============================================================================

begin;

create or replace function public.archive_customer_document_as(
  p_caller_id uuid,
  p_document_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_title text;
  v_category public.customer_document_category;
begin
  if not public.is_platform_admin_as(p_caller_id) then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  update public.customer_documents
  set customer_visible = false, archived_at = now()
  where id = p_document_id and archived_at is null
  returning organization_id, title, category into v_org, v_title, v_category;

  if not found then
    raise exception 'customer document % not found or already archived', p_document_id;
  end if;

  insert into public.customer_document_access_events (
    organization_id, document_id, document_title_snapshot, document_category_snapshot,
    user_id, user_display_name_snapshot, event_type
  )
  select v_org, p_document_id, v_title, v_category, p_caller_id,
         coalesce(pr.full_name, pr.email, 'Unbekannt'), 'archived'
  from public.profiles pr
  where pr.id = p_caller_id;
end;
$$;

revoke all on function public.archive_customer_document_as(uuid, uuid) from public, anon, authenticated;
grant execute on function public.archive_customer_document_as(uuid, uuid) to service_role;

commit;
