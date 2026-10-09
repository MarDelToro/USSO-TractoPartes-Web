alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{"superada":true,"cierre":true,"gane":true,"perdi":true,"favorita":true}'::jsonb;

create or replace function public.set_notification_preferences(p_preferences jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;

  update public.profiles
  set notification_preferences = jsonb_build_object(
    'superada', coalesce((p_preferences->>'superada')::boolean, true),
    'cierre', coalesce((p_preferences->>'cierre')::boolean, true),
    'gane', coalesce((p_preferences->>'gane')::boolean, true),
    'perdi', coalesce((p_preferences->>'perdi')::boolean, true),
    'favorita', coalesce((p_preferences->>'favorita')::boolean, true)
  ), updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.set_notification_preferences(jsonb) from public, anon;
grant execute on function public.set_notification_preferences(jsonb) to authenticated;
