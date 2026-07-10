import type { Contact } from "@domain/index.js";
import { buildContactDirectory, resolveCallLineDisplayName } from "../../read-models/contactDirectory.js";
import type { ActiveCallControlsProjection } from "./activeCallControlsProjection.js";
import { createActiveCallControlsProjection } from "./activeCallControlsProjection.js";
import { deriveCallLineStatusLabel } from "./deriveCallLineStatusLabel.js";
import type { MultiCallProjection } from "./multiCallProjection.js";
import { deriveResumeMultiCallDisabledReason } from "./multiCallProjection.js";
import type { CallLine, MultiLineCallProjection } from "./multiLineCallProjection.js";
import { deriveStartTransferDisabledReason } from "./transferProjection.js";
import type { TransferProjection } from "./transferProjection.js";
import type { ActiveControlDisabledReason } from "./activeCallControlsProjection.js";
import type { CallLineStatusLabelKey } from "./deriveCallLineStatusLabel.js";

export type CallLinePrimaryAction = "hangup" | "resume" | "answer" | "none";
export type CallLinesPolicyErrorKey =
  | "call.lines.policy.connectingInProgress"
  | "call.lines.policy.holdAllInProgress"
  | "call.lines.policy.holdAllFailed"
  | "call.lines.policy.holdAllRollbackFailed"
  | "call.lines.policy.operationUnavailable";

export type CallLinesPolicyErrorParams = Readonly<{
  reason: string;
}>;

export type CallLineCardViewModel = Readonly<{
  callId: string;
  role: CallLine["role"];
  state: CallLine["state"];
  muted: boolean;
  isActiveUnheld: boolean;
  displayName: string;
  statusLabel: CallLineStatusLabelKey;
  durationStartedAt: number | null;
  primaryAction: CallLinePrimaryAction;
  showIconRow: boolean;
  showLocalHoldBadge: boolean;
  showRemoteHoldBadge: boolean;
  resumeDisabledReason: string | null;
  hangupDisabledReason: ActiveControlDisabledReason | null;
  holdDisabledReason: ActiveControlDisabledReason | null;
  muteDisabledReason: ActiveControlDisabledReason | null;
  unmuteDisabledReason: ActiveControlDisabledReason | null;
  transferDisabledReason: string | null;
}>;

export type CallLinesShellViewModel = Readonly<{
  visible: boolean;
  lines: ReadonlyArray<CallLineCardViewModel>;
  policyErrorMessage: CallLinesPolicyErrorKey | null;
  policyErrorMessageParams: CallLinesPolicyErrorParams | null;
}>;

