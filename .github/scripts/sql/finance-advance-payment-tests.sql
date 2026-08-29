-- Owner finance: ADVANCE payments (Anzahlungen) received before the final invoice.
--
-- These tests EXECUTE the real RPCs and the real tax function against the REAL historical
-- case that motivated the feature, then assert observed state. The tax assertions are the
-- point of the file: an advance-payment model that books revenue or VAT twice — or loses a
-- 2025 receipt into 2026 — is worse than no model at all, so every period is asserted
-- individually AND the periods are asserted to add back to the invoice totals exactly.
--
-- ON_ERROR_STOP=1 → any failed assertion aborts with a non-zero exit.

\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$
begin raise notice 'PASS: %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$
begin raise exception 'FAIL: %', msg; end $$;
create or replace function pg_temp.want(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then perform pg_temp.pass(msg); else perform pg_temp.fail(msg); end if; end $$;

select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('t.owner')::uuid;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);

-- Same stub as the multipay harness: if any finance path ever started enqueuing customer
-- mail, the insert would land here and the zero-jobs assertion at the end would catch it.
create table if not exists public.owner_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text, invoice_id uuid, offer_id uuid, recipient_email text,
  created_at timestamptz not null default now());

set session_replication_role = replica;
delete from public.owner_finance_import_records;
delete from public.owner_finance_import_batches;
delete from public.owner_revenue_contract_postings;
delete from public.owner_revenue_contract_lines;
delete from public.owner_revenue_contracts;
delete from public.owner_payments;
delete from public.owner_invoice_lines;
delete from public.owner_invoices;
delete from public.owner_invoice_counters;
delete from public.owner_finance_requests;
delete from public.owner_automation_jobs;
delete from public.owner_expenses;
set session_replication_role = origin;

insert into public.organizations (id, name, status, created_by)
  values ('66666666-6666-6666-6666-666666666666','Anzahlungskunde e.V.','active', current_setting('t.owner')::uuid)
  on conflict (id) do nothing;

select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

create or replace function pg_temp.header(p_issue text) returns jsonb language sql as $$
  select jsonb_build_object('business_entity_id',current_setting('t.entity'),
    'organization_id','66666666-6666-6666-6666-666666666666',
    'issue_date',p_issue,'service_date',p_issue,'currency','EUR') $$;
create or replace function pg_temp.body(p_net_cents bigint) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('description','Digitalisierung','quantity_milli',1000,
    'unit_price_cents',p_net_cents,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)) $$;

-- ---------------------------------------------------------------------------
-- 0. Backwards compatibility: a payment object with NO payment_kind still means
--    exactly what it meant before the column existed.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; inv record; v_kind text;
begin
  r := public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-01-10'), pg_temp.body(1000000),
    jsonb_build_array(jsonb_build_object('payment_date','2026-01-15','amount_cents',1190000,'method','bank_transfer')));
  select * into inv from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  select payment_kind into v_kind from public.owner_payments where invoice_id = inv.id;
  perform pg_temp.want(v_kind = 'invoice_payment', 'a payment with no payment_kind defaults to invoice_payment');
  perform pg_temp.want(inv.status = 'paid', 'the pre-existing single-full-payment behaviour is unchanged');
end $$;

