-- ===========================================================================
-- Owner finance: ADVANCE payments (Anzahlungen) received BEFORE the final
-- invoice was issued. ADDITIVE — no existing row is rewritten and no existing
-- behaviour changes while no advance payment exists.
--
-- WHY THIS EXISTS
-- ---------------
-- A real final invoice can deduct instalments that were genuinely received
-- earlier ("Abschlagszahlung 1/2 … Restbetrag"). Until now every payment path
-- refused a payment_date before issue_date, so such an invoice could only be
-- entered by falsifying a date — either backdating the invoice or restating the
-- receipts as having happened on the invoice date. Both destroy the very facts
-- the books exist to record, so instead the model gains a second, explicit
-- payment kind.
--
-- WHAT IS DELIBERATELY NOT DONE
-- -----------------------------
-- No separate Abschlagsrechnung documents are invented. This models case B
-- (a true advance against one final invoice), not case C (separate interim
-- invoices with their own document numbers). An owner who really issued interim
-- invoices should enter those as invoices in their own right; nothing here
-- guesses that for them. There is still no bank connection, no reconciliation,
-- no credit-balance feature and no outbound communication of any kind.
--
-- THE INVARIANT
-- -------------
-- Every inflow attached to an invoice satisfies EXACTLY ONE of:
--   payment_kind = 'invoice_payment'  AND payment_date >= issue_date
--   payment_kind = 'advance_payment'  AND payment_date <  issue_date
-- The two kinds are disjoint by construction, so "is this receipt an advance?"
-- is never a matter of interpretation, and an ordinary payment can still never
-- predate the invoice it settles.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. The column. Defaults to the ordinary kind, so every pre-existing row and
--    every existing insert path keeps its exact current meaning.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_payments
  add column if not exists payment_kind text not null default 'invoice_payment';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'owner_payments_payment_kind_check') then
    alter table public.owner_payments
      add constraint owner_payments_payment_kind_check
      check (payment_kind in ('invoice_payment', 'advance_payment'));
  end if;
end $$;

comment on column public.owner_payments.payment_kind is
  'Settlement role of an invoice-linked inflow. NOT the same axis as owner_payments.kind '
  '(income/expense/…): kind says WHAT the money is, payment_kind says WHEN it arrived '
  'relative to the invoice it settles. invoice_payment = ordinary payment on or after the '
  'invoice date. advance_payment = Anzahlung genuinely received before the final invoice '
  'was issued.';

-- Advance payments are read per invoice by the VAT logic below, and there are
-- few of them relative to all payments.
create index if not exists owner_payments_advance_idx
  on public.owner_payments (invoice_id, payment_date)
  where payment_kind = 'advance_payment';

commit;

