-- Owner finance: multi-payment invoices, recurring REVENUE contracts, bulk import.
--
-- These tests EXECUTE every new RPC. That is deliberate: the offer-engagement feature
-- shipped with source-parsing tests that passed against a function which failed on its
-- first real call, so this suite calls everything and asserts observed state.
--
-- Covered: one/three/two-payment invoices, overpayment rejection, quarter-crossing
-- revenue and VAT (Ist and Soll), contract forecast NOT counting as revenue, deliberate
-- month posting, duplicate-period refusal, 10-invoice bulk import, atomic rollback on a
-- bad row, cross-batch duplicate protection, and — throughout — that owner_automation_jobs
-- stays empty so no customer email can exist.
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

-- Auth follows the REAL phase0 is_platform_owner(): profiles.platform_role + auth.uid().
-- The owner/non-owner switch is therefore a jwt claim, exactly as in production.
select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('t.owner')::uuid;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);

-- owner_automation_jobs belongs to the OFFER chain, which this finance harness does not
-- apply. A stub is created so the "no automation job was inserted" assertion is REAL: if any
-- finance function ever started enqueuing one, the insert would land here and be caught.
create table if not exists public.owner_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text,
  invoice_id uuid,
  offer_id uuid,
  recipient_email text,
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
set session_replication_role = origin;

insert into public.organizations (id, name, status, created_by)
  values ('33333333-3333-3333-3333-333333333333','Eindeutig GmbH','active', current_setting('t.owner')::uuid)
  on conflict (id) do nothing;

-- The finance-cockpit migration seeds this entity; reuse it rather than inventing one.
select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

-- A reusable 10.000,00 € net / 19% = 11.900,00 € gross invoice body.
create or replace function pg_temp.body() returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('description','Digitalisierung','quantity_milli',1000,
    'unit_price_cents',1000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)) $$;
create or replace function pg_temp.header(p_issue text) returns jsonb language sql as $$
  select jsonb_build_object('business_entity_id',current_setting('t.entity'),
    'organization_id','33333333-3333-3333-3333-333333333333',
    'issue_date',p_issue,'service_date',p_issue,'currency','EUR') $$;

-- ---------------------------------------------------------------------------
-- 1. ONE invoice, ONE payment → paid.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; inv record;
begin
  r := public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-01-10'), pg_temp.body(),
    jsonb_build_array(jsonb_build_object('payment_date','2026-01-15','amount_cents',1190000,'method','bank_transfer','reference','Vollzahlung')));
  select * into inv from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  perform pg_temp.want(inv.gross_total_cents = 1190000, 'server computed gross 11.900,00 from the lines');
  perform pg_temp.want(inv.net_total_cents = 1000000, 'server computed net 10.000,00');
  perform pg_temp.want(inv.vat_total_cents = 190000, 'server computed VAT 1.900,00');
  perform pg_temp.want(inv.status = 'paid', 'single full payment settles the invoice (status ' || inv.status || ')');
  perform pg_temp.want(inv.amount_paid_cents = 1190000, 'amount_paid equals gross');
  perform pg_temp.want(inv.invoice_number like 'RE-2026-%', 'canonical invoice number was server-generated: ' || inv.invoice_number);
end $$;

