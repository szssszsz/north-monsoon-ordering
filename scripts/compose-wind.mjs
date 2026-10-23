// Authoring score. CPU and GPU geometry are generated from these same functions.
import {writeFileSync} from 'node:fs';

function shape(u,v,stage,out){
 let a=u*TAU,x=-6.8*cos(a),y=0.,z=0.;
 if(stage<.5){
  let q=x+.78*sin(v*3.8),ridge=3.08*exp(-pow(abs((q+1.15)/1.02),1.20))+1.60*exp(-pow(abs((q+3.65)/.82),1.34))+2.02*exp(-pow(abs((q-2.15)/1.18),1.30));
  let etch=.18*sin(q*8.2+v*10.0)+.075*sin(q*21.3-v*6.0)+.034*sin(q*47.0+v*19.0);
  y=-1.60+ridge*(1.-v*.24)+etch*(.9-v*.5)+v*.65;
  if(v>.82){y=-1.63+.18*sin(a*3.+v*35.)+(v-.82)*1.5;}
  z=1.35-v*7.6+.34*sin(q*.8+v*6.0)+.14*sin(a);
 }else if(stage<1.5){
  // An asymmetrical cloud cyclone; its inner current comes towards the lens.
  let angle=a+v*2.70,radius=.52+v*3.36;
  x=.75+radius*cos(angle)*1.46+.46*sin(angle*2.+v*3.);
  y=.45+radius*sin(angle)*.88+.32*sin(angle*3.+v*2.);
  z=2.10*sin(angle)+.42*cos(angle*3.)+(1.-v)*1.15;
 }else if(stage<2.5){
  if(v<.075){
   let yy=2.35*cos(a),body=.26*exp(-pow((yy+.65)/.78,2.))+.028+.080*exp(-pow((yy-1.58)/.16,2.));
   x=.16*sin(yy*1.15)+sin(a)*body*(.25+v*10.);y=yy;z=.52+.12*cos(a);
  }else{
   let wing=(v-.075)/.925,side=wing<.5?-1.:1.,j=mod(wing*2.,1.),f=(1.-cos(a))*.5;
   let rootX=.12+j*5.4,rootY=.18+2.65*sin(j*PI*.81),tipX=rootX+.30+j*.90,tipY=rootY-.75-1.7*sin(j*PI);
   let bend=sin(f*PI),xx=side*(mix(rootX,tipX,f)+bend*.52*(1.-j*.7)+sin(a)*.008),yy=mix(rootY,tipY,f)+bend*.24*(j*2.-1.);
   x=xx*cos(.23)-yy*sin(.23);y=xx*sin(.23)+yy*cos(.23);z=.95*sin(j*PI)+side*.38+sin(a)*.22;
  }
 }else{
  if(v<.12){
   let radius=.84*sqrt(v/.12)+.022*sin(a*13.+v*37.)+.016*cos(a*21.-v*53.);
   x=2.85+radius*cos(a);y=2.05+radius*sin(a);z=-2.70;
  }else{
   let d=(v-.12)/.88;
   x=-8.6*cos(a);z=-9.0+d*12.4+.32*sin(a);
   y=-.58+.11*sin(x*2.8+z*1.8)+.045*sin(x*7.3-z*3.2);
  }
 }
 out[0]=x;out[1]=y;out[2]=z;
}
function view(x,y,z,p,time,out){
 let orbit=(.16*sin(p*TAU)+.018*sin(time*.12))*(1.-easeRange(.82,1.,p));
 let bank=-.04+.24*easeRange(.40,.70,p)-.20*easeRange(.80,1.,p);
 let swell=exp(-pow((p-.43)/.17,2.)),near=exp(-pow((p-.70)/.12,2.));
 let scale=.96+.22*swell+.17*near,push=.95*swell;
 let xx=x*cos(orbit)+z*sin(orbit),zz=-x*sin(orbit)+z*cos(orbit)+push;
 let yy=y;
 out[0]=(xx*cos(bank)-yy*sin(bank))*scale-.18*sin(p*PI);
 out[1]=(xx*sin(bank)+yy*cos(bank))*scale;
 out[2]=zz;
}
function glsl(fn,args){
 let s=fn.toString(),body=s.slice(s.indexOf('{'));
 body=body.replaceAll('out[0]','out.x').replaceAll('out[1]','out.y').replaceAll('out[2]','out.z').replace(/\blet\b/g,'float');
 body=(body.slice(0,-1)+'return out;\n}').replace(/\bout\b/g,'result');
 return 'vec3 '+fn.name+'('+args.map(n=>'float '+n).join(',')+')'+body.replace('{','{vec3 result;');
}
const geometry=glsl(shape,['u','v','stage'])+'\n'+glsl(view,['x','y','z','p','time']);
const jsGeometry=shape.toString().replace('(u,v,stage,out)','(u:number,v:number,stage:number,out:number[])')+'\n'+view.toString().replace('(x,y,z,p,time,out)','(x:number,y:number,z:number,p:number,time:number,out:number[])');
const vertex=`precision highp float;
attribute vec4 aSeed;uniform vec2 uResolution;uniform float uProgress,uTime,uDpr;uniform vec2 uPointer;uniform float uReverie;
varying vec3 vColor;varying float vOpacity;varying vec2 vAxis;varying float vLength;varying float vSoftness;
const float PI=3.141592653589793,TAU=6.283185307179586;
float easeRange(float a,float b,float p){float t=clamp((p-a)/(b-a),0.,1.);return t*t*t*(t*(t*6.-15.)+10.);}
${geometry}
vec2 movement(float p){if(p<.34)return vec2(0.,easeRange(.17,.33,p));if(p<.70)return vec2(1.,easeRange(.44,.67,p));return vec2(2.,easeRange(.79,.98,p));}
vec3 material(float u,float v,float r,float w,float p,vec2 score){
 vec3 a=shape(u,v,score.x),b=shape(u,v,score.x+1.);float curl=sin(score.y*PI),grain=(r-.5)*(.035+.72*pow(w,10.));
 vec3 point=mix(a,b,score.y)+curl*vec3(-(b.y-a.y)*.14,(b.x-a.x)*.10,.65*sin(u*TAU+v*4.));
 point+=grain*vec3(sin(w*TAU),cos(w*TAU),sin(r*TAU));
 point.y+=.13*sin(uTime*.52+point.x*.34)*easeRange(.49,.65,p)*(1.-easeRange(.79,.98,p));
 // Persistent atmospheric grains are members of the same pool in every chapter.
 if(r>.985){float near=step(.995,r);point=vec3(-9.*cos(u*TAU)+sin(v*TAU)*.3,3.6*sin(u*TAU+v*5.),mix(-10.+v*4.,1.3+v*2.2,near));}
 return view(point.x,point.y,point.z,p,uTime);
}
vec3 palette(float t){float q=clamp(t,0.,.99999)*4.;vec3 a=vec3(.34,.64,.97),b=vec3(.28,.77,.91),c=vec3(.64,.94,.88),d=vec3(1.,.75,.38),e=vec3(.82,.87,.91);if(q<1.)return mix(a,b,q);if(q<2.)return mix(b,c,q-1.);if(q<3.)return mix(c,d,q-2.);return mix(d,e,q-3.);}
vec2 project(vec3 point,float p,float moon){
 float portrait=uResolution.x/uResolution.y<.9?1.:0.,compress=mix(1.,.51,portrait),focal=min(uResolution.x*.98/(13.6*compress),uResolution.y*.72/5.7)*7.8;
 if(moon>0.){vec3 centre=view(2.85,2.05,-2.70,p,uTime);point.x=mix(point.x,centre.x+(point.x-centre.x)/compress,moon);}
 return vec2(point.x*compress,point.y)*focal/(7.8-point.z);
}
void main(){
 float v=(floor(aSeed.y*128.)+.5)/128.,r=aSeed.z,w=aSeed.w,p=clamp(uProgress,0.,1.),u=fract(aSeed.x+uTime*(.012+.019*v));vec2 score=movement(p);
 vec3 point=material(u,v,r,w,p,score),ahead=material(u+.00035,v,r,w,p,score);
 float moon=score.x>1.5&&v<.12?score.y:0.;vec2 screen=project(point,p,moon),direction=project(ahead,p,moon)-screen;
 float end=easeRange(.80,.99,p),hue=clamp(.08+p*.68+v*.15+.08*sin(u*TAU),0.,1.);
 float carving=.38+.76*pow(abs(sin(v*19.7)),8.),gain=carving*(.34+.66*pow(w,3.));
 float reflection=exp(-pow((point.x-2.65)/.48,2.));
 gain*=mix(1.,v<.12?.45:.15+reflection*1.55,end);
 gain*=clamp(2./(1.+(7.8-point.z)*.18),.3,1.35);
 float air=step(.985,r),near=step(.995,r),fog=clamp(exp(-max(0.,-point.z)*.065),.35,1.);
 vec3 tint=palette(mix(hue,.995,moon));
 // Five restrained timbres recur as one score; no separate particle scenes.
 if(uReverie>.5){float band=floor(v*5.);vec3 note=band<1.?vec3(.45,.73,.88):band<2.?vec3(.86,.49,.66):band<3.?vec3(.62,.77,.60):band<4.?vec3(.83,.64,.41):vec3(.68,.55,.83);tint=mix(tint,note,.28*(1.-moon));}
 vColor=tint*mix(gain,mix(.25,.42,near),air)*fog;vOpacity=.22+.30*r;
 vAxis=normalize(direction+vec2(.00001));float depthScale=clamp(8./(7.8-point.z),.55,2.3);
 vSoftness=clamp((point.z-.6)/3.,0.,1.)*pow(w,7.);
 vSoftness=max(vSoftness,step(.995,r)*.85);
 vLength=mix((1.55+3.6*w*w)*sqrt(depthScale),7.5+7.*w,vSoftness);gl_PointSize=vLength*uDpr;
 screen+=uPointer*clamp(point.z+5.,0.,9.)*2.4;
 gl_Position=vec4(screen/uResolution*2.+vec2(0.,uResolution.x/uResolution.y<.9?-.14:.03),0.,1.);
}`;
const fragment=`precision mediump float;varying vec3 vColor;varying float vOpacity;varying vec2 vAxis;varying float vLength;varying float vSoftness;
void main(){vec2 q=(gl_PointCoord-.5)*2.;q.y=-q.y;vec2 a=vec2(dot(q,vAxis),dot(q,vec2(-vAxis.y,vAxis.x)));float sharp=exp(-a.x*a.x*2.5-a.y*a.y*vLength*vLength*1.9);float soft=exp(-dot(q,q)*4.5)*.15;float core=mix(sharp,soft,vSoftness);if(core<.006)discard;gl_FragColor=vec4(vColor,core*vOpacity);}`;
const postVertex=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const postFragment=`precision mediump float;uniform sampler2D uImage;uniform vec2 uTexel;uniform float uProgress;varying vec2 vUV;
void main(){vec3 fine=texture2D(uImage,vUV).rgb,glow=vec3(0.);for(int i=0;i<4;i++){vec2 d=uTexel*(2.+float(i)*4.);glow+=(texture2D(uImage,vUV+d).rgb+texture2D(uImage,vUV+vec2(-d.x,d.y)).rgb+texture2D(uImage,vUV+vec2(d.x,-d.y)).rgb+texture2D(uImage,vUV-d).rgb)*.0625;}
 vec2 q=vUV-vec2(.52,.51);float haze=exp(-dot(q*vec2(.9,1.5),q*vec2(.9,1.5))*7.);
 vec3 ink=vec3(.003,.008,.017)+haze*mix(vec3(.005,.014,.023),vec3(.024,.012,.007),smoothstep(.65,1.,uProgress));
 vec3 light=vec3(1.)-exp(-(fine*2.65+glow*1.8));float vignette=1.-.28*smoothstep(.27,.81,length(vUV-.5));gl_FragColor=vec4((ink+light)*vignette,1.);}`;
