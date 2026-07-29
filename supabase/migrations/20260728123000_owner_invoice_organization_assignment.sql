-- =============================================================================
-- Invoice-organization assignment — the real fix path for the null-organization gap
-- =============================================================================
-- owner_invoices.organization_id is nullable (an invoice can be created before, or
-- entirely without, CRM/portal linkage). Linking such an invoice to a customer
-- project, or publishing its canonical PDF to a customer, is already refused by
-- the database (composite FK on the link table; the source-consistency trigger on
-- customer_documents) — but refusing is not the same as giving the owner a real
-- way to fix it. This migration adds exactly that: a narrowly scoped, admin-gated
-- RPC that assigns an organization to an invoice that does not have one yet.
--
-- It deliberately does NOT allow reassigning an invoice that already belongs to a
-- DIFFERENT organization — retroactively moving a finalized invoice between
-- customers is a data-integrity hazard this feature must never enable. Only the
-- null -> set transition is permitted.
--
-- Transactional and deterministic (bare DDL, no IF NOT EXISTS on structural objects).
-- =============================================================================

begin;

create or replace function public.assign_invoice_organization(
  p_invoice_id uuid,
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  select organization_id into v_current from public.owner_invoices where id = p_invoice_id;
  if not found then
    raise exception 'invoice % not found', p_invoice_id;
  end if;

  if v_current is not null and v_current <> p_organization_id then
    raise exception 'invoice % already belongs to a different organization; reassigning an existing organization is not permitted', p_invoice_id;
  end if;

  -- Idempotent when already assigned to the SAME organization; otherwise sets it once.
  update public.owner_invoices set organization_id = p_organization_id where id = p_invoice_id;
end;
$$;

revoke all on function public.assign_invoice_organization(uuid, uuid) from public, anon;
grant execute on function public.assign_invoice_organization(uuid, uuid) to authenticated;

commit;
