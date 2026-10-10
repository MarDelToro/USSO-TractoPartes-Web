begin;

-- Compatibilidad para la galería y la ficha detallada de todos los lotes.
-- Es intencionalmente repetible: puede ejecutarse aunque la migración anterior ya se haya aplicado.
alter table public.listings
  add column if not exists media_urls jsonb not null default '[]'::jsonb,
  add column if not exists product_details jsonb not null default '[]'::jsonb;

update public.listings
set media_urls = jsonb_build_array(
  jsonb_build_object('type', 'image', 'url', image_url)
)
where image_url is not null
  and btrim(image_url) <> ''
  and (media_urls is null or media_urls = '[]'::jsonb);

-- Cada cuenta recibe un folio secuencial permanente administrado por Postgres.
create sequence if not exists public.member_number_seq start with 1000 increment by 1;

alter table public.profiles
  add column if not exists member_number bigint;

alter table public.profiles
  alter column member_number set default nextval('public.member_number_seq');

update public.profiles
set member_number = nextval('public.member_number_seq')
where member_number is null;

select setval(
  'public.member_number_seq',
  greatest((select coalesce(max(member_number), 999) from public.profiles), 999),
  true
);

alter table public.profiles
  alter column member_number set not null;

create unique index if not exists profiles_member_number_key
  on public.profiles(member_number);

commit;
