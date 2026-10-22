import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import pg from 'pg';
import {Database,migrate} from './database.mjs';
import {configureDatabase,json,authorize,publicColumns} from './runtime.ts';
import * as orderRoute from './routes/orders.ts';
import * as sessionRoute from './routes/session.ts';
const ROOT=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const staticTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};
const digest=x=>createHash('sha256').update(x).digest();
export async function createApplication(pool,{origin:configuredOrigin,adminPassword=process.env.ADMIN_PASSWORD,frontendOrigin='https://north-monsoon-atelier.onrender.com'}={}){
 await migrate(pool);configureDatabase(new Database(pool));
 const hits=new Map();
 const allow=(ip,limit)=>{const now=Date.now(),p=hits.get(ip);if(!p||p.until<now){hits.set(ip,{n:1,until:now+60000});if(hits.size>10000){for(const[k,v]of hits)if(v.until<now)hits.delete(k);if(hits.size>10000)hits.delete(hits.keys().next().value)}return true;}p.n++;return p.n<=limit;};
 async function handle(request){const u=new URL(request.url);
  if(u.pathname==='/healthz'){await pool.query('SELECT 1');return json({ok:true});}
  if(u.pathname==='/api/session'&&request.method==='GET')return sessionRoute.GET(request);
  if(u.pathname==='/api/orders'&&['GET','POST'].includes(request.method))return orderRoute[request.method](request);
  if(u.pathname==='/api/admin/login'&&request.method==='POST'){
   const s=await authorize(request);if(!s)return json({error:'请刷新页面后重试。'},403);
   let data;try{data=await request.json()}catch{return json({error:'请求无效。'},400)}
   if(!adminPassword||adminPassword.length<16)return json({error:'管理员口令尚未配置。'},503);
   const id='admin-attempt-'+s.id;const previous=hits.get(id);if(previous&&previous.until>Date.now()&&previous.n>=5)return json({error:'尝试次数较多，请一分钟后重试。'},429);
   if(!allow(id,5))return json({error:'请稍后重试。'},429);
   if(typeof data?.password!=='string'||data.password.length>500||!timingSafeEqual(digest(data.password),digest(adminPassword)))return json({error:'管理员口令不正确。'},403);
   const token=randomBytes(32).toString('hex');await pool.query('INSERT INTO admin_sessions(id,expires) VALUES($1,$2)',[digest(token).toString('hex'),Date.now()+4*3600000]);
   return json({ok:true},200,{'Set-Cookie':`nm_admin=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=14400${u.protocol==='https:'?'; Secure':''}`});
  }
  if(u.pathname==='/api/admin'){
   const token=request.headers.get('cookie')?.match(/(?:^|;\s*)nm_admin=([a-f0-9]{64})(?:;|$)/)?.[1];
   const found=token?await pool.query('SELECT id FROM admin_sessions WHERE id=$1 AND expires>$2',[digest(token).toString('hex'),Date.now()]):null;
   if(!found?.rows.length)return json({error:'请先输入管理员口令。'},403);
   if(request.method==='POST'){
    if(!await authorize(request))return json({error:'请刷新页面后重试。'},403);
    let data;try{data=await request.json()}catch{return json({error:'请求无效。'},400)}
    if(data?.action!=='cancel'||typeof data.id!=='string'||!/^NM-[A-F0-9]{12}$/.test(data.id))return json({error:'订单参数无效。'},400);
    const {rows}=await pool.query("UPDATE orders SET status='cancelled' WHERE id=$1 RETURNING id,status",[data.id]);
    return rows.length?json({order:rows[0]}):json({error:'订单不存在。'},404);
   }
   if(request.method!=='GET')return json({error:'不支持此操作。'},405);
   const {rows}=await pool.query(`SELECT ${publicColumns} FROM orders ORDER BY created_at DESC LIMIT 500`);return json({orders:rows});
  }
  if(u.pathname.startsWith('/api/'))return json({error:'接口不存在。'},404);
  if(!['GET','HEAD'].includes(request.method))return json({error:'不支持此操作。'},405);
  let name=u.pathname==='/'?'/index.html':u.pathname==='/admin'?'/admin.html':u.pathname;
  try{name=decodeURIComponent(name)}catch{return new Response('Not found',{status:404})}
  const path=resolve(ROOT,'.'+name);if(!path.startsWith(ROOT+'/'))return new Response('Not found',{status:404});
  try{const file=await readFile(path);return new Response(request.method==='HEAD'?null:file,{headers:{'Content-Type':staticTypes[extname(path)]||'application/octet-stream','Cache-Control':name.endsWith('.html')?'no-store':'public, max-age=3600','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY'}})}catch{return new Response('Not found',{status:404})}
 }
 const server=createServer(async(req,res)=>{
  try{
   const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',').at(-1).trim();
   if(req.method==='POST'&&!allow('post-'+ip,60)){res.writeHead(429,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'请求较多，请稍后重试。'}));return;}
   const serverOrigin=configuredOrigin||(process.env.PUBLIC_ORIGIN||`${req.headers['x-forwarded-proto']==='https'?'https':'http'}://${req.headers.host}`);
   // The CDN forwards first-party cookies and CSRF headers to this service.
   // Accept only the exact owned frontend origin, while retaining the legacy host.
   const origin=req.headers.origin===frontendOrigin?frontendOrigin:serverOrigin;
   let length=0;const chunks=[];for await(const c of req){length+=c.length;if(length>12000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'内容过长。'}));return;}chunks.push(c);}
   const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v);
   const r=new Request(origin+req.url,{method:req.method,headers,body:chunks.length?Buffer.concat(chunks):undefined});
   const response=await handle(r);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'服务暂时不可用，请稍后重试。'}));console.error('Request failed; inspect database availability.');}
 });
 return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5});
 const server=await createApplication(pool);
 server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.info('Ordering service started'));
 process.on('SIGTERM',()=>server.close(()=>{pool.end().finally(()=>process.exit(0))}));
}
