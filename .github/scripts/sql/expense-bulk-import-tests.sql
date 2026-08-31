-- Owner Admin Center: the EXPENSE Schnellimport (20260904120000).
--
-- These tests EXECUTE the RPCs. That is deliberate and load-bearing here: the reported
-- defect was arithmetic and referential, and no amount of source parsing can tell a
-- function that COMPILES from one that computes 2300 rather than 1933.
--
-- Covered:
--   * 19,33 net + 19 % = 3,67 VAT = 23,00 gross, settled by a 23,00 payment → paid
--   * the payment is a real owner_payments EXPENSE OUTFLOW linked to the expense
--   * vendor resolution: exact match, ambiguous refusal, creation of an unknown supplier
--   * NO owner_customer, NO organization, NO invoice and NO invoice number is created
--   * the invoice counter does not move
--   * category keys: valid, invalid (refused), absent (review_required + needs_info)
--   * all-or-nothing rollback, including the vendor a failed batch would have created
--   * idempotency replay and cross-batch duplicate client_import_id refusal
--   * the negative supplier credit is REFUSED, never coerced
--   * the revenue importer refuses an expense payload and vice versa
--   * non-owner and anon reach none of it
--   * owner_automation_jobs stays empty throughout — no customer can be contacted
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
select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
insert into public.profiles (id, platform_role)
  values (current_setting('t.owner')::uuid, 'cogniiq_owner')
  on conflict (id) do update set platform_role = 'cogniiq_owner';
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);

-- owner_automation_jobs belongs to the OFFER chain, which this harness does not apply. The
-- stub makes the "no automation job was enqueued" assertion REAL: if the expense import ever
-- started enqueuing one, the insert would land here and be caught.
create table if not exists public.owner_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text, invoice_id uuid, offer_id uuid, recipient_email text,
  created_at timestamptz not null default now());

set session_replication_role = replica;
delete from public.owner_finance_import_records;
delete from public.owner_finance_import_batches;
delete from public.owner_payments;
delete from public.owner_expense_lines;
delete from public.owner_expenses;
delete from public.owner_invoice_lines;
delete from public.owner_invoices;
delete from public.owner_invoice_counters;
delete from public.owner_vendors;
delete from public.owner_finance_requests;
delete from public.owner_automation_jobs;
set session_replication_role = origin;

select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

-- Baselines the accounting firewall is measured against.
select set_config('t.org_before', (select count(*)::text from public.organizations), false);
select set_config('t.cust_before', (select count(*)::text from public.owner_customers), false);

create or replace function pg_temp.payload(p_expenses jsonb) returns jsonb language sql as $$
  select jsonb_build_object('schema_version', 1,
    'business_entity_id', current_setting('t.entity'), 'source', 'sql-test',
    'expenses', p_expenses) $$;

-- ---------------------------------------------------------------------------
-- 1. THE REGRESSION: 19,33 + 19 % = 23,00, paid in full with 23,00.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; e record; p record;
begin
  r := public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
    jsonb_build_object(
      'client_import_id','Q2EXP-2026-004',
      'vendor', jsonb_build_object('name','OpenAI Ireland Limited','country_code','IE','vat_id','IE3717981AH'),
      'supplier_invoice_number','OAI-2026-3391',
      'invoice_date','2026-04-14',
      'currency','EUR',
      'category_key','ai_api',
      'lines', jsonb_build_array(jsonb_build_object(
        'description','API-Nutzung April 2026','net_cents',1933,'vat_rate_bp',1900,
        'vat_treatment','domestic_standard')),
      'payments', jsonb_build_array(jsonb_build_object(
        'payment_date','2026-04-14','amount_cents',2300,'method','card','reference','Kreditkarte'))
    ))));

  select * into e from public.owner_expenses
   where id = (r->'expenses'->0->>'expense_id')::uuid;

  perform pg_temp.want(e.net_total_cents = 1933, 'net is 19,33 (1933 cents)');
  perform pg_temp.want(e.vat_total_cents = 367,  'VAT is 3,67 (367 cents) — domestic_standard @ 19%');
  perform pg_temp.want(e.gross_total_cents = 2300, 'gross is 23,00 (2300 cents), NOT the bare net');
  perform pg_temp.want(e.input_vat_cents = 367, 'Vorsteuer is the full 3,67 (default eligibility)');
  perform pg_temp.want(e.reverse_charge_vat_cents = 0, 'domestic_standard is not reverse charge');
  -- THE reported failure: a 23,00 payment against this expense was called an overpayment.
  perform pg_temp.want(e.amount_paid_cents = 2300, 'the 23,00 payment was accepted in full');
  perform pg_temp.want(e.payment_status = 'paid', 'payment_status is paid — derived, not client-supplied');
  perform pg_temp.want(e.invoice_date = date '2026-04-14', 'invoice_date was accepted without an issue_date');
  perform pg_temp.want(e.supplier_invoice_number = 'OAI-2026-3391', 'the SUPPLIER document number is stored');

  select * into p from public.owner_payments where expense_id = e.id;
  perform pg_temp.want(p.kind = 'expense', 'the payment kind is expense');
  perform pg_temp.want(p.direction = 'outflow', 'the payment is an OUTFLOW');
  perform pg_temp.want(p.invoice_id is null, 'the payment is not attached to any invoice');
  perform pg_temp.want(p.amount_cents = 2300, 'the payment is a real 23,00 ledger row');

  perform pg_temp.want((r->>'expense_count')::int = 1 and (r->>'payment_count')::int = 1,
    'the result reports 1 expense and 1 payment');
  perform pg_temp.want((r->>'gross_cents')::bigint = 2300, 'the returned gross is server-computed');
