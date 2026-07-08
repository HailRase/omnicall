import type { Contact } from "@application/index.js";
import type { IncomingCallProjection } from "@application/index.js";
import { deriveIncomingCallControlLine } from "@application/index.js";

/**
 * - Purpose: renderer alias for incoming ControlsBar line derivation.
 * - Inputs: incoming call projection snapshot and active-account contacts.
 * - Outputs: Ringing line card for ControlsBar with hangup-as-reject enabled.
 */
export function buildIncomingControlLine(
  projection: IncomingCallProjection,
  contacts: ReadonlyArray<Contact>,
) {
  return deriveIncomingCallControlLine({ projection, contacts });
}
