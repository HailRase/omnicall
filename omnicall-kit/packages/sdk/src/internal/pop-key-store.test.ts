import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { generatePopKeyPair } from './pop-crypto.js';
import {
  createIndexedDbPopKeyStore,
  createMemoryPopKeyStore
} from './pop-key-store.js';

async function deleteDb(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error ?? new Error('deleteDatabase failed'));
    };
    request.onblocked = () => {
      resolve();
    };
  });
}

describe('createMemoryPopKeyStore', () => {
  it('round-trips and clears without touching web storage', async () => {
    const keys = await generatePopKeyPair();
    const store = createMemoryPopKeyStore();
    const identity = {
      clientId: 'client_mem_001',
      publicKeySpkiBase64Url: keys.publicKeySpkiBase64Url,
      privateKey: keys.privateKey,
      profile: 'presentation' as const,
      grantedCapabilities: ['session.read.redacted' as const]
    };
    await store.save(identity);
    expect(store.peek()?.clientId).toBe('client_mem_001');
    expect((await store.load())?.clientId).toBe('client_mem_001');
    await store.clear();
    expect(store.peek()).toBeUndefined();
    expect(typeof localStorage).toBe('undefined');
    expect(typeof sessionStorage).toBe('undefined');
  });
});

describe('createIndexedDbPopKeyStore', () => {
  const installId = 'test-install-sdk04';
  const dbName = `omnicall-kit-pop:${installId}`;

  afterEach(async () => {
    await deleteDb(dbName);
  });

  it('persists non-extractable CryptoKey via IndexedDB only', async () => {
    const keys = await generatePopKeyPair();
    expect(keys.privateKey.extractable).toBe(false);
    const store = createIndexedDbPopKeyStore({ installId });
    expect(await store.load()).toBeUndefined();

    await store.save({
      clientId: 'client_idb_001',
      publicKeySpkiBase64Url: keys.publicKeySpkiBase64Url,
      privateKey: keys.privateKey,
      profile: 'presentation',
      grantedCapabilities: ['session.read.redacted', 'window.show']
    });

    const loaded = await store.load();
    expect(loaded?.clientId).toBe('client_idb_001');
    expect(loaded?.privateKey).toBeInstanceOf(CryptoKey);
    expect(loaded?.privateKey.extractable).toBe(false);
    expect(loaded?.grantedCapabilities).toEqual([
      'session.read.redacted',
      'window.show'
    ]);

    // Second store instance proves durable IDB persistence (not memory).
    const reopened = createIndexedDbPopKeyStore({ installId });
    const again = await reopened.load();
    expect(again?.clientId).toBe('client_idb_001');
    expect(again?.publicKeySpkiBase64Url).toBe(keys.publicKeySpkiBase64Url);

    await reopened.clear();
    expect(await reopened.load()).toBeUndefined();
    expect(await store.load()).toBeUndefined();
  });

  it('rejects relying on localStorage / sessionStorage globals for PoP material', () => {
    expect(typeof indexedDB).toBe('object');
    expect(typeof localStorage).toBe('undefined');
    expect(typeof sessionStorage).toBe('undefined');
  });
});
