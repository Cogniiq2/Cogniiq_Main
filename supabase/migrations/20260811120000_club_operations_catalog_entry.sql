-- Club Operations (Vereinsbetrieb) — inert catalog entry.
--
-- Additive only. This migration inserts a single catalog row and changes nothing else. It creates
-- no table, alters no column, relaxes no constraint and touches no existing row.
--
-- The entry is deliberately inert on four independent levels:
--
--   1. is_active = false, so solution_catalog's own RLS select policy
--      ("solution_catalog_select_active_or_admin") hides the row from every non-admin.
--   2. default_implementation_key = 'unavailable', so any instance provisioned from it would
--      resolve to the safe fallback module in the closed frontend registry.
--   3. No organization_solutions row references it, and RLS on organization_solutions only ever
--      returns rows for organizations the caller is an active member of. Declaring a catalog key
--      grants nobody anything.
--   4. organization_solutions_implementation_key_check is intentionally NOT widened here. The
--      database therefore still rejects implementation_key = 'club_operations' outright, so not
--      even a platform admin can attach a live instance until a later, explicit migration.
--
-- Access model for later phases (documented here so the constraint is not lost):
--   Only organization_solutions.status = 'active' may grant access. 'provisioning', 'paused' and
--   'disabled' must all deny. Authorization is decided server-side from the database on every
--   request; the frontend gate is a convenience, never the boundary.
--
-- The config JSON of a future instance may hold non-secret values only — at most a server-recognized
-- connection alias that the server resolves to real connection details out of its own environment.
-- Never a Supabase URL, service-role key, admin secret or any other unrestricted target identifier.

insert into public.solution_catalog (key, label, description, default_implementation_key, is_active, sort_order)
values (
  'club_operations',
  'Vereinsbetrieb',
  'Betriebs-Cockpit fuer Sportvereine: Buchungen, Zahlungen, Rechnungen, Berichte, Mitglieder und Gutscheine.',
  'unavailable',
  false,
  50
)
on conflict (key) do nothing;

comment on table public.solution_catalog is
  'Controlled list of solution product types. Customer-visible when is_active. Mutated by platform admins only.';
