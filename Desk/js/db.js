const DB_NAME = "desk-lim-db";
const DB_VERSION = 1;

let dbPromise;

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("items")) {
        const items = db.createObjectStore("items", { keyPath: "id" });
        items.createIndex("parentId", "parentId", { unique: false });
        items.createIndex("lastOpenedAt", "lastOpenedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("lessons")) {
        db.createObjectStore("lessons", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function request(storeName, mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try { result = operation(store); } catch (error) { reject(error); return; }
    transaction.oncomplete = () => resolve(result?.result);
    transaction.onerror = () => reject(transaction.error || result?.error);
    transaction.onabort = () => reject(transaction.error || new Error("Operazione annullata"));
  });
}

export const db = {
  allItems: () => request("items", "readonly", store => store.getAll()),
  getItem: id => request("items", "readonly", store => store.get(id)),
  putItem: item => request("items", "readwrite", store => store.put(item)),
  deleteItem: id => request("items", "readwrite", store => store.delete(id)),
  allLessons: () => request("lessons", "readonly", store => store.getAll()),
  putLesson: lesson => request("lessons", "readwrite", store => store.put(lesson)),
  deleteLesson: id => request("lessons", "readwrite", store => store.delete(id)),
  async getSettings() {
    const rows = await request("settings", "readonly", store => store.getAll());
    return Object.fromEntries(rows.map(row => [row.key, row.value]));
  },
  putSetting: (key, value) => request("settings", "readwrite", store => store.put({ key, value })),
  async importBatch(items, lessons, settings) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(["items", "lessons", "settings"], "readwrite");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Importazione non riuscita"));
      tx.onabort = () => reject(tx.error || new Error("Importazione annullata"));
      try {
        for (const item of items) tx.objectStore("items").put(item);
        for (const lesson of lessons) tx.objectStore("lessons").put(lesson);
        for (const [key, value] of Object.entries(settings)) tx.objectStore("settings").put({ key, value });
      } catch (error) { tx.abort(); reject(error); }
    });
  },
  async estimate() {
    if (!navigator.storage?.estimate) return null;
    return navigator.storage.estimate();
  },
  async persist() {
    if (!navigator.storage?.persist) return false;
    return navigator.storage.persist();
  }
};

export function uid(prefix = "item") {
  return `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}
