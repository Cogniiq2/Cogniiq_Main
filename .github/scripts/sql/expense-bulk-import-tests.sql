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
--   * SUPPLIER-DOCUMENT DUPLICATES: the same (entity, vendor, supplier invoice number) can
--     never be booked twice -- not under a different client_import_id, not twice in one
--     payload, and not by a direct INSERT that bypasses the import function entirely
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
-- 10b. THE SUPPLIER-DOCUMENT DUPLICATE GUARD.
--
-- THE PRODUCTION BLOCKER: the cross-batch guard is keyed on
-- (business_entity_id, record_type, client_import_id). client_import_id is a label the
-- PASTE chooses, so the SAME OpenAI invoice INV-123 pasted once as Q2EXP-001 and again as
-- Q2EXP-099 slipped through and booked the expense, the payment, the deductible net and the
-- VORSTEUER twice. These assertions execute that exact scenario.
--
-- Both halves are asserted: what must be refused, and what must NOT be. A guard that also
-- blocks legitimate spending is its own accounting defect.
-- ---------------------------------------------------------------------------

-- A clean slate for this section only, so the counts below mean what they say. This is the
-- throwaway test cluster; nothing here runs anywhere else.
set session_replication_role = replica;
delete from public.owner_finance_import_records;
delete from public.owner_finance_import_batches;
delete from public.owner_payments;
delete from public.owner_expense_lines;
delete from public.owner_expenses;
delete from public.owner_vendors;
delete from public.owner_finance_requests;
set session_replication_role = origin;

insert into public.owner_vendors (id, name, country_code)
values ('aaaaaaaa-0000-0000-0000-0000000000d1', 'OpenAI Ireland Limited', 'IE'),
       ('aaaaaaaa-0000-0000-0000-0000000000d2', 'Amazon Marketplace', 'DE');

-- A SECOND business entity, for the cross-entity assertion (E). Two entities may each hold
-- their own copy of a supplier document and each is entitled to its own booking.
insert into public.owner_business_entities (id, slug, display_name)
values ('bbbbbbbb-0000-0000-0000-0000000000e2', 'dup-guard-entity-2', 'Duplicate Guard Entity 2')
on conflict (id) do nothing;

create or replace function pg_temp.dup_expense(p_cid text, p_vendor uuid, p_number text)
returns jsonb language sql as $$
  select jsonb_build_object(
    'client_import_id', p_cid,
    'vendor', jsonb_build_object('vendor_id', p_vendor),
    'supplier_invoice_number', p_number,
    'invoice_date', '2026-04-14',
    'currency', 'EUR',
    'category_key', 'ai_api',
    'lines', jsonb_build_array(jsonb_build_object(
      'description', 'API-Nutzung', 'net_cents', 1933,
      'vat_rate_bp', 1900, 'vat_treatment', 'domestic_standard')),
    'payments', jsonb_build_array(jsonb_build_object(
      'payment_date', '2026-04-14', 'amount_cents', 2300)))
$$;

create or replace function pg_temp.entity_payload(p_entity uuid, p_expenses jsonb)
returns jsonb language sql as $$
  select jsonb_build_object('schema_version', 1, 'business_entity_id', p_entity,
    'source', 'sql-test', 'expenses', p_expenses)
$$;

-- (A) The reported defect, executed. Same entity, same vendor, same supplier invoice, a
--     DIFFERENT client_import_id.
do $$
declare blocked boolean := false; msg text;
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('Q2EXP-001', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'INV-123'))));
  perform pg_temp.want((select count(*) from public.owner_expenses) = 1, 'the first import of INV-123 succeeded');

  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
      jsonb_build_array(pg_temp.dup_expense('Q2EXP-099', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'INV-123'))));
  exception when others then blocked := true; msg := sqlerrm;
  end;

  perform pg_temp.want(blocked,
    '(A) the SAME supplier invoice under a DIFFERENT client_import_id is REFUSED');
  perform pg_temp.want(msg like '%bereits%' or msg like '%already recorded%',
    '(A) and the refusal names the document as already recorded: ' || coalesce(msg, '<none>'));

  -- The load-bearing assertion. Nothing about the second attempt survived.
  perform pg_temp.want((select count(*) from public.owner_expenses) = 1,
    '(A) still exactly ONE expense — no second booking');
  perform pg_temp.want((select count(*) from public.owner_payments) = 1,
    '(A) still exactly ONE payment — the outflow was not doubled');
  perform pg_temp.want((select sum(input_vat_cents) from public.owner_expenses) = 367,
    '(A) Vorsteuer is still 3,67 — the input VAT was NOT claimed twice');
  perform pg_temp.want((select sum(deductible_net_cents) from public.owner_expenses) = 1933,
    '(A) the deductible net was not doubled either');
