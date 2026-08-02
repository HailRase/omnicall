/**
 * - Purpose: validate close-guard IPC envelopes between main and guest preload.
 * - Inputs: unknown IPC payloads.
 * - Outputs: trusted query/result DTOs or null.
 */

const MAX_REQUEST_ID_LENGTH = 64;

export type ExternalApplicationCloseGuardQueryPayload = Readonly<{
  requestId: string;
}>;

export type ExternalApplicationCloseGuardResultPayload = Readonly<{
  requestId: string;
  allow: boolean;
}>;

export function parseExternalApplicationCloseGuardQueryPayload(
  value: unknown,
): ExternalApplicationCloseGuardQueryPayload | null {
  if (!isRecord(value)) {
    return null;
  }
  const requestId = value["requestId"];
  if (!isRequestId(requestId)) {
    return null;
  }
  return { requestId };
}

export function parseExternalApplicationCloseGuardResultPayload(
  value: unknown,
): ExternalApplicationCloseGuardResultPayload | null {
  if (!isRecord(value)) {
    return null;
  }
  const requestId = value["requestId"];
  const allow = value["allow"];
  if (!isRequestId(requestId) || typeof allow !== "boolean") {
    return null;
  }
  return { requestId, allow };
}

/**
 * - Purpose: normalize guest close-guard return values to a strict boolean.
 * - Inputs: settled guard return value or thrown error marker.
 * - Outputs: `true` only when the guard explicitly returned boolean `true`.
 */
export async function evaluateExternalApplicationCloseGuard(
  guard: (() => boolean | Promise<boolean>) | null,
): Promise<boolean> {
  if (guard === null) {
    return true;
  }
  try {
    return (await guard()) === true;
  } catch {
    return false;
  }
}

/**
 * - Purpose: decide whether a native window close should run the guest guard.
 * - Inputs: interceptor flags for force/approved/in-flight close.
 * - Outputs: allow native close, ignore duplicate, or run the guest guard.
 */
export function resolveExternalApplicationCloseAction(input: Readonly<{
  forceClose: boolean;
  closeApproved: boolean;
  closeInFlight: boolean;
}>): "allow_native_close" | "ignore_duplicate" | "run_guard" {
  if (input.forceClose || input.closeApproved) {
    return "allow_native_close";
  }
  if (input.closeInFlight) {
    return "ignore_duplicate";
  }
  return "run_guard";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequestId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_REQUEST_ID_LENGTH
  );
}
