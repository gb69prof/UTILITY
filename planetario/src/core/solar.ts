import '../ui/solar.css';
import rawData from '../../data/dataset.json?raw';
import rawEphemeris from '../../data/ephemeris.json?raw';
import report from '../../data/ephemeris-qualification.json';
import {EphemerisProvider,bodyIds} from '../physics/provider.ts';
import {Clock} from '../physics/clock.ts';
import {norm,add,mul} from '../physics/model.ts';
import {frameToRender} from '../physics/projection.ts';
import type {DatasetDraft} from '../data/dataset.ts';
import type {EphemerisData} from '../physics/ephemeris.ts';
import type {BodyId,ScaleMode,TimeRate,Snapshot} from '../data/contracts.ts';
import {createSolarScene,initialView} from '../rendering/solar-scene.ts';
import {Gestures} from '../input/gestures.ts';
import {Lifetime} from './lifecycle.ts';
import {reduceView,type ViewAction} from './solar-view.ts';

export async function bootstrapSolar():Promise<void>{
  document.title='Planetario gbprof — Sole, Terra, Luna e Marte';
  const data=JSON.parse(rawData) as DatasetDraft,ephemeris=JSON.parse(rawEphemeris) as EphemerisData;
  document.body.innerHTML=`<main class="observatory">
    <header class="masthead"><div><p class="eyebrow">GBPROF / ESPLORAZIONI SCIENTIFICHE</p><h1>Planetario <span>gbprof</span></h1></div><span class="phase-tag">IL SISTEMA SOLARE<br>QUATTRO CORPI · FASE 05</span></header>
    <p id="error" class="error" role="alert" hidden></p>
    <div class="viewbar"><h2 id="view-title">Uno sguardo al sistema solare</h2><nav class="scale-controls" aria-label="Scala della rappresentazione"><button data-scale="scientific" aria-pressed="true">Scientifica</button><button data-scale="didactic" aria-pressed="false">Didattica</button><button data-scale="exploratory" aria-pressed="false">Esplorativa</button></nav></div>
    <div class="observatory-grid"><div><section class="sky" aria-label="Osservatorio tridimensionale"><canvas id="solar-canvas" tabindex="0" aria-label="Scena 3D: trascina o usa le frecce per orbitare; più e meno per lo zoom; Home per la panoramica."></canvas><div class="sky-top"><strong id="view-label">VISTA DEL SISTEMA</strong><span>J2000 · ECLIPJ2000</span></div><div class="marker-layer">${['sun','earth','mars'].map(id=>`<button class="body-marker" data-marker="${id}" aria-label="Seleziona ${id==='earth'?'gruppo Terra e Luna':data.bodies[id as BodyId].name}">${id==='earth'?'Terra / Luna':data.bodies[id as BodyId].name}</button>`).join('')}</div><div class="sky-tools"><button id="zoom-plus" aria-label="Avvicina la vista">+</button><button id="zoom-minus" aria-label="Allontana la vista">−</button></div><div class="sky-bottom"><span id="guide-legend">ELLISSI DI RIFERIMENTO · EMB E MARTE</span><span class="fps" id="fps"></span></div></section><p class="scale-note" id="scale-note"></p></div>
    <aside class="body-panel" aria-label="Corpi e osservazione"><nav class="body-list" aria-label="Seleziona un corpo">${bodyIds.map(id=>`<button data-body="${id}" aria-pressed="${id==='earth'}"><i style="--body-color:${({sun:'#efba66',earth:'#62accb',moon:'#b8bab7',mars:'#c78666'})[id]}"></i>${data.bodies[id].name}</button>`).join('')}</nav><div><p class="eyebrow">OSSERVA</p><h2 id="body-name">Terra</h2><p class="kind" id="body-kind">Pianeta · sistema Terra–Luna</p></div><dl><div><dt>Raggio medio volumetrico</dt><dd id="body-radius"></dd></div><div><dt id="distance-label">Distanza dal Sole · tra i centri</dt><dd id="body-distance"></dd></div><div><dt id="speed-label">Velocità rispetto al Sole</dt><dd id="body-speed"></dd></div></dl><button class="observe" id="observe">Osserva Terra</button><button class="secondary" id="overview">Vista del sistema</button><p class="panel-note" id="panel-note">In scala reale, i pianeti sono quasi invisibili dalla panoramica. Seleziona un corpo e osservalo da vicino.</p><div class="toggles"><label><input type="checkbox" id="guides" checked> Guide orbitali</label><label><input type="checkbox" id="axes"> Assi di rotazione</label></div></aside></div>
    <section class="timebar" aria-label="Tempo della simulazione"><div class="time-readout"><strong id="time">J2000 + 0,000 giorni</strong><small id="clock-status">IN PAUSA · EPOCA IN TDB</small></div><button class="play" id="play">Avvia</button><button id="reset">Ripristina J2000</button><label>Velocità <select id="rate">${[1,10,100,1000,10000,100000].map(rate=>`<option value="${rate}">×${rate.toLocaleString('it-IT')}</option>`).join('')}</select></label></section>
    <p class="notice" id="status" role="status">Verifica del dataset…</p><p class="model-note">Intervallo validato: J2000-TDB ±15 giorni. Posizioni geometriche JPL; rotazioni semplificate. Le ellissi complete sono riferimenti del modello, non traiettorie storiche. Nessuna previsione di eclissi. Il campo stellare è illustrativo.</p>
    <details class="reference-note"><summary>Fonti, precisione e limiti della rappresentazione</summary><p>Posizioni: <a href="https://ssd.jpl.nasa.gov/horizons/manual.html" target="_blank" rel="noreferrer">NASA JPL Horizons</a>, DE441 e mar099; campioni orari, interpolazione cubica di posizione e velocità. Confronto su 720 campioni intermedi per ciascuno dei cinque stati. Luna–Terra: errore misurato massimo 0,016 m. Questo numero riguarda l’interpolazione dei vettori JPL, non l’accuratezza fisica assoluta delle effemeridi.</p><p>Raggi e orientamento: <a href="https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/" target="_blank" rel="noreferrer">NAIF PCK00011</a>. Polo iniziale e rotazione uniforme: nessuna orientazione ITRF, librazione lunare accurata o rotazione differenziale del Sole. Superfici sferiche di volume equivalente agli ellissoidi. La luce segue la direzione geometrica del Sole; non sono simulate ombre reciproche.</p><p>Texture: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope / INOVE</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, JPEG 2K originali. Mappe elaborate a scopo illustrativo; colori e dettagli non sono osservazioni dell’istante simulato. Fotosfera del Sole illustrativa. Nessuna nuvola o atmosfera aggiuntiva.</p><p>La scala didattica ingrandisce soltanto i raggi nella vista del sistema. Terra e Luna possono sovrapporsi: si scelgono separatamente nell’elenco. I marcatori indicano la posizione, non la dimensione. Nelle viste dei corpi tutti i raggi tornano reali. Le stelle sono una distribuzione sintetica, senza identità di catalogo.</p><p>Il modello iniziale a tre ellissi è stato verificato ma escluso dal movimento: superava la soglia di errore della Luna. La revisione della Fase 5 usa il provider di effemeridi previsto nell’architettura, mantenendo intervallo e soglie. I rapporti riproducibili sono nel <a href="https://github.com/gb69prof/UTILITY/tree/main/planetario/data" target="_blank" rel="noreferrer">repository</a>.</p></details>
    <footer class="bottomline"><span>Trascina per orbitare · rotella o +/− per lo zoom · frecce sulla scena</span><span>Versione 0.5.0 <a class="technical-link" href="?technical=1">Collaudo 3D / VR</a></span></footer></main>`;
  const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  const life=new Lifetime(),events=new AbortController();life.own(()=>events.abort());
  const provider=new EphemerisProvider(rawData,rawEphemeris,report);life.own(()=>provider.dispose());
  const ready=await provider.initialize(events.signal);if(!ready.ok)throw new Error(ready.error.message);
  const clock=new Clock(performance.now()),view=initialView();let selected:BodyId='earth',lost=false;
  const canvas=el<HTMLCanvasElement>('solar-canvas'),notice=(s:string)=>{el('status').textContent=s;};
  const renderer=createSolarScene(canvas,data,ephemeris,notice,value=>{lost=value;const now=performance.now();if(value)clock.pause('tracking-unavailable',now);else clock.clearBlock('tracking-unavailable',now);});life.own(()=>renderer.dispose());
  let lastSnapshot:Snapshot|undefined;
  const numbers=new Intl.NumberFormat('it-IT',{maximumFractionDigits:1});
  function select(id:BodyId){selected=id;for(const b of document.querySelectorAll<HTMLButtonElement>('[data-body]'))b.setAttribute('aria-pressed',String(b.dataset['body']===id));el('body-name').textContent=data.bodies[id].name;el('body-kind').textContent=({sun:'Stella · fotosfera',earth:'Pianeta · sistema Terra–Luna',moon:'Satellite naturale della Terra',mars:'Pianeta roccioso'})[id];el('observe').textContent='Osserva '+data.bodies[id].name;}
  function transition(change:()=>void){const now=performance.now();clock.pause('view-transition',now);change();clock.clearBlock('view-transition',now);}
  function focus(){transition(()=>{view.focus=selected;view.context='near-body';view.distance=.8;view.right=0;view.up=0;view.pitch=1.15;
    if(selected!=='sun'&&lastSnapshot){const toward=frameToRender(mul(lastSnapshot.states[selected].positionM,-1));view.yaw=Math.atan2(toward[2],toward[0])+.45;}else view.yaw=-Math.PI/2;
    el('view-title').textContent='Osserva '+data.bodies[selected].name;el('panel-note').textContent='Luce dal Sole e rotazione condividono lo stesso istante. Trascina per esplorare il corpo; attiva gli assi per riconoscere il polo.';});}
  function overview(){transition(()=>{const mode=view.mode,guides=view.guides,axes=view.axes;Object.assign(view,initialView(),{mode,guides,axes});el('view-title').textContent='Uno sguardo al sistema solare';el('panel-note').textContent='Marcatori: posizione, non dimensione. Terra e Luna si scelgono separatamente dall’elenco.';});}
  function dispatchView(action:ViewAction){const next=reduceView(view,action);if(next.context!==view.context)transition(()=>Object.assign(view,next));else Object.assign(view,next);}
  function zoom(delta:number){dispatchView({type:'zoomView',logDistanceDelta:delta});}
  const on=(id:string,fn:()=>void)=>el(id).addEventListener('click',fn,{signal:events.signal});
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-body]'))button.addEventListener('click',()=>select(button.dataset['body'] as BodyId),{signal:events.signal});
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-scale]'))button.addEventListener('click',()=>transition(()=>{view.mode=button.dataset['scale'] as ScaleMode;for(const b of document.querySelectorAll('[data-scale]'))b.setAttribute('aria-pressed',String(b===button));}),{signal:events.signal});
  for(const button of document.querySelectorAll<HTMLButtonElement>('[data-marker]'))button.addEventListener('click',()=>{select(button.dataset['marker'] as BodyId);if(selected==='earth')notice('Gruppo Terra–Luna: scegli Terra o Luna nell’elenco.');},{signal:events.signal});
  on('observe',focus);on('overview',overview);on('zoom-plus',()=>zoom(-.2));on('zoom-minus',()=>zoom(.2));
  on('play',()=>{const now=performance.now();if(clock.sample(now).status==='running')clock.pause('user',now);else clock.play(now);});
  on('reset',()=>{clock.reset(performance.now());el<HTMLSelectElement>('rate').value='1';});
  el<HTMLSelectElement>('rate').addEventListener('change',event=>clock.setRate(Number((event.target as HTMLSelectElement).value) as TimeRate,performance.now()),{signal:events.signal});
  for(const key of ['guides','axes'] as const)el<HTMLInputElement>(key).addEventListener('change',()=>{view[key]=el<HTMLInputElement>(key).checked;},{signal:events.signal});
  const gestures=new Gestures();
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);gestures.down(e.pointerId,e.clientX,e.clientY);},{signal:events.signal});
  canvas.addEventListener('pointermove',e=>{for(const a of gestures.move(e.pointerId,e.clientX,e.clientY))if(a.type==='orbitView'||a.type==='zoomView'||a.type==='panView')dispatchView(a);},{signal:events.signal});
  canvas.addEventListener('pointerup',e=>{if(gestures.up(e.pointerId,e.clientX,e.clientY)){const hit=renderer.pick(e.clientX,e.clientY);if(hit)select(hit);}if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);},{signal:events.signal});
  for(const event of ['pointercancel','lostpointercapture','blur'])canvas.addEventListener(event,()=>gestures.cancel(),{signal:events.signal});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*(e.deltaMode===1?.025:.0015));},{signal:events.signal,passive:false});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home','Enter'].includes(e.key)){e.preventDefault();if(e.key==='Home')overview();else if(e.key==='Enter')focus();else if(e.key==='+'||e.key==='=')zoom(-.15);else if(e.key==='-')zoom(.15);else dispatchView({type:'orbitView',deltaYawRad:e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0,deltaPitchRad:e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0});}},{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{const now=performance.now();gestures.cancel();if(document.hidden)clock.pause('hidden',now);else clock.clearBlock('hidden',now);},{signal:events.signal});
  let frames=0,lastUi=0;
  function render(){if(life.disposed||lost)return;try{const now=performance.now(),time=clock.sample(now),snapshot=provider.getSnapshot(time.tTdbSeconds);if(!snapshot.ok)throw new Error(snapshot.error.message);lastSnapshot=snapshot.value;
    el('scale-note').textContent=renderer.apply(snapshot.value,view);renderer.draw();frames++;
    for(const button of document.querySelectorAll<HTMLButtonElement>('[data-marker]')){const id=button.dataset['marker'] as BodyId,p=renderer.marker(id);button.hidden=view.context!=='system'||!p.visible||p.x<50||p.x>canvas.clientWidth-50||p.y<60||p.y>canvas.clientHeight-45;button.style.left=p.x+'px';button.style.top=p.y+'px';}
    el('view-label').textContent=view.context==='system'?'VISTA DEL SISTEMA':`VISTA ${view.context==='local'?'LOCALE':'RAVVICINATA'} · ${data.bodies[view.focus!].name.toUpperCase()}`;
    el('guide-legend').textContent=!view.guides?'GUIDE NASCOSTE':view.context==='system'?'ELLISSI DI RIFERIMENTO · EMB E MARTE':view.focus==='earth'||view.focus==='moon'?'PERCORSO LUNARE RELATIVO · 30 GIORNI':'SUPERFICIE · MAPPA ILLUSTRATIVA';
    if(now-lastUi>150){const s=snapshot.value.states[selected],r=data.bodies[selected].physical.meanRadius!.value;el('body-radius').textContent=numbers.format(r/1000)+' km';
      const relative=selected==='moon'?add(s.positionM,mul(snapshot.value.states.earth.positionM,-1)):s.positionM,velocity=selected==='moon'?add(s.velocityMps,mul(snapshot.value.states.earth.velocityMps,-1)):s.velocityMps;
      el('distance-label').textContent=selected==='moon'?'Distanza dalla Terra · tra i centri':'Distanza dal Sole · tra i centri';el('body-distance').textContent=selected==='sun'?'Origine del sistema':numbers.format(norm(relative)/1000)+' km';el('speed-label').textContent=selected==='moon'?'Velocità rispetto alla Terra':'Velocità rispetto al Sole';el('body-speed').textContent=selected==='sun'?'Origine eliocentrica':numbers.format(norm(velocity)/1000)+' km/s';
      el('time').textContent='J2000 + '+(time.tTdbSeconds/86400).toLocaleString('it-IT',{minimumFractionDigits:3,maximumFractionDigits:3})+' giorni';el('clock-status').textContent=(time.reasons.includes('range-end')?'LIMITE +15 GIORNI · RIPRISTINA PER RIPARTIRE':time.status==='running'?'IN MOVIMENTO · TEMPO TDB':'IN PAUSA · TEMPO TDB');el('play').textContent=time.status==='running'?'Pausa':'Avvia';el<HTMLButtonElement>('play').disabled=time.reasons.includes('range-end');canvas.dataset['clock']=time.status;
      el('fps').textContent=Math.round(frames*1000/(now-lastUi))+' FPS';frames=0;lastUi=now;
    }
  }catch(e){clock.pause('user',performance.now());renderer.engine.stopRenderLoop(render);el('error').hidden=false;el('error').textContent=String(e);}}
  renderer.engine.runRenderLoop(render);life.own(()=>renderer.engine.stopRenderLoop(render));
  notice('Scegli un corpo, poi premi Osserva. Il tempo parte solo con Avvia.');select('earth');
  window.addEventListener('pagehide',event=>{if(event.persisted)clock.pause('hidden',performance.now());else life.dispose();},{signal:events.signal});
  window.addEventListener('pageshow',event=>{if(event.persisted)clock.clearBlock('hidden',performance.now());},{signal:events.signal});
  if(import.meta.hot)import.meta.hot.dispose(()=>life.dispose());
}
