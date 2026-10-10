-- Buzón personal persistente: el usuario puede leer u ocultar avisos sin
-- eliminar el registro administrativo de la notificación.
begin;

alter table public.notifications
  add column if not exists read_at timestamptz,
  add column if not exists dismissed_at timestamptz;

create or replace function public.set_notification_read(
  p_notification_id text,
  p_read boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;

  update public.notifications
     set read_at = case when p_read then now() else null end
   where id::text = p_notification_id
     and user_id = auth.uid()
     and dismissed_at is null;
end;
$$;

create or replace function public.dismiss_notification(p_notification_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;

  update public.notifications
     set dismissed_at = now(),
         read_at = coalesce(read_at, now())
   where id::text = p_notification_id
     and user_id = auth.uid();
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;

  update public.notifications
     set read_at = coalesce(read_at, now())
   where user_id = auth.uid()
     and dismissed_at is null;
end;
$$;

create or replace function public.dismiss_read_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;

  update public.notifications
     set dismissed_at = now()
   where user_id = auth.uid()
     and read_at is not null
     and dismissed_at is null;
end;
$$;

revoke all on function public.set_notification_read(text, boolean) from public, anon;
revoke all on function public.dismiss_notification(text) from public, anon;
revoke all on function public.mark_all_notifications_read() from public, anon;
revoke all on function public.dismiss_read_notifications() from public, anon;

grant execute on function public.set_notification_read(text, boolean) to authenticated;
grant execute on function public.dismiss_notification(text) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.dismiss_read_notifications() to authenticated;

commit;
