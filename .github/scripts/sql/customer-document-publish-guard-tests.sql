-- =============================================================================
-- Customer-document publish guard tests (migration 20260731120000)
-- =============================================================================
-- Depends on the fixtures built by customer-projects-tests.sql and
-- customer-documents-tests.sql: test_ids / test_id() / test_become(), org A + org B,
-- project_a, and the canonical owner documents doc_offer / doc_cert / doc_invoice /
-- doc_credit / doc_draft / doc_offer_b (plus offer_a, which those tests have already
-- moved to status='accepted').
--
-- The point of this file is the two guarantees the trigger never gave — pointer
-- uniqueness and pointer-to-real-bytes — plus proof that the stable machine codes
-- the owner UI dispatches on are actually what gets raised, and that the extracted
-- category helper has not drifted from the trigger it mirrors.
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Capture the raised SQLSTATE + message for a publish attempt, so a test can
-- assert the exact stable code instead of merely "something threw".
-- ---------------------------------------------------------------------------
create or replace function public.test_publish_error(
  p_org uuid, p_project uuid, p_category public.customer_document_category,
  p_title text, p_source uuid
)
returns text
language plpgsql
as $$
begin
  perform public.register_customer_document_from_owner_source(
    p_org, p_project, p_category, p_title, p_source);
  return null;
exception when others then
  return sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures unique to this file. A finalized owner document with NO
-- pdf_storage_path is the "pointer to nothing" case; a second finalized invoice
-- version gives us a distinct publishable billing document.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := test_id('entity');
  v_doc_nopdf uuid;
  v_doc_invoice_v2 uuid;
  v_project_archived uuid;
begin
  perform public.test_become(test_id('admin'));

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'invoice', 'owner_invoices', test_id('invoice_a'), 10, 'finalized', 'v1',
          'hash-nopdf', null, '{}'::jsonb)
  returning id into v_doc_nopdf;

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (v_entity, 'invoice', 'owner_invoices', test_id('invoice_a'), 11, 'finalized', 'v1',
          'hash-inv-v2', 'invoices/a-v2.pdf', '{}'::jsonb)
  returning id into v_doc_invoice_v2;

  -- An archived project of the SAME organization: the composite FK accepts it, so
  -- only the new explicit check can refuse it.
  insert into public.customer_projects (organization_id, title, business_objective, phase, is_archived, created_by)
  values (test_id('org_a'), 'Archiviertes Projekt', 'Ziel', 'discovery', true, test_id('admin'))
  returning id into v_project_archived;

  insert into test_ids values
    ('doc_nopdf', v_doc_nopdf),
    ('doc_invoice_v2', v_doc_invoice_v2),
    ('project_archived', v_project_archived);
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST: the backstop index exists, with the intended predicate.
-- ---------------------------------------------------------------------------
do $$
declare v_def text;
begin
  select pg_get_indexdef(i.indexrelid) into v_def
  from pg_index i
  join pg_class c on c.oid = i.indexrelid
  where c.relname = 'customer_documents_owner_source_live_unique';

  if v_def is null then
    raise exception 'TEST FAILED: customer_documents_owner_source_live_unique does not exist';
  end if;
  if v_def not like '%UNIQUE%' then
    raise exception 'TEST FAILED: the owner-source pointer index is not UNIQUE: %', v_def;
  end if;
  if v_def not like '%archived_at IS NULL%' then
    raise exception 'TEST FAILED: the pointer index is not scoped to live rows, so archiving would block re-registration: %', v_def;
  end if;
end;
$$;
\echo 'ok: live owner-source pointer uniqueness is enforced by a partial unique index'

-- ---------------------------------------------------------------------------
-- TEST: registering the same canonical PDF twice CONVERGES on one pointer row.
-- This is the defect the publishing UI would otherwise reproduce on every
-- double-click, and it is asserted at the row level, not by trusting a return value.
-- ---------------------------------------------------------------------------
do $$
declare
  v_first uuid;
  v_second uuid;
  v_third uuid;
  v_rows int;
