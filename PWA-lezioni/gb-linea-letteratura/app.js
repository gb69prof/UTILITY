import { packLanes, normalize, dateLabel } from './core.js';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const START=1180, END=new Date().getFullYear();
let authors=[],movements=[],links=[],selected=null,scale=5,details=false,showWorks=false,lastFocus=null,installPrompt=null;
const timeline=$('#timeline'),content=$('#timeline-content');let lastWidth=timeline.clientWidth;
const overview=new Set(['religiosa','comunale','umanesimo','rinascimento','barocco','illuminismo','neoclassicismo','romanticismo','verismo','decadentismo','modernismo','neorealismo','narrativa-contemporanea']);
const find=id=>authors.find(a=>a.id===id)||movements.find(m=>m.id===id);
const isAuthor=e=>'nomeCompleto' in e;
const name=e=>e.nomeCompleto||e.nome;
const start=e=>isAuthor(e)?e.timelineStart:e.annoInizio;
const end=e=>isAuthor(e)?(e.annoMorte||END):Math.min(e.annoFine,END);
const color=e=>e.colore||movements.find(m=>m.id===e.correnti[0])?.colore||'#446a87';
const initials=a=>a.nomeCompleto.split(' ').filter(x=>x.length>2).map(x=>x[0]).slice(0,2).join('');
function portrait(a,cls='portrait'){return a.immagine?`<img class="${cls}" src="${esc(a.immagine)}" alt="${esc(a.imageAlt)}" loading="lazy" decoding="async" draggable="false">`:`<span class="${cls} monogram" aria-hidden="true">${initials(a)}</span>`;}
function announce(s){$('#status').textContent=s;}
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,5000);}
function render(){
 content.style.width=`${(END-START)*scale+65}px`;content.style.setProperty('--px',`${scale}px`);
 let ticks='';for(let y=START;y<=END;y+=10){let major=y%50===0;ticks+=`<div class="tick ${major?'major':''}" style="left:${(y-START)*scale}px">${major||scale>=10?`<span>${y}</span>`:''}</div>`;}$('#ruler').innerHTML=ticks;
 const movementList=movements.filter(m=>details||overview.has(m.id));
 const ml=packLanes(movementList.map(m=>({...m,left:(start(m)-START)*scale,width:Math.max(44,(end(m)-start(m))*scale)})),0);
 $('#movements').style.height=`${ml.count*49+7}px`;
 $('#movements').innerHTML=ml.items.map(m=>`<button class="movement ${selected===m.id?'selected':''}" data-id="${m.id}" aria-label="${esc(m.nome)}, circa ${m.annoInizio}–${m.annoFine}" aria-pressed="${selected===m.id}" title="${esc(m.nome)} · circa ${m.annoInizio}–${m.annoFine}" style="left:${m.left}px;top:${m.lane*49}px;width:${m.width}px;--color:${m.colore}"><span>${esc(m.nome)}</span></button>`).join('');
 const ordered=[...authors].sort((a,b)=>b.livelloImportanza-a.livelloImportanza||a.timelineStart-b.timelineStart);
 const al=packLanes(ordered.map(a=>({...a,left:(start(a)-START)*scale,width:Math.max(44,(end(a)-start(a))*scale)})),8);
 const rowHeight=showWorks?87:58;$('#authors').style.height=`${al.count*rowHeight+12}px`;
 $('#authors').innerHTML=al.items.map(a=>`<button class="author ${a.livelloImportanza===2?'main':''} ${a.tipoIntervallo==='attivita'?'activity':''} ${selected===a.id?'selected':''}" data-id="${a.id}" aria-label="${esc(a.nomeCompleto)}, ${esc(dateLabel(a,END))}" aria-pressed="${selected===a.id}" title="${esc(a.nomeCompleto)} · ${esc(dateLabel(a,END))}" style="left:${a.left}px;top:${a.lane*rowHeight+5}px;width:${a.width}px;--color:${color(a)}">${portrait(a)}<span class="name">${esc(a.nomeCompleto)}<small>${esc(dateLabel(a,END))}</small></span></button>${showWorks?`<button class="work-label" data-id="${a.id}" aria-label="Opere di ${esc(a.nomeCompleto)}: ${esc(a.operePrincipali[0])}" style="left:${a.left}px;top:${a.lane*rowHeight+57}px;max-width:${Math.max(a.width,80)}px;--color:${color(a)}">▧ ${esc(a.operePrincipali[0])}</button>`:''}`).join('');
 $("#period-block").classList.toggle("expanded",details);syncFilters();updateYears();
}
function syncFilters(){for(const k of ['authors','movements']){$('#'+k).hidden=!$('#show-'+k).checked;$('#'+k+'-label').hidden=!$('#show-'+k).checked;}}
function updateYears(){
 const from=Math.round(START+timeline.scrollLeft/scale),to=Math.min(END,Math.round(from+timeline.clientWidth/scale));$('#visible-years').textContent=`${from} — ${to}`;
 // Keep labels readable when the beginning of a long interval leaves the viewport.
 for(const band of content.querySelectorAll('.movement')){const label=band.firstElementChild;if(!label)continue;const shift=Math.min(Math.max(0,timeline.scrollLeft-band.offsetLeft+2),Math.max(0,band.clientWidth-label.offsetWidth-20));label.style.transform=`translateX(${shift}px)`;}
}
function goYear(year){lastWidth=timeline.clientWidth;timeline.scrollLeft=(year-START)*scale-lastWidth/2;updateYears();}
function zoomTo(next,anchorX=timeline.clientWidth/2){let year=START+(timeline.scrollLeft+anchorX)/scale;scale=Math.max(2,Math.min(16,Number(next)));$('#zoom').value=scale;render();timeline.scrollLeft=(year-START)*scale-anchorX;updateYears();}
function openPanel(id,{focus=true,center=true}={}){
 const e=find(id);if(!e)return;lastFocus=document.activeElement;selected=id;
 if(isAuthor(e)&&details){details=false;$('#detail-toggle').setAttribute('aria-expanded','false');}
 if(!isAuthor(e)&&!overview.has(id)&&!details){details=true;$('#detail-toggle').setAttribute('aria-expanded','true');}
 const kind=isAuthor(e)?'authors':'movements';$('#show-'+kind).checked=true;$('#panel').hidden=false;render();
 $('#panel-kind').textContent=isAuthor(e)?'UNA VOCE NEL TEMPO':'CORRENTE / AREA CULTURALE';$('#panel-title').textContent=name(e);$('#panel-dates').textContent=isAuthor(e)?dateLabel(e,END):`circa ${e.annoInizio} – ${e.annoFine===2026?'oggi':e.annoFine}`;
 const related=links.filter(l=>e.pwaLinks.includes(l.id)).sort((a,b)=>(a.tipo==='autore'?-1:0)-(b.tipo==='autore'?-1:0));
 let html='';
 if(isAuthor(e)){
  html+=e.immagine?`<img class="panel-image" src="${esc(e.immagine)}" alt="${esc(e.imageAlt)}">`:`<div class="panel-portrait-empty" aria-label="Ritratto non disponibile">${initials(e)}</div>`;
  if(e.imageCredit)html+=`<a class="credits-small" href="${esc(e.imageCredit.url)}" target="_blank" rel="noopener noreferrer">${esc(e.imageCredit.autore||'Fonte immagine')} · ${esc(e.imageCredit.tipo||'Crediti immagine')} ↗</a>`;
  html+=`<section class="panel-section"><h3>Vita in breve</h3><p>${esc(e.vitaBreve)}</p>${e.notaDate?`<p class="note">${esc(e.notaDate)}</p>`:''}</section><section class="panel-section"><h3>Corrente / area culturale</h3><div class="chips">${e.correnti.map(id=>`<button data-id="${id}">${esc(find(id).nome)}</button>`).join('')}</div><p>${esc(e.rapportoCorrente||'Si colloca nell’area di '+e.correnti.map(id=>find(id).nome).join(' e ')+'. Le etichette orientano la lettura, senza esaurire il percorso personale.')}</p></section><section class="panel-section"><h3>Opere principali</h3><ul>${e.operePrincipali.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></section>`;
 }else{
  html+=`<section class="panel-section"><h3>In breve</h3><p>${esc(e.descrizioneBreve)}</p><p class="note">${esc(e.notaDate)} Le fasce possono sovrapporsi e non comprendono necessariamente tutti gli autori contemporanei.</p></section><section class="panel-section"><h3>Autori e relazioni</h3>${e.autoriAssociati.length?`<div class="related-list">${e.autoriAssociati.map(id=>`<button data-id="${id}">${esc(name(find(id)))}</button>`).join('')}</div>`:'<p>Nessuno degli autori attualmente catalogati è assegnato a quest’area. La fascia resta visibile per orientare il quadro storico.</p>'}</section>`;
 }
 if(related.length){
  html+='<section aria-label="Approfondimenti nelle lezioni gbprof">';
  related.forEach((l,i)=>{const dedicated=l.entity===id&&(l.tipo==='autore'||l.tipo==='corrente');const label=dedicated?(isAuthor(e)?`Apri la PWA di ${e.nomeCompleto}`:`Apri la PWA: ${e.nome}`):l.titolo;html+=`<a class="pwa-link ${dedicated?'':'secondary-link'}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(label)}<small>${esc(l.tipo==='autore'?'Percorso autore':l.tipo==='corrente'?'Percorso sulla corrente':l.tipo==='opera'?'Testi e opere':l.tipo==='gioco'?'Esplorazione interattiva':'Contesto culturale')}${dedicated&&i>0?' · '+esc(l.titolo):''} · ${l.repository}</small></span><span aria-hidden="true">↗</span></a>`;});html+='</section>';
 }
 if(isAuthor(e)&&e.fonti?.length)html+=`<section class="panel-section"><details><summary>Fonti biografiche</summary>${e.fonti.map(f=>`<p><a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.titolo)} ↗</a></p>`).join('')}</details></section>`;
 $('#panel-body').innerHTML=html;$('#panel-body').scrollTop=0;$('#panel-action').replaceChildren();const primary=$('#panel-body .pwa-link:not(.secondary-link)');if(primary)$('#panel-action').append(primary);
 if(center){goYear((start(e)+end(e))/2);const b=$(`[data-id="${id}"].${isAuthor(e)?'author':'movement'}`);if(b){const top=b.offsetTop+b.parentElement.offsetTop;timeline.scrollTop=isAuthor(e)?Math.max(0,b.offsetTop-35):0;}}
 if(focus)$('#panel-title').focus({preventScroll:true});announce(name(e)+' selezionato');
 history.replaceState(null,'','#'+id);
}
function closePanel(){$('#panel').hidden=true;const b=$(`.author[data-id="${selected}"],.movement[data-id="${selected}"]`);(b||lastFocus)?.focus({preventScroll:true});updateYears();}
function showDialog(html){$('#dialog-body').innerHTML=html;$('#dialog').showModal();}
function catalogue(kind='authors'){
 const list=kind==='authors'?authors:movements;
 showDialog(`<h2>Esplora la letteratura</h2><p>Scegli una voce per raggiungerla sulla linea del tempo.</p><div class="catalogue-tabs"><button data-catalogue="authors" aria-pressed="${kind==='authors'}">84 autori</button><button data-catalogue="movements" aria-pressed="${kind==='movements'}">43 correnti e aree</button></div><div class="catalogue-grid">${[...list].sort((a,b)=>start(a)-start(b)).map(e=>`<button data-id="${e.id}">${esc(name(e))}<small>${isAuthor(e)?esc(dateLabel(e,END)):`circa ${e.annoInizio}–${e.annoFine}`}</small></button>`).join('')}</div>`);
}
function search(){const q=normalize($('#search').value.trim());const results=$('#results');if(!q){results.hidden=true;$('#search').setAttribute('aria-expanded','false');return;}
 const found=[...authors,...movements].filter(e=>normalize(name(e)+' '+(e.operePrincipali||[]).join(' ')).includes(q)).sort((a,b)=>Number(normalize(name(b)).includes(q))-Number(normalize(name(a)).includes(q))).slice(0,12);
 results.innerHTML=found.length?found.map(e=>{const work=isAuthor(e)&&!normalize(name(e)).includes(q)?e.operePrincipali.find(w=>normalize(w).includes(q)):null;return `<button data-id="${e.id}">${esc(work||name(e))}<small>${work?esc(name(e))+' · ':''}${isAuthor(e)?'Autore · '+esc(dateLabel(e,END)):'Corrente / area culturale'}</small></button>`;}).join(''):'<p>Nessun risultato. Prova con un cognome, una corrente o un’opera.</p>';results.hidden=false;$('#search').setAttribute('aria-expanded','true');}
