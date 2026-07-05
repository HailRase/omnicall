import { compareSemanticVersions } from "./compareSemanticVersions.js";
import type { UpdateManifest, UpdatePlatformId } from "./UpdateManifest.js";

export type UpdateAvailabilityStatus =
  | "updateAvailable"
  | "upToDate"
  | "invalidCurrentVersion"
  | "invalidManifestVersion";

export type UpdateAvailabilityResult = Readonly<{
  status: UpdateAvailabilityStatus;
  downloadUrl: string;
  latestVersion: string;
  releaseDate?: string;
  releaseNotesUrl?: string;
}>;

/**
 * - Purpose: resolve manifest download page URL for manual update flow.
 * - Inputs: manifest aggregate.
 * - Outputs: HTTPS releases/download page URL (`downloadUrl` field).
 */
export function resolveUpdateDownloadUrl(manifest: UpdateManifest): string {
  return manifest.downloadUrl;
}

/**
 * - Purpose: resolve optional platform-specific installer URL from manifest.
 * - Inputs: manifest and optional platform id.
 * - Outputs: HTTPS installer URL when declared for the platform.
 */
export function resolvePlatformInstallerUrl(
  manifest: UpdateManifest,
  platform?: UpdatePlatformId,
): string | undefined {
  if (platform === undefined) {
    return undefined;
  }

  return manifest.platforms?.[platform];
}

/**
 * - Purpose: compare installed and manifest versions for manual update flow.
 * - Inputs: current app version and manifest.
 * - Outputs: availability status with resolved download metadata.
 */
export function evaluateUpdateAvailability(
  currentVersion: string,
  manifest: UpdateManifest,
): UpdateAvailabilityResult {
  const latestComparison = compareSemanticVersions(currentVersion, manifest.latestVersion);
  if (latestComparison === null) {
    const currentValid = compareSemanticVersions(currentVersion, currentVersion);
    if (currentValid === null) {
      return {
        status: "invalidCurrentVersion",
        downloadUrl: resolveUpdateDownloadUrl(manifest),
        latestVersion: manifest.latestVersion,
        ...(manifest.releaseDate !== undefined ? { releaseDate: manifest.releaseDate } : {}),
        ...(manifest.releaseNotesUrl !== undefined
          ? { releaseNotesUrl: manifest.releaseNotesUrl }
          : {}),
      };
    }

    return {
      status: "invalidManifestVersion",
      downloadUrl: resolveUpdateDownloadUrl(manifest),
      latestVersion: manifest.latestVersion,
      ...(manifest.releaseDate !== undefined ? { releaseDate: manifest.releaseDate } : {}),
      ...(manifest.releaseNotesUrl !== undefined
        ? { releaseNotesUrl: manifest.releaseNotesUrl }
        : {}),
    };
  }

  const base = {
    downloadUrl: resolveUpdateDownloadUrl(manifest),
    latestVersion: manifest.latestVersion,
    ...(manifest.releaseDate !== undefined ? { releaseDate: manifest.releaseDate } : {}),
    ...(manifest.releaseNotesUrl !== undefined
      ? { releaseNotesUrl: manifest.releaseNotesUrl }
      : {}),
  };

  if (latestComparison < 0) {
    return { status: "updateAvailable", ...base };
  }

  return { status: "upToDate", ...base };
}
