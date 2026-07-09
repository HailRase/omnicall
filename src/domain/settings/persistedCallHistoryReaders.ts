import type {
  CallHistoryDirection,
  CallHistoryEndReason,
  CallHistoryOutcome,
} from "./CallHistoryEntry.js";
import { CALL_HISTORY_END_REASONS } from "./CallHistoryEntry.js";

/**
 * - Purpose: narrow persisted call-history scalar fields from unknown records.
 * - Inputs: raw object field map and field key.
 * - Outputs: typed scalar or null when invalid.
 */
export function readRequiredString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

export function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

export function readNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

export function readCallHistoryDirection(
  record: Record<string, unknown>,
  key: string,
): CallHistoryDirection | null {
  const value = record[key];
  if (value === "incoming" || value === "outgoing") {
    return value;
  }
  return null;
}

export function readCallHistoryOutcome(
  record: Record<string, unknown>,
  key: string,
): CallHistoryOutcome | null {
  const value = record[key];
  if (
    value === "completed" ||
    value === "missed" ||
    value === "canceled" ||
    value === "failed"
  ) {
    return value;
  }
  return null;
}

export function readCallHistoryEndReason(
  record: Record<string, unknown>,
  key: string,
): CallHistoryEndReason | null {
  const value = record[key];
  if (
    typeof value === "string" &&
    (CALL_HISTORY_END_REASONS as ReadonlyArray<string>).includes(value)
  ) {
    return value as CallHistoryEndReason;
  }
  return null;
}

const FORBIDDEN_SECRET_FIELD_FRAGMENTS = [
  "password",
  "token",
  "credential",
  "secret",
] as const;

export function hasForbiddenSecretField(value: unknown): boolean {
  try {
    scanValueForForbiddenSecretFields(value);
    return false;
  } catch {
    return true;
  }
}

function scanValueForForbiddenSecretFields(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      scanValueForForbiddenSecretFields(entry);
    });
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [fieldName, nestedValue] of Object.entries(value)) {
    if (isForbiddenSecretFieldName(fieldName)) {
      throw new Error(`forbidden_secret_field:${fieldName}`);
    }
    scanValueForForbiddenSecretFields(nestedValue);
  }
}

function isForbiddenSecretFieldName(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase();
  return FORBIDDEN_SECRET_FIELD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}