begin
  perform public.test_become(test_id('admin'));

  v_first := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung v2', test_id('doc_invoice_v2'));

  -- Same call again (the double-click / retried-request case).
  v_second := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung v2', test_id('doc_invoice_v2'));

  -- ...and again with a DIFFERENT title, which must not mint a second pointer either:
  -- the canonical PDF is the identity, the title is only a label.
  v_third := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Anderer Titel', test_id('doc_invoice_v2'));

  if v_second is distinct from v_first or v_third is distinct from v_first then
    raise exception 'TEST FAILED: repeated registration returned different pointer ids (% / % / %)',
      v_first, v_second, v_third;
  end if;

  select count(*) into v_rows
  from public.customer_documents
  where organization_id = test_id('org_a')
    and owner_generated_document_id = test_id('doc_invoice_v2')
    and archived_at is null;

  if v_rows <> 1 then
    raise exception 'TEST FAILED: % live pointer rows exist for one canonical PDF, expected 1', v_rows;
  end if;

  insert into test_ids values ('cdoc_invoice_v2', v_first);
end;
$$;
\echo 'ok: repeated registration converges on a single pointer (no duplicate customer_documents)'

-- ---------------------------------------------------------------------------
-- TEST: registering does NOT publish, and re-registering never re-publishes
-- something the owner deliberately revoked.
-- ---------------------------------------------------------------------------
do $$
declare v_visible boolean; v_published timestamptz;
begin
  perform public.test_become(test_id('admin'));

  select customer_visible into v_visible
  from public.customer_documents where id = test_id('cdoc_invoice_v2');
  if v_visible then
    raise exception 'TEST FAILED: registration made the document customer-visible on its own';
  end if;

  -- Release, then revoke, then re-register.
  perform public.set_customer_document_visibility(test_id('cdoc_invoice_v2'), true);
  perform public.set_customer_document_visibility(test_id('cdoc_invoice_v2'), false);
  perform public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung v2', test_id('doc_invoice_v2'));

  select customer_visible, published_at into v_visible, v_published
  from public.customer_documents where id = test_id('cdoc_invoice_v2');

  if v_visible then
    raise exception 'TEST FAILED: re-registering re-published a revoked document';
  end if;
  -- published_at latches: the honest answer to "was this ever visible?" stays yes.
  if v_published is null then
    raise exception 'TEST FAILED: published_at was cleared by revoking, losing the audit answer';
  end if;
end;
$$;
\echo 'ok: register never publishes, and never re-publishes a revoked document'

-- ---------------------------------------------------------------------------
-- TEST: an unpublished pointer can be re-pointed at another project; a RELEASED
-- one keeps its project, so a document never vanishes from where the customer
-- last saw it.
-- ---------------------------------------------------------------------------
do $$
declare
  v_project_2 uuid;
  v_pointer uuid;
  v_project_of_pointer uuid;
begin
  perform public.test_become(test_id('admin'));

  insert into public.customer_projects (organization_id, title, business_objective, phase, created_by)
  values (test_id('org_a'), 'Zweites Projekt', 'Ziel', 'discovery', test_id('admin'))
  returning id into v_project_2;

  -- Currently unpublished (previous test revoked it) -> re-pointing is allowed.
  v_pointer := public.register_customer_document_from_owner_source(
    test_id('org_a'), v_project_2, 'invoice', 'Rechnung v2', test_id('doc_invoice_v2'));
  select project_id into v_project_of_pointer
  from public.customer_documents where id = v_pointer;
  if v_project_of_pointer is distinct from v_project_2 then
    raise exception 'TEST FAILED: an unpublished pointer was not re-pointed to the chosen project';
  end if;

  -- Release it, then try to move it: the project must not change.
  perform public.set_customer_document_visibility(v_pointer, true);
  perform public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung v2', test_id('doc_invoice_v2'));
  select project_id into v_project_of_pointer
  from public.customer_documents where id = v_pointer;
  if v_project_of_pointer is distinct from v_project_2 then
    raise exception 'TEST FAILED: a released document was moved between projects';
  end if;

  -- Leave it revoked so later assertions are not affected by this fixture.
  perform public.set_customer_document_visibility(v_pointer, false);
