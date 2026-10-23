import {field,projectField,colour,clamp} from './particleField';
// Tangent-aligned traces of the same grains; batch by colour on software devices.
type Surface={canvas:HTMLCanvasElement;context:CanvasRenderingContext2D};
const surfaces=new WeakMap<CanvasRenderingContext2D,Surface>();
const palette=Array.from({length:48},(_,i)=>{const c:number[]=[];colour(i/47,c);return `rgb(${c.map(n=>Math.round(n*255)).join(',')})`});
export function drawSoftwareField(c:CanvasRenderingContext2D,width:number,height:number,progress:number,seeds:Float32Array,time=0){
 let surface=surfaces.get(c);
 if(!surface){const canvas=document.createElement('canvas');surface={canvas,context:canvas.getContext('2d')!};surfaces.set(c,surface);}
 const layer=surface.canvas,ink=surface.context;
 if(layer.width!==Math.round(width)||layer.height!==Math.round(height)){layer.width=Math.round(width);layer.height=Math.round(height);}
 ink.clearRect(0,0,width,height);
 const paths=Array.from({length:48},()=>new Path2D()),stars=Array.from({length:48},()=>new Path2D());
 const a:number[]=[],b:number[]=[],sa:number[]=[],sb:number[]=[];
 for(let i=0;i<seeds.length;i+=4){
  const u=seeds[i],v=seeds[i+1],r=seeds[i+2],w=seeds[i+3];
  field(u,v,r,w,progress,a,time);field(u+.0004,v,r,w,progress,b,time);
  projectField(a,width,height,sa);projectField(b,width,height,sb);
  const x=sa[0],y=sa[1];if(x<-10||x>width+10||y<-10||y>height+10)continue;
  let dx=sb[0]-x,dy=sb[1]-y;const length=Math.hypot(dx,dy);if(length>width*.1||length<1e-6)continue;
  const scale=(1.5+3.8*w)/length;dx*=scale;dy*=scale;
  const hue=clamp(.06+progress*.64+a[4]*.12+.08*Math.sin(a[6]*Math.PI*2));
  const bucket=Math.min(47,Math.floor(hue*48)),path=(r>.985?stars:paths)[bucket];
  path.moveTo(x-dx*.5,y-dy*.5);path.lineTo(x+dx*.5,y+dy*.5);
 }
 ink.globalCompositeOperation='lighter';ink.lineCap='round';
 for(let i=0;i<48;i++){ink.strokeStyle=palette[i];ink.lineWidth=.75;ink.globalAlpha=.58;ink.stroke(paths[i]);ink.lineWidth=1.2;ink.globalAlpha=.85;ink.stroke(stars[i]);}
 const bg=c.createRadialGradient(width*.5,height*.54,0,width*.5,height*.54,width*.65);
 bg.addColorStop(0,progress<.6?'#061520':'#151511');bg.addColorStop(.55,'#030a12');bg.addColorStop(1,'#01050a');
 c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle=bg;c.fillRect(0,0,width,height);
 c.globalCompositeOperation='screen';c.drawImage(layer,0,0,width,height);c.globalAlpha=.65;c.filter='blur(5px)';c.drawImage(layer,0,0,width,height);
 c.filter='none';c.globalAlpha=1;c.globalCompositeOperation='source-over';
}
