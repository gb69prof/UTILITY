import type { DatasetDraft } from '../data/dataset.ts';
import type { Vec3 } from '../data/contracts.ts';
import { add,mul,type Cartesian } from './model.ts';
export type EphemerisRow=readonly [number,number,number,number,number,number,number];
export interface EphemerisData {version:string;stepSeconds:number;nodes:Record<'emb-sun'|'mars-sun'|'moon-earth',readonly EphemerisRow[]>}
export function hermite(rows:readonly EphemerisRow[],t:number):Cartesian {
  if(!Number.isFinite(t)||rows.length<2||t<rows[0]![0]||t>rows.at(-1)![0])throw new Error('OUT_OF_RANGE');
  let lo=0,hi=rows.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid]![0]<=t)lo=mid;else hi=mid;}
  const a=rows[lo]!,b=rows[hi]!,h=b[0]-a[0];if(h!==3600)throw new Error('NO_COVERAGE');
  const u=(t-a[0])/h,u2=u*u,u3=u2*u;
  const position=[0,0,0],velocity=[0,0,0];
  for(let k=0;k<3;k++) {const p0=a[k+1]!,p1=b[k+1]!,v0=a[k+4]!,v1=b[k+4]!;
    // Difference form avoids cancellation of large heliocentric coordinates.
    position[k]=p0+(3*u2-2*u3)*(p1-p0)+h*((u3-2*u2+u)*v0+(u3-u2)*v1);
    velocity[k]=(6*u-6*u2)*(p1-p0)/h+(3*u2-4*u+1)*v0+(3*u2-2*u)*v1;
  }
  return {position:position as unknown as Vec3,velocity:velocity as unknown as Vec3};
}
export function ephemerisPositions(data:DatasetDraft,ephemeris:EphemerisData,t:number):Record<'sun'|'earth'|'moon'|'mars'|'emb'|'relative',Cartesian> {
  const emb=hermite(ephemeris.nodes['emb-sun'],t),relative=hermite(ephemeris.nodes['moon-earth'],t),gmEarth=data.bodies.earth.physical.gm!.value,gmMoon=data.bodies.moon.physical.gm!.value,f=gmMoon/(gmEarth+gmMoon);
  const compose=(k:number):Cartesian=>({position:add(emb.position,mul(relative.position,k)),velocity:add(emb.velocity,mul(relative.velocity,k))});
  return {sun:{position:[0,0,0],velocity:[0,0,0]},emb,relative,earth:compose(-f),moon:compose(1-f),mars:hermite(ephemeris.nodes['mars-sun'],t)};
}