end;
$$;
\echo 'ok: unpublished pointers may be re-pointed; released ones keep their project'

-- ---------------------------------------------------------------------------
-- TEST: every stable machine code the owner UI dispatches on is really raised.
-- If a code is renamed in SQL without the frontend map being updated, the owner
-- sees an untranslated fallback — so the codes are contract, and asserted as one.
-- ---------------------------------------------------------------------------
do $$
declare v_msg text;
begin
  perform public.test_become(test_id('admin'));

  -- finalization
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'invoice', 'Entwurf', test_id('doc_draft'));
  if v_msg is distinct from 'source_document_not_finalized' then
    raise exception 'TEST FAILED: draft source raised "%", expected source_document_not_finalized', coalesce(v_msg, '<no error>');
  end if;

  -- a finalized document with no stored PDF: the gap the trigger never covered
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'invoice', 'Ohne PDF', test_id('doc_nopdf'));
  if v_msg is distinct from 'source_document_has_no_pdf' then
    raise exception 'TEST FAILED: source without pdf_storage_path raised "%", expected source_document_has_no_pdf', coalesce(v_msg, '<no error>');
  end if;

  -- cross-organization
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'offer', 'Fremd', test_id('doc_offer_b'));
  if v_msg is distinct from 'source_organization_mismatch' then
    raise exception 'TEST FAILED: cross-organization source raised "%", expected source_organization_mismatch', coalesce(v_msg, '<no error>');
  end if;

  -- category vs document type
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'invoice', 'Angebot als Rechnung', test_id('doc_offer'));
  if v_msg is distinct from 'category_source_mismatch' then
    raise exception 'TEST FAILED: offer-as-invoice raised "%", expected category_source_mismatch', coalesce(v_msg, '<no error>');
  end if;
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'acceptance', 'Angebot als Annahme', test_id('doc_offer'));
  if v_msg is distinct from 'category_source_mismatch' then
    raise exception 'TEST FAILED: plain offer as acceptance raised "%", expected category_source_mismatch', coalesce(v_msg, '<no error>');
  end if;
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'offer', 'Zertifikat als Angebot', test_id('doc_cert'));
  if v_msg is distinct from 'category_source_mismatch' then
    raise exception 'TEST FAILED: certificate as plain offer raised "%", expected category_source_mismatch', coalesce(v_msg, '<no error>');
  end if;
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'manual', 'Rechnung als Handbuch', test_id('doc_invoice'));
  if v_msg is distinct from 'category_source_mismatch' then
    raise exception 'TEST FAILED: upload-only category raised "%", expected category_source_mismatch', coalesce(v_msg, '<no error>');
  end if;

  -- archived project of the right organization
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_archived'), 'invoice', 'Archiviert', test_id('doc_credit'));
  if v_msg is distinct from 'project_not_available' then
    raise exception 'TEST FAILED: archived project raised "%", expected project_not_available', coalesce(v_msg, '<no error>');
  end if;

  -- project belonging to another organization
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_b'), 'invoice', 'Fremdes Projekt', test_id('doc_credit'));
  if v_msg is distinct from 'project_not_available' then
    raise exception 'TEST FAILED: cross-organization project raised "%", expected project_not_available', coalesce(v_msg, '<no error>');
  end if;

  -- missing / blank inputs
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'invoice', '   ', test_id('doc_credit'));
  if v_msg is distinct from 'title_required' then
    raise exception 'TEST FAILED: blank title raised "%", expected title_required', coalesce(v_msg, '<no error>');
  end if;
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'invoice', 'Titel', null);
  if v_msg is distinct from 'source_document_required' then
    raise exception 'TEST FAILED: null source raised "%", expected source_document_required', coalesce(v_msg, '<no error>');
  end if;
  v_msg := public.test_publish_error(null, test_id('project_a'), 'invoice', 'Titel', test_id('doc_credit'));
  if v_msg is distinct from 'organization_required' then
    raise exception 'TEST FAILED: null organization raised "%", expected organization_required', coalesce(v_msg, '<no error>');
  end if;

  -- unknown source document
  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'invoice', 'Titel', gen_random_uuid());
  if v_msg is distinct from 'source_document_not_found' then
    raise exception 'TEST FAILED: unknown source raised "%", expected source_document_not_found', coalesce(v_msg, '<no error>');
  end if;
