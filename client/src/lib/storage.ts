import type { Job } from "../types";

const API_KEY_KEY = "ezmo_fal_api_key";
const JOBS_KEY = "ezmo_jobs";
const DB_NAME = "ezmo_crypto";
const STORE_NAME = "keys";
const CRYPTO_KEY_ID = "api_key_encryption";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOrCreateCryptoKey(): Promise<CryptoKey> {
  const db = await openDB();

  const existing = await new Promise<CryptoKey | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(CRYPTO_KEY_ID);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  );

  if (existing) {
    db.close();
    return existing;
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(key, CRYPTO_KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
  return key;
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getApiKey(): Promise<string> {
  const stored = localStorage.getItem(API_KEY_KEY);
  if (!stored) return "";

  try {
    const { iv, ciphertext } = JSON.parse(stored);
    const key = await getOrCreateCryptoKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(fromBase64(iv)) },
      key,
      fromBase64(ciphertext)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed (e.g. old plaintext value or corrupted data) — clear it
    localStorage.removeItem(API_KEY_KEY);
    return "";
  }
}

export async function setApiKey(apiKey: string): Promise<void> {
  if (!apiKey) {
    localStorage.removeItem(API_KEY_KEY);
    return;
  }

  const key = await getOrCreateCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  localStorage.setItem(
    API_KEY_KEY,
    JSON.stringify({
      iv: toBase64(iv.buffer),
      ciphertext: toBase64(ciphertext),
    })
  );
}

export function getJobs(): Record<string, Job> {
  try {
    const stored = localStorage.getItem(JOBS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveJobs(jobs: Record<string, Job>): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}
