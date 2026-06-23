import type { CallId } from "../../telephony/CallId.js";
import type { OcpCallCorrelation } from "../ocp/OcpCallCorrelation.js";
import type { MainAcallId } from "../ocp/MainAcallId.js";
import { isMainAcallIdEqual } from "../ocp/MainAcallId.js";

export type MatchQueueInfoInput = Readonly<{
  isOcpMode: boolean;
  queueMainAcallId: MainAcallId;
  knownCorrelations: ReadonlyArray<OcpCallCorrelation>;
}>;

export type MatchQueueInfoResult =
  | Readonly<{ ok: true; callId: CallId }>
  | Readonly<{
      ok: false;
      reason: "sip_only" | "no_correlation" | "main_acallid_mismatch";
    }>;

/**
 * - Purpose: map queue info to internal call using exact main_acallid (LF-037).
 * - Inputs: OCP mode flag, queue main_acallid, known correlations.
 * - Outputs: matched callId or structured rejection.
 */
export function matchQueueInfoToCall(input: MatchQueueInfoInput): MatchQueueInfoResult {
  if (!input.isOcpMode) {
    return { ok: false, reason: "sip_only" };
  }

  const exactMatch = input.knownCorrelations.find((correlation) =>
    isMainAcallIdEqual(correlation.mainAcallId, input.queueMainAcallId),
  );

  if (exactMatch === undefined) {
    const hasPartialCandidate = input.knownCorrelations.some((correlation) =>
      isPartialMainAcallIdMatch(correlation.mainAcallId, input.queueMainAcallId),
    );
    if (hasPartialCandidate) {
      return { ok: false, reason: "main_acallid_mismatch" };
    }
    return { ok: false, reason: "no_correlation" };
  }

  return { ok: true, callId: exactMatch.callId };
}

function isPartialMainAcallIdMatch(left: MainAcallId, right: MainAcallId): boolean {
  if (left === right) {
    return false;
  }
  return left.includes(right) || right.includes(left);
}
