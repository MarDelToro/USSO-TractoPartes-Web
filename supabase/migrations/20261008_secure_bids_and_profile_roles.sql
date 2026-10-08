begin;

-- Las pujas solo deben crearse mediante place_bid(), que valida usuario,
-- autorización, estado de la subasta, fecha y precio dentro de una transacción.
drop policy if exists "Usuarios pujan" on public.bids;
revoke insert, update, delete on table public.bids from anon, authenticated;

revoke execute on function public.place_bid(uuid, numeric) from public, anon;
grant execute on function public.place_bid(uuid, numeric) to authenticated;

-- Los perfiles se crean mediante el trigger de Auth. Un usuario normal puede
-- editar únicamente sus datos de contacto, nunca role ni authorized.
revoke insert, update, delete on table public.profiles from anon, authenticated;
grant update (full_name, phone, city, avatar_url)
  on table public.profiles to authenticated;

create or replace function public.admin_set_user_authorized(
  p_user_id uuid,
  p_authorized boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'No tienes permiso de administrador';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = p_user_id and role = 'admin'
  ) then
    raise exception 'No se puede cambiar la autorización de un administrador';
  end if;

  update public.profiles
  set authorized = p_authorized,
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'El usuario no existe';
  end if;
end;
$$;

revoke all on function public.admin_set_user_authorized(uuid, boolean) from public;
grant execute on function public.admin_set_user_authorized(uuid, boolean) to authenticated;

commit;
