begin;

alter table public.listings
  add column if not exists media_urls jsonb not null default '[]'::jsonb,
  add column if not exists product_details jsonb not null default '[]'::jsonb;

update public.listings
set media_urls = jsonb_build_array(
  jsonb_build_object('type', 'image', 'url', image_url)
)
where coalesce(image_url, '') <> ''
  and (media_urls is null or media_urls = '[]'::jsonb);

alter table public.listings
  drop constraint if exists listings_media_urls_array,
  drop constraint if exists listings_product_details_array;

alter table public.listings
  add constraint listings_media_urls_array
    check (jsonb_typeof(media_urls) = 'array'),
  add constraint listings_product_details_array
    check (jsonb_typeof(product_details) = 'array');

commit;
