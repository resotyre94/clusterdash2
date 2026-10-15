import { upload } from '@vercel/blob/client';
import type { StoredPayload } from './storage';

function isStoredPayload(value: unknown): value is StoredPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<StoredPayload>;
  return Boolean(
    payload.meta &&
    typeof payload.meta === 'object' &&
    Array.isArray(payload.rawData) &&
    Array.isArray(payload.jcData),
  );
}

/** Loads the centrally published dataset; 404 means no shared upload exists yet. */
export async function loadCloudDataset(): Promise<StoredPayload | null> {
  const response = await fetch('/api/dataset', { method: 'GET', cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Shared dataset could not be loaded (HTTP ${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!isStoredPayload(payload)) {
    throw new Error('The shared dataset response is not in the expected format.');
  }
  return payload;
}

/** Uploads the large JSON payload directly to private Blob storage, then publishes its pointer. */
export async function saveCloudDataset(payload: StoredPayload): Promise<void> {
  const pathname = `datasets/dataset-${Date.now()}-${crypto.randomUUID()}.json`;
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

  const uploaded = await upload(pathname, jsonBlob, {
    access: 'private',
    handleUploadUrl: '/api/blob-upload',
    
  });

  const response = await fetch('/api/dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathname: uploaded.pathname, meta: payload.meta }),
  });

  if (!response.ok) {
    let message = `Shared dataset could not be published (HTTP ${response.status}).`;
    try {
      const result = await response.json();
      if (typeof result?.error === 'string') message = result.error;
    } catch {
      // Keep the safe fallback message if the endpoint did not return JSON.
    }
    throw new Error(message);
  }
}