-- ---------------------------------------------------------------------------
-- 1. THE REAL CASE. RE-2026-001, entered with its REAL dates and amounts.
--
--    issue 2026-02-28 · net 4.900,00 · USt 931,00 · brutto 5.831,00
--    Anzahlung 2025-10-23  1.960,00
--    Anzahlung 2025-11-12  1.960,00
--    Restzahlung 2026-06-02 1.911,00
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; inv record; v_adv int; v_ord int; v_min date;
begin
  r := public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-02-28') || jsonb_build_object('external_reference','RE-2026-001'),
    pg_temp.body(490000),
    jsonb_build_array(
      jsonb_build_object('payment_date','2025-10-23','amount_cents',196000,'method','bank_transfer',
                         'reference','Abschlagszahlung 1','payment_kind','advance_payment'),
      jsonb_build_object('payment_date','2025-11-12','amount_cents',196000,'method','bank_transfer',
                         'reference','Abschlagszahlung 2','payment_kind','advance_payment'),
      jsonb_build_object('payment_date','2026-06-02','amount_cents',191100,'method','bank_transfer',
                         'reference','Restzahlung','payment_kind','invoice_payment')));
  select * into inv from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  perform set_config('t.re001', inv.id::text, false);

  perform pg_temp.want(inv.net_total_cents   = 490000, 'RE-2026-001 net 4.900,00 (server-computed)');
  perform pg_temp.want(inv.vat_total_cents   =  93100, 'RE-2026-001 USt 931,00 (server-computed)');
  perform pg_temp.want(inv.gross_total_cents = 583100, 'RE-2026-001 brutto 5.831,00 (server-computed)');
  perform pg_temp.want(inv.amount_paid_cents = 583100, 'RE-2026-001 bezahlt 5.831,00 — advances count towards settlement');
  perform pg_temp.want(inv.gross_total_cents - inv.amount_paid_cents = 0, 'RE-2026-001 offen 0,00');
  perform pg_temp.want(inv.status = 'paid', 'RE-2026-001 is fully paid (status ' || inv.status || ')');
  perform pg_temp.want(inv.issue_date = date '2026-02-28', 'the invoice date was NOT backdated to reach the advances');

  select count(*) filter (where payment_kind = 'advance_payment'),
         count(*) filter (where payment_kind = 'invoice_payment'),
         min(payment_date)
    into v_adv, v_ord, v_min
  from public.owner_payments where invoice_id = inv.id;
  perform pg_temp.want(v_adv = 2, 'exactly the two Abschlagszahlungen are advance_payment');
  perform pg_temp.want(v_ord = 1, 'the Restzahlung stayed an ordinary invoice_payment');
  perform pg_temp.want(v_min = date '2025-10-23', 'the first advance kept its REAL date 23.10.2025 — nothing was moved');
  perform pg_temp.want(
    (select count(*) from public.owner_payments where invoice_id = inv.id
      and (payment_date, amount_cents) in ((date '2025-10-23',196000),(date '2025-11-12',196000),(date '2026-06-02',191100))) = 3,
    'all three receipts kept their real date AND their real amount');
end $$;

-- ---------------------------------------------------------------------------
-- 2. The invariant: the two kinds are DISJOINT, and neither can be used to
--    smuggle the other past its rule.
-- ---------------------------------------------------------------------------
do $$
begin
  -- An ordinary payment still cannot predate the invoice.
  begin
    perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
      pg_temp.header('2026-02-28'), pg_temp.body(490000),
      jsonb_build_array(jsonb_build_object('payment_date','2025-10-23','amount_cents',196000)));
    perform pg_temp.fail('an undeclared pre-invoice payment was accepted');
  exception when others then
    perform pg_temp.want(sqlerrm like '%must not be before issue_date%',
      'an ordinary payment before the invoice date is still refused');
  end;

  -- An advance must genuinely BE an advance.
  begin
    perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
      pg_temp.header('2026-02-28'), pg_temp.body(490000),
      jsonb_build_array(jsonb_build_object('payment_date','2026-03-15','amount_cents',196000,'payment_kind','advance_payment')));
    perform pg_temp.fail('a post-invoice receipt was accepted as an advance');
  exception when others then
    perform pg_temp.want(sqlerrm like '%not before the invoice date%',
      'a receipt on or after the invoice date cannot be labelled an advance');
  end;

  -- Unknown kinds are refused rather than silently coerced.
  begin
    perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
      pg_temp.header('2026-02-28'), pg_temp.body(490000),
      jsonb_build_array(jsonb_build_object('payment_date','2026-03-15','amount_cents',196000,'payment_kind','prepayment')));
    perform pg_temp.fail('an unknown payment_kind was accepted');
  exception when others then
    perform pg_temp.want(sqlerrm like '%unsupported payment_kind%', 'an unknown payment_kind is refused');
  end;
end $$;

