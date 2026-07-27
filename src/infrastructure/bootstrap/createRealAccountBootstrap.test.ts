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
import { MockContactCsvFileGateway } from "@adapters/mock/MockContactCsvFileGateway.js";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { CONTACT_CSV_CANONICAL_HEADER } from "@application/import-export/ContactCsvCodec.js";
import { isErr } from "@shared/result/index.js";
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
  const root = await mkdtemp(join(tmpdir(), "omnicall-bootstrap-"));
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
    });
    await facade1.authorizeSipAccount.execute({ account: accountA, source: "manual" });
    facade1.dispose();

    const indexJson = await readFile(resolveProfilesIndexPath(profilesStorageRoot), "utf8");
    expect(indexJson).toContain(keyA);
    expect(indexJson).not.toContain("password");

    const facade2 = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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

  it("isolates contacts across profile switches A→B→A with reload", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
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

    const facade = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: {},
    });

    const captureHandlers = () => {
      let contacts: ReadonlyArray<{ displayName: string }> = [];
      const handlers = {
        setContactsLoading: (): void => undefined,
        setContactsLoaded: (value: ReadonlyArray<{ displayName: string }>): void => {
          contacts = value;
        },
        setContactsLoadError: (): void => undefined,
        setCallHistoryLoading: (): void => undefined,
        setCallHistoryLoaded: (): void => undefined,
        setCallHistoryLoadError: (): void => undefined,
      };

      return {
        handlers,
        readContacts: (): ReadonlyArray<{ displayName: string }> => contacts,
      };
    };

    // Profile-bucket isolation: promote via AuthorizeSipAccount (default promoteActiveSession).
    // Full authorizeManualAccount requires successful register (deferred promotion — ADR-AF-001).
    await facade.authorizeSipAccount.execute({ account: accountA, source: "manual" });
    await facade.createContact({
      displayName: "Alice",
      primaryPhone: "+12025550100",
    });

    const afterA = captureHandlers();
    await facade.refreshProfileScopedDataProjections(afterA.handlers);
    expect(afterA.readContacts()).toHaveLength(1);
    expect(afterA.readContacts()[0]?.displayName).toBe("Alice");

    await facade.authorizeSipAccount.execute({ account: accountB, source: "manual" });
    const afterB = captureHandlers();
    await facade.refreshProfileScopedDataProjections(afterB.handlers);
    expect(afterB.readContacts()).toHaveLength(0);

    await facade.createContact({
      displayName: "Bob",
      primaryPhone: "+12025550101",
    });

    await facade.authorizeSipAccount.execute({ account: accountA, source: "manual" });
    const restoredA = captureHandlers();
    await facade.refreshProfileScopedDataProjections(restoredA.handlers);
    expect(restoredA.readContacts()).toHaveLength(1);
    expect(restoredA.readContacts()[0]?.displayName).toBe("Alice");

    facade.dispose();
  });

  it("forwards contactCsvFileGateway for CSV import and export", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const importCsv = [
      CONTACT_CSV_CANONICAL_HEADER,
      "Imported Contact,+12025550100,,,",
    ].join("\n");
    const gateway = new MockContactCsvFileGateway({
      importContents: importCsv,
      exportResult: { kind: "success", savedFileName: "contacts-export.csv" },
    });

    const facade = createRealAccountBootstrap({
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: {},
      contactCsvFileGateway: gateway,
    });

    const importResult = await facade.importContactsFromCsv();
    expect(importResult.ok).toBe(true);
    if (!importResult.ok || importResult.value.kind !== "imported") {
      return;
    }
    expect(importResult.value.summary.createdCount).toBe(1);

    const exportResult = await facade.exportContactsToCsv();
    expect(exportResult.ok).toBe(true);
    if (!exportResult.ok || exportResult.value.kind !== "exported") {
      return;
    }
    expect(exportResult.value.contactCount).toBe(1);
    expect(gateway.getLastExportInput()?.contents).toContain("Imported Contact");

    facade.dispose();
  });
});

describe("createSoftphoneComposition bootstrap factories", () => {
  it("mock bootstrap reports unavailable CSV gateway when not injected", async () => {
    const facade = createMockAccountBootstrap({
      bootstrapConfig: {},
    });

    const importResult = await facade.importContactsFromCsv();
    expect(isErr(importResult)).toBe(true);
    if (!isErr(importResult)) {
      return;
    }
    expect(importResult.error.message).toContain("Contacts CSV file gateway is unavailable");

    const exportResult = await facade.exportContactsToCsv();
    expect(isErr(exportResult)).toBe(true);
    if (!isErr(exportResult)) {
      return;
    }
    expect(exportResult.error.message).toContain("Contacts CSV file gateway is unavailable");

    facade.dispose();
  });

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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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
      bootstrapConfig: {},
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

  it("real mode via composition forwards contactCsvFileGateway", async () => {
    const profilesStorageRoot = await createTempStorageRoot();
    const filesystem = new NodeFileSystemAdapter();
    const gateway = new MockContactCsvFileGateway({
      importContents: [CONTACT_CSV_CANONICAL_HEADER, "Via Composition,+12025550101,,,"].join(
        "\n",
      ),
      exportResult: { kind: "success", savedFileName: "contacts-export.csv" },
    });

    const facade = createSoftphoneComposition({
      mode: "real",
      profilesStorageRoot,
      filesystem,
      bootstrapConfig: {},
      contactCsvFileGateway: gateway,
    });

    const importResult = await facade.importContactsFromCsv();
    expect(importResult.ok).toBe(true);
    if (!importResult.ok || importResult.value.kind !== "imported") {
      return;
    }
    expect(importResult.value.summary.createdCount).toBe(1);

    const exportResult = await facade.exportContactsToCsv();
    expect(exportResult.ok).toBe(true);
    if (!exportResult.ok || exportResult.value.kind !== "exported") {
      return;
    }
    expect(exportResult.value.contactCount).toBe(1);
    expect(gateway.getLastExportInput()?.suggestedFileName).toContain("contacts-export-");

    facade.dispose();
  });
});
