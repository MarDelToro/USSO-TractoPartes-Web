import {useEffect,useRef,useState} from 'react';
import {money} from './member-service';

/** Only the confirmed server value is the offer; animation is presentation. */
export function RoomAmount({value,label='Oferta actual'}:{value:number;label?:string}){
 const [display,setDisplay]=useState(value),previous=useRef(value);
 useEffect(()=>{
  const from=previous.current;previous.current=value;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||from===value){setDisplay(value);return}
  const start=performance.now();let frame=0;
  const tick=(now:number)=>{const progress=Math.min(1,(now-start)/450);setDisplay(Math.round(from+(value-from)*(1-(1-progress)**3)));if(progress<1)frame=requestAnimationFrame(tick)};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[value]);
 return <div className="room-amount" aria-label={`${label} ${money(value)} MXN`}><span className="room-animated-price" aria-hidden="true">{money(display)}</span><span aria-hidden="true">MXN</span></div>
}
