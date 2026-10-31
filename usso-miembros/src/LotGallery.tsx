import {useEffect,useLayoutEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {ChevronLeftIcon,ChevronRightIcon,ImageIcon,PlayIcon,ExternalLinkIcon} from '@radix-ui/react-icons';
import type {Lot} from './member-service';

type Media=NonNullable<Lot['media']>[number];
// App-owned discrete carousel: three virtual neighbors, one selection per gesture.
// The protected simulator Carousel is a free-scrolling rail and stays unchanged.
export function LotGallery({lot}:{lot:Lot}){
 const media=lot.media??(lot.image?[{url:lot.image,type:'image'}]:[]);
 return <Carousel key={lot.id+JSON.stringify(media)} media={media} title={lot.title} closed={lot.status==='closed'}/>;
}
export function Carousel({media,title,closed=false}:{media:Media[];title:string;closed?:boolean}){
 const count=media.length,[index,setIndex]=useState(0),[offset,setOffset]=useState(0),[moving,setMoving]=useState(false);
 const stage=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),busy=useRef(false),pending=useRef(0),suppress=useRef(false);
 const goRef=useRef<(direction:number)=>void>(()=>{});
 const gesture=useRef<{id:number;x:number;y:number;dx:number;horizontal:boolean}|null>(null);
 const wrap=(i:number)=>(i+count)%count;
 const finish=()=>{if(!busy.current)return;const step=pending.current;busy.current=false;pending.current=0;clearTimeout(timer.current);setMoving(false);setIndex(i=>wrap(i+step));setOffset(0)};
 const go=(direction:number)=>{
  if(count<2||busy.current)return;
  stage.current?.querySelectorAll('video').forEach(v=>v.pause());
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setIndex(i=>wrap(i+direction));setOffset(0);return}
  busy.current=true;pending.current=direction;setMoving(true);setOffset(-direction*(stage.current?.clientWidth||0));timer.current=setTimeout(finish,320);
 };
 goRef.current=go;
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 // Trackpad swipes arrive as wheel events, not pointer drags. Consume one
 // horizontal gesture including its inertia; keep vertical page scrolling.
 useEffect(()=>{
  const node=stage.current;if(!node||count<2)return;
  let total=0,latched=false,idle:ReturnType<typeof setTimeout>;
  const wheel=(e:WheelEvent)=>{
   if(e.ctrlKey)return;
   const dx=e.shiftKey&&!e.deltaX?e.deltaY:e.deltaX,dy=e.shiftKey?0:e.deltaY;
   if(Math.abs(dx)<=Math.abs(dy)||!dx)return;
   e.preventDefault();clearTimeout(idle);idle=setTimeout(()=>{total=0;latched=false},220);
   if(latched||busy.current)return;
   total+=dx*(e.deltaMode===1?16:e.deltaMode===2?node.clientWidth:1);
   if(Math.abs(total)>=24){latched=true;goRef.current(total>0?1:-1)}
  };
  node.addEventListener('wheel',wheel,{passive:false});return()=>{node.removeEventListener('wheel',wheel);clearTimeout(idle)};
 },[count]);
 useLayoutEffect(()=>{const node=stage.current;if(!node)return;const observer=new ResizeObserver(()=>{gesture.current=null;if(busy.current)finish();else setOffset(0)});observer.observe(node);return()=>observer.disconnect()},[count]);
 const down=(e:ReactPointerEvent<HTMLDivElement>)=>{
  suppress.current=false;
  if(count<2||busy.current||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||(e.target as HTMLElement).closest('video'))return;
  gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,horizontal:false};
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.horizontal){if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;suppress.current=true;if(Math.abs(dy)>Math.abs(dx)){gesture.current=null;return}g.horizontal=true;e.currentTarget.setPointerCapture(e.pointerId)}
  e.preventDefault();e.stopPropagation();g.dx=dx;setOffset(Math.max(-(stage.current?.clientWidth||0),Math.min(stage.current?.clientWidth||0,dx)));
 };
 const up=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;gesture.current=null;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(g.horizontal){e.preventDefault();e.stopPropagation();const threshold=Math.min(42,(stage.current?.clientWidth||300)*.12);go(e.type==='pointercancel'?0:Math.abs(g.dx)>=threshold?g.dx<0?1:-1:0)}
 };
 const current=media[index];
 if(!count)return <section className="gallery-empty"><ImageIcon/><p>Este lote no tiene fotografías publicadas.</p></section>;
 const slots=count>1?[-1,0,1]:[0];
 return <section className="lot-gallery" aria-label={`Galería de ${title}`} data-count={count} data-index={index}>
  <div ref={stage} className="gallery-stage" tabIndex={count>1?0:undefined} aria-label="Fotos y videos del lote" aria-roledescription="carrusel" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(e.key==='ArrowRight'?1:-1)}}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onDragStart={e=>e.preventDefault()} onClickCapture={e=>{if(suppress.current){e.preventDefault();e.stopPropagation();suppress.current=false}}}>
   <div className="gallery-track" data-moving={moving} style={{transform:`translateX(calc(${count>1?'-100%':'0%'} + ${offset}px))`}} onTransitionEnd={e=>{if(e.target===e.currentTarget)finish()}}>
    {slots.map(delta=>{const selected=delta===0,item=media[wrap(index+delta)];return <div className="gallery-slide" key={delta} aria-hidden={!selected} inert={!selected}>
     {item.type==='video'?selected?<video key={item.url} src={item.url} controls playsInline preload="metadata" aria-label={`Video ${index+1} de ${title}`}/>:<div className="gallery-video-preview"><PlayIcon/><span>Video del lote</span></div>:<a draggable={false} href={item.url} target="_blank" rel="noreferrer" tabIndex={selected?0:-1} aria-label={`Ampliar fotografía ${wrap(index+delta)+1} de ${title}`}><img src={item.url} alt={`Fotografía ${wrap(index+delta)+1} de ${title}`} draggable={false} onLoad={e=>{e.currentTarget.style.visibility='';e.currentTarget.parentElement?.classList.remove('media-unavailable')}} onError={e=>{e.currentTarget.style.visibility='hidden';e.currentTarget.parentElement?.classList.add('media-unavailable')}}/></a>}
    </div>})}
   </div>
  </div>
  <div className="gallery-controls">
   {count>1&&<span className="gallery-swipe-hint">Desliza para ver más</span>}
   {count>1&&<button className="icon-button" aria-label="Imagen o video anterior" onClick={()=>go(-1)}><ChevronLeftIcon/></button>}
   <span className="gallery-counter" aria-live="polite" aria-atomic="true">{index+1} / {count}<small>{current.type==='video'?'Video':'Fotografía'}</small></span>
   {count>1&&<button className="icon-button" aria-label="Imagen o video siguiente" onClick={()=>go(1)}><ChevronRightIcon/></button>}
   {current.type!=='video'&&<a className="gallery-expand" href={current.url} target="_blank" rel="noreferrer" aria-label="Ampliar imagen seleccionada"><ExternalLinkIcon/></a>}
  </div>
  {closed&&count===1&&<p className="gallery-archive-note">Esta publicación conserva un solo archivo de evidencia.</p>}
 </section>;
}