end $$;

-- ---------------------------------------------------------------------------
-- 2. VENDORS, not customers. The unknown supplier was created — nothing else was.
-- ---------------------------------------------------------------------------
do $$
declare v record;
begin
  select * into v from public.owner_vendors where lower(name) = 'openai ireland limited';
  perform pg_temp.want(v.id is not null, 'the unknown supplier was created as an owner_vendor');
  perform pg_temp.want(v.country_code = 'IE', 'the vendor country code was carried through');
  perform pg_temp.want(v.vat_id = 'IE3717981AH', 'the vendor VAT id was carried through');
  perform pg_temp.want((select count(*) from public.owner_vendors) = 1, 'exactly one vendor exists');

  -- THE accounting firewall. A supplier must never become a Cogniiq customer.
  perform pg_temp.want(
    (select count(*) from public.organizations) = current_setting('t.org_before')::int,
    'NO organization was created by the expense import');
  perform pg_temp.want(
    (select count(*) from public.owner_customers) = current_setting('t.cust_before')::int,
    'NO owner_customer was created by the expense import');
  perform pg_temp.want(not exists (
    select 1 from public.organizations where name ilike '%OpenAI%'
       or name ilike '%Amazon%'), 'no supplier appears as a customer organization');
  perform pg_temp.want((select count(*) from public.owner_invoices) = 0, 'NO invoice was created');
  perform pg_temp.want((select count(*) from public.owner_invoice_counters) = 0,
    'the invoice number counter did not advance');
  perform pg_temp.want((select count(*) from public.owner_automation_jobs) = 0,
    'no automation job was enqueued — no customer can be contacted');
end $$;

-- ---------------------------------------------------------------------------
-- 3. Vendor RESOLUTION at preview time: exact, ambiguous, unknown.
-- ---------------------------------------------------------------------------
insert into public.owner_vendors (name, country_code) values ('Doppelt GmbH', 'DE'), ('doppelt gmbh', 'DE');

do $$
declare r jsonb;
begin
  r := public.owner_resolve_import_vendors(current_setting('t.entity')::uuid,
    jsonb_build_array('OpenAI Ireland Limited', 'Doppelt GmbH', 'Noch Nie Gesehen GmbH', '  openai ireland limited '));

  perform pg_temp.want((r->0->>'match_count')::int = 1 and (r->0->>'vendor_id') is not null
    and (r->0->>'ambiguous')::boolean = false, 'a unique vendor name resolves to exactly one id');
  perform pg_temp.want((r->1->>'match_count')::int = 2 and (r->1->>'vendor_id') is null
    and (r->1->>'ambiguous')::boolean = true, 'a duplicated vendor name is AMBIGUOUS with no id');
  perform pg_temp.want((r->2->>'match_count')::int = 0 and (r->2->>'vendor_id') is null
    and (r->2->>'ambiguous')::boolean = false, 'an unknown vendor reports zero matches (it will be created)');
  perform pg_temp.want((r->3->>'match_count')::int = 1,
    'matching is normalised on case and surrounding whitespace');
  perform pg_temp.want(r->0->>'vendor_id' = r->3->>'vendor_id',
    'the normalised match names the same vendor');
end $$;

-- The resolver reads VENDORS. It cannot return an organization even when one shares the name.
do $$
declare r jsonb; v_org_name text;
begin
  select name into v_org_name from public.organizations limit 1;
  if v_org_name is not null then
    r := public.owner_resolve_import_vendors(current_setting('t.entity')::uuid, jsonb_build_array(v_org_name));
    perform pg_temp.want((r->0->>'match_count')::int = 0,
      'a CUSTOMER name resolves to zero VENDORS — the two tables are not interchangeable');
  else
    perform pg_temp.pass('no organizations seeded; customer/vendor separation covered by section 2');
  end if;
