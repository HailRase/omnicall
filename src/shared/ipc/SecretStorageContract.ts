export type SecretStorageOperation =
  | Readonly<{ op: "save"; scopeKey: string; secretId: string; value: string }>
  | Readonly<{ op: "load"; scopeKey: string; secretId: string }>
  | Readonly<{ op: "delete"; scopeKey: string; secretId: string }>;

export type SecretStorageResponse = Readonly<
  | { ok: true; value?: string | null }
  | { ok: false; reason: string }
>;

const MAX_SECRET_VALUE_LENGTH = 4096;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * - Purpose: validate secret storage IPC request at preload boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed secret operation or null when invalid.
 */
export function parseSecretStorageOperation(value: unknown): SecretStorageOperation | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const op = candidate["op"];
  if (typeof op !== "string") {
    return null;
  }

  const scopeKey = candidate["scopeKey"];
  const secretId = candidate["secretId"];
  if (!isNonEmptyString(scopeKey) || !isNonEmptyString(secretId)) {
    return null;
  }

  switch (op) {
    case "save": {
      const secretValue = candidate["value"];
      if (typeof secretValue !== "string" || secretValue.length === 0) {
        return null;
      }
      if (secretValue.length > MAX_SECRET_VALUE_LENGTH) {
        return null;
      }
      return {
        op,
        scopeKey: scopeKey.trim(),
        secretId: secretId.trim(),
        value: secretValue,
      };
    }
    case "load":
    case "delete":
      return {
        op,
        scopeKey: scopeKey.trim(),
        secretId: secretId.trim(),
      };
    default:
      return null;
  }
}

/**
 * - Purpose: validate secret storage IPC response at preload boundary.
 * - Inputs: unknown IPC response payload.
 * - Outputs: typed response or null when invalid.
 */
export function parseSecretStorageResponse(value: unknown): SecretStorageResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const ok = candidate["ok"];
  if (typeof ok !== "boolean") {
    return null;
  }

  if (!ok) {
    const reason = candidate["reason"];
    return {
      ok: false,
      reason: typeof reason === "string" ? reason : "secret_storage_error",
    };
  }

  const secretValue = candidate["value"];
  if (secretValue === undefined) {
    return { ok: true };
  }

  if (secretValue === null || typeof secretValue === "string") {
    return { ok: true, value: secretValue };
  }

  return null;
}
