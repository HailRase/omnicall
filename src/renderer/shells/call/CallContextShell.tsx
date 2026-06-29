import type { JSX } from "react";
import { MultiCallHoldAllIndicator } from "../../components/call/MultiCallHoldAllIndicator.js";
import { CallIdleEmptyState } from "../../components/call/CallIdleEmptyState.js";
import { DtmfKeypadPanel } from "../../components/call/DtmfKeypadPanel.js";
import { CallSessionCard } from "../../components/call/CallSessionCard.js";
import { CallSessionStack } from "../../components/call/CallSessionStack.js";
import { OutgoingCallCard } from "../../components/call/OutgoingCallCard.js";
import { TransferPanel } from "../../components/call/TransferPanel.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import styles from "./CallContextShell.module.css";

type CallContextShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render call context zone (sessions, outgoing card, idle state).
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: context zone markup; stays mounted when settings overlay opens.
 */
export function CallContextShell({ bindings }: CallContextShellProps): JSX.Element {
  const {
    callProjection,
    multiCallProjection,
    multiLineCallProjection,
    callLinesShell,
    callLinesActions,
    dialpadMode,
    transferPanelShell,
    transferActions,
    setCallMode,
  } = bindings;

  const hasLineForActiveCall =
    callProjection.activeCallId !== null &&
    callLinesShell.lines.some((line) => line.callId === callProjection.activeCallId);

  const showOutgoingCard =
    callProjection.lastError !== null ||
    ((callProjection.state === "Connecting" || callProjection.state === "Failed") &&
      !hasLineForActiveCall);

  const isTransferMode = transferPanelShell.visible;
  const isDtmfMode = dialpadMode === "dtmf";
  const dtmfLine =
    (isTransferMode
      ? null
      : callLinesShell.lines.find((line) => line.isActiveUnheld) ??
        callLinesShell.lines.find((line) => line.state === "Active")) ??
    null;

  const showIdleState =
    !isTransferMode && !isDtmfMode && !showOutgoingCard && !callLinesShell.visible;

  const singleLine =
    callLinesShell.lines.length === 1 ? (callLinesShell.lines[0] ?? null) : null;

  const handleSelectLine = (callId: string): void => {
    const line = callLinesShell.lines.find((entry) => entry.callId === callId);
    if (line === undefined) {
      return;
    }
    if (line.state === "Held") {
      callLinesActions.handleResumeLine(callId);
      return;
    }
    if (line.primaryAction === "answer") {
      callLinesActions.handleAnswerLine(callId);
    }
  };

  return (
    <div className={styles["zone"]} data-testid="call-context-zone">
      <MultiCallHoldAllIndicator visible={multiCallProjection.holdAllInProgress} />

      {isTransferMode ? (
        <TransferPanel
          visible={transferPanelShell.visible}
          targetNumber={transferPanelShell.targetNumber}
          blindTransferDisabledReason={transferPanelShell.blindTransferDisabledReason}
          startConsultationDisabledReason={transferPanelShell.startConsultationDisabledReason}
          attendedTransferDisabledReason={transferPanelShell.attendedTransferDisabledReason}
          cancelTransferDisabledReason={transferPanelShell.cancelTransferDisabledReason}
          transferInProgress={transferPanelShell.transferInProgress}
          failureMessage={transferPanelShell.failureMessage}
          lines={multiLineCallProjection.lines}
          onTargetChange={transferPanelShell.setTargetNumber}
          onBlindTransfer={transferActions.handleBlindTransfer}
          onStartConsultation={transferActions.handleStartConsultation}
          onAttendedTransfer={transferActions.handleAttendedTransfer}
          onCancelTransfer={transferActions.handleCancelTransfer}
        />
      ) : null}

      {!isTransferMode && isDtmfMode && dtmfLine !== null ? (
        <DtmfKeypadPanel
          displayName={dtmfLine.displayName}
          lastTone={callProjection.lastDtmfTone}
          onTone={bindings.callActions.handleSendDtmf}
          onClose={() => {
            setCallMode("number");
          }}
        />
      ) : null}

      {!isTransferMode && !isDtmfMode ? (
        <CallSessionStack
          shell={callLinesShell}
          onSelectLine={handleSelectLine}
          onHangupLine={callLinesActions.handleHangupLine}
        />
      ) : null}

      {!isTransferMode && !isDtmfMode && singleLine !== null ? (
        <div className={styles["singleCard"]}>
          <CallSessionCard line={singleLine} isActive />
        </div>
      ) : null}

      {showIdleState ? <CallIdleEmptyState /> : null}

      {showOutgoingCard && !isTransferMode && !isDtmfMode ? (
        <OutgoingCallCard
          callId={callProjection.activeCallId}
          callState={callProjection.state}
          numberValue={bindings.dialedNumber}
          lastError={callProjection.lastError}
          lastDtmfTone={callProjection.lastDtmfTone}
          uiState={callProjection.uiState}
          toneIndicator={callProjection.toneIndicator}
        />
      ) : null}
    </div>
  );
}
