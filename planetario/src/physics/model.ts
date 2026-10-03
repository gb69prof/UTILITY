import type { OrbitalElements, RotationData, Vec3, Quaternion } from '../data/contracts.ts';
import type { DatasetDraft } from '../data/dataset.ts';

export const TAU = 2 * Math.PI;
export const EPSILON = 84381.448 * Math.PI / (180 * 3600);
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
export const mul = (a: Vec3, k: number): Vec3 => [a[0]*k, a[1]*k, a[2]*k];
export const dot = (a: Vec3, b: Vec3): number => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm = (a: Vec3): number => Math.hypot(...a);
export const wrap = (a: number): number => ((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
export function eccentricAnomaly(mean: number, e: number): number {
  if (!Number.isFinite(mean) || !Number.isFinite(e) || e < 0 || e > .2) throw new Error('Invalid elliptic elements');
  const m=wrap(mean); let E=m;
  for(let i=0;i<16;i++) { const residual=E-e*Math.sin(E)-m; if(Math.abs(residual)<=1e-12) return E; E-=residual/(1-e*Math.cos(E)); }
  let lo=-Math.PI, hi=Math.PI;
  for(let i=0;i<64;i++) { E=(lo+hi)/2; const residual=E-e*Math.sin(E)-m; if(Math.abs(residual)<=1e-12) return E; if(residual>0) hi=E; else lo=E; }
  throw new Error('Kepler: no convergence');
}
export type Cartesian = Readonly<{ position: Vec3; velocity: Vec3 }>;
export function orbitBasis(o: OrbitalElements): readonly [Vec3,Vec3,Vec3] {
  const c=Math.cos(o.ascendingNode.value),s=Math.sin(o.ascendingNode.value),ci=Math.cos(o.i.value),si=Math.sin(o.i.value),w=Math.cos(o.argumentOfPeriapsis.value),v=Math.sin(o.argumentOfPeriapsis.value);
  return [[c*w-s*v*ci,s*w+c*v*ci,v*si],[-c*v-s*w*ci,-s*v+c*w*ci,w*si],[s*si,-c*si,ci]];
}
export function conic(o: OrbitalElements,t: number): Cartesian {
  const a=o.a.value,e=o.e.value,n=Math.sqrt(o.mu.value/a**3),E=eccentricAnomaly(o.anomalyAtEpoch.angle.value+n*t,e),c=Math.cos(E),s=Math.sin(E),b=Math.sqrt(1-e*e),f=a*n/(1-e*c),[x,y]=orbitBasis(o);
  return {position:add(mul(x,a*(c-e)),mul(y,a*b*s)),velocity:add(mul(x,-f*s),mul(y,f*b*c))};
}
export function positions(data: DatasetDraft,t:number): Record<'sun'|'earth'|'moon'|'mars'|'emb'|'relative',Cartesian> {
  if(!Number.isFinite(t)||t<data.valid.startTdbSeconds||t>data.valid.endTdbSeconds) throw new Error('OUT_OF_RANGE');
  const emb=conic(data.orbits['emb-sun'],t),relative=conic(data.orbits['moon-earth'],t),f=data.bodies.moon.physical.gm!.value/(data.bodies.earth.physical.gm!.value+data.bodies.moon.physical.gm!.value);
  const compose=(k:number):Cartesian=>({position:add(emb.position,mul(relative.position,k)),velocity:add(emb.velocity,mul(relative.velocity,k))});
  return {sun:{position:[0,0,0],velocity:[0,0,0]},emb,relative,earth:compose(-f),moon:compose(1-f),mars:conic(data.orbits['mars-sun'],t)};
}
export function quaternionFromColumns(x:Vec3,y:Vec3,z:Vec3):Quaternion {
  const trace=x[0]+y[1]+z[2]; let q: [number,number,number,number];
  if(trace>0) {const s=2*Math.sqrt(trace+1);q=[(y[2]-z[1])/s,(z[0]-x[2])/s,(x[1]-y[0])/s,s/4];}
  else if(x[0]>y[1]&&x[0]>z[2]) {const s=2*Math.sqrt(1+x[0]-y[1]-z[2]);q=[s/4,(y[0]+x[1])/s,(z[0]+x[2])/s,(y[2]-z[1])/s];}
  else if(y[1]>z[2]) {const s=2*Math.sqrt(1+y[1]-x[0]-z[2]);q=[(y[0]+x[1])/s,s/4,(z[1]+y[2])/s,(z[0]-x[2])/s];}
  else {const s=2*Math.sqrt(1+z[2]-x[0]-y[1]);q=[(z[0]+x[2])/s,(z[1]+y[2])/s,s/4,(x[1]-y[0])/s];}
  const k=(q[3]<0?-1:1)/Math.hypot(...q);return [q[0]*k,q[1]*k,q[2]*k,q[3]*k];
}
export function orientation(r:RotationData,t:number):{q:Quaternion;pole:Vec3;angle:number;columns:readonly [Vec3,Vec3,Vec3]} {
  const a=r.poleRa.value,d=r.poleDec.value,k:Vec3=[Math.cos(d)*Math.cos(a),Math.cos(d)*Math.sin(a),Math.sin(d)],u:Vec3=[-Math.sin(a),Math.cos(a),0],v=cross(k,u),angle=wrap(r.primeMeridianAtEpoch.value+r.spinRate.value*t),c=Math.cos(angle),s=Math.sin(angle);
  const ecliptic=(p:Vec3):Vec3=>[p[0],Math.cos(EPSILON)*p[1]+Math.sin(EPSILON)*p[2],-Math.sin(EPSILON)*p[1]+Math.cos(EPSILON)*p[2]];
  const x=ecliptic(add(mul(u,c),mul(v,s))),y=ecliptic(add(mul(u,-s),mul(v,c))),z=ecliptic(k);
  return {q:quaternionFromColumns(x,y,z),pole:z,angle,columns:[x,y,z]};
}
