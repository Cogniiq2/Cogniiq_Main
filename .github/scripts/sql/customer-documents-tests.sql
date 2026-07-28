-- =============================================================================
-- Customer document authorization tests
-- =============================================================================
-- Depends on the fixtures created by customer-projects-tests.sql (test_ids table,
-- test_id() helper, org A / org B, active + suspended members, project_a/project_b).
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Fixtures: canonical owner documents (offer, signed acceptance certificate,
-- invoice, credit note) for org A, plus an offer for org B.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := test_id('entity');
  v_offer_a uuid;
  v_offer_b uuid;
  v_invoice_a uuid;
  v_doc_offer uuid;
  v_doc_cert uuid;
  v_doc_invoice uuid;
  v_doc_credit uuid;
  v_doc_draft uuid;
  v_doc_offer_b uuid;
begin
  perform public.test_become(test_id('admin'));

  insert into public.owner_offers (business_entity_id, organization_id, status, title)
  values (v_entity, test_id('org_a'), 'draft', 'Angebot A') returning id into v_offer_a;

  insert into public.owner_offers (business_entity_id, organization_id, status, title)
  values (v_entity, test_id('org_b'), 'draft', 'Angebot B') returning id into v_offer_b;

  insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
                                     issue_date, due_date, net_total_cents, vat_total_cents, gross_total_cents)
  values (v_entity, test_id('org_a'), 'issued', 'RE-2026-001',
          current_date - 10, current_date + 4, 100000, 19000, 119000)
  returning id into v_invoice_a;

  -- Ordinary offer PDF (NOT signed).
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'offer', 'owner_offers', v_offer_a, 1, 'finalized', 'v1', 'hash-offer',
          'offers/a-v1.pdf', '{}'::jsonb)
  returning id into v_doc_offer;

  -- Signed acceptance certificate: same document_type='offer', but signed=true.
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'offer', 'owner_offers', v_offer_a, 2, 'finalized', 'v1', 'hash-cert',
          'offers/a-cert.pdf', '{"signed":"true"}'::jsonb)
  returning id into v_doc_cert;

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'invoice', 'owner_invoices', v_invoice_a, 1, 'finalized', 'v1', 'hash-inv',
          'invoices/a-v1.pdf', '{}'::jsonb)
  returning id into v_doc_invoice;

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'credit_note', 'owner_invoices', v_invoice_a, 2, 'finalized', 'v1', 'hash-cn',
          'invoices/a-cn.pdf', '{}'::jsonb)
  returning id into v_doc_credit;

  -- A DRAFT owner document: must never be publishable to a customer.
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'invoice', 'owner_invoices', v_invoice_a, 3, 'draft', 'v1', 'hash-draft',
          'invoices/a-draft.pdf', '{}'::jsonb)
  returning id into v_doc_draft;

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'offer', 'owner_offers', v_offer_b, 1, 'finalized', 'v1', 'hash-offer-b',
          'offers/b-v1.pdf', '{}'::jsonb)
  returning id into v_doc_offer_b;

  insert into test_ids values
    ('offer_a', v_offer_a), ('offer_b', v_offer_b), ('invoice_a', v_invoice_a),
    ('doc_offer', v_doc_offer), ('doc_cert', v_doc_cert), ('doc_invoice', v_doc_invoice),
    ('doc_credit', v_doc_credit), ('doc_draft', v_doc_draft), ('doc_offer_b', v_doc_offer_b);
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST: category / source consistency
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean; v_id uuid;
begin
  perform public.test_become(test_id('admin'));

  -- An UNACCEPTED offer's signed certificate cannot be published as acceptance yet.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'acceptance', 'Annahme', test_id('doc_cert'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: acceptance registered for an offer that was never accepted';
  end if;

  -- Accept the offer; now the signed certificate legitimately proves acceptance.
  update public.owner_offers set status = 'accepted', accepted_at = now() where id = test_id('offer_a');
  v_id := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'acceptance', 'Annahmebestätigung', test_id('doc_cert'));
  insert into test_ids values ('cdoc_acceptance', v_id);

  -- An ORDINARY offer PDF may never be relabelled as an acceptance.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'acceptance', 'Fake-Annahme', test_id('doc_offer'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an ordinary offer PDF was relabelled as an acceptance';
  end if;

  -- ...and a signed certificate may not be mislabelled as a plain offer.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'offer', 'Zertifikat als Angebot', test_id('doc_cert'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a signed certificate was published as a plain offer';
  end if;

  -- An invoice document may not be published as a manual / concept / etc.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'manual', 'Rechnung als Handbuch', test_id('doc_invoice'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an invoice document was registered under category=manual';
  end if;

  -- An offer document may not be published as category=invoice.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'invoice', 'Angebot als Rechnung', test_id('doc_offer'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an offer document was registered under category=invoice';
  end if;

  -- A DRAFT owner document may never reach a customer.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'invoice', 'Entwurf', test_id('doc_draft'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a draft owner document was published to a customer';
  end if;

  -- Cross-organization: org B's offer PDF cannot be attached to org A.
  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), test_id('project_a'), 'offer', 'Fremdes Angebot', test_id('doc_offer_b'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an owner document from another organization was attached';
  end if;

  -- A raw upload may not claim an owner-reserved category.
  v_threw := false;
  begin
    insert into public.customer_documents (organization_id, category, title, storage_path,
                                           content_type, size_bytes, uploaded_by)
    values (test_id('org_a'), 'invoice', 'Gefälschte Rechnung', 'x/y.pdf',
            'application/pdf', 100, test_id('admin'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a raw upload claimed category=invoice';
  end if;
end;
$$;
\echo 'ok: document category/source consistency (acceptance requires proof)'

-- ---------------------------------------------------------------------------
-- Publish a real document set for the visibility tests.
-- ---------------------------------------------------------------------------
do $$
declare v_offer_doc uuid; v_upload uuid; v_hidden uuid; v_org_b_doc uuid;
begin
  perform public.test_become(test_id('admin'));

  v_offer_doc := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'offer', 'Ihr Angebot', test_id('doc_offer'));
  perform public.set_customer_document_visibility(v_offer_doc, true);
  perform public.set_customer_document_visibility(test_id('cdoc_acceptance'), true);

  -- An organization-level upload (no project) — reachable via /app/documents.
  insert into public.customer_documents (organization_id, category, title, storage_path,
                                         content_type, size_bytes, uploaded_by)
  values (test_id('org_a'), 'dpa', 'AV-Vertrag', 'org-a/_org/dpa.pdf',
          'application/pdf', 2048, test_id('admin'))
  returning id into v_upload;
  perform public.set_customer_document_visibility(v_upload, true);

  -- Registered but NOT published.
  insert into public.customer_documents (organization_id, project_id, category, title, storage_path,
                                         content_type, size_bytes, uploaded_by)
  values (test_id('org_a'), test_id('project_a'), 'concept', 'Interner Entwurf', 'org-a/p/draft.pdf',
          'application/pdf', 512, test_id('admin'))
  returning id into v_hidden;

  -- A published document belonging to org B.
  insert into public.customer_documents (organization_id, category, title, storage_path,
                                         content_type, size_bytes, uploaded_by)
  values (test_id('org_b'), 'contract', 'Vertrag B', 'org-b/_org/vertrag.pdf',
          'application/pdf', 1024, test_id('admin'))
  returning id into v_org_b_doc;
  perform public.set_customer_document_visibility(v_org_b_doc, true);

  insert into test_ids values
    ('cdoc_offer', v_offer_doc), ('cdoc_upload', v_upload),
    ('cdoc_hidden', v_hidden), ('cdoc_org_b', v_org_b_doc);
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST: customer document listing scope + null-project semantics
-- ---------------------------------------------------------------------------
do $$
declare v_all int; v_project int;
begin
  perform public.test_become(test_id('user_a'));

  -- NULL project => every visible document in the organization (this is /app/documents).
  select count(*) into v_all from public.list_customer_documents(null);
  if v_all <> 3 then
    raise exception 'TEST FAILED: org-wide document list returned %, expected 3 (offer, acceptance, dpa)', v_all;
  end if;

  -- Scoped to a project => only that project's documents (the org-level DPA drops out).
  select count(*) into v_project from public.list_customer_documents(test_id('project_a'));
  if v_project <> 2 then
    raise exception 'TEST FAILED: project document list returned %, expected 2', v_project;
  end if;

  -- Unpublished documents are invisible.
  if exists (select 1 from public.list_customer_documents(null) where id = test_id('cdoc_hidden')) then
    raise exception 'TEST FAILED: an unpublished document is visible to the customer';
  end if;

  -- Cross-organization documents are invisible.
  if exists (select 1 from public.list_customer_documents(null) where id = test_id('cdoc_org_b')) then
    raise exception 'TEST FAILED: another organization''s document is visible';
  end if;
end;
$$;
\echo 'ok: document listing scope, null-project semantics, invisible + cross-org denial'

-- ---------------------------------------------------------------------------
-- TEST: suspended member sees nothing
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('user_suspended'));
  select count(*) into v_count from public.list_customer_documents(null);
  if v_count <> 0 then
    raise exception 'TEST FAILED: suspended member sees % documents', v_count;
  end if;
end;
$$;
\echo 'ok: suspended member document denial'

-- ---------------------------------------------------------------------------
-- TEST: the read RPC never exposes storage paths or internal flags
-- ---------------------------------------------------------------------------
do $$
declare v_cols text[];
begin
  select array_agg(lower(p.attname)) into v_cols
  from pg_proc pr
  join lateral unnest(pr.proallargtypes, pr.proargmodes, pr.proargnames)
       as p(atttypid, attmode, attname) on true
  where pr.proname = 'list_customer_documents'
    and pr.pronamespace = 'public'::regnamespace
    and p.attmode = 't';

  if v_cols && array['storage_path','owner_generated_document_id','customer_visible',
                     'uploaded_by','published_at','archived_at','organization_id'] then
    raise exception 'TEST FAILED: list_customer_documents exposes an internal column: %', v_cols;
  end if;
end;
$$;
\echo 'ok: document RPC allow-list excludes storage paths and internal flags'

-- ---------------------------------------------------------------------------
-- TEST: signed-URL authorization (the seven Edge Function cases, at the DB layer)
-- ---------------------------------------------------------------------------
do $$
declare v_bucket text; v_path text; v_count int;
begin
  -- (a) active member success -> real bucket + path
  select bucket_id, object_path into v_bucket, v_path
  from public.authorize_customer_document_download(test_id('user_a'), test_id('cdoc_upload'));
  if v_bucket <> 'customer-documents' or v_path <> 'org-a/_org/dpa.pdf' then
    raise exception 'TEST FAILED: active member authorization returned (%, %)', v_bucket, v_path;
  end if;

  -- (a2) pointer row resolves to the CANONICAL owner bucket, never a copy
  select bucket_id, object_path into v_bucket, v_path
  from public.authorize_customer_document_download(test_id('user_a'), test_id('cdoc_offer'));
  if v_bucket <> 'owner-finance-documents' or v_path <> 'offers/a-v1.pdf' then
    raise exception 'TEST FAILED: pointer authorization returned (%, %)', v_bucket, v_path;
  end if;

  -- (b) cross-organization denial
  select count(*) into v_count
  from public.authorize_customer_document_download(test_id('user_b'), test_id('cdoc_upload'));
  if v_count <> 0 then raise exception 'TEST FAILED: cross-organization download authorized'; end if;

  -- (c) suspended-member denial
  select count(*) into v_count
  from public.authorize_customer_document_download(test_id('user_suspended'), test_id('cdoc_upload'));
  if v_count <> 0 then raise exception 'TEST FAILED: suspended member download authorized'; end if;

  -- (d) invisible-document denial
  select count(*) into v_count
  from public.authorize_customer_document_download(test_id('user_a'), test_id('cdoc_hidden'));
  if v_count <> 0 then raise exception 'TEST FAILED: unpublished document download authorized'; end if;

  -- (e) nonexistent-document denial (identical empty result: no existence oracle)
  select count(*) into v_count
  from public.authorize_customer_document_download(test_id('user_a'), gen_random_uuid());
  if v_count <> 0 then raise exception 'TEST FAILED: nonexistent document authorized'; end if;

  -- (f) null caller denial
  select count(*) into v_count
  from public.authorize_customer_document_download(null, test_id('cdoc_upload'));
  if v_count <> 0 then raise exception 'TEST FAILED: null caller authorized'; end if;
end;
$$;
\echo 'ok: signed-URL authorization (member, cross-org, suspended, invisible, missing, null)'

-- ---------------------------------------------------------------------------
-- TEST: archived documents disappear from listing AND from authorization
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('admin'));
  perform public.archive_customer_document(test_id('cdoc_upload'));

  perform public.test_become(test_id('user_a'));
  if exists (select 1 from public.list_customer_documents(null) where id = test_id('cdoc_upload')) then
    raise exception 'TEST FAILED: archived document still listed';
  end if;

  select count(*) into v_count
  from public.authorize_customer_document_download(test_id('user_a'), test_id('cdoc_upload'));
  if v_count <> 0 then raise exception 'TEST FAILED: archived document still downloadable'; end if;

  -- The audit trail survives archival.
  if not exists (
    select 1 from public.customer_document_access_events
    where document_id = test_id('cdoc_upload') and event_type = 'archived'
  ) then
    raise exception 'TEST FAILED: archival was not audited';
  end if;
end;
$$;
\echo 'ok: archived documents leave every customer surface, audit survives'

-- ---------------------------------------------------------------------------
-- TEST: published documents can never be hard-deleted; unpublished ones can
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean; v_path text; v_events int;
begin
  perform public.test_become(test_id('admin'));

  -- Direct DELETE of a published document is blocked by the trigger, not just by an RPC.
  v_threw := false;
  begin
    delete from public.customer_documents where id = test_id('cdoc_offer');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a published document was hard-deleted';
  end if;

  -- The RPC refuses too.
  v_threw := false;
  begin
    perform public.delete_unpublished_customer_document(test_id('admin'), test_id('cdoc_offer'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: delete RPC removed a published document';
  end if;

  -- An archived-but-once-published document is likewise protected.
  v_threw := false;
  begin
    delete from public.customer_documents where id = test_id('cdoc_upload');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: an archived-but-published document was hard-deleted';
  end if;

  -- A never-published upload CAN be removed, and returns its path for storage cleanup.
  v_path := public.delete_unpublished_customer_document(test_id('admin'), test_id('cdoc_hidden'));
  if v_path <> 'org-a/p/draft.pdf' then
    raise exception 'TEST FAILED: delete did not return the storage path for cleanup (got %)', v_path;
  end if;
  if exists (select 1 from public.customer_documents where id = test_id('cdoc_hidden')) then
    raise exception 'TEST FAILED: unpublished document was not deleted';
  end if;
end;
$$;
\echo 'ok: published documents are undeletable; unpublished uploads are removable'

-- ---------------------------------------------------------------------------
-- TEST: audit events survive deletion of their subjects
-- ---------------------------------------------------------------------------
do $$
declare v_title text; v_user text;
begin
  perform public.test_become(test_id('admin'));
  perform public.record_customer_document_access(test_id('user_a'), test_id('cdoc_offer'), 'url_issued');

  select document_title_snapshot, user_display_name_snapshot into v_title, v_user
  from public.customer_document_access_events
  where document_id = test_id('cdoc_offer') and event_type = 'url_issued';

  if v_title is null or v_user is null then
    raise exception 'TEST FAILED: access event did not capture snapshots';
  end if;

  -- Deleting the profile must not delete the audit row; the snapshot keeps it meaningful.
  delete from public.organization_members where user_id = test_id('user_b');
  delete from public.profiles where id = test_id('user_b');
  delete from auth.users where id = test_id('user_b');

  if not exists (
    select 1 from public.customer_document_access_events
    where document_id = test_id('cdoc_offer') and event_type = 'url_issued'
      and user_display_name_snapshot is not null
  ) then
    raise exception 'TEST FAILED: audit event lost after a profile deletion';
  end if;
end;
$$;
\echo 'ok: audit events and their snapshots survive subject deletion'

-- ---------------------------------------------------------------------------
-- TEST: canonical owner PDFs cannot be deleted while a customer references them
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean := false;
begin
  perform public.test_become(test_id('admin'));
  begin
    delete from public.owner_generated_documents where id = test_id('doc_offer');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a canonical PDF referenced by a customer document was deleted';
  end if;
end;
$$;
\echo 'ok: canonical owner PDFs are protected by ON DELETE RESTRICT'

-- ---------------------------------------------------------------------------
-- TEST: customers hold NO storage policy on the customer-documents bucket
-- ---------------------------------------------------------------------------
do $$
declare v_policies int;
begin
  select count(*) into v_policies
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and qual like '%customer-documents%'
    and qual not like '%is_platform_admin%';
  if v_policies <> 0 then
    raise exception 'TEST FAILED: % non-admin storage polic(ies) exist on the customer-documents bucket', v_policies;
  end if;

  if exists (select 1 from storage.buckets where id = 'customer-documents' and public) then
    raise exception 'TEST FAILED: the customer-documents bucket is public';
  end if;
end;
$$;
\echo 'ok: customer-documents bucket is private with admin-only policies'

-- ---------------------------------------------------------------------------
-- TEST: non-admin cannot invoke document write RPCs
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('user_a'));

  v_threw := false;
  begin
    perform public.set_customer_document_visibility(test_id('cdoc_offer'), true);
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could change document visibility'; end if;

  v_threw := false;
  begin
    perform public.register_customer_document_from_owner_source(
      test_id('org_a'), null, 'offer', 'Selbst veröffentlicht', test_id('doc_offer'));
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could register a document'; end if;

  v_threw := false;
  begin
    perform public.archive_customer_document(test_id('cdoc_offer'));
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could archive a document'; end if;
end;
$$;
\echo 'ok: document write RPCs reject non-admin callers'