-- The trigger — not just the RPC — is the canonical enforcement point, so a direct
-- table write cannot bypass the rule either.
do $$
declare v_entity uuid := current_setting('t.entity')::uuid; v_inv uuid := current_setting('t.re001')::uuid;
begin
  begin
    insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents, invoice_id)
    values (v_entity, 'income', 'inflow', date '2026-01-01', 100, v_inv);
    perform pg_temp.fail('a direct pre-invoice insert bypassed the trigger');
  exception when others then
    perform pg_temp.want(sqlerrm like '%must not be before issue_date%' or sqlerrm like '%exceed the invoice gross%',
      'the trigger refuses a direct undeclared pre-invoice insert');
  end;
  begin
    insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents, payment_kind)
    values (v_entity, 'income', 'inflow', date '2026-01-01', 100, 'advance_payment');
    perform pg_temp.fail('an unattached advance was accepted');
  exception when others then
    perform pg_temp.want(sqlerrm like '%must be linked to an invoice%',
      'an advance with no invoice is refused — this is not a credit-balance feature');
  end;
end $$;

-- Overpayment stays impossible however the receipts are split across the two kinds.
do $$
begin
  begin
    perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
      pg_temp.header('2026-02-28'), pg_temp.body(490000),
      jsonb_build_array(
        jsonb_build_object('payment_date','2025-10-23','amount_cents',400000,'payment_kind','advance_payment'),
        jsonb_build_object('payment_date','2025-11-12','amount_cents',400000,'payment_kind','advance_payment')));
    perform pg_temp.fail('advances were allowed to overpay the invoice');
  exception when others then
    perform pg_temp.want(sqlerrm like '%exceed the invoice gross%',
      'advances cannot settle more than the invoice gross');
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 3. TAX. The hard gate.
--
--    Expected per-payment shares for RE-2026-001 (round(amount * part / gross)):
--      2025-10-23  net 164.706  USt 31.294
--      2025-11-12  net 164.706  USt 31.294
--      2026-06-02  net 160.588  USt 30.512
--    Net shares sum to 490.000, VAT shares to 93.100 — exactly the invoice totals.
-- ---------------------------------------------------------------------------

-- Isolate RE-2026-001: the compatibility invoice from block 0 would otherwise be mixed in.
--
-- Harness teardown, not a product path: these rows are ISSUED, and since
-- 20260831120000_owner_invoice_integrity_guard.sql an issued invoice and its lines can no
-- longer be deleted by ANY caller — that is the invariant the guard exists for. The suite
-- therefore drops them the same way its own wipe at the top of this file does: with triggers
-- off, a superuser-only, explicitly-scoped teardown mechanism. Nothing asserted below changes.
do $$ begin
  set session_replication_role = replica;
  delete from public.owner_payments where invoice_id <> current_setting('t.re001')::uuid;
  delete from public.owner_invoice_lines where invoice_id <> current_setting('t.re001')::uuid;
  delete from public.owner_invoices where id <> current_setting('t.re001')::uuid;
  set session_replication_role = origin;
end $$;

-- EÜR (cash basis): real receipts stay on their real dates.
do $$
declare q4_2025 jsonb; q1_2026 jsonb; q2_2026 jsonb; y2025 jsonb; y2026 jsonb; v_entity uuid := current_setting('t.entity')::uuid;
begin
  q4_2025 := public.owner_tax_period_inputs(v_entity, '2025-10-01','2025-12-31','ist');
  q1_2026 := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-03-31','ist');
  q2_2026 := public.owner_tax_period_inputs(v_entity, '2026-04-01','2026-06-30','ist');
  y2025   := public.owner_tax_period_inputs(v_entity, '2025-01-01','2025-12-31','ist');
  y2026   := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-12-31','ist');

  perform pg_temp.want((q4_2025->>'paid_revenue_net_cents')::bigint = 329412,
    'EÜR Q4/2025: both advances are 2025 income (329.412 = 164.706 x 2) — §11 Zuflussprinzip');
  perform pg_temp.want((q1_2026->>'paid_revenue_net_cents')::bigint = 0,
    'EÜR Q1/2026: issuing the invoice alone creates NO cash-basis income');
  perform pg_temp.want((q2_2026->>'paid_revenue_net_cents')::bigint = 160588,
    'EÜR Q2/2026: only the Restzahlung lands here (160.588)');
  perform pg_temp.want(
    (y2025->>'paid_revenue_net_cents')::bigint + (y2026->>'paid_revenue_net_cents')::bigint = 490000,
    'EÜR 2025 + 2026 = 490.000 exactly: no receipt duplicated, none lost');
  perform pg_temp.want((y2025->>'paid_revenue_net_cents')::bigint = 329412,
    'the 2025 receipts were NOT pulled forward into 2026');
