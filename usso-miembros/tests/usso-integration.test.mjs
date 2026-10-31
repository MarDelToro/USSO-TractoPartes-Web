import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {mapListing,safeMedia,normalizeGallery,createUssoService,SessionRequired} from '../src/usso-service.ts';
import {integrateHtml} from '../../local-integration/routes.mjs';
const now=Date.now();
const row={id:'lot',lot_number:3017,title:'Motor',status:'active',current_price:90000,start_price:85000,auction_round:2,bid_count:3,starts_at:new Date(now-3600000).toISOString(),ends_at:new Date(now+3600000).toISOString(),image_url:'https://ussotractopartes.com/motor.jpg'};
const own=[{listing_id:'lot',amount:100000,auction_round:1},{listing_id:'lot',amount:88000,auction_round:2}];
test('rounds, prices, outcomes and auction dates reflect the real listing',()=>{
 const l=mapListing(row,own,new Set(['lot']),'u',now);
 assert.equal(l.myBid,88000);assert.equal(l.leading,false);assert.equal(l.status,'active');assert.equal(l.revision,2000003);assert.equal(l.saved,true);
 assert.equal(mapListing({...row,status:'closed',winner_id:'u'},own,new Set(),'u',now).outcome,'won');
 assert.equal(mapListing({...row,status:'closed'},own,new Set(),'u',now).outcome,'pending');
 assert.equal(mapListing({...row,starts_at:new Date(now+1000).toISOString()},own,new Set(),'u',now).status,'upcoming');
 assert.equal(mapListing({...row,ends_at:null},own,new Set(),'u',now).status,'closed');
});
test('unsafe media is excluded and unsupported active watch creation is disabled',()=>{
 assert.equal(safeMedia('javascript:alert(1)'),'');
 const l=mapListing({...row,media_urls:['javascript:alert(1)','/video.mp4'],product_details:['__USSO_INTERNAL','Detail']},[],new Set(),'u',now);
 assert.equal(l.media.length,2);assert.equal(l.media[0].url,row.image_url);assert.equal(l.media[1].type,'video');assert.deepEqual(l.details,['Detail']);assert.equal(l.canSave,false);
});
function fakeClient({authorized=true,listing=row,bids=own,user={id:'u',email:'test@example.test'}}={}){
 const calls=[];const fixtures={profiles:{full_name:'Test',authorized,member_number:1},listings:[listing],bids,auction_watchers:[],notifications:[]};
 return {calls,auth:{getUser:async()=>({data:{user}})},from(table){const q={then:resolve=>Promise.resolve({data:fixtures[table]}).then(resolve)};for(const key of ['select','eq','is','single','order','limit'])q[key]=()=>q;return q},rpc:async(name,args)=>{calls.push({name,args});return {data:null}}};
}
test('signed-out users cannot query private tables',async()=>{const s=createUssoService(fakeClient({user:null}));await assert.rejects(s.load(),SessionRequired)});
test('real adapter rejects invalid actions before reaching bid RPC',async()=>{
 for(const config of [{authorized:false},{listing:{...row,status:'closed'}},{bids:[{listing_id:'lot',auction_round:2,amount:90000}]}]){
  const c=fakeClient(config),s=createUssoService(c);await assert.rejects(s.placeBid({lotId:'lot',amount:91000,expectedRevision:2000003,idempotencyKey:'x'}));assert.equal(c.calls.length,0);
 }
 const c=fakeClient(),s=createUssoService(c);await assert.rejects(s.placeBid({lotId:'lot',amount:91000,expectedRevision:0,idempotencyKey:'stale'}));assert.equal(c.calls.length,0);
});
test('confirmed valid offers reach only the existing RPC and duplicate callbacks are deduplicated in memory',async()=>{
 const c=fakeClient(),s=createUssoService(c),req={lotId:'lot',amount:91000,expectedRevision:2000003,idempotencyKey:'once'};
 const [a,b]=await Promise.all([s.placeBid(req),s.placeBid(req)]);assert.deepEqual(a,b);assert.equal(c.calls.length,1);assert.deepEqual(c.calls[0],{name:'place_bid',args:{p_listing_id:'lot',p_amount:91000}});await s.placeBid(req);assert.equal(c.calls.length,1);
});
test('login and registration keep redirects local and return to the member area',()=>{
 for(const name of ['login.html','registro.html']){
  const source=readFileSync(new URL('../../'+name,import.meta.url),'utf8'),result=integrateHtml(name,source);
  assert.match(result,/safeNext \|\| "\/miembros\/"/);
  for(const m of result.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){if(m[1].trim())new vm.Script(m[1])}
  const declaration=result.match(/const safeNext\s*=\s*([^;]+);/);assert.ok(declaration);
  for(const value of ['//evil.example','https://evil.example','javascript:alert(1)','/\\evil.example'])assert.equal(vm.runInNewContext(declaration[1],{requestedNext:value}),'');
  assert.equal(vm.runInNewContext(declaration[1],{requestedNext:'/miembros/#calendario'}),'/miembros/#calendario');
 }
});
test('all public account entries including the mobile dock lead to the member area',()=>{
 const source=readFileSync(new URL('../../usso-tractopartes.dc.html',import.meta.url),'utf8'),result=integrateHtml('usso-tractopartes.dc.html',source);
 assert.match(result,/toggleAccount = \(\) => window.location.assign\("\/miembros\/"\)/);
 assert.match(result,/openDockAccount = \(e\) => \{\s*if \(!this.state.user\) return;\s*e.preventDefault\(\);\s*window.location.assign\("\/miembros\/"\)/);
 assert.match(result,/accountDestination: u \? '\/miembros\/'/);
 assert.equal(readFileSync(new URL('../../usso-tractopartes.dc.html',import.meta.url),'utf8'),source);
});

test('gallery preserves closed-auction evidence, deduplicates covers and handles missing files honestly',()=>{
 const photos=[{url:'/one.jpg',type:'image'},'/two.jpg',{url:'/clip.mp4'}];
 assert.equal(normalizeGallery('/one.jpg',photos).length,3);
 assert.equal(normalizeGallery('/cover.jpg',photos).length,4);
 assert.equal(normalizeGallery('',[]).length,0);
 assert.equal(safeMedia(' '),'');
 for(const winner of ['u','other']){const l=mapListing({...row,status:'closed',winner_id:winner,media_urls:photos},own,new Set(),'u',now);assert.equal(l.media.length,4);assert.equal(l.media.at(-1).type,'video')}
});

test('room reads the selected listing price, current-round own bid and authorization without writes',async()=>{
 let current={...row};const filters=[];let rpcCalls=0;
 const client={auth:{getUser:async()=>({data:{user:{id:'u'}}})},rpc:async()=>{rpcCalls++},from(table){
  let single=false;const q={then(resolve){const data=table==='listings'?(single?current:[current]):table==='bids'?own:{full_name:'Test',authorized:true,member_number:9};return Promise.resolve({data}).then(resolve)}};
  q.select=()=>q;q.eq=(name,value)=>{filters.push([table,name,value]);return q};q.single=()=>{single=true;return q};return q;
 }};
 const service=createUssoService(client);
 const before=await service.loadRoom('lot');assert.equal(before.lot.price,90000);assert.equal(before.lot.myBid,88000);assert.equal(before.lot.leading,false);
 current={...current,current_price:97000,bid_count:4};
 const after=await service.loadRoom('lot');assert.equal(after.lot.price,97000);assert.equal(after.lot.revision,2000004);
 assert.ok(filters.some(([table,col,value])=>table==='listings'&&col==='id'&&value==='lot'));
 assert.ok(filters.some(([table,col,value])=>table==='bids'&&col==='user_id'&&value==='u'));
 assert.equal(rpcCalls,0);
 current={...current,status:'draft'};await assert.rejects(service.loadRoom('lot'),/no está disponible/);
});
test('room subscriptions listen to both bid and price events for exactly one lot and clean up',()=>{
 const bindings=[];let removed=false,notifications=0;
 const channel={on(kind,filter,callback){bindings.push({kind,filter,callback});return this},subscribe(){return this}};
 const client={channel:()=>channel,removeChannel(c){assert.equal(c,channel);removed=true}};
 const stop=createUssoService(client).subscribeRoom('lot',()=>notifications++);
 assert.deepEqual(bindings.map(b=>[b.filter.table,b.filter.filter]),[['listings','id=eq.lot'],['bids','listing_id=eq.lot']]);
 bindings.forEach(b=>b.callback());assert.equal(notifications,2);stop();assert.equal(removed,true);
});
