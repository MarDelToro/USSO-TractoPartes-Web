-- Cada participante puede consultar el resultado de la ronda en la que pujó.
-- Las subastas activas siguen siendo públicas, pero una cerrada no expone sus
-- datos a cuentas ajenas a esa ronda.
drop policy if exists "Todos ven piezas activas" on public.listings;
drop policy if exists "Todos ven subastas publicadas" on public.listings;

create policy "Todos ven subastas publicadas"
on public.listings
for select
to public
using (
  status = 'active'
  or public.is_admin()
  or (
    status = 'closed'
    and auth.uid() is not null
    and (
      winner_id = auth.uid()
      or exists (
        select 1
        from public.bids b
        where b.listing_id = listings.id
          and b.auction_round = listings.auction_round
          and b.user_id = auth.uid()
      )
    )
  )
);
