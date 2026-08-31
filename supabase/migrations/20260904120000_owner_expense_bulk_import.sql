-- ===========================================================================
-- Owner Admin Center — EXPENSE bulk import (Ausgaben-Schnellimport).
--
-- THE DEFECT THIS FIXES
-- ---------------------
-- The Schnellimport shipped as a revenue importer: owner_bulk_import_finance takes
-- `invoices` and `recurring_contracts` and nothing else. Pasting real business expenses
-- into it pushed every row through INVOICE semantics, which produced exactly the wrong
-- answers on real data:
--
--   * "Kunde „OpenAI Ireland Limited" wurde nicht gefunden" — a SUPPLIER was looked up in
--     the customer table. Amazon and OpenAI are vendors; creating them as owner_customers
--     to silence the error would have corrupted the CRM to fix a bookkeeping bug.
--   * "issue_date fehlt" — an expense carries the SUPPLIER's invoice_date. We do not issue
--     a supplier's invoice, so we have no issue_date to give.
--   * "Zahlungen (23.00) übersteigen den Rechnungsbetrag (19.33)" — invoice VAT arithmetic
--     was applied to `domestic_standard`, a treatment the invoice vocabulary does not
--     contain, so VAT came out as 0 and a correct 23,00 € payment looked like an overpayment.
--
-- WHAT THIS MIGRATION ADDS
-- ------------------------
--   * owner_resolve_import_vendors  — preview-time, deterministic, NEVER fuzzy.
--   * owner_bulk_import_expenses    — one call, one transaction, all-or-nothing.
--   * `expense` as an import record type, so the cross-batch duplicate guard covers it.
--   * a guard on owner_bulk_import_finance so an expense payload sent to the REVENUE
--     importer is refused rather than silently dropped.
--
-- WHAT IT DELIBERATELY DOES NOT ADD
-- ---------------------------------
-- Supplier credits (Gutschriften / negative expenses). The canonical model has no
-- representation for one: owner_expenses.payment_status has no 'credited' state,
-- owner_payments.amount_cents is CHECK (amount_cents > 0) and an expense-linked payment is
-- forced to be an outflow, so a refund cannot be recorded at all, and the status rule
-- requires gross_total_cents > 0 so a negative expense can never settle. Importing one
-- would quietly reduce Vorsteuer with nothing to audit it against. Building a credit-note
-- booking type is a separate, larger piece of accounting work; until then such a row is
-- REFUSED with a precise message rather than corrupted by abs().
--
-- Nothing here can reach a customer. No email, no automation job, no outbound call, no
-- invoice, no invoice number and no customer record is created or touched by any statement
-- in this file — asserted structurally by src/lib/ownerFinance/financeWriteSafety.test.ts
-- and behaviourally by .github/scripts/sql/expense-bulk-import-tests.sql.
--
-- Additive and idempotent. Safe to re-apply.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Import bookkeeping: expenses become a first-class import record type.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_finance_import_batches
  add column if not exists expense_count int not null default 0;

alter table public.owner_finance_import_records
  add column if not exists expense_id uuid references public.owner_expenses(id) on delete set null;

-- The original CHECK is inline and therefore server-named. Widening it (rather than adding
-- a second constraint) keeps exactly one statement of what a record_type may be.
alter table public.owner_finance_import_records
  drop constraint if exists owner_finance_import_records_record_type_check;
alter table public.owner_finance_import_records
  add constraint owner_finance_import_records_record_type_check
  check (record_type in ('invoice', 'revenue_contract', 'expense'));

create index if not exists owner_finance_import_records_expense_idx
  on public.owner_finance_import_records (expense_id);

commit;

