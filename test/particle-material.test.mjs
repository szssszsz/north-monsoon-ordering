import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeSeeds,field,projectField} from '../src/particleField.ts';
const seeds=makeSeeds(1024);
const point=(id,p,t=0)=>{const result=[];field(...seeds.subarray(id*4,id*4+4),p,result,t);return result};
test('the same grains keep their material, size and opacity through every gesture',()=>{
 const untouched=seeds.slice();
 for(let id=0;id<1024;id++){
  const first=point(id,0);
  for(let step=0;step<=100;step++){
   const current=point(id,step/100),screen=[];projectField(current,390,844,screen);
   assert.ok(current.every(Number.isFinite)&&screen.every(Number.isFinite));
   for(const k of [3,4,5,6])assert.equal(current[k],first[k]);
   assert.ok(current[2]<6,'projection never crosses the camera');
  }
 }
 assert.deepEqual(seeds,untouched);
});
test('chapter changes stay continuous and the flow is deterministic in both directions',()=>{
 for(let id=0;id<1024;id++)for(const p of [.09,.41,.5,.58,.91]){
  const before=point(id,p-1e-5),at=point(id,p),after=point(id,p+1e-5);
  assert.ok(Math.hypot(...before.slice(0,3).map((n,i)=>n-after[i]))<1e-6);
  point(id,.97);point(id,.12);assert.deepEqual(point(id,p),at);
 }
});
test('particles really move while the visitor holds the scroll position',()=>{
 for(const p of [0,.25,.5,.75,1]){
  let moving=0;
  for(let id=0;id<1024;id++){const a=point(id,p,5),b=point(id,p,5.1);if(Math.hypot(...a.slice(0,3).map((n,i)=>n-b[i]))>.00001)moving++;}
  assert.equal(moving,1024);
 }
});

test('every particle route closes, including during transitions, without respawning',()=>{
 for(const p of [0,.25,.5,.75,1])for(let line=0;line<84;line++){
  const a=[],b=[];field(1-1e-7,(line+.5)/84,.5,.5,p,a,0);field(1e-7,(line+.5)/84,.5,.5,p,b,0);
  assert.ok(Math.hypot(...a.slice(0,3).map((n,i)=>n-b[i]))<.0001);
 }
});
