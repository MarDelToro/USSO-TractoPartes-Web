import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {money,type Lot} from './member-service';
import type {RoomEnding} from './room-ending';
import './auction-ending.css';

export function AuctionEnding({state,lot,demo=false,disconnected=false}:{state:RoomEnding;lot:Lot;demo?:boolean;disconnected?:boolean}){
 const heading=useRef<HTMLHeadingElement>(null);
 const [results,setResults]=useState(state==='closed');
 const won=state==='won',lost=state==='lost',pending=state==='pending';
 useEffect(()=>{if(state==='pending')return;if(state==='closed'){setResults(true);return}const timer=setTimeout(()=>setResults(true),8000);return()=>clearTimeout(timer)},[state]);
 useEffect(()=>{heading.current?.focus({preventScroll:true})},[state,results]);
 if(results)return <main className={`auction-ending ending-${state} ending-results`}>
  <header className="ending-header"><img src="/assets/usso/logo-usso-v2-transparent.webp" alt="USSO Tractopartes"/><span>{demo?'VISTA PREVIA · RESULTADO SIMULADO':'TU ESPACIO USSO'}</span></header>
  {(won||lost)&&<div className={won?"result-victory-light":"result-loss-light"} aria-hidden="true"><i/><i/><i/></div>}
  <div className="result-content">
   <div className="result-heading"><p className="ending-kicker">{won?'TU OFERTA FUE LA GANADORA':lost?'SUBASTA CERRADA · TU RESULTADO':'RESULTADO DE LA SUBASTA'}</p><h1 ref={heading} tabIndex={-1}>{won?<>GANASTE.<br/><em>ES TUYO.</em></>:lost?<>NO GANASTE<br/><em>ESTE LOTE.</em></>:'Subasta finalizada'}</h1>{!won&&<p className="result-outcome">{lost?'La oferta ganadora fue de otro participante.':'Esta subasta ha terminado.'}</p>}</div>
   <figure className="result-product"><div className="result-photo"><img src={lot.image} alt={lot.title}/>{won&&<span className="result-winner-seal"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M20 12h24v15c0 10-5 17-12 17s-12-7-12-17V12Z"/><path d="M20 17H11v8c0 7 5 12 12 12m21-20h9v8c0 7-5 12-12 12M32 44v9m-11 3h22"/></svg><span>LOTE<br/>GANADO</span></span>}{lost&&<span className="result-lost-seal"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m10 10 12 12m0-12L10 22"/></svg><span>NO<br/>GANADO</span></span>}</div><figcaption><span>LOTE {lot.number}</span><h2>{lot.title}</h2></figcaption></figure>
   <section className="result-price-panel" aria-label="Importes del resultado"><p>{won?'TU OFERTA GANADORA':'PRECIO FINAL DE LA SUBASTA'}</p><strong className="result-final-price">{money(lot.price)} <small>MXN</small></strong>{lost&&lot.myBid!==undefined&&<div className="result-own-price"><span>Tu última oferta</span><b>{money(lot.myBid)} <small>MXN</small></b></div>}</section>
   <p className="result-description">{demo?'Resultado de ejemplo · Sin ofertas reales.':won?'Este lote lo ganaste tú. Revisa los detalles para continuar con USSO.':lost?'Puedes consultar este resultado en Mis pujas.':'Consulta el lote o explora las próximas subastas.'}</p>{!demo&&<a className="result-detail" href={'#lote/'+encodeURIComponent(lot.id)}>{won?'Ver mi lote y siguientes pasos':'Ver detalles del lote'} ↗</a>}
  </div>
  <footer className="ending-actions"><a className="ending-primary" href="/miembros/#subastas/proximas">Ver próximas subastas<span aria-hidden="true">↗</span></a><a className="result-home" href="/miembros/#inicio">Regresar al inicio</a>{demo&&<a className="ending-secondary" href={'/miembros/?preview=sala&final='+(won?'lost':'won')}>Ver {won?'final sin ganar':'celebración ganadora'}</a>}</footer>
 </main>;
 return <main className={`auction-ending ending-${state} ending-splash`}>
  <div className="ending-atmosphere" aria-hidden="true"><div className="ending-rays"/><div className="ending-halo"/><div className="ending-beam beam-left"/><div className="ending-beam beam-right"/>{won&&<div className="ending-confetti">{Array.from({length:56},(_,i)=><i key={i} style={{'--x':`${(i*37)%101}%`,'--delay':`${(i%14)*.12}s`,'--drift':`${(i%2?1:-1)*(20+i%7*11)}px`,'--spin':`${180+i*41}deg`,'--shade':i%3===0?'#fff0bf':i%3===1?'#e8b84e':'#967026'} as CSSProperties}/>)}</div>}</div>
  <header className="ending-header"><img src="/assets/usso/logo-usso-v2-transparent.webp" alt="USSO Tractopartes"/><span>{demo?'VISTA PREVIA · RESULTADO SIMULADO':'SALA USSO · CIERRE DE SUBASTA'}</span></header>
  <div className="ending-content">
   <p className="ending-zero">00<span>:</span>00</p>
   <div className="ending-emblem" aria-hidden="true"><div className="ending-emblem-inner">{won?<svg viewBox="0 0 64 64" fill="none"><path d="M20 12h24v15c0 10-5 17-12 17s-12-7-12-17V12Z"/><path d="M20 17H11v8c0 7 5 12 12 12m21-20h9v8c0 7-5 12-12 12M32 44v9m-11 3h22M26 9h12"/></svg>:pending?<span className="ending-orbit"/>:<svg viewBox="0 0 64 64" fill="none"><path d="m32 9 21 23-21 23L11 32 32 9Z"/><path d={lost?'m23 23 18 18m0-18L23 41':'m22 32 7 7 14-14'}/></svg>}</div></div>
   <p className="ending-kicker">{won?'LA MEJOR OFERTA FUE LA TUYA':lost?'SUBASTA FINALIZADA':pending?'EL RELOJ LLEGÓ A CERO':'SUBASTA FINALIZADA'}</p>
   <h1 ref={heading} tabIndex={-1}>{won?<>EL LOTE<br/><em>ES TUYO.</em></>:lost?<>ESTA VEZ,<br/><em>NO FUE TUYO.</em></>:pending?<>CERRANDO<br/><em>LA SUBASTA.</em></>:<>EL LOTE<br/><em>YA CERRÓ.</em></>}</h1>
   <p className="ending-description">{won?'Tu oferta ganó esta subasta.':lost?'Otro participante presentó la oferta ganadora.':pending?disconnected?'Recuperando la conexión para confirmar el resultado.':'Estamos esperando el resultado confirmado por USSO.':'Consulta el resultado y los detalles del lote.'}</p>
  </div>
  <footer className="ending-actions ending-splash-actions">{pending?<a className="ending-secondary" href={demo?'/miembros/?preview=sala':'#lote/'+encodeURIComponent(lot.id)}>Volver al lote</a>:<><button className="ending-skip" onClick={()=>setResults(true)}>Ver resultado <span aria-hidden="true">→</span></button><p>Tu resultado aparecerá en unos segundos.</p></>}</footer>
 </main>
}
