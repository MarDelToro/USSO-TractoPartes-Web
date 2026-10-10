begin;

create table if not exists public.auction_watchers (
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reminded_at timestamptz,
  primary key (listing_id, user_id)
);

alter table public.auction_watchers enable row level security;

drop policy if exists "Usuarios ven sus recordatorios" on public.auction_watchers;
create policy "Usuarios ven sus recordatorios"
on public.auction_watchers for select to authenticated
using (auth.uid() = user_id);

create or replace function public.toggle_auction_watch(p_listing_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;

  if p_enabled then
    if not exists (
      select 1 from public.listings
      where id = p_listing_id
        and status = 'active'
        and starts_at > now()
    ) then
      raise exception 'Solo puedes activar avisos para subastas próximas';
    end if;

    insert into public.auction_watchers(listing_id, user_id)
    values (p_listing_id, auth.uid())
    on conflict (listing_id, user_id) do nothing;
  else
    delete from public.auction_watchers
    where listing_id = p_listing_id and user_id = auth.uid();
  end if;
end;
$$;

revoke all on function public.toggle_auction_watch(uuid, boolean) from public, anon;
grant execute on function public.toggle_auction_watch(uuid, boolean) to authenticated;

create unique index if not exists notifications_one_upcoming_reminder
on public.notifications(user_id, listing_id, notification_type)
where notification_type = 'auction_starts_24h';

create or replace function public.dispatch_upcoming_auction_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (user_id, listing_id, phone, title, amount, message, status, notification_type, auction_round)
  select
    w.user_id,
    l.id,
    p.phone,
    l.title,
    l.start_price,
    '¡La subasta de ' || l.title || ' comienza en menos de 24 horas! Entra a USSO Tractopartes para revisar la evidencia y estar listo para pujar.',
    'pending',
    'auction_starts_24h',
    l.auction_round
  from public.auction_watchers w
  join public.listings l on l.id = w.listing_id
  join public.profiles p on p.id = w.user_id
  where w.reminded_at is null
    and l.status = 'active'
    and l.starts_at > now()
    and l.starts_at <= now() + interval '24 hours'
  on conflict (user_id, listing_id, notification_type)
    where notification_type = 'auction_starts_24h' do nothing;

  update public.auction_watchers w
  set reminded_at = now()
  from public.listings l
  where l.id = w.listing_id
    and w.reminded_at is null
    and l.status = 'active'
    and l.starts_at > now()
    and l.starts_at <= now() + interval '24 hours';
end;
$$;

revoke all on function public.dispatch_upcoming_auction_reminders() from public;
grant execute on function public.dispatch_upcoming_auction_reminders() to anon, authenticated;

-- Ejecuta los recordatorios aun cuando ningún usuario tenga abierta la web.
create extension if not exists pg_cron;
select cron.schedule(
  'usso-upcoming-auction-reminders',
  '*/5 * * * *',
  'select public.dispatch_upcoming_auction_reminders()'
);

create or replace function public.reset_auction_watch_reminders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.starts_at is distinct from old.starts_at then
    update public.auction_watchers set reminded_at = null where listing_id = new.id;
    delete from public.notifications
    where listing_id = new.id and notification_type = 'auction_starts_24h';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_reset_watch_reminders on public.listings;
create trigger listings_reset_watch_reminders
after update of starts_at on public.listings
for each row execute function public.reset_auction_watch_reminders();

commit;
