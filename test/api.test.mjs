import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {newDb} from 'pg-mem';
import {createApplication} from '../server/index.mjs';

test('full booking lifecycle, isolation, validation, idempotency and admin access',async()=>{
 const db=newDb({noAstCoverageCheck:true}),{Pool}=db.adapters.createPg(),pool=new Pool();
 const password=randomBytes(32).toString('hex');
 const server=await createApplication(pool,{adminPassword:password});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 function client(){const cookies=new Map();return async(path,body,csrf,origin=base)=>{
  const headers={Origin:origin,Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')};
  if(body!==undefined){headers['Content-Type']='application/json';headers['X-CSRF-Token']=csrf||'';}
  const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});
  for(const c of r.headers.getSetCookie()){const[k,v]=c.split(';')[0].split('=');cookies.set(k,v)}
  return {status:r.status,data:await r.json()};
 };}
 try{
  const a=client(),b=client(),{data:{csrf}}=await a('/api/session'),{data:{csrf:csrfB}}=await b('/api/session');
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
  const payload={name:'自动化测试',date,time:'12:00',guests:2,items:['mist','wind','cloud'],note:'测试',requestId:randomUUID(),key:randomBytes(32).toString('hex')};
  assert.equal((await a('/api/orders',payload,'bad')).status,403);
  assert.equal((await a('/api/orders',payload,csrf,'https://example.invalid')).status,403);
  const created=await a('/api/orders',payload,csrf);assert.equal(created.status,201,JSON.stringify(created));
  const {id}=created.data.order,receipt=created.data.receipt;
  assert.equal((await a('/api/orders',payload,csrf)).data.order.id,id);
  assert.equal((await a('/api/orders')).data.orders.length,1);
  assert.equal((await b('/api/orders')).data.orders.length,0);
  assert.equal((await b('/api/orders',{action:'cancel',id},csrfB)).status,403);
  assert.equal((await b('/api/orders',{action:'lookup',receipt},csrfB)).data.order.id,id);
  assert.equal((await b('/api/orders',{action:'lookup',receipt:id+'.'+'0'.repeat(64)},csrfB)).status,404);
  for(const patch of [{items:['fake']},{guests:0},{date:'2026-02-30'},{guests:13}]){
   assert.equal((await a('/api/orders',{...payload,...patch,requestId:randomUUID()},csrf)).status,400);
  }
  assert.equal((await a('/api/orders',null,csrf)).status,400);
  assert.equal((await a('/api/admin')).status,403);
  assert.equal((await a('/api/admin/login',{password:'wrong'},csrf)).status,403);
  assert.equal((await a('/api/admin/login',{password},csrf)).status,200);
  assert.equal((await a('/api/admin')).data.orders.length,1);
  assert.equal((await b('/api/admin')).status,403);
  assert.equal((await b('/api/orders',{action:'cancel',id,key:payload.key},csrfB)).status,200);
  assert.equal((await a('/api/orders')).data.orders[0].status,'cancelled');
  const secondApp=await createApplication(pool,{adminPassword:password});await new Promise(r=>secondApp.listen(0,'127.0.0.1',r));
  assert.equal((await pool.query('SELECT status FROM orders WHERE id=$1',[id])).rows[0].status,'cancelled');
  await new Promise(r=>secondApp.close(r));
  assert.equal((await a('/healthz')).status,200);
  const image=await fetch(base+'/images/landscape.webp');assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');
  const extra=await a('/api/orders',{...payload,requestId:randomUUID(),key:randomBytes(32).toString('hex')},csrf);
  assert.equal(extra.status,201);const adminAction={action:'cancel',id:extra.data.order.id};
  assert.equal((await b('/api/admin',adminAction,csrfB)).status,403);
  assert.equal((await a('/api/admin',adminAction,'wrong')).status,403);
  assert.equal((await a('/api/admin',null,csrf)).status,400);
  assert.equal((await a('/api/admin',adminAction,csrf)).status,200);
  assert.equal((await pool.query('SELECT status FROM orders WHERE id=$1',[adminAction.id])).rows[0].status,'cancelled');
 }finally{await new Promise(r=>server.close(r));await pool.end();}
});
