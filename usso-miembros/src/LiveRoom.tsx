import {useCallback,useEffect,useRef,useState} from 'react';
import {money,type MemberService,type RoomSnapshot} from './member-service';
import {AuctionEnding} from './AuctionEnding';
import {roomEnding} from './room-ending';
import {RoomAmount} from './RoomAmount';
import './live-room.css';

type Quote={amount:number;revision:number;key:string};
type Movement={key:string;price:number;mine:boolean};
export function LiveRoom({service,lotId}:{service:MemberService;lotId:string}){
 const [data,setData]=useState<RoomSnapshot|null>(null),[error,setError]=useState(''),[verified,setVerified]=useState(0),[now,setNow]=useState(Date.now());
 const [quote,setQuote]=useState<Quote|null>(null),[pending,setPending]=useState(false),[notice,setNotice]=useState(''),[movements,setMovements]=useState<Movement[]>([]);
 const refreshRef=useRef<()=>Promise<void>>(async()=>{}),busy=useRef(false),alive=useRef(true);
 useEffect(()=>{const previous=document.title;document.title='Sala de subasta · USSO';return()=>{document.title=previous}},[]);
 const refresh=useCallback(()=>refreshRef.current(),[]);
 useEffect(()=>{
  let disposed=false,running:Promise<void>|null=null,queued=false,timer:ReturnType<typeof setTimeout>;
  alive.current=true;
  const run=():Promise<void>=>{
   if(disposed)return Promise.resolve();
   if(running){queued=true;return running}
   clearTimeout(timer);
   running=(async()=>{try{
    if(!service.loadRoom)throw new Error('La sala no está disponible.');
    const next=await service.loadRoom(lotId);if(disposed)return;
    setData(next);setVerified(Date.now());setError('');
    setQuote(previous=>{if(previous&&(previous.revision!==next.lot.revision||previous.amount!==next.lot.price+next.lot.increment))return null;return previous});
    setMovements(previous=>{const key=String(next.lot.revision)+':'+next.lot.price;if(previous[0]?.key===key)return previous;const round=Math.floor(next.lot.revision/1000000);const sameRound=previous.filter(m=>Math.floor(Number(m.key.split(':')[0])/1000000)===round);return [{key,price:next.lot.price,mine:!!next.lot.leading},...sameRound].slice(0,4)});
   }catch(e){if(!disposed){setError((e as Error).message||'No pudimos actualizar la sala.');setQuote(null)}}
   finally{running=null;if(!disposed){const delay=queued?100:3000;queued=false;timer=setTimeout(()=>{if(document.hidden){timer=setTimeout(run,3000)}else void run()},delay)}}})();
   return running;
  };
  refreshRef.current=run;
  const wake=()=>{if(!document.hidden)void run()};
  const unsubscribe=service.subscribeRoom?.(lotId,wake);
  document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);window.addEventListener('focus',wake);
  void run();const tick=setInterval(()=>setNow(Date.now()),1000);
  return()=>{disposed=true;alive.current=false;clearTimeout(timer);clearInterval(tick);unsubscribe?.();document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);window.removeEventListener('focus',wake)};
 },[service,lotId]);
 const lot=data?.lot,leading=!!lot?.leading;
 const starts=Date.parse(lot?.startsAt||''),ends=Date.parse(lot?.endsAt||'');
 const upcoming=lot?.status==='upcoming';
 const active=lot?.status==='active'&&now>=starts&&now<ends;
 const fresh=!!verified&&now-verified<12000&&!error;
 const allowed=!!data?.member.authorized&&active&&fresh&&!leading&&!pending;
 useEffect(()=>{if(!allowed&&!pending)setQuote(null)},[allowed,pending]);
 async function bid(){
  if(!lot||!allowed||busy.current)return;
  if(!quote){setNotice('');setQuote({amount:lot.price+lot.increment,revision:lot.revision,key:crypto.randomUUID()});return}
  if(quote.revision!==lot.revision||quote.amount!==lot.price+lot.increment){setQuote(null);return}
  busy.current=true;setPending(true);setNotice('');
  try{await service.placeBid({lotId,amount:quote.amount,expectedRevision:quote.revision,idempotencyKey:quote.key});if(alive.current)setNotice('Tu oferta quedó registrada.')}
  catch(e){if(alive.current)setNotice((e as Error).message+' Revisa el precio actualizado antes de volver a confirmar.')}
  finally{if(alive.current){setQuote(null);await refresh();if(alive.current)setPending(false)}busy.current=false}
 }
 const seconds=Math.max(0,Math.ceil(((upcoming?starts:ends)-now)/1000));
 const countdown=Number.isFinite(seconds)?[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':'):'—';
 const status=!fresh?'Actualizando conexión':upcoming?'La subasta aún no comienza':!active?'Subasta finalizada':leading?'Tu oferta va ganando':lot?.myBid!==undefined?'Superaron tu oferta':'La sala está abierta';
 const button=pending?'Registrando…':!fresh?'Actualizando…':upcoming?'Aún no comienza':!active?'Subasta finalizada':!data?.member.authorized?'Autorización pendiente':leading?'Vas ganando':quote?'Confirmar '+money(quote.amount):'Pujar '+money((lot?.price||0)+(lot?.increment||0));
 const ending=lot?roomEnding(lot,now):null;
 if(lot&&ending)return <AuctionEnding key={ending+':'+Math.floor(lot.revision/1000000)} state={ending} lot={lot} disconnected={!fresh}/>;
 return <main className="live-room">
  <header className="room-header"><a href={'#lote/'+encodeURIComponent(lotId)} aria-label="Salir de la sala">←</a><img src="/assets/usso/logo-usso-v2-transparent.webp" alt="USSO Tractopartes"/><span className="room-live"><i/>{active&&fresh?'EN VIVO':upcoming?'PRÓXIMAMENTE':'SALA USSO'}</span></header>
  <div className="room-demo">SALA DE SUBASTA <span>·</span> CUENTA REAL</div>
  <div className="room-scroll">
  {!lot?<div className="room-loading" role="status">{error||'Conectando con la subasta…'}</div>:<>
   <section className="room-lot"><div><span className="room-eyebrow">LOTE {lot.number}</span><h1>{lot.title}</h1><a className="room-details" href={'#lote/'+encodeURIComponent(lotId)}>Ver detalles del lote ↗</a></div><img src={lot.image} alt={lot.title} draggable={false}/></section>
   <section className="room-stage" aria-label="Estado de la subasta"><div className="room-countdown"><span>{upcoming?'Comienza en':active?'Cierra en':'Tiempo terminado'}</span><strong>{countdown}</strong></div><p className="room-eyebrow">{upcoming?'PRECIO BASE':active?'OFERTA ACTUAL':'PRECIO FINAL'}</p><RoomAmount value={lot.price} label={upcoming?'Precio base':active?'Oferta actual':'Precio final'}/><div className={'room-status '+(leading&&active?'is-leading':'')} role="status">{leading&&active?'✓ ':''}{status}</div><p className="room-stage-note">{lot.myBid!==undefined?'Tu última oferta: '+money(lot.myBid):'Cada oferta cuenta.'}</p></section>
   <section className="room-activity"><div className="room-section-title"><h2>Así va la subasta</h2><span><i/>{fresh?'Actualizado':'Reconectando'}</span></div><p className="room-session-hint">Actualizaciones desde que entraste a la sala.</p><ol aria-label="Actualizaciones de la oferta más alta">{movements.map((m,index)=><li key={m.key} className={index===0?'is-new':''}><span className={'room-avatar '+(m.mine?'is-you':'')}>{m.mine?'TÚ':'↗'}</span><div><strong>{m.mine?'Tu oferta':upcoming?'Precio base':'Oferta del lote'}</strong><small>{index===0?'Último precio confirmado':'Precio anterior'}</small></div><b>{money(m.price)}</b>{index===0&&<span className="room-top-dot"/>}</li>)}</ol></section>
  </>}
  </div>
  <footer className="room-action">{(error||notice)&&<p className="room-message" role="status">{error?'No pudimos actualizar. Las pujas están pausadas hasta reconectar.':notice}</p>}<div className="room-action-caption">{quote?<><span>Vas a enviar una puja real</span><button disabled={pending} onClick={()=>setQuote(null)}>Cancelar</button></>:<><span>{leading?'Tu oferta es la más alta':'Siguiente oferta'}</span><strong>{lot&&active?money(leading?lot.price:lot.price+lot.increment)+' MXN':'—'}</strong></>}</div><button className="room-bid" disabled={!allowed} onClick={bid}><span>{button}</span><span aria-hidden="true">{leading?'✓':'↗'}</span></button><p>{quote?'Confirma el importe antes de enviar.':lot?'Incremento '+money(lot.increment)+' · Ofertas reales en USSO':'Conectando con USSO'}</p></footer>
 </main>
}
