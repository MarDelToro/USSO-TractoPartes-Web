-- Refuerza en la base de datos el mismo mínimo que muestra la interfaz.
create or replace function public.enforce_minimum_bid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric;
  v_step numeric;
  v_minimum numeric;
begin
  select coalesce(current_price, start_price, 0)
    into v_current
  from public.listings
  where id = new.listing_id
  for update;

  if not found then
    raise exception 'La subasta no existe';
  end if;

  v_step := greatest(500, round((v_current * 0.02) / 500) * 500);
  v_minimum := v_current + v_step;

  if new.amount < v_minimum then
    raise exception 'La puja mínima es $%', trim(to_char(v_minimum, 'FM999G999G999G990'));
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_minimum_bid_before_insert on public.bids;
create trigger enforce_minimum_bid_before_insert
before insert on public.bids
for each row execute function public.enforce_minimum_bid();

revoke all on function public.enforce_minimum_bid() from public, anon, authenticated;