-- ---------------------------------------------------------------------------
-- 2. The canonical validator. The date rule now lives HERE rather than only in
--    the individual RPCs, so no entry point — including the plain
--    record_owner_invoice_payment path, which never checked it — can attach an
--    undeclared pre-invoice payment to an invoice.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_validate_payment()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare inv record; exp record; txp record; v_other bigint;
begin
  if new.kind in ('income', 'owner_contribution', 'tax_refund') and new.direction <> 'inflow' then
    raise exception 'payment kind % must be an inflow', new.kind;
  end if;
  if new.kind in ('expense', 'owner_withdrawal', 'tax_payment') and new.direction <> 'outflow' then
    raise exception 'payment kind % must be an outflow', new.kind;
  end if;

  -- An advance is an advance ON something. Unattached, it would be a credit
  -- balance, which this system deliberately does not model.
  if new.payment_kind = 'advance_payment' then
    if new.invoice_id is null then raise exception 'an advance payment must be linked to an invoice'; end if;
    if new.kind <> 'income' or new.direction <> 'inflow' then
      raise exception 'an advance payment must be an income inflow';
    end if;
  end if;

  if new.invoice_id is not null then
    select business_entity_id, status, gross_total_cents, issue_date into inv
      from public.owner_invoices where id = new.invoice_id;
    if inv.business_entity_id <> new.business_entity_id then raise exception 'payment entity differs from linked invoice entity'; end if;
    if new.direction <> 'inflow' then raise exception 'invoice payments must be inflows'; end if;
    if inv.status in ('void', 'cancelled') then raise exception 'cannot record a payment against a % invoice', inv.status; end if;

    -- The disjointness invariant. Checked only when the row is new or when an UPDATE
    -- actually touches one of the two fields involved, so a row that predates this rule
    -- can still have its amount, reference or method corrected rather than being frozen
    -- — the same repair-only relaxation the overpayment guard already uses.
    if inv.issue_date is not null
       and (tg_op = 'INSERT'
            or new.payment_date is distinct from old.payment_date
            or new.payment_kind is distinct from old.payment_kind) then
      if new.payment_kind = 'advance_payment' then
        if new.payment_date >= inv.issue_date then
          raise exception 'an advance payment (%) must be dated before the invoice date (%); a receipt on or after it is an ordinary payment',
            new.payment_date, inv.issue_date;
        end if;
      elsif new.payment_date < inv.issue_date then
        raise exception 'payment_date % must not be before issue_date % — record a genuine pre-invoice receipt as payment_kind = advance_payment instead',
          new.payment_date, inv.issue_date;
      end if;
    end if;

    -- Overpayment guard. Sum the OTHER inflows against this invoice (excluding this
    -- row on UPDATE) and refuse anything that would push the total past the
    -- server-computed gross. Advances count towards settlement exactly like ordinary
    -- payments, so an invoice can never be settled by more than its own total no
    -- matter how the receipts are split across the two kinds.
    if inv.gross_total_cents is not null and inv.gross_total_cents > 0 then
      select coalesce(sum(p.amount_cents), 0) into v_other
      from public.owner_payments p
      where p.invoice_id = new.invoice_id and p.direction = 'inflow'
        and (tg_op = 'INSERT' or p.id <> new.id);
      if v_other + new.amount_cents > inv.gross_total_cents then
        -- An invoice recorded BEFORE this guard existed may already overpay. Refusing every
        -- write on such a row would strand it: its metadata could not be corrected and its
        -- amount could not even be reduced back into range, because the running total stays
        -- above gross either way. So on UPDATE, a change that does not INCREASE the recorded
        -- total is let through — that is repair, not new overpayment.
        --
        -- New overpayment stays impossible: an INSERT is always refused, and so is an UPDATE
        -- that raises the total. This is repair-only relaxation, not a credit-balance
        -- feature; a genuine customer overpayment still cannot be attached to an invoice.
        if not (tg_op = 'UPDATE' and v_other + new.amount_cents <= v_other + old.amount_cents) then
          raise exception 'payments (% cents) would exceed the invoice gross (% cents)',
            v_other + new.amount_cents, inv.gross_total_cents;
        end if;
      end if;
    end if;
  end if;
  if new.expense_id is not null then
    select business_entity_id, payment_status into exp from public.owner_expenses where id = new.expense_id;
    if exp.business_entity_id <> new.business_entity_id then raise exception 'payment entity differs from linked expense entity'; end if;
    if new.direction <> 'outflow' then raise exception 'expense payments must be outflows'; end if;
    if exp.payment_status = 'void' then raise exception 'cannot record a payment against a void expense'; end if;
  end if;
  if new.tax_payment_id is not null then
    select business_entity_id into txp from public.owner_tax_payments where id = new.tax_payment_id;
    if txp.business_entity_id <> new.business_entity_id then raise exception 'payment entity differs from linked tax payment entity'; end if;
  end if;
  return new;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 3. The multi-payment applier learns the second kind.
