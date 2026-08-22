import { db, uid } from "./db.js";
import { importFiles, kindFor, itemGlyph, describeItem, collectDescendantIds } from "./files.js";
import { PrivateViewer } from "./viewer.js";
import { LimController } from "./lim-controller.js";
import { createLesson, duplicateLesson, addItemToLesson, removeItemFromLesson, moveLessonItem } from "./lessons.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const elements = {
  workspace: $("#workspace"), deskPane: $("#deskPane"), splitter: $("#splitter"), viewerPane: $("#viewerPane"), viewerBody: $("#viewerBody"), viewerToolbar: $("#viewerToolbar"),
  items: $("#itemsView"), empty: $("#emptyState"), count: $("#itemCount"), title: $("#viewTitle"), breadcrumbs: $("#breadcrumbs"), search: $("#searchInput"), sort: $("#sortSelect"),
  context: $("#contextMenu"), toast: $("#toast"), limStatus: $("#limStatus"), limDot: $("#limDot"), limMonitorDot: $("#limMonitorDot"), limNow: $("#limNow"), limPreview: $("#limPreview"),
  lessonBar: $("#lessonBar"), lessonTitle: $("#lessonTitle"), lessonCounter: $("#lessonCounter")
};

const state = {
  items: [], lessons: [], settings: {}, currentFolder: "root", currentSpace: "all", selectedId: null,
  history: ["root"], historyIndex: 0, viewMode: "grid", search: "", sort: "name", contextId: null,
  lesson: null, lessonIndex: 0
};

const viewer = new PrivateViewer({
  pane: elements.viewerPane, body: elements.viewerBody, toolbar: elements.viewerToolbar,
  title: $("#viewerTitle"), type: $("#viewerType"),
  onState: async (item, viewState) => { item.viewState = viewState; await db.putItem(item); }
});
const lim = new LimController();

function toast(message, duration = 2500) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => elements.toast.classList.remove("show"), duration);
}

function applyTheme(theme = "auto") {
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = theme;
}

async function refresh() {
  [state.items, state.lessons] = await Promise.all([db.allItems(), db.allLessons()]);
  render();
}

function currentItem() { return state.items.find(item => item.id === viewer.item?.id); }
function byId(id) { return state.items.find(item => item.id === id); }

function filteredItems() {
  let list;
  if (state.currentSpace === "favorites") list = state.items.filter(item => item.starred);
  else if (state.currentSpace === "recent") list = state.items.filter(item => item.lastOpenedAt).sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 40);
  else list = state.items.filter(item => item.parentId === state.currentFolder);
  const query = state.search.trim().toLocaleLowerCase("it");
  if (query) list = state.items.filter(item => item.name.toLocaleLowerCase("it").includes(query));
  const factor = state.sort === "date" || state.sort === "size" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (!query && state.currentSpace === "all" && a.type !== b.type) return a.type === "folder" ? -1 : 1;
    if (state.sort === "date") return factor * ((a.modifiedAt || 0) - (b.modifiedAt || 0));
    if (state.sort === "size") return factor * ((a.size || 0) - (b.size || 0));
    if (state.sort === "type") return kindFor(a).localeCompare(kindFor(b), "it") || a.name.localeCompare(b.name, "it", { numeric: true });
    return a.name.localeCompare(b.name, "it", { numeric: true, sensitivity: "base" });
  });
}

function buildBreadcrumbs() {
  elements.breadcrumbs.replaceChildren();
  const chain = [];
  let id = state.currentFolder;
  while (id && id !== "root") {
    const folder = byId(id);
    if (!folder) break;
    chain.unshift(folder); id = folder.parentId;
  }
  const root = document.createElement("button"); root.type = "button"; root.dataset.folder = "root"; root.textContent = "Desk"; elements.breadcrumbs.append(root);
  for (const folder of chain) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.folder = folder.id; button.textContent = folder.name; elements.breadcrumbs.append(button);
  }
}

