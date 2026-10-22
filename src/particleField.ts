// A continuous wind field. Its only coordinate is the visitor's scroll position.
// No meshes, target models, clock, shape switching or autonomous playback.
const TAU=Math.PI*2;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const fract=(v:number)=>v-Math.floor(v);
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
export function makeSeeds(count:number){
 const data=new Float32Array(count*4);let state=0x6d2b79f5;
 for(let i=0;i<data.length;i++){state=(state+0x6d2b79f5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);data[i]=((n^(n>>>14))>>>0)/4294967296;}
 return data;
}
export function field(u:number,v:number,r:number,w:number,p:number,out:number[]){
 let x=0,y=0,z=0,light=0,tint=0,size=0;
 const a=p*TAU,drift=fract(u+p*.37),s=drift*2-1,edge=smooth(0,.07,drift)*(1-smooth(.92,1,drift));
 if(w<.39){
  x=(u*2-1)*4.1;z=v*6.7-3.6;
  const ridge=Math.pow(.5+.5*Math.sin(x*1.18+z*.72+a*.22),7),dune=.12*Math.sin(x*2.6-z*1.2+a*.43)+.045*Math.sin(x*7.5+z*3.4-a*.4);
  const relief=.48+.44*(.5+.5*Math.cos(a*.85));
  y=-.83+ridge*relief+dune+.018*(r-.5);
  light=(.30+.45*ridge+.26*r)*smooth(0,.08,u)*(1-smooth(.92,1,u));
  tint=.13+.42*(.5+.5*Math.sin(z*.43+x*.13+a*.26));size=.74+r*.67;
 }else if(w<.69){
  const strand=Math.floor(v*32)/31-.5,fibre=(fract(v*32)-.5)*.075,cross=strand+fibre;
  const twist=drift*6.4+a*.56;
  x=s*4.1;
  y=.12+Math.sin(drift*6.2-a*.48)*.69+cross*Math.cos(twist)*.92+.045*Math.sin(drift*24+strand*7-a*.9);
  z=Math.sin(drift*4.9+a*.26)*1.0+cross*Math.sin(twist)*1.45;
  y+=.10*Math.sin(strand*8+drift*14+a*.4);
  z+=(r-.5)*.10;
  const curl=Math.sin(p*Math.PI)*.72;x+=Math.cos(drift*7.2-a*.48)*curl;y+=Math.sin(drift*7.2-a*.48)*curl*.85;
  light=(.62+1.15*Math.pow(.5+.5*Math.sin(drift*10+strand*5-a*.9),3))*edge;
  tint=fract(.21+strand*.38+drift*.50+p*.19);size=.91+r*.82;
 }else if(w<.84){
  const strand=Math.floor(v*28)/27-.5,cross=strand+(fract(v*28)-.5)*.055;
  const arc=-.55+drift*3.9+a*.18,radius=1.08+cross*.62+.09*Math.sin(drift*13+a*.5+v*2);
  x=Math.cos(arc)*radius*1.60+Math.sin(a*.47)*.5;y=Math.sin(arc)*radius*.75-.25;z=Math.cos(arc*.85+a*.3)*.85+(r-.5)*.10;
  light=(.12+.53*Math.pow(Math.sin(p*Math.PI),2))*edge*(.60+r*.55);tint=fract(.02+drift*.6+p*.22);size=.70+r*.7;
 }else if(w<.96){
  const q=fract(u+p*.14),xx=(q*2-1)*4.2;
  x=xx;z=(v*2-1)*2.45;
  y=-.47+.20*Math.sin(xx*1.35+z*.7-a*.37)+.07*Math.sin(xx*5.1+z*2.8+a*.5)+(r-.5)*.28;
  light=(.15+.18*r)*smooth(0,.08,q)*(1-smooth(.92,1,q));tint=.43+.28*(.5+.5*Math.sin(xx*.7+a*.23));size=.80+r*1.15;
 }else if(w<.985){
  const radius=Math.sqrt(u)*.43,angle=v*TAU;
  x=Math.sin(a*.3-.7)+Math.cos(angle)*radius;y=.62+Math.sin(angle)*radius;z=-2.4+r*.035;
  light=(.70+.60*Math.pow(Math.sin(p*Math.PI),2))*(1-u*.65);tint=.36;size=1.5+r*.75;
 }else{
  x=(u*2-1)*4.8;y=(v*2-1)*1.72;z=(r*2-1)*3.0;
  x+=Math.sin(v*7+a*.65)*.12;y+=Math.sin(u*9-a*.43)*.08;
  light=.025+.07*r;tint=fract(u*.3+v*.5+p*.08);size=.7+Math.pow(r,7)*5;
 }
 const yaw=-.12+.22*Math.sin(a*.33),pitch=-.18+.055*Math.cos(a*.5),cx=Math.cos(yaw),sx=Math.sin(yaw),cy=Math.cos(pitch),sy=Math.sin(pitch);
 const xx=cx*x+sx*z;z=-sx*x+cx*z;x=xx;const yy=cy*y+sy*z;z=-sy*y+cy*z;y=yy;
 out[0]=x;out[1]=y;out[2]=z;out[3]=light;out[4]=tint;out[5]=size;
}
const COLORS=[[.31,.68,.76],[.58,.83,.78],[.94,.80,.51],[.86,.59,.57],[.62,.51,.81],[.32,.60,.76]];
export function colorAt(t:number,out:number[]){const s=fract(t)*6,i=Math.floor(s),f=s-i;for(let j=0;j<3;j++)out[j]=mix(COLORS[i][j],COLORS[(i+1)%6][j],f);}
export function projectField(point:number[],width:number,height:number,out:number[]){
 const aspect=width/height,horizontal=Math.min(1,aspect/.98),depth=5.2-point[2];
 out[0]=width*.5+point[0]*horizontal*height*1.3/depth;
 out[1]=height*.60-point[1]*height*1.3/depth;
 out[2]=Math.min(6,Math.max(.40,point[5]*5.5/depth));
}
export const vertexSource=`
precision highp float;
attribute vec4 aSeed;
uniform vec2 uResolution;
uniform float uProgress,uDpr;
varying vec3 vColor;
varying float vOpacity;
const float TAU=6.28318530718;
vec3 colorAt(float t){
 float q=fract(t)*6.;vec3 c0=vec3(.31,.68,.76),c1=vec3(.58,.83,.78),c2=vec3(.94,.80,.51),c3=vec3(.86,.59,.57),c4=vec3(.62,.51,.81),c5=vec3(.32,.60,.76);
 if(q<1.)return mix(c0,c1,q);if(q<2.)return mix(c1,c2,q-1.);if(q<3.)return mix(c2,c3,q-2.);if(q<4.)return mix(c3,c4,q-3.);if(q<5.)return mix(c4,c5,q-4.);return mix(c5,c0,q-5.);
}
void main(){
 float u=aSeed.x,v=aSeed.y,r=aSeed.z,w=aSeed.w,p=uProgress,a=p*TAU;
 float drift=fract(u+p*.37),s=drift*2.-1.,edge=smoothstep(0.,.07,drift)*(1.-smoothstep(.92,1.,drift));
 float x,y,z,light,tint,size;
 if(w<.39){
  x=(u*2.-1.)*4.1;z=v*6.7-3.6;
  float ridge=pow(.5+.5*sin(x*1.18+z*.72+a*.22),7.);
  float dune=.12*sin(x*2.6-z*1.2+a*.43)+.045*sin(x*7.5+z*3.4-a*.4),relief=.48+.44*(.5+.5*cos(a*.85));
  y=-.83+ridge*relief+dune+.018*(r-.5);light=(.30+.45*ridge+.26*r)*smoothstep(0.,.08,u)*(1.-smoothstep(.92,1.,u));
  tint=.13+.42*(.5+.5*sin(z*.43+x*.13+a*.26));size=.74+r*.67;
 }else if(w<.69){
  float strand=floor(v*32.)/31.-.5,fibre=(fract(v*32.)-.5)*.075,cross=strand+fibre,twist=drift*6.4+a*.56;
  x=s*4.1;y=.12+sin(drift*6.2-a*.48)*.69+cross*cos(twist)*.92+.045*sin(drift*24.+strand*7.-a*.9);
  z=sin(drift*4.9+a*.26)+cross*sin(twist)*1.45;y+=.10*sin(strand*8.+drift*14.+a*.4);z+=(r-.5)*.10;
  float curl=sin(p*TAU*.5)*.72;x+=cos(drift*7.2-a*.48)*curl;y+=sin(drift*7.2-a*.48)*curl*.85;
  light=(.62+1.15*pow(.5+.5*sin(drift*10.+strand*5.-a*.9),3.))*edge;
  tint=fract(.21+strand*.38+drift*.50+p*.19);size=.91+r*.82;
 }else if(w<.84){
  float strand=floor(v*28.)/27.-.5,cross=strand+(fract(v*28.)-.5)*.055;
  float arc=-.55+drift*3.9+a*.18,radius=1.08+cross*.62+.09*sin(drift*13.+a*.5+v*2.);
  x=cos(arc)*radius*1.60+sin(a*.47)*.5;y=sin(arc)*radius*.75-.25;z=cos(arc*.85+a*.3)*.85+(r-.5)*.10;
  light=(.12+.53*(sin(p*TAU*.5)*sin(p*TAU*.5)))*edge*(.60+r*.55);tint=fract(.02+drift*.6+p*.22);size=.70+r*.7;
 }else if(w<.96){
  float q=fract(u+p*.14);x=(q*2.-1.)*4.2;z=(v*2.-1.)*2.45;
  y=-.47+.20*sin(x*1.35+z*.7-a*.37)+.07*sin(x*5.1+z*2.8+a*.5)+(r-.5)*.28;
  light=(.15+.18*r)*smoothstep(0.,.08,q)*(1.-smoothstep(.92,1.,q));tint=.43+.28*(.5+.5*sin(x*.7+a*.23));size=.80+r*1.15;
 }else if(w<.985){
  float radius=sqrt(u)*.43,angle=v*TAU;
  x=sin(a*.3-.7)+cos(angle)*radius;y=.62+sin(angle)*radius;z=-2.4+r*.035;
  light=(.70+.60*(sin(p*TAU*.5)*sin(p*TAU*.5)))*(1.-u*.65);tint=.36;size=1.5+r*.75;
 }else{
  x=(u*2.-1.)*4.8;y=(v*2.-1.)*1.72;z=(r*2.-1.)*3.;x+=sin(v*7.+a*.65)*.12;y+=sin(u*9.-a*.43)*.08;
  light=.025+.07*r;tint=fract(u*.3+v*.5+p*.08);size=.7+pow(r,7.)*5.;
 }
 float yaw=-.12+.22*sin(a*.33),pitch=-.18+.055*cos(a*.5);
 vec3 pos=vec3(x,y,z);pos.xz=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*pos.xz;pos.yz=mat2(cos(pitch),-sin(pitch),sin(pitch),cos(pitch))*pos.yz;
 float depth=5.2-pos.z,aspect=uResolution.x/uResolution.y;pos.x*=min(1.,aspect/.98);
 gl_Position=vec4(pos.xy*2.6/vec2(aspect,1.)+vec2(0.,-.20)*depth,0.,depth);
 gl_PointSize=clamp(size*5.5/depth*uDpr,.65,8.*uDpr);
 vColor=colorAt(tint);vOpacity=light;
}`;
export const fragmentSource=`
precision mediump float;
varying vec3 vColor;
varying float vOpacity;
void main(){float r=length(gl_PointCoord-vec2(.5))*2.;if(r>1.)discard;float core=exp(-r*r*5.5);gl_FragColor=vec4(vColor,core*vOpacity);}
`;
export const postVertexSource=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
export const postFragmentSource=`
precision mediump float;
uniform sampler2D uImage;
uniform vec2 uTexel;
uniform float uProgress;
varying vec2 vUV;
void main(){
 vec3 fine=texture2D(uImage,vUV).rgb,glow=vec3(0.);
 for(int i=0;i<4;i++){float r=3.+float(i)*3.5;vec2 d=uTexel*r;glow+=(texture2D(uImage,vUV+vec2(d.x,d.y)).rgb+texture2D(uImage,vUV+vec2(-d.x,d.y)).rgb+texture2D(uImage,vUV+vec2(d.x,-d.y)).rgb+texture2D(uImage,vUV-d).rgb)*.0625;}
 vec2 q=vUV-vec2(.48,.42);float haze=exp(-dot(q*vec2(1.,1.5),q*vec2(1.,1.5))*6.);
 vec3 ink=vec3(.013,.033,.055)+haze*vec3(.016,.035,.041);
 float warm=exp(-dot(vUV-vec2(.75,.47),vUV-vec2(.75,.47))*16.);ink+=warm*vec3(.018,.012,.012);
 vec3 luminous=vec3(1.)-exp(-(fine*2.2+glow*4.5));
 float vignette=1.-.40*smoothstep(.15,.8,length(vUV-.5));
 gl_FragColor=vec4((ink+luminous)*vignette,1.);
}`;