end $$;

-- USt Istversteuerung: VAT follows the money, advances included.
do $$
declare q4_2025 jsonb; q1_2026 jsonb; q2_2026 jsonb; y2025 jsonb; y2026 jsonb; v_entity uuid := current_setting('t.entity')::uuid;
begin
  q4_2025 := public.owner_tax_period_inputs(v_entity, '2025-10-01','2025-12-31','ist');
  q1_2026 := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-03-31','ist');
  q2_2026 := public.owner_tax_period_inputs(v_entity, '2026-04-01','2026-06-30','ist');
  y2025   := public.owner_tax_period_inputs(v_entity, '2025-01-01','2025-12-31','ist');
  y2026   := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-12-31','ist');

  perform pg_temp.want((q4_2025->>'vat_output_cents')::bigint = 62588, 'USt Ist Q4/2025: 31.294 x 2 on the advances');
  perform pg_temp.want((q1_2026->>'vat_output_cents')::bigint = 0,     'USt Ist Q1/2026: no receipt, no USt');
  perform pg_temp.want((q2_2026->>'vat_output_cents')::bigint = 30512, 'USt Ist Q2/2026: 30.512 on the Restzahlung');
  perform pg_temp.want((y2025->>'vat_output_cents')::bigint + (y2026->>'vat_output_cents')::bigint = 93100,
    'USt Ist total = 93.100 exactly — the invoice VAT, recognised once');
  perform pg_temp.want((q4_2025->>'advance_payment_count')::int = 2,
    'the Ist period reports its 2 Anzahlungen rather than adjusting silently');
  perform pg_temp.want((q4_2025->'warnings')::text like '%Anzahlung%',
    'the owner is warned that the period contains Anzahlungen');
end $$;

-- USt Sollversteuerung: Mindest-Ist-Besteuerung (§13 Abs. 1 Nr. 1 lit. a Satz 4 UStG).
-- The advances are taxed when RECEIVED; the invoice period gets only the remainder.
do $$
declare q4_2025 jsonb; q1_2026 jsonb; q2_2026 jsonb; y2025 jsonb; y2026 jsonb; v_entity uuid := current_setting('t.entity')::uuid;
begin
  q4_2025 := public.owner_tax_period_inputs(v_entity, '2025-10-01','2025-12-31','soll');
  q1_2026 := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-03-31','soll');
  q2_2026 := public.owner_tax_period_inputs(v_entity, '2026-04-01','2026-06-30','soll');
  y2025   := public.owner_tax_period_inputs(v_entity, '2025-01-01','2025-12-31','soll');
  y2026   := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-12-31','soll');

  perform pg_temp.want((q4_2025->>'vat_output_cents')::bigint = 62588,
    'USt Soll Q4/2025: the advances are taxed on receipt (Mindest-Ist), not deferred to the invoice');
  perform pg_temp.want((q1_2026->>'vat_output_cents')::bigint = 30512,
    'USt Soll Q1/2026: the Leistungsdatum period gets only the REMAINING 30.512, not the full 93.100');
  perform pg_temp.want((q2_2026->>'vat_output_cents')::bigint = 0,
    'USt Soll Q2/2026: the Restzahlung does not create a second Soll liability');
  perform pg_temp.want((y2025->>'vat_output_cents')::bigint + (y2026->>'vat_output_cents')::bigint = 93100,
    'USt Soll total = 93.100 exactly — never 155.688 (double-counted) and never 30.512 (lost)');
  perform pg_temp.want((q1_2026->>'advance_payment_count')::int = 0,
    'the advance count is per period, not per invoice');
end $$;

