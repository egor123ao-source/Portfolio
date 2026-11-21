import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const server = http.createServer(async (req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  try {
    if((await stat(file)).isDirectory()) {
      if(!pathname.endsWith('/')){res.writeHead(308,{Location:pathname+'/'+new URL(req.url,'http://localhost').search}).end();return;}
      file=resolve(file,'index.html');
    }
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'404.html')));}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
