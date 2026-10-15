begin;

alter table public.listings
  add column if not exists buy_now_price numeric(12,2);

alter table public.listings
  drop constraint if exists listings_buy_now_price_positive;

alter table public.listings
  add constraint listings_buy_now_price_positive
  check (buy_now_price is null or buy_now_price > 0);

comment on column public.listings.buy_now_price is
  'Precio fijo opcional para comprar el lote antes de que inicie la subasta.';

commit;
