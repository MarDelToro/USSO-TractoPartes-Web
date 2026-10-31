import {useEffect,useState} from 'react';
import './live-room.css';
import {AuctionEnding} from './AuctionEnding';
import {RoomAmount} from './RoomAmount';

const money=(value:number)=>'$'+value.toLocaleString('es-MX');
type Bid={id:number;name:string;amount:number;mine:boolean};
const seed:Bid[]=[{id:3,name:'Participante 024',amount:268000,mine:false},{id:2,name:'Tú',amount:267000,mine:true},{id:1,name:'Participante 018',amount:266000,mine:false}];

export function LiveRoomPreview(){
 const final=new URLSearchParams(location.search).get('final');
 const short=final==='won'||final==='lost';
 const [bids,setBids]=useState(()=>final==='won'?[{id:4,name:'Tú',amount:269000,mine:true},...seed]:seed),[myAmount,setMyAmount]=useState(final==='won'?269000:267000),[deadline]=useState(()=>Date.now()+(short?4000:462000)),[seconds,setSeconds]=useState(short?4:462),[quote,setQuote]=useState<number|null>(null);
 const current=bids[0],leading=current.mine,closed=seconds===0;
 useEffect(()=>{document.title='Sala de subasta · Vista previa USSO';const timer=setInterval(()=>setSeconds(Math.max(0,Math.ceil((deadline-Date.now())/1000))),1000);return()=>clearInterval(timer)},[deadline]);
 useEffect(()=>{if(closed)return;const timer=setTimeout(()=>setBids(previous=>[{id:Date.now(),name:previous[0].name==='Participante 024'?'Participante 018':'Participante 024',amount:previous[0].amount+1000,mine:false},...previous].slice(0,4)),leading?10000:6000);return()=>clearTimeout(timer)},[current.id,closed,leading]);
 useEffect(()=>{if(closed||quote!==null&&quote!==current.amount+1000)setQuote(null)},[closed,current.amount,quote]);
 function bid(){if(closed||leading)return;if(quote===null){setQuote(current.amount+1000);return}setMyAmount(quote);setBids(previous=>[{id:Date.now(),name:'Tú',amount:quote,mine:true},...previous].slice(0,4));setQuote(null)}
 if(closed)return <AuctionEnding state={leading?'won':'lost'} demo lot={{id:'demo-room',number:'DEMO 3018',title:'Corte Kenworth T680',image:'/assets/usso/auction-truck.jpg',status:'closed',price:current.amount,myBid:myAmount,increment:1000,revision:1,startsAt:'',endsAt:new Date(deadline).toISOString(),saved:false,condition:''}}/>;
 return <main className="live-room">
  <header className="room-header"><a href="/miembros/#inicio" aria-label="Salir de la sala">←</a><img src="/assets/usso/logo-usso-v2-transparent.webp" alt="USSO Tractopartes"/><span className="room-live"><i/>{closed?'FINALIZADA':'EN VIVO'}</span></header>
  <div className="room-demo">VISTA PREVIA <span>·</span> ACTIVIDAD SIMULADA</div>
  <div className="room-scroll">
   <section className="room-lot"><div><span className="room-eyebrow">SALA DE SUBASTA / LOTE DEMO</span><h1>Corte Kenworth<br/>T680</h1><p>El siguiente paso para tu negocio.</p></div><img src="/assets/usso/auction-truck.jpg" alt="Camión Kenworth blanco del lote de demostración" draggable={false}/></section>
   <section className="room-stage" aria-label="Estado de la subasta">
    <div className="room-countdown"><span>{closed?'Subasta de ejemplo terminada':'Cierra en'}</span><strong>{String(Math.floor(seconds/60)).padStart(2,'0')}<b>:</b>{String(seconds%60).padStart(2,'0')}</strong></div>
    <p className="room-eyebrow">{closed?'OFERTA FINAL':'OFERTA ACTUAL'}</p>
    <RoomAmount value={current.amount}/>
    <div className={'room-status '+(leading?'is-leading':'')} role="status">{leading?'✓  '+(closed?'Ganaste esta subasta de ejemplo':'Tu oferta va ganando'):'↗  '+(closed?'Subasta de ejemplo finalizada':'Superaron tu oferta')}</div>
    <p className="room-stage-note">{leading?'Tu oferta ya aparece en la sala.':'Tu última oferta: '+money(myAmount)}</p>
   </section>
   <section className="room-activity"><div className="room-section-title"><h2>Así va la subasta</h2><span><i/>Al momento</span></div><ol aria-label="Últimas pujas simuladas">{bids.map((item,index)=><li key={item.id} className={index===0?'is-new':''}><span className={'room-avatar '+(item.mine?'is-you':'')}>{item.mine?'TÚ':item.name.slice(-3)}</span><div><strong>{item.name}</strong><small>{index===0?'Última oferta':'Oferta anterior'}</small></div><b>{money(item.amount)}</b>{index===0&&<span className="room-top-dot"/>}</li>)}</ol></section>
  </div>
  <footer className="room-action"><div className="room-action-caption">{quote!==null?<><span>Confirmar oferta de prueba</span><button onClick={()=>setQuote(null)}>Cancelar</button></>:<><span>{closed?'Vista previa completada':'Siguiente oferta'}</span><strong>{closed?'Gracias por participar':money(current.amount+1000)+' MXN'}</strong></>}</div><button className="room-bid" onClick={bid} disabled={closed||leading} aria-label={closed?'Subasta finalizada':leading?'Tu oferta va ganando':quote!==null?'Confirmar puja simulada':'Pujar '+money(current.amount+1000)}><span>{closed?'Subasta finalizada':leading?'Vas ganando':quote!==null?'Confirmar '+money(quote):'Pujar '+money(current.amount+1000)}</span><span aria-hidden="true">{closed||leading?'✓':'↗'}</span></button><p>Sin cargos ni pujas reales · Incremento {money(1000)}</p></footer>
 </main>
}
