import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeSeeds,field,colorAt,projectField} from '../src/particleField.ts';

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
   assert.ok(current[3]>=.16,'every grain remains lit');
  }
  for(let act=0;act<4;act++){
   const a=point(id,act/4),b=point(id,(act+1)/4);
   assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])>.00001,`grain ${id}: static substitute in act ${act}`);
  }
  assert.ok(point(id,1)[4]>first[4],'the same grain carries the colour change');
 }
 assert.deepEqual(seeds,untouched);
});
test('the transport has no jump at any movement boundary, and reverses exactly',()=>{
 for(let id=0;id<1024;id++)for(const p of [.25,.5,.75]){
  const before=point(id,p-1e-5),at=point(id,p),after=point(id,p+1e-5);
  assert.ok(Math.hypot(...before.slice(0,3).map((n,i)=>n-after[i]))<1e-7);
  point(id,.97);point(id,.12);assert.deepEqual(point(id,p),at);
 }
});
test('the continuous colour grade stays in gamut',()=>{
 const rgb=[];for(let i=0;i<=1000;i++){colorAt(i/1000,rgb);assert.ok(rgb.every(n=>Number.isFinite(n)&&n>=0&&n<=1))}
});
