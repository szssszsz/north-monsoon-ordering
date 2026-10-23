import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {installArtistAtlas} from '../src/particleField.ts';

// The authoring files are opaque RGBA8 PNG data textures, with no colour profile.
function pixels(file){
 const data=readFileSync(file),chunks=[];let width=0,height=0;
 for(let offset=8;offset<data.length;){const n=data.readUInt32BE(offset),tag=data.toString('ascii',offset+4,offset+8),body=data.subarray(offset+8,offset+8+n);if(tag==='IHDR'){width=body.readUInt32BE(0);height=body.readUInt32BE(4);if(body[8]!==8||body[9]!==6||body[12]!==0)throw Error('Expected RGBA8 data texture')}if(tag==='IDAT')chunks.push(body);offset+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks)),out=new Uint8Array(width*height*4),stride=width*4;let source=0;
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c};
 for(let y=0;y<height;y++){const filter=raw[source++];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?out[i-4]:0,b=y?out[i-stride]:0,c=y&&x>=4?out[i-stride-4]:0;const prediction=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):NaN;if(!Number.isFinite(prediction))throw Error('Invalid PNG filter');out[i]=(raw[source++]+prediction)&255;}}
 return {data:out,width,height};
}
export function installTestAtlas(){
 const placement=pixels(new URL('../public/art/landscape-transport-v1.png',import.meta.url)),pigment=pixels(new URL('../public/art/landscape-pigments-v1.png',import.meta.url));
 return installArtistAtlas({placement:placement.data,pigment:pigment.data,width:placement.width,height:placement.height});
}
