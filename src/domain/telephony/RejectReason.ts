/**
 * - Purpose: normalize and validate incoming reject reason values.
 * - Inputs: raw reject reason string.
 * - Outputs: typed RejectReason value or validation errors.
 */
export type RejectReason = string & { readonly __brand: "RejectReason" };

export type RejectReasonValidationError =
  | "reject_reason_required"
  | "reject_reason_invalid";

export function validateRejectReason(value: string): RejectReasonValidationError[] {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return ["reject_reason_required"];
  }
  if (normalized.length > 128) {
    return ["reject_reason_invalid"];
  }
  return [];
}

export function createRejectReason(value: string): RejectReason {
  return value.trim() as RejectReason;
}