function render() {
  const list = filteredItems();
  elements.items.replaceChildren();
  elements.items.className = state.viewMode === "list" ? "items-grid list" : "items-grid";
  const titles = { all: state.currentFolder === "root" ? "Il mio Desk" : (byId(state.currentFolder)?.name || "Cartella"), favorites: "Preferiti", recent: "Recenti" };
  elements.title.textContent = state.search ? `Risultati per “${state.search}”` : titles[state.currentSpace];
  elements.count.textContent = `${list.length} ${list.length === 1 ? "elemento" : "elementi"}`;
  elements.empty.hidden = list.length > 0 || Boolean(state.search) || state.currentSpace !== "all" || state.currentFolder !== "root";
  elements.items.hidden = list.length === 0;
  buildBreadcrumbs();
  for (const item of list) elements.items.append(createItemCard(item));
  $("#backBtn").disabled = state.historyIndex <= 0;
  $("#forwardBtn").disabled = state.historyIndex >= state.history.length - 1;
  $$(".side-link[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === state.currentSpace));
}

function createItemCard(item) {
  const card = document.createElement("article");
  card.className = `item-card${state.selectedId === item.id ? " selected" : ""}`;
  card.dataset.id = item.id; card.setAttribute("role", "listitem"); card.draggable = true;
  const open = document.createElement("button"); open.className = "item-open"; open.type = "button"; open.title = item.name;
  const icon = document.createElement("span"); icon.className = `item-icon ${kindFor(item)}`; icon.textContent = itemGlyph(item);
  const name = document.createElement("span"); name.className = "item-name"; name.textContent = item.name;
  const meta = document.createElement("span"); meta.className = "item-meta"; meta.textContent = describeItem(item);
  open.append(icon, name, meta);
  const more = document.createElement("button"); more.className = "item-more"; more.type = "button"; more.setAttribute("aria-label", `Azioni per ${item.name}`); more.textContent = "⋯";
  card.append(open);
  if (item.starred) { const star = document.createElement("span"); star.className = "favorite-star"; star.textContent = "★"; star.setAttribute("aria-label", "Preferito"); card.append(star); }
  card.append(more);
  open.addEventListener("click", () => openItem(item));
  open.addEventListener("focus", () => { state.selectedId = item.id; });
  more.addEventListener("click", event => showContext(item.id, event.clientX || more.getBoundingClientRect().right, event.clientY || more.getBoundingClientRect().bottom));
  card.addEventListener("contextmenu", event => { event.preventDefault(); showContext(item.id, event.clientX, event.clientY); });
  let holdTimer;
  card.addEventListener("pointerdown", event => { if (event.pointerType !== "mouse") holdTimer = setTimeout(() => showContext(item.id, event.clientX, event.clientY), 620); });
  ["pointerup", "pointercancel", "pointermove"].forEach(type => card.addEventListener(type, () => clearTimeout(holdTimer)));
  card.addEventListener("dragstart", event => { event.dataTransfer.setData("text/desk-item", item.id); event.dataTransfer.effectAllowed = "move"; });
  if (item.type === "folder") {
    card.addEventListener("dragover", event => { if (event.dataTransfer.types.includes("text/desk-item")) { event.preventDefault(); card.classList.add("drag-over"); } });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", async event => {
      event.preventDefault(); card.classList.remove("drag-over");
      const movedId = event.dataTransfer.getData("text/desk-item");
      if (movedId && movedId !== item.id) await moveItem(movedId, item.id);
    });
  }
  return card;
}

function navigate(folderId, push = true) {
  state.currentFolder = folderId; state.currentSpace = "all"; state.search = ""; elements.search.value = "";
  if (push) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(folderId); state.historyIndex += 1;
  }
  render();
}

async function openItem(item) {
  hideContext();
  if (item.type === "folder") { navigate(item.id); return; }
  item.lastOpenedAt = Date.now(); await db.putItem(item);
  elements.workspace.classList.add("viewer-open");
  elements.viewerPane.hidden = false; elements.splitter.hidden = false;
  await viewer.open(item);
  state.selectedId = item.id;
  render();
}