end;
$$;
\echo 'ok: every stable publish error code is raised exactly as the owner UI expects'

-- ---------------------------------------------------------------------------
-- TEST: acceptance still requires an accepted offer, with a distinguishable code.
-- ---------------------------------------------------------------------------
do $$
declare
  v_offer uuid;
  v_cert uuid;
  v_msg text;
begin
  perform public.test_become(test_id('admin'));

  insert into public.owner_offers (business_entity_id, organization_id, status, title)
  values (test_id('entity'), test_id('org_a'), 'sent', 'Noch nicht angenommen')
  returning id into v_offer;

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (test_id('entity'), 'offer', 'owner_offers', v_offer, 1, 'finalized', 'v1',
          'hash-cert-unaccepted', 'offers/unaccepted-cert.pdf', '{"signed":"true"}'::jsonb)
  returning id into v_cert;

  v_msg := public.test_publish_error(test_id('org_a'), test_id('project_a'), 'acceptance', 'Annahme', v_cert);
  if v_msg is distinct from 'acceptance_offer_not_accepted' then
    raise exception 'TEST FAILED: certificate for an unaccepted offer raised "%", expected acceptance_offer_not_accepted', coalesce(v_msg, '<no error>');
  end if;

  -- Once the offer is genuinely accepted, the same call succeeds.
  update public.owner_offers set status = 'accepted', accepted_at = now() where id = v_offer;
  if public.register_customer_document_from_owner_source(
       test_id('org_a'), test_id('project_a'), 'acceptance', 'Annahme', v_cert) is null then
    raise exception 'TEST FAILED: a certificate for an accepted offer could not be published';
  end if;
end;
$$;
\echo 'ok: acceptance requires an accepted source offer (existing rule preserved, code stabilised)'

-- ---------------------------------------------------------------------------
-- TEST: the extracted category helper has not drifted from the trigger it
-- mirrors. Every (category, document_type, signed) combination is put through
-- BOTH paths and the verdicts must agree — otherwise the RPC would either reject
-- a publish the trigger allows (dead UI) or pass one it forbids (raw error).
-- ---------------------------------------------------------------------------
do $$
declare
  v_cat public.customer_document_category;
  v_type text;
  v_signed text;
  v_meta jsonb;
  v_helper boolean;
  v_trigger_ok boolean;
  v_source uuid;
  v_offer uuid;
  v_checked int := 0;
