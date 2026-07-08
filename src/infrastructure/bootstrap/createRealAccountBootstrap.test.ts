import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { deriveSettingsAccountKeyFromIdentity } from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import {
  resolveProfileSettingsFilePath,
  resolveProfileContactsFilePath,
  resolveProfilesIndexPath,
  resolveSavedAccountProfilesFilePath,
} from "@adapters/settings/profileStoragePaths.js";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { createMockAccountBootstrap } from "./createMockAccountBootstrap.js";
import { createRealAccountBootstrap } from "./createRealAccountBootstrap.js";
import { createSoftphoneComposition } from "./createSoftphoneComposition.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

async function createTempStorageRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "axatalk-bootstrap-"));
  tempRoots.push(root);
  return root;
}

describe("createRealAccountBootstrap", () => {
  it("persists user settings across new repository instances after authorize", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const accountA = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const keyA = deriveSettingsAccountKeyFromIdentity({
      username: accountA.username,
      domain: accountA.domain,
      server: accountA.server,
    });

    const facade1 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    const authorizeResult = await facade1.authorizeSipAccount.execute({
      account: accountA,
      source: "manual",
    });
    expect(authorizeResult.ok).toBe(true);

    const loaded = await facade1.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const saved = await facade1.saveUserSettings({
      ...loaded.value,
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 7,
      sipAutoReconnectEnabled: false,
    });
    expect(saved.ok).toBe(true);

    const settingsPath = resolveProfileSettingsFilePath(profilesStorageRoot, keyA);
    const persistedJson = await readFile(settingsPath, "utf8");
    expect(persistedJson).not.toContain("password");
    expect(persistedJson).toContain('"theme":"dark"');

    facade1.dispose();

    const facade2 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    const reauthorizeResult = await facade2.authorizeSipAccount.execute({
      account: accountA,
      source: "manual",
    });
    expect(reauthorizeResult.ok).toBe(true);

    const restored = await facade2.getUserSettingsForAccount();
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }

    expect(restored.value).toMatchObject({
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 7,
      sipAutoReconnectEnabled: false,
    });

    facade2.dispose();
  });

  it("uses defaults on first run when profiles directory is empty", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();

    const facade = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    const loaded = await facade.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.language).toBe("ru");
      expect(loaded.value.theme).toBe("light");
    }

    facade.dispose();
  });

  it("restores active profile key from persisted index across instances", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const accountA = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const keyA = deriveSettingsAccountKeyFromIdentity({
      username: accountA.username,
      domain: accountA.domain,
      server: accountA.server,
    });

    const facade1 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });
    await facade1.authorizeSipAccount.execute({ account: accountA, source: "manual" });
    facade1.dispose();

    const indexJson = await readFile(resolveProfilesIndexPath(profilesStorageRoot), "utf8");
    expect(indexJson).toContain(keyA);
    expect(indexJson).not.toContain("password");

    const facade2 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });
    await facade2.authorizeSipAccount.execute({ account: accountA, source: "manual" });

    const restored = await facade2.getUserSettingsForAccount();
    expect(restored.ok).toBe(true);
    facade2.dispose();
  });

  it("persists saved account profiles across bootstrap instances", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const account = {
      username: "max.operator",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    const facade1 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    const saved = await facade1.saveSavedAccountProfile({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });
    expect(saved.ok).toBe(true);

    const listed = await facade1.listSavedAccountProfiles();
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }
    expect(listed.value).toHaveLength(1);

    const savedAccountsPath = resolveSavedAccountProfilesFilePath(profilesStorageRoot);
    const persistedJson = await readFile(savedAccountsPath, "utf8");
    expect(persistedJson).toContain("max.operator");
    expect(persistedJson).not.toContain("password");

    facade1.dispose();

    const facade2 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    const restored = await facade2.listSavedAccountProfiles();
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(restored.value).toHaveLength(1);
    expect(restored.value[0]?.username).toBe("max.operator");

    facade2.dispose();
  });

  it("persists contacts across bootstrap instances for authorized account", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const account = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const key = deriveSettingsAccountKeyFromIdentity({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });

    const facade1 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    await facade1.authorizeSipAccount.execute({ account, source: "manual" });
    const created = await facade1.createContact({
      displayName: "Alex Agent",
      primaryPhone: "+12025550100",
    });
    expect(created.ok).toBe(true);

    const contactsPath = resolveProfileContactsFilePath(profilesStorageRoot, key);
    const persistedJson = await readFile(contactsPath, "utf8");
    expect(persistedJson).toContain("Alex Agent");
    expect(persistedJson).not.toContain("password");

    facade1.dispose();

    const facade2 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    await facade2.authorizeSipAccount.execute({ account, source: "manual" });
    const listed = await facade2.listContacts();
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }
    expect(listed.value).toHaveLength(1);
    expect(listed.value[0]?.displayName).toBe("Alex Agent");

    facade2.dispose();
  });
});

describe("createSoftphoneComposition bootstrap factories", () => {
  it("mock bootstrap injects provided saved profile repository", async () => {
    const repository = new InMemorySavedAccountProfileRepository();
    const facade = createMockAccountBootstrap({
      savedAccountProfileRepository: repository,
    });

    const saved = await facade.saveSavedAccountProfile({
      username: "agent",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    expect(saved.ok).toBe(true);
    expect(await repository.listProfiles()).toHaveLength(1);
    facade.dispose();
  });

  it("mock mode keeps in-memory settings isolated per facade instance", async () => {
    const account = {
      username: "1001",
      password: "secret-a",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };

    const facade1 = createMockAccountBootstrap({
      bootstrapConfig: { mode: "sip-only" },
    });
    await facade1.authorizeSipAccount.execute({ account, source: "manual" });
    const loaded = await facade1.getUserSettingsForAccount();
    if (loaded.ok) {
      await facade1.saveUserSettings({
        ...loaded.value,
        theme: "dark",
      });
    }
    facade1.dispose();

    const facade2 = createMockAccountBootstrap({
      bootstrapConfig: { mode: "sip-only" },
    });
    const restored = await facade2.getUserSettingsForAccount();
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.value.theme).toBe("light");
    }
    facade2.dispose();
  });

  it("mock mode via composition matches in-memory repository", async () => {
    const facade = createSoftphoneComposition({
      mode: "mock",
      bootstrapConfig: { mode: "sip-only" },
    });

    const loaded = await facade.getUserSettingsForAccount();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.theme).toBe("light");
    }
    facade.dispose();
  });

  it("real mode wires FileSettingsRepository when profiles storage root is injected", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const account = {
      username: "agent",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const key = deriveSettingsAccountKeyFromIdentity({
      username: account.username,
      domain: account.domain,
      server: account.server,
    });

    const facade = createSoftphoneComposition({
      mode: "real",
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: { mode: "sip-only" },
    });

    await facade.authorizeSipAccount.execute({ account, source: "manual" });
    const loaded = await facade.getUserSettingsForAccount();
    if (!loaded.ok) {
      return;
    }

    await facade.saveUserSettings({
      ...loaded.value,
      theme: "dark",
    });

    const settingsPath = resolveProfileSettingsFilePath(profilesStorageRoot, key);
    const persistedJson = await readFile(settingsPath, "utf8");
    expect(persistedJson).toContain('"theme":"dark"');
    expect(persistedJson).not.toContain("password");

    facade.dispose();
  });
});
