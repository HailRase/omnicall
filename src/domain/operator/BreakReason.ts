/**
 * - Purpose: validate and brand operator break reason values.
 * - Inputs: unknown or raw string reason and allowed reason list.
 * - Outputs: typed BreakReason value or validation errors.
 */
export type BreakReason = string & { readonly __brand: "BreakReason" };

export type BreakReasonValidationError =
  | "break_reason_required"
  | "break_reason_not_allowed";

export function validateBreakReason(
  value: string,
  allowedReasons: ReadonlyArray<string>,
): BreakReasonValidationError[] {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return ["break_reason_required"];
  }
  if (!allowedReasons.includes(normalized)) {
    return ["break_reason_not_allowed"];
  }
  return [];
}

export function createBreakReason(value: string): BreakReason {
  return value.trim() as BreakReason;
}