-- ---------------------------------------------------------------------------
-- 2. ONE invoice, THREE payments → fully paid. The instalment case.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; inv record; v_count int;
begin
  r := public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-01-10'), pg_temp.body(),
    jsonb_build_array(
      jsonb_build_object('payment_date','2026-01-15','amount_cents',300000,'reference','Abschlag 1'),
      jsonb_build_object('payment_date','2026-02-15','amount_cents',400000,'reference','Abschlag 2'),
      jsonb_build_object('payment_date','2026-03-15','amount_cents',490000,'reference','Restzahlung')));
  select * into inv from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  select count(*) into v_count from public.owner_payments where invoice_id = inv.id;
  perform pg_temp.want(v_count = 3, 'three distinct payment rows exist (got ' || v_count || ')');
  perform pg_temp.want(inv.amount_paid_cents = 1190000, '3.000 + 4.000 + 4.900 = 11.900 paid');
  perform pg_temp.want(inv.status = 'paid', 'the sum settles the invoice → paid');
  perform pg_temp.want((select count(distinct payment_date) from public.owner_payments where invoice_id = inv.id) = 3,
    'each payment kept its OWN date — they were not collapsed into one synthetic payment');
  perform set_config('t.three_pay_invoice', inv.id::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- 3. ONE invoice, TWO payments → partially_paid, with the right open balance.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; inv record;
begin
  r := public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-01-10'), pg_temp.body(),
    jsonb_build_array(
      jsonb_build_object('payment_date','2026-01-15','amount_cents',300000),
      jsonb_build_object('payment_date','2026-02-15','amount_cents',400000)));
  select * into inv from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  perform pg_temp.want(inv.status = 'partially_paid', 'partial sum → partially_paid (got ' || inv.status || ')');
  perform pg_temp.want(inv.amount_paid_cents = 700000, 'paid 7.000,00');
  perform pg_temp.want((r->>'open_cents')::bigint = 490000, 'open balance 4.900,00');
  perform set_config('t.partial_invoice', inv.id::text, false);
end $$;

-- ...and a later settlement flips it to paid without touching anything else.
do $$
declare r jsonb; inv record;
begin
  r := public.owner_add_invoice_payment(gen_random_uuid(), current_setting('t.partial_invoice')::uuid,
        jsonb_build_object('payment_date','2026-03-15','amount_cents',490000,'reference','Restzahlung'));
  select * into inv from public.owner_invoices where id = current_setting('t.partial_invoice')::uuid;
  perform pg_temp.want(inv.status = 'paid', 'a later payment settles the invoice → paid');
  perform pg_temp.want((r->>'open_cents')::bigint = 0, 'open balance is now zero');
  perform pg_temp.want((select count(*) from public.owner_payments where invoice_id = inv.id) = 3,
    'the settlement is a THIRD payment row, not an edit of an existing one (append-only)');
end $$;

-- ---------------------------------------------------------------------------
-- 4. OVERPAYMENT is rejected — in the batch path and on a later single payment.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
      pg_temp.header('2026-01-10'), pg_temp.body(),
      jsonb_build_array(
        jsonb_build_object('payment_date','2026-01-15','amount_cents',1000000),
        jsonb_build_object('payment_date','2026-02-15','amount_cents',500000)));
    perform pg_temp.fail('an overpaying payment set was accepted');
  exception when others then
    perform pg_temp.want(sqlerrm like '%exceed%', 'overpayment in one batch is rejected: ' || sqlerrm);
  end;
end $$;

do $$
begin
  begin
    perform public.owner_add_invoice_payment(gen_random_uuid(), current_setting('t.three_pay_invoice')::uuid,
      jsonb_build_object('payment_date','2026-04-15','amount_cents',1));
    perform pg_temp.fail('a payment beyond gross was accepted on a settled invoice');
  exception when others then
    perform pg_temp.want(sqlerrm like '%exceed%', 'a further payment on a settled invoice is rejected: ' || sqlerrm);
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 4b. LEGACY OVERPAYMENT REPAIR.
--
-- An invoice recorded before the overpayment guard existed may already overpay. The
-- guard must not strand it: metadata has to stay editable and the amount has to be
-- reducible, or the owner can never correct their own books. New overpayment stays
-- blocked in every direction.
--
-- The fixture disables the validate trigger for exactly one INSERT to reproduce a row
-- that predates the guard. That is the only way to create the legacy state now that the
-- guard exists — which is itself the point of the test.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; v_inv uuid; inv record;
begin
  r := public.record_owner_historical_paid_invoice(gen_random_uuid(),
    pg_temp.header('2026-12-01'), pg_temp.body(),
    jsonb_build_object('payment_date','2026-12-02','method','bank_transfer'));
  v_inv := (r->>'invoice_id')::uuid;
  perform set_config('t.legacy', v_inv::text, false);

  alter table public.owner_payments disable trigger owner_payments_validate;
  insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents, invoice_id, notes)
  select i.business_entity_id, 'income', 'inflow', '2026-12-03', 5000, v_inv, 'Altbestand: Ueberzahlung'
  from public.owner_invoices i where i.id = v_inv;
  alter table public.owner_payments enable trigger owner_payments_validate;

  select * into inv from public.owner_invoices where id = v_inv;
  perform pg_temp.want(inv.amount_paid_cents > inv.gross_total_cents,
    'fixture: the invoice is now overpaid, as legacy data can be (' || inv.amount_paid_cents || ' > ' || inv.gross_total_cents || ')');
