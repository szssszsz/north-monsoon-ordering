// Moving light, defined by contour families rather than image samples or meshes.
const {sin,cos,exp,pow,abs,min,max,floor,PI}=Math;
const TAU=PI*2;
export const STRANDS=84;
export const clamp=(x:number,a=0,b=1)=>max(a,min(b,x));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const ease=(x:number)=>x*x*x*(x*(x*6-15)+10);
export function makeSeeds(count:number){
 const data=new Float32Array(count*4);let state=0x6d2b79f5;
 for(let i=0;i<data.length;i++){state=(state+0x6d2b79f5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);data[i]=((n^(n>>>14))>>>0)/4294967296;}return data;
}
export function movement(progress:number){
 const p=clamp(progress);
 // Each composition opens fully before the next long, continuous gesture.
 if(p<.5)return [0,ease(clamp((p-.09)/.32))];
 return [1,ease(clamp((p-.58)/.33))];
}
export function contour(u:number,v:number,stage:number,out:number[]){
 const x=-6.2*cos(u*TAU);let y=0,z=0;
 if(stage===0){
  const q=x+.42*sin(v*3.1);
  const ridge=2.72*exp(-pow(abs((q+.65)/1.20),1.36))+1.22*exp(-pow(abs((q+3.15)/.91),1.58))+1.62*exp(-pow(abs((q-2.30)/1.04),1.45));
  y=-1.25+ridge*(1-v*.50)+v*.82+.055*sin(q*7.2+v*5.1)*(1-v);
  z=(v-.5)*2.2+.12*sin(q*1.8+v*3);
 }else if(stage===1){
  const crest=exp(-pow((x-1.05)/2.00,2)),bend=sin(x*.69-v*.85);
  y=-.40+bend*(.55+v*.62)+crest*(2.35-v*1.20)+(v-.5)*.60;
  z=cos(x*.66-v*.75)*(1.10+v*.70);
 }else{
  const a=u*TAU;
  if(v<.075){
   const yy=1.92*cos(a),body=.24*exp(-pow((yy+.45)/.68,2))+.035+.075*exp(-pow((yy-1.45)/.20,2));
   out[0]=.11*sin(yy*1.3)+sin(a)*body*(.3+v*9);out[1]=yy;out[2]=.24+.06*cos(a);return;
  }
  const wing=(v-.075)/.925,side=wing<.5?-1:1,j=(wing*2)%1,f=u<.5?u*2:2-u*2;
  const rootX=.16+j*4.70,rootY=.12+2.15*sin(j*PI*.80);
  const tipX=rootX+.48+j*.68,tipY=rootY-.60-1.37*sin(j*PI);
  const bend=sin(f*PI);
  const xx=side*(mix(rootX,tipX,f)+bend*.42*(1-j*.5)+sin(a)*.012);
  const yy=mix(rootY,tipY,f)+bend*.18*(j*2-1)+side*.13*sin(j*PI);
  out[0]=xx*cos(.12)-yy*sin(.12);out[1]=xx*sin(.12)+yy*cos(.12);out[2]=.40*sin(j*PI)+sin(a)*.11;return;
 }
 out[0]=x;out[1]=y;out[2]=z;
}
// Software devices reuse geometry, not rendered frames. Only moving material
// coordinates are sampled each frame; the light is still drawn afresh.
let paths:Float32Array|null=null;
const STEPS=512;
function sampleContour(u:number,line:number,stage:number,out:number[]){
 if(!paths){
  paths=new Float32Array(3*STRANDS*(STEPS+1)*3);const point:number[]=[];
  for(let s=0;s<3;s++)for(let v=0;v<STRANDS;v++)for(let j=0;j<=STEPS;j++){
   contour(j/STEPS,(v+.5)/STRANDS,s,point);
   const offset=((s*STRANDS+v)*(STEPS+1)+j)*3;
   for(let k=0;k<3;k++)paths[offset+k]=point[k];
  }
 }
 const q=u*STEPS,j=min(STEPS-1,floor(q)),f=q-j,offset=((stage*STRANDS+line)*(STEPS+1)+j)*3;
 for(let k=0;k<3;k++)out[k]=mix(paths[offset+k],paths[offset+k+3],f);
}
const first:number[]=[],next:number[]=[];
export function field(u:number,v:number,r:number,w:number,p:number,out:number[],time=0){
 const line=min(STRANDS-1,floor(v*STRANDS)),material=(line+.5)/STRANDS,phase=(u+time*(.017+.012*material))%1;
 const [stage,s]=movement(p);sampleContour(phase,line,stage,first);sampleContour(phase,line,stage+1,next);
 const dx=next[0]-first[0],dy=next[1]-first[1],curl=sin(s*PI),grain=(r-.5)*(.018+pow(r,13)*.38);
 out[0]=mix(first[0],next[0],s)-dy*curl*.10+grain*sin(w*TAU);
 out[1]=(mix(first[1],next[1],s)+dx*curl*.055+grain*cos(w*TAU)+stage*s*.22*sin(time*.8+abs(out[0])*.36)*sin(abs(out[0])*.42))*1.10;
 out[2]=mix(first[2],next[2],s)+grain;
 out[3]=(.16+.48*pow(1-material,3))*(.65+.35*w);
 out[4]=material;out[5]=.45+.65*w;out[6]=phase;
}
export function colour(t:number,out:number[]){
 const palette=[[.37,.65,1],[.55,.93,.96],[1,.80,.42],[1,.94,.78]],q=clamp(t,0,.999999)*3,i=floor(q),f=q-i;
 for(let k=0;k<3;k++)out[k]=mix(palette[i][k],palette[i+1][k],f);
}
export function projectField(point:number[],width:number,height:number,out:number[]){
 const compress=width/height<.9?.36:1,focal=min(width*.97/(12.4*compress),height*(height<650?.40:.58)/3.8)*7.8,depth=7.8-point[2];
 out[0]=width*.5+point[0]*compress*focal/depth;out[1]=height*(height<650?.66:width/height<.9?.63:.59)-point[1]*focal/depth;out[2]=focal/depth;
}
export const vertexSource=`precision highp float;
attribute vec4 aSeed;uniform vec2 uResolution;uniform float uProgress,uTime,uDpr;
varying vec3 vColor;varying float vOpacity;varying vec2 vAxis;varying float vLength;
const float PI=3.141592653589793;
float ease(float x){return x*x*x*(x*(x*6.-15.)+10.);}
vec3 contour(float u,float v,float stage){
 float x=-6.2*cos(u*PI*2.),y=0.,z=0.;
 if(stage<.5){
  float q=x+.42*sin(v*3.1);
  float ridge=2.72*exp(-pow(abs((q+.65)/1.20),1.36))+1.22*exp(-pow(abs((q+3.15)/.91),1.58))+1.62*exp(-pow(abs((q-2.30)/1.04),1.45));
  y=-1.25+ridge*(1.-v*.50)+v*.82+.055*sin(q*7.2+v*5.1)*(1.-v);
  z=(v-.5)*2.2+.12*sin(q*1.8+v*3.);
 }else if(stage<1.5){
  float crest=exp(-pow((x-1.05)/2.00,2.)),bend=sin(x*.69-v*.85);
  y=-.40+bend*(.55+v*.62)+crest*(2.35-v*1.20)+(v-.5)*.60;z=cos(x*.66-v*.75)*(1.10+v*.70);
 }else{
  float a=u*PI*2.;
  if(v<.075){float yy=1.92*cos(a),body=.24*exp(-pow((yy+.45)/.68,2.))+.035+.075*exp(-pow((yy-1.45)/.20,2.));return vec3(.11*sin(yy*1.3)+sin(a)*body*(.3+v*9.),yy,.24+.06*cos(a));}
  float wing=(v-.075)/.925,side=wing<.5?-1.:1.,j=fract(wing*2.),f=u<.5?u*2.:2.-u*2.;
  float rootX=.16+j*4.70,rootY=.12+2.15*sin(j*PI*.80),tipX=rootX+.48+j*.68,tipY=rootY-.60-1.37*sin(j*PI);
  float bend=sin(f*PI),xx=side*(mix(rootX,tipX,f)+bend*.42*(1.-j*.5)+sin(a)*.012),yy=mix(rootY,tipY,f)+bend*.18*(j*2.-1.)+side*.13*sin(j*PI);
  return vec3(xx*cos(.12)-yy*sin(.12),xx*sin(.12)+yy*cos(.12),.40*sin(j*PI)+sin(a)*.11);
 }return vec3(x,y,z);
}
vec3 position(float u,float v,float r,float w,float stage,float s){
 vec3 a=contour(u,v,stage),b=contour(u,v,stage+1.);float curl=sin(s*PI),grain=(r-.5)*(.018+pow(r,13.)*.38);
 return mix(a,b,s)+curl*vec3(-(b.y-a.y)*.10,(b.x-a.x)*.055,0.)+grain*vec3(sin(w*PI*2.),cos(w*PI*2.),1.);
}
vec3 palette(float t){
 float q=clamp(t,0.,.999999)*3.;vec3 a=vec3(.37,.65,1.),b=vec3(.55,.93,.96),c=vec3(1.,.80,.42),d=vec3(1.,.94,.78);
 if(q<1.)return mix(a,b,q);if(q<2.)return mix(b,c,q-1.);return mix(c,d,q-2.);
}
vec2 project(vec3 point,float focal,float compress){return vec2(point.x*compress,point.y)*focal/(7.8-point.z);}
void main(){
 float v=(floor(aSeed.y*84.)+.5)/84.,r=aSeed.z,w=aSeed.w,u=fract(aSeed.x+uTime*(.017+.012*v)),stage=uProgress<.5?0.:1.;
 float s=ease(clamp(uProgress<.5?(uProgress-.09)/.32:(uProgress-.58)/.33,0.,1.));
 vec3 pos=position(u,v,r,w,stage,s),ahead=position(u+.0004,v,r,w,stage,s);pos.y+=stage*s*.22*sin(uTime*.8+abs(pos.x)*.36)*sin(abs(pos.x)*.42);ahead.y+=stage*s*.22*sin(uTime*.8+abs(ahead.x)*.36)*sin(abs(ahead.x)*.42);pos.y*=1.10;ahead.y*=1.10;
 float compress=uResolution.x/uResolution.y<.9?.36:1.,focal=min(uResolution.x*.97/(12.4*compress),uResolution.y*(uResolution.y<650.?.40:.58)/3.8)*7.8;
 vec2 screen=project(pos,focal,compress),direction=project(ahead,focal,compress)-screen;
 vAxis=normalize(direction+vec2(.00001));vLength=2.2+4.0*w;
 gl_Position=vec4((screen/uResolution+vec2(.5,uResolution.y<650.?-.16:uResolution.x/uResolution.y<.9?-.13:-.09))*2.-vec2(1.,0.),0.,1.);gl_PointSize=vLength*uDpr;
 vOpacity=(.16+.48*pow(1.-v,3.))*(.65+.35*w)*(uResolution.x<640.?.42:.72);
 vColor=palette(clamp(.06+uProgress*.64+v*.12+.08*sin(u*PI*2.),0.,1.));
}`;
export const fragmentSource=`precision mediump float;varying vec3 vColor;varying float vOpacity;varying vec2 vAxis;varying float vLength;
void main(){vec2 q=(gl_PointCoord-.5)*2.;q.y=-q.y;vec2 along=vec2(dot(q,vAxis),dot(q,vec2(-vAxis.y,vAxis.x)));float core=exp(-along.x*along.x*2.2-along.y*along.y*vLength*vLength*1.6);if(core<.008)discard;gl_FragColor=vec4(vColor,core*vOpacity);}`;
export const postVertexSource=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
export const postFragmentSource=`precision mediump float;uniform sampler2D uImage;uniform vec2 uTexel;uniform float uProgress;varying vec2 vUV;
void main(){vec3 fine=texture2D(uImage,vUV).rgb,glow=vec3(0.);
 for(int i=0;i<4;i++){vec2 d=uTexel*(2.+float(i)*4.);glow+=(texture2D(uImage,vUV+d).rgb+texture2D(uImage,vUV+vec2(-d.x,d.y)).rgb+texture2D(uImage,vUV+vec2(d.x,-d.y)).rgb+texture2D(uImage,vUV-d).rgb)*.0625;}
 vec2 q=vUV-vec2(.52,.42);float haze=exp(-dot(q*vec2(.8,1.6),q*vec2(.8,1.6))*9.);
 vec3 ink=vec3(.006,.014,.028)+haze*mix(vec3(.009,.023,.035),vec3(.029,.018,.006),uProgress),light=vec3(1.)-exp(-(fine*1.8+glow*1.6));gl_FragColor=vec4(ink+light,1.);
}`;
