import { db, uid } from './db.js';

const $ = s => document.querySelector(s);
const clone = value => structuredClone(value);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const blank = () => ({ positions: {}, links: [], size: 156, background: 'navy', locked: false, snap: false, showLinks: true });
const svgNS = 'http://www.w3.org/2000/svg';
export class DeskBoard {
  constructor({ state, render, toast, open }) {
    Object.assign(this, { state, render, toast, open });
    this.boards = {}; this.history = {}; this.zoom = 1; this.mode = 'move'; this.source = null; this.queue = Promise.resolve();
    this.content = $('.desk-content'); this.items = $('#itemsView');
    this.viewport = document.createElement('div'); this.viewport.className = 'board-viewport';
    this.extent = document.createElement('div'); this.extent.className = 'board-extent';
    this.items.before(this.viewport); this.viewport.append(this.extent); this.extent.append(this.items);
    this.toolbar = document.createElement('div'); this.toolbar.className = 'board-tools';
    this.toolbar.innerHTML = `<button data-tool="move" aria-pressed="true">✥ <span>Sposta</span></button><button data-tool="connect" aria-pressed="false">⌁ <span>Collega</span></button><button data-tool="lock" aria-pressed="false">♧ <span>Blocca</span></button><button data-tool="undo">↶ <span>Annulla</span></button><button data-tool="links" aria-pressed="true">↗ <span>Collegamenti</span></button><span class="board-divider"></span><button data-tool="out" aria-label="Riduci zoom">−</button><output class="zoom-label">100%</output><button data-tool="in" aria-label="Aumenta zoom">＋</button><button data-tool="fit">⛶ <span>Mostra tutto</span></button><button data-tool="style">◐ <span>Aspetto</span></button>`;
    const paths = {
      move:'M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4',
      connect:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
      lock:'M5 10h14v12H5zM8 10V6a4 4 0 0 1 8 0v4', undo:'M9 4L3 10l6 6M3 10h11a7 7 0 0 1 0 14',
      links:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
      out:'M5 12h14', in:'M5 12h14M12 5v14', fit:'M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5',
      style:'M12 3a9 9 0 1 0 0 18V3M12 3a9 9 0 1 1 0 18'
    };
    const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
    for (const [tool,path] of Object.entries(paths)) {
      const button=this.toolbar.querySelector(`[data-tool="${tool}"]`);
      button.firstChild.remove(); button.insertAdjacentHTML('afterbegin',icon(path));
    }
    $('#deskFullscreen').innerHTML=icon(paths.fit);
    this.content.append(this.toolbar);
    this.toolbar.querySelectorAll('button').forEach(b => { b.title = b.getAttribute('aria-label') || b.textContent.trim(); b.setAttribute('aria-label', b.title); });
    this.toolbar.addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) this.tool(b.dataset.tool); });
    this.items.addEventListener('click', e => {
      if (Date.now() < (this.suppressClickUntil || 0)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (this.mode !== 'connect' || !this.active || this.data.locked) return;
      const card = e.target.closest('.item-card'); if (!card || e.target.closest('.item-more')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!this.source) { this.source = card.dataset.id; card.classList.add('link-source'); this.toast('Ora scegli il materiale da collegare.'); }
      else if (this.source !== card.dataset.id) { const source = this.source; this.clearSource(); this.linkDialog({ id: uid('link'), from: source, to: card.dataset.id, label: '', arrow: true, color: '#75cdbb' }, true); }
    }, true);
    $('#sidebarToggle').addEventListener('click', () => {
      const collapsed = $('#deskPane').classList.toggle('sidebar-hidden');
      $('#sidebarToggle').setAttribute('aria-expanded', String(!collapsed));
      $('#sidebarToggle').title = collapsed ? 'Mostra barra laterale' : 'Nascondi barra laterale';
    });
    $('#deskFullscreen').addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if ($('#app').requestFullscreen) await $('#app').requestFullscreen();
        else { $('#app').classList.toggle('focus-desk'); this.toast('Vista estesa attivata. Per nascondere Safari, apri Desk dalla schermata Home.'); }
      } catch { this.toast('Schermo intero non disponibile. Puoi usare la vista estesa dalla schermata Home.'); }
    });
    document.addEventListener('keydown', e => {
      if (e.target.closest('input,textarea,select,[contenteditable],dialog')) return;
      if (e.key === 'Escape') { this.clearSource(); this.mode = 'move'; this.updateTools(); $('#app').classList.remove('focus-desk'); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && this.active) { e.preventDefault(); this.undo(); }
    });
    new ResizeObserver(() => { if (this.active) this.measure(); }).observe(this.viewport);
  }
  async init() { this.boards = (await db.getSettings()).boardsV2 || {}; }
  get key() { return this.state.currentSpace === 'board' ? `lesson:${this.state.boardId}` : this.state.currentSpace === 'all' ? `folder:${this.state.currentFolder}` : `space:${this.state.currentSpace}`; }
  get data() { return this.boards[this.key] ||= blank(); }
  get active() { return this.state.viewMode === 'free' && !this.state.search; }
  save() {
    const snapshot = clone(this.boards);
    $('#boardStatus').textContent = 'Salvataggio…';
    this.queue = this.queue.catch(() => {}).then(() => db.putSetting('boardsV2', snapshot));
    this.queue.then(() => { $('#boardStatus').textContent = 'Disposizione salvata'; }).catch(() => { $('#boardStatus').textContent = 'Salvataggio non riuscito'; this.toast('Impossibile salvare la disposizione. Esporta una copia prima di chiudere.', 6000); });
    return this.queue;
  }
  remember() { const h = this.history[this.key] ||= []; h.push(clone(this.data)); if (h.length > 40) h.shift(); }
  undo() { const previous = this.history[this.key]?.pop(); if (!previous) return; this.boards[this.key] = previous; this.save(); this.render(); }
  clearSource() { this.source = null; this.items.querySelectorAll('.link-source').forEach(c => c.classList.remove('link-source')); }
  paint(list) {
    if (this.lastKey !== this.key) { this.lastKey = this.key; this.zoom = 1; this.viewport.scrollTo(0, 0); this.clearSource(); }
    this.content.classList.toggle('free-view', this.active);
    this.items.classList.toggle('free-canvas', this.active);
    this.viewport.classList.toggle('spatial', this.active);
    this.toolbar.hidden = !this.active;
    $('#sortSelect').hidden = this.active;
    $('#freeViewBtn').classList.toggle('active', this.state.viewMode === 'free');
    for (const [id, mode] of [['freeViewBtn','free'],['gridViewBtn','grid'],['listViewBtn','list']]) $(`#${id}`).setAttribute('aria-pressed', String(this.state.viewMode === mode));
    this.applyBackground();
    if (!this.active) { this.items.style.cssText = ''; this.extent.style.cssText = ''; return; }
    const d = this.data; this.ids = list.map(i => i.id);
    // Persist initial placement once; new cards only fill unoccupied slots.
    let changed = false;
    for (const item of list) {
      if (!d.positions[item.id]) {
        const size = d.size + 40; let n = 0, p;
        do { p = { x: 36 + (n % 4) * size, y: 36 + Math.floor(n / 4) * (size + 8) }; n++; }
        while (Object.values(d.positions).some(q => Math.abs(p.x-q.x) < d.size + 16 && Math.abs(p.y-q.y) < d.size + 32));
        d.positions[item.id] = p; changed = true;
      }
      const card = [...this.items.children].find(c => c.dataset.id === item.id);
      const p = d.positions[item.id]; card.style.left = `${p.x}px`; card.style.top = `${p.y}px`; card.style.width = `${d.size}px`;
      card.style.height = `${d.size + 16}px`; card.draggable = false;
      const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'move-handle'; handle.textContent = '⠿'; handle.title = 'Trascina per spostare; usa le frecce da tastiera'; handle.setAttribute('aria-label', `Sposta ${item.name}`);
      handle.disabled = d.locked; card.prepend(handle);
      handle.addEventListener('pointerdown', event => this.drag(event, card, item.id));
      handle.addEventListener('keydown', e => {
        const delta = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[e.key];
        if (!delta || d.locked) return; e.preventDefault(); e.stopPropagation(); this.remember();
        const step = d.snap ? 20 : e.shiftKey ? 40 : 10; const p = d.positions[item.id]; p.x = Math.max(0,p.x+delta[0]*step); p.y = Math.max(0,p.y+delta[1]*step);
        card.style.left = `${p.x}px`; card.style.top = `${p.y}px`; this.measure(); this.drawLinks(); this.save();
      });
    }
    this.items.style.transformOrigin = '0 0'; this.items.style.transform = `scale(${this.zoom})`;
    this.measure(); this.drawLinks(); this.updateTools();
    if (changed) this.save();
  }
  measure() {
    if (!this.active) return;
    const positions = (this.ids || []).map(id => this.data.positions[id]).filter(Boolean);
    this.width = Math.max(this.viewport.clientWidth / this.zoom, ...positions.map(p => p.x + this.data.size + 100), 400);
    this.height = Math.max(this.viewport.clientHeight / this.zoom, ...positions.map(p => p.y + this.data.size + 100), 350);
    this.items.style.width = `${this.width}px`; this.items.style.height = `${this.height}px`;
    this.extent.style.width = `${this.width * this.zoom}px`; this.extent.style.height = `${this.height * this.zoom}px`;
    if (this.svg) { this.svg.setAttribute('width', this.width); this.svg.setAttribute('height', this.height); }
  }
  drag(e, card, id) {
    if (this.data.locked || e.button !== 0 || this.mode === 'connect') return;
    e.preventDefault(); e.stopPropagation(); this.clearSource();
    const handle = e.currentTarget; handle.setPointerCapture(e.pointerId);
    const key = this.key, d = this.data, origin = { ...d.positions[id] }, start = { x:e.clientX, y:e.clientY, left:this.viewport.scrollLeft, top:this.viewport.scrollTop };
    let moved = false, last = e, frame;
    card.classList.add('dragging');
    const update = () => {
      const dx = (last.clientX-start.x + this.viewport.scrollLeft-start.left)/this.zoom, dy = (last.clientY-start.y + this.viewport.scrollTop-start.top)/this.zoom;
      if (!moved && Math.hypot(dx,dy) < 3) return;
      if (!moved) { this.remember(); moved = true; }
      const snap = v => d.snap ? Math.round(v/20)*20 : v;
      d.positions[id] = { x:clamp(snap(origin.x+dx),0,20000), y:clamp(snap(origin.y+dy),0,20000) };
      card.style.left = `${d.positions[id].x}px`; card.style.top = `${d.positions[id].y}px`; this.measure(); this.drawLinks();
    };
    const tick = () => {
      const r = this.viewport.getBoundingClientRect();
      if (moved) { this.viewport.scrollLeft += last.clientX > r.right-36 ? 10 : last.clientX < r.left+36 ? -10 : 0; this.viewport.scrollTop += last.clientY > r.bottom-36 ? 10 : last.clientY < r.top+36 ? -10 : 0; update(); }
      frame = requestAnimationFrame(tick);
    };
    const move = p => { last = p; update(); };
    const finish = p => {
      cancelAnimationFrame(frame); handle.removeEventListener('pointermove',move); handle.removeEventListener('pointerup',finish); handle.removeEventListener('pointercancel',finish); handle.removeEventListener('lostpointercapture',finish);
      card.classList.remove('dragging'); this.suppressClickUntil = Date.now()+350;
      if (p.type === 'pointercancel' && moved) { d.positions[id] = origin; this.history[key]?.pop(); }
      if (moved) { this.save(); this.render(); }
    };
    handle.addEventListener('pointermove',move); handle.addEventListener('pointerup',finish); handle.addEventListener('pointercancel',finish); handle.addEventListener('lostpointercapture',finish); frame = requestAnimationFrame(tick);
  }
  setZoom(value) {
    const old = this.zoom; this.zoom = clamp(value, .1, 2);
    const cx=(this.viewport.scrollLeft+this.viewport.clientWidth/2)/old, cy=(this.viewport.scrollTop+this.viewport.clientHeight/2)/old;
    this.items.style.transform = `scale(${this.zoom})`; this.measure();
    this.viewport.scrollLeft = cx*this.zoom-this.viewport.clientWidth/2; this.viewport.scrollTop = cy*this.zoom-this.viewport.clientHeight/2; this.updateTools();
  }
  fit() {
    const p=(this.ids||[]).map(id=>this.data.positions[id]); if (!p.length) { this.setZoom(1); return; }
    const minX=Math.min(...p.map(p=>p.x)), minY=Math.min(...p.map(p=>p.y));
    const w=Math.max(...p.map(p=>p.x))+this.data.size-minX+80, h=Math.max(...p.map(p=>p.y))+this.data.size+16-minY+80;
    this.setZoom(Math.min(1,this.viewport.clientWidth/w,this.viewport.clientHeight/h));
    this.viewport.scrollLeft=Math.max(0,(minX-40)*this.zoom); this.viewport.scrollTop=Math.max(0,(minY-40)*this.zoom);
  }
  tool(tool) {
    if (tool === 'move' || tool === 'connect') { this.mode=tool; this.clearSource(); if (tool==='connect') this.toast(this.data.locked ? 'Sblocca la disposizione per collegare gli elementi.' : 'Tocca il primo materiale, poi il secondo.'); }
    if (tool === 'lock') { this.remember(); this.data.locked=!this.data.locked; this.clearSource(); this.save(); this.render(); }
    if (tool === 'links') { this.remember(); this.data.showLinks=!this.data.showLinks; this.save(); this.drawLinks(); }
    if (tool === 'undo') this.undo();
    if (tool === 'in') this.setZoom(this.zoom+.1);
    if (tool === 'out') this.setZoom(this.zoom-.1);
    if (tool === 'fit') this.fit();
    if (tool === 'style') this.styleDialog();
    this.updateTools();
  }
  updateTools() {
    this.toolbar.querySelector('.zoom-label').textContent = `${Math.round(this.zoom*100)}%`;
    for (const t of ['move','connect']) this.toolbar.querySelector(`[data-tool="${t}"]`).setAttribute('aria-pressed',String(this.mode===t));
    this.toolbar.querySelector('[data-tool="lock"]').setAttribute('aria-pressed',String(this.data.locked));
    this.toolbar.querySelector('[data-tool="lock"] span').textContent=this.data.locked?'Sblocca':'Blocca';
    this.toolbar.querySelector('[data-tool="lock"]').setAttribute('aria-label',this.data.locked?'Sblocca disposizione':'Blocca disposizione');
    this.toolbar.querySelector('[data-tool="links"]').setAttribute('aria-pressed',String(this.data.showLinks));
    this.toolbar.querySelector('[data-tool="undo"]').disabled=!this.history[this.key]?.length;
    this.items.classList.toggle('connecting',this.mode==='connect' && !this.data.locked);
  }
  drawLinks() {
    this.svg?.remove();
    const svg=document.createElementNS(svgNS,'svg'); this.svg=svg; svg.classList.add('board-links'); svg.setAttribute('width',this.width); svg.setAttribute('height',this.height); this.items.prepend(svg);
    if (!this.data.showLinks) return;
    for (const link of this.data.links) {
      if (!this.ids?.includes(link.from)||!this.ids.includes(link.to)) continue;
      const a=this.data.positions[link.from], b=this.data.positions[link.to], size=this.data.size;
      let x1=a.x+size/2,y1=a.y+(size+16)/2,x2=b.x+size/2,y2=b.y+(size+16)/2;
      const dx=x2-x1,dy=y2-y1; const f= Math.min((size/2+6)/Math.max(Math.abs(dx),.001),((size+16)/2+6)/Math.max(Math.abs(dy),.001));
      x1+=dx*f;y1+=dy*f;x2-=dx*f;y2-=dy*f;
      const group=document.createElementNS(svgNS,'g'); group.classList.add('connection');
      const path=document.createElementNS(svgNS,'path'); const bend=Math.min(100,Math.abs(x2-x1)/3);
      const d=`M ${x1} ${y1} C ${x1+bend} ${y1}, ${x2-bend} ${y2}, ${x2} ${y2}`;
      path.setAttribute('d',d);path.setAttribute('stroke',link.color);path.setAttribute('fill','none');path.setAttribute('stroke-width','3');
      if (link.arrow) {
        const marker=document.createElementNS(svgNS,'marker'); marker.id=`arrow-${link.id}`; marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','9');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','8');marker.setAttribute('markerHeight','8');marker.setAttribute('orient','auto');
        const tip=document.createElementNS(svgNS,'path');tip.setAttribute('d','M 0 0 L 10 5 L 0 10 z');tip.setAttribute('fill',link.color);marker.append(tip);svg.append(marker);path.setAttribute('marker-end',`url(#${marker.id})`);
      }
      const hit=path.cloneNode();hit.removeAttribute('marker-end');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','22');hit.classList.add('link-hit');
      group.append(path,hit);
      const label=link.label||'Modifica collegamento'; const text=document.createElementNS(svgNS,'text');text.textContent=label;text.setAttribute('x',(x1+x2)/2);text.setAttribute('y',(y1+y2)/2-12);text.classList.add('link-label');
      group.append(text);group.setAttribute('role','button');group.setAttribute('tabindex',this.data.locked?'-1':'0');group.setAttribute('aria-label',`Modifica collegamento: ${label}`);
      group.addEventListener('click',e=>{e.stopPropagation();if(!this.data.locked)this.linkDialog(link,false);});
      group.addEventListener('keydown',e=>{if(e.key==='Enter'&&!this.data.locked)this.linkDialog(link,false);});svg.append(group);
    }
  }
  dialog(title, body, submit, remove) {
    const dialog=document.createElement('dialog');dialog.className='dialog board-dialog';
    dialog.innerHTML=`<form><div class="dialog-head"><h2></h2><button type="button" class="icon-btn cancel" aria-label="Chiudi">×</button></div>${body}<div class="dialog-actions">${remove?'<button type="button" class="button danger remove">Elimina</button>':''}<button type="button" class="button secondary cancel">Annulla</button><button type="submit" class="button primary">Salva</button></div><p class="form-error" role="alert"></p></form>`;
    dialog.querySelector('h2').textContent=title;document.body.append(dialog);
    dialog.querySelectorAll('.cancel').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('close',()=>dialog.remove());
    if(remove)dialog.querySelector('.remove').onclick=()=>{remove();dialog.close();};
    dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await submit(new FormData(e.target),e.target);dialog.close();}catch(err){dialog.querySelector('.form-error').textContent=err.message||'Salvataggio non riuscito';b.disabled=false;}};
    dialog.showModal();return dialog;
  }
  linkDialog(link,isNew) {
    const key=this.key;
    const dialog=this.dialog('Collegamento',`<label>Etichetta<input name="label" maxlength="80" placeholder="Es. contesto culturale"></label><label>Tipo<select name="arrow"><option value="yes">Freccia</option><option value="no">Linea</option></select></label><label>Colore<input type="color" name="color"></label>`,async data=>{
      this.remember();const next={...link,label:data.get('label').trim(),arrow:data.get('arrow')==='yes',color:data.get('color')};
      if(isNew)this.boards[key].links.push(next);else this.boards[key].links=this.boards[key].links.map(l=>l.id===link.id?next:l);
      await this.save();this.drawLinks();this.updateTools();
    },isNew?null:()=>{this.remember();this.data.links=this.data.links.filter(l=>l.id!==link.id);this.save();this.drawLinks();this.updateTools();});
    const f=dialog.querySelector('form');f.elements.label.value=link.label;f.elements.arrow.value=link.arrow?'yes':'no';f.elements.color.value=link.color;
  }
  applyBackground() {
    const d=this.data;this.content.dataset.background=d.background||'navy';
    this.content.style.setProperty('--custom-background',d.customBackground?`url("${d.customBackground}")`:'none');
  }
  styleDialog() {
    const dialog=this.dialog('Aspetto di questa scrivania',`<label>Dimensione schede<input name="size" type="range" min="120" max="240" step="4"><output id="sizeValue"></output></label><label>Sfondo<select name="background"><option value="navy">Blu notte · gbprof</option><option value="paper">Carta chiara</option><option value="slate">Lavagna scura</option><option value="wood">Legno chiaro</option><option value="blue">Azzurro tenue</option><option value="custom">Immagine personale</option></select></label><label>Carica uno sfondo<input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label><label class="check-row"><input name="snap" type="checkbox">Allinea gli spostamenti alla griglia</label><p class="muted">La scelta vale solo per questo spazio. Le posizioni rimangono invariate.</p>`,async(data,form)=>{
      const file=form.elements.image.files[0];let custom=this.data.customBackground;
      if(file)custom=await readImage(file);
      if(data.get('background')==='custom'&&!custom)throw new Error('Scegli un’immagine da usare come sfondo.');
      this.remember();Object.assign(this.data,{size:Number(data.get('size')),background:file?'custom':data.get('background'),snap:data.get('snap')==='on',customBackground:custom});
      await this.save();this.render();
    });
    const f=dialog.querySelector('form');f.elements.size.value=this.data.size;f.elements.background.value=this.data.background;f.elements.snap.checked=this.data.snap;
    const update=()=>dialog.querySelector('output').textContent=`${f.elements.size.value} px`;f.elements.size.oninput=update;update();
  }
  customize(item) {
    const dialog=this.dialog('Personalizza materiale',`<label>Titolo<input name="name" required maxlength="120"></label>${item.type==='url'?'<label>Indirizzo URL<input name="url" type="url" required></label>':''}<label>Colore scheda<input name="color" type="color"></label><label>Immagine<input name="image" type="file" accept="image/png,image/jpeg,image/webp"></label><label class="check-row"><input name="clear" type="checkbox">Rimuovi immagine personalizzata</label>`,async(data,form)=>{
      const next={...item,name:data.get('name').trim(),cardColor:data.get('color'),modifiedAt:Date.now()};
      if(!next.name)throw new Error('Inserisci un titolo.');
      if(item.type==='url'){const url=new URL(data.get('url'));if(!['http:','https:'].includes(url.protocol))throw new Error('Usa un indirizzo http o https.');next.url=url.href;}
      if(data.get('clear'))delete next.cardImage;
      const file=form.elements.image.files[0];if(file)next.cardImage=await readImage(file);
      await db.putItem(next);await this.open.refresh();
    });
    const f=dialog.querySelector('form');f.elements.name.value=item.name;f.elements.color.value=item.cardColor||'#ffffff';if(f.elements.url)f.elements.url.value=item.url;
  }
  decorate(card,item) {
    if(item.cardColor){card.style.backgroundColor=item.cardColor;const c=item.cardColor.slice(1),r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);card.style.color=(r*.299+g*.587+b*.114)>145?'#17201e':'#ffffff';}
    if(item.cardImage){const icon=card.querySelector('.item-icon');const img=document.createElement('img');img.src=item.cardImage;img.alt='';img.className='card-picture';icon.replaceWith(img);}
  }
  duplicateBoard(fromId,toId) { const source=this.boards[`lesson:${fromId}`];if(source){this.boards[`lesson:${toId}`]=clone(source);this.save();} }
}
export async function readImage(file) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Scegli un’immagine PNG, JPG o WebP.');
  if(file.size>10*1024*1024)throw new Error('L’immagine deve essere inferiore a 10 MB.');
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Immagine non leggibile.'));r.readAsDataURL(file);});
}
