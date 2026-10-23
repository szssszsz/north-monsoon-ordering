import {installArtistAtlas} from './particleField';

async function pixels(url:string,signal:AbortSignal){
 const response=await fetch(url,{signal});if(!response.ok)throw Error('Landscape material unavailable');
 const blob=await response.blob();let image:ImageBitmap|HTMLImageElement;
 if(typeof createImageBitmap==='function')image=await createImageBitmap(blob,{premultiplyAlpha:'none',colorSpaceConversion:'none'});
 else{
  const address=URL.createObjectURL(blob);
  try{image=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=address})}finally{URL.revokeObjectURL(address)}
 }
 try{
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(image,0,0);
  return {width:canvas.width,height:canvas.height,data:context.getImageData(0,0,canvas.width,canvas.height).data};
 }finally{if('close' in image)image.close()}
}
export async function loadArtistAtlas(signal:AbortSignal){
 const [placement,pigment]=await Promise.all([pixels('/art/landscape-transport-v1.png',signal),pixels('/art/landscape-pigments-v1.png',signal)]);
 if(pigment.width!==placement.width*2||pigment.height!==placement.height)throw Error('Landscape material dimensions differ');
 return installArtistAtlas({placement:placement.data,pigment:pigment.data,width:placement.width,height:placement.height});
}
