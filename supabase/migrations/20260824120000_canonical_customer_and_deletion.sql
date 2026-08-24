-- =============================================================================
-- Canonical customer + deliberate deletion semantics
--
-- WHY
-- ---
-- The admin dashboard carried three overlapping notions of "customer":
--
--   organizations    tenancy/auth object. ~20 tables CASCADE off it, including
--                    customer_documents, customer_projects and receptionist_configs.
--   client_accounts  billing identity. owner_invoices/payments/subscriptions/
--                    expenses point here (ON DELETE SET NULL).
--   owner_customers  the CRM workspace the owner actually works in. Only offers,
--                    tasks and activity pointed here.
--
-- Nothing joined them. Creating a customer while writing an invoice wrote an
-- organization/client_account and never produced an owner_customers row, so the
-- CRM page could not see it; creating one in the CRM produced an owner_customers
-- row the invoice composer could not select. Production shows both halves of that
-- split: SV Heinersreuth exists twice under different names and e-mails, and
-- Pankofer has an ISSUED invoice while having no CRM record at all.
--
-- WHAT THIS DOES
-- --------------
-- owner_customers becomes the canonical commercial customer. Every financial
-- object gains owner_customer_id and is backfilled from the links it already
-- had. organizations stays exactly what it is — the portal/login tenant — and is
-- referenced FROM the canonical customer, never as the customer itself. There is
-- no second customer dataset and nothing to synchronise: the same row is read by
-- CRM and Finance.
--
-- Deletion is made deliberate rather than uniform:
--   * drafts (never-issued invoices, draft offers, tasks) hard-delete;
--   * issued invoices are cancelled (Storno) and keep number, totals and lines;
--   * a customer with protected records cannot be hard-deleted at all — the FK is
--     ON DELETE RESTRICT, so this holds even if a future caller bypasses the RPC.
--
-- Additive and idempotent. No existing migration is modified, no row is deleted,
-- no production value is overwritten: the backfill only fills NULLs.
-- =============================================================================

begin;

do $$
begin
  if to_regprocedure('public.is_platform_owner()') is null
    or to_regclass('public.owner_customers') is null
    or to_regclass('public.owner_invoices') is null then
    raise exception 'canonical customer migration requires the owner finance + customer foundations';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. The canonical reference.
--
--    RESTRICT, not CASCADE and not SET NULL, on the three tables that carry
--    accounting-relevant history. SET NULL is what produced the orphan invoice
--    in production (an invoice pointing at nothing); CASCADE would destroy
--    bookkeeping records on a UI click. RESTRICT makes "you cannot delete this
--    customer" a database fact instead of a UI convention.
--
--    owner_expenses is deliberately SET NULL: an expense is OUR cost, and the
--    customer link there is cost allocation, not a customer document.
-- ---------------------------------------------------------------------------
alter table public.owner_invoices
  add column if not exists owner_customer_id uuid references public.owner_customers(id) on delete restrict;
alter table public.owner_payments
  add column if not exists owner_customer_id uuid references public.owner_customers(id) on delete restrict;
alter table public.owner_subscriptions
  add column if not exists owner_customer_id uuid references public.owner_customers(id) on delete restrict;
alter table public.owner_expenses
  add column if not exists owner_customer_id uuid references public.owner_customers(id) on delete set null;

create index if not exists owner_invoices_owner_customer_idx
  on public.owner_invoices (owner_customer_id) where owner_customer_id is not null;
create index if not exists owner_payments_owner_customer_idx
  on public.owner_payments (owner_customer_id) where owner_customer_id is not null;
create index if not exists owner_subscriptions_owner_customer_idx
  on public.owner_subscriptions (owner_customer_id) where owner_customer_id is not null;
create index if not exists owner_expenses_owner_customer_idx
  on public.owner_expenses (owner_customer_id) where owner_customer_id is not null;

comment on column public.owner_invoices.owner_customer_id is
  'Canonical customer. The immutable relational identity; recipient_* / organization_id remain the historical document snapshot and the portal tenant respectively.';

