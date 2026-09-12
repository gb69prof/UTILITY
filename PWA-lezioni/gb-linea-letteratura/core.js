export function normalize(text){return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase();}
export function dateLabel(a,year=new Date().getFullYear()){
 if(a.tipoIntervallo==='attivita')return `Attività editoriale: 1992–oggi`;
 return `${a.notaDate?'≈ ':''}${a.annoNascita}–${a.annoMorte||'oggi'}`;
}
// Keep exact temporal widths. Packing only controls the vertical lanes.
export function packLanes(items,gap=6){
 const lanes=[];const result=[];
 for(const item of items){let lane=lanes.findIndex(intervals=>intervals.every(other=>item.left+item.width+gap<=other.left||item.left>=other.left+other.width+gap));if(lane<0){lane=lanes.length;lanes.push([]);}lanes[lane].push(item);result.push({...item,lane});}
 return {items:result,count:lanes.length};
}
