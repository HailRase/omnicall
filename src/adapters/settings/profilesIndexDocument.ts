export const PROFILES_INDEX_SCHEMA_VERSION = 1 as const;

export type ProfilesIndexDocumentV1 = Readonly<{
  schemaVersion: typeof PROFILES_INDEX_SCHEMA_VERSION;
  activeProfileKey: string | null;
}>;

export type ProfilesIndexParseErrorCode =
  | "invalid_shape"
  | "unsupported_schema_version";

export type ProfilesIndexParseResult =
  | { readonly ok: true; readonly value: ProfilesIndexDocumentV1 }
  | {
      readonly ok: false;
      readonly error: Readonly<{ readonly code: ProfilesIndexParseErrorCode }>;
    };

/**
 * - Purpose: serialize active-profile index document for atomic disk write.
 * - Inputs: validated ProfilesIndexDocumentV1.
 * - Outputs: JSON string.
 */
export function serializeProfilesIndex(document: ProfilesIndexDocumentV1): string {
  return JSON.stringify(document);
}

/**
 * - Purpose: parse unknown JSON into active-profile index document.
 * - Inputs: parsed JSON value from index file.
 * - Outputs: validated document or classified parse error.
 */
export function parseProfilesIndex(raw: unknown): ProfilesIndexParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const record = raw as Record<string, unknown>;
  const schemaVersion = record["schemaVersion"];

  if (schemaVersion !== PROFILES_INDEX_SCHEMA_VERSION) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }

  const activeProfileKey = record["activeProfileKey"];
  if (activeProfileKey !== null && typeof activeProfileKey !== "string") {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  return {
    ok: true,
    value: {
      schemaVersion: PROFILES_INDEX_SCHEMA_VERSION,
      activeProfileKey,
    },
  };
}
