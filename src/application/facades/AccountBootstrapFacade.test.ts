import { describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockHeadsetGateway,
  MockMediaGateway,
  MockTelephonyGateway,
  InMemorySavedAccountProfileRepository,
} from "@adapters/index.js";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { MockOcpProxyAuthenticatePort } from "@adapters/mock/MockOcpProxyAuthenticatePort.js";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  createDefaultUserSettings,
  createSipAccount,
  createSipAccountId,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSettingsAccountKeyFromIdentity,
  type UserSettings,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import type { SavedAccountProfileRepository } from "@ports/index.js";
import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
} from "@ports/secrets/SecretStoragePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr, ok } from "@shared/result/index.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("AccountBootstrapFacade integration", () => {
  it("runs SIP-only manual authorize and register flow", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
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

  it("initializes sip-only startup through ResolveStartupModeUseCase", async () => {
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      logger: createTestLogger(),
    });

    await facade.initialize({});
  });

  it("changes phone status through event-driven use case", async () => {
    const settings = new InMemorySettingsRepository({ phoneStatus: "offline" });
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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
      bootstrapConfig: {},
    });
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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

    await facade.endUserSession.execute();
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

    await facade.endUserSession.execute();
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
      bootstrapConfig: {},
    });
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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

    await facade.endUserSession.execute();
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

  it("refreshes profile-scoped contacts and history for the active profile", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const contacts = new InMemoryContactRepository();
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      contactRepository: contacts,
      logger: createTestLogger(),
    });

    await facade.authorizeManualAccount({
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await facade.createContact({
      displayName: "Alice",
      primaryPhone: "+12025550100",
    });

    let loadedContacts: ReadonlyArray<{ displayName: string }> = [];
    let historyStatus: string | null = null;

    await facade.refreshProfileScopedDataProjections({
      setContactsLoading: () => undefined,
      setContactsLoaded: (value) => {
        loadedContacts = value;
      },
      setContactsLoadError: () => undefined,
      setCallHistoryLoading: () => {
        historyStatus = "loading";
      },
      setCallHistoryLoaded: () => {
        historyStatus = "loaded";
      },
      setCallHistoryLoadError: () => {
        historyStatus = "error";
      },
    });

    expect(loadedContacts).toHaveLength(1);
    expect(loadedContacts[0]?.displayName).toBe("Alice");
    expect(historyStatus).toBe("loaded");
  });

  it("refreshes multi-call projection for the active profile after authorize switch", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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

    await facade.endUserSession.execute();
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

    const root = await mkdtemp(join(tmpdir(), "omnicall-facade-legacy-"));
    const filesystem = new NodeFileSystemAdapter();

    try {
      const seeded = new FileSettingsRepository({
        storageRoot: root,
        filesystem,
        initial: { bootstrapConfig: {} },
      });
      await seeded.saveUserSettings(legacyKey, legacySettings);
      await seeded.setActiveProfileKey(legacyKey);

      const settings = new FileSettingsRepository({
        storageRoot: root,
        filesystem,
        initial: { bootstrapConfig: {} },
      });
      const facade = new AccountBootstrapFacade({        telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
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

  it("keeps manual authorization working without saving profile by default", async () => {
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    const result = await facade.authorizeManualAccount({
      username: "agent",
      password: "secret",
      domain: "pbx",
      server: "sip:pbx",
    });

    expect(isErr(result)).toBe(false);
    expect(telephony.isRegistered()).toBe(true);
    expect(await savedProfiles.listProfiles()).toHaveLength(0);
  });

  it("saves profile metadata when saveProfile is checked after successful manual auth", async () => {
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    const account = {
      username: "max.operator",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    const result = await facade.authorizeManualAccount(account, { saveProfile: true });
    expect(isErr(result)).toBe(false);

    const profiles = await savedProfiles.listProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.username).toBe("max.operator");
    expect(profiles[0]).not.toHaveProperty("password");
  });

  it("does not duplicate saved profile on repeated saveProfile authorize", async () => {
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    const account = {
      username: "yura.operator",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    await facade.authorizeManualAccount(account, { saveProfile: true });
    await facade.authorizeManualAccount(account, { saveProfile: true });

    expect(await savedProfiles.listProfiles()).toHaveLength(1);
  });

  it("authorizes saved profile with same settings account key as manual path", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    const account = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const expectedKey = deriveSettingsAccountKeyFromIdentity(account);

    const saved = await facade.saveSavedAccountProfile({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }

    const result = await facade.authorizeSavedAccountProfile(saved.value.id, account.password);
    expect(isErr(result)).toBe(false);
    expect(await settings.getActiveProfileKey()).toBe(expectedKey);

    const touched = await savedProfiles.getProfileById(saved.value.id);
    expect(touched?.lastUsedAt).toBeDefined();
  });

  it("deletes saved profile without removing per-account user settings", async () => {
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    const account = {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const key = deriveSettingsAccountKeyFromIdentity(account);

    await facade.authorizeManualAccount(account, { saveProfile: true });
    const loaded = await facade.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    await facade.saveUserSettings({ ...loaded.value, language: "en" });

    const profiles = await facade.listSavedAccountProfiles();
    expect(profiles.ok).toBe(true);
    if (!profiles.ok || profiles.value.length === 0) {
      return;
    }

    const deleted = await facade.deleteSavedAccountProfile(profiles.value[0]?.id as typeof key);
    expect(deleted.ok).toBe(true);
    expect(await savedProfiles.listProfiles()).toHaveLength(0);
    expect((await settings.getUserSettings(key)).language).toBe("en");
  });

  it("blocks login when opted-in save profile metadata fails before attempt", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    await telephony.unregister(createCorrelationId());
    const baseRepo = new InMemorySavedAccountProfileRepository();
    const failingRepo: SavedAccountProfileRepository = {
      listProfiles: () => baseRepo.listProfiles(),
      getProfileById: (id) => baseRepo.getProfileById(id),
      deleteProfile: (id) => baseRepo.deleteProfile(id),
      touchLastUsedAt: (id) => baseRepo.touchLastUsedAt(id),
      markProfileSuccessful: (id, at) => baseRepo.markProfileSuccessful(id, at),
      saveProfile: () => Promise.reject(new Error("profile persistence failed")),
    };
    const facade = new AccountBootstrapFacade({
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      savedAccountProfileRepository: failingRepo,
      logger: createTestLogger(),
    });

    const result = await facade.authorizeManualAccount(
      {
        username: "agent",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      { saveProfile: true },
    );

    expect(isErr(result)).toBe(true);
    expect(telephony.isRegistered()).toBe(false);
    expect(await failingRepo.listProfiles()).toHaveLength(0);
  });

  it("succeeds saved profile auth when touch lastUsedAt fails after registration", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const baseRepo = new InMemorySavedAccountProfileRepository();
    const failingRepo: SavedAccountProfileRepository = {
      listProfiles: () => baseRepo.listProfiles(),
      getProfileById: (id) => baseRepo.getProfileById(id),
      deleteProfile: (id) => baseRepo.deleteProfile(id),
      saveProfile: (input, options) => baseRepo.saveProfile(input, options),
      markProfileSuccessful: (id, at) => baseRepo.markProfileSuccessful(id, at),
      touchLastUsedAt: () => Promise.reject(new Error("touch failed")),
    };
    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      savedAccountProfileRepository: failingRepo,
      logger: createTestLogger(),
    });

    const saved = await facade.saveSavedAccountProfile({
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }

    const result = await facade.authorizeSavedAccountProfile(saved.value.id, "secret-a");
    expect(isErr(result)).toBe(false);
    if (!result.ok) {
      return;
    }
    expect(result.value.metadataWarnings).toContain("profile_touch_failed");
    expect(telephony.isRegistered()).toBe(true);
  });

  it("rejects authorize while SIP session is active without unregistering", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
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

    await facade.authorizeManualAccount(accountA);
    expect(telephony.isRegistered()).toBe(true);

    const endSessionSpy = vi.spyOn(facade.endUserSession, "execute");

    const otherResult = await facade.authorizeManualAccount(accountB);
    expect(isErr(otherResult)).toBe(true);
    if (!isErr(otherResult)) {
      return;
    }
    expect(otherResult.error.message).toBe("account_sign_in_logout_required");
    expect(otherResult.error.cause).toEqual({
      reason: "account.signIn.disabled.logoutFirst",
    });

    const sameResult = await facade.authorizeManualAccount(accountA);
    expect(isErr(sameResult)).toBe(true);
    expect(endSessionSpy).not.toHaveBeenCalled();
    expect(telephony.isRegistered()).toBe(true);
    const stored = await settings.getSipAccount();
    expect(stored?.username).toBe("1001");
  });

  it("promotes profile/settings on Login even when SIP registration fails (ADR-AF-005)", async () => {
    const secretStorage = new InMemorySecretStorageAdapter();
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const previousKey = deriveSettingsAccountKeyFromIdentity({
      username: "active.user",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await settings.setActiveProfileKey(previousKey);

    const account = {
      username: "max.operator",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const scopeKey = createSecretStorageScopeKey(
      deriveSettingsAccountKeyFromIdentity(account),
    );

    const failingFacade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "failure" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      savedAccountProfileRepository: savedProfiles,
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const activated = await failingFacade.authorizeManualAccount(account, {
      saveProfile: true,
      rememberPassword: true,
    });
    expect(isErr(activated)).toBe(false);
    if (!activated.ok) {
      return;
    }
    expect(activated.value.telephony.status).toBe("registration_failed");
    if (activated.value.telephony.status === "registration_failed") {
      expect(activated.value.telephony.detail.length).toBeGreaterThan(0);
      expect(activated.value.telephony.transportConnected).toBe(false);
    }
    await expect(secretStorage.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBe(
      "secret",
    );
    expect(await settings.getActiveProfileKey()).toBe(
      deriveSettingsAccountKeyFromIdentity(account),
    );
    const promoted = await savedProfiles.listProfiles();
    expect(promoted[0]?.lifecycleStatus).toBe("successful");

    // Login locked while account session active even without SIP-ready.
    const blocked = await failingFacade.authorizeManualAccount({
      ...account,
      username: "other.user",
    });
    expect(isErr(blocked)).toBe(true);
  });

  it("authorizes saved profile with remembered password when password field is empty", async () => {
    const secretStorage = new InMemorySecretStorageAdapter();
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: savedProfiles,
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const account = {
      username: "saved.user",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    await facade.authorizeManualAccount(account, { saveProfile: true, rememberPassword: true });
    const profiles = await savedProfiles.listProfiles();
    const profileId = profiles[0]?.id;
    expect(profileId).toBeDefined();
    if (profileId === undefined) {
      return;
    }

    await facade.endUserSession.execute();

    const result = await facade.authorizeSavedAccountProfile(profileId, "");
    expect(isErr(result)).toBe(false);
  });

  it("deletes remembered password when saved profile is deleted", async () => {
    const secretStorage = new InMemorySecretStorageAdapter();
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: savedProfiles,
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const account = {
      username: "delete.me",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const scopeKey = createSecretStorageScopeKey(
      deriveSettingsAccountKeyFromIdentity(account),
    );

    await facade.authorizeManualAccount(account, { saveProfile: true, rememberPassword: true });
    const profiles = await savedProfiles.listProfiles();
    const profileId = profiles[0]?.id;
    expect(profileId).toBeDefined();
    if (profileId === undefined) {
      return;
    }
    const legacyScopeKey = createSecretStorageScopeKey(
      deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(account),
    );
    await secretStorage.saveSecret(
      scopeKey,
      OCP_PROXY_API_KEY_SECRET_ID,
      "profile-api-key",
    );
    await secretStorage.saveSecret(
      legacyScopeKey,
      OCP_PROXY_API_KEY_SECRET_ID,
      "legacy-api-key",
    );

    const deleted = await facade.deleteSavedAccountProfile(profileId);
    expect(deleted.ok).toBe(true);
    await expect(secretStorage.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBeNull();
    await expect(
      secretStorage.loadSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID),
    ).resolves.toBeNull();
    await expect(
      secretStorage.loadSecret(legacyScopeKey, OCP_PROXY_API_KEY_SECRET_ID),
    ).resolves.toBeNull();
  });

  it("blocks login when opted-in remembered password save fails", async () => {
    const failingSecretStorage: InMemorySecretStorageAdapter = new InMemorySecretStorageAdapter();
    vi.spyOn(failingSecretStorage, "saveSecret").mockRejectedValue(
      new Error("encryption_unavailable"),
    );

    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      secretStoragePort: failingSecretStorage,
      logger: createTestLogger(),
    });

    const result = await facade.authorizeManualAccount(
      {
        username: "warn.user",
        password: "secret",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
      { rememberPassword: true },
    );

    expect(isErr(result)).toBe(true);
    await expect(facade.getActiveSipAccount()).resolves.toBeNull();
  });

  it("forgetRememberedSipPassword deletes only secret and keeps profile", async () => {
    const secretStorage = new InMemorySecretStorageAdapter();
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: savedProfiles,
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const account = {
      username: "forget.user",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const scopeKey = createSecretStorageScopeKey(
      deriveSettingsAccountKeyFromIdentity(account),
    );

    await facade.authorizeManualAccount(account, { saveProfile: true, rememberPassword: true });
    const profiles = await savedProfiles.listProfiles();
    const profileId = profiles[0]?.id;
    expect(profileId).toBeDefined();
    if (profileId === undefined) {
      return;
    }

    const forgot = await facade.forgetRememberedSipPassword(profileId);
    expect(forgot.ok).toBe(true);
    await expect(secretStorage.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBeNull();
    await expect(savedProfiles.getProfileById(profileId)).resolves.not.toBeNull();
  });

  it("forgetRememberedSipPassword returns not_found for missing profile", async () => {
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: new InMemorySavedAccountProfileRepository(),
      secretStoragePort: new InMemorySecretStorageAdapter(),
      logger: createTestLogger(),
    });

    const result = await facade.forgetRememberedSipPassword(
      deriveSettingsAccountKeyFromIdentity({
        username: "missing",
        domain: "pbx.example",
        server: "sip:pbx.example",
      }),
    );
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) {
      return;
    }
    expect(result.error.code).toBe("not_found");
  });

  it("loads saved secrets only through the selected-profile boundary", async () => {
    const secretStorage = new InMemorySecretStorageAdapter();
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: savedProfiles,
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });
    const account = {
      username: "boundary.user",
      password: "sip-secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    await facade.authorizeManualAccount(account, {
      saveProfile: true,
      rememberPassword: true,
    });
    const profileId = (await savedProfiles.listProfiles())[0]?.id;
    expect(profileId).toBeDefined();
    if (profileId === undefined) {
      return;
    }
    await secretStorage.saveSecret(
      createSecretStorageScopeKey(profileId),
      OCP_PROXY_API_KEY_SECRET_ID,
      "ocp-secret",
    );

    const result = await facade.loadSavedAccountProfileSecrets(profileId);
    expect(result).toEqual(
      ok({ sipPassword: "sip-secret", ocpApiKey: "ocp-secret" }),
    );
  });

  it("getActiveSipAccount returns session account after auth and null after logout", async () => {
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    const account = {
      username: "active.user",
      password: "session-secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    await expect(facade.getActiveSipAccount()).resolves.toBeNull();

    await facade.authorizeManualAccount(account);
    await expect(facade.getActiveSipAccount()).resolves.toEqual(account);

    await facade.endUserSession.execute();
    await expect(facade.getActiveSipAccount()).resolves.toBeNull();
  });

  it("applies headset settings and auto-reconnects preferred device after authorize", async () => {
    const headset = new MockHeadsetGateway();
    headset.setGrantedDevices([
      { id: "mock-headset-1", productName: "First" },
      { id: "mock-headset-2", productName: "Preferred" },
    ]);
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      headsetGateway: headset,
      logger: createTestLogger(),
    });

    const account = {
      username: "headset.agent",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const accountKey = deriveSettingsAccountKeyFromIdentity({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });
    await settings.saveUserSettings(accountKey, {
      ...createDefaultUserSettings(),
      headsetEnabled: true,
      headsetAutoReconnect: true,
      headsetPreferredDeviceId: "mock-headset-2",
    });

    await facade.authorizeManualAccount(account);

    const connected = headset.getConnectedDevice();
    expect(connected).not.toBeNull();
    expect(connected?.id).toBe("mock-headset-2");
  });

  it("skips startup SIP registration when sipAutoRegisterOnStartup is disabled", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    await telephony.unregister(createCorrelationId());
    const account = createSipAccount(createSipAccountId("startup-user"), {
      username: "startup-user",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
      phoneStatus: "online",
    });
    await settings.saveSipAccount(account);
    const accountKey = deriveSettingsAccountKeyFromIdentity({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });
    await settings.saveUserSettings(accountKey, {
      ...createDefaultUserSettings(),
      sipAutoRegisterOnStartup: false,
    });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.initialize({});

    expect(telephony.isRegistered()).toBe(false);
    expect(facade.hasStartupRegistrationFailure()).toBe(false);
  });

  it("surfaces startup registration failure when sipAutoRegisterOnStartup is enabled", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "failure" });
    const account = createSipAccount(createSipAccountId("startup-fail"), {
      username: "startup-fail",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const settings = new InMemorySettingsRepository({
      bootstrapConfig: {},
      phoneStatus: "online",
    });
    await settings.saveSipAccount(account);
    const accountKey = deriveSettingsAccountKeyFromIdentity({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });
    await settings.saveUserSettings(accountKey, {
      ...createDefaultUserSettings(),
      sipAutoRegisterOnStartup: true,
    });
    const facade = new AccountBootstrapFacade({
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      logger: createTestLogger(),
    });

    await facade.initialize({});

    expect(facade.hasStartupRegistrationFailure()).toBe(true);
    const retryResult = await facade.retryStartupRegistration();
    expect(retryResult.ok).toBe(false);
  });

  const ocpTestSipAccount = createSipAccount(createSipAccountId("ocp-agent"), {
    username: "ocp-agent",
    password: "secret",
    domain: "pbx.example",
    server: "sip:pbx.example",
  });

  it("updates OCP settings and stores api key outside UserSettings JSON", async () => {
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const secretStorage = new InMemorySecretStorageAdapter();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const updateResult = await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: true,
      linked: false,
    });
    expect(updateResult.ok).toBe(true);
    if (updateResult.ok) {
      expect(updateResult.value.ocpIntegration).toEqual({
        enabled: true,
        domain: "ocp.example.com",
        autoConnect: true,
        linked: false,
      });
    }

    const saveApiKey = await facade.saveOcpProxyApiKey("secret-ocp-api-key");
    expect(saveApiKey.ok).toBe(true);

    const loadedApiKey = await facade.getOcpProxyApiKey();
    expect(loadedApiKey.ok).toBe(true);
    if (loadedApiKey.ok) {
      expect(loadedApiKey.value).toBe("secret-ocp-api-key");
    }

    const loadedSettings = await facade.getUserSettingsForAccount();
    expect(loadedSettings.ok).toBe(true);
    if (loadedSettings.ok) {
      expect(JSON.stringify(loadedSettings.value)).not.toContain("secret-ocp-api-key");
      expect(
        Object.prototype.hasOwnProperty.call(loadedSettings.value, "ocpProxyApiKey"),
      ).toBe(false);
    }

    const deleteApiKey = await facade.deleteOcpProxyApiKey();
    expect(deleteApiKey.ok).toBe(true);
    const afterDelete = await facade.getOcpProxyApiKey();
    expect(afterDelete.ok).toBe(true);
    if (afterDelete.ok) {
      expect(afterDelete.value).toBeNull();
    }
  });

  it("connects and disconnects OCP via facade using settings domain and stored api key", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    await settings.saveSipAccount(ocpTestSipAccount);
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: false,
      linked: false,
    });
    await facade.saveOcpProxyApiKey("api-key-abc");

    const connectPending = facade.connectOcp();
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: ocpTestSipAccount.username,
      domain: ocpTestSipAccount.domain,
      server: ocpTestSipAccount.server,
    });
    const connectResult = await connectPending;
    expect(connectResult.ok).toBe(true);
    expect(gateway.getConnectionState()).toBe("connected");
    expect(facade.getOcpConnectionState()).toBe("authenticated");
    expect(
      facade.getOcpSessionSnapshot().authorizationProgress.stage,
    ).toBe("ready");

    const disconnectResult = await facade.disconnectOcp();
    expect(disconnectResult.ok).toBe(true);
    expect(gateway.getConnectionState()).toBe("disconnected");
  });

  it("keeps OCP proxy domain for reconnect token when creds use a distinct SIP domain", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const profiles = new InMemorySavedAccountProfileRepository();
    const proxy = new MockOcpProxyAuthenticatePort();
    await settings.saveSipAccount(ocpTestSipAccount);
    const accountKey = deriveSettingsAccountKeyFromIdentity(ocpTestSipAccount);
    await profiles.saveProfile(
      {
        username: ocpTestSipAccount.username,
        domain: ocpTestSipAccount.domain,
        server: ocpTestSipAccount.server,
      },
      { ocpDomain: "ocp.example.com", lifecycleStatus: "successful" },
    );
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      savedAccountProfileRepository: profiles,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: proxy,
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings(
      {
        enabled: true,
        domain: "ocp.example.com",
        autoConnect: false,
        linked: false,
      },
      { accountKey },
    );
    await facade.saveOcpProxyApiKey("api-key-abc", { accountKey });

    const connectPending = facade.connectOcp();
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: ocpTestSipAccount.username,
      domain: ocpTestSipAccount.domain,
      server: ocpTestSipAccount.server,
    });
    expect((await connectPending).ok).toBe(true);
    // Creds SIP host must not replace OCP proxy hostname (root cause of wrong token URL).
    expect(facade.getOcpSessionSnapshot().domain).toBe("ocp.example.com");
    expect(facade.getOcpSessionSnapshot().primaryRecoveryAction).toBe("reconnect");

    const afterConnect = await settings.getUserSettings(accountKey);
    expect(afterConnect.ocpIntegration.domain).toBe("ocp.example.com");
    expect(proxy.calls.map((call) => call.domain)).toEqual(["ocp.example.com"]);

    // Simulate legacy pollution: settings accidentally equal SIP PBX host.
    await facade.updateOcpSettings(
      {
        ...afterConnect.ocpIntegration,
        domain: ocpTestSipAccount.domain,
      },
      { accountKey },
    );

    const reconnectPending = facade.dispatchAccountRecoveryAction("reconnect");
    await vi.waitFor(() => {
      expect(proxy.calls.length).toBe(2);
      expect(proxy.calls.at(-1)?.domain).toBe("ocp.example.com");
    });
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(2, {
      username: ocpTestSipAccount.username,
      domain: ocpTestSipAccount.domain,
      server: ocpTestSipAccount.server,
    });
    const reconnectResult = await reconnectPending;
    expect(reconnectResult.ok).toBe(true);
    // Exactly one fresh-token HTTP call for Reconnect — no delayed transport-recovery twin.
    expect(proxy.calls.map((call) => call.domain)).toEqual([
      "ocp.example.com",
      "ocp.example.com",
    ]);
    const healed = await settings.getUserSettings(accountKey);
    expect(healed.ocpIntegration.domain).toBe("ocp.example.com");
  });

  it("rejects empty OCP api key saves", async () => {
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      secretStoragePort: new InMemorySecretStorageAdapter(),
      logger: createTestLogger(),
    });

    const result = await facade.saveOcpProxyApiKey("   ");
    expect(result.ok).toBe(false);
    if (isErr(result)) {
      expect(result.error.code).toBe("validation_failed");
    }
  });

  it("authenticates OCP from host and changes status with callType external", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    const authPending = facade.authenticateOcpFromHost({
      ocpDomain: " host.example.com ",
      login: "ocp-agent",
      apiKey: " host-secret ",
    });
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(9, {
      username: "ocp-agent",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const authResult = await authPending;
    expect(authResult.ok).toBe(true);
    expect(facade.getOcpConnectionState()).toBe("authenticated");

    const panel = await facade.getOcpModulePanelState({ login: "ocp-agent" });
    expect(panel.ok).toBe(true);
    if (!panel.ok) {
      return;
    }
    expect(panel.value.settings.domain).toBe("host.example.com");
    expect(panel.value.settings.enabled).toBe(true);
    expect(panel.value.settings.linked).toBe(true);
    expect(panel.value.hasApiKey).toBe(true);

    const apiKey = await facade.getOcpProxyApiKey({
      accountKey: panel.value.target.accountKey,
    });
    expect(apiKey.ok && apiKey.value).toBe("host-secret");

    const breakResult = await facade.changeOcpStatusFromHost({
      targetStatus: "break",
      reasonId: 11,
    });
    expect(breakResult.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_break",
      operatorId: 9,
      reasonId: 11,
      callType: "external",
    });
  });

  it("autoConnects OCP when enabled + autoConnect + api key and SIP login present", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const connectSpy = vi.spyOn(gateway, "connect");
    const settingsRepository = new InMemorySettingsRepository({ bootstrapConfig: {} });
    await settingsRepository.saveSipAccount(ocpTestSipAccount);
    const secretStoragePort = new InMemorySecretStorageAdapter();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository,
      secretStoragePort,
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.auto.example",
      autoConnect: true,
      linked: false,
    });
    await facade.saveOcpProxyApiKey("auto-api-key");

    const autoConnectPending = facade.maybeAutoConnectOcp();
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(1, {
      username: ocpTestSipAccount.username,
      domain: ocpTestSipAccount.domain,
      server: ocpTestSipAccount.server,
    });
    const result = await autoConnectPending;
    expect(result.ok).toBe(true);
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(gateway.getConnectionState()).toBe("connected");
    expect(facade.getOcpConnectionState()).toBe("authenticated");
  });

  it("skips autoConnect when api key missing", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const connectSpy = vi.spyOn(gateway, "connect");
    const settingsRepository = new InMemorySettingsRepository({ bootstrapConfig: {} });
    await settingsRepository.saveSipAccount(ocpTestSipAccount);
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.auto.example",
      autoConnect: true,
      linked: false,
    });

    const result = await facade.maybeAutoConnectOcp();
    expect(result.ok).toBe(true);
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("skips autoConnect when autoConnect is false", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const connectSpy = vi.spyOn(gateway, "connect");
    const settingsRepository = new InMemorySettingsRepository({ bootstrapConfig: {} });
    await settingsRepository.saveSipAccount(ocpTestSipAccount);
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.auto.example",
      autoConnect: false,
      linked: false,
    });
    await facade.saveOcpProxyApiKey("api-key");

    const result = await facade.maybeAutoConnectOcp();
    expect(result.ok).toBe(true);
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("logs out OCP from host with callType external", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    await settings.saveSipAccount(ocpTestSipAccount);
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: false,
      linked: false,
    });
    await facade.saveOcpProxyApiKey("api-key-host-logout");

    const connectPending = facade.connectOcp();
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(3, {
      username: ocpTestSipAccount.username,
      domain: ocpTestSipAccount.domain,
      server: ocpTestSipAccount.server,
    });
    const connectResult = await connectPending;
    expect(connectResult.ok).toBe(true);

    const logoutResult = await facade.logoutOcpFromHost({ reasonId: 9 });
    expect(logoutResult.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_logout",
      operatorId: 3,
      reasonId: 9,
      callType: "external",
    });
    expect(gateway.getConnectionState()).toBe("disconnected");
  });

  it("lists OCP connect login options from saved profiles", async () => {
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    await facade.saveSavedAccountProfile({
      username: "agent-one",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await facade.saveSavedAccountProfile({
      username: "agent-two",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const options = await facade.listOcpConnectLoginOptions();
    expect(options.ok).toBe(true);
    if (options.ok) {
      expect(options.value.map((item) => item.login)).toEqual([
        "agent-one",
        "agent-two",
      ]);
    }
  });

  it("scopes OCP settings to selected existing login without mutating active SIP prefs", async () => {
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const secretStorage = new InMemorySecretStorageAdapter();
    const savedProfiles = new InMemorySavedAccountProfileRepository();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      secretStoragePort: secretStorage,
      savedAccountProfileRepository: savedProfiles,
      logger: createTestLogger(),
    });

    await settings.saveSipAccount(ocpTestSipAccount);
    await facade.saveUserSettings({
      ...createDefaultUserSettings(),
      language: "en",
      ocpIntegration: {
        enabled: false,
        domain: "active-ocp.example",
        autoConnect: false,
        linked: false,
      },
    });

    const saved = await facade.saveSavedAccountProfile({
      username: "other-agent",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }

    const panel = await facade.getOcpModulePanelState({ login: "other-agent" });
    expect(panel.ok).toBe(true);
    if (!panel.ok) {
      return;
    }
    expect(panel.value.target.kind).toBe("existing");
    expect(panel.value.target.accountKey).toBe(saved.value.id);

    const update = await facade.updateOcpSettings(
      {
        enabled: true,
        domain: "other-ocp.example",
        autoConnect: false,
        linked: false,
      },
      { accountKey: panel.value.target.accountKey },
    );
    expect(update.ok).toBe(true);
    await facade.saveOcpProxyApiKey("other-api-key", {
      accountKey: panel.value.target.accountKey,
    });

    const activeSettings = await facade.getUserSettingsForAccount();
    expect(activeSettings.ok).toBe(true);
    if (activeSettings.ok) {
      expect(activeSettings.value.language).toBe("en");
      expect(activeSettings.value.ocpIntegration.domain).toBe("active-ocp.example");
    }

    const scoped = await facade.getOcpModulePanelState({ login: "other-agent" });
    expect(scoped.ok).toBe(true);
    if (scoped.ok) {
      expect(scoped.value.settings.domain).toBe("other-ocp.example");
      expect(scoped.value.hasApiKey).toBe(true);
    }
  });

  it("persists OCP settings for a new typed login under provisional username key", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    const secretStorage = new InMemorySecretStorageAdapter();
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      secretStoragePort: secretStorage,
      ocpGateway: gateway,
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    const panel = await facade.getOcpModulePanelState({ login: "brand-new" });
    expect(panel.ok).toBe(true);
    if (!panel.ok) {
      return;
    }
    expect(panel.value.target.kind).toBe("new");
    expect(panel.value.target.accountKey).toBe("brand-new");

    await facade.updateOcpSettings(
      {
        enabled: true,
        domain: "new-ocp.example",
        autoConnect: false,
        linked: false,
      },
      { accountKey: panel.value.target.accountKey },
    );
    await facade.saveOcpProxyApiKey("new-api-key", {
      accountKey: panel.value.target.accountKey,
    });

    const connectPending = facade.connectOcp({
      login: "brand-new",
      accountKey: panel.value.target.accountKey,
    });
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(7, {
      username: "brand-new",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const connectResult = await connectPending;
    expect(connectResult.ok).toBe(true);

    const after = await facade.getOcpModulePanelState({ login: "brand-new" });
    expect(after.ok).toBe(true);
    if (after.ok) {
      expect(after.value.settings.linked).toBe(true);
      expect(after.value.settings.domain).toBe("new-ocp.example");
      expect(after.value.hasApiKey).toBe(true);
    }
  });

  it("rejects connectOcp via login picker when login is empty", async () => {
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      ocpProxyAuthenticate: new MockOcpProxyAuthenticatePort(),
      logger: createTestLogger(),
    });

    const result = await facade.connectOcp({ login: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("login_required");
    }
  });

  it("retries preserved OCP authorization after SESSION_EXIST failure", async () => {
    const { MockOcpGateway } = await import("@adapters/mock/MockOcpGateway.js");
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({ kind: "session_exist" });
    const settings = new InMemorySettingsRepository({ bootstrapConfig: {} });
    await settings.saveSipAccount(ocpTestSipAccount);
    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      secretStoragePort: new InMemorySecretStorageAdapter(),
      ocpGateway: gateway,
      ocpProxyAuthenticate: proxy,
      logger: createTestLogger(),
    });

    await facade.updateOcpSettings({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: false,
      linked: false,
    });
    await facade.saveOcpProxyApiKey("api-key-abc");

    const first = await facade.connectOcp();
    expect(first.ok).toBe(false);
    if (!first.ok) {
      expect(first.error.message).toBe("ocp_session_exist");
    }
    expect(
      facade.getOcpSessionSnapshot().authorizationProgress.stage,
    ).toBe("ocp_session_exist");
    expect(
      facade.getOcpSessionSnapshot().authorizationProgress.retryAvailable,
    ).toBe(true);

    proxy.setBehavior({ kind: "token", token: "retry-token" });
    const retryPending = facade.retryAuthorization();
    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(99, {
      username: ocpTestSipAccount.username,
      domain: ocpTestSipAccount.domain,
      server: ocpTestSipAccount.server,
    });
    const retryResult = await retryPending;
    expect(retryResult.ok).toBe(true);
    expect(
      facade.getOcpSessionSnapshot().authorizationProgress.stage,
    ).toBe("ready");
  });
});
