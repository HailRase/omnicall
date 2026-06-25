import type { CallLine } from "./multiLineCallProjection.js";

const ESTABLISHED_LINE_STATES = new Set<CallLine["state"]>([
  "Active",
  "Held",
  "Connecting",
  "Ringing",
  "Transferring",
]);

/**
 * - Purpose: detect active telephony sessions blocking SIP recovery retries.
 * - Inputs: multi-line call projection lines.
 * - Outputs: true when at least one non-terminal call line exists.
 */
export function hasEstablishedTelephonySessions(
  lines: ReadonlyArray<CallLine>,
): boolean {
  return lines.some((line) => ESTABLISHED_LINE_STATES.has(line.state));
}
