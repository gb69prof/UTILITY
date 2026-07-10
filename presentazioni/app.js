(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const STORAGE_KEY = 'spazio-projects-v1';
  const MIN_SCALE = 0.12;
  const MAX_SCALE = 3;

  const refs = {
    viewport: $('#viewport'), stage: $('#stage'), nodes: $('#nodesLayer'), connectors: $('#connectorLayer'),
    name: $('#projectName'), toast: $('#toast'), body: document.body,
    emptyInspector: $('#emptyInspector'), nodeInspector: $('#nodeInspector'), edgeInspector: $('#edgeInspector'),
    pathList: $('#pathList'), pathEmpty: $('#pathEmpty'), presentationBar: $('#presentationBar')
  };

  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const deepCopy = value => JSON.parse(JSON.stringify(value));

  function makeDemoProject() {
    const ids = [uid(), uid(), uid(), uid()];
    return {
      id: uid(), name: 'La mia storia visuale', updatedAt: Date.now(), background: '#f4f0e8',
      nodes: [
        baseNode(ids[0], 'text', 980, 640, 520, 240, { content: 'Un’idea al centro', fontSize: 44, bg: '#17191f', color: '#ffffff', border: '#17191f', shape: 'ellipse' }),
        baseNode(ids[1], 'text', 330, 280, 390, 190, { content: 'Contesto\nDa dove partiamo?', fontSize: 28, bg: '#fff4d8', border: '#dfb64b' }),
        baseNode(ids[2], 'text', 1710, 310, 410, 190, { content: 'Approfondimento\nMateriali e prove', fontSize: 28, bg: '#e8e2ff', border: '#806de8', shape: 'pill' }),
        baseNode(ids[3], 'text', 1080, 1190, 360, 180, { content: 'Conclusione\nIl prossimo passo', fontSize: 28, bg: '#ddf4e7', border: '#4a9a6b', shape: 'rounded' })
      ],
      edges: [
        baseEdge(ids[1], ids[0], { color: '#df9c2b', shape: 'curve' }),
        baseEdge(ids[0], ids[2], { color: '#705cf5', shape: 'curve' }),
        baseEdge(ids[0], ids[3], { color: '#3f9162', shape: 'curve' })
      ],
      path: [...ids]
    };
  }

  function baseNode(id, type, x, y, w, h, overrides = {}) {
    return {
      id, type, x, y, w, h, rotation: 0, shape: 'rounded', bg: '#ffffff', color: '#17191f',
      border: '#cfd0d6', borderWidth: 2, fontSize: 28, content: '', src: '', name: '', mime: '', ...overrides
    };
  }

  function baseEdge(from, to, overrides = {}) {
    return { id: uid(), from, to, color: '#5a46e8', width: 3, style: 'solid', shape: 'curve', arrow: true, ...overrides };
  }

  let project = makeDemoProject();
  let selection = { type: null, id: null };
  let tool = 'select';
  let connectorStart = null;
  let camera = { x: 0, y: 0, scale: 0.55 };
  let interaction = null;
  let presentation = false;
  let focusedNode = null;
  let pathIndex = -1;
  let toastTimer;

  function nodeById(id) { return project.nodes.find(node => node.id === id); }
  function edgeById(id) { return project.edges.find(edge => edge.id === id); }
  function selectedNode() { return selection.type === 'node' ? nodeById(selection.id) : null; }
  function selectedEdge() { return selection.type === 'edge' ? edgeById(selection.id) : null; }

  function toast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => refs.toast.classList.remove('show'), 2400);
  }

  function setCamera(next, animate = false) {
    camera = { ...camera, ...next, scale: clamp(next.scale ?? camera.scale, MIN_SCALE, MAX_SCALE) };
    refs.stage.style.transition = animate ? 'transform 650ms cubic-bezier(.22,.8,.24,1)' : 'none';
    refs.stage.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
    if (animate) setTimeout(() => { refs.stage.style.transition = 'none'; }, 700);
  }

  function screenToWorld(clientX, clientY) {
    const rect = refs.viewport.getBoundingClientRect();
    return { x: (clientX - rect.left - camera.x) / camera.scale, y: (clientY - rect.top - camera.y) / camera.scale };
  }

  function centerPointForNewItem() {
    const rect = refs.viewport.getBoundingClientRect();
    return screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function render() {
    refs.name.value = project.name;
    refs.viewport.style.backgroundColor = project.background;
    $('#projectBackground').value = project.background;
    renderNodes();
    renderEdges();
    renderInspector();
    renderPath();
    setCamera(camera);
  }

  function shapeClass(shape) { return `shape-${shape || 'rounded'}`; }

  function contentMarkup(node) {
    if (node.type === 'text' || node.type === 'shape') {
      return `<div class="node-content text" data-editable="true" style="font-size:${node.fontSize}px">${esc(node.content)}</div>`;
    }
    if (node.type === 'image') {
      return `<div class="node-content media"><img src="${node.src}" alt="${esc(node.name || 'Immagine')}"></div>`;
    }
    if (node.type === 'video') {
      return `<div class="node-content media"><video src="${node.src}" controls preload="metadata"></video></div>`;
    }
    if (node.type === 'audio') {
      return `<div class="node-content media"><audio src="${node.src}" controls preload="metadata"></audio></div>`;
    }
    if (node.type === 'url') {
      let domain = node.src;
      try { domain = new URL(node.src).hostname; } catch (_) {}
      return `<div class="url-card"><span class="url-icon">↗</span><strong>${esc(node.content || 'Risorsa online')}</strong><small>${esc(domain)}</small></div>`;
    }
    if (node.type === 'document' && node.mime === 'application/pdf' && presentation && focusedNode === node.id) {
      return `<div class="node-content media"><object data="${node.src}" type="application/pdf" aria-label="${esc(node.name || 'Documento PDF')}" style="pointer-events:none"><div class="file-card"><strong>${esc(node.name || 'Documento PDF')}</strong></div></object></div>`;
    }
    const ext = (node.name.split('.').pop() || 'FILE').toUpperCase();
    return `<div class="file-card"><span class="file-icon">${esc(ext.slice(0, 4))}</span><strong>${esc(node.name || 'Documento')}</strong><small>${node.mime === 'application/pdf' ? 'Documento PDF' : 'Allegato'}</small></div>`;
  }

  function renderNodes() {
    refs.nodes.innerHTML = project.nodes.map((node, index) => `
      <article class="canvas-node ${selection.type === 'node' && selection.id === node.id ? 'selected' : ''} ${connectorStart === node.id ? 'connect-source' : ''} ${focusedNode === node.id ? 'focused' : ''}"
        data-node-id="${node.id}" style="left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;transform:rotate(${node.rotation}deg);z-index:${index + 1}">
        <div class="node-surface ${shapeClass(node.shape)}" style="background:${node.bg};color:${node.color};border-color:${node.border};border-width:${node.borderWidth}px">
          ${contentMarkup(node)}
        </div>
        <span class="resize-handle" aria-hidden="true"></span>
      </article>`).join('');
  }

  function edgeGeometry(edge) {
    const from = nodeById(edge.from); const to = nodeById(edge.to);
    if (!from || !to) return null;
    const p1 = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
    const p2 = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
    if (edge.shape === 'straight') return { d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`, p1, p2, tangent: { x: dx, y: dy } };
    if (edge.shape === 'elbow') {
      const mx = p1.x + dx / 2;
      return { d: `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`, p1, p2, tangent: { x: p2.x - mx, y: 0 } };
    }
    const curve = Math.max(90, Math.abs(dx) * .45);
    const c1 = { x: p1.x + Math.sign(dx || 1) * curve, y: p1.y };
    const c2 = { x: p2.x - Math.sign(dx || 1) * curve, y: p2.y };
    return { d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`, p1, p2, tangent: { x: p2.x - c2.x, y: p2.y - c2.y } };
  }

  function arrowPoints(geometry, edge) {
    const { p2, tangent } = geometry;
    const angle = Math.atan2(tangent.y, tangent.x);
    const length = 11 + edge.width * 2.2;
    const half = 5 + edge.width * 1.2;
    const bx = p2.x - Math.cos(angle) * length;
    const by = p2.y - Math.sin(angle) * length;
    return `${p2.x},${p2.y} ${bx + Math.sin(angle) * half},${by - Math.cos(angle) * half} ${bx - Math.sin(angle) * half},${by + Math.cos(angle) * half}`;
  }

  function dashArray(edge) {
    if (edge.style === 'dashed') return `${edge.width * 4} ${edge.width * 3}`;
    if (edge.style === 'dotted') return `${edge.width} ${edge.width * 2.4}`;
    return 'none';
  }

  function renderEdges() {
    refs.connectors.innerHTML = project.edges.map(edge => {
      const geo = edgeGeometry(edge);
      if (!geo) return '';
      const selected = selection.type === 'edge' && selection.id === edge.id;
      return `<g data-edge-id="${edge.id}">
        <path class="connector-hit" d="${geo.d}"></path>
        <path class="connector ${selected ? 'selected' : ''}" d="${geo.d}" fill="none" stroke="${edge.color}" stroke-width="${edge.width}" stroke-dasharray="${dashArray(edge)}" stroke-linecap="round" stroke-linejoin="round"></path>
        ${edge.arrow ? `<polygon points="${arrowPoints(geo, edge)}" fill="${edge.color}" class="connector"></polygon>` : ''}
      </g>`;
    }).join('');
  }

  function renderInspector() {
    const node = selectedNode(); const edge = selectedEdge();
    refs.emptyInspector.hidden = !!(node || edge);
    refs.nodeInspector.hidden = !node;
    refs.edgeInspector.hidden = !edge;
    if (node) {
      $('#nodeX').value = Math.round(node.x); $('#nodeY').value = Math.round(node.y);
      $('#nodeW').value = Math.round(node.w); $('#nodeH').value = Math.round(node.h);
      $('#nodeRotation').value = node.rotation; $('#nodeRotationValue').value = `${node.rotation}°`;
      $('#nodeShape').value = node.shape; $('#nodeBg').value = node.bg; $('#nodeColor').value = node.color;
      $('#nodeBorder').value = node.border; $('#nodeBorderWidth').value = node.borderWidth;
      $('#nodeFontSize').value = node.fontSize; $('#nodeFontSizeValue').value = `${node.fontSize} px`;
      $('#nodeContent').value = node.content || '';
      $('#fontSizeField').hidden = !['text', 'shape'].includes(node.type);
      $('#contentField').hidden = !['text', 'shape', 'url'].includes(node.type);
    }
    if (edge) {
      $('#edgeColor').value = edge.color; $('#edgeWidth').value = edge.width; $('#edgeWidthValue').value = `${edge.width} px`;
      $('#edgeShape').value = edge.shape; $('#edgeStyle').value = edge.style; $('#edgeArrow').checked = edge.arrow;
    }
  }

  function nodeLabel(node) {
    if (!node) return 'Elemento';
    if (node.content) return node.content.replace(/\n/g, ' ').slice(0, 34);
    return node.name || ({ image: 'Immagine', video: 'Video', audio: 'Audio', document: 'Documento' }[node.type] || 'Elemento');
  }

  function renderPath() {
    project.path = project.path.filter(id => !!nodeById(id));
    refs.pathEmpty.hidden = project.path.length > 0;
    refs.pathList.innerHTML = project.path.map((id, index) => `<li data-path-index="${index}" title="Seleziona questa tappa"><span>${esc(nodeLabel(nodeById(id)))}</span><button type="button" data-remove-path="${index}" aria-label="Rimuovi tappa">×</button></li>`).join('');
  }

  function setSelection(type, id) {
    selection = { type, id };
    $('.inspector').classList.toggle('mobile-open', !!type && window.innerWidth <= 720);
    renderNodes(); renderEdges(); renderInspector();
  }

  function selectTool(next) {
    tool = next; connectorStart = null;
    $$('.tool[data-tool]').forEach(button => button.classList.toggle('active', button.dataset.tool === tool));
    refs.viewport.classList.toggle('connector-mode', tool === 'connector');
    renderNodes();
    if (tool === 'connector') toast('Seleziona due elementi da collegare');
  }

  function addNode(type, options = {}) {
    const center = centerPointForNewItem();
    const sizes = { text: [360, 170], shape: [300, 180], url: [330, 190], image: [420, 280], video: [440, 280], audio: [400, 150], document: [340, 190] };
    const [w, h] = sizes[type] || [320, 180];
    const defaults = type === 'shape' ? { content: 'Nuova idea', bg: '#e8e2ff', border: '#705cf5' } : type === 'text' ? { content: 'Scrivi qui', shape: 'none', borderWidth: 0 } : {};
    const node = baseNode(uid(), type, center.x - w / 2, center.y - h / 2, w, h, { ...defaults, ...options });
    project.nodes.push(node);
    setSelection('node', node.id);
    markChanged();
    return node;
  }

  function handleNodePointerDown(event) {
    const nodeEl = event.target.closest('.canvas-node');
    if (!nodeEl || presentation || event.button !== 0) return;
    const node = nodeById(nodeEl.dataset.nodeId);
    if (!node) return;
    if (tool === 'connector') {
      event.preventDefault();
      if (!connectorStart) {
        connectorStart = node.id; renderNodes(); toast('Ora scegli il secondo elemento');
      } else if (connectorStart !== node.id) {
        const duplicate = project.edges.some(edge => edge.from === connectorStart && edge.to === node.id);
        if (!duplicate) {
          const edge = baseEdge(connectorStart, node.id); project.edges.push(edge); setSelection('edge', edge.id); markChanged();
        } else toast('Questi elementi sono già collegati');
        connectorStart = null; selectTool('select');
      }
      return;
    }
    if (event.target.closest('audio,video') && event.target !== nodeEl) return;
    event.preventDefault();
    setSelection('node', node.id);
    const point = screenToWorld(event.clientX, event.clientY);
    const resize = event.target.classList.contains('resize-handle');
    interaction = { type: resize ? 'resize' : 'move', nodeId: node.id, startX: point.x, startY: point.y, x: node.x, y: node.y, w: node.w, h: node.h, element: refs.nodes.querySelector(`[data-node-id="${node.id}"]`) };
    event.target.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!interaction) return;
    if (interaction.type === 'pan') {
      setCamera({ x: interaction.x + event.clientX - interaction.startX, y: interaction.y + event.clientY - interaction.startY });
      return;
    }
    const node = nodeById(interaction.nodeId); if (!node) return;
    const point = screenToWorld(event.clientX, event.clientY);
    const dx = point.x - interaction.startX; const dy = point.y - interaction.startY;
    if (interaction.type === 'move') { node.x = interaction.x + dx; node.y = interaction.y + dy; }
    else { node.w = Math.max(80, interaction.w + dx); node.h = Math.max(50, interaction.h + dy); }
    interaction.element.style.left = `${node.x}px`; interaction.element.style.top = `${node.y}px`;
    interaction.element.style.width = `${node.w}px`; interaction.element.style.height = `${node.h}px`;
    renderEdges();
  }

  function endInteraction() {
    if (!interaction) return;
    const wasEdit = interaction.type === 'move' || interaction.type === 'resize';
    interaction = null;
    refs.viewport.classList.remove('is-dragging');
    if (wasEdit) { renderInspector(); markChanged(); }
  }

  function handleViewportPointerDown(event) {
    if (presentation || event.button !== 0) return;
    if (event.target.closest('.canvas-node') || event.target.closest('[data-edge-id]')) return;
    if (tool === 'connector') { connectorStart = null; renderNodes(); return; }
    setSelection(null, null);
    interaction = { type: 'pan', startX: event.clientX, startY: event.clientY, x: camera.x, y: camera.y };
    refs.viewport.classList.add('is-dragging');
    refs.viewport.setPointerCapture?.(event.pointerId);
  }

  function fitOverview(animate = true) {
    const rect = refs.viewport.getBoundingClientRect();
    if (!project.nodes.length) { setCamera({ x: rect.width / 2 - 1500, y: rect.height / 2 - 1000, scale: .5 }, animate); return; }
    const minX = Math.min(...project.nodes.map(n => n.x)); const minY = Math.min(...project.nodes.map(n => n.y));
    const maxX = Math.max(...project.nodes.map(n => n.x + n.w)); const maxY = Math.max(...project.nodes.map(n => n.y + n.h));
    const width = Math.max(300, maxX - minX); const height = Math.max(180, maxY - minY); const pad = presentation ? 100 : 70;
    const scale = clamp(Math.min((rect.width - pad * 2) / width, (rect.height - pad * 2) / height), MIN_SCALE, presentation ? 1.1 : 1.35);
    setCamera({ scale, x: (rect.width - width * scale) / 2 - minX * scale, y: (rect.height - height * scale) / 2 - minY * scale }, animate);
    focusedNode = null; if (presentation) renderNodes();
  }

  function focusOnNode(id, animate = true) {
    const node = nodeById(id); if (!node) return;
    const rect = refs.viewport.getBoundingClientRect(); const pad = presentation ? 70 : 110;
    const scale = clamp(Math.min((rect.width - pad * 2) / node.w, (rect.height - pad * 2) / node.h), .25, 2.2);
    setCamera({ scale, x: rect.width / 2 - (node.x + node.w / 2) * scale, y: rect.height / 2 - (node.y + node.h / 2) * scale }, animate);
    focusedNode = id; renderNodes();
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = refs.viewport.getBoundingClientRect(); const before = screenToWorld(clientX, clientY);
    const scale = clamp(camera.scale * factor, MIN_SCALE, MAX_SCALE);
    setCamera({ scale, x: clientX - rect.left - before.x * scale, y: clientY - rect.top - before.y * scale });
  }

  function enterPresentation() {
    presentation = true; selection = { type: null, id: null }; pathIndex = -1; focusedNode = null;
    refs.body.classList.add('presentation'); refs.presentationBar.hidden = false;
    $('#pathCounter').textContent = 'Panoramica'; render();
    requestAnimationFrame(() => fitOverview(false));
  }

  function exitPresentation() {
    presentation = false; focusedNode = null; refs.body.classList.remove('presentation'); refs.presentationBar.hidden = true;
    if (document.fullscreenElement) document.exitFullscreen?.();
    render(); requestAnimationFrame(() => fitOverview(false));
  }

  function navigatePath(direction) {
    if (!project.path.length) { toast('Aggiungi prima delle tappe alla sequenza'); return; }
    pathIndex = clamp(pathIndex + direction, -1, project.path.length - 1);
    if (pathIndex === -1) { fitOverview(); $('#pathCounter').textContent = 'Panoramica'; }
    else { focusOnNode(project.path[pathIndex]); $('#pathCounter').textContent = `${pathIndex + 1} / ${project.path.length}`; }
  }

  function markChanged() { project.updatedAt = Date.now(); }

  function readProjects() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) { return []; }
  }

  function saveProject() {
    project.name = refs.name.value.trim() || 'Presentazione senza titolo'; project.updatedAt = Date.now();
    const projects = readProjects(); const index = projects.findIndex(item => item.id === project.id);
    if (index >= 0) projects[index] = deepCopy(project); else projects.push(deepCopy(project));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); toast('Presentazione salvata sul dispositivo'); }
    catch (_) { toast('Spazio locale insufficiente: usa Esporta per conservare il progetto'); }
  }

  function exportProject() {
    project.name = refs.name.value.trim() || project.name;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9àèéìòù]+/gi, '-').replace(/^-|-$/g, '') || 'presentazione'}.spazio.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); toast('Progetto esportato');
  }

  function validateProject(value) {
    return value && Array.isArray(value.nodes) && Array.isArray(value.edges) && Array.isArray(value.path);
  }

  async function importProject(file) {
    try {
      const value = JSON.parse(await file.text());
      if (!validateProject(value)) throw new Error('Formato non valido');
      project = { background: '#f4f0e8', ...value, id: uid(), updatedAt: Date.now() };
      selection = { type: null, id: null }; render(); requestAnimationFrame(() => fitOverview(false)); toast('Presentazione importata');
    } catch (_) { toast('Il file non è un progetto Spazio valido'); }
  }

  function renderProjectsDialog() {
    const projects = readProjects().sort((a, b) => b.updatedAt - a.updatedAt);
    $('#projectsList').innerHTML = projects.length ? projects.map(item => `<div class="project-row" data-project-id="${item.id}"><div><strong>${esc(item.name)}</strong><small>${new Date(item.updatedAt).toLocaleString('it-IT')}</small></div><button class="load-project" type="button">Apri</button><button class="delete-project" type="button">Elimina</button></div>`).join('') : '<p class="hint">Non hai ancora salvato presentazioni su questo dispositivo.</p>';
    if (!$('#projectsDialog').open) $('#projectsDialog').showModal();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
  }

  async function insertFile(file, kind) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast('Il file supera 25 MB; compriminalo prima di inserirlo'); return; }
    try {
      const src = await readFileAsDataUrl(file); let type = kind;
      if (kind === 'media') type = file.type.startsWith('audio/') ? 'audio' : 'video';
      const options = { src, name: file.name, mime: file.type };
      if (type === 'image' || type === 'video') { options.bg = '#17191f'; options.border = '#17191f'; }
      addNode(type === 'document' ? 'document' : type, options); toast(`${file.name} inserito`);
    } catch (_) { toast('Non riesco a leggere questo file'); }
  }

  function updateNodeField(field, value) {
    const node = selectedNode(); if (!node) return;
    node[field] = ['x','y','w','h','rotation','borderWidth','fontSize'].includes(field) ? Number(value) : value;
    markChanged(); renderNodes(); renderEdges();
  }

  function bindInspector() {
    const nodeFields = { nodeX: 'x', nodeY: 'y', nodeW: 'w', nodeH: 'h', nodeRotation: 'rotation', nodeShape: 'shape', nodeBg: 'bg', nodeColor: 'color', nodeBorder: 'border', nodeBorderWidth: 'borderWidth', nodeFontSize: 'fontSize', nodeContent: 'content' };
    Object.entries(nodeFields).forEach(([id, field]) => {
      $(`#${id}`).addEventListener('input', event => {
        updateNodeField(field, event.target.value);
        if (field === 'rotation') $('#nodeRotationValue').value = `${event.target.value}°`;
        if (field === 'fontSize') $('#nodeFontSizeValue').value = `${event.target.value} px`;
      });
    });
    const edgeFields = { edgeColor: 'color', edgeWidth: 'width', edgeShape: 'shape', edgeStyle: 'style', edgeArrow: 'arrow' };
    Object.entries(edgeFields).forEach(([id, field]) => $(`#${id}`).addEventListener('input', event => {
      const edge = selectedEdge(); if (!edge) return;
      edge[field] = field === 'width' ? Number(event.target.value) : field === 'arrow' ? event.target.checked : event.target.value;
      if (field === 'width') $('#edgeWidthValue').value = `${edge.width} px`;
      markChanged(); renderEdges();
    }));
  }

  refs.nodes.addEventListener('pointerdown', handleNodePointerDown);
  refs.viewport.addEventListener('pointerdown', handleViewportPointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', endInteraction);
  window.addEventListener('pointercancel', endInteraction);
  refs.viewport.addEventListener('wheel', event => { event.preventDefault(); zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.12 : .89); }, { passive: false });

  refs.connectors.addEventListener('pointerdown', event => {
    if (presentation) return; const group = event.target.closest('[data-edge-id]'); if (!group) return;
    event.stopPropagation(); setSelection('edge', group.dataset.edgeId);
  });

  refs.nodes.addEventListener('dblclick', event => {
    const el = event.target.closest('.canvas-node'); if (!el) return; const node = nodeById(el.dataset.nodeId); if (!node) return;
    if (presentation) {
      if (focusedNode === node.id) { fitOverview(); pathIndex = -1; $('#pathCounter').textContent = 'Panoramica'; }
      else focusOnNode(node.id);
      return;
    }
    if (node.type === 'url') { window.open(node.src, '_blank', 'noopener'); return; }
    if (node.type === 'document') {
      const link = document.createElement('a'); link.href = node.src; link.download = node.name || 'documento'; link.click(); return;
    }
    const editable = event.target.closest('[data-editable]');
    if (editable) { editable.contentEditable = 'true'; editable.focus(); document.execCommand?.('selectAll', false); }
  });

  refs.nodes.addEventListener('focusout', event => {
    const editable = event.target.closest('[data-editable]'); if (!editable || editable.contentEditable !== 'true') return;
    const nodeEl = editable.closest('.canvas-node'); const node = nodeById(nodeEl.dataset.nodeId);
    node.content = editable.innerText.trim() || 'Scrivi qui'; editable.contentEditable = 'false'; markChanged(); renderInspector();
  });

  refs.nodes.addEventListener('keydown', event => {
    if (event.target.matches('[contenteditable="true"]') && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) event.target.blur();
  });

  $$('.tool[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
  $$('[data-add]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.add === 'url') { $('#urlTitle').value = ''; $('#urlValue').value = ''; $('#urlDialog').showModal(); $('#urlValue').focus(); }
    else addNode(button.dataset.add);
  }));

  $('#urlForm').addEventListener('submit', event => {
    event.preventDefault(); let value = $('#urlValue').value.trim(); if (!value) return;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    addNode('url', { src: value, content: $('#urlTitle').value.trim() || 'Risorsa online', bg: '#ffffff', border: '#705cf5' });
    $('#urlDialog').close();
  });

  $('#imageInput').addEventListener('change', event => { insertFile(event.target.files[0], 'image'); event.target.value = ''; });
  $('#mediaInput').addEventListener('change', event => { insertFile(event.target.files[0], 'media'); event.target.value = ''; });
  $('#documentInput').addEventListener('change', event => { insertFile(event.target.files[0], 'document'); event.target.value = ''; });
  $('#importInput').addEventListener('change', event => { importProject(event.target.files[0]); event.target.value = ''; });

  refs.name.addEventListener('input', () => { project.name = refs.name.value; markChanged(); });
  $('#projectBackground').addEventListener('input', event => { project.background = event.target.value; refs.viewport.style.backgroundColor = project.background; markChanged(); });
  $('#saveBtn').addEventListener('click', saveProject);
  $('#exportBtn').addEventListener('click', exportProject);
  $('#openBtn').addEventListener('click', renderProjectsDialog);
  $('#closeProjectsBtn').addEventListener('click', () => $('#projectsDialog').close());
  $('#newBtn').addEventListener('click', () => {
    if (!confirm('Creare una nuova presentazione? Le modifiche non salvate resteranno solo in questa pagina.')) return;
    project = { id: uid(), name: 'Presentazione senza titolo', updatedAt: Date.now(), background: '#f4f0e8', nodes: [], edges: [], path: [] };
    selection = { type: null, id: null }; $('.inspector').classList.remove('mobile-open'); render(); fitOverview(false);
  });

  $('#projectsList').addEventListener('click', event => {
    const row = event.target.closest('.project-row'); if (!row) return; const projects = readProjects(); const item = projects.find(p => p.id === row.dataset.projectId);
    if (event.target.closest('.load-project') && item) { project = deepCopy(item); selection = { type: null, id: null }; $('#projectsDialog').close(); render(); requestAnimationFrame(() => fitOverview(false)); toast('Presentazione caricata'); }
    if (event.target.closest('.delete-project')) {
      if (!confirm(`Eliminare “${item?.name || 'questa presentazione'}”?`)) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.filter(p => p.id !== row.dataset.projectId))); renderProjectsDialog();
    }
  });

  $('#deleteNodeBtn').addEventListener('click', () => {
    const node = selectedNode(); if (!node) return;
    project.nodes = project.nodes.filter(n => n.id !== node.id); project.edges = project.edges.filter(e => e.from !== node.id && e.to !== node.id); project.path = project.path.filter(id => id !== node.id);
    selection = { type: null, id: null }; markChanged(); render();
  });
  $('#deleteEdgeBtn').addEventListener('click', () => { const edge = selectedEdge(); if (!edge) return; project.edges = project.edges.filter(e => e.id !== edge.id); selection = { type: null, id: null }; markChanged(); render(); });
  $('#bringFrontBtn').addEventListener('click', () => { const node = selectedNode(); if (!node) return; project.nodes = project.nodes.filter(n => n.id !== node.id); project.nodes.push(node); markChanged(); renderNodes(); });
  $('#sendBackBtn').addEventListener('click', () => { const node = selectedNode(); if (!node) return; project.nodes = project.nodes.filter(n => n.id !== node.id); project.nodes.unshift(node); markChanged(); renderNodes(); });

  $('#addPathBtn').addEventListener('click', () => {
    const node = selectedNode(); if (!node) { toast('Seleziona prima un elemento'); return; }
    if (project.path.includes(node.id)) { toast('L’elemento è già nella sequenza'); return; }
    project.path.push(node.id); markChanged(); renderPath(); toast('Tappa aggiunta');
  });
  refs.pathList.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-path]');
    if (remove) { project.path.splice(Number(remove.dataset.removePath), 1); markChanged(); renderPath(); return; }
    const row = event.target.closest('[data-path-index]'); if (row) { const id = project.path[Number(row.dataset.pathIndex)]; setSelection('node', id); focusOnNode(id); }
  });
  $('#clearPathBtn').addEventListener('click', () => { project.path = []; markChanged(); renderPath(); });

  $('#zoomInBtn').addEventListener('click', () => { const r = refs.viewport.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2); });
  $('#zoomOutBtn').addEventListener('click', () => { const r = refs.viewport.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, .8); });
  $('#fitBtn').addEventListener('click', () => fitOverview());
  $('#presentBtn').addEventListener('click', enterPresentation);
  $('#exitPresentationBtn').addEventListener('click', exitPresentation);
  $('#prevPathBtn').addEventListener('click', () => navigatePath(-1));
  $('#nextPathBtn').addEventListener('click', () => navigatePath(1));
  $('#fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());

  window.addEventListener('keydown', event => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveProject(); return; }
    if (presentation) {
      if (event.key === 'Escape' && !document.fullscreenElement) exitPresentation();
      if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); navigatePath(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigatePath(-1); }
      return;
    }
    if (!typing && (event.key === 'Delete' || event.key === 'Backspace')) {
      if (selectedNode()) $('#deleteNodeBtn').click(); else if (selectedEdge()) $('#deleteEdgeBtn').click();
    }
  });

  window.addEventListener('resize', () => { if (presentation && !focusedNode) fitOverview(false); });
  bindInspector(); render(); requestAnimationFrame(() => fitOverview(false));

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
