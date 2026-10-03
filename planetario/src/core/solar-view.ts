import type {SolarView} from '../rendering/solar-scene.ts';
export type ViewAction={type:'orbitView';deltaYawRad:number;deltaPitchRad:number}|{type:'panView';right:number;up:number}|{type:'zoomView';logDistanceDelta:number};
// One reducer for mouse, touch, keyboard and HTML controls; adapters never touch meshes.
export function reduceView(view:SolarView,action:ViewAction):SolarView {
  const next={...view};
  if(action.type==='orbitView'){next.yaw+=action.deltaYawRad;next.pitch=Math.max(.05,Math.min(Math.PI-.05,next.pitch+action.deltaPitchRad));}
  else if(action.type==='panView'){next.right=Math.max(-5,Math.min(5,next.right+action.right));next.up=Math.max(-5,Math.min(5,next.up+action.up));}
  else {
    next.distance*=Math.exp(Math.max(-1,Math.min(1,action.logDistanceDelta)));
    if(!next.focus){next.distance=Math.max(.3,Math.min(16,next.distance));return next;}
    const inR=next.distance*(next.context==='local'?2:10),context=next.context==='near-body'&&inR<6?'local':next.context==='local'&&inR>8?'near-body':next.context;
    if(context!==next.context){const factor=context==='local'?5:.2;next.distance*=factor;next.right*=factor;next.up*=factor;next.context=context;}
    next.distance=Math.max(1.2/(next.context==='local'?2:10),Math.min(16,next.distance));
  }
  return next;
}
