import type { CallId } from "../telephony/CallId.js";
import type { TonePlaybackKind } from "./TonePlaybackKind.js";

/**
 * - Purpose: represent one active tone request from a call line.
 * - Inputs: call id, tone kind, monotonic sequence for tie-breaking.
 * - Outputs: immutable request record for arbiter resolution.
 */

export type TonePlaybackRequest = Readonly<{
  callId: CallId;
  kind: TonePlaybackKind;
  sequence: number;
}>;
