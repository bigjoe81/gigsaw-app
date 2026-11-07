import { Injectable } from '@angular/core';

/** One IndexedDB database for metadata and audio/PDF bytes. A write resolves only on commit. */
@Injectable({ providedIn: 'root' })
export class LocalStore {
  private database?: Promise<IDBDatabase>;
  private open(): Promise<IDBDatabase> {
    return (this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('gigsaw-live-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.database = undefined;
        reject(request.error);
      };
      request.onblocked = () =>
        reject(new Error('Chiudi le altre finestre di Gigsaw Live e riprova.'));
    }));
  }
  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('local').objectStore('local').get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }
  async entries<T>(prefix: string): Promise<Array<{ key: string; value: T }>> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const result: Array<{ key: string; value: T }> = [];
      const request = db
        .transaction('local')
        .objectStore('local')
        .openCursor(IDBKeyRange.bound(prefix, prefix + '\uffff'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(result);
          return;
        }
        result.push({ key: String(cursor.key), value: cursor.value as T });
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  }
  async write(
    values: Array<{ key: string; value: unknown }>,
    remove: string[] = [],
  ): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('local', 'readwrite');
      const store = tx.objectStore('local');
      for (const item of values) store.put(item.value, item.key);
      for (const key of remove) store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(tx.error ?? new Error('Salvataggio interrotto.'));
      tx.onerror = () => reject(tx.error);
    });
  }
}
