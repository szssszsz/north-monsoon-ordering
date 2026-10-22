// Geometry and colour are pure functions of the scroll coordinate. No clock, randomness or idle drift.
const TAU=Math.PI*2;
export const SCENES=6;
export function morphWeight(scene:number){const f=scene-Math.floor(scene),start=Math.floor(scene)===4?.58:.22,end=Math.floor(scene)===4?.96:.82,x=Math.max(0,Math.min(1,(f-start)/(end-start)));return x*x*(3-2*x)}
const PALETTES=[
 [[.33,.75,.87],[.62,.69,.96],[.91,.96,1],[.91,.78,.51]],
 [[.20,.67,.65],[.42,.83,.78],[.88,.73,.43],[.96,.88,.66]],
 [[.46,.72,.91],[.70,.60,.90],[.92,.77,.86],[.89,.94,1]],
 [[.35,.76,.83],[.72,.65,.96],[.92,.78,.49],[.97,.90,.73]],
 [[.34,.71,.71],[.84,.72,.49],[1,.89,.67],[.69,.73,.94]],
 [[.28,.64,.82],[.55,.57,.92],[.84,.77,.57],[.99,.89,.66]],
];
export function palette(stage:number,s:number,out:number[]){const colors=PALETTES[Math.max(0,Math.min(5,stage))],v=Math.max(0,Math.min(2.99999,s*3)),i=Math.floor(v),f=v-i;for(let n=0;n<3;n++)out[n]=colors[i][n]*(1-f)+colors[i+1][n]*f}
export function shape(stage:number,u:number,v:number,w:number,travel:number,out:number[]){
 const a=u*TAU,s=v*2-1,t=travel*2.4;
 let x=0,y=0,z=0;
 if(stage===0){
  x=u*3.8-1.9;z=s*1.14;
  y=Math.max(0,1.55-Math.abs(x+.85)*1.45-Math.abs(z-.15)*.48,1.35-Math.abs(x-.48)*1.21-Math.abs(z+.25)*.60,1.02-Math.abs(x-1.38)*1.7-Math.abs(z-.5)*.65)-.61;
  y+=.055*Math.sin(x*12+z*10)+.025*Math.cos(x*25-z*15);
  if(w>.67){x=((u+travel*.035)%1)*4.4-2.2;y=1.02-x*.11+Math.sin(x*1.8+t*.2+s*3)*.18+s*.19;z=s*.96+Math.cos(x*1.4+t*.3)*.22;}
  if(w>.96){x=-1.58+Math.sin(a)*(.04+v*.12);y=1.2+Math.cos(a)*(.04+v*.12);z=s*.13;}
 }else if(stage===1){
  const r=1.04+.19*Math.sin(a*3+t*.22)+s*.19;
  x=Math.cos(a)*r;y=.34*Math.sin(a*2+t*.22)+s*.28;z=Math.sin(a)*r*.83;
  y+=.06*Math.sin(a*8+s*5);if(w<.22){x=u*3.8-1.9;z=s*1.1;y=-.76+.12*Math.sin(x*3+z*4+t*.12);}
  if(w>.90){x=(u*2-1)*2.1;y=.6-x*.18+.12*Math.sin(x*2+s+t*.15);z=s*.9;}
 }else if(stage===2){
  const lobe=Math.min(6,Math.floor(u*7)),theta=(u*7%1)*TAU,arc=.15+lobe/6*(Math.PI-.3),root=Math.sqrt(Math.max(0,1-s*s));
  x=Math.cos(arc)*1.22+Math.cos(theta)*root*.36;y=.04+Math.sin(arc)*.6+s*.30+.055*Math.cos(theta*4);z=Math.sin(theta)*root*.37+Math.cos(arc*2)*.2;
  if(w>.77){x=(u*2-1)*1.82;z=s*.82;y=-.42+.09*Math.sin(x*3+z*4+t*.18)+.07*Math.cos(x*7+z*2);}
  if(w>.94){const r=1.65+s*.035;x=Math.cos(a)*r;y=-.66;z=Math.sin(a)*r*.52;}
 }else if(stage===3){
  const group=Math.min(2,Math.floor(u*3)),theta=(u*3%1)*TAU;
  if(group===0){const r=.13+.22*Math.pow(v,.6);x=-1.25+Math.cos(theta)*r;y=-.42+v*.97;z=Math.sin(theta)*r+.065*Math.sin(v*10+t*.12);}
  if(group===1){const b=s*TAU*1.3+theta*.22+t*.16;x=Math.cos(b)*(.24+.045*s);y=s*.65;z=Math.sin(b)*.30;}
  if(group===2){const r=.33+.13*Math.cos(theta*5);x=1.25+Math.cos(theta)*r;y=.04+s*.13+.25*(1-Math.cos(theta*5))*.5+v*.14;z=Math.sin(theta)*r;}
  if(w>.79){const r=.49+s*.026;x=(group-1)*1.25+Math.cos(theta)*r;y=-.64+(w-.8)*.13;z=Math.sin(theta)*r*.75;}
 }else if(stage===4){
  const open=Math.max(0,Math.min(1,(travel-4)/.52)),phi=v*Math.PI*.5;
  x=Math.cos(a)*Math.sin(phi)*1.07;y=.02+Math.cos(phi)*.81;z=Math.sin(a)*Math.sin(phi)*.66;
  if(w<.52){const yy=y; y=y*Math.cos(open*.7)-z*Math.sin(open*.7)+open*.52;z=yy*Math.sin(open*.7)+z*Math.cos(open*.7)-open*.20;}
  if(w>.48&&w<.52){x=Math.cos(a)*.13;y=.93+Math.sin(a)*.085+open*.49;z=s*.035-open*.22;}
  if(w>=.52&&w<.72){const r=1.15+s*.05;x=Math.cos(a)*r;y=-.17+Math.sin(s*Math.PI)*.045;z=Math.sin(a)*r*.65;}
  if(w>=.72){const side=u<.5?-1:1,theta=(u*2%1)*TAU;let r=.28*Math.sqrt(Math.max(0,1-Math.pow(1-v,2)));x=side*1.50+Math.cos(theta)*r;y=.04+v*.33;z=Math.sin(theta)*r;
   if(w>.90){x=side*1.50;y=-.52+v*.56;z=s*.025;}
   if(w>.96){x=side*1.50+Math.cos(theta)*.22;y=-.55;z=Math.sin(theta)*.16;}
  }
 }else{
  let r=1.02+s*.045;x=Math.cos(a)*r;y=Math.sin(a)*r;z=.09*Math.sin(a*8);
  if(w>.28&&w<.52){r=.80+.035*Math.cos(a*12)+s*.018;x=Math.cos(a)*r;y=Math.sin(a)*r;z=.08*Math.cos(a*12);}
  if(w>=.52&&w<.78){const angle=Math.floor(u*8)*TAU/8,len=v*.73,side=(w-.65)*.34*(1-v);x=Math.sin(angle)*len+Math.cos(angle)*side;y=Math.cos(angle)*len-Math.sin(angle)*side;z=.13;}
  if(w>=.78){x=Math.cos(a)*1.34;y=Math.sin(a)*.43;z=Math.sin(a)*1.04;}
 }
 out[0]=x;out[1]=y;out[2]=z;
}
export const vertexSource=`
precision highp float;
attribute vec4 aSeed;
uniform vec2 uResolution;
uniform vec4 uPlacement;
uniform float uScroll,uScene,uDpr;
varying vec3 vColor;
varying float vLight,vOpacity;
const float TAU=6.28318530718;
vec3 colorAt(float stage,float s){
 vec3 a,b,c,d;
 if(stage<.5){a=vec3(.33,.75,.87);b=vec3(.62,.69,.96);c=vec3(.91,.96,1.);d=vec3(.91,.78,.51);}
 else if(stage<1.5){a=vec3(.20,.67,.65);b=vec3(.42,.83,.78);c=vec3(.88,.73,.43);d=vec3(.96,.88,.66);}
 else if(stage<2.5){a=vec3(.46,.72,.91);b=vec3(.70,.60,.90);c=vec3(.92,.77,.86);d=vec3(.89,.94,1.);}
 else if(stage<3.5){a=vec3(.35,.76,.83);b=vec3(.72,.65,.96);c=vec3(.92,.78,.49);d=vec3(.97,.90,.73);}
 else if(stage<4.5){a=vec3(.34,.71,.71);b=vec3(.84,.72,.49);c=vec3(1.,.89,.67);d=vec3(.69,.73,.94);}
 else{a=vec3(.28,.64,.82);b=vec3(.55,.57,.92);c=vec3(.84,.77,.57);d=vec3(.99,.89,.66);}
 float k=clamp(s,0.,.99999)*3.;if(k<1.)return mix(a,b,k);if(k<2.)return mix(b,c,k-1.);return mix(c,d,k-2.);
}
vec3 shape(float stage,float u,float v,float w,float travel){
 float a=u*TAU,s=v*2.-1.,t=travel*2.4;vec3 p=vec3(0.);
 if(stage<.5){
  p.x=u*3.8-1.9;p.z=s*1.14;
  p.y=max(0.,max(1.55-abs(p.x+.85)*1.45-abs(p.z-.15)*.48,max(1.35-abs(p.x-.48)*1.21-abs(p.z+.25)*.60,1.02-abs(p.x-1.38)*1.7-abs(p.z-.5)*.65)))-.61+.055*sin(p.x*12.+p.z*10.)+.025*cos(p.x*25.-p.z*15.);
  if(w>.67){p.x=fract(u+travel*.035)*4.4-2.2;p.y=1.02-p.x*.11+sin(p.x*1.8+t*.2+s*3.)*.18+s*.19;p.z=s*.96+cos(p.x*1.4+t*.3)*.22;}
  if(w>.96)p=vec3(-1.58+sin(a)*(.04+v*.12),1.2+cos(a)*(.04+v*.12),s*.13);
 }else if(stage<1.5){
  float r=1.04+.19*sin(a*3.+t*.22)+s*.19;p=vec3(cos(a)*r,.34*sin(a*2.+t*.22)+s*.28+.06*sin(a*8.+s*5.),sin(a)*r*.83);
  if(w<.22){p.x=u*3.8-1.9;p.z=s*1.1;p.y=-.76+.12*sin(p.x*3.+p.z*4.+t*.12);}
  if(w>.90){p.x=(u*2.-1.)*2.1;p.y=.6-p.x*.18+.12*sin(p.x*2.+s+t*.15);p.z=s*.9;}
 }else if(stage<2.5){
  float lobe=min(6.,floor(u*7.)),theta=fract(u*7.)*TAU,arc=.15+lobe/6.*(TAU*.5-.3),root=sqrt(max(0.,1.-s*s));
  p=vec3(cos(arc)*1.22+cos(theta)*root*.36,.04+sin(arc)*.6+s*.30+.055*cos(theta*4.),sin(theta)*root*.37+cos(arc*2.)*.2);
  if(w>.77){p.x=(u*2.-1.)*1.82;p.z=s*.82;p.y=-.42+.09*sin(p.x*3.+p.z*4.+t*.18)+.07*cos(p.x*7.+p.z*2.);}
  if(w>.94){float r=1.65+s*.035;p=vec3(cos(a)*r,-.66,sin(a)*r*.52);}
 }else if(stage<3.5){
  float group=min(2.,floor(u*3.)),theta=fract(u*3.)*TAU;
  if(group<.5){float r=.13+.22*pow(v,.6);p=vec3(-1.25+cos(theta)*r,-.42+v*.97,sin(theta)*r+.065*sin(v*10.+t*.12));}
  else if(group<1.5){float b=s*TAU*1.3+theta*.22+t*.16;p=vec3(cos(b)*(.24+.045*s),s*.65,sin(b)*.30);}
  else{float r=.33+.13*cos(theta*5.);p=vec3(1.25+cos(theta)*r,.04+s*.13+.25*(1.-cos(theta*5.))*.5+v*.14,sin(theta)*r);}
  if(w>.79){float r=.49+s*.026;p=vec3((group-1.)*1.25+cos(theta)*r,-.64+(w-.8)*.13,sin(theta)*r*.75);}
 }else if(stage<4.5){
  float open=clamp((travel-4.)/.52,0.,1.),phi=v*TAU*.25;p=vec3(cos(a)*sin(phi)*1.07,.02+cos(phi)*.81,sin(a)*sin(phi)*.66);
  if(w<.52){float yy=p.y;p.y=p.y*cos(open*.7)-p.z*sin(open*.7)+open*.52;p.z=yy*sin(open*.7)+p.z*cos(open*.7)-open*.20;}
  if(w>.48&&w<.52)p=vec3(cos(a)*.13,.93+sin(a)*.085+open*.49,s*.035-open*.22);
  if(w>=.52&&w<.72){float r=1.15+s*.05;p=vec3(cos(a)*r,-.17+sin(s*TAU*.5)*.045,sin(a)*r*.65);}
  if(w>=.72){float side=u<.5?-1.:1.,theta=fract(u*2.)*TAU,r=.28*sqrt(max(0.,1.-pow(1.-v,2.)));p=vec3(side*1.50+cos(theta)*r,.04+v*.33,sin(theta)*r);
   if(w>.90)p=vec3(side*1.50,-.52+v*.56,s*.025);
   if(w>.96)p=vec3(side*1.50+cos(theta)*.22,-.55,sin(theta)*.16);
  }
 }else{
  float r=1.02+s*.045;p=vec3(cos(a)*r,sin(a)*r,.09*sin(a*8.));
  if(w>.28&&w<.52){r=.80+.035*cos(a*12.)+s*.018;p=vec3(cos(a)*r,sin(a)*r,.08*cos(a*12.));}
  if(w>=.52&&w<.78){float angle=floor(u*8.)*TAU/8.,len=v*.73,side=(w-.65)*.34*(1.-v);p=vec3(sin(angle)*len+cos(angle)*side,cos(angle)*len-sin(angle)*side,.13);}
  if(w>=.78)p=vec3(cos(a)*1.34,sin(a)*.43,sin(a)*1.04);
 }
 return p;
}
void main(){
 float index=floor(uScene),f=fract(uScene);f=index==4.?smoothstep(.58,.96,f):smoothstep(.22,.82,f);
 vec3 p=mix(shape(index,aSeed.x,aSeed.y,aSeed.w,uScroll),shape(min(5.,index+1.),aSeed.x,aSeed.y,aSeed.w,uScroll),f);
 float spin=.08+sin(uScroll*.78)*.26,tilt=-.26+sin(uScroll*.65)*.065,roll=sin(uScroll*.9)*.035;
 p.xz=mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*p.xz;
 p.yz=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p.yz;
 p.xy=mat2(cos(roll),-sin(roll),sin(roll),cos(roll))*p.xy;p*=uPlacement.z;
 float depth=4.6-p.z,aspect=uResolution.x/uResolution.y;
 gl_Position=vec4(p.xy*2.7/vec2(aspect,1.)+uPlacement.xy*depth,0.,depth);
 gl_PointSize=clamp((1.1+aSeed.z*1.8)*4.7/depth*uDpr,1.,7.*uDpr);
 float tint=fract(aSeed.y*.61+aSeed.x*.24+aSeed.w*.23);
 vColor=mix(colorAt(index,tint),colorAt(min(5.,index+1.),tint),f);
 vLight=.40+.48*smoothstep(-1.8,1.8,p.z);vOpacity=uPlacement.w;
}`;
export const fragmentSource=`
precision mediump float;
varying vec3 vColor;
varying float vLight,vOpacity;
void main(){
 float r=length(gl_PointCoord-vec2(.5))*2.;if(r>1.)discard;
 vec3 color=mix(vColor,vec3(1.),exp(-r*r*18.)*.23);
 gl_FragColor=vec4(color,(exp(-r*r*5.2)*.89+exp(-r*r*1.8)*.08)*vLight*vOpacity);
}`;
