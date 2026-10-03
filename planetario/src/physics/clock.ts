import type { ClockSnapshot, Interval, PauseReason, SimulationClock, TimeRate } from '../data/contracts.ts';
export class Clock implements SimulationClock {
  private anchor=0; private realAnchor:number; private lastNow:number; private t=0;
  private rate:TimeRate=1; private running=false; private reasons=new Set<PauseReason>(['user']);
  private valid:Interval;
  constructor(now:number,valid:Interval={startTdbSeconds:-1296000,endTdbSeconds:1296000}){this.lastNow=now;this.realAnchor=now;this.valid=valid;}
  private snapshot():ClockSnapshot{return {tTdbSeconds:this.t,rate:this.rate,status:this.running?'running':'paused',reasons:[...this.reasons]};}
  private reanchor(now:number):void{this.anchor=this.t;this.realAnchor=now;this.lastNow=now;}
  sample(now:number):ClockSnapshot {
    if(!Number.isFinite(now)||now<this.lastNow)throw new Error('Clock requires monotonic time');
    if(this.running&&now-this.lastNow>1000){this.running=false;this.reasons.add('suspended');this.reanchor(now);}
    if(this.running){this.t=this.anchor+this.rate*(now-this.realAnchor)/1000;if(this.t>=this.valid.endTdbSeconds){this.t=this.valid.endTdbSeconds;this.running=false;this.reasons.add('range-end');this.reanchor(now);}}
    this.lastNow=now;return this.snapshot();
  }
  play(now:number):ClockSnapshot{this.sample(now);this.reasons.delete('user');this.reasons.delete('suspended');this.running=this.reasons.size===0;this.reanchor(now);return this.snapshot();}
  pause(reason:PauseReason,now:number):ClockSnapshot{this.sample(now);this.running=false;this.reasons.add(reason);this.reanchor(now);return this.snapshot();}
  clearBlock(reason:Exclude<PauseReason,'user'|'range-end'>,now:number):ClockSnapshot{this.sample(now);this.reasons.delete(reason);this.running=false;this.reanchor(now);return this.snapshot();}
  setRate(rate:TimeRate,now:number):ClockSnapshot{if(![1,10,100,1000,10000,100000].includes(rate))throw new Error('Invalid rate');this.sample(now);this.rate=rate;this.reanchor(now);return this.snapshot();}
  reset(now:number):ClockSnapshot{this.sample(now);this.t=0;this.rate=1;this.running=false;this.reasons.delete('range-end');this.reasons.delete('suspended');this.reasons.add('user');this.reanchor(now);return this.snapshot();}
}
