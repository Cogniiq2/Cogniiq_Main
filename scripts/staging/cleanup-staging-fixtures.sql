-- =============================================================================
-- Customer platform — remove disposable staging fixtures
-- =============================================================================
-- Deletes exactly what scripts/staging/seed-staging-fixtures.sql created and
-- nothing else: every fixture carries the ffffffff-… UUID prefix, so the deletes
-- below are id-scoped rather than pattern-matched against user-editable text.
--
-- Safe to run repeatedly, and safe to run when no fixtures are present.
--
-- Published fixture documents are hard-deleted here. The BEFORE DELETE trigger
-- forbids that for any caller, so their published_at is cleared FIRST — the one
-- place in this repository that does so, and only for rows whose id is a known
-- fixture id.
--
-- The fixture INVOICES are issued/paid on purpose (that is the staging coverage
-- that matters), and since
-- supabase/migrations/20260831120000_owner_invoice_integrity_guard.sql an
-- issued invoice can no longer be hard-deleted by ANY caller — database owner
-- and service_role included. That guard is doing exactly its job; production
-- accounting history must not be deletable. So this teardown briefly disables
-- that one named trigger, for those four known ids, and re-enables it — see the
-- block below for why that is the narrowest safe mechanism. It is the same
-- pattern this script already uses for organization_members_guard_write.
-- =============================================================================

\set ON_ERROR_STOP on

begin;

delete from public.customer_project_invoices
where invoice_id in (
  'ffffffff-5555-0000-0000-000000000001',
  'ffffffff-5555-0000-0000-000000000002',
  'ffffffff-5555-0000-0000-00000000000b',
  'ffffffff-5555-0000-0000-0000000000f0'
);

-- ---------------------------------------------------------------------------
-- STAGING FIXTURE TEARDOWN ONLY — hard-deleting issued invoices.
--
-- This is NOT a general invoice-deletion path and must never become one. There
-- is deliberately no RPC for it: an application function that could hard-delete
-- an issued invoice would be reachable, and the whole point of
-- owner_guard_invoice() is that nothing is. What follows is a DBA action in a
-- disposable staging database, scoped to four hard-coded fixture UUIDs.
--
-- WHY `disable trigger` AND NOT `session_replication_role = replica`:
--
--   * Scope. This disables ONE named trigger on ONE table. Replica mode turns
--     off every trigger on every table for the whole session, including the ones
--     protecting rows this script never touches.
--   * Referential integrity. Foreign keys are enforced by system triggers, which
--     replica mode ALSO suppresses — so a delete under replica mode can silently
--     leave dangling references. The requirement here is the opposite: no orphan
--     fixture data. ALTER TABLE ... DISABLE TRIGGER leaves every FK, cascade and
--     validation trigger fully active.
--   * Transaction safety. ALTER TABLE ... DISABLE TRIGGER is transactional DDL
--     inside this script's single begin/commit, so if ANY statement below fails,
--     ON_ERROR_STOP aborts, the transaction rolls back, and the guard comes back
--     enabled on its own — protections can never be left off. A plain
--     `SET session_replication_role` is a session GUC and would survive a failed
--     statement.
--   * Privilege. Both need the same DBA rights, so replica mode buys no safety
--     and costs the three properties above.
--
-- The explicit re-enable at the end covers the success path deterministically;
-- the rollback covers every failure path.
-- ---------------------------------------------------------------------------

-- Dependent fixture rows first, so nothing is orphaned by the invoice deletes.
-- owner_payments.invoice_id and owner_finance_documents.invoice_id are ON DELETE
-- SET NULL, so they would otherwise survive as rows pointing at nothing.
delete from public.owner_payments
where invoice_id in (
  'ffffffff-5555-0000-0000-000000000001',
  'ffffffff-5555-0000-0000-000000000002',
  'ffffffff-5555-0000-0000-00000000000b',
  'ffffffff-5555-0000-0000-0000000000f0'
);

delete from public.owner_finance_documents
where invoice_id in (
  'ffffffff-5555-0000-0000-000000000001',
  'ffffffff-5555-0000-0000-000000000002',
  'ffffffff-5555-0000-0000-00000000000b',
  'ffffffff-5555-0000-0000-0000000000f0'
);

