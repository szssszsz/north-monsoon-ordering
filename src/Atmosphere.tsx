import {useEffect,useRef} from 'react';
import {Compass} from 'lucide-react';

const vertexSource=`
precision highp float;
attribute vec4 aSeed;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uScroll;
uniform float uReveal;
uniform float uDpr;
varying float vLight;
varying float vMist;
const float PI=3.14159265359;
void main(){
 float a=aSeed.x*PI*2.0;
 float strip=aSeed.y*2.0-1.0;
 float flow=a+uTime*.09;
 // A folded ribbon occupies genuine XYZ space; its back folds occlude in perspective.
 float radius=1.25+.19*cos(3.0*flow)+strip*.20;
 vec3 ribbon=vec3(cos(a)*radius, .40*sin(2.0*flow)+strip*.28, sin(a)*radius);
 ribbon.y+=.065*sin(a*9.0+strip*6.0-uTime*.6);
 ribbon.x+=.07*sin(strip*9.0+a*3.0+uTime*.25);
 float latitude=acos(1.0-2.0*aSeed.y);
 vec3 globe=vec3(sin(latitude)*cos(a),cos(latitude),sin(latitude)*sin(a))*1.23;
 vec3 p=mix(ribbon,globe,smoothstep(.02,.8,uScroll)*.72);
 if(aSeed.w>.91){p=globe*(1.18+aSeed.z*.5);p.y+=.14*sin(uTime*.25+a*3.0);}
 vec3 scatter=vec3(sin(aSeed.z*73.0)*3.5,cos(aSeed.y*89.0)*2.5,sin(aSeed.x*91.0)*3.2);
 p=mix(scatter,p,uReveal);
 float ry=uTime*.11+uScroll*2.7+uPointer.x*.28;
 float rx=-.30+uPointer.y*.15+uScroll*.48;
 p.xz=mat2(cos(ry),-sin(ry),sin(ry),cos(ry))*p.xz;
 p.yz=mat2(cos(rx),-sin(rx),sin(rx),cos(rx))*p.yz;
 float rz=-.27+sin(uTime*.12)*.07;
 p.xy=mat2(cos(rz),-sin(rz),sin(rz),cos(rz))*p.xy;
 float depth=4.3-p.z;
 float aspect=uResolution.x/uResolution.y;
 float focal=aspect<.85?2.1:2.65;
 vec2 center=aspect<.85?vec2(.24,.07):vec2(.46,.07);
 vec2 projected=p.xy*focal/vec2(aspect,1.0);
 gl_Position=vec4(projected+center*depth,0.0,depth);
 float size=(1.0+aSeed.z*1.7)*4.0/depth;
 gl_PointSize=clamp(size*uDpr,1.0,6.5*uDpr);
 vLight=(.22+.48*smoothstep(-1.7,1.7,p.z))*(.72+.28*sin(a*5.0+strip*3.0+uTime*.3));
 vMist=aSeed.w>.91?.35:1.0;
}`;
const fragmentSource=`
precision mediump float;
varying float vLight;
varying float vMist;
void main(){
 float r=length(gl_PointCoord-vec2(.5))*2.0;
 if(r>1.0)discard;
 float core=exp(-r*r*6.0);
 vec3 gold=mix(vec3(.69,.43,.15),vec3(1.0,.89,.62),vLight);
 gl_FragColor=vec4(gold,(core*.77+exp(-r*r*2.0)*.09)*vLight*vMist);
}`;

