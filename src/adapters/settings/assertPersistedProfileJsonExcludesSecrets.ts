const FORBIDDEN_SECRET_FIELD_FRAGMENTS = [
  "password",
  "token",
  "credential",
  "secret",
] as const;

/**
 * - Purpose: reject persisted profile JSON that contains secret-like field names.
 * - Inputs: serialized JSON text for index or settings files.
 * - Outputs: void or throws settings_persist_forbidden_secret_field error.
 */
export function assertPersistedProfileJsonExcludesSecrets(json: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return;
  }

  scanValueForForbiddenSecretFields(parsed, []);
}

function scanValueForForbiddenSecretFields(value: unknown, path: ReadonlyArray<string>): void {
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
      throw new Error(`settings_persist_forbidden_secret_field:${fieldName}`);
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
