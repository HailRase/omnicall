import { createPublicKey, verify } from 'node:crypto';

import { buildPopSigningPayload } from '@axata/axatalk-protocol';
import { describe, expect, it } from 'vitest';

import { base64UrlToBytes, bytesToBase64Url } from './base64url.js';
import { generatePopKeyPair, signPopChallenge } from './pop-crypto.js';

/**
 * Interop oracle: Web Crypto ECDSA-P256 signatures must verify with Node
 * `crypto.verify` + `dsaEncoding: 'ieee-p1363'` — the same path as desktop
 * `sdkGatewayPopCrypto.verifySdkPopSignature` (DI-04).
 */
describe('PoP crypto interop with desktop verify semantics', () => {
  it('signs canonical ADR-0016 payload verifiable by Node ieee-p1363', async () => {
    const keys = await generatePopKeyPair();
    const parts = {
      serverInstanceId: 'srv_1',
      sessionEpoch: 'epoch_1',
      origin: 'https://crm.example',
      clientId: 'client_1',
      challengeId: 'chal_1',
      nonce: 'bm9uY2UxMjM'
    };
    const signature = await signPopChallenge({
      privateKey: keys.privateKey,
      ...parts
    });
    const payload = buildPopSigningPayload(parts);
    const publicKey = createPublicKey({
      key: Buffer.from(base64UrlToBytes(keys.publicKeySpkiBase64Url)),
      format: 'der',
      type: 'spki'
    });
    const ok = verify(
      'sha256',
      Buffer.from(payload, 'utf8'),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(base64UrlToBytes(signature))
    );
    expect(ok).toBe(true);
    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(keys.publicKeySpkiBase64Url).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects tampered origin under the same verify oracle', async () => {
    const keys = await generatePopKeyPair();
    const signature = await signPopChallenge({
      privateKey: keys.privateKey,
      serverInstanceId: 'srv_1',
      sessionEpoch: 'epoch_1',
      origin: 'https://crm.example',
      clientId: 'client_1',
      challengeId: 'chal_1',
      nonce: 'bm9uY2UxMjM'
    });
    const tampered = buildPopSigningPayload({
      serverInstanceId: 'srv_1',
      sessionEpoch: 'epoch_1',
      origin: 'https://evil.example',
      clientId: 'client_1',
      challengeId: 'chal_1',
      nonce: 'bm9uY2UxMjM'
    });
    const publicKey = createPublicKey({
      key: Buffer.from(base64UrlToBytes(keys.publicKeySpkiBase64Url)),
      format: 'der',
      type: 'spki'
    });
    const ok = verify(
      'sha256',
      Buffer.from(tampered, 'utf8'),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(base64UrlToBytes(signature))
    );
    expect(ok).toBe(false);
  });

  it('round-trips base64url without secrets in the alphabet checks', () => {
    const bytes = new Uint8Array([1, 2, 3, 250, 255]);
    const encoded = bytesToBase64Url(bytes);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(base64UrlToBytes(encoded)).toEqual(bytes);
  });
});
