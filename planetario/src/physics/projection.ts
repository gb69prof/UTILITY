import type {BodyId,ProjectionSettings,Quaternion,Snapshot,ScaleMode,Vec3,ViewContext,ScaleProjection,Result,ProjectionResult} from '../data/contracts.ts';
import {bodyIds} from './provider.ts';
export const AU=149597870700;
export const frameToRender=(p:Vec3):Vec3=>[p[0],p[2],-p[1]];
export function quaternionMultiply(a:Quaternion,b:Quaternion):Quaternion {const [x,y,z,w]=a,[X,Y,Z,W]=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z];}
export function settingsFor(mode:ScaleMode,context:ViewContext,originM:Vec3,radius:number):ProjectionSettings {
  return {mode,context,originM,metersPerUnit:context==='system'?AU:(context==='local'?2:10)*radius,radiusFactors:mode==='didactic'&&context==='system'?{sun:5,earth:1000,moon:1000,mars:1000}:{sun:1,earth:1,moon:1,mars:1},anchorRender:[0,0,0]};
}
export class Projection implements ScaleProjection {
  projectPoint(p:Vec3,s:ProjectionSettings):Vec3 {const o=s.originM,a=s.anchorRender,L=s.metersPerUnit;return [a[0]+(p[0]-o[0])/L,a[1]+(p[2]-o[2])/L,a[2]-(p[1]-o[1])/L];}
  project(snapshot:Snapshot,settings:ProjectionSettings,radii:Readonly<Record<BodyId,number>>):Result<ProjectionResult>{
    if(!Number.isFinite(settings.metersPerUnit)||settings.metersPerUnit<=0)return {ok:false,error:{code:'INVALID_DATA',message:'Scala non valida'}};
    return {ok:true,value:{settings,bodies:bodyIds.map(id=>({id,position:this.projectPoint(snapshot.states[id].positionM,settings),radius:radii[id]*settings.radiusFactors[id]/settings.metersPerUnit,bodyToRender:quaternionMultiply([-Math.SQRT1_2,0,0,Math.SQRT1_2],snapshot.states[id].bodyToFrame),marker:{label:'Indicatore, non dimensione',scientificRadiusUnchanged:settings.radiusFactors[id]===1}})),disclosures:[settings.context==='system'&&settings.mode==='didactic'?'Raggi: Sole ×5; Terra, Luna e Marte ×1000. Distanze invariate.':'Raggi e distanze nella stessa scala. Corpi piccoli indicati da marcatori.']}};
  }
}
