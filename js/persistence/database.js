/** Repositorio IndexedDB. La confirmación de escritura espera al commit real. */
(() => {
  'use strict';
  const Game = window.RainGame;
  let opening = null;
  function open() {
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB no está disponible. Podés jugar y exportar un respaldo.'));
      const request = window.indexedDB.open('antes-de-la-lluvia', 1);
      let failed = false;
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves');
      };
      request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento del navegador.'));
      request.onblocked = () => { failed = true; reject(new Error('Cerrá otras pestañas del juego para habilitar el almacenamiento.')); };
      request.onsuccess = () => {
        const db = request.result;
        if (failed) { db.close(); return; }
        db.onversionchange = () => { db.close(); opening = null; };
        resolve(db);
      };
    }).catch(error => { opening = null; throw error; });
    return opening;
  }

  async function read(key = 'current') {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readonly');
      const request = tx.objectStore('saves').get(key);
      tx.oncomplete = () => resolve(request.result ?? null);
      tx.onabort = tx.onerror = () => reject(new Error('No se pudo leer la partida.'));
    });
  }

  /** Guarda anterior y actual en la misma transacción; un fallo no borra ninguna. */
  async function write(envelope, archive = false) {
    Game.saveFormat.validate(envelope);
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      const store = tx.objectStore('saves');
      const previous = store.get('current');
      previous.onsuccess = () => {
        try {
          if (previous.result) {
            store.put(previous.result, 'previous');
            if (archive) store.put(previous.result, `backup-${Date.now()}-${Math.random().toString(36).slice(2)}`);
          }
          store.put(envelope, 'current');
        } catch {
          try { tx.abort(); } catch { /* Ya abortada por el navegador. */ }
          reject(new Error('No se pudo completar la escritura. La copia anterior se conserva.'));
        }
      };
      tx.oncomplete = () => resolve(envelope);
      tx.onabort = tx.onerror = () => reject(new Error('No se pudo guardar (espacio o permisos). La copia anterior se conserva. Exportá un respaldo.'));
    });
  }
  async function backups() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readonly');
      const request = tx.objectStore('saves').getAllKeys();
      tx.oncomplete = () => resolve(request.result.filter(key => typeof key === 'string' && key.startsWith('backup-')).sort().reverse());
      tx.onabort = tx.onerror = () => reject(new Error('No se pudieron consultar los respaldos.'));
    });
  }
  Game.database = { read, write, backups };
})();
