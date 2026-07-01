/**
 * - Purpose: read baked update manifest URL from Vite environment.
 * - Inputs: import.meta.env VITE_UPDATE_MANIFEST_URL.
 * - Outputs: HTTPS manifest URL or null when unset.
 */
export function readUpdateManifestUrl(): string | null {
  const raw = import.meta.env.VITE_UPDATE_MANIFEST_URL;
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
