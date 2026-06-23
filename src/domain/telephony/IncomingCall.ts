/**
 * - Purpose: provide incoming-call specialization over generic Call.
 * - Inputs: generic Call entity.
 * - Outputs: typed IncomingCall when direction is incoming.
 */
import type { Call } from "./Call.js";

export type IncomingCall = Call & Readonly<{ direction: "incoming" }>;

export function asIncomingCall(call: Call): IncomingCall | null {
  if (call.direction !== "incoming") {
    return null;
  }
  return call as IncomingCall;
}
