-- Club Operations (Vereinsbetrieb) — activation.
--
-- Counterpart to 20260811120000_club_operations_catalog_entry.sql, which deliberately left the
-- solution inert. This migration removes exactly the two database-side blocks that kept a live
-- instance unattachable, and nothing else.
--
-- What this migration does:
--   1. Widens organization_solutions_implementation_key_check to admit 'club_operations', so a
--      platform admin can attach an instance whose implementation_key names the real module.
--   2. Marks the catalog row active and points its default implementation at the real module, so
--      the provisioning UI can offer it.
--
-- What this migration deliberately does NOT do:
--   * create or modify any organization, membership, invitation or organization_solutions row.
--     Attaching SV Heinersreuth (or any other client) to this solution is an operational step
--     performed through the existing admin provisioning path, not a schema change. No customer,
--     organization, user, email or project identifier appears in this file.
--   * relax, drop or create any RLS policy. Access to organization_solutions is unchanged: RLS
--     still returns rows only for organizations the caller is an active member of.
--   * grant any privilege, or change any column grant.
--
-- Access model (unchanged, restated because this is the migration that makes it load-bearing):
--   Authorization is decided server-side from the database on every request. The frontend registry
--   and route guards are convenience only. organization_solutions.status = 'active' is the only
--   status that grants a working surface; 'provisioning', 'paused' and 'disabled' do not.
--
-- The config JSON of an instance may hold non-secret values only. This release recognizes exactly
-- one optional key, `data_source`: 'demo' renders the module's built-in demonstration fixtures
-- behind an explicit notice, any other value (or its absence) uses the authenticated server-side
-- read gateway. It is not a credential and not a connection target, and it is not customer-writable:
-- the existing organization_solutions_write_admin policy admits INSERT/UPDATE/DELETE only for
-- is_platform_admin(), which this migration does not touch.

alter table public.organization_solutions
  drop constraint if exists organization_solutions_implementation_key_check;

alter table public.organization_solutions
  add constraint organization_solutions_implementation_key_check check (
    implementation_key in (
      'ai_receptionist',
      'automation_workspace',
      'club_operations',
      'pankofer_operations',
      'unavailable'
    )
  );

update public.solution_catalog
set
  default_implementation_key = 'club_operations',
  is_active = true
where key = 'club_operations';
