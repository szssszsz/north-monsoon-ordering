import {field,projectField} from './particleField';

// A bounded pixel splat avoids thousands of overlapping canvas paths on phones.
type Raster={width:number;height:number;energy:Float32Array;image:ImageData;canvas:HTMLCanvasElement;context:CanvasRenderingContext2D};
const rasters=new WeakMap<CanvasRenderingContext2D,Raster>();
export function drawSoftwareField(c:CanvasRenderingContext2D,width:number,height:number,progress:number,seeds:Float32Array){
 const scale=width>700?.8:1,w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
 let raster=rasters.get(c);
 if(!raster||raster.width!==w||raster.height!==h){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const context=canvas.getContext('2d')!;
  raster={width:w,height:h,energy:new Float32Array(w*h*3),image:context.createImageData(w,h),canvas,context};rasters.set(c,raster);
 }
 const energy=raster.energy;energy.fill(0);
 const world:number[]=[],screen:number[]=[];
 for(let i=0;i<seeds.length;i+=4){
  field(seeds[i],seeds[i+1],seeds[i+2],seeds[i+3],progress,world);
  if(world[3]<.005)continue;
  projectField(world,width,height,screen);
  const x=screen[0]*scale,y=screen[1]*scale,ix=Math.floor(x),iy=Math.floor(y);
  if(ix<0||ix>=w-1||iy<0||iy>=h-1)continue;
  const rgb=[world[7],world[8],world[9]];
  const dx=x-ix,dy=y-iy,power=world[3]*Math.min(2.5,screen[2]*screen[2])*.95;
  const pixel=(iy*w+ix)*3;
  const a=(1-dx)*(1-dy)*power,b=dx*(1-dy)*power,d=(1-dx)*dy*power,e=dx*dy*power;
  for(let j=0;j<3;j++){energy[pixel+j]+=rgb[j]*a;energy[pixel+3+j]+=rgb[j]*b;energy[pixel+w*3+j]+=rgb[j]*d;energy[pixel+w*3+3+j]+=rgb[j]*e;}
 }
 const pixels=raster.image.data;
 for(let i=0,j=0;i<energy.length;i+=3,j+=4){for(let k=0;k<3;k++){const value=energy[i+k]*7.0;pixels[j+k]=255*value/(1+value)}pixels[j+3]=255;}
 raster.context.putImageData(raster.image,0,0);
 const background=c.createRadialGradient(width*.48,height*.57,0,width*.48,height*.57,width*.78);
 const warm=Math.max(0,Math.min(1,(progress-.66)/.24)),grade=warm*warm*(3-2*warm);
 background.addColorStop(0,`rgb(${17+10*grade},${39+2*grade},${55-7*grade})`);background.addColorStop(.48,'#091a2a');background.addColorStop(1,'#040d18');
 c.globalCompositeOperation='source-over';c.fillStyle=background;c.fillRect(0,0,width,height);
 c.globalCompositeOperation='screen';c.drawImage(raster.canvas,0,0,width,height);
 c.globalAlpha=.25;c.filter='blur(2.4px)';c.drawImage(raster.canvas,0,0,width,height);
 c.filter='none';c.globalAlpha=1;c.globalCompositeOperation='source-over';
}
