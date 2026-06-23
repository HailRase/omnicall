/**
 * - Purpose: validate and normalize DTMF tones.
 * - Inputs: single character tone candidate.
 * - Outputs: DtmfTone value or validation error list.
 */
export type DtmfTone = string & { readonly __brand: "DtmfTone" };

const DTMF_TONE_PATTERN = /^[0-9A-D*#]$/;

export type DtmfToneValidationError = "tone_required" | "tone_invalid";

export function normalizeDtmfTone(value: string): string {
  return value.trim().toUpperCase();
}

export function validateDtmfTone(value: string): DtmfToneValidationError[] {
  const normalized = normalizeDtmfTone(value);
  if (normalized.length === 0) {
    return ["tone_required"];
  }

  if (!DTMF_TONE_PATTERN.test(normalized)) {
    return ["tone_invalid"];
  }

  return [];
}

export function createDtmfTone(value: string): DtmfTone {
  return normalizeDtmfTone(value) as DtmfTone;
}