end $$;

-- (I) The pre-existing client_import_id guard still works on its own terms.
do $$
declare blocked boolean := false;
begin
  begin
    -- Same client_import_id, a DIFFERENT document. Only the old guard can catch this.
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
      jsonb_build_array(pg_temp.dup_expense('Q2EXP-001', 'aaaaaaaa-0000-0000-0000-0000000000d2', 'OTHER-1'))));
  exception when others then blocked := true;
  end;
  perform pg_temp.want(blocked, '(I) the cross-batch client_import_id guard still refuses a replay');
  perform pg_temp.want((select count(*) from public.owner_expenses) = 1, '(I) and nothing was written');
end $$;

-- (B) The same supplier document twice inside ONE payload, under two client_import_ids.
do $$
declare blocked boolean := false; msg text;
begin
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      pg_temp.dup_expense('BATCH-A', 'aaaaaaaa-0000-0000-0000-0000000000d2', 'IN-BATCH-1'),
      pg_temp.dup_expense('BATCH-B', 'aaaaaaaa-0000-0000-0000-0000000000d2', 'IN-BATCH-1'))));
  exception when others then blocked := true; msg := sqlerrm;
  end;
  perform pg_temp.want(blocked, '(B) the same document twice in ONE payload is REFUSED');
  perform pg_temp.want(msg like '%already in this import%',
    '(B) and the error names the other pasted row: ' || coalesce(msg, '<none>'));
  -- All-or-nothing: the FIRST row of the pair must not survive the refusal of the second.
  perform pg_temp.want((select count(*) from public.owner_expenses) = 1,
    '(B) atomic — the first row of the duplicate pair rolled back with the second');
end $$;

-- (G) Normalisation is trim + case-fold, and it is enforced, not merely computed.
do $$
declare blocked boolean := false;
begin
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
      jsonb_build_array(pg_temp.dup_expense('CASE-1', 'aaaaaaaa-0000-0000-0000-0000000000d1', '  inv-123 '))));
  exception when others then blocked := true;
  end;
  perform pg_temp.want(blocked, '(G) "  inv-123 " is the same document as "INV-123"');
  perform pg_temp.want((select count(*) from public.owner_expenses) = 1, '(G) and nothing was written');
end $$;

-- (C) DIFFERENT vendors sharing an invoice number are DIFFERENT documents.
do $$
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('OTHER-VENDOR', 'aaaaaaaa-0000-0000-0000-0000000000d2', 'INV-123'))));
  perform pg_temp.want((select count(*) from public.owner_expenses) = 2,
    '(C) the same invoice number from a DIFFERENT vendor was allowed');
end $$;

-- (D) The same vendor with DIFFERENT invoice numbers is not a duplicate.
do $$
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('NEXT-DOC', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'INV-124'))));
  perform pg_temp.want((select count(*) from public.owner_expenses) = 3,
    '(D) the same vendor with a different invoice number was allowed');
end $$;

-- (E) A DIFFERENT business entity may hold its own copy of the same supplier document.
do $$
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.entity_payload(
    'bbbbbbbb-0000-0000-0000-0000000000e2',
    jsonb_build_array(pg_temp.dup_expense('ENTITY-2', 'aaaaaaaa-0000-0000-0000-0000000000d1', 'INV-123'))));
  perform pg_temp.want((select count(*) from public.owner_expenses) = 4,
    '(E) the same supplier document in a DIFFERENT business entity was allowed');
  perform pg_temp.want(
    (select count(*) from public.owner_expenses
      where vendor_id = 'aaaaaaaa-0000-0000-0000-0000000000d1' and lower(btrim(supplier_invoice_number)) = 'inv-123') = 2,
    '(E) each entity holds exactly one copy of INV-123');
end $$;

