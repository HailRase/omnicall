import type { CallId } from "../../telephony/CallId.js";
import type { MainAcallId } from "./MainAcallId.js";

/**
 * - Purpose: link internal CallId to OCP main_acallid.
 * - Inputs: callId and mainAcallId pair.
 * - Outputs: immutable correlation record.
 */
export type OcpCallCorrelation = Readonly<{
  callId: CallId;
  mainAcallId: MainAcallId;
}>;

export function createOcpCallCorrelation(
  callId: CallId,
  mainAcallId: MainAcallId,
): OcpCallCorrelation {
  return { callId, mainAcallId };
}
