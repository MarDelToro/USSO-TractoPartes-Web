-- Preferencias personales del historial. Ocultar no elimina pujas, subastas ni
-- evidencia administrativa; solo retira el registro de la vista del usuario.
begin;

create table if not exists public.auction_history_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  auction_round integer not null default 1,
  hidden_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, listing_id, auction_round)
);

alter table public.auction_history_preferences enable row level security;

drop policy if exists "Usuario consulta su historial" on public.auction_history_preferences;
create policy "Usuario consulta su historial"
on public.auction_history_preferences for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Usuario oculta su historial" on public.auction_history_preferences;
create policy "Usuario oculta su historial"
on public.auction_history_preferences for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Usuario actualiza su historial" on public.auction_history_preferences;
create policy "Usuario actualiza su historial"
on public.auction_history_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.auction_history_preferences to authenticated;

commit;
