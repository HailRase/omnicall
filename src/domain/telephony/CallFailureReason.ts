/**
 * - Purpose: normalize outgoing call failure reasons.
 * - Inputs: adapter/network failure reason candidates.
 * - Outputs: typed CallFailureReason for events and projections.
 */
export type CallFailureReason =
  | "busy"
  | "rejected"
  | "unavailable"
  | "network"
  | "unknown";

export const CALL_FAILURE_REASONS: ReadonlyArray<CallFailureReason> = [
  "busy",
  "rejected",
  "unavailable",
  "network",
  "unknown",
];

export function mapCallFailureReason(value: string): CallFailureReason {
  const normalized = value.toLowerCase();
  if (normalized.includes("busy") || normalized.includes("486")) {
    return "busy";
  }

  if (normalized.includes("reject") || normalized.includes("603")) {
    return "rejected";
  }

  if (
    normalized.includes("unavailable") ||
    normalized.includes("480") ||
    normalized.includes("404")
  ) {
    return "unavailable";
  }

  if (normalized.includes("network") || normalized.includes("timeout")) {
    return "network";
  }

  if (
    normalized.includes("denied media") ||
    normalized.includes("notallowederror") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed")
  ) {
    return "network";
  }

  return "unknown";
}

