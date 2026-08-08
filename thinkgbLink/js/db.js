(function () {
  'use strict';

  const DB_NAME = 'thinkgbLinkDB';
  const DB_VERSION = 1;
  const STORE = 'projects';
  let dbPromise;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB non disponibile'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Apertura archivio non riuscita'));
      request.onblocked = () => reject(new Error('Archivio bloccato da un’altra scheda'));
    });
    return dbPromise;
  }

  async function transaction(mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let request;
      try { request = operation(store); } catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(request && request.result);
      tx.onerror = () => reject(tx.error || (request && request.error) || new Error('Operazione non riuscita'));
      tx.onabort = () => reject(tx.error || new Error('Operazione annullata'));
    });
  }

  const api = {
    save(project) { return transaction('readwrite', store => store.put(project)); },
    get(id) { return transaction('readonly', store => store.get(id)); },
    delete(id) { return transaction('readwrite', store => store.delete(id)); },
    async all() {
      const projects = await transaction('readonly', store => store.getAll());
      return (projects || []).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }
  };

  window.ThinkgbDB = api;
})();
