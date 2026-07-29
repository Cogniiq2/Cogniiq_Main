-- =============================================================================
-- Invoice-organization assignment tests
-- =============================================================================
-- Depends on fixtures from customer-projects-tests.sql / customer-billing-tests.sql.
-- Central claim: an invoice with no organization can be linked/published ONLY after
-- an admin explicitly assigns it, and an invoice already belonging to a DIFFERENT
-- organization can never be silently reassigned.
-- =============================================================================

\set ON_ERROR_STOP on

do $$
declare
  v_entity uuid := test_id('entity');
  v_orphan uuid;
  v_threw boolean;
begin
  perform public.test_become(test_id('admin'));

  insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
                                     issue_date, due_date, net_total_cents, vat_total_cents, gross_total_cents)
  values (v_entity, null, 'issued', 'RE-ORPHAN-001', current_date, current_date + 14, 50000, 9500, 59500)
  returning id into v_orphan;
  insert into test_ids values ('inv_orphan', v_orphan);

  -- ---- null organization_id: linking/publishing is refused before any fix ----
  v_threw := false;
  begin
    perform public.link_customer_project_invoice(test_id('project_a'), v_orphan);
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an invoice with NULL organization_id was linked to a project';
  end if;

  -- A null-org invoice never appears in the customer-facing list either.
  perform public.test_become(test_id('user_a'));
  if exists (select 1 from public.list_customer_invoices(null) where invoice_id = v_orphan) then
    raise exception 'TEST FAILED: a null-organization invoice is visible to a customer';
  end if;
  perform public.test_become(test_id('admin'));
end;
$$;
\echo 'ok: null-organization invoice cannot be linked or exposed before assignment'

do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('user_a'));
  v_threw := false;
  begin
    perform public.assign_invoice_organization(test_id('inv_orphan'), test_id('org_a'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a non-admin could assign an invoice organization';
  end if;
end;
$$;
\echo 'ok: assign_invoice_organization rejects non-admin callers'

do $$
declare v_org uuid; v_threw boolean;
begin
  perform public.test_become(test_id('admin'));

  -- ---- the actual fix: assign the missing organization ----
  perform public.assign_invoice_organization(test_id('inv_orphan'), test_id('org_a'));
  select organization_id into v_org from public.owner_invoices where id = test_id('inv_orphan');
  if v_org <> test_id('org_a') then
    raise exception 'TEST FAILED: organization_id was not set (got %)', v_org;
  end if;

  -- Idempotent: assigning the SAME organization again succeeds (no error).
  perform public.assign_invoice_organization(test_id('inv_orphan'), test_id('org_a'));

  -- Never allowed to REASSIGN to a different organization once set.
  v_threw := false;
  begin
    perform public.assign_invoice_organization(test_id('inv_orphan'), test_id('org_b'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an already-assigned invoice was reassigned to a different organization';
  end if;

  -- Mismatched-organization case: an invoice belonging to org_b can never be
  -- assigned into org_a's project either, whether attempted directly...
  v_threw := false;
  begin
    perform public.assign_invoice_organization(test_id('inv_b'), test_id('org_a'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an invoice already belonging to org_b was reassigned to org_a';
  end if;
end;
$$;
\echo 'ok: assignment is null-to-set only; never reassigns an already-set organization'

do $$
declare v_count int;
begin
  -- ---- after the fix: linking and customer visibility now work correctly ----
  perform public.test_become(test_id('admin'));
  perform public.link_customer_project_invoice(test_id('project_a'), test_id('inv_orphan'));

  perform public.test_become(test_id('user_a'));
  select count(*) into v_count from public.list_customer_invoices(null) where invoice_id = test_id('inv_orphan');
  if v_count <> 1 then
    raise exception 'TEST FAILED: invoice still not visible after organization assignment and linking';
  end if;

  -- Still invisible to org B.
  perform public.test_become(test_id('user_b'));
  select count(*) into v_count from public.list_customer_invoices(null) where invoice_id = test_id('inv_orphan');
  if v_count <> 0 then
    raise exception 'TEST FAILED: the newly-assigned invoice leaked to a different organization';
  end if;
end;
$$;
\echo 'ok: after assignment, the invoice is linkable and correctly org-scoped'