function closeViewer() {
  viewer.close();
  elements.workspace.classList.remove("viewer-open");
  elements.viewerPane.hidden = true; elements.splitter.hidden = true;
}

function showContext(id, x, y) {
  state.contextId = id;
  const item = byId(id);
  elements.context.querySelector('[data-action="project"]').hidden = item?.type === "folder";
  elements.context.querySelector('[data-action="lesson"]').hidden = item?.type === "folder";
  elements.context.querySelector('[data-action="favorite"]').textContent = item?.starred ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti";
  elements.context.hidden = false;
  const width = 190, height = 290;
  elements.context.style.left = `${Math.min(x, innerWidth - width - 8)}px`;
  elements.context.style.top = `${Math.min(y, innerHeight - height - 8)}px`;
}
function hideContext() { elements.context.hidden = true; state.contextId = null; }

async function deleteItem(item) {
  if (!item || !confirm(`Eliminare “${item.name}”${item.type === "folder" ? " e tutto il suo contenuto" : ""}?`)) return;
  const ids = item.type === "folder" ? await collectDescendantIds(state.items, item.id) : [item.id];
  await Promise.all(ids.map(id => db.deleteItem(id)));
  for (const lesson of state.lessons) {
    const filtered = lesson.itemIds.filter(id => !ids.includes(id));
    if (filtered.length !== lesson.itemIds.length) { lesson.itemIds = filtered; await db.putLesson(lesson); }
  }
  if (viewer.item && ids.includes(viewer.item.id)) closeViewer();
  toast("Elemento eliminato"); await refresh();
}

function allFoldersFor(item) {
  const descendants = item?.type === "folder" ? new Set([item.id]) : new Set();
  if (item?.type === "folder") {
    const walk = id => state.items.filter(child => child.parentId === id).forEach(child => { descendants.add(child.id); if (child.type === "folder") walk(child.id); });
    walk(item.id);
  }
  return state.items.filter(candidate => candidate.type === "folder" && !descendants.has(candidate.id));
}

async function moveItem(id, folderId) {
  const item = byId(id);
  if (!item || id === folderId || item.parentId === folderId) return;
  if (item.type === "folder" && allFoldersFor(item).every(folder => folder.id !== folderId) && folderId !== "root") { toast("Una cartella non può essere spostata dentro se stessa."); return; }
  item.parentId = folderId; item.modifiedAt = Date.now(); await db.putItem(item); toast("Elemento spostato"); await refresh();
}

async function importSelection(files) {
  if (!files?.length) return;
  try {
    await importFiles(files, state.currentSpace === "all" ? state.currentFolder : "root", (done, total) => toast(`Importazione ${done} / ${total}…`, 800));
    toast(`${files.length} ${files.length === 1 ? "materiale importato" : "materiali importati"}`);
    await refresh();
  } catch (error) {
    console.error(error);
    toast(error?.name === "QuotaExceededError" ? "Spazio del browser esaurito: rimuovi file o usa materiali più leggeri." : "Importazione non riuscita.", 4500);
  }
}