export type CallLinesShellDeriveInput = Readonly<{
  multiLineCallProjection: MultiLineCallProjection;
  multiCallProjection: MultiCallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  transferProjection: TransferProjection;
  contacts: ReadonlyArray<Contact>;
  /** Waiting incoming call id — Ringing lines use answer only for this session. */
  incomingCallId?: string | null;
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
 * - Inputs: multi-line, multi-call, controls, and transfer projections.
 * - Outputs: visible lines with labels, actions, and per-line disabled reasons.
 */
export function deriveCallLinesShell(
  input: CallLinesShellDeriveInput,
): CallLinesShellViewModel {
  const {
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection,
    transferProjection,
  } = input;
  const incomingCallId = input.incomingCallId ?? null;
  const resumePolicyReason = deriveResumeMultiCallDisabledReason(multiCallProjection);
  const contactDirectory = buildContactDirectory(input.contacts);
  const establishedLines = multiLineCallProjection.lines.filter((line) =>
    ESTABLISHED_LINE_STATES.has(line.state),
  );
  const hasOutgoingInProgress = establishedLines.some((line) => {
    if (line.state === "Connecting") {
      return true;
    }
    return line.state === "Ringing" && line.callId !== incomingCallId;
  });

  const lines = establishedLines.map((line) =>
    mapLineToViewModel({
      line,
      multiCallProjection,
      resumePolicyReason,
      activeCallControlsProjection,
      transferProjection,
      contactDirectory,
      incomingCallId,
      hasOutgoingInProgress,
    }),
  );

  const policyError = mapPolicyViolationMessage(multiCallProjection.lastPolicyViolation);
  return {
    visible: lines.length >= 1,
    lines,
    policyErrorMessage: policyError?.key ?? null,
    policyErrorMessageParams: policyError?.params ?? null,
  };
}

function mapLineToViewModel(input: Readonly<{
  line: CallLine;
  multiCallProjection: MultiCallProjection;
  resumePolicyReason: string | null;
  activeCallControlsProjection: ActiveCallControlsProjection;
  transferProjection: TransferProjection;
  contactDirectory: ReturnType<typeof buildContactDirectory>;
  incomingCallId: string | null;
  hasOutgoingInProgress: boolean;
}>): CallLineCardViewModel {
  const {
    line,
    multiCallProjection,
    resumePolicyReason,
    incomingCallId,
    hasOutgoingInProgress,
  } = input;
  const isActiveUnheld =
    line.state === "Active" && multiCallProjection.activeUnheldCallId === line.callId;
  const lineControls = createActiveCallControlsProjection({
    callId: line.callId,
    callState: line.state,
    muted: line.muted,
  });
  const resumeDisabledReason =
    line.state === "Held" ? resumePolicyReason : lineControls.resumeDisabledReason;
  const hangupDisabledReason =
    line.state === "Ending" || line.state === "Ended"
      ? ("call_ending" as const)
      : lineControls.hangupDisabledReason;
  const primaryAction = resolvePrimaryAction(line.state, line.callId, incomingCallId);
  const showIconRow = line.state === "Active" && !line.isRemoteHold;
  // Mute/unmute blocked for all sessions while an outbound dial is in progress —
  // avoids headset sync loader stuck on held while focus stays on outgoing.
  const muteDisabledReason = hasOutgoingInProgress
    ? ("outgoing_dial_in_progress" as const)
    : lineControls.muteDisabledReason;
  const unmuteDisabledReason = hasOutgoingInProgress
    ? ("outgoing_dial_in_progress" as const)
    : lineControls.unmuteDisabledReason;

  return {
    callId: line.callId,
    role: line.role,
    state: line.state,
    muted: line.muted,
    isActiveUnheld,
    displayName: resolveCallLineDisplayName(
      input.contactDirectory,
      line.remoteNumber,
      line.displayLabel,
    ),
    statusLabel: deriveCallLineStatusLabel({
      state: line.state,
    }),
    durationStartedAt: line.activeSinceMs,
    primaryAction,
    showIconRow,
    showLocalHoldBadge: line.state === "Held",
    showRemoteHoldBadge: line.isRemoteHold,
    resumeDisabledReason,
    hangupDisabledReason,
    holdDisabledReason: lineControls.holdDisabledReason,
    muteDisabledReason,
    unmuteDisabledReason,
    transferDisabledReason: isActiveUnheld
      ? deriveStartTransferDisabledReason({
          activeCallId: line.callId,
          activeCallState: line.state,
          transferModeActive: input.transferProjection.transferModeActive,
        })
      : null,
  };
}

function resolvePrimaryAction(
  state: CallLine["state"],
  callId: string,
  incomingCallId: string | null,
): CallLinePrimaryAction {
  if (state === "Held") {
    return "resume";
  }
  // Outbound ringback is also Ringing — only the waiting incoming is answerable.
  if (state === "Ringing" && incomingCallId !== null && callId === incomingCallId) {
    return "answer";
  }
  if (state === "Active" || state === "Transferring" || state === "Connecting" || state === "Ringing") {
    return "hangup";
  }
  return "none";
}

function mapPolicyViolationMessage(
  violation: MultiCallProjection["lastPolicyViolation"],
): Readonly<{
  key: CallLinesPolicyErrorKey;
  params: CallLinesPolicyErrorParams | null;
}> | null {
  if (violation === null) {
    return null;
  }
  switch (violation.scenario) {
    case "connecting_in_progress":
      return { key: "call.lines.policy.connectingInProgress", params: null };
    case "hold_all_in_progress":
      return { key: "call.lines.policy.holdAllInProgress", params: null };
    case "hold_all_failed":
      return { key: "call.lines.policy.holdAllFailed", params: null };
    case "hold_all_rollback_failed":
      return { key: "call.lines.policy.holdAllRollbackFailed", params: null };
    case "auto_answer_blocked":
      return null;
    default:
      return violation.reason.length > 0
        ? {
            key: "call.lines.policy.operationUnavailable",
            params: { reason: violation.reason },
          }
        : {
            key: "call.lines.policy.operationUnavailable",
            params: null,
          };
  }
}
