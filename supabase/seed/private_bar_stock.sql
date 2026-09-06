-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — current physical stock
--
-- Re-run this file whenever the Private Bar is fully restocked.
-- It SETS the absolute stock count; it does not add to the existing count.
--
-- Apartment:
-- bolagio-apartment-1
-- ─────────────────────────────────────────────────────────────────────────────

begin;

update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'stella-rossa-prosecco-doc-brut';
-- Stella Rossa Prosecco DOC Brut


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'ploner-marell';
-- Ploner Marell Brut


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'masseria-borgo-dei-trulli-primitivo';
-- Masseria Borgo dei Trulli Primitivo


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'covo-moro';
-- Covo Moro


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'ploner-sauvignon';
-- Ploner Sauvignon


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'tiefenbrunner-merus-gewuerztraminer-2022';
-- Tiefenbrunner Merus Gewürztraminer 2022


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'biancavigna-2022';
-- BiancaVigna 2022


update public.private_bar_inventory
set stock = 3, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 'bayreuther-hell';
-- Bayreuther Hell 0,5 l


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-apartment-1'
  and product_id = 's-pellegrino';
-- S.Pellegrino 0,75 l


-- Verify the resulting inventory:
select product_id, stock
from public.private_bar_inventory
where apartment_id = 'bolagio-apartment-1'
order by product_id;

commit;