function renderLessons() {
  const list = $("#lessonsList"); list.replaceChildren();
  if (!state.lessons.length) {
    const empty = document.createElement("p"); empty.textContent = "Nessuna scrivania. Creane una e aggiungi i materiali nell’ordine in cui vuoi usarli."; empty.style.color = "var(--muted)"; list.append(empty); return;
  }
  for (const lesson of [...state.lessons].sort((a,b) => b.modifiedAt - a.modifiedAt)) {
    const card = document.createElement("article"); card.className = "lesson-card";
    const head = document.createElement("div"); head.className = "lesson-card-head";
    const identity = document.createElement("div"); const title = document.createElement("strong"); title.textContent = lesson.name; const meta = document.createElement("small"); meta.textContent = `${lesson.itemIds.length} materiali`; identity.append(title, meta);
    const actions = document.createElement("div"); actions.className = "lesson-card-actions";
    const start = miniButton("Avvia", () => startLesson(lesson));
    const duplicate = miniButton("Duplica", async () => { await duplicateLesson(lesson); await refresh(); renderLessons(); });
    const rename = miniButton("Rinomina", async () => { const name = prompt("Nuovo nome della scrivania", lesson.name)?.trim(); if (name) { lesson.name = name; lesson.modifiedAt = Date.now(); await db.putLesson(lesson); await refresh(); renderLessons(); } });
    const remove = miniButton("Elimina", async () => { if (confirm(`Eliminare la scrivania “${lesson.name}”? I file resteranno nel Desk.`)) { await db.deleteLesson(lesson.id); await refresh(); renderLessons(); } });
    actions.append(start, duplicate, rename, remove); head.append(identity, actions); card.append(head);
    const items = document.createElement("div"); items.className = "lesson-items";
    lesson.itemIds.forEach((id, index) => {
      const item = byId(id); if (!item) return;
      const row = document.createElement("div"); row.className = "lesson-item";
      const number = document.createElement("b"); number.textContent = String(index + 1).padStart(2, "0");
      const name = document.createElement("span"); name.textContent = item.name;
      const controls = document.createElement("div");
      controls.append(miniButton("↑", async () => { await moveLessonItem(lesson, index, -1); await refresh(); renderLessons(); }, "Sposta prima"), miniButton("↓", async () => { await moveLessonItem(lesson, index, 1); await refresh(); renderLessons(); }, "Sposta dopo"), miniButton("×", async () => { await removeItemFromLesson(lesson, id); await refresh(); renderLessons(); }, "Rimuovi"));
      row.append(number, name, controls); items.append(row);
    });
    card.append(items); list.append(card);
  }
}

function miniButton(text, action, label = text) { const button = document.createElement("button"); button.type = "button"; button.textContent = text; button.setAttribute("aria-label", label); button.addEventListener("click", action); return button; }

async function openAddToLesson(item) {
  if (!state.lessons.length) { const name = prompt("Nome della nuova scrivania di lezione", "Lezione — ")?.trim(); if (!name) return; state.lessons.push(await createLesson(name)); }
  const select = $("#addLessonForm select"); select.replaceChildren();
  for (const lesson of state.lessons) { const option = document.createElement("option"); option.value = lesson.id; option.textContent = lesson.name; select.append(option); }
  $("#addLessonDialog").dataset.itemId = item.id; $("#addLessonDialog").showModal();
}

async function startLesson(lesson) {
  if (!lesson.itemIds.length) { toast("Questa scrivania è ancora vuota."); return; }
  state.lesson = lesson; state.lessonIndex = 0;
  $("#lessonsDialog").close(); elements.lessonBar.hidden = false; elements.lessonTitle.textContent = lesson.name;
  await openLessonItem();
}

async function openLessonItem() {
  if (!state.lesson) return;
  const validIds = state.lesson.itemIds.filter(id => byId(id));
  if (!validIds.length) { endLesson(); return; }
  state.lessonIndex = Math.max(0, Math.min(state.lessonIndex, validIds.length - 1));
  elements.lessonCounter.textContent = `${state.lessonIndex + 1} / ${validIds.length}`;
  await openItem(byId(validIds[state.lessonIndex]));
  $("#lessonPrevBtn").disabled = state.lessonIndex === 0;
  $("#lessonNextBtn").disabled = state.lessonIndex === validIds.length - 1;
}

function endLesson() { state.lesson = null; state.lessonIndex = 0; elements.lessonBar.hidden = true; }

