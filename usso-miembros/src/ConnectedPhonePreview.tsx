import {useState} from 'react';
import {createPortal} from 'react-dom';
import {useMobileDevice} from './mobile';
import './connected-phone-preview.css';

const screens=[
 {id:'inicio',label:'Mi cuenta',path:'/miembros/#inicio'},
 {id:'calendario',label:'Calendario',path:'/miembros/#calendario'},
 {id:'nosotros',label:'Conoce USSO',path:'/nosotros.html'},
 {id:'videos',label:'Desde el taller',path:'/nosotros.html#videos'},
];
/** Reuses the calibrated mobile runtime while displaying the actual local site. */
export function ConnectedPhonePreview(){
 const {device}=useMobileDevice();
 const [screen,setScreen]=useState(()=>screens.find(s=>s.id===new URLSearchParams(location.search).get('screen'))||screens[0]);
 const [version,setVersion]=useState(0);
 const select=(next:typeof screens[number])=>{setScreen(next);setVersion(v=>v+1);const url=new URL(location.href);url.searchParams.set('screen',next.id);history.replaceState(null,'',url)};
 return <>
  <div className="connected-phone-content" style={{top:device.geometry.safeArea.top,bottom:device.platform==='ios'?device.geometry.safeArea.bottom:0}}>
   <iframe key={version} title="Sitio USSO en pantalla de celular" src={'http://127.0.0.1:4173'+screen.path} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>
  </div>
  {createPortal(<aside className="phone-preview-tools" aria-label="Pantallas de la vista celular"><p>USSO · VISTA CELULAR</p><span>Pantalla {device.geometry.screen.width} × {device.geometry.screen.height} · Cuenta real</span><nav>{screens.map(s=><button type="button" key={s.id} onClick={()=>select(s)}>{s.label}<span aria-hidden="true">↗</span></button>)}</nav><small>Navega dentro del teléfono.</small></aside>,document.body)}
 </>
}
