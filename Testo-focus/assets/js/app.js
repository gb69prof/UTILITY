const paths = {
  catalog: "./data/catalog.json",
  demo: "./data/texts/dimostrazione-tecnica.json"
};

const state = {
  catalog: [],
  text: null,
  activeFocusId: null,
  occurrenceIndex: 0
};

const dom = {
  home: document.querySelector("#home-view"),
  analysis: document.querySelector("#analysis-view"),
  catalogDialog: document.querySelector("#catalog-dialog"),
  catalogResults: document.querySelector("#catalog-results"),
  catalogFilters: document.querySelector("#catalog-filters"),
  catalogSearch: document.querySelector("#catalog-search"),
  disciplineFilter: document.querySelector("#discipline-filter"),
  periodFilter: document.querySelector("#period-filter"),
  lessonLink: document.querySelector("#lesson-link"),
  textAuthor: document.querySelector("#text-author"),
  textTitle: document.querySelector("#text-title"),
  textContent: document.querySelector("#text-content"),
  focusControls: document.querySelector("#focus-controls"),
  resetFocus: document.querySelector("#reset-focus"),
  whyHeading: document.querySelector("#why-heading"),
  focusFragment: document.querySelector("#focus-fragment"),
  focusExplanation: document.querySelector("#focus-explanation"),
  occurrenceNav: document.querySelector("#occurrence-nav"),
  occurrenceCount: document.querySelector("#occurrence-count"),
  previousOccurrence: document.querySelector("#previous-occurrence"),
  nextOccurrence: document.querySelector("#next-occurrence"),
  connections: document.querySelector("#connections"),
  status: document.querySelector("#status-message")
};

let statusTimer;