end $$;

-- An ambiguous vendor name is refused by the import itself, not just the preview.
do $$
declare ok boolean := false;
begin
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      jsonb_build_object('client_import_id','AMBIG-1',
        'vendor', jsonb_build_object('name','Doppelt GmbH'),
        'invoice_date','2026-05-01','category_key','office',
        'lines', jsonb_build_array(jsonb_build_object('description','x','net_cents',1000))))));
  exception when others then
    ok := sqlerrm like '%ambiguous%';
  end;
  perform pg_temp.want(ok, 'an ambiguous vendor BLOCKS the import rather than being guessed');
end $$;

-- ---------------------------------------------------------------------------
-- 4. CATEGORIES: stable keys only.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; e record; ok boolean := false;
begin
  -- invalid key → the row fails loudly
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      jsonb_build_object('client_import_id','BADCAT-1',
        'vendor', jsonb_build_object('name','OpenAI Ireland Limited'),
        'invoice_date','2026-05-01','category_key','erfundene_kategorie',
        'lines', jsonb_build_array(jsonb_build_object('description','x','net_cents',1000))))));
  exception when others then ok := sqlerrm like '%unknown expense category%';
  end;
  perform pg_temp.want(ok, 'an unknown category key is refused');

  -- absent key → review_required + needs_info, never a silent tax-sensitive classification
  r := public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
    jsonb_build_object('client_import_id','NOCAT-1',
      'vendor', jsonb_build_object('name','OpenAI Ireland Limited'),
      'invoice_date','2026-05-02',
      'lines', jsonb_build_array(jsonb_build_object('description','x','net_cents',1000))))));
  select * into e from public.owner_expenses where id = (r->'expenses'->0->>'expense_id')::uuid;
  perform pg_temp.want(
    e.category_id = (select id from public.owner_expense_categories where key = 'review_required'),
    'a categoryless expense falls to review_required');
  perform pg_temp.want(e.review_status = 'needs_info', 'and is flagged for review');
  perform pg_temp.want(e.review_reason is not null, 'with a stated reason');
end $$;

-- ---------------------------------------------------------------------------
-- 5. NEGATIVE SUPPLIER CREDIT: refused, never coerced.
-- ---------------------------------------------------------------------------
do $$
declare ok boolean := false; before_count int;
begin
  select count(*) into before_count from public.owner_expenses;
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      jsonb_build_object('client_import_id','Q2EXP-2026-031',
        'vendor', jsonb_build_object('name','OpenAI Ireland Limited'),
        'invoice_date','2026-06-19','category_key','office',
        'lines', jsonb_build_array(jsonb_build_object(
          'description','Gutschrift','net_cents',-6048,'vat_rate_bp',1900,
          'vat_treatment','domestic_standard'))))));
  exception when others then ok := sqlerrm like '%supplier credits%';
  end;
  perform pg_temp.want(ok, 'a negative supplier credit is REFUSED with the canonical message');
  perform pg_temp.want((select count(*) from public.owner_expenses) = before_count,
    'and no expense row was created for it');
  perform pg_temp.want(not exists (select 1 from public.owner_expense_lines where net_cents < 0),
    'no negative expense line exists anywhere — abs() was not applied');
end $$;