begin
  perform public.test_become(test_id('admin'));

  -- One accepted offer so category='acceptance' is never rejected for the unrelated
  -- "offer not accepted" reason while we are isolating the CATEGORY rule. It is left
  -- in place afterwards: it owns finalized generated documents, which are evidence
  -- and undeletable by design.
  insert into public.owner_offers (business_entity_id, organization_id, status, title, accepted_at)
  values (test_id('entity'), test_id('org_a'), 'accepted', 'Drift-Referenz', now())
  returning id into v_offer;

  foreach v_cat in array array['offer', 'acceptance', 'invoice', 'contract', 'manual']::public.customer_document_category[]
  loop
    foreach v_type in array array['offer', 'invoice', 'credit_note', 'cancellation_invoice',
                                  'payment_confirmation', 'order_confirmation', 'finance_report']
    loop
      foreach v_signed in array array['true', 'false']
      loop
        v_meta := jsonb_build_object('signed', v_signed);
        v_helper := public.customer_document_category_matches_owner_source(v_cat, v_type, v_meta);

        -- Ask the trigger directly, in a savepoint we always roll back, so this
        -- probe leaves no rows behind.
        insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
          source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
        values (test_id('entity'), v_type,
                case when v_type = 'offer' then 'owner_offers' else 'owner_invoices' end,
                case when v_type = 'offer' then v_offer else test_id('invoice_a') end,
                1000 + v_checked, 'finalized', 'v1', 'drift-' || v_checked,
                'drift/' || v_checked || '.pdf', v_meta)
        returning id into v_source;

        begin
          insert into public.customer_documents (organization_id, project_id, category, title,
                                                 owner_generated_document_id, uploaded_by)
          values (test_id('org_a'), test_id('project_a'), v_cat, 'Drift', v_source, test_id('admin'));
          v_trigger_ok := true;
        exception when others then
          v_trigger_ok := false;
        end;

        if v_helper <> v_trigger_ok then
          raise exception 'TEST FAILED: helper and trigger disagree for category=% document_type=% signed=% (helper=%, trigger=%)',
            v_cat, v_type, v_signed, v_helper, v_trigger_ok;
        end if;

        -- Undo the pointer row if the trigger let it through, so the next iteration
        -- is not refused by the new uniqueness backstop instead of by the rule
        -- under test. The probe's owner_generated_documents row deliberately STAYS:
        -- owner_guard_generated_document() forbids deleting a finalized document
        -- (it is evidence), and honouring that guard matters more than a tidy
        -- fixture table. Each probe row carries a unique version (1000+) and a
        -- 'drift/' storage path, so it collides with nothing.
        delete from public.customer_documents
        where owner_generated_document_id = v_source;

        v_checked := v_checked + 1;
      end loop;
    end loop;
  end loop;

  if v_checked < 70 then
    raise exception 'TEST FAILED: only % combinations checked; the drift matrix did not run', v_checked;
  end if;
end;
$$;
\echo 'ok: extracted category helper agrees with the trigger on every combination'

-- ---------------------------------------------------------------------------
-- TEST: a published invoice pointer really does surface as pdf_document_id to
-- the customer, and revoking it really does withdraw it. This is the end-to-end
-- contract the release depends on, asserted through the customer's own RPC under
-- the customer's own identity.
--
-- Deliberately SELF-CONTAINED: earlier files in this suite already publish several
-- invoice PDFs into org A at various versions, and list_customer_invoices resolves
-- the highest version per invoice. Reusing those fixtures would make this assertion
-- depend on file ordering rather than on the behaviour under test, so it provisions
-- its own invoice and its own single finalized PDF.
-- ---------------------------------------------------------------------------
do $$
declare
  v_invoice uuid;
  v_source uuid;
  v_pointer uuid;
  v_pdf uuid;
  v_found boolean;
  v_bucket text;
  v_path text;
