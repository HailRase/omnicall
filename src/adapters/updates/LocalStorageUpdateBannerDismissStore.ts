import type { UpdateBannerDismissStore } from "@ports/updates/UpdateBannerDismissStore.js";

export const UPDATE_BANNER_DISMISS_STORAGE_KEY = "omnicall.dismissed-update-banner-version";

/** LEGACY: pre-rebrand localStorage key — read once and migrate. */
export const LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY =
  "axatalk.dismissed-update-banner-version";

function readBrowserStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

function migrateLegacyDismissKey(storage: Storage): void {
  const current = storage.getItem(UPDATE_BANNER_DISMISS_STORAGE_KEY);
  if (current !== null && current.trim().length > 0) {
    return;
  }
  const legacy = storage.getItem(LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY);
  if (legacy === null || legacy.trim().length === 0) {
    return;
  }
  storage.setItem(UPDATE_BANNER_DISMISS_STORAGE_KEY, legacy.trim());
  storage.removeItem(LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY);
}

/**
 * - Purpose: persist dismissed update banner version across app restarts (F-020).
 * - Inputs: semver string via write; none for read.
 * - Outputs: stored latestVersion or null when missing or invalid.
 */
export class LocalStorageUpdateBannerDismissStore implements UpdateBannerDismissStore {
  readDismissedVersion(): string | null {
    const storage = readBrowserStorage();
    if (storage === null) {
      return null;
    }

    migrateLegacyDismissKey(storage);

    const raw = storage.getItem(UPDATE_BANNER_DISMISS_STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  writeDismissedVersion(latestVersion: string): void {
    const storage = readBrowserStorage();
    if (storage === null) {
      return;
    }

    storage.setItem(UPDATE_BANNER_DISMISS_STORAGE_KEY, latestVersion.trim());
    storage.removeItem(LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY);
  }
}

export const localStorageUpdateBannerDismissStore = new LocalStorageUpdateBannerDismissStore();
