/** Integration boundary. Implement MemberService with the existing authenticated
 * USSO backend. Never trust client-side eligibility, price or authorization. */
export type LotStatus = 'active'|'upcoming'|'closed';
export type Lot = {id:string;number:string;title:string;image:string;status:LotStatus;price:number;myBid?:number;increment:number;revision:number;startsAt:string;endsAt:string;saved:boolean;condition:string;leading?:boolean;outcome?:"won"|"lost"|"pending";resultConfirmed?:boolean;media?:{url:string;type:string}[];details?:string[];buyNowPrice?:number;canSave?:boolean};
export type Member = {id:string;name:string;number:string;authorized:boolean;email:string;city:string;role?:string};
export type Campaign = {id:string;title:string;eyebrow:string;body:string;image:string;label:string;sponsored:boolean;destination:'subastas'|'nosotros'};
export type Snapshot = {member:Member;lots:Lot[];campaigns:Campaign[];asOf:string;demo:boolean;notices?:{id:string;title:string;body:string;lotId?:string}[];warnings?:string[]};
export type BidRequest = {lotId:string;amount:number;expectedRevision:number;idempotencyKey:string};
export type BidReceipt = {id:string;lotId:string;amount:number;createdAt:string};
export type RoomSnapshot = {lot:Lot;member:Member;asOf:string};
export interface MemberService {
 load():Promise<Snapshot>;
 loadRoom?(lotId:string):Promise<RoomSnapshot>;
 subscribeRoom?(lotId:string,listener:()=>void):()=>void;
 subscribe?(listener:()=>void):()=>void;
 signOut?():Promise<void>;
 requestAuthorization?():Promise<void>;
 setSaved(lotId:string,saved:boolean):Promise<void>;
 placeBid(request:BidRequest):Promise<BidReceipt>;
 updateProfile(profile:Pick<Member,'name'|'city'>):Promise<Member>;
}
export class BidError extends Error {
 constructor(message:string,public code:'AUTHORIZATION'|'CLOSED'|'STALE_PRICE'|'AMOUNT'|'NOT_FOUND'){super(message)}
}
export const money=(amount:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(amount);
export function validateBid(lot:Lot,member:Member,amount:number,revision:number,now:number){
 if(!member.authorized)throw new BidError('Tu cuenta necesita autorización para pujar.','AUTHORIZATION');
 if(lot.status!=='active'||now>=Date.parse(lot.endsAt)||now<Date.parse(lot.startsAt))throw new BidError('Esta subasta no está abierta.','CLOSED');
 if(lot.revision!==revision)throw new BidError('La oferta cambió. Revisa el nuevo mínimo antes de confirmar.','STALE_PRICE');
 if(!Number.isSafeInteger(amount)||amount<lot.price+lot.increment)throw new BidError(`La oferta mínima es ${money(lot.price+lot.increment)}.`,'AMOUNT');
}
export function createDemoService(live=false):MemberService {
 let asOf='2026-10-31T12:00:00-06:00';
 let member:Member={id:'demo-member',name:'Carlos',number:'USSO-DEMO',authorized:true,email:'carlos@example.com',city:'Uruapan'};
 const lots:Lot[]=[
 {id:'demo-n14',number:'DEMO 4102',title:'Motor Cummins N14',image:'/assets/usso/cummins-n14-celect.webp',status:'active',price:85000,myBid:80000,increment:1000,revision:1,startsAt:'2026-10-30T09:00:00-06:00',endsAt:'2026-10-31T18:00:00-06:00',saved:true,condition:'Motor usado. Fotografía de referencia para esta demostración. Revisa el reporte del lote antes de participar.'},
 {id:'3018',number:'3018',title:'Corte Kenworth T680',image:'/assets/usso/auction-truck.jpg',status:'upcoming',price:250000,increment:5000,revision:1,startsAt:'2026-11-02T09:00:00-06:00',endsAt:'2026-11-03T18:00:00-06:00',saved:true,condition:'Corte completo usado. La condición y disponibilidad se confirman en la publicación de USSO.'},
 {id:'3017',number:'3017',title:'Estructura Kenworth T680',image:'/assets/usso/cortes-cover.webp',status:'upcoming',price:180000,increment:5000,revision:1,startsAt:'2026-11-02T09:00:00-06:00',endsAt:'2026-11-03T18:00:00-06:00',saved:false,condition:'Estructura usada. Imagen de referencia; consultar evidencia del lote.'},
 {id:'3019',number:'3019',title:'Transmisión Eaton Fuller',image:'/assets/usso/transmisiones-cover.webp',status:'upcoming',price:15000,increment:1000,revision:1,startsAt:'2026-11-09T09:00:00-06:00',endsAt:'2026-11-10T18:00:00-06:00',saved:true,condition:'Transmisión usada. Confirma modelo, funcionamiento y condiciones con USSO.'},
 {id:'demo-closed',number:'DEMO 4090',title:'Corte International 9400i',image:'/assets/usso/cortes-cover.webp',status:'closed',price:150000,myBid:140000,increment:1000,revision:1,startsAt:'2026-10-20T09:00:00-06:00',endsAt:'2026-10-22T18:00:00-06:00',saved:false,condition:'Subasta finalizada. Ejemplo de historial; no implica disponibilidad.'}
 ];
 // Vista de ejemplo «en vivo»: recorre las fechas para que todo ocurra alrededor de hoy.
 if(live){const shift=Date.now()-Date.parse(asOf),mv=(d:string)=>new Date(Date.parse(d)+shift).toISOString();asOf=mv(asOf);lots.forEach(l=>{l.startsAt=mv(l.startsAt);l.endsAt=mv(l.endsAt)})}
 const receipts=new Map<string,{request:BidRequest;receipt:BidReceipt}>();
 const campaigns:Campaign[]=[{id:'usso-cover',title:'CONOCE USSO.',eyebrow:'EL RESPALDO DETRÁS DE CADA LOTE.',body:'Nuestra trayectoria, financiamiento y más sobre nosotros.',image:'/assets/usso/portada.png',label:'Conocer USSO',sponsored:false,destination:'nosotros'}];
 const pause=()=>new Promise<void>(resolve=>setTimeout(resolve,120));
 return {
 async load(){await pause();return structuredClone({member,lots,campaigns,asOf,demo:true})},
 async setSaved(id,saved){await pause();const lot=lots.find(l=>l.id===id);if(!lot)throw new BidError('No encontramos este lote.','NOT_FOUND');lot.saved=saved},
 async updateProfile(profile){await pause();if(!profile.name.trim())throw new Error('Escribe tu nombre.');member={...member,name:profile.name.trim(),city:profile.city.trim()};return {...member}},
 async placeBid(request){await pause();const prior=receipts.get(request.idempotencyKey);if(prior){if(prior.request.amount!==request.amount||prior.request.lotId!==request.lotId)throw new Error('La solicitud ya fue utilizada.');return {...prior.receipt}}
 const lot=lots.find(l=>l.id===request.lotId);if(!lot)throw new BidError('No encontramos este lote.','NOT_FOUND');validateBid(lot,member,request.amount,request.expectedRevision,Date.parse(asOf));
 lot.price=request.amount;lot.myBid=request.amount;lot.revision++;const receipt={id:`demo-${receipts.size+1}`,lotId:lot.id,amount:request.amount,createdAt:asOf};receipts.set(request.idempotencyKey,{request:{...request},receipt});return {...receipt}
 }
}

}