-- ---------------------------------------------------------------------------
-- 6. ATOMICITY: one bad row rolls the whole batch back, vendor creation included.
-- ---------------------------------------------------------------------------
do $$
declare exp_before int; ven_before int; pay_before int; bat_before int; ok boolean := false;
begin
  select count(*) into exp_before from public.owner_expenses;
  select count(*) into ven_before from public.owner_vendors;
  select count(*) into pay_before from public.owner_payments;
  select count(*) into bat_before from public.owner_finance_import_batches;

  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      -- good, and it would create a brand new vendor
      jsonb_build_object('client_import_id','ATOM-1',
        'vendor', jsonb_build_object('name','Rollback Lieferant GmbH','country_code','DE'),
        'invoice_date','2026-05-10','category_key','office',
        'lines', jsonb_build_array(jsonb_build_object('description','ok','net_cents',10000)),
        'payments', jsonb_build_array(jsonb_build_object('payment_date','2026-05-11','amount_cents',11900))),
      -- good
      jsonb_build_object('client_import_id','ATOM-2',
        'vendor', jsonb_build_object('name','Rollback Lieferant GmbH'),
        'invoice_date','2026-05-11','category_key','office',
        'lines', jsonb_build_array(jsonb_build_object('description','ok','net_cents',5000))),
      -- BAD: unknown category
      jsonb_build_object('client_import_id','ATOM-3',
        'vendor', jsonb_build_object('name','Rollback Lieferant GmbH'),
        'invoice_date','2026-05-12','category_key','gibt_es_nicht',
        'lines', jsonb_build_array(jsonb_build_object('description','bad','net_cents',5000))))));
  exception when others then ok := true;
  end;

  perform pg_temp.want(ok, 'a bad row aborts the batch');
  perform pg_temp.want((select count(*) from public.owner_expenses) = exp_before,
    'ALL-OR-NOTHING: the two good expenses rolled back with the bad one');
  perform pg_temp.want((select count(*) from public.owner_payments) = pay_before,
    'their payment rolled back too');
  perform pg_temp.want((select count(*) from public.owner_vendors) = ven_before,
    'the vendor the batch would have created rolled back with it');
  perform pg_temp.want(not exists (select 1 from public.owner_vendors where name = 'Rollback Lieferant GmbH'),
    'no orphan supplier survives a failed import');
  perform pg_temp.want((select count(*) from public.owner_finance_import_batches) = bat_before,
    'no import batch record survives either');
end $$;

-- ---------------------------------------------------------------------------
-- 7. IDEMPOTENCY and cross-batch duplicate protection.
-- ---------------------------------------------------------------------------
do $$
declare k uuid := gen_random_uuid(); r1 jsonb; r2 jsonb; body jsonb; ok boolean := false; n_before int;
begin
  body := pg_temp.payload(jsonb_build_array(
    jsonb_build_object('client_import_id','IDEM-1',
      'vendor', jsonb_build_object('name','Idem Lieferant GmbH'),
      'invoice_date','2026-05-20','category_key','office',
      'lines', jsonb_build_array(jsonb_build_object('description','x','net_cents',10000)))));

  r1 := public.owner_bulk_import_expenses(k, body);
  select count(*) into n_before from public.owner_expenses;
  r2 := public.owner_bulk_import_expenses(k, body);

  perform pg_temp.want(r1 = r2, 'replaying the same idempotency key returns the first result verbatim');
  perform pg_temp.want((select count(*) from public.owner_expenses) = n_before,
    'and writes nothing further — no duplicate expense');
  perform pg_temp.want((select count(*) from public.owner_vendors where name = 'Idem Lieferant GmbH') = 1,
    'and creates no duplicate vendor');

  -- A NEW key with the same client_import_id is a genuine duplicate import and is refused.
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), body);
  exception when others then ok := true;
  end;
  perform pg_temp.want(ok, 'a repeated client_import_id in a NEW batch is refused');
  perform pg_temp.want((select count(*) from public.owner_expenses) = n_before,
    'and the refused batch wrote nothing');
end $$;

-- ---------------------------------------------------------------------------
-- 8. Payments the server refuses.
-- ---------------------------------------------------------------------------
do $$
declare ok boolean := false;
begin
  -- 1933 + 19 % = 2300; 2301 genuinely exceeds it and must still be refused.
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      jsonb_build_object('client_import_id','OVERPAY-1',
        'vendor', jsonb_build_object('name','OpenAI Ireland Limited'),
        'invoice_date','2026-05-25','category_key','office',
        'lines', jsonb_build_array(jsonb_build_object('description','x','net_cents',1933,
          'vat_rate_bp',1900,'vat_treatment','domestic_standard')),
        'payments', jsonb_build_array(jsonb_build_object('payment_date','2026-05-25','amount_cents',2301))))));
  exception when others then ok := sqlerrm like '%exceed the expense gross%';
  end;
  perform pg_temp.want(ok, 'a payment that genuinely exceeds the gross is still refused');
end $$;

-- Reverse charge: the supplier gross EXCLUDES self-assessed VAT, so 8400 settles it in full.
do $$
declare r jsonb; e record;
begin
  r := public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
    jsonb_build_object('client_import_id','RC-1',
      'vendor', jsonb_build_object('name','OpenAI Ireland Limited'),
      'invoice_date','2026-05-26','category_key','ai_api',
      'lines', jsonb_build_array(jsonb_build_object('description','API','net_cents',8400,
        'vat_rate_bp',1900,'vat_treatment','reverse_charge_13b')),
      'payments', jsonb_build_array(jsonb_build_object('payment_date','2026-05-26','amount_cents',8400))))));
  select * into e from public.owner_expenses where id = (r->'expenses'->0->>'expense_id')::uuid;
  perform pg_temp.want(e.gross_total_cents = 8400, '§13b supplier gross excludes the self-assessed VAT');
  perform pg_temp.want(e.vat_total_cents = 1596, 'the §13b VAT is still computed');
  perform pg_temp.want(e.reverse_charge_vat_cents = 1596, 'and recorded as reverse-charge VAT');
  perform pg_temp.want(e.payment_status = 'paid', 'an 84,00 payment settles it in full');
