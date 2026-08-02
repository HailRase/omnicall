/**
 * Pairing store: Origin+clientId v2 keys, legacy migration, revoke, fail-closed.
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

import {
  buildLegacySdkPairedClientSecretId,
  buildSdkPairedClientSecretId,
} from "./sdkGatewayPairingSecretIds.js";
import { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type { SdkPairedClientRecord } from "./sdkGatewayPairingTypes.js";

const ORIGIN_A = "http://127.0.0.1:8765";
const ORIGIN_B = "https://crm.other.example";

function activeRecord(
  overrides: Partial<SdkPairedClientRecord> = {},
): SdkPairedClientRecord {
  return {
    clientId: "client_a",
    origin: ORIGIN_A,
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
  private readonly failSecretId: string;

  constructor(failSecretId: string) {
    this.failSecretId = failSecretId;
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
    if (secretId === this.failSecretId) {
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

describe("SdkGatewayPairingStore Origin+clientId", () => {
  it("persists under distinct v2 secret ids per Origin", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    const scope = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);
    await store.save(activeRecord({ clientId: "shared", origin: ORIGIN_A }));
    await store.save(
      activeRecord({
        clientId: "shared",
        origin: ORIGIN_B,
        publicKey: "pk_b",
        applicationName: "other",
      }),
    );

    const aId = buildSdkPairedClientSecretId(ORIGIN_A, "shared");
    const bId = buildSdkPairedClientSecretId(ORIGIN_B, "shared");
    expect(aId).not.toBe(bId);
    expect(aId.includes("://")).toBe(false);
    expect(await secrets.loadSecret(scope, aId)).not.toBeNull();
    expect(await secrets.loadSecret(scope, bId)).not.toBeNull();
    expect(
      await secrets.loadSecret(scope, buildLegacySdkPairedClientSecretId("shared")),
    ).toBeNull();

    const listed = await store.listPublic();
    expect(listed).toHaveLength(2);
    expect(await store.findActive("shared", ORIGIN_A, Date.now())).toMatchObject({
      publicKey: "pk",
    });
    expect(await store.findActive("shared", ORIGIN_B, Date.now())).toMatchObject({
      publicKey: "pk_b",
    });
  });

  it("migrates legacy clientId blob only when Origin matches", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    const scope = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);
    const legacyId = buildLegacySdkPairedClientSecretId("client_legacy");
    const record = activeRecord({ clientId: "client_legacy", origin: ORIGIN_A });
    await secrets.saveSecret(scope, legacyId, JSON.stringify(record));
    await secrets.saveSecret(
      scope,
      SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
      JSON.stringify(["client_legacy"]),
    );

    expect(await store.findActive("client_legacy", ORIGIN_B, Date.now())).toBeNull();
    expect(await secrets.loadSecret(scope, legacyId)).not.toBeNull();

    const migrated = await store.findActive("client_legacy", ORIGIN_A, Date.now());
    expect(migrated).toMatchObject({ clientId: "client_legacy", origin: ORIGIN_A });
    expect(await secrets.loadSecret(scope, legacyId)).toBeNull();
    expect(
      await secrets.loadSecret(
        scope,
        buildSdkPairedClientSecretId(ORIGIN_A, "client_legacy"),
      ),
    ).not.toBeNull();

    const again = await store.findActive("client_legacy", ORIGIN_A, Date.now());
    expect(again).toMatchObject({ clientId: "client_legacy" });
  });

  it("never overwrites another Origin legacy blob when saving", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    const scope = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);
    const legacyId = buildLegacySdkPairedClientSecretId("shared");
    await secrets.saveSecret(
      scope,
      legacyId,
      JSON.stringify(activeRecord({ clientId: "shared", origin: ORIGIN_A })),
    );

    await store.save(
      activeRecord({
        clientId: "shared",
        origin: ORIGIN_B,
        publicKey: "pk_b",
      }),
    );

    const legacy = JSON.parse(
      (await secrets.loadSecret(scope, legacyId)) ?? "null",
    ) as { origin: string; publicKey: string };
    expect(legacy.origin).toBe(ORIGIN_A);
    expect(legacy.publicKey).toBe("pk");
    expect(
      await store.findActive("shared", ORIGIN_B, Date.now()),
    ).toMatchObject({ publicKey: "pk_b" });
    expect(
      await store.findActive("shared", ORIGIN_A, Date.now()),
    ).toMatchObject({ publicKey: "pk" });
  });

  it("revokes only the matching Origin binding", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    await store.save(activeRecord({ clientId: "shared", origin: ORIGIN_A }));
    await store.save(
      activeRecord({
        clientId: "shared",
        origin: ORIGIN_B,
        applicationName: "other",
      }),
    );

    expect(await store.revoke("shared", ORIGIN_A)).toBe(true);
    expect(await store.findActive("shared", ORIGIN_A, Date.now())).toBeNull();
    expect(await store.findActive("shared", ORIGIN_B, Date.now())).not.toBeNull();
    expect((await store.listPublic()).map((c) => c.origin)).toEqual([ORIGIN_B]);
    expect(await store.revoke("shared", ORIGIN_A)).toBe(false);
  });

  it("purges corrupt JSON and rejects mismatched composite identity", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    const scope = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);
    const compositeId = buildSdkPairedClientSecretId(ORIGIN_A, "client_bad");
    await secrets.saveSecret(scope, compositeId, "{not-json");
    await secrets.saveSecret(
      scope,
      SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
      JSON.stringify([{ clientId: "client_bad", origin: ORIGIN_A }]),
    );

    expect(await store.get("client_bad", ORIGIN_A)).toBeNull();
    expect(await store.listPublic()).toEqual([]);

    await secrets.saveSecret(
      scope,
      compositeId,
      JSON.stringify(activeRecord({ clientId: "other", origin: ORIGIN_B })),
    );
    expect(await store.get("client_bad", ORIGIN_A)).toBeNull();
    expect(await secrets.loadSecret(scope, compositeId)).toBeNull();
  });

  it("removes client from storage and public list on revoke", async () => {
    const secrets = new InMemorySecretStorageAdapter();
    const store = new SdkGatewayPairingStore(secrets);
    await store.save(activeRecord());

    expect((await store.listPublic()).map((c) => c.clientId)).toEqual([
      "client_a",
    ]);
    expect(await store.revoke("client_a", ORIGIN_A)).toBe(true);
    expect(await store.get("client_a", ORIGIN_A)).toBeNull();
    expect(await store.listPublic()).toEqual([]);
    expect(await store.revoke("client_a", ORIGIN_A)).toBe(false);
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
    expect(await store.get("client_old", ORIGIN_A)).toBeNull();
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
    const badId = buildSdkPairedClientSecretId(ORIGIN_A, "client_bad");
    const secrets = new FailingClientSecretStorage(badId);
    const store = new SdkGatewayPairingStore(secrets);
    const scope = createSecretStorageScopeKey(SDK_PAIRING_SCOPE_KEY);

    await store.save(activeRecord({ clientId: "client_good" }));
    await secrets.saveSecret(
      scope,
      SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
      JSON.stringify([
        { clientId: "client_good", origin: ORIGIN_A },
        { clientId: "client_bad", origin: ORIGIN_A },
      ]),
    );

    const listed = await store.listPublic();
    expect(listed.map((c) => c.clientId)).toEqual(["client_good"]);
    expect(secrets.deletes).toContain(badId);

    const reloaded = await store.listPublic();
    expect(reloaded.map((c) => c.clientId)).toEqual(["client_good"]);
  });

  it("findActive returns null when client secret load fails", async () => {
    const failId = buildSdkPairedClientSecretId(ORIGIN_A, "client_a");
    const secrets = new FailingClientSecretStorage(failId);
    const store = new SdkGatewayPairingStore(secrets);
    const spy = vi.spyOn(secrets, "deleteSecret");

    await expect(
      store.findActive("client_a", ORIGIN_A, Date.now()),
    ).resolves.toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it("public meta never includes publicKey material", async () => {
    const store = new SdkGatewayPairingStore(new InMemorySecretStorageAdapter());
    await store.save(activeRecord({ publicKey: "secret-pk-material" }));
    const listed = await store.listPublic();
    expect(listed).toHaveLength(1);
    expect(JSON.stringify(listed[0])).not.toContain("secret-pk-material");
    expect(JSON.stringify(listed[0])).not.toContain("publicKey");
  });
});
