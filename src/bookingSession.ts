type Options={request?:typeof fetch;maxMs?:number;requestMs?:number;retryMs?:number};
const aborted=()=>new DOMException('Request cancelled','AbortError');
function pause(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(aborted());return;}const stop=()=>{clearTimeout(timer);signal.removeEventListener('abort',stop);reject(aborted())};const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve()},ms);signal.addEventListener('abort',stop,{once:true})});}

// A bounded connection attempt made only when a visitor opens the site or retries.
// This tolerates the host's temporary HTML response without keeping a server awake.
export async function openBookingSession(signal:AbortSignal,{request=fetch,maxMs=100000,requestMs=15000,retryMs=2000}:Options={}){
 const deadline=Date.now()+maxMs;
 while(Date.now()<deadline){
  if(signal.aborted)throw aborted();
  const attempt=new AbortController(),stop=()=>attempt.abort(),timer=setTimeout(stop,Math.min(requestMs,deadline-Date.now()));signal.addEventListener('abort',stop,{once:true});
  try{
   const response=await request('/api/session',{cache:'no-store',signal:attempt.signal});
   if(response.ok&&response.headers.get('content-type')?.includes('application/json')){const data=await response.json();if(typeof data.csrf==='string'&&data.csrf.length)return data.csrf as string;}
  }catch{if(signal.aborted)throw aborted();}
  finally{clearTimeout(timer);signal.removeEventListener('abort',stop);}
  const remaining=deadline-Date.now();if(remaining>0)await pause(Math.min(retryMs,remaining),signal);
 }
 throw Error('Reservation connection unavailable');
}
