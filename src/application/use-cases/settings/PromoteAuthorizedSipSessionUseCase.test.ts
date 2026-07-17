import { describe, expect, it } from "vitest";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
} from "@ports/secrets/SecretStoragePort.js";
import {
  createSipAccount,
  createSipAccountId,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSettingsAccountKeyFromIdentity,
} from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { PromoteAuthorizedSipSessionUseCase } from "./PromoteAuthorizedSipSessionUseCase.js";

describe("PromoteAuthorizedSipSessionUseCase", () => {
  it("sets active profile key and promotes draft to successful", async () => {
    const settings = new InMemorySettingsRepository();
    const profiles = new InMemorySavedAccountProfileRepository();
    const secrets = new InMemorySecretStorageAdapter();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const profileKey = deriveSettingsAccountKeyFromIdentity(account);

    await profiles.saveProfile(
      {
        username: account.username,
        domain: account.domain,
        server: account.server,
      },
      { lifecycleStatus: "draft" },
    );

    const useCase = new PromoteAuthorizedSipSessionUseCase(
      settings,
      profiles,
      secrets,
      createTestLogger(),
    );

    const result = await useCase.execute({ account });
    expect(result.ok).toBe(true);
    expect(await settings.getActiveProfileKey()).toBe(profileKey);

    const profile = await profiles.getProfileById(profileKey);
    expect(profile?.lifecycleStatus).toBe("successful");
    expect(profile?.successfulUseAt).toBeDefined();
  });

  it("migrates secrets from provisional username-only key", async () => {
    const settings = new InMemorySettingsRepository();
    const profiles = new InMemorySavedAccountProfileRepository();
    const secrets = new InMemorySecretStorageAdapter();
    const account = createSipAccount(createSipAccountId("ocp.user"), {
      username: "ocp.user",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const provisional = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity({
      username: account.username,
      domain: "",
      server: "",
    });
    const profileKey = deriveSettingsAccountKeyFromIdentity(account);

    await secrets.saveSecret(
      createSecretStorageScopeKey(provisional),
      SIP_PASSWORD_SECRET_ID,
      "remembered",
    );
    await secrets.saveSecret(
      createSecretStorageScopeKey(provisional),
      OCP_PROXY_API_KEY_SECRET_ID,
      "api-key",
    );

    const useCase = new PromoteAuthorizedSipSessionUseCase(
      settings,
      profiles,
      secrets,
      createTestLogger(),
    );

    await useCase.execute({ account });

    await expect(
      secrets.loadSecret(createSecretStorageScopeKey(profileKey), SIP_PASSWORD_SECRET_ID),
    ).resolves.toBe("remembered");
    await expect(
      secrets.loadSecret(createSecretStorageScopeKey(profileKey), OCP_PROXY_API_KEY_SECRET_ID),
    ).resolves.toBe("api-key");
    await expect(
      secrets.loadSecret(createSecretStorageScopeKey(provisional), SIP_PASSWORD_SECRET_ID),
    ).resolves.toBeNull();
    await expect(
      secrets.loadSecret(createSecretStorageScopeKey(provisional), OCP_PROXY_API_KEY_SECRET_ID),
    ).resolves.toBe("api-key");
  });
});
