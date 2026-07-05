import type { UpdateBannerDismissStore } from "@ports/updates/UpdateBannerDismissStore.js";

export const UPDATE_BANNER_DISMISS_STORAGE_KEY = "axatalk.dismissed-update-banner-version";

function readBrowserStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
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
  }
}

export const localStorageUpdateBannerDismissStore = new LocalStorageUpdateBannerDismissStore();
