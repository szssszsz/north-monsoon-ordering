import {useEffect,useRef} from 'react';
import {makeSeeds,vertexSource,fragmentSource,postVertexSource,postFragmentSource} from './particleField';
import {drawSoftwareField} from './particleFallback';

/** One living light field, contained entirely inside the story viewport. */
export default function Atmosphere(){
 const layer=useRef<HTMLDivElement>(null),gpu=useRef<HTMLCanvasElement>(null),software=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const layerNode=layer.current,canvas=gpu.current,backup=software.current;if(!layerNode||!canvas||!backup)return;
  const root:HTMLDivElement=layerNode;
  const host=root.parentElement!,journey=document.getElementById('journey')!;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,premultipliedAlpha:false}),cpu=backup.getContext('2d');
  const small=innerWidth<640,count=small?52000:112000,seeds=makeSeeds(count),fallbackSeeds=seeds.subarray(0,(small?10000:18000)*4);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,dpr=1,targetProgress=0,progress=0,frame=0,paintCount=0,active=false,working=false,disposed=false,clock=0,lastTime=0,lastPaint=0;
  let particles:WebGLProgram|null=null,post:WebGLProgram|null=null,points:WebGLBuffer|null=null,quad:WebGLBuffer|null=null,image:WebGLTexture|null=null,target:WebGLFramebuffer|null=null;
  let particleUniforms:Record<string,WebGLUniformLocation|null>={},postUniforms:Record<string,WebGLUniformLocation|null>={};
  const mode=(webgl:boolean)=>{working=webgl;root.dataset.renderer=webgl?'webgl-flow':'canvas-flow';canvas.hidden=!webgl;backup.hidden=webgl;root.dataset.particles=String(webgl?count:fallbackSeeds.length/4)};
  function destroy(){if(!gl)return;gl.deleteProgram(particles);gl.deleteProgram(post);gl.deleteBuffer(points);gl.deleteBuffer(quad);gl.deleteTexture(image);gl.deleteFramebuffer(target);particles=post=null;points=quad=null;image=null;target=null;}
  function initialise(){
   if(!gl){mode(false);return;}
   const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(error||'Light shader failed')}return shader;};
   const program=(vs:string,fs:string)=>{const v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs),p=gl.createProgram()!;gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error(error||'Light program failed')}return p;};
   particles=program(vertexSource,fragmentSource);post=program(postVertexSource,postFragmentSource);
   points=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
   quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   image=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   target=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,image,0);
   particleUniforms=Object.fromEntries(['uResolution','uProgress','uTime','uDpr'].map(n=>[n,gl.getUniformLocation(particles!,n)]));
   postUniforms=Object.fromEntries(['uImage','uTexel','uProgress'].map(n=>[n,gl.getUniformLocation(post!,n)]));mode(true);
  }
  function schedule(){
   const rect=journey.getBoundingClientRect();active=rect.top<innerHeight&&rect.bottom>0;
   targetProgress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-host.clientHeight)));
   root.dataset.active=String(active);
   if(active&&!document.hidden&&!disposed&&!frame)frame=requestAnimationFrame(draw);
   if(!active){lastTime=0;cancelAnimationFrame(frame);frame=0;}
  }
  function resize(){
   width=host.clientWidth;height=host.clientHeight;dpr=Math.min(devicePixelRatio||1,small?1.5:1.7);
   for(const el of [canvas!,backup!]){el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);}cpu?.setTransform(dpr,0,0,dpr,0,0);
   if(gl&&working){gl.bindTexture(gl.TEXTURE_2D,image);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas!.width,canvas!.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,target);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)mode(false);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
   lastPaint=0;schedule();
  }
  function draw(timestamp:number){
   frame=0;if(!active||document.hidden||disposed)return;
   if(!motion.matches&&timestamp-lastPaint<(working?15:32)){frame=requestAnimationFrame(draw);return;}
   const dt=lastTime?Math.min(.06,(timestamp-lastTime)/1000):1/60;lastTime=timestamp;lastPaint=timestamp;
   clock+=motion.matches?0:dt;progress=motion.matches?targetProgress:progress+(targetProgress-progress)*(1-Math.exp(-dt*9));
   if(Math.abs(progress-targetProgress)<.00001)progress=targetProgress;
   if(gl&&working&&particles&&post){
    gl.viewport(0,0,canvas!.width,canvas!.height);gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.useProgram(particles);
    gl.bindBuffer(gl.ARRAY_BUFFER,points);const seed=gl.getAttribLocation(particles,'aSeed');gl.enableVertexAttribArray(seed);gl.vertexAttribPointer(seed,4,gl.FLOAT,false,0,0);
    gl.uniform2f(particleUniforms.uResolution,width,height);gl.uniform1f(particleUniforms.uProgress,progress);gl.uniform1f(particleUniforms.uTime,clock);gl.uniform1f(particleUniforms.uDpr,dpr);gl.drawArrays(gl.POINTS,0,count);gl.disableVertexAttribArray(seed);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);gl.useProgram(post);gl.bindBuffer(gl.ARRAY_BUFFER,quad);const position=gl.getAttribLocation(post,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,image);gl.uniform1i(postUniforms.uImage,0);gl.uniform2f(postUniforms.uTexel,1/canvas!.width,1/canvas!.height);gl.uniform1f(postUniforms.uProgress,progress);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disableVertexAttribArray(position);
    if(gl.getError()!==gl.NO_ERROR){mode(false);if(cpu)drawSoftwareField(cpu,width,height,progress,fallbackSeeds,clock);}
   }else if(cpu)drawSoftwareField(cpu,width,height,progress,fallbackSeeds,clock);
   root.dataset.state='ready';root.dataset.progress=progress.toFixed(6);root.dataset.time=clock.toFixed(3);root.dataset.frame=String(++paintCount);
   if(!motion.matches)frame=requestAnimationFrame(draw);
  }
  try{initialise()}catch{destroy();mode(false)}resize();
  const visible=()=>{lastTime=0;if(document.hidden){cancelAnimationFrame(frame);frame=0}else schedule()},lost=(e:Event)=>{e.preventDefault();mode(false);schedule()},restored=()=>{destroy();try{initialise();resize()}catch{mode(false);schedule()}};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visible);motion.addEventListener('change',schedule);canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  return()=>{disposed=true;cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visible);motion.removeEventListener('change',schedule);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);destroy()};
 },[]);
 return <div className="wind-art" ref={layer} aria-hidden="true"><canvas ref={gpu}/><canvas ref={software} hidden/></div>;
}