end $$;

do $$
begin
  update public.owner_payments set notes = 'Korrigierter Hinweis'
   where invoice_id = current_setting('t.legacy')::uuid and amount_cents = 5000;
  perform pg_temp.pass('METADATA-only edit on an already-overpaid invoice is allowed (repair is possible)');
exception when others then
  perform pg_temp.fail('metadata edit on a legacy overpaid invoice was blocked: ' || sqlerrm);
end $$;

do $$
begin
  -- Still above gross afterwards, but LOWER than before: this is repair, so it passes.
  update public.owner_payments set amount_cents = 500
   where invoice_id = current_setting('t.legacy')::uuid and amount_cents = 5000;
  perform pg_temp.pass('REDUCING an overpaying amount is allowed even while still above gross');
exception when others then
  perform pg_temp.fail('reducing a legacy overpayment was blocked: ' || sqlerrm);
end $$;

do $$
begin
  update public.owner_payments set amount_cents = 9000
   where invoice_id = current_setting('t.legacy')::uuid and amount_cents = 500;
  perform pg_temp.fail('an UPDATE was allowed to INCREASE the overpayment');
exception when others then
  perform pg_temp.want(sqlerrm like '%exceed%',
    'INCREASING an existing overpayment is still refused: ' || sqlerrm);
end $$;

do $$
declare inv record;
begin
  -- Fully repair it: delete the stray row and confirm the invoice lands back on 'paid'.
  delete from public.owner_payments
   where invoice_id = current_setting('t.legacy')::uuid and amount_cents = 500;
  select * into inv from public.owner_invoices where id = current_setting('t.legacy')::uuid;
  perform pg_temp.want(inv.amount_paid_cents = inv.gross_total_cents and inv.status = 'paid',
    'a legacy overpayment can be fully repaired back to exactly paid (status ' || inv.status || ')');
end $$;

do $$
begin
  -- And once repaired, the invoice behaves like any other: no new overpayment.
  perform public.owner_add_invoice_payment(gen_random_uuid(), current_setting('t.legacy')::uuid,
    jsonb_build_object('payment_date','2026-12-10','amount_cents',1));
  perform pg_temp.fail('a NEW overpayment was accepted after repair');
exception when others then
  perform pg_temp.want(sqlerrm like '%exceed%', 'after repair, a new overpayment is refused again: ' || sqlerrm);
end $$;

