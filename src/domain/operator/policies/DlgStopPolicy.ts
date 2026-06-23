import type { CallId } from "../../telephony/CallId.js";

export type DlgStopPolicyState = Readonly<{
  sentCallIds: ReadonlySet<string>;
}>;

export const initialDlgStopPolicyState = (): DlgStopPolicyState => ({
  sentCallIds: new Set(),
});

/**
 * - Purpose: enforce exactly-once dlg_stop per callId (LF-063, LF-064).
 * - Inputs: policy state and callId candidate.
 * - Outputs: whether a new dlg_stop request is allowed.
 */
export function canRequestDlgStop(
  state: DlgStopPolicyState,
  callId: CallId,
): boolean {
  return !state.sentCallIds.has(callId);
}

/**
 * - Purpose: mark callId after successful gateway dlg_stop.
 * - Inputs: policy state and callId.
 * - Outputs: updated immutable policy state.
 */
export function markDlgStopSent(
  state: DlgStopPolicyState,
  callId: CallId,
): DlgStopPolicyState {
  const next = new Set(state.sentCallIds);
  next.add(callId);
  return { sentCallIds: next };
}
