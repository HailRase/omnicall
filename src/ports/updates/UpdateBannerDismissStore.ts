/**
 * - Purpose: durable storage for dismissed update banner version (F-020).
 * - Inputs: semver string to persist or read.
 * - Outputs: last dismissed latestVersion or null when unset.
 */
export interface UpdateBannerDismissStore {
  readDismissedVersion(): string | null;
  writeDismissedVersion(latestVersion: string): void;
}