function updateLim(detail) {
  const connected = detail.connected;
  const classes = connected ? (detail.state === "blank" ? "blank" : "online") : "offline";
  [elements.limDot, elements.limMonitorDot].forEach(dot => { dot.className = `status-dot ${classes}`; });
  elements.limStatus.textContent = !connected ? "Non collegata" : detail.state === "blank" ? "Oscurata" : "Collegata";
  if (!connected) elements.limNow.textContent = "Nessun viewer collegato.";
  else if (detail.state === "blank") elements.limNow.textContent = "Schermata oscurata.";
  else if (detail.state === "neutral") elements.limNow.textContent = "Schermata neutra.";
  else if (detail.projection) elements.limNow.textContent = `Sta mostrando: ${detail.projection.title}${detail.projection.kind === "pdf" ? ` — pagina ${detail.projection.page}` : ""}`;
  const projection = detail.projection;
  elements.limPreview.classList.toggle("projected", Boolean(projection && detail.state === "projecting"));
  elements.limPreview.replaceChildren();
  if (projection && detail.state === "projecting") {
    const wrap = document.createElement("span"); const strong = document.createElement("b"); strong.textContent = projection.title; const small = document.createElement("small"); small.textContent = projection.kind === "pdf" ? `PDF · pagina ${projection.page}` : projection.kind || "contenuto"; wrap.append(strong, small); elements.limPreview.append(wrap);
  } else { const span = document.createElement("span"); span.textContent = detail.state === "blank" ? "LIM oscurata" : "Schermata neutra"; elements.limPreview.append(span); }
}

async function initialize() {
  state.settings = await db.getSettings();
  state.viewMode = state.settings.viewMode || "grid";
  state.sort = state.settings.sort || "name";
  elements.sort.value = state.sort;
  applyTheme(state.settings.theme || "auto");
  await db.persist().catch(() => false);
  await refresh();
  $("#gridViewBtn").classList.toggle("active", state.viewMode === "grid");
  $("#listViewBtn").classList.toggle("active", state.viewMode === "list");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
}

// Toolbar and navigation
$("#homeBtn").addEventListener("click", () => navigate("root"));
$("#backBtn").addEventListener("click", () => { if (state.historyIndex > 0) { state.historyIndex -= 1; navigate(state.history[state.historyIndex], false); } });
$("#forwardBtn").addEventListener("click", () => { if (state.historyIndex < state.history.length - 1) { state.historyIndex += 1; navigate(state.history[state.historyIndex], false); } });
elements.breadcrumbs.addEventListener("click", event => { const button = event.target.closest("[data-folder]"); if (button) navigate(button.dataset.folder); });
$$(".side-link[data-view]").forEach(button => button.addEventListener("click", () => { state.currentSpace = button.dataset.view; state.search = ""; elements.search.value = ""; render(); }));
elements.search.addEventListener("input", () => { state.search = elements.search.value; render(); });
elements.sort.addEventListener("change", async () => { state.sort = elements.sort.value; await db.putSetting("sort", state.sort); render(); });
$("#gridViewBtn").addEventListener("click", () => setViewMode("grid"));
$("#listViewBtn").addEventListener("click", () => setViewMode("list"));
async function setViewMode(mode) { state.viewMode = mode; await db.putSetting("viewMode", mode); $("#gridViewBtn").classList.toggle("active", mode === "grid"); $("#listViewBtn").classList.toggle("active", mode === "list"); render(); }

// Imports and drag & drop
[$("#fileInput"), $("#folderInput"), $("#emptyFileInput")].forEach(input => input.addEventListener("change", async () => { await importSelection(input.files); input.value = ""; }));
let dragDepth = 0;
elements.deskPane.addEventListener("dragenter", event => { if (event.dataTransfer.types.includes("Files")) { dragDepth += 1; $("#dropHint").hidden = false; } });
elements.deskPane.addEventListener("dragleave", () => { dragDepth -= 1; if (dragDepth <= 0) { dragDepth = 0; $("#dropHint").hidden = true; } });
elements.deskPane.addEventListener("dragover", event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); });
elements.deskPane.addEventListener("drop", async event => { if (event.dataTransfer.files.length) { event.preventDefault(); dragDepth = 0; $("#dropHint").hidden = true; await importSelection(event.dataTransfer.files); } });