end $$;

-- ---------------------------------------------------------------------------
-- 9. The two importers refuse each other's payloads.
-- ---------------------------------------------------------------------------
do $$
declare ok1 boolean := false; ok2 boolean := false;
begin
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(),
      jsonb_build_object('schema_version',1,'business_entity_id',current_setting('t.entity'),
        'expenses', jsonb_build_array(),
        'invoices', jsonb_build_array(jsonb_build_object('client_import_id','X'))));
  exception when others then ok1 := sqlerrm like '%expenses only%';
  end;
  perform pg_temp.want(ok1, 'the EXPENSE importer refuses a revenue payload');

  begin
    perform public.owner_bulk_import_finance(gen_random_uuid(),
      jsonb_build_object('schema_version',1,'business_entity_id',current_setting('t.entity'),
        'invoices', jsonb_build_array(),
        'expenses', jsonb_build_array(jsonb_build_object('client_import_id','Y'))));
  exception when others then ok2 := sqlerrm like '%revenue only%';
  end;
  perform pg_temp.want(ok2, 'the REVENUE importer refuses an expense payload instead of dropping it');
end $$;

-- ---------------------------------------------------------------------------
-- 10. Access control: non-owner and anon reach none of it.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, platform_role)
  values ('00000000-0000-0000-0000-000000000902', 'customer')
  on conflict (id) do update set platform_role = 'customer';

do $$
declare ok1 boolean := false; ok2 boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000902', false);
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      jsonb_build_object('client_import_id','HACK-1',
        'vendor', jsonb_build_object('name','X'), 'invoice_date','2026-05-01',
        'lines', jsonb_build_array(jsonb_build_object('description','x','net_cents',1))))));
  exception when others then ok1 := sqlerrm like '%Owner access required%';
  end;
  perform pg_temp.want(ok1, 'a non-owner cannot run the expense import');

  begin
    perform public.owner_resolve_import_vendors(current_setting('t.entity')::uuid, jsonb_build_array('X'));
  exception when others then ok2 := sqlerrm like '%Owner access required%';
  end;
  perform pg_temp.want(ok2, 'a non-owner cannot resolve vendors');

  perform set_config('request.jwt.claim.sub', current_setting('t.owner'), false);
end $$;

do $$
declare n int;
begin
  select count(*) into n from information_schema.role_routine_grants
   where routine_name in ('owner_bulk_import_expenses','owner_resolve_import_vendors')
     and grantee = 'anon';
  perform pg_temp.want(n = 0, 'anon holds EXECUTE on neither new function');
end $$;

-- ---------------------------------------------------------------------------
-- 11. Final accounting firewall sweep.
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.want((select count(*) from public.owner_invoices) = 0,
    'after every expense import: still ZERO invoices');
  perform pg_temp.want((select count(*) from public.owner_invoice_counters) = 0,
    'still ZERO invoice counters — no issued number was consumed');
  perform pg_temp.want(not exists (select 1 from public.owner_payments where direction = 'inflow'),
    'every payment written by this suite is an OUTFLOW');
  perform pg_temp.want(not exists (select 1 from public.owner_payments where kind <> 'expense'),
    'and every one is kind=expense');
  perform pg_temp.want((select count(*) from public.owner_payments where expense_id is null) = 0,
    'every payment is linked to its expense');
  perform pg_temp.want(
    (select count(*) from public.organizations) = current_setting('t.org_before')::int,
    'FINAL: not one organization was created');
  perform pg_temp.want(
    (select count(*) from public.owner_customers) = current_setting('t.cust_before')::int,
    'FINAL: not one owner_customer was created');
  perform pg_temp.want((select count(*) from public.owner_automation_jobs) = 0,
    'FINAL: not one automation job — no email could have been sent');
  perform pg_temp.want(
    (select count(*) from public.owner_finance_import_records where record_type = 'expense') > 0,
    'expense imports are recorded as expense import records');
  perform pg_temp.want(
    (select count(*) from public.owner_finance_import_records where record_type = 'invoice') = 0,
    'and never as invoice import records');
end $$;

select 'expense bulk import: all assertions passed' as result;
