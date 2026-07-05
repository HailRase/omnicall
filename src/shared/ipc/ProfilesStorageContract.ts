export type ProfilesStorageRootResponse = Readonly<{
  storageRoot: string;
}>;

/**
 * - Purpose: validate profiles storage root IPC response at preload boundary.
 * - Inputs: unknown IPC response payload.
 * - Outputs: typed storage root or null when invalid.
 */
export function parseProfilesStorageRootResponse(
  value: unknown,
): ProfilesStorageRootResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const storageRoot = candidate["storageRoot"];
  if (typeof storageRoot !== "string" || storageRoot.trim().length === 0) {
    return null;
  }

  return { storageRoot: storageRoot.trim() };
}
