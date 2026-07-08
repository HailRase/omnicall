/**
 * - Purpose: classify transfer failure reasons that must not surface failure UI.
 * - Inputs: normalized failure reason string from domain events.
 * - Outputs: benign whitelist membership for projection reducers.
 */
export const BENIGN_TRANSFER_FAILURE_REASONS = new Set(["transfer_cancelled"]);

export function isBenignTransferFailureReason(reason: string): boolean {
  return BENIGN_TRANSFER_FAILURE_REASONS.has(reason);
}
