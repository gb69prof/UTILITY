const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let periods, sites, sources, images, map, markers, phase = 0, tab = 'esplora', followed = '', all = false;
const captions = {
 paglicci: 'Fotografia attuale dell’ingresso di Grotta Paglicci. Mostra il riparo calcareo, non il suo ambiente paleolitico.',
 corvo: 'Fossato riportato alla luce a Passo di Corvo. È una fotografia dello scavo moderno; non mostra un villaggio neolitico abitato.',
 coppa: 'Pianta scientifica degli scavi e fotografie aeree di Coppa Nevigata, campagne 1983–2015. Documenta strutture e aree indagate, non l’aspetto completo del centro antico.',
 saraceno: 'Tomba scavata nella roccia a Monte Saraceno, con la costa attuale sullo sfondo. La cronologia qui segue Nava, non la descrizione del caricamento Commons.',
 arpi: 'Fotografia di figurine di amazzonomachia attribuite ad Arpi, circa 300 a.C. Un tema figurativo è un indizio di contatti culturali, non una prova di conquista greca.',
 herdonia: 'Resti del macellum di Herdonia: spazi del mercato urbano. La fotografia moderna non ricostruisce alzati e attività antiche.',
 siponto: 'Resti della basilica paleocristiana di Siponto, prima dell’installazione contemporanea del 2016. Documenta una struttura, non l’intera città tardoantica.',
 faragola: 'Veduta aerea dello scavo di Faragola nel 2006, prima dell’incendio del 2017. Non descrive lo stato attuale del sito.',
 cervo: 'Cervo rosso fotografato oggi in Polonia. Immagine di riferimento della specie, non del paesaggio antico del Gargano: resti di cervo sono attestati in livelli di Paglicci.',
 landscape: 'Mattinata oggi: costa, versanti e spazi coltivati. Paesaggio moderno antropizzato — non fotografia del paesaggio antico.'
};
const roleNotes = {
 paglicci:{0:'Riparo, attività tecniche, sepolture: episodi differenti.'},
 scaloria:{0:'Paleolitico finale / Epipaleolitico: attribuzione discussa.',1:'Frequentazioni di cacciatori-raccoglitori: date e associazioni problematiche.',2:'Usi funerari, rituali e plurifunzionali della cavità.'},
 corvo:{2:'Villaggio: fossati, pozzi, spazi organizzati e sepolture.'},
 coppa:{2:'Fasi precedenti al centro fortificato del Bronzo.',3:'Tracce del Rame: non proiettiamo indietro le grandi fortificazioni.',4:'Centro fortificato, produzione e scambi transmarini.',5:'Tracce antropiche nei carotaggi: non identico abitato del Bronzo.'},
 saraceno:{4:'Avvio nel Bronzo finale, non in tutta l’età del Bronzo.',5:'Abitato e necropoli, con particolare sviluppo nel IX secolo.',6:'Proseguimento agli inizi del VII secolo; poi attestazioni in diminuzione.'},
 arpi:{5:'Prime occupazioni: organizzazione del territorio in formazione.',6:'Aggregazione e organizzazione del grande centro.',7:'Residenze, tombe e rapporti culturali e politici.',8:'Conflitti e ridefinizione dei rapporti con Roma.',9:'Evidenze in settori specifici; estensione complessiva incerta.'},
 herdonia:{5:'Nuclei abitativi e funerari, con evidenze IX–VIII secolo.',6:'Abitato diffuso, tombe e attività produttive.',7:'Trasformazioni dell’insediamento daunio.',8:'Progressiva riorganizzazione nel quadro romano.',9:'Città, mercato, terme, acquedotto e rete della via Traiana.',10:'Riorganizzazione urbana e del rapporto città–campagne.'},
 ausculum:{6:'Case e tombe: le evidenze della Collina del Serpente iniziano nel VI secolo.',7:'Edifici, tombe e riorganizzazioni fra IV e III secolo.',8:'Usi funerari: non prova di abitazione continua.',9:'Persistenze funerarie fino al II secolo d.C.; non abitato continuo.'},
 'salapia-vetus':{5:'Primi nuclei e necropoli; sono documentati cambiamenti e interruzioni.',6:'Riorganizzazioni nell’ambiente lagunare.',7:'Abitato lagunare e relazioni; non costa uguale a quella moderna.',8:'Trasferimento in tarda Repubblica: la città romana è in un altro luogo.'},
 salapia:{8:'Rifondazione alla fine del I secolo a.C., non in tutta la fase.',9:'Abitazioni e attività artigianali, compresa la conceria.',10:'Domus/conceria e riorganizzazioni fino al V secolo; continuità diseguale.'},
 siponto:{8:'Colonia dal 194 a.C.; l’antecedente daunio è altrove.',9:'Città e funzioni portuali.',10:'Basilica e sede episcopale: nuova organizzazione di spazi e funzioni.'},
 lucera:{6:'Centro daunio sulle alture: conoscenza parziale.',7:'Fase daunia e passaggio alla colonia latina.',8:'Colonia latina del 314 a.C.: ridefinizione politica e territoriale.',9:'Spazi urbani e anfiteatro di età augustea.',10:'Ruoli amministrativi e trasformazioni urbane.'},
 faragola:{6:'Abitato daunio dal V secolo: non dall’inizio del VII.',7:'Insediamento daunio fino al III secolo.',8:'Fattoria/villa romana: tempi e assetti non completamente definiti.',9:'Precedente residenza e avvio del complesso monumentale dal III secolo.',10:'Villa, terme e cenatio; nuova organizzazione fra VII e VIII secolo.'}
};
function refs(ids) { return `<div class="citations" aria-label="Fonti delle affermazioni">${[...new Set(ids || [])].map(id => sources[id] ? `<a href="${esc(sources[id].url)}" target="_blank" rel="noopener noreferrer">${esc(sources[id].title)}</a>` : '').join('')}</div>`; }
function badge(status='documentato') { return `<span class="badge ${status==='interpretazione'?'interpretation':status==='limite'?'limit':''}">${esc(status)}</span>`; }
function evidence(item) { return `<article>${badge(item.status)}<h4>${esc(item.label)}</h4><p>${esc(item.text)}</p>${refs(item.sources)}</article>`; }
function figure(id) { const i=images[id]; return i ? `<figure><button class="image-open" data-image="${id}" aria-label="Ingrandisci fotografia: ${esc(i.title)}"><img src="./${i.file}" alt="${esc(captions[id])}" loading="lazy"></button><figcaption>${esc(captions[id])}<br>${esc(i.author)} · ${esc(i.license)} · <a href="${esc(i.source)}" target="_blank" rel="noopener noreferrer">Originale e credito</a></figcaption></figure>` : ''; }
function showTab(name, focus=false) {
 if(!['esplora','percorso','ambiente','metodo','fonti'].includes(name)) return;
 tab=name; document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==name);
 document.querySelectorAll('[data-tab]').forEach(el=>{if(el.dataset.tab===name)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 history.replaceState(null,'',`#${name}`); if(name==='esplora')requestAnimationFrame(()=>map?.invalidateSize());
 if(focus){const h=$(`#${name} h2`);if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
}
function visibleSites(){const term=$('#search').value.toLocaleLowerCase('it');const zone=$('#zone').value;return sites.filter(s=>(all||s.mappedPeriods.includes(phase)||s.id===followed)&&(!zone||s.zone===zone)&&(!term||[s.name,s.place,s.environment,s.impact,s.kind].join(' ').toLocaleLowerCase('it').includes(term)));}
function setPhase(n){const keepFocus=document.activeElement?.matches('[data-phase]');phase=Math.max(0,Math.min(periods.length-1,n));render();if(keepFocus)$('#timeline [aria-pressed=true]')?.focus({preventScroll:true});$('#timeline [aria-pressed=true]')?.scrollIntoView({behavior:'instant',block:'nearest',inline:'nearest'});}
function render(){
 const p=periods[phase]; $('#prev').disabled=phase===0;$('#next').disabled=phase===periods.length-1;
 $('#timeline').innerHTML=periods.map((x,i)=>`<button class="phase" data-phase="${i}" aria-pressed="${i===phase}" title="${esc(x.dates)}"><span class="num">${String(i+1).padStart(2,'0')}</span>${esc(x.name)}</button>`).join('');
 $('#map-title').textContent=all?'Tutti i luoghi del percorso':p.name;
 $('#period-panel').innerHTML=`<p class="eyebrow">${all?'Confronto fra fasi':'La fase selezionata'}</p><p class="period-dates">${esc(p.dates)}</p><h3>${esc(p.title)}</h3><p>${esc(p.intro[0])}</p><h4>Che cosa cambia nel territorio</h4><p>${esc(p.change.join(' '))}</p><button data-tab="percorso">Leggi la fase →</button><p class="micro">${esc(p.limits)}</p>`;
 const v=visibleSites(); $('#count').textContent=`${v.length} luoghi nella selezione${v.some(s=>!s.coordinates)?' · un luogo senza punto verificato':''}`;
 $('#sites').innerHTML=v.length?v.map(s=>`<article class="site-card">${badge(s.mappedPeriods.includes(phase)?'documentato':'limite')}<h3>${esc(s.name)}</h3><p class="place">${esc(s.place)}</p><p>${esc(all?s.dates:roleNotes[s.id]?.[phase]||'Questa selezione non documenta frequentazione nella fase. Apri la storia del luogo.')}</p><p>${esc(s.summary)}</p>${!s.coordinates?'<p class="micro">Georeferenziazione da verificare: presente nell’elenco, senza punto sulla carta.</p>':''}<button class="site-open" data-site="${s.id}">Esplora il luogo →</button></article>`).join(''):'<p class="notice">Nessun luogo corrisponde ai filtri. L’assenza nell’elenco non prova l’assenza di frequentazione nel territorio.</p>';
 markers.clearLayers();v.filter(s=>s.coordinates).forEach(s=>{
  const present=s.mappedPeriods.includes(phase);const number=sites.indexOf(s)+1;
  const m=L.marker(s.coordinates,{title:s.name,alt:s.name,icon:L.divIcon({className:'site-marker',html:`<span class="marker-dot ${present||all?'':'absent'}">${number}</span>`,iconSize:[26,26],iconAnchor:[13,13]})}).addTo(markers).bindTooltip(s.name,{direction:'top',offset:[0,-12]});
  m.on('click',()=>openSite(s.id));
 });
 renderFollow();renderLesson();renderComparison();$('#live').textContent=`${p.name}. ${v.length} luoghi nella selezione.`;
}
function renderFollow(){
 const s=sites.find(x=>x.id===followed);$('#follow-panel').hidden=!s;if(!s)return;
 const active=s.mappedPeriods.includes(phase);
 $('#follow-panel').innerHTML=`<p class="eyebrow">Segui un luogo</p><h3>${esc(s.name)}</h3><div class="follow-track">${periods.map((p,i)=>`<button data-phase="${i}" class="${s.mappedPeriods.includes(i)?'present':''}" ${i===phase?'aria-current="step"':''}><strong>${esc(p.name)}</strong><br>${s.mappedPeriods.includes(i)?'Evidenze selezionate':'Non documentato qui'}</button>`).join('')}</div><p>${badge(active?'documentato':'limite')}${esc(roleNotes[s.id]?.[phase]||'Non documentiamo una frequentazione di questo luogo in questa fase. Non significa che ogni presenza sia esclusa: la ricerca e la conservazione dei depositi hanno limiti.')}</p><button data-site="${s.id}">Leggi fasi e interruzioni</button><p class="micro">Caselle piene = evidenze per almeno una parte della fase. Non indicano occupazione continua, funzione immutata o uguale durata.</p>`;
}
function environment(p){return `<div class="environment-grid">${Object.entries(p.environment).map(([k,v])=>`<div class="environment-item"><h4>${esc(k[0].toUpperCase()+k.slice(1))}</h4><p>${esc(v)}</p></div>`).join('')}</div>`;}
function renderLesson(){const p=periods[phase];$('#lesson').innerHTML=`<p class="eyebrow">${String(phase+1).padStart(2,'0')} / Una storia di scelte e trasformazioni</p><h2>${esc(p.title)}</h2><p class="period-dates">${esc(p.name)} · ${esc(p.dates)}</p><div class="reading">${p.intro.map(t=>`<p>${esc(t)}</p>`).join('')}</div><div class="lesson-grid"><article class="lesson-block"><h3>L’ambiente e le risorse</h3>${environment(p)}</article><article class="lesson-block"><h3>Presenza umana e antropizzazione</h3>${p.change.map(t=>`<p>${esc(t)}</p>`).join('')}<div class="callout"><h4>Domanda per la classe</h4><p>${esc(p.question)}</p></div><h4>Ciò che non possiamo concludere</h4><p>${esc(p.limits)}</p><button data-tab="esplora">Cerca le evidenze sulla carta →</button></article></div>${refs(p.sources)}<div class="callout"><h3>Il filo del percorso</h3><p>Ambiente naturale → presenza e frequentazione → stanziamento e gestione degli spazi → organizzazione economica e politica. È una relazione da verificare in ogni caso, non una scala «primitivo–evoluto». Alcuni luoghi cambiano funzione, altri perdono importanza; nuove reti possono includere e marginalizzare territori diversi.</p></div>`;}
function renderComparison(){const p=periods[phase];$('#comparison').innerHTML=`<p class="eyebrow">${esc(p.name)} · confronto delle evidenze</p><h2>Prima / dopo: che cosa cambia?</h2><p class="lead">Un confronto ragionato, non due fotografie impossibili del passato. «Prima» descrive condizioni e processi; «dopo» presenta tracce di trasformazione. I fenomeni naturali proseguono anche negli ambienti antropizzati.</p><div class="compare-grid"><article class="compare-card">${badge('interpretazione')}<h3>Ambiente e condizioni</h3>${p.before.map(t=>`<p>${esc(t)}</p>`).join('')}<h4>Dato paleoambientale</h4><p>${esc(p.environment.acqua)}</p></article><article class="compare-card">${badge('documentato')}<h3>Tracce di presenza e trasformazione</h3>${p.after.map(t=>`<p>${esc(t)}</p>`).join('')}<h4>Dato archeologico</h4><p>${esc(p.change.join(' '))}</p></article></div>${refs(p.sources)}<div class="lesson-grid"><article><h3>Un ambiente moderno da leggere</h3>${figure('landscape')}<p class="micro">Distingui costa, rilievi e coltivi. Questa fotografia aiuta a osservare un territorio attuale; non dimostra né il clima né la vegetazione antichi.</p></article><article><h3>Un indicatore, con i suoi limiti</h3>${figure('cervo')}${refs(['paglicci-strati','paglicci-fauna'])}<p class="micro">Un resto animale è datato e interpretato nel contesto. La presenza del cervo da sola non permette di disegnare una foresta o di identificare chi lo abbia introdotto nella grotta.</p></article></div><div class="callout"><h3>Dal campione al paesaggio: non saltare i passaggi</h3><p>La carota di Frattarolo–Lago Salso documenta cambiamenti nella vegetazione e nell’ambiente lagunare in una sequenza locale. Un’interruzione dei sedimenti limita il racconto delle fasi successive. A Coppa Nevigata, invece, riporti e compattazione possono documentare interventi umani specifici: non ogni cambiamento della laguna ha la stessa causa.</p>${refs(['paleo-laguna','coppa-sedimenti'])}</div>`;}
function openSite(id){const s=sites.find(x=>x.id===id);if(!s)return;
 $('#detail-body').innerHTML=`<p class="eyebrow">${esc(s.zone)} · ${esc(s.kind)}</p><h2 id="detail-title">${esc(s.name)}</h2><p class="period-dates">${esc(s.dates)}</p><p class="lead">${esc(s.summary)}</p><p>${esc(s.place)}</p>${figure(s.image)}<h3>Ambiente, risorse e posizione</h3><p>${esc(s.environment)}</p><h3>Le evidenze</h3>${s.documented.map(evidence).join('')}<div class="why"><p class="eyebrow">Perché proprio qui?</p><h3>${esc(s.question)}</h3><p>${s.factors.map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</p><label for="hypothesis">Formula un’ipotesi prima di leggere (non viene salvata).</label><textarea id="hypothesis" placeholder="Collega una risorsa, una scelta e una traccia verificabile…"></textarea><button id="reveal" aria-expanded="false" aria-controls="explanation">Confronta con le evidenze</button><div id="explanation" hidden><p>${badge('interpretazione')}${esc(s.interpretation)}</p><p>${esc(s.answer)}</p>${refs(s.sources)}</div></div><h3>Attività e trasformazione dell’ambiente</h3><p>${esc(s.impact)}</p>${refs(s.sources)}<h3>Fasi, cambiamenti e interruzioni</h3><div class="history">${s.history.map(evidence).join('')}</div><button data-follow="${s.id}">Segui questo luogo nella linea del tempo →</button><div class="callout"><h3>Limiti dell’interpretazione</h3><p>${esc(s.limits)}</p></div><details><summary>Localizzazione e provenienza delle coordinate</summary><p>${s.coordinates?`${s.coordinates[0].toFixed(5)} N, ${s.coordinates[1].toFixed(5)} E · WGS84`:'Coordinate non inserite: georeferenziazione da verificare.'}</p><p>${esc(s.coordinateMethod)}</p>${s.coordinateSource?`<a href="${esc(s.coordinateSource)}" target="_blank" rel="noopener noreferrer">Fonte geografica</a>`:''}</details><h3>Fonti della scheda</h3>${refs(s.sources)}`;
 if(!$('#detail').open)$('#detail').showModal();$('#detail').scrollTop=0;
}
function openPhoto(id){const i=images[id];if(!i)return;$('#photo-body').innerHTML=`<h2 id="photo-title">${esc(i.title.replace('File:',''))}</h2><img src="./${i.file}" alt="${esc(captions[id])}"><p>${esc(captions[id])}</p><p><strong>Autore:</strong> ${esc(i.author)}<br><strong>Data riportata:</strong> ${esc(i.date)}<br><strong>Licenza:</strong> ${i.licenseUrl?`<a href="${esc(i.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(i.license)}</a>`:esc(i.license)}<br><strong>Copia locale:</strong> ${esc(i.modification)}</p><a href="${esc(i.source)}" target="_blank" rel="noopener noreferrer">Pagina originale, provenienza e metadati →</a>`;if(!$('#photo').open)$('#photo').showModal();$('#photo').scrollTop=0;}
function renderSources(){
 $('#sources').innerHTML=Object.entries(sources).map(([id,s])=>`<article class="source" id="source-${id}"><span class="badge">${esc(s.kind)}</span><br><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><p>${esc(s.note)}</p><span class="micro">Consultata: ${esc(s.accessed)}</span></article>`).join('');
 $('#gallery').innerHTML=Object.keys(images).map(figure).join('');
 const methods=[
 ['Stratigrafia e datazioni','A Scaloria, livelli disturbati e datazioni radiocarboniche richiedono di rivedere vecchie attribuzioni. Un carbone vicino a un osso non data automaticamente la deposizione di quell’osso.',['scaloria']],
 ['Resti animali','A Paglicci, grandi e piccoli mammiferi aiutano a ricostruire ambienti di specifici livelli. Occorre distinguere caccia umana, predazione animale e accumuli naturali.',['paglicci-fauna','paglicci-strati']],
 ['Pollini, semi e carboni','I pollini dei sedimenti di Frattarolo indicano cambiamenti della vegetazione. Semi e carboni, quando identificati in contesti datati, possono documentare risorse e attività: qui non inventiamo specie coltivate prive di analisi locali.',['paleo-laguna','scaloria']],
 ['Ceramiche e reperti','A Coppa Nevigata, materiali e produzioni italo-micenee permettono di discutere scambi e tecniche. Il luogo di produzione e il contesto contano più della sola somiglianza stilistica.',['coppa-scambi']],
 ['Sepolture e strutture','Monte Saraceno e Ausculum mostrano spazi funerari organizzati. Una tomba non equivale a una casa; resti di abitato e necropoli devono essere letti insieme e datati separatamente.',['nava','ausculum','ausculum-necropoli']],
 ['Foto aeree e ricognizioni','Fossati, tracce sul terreno e anomalie geofisiche rivelano strutture senza scavare tutto. A Salapia le anomalie sono confrontate con scavi e paesaggio: non ogni linea è una strada certa.',['salapia-studio','corvo-II']],
 ['Sedimenti e coste','A Coppa Nevigata i carotaggi distinguono riporti antropici e processi geomorfologici. Le coste antiche richiedono modelli locali e date: la costa moderna non può sostituirli.',['coppa-sedimenti','coppa-laguna']],
 ['Architetture e infrastrutture','Terme e acquedotto a Herdonia, villa e cenatio a Faragola: le strutture rendono visibili nuove esigenze, investimenti e modi di organizzare gli spazi.',['herdonia-acqua','faragola']],
 ['Controllare le alternative','Un paesaggio più aperto può dipendere da clima e processi naturali, oltre che dall’uomo. Un intervallo privo di reperti può dipendere da abbandono, mancata indagine o erosione. Le interpretazioni devono spiegare questi limiti.',['paleo-laguna','paglicci-strati']]
 ];
 $('#methods').innerHTML=methods.map(([title,text,ids],n)=>`<article class="method-card"><span class="index">${String(n+1).padStart(2,'0')}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${refs(ids)}</article>`).join('');
}
const questions=[
 {q:'Un livello di Paglicci contiene ossa di cervo. Che cosa puoi concludere?',a:['Il Gargano era coperto ovunque da foreste.','Il cervo è attestato in quel contesto; provenienza e accumulo richiedono analisi.','Ogni osso prova una battuta di caccia.'],correct:1,why:'Contesto, datazione e processi di accumulo precedono una ricostruzione ambientale.',phase:0},
 {q:'Perché i fossati di Passo di Corvo sono una traccia importante?',a:['Mostrano organizzazione intenzionale degli spazi del villaggio.','Provano un confine di Stato.','Permettono di fotografare la vita neolitica.'],correct:0,why:'Una struttura documenta un intervento umano; funzione precisa e contesto richiedono ricerca.',phase:2},
 {q:'A Coppa Nevigata trovi ceramiche di tradizione micenea. Che cosa devi verificare?',a:['Soltanto il colore del vaso.','Che ogni abitante fosse greco.','Produzione, datazione e contesto: contatto culturale non equivale a conquista.'],correct:2,why:'Importazioni, produzioni locali e trasferimento di tecniche sono possibilità diverse.',phase:4},
 {q:'Come segui Salapia nel tempo?',a:['Mantieni tutte le fasi su un unico punto.','Distingui Salapia vetus e il luogo della rifondazione romana.','Sposti automaticamente la costa in base al periodo.'],correct:1,why:'Il trasferimento è una trasformazione territoriale: i due luoghi non vanno fusi.',phase:8},
 {q:'Una foto di Faragola del 2006 mostra…',a:['Lo scavo in quella data, con limiti dichiarati.','La villa esattamente come appariva nel V secolo.','Lo stato attuale del sito.'],correct:0,why:'La fotografia documenta un momento dello scavo moderno, precedente anche all’incendio del 2017.',phase:10}
];
let quizIndex=0;
function renderQuiz(){const q=questions[quizIndex];$('#quiz').innerHTML=`<p class="micro">Caso ${quizIndex+1} di ${questions.length}</p><p><strong>${esc(q.q)}</strong></p><div class="quiz-options">${q.a.map((t,i)=>`<button data-answer="${i}">${esc(t)}</button>`).join('')}</div><div id="quiz-feedback" role="status" aria-live="polite"></div>`;}
async function init(){
 try{
  [periods,sites,sources,images]=await Promise.all(['periods','sites','sources','images'].map(async f=>{const r=await fetch(`./data/${f}.json`);if(!r.ok)throw Error(`Dati non disponibili: ${f}`);return r.json();}));
  const [land,rivers]=await Promise.all(['land','rivers'].map(async f=>{const r=await fetch(`./data/${f}.geojson`);if(!r.ok)throw Error('Carta non disponibile');return r.json();}));
  map=L.map('map',{minZoom:7,maxZoom:14,zoomControl:true,scrollWheelZoom:false}).setView([41.48,15.65],8);
  map.attributionControl.setPrefix(false);L.geoJSON(land,{style:{color:'#9eab91',weight:1.3,fillColor:'#e6e9d8',fillOpacity:1}}).addTo(map);L.geoJSON(rivers,{style:{color:'#6a999b',weight:1.5}}).addTo(map);
  map.attributionControl.addAttribution('Costa moderna: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · Coordinate: schede');
  [['Gargano',41.81,15.91],['Tavoliere',41.45,15.53],['Adriatico',41.85,16.41],['Subappennino',41.42,15.1]].forEach(([n,lat,lon])=>L.marker([lat,lon],{interactive:false,keyboard:false,icon:L.divIcon({className:'region-label',html:n,iconSize:[120,22]})}).addTo(map));
  markers=L.layerGroup().addTo(map);
  $('#zone').insertAdjacentHTML('beforeend',[...new Set(sites.map(s=>s.zone))].map(z=>`<option>${esc(z)}</option>`).join(''));
  $('#follow').insertAdjacentHTML('beforeend',sites.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join(''));
  renderSources();renderQuiz();render();showTab(location.hash.slice(1)||'esplora');$('#loading').hidden=true;
 }catch(e){$('#loading').textContent=`Caricamento non riuscito. ${e.message}. Riprova con una connessione, oppure ricarica la copia offline completa.`;console.error(e);return;}
 document.addEventListener('click',e=>{
  const phaseButton=e.target.closest('[data-phase]');if(phaseButton)setPhase(Number(phaseButton.dataset.phase));
  const nav=e.target.closest('[data-tab]');if(nav)showTab(nav.dataset.tab,true);
  const site=e.target.closest('[data-site]');if(site)openSite(site.dataset.site);
  const img=e.target.closest('[data-image]');if(img){e.preventDefault();openPhoto(img.dataset.image);}
  const follow=e.target.closest('[data-follow]');if(follow){followed=follow.dataset.follow;$('#follow').value=followed;$('#detail').close();$('#all').checked=all=false;$('#zone').value='';$('#search').value='';render();showTab('esplora');$('#follow-panel').scrollIntoView({block:'center'});}
  if(e.target.id==='reveal'){const open=$('#explanation').hidden;$('#explanation').hidden=!open;e.target.setAttribute('aria-expanded',open);e.target.textContent=open?'Nascondi la spiegazione':'Confronta con le evidenze';}
  const answer=e.target.closest('[data-answer]');if(answer){const q=questions[quizIndex];const right=Number(answer.dataset.answer)===q.correct;document.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;if(Number(b.dataset.answer)===q.correct)b.classList.add('correct');else if(b===answer)b.classList.add('wrong');});$('#quiz-feedback').innerHTML=`<p><strong>${right?'Conclusione corretta.':'Rivedi il passaggio fra traccia e conclusione.'}</strong> ${esc(q.why)}</p><button id="quiz-recover">Rileggi il caso sulla carta</button> <button id="quiz-next">${quizIndex===questions.length-1?'Ricomincia':'Caso successivo'}</button>`;}
  if(e.target.id==='quiz-next'){quizIndex=(quizIndex+1)%questions.length;renderQuiz();$('#quiz .quiz-options button')?.focus();}
  if(e.target.id==='quiz-recover'){setPhase(questions[quizIndex].phase);showTab('esplora',true);}
 });
 $('#prev').onclick=()=>setPhase(phase-1);$('#next').onclick=()=>setPhase(phase+1);
 $('#search').oninput=render;$('#zone').onchange=render;$('#all').onchange=e=>{all=e.target.checked;render();};
 $('#follow').onchange=e=>{followed=e.target.value;render();};
 $('#reset').onclick=()=>{$('#search').value='';$('#zone').value='';$('#follow').value=followed='';$('#all').checked=all=false;render();};
 $('#extent').onclick=()=>map.setView([41.48,15.65],8);
 $('#close-detail').onclick=()=>$('#detail').close();$('#close-photo').onclick=()=>$('#photo').close();
 $('#lim').onclick=()=>{const enabled=document.body.classList.toggle('lim-mode');$('#lim').setAttribute('aria-pressed',enabled);requestAnimationFrame(()=>map.invalidateSize());};
 window.addEventListener('hashchange',()=>showTab(location.hash.slice(1)));
 initOffline();
}
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install').hidden=false;});
$('#install').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#install').hidden=true;};
async function initOffline(){
 if(!('serviceWorker' in navigator)){$('#offline').textContent='Contenuti disponibili online; offline non supportato da questo browser.';return;}
 try{const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});const ready=await navigator.serviceWorker.ready;
 $('#offline').textContent=navigator.onLine?'Copia offline pronta · fonti esterne online':'Modalità offline · contenuti locali disponibili';
 const notify=()=>{$('#offline').textContent='Aggiornamento pronto: chiudi le schede dell’atlante e riaprilo.';};if(reg.waiting)notify();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',()=>{if(reg.waiting)notify();}));
 window.addEventListener('online',()=>$('#offline').textContent='Copia offline pronta · connessione attiva');window.addEventListener('offline',()=>$('#offline').textContent='Modalità offline · fonti esterne non disponibili');
 }catch(e){$('#offline').textContent='Copia offline non completata: riprova con una connessione.';console.warn(e);}
}
init();
