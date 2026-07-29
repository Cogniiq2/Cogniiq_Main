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

delete from public.owner_invoices
where id in (
  'ffffffff-5555-0000-0000-000000000001',
  'ffffffff-5555-0000-0000-000000000002',
  'ffffffff-5555-0000-0000-00000000000b',
  'ffffffff-5555-0000-0000-0000000000f0'
);

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
