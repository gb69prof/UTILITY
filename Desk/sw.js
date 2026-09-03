const CACHE_PREFIX = "desk-lim-shell-";
const CACHE = `${CACHE_PREFIX}v3`;
const SHELL = [
  "./", "./index.html", "./lim.html", "./manifest.webmanifest", "./css/main.css",
  "./js/app.js", "./js/db.js", "./js/files.js", "./js/viewer.js", "./js/lessons.js",
  "./js/lim-controller.js", "./js/lim-viewer.js", "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./assets/img/og.png", "./assets/img/desk-grid.webp",
  "../privacy.html", "../accessibilita.html", "../pwa-common/gbprof-accessibility.css", "../pwa-common/gbprof-accessibility.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => {
    const network = fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error()));
    return cached || network;
  }));
});
