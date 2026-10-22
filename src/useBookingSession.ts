import {useCallback,useEffect,useRef,useState} from 'react';
import {openBookingSession} from './bookingSession';
export default function useBookingSession(){
 const [session,setSession]=useState<{csrf:string;state:'connecting'|'ready'|'error'}>({csrf:'',state:'connecting'}),active=useRef<AbortController|null>(null);
 const retry=useCallback(()=>{
  active.current?.abort();const controller=new AbortController();active.current=controller;setSession({csrf:'',state:'connecting'});
  openBookingSession(controller.signal).then(csrf=>{if(!controller.signal.aborted)setSession({csrf,state:'ready'})}).catch(()=>{if(!controller.signal.aborted)setSession({csrf:'',state:'error'})});
 },[]);
 useEffect(()=>{retry();return()=>active.current?.abort()},[retry]);
 return {...session,retry};
}
