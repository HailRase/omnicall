import { validatePhoneNumber } from "@domain/index.js";

/**
 * - Purpose: expose dialpad number validation for renderer composition.
 * - Inputs: raw phone number candidate from UI.
 * - Outputs: boolean validity without renderer domain dependency.
 */
export function isDialpadNumberValid(number: string): boolean {
  return validatePhoneNumber(number).length === 0;
}
