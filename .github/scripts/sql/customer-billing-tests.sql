-- =============================================================================
-- Customer billing authorization tests
-- =============================================================================
-- Depends on fixtures from customer-projects-tests.sql and customer-documents-tests.sql.
-- Central claims: invoices are isolated per organization, only ISSUED invoices are
-- visible, no owner-only financial data is reachable, and pdf_document_id resolves
-- deterministically to the latest finalized document_type='invoice' PDF — never to a
-- credit note or a payment confirmation.
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Fixtures: a draft, a paid and an org-B invoice, plus multiple invoice document
-- versions and competing non-invoice document types on the SAME invoice.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := test_id('entity');
  v_draft uuid;
  v_paid uuid;
  v_invoice_b uuid;
  v_doc_inv_v2 uuid;
  v_doc_pay uuid;
  v_cd_inv_v1 uuid;
  v_cd_inv_v2 uuid;
  v_cd_credit uuid;
  v_cd_pay uuid;
begin
  perform public.test_become(test_id('admin'));

  -- Never visible to a customer.
  insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
                                     issue_date, due_date, net_total_cents, vat_total_cents, gross_total_cents)
  values (v_entity, test_id('org_a'), 'draft', 'RE-DRAFT-001',
          current_date, current_date + 14, 50000, 9500, 59500)
  returning id into v_draft;

  insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
                                     issue_date, due_date, net_total_cents, vat_total_cents,
                                     gross_total_cents, amount_paid_cents, notes, external_reference)
  values (v_entity, test_id('org_a'), 'paid', 'RE-2026-002',
          current_date - 40, current_date - 10, 200000, 38000, 238000, 238000,
          'INTERNE NOTIZ: Marge 62%', 'INTERNAL-REF-9')
  returning id into v_paid;

  -- Another organization's invoice.
  insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
                                     issue_date, due_date, net_total_cents, vat_total_cents, gross_total_cents)
  values (v_entity, test_id('org_b'), 'issued', 'RE-B-001',
          current_date, current_date + 14, 10000, 1900, 11900)
  returning id into v_invoice_b;

  -- A SECOND, newer finalized invoice PDF for the existing invoice_a (version 4).
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'invoice', 'owner_invoices', test_id('invoice_a'), 4, 'finalized', 'v1', 'hash-inv-v4',
          'invoices/a-v4.pdf', '{}'::jsonb)
  returning id into v_doc_inv_v2;

  -- A payment confirmation for the SAME invoice, at an even HIGHER version. If the
  -- resolver were not strictly typed this would win and be served as "the invoice".
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'payment_confirmation', 'owner_invoices', test_id('invoice_a'), 9, 'finalized', 'v1',
          'hash-pay-v9', 'invoices/a-pay.pdf', '{}'::jsonb)
  returning id into v_doc_pay;

  -- Publish all four to the customer, all under category=invoice.
  v_cd_inv_v1 := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung v1', test_id('doc_invoice'));
  v_cd_inv_v2 := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung v4', v_doc_inv_v2);
  v_cd_credit := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Gutschrift', test_id('doc_credit'));
  v_cd_pay := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Zahlungsbestätigung', v_doc_pay);

  perform public.set_customer_document_visibility(v_cd_inv_v1, true);
  perform public.set_customer_document_visibility(v_cd_inv_v2, true);
  perform public.set_customer_document_visibility(v_cd_credit, true);
  perform public.set_customer_document_visibility(v_cd_pay, true);

  perform public.link_customer_project_invoice(test_id('project_a'), test_id('invoice_a'));

  insert into test_ids values
    ('inv_draft', v_draft), ('inv_paid', v_paid), ('inv_b', v_invoice_b),
    ('doc_inv_v4', v_doc_inv_v2), ('doc_pay', v_doc_pay),
    ('cd_inv_v1', v_cd_inv_v1), ('cd_inv_v4', v_cd_inv_v2),
    ('cd_credit', v_cd_credit), ('cd_pay', v_cd_pay);
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST: invoice isolation, status filtering, computed outstanding
-- ---------------------------------------------------------------------------
do $$
declare v_count int; v_outstanding bigint; v_status text;
begin
  perform public.test_become(test_id('user_a'));

  -- invoice_a (issued) + inv_paid (paid). The draft must NOT appear.
  select count(*) into v_count from public.list_customer_invoices(null);
  if v_count <> 2 then
    raise exception 'TEST FAILED: expected 2 visible invoices, got % (draft must be excluded)', v_count;
  end if;

  if exists (select 1 from public.list_customer_invoices(null) where invoice_id = test_id('inv_draft')) then
    raise exception 'TEST FAILED: a DRAFT invoice is visible to the customer';
  end if;

  if exists (select 1 from public.list_customer_invoices(null) where invoice_id = test_id('inv_b')) then
    raise exception 'TEST FAILED: another organization''s invoice is visible';
  end if;

  -- Outstanding is computed, and never negative for an overpaid invoice.
  select outstanding_cents into v_outstanding
  from public.list_customer_invoices(null) where invoice_id = test_id('invoice_a');
  if v_outstanding <> 119000 then
    raise exception 'TEST FAILED: outstanding for the unpaid invoice is %, expected 119000', v_outstanding;
  end if;

  select outstanding_cents, status into v_outstanding, v_status
  from public.list_customer_invoices(null) where invoice_id = test_id('inv_paid');
  if v_outstanding <> 0 or v_status <> 'paid' then
    raise exception 'TEST FAILED: paid invoice shows outstanding=% status=%', v_outstanding, v_status;
  end if;
