'use strict';
const CACHE = 'daunia-tempo-v2';
const PREFIX = 'daunia-tempo-';
const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./README.md",
  "./CREDITS.md",
  "./VALIDATION.md",
  "./data/images.json",
  "./data/deepening.json",
  "./data/reconstructions.json",
  "./assets/reconstructions/scaloria.webp",
  "./assets/reconstructions/corvo.webp",
  "./assets/reconstructions/coppa.webp",
  "./assets/reconstructions/saraceno.webp",
  "./assets/reconstructions/arpi.webp",
  "./assets/reconstructions/herdonia.webp",
  "./assets/reconstructions/ausculum.webp",
  "./assets/reconstructions/salapia-vetus.webp",
  "./assets/reconstructions/salapia.webp",
  "./assets/reconstructions/siponto.webp",
  "./assets/reconstructions/lucera.webp",
  "./assets/reconstructions/faragola.webp",
  "./assets/reconstructions/paglicci.webp",

  "./data/land.geojson",
  "./data/periods.json",
  "./data/rivers.geojson",
  "./data/sites.json",
  "./data/sources.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/photos/arpi.jpg",
  "./assets/photos/cervo.jpg",
  "./assets/photos/coppa.png",
  "./assets/photos/corvo.jpg",
  "./assets/photos/faragola.jpg",
  "./assets/photos/herdonia.jpg",
  "./assets/photos/landscape.jpg",
  "./assets/photos/paglicci.jpg",
  "./assets/photos/saraceno.jpg",
  "./assets/photos/siponto.jpg",
  "./vendor/LEAFLET-LICENSE.txt",
  "./vendor/leaflet.css",
  "./vendor/leaflet.js",
  "./vendor/images/layers.png",
  "./vendor/images/layers-2x.png",
  "./vendor/images/marker-icon.png",
  "./vendor/images/marker-icon-2x.png",
  "./vendor/images/marker-shadow.png",
  "../../pwa-common/gbprof-accessibility.css",
  "../../pwa-common/gbprof-accessibility.js",
  "../../privacy.html",
  "../../accessibilita.html"
];
const URLS = new Set(FILES.map(file => new URL(file, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(FILES); }
    catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = ''; url.hash = '';
  if (!URLS.has(url.href) && !(event.request.mode === 'navigate' && url.href.startsWith(self.registration.scope))) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url.href);
    if (hit) return hit;
    try { return await fetch(event.request); }
    catch(error) {
      if (event.request.mode === 'navigate') return cache.match(new URL('./index.html', self.registration.scope).href);
      throw error;
    }
  })());
});
