import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const root=new URL('../',import.meta.url), scope='https://example.test/UTILITY/PWA-lezioni/gb-linea-tempo/';
function harness(){
 const listeners={},cacheStore=new Map([['unrelated-pwa-v1',new Map()],['gb-linea-tempo-old',new Map()]]);let claimed=false,network=true,networkCalls=0;
 const normalize=r=>new URL(typeof r==='string'?r:r.url,scope).href;
 const caches={keys:async()=>[...cacheStore.keys()],delete:async k=>cacheStore.delete(k),open:async k=>{if(!cacheStore.has(k))cacheStore.set(k,new Map());const store=cacheStore.get(k);return {addAll:async files=>{const entries=files.map(f=>{const local=f==='./'?'./index.html':f;return [normalize(f),new Response(fs.readFileSync(new URL(local,root)))]});for(const [f,data]of entries)store.set(f,data);},match:async(r,options)=>{let key=normalize(r);if(options?.ignoreSearch)key=key.split('?')[0];return store.get(key)?.clone();}};}};
 const self={location:{origin:'https://example.test'},registration:{scope},clients:{claim:async()=>{claimed=true;}},addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{self,caches,URL,fetch:async()=>{networkCalls++;if(!network)throw Error('offline');return new Response('network');}});
 async function lifecycle(name){let pending;listeners[name]({waitUntil:p=>pending=p});await pending;}
 async function request(url,mode='cors',method='GET'){let pending;listeners.fetch({request:{url,mode,method},respondWith:p=>pending=p});return pending===undefined?undefined:await pending;}
 return {lifecycle,request,cacheStore,setOffline:()=>{network=false;},get networkCalls(){return networkCalls;},get claimed(){return claimed;}};
}
test('Installation stores all core resources; offline navigation, modules, JSON and images resolve',async()=>{const h=harness();await h.lifecycle('install');await h.lifecycle('activate');h.setOffline();for(const relative of ['./','./index.html','./app.mjs','./chronology.mjs','./style.css','./data/civilizations.json','./assets/epochs.png','./assets/icon-192.png']){const response=await h.request(new URL(relative,scope).href,'navigate');assert.ok(response?.ok,relative);assert.ok((await response.arrayBuffer()).byteLength>0,relative);}assert.equal(h.networkCalls,0);});
test('Query variants and uncached offline navigations fall back within app scope',async()=>{const h=harness();await h.lifecycle('install');h.setOffline();assert.ok((await h.request(scope+'?source=homescreen','navigate'))?.ok);assert.ok((await h.request(scope+'uncached-page','navigate'))?.ok);});
test('Activation keeps other PWA caches and only deletes old app versions',async()=>{const h=harness();await h.lifecycle('install');await h.lifecycle('activate');assert.ok(h.cacheStore.has('unrelated-pwa-v1'));assert.ok(!h.cacheStore.has('gb-linea-tempo-old'));assert.ok(h.claimed);});
test('External links, other PWA paths and non-GET requests are never intercepted',async()=>{const h=harness();await h.lifecycle('install');for(const url of ['https://www.worldhistory.org/','https://example.test/UTILITY/index.html','https://example.test/UTILITY/Lezioni/'])assert.equal(await h.request(url),undefined);assert.equal(await h.request(scope,'cors','POST'),undefined);});
