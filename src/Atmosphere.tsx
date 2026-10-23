import {useEffect,useRef} from 'react';
import {makeSeeds,vertexSource,fragmentSource,postVertexSource,postFragmentSource} from './particleField';
import {drawSoftwareField} from './particleFallback';
import {loadArtistAtlas} from './artistAtlas';
import type {ArtistAtlas} from './particleField';

/** Lives inside the journey viewport, so it cannot appear on the welcome or booking. */
export default function Atmosphere(){
 const layer=useRef<HTMLDivElement>(null),gpu=useRef<HTMLCanvasElement>(null),software=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const layerNode=layer.current,gpuNode=gpu.current,softwareNode=software.current;if(!layerNode||!gpuNode||!softwareNode)return;
  const root:HTMLDivElement=layerNode,canvas:HTMLCanvasElement=gpuNode,backup:HTMLCanvasElement=softwareNode;
  const host=root.parentElement!,journey=document.getElementById('journey')!;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,premultipliedAlpha:false});
  const cpu=backup.getContext('2d'),small=innerWidth<640,count=small?132000:220000,seeds=makeSeeds(count),fallbackSeeds=seeds.subarray(0,(small?38000:72000)*4);
  let width=0,height=0,dpr=1,progress=0,frame=0,paintCount=0,active=false,lastKey='',working=false,ready=false,disposed=false;
  let atlas:ArtistAtlas|null=null;const materialTextures:WebGLTexture[]=[];const controller=new AbortController();
  let particles:WebGLProgram|null=null,post:WebGLProgram|null=null,points:WebGLBuffer|null=null,quad:WebGLBuffer|null=null,image:WebGLTexture|null=null,target:WebGLFramebuffer|null=null;
  let particleUniforms:Record<string,WebGLUniformLocation|null>={},postUniforms:Record<string,WebGLUniformLocation|null>={};
  const mode=(webgl:boolean)=>{working=webgl;root.dataset.renderer=webgl?'webgl-landscape':'canvas-landscape';canvas.hidden=!webgl;backup.hidden=webgl;root.dataset.particles=String(webgl?count:fallbackSeeds.length/4)};
  function destroy(){if(!gl)return;gl.deleteProgram(particles);gl.deleteProgram(post);gl.deleteBuffer(points);gl.deleteBuffer(quad);gl.deleteTexture(image);gl.deleteFramebuffer(target);for(const texture of materialTextures)gl.deleteTexture(texture);materialTextures.length=0;}
  function initialise(){
   if(!gl||!atlas||gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)<2){mode(false);return;}
   const program=(vs:string,fs:string)=>{
    const compile=(type:number,source:string)=>{const s=gl!.createShader(type)!;gl!.shaderSource(s,source);gl!.compileShader(s);if(!gl!.getShaderParameter(s,gl!.COMPILE_STATUS)){const error=gl!.getShaderInfoLog(s);gl!.deleteShader(s);throw Error(error||'Flow shader compilation failed')}return s;};
    const v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs),p=gl.createProgram()!;gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Flow shader link failed');return p;
   };
   particles=program(vertexSource,fragmentSource);post=program(postVertexSource,postFragmentSource);
   for(const [data,w] of [[atlas.placement,atlas.width],[atlas.pigment,atlas.width*2]] as const){
    const texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,atlas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,data);materialTextures.push(texture);
   }
   points=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,points);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
   quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   image=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   target=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,image,0);
   particleUniforms=Object.fromEntries(['uResolution','uProgress','uDpr','uPlacement','uPigment'].map(n=>[n,gl.getUniformLocation(particles!,n)]));postUniforms=Object.fromEntries(['uImage','uTexel','uProgress'].map(n=>[n,gl.getUniformLocation(post!,n)]));mode(true);
  }
  function schedule(force=false){
   const rect=journey.getBoundingClientRect();active=rect.top<innerHeight&&rect.bottom>0;
   progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-host.clientHeight)));
   root.dataset.progress=progress.toFixed(7);root.dataset.active=String(active);
   const key=[width,height,dpr,progress].join('|');
   if(ready&&active&&!document.hidden&&(force||key!==lastKey)){lastKey=key;if(!frame)frame=requestAnimationFrame(draw);}
  }
  function resize(){
   width=host.clientWidth;height=host.clientHeight;dpr=Math.min(devicePixelRatio||1,innerWidth<640?1.4:1.6);
   for(const el of [canvas!,backup!]){el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);}cpu?.setTransform(dpr,0,0,dpr,0,0);
   if(gl&&working){gl.bindTexture(gl.TEXTURE_2D,image);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas!.width,canvas!.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,target);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)mode(false);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
   schedule(true);
  }
  function draw(){
   frame=0;if(!ready||!active||document.hidden)return;
   if(gl&&working&&particles&&post){
    gl.viewport(0,0,canvas!.width,canvas!.height);gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.useProgram(particles);
    gl.bindBuffer(gl.ARRAY_BUFFER,points);const seed=gl.getAttribLocation(particles,'aSeed');gl.enableVertexAttribArray(seed);gl.vertexAttribPointer(seed,4,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,materialTextures[0]);gl.uniform1i(particleUniforms.uPlacement,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,materialTextures[1]);gl.uniform1i(particleUniforms.uPigment,1);
    gl.uniform2f(particleUniforms.uResolution,width,height);gl.uniform1f(particleUniforms.uProgress,progress);gl.uniform1f(particleUniforms.uDpr,dpr);gl.drawArrays(gl.POINTS,0,count);gl.disableVertexAttribArray(seed);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);gl.useProgram(post);gl.bindBuffer(gl.ARRAY_BUFFER,quad);const position=gl.getAttribLocation(post,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,image);gl.uniform1i(postUniforms.uImage,0);gl.uniform2f(postUniforms.uTexel,1/canvas!.width,1/canvas!.height);gl.uniform1f(postUniforms.uProgress,progress);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disableVertexAttribArray(position);
    if(gl.getError()!==gl.NO_ERROR){mode(false);if(cpu)drawSoftwareField(cpu,width,height,progress,fallbackSeeds);}
   }else if(cpu)drawSoftwareField(cpu,width,height,progress,fallbackSeeds);
   root.dataset.state='ready';root.dataset.frame=String(++paintCount);
  }
  root.dataset.state='loading';resize();
  void loadArtistAtlas(controller.signal).then(data=>{if(disposed)return;atlas=data;ready=true;try{initialise()}catch{destroy();mode(false)}resize()}).catch(()=>{if(!disposed)root.dataset.state='unavailable'});
  const onScroll=()=>schedule(),onVisible=()=>{if(!document.hidden)schedule(true)},lost=(e:Event)=>{e.preventDefault();mode(false);schedule(true)},restored=()=>{try{destroy();initialise();resize()}catch{mode(false);schedule(true)}};
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',onVisible);canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  return()=>{disposed=true;controller.abort();cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVisible);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);destroy()};
 },[]);
 return <div className="wind-art" ref={layer} aria-hidden="true"><canvas ref={gpu}/><canvas ref={software} hidden/></div>;
}
