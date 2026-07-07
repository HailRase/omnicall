/**
 * - Purpose: stable identifier for persisted call history rows.
 * - Inputs: non-empty id string.
 * - Outputs: branded CallHistoryEntryId value.
 */
export type CallHistoryEntryId = string & { readonly __brand: "CallHistoryEntryId" };

export function createCallHistoryEntryId(value: string): CallHistoryEntryId | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed as CallHistoryEntryId;
}