-- ---------------------------------------------------------------------------
-- 2. Cancellation (Storno) fields on invoices.
--
--    An issued invoice is never physically removed — §147 AO retention. It is
--    marked cancelled and keeps its number, its totals and its lines. Only the
--    fact of cancellation, its time, its actor and its reason are added.
-- ---------------------------------------------------------------------------
alter table public.owner_invoices
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null,
  add column if not exists cancellation_reason text;

comment on column public.owner_invoices.cancelled_at is
  'Set by owner_cancel_invoice. The invoice row, its number, totals and lines are retained unchanged; only the status becomes cancelled.';

-- ---------------------------------------------------------------------------
-- 3. Archive flag on the canonical customer.
--
--    status already carries 'archived'. archived_at/by record WHEN and BY WHOM,
--    which status alone cannot, and lets the list views filter without parsing
--    the activity log.
-- ---------------------------------------------------------------------------
alter table public.owner_customers
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

create index if not exists owner_customers_active_idx
  on public.owner_customers (business_entity_id, last_activity_at desc)
  where archived_at is null;

commit;

-- ---------------------------------------------------------------------------
-- 4. Backfill — deterministic, NULL-only, non-destructive.
--
--    Order matters: strongest key first. client_account_id identifies a customer
--    exactly; organization_id identifies the tenant they belong to; normalized
--    e-mail is advisory. Company name is NEVER a merge key — "SV Heinersreuth
--    eV." and "Sportverein Heinersreuth 1921 e.V." are the same customer, and no
--    string comparison should be trusted to know that.
-- ---------------------------------------------------------------------------
begin;

-- (a) Complete the links on customers that already exist. Only fills NULLs, so a
--     value an owner set by hand is never overwritten.
update public.owner_customers c
set organization_id = ca.organization_id
from public.client_accounts ca
where c.client_account_id = ca.id and c.organization_id is null;

update public.owner_customers c
set client_account_id = ca.id
from public.client_accounts ca
where c.organization_id = ca.organization_id and c.client_account_id is null
  and (select count(*) from public.client_accounts x where x.organization_id = c.organization_id) = 1;

-- (b) SV Heinersreuth: one canonical record, decided by the owner (24.08.2026).
--     The owner_customers row wins on name and contact e-mail; the CRM account and
--     its organization are linked to it so portal access, documents and the second
--     e-mail all survive. Nothing is renamed and nothing is deleted.
update public.owner_customers c
set client_account_id = coalesce(c.client_account_id, ca.id),
    organization_id   = coalesce(c.organization_id, ca.organization_id)
from public.client_accounts ca
where c.client_account_id is null
  and c.organization_id is null
  and lower(coalesce(c.company, '')) like '%heinersreuth%'
  and lower(coalesce(ca.legal_name, ca.display_name, '')) like '%heinersreuth%';

-- (c) Materialize a canonical customer for every client_account that carries
--     financial records but has none yet. This is the Pankofer case: an issued
--     invoice whose customer was invisible to the CRM.
insert into public.owner_customers
  (business_entity_id, client_account_id, organization_id, company, contact_name, email, phone, status)
select distinct on (f.business_entity_id, f.client_account_id)
  f.business_entity_id, f.client_account_id, ca.organization_id,
  coalesce(ca.legal_name, ca.display_name), ca.primary_contact_name, ca.primary_email, ca.phone, 'active'
from (
  select business_entity_id, client_account_id from public.owner_invoices where client_account_id is not null
  union all
  select business_entity_id, client_account_id from public.owner_payments where client_account_id is not null
  union all
  select business_entity_id, client_account_id from public.owner_subscriptions where client_account_id is not null
) f
join public.client_accounts ca on ca.id = f.client_account_id
where not exists (
  select 1 from public.owner_customers c
  where c.business_entity_id = f.business_entity_id and c.client_account_id = f.client_account_id)
order by f.business_entity_id, f.client_account_id;

