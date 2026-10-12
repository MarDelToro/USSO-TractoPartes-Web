begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listings',
  'listings',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/mpeg', 'video/3gpp', 'video/x-msvideo'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Evidencia de subastas visible" on storage.objects;
create policy "Evidencia de subastas visible"
on storage.objects for select
to public
using (bucket_id = 'listings');

drop policy if exists "Admin sube evidencia de subastas" on storage.objects;
create policy "Admin sube evidencia de subastas"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listings' and public.is_admin());

drop policy if exists "Admin actualiza evidencia de subastas" on storage.objects;
create policy "Admin actualiza evidencia de subastas"
on storage.objects for update
to authenticated
using (bucket_id = 'listings' and public.is_admin())
with check (bucket_id = 'listings' and public.is_admin());

drop policy if exists "Admin elimina evidencia de subastas" on storage.objects;
create policy "Admin elimina evidencia de subastas"
on storage.objects for delete
to authenticated
using (bucket_id = 'listings' and public.is_admin());

commit;
