// One fixed landscape and one travelling wind. Only scroll advances the score.
// CPU and GPU equations are generated from the same authored composition.
const {sin,cos,exp,pow,abs,floor,sqrt,max}=Math;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const fract=(n:number)=>n-Math.floor(n);
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const smoothstep=(a:number,b:number,n:number)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t)};
export function makeSeeds(count:number){
 const data=new Float32Array(count*4);let state=0x6d2b79f5;
 for(let i=0;i<data.length;i++){state=(state+0x6d2b79f5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);data[i]=((n^(n>>>14))>>>0)/4294967296;}return data;
}

function ridge(x:number){
 let a=.92*exp(-pow(abs((x+3.0)/.77),1.22));
 let b=1.30*exp(-pow(abs((x+1.35)/.80),1.18));
 let c=1.57*exp(-pow(abs((x-.55)/.71),1.16));
 let d=1.10*exp(-pow(abs((x-2.45)/.86),1.20));
 return max(max(a,b),max(c,d))+.025*sin(x*19.)+.014*sin(x*43.);
}
function curve(t:number,a:number,b:number,c:number,d:number){let k=1.-t;return k*k*k*a+3.*k*k*t*b+3.*k*t*t*c+t*t*t*d;}

export function field(u:number,v:number,r:number,w:number,p:number,out:number[]){
// A fixed geography, revealed by one travelling wind. All motion is a scroll coordinate.
let dawn=smoothstep(.10,.37,p),cloud=smoothstep(.35,.63,p),opening=smoothstep(.66,.90,p);
let x=0.,y=0.,z=0.,light=0.,tint=0.,size=0.;
if(w<.40){
 let layer=floor(v*3.),s=fract(v*3.);
 x=(u*2.-1.)*4.4;
 let profile=ridge(x+layer*.39)*(1.-layer*.12);
 z=-2.5+layer*.63+s*.55;
 y=-.28+profile*(1.-s)-s*.42-layer*.10;
 // Faceted snow and ridgelight stay attached to the same mountain throughout.
 let face=.5+.5*sin(x*6.1+s*12.+layer*2.);
 let snow=smoothstep(.25,.85,profile)*(1.-smoothstep(.08,.70,s));
 let rim=exp(-s*35.);
 let touched=dawn*smoothstep(-4.,3.,x);
 light=(.16+snow*.48+face*.16+rim*1.2)*(1.-dawn*.58+opening*.16);
 tint=mix(.10+face*.08,.51+face*.06,touched*.7);
 size=.96+r*.80;
}else if(w<.62){
 x=(u*2.-1.)*4.7;z=-.6+v*3.1;
 let phase=x*.94-z*1.26;
 let crest=pow(.5+.5*cos(phase),3.);
 y=-.86+crest*.53+.045*sin(x*2.8-z*1.5);
 let contour=pow(.5+.5*cos(phase),16.);
 let gold=smoothstep(.08,.30,p-(x+4.7)*.012);
 light=(.06+gold*(.35+contour*.70))*(1.-cloud*.73);
 tint=.49+.075*(.5+.5*sin(phase));size=.82+r*.70;
}else if(w<.80){
 // The same low cloud banks rise, then part to reveal the way home.
 x=(u*2.-1.)*4.4;z=-.6+v*2.6;
 let billow=pow(.5+.5*sin(x*1.45+z*1.1),2.);
 y=-.46+billow*.33+.08*cos(x*4.7-z*2.)+(r-.5)*.23;
 x+=opening*(x<0.?-1.:1.)*.52;
 y+=cloud*.14-opening*.14;
 let edge=pow(.5+.5*sin(x*1.45+z*1.1),8.);
 let gap=1.-opening*exp(-x*x*2.3)*.93;
 light=cloud*(.24+edge*.85+r*.10)*gap*(1.-opening*.25);
 tint=mix(.26+.55*(.5+.5*sin(z*.8+x*.26)),.53,opening*.40);
 size=.95+r*.72;
}else if(w<.92){
 // A single non-looping gust: snow -> dune -> cloud -> the light beyond.
 let head=-.03+1.22*p;
 let t=clamp(head-u*.31,0.,1.);
 let k=0.;
 if(t<.42){k=t/.42;x=curve(k,-3.4,-2.6,-1.6,.6);y=curve(k,.60,1.0,-.75,-.55);z=curve(k,-1.3,-.4,1.9,1.4);}
 else if(t<.73){k=(t-.42)/.31;x=curve(k,.6,2.6,3.0,1.3);y=curve(k,-.55,-.5,.68,.65);z=curve(k,1.4,.8,-.4,-1.2);}
 else{k=(t-.73)/.27;x=curve(k,1.3,.3,-1.0,-.55);y=curve(k,.65,.90,.70,.70);z=curve(k,-1.2,-1.7,-2.0,-2.4);}
 let spread=(.045+.13*sin(t*3.14159265))*(.35+.65*sin(u*3.14159265));
 let angle=v*6.2831853,band=sqrt(r);
 y+=cos(angle)*spread*band;z+=sin(angle)*spread*band*1.8;
 // Tiny aligned fibres, never model-to-model connecting lines.
 y+=.008*sin(t*70.+v*6.2831853);z+=.009*cos(t*63.+v*6.2831853);
 let tail=pow(1.-u,1.5),ends=smoothstep(0.,.05,t)*(1.-smoothstep(.98,1.,t));
 light=(.025+tail*.16)*ends*smoothstep(.015,.08,p)*(1.-smoothstep(.88,.97,p));
 tint=mix(.15,.53,smoothstep(.15,.50,t));size=.64+r*.65;
}else if(w<.97){
 let t=u,width=.018+pow(t,2.)*.29;
 z=-2.35+t*4.7;
 x=-.55+sin(t*5.5)*t*.62+(v-.5)*width;
 y=-.55-t*.16+(r-.5)*.025;
 light=(.025+opening*(.40+.65*(1.-abs(v-.5)*2.)))*(1.-t*.48);
 tint=.51+.045*r;size=.55+r*.65;
}else if(w<.99){
 let angle=v*6.2831853,radius=sqrt(u)*(.10+opening*.09);
 x=-.55+cos(angle)*radius;y=.70+sin(angle)*radius;z=-2.45;
 light=(.008+opening*1.20)*(1.-u*.55);tint=mix(.12,.52,opening);size=1.05+r*.60;
}else{
 x=(u*2.-1.)*5.;y=.2+v*1.2;z=-3.-r;
 light=(.02+pow(r,12.)*.32)*(1.-dawn*.80);tint=.12;size=.55+pow(r,12.)*.8;
}
out[0]=x;out[1]=y;out[2]=z;out[3]=light;out[4]=tint;out[5]=size;out[6]=w>=.97&&w<.99?1.:0.;
}
const COLORS=[[.36,.64,.78],[.73,.87,.90],[.30,.70,.64],[.94,.72,.38],[.83,.48,.42],[.55,.49,.78],[.36,.64,.78]];
export function colorAt(t:number,out:number[]){const q=clamp(t,0,.9999)*6,i=floor(q),f=q-i;for(let j=0;j<3;j++)out[j]=mix(COLORS[i][j],COLORS[i+1][j],f);}
export function projectField(point:number[],width:number,height:number,out:number[]){
 const horizontal=Math.min(1,(width/height)/1.6),depth=6.2-point[2];
 out[0]=width*.5+(point[6]?(point[0]+.55)-.55*horizontal:point[0]*horizontal)*height*1.4/depth;
 out[1]=height*.59-point[1]*height*1.4/depth;
 out[2]=Math.min(6,Math.max(.30,point[5]*5.8/depth));
}
export const vertexSource=`precision highp float;
attribute vec4 aSeed;
uniform vec2 uResolution;
uniform float uProgress,uDpr;
varying vec3 vColor;
varying float vOpacity;

float ridge(float x){
 float a=.92*exp(-pow(abs((x+3.0)/.77),1.22));
 float b=1.30*exp(-pow(abs((x+1.35)/.80),1.18));
 float c=1.57*exp(-pow(abs((x-.55)/.71),1.16));
 float d=1.10*exp(-pow(abs((x-2.45)/.86),1.20));
 return max(max(a,b),max(c,d))+.025*sin(x*19.)+.014*sin(x*43.);
}
float curve(float t,float a,float b,float c,float d){float k=1.-t;return k*k*k*a+3.*k*k*t*b+3.*k*t*t*c+t*t*t*d;}
vec3 colorAt(float t){
 float q=clamp(t,0.,.9999)*6.;
 vec3 a=vec3(.36,.64,.78),b=vec3(.73,.87,.90),c=vec3(.30,.70,.64),d=vec3(.94,.72,.38),e=vec3(.83,.48,.42),f=vec3(.55,.49,.78);
 if(q<1.)return mix(a,b,q);if(q<2.)return mix(b,c,q-1.);if(q<3.)return mix(c,d,q-2.);if(q<4.)return mix(d,e,q-3.);if(q<5.)return mix(e,f,q-4.);return mix(f,a,q-5.);
}
void main(){float u=aSeed.x,v=aSeed.y,r=aSeed.z,w=aSeed.w,p=uProgress;
// A fixed geography, revealed by one travelling wind. All motion is a scroll coordinate.
float dawn=smoothstep(.10,.37,p),cloud=smoothstep(.35,.63,p),opening=smoothstep(.66,.90,p);
float x=0.,y=0.,z=0.,light=0.,tint=0.,size=0.;
if(w<.40){
 float layer=floor(v*3.),s=fract(v*3.);
 x=(u*2.-1.)*4.4;
 float profile=ridge(x+layer*.39)*(1.-layer*.12);
 z=-2.5+layer*.63+s*.55;
 y=-.28+profile*(1.-s)-s*.42-layer*.10;
 // Faceted snow and ridgelight stay attached to the same mountain throughout.
 float face=.5+.5*sin(x*6.1+s*12.+layer*2.);
 float snow=smoothstep(.25,.85,profile)*(1.-smoothstep(.08,.70,s));
 float rim=exp(-s*35.);
 float touched=dawn*smoothstep(-4.,3.,x);
 light=(.16+snow*.48+face*.16+rim*1.2)*(1.-dawn*.58+opening*.16);
 tint=mix(.10+face*.08,.51+face*.06,touched*.7);
 size=.96+r*.80;
}else if(w<.62){
 x=(u*2.-1.)*4.7;z=-.6+v*3.1;
 float phase=x*.94-z*1.26;
 float crest=pow(.5+.5*cos(phase),3.);
 y=-.86+crest*.53+.045*sin(x*2.8-z*1.5);
 float contour=pow(.5+.5*cos(phase),16.);
 float gold=smoothstep(.08,.30,p-(x+4.7)*.012);
 light=(.06+gold*(.35+contour*.70))*(1.-cloud*.73);
 tint=.49+.075*(.5+.5*sin(phase));size=.82+r*.70;
}else if(w<.80){
 // The same low cloud banks rise, then part to reveal the way home.
 x=(u*2.-1.)*4.4;z=-.6+v*2.6;
 float billow=pow(.5+.5*sin(x*1.45+z*1.1),2.);
 y=-.46+billow*.33+.08*cos(x*4.7-z*2.)+(r-.5)*.23;
 x+=opening*(x<0.?-1.:1.)*.52;
 y+=cloud*.14-opening*.14;
 float edge=pow(.5+.5*sin(x*1.45+z*1.1),8.);
 float gap=1.-opening*exp(-x*x*2.3)*.93;
 light=cloud*(.24+edge*.85+r*.10)*gap*(1.-opening*.25);
 tint=mix(.26+.55*(.5+.5*sin(z*.8+x*.26)),.53,opening*.40);
 size=.95+r*.72;
}else if(w<.92){
 // A single non-looping gust: snow -> dune -> cloud -> the light beyond.
 float head=-.03+1.22*p;
 float t=clamp(head-u*.31,0.,1.);
 float k=0.;
 if(t<.42){k=t/.42;x=curve(k,-3.4,-2.6,-1.6,.6);y=curve(k,.60,1.0,-.75,-.55);z=curve(k,-1.3,-.4,1.9,1.4);}
 else if(t<.73){k=(t-.42)/.31;x=curve(k,.6,2.6,3.0,1.3);y=curve(k,-.55,-.5,.68,.65);z=curve(k,1.4,.8,-.4,-1.2);}
 else{k=(t-.73)/.27;x=curve(k,1.3,.3,-1.0,-.55);y=curve(k,.65,.90,.70,.70);z=curve(k,-1.2,-1.7,-2.0,-2.4);}
 float spread=(.045+.13*sin(t*3.14159265))*(.35+.65*sin(u*3.14159265));
 float angle=v*6.2831853,band=sqrt(r);
 y+=cos(angle)*spread*band;z+=sin(angle)*spread*band*1.8;
 // Tiny aligned fibres, never model-to-model connecting lines.
 y+=.008*sin(t*70.+v*6.2831853);z+=.009*cos(t*63.+v*6.2831853);
 float tail=pow(1.-u,1.5),ends=smoothstep(0.,.05,t)*(1.-smoothstep(.98,1.,t));
 light=(.025+tail*.16)*ends*smoothstep(.015,.08,p)*(1.-smoothstep(.88,.97,p));
 tint=mix(.15,.53,smoothstep(.15,.50,t));size=.64+r*.65;
}else if(w<.97){
 float t=u,width=.018+pow(t,2.)*.29;
 z=-2.35+t*4.7;
 x=-.55+sin(t*5.5)*t*.62+(v-.5)*width;
 y=-.55-t*.16+(r-.5)*.025;
 light=(.025+opening*(.40+.65*(1.-abs(v-.5)*2.)))*(1.-t*.48);
 tint=.51+.045*r;size=.55+r*.65;
}else if(w<.99){
 float angle=v*6.2831853,radius=sqrt(u)*(.10+opening*.09);
 x=-.55+cos(angle)*radius;y=.70+sin(angle)*radius;z=-2.45;
 light=(.008+opening*1.20)*(1.-u*.55);tint=mix(.12,.52,opening);size=1.05+r*.60;
}else{
 x=(u*2.-1.)*5.;y=.2+v*1.2;z=-3.-r;
 light=(.02+pow(r,12.)*.32)*(1.-dawn*.80);tint=.12;size=.55+pow(r,12.)*.8;
}

 float depth=6.2-z,aspect=uResolution.x/uResolution.y;
 float horizontal=min(1.,aspect/1.6);
 x=w>=.97&&w<.99?(x+.55)-.55*horizontal:x*horizontal;
 gl_Position=vec4(vec2(x,y)*2.8/vec2(aspect,1.)+vec2(0.,-.18)*depth,0.,depth);
 gl_PointSize=clamp(size*5.8/depth*uDpr,.80,6.*uDpr);
 vColor=colorAt(tint);vOpacity=light;
}`;
export const fragmentSource=`precision mediump float;
varying vec3 vColor;varying float vOpacity;
void main(){float r=length(gl_PointCoord-vec2(.5))*2.;if(r>1.)discard;float core=exp(-r*r*5.);gl_FragColor=vec4(vColor,core*vOpacity);}
`;
export const postVertexSource=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
export const postFragmentSource=`precision mediump float;
uniform sampler2D uImage;uniform vec2 uTexel;uniform float uProgress;
varying vec2 vUV;
void main(){
 vec3 fine=texture2D(uImage,vUV).rgb,glow=vec3(0.);
 for(int i=0;i<4;i++){float r=2.+float(i)*3.;vec2 d=uTexel*r;glow+=(texture2D(uImage,vUV+d).rgb+texture2D(uImage,vUV+vec2(-d.x,d.y)).rgb+texture2D(uImage,vUV+vec2(d.x,-d.y)).rgb+texture2D(uImage,vUV-d).rgb)*.0625;}
 float dawn=smoothstep(.10,.37,uProgress),opening=smoothstep(.66,.90,uProgress);
 vec2 q=vUV-vec2(.52,.43);float haze=exp(-dot(q*vec2(1.,1.5),q*vec2(1.,1.5))*9.);
 vec3 ink=vec3(.020,.045,.071)+haze*mix(vec3(.012,.025,.035),vec3(.036,.026,.019),dawn);
 ink+=opening*vec3(.04,.020,.005)*exp(-dot(q*vec2(2.,1.),q*vec2(2.,1.))*28.);
 vec3 light=vec3(1.)-exp(-(fine*2.5+glow*3.2));
 float vignette=1.-.38*smoothstep(.2,.76,length(vUV-.5));
 gl_FragColor=vec4((ink+light)*vignette,1.);
}`;
