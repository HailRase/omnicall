import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  generateSdkPopTestKeyPair,
  isValidSdkPopPublicKey,
  signSdkPopPayload,
  verifySdkPopSignature,
} from "./sdkGatewayPopCrypto.js";

function spkiBase64UrlForCurve(namedCurve: string): string {
  const { publicKey } = generateKeyPairSync("ec", { namedCurve });
  const spki = publicKey.export({ type: "spki", format: "der" });
  return Buffer.from(spki).toString("base64url");
}

describe("sdkGatewayPopCrypto", () => {
  it("verifies a valid IEEE-P1363 PoP signature", () => {
    const keys = generateSdkPopTestKeyPair();
    expect(isValidSdkPopPublicKey(keys.publicKeyBase64Url)).toBe(true);
    const parts = {
      serverInstanceId: "srv_1",
      sessionEpoch: "epoch_1",
      origin: "https://crm.example",
      clientId: "client_1",
      challengeId: "chal_1",
      nonce: "bm9uY2UxMjM",
    };
    const signature = signSdkPopPayload({
      privateKey: keys.privateKey,
      ...parts,
    });
    expect(
      verifySdkPopSignature({
        publicKeyBase64Url: keys.publicKeyBase64Url,
        ...parts,
        signatureBase64Url: signature,
      }),
    ).toBe(true);
  });

  it("rejects tampered origin in PoP payload", () => {
    const keys = generateSdkPopTestKeyPair();
    const signature = signSdkPopPayload({
      privateKey: keys.privateKey,
      serverInstanceId: "srv_1",
      sessionEpoch: "epoch_1",
      origin: "https://crm.example",
      clientId: "client_1",
      challengeId: "chal_1",
      nonce: "bm9uY2UxMjM",
    });
    expect(
      verifySdkPopSignature({
        publicKeyBase64Url: keys.publicKeyBase64Url,
        serverInstanceId: "srv_1",
        sessionEpoch: "epoch_1",
        origin: "https://evil.example",
        clientId: "client_1",
        challengeId: "chal_1",
        nonce: "bm9uY2UxMjM",
        signatureBase64Url: signature,
      }),
    ).toBe(false);
  });

  it("rejects invalid public keys", () => {
    expect(isValidSdkPopPublicKey("not-a-key")).toBe(false);
    expect(isValidSdkPopPublicKey("YWJj")).toBe(false);
  });

  it("rejects non-P-256 EC SPKI (P-384 and secp256k1)", () => {
    expect(isValidSdkPopPublicKey(spkiBase64UrlForCurve("P-384"))).toBe(false);
    expect(isValidSdkPopPublicKey(spkiBase64UrlForCurve("secp256k1"))).toBe(
      false,
    );
    expect(isValidSdkPopPublicKey(spkiBase64UrlForCurve("P-256"))).toBe(true);
  });
});
