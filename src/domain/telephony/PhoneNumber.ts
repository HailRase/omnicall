/**
 * - Purpose: normalize and validate dialed phone numbers.
 * - Inputs: raw user-entered number string.
 * - Outputs: PhoneNumber value or validation errors.
 */
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };

const ALLOWED_NUMBER_PATTERN = /^[0-9+*#()\-\s]+$/;
const E164_PATTERN = /^\+[1-9][0-9]{7,14}$/;
const LOCAL_DIGIT_MIN = 3;
const LOCAL_DIGIT_MAX = 15;

export type PhoneNumberValidationError =
  | "number_required"
  | "number_invalid_characters"
  | "number_invalid_format"
  | "number_too_short"
  | "number_too_long";

export function normalizePhoneNumber(value: string): string {
  return value.trim().replace(/[\s()-]/g, "");
}

export function validatePhoneNumber(value: string): PhoneNumberValidationError[] {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return ["number_required"];
  }

  if (!ALLOWED_NUMBER_PATTERN.test(trimmed)) {
    return ["number_invalid_characters"];
  }

  const normalized = normalizePhoneNumber(trimmed);
  const digitsOnly = normalized.startsWith("+")
    ? normalized.slice(1)
    : normalized;

  if (!/^[0-9]+$/.test(digitsOnly)) {
    return ["number_invalid_format"];
  }

  if (normalized.startsWith("+") && !E164_PATTERN.test(normalized)) {
    return ["number_invalid_format"];
  }

  if (digitsOnly.length < LOCAL_DIGIT_MIN) {
    return ["number_too_short"];
  }

  if (digitsOnly.length > LOCAL_DIGIT_MAX) {
    return ["number_too_long"];
  }

  return [];
}

export function createPhoneNumber(value: string): PhoneNumber {
  return normalizePhoneNumber(value) as PhoneNumber;
}

