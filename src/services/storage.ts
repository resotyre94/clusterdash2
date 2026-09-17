import { FinancialRecord, JobCardRecord, StoredFileMeta } from '../types';

const DB_NAME = 'elegancia_dashboard_db';
const DB_VERSION = 1;
const STORE_NAME = 'data_store';
const KEY_CURRENT = 'current_upload';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredPayload {
  meta: StoredFileMeta;
  rawData: FinancialRecord[];
  jcData: JobCardRecord[];
}

export async function saveUploadedData(payload: StoredPayload): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, KEY_CURRENT);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage', err);
    try {
      localStorage.setItem('elegancia_meta', JSON.stringify(payload.meta));
      localStorage.setItem('elegancia_raw_data', JSON.stringify(payload.rawData.slice(0, 3000)));
      localStorage.setItem('elegancia_jc_data', JSON.stringify(payload.jcData.slice(0, 3000)));
    } catch (e) {
      console.error('LocalStorage fallback also exceeded capacity', e);
    }
  }
}

export async function loadSavedData(): Promise<StoredPayload | null> {
  try {
    const db = await openDB();
    const result = await new Promise<StoredPayload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_CURRENT);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (result && result.rawData && result.rawData.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('IndexedDB read failed, checking localStorage', err);
  }

  // Fallback to localStorage
  try {
    const metaStr = localStorage.getItem('elegancia_meta');
    const rawStr = localStorage.getItem('elegancia_raw_data');
    const jcStr = localStorage.getItem('elegancia_jc_data');
    if (metaStr && rawStr) {
      return {
        meta: JSON.parse(metaStr),
        rawData: JSON.parse(rawStr),
        jcData: jcStr ? JSON.parse(jcStr) : []
      };
    }
  } catch (e) {
    console.error('Failed reading from localStorage', e);
  }

  return null;
}

export async function clearSavedData(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_CURRENT);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear error', err);
  }

  try {
    localStorage.removeItem('elegancia_meta');
    localStorage.removeItem('elegancia_raw_data');
    localStorage.removeItem('elegancia_jc_data');
  } catch (e) {
    // ignore
  }
}