begin
  perform public.test_become(test_id('admin'));

  insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
                                     issue_date, due_date, net_total_cents, vat_total_cents, gross_total_cents)
  values (test_id('entity'), test_id('org_a'), 'issued', 'RE-PUBLISH-1',
          current_date - 3, current_date + 11, 50000, 9500, 59500)
  returning id into v_invoice;

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type,
    source_resource_id, version, status, template_version, source_hash, pdf_storage_path, render_metadata)
  values (test_id('entity'), 'invoice', 'owner_invoices', v_invoice, 1, 'finalized', 'v1',
          'hash-publish-1', 'invoices/publish-1.pdf', '{}'::jsonb)
  returning id into v_source;

  perform public.link_customer_project_invoice(test_id('project_a'), v_invoice);

  -- Before publishing: the customer sees the invoice but no PDF.
  perform public.test_become(test_id('user_a'));
  select pdf_document_id, true into v_pdf, v_found
  from public.list_customer_invoices(null) where invoice_id = v_invoice;
  if not coalesce(v_found, false) then
    raise exception 'TEST FAILED: the issued invoice is not visible to its own customer at all';
  end if;
  if v_pdf is not null then
    raise exception 'TEST FAILED: an unpublished invoice PDF was already exposed as pdf_document_id (%)', v_pdf;
  end if;

  -- Register + release, exactly as the owner UI does.
  perform public.test_become(test_id('admin'));
  v_pointer := public.register_customer_document_from_owner_source(
    test_id('org_a'), test_id('project_a'), 'invoice', 'Rechnung RE-PUBLISH-1', v_source);

  -- Registering alone must not expose it: release is a separate, deliberate act.
  perform public.test_become(test_id('user_a'));
  select pdf_document_id into v_pdf
  from public.list_customer_invoices(null) where invoice_id = v_invoice;
  if v_pdf is not null then
    raise exception 'TEST FAILED: registering exposed the PDF without an explicit release (%)', v_pdf;
  end if;

  perform public.test_become(test_id('admin'));
  perform public.set_customer_document_visibility(v_pointer, true);

  perform public.test_become(test_id('user_a'));
  select pdf_document_id into v_pdf
  from public.list_customer_invoices(null) where invoice_id = v_invoice;
  if v_pdf is distinct from v_pointer then
    raise exception 'TEST FAILED: list_customer_invoices returned pdf_document_id=% for the released pointer %',
      coalesce(v_pdf::text, 'null'), v_pointer;
  end if;

  -- ...and the customer can actually authorize a download of it, resolving to the
  -- CANONICAL owner bucket and the canonical object — never a second copy.
  select bucket_id, object_path into v_bucket, v_path
  from public.authorize_customer_document_download(test_id('user_a'), v_pdf);
  if v_bucket <> 'owner-finance-documents' or v_path <> 'invoices/publish-1.pdf' then
    raise exception 'TEST FAILED: released invoice PDF authorized to (%, %), expected the canonical owner object',
      coalesce(v_bucket, '<none>'), coalesce(v_path, '<none>');
  end if;

  -- Revoke: the invoice stays, the PDF goes.
  perform public.test_become(test_id('admin'));
  perform public.set_customer_document_visibility(v_pointer, false);

  perform public.test_become(test_id('user_a'));
  select pdf_document_id into v_pdf
  from public.list_customer_invoices(null) where invoice_id = v_invoice;
  if v_pdf is not null then
    raise exception 'TEST FAILED: a revoked invoice PDF is still returned as pdf_document_id (%)', v_pdf;
  end if;
end;
$$;
\echo 'ok: a released invoice pointer surfaces as pdf_document_id; revoking withdraws it'

-- ---------------------------------------------------------------------------
-- TEST: grants unchanged — the replaced function must not have become reachable
-- by anon, and must still be reachable by authenticated.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = 'register_customer_document_from_owner_source'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ) then
    raise exception 'TEST FAILED: register_customer_document_from_owner_source is executable by anon';
  end if;

  if not exists (
    select 1 from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = 'register_customer_document_from_owner_source'
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) then
    raise exception 'TEST FAILED: register_customer_document_from_owner_source is not executable by authenticated';
  end if;

  -- Exactly one overload: a second signature would make PostgREST dispatch ambiguous.
  if (select count(*) from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and p.proname = 'register_customer_document_from_owner_source') <> 1 then
    raise exception 'TEST FAILED: register_customer_document_from_owner_source has more than one overload';
  end if;
end;
$$;
\echo 'ok: publish RPC grants and identity signature unchanged'

drop function public.test_publish_error(uuid, uuid, public.customer_document_category, text, uuid);

select 'customer document publish guard tests: ALL PASSED' as result;