-- (F) NO supplier invoice number → no fabricated identity. Two rows that are identical in
--     vendor, amount and date are TWO REAL EXPENSES: a supplier billing 19,33 € twice on one
--     day is two deductions, and blocking the second would cost the owner one of them.
do $$
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('NO-NUM-1', 'aaaaaaaa-0000-0000-0000-0000000000d1', null))));
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('NO-NUM-2', 'aaaaaaaa-0000-0000-0000-0000000000d1', null))));
  perform pg_temp.want((select count(*) from public.owner_expenses) = 6,
    '(F) two numberless expenses from one vendor on one day both imported');
  perform pg_temp.want(
    (select count(*) from public.owner_expenses where supplier_invoice_number is not null and btrim(supplier_invoice_number) = '') = 0,
    '(F) no blank-string document number was invented');
end $$;

-- A blank-string number is treated as ABSENT, not as a document called "".
do $$
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('BLANK-1', 'aaaaaaaa-0000-0000-0000-0000000000d2', '   '))));
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('BLANK-2', 'aaaaaaaa-0000-0000-0000-0000000000d2', ''))));
  perform pg_temp.want((select count(*) from public.owner_expenses) = 8,
    'a blank supplier invoice number carries no identity and does not collide');
  perform pg_temp.want(
    (select count(*) from public.owner_expenses
      where supplier_invoice_number is not null and btrim(supplier_invoice_number) = '') = 0,
    'a blank number is stored as NULL, never as a document called ""');
end $$;

-- The stored number is TRIMMED, so what is compared is what is stored.
do $$
begin
  perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(
    jsonb_build_array(pg_temp.dup_expense('TRIMMED', 'aaaaaaaa-0000-0000-0000-0000000000d2', '  RE-77  '))));
  perform pg_temp.want(
    exists (select 1 from public.owner_expenses where supplier_invoice_number = 'RE-77'),
    'the supplier invoice number is stored trimmed');
end $$;

-- (H) THE DATABASE-LEVEL SAFEGUARD. Every check above lives inside
--     owner_bulk_import_expenses. This one bypasses that function entirely -- a direct
--     INSERT, exactly what a stale preview, a hand-written RPC call or two concurrent
--     imports racing past the same SELECT would amount to -- and must still be refused.
do $$
declare blocked boolean := false; msg text; v_cat uuid;
begin
  select id into v_cat from public.owner_expense_categories where key = 'ai_api';
  begin
    insert into public.owner_expenses (business_entity_id, vendor_id, category_id,
      supplier_invoice_number, invoice_date, currency)
    values (current_setting('t.entity')::uuid, 'aaaaaaaa-0000-0000-0000-0000000000d1', v_cat,
      'INV-123', date '2026-04-14', 'EUR');
  exception when unique_violation then blocked := true; msg := sqlerrm;
  end;
  perform pg_temp.want(blocked,
    '(H) a DIRECT INSERT bypassing the import function is refused by the database');
  perform pg_temp.want(msg like '%owner_expenses_supplier_document_uniq%',
    '(H) by the supplier-document unique index specifically: ' || coalesce(msg, '<none>'));

  -- The same INSERT with a different CASE must also be refused: the index is on the
  -- normalised expression, not on the raw text.
  blocked := false;
  begin
    insert into public.owner_expenses (business_entity_id, vendor_id, category_id,
      supplier_invoice_number, invoice_date, currency)
    values (current_setting('t.entity')::uuid, 'aaaaaaaa-0000-0000-0000-0000000000d1', v_cat,
      '  Inv-123  ', date '2026-04-14', 'EUR');
  exception when unique_violation then blocked := true;
  end;
  perform pg_temp.want(blocked, '(H) and the index normalises case and whitespace too');

  -- And it must NOT block a legitimate direct insert.
  insert into public.owner_expenses (business_entity_id, vendor_id, category_id,
    supplier_invoice_number, invoice_date, currency)
  values (current_setting('t.entity')::uuid, 'aaaaaaaa-0000-0000-0000-0000000000d1', v_cat,
    'INV-999', date '2026-04-14', 'EUR');
  perform pg_temp.want(true, '(H) an unrelated direct insert still succeeds');

  -- Two numberless rows are not a unique-index collision either.
  insert into public.owner_expenses (business_entity_id, vendor_id, category_id, invoice_date, currency)
  values (current_setting('t.entity')::uuid, 'aaaaaaaa-0000-0000-0000-0000000000d1', v_cat, date '2026-04-14', 'EUR'),
         (current_setting('t.entity')::uuid, 'aaaaaaaa-0000-0000-0000-0000000000d1', v_cat, date '2026-04-14', 'EUR');
  perform pg_temp.want(true, '(H) NULL supplier invoice numbers do not collide in the index');