-- A payment settling an invoice may not predate it. Genuine ADVANCE payments are a
-- separate accounting model; this check is intentionally not relaxed.
do $$
begin
  begin
    perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
      pg_temp.header('2026-05-10'), pg_temp.body(),
      jsonb_build_array(jsonb_build_object('payment_date','2026-04-01','amount_cents',100000)));
    perform pg_temp.fail('a payment dated before the invoice was accepted');
  exception when others then
    perform pg_temp.want(sqlerrm like '%before issue_date%', 'pre-invoice payment date is rejected: ' || sqlerrm);
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 5. TAX: payments crossing quarters land in the RIGHT quarter, once each.
--    owner_tax_period_inputs allocates net and VAT proportionally by payment_date;
--    this proves that behaviour rather than reimplementing it.
-- ---------------------------------------------------------------------------
do $$
declare q1 jsonb; q2 jsonb; q3 jsonb; yr jsonb;
begin
  -- Only the three-payment invoice (Q1 3.000, Q1 4.000, Q1 4.900) plus the partial
  -- one exist; rebuild a clean single-invoice world for an unambiguous assertion.
  set session_replication_role = replica;
  delete from public.owner_payments; delete from public.owner_invoice_lines; delete from public.owner_invoices;
  set session_replication_role = origin;

  perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-01-10'), pg_temp.body(),
    jsonb_build_array(
      jsonb_build_object('payment_date','2026-02-15','amount_cents',300000),   -- Q1
      jsonb_build_object('payment_date','2026-05-15','amount_cents',400000),   -- Q2
      jsonb_build_object('payment_date','2026-08-15','amount_cents',490000))); -- Q3

  q1 := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-01-01','2026-03-31','ist');
  q2 := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-04-01','2026-06-30','ist');
  q3 := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-07-01','2026-09-30','ist');
  yr := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-01-01','2026-12-31','ist');

  -- Net is allocated pro rata: 3.000/11.900 of 10.000 = 2.521,01 etc.
  perform pg_temp.want((q1->>'paid_revenue_net_cents')::bigint = 252101, 'Q1 EÜR revenue is only the Q1 payment (2.521,01)');
  perform pg_temp.want((q2->>'paid_revenue_net_cents')::bigint = 336134, 'Q2 EÜR revenue is only the Q2 payment (3.361,34)');
  perform pg_temp.want((q3->>'paid_revenue_net_cents')::bigint = 411765, 'Q3 EÜR revenue is only the Q3 payment (4.117,65)');
  perform pg_temp.want(
    (q1->>'paid_revenue_net_cents')::bigint + (q2->>'paid_revenue_net_cents')::bigint + (q3->>'paid_revenue_net_cents')::bigint = 1000000,
    'the three quarters sum EXACTLY to the invoice net — no revenue lost, none double-counted');
  perform pg_temp.want((yr->>'paid_revenue_net_cents')::bigint = 1000000,
    'the annual figure equals the invoice net, not three times it');

  -- Ist VAT follows the payments too.
  perform pg_temp.want((q1->>'vat_output_cents')::bigint = 47899, 'Q1 Ist output VAT is only the Q1 share');
  perform pg_temp.want(
    (q1->>'vat_output_cents')::bigint + (q2->>'vat_output_cents')::bigint + (q3->>'vat_output_cents')::bigint = 190000,
    'Ist output VAT across the quarters sums exactly to the invoice VAT');
end $$;

-- Soll timing recognises the whole invoice in its SERVICE period, independent of payments.
do $$
declare q1 jsonb; q2 jsonb;
begin
  q1 := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-01-01','2026-03-31','soll');
  q2 := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-04-01','2026-06-30','soll');
  perform pg_temp.want((q1->>'vat_output_cents')::bigint = 190000,
    'Soll: the full invoice VAT falls in the service quarter regardless of instalments');
  perform pg_temp.want((q2->>'vat_output_cents')::bigint = 0,
    'Soll: later instalments do NOT add VAT again in a later quarter');
end $$;

-- Two payments in the SAME quarter aggregate rather than duplicating the invoice.
do $$
declare q4 jsonb;
begin
  perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(),
    pg_temp.header('2026-10-05'), pg_temp.body(),
    jsonb_build_array(
      jsonb_build_object('payment_date','2026-10-15','amount_cents',600000),
      jsonb_build_object('payment_date','2026-11-15','amount_cents',590000)));
  q4 := public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-10-01','2026-12-31','ist');
  perform pg_temp.want((q4->>'paid_revenue_net_cents')::bigint = 1000000,
    'two payments in one quarter sum to ONE invoice net, not two (got ' || (q4->>'paid_revenue_net_cents') || ')');
end $$;

