-- =============================================================================
-- Organization-scoped customer project creation — the real integration point
-- =============================================================================
-- Canonical portal customers live under /admin/clients, keyed by organization_id
-- (organizations / client_accounts). create_customer_project_for_owner_customer()
-- (20260728120000) requires an owner_customers row with a linked organization_id,
-- which is the SEPARATE internal Finance CRM entity — most real portal
-- organizations (e.g. the existing Pankofer customer project) have no such row and
-- never need one. That mismatch made customer-project management unreachable from
-- the canonical customer screen.
--
-- This migration adds a second, narrower creation path that is scoped directly by
-- organization_id and validates only that the organization exists — no
-- owner_customers row is required, created, backfilled or merged. The existing
-- owner_customers-scoped RPC is untouched; both paths insert into the same
-- customer_projects table and are otherwise identical (auth gate, tenant column,
-- audit columns).
--
-- Transactional and deterministic (bare DDL, no IF NOT EXISTS on structural
-- objects — this migration is function/grant-only, so a second apply is expected
-- to succeed, same as its sibling RPC migrations).
-- =============================================================================

begin;

create or replace function public.create_customer_project_for_organization(
  p_organization_id uuid,
  p_title text,
  p_business_objective text,
  p_phase text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  if p_organization_id is null then
    raise exception 'organization id is required';
  end if;

  if not exists (select 1 from public.organizations o where o.id = p_organization_id) then
    raise exception 'organization % not found', p_organization_id;
  end if;

  insert into public.customer_projects (
    organization_id, title, business_objective, phase, created_by, updated_by
  )
  values (p_organization_id, p_title, p_business_objective, p_phase, auth.uid(), auth.uid())
  returning customer_projects.id into v_project_id;

  return v_project_id;
end;
$$;

revoke all on function public.create_customer_project_for_organization(uuid, text, text, text) from public, anon;
grant execute on function public.create_customer_project_for_organization(uuid, text, text, text) to authenticated;

commit;
