/**
 * ECDSA P-256 PoP verify helpers (DI-04 / ADR-0016).
 * Uses Node `crypto.verify` with IEEE-P1363 signatures (Web Crypto wire format).
 */

import {
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

import { buildPopSigningPayload } from "@softomnitel/omnicall-protocol";

/** Node `asymmetricKeyDetails.namedCurve` for Web Crypto P-256 (ADR-0016). */
export const SDK_POP_NAMED_CURVE = "prime256v1" as const;

/** Decode base64url to Buffer (Node Buffer accepts base64url). */
export function decodeSdkBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

/** Import SPKI public key (base64url) as EC P-256 KeyObject; null if invalid. */
export function importSdkPopPublicKey(
  clientPublicKeyBase64Url: string,
): KeyObject | null {
  try {
    const der = decodeSdkBase64Url(clientPublicKeyBase64Url);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    if (key.asymmetricKeyType !== "ec") {
      return null;
    }
    if (key.asymmetricKeyDetails?.namedCurve !== SDK_POP_NAMED_CURVE) {
      return null;
    }
    return key;
  } catch {
    return null;
  }
}

/** True when SPKI base64url is a usable EC public key. */
export function isValidSdkPopPublicKey(clientPublicKeyBase64Url: string): boolean {
  return importSdkPopPublicKey(clientPublicKeyBase64Url) !== null;
}

export function verifySdkPopSignature(input: {
  readonly publicKeyBase64Url: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly origin: string;
  readonly clientId: string;
  readonly challengeId: string;
  readonly nonce: string;
  readonly signatureBase64Url: string;
}): boolean {
  const key = importSdkPopPublicKey(input.publicKeyBase64Url);
  if (key === null) {
    return false;
  }
  const payload = buildPopSigningPayload({
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    origin: input.origin,
    clientId: input.clientId,
    challengeId: input.challengeId,
    nonce: input.nonce,
  });
  try {
    const signature = decodeSdkBase64Url(input.signatureBase64Url);
    return verify(
      "sha256",
      Buffer.from(payload, "utf8"),
      { key, dsaEncoding: "ieee-p1363" },
      signature,
    );
  } catch {
    return false;
  }
}

/** Test helper: generate P-256 keypair + base64url SPKI public key. */
export function generateSdkPopTestKeyPair(): {
  readonly publicKeyBase64Url: string;
  readonly privateKey: KeyObject;
} {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const spki = publicKey.export({ type: "spki", format: "der" });
  return {
    publicKeyBase64Url: Buffer.from(spki).toString("base64url"),
    privateKey,
  };
}

/** Test helper: sign PoP canonical payload (IEEE-P1363). */
export function signSdkPopPayload(input: {
  readonly privateKey: KeyObject;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly origin: string;
  readonly clientId: string;
  readonly challengeId: string;
  readonly nonce: string;
}): string {
  const payload = buildPopSigningPayload({
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    origin: input.origin,
    clientId: input.clientId,
    challengeId: input.challengeId,
    nonce: input.nonce,
  });
  const signature = sign("sha256", Buffer.from(payload, "utf8"), {
    key: input.privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return Buffer.from(signature).toString("base64url");
}
