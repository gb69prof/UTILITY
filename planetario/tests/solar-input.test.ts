import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SolarController,type SolarEnvelope,type SolarAction} from '../src/core/solar-controller.ts';
import {SolarGestures,keyAction} from '../src/input/solar-gestures.ts';
import {Clock} from '../src/physics/clock.ts';
import {initialView,reduceView} from '../src/core/solar-view.ts';

test('all screen sources select without travel or time change; explicit focus pauses',()=>{
  for(const source of ['mouse','touch','keyboard','ui'] as const){
    const s=new SolarController(0);s.clock.play(0);const before={...s.view};
    for(let i=1;i<=20;i++){const e:SolarEnvelope={action:{type:'selectBody',bodyId:'moon'},source,inputSessionId:'test',sequence:i,actionId:`test:${i}`,realNowMs:i};assert.equal(s.dispatch(e),true);assert.equal(s.dispatch(e),false);}
    assert.equal(s.selections,20);assert.deepEqual(s.view,before);assert.equal(s.clock.sample(20).status,'running');
    s.send({type:'focusBody',bodyId:'moon'},source,21);assert.equal(s.view.focus,'moon');assert.equal(s.clock.sample(21).status,'paused');
    s.send({type:'overview'},source,22);assert.equal(s.selected,'moon');assert.equal(s.view.focus,null);assert.equal(s.infoOpen,true);
    s.send({type:'closeInfo'},source,23);assert.equal(s.selected,'moon');assert.equal(s.infoOpen,false);
  }
});
test('invalid, stale and disposed astronomical commands cannot mutate state',()=>{
  const s=new SolarController(0),before={...s.view};
  for(const a of [{type:'panView',right:NaN,up:1},{type:'panView',right:1,up:0,aspect:Infinity},{type:'selectBody',bodyId:'pluto'},{type:'seekTime',tTdbSeconds:1296001},{type:'orbitView'},{type:'unknown'}] as SolarAction[])assert.equal(s.send(a,'ui',1),false);
  assert.deepEqual(s.view,before);assert.equal(s.accepted,0);s.dispose();assert.equal(s.send({type:'overview'},'ui',2),false);
});
test('tap threshold, return drag, pan tool, third finger and cancellation never trigger false selection',()=>{
  const g=new SolarGestures();
  for(let i=0;i<20;i++){g.down(1,10,10);assert.equal(g.up(1,12,12),true);}
  g.down(1,0,0);assert.deepEqual(g.move(1,7,0,100,100),[]);g.move(1,8,0,100,100);g.move(1,0,0,100,100);assert.equal(g.up(1,0,0),false);
  g.down(1,0,0,true);assert.equal(g.up(1,0,0),false);
  g.down(1,0,0);g.down(2,100,0);g.down(3,200,0);assert.deepEqual(g.move(3,210,0,100,100),[]);
  for(const id of [3,2,1])assert.equal(g.up(id,0,0),false);
  for(const reason of ['pointercancel','lost capture','blur','resize']){g.down(1,0,0);g.cancel();assert.equal(g.up(1,0,0),false,reason);assert.deepEqual(g.move(1,10,0,100,100),[]);}
});
test('two-finger centroid and pinch use viewport fractions and exclude travel',()=>{
  const g=new SolarGestures();g.down(1,0,0);g.down(2,100,0);
  const a=g.move(2,200,20,1000,500);assert.deepEqual(a[0],{type:'panView',right:-.05,up:.02});
  assert.ok(a[1]?.type==='zoomView'&&a[1].logDistanceDelta<0);
  assert.equal(g.up(2,200,20),false);assert.deepEqual(g.move(1,10,0,1000,500),[]);assert.equal(g.up(1,10,0),false);
});
test('equal fractional drags match across viewport sizes and keyboard pan remains scale dependent',()=>{
  const drag=(w:number,h:number)=>{const g=new SolarGestures();g.down(1,0,0,true);return g.move(1,w/10,h/10,w,h);};
  assert.deepEqual(drag(1000,500),drag(500,250));
  const a=keyAction('ArrowRight',true,'earth',false);assert.ok(a?.type==='panView');
  const v=initialView(),near={...v,distance:v.distance/2};assert.equal(reduceView(v,a).right,reduceView(near,a).right*2);
  assert.deepEqual(keyAction('Enter',false,'mars',false),{type:'focusBody',bodyId:'mars'});assert.equal(keyAction('w',false,'earth',false),null);
});
test('seek is exact and paused; rate and environmental blocks survive; invalid seek is atomic',()=>{
  const c=new Clock(0);c.setRate(100000,0);c.play(0);c.seek(-1296000,10);assert.equal(c.sample(10).tTdbSeconds,-1296000);assert.equal(c.sample(10).rate,100000);assert.equal(c.sample(10).status,'paused');
  c.pause('hidden',11);c.seek(1,12);c.play(13);assert.equal(c.sample(13).status,'paused');assert.ok(c.sample(13).reasons.includes('hidden'));
  c.clearBlock('hidden',14);c.seek(1296000,15);c.play(16);assert.ok(c.sample(16).reasons.includes('range-end'));
  const before=c.sample(17);assert.throws(()=>c.seek(1296001,18));assert.deepEqual(c.sample(18),before);
  c.seek(0,19);assert.equal(c.sample(19).status,'paused');c.play(20);assert.equal(c.sample(21).status,'running');
});
test('time reset and seek preserve selection, scale and camera; recenter preserves focus',()=>{
  const s=new SolarController(0);s.send({type:'focusBody',bodyId:'mars'},'ui',1);s.send({type:'setScaleMode',mode:'didactic'},'ui',2);s.send({type:'panView',right:.1,up:.1},'keyboard',3);
  const before={...s.view};s.send({type:'seekTime',tTdbSeconds:-86400},'ui',4);s.send({type:'resetTime'},'ui',5);assert.deepEqual(s.view,before);assert.equal(s.selected,'mars');assert.equal(s.clock.sample(5).rate,1);
  s.send({type:'recenterView'},'ui',6);assert.equal(s.view.right,0);assert.equal(s.view.up,0);assert.equal(s.view.focus,'mars');
});
test('bounded panning and context changes keep camera inside the 32-unit rendering envelope',()=>{
  const s=new SolarController(0);s.send({type:'focusBody',bodyId:'earth'},'ui',1);
  for(let i=2;i<200;i++){s.send({type:'panView',right:1,up:1},'ui',i);s.send({type:'zoomView',logDistanceDelta:i%4<2?-.9:.9},'ui',i);assert.ok(Math.hypot(s.view.right,s.view.up)+s.view.distance<32);}
});
