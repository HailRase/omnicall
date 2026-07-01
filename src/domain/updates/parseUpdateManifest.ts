import type { UpdateManifest, UpdatePlatformId } from "./UpdateManifest.js";
import { isAllowedHttpsUrl } from "@shared/validation/isAllowedHttpsUrl.js";

const UPDATE_PLATFORM_IDS: ReadonlyArray<UpdatePlatformId> = ["win32", "darwin", "linux"];

function readOptionalHttpsUrl(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const trimmed = value.trim();
  return isAllowedHttpsUrl(trimmed) ? trimmed : undefined;
}

function readRequiredHttpsUrl(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  return isAllowedHttpsUrl(trimmed) ? trimmed : null;
}

function readRequiredVersion(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function parsePlatforms(value: unknown): UpdateManifest["platforms"] | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const platforms: Partial<Record<UpdatePlatformId, string>> = {};

  for (const platformId of UPDATE_PLATFORM_IDS) {
    const platformUrl = readOptionalHttpsUrl(record, platformId);
    if (platformUrl !== undefined) {
      platforms[platformId] = platformUrl;
    }
  }

  return Object.keys(platforms).length > 0 ? platforms : undefined;
}

/**
 * - Purpose: validate remote update manifest JSON at infrastructure boundary.
 * - Inputs: unknown parsed JSON body.
 * - Outputs: typed UpdateManifest or null when invalid.
 */
export function parseUpdateManifest(value: unknown): UpdateManifest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const latestVersion = readRequiredVersion(record, "latestVersion");
  const downloadUrl = readRequiredHttpsUrl(record, "downloadUrl");

  if (latestVersion === null || downloadUrl === null) {
    return null;
  }

  const releaseNotesUrl = readOptionalHttpsUrl(record, "releaseNotesUrl");
  const minimumSupportedVersion = readRequiredVersion(record, "minimumSupportedVersion") ?? undefined;
  const platforms = parsePlatforms(record["platforms"]);
  const releaseDateRaw = record["releaseDate"];
  const releaseDate =
    typeof releaseDateRaw === "string" && releaseDateRaw.trim().length > 0
      ? releaseDateRaw.trim()
      : undefined;

  return {
    latestVersion,
    downloadUrl,
    ...(releaseDate !== undefined ? { releaseDate } : {}),
    ...(releaseNotesUrl !== undefined ? { releaseNotesUrl } : {}),
    ...(platforms !== undefined ? { platforms } : {}),
    ...(minimumSupportedVersion !== undefined ? { minimumSupportedVersion } : {}),
  };
}
