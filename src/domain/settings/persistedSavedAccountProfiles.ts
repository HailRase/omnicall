import {
  assertSavedAccountProfileValueExcludesSecrets,
  createSavedAccountProfile,
  createSavedAccountProfileId,
  type SavedAccountProfile,
} from "./SavedAccountProfile.js";

export const SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION = 1 as const;

export type SavedAccountProfilesDocumentV1 = Readonly<{
  schemaVersion: typeof SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION;
  profiles: ReadonlyArray<SavedAccountProfile>;
}>;

export type SavedAccountProfilesParseErrorCode =
  | "invalid_shape"
  | "unsupported_schema_version"
  | "invalid_profile_entry"
  | "forbidden_secret_field";

export type SavedAccountProfilesParseResult =
  | { readonly ok: true; readonly value: SavedAccountProfilesDocumentV1 }
  | {
      readonly ok: false;
      readonly error: Readonly<{ readonly code: SavedAccountProfilesParseErrorCode }>;
    };

type PersistedSavedAccountProfileRecordV1 = Readonly<{
  id: string;
  username: string;
  domain: string;
  server: string;
  displayName: string;
  createdAt?: string;
  lastUsedAt?: string;
}>;

type PersistedSavedAccountProfilesDocumentV1 = Readonly<{
  schemaVersion: typeof SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION;
  profiles: ReadonlyArray<PersistedSavedAccountProfileRecordV1>;
}>;

/**
 * - Purpose: serialize saved account profiles document for atomic persistence.
 * - Inputs: validated SavedAccountProfile list.
 * - Outputs: JSON string without secret fields.
 */
export function serializeSavedAccountProfilesDocument(
  profiles: ReadonlyArray<SavedAccountProfile>,
): string {
  const document: PersistedSavedAccountProfilesDocumentV1 = {
    schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
    profiles: profiles.map(toPersistedSavedAccountProfileRecord),
  };

  const json = JSON.stringify(document);
  assertSavedAccountProfileValueExcludesSecrets(JSON.parse(json) as unknown);
  return json;
}

/**
 * - Purpose: parse unknown JSON into saved account profiles document.
 * - Inputs: parsed JSON value from profiles store file.
 * - Outputs: validated document or classified parse error.
 */
export function parsePersistedSavedAccountProfilesDocument(
  raw: unknown,
): SavedAccountProfilesParseResult {
  try {
    assertSavedAccountProfileValueExcludesSecrets(raw);
  } catch {
    return { ok: false, error: { code: "forbidden_secret_field" } };
  }

  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const record = raw as Record<string, unknown>;
  const schemaVersion = record["schemaVersion"];

  if (schemaVersion !== SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }

  const profilesRaw = record["profiles"];
  if (!Array.isArray(profilesRaw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const profiles: SavedAccountProfile[] = [];

  for (const entry of profilesRaw) {
    const parsedProfile = parsePersistedSavedAccountProfileEntry(entry);
    if (!parsedProfile.ok) {
      return { ok: false, error: { code: "invalid_profile_entry" } };
    }

    if (profiles.some((existing) => existing.id === parsedProfile.value.id)) {
      continue;
    }

    profiles.push(parsedProfile.value);
  }

  return {
    ok: true,
    value: {
      schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
      profiles,
    },
  };
}

function parsePersistedSavedAccountProfileEntry(
  raw: unknown,
):
  | { readonly ok: true; readonly value: SavedAccountProfile }
  | { readonly ok: false } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false };
  }

  const record = raw as Record<string, unknown>;
  const username = readRequiredString(record, "username");
  const domain = readRequiredString(record, "domain");
  const server = readRequiredString(record, "server");
  const idRaw = readRequiredString(record, "id");

  if (username === null || domain === null || server === null || idRaw === null) {
    return { ok: false };
  }

  const displayNameRaw = readOptionalString(record, "displayName");

  const createdAt = readOptionalIsoString(record, "createdAt");
  const lastUsedAt = readOptionalIsoString(record, "lastUsedAt");

  const created = createSavedAccountProfile(
    { username, domain, server },
    {
      ...(createdAt !== undefined ? { createdAt } : {}),
      ...(lastUsedAt !== undefined ? { lastUsedAt } : {}),
    },
  );

  if (!created.ok) {
    return { ok: false };
  }

  const expectedId = created.value.id;
  if (createSavedAccountProfileId(idRaw) !== expectedId) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      ...created.value,
      displayName:
        displayNameRaw !== undefined && displayNameRaw.trim().length > 0
          ? displayNameRaw.trim()
          : created.value.displayName,
    },
  };
}

function toPersistedSavedAccountProfileRecord(
  profile: SavedAccountProfile,
): PersistedSavedAccountProfileRecordV1 {
  return {
    id: profile.id,
    username: profile.username,
    domain: profile.domain,
    server: profile.server,
    displayName: profile.displayName,
    ...(profile.createdAt !== undefined ? { createdAt: profile.createdAt } : {}),
    ...(profile.lastUsedAt !== undefined ? { lastUsedAt: profile.lastUsedAt } : {}),
  };
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
}

function readOptionalIsoString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = readOptionalString(record, key);
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }
  return value;
}
