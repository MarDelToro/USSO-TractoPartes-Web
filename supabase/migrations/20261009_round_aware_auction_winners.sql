-- El ganador siempre debe salir de la ronda actual, nunca de una ronda anterior.
drop function if exists public.close_listing(uuid);

create function public.close_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round integer;
  v_winner uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cerrar subastas';
  end if;

  select auction_round into v_round
  from public.listings
  where id = p_listing_id
  for update;

  if not found then raise exception 'La subasta no existe'; end if;

  select b.user_id into v_winner
  from public.bids b
  where b.listing_id = p_listing_id
    and b.auction_round = v_round
  order by b.amount desc, b.created_at desc
  limit 1;

  update public.listings
  set status = 'closed', winner_id = v_winner, ends_at = coalesce(ends_at, now())
  where id = p_listing_id;
end;
$$;

drop function if exists public.expire_listings();

create function public.expire_listings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede finalizar subastas';
  end if;

  update public.listings l
  set status = 'closed',
      winner_id = (
        select b.user_id
        from public.bids b
        where b.listing_id = l.id
          and b.auction_round = l.auction_round
        order by b.amount desc, b.created_at desc
        limit 1
      )
  where l.status = 'active'
    and l.ends_at is not null
    and l.ends_at <= now();
end;
$$;

-- Repara ganadores que ya hayan quedado guardados con una ronda incorrecta.
update public.listings l
set winner_id = (
  select b.user_id
  from public.bids b
  where b.listing_id = l.id
    and b.auction_round = l.auction_round
  order by b.amount desc, b.created_at desc
  limit 1
)
where l.status = 'closed' or (l.ends_at is not null and l.ends_at <= now());

revoke all on function public.close_listing(uuid) from public, anon;
revoke all on function public.expire_listings() from public, anon;
grant execute on function public.close_listing(uuid) to authenticated;
grant execute on function public.expire_listings() to authenticated;
