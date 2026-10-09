-- Toda nueva oferta debe superar el precio actual por al menos $1,000 MXN.
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

  v_minimum := v_current + 1000;
  if new.amount < v_minimum then
    raise exception 'La puja mínima es $%', trim(to_char(v_minimum, 'FM999G999G999G990'));
  end if;

  return new;
end;
$$;
