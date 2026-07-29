-- =============================================================================
-- Customer platform — DISPOSABLE STAGING FIXTURES
-- =============================================================================
-- STAGING ONLY. This script WRITES. It is never run by CI and never run without
-- scripts/staging/seed-staging-fixtures.sh, which enforces the ALLOW_STAGING_SEED
-- and project-reference interlocks before psql is ever invoked.
--
-- WHAT IT CREATES
--   Two organizations, so cross-organization denial can be exercised for real:
--     * "ZZ STAGING FIXTURE — Organisation A"
--     * "ZZ STAGING FIXTURE — Organisation B"
--   Four users:
--     * an ACTIVE member of A            (the ordinary customer)
--     * a SUSPENDED member of A          (must be denied everything)
--     * an ACTIVE member of B            (must see none of A's data)
--     * an INTERNAL Cogniiq staff account (platform_role = cogniiq_admin)
--
--   The internal fixture is deliberately cogniiq_ADMIN, not cogniiq_owner.
--   is_platform_admin() accepts both, so it exercises every owner-side path
--   identically — but minting a second PLATFORM OWNER on a real project is a
--   privilege-escalation footgun, and the last-owner delete guard would then
--   also block cleanup. Staging already has the operator's real owner account.
--   Plus, for organization A: one customer-visible project, three milestones,
--   one published document, one unpublished document, one archived document,
--   and two issued invoices (one open, one paid).
--
-- NAMING AND CLEANUP
--   Every row is named with the "ZZ STAGING FIXTURE" prefix and carries a fixed,
--   recognisable UUID prefix (ffffffff-…), so fixtures sort to the end of every
--   list, are unmistakable in the UI, and can be removed exactly.
--   Remove them with:  psql "$DATABASE_URL" -f scripts/staging/cleanup-staging-fixtures.sql
--
-- NO CREDENTIALS. The seeded users have NO password and NO usable session: they
-- exist as auth.users/profiles rows so tenancy can be exercised via SQL and via
-- an admin-minted token, never as accounts anybody can log into with a secret
-- stored in this repository.
-- =============================================================================

\set ON_ERROR_STOP on

begin;

-- Refuse to run twice: fixtures are disposable, not cumulative.
do $$
begin
  if exists (select 1 from public.organizations where id = 'ffffffff-0000-0000-0000-00000000000a') then
    raise exception 'staging fixtures already present — run scripts/staging/cleanup-staging-fixtures.sql first';
  end if;
end;
$$;

-- ---------------------------------------------------------------- users
insert into auth.users (id, email, email_confirmed_at)
values
  ('ffffffff-1111-0000-0000-000000000001', 'zz-staging-fixture-active-a@example.invalid',    now()),
  ('ffffffff-1111-0000-0000-000000000002', 'zz-staging-fixture-suspended-a@example.invalid', now()),
  ('ffffffff-1111-0000-0000-000000000003', 'zz-staging-fixture-active-b@example.invalid',    now()),
  ('ffffffff-1111-0000-0000-000000000004', 'zz-staging-fixture-internal@example.invalid',    now());

insert into public.profiles (id, email, full_name, platform_role)
values
  ('ffffffff-1111-0000-0000-000000000001', 'zz-staging-fixture-active-a@example.invalid',    'ZZ STAGING FIXTURE — Aktives Mitglied A',     'customer'),
  ('ffffffff-1111-0000-0000-000000000002', 'zz-staging-fixture-suspended-a@example.invalid', 'ZZ STAGING FIXTURE — Gesperrtes Mitglied A',  'customer'),
  ('ffffffff-1111-0000-0000-000000000003', 'zz-staging-fixture-active-b@example.invalid',    'ZZ STAGING FIXTURE — Aktives Mitglied B',     'customer'),
  ('ffffffff-1111-0000-0000-000000000004', 'zz-staging-fixture-internal@example.invalid',    'ZZ STAGING FIXTURE — Cogniiq intern',         'cogniiq_admin')
on conflict (id) do update set platform_role = excluded.platform_role, full_name = excluded.full_name;

-- ---------------------------------------------------------- organizations
insert into public.organizations (id, name, slug, status)
values
  ('ffffffff-0000-0000-0000-00000000000a', 'ZZ STAGING FIXTURE — Organisation A', 'zz-staging-fixture-a', 'active'),
  ('ffffffff-0000-0000-0000-00000000000b', 'ZZ STAGING FIXTURE — Organisation B', 'zz-staging-fixture-b', 'active');

-- The membership guard trigger protects interactive writes; a fixture load is a
-- privileged, deliberate setup step, so it is disabled for this statement only
-- and restored immediately. Everything else in this file runs with it active.
alter table public.organization_members disable trigger organization_members_guard_write;

insert into public.organization_members (organization_id, user_id, role, status)
values
  ('ffffffff-0000-0000-0000-00000000000a', 'ffffffff-1111-0000-0000-000000000001', 'member', 'active'),
  ('ffffffff-0000-0000-0000-00000000000a', 'ffffffff-1111-0000-0000-000000000002', 'member', 'suspended'),
  ('ffffffff-0000-0000-0000-00000000000b', 'ffffffff-1111-0000-0000-000000000003', 'member', 'active');

alter table public.organization_members enable trigger organization_members_guard_write;

-- --------------------------------------------------------------- project
insert into public.customer_projects (
  id, organization_id, title, business_objective, status, phase, progress_percent,
  start_date, target_date, next_action_summary, next_action_owner, next_action_due_date,
  contact_profile_id, contact_role_label, contact_business_email, created_by, updated_by
)
values (
  'ffffffff-2222-0000-0000-000000000001',
  'ffffffff-0000-0000-0000-00000000000a',
  'ZZ STAGING FIXTURE — KI-Telefonassistent',
  'ZZ STAGING FIXTURE — Testdaten. Eingehende Anrufe automatisiert qualifizieren.',
  'on_track', 'Umsetzung', 45,
  current_date - 30, current_date + 30,
  'ZZ STAGING FIXTURE — Bitte die Begrüßungstexte freigeben.', 'customer', current_date + 7,
  'ffffffff-1111-0000-0000-000000000004', 'Projektleitung', 'projekte@example.invalid',
  'ffffffff-1111-0000-0000-000000000004', 'ffffffff-1111-0000-0000-000000000004'
);

-- A second project in organization B, so a cross-organization read has something
-- real to fail to reach rather than merely finding nothing.
insert into public.customer_projects (
  id, organization_id, title, business_objective, phase, created_by, updated_by
)
values (
  'ffffffff-2222-0000-0000-00000000000b',
  'ffffffff-0000-0000-0000-00000000000b',
  'ZZ STAGING FIXTURE — Projekt der anderen Organisation',
  'ZZ STAGING FIXTURE — Darf für Organisation A niemals sichtbar sein.',
  'Analyse',
  'ffffffff-1111-0000-0000-000000000004', 'ffffffff-1111-0000-0000-000000000004'
);

insert into public.customer_project_milestones (
  id, organization_id, project_id, title, description, status, target_date, completed_at, sort_order, created_by
)
values
  ('ffffffff-3333-0000-0000-000000000001', 'ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'ZZ STAGING FIXTURE — Kickoff', 'Abgeschlossener Meilenstein.', 'completed', current_date - 25, now() - interval '25 days', 1,
   'ffffffff-1111-0000-0000-000000000004'),
  ('ffffffff-3333-0000-0000-000000000002', 'ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'ZZ STAGING FIXTURE — Integration', 'Laufender Meilenstein.', 'in_progress', current_date + 5, null, 2,
   'ffffffff-1111-0000-0000-000000000004'),
  ('ffffffff-3333-0000-0000-000000000003', 'ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'ZZ STAGING FIXTURE — Go-Live', 'Geplanter Meilenstein.', 'upcoming', current_date + 25, null, 3,
   'ffffffff-1111-0000-0000-000000000004');

-- ------------------------------------------------------------- documents
-- Upload-shaped rows only. A POINTER row would require a real finalized
-- owner_generated_documents record, which this fixture deliberately does not
-- fabricate: the pointer path must be exercised against genuine commercial
-- documents, not synthetic ones.
--
-- storage_path values below intentionally reference objects that do NOT exist in
-- the bucket, so a download attempt exercises authorization and signed-URL
-- minting without any fixture bytes being uploaded to staging Storage.
insert into public.customer_documents (
  id, organization_id, project_id, category, title, storage_path, content_type, size_bytes,
  customer_visible, published_at, archived_at, uploaded_by
)
values
  ('ffffffff-4444-0000-0000-000000000001', 'ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'project_document', 'ZZ STAGING FIXTURE — Veröffentlichtes Dokument',
   'ffffffff-0000-0000-0000-00000000000a/ffffffff-2222-0000-0000-000000000001/zz-staging-fixture-published.pdf',
   'application/pdf', 12345, true, now() - interval '5 days', null, 'ffffffff-1111-0000-0000-000000000004'),

  ('ffffffff-4444-0000-0000-000000000002', 'ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'project_document', 'ZZ STAGING FIXTURE — Unveröffentlichtes Dokument (muss unsichtbar sein)',
   'ffffffff-0000-0000-0000-00000000000a/ffffffff-2222-0000-0000-000000000001/zz-staging-fixture-unpublished.pdf',
   'application/pdf', 2345, false, null, null, 'ffffffff-1111-0000-0000-000000000004'),

  ('ffffffff-4444-0000-0000-000000000003', 'ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'project_document', 'ZZ STAGING FIXTURE — Archiviertes Dokument (muss unsichtbar sein)',
   'ffffffff-0000-0000-0000-00000000000a/ffffffff-2222-0000-0000-000000000001/zz-staging-fixture-archived.pdf',
   'application/pdf', 3456, false, now() - interval '10 days', now() - interval '2 days', 'ffffffff-1111-0000-0000-000000000004'),

  ('ffffffff-4444-0000-0000-00000000000b', 'ffffffff-0000-0000-0000-00000000000b', 'ffffffff-2222-0000-0000-00000000000b',
   'project_document', 'ZZ STAGING FIXTURE — Dokument der anderen Organisation',
   'ffffffff-0000-0000-0000-00000000000b/ffffffff-2222-0000-0000-00000000000b/zz-staging-fixture-other-org.pdf',
   'application/pdf', 4567, true, now() - interval '5 days', null, 'ffffffff-1111-0000-0000-000000000004');

-- -------------------------------------------------------------- invoices
-- owner_invoices.business_entity_id is NOT NULL. On a real staging project the
-- owner's own entity already exists and is reused; a fixture entity is created
-- only when the target has none at all, and it carries the same removable prefix.
insert into public.owner_business_entities (id, slug, display_name, legal_name)
select 'ffffffff-6666-0000-0000-000000000001', 'zz-staging-fixture-entity',
       'ZZ STAGING FIXTURE — Geschäftsbetrieb', 'ZZ STAGING FIXTURE'
where not exists (select 1 from public.owner_business_entities);

insert into public.owner_invoices (
  id, business_entity_id, organization_id, invoice_number, status, issue_date, due_date, currency,
  net_total_cents, vat_total_cents, gross_total_cents, amount_paid_cents
)
select v.id, (select id from public.owner_business_entities order by created_at asc, id asc limit 1),
       v.organization_id, v.invoice_number, v.status, v.issue_date, v.due_date, v.currency,
       v.net_total_cents, v.vat_total_cents, v.gross_total_cents, v.amount_paid_cents
from (values
  ('ffffffff-5555-0000-0000-000000000001'::uuid, 'ffffffff-0000-0000-0000-00000000000a'::uuid,
   'ZZ-FIXTURE-A-0001', 'issued', current_date - 14, current_date + 16, 'EUR',
   100000::bigint, 19000::bigint, 119000::bigint, 0::bigint),
  ('ffffffff-5555-0000-0000-000000000002'::uuid, 'ffffffff-0000-0000-0000-00000000000a'::uuid,
   'ZZ-FIXTURE-A-0002', 'paid', current_date - 60, current_date - 30, 'EUR',
   50000, 9500, 59500, 59500),
  -- Organization B's invoice: must never appear for organization A.
  ('ffffffff-5555-0000-0000-00000000000b'::uuid, 'ffffffff-0000-0000-0000-00000000000b'::uuid,
   'ZZ-FIXTURE-B-0001', 'issued', current_date - 14, current_date + 16, 'EUR',
   200000, 38000, 238000, 0),
  -- An invoice with NO organization: the null-organization gap migration 4 fixes.
  ('ffffffff-5555-0000-0000-0000000000f0'::uuid, null::uuid,
   'ZZ-FIXTURE-UNASSIGNED-0001', 'issued', current_date - 7, current_date + 23, 'EUR',
   30000, 5700, 35700, 0)
) as v(id, organization_id, invoice_number, status, issue_date, due_date, currency,
       net_total_cents, vat_total_cents, gross_total_cents, amount_paid_cents);

insert into public.customer_project_invoices (organization_id, project_id, invoice_id, linked_by)
values
  ('ffffffff-0000-0000-0000-00000000000a', 'ffffffff-2222-0000-0000-000000000001',
   'ffffffff-5555-0000-0000-000000000001', 'ffffffff-1111-0000-0000-000000000004');

commit;

\echo ''
\echo 'Staging fixtures created. Every row is prefixed "ZZ STAGING FIXTURE" / "ZZ-FIXTURE".'
\echo 'Remove them with: psql "$DATABASE_URL" -f scripts/staging/cleanup-staging-fixtures.sql'
\echo ''
