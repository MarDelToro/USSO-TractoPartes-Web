-- Guarda una notificación personal al cerrar cada ronda y evita duplicados.
create or replace function public.expire_listings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  update public.listings l
  set status = 'closed',
      winner_id = (
        select b.user_id from public.bids b
        where b.listing_id = l.id and b.auction_round = l.auction_round
        order by b.amount desc, b.created_at desc limit 1
      )
  where l.status = 'active' and l.ends_at is not null and l.ends_at <= now();
end;
$$;

revoke all on function public.expire_listings() from public, anon;
grant execute on function public.expire_listings() to authenticated;

alter table public.notifications add column if not exists notification_type text;
alter table public.notifications add column if not exists auction_round integer;

create unique index if not exists notifications_one_result_per_round
on public.notifications (user_id, listing_id, auction_round, notification_type)
where notification_type in ('auction_won', 'auction_lost');

create or replace function public.notify_auction_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_bidder record;
begin
  if old.status = 'active' and new.status = 'closed' and new.winner_id is not null then
    select * into v_profile from public.profiles where id = new.winner_id;

    if coalesce((v_profile.notification_preferences ->> 'gane')::boolean, true) then
      insert into public.notifications
        (user_id, listing_id, phone, title, amount, message, status, notification_type, auction_round)
      values
        (new.winner_id, new.id, v_profile.phone, new.title, new.current_price,
         '¡Tú eres el ganador! Ganaste la subasta de ' || new.title || ' con una oferta final de $' || trim(to_char(new.current_price, 'FM999G999G999G990')) || '.',
         'pending', 'auction_won', new.auction_round)
      on conflict (user_id, listing_id, auction_round, notification_type)
        where notification_type in ('auction_won', 'auction_lost') do nothing;
    end if;

    for v_bidder in
      select distinct b.user_id, p.phone, p.notification_preferences
      from public.bids b
      join public.profiles p on p.id = b.user_id
      where b.listing_id = new.id
        and b.auction_round = new.auction_round
        and b.user_id <> new.winner_id
    loop
      if coalesce((v_bidder.notification_preferences ->> 'perdi')::boolean, true) then
        insert into public.notifications
          (user_id, listing_id, phone, title, amount, message, status, notification_type, auction_round)
        values
          (v_bidder.user_id, new.id, v_bidder.phone, new.title, new.current_price,
           'La subasta de ' || new.title || ' finalizó. Esta vez no ganaste; el precio final fue $' || trim(to_char(new.current_price, 'FM999G999G999G990')) || '.',
           'pending', 'auction_lost', new.auction_round)
        on conflict (user_id, listing_id, auction_round, notification_type)
          where notification_type in ('auction_won', 'auction_lost') do nothing;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_notify_auction_result on public.listings;
create trigger listings_notify_auction_result
after update of status, winner_id on public.listings
for each row execute function public.notify_auction_result();
