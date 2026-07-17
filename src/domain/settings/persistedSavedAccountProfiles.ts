import {
  assertSavedAccountProfileValueExcludesSecrets,
  createSavedAccountProfile,
  createSavedAccountProfileId,
  type SavedAccountProfile,
} from "./SavedAccountProfile.js";
import type { SavedAccountProfileLifecycleStatus } from "./savedAccountProfileLifecycle.js";
import { resolveSavedAccountProfileLifecycleStatus } from "./savedAccountProfileLifecycle.js";

export const SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION = 2 as const;
export const SAVED_ACCOUNT_PROFILES_LEGACY_SCHEMA_VERSION = 1 as const;

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

type PersistedSavedAccountProfileRecordV2 = Readonly<{
  id: string;
  username: string;
  domain: string;
  server: string;
  displayName: string;
  lifecycleStatus?: SavedAccountProfileLifecycleStatus;
  createdAt?: string;
  lastUsedAt?: string;
  successfulUseAt?: string;
  ocpDomain?: string;
}>;

type PersistedSavedAccountProfilesDocumentV2 = Readonly<{
  schemaVersion: typeof SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION;
  profiles: ReadonlyArray<PersistedSavedAccountProfileRecordV2>;
}>;

/**
 * - Purpose: serialize saved account profiles document for atomic persistence.
 * - Inputs: validated SavedAccountProfile list.
 * - Outputs: JSON string without secret fields (schema v2).
 */
export function serializeSavedAccountProfilesDocument(
  profiles: ReadonlyArray<SavedAccountProfile>,
): string {
  const document: PersistedSavedAccountProfilesDocumentV2 = {
    schemaVersion: SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION,
    profiles: profiles.map(toPersistedSavedAccountProfileRecord),
  };

  const json = JSON.stringify(document);
  assertSavedAccountProfileValueExcludesSecrets(JSON.parse(json) as unknown);
  return json;
}

/**
 * - Purpose: parse unknown JSON into saved account profiles document.
 * - Inputs: parsed JSON value from profiles store file (v1 or v2).
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
  const acceptsLegacy = schemaVersion === SAVED_ACCOUNT_PROFILES_LEGACY_SCHEMA_VERSION;
  const acceptsCurrent = schemaVersion === SAVED_ACCOUNT_PROFILES_SCHEMA_VERSION;

  if (!acceptsLegacy && !acceptsCurrent) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }

  const profilesRaw = record["profiles"];
  if (!Array.isArray(profilesRaw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const profiles: SavedAccountProfile[] = [];

  for (const entry of profilesRaw) {
    const parsedProfile = parsePersistedSavedAccountProfileEntry(entry, acceptsLegacy);
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
  legacyDocument: boolean,
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
  const successfulUseAt = readOptionalIsoString(record, "successfulUseAt");
  const ocpDomain = readOptionalString(record, "ocpDomain");
  const lifecycleStatus = resolveLifecycleFromPersistedRecord(record, legacyDocument);

  const created = createSavedAccountProfile(
    { username, domain, server },
    {
      lifecycleStatus,
      ...(createdAt !== undefined ? { createdAt } : {}),
      ...(lastUsedAt !== undefined ? { lastUsedAt } : {}),
      ...(successfulUseAt !== undefined ? { successfulUseAt } : {}),
      ...(ocpDomain !== undefined ? { ocpDomain } : {}),
    },
  );

  if (!created.ok) {
    return { ok: false };
  }

  if (createSavedAccountProfileId(idRaw) !== created.value.id) {
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

function resolveLifecycleFromPersistedRecord(
  record: Record<string, unknown>,
  legacyDocument: boolean,
): SavedAccountProfileLifecycleStatus {
  if (legacyDocument) {
    return "successful";
  }

  const raw = record["lifecycleStatus"];
  if (raw === "draft" || raw === "successful") {
    return raw;
  }

  return resolveSavedAccountProfileLifecycleStatus(undefined);
}

function toPersistedSavedAccountProfileRecord(
  profile: SavedAccountProfile,
): PersistedSavedAccountProfileRecordV2 {
  return {
    id: profile.id,
    username: profile.username,
    domain: profile.domain,
    server: profile.server,
    displayName: profile.displayName,
    lifecycleStatus: profile.lifecycleStatus,
    ...(profile.createdAt !== undefined ? { createdAt: profile.createdAt } : {}),
    ...(profile.lastUsedAt !== undefined ? { lastUsedAt: profile.lastUsedAt } : {}),
    ...(profile.successfulUseAt !== undefined
      ? { successfulUseAt: profile.successfulUseAt }
      : {}),
    ...(profile.ocpDomain !== undefined ? { ocpDomain: profile.ocpDomain } : {}),
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
