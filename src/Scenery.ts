import {morphWeight} from './particleModel';

type V=[number,number,number];
type RGB=[number,number,number];
type Material={color:RGB;metal?:number;alpha?:number;snow?:boolean};
type Face={p:V[];depth:number;color:string};
type WorldFace={p:V[];color:string};
const PI=Math.PI,TAU=PI*2;
const gold:Material={color:[182,139,75],metal:1};
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const cloudSurfaces=new WeakMap<CanvasRenderingContext2D,HTMLCanvasElement|OffscreenCanvas>();
const geometryCaches=new WeakMap<CanvasRenderingContext2D,Map<string,WorldFace[]>>();

/** Projected surfaces, atmospheric volumes and their highlights share the particle camera.
 * There is deliberately no clock: the complete composition is a pure scroll sample. */
export function drawScenery(c:CanvasRenderingContext2D,width:number,height:number,scene:number,travel:number,placement:number[],mode:string){
 c.clearRect(0,0,width,height);
 if(mode==='seal')return;
 const spin=.08+Math.sin(travel*.78)*.26,tilt=-.26+Math.sin(travel*.65)*.065,roll=Math.sin(travel*.9)*.035;
 const cx=Math.cos(spin),sx=Math.sin(spin),cy=Math.cos(tilt),sy=Math.sin(tilt),cz=Math.cos(roll),sz=Math.sin(roll),scale=placement[2];
 const rotate=(v:V):V=>{let [x,y,z]=v;const xx=cx*x+sx*z;z=-sx*x+cx*z;x=xx;const yy=cy*y+sy*z;z=-sy*y+cy*z;y=yy;return [(cz*x+sz*y)*scale,(-sz*x+cz*y)*scale,z*scale]};
 const project=(v:V):V=>{const [x,y,z]=rotate(v),d=4.6-z;return [(x*2.7/(width/height)/d+placement[0]+1)*width*.5,(1-y*2.7/d-placement[1])*height*.5,z]};
 const index=Math.floor(scene),mix=morphWeight(scene);
 let geometryCache=geometryCaches.get(c);if(!geometryCache){geometryCache=new Map();geometryCaches.set(c,geometryCache);}
 c.save();c.globalAlpha=mode==='hero'?.12:1;
 render(index,1-mix);if(mix>0)render(Math.min(5,index+1),mix);
 c.restore();

 function render(chapter:number,opacity:number){
  if(opacity<.001)return;c.save();c.globalAlpha*=opacity;
  const worldFaces:WorldFace[]=[];let meshNumber=0;
  function polygon(p:V[],material:Material){
   const u=p[1].map((v,i)=>v-p[0][i]),v=p[2].map((v,i)=>v-p[0][i]);
   const n:V=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;
   const normal=n.map(v=>v/len),light=Math.abs(normal[0]*-.52+normal[1]*.79+normal[2]*.32);
   const centre=p.reduce((a,v)=>a.map((n,i)=>n+v[i]/p.length) as V,[0,0,0] as V);
   const spec=material.metal?(Math.pow(Math.abs(normal[0]*.77+normal[1]*.31+normal[2]*.55),24)*1.15+Math.pow(Math.abs(normal[0]*.12+normal[1]*.87+normal[2]*.48),70)*.9)*material.metal:0;
   let base=material.color;
   if(material.snow){const snow=clamp((centre[1]-.02)*2.7+light*.35);base=base.map((v,i)=>v*(1-snow)+[198,222,230][i]*snow) as RGB;}
   const rgb=base.map((v,i)=>Math.round(clamp(v*(.32+light*.66)+spec*[228,225,212][i],0,255)));
   worldFaces.push({p,color:`rgba(${rgb.join(',')},${material.alpha??1})`});
  }
  function surface(fn:(u:number,v:number)=>V,nu:number,nv:number,mat:Material,facets=false,dynamic=false){
   const key=`${chapter}:surface:${meshNumber++}:${nu}:${nv}`,cached=dynamic?undefined:geometryCache!.get(key);if(cached){worldFaces.push(...cached);return;}const start=worldFaces.length;
   const grid:V[][]=[];for(let i=0;i<=nu;i++){grid[i]=[];for(let j=0;j<=nv;j++)grid[i][j]=fn(i/nu,j/nv);}
   for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=grid[i][j],b=grid[i+1][j],d=grid[i][j+1],e=grid[i+1][j+1];if(facets){polygon([a,b,e],mat);polygon([a,e,d],mat)}else polygon([a,b,e,d],mat);}
   if(!dynamic)geometryCache!.set(key,worldFaces.slice(start));
  }
  function flush(){
   const projected=new Map<V,V>(),faces:Face[]=worldFaces.map(f=>{const p=f.p.map(v=>{let q=projected.get(v);if(!q){q=project(v);projected.set(v,q)}return q});return {p,depth:p.reduce((s,v)=>s+v[2],0)/p.length,color:f.color}});
   faces.sort((a,b)=>a.depth-b.depth);
   for(const f of faces){c.beginPath();f.p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();c.fillStyle=f.color;c.strokeStyle=f.color;c.lineWidth=.4;c.fill();c.stroke();}worldFaces.length=0;
  }
  function curve(points:V[],color:string,lineWidth=1){
   c.beginPath();points.map(project).forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=lineWidth;c.stroke();
  }
  function ring(x:number,y:number,z:number,r:number,color:string,zScale=1){curve(Array.from({length:129},(_,i)=>{const a=i/128*TAU;return [x+Math.cos(a)*r,y,z+Math.sin(a)*r*zScale] as V}),color,1);}
  function halo(pos:V,size:number,color:string,strength=.6){
   const p=project(pos),r=size*scale*height*1.35/(4.6-p[2]),g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],r);
   g.addColorStop(0,`rgba(${color}${strength})`);g.addColorStop(.25,`rgba(${color}${strength*.18})`);g.addColorStop(1,`rgba(${color}0)`);c.fillStyle=g;c.fillRect(p[0]-r,p[1]-r,r*2,r*2);
  }
  function mountains(backdrop=false){
   const nu=width<640?44:68,nv=width<640?22:34;
   surface((u,v)=>{const x=u*3.8-1.9,z=v*2.28-1.14;let y=Math.max(0,1.55-Math.abs(x+.85)*1.45-Math.abs(z-.15)*.48,1.35-Math.abs(x-.48)*1.21-Math.abs(z+.25)*.60,1.02-Math.abs(x-1.38)*1.7-Math.abs(z-.5)*.65)-.61;y+=.055*Math.sin(x*12+z*10)+.025*Math.cos(x*25-z*15);return backdrop?[x*.75,y*.65+.1,z*.3-1.6]:[x,y,z]},nu,nv,{color:backdrop?[40,68,82]:[47,88,110],snow:true},true);
  }
  function ribbon(high=false){
   surface((u,v)=>{const x=u*4.2-2.1,s=v*2-1;
    return high?[x,1.02-x*.11+Math.sin(x*1.8+travel*.48+s*3)*.18+s*.19,s*.96+Math.cos(x*1.4+travel*.72)*.22]:[x,.20+Math.sin(x*1.65+travel*.22)*.4+s*.25*Math.cos(x*.9+travel*.4),Math.cos(x*1.15+travel*.14)*.68+s*.26*Math.sin(x*.9+travel*.4)];
   },140,20,{color:high?[77,146,166]:[55,154,144],metal:.78,alpha:high?.16:.96},false,true);
  }
  function lathe(x:number,y:number,z:number,profile:[number,number][],mat:Material,rz=1,transform?:(v:V)=>V){
   const key=`${chapter}:lathe:${meshNumber++}`,cached=transform?undefined:geometryCache!.get(key);if(cached){worldFaces.push(...cached);return;}const start=worldFaces.length;
   for(let j=0;j<profile.length-1;j++)for(let i=0;i<80;i++){
    const a=i/80*TAU,b=(i+1)/80*TAU,[r0,y0]=profile[j],[r1,y1]=profile[j+1];
    const p:V[]=[[Math.cos(a)*r0,y0,Math.sin(a)*r0*rz],[Math.cos(b)*r0,y0,Math.sin(b)*r0*rz],[Math.cos(b)*r1,y1,Math.sin(b)*r1*rz],[Math.cos(a)*r1,y1,Math.sin(a)*r1*rz]].map(v=>{const t=transform?transform(v as V):v;return [t[0]+x,t[1]+y,t[2]+z] as V});
    polygon(p,mat);
   }
   if(!transform)geometryCache!.set(key,worldFaces.slice(start));
  }
  function plate(x:number,y:number,z:number,r:number){
   lathe(x,y,z,[[.01,0],[r*.7,0],[r*.82,.025],[r,.075],[r,.095],[r*.82,.065],[r*.66,.03],[.01,.03]],{color:[143,171,180],metal:.68},.78);
  }
  function glass(x:number,y:number,z:number,s=1){
   lathe(x,y,z,[[.01,0],[.23*s,0],[.23*s,.025*s],[.04*s,.055*s],[.025*s,.08*s],[.022*s,.55*s],[.07*s,.58*s],[.16*s,.63*s],[.255*s,.72*s],[.29*s,.86*s],[.30*s,.92*s]],{color:[91,161,174],metal:.78,alpha:.7});
  }
  function cloud(x:number,y:number,z:number,r:number,tint:RGB){
   const p=project([x,y,z]),radius=r*scale*height*1.35/(4.6-p[2]);
   const g=c.createRadialGradient(p[0]-radius*.23,p[1]-radius*.45,radius*.04,p[0],p[1],radius);
   g.addColorStop(0,`rgba(${tint.join(',')},.72)`);g.addColorStop(.50,`rgba(${tint.map(v=>Math.round(v*.92)).join(',')},.68)`);g.addColorStop(.83,`rgba(${tint.map(v=>Math.round(v*.76)).join(',')},.38)`);g.addColorStop(1,`rgba(${tint.map(v=>Math.round(v*.70)).join(',')},0)`);
   c.fillStyle=g;c.fillRect(p[0]-radius,p[1]-radius,radius*2,radius*2);
  }
  function clouds(low=false,base=low?-.65:-.15){
   const list: {p:V;r:number;t:RGB}[]=[];
   for(let i=0;i<13;i++){
    const x=(i/12-.5)*3.6,y=base+Math.sin(i*1.7)*.12,z=Math.sin(i*2.1)*.48;
    for(let j=0;j<4;j++){const a=j*2.4;list.push({p:[x+Math.cos(a)*.15,y+Math.sin(a)*.11,z+j*.12],r:(.34+(Math.sin(i*4+j*1.7)+1)*.075)*(low?.68:1),t:i<5?[166,191,210]:i<9?[196,191,208]:[218,205,190]});}
   }
   list.sort((a,b)=>rotate(a.p)[2]-rotate(b.p)[2]);
   const volumes=list.map(v=>{const p=project(v.p);return {x:p[0],y:p[1],r:v.r*scale*height*1.35/(4.6-p[2])}});
   const left=Math.min(...volumes.map(p=>p.x-p.r)),right=Math.max(...volumes.map(p=>p.x+p.r)),top=Math.min(...volumes.map(p=>p.y-p.r)),bottom=Math.max(...volumes.map(p=>p.y+p.r));
   let sheet=cloudSurfaces.get(c);
   if(!sheet){if(typeof OffscreenCanvas!=='undefined')sheet=new OffscreenCanvas(width,height);else if(c.canvas.ownerDocument)sheet=c.canvas.ownerDocument.createElement('canvas');if(sheet)cloudSurfaces.set(c,sheet);}
   const fog=sheet?.getContext('2d') as CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|null;
   if(sheet&&fog){
    if(sheet.width!==width)sheet.width=width;if(sheet.height!==height)sheet.height=height;fog.clearRect(0,0,width,height);
    fog.save();fog.beginPath();for(const p of volumes){fog.moveTo(p.x+p.r,p.y);fog.arc(p.x,p.y,p.r,0,TAU)}fog.clip();
    const mist=fog.createLinearGradient(0,top,0,bottom);mist.addColorStop(0,'#dce5e900');mist.addColorStop(.24,'#c3d1dc9e');mist.addColorStop(.44,'#a9becbd1');mist.addColorStop(.72,'#687f9770');mist.addColorStop(1,'#32496000');
    fog.fillStyle=mist;fog.fillRect(left,top,right-left,bottom-top);
    const light=fog.createLinearGradient(left,0,right,0);light.addColorStop(0,'#b4e6ef12');light.addColorStop(.5,'#d1bce61d');light.addColorStop(1,'#f4d6ad40');fog.fillStyle=light;fog.fillRect(left,top,right-left,bottom-top);fog.restore();
    c.save();c.filter=`blur(${Math.max(5,height*.012)}px)`;c.drawImage(sheet,0,0);c.restore();
    c.save();c.globalAlpha*=.20;list.forEach(v=>cloud(...v.p,v.r,v.t));c.restore();
   }else list.forEach(v=>cloud(...v.p,v.r,v.t));
  }
  function cutlery(x:number,y:number,z:number){
   for(const side of [-1,1])lathe(x+side*.29,y,z,[[.009,-.14],[.012,.14]],gold);
   curve([[x-.29,y+.14,z],[x-.29,y+.23,z]],'#e5c584',1.5);
  }
  if(chapter===0){
   halo([-1.4,1.15,-.5],.85,'229,190,132,',.5);halo([1,.35,-1],1.2,'90,160,199,',.16);
   mountains();ribbon(true);flush();
   for(let i=0;i<4;i++)curve(Array.from({length:120},(_,j)=>{const x=j/119*4.2-2.1,s=(i/3*2-1);return [x,1.02-x*.11+Math.sin(x*1.8+travel*.48+s*3)*.18+s*.19,s*.96+Math.cos(x*1.4+travel*.72)*.22] as V}),i===0?'#e4c995aa':'#b3e8ef55',.6);
   clouds(true);
  }else if(chapter===1){
   halo([-.8,.9,-1],1.2,'219,185,124,',.25);
   surface((u,v)=>{const x=u*4.3-2.15,z=v*2.5-1.25;return [x,-.76+.12*Math.sin(x*3+z*4+travel*.288),z]},width<640?60:90,width<640?28:40,{color:[153,119,75],metal:.14},false,true);ribbon();flush();
   for(const s of [-1,1])curve(Array.from({length:151},(_,j)=>{const x=j/150*4.2-2.1;return [x,.2+Math.sin(x*1.65+travel*.22)*.4+s*.25*Math.cos(x*.9+travel*.4),Math.cos(x*1.15+travel*.14)*.68+s*.26*Math.sin(x*.9+travel*.4)] as V}),'#edd8a9b3',1.1);
  }else if(chapter===2){
   halo([.95,.65,-1.3],1.3,'235,173,147,',.42);mountains(true);flush();
   const sun=project([.95,.65,-1.3]),r=height*.045*scale;c.fillStyle='#ead3b3';c.beginPath();c.arc(sun[0],sun[1],r,0,TAU);c.fill();
   clouds();
   for(let i=0;i<5;i++)curve(Array.from({length:130},(_,j)=>{const x=j/129*3.8-1.9;return [x,-.46+i*.025+Math.sin(x*3+i*.7+travel*.2)*.035,(i-2)*.25] as V}),`rgba(199,188,216,${.15-i*.018})`,.7);
  }else if(chapter===3){
   halo([0,.05,-.6],1.5,'118,183,191,',.12);
   for(let i=0;i<3;i++)plate((i-1)*1.25,-.64,0,.5);
   lathe(-1.25,-.43,0,[[.14,0],[.17,.1],[.20,.3],[.25,.6],[.33,.94],[.34,.97]],{color:[115,190,202],metal:.75,alpha:.88});
   glass(0,-.54,0,1.15);
   lathe(1.25,-.5,0,[[.08,0],[.12,.05],[.15,.23],[.26,.3],[.38,.44],[.42,.5]],{color:[187,169,209],metal:.8},.9);flush();
   ring(-1.25,.54,0,.34,'#c0edf0c0');ring(0,.52,0,.345,'#e7dcb9c0');ring(1.25,0,0,.42,'#e5cae7b0',.9);
   for(let i=0;i<4;i++)cloud(-1.25+Math.sin(i*2)*.12,.56+i*.06,Math.cos(i*2)*.1,.14,[170,213,222]);
   for(let i=0;i<6;i++)cloud(1.25+Math.cos(i*2.4)*.16,.08+Math.sin(i*2.4)*.08,Math.sin(i*2.4)*.16,.18,[222,204,224]);
  }else if(chapter===4){
   halo([0,.4,-1],1.7,'231,192,128,',.28);
   lathe(0,-.72,0,[[.01,0],[1.94,0],[1.96,.06],[1.94,.11],[.01,.11]],{color:[33,59,68],metal:.45},.55);
   plate(0,-.17,0,1.19);
   lathe(0,-.61,0,[[.30,0],[.31,.035],[.15,.10],[.085,.35],[.21,.42]],gold,.8);
   for(const x of [-1.5,1.5])glass(x,-.56,0,1);
   const open=clamp((travel-4)/.52),transform=(v:V):V=>[v[0],v[1]*Math.cos(open*.7)-v[2]*Math.sin(open*.7)+open*.52,v[1]*Math.sin(open*.7)+v[2]*Math.cos(open*.7)-open*.2];
   const profile:[number,number][]=[];for(let j=0;j<=56;j++){const a=j/56*PI*.5;profile.push([Math.sin(a)*1.07,.02+Math.cos(a)*.81]);}
   lathe(0,0,0,profile,gold,.62,transform);
   lathe(0,0,0,[[.01,.84],[.07,.86],[.10,.91],[.07,.96],[.01,.97]],gold,1,transform);flush();
   const signature=project(transform([0,.39,.55])),edge=project(transform([.3,.39,.55]));
   c.save();c.translate(signature[0],signature[1]);c.rotate(Math.atan2(edge[1]-signature[1],edge[0]-signature[0]));c.fillStyle='#f3e3ba8c';c.font=`${Math.max(8,height*scale*.018)}px Georgia,serif`;c.textAlign='center';c.fillText('N O R T H   M O N S O O N',0,0);c.restore();
   ring(0,-.075,0,1.19,'#e3ce9ccc',.78);
   if(open>.05){c.save();c.globalAlpha*=open;for(let i=0;i<8;i++)cloud(Math.sin(i*2.4)*.47,-.12+Math.cos(i)*.08,Math.cos(i*2.4)*.25,.23,[218,220,212]);c.restore();}
  }else{
   halo([0,.45,-1.7],1.2,'237,203,146,',.32);mountains(true);
   for(const z of [-1.0,-1.15])surface((u,v)=>{const a=u*PI;return [Math.cos(a)*(1.27+v*.10),.42+Math.sin(a)*(.92+v*.07),z]},100,1,gold);
   for(const x of [-1.27,1.27])surface((u,v)=>[x+(u-.5)*.10,-.65+v*1.07,-1.04],1,16,gold);
   surface((u,v)=>[(u-.5)*3.5,-.7,(v-.5)*2.1],1,1,{color:[45,62,71],metal:.2});
   lathe(0,-.62,.15,[[.01,0],[1.0,0],[1.03,.035],[1.02,.11],[.01,.11]],{color:[187,181,162],metal:.3},.61);
   lathe(0,-1.17,.15,[[.23,0],[.24,.05],[.12,.12],[.08,.54],[.01,.56]],gold);
   for(const x of [-.52,.52]){plate(x,-.49,.23,.25);glass(x*1.35,-.48,-.1,.57);cutlery(x,-.44,.23);}
   flush();ring(0,-.5,.15,1.02,'#e4c891b3',.61);
   clouds(true,-1.05);
  }
  c.restore();
 }
}
