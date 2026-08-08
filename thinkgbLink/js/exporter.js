(function () {
  'use strict';

  function slugify(value) {
    return String(value || 'thinkgblink').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'thinkgblink';
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function extensionFor(mime, fallback) {
    const known = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
      'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov'
    };
    return known[mime] || fallback || 'bin';
  }

  async function dataUrlBytes(dataUrl) {
    const response = await fetch(dataUrl);
    return new Uint8Array(await response.arrayBuffer());
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  async function extractAsset(files, holder, key, pathStem) {
    const media = holder && holder[key];
    if (!media || !media.dataUrl) return;
    const extension = extensionFor(media.type, (media.name || '').split('.').pop());
    const path = `${pathStem}.${extension}`;
    files.push({ name: path, data: await dataUrlBytes(media.dataUrl) });
    holder[key] = { name: media.name || path.split('/').pop(), type: media.type || '', alt: media.alt || '', src: path };
  }

  function viewerCss() {
    return `:root{--ink:#172321;--muted:#64706d;--surface:#fff;--line:#d8ddd8;--brand:#147d70;--brand-dark:#0d5d54;--accent:#e5a02d;--shadow:0 22px 60px rgba(14,32,28,.2)}*{box-sizing:border-box}html,body{height:100%;margin:0}body{overflow:hidden;background:#202b28;color:var(--ink);font:16px/1.5 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button{font:inherit}.top{position:fixed;z-index:10;left:0;right:0;top:0;display:flex;min-height:68px;padding:8px max(16px,env(safe-area-inset-left));align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(18,32,29,.92);color:#fff;backdrop-filter:blur(16px)}.identity{min-width:0}.identity h1{margin:0;overflow:hidden;font:500 clamp(1.15rem,2.4vw,1.7rem)/1.1 Georgia,serif;text-overflow:ellipsis;white-space:nowrap}.identity p{margin:3px 0 0;overflow:hidden;color:#c7d2ce;font-size:.72rem;text-overflow:ellipsis;white-space:nowrap}.tools{display:flex;align-items:center;gap:5px}.tools button{min-width:42px;min-height:42px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}.tools output{min-width:50px;text-align:center;font-size:.72rem}.trail{position:fixed;z-index:9;left:14px;top:78px;display:flex;max-width:calc(100% - 28px);min-height:36px;padding:4px 7px;align-items:center;gap:3px;overflow-x:auto;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(18,32,29,.84);color:#dce5e1;backdrop-filter:blur(12px)}.trail button{min-height:27px;padding:2px 8px;border:0;border-radius:6px;background:transparent;color:#fff;cursor:pointer;font-size:.72rem;white-space:nowrap}.trail button:hover{background:rgba(255,255,255,.12)}.trail button:disabled{color:#b8c7c2;cursor:default}.trail .back{margin-right:5px;background:rgba(255,255,255,.1);font-weight:750}.trail span{color:#82918c}.viewport{position:absolute;inset:68px 0 0;overflow:hidden;touch-action:none;user-select:none;cursor:grab}.viewport.dragging{cursor:grabbing}.canvas{position:absolute;left:50%;top:50%;width:1px;height:1px;transform-origin:center;will-change:transform}.main-image{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;-webkit-user-drag:none}.layer{position:absolute;inset:0}.marker{position:absolute;display:grid;width:40px;height:40px;padding:0;place-items:center;border:3px solid #fff;border-radius:50%;background:var(--accent);color:var(--ink);box-shadow:0 4px 18px rgba(0,0,0,.3),0 0 0 7px rgba(229,160,45,.2);cursor:pointer;font-size:.78rem;font-weight:850;transform:translate(-50%,-50%) scale(var(--inverse,1));touch-action:none}.marker[data-style=point]{width:24px;height:24px;font-size:0}.marker[data-style=circle]{background:rgba(255,255,255,.16);color:#fff}.marker[data-style=icon]{font-size:0}.marker[data-style=icon]::after{content:"+";font-size:1.25rem}.marker.has-child::after{content:"↳";position:absolute;right:-7px;bottom:-7px;display:grid;width:18px;height:18px;place-items:center;border:2px solid #fff;border-radius:50%;background:var(--brand-dark);color:#fff;font-size:.7rem}.marker.visited{border-color:#8bd3c4}.marker.active{outline:4px solid rgba(255,255,255,.46);outline-offset:4px}.progress{position:fixed;z-index:9;left:18px;bottom:calc(16px + env(safe-area-inset-bottom));padding:8px 11px;border-radius:9px;background:rgba(18,32,29,.82);color:#fff;font-size:.7rem;backdrop-filter:blur(10px)}dialog{width:min(570px,calc(100vw - 22px));max-height:min(82vh,800px);padding:0;overflow:visible;border:0;border-radius:20px;background:#fff;box-shadow:var(--shadow)}dialog::backdrop{background:rgba(12,23,21,.64);backdrop-filter:blur(5px)}.close{position:absolute;z-index:2;right:10px;top:10px;display:grid;width:38px;height:38px;padding:0;place-items:center;border:0;border-radius:50%;background:rgba(17,30,27,.72);color:#fff;cursor:pointer;font-size:1.25rem}.card{max-height:min(82vh,800px);overflow:auto;padding:28px}.category{color:var(--brand-dark);font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.card h2{margin:5px 45px 12px 0;font:500 2rem/1.08 Georgia,serif}.lead{color:#394642;font-size:1.05rem}.copy,.answer{white-space:pre-wrap}.card img,.card video{display:block;width:100%;max-height:420px;margin:17px 0;border-radius:13px;object-fit:contain;background:#edf0ed}.card audio{width:100%;margin:14px 0}.link,.jump,.path,.enter-scene{display:flex;width:100%;min-height:44px;margin-top:8px;padding:10px 12px;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--brand-dark);text-decoration:none;font-weight:760;cursor:pointer}.enter-scene{min-height:58px;margin:18px 0;border-color:var(--brand);background:var(--brand);color:#fff}.enter-scene span{font-size:.74rem;font-weight:650}.enter-scene b::after{content:"  →"}.question{margin:18px 0;padding:16px;border-radius:13px;background:#f3efe4}.question button{margin-top:9px;border:0;background:transparent;color:var(--brand-dark);cursor:pointer;font-weight:760}.answer{margin-top:9px;padding-top:9px;border-top:1px solid #d9d1bd}.relations-title{margin:20px 0 8px;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase}.paths{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}@media(max-width:620px){.top{gap:7px}.identity p{display:none}.tools output{display:none}.tools button{min-width:38px;min-height:38px}.trail{left:9px;top:73px;max-width:calc(100% - 18px)}.card{padding:24px 20px}.progress{left:10px;bottom:calc(10px + env(safe-area-inset-bottom))}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
  }

  function viewerJs() {
    return `(function(){
'use strict';
const p=window.THINKGBLINK_DATA,$=s=>document.querySelector(s),v=$('#viewport'),c=$('#canvas'),img=$('#mainImage'),layer=$('#layer'),dialog=$('#contentDialog'),card=$('#card'),trail=$('#trail'),zoomText=$('#zoomText'),progress=$('#progress');
let currentId=p.rootSceneId||(p.scenes&&p.scenes[0]&&p.scenes[0].id),scale=1,panX=0,panY=0,baseW=1,baseH=1,activeId=null;const pointers=new Map(),visited=new Set();let gesture=null;
const escape=s=>String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const scenes=()=>p.scenes||[],scene=id=>scenes().find(s=>s.id===(id||currentId)),hotspot=id=>(scene()?.hotspots||[]).find(h=>h.id===id),child=h=>h&&h.targetSceneId?scene(h.targetSceneId):null;
function parent(s){if(!s||!s.parentHotspotId)return null;return scenes().find(x=>(x.hotspots||[]).some(h=>h.id===s.parentHotspotId))||null}
function path(s){const out=[],seen=new Set();let x=s;while(x&&!seen.has(x.id)){out.unshift(x);seen.add(x.id);x=parent(x)}return out}
function fit(){const r=v.getBoundingClientRect(),ratio=(img.naturalWidth||1600)/(img.naturalHeight||900);baseW=r.width;baseH=baseW/ratio;if(baseH>r.height){baseH=r.height;baseW=baseH*ratio}c.style.width=baseW+'px';c.style.height=baseH+'px';resetView()}
function apply(){c.style.transform='translate(calc(-50% + '+panX+'px),calc(-50% + '+panY+'px)) scale('+scale+')';c.style.setProperty('--inverse',1/scale);zoomText.textContent=Math.round(scale*100)+'%'}
function resetView(){scale=1;panX=0;panY=0;apply()}
function setZoom(next,cx,cy){const old=scale;scale=Math.max(1,Math.min(5,next));if(cx!=null&&old!==scale){const r=v.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2);panX=dx-(dx-panX)*(scale/old);panY=dy-(dy-panY)*(scale/old)}apply()}
function markerLabel(h,i){return h.style==='number'?String(h.number||i+1):h.title}
function renderTrail(){const s=scene();trail.innerHTML='';if(s.id!==p.rootSceneId){const back=document.createElement('button');back.className='back';back.textContent='← Indietro';back.onclick=()=>navigate((parent(s)||scene(p.rootSceneId)).id);trail.appendChild(back)}path(s).forEach((x,i,a)=>{const b=document.createElement('button');b.textContent=x.title||'Scena';b.disabled=x.id===s.id;b.onclick=()=>navigate(x.id);trail.appendChild(b);if(i<a.length-1){const sep=document.createElement('span');sep.textContent='›';trail.appendChild(sep)}});$('#sceneName').textContent=s.title||'Scena'}
function render(){layer.innerHTML='';(scene()?.hotspots||[]).forEach((h,i)=>{const b=document.createElement('button');b.className='marker'+(child(h)?' has-child':'');b.dataset.style=h.style||'point';b.dataset.id=h.id;b.style.left=h.x+'%';b.style.top=h.y+'%';b.setAttribute('aria-label',h.title||'Hotspot');b.title=h.title||'';b.textContent=markerLabel(h,i);b.classList.toggle('visited',visited.has(h.id));b.addEventListener('click',e=>{e.stopPropagation();openHotspot(h.id)});layer.appendChild(b)});updateProgress()}
function navigate(id){const next=scene(id);if(!next)return;currentId=next.id;activeId=null;if(dialog.open)dialog.close();img.onload=fit;img.src=(next.image&&(next.image.src||next.image.dataUrl))||'';img.alt=(next.image&&next.image.alt)||next.title||'';renderTrail();render();if(img.complete)requestAnimationFrame(fit)}
function safeUrl(url){try{const u=new URL(url,location.href);return['http:','https:'].includes(u.protocol)?u.href:'#'}catch{return'#'}}
function addMedia(h,frag){if(h.image&&(h.image.src||h.image.dataUrl)){const im=document.createElement('img');im.src=h.image.src||h.image.dataUrl;im.alt=h.imageAlt||h.title||'';frag.appendChild(im)}if(h.audio&&(h.audio.src||h.audio.dataUrl)){const a=document.createElement('audio');a.controls=true;a.src=h.audio.src||h.audio.dataUrl;frag.appendChild(a)}if(h.video&&(h.video.src||h.video.dataUrl)){const x=document.createElement('video');x.controls=true;x.playsInline=true;x.src=h.video.src||h.video.dataUrl;frag.appendChild(x)}if(h.videoUrl){const a=document.createElement('a');a.className='link';a.href=safeUrl(h.videoUrl);a.target='_blank';a.rel='noopener';a.innerHTML='<span>Apri il video</span><b>↗</b>';frag.appendChild(a)}if(h.linkUrl){const a=document.createElement('a');a.className='link';a.href=safeUrl(h.linkUrl);a.target='_blank';a.rel='noopener';a.innerHTML='<span>'+escape(h.linkLabel||'Apri il collegamento')+'</span><b>↗</b>';frag.appendChild(a)}}
function navButton(id,label){const target=hotspot(id);if(!target)return null;const b=document.createElement('button');b.className='path';b.innerHTML='<span>'+escape(label)+'</span><b>'+escape(target.title)+'</b>';b.onclick=()=>openHotspot(id);return b}
function openHotspot(id){const h=hotspot(id);if(!h)return;activeId=id;visited.add(id);document.querySelectorAll('.marker').forEach(m=>{m.classList.toggle('active',m.dataset.id===id);m.classList.toggle('visited',visited.has(m.dataset.id))});card.innerHTML='';const cat=document.createElement('div');cat.className='category';cat.textContent=h.category||'informazione';card.appendChild(cat);const title=document.createElement('h2');title.textContent=h.title||'Senza titolo';card.appendChild(title);if(h.shortText){const lead=document.createElement('p');lead.className='lead';lead.textContent=h.shortText;card.appendChild(lead)}if(h.longText){const copy=document.createElement('p');copy.className='copy';copy.textContent=h.longText;card.appendChild(copy)}addMedia(h,card);if(h.question){const q=document.createElement('div');q.className='question';const strong=document.createElement('strong');strong.textContent=h.question;q.appendChild(strong);if(h.answer){const reveal=document.createElement('button');reveal.textContent='Mostra risposta';reveal.onclick=()=>{const a=document.createElement('div');a.className='answer';a.textContent=h.answer;reveal.replaceWith(a)};q.appendChild(reveal)}card.appendChild(q)}const inner=child(h);if(inner){const enter=document.createElement('button');enter.className='enter-scene';enter.innerHTML='<span>Entra nella scena</span><b>'+escape(inner.title)+'</b>';enter.onclick=()=>navigate(inner.id);card.appendChild(enter)}const relations=(h.relations||[]).filter(r=>hotspot(r.targetId));if(relations.length){const heading=document.createElement('h3');heading.className='relations-title';heading.textContent='Collegamenti';card.appendChild(heading);relations.forEach(r=>{const t=hotspot(r.targetId),b=document.createElement('button');b.className='jump';b.innerHTML='<span>'+escape(r.label||r.type||'Vai a')+'</span><b>'+escape(t.title)+'</b>';b.onclick=()=>openHotspot(t.id);card.appendChild(b)})}if(h.previousId||h.nextId){const paths=document.createElement('div');paths.className='paths';const prev=navButton(h.previousId,'← Precedente'),next=navButton(h.nextId,'Successivo →');if(prev)paths.appendChild(prev);if(next)paths.appendChild(next);card.appendChild(paths)}dialog.showModal();updateProgress()}
function updateProgress(){const total=scenes().reduce((n,s)=>n+(s.hotspots||[]).length,0);progress.textContent=visited.size+' / '+total+' hotspot · '+scenes().length+' scene'}
$('#title').textContent=p.title||'thinkgbLink';document.title=(p.title||'Viewer')+' — thinkgbLink';navigate(currentId);window.addEventListener('resize',fit);$('#zoomIn').onclick=()=>setZoom(scale+.25);$('#zoomOut').onclick=()=>setZoom(scale-.25);$('#reset').onclick=resetView;$('#close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});v.addEventListener('wheel',e=>{e.preventDefault();setZoom(scale*(e.deltaY<0?1.12:.89),e.clientX,e.clientY)},{passive:false});v.addEventListener('pointerdown',e=>{if(e.target.closest('.marker'))return;v.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={panX,panY,x:e.clientX,y:e.clientY};else if(pointers.size===2){const a=[...pointers.values()];gesture={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),scale}}v.classList.add('dragging')});v.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1&&gesture){panX=gesture.panX+e.clientX-gesture.x;panY=gesture.panY+e.clientY-gesture.y;apply()}else if(pointers.size===2&&gesture){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);setZoom(gesture.scale*d/gesture.distance)}});function end(e){pointers.delete(e.pointerId);gesture=null;v.classList.remove('dragging')}v.addEventListener('pointerup',end);v.addEventListener('pointercancel',end);
})();`;
  }

  function viewerHtml(project) {
    const encoded = encodeURIComponent(JSON.stringify(project));
    return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="theme-color" content="#13211f"><meta name="description" content="Percorso interattivo creato con thinkgbLink"><link rel="stylesheet" href="./css/style.css"><title>Viewer thinkgbLink</title></head>
<body><header class="top"><div class="identity"><h1 id="title"></h1><p id="sceneName"></p></div><div class="tools"><button id="zoomOut" aria-label="Riduci zoom">−</button><output id="zoomText">100%</output><button id="zoomIn" aria-label="Aumenta zoom">+</button><button id="reset">Adatta</button></div></header><nav id="trail" class="trail" aria-label="Percorso delle scene"></nav><main id="viewport" class="viewport"><div id="canvas" class="canvas"><img id="mainImage" class="main-image" alt=""><div id="layer" class="layer"></div></div></main><div id="progress" class="progress" aria-live="polite"></div><dialog id="contentDialog"><button id="close" class="close" aria-label="Chiudi">×</button><article id="card" class="card"></article></dialog><script>window.THINKGBLINK_DATA=JSON.parse(decodeURIComponent(${JSON.stringify(encoded)}));<\/script><script src="./js/viewer.js"><\/script></body></html>`;
  }

  async function buildViewerZip(original) {
    const project = clone(original), root = slugify(project.title), files = [];
    for (let sceneIndex = 0; sceneIndex < (project.scenes || []).length; sceneIndex += 1) {
      const scene = project.scenes[sceneIndex], sceneSlug = `${slugify(scene.title)}-${sceneIndex + 1}`;
      await extractAsset(files, scene, 'image', `${root}/assets/scenes/${sceneSlug}`);
      if (scene.image?.src) scene.image.src = scene.image.src.replace(`${root}/`, '');
      for (let i = 0; i < (scene.hotspots || []).length; i += 1) {
        const h = scene.hotspots[i], stem = `${slugify(h.title)}-${sceneIndex + 1}-${i + 1}`;
        await extractAsset(files, h, 'image', `${root}/assets/images/${stem}`);
        await extractAsset(files, h, 'audio', `${root}/assets/audio/${stem}`);
        await extractAsset(files, h, 'video', `${root}/assets/video/${stem}`);
        ['image', 'audio', 'video'].forEach(key => { if (h[key]?.src) h[key].src = h[key].src.replace(`${root}/`, ''); });
      }
    }
    const json = JSON.stringify(project, null, 2);
    files.push(
      { name: `${root}/index.html`, data: viewerHtml(project) },
      { name: `${root}/data.json`, data: json },
      { name: `${root}/css/style.css`, data: viewerCss() },
      { name: `${root}/js/viewer.js`, data: viewerJs() },
      { name: `${root}/README.txt`, data: `Viewer esportato da thinkgbLink.\n\nApri index.html oppure pubblica l'intera cartella su un hosting statico come GitHub Pages.\nIl percorso conserva tutte le scene annidate e i contenuti sono locali alla cartella.\n` }
    );
    return { blob: window.ZipStore.create(files), filename: `${root}-viewer.zip` };
  }

  function exportProject(project) {
    const payload = clone(project); payload.exportedAt = new Date().toISOString();
    download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${slugify(project.title)}.thinkgblink`);
  }

  window.ThinkgbExporter = { buildViewerZip, download, exportProject, slugify };
})();