-- The no-op proof: with the advances RELABELLED as ordinary payments the Soll figure
-- collapses back to the pre-feature behaviour, so the new branch changes nothing for
-- data that contains no advances.
do $$
declare q1_2026 jsonb; v_entity uuid := current_setting('t.entity')::uuid;
begin
  -- Move the invoice date back so ordinary payments are legal, then relabel.
  --
  -- Re-dating an ISSUED invoice is exactly what 20260831120000_owner_invoice_integrity_guard.sql
  -- forbids for every caller, database owner included. This is harness scaffolding for a tax
  -- calculation, not a product path, so it is done with triggers off — the same superuser-only
  -- teardown mechanism this file already uses for its wipes. The row is restored below and no
  -- assertion changes.
  set session_replication_role = replica;
  update public.owner_invoices set issue_date = date '2025-01-01' where id = current_setting('t.re001')::uuid;
  set session_replication_role = origin;
  update public.owner_payments set payment_kind = 'invoice_payment' where invoice_id = current_setting('t.re001')::uuid;
  q1_2026 := public.owner_tax_period_inputs(v_entity, '2026-01-01','2026-03-31','soll');
  perform pg_temp.want((q1_2026->>'vat_output_cents')::bigint = 93100,
    'with ZERO advance rows the Soll branch returns the full invoice VAT, exactly as before this feature');
  perform pg_temp.want((q1_2026->>'advance_payment_count')::int = 0, 'and reports no advances');
  -- Restore (same reason, same mechanism).
  set session_replication_role = replica;
  update public.owner_invoices set issue_date = date '2026-02-28' where id = current_setting('t.re001')::uuid;
  set session_replication_role = origin;
  update public.owner_payments set payment_kind = 'advance_payment'
    where invoice_id = current_setting('t.re001')::uuid and payment_date < date '2026-02-28';
end $$;

-- ---------------------------------------------------------------------------
-- 4. BULK IMPORT: the whole real batch RE-2026-001 … RE-2026-004, atomically.
-- ---------------------------------------------------------------------------
do $$ begin
  set session_replication_role = replica;
  delete from public.owner_payments;
  delete from public.owner_invoice_lines;
  delete from public.owner_invoices;
  delete from public.owner_finance_import_records;
  delete from public.owner_finance_import_batches;
  set session_replication_role = origin;
end $$;

create or replace function pg_temp.real_batch(p_prefix text) returns jsonb language sql as $$
  select jsonb_build_object(
    'schema_version', 1,
    'business_entity_id', current_setting('t.entity'),
    'source', 'test',
    'invoices', jsonb_build_array(
      jsonb_build_object('client_import_id', p_prefix || 'RE-2026-001',
        'customer', jsonb_build_object('organization_id','66666666-6666-6666-6666-666666666666'),
        'issue_date','2026-02-28','service_date','2026-02-28',
        'lines', pg_temp.body(490000),
        'payments', jsonb_build_array(
          jsonb_build_object('payment_date','2025-10-23','amount_cents',196000,'reference','Abschlagszahlung 1','payment_kind','advance_payment'),
          jsonb_build_object('payment_date','2025-11-12','amount_cents',196000,'reference','Abschlagszahlung 2','payment_kind','advance_payment'),
          jsonb_build_object('payment_date','2026-06-02','amount_cents',191100,'reference','Restzahlung'))),
      jsonb_build_object('client_import_id', p_prefix || 'RE-2026-002',
        'customer', jsonb_build_object('organization_id','66666666-6666-6666-6666-666666666666'),
        'issue_date','2026-02-28','service_date','2026-02-28',
        'lines', pg_temp.body(160000),
        'payments', jsonb_build_array(jsonb_build_object('payment_date','2026-06-02','amount_cents',190400))),
      jsonb_build_object('client_import_id', p_prefix || 'RE-2026-003',
        'customer', jsonb_build_object('organization_id','66666666-6666-6666-6666-666666666666'),
        'issue_date','2026-02-28','service_date','2026-02-28',
        'lines', pg_temp.body(210000),
        'payments', jsonb_build_array(jsonb_build_object('payment_date','2026-03-02','amount_cents',124950))),
      jsonb_build_object('client_import_id', p_prefix || 'RE-2026-004',
        'customer', jsonb_build_object('organization_id','66666666-6666-6666-6666-666666666666'),
        'issue_date','2026-02-28','service_date','2026-02-28',
        'lines', pg_temp.body(329000),
        'payments', jsonb_build_array(
          jsonb_build_object('payment_date','2026-03-02','amount_cents',195755),
          jsonb_build_object('payment_date','2026-05-04','amount_cents',195755)))))
$$;

