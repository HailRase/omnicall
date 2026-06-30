import type { CallLineCardViewModel, IncomingCallProjection } from "@application/index.js";
import { deriveIncomingCallControlLine } from "@application/index.js";

/**
 * - Purpose: renderer alias for incoming ControlsBar line derivation.
 * - Inputs: incoming call projection snapshot.
 * - Outputs: Ringing line card for ControlsBar with hangup-as-reject enabled.
 */
export function buildIncomingControlLine(
  projection: IncomingCallProjection,
): CallLineCardViewModel | null {
  return deriveIncomingCallControlLine(projection);
}