end;
$$;
\echo 'ok: invoice isolation, draft exclusion, computed outstanding'

-- ---------------------------------------------------------------------------
-- TEST: overpayment never produces a negative outstanding amount
-- ---------------------------------------------------------------------------
do $$
declare v_outstanding bigint;
begin
  perform public.test_become(test_id('admin'));
  update public.owner_invoices set amount_paid_cents = 999999 where id = test_id('inv_paid');

  perform public.test_become(test_id('user_a'));
  select outstanding_cents into v_outstanding
  from public.list_customer_invoices(null) where invoice_id = test_id('inv_paid');
  if v_outstanding <> 0 then
    raise exception 'TEST FAILED: overpaid invoice reports outstanding %, expected 0', v_outstanding;
  end if;

  perform public.test_become(test_id('admin'));
  update public.owner_invoices set amount_paid_cents = 238000 where id = test_id('inv_paid');
end;
$$;
\echo 'ok: overpayment clamps outstanding to zero'

-- ---------------------------------------------------------------------------
-- TEST: pdf_document_id is deterministic and strictly the INVOICE document
-- ---------------------------------------------------------------------------
do $$
declare v_pdf uuid; v_pdf_again uuid;
begin
  perform public.test_become(test_id('user_a'));

  select pdf_document_id into v_pdf
  from public.list_customer_invoices(null) where invoice_id = test_id('invoice_a');

  -- Must be the LATEST finalized invoice-typed PDF (version 4), not version 1...
  if v_pdf <> test_id('cd_inv_v4') then
    raise exception 'TEST FAILED: pdf_document_id resolved to %, expected the v4 invoice document %',
      v_pdf, test_id('cd_inv_v4');
  end if;
  -- ...and explicitly NOT the credit note or the higher-versioned payment confirmation.
  if v_pdf = test_id('cd_credit') then
    raise exception 'TEST FAILED: a CREDIT NOTE was served as the invoice PDF';
  end if;
  if v_pdf = test_id('cd_pay') then
    raise exception 'TEST FAILED: a PAYMENT CONFIRMATION was served as the invoice PDF';
  end if;

  -- Deterministic across calls.
  select pdf_document_id into v_pdf_again
  from public.list_customer_invoices(null) where invoice_id = test_id('invoice_a');
  if v_pdf is distinct from v_pdf_again then
    raise exception 'TEST FAILED: pdf_document_id is not stable between calls (% vs %)', v_pdf, v_pdf_again;
  end if;

  -- An invoice with no published PDF simply reports null.
  if (select pdf_document_id from public.list_customer_invoices(null) where invoice_id = test_id('inv_paid')) is not null then
    raise exception 'TEST FAILED: an invoice without a published PDF reported one';
  end if;
end;
$$;
\echo 'ok: pdf_document_id is the latest finalized INVOICE document, never a credit note or payment confirmation'

-- ---------------------------------------------------------------------------
-- TEST: unpublishing / archiving the invoice PDF removes it from the billing view
-- ---------------------------------------------------------------------------
do $$
declare v_pdf uuid;
begin
  perform public.test_become(test_id('admin'));
  perform public.set_customer_document_visibility(test_id('cd_inv_v4'), false);

  perform public.test_become(test_id('user_a'));
  select pdf_document_id into v_pdf
  from public.list_customer_invoices(null) where invoice_id = test_id('invoice_a');
  -- Falls back to the older PUBLISHED invoice version, still never a credit note.
  if v_pdf <> test_id('cd_inv_v1') then
    raise exception 'TEST FAILED: after unpublishing v4 the resolver returned %, expected the v1 invoice document', v_pdf;
  end if;

  perform public.test_become(test_id('admin'));
  perform public.archive_customer_document(test_id('cd_inv_v1'));

  perform public.test_become(test_id('user_a'));
  select pdf_document_id into v_pdf
  from public.list_customer_invoices(null) where invoice_id = test_id('invoice_a');
  if v_pdf is not null then
    raise exception 'TEST FAILED: an archived/unpublished PDF is still offered (got %)', v_pdf;
  end if;

  -- Restore for the remaining tests.
  perform public.test_become(test_id('admin'));
  perform public.set_customer_document_visibility(test_id('cd_inv_v4'), true);
end;
$$;
\echo 'ok: unpublished and archived PDFs leave the billing view'

