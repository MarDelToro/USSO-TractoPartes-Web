import {readFile,writeFile,mkdir,cp,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {integrateHtml} from './routes.mjs';

// Package only the member journey into an isolated checkout of the current site.
// Run build:release first; the phone-framed demo is never the deployed entry.
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.resolve(process.argv[2]||'');
if(!process.argv[2]||target===source)throw new Error('Provide a separate release checkout.');
await access(path.join(target,'.git'));
const read=name=>readFile(path.join(target,name),'utf8');
const write=(name,value)=>writeFile(path.join(target,name),value);
await mkdir(path.join(target,'miembros'),{recursive:true});
await cp(path.join(source,'usso-miembros/dist/web/assets'),path.join(target,'miembros/assets'),{recursive:true});
let entry=await readFile(path.join(source,'usso-miembros/dist/web/web.html'),'utf8');
entry=entry.replace('<head>','<head><script src="/access-guard.js"></script>');
await write('miembros/index.html',entry);
await cp(path.join(source,'usso-miembros/public/assets/usso'),path.join(target,'assets/usso'),{recursive:true});
for(const name of ['nosotros.html','nosotros.css','nosotros-videos.js','recuperar.html','recuperar.js']){
 await cp(path.join(source,name),path.join(target,name));
}
let information=await read('nosotros.html');
information=information.replace('<head>','<head>\n<script src="/access-guard.js"></script>');
await write('nosotros.html',information);
for(const name of ['usso-tractopartes.dc.html','login.html','registro.html']){
 let html=await read(name);
 if(name==='login.html'&&!html.includes('href="recuperar.html"'))html=html.replace('<p class="msg" id="msg"></p>','<a href="recuperar.html" style="text-align:center;color:#f6c02a;font-size:13px">Olvidé mi contraseña</a>\n    <p class="msg" id="msg"></p>');
 await write(name,integrateHtml(name,html,{production:true}));
}
const bridge=code=>`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/access-guard.js"></script><title>Mi espacio USSO</title></head><body style="background:#0c0e10;color:#f5f3ed;font-family:system-ui"><p>Abriendo tu espacio…</p><a href="/miembros/">Entrar a mi cuenta</a><script>${code}</script></body></html>\n`;
await write('Subasta.dc.html',bridge('let id=location.hash.slice(1);try{id=decodeURIComponent(id)}catch{}location.replace(id?"/miembros/#lote/"+encodeURIComponent(id):"/miembros/#subastas");'));
await write('perfil.html',bridge('location.replace("/miembros/#cuenta");'));
await write('mis-pujas.html',bridge('location.replace("/miembros/#pujas");'));
// Netlify handles directory URLs; an explicit trailing-slash redirect would loop.
let redirects=await read('_redirects');
redirects=redirects.replace('/miembros /miembros/ 301!\n','');
await write('_redirects',redirects);
let headers=await read('_headers');
if(!headers.includes('/miembros/'))headers+='\n/miembros/\n  Cache-Control: public, max-age=0, must-revalidate\n\n/miembros/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n';
await write('_headers',headers);
// Retain editable sources, without dependencies, local state, screenshots or generated previews.
await cp(path.join(source,'usso-miembros'),path.join(target,'usso-miembros'),{
 recursive:true,
 filter:item=>!path.relative(path.join(source,'usso-miembros'),item).split(path.sep).some(part=>['node_modules','dist','.git','.openai','qa','test-results','playwright-report'].includes(part)),
});
await write('usso-miembros/.gitignore','node_modules/\ndist/\n.openai/\nqa/\ntest-results/\nplaywright-report/\n');
await cp(path.join(source,'local-integration'),path.join(target,'local-integration'),{recursive:true});
console.log('Member release packaged; public visuals and backend unchanged.');
