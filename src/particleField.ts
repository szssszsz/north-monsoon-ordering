// One material population, transported through four original landscape paintings.
// The Hilbert material coordinate keeps neighbouring light-grains travelling together.
export type PixelArray=Uint8Array|Uint8ClampedArray;
export type ArtistAtlas={placement:PixelArray;pigment:PixelArray;width:number;height:number};
let atlas:ArtistAtlas|null=null;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ease=(t:number)=>t*t*t*(t*(t*6-15)+10);
export function installArtistAtlas(value:ArtistAtlas){
 if(value.width!==512||value.height!==512||value.placement.length!==512*512*4||value.pigment.length!==1024*512*4)throw Error('Invalid landscape material');
 atlas=value;return value;
}
export function makeSeeds(count:number){
 const data=new Float32Array(count*4);let state=0x6d2b79f5;
 for(let i=0;i<data.length;i++){state=(state+0x6d2b79f5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);data[i]=((n^(n>>>14))>>>0)/4294967296;}return data;
}
const nodeA:number[]=[],nodeB:number[]=[],shapeA:number[]=[],shapeB:number[]=[];
function node(index:number,stage:number,out:number[]){
 const data=atlas!,grid=256;
 const x=index%grid+(stage%2)*grid,y=Math.floor(index/grid)+Math.floor(stage/2)*grid;
 const high=(y*512+x)*4,paint=(y*1024+x)*4,low=paint+512*4;
 const nx=(data.placement[high]*256+data.pigment[low])/65535*2-1;
 const ny=(data.placement[high+1]*256+data.pigment[low+1])/65535*2-1;
 const z=data.placement[high+2]/255*1.6-.8+stage*.05,depth=6.6-z;
 out[0]=nx*3*depth/6.6;out[1]=ny*2*depth/6.6;out[2]=z;
 out[3]=data.pigment[paint]/255;out[4]=data.pigment[paint+1]/255;out[5]=data.pigment[paint+2]/255;
}
function material(u:number,v:number,r:number,w:number,stage:number,out:number[]){
 const q=Math.fround(u*65535),i=Math.floor(q);let t=q-i;
 node(i,stage,nodeA);node(Math.min(65535,i+1),stage,nodeB);
 // Preserve open sky around a moon or bird instead of drawing a bridge across it.
 if(Math.hypot(nodeA[0]-nodeB[0],nodeA[1]-nodeB[1])>.025)t=t<.5?0:1;
 for(let j=0;j<6;j++)out[j]=mix(nodeA[j],nodeB[j],t);
 const depth=6.6-out[2],thickness=(r-.5)*.18;
 out[0]=out[0]*(depth-thickness)/depth+(v-.5)*.012;
 out[1]=out[1]*(depth-thickness)/depth+(w-.5)*.008;out[2]+=thickness;
}
export function field(u:number,v:number,r:number,w:number,p:number,out:number[]){
 if(!atlas)throw Error('Landscape material is not ready');
 p=clamp(p,0,1);const phase=p*3,stage=Math.min(2,Math.floor(phase)),s=ease(phase-stage);
 material(u,v,r,w,stage,shapeA);material(u,v,r,w,stage+1,shapeB);
 const x=mix(shapeA[0],shapeB[0],s),y=mix(shapeA[1],shapeB[1],s),z=mix(shapeA[2],shapeB[2],s);
 const curl=Math.sin(s*Math.PI),dx=shapeB[0]-shapeA[0],dy=shapeB[1]-shapeA[1];
 out[0]=x-curl*dy*.12;out[1]=y+curl*dx*.065;
 out[2]=z+curl*.38*Math.sin(x*1.2+y*.7);
 // A grain never fades out, changes population, or resets its material identity.
 out[3]=.14+.18*r;out[4]=p;out[5]=.62+.46*w;out[6]=0;
 out[7]=mix(shapeA[3],shapeB[3],s);out[8]=mix(shapeA[4],shapeB[4],s);out[9]=mix(shapeA[5],shapeB[5],s);
}
export function projectField(point:number[],width:number,height:number,out:number[]){
 const focal=Math.min(width*.94/6,height*.50/4)*6.6,depth=6.6-point[2];
 out[0]=width*(width>700?.62:.5)+point[0]*focal/depth;
 out[1]=height*(width>700?.58:.60)-point[1]*focal/depth;
 out[2]=Math.min(5,Math.max(.30,point[5]*5.8/depth));
}
export const vertexSource=`precision highp float;
attribute vec4 aSeed;uniform vec2 uResolution;uniform float uProgress,uDpr;
uniform sampler2D uPlacement,uPigment;
varying vec3 vColor;varying float vOpacity;
float ease(float t){return t*t*t*(t*(t*6.-15.)+10.);}
void node(float index,float stage,out vec3 pos,out vec3 pigment){
 vec2 pixel=vec2(mod(index,256.)+mod(stage,2.)*256.,floor(index/256.)+floor(stage/2.)*256.);
 vec2 uv=(pixel+.5)/512.;vec3 high=texture2D(uPlacement,uv).rgb*255.;
 vec2 low=texture2D(uPigment,uv*vec2(.5,1.)+vec2(.5,0.)).rg*255.;
 pigment=texture2D(uPigment,uv*vec2(.5,1.)).rgb;
 vec2 xy=(high.rg*256.+low)/65535.*2.-1.;float z=high.b/255.*1.6-.8+stage*.05;
 pos=vec3(xy*vec2(3.,2.)*(6.6-z)/6.6,z);
}
void material(float u,float v,float r,float w,float stage,out vec3 pos,out vec3 pigment){
 float q=u*65535.,i=floor(q),t=q-i;vec3 a,b,ca,cb;
 node(i,stage,a,ca);node(min(65535.,i+1.),stage,b,cb);
 if(length(a.xy-b.xy)>.025)t=t<.5?0.:1.;
 pos=mix(a,b,t);float depth=6.6-pos.z,thickness=(r-.5)*.18;
 pos.xy=pos.xy*(depth-thickness)/depth+vec2((v-.5)*.012,(w-.5)*.008);pos.z+=thickness; pigment=mix(ca,cb,t);
}
void main(){
 float u=aSeed.x,v=aSeed.y,r=aSeed.z,w=aSeed.w,p=clamp(uProgress,0.,1.);
 float phase=p*3.,stage=min(2.,floor(phase)),s=ease(phase-stage);
 vec3 a,b,ca,cb;material(u,v,r,w,stage,a,ca);material(u,v,r,w,stage+1.,b,cb);
 vec3 pos=mix(a,b,s);float curl=sin(s*3.14159265359),wave=sin(pos.x*1.2+pos.y*.7);
 pos.xy+=curl*vec2(-(b.y-a.y)*.12,(b.x-a.x)*.065);
 pos.z+=curl*.38*wave;
 float depth=6.6-pos.z,focal=min(uResolution.x*.94/6.,uResolution.y*.50/4.)*6.6;
 vec2 centre=vec2(uResolution.x>700.?.24:0.,uResolution.x>700.?-.16:-.20);
 gl_Position=vec4(pos.xy*focal*2./uResolution+centre*depth,0.,depth);
 gl_PointSize=clamp((.62+.46*w)*5.8/depth*uDpr,.65,5.*uDpr);
 vOpacity=.14+.18*r;vColor=mix(ca,cb,s);
}`;
export const fragmentSource=`precision mediump float;varying vec3 vColor;varying float vOpacity;
void main(){float r=length(gl_PointCoord-vec2(.5))*2.;if(r>1.)discard;gl_FragColor=vec4(vColor,exp(-r*r*5.)*vOpacity);}`;
export const postVertexSource=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
export const postFragmentSource=`precision mediump float;
uniform sampler2D uImage;uniform vec2 uTexel;uniform float uProgress;varying vec2 vUV;
void main(){
 vec3 fine=texture2D(uImage,vUV).rgb,glow=vec3(0.);
 for(int i=0;i<4;i++){float r=2.+float(i)*2.5;vec2 d=uTexel*r;glow+=(texture2D(uImage,vUV+d).rgb+texture2D(uImage,vUV+vec2(-d.x,d.y)).rgb+texture2D(uImage,vUV+vec2(d.x,-d.y)).rgb+texture2D(uImage,vUV-d).rgb)*.0625;}
 vec2 q=vUV-vec2(.62,.40);float haze=exp(-dot(q*vec2(1.,1.5),q*vec2(1.,1.5))*10.);
 vec3 ink=vec3(.010,.025,.044)+haze*mix(vec3(.009,.020,.026),vec3(.026,.019,.009),uProgress);
 vec3 light=vec3(1.)-exp(-(fine*4.2+glow*4.0));
 gl_FragColor=vec4((ink+light)*(1.-.28*smoothstep(.23,.82,length(vUV-.5))),1.);
}`;
