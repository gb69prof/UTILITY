(function () {
  'use strict';

  const FORMAT_VERSION = 2;
  const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
  const $ = id => document.getElementById(id);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const clone = value => JSON.parse(JSON.stringify(value));

  const dom = {};
  const state = {
    project: null,
    currentSceneId: null,
    sceneHistory: [],
    selectedId: null,
    dirty: false,
    saveTimer: null,
    mode: 'edit',
    tool: 'add',
    scale: 1,
    panX: 0,
    panY: 0,
    baseW: 1,
    baseH: 1,
    pointers: new Map(),
    gesture: null,
    markerDrag: null,
    installPrompt: null,
    replacementImage: null,
    suppressCanvasClick: false
  };

  const categoryColors = {
    informazione: '#e5a02d', personaggio: '#d36850', luogo: '#50a181', evento: '#cc6d7d',
    concetto: '#6d7dcc', documento: '#8d735b', domanda: '#a46bb2'
  };

  function cacheDom() {
    [
      'homeView','editorView','installButton','newProjectButton','openProjectButton','importProjectButton','projectImportInput','loadDemoButton','recentProjects','guideButton',
      'homeButton','projectTitleDisplay','saveState','editModeButton','exploreModeButton','saveButton','exportProjectButton','exportViewerButton','mobileMenuButton','mobileActions','mobileSave','mobileExportProject','mobileExportViewer',
      'projectSidebar','closeSidebarButton','openSidebarButton','hotspotSearch','hotspotList','projectSettingsButton','sceneTitleDisplay','sceneCountDisplay','sceneBreadcrumbs','backSceneButton','addToolButton','panToolButton','zoomOutButton','zoomInButton','zoomOutput','resetViewButton','imageViewport','emptyCanvas','imageCanvas','mainImage','hotspotLayer',
      'inspector','inspectorEmpty','hotspotForm','inspectorTitle','closeInspectorButton','hotspotImageInput','hotspotAudioInput','hotspotVideoInput','imageFileName','audioFileName','videoFileName','removeHotspotImage','removeHotspotAudio','removeHotspotVideo','relationTarget','relationType','relationLabel','addRelationButton','relationList','duplicateHotspotButton','deleteHotspotButton',
      'childSceneEmpty','childSceneImageInput','childSceneImageName','createChildSceneButton','childSceneLinked','childSceneTitle','childSceneStats','enterChildSceneButton','removeChildSceneButton',
      'newProjectDialog','newProjectForm','mainImageFileName','openProjectDialog','closeOpenDialog','allProjects','settingsDialog','settingsForm','settingsEyebrow','settingsTitle','replaceImageInput','replaceImageName',
      'contentDialog','closeContentButton','contentCard','guideDialog','closeGuideButton','toast'
    ].forEach(id => { dom[id] = $(id); });
  }

  function toast(message, duration = 2800) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => dom.toast.classList.remove('show'), duration);
  }

  function safeDialogOpen(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function safeDialogClose(dialog) {
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function dateLabel(value) {
    try { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
    catch { return 'Data non disponibile'; }
  }

  function slugText(value) { return String(value || '').trim(); }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Lettura file non riuscita'));
      reader.readAsDataURL(file);
    });
  }

  async function mediaFromFile(file) {
    return { name: file.name, type: file.type, size: file.size, dataUrl: await fileToDataUrl(file) };
  }

  function makeProject({ title, description, image, imageAlt }) {
    const now = new Date().toISOString();
    const rootSceneId = uid();
    const projectTitle = slugText(title) || 'Senza titolo';
    return {
      version: FORMAT_VERSION,
      id: uid(),
      title: projectTitle,
      description: slugText(description),
      rootSceneId,
      scenes: [{ id: rootSceneId, title: projectTitle, description: slugText(description), image: { ...image, alt: slugText(imageAlt) }, hotspots: [], parentHotspotId: '' }],
      settings: { guidedMode: false },
      createdAt: now,
      updatedAt: now
    };
  }

  function normalizeHotspot(raw, index) {
    const x = Number(raw && raw.x);
    const y = Number(raw && raw.y);
    return {
      id: typeof raw?.id === 'string' && raw.id ? raw.id : uid(),
      x: Math.max(0, Math.min(100, Number.isFinite(x) ? x : 50)),
      y: Math.max(0, Math.min(100, Number.isFinite(y) ? y : 50)),
      title: slugText(raw?.title) || `Hotspot ${index + 1}`,
      category: categoryColors[raw?.category] ? raw.category : 'informazione',
      style: ['point','circle','number','icon'].includes(raw?.style) ? raw.style : 'point',
      number: Math.max(1, Number(raw?.number) || index + 1),
      shortText: String(raw?.shortText || ''), longText: String(raw?.longText || ''),
      image: raw?.image && (raw.image.dataUrl || raw.image.src) ? raw.image : null,
      imageAlt: String(raw?.imageAlt || ''),
      audio: raw?.audio && (raw.audio.dataUrl || raw.audio.src) ? raw.audio : null,
      video: raw?.video && (raw.video.dataUrl || raw.video.src) ? raw.video : null,
      videoUrl: String(raw?.videoUrl || ''), linkUrl: String(raw?.linkUrl || ''), linkLabel: String(raw?.linkLabel || ''),
      question: String(raw?.question || ''), answer: String(raw?.answer || ''),
      targetSceneId: String(raw?.targetSceneId || ''),
      previousId: String(raw?.previousId || ''), nextId: String(raw?.nextId || ''),
      relations: Array.isArray(raw?.relations) ? raw.relations.filter(r => r && r.targetId).map(r => ({ targetId: String(r.targetId), type: String(r.type || 'collega'), label: String(r.label || '') })) : []
    };
  }

  function normalizeScene(raw, index) {
    if (!raw?.image || !(raw.image.dataUrl || raw.image.src)) throw new Error(`Manca l’immagine della scena ${index + 1}`);
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: slugText(raw.title) || `Scena ${index + 1}`,
      description: String(raw.description || ''),
      image: raw.image,
      hotspots: (Array.isArray(raw.hotspots) ? raw.hotspots : []).map(normalizeHotspot),
      parentHotspotId: String(raw.parentHotspotId || '')
    };
  }

  function migrateProject(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Il file non contiene un progetto');
    if (raw.version && Number(raw.version) > FORMAT_VERSION) throw new Error('Il progetto usa una versione futura non ancora supportata');
    const now = new Date().toISOString();
    const sourceScenes = Array.isArray(raw.scenes) && raw.scenes.length
      ? raw.scenes
      : [{ id: uid(), title: raw.title, description: raw.description, image: raw.image, hotspots: raw.hotspots, parentHotspotId: '' }];
    const scenes = sourceScenes.map(normalizeScene);
    const requestedRoot = String(raw.rootSceneId || '');
    const rootScene = scenes.find(scene => scene.id === requestedRoot) || scenes[0];
    const project = {
      version: FORMAT_VERSION,
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      title: slugText(raw.title) || 'Progetto importato',
      description: String(raw.description || ''),
      rootSceneId: rootScene.id,
      scenes,
      settings: { guidedMode: Boolean(raw.settings?.guidedMode) },
      createdAt: raw.createdAt || now,
      updatedAt: raw.updatedAt || now
    };
    const sceneIds = new Set(project.scenes.map(scene => scene.id));
    project.scenes.forEach(scene => {
      const ids = new Set(scene.hotspots.map(h => h.id));
      scene.hotspots.forEach(h => {
        if (!ids.has(h.previousId) || h.previousId === h.id) h.previousId = '';
        if (!ids.has(h.nextId) || h.nextId === h.id) h.nextId = '';
        h.relations = h.relations.filter(r => ids.has(r.targetId) && r.targetId !== h.id);
        if (!sceneIds.has(h.targetSceneId) || h.targetSceneId === scene.id) h.targetSceneId = '';
        const child = project.scenes.find(item => item.id === h.targetSceneId);
        if (child) child.parentHotspotId = h.id;
      });
    });
    return project;
  }

  function newHotspot(x, y) {
    const index = activeScene().hotspots.length;
    return normalizeHotspot({ id: uid(), x, y, title: `Hotspot ${index + 1}`, number: index + 1 }, index);
  }

  function rootScene(project = state.project) { return project?.scenes?.find(scene => scene.id === project.rootSceneId) || project?.scenes?.[0] || null; }
  function activeScene() { return state.project?.scenes.find(scene => scene.id === state.currentSceneId) || rootScene(); }
  function getSelected() { return activeScene()?.hotspots.find(h => h.id === state.selectedId) || null; }
  function allHotspots(project = state.project) { return (project?.scenes || []).flatMap(scene => scene.hotspots || []); }
  function projectStats(project) {
    if (!project?.scenes?.length) return { scenes: project ? 1 : 0, hotspots: project?.hotspots?.length || 0 };
    return { scenes: project.scenes.length, hotspots: allHotspots(project).length };
  }
  function findParentScene(scene) {
    if (!scene?.parentHotspotId) return null;
    return state.project.scenes.find(candidate => candidate.hotspots.some(h => h.id === scene.parentHotspotId)) || null;
  }

  function setSaveState(kind, text) {
    dom.saveState.dataset.state = kind;
    dom.saveState.textContent = text;
  }

  function markDirty() {
    if (!state.project) return;
    state.dirty = true;
    state.project.updatedAt = new Date().toISOString();
    setSaveState('dirty', 'Modifiche non salvate');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => saveProject(false), 850);
  }

  async function saveProject(notify = true) {
    if (!state.project) return;
    clearTimeout(state.saveTimer);
    setSaveState('saving', 'Salvataggio…');
    state.project.updatedAt = new Date().toISOString();
    try {
      await window.ThinkgbDB.save(clone(state.project));
      state.dirty = false;
      setSaveState('saved', 'Salvato');
      if (notify) toast('Progetto salvato sul dispositivo');
    } catch (error) {
      state.dirty = true;
      setSaveState('dirty', 'Salvataggio non riuscito');
      toast(error?.name === 'QuotaExceededError' ? 'Spazio insufficiente: esporta il progetto e riduci i media' : `Salvataggio non riuscito: ${error.message}` , 4500);
    }
  }

  async function renderProjectCollections() {
    let projects = [];
    try { projects = await window.ThinkgbDB.all(); }
    catch (error) { toast(`Archivio locale non disponibile: ${error.message}`, 4200); }
    renderRecent(projects.slice(0, 3));
    renderAllProjects(projects);
  }

  function projectThumb(project) {
    const image = document.createElement('img');
    const imageData = rootScene(project)?.image || project.image;
    image.src = imageData?.dataUrl || imageData?.src || '';
    image.alt = '';
    return image;
  }

  function renderRecent(projects) {
    dom.recentProjects.innerHTML = '';
    if (!projects.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-recent';
      empty.textContent = 'Qui compariranno i progetti salvati. Puoi iniziare dall’esempio.';
      dom.recentProjects.appendChild(empty);
      return;
    }
    projects.forEach(project => {
      const button = document.createElement('button');
      button.className = 'recent-card';
      button.type = 'button';
      const thumb = document.createElement('div'); thumb.className = 'recent-thumb'; thumb.appendChild(projectThumb(project));
      const meta = document.createElement('div'); meta.className = 'recent-meta';
      const title = document.createElement('strong'); title.textContent = project.title;
      const stats = projectStats(project); const info = document.createElement('span'); info.textContent = `${stats.scenes} scene · ${stats.hotspots} hotspot · ${dateLabel(project.updatedAt)}`;
      meta.append(title, info); button.append(thumb, meta);
      button.addEventListener('click', () => openSavedProject(project.id));
      dom.recentProjects.appendChild(button);
    });
  }

  function renderAllProjects(projects) {
    dom.allProjects.innerHTML = '';
    if (!projects.length) {
      const empty = document.createElement('p'); empty.className = 'empty-recent'; empty.textContent = 'Non ci sono ancora progetti salvati.';
      dom.allProjects.appendChild(empty); return;
    }
    projects.forEach(project => {
      const row = document.createElement('div'); row.className = 'project-row'; row.setAttribute('role', 'button'); row.tabIndex = 0;
      row.appendChild(projectThumb(project));
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = project.title;
      const stats = projectStats(project); const info = document.createElement('small'); info.textContent = `${stats.scenes} scene · ${stats.hotspots} hotspot · ${dateLabel(project.updatedAt)}`;
      copy.append(title, document.createElement('br'), info);
      const del = document.createElement('button'); del.className = 'delete-project'; del.type = 'button'; del.textContent = '⌫'; del.setAttribute('aria-label', `Elimina ${project.title}`);
      del.addEventListener('click', async event => {
        event.stopPropagation();
        if (!confirm(`Eliminare “${project.title}” dal dispositivo? Questa azione non è annullabile.`)) return;
        await window.ThinkgbDB.delete(project.id); renderProjectCollections(); toast('Progetto eliminato');
      });
      const open = () => openSavedProject(project.id);
      row.addEventListener('click', open); row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
      row.append(copy, del); dom.allProjects.appendChild(row);
    });
  }

  async function openSavedProject(id) {
    try {
      const project = await window.ThinkgbDB.get(id);
      if (!project) throw new Error('Progetto non trovato');
      safeDialogClose(dom.openProjectDialog);
      enterEditor(migrateProject(project));
    } catch (error) { toast(`Impossibile aprire: ${error.message}`, 4000); }
  }

  function enterEditor(project) {
    state.project = project;
    state.currentSceneId = project.rootSceneId;
    state.sceneHistory = [];
    state.selectedId = null;
    state.mode = 'edit';
    state.tool = 'add';
    state.dirty = false;
    dom.homeView.classList.add('hidden');
    dom.editorView.classList.remove('hidden', 'explore');
    dom.projectTitleDisplay.textContent = project.title;
    dom.editModeButton.classList.add('active'); dom.exploreModeButton.classList.remove('active');
    setTool('add');
    setSaveState('saved', 'Salvato');
    closeInspector(); closeSidebar();
    showScene(project.rootSceneId, false);
  }

  async function goHome() {
    if (state.project && state.dirty) await saveProject(false);
    state.project = null; state.selectedId = null; state.currentSceneId = null; state.sceneHistory = [];
    dom.editorView.classList.add('hidden'); dom.homeView.classList.remove('hidden');
    dom.contentDialog.open && safeDialogClose(dom.contentDialog);
    await renderProjectCollections();
  }

  function scenePath(scene = activeScene()) {
    const path = [];
    const seen = new Set();
    let cursor = scene;
    while (cursor && !seen.has(cursor.id)) {
      path.unshift(cursor); seen.add(cursor.id); cursor = findParentScene(cursor);
    }
    return path;
  }

  function renderSceneNavigation() {
    const scene = activeScene(); if (!scene) return;
    dom.sceneTitleDisplay.textContent = scene.title;
    dom.sceneCountDisplay.textContent = `${scene.hotspots.length} hotspot`;
    dom.sceneBreadcrumbs.innerHTML = '';
    scenePath(scene).forEach((item, index, path) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = item.title;
      button.disabled = item.id === scene.id;
      button.addEventListener('click', () => showScene(item.id));
      dom.sceneBreadcrumbs.appendChild(button);
      if (index < path.length - 1) { const separator = document.createElement('span'); separator.textContent = '›'; dom.sceneBreadcrumbs.appendChild(separator); }
    });
    dom.backSceneButton.classList.toggle('hidden', scene.id === state.project.rootSceneId);
  }

  function showScene(sceneId, remember = true) {
    const next = state.project?.scenes.find(scene => scene.id === sceneId); if (!next) return;
    if (remember && state.currentSceneId && state.currentSceneId !== sceneId) state.sceneHistory.push(state.currentSceneId);
    state.currentSceneId = next.id; state.selectedId = null;
    safeDialogClose(dom.contentDialog); closeInspector(); closeSidebar();
    dom.mainImage.src = next.image?.dataUrl || next.image?.src || '';
    dom.mainImage.alt = next.image?.alt || next.title;
    dom.emptyCanvas.classList.toggle('hidden', Boolean(dom.mainImage.src));
    renderSceneNavigation(); renderHotspots(); renderHotspotList(); renderInspector();
    if (dom.mainImage.complete && dom.mainImage.naturalWidth) fitImage();
  }

  function goBackScene() {
    const scene = activeScene(); if (!scene || scene.id === state.project.rootSceneId) return;
    const parent = findParentScene(scene);
    const fallback = state.sceneHistory.pop();
    showScene(parent?.id || fallback || state.project.rootSceneId, false);
  }

  function fitImage() {
    if (!state.project || !dom.mainImage.naturalWidth) return;
    const rect = dom.imageViewport.getBoundingClientRect();
    const maxW = Math.max(1, rect.width - 28), maxH = Math.max(1, rect.height - 28);
    const ratio = dom.mainImage.naturalWidth / dom.mainImage.naturalHeight;
    state.baseW = maxW; state.baseH = state.baseW / ratio;
    if (state.baseH > maxH) { state.baseH = maxH; state.baseW = state.baseH * ratio; }
    dom.imageCanvas.style.width = `${state.baseW}px`;
    dom.imageCanvas.style.height = `${state.baseH}px`;
    resetView();
  }

  function applyTransform() {
    dom.imageCanvas.style.transform = `translate(calc(-50% + ${state.panX}px), calc(-50% + ${state.panY}px)) scale(${state.scale})`;
    dom.imageCanvas.style.setProperty('--inverse-zoom', 1 / state.scale);
    dom.zoomOutput.textContent = `${Math.round(state.scale * 100)}%`;
  }

  function resetView() { state.scale = 1; state.panX = 0; state.panY = 0; applyTransform(); }

  function setZoom(next, clientX, clientY) {
    const old = state.scale;
    state.scale = Math.max(1, Math.min(5, next));
    if (clientX != null && state.scale !== old) {
      const r = dom.imageViewport.getBoundingClientRect();
      const dx = clientX - (r.left + r.width / 2), dy = clientY - (r.top + r.height / 2);
      state.panX = dx - (dx - state.panX) * state.scale / old;
      state.panY = dy - (dy - state.panY) * state.scale / old;
    }
    applyTransform();
  }

  function markerText(hotspot, index) { return hotspot.style === 'number' ? String(hotspot.number || index + 1) : hotspot.title; }

  function renderHotspots() {
    dom.hotspotLayer.innerHTML = '';
    if (!state.project) return;
    activeScene().hotspots.forEach((hotspot, index) => {
      const marker = document.createElement('button');
      marker.type = 'button'; marker.className = 'hotspot-marker'; marker.dataset.id = hotspot.id; marker.dataset.style = hotspot.style;
      marker.style.left = `${hotspot.x}%`; marker.style.top = `${hotspot.y}%`; marker.style.setProperty('--marker', categoryColors[hotspot.category] || categoryColors.informazione);
      marker.textContent = markerText(hotspot, index); marker.title = hotspot.title; marker.setAttribute('aria-label', hotspot.title);
      marker.classList.toggle('active', state.selectedId === hotspot.id);
      marker.classList.toggle('has-child', Boolean(childSceneFor(hotspot)));
      marker.addEventListener('pointerdown', event => startMarkerDrag(event, hotspot.id));
      marker.addEventListener('click', event => {
        event.stopPropagation();
        if (state.suppressCanvasClick) { state.suppressCanvasClick = false; return; }
        if (state.mode === 'explore') openContent(hotspot.id); else selectHotspot(hotspot.id, true);
      });
      dom.hotspotLayer.appendChild(marker);
    });
  }

  function renderHotspotList() {
    dom.hotspotList.innerHTML = '';
    if (!state.project) return;
    const query = dom.hotspotSearch.value.trim().toLowerCase();
    const items = activeScene().hotspots.filter(h => !query || `${h.title} ${h.category}`.toLowerCase().includes(query));
    if (!items.length) {
      const empty = document.createElement('div'); empty.className = 'hotspot-list-empty'; empty.textContent = query ? 'Nessun risultato.' : 'Tocca l’immagine per creare il primo hotspot.';
      dom.hotspotList.appendChild(empty); return;
    }
    items.forEach((hotspot, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'hotspot-list-item'; button.classList.toggle('active', state.selectedId === hotspot.id);
      const marker = document.createElement('span'); marker.className = 'list-marker'; marker.style.background = categoryColors[hotspot.category]; marker.textContent = hotspot.style === 'number' ? hotspot.number : index + 1;
      const copy = document.createElement('span'); copy.className = 'list-copy'; const title = document.createElement('strong'); title.textContent = hotspot.title; const category = document.createElement('span'); category.textContent = hotspot.category; copy.append(title, category); button.append(marker, copy);
      button.addEventListener('click', () => { selectHotspot(hotspot.id, true); closeSidebar(); });
      dom.hotspotList.appendChild(button);
    });
  }

  function setTool(tool) {
    state.tool = tool;
    dom.addToolButton.classList.toggle('active', tool === 'add'); dom.addToolButton.setAttribute('aria-pressed', String(tool === 'add'));
    dom.panToolButton.classList.toggle('active', tool === 'pan'); dom.panToolButton.setAttribute('aria-pressed', String(tool === 'pan'));
    dom.imageViewport.classList.toggle('pan-mode', tool === 'pan');
  }

  function selectHotspot(id, openPanel) {
    state.selectedId = id;
    renderHotspots(); renderHotspotList(); renderInspector();
    if (openPanel && innerWidth <= 900) dom.inspector.classList.add('open');
  }

  function closeInspector() { dom.inspector.classList.remove('open'); }
  function closeSidebar() { dom.projectSidebar.classList.remove('open'); }

  function optionList(select, currentId, allowSelf = false) {
    const selected = select.value;
    const firstText = select.options[0]?.textContent || 'Nessuno';
    select.innerHTML = ''; const none = document.createElement('option'); none.value = ''; none.textContent = firstText; select.appendChild(none);
    activeScene().hotspots.forEach(h => {
      if (!allowSelf && h.id === currentId) return;
      const option = document.createElement('option'); option.value = h.id; option.textContent = h.title; select.appendChild(option);
    });
    select.value = selected;
  }

  function setNamed(form, name, value) {
    const control = form.elements.namedItem(name); if (!control) return;
    if (control.type === 'checkbox') control.checked = Boolean(value); else control.value = value ?? '';
  }

  function renderInspector() {
    const hotspot = getSelected();
    dom.inspectorEmpty.classList.toggle('hidden', Boolean(hotspot));
    dom.hotspotForm.classList.toggle('hidden', !hotspot);
    if (!hotspot) return;
    dom.inspectorTitle.textContent = hotspot.title;
    ['title','category','style','number','shortText','longText','imageAlt','videoUrl','linkUrl','linkLabel','question','answer','previousId','nextId'].forEach(name => setNamed(dom.hotspotForm, name, hotspot[name]));
    optionList(dom.hotspotForm.elements.previousId, hotspot.id); optionList(dom.hotspotForm.elements.nextId, hotspot.id); optionList(dom.relationTarget, hotspot.id);
    dom.hotspotForm.elements.previousId.value = hotspot.previousId || ''; dom.hotspotForm.elements.nextId.value = hotspot.nextId || '';
    dom.imageFileName.textContent = hotspot.image?.name || 'Nessun file'; dom.audioFileName.textContent = hotspot.audio?.name || 'Nessun file'; dom.videoFileName.textContent = hotspot.video?.name || 'Nessun file';
    dom.removeHotspotImage.classList.toggle('hidden', !hotspot.image); dom.removeHotspotAudio.classList.toggle('hidden', !hotspot.audio); dom.removeHotspotVideo.classList.toggle('hidden', !hotspot.video);
    renderRelations(hotspot);
    renderChildScene(hotspot);
  }

  function childSceneFor(hotspot) { return hotspot?.targetSceneId ? state.project.scenes.find(scene => scene.id === hotspot.targetSceneId) || null : null; }

  function renderChildScene(hotspot) {
    const child = childSceneFor(hotspot);
    dom.childSceneEmpty.classList.toggle('hidden', Boolean(child));
    dom.childSceneLinked.classList.toggle('hidden', !child);
    if (!child) { dom.childSceneImageInput.value = ''; dom.childSceneImageName.textContent = 'Nessun file'; return; }
    dom.childSceneTitle.textContent = child.title;
    dom.childSceneStats.textContent = `${child.hotspots.length} hotspot · livello ${scenePath(child).length}`;
  }

  function renderRelations(hotspot) {
    dom.relationList.innerHTML = '';
    hotspot.relations.forEach((relation, index) => {
      const target = activeScene().hotspots.find(h => h.id === relation.targetId); if (!target) return;
      const chip = document.createElement('div'); chip.className = 'relation-chip';
      const text = document.createElement('span'); text.textContent = `${relation.label || relation.type} → ${target.title}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Rimuovi relazione');
      remove.addEventListener('click', () => { hotspot.relations.splice(index, 1); markDirty(); renderRelations(hotspot); });
      chip.append(text, remove); dom.relationList.appendChild(chip);
    });
  }

  function updateHotspotFromForm(event) {
    const hotspot = getSelected(); if (!hotspot || !event.target.name) return;
    const field = event.target.name;
    hotspot[field] = field === 'number' ? Math.max(1, Number(event.target.value) || 1) : event.target.value;
    if (field === 'title') dom.inspectorTitle.textContent = hotspot.title || 'Senza titolo';
    markDirty();
    if (['title','category','style','number'].includes(field)) { renderHotspots(); renderHotspotList(); }
  }

  function createHotspotAt(clientX, clientY) {
    if (!state.project?.image || state.mode !== 'edit') return;
    const rect = dom.imageCanvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
    const hotspot = newHotspot((clientX - rect.left) / rect.width * 100, (clientY - rect.top) / rect.height * 100);
    activeScene().hotspots.push(hotspot); state.selectedId = hotspot.id; markDirty(); renderSceneNavigation(); renderHotspots(); renderHotspotList(); renderInspector();
    if (innerWidth <= 900) dom.inspector.classList.add('open');
    setTimeout(() => dom.hotspotForm.elements.title?.select(), 50);
  }

  function startMarkerDrag(event, id) {
    event.stopPropagation();
    if (state.mode === 'explore') return;
    const hotspot = activeScene().hotspots.find(h => h.id === id); if (!hotspot) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    state.markerDrag = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    selectHotspot(id, false);
  }

  function moveMarker(event) {
    const drag = state.markerDrag; if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) drag.moved = true;
    if (!drag.moved) return;
    const hotspot = activeScene().hotspots.find(h => h.id === drag.id); const rect = dom.imageCanvas.getBoundingClientRect();
    hotspot.x = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
    hotspot.y = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
    const marker = dom.hotspotLayer.querySelector(`[data-id="${CSS.escape(drag.id)}"]`); if (marker) { marker.style.left = `${hotspot.x}%`; marker.style.top = `${hotspot.y}%`; }
  }

  function endMarkerDrag(event) {
    if (!state.markerDrag || state.markerDrag.pointerId !== event.pointerId) return;
    if (state.markerDrag.moved) { state.suppressCanvasClick = true; markDirty(); }
    state.markerDrag = null;
  }

  function startViewportPointer(event) {
    if (event.target.closest('.hotspot-marker')) return;
    dom.imageViewport.setPointerCapture(event.pointerId);
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.pointers.size === 1) state.gesture = { x: event.clientX, y: event.clientY, panX: state.panX, panY: state.panY, moved: false, add: state.mode === 'edit' && state.tool === 'add' };
    else if (state.pointers.size === 2) {
      const points = [...state.pointers.values()];
      state.gesture = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), scale: state.scale, pinch: true };
    }
    dom.imageViewport.classList.add('panning');
  }

  function moveViewportPointer(event) {
    if (!state.pointers.has(event.pointerId)) return;
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.pointers.size === 2 && state.gesture) {
      const points = [...state.pointers.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      setZoom(state.gesture.scale * distance / Math.max(1, state.gesture.distance));
    } else if (state.pointers.size === 1 && state.gesture) {
      const dx = event.clientX - state.gesture.x, dy = event.clientY - state.gesture.y;
      if (Math.hypot(dx, dy) > 5) state.gesture.moved = true;
      if ((state.tool === 'pan' || state.mode === 'explore') && state.gesture.moved) { state.panX = state.gesture.panX + dx; state.panY = state.gesture.panY + dy; applyTransform(); }
    }
  }

  function endViewportPointer(event) {
    const gesture = state.gesture;
    if (state.pointers.size === 1 && gesture?.add && !gesture.moved) createHotspotAt(event.clientX, event.clientY);
    state.pointers.delete(event.pointerId); state.gesture = null; dom.imageViewport.classList.remove('panning');
  }

  function safeExternalUrl(value) {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; }
    catch { return '#'; }
  }

  function appendMedia(card, hotspot) {
    if (hotspot.image?.dataUrl || hotspot.image?.src) { const image = document.createElement('img'); image.src = hotspot.image.dataUrl || hotspot.image.src; image.alt = hotspot.imageAlt || hotspot.title; card.appendChild(image); }
    if (hotspot.audio?.dataUrl || hotspot.audio?.src) { const audio = document.createElement('audio'); audio.controls = true; audio.src = hotspot.audio.dataUrl || hotspot.audio.src; card.appendChild(audio); }
    if (hotspot.video?.dataUrl || hotspot.video?.src) { const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.src = hotspot.video.dataUrl || hotspot.video.src; card.appendChild(video); }
    if (hotspot.videoUrl) card.appendChild(externalLink(hotspot.videoUrl, 'Apri il video'));
    if (hotspot.linkUrl) card.appendChild(externalLink(hotspot.linkUrl, hotspot.linkLabel || 'Apri il collegamento'));
  }

  function externalLink(url, label) {
    const anchor = document.createElement('a'); anchor.className = 'external-link'; anchor.href = safeExternalUrl(url); anchor.target = '_blank'; anchor.rel = 'noopener';
    const text = document.createElement('span'); text.textContent = label; const icon = document.createElement('b'); icon.textContent = '↗'; anchor.append(text, icon); return anchor;
  }

  function linkedButton(id, label, className = 'relation-link') {
    const target = activeScene().hotspots.find(h => h.id === id); if (!target) return null;
    const button = document.createElement('button'); button.type = 'button'; button.className = className;
    const text = document.createElement('span'); text.textContent = label; const name = document.createElement('b'); name.textContent = target.title; button.append(text, name); button.addEventListener('click', () => openContent(id)); return button;
  }

  function openContent(id) {
    const hotspot = activeScene().hotspots.find(h => h.id === id); if (!hotspot) return;
    state.selectedId = id; renderHotspots(); dom.contentCard.innerHTML = '';
    const category = document.createElement('div'); category.className = 'category'; category.textContent = hotspot.category;
    const title = document.createElement('h2'); title.textContent = hotspot.title;
    dom.contentCard.append(category, title);
    if (hotspot.shortText) { const lead = document.createElement('p'); lead.className = 'lead'; lead.textContent = hotspot.shortText; dom.contentCard.appendChild(lead); }
    if (hotspot.longText) { const copy = document.createElement('p'); copy.className = 'long-copy'; copy.textContent = hotspot.longText; dom.contentCard.appendChild(copy); }
    appendMedia(dom.contentCard, hotspot);
    if (hotspot.question) {
      const box = document.createElement('div'); box.className = 'question-box'; const question = document.createElement('strong'); question.textContent = hotspot.question; box.appendChild(question);
      if (hotspot.answer) { const reveal = document.createElement('button'); reveal.type = 'button'; reveal.textContent = 'Mostra risposta'; reveal.addEventListener('click', () => { const answer = document.createElement('div'); answer.className = 'answer'; answer.textContent = hotspot.answer; reveal.replaceWith(answer); }); box.appendChild(reveal); }
      dom.contentCard.appendChild(box);
    }
    const child = childSceneFor(hotspot);
    if (child) {
      const enter = document.createElement('button'); enter.type = 'button'; enter.className = 'enter-scene-button';
      const copy = document.createElement('span'); copy.textContent = 'Entra nella scena';
      const name = document.createElement('b'); name.textContent = child.title; enter.append(copy, name);
      enter.addEventListener('click', () => showScene(child.id)); dom.contentCard.appendChild(enter);
    }
    const relations = hotspot.relations.filter(r => activeScene().hotspots.some(h => h.id === r.targetId));
    if (relations.length) {
      const heading = document.createElement('h3'); heading.className = 'relations-heading'; heading.textContent = 'Collegamenti'; dom.contentCard.appendChild(heading);
      relations.forEach(relation => { const button = linkedButton(relation.targetId, relation.label || relation.type); if (button) dom.contentCard.appendChild(button); });
    }
    if (hotspot.previousId || hotspot.nextId) {
      const nav = document.createElement('div'); nav.className = 'path-controls'; const prev = linkedButton(hotspot.previousId, '← Precedente', 'path-button'); const next = linkedButton(hotspot.nextId, 'Successivo →', 'path-button'); if (prev) nav.appendChild(prev); if (next) nav.appendChild(next); dom.contentCard.appendChild(nav);
    }
    safeDialogOpen(dom.contentDialog);
  }

  function sceneSubtreeIds(sceneId, result = new Set()) {
    if (!sceneId || result.has(sceneId)) return result;
    result.add(sceneId);
    const scene = state.project.scenes.find(item => item.id === sceneId);
    scene?.hotspots.forEach(hotspot => { if (hotspot.targetSceneId) sceneSubtreeIds(hotspot.targetSceneId, result); });
    return result;
  }

  function deleteSceneTree(sceneId) {
    const ids = sceneSubtreeIds(sceneId);
    state.project.scenes = state.project.scenes.filter(scene => !ids.has(scene.id));
    state.sceneHistory = state.sceneHistory.filter(id => !ids.has(id));
  }

  async function createChildScene() {
    const hotspot = getSelected(); const file = dom.childSceneImageInput.files?.[0];
    if (!hotspot) return;
    if (childSceneFor(hotspot)) { toast('Questo hotspot contiene già una scena'); return; }
    if (!file) { toast('Scegli l’immagine della nuova scena'); return; }
    if (!ACCEPTED_IMAGES.includes(file.type)) { toast('Formato non compatibile: usa JPG, PNG o WEBP'); return; }
    try {
      const image = await mediaFromFile(file);
      const scene = { id: uid(), title: hotspot.title || 'Nuova scena', description: hotspot.shortText || '', image: { ...image, alt: hotspot.title || 'Scena interna' }, hotspots: [], parentHotspotId: hotspot.id };
      state.project.scenes.push(scene); hotspot.targetSceneId = scene.id; markDirty(); renderInspector(); renderSceneNavigation();
      showScene(scene.id); toast('Scena interna creata: ora aggiungi i suoi hotspot');
    } catch (error) { toast(`Immagine non leggibile: ${error.message}`); }
  }

  function removeChildScene() {
    const hotspot = getSelected(); const child = childSceneFor(hotspot); if (!hotspot || !child) return;
    const nested = sceneSubtreeIds(child.id).size;
    if (!confirm(`Eliminare la scena “${child.title}”${nested > 1 ? ` e le ${nested - 1} scene contenute` : ''}? Gli hotspot interni verranno eliminati.`)) return;
    deleteSceneTree(child.id); hotspot.targetSceneId = ''; markDirty(); renderInspector(); renderSceneNavigation(); toast('Scena interna eliminata');
  }

  async function attachMedia(input, key, label, removeButton) {
    const hotspot = getSelected(); const file = input.files?.[0]; if (!hotspot || !file) return;
    try { hotspot[key] = await mediaFromFile(file); label.textContent = file.name; removeButton.classList.remove('hidden'); input.value = ''; markDirty(); }
    catch (error) { toast(`File non leggibile: ${error.message}`); }
  }

  function removeMedia(key, label, button) { const hotspot = getSelected(); if (!hotspot) return; hotspot[key] = null; label.textContent = 'Nessun file'; button.classList.add('hidden'); markDirty(); }

  async function importProject(file) {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const project = migrateProject(raw);
      project.id = uid(); project.updatedAt = new Date().toISOString();
      await window.ThinkgbDB.save(project); enterEditor(project); toast('Progetto importato');
    } catch (error) { toast(`Importazione non riuscita: ${error.message}`, 5000); }
    finally { dom.projectImportInput.value = ''; }
  }

  function demoImage() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#d7c7aa"/><stop offset="1" stop-color="#a9c2b1"/></linearGradient><filter id="n"><feTurbulence baseFrequency=".8" numOctaves="3" stitchTiles="stitch" type="fractalNoise"/><feBlend mode="multiply" in2="SourceGraphic"/></filter></defs><rect width="1600" height="1000" fill="url(#g)"/><path d="M160 740 Q340 470 530 570 T865 475 T1310 330" fill="none" stroke="#526d60" stroke-width="80" opacity=".3"/><g fill="#f0e6cf" stroke="#5a635c" stroke-width="8"><path d="M120 710 470 415 750 695Z"/><path d="M850 640 1090 350 1340 655Z"/><rect x="285" y="605" width="300" height="180"/><rect x="1000" y="610" width="240" height="150"/></g><g fill="#344f47"><circle cx="240" cy="300" r="100"/><circle cx="1360" cy="770" r="130"/></g><text x="90" y="120" fill="#253b35" font-family="Georgia" font-size="70">Una città, tre sguardi</text><text x="95" y="182" fill="#53675f" font-family="sans-serif" font-size="28">Esempio dimostrativo thinkgbLink</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function demoDetailImage() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#17322d"/><circle cx="450" cy="260" r="150" fill="#e5a02d"/><path d="M310 260h280M450 120v280" stroke="#fff" stroke-width="18" opacity=".8"/><text x="450" y="475" text-anchor="middle" fill="#fff" font-family="Georgia" font-size="42">osservare significa collegare</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function demoInnerImage() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900"><rect width="1400" height="900" fill="#17322d"/><path d="M120 690 Q370 180 680 420 T1280 230" fill="none" stroke="#e5a02d" stroke-width="95" opacity=".38"/><g fill="#eef3ea"><circle cx="390" cy="310" r="125"/><rect x="780" y="210" width="360" height="390" rx="36"/></g><text x="90" y="790" fill="#fff" font-family="Georgia" font-size="62">Dentro la piazza</text><text x="95" y="845" fill="#bcd0c8" font-family="sans-serif" font-size="27">Una seconda scena può contenere nuovi hotspot</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function buildDemo() {
    const now = new Date().toISOString();
    const ids = [uid(), uid(), uid(), uid(), uid()];
    const rootSceneId = uid(), childSceneId = uid();
    const rootHotspots = [
      normalizeHotspot({ id: ids[0], x: 31, y: 58, title: 'La piazza', category: 'luogo', style: 'number', number: 1, shortText: 'La piazza non è uno spazio vuoto: organizza gli incontri.', longText: 'Apri questo hotspot e poi entra nella scena interna: troverai una nuova immagine con altri punti da esplorare.', targetSceneId: childSceneId, nextId: ids[1], relations: [{ targetId: ids[2], type: 'collega', label: 'Dal luogo all’idea' }] }, 0),
      normalizeHotspot({ id: ids[1], x: 67, y: 51, title: 'Guardare da vicino', category: 'documento', style: 'number', number: 2, shortText: 'Un dettaglio cambia il significato dell’insieme.', image: { name: 'dettaglio.svg', type: 'image/svg+xml', dataUrl: demoDetailImage() }, imageAlt: 'Segno circolare attraversato da due assi', previousId: ids[0], nextId: ids[2] }, 1),
      normalizeHotspot({ id: ids[2], x: 78, y: 75, title: 'La relazione', category: 'concetto', style: 'number', number: 3, shortText: 'I punti acquistano senso quando diventano un percorso.', question: 'Che cosa cambia quando scegli tu l’ordine degli hotspot?', answer: 'L’immagine smette di imporre una sola lettura e diventa uno spazio argomentativo.', previousId: ids[1], relations: [{ targetId: ids[0], type: 'ritorna', label: 'Ricomincia dalla piazza' }] }, 2)
    ];
    const childHotspots = [
      normalizeHotspot({ id: ids[3], x: 28, y: 38, title: 'Il centro dell’incontro', category: 'concetto', style: 'number', number: 1, shortText: 'Ogni scena interna è una nuova superficie autonoma.', nextId: ids[4] }, 0),
      normalizeHotspot({ id: ids[4], x: 73, y: 48, title: 'Un altro livello', category: 'domanda', style: 'number', number: 2, shortText: 'Da qui potresti creare una terza scena.', question: 'Quanto può diventare profondo il percorso?', answer: 'Non c’è un limite prefissato: ogni hotspot può aprire una scena ulteriore.', previousId: ids[3] }, 1)
    ];
    return {
      version: FORMAT_VERSION, id: uid(), title: 'Una città, più livelli', description: 'Un esempio con una scena principale e una scena annidata.', rootSceneId,
      scenes: [
        { id: rootSceneId, title: 'Una città, più livelli', description: 'Scena principale', image: { name: 'citta-esempio.svg', type: 'image/svg+xml', dataUrl: demoImage(), alt: 'Paesaggio urbano stilizzato con edifici e un corso d’acqua' }, hotspots: rootHotspots, parentHotspotId: '' },
        { id: childSceneId, title: 'Dentro la piazza', description: 'Scena interna raggiunta dalla piazza', image: { name: 'piazza-interna.svg', type: 'image/svg+xml', dataUrl: demoInnerImage(), alt: 'Composizione astratta che rappresenta l’interno della piazza' }, hotspots: childHotspots, parentHotspotId: ids[0] }
      ],
      settings: { guidedMode: true }, createdAt: now, updatedAt: now,
    };
  }

  async function loadDemo() { const project = buildDemo(); await window.ThinkgbDB.save(project); enterEditor(project); toast('Esempio copiato tra i tuoi progetti'); }

  async function exportViewer() {
    if (!state.project) return;
    if (!allHotspots().length) { toast('Aggiungi almeno un hotspot prima di esportare il Viewer'); return; }
    const buttonText = dom.exportViewerButton.textContent; dom.exportViewerButton.disabled = true; dom.exportViewerButton.textContent = 'Preparazione…';
    try { await saveProject(false); const result = await window.ThinkgbExporter.buildViewerZip(state.project); window.ThinkgbExporter.download(result.blob, result.filename); toast('Viewer ZIP creato'); }
    catch (error) { toast(`Esportazione Viewer non riuscita: ${error.message}`, 5000); }
    finally { dom.exportViewerButton.disabled = false; dom.exportViewerButton.textContent = buttonText; }
  }

  function openSettings() {
    const scene = activeScene(); if (!scene) return;
    state.replacementImage = null; dom.replaceImageName.textContent = 'Mantieni l’attuale'; dom.replaceImageInput.value = '';
    const isRoot = scene.id === state.project.rootSceneId;
    dom.settingsEyebrow.textContent = isRoot ? 'SCENA PRINCIPALE' : 'SCENA INTERNA';
    dom.settingsTitle.textContent = isRoot ? 'Impostazioni progetto' : 'Impostazioni scena';
    setNamed(dom.settingsForm, 'title', isRoot ? state.project.title : scene.title); setNamed(dom.settingsForm, 'description', isRoot ? state.project.description : scene.description); setNamed(dom.settingsForm, 'imageAlt', scene.image?.alt); setNamed(dom.settingsForm, 'guidedMode', state.project.settings?.guidedMode);
    safeDialogOpen(dom.settingsDialog);
  }

  function bindEvents() {
    document.querySelectorAll('.dialog [value="cancel"]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault(); safeDialogClose(button.closest('dialog'));
    }));
    dom.newProjectButton.addEventListener('click', () => { dom.newProjectForm.reset(); dom.mainImageFileName.textContent = 'Nessun file selezionato'; safeDialogOpen(dom.newProjectDialog); });
    dom.openProjectButton.addEventListener('click', async () => { await renderProjectCollections(); safeDialogOpen(dom.openProjectDialog); });
    dom.closeOpenDialog.addEventListener('click', () => safeDialogClose(dom.openProjectDialog));
    dom.importProjectButton.addEventListener('click', () => dom.projectImportInput.click()); dom.projectImportInput.addEventListener('change', () => importProject(dom.projectImportInput.files?.[0]));
    dom.loadDemoButton.addEventListener('click', loadDemo); dom.guideButton.addEventListener('click', () => safeDialogOpen(dom.guideDialog)); dom.closeGuideButton.addEventListener('click', () => safeDialogClose(dom.guideDialog));
    dom.newProjectForm.elements.image.addEventListener('change', event => { dom.mainImageFileName.textContent = event.target.files?.[0]?.name || 'Nessun file selezionato'; });
    dom.newProjectForm.addEventListener('submit', async event => {
      event.preventDefault();
      const data = new FormData(dom.newProjectForm), file = data.get('image');
      if (!(file instanceof File) || !file.size) { toast('Scegli un’immagine'); return; }
      if (!ACCEPTED_IMAGES.includes(file.type)) { toast('Formato non compatibile: usa JPG, PNG o WEBP'); return; }
      try { const image = await mediaFromFile(file); const project = makeProject({ title: data.get('title'), description: data.get('description'), image, imageAlt: data.get('imageAlt') }); await window.ThinkgbDB.save(project); safeDialogClose(dom.newProjectDialog); enterEditor(project); }
      catch (error) { toast(`Creazione non riuscita: ${error.message}`, 4500); }
    });
    dom.homeButton.addEventListener('click', goHome); dom.saveButton.addEventListener('click', () => saveProject()); dom.mobileSave.addEventListener('click', () => { saveProject(); dom.mobileActions.classList.add('hidden'); });
    dom.exportProjectButton.addEventListener('click', () => { if (state.project) window.ThinkgbExporter.exportProject(state.project); }); dom.mobileExportProject.addEventListener('click', () => { if (state.project) window.ThinkgbExporter.exportProject(state.project); dom.mobileActions.classList.add('hidden'); });
    dom.exportViewerButton.addEventListener('click', exportViewer); dom.mobileExportViewer.addEventListener('click', () => { exportViewer(); dom.mobileActions.classList.add('hidden'); });
    dom.mobileMenuButton.addEventListener('click', () => dom.mobileActions.classList.toggle('hidden'));
    dom.editModeButton.addEventListener('click', () => { state.mode = 'edit'; dom.editorView.classList.remove('explore'); dom.editModeButton.classList.add('active'); dom.exploreModeButton.classList.remove('active'); safeDialogClose(dom.contentDialog); renderHotspots(); });
    dom.exploreModeButton.addEventListener('click', () => { state.mode = 'explore'; dom.editorView.classList.add('explore'); dom.exploreModeButton.classList.add('active'); dom.editModeButton.classList.remove('active'); closeInspector(); closeSidebar(); renderHotspots(); });
    dom.addToolButton.addEventListener('click', () => setTool('add')); dom.panToolButton.addEventListener('click', () => setTool('pan'));
    dom.backSceneButton.addEventListener('click', goBackScene);
    dom.zoomInButton.addEventListener('click', () => setZoom(state.scale + .25)); dom.zoomOutButton.addEventListener('click', () => setZoom(state.scale - .25)); dom.resetViewButton.addEventListener('click', resetView);
    dom.mainImage.addEventListener('load', fitImage); window.addEventListener('resize', () => { if (state.project) fitImage(); });
    dom.imageViewport.addEventListener('wheel', event => { event.preventDefault(); setZoom(state.scale * (event.deltaY < 0 ? 1.12 : .89), event.clientX, event.clientY); }, { passive: false });
    dom.imageViewport.addEventListener('pointerdown', startViewportPointer); dom.imageViewport.addEventListener('pointermove', moveViewportPointer); dom.imageViewport.addEventListener('pointerup', endViewportPointer); dom.imageViewport.addEventListener('pointercancel', endViewportPointer);
    window.addEventListener('pointermove', moveMarker); window.addEventListener('pointerup', endMarkerDrag); window.addEventListener('pointercancel', endMarkerDrag);
    dom.hotspotSearch.addEventListener('input', renderHotspotList); dom.openSidebarButton.addEventListener('click', () => dom.projectSidebar.classList.add('open')); dom.closeSidebarButton.addEventListener('click', closeSidebar); dom.closeInspectorButton.addEventListener('click', closeInspector);
    dom.hotspotForm.addEventListener('input', updateHotspotFromForm); dom.hotspotForm.addEventListener('change', updateHotspotFromForm);
    dom.hotspotImageInput.addEventListener('change', () => attachMedia(dom.hotspotImageInput, 'image', dom.imageFileName, dom.removeHotspotImage)); dom.hotspotAudioInput.addEventListener('change', () => attachMedia(dom.hotspotAudioInput, 'audio', dom.audioFileName, dom.removeHotspotAudio)); dom.hotspotVideoInput.addEventListener('change', () => attachMedia(dom.hotspotVideoInput, 'video', dom.videoFileName, dom.removeHotspotVideo));
    dom.removeHotspotImage.addEventListener('click', () => removeMedia('image', dom.imageFileName, dom.removeHotspotImage)); dom.removeHotspotAudio.addEventListener('click', () => removeMedia('audio', dom.audioFileName, dom.removeHotspotAudio)); dom.removeHotspotVideo.addEventListener('click', () => removeMedia('video', dom.videoFileName, dom.removeHotspotVideo));
    dom.childSceneImageInput.addEventListener('change', () => { dom.childSceneImageName.textContent = dom.childSceneImageInput.files?.[0]?.name || 'Nessun file'; });
    dom.createChildSceneButton.addEventListener('click', createChildScene);
    dom.enterChildSceneButton.addEventListener('click', () => { const child = childSceneFor(getSelected()); if (child) showScene(child.id); });
    dom.removeChildSceneButton.addEventListener('click', removeChildScene);
    dom.addRelationButton.addEventListener('click', () => { const hotspot = getSelected(); if (!hotspot || !dom.relationTarget.value) { toast('Scegli l’hotspot da collegare'); return; } if (hotspot.relations.some(r => r.targetId === dom.relationTarget.value)) { toast('Questo collegamento esiste già'); return; } hotspot.relations.push({ targetId: dom.relationTarget.value, type: dom.relationType.value, label: dom.relationLabel.value.trim() }); dom.relationLabel.value = ''; markDirty(); renderRelations(hotspot); });
    dom.duplicateHotspotButton.addEventListener('click', () => { const hotspot = getSelected(); if (!hotspot) return; const copy = clone(hotspot); copy.id = uid(); copy.title = `${hotspot.title} — copia`; copy.x = Math.min(98, copy.x + 3); copy.y = Math.min(98, copy.y + 3); copy.targetSceneId = ''; copy.previousId = ''; copy.nextId = ''; copy.relations = []; activeScene().hotspots.push(copy); state.selectedId = copy.id; markDirty(); renderSceneNavigation(); renderHotspots(); renderHotspotList(); renderInspector(); });
    dom.deleteHotspotButton.addEventListener('click', () => {
      const hotspot = getSelected(); if (!hotspot) return;
      const child = childSceneFor(hotspot); const nested = child ? sceneSubtreeIds(child.id).size : 0;
      const warning = nested ? ` Verranno eliminate anche ${nested} scene interne e tutti i loro hotspot.` : '';
      if (!confirm(`Eliminare l’hotspot “${hotspot.title}”?${warning}`)) return;
      if (child) deleteSceneTree(child.id);
      const scene = activeScene(); scene.hotspots = scene.hotspots.filter(h => h.id !== hotspot.id); scene.hotspots.forEach(h => { if (h.previousId === hotspot.id) h.previousId = ''; if (h.nextId === hotspot.id) h.nextId = ''; h.relations = h.relations.filter(r => r.targetId !== hotspot.id); });
      state.selectedId = null; closeInspector(); markDirty(); renderSceneNavigation(); renderHotspots(); renderHotspotList(); renderInspector();
    });
    dom.projectSettingsButton.addEventListener('click', openSettings);
    dom.replaceImageInput.addEventListener('change', async () => { const file = dom.replaceImageInput.files?.[0]; if (!file) return; if (!ACCEPTED_IMAGES.includes(file.type)) { toast('Usa JPG, PNG o WEBP'); dom.replaceImageInput.value = ''; return; } state.replacementImage = await mediaFromFile(file); dom.replaceImageName.textContent = file.name; });
    dom.settingsForm.addEventListener('submit', event => {
      event.preventDefault(); const data = new FormData(dom.settingsForm); const scene = activeScene(); const isRoot = scene.id === state.project.rootSceneId;
      scene.title = slugText(data.get('title')) || (isRoot ? 'Senza titolo' : 'Scena interna'); scene.description = String(data.get('description') || ''); scene.image.alt = String(data.get('imageAlt') || '');
      if (isRoot) { state.project.title = scene.title; state.project.description = scene.description; dom.projectTitleDisplay.textContent = state.project.title; }
      state.project.settings.guidedMode = data.get('guidedMode') === 'on';
      if (state.replacementImage) { scene.image = { ...state.replacementImage, alt: scene.image.alt }; dom.mainImage.src = scene.image.dataUrl; dom.mainImage.alt = scene.image.alt || scene.title; }
      markDirty(); renderSceneNavigation(); safeDialogClose(dom.settingsDialog);
    });
    dom.closeContentButton.addEventListener('click', () => safeDialogClose(dom.contentDialog)); dom.contentDialog.addEventListener('click', event => { if (event.target === dom.contentDialog) safeDialogClose(dom.contentDialog); });
    window.addEventListener('beforeunload', event => { if (!state.dirty) return; event.preventDefault(); event.returnValue = ''; });
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); state.installPrompt = event; dom.installButton.classList.remove('hidden'); });
    dom.installButton.addEventListener('click', async () => { if (!state.installPrompt) { toast('Su iPad usa Condividi → Aggiungi alla schermata Home'); return; } state.installPrompt.prompt(); await state.installPrompt.userChoice; state.installPrompt = null; dom.installButton.classList.add('hidden'); });
  }

  async function init() {
    cacheDom(); bindEvents(); await renderProjectCollections();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', init);
})();