-- ---------------------------------------------------------------------------
-- 2. Preview-time VENDOR resolution.
--
--    The expense counterpart of owner_resolve_import_customers, and pointedly NOT that
--    function: it reads public.owner_vendors and can never return an organization.
--
--    Matching is normalised-exact only (lower(trim(name))). No trigram, no similarity, no
--    prefix match. Two vendors sharing a name come back ambiguous with no id and the UI
--    stops that row; guessing between "OpenAI Ireland Limited" and "OpenAI Ireland Ltd."
--    would misfile deductible spend under a supplier the owner never chose.
--
--    owner_vendors is entity-independent in the canonical model (it has no
--    business_entity_id). p_entity is accepted so the owner gate and the call shape match
--    the customer resolver, and is validated, but it does not narrow the match set —
--    saying otherwise in a signature would be a lie about what the data supports.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_resolve_import_vendors(p_entity uuid, p_names jsonb)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_name text; v_rows jsonb := '[]'::jsonb; v_count int; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'business entity is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = p_entity) then
    raise exception 'unknown business entity';
  end if;
  if p_names is null or jsonb_typeof(p_names) <> 'array' then raise exception 'names must be an array'; end if;
  if jsonb_array_length(p_names) > 200 then raise exception 'at most 200 names per resolution'; end if;

  for v_name in select jsonb_array_elements_text(p_names) loop
    -- (array_agg)[1] rather than min(): uuid has no min() aggregate, and the value is only
    -- ever used when exactly one row matched anyway.
    select count(*), (array_agg(v.id))[1] into v_count, v_id
    from public.owner_vendors v
    where lower(trim(v.name)) = lower(trim(v_name));
    v_rows := v_rows || jsonb_build_object(
      'name', v_name,
      'vendor_id', case when v_count = 1 then v_id else null end,
      'match_count', v_count,
      'ambiguous', v_count > 1);
  end loop;
  return v_rows;
