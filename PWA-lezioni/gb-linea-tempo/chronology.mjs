/** Historical dates are positive year + era. Coordinates are elapsed years
 * from an arbitrary remote epoch (3,000,000 BCE), never astronomical years.
 * Thus 1 BCE → 1 CE occupies exactly one unit; year:0 is rejected. */
export const ERA_BOUNDARY = 3_000_000;
export const CURRENT_YEAR = new Date().getFullYear();
export const BP_EPOCH = ERA_BOUNDARY + 1949; // BP reference: 1950 CE
export function coordinate(date) {
  if (date === null) return ERA_BOUNDARY + CURRENT_YEAR - 1;
  if (date.bp !== undefined) {
    if (!Number.isFinite(date.bp) || date.bp <= 0) throw new RangeError('BP non valido');
    return BP_EPOCH - date.bp;
  }
  if (!Number.isInteger(date.year) || date.year < 1 || !['BCE','CE'].includes(date.era)) throw new RangeError('Anno storico non valido');
  return date.era === 'BCE' ? ERA_BOUNDARY-date.year : ERA_BOUNDARY+date.year-1;
}
export function historicalDate(value) {
  const tick = Math.floor(value + 1e-8);
  return tick < ERA_BOUNDARY ? {era:'BCE', year:ERA_BOUNDARY-tick} : {era:'CE', year:tick-ERA_BOUNDARY+1};
}
export const number = n => new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(n);
export function amount(n) {return n>=1e6?`${number(n/1e6)} milioni`:n>=10000?`${number(n/1000)} mila`:number(n);}
export function dateLabel(date) {
  if(date===null)return `oggi (${CURRENT_YEAR})`;
  if(date.bp)return `${amount(date.bp)} anni BP`;
  return `${number(date.year)} ${date.era==='BCE'?'a.C.':'d.C.'}`;
}
export function bpAmount(value, span) {
  return span >= 1e6 ? amount(value) : span >= 10000 ? `${number(value/1000)} mila` : number(value);
}
export function momentLabel(tick, span=4000) {
  if(Math.abs(tick-ERA_BOUNDARY)<Math.min(.02,span/1000))return '1 a.C. | 1 d.C.';
  if(tick < coordinate({era:'BCE',year:10000})) {
    const step=span>100000?1000:span>1000?100:1;
    return `ca. ${bpAmount(Math.round((BP_EPOCH-tick)/step)*step,span)} anni BP`;
  }
  return dateLabel(historicalDate(tick));
}
export function periodLabel(item) {return `${item.approx?'ca. ':''}${dateLabel(item.start)} – ${dateLabel(item.end)}`;}
export function duration(item) {return coordinate(item.end)-coordinate(item.start);}
export function durationLabel(item) {return `${item.approx?'circa ':''}${amount(duration(item))} anni${item.end===null?' finora':''}`;}
export function tickStep(span,width) {
 const target=span/Math.max(2,width/130), p=10**Math.floor(Math.log10(target));
 return Math.max(1,[1,2,5,10].map(n=>n*p).find(n=>n>=target)||p*10);
}
export function ticks(center,span,width) {
 const step=tickStep(span,width),lo=center-span/2,hi=center+span/2,result=[];
 if(hi < coordinate({era:"BCE",year:10000})) {
   for(let bp=Math.ceil((BP_EPOCH-hi)/step)*step;BP_EPOCH-bp>=lo;bp+=step)result.push({value:BP_EPOCH-bp,label:`${bpAmount(bp,span)} BP`});
   return result.sort((a,b)=>a.value-b.value);
 }
 // Generate regular calendar labels separately in each era, avoiding year zero.
 if(lo<ERA_BOUNDARY){let y=Math.max(1,Math.ceil((ERA_BOUNDARY-Math.min(hi,ERA_BOUNDARY-1))/step)*step);for(;ERA_BOUNDARY-y>=lo;y+=step)result.push({value:ERA_BOUNDARY-y,label:dateLabel({era:'BCE',year:y})});}
 if(hi>=ERA_BOUNDARY){let y=Math.max(1,Math.ceil((Math.max(lo,ERA_BOUNDARY)-ERA_BOUNDARY+1)/step)*step);for(;ERA_BOUNDARY+y-1<=hi;y+=step)result.push({value:ERA_BOUNDARY+y-1,label:dateLabel({era:'CE',year:y})});}
 return result.map(t=>({...t,label:t.value<coordinate({era:'BCE',year:10000})?`${bpAmount(Math.round(BP_EPOCH-t.value),span)} BP`:t.label})).sort((a,b)=>a.value-b.value);
}
