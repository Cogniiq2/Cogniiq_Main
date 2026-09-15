-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — current physical stock, designAparts I
--
-- Re-run this file whenever designAparts I is restocked.
-- It SETS the absolute stock count; it does not add to the existing count.
--
-- Apartment:
-- bolagio-designaparts-1   (guest-facing: designAparts I)
--
-- It touches designAparts I rows only. designAparts II is restocked with
-- supabase/seed/private_bar_stock.sql and is never affected by this file.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-designaparts-1'
  and product_id = 'planeta-plumbago-nero-davola-2021';
-- Planeta Plumbago Nero d'Avola Menfi DOC 2021


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-designaparts-1'
  and product_id = 'ottella-rosesroses';
-- Ottella RosesRoses Rosato Alto Mincio IGT


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-designaparts-1'
  and product_id = 'cavalchina-custoza-2025';
-- Cavalchina Custoza DOC 2025


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-designaparts-1'
  and product_id = 'nunzio-ghiraldi-il-gruccione';
-- Nunzio Ghiraldi Il Gruccione Lugana DOC


update public.private_bar_inventory
set stock = 1, updated_at = now()
where apartment_id = 'bolagio-designaparts-1'
  and product_id = 'manz-grauburgunder-fruchtecke';
-- Manz Grauburgunder – Edition 95 Jahre Fruchtecke


update public.private_bar_inventory
set stock = 3, updated_at = now()
where apartment_id = 'bolagio-designaparts-1'
  and product_id = 'bayreuther-hell';
-- Bayreuther Hell 0,5 l — the same catalogue product designAparts II sells;
-- this file only ever touches the designAparts I shelf.


-- Verify the resulting inventory:
select product_id, stock
from public.private_bar_inventory
where apartment_id = 'bolagio-designaparts-1'
order by product_id;

commit;
