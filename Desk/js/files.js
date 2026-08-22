import { db, uid } from "./db.js";

const EXTENSIONS = {
  pdf: "pdf", png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image", avif: "image",
  mp4: "video", webm: "video", mov: "video", m4v: "video", ogv: "video",
  mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio", aac: "audio", flac: "audio",
  html: "html", htm: "html", txt: "text", md: "text", csv: "text", json: "text", xml: "text", css: "text", js: "text",
  doc: "office", docx: "office", xls: "office", xlsx: "office", ppt: "office", pptx: "office", odt: "office", ods: "office", odp: "office"
};

export function extension(name = "") {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

export function kindFor(item) {
  if (item.type === "folder") return "folder";
  if (item.type === "url") return "url";
  const mime = item.mime || "";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("text/")) return extension(item.name) === "html" ? "html" : "text";
  return EXTENSIONS[extension(item.name)] || "file";
}

export function itemGlyph(item) {
  const kind = kindFor(item);
  return { folder: "", pdf: "PDF", image: "▧", video: "▶", audio: "♫", html: "</>", text: "TXT", url: "↗", office: extension(item.name).toUpperCase(), file: extension(item.name).toUpperCase() || "FILE" }[kind];
}

export function formatSize(bytes = 0) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function describeItem(item) {
  if (item.type === "folder") return "Cartella";
  if (item.type === "url") return "Collegamento web";
  return `${extension(item.name).toUpperCase() || "File"} · ${formatSize(item.size)}`;
}

export async function importFiles(fileList, parentId = "root", onProgress = () => {}) {
  const files = Array.from(fileList || []);
  const folderCache = new Map();
  const created = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let targetParent = parentId;
    const relative = file.webkitRelativePath || "";
    if (relative.includes("/")) {
      const parts = relative.split("/").slice(0, -1);
      let path = parentId;
      for (const part of parts) {
        const key = `${path}/${part}`;
        if (!folderCache.has(key)) {
          const folder = { id: uid("folder"), parentId: path, type: "folder", name: part, createdAt: Date.now(), modifiedAt: Date.now(), starred: false };
          await db.putItem(folder);
          folderCache.set(key, folder.id);
          created.push(folder);
        }
        path = folderCache.get(key);
      }
      targetParent = path;
    }
    const item = {
      id: uid("file"), parentId: targetParent, type: "file", name: file.name,
      mime: file.type || "application/octet-stream", size: file.size,
      modifiedAt: file.lastModified || Date.now(), createdAt: Date.now(),
      lastOpenedAt: 0, starred: false, blob: file
    };
    await db.putItem(item);
    created.push(item);
    onProgress(index + 1, files.length);
  }
  return created;
}

export async function collectDescendantIds(items, id) {
  const ids = [id];
  const children = items.filter(item => item.parentId === id);
  for (const child of children) ids.push(...await collectDescendantIds(items, child.id));
  return ids;
}

export async function downloadItem(item) {
  if (!item?.blob) return;
  const url = URL.createObjectURL(item.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = item.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
