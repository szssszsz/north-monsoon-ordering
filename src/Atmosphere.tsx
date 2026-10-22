import {useEffect,useRef} from 'react';
import {shape,palette,morphWeight,vertexSource,fragmentSource} from './particleModel';

/** One on-demand paint per scroll/layout change. Idle and pointer movement never advance the scene. */
export default function Atmosphere(){
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const canvasNode=canvas.current,stageNode=stage.current;if(!canvasNode||!stageNode)return;
  const el:HTMLCanvasElement=canvasNode,layer:HTMLDivElement=stageNode;
  const gl=el.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:false,powerPreference:'low-power'});
  let width=innerWidth,height=innerHeight,dpr=1,frame=0,active=false,lost=false,scene=0,travel=0,paintCount=0,lastKey='';
  const placement=[0,-.20,.72,1];
  let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null;
  let uniforms:Record<string,WebGLUniformLocation|null>={};
  const count=innerWidth<640?20000:36000,seeds=new Float32Array(count*4);
  for(let i=0;i<count;i++){seeds[i*4]=(i*.61803398875)%1;seeds[i*4+1]=(i*.7548776662)%1;seeds[i*4+2]=(i*.569840291)%1;seeds[i*4+3]=(i*.438579021)%1;}
  let fallback:CanvasRenderingContext2D|null=null;
  const initialise=()=>{
   if(!gl)return;
   const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const reason=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(reason||'Particle shader failed')}return shader};
   const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
   program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Particle program failed');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
   const index=gl.getAttribLocation(program,'aSeed');gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,4,gl.FLOAT,false,0,0);
   uniforms=Object.fromEntries(['uResolution','uPlacement','uScroll','uScene','uDpr'].map(n=>[n,gl.getUniformLocation(program!,n)]));
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);el.dataset.renderer='webgl';el.dataset.particles=String(count);
  };
  try{if(gl)initialise();else{fallback=el.getContext('2d');el.dataset.renderer='perspective-fallback';el.dataset.particles=String(innerWidth<640?5000:10000)}}catch(e){el.dataset.renderer='unavailable';console.warn('Particle renderer could not initialise',e)}
  const updateLayout=(force=false)=>{
   const portrait=width/height<.85;
   let mode='quiet',top=0,bottom=height,left=0,right=width;active=false;scene=0;travel=0;
   const hero=document.querySelector('.hero')?.getBoundingClientRect(),journey=document.getElementById('journey')?.getBoundingClientRect(),seal=document.querySelector('.reservation-particle-window')?.getBoundingClientRect();
   if(journey&&journey.top<height*.42&&journey.bottom>height*.35){
    mode='journey';active=true;top=Math.max(0,journey.top);bottom=Math.min(height,journey.bottom);
    scene=Math.max(0,Math.min(5,-journey.top/Math.max(1,journey.height-height)*5));travel=scene;
    const ys=[-.28,-.12,-.19,-.12,-.28,-.10],sizes=[.77,.84,.83,.83,.83,.74],i=Math.min(4,Math.floor(scene)),f=scene-i;
    placement[0]=0;placement[1]=ys[i]*(1-f)+ys[i+1]*f;placement[2]=portrait?.48:sizes[i]*(1-f)+sizes[i+1]*f;placement[3]=1;
   }else if(hero&&hero.bottom>80&&hero.top<height){
    mode='hero';active=true;top=Math.max(0,hero.top);bottom=Math.min(height,hero.bottom);travel=Math.max(0,Math.min(.45,-hero.top/height*.45));
    placement[0]=portrait?.12:.47;placement[1]=portrait?-.15:-.03;placement[2]=portrait?.55:.73;placement[3]=.92;
   }else if(seal&&seal.bottom>80&&seal.top<height){
    mode='seal';active=true;scene=5;travel=5+(height*.5-seal.top)/height*.25;
    top=Math.max(0,seal.top);bottom=Math.min(height,seal.bottom);left=Math.max(0,seal.left);right=Math.min(width,seal.right);
    placement[0]=(seal.left+seal.width*.5)/width*2-1;placement[1]=1-(seal.top+seal.height*.5)/height*2;placement[2]=Math.min(seal.width,seal.height)*.64*4.6/(height*2.7);placement[3]=.82;
   }
   layer.dataset.mode=mode;el.dataset.scene=scene.toFixed(5);el.dataset.scrollCoordinate=travel.toFixed(5);
   layer.style.clipPath=`inset(${top}px ${Math.max(0,width-right)}px ${Math.max(0,height-bottom)}px ${left}px)`;
   document.documentElement.style.setProperty('--landscape-shift',`${Math.min(scrollY,950)*.12}px`);
   const tint=[0,0,0];palette(Math.floor(scene),.35,tint);layer.style.setProperty('--particle-tint',`rgba(${tint.map(x=>Math.round(x*255)).join(',')},.055)`);
   const key=[mode,width,height,dpr,scene,travel,...placement].join('|');
   if(active&&!document.hidden&&!lost&&(force||key!==lastKey)){lastKey=key;if(!frame)frame=requestAnimationFrame(draw)}
  };
  const resize=()=>{width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,innerWidth<640?1.4:1.7);el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);gl?.viewport(0,0,el.width,el.height);fallback?.setTransform(dpr,0,0,dpr,0,0);updateLayout(true)};
  const p=[0,0,0],q=[0,0,0],ca=[0,0,0],cb=[0,0,0];
  function draw(){
   frame=0;if(document.hidden||!active||lost)return;
   if(gl&&program){
    gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(uniforms.uResolution,width,height);gl.uniform4f(uniforms.uPlacement,placement[0],placement[1],placement[2],placement[3]);
    gl.uniform1f(uniforms.uScene,scene);gl.uniform1f(uniforms.uScroll,travel);gl.uniform1f(uniforms.uDpr,dpr);gl.drawArrays(gl.POINTS,0,count);
    el.dataset.state=gl.getError()===gl.NO_ERROR?'ready':'error';
   }else if(fallback){
    const c=fallback;c.clearRect(0,0,width,height);
    const amount=innerWidth<640?5000:10000,spin=.08+Math.sin(travel*.78)*.26,tilt=-.26+Math.sin(travel*.65)*.065,roll=Math.sin(travel*.9)*.035,cx=Math.cos(spin),sx=Math.sin(spin),cy=Math.cos(tilt),sy=Math.sin(tilt),cz=Math.cos(roll),sz=Math.sin(roll),index=Math.floor(scene),f=morphWeight(scene);
    const buckets:{x:number;y:number;r:number}[][]=Array.from({length:64},()=>[]);
    for(let i=0;i<amount;i++){
     const u=seeds[i*4],v=seeds[i*4+1],seed=seeds[i*4+2],w=seeds[i*4+3];shape(index,u,v,w,travel,p);shape(Math.min(5,index+1),u,v,w,travel,q);
     let x=p[0]*(1-f)+q[0]*f,y=p[1]*(1-f)+q[1]*f,z=p[2]*(1-f)+q[2]*f;
     const xx=cx*x+sx*z;z=-sx*x+cx*z;x=xx;const yy=cy*y+sy*z;z=-sy*y+cy*z;y=yy;const xr=cz*x+sz*y;y=-sz*x+cz*y;x=xr;
     x*=placement[2];y*=placement[2];z*=placement[2];const depth=4.6-z;
     const screenX=(x*2.7/(width/height)/depth+placement[0]+1)*width*.5,screenY=(1-y*2.7/depth-placement[1])*height*.5;
     if(depth<.4||screenX< -10||screenX>width+10||screenY< -10||screenY>height+10)continue;
     const light=Math.max(0,Math.min(7,Math.floor((z+2)*2))),tint=((v*.61+u*.24+w*.23)%1),color=Math.min(7,Math.floor(tint*8));
     buckets[color*8+light].push({x:screenX,y:screenY,r:Math.max(.58,(1.1+seed*1.8)*2.7/depth)});
    }
    c.globalCompositeOperation='lighter';
    buckets.forEach((points,k)=>{
     if(!points.length)return;const shade=k%8,color=Math.floor(k/8)/7;palette(index,color,ca);palette(Math.min(5,index+1),color,cb);const rgb=ca.map((v,n)=>Math.round((v*(1-f)+cb[n]*f)*255)).join(',');
     c.fillStyle=`rgba(${rgb},${(.32+shade*.051)*placement[3]})`;c.beginPath();for(const p of points){c.moveTo(p.x+p.r,p.y);c.arc(p.x,p.y,p.r,0,Math.PI*2)}c.fill();
     c.fillStyle=`rgba(${rgb},${(.019+shade*.002)*placement[3]})`;c.beginPath();for(let i=0;i<points.length;i+=6){const p=points[i];c.moveTo(p.x+p.r*3.2,p.y);c.arc(p.x,p.y,p.r*3.2,0,Math.PI*2)}c.fill();
    });
    c.globalCompositeOperation='source-over';el.dataset.state='ready';
   }
   el.dataset.frame=String(++paintCount);
  }
  const onScroll=()=>updateLayout(),onVisible=()=>{if(!document.hidden)updateLayout(true)};
  const lostContext=(e:Event)=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;el.dataset.state='context-lost'};
  const restored=()=>{lost=false;try{initialise();resize()}catch{el.dataset.state='error'}};
  resize();window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',onVisible);el.addEventListener('webglcontextlost',lostContext);el.addEventListener('webglcontextrestored',restored);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVisible);el.removeEventListener('webglcontextlost',lostContext);el.removeEventListener('webglcontextrestored',restored);if(gl){gl.deleteBuffer(buffer);gl.deleteProgram(program)}document.documentElement.style.removeProperty('--landscape-shift')};
 },[]);
 return <div ref={stage} className="particle-stage monsoon-experience" data-mode="quiet" aria-hidden="true"><canvas ref={canvas} className="particle-canvas"/></div>;
}
