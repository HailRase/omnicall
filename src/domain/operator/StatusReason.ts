/**
 * - Purpose: brand optional reason attached to agent status changes.
 * - Inputs: raw reason string from UI or OCP payloads.
 * - Outputs: typed `StatusReason` or validation errors.
 */
export type StatusReason = string & { readonly __brand: "StatusReason" };

export type StatusReasonValidationError =
  | "status_reason_required"
  | "status_reason_not_allowed";

export function createStatusReason(value: string): StatusReason {
  return value.trim() as StatusReason;
}

export function parseOptionalStatusReason(value: unknown): StatusReason | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }
  return createStatusReason(normalized);
}

export function validateStatusReason(
  value: string,
  allowedReasons: ReadonlyArray<string>,
): StatusReasonValidationError[] {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return ["status_reason_required"];
  }
  if (!allowedReasons.includes(normalized)) {
    return ["status_reason_not_allowed"];
  }
  return [];
}