-- ---------------------------------------------------------------------------
-- TEST: owner-only financial data is not exposed
-- ---------------------------------------------------------------------------
do $$
declare v_cols text[];
begin
  select array_agg(lower(p.attname)) into v_cols
  from pg_proc pr
  join lateral unnest(pr.proallargtypes, pr.proargmodes, pr.proargnames)
       as p(atttypid, attmode, attname) on true
  where pr.proname = 'list_customer_invoices'
    and pr.pronamespace = 'public'::regnamespace
    and p.attmode = 't';

  if v_cols && array['notes','external_reference','business_entity_id','client_account_id',
                     'engagement_id','organization_id','archived_at','created_by',
                     'service_date','service_period_start','service_period_end'] then
    raise exception 'TEST FAILED: list_customer_invoices exposes an owner-only column: %', v_cols;
  end if;

  -- The internal note fixture must not be reachable through any customer surface.
  perform public.test_become(test_id('user_a'));
  if exists (
    select 1 from public.list_customer_invoices(null) i
    where i.invoice_number = 'RE-2026-002'
      and i::text like '%Marge%'
  ) then
    raise exception 'TEST FAILED: an internal note leaked through the invoice projection';
  end if;
end;
$$;
\echo 'ok: owner-only invoice columns are unreachable'

-- ---------------------------------------------------------------------------
-- TEST: customers cannot read owner_invoices directly
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('user_a'));
  set local role authenticated;
  begin
    select count(*) into v_count from public.owner_invoices;
    if v_count <> 0 then
      raise exception 'TEST FAILED: direct owner_invoices select returned % rows', v_count;
    end if;
  exception when insufficient_privilege then
    null; -- an outright privilege error is an equally acceptable denial
  end;
  reset role;
end;
$$;
\echo 'ok: customers have no direct owner_invoices access'

-- ---------------------------------------------------------------------------
-- TEST: suspended member sees no invoices
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('user_suspended'));
  select count(*) into v_count from public.list_customer_invoices(null);
  if v_count <> 0 then
    raise exception 'TEST FAILED: suspended member sees % invoices', v_count;
  end if;
end;
$$;
\echo 'ok: suspended member invoice denial'

-- ---------------------------------------------------------------------------
-- TEST: project scoping and null-filter semantics
-- ---------------------------------------------------------------------------
do $$
declare v_all int; v_scoped int; v_pid uuid;
begin
  perform public.test_become(test_id('user_a'));

  select count(*) into v_all from public.list_customer_invoices(null);
  select count(*) into v_scoped from public.list_customer_invoices(test_id('project_a'));

  if v_all <> 2 then raise exception 'TEST FAILED: org-wide invoice count is %, expected 2', v_all; end if;
  if v_scoped <> 1 then raise exception 'TEST FAILED: project-scoped invoice count is %, expected 1', v_scoped; end if;

  select project_id into v_pid
  from public.list_customer_invoices(null) where invoice_id = test_id('invoice_a');
  if v_pid <> test_id('project_a') then
    raise exception 'TEST FAILED: linked invoice does not report its project';
  end if;

  -- An unlinked invoice still appears org-wide, with a null project.
  select project_id into v_pid
  from public.list_customer_invoices(null) where invoice_id = test_id('inv_paid');
  if v_pid is not null then
    raise exception 'TEST FAILED: an unlinked invoice reported a project';
  end if;

  -- Another organization's project scopes to nothing rather than erroring.
  select count(*) into v_scoped from public.list_customer_invoices(test_id('project_b'));
  if v_scoped <> 0 then raise exception 'TEST FAILED: cross-org project scope returned % invoices', v_scoped; end if;
end;
$$;
\echo 'ok: invoice project scoping and null-filter semantics'

-- ---------------------------------------------------------------------------
-- TEST: the project-invoice link cannot cross organizations
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('admin'));

  -- Through the RPC: a clear error.
  v_threw := false;
  begin
    perform public.link_customer_project_invoice(test_id('project_a'), test_id('inv_b'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: RPC linked an invoice from another organization';
  end if;

  -- Directly against the table: the composite FK rejects it regardless of the RPC.
  v_threw := false;
  begin
    insert into public.customer_project_invoices (organization_id, project_id, invoice_id, linked_by)
    values (test_id('org_a'), test_id('project_a'), test_id('inv_b'), test_id('admin'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: composite FK allowed a cross-organization invoice link';
  end if;

  -- Claiming the invoice's own org but the other org's project is equally rejected.
  v_threw := false;
  begin
    insert into public.customer_project_invoices (organization_id, project_id, invoice_id, linked_by)
    values (test_id('org_b'), test_id('project_a'), test_id('inv_b'), test_id('admin'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: composite FK allowed a mismatched project/organization link';
  end if;
end;
$$;
\echo 'ok: project-invoice links cannot cross organizations'

-- ---------------------------------------------------------------------------
-- TEST: non-admin cannot link or unlink invoices
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('user_a'));

  v_threw := false;
  begin
    perform public.link_customer_project_invoice(test_id('project_a'), test_id('inv_paid'));
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could link an invoice'; end if;

  v_threw := false;
  begin
    perform public.unlink_customer_project_invoice(test_id('project_a'), test_id('invoice_a'));
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could unlink an invoice'; end if;
end;
$$;
\echo 'ok: invoice link RPCs reject non-admin callers'
