import { normalizeSipDomain } from "../telephony/SipAccount.js";
import {
  deriveSettingsAccountKeyFromIdentity,
  type SettingsAccountIdentity,
} from "./deriveSettingsAccountKey.js";
import type { SavedAccountProfileLifecycleStatus } from "./savedAccountProfileLifecycle.js";
import { createSettingsAccountKey, type SettingsAccountKey } from "./SettingsAccountKey.js";

export type SavedAccountProfileId = SettingsAccountKey;

export type SavedAccountProfile = Readonly<{
  id: SavedAccountProfileId;
  username: string;
  domain: string;
  server: string;
  displayName: string;
  /** Draft until SIP-ready success; legacy missing → treated as successful on read. */
  lifecycleStatus: SavedAccountProfileLifecycleStatus;
  createdAt?: string;
  lastUsedAt?: string;
  successfulUseAt?: string;
  /** Non-secret OCP domain for draft completeness checks (never API key). */
  ocpDomain?: string;
}>;

export type SavedAccountProfileInput = Readonly<{
  username: string;
  domain: string;
  server: string;
}>;

export type CreateSavedAccountProfileOptions = Readonly<{
  createdAt?: string;
  lastUsedAt?: string;
  successfulUseAt?: string;
  lifecycleStatus?: SavedAccountProfileLifecycleStatus;
  ocpDomain?: string;
}>;

export type SavedAccountProfileValidationError =
  | "username_required"
  | "domain_required"
  | "server_required"
  | "forbidden_secret_field";

const FORBIDDEN_SECRET_FIELD_FRAGMENTS = [
  "password",
  "token",
  "credential",
  "secret",
] as const;

/**
 * - Purpose: validate saved profile metadata input without password.
 * - Inputs: username, domain, server fields; rejects secret-like keys on objects.
 * - Outputs: validation error codes; empty array when input is valid.
 */
export function validateSavedAccountProfileInput(
  input: SavedAccountProfileInput,
): ReadonlyArray<SavedAccountProfileValidationError> {
  const errors: SavedAccountProfileValidationError[] = [];

  if (input.username.trim().length === 0) {
    errors.push("username_required");
  }

  if (normalizeSipDomain(input.domain).length === 0) {
    errors.push("domain_required");
  }

  if (input.server.trim().length === 0) {
    errors.push("server_required");
  }

  return errors;
}

/**
 * - Purpose: derive stable saved profile id from normalized SIP identity.
 * - Inputs: username, domain, server (password excluded).
 * - Outputs: branded SavedAccountProfileId aligned with settings account key.
 */
export function deriveSavedAccountProfileId(
  identity: SettingsAccountIdentity,
): SavedAccountProfileId {
  return deriveSettingsAccountKeyFromIdentity(identity);
}

/**
 * - Purpose: compare two saved profiles by normalized identity key.
 * - Inputs: two SavedAccountProfile records.
 * - Outputs: true when ids match.
 */
export function areSavedAccountProfilesSameIdentity(
  left: SavedAccountProfile,
  right: SavedAccountProfile,
): boolean {
  return left.id === right.id;
}

/**
 * - Purpose: detect duplicate profile for the same normalized identity.
 * - Inputs: existing profiles and candidate input metadata.
 * - Outputs: matching profile or null.
 */
export function findSavedAccountProfileByInput(
  profiles: ReadonlyArray<SavedAccountProfile>,
  input: SavedAccountProfileInput,
): SavedAccountProfile | null {
  const candidateId = deriveSavedAccountProfileId(normalizeSavedAccountProfileFields(input));
  return profiles.find((profile) => profile.id === candidateId) ?? null;
}

/**
 * - Purpose: build normalized non-secret saved profile from user input.
 * - Inputs: profile metadata and optional timestamps.
 * - Outputs: SavedAccountProfile or validation errors.
 */
export function createSavedAccountProfile(
  input: SavedAccountProfileInput,
  options?: CreateSavedAccountProfileOptions,
):
  | { readonly ok: true; readonly value: SavedAccountProfile }
  | {
      readonly ok: false;
      readonly errors: ReadonlyArray<SavedAccountProfileValidationError>;
    } {
  const validationErrors = validateSavedAccountProfileInput(input);
  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors };
  }

  const normalized = normalizeSavedAccountProfileFields(input);
  const id = deriveSavedAccountProfileId(normalized);
  const ocpDomain = normalizeOptionalOcpDomain(options?.ocpDomain);

  return {
    ok: true,
    value: {
      id,
      username: normalized.username,
      domain: normalized.domain,
      server: normalized.server,
      displayName: normalized.username,
      lifecycleStatus: options?.lifecycleStatus ?? "draft",
      ...(options?.createdAt !== undefined ? { createdAt: options.createdAt } : {}),
      ...(options?.lastUsedAt !== undefined ? { lastUsedAt: options.lastUsedAt } : {}),
      ...(options?.successfulUseAt !== undefined
        ? { successfulUseAt: options.successfulUseAt }
        : {}),
      ...(ocpDomain !== undefined ? { ocpDomain } : {}),
    },
  };
}

function normalizeOptionalOcpDomain(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * - Purpose: normalize saved profile field values for storage and key derivation.
 * - Inputs: raw username, domain, server strings.
 * - Outputs: trimmed username, normalized domain, trimmed server.
 */
export function normalizeSavedAccountProfileFields(
  input: SavedAccountProfileInput,
): SavedAccountProfileInput {
  return {
    username: input.username.trim(),
    domain: normalizeSipDomain(input.domain),
    server: input.server.trim(),
  };
}

/**
 * - Purpose: reject unknown objects that contain secret-like field names.
 * - Inputs: parsed JSON value at persistence boundary.
 * - Outputs: void or throws saved_profile_forbidden_secret_field.
 */
export function assertSavedAccountProfileValueExcludesSecrets(value: unknown): void {
  scanValueForForbiddenSecretFields(value, []);
}

/**
 * - Purpose: brand parsed profile id string for domain use.
 * - Inputs: derived profile key string.
 * - Outputs: SavedAccountProfileId.
 */
export function createSavedAccountProfileId(value: string): SavedAccountProfileId {
  return createSettingsAccountKey(value);
}

function scanValueForForbiddenSecretFields(
  value: unknown,
  path: ReadonlyArray<string>,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      scanValueForForbiddenSecretFields(entry, [...path, String(index)]);
    });
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [fieldName, nestedValue] of Object.entries(value)) {
    if (isForbiddenSecretFieldName(fieldName)) {
      throw new Error(`saved_profile_forbidden_secret_field:${fieldName}`);
    }
    scanValueForForbiddenSecretFields(nestedValue, [...path, fieldName]);
  }
}

function isForbiddenSecretFieldName(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase();
  return FORBIDDEN_SECRET_FIELD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}