function announce(message) {
  window.clearTimeout(statusTimer);
  dom.status.textContent = message;
  dom.status.classList.add("is-visible");
  statusTimer = window.setTimeout(() => dom.status.classList.remove("is-visible"), 2600);
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Impossibile caricare ${url} (${response.status})`);
  return response.json();
}

function validateDataset(dataset) {
  const metadata = dataset?.metadata;
  if (!metadata?.id || !metadata?.title || !metadata?.author) throw new Error("Metadati del testo incompleti.");
  if (!Array.isArray(dataset.units) || dataset.units.length === 0) throw new Error("Il dataset non contiene unità di testo.");
  if (!Array.isArray(dataset.focuses)) throw new Error("Il dataset non contiene la lista dei focus.");

  const unitIds = new Set();
  dataset.units.forEach((unit) => {
    if (!unit.id || typeof unit.text !== "string" || unitIds.has(unit.id)) throw new Error("Unità di testo non valida o duplicata.");
    unitIds.add(unit.id);
  });

  const focusIds = new Set();
  dataset.focuses.forEach((focus) => {
    if (!focus.id || !focus.label || focusIds.has(focus.id)) throw new Error("Focus non valido o duplicato.");
    focusIds.add(focus.id);
    normalizeSegments(focus.segments).forEach((segment) => {
      if (!unitIds.has(segment.unitId)) throw new Error(`Il focus “${focus.label}” richiama un segmento inesistente.`);
    });
  });
}

function normalizeSegments(segments = []) {
  return segments.map((segment) => typeof segment === "string" ? { unitId: segment } : segment);
}

async function loadCatalog() {
  try {
    const payload = await fetchJson(paths.catalog);
    state.catalog = Array.isArray(payload) ? payload : (payload.texts || []);
    populateFilters();
    renderCatalog();
  } catch (error) {
    state.catalog = [];
    renderCatalog(error.message);
  }
}

function populateFilters() {
  const disciplines = [...new Set(state.catalog.map((item) => item.discipline).filter(Boolean))].sort(localeSort);
  const periods = [...new Set(state.catalog.map((item) => item.period).filter(Boolean))].sort(localeSort);
  setOptions(dom.disciplineFilter, disciplines, "Tutte");
  setOptions(dom.periodFilter, periods, "Tutti");
}

function setOptions(select, values, allLabel) {
  select.replaceChildren(new Option(allLabel, ""));
  values.forEach((value) => select.add(new Option(value, value)));
}

function localeSort(a, b) {
  return a.localeCompare(b, "it", { sensitivity: "base" });
}

function renderCatalog(errorMessage = "") {
  const query = dom.catalogSearch.value.trim().toLocaleLowerCase("it");
  const discipline = dom.disciplineFilter.value;
  const period = dom.periodFilter.value;
  const matches = state.catalog.filter((item) => {
    const haystack = [item.title, item.author, item.discipline, item.period, item.category, item.description].filter(Boolean).join(" ").toLocaleLowerCase("it");
    return (!query || haystack.includes(query)) && (!discipline || item.discipline === discipline) && (!period || item.period === period);
  }).sort((a, b) => localeSort(a.title, b.title));

  dom.catalogResults.replaceChildren();
  if (errorMessage) {
    dom.catalogResults.append(createEmptyState("Il catalogo non è disponibile. Riprova quando sei online."));
    return;
  }
  if (matches.length === 0) {
    const message = state.catalog.length === 0
      ? "La biblioteca è pronta: i testi reali aggiunti al catalogo compariranno qui."
      : "Nessun testo corrisponde ai filtri scelti.";
    dom.catalogResults.append(createEmptyState(message));
    return;
  }

  matches.forEach((item) => dom.catalogResults.append(createCatalogCard(item)));
}

function createEmptyState(message) {
  const paragraph = document.createElement("p");
  paragraph.className = "catalog-empty";
  paragraph.textContent = message;
  return paragraph;
}

function createCatalogCard(item) {
  const article = document.createElement("article");
  article.className = "catalog-card";

  const content = document.createElement("div");
  const metadata = document.createElement("div");
  metadata.className = "metadata";
  [item.author, item.discipline, item.period].filter(Boolean).forEach((value) => {
    const span = document.createElement("span");
    span.textContent = value;
    metadata.append(span);
  });
  const title = document.createElement("h3");
  title.textContent = item.title;
  const description = document.createElement("p");
  description.textContent = item.description || "Testo disponibile per l’analisi.";
  content.append(metadata, title, description);

  const actions = document.createElement("div");
  actions.className = "catalog-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.textContent = "Apri";
  open.addEventListener("click", () => loadText(item));
  actions.append(open);
  if (item.lessonUrl) {
    const lesson = document.createElement("a");
    lesson.href = item.lessonUrl;
    lesson.target = "_blank";
    lesson.rel = "noopener";
    lesson.textContent = "Lezione completa";
    actions.append(lesson);
  }
  article.append(content, actions);
  return article;
}

async function loadText(catalogEntry) {
  const source = typeof catalogEntry === "string" ? catalogEntry : catalogEntry.dataPath;
  if (!source) return announce("Percorso del testo non definito.");
  announce("Caricamento del testo…");
  try {
    const dataset = await fetchJson(source);
    validateDataset(dataset);
    state.text = dataset;
    state.activeFocusId = null;
    state.occurrenceIndex = 0;
    renderText();
    showAnalysis();
    dom.catalogDialog.close();
    updateUrl(dataset.metadata.id);
    localStorage.setItem("testoFocus.lastText", dataset.metadata.id);

    const rememberedFocus = localStorage.getItem(`testoFocus.focus.${dataset.metadata.id}`);
    if (rememberedFocus && dataset.focuses.some((focus) => focus.id === rememberedFocus)) {
      selectFocus(rememberedFocus, false);
    }
    announce(`Aperto: ${dataset.metadata.title}`);
  } catch (error) {
    console.error(error);
    announce("Non riesco ad aprire questo testo. Controlla il dataset.");
  }
}

function renderText() {
  const { metadata, units, focuses } = state.text;
  dom.textAuthor.textContent = [metadata.author, metadata.discipline].filter(Boolean).join(" · ");
  dom.textTitle.textContent = metadata.title;
  document.title = `${metadata.title} · Testo-Focus`;
  dom.textContent.replaceChildren();

  units.forEach((unit) => {
    const element = document.createElement(unit.type === "paragraph" ? "p" : "span");
    element.id = `unit-${unit.id}`;
    element.dataset.unitId = unit.id;
    element.className = `text-unit is-${unit.type || "line"}`;
    element.textContent = unit.text;
    dom.textContent.append(element);
  });

  dom.focusControls.replaceChildren();
  focuses.forEach((focus) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "focus-button";
    button.dataset.focusId = focus.id;
    button.setAttribute("aria-pressed", "false");
    button.textContent = focus.label;
    button.addEventListener("click", () => selectFocus(focus.id));
    dom.focusControls.append(button);
  });

  configureLessonLink(metadata.lessonUrl);
  resetFocus(false);
}

function configureLessonLink(url) {
  if (url) {
    dom.lessonLink.href = url;
    dom.lessonLink.classList.remove("is-disabled");
    dom.lessonLink.removeAttribute("aria-disabled");
    dom.lessonLink.removeAttribute("tabindex");
  } else {
    dom.lessonLink.href = "#";
    dom.lessonLink.classList.add("is-disabled");
    dom.lessonLink.setAttribute("aria-disabled", "true");
    dom.lessonLink.tabIndex = -1;
  }
}

function selectFocus(focusId, moveToFirst = true) {
  const focus = state.text?.focuses.find((item) => item.id === focusId);
  if (!focus) return;
  state.activeFocusId = focusId;
  state.occurrenceIndex = 0;
  localStorage.setItem(`testoFocus.focus.${state.text.metadata.id}`, focusId);

  const segments = normalizeSegments(focus.segments);
  const segmentIds = new Set(segments.map((segment) => segment.unitId));
  dom.textContent.classList.add("has-focus");
  dom.textContent.querySelectorAll(".text-unit").forEach((unit) => {
    const isMatch = segmentIds.has(unit.dataset.unitId);
    unit.classList.toggle("is-match", isMatch);
    unit.classList.remove("is-current");
  });
  dom.focusControls.querySelectorAll(".focus-button").forEach((button) => {
    const active = button.dataset.focusId === focusId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  dom.resetFocus.classList.remove("is-active");
  dom.whyHeading.textContent = focus.label;
  dom.focusExplanation.textContent = focus.explanation || "";
  renderConnections(focus.connections || []);
  updateOccurrence(moveToFirst);
}

function updateOccurrence(shouldScroll = true) {
  const focus = state.text?.focuses.find((item) => item.id === state.activeFocusId);
  const segments = normalizeSegments(focus?.segments);
  if (!focus || segments.length === 0) {
    dom.occurrenceNav.hidden = true;
    dom.focusFragment.hidden = true;
    return;
  }
  state.occurrenceIndex = (state.occurrenceIndex + segments.length) % segments.length;
  const segment = segments[state.occurrenceIndex];
  const unit = document.querySelector(`#unit-${CSS.escape(segment.unitId)}`);

  dom.textContent.querySelectorAll(".is-current").forEach((element) => element.classList.remove("is-current"));
  if (unit) {
    unit.classList.add("is-current");
    if (shouldScroll) unit.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  dom.focusFragment.hidden = false;
  dom.focusFragment.textContent = segment.note || unit?.textContent || "";
  dom.occurrenceNav.hidden = false;
  dom.occurrenceCount.textContent = `${state.occurrenceIndex + 1} / ${segments.length}`;
  dom.previousOccurrence.disabled = segments.length < 2;
  dom.nextOccurrence.disabled = segments.length < 2;
}

function renderConnections(connections) {
  dom.connections.replaceChildren();
  if (!connections.length) {
    const empty = document.createElement("p");
    empty.className = "empty-connections";
    empty.textContent = "Questo focus non prevede collegamenti ulteriori.";
    dom.connections.append(empty);
    return;
  }
  connections.forEach((connection) => {
    const card = document.createElement("article");
    card.className = "connection-card";
    const heading = document.createElement("h3");
    heading.textContent = connection.category;
    const text = document.createElement("p");
    text.textContent = connection.text;
    card.append(heading, text);
    dom.connections.append(card);
  });
}

function resetFocus(clearStored = true) {
  state.activeFocusId = null;
  state.occurrenceIndex = 0;
  dom.textContent.classList.remove("has-focus");
  dom.textContent.querySelectorAll(".text-unit").forEach((unit) => unit.classList.remove("is-match", "is-current"));
  dom.focusControls.querySelectorAll(".focus-button").forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });
  dom.resetFocus.classList.add("is-active");
  dom.whyHeading.textContent = state.text?.presentation?.overviewTitle || "Testo intero";
  dom.focusExplanation.textContent = state.text?.presentation?.overview || "Il testo è ora visibile senza filtri. Scegli un nucleo per isolare i passaggi pertinenti.";
  dom.focusFragment.hidden = true;
  dom.occurrenceNav.hidden = true;
  renderConnections([]);
  if (clearStored && state.text) localStorage.removeItem(`testoFocus.focus.${state.text.metadata.id}`);
}

