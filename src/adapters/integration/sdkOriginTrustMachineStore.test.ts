/**
 * Machine-common Origin trust store + boot hydrate (DI-11 / ADR-0018).
 */

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  createDefaultUserSettings,
  createSettingsAccountKey,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import { LocalWsServerAdapter } from "./LocalWsServerAdapter.js";
import { evaluateSdkOriginUpgrade } from "./sdkGatewayOriginPolicy.js";
import {
  hydrateSdkOriginTrustForGatewayBoot,
  loadSdkOriginTrustMachineStore,
  migrateSdkOriginTrustFromProfileBuckets,
  mirrorSdkOriginTrustToProfileBuckets,
  saveSdkOriginTrustMachineStore,
  SdkOriginTrustStoreCorruptError,
} from "./sdkOriginTrustMachineStore.js";
import {
  resolveProfilesRootPath,
  resolveSdkOriginTrustFilePath,
} from "@adapters/settings/profileStoragePaths.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

async function createTempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "axatalk-origin-trust-"));
  tempRoots.push(root);
  return root;
}

describe("sdkOriginTrustMachineStore + boot hydrate", () => {
  it("persist denied → rehydrate → evaluateSdkOriginUpgrade rejects", async () => {
    const storageRoot = await createTempRoot();
    const filesystem = new NodeFileSystemAdapter();
    const deniedOrigin = "https://blocked.example";

    await saveSdkOriginTrustMachineStore({
      storageRoot,
      filesystem,
      settings: {
        originsManaged: true,
        origins: [
          {
            origin: deniedOrigin,
            state: "denied",
            matrix: null,
            previouslyAllowed: false,
          },
        ],
      },
    });

    const hydrated = await hydrateSdkOriginTrustForGatewayBoot({
      storageRoot,
      filesystem,
      env: {},
    });

    expect(evaluateSdkOriginUpgrade(deniedOrigin, hydrated.originTrustEntries)).toEqual({
      action: "reject",
      reason: "origin_denied",
    });

    const adapter = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      enabled: false,
      originTrustEntries: hydrated.originTrustEntries,
    });
    expect(
      evaluateSdkOriginUpgrade(deniedOrigin, adapter.getOriginTrustEntries()),
    ).toEqual({ action: "reject", reason: "origin_denied" });
  });

  it("denied persists across restart even when Origin is in env allow seed", async () => {
    const storageRoot = await createTempRoot();
    const filesystem = new NodeFileSystemAdapter();
    const deniedOrigin = "https://crm.example";

    await saveSdkOriginTrustMachineStore({
      storageRoot,
      filesystem,
      settings: {
        originsManaged: true,
        origins: [
          {
            origin: deniedOrigin,
            state: "denied",
            matrix: null,
            previouslyAllowed: true,
          },
        ],
      },
    });

    const hydrated = await hydrateSdkOriginTrustForGatewayBoot({
      storageRoot,
      filesystem,
      env: {
        AXATALK_SDK_ALLOWED_ORIGINS: `${deniedOrigin},https://other.example`,
      },
    });

    expect(evaluateSdkOriginUpgrade(deniedOrigin, hydrated.originTrustEntries)).toEqual({
      action: "reject",
      reason: "origin_denied",
    });
    expect(
      evaluateSdkOriginUpgrade("https://other.example", hydrated.originTrustEntries),
    ).toEqual({ action: "accept", trustState: "allowed" });

    // Simulate second process start (re-read disk).
    const reloaded = await loadSdkOriginTrustMachineStore({ storageRoot, filesystem });
    expect(reloaded.status).toBe("loaded");
    if (reloaded.status !== "loaded") {
      throw new Error("expected loaded store");
    }
    const secondBoot = await hydrateSdkOriginTrustForGatewayBoot({
      storageRoot,
      filesystem,
      env: { AXATALK_SDK_ALLOWED_ORIGINS: deniedOrigin },
    });
    expect(reloaded.settings.origins[0]?.state).toBe("denied");
    expect(
      evaluateSdkOriginUpgrade(deniedOrigin, secondBoot.originTrustEntries),
    ).toEqual({ action: "reject", reason: "origin_denied" });
  });

  it("corrupt machine store fails closed (no env seed reopen)", async () => {
    const storageRoot = await createTempRoot();
    const filesystem = new NodeFileSystemAdapter();
    await filesystem.ensureDirectory(resolveProfilesRootPath(storageRoot));
    await filesystem.writeTextFileAtomic(
      resolveSdkOriginTrustFilePath(storageRoot),
      "{ not-json\n",
    );

    await expect(
      hydrateSdkOriginTrustForGatewayBoot({
        storageRoot,
        filesystem,
        env: { AXATALK_SDK_ALLOWED_ORIGINS: "https://evil.example" },
      }),
    ).rejects.toBeInstanceOf(SdkOriginTrustStoreCorruptError);

    const loaded = await loadSdkOriginTrustMachineStore({ storageRoot, filesystem });
    expect(loaded).toEqual({ status: "corrupt", reason: "invalid_json" });
  });

  it("mirrors machine trust into profile UserSettings buckets", async () => {
    const storageRoot = await createTempRoot();
    const filesystem = new NodeFileSystemAdapter();
    const repository = new FileSettingsRepository({ storageRoot, filesystem });
    const sipKey = createSettingsAccountKey("sip|bob@example.com");
    const origin = "https://mirror.example";

    await repository.saveUserSettings(sipKey, createDefaultUserSettings());
    const settings = {
      originsManaged: true,
      origins: [
        {
          origin,
          state: "denied" as const,
          matrix: null,
          previouslyAllowed: false,
        },
      ],
    };
    await saveSdkOriginTrustMachineStore({ storageRoot, filesystem, settings });
    await mirrorSdkOriginTrustToProfileBuckets({
      storageRoot,
      filesystem,
      settings,
      settingsRepository: repository,
    });

    const mirrored = await repository.getUserSettings(sipKey);
    expect(mirrored.sdkIntegration.origins[0]?.origin).toBe(origin);
    expect(mirrored.sdkIntegration.origins[0]?.state).toBe("denied");
  });

  it("migrates denied rows from SIP profile silo into machine-common store", async () => {
    const storageRoot = await createTempRoot();
    const filesystem = new NodeFileSystemAdapter();
    const repository = new FileSettingsRepository({ storageRoot, filesystem });
    const sipKey = createSettingsAccountKey("sip|alice@example.com");
    const deniedOrigin = "https://legacy-silo.example";

    await repository.saveUserSettings(sipKey, {
      ...createDefaultUserSettings(),
      sdkIntegration: {
        originsManaged: true,
        origins: [
          {
            origin: deniedOrigin,
            state: "denied",
            matrix: null,
            previouslyAllowed: false,
          },
        ],
      },
    });

    const migrated = await migrateSdkOriginTrustFromProfileBuckets({
      storageRoot,
      filesystem,
      settingsRepository: repository,
    });
    expect(migrated.origins.some((row) => row.origin === deniedOrigin && row.state === "denied")).toBe(
      true,
    );

    const hydrated = await hydrateSdkOriginTrustForGatewayBoot({
      storageRoot,
      filesystem,
      env: { AXATALK_SDK_ALLOWED_ORIGINS: deniedOrigin },
    });
    expect(evaluateSdkOriginUpgrade(deniedOrigin, hydrated.originTrustEntries)).toEqual({
      action: "reject",
      reason: "origin_denied",
    });
  });
});