-- ---------------------------------------------------------------------------
-- 6. RECURRING CONTRACTS are a FORECAST and must never become revenue by themselves.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; ov jsonb; before_rev bigint; after_rev bigint;
begin
  select (public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-01-01','2026-12-31','ist')->>'paid_revenue_net_cents')::bigint
    into before_rev;

  r := public.owner_create_revenue_contract(gen_random_uuid(),
    jsonb_build_object('business_entity_id',current_setting('t.entity'),
      'organization_id','33333333-3333-3333-3333-333333333333',
      'name','Monatliche Betreuung','start_date','2026-01-01','billing_frequency','monthly','billing_day',1),
    jsonb_build_array(jsonb_build_object('description','Monatliche Betreuung','quantity_milli',1000,
      'unit_price_cents',50000,'vat_rate_bp',1900,'vat_treatment','standard')));
  perform pg_temp.want((r->>'expected_net_cents')::bigint = 50000, 'contract expected net is 500,00 / month');
  perform pg_temp.want((r->>'expected_gross_cents')::bigint = 59500, 'contract expected gross is 595,00 / month');
  perform set_config('t.contract', (r->>'contract_id'), false);

  select (public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-01-01','2026-12-31','ist')->>'paid_revenue_net_cents')::bigint
    into after_rev;
  perform pg_temp.want(before_rev = after_rev,
    'creating a 12-month contract changed ACTUAL revenue by exactly 0 — forecast is not revenue');

  ov := public.owner_revenue_contract_overview(current_setting('t.entity')::uuid);
  perform pg_temp.want((ov->>'mrr_net_cents')::bigint = 50000, 'MRR net is 500,00');
  perform pg_temp.want((ov->>'arr_net_cents')::bigint = 600000, 'ARR net is 6.000,00 (12 x MRR)');
  perform pg_temp.want((ov->>'active_contract_count')::int = 1, 'one active contract');
  perform pg_temp.want(ov->>'basis' = 'expected', 'the overview is explicitly labelled EXPECTED, never actual');
end $$;

-- Posting a month is deliberate, creates exactly one real invoice, and is not repeatable.
do $$
declare r jsonb; inv record; rev_before bigint; rev_after bigint;
begin
  select (public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-03-01','2026-03-31','ist')->>'paid_revenue_net_cents')::bigint
    into rev_before;

  r := public.owner_post_revenue_contract_month(gen_random_uuid(), current_setting('t.contract')::uuid, '2026-03-01',
        jsonb_build_array(jsonb_build_object('payment_date','2026-03-05','amount_cents',59500,'reference','Mär 2026')));
  select * into inv from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  perform pg_temp.want(inv.status = 'paid', 'the posted month is a real, paid invoice');
  perform pg_temp.want(inv.gross_total_cents = 59500, 'the posted invoice gross is 595,00');
  perform pg_temp.want((r->>'period_end')::date = '2026-03-31', 'the service period spans the whole month');
  perform pg_temp.want(inv.service_period_start = '2026-03-01' and inv.service_period_end = '2026-03-31',
    'the invoice carries the contract service period');

  select (public.owner_tax_period_inputs(current_setting('t.entity')::uuid,'2026-03-01','2026-03-31','ist')->>'paid_revenue_net_cents')::bigint
    into rev_after;
  perform pg_temp.want(rev_after - rev_before = 50000,
    'only the DELIBERATELY posted month added actual revenue (500,00 net)');
end $$;

do $$
begin
  begin
    perform public.owner_post_revenue_contract_month(gen_random_uuid(), current_setting('t.contract')::uuid, '2026-03-01');
    perform pg_temp.fail('the same contract period was posted twice');
  exception when others then
    perform pg_temp.want(sqlerrm like '%already been posted%', 'duplicate month posting is refused: ' || sqlerrm);
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 7. BULK IMPORT: ten invoices, atomically, with duplicate protection.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.bulk(p_n int, p_bad boolean, p_prefix text default 'BULK-2026-') returns jsonb language plpgsql as $$
declare v jsonb := '[]'::jsonb; i int;
begin
  for i in 1..p_n loop
    v := v || jsonb_build_object(
      'client_import_id', p_prefix || lpad(i::text,3,'0'),
      'customer', jsonb_build_object('organization_id','33333333-3333-3333-3333-333333333333'),
      'external_reference', 'Original-RE-' || i,
      'issue_date','2026-06-01','service_date','2026-06-01','currency','EUR',
      'lines', case when p_bad and i = p_n
                 -- A deliberately invalid final row: an unresolved VAT treatment.
                 then jsonb_build_array(jsonb_build_object('description','Kaputt','quantity_milli',1000,
                        'unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','unknown'))
                 else jsonb_build_array(jsonb_build_object('description','Leistung ' || i,'quantity_milli',1000,
                        'unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard')) end,
      'payments', jsonb_build_array(jsonb_build_object('payment_date','2026-06-10','amount_cents',119000)));
  end loop;
  return jsonb_build_object('schema_version',1,'business_entity_id',current_setting('t.entity'),'invoices',v);
end $$;

do $$
declare v_before int; v_after int; r jsonb;
begin
  select count(*) into v_before from public.owner_invoices;
  r := public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.bulk(10, false));
  select count(*) into v_after from public.owner_invoices;
  perform pg_temp.want((r->>'invoice_count')::int = 10, 'ten invoices imported');
  perform pg_temp.want((r->>'payment_count')::int = 10, 'ten payments imported');
  perform pg_temp.want(v_after - v_before = 10, 'exactly ten invoice rows were created');
  perform pg_temp.want((r->>'gross_cents')::bigint = 1190000, 'batch gross totals are server-derived (11.900,00)');
  perform pg_temp.want((r->>'paid_cents')::bigint = 1190000, 'the batch is fully paid');
  perform pg_temp.want((select count(*) from public.owner_finance_import_records where record_type='invoice') = 10,
    'every imported invoice has an import-provenance record');
end $$;

-- The SAME batch again must not duplicate anything.
do $$
declare v_before int; v_after int;
begin
  select count(*) into v_before from public.owner_invoices;
  begin
    perform public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.bulk(10, false));
    perform pg_temp.fail('re-importing the same client_import_ids was allowed');
  exception when others then
    perform pg_temp.pass('re-importing the same records is refused: ' || left(sqlerrm, 90));
  end;
  select count(*) into v_after from public.owner_invoices;
  perform pg_temp.want(v_before = v_after, 'the refused re-import created NO invoices');
end $$;

-- Replaying the SAME idempotency key returns the stored result without re-importing.
do $$
declare k uuid := gen_random_uuid(); r1 jsonb; r2 jsonb; v_after int; v_before int;
begin
  select count(*) into v_before from public.owner_invoices;
  r1 := public.owner_bulk_import_finance(k, jsonb_build_object('schema_version',1,
    'business_entity_id',current_setting('t.entity'),
    'invoices', jsonb_build_array(jsonb_build_object(
      'client_import_id','IDEMP-1',
      'customer', jsonb_build_object('organization_id','33333333-3333-3333-3333-333333333333'),
      'issue_date','2026-07-01','service_date','2026-07-01',
      'lines', jsonb_build_array(jsonb_build_object('description','X','unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard')),
      'payments', '[]'::jsonb))));
  r2 := public.owner_bulk_import_finance(k, jsonb_build_object('schema_version',1,
    'business_entity_id',current_setting('t.entity'),'invoices','[]'::jsonb));
  select count(*) into v_after from public.owner_invoices;
  perform pg_temp.want(r1->>'batch_id' = r2->>'batch_id', 'the retried key replays the original batch result');
  perform pg_temp.want(v_after - v_before = 1, 'a timed-out retry created ONE invoice, not two');
end $$;

-- An invalid tenth invoice must roll back the whole batch.
do $$
declare v_before int; v_after int; v_batches int;
begin
  select count(*) into v_before from public.owner_invoices;
  select count(*) into v_batches from public.owner_finance_import_batches;
  begin
    -- FRESH ids: this must abort because the tenth row is invalid, not because an id repeats.
    perform public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.bulk(10, true, 'ROLLBACK-2026-'));
    perform pg_temp.fail('a batch with an invalid row was committed');
  exception when others then
    perform pg_temp.want(sqlerrm like '%VAT%' or sqlerrm like '%unresolved%',
      'the batch aborts because of the INVALID ROW itself: ' || left(sqlerrm, 80));
  end;
  select count(*) into v_after from public.owner_invoices;
  perform pg_temp.want(v_before = v_after,
    'ALL-OR-NOTHING: the nine valid invoices were rolled back with the bad one (before ' || v_before || ', after ' || v_after || ')');
  perform pg_temp.want((select count(*) from public.owner_finance_import_batches) = v_batches,
    'no orphan import batch row survived the rollback');
