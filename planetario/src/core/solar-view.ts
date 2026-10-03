import type {BodyId,ScaleMode,ViewContext} from '../data/contracts.ts';
export interface SolarView {mode:ScaleMode;focus:BodyId|null;context:ViewContext;yaw:number;pitch:number;distance:number;right:number;up:number;guides:boolean;axes:boolean}
export const initialView=():SolarView=>({mode:'scientific',focus:null,context:'system',yaw:-Math.PI/2,pitch:.55,distance:4.8,right:0,up:0,guides:true,axes:false});

export type ViewAction={type:'orbitView';deltaYawRad:number;deltaPitchRad:number}|{type:'panView';right:number;up:number;aspect?:number}|{type:'zoomView';logDistanceDelta:number};
// One reducer for mouse, touch, keyboard and HTML controls; adapters never touch meshes.
export function reduceView(view:SolarView,action:ViewAction):SolarView {
  const next={...view};
  if(action.type==='orbitView'){next.yaw+=action.deltaYawRad;next.pitch=Math.max(.05,Math.min(Math.PI-.05,next.pitch+action.deltaPitchRad));}
  else if(action.type==='panView'){const limit=view.context==='near-body'?1:5;next.right=Math.max(-limit,Math.min(limit,next.right+action.right*2*view.distance*Math.tan(.4)*(action.aspect??1)));next.up=Math.max(-limit,Math.min(limit,next.up+action.up*2*view.distance*Math.tan(.4)));}
  else {
    next.distance*=Math.exp(Math.max(-1,Math.min(1,action.logDistanceDelta)));
    if(!next.focus){next.distance=Math.max(.3,Math.min(16,next.distance));return next;}
    const inR=next.distance*(next.context==='local'?2:10),context=next.context==='near-body'&&inR<6?'local':next.context==='local'&&inR>8?'near-body':next.context;
    if(context!==next.context){const factor=context==='local'?5:.2;next.distance*=factor;next.right*=factor;next.up*=factor;next.context=context;}
    next.distance=Math.max(1.2/(next.context==='local'?2:10),Math.min(16,next.distance));
  }
  return next;
}
