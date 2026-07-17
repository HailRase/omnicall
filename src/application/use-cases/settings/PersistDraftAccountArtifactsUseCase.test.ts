import { describe, expect, it, vi } from "vitest";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
} from "@ports/secrets/SecretStoragePort.js";
import { deriveSettingsAccountKeyFromIdentity } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";
import { PersistDraftAccountArtifactsUseCase } from "./PersistDraftAccountArtifactsUseCase.js";

const profileInput = {
  username: "draft.user",
  domain: "pbx.example",
  server: "sip:pbx.example",
} as const;

describe("PersistDraftAccountArtifactsUseCase", () => {
  it("persists draft metadata and secrets before any SIP attempt", async () => {
    const profiles = new InMemorySavedAccountProfileRepository();
    const secrets = new InMemorySecretStorageAdapter();
    const useCase = new PersistDraftAccountArtifactsUseCase(
      profiles,
      secrets,
      createTestLogger(),
    );

    const result = await useCase.execute({
      profile: profileInput,
      saveProfile: true,
      rememberPassword: true,
      sipPassword: "secret",
      ocpDomain: "ocp.example",
      saveOcpApiKey: true,
      ocpApiKey: "api-key-value",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.profile?.lifecycleStatus).toBe("draft");
    expect(result.value.profile?.ocpDomain).toBe("ocp.example");

    const scopeKey = createSecretStorageScopeKey(
      deriveSettingsAccountKeyFromIdentity(profileInput),
    );
    await expect(secrets.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBe("secret");
    await expect(secrets.loadSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID)).resolves.toBe(
      "api-key-value",
    );
  });

  it("fails hard when opted-in secret write fails", async () => {
    const profiles = new InMemorySavedAccountProfileRepository();
    const secrets = new InMemorySecretStorageAdapter();
    vi.spyOn(secrets, "saveSecret").mockRejectedValue(new Error("encryption_unavailable"));
    const useCase = new PersistDraftAccountArtifactsUseCase(
      profiles,
      secrets,
      createTestLogger(),
    );

    const result = await useCase.execute({
      profile: profileInput,
      saveProfile: true,
      rememberPassword: true,
      sipPassword: "secret",
      saveOcpApiKey: false,
    });

    expect(isErr(result)).toBe(true);
  });

  it("rejects rememberPassword without a SIP password value", async () => {
    const useCase = new PersistDraftAccountArtifactsUseCase(
      new InMemorySavedAccountProfileRepository(),
      new InMemorySecretStorageAdapter(),
      createTestLogger(),
    );

    const result = await useCase.execute({
      profile: profileInput,
      saveProfile: true,
      rememberPassword: true,
      sipPassword: "   ",
      saveOcpApiKey: false,
    });

    expect(isErr(result)).toBe(true);
  });

  it("compensates SIP secret when the following OCP secret write fails", async () => {
    const profiles = new InMemorySavedAccountProfileRepository();
    const secrets = new InMemorySecretStorageAdapter();
    const originalSave = secrets.saveSecret.bind(secrets);
    vi.spyOn(secrets, "saveSecret")
      .mockImplementationOnce(originalSave)
      .mockRejectedValueOnce(new Error("ocp_secret_write_failed"));
    const useCase = new PersistDraftAccountArtifactsUseCase(
      profiles,
      secrets,
      createTestLogger(),
    );

    const result = await useCase.execute({
      profile: profileInput,
      saveProfile: true,
      rememberPassword: true,
      sipPassword: "secret",
      saveOcpApiKey: true,
      ocpApiKey: "api-key",
    });

    expect(isErr(result)).toBe(true);
    const scopeKey = createSecretStorageScopeKey(
      deriveSettingsAccountKeyFromIdentity(profileInput),
    );
    await expect(secrets.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBeNull();
    await expect(profiles.listProfiles()).resolves.toEqual([]);
  });

  it("compensates both secrets when profile metadata commit fails", async () => {
    const profiles = new InMemorySavedAccountProfileRepository();
    vi.spyOn(profiles, "saveProfile").mockRejectedValueOnce(
      new Error("profile_commit_failed"),
    );
    const secrets = new InMemorySecretStorageAdapter();
    const useCase = new PersistDraftAccountArtifactsUseCase(
      profiles,
      secrets,
      createTestLogger(),
    );

    const result = await useCase.execute({
      profile: profileInput,
      saveProfile: true,
      rememberPassword: true,
      sipPassword: "secret",
      saveOcpApiKey: true,
      ocpApiKey: "api-key",
    });

    expect(isErr(result)).toBe(true);
    const scopeKey = createSecretStorageScopeKey(
      deriveSettingsAccountKeyFromIdentity(profileInput),
    );
    await expect(secrets.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBeNull();
    await expect(
      secrets.loadSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID),
    ).resolves.toBeNull();
  });

  it("keeps an existing successful profile successful during a failed re-login draft save", async () => {
    const profiles = new InMemorySavedAccountProfileRepository();
    const existing = await profiles.saveProfile(profileInput, {
      lifecycleStatus: "successful",
    });
    const useCase = new PersistDraftAccountArtifactsUseCase(
      profiles,
      new InMemorySecretStorageAdapter(),
      createTestLogger(),
    );

    const result = await useCase.execute({
      profile: profileInput,
      saveProfile: true,
      rememberPassword: false,
      saveOcpApiKey: false,
    });

    expect(result.ok).toBe(true);
    const after = await profiles.getProfileById(existing.id);
    expect(after?.lifecycleStatus).toBe("successful");
  });
});
