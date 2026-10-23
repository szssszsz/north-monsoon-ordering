import {field,projectField,colour,clamp} from './particleField';
// Tangent-aligned traces of the same grains; batch by colour on software devices.
type Surface={canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;positions:Float32Array;progress:number;time:number};
const surfaces=new WeakMap<CanvasRenderingContext2D,Surface>();
const palette=Array.from({length:48},(_,i)=>{const c:number[]=[];colour(i/47,c);return `rgb(${c.map(n=>Math.round(n*255)).join(',')})`});
export function drawSoftwareField(c:CanvasRenderingContext2D,width:number,height:number,progress:number,seeds:Float32Array,time=0){
 let surface=surfaces.get(c);
 if(!surface){const canvas=document.createElement('canvas');surface={canvas,context:canvas.getContext('2d')!,positions:new Float32Array(0),progress:-1,time:-1};surfaces.set(c,surface);}
 const layer=surface.canvas,ink=surface.context;
 if(layer.width!==Math.round(width)||layer.height!==Math.round(height)){layer.width=Math.round(width);layer.height=Math.round(height);surface.progress=-1;}
 ink.clearRect(0,0,width,height);
 const count=seeds.length/4,reset=surface.positions.length!==count*2||Math.abs(progress-surface.progress)>.07||time<=surface.time;
 if(surface.positions.length!==count*2)surface.positions=new Float32Array(count*2);
 const previous=surface.positions;
 const paths=Array.from({length:192},()=>new Path2D()),stars=Array.from({length:192},()=>new Path2D());
 const a:number[]=[],b:number[]=[],sa:number[]=[],sb:number[]=[];
 for(let i=0;i<seeds.length;i+=4){
  const u=seeds[i],v=seeds[i+1],r=seeds[i+2],w=seeds[i+3];
  field(u,v,r,w,progress,a,time);projectField(a,width,height,sa);
  if(reset){field(u+.0004,v,r,w,progress,b,time);projectField(b,width,height,sb)}
  else{sb[0]=sa[0]+(sa[0]-previous[i/2]);sb[1]=sa[1]+(sa[1]-previous[i/2+1]);}
  previous[i/2]=sa[0];previous[i/2+1]=sa[1];
  const x=sa[0],y=sa[1];if(x<-10||x>width+10||y<-10||y>height+10)continue;
  let dx=sb[0]-x,dy=sb[1]-y;const length=Math.hypot(dx,dy);if(length>width*.1||length<1e-6)continue;
  const scale=(.9+3.6*w*w)*Math.sqrt(clamp(8/(7.8-a[2]),.55,2.3))/length;dx*=scale;dy*=scale;
  const rawHue=clamp(.08+progress*.68+a[4]*.15+.08*Math.sin(a[6]*Math.PI*2)),hue=rawHue+(.995-rawHue)*a[7];
  const power=clamp(a[9]/1.2),level=Math.min(3,Math.floor(power*4)),bucket=Math.min(47,Math.floor(hue*48))*4+level,path=(r>.993?stars:paths)[bucket];
  path.moveTo(x-dx*.5,y-dy*.5);path.lineTo(x+dx*.5,y+dy*.5);
 }
 ink.globalCompositeOperation='lighter';ink.lineCap='round';
 for(let i=0;i<192;i++){const light=[.30,.52,.78,1.0][i%4];ink.strokeStyle=palette[Math.floor(i/4)];ink.lineWidth=.9;ink.globalAlpha=light;ink.stroke(paths[i]);ink.lineWidth=1.25;ink.globalAlpha=Math.min(1,light*1.5);ink.stroke(stars[i]);}
 const bg=c.createRadialGradient(width*.5,height*.54,0,width*.5,height*.54,width*.65);
 bg.addColorStop(0,progress<.65?'#06111d':'#11100c');bg.addColorStop(.55,'#020711');bg.addColorStop(1,'#010308');
 c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle=bg;c.fillRect(0,0,width,height);
 c.globalCompositeOperation='screen';c.drawImage(layer,0,0,width,height);c.globalAlpha=.90;c.filter='blur(7px)';c.drawImage(layer,0,0,width,height);
 c.filter='none';c.globalAlpha=1;c.globalCompositeOperation='source-over';surface.progress=progress;surface.time=time;
}
