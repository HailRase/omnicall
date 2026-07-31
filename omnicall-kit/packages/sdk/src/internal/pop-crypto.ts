/**
 * Browser PoP crypto (ADR-0016): ECDSA P-256, non-extractable private key,
 * IEEE-P1363 signatures (Web Crypto default; matches desktop sdkGatewayPopCrypto).
 */

import { buildPopSigningPayload, POP_KEY_ALGORITHM } from '@softomnitel/omnicall-protocol';

import { bytesToBase64Url } from './base64url.js';

const EC_PARAMS: EcKeyGenParams = {
  name: 'ECDSA',
  namedCurve: 'P-256'
};

const SIGN_PARAMS: EcdsaParams = {
  name: 'ECDSA',
  hash: 'SHA-256'
};

export type PopKeyPair = {
  readonly privateKey: CryptoKey;
  readonly publicKey: CryptoKey;
  readonly publicKeySpkiBase64Url: string;
};

export function assertWebCryptoAvailable(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    throw new Error('Web Crypto SubtleCrypto is unavailable');
  }
  return subtle;
}

export async function generatePopKeyPair(): Promise<PopKeyPair> {
  const subtle = assertWebCryptoAvailable();
  const pair = await subtle.generateKey(EC_PARAMS, false, ['sign', 'verify']);
  const spki = await subtle.exportKey('spki', pair.publicKey);
  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    publicKeySpkiBase64Url: bytesToBase64Url(spki)
  };
}

export async function signPopChallenge(input: {
  readonly privateKey: CryptoKey;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly origin: string;
  readonly clientId: string;
  readonly challengeId: string;
  readonly nonce: string;
}): Promise<string> {
  const subtle = assertWebCryptoAvailable();
  const payload = buildPopSigningPayload({
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    origin: input.origin,
    clientId: input.clientId,
    challengeId: input.challengeId,
    nonce: input.nonce
  });
  const signature = await subtle.sign(
    SIGN_PARAMS,
    input.privateKey,
    new TextEncoder().encode(payload)
  );
  return bytesToBase64Url(signature);
}

export function popKeyAlgorithmId(): typeof POP_KEY_ALGORITHM {
  return POP_KEY_ALGORITHM;
}
