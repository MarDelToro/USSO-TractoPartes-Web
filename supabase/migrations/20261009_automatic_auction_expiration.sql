-- Permite que cualquier cuenta autenticada active de forma segura el cierre
-- automático de subastas vencidas. La función solo puede cerrar lotes cuyo
-- reloj ya llegó a cero y calcula el ganador de la ronda actual.
create or replace function public.expire_listings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
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

revoke all on function public.expire_listings() from public, anon;
grant execute on function public.expire_listings() to authenticated;
