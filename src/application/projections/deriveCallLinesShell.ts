import type { ActiveCallControlsProjection } from "./activeCallControlsProjection.js";
import { createActiveCallControlsProjection } from "./activeCallControlsProjection.js";
import { deriveCallLineStatusLabel } from "./deriveCallLineStatusLabel.js";
import type { MultiCallProjection } from "./multiCallProjection.js";
import { deriveResumeMultiCallDisabledReason } from "./multiCallProjection.js";
import type { CallLine, MultiLineCallProjection } from "./multiLineCallProjection.js";
import {
  deriveQueueLabelState,
  getQueueNameForCall,
  type QueueInfoProjection,
} from "./queueInfoProjection.js";
import type { QueueLabelState } from "./queueInfoProjection.js";
import { deriveStartTransferDisabledReason } from "./transferProjection.js";
import type { TransferProjection } from "./transferProjection.js";
import type { ActiveControlDisabledReason } from "./activeCallControlsProjection.js";

export type CallLinePrimaryAction = "hangup" | "resume" | "answer" | "none";

export type CallLineCardViewModel = Readonly<{
  callId: string;
  role: CallLine["role"];
  state: CallLine["state"];
  muted: boolean;
  isActiveUnheld: boolean;
  displayName: string;
  statusLabel: string;
  durationStartedAt: number | null;
  queueLabelState: QueueLabelState;
  queueName: string | null;
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
  policyErrorMessage: string | null;
}>;

export type CallLinesShellDeriveInput = Readonly<{
  multiLineCallProjection: MultiLineCallProjection;
  multiCallProjection: MultiCallProjection;
  queueInfoProjection: QueueInfoProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  transferProjection: TransferProjection;
  isOcpMode: boolean;
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
 * - Inputs: multi-line, multi-call, queue, controls, and transfer projections.
 * - Outputs: visible lines with labels, actions, and per-line disabled reasons.
 */
export function deriveCallLinesShell(
  input: CallLinesShellDeriveInput,
): CallLinesShellViewModel {
  const {
    multiLineCallProjection,
    multiCallProjection,
    queueInfoProjection,
    activeCallControlsProjection,
    transferProjection,
    isOcpMode,
  } = input;

  const resumePolicyReason = deriveResumeMultiCallDisabledReason(multiCallProjection);
  const establishedLines = multiLineCallProjection.lines.filter((line) =>
    ESTABLISHED_LINE_STATES.has(line.state),
  );

  const lines = establishedLines.map((line) =>
    mapLineToViewModel({
      line,
      multiCallProjection,
      resumePolicyReason,
      queueInfoProjection,
      activeCallControlsProjection,
      transferProjection,
      isOcpMode,
    }),
  );

  return {
    visible: lines.length >= 1,
    lines,
    policyErrorMessage: mapPolicyViolationMessage(multiCallProjection.lastPolicyViolation),
  };
}

function mapLineToViewModel(input: Readonly<{
  line: CallLine;
  multiCallProjection: MultiCallProjection;
  resumePolicyReason: string | null;
  queueInfoProjection: QueueInfoProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  transferProjection: TransferProjection;
  isOcpMode: boolean;
}>): CallLineCardViewModel {
  const { line, multiCallProjection, resumePolicyReason } = input;
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
  const primaryAction = resolvePrimaryAction(line.state);
  const showIconRow = line.state === "Active" && !line.isRemoteHold;
  const queueLabelState = input.isOcpMode
    ? deriveQueueLabelState(input.queueInfoProjection, line.callId)
    : ("hidden" as const);

  return {
    callId: line.callId,
    role: line.role,
    state: line.state,
    muted: line.muted,
    isActiveUnheld,
    displayName: line.displayLabel ?? "Unknown",
    statusLabel: deriveCallLineStatusLabel({
      state: line.state,
    }),
    durationStartedAt: line.activeSinceMs,
    queueLabelState,
    queueName: getQueueNameForCall(input.queueInfoProjection, line.callId),
    primaryAction,
    showIconRow,
    showLocalHoldBadge: line.state === "Held",
    showRemoteHoldBadge: line.isRemoteHold,
    resumeDisabledReason,
    hangupDisabledReason,
    holdDisabledReason: lineControls.holdDisabledReason,
    muteDisabledReason: lineControls.muteDisabledReason,
    unmuteDisabledReason: lineControls.unmuteDisabledReason,
    transferDisabledReason: isActiveUnheld
      ? deriveStartTransferDisabledReason({
          activeCallId: line.callId,
          activeCallState: line.state,
          transferModeActive: input.transferProjection.transferModeActive,
        })
      : null,
  };
}

function resolvePrimaryAction(state: CallLine["state"]): CallLinePrimaryAction {
  if (state === "Held") {
    return "resume";
  }
  if (state === "Ringing") {
    return "answer";
  }
  if (state === "Active" || state === "Transferring" || state === "Connecting") {
    return "hangup";
  }
  return "none";
}

function mapPolicyViolationMessage(
  violation: MultiCallProjection["lastPolicyViolation"],
): string | null {
  if (violation === null) {
    return null;
  }
  switch (violation.scenario) {
    case "connecting_in_progress":
      return "Операция заблокирована: выполняется соединение.";
    case "hold_all_in_progress":
      return "Операция заблокирована: удержание других звонков.";
    case "hold_all_failed":
      return "Не удалось удержать все звонки. Повторите попытку.";
    case "hold_all_rollback_failed":
      return "Удержание всех звонков не удалось, откат выполнен не полностью.";
    case "auto_answer_blocked":
      return null;
    default:
      return violation.reason.length > 0 ? violation.reason : "Операция с несколькими звонками недоступна.";
  }
}
