-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — Paulaner Spezi joins designAparts I.
--
-- Purely ADDITIVE, one row. No schema change, no function change: the product
-- flows through exactly the same path as every other drink — the trusted
-- catalogue in src/private-bar/catalog.ts prices it, the confirmation endpoint
-- validates it against designAparts I's product list, and
-- private_bar_confirm_order() decrements THIS row atomically when a guest takes
-- one. Nothing about it is special-cased anywhere.
--
-- WHY ON CONFLICT DO NOTHING
--   stock 4 is the INITIAL count for a shelf that has never been tracked. If
--   the row already exists its number is the real physical count — possibly 0
--   after a guest took the last bottle — and replaying this migration must
--   never reset it. supabase/seed/private_bar_stock_designaparts1.sql records a
--   restock.
--
-- NOT TOUCHED HERE: designAparts II, which does not stock this product, and
-- every other inventory row in either apartment.
-- ─────────────────────────────────────────────────────────────────────────────
begin;

insert into public.private_bar_inventory (apartment_id, product_id, stock)
values ('bolagio-designaparts-1', 'paulaner-spezi', 4)
on conflict (apartment_id, product_id) do nothing;

commit;
