import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {integrateHtml} from '../../local-integration/routes.mjs';
const source=readFileSync(new URL('../../member-entry.js',import.meta.url),'utf8');
const session={user:{id:'test-member'}};
async function run({saved=session,search='',pathname='/usso-tractopartes.dc.html',error=null,reject=false,sdk=true,next}={}){
 const redirects=[],events={};let handler,visible=false,reads=0;
 const client={auth:{
  getSession:async()=>{reads++;if(reject)throw Error('offline');return {data:{session:saved},error}},
  onAuthStateChange:fn=>{handler=fn;return {data:{subscription:{unsubscribe(){}}}}}
 }};
 const window={ussoEntryDestination:next,supabase:sdk?{createClient:()=>client}:null,addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(source,{window,location:{search,pathname,replace:to=>redirects.push(to)},document:{documentElement:{classList:{remove:()=>visible=true}}},URLSearchParams,clearTimeout(){}});
 await new Promise(resolve=>setImmediate(resolve));
 return {redirects,events,get handler(){return handler},get reads(){return reads},get visible(){return visible}};
}
test('restored sessions enter members once without fetching listings or profiles',async()=>{
 const r=await run();assert.deepEqual(r.redirects,['/miembros/']);r.handler('INITIAL_SESSION',session);r.handler('SIGNED_IN',session);assert.equal(r.redirects.length,1);
});
test('anonymous and offline visitors can still see the public page',async()=>{
 for(const input of [{saved:null},{error:Error('expired')},{reject:true},{sdk:false}]){const r=await run(input);assert.equal(r.visible,true);assert.deepEqual(r.redirects,[])}
});
test('explicit public visit survives auth events and does not persist a routing preference',async()=>{
 const r=await run({search:'?vista=publica'});assert.equal(r.reads,0);assert.equal(r.visible,true);assert.deepEqual(r.redirects,[]);
 const nextVisit=await run();assert.deepEqual(nextVisit.redirects,['/miembros/']);
});
test('sign-in from another tab routes an anonymous landing page to members',async()=>{
 const r=await run({saved:null});r.handler('SIGNED_IN',session);assert.deepEqual(r.redirects,['/miembros/']);
});
test('back-forward cache restore rechecks the session',async()=>{
 const r=await run({saved:null});r.events.pageshow({persisted:true});await new Promise(resolve=>setImmediate(resolve));assert.equal(r.reads,2);
});
test('already signed-in login honors the validated deep-link destination',async()=>{
 for(const pathname of ['/login','/login.html']){const r=await run({pathname,next:'/miembros/#lote/123',search:'?vista=publica'});assert.deepEqual(r.redirects,['/miembros/#lote/123'])}
});
test('release and preview routing install scripts once and preserve an explicit public exit',()=>{
 for(const name of ['usso-tractopartes.dc.html','login.html']){
  const html=readFileSync(new URL('../../'+name,import.meta.url),'utf8');
  const once=integrateHtml(name,html,{production:true}),twice=integrateHtml(name,once,{production:true});
  assert.equal(once,twice);assert.equal((once.match(/src="\/member-entry.js/g)||[]).length,1);
  if(name==='login.html')assert.match(once,/window.ussoEntryDestination = safeNext/);
 }
 assert.match(readFileSync(new URL('../src/Prototype.tsx',import.meta.url),'utf8'),/href="\/usso-tractopartes.dc.html\?vista=publica">Visitar/);
});
test('public chrome stays generic for guests, members and admins, including open legacy overlays',()=>{
 const html=integrateHtml('usso-tractopartes.dc.html',readFileSync(new URL('../../usso-tractopartes.dc.html',import.meta.url),'utf8'));
 for(const u of [null,{role:'user'},{role:'admin'}]){
  const st={user:u,welcomeOpen:true,phase:'content',notifOpen:true,accountOpen:true,winnerCelebration:{},lossCelebration:{}};
  for(const [key,expected] of Object.entries({isLogged:false,isGuest:true,isAdmin:false,showWelcomeNotice:false,notifOpen:false,accountOpen:false,winnerCelebrationOpen:false,lossCelebrationOpen:false})){
   const expression=[...html.matchAll(new RegExp('^      '+key+': (.+),$','gm'))].at(-1)?.[1];
   assert.ok(expression,key);assert.equal(vm.runInNewContext(expression,{u,st}),expected,`${key} for ${u?.role||'guest'}`);
  }
 }
 assert.ok(html.includes('class="usso-nav-burger"'));
 assert.ok(html.includes('onClick="{{ toggleMobileMenu }}"'));
 assert.match(html,/href="registro.html" class="usso-nav-guest-primary"[^>]+>Crear cuenta<\/a>/);
 assert.match(html,/onClick="{{ openDockAccount }}" aria-label="Entrar"/);
});
