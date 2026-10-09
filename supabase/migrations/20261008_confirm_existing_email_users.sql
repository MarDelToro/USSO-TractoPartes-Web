-- Ejecutar una sola vez después de desactivar "Confirm email" en Supabase.
-- Permite entrar a las cuentas creadas antes del cambio que quedaron sin confirmar.
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email_confirmed_at is null
  and email is not null;
