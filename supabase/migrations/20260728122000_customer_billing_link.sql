-- =============================================================================
-- Customer billing — narrow read over the existing owner invoice structures
-- =============================================================================
-- Invoice data is NOT duplicated. owner_invoices remains the single source of
-- truth; customers reach a curated projection of it through one SECURITY DEFINER
-- RPC whose `returns table (...)` signature is the column allow-list.
--
-- What is deliberately unreachable: expenses, subscriptions, internal notes,
-- margins, tax administration data, external references, business entity ids and
-- every other organization's invoices.
--
-- Draft, void and cancelled invoices are never returned: a customer sees an
-- invoice only once it has actually been issued to them.
--
-- Transactional and deterministic (bare structural DDL, no IF NOT EXISTS).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Composite unique anchors. Additive only: id is already the primary key on both
-- tables, so (organization_id, id) is trivially unique. These exist so the link
-- table below can use COMPOSITE foreign keys and therefore cannot associate a
-- project in one organization with an invoice in another.
-- ---------------------------------------------------------------------------
alter table public.owner_invoices
  add constraint owner_invoices_org_id_unique unique (organization_id, id);

alter table public.owner_offers
  add constraint owner_offers_org_id_unique unique (organization_id, id);

-- ---------------------------------------------------------------------------
-- Optional project association for an invoice. Isolation itself does NOT depend
-- on this table: customers see their organization's issued invoices because of
-- organization_id, so no owner busywork is required for correctness. This link
-- only adds the "which project does this invoice belong to?" grouping.
-- ---------------------------------------------------------------------------
create table public.customer_project_invoices (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  invoice_id uuid not null,
  linked_by uuid not null references public.profiles(id) on delete restrict,
  linked_at timestamptz not null default now(),

  primary key (project_id, invoice_id),
  constraint customer_project_invoices_project_fk
    foreign key (organization_id, project_id)
    references public.customer_projects (organization_id, id)
    on delete cascade,
  constraint customer_project_invoices_invoice_fk
    foreign key (organization_id, invoice_id)
    references public.owner_invoices (organization_id, id)
    on delete cascade,
  -- One invoice belongs to at most one customer project.
  constraint customer_project_invoices_invoice_unique unique (invoice_id)
);

create index customer_project_invoices_org_idx
  on public.customer_project_invoices (organization_id, project_id);

comment on table public.customer_project_invoices is
  'Optional project grouping for invoices. Customer isolation comes from owner_invoices.organization_id, not from this table.';

alter table public.customer_project_invoices enable row level security;
revoke all on public.customer_project_invoices from public, anon, authenticated;

create policy customer_project_invoices_internal_all on public.customer_project_invoices
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update, delete on public.customer_project_invoices to authenticated;

-- =============================================================================
-- CUSTOMER READ RPC
-- =============================================================================
-- pdf_document_id resolution is DETERMINISTIC and strictly typed:
--   * only owner_generated_documents whose source is THIS invoice,
--   * only document_type = 'invoice' — a credit_note, payment_confirmation or
--     cancellation_invoice for the same invoice can never become the invoice PDF,
--   * only status = 'finalized' (drafts never surface),
--   * only rows already published to the customer (customer_visible, not archived),
--   * highest version wins, with the customer_documents id as a stable tiebreak,
--     so the result cannot flip between calls.
-- =============================================================================

create or replace function public.list_customer_invoices(p_project_id uuid default null)
returns table (
  invoice_id uuid,
  project_id uuid,
  invoice_number text,
  status text,
  issue_date date,
  due_date date,
  currency text,
  net_total_cents bigint,
  vat_total_cents bigint,
  gross_total_cents bigint,
  amount_paid_cents bigint,
  outstanding_cents bigint,
  pdf_document_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  return query
  select
    i.id,
    link.project_id,
    i.invoice_number,
    i.status,
    i.issue_date,
    i.due_date,
    i.currency,
    i.net_total_cents,
    i.vat_total_cents,
    i.gross_total_cents,
    i.amount_paid_cents,
    greatest(i.gross_total_cents - i.amount_paid_cents, 0)::bigint,
    (
      select cd.id
      from public.customer_documents cd
      join public.owner_generated_documents ogd
        on ogd.id = cd.owner_generated_document_id
      where cd.organization_id = i.organization_id
        and cd.customer_visible = true
        and cd.archived_at is null
        and ogd.source_resource_type = 'owner_invoices'
        and ogd.source_resource_id = i.id
        and ogd.document_type = 'invoice'
        and ogd.status = 'finalized'
      order by ogd.version desc, cd.id desc
      limit 1
    )
  from public.owner_invoices i
  left join public.customer_project_invoices link
    on link.invoice_id = i.id
   and link.organization_id = i.organization_id
  where i.organization_id is not null
    and public.is_organization_member(i.organization_id)
    -- Only invoices actually issued to the customer. Draft/void/cancelled never appear.
    and i.status in ('issued', 'partially_paid', 'paid', 'overdue', 'credited')
    and (p_project_id is null or link.project_id = p_project_id)
  order by i.issue_date desc nulls last, i.invoice_number desc nulls last, i.id asc;
end;
$$;

comment on function public.list_customer_invoices(uuid) is
  'Customer-facing invoice list. NULL project returns every issued invoice in the organization; a project id scopes to that project. pdf_document_id resolves only to the latest FINALIZED document_type=invoice PDF, so credit notes and payment confirmations can never be served as the invoice.';

revoke all on function public.list_customer_invoices(uuid) from public, anon;
grant execute on function public.list_customer_invoices(uuid) to authenticated;

-- =============================================================================
-- OWNER / ADMIN WRITE RPCs
-- =============================================================================

create or replace function public.link_customer_project_invoice(
  p_project_id uuid,
  p_invoice_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_project_org uuid; v_invoice_org uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  select organization_id into v_project_org from public.customer_projects where id = p_project_id;
  if not found then
    raise exception 'customer project % not found', p_project_id;
  end if;

  select organization_id into v_invoice_org from public.owner_invoices where id = p_invoice_id;
  if not found then
    raise exception 'invoice % not found', p_invoice_id;
  end if;

  -- The composite FK below would reject a mismatch anyway; this produces a clear
  -- message instead of a raw constraint violation.
  if v_invoice_org is null or v_invoice_org <> v_project_org then
    raise exception 'invoice % belongs to a different organization than project %', p_invoice_id, p_project_id;
  end if;

  insert into public.customer_project_invoices (organization_id, project_id, invoice_id, linked_by)
  values (v_project_org, p_project_id, p_invoice_id, auth.uid())
  on conflict (project_id, invoice_id) do nothing;
end;
$$;

create or replace function public.unlink_customer_project_invoice(
  p_project_id uuid,
  p_invoice_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  delete from public.customer_project_invoices
  where project_id = p_project_id and invoice_id = p_invoice_id;
end;
$$;

revoke all on function public.link_customer_project_invoice(uuid, uuid) from public, anon;
revoke all on function public.unlink_customer_project_invoice(uuid, uuid) from public, anon;
grant execute on function public.link_customer_project_invoice(uuid, uuid) to authenticated;
grant execute on function public.unlink_customer_project_invoice(uuid, uuid) to authenticated;

commit;
