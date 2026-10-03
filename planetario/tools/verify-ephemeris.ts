import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateDatasetDraft} from '../src/data/validation.ts';
import {ephemerisPositions,type EphemerisData,type EphemerisRow} from '../src/physics/ephemeris.ts';
import {add,mul,norm} from '../src/physics/model.ts';
import type {Vec3} from '../src/data/contracts.ts';
const text=await readFile('data/dataset.json','utf8'),ephemText=await readFile('data/ephemeris.json','utf8'),checkText=await readFile('data/ephemeris-checks.json','utf8');
const validated=validateDatasetDraft(JSON.parse(text));if(!validated.ok)throw new Error(JSON.stringify(validated.issues));
const data=validated.value,ephemeris=JSON.parse(ephemText) as EphemerisData,checks=JSON.parse(checkText) as Record<string,EphemerisRow[]>;
const prior=JSON.parse(await readFile('data/qualification.json','utf8')) as {datasetSha256:string;results:Record<string,{pass:boolean;maxOrientationErrorRad?:number;limitRad?:number}>};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');if(prior.datasetSha256!==hash(text))throw new Error('Stale orientation report');
const results:Record<string,{pass:boolean;[key:string]:unknown}>={};
for(const [key,rows] of Object.entries(checks)) {
  let rp=0,rv=0,pt=0,vt=0;const positionLimit=key==='moon-earth'?100:1000,velocityLimit=.01;
  for(const row of rows) {const all=ephemerisPositions(data,ephemeris,row[0]),s=all[key==='moon-earth'?'relative':key.split('-')[0] as keyof typeof all],r=row.slice(1,4) as unknown as Vec3,v=row.slice(4) as unknown as Vec3,p=norm(add(s.position,mul(r,-1))),w=norm(add(s.velocity,mul(v,-1)));if(p>rp){rp=p;pt=row[0];}if(w>rv){rv=w;vt=row[0];}}
  const grid=rows.length===720&&rows.every((r,i)=>r[0]===-1294200+i*3600);
  results[key]={pass:grid&&rp<=positionLimit&&rv<=velocityLimit,samples:rows.length,maxPositionErrorM:rp,positionWorstTdbSeconds:pt,maxVelocityErrorMps:rv,velocityWorstTdbSeconds:vt,positionLimitM:positionLimit,velocityLimitMps:velocityLimit};
}
for(const id of ['sun','earth','moon','mars'])results['orientation-'+id]=prior.results['orientation-'+id]!;
const report={id:'phase5-hermite-hourly-v1',status:Object.values(results).every(r=>r.pass)?'pass':'fail',model:'JPL geometric vectors; hourly cubic Hermite; fixed PCK pole and uniform spin',datasetSha256:hash(text),ephemerisSha256:hash(ephemText),checksSha256:hash(checkText),interval:data.valid,results};
await writeFile('data/ephemeris-qualification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.status!=='pass')process.exitCode=1;