const cpu=`// Generated from scripts/compose-wind.mjs. No images, meshes or sampled artwork.
const {sin,cos,exp,pow,abs,min,max,floor,sqrt}=Math;const PI=Math.PI,TAU=PI*2;
export const STRANDS=128;
export const clamp=(x:number,a=0,b=1)=>max(a,min(b,x));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t,mod=(a:number,b:number)=>((a%b)+b)%b;
const easeRange=(a:number,b:number,p:number)=>{const t=clamp((p-a)/(b-a));return t*t*t*(t*(t*6-15)+10)};
${jsGeometry}
export function makeSeeds(count:number){const data=new Float32Array(count*4);let state=0x6d2b79f5;for(let i=0;i<data.length;i++){state=(state+0x6d2b79f5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);data[i]=((n^(n>>>14))>>>0)/4294967296;}return data;}
export function movement(p:number){p=clamp(p);if(p<.34)return [0,easeRange(.17,.33,p)];if(p<.70)return [1,easeRange(.44,.67,p)];return [2,easeRange(.79,.98,p)];}
let paths:Float32Array|null=null;const STEPS=1024;
function sample(u:number,line:number,stage:number,out:number[]){
 if(!paths){paths=new Float32Array(4*STRANDS*(STEPS+1)*3);const q:number[]=[];for(let s=0;s<4;s++)for(let v=0;v<STRANDS;v++)for(let j=0;j<=STEPS;j++){shape(j/STEPS,(v+.5)/STRANDS,s,q);const k=((s*STRANDS+v)*(STEPS+1)+j)*3;for(let c=0;c<3;c++)paths[k+c]=q[c];}}
 const f=u*STEPS,j=min(STEPS-1,floor(f)),a=f-j,k=((stage*STRANDS+line)*(STEPS+1)+j)*3;for(let c=0;c<3;c++)out[c]=mix(paths[k+c],paths[k+c+3],a);
}
const a:number[]=[],b:number[]=[],centre:number[]=[],origin:number[]=[],basis:number[]=[],matrix=new Float64Array(9);
let preparedP=NaN,preparedT=NaN,stageNow=0,blendNow=0,flapNow=0,endNow=0;
function prepare(p:number,time:number){
 if(p===preparedP&&time===preparedT)return;
 preparedP=p;preparedT=time;const score=movement(p);stageNow=score[0];blendNow=score[1];flapNow=.13*easeRange(.49,.65,p)*(1-easeRange(.79,.98,p));endNow=easeRange(.80,.99,p);
 view(0,0,0,p,time,origin);
 for(let j=0;j<3;j++){view(j===0?1:0,j===1?1:0,j===2?1:0,p,time,basis);for(let k=0;k<3;k++)matrix[j*3+k]=basis[k]-origin[k];}
 view(2.85,2.05,-2.70,p,time,centre);
}
function camera(x:number,y:number,z:number,out:number[]){for(let k=0;k<3;k++)out[k]=origin[k]+matrix[k]*x+matrix[3+k]*y+matrix[6+k]*z;}
export function field(u:number,v:number,r:number,w:number,p:number,out:number[],time=0){
 prepare(p,time);const line=min(STRANDS-1,floor(v*STRANDS)),material=(line+.5)/STRANDS,phase=mod(u+time*(.012+.019*material),1),stage=stageNow,s=blendNow;sample(phase,line,stage,a);sample(phase,line,stage+1,b);
 const curl=sin(s*PI),grain=(r-.5)*(.035+.72*pow(w,10));
 let x=mix(a[0],b[0],s)-(b[1]-a[1])*curl*.14+grain*sin(w*TAU);
 let y=mix(a[1],b[1],s)+(b[0]-a[0])*curl*.10+grain*cos(w*TAU);
 let z=mix(a[2],b[2],s)+curl*.65*sin(phase*TAU+material*4)+grain*sin(r*TAU);
 if(r>.985){x=-9*cos(phase*TAU)+sin(material*TAU)*.3;y=3.6*sin(phase*TAU+material*5);z=r>.995?1.3+material*2.2:-10+material*4;}
 camera(x,y+sin(time*.52+x*.34)*flapNow*(r>.985?0:1),z,out);out[3]=.22+.30*r;out[4]=material;out[5]=.45+.65*w;out[6]=phase;
 out[7]=stage>1.5&&material<.12?s:0;out[8]=centre[0];
 const carving=.38+.76*pow(abs(sin(material*19.7)),8),end=endNow,reflection=exp(-pow((out[0]-2.65)/.48,2));
 out[9]=carving*(.34+.66*pow(w,3))*mix(1,material<.12?.45:.15+reflection*1.55,end)*clamp(2/(1+(7.8-out[2])*.18),.3,1.35);
 out[9]=(r>.985?(r>.995?.42:.25):out[9])*clamp(exp(-max(0,-out[2])*.065),.35,1);
 out[10]=max(clamp((out[2]-.6)/3)*pow(w,7),r>.995?.85:0);
}
export function colour(t:number,out:number[]){const palette=[[.34,.64,.97],[.28,.77,.91],[.64,.94,.88],[1,.75,.38],[.82,.87,.91]],q=clamp(t,0,.99999)*4,i=floor(q),f=q-i;for(let k=0;k<3;k++)out[k]=mix(palette[i][k],palette[i+1][k],f);}
export function projectField(point:number[],width:number,height:number,out:number[]){const portrait=width/height<.9,compress=portrait?.51:1,focal=min(width*.98/(13.6*compress),height*.72/5.7)*7.8,depth=7.8-point[2],x=mix(point[0],point[8]+(point[0]-point[8])/compress,point[7]);out[0]=width*.5+x*compress*focal/depth;out[1]=height*(portrait?.57:.485)-point[1]*focal/depth;out[2]=focal/depth;}
`;
writeFileSync(new URL('../src/particleField.ts',import.meta.url),cpu+'\n'+Object.entries({vertexSource:vertex,fragmentSource:fragment,postVertexSource:postVertex,postFragmentSource:postFragment}).map(([name,source])=>'export const '+name+'='+JSON.stringify(source)+';').join('\n')+'\n');
console.log('Composed four acts from one shared procedural geometry score.');
