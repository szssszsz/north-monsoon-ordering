// One continuous set of particles: landscape -> three courses -> silver service -> invitation seal.
const TAU=Math.PI*2;
export function shape(stage:number,u:number,v:number,w:number,t:number,out:number[]){
 const a=u*TAU,s=v*2-1;
 let x=0,y=0,z=0;
 if(stage===0){
  x=u*3.8-1.9;z=s*1.03;
  y=Math.max(0,1.50-Math.abs(x+.58)*1.38-Math.abs(z)*.48,1.10-Math.abs(x-.78)*1.08-Math.abs(z+.28)*.56)-.65;
  y+=.045*Math.sin(x*15+z*9);
  if(w>.65){x=((u+t*.045)%1)*4.6-2.3;y=.92-x*.12+Math.sin(x*2.2+t*.55+s*3)*.13+s*.24;z=s*1.05+Math.cos(x*1.4+t*.3)*.2;}
 }else if(stage===1){
  const group=Math.min(2,Math.floor(u*3)),theta=(u*3%1)*TAU,root=Math.sqrt(Math.max(0,1-s*s));
  if(group===0){x=-1.25+Math.cos(theta)*root*.43;y=s*.40+.08*Math.sin(theta*3+t*.6);z=Math.sin(theta)*root*.42;}
  if(group===1){const b=s*TAU*1.3+theta*.22+t*.3;x=Math.cos(b)*(.22+.04*s);y=s*.68;z=Math.sin(b)*.3;}
  if(group===2){x=1.25+Math.cos(theta)*root*.49;y=.13+s*.30+.12*Math.sin(theta*3);z=Math.sin(theta)*root*.43;}
  if(w>.79){const r=.49+s*.025;x=(group-1)*1.25+Math.cos(theta)*r;y=-.64+(w-.8)*.13;z=Math.sin(theta)*r*.75;}
 }else if(stage===2){
  const phi=v*Math.PI*.5;
  x=Math.cos(a)*Math.sin(phi)*1.48;y=.02+Math.cos(phi)*1.03;z=Math.sin(a)*Math.sin(phi)*.91;
  if(w>.65){const r=1.5+s*.13;x=Math.cos(a)*r;y=-.13+Math.sin(s*Math.PI)*.045;z=Math.sin(a)*r*.62;}
  if(w>.91){x=Math.cos(a)*.19;y=1.15+Math.sin(a)*.12;z=s*.045;}
 }else{
  let r=1.06+s*.055;
  x=Math.cos(a)*r;y=Math.sin(a)*r;z=(w-.5)*.13;
  if(w>.35&&w<.70){r=.80+s*.025;x=Math.cos(a)*r;y=Math.sin(a)*r;}
  if(w>=.70){const blade=Math.floor(u*8),angle=blade*TAU/8,len=v*.76,side=(w-.85)*.40*(1-v);x=Math.sin(angle)*len+Math.cos(angle)*side;y=Math.cos(angle)*len-Math.sin(angle)*side;z=.10;}
 }
 out[0]=x;out[1]=y;out[2]=z;
}
export const vertexSource=`
precision highp float;
attribute vec4 aSeed;
uniform vec2 uResolution,uPointer;
uniform vec4 uPlacement;
uniform float uTime,uScene,uReveal,uDpr;
varying float vLight,vOpacity;
const float TAU=6.28318530718;
vec3 shape(float stage,float u,float v,float w,float t){
 float a=u*TAU,s=v*2.0-1.0;vec3 p=vec3(0.0);
 if(stage<.5){
  p.x=u*3.8-1.9;p.z=s*1.03;
  p.y=max(0.0,max(1.50-abs(p.x+.58)*1.38-abs(p.z)*.48,1.10-abs(p.x-.78)*1.08-abs(p.z+.28)*.56))-.65+.045*sin(p.x*15.0+p.z*9.0);
  if(w>.65){p.x=fract(u+t*.045)*4.6-2.3;p.y=.92-p.x*.12+sin(p.x*2.2+t*.55+s*3.0)*.13+s*.24;p.z=s*1.05+cos(p.x*1.4+t*.3)*.2;}
 }else if(stage<1.5){
  float group=min(2.0,floor(u*3.0)),theta=fract(u*3.0)*TAU,root=sqrt(max(0.0,1.0-s*s));
  if(group<.5)p=vec3(-1.25+cos(theta)*root*.43,s*.40+.08*sin(theta*3.0+t*.6),sin(theta)*root*.42);
  else if(group<1.5){float b=s*TAU*1.3+theta*.22+t*.3;p=vec3(cos(b)*(.22+.04*s),s*.68,sin(b)*.3);}
  else p=vec3(1.25+cos(theta)*root*.49,.13+s*.30+.12*sin(theta*3.0),sin(theta)*root*.43);
  if(w>.79){float r=.49+s*.025;p=vec3((group-1.0)*1.25+cos(theta)*r,-.64+(w-.8)*.13,sin(theta)*r*.75);}
 }else if(stage<2.5){
  float phi=v*TAU*.25;p=vec3(cos(a)*sin(phi)*1.48,.02+cos(phi)*1.03,sin(a)*sin(phi)*.91);
  if(w>.65){float r=1.5+s*.13;p=vec3(cos(a)*r,-.13+sin(s*TAU*.5)*.045,sin(a)*r*.62);}
  if(w>.91)p=vec3(cos(a)*.19,1.15+sin(a)*.12,s*.045);
 }else{
  float r=1.06+s*.055;p=vec3(cos(a)*r,sin(a)*r,(w-.5)*.13);
  if(w>.35&&w<.70){r=.80+s*.025;p.xy=vec2(cos(a),sin(a))*r;}
  if(w>=.70){float angle=floor(u*8.0)*TAU/8.0,len=v*.76,side=(w-.85)*.40*(1.0-v);p=vec3(sin(angle)*len+cos(angle)*side,cos(angle)*len-sin(angle)*side,.10);}
 }
 return p;
}
void main(){
 float index=floor(uScene),f=fract(uScene);f=f*f*(3.0-2.0*f);
 vec3 p=mix(shape(index,aSeed.x,aSeed.y,aSeed.w,uTime),shape(min(3.0,index+1.0),aSeed.x,aSeed.y,aSeed.w,uTime),f);
 vec3 scatter=vec3(sin(aSeed.z*73.0)*3.5,cos(aSeed.y*89.0)*2.5,sin(aSeed.x*91.0)*3.2);
 p=mix(scatter,p,uReveal);
 float spin=mix(.15+sin(uTime*.17)*.21,.12+sin(uTime*.24)*.18,step(2.6,uScene))+uPointer.x*.22;
 float tilt=-.24+uPointer.y*.12;
 p.xz=mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*p.xz;
 p.yz=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p.yz;
 p*=uPlacement.z;
 float depth=4.4-p.z,aspect=uResolution.x/uResolution.y;
 gl_Position=vec4(p.xy*2.7/vec2(aspect,1.0)+uPlacement.xy*depth,0.0,depth);
 gl_PointSize=clamp((1.25+aSeed.z*1.8)*4.0/depth*uDpr,1.0,7.0*uDpr);
 vLight=.38+.5*smoothstep(-1.8,1.8,p.z);vOpacity=uPlacement.w;
}`;
export const fragmentSource=`
precision mediump float;
varying float vLight,vOpacity;
void main(){
 float r=length(gl_PointCoord-vec2(.5))*2.0;if(r>1.0)discard;
 vec3 color=mix(vec3(.85,.56,.22),vec3(1.0,.91,.69),vLight);
 gl_FragColor=vec4(color,(exp(-r*r*5.0)*.9+exp(-r*r*2.0)*.08)*vLight*vOpacity);
}`;
