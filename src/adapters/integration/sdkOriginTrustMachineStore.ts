/**
 * Machine-common Origin trust persistence + boot hydrate (ADR-0018 §C.4 / DI-11).
 * Not siloed under `__anonymous__` vs active SIP UserSettings buckets.
 */

import {
  parseSdkIntegrationSettings,
  SDK_INTEGRATION_DEFAULTS,
  type SdkIntegrationSettings,
  type SdkOriginTrustEntry,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { SettingsRepository } from "@ports/index.js";
import {
  resolveProfilesRootPath,
  resolveSdkOriginTrustFilePath,
} from "@adapters/settings/profileStoragePaths.js";
import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";

import {
  loadSdkOriginAllowlistFromEnv,
  mergePersistedOriginTrustWithEnvSeed,
} from "./sdkGatewayOriginPolicy.js";

export const SDK_ORIGIN_TRUST_SCHEMA_VERSION = 1 as const;

export class SdkOriginTrustStoreCorruptError extends Error {
  readonly code = "sdk_origin_trust_store_corrupt" as const;

  constructor(message: string) {
    super(message);
    this.name = "SdkOriginTrustStoreCorruptError";
  }
}

/**
 * Merge trust rows. For the same Origin, `denied` always wins; otherwise overlay wins.
 */
export function mergeSdkOriginTrustEntries(
  base: readonly SdkOriginTrustEntry[],
  overlay: readonly SdkOriginTrustEntry[],
): readonly SdkOriginTrustEntry[] {
  const map = new Map<string, SdkOriginTrustEntry>();
  for (const entry of base) {
    map.set(entry.origin, entry);
  }
  for (const entry of overlay) {
    const existing = map.get(entry.origin);
    if (existing === undefined) {
      map.set(entry.origin, entry);
      continue;
    }
    if (existing.state === "denied") {
      map.set(entry.origin, existing);
      continue;
    }
    if (entry.state === "denied") {
      map.set(entry.origin, entry);
      continue;
    }
    map.set(entry.origin, entry);
  }
  return [...map.values()];
}

export function mergeSdkIntegrationTrustSettings(
  base: SdkIntegrationSettings,
  overlay: SdkIntegrationSettings,
): SdkIntegrationSettings {
  return {
    originsManaged: base.originsManaged || overlay.originsManaged,
    origins: mergeSdkOriginTrustEntries(base.origins, overlay.origins),
    // Timeouts live in UserSettings; prefer overlay (caller) then base.
    operatorModalTimeouts:
      overlay.operatorModalTimeouts ?? base.operatorModalTimeouts,
  };
}

function parseMachineTrustDocument(raw: unknown): SdkIntegrationSettings | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const schemaVersion = record["schemaVersion"];
  if (schemaVersion !== SDK_ORIGIN_TRUST_SCHEMA_VERSION) {
    return null;
  }
  return parseSdkIntegrationSettings({
    origins: record["origins"],
    originsManaged: record["originsManaged"],
  });
}

export type LoadSdkOriginTrustMachineStoreResult =
  | Readonly<{ status: "missing"; settings: SdkIntegrationSettings }>
  | Readonly<{ status: "loaded"; settings: SdkIntegrationSettings }>
  | Readonly<{ status: "corrupt"; reason: "invalid_json" | "invalid_document" }>;

/**
 * Load machine-common Origin trust.
 * Missing file → defaults. Corrupt/unreadable document → `corrupt` (fail-closed).
 */
