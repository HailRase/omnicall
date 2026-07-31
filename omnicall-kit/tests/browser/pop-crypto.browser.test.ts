import { expect, test } from 'vitest';

import { generatePopKeyPair, signPopChallenge } from '../../packages/sdk/src/internal/pop-crypto.js';
import { createIndexedDbPopKeyStore } from '../../packages/sdk/src/internal/pop-key-store.js';

test('browser Web Crypto can generate non-extractable PoP keys and sign', async () => {
  const keys = await generatePopKeyPair();
  expect(keys.privateKey.extractable).toBe(false);
  const signature = await signPopChallenge({
    privateKey: keys.privateKey,
    serverInstanceId: 'srv_browser',
    sessionEpoch: 'epoch_browser',
    origin: 'https://crm.example',
    clientId: 'client_browser',
    challengeId: 'chal_browser',
    nonce: 'bm9uY2UxMjM'
  });
  expect(signature.length).toBeGreaterThan(20);
});

test('browser IndexedDB PoP store round-trips CryptoKey and clears', async () => {
  const installId = `browser-${crypto.randomUUID()}`;
  const store = createIndexedDbPopKeyStore({ installId });
  const keys = await generatePopKeyPair();
  await store.save({
    clientId: 'client_browser_idb',
    publicKeySpkiBase64Url: keys.publicKeySpkiBase64Url,
    privateKey: keys.privateKey,
    profile: 'presentation',
    grantedCapabilities: ['session.read.redacted']
  });
  const loaded = await store.load();
  expect(loaded?.clientId).toBe('client_browser_idb');
  expect(loaded?.privateKey.extractable).toBe(false);
  await store.clear();
  expect(await store.load()).toBeUndefined();
  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(0);
});