-- (d) Same for records linked only to an organization (no client_account). The
--     production invoice RE-2026-0002 sits exactly here.
insert into public.owner_customers
  (business_entity_id, organization_id, client_account_id, company, contact_name, email, phone, status)
select distinct on (f.business_entity_id, f.organization_id)
  f.business_entity_id, f.organization_id,
  (select ca.id from public.client_accounts ca where ca.organization_id = f.organization_id order by ca.created_at limit 1),
  coalesce(
    (select coalesce(ca.legal_name, ca.display_name) from public.client_accounts ca where ca.organization_id = f.organization_id order by ca.created_at limit 1),
    o.name),
  (select ca.primary_contact_name from public.client_accounts ca where ca.organization_id = f.organization_id order by ca.created_at limit 1),
  (select ca.primary_email from public.client_accounts ca where ca.organization_id = f.organization_id order by ca.created_at limit 1),
  (select ca.phone from public.client_accounts ca where ca.organization_id = f.organization_id order by ca.created_at limit 1),
  'active'
from (
  select business_entity_id, organization_id from public.owner_invoices where organization_id is not null and client_account_id is null
  union all
  select business_entity_id, organization_id from public.owner_subscriptions where organization_id is not null and client_account_id is null
) f
join public.organizations o on o.id = f.organization_id
where not exists (
  select 1 from public.owner_customers c
  where c.business_entity_id = f.business_entity_id and c.organization_id = f.organization_id)
order by f.business_entity_id, f.organization_id;

-- (e) Point the financial records at the canonical customer. NULL-only.
update public.owner_invoices i set owner_customer_id = c.id
from public.owner_customers c
where i.owner_customer_id is null and i.client_account_id is not null
  and c.business_entity_id = i.business_entity_id and c.client_account_id = i.client_account_id;

update public.owner_invoices i set owner_customer_id = c.id
from public.owner_customers c
where i.owner_customer_id is null and i.organization_id is not null
  and c.business_entity_id = i.business_entity_id and c.organization_id = i.organization_id;

update public.owner_payments p set owner_customer_id = i.owner_customer_id
from public.owner_invoices i
where p.owner_customer_id is null and p.invoice_id = i.id and i.owner_customer_id is not null;

update public.owner_payments p set owner_customer_id = c.id
from public.owner_customers c
where p.owner_customer_id is null and p.client_account_id is not null
  and c.business_entity_id = p.business_entity_id and c.client_account_id = p.client_account_id;

update public.owner_subscriptions s set owner_customer_id = c.id
from public.owner_customers c
where s.owner_customer_id is null
  and c.business_entity_id = s.business_entity_id
  and (
    (s.client_account_id is not null and c.client_account_id = s.client_account_id)
    or (s.client_account_id is null and s.organization_id is not null and c.organization_id = s.organization_id)
  );

update public.owner_expenses e set owner_customer_id = c.id
from public.owner_customers c
where e.owner_customer_id is null and e.client_account_id is not null
  and c.business_entity_id = e.business_entity_id and c.client_account_id = e.client_account_id;

-- (f) Offers were linked by an earlier migration, but only where an offer already
--     had a client_account/recipient e-mail. Close the organization-only gap too.
update public.owner_offers o set owner_customer_id = c.id
from public.owner_customers c
where o.owner_customer_id is null and o.organization_id is not null
  and c.business_entity_id = o.business_entity_id and c.organization_id = o.organization_id;

-- (g) Keep archived_at consistent with the pre-existing status value.
update public.owner_customers
set archived_at = coalesce(archived_at, updated_at)
where status = 'archived' and archived_at is null;

commit;

