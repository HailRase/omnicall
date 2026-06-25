import type { MultiCallProjection } from "./multiCallProjection.js";
import type { CallLine, MultiLineCallProjection } from "./multiLineCallProjection.js";
import { deriveResumeMultiCallDisabledReason } from "./multiCallProjection.js";

export type CallLineCardViewModel = Readonly<{
  callId: string;
  role: CallLine["role"];
  state: CallLine["state"];
  muted: boolean;
  isActiveUnheld: boolean;
  resumeDisabledReason: string | null;
  hangupDisabledReason: string | null;
}>;

export type CallLinesShellViewModel = Readonly<{
  visible: boolean;
  lines: ReadonlyArray<CallLineCardViewModel>;
  policyErrorMessage: string | null;
}>;

const ESTABLISHED_LINE_STATES = new Set<CallLine["state"]>([
  "Active",
  "Held",
  "Connecting",
  "Ringing",
  "Transferring",
]);

/**
 * - Purpose: derive multi-line call panel view-model for renderer shell.
 * - Inputs: multi-line and multi-call projections.
 * - Outputs: visible lines with per-line disabled reasons and policy banner.
 */
export function deriveCallLinesShell(
  multiLineCallProjection: MultiLineCallProjection,
  multiCallProjection: MultiCallProjection,
): CallLinesShellViewModel {
  const resumePolicyReason = deriveResumeMultiCallDisabledReason(multiCallProjection);
  const establishedLines = multiLineCallProjection.lines.filter((line) =>
    ESTABLISHED_LINE_STATES.has(line.state),
  );

  const lines = establishedLines.map((line) => {
    const isActiveUnheld =
      line.state === "Active" && multiCallProjection.activeUnheldCallId === line.callId;
    const resumeDisabledReason = line.state === "Held" ? resumePolicyReason : null;
    const hangupDisabledReason =
      line.state === "Ending" || line.state === "Ended" ? "Call ending" : null;

    return {
      callId: line.callId,
      role: line.role,
      state: line.state,
      muted: line.muted,
      isActiveUnheld,
      resumeDisabledReason,
      hangupDisabledReason,
    };
  });

  return {
    visible: lines.length >= 2,
    lines,
    policyErrorMessage: mapPolicyViolationMessage(multiCallProjection.lastPolicyViolation),
  };
}

function mapPolicyViolationMessage(
  violation: MultiCallProjection["lastPolicyViolation"],
): string | null {
  if (violation === null) {
    return null;
  }
  switch (violation.scenario) {
    case "connecting_in_progress":
      return "Operation blocked while a call is connecting.";
    case "hold_all_in_progress":
      return "Operation blocked while holding other calls.";
    case "hold_all_failed":
      return "Could not hold all calls. Try again.";
    case "hold_all_rollback_failed":
      return "Hold-all failed and rollback was incomplete.";
    case "auto_answer_blocked":
      return "Auto-answer blocked while another call is active.";
    default:
      return violation.reason.length > 0 ? violation.reason : "Multi-call operation not allowed.";
  }
}
