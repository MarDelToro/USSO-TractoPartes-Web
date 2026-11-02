/* Navigation only. The member app and backend still validate the account. */
(function () {
  const isLogin = /\/login(?:\.html)?$/.test(location.pathname);
  const explicitPublic = !isLogin && new URLSearchParams(location.search).get('vista') === 'publica';
  const reveal = () => {
    document.documentElement.classList.remove('usso-member-routing');
    clearTimeout(window.ussoEntryFallback);
  };
  if (explicitPublic || !window.supabase?.createClient) { reveal(); return; }
  const client = window.ussoEntryClient || window.supabase.createClient(
    'https://ahhlfvjicxylidpmeciw.supabase.co',
    'sb_publishable_9Rr6Nv0ByITBW4TLhdC_HQ_WWpv4q5e'
  );
  window.ussoEntryClient = client;
  let navigating = false;
  function route(session) {
    if (session?.user && !navigating) {
      navigating = true;
      location.replace(isLogin ? (window.ussoEntryDestination || '/miembros/') : '/miembros/');
    } else if (!navigating) reveal();
  }
  const check = () => client.auth.getSession().then(({data,error}) => {
    if (error) reveal(); else route(data?.session);
  }).catch(reveal);
  client.auth.onAuthStateChange((event, session) => {
    if (['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED'].includes(event)) route(session);
    else if (event === 'SIGNED_OUT') reveal();
  });
  window.addEventListener('pageshow', event => { if(event.persisted) check(); });
  check();
})();