--
--    Every caller — the historical composer, the single "add payment" RPC, the
--    recurring month posting and the bulk import — routes through this one
--    function, so accepting payment_kind here is the whole client-facing change.
--    A payment object WITHOUT payment_kind keeps meaning exactly what it meant
--    before, which is what keeps bulk-import schema_version 1 valid unchanged.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_apply_invoice_payments(p_invoice_id uuid, p_payments jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  inv record; v_pay jsonb; v_date date; v_amount bigint; v_kind text;
  v_sum bigint := 0; v_ids jsonb := '[]'::jsonb; v_pid uuid;
begin
  if p_payments is null or jsonb_typeof(p_payments) <> 'array' then return jsonb_build_object('payment_ids','[]'::jsonb,'total_cents',0); end if;
  if jsonb_array_length(p_payments) > 60 then raise exception 'at most 60 payments per invoice'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;

  for v_pay in select * from jsonb_array_elements(p_payments) loop
    v_date := nullif(v_pay->>'payment_date','')::date;
    v_amount := (v_pay->>'amount_cents')::bigint;
    -- Absent field = ordinary payment. That is what makes every payload written
    -- against the previous contract mean the same thing it meant then.
    v_kind := coalesce(nullif(v_pay->>'payment_kind',''), 'invoice_payment');
    if v_date is null then raise exception 'each payment requires a payment_date'; end if;
    if v_amount is null or v_amount <= 0 then raise exception 'each payment requires a positive amount_cents'; end if;
    if v_kind not in ('invoice_payment','advance_payment') then
      raise exception 'unsupported payment_kind % (expected invoice_payment or advance_payment)', v_kind;
    end if;

    -- The disjointness invariant, checked here too so the owner gets a message naming
    -- the offending payment rather than a trigger error naming a row id. The trigger
    -- remains the canonical enforcement point.
    if v_kind = 'advance_payment' then
      if v_date >= inv.issue_date then
        raise exception 'advance payment % is not before the invoice date % — record it as an ordinary payment instead', v_date, inv.issue_date;
      end if;
    elsif v_date < inv.issue_date then
      raise exception 'payment_date % must not be before issue_date % — record a genuine pre-invoice receipt as payment_kind = advance_payment instead', v_date, inv.issue_date;
    end if;

    v_sum := v_sum + v_amount;
    if v_sum > inv.gross_total_cents then
      raise exception 'payments (% cents) exceed the invoice gross (% cents)', v_sum, inv.gross_total_cents;
    end if;

    insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents,
      invoice_id, organization_id, payment_method, reference, notes, payment_kind, created_by)
    values (inv.business_entity_id, 'income', 'inflow', v_date, v_amount, p_invoice_id, inv.organization_id,
      nullif(v_pay->>'method',''), nullif(v_pay->>'reference',''), nullif(v_pay->>'note',''), v_kind, auth.uid())
    returning id into v_pid;
    v_ids := v_ids || to_jsonb(v_pid);
  end loop;

  return jsonb_build_object('payment_ids', v_ids, 'total_cents', v_sum);
