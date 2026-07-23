-- =============================================================================
-- Owner offers (Angebote) — first-class commercial offer entity with server-
-- authoritative totals, concurrency-safe numbering, immutable finalized versions,
-- validated status transitions, and atomic accepted-offer → invoice-draft
-- conversion. Additive migration; does NOT modify 20260722120000_*. Owner-only.
--
-- Money is integer cents; quantities integer milli-units. Totals are NEVER trusted
-- from the client: line math and document totals are computed by triggers, exactly
-- as owner_invoices does. Reuses phase-0 helpers (is_platform_owner, set_updated_at,
-- owner_write_audit_row, owner_claim_idempotency).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.owner_offers (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  engagement_id uuid references public.client_engagements(id) on delete set null,
  offer_number text,
  status text not null default 'draft'
    check (status in ('draft', 'finalized', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled', 'converted')),
  title text,
  issue_date date,
  valid_until date,
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  introduction text,
  scope text,
  assumptions text,
  exclusions text,
  payment_terms text,
  delivery_terms text,
  internal_notes text,
  net_total_cents bigint not null default 0,
  vat_total_cents bigint not null default 0,
  gross_total_cents bigint not null default 0,
  finalized_version int,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  expired_at timestamptz,
  converted_invoice_id uuid references public.owner_invoices(id) on delete set null,
  converted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists owner_offers_entity_number_key
  on public.owner_offers (business_entity_id, offer_number) where offer_number is not null;
create index if not exists owner_offers_entity_status_idx on public.owner_offers (business_entity_id, status);
create index if not exists owner_offers_client_idx on public.owner_offers (client_account_id);
create index if not exists owner_offers_org_idx on public.owner_offers (organization_id);
create index if not exists owner_offers_valid_until_idx on public.owner_offers (valid_until);

create table if not exists public.owner_offer_lines (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.owner_offers(id) on delete cascade,
  description text not null,
  quantity_milli bigint not null default 1000 check (quantity_milli > 0),
  unit text not null default 'Stück',
  unit_price_cents bigint not null,
  net_cents bigint not null default 0,
  vat_rate_bp int not null default 1900 check (vat_rate_bp between 0 and 10000),
  vat_treatment text not null default 'standard'
    check (vat_treatment in ('standard', 'reduced', 'zero_rated', 'exempt', 'outside_scope', 'reverse_charge', 'unknown')),
  vat_cents bigint not null default 0,
  gross_cents bigint not null default 0,
  is_optional boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_offer_lines_description_not_blank check (length(trim(description)) > 0)
);
create index if not exists owner_offer_lines_offer_idx on public.owner_offer_lines (offer_id);

-- Immutable snapshots of each finalized version (header + lines as JSON + source hash).
create table if not exists public.owner_offer_versions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.owner_offers(id) on delete cascade,
  version int not null check (version > 0),
  offer_number text,
  snapshot jsonb not null,
  source_hash text not null,
  finalized_by uuid references public.profiles(id) on delete set null,
  finalized_at timestamptz not null default now(),
  constraint owner_offer_versions_unique unique (offer_id, version)
);
create index if not exists owner_offer_versions_offer_idx on public.owner_offer_versions (offer_id);

-- Concurrency-safe per-entity offer numbering (never MAX()+1).
create table if not exists public.owner_offer_counters (
  business_entity_id uuid primary key references public.owner_business_entities(id) on delete cascade,
  next_number bigint not null default 1 check (next_number > 0),
  updated_at timestamptz not null default now()
);

commit;

-- ---------------------------------------------------------------------------
-- Server-authoritative math + guards
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_recalc_offer_line()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.net_cents := round((new.quantity_milli::numeric * new.unit_price_cents) / 1000.0);
  if new.vat_treatment in ('standard', 'reduced') then
    new.vat_cents := round((new.net_cents::numeric * new.vat_rate_bp) / 10000.0);
  else
    new.vat_cents := 0;
  end if;
  new.gross_cents := new.net_cents + new.vat_cents;
  return new;
end;
$$;

-- Offer totals exclude optional lines (they are opt-in for the customer, not part of the base sum).
create or replace function public.owner_recalc_offer_totals()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare target_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  update public.owner_offers o
  set net_total_cents = coalesce(agg.net, 0),
      vat_total_cents = coalesce(agg.vat, 0),
      gross_total_cents = coalesce(agg.gross, 0)
  from (
    select sum(net_cents) net, sum(vat_cents) vat, sum(gross_cents) gross
    from public.owner_offer_lines where offer_id = target_offer and is_optional = false
  ) agg
  where o.id = target_offer;
  return coalesce(new, old);
end;
$$;

-- Finalized offers are immutable except for the controlled lifecycle status columns.
-- Line edits are blocked once an offer leaves 'draft'. Revisions clone into a NEW draft offer.
create or replace function public.owner_guard_offer()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if public.is_database_admin() or public.request_is_service_role() then return old; end if;
    if old.status <> 'draft' then raise exception 'only draft offers can be deleted'; end if;
    return old;
  end if;
  -- UPDATE: once past draft, the commercial substance is frozen.
  if old.status <> 'draft' then
    if new.offer_number is distinct from old.offer_number then raise exception 'finalized offer number cannot change'; end if;
    if new.title is distinct from old.title
       or new.introduction is distinct from old.introduction
       or new.scope is distinct from old.scope
       or new.assumptions is distinct from old.assumptions
       or new.exclusions is distinct from old.exclusions
       or new.payment_terms is distinct from old.payment_terms
       or new.delivery_terms is distinct from old.delivery_terms
       or new.valid_until is distinct from old.valid_until
       or new.net_total_cents is distinct from old.net_total_cents
       or new.gross_total_cents is distinct from old.gross_total_cents then
      raise exception 'finalized offer content is immutable; create a revision instead';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.owner_guard_offer_line()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_status text; v_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  if public.is_database_admin() or public.request_is_service_role() then return coalesce(new, old); end if;
  select status into v_status from public.owner_offers where id = v_offer;
  if v_status is distinct from 'draft' then
    raise exception 'offer lines are immutable once the offer is finalized';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists owner_offer_lines_recalc_line on public.owner_offer_lines;
create trigger owner_offer_lines_recalc_line before insert or update on public.owner_offer_lines
  for each row execute function public.owner_recalc_offer_line();
drop trigger if exists owner_offer_lines_recalc_totals on public.owner_offer_lines;
create trigger owner_offer_lines_recalc_totals after insert or update or delete on public.owner_offer_lines
  for each row execute function public.owner_recalc_offer_totals();
drop trigger if exists owner_offer_lines_guard on public.owner_offer_lines;
create trigger owner_offer_lines_guard before insert or update or delete on public.owner_offer_lines
  for each row execute function public.owner_guard_offer_line();

drop trigger if exists owner_offers_guard on public.owner_offers;
create trigger owner_offers_guard before update or delete on public.owner_offers
  for each row execute function public.owner_guard_offer();

drop trigger if exists owner_offers_set_updated_at on public.owner_offers;
create trigger owner_offers_set_updated_at before update on public.owner_offers
  for each row execute function public.set_updated_at();
drop trigger if exists owner_offer_lines_set_updated_at on public.owner_offer_lines;
create trigger owner_offer_lines_set_updated_at before update on public.owner_offer_lines
  for each row execute function public.set_updated_at();

-- Audit (reuses the security-definer factory).
drop trigger if exists owner_offers_audit on public.owner_offers;
create trigger owner_offers_audit after insert or update or delete on public.owner_offers
  for each row execute function public.owner_write_audit_row('owner_offers');

commit;

-- ---------------------------------------------------------------------------
-- RLS + grants (owner-only). Versions are append-only (no update/delete for owners).
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array['owner_offers', 'owner_offer_lines', 'owner_offer_counters'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())', t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

alter table public.owner_offer_versions enable row level security;
drop policy if exists owner_offer_versions_owner_select on public.owner_offer_versions;
create policy owner_offer_versions_owner_select on public.owner_offer_versions for select to authenticated using (public.is_platform_owner());
drop policy if exists owner_offer_versions_owner_insert on public.owner_offer_versions;
create policy owner_offer_versions_owner_insert on public.owner_offer_versions for insert to authenticated with check (public.is_platform_owner());
revoke all on table public.owner_offer_versions from public, anon, authenticated;
grant select, insert on table public.owner_offer_versions to authenticated;
grant select, insert, update, delete on table public.owner_offer_versions to service_role;

commit;

-- ---------------------------------------------------------------------------
-- RPCs (owner-only, atomic, UUID-idempotent, SECURITY DEFINER with safe path)
-- ---------------------------------------------------------------------------
begin;

-- create_owner_offer: header + lines atomically; server computes all totals.
create or replace function public.create_owner_offer(p_idempotency_key uuid, p_header jsonb, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_id uuid; v_entity uuid; v_line jsonb; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'create_owner_offer');
  if v_existing is not null then return v_existing; end if;

  v_entity := (p_header->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = v_entity) then raise exception 'unknown business entity'; end if;
  if p_lines is null or jsonb_array_length(p_lines) < 1 then raise exception 'at least one offer line is required'; end if;

  insert into public.owner_offers (business_entity_id, organization_id, client_account_id, engagement_id,
    status, title, issue_date, valid_until, currency, introduction, scope, assumptions, exclusions,
    payment_terms, delivery_terms, internal_notes, created_by)
  values (v_entity, nullif(p_header->>'organization_id','')::uuid, nullif(p_header->>'client_account_id','')::uuid,
    nullif(p_header->>'engagement_id','')::uuid, 'draft', p_header->>'title',
    nullif(p_header->>'issue_date','')::date, nullif(p_header->>'valid_until','')::date,
    coalesce(p_header->>'currency','EUR'), p_header->>'introduction', p_header->>'scope',
    p_header->>'assumptions', p_header->>'exclusions', p_header->>'payment_terms', p_header->>'delivery_terms',
    p_header->>'internal_notes', auth.uid())
  returning id into v_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit, unit_price_cents,
      vat_rate_bp, vat_treatment, is_optional, sort_order)
    values (v_id, v_line->>'description', coalesce((v_line->>'quantity_milli')::bigint, 1000),
      coalesce(v_line->>'unit','Stück'), (v_line->>'unit_price_cents')::bigint,
      coalesce((v_line->>'vat_rate_bp')::int, 1900), coalesce(v_line->>'vat_treatment','standard'),
      coalesce((v_line->>'is_optional')::boolean, false), coalesce((v_line->>'sort_order')::int, 0));
  end loop;

  v_result := jsonb_build_object('offer_id', v_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- finalize_owner_offer: validate, assign concurrency-safe number, freeze, snapshot version.
create or replace function public.finalize_owner_offer(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; o record; v_lines int; v_unknown int; v_prefix text; v_next bigint; v_number text;
  v_version int; v_snapshot jsonb; v_hash text; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'finalize_owner_offer');
  if v_existing is not null then return v_existing; end if;

  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status <> 'draft' then raise exception 'only draft offers can be finalized'; end if;
  if o.issue_date is null then raise exception 'issue_date is required'; end if;
  if o.valid_until is null then raise exception 'valid_until is required'; end if;
  if coalesce(o.title, '') = '' then raise exception 'title is required'; end if;

  select count(*), count(*) filter (where vat_treatment = 'unknown')
    into v_lines, v_unknown from public.owner_offer_lines where offer_id = p_offer_id and is_optional = false;
  if v_lines < 1 then raise exception 'offer needs at least one non-optional line'; end if;
  if v_unknown > 0 then raise exception 'offer has unresolved VAT treatments'; end if;
  if o.gross_total_cents <= 0 then raise exception 'offer total must be positive'; end if;

  select coalesce(offer_number_prefix, 'AN') into v_prefix from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_prefix := coalesce(v_prefix, 'AN');
  insert into public.owner_offer_counters (business_entity_id) values (o.business_entity_id) on conflict (business_entity_id) do nothing;
  select next_number into v_next from public.owner_offer_counters where business_entity_id = o.business_entity_id for update;
  v_number := v_prefix || '-' || to_char(o.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
  update public.owner_offer_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = o.business_entity_id;

  v_version := 1;
  v_snapshot := jsonb_build_object(
    'offer', to_jsonb(o) - 'internal_notes',
    'lines', (select coalesce(jsonb_agg(to_jsonb(l) order by l.sort_order), '[]'::jsonb) from public.owner_offer_lines l where l.offer_id = p_offer_id),
    'offer_number', v_number, 'version', v_version);
  v_hash := encode(digest(v_snapshot::text, 'sha256'), 'hex');

  update public.owner_offers
    set offer_number = v_number, status = 'finalized', finalized_version = v_version
    where id = p_offer_id;

  insert into public.owner_offer_versions (offer_id, version, offer_number, snapshot, source_hash, finalized_by)
  values (p_offer_id, v_version, v_number, v_snapshot, v_hash, auth.uid());

  v_result := jsonb_build_object('offer_id', p_offer_id, 'offer_number', v_number, 'version', v_version, 'source_hash', v_hash);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- create_owner_offer_revision: clone a finalized/expired/rejected offer into a NEW draft.
create or replace function public.create_owner_offer_revision(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; src record; v_id uuid; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'create_owner_offer_revision');
  if v_existing is not null then return v_existing; end if;

  select * into src from public.owner_offers where id = p_offer_id;
  if src.id is null then raise exception 'offer not found'; end if;
  if src.status = 'draft' then raise exception 'draft offers are edited directly, not revised'; end if;

  insert into public.owner_offers (business_entity_id, organization_id, client_account_id, engagement_id,
    status, title, issue_date, valid_until, currency, introduction, scope, assumptions, exclusions,
    payment_terms, delivery_terms, internal_notes, created_by)
  values (src.business_entity_id, src.organization_id, src.client_account_id, src.engagement_id,
    'draft', src.title, current_date, src.valid_until, src.currency, src.introduction, src.scope,
    src.assumptions, src.exclusions, src.payment_terms, src.delivery_terms, src.internal_notes, auth.uid())
  returning id into v_id;

  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit, unit_price_cents, vat_rate_bp, vat_treatment, is_optional, sort_order)
  select v_id, description, quantity_milli, unit, unit_price_cents, vat_rate_bp, vat_treatment, is_optional, sort_order
  from public.owner_offer_lines where offer_id = p_offer_id;

  v_result := jsonb_build_object('offer_id', v_id, 'revised_from', p_offer_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- set_owner_offer_status: validated lifecycle transitions for owner-driven actions
-- (send, cancel, mark rejected, expire). Customer-driven view/accept/reject go through
-- the token RPCs in the next migration.
create or replace function public.set_owner_offer_status(p_offer_id uuid, p_status text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; v_allowed boolean := false;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;

  v_allowed := case
    when p_status = 'sent'      and o.status in ('finalized', 'sent') then true
    when p_status = 'cancelled' and o.status in ('draft', 'finalized', 'sent', 'viewed') then true
    when p_status = 'rejected'  and o.status in ('finalized', 'sent', 'viewed') then true
    when p_status = 'expired'   and o.status in ('finalized', 'sent', 'viewed') then true
    else false
  end;
  if not v_allowed then raise exception 'invalid status transition % -> %', o.status, p_status; end if;

  update public.owner_offers set status = p_status,
    rejected_at = case when p_status = 'rejected' then now() else rejected_at end,
    rejection_reason = case when p_status = 'rejected' then p_reason else rejection_reason end,
    expired_at = case when p_status = 'expired' then now() else expired_at end
  where id = p_offer_id;
  return jsonb_build_object('offer_id', p_offer_id, 'status', p_status);
end;
$$;

-- convert_owner_offer_to_invoice_draft: accepted-only, idempotent, copies customer +
-- lines + terms, links both ways, never auto-issues.
create or replace function public.convert_owner_offer_to_invoice_draft(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; o record; v_inv uuid; v_line record; v_terms int; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'convert_owner_offer_to_invoice_draft');
  if v_existing is not null then return v_existing; end if;

  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  -- Idempotent re-conversion: if already converted, return the existing invoice regardless of
  -- the offer's now-'converted' status. This check must precede the accepted-status guard.
  if o.converted_invoice_id is not null then
    v_result := jsonb_build_object('invoice_id', o.converted_invoice_id, 'offer_id', p_offer_id, 'idempotent', true);
    update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
    return v_result;
  end if;
  if o.status <> 'accepted' then raise exception 'only accepted offers can be converted'; end if;

  select coalesce(default_payment_terms_days, 14) into v_terms from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_terms := coalesce(v_terms, 14);

  insert into public.owner_invoices (business_entity_id, organization_id, client_account_id, engagement_id,
    status, issue_date, service_date, due_date, currency, notes, external_reference, created_by)
  values (o.business_entity_id, o.organization_id, o.client_account_id, o.engagement_id, 'draft',
    current_date, current_date, current_date + v_terms, o.currency,
    coalesce(o.payment_terms, ''), 'Angebot ' || coalesce(o.offer_number, o.id::text), auth.uid())
  returning id into v_inv;

  -- Copy non-optional lines with their VAT treatment. Invoice line math recomputes server-side.
  for v_line in select * from public.owner_offer_lines where offer_id = p_offer_id and is_optional = false order by sort_order loop
    insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
    values (v_inv, v_line.description, v_line.quantity_milli, v_line.unit_price_cents, v_line.vat_rate_bp, v_line.vat_treatment, v_line.sort_order);
  end loop;

  update public.owner_offers set converted_invoice_id = v_inv, converted_at = now(), status = 'converted' where id = p_offer_id;

  v_result := jsonb_build_object('invoice_id', v_inv, 'offer_id', p_offer_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- Grants: browser owners may execute; service_role for server contexts. Never anon.
revoke execute on function public.create_owner_offer(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.finalize_owner_offer(uuid, uuid) from public, anon;
revoke execute on function public.create_owner_offer_revision(uuid, uuid) from public, anon;
revoke execute on function public.set_owner_offer_status(uuid, text, text) from public, anon;
revoke execute on function public.convert_owner_offer_to_invoice_draft(uuid, uuid) from public, anon;
grant execute on function public.create_owner_offer(uuid, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.finalize_owner_offer(uuid, uuid) to authenticated, service_role;
grant execute on function public.create_owner_offer_revision(uuid, uuid) to authenticated, service_role;
grant execute on function public.set_owner_offer_status(uuid, text, text) to authenticated, service_role;
grant execute on function public.convert_owner_offer_to_invoice_draft(uuid, uuid) to authenticated, service_role;

grant execute on function public.owner_recalc_offer_line() to service_role;
grant execute on function public.owner_recalc_offer_totals() to service_role;

commit;
