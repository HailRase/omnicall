import { useMemo, type JSX } from "react";
import { ActiveCallQuickBar } from "../../components/call/ActiveCallQuickBar.js";
import { CallSessionTabs } from "../../components/call/CallSessionTabs.js";
import { Dialpad } from "../../components/dialpad/Dialpad.js";
import { TransferPanel } from "../../components/call/TransferPanel.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import styles from "./CallControlsShell.module.css";

type CallControlsShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render home-screen dialpad stack with session tabs and transfer panel.
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: controls zone markup with tabs, quick bar, and dialpad.
 */
export function CallControlsShell({ bindings }: CallControlsShellProps): JSX.Element | null {
  const {
    callProjection,
    multiLineCallProjection,
    activeCallControlsProjection,
    dialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    callActions,
    callLinesShell,
    callLinesActions,
    transferPanelShell,
    transferActions,
    handleTransferLine,
    setCallMode,
    setDialedNumber,
    deleteLastDialedDigit,
    sipRegistered,
  } = bindings;

  const activeLine = useMemo(
    () => callLinesShell.lines.find((line) => line.isActiveUnheld) ?? null,
    [callLinesShell.lines],
  );

  if (!sipRegistered) {
    return null;
  }

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
    <div className={styles["zone"]} data-testid="call-controls-zone">
      <CallSessionTabs shell={callLinesShell} onSelectLine={handleSelectLine} />

      <ActiveCallQuickBar
        line={activeLine}
        lastOperationError={activeCallControlsProjection.lastOperationError}
        onHold={callLinesActions.handleHoldLine}
        onMute={callLinesActions.handleMuteLine}
        onUnmute={callLinesActions.handleUnmuteLine}
        onHangup={callLinesActions.handleHangupLine}
        onTransfer={handleTransferLine}
        onRetryOperation={callActions.handleRetryLastOperation}
      />

      <Dialpad
        numberValue={dialedNumber}
        mode={dialpadMode}
        isCalling={isCalling}
        callDisabledReason={callDisabledReason}
        onNumberChange={setDialedNumber}
        onDelete={deleteLastDialedDigit}
        onCall={callActions.handleDialpadCall}
        onSendDtmf={callActions.handleSendDtmf}
        onModeChange={setCallMode}
      />

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

      <audio
        data-testid="remote-audio-mount"
        aria-label="Remote audio mount point"
        hidden={!callProjection.remoteAudioAttached}
      />
    </div>
  );
}
