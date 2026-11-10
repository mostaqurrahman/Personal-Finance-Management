/**
 * IndexedDB storage for offline attachments and local queuing
 */

const DB_NAME = 'pfm_offline_store';
const DB_VERSION = 1;
const ATTACHMENT_STORE = 'attachments';
const QUEUE_STORE = 'sync_queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
        db.createObjectStore(ATTACHMENT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface OfflineAttachment {
  id: string;
  transactionId?: string;
  fileName: string;
  fileType: string;
  dataUrl: string; // Base64 data URL
  uploaded: boolean;
  createdAt: string;
}

export async function saveOfflineAttachment(attachment: OfflineAttachment): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE, 'readwrite');
    const store = tx.objectStore(ATTACHMENT_STORE);
    const req = store.put(attachment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineAttachments(): Promise<OfflineAttachment[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE, 'readonly');
    const store = tx.objectStore(ATTACHMENT_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineAttachment(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE, 'readwrite');
    const store = tx.objectStore(ATTACHMENT_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
