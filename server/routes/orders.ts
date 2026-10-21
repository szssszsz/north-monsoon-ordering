import {json,session,authorize,runtimeEnv,hash,publicColumns,today} from '../runtime.ts';
export const dynamic='force-dynamic';
export async function GET(req:Request){const s=await session(req);if(!s)return json({orders:[]});
 const data=await runtimeEnv.DB.prepare(`SELECT ${publicColumns} FROM orders WHERE session=? ORDER BY created_at DESC LIMIT 100`).bind(s.id).all();return json({orders:data.results});}
export async function POST(req:Request){
 const s=await authorize(req);if(!s)return json({error:'会话已失效，请刷新页面后重试。'},403);
 if(Number(req.headers.get('content-length')||0)>10000)return json({error:'内容过长。'},413);
 let b:any;try{const raw=await req.text();if(raw.length>10000)return json({error:'内容过长。'},413);b=JSON.parse(raw);}catch{return json({error:'请求格式有误。'},400);}
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'请求格式有误。'},400);
 if(b.action==='lookup'){
  if(typeof b.receipt!=='string'||!/^NM-[A-F0-9]{12}\.[a-f0-9]{64}$/.test(b.receipt))return json({error:'请填写完整的订单查询码。'},400);
  const [id,key]=b.receipt.split('.');const order=await runtimeEnv.DB.prepare(`SELECT ${publicColumns} FROM orders WHERE id=? AND access_hash=?`).bind(id,await hash(key)).first();
  return order?json({order}):json({error:'未找到订单，请核对查询码。'},404);
 }
 if(b.action==='cancel'){
  if(typeof b.id!=='string')return json({error:'订单无效。'},400);
  let order=await runtimeEnv.DB.prepare('SELECT id,session,access_hash,status FROM orders WHERE id=?').bind(b.id).first();
  if(!order || (order.session!==s.id && (typeof b.key!=='string'||await hash(b.key)!==order.access_hash)))return json({error:'没有权限操作这笔订单。'},403);
  await runtimeEnv.DB.prepare("UPDATE orders SET status='cancelled' WHERE id=?").bind(b.id).run();return json({ok:true});
 }
 const prior=typeof b.requestId==='string'?await runtimeEnv.DB.prepare(`SELECT ${publicColumns},access_hash FROM orders WHERE session=? AND request_id=?`).bind(s.id,b.requestId).first():null;
 if(prior){if(typeof b.key!=='string'||await hash(b.key)!==prior.access_hash)return json({error:'重复请求无效。'},409);delete prior.access_hash;return json({order:prior,receipt:`${prior.id}.${b.key}`});}
 const count=await runtimeEnv.DB.prepare('SELECT count(*) AS n FROM orders WHERE session=? AND created_at>?').bind(s.id,Date.now()-3600000).first();
 if((count?.n||0)>=10)return json({error:'本小时提交次数较多，请稍后再试。'},429);
 const validDate=typeof b.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.date)&&!Number.isNaN(Date.parse(b.date))&&new Date(b.date).toISOString().slice(0,10)===b.date;
 const validTime=typeof b.time==='string'&&/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(b.time);
 const when=validDate&&validTime?Date.parse(`${b.date}T${b.time}:00+08:00`):NaN;
 const list=Array.isArray(b.items)?b.items:[];
 if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>40||!Number.isInteger(b.guests)||b.guests<1||b.guests>12||!validDate||!validTime||b.date<today()||when<Date.now()||when>Date.now()+90*86400000||list.length<1||list.length>3||new Set(list).size!==list.length||list.some((v:any)=>!['mist','wind','cloud'].includes(v))||typeof b.note!=='string'||b.note.length>300||typeof b.key!=='string'||!/^[a-f0-9]{64}$/.test(b.key)||typeof b.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(b.requestId))return json({error:'请检查称呼、未来90天内的时间、1–12位人数和至少一道料理。'},400);
 const id='NM-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase(),created=Date.now();
 try{await runtimeEnv.DB.prepare('INSERT INTO orders(id,session,request_id,access_hash,name,date,time,guests,items,note,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,s.id,b.requestId,await hash(b.key),b.name.trim(),b.date,b.time,b.guests,JSON.stringify(list),b.note.trim(),'confirmed',created).run();}catch(e){
  const p=await runtimeEnv.DB.prepare(`SELECT ${publicColumns},access_hash FROM orders WHERE session=? AND request_id=?`).bind(s.id,b.requestId).first();
  if(p&&p.access_hash===await hash(b.key)){delete p.access_hash;return json({order:p,receipt:`${p.id}.${b.key}`});}throw e;
 }
 const order=await runtimeEnv.DB.prepare(`SELECT ${publicColumns} FROM orders WHERE id=?`).bind(id).first();return json({order,receipt:`${id}.${b.key}`},201);
}
