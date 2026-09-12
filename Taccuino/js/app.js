(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const state = { noteId: null, noteCreatedAt: null, noteDirty: false, drawingId: null, drawingCreatedAt: null };
  let pad;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    pad = new window.DrawingPad($('#drawingCanvas'), $('#canvasShell'));
    pad.onHistoryChange = ({ canUndo, canRedo }) => {
      $('#undoBtn').disabled = !canUndo;
      $('#redoBtn').disabled = !canRedo;
    };
    pad.onDirtyChange = (dirty) => setDrawingStatus(dirty ? 'Modifiche non salvate' : '');
    pad.notifyHistory();
    bindNavigation();
    bindNotes();
    bindDrawing();
    bindArchive();
    registerServiceWorker();
    try { await window.TaccuinoStorage.openDB(); }
    catch (error) { setNoteStatus(error.message); }
  }

  function bindNavigation() {
    $$('.tab').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  }

  function switchView(name) {
    const views = { notes: $('#notesView'), drawing: $('#drawingView'), archive: $('#archiveView') };
    if (!views[name]) return;
    Object.entries(views).forEach(([key, view]) => {
      const active = key === name;
      view.hidden = !active;
      view.classList.toggle('active', active);
    });
    $$('.tab').forEach((button) => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (name === 'drawing') requestAnimationFrame(() => pad.resize(false));
    else if (name === 'archive') renderArchive();
  }

  function bindNotes() {
    $('#noteText').addEventListener('input', markNoteDirty);
    $('#noteTitle').addEventListener('input', markNoteDirty);
    $('#saveNoteBtn').addEventListener('click', saveNote);
    $('#newNoteBtn').addEventListener('click', newNote);
    $('#openNoteBtn').addEventListener('click', () => $('#openNoteInput').click());
    $('#openNoteInput').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (file) await openTextFile(file);
    });
    $('#importTextBtn').addEventListener('click', () => $('#importTextInput').click());
    $('#importTextInput').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (file) await importTextFile(file);
    });
  }

  function markNoteDirty() {
    state.noteDirty = true;
    setNoteStatus('Modifiche non salvate');
  }

  async function saveNote() {
    const content = $('#noteText').value;
    const title = $('#noteTitle').value.trim() || defaultExportName('appunto');
    try {
      const record = await window.TaccuinoStorage.savePage({
        id: state.noteId, createdAt: state.noteCreatedAt, title, type: 'text', content
      });
      state.noteId = record.id;
      state.noteCreatedAt = record.createdAt;
      state.noteDirty = false;
      $('#noteTitle').value = record.title;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const result = await saveBlobToDevice(blob, `${sanitizeFilename(record.title)}.txt`, {
        description: 'File di testo', mime: 'text/plain', extensions: ['.txt']
      });
      setNoteStatus(result === 'cancelled'
        ? 'Salvato nell’archivio · file TXT non scaricato'
        : `Salvato · ${formatTime(record.updatedAt)} · file TXT creato`);
    } catch (error) {
      setNoteStatus(`Salvataggio non riuscito: ${friendlyError(error)}`);
    }
  }

  function newNote() {
    if (state.noteDirty && !window.confirm('Creare un nuovo appunto e perdere le modifiche non salvate?')) return;
    state.noteId = null;
    state.noteCreatedAt = null;
    state.noteDirty = false;
    $('#noteTitle').value = '';
    $('#noteText').value = '';
    setNoteStatus('');
    $('#noteText').focus({ preventScroll: true });
  }

  async function openTextFile(file) {
    if (!isTextFile(file)) return setNoteStatus('Il file selezionato non è un file di testo.');
    if (state.noteDirty && !window.confirm('Aprire il file e sostituire l’appunto con modifiche non salvate?')) return;
    try {
      const text = await file.text();
      state.noteId = null;
      state.noteCreatedAt = null;
      state.noteDirty = false;
      $('#noteTitle').value = filenameWithoutExtension(file.name) || 'Appunto';
      $('#noteText').value = text;
      setNoteStatus(`Aperto dal dispositivo · ${file.name}`);
    } catch (error) {
      setNoteStatus(`Apertura non riuscita: ${friendlyError(error)}`);
    }
  }

  async function importTextFile(file) {
    if (!isTextFile(file)) return setNoteStatus('Il file selezionato non è un file di testo.');
    try {
      const imported = await file.text();
      const textarea = $('#noteText');
      const start = Number.isInteger(textarea.selectionStart) ? textarea.selectionStart : textarea.value.length;
      const end = Number.isInteger(textarea.selectionEnd) ? textarea.selectionEnd : start;
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);
      const separator = before && !before.endsWith('\n') ? '\n' : '';
      textarea.value = before + separator + imported + after;
      if (!$('#noteTitle').value.trim() && file.name) $('#noteTitle').value = filenameWithoutExtension(file.name);
      state.noteDirty = true;
      setNoteStatus(`Testo importato · ${file.name}`);
      textarea.focus({ preventScroll: true });
    } catch (error) {
      setNoteStatus(`Importazione non riuscita: ${friendlyError(error)}`);
    }
  }

  function bindDrawing() {
    $$('.color-dot').forEach((button) => button.addEventListener('click', () => {
      $$('.color-dot').forEach((b) => b.classList.remove('selected'));
      button.classList.add('selected');
      pad.setColor(button.dataset.color);
      setTool('pen');
    }));
    $$('.widths .tool-btn').forEach((button) => button.addEventListener('click', () => {
      $$('.widths .tool-btn').forEach((b) => b.classList.remove('selected'));
      button.classList.add('selected');
      pad.setWidth(button.dataset.width);
    }));
    $('#penBtn').addEventListener('click', () => setTool('pen'));
    $('#eraserBtn').addEventListener('click', () => setTool('eraser'));
    $('#undoBtn').addEventListener('click', () => pad.undo());
    $('#redoBtn').addEventListener('click', () => pad.redo());
    $('#clearCanvasBtn').addEventListener('click', () => { if (window.confirm('Cancellare completamente il foglio?')) pad.clear(true); });
    $('#newDrawingBtn').addEventListener('click', newDrawing);
    $('#saveDrawingBtn').addEventListener('click', saveDrawing);
    $('#exportJpgBtn').addEventListener('click', exportJpg);
    $('#drawingTitle').addEventListener('input', () => pad.setDirty(true));
    $('#openDrawingBtn').addEventListener('click', () => $('#openDrawingInput').click());
    $('#openDrawingInput').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (file) await openDrawingFile(file);
    });
    $('#importImageBtn').addEventListener('click', () => $('#importImageInput').click());
    $('#importImageInput').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (file) await importImageFile(file);
    });
  }

  function setTool(tool) {
    pad.setTool(tool);
    const pen = tool === 'pen';
    $('#penBtn').classList.toggle('selected', pen);
    $('#eraserBtn').classList.toggle('selected', !pen);
    $('#penBtn').setAttribute('aria-pressed', String(pen));
    $('#eraserBtn').setAttribute('aria-pressed', String(!pen));
  }

  async function saveDrawing() {
    const title = $('#drawingTitle').value.trim() || defaultExportName('disegno');
    const now = new Date().toISOString();
    try {
      const record = await window.TaccuinoStorage.savePage({
        id: state.drawingId, createdAt: state.drawingCreatedAt, title, type: 'drawing', content: pad.snapshot()
      });
      state.drawingId = record.id;
      state.drawingCreatedAt = record.createdAt;
      $('#drawingTitle').value = record.title;
      pad.setDirty(false);
      const documentData = {
        format: 'gbprof-taccuino', version: 1, type: 'drawing', title: record.title,
        createdAt: record.createdAt, updatedAt: record.updatedAt || now, image: record.content
      };
      const blob = new Blob([JSON.stringify(documentData, null, 2)], { type: 'application/json;charset=utf-8' });
      const result = await saveBlobToDevice(blob, `${sanitizeFilename(record.title)}.json`, {
        description: 'Disegno Taccuino', mime: 'application/json', extensions: ['.json']
      });
      setDrawingStatus(result === 'cancelled'
        ? 'Salvato nell’archivio · file JSON non scaricato'
        : `Salvato · ${formatTime(record.updatedAt)} · file JSON creato`);
    } catch (error) {
      setDrawingStatus(`Salvataggio non riuscito: ${friendlyError(error)}`);
    }
  }

  function newDrawing() {
    if (pad.dirty && !window.confirm('Creare un nuovo disegno e perdere le modifiche non salvate?')) return;
    state.drawingId = null;
    state.drawingCreatedAt = null;
    $('#drawingTitle').value = '';
    pad.newPage();
    setDrawingStatus('');
  }

  async function openDrawingFile(file) {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      return setDrawingStatus('Seleziona un file JSON creato da Taccuino.');
    }
    if (pad.dirty && !window.confirm('Aprire il file e sostituire il disegno con modifiche non salvate?')) return;
    try {
      const data = JSON.parse(await file.text());
      const image = data && (data.image || data.content);
      const validFormat = data && (data.format === 'gbprof-taccuino' || data.type === 'drawing');
      if (!validFormat || typeof image !== 'string' || !image.startsWith('data:image/')) {
        throw new Error('Il JSON non contiene un disegno Taccuino valido.');
      }
      switchView('drawing');
      requestAnimationFrame(async () => {
        try {
          pad.resize(false);
          await pad.load(image);
          state.drawingId = null;
          state.drawingCreatedAt = data.createdAt || null;
          $('#drawingTitle').value = data.title || filenameWithoutExtension(file.name) || 'Disegno';
          setDrawingStatus(`Aperto dal dispositivo · ${file.name}`);
        } catch (error) { setDrawingStatus(`Apertura non riuscita: ${friendlyError(error)}`); }
      });
    } catch (error) {
      setDrawingStatus(`Apertura non riuscita: ${friendlyError(error)}`);
    }
  }

  async function importImageFile(file) {
    if (!file.type.startsWith('image/')) return setDrawingStatus('Seleziona un file immagine PNG, JPG, WEBP o GIF.');
    try {
      const dataUrl = await fileToDataUrl(file);
      await pad.importImage(dataUrl);
      if (!$('#drawingTitle').value.trim()) $('#drawingTitle').value = filenameWithoutExtension(file.name) || 'Disegno';
      setDrawingStatus(`Immagine importata · ${file.name}`);
    } catch (error) {
      setDrawingStatus(`Importazione non riuscita: ${friendlyError(error)}`);
    }
  }

  async function exportJpg() {
    const title = $('#drawingTitle').value.trim() || defaultExportName('disegno');
    try {
      const blob = await dataUrlToBlob(pad.exportJpeg(0.94));
      const result = await saveBlobToDevice(blob, `${sanitizeFilename(title)}.jpg`, {
        description: 'Immagine JPEG', mime: 'image/jpeg', extensions: ['.jpg', '.jpeg']
      });
      setDrawingStatus(result === 'cancelled' ? 'Salvataggio JPG annullato' : 'Immagine JPG salvata sul dispositivo');
    } catch (error) {
      setDrawingStatus(`JPG non salvato: ${friendlyError(error)}`);
    }
  }

  function bindArchive() { $('#refreshArchiveBtn').addEventListener('click', renderArchive); }

  async function renderArchive() {
    const list = $('#archiveList');
    const empty = $('#archiveEmpty');
    list.replaceChildren();
    try {
      const pages = await window.TaccuinoStorage.listPages();
      empty.hidden = pages.length !== 0;
      for (const page of pages) {
        const item = document.createElement('article');
        item.className = 'archive-item';
        const info = document.createElement('div');
        const title = document.createElement('p');
        title.className = 'archive-title';
        title.textContent = page.title;
        const meta = document.createElement('div');
        meta.className = 'archive-meta';
        meta.textContent = `${page.type === 'drawing' ? 'Disegno' : 'Testo'} · modificato ${formatDateTime(page.updatedAt)}`;
        info.append(title, meta);
        const actions = document.createElement('div');
        actions.className = 'archive-actions';
        actions.append(
          archiveButton('Apri', () => openPage(page.id)),
          archiveButton('Rinomina', () => renamePage(page.id, page.title)),
          archiveButton('Elimina', () => removePage(page.id, page.title), 'delete')
        );
        item.append(info, actions);
        list.append(item);
      }
    } catch (error) {
      empty.hidden = false;
      empty.textContent = `Archivio non disponibile: ${error.message}`;
    }
  }

  function archiveButton(label, handler, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${extraClass}`.trim();
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  async function openPage(id) {
    const page = await window.TaccuinoStorage.getPage(id);
    if (!page) return;
    if (page.type === 'drawing') {
      state.drawingId = page.id;
      state.drawingCreatedAt = page.createdAt;
      $('#drawingTitle').value = page.title;
      switchView('drawing');
      requestAnimationFrame(async () => {
        pad.resize(false);
        await pad.load(page.content);
        setDrawingStatus(`Aperto · ${formatDateTime(page.updatedAt)}`);
      });
    } else {
      state.noteId = page.id;
      state.noteCreatedAt = page.createdAt;
      state.noteDirty = false;
      $('#noteTitle').value = page.title;
      $('#noteText').value = page.content || '';
      switchView('notes');
      setNoteStatus(`Aperto · ${formatDateTime(page.updatedAt)}`);
    }
  }

  async function renamePage(id, currentTitle) {
    const next = window.prompt('Nuovo titolo:', currentTitle);
    if (next === null || !next.trim()) return;
    await window.TaccuinoStorage.renamePage(id, next.trim());
    if (state.noteId === id) $('#noteTitle').value = next.trim();
    if (state.drawingId === id) $('#drawingTitle').value = next.trim();
    await renderArchive();
  }

  async function removePage(id, title) {
    if (!window.confirm(`Eliminare “${title}”?`)) return;
    await window.TaccuinoStorage.deletePage(id);
    if (state.noteId === id) newNoteAfterDelete();
    if (state.drawingId === id) newDrawingAfterDelete();
    await renderArchive();
  }

  function newNoteAfterDelete() {
    state.noteId = null;
    state.noteCreatedAt = null;
    state.noteDirty = false;
    $('#noteTitle').value = '';
    $('#noteText').value = '';
  }

  function newDrawingAfterDelete() {
    state.drawingId = null;
    state.drawingCreatedAt = null;
    $('#drawingTitle').value = '';
    pad.newPage();
  }

  async function saveBlobToDevice(blob, suggestedFilename, typeInfo) {
    const filename = askFilename(suggestedFilename, typeInfo.extensions);
    if (!filename) return 'cancelled';

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: typeInfo.description, accept: { [typeInfo.mime]: typeInfo.extensions } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return 'saved';
      } catch (error) {
        if (error && error.name === 'AbortError') return 'cancelled';
        console.warn('File picker non disponibile, uso un metodo alternativo:', error);
      }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS && typeof File !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: blob.type || typeInfo.mime });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
          return 'saved';
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return 'cancelled';
        console.warn('Condivisione file non disponibile, uso il download classico:', error);
      }
    }

    downloadBlob(blob, filename);
    return 'saved';
  }

  function askFilename(suggestedFilename, extensions) {
    const preferredExtension = (extensions && extensions[0]) || '';
    const suggestedBase = filenameWithoutExtension(suggestedFilename) || 'taccuino';
    const answer = window.prompt('Nome del file da salvare:', suggestedBase);
    if (answer === null) return null;
    let base = String(answer).trim();
    if (!base) return null;
    for (const ext of (extensions || [])) {
      if (base.toLowerCase().endsWith(ext.toLowerCase())) {
        base = base.slice(0, -ext.length);
        break;
      }
    }
    base = sanitizeFilename(base);
    return `${base}${preferredExtension}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const header = parts[0] || '';
    const payload = parts[1] || '';
    const match = header.match(/data:([^;]+);base64/i);
    const mime = match ? match[1] : 'application/octet-stream';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File non leggibile.'));
      reader.readAsDataURL(file);
    });
  }

  function isTextFile(file) {
    return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') || file.type === '';
  }

  function filenameWithoutExtension(name) {
    return String(name || '').replace(/\.[^.]+$/, '').trim();
  }

  function sanitizeFilename(name) {
    return (name || 'taccuino')
      .normalize('NFKD')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'taccuino';
  }

  function defaultExportName(prefix) {
    const now = new Date();
    const p = (value) => String(value).padStart(2, '0');
    return `${prefix}-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`;
  }

  function formatTime(iso) {
    return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }

  function formatDateTime(iso) {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(iso));
  }

  function friendlyError(error) { return error && error.message ? error.message : 'errore sconosciuto'; }
  function setNoteStatus(text) { $('#noteStatus').textContent = text || ''; }
  function setDrawingStatus(text) { $('#drawingStatus').textContent = text || ''; }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch((error) => {
        console.warn('Service worker non registrato:', error);
      });
    }, { once: true });
  }
})();
