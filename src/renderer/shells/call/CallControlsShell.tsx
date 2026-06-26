import { useMemo, type JSX } from "react";
import { CallControlsBar } from "../../components/call/CallControlsBar.js";
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
export function CallControlsShell({ bindings }: CallControlsShellProps): JSX.Element {
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
  } = bindings;

  const controlLine = useMemo(() => {
    const unheld = callLinesShell.lines.find((line) => line.isActiveUnheld);
    if (unheld !== undefined) {
      return unheld;
    }
    return (
      callLinesShell.lines.find((line) => line.state === "Active" || line.state === "Held") ??
      null
    );
  }, [callLinesShell.lines]);

  const hasEstablishedCall = callLinesShell.lines.some(
    (line) => line.state === "Active" || line.state === "Held",
  );

  const hideControlsForDtmf = dialpadMode === "dtmf";

  return (
    <div className={styles["zone"]} data-testid="call-controls-zone">
      {!hideControlsForDtmf ? (
        <CallControlsBar
        line={controlLine}
        lastOperationError={activeCallControlsProjection.lastOperationError}
        onHold={callLinesActions.handleHoldLine}
        onResume={callLinesActions.handleResumeLine}
        onMute={callLinesActions.handleMuteLine}
        onUnmute={callLinesActions.handleUnmuteLine}
        onHangup={callLinesActions.handleHangupLine}
        onTransfer={handleTransferLine}
        onShowDtmf={() => {
          setCallMode("dtmf");
        }}
        onRetryOperation={callActions.handleRetryLastOperation}
        />
      ) : null}

      {!hideControlsForDtmf ? (
        <Dialpad
        numberValue={dialedNumber}
        mode={dialpadMode}
        isCalling={isCalling}
        callDisabledReason={callDisabledReason}
        hasEstablishedCall={hasEstablishedCall}
        onNumberChange={setDialedNumber}
        onDelete={deleteLastDialedDigit}
        onCall={callActions.handleDialpadCall}
        onSendDtmf={callActions.handleSendDtmf}
        onModeChange={setCallMode}
        />
      ) : null}

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
