-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — designAparts I inventory rows.
--
-- Purely ADDITIVE. It creates no table, no function, no policy and no index: the
-- schema from 20260906120000_private_bar_inventory.sql was already
-- multi-apartment (private_bar_inventory is unique on (apartment_id,
-- product_id), private_bar_orders records apartment_id, and
-- private_bar_confirm_order() takes p_apartment_id). The second apartment needs
-- rows, not a redesign.
--
-- APARTMENT IDS
--   designAparts I  → 'bolagio-designaparts-1'  (new, introduced here)
--   designAparts II → 'bolagio-apartment-1'     (existing, NOT touched here)
--
--   The designAparts II id is historical: it already keys live inventory and
--   real order history, so it is deliberately not renamed to match the
--   guest-facing label. src/private-bar/apartments.ts holds the same mapping and
--   is the only place the application reads it from.
--
-- WHY ON CONFLICT DO NOTHING, AND NOT AN UPSERT
--   stock 1 is the INITIAL count for a bottle that has never been tracked. It is
--   not a target state. If a row already exists its number is the real physical
--   count — possibly 0 after a guest took the bottle — and re-running this
--   migration, or replaying it on a later deployment, must never reset that.
--   supabase/seed/private_bar_stock_designaparts1.sql is where a restock is
--   recorded.
--
-- WHAT THIS MIGRATION MUST NOT DO, stated so a future edit has to be deliberate:
--   no UPDATE, no DELETE, no reseed of designAparts II, no renaming of any
--   apartment or product id, and no change to any existing order.
-- ─────────────────────────────────────────────────────────────────────────────
begin;

-- The five bottles the owner confirmed are physically in designAparts I.
-- product_id matches an id in src/private-bar/catalog.ts, which stays the single
-- source of truth for names and prices — no price is stored here.
insert into public.private_bar_inventory (apartment_id, product_id, stock)
values
  ('bolagio-designaparts-1', 'planeta-plumbago-nero-davola-2021', 1),
  ('bolagio-designaparts-1', 'ottella-rosesroses',                1),
  ('bolagio-designaparts-1', 'cavalchina-custoza-2025',           1),
  ('bolagio-designaparts-1', 'nunzio-ghiraldi-il-gruccione',      1),
  ('bolagio-designaparts-1', 'manz-grauburgunder-fruchtecke',     1)
on conflict (apartment_id, product_id) do nothing;

commit;
