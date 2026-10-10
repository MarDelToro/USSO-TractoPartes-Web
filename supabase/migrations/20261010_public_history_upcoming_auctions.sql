-- Historial público, programación de subastas y cierre automático seguro.
alter table public.listings
  add column if not exists starts_at timestamptz;

update public.listings
set starts_at = coalesce(starts_at, created_at, now())
where starts_at is null;

drop policy if exists "Todos ven piezas activas" on public.listings;
drop policy if exists "Todos ven subastas publicadas" on public.listings;

-- El historial es evidencia comercial pública. Las tablas de perfiles y pujas
-- conservan sus propias políticas y no se abren con esta regla.
create policy "Todos ven subastas publicadas"
on public.listings
for select
to public
using (status in ('active', 'closed') or public.is_admin());

-- Cualquier visitante puede pedir que se materialice un vencimiento. La
-- función no acepta parámetros ni permite elegir valores: solo cierra lotes
-- cuyo reloj ya llegó realmente a cero.
create or replace function public.expire_listings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
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

revoke all on function public.expire_listings() from public;
grant execute on function public.expire_listings() to anon, authenticated;

-- La base también impide pujar antes del inicio o después del cierre, aunque
-- alguien intente saltarse la interfaz.
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
  v_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  select coalesce(current_price, start_price, 0), auction_round, status, starts_at, ends_at
    into v_current, v_round, v_status, v_starts_at, v_ends_at
  from public.listings
  where id = new.listing_id
  for update;

  if not found then raise exception 'La subasta no existe'; end if;
  if v_status <> 'active' then raise exception 'La subasta no está activa'; end if;
  if v_starts_at is not null and v_starts_at > now() then raise exception 'La subasta todavía no inicia'; end if;
  if v_ends_at is null or v_ends_at <= now() then raise exception 'La subasta ya finalizó'; end if;

  new.auction_round := v_round;

  select user_id into v_leader
  from public.bids
  where listing_id = new.listing_id and auction_round = v_round
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

