"""Bake a point transport atlas from the four original paintings, without editing them.

The Hilbert quantile assigns one persistent material coordinate to each grain.
All four targets carry the same number of grains; no scene masks or alpha fades.
Offline authoring dependency: Pillow and NumPy. No Python runs on the website.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
source=np.asarray(Image.open(ROOT/'art-source/monsoon-master.png').convert('RGB'))
height,width=source.shape[:2]
GRID=256
SAMPLE=512
rank=np.arange(SAMPLE*SAMPLE,dtype=np.int64)
t=rank.copy();hx=np.zeros_like(t);hy=np.zeros_like(t);step=1
while step<SAMPLE:
 rx=1&(t//2);ry=1&(t^rx);flip=ry==0;reflect=flip&(rx==1)
 hx=np.where(reflect,step-1-hx,hx);hy=np.where(reflect,step-1-hy,hy)
 ox=hx.copy();hx=np.where(flip,hy,hx);hy=np.where(flip,ox,hy)
 hx+=step*rx;hy+=step*ry;t//=4;step*=2
W=GRID*2
placement=np.full((W,W,4),255,dtype=np.uint8)
pigment=np.full((W,W*2,4),255,dtype=np.uint8)
for scene in range(4):
 tilex=scene%2;tiley=scene//2
 px=np.minimum(width//2-1,((hx+.5)/SAMPLE*(width//2)).astype(int))+tilex*(width//2)
 py=np.minimum(height//2-1,((hy+.5)/SAMPLE*(height//2)).astype(int))+tiley*(height//2)
 rgb=source[py,px].astype(float)/255
 lum=rgb@np.array([.2126,.7152,.0722])
 # Deep ink becomes true negative space; fine bright brushwork holds the light.
 energy=np.maximum(0,lum-.070)**1.15
 edge=np.minimum.reduce([(hx+.5)/SAMPLE,(SAMPLE-hx-.5)/SAMPLE,(hy+.5)/SAMPLE,(SAMPLE-hy-.5)/SAMPLE])
 energy*=np.clip(edge/.13,0,1)**1.7
 radius=((hx/SAMPLE-.5)/.58)**2+((hy/SAMPLE-.52)/.65)**2
 energy*=np.clip((1.25-radius)/.42,0,1)**1.5
 mass=np.cumsum(energy);quantiles=(np.arange(GRID*GRID)+.5)/(GRID*GRID)*mass[-1]
 index=np.searchsorted(mass,quantiles)
 xx=(hx[index]+.5)/SAMPLE;yy=(hy[index]+.5)/SAMPLE
 x16=np.round(xx*65535).astype(np.uint16);y16=np.round((1-yy)*65535).astype(np.uint16)
 # A continuous near/far relief, not a collection of separate models.
 depth=np.clip(.22+.54*yy+.12*lum[index],0,1)
 color=rgb[index]
 color=color/np.maximum(color.max(axis=1,keepdims=True),.01)
 color=np.clip(color*.82+.025,0,1)
 row=np.arange(GRID*GRID)//GRID+tiley*GRID;col=np.arange(GRID*GRID)%GRID+tilex*GRID
 placement[row,col,0]=x16>>8;placement[row,col,1]=y16>>8;placement[row,col,2]=np.round(depth*255).astype(np.uint8)
 pigment[row,col,:3]=np.round(color*255).astype(np.uint8)
 pigment[row,col+W,0]=x16&255;pigment[row,col+W,1]=y16&255;pigment[row,col+W,2]=0
out=ROOT/'public/art'
out.mkdir(parents=True,exist_ok=True)
Image.fromarray(placement).save(out/'landscape-transport-v1.png',compress_level=9)
Image.fromarray(pigment).save(out/'landscape-pigments-v1.png',compress_level=9)
print('Baked four paintings into one material atlas:',GRID*GRID,'transport nodes per painting.')
