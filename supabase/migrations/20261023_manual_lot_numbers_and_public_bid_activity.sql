-- El número comercial del lote lo asigna USSO; no depende del orden de creación.
alter table public.listings
  add column if not exists lot_number text;

create unique index if not exists listings_lot_number_unique
  on public.listings (lower(btrim(lot_number)))
  where lot_number is not null and btrim(lot_number) <> '';

comment on column public.listings.lot_number is
  'Número público del lote asignado manualmente por administración.';

-- Conserva el número del lote que ya está anunciado actualmente.
with current_lot_3017 as (
  select id
  from public.listings
  where (lot_number is null or btrim(lot_number) = '')
    and lower(coalesce(category, '')) = 'estructuras'
    and lower(coalesce(title, '')) like '%kenworth%t680%'
  order by created_at desc
  limit 1
)
update public.listings l
set lot_number = '3017'
from current_lot_3017 target
where l.id = target.id;

-- Actividad pública segura: revela únicamente el número de miembro, el estado
-- capturado en el perfil, el monto y la hora de la puja.
create or replace function public.get_public_bid_activity(
  p_listing_id uuid,
  p_limit integer default 12
)
returns table (
  member_number bigint,
  state text,
  amount numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.member_number,
    nullif(btrim(regexp_replace(coalesce(p.city, ''), '^.*,\s*', '')), '') as state,
    b.amount,
    b.created_at
  from public.bids b
  join public.profiles p on p.id = b.user_id
  join public.listings l on l.id = b.listing_id
  where b.listing_id = p_listing_id
    and b.auction_round = coalesce(l.auction_round, 1)
    and p.member_number is not null
  order by b.created_at desc
  limit least(greatest(coalesce(p_limit, 12), 1), 30);
$$;

revoke all on function public.get_public_bid_activity(uuid, integer) from public;
grant execute on function public.get_public_bid_activity(uuid, integer) to anon, authenticated;
