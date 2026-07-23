/**
 * - Purpose: pure Origin trust store mutations (ADR-0018 / DI-11).
 * - Inputs: SdkIntegrationSettings + exact Origin.
 * - Outputs: next settings or null when mutation is illegal.
 */

import {
  MAX_SDK_ALLOWED_ORIGINS,
  parseExactSdkOrigin,
  type SdkIntegrationSettings,
} from "./SdkIntegrationSettings.js";
import {
  createDefaultSdkOriginCapabilityMatrix,
  type SdkOriginCapabilityMatrix,
  type SdkOriginTrustEntry,
} from "./SdkOriginTrust.js";

function upsertOrigin(
  settings: SdkIntegrationSettings,
  entry: SdkOriginTrustEntry,
): SdkIntegrationSettings {
  const without = settings.origins.filter((row) => row.origin !== entry.origin);
  return {
    ...settings,
    originsManaged: true,
    origins: [...without, entry],
  };
}

function removeOrigin(
  settings: SdkIntegrationSettings,
  origin: string,
): SdkIntegrationSettings {
  return {
    ...settings,
    originsManaged: true,
    origins: settings.origins.filter((row) => row.origin !== origin),
  };
}

/** First-contact or Settings Allow → allowed + default/retained matrix. */
export function allowSdkOrigin(
  settings: SdkIntegrationSettings,
  origin: string,
  matrix: SdkOriginCapabilityMatrix = createDefaultSdkOriginCapabilityMatrix(),
): SdkIntegrationSettings | null {
  const existing = settings.origins.find((row) => row.origin === origin);
  if (existing?.state === "denied") {
    return null;
  }
  if (
    existing === undefined &&
    settings.origins.length >= MAX_SDK_ALLOWED_ORIGINS
  ) {
    return null;
  }
  return upsertOrigin(settings, {
    origin,
    state: "allowed",
    matrix,
    previouslyAllowed: true,
  });
}

/** First-contact Deny or quick blacklist. Retains matrix when previously allowed. */
export function denySdkOrigin(
  settings: SdkIntegrationSettings,
  origin: string,
): SdkIntegrationSettings | null {
  const existing = settings.origins.find((row) => row.origin === origin);
  if (
    existing === undefined &&
    settings.origins.length >= MAX_SDK_ALLOWED_ORIGINS
  ) {
    return null;
  }
  const previouslyAllowed =
    existing?.previouslyAllowed === true || existing?.state === "allowed";
  const retainedMatrix =
    previouslyAllowed && existing?.matrix !== null && existing?.matrix !== undefined
      ? existing.matrix
      : previouslyAllowed
        ? createDefaultSdkOriginCapabilityMatrix()
        : null;
  return upsertOrigin(settings, {
    origin,
    state: "denied",
    matrix: retainedMatrix,
    previouslyAllowed,
  });
}

/**
 * Unblock: prior allowed → allowed+matrix; first-Deny-only → remove (unknown).
 */
export function unblockSdkOrigin(
  settings: SdkIntegrationSettings,
  origin: string,
): SdkIntegrationSettings | null {
  const existing = settings.origins.find((row) => row.origin === origin);
  if (existing === undefined || existing.state !== "denied") {
    return null;
  }
  if (existing.previouslyAllowed && existing.matrix !== null) {
    return upsertOrigin(settings, {
      origin,
      state: "allowed",
      matrix: existing.matrix,
      previouslyAllowed: true,
    });
  }
  return removeOrigin(settings, origin);
}

/** Replace matrix for an allowed Origin; denied Origins cannot be edited. */
export function setSdkOriginCapabilityMatrix(
  settings: SdkIntegrationSettings,
  origin: string,
  matrix: SdkOriginCapabilityMatrix,
): SdkIntegrationSettings | null {
  const existing = settings.origins.find((row) => row.origin === origin);
  if (existing === undefined || existing.state !== "allowed") {
    return null;
  }
  return upsertOrigin(settings, {
    ...existing,
    matrix,
    previouslyAllowed: true,
  });
}

/** Delete an allowed Origin row (not while denied — Unblock first). */
export function removeAllowedSdkOrigin(
  settings: SdkIntegrationSettings,
  origin: string,
): SdkIntegrationSettings | null {
  const existing = settings.origins.find((row) => row.origin === origin);
  if (existing === undefined || existing.state !== "allowed") {
    return null;
  }
  return removeOrigin(settings, origin);
}

/**
 * Rename an allowed Origin URL while preserving its capability matrix.
 * Fails closed when `nextOrigin` is invalid, blacklisted, or already present.
 */
export function renameAllowedSdkOrigin(
  settings: SdkIntegrationSettings,
  previousOrigin: string,
  nextOriginRaw: string,
): SdkIntegrationSettings | null {
  const existing = settings.origins.find((row) => row.origin === previousOrigin);
  if (existing === undefined || existing.state !== "allowed") {
    return null;
  }
  const nextOrigin = parseExactSdkOrigin(nextOriginRaw);
  if (nextOrigin === null) {
    return null;
  }
  if (nextOrigin === previousOrigin) {
    return settings;
  }
  const conflict = settings.origins.find((row) => row.origin === nextOrigin);
  if (conflict !== undefined) {
    return null;
  }
  const withoutPrevious = removeOrigin(settings, previousOrigin);
  return upsertOrigin(withoutPrevious, {
    origin: nextOrigin,
    state: "allowed",
    matrix: existing.matrix ?? createDefaultSdkOriginCapabilityMatrix(),
    previouslyAllowed: true,
  });
}

/** Seed env allowlist Origins as allowed (blacklist wins). */
export function seedAllowedSdkOrigins(
  settings: SdkIntegrationSettings,
  seedOrigins: readonly string[],
): SdkIntegrationSettings {
  let next = settings;
  for (const origin of seedOrigins) {
    const existing = next.origins.find((row) => row.origin === origin);
    if (existing?.state === "denied") {
      continue;
    }
    if (existing?.state === "allowed") {
      continue;
    }
    const allowed = allowSdkOrigin(next, origin);
    if (allowed !== null) {
      next = { ...allowed, originsManaged: settings.originsManaged };
    }
  }
  return next;
}
