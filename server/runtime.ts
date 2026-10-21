import {randomBytes} from 'node:crypto';
let database:any;
export function configureDatabase(db:any){database=db;}
export const runtimeEnv={get DB(){if(!database)throw new Error('Database not initialized');return database;}};
export function json(data: unknown, status=200, extra: Record<string,string>={}) {
 return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
}
export function cookie(req:Request) { return req.headers.get('cookie')?.match(/(?:^|;\s*)nm_session=([a-f0-9]{64})(?:;|$)/)?.[1]; }
export function randomKey(){ return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join(''); }
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
export async function session(req:Request){const id=cookie(req);if(!id)return null;return runtimeEnv.DB.prepare('SELECT id, csrf FROM sessions WHERE id=?').bind(id).first();}
export async function authorize(req:Request){
 const origin=req.headers.get('origin');const host=new URL(req.url).origin;
 if(origin!==host || !req.headers.get('content-type')?.startsWith('application/json'))return null;
 const s=await session(req);if(!s || req.headers.get('x-csrf-token')!==s.csrf)return null;return s;
}
export const publicColumns='id,name,date,time,guests,items,note,status,created_at';
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
