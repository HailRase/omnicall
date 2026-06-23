/**
 * - Purpose: represent normalized caller identity from incoming telephony data.
 * - Inputs: caller number and optional display name.
 * - Outputs: immutable identity object for projections and events.
 */
import type { PhoneNumber } from "./PhoneNumber.js";

export type CallerIdentity = Readonly<{
  number: PhoneNumber | null;
  displayName: string | null;
}>;

export function createCallerIdentity(
  number: PhoneNumber | null,
  displayName: string | null,
): CallerIdentity {
  return {
    number,
    displayName: normalizeDisplayName(displayName),
  };
}

function normalizeDisplayName(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