end;
$$;
revoke execute on function public.owner_apply_invoice_payments(uuid, jsonb) from public, anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 4. TAX. The part that must be right or the feature must not ship.
--
--    EÜR (§4 Abs. 3 EStG, cash basis) — NO CHANGE NEEDED.
--      Operating income is already summed by payment_date with the net share
--      allocated proportionally. An advance received in 2025 is therefore already
--      2025 income, which is exactly the Zuflussprinzip (§11 Abs. 1 EStG). Nothing
--      to fix; pinned by tests instead.
--
--    USt Istversteuerung (§13 Abs. 1 Nr. 1 lit. b UStG) — NO CHANGE NEEDED.
--      Output VAT is already recognised per payment_date at the invoice's VAT
--      ratio. An advance is taxed when received, which is what Ist means for every
--      receipt including advances. Nothing to fix; pinned by tests instead.
--
--    USt Sollversteuerung (§13 Abs. 1 Nr. 1 lit. a UStG) — CHANGED, AND IT HAD TO BE.
--      Satz 4 is the Mindest-Ist-Besteuerung: where the consideration, or part of
--      it, is received BEFORE the supply is performed, the VAT on that part arises
--      at the end of the pre-registration period in which it was received — not
--      with the later invoice. Leaving the Soll branch as a flat
--      sum(vat_total_cents) over the service-date period would have understated
--      the advance period and overstated the invoice period. That is a wrong
--      filing figure, so it is corrected here rather than shipped.
--
--      The correction is exact, not approximate:
--        * each advance's VAT share is round(amount * vat_total / gross_total)
--          and falls in the period it was RECEIVED;
--        * the invoice's service-date period gets the REMAINDER,
--          vat_total - sum(advance shares).
--      The two always add back to vat_total to the cent, whatever the rounding of
--      the individual shares. So VAT for an invoice is recognised exactly once:
--      never duplicated, never lost, never shifted out of the books.
--
--      With no advance_payment rows this is arithmetically identical to the
--      previous function — a sum over an empty set is zero and the remainder is the
--      full vat_total — which is why it is safe for every existing period.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_tax_period_inputs(p_entity uuid, p_from date, p_to date, p_vat_timing text)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare
  v_paid_rev_net bigint;
  v_paid_exp_net bigint;
  v_vat_output bigint;
  v_vat_advance bigint;
  v_vat_rc_output bigint;
  v_vat_input bigint;
  v_has_unlinked_income boolean;
  v_has_unresolved boolean;
  v_missing_service boolean;
  v_recurring_flag int;
  v_advance_count int := 0;
  v_timing text := coalesce(p_vat_timing, 'ist');
  v_filing_ready boolean;
  v_warnings jsonb := '[]'::jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null or p_from is null or p_to is null or p_from > p_to then raise exception 'valid entity and range required'; end if;

  -- EÜR cash: qualifying operating inflows/outflows by payment_date, proportional net
  -- allocation. Advances are ordinary receipts here and need no special case: they are
  -- income of the year they arrived, on the date they arrived.
  select coalesce(sum(case when p.invoice_id is not null and i.gross_total_cents > 0
      then round(p.amount_cents::numeric * i.net_total_cents / i.gross_total_cents) else p.amount_cents end), 0)
    into v_paid_rev_net
  from public.owner_payments p left join public.owner_invoices i on i.id = p.invoice_id
  where p.business_entity_id = p_entity and p.kind = 'income' and p.direction = 'inflow' and p.payment_date between p_from and p_to;

  select coalesce(sum(case when p.expense_id is not null and e.gross_total_cents > 0
      then round(p.amount_cents::numeric * e.deductible_net_cents / e.gross_total_cents) else p.amount_cents end), 0)
    into v_paid_exp_net
  from public.owner_payments p left join public.owner_expenses e on e.id = p.expense_id
  where p.business_entity_id = p_entity and p.kind = 'expense' and p.direction = 'outflow' and p.payment_date between p_from and p_to;

  -- Output VAT.
  if v_timing = 'soll' then
    -- (a) Invoices whose service date falls in this period, each reduced by the VAT
    --     already taxed on advances received against it (§13(1)(1)(a) S.4).
    select coalesce(sum(i.vat_total_cents - coalesce(adv.vat_cents, 0)), 0),
           bool_or(coalesce(i.service_date, i.service_period_end, i.service_period_start) is null)
      into v_vat_output, v_missing_service
    from public.owner_invoices i
    left join lateral (
      select coalesce(sum(round(p.amount_cents::numeric * i.vat_total_cents / i.gross_total_cents)), 0) as vat_cents
      from public.owner_payments p
      where p.invoice_id = i.id and p.direction = 'inflow'
        and p.payment_kind = 'advance_payment' and i.gross_total_cents > 0
    ) adv on true
    where i.business_entity_id = p_entity and i.status in ('issued', 'partially_paid', 'paid', 'overdue')
      and coalesce(i.service_date, i.service_period_end, i.service_period_start) between p_from and p_to;

    -- (b) Advances RECEIVED in this period, taxed now regardless of when their
    --     invoice's service date lands. Same status filter as (a), so an advance is
    --     included exactly when its remainder in (a) would be.
    select coalesce(sum(round(p.amount_cents::numeric * i.vat_total_cents / i.gross_total_cents)), 0), count(*)
      into v_vat_advance, v_advance_count
    from public.owner_payments p join public.owner_invoices i on i.id = p.invoice_id
    where p.business_entity_id = p_entity and p.direction = 'inflow'
      and p.payment_kind = 'advance_payment' and i.gross_total_cents > 0
      and i.status in ('issued', 'partially_paid', 'paid', 'overdue')
      and p.payment_date between p_from and p_to;

    v_vat_output := v_vat_output + v_vat_advance;

    v_missing_service := coalesce(v_missing_service, false)
      or exists (select 1 from public.owner_invoices i where i.business_entity_id = p_entity
        and i.status in ('issued', 'partially_paid', 'paid', 'overdue')
        and coalesce(i.service_date, i.service_period_end, i.service_period_start) is null
        and coalesce(i.issue_date, current_date) between p_from and p_to);
    v_has_unlinked_income := false;
  else
    -- ist: output VAT recognized on payments received, proportional to the invoice VAT
    -- ratio. Advances are ordinary receipts here — taxed on arrival, which is already
    -- the correct Ist treatment for them.
    select coalesce(sum(case when p.invoice_id is not null and i.gross_total_cents > 0
        then round(p.amount_cents::numeric * i.vat_total_cents / i.gross_total_cents) else 0 end), 0),
        bool_or(p.invoice_id is null)
      into v_vat_output, v_has_unlinked_income
    from public.owner_payments p left join public.owner_invoices i on i.id = p.invoice_id
    where p.business_entity_id = p_entity and p.kind = 'income' and p.direction = 'inflow' and p.payment_date between p_from and p_to;
    v_has_unlinked_income := coalesce(v_has_unlinked_income, false);
    v_missing_service := false;
    select count(*) into v_advance_count from public.owner_payments p
    where p.business_entity_id = p_entity and p.direction = 'inflow'
      and p.payment_kind = 'advance_payment' and p.payment_date between p_from and p_to;
  end if;

  -- Reverse-charge output liability and eligible input VAT are determined independently of the
  -- output-VAT timing mode (both by the expense document period).
  select coalesce(sum(reverse_charge_vat_cents), 0), coalesce(sum(input_vat_cents), 0),
      bool_or(review_status <> 'reviewed')
    into v_vat_rc_output, v_vat_input, v_has_unresolved
  from public.owner_expenses where business_entity_id = p_entity and payment_status <> 'void'
    and invoice_date between p_from and p_to;
  v_has_unresolved := coalesce(v_has_unresolved, false)
    or exists (select 1 from public.owner_invoice_lines l join public.owner_invoices i on i.id = l.invoice_id
      where i.business_entity_id = p_entity and l.vat_treatment = 'unknown'
        and coalesce(i.issue_date, current_date) between p_from and p_to);

  -- ±10-day recurring-payment flag (review-required; not auto-applied).
  select count(*) into v_recurring_flag from public.owner_payments
  where business_entity_id = p_entity and kind in ('income', 'expense')
    and (payment_date <= p_from + 10 or payment_date >= p_to - 10)
    and payment_date between p_from - 10 and p_to + 10;

  v_filing_ready := (not v_has_unresolved)
    and (case when v_timing = 'soll' then not v_missing_service else not v_has_unlinked_income end);
  if v_has_unresolved then v_warnings := v_warnings || to_jsonb('Nicht geprüfte USt-Behandlungen im Zeitraum.'::text); end if;
  if v_timing = 'ist' and v_has_unlinked_income then v_warnings := v_warnings || to_jsonb('Zahlungseingänge ohne Rechnungszuordnung – USt-Zuordnung unklar (Ist).'::text); end if;
  if v_timing = 'soll' and v_missing_service then v_warnings := v_warnings || to_jsonb('Rechnungen ohne Leistungsdatum – Soll-Versteuerung nicht abgabebereit.'::text); end if;
  if v_recurring_flag > 0 then v_warnings := v_warnings || to_jsonb((v_recurring_flag || ' Zahlung(en) nahe Jahreswechsel (§11 10-Tage-Regel) – manuell prüfen.')::text); end if;
  -- Advances are a named, reviewable fact rather than a silent adjustment: the owner is
  -- told the period contains them and on what basis they were treated.
  if v_advance_count > 0 then
    v_warnings := v_warnings || to_jsonb((v_advance_count || ' Anzahlung(en) vor Rechnungsstellung im Zeitraum – '
      || case when v_timing = 'soll'
              then 'nach Mindest-Ist-Besteuerung (§13 Abs. 1 Nr. 1 lit. a Satz 4 UStG) im Zahlungszeitraum versteuert'
              else 'im Zahlungszeitraum versteuert (Ist)' end
      || ' – bitte prüfen.')::text);
  end if;

  return jsonb_build_object(
    'vat_timing', v_timing,
    'paid_revenue_net_cents', v_paid_rev_net,
    'paid_expense_deductible_net_cents', v_paid_exp_net,
    'vat_output_cents', v_vat_output,
    'vat_reverse_charge_output_cents', v_vat_rc_output,
    'vat_input_cents', v_vat_input,
    'advance_payment_count', v_advance_count,
    'has_unlinked_income', v_has_unlinked_income,
    'has_unresolved_treatment', v_has_unresolved,
    'missing_service_date', v_missing_service,
    'recurring_flag_count', v_recurring_flag,
    'filing_ready', v_filing_ready,
    'warnings', v_warnings
  );
end;
$$;

commit;