export async function loadSdkOriginTrustMachineStore(input: {
  readonly storageRoot: string;
  readonly filesystem: FileSystemPort;
}): Promise<LoadSdkOriginTrustMachineStoreResult> {
  const filePath = resolveSdkOriginTrustFilePath(input.storageRoot);
  let json: string | null;
  try {
    json = await input.filesystem.readTextFile(filePath);
  } catch {
    return { status: "corrupt", reason: "invalid_json" };
  }
  if (json === null) {
    return { status: "missing", settings: { ...SDK_INTEGRATION_DEFAULTS } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return { status: "corrupt", reason: "invalid_json" };
  }
  const document = parseMachineTrustDocument(parsed);
  if (document === null) {
    return { status: "corrupt", reason: "invalid_document" };
  }
  return { status: "loaded", settings: document };
}

/** Persist machine-common Origin trust (atomic). */
export async function saveSdkOriginTrustMachineStore(input: {
  readonly storageRoot: string;
  readonly filesystem: FileSystemPort;
  readonly settings: SdkIntegrationSettings;
}): Promise<void> {
  await input.filesystem.ensureDirectory(resolveProfilesRootPath(input.storageRoot));
  const document = {
    schemaVersion: SDK_ORIGIN_TRUST_SCHEMA_VERSION,
    originsManaged: input.settings.originsManaged,
    origins: input.settings.origins,
  };
  await input.filesystem.writeTextFileAtomic(
    resolveSdkOriginTrustFilePath(input.storageRoot),
    `${JSON.stringify(document, null, 2)}\n`,
  );
}

/**
 * Mirror machine-common trust into every known UserSettings profile bucket (UX lag fix).
 * Failures per bucket are skipped; machine store remains SoT for admission.
 */
export async function mirrorSdkOriginTrustToProfileBuckets(input: {
  readonly storageRoot: string;
  readonly filesystem: FileSystemPort;
  readonly settings: SdkIntegrationSettings;
  readonly settingsRepository?: SettingsRepository;
}): Promise<void> {
  const settingsRepository =
    input.settingsRepository ??
    new FileSettingsRepository({
      storageRoot: input.storageRoot,
      filesystem: input.filesystem,
    });
  const keys = await settingsRepository.listKnownProfileKeys();
  for (const key of keys) {
    try {
      const current = await settingsRepository.getUserSettings(key);
      await settingsRepository.saveUserSettings(key, {
        ...current,
        // Origins from machine SoT; keep per-profile operator modal TTLs.
        sdkIntegration: {
          ...current.sdkIntegration,
          originsManaged: input.settings.originsManaged,
          origins: input.settings.origins,
        },
      });
    } catch {
      // Corrupt / locked bucket — skip; admission uses machine store.
    }
  }
}

/**
 * One-shot migrate: merge sdkIntegration from all known profile buckets into
 * machine-common store when the machine file is still empty/unmanaged.
 */
export async function migrateSdkOriginTrustFromProfileBuckets(input: {
  readonly storageRoot: string;
  readonly filesystem: FileSystemPort;
  readonly settingsRepository: SettingsRepository;
}): Promise<SdkIntegrationSettings> {
  const existing = await loadSdkOriginTrustMachineStore(input);
  if (existing.status === "corrupt") {
    throw new SdkOriginTrustStoreCorruptError(
      `sdk-origin-trust.json is corrupt (${existing.reason}); refuse migrate/hydrate`,
    );
  }
  if (
    existing.status === "loaded" &&
    (existing.settings.originsManaged || existing.settings.origins.length > 0)
  ) {
    return existing.settings;
  }

  let merged: SdkIntegrationSettings = { ...SDK_INTEGRATION_DEFAULTS };
  const keys = await input.settingsRepository.listKnownProfileKeys();
  for (const key of keys) {
    try {
      const settings = await input.settingsRepository.getUserSettings(key);
      merged = mergeSdkIntegrationTrustSettings(merged, settings.sdkIntegration);
    } catch {
      // Corrupt profile bucket — skip; machine store remains fail-closed.
    }
  }

  if (merged.origins.length > 0 || merged.originsManaged) {
    await saveSdkOriginTrustMachineStore({
      storageRoot: input.storageRoot,
      filesystem: input.filesystem,
      settings: merged,
    });
  }
  return merged;
}

export type SdkOriginTrustBootHydrate = Readonly<{
  storageRoot: string;
  settings: SdkIntegrationSettings;
  originTrustEntries: readonly SdkOriginTrustEntry[];
}>;

/**
 * Resolve Origin trust for gateway construction before upgrade/discovery.
 * Env seed is allow-only; persisted `denied` always wins.
 * Corrupt machine store throws — caller must not listen with env-only allow seed.
 */
export async function hydrateSdkOriginTrustForGatewayBoot(input: {
  readonly storageRoot: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly filesystem?: FileSystemPort;
}): Promise<SdkOriginTrustBootHydrate> {
  const filesystem = input.filesystem ?? new NodeFileSystemAdapter();
  const { storageRoot } = input;
  const settingsRepository = new FileSettingsRepository({
    storageRoot,
    filesystem,
  });

  const migrated = await migrateSdkOriginTrustFromProfileBuckets({
    storageRoot,
    filesystem,
    settingsRepository,
  });
  const machine =
    migrated.origins.length > 0 || migrated.originsManaged
      ? migrated
      : await (async () => {
          const loaded = await loadSdkOriginTrustMachineStore({
            storageRoot,
            filesystem,
          });
          if (loaded.status === "corrupt") {
            throw new SdkOriginTrustStoreCorruptError(
              `sdk-origin-trust.json is corrupt (${loaded.reason})`,
            );
          }
          return loaded.settings;
        })();

  const envAllowlist = loadSdkOriginAllowlistFromEnv(input.env ?? process.env);
  const originTrustEntries = mergePersistedOriginTrustWithEnvSeed(
    machine.origins,
    envAllowlist,
  );

  return {
    storageRoot,
    settings: {
      originsManaged: machine.originsManaged || originTrustEntries.length > 0,
      origins: originTrustEntries,
      operatorModalTimeouts: machine.operatorModalTimeouts,
    },
    originTrustEntries,
  };
}

/** Persist live gateway trust entries to the machine-common store + profile mirrors. */
export async function persistSdkOriginTrustMachineFromEntries(input: {
  readonly storageRoot: string;
  readonly origins: readonly SdkOriginTrustEntry[];
  readonly originsManaged?: boolean;
  readonly filesystem?: FileSystemPort;
}): Promise<void> {
  const filesystem = input.filesystem ?? new NodeFileSystemAdapter();
  const settings: SdkIntegrationSettings = {
    originsManaged: input.originsManaged ?? true,
    origins: input.origins,
    operatorModalTimeouts: { ...SDK_INTEGRATION_DEFAULTS.operatorModalTimeouts },
  };
  await saveSdkOriginTrustMachineStore({
    storageRoot: input.storageRoot,
    filesystem,
    settings,
  });
  await mirrorSdkOriginTrustToProfileBuckets({
    storageRoot: input.storageRoot,
    filesystem,
    settings,
  });
}
