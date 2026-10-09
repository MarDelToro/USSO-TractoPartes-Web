-- Cada reapertura inicia una ronda nueva sin borrar el historial anterior.
alter table public.listings
  add column if not exists auction_round integer not null default 1;

alter table public.bids
  add column if not exists auction_round integer not null default 1;

create index if not exists bids_listing_round_created_idx
  on public.bids (listing_id, auction_round, created_at desc);

create or replace function public.enforce_minimum_bid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric;
  v_minimum numeric;
  v_leader uuid;
  v_round integer;
begin
  select coalesce(current_price, start_price, 0), auction_round
    into v_current, v_round
  from public.listings
  where id = new.listing_id
  for update;

  if not found then
    raise exception 'La subasta no existe';
  end if;

  new.auction_round := v_round;

  select user_id
    into v_leader
  from public.bids
  where listing_id = new.listing_id
    and auction_round = v_round
  order by amount desc, created_at desc
  limit 1;

  if v_leader = new.user_id then
    raise exception 'Tu puja ya es la más alta. Espera a que otra persona la supere';
  end if;

  v_minimum := v_current + 100;
  if new.amount < v_minimum then
    raise exception 'La puja mínima es $%', trim(to_char(v_minimum, 'FM999G999G999G990'));
  end if;

  return new;
end;
$$;
