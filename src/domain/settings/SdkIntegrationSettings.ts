/**
 * - Purpose: persisted local SDK gateway preferences in UserSettings (no secrets).
 * - Inputs: unknown boundary payloads from settings JSON.
 * - Outputs: typed SdkIntegrationSettings or null when invalid.
 */

/** Max exact Origin entries in the fail-closed allowlist. */
export const MAX_SDK_ALLOWED_ORIGINS = 64;

/** Max length of a single exact Origin string. */
export const MAX_SDK_ORIGIN_LENGTH = 253;

export type SdkIntegrationSettings = Readonly<{
  /** When false, gateway stays stopped; SIP-only/OCP core boot is unaffected. */
  enabled: boolean;
  /**
   * Exact Origin allowlist. Empty fails closed for upgrades.
   * When `originsManaged` is false, live gateway may still inherit env allowlist.
   */
  allowedOrigins: readonly string[];
  /**
   * True after the operator explicitly edits origins in Settings.
   * False keeps boot-time env allowlist until first managed save.
   */
  originsManaged: boolean;
}>;

export const SDK_INTEGRATION_DEFAULTS: SdkIntegrationSettings = {
  enabled: true,
  allowedOrigins: [],
  originsManaged: false,
};

/**
 * - Purpose: narrow unknown sdkIntegration blob to typed settings.
 * - Inputs: unknown field value from persisted JSON.
 * - Outputs: SdkIntegrationSettings or null when shape/types are invalid.
 */
export function parseSdkIntegrationSettings(
  value: unknown,
): SdkIntegrationSettings | null {
  if (value === undefined || value === null) {
    return { ...SDK_INTEGRATION_DEFAULTS };
  }
  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const enabled = record["enabled"];
  if (typeof enabled !== "boolean") {
    return null;
  }

  const originsManagedRaw = record["originsManaged"];
  const originsManaged =
    typeof originsManagedRaw === "boolean" ? originsManagedRaw : false;

  const originsRaw = record["allowedOrigins"];
  if (!Array.isArray(originsRaw)) {
    return null;
  }
  if (originsRaw.length > MAX_SDK_ALLOWED_ORIGINS) {
    return null;
  }

  const allowedOrigins: string[] = [];
  for (const entry of originsRaw) {
    if (typeof entry !== "string") {
      return null;
    }
    const trimmed = entry.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_SDK_ORIGIN_LENGTH) {
      return null;
    }
    if (trimmed.toLowerCase() === "null") {
      return null;
    }
    if (trimmed.includes("*")) {
      return null;
    }
    if (!allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  }

  return {
    enabled,
    allowedOrigins,
    originsManaged,
  };
}

/**
 * - Purpose: normalize operator-edited origins text into exact allowlist entries.
 * - Inputs: newline- or comma-separated draft; fails closed on wildcards/null.
 * - Outputs: parsed list or null when any entry is invalid.
 */
export function parseSdkOriginsDraft(raw: string): readonly string[] | null {
  const parts = raw
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parseSdkIntegrationSettings({
    enabled: true,
    allowedOrigins: parts,
    originsManaged: true,
  })?.allowedOrigins ?? null;
}
