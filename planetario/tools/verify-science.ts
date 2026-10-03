import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateDatasetDraft, validateOrbitalImport } from '../src/data/validation.ts';
import { conic, positions, orientation, add, mul, norm } from '../src/physics/model.ts';
import type { BodyId, Vec3, Quaternion } from '../src/data/contracts.ts';

const text=await readFile('data/dataset.json','utf8'), refText=await readFile('data/reference.json','utf8');
const checked=validateDatasetDraft(JSON.parse(text));
if(!checked.ok) throw new Error(JSON.stringify(checked.issues,null,2));
const data=checked.value;
type Row={t:number;state:[number,number,number,number,number,number]};
const refs=JSON.parse(refText) as {tool:string;horizons:Record<string,Row[]>;conics:Record<string,Row[]>;orientations:Record<BodyId,{t:number;q:Quaternion}[]>};
const imports=JSON.parse(await readFile('data/import-checks.json','utf8')) as Record<string,{meanMotionRadPerSecond:number;periodSeconds:number}>;
const results:Record<string,{pass:boolean;[key:string]:unknown}>={};
const delta=(a:Vec3,b:Vec3)=>norm(add(a,mul(b,-1)));
for(const [key,o] of Object.entries(data.orbits)) {
  const v=imports[key]!; const imported=validateOrbitalImport(o,v.meanMotionRadPerSecond,v.periodSeconds);
  let rp=0,rv=0;
  for(const row of refs.conics[key]!) {const s=conic(o,row.t),r=row.state.slice(0,3) as unknown as Vec3,w=row.state.slice(3) as unknown as Vec3;rp=Math.max(rp,delta(s.position,r)/Math.max(1,norm(r)));rv=Math.max(rv,delta(s.velocity,w)/Math.max(1,norm(w)));}
  results['internal-'+key]={pass:imported.ok&&rp<=1e-10&&rv<=1e-10,maxRelativePositionError:rp,maxRelativeVelocityError:rv};
}
for(const [key,rows] of Object.entries(refs.horizons)) {
  let rp=0,rv=0,ep=0,ev=0;const positionLimit=key==='moon-earth'?3e7:key==='moon-sun'?5e7:2e7,velocityLimit=key.startsWith('moon')?100:20;
  for(const row of rows) {const all=positions(data,row.t),s=all[key==='moon-earth'?'relative':key.split('-')[0] as BodyId|'emb'],r=row.state.slice(0,3) as unknown as Vec3,v=row.state.slice(3) as unknown as Vec3;const p=delta(s.position,r),w=delta(s.velocity,v);rp=Math.max(rp,p);rv=Math.max(rv,w);if(row.t===0){ep=p;ev=w;}}
  const gridOK=rows.length===241&&rows.every((r,i)=>r.t===-1296000+10800*i);
  results[key]={pass:gridOK&&rp<=positionLimit&&rv<=velocityLimit&&ep<=1000&&ev<=.001,samples:rows.length,maxPositionErrorM:rp,maxVelocityErrorMps:rv,positionLimitM:positionLimit,velocityLimitMps:velocityLimit,epochPositionErrorM:ep,epochVelocityErrorMps:ev};
}
for(const id of ['sun','earth','moon','mars'] as const) {
  let max=0;const rows=refs.orientations[id];
  for(const row of rows) {const a=orientation(data.bodies[id].rotation!,row.t).q,b=row.q;const minus=Math.hypot(...a.map((v,i)=>v-b[i]!)),plus=Math.hypot(...a.map((v,i)=>v+b[i]!));const angle=4*Math.asin(Math.min(1,Math.min(minus,plus)/2));max=Math.max(max,angle);}
  const limit=(id==='moon'?10:.1)*Math.PI/180;
  results['orientation-'+id]={pass:rows.length===241&&max<=limit,samples:rows.length,maxOrientationErrorRad:max,limitRad:limit};
}
const report={id:'j2000-phase5-v1',status:Object.values(results).every(r=>r.pass)?'pass':'fail',datasetSha256:createHash('sha256').update(text).digest('hex'),referenceSha256:createHash('sha256').update(refText).digest('hex'),referenceTool:refs.tool,interval:data.valid,results};
await writeFile('data/qualification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--expect-unqualified')) {
  const failed=Object.entries(results).filter(([,r])=>!r.pass).map(([key])=>key);
  if(failed.length!==1||failed[0]!=='moon-earth')throw new Error('Unexpected change in conic qualification');
} else if(report.status!=='pass')process.exitCode=1;
