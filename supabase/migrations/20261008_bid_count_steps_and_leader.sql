-- Cuenta todas las ofertas, usa incrementos de $100 y evita que el líder
-- vuelva a pujar hasta que otro usuario lo supere.
alter table public.listings
  add column if not exists bid_count integer not null default 0;

update public.listings l
set bid_count = (
  select count(*)::integer
  from public.bids b
  where b.listing_id = l.id
);

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
begin
  select coalesce(current_price, start_price, 0)
    into v_current
  from public.listings
  where id = new.listing_id
  for update;

  if not found then
    raise exception 'La subasta no existe';
  end if;

  select user_id
    into v_leader
  from public.bids
  where listing_id = new.listing_id
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

create or replace function public.increment_listing_bid_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set bid_count = bid_count + 1
  where id = new.listing_id;
  return new;
end;
$$;

drop trigger if exists increment_listing_bid_count_after_insert on public.bids;
create trigger increment_listing_bid_count_after_insert
after insert on public.bids
for each row execute function public.increment_listing_bid_count();

revoke all on function public.increment_listing_bid_count() from public, anon, authenticated;