end;
$$;
revoke execute on function public.owner_resolve_import_vendors(uuid, jsonb) from public, anon;
grant execute on function public.owner_resolve_import_vendors(uuid, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 3. THE atomic expense import.
--
--    One function call = one transaction = all-or-nothing. If the eighteenth expense is
--    bad, the first seventeen roll back with it — including any vendor this call created —
--    so the owner is never left reconciling a half-finished import by hand.
--
--    The server is authoritative for every number. Net, VAT, gross, Vorsteuer, amount paid
--    and payment_status are all derived by the canonical triggers from the lines and the
--    real owner_payments rows. Client-supplied totals are not read anywhere below.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_bulk_import_expenses(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; v_entity uuid; v_batch uuid; v_item jsonb; v_line jsonb; v_pay jsonb;
  v_expenses jsonb; v_cid text; v_expense uuid; v_vendor uuid; v_vendor_name text;
  v_cat uuid; v_line_cat uuid; v_key text; v_match int; v_net bigint; v_sort int;
  v_review text; v_reason text; v_pay_sum bigint; v_pay_count int := 0; v_exp_count int := 0;
  v_net_total bigint := 0; v_vat_total bigint := 0; v_gross_total bigint := 0;
  v_input_vat bigint := 0; v_paid_total bigint := 0;
  v_vendors_created jsonb := '[]'::jsonb; v_created jsonb := '[]'::jsonb;
  exp record; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  -- Replaying the SAME idempotency key returns the first call's result verbatim and writes
  -- nothing further. A retried request after a dropped connection is therefore safe.
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_bulk_import_expenses');
  if v_existing is not null then return v_existing; end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'payload must be a JSON object'; end if;
  if coalesce((p_payload->>'schema_version')::int, 0) <> 1 then
    raise exception 'unsupported schema_version (expected 1)';
  end if;
  v_entity := (p_payload->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = v_entity) then
    raise exception 'unknown business entity';
  end if;

  -- The accounting firewall, stated as a refusal. This RPC writes expenses; a revenue
  -- payload arriving here is a mistake, and a silent drop is the worst possible response.
  if jsonb_array_length(coalesce(p_payload->'invoices', '[]'::jsonb)) > 0
     or jsonb_array_length(coalesce(p_payload->'recurring_contracts', '[]'::jsonb)) > 0 then
    raise exception 'this import accepts expenses only; use owner_bulk_import_finance for revenue';
  end if;

  v_expenses := coalesce(p_payload->'expenses', '[]'::jsonb);
  if jsonb_typeof(v_expenses) <> 'array' then raise exception 'expenses must be an array'; end if;
  if jsonb_array_length(v_expenses) = 0 then raise exception 'nothing to import'; end if;
  if jsonb_array_length(v_expenses) > 100 then raise exception 'at most 100 expenses per import'; end if;

  insert into public.owner_finance_import_batches (business_entity_id, schema_version, source, created_by)
  values (v_entity, 1, nullif(p_payload->>'source',''), auth.uid())
  returning id into v_batch;

  for v_item in select * from jsonb_array_elements(v_expenses) loop
    v_cid := nullif(trim(coalesce(v_item->>'client_import_id','')), '');
    if v_cid is null then raise exception 'every expense needs a client_import_id'; end if;
    if nullif(v_item->>'invoice_date','') is null then
      raise exception 'expense %: invoice_date is required', v_cid;
    end if;

    -- ---- VENDOR (never a customer) ---------------------------------------
    --
    -- Resolution is repeated here rather than trusting the id the preview bound: the
    -- browser is not authoritative about which supplier a row belongs to. A vendor created
    -- earlier in THIS loop is found by the same lookup, so two rows naming the same new
    -- supplier share one vendor rather than creating a duplicate.
    v_vendor := nullif(v_item->'vendor'->>'vendor_id','')::uuid;
    v_vendor_name := nullif(trim(coalesce(v_item->'vendor'->>'name','')), '');

    if v_vendor is not null then
      if not exists (select 1 from public.owner_vendors where id = v_vendor) then
        raise exception 'expense %: vendor % does not exist', v_cid, v_vendor;
      end if;
    elsif v_vendor_name is not null then
      select count(*), (array_agg(v.id))[1] into v_match, v_vendor
      from public.owner_vendors v where lower(trim(v.name)) = lower(trim(v_vendor_name));
      if v_match > 1 then
        raise exception 'expense %: vendor "%" is ambiguous (% matches) — resolve it manually',
          v_cid, v_vendor_name, v_match;
      elsif v_match = 0 then
        -- Creating the supplier is part of the SAME transaction as the expense that needs
        -- it. The preview named it ("Neuer Lieferant wird angelegt: …") before the owner
        -- confirmed; a rollback takes the vendor with it.
        insert into public.owner_vendors (name, country_code, vat_id)
        values (v_vendor_name,
                nullif(upper(trim(coalesce(v_item->'vendor'->>'country_code',''))), ''),
                nullif(trim(coalesce(v_item->'vendor'->>'vat_id','')), ''))
        returning id into v_vendor;
        v_vendors_created := v_vendors_created || to_jsonb(v_vendor_name);
      end if;
    else
      raise exception 'expense %: vendor.vendor_id or vendor.name is required', v_cid;
    end if;

    -- ---- CATEGORY (stable keys only) -------------------------------------
    --
    -- The client never supplies a database id. An unknown key fails the row loudly; an
    -- absent one falls to the canonical review_required category and the expense is flagged
    -- for review rather than being classified into something tax-sensitive it never asked for.
    v_key := nullif(trim(coalesce(v_item->>'category_key','')), '');
    v_review := 'pending'; v_reason := null;
    if v_key is null then
      v_key := 'review_required';
      v_review := 'needs_info';
      v_reason := 'Kategorie beim Schnellimport nicht angegeben';
    end if;
    select id into v_cat from public.owner_expense_categories where key = v_key;
    if v_cat is null then raise exception 'expense %: unknown expense category "%"', v_cid, v_key; end if;

    insert into public.owner_expenses (business_entity_id, vendor_id, category_id,
      supplier_invoice_number, invoice_date, service_date, due_date, currency,
      review_status, review_reason, notes, created_by)
    values (v_entity, v_vendor, v_cat,
      nullif(v_item->>'supplier_invoice_number',''),
      (v_item->>'invoice_date')::date,
      nullif(v_item->>'service_date','')::date,
      nullif(v_item->>'due_date','')::date,
      coalesce(nullif(v_item->>'currency',''), 'EUR'),
      v_review, v_reason, nullif(v_item->>'notes',''), auth.uid())
    returning id into v_expense;

    if jsonb_array_length(coalesce(v_item->'lines','[]'::jsonb)) < 1 then
      raise exception 'expense %: at least one line is required', v_cid;
    end if;

    v_sort := 0;
    for v_line in select * from jsonb_array_elements(coalesce(v_item->'lines','[]'::jsonb)) loop
      v_net := (v_line->>'net_cents')::bigint;
      if v_net is null then raise exception 'expense %: every line needs net_cents', v_cid; end if;
      -- See the header: there is no canonical supplier-credit representation to import into.
      if v_net < 0 then
        raise exception 'expense %: supplier credits (negative expenses) need a separate booking type and were not imported', v_cid;
      end if;

      v_key := nullif(trim(coalesce(v_line->>'category_key','')), '');
      if v_key is null then
        v_line_cat := v_cat;
      else
        select id into v_line_cat from public.owner_expense_categories where key = v_key;
        if v_line_cat is null then raise exception 'expense %: unknown expense category "%"', v_cid, v_key; end if;
      end if;

      -- net_cents, the rate and the treatment are the ONLY monetary inputs. vat_cents and
      -- gross_cents are computed by owner_recalc_expense_line(); the header totals and the
      -- Vorsteuer by owner_recalc_expense_totals(). Nothing derived is read from the payload.
      insert into public.owner_expense_lines (expense_id, category_id, description, net_cents,
        vat_rate_bp, vat_treatment, input_vat_eligibility_bp, deductibility_bp,
        asset_candidate, sort_order)
      values (v_expense, v_line_cat, v_line->>'description', v_net,
        coalesce((v_line->>'vat_rate_bp')::int, 1900),
        coalesce(nullif(v_line->>'vat_treatment',''), 'domestic_standard'),
        coalesce((v_line->>'input_vat_eligibility_bp')::int, 10000),
        coalesce((v_line->>'deductibility_bp')::int, 10000),
        coalesce((v_line->>'asset_candidate')::boolean, false),
        coalesce((v_line->>'sort_order')::int, v_sort));
      v_sort := v_sort + 1;
    end loop;

    -- ---- PAYMENTS (expense outflows, never invoice income) ----------------
    select coalesce(sum((p->>'amount_cents')::bigint), 0) into v_pay_sum
    from jsonb_array_elements(coalesce(v_item->'payments','[]'::jsonb)) p;

    select * into exp from public.owner_expenses where id = v_expense;
    if v_pay_sum > exp.gross_total_cents then
      raise exception 'expense %: payments (%) exceed the expense gross (%)',
        v_cid, v_pay_sum, exp.gross_total_cents;
    end if;

    for v_pay in select * from jsonb_array_elements(coalesce(v_item->'payments','[]'::jsonb)) loop
      if nullif(v_pay->>'payment_date','') is null then
        raise exception 'expense %: every payment needs a payment_date', v_cid;
      end if;
      if coalesce((v_pay->>'amount_cents')::bigint, 0) <= 0 then
        raise exception 'expense %: every payment needs a positive amount_cents', v_cid;
      end if;
      -- kind='expense' + direction='outflow' + expense_id. owner_validate_payment() rejects
      -- any other combination, and owner_apply_payment() derives amount_paid_cents and
      -- payment_status from the rows that actually landed — the client cannot state either.
      insert into public.owner_payments (business_entity_id, kind, direction, payment_date,
        amount_cents, currency, payment_method, reference, notes, expense_id, created_by)
      values (v_entity, 'expense', 'outflow', (v_pay->>'payment_date')::date,
        (v_pay->>'amount_cents')::bigint, coalesce(nullif(v_item->>'currency',''), 'EUR'),
        nullif(v_pay->>'method',''), nullif(v_pay->>'reference',''), nullif(v_pay->>'note',''),
        v_expense, auth.uid());
      v_pay_count := v_pay_count + 1;
    end loop;

    -- THE duplicate guard: unique (business_entity_id, record_type, client_import_id) across
    -- every batch. Re-importing the same file is refused, not duplicated.
    insert into public.owner_finance_import_records (batch_id, business_entity_id, record_type,
      client_import_id, expense_id)
    values (v_batch, v_entity, 'expense', v_cid, v_expense);

    select * into exp from public.owner_expenses where id = v_expense;
    v_exp_count := v_exp_count + 1;
    v_net_total := v_net_total + exp.net_total_cents;
    v_vat_total := v_vat_total + exp.vat_total_cents;
    v_gross_total := v_gross_total + exp.gross_total_cents;
    v_input_vat := v_input_vat + exp.input_vat_cents;
    v_paid_total := v_paid_total + coalesce(exp.amount_paid_cents, 0);
    v_created := v_created || jsonb_build_object('client_import_id', v_cid, 'expense_id', v_expense,
      'vendor_id', exp.vendor_id, 'payment_status', exp.payment_status,
      'gross_total_cents', exp.gross_total_cents);
  end loop;

  update public.owner_finance_import_batches
     set expense_count = v_exp_count, payment_count = v_pay_count,
         summary = jsonb_build_object('net_cents', v_net_total, 'vat_cents', v_vat_total,
           'gross_cents', v_gross_total, 'input_vat_cents', v_input_vat, 'paid_cents', v_paid_total,
           'vendors_created', v_vendors_created)
   where id = v_batch;

  v_result := jsonb_build_object('batch_id', v_batch,
    'expense_count', v_exp_count, 'payment_count', v_pay_count,
    'net_cents', v_net_total, 'vat_cents', v_vat_total, 'gross_cents', v_gross_total,
    'input_vat_cents', v_input_vat, 'paid_cents', v_paid_total,
    'vendors_created', v_vendors_created, 'expenses', v_created);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;
revoke execute on function public.owner_bulk_import_expenses(uuid, jsonb) from public, anon;
grant execute on function public.owner_bulk_import_expenses(uuid, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. The REVENUE importer refuses an expense payload.
--
--    owner_bulk_import_finance is reproduced verbatim from 20260828120000 with exactly one
--    added guard (marked inline). It is replaced rather than left alone because `expenses`
--    rides on the same schema_version: without the guard, a payload containing expense rows
--    would import its invoices, drop every expense without a word, and report success.
--
--    Everything else about the revenue path is untouched, and
--    .github/scripts/sql/finance-multipay-tests.sql is re-run against the patched schema to
--    prove it.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_bulk_import_finance(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; v_entity uuid; v_batch uuid; v_item jsonb; v_id uuid; v_applied jsonb;
  v_invoices jsonb; v_contracts jsonb; v_cid text; v_line jsonb; v_contract uuid;
  v_inv_count int := 0; v_pay_count int := 0; v_con_count int := 0;
  v_net bigint := 0; v_vat bigint := 0; v_gross bigint := 0; v_paid bigint := 0;
  inv record; v_result jsonb; v_created jsonb := '[]'::jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_bulk_import_finance');
  if v_existing is not null then return v_existing; end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'payload must be a JSON object'; end if;
  if coalesce((p_payload->>'schema_version')::int, 0) <> 1 then
    raise exception 'unsupported schema_version (expected 1)';
  end if;
  v_entity := (p_payload->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;

  -- ADDED 20260904120000. `expenses` is an additive key of the same schema_version, handled
  -- by owner_bulk_import_expenses. This function has no expense path, so a payload carrying
  -- expense rows must be REFUSED here: silently importing the invoices and dropping the
  -- expenses would leave the owner's books short by exactly the rows they could not see.
  -- Payloads without the key -- every payload written before it existed -- are unaffected.
  if jsonb_array_length(coalesce(p_payload->'expenses', '[]'::jsonb)) > 0 then
    raise exception 'this import accepts revenue only; use owner_bulk_import_expenses for expenses';
  end if;

  v_invoices  := coalesce(p_payload->'invoices', '[]'::jsonb);
  v_contracts := coalesce(p_payload->'recurring_contracts', '[]'::jsonb);
  if jsonb_typeof(v_invoices) <> 'array' or jsonb_typeof(v_contracts) <> 'array' then
    raise exception 'invoices and recurring_contracts must be arrays';
  end if;
  -- Payload bounds. Generous enough for a year of history, small enough that one
  -- transaction stays sane.
  if jsonb_array_length(v_invoices) > 100 then raise exception 'at most 100 invoices per import'; end if;
  if jsonb_array_length(v_contracts) > 100 then raise exception 'at most 100 contracts per import'; end if;
  if jsonb_array_length(v_invoices) = 0 and jsonb_array_length(v_contracts) = 0 then
    raise exception 'nothing to import';
  end if;

  insert into public.owner_finance_import_batches (business_entity_id, schema_version, source, created_by)
  values (v_entity, 1, nullif(p_payload->>'source',''), auth.uid())
  returning id into v_batch;

  -- ---- invoices -----------------------------------------------------------
  for v_item in select * from jsonb_array_elements(v_invoices) loop
    v_cid := nullif(trim(coalesce(v_item->>'client_import_id','')), '');
    if v_cid is null then raise exception 'every invoice needs a client_import_id'; end if;

    v_id := public.owner_build_issued_invoice(v_entity,
      (coalesce(v_item->'customer','{}'::jsonb) || jsonb_build_object(
        'issue_date', v_item->>'issue_date',
        'service_date', v_item->>'service_date',
        'service_period_start', v_item->>'service_period_start',
        'service_period_end', v_item->>'service_period_end',
        'due_date', v_item->>'due_date',
        'currency', coalesce(v_item->>'currency','EUR'),
        'notes', v_item->>'notes',
        'external_reference', v_item->>'external_reference',
        'historical_entry', true)),
      coalesce(v_item->'lines','[]'::jsonb));

    v_applied := public.owner_apply_invoice_payments(v_id, coalesce(v_item->'payments','[]'::jsonb));

    -- The unique constraint here is what makes a retried batch safe.
    insert into public.owner_finance_import_records (batch_id, business_entity_id, record_type, client_import_id, invoice_id)
    values (v_batch, v_entity, 'invoice', v_cid, v_id);

    select * into inv from public.owner_invoices where id = v_id;
    v_inv_count := v_inv_count + 1;
    v_pay_count := v_pay_count + jsonb_array_length(coalesce(v_applied->'payment_ids','[]'::jsonb));
    v_net := v_net + inv.net_total_cents; v_vat := v_vat + inv.vat_total_cents;
    v_gross := v_gross + inv.gross_total_cents; v_paid := v_paid + coalesce(inv.amount_paid_cents,0);
    v_created := v_created || jsonb_build_object('client_import_id', v_cid, 'invoice_id', v_id,
      'invoice_number', inv.invoice_number, 'status', inv.status);
  end loop;

  -- ---- recurring contracts ------------------------------------------------
  for v_item in select * from jsonb_array_elements(v_contracts) loop
    v_cid := nullif(trim(coalesce(v_item->>'client_import_id','')), '');
    if v_cid is null then raise exception 'every contract needs a client_import_id'; end if;

    insert into public.owner_revenue_contracts (business_entity_id, organization_id, client_account_id,
      name, description, status, start_date, end_date, billing_frequency, billing_day, currency, created_by)
    values (v_entity,
      nullif(coalesce(v_item->'customer','{}'::jsonb)->>'organization_id','')::uuid,
      nullif(coalesce(v_item->'customer','{}'::jsonb)->>'client_account_id','')::uuid,
      v_item->>'name', v_item->>'description', coalesce(v_item->>'status','active'),
      (v_item->>'start_date')::date, nullif(v_item->>'end_date','')::date,
      coalesce(v_item->>'billing_frequency','monthly'), nullif(v_item->>'billing_day','')::int,
      coalesce(v_item->>'currency','EUR'), auth.uid())
    returning id into v_contract;

    for v_line in select * from jsonb_array_elements(coalesce(v_item->'lines','[]'::jsonb)) loop
      insert into public.owner_revenue_contract_lines (contract_id, description, quantity_milli,
        unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
      values (v_contract, v_line->>'description', coalesce((v_line->>'quantity_milli')::bigint, 1000),
        (v_line->>'unit_price_cents')::bigint, coalesce((v_line->>'vat_rate_bp')::int, 1900),
        coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'sort_order')::int, 0));
    end loop;

    insert into public.owner_finance_import_records (batch_id, business_entity_id, record_type, client_import_id, contract_id)
    values (v_batch, v_entity, 'revenue_contract', v_cid, v_contract);
    v_con_count := v_con_count + 1;
  end loop;

  update public.owner_finance_import_batches
     set invoice_count = v_inv_count, payment_count = v_pay_count, contract_count = v_con_count,
         summary = jsonb_build_object('net_cents', v_net, 'vat_cents', v_vat, 'gross_cents', v_gross, 'paid_cents', v_paid)
   where id = v_batch;

  v_result := jsonb_build_object('batch_id', v_batch,
    'invoice_count', v_inv_count, 'payment_count', v_pay_count, 'contract_count', v_con_count,
    'net_cents', v_net, 'vat_cents', v_vat, 'gross_cents', v_gross, 'paid_cents', v_paid,
    'invoices', v_created);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke execute on function public.owner_bulk_import_finance(uuid, jsonb) from public, anon;
grant execute on function public.owner_bulk_import_finance(uuid, jsonb) to authenticated, service_role;

commit;
