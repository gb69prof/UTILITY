import { db } from "./db.js";
import { kindFor, extension } from "./files.js";
import { CHANNEL_NAME, STORAGE_KEY } from "./lim-controller.js";

const app = document.querySelector("#limApp");
const neutral = document.querySelector("#limNeutral");
const neutralTitle = document.querySelector("#limNeutralTitle");
const content = document.querySelector("#limContent");
const connection = document.querySelector("#limConnection");
const fullscreenButton = document.querySelector("#limFullscreen");
const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
let objectUrl = null;
let connectedAt = 0;
let currentState = "neutral";

function send(message) {
  channel?.postMessage({ ...message, sentAt: Date.now(), nonce: Math.random() });
}

async function applySettings(forceBlack = false) {
  const settings = await db.getSettings().catch(() => ({}));
  const black = forceBlack && settings.neutralBlack;
  neutral.style.background = black ? "#000000" : (settings.neutralColor || "#111817");
  neutralTitle.textContent = forceBlack && black ? "" : (settings.neutralTitle || "Desk LIM");
  neutral.querySelector("p").textContent = forceBlack ? "" : "In attesa del docente";
  neutral.querySelector(".lim-neutral-mark").hidden = Boolean(forceBlack && black);
}

function clearContent() {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  content.replaceChildren();
}

function setNeutral(blank = false) {
  clearContent();
  content.hidden = true;
  neutral.hidden = false;
  currentState = blank ? "blank" : "neutral";
  applySettings(blank);
  send({ type: "viewer-state", state: currentState });
}

function fallback(title, text) {
  const box = document.createElement("div"); box.className = "unsupported-preview";
  const heading = document.createElement("h2"); heading.textContent = title;
  const paragraph = document.createElement("p"); paragraph.textContent = text;
  box.append(heading, paragraph); return box;
}

async function renderProjection(projection) {
  const item = await db.getItem(projection.itemId).catch(() => null);
  clearContent();
  neutral.hidden = true;
  content.hidden = false;
  if (!item) {
    content.append(fallback("Materiale non disponibile", "Il Viewer LIM non trova questo file nel proprio archivio locale. Aprilo sullo stesso browser del Controller oppure usa la futura modalità di rete."));
    currentState = "error"; send({ type: "viewer-state", state: currentState }); return;
  }
  const kind = kindFor(item);
  if (item.blob) objectUrl = URL.createObjectURL(item.blob);
  if (kind === "pdf") {
    const frame = document.createElement("iframe"); frame.title = item.name; frame.src = `${objectUrl}#page=${projection.page || 1}&zoom=page-width&toolbar=0&navpanes=0`; content.append(frame);
  } else if (kind === "image") {
    const image = document.createElement("img"); image.src = objectUrl; image.alt = item.name; image.style.transform = `scale(${projection.zoom || 1})`; content.append(image);
  } else if (kind === "video") {
    const video = document.createElement("video"); video.src = objectUrl; video.controls = true; video.autoplay = true; video.playsInline = true; if (projection.mediaTime) video.addEventListener("loadedmetadata", () => { video.currentTime = projection.mediaTime; }, { once: true }); content.append(video);
  } else if (kind === "audio") {
    const audio = document.createElement("audio"); audio.src = objectUrl; audio.controls = true; audio.autoplay = true; if (projection.mediaTime) audio.addEventListener("loadedmetadata", () => { audio.currentTime = projection.mediaTime; }, { once: true }); content.append(audio);
  } else if (kind === "text") {
    const article = document.createElement("article"); article.className = "text-preview"; article.textContent = await item.blob.text(); content.append(article);
  } else if (kind === "html") {
    const frame = document.createElement("iframe"); frame.title = item.name; frame.src = objectUrl; frame.sandbox = "allow-scripts allow-forms allow-modals allow-popups allow-downloads"; content.append(frame);
  } else if (kind === "url") {
    const frame = document.createElement("iframe"); frame.title = item.name; frame.src = item.url; frame.referrerPolicy = "no-referrer"; content.append(frame);
  } else if (kind === "office") {
    content.append(fallback(`${extension(item.name).toUpperCase()} non proiettabile direttamente`, "Converti il documento in PDF per una proiezione affidabile e identica su ogni dispositivo."));
  } else {
    content.append(fallback("Formato non proiettabile", "Questo formato non dispone di un visualizzatore browser affidabile."));
  }
  currentState = "projecting";
  send({ type: "viewer-state", state: currentState, itemId: item.id });
}

async function receive(message) {
  if (!message) return;
  if (["controller-hello", "controller-heartbeat", "show", "blank", "close", "settings-changed"].includes(message.type)) {
    connectedAt = Date.now(); connection.textContent = "Controller collegato";
  }
  if (message.type === "show") await renderProjection(message.projection);
  if (message.type === "blank") setNeutral(true);
  if (message.type === "close") setNeutral(false);
  if (message.type === "settings-changed") applySettings(currentState === "blank");
  if (message.type === "controller-hello") send({ type: "viewer-ready", state: currentState });
}

channel?.addEventListener("message", event => receive(event.data));
window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY && event.newValue) receive(JSON.parse(event.newValue));
});

fullscreenButton.addEventListener("click", () => {
  if (!document.fullscreenElement) app.requestFullscreen?.(); else document.exitFullscreen?.();
});
document.addEventListener("fullscreenchange", () => { fullscreenButton.textContent = document.fullscreenElement ? "Esci da schermo intero" : "Schermo intero"; });

setInterval(() => {
  const connected = Date.now() - connectedAt < 9000;
  connection.textContent = connected ? "Controller collegato" : "Controller non collegato";
  send({ type: "viewer-heartbeat", state: currentState });
}, 3000);

applySettings(false);
send({ type: "viewer-ready", state: currentState });
