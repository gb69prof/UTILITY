import { kindFor, downloadItem, extension } from "./files.js";

export class PrivateViewer {
  constructor({ pane, body, toolbar, title, type, onState }) {
    this.pane = pane;
    this.body = body;
    this.toolbar = toolbar;
    this.title = title;
    this.type = type;
    this.onState = onState;
    this.item = null;
    this.kind = null;
    this.objectUrl = null;
    this.page = 1;
    this.zoom = 1;
    this.mediaTime = 0;
  }

  revoke() {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }

  close() {
    this.persistState();
    this.revoke();
    this.body.replaceChildren();
    this.toolbar.replaceChildren();
    this.toolbar.hidden = true;
    this.item = null;
    this.kind = null;
  }

  getViewState() {
    return { kind: this.kind, page: this.page, zoom: this.zoom, mediaTime: this.mediaTime };
  }

  persistState() {
    if (!this.item) return;
    this.onState?.(this.item, this.getViewState());
  }

  async open(item) {
    this.persistState();
    this.revoke();
    this.item = item;
    this.kind = kindFor(item);
    this.page = item.viewState?.page || 1;
    this.zoom = item.viewState?.zoom || 1;
    this.mediaTime = item.viewState?.mediaTime || 0;
    this.title.textContent = item.name;
    this.type.textContent = this.kind.toUpperCase();
    this.body.replaceChildren();
    this.toolbar.replaceChildren();
    this.toolbar.hidden = true;

    if (item.blob) this.objectUrl = URL.createObjectURL(item.blob);
    const renderer = this[`render_${this.kind}`] || this.render_file;
    await renderer.call(this, item);
  }