$('#search').addEventListener('input',search);
$('#search').addEventListener('keydown',e=>{if(['ArrowDown','Enter'].includes(e.key)){const first=$('#results button');if(first){e.preventDefault();if(e.key==='Enter')first.click();else first.focus();}}if(e.key==='Escape'){$('#results').hidden=true;$('#search').setAttribute('aria-expanded','false');}});
$('#results').addEventListener('keydown',e=>{const buttons=[...$('#results').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();buttons[Math.min(i+1,buttons.length-1)]?.focus();}if(e.key==='ArrowUp'){e.preventDefault();if(i===0)$('#search').focus();else buttons[i-1]?.focus();}});
document.addEventListener('click',async e=>{
 const item=e.target.closest('[data-id]');if(item){if($('#dialog').open)$('#dialog').close();$('#results').hidden=true;$('#search').setAttribute('aria-expanded','false');openPanel(item.dataset.id);return;}
 if(!e.target.closest('.search-wrap')){$('#results').hidden=true;$('#search').setAttribute('aria-expanded','false');}
 const cat=e.target.closest('[data-catalogue]');if(cat){$('#dialog').close();catalogue(cat.dataset.catalogue);return;}
 const action=e.target.closest('[data-action]')?.dataset.action;
 switch(action){case 'home':scale=5;$('#zoom').value=5;openPanel('leopardi',{focus:false});break;case 'catalogue':catalogue();break;
 case 'past':timeline.scrollLeft-=timeline.clientWidth*.65;break;case 'future':timeline.scrollLeft+=timeline.clientWidth*.65;break;
 case 'origins':timeline.scrollLeft=0;timeline.scrollTop=0;break;case 'today':goYear(END);timeline.scrollTop=0;break;
 case 'zoom-in':zoomTo(scale+1);break;case 'zoom-out':zoomTo(scale-1);break;
 case 'install':if(installPrompt){await installPrompt.prompt();installPrompt=null;$('#install').hidden=true;}break;
 case 'help':showDialog(`<h2>Leggere il tempo</h2><p>Trascina la timeline con il mouse, scorri con due dita sul trackpad o con un dito sul tablet. Usa la barra inferiore per lo zoom e per raggiungere origini e presente.</p><h3>Due letture, un solo tempo</h3><p>Le fasce colorate superiori rappresentano correnti e aree culturali: i loro limiti sono orientativi. “Tutte le correnti” apre anche i percorsi più specifici. Le fasce degli autori vanno dalla nascita alla morte, oppure fino a oggi. Il simbolo ≈ segnala date incerte. Per Ferrante il bordo tratteggiato indica attività editoriale dal 1992, non durata della vita.</p><p>Le opere nel filtro sono richiami sotto l’autore: la loro posizione non rappresenta una data di pubblicazione. Le opere complete del catalogo sono ricercabili e compaiono nel pannello.</p><h3>Tastiera e schermi piccoli</h3><p>Con il focus sulla timeline usa ← e →; + e − regolano lo zoom, Home ed End portano agli estremi. Tab raggiunge i pulsanti e Invio apre la scheda. Esc chiude il pannello o la finestra. Su telefono e iPad verticale la scheda si apre in basso e lascia visibile la timeline.</p><h3>Installazione e offline</h3><p>Su un browser compatibile usa “Installa” quando compare, oppure il menu del browser. Su iPad: Safari → Condividi → Aggiungi alla schermata Home. Dopo il primo caricamento completo, struttura, dati e ritratti locali restano disponibili offline. I collegamenti ad altre lezioni richiedono una connessione; la loro disponibilità offline dipende dalla singola PWA.</p>`);break;
 case 'credits':showDialog(`<h2>Fonti e crediti</h2><p>GB — Letteratura italiana nel tempo · versione 1.0 · inventario verificato il 12 settembre 2026.</p><p>84 autori, 43 correnti e aree culturali, 40 collegamenti a PWA dell’ecosistema gbprof. Le sintesi sono redazionali; le classificazioni orientano senza sostituire l’analisi delle opere.</p><h3>Materiali didattici</h3><p>Catalogazione basata sull’ispezione di pagine, dati e manifest dei repository <a href="https://github.com/gb69prof/III-anno">III-anno</a>, <a href="https://github.com/gb69prof/IV-anno">IV-anno</a> e <a href="https://github.com/gb69prof/V-anno">V-anno</a>. I collegamenti sono stati controllati sul sito pubblico.</p><h3>Immagini</h3><p>Ritratti riutilizzati dalle lezioni del docente, dove disponibili; eventuali ricostruzioni sono immagini didattiche. Altre immagini provengono da Wikimedia Commons: attribuzione e licenza sono accessibili dalla scheda di ciascun autore. I monogrammi segnalano l’assenza di un ritratto locale verificato. Per Elena Ferrante non viene attribuito un volto.</p><p>Panorama generato con lo strumento integrato ImageGen, seguendo il riferimento grafico fornito dal docente. Soggetto: Dante, Firenze, libro e penna, paesaggio romantico e macchina da scrivere, senza testi.</p><p><a href="docs/FONTI-E-METODO.md" target="_blank">Fonti, metodo e limiti del catalogo ↗</a> · <a href="data/existing-pwa-map.json" target="_blank">Inventario dei materiali ↗</a></p>`);break;
 }
});
$('#close-panel').addEventListener('click',closePanel);$('.dialog-close').addEventListener('click',()=>$('#dialog').close());
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#dialog').open){$('#results').hidden=true;if(!$('#panel').hidden)closePanel();}});
$('#zoom').addEventListener('input',e=>zoomTo(e.target.value));
$('#detail-toggle').addEventListener('click',()=>{details=!details;$('#detail-toggle').setAttribute('aria-expanded',String(details));render();});
for(const id of ['authors','movements'])$('#show-'+id).addEventListener('change',syncFilters);
$('#show-works').addEventListener('change',e=>{showWorks=e.target.checked;render();if(showWorks)toast('Le opere sono richiami sotto l’autore, senza data di pubblicazione.');});
timeline.addEventListener('scroll',updateYears,{passive:true});new ResizeObserver(()=>{const width=timeline.clientWidth;if(lastWidth&&Math.abs(width-lastWidth)>1)timeline.scrollLeft+=(lastWidth-width)/2;lastWidth=width;updateYears();}).observe(timeline);
timeline.addEventListener('keydown',e=>{if(e.target!==timeline)return;const handlers={ArrowLeft:()=>timeline.scrollLeft-=100,ArrowRight:()=>timeline.scrollLeft+=100,Home:()=>timeline.scrollLeft=0,End:()=>timeline.scrollLeft=timeline.scrollWidth,'+':()=>zoomTo(scale+1),'=':()=>zoomTo(scale+1),'-':()=>zoomTo(scale-1)};if(handlers[e.key]){e.preventDefault();handlers[e.key]();}});
let drag=null,suppressClick=false;
timeline.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:timeline.scrollLeft,top:timeline.scrollTop,moved:false};});
timeline.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>6){drag.moved=true;timeline.setPointerCapture(e.pointerId);timeline.classList.add('dragging');}if(drag.moved){timeline.scrollLeft=drag.left-dx;timeline.scrollTop=drag.top-dy;}});
function stopDrag(){if(!drag)return;suppressClick=drag.moved;drag=null;timeline.classList.remove('dragging');setTimeout(()=>suppressClick=false,0);}
timeline.addEventListener('pointerup',stopDrag);timeline.addEventListener('pointercancel',stopDrag);
timeline.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();}},{capture:true});
timeline.addEventListener('wheel',e=>{if(e.shiftKey&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();timeline.scrollLeft+=e.deltaY;}},{passive:false});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install').hidden=false;});
async function offline(){
 if(location.hostname==='127.0.0.1'&&!location.search.includes('offline-test')){$('#connection').textContent='Anteprima locale';return;}
 if(!('serviceWorker' in navigator)){$('#connection').textContent='Browser senza offline';return;}
 try{const registration=await navigator.serviceWorker.register('./service-worker.js');await navigator.serviceWorker.ready;const ready=()=>$('#connection').textContent=navigator.onLine?'Disponibile offline':'Modalità offline';ready();window.addEventListener('online',ready);window.addEventListener('offline',ready);if(registration.waiting)toast('Aggiornamento pronto: chiudi e riapri la PWA.');registration.addEventListener('updatefound',()=>{registration.installing?.addEventListener('statechange',()=>{if(registration.waiting)toast('Nuova versione pronta. Chiudi tutte le schede della PWA e riaprila per aggiornarla.');});});}catch{$('#connection').textContent='Offline non disponibile';}
}
try{
 [authors,movements,links]=await Promise.all(['authors','movements','pwa-links'].map(async f=>{const r=await fetch(`data/${f}.json`);if(!r.ok)throw Error(f);return r.json();}));
 openPanel(find(location.hash.slice(1))?.id||'leopardi',{focus:false});if(innerWidth<=550&&!location.search.includes('offline-test'))$('#panel').hidden=true;offline();
}catch(error){$('#timeline-content').innerHTML='<p class="no-elements">Impossibile caricare i dati. Controlla la connessione e ricarica la pagina.</p>';$('#connection').textContent='Caricamento non riuscito';console.error(error);}
