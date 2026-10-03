import type {BodyId, ScaleMode, Snapshot, TimeRate} from '../data/contracts.ts';
import {Clock} from '../physics/clock.ts';
import {frameToRender} from '../physics/projection.ts';
import {mul} from '../physics/model.ts';
import {initialView, reduceView, type ViewAction} from './solar-view.ts';

export type SolarAction = ViewAction | {type:'selectBody'|'focusBody';bodyId:BodyId}
  | {type:'overview'|'recenterView'|'closeInfo'|'openInfo'|'pauseTime'|'resumeTime'|'resetTime'}
  | {type:'setScaleMode';mode:ScaleMode} | {type:'setTimeRate';rate:TimeRate}
  | {type:'seekTime';tTdbSeconds:number} | {type:'setGuide';key:'guides'|'axes';value:boolean};
export type InputSource='mouse'|'touch'|'keyboard'|'ui';
export interface SolarEnvelope {actionId:string;inputSessionId:string;sequence:number;source:InputSource;realNowMs:number;action:SolarAction}
const bodies=['sun','earth','moon','mars'];

// Single command boundary for the astronomical screen; no renderer or DOM state here.
export class SolarController {
  readonly clock:Clock; readonly view=initialView(); selected:BodyId='earth'; infoOpen=true;
  snapshot:Snapshot|undefined; accepted=0; selections=0; lastAction='';
  private sequence=0; private seen=new Map<string,number>(); private lastNow:number; private disposed=false;
  private readonly session=crypto.randomUUID();
  constructor(now:number){this.clock=new Clock(now);this.lastNow=now;}
  send(action:SolarAction,source:InputSource,now:number){const sequence=++this.sequence;return this.dispatch({action,source,realNowMs:now,inputSessionId:this.session,sequence,actionId:`${this.session}:${sequence}`});}
  dispatch(e:SolarEnvelope):boolean {
    if(this.disposed||!['mouse','touch','keyboard','ui'].includes(e.source)||!e.inputSessionId||!Number.isSafeInteger(e.sequence)||e.sequence<1||e.actionId!==`${e.inputSessionId}:${e.sequence}`||e.sequence<=(this.seen.get(e.inputSessionId)??0)||!Number.isFinite(e.realNowMs)||e.realNowMs<this.lastNow)return false;
    const a=e.action, now=e.realNowMs;
    const fields:Record<string,string[]>={orbitView:['deltaYawRad','deltaPitchRad'],panView:['right','up'],zoomView:['logDistanceDelta'],seekTime:['tTdbSeconds'],setTimeRate:['rate']};
    if((fields[a.type]??[]).some(k=>!Number.isFinite((a as unknown as Record<string,number>)[k])))return false;
    if(a.type==='panView'&&a.aspect!==undefined&&(!Number.isFinite(a.aspect)||a.aspect<=0))return false;
    if(('bodyId' in a&&!bodies.includes(a.bodyId))||(a.type==='setScaleMode'&&!['scientific','didactic','exploratory'].includes(a.mode))||(a.type==='setTimeRate'&&![1,10,100,1000,10000,100000].includes(a.rate))||(a.type==='seekTime'&&Math.abs(a.tTdbSeconds)>1296000)||(a.type==='setGuide'&&(!['guides','axes'].includes(a.key)||typeof a.value!=='boolean')))return false;
    const pause=()=>{this.clock.pause('view-transition',now);this.clock.clearBlock('view-transition',now);};
    switch(a.type){
      case 'selectBody':this.selected=a.bodyId;this.infoOpen=true;this.selections++;break;
      case 'focusBody':{
        pause();this.selected=a.bodyId;this.infoOpen=true;
        const toward=this.snapshot&&a.bodyId!=='sun'?frameToRender(mul(this.snapshot.states[a.bodyId].positionM,-1)):null;
        Object.assign(this.view,{focus:a.bodyId,context:'near-body',distance:.8,right:0,up:0,pitch:1.15,yaw:toward?Math.atan2(toward[2],toward[0])+.45:-Math.PI/2});break;
      }
      case 'overview':{pause();const {mode,guides,axes}=this.view;Object.assign(this.view,initialView(),{mode,guides,axes});break;}
      case 'recenterView':this.view.right=0;this.view.up=0;break;
      case 'closeInfo':this.infoOpen=false;break;
      case 'openInfo':this.infoOpen=true;break;
      case 'setScaleMode':pause();this.view.mode=a.mode;break;
      case 'orbitView':case 'zoomView':case 'panView':{const next=reduceView(this.view,a);if(next.context!==this.view.context)pause();Object.assign(this.view,next);break;}
      case 'pauseTime':this.clock.pause('user',now);break;
      case 'resumeTime':this.clock.play(now);break;
      case 'resetTime':this.clock.reset(now);break;
      case 'setTimeRate':this.clock.setRate(a.rate,now);break;
      case 'seekTime':this.clock.seek(a.tTdbSeconds,now);break;
      case 'setGuide':this.view[a.key]=a.value;break;
      default:return false;
    }
    this.seen.set(e.inputSessionId,e.sequence);this.lastNow=now;this.accepted++;this.lastAction=a.type;return true;
  }
  dispose(){this.disposed=true;this.seen.clear();}
}
