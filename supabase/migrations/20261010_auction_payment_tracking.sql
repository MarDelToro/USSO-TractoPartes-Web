begin;

alter table public.listings
  add column if not exists payment_status text not null default 'pending',
  add column if not exists paid_amount numeric,
  add column if not exists paid_at timestamptz;

alter table public.listings
  drop constraint if exists listings_payment_status_check;

alter table public.listings
  add constraint listings_payment_status_check
  check (payment_status in ('pending', 'paid'));

create or replace function public.admin_set_auction_payment(
  p_listing_id uuid,
  p_status text,
  p_paid_amount numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Solo un administrador puede actualizar pagos';
  end if;

  if p_status not in ('pending', 'paid') then
    raise exception 'Estado de pago inválido';
  end if;

  update public.listings
  set payment_status = p_status,
      paid_amount = case
        when p_status = 'paid' then coalesce(p_paid_amount, current_price, start_price, 0)
        else null
      end,
      paid_at = case when p_status = 'paid' then now() else null end
  where id = p_listing_id;

  if not found then
    raise exception 'Subasta no encontrada';
  end if;
end;
$$;

revoke all on function public.admin_set_auction_payment(uuid, text, numeric) from public, anon;
grant execute on function public.admin_set_auction_payment(uuid, text, numeric) to authenticated;

create or replace function public.reset_listing_payment_on_new_round()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.auction_round is distinct from old.auction_round then
    new.payment_status := 'pending';
    new.paid_amount := null;
    new.paid_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_reset_payment_on_new_round on public.listings;
create trigger listings_reset_payment_on_new_round
before update of auction_round on public.listings
for each row execute function public.reset_listing_payment_on_new_round();

commit;
