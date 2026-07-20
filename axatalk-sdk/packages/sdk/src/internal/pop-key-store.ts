/**
 * PoP private-key persistence (ADR-0016): IndexedDB only in browsers.
 * Never localStorage / sessionStorage. Tests use an in-memory store.
 */

import type { CapabilityId, PairingProfile } from '@axatalk/protocol';

/** Persisted PoP identity (private key non-extractable). @public */
export type StoredPopIdentity = {
  readonly clientId: string;
  readonly publicKeySpkiBase64Url: string;
  readonly privateKey: CryptoKey;
  readonly profile: PairingProfile | undefined;
  readonly grantedCapabilities: readonly CapabilityId[];
};

/** PoP key persistence port (IndexedDB in browsers). @public */
export type PopKeyStore = {
  readonly load: () => Promise<StoredPopIdentity | undefined>;
  readonly save: (identity: StoredPopIdentity) => Promise<void>;
  readonly clear: () => Promise<void>;
};

const DB_NAME_PREFIX = 'axatalk-sdk-pop';
const STORE_NAME = 'identities';
const RECORD_KEY = 'primary';

type StoredRecord = {
  readonly clientId: string;
  readonly publicKeySpkiBase64Url: string;
  readonly privateKey: CryptoKey;
  readonly profile?: PairingProfile;
  readonly grantedCapabilities: readonly CapabilityId[];
};

/** In-memory key store for tests and non-browser runners. @public */
export function createMemoryPopKeyStore(
  initial?: StoredPopIdentity
): PopKeyStore & { readonly peek: () => StoredPopIdentity | undefined } {
  let current: StoredPopIdentity | undefined = initial;
  return {
    peek: () => current,
    load: () => Promise.resolve(current),
    save: (identity) => {
      current = identity;
      return Promise.resolve();
    },
    clear: () => {
      current = undefined;
      return Promise.resolve();
    }
  };
}

/** IndexedDB-backed PoP store (never localStorage/sessionStorage). @public */
export function createIndexedDbPopKeyStore(input: {
  readonly installId: string;
}): PopKeyStore {
  const dbName = `${DB_NAME_PREFIX}:${input.installId}`;

  const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB open failed'));
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
    });

  return {
    load: async () => {
      const db = await openDb();
      try {
        const record = await idbGet(db, RECORD_KEY);
        if (record === undefined) {
          return undefined;
        }
        return Object.freeze({
          clientId: record.clientId,
          publicKeySpkiBase64Url: record.publicKeySpkiBase64Url,
          privateKey: record.privateKey,
          profile: record.profile,
          grantedCapabilities: Object.freeze([...record.grantedCapabilities])
        });
      } finally {
        db.close();
      }
    },
    save: async (identity) => {
      const db = await openDb();
      try {
        const record: StoredRecord = {
          clientId: identity.clientId,
          publicKeySpkiBase64Url: identity.publicKeySpkiBase64Url,
          privateKey: identity.privateKey,
          ...(identity.profile !== undefined ? { profile: identity.profile } : {}),
          grantedCapabilities: [...identity.grantedCapabilities]
        };
        await idbPut(db, RECORD_KEY, record);
      } finally {
        db.close();
      }
    },
    clear: async () => {
      const db = await openDb();
      try {
        await idbDelete(db, RECORD_KEY);
      } finally {
        db.close();
      }
    }
  };
}

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('clientId' in value) || typeof value.clientId !== 'string') {
    return false;
  }
  if (
    !('publicKeySpkiBase64Url' in value) ||
    typeof value.publicKeySpkiBase64Url !== 'string'
  ) {
    return false;
  }
  if (!('privateKey' in value) || !(value.privateKey instanceof CryptoKey)) {
    return false;
  }
  if (!('grantedCapabilities' in value) || !Array.isArray(value.grantedCapabilities)) {
    return false;
  }
  return true;
}

function idbGet(db: IDBDatabase, key: string): Promise<StoredRecord | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB get failed'));
    };
    request.onsuccess = () => {
      const value: unknown = request.result;
      if (value === undefined || value === null) {
        resolve(undefined);
        return;
      }
      if (!isStoredRecord(value)) {
        reject(new Error('IndexedDB record shape invalid'));
        return;
      }
      resolve(value);
    };
  });
}

function idbPut(db: IDBDatabase, key: string, value: StoredRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(value, key);
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB put failed'));
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).delete(key);
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB delete failed'));
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}
