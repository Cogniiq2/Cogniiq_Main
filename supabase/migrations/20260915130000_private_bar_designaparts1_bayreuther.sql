-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — Bayreuther Hell is now stocked in designAparts I too.
--
-- Purely ADDITIVE, and one row wide. 'bayreuther-hell' is NOT duplicated in the
-- catalogue: it stays one product (one id, one price, one photograph, one card)
-- that both apartments sell, and src/private-bar/apartments.ts simply lists it
-- for both. Only the stock is per-apartment, because the bottles physically are.
--
-- WHY ON CONFLICT DO NOTHING
--   stock 3 is the INITIAL count for a shelf that has never been tracked. If the
--   row already exists its number is the real physical count — possibly 0 after
--   a guest took the last bottle — and replaying this migration must never reset
--   it. supabase/seed/private_bar_stock_designaparts1.sql records a restock.
--
-- NOT TOUCHED HERE, deliberately:
--   designAparts II's own 'bayreuther-hell' row. Its count is live physical
--   state and is corrected through the seed file after looking at the shelf,
--   never blind-written by a migration.
-- ─────────────────────────────────────────────────────────────────────────────
begin;

insert into public.private_bar_inventory (apartment_id, product_id, stock)
values ('bolagio-designaparts-1', 'bayreuther-hell', 3)
on conflict (apartment_id, product_id) do nothing;

commit;
