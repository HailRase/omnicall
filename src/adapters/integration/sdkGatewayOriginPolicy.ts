/**
 * Exact Origin allowlist for SDK WebSocket upgrade (DI-04 / ADR-0011).
 * Missing, null, wildcard, suffix, and substring matches fail closed.
 */

/** Parse comma-separated exact Origin strings (trim; drop empties). */
export function parseSdkOriginAllowlist(
  raw: string | undefined,
): readonly string[] {
  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * True only when Origin is an exact allowlist member.
 * Rejects missing, empty, explicit `null`, and any non-exact match.
 */
export function isAllowedUpgradeOrigin(
  originHeader: string | undefined,
  allowlist: readonly string[],
): boolean {
  if (originHeader === undefined) {
    return false;
  }
  const origin = originHeader.trim();
  if (origin.length === 0) {
    return false;
  }
  if (origin.toLowerCase() === "null") {
    return false;
  }
  if (allowlist.length === 0) {
    return false;
  }
  return allowlist.includes(origin);
}

/** Load default allowlist from `AXATALK_SDK_ALLOWED_ORIGINS` (exact CSV). */
export function loadSdkOriginAllowlistFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): readonly string[] {
  return parseSdkOriginAllowlist(env["AXATALK_SDK_ALLOWED_ORIGINS"]);
}
