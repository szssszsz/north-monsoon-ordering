import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeSeeds,field,projectField} from '../src/particleField.ts';
import {installTestAtlas} from './artist-atlas.mjs';

installTestAtlas();
const seeds=makeSeeds(1024);
const point=(id,p)=>{const result=[];field(...seeds.subarray(id*4,id*4+4),p,result);return result};
test('every persistent grain moves through every movement without opacity or size substitution',()=>{
 const untouched=seeds.slice();
 for(let id=0;id<1024;id++){
  const first=point(id,0);
  for(let step=0;step<=100;step++){
   const current=point(id,step/100),screen=[];projectField(current,390,844,screen);
   assert.ok(current.every(Number.isFinite)&&screen.every(Number.isFinite));
   assert.equal(current[3],first[3],`grain ${id}: animated opacity`);
   assert.equal(current[5],first[5],`grain ${id}: animated size`);
   assert.ok(current[3]>=.14,'every grain remains lit');
   assert.ok(current.slice(7,10).every(n=>n>=0&&n<=1),'paint stays in gamut');
  }
  for(let act=0;act<3;act++){
   const a=point(id,act/3),b=point(id,(act+1)/3);
   assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])>.00001,`grain ${id}: static substitute in act ${act}`);
  }
 }
 assert.deepEqual(seeds,untouched);
});
test('the transport has no jump at any movement boundary, and reverses exactly',()=>{
 for(let id=0;id<1024;id++)for(const p of [1/3,2/3]){
  const before=point(id,p-1e-5),at=point(id,p),after=point(id,p+1e-5);
  assert.ok(Math.hypot(...before.slice(0,3).map((n,i)=>n-after[i]))<1e-7);
  point(id,.97);point(id,.12);assert.deepEqual(point(id,p),at);
 }
});
test('the same material carries the paintings colours into the next landscape',()=>{
 let changed=0;for(let id=0;id<1024;id++){const a=point(id,0),b=point(id,1);if(Math.hypot(...a.slice(7,10).map((n,i)=>n-b[7+i]))>.001)changed++;}
 assert.ok(changed>900);
});