end $$;

-- Payload bounds and schema version.
do $$
begin
  begin
    perform public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.bulk(101, false, 'TOOBIG-'));
    perform pg_temp.fail('an oversized batch was accepted');
  exception when others then perform pg_temp.want(sqlerrm like '%at most 100 invoices%', 'oversized batches are rejected'); end;
  begin
    perform public.owner_bulk_import_finance(gen_random_uuid(), jsonb_build_object('schema_version',99,
      'business_entity_id',current_setting('t.entity'),'invoices','[]'::jsonb));
    perform pg_temp.fail('an unknown schema_version was accepted');
  exception when others then perform pg_temp.want(sqlerrm like '%schema_version%', 'unknown schema_version is rejected'); end;
end $$;

-- Customer resolution refuses to guess between duplicates.
do $$
declare r jsonb;
begin
  insert into public.organizations (id, name, status, created_by) values
    ('44444444-4444-4444-4444-444444444444','Doppelt GmbH','active', current_setting('t.owner')::uuid),
    ('55555555-5555-5555-5555-555555555555','Doppelt GmbH','active', current_setting('t.owner')::uuid)
  on conflict (id) do nothing;

  r := public.owner_resolve_import_customers(current_setting('t.entity')::uuid,
        jsonb_build_array('Eindeutig GmbH','Doppelt GmbH','Gibt Es Nicht'));
  perform pg_temp.want((r->0->>'organization_id') is not null, 'a unique customer name resolves to an id');
  perform pg_temp.want((r->1->>'ambiguous')::boolean, 'an ambiguous name is flagged, never silently chosen');
  perform pg_temp.want((r->1->>'organization_id') is null, 'an ambiguous name yields NO id');
  perform pg_temp.want((r->2->>'match_count')::int = 0, 'an unknown name matches nothing');
