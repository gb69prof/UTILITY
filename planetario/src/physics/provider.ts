import type { Accuracy,BodyId,BodyState,BodyStateProvider,Result,Snapshot } from '../data/contracts.ts';
import {validateDatasetDraft} from '../data/validation.ts';
import type {DatasetDraft} from '../data/dataset.ts';
import {ephemerisPositions,type EphemerisData} from './ephemeris.ts';
import {orientation} from './model.ts';
export const bodyIds=['sun','earth','moon','mars'] as const;
export interface Qualification {id:string;status:string;model:string;datasetSha256:string;ephemerisSha256:string;results:Record<string,{pass:boolean;maxPositionErrorM?:number;maxVelocityErrorMps?:number;maxOrientationErrorRad?:number}>}
export async function sha256(text:string):Promise<string>{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const error=<T>(code:'NOT_READY'|'OUT_OF_RANGE'|'INVALID_DATA'|'UNKNOWN_BODY'|'NO_COVERAGE',message:string):Result<T>=>({ok:false,error:{code,message}});
export class EphemerisProvider implements BodyStateProvider {
  readonly id='horizons-hermite';readonly valid={startTdbSeconds:-1296000,endTdbSeconds:1296000};datasetVersion='not-ready';
  private data:DatasetDraft|undefined;private ephemeris:EphemerisData|undefined;private report:Qualification;private raw:string;private rawEphemeris:string;private disposed=false;
  constructor(raw:string,ephemeris:string,report:Qualification){this.raw=raw;this.rawEphemeris=ephemeris;this.report=report;}
  async initialize(signal:AbortSignal):Promise<Result<void>> {
    try {
      const expected=['emb-sun','earth-sun','moon-sun','mars-sun','moon-earth',...bodyIds.map(id=>'orientation-'+id)];
      if(this.report.status!=='pass'||expected.some(k=>this.report.results[k]?.pass!==true)||await sha256(this.raw)!==this.report.datasetSha256||await sha256(this.rawEphemeris)!==this.report.ephemerisSha256)throw new Error('Qualificazione assente o hash diversi dal rapporto');
      const checked=validateDatasetDraft(JSON.parse(this.raw));if(!checked.ok)throw new Error(JSON.stringify(checked.issues));
      const ephemeris=JSON.parse(this.rawEphemeris) as EphemerisData;
      for(const key of ['emb-sun','mars-sun','moon-earth'] as const){const rows=ephemeris.nodes[key];if(rows.length!==721||rows.some((r,i)=>r.length!==7||r[0]!==-1296000+i*3600||r.some(v=>!Number.isFinite(v))))throw new Error('Griglia effemeridi incompleta');}
      if(signal.aborted||this.disposed)return error('NOT_READY','Caricamento annullato');
      this.data=checked.value;this.ephemeris=ephemeris;this.datasetVersion=ephemeris.version;return {ok:true,value:undefined};
    }catch(e){return error('INVALID_DATA',String(e));}
  }
  getSnapshot(t:number):Result<Snapshot> {
    if(!this.data||!this.ephemeris||this.disposed)return error('NOT_READY','Provider non inizializzato');
    if(!Number.isFinite(t)||t<this.valid.startTdbSeconds||t>this.valid.endTdbSeconds)return error('OUT_OF_RANGE','Fuori dai 30 giorni validati');
    try {
      const states={} as Record<BodyId,BodyState>,all=ephemerisPositions(this.data,this.ephemeris,t);
      for(const id of bodyIds){const body=this.data.bodies[id],r=orientation(body.rotation!,t),p=this.report.results[id+'-sun'];
        const accuracy:Accuracy={model:this.report.model,datasetVersion:this.datasetVersion,sourceIds:this.data.sources.map(s=>s.id),status:'validated-ephemeris',valid:this.valid,reportId:this.report.id,maxPositionErrorM:id==='sun'?0:p!.maxPositionErrorM!,maxVelocityErrorMps:id==='sun'?0:p!.maxVelocityErrorMps!,maxOrientationErrorRad:this.report.results['orientation-'+id]!.maxOrientationErrorRad!,limitations:['Errori misurati ai campioni di controllo; orientamento PCK semplificato','Nessuna previsione di eclissi; nessuna estrapolazione']};
        states[id]={id,tTdbSeconds:t,center:'sun',frame:'ECLIPJ2000',correction:'geometric',positionM:all[id].position,velocityMps:all[id].velocity,bodyToFrame:r.q,rotation:{spinAngleRad:r.angle,spinRateRadPerSecond:body.rotation!.spinRate.value,poleUnit:r.pole},accuracy};
      }
      return {ok:true,value:{tTdbSeconds:t,states}};
    }catch(e){return error('NO_COVERAGE',String(e));}
  }
  getState(id:BodyId,t:number):Result<BodyState>{if(!bodyIds.includes(id))return error('UNKNOWN_BODY','Corpo sconosciuto');const s=this.getSnapshot(t);return s.ok?{ok:true,value:s.value.states[id]}:s;}
  dispose():void{this.disposed=true;this.data=undefined;this.ephemeris=undefined;}
}
