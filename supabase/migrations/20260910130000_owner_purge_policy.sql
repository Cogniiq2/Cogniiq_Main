-- ===========================================================================
-- Owner deletion policy: two tiers, one explicit dependency map.
--
-- WHAT THIS REPLACES
--
-- 20260910120000 fixed the Papierkorb's dead end by routing every trashed row
-- through one force-delete path. That was too blunt: it made the emergency
-- escape hatch the ordinary way to empty the trash, so a draft nobody ever
-- issued and a paid invoice were destroyed by the same gesture. It also relied
-- on a pg_constraint walk that cleared only RESTRICT/NO ACTION children — which
-- leaves real orphans, because the rows that matter most hang off SET NULL keys
-- (owner_payments.invoice_id, owner_finance_documents.invoice_id) or off no key
-- at all (owner_generated_documents is polymorphic; owner_revenue_contracts has
-- no FK to its customer or offer). A catalog walk cannot see those.
--
-- THE POLICY
--
--   TIER 1 — ordinary purge (owner_workspace_purge_items).
--     For a trashed record that never became accounting-relevant: a draft that
--     was never issued, an offer that was never finalized, an unpaid expense
--     with no document. It is destroyed completely — every dependent row, every
--     Storage object — behind a plain confirmation. No typed phrase.
--
--   TIER 2 — emergency purge (owner_force_purge_items / owner_force_delete_customer).
--     The escape hatch for a record that IS accounting-relevant. Same complete
--     destruction, but it demands the typed phrase and a written reason, and it
--     is the only path allowed to touch an issued invoice.
--
--   Both write an append-only tombstone before anything is destroyed. The
--   ordinary UI still preserves, archives or cancels accounting records; tier 2
--   is never what "Löschen" does.
--
-- HOW "ACCOUNTING-RELEVANT" IS DECIDED
--
-- Derived from immutable facts, never declared by a flag. An `is_test` column
-- would be mutable, forgeable and would drift: somebody sets it on a record that
-- later gets issued, and the flag now authorises destroying a real invoice. The
-- facts cannot drift — an invoice that has a number was issued, an offer with a
-- finalized_version was finalized, a payment row is money that moved. That is
-- the distinction, and owner_record_accounting_relevance() is its single source
-- of truth: nothing else in this file re-derives it.
--
-- HOW DEPENDENCIES ARE HANDLED
--
-- One explicit, ordered map per scope (owner_purge_dependencies), reviewable as
-- a table rather than inferred at run time. Every entry declares a mode:
--
--   delete   the row has no meaning without its parent, and would otherwise be
--            orphaned by a SET NULL key or left behind by no key at all
--   detach   the row is independent history that merely links here (an import
--            record belongs to its import batch, a posting to its contract);
--            the link is cleared deliberately, and this is documented per entry
--   cascade  the FK already says DELETE CASCADE and Postgres does it correctly;
--            declared so the completeness check can account for it, and verified
--            afterwards rather than assumed
--
-- No foreign key is weakened and no new cascade is added. After every purge,
-- owner_purge_assert_no_orphans re-walks the ENTIRE inbound FK graph plus the
-- registered soft references and raises if a single row still points at the id
-- that was just destroyed. A dependency the map forgot is a loud failure inside
-- the transaction, not a silent orphan — which is what keeps the map honest as
-- the schema grows.
--
-- Depends on: 20260903120000, 20260910120000
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Soft references: columns that point at these records with no foreign key.
--
--    Invisible to any catalog walk, and therefore the orphans nobody notices.
--    owner_generated_documents is polymorphic (source_resource_type +
--    source_resource_id), owner_revenue_contracts simply has no FK, and
--    owner_workspace_item_state deliberately has none so organising a record
--    costs no referential coupling.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_soft_references()
returns table (scope text, ref_table text, ref_column text, extra_predicate text)
language sql immutable set search_path = public, pg_temp as $$
  select * from (values
    ('invoice',  'owner_generated_documents',  'source_resource_id', $x$source_resource_type = 'owner_invoices'$x$),
    ('invoice',  'owner_workspace_item_state', 'resource_id',        $x$scope = 'invoice'$x$),
    ('offer',    'owner_generated_documents',  'source_resource_id', $x$source_resource_type = 'owner_offers'$x$),
    ('offer',    'owner_workspace_item_state', 'resource_id',        $x$scope = 'offer'$x$),
    ('offer',    'owner_revenue_contracts',    'source_offer_id',    null),
    ('expense',  'owner_workspace_item_state', 'resource_id',        $x$scope = 'expense'$x$),
    ('customer', 'owner_revenue_contracts',    'owner_customer_id',  null)
  ) as t(scope, ref_table, ref_column, extra_predicate);
$$;

comment on function public.owner_purge_soft_references() is
  'Columns referencing owner records without a foreign key. Registered so the purge map covers them and the orphan check can see them.';

commit;

