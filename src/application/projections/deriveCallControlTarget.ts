import type { CallLineCardViewModel } from "./deriveCallLinesShell.js";
import { deriveIncomingCallControlLine } from "./deriveIncomingCallControlLine.js";
import type { IncomingCallProjection } from "./incomingCallProjection.js";

export type DeriveCallControlTargetInput = Readonly<{
  selectedCallId: string | null;
  lines: ReadonlyArray<CallLineCardViewModel>;
  incomingCallId: string | null;
  incomingCallProjection: IncomingCallProjection;
}>;

const ESTABLISHED_FALLBACK_STATES = new Set<CallLineCardViewModel["state"]>([
  "Active",
  "Held",
]);

/**
 * - Purpose: resolve which call session drives the shared ControlsBar.
 * - Inputs: user selection, multi-line shell lines, incoming projection.
 * - Outputs: target line view-model or null when no controllable session exists.
 */
export function deriveCallControlTarget(
  input: DeriveCallControlTargetInput,
): CallLineCardViewModel | null {
  const { selectedCallId, lines, incomingCallId, incomingCallProjection } = input;

  if (selectedCallId !== null) {
    if (incomingCallId !== null && selectedCallId === incomingCallId) {
      return deriveIncomingCallControlLine(incomingCallProjection);
    }
    const selected = lines.find((line) => line.callId === selectedCallId);
    if (selected !== undefined) {
      return selected;
    }
  }

  const unheld = lines.find((line) => line.isActiveUnheld);
  if (unheld !== undefined) {
    return unheld;
  }

  const connecting = lines.find((line) => line.state === "Connecting");
  if (connecting !== undefined) {
    return connecting;
  }

  const established = lines.find((line) => ESTABLISHED_FALLBACK_STATES.has(line.state));
  if (established !== undefined) {
    return established;
  }

  if (incomingCallId !== null && incomingCallProjection.visible) {
    return deriveIncomingCallControlLine(incomingCallProjection);
  }

  const ringing = lines.find((line) => line.state === "Ringing");
  return ringing ?? null;
}
