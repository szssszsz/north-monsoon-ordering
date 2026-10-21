import {useEffect,useRef} from 'react';
import {Compass} from 'lucide-react';

/** A single lightweight canvas, with no network assets or interaction interception. */
export default function Atmosphere(){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,frame=0,last=0,scroll=window.scrollY,velocity=0,px=-1000,py=-1000;
  let motes:{x:number;y:number;r:number;phase:number;speed:number}[]=[];
  const resize=()=>{width=window.innerWidth;height=window.innerHeight;const dpr=Math.min(window.devicePixelRatio||1,1.7);el.width=width*dpr;el.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);motes=Array.from({length:width<640?48:100},()=>({x:Math.random()*width,y:Math.random()*height,r:.45+Math.random()*1.4,phase:Math.random()*Math.PI*2,speed:.2+Math.random()*.6}));};
  const onScroll=()=>{const next=window.scrollY;velocity=Math.max(-24,Math.min(24,(next-scroll)*.18));scroll=next;};
  const pointer=(e:PointerEvent)=>{if(e.pointerType==='mouse'){px=e.clientX;py=e.clientY}};
  const leave=()=>{px=-1000;py=-1000};
  const draw=(now:number)=>{frame=0;if(media.matches||document.hidden)return;const dt=Math.min((now-last)/16.67||1,2);last=now;ctx.clearRect(0,0,width,height);velocity*=.94;
   const t=now*.00025;
   for(const p of motes){p.x+=(Math.sin(t+p.phase)*.16+p.speed*.22+velocity*.13)*dt;p.y-=(p.speed*.28+velocity*.48)*dt;
    const dx=p.x-px,dy=p.y-py,d=Math.hypot(dx,dy);if(d<130&&d>0){p.x+=dx/d*(1-d/130)*1.5*dt;p.y+=dy/d*(1-d/130)*1.5*dt;}
    if(p.x>width+12)p.x=-12;if(p.x< -12)p.x=width+12;if(p.y< -12)p.y=height+12;if(p.y>height+12)p.y=-12;
    const alpha=.18+(Math.sin(t*2+p.phase)+1)*.19;ctx.fillStyle=`rgba(211,174,107,${alpha})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    if(p.r>1.5){ctx.fillStyle=`rgba(227,198,142,${alpha*.08})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r*5,0,Math.PI*2);ctx.fill();}
   }
   document.documentElement.style.setProperty('--landscape-shift',`${Math.min(scroll,950)*.12}px`);
   frame=requestAnimationFrame(draw);
  };
  const start=()=>{cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,width,height);if(!media.matches&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw)}};
  resize();start();window.addEventListener('resize',resize);window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',start);media.addEventListener('change',start);
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.intro,.section-heading,.menu-card,.reserve-copy,.booking-form,.closing').forEach((node)=>{if(node.getBoundingClientRect().top>height){node.classList.add('reveal');observer.observe(node)}});
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('scroll',onScroll);window.removeEventListener('pointermove',pointer);document.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',start);media.removeEventListener('change',start);document.documentElement.style.removeProperty('--landscape-shift')};
 },[]);
 return <><canvas ref={canvas} className="atmosphere" aria-hidden="true"/><div className="arrival" aria-hidden="true"><div className="arrival-seal"><Compass size={42} strokeWidth={.8}/><span>北境季风</span><small>A PRIVATE INVITATION</small></div></div></>;
}