  button(text, action, label = text) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", action);
    return button;
  }

  render_pdf() {
    this.toolbar.hidden = false;
    const frame = document.createElement("iframe");
    frame.title = `PDF: ${this.item.name}`;
    const refresh = () => {
      frame.src = `${this.objectUrl}#page=${this.page}&zoom=page-width&toolbar=1&navpanes=0`;
      pageInput.value = this.page;
      this.persistState();
    };
    const pageInput = document.createElement("input");
    pageInput.type = "number"; pageInput.min = "1"; pageInput.value = this.page; pageInput.setAttribute("aria-label", "Numero pagina PDF");
    pageInput.addEventListener("change", () => { this.page = Math.max(1, Number(pageInput.value) || 1); refresh(); });
    this.toolbar.append(
      this.button("←", () => { this.page = Math.max(1, this.page - 1); refresh(); }, "Pagina precedente"),
      pageInput,
      this.button("→", () => { this.page += 1; refresh(); }, "Pagina successiva"),
      this.button("Adatta larghezza", refresh),
      this.button("Apri nel browser", () => window.open(`${this.objectUrl}#page=${this.page}`, "_blank"))
    );
    refresh();
    this.body.append(frame);
  }

  render_image() {
    this.toolbar.hidden = false;
    const stage = document.createElement("div"); stage.className = "viewer-image-stage";
    const image = document.createElement("img"); image.src = this.objectUrl; image.alt = this.item.name;
    const zoomOutput = document.createElement("output");
    const setZoom = value => { this.zoom = Math.min(5, Math.max(.25, value)); image.style.transform = `scale(${this.zoom})`; zoomOutput.textContent = `${Math.round(this.zoom * 100)}%`; this.persistState(); };
    this.toolbar.append(
      this.button("−", () => setZoom(this.zoom - .25), "Riduci immagine"),
      zoomOutput,
      this.button("＋", () => setZoom(this.zoom + .25), "Ingrandisci immagine"),
      this.button("Adatta", () => setZoom(1)),
      this.button("Ruota", () => { image.dataset.rotation = `${(Number(image.dataset.rotation || 0) + 90) % 360}`; image.style.rotate = `${image.dataset.rotation}deg`; })
    );
    stage.append(image); this.body.append(stage); setZoom(this.zoom);
  }

  render_video() {
    const video = document.createElement("video");
    video.src = this.objectUrl; video.controls = true; video.playsInline = true; video.preload = "metadata";
    video.addEventListener("loadedmetadata", () => { if (this.mediaTime) video.currentTime = Math.min(this.mediaTime, video.duration || this.mediaTime); });
    video.addEventListener("timeupdate", () => { this.mediaTime = video.currentTime; });
    this.body.append(video);
  }

  render_audio() {
    const audio = document.createElement("audio");
    audio.src = this.objectUrl; audio.controls = true; audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () => { if (this.mediaTime) audio.currentTime = Math.min(this.mediaTime, audio.duration || this.mediaTime); });
    audio.addEventListener("timeupdate", () => { this.mediaTime = audio.currentTime; });
    this.body.append(audio);
  }

  async render_text() {
    const pre = document.createElement("article"); pre.className = "text-preview";
    try { pre.textContent = await this.item.blob.text(); } catch { pre.textContent = "Impossibile leggere il file di testo."; }
    this.body.append(pre);
  }

  render_html() {
    const frame = document.createElement("iframe");
    frame.src = this.objectUrl; frame.title = this.item.name;
    frame.sandbox = "allow-scripts allow-forms allow-modals allow-popups allow-downloads";
    this.body.append(frame);
  }

  render_url() {
    this.toolbar.hidden = false;
    this.toolbar.append(this.button("Apri in una nuova scheda ↗", () => window.open(this.item.url, "_blank", "noopener")));
    const frame = document.createElement("iframe");
    frame.src = this.item.url; frame.title = this.item.name; frame.referrerPolicy = "no-referrer";
    frame.addEventListener("error", () => this.renderUrlFallback());
    this.body.append(frame);
    setTimeout(() => {
      if (!this.body.contains(frame)) return;
      const notice = document.createElement("div"); notice.className = "iframe-notice";
      notice.textContent = "Se la pagina resta vuota, il sito impedisce l’apertura dentro altre applicazioni: usa “Apri in una nuova scheda”.";
      notice.style.cssText = "position:absolute;left:12px;bottom:12px;padding:7px 9px;border-radius:8px;background:rgba(0,0,0,.72);font-size:10px;max-width:440px";
      this.body.append(notice); setTimeout(() => notice.remove(), 7000);
    }, 1300);
  }

  renderUrlFallback() {
    this.body.replaceChildren();
    const box = this.unsupported("Questa pagina non accetta l’anteprima incorporata.", "Apri la risorsa in una nuova scheda per consultarla.");
    const link = document.createElement("a"); link.href = this.item.url; link.target = "_blank"; link.rel = "noopener"; link.textContent = "Apri risorsa ↗";
    box.append(link); this.body.append(box);
  }

  render_office() {
    const ext = extension(this.item.name).toUpperCase();
    const box = this.unsupported(`${ext} conservato nel Desk`, "Una PWA statica non può garantire una resa fedele dei formati Office. Il file resta disponibile e può essere aperto nell’app installata sul dispositivo.");
    const download = this.button(`Scarica / apri ${ext}`, () => downloadItem(this.item)); download.className = "button primary";
    box.append(download); this.body.append(box);
  }

  render_file() {
    const box = this.unsupported("Formato non visualizzabile", "Il file è salvato nel Desk, ma il browser non dispone di un visualizzatore affidabile per questo formato.");
    const download = this.button("Scarica / apri file", () => downloadItem(this.item)); download.className = "button primary";
    box.append(download); this.body.append(box);
  }

  unsupported(title, text) {
    const box = document.createElement("div"); box.className = "unsupported-preview";
    const heading = document.createElement("h2"); heading.textContent = title;
    const paragraph = document.createElement("p"); paragraph.textContent = text;
    box.append(heading, paragraph); return box;
  }
}
