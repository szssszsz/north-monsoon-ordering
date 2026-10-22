import {field,colorAt,projectField} from './particleField';
export function drawSoftwareField(c:CanvasRenderingContext2D,width:number,height:number,progress:number,seeds:Float32Array){
 const background=c.createRadialGradient(width*.48,height*.57,0,width*.48,height*.57,width*.78);
 background.addColorStop(0,'#102c39');background.addColorStop(.48,'#071b2a');background.addColorStop(1,'#030a13');
 c.globalCompositeOperation='source-over';c.fillStyle=background;c.fillRect(0,0,width,height);
 const buckets:number[][]=Array.from({length:144},()=>[]),world:number[]=[],screen:number[]=[],rgb:number[]=[];
 for(let i=0;i<seeds.length;i+=4){
  field(seeds[i],seeds[i+1],seeds[i+2],seeds[i+3],progress,world);projectField(world,width,height,screen);
  const [x,y,size]=screen;if(x< -12||x>width+12||y< -12||y>height+12||world[3]<.002)continue;
  const color=Math.min(11,Math.floor(world[4]*12)),light=Math.min(3,Math.floor(world[3]*5.5)),radius=Math.min(2,Math.floor(size*1.25));
  buckets[(color*4+light)*3+radius].push(x,y,Math.max(.30,size*.62));
 }
 c.globalCompositeOperation='lighter';
 for(let k=0;k<buckets.length;k++){
  const points=buckets[k];if(!points.length)continue;
  const light=Math.floor(k/3)%4,tint=Math.floor(k/12);colorAt((tint+.5)/12,rgb);const color=rgb.map(v=>Math.round(v*255)).join(',');
  c.fillStyle=`rgba(${color},${.24+light*.20})`;c.beginPath();
  for(let i=0;i<points.length;i+=3){const x=points[i],y=points[i+1],r=points[i+2];c.moveTo(x+r,y);c.arc(x,y,r,0,Math.PI*2)}c.fill();
  c.fillStyle=`rgba(${color},${.025+light*.012})`;c.beginPath();
  for(let i=0;i<points.length;i+=9){const x=points[i],y=points[i+1],r=points[i+2]*3.4;c.moveTo(x+r,y);c.arc(x,y,r,0,Math.PI*2)}c.fill();
 }
 c.globalCompositeOperation='source-over';
}
