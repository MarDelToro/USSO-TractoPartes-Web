/* Recovery is public: an emailed link must work in a fresh browser, without the landing gate. */
(async function () {
  const $ = id => document.getElementById(id);
  const hash = new URLSearchParams(location.hash.slice(1));
  const hasCallback = location.hash.length > 1 || location.search.includes('code=');
  // Remove credentials from the address bar before any subsequent navigation.
  if (hasCallback) history.replaceState(null, '', location.pathname);
  if (!window.supabase) { $('message').textContent = 'No pudimos conectar. Revisa tu conexión y recarga la página.'; $('request').hidden = true; return; }
  // Keep recovery separate from any existing signed-in account on this browser.
  const client = window.supabase.createClient('https://ahhlfvjicxylidpmeciw.supabase.co', 'sb_publishable_9Rr6Nv0ByITBW4TLhdC_HQ_WWpv4q5e', {
    auth: { persistSession: false, detectSessionInUrl: false, flowType: 'implicit' }
  });
  let ready = false;
  if (hasCallback) {
    $('request').hidden = true;
    $('message').textContent = 'Verificando tu enlace…';
    try {
      if (hash.get('type') !== 'recovery' || !hash.get('access_token') || !hash.get('refresh_token')) throw new Error('invalid');
      const { error } = await client.auth.setSession({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token') });
      if (error) throw error;
      const { data, error: userError } = await client.auth.getUser();
      if (userError || !data.user) throw new Error('invalid');
      ready = true;
      $('reset').hidden = false;
      $('heading').textContent = 'Tu nueva contraseña';
      $('intro').textContent = 'Elige una contraseña que no uses en otros sitios.';
      $('message').textContent = '';
      $('password').focus();
    } catch (_) {
      $('request').hidden = false;
      $('message').textContent = 'El enlace no es válido o ya venció. Solicita uno nuevo con tu correo.';
    }
  }
  $('request').addEventListener('submit', async e => {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button');
    if (button.disabled) return;
    button.disabled = true;
    $('message').textContent = 'Enviando…';
    try {
      const { error } = await client.auth.resetPasswordForEmail($('email').value.trim(), {
        redirectTo: 'https://ussotractopartes.com/recuperar.html'
      });
      if (error) throw error;
      $('message').textContent = 'Si ese correo tiene una cuenta, recibirás un enlace. Revisa también la carpeta de spam. Puedes solicitar otro en un minuto.';
      setTimeout(() => { button.disabled = false; }, 60000);
    } catch (_) {
      $('message').textContent = 'No pudimos enviar el enlace. Espera un minuto e inténtalo otra vez.';
      button.disabled = false;
    }
  });
  $('reset').addEventListener('submit', async e => {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button');
    if (!ready || button.disabled) return;
    if ($('password').value !== $('confirm').value) { $('message').textContent = 'Las contraseñas no coinciden.'; $('confirm').focus(); return; }
    button.disabled = true;
    $('message').textContent = 'Guardando…';
    try {
      const { error } = await client.auth.updateUser({ password: $('password').value });
      if (error) throw error;
      ready = false;
      $('reset').reset();
      $('reset').hidden = true;
      $('heading').textContent = 'Contraseña actualizada';
      $('intro').textContent = 'Ya puedes iniciar sesión con tu nueva contraseña.';
      $('message').textContent = '';
      // The temporary recovery session is discarded; no account credentials are saved locally.
      await client.auth.signOut({ scope: 'local' });
    } catch (_) {
      $('message').textContent = 'No se pudo guardar. Usa una contraseña distinta de la anterior, de al menos 8 caracteres. Si tu enlace venció, solicita uno nuevo.';
      button.disabled = false;
    }
  });
})();