do $$
declare r jsonb; v_gross bigint; v_paid bigint; v_open bigint; v_adv int;
begin
  r := public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.real_batch(''));
  perform pg_temp.want((r->>'invoice_count')::int = 4, 'all four historical invoices imported');
  perform pg_temp.want((r->>'payment_count')::int = 7, 'all seven receipts imported (2 advances + 5 ordinary)');

  select sum(gross_total_cents), sum(amount_paid_cents), sum(gross_total_cents - amount_paid_cents)
    into v_gross, v_paid, v_open from public.owner_invoices;
  perform pg_temp.want(v_gross = 1414910, 'control total brutto 14.149,10');
  perform pg_temp.want(v_paid  = 1289960, 'control total tatsächlich erhalten 12.899,60');
  perform pg_temp.want(v_open  =  124950, 'control total offen 1.249,50');

  select count(*) into v_adv from public.owner_payments where payment_kind = 'advance_payment';
  perform pg_temp.want(v_adv = 2, 'exactly the two Abschlagszahlungen are advances; a payload without the field is unaffected');

  perform pg_temp.want((select status from public.owner_invoices where net_total_cents = 490000) = 'paid',   'RE-2026-001 → bezahlt');
  perform pg_temp.want((select status from public.owner_invoices where net_total_cents = 160000) = 'paid',   'RE-2026-002 → bezahlt');
  perform pg_temp.want((select status from public.owner_invoices where net_total_cents = 210000) = 'partially_paid', 'RE-2026-003 → teilbezahlt');
  perform pg_temp.want((select status from public.owner_invoices where net_total_cents = 329000) = 'paid',   'RE-2026-004 → bezahlt');
end $$;

-- Atomic rollback: one bad advance kills the WHOLE batch, leaving nothing behind.
do $$
declare v_before int; v_after int; v_bad jsonb;
begin
  select count(*) into v_before from public.owner_invoices;
  v_bad := jsonb_set(pg_temp.real_batch('ROLLBACK-'),
    '{invoices,1,payments,0,payment_kind}', to_jsonb('advance_payment'::text));  -- dated AFTER the invoice
  begin
    perform public.owner_bulk_import_finance(gen_random_uuid(), v_bad);
    perform pg_temp.fail('a batch with an invalid advance was imported');
  exception when others then
    perform pg_temp.want(sqlerrm like '%not before the invoice date%', 'the bad row aborted the batch');
  end;
  select count(*) into v_after from public.owner_invoices;
  perform pg_temp.want(v_before = v_after,
    'nothing from the failed batch survived — the three good invoices rolled back with the bad one');
end $$;

-- Duplicate protection across batches still holds with advances in the payload.
do $$
declare v_before int; v_after int;
begin
  select count(*) into v_before from public.owner_invoices;
  begin
    perform public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.real_batch(''));
    perform pg_temp.fail('the same batch was imported twice');
  exception when others then perform pg_temp.want(true, 'a re-imported client_import_id is refused'); end;
  select count(*) into v_after from public.owner_invoices;
  perform pg_temp.want(v_before = v_after, 'the duplicate batch created no invoices');
end $$;

-- ---------------------------------------------------------------------------
-- 5. Customer resolution still works — the RPC the browser reported as
--    "[object Object]" is called here for real.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb;
begin
  r := public.owner_resolve_import_customers(current_setting('t.entity')::uuid,
        jsonb_build_array('Anzahlungskunde e.V.','Gibt Es Nicht'));
  perform pg_temp.want((r->0->>'organization_id') is not null, 'a unique customer name resolves to an id');
  perform pg_temp.want((r->1->>'match_count')::int = 0, 'an unknown name matches nothing');
end $$;

-- ---------------------------------------------------------------------------
-- 6. Nothing here can reach a customer.
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.want((select count(*) from public.owner_automation_jobs) = 0,
    'after advances, imports and tax reads: ZERO automation jobs — no mail path exists');
end $$;

-- ---------------------------------------------------------------------------
-- 7. Authorization.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '', false);
do $$
begin
  begin perform public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2025-01-01','2025-12-31','soll');
    perform pg_temp.fail('anon read tax period inputs');
  exception when others then perform pg_temp.want(sqlerrm like '%Owner access required%', 'anon cannot read tax inputs'); end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);

do $$ begin raise notice '--- finance ADVANCE PAYMENT SQL tests: ALL ASSERTIONS PASSED ---'; end $$;
