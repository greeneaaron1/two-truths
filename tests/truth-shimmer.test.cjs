const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(reduced=false){
  const events={},animations=[];
  const motion={matches:reduced,addEventListener:(name,fn)=>{events.motionChange=fn}};
  const word={addEventListener:(name,fn)=>{events[name]=fn},animate:(frames,options)=>{
    let finish,reject;
    const finished=new Promise((resolve,fail)=>{finish=resolve;reject=fail});
    const animation={finished,finish,options,cancelled:false,cancel(){this.cancelled=true;reject(new Error('Cancelled'))}};
    animations.push(animation);return animation;
  }};
  vm.runInNewContext(fs.readFileSync('dist/truth-shimmer.js','utf8'),{
    document:{querySelector:()=>word},
    window:{matchMedia:query=>query.includes('reduced-motion')?motion:{matches:true}}
  });
  return {events,animations,motion};
}

test('a quick hover exit finishes the sweep without cancelling or repeating it',async()=>{
  const {events,animations}=setup();
  animations[0].finish();await Promise.resolve();
  events.pointerenter();
  const sweep=animations[1];
  events.pointerleave();
  assert.equal(sweep.cancelled,false);
  sweep.finish();await Promise.resolve();
  assert.equal(animations.length,2);
});

test('entering during a sweep keeps it intact, repeats on hover, and stops after exit',async()=>{
  const {events,animations}=setup();
  events.pointerenter();
  assert.equal(animations.length,1);
  animations[0].finish();await Promise.resolve();
  assert.equal(animations.length,2);
  events.pointerleave();events.pointerenter();
  assert.equal(animations.length,2);
  events.pointerleave();animations[1].finish();await Promise.resolve();
  assert.equal(animations.length,2);
});

test('reduced motion prevents sweeps and cancels an active sweep when enabled',async()=>{
  const off=setup(true);off.events.pointerenter();
  assert.equal(off.animations.length,0);
  const on=setup();on.motion.matches=true;on.events.motionChange();
  await Promise.resolve();
  assert.equal(on.animations[0].cancelled,true);
  assert.equal(on.animations.length,1);
});
