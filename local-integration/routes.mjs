// Shared routing integration: in memory for local previews, packaged for production.
export function integrateHtml(name,html,{production=false}={}){
 if(name==='usso-tractopartes.dc.html'){
  const changes=[
   ["this.setState({accountOpen:true,notifOpen:false,mobileMenuOpen:false,navHidden:false});",'window.location.assign("/miembros/");'],
   ["accountDestination: u ? '#cuenta' : 'login.html',","accountDestination: u ? '/miembros/' : 'login.html',"],
   ['toggleAccount = () => this.setState((s) => ({ accountOpen: !s.accountOpen, notifOpen: false }));','toggleAccount = () => window.location.assign("/miembros/");'],
   ['openAccountFromMenu = () => this.setState({ mobileMenuOpen: false, accountOpen: true });','openAccountFromMenu = () => window.location.assign("/miembros/");'],
   ["openLogin = () => this.setState({ authOpen: true, authMode: 'login', authError: '' });",'openLogin = () => window.location.assign("/login.html?next=%2Fmiembros%2F");'],
   ["openRegistro = () => this.setState({ authOpen: true, authMode: 'registro', authError: '', accountOpen: false });",'openRegistro = () => window.location.assign("/registro.html?next=%2Fmiembros%2F");'],
   ["openLoginFromMenu = () => this.setState({ mobileMenuOpen: false, authOpen: true, authMode: 'login', authError: '' });",'openLoginFromMenu = () => window.location.assign("/login.html?next=%2Fmiembros%2F");'],
   ["openRegistroFromMenu = () => this.setState({ mobileMenuOpen: false, authOpen: true, authMode: 'registro', authError: '' });",'openRegistroFromMenu = () => window.location.assign("/registro.html?next=%2Fmiembros%2F");']
  ];
  for(const [from,to] of changes){if(!html.includes(from)&&html.includes(to))continue;if(!html.includes(from))throw new Error(`Public integration anchor missing: ${from.split('=')[0]}`);html=html.replace(from,to)}
  // Public presentation is independent of an existing account session. Keep
  // auth intact so Entrar can return the visitor to the native member area.
  const publicPresentation=[
   ['isLogged: !!u,','isLogged: false,'],
   ['isGuest: !u,','isGuest: true,'],
   ["isAdmin: !!u && u.role === 'admin',",'isAdmin: false,'],
   ["showWelcomeNotice: !!u && !!st.welcomeOpen && st.phase === 'content' && !st.authOpen && !st.accountOpen && !st.bidOpen && !st.mobileMenuOpen,",'showWelcomeNotice: false,'],
   ['notifOpen: st.notifOpen,','notifOpen: false,'],
   ['accountOpen: st.accountOpen,','accountOpen: false,'],
   ['winnerCelebrationOpen: !!st.winnerCelebration,','winnerCelebrationOpen: false,'],
   ['lossCelebrationOpen: !!st.lossCelebration,','lossCelebrationOpen: false,'],
  ];
  for(const [from,to] of publicPresentation){if(html.includes(from))html=html.replace(from,to);else if(!html.includes(to))throw new Error(`Public presentation anchor missing: ${from.split(':')[0]}`)}
  html=html.replaceAll('>Crear cuenta para pujar<','>Crear cuenta<');
  html=html.replace('onClick="{{ openDockAccount }}" aria-label="Mi cuenta"','onClick="{{ openDockAccount }}" aria-label="Entrar"');
  html=html.replace('<span>Cuenta</span></a>','<span>Entrar</span></a>');
  if(!html.includes('id="usso-public-entry-style"'))html=html.replace('</head>',`<style id="usso-public-entry-style">
   @media(max-width:860px){
    .usso-main-nav .usso-nav-guest-primary{display:inline-flex!important}
    .usso-main-nav .usso-nav-cta a{font-size:11px!important;padding:9px 10px!important}
    .usso-main-nav .usso-nav-cta{gap:6px!important}
   }
  </style></head>`);
  html=html.replaceAll('this.syncAuthFromSupabase();\n    return;','window.location.assign("/miembros/");\n    return;');
  html=html.replace('<script src="puente-home.js"></script>','');
  if(!html.includes('src="/member-entry.js')){
   const gate = `<style>html.usso-member-routing body{visibility:hidden!important}</style><script>if(new URLSearchParams(location.search).get('vista')!=='publica'){document.documentElement.classList.add('usso-member-routing');window.ussoEntryFallback=setTimeout(()=>document.documentElement.classList.remove('usso-member-routing'),6000)}</script>`;
   html=html.replace('<head>','<head>'+gate);
   html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="/member-entry.js?v=20261102"></script>');
   html=html.replaceAll('const client = window.supabase.createClient(', 'const client = window.ussoEntryClient || window.supabase.createClient(');
   html=html.replace('this.auctionRealtimeClient = window.supabase.createClient(', 'this.auctionRealtimeClient = window.ussoEntryClient || window.supabase.createClient(');
  }

 }
 if(name==='login.html'||name==='registro.html'){
  html=html.replace('requestedNext && !requestedNext.startsWith("//") && !requestedNext.includes("://") ? requestedNext : ""','requestedNext && /^(\\/(?!\\/)|[a-zA-Z0-9_-]+\\.html(?:[?#]|$))/.test(requestedNext) && !requestedNext.includes("\\\\") ? requestedNext : ""');
  html=html.replace('profile?.role === "admin" ? "admin.html" : (safeNext || "usso-tractopartes.dc.html")','safeNext || "/miembros/"');
  html=html.replace('safeNext || "usso-tractopartes.dc.html"','safeNext || "/miembros/"');
  html=html.replace('href="/#subastas"','href="/usso-tractopartes.dc.html#subastas"');
  if(!html.includes('.local-connection-note{'))html=html.replace('</head>','<style>body.auth-page{background:radial-gradient(ellipse at 100% 0%,#61411540,transparent 40%),#0c0e10}.auth-card{border-radius:24px!important;box-shadow:0 10px 55px #0006!important}.auth-submit{box-shadow:0 3px 20px #e7b63733}.local-connection-note{font:500 11px/1.5 Manrope,sans-serif;color:#aab3bf;text-align:center;margin:15px 0 0}</style></head>');
  html=html.replace('<p class="msg" id="msg"></p>','<p class="msg" id="msg" role="status"></p>'+(production?'':'<p class="local-connection-note">Vista local · conectada a tu cuenta real de USSO.</p>'));
  if(name==='login.html'&&!html.includes('src="/member-entry.js')){
   html=html.replace('const params = new URLSearchParams', 'window.ussoEntryClient = client;\n    const params = new URLSearchParams');
   html=html.replace(/(const safeNext =[^\n]+;)/, '$1\n    window.ussoEntryDestination = safeNext || "/miembros/";');
   html=html.replace('</body>','<script src="/member-entry.js?v=20261102"></script></body>');
  }
  if(production)html=html.replace('<p class="local-connection-note">Vista local · conectada a tu cuenta real de USSO.</p>','');
 }
 return html;
}