/** Perspective point sculpture. The entire renderer ships with the site. */
export default function Atmosphere(){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const gl=el.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:false,powerPreference:'low-power'});
  let width=0,height=0,dpr=1,frame=0,last=0,elapsed=0,inView=true,lost=false;
  let pointerX=0,pointerY=0,smoothX=0,smoothY=0,progress=0,smoothProgress=0;
  let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null;
  let locations:Record<string,WebGLUniformLocation|null>={};
  const count=innerWidth<640?10000:20000;
  const seeds=new Float32Array(count*4);
  // Even sampling gives the silk its fine continuous grain instead of random clumps.
  for(let i=0;i<count;i++){seeds[i*4]=(i*.61803398875)%1;seeds[i*4+1]=(i*.7548776662)%1;seeds[i*4+2]=Math.random();seeds[i*4+3]=Math.random();}
  let fallback:CanvasRenderingContext2D|null=null;
  const initialise=()=>{
   if(!gl)return;
   const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message||'Particle shader failed');}return shader;};
   const vertex=compile(gl.VERTEX_SHADER,vertexSource),fragment=compile(gl.FRAGMENT_SHADER,fragmentSource);
   program=gl.createProgram()!;gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Particle program failed');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
   const attribute=gl.getAttribLocation(program,'aSeed');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,4,gl.FLOAT,false,0,0);
   locations=Object.fromEntries(['uResolution','uPointer','uTime','uScroll','uReveal','uDpr'].map(n=>[n,gl.getUniformLocation(program!,n)]));
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);
   el.dataset.renderer='webgl';el.dataset.particles=String(count);
  };
  try{if(gl)initialise();else{fallback=el.getContext('2d');el.dataset.renderer='perspective-fallback';}}catch(e){el.dataset.renderer='unavailable';console.warn('Particle renderer could not initialise',e);}
  const updateScroll=()=>{const hero=el.closest('.hero');if(!hero)return;const top=hero.getBoundingClientRect().top;progress=Math.max(0,Math.min(1,-top/height));document.documentElement.style.setProperty('--landscape-shift',`${Math.min(window.scrollY,950)*.12}px`);};
  const resize=()=>{const bounds=el.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);dpr=Math.min(devicePixelRatio||1,innerWidth<640?1.5:1.8);el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);gl?.viewport(0,0,el.width,el.height);fallback?.setTransform(dpr,0,0,dpr,0,0);updateScroll();};
  const pointer=(e:PointerEvent)=>{const b=el.getBoundingClientRect();pointerX=Math.max(-1,Math.min(1,(e.clientX-b.left)/width*2-1));pointerY=Math.max(-1,Math.min(1,(e.clientY-b.top)/height*2-1));};
  const leave=()=>{pointerX=0;pointerY=0};
  const draw=(now:number)=>{
   frame=0;if(document.hidden||!inView||lost)return;
   const dt=Math.min((now-last)/1000||.016,.05);last=now;if(!media.matches)elapsed+=dt;
   smoothX+=(pointerX-smoothX)*.045;smoothY+=(pointerY-smoothY)*.045;smoothProgress+=(progress-smoothProgress)*.065;
   const reveal=media.matches?1:1-Math.pow(1-Math.min(1,elapsed/2.7),3);
   if(gl&&program){gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(locations.uResolution,width,height);gl.uniform2f(locations.uPointer,media.matches?0:smoothX,media.matches?0:smoothY);gl.uniform1f(locations.uTime,elapsed);gl.uniform1f(locations.uScroll,media.matches?0:smoothProgress);gl.uniform1f(locations.uReveal,reveal);gl.uniform1f(locations.uDpr,dpr);gl.drawArrays(gl.POINTS,0,count);el.dataset.state=gl.getError()===gl.NO_ERROR?'ready':'error';}
   else if(fallback){const c=fallback;c.clearRect(0,0,width,height);const a=elapsed*.11+smoothX*.28+smoothProgress*2.7,ca=Math.cos(a),sa=Math.sin(a);for(let i=0;i<1200;i++){const u=seeds[i*4]*Math.PI*2,v=seeds[i*4+1]*2-1,r=1.25+.19*Math.cos(u*3+elapsed*.27)+v*.2;let x=Math.cos(u)*r,z=Math.sin(u)*r;const y=.40*Math.sin(u*2+elapsed*.18)+v*.28;const xx=x*ca-z*sa;z=x*sa+z*ca;x=xx;const depth=4.3-z,scale=Math.min(width*.47,height*.8)/depth;const cx=width<640?width*.62:width*.73;c.fillStyle=`rgba(226,184,109,${.18+(z+1.6)*.15})`;c.beginPath();c.arc(cx+x*scale,height*.47-y*scale,Math.max(.5,2.7/depth),0,Math.PI*2);c.fill();}el.dataset.state='ready';}
   if(!media.matches)frame=requestAnimationFrame(draw);
  };
  const start=()=>{cancelAnimationFrame(frame);frame=0;last=performance.now();if(!document.hidden&&inView&&!lost)frame=requestAnimationFrame(draw)};
  const lostContext=(e:Event)=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);el.dataset.state='context-lost'};
  const restored=()=>{lost=false;try{initialise();resize();start()}catch{el.dataset.state='error'}};
  const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;start()},{rootMargin:'80px'});visibility.observe(el);
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.intro,.section-heading,.menu-card,.reserve-copy,.booking-form,.closing').forEach(node=>{if(node.getBoundingClientRect().top>innerHeight){node.classList.add('reveal');observer.observe(node)}});
  const resizer=new ResizeObserver(()=>{resize();start()});resizer.observe(el);
  resize();start();window.addEventListener('scroll',updateScroll,{passive:true});window.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',start);media.addEventListener('change',start);el.addEventListener('webglcontextlost',lostContext);el.addEventListener('webglcontextrestored',restored);
  return()=>{cancelAnimationFrame(frame);visibility.disconnect();observer.disconnect();resizer.disconnect();window.removeEventListener('scroll',updateScroll);window.removeEventListener('pointermove',pointer);document.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',start);media.removeEventListener('change',start);el.removeEventListener('webglcontextlost',lostContext);el.removeEventListener('webglcontextrestored',restored);if(gl){gl.deleteBuffer(buffer);gl.deleteProgram(program);}document.documentElement.style.removeProperty('--landscape-shift')};
 },[]);
 return <><div className="particle-stage" aria-hidden="true"><canvas ref={canvas} className="particle-canvas"/></div><div className="arrival arrival-3d" aria-hidden="true"><div className="arrival-seal"><Compass size={42} strokeWidth={.8}/><span>北境季风</span><small>A PRIVATE INVITATION</small></div></div></>;
}
