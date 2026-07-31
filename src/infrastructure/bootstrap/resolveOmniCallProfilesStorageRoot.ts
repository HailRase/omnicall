import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export const OMNICALL_APP_DATA_DIRECTORY_NAME = "omnicall";

/**
 * LEGACY: pre-rebrand subdirectory under Electron userData.
 * Value must match installs shipped before the OmniCall rename. Do not use for new writes.
 */
export const LEGACY_APP_DATA_DIRECTORY_NAME = "axatalk";

/**
 * LEGACY: Electron userData folder name from the previous productName.
 * Value must match installs shipped before the OmniCall rename.
 */
export const LEGACY_USER_DATA_FOLDER_NAME = "Axatalk";

export type LegacyAppDataMigrationResult =
  | "migrated"
  | "skipped_no_legacy"
  | "skipped_target_present"
  | "skipped_same_path";

/**
 * - Purpose: resolve OmniCall profiles storage root under Electron userData.
 * - Inputs: absolute userData directory path from main process.
 * - Outputs: absolute storage root for FileSettingsRepository (parent of profiles/).
 */
export function resolveOmniCallProfilesStorageRoot(userDataPath: string): string {
  return join(userDataPath, OMNICALL_APP_DATA_DIRECTORY_NAME);
}

/**
 * - Purpose: locate sibling pre-rebrand userData folder after productName rename.
 * - Inputs: current OmniCall userData absolute path.
 * - Outputs: absolute path to legacy userData (may not exist).
 */
export function resolveLegacyUserDataPath(currentUserDataPath: string): string {
  const parent = dirname(currentUserDataPath);
  const currentLeaf = basename(currentUserDataPath);
  if (currentLeaf === LEGACY_USER_DATA_FOLDER_NAME) {
    return currentUserDataPath;
  }
  return join(parent, LEGACY_USER_DATA_FOLDER_NAME);
}

function directoryHasEntries(path: string): boolean {
  if (!existsSync(path)) {
    return false;
  }
  try {
    if (!statSync(path).isDirectory()) {
      return false;
    }
    return readdirSync(path).length > 0;
  } catch {
    return false;
  }
}

/**
 * - Purpose: one-shot copy of pre-rebrand app data into OmniCall storage root.
 * - Inputs: current Electron userData path (OmniCall).
 * - Outputs: migration result; never deletes legacy files.
 */
export function migrateLegacyAppDataIfNeeded(
  currentUserDataPath: string,
): LegacyAppDataMigrationResult {
  const targetRoot = resolveOmniCallProfilesStorageRoot(currentUserDataPath);
  if (directoryHasEntries(targetRoot)) {
    return "skipped_target_present";
  }

  const sameFolderLegacy = join(
    currentUserDataPath,
    LEGACY_APP_DATA_DIRECTORY_NAME,
  );
  if (sameFolderLegacy !== targetRoot && directoryHasEntries(sameFolderLegacy)) {
    cpSync(sameFolderLegacy, targetRoot, { recursive: true, errorOnExist: false });
    return "migrated";
  }

  const legacyUserData = resolveLegacyUserDataPath(currentUserDataPath);
  const legacyRoot = join(legacyUserData, LEGACY_APP_DATA_DIRECTORY_NAME);
  if (!directoryHasEntries(legacyRoot)) {
    return "skipped_no_legacy";
  }

  if (legacyRoot === targetRoot) {
    return "skipped_same_path";
  }

  cpSync(legacyRoot, targetRoot, { recursive: true, errorOnExist: false });
  return "migrated";
}
