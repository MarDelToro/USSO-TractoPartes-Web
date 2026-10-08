begin;

create table if not exists public.authorization_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  city text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.authorization_requests enable row level security;

drop policy if exists "Usuario ve su solicitud" on public.authorization_requests;
create policy "Usuario ve su solicitud"
on public.authorization_requests for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admin ve solicitudes" on public.authorization_requests;
create policy "Admin ve solicitudes"
on public.authorization_requests for select
to authenticated
using (public.is_admin());

revoke all on table public.authorization_requests from anon, authenticated;
grant select on table public.authorization_requests to authenticated;

create or replace function public.request_bid_authorization()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user;

  if not found then
    raise exception 'No existe el perfil del usuario';
  end if;

  if coalesce(v_profile.authorized, false) then
    raise exception 'Tu cuenta ya está autorizada';
  end if;

  insert into public.authorization_requests (
    user_id, email, full_name, phone, city, status, requested_at, reviewed_at, reviewed_by
  ) values (
    v_user,
    auth.jwt() ->> 'email',
    v_profile.full_name,
    v_profile.phone,
    v_profile.city,
    'pending',
    now(),
    null,
    null
  )
  on conflict (user_id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone,
      city = excluded.city,
      status = 'pending',
      requested_at = now(),
      reviewed_at = null,
      reviewed_by = null;
end;
$$;

revoke all on function public.request_bid_authorization() from public, anon;
grant execute on function public.request_bid_authorization() to authenticated;

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
    select 1 from public.profiles
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

  update public.authorization_requests
  set status = case when p_authorized then 'approved' else 'revoked' end,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.admin_set_user_authorized(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_authorized(uuid, boolean) to authenticated;

commit;
