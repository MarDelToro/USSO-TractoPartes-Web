import {BidError,validateBid,type Lot,type Member,type MemberService,type Snapshot,type BidRequest,type BidReceipt} from './member-service.ts';
// Public browser configuration already used by the existing USSO website.
export const USSO_URL='https://ahhlfvjicxylidpmeciw.supabase.co';
export const USSO_PUBLIC_KEY='sb_publishable_9Rr6Nv0ByITBW4TLhdC_HQ_WWpv4q5e';
export class SessionRequired extends Error{}
export function safeMedia(value:unknown){if(typeof value!=='string'||!value.trim())return '';try{const url=new URL(value,'https://ussotractopartes.com/');return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return ''}}
export function normalizeGallery(cover:unknown,raw:unknown){
 const entries=(Array.isArray(raw)?raw:[]).map((m:any)=>({url:safeMedia(typeof m==='string'?m:m?.url),type:typeof m==='object'&&m?.type==='video'||/\.(mp4|webm|mov)([?#]|$)/i.test(typeof m==='string'?m:m?.url||'')?'video':'image'})).filter(m=>m.url);
 const image=safeMedia(cover);if(image&&!entries.some(m=>m.url===image))entries.unshift({url:image,type:'image'});
 return entries.filter((m,i)=>entries.findIndex(other=>other.url===m.url)===i);
}
export function mapListing(row:any,ownBids:any[],saved:Set<string>,userId:string,now:number):Lot{
 const start=Date.parse(row.starts_at),end=Date.parse(row.ends_at),round=Number(row.auction_round||1);
 const amounts=ownBids.filter(b=>b.listing_id===row.id&&Number(b.auction_round||1)===round).map(b=>Number(b.amount));
 const myBid=amounts.length?Math.max(...amounts):undefined,price=Number(row.current_price??row.start_price??0);
 const status=row.status==='active'&&start>now?'upcoming':row.status==='active'&&(!Number.isFinite(start)||start<=now)&&end>now?'active':'closed';
 const media=normalizeGallery(row.image_url,row.media_urls);
 const image=safeMedia(row.image_url)||media.find((m:any)=>m.type==='image')?.url||'/assets/usso/logo-usso-v2-transparent.webp';
 const details=(Array.isArray(row.product_details)?row.product_details:[]).filter((x:any)=>typeof x==='string'&&!x.startsWith('__USSO_'));
 return {id:row.id,number:String(row.lot_number||'Por asignar'),title:row.title||'Lote USSO',image,status,price,myBid,increment:1000,revision:round*1000000+Number(row.bid_count||0),startsAt:row.starts_at||'',endsAt:row.ends_at||'',saved:saved.has(row.id),condition:row.description||'Revisa las fotografías, los videos y la información publicada antes de ofertar.',leading:myBid!==undefined&&myBid>=price,resultConfirmed:['closed','sold'].includes(row.status),outcome:row.winner_id?row.winner_id===userId?'won':'lost':'pending',media,details,buyNowPrice:Number(row.buy_now_price)||undefined,canSave:status==='upcoming'||saved.has(row.id)};
}
export function createUssoService(client:any):MemberService{
 let userId='',last:Snapshot|null=null;
 const receipts=new Map<string,BidReceipt>(),inflight=new Map<string,Promise<BidReceipt>>();
 async function user(){const r=await client.auth.getUser();if(r.error||!r.data.user)throw new SessionRequired('Inicia sesión para entrar a tu espacio.');userId=r.data.user.id;return r.data.user}
 function check(result:any){if(result.error)throw new Error(result.error.message);return result.data}
 function profile(row:any,u:any):Member{return {id:u.id,name:row.full_name||u.user_metadata?.full_name||u.user_metadata?.name||u.user_metadata?.username||(row.role==='admin'?'Admin USSO':'Miembro'),number:row.member_number?`USSO-${String(row.member_number).padStart(6,'0')}`:'Número pendiente',authorized:!!row.authorized,email:u.email||'',city:row.city||'',role:row.role}}
 async function load():Promise<Snapshot>{const u=await user();const results=await Promise.all([
 client.from('profiles').select('full_name,city,authorized,member_number,role').eq('id',u.id).single(),
 client.from('listings').select('id,lot_number,title,description,image_url,media_urls,product_details,current_price,start_price,buy_now_price,status,starts_at,ends_at,bid_count,auction_round,winner_id').order('created_at',{ascending:false}),
 client.from('bids').select('listing_id,amount,auction_round').eq('user_id',u.id),
 client.from('auction_watchers').select('listing_id').eq('user_id',u.id),
 client.from('notifications').select('id,title,message,listing_id,created_at').eq('user_id',u.id).is('dismissed_at',null).order('created_at',{ascending:false}).limit(40)
 ]);
 const member=profile(check(results[0]),u),rows=check(results[1])||[],bids=check(results[2])||[],watch=check(results[3])||[],now=Date.now();
 const warnings=results[4].error?['No pudimos cargar tus avisos. Puedes volver a intentarlo entrando de nuevo a esta sección.']:[];
 last={member,lots:rows.filter((r:any)=>['active','closed','sold'].includes(r.status)).map((r:any)=>mapListing(r,bids,new Set(watch.map((w:any)=>w.listing_id)),u.id,now)),asOf:new Date(now).toISOString(),demo:false,warnings,notices:(results[4].data||[]).map((n:any)=>({id:String(n.id),title:n.title||'Aviso de USSO',body:n.message||'',lotId:n.listing_id})),campaigns:[{id:'usso-cover',title:'CONOCE USSO.',eyebrow:'EL RESPALDO DETRÁS DE CADA LOTE.',body:'Nuestra trayectoria, financiamiento y más sobre nosotros.',image:'/assets/usso/portada.png',label:'Conocer USSO',sponsored:false,destination:'nosotros'}]};return last;
 }
 return {load,
 async loadRoom(lotId){
 const u=await user();
 const [listing,own,memberResult]=await Promise.all([
 client.from('listings').select('id,lot_number,title,description,image_url,media_urls,product_details,current_price,start_price,buy_now_price,status,starts_at,ends_at,bid_count,auction_round,winner_id').eq('id',lotId).single(),
 client.from('bids').select('listing_id,amount,auction_round').eq('listing_id',lotId).eq('user_id',u.id),
 client.from('profiles').select('full_name,city,authorized,member_number,role').eq('id',u.id).single()
 ]);
 const row=check(listing);if(!row||!['active','closed','sold'].includes(row.status))throw new BidError('Este lote no está disponible.','NOT_FOUND');
 const now=Date.now();return {lot:mapListing(row,check(own)||[],new Set(),u.id,now),member:profile(check(memberResult),u),asOf:new Date(now).toISOString()};
 },
 subscribeRoom(lotId,listener){
 const channel=client.channel('auction-room-'+crypto.randomUUID()).on('postgres_changes',{event:'*',schema:'public',table:'listings',filter:`id=eq.${lotId}`},listener).on('postgres_changes',{event:'INSERT',schema:'public',table:'bids',filter:`listing_id=eq.${lotId}`},listener).subscribe();
 return()=>{client.removeChannel(channel)};
 },
 async setSaved(lotId,saved){await user();check(await client.rpc('toggle_auction_watch',{p_listing_id:lotId,p_enabled:saved}))},
 async updateProfile(p){const u=await user();if(!p.name.trim())throw new Error('Escribe tu nombre.');const r=await client.from('profiles').update({full_name:p.name.trim(),city:p.city.trim()}).eq('id',u.id).select('full_name,city,authorized,member_number,role').single();return profile(check(r),u)},
 async signOut(){check(await client.auth.signOut({scope:'local'}));localStorage.removeItem('usso_cuenta_v1');last=null},
 async requestAuthorization(){await user();check(await client.rpc('request_bid_authorization'))},
 async placeBid(req:BidRequest){const previous=receipts.get(req.idempotencyKey);if(previous){if(previous.lotId!==req.lotId||previous.amount!==req.amount)throw new Error('Esta solicitud ya fue utilizada.');return previous}if(inflight.has(req.idempotencyKey))return inflight.get(req.idempotencyKey)!;
 const operation=(async()=>{const current=await load(),lot=current.lots.find(l=>l.id===req.lotId);if(!lot)throw new BidError('No encontramos este lote.','NOT_FOUND');validateBid(lot,current.member,req.amount,req.expectedRevision,Date.now());if(lot.leading)throw new Error('Tu oferta ya es la más alta. Espera a que otra persona la supere.');
 const result=await client.rpc('place_bid',{p_listing_id:req.lotId,p_amount:req.amount});if(result.error){const message=result.error.message||'No se pudo confirmar. Revisa Mis pujas antes de volver a intentarlo.';if(/mínim|minim|precio|más alta|mas alta/i.test(message))throw new BidError(message,'STALE_PRICE');throw new Error(message)}
 const receipt={id:req.idempotencyKey,lotId:req.lotId,amount:req.amount,createdAt:new Date().toISOString()};receipts.set(req.idempotencyKey,receipt);return receipt})();inflight.set(req.idempotencyKey,operation);try{return await operation}finally{inflight.delete(req.idempotencyKey)}
 },
 subscribe(listener){let timer:ReturnType<typeof setTimeout>;const notify=()=>{clearTimeout(timer);timer=setTimeout(listener,250)};const channel=client.channel('member-experience-'+crypto.randomUUID()).on('postgres_changes',{event:'*',schema:'public',table:'listings'},notify).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},notify).on('postgres_changes',{event:'*',schema:'public',table:'auction_watchers',filter:`user_id=eq.${userId}`},notify).subscribe();const visibility=()=>{if(!document.hidden)notify()};const interval=setInterval(visibility,30000);document.addEventListener('visibilitychange',visibility);return()=>{clearTimeout(timer);clearInterval(interval);document.removeEventListener('visibilitychange',visibility);client.removeChannel(channel)}}
 };
}