end $$;

-- The preview probe agrees with the importer, row for row.
do $$
declare r jsonb;
begin
  r := public.owner_check_expense_documents(current_setting('t.entity')::uuid, jsonb_build_array(
    jsonb_build_object('client_import_id','P1','vendor_id','aaaaaaaa-0000-0000-0000-0000000000d1','supplier_invoice_number','INV-123'),
    jsonb_build_object('client_import_id','P2','vendor_id','aaaaaaaa-0000-0000-0000-0000000000d1','supplier_invoice_number','  inv-123  '),
    jsonb_build_object('client_import_id','P3','vendor_id','aaaaaaaa-0000-0000-0000-0000000000d2','supplier_invoice_number','INV-123'),
    jsonb_build_object('client_import_id','P4','vendor_id','aaaaaaaa-0000-0000-0000-0000000000d1','supplier_invoice_number','NEVER-SEEN'),
    jsonb_build_object('client_import_id','P5','vendor_id','aaaaaaaa-0000-0000-0000-0000000000d1','supplier_invoice_number',null)));

  perform pg_temp.want((r->0->>'match_count')::int = 1, 'probe: INV-123 is already booked');
  perform pg_temp.want((r->1->>'match_count')::int = 1, 'probe: normalisation matches the index');
  perform pg_temp.want((r->2->>'match_count')::int = 1, 'probe: the other vendor has its own INV-123');
  perform pg_temp.want((r->3->>'match_count')::int = 0, 'probe: an unseen document is clear');
  perform pg_temp.want((r->4->>'match_count')::int = 0, 'probe: a numberless row is never a duplicate');
  perform pg_temp.want((r->0->>'client_import_id') = 'P1', 'probe: rows come back addressable');
end $$;

-- (J) Supplier credits stay refused. The duplicate work rescued nothing.
do $$
declare blocked boolean := false; msg text; before int;
begin
  select count(*) into before from public.owner_expenses;
  begin
    perform public.owner_bulk_import_expenses(gen_random_uuid(), pg_temp.payload(jsonb_build_array(
      jsonb_build_object('client_import_id','CREDIT-1',
        'vendor', jsonb_build_object('vendor_id','aaaaaaaa-0000-0000-0000-0000000000d1'),
        'supplier_invoice_number','CREDIT-NOTE-1',
        'invoice_date','2026-04-20', 'category_key','ai_api',
        'lines', jsonb_build_array(jsonb_build_object(
          'description','Gutschrift','net_cents',-1933,
          'vat_rate_bp',1900,'vat_treatment','domestic_standard'))))));
  exception when others then blocked := true; msg := sqlerrm;
  end;
  perform pg_temp.want(blocked, '(J) a supplier credit is still REFUSED');
  perform pg_temp.want(msg like '%supplier credits%', '(J) with the credit-note message, not a duplicate one');
  perform pg_temp.want((select count(*) from public.owner_expenses) = before, '(J) and nothing was written');
end $$;

-- The probe is owner-gated like every other RPC here.
do $$
declare ok1 boolean := false; n int;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000902', false);
  begin
    perform public.owner_check_expense_documents(current_setting('t.entity')::uuid, '[]'::jsonb);
  exception when others then ok1 := sqlerrm like '%Owner access required%';
  end;
  perform pg_temp.want(ok1, 'a non-owner cannot run the supplier-document probe');
  perform set_config('request.jwt.claim.sub', current_setting('t.owner'), false);

  select count(*) into n from information_schema.role_routine_grants
   where routine_name = 'owner_check_expense_documents' and grantee = 'anon';
  perform pg_temp.want(n = 0, 'anon holds EXECUTE on the probe either');
end $$;

-- The probe is READ-ONLY. It is declared STABLE, so the database itself forbids it writing.
do $$
declare v text;
begin
  select case p.provolatile when 's' then 'stable' when 'i' then 'immutable' else 'volatile' end
    into v from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'owner_check_expense_documents';
  perform pg_temp.want(v = 'stable', 'the supplier-document probe is STABLE — it cannot write');
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
