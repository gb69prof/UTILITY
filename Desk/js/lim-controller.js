const CHANNEL_NAME = "desk-lim-channel-v1";
const STORAGE_KEY = "desk-lim-command-v1";

export class LimController extends EventTarget {
  constructor() {
    super();
    this.channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    this.connectedAt = 0;
    this.lastProjection = null;
    this.state = "offline";
    this.channel?.addEventListener("message", event => this.receive(event.data));
    window.addEventListener("storage", event => {
      if (event.key === STORAGE_KEY && event.newValue) this.receive(JSON.parse(event.newValue));
    });
    this.timer = setInterval(() => this.refreshConnection(), 2500);
    this.send({ type: "controller-hello" });
  }

  send(message) {
    const payload = { ...message, sentAt: Date.now(), nonce: Math.random() };
    this.channel?.postMessage(payload);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* private mode fallback */ }
  }

  receive(message) {
    if (!message || !["viewer-ready", "viewer-heartbeat", "viewer-state"].includes(message.type)) return;
    this.connectedAt = Date.now();
    if (message.type === "viewer-ready" && this.lastProjection && this.state === "projecting") {
      this.send({ type: "show", projection: this.lastProjection });
    }
    if (message.type === "viewer-state") this.state = message.state || "connected";
    else if (this.state === "offline") this.state = "connected";
    this.emit();
  }

  refreshConnection() {
    const online = Date.now() - this.connectedAt < 9000;
    if (!online && this.state !== "offline") { this.state = "offline"; this.emit(); }
    if (online) this.send({ type: "controller-heartbeat" });
  }

  emit() {
    this.dispatchEvent(new CustomEvent("status", { detail: { connected: this.state !== "offline", state: this.state, projection: this.lastProjection } }));
  }

  show(item, viewState = {}) {
    if (!item) return;
    this.lastProjection = { itemId: item.id, title: item.name, kind: viewState.kind, page: viewState.page || 1, zoom: viewState.zoom || 1 };
    this.state = "projecting";
    this.send({ type: "show", projection: this.lastProjection });
    this.emit();
  }

  blank() {
    this.state = "blank";
    this.send({ type: "blank" });
    this.emit();
  }

  restore() {
    if (!this.lastProjection) return;
    this.state = "projecting";
    this.send({ type: "show", projection: this.lastProjection });
    this.emit();
  }

  close() {
    this.state = "neutral";
    this.send({ type: "close" });
    this.emit();
  }

  settingsChanged() { this.send({ type: "settings-changed" }); }

  openViewer() {
    const popup = window.open("./lim.html", "desk-lim-viewer", "popup=yes,width=1280,height=720");
    popup?.focus();
    return Boolean(popup);
  }
}

export { CHANNEL_NAME, STORAGE_KEY };
