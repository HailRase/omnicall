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
 * - Purpose: resolve platform-specific download URL from manifest.
 * - Inputs: manifest and optional platform id.
 * - Outputs: HTTPS download URL string.
 */
export function resolveUpdateDownloadUrl(
  manifest: UpdateManifest,
  platform?: UpdatePlatformId,
): string {
  if (platform !== undefined) {
    const platformUrl = manifest.platforms?.[platform];
    if (platformUrl !== undefined) {
      return platformUrl;
    }
  }

  return manifest.downloadUrl;
}

/**
 * - Purpose: compare installed and manifest versions for manual update flow.
 * - Inputs: current app version, manifest, optional platform for download URL.
 * - Outputs: availability status with resolved download metadata.
 */
export function evaluateUpdateAvailability(
  currentVersion: string,
  manifest: UpdateManifest,
  platform?: UpdatePlatformId,
): UpdateAvailabilityResult {
  const latestComparison = compareSemanticVersions(currentVersion, manifest.latestVersion);
  if (latestComparison === null) {
    const currentValid = compareSemanticVersions(currentVersion, currentVersion);
    if (currentValid === null) {
      return {
        status: "invalidCurrentVersion",
        downloadUrl: resolveUpdateDownloadUrl(manifest, platform),
        latestVersion: manifest.latestVersion,
        ...(manifest.releaseDate !== undefined ? { releaseDate: manifest.releaseDate } : {}),
        ...(manifest.releaseNotesUrl !== undefined
          ? { releaseNotesUrl: manifest.releaseNotesUrl }
          : {}),
      };
    }

    return {
      status: "invalidManifestVersion",
      downloadUrl: resolveUpdateDownloadUrl(manifest, platform),
      latestVersion: manifest.latestVersion,
      ...(manifest.releaseDate !== undefined ? { releaseDate: manifest.releaseDate } : {}),
      ...(manifest.releaseNotesUrl !== undefined
        ? { releaseNotesUrl: manifest.releaseNotesUrl }
        : {}),
    };
  }

  const base = {
    downloadUrl: resolveUpdateDownloadUrl(manifest, platform),
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