-- owner_generated_documents and owner_invoice_versions arrived in later
-- migrations, so this script stays runnable on a target that predates them.
-- owner_generated_documents has no FK to the invoice at all (it points at it by
-- source_resource_type/source_resource_id), so nothing would clean it up.
do $fixture$
begin
  if to_regclass('public.owner_generated_documents') is not null then
    execute $sql$
      delete from public.owner_generated_documents
      where source_resource_type = 'owner_invoices'
        and source_resource_id in (
          'ffffffff-5555-0000-0000-000000000001',
          'ffffffff-5555-0000-0000-000000000002',
          'ffffffff-5555-0000-0000-00000000000b',
          'ffffffff-5555-0000-0000-0000000000f0'
        )
    $sql$;
  end if;
  -- owner_invoice_versions cascades from the invoice, but it is deleted
  -- explicitly so the teardown does not depend on cascade order.
  if to_regclass('public.owner_invoice_versions') is not null then
    execute $sql$
      delete from public.owner_invoice_versions
      where invoice_id in (
        'ffffffff-5555-0000-0000-000000000001',
        'ffffffff-5555-0000-0000-000000000002',
        'ffffffff-5555-0000-0000-00000000000b',
        'ffffffff-5555-0000-0000-0000000000f0'
      )
    $sql$;
  end if;
end $fixture$;

alter table public.owner_invoice_lines disable trigger owner_invoice_lines_guard;
alter table public.owner_invoices      disable trigger owner_invoices_guard;

delete from public.owner_invoice_lines
where invoice_id in (
  'ffffffff-5555-0000-0000-000000000001',
  'ffffffff-5555-0000-0000-000000000002',
  'ffffffff-5555-0000-0000-00000000000b',
  'ffffffff-5555-0000-0000-0000000000f0'
);

delete from public.owner_invoices
where id in (
  'ffffffff-5555-0000-0000-000000000001',
  'ffffffff-5555-0000-0000-000000000002',
  'ffffffff-5555-0000-0000-00000000000b',
  'ffffffff-5555-0000-0000-0000000000f0'
);

alter table public.owner_invoices      enable trigger owner_invoices_guard;
alter table public.owner_invoice_lines enable trigger owner_invoice_lines_guard;

delete from public.customer_document_access_events
where document_id in (
  'ffffffff-4444-0000-0000-000000000001',
  'ffffffff-4444-0000-0000-000000000002',
  'ffffffff-4444-0000-0000-000000000003',
  'ffffffff-4444-0000-0000-00000000000b'
);

-- The published-document delete guard is real protection, not a formality: clear
-- the latch on these four known fixture ids only, then delete.
update public.customer_documents set published_at = null
where id in (
  'ffffffff-4444-0000-0000-000000000001',
  'ffffffff-4444-0000-0000-000000000002',
  'ffffffff-4444-0000-0000-000000000003',
  'ffffffff-4444-0000-0000-00000000000b'
);

delete from public.customer_documents
where id in (
  'ffffffff-4444-0000-0000-000000000001',
  'ffffffff-4444-0000-0000-000000000002',
  'ffffffff-4444-0000-0000-000000000003',
  'ffffffff-4444-0000-0000-00000000000b'
);

delete from public.customer_project_milestones
where id in (
  'ffffffff-3333-0000-0000-000000000001',
  'ffffffff-3333-0000-0000-000000000002',
  'ffffffff-3333-0000-0000-000000000003'
);

delete from public.customer_projects
where id in (
  'ffffffff-2222-0000-0000-000000000001',
  'ffffffff-2222-0000-0000-00000000000b'
);

alter table public.organization_members disable trigger organization_members_guard_write;
delete from public.organization_members
where organization_id in (
  'ffffffff-0000-0000-0000-00000000000a',
  'ffffffff-0000-0000-0000-00000000000b'
);
alter table public.organization_members enable trigger organization_members_guard_write;

delete from public.organizations
where id in (
  'ffffffff-0000-0000-0000-00000000000a',
  'ffffffff-0000-0000-0000-00000000000b'
);

-- Only the fixture business entity, and only if this seed created it. A
-- pre-existing entity on the target is never touched.
delete from public.owner_business_entities
where id = 'ffffffff-6666-0000-0000-000000000001';

-- profiles cascade from auth.users.
delete from auth.users
where id in (
  'ffffffff-1111-0000-0000-000000000001',
  'ffffffff-1111-0000-0000-000000000002',
  'ffffffff-1111-0000-0000-000000000003',
  'ffffffff-1111-0000-0000-000000000004'
);

commit;

\echo ''
\echo 'Staging fixtures removed.'
\echo 'If any fixture document bytes were uploaded to Storage during testing, delete them'
\echo 'separately from the customer-documents bucket — this script only removes database rows.'
\echo ''