-- ---------------------------------------------------------------------------
-- 5. Blocker inspection.
--
--    One place decides what "protected" means, so the UI, the delete RPC and the
--    tests can never drift apart. Returns counts, not booleans: the dialog names
--    what is in the way instead of only refusing.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_customer_delete_blockers(p_customer_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare
  v_issued_invoices int; v_payments int; v_final_offers int;
  v_draft_invoices int; v_draft_offers int; v_subscriptions int; v_documents int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not exists (select 1 from public.owner_customers where id = p_customer_id) then
    raise exception 'customer not found';
  end if;

  -- Protected: anything that became a real accounting or business document.
  select count(*) into v_issued_invoices from public.owner_invoices
   where owner_customer_id = p_customer_id and (status <> 'draft' or issued_at is not null);
  select count(*) into v_payments from public.owner_payments where owner_customer_id = p_customer_id;
  select count(*) into v_final_offers from public.owner_offers
   where owner_customer_id = p_customer_id and (status <> 'draft' or finalized_version is not null);
  select count(*) into v_subscriptions from public.owner_subscriptions where owner_customer_id = p_customer_id;

  -- Removable with the customer: never-issued drafts.
  select count(*) into v_draft_invoices from public.owner_invoices
   where owner_customer_id = p_customer_id and status = 'draft' and issued_at is null;
  select count(*) into v_draft_offers from public.owner_offers
   where owner_customer_id = p_customer_id and status = 'draft' and finalized_version is null;

  -- Portal documents live on the organization, not on the customer, and are
  -- reported so the owner sees them before archiving.
  select count(*) into v_documents from public.customer_documents d
   join public.owner_customers c on c.organization_id = d.organization_id
   where c.id = p_customer_id;

  return jsonb_build_object(
    'issued_invoices', v_issued_invoices,
    'payments', v_payments,
    'finalized_offers', v_final_offers,
    'subscriptions', v_subscriptions,
    'portal_documents', v_documents,
    'draft_invoices', v_draft_invoices,
    'draft_offers', v_draft_offers,
    'deletable', (v_issued_invoices + v_payments + v_final_offers + v_subscriptions) = 0
  );
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6. Customer deletion and archiving.
--
--    Hard delete removes the customer AND its never-issued drafts, because a
--    draft has no independent existence once its customer is gone. It refuses,
--    with a German message naming the blockers, as soon as one protected record
--    exists. Archiving is the always-available alternative and destroys nothing.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_delete_customer(p_customer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b jsonb; c record; v_label text; v_offer uuid; v_invoice uuid;
        v_deleted_offers int := 0; v_deleted_invoices int := 0;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  v_label := coalesce(c.company, c.contact_name, c.email, 'Kunde');

  b := public.owner_customer_delete_blockers(p_customer_id);
  if not (b->>'deletable')::boolean then
    raise exception using
      errcode = '23503',
      message = format(
        '%s kann nicht gelöscht werden: %s ausgestellte Rechnung(en), %s Zahlung(en), %s verbindliche(s) Angebot(e), %s Abonnement(s). Archivieren Sie den Kunden stattdessen.',
        v_label, b->>'issued_invoices', b->>'payments', b->>'finalized_offers', b->>'subscriptions');
  end if;

  -- Drafts first: the FK is RESTRICT, so the customer row cannot go while they
  -- still point at it. Each goes through its own guarded RPC so the draft-only
  -- conditions (no payments, no generated documents, no access tokens) are
  -- re-checked rather than assumed.
  for v_offer in select id from public.owner_offers
                  where owner_customer_id = p_customer_id and status = 'draft' and finalized_version is null loop
    perform public.delete_owner_offer_draft(gen_random_uuid(), v_offer);
    v_deleted_offers := v_deleted_offers + 1;
  end loop;

  for v_invoice in select id from public.owner_invoices
                    where owner_customer_id = p_customer_id and status = 'draft' and issued_at is null loop
    perform public.delete_owner_draft_invoice(v_invoice);
    v_deleted_invoices := v_deleted_invoices + 1;
  end loop;

  -- Expenses only reference the customer for cost allocation; release the link
  -- rather than deleting someone's bookkeeping.
  update public.owner_expenses set owner_customer_id = null where owner_customer_id = p_customer_id;

  -- Tasks and activity CASCADE. The audit trigger records the delete itself.
  delete from public.owner_customers where id = p_customer_id;

  return jsonb_build_object(
    'customer_id', p_customer_id, 'deleted', true, 'label', v_label,
    'deleted_draft_offers', v_deleted_offers, 'deleted_draft_invoices', v_deleted_invoices);
end;
$$;

create or replace function public.owner_archive_customer(p_customer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;

  update public.owner_customers
  set status = 'archived', archived_at = coalesce(archived_at, now()), archived_by = coalesce(archived_by, auth.uid())
  where id = p_customer_id;

  perform public.owner_record_customer_activity(p_customer_id, 'customer_archived', 'Kunde archiviert');
  return jsonb_build_object('customer_id', p_customer_id, 'status', 'archived');
end;
$$;

create or replace function public.owner_unarchive_customer(p_customer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;

  update public.owner_customers
  set status = 'active', archived_at = null, archived_by = null
  where id = p_customer_id;

  perform public.owner_record_customer_activity(p_customer_id, 'customer_unarchived', 'Kunde wieder aktiviert');
  return jsonb_build_object('customer_id', p_customer_id, 'status', 'active');
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Invoice cancellation (Storno).
--
--    NOT a delete. Number, totals, lines, issue date and payments stay exactly as
--    they were; the invoice leaves the active view as 'cancelled' and carries who
--    cancelled it, when, and why. owner_apply_payment already treats 'cancelled'
--    as terminal, so a later payment edit cannot silently revive it.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_cancel_invoice(p_invoice_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;

  if inv.status = 'draft' and inv.issued_at is null then
    raise exception 'Entwürfe werden gelöscht, nicht storniert';
  end if;
  if inv.status in ('cancelled', 'void') then
    return jsonb_build_object('invoice_id', p_invoice_id, 'status', inv.status, 'already_cancelled', true);
  end if;

  update public.owner_invoices
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = auth.uid(),
      cancellation_reason = nullif(btrim(p_reason), '')
  where id = p_invoice_id;

  if inv.owner_customer_id is not null then
    perform public.owner_record_customer_activity(
      inv.owner_customer_id, 'invoice_cancelled',
      'Rechnung ' || coalesce(inv.invoice_number, 'ohne Nummer') || ' storniert');
  end if;

  return jsonb_build_object('invoice_id', p_invoice_id, 'status', 'cancelled',
    'invoice_number', inv.invoice_number, 'already_cancelled', false);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 8. Linking a financial record to the canonical customer.
--
--    Mirrors owner_link_offer_customer. Unlike assign_invoice_organization this
--    permits re-pointing only while the invoice is still a draft: moving a
--    FINALIZED invoice between customers rewrites accounting history.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_link_invoice_customer(p_invoice_id uuid, p_owner_customer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record; cust record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;

  if p_owner_customer_id is not null then
    select * into cust from public.owner_customers where id = p_owner_customer_id;
    if cust.id is null then raise exception 'customer not found'; end if;
    if cust.business_entity_id <> inv.business_entity_id then
      raise exception 'customer belongs to a different business entity';
    end if;
  end if;

  if inv.owner_customer_id is not null
     and inv.owner_customer_id is distinct from p_owner_customer_id
     and (inv.status <> 'draft' or inv.issued_at is not null) then
    raise exception 'Eine ausgestellte Rechnung kann keinem anderen Kunden zugeordnet werden';
  end if;

  update public.owner_invoices set owner_customer_id = p_owner_customer_id where id = p_invoice_id;
  return jsonb_build_object('invoice_id', p_invoice_id, 'owner_customer_id', p_owner_customer_id);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 9. Reads: the CRM list and detail now carry the commercial relationship, so
--    both surfaces render from one query against one table.
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
      'street', c.street, 'postal_code', c.postal_code, 'city', c.city,
      'status', c.status, 'notes', c.notes,
      'client_account_id', c.client_account_id, 'organization_id', c.organization_id,
      'archived_at', c.archived_at,
      'last_activity_at', c.last_activity_at, 'created_at', c.created_at, 'completed_at', c.completed_at,
      'offer_count', (select count(*) from public.owner_offers o where o.owner_customer_id = c.id),
      'invoice_count', (select count(*) from public.owner_invoices i where i.owner_customer_id = c.id),
      'open_invoice_count', (select count(*) from public.owner_invoices i
                              where i.owner_customer_id = c.id and i.status in ('issued','partially_paid','overdue')),
      'revenue_gross_cents', (select coalesce(sum(i.gross_total_cents), 0) from public.owner_invoices i
                               where i.owner_customer_id = c.id and i.status not in ('draft','void','cancelled')),
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
        v_invoices jsonb; v_payments jsonb; v_blockers jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select to_jsonb(c) into v_customer from public.owner_customers c where c.id = p_customer_id;
  if v_customer is null then raise exception 'customer not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id, 'offer_number', o.offer_number, 'title', o.title, 'status', o.status,
      'currency', o.currency, 'gross_total_cents', o.gross_total_cents,
      'created_at', o.created_at, 'valid_until', o.valid_until, 'accepted_at', o.accepted_at,
      'archived_at', o.archived_at, 'finalized_version', o.finalized_version,
      'sent_at', (select max(j.sent_at) from public.owner_automation_jobs j where j.offer_id = o.id and j.job_type = 'offer_email')
    ) order by o.created_at desc), '[]'::jsonb) into v_offers
  from public.owner_offers o where o.owner_customer_id = p_customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'invoice_number', i.invoice_number, 'status', i.status,
      'currency', i.currency, 'gross_total_cents', i.gross_total_cents,
      'amount_paid_cents', i.amount_paid_cents,
      'issue_date', i.issue_date, 'due_date', i.due_date, 'issued_at', i.issued_at,
      'cancelled_at', i.cancelled_at, 'cancellation_reason', i.cancellation_reason,
      'created_at', i.created_at
    ) order by i.created_at desc), '[]'::jsonb) into v_invoices
  from public.owner_invoices i where i.owner_customer_id = p_customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'amount_cents', p.amount_cents, 'direction', p.direction,
      'payment_date', p.payment_date, 'invoice_id', p.invoice_id
    ) order by p.payment_date desc nulls last), '[]'::jsonb) into v_payments
  from public.owner_payments p where p.owner_customer_id = p_customer_id;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.sort_order, t.created_at), '[]'::jsonb) into v_tasks
  from public.owner_customer_tasks t where t.customer_id = p_customer_id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'event_type', a.event_type, 'summary', a.summary, 'created_at', a.created_at,
      'related_offer_id', a.related_offer_id, 'related_task_id', a.related_task_id
    ) order by a.created_at desc), '[]'::jsonb) into v_activity
  from (select * from public.owner_customer_activity where customer_id = p_customer_id order by created_at desc limit 100) a;

  v_blockers := public.owner_customer_delete_blockers(p_customer_id);

  return jsonb_build_object(
    'customer', v_customer, 'offers', v_offers, 'invoices', v_invoices,
    'payments', v_payments, 'tasks', v_tasks, 'activity', v_activity,
    'delete_blockers', v_blockers);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 10. Grants. Owner-gated in the body AND revoked from anon/public here; a
--     non-owner authenticated session reaches the function and is refused inside.
-- ---------------------------------------------------------------------------
begin;
do $$
declare sig text;
begin
  foreach sig in array array[
    'owner_customer_delete_blockers(uuid)',
    'owner_delete_customer(uuid)',
    'owner_archive_customer(uuid)',
    'owner_unarchive_customer(uuid)',
    'owner_cancel_invoice(uuid, text)',
    'owner_link_invoice_customer(uuid, uuid)',
    'owner_list_customers(uuid)',
    'owner_customer_detail(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', sig);
    execute format('grant execute on function public.%s to authenticated, service_role', sig);
  end loop;
end;
$$;
commit;
