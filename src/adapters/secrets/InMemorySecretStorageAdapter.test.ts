import { describe, expect, it } from "vitest";
import { createSecretStorageScopeKey } from "@ports/secrets/SecretStoragePort.js";
import { InMemorySecretStorageAdapter } from "./InMemorySecretStorageAdapter.js";

describe("InMemorySecretStorageAdapter", () => {
  it("saves, loads, and deletes secrets per scope", async () => {
    const adapter = new InMemorySecretStorageAdapter();
    const scopeKey = createSecretStorageScopeKey("user@example.com");

    await adapter.saveSecret(scopeKey, "sip-password", "secret-value");
    await expect(adapter.loadSecret(scopeKey, "sip-password")).resolves.toBe("secret-value");

    await adapter.deleteSecret(scopeKey, "sip-password");
    await expect(adapter.loadSecret(scopeKey, "sip-password")).resolves.toBeNull();
  });

  it("isolates secrets by scope key", async () => {
    const adapter = new InMemorySecretStorageAdapter();
    const scopeA = createSecretStorageScopeKey("a@example.com");
    const scopeB = createSecretStorageScopeKey("b@example.com");

    await adapter.saveSecret(scopeA, "sip-password", "password-a");
    await adapter.saveSecret(scopeB, "sip-password", "password-b");

    await expect(adapter.loadSecret(scopeA, "sip-password")).resolves.toBe("password-a");
    await expect(adapter.loadSecret(scopeB, "sip-password")).resolves.toBe("password-b");
  });
});
