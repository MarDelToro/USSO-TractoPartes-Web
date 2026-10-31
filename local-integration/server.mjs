import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import {createReadStream} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {integrateHtml} from './routes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'usso-miembros/dist/web');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime'};
const redirect=(res,to)=>{res.writeHead(302,{Location:to,'Cache-Control':'no-store'});res.end()};
http.createServer(async(req,res)=>{try{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 const url=new URL(req.url,'http://127.0.0.1:4173');let route=decodeURIComponent(url.pathname);
 if(route.includes('\0')||route.includes('\\')||route.split('/').some(x=>x==='..'||x.startsWith('.'))){res.writeHead(403);res.end();return}
 if(['/login','/registro','/recuperar'].includes(route))return redirect(res,route+'.html'+url.search);
 if(route==='/perfil.html')return redirect(res,'/miembros/#cuenta');
 if(route==='/mis-pujas.html')return redirect(res,'/miembros/#pujas');
 if(route==='/Subasta.dc.html'){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end('<!doctype html><html lang="es"><head><title>Abriendo lote · USSO</title></head><body style="background:#0c0e10;color:white"><p>Abriendo lote…</p><script>location.replace("/miembros/#lote/"+encodeURIComponent(decodeURIComponent(location.hash.slice(1))))</script></body></html>');return;
 }
 let filename;
 if(route==='/miembros'||route==='/miembros/')filename=path.join(web,'web.html');
 else if(route.startsWith('/miembros/assets/'))filename=path.join(web,route.slice('/miembros/'.length));
 else if(route.startsWith('/assets/usso/'))filename=path.join(root,'usso-miembros/public',route);
 else {
  if(route==='/')route='/usso-tractopartes.dc.html';
  if(route.slice(1).includes('/')&&!/^\/(assets|local-media|media)\//.test(route)){res.writeHead(404);res.end();return}
  filename=path.join(root,route);
 }
 const ext=path.extname(filename).toLowerCase();if(!types[ext]){res.writeHead(404);res.end();return}
 const info=await stat(filename);if(!info.isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',types[ext]);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 if(ext==='.html'){const content=integrateHtml(path.basename(filename),await readFile(filename,'utf8'));res.end(req.method==='HEAD'?undefined:content);return}
 const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
 if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):info.size-1,info.size-1);if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${info.size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});if(req.method==='HEAD')res.end();else createReadStream(filename,{start,end}).pipe(res);return}
 res.setHeader('Content-Length',info.size);if(req.method==='HEAD')res.end();else createReadStream(filename).pipe(res);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:500,{'Content-Type':'text/plain; charset=utf-8'});res.end(e.code==='ENOENT'?'No encontrado':'No se pudo preparar esta página.')}}).listen(4173,'127.0.0.1',()=>console.log('USSO local conectado: http://127.0.0.1:4173/'));
