(() => {
 const root=document.querySelector('.work-videos');
 if(!root)return;
 const videos=JSON.parse(document.getElementById('work-video-data').textContent);
 const stage=root.querySelector('.work-video-stage'),track=root.querySelector('.work-video-track'),counter=root.querySelector('[data-video-count]'),external=root.querySelector('.work-video-external');
 const previous=root.querySelector('[data-video-prev]'),next=root.querySelector('[data-video-next]');
 let index=0,moving=false,pending=0,timer,gesture=null,suppress=false,wheelTotal=0,wheelLatched=false,wheelIdle;
 const wrap=n=>(n%videos.length+videos.length)%videos.length;
 const position=(dx=0)=>track.style.transform=`translateX(calc(${videos.length>1?'-100%':'0%'} + ${dx}px))`;
 function render(){
  track.replaceChildren();
  for(const delta of videos.length>1?[-1,0,1]:[0]){
   const item=videos[wrap(index+delta)],selected=delta===0;
   const card=document.createElement('article');card.className='work-video-card';card.inert=!selected;card.setAttribute('aria-hidden',String(!selected));
   const media=document.createElement('div');media.className='work-video-media';
   const play=document.createElement('button');play.type='button';play.className='work-video-play';play.setAttribute('aria-label',`Reproducir ${item.title}`);
   const image=document.createElement('img');image.src=`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;image.alt='';image.draggable=false;image.loading=selected?'eager':'lazy';image.addEventListener('error',()=>image.hidden=true);
   const icon=document.createElement('span');icon.className='work-play-symbol';icon.textContent='▶';icon.setAttribute('aria-hidden','true');
   play.append(image,icon);media.append(play);
   const copy=document.createElement('div');copy.className='work-video-copy';const title=document.createElement('h4'),description=document.createElement('p');title.textContent=item.title;description.textContent=item.description;copy.append(title,description);card.append(media,copy);track.append(card);
   play.addEventListener('click',()=>{if(!selected||moving||suppress)return;const frame=document.createElement('iframe');frame.title=item.title;frame.src=`https://www.youtube.com/embed/${item.id}?autoplay=1&playsinline=1`;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';media.replaceChildren(frame)});
  }
  root.dataset.index=String(index);root.dataset.count=String(videos.length);counter.textContent=`${index+1} / ${videos.length}`;external.href=`https://www.youtube.com/watch?v=${videos[index].id}`;position();
 }
 function finish(){if(!moving)return;clearTimeout(timer);index=wrap(index+pending);moving=false;pending=0;track.classList.remove('is-moving');render()}
 function go(direction){
  if(videos.length<2||moving)return;
  // Stop the current player before changing the selected video.
  const frame=track.querySelector('iframe');if(frame)render();
  pending=direction;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){index=wrap(index+direction);render();return}
  moving=true;track.classList.add('is-moving');position(-direction*stage.clientWidth);timer=setTimeout(finish,340);
 }
 previous.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
 track.addEventListener('transitionend',e=>{if(e.target===track&&e.propertyName==='transform')finish()});
 stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(e.key==='ArrowRight'?1:-1)}});
 stage.addEventListener('dragstart',e=>e.preventDefault());
 stage.addEventListener('pointerdown',e=>{suppress=false;if(videos.length<2||moving||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,horizontal:false}});
 stage.addEventListener('pointermove',e=>{const g=gesture;if(!g||g.id!==e.pointerId)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.horizontal){if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;suppress=true;if(Math.abs(dy)>Math.abs(dx)){gesture=null;return}g.horizontal=true;stage.setPointerCapture(e.pointerId)}e.preventDefault();g.dx=dx;position(Math.max(-stage.clientWidth,Math.min(stage.clientWidth,dx)))});
 function release(e){const g=gesture;if(!g||g.id!==e.pointerId)return;gesture=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(g.horizontal){e.preventDefault();go(e.type==='pointercancel'?0:Math.abs(g.dx)>=Math.min(42,stage.clientWidth*.12)?g.dx<0?1:-1:0)}}
 stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
 stage.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();suppress=false}},true);
 stage.addEventListener('wheel',e=>{if(e.ctrlKey||videos.length<2)return;const dx=e.shiftKey&&!e.deltaX?e.deltaY:e.deltaX,dy=e.shiftKey?0:e.deltaY;if(!dx||Math.abs(dx)<=Math.abs(dy))return;e.preventDefault();clearTimeout(wheelIdle);wheelIdle=setTimeout(()=>{wheelTotal=0;wheelLatched=false},220);if(wheelLatched||moving)return;wheelTotal+=dx*(e.deltaMode===1?16:e.deltaMode===2?stage.clientWidth:1);if(Math.abs(wheelTotal)>=24){wheelLatched=true;go(wheelTotal>0?1:-1)}},{passive:false});
 new ResizeObserver(()=>{gesture=null;if(moving)finish();else position()}).observe(stage);
 previous.hidden=next.hidden=videos.length<2;stage.tabIndex=videos.length>1?0:-1;root.querySelector('.work-video-hint').hidden=videos.length<2;
 if(!videos.length){stage.hidden=true;external.hidden=true;counter.textContent='Próximamente, más videos del taller.';return}render();
})();
