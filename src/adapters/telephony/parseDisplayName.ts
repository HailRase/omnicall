/**
 * - Purpose: parse caller display name and number from SIP-like headers.
 * - Inputs: raw unknown display payload at adapter boundary.
 * - Outputs: normalized CallerIdentity value.
 */
import { createCallerIdentity, createPhoneNumber, type CallerIdentity } from "@domain/index.js";

const DISPLAY_AND_URI_PATTERN = /^"?([^"<]*)"?\s*<sip:([^>@;]+)[^>]*>/i;
const URI_ONLY_PATTERN = /<sip:([^>@;]+)[^>]*>/i;

export function parseDisplayName(raw: unknown): CallerIdentity {
  if (typeof raw !== "string") {
    return createCallerIdentity(null, null);
  }
  const value = raw.trim();
  if (value.length === 0) {
    return createCallerIdentity(null, null);
  }

  const displayAndUriMatch = value.match(DISPLAY_AND_URI_PATTERN);
  if (displayAndUriMatch !== null) {
    const displayName = normalizeOptional(displayAndUriMatch[1]);
    const number = normalizeOptional(displayAndUriMatch[2]);
    return createCallerIdentity(asPhoneNumber(number), displayName);
  }

  const uriOnlyMatch = value.match(URI_ONLY_PATTERN);
  if (uriOnlyMatch !== null) {
    return createCallerIdentity(asPhoneNumber(normalizeOptional(uriOnlyMatch[1])), null);
  }

  return createCallerIdentity(null, normalizeOptional(value));
}

function normalizeOptional(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asPhoneNumber(value: string | null): ReturnType<typeof createPhoneNumber> | null {
  if (value === null) {
    return null;
  }
  return createPhoneNumber(value);
}
