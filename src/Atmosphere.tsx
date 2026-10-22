import {useEffect,useRef,useState} from 'react';
import {Compass,X} from 'lucide-react';
import {shape,vertexSource,fragmentSource} from './particleModel';

export default function Atmosphere(){
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),finish=useRef<(()=>void)|null>(null);
 const [introVisible,setIntroVisible]=useState(true);
 useEffect(()=>{
  const canvasNode=canvas.current,stageNode=stage.current;if(!canvasNode||!stageNode)return;
  const el:HTMLCanvasElement=canvasNode,layer:HTMLDivElement=stageNode;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const gl=el.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:false,powerPreference:'low-power'});
  const born=performance.now();
  let width=innerWidth,height=innerHeight,dpr=1,frame=0,last=0,lastPaint=0,elapsed=0,active=true,lost=false,intro=true;
  let pointerX=0,pointerY=0,smoothX=0,smoothY=0,targetScene=0,scene=0;
  const placement=[0,-.20,.72,1],target=[0,-.20,.72,1];
  let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null;
  let uniforms:Record<string,WebGLUniformLocation|null>={};
  const count=innerWidth<640?14000:24000,seeds=new Float32Array(count*4);
  for(let i=0;i<count;i++){seeds[i*4]=(i*.61803398875)%1;seeds[i*4+1]=(i*.7548776662)%1;seeds[i*4+2]=Math.random();seeds[i*4+3]=Math.random();}
  let fallback:CanvasRenderingContext2D|null=null;
  const initialise=()=>{
   if(!gl)return;
   const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const reason=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(reason||'Particle shader failed')}return shader};
   const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
   program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Particle program failed');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
   const index=gl.getAttribLocation(program,'aSeed');gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,4,gl.FLOAT,false,0,0);
   uniforms=Object.fromEntries(['uResolution','uPointer','uPlacement','uTime','uScene','uReveal','uDpr'].map(n=>[n,gl.getUniformLocation(program!,n)]));
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);el.dataset.renderer='webgl';el.dataset.particles=String(count);
  };
  try{if(gl)initialise();else{fallback=el.getContext('2d');el.dataset.renderer='perspective-fallback';el.dataset.particles=String(innerWidth<640?3800:7600)}}catch(e){el.dataset.renderer='unavailable';console.warn('Particle renderer could not initialise',e)}
  const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const updateLayout=()=>{
   const portrait=width/height<.85;
   let mode='quiet',top=0,bottom=height;active=false;targetScene=0;
   if(intro){mode='intro';active=true;target[0]=0;target[1]=-.20;target[2]=portrait?.49:.72;target[3]=1;}
   else{
    const hero=document.querySelector('.hero')?.getBoundingClientRect(),journey=document.getElementById('journey')?.getBoundingClientRect();
    if(journey&&journey.top<height*.42&&journey.bottom>height*.35){
     mode='journey';active=true;top=Math.max(0,journey.top);bottom=Math.min(height,journey.bottom);
     targetScene=Math.max(0,Math.min(3,-journey.top/Math.max(1,journey.height-height)*3));
     const i=Math.min(2,Math.floor(targetScene)),f=targetScene-i,ys=[-.28,-.12,-.32,-.12];target[0]=0;target[1]=ys[i]*(1-f)+ys[i+1]*f;target[2]=portrait?.49:(targetScene>2?.80-(targetScene-2)*.08:.80);target[3]=1;
    }else if(hero&&hero.bottom>80&&hero.top<height){
     mode='hero';active=true;top=Math.max(0,hero.top);bottom=Math.min(height,hero.bottom);
     target[0]=portrait?.12:.48;target[1]=portrait?-.12:.02;target[2]=portrait?.63:.81;target[3]=portrait?.9:.95;
    }
   }
   layer.dataset.mode=mode;el.dataset.scene=String(Math.round(targetScene*100)/100);
   layer.style.clipPath=mode==='intro'?'none':`inset(${top}px 0 ${Math.max(0,height-bottom)}px)`;
   document.documentElement.style.setProperty('--landscape-shift',`${Math.min(scrollY,950)*.12}px`);
   if(active&&!frame&&!document.hidden&&!lost){last=performance.now();frame=requestAnimationFrame(draw)}
  };
  const resize=()=>{width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,innerWidth<640?1.4:1.7);el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);gl?.viewport(0,0,el.width,el.height);fallback?.setTransform(dpr,0,0,dpr,0,0);updateLayout()};
  const pointer=(e:PointerEvent)=>{pointerX=e.clientX/width*2-1;pointerY=e.clientY/height*2-1};
  const leave=()=>{pointerX=0;pointerY=0};
  const p=[0,0,0],q=[0,0,0];
  function draw(now:number){
   frame=0;if(document.hidden||!active||lost)return;
   if(fallback&&!media.matches&&now-lastPaint<32){frame=requestAnimationFrame(draw);return}lastPaint=now;
   const dt=Math.min((now-last)/1000||.016,.06);last=now;if(!media.matches)elapsed=intro?(now-born)/1000:elapsed+dt;
   smoothX+=(pointerX-smoothX)*.05;smoothY+=(pointerY-smoothY)*.05;if(intro&&!media.matches)targetScene=Math.max(0,Math.min(3,(elapsed-1.2)/1.15));scene=media.matches?targetScene:scene+(targetScene-scene)*.075;
   for(let i=0;i<4;i++)placement[i]+=(target[i]-placement[i])*.075;
   if(media.matches)for(let i=0;i<4;i++)placement[i]=target[i];
   const reveal=media.matches?1:1-Math.pow(1-Math.min(1,elapsed/1.1),3);
   if(gl&&program){
    gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(uniforms.uResolution,width,height);gl.uniform2f(uniforms.uPointer,media.matches?0:smoothX,media.matches?0:smoothY);
    gl.uniform4f(uniforms.uPlacement,placement[0],placement[1],placement[2],placement[3]);gl.uniform1f(uniforms.uScene,scene);gl.uniform1f(uniforms.uTime,elapsed);gl.uniform1f(uniforms.uReveal,reveal);gl.uniform1f(uniforms.uDpr,dpr);gl.drawArrays(gl.POINTS,0,count);
    if(el.dataset.state!=='ready')el.dataset.state=gl.getError()===gl.NO_ERROR?'ready':'error';
   }else if(fallback){
    const c=fallback;c.clearRect(0,0,width,height);
    const amount=innerWidth<640?3800:7600,spin=.15+Math.sin(elapsed*.17)*.21+smoothX*.22,tilt=-.24+smoothY*.12,cx=Math.cos(spin),sx=Math.sin(spin),cy=Math.cos(tilt),sy=Math.sin(tilt),index=Math.floor(scene);
    let f=scene-index;f=f*f*(3-2*f);
    const buckets:{x:number;y:number;r:number}[][]=Array.from({length:12},()=>[]);
    for(let i=0;i<amount;i++){
     const u=seeds[i*4],v=seeds[i*4+1],seed=seeds[i*4+2],w=seeds[i*4+3];
     shape(index,u,v,w,elapsed,p);shape(Math.min(3,index+1),u,v,w,elapsed,q);
     let x=(p[0]*(1-f)+q[0]*f)*reveal+Math.sin(seed*73)*3.5*(1-reveal),y=(p[1]*(1-f)+q[1]*f)*reveal+Math.cos(v*89)*2.5*(1-reveal),z=(p[2]*(1-f)+q[2]*f)*reveal+Math.sin(u*91)*3.2*(1-reveal);
     const xx=cx*x+sx*z;z=-sx*x+cx*z;x=xx;const yy=cy*y+sy*z;z=-sy*y+cy*z;y=yy;
     x*=placement[2];y*=placement[2];z*=placement[2];const depth=4.4-z;
     const screenX=(x*2.7/(width/height)/depth+placement[0]+1)*width*.5,screenY=(1-y*2.7/depth-placement[1])*height*.5;
     if(depth<.4||screenX< -10||screenX>width+10||screenY< -10||screenY>height+10)continue;
     const bucket=Math.max(0,Math.min(11,Math.floor((z+2)*3)));buckets[bucket].push({x:screenX,y:screenY,r:Math.max(.65,(1.25+seed*1.8)*2.65/depth)});
    }
    c.globalCompositeOperation='lighter';
    buckets.forEach((points,index)=>{c.fillStyle=`rgba(250,200,118,${(.28+index*.043)*placement[3]})`;c.beginPath();for(const p of points){c.moveTo(p.x+p.r,p.y);c.arc(p.x,p.y,p.r,0,Math.PI*2)}c.fill();c.fillStyle=`rgba(233,173,66,${(.017+index*.0018)*placement[3]})`;c.beginPath();for(let i=0;i<points.length;i+=5){const p=points[i];c.moveTo(p.x+p.r*3,p.y);c.arc(p.x,p.y,p.r*3,0,Math.PI*2)}c.fill()});
    c.globalCompositeOperation='source-over';if(el.dataset.state!=='ready')el.dataset.state='ready';
   }
   if(!media.matches)frame=requestAnimationFrame(draw);
  }
  const start=()=>{cancelAnimationFrame(frame);frame=0;last=performance.now();updateLayout()};
  const finishIntro=()=>{if(!intro)return;intro=false;setIntroVisible(false);document.body.style.overflow=oldOverflow;updateLayout();start()};
  finish.current=finishIntro;const timer=setTimeout(finishIntro,media.matches?1500:5200);
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')finishIntro();if(intro&&e.key==='Tab'){e.preventDefault();document.querySelector<HTMLButtonElement>('.monsoon-intro-foot button')?.focus({preventScroll:true})}};
  const lostContext=(e:Event)=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);el.dataset.state='context-lost'};
  const restored=()=>{lost=false;try{initialise();resize();start()}catch{el.dataset.state='error'}};
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.intro,.section-heading,.menu-card,.reserve-copy,.booking-form,.closing').forEach(node=>{if(node.getBoundingClientRect().top>innerHeight){node.classList.add('reveal');observer.observe(node)}});
  resize();start();window.addEventListener('scroll',updateLayout,{passive:true});window.addEventListener('resize',resize);window.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',start);window.addEventListener('keydown',key);media.addEventListener('change',start);el.addEventListener('webglcontextlost',lostContext);el.addEventListener('webglcontextrestored',restored);
  return()=>{clearTimeout(timer);finish.current=null;cancelAnimationFrame(frame);observer.disconnect();document.body.style.overflow=oldOverflow;window.removeEventListener('scroll',updateLayout);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',pointer);document.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',start);window.removeEventListener('keydown',key);media.removeEventListener('change',start);el.removeEventListener('webglcontextlost',lostContext);el.removeEventListener('webglcontextrestored',restored);if(gl){gl.deleteBuffer(buffer);gl.deleteProgram(program)}document.documentElement.style.removeProperty('--landscape-shift')};
 },[]);
 return <><div ref={stage} className="particle-stage monsoon-experience" data-mode="intro" aria-hidden="true"><canvas ref={canvas} className="particle-canvas"/></div>{introVisible&&<div className="monsoon-intro" role="dialog" aria-modal="true" aria-label="北境季风山河入场"><div className="monsoon-intro-brand"><Compass size={27} strokeWidth={1}/><span>北境季风<small>NORTH MONSOON · PRIVATE DINING</small></span></div><p className="monsoon-intro-line">风起山河，珍藏入席。</p><div className="monsoon-intro-foot"><span>将整个天地，纳入一席。</span><button autoFocus onClick={()=>finish.current?.()}>进入盛宴 <X size={14}/></button></div></div>}</>;
}
