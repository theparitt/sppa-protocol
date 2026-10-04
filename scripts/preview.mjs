import http from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { join,resolve,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const base=process.env.BASE_PATH??'/sppa-protocol/';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/'){res.writeHead(302,{location:base});return res.end();}
  if(!['GET','HEAD'].includes(req.method)||!path.startsWith(base))throw new Error();
  let target=resolve(join(root,path.slice(base.length)));
  if(target!==resolve(root)&&!target.startsWith(resolve(root)+'/'))throw new Error();
  if((await stat(target)).isDirectory())target=join(target,'index.html');
  const body=await readFile(target);res.writeHead(200,{'content-type':types[extname(target)]??'application/octet-stream','cache-control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'content-type':'text/html'});res.end(await readFile(join(root,'404.html')));}
});
server.listen(Number(process.env.PORT??8247),'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${server.address().port}${base}`));
