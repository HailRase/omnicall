import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  createDefaultUserSettings,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSettingsAccountKeyFromIdentity,
  type UserSettings,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { isErr } from "@shared/result/index.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("AccountBootstrapFacade integration", () => {
  it("runs SIP-only manual authorize and register flow", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    await facade.authorizeManualAccount({
      username: "agent",
      password: "secret",
      domain: "pbx",
      server: "sip:pbx",
    });

    expect(telephony.isRegistered()).toBe(true);
  });

  it("runs OCP bootstrap through mock gateways", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {
          mode: "ocp",
          ocpToken: "token",
          ocpDomain: "ocp.example",
        },
      }),
      logger: createTestLogger(),
    });

    const result = await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
    });

    expect(isErr(result)).toBe(false);
    await waitFor(() => telephony.isRegistered());
    expect(telephony.isRegistered()).toBe(true);
  });

  it("initializes sip-only startup through ResolveStartupModeUseCase", async () => {
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    await facade.initialize({ mode: "sip-only" });
  });

  it("initializes ocp startup and registers via mock gateways", async () => {
    const telephony = new MockTelephonyGateway("success");
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {
          mode: "ocp",
          ocpToken: "token",
          ocpDomain: "ocp.example",
        },
      }),
      logger: createTestLogger(),
    });

    await facade.initialize({
      mode: "ocp",
      ocpToken: "token",
      ocpDomain: "ocp.example",
    });

    await waitFor(() => telephony.isRegistered());
    expect(telephony.isRegistered()).toBe(true);
  });

  it("changes phone status through event-driven use case", async () => {
    const settings = new InMemorySettingsRepository({ phoneStatus: "offline" });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.setPhoneStatus("dnd");
    expect((await settings.getPhoneStatus())).toBe("dnd");
  });

  it("updates multi-call settings through facade without Use Case", async () => {
    const settings = new InMemorySettingsRepository({
      multiCallSettings: {
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: true,
      },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const updated = await facade.updateMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });

    expect(updated).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect(await settings.getMultiCallSettings()).toEqual(updated);
  });

  it("reads and saves user settings aggregate through facade", async () => {
    const settings = new InMemorySettingsRepository();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const loaded = await facade.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const saved = await facade.saveUserSettings({
      ...loaded.value,
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 4,
    });
    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.value.multiSessionsEnabled).toBe(false);
      expect(saved.value.autoAnswerTimeoutSec).toBe(4);
    }
  });

  it("refreshes multi-call projection from persisted user settings", async () => {
    const settings = new InMemorySettingsRepository();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.updateMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });

    let projection: { multiSessionsEnabled: boolean } | null = null;
    await facade.refreshUserSettingsProjections({
      applyMultiCallSettings: (value) => {
        projection = value;
      },
    });

    expect(projection).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
  });

  it("switches active profile on authorize and restores per-account settings A→B→A", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: { mode: "sip-only" },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const accountA = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const accountB = {
      username: "1002",
      password: "secret-b",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const keyA = deriveSettingsAccountKeyFromIdentity({
      username: accountA.username,
      domain: accountA.domain,
      server: accountA.server,
    });
    const keyB = deriveSettingsAccountKeyFromIdentity({
      username: accountB.username,
      domain: accountB.domain,
      server: accountB.server,
    });

    await facade.authorizeManualAccount(accountA);
    expect(await settings.getActiveProfileKey()).toBe(keyA);

    const loadedA = await facade.getUserSettingsForAccount();
    expect(loadedA.ok).toBe(true);
    if (!loadedA.ok) {
      return;
    }
    await facade.saveUserSettings({
      ...loadedA.value,
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 9,
      sipAutoReconnectEnabled: false,
    });

    await facade.authorizeManualAccount(accountB);
    expect(await settings.getActiveProfileKey()).toBe(keyB);

    const loadedB = await facade.getUserSettingsForAccount();
    expect(loadedB.ok).toBe(true);
    if (!loadedB.ok) {
      return;
    }
    expect(loadedB.value.language).toBe("ru");
    expect(loadedB.value.multiSessionsEnabled).toBe(true);

    await facade.saveUserSettings({
      ...loadedB.value,
      language: "ru",
      theme: "light",
      multiSessionsEnabled: true,
      autoAnswerTimeoutSec: 15,
      sipAutoReconnectEnabled: true,
    });

    await facade.authorizeManualAccount(accountA);
    expect(await settings.getActiveProfileKey()).toBe(keyA);

    const restoredA = await facade.getUserSettingsForAccount();
    expect(restoredA.ok).toBe(true);
    if (!restoredA.ok) {
      return;
    }
    expect(restoredA.value).toMatchObject({
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 9,
      sipAutoReconnectEnabled: false,
    });

    const persistedB = await settings.getUserSettings(keyB);
    expect(persistedB).toMatchObject({
      language: "ru",
      theme: "light",
      multiSessionsEnabled: true,
      autoAnswerTimeoutSec: 15,
      sipAutoReconnectEnabled: true,
    });
  });

  it("writes multi-call updates only to the active profile bucket", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: { mode: "sip-only" },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const accountA = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const accountB = {
      username: "1002",
      password: "secret-b",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const keyA = deriveSettingsAccountKeyFromIdentity({
      username: accountA.username,
      domain: accountA.domain,
      server: accountA.server,
    });
    const keyB = deriveSettingsAccountKeyFromIdentity({
      username: accountB.username,
      domain: accountB.domain,
      server: accountB.server,
    });

    await facade.authorizeManualAccount(accountA);
    await facade.updateMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });

    await facade.authorizeManualAccount(accountB);
    await facade.updateMultiCallSettings({
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: false,
    });

    const bucketA = await settings.getUserSettings(keyA);
    const bucketB = await settings.getUserSettings(keyB);

    expect(bucketA.multiSessionsEnabled).toBe(false);
    expect(bucketA.autoUnholdOnTransferFailure).toBe(true);
    expect(bucketB.multiSessionsEnabled).toBe(true);
    expect(bucketB.autoUnholdOnTransferFailure).toBe(false);
  });

  it("refreshes multi-call projection for the active profile after authorize switch", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: { mode: "sip-only" },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.authorizeManualAccount({
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await facade.updateMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });

    await facade.authorizeManualAccount({
      username: "1002",
      password: "secret-b",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const loadedB = await facade.getUserSettingsForAccount();
    if (loadedB.ok) {
      await facade.saveUserSettings({
        ...loadedB.value,
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: false,
      });
    }

    let projection: {
      multiSessionsEnabled: boolean;
      autoUnholdOnTransferFailure?: boolean;
    } | null = null;
    await facade.refreshUserSettingsProjections({
      applyMultiCallSettings: (value) => {
        projection = value;
      },
    });

    expect(projection).toEqual({
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: false,
    });
  });

  it("authorizes with legacy username-only on-disk layout and restores migrated settings", async () => {
    const accountInput = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const compositeKey = deriveSettingsAccountKeyFromIdentity({
      username: accountInput.username,
      domain: accountInput.domain,
      server: accountInput.server,
    });
    const legacyKey = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity({
      username: accountInput.username,
      domain: accountInput.domain,
      server: accountInput.server,
    });
    const legacySettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 12,
      sipAutoReconnectEnabled: false,
    };

    const root = await mkdtemp(join(tmpdir(), "axatalk-facade-legacy-"));
    const filesystem = new NodeFileSystemAdapter();

    try {
      const seeded = new FileSettingsRepository({
        storageRoot: root,
        filesystem,
        initial: { bootstrapConfig: { mode: "sip-only" } },
      });
      await seeded.saveUserSettings(legacyKey, legacySettings);
      await seeded.setActiveProfileKey(legacyKey);

      const settings = new FileSettingsRepository({
        storageRoot: root,
        filesystem,
        initial: { bootstrapConfig: { mode: "sip-only" } },
      });
      const facade = new AccountBootstrapFacade({
        operatorGateway: new MockOperatorPlatformGateway(),
        telephonyGateway: new MockTelephonyGateway("success"),
        mediaGateway: new MockMediaGateway(),
        settingsRepository: settings,
        logger: createTestLogger(),
      });

      await facade.authorizeManualAccount(accountInput);

      expect(await settings.getActiveProfileKey()).toBe(compositeKey);

      const loaded = await facade.getUserSettingsForAccount();
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) {
        return;
      }

      expect(loaded.value).toMatchObject({
        language: "en",
        theme: "dark",
        multiSessionsEnabled: false,
        autoAnswerTimeoutSec: 12,
        sipAutoReconnectEnabled: false,
      });
      expect(await settings.readPersistedJson(compositeKey)).toBeDefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = (): void => {
      if (predicate()) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Condition was not met in time"));
        return;
      }

      setTimeout(tick, 10);
    };

    tick();
  });
}
