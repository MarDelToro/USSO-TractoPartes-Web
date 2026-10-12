begin;

-- La tabla de notificaciones también conserva el historial interno de la app.
-- Para no alarmar al administrador, el centro de operaciones cuenta solo
-- ganadores que realmente esperan un contacto manual, no todo el historial.
create or replace function public.admin_operations_health()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_scheduler_available boolean := false;
  v_scheduler_configured boolean := false;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede consultar el estado del sistema';
  end if;

  select exists(select 1 from pg_extension where extname = 'pg_cron')
    into v_scheduler_available;

  if v_scheduler_available then
    begin
      execute 'select exists (select 1 from cron.job where jobname = $1)'
        into v_scheduler_configured
        using 'usso-auction-operations';
    exception when others then
      v_scheduler_configured := false;
    end;
  end if;

  select jsonb_build_object(
    'checked_at', now(),
    'expired_active_listings', (select count(*) from public.listings where status = 'active' and ends_at <= now()),
    'pending_notifications', (
      select count(*) from public.notifications
      where notification_type = 'auction_won'
        and coalesce(status, 'pending') <> 'sent'
    ),
    'stale_notifications', (
      select count(*) from public.notifications
      where notification_type = 'auction_won'
        and coalesce(status, 'pending') <> 'sent'
        and created_at < now() - interval '15 minutes'
    ),
    'failed_notifications', (
      select count(*) from public.notifications
      where notification_type = 'auction_won'
        and delivery_error is not null
    ),
    'incomplete_closed_listings', (
      select count(*)
      from public.listings l
      where l.status = 'closed'
        and exists (
          select 1 from public.bids b
          where b.listing_id = l.id and b.auction_round = l.auction_round
        )
        and l.winner_id is distinct from (
          select b.user_id from public.bids b
          where b.listing_id = l.id and b.auction_round = l.auction_round
          order by b.amount desc, b.created_at desc limit 1
        )
    ),
    'missing_close_events', (
      select count(*) from public.listings l
      where l.status = 'closed'
        and not exists (
          select 1 from public.auction_events e
          where e.listing_id = l.id and e.auction_round = l.auction_round
            and e.event_type = 'auction_closed'
        )
    ),
    'close_events', (select count(*) from public.auction_events where event_type = 'auction_closed'),
    'scheduler_available', v_scheduler_available,
    'scheduler_configured', v_scheduler_configured
  ) into v_result;

  return v_result;
end;
$$;

commit;
