import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deriveSettingsAccountKeyFromIdentity,
  SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { FileSavedAccountProfileRepository } from "./FileSavedAccountProfileRepository.js";
import {
  resolveProfilesRootPath,
  resolveSavedAccountProfilesFilePath,
} from "./profileStoragePaths.js";

const tempRoots: string[] = [];

async function createTestRepository(): Promise<{
  repository: FileSavedAccountProfileRepository;
  root: string;
  filesystem: NodeFileSystemAdapter;
}> {
  const root = await mkdtemp(join(tmpdir(), "axatalk-saved-profiles-"));
  tempRoots.push(root);
  const filesystem = new NodeFileSystemAdapter();
  const repository = new FileSavedAccountProfileRepository({
    storageRoot: root,
    filesystem,
    logger: createTestLogger(),
  });
  return { repository, root, filesystem };
}

function createRepositoryForRoot(
  root: string,
  filesystem: NodeFileSystemAdapter,
): FileSavedAccountProfileRepository {
  return new FileSavedAccountProfileRepository({
    storageRoot: root,
    filesystem,
    logger: createTestLogger(),
  });
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

const profileInput = {
  username: "alex.supervisor",
  domain: "pbx.example",
  server: "sip:pbx.example",
} as const;

describe("FileSavedAccountProfileRepository", () => {
  it("returns empty list when store file is absent", async () => {
    const { repository } = await createTestRepository();
    expect(await repository.listProfiles()).toEqual([]);
  });

  it("writes and reads profiles across repository instances", async () => {
    const { repository: first, root, filesystem } = await createTestRepository();

    await first.saveProfile(profileInput);
    const json = await readFile(resolveSavedAccountProfilesFilePath(root), "utf8");
    expect(json).toContain("alex.supervisor");
    expect(json).not.toContain("password");
    expect(json).toContain('"lifecycleStatus":"draft"');
    expect(json).toContain(`"schemaVersion":${SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION}`);

    const second = createRepositoryForRoot(root, filesystem);
    const profiles = await second.listProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.username).toBe("alex.supervisor");
    expect(profiles[0]?.lifecycleStatus).toBe("draft");
  });

  it("marks draft profile successful and persists marker", async () => {
    const { repository: first, root, filesystem } = await createTestRepository();
    const saved = await first.saveProfile(profileInput, { lifecycleStatus: "draft" });

    await first.markProfileSuccessful(saved.id, "2026-07-16T12:00:00.000Z");
    const second = createRepositoryForRoot(root, filesystem);
    const reloaded = await second.getProfileById(saved.id);
    expect(reloaded?.lifecycleStatus).toBe("successful");
    expect(reloaded?.successfulUseAt).toBe("2026-07-16T12:00:00.000Z");
  });

  it("save is idempotent for duplicate identity", async () => {
    const { repository } = await createTestRepository();

    const first = await repository.saveProfile(profileInput);
    const second = await repository.saveProfile({
      username: "  alex.supervisor ",
      domain: "https://pbx.example",
      server: "sip:pbx.example",
    });

    expect(second.id).toBe(first.id);
    expect(await repository.listProfiles()).toHaveLength(1);
  });

  it("deletes profile and persists empty document", async () => {
    const { repository, root } = await createTestRepository();
    const saved = await repository.saveProfile(profileInput);

    await repository.deleteProfile(saved.id);
    expect(await repository.listProfiles()).toHaveLength(0);

    const json = await readFile(resolveSavedAccountProfilesFilePath(root), "utf8");
    expect(json).toContain('"profiles":[]');
  });

  it("recovers conservatively from corrupt JSON", async () => {
    const { repository, root, filesystem } = await createTestRepository();
    await repository.seedCorruptDocument("{not-json");

    const reloaded = createRepositoryForRoot(root, filesystem);
    expect(await reloaded.listProfiles()).toEqual([]);
    await expect(reloaded.saveProfile(profileInput)).rejects.toThrow(
      "saved_account_profiles_document_requires_recovery",
    );
    await expect(
      readFile(resolveSavedAccountProfilesFilePath(root), "utf8"),
    ).resolves.toBe("{not-json");
  });

  it("recovers conservatively from unsupported schema version", async () => {
    const { repository, root, filesystem } = await createTestRepository();
    await repository.seedCorruptDocument(JSON.stringify({ schemaVersion: 99, profiles: [] }));

    const reloaded = createRepositoryForRoot(root, filesystem);
    expect(await reloaded.listProfiles()).toEqual([]);
  });

  it("ignores persisted documents that contain secret fields", async () => {
    const { repository, root, filesystem } = await createTestRepository();
    await repository.seedCorruptDocument(
      JSON.stringify({
        schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
        profiles: [
          {
            id: "agent@pbx.example",
            username: "agent",
            domain: "pbx.example",
            server: "sip:pbx.example",
            displayName: "agent",
            password: "secret",
          },
        ],
      }),
    );

    const reloaded = createRepositoryForRoot(root, filesystem);
    expect(await reloaded.listProfiles()).toEqual([]);
  });

  it("stores document under profiles root only", async () => {
    const { repository, root } = await createTestRepository();
    await repository.saveProfile(profileInput);

    const filePath = resolveSavedAccountProfilesFilePath(root);
    expect(filePath.startsWith(resolveProfilesRootPath(root))).toBe(true);
    expect(filePath).toContain("saved-accounts.json");
  });

  it("preserves profile id aligned with settings account key", async () => {
    const { repository } = await createTestRepository();
    const saved = await repository.saveProfile(profileInput);
    const expectedId = deriveSettingsAccountKeyFromIdentity(profileInput);
    expect(saved.id).toBe(expectedId);
  });

  it("rolls memory back when atomic file write fails", async () => {
    const { repository, filesystem } = await createTestRepository();
    const saved = await repository.saveProfile(profileInput, {
      lifecycleStatus: "successful",
    });
    vi.spyOn(filesystem, "writeTextFileAtomic").mockRejectedValueOnce(
      new Error("disk_full"),
    );

    await expect(
      repository.saveProfile(profileInput, { ocpDomain: "ocp.example" }),
    ).rejects.toThrow("disk_full");

    const after = await repository.getProfileById(saved.id);
    expect(after?.ocpDomain).toBeUndefined();
    expect(after?.lifecycleStatus).toBe("successful");
  });
});
