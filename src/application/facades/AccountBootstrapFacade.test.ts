import { describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
  InMemorySavedAccountProfileRepository,
} from "@adapters/index.js";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  createDefaultUserSettings,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSettingsAccountKeyFromIdentity,
  type UserSettings,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import type { SavedAccountProfileRepository } from "@ports/index.js";
import {
  createSecretStorageScopeKey,
  SIP_PASSWORD_SECRET_ID,
} from "@ports/secrets/SecretStoragePort.js";
import { isErr } from "@shared/result/index.js";
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

  it("succeeds manual auth when save profile metadata fails after registration", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const baseRepo = new InMemorySavedAccountProfileRepository();
    const failingRepo: SavedAccountProfileRepository = {
      listProfiles: () => baseRepo.listProfiles(),
      getProfileById: (id) => baseRepo.getProfileById(id),
      deleteProfile: (id) => baseRepo.deleteProfile(id),
      touchLastUsedAt: (id) => baseRepo.touchLastUsedAt(id),
      saveProfile: () => Promise.reject(new Error("profile persistence failed")),
    };
    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
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

    expect(isErr(result)).toBe(false);
    if (!result.ok) {
      return;
    }
    expect(result.value.metadataWarning).toBe("profile_save_failed");
    expect(telephony.isRegistered()).toBe(true);
    expect(await failingRepo.listProfiles()).toHaveLength(0);
  });

  it("succeeds saved profile auth when touch lastUsedAt fails after registration", async () => {
    const telephony = new MockTelephonyGateway({ registrationScenario: "success" });
    const baseRepo = new InMemorySavedAccountProfileRepository();
    const failingRepo: SavedAccountProfileRepository = {
      listProfiles: () => baseRepo.listProfiles(),
      getProfileById: (id) => baseRepo.getProfileById(id),
      deleteProfile: (id) => baseRepo.deleteProfile(id),
      saveProfile: (input) => baseRepo.saveProfile(input),
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
    expect(result.value.metadataWarning).toBe("profile_touch_failed");
    expect(telephony.isRegistered()).toBe(true);
  });

  it("ends current user session before authorizing a different profile", async () => {
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

    const result = await facade.authorizeManualAccount(accountB);
    expect(isErr(result)).toBe(false);
    expect(endSessionSpy).toHaveBeenCalledOnce();
    expect(telephony.isRegistered()).toBe(true);
    const stored = await settings.getSipAccount();
    expect(stored?.username).toBe("1002");
  });

  it("saves remembered SIP password only after successful manual auth", async () => {
    const secretStorage = new InMemorySecretStorageAdapter();
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
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const failed = await failingFacade.authorizeManualAccount(
      { ...account, password: "wrong" },
      { rememberPassword: true },
    );
    expect(isErr(failed)).toBe(true);
    await expect(secretStorage.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBeNull();

    const facade = new AccountBootstrapFacade({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ bootstrapConfig: {} }),
      secretStoragePort: secretStorage,
      logger: createTestLogger(),
    });

    const success = await facade.authorizeManualAccount(account, { rememberPassword: true });
    expect(isErr(success)).toBe(false);
    await expect(secretStorage.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBe(
      "secret",
    );
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

    const deleted = await facade.deleteSavedAccountProfile(profileId);
    expect(deleted.ok).toBe(true);
    await expect(secretStorage.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID)).resolves.toBeNull();
  });

  it("returns non-blocking warning when remembered password save fails", async () => {
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

    expect(isErr(result)).toBe(false);
    if (!result.ok) {
      return;
    }
    expect(result.value.metadataWarning).toBe("password_save_failed");
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
});