// Dialogs
function showFolderDialog() { $("#folderForm").reset(); $("#folderDialog").showModal(); setTimeout(() => $("#folderForm input").focus(), 0); }
$("#newFolderBtn").addEventListener("click", showFolderDialog); $("#emptyFolderBtn").addEventListener("click", showFolderDialog);
$("#folderForm").addEventListener("submit", async event => { event.preventDefault(); const name = new FormData(event.currentTarget).get("name").trim(); if (!name) return; await db.putItem({ id: uid("folder"), parentId: state.currentSpace === "all" ? state.currentFolder : "root", type: "folder", name, starred: false, createdAt: Date.now(), modifiedAt: Date.now() }); $("#folderDialog").close(); await refresh(); });
$("#addUrlBtn").addEventListener("click", () => { $("#urlForm").reset(); $("#urlDialog").showModal(); });
$("#urlForm").addEventListener("submit", async event => { event.preventDefault(); const data = new FormData(event.currentTarget); await db.putItem({ id: uid("url"), parentId: state.currentFolder, type: "url", name: data.get("name").trim(), url: data.get("url"), starred: false, createdAt: Date.now(), modifiedAt: Date.now(), lastOpenedAt: 0 }); $("#urlDialog").close(); await refresh(); });
$("#renameForm").addEventListener("submit", async event => { event.preventDefault(); const item = byId($("#renameDialog").dataset.itemId); if (!item) return; item.name = new FormData(event.currentTarget).get("name").trim(); item.modifiedAt = Date.now(); await db.putItem(item); $("#renameDialog").close(); await refresh(); });
$("#moveForm").addEventListener("submit", async event => { event.preventDefault(); const id = $("#moveDialog").dataset.itemId; const folder = new FormData(event.currentTarget).get("folder"); $("#moveDialog").close(); await moveItem(id, folder); });

// Viewer and LIM
$("#closeViewerBtn").addEventListener("click", closeViewer);
$("#showLimBtn").addEventListener("click", () => { if (!viewer.item) return; viewer.persistState(); lim.show(viewer.item, viewer.getViewState()); toast("Materiale inviato alla LIM"); });
$("#viewerFullscreenBtn").addEventListener("click", () => elements.viewerPane.requestFullscreen?.());
$("#openLimBtn").addEventListener("click", () => { if (!lim.openViewer()) toast("Il browser ha bloccato la nuova finestra: consenti i popup per Desk LIM.", 4200); });
$("#blankLimBtn").addEventListener("click", () => lim.blank());
$("#restoreLimBtn").addEventListener("click", () => lim.restore());
$("#closeProjectionBtn").addEventListener("click", () => lim.close());
lim.addEventListener("status", event => updateLim(event.detail));

// Lessons
function openLessons() { renderLessons(); $("#lessonsDialog").showModal(); }
$("#lessonsBtn").addEventListener("click", openLessons); $("#lessonModeBtn").addEventListener("click", openLessons); $("#closeLessonsBtn").addEventListener("click", () => $("#lessonsDialog").close());
$("#lessonCreateForm").addEventListener("submit", async event => { event.preventDefault(); const input = event.currentTarget.elements.name; const name = input.value.trim(); if (!name) return; await createLesson(name); input.value = ""; await refresh(); renderLessons(); });
$("#addToLessonBtn").addEventListener("click", () => viewer.item && openAddToLesson(viewer.item));
$("#addLessonForm").addEventListener("submit", async event => { event.preventDefault(); const lesson = state.lessons.find(row => row.id === new FormData(event.currentTarget).get("lesson")); const itemId = $("#addLessonDialog").dataset.itemId; if (lesson && itemId) { await addItemToLesson(lesson, itemId); toast("Aggiunto alla scrivania"); } $("#addLessonDialog").close(); await refresh(); });
$("#lessonExitBtn").addEventListener("click", endLesson);
$("#lessonPrevBtn").addEventListener("click", async () => { state.lessonIndex -= 1; await openLessonItem(); });
$("#lessonNextBtn").addEventListener("click", async () => { state.lessonIndex += 1; await openLessonItem(); });

