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
  html=html.replaceAll('this.syncAuthFromSupabase();\n    return;','window.location.assign("/miembros/");\n    return;');
  html=html.replace('<script src="puente-home.js"></script>','');
 }
 if(name==='login.html'||name==='registro.html'){
  html=html.replace('requestedNext && !requestedNext.startsWith("//") && !requestedNext.includes("://") ? requestedNext : ""','requestedNext && /^(\\/(?!\\/)|[a-zA-Z0-9_-]+\\.html(?:[?#]|$))/.test(requestedNext) && !requestedNext.includes("\\\\") ? requestedNext : ""');
  html=html.replace('profile?.role === "admin" ? "admin.html" : (safeNext || "usso-tractopartes.dc.html")','safeNext || "/miembros/"');
  html=html.replace('safeNext || "usso-tractopartes.dc.html"','safeNext || "/miembros/"');
  html=html.replace('href="/#subastas"','href="/usso-tractopartes.dc.html#subastas"');
  if(!html.includes('.local-connection-note{'))html=html.replace('</head>','<style>body.auth-page{background:radial-gradient(ellipse at 100% 0%,#61411540,transparent 40%),#0c0e10}.auth-card{border-radius:24px!important;box-shadow:0 10px 55px #0006!important}.auth-submit{box-shadow:0 3px 20px #e7b63733}.local-connection-note{font:500 11px/1.5 Manrope,sans-serif;color:#aab3bf;text-align:center;margin:15px 0 0}</style></head>');
  html=html.replace('<p class="msg" id="msg"></p>','<p class="msg" id="msg" role="status"></p>'+(production?'':'<p class="local-connection-note">Vista local · conectada a tu cuenta real de USSO.</p>'));
  if(production)html=html.replace('<p class="local-connection-note">Vista local · conectada a tu cuenta real de USSO.</p>','');
 }
 return html;
}
