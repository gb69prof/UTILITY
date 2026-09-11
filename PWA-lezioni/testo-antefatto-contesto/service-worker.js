const CACHE_NAME = "testo-antefatto-contesto-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./img/Home.webp",
  "./img/Testo-antefatto-contesto.webp",
  "./img/Testo.webp",
  "./img/Antefatto.webp",
  "./img/Contesto.webp",
  "./img/Vita-testo.webp",
  "./img/Vita-antefatto.webp",
  "./img/Vita-contesto.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("testo-antefatto-contesto-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(event.request, { ignoreSearch: event.request.mode === "navigate" })).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
