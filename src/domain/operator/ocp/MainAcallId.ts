/**
 * - Purpose: brand and validate OCP main_acallid identifiers.
 * - Inputs: raw string or unknown boundary values.
 * - Outputs: typed MainAcallId or validation errors.
 */
export type MainAcallId = string & { readonly __brand: "MainAcallId" };

export type MainAcallIdValidationError = "main_acallid_required";

export function validateMainAcallId(value: string): MainAcallIdValidationError[] {
  if (value.trim().length === 0) {
    return ["main_acallid_required"];
  }
  return [];
}

export function createMainAcallId(value: string): MainAcallId {
  const errors = validateMainAcallId(value);
  if (errors.length > 0) {
    throw new Error(`Invalid MainAcallId: ${errors.join(", ")}`);
  }
  return value.trim() as MainAcallId;
}

export function parseMainAcallId(value: unknown): MainAcallId | null {
  if (typeof value !== "string") {
    return null;
  }
  const errors = validateMainAcallId(value);
  if (errors.length > 0) {
    return null;
  }
  return value.trim() as MainAcallId;
}

export function isMainAcallIdEqual(left: MainAcallId, right: MainAcallId): boolean {
  return left === right;
}
