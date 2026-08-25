-- Recurring pricing as a first-class concept on offer positions.
--
-- Problem this fixes: a monthly service could only be expressed by abusing quantity/unit
-- ("12 x Monat x 290 EUR"), which folded the whole minimum-term commitment into the single
-- headline total (7.380 EUR instead of "3.900 EUR einmalig + 290 EUR / Monat").
--
-- Model:
--   * A line is either 'one_time' or 'recurring' (pricing_type).
--   * For a recurring line, net_cents stays quantity x unit price and therefore means
--     "amount per billing interval" (5 Lizenzen x 20 EUR = 100 EUR / Monat). The minimum
--     term is contract metadata, NEVER quantity.
--   * owner_offers.net_total_cents / vat_total_cents / gross_total_cents keep their meaning
--     for one-time positions only. Because every pre-existing line is 'one_time' by default,
--     historical rows keep exactly the values they have today.
--   * Recurring commitments are summed into new, separate columns per interval.
--
-- Additive and backward-compatible: no data is rewritten, no historical offer is
-- reinterpreted, and finalized snapshots (owner_offer_versions.snapshot) are untouched.
--
-- Only 'monthly' is accepted today. Adding 'yearly' later is a check-constraint change plus
-- one more totals column group; the application-side calculation is already interval-generic.

begin;

alter table public.owner_offer_lines
  add column if not exists pricing_type text not null default 'one_time',
  add column if not exists billing_interval text,
  add column if not exists minimum_term_months int,
  add column if not exists billing_start_type text,
  add column if not exists billing_start_label text;

