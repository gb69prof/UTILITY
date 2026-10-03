import type {SolarAction} from '../core/solar-controller.ts';
type Point={x:number;y:number;startX:number;startY:number;moved:boolean;pan:boolean};
export class SolarGestures {
  private points=new Map<number,Point>(); private multi=false;
  down(id:number,x:number,y:number,pan=false){if(this.points.has(id))return;this.points.set(id,{x,y,startX:x,startY:y,moved:false,pan});if(this.points.size>1)this.multi=true;}
  move(id:number,x:number,y:number,width:number,height:number):SolarAction[]{
    const p=this.points.get(id);if(!p||width<=0||height<=0)return [];
    const dx=x-p.x,dy=y-p.y,previous=[...this.points.values()];
    const distance=previous.length===2?Math.hypot(previous[0]!.x-previous[1]!.x,previous[0]!.y-previous[1]!.y):0;
    p.x=x;p.y=y;p.moved ||= Math.hypot(x-p.startX,y-p.startY)>=8;
    if(this.points.size===2){
      const current=[...this.points.values()],next=Math.hypot(current[0]!.x-current[1]!.x,current[0]!.y-current[1]!.y);
      // Only one finger changed: the centroid moves by half its displacement.
      return [{type:'panView',right:-dx/(2*width),up:dy/(2*height)},...(distance>4&&next>4?[{type:'zoomView' as const,logDistanceDelta:Math.log(distance/next)}]:[])];
    }
    if(this.multi||!p.moved)return [];
    return [p.pan?{type:'panView',right:-dx/width,up:dy/height}:{type:'orbitView',deltaYawRad:-dx/width*Math.PI*2,deltaPitchRad:-dy/height*Math.PI}];
  }
  up(id:number,x:number,y:number){const p=this.points.get(id),tap=!!p&&!p.pan&&!p.moved&&!this.multi&&Math.hypot(x-p.startX,y-p.startY)<8;this.points.delete(id);if(!this.points.size)this.multi=false;return tap;}
  cancel(){this.points.clear();this.multi=false;}
}
export function keyAction(key:string,shift:boolean,selected:'sun'|'earth'|'moon'|'mars',running:boolean):SolarAction|null{
  if(key==='Home')return {type:'overview'};
  if(key==='Enter')return {type:'focusBody',bodyId:selected};
  if(key==='Escape')return {type:'closeInfo'};
  if(key==='c'||key==='C')return {type:'recenterView'};
  if(key===' ')return {type:running?'pauseTime':'resumeTime'};
  if(key==='+'||key==='=')return {type:'zoomView',logDistanceDelta:-.15};
  if(key==='-')return {type:'zoomView',logDistanceDelta:.15};
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key))return null;
  const x=key==='ArrowLeft'?-1:key==='ArrowRight'?1:0,y=key==='ArrowUp'?-1:key==='ArrowDown'?1:0;
  return shift?{type:'panView',right:x*.04,up:-y*.04}:{type:'orbitView',deltaYawRad:x*.12,deltaPitchRad:y*.12};
}