-- ---------------------------------------------------------------------------
-- 2. Accounting relevance. The one place that decides it.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_record_accounting_relevance(p_scope text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  i record; o record; e record; c record;
  r text[] := array[]::text[];
  v_payments int; v_docs int; v_generated int; v_tokens int; v_accept int;
  v_projects int; v_published int; v_subs int; v_contracts int;
begin
  if p_scope = 'invoice' then
    select * into i from public.owner_invoices where id = p_id;
    if i.id is null then return null; end if;

    select count(*) into v_payments  from public.owner_payments where invoice_id = p_id;
    select count(*) into v_docs      from public.owner_finance_documents where invoice_id = p_id;
    select count(*) into v_generated from public.owner_generated_documents
      where source_resource_type = 'owner_invoices' and source_resource_id = p_id;
    select count(*) into v_projects  from public.customer_project_invoices where invoice_id = p_id;
    select count(*) into v_published from public.customer_documents d
      join public.owner_generated_documents g on g.id = d.owner_generated_document_id
     where g.source_resource_type = 'owner_invoices' and g.source_resource_id = p_id
       and d.published_at is not null;

    -- A number is the point of no return: it was allocated from the entity's
    -- counter and the document went out under it. `cancelled` implies it, which
    -- is why a Storno is protected and a never-issued `void` draft is not.
    if i.invoice_number is not null then r := array_append(r, 'invoice_number_allocated'); end if;
    if i.issued_at is not null then r := array_append(r, 'issued'); end if;
    if i.status not in ('draft', 'void') then r := array_append(r, 'status_' || i.status); end if;
    if v_payments > 0 then r := array_append(r, 'has_payments'); end if;
    if coalesce(i.amount_paid_cents, 0) <> 0 then r := array_append(r, 'money_received'); end if;
    if v_docs > 0 then r := array_append(r, 'has_documents'); end if;
    if v_generated > 0 then r := array_append(r, 'has_generated_documents'); end if;
    if v_projects > 0 then r := array_append(r, 'linked_to_customer_project'); end if;
    if v_published > 0 then r := array_append(r, 'published_to_customer_portal'); end if;

    return jsonb_build_object(
      'scope', p_scope, 'relevant', array_length(r, 1) is not null, 'reasons', to_jsonb(r),
      'label', coalesce(i.invoice_number, 'Entwurf'),
      'facts', jsonb_build_object('status', i.status, 'invoice_number', i.invoice_number,
        'issued_at', i.issued_at, 'payments', v_payments, 'documents', v_docs,
        'generated_documents', v_generated, 'published_documents', v_published));

  elsif p_scope = 'offer' then
    select * into o from public.owner_offers where id = p_id;
    if o.id is null then return null; end if;

    select count(*) into v_generated from public.owner_generated_documents
      where source_resource_type = 'owner_offers' and source_resource_id = p_id;
    select count(*) into v_tokens from public.owner_document_access_tokens where offer_id = p_id;
    select count(*) into v_accept from public.owner_offer_acceptance_events where offer_id = p_id;
    select count(*) into v_contracts from public.owner_revenue_contracts where source_offer_id = p_id;
    select count(*) into v_published from public.customer_documents d
      join public.owner_generated_documents g on g.id = d.owner_generated_document_id
     where g.source_resource_type = 'owner_offers' and g.source_resource_id = p_id
       and d.published_at is not null;

    -- An offer that was never finalized never became a binding document, however
    -- far through the pipeline it got. That is category 2: rejected, expired or
    -- abandoned drafts are genuinely disposable.
    if o.finalized_version is not null then r := array_append(r, 'finalized'); end if;
    if o.offer_number is not null then r := array_append(r, 'offer_number_allocated'); end if;
    if o.converted_invoice_id is not null then r := array_append(r, 'converted_to_invoice'); end if;
    if v_generated > 0 then r := array_append(r, 'has_generated_documents'); end if;
    if v_tokens > 0 then r := array_append(r, 'has_access_tokens'); end if;
    if v_accept > 0 then r := array_append(r, 'has_acceptance_evidence'); end if;
    if v_contracts > 0 then r := array_append(r, 'has_revenue_contract'); end if;
    if v_published > 0 then r := array_append(r, 'published_to_customer_portal'); end if;

    return jsonb_build_object(
      'scope', p_scope, 'relevant', array_length(r, 1) is not null, 'reasons', to_jsonb(r),
      'label', coalesce(o.offer_number, o.title, 'Entwurf'),
      'facts', jsonb_build_object('status', o.status, 'offer_number', o.offer_number,
        'finalized_version', o.finalized_version, 'generated_documents', v_generated,
        'access_tokens', v_tokens, 'acceptance_events', v_accept));

  elsif p_scope = 'expense' then
    select * into e from public.owner_expenses where id = p_id;
    if e.id is null then return null; end if;

    select count(*) into v_payments from public.owner_payments where expense_id = p_id;
    select count(*) into v_docs from public.owner_finance_documents where expense_id = p_id;

    -- review_status stays out of it. "Geprüft" is a workflow marker, not an
    -- accounting dependency, and treating it as one is what forced the owner
    -- into the Supabase table editor in the first place.
    if v_payments > 0 then r := array_append(r, 'has_payments'); end if;
    if coalesce(e.amount_paid_cents, 0) <> 0 then r := array_append(r, 'money_paid'); end if;
    if v_docs > 0 then r := array_append(r, 'has_documents'); end if;

    return jsonb_build_object(
      'scope', p_scope, 'relevant', array_length(r, 1) is not null, 'reasons', to_jsonb(r),
      'label', coalesce(e.supplier_invoice_number, 'Beleg'),
      'facts', jsonb_build_object('payments', v_payments, 'documents', v_docs,
        'amount_paid_cents', coalesce(e.amount_paid_cents, 0)));

  elsif p_scope = 'customer' then
    select * into c from public.owner_customers where id = p_id;
    if c.id is null then return null; end if;

    -- A customer is relevant exactly when something hanging off it is. Its own
    -- invoices and offers are re-asked rather than re-derived, so one definition
    -- of "issued" governs both surfaces.
    select count(*) into v_payments from public.owner_payments where owner_customer_id = p_id;
    select count(*) into v_subs from public.owner_subscriptions where owner_customer_id = p_id;
    select count(*) into v_contracts from public.owner_revenue_contracts where owner_customer_id = p_id;
    select count(*) into v_docs from public.owner_invoices inv
     where inv.owner_customer_id = p_id
       and (public.owner_record_accounting_relevance('invoice', inv.id) ->> 'relevant')::boolean;
    select count(*) into v_generated from public.owner_offers off
     where off.owner_customer_id = p_id
       and (public.owner_record_accounting_relevance('offer', off.id) ->> 'relevant')::boolean;

    if v_docs > 0 then r := array_append(r, 'has_issued_invoices'); end if;
    if v_generated > 0 then r := array_append(r, 'has_binding_offers'); end if;
    if v_payments > 0 then r := array_append(r, 'has_payments'); end if;
    if v_subs > 0 then r := array_append(r, 'has_subscriptions'); end if;
    if v_contracts > 0 then r := array_append(r, 'has_revenue_contracts'); end if;

    return jsonb_build_object(
      'scope', p_scope, 'relevant', array_length(r, 1) is not null, 'reasons', to_jsonb(r),
      'label', coalesce(c.company, c.contact_name, c.email, 'Kunde'),
      'facts', jsonb_build_object('issued_invoices', v_docs, 'binding_offers', v_generated,
        'payments', v_payments, 'subscriptions', v_subs, 'revenue_contracts', v_contracts));
  end if;

  return null;
end;
$$;

/**
 * Who the record was against, captured as VALUES rather than an id.
 *
 * The id alone is not enough: an emergency purge of a customer destroys its invoices in the same
 * transaction, so a tombstone holding only owner_customer_id would point at nothing by the time
 * anyone read it. The name and email are copied in.
 */
create or replace function public.owner_counterparty_snapshot(p_customer_id uuid, p_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare c record; o record;
begin
  if p_customer_id is not null then
    select company, contact_name, email, organization_id into c
      from public.owner_customers where id = p_customer_id;
    if found then
      return jsonb_build_object('owner_customer_id', p_customer_id,
        'company', c.company, 'contact_name', c.contact_name, 'email', c.email,
        'organization_id', coalesce(c.organization_id, p_organization_id));
    end if;
  end if;
  if p_organization_id is not null then
    select name into o from public.organizations where id = p_organization_id;
    return jsonb_build_object('organization_id', p_organization_id, 'name', o.name);
  end if;
  return jsonb_build_object('owner_customer_id', p_customer_id, 'organization_id', p_organization_id);
end;
$$;

comment on function public.owner_record_accounting_relevance(text, uuid) is
  'The single definition of "this record became accounting-relevant", derived from immutable facts (number allocated, issued, finalized, money moved, document published) rather than any mutable flag.';

commit;


-- ---------------------------------------------------------------------------
-- 2b. The record as it was, now including who it was against.
--
--     Restated from 20260910120000 for one reason: `counterparty`. Everything
--     else is unchanged. Lazar's tombstone contract asks for a counterparty
--     identifier OR snapshot, and a bare id is the weaker of the two — a
--     customer purge destroys its invoices in the same transaction, so the id
--     would already dangle by the time the tombstone is read.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_delete_summary(p_scope text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare i record; o record; e record; c record;
begin
  if p_scope = 'invoice' then
    select * into i from public.owner_invoices where id = p_id;
    if i.id is null then return null; end if;
    return jsonb_build_object(
      'entity_type', 'invoice', 'entity_id', p_id,
      'label', i.invoice_number, 'reference_number', i.invoice_number, 'status', i.status,
      'issue_date', i.issue_date, 'service_date', i.service_date, 'due_date', i.due_date,
      'issued_at', i.issued_at, 'cancelled_at', i.cancelled_at,
      'currency', i.currency, 'net_total_cents', i.net_total_cents,
      'vat_total_cents', i.vat_total_cents, 'gross_total_cents', i.gross_total_cents,
      'amount_paid_cents', i.amount_paid_cents,
      'counterparty', public.owner_counterparty_snapshot(i.owner_customer_id, i.organization_id));

  elsif p_scope = 'offer' then
    select * into o from public.owner_offers where id = p_id;
    if o.id is null then return null; end if;
    return jsonb_build_object(
      'entity_type', 'offer', 'entity_id', p_id,
      'label', coalesce(o.offer_number, o.title), 'reference_number', o.offer_number,
      'title', o.title, 'status', o.status,
      'issue_date', o.issue_date, 'valid_until', o.valid_until, 'created_at', o.created_at,
      'currency', o.currency, 'net_total_cents', o.net_total_cents,
      'vat_total_cents', o.vat_total_cents, 'gross_total_cents', o.gross_total_cents,
      'finalized_version', o.finalized_version, 'converted_invoice_id', o.converted_invoice_id,
      'counterparty', public.owner_counterparty_snapshot(o.owner_customer_id, o.organization_id));

  elsif p_scope = 'expense' then
    select * into e from public.owner_expenses where id = p_id;
    if e.id is null then return null; end if;
    return jsonb_build_object(
      'entity_type', 'expense', 'entity_id', p_id,
      'label', coalesce(e.supplier_invoice_number, 'Beleg'),
      'reference_number', e.supplier_invoice_number,
      'invoice_date', e.invoice_date, 'service_date', e.service_date, 'due_date', e.due_date,
      'currency', e.currency, 'net_total_cents', e.net_total_cents,
      'vat_total_cents', e.vat_total_cents, 'gross_total_cents', e.gross_total_cents,
      'amount_paid_cents', e.amount_paid_cents,
      'counterparty', public.owner_counterparty_snapshot(e.owner_customer_id, e.organization_id));

  elsif p_scope = 'customer' then
    select * into c from public.owner_customers where id = p_id;
    if c.id is null then return null; end if;
    return jsonb_build_object(
      'entity_type', 'customer', 'entity_id', p_id,
      'label', coalesce(c.company, c.contact_name, c.email, p_id::text),
      'company', c.company, 'contact_name', c.contact_name, 'email', c.email,
      'status', c.status, 'created_at', c.created_at,
      'counterparty', public.owner_counterparty_snapshot(p_id, c.organization_id));
  end if;
  return null;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 3. The explicit dependency map.
--
--    Ordered leaf-first. `predicate` is applied to the dependent table with $1
--    bound to the root id. Read top to bottom, this IS the deletion order.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_dependencies(p_scope text)
returns table (step int, dep_table text, mode text, predicate text, null_columns text[], note text)
language sql stable set search_path = public, pg_temp as $$
  select step, dep_table, mode, predicate, null_columns, note
  from (values
    -- ============================== INVOICE ==============================
    -- Portal copies first: customer_documents.owner_generated_document_id is
    -- RESTRICT, so a published copy blocks the generated document it came from.
    (1,  'invoice', 'customer_documents', 'delete',
     $p$owner_generated_document_id in (select id from public.owner_generated_documents
        where source_resource_type = 'owner_invoices' and source_resource_id = $1)$p$,
     null::text[], 'Portal copy of a document that is about to cease to exist. RESTRICT: must go first.'),
    (2,  'invoice', 'owner_document_access_tokens', 'detach',
     $p$document_id in (select id from public.owner_generated_documents
        where source_resource_type = 'owner_invoices' and source_resource_id = $1)$p$,
     array['document_id'], 'A share link survives as an audit row; only its target is cleared.'),
    (3,  'invoice', 'owner_automation_jobs', 'delete', $p$invoice_id = $1$p$,
     null::text[], 'Send jobs for an invoice that will not exist have nothing left to do.'),
    (4,  'invoice', 'owner_automation_jobs', 'detach',
     $p$output_document_id in (select id from public.owner_generated_documents
        where source_resource_type = 'owner_invoices' and source_resource_id = $1)$p$,
     array['output_document_id'], 'Jobs for other records that happen to point at this PDF.'),
    (5,  'invoice', 'owner_elster_submissions', 'detach',
     $p$protocol_document_id in (select id from public.owner_generated_documents
        where source_resource_type = 'owner_invoices' and source_resource_id = $1)$p$,
     array['protocol_document_id'], 'An ELSTER submission is its own filing record and stays.'),
    (6,  'invoice', 'owner_generated_documents', 'delete',
     $p$source_resource_type = 'owner_invoices' and source_resource_id = $1$p$,
     null::text[], 'Soft reference — no FK. STORAGE: pdf_storage_path.'),
    (7,  'invoice', 'owner_finance_documents', 'delete', $p$invoice_id = $1$p$,
     null::text[], 'SET NULL would orphan the row and strand its Storage object. STORAGE.'),
    (8,  'invoice', 'owner_payments', 'delete', $p$invoice_id = $1$p$,
     null::text[], 'SET NULL would leave a payment belonging to no invoice. Tier 1 never reaches this: eligibility refuses an invoice with payments.'),
    (9,  'invoice', 'owner_revenue_contract_postings', 'detach', $p$invoice_id = $1$p$,
     array['invoice_id'], 'A posting belongs to its revenue contract, not to this invoice.'),
    (10, 'invoice', 'owner_finance_import_records', 'detach', $p$invoice_id = $1$p$,
     array['invoice_id'], 'An import record belongs to its batch and is import history.'),
    (11, 'invoice', 'owner_offers', 'detach', $p$converted_invoice_id = $1$p$,
     array['converted_invoice_id'], 'The offer is an independent record.'),
    (12, 'invoice', 'owner_workspace_item_state', 'delete', $p$scope = 'invoice' and resource_id = $1$p$,
     null::text[], 'Soft reference — no FK. Folder/trash state for a record that is gone.'),
    (13, 'invoice', 'customer_project_invoices', 'cascade', $p$invoice_id = $1$p$, null::text[], 'FK CASCADE.'),
    (14, 'invoice', 'owner_invoice_lines', 'cascade', $p$invoice_id = $1$p$, null::text[],
     'FK CASCADE, and it must stay that way: owner_guard_invoice_line refuses a line delete while a non-draft parent still exists, and passes only because the parent row goes first.'),
    (15, 'invoice', 'owner_invoice_versions', 'cascade', $p$invoice_id = $1$p$, null::text[], 'FK CASCADE.'),

    -- =============================== OFFER ===============================
    (1,  'offer', 'customer_documents', 'delete',
     $p$owner_generated_document_id in (select id from public.owner_generated_documents
        where source_resource_type = 'owner_offers' and source_resource_id = $1)$p$,
     null::text[], 'Portal copy. RESTRICT: must go first.'),
    (2,  'offer', 'owner_automation_jobs', 'delete', $p$offer_id = $1$p$,
     null::text[], 'Send jobs for an offer that will not exist.'),
    (3,  'offer', 'owner_automation_jobs', 'detach',
     $p$output_document_id in (select id from public.owner_generated_documents
        where source_resource_type = 'owner_offers' and source_resource_id = $1)$p$,
     array['output_document_id'], 'Jobs pointing at this PDF from elsewhere.'),
    (4,  'offer', 'owner_document_access_events', 'delete', $p$offer_id = $1$p$,
     null::text[], 'Access log about a document that will not exist. Deleted before its token (token_id FK).'),
    (5,  'offer', 'owner_generated_documents', 'delete',
     $p$source_resource_type = 'owner_offers' and source_resource_id = $1$p$,
     null::text[], 'Soft reference — no FK. STORAGE: pdf_storage_path.'),
    (6,  'offer', 'owner_revenue_contracts', 'detach', $p$source_offer_id = $1$p$,
     array['source_offer_id'], 'Soft reference — no FK. The contract is live commercial state and stays.'),
    (7,  'offer', 'owner_workspace_item_state', 'delete', $p$scope = 'offer' and resource_id = $1$p$,
     null::text[], 'Soft reference — no FK.'),
    (8,  'offer', 'owner_customer_activity', 'detach', $p$related_offer_id = $1$p$,
     array['related_offer_id'], 'Activity is the customer''s history, not the offer''s.'),
    (9,  'offer', 'owner_invoices', 'detach', $p$source_offer_id = $1$p$,
     array['source_offer_id'], 'The invoice is an independent accounting record.'),
    (10, 'offer', 'owner_offer_acceptance_events', 'cascade', $p$offer_id = $1$p$, null::text[],
     'FK CASCADE. STORAGE: signature_storage_path, collected before the delete.'),
    (11, 'offer', 'owner_document_access_tokens', 'cascade', $p$offer_id = $1$p$, null::text[], 'FK CASCADE.'),
    (12, 'offer', 'owner_offer_lines', 'cascade', $p$offer_id = $1$p$, null::text[], 'FK CASCADE.'),
    (13, 'offer', 'owner_offer_versions', 'cascade', $p$offer_id = $1$p$, null::text[], 'FK CASCADE.'),

    -- ============================== EXPENSE ==============================
    (1, 'expense', 'owner_finance_documents', 'delete', $p$expense_id = $1$p$,
     null::text[], 'SET NULL would orphan the row and strand its Storage object. STORAGE.'),
    (2, 'expense', 'owner_payments', 'delete', $p$expense_id = $1$p$,
     null::text[], 'SET NULL would leave a payment belonging to no expense. Tier 1 never reaches this.'),
    (3, 'expense', 'owner_finance_import_records', 'detach', $p$expense_id = $1$p$,
     array['expense_id'], 'Import history belongs to its batch.'),
    (4, 'expense', 'owner_workspace_item_state', 'delete', $p$scope = 'expense' and resource_id = $1$p$,
     null::text[], 'Soft reference — no FK.'),
    (5, 'expense', 'owner_expense_lines', 'cascade', $p$expense_id = $1$p$, null::text[], 'FK CASCADE.'),

    -- ============================= CUSTOMER ==============================
    -- Its documents go through the invoice and offer maps, recursively, before
    -- any of this runs. See owner_purge_destroy_row.
    (1, 'customer', 'owner_payments', 'delete', $p$owner_customer_id = $1$p$,
     null::text[], 'RESTRICT. Tier 1 never reaches this: a customer with payments is protected.'),
    (2, 'customer', 'owner_subscriptions', 'delete', $p$owner_customer_id = $1$p$,
     null::text[], 'RESTRICT. A subscription has no meaning without its customer.'),
    (3, 'customer', 'owner_revenue_contracts', 'detach', $p$owner_customer_id = $1$p$,
     array['owner_customer_id'], 'Soft reference — no FK. The contract is live commercial state.'),
    (4, 'customer', 'owner_expenses', 'detach', $p$owner_customer_id = $1$p$,
     array['owner_customer_id'], 'An expense is OUR cost; the link is only cost allocation.'),
    (5, 'customer', 'owner_offers', 'detach', $p$owner_customer_id = $1$p$,
     array['owner_customer_id'], 'Any offer still here after the recursion is one the map left standing.'),
    (6, 'customer', 'owner_workspace_item_state', 'delete', $p$scope = 'customer' and resource_id = $1$p$,
     null::text[], 'Soft reference — no FK.'),
    (7, 'customer', 'owner_customer_tasks', 'cascade', $p$customer_id = $1$p$, null::text[], 'FK CASCADE.'),
    (8, 'customer', 'owner_customer_activity', 'cascade', $p$customer_id = $1$p$, null::text[], 'FK CASCADE.'),
    (9, 'customer', 'owner_customer_services', 'cascade', $p$customer_id = $1$p$, null::text[], 'FK CASCADE.'),
    (10,'customer', 'owner_service_engagements', 'cascade', $p$customer_id = $1$p$, null::text[], 'FK CASCADE.'),
    (11,'customer', 'owner_engagement_activity', 'cascade', $p$customer_id = $1$p$, null::text[], 'FK CASCADE.')
  ) as t(step, scope, dep_table, mode, predicate, null_columns, note)
  where t.scope = p_scope
  order by t.step;
$$;

comment on function public.owner_purge_dependencies(text) is
  'The explicit, ordered dependency map for a purge. delete = would be orphaned; detach = independent history, link cleared deliberately; cascade = the FK already does it and is verified afterwards.';

commit;

-- ---------------------------------------------------------------------------
-- 4. Storage. Collected BEFORE the rows that carry the paths are destroyed.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_storage_paths(p_scope text, p_id uuid)
returns table (bucket_id text, object_name text)
language sql stable security definer set search_path = public, pg_temp as $$
  -- Invoice: its uploaded documents, its generated PDFs, and the portal copies of those.
  select 'owner-finance-documents'::text, d.storage_object_path
    from public.owner_finance_documents d
   where p_scope = 'invoice' and d.invoice_id = p_id and d.storage_object_path is not null
  union all
  select 'owner-finance-documents'::text, d.storage_object_path
    from public.owner_finance_documents d
   where p_scope = 'expense' and d.expense_id = p_id and d.storage_object_path is not null
  union all
  select 'owner-finance-documents'::text, g.pdf_storage_path
    from public.owner_generated_documents g
   where g.pdf_storage_path is not null
     and ((p_scope = 'invoice' and g.source_resource_type = 'owner_invoices')
       or (p_scope = 'offer'   and g.source_resource_type = 'owner_offers'))
     and g.source_resource_id = p_id
  union all
  select 'customer-documents'::text, cd.storage_path
    from public.customer_documents cd
    join public.owner_generated_documents g on g.id = cd.owner_generated_document_id
   where cd.storage_path is not null
     and ((p_scope = 'invoice' and g.source_resource_type = 'owner_invoices')
       or (p_scope = 'offer'   and g.source_resource_type = 'owner_offers'))
     and g.source_resource_id = p_id
  union all
  -- The drawn signature on an accepted offer lives in its own private bucket.
  select 'owner-offer-signatures'::text, a.signature_storage_path
    from public.owner_offer_acceptance_events a
   where p_scope = 'offer' and a.offer_id = p_id and a.signature_storage_path is not null;
$$;

/**
 * Removes the collected objects and reports exactly what happened to each one.
 *
 * IMPORTANT LIMIT, stated here because it cannot be detected from inside this function: this
 * DELETEs the `storage.objects` METADATA ROW. On a real Supabase project the object's actual
 * bytes live in a separate backend (S3 or equivalent) behind the Storage API service, which is
 * what genuinely removes them when a client calls `storage.from(bucket).remove(paths)`. A plain
 * SQL DELETE against `storage.objects`, run directly against Postgres the way every function in
 * this file runs, does NOT call that service and does NOT by itself guarantee the underlying
 * file is gone — only that Postgres no longer has a row pointing at it. Whether the hosted
 * project also deletes the backing bytes on this DELETE depends on infrastructure this migration
 * cannot see or configure (a storage-side trigger or sync, if one exists). This function can
 * only ever report what IS SQL-visible: expected vs. deleted vs. already-missing metadata rows.
 * A drain worker calling the real Storage API for any row whose bytes need confirming — using
 * the same pg_net + Vault + Edge Function pattern already wired for the automation worker in
 * 20260723127000 — is the way to close that gap for real; this file does not attempt it.
 *
 * Guarded: a bare smoke database has no storage schema.
 */
-- The return type changed (int -> jsonb) partway through this migration's own history; DROP
-- first so `create or replace` never fails with "cannot change return type of existing
-- function" against an environment that already ran an earlier draft of this file.
drop function if exists public.owner_purge_delete_storage(jsonb);

create or replace function public.owner_purge_delete_storage(p_paths jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_expected int; v_deleted int := 0; v_present int;
  v_objects jsonb := '[]'::jsonb; v_deleted_paths jsonb;
begin
  v_expected := coalesce(jsonb_array_length(p_paths), 0);
  if to_regclass('storage.objects') is null or v_expected = 0 then
    return jsonb_build_object('expected', v_expected, 'deleted', 0, 'already_missing', 0, 'objects', '[]'::jsonb);
  end if;

  -- Which of the expected rows are actually there BEFORE the delete, so "already missing" is
  -- measured against reality rather than assumed to be whatever the DELETE did not touch.
  select coalesce(jsonb_agg(jsonb_build_object('bucket_id', o.bucket_id, 'object_name', o.name)), '[]'::jsonb)
    into v_deleted_paths
  from storage.objects o
  join jsonb_to_recordset(p_paths) as p(bucket_id text, object_name text)
    on o.bucket_id = p.bucket_id and o.name = p.object_name;
  v_present := coalesce(jsonb_array_length(v_deleted_paths), 0);

  if v_present > 0 then
    -- Bucket-scoped: a path is unique within its bucket, never across the project.
    execute $q$
      delete from storage.objects o
      using jsonb_to_recordset($1) as p(bucket_id text, object_name text)
      where o.bucket_id = p.bucket_id and o.name = p.object_name
    $q$ using p_paths;
    get diagnostics v_deleted = row_count;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'bucket_id', p.bucket_id, 'object_name', p.object_name,
           'status', case when e.object_name is not null then 'deleted' else 'already_missing' end)),
         '[]'::jsonb)
    into v_objects
  from jsonb_to_recordset(p_paths) as p(bucket_id text, object_name text)
  left join jsonb_to_recordset(v_deleted_paths) as e(bucket_id text, object_name text)
    on e.bucket_id = p.bucket_id and e.object_name = p.object_name;

  return jsonb_build_object(
    'expected', v_expected, 'deleted', v_deleted,
    'already_missing', v_expected - v_present, 'objects', v_objects);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 5. The orphan check. What keeps the map honest.
--
--    Re-walks EVERY inbound foreign key plus every registered soft reference
--    and raises if one row still points at the destroyed id. A dependency the
--    map forgot fails loudly inside the transaction instead of leaving a row
--    behind that nobody will ever look for.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_assert_no_orphans(p_scope text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_n bigint; v_root text := public.owner_force_delete_table(p_scope);
begin
  for r in
    select distinct src.relname::text as t, a.attname::text as c
    from pg_constraint fk
    join pg_class src on src.oid = fk.conrelid
    join pg_namespace n on n.oid = src.relnamespace
    join pg_class tgt on tgt.oid = fk.confrelid
    join pg_namespace tn on tn.oid = tgt.relnamespace
    cross join lateral unnest(fk.conkey, fk.confkey) as u(ck, pk)
    join pg_attribute a on a.attrelid = fk.conrelid and a.attnum = u.ck
    join pg_attribute pa on pa.attrelid = fk.confrelid and pa.attnum = u.pk
    where fk.contype = 'f' and tn.nspname = 'public' and n.nspname = 'public'
      and tgt.relname = v_root and pa.attname = 'id'
  loop
    execute format('select count(*) from public.%I where %I = $1', r.t, r.c) into v_n using p_id;
    if v_n > 0 then
      raise exception 'purge left % row(s) in %.% referencing % — the dependency map is incomplete',
        v_n, r.t, r.c, p_id;
    end if;
  end loop;

  for r in select ref_table as t, ref_column as c, extra_predicate as p
             from public.owner_purge_soft_references() where scope = p_scope
  loop
    execute format('select count(*) from public.%I where %I = $1%s', r.t, r.c,
                   case when r.p is null then '' else ' and ' || r.p end)
      into v_n using p_id;
    if v_n > 0 then
      raise exception 'purge left % soft-referencing row(s) in %.% for %', v_n, r.t, r.c, p_id;
    end if;
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6. The destroyer. One implementation, both tiers.
--
--    p_allow_accounting is the ONLY difference between them, and it does exactly
--    one thing: it sets the transaction-local token that owner_guard_invoice and
--    the published-document guard honour. Tier 1 leaves it unset, so even if the
--    eligibility rules above were wrong, the database still refuses to destroy
--    an issued invoice or a published portal document through the ordinary path.
-- ---------------------------------------------------------------------------
begin;

/**
 * Merges one nested owner_purge_destroy_row() result into an accumulator.
 *
 * Every plain numeric key (a table name, `_storage_objects`) sums normally. `_storage_cleanup`
 * is structured — expected/deleted/already_missing/objects — and is merged field-by-field with
 * its `objects` arrays concatenated, so a customer-level tombstone ends up with the SAME level
 * of storage-cleanup detail a single invoice's own tombstone gets, for every invoice and offer
 * the cascade actually touched, not just the customer's own direct dependents.
 *
 * Without this, the customer recursion in owner_purge_destroy_row used to `perform` (discard)
 * each nested call's result and track only how many children were processed — real work, but an
 * incomplete audit trail: the tombstone could not show which Storage objects were touched by a
 * cascaded invoice, only that "N invoices were nested".
 */
create or replace function public.owner_purge_merge_counts(p_acc jsonb, p_next jsonb)
returns jsonb language plpgsql immutable set search_path = public, pg_temp as $$
declare v_out jsonb; k text; v_acc_sc jsonb; v_next_sc jsonb;
begin
  v_out := coalesce(p_acc, '{}'::jsonb);
  if p_next is null then return v_out; end if;

  for k in select jsonb_object_keys(p_next) loop
    if k = '_storage_cleanup' then continue; end if;  -- merged separately below
    if jsonb_typeof(p_next -> k) = 'number' then
      v_out := v_out || jsonb_build_object(k, coalesce((v_out ->> k)::bigint, 0) + (p_next ->> k)::bigint);
    end if;
  end loop;

  if p_next ? '_storage_cleanup' then
    v_acc_sc := coalesce(v_out -> '_storage_cleanup', jsonb_build_object(
      'expected', 0, 'deleted', 0, 'already_missing', 0, 'objects', '[]'::jsonb));
    v_next_sc := p_next -> '_storage_cleanup';
    v_out := v_out || jsonb_build_object('_storage_cleanup', jsonb_build_object(
      'expected', coalesce((v_acc_sc ->> 'expected')::int, 0) + coalesce((v_next_sc ->> 'expected')::int, 0),
      'deleted', coalesce((v_acc_sc ->> 'deleted')::int, 0) + coalesce((v_next_sc ->> 'deleted')::int, 0),
      'already_missing', coalesce((v_acc_sc ->> 'already_missing')::int, 0) + coalesce((v_next_sc ->> 'already_missing')::int, 0),
      'objects', coalesce(v_acc_sc -> 'objects', '[]'::jsonb) || coalesce(v_next_sc -> 'objects', '[]'::jsonb)));
  end if;

  return v_out;
end;
$$;

create or replace function public.owner_purge_destroy_row(
  p_scope text, p_id uuid, p_allow_accounting boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r record; v_root text; v_sql text; v_n bigint; v_locked uuid; v_rel jsonb;
  v_counts jsonb := '{}'::jsonb; v_paths jsonb; v_storage jsonb; v_child uuid;
begin
  v_root := public.owner_force_delete_table(p_scope);
  if v_root is null then raise exception 'scope_not_supported'; end if;

  -- ---------------------------------------------------------------------
  -- THE race-condition gate. Read this before anything below it.
  --
  -- Everything that decided this record was safe to destroy — the preflight in
  -- owner_workspace_purge_items, the manifest the confirmation dialog showed —
  -- ran as a separate, earlier statement. Under READ COMMITTED (Postgres's
  -- default and what every function here runs at), a concurrent transaction
  -- can commit a new payment, a new issuance, a new finalized offer in the gap
  -- between that check and this one — and owner_payments carries no BEFORE
  -- DELETE guard at all, so a payment that lands in that gap would otherwise
  -- be swept into the dependency-map deletes below with nothing to stop it.
  -- This was proven empirically (two real concurrent sessions, not a sequential
  -- simulation) before this gate existed: a payment recorded mid-purge was
  -- destroyed silently, the RPC reported success, and the payment appears in
  -- `destroyed` as if it had always been part of the purge.
  --
  -- The fix is the standard Postgres pattern for exactly this shape of race:
  -- lock the root row FOR UPDATE FIRST, before reading or deleting anything.
  -- From here on, any concurrent statement that would change what this record
  -- IS — a payment insert, an invoice issuance, an offer finalization, a new
  -- child row referencing this id via a foreign key — must itself acquire at
  -- least a FOR KEY SHARE lock on this row (Postgres does this automatically
  -- for every FK-validating INSERT/UPDATE against a referenced row, precisely
  -- to guard against the referenced row disappearing mid-flight). FOR KEY
  -- SHARE conflicts with FOR UPDATE, so any such statement now blocks until
  -- this transaction ends — it can never commit invisibly inside the window.
  --
  -- With the row genuinely locked, the relevance check below sees a state that
  -- cannot change out from under it: nothing new can have committed since the
  -- lock was taken, and nothing can commit before this transaction resolves.
  -- For tier 1 (p_allow_accounting = false) a newly-relevant record aborts the
  -- whole purge rather than proceeding on the stale answer. Tier 2 does not
  -- abort — it is the path that destroys relevant records on purpose — but it
  -- still takes the lock, so its own dependency deletes and the counts it
  -- returns are exact rather than a race-widened undercount.
  execute format('select id from public.%I where id = $1 for update', v_root)
    into v_locked using p_id;
  if v_locked is null then
    -- Already gone — a concurrent purge of the same record, most likely.
    -- Idempotent: nothing to destroy, nothing to report.
    return '{}'::jsonb;
  end if;

  if not p_allow_accounting then
    v_rel := public.owner_record_accounting_relevance(p_scope, p_id);
    if v_rel is not null and (v_rel ->> 'relevant')::boolean then
      raise exception 'purge_race_accounting_relevant';
    end if;
  end if;

  if p_allow_accounting then
    perform set_config('cogniiq.force_delete_id', p_id::text, true);
  end if;

  -- Storage paths first, while the rows carrying them still exist.
  select coalesce(jsonb_agg(jsonb_build_object('bucket_id', s.bucket_id, 'object_name', s.object_name)), '[]'::jsonb)
    into v_paths from public.owner_purge_storage_paths(p_scope, p_id) s;

  -- A customer's own invoices and offers are purged through their own maps, so
  -- their documents, PDFs and Storage objects are handled by the same rules that
  -- govern them individually rather than by a second, divergent code path.
  if p_scope = 'customer' then
    for v_child in select id from public.owner_invoices where owner_customer_id = p_id loop
      v_counts := v_counts || jsonb_build_object('_nested_invoice',
        coalesce((v_counts ->> '_nested_invoice')::bigint, 0) + 1);
      -- Captured and merged, not discarded: a customer-level tombstone needs the same
      -- storage-cleanup detail a single invoice's own tombstone gets.
      v_counts := public.owner_purge_merge_counts(v_counts,
        public.owner_purge_destroy_row('invoice', v_child, p_allow_accounting));
    end loop;
    for v_child in select id from public.owner_offers where owner_customer_id = p_id loop
      v_counts := v_counts || jsonb_build_object('_nested_offer',
        coalesce((v_counts ->> '_nested_offer')::bigint, 0) + 1);
      v_counts := public.owner_purge_merge_counts(v_counts,
        public.owner_purge_destroy_row('offer', v_child, p_allow_accounting));
    end loop;
    -- The token is transaction-local but the recursion above cleared it on its
    -- way out; re-arm it for this row's own dependents.
    if p_allow_accounting then
      perform set_config('cogniiq.force_delete_id', p_id::text, true);
    end if;
  end if;

  for r in select * from public.owner_purge_dependencies(p_scope) loop
    if r.mode = 'delete' then
      v_sql := format('delete from public.%I where %s', r.dep_table, r.predicate);
    elsif r.mode = 'detach' then
      v_sql := format('update public.%I set %s where %s', r.dep_table,
        (select string_agg(format('%I = null', col), ', ') from unnest(r.null_columns) col),
        r.predicate);
    else
      continue;  -- 'cascade': the FK does it, and owner_purge_assert_no_orphans proves it did.
    end if;

    execute v_sql using p_id;
    get diagnostics v_n = row_count;
    if v_n > 0 then
      v_counts := v_counts || jsonb_build_object(
        r.dep_table || case when r.mode = 'detach' then ' (entkoppelt)' else '' end,
        coalesce((v_counts ->> (r.dep_table || case when r.mode = 'detach' then ' (entkoppelt)' else '' end))::bigint, 0) + v_n);
    end if;
  end loop;

  execute format('delete from public.%I where id = $1', v_root) using p_id;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object(v_root, coalesce((v_counts ->> v_root)::bigint, 0) + v_n);

  perform public.owner_purge_assert_no_orphans(p_scope, p_id);

  -- `_storage_objects` stays a plain count for manifestLines/BlastRadiusPanel, which only ever
  -- render a number. `_storage_cleanup` carries the full expected/deleted/already-missing detail
  -- into the tombstone, which is where it becomes a visible, permanent, queryable record rather
  -- than a number nobody can act on later. See owner_purge_delete_storage for what "deleted"
  -- can and cannot mean here.
  --
  -- MERGED, not assigned: for a customer, the recursion above already merged each nested
  -- invoice/offer's own storage-cleanup detail into v_counts. This level's OWN storage cleanup
  -- (v_paths collected at the top of this call, empty for 'customer' — a customer row carries no
  -- storage path itself) has to be folded in on top of that, not replace it; a plain assignment
  -- here silently discarded every nested invoice's storage-cleanup record.
  v_storage := public.owner_purge_delete_storage(v_paths);
  v_counts := public.owner_purge_merge_counts(v_counts, jsonb_build_object(
    '_storage_objects', coalesce((v_storage ->> 'deleted')::int, 0),
    '_storage_cleanup', v_storage));

  perform set_config('cogniiq.force_delete_id', '', true);
  return v_counts;
end;
$$;

/** The dry run the confirmation dialog shows. Counts, never deletes. */
create or replace function public.owner_purge_manifest(p_scope text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  r record; v_root text; v_n bigint; v_out jsonb := '{}'::jsonb; v_child uuid; v_sub jsonb; k text;
begin
  v_root := public.owner_force_delete_table(p_scope);
  if v_root is null then return v_out; end if;

  if p_scope = 'customer' then
    for v_child in select id from public.owner_invoices where owner_customer_id = p_id loop
      v_sub := public.owner_purge_manifest('invoice', v_child);
      for k in select jsonb_object_keys(v_sub) loop
        v_out := v_out || jsonb_build_object(k, coalesce((v_out ->> k)::bigint, 0) + (v_sub ->> k)::bigint);
      end loop;
    end loop;
    for v_child in select id from public.owner_offers where owner_customer_id = p_id loop
      v_sub := public.owner_purge_manifest('offer', v_child);
      for k in select jsonb_object_keys(v_sub) loop
        v_out := v_out || jsonb_build_object(k, coalesce((v_out ->> k)::bigint, 0) + (v_sub ->> k)::bigint);
      end loop;
    end loop;
  end if;

  -- Only what actually disappears. A 'detach' row survives with a cleared link
  -- and has no business inflating a destruction count.
  for r in select * from public.owner_purge_dependencies(p_scope)
            where mode in ('delete', 'cascade')
              -- The trash entry itself. It is deleted, but counting "1 × Ablage-Zustand" in a
              -- destruction confirmation is noise, not disclosure.
              and dep_table <> 'owner_workspace_item_state' loop
    execute format('select count(*) from public.%I where %s', r.dep_table, r.predicate)
      into v_n using p_id;
    if v_n > 0 then
      v_out := v_out || jsonb_build_object(r.dep_table, coalesce((v_out ->> r.dep_table)::bigint, 0) + v_n);
    end if;
  end loop;

  select count(*) into v_n from public.owner_purge_storage_paths(p_scope, p_id);
  if v_n > 0 then v_out := v_out || jsonb_build_object('_storage_objects',
    coalesce((v_out ->> '_storage_objects')::bigint, 0) + v_n); end if;

  execute format('select count(*) from public.%I where id = $1', v_root) into v_n using p_id;
  v_out := v_out || jsonb_build_object(v_root, coalesce((v_out ->> v_root)::bigint, 0) + v_n);
  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6b. The blast-radius report. What the emergency confirmation dialog shows.
--
--     owner_purge_manifest (above) answers "which tables, how many rows" — the
--     ordinary Papierkorb dialog needs exactly that, and no more, because tier 1
--     never touches a record with money or a number attached. The EMERGENCY
--     confirmation is different: an owner about to destroy real accounting
--     evidence has to be able to judge the blast radius in terms the business
--     actually uses — how much money, which invoice numbers — not a table name
--     and a row count.
--
--     One recursive shape for every scope, so the UI never branches on which
--     fields exist. For 'customer' it sums across every invoice and offer via
--     the SAME per-scope computation used standalone — one function, walked
--     twice at different roots, rather than a second parallel implementation
--     that could drift from the first.
--
--     Advance payments linked directly via owner_payments.owner_customer_id
--     (never through an invoice_id — record_owner_invoice_payment never sets
--     that column) are added once at the customer level. They are not
--     reachable through the invoice recursion at all, so there is no double
--     count to guard against.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_purge_blast_radius(p_scope text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_inv_count int := 0; v_inv_gross bigint := 0; v_inv_numbers text[] := array[]::text[];
  v_pay_count int := 0; v_pay_total bigint := 0;
  v_off_count int := 0; v_off_numbers text[] := array[]::text[];
  v_gen_count int := 0; v_fin_count int := 0; v_portal_count int := 0; v_storage_count int := 0;
  v_row record; v_sub jsonb; v_direct_pay_count int; v_direct_pay_total bigint;
begin
  if p_scope = 'customer' then
    for v_row in select id from public.owner_invoices where owner_customer_id = p_id loop
      v_sub := public.owner_purge_blast_radius('invoice', v_row.id);
      v_inv_count        := v_inv_count        + (v_sub -> 'invoices' ->> 'count')::int;
      v_inv_gross         := v_inv_gross         + (v_sub -> 'invoices' ->> 'gross_total_cents')::bigint;
      v_inv_numbers       := v_inv_numbers       || array(select jsonb_array_elements_text(v_sub -> 'invoices' -> 'numbers'));
      v_pay_count         := v_pay_count         + (v_sub -> 'payments' ->> 'count')::int;
      v_pay_total         := v_pay_total         + (v_sub -> 'payments' ->> 'total_cents')::bigint;
      v_gen_count         := v_gen_count         + (v_sub -> 'generated_documents' ->> 'count')::int;
      v_fin_count         := v_fin_count         + (v_sub -> 'finance_documents' ->> 'count')::int;
      v_portal_count      := v_portal_count      + (v_sub -> 'portal_documents' ->> 'count')::int;
      v_storage_count     := v_storage_count     + (v_sub -> 'storage_objects' ->> 'count')::int;
    end loop;
    for v_row in select id from public.owner_offers where owner_customer_id = p_id loop
      v_sub := public.owner_purge_blast_radius('offer', v_row.id);
      v_off_count         := v_off_count         + (v_sub -> 'offers' ->> 'count')::int;
      v_off_numbers       := v_off_numbers       || array(select jsonb_array_elements_text(v_sub -> 'offers' -> 'numbers'));
      v_gen_count         := v_gen_count         + (v_sub -> 'generated_documents' ->> 'count')::int;
      v_portal_count      := v_portal_count      + (v_sub -> 'portal_documents' ->> 'count')::int;
      v_storage_count     := v_storage_count     + (v_sub -> 'storage_objects' ->> 'count')::int;
    end loop;

    select count(*), coalesce(sum(amount_cents), 0) into v_direct_pay_count, v_direct_pay_total
      from public.owner_payments where owner_customer_id = p_id;
    v_pay_count := v_pay_count + v_direct_pay_count;
    v_pay_total := v_pay_total + v_direct_pay_total;

    return jsonb_build_object(
      'invoices', jsonb_build_object('count', v_inv_count, 'gross_total_cents', v_inv_gross, 'numbers', to_jsonb(v_inv_numbers)),
      'payments', jsonb_build_object('count', v_pay_count, 'total_cents', v_pay_total),
      'offers', jsonb_build_object('count', v_off_count, 'numbers', to_jsonb(v_off_numbers)),
      'generated_documents', jsonb_build_object('count', v_gen_count),
      'finance_documents', jsonb_build_object('count', v_fin_count),
      'portal_documents', jsonb_build_object('count', v_portal_count),
      'storage_objects', jsonb_build_object('count', v_storage_count));
  end if;

  declare
    v_number text; v_gross bigint; v_found boolean := false;
  begin
    if p_scope = 'invoice' then
      select invoice_number, gross_total_cents into v_number, v_gross
        from public.owner_invoices where id = p_id;
      v_found := found;
      if v_found then
        v_inv_count := 1; v_inv_gross := coalesce(v_gross, 0);
        if v_number is not null then v_inv_numbers := array[v_number]; end if;
      end if;
      select count(*), coalesce(sum(amount_cents), 0) into v_pay_count, v_pay_total
        from public.owner_payments where invoice_id = p_id;

    elsif p_scope = 'offer' then
      select offer_number into v_number from public.owner_offers where id = p_id;
      v_found := found;
      if v_found then
        v_off_count := 1;
        if v_number is not null then v_off_numbers := array[v_number]; end if;
      end if;

    elsif p_scope = 'expense' then
      -- Reuses the "invoices" bucket's shape (count / gross / numbers) rather than adding a
      -- fifth near-identical field: the UI labels it by scope, and an expense has exactly the
      -- same three facts worth showing (how many, how much, which supplier reference).
      select supplier_invoice_number, gross_total_cents into v_number, v_gross
        from public.owner_expenses where id = p_id;
      v_found := found;
      if v_found then
        v_inv_count := 1; v_inv_gross := coalesce(v_gross, 0);
        if v_number is not null then v_inv_numbers := array[v_number]; end if;
      end if;
      select count(*), coalesce(sum(amount_cents), 0) into v_pay_count, v_pay_total
        from public.owner_payments where expense_id = p_id;
    end if;
  end;

  select count(*) into v_gen_count from public.owner_generated_documents
   where (p_scope = 'invoice' and source_resource_type = 'owner_invoices' and source_resource_id = p_id)
      or (p_scope = 'offer' and source_resource_type = 'owner_offers' and source_resource_id = p_id);

  select count(*) into v_fin_count from public.owner_finance_documents
   where (p_scope = 'invoice' and invoice_id = p_id) or (p_scope = 'expense' and expense_id = p_id);

  select count(*) into v_portal_count from public.customer_documents d
    join public.owner_generated_documents g on g.id = d.owner_generated_document_id
   where (p_scope = 'invoice' and g.source_resource_type = 'owner_invoices' and g.source_resource_id = p_id)
      or (p_scope = 'offer' and g.source_resource_type = 'owner_offers' and g.source_resource_id = p_id);

  select count(*) into v_storage_count from public.owner_purge_storage_paths(p_scope, p_id);

  return jsonb_build_object(
    'invoices', jsonb_build_object('count', v_inv_count, 'gross_total_cents', v_inv_gross, 'numbers', to_jsonb(v_inv_numbers)),
    'payments', jsonb_build_object('count', v_pay_count, 'total_cents', v_pay_total),
    'offers', jsonb_build_object('count', v_off_count, 'numbers', to_jsonb(v_off_numbers)),
    'generated_documents', jsonb_build_object('count', v_gen_count),
    'finance_documents', jsonb_build_object('count', v_fin_count),
    'portal_documents', jsonb_build_object('count', v_portal_count),
    'storage_objects', jsonb_build_object('count', v_storage_count));
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6c. owner_force_delete_preview, restated.
--
--     Originally defined in 20260910120000. Two correctness fixes to what the
--     confirmation dialog shows BEFORE the owner types the phrase:
--
--       1. `manifest` now comes from owner_purge_manifest, built on the same
--          explicit owner_purge_dependencies map the real destroyer walks —
--          not the older pg_constraint-only owner_force_delete_manifest,
--          which never followed SET NULL keys (owner_payments.invoice_id,
--          owner_finance_documents.invoice_id) or the polymorphic
--          owner_generated_documents (no foreign key at all). For a customer
--          with issued invoices, that walker undercounted the very rows the
--          confirmation dialog exists to surface: payments and generated
--          documents went unreported while still being destroyed for real.
--          Two divergent manifest implementations for one destructive action
--          was itself the defect; one is now the only one that exists.
--       2. `blast_radius` is new: the same tree, rolled up into money and
--          reference numbers rather than table names, because "3 rows in
--          owner_invoices" does not let an owner judge a blast radius the
--          way "3 Rechnungen, €4.280,00, RE-2026-0091 / …" does.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_delete_preview(p_scope text, p_resource_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_table text; v_summary jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_table := public.owner_force_delete_table(p_scope);
  if v_table is null then
    return jsonb_build_object('resource_id', p_resource_id, 'found', false, 'reason', 'scope_not_supported');
  end if;

  v_summary := public.owner_force_delete_summary(p_scope, p_resource_id);
  if v_summary is null then
    return jsonb_build_object('resource_id', p_resource_id, 'found', false, 'reason', 'not_found');
  end if;

  return jsonb_build_object(
    'resource_id', p_resource_id, 'found', true,
    'label', v_summary ->> 'label',
    'summary', v_summary,
    'manifest', public.owner_purge_manifest(p_scope, p_resource_id),
    'blast_radius', public.owner_purge_blast_radius(p_scope, p_resource_id));
end;
$$;

/**
 * The customer-scoped counterpart to owner_force_delete_preview / useForceDeletePreviews.
 *
 * A customer force-delete is invoked with a single id (owner_force_delete_customer takes one
 * p_customer_id, not an array), so it has never gone through the generic
 * `owner_force_delete_preview('customer', id)` path used for invoices/offers/expenses — checking
 * confirms `owner_force_delete_table('customer')` resolves fine and `owner_force_delete_summary`
 * handles 'customer', so the generic function already works for this scope with no changes.
 * This comment exists only so a future reader does not go looking for a customer-specific preview
 * function that was never needed: `owner_force_delete_preview('customer', p_customer_id)` is it.
 */

commit;

-- ---------------------------------------------------------------------------
-- 7. Purge eligibility — the decision the Papierkorb actually needs.
--
--    Deliberately NOT the delete preflight. That one answers "what may Löschen
--    do to a record that is still in the list", and its `hard_delete` answer is
--    consumed by owner_workspace_delete_items before the record can ever reach
--    the trash. Asking it again from the Papierkorb was the contradiction.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_workspace_purge_preflight_one(p_scope text, p_resource_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_rel jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  if public.owner_force_delete_table(p_scope) is null then
    return jsonb_build_object('resource_id', p_resource_id, 'eligibility', 'scope_not_supported',
      'reasons', to_jsonb(array['scope_not_supported']), 'manifest', '{}'::jsonb, 'label', null);
  end if;

  v_rel := public.owner_record_accounting_relevance(p_scope, p_resource_id);
  if v_rel is null then
    return jsonb_build_object('resource_id', p_resource_id, 'eligibility', 'not_found',
      'reasons', to_jsonb(array['not_found']), 'manifest', '{}'::jsonb, 'label', null);
  end if;

  return jsonb_build_object(
    'resource_id', p_resource_id,
    'eligibility', case when (v_rel ->> 'relevant')::boolean then 'accounting_protected' else 'purgeable' end,
    'reasons', v_rel -> 'reasons',
    'label', v_rel ->> 'label',
    'facts', v_rel -> 'facts',
    'manifest', public.owner_purge_manifest(p_scope, p_resource_id));
end;
$$;

create or replace function public.owner_workspace_purge_preflight(p_scope text, p_resource_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_out jsonb := '[]'::jsonb; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_out := v_out || jsonb_build_array(public.owner_workspace_purge_preflight_one(p_scope, v_id));
  end loop;
  return v_out;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 8. Tier 1. The Papierkorb's ordinary permanent delete.
--
--    Rewritten. It no longer asks whether the DELETE preflight still says
--    `hard_delete` — a condition nothing in the trash could ever satisfy — and
--    decides on purge eligibility instead.
-- ---------------------------------------------------------------------------
begin;

-- The 3-argument original must GO, not be shadowed. `create or replace` matches on
-- argument types, so adding a defaulted fourth parameter would leave the old broken
-- function in place and make every existing 3-argument call ambiguous.
drop function if exists public.owner_workspace_purge_items(uuid, text, uuid[]);

create or replace function public.owner_workspace_purge_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[], p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_out jsonb := '[]'::jsonb; v_id uuid; v_plan jsonb; v_summary jsonb;
  v_outcome text; v_error text; v_destroyed jsonb; v_trashed boolean; v_reason text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if not (p_scope = any (public.owner_workspace_scopes())) then raise exception 'unknown workspace scope'; end if;
  v_reason := coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Papierkorb geleert');

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_outcome := null; v_error := null; v_destroyed := '{}'::jsonb;

    begin
      select (s.trashed_at is not null) into v_trashed
        from public.owner_workspace_item_state s
       where s.business_entity_id = p_entity and s.scope = p_scope and s.resource_id = v_id;

      if coalesce(v_trashed, false) is not true then
        v_outcome := 'blocked'; v_error := 'not_trashed';
      else
        v_plan := public.owner_workspace_purge_preflight_one(p_scope, v_id);

        if (v_plan ->> 'eligibility') = 'not_found' then
          delete from public.owner_workspace_item_state
           where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
          v_outcome := 'hard_deleted';

        elsif (v_plan ->> 'eligibility') <> 'purgeable' then
          -- The honest refusal. The record is accounting-relevant, and the
          -- ordinary path is not allowed to destroy it; the emergency purge is.
          v_outcome := 'blocked'; v_error := 'accounting_protected';

        else
          -- "What it was", captured now while it still exists — but the decision to
          -- destroy it is NOT this preflight. owner_purge_destroy_row locks the row
          -- and re-runs the same relevance check itself before touching anything;
          -- this read is display material for the tombstone, nothing more.
          v_summary := coalesce(
            public.owner_force_delete_summary(p_scope, v_id),
            public.owner_record_accounting_relevance(p_scope, v_id));

          -- p_allow_accounting stays FALSE: the guards remain armed, so a bug in
          -- the eligibility rules cannot become a destroyed invoice. If a
          -- concurrent transaction made the record accounting-relevant after this
          -- preflight ran, owner_purge_destroy_row's own lock-and-recheck catches
          -- it and raises purge_race_accounting_relevant — caught below, nothing
          -- destroyed, no tombstone written for a purge that did not happen.
          v_destroyed := public.owner_purge_destroy_row(p_scope, v_id, false);

          -- Written AFTER, from what actually happened rather than a pre-purge
          -- estimate: v_destroyed is owner_purge_destroy_row's own row counts,
          -- not the manifest the confirmation dialog showed a moment earlier.
          insert into public.owner_deletion_tombstones
            (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
          values (p_entity, p_scope, v_id, v_summary ->> 'label', v_summary,
                  v_destroyed, v_reason, auth.uid());
          v_outcome := 'hard_deleted';
        end if;
      end if;
    exception when others then
      if sqlerrm like '%purge_race_accounting_relevant%' then
        v_outcome := 'blocked'; v_error := 'accounting_protected';
      else
        v_outcome := 'failed'; v_error := sqlstate;
      end if;
    end;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', 'purge', 'outcome', v_outcome,
      'reasons', coalesce(v_plan -> 'reasons', to_jsonb(array[]::text[])),
      'destroyed', v_destroyed, 'error', v_error));
  end loop;

  return v_out;
end;
$$;

comment on function public.owner_workspace_purge_items(uuid, text, uuid[], text) is
  'Tier 1: permanently deletes a TRASHED record that never became accounting-relevant, with its dependencies and Storage objects. Refuses an accounting-relevant record — that is what the emergency purge is for.';

commit;

-- ---------------------------------------------------------------------------
-- 9. Tier 2. The emergency purge, rebuilt on the explicit map.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_force_purge_items(
  p_entity uuid, p_scope text, p_resource_ids uuid[],
  p_reason text, p_confirmation text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_out jsonb := '[]'::jsonb; v_id uuid; v_summary jsonb; v_rel jsonb;
  v_destroyed jsonb; v_outcome text; v_error text; v_reason text; v_trashed boolean;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'entity required'; end if;
  if public.owner_force_delete_table(p_scope) is null or p_scope = 'customer' then
    raise exception 'unsupported force purge scope';
  end if;
  if p_confirmation is distinct from public.owner_force_delete_phrase() then
    raise exception 'force_delete_confirmation_required';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 3 then raise exception 'force_delete_reason_required'; end if;

  foreach v_id in array coalesce(p_resource_ids, array[]::uuid[]) loop
    v_outcome := null; v_error := null; v_destroyed := '{}'::jsonb;

    begin
      select (s.trashed_at is not null) into v_trashed
        from public.owner_workspace_item_state s
       where s.business_entity_id = p_entity and s.scope = p_scope and s.resource_id = v_id;

      if coalesce(v_trashed, false) is not true then
        v_outcome := 'blocked'; v_error := 'not_trashed';
      else
        v_summary := public.owner_force_delete_summary(p_scope, v_id);
        if v_summary is null then
          delete from public.owner_workspace_item_state
           where business_entity_id = p_entity and scope = p_scope and resource_id = v_id;
          v_outcome := 'hard_deleted';
        else
          v_rel := public.owner_record_accounting_relevance(p_scope, v_id);

          -- p_allow_accounting = true: this IS the path allowed to destroy an
          -- accounting-relevant record, so owner_purge_destroy_row's lock still
          -- runs but never aborts on relevance here. The lock still matters —
          -- it is what makes v_destroyed below an exact count rather than a
          -- race-widened undercount if something committed mid-purge.
          v_destroyed := public.owner_purge_destroy_row(p_scope, v_id, true);

          -- Tombstone written AFTER destruction, from what actually happened.
          insert into public.owner_deletion_tombstones
            (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
          values (p_entity, p_scope, v_id, v_summary ->> 'label',
                  v_summary || jsonb_build_object('accounting_relevance', v_rel),
                  v_destroyed, v_reason, auth.uid());
          v_outcome := 'hard_deleted';
        end if;
      end if;
    exception when others then
      v_outcome := 'failed'; v_error := sqlstate;
    end;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'resource_id', v_id, 'action', 'force_delete', 'outcome', v_outcome,
      'reasons', to_jsonb(array[]::text[]), 'destroyed', v_destroyed, 'error', v_error));
  end loop;

  return v_out;
end;
$$;

create or replace function public.owner_force_delete_customer(
  p_customer_id uuid, p_reason text, p_confirmation text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; v_reason text; v_summary jsonb; v_rel jsonb; v_destroyed jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_confirmation is distinct from public.owner_force_delete_phrase() then
    raise exception 'force_delete_confirmation_required';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) < 3 then raise exception 'force_delete_reason_required'; end if;

  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  if c.status is distinct from 'archived' then raise exception 'force_delete_requires_archived'; end if;

  v_summary := public.owner_force_delete_summary('customer', p_customer_id);
  v_rel := public.owner_record_accounting_relevance('customer', p_customer_id);

  -- The row is already locked (SELECT ... FOR UPDATE above), and
  -- owner_purge_destroy_row re-locks and, for its own cascaded children,
  -- individually re-locks each invoice and offer it recurses into — so a
  -- payment or issuance racing in on any of them mid-cascade cannot slip
  -- through uncounted. p_allow_accounting = true: this path may destroy an
  -- accounting-relevant customer on purpose, so it never aborts on relevance.
  v_destroyed := public.owner_purge_destroy_row('customer', p_customer_id, true);

  -- Tombstone written AFTER destruction, from what actually happened.
  insert into public.owner_deletion_tombstones
    (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
  values (c.business_entity_id, 'customer', p_customer_id, v_summary ->> 'label',
          v_summary || jsonb_build_object('accounting_relevance', v_rel),
          v_destroyed, v_reason, auth.uid());

  return jsonb_build_object('customer_id', p_customer_id, 'deleted', true,
    'label', v_summary ->> 'label', 'destroyed', v_destroyed);
end;
$$;

/**
 * Tier 1 for a customer: only one that never became accounting-relevant, and only from the
 * archive. It is what "test customer, no financial history" needs, and it refuses everything else.
 */
create or replace function public.owner_purge_customer(p_customer_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; v_rel jsonb; v_summary jsonb; v_destroyed jsonb; v_reason text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  if c.status is distinct from 'archived' then raise exception 'force_delete_requires_archived'; end if;

  v_rel := public.owner_record_accounting_relevance('customer', p_customer_id);
  if (v_rel ->> 'relevant')::boolean then
    return jsonb_build_object('customer_id', p_customer_id, 'deleted', false,
      'eligibility', 'accounting_protected', 'reasons', v_rel -> 'reasons');
  end if;

  v_reason := coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Kunde ohne Buchhaltungsrelevanz');
  v_summary := public.owner_force_delete_summary('customer', p_customer_id);

  begin
    -- The customer row is already locked above; owner_purge_destroy_row's cascade
    -- individually locks and re-checks each invoice and offer it recurses into.
    -- If any of them turns out to have become accounting-relevant since the
    -- check just above — a payment or issuance racing in mid-cascade — the
    -- destroyer raises purge_race_accounting_relevant and nothing is destroyed;
    -- caught here and reported the same way the up-front check above is.
    v_destroyed := public.owner_purge_destroy_row('customer', p_customer_id, false);
  exception when others then
    if sqlerrm like '%purge_race_accounting_relevant%' then
      return jsonb_build_object('customer_id', p_customer_id, 'deleted', false,
        'eligibility', 'accounting_protected',
        'reasons', to_jsonb(array['became_accounting_relevant_during_purge']::text[]));
    end if;
    raise;
  end;

  -- Tombstone written AFTER destruction, from what actually happened.
  insert into public.owner_deletion_tombstones
    (business_entity_id, scope, resource_id, label, summary, destroyed, reason, deleted_by)
  values (c.business_entity_id, 'customer', p_customer_id, v_summary ->> 'label',
          coalesce(v_summary, v_rel), v_destroyed, v_reason, auth.uid());

  return jsonb_build_object('customer_id', p_customer_id, 'deleted', true,
    'eligibility', 'purgeable', 'label', v_summary ->> 'label', 'destroyed', v_destroyed);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 10. The published-document guard learns the same one exception.
--
--     guard_customer_document_no_hard_delete_if_published refuses to delete a
--     document that reached the customer portal — correctly, and it still does.
--     Without an exception the emergency purge of an invoice whose PDF was
--     published fails on a RESTRICT it cannot clear, which is the same dead end
--     this whole change exists to remove.
--
--     The token is transaction-local, set only inside owner_purge_destroy_row
--     with p_allow_accounting = true, which only the two emergency entry points
--     reach, and only after the phrase, the reason and the tombstone. Tier 1
--     never sets it, so the ordinary purge still cannot touch a published copy.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.guard_customer_document_no_hard_delete_if_published()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Both the token AND is_platform_owner() are required — see owner_guard_generated_document
  -- for why the second check is added even though the token is not independently reachable.
  if old.published_at is not null
     and (coalesce(public.owner_force_delete_token(), '') = '' or not public.is_platform_owner())
  then
    raise exception 'document % has been published and cannot be deleted; archive it instead', old.id;
  end if;
  return old;
end;
$$;

revoke all on function public.guard_customer_document_no_hard_delete_if_published() from public, anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 10b. The finalized-document guard, same exception.
--
--      There are exactly SIX BEFORE DELETE guards on the tables this map
--      touches, and it is worth naming all of them so the next person does not
--      rediscover them one failure at a time:
--
--        owner_guard_invoice ................ amended (20260910120000), token
--        owner_guard_generated_document ..... amended here, token
--        guard_customer_document_no_hard_delete_if_published .. amended above, token
--        owner_guard_invoice_line ........... needs nothing: the FK CASCADE removes the
--                                             parent first, so its status lookup finds
--                                             nothing and it lets the cascade through
--        owner_guard_offer_line ............. same
--        owner_guard_offer .................. already exempts is_database_admin(), which a
--                                             SECURITY DEFINER body owned by postgres has
--
--      A finalized PDF is evidence and stays undeletable for every ordinary
--      caller, tier 1 included. Only the emergency purge — phrase, reason,
--      tombstone, and the transaction-local token — gets past it.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_guard_generated_document()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    -- Finalized documents are evidence: no hard delete for ANY role (archive instead),
    -- except inside an owner-authorised emergency purge.
    --
    -- Both the token AND is_platform_owner() are required, matching owner_guard_invoice. The
    -- token alone is not reachable by an ordinary client (set_config on this GUC is never
    -- exposed through PostgREST — nothing in the public schema surfaces it), but the second
    -- check costs nothing and means a stale or leaked token can never be sufficient by itself,
    -- for whoever might one day read this trigger in isolation.
    if old.status = 'finalized'
       and (coalesce(public.owner_force_delete_token(), '') = '' or not public.is_platform_owner())
    then
      raise exception 'finalized documents cannot be deleted (evidence)';
    end if;
    return old;
  end if;
  if old.status = 'finalized' then
    if new.pdf_storage_path is distinct from old.pdf_storage_path
       or new.source_hash is distinct from old.source_hash
       or new.version is distinct from old.version
       or new.document_type is distinct from old.document_type
       or new.source_resource_id is distinct from old.source_resource_id then
      raise exception 'finalized document is immutable; create a new version';
    end if;
  end if;
  if new.status = 'finalized' and new.finalized_at is null then new.finalized_at := now(); end if;
  return new;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 11. Grants.
-- ---------------------------------------------------------------------------
begin;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.owner_purge_soft_references()',
    'public.owner_record_accounting_relevance(text, uuid)',
    'public.owner_counterparty_snapshot(uuid, uuid)',
    'public.owner_purge_dependencies(text)',
    'public.owner_purge_storage_paths(text, uuid)',
    'public.owner_purge_delete_storage(jsonb)',
    'public.owner_purge_assert_no_orphans(text, uuid)',
    'public.owner_purge_merge_counts(jsonb, jsonb)',
    'public.owner_purge_destroy_row(text, uuid, boolean)',
    'public.owner_purge_manifest(text, uuid)',
    'public.owner_purge_blast_radius(text, uuid)',
    'public.owner_force_delete_preview(text, uuid)',
    'public.owner_workspace_purge_preflight_one(text, uuid)',
    'public.owner_workspace_purge_preflight(text, uuid[])',
    'public.owner_workspace_purge_items(uuid, text, uuid[], text)',
    'public.owner_force_purge_items(uuid, text, uuid[], text, text)',
    'public.owner_force_delete_customer(uuid, text, text)',
    'public.owner_purge_customer(uuid, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;

  -- Only what the browser calls. The destroyer and the map take a scope and run
  -- statements; they stay server-side and are reached through the four entry
  -- points below, every one of which re-checks is_platform_owner().
  foreach fn in array array[
    'public.owner_record_accounting_relevance(text, uuid)',
    'public.owner_workspace_purge_preflight_one(text, uuid)',
    'public.owner_workspace_purge_preflight(text, uuid[])',
    'public.owner_workspace_purge_items(uuid, text, uuid[], text)',
    'public.owner_force_purge_items(uuid, text, uuid[], text, text)',
    'public.owner_force_delete_customer(uuid, text, text)',
    'public.owner_purge_customer(uuid, text)'
  ]
  loop
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

commit;