do $guard$ begin
  if not exists (select 1 from pg_constraint where conname = 'owner_offer_lines_pricing_type_valid') then
    alter table public.owner_offer_lines add constraint owner_offer_lines_pricing_type_valid
      check (pricing_type in ('one_time', 'recurring'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'owner_offer_lines_billing_interval_valid') then
    alter table public.owner_offer_lines add constraint owner_offer_lines_billing_interval_valid
      check (billing_interval is null or billing_interval in ('monthly'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'owner_offer_lines_minimum_term_valid') then
    alter table public.owner_offer_lines add constraint owner_offer_lines_minimum_term_valid
      check (minimum_term_months is null or minimum_term_months > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'owner_offer_lines_billing_start_valid') then
    alter table public.owner_offer_lines add constraint owner_offer_lines_billing_start_valid
      check (billing_start_type is null or billing_start_type in
        ('commissioning', 'order', 'go_live', 'handover', 'custom'));
  end if;
  -- A recurring line must name its interval; a one-time line must not carry recurring metadata.
  if not exists (select 1 from pg_constraint where conname = 'owner_offer_lines_recurring_shape') then
    alter table public.owner_offer_lines add constraint owner_offer_lines_recurring_shape
      check (
        (pricing_type = 'recurring' and billing_interval is not null)
        or (pricing_type = 'one_time' and billing_interval is null
            and minimum_term_months is null and billing_start_type is null
            and billing_start_label is null)
      );
  end if;
end $guard$;

-- Recurring commitment per billing interval, excluding optional lines (same rule as the
-- one-time totals). Monthly is the only interval accepted today.
alter table public.owner_offers
  add column if not exists recurring_monthly_net_cents bigint not null default 0,
  add column if not exists recurring_monthly_vat_cents bigint not null default 0,
  add column if not exists recurring_monthly_gross_cents bigint not null default 0;

commit;

begin;

-- Totals split by pricing type. One-time positions keep the historical columns; recurring
-- positions accumulate per interval. Optional lines are excluded from both, unchanged.
create or replace function public.owner_recalc_offer_totals()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
declare target_offer uuid := coalesce(new.offer_id, old.offer_id);
begin
  update public.owner_offers o
  set net_total_cents = coalesce(agg.one_net, 0),
      vat_total_cents = coalesce(agg.one_vat, 0),
      gross_total_cents = coalesce(agg.one_gross, 0),
      recurring_monthly_net_cents = coalesce(agg.mon_net, 0),
      recurring_monthly_vat_cents = coalesce(agg.mon_vat, 0),
      recurring_monthly_gross_cents = coalesce(agg.mon_gross, 0)
  from (
    select
      sum(net_cents)   filter (where pricing_type = 'one_time')  one_net,
      sum(vat_cents)   filter (where pricing_type = 'one_time')  one_vat,
      sum(gross_cents) filter (where pricing_type = 'one_time')  one_gross,
      sum(net_cents)   filter (where pricing_type = 'recurring' and billing_interval = 'monthly') mon_net,
      sum(vat_cents)   filter (where pricing_type = 'recurring' and billing_interval = 'monthly') mon_vat,
      sum(gross_cents) filter (where pricing_type = 'recurring' and billing_interval = 'monthly') mon_gross
    from public.owner_offer_lines where offer_id = target_offer and is_optional = false
  ) agg
  where o.id = target_offer;
  return coalesce(new, old);
end;
$fn$;

grant execute on function public.owner_recalc_offer_totals() to service_role;

-- The recurring commitment is part of the frozen commercial substance of a finalized offer.
create or replace function public.owner_guard_offer()
returns trigger language plpgsql set search_path = public, pg_temp as $fn$
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
       or new.subtitle is distinct from old.subtitle
       or new.introduction is distinct from old.introduction
       or new.executive_summary is distinct from old.executive_summary
       or new.project_approach is distinct from old.project_approach
       or new.next_steps is distinct from old.next_steps
       or new.scope is distinct from old.scope
       or new.assumptions is distinct from old.assumptions
       or new.exclusions is distinct from old.exclusions
       or new.payment_terms is distinct from old.payment_terms
       or new.delivery_terms is distinct from old.delivery_terms
       or new.desired_outcomes is distinct from old.desired_outcomes
       or new.timeline is distinct from old.timeline
       or new.payment_schedule is distinct from old.payment_schedule
       or new.template_key is distinct from old.template_key
       or new.recipient_company is distinct from old.recipient_company
       or new.recipient_contact_name is distinct from old.recipient_contact_name
       or new.recipient_department is distinct from old.recipient_department
       or new.recipient_street is distinct from old.recipient_street
       or new.recipient_postal_code is distinct from old.recipient_postal_code
       or new.recipient_city is distinct from old.recipient_city
       or new.recipient_country_code is distinct from old.recipient_country_code
       or new.recipient_email is distinct from old.recipient_email
       or new.recipient_phone is distinct from old.recipient_phone
       or new.recipient_vat_id is distinct from old.recipient_vat_id
       or new.valid_until is distinct from old.valid_until
       or new.net_total_cents is distinct from old.net_total_cents
       or new.gross_total_cents is distinct from old.gross_total_cents
       or new.recurring_monthly_net_cents is distinct from old.recurring_monthly_net_cents
       or new.recurring_monthly_gross_cents is distinct from old.recurring_monthly_gross_cents then
      raise exception 'finalized offer content is immutable; create a revision instead';
    end if;
  end if;
  return new;
end;
$fn$;

commit;

begin;

-- Persist the recurring fields when a draft's lines are replaced. Recurring metadata is only
-- accepted on recurring lines, so a one-time line can never carry a stray minimum term.
create or replace function public.owner_replace_offer_lines(p_offer_id uuid, p_lines jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $fn$
declare v_line jsonb; v_idx int := 0; v_type text; v_recurring boolean;
begin
  delete from public.owner_offer_lines where offer_id = p_offer_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    v_type := coalesce(nullif(v_line->>'pricing_type', ''), 'one_time');
    v_recurring := v_type = 'recurring';
    insert into public.owner_offer_lines (offer_id, description, details, deliverables, phase_label, duration_label,
      quantity_milli, unit, unit_price_cents, vat_rate_bp, vat_treatment, is_optional, sort_order,
      pricing_type, billing_interval, minimum_term_months, billing_start_type, billing_start_label)
    values (p_offer_id, v_line->>'description', v_line->>'details',
      coalesce(v_line->'deliverables', '[]'::jsonb), v_line->>'phase_label', v_line->>'duration_label',
      coalesce((v_line->>'quantity_milli')::bigint, 1000), coalesce(v_line->>'unit', 'Stück'),
      (v_line->>'unit_price_cents')::bigint, coalesce((v_line->>'vat_rate_bp')::int, 1900),
      coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'is_optional')::boolean, false),
      coalesce((v_line->>'sort_order')::int, v_idx),
      v_type,
      case when v_recurring then coalesce(nullif(v_line->>'billing_interval', ''), 'monthly') end,
      case when v_recurring then nullif(v_line->>'minimum_term_months', '')::int end,
      case when v_recurring then nullif(v_line->>'billing_start_type', '') end,
      case when v_recurring then nullif(v_line->>'billing_start_label', '') end);
    v_idx := v_idx + 1;
  end loop;
end;
$fn$;

commit;

begin;

-- Finalization: a recurring-only offer is a legitimate commercial document, so the positivity
-- check now accepts a commitment that is purely recurring. The line snapshot needs no change
-- (it uses to_jsonb over the row, so the new columns flow in automatically); the totals object
-- gains the recurring block for the customer-portal projection.
create or replace function public.finalize_owner_offer(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare
  o record; v_existing jsonb; v_lines int; v_unknown int; v_prefix text; v_next bigint; v_number text;
  v_version int; v_snapshot jsonb; v_hash text; v_result jsonb; v_pay jsonb; v_pct_sum bigint; v_pct_count int;
  v_template_key text; v_template_version text := 'cogniiq-premium-offer-v2';
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
  -- Seller postal identity must be resolved (evidence-grade snapshot).
  if not exists (select 1 from public.owner_document_settings s where s.business_entity_id = o.business_entity_id
      and coalesce(s.legal_name,'') <> '' and coalesce(s.street,'') <> '' and coalesce(s.city,'') <> '') then
    raise exception 'seller legal name and postal address are required (Dokument-Einstellungen)';
  end if;
  -- Recipient company + postal address must be resolved on the offer snapshot.
  if coalesce(o.recipient_company,'') = '' then raise exception 'recipient company is required'; end if;
  if coalesce(o.recipient_street,'') = '' or coalesce(o.recipient_city,'') = '' then
    raise exception 'recipient postal address is required'; end if;

  select count(*), count(*) filter (where vat_treatment = 'unknown')
    into v_lines, v_unknown from public.owner_offer_lines where offer_id = p_offer_id and is_optional = false;
  if v_lines < 1 then raise exception 'offer needs at least one non-optional line'; end if;
  if v_unknown > 0 then raise exception 'offer has unresolved VAT treatments'; end if;
  if o.gross_total_cents + o.recurring_monthly_gross_cents <= 0 then raise exception 'offer total must be positive'; end if;

  -- If a payment schedule uses percentages on every row, they must sum to 100 %.
  v_pay := o.payment_schedule;
  if jsonb_typeof(v_pay) = 'array' and jsonb_array_length(v_pay) > 0 then
    select count(*) filter (where e ? 'percentage_bp'), coalesce(sum((e->>'percentage_bp')::bigint),0)
      into v_pct_count, v_pct_sum from jsonb_array_elements(v_pay) e;
    if v_pct_count = jsonb_array_length(v_pay) and v_pct_sum <> 10000 then
      raise exception 'payment schedule percentages must sum to 100%% (got %.2f%%)', v_pct_sum / 100.0;
    end if;
  end if;

  select coalesce(offer_number_prefix, 'AN') into v_prefix from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_prefix := coalesce(v_prefix, 'AN');
  insert into public.owner_offer_counters (business_entity_id) values (o.business_entity_id) on conflict (business_entity_id) do nothing;
  select next_number into v_next from public.owner_offer_counters where business_entity_id = o.business_entity_id for update;
  v_number := v_prefix || '-' || to_char(o.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
  update public.owner_offer_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = o.business_entity_id;

  v_version := 1;
  v_template_key := coalesce(o.template_key, 'cogniiq-premium-offer-v2');

  -- Canonical, complete snapshot. `o` is the pre-finalize row (draft), so it already
  -- carries the structured content + recipient snapshot. Seller/settings are curated.
  v_snapshot := jsonb_build_object(
    'offer', (to_jsonb(o) - 'internal_notes') || jsonb_build_object('offer_number', v_number, 'status', 'finalized', 'finalized_version', v_version),
    'lines', (select coalesce(jsonb_agg(to_jsonb(l) order by l.sort_order), '[]'::jsonb) from public.owner_offer_lines l where l.offer_id = p_offer_id),
    'seller', public.owner_seller_snapshot(o.business_entity_id),
    'recipient', jsonb_build_object(
      'company', o.recipient_company, 'contact_name', o.recipient_contact_name, 'department', o.recipient_department,
      'street', o.recipient_street, 'postal_code', o.recipient_postal_code, 'city', o.recipient_city,
      'country_code', coalesce(o.recipient_country_code,'DE'), 'email', o.recipient_email, 'phone', o.recipient_phone,
      'vat_id', o.recipient_vat_id),
    'document_settings', public.owner_settings_snapshot(o.business_entity_id),
    'totals', jsonb_build_object(
      'net_cents', o.net_total_cents, 'vat_cents', o.vat_total_cents, 'gross_cents', o.gross_total_cents,
      'recurring_monthly_net_cents', o.recurring_monthly_net_cents,
      'recurring_monthly_vat_cents', o.recurring_monthly_vat_cents,
      'recurring_monthly_gross_cents', o.recurring_monthly_gross_cents),
    'template_key', v_template_key,
    'template_version', v_template_version,
    'offer_number', v_number,
    'version', v_version);
  -- Deterministic SHA-256 over the canonical snapshot text (UTF-8 bytes), pgcrypto
  -- explicitly schema-qualified so it resolves under Supabase's extensions schema.
  v_hash := encode(extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'::text), 'hex');

  update public.owner_offers
    set offer_number = v_number, status = 'finalized', finalized_version = v_version
    where id = p_offer_id;

  insert into public.owner_offer_versions (offer_id, version, offer_number, snapshot, source_hash, finalized_by, template_key, template_version)
  values (p_offer_id, v_version, v_number, v_snapshot, v_hash, auth.uid(), v_template_key, v_template_version);

  v_result := jsonb_build_object('offer_id', p_offer_id, 'offer_number', v_number, 'version', v_version, 'source_hash', v_hash);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$fn$;

revoke execute on function public.finalize_owner_offer(uuid, uuid) from public, anon;
grant execute on function public.finalize_owner_offer(uuid, uuid) to authenticated, service_role;

commit;

begin;

-- Which offer, and which part of it, produced this invoice. Three columns, no schedule table:
-- this is the entire installment-billing safeguard, and it is a provenance record rather than a
-- billing engine. It exists because warnings alone allowed real over-invoicing — with Rate 1
-- (1.950 EUR) already billed, nothing stopped a second Rate 1, or a full 3.900 EUR conversion on
-- top, producing 5.850 EUR of invoices against a 3.900 EUR contract.
--
-- `source_offer_conversion_kind` names what was invoiced explicitly rather than encoding "full"
-- as a magic milestone index:
--   null        -> the invoice did not come from an offer conversion (hand-written, or created
--                  before this migration — every existing production row).
--   'full'      -> the whole one-time amount, in one conversion.
--   'milestone' -> one payment-plan rate; source_offer_milestone_index says which.
alter table public.owner_invoices
  add column if not exists source_offer_id uuid references public.owner_offers(id) on delete set null,
  add column if not exists source_offer_conversion_kind text,
  add column if not exists source_offer_milestone_index int;

create index if not exists owner_invoices_source_offer_idx on public.owner_invoices (source_offer_id);

do $guard$ begin
  if not exists (select 1 from pg_constraint where conname = 'owner_invoices_source_offer_kind_valid') then
    alter table public.owner_invoices add constraint owner_invoices_source_offer_kind_valid
      check (source_offer_conversion_kind is null or source_offer_conversion_kind in ('full', 'milestone'));
  end if;
  -- A conversion kind is only meaningful with the offer it came from.
  if not exists (select 1 from pg_constraint where conname = 'owner_invoices_source_offer_kind_needs_offer') then
    alter table public.owner_invoices add constraint owner_invoices_source_offer_kind_needs_offer
      check (source_offer_conversion_kind is null or source_offer_id is not null);
  end if;
  -- Only a milestone conversion carries an index, and it is always a real array position.
  if not exists (select 1 from pg_constraint where conname = 'owner_invoices_source_offer_milestone_shape') then
    alter table public.owner_invoices add constraint owner_invoices_source_offer_milestone_shape
      check (
        (source_offer_conversion_kind = 'milestone' and source_offer_milestone_index >= 0)
        or (source_offer_conversion_kind is distinct from 'milestone' and source_offer_milestone_index is null)
      );
  end if;
end $guard$;

-- The actual enforcement, at the only level that survives two browser tabs, a retried request or
-- a direct SQL call: one invoice per (offer, milestone), and at most one full conversion per
-- offer. The RPC below checks the same rules first so the owner gets a readable German error
-- instead of a constraint violation, but these indexes are what make the rule true.
--
-- DELIBERATE: neither index filters on invoice status. A cancelled or voided invoice keeps
-- occupying its milestone slot. Re-invoicing a cancelled rate is a real workflow (credit note,
-- then reissue) that needs its own design; leaving the slot blocked can only ever refuse a
-- legitimate action — which the owner can still satisfy with a manual invoice — whereas freeing
-- it on cancellation would silently re-open the exact double-invoicing hole this closes.
create unique index if not exists owner_invoices_offer_milestone_once
  on public.owner_invoices (source_offer_id, source_offer_milestone_index)
  where source_offer_conversion_kind = 'milestone';

create unique index if not exists owner_invoices_offer_full_once
  on public.owner_invoices (source_offer_id)
  where source_offer_conversion_kind = 'full';

commit;

begin;

-- The pre-existing production function is the TWO-argument
-- convert_owner_offer_to_invoice_draft(uuid, uuid) from 20260723121000_owner_offers.sql.
-- The replacement below adds a third parameter with a default, which Postgres treats as a NEW
-- function rather than a replacement: without this drop both overloads would exist, every
-- two-argument call from the app would fail with "function ... is not unique", and the old body
-- — which still copies recurring lines onto the invoice — would remain reachable. Dropped
-- explicitly so exactly one conversion function exists after this migration.
drop function if exists public.convert_owner_offer_to_invoice_draft(uuid, uuid);

commit;

begin;

-- Offer -> invoice: the initial invoice is the ONE-TIME project charge only. Recurring
-- positions are a separate commercial track — billed per interval, on their own cadence,
-- typically starting only after go-live/commissioning (see billing_start_type) — and are
-- deliberately NOT copied onto this invoice at all, in either mode below.
--
-- p_milestone_index selects WHAT gets invoiced from the one-time amount:
--   * null            -> the whole one-time amount (all one-time lines, copied verbatim —
--                        this is the historical behaviour, unchanged for an offer with no
--                        payment plan). Terminal: sets converted_invoice_id and status =
--                        'converted', exactly as before.
--   * an array index into the offer's frozen payment_schedule -> ONE invoice line per
--     (vat_rate_bp, vat_treatment) group among the one-time lines, each scaled by that
--     milestone's share (percentage_bp, or amount_cents / one-time net). This is a rate
--     invoice (e.g. "Rate 1 - 50 %") — an intentional, PARTIAL conversion. It does NOT set
--     converted_invoice_id or flip the offer to 'converted': the offer stays 'accepted' so a
--     later rate can be invoiced as its own deliberate action, exactly as the owner asked
--     ("do not automatically create Rate 2").
--
-- The one-time amount can never be over-invoiced. Every conversion records what it billed
-- (source_offer_conversion_kind / source_offer_milestone_index), and the three mutually
-- exclusive rules below are enforced HERE for a readable error and by unique indexes for
-- correctness under concurrency:
--   * a milestone can be invoiced at most once;
--   * the full amount cannot be invoiced once any milestone has been;
--   * no milestone can be invoiced once the full amount has been.
-- The `for update` lock on the offer row serialises concurrent conversions of the same offer,
-- so two tabs racing on "Rate 1" queue behind each other and the second sees the first's row.
--
-- Both modes require a positive one-time amount to invoice. An offer with no one-time content
-- (recurring-only, or every one-time line optional) raises BEFORE any row is inserted, so a
-- recurring-only offer can never produce an empty draft.
create or replace function public.convert_owner_offer_to_invoice_draft(
  p_idempotency_key uuid, p_offer_id uuid, p_milestone_index int default null
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $fn$
declare
  v_existing jsonb; o record; v_inv uuid; v_line record; v_group record; v_terms int; v_result jsonb;
  v_recurring_excluded int; v_one_time_net bigint; v_milestone jsonb; v_ratio numeric; v_label text;
  v_group_count int; v_desc text; v_net bigint;
  v_full_invoiced boolean; v_milestone_total int; v_this_milestone int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'convert_owner_offer_to_invoice_draft');
  if v_existing is not null then return v_existing; end if;

  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;

  -- What has this offer already produced? Counted across ALL statuses on purpose: a cancelled
  -- invoice keeps its slot (see the unique-index comment above).
  select
    coalesce(bool_or(i.source_offer_conversion_kind = 'full'), false),
    count(*) filter (where i.source_offer_conversion_kind = 'milestone'),
    count(*) filter (where i.source_offer_conversion_kind = 'milestone'
                       and i.source_offer_milestone_index = p_milestone_index)
  into v_full_invoiced, v_milestone_total, v_this_milestone
  from public.owner_invoices i where i.source_offer_id = p_offer_id;

  -- converted_invoice_id is the authoritative "full conversion happened" marker: it is also set
  -- by conversions made BEFORE this migration, whose invoices carry no source_offer_* columns.
  v_full_invoiced := v_full_invoiced or o.converted_invoice_id is not null;

  if p_milestone_index is null then
    -- Idempotent re-conversion: a REPEAT of the same full conversion returns the existing
    -- invoice rather than raising or duplicating — unchanged behaviour.
    if v_full_invoiced then
      v_result := jsonb_build_object('invoice_id', o.converted_invoice_id, 'offer_id', p_offer_id, 'idempotent', true);
      update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
      return v_result;
    end if;
    if v_milestone_total > 0 then
      raise exception 'cannot invoice the full one-time amount: % instalment invoice(s) already exist for this offer', v_milestone_total;
    end if;
  else
    if v_full_invoiced then
      raise exception 'cannot invoice an instalment: the full one-time amount of this offer has already been invoiced';
    end if;
    if v_this_milestone > 0 then
      raise exception 'payment-plan instalment % has already been invoiced for this offer', p_milestone_index + 1;
    end if;
  end if;

  if o.status <> 'accepted' then raise exception 'only accepted offers can be converted'; end if;

  select coalesce(sum(net_cents), 0) into v_one_time_net from public.owner_offer_lines
    where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time';
  if v_one_time_net <= 0 then
    raise exception 'offer has no invoiceable one-time position — recurring positions are billed separately';
  end if;

  v_label := null; v_ratio := null;
  if p_milestone_index is not null then
    if jsonb_typeof(o.payment_schedule) <> 'array' or p_milestone_index < 0
       or p_milestone_index >= jsonb_array_length(o.payment_schedule) then
      raise exception 'invalid payment milestone index';
    end if;
    v_milestone := o.payment_schedule -> p_milestone_index;
    v_label := coalesce(v_milestone->>'label', 'Rate ' || (p_milestone_index + 1));
    if v_milestone ? 'percentage_bp' and (v_milestone->>'percentage_bp') is not null then
      v_ratio := (v_milestone->>'percentage_bp')::numeric / 10000;
      v_label := v_label || ' (' || round((v_milestone->>'percentage_bp')::numeric / 100, 2) || ' %)';
    elsif v_milestone ? 'amount_cents' and (v_milestone->>'amount_cents') is not null then
      v_ratio := (v_milestone->>'amount_cents')::numeric / v_one_time_net;
    else
      raise exception 'payment milestone has neither a percentage nor an amount';
    end if;
    if v_ratio <= 0 then raise exception 'payment milestone resolves to a non-positive amount'; end if;
  end if;

  select coalesce(default_payment_terms_days, 14) into v_terms from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_terms := coalesce(v_terms, 14);

  -- Recording the provenance in the same INSERT is what makes the unique indexes the real
  -- guarantee: a concurrent duplicate fails here, inside this transaction, before any invoice
  -- line exists.
  insert into public.owner_invoices (business_entity_id, organization_id, client_account_id, engagement_id,
    source_offer_id, source_offer_conversion_kind, source_offer_milestone_index,
    status, issue_date, service_date, due_date, currency, notes, external_reference, created_by)
  values (o.business_entity_id, o.organization_id, o.client_account_id, o.engagement_id, o.id,
    case when p_milestone_index is null then 'full' else 'milestone' end, p_milestone_index,
    'draft', current_date, current_date, current_date + v_terms, o.currency,
    coalesce(o.payment_terms, ''), 'Angebot ' || coalesce(o.offer_number, o.id::text), auth.uid())
  returning id into v_inv;

  if p_milestone_index is null then
    -- Full one-time amount: copied verbatim, one invoice line per offer line, unchanged from
    -- the pre-payment-plan behaviour.
    for v_line in select * from public.owner_offer_lines
      where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time' order by sort_order loop
      insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
      values (v_inv, v_line.description, v_line.quantity_milli, v_line.unit_price_cents, v_line.vat_rate_bp, v_line.vat_treatment, v_line.sort_order);
    end loop;
  else
    -- A rate: one invoice line per (vat_rate_bp, vat_treatment) group among the one-time
    -- lines, each scaled by the milestone's ratio. Grouping by VAT (not copying original
    -- lines 1:1) is what keeps a partial invoice correct when the one-time amount spans more
    -- than one VAT treatment; for the common single-treatment case (e.g. SVH Admin) this is
    -- exactly one line at label + rate.
    select count(*) into v_group_count from (
      select 1 from public.owner_offer_lines
      where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time'
      group by vat_rate_bp, vat_treatment
    ) g;
    for v_group in
      select vat_rate_bp, vat_treatment, sum(net_cents) as grp_net from public.owner_offer_lines
      where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time'
      group by vat_rate_bp, vat_treatment order by vat_rate_bp desc
    loop
      v_net := round(v_group.grp_net * v_ratio);
      v_desc := v_label || case when v_group_count > 1 then format(' (%s USt)', v_group.vat_rate_bp / 100.0) else '' end;
      insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
      values (v_inv, v_desc, 1000, v_net, v_group.vat_rate_bp, v_group.vat_treatment, 0);
    end loop;
  end if;

  select count(*) into v_recurring_excluded from public.owner_offer_lines
    where offer_id = p_offer_id and is_optional = false and pricing_type = 'recurring';

  -- Only a FULL conversion is terminal. A rate invoice leaves the offer 'accepted' so the next
  -- rate — or the eventual full remainder — stays a possible, deliberate future action.
  if p_milestone_index is null then
    update public.owner_offers set converted_invoice_id = v_inv, converted_at = now(), status = 'converted' where id = p_offer_id;
  end if;

  v_result := jsonb_build_object(
    'invoice_id', v_inv, 'offer_id', p_offer_id, 'recurring_lines_excluded', v_recurring_excluded,
    'milestone_label', v_label, 'is_full_conversion', p_milestone_index is null);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$fn$;

revoke execute on function public.convert_owner_offer_to_invoice_draft(uuid, uuid, int) from public, anon;
grant execute on function public.convert_owner_offer_to_invoice_draft(uuid, uuid, int) to authenticated, service_role;

commit;

begin;

-- Customer portal projection: expose the per-line pricing model and the recurring totals so
-- the portal renders the same split as the editor, the preview and the PDF. Historical
-- snapshots have neither key; the reader defaults them to one-time / zero, so an already
-- finalized offer keeps exactly the presentation it was signed with.
create or replace function public.public_offer_by_token(p_token text, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $fn$
declare
  tok public.owner_document_access_tokens; o record; v_doc record; v_ver record;
  snap jsonb; so jsonb; ss jsonb; st jsonb; v_lines jsonb; v_result jsonb;
  v_signer text; v_accepted_at timestamptz;
begin
  tok := public.owner_verify_offer_token(p_token);
  select * into o from public.owner_offers where id = tok.offer_id;
  if o.id is null then raise exception 'offer unavailable'; end if;
  if o.status = 'cancelled' then raise exception 'offer unavailable'; end if;

  select * into v_doc from public.owner_generated_documents where id = tok.document_id;
  select * into v_ver from public.owner_offer_versions where offer_id = o.id order by version desc limit 1;

  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary)
  values (tok.id, o.id, 'viewed', left(coalesce(p_user_agent,''), 200));
  if o.status in ('finalized','sent') then
    update public.owner_offers set status = 'viewed' where id = o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_viewed', 'Angebot angesehen',
      coalesce(o.offer_number,'') || ' wurde vom Kunden geöffnet.', 'owner_offers', o.id, o.gross_total_cents, 'normal');
  end if;

  if o.status in ('accepted','converted') then
    select signer_name, created_at into v_signer, v_accepted_at
    from public.owner_offer_acceptance_events
    where offer_id = o.id and decision = 'accepted' order by event_order desc limit 1;
  end if;

  if v_ver.snapshot is not null then
    -- ---- Serve from the immutable snapshot ----
    snap := v_ver.snapshot;
    so := snap->'offer';
    ss := snap->'seller';
    st := snap->'totals';
    select coalesce(jsonb_agg(jsonb_build_object(
      'description', l->>'description', 'details', l->>'details',
      'deliverables', coalesce(l->'deliverables','[]'::jsonb),
      'phase_label', l->>'phase_label', 'duration_label', l->>'duration_label',
      'quantity_milli', (l->>'quantity_milli')::bigint, 'unit', l->>'unit',
      'unit_price_cents', (l->>'unit_price_cents')::bigint, 'vat_rate_bp', (l->>'vat_rate_bp')::int,
      'vat_treatment', l->>'vat_treatment',
      'net_cents', (l->>'net_cents')::bigint, 'vat_cents', (l->>'vat_cents')::bigint,
      'gross_cents', (l->>'gross_cents')::bigint, 'is_optional', (l->>'is_optional')::boolean,
      'pricing_type', coalesce(nullif(l->>'pricing_type', ''), 'one_time'),
      'billing_interval', l->>'billing_interval',
      'minimum_term_months', nullif(l->>'minimum_term_months', '')::int,
      'billing_start_type', l->>'billing_start_type',
      'billing_start_label', l->>'billing_start_label'
    ) order by (l->>'sort_order')::int), '[]'::jsonb) into v_lines
    from jsonb_array_elements(coalesce(snap->'lines','[]'::jsonb)) l;

    v_result := jsonb_build_object(
      'offer_number', so->>'offer_number', 'title', so->>'title', 'subtitle', so->>'subtitle',
      'status', case when o.status='converted' then 'accepted' else o.status end,
      'issue_date', so->>'issue_date', 'valid_until', so->>'valid_until', 'currency', so->>'currency',
      'introduction', so->>'introduction', 'executive_summary', so->>'executive_summary',
      'project_approach', so->>'project_approach', 'next_steps', so->>'next_steps',
      'scope', so->>'scope', 'assumptions', so->>'assumptions', 'exclusions', so->>'exclusions',
      'payment_terms', so->>'payment_terms', 'delivery_terms', so->>'delivery_terms',
      'desired_outcomes', coalesce(so->'desired_outcomes','[]'::jsonb),
      'timeline', coalesce(so->'timeline','[]'::jsonb),
      'payment_schedule', coalesce(so->'payment_schedule','[]'::jsonb),
      'net_total_cents', coalesce((st->>'net_cents')::bigint, 0),
      'vat_total_cents', coalesce((st->>'vat_cents')::bigint, 0),
      'gross_total_cents', coalesce((st->>'gross_cents')::bigint, 0),
      'recurring_monthly_net_cents', coalesce((st->>'recurring_monthly_net_cents')::bigint, 0),
      'recurring_monthly_vat_cents', coalesce((st->>'recurring_monthly_vat_cents')::bigint, 0),
      'recurring_monthly_gross_cents', coalesce((st->>'recurring_monthly_gross_cents')::bigint, 0),
      'lines', v_lines,
      'recipient', jsonb_build_object(
        'company', so->>'recipient_company', 'contact_name', so->>'recipient_contact_name',
        'city', so->>'recipient_city', 'email', so->>'recipient_email',
        'salutation', so->>'recipient_salutation', 'title', so->>'recipient_title',
        'first_name', so->>'recipient_first_name', 'last_name', so->>'recipient_last_name',
        'greeting_name', so->>'recipient_greeting_name'),
      'seller', jsonb_build_object(
        'legal_name', coalesce(ss->>'legal_name',''), 'street', ss->>'street',
        'postal_code', ss->>'postal_code', 'city', ss->>'city',
        'country_code', coalesce(ss->>'country_code','DE'), 'email', ss->>'email',
        'website', ss->>'website', 'vat_id', ss->>'vat_id'),
      'template_version', snap->>'template_version'
    );
  else
    -- ---- Fallback: no snapshot (defensive; a token requires a non-draft offer). ----
    select coalesce(jsonb_agg(jsonb_build_object(
      'description', l.description, 'details', l.details, 'deliverables', l.deliverables,
      'phase_label', l.phase_label, 'duration_label', l.duration_label,
      'quantity_milli', l.quantity_milli, 'unit', l.unit,
      'unit_price_cents', l.unit_price_cents, 'vat_rate_bp', l.vat_rate_bp, 'vat_treatment', l.vat_treatment,
      'net_cents', l.net_cents, 'vat_cents', l.vat_cents, 'gross_cents', l.gross_cents, 'is_optional', l.is_optional,
      'pricing_type', l.pricing_type, 'billing_interval', l.billing_interval,
      'minimum_term_months', l.minimum_term_months,
      'billing_start_type', l.billing_start_type, 'billing_start_label', l.billing_start_label
    ) order by l.sort_order), '[]'::jsonb) into v_lines
    from public.owner_offer_lines l where l.offer_id = o.id;

    v_result := jsonb_build_object(
      'offer_number', o.offer_number, 'title', o.title, 'subtitle', o.subtitle,
      'status', case when o.status='converted' then 'accepted' else o.status end,
      'issue_date', o.issue_date, 'valid_until', o.valid_until, 'currency', o.currency,
      'introduction', o.introduction, 'executive_summary', o.executive_summary,
      'project_approach', o.project_approach, 'next_steps', o.next_steps,
      'scope', o.scope, 'assumptions', o.assumptions, 'exclusions', o.exclusions,
      'payment_terms', o.payment_terms, 'delivery_terms', o.delivery_terms,
      'desired_outcomes', o.desired_outcomes, 'timeline', o.timeline, 'payment_schedule', o.payment_schedule,
      'net_total_cents', o.net_total_cents, 'vat_total_cents', o.vat_total_cents, 'gross_total_cents', o.gross_total_cents,
      'recurring_monthly_net_cents', o.recurring_monthly_net_cents,
      'recurring_monthly_vat_cents', o.recurring_monthly_vat_cents,
      'recurring_monthly_gross_cents', o.recurring_monthly_gross_cents,
      'lines', v_lines,
      'recipient', jsonb_build_object(
        'company', o.recipient_company, 'contact_name', o.recipient_contact_name, 'city', o.recipient_city,
        'email', o.recipient_email, 'salutation', o.recipient_salutation, 'title', o.recipient_title,
        'first_name', o.recipient_first_name, 'last_name', o.recipient_last_name,
        'greeting_name', o.recipient_greeting_name),
      'seller', (select jsonb_build_object(
        'legal_name', coalesce(s.legal_name,''), 'street', s.street, 'postal_code', s.postal_code,
        'city', s.city, 'country_code', coalesce(s.country_code,'DE'), 'email', s.business_email,
        'website', s.website, 'vat_id', s.vat_id)
        from public.owner_document_settings s where s.business_entity_id = o.business_entity_id),
      'template_version', v_ver.template_version
    );
  end if;

  v_result := v_result || jsonb_build_object(
    'accepted', (o.status in ('accepted','converted')),
    'rejected', (o.status = 'rejected'),
    'expired', (o.status = 'expired' or o.valid_until < current_date),
    'has_pdf', (v_doc.id is not null and v_doc.pdf_storage_path is not null),
    'document_version', v_doc.version,
    'accepted_signer_name', v_signer,
    'accepted_at', v_accepted_at,
    'signed_document_available', exists (
      select 1 from public.owner_generated_documents g
      where g.source_resource_type='owner_offers' and g.source_resource_id=o.id
        and g.document_type='offer' and g.render_metadata->>'signed' = 'true')
  );
  return v_result;
end;
$fn$;

revoke execute on function public.public_offer_by_token(text, text) from public;
grant execute on function public.public_offer_by_token(text, text) to anon, authenticated, service_role;

commit;

begin;

-- owner_customer_detail's offer refs carried only gross_total_cents, which now means the
-- one-time portion only. Without the recurring figure a customer whose only offer is a
-- recurring-only package (a real, signed deal) shows as "0,00 EUR" on their own detail page.
-- Re-created (identical to the definition in 20260824171403_canonical_customer_and_deletion.sql,
-- already applied to production) with recurring_monthly_gross_cents added to each offer object.
create or replace function public.owner_customer_detail(p_customer_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $fn$
declare v_customer jsonb; v_offers jsonb; v_tasks jsonb; v_activity jsonb;
        v_invoices jsonb; v_payments jsonb; v_blockers jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select to_jsonb(c) into v_customer from public.owner_customers c where c.id = p_customer_id;
  if v_customer is null then raise exception 'customer not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id, 'offer_number', o.offer_number, 'title', o.title, 'status', o.status,
      'currency', o.currency, 'gross_total_cents', o.gross_total_cents,
      'recurring_monthly_gross_cents', o.recurring_monthly_gross_cents,
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
$fn$;

commit;