end $$;

-- ---------------------------------------------------------------------------
-- 8. EMAIL / OUTBOUND SAFETY across everything done above.
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.want((select count(*) from public.owner_automation_jobs) = 0,
    'after invoices, payments, contracts, a posted month and bulk imports: ZERO automation jobs');
end $$;

-- ---------------------------------------------------------------------------
-- 9. AUTHORIZATION: none of this is reachable without owner rights.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '', false);
do $$
begin
  begin perform public.record_owner_historical_invoice_with_payments(gen_random_uuid(), pg_temp.header('2026-01-10'), pg_temp.body(), '[]'::jsonb);
    perform pg_temp.fail('anon recorded an invoice');
  exception when others then perform pg_temp.want(sqlerrm like '%Owner access required%', 'anon cannot record invoices'); end;
  begin perform public.owner_bulk_import_finance(gen_random_uuid(), pg_temp.bulk(1, false, 'ANON-'));
    perform pg_temp.fail('anon ran a bulk import');
  exception when others then perform pg_temp.want(sqlerrm like '%Owner access required%', 'anon cannot bulk import'); end;
  begin perform public.owner_create_revenue_contract(gen_random_uuid(), '{}'::jsonb, '[]'::jsonb);
    perform pg_temp.fail('anon created a contract');
  exception when others then perform pg_temp.want(sqlerrm like '%Owner access required%', 'anon cannot create contracts'); end;
  begin perform public.owner_revenue_contract_overview(current_setting('t.entity')::uuid);
    perform pg_temp.fail('anon read the contract overview');
  exception when others then perform pg_temp.want(sqlerrm like '%Owner access required%', 'anon cannot read the forecast'); end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);

do $$ begin raise notice '--- finance multipay/recurring/bulk SQL tests: ALL ASSERTIONS PASSED ---'; end $$;
