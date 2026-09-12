// Atomic, versioned offline snapshot. A new version waits for existing clients
// to close, avoiding a mixed UI/data version. Cache only this PWA's resources.
const CACHE='gb-linea-tempo-v1';
const FILES=["./", "./index.html", "./style.css", "./app.mjs", "./chronology.mjs", "./manifest.webmanifest", "./data/civilizations.json", "./data/epochs.json", "./assets/castle.svg", "./assets/city.svg", "./assets/dome.svg", "./assets/epochs.png", "./assets/factory.svg", "./assets/globe.svg", "./assets/grain.svg", "./assets/horse.svg", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon.svg", "./assets/CREDITS.md", "./assets/pagoda.svg", "./assets/people.svg", "./assets/pyramid.svg", "./assets/rome.svg", "./assets/ship.svg", "./assets/stone.svg", "./assets/temple.svg", "./assets/bronze.svg", "./assets/scroll.svg", "./assets/terraces.svg"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('gb-linea-tempo-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(event.request,{ignoreSearch:true});
  if(cached)return cached;
  try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return await cache.match('./index.html');throw error;}
 })());
});
