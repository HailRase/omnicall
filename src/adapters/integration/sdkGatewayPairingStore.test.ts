/**
 * Pairing store: revoke hard-deletes; legacy soft-revoked purged from list;
 * corrupt secret_load_failed recovered without breaking Settings.
 */

import { describe, expect, it, vi } from "vitest";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import type {
  SecretStoragePort,
  SecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";
import {
  createSecretStorageScopeKey,
  SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
  SDK_PAIRING_SCOPE_KEY,
} from "@ports/secrets/SecretStoragePort.js";

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

class FailingIndexSecretStorage implements SecretStoragePort {
  readonly deletes: string[] = [];
  private readonly inner = new InMemorySecretStorageAdapter();
  private failIndex = true;

  async saveSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
    value: string,
  ): Promise<void> {
    await this.inner.saveSecret(scopeKey, secretId, value);
  }

  async loadSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
  ): Promise<string | null> {
    if (this.failIndex && secretId === SDK_PAIRED_CLIENTS_INDEX_SECRET_ID) {
      throw new Error("secret_load_failed");
    }
    return this.inner.loadSecret(scopeKey, secretId);
  }

  async deleteSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
  ): Promise<void> {
    this.deletes.push(secretId);
    await this.inner.deleteSecret(scopeKey, secretId);
  }

  stopFailingIndex(): void {
    this.failIndex = false;
  }
}

class FailingClientSecretStorage implements SecretStoragePort {
  readonly deletes: string[] = [];
  private readonly inner = new InMemorySecretStorageAdapter();
  private readonly failClientId: string;

  constructor(failClientId: string) {
    this.failClientId = failClientId;
  }

  async saveSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
    value: string,
  ): Promise<void> {
    await this.inner.saveSecret(scopeKey, secretId, value);
  }

  async loadSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
  ): Promise<string | null> {
    if (secretId === `paired-client:${this.failClientId}`) {
      throw new Error("secret_load_failed");
    }
    return this.inner.loadSecret(scopeKey, secretId);
  }

  async deleteSecret(
    scopeKey: SecretStorageScopeKey,
    secretId: string,
  ): Promise<void> {
    this.deletes.push(secretId);
    await this.inner.deleteSecret(scopeKey, secretId);
  }
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

  it("recovers when paired-clients index load throws secret_load_failed", async () => {
    const secrets = new FailingIndexSecretStorage();
    const store = new SdkGatewayPairingStore(secrets);

    await expect(store.listPublic()).resolves.toEqual([]);
    expect(secrets.deletes).toContain(SDK_PAIRED_CLIENTS_INDEX_SECRET_ID);

    secrets.stopFailingIndex();
    await store.save(activeRecord());
    expect((await store.listPublic()).map((c) => c.clientId)).toEqual([
      "client_a",
    ]);
  });

  it("purges corrupt client blob and keeps healthy peers on listPublic", async () => {
    const secrets = new FailingClientSecretStorage("client_bad");
    const store = new SdkGatewayPairingStore(secrets);
    const scope = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);

    await store.save(activeRecord({ clientId: "client_good" }));
    await secrets.saveSecret(
      scope,
      SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
      JSON.stringify(["client_good", "client_bad"]),
    );

    const listed = await store.listPublic();
    expect(listed.map((c) => c.clientId)).toEqual(["client_good"]);
    expect(secrets.deletes).toContain("paired-client:client_bad");

    const reloaded = await store.listPublic();
    expect(reloaded.map((c) => c.clientId)).toEqual(["client_good"]);
  });

  it("findActive returns null when client secret load fails", async () => {
    const secrets = new FailingClientSecretStorage("client_a");
    const store = new SdkGatewayPairingStore(secrets);
    const spy = vi.spyOn(secrets, "deleteSecret");

    await expect(
      store.findActive("client_a", "http://127.0.0.1:8765", Date.now()),
    ).resolves.toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});
