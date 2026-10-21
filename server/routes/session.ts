import {json,session,randomKey,runtimeEnv} from '../runtime.ts';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const current=await session(req);if(current)return json({csrf:current.csrf});
 const id=randomKey(),csrf=randomKey();
 await runtimeEnv.DB.prepare('INSERT INTO sessions(id,csrf,created_at) VALUES(?,?,?)').bind(id,csrf,Date.now()).run();
 return json({csrf},200,{'Set-Cookie':`nm_session=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(req.url).protocol==='https:'?'; Secure':''}`});
}