function showHome() {
  dom.analysis.hidden = true;
  dom.home.hidden = false;
  state.text = null;
  state.activeFocusId = null;
  configureLessonLink("");
  document.title = "Testo-Focus · gbprof";
  updateUrl();
  document.querySelector("#home-title")?.focus({ preventScroll: true });
}

function showAnalysis() {
  dom.home.hidden = true;
  dom.analysis.hidden = false;
  document.querySelector("#text-title")?.focus({ preventScroll: true });
}

function openCatalog() {
  renderCatalog();
  if (!dom.catalogDialog.open) dom.catalogDialog.showModal();
  window.setTimeout(() => dom.catalogSearch.focus(), 0);
}

function updateUrl(textId = "") {
  const url = new URL(window.location.href);
  if (textId) url.searchParams.set("text", textId);
  else url.searchParams.delete("text");
  history.replaceState({ textId }, "", url);
}

async function openFromUrl() {
  const textId = new URL(window.location.href).searchParams.get("text");
  if (!textId) return;
  if (textId === "dimostrazione-tecnica") return loadText(paths.demo);
  const entry = state.catalog.find((item) => item.id === textId);
  if (entry) return loadText(entry);
  announce("Il testo richiesto non è presente nel catalogo.");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    announce("Lo schermo intero non è disponibile in questo browser.");
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    const action = control.dataset.action;
    if (action === "home") showHome();
    if (action === "catalog") openCatalog();
    if (action === "close-catalog") dom.catalogDialog.close();
    if (action === "fullscreen") toggleFullscreen();
    if (action === "demo") loadText(paths.demo);
  });
  dom.resetFocus.addEventListener("click", () => resetFocus());
  dom.previousOccurrence.addEventListener("click", () => { state.occurrenceIndex -= 1; updateOccurrence(); });
  dom.nextOccurrence.addEventListener("click", () => { state.occurrenceIndex += 1; updateOccurrence(); });
  dom.catalogFilters.addEventListener("input", () => renderCatalog());
  dom.catalogFilters.addEventListener("reset", () => window.setTimeout(renderCatalog, 0));
  dom.catalogDialog.addEventListener("click", (event) => {
    if (event.target === dom.catalogDialog) dom.catalogDialog.close();
  });
  window.addEventListener("popstate", openFromUrl);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
  } catch (error) {
    console.warn("Service worker non registrato", error);
  }
}

async function init() {
  bindEvents();
  await loadCatalog();
  await openFromUrl();
  registerServiceWorker();
}

init();
