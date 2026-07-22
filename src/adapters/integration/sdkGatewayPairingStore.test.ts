/**
 * Pairing store: revoke hard-deletes; legacy soft-revoked purged from list.
 */

import { describe, expect, it } from "vitest";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";

import { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type { SdkPairedClientRecord } from "./sdkGatewayPairingTypes.js";

function activeRecord(
  overrides: Partial<SdkPairedClientRecord> = {},
): SdkPairedClientRecord {
  return {
    clientId: "client_a",
    origin: "http://127.0.0.1:8765",
    publicKey: "pk",
    keyAlgorithm: "ECDSA-P256-SHA256",
    profile: "presentation",
    grantedCapabilities: ["session.read.redacted"],
    applicationName: "demo",
    applicationVersion: "1.0.0",
    createdAt: "2026-07-22T00:00:00.000Z",
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("SdkGatewayPairingStore revoke hard-delete", () => {
  it("removes client from storage and public list on revoke", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    await store.save(activeRecord());

    expect((await store.listPublic()).map((c) => c.clientId)).toEqual([
      "client_a",
    ]);
    expect(await store.revoke("client_a")).toBe(true);
    expect(await store.get("client_a")).toBeNull();
    expect(await store.listPublic()).toEqual([]);
    expect(await store.revoke("client_a")).toBe(false);
  });

  it("purges legacy soft-revoked tombstones on listPublic", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    await store.save(
      activeRecord({
        clientId: "client_old",
        revokedAt: "2026-07-21T00:00:00.000Z",
      }),
    );
    await store.save(activeRecord({ clientId: "client_live" }));

    const listed = await store.listPublic();
    expect(listed.map((c) => c.clientId)).toEqual(["client_live"]);
    expect(await store.get("client_old")).toBeNull();
  });
});
