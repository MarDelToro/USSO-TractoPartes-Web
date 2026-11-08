import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemberExperience} from './Prototype';
import {LiveRoomPreview} from './LiveRoomPreview';
import {LiveRoom} from './LiveRoom';
import {WebMemberUI} from './member-ui';
import {createDemoService} from './member-service';
import {createUssoService,USSO_URL,USSO_PUBLIC_KEY,SessionRequired} from './usso-service';
import './prototype.css';
import '../../usso-kit.css';
import './web.css';
try{if(localStorage.getItem('usso_theme')==='light')document.documentElement.dataset.theme='light'}catch{}
declare global {interface Window{supabase:any}}
const demoPreview=import.meta.env.MODE!=='release'&&new URLSearchParams(location.search).get('preview')==='demo';
const roomPreview=import.meta.env.MODE!=='release'&&new URLSearchParams(location.search).get('preview')==='sala';
const client=roomPreview||demoPreview?null:window.supabase?.createClient(USSO_URL,USSO_PUBLIC_KEY);
const service=client?createUssoService(client):null;
function login(){const next='/miembros/'+location.hash;location.replace('/login.html?next='+encodeURIComponent(next))}
function WebApp(){const [route,setRoute]=useState(location.hash);useEffect(()=>{const sync=()=>setRoute(location.hash);window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);const [ready,setReady]=useState(false),[error,setError]=useState('');useEffect(()=>{if(!client||!service){setError('No pudimos cargar la conexión con USSO. Revisa tu conexión e intenta de nuevo.');return}let alive=true;client.auth.getSession().then(({data}:any)=>{if(!data.session){login();return}service.load().then(()=>alive&&setReady(true)).catch((e:Error)=>e instanceof SessionRequired?login():setError(e.message))}).catch((e:Error)=>alive&&setError(e.message));const {data:{subscription}}=client.auth.onAuthStateChange((event:string)=>{if(event==='SIGNED_OUT')location.replace('/')});return()=>{alive=false;subscription.unsubscribe()}},[]);
 if(error)return <div className="web-gate"><img src="/assets/usso/logo-usso-v2-transparent.webp" alt="USSO"/><h1>No pudimos abrir tu espacio</h1><p role="alert">{error}</p><button onClick={()=>location.reload()}>Volver a intentar</button><a href="/usso-tractopartes.dc.html?vista=publica">Volver al inicio público</a></div>;
 if(!ready||!service)return <div className="web-gate" role="status"><img src="/assets/usso/logo-usso-v2-transparent.webp" alt="USSO"/><p>Abriendo tu espacio…</p></div>;
 if(route.startsWith('#sala/'))return <LiveRoom key={route} lotId={decodeURIComponent(route.slice(6))} service={service}/>;
 return <WebMemberUI><MemberExperience service={service}/></WebMemberUI>
}
createRoot(document.getElementById('root')!).render(roomPreview?<LiveRoomPreview/>:demoPreview?<WebMemberUI><MemberExperience service={createDemoService(true)}/></WebMemberUI>:<WebApp/>);
