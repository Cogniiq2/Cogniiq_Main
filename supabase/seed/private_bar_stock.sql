-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — THE ONE PLACE TO ENTER STOCK COUNTS.
--
-- Replace the nine numbers below with how many bottles are physically in the
-- apartment, then run this whole file in the Supabase SQL editor. Re-run it any
-- time stock is refilled — it sets absolute counts, it does not add to them.
--
-- 0 means the product shows as "Nicht verfügbar" and cannot be selected.
-- The apartment id must match PRIVATE_BAR_APARTMENT_ID in src/private-bar/config.ts.
-- ─────────────────────────────────────────────────────────────────────────────
begin;

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'stella-rossa-prosecco-doc-brut';        -- Stella Rossa Prosecco DOC Brut

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'ploner-marell';                          -- Ploner Marell Brut

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'masseria-borgo-dei-trulli-primitivo';    -- Masseria Borgo dei Trulli Primitivo

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'covo-moro';                              -- Covo Moro

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'ploner-sauvignon';                       -- Ploner Sauvignon

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'tiefenbrunner-merus-gewuerztraminer-2022'; -- Tiefenbrunner Merus Gewürztraminer 2022

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'biancavigna-2022';                       -- BiancaVigna 2022

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 'bayreuther-hell';                        -- Bayreuther Hell 0,5 l

update public.private_bar_inventory set stock = 0, updated_at = now()
where apartment_id = 'bolagio-apartment-1' and product_id = 's-pellegrino';                           -- S.Pellegrino 0,75 l

-- Check what you just set:
select product_id, stock from public.private_bar_inventory
where apartment_id = 'bolagio-apartment-1' order by product_id;

commit;