// Context menu
elements.context.addEventListener("click", async event => {
  const action = event.target.dataset.action; const item = byId(state.contextId); if (!action || !item) return; hideContext();
  if (action === "open") openItem(item);
  if (action === "project") { lim.show(item, { kind: kindFor(item), page: item.viewState?.page || 1, zoom: item.viewState?.zoom || 1 }); toast("Materiale inviato alla LIM"); }
  if (action === "favorite") { item.starred = !item.starred; await db.putItem(item); await refresh(); }
  if (action === "lesson") openAddToLesson(item);
  if (action === "rename") { $("#renameDialog").dataset.itemId = item.id; $("#renameForm input").value = item.name; $("#renameDialog").showModal(); }
  if (action === "move") {
    const select = $("#moveForm select"); select.replaceChildren();
    const root = document.createElement("option"); root.value = "root"; root.textContent = "Desk (radice)"; select.append(root);
    for (const folder of allFoldersFor(item)) { const option = document.createElement("option"); option.value = folder.id; option.textContent = folder.name; select.append(option); }
    select.value = item.parentId; $("#moveDialog").dataset.itemId = item.id; $("#moveDialog").showModal();
  }
  if (action === "delete") deleteItem(item);
});
document.addEventListener("pointerdown", event => { if (!elements.context.hidden && !elements.context.contains(event.target) && !event.target.closest(".item-more")) hideContext(); });

// Settings
$("#settingsBtn").addEventListener("click", () => {
  const form = $("#settingsForm"); form.elements.theme.value = state.settings.theme || "auto"; form.elements.neutralTitle.value = state.settings.neutralTitle || "Desk LIM"; form.elements.neutralColor.value = state.settings.neutralColor || "#111817"; form.elements.neutralBlack.checked = Boolean(state.settings.neutralBlack); $("#settingsDialog").showModal();
});
$("#settingsForm").addEventListener("submit", async event => {
  event.preventDefault(); const data = new FormData(event.currentTarget); const values = { theme: data.get("theme"), neutralTitle: data.get("neutralTitle"), neutralColor: data.get("neutralColor"), neutralBlack: data.get("neutralBlack") === "on" };
  await Promise.all(Object.entries(values).map(([key, value]) => db.putSetting(key, value))); Object.assign(state.settings, values); applyTheme(values.theme); lim.settingsChanged(); $("#settingsDialog").close(); toast("Impostazioni salvate");
});

// Resizable split
elements.splitter.addEventListener("pointerdown", event => {
  elements.splitter.setPointerCapture(event.pointerId);
  const move = pointer => {
    const rect = elements.workspace.getBoundingClientRect();
    if (innerWidth <= 900) {
      const ratio = ((pointer.clientY - rect.top) / rect.height) * 100;
      elements.workspace.style.gridTemplateRows = `${Math.min(62, Math.max(25, ratio))}% 8px 1fr`;
    } else {
      const ratio = ((pointer.clientX - rect.left) / rect.width) * 100;
      document.documentElement.style.setProperty("--desk-width", `${Math.min(65, Math.max(27, ratio))}%`);
    }
  };
  const up = () => { elements.splitter.removeEventListener("pointermove", move); elements.splitter.removeEventListener("pointerup", up); };
  elements.splitter.addEventListener("pointermove", move); elements.splitter.addEventListener("pointerup", up);
});
elements.splitter.addEventListener("keydown", event => {
  const delta = (event.key === "ArrowRight" || event.key === "ArrowDown") ? 2 : (event.key === "ArrowLeft" || event.key === "ArrowUp") ? -2 : 0;
  if (!delta) return; event.preventDefault(); const current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--desk-width")) || 42; document.documentElement.style.setProperty("--desk-width", `${Math.min(65, Math.max(27, current + delta))}%`);
});

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") { event.preventDefault(); elements.search.focus(); }
  if (event.key === "Escape" && !elements.viewerPane.hidden && !document.querySelector("dialog[open]")) closeViewer();
  if ((event.key === "Delete" || event.key === "Backspace") && state.selectedId && !event.target.matches("input,textarea")) deleteItem(byId(state.selectedId));
});

initialize().catch(error => { console.error(error); toast("Desk LIM non riesce ad aprire l’archivio locale. Verifica che il browser consenta IndexedDB.", 6000); });
