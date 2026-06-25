import type { JSX } from "react";
import { Dialpad } from "../../components/dialpad/Dialpad.js";
import { TransferPanel } from "../../components/call/TransferPanel.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import styles from "./CallControlsShell.module.css";

type CallControlsShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render dialpad and transfer panel in the controls zone.
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: controls zone markup; per-line controls live in CallLineRow.
 */
export function CallControlsShell({ bindings }: CallControlsShellProps): JSX.Element | null {
  if (!bindings.sipRegistered) {
    return null;
  }

  const {
    callProjection,
    multiLineCallProjection,
    dialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    callActions,
    transferPanelShell,
    transferActions,
    setCallMode,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
  } = bindings;

  return (
    <div className={styles["zone"]} data-testid="call-controls-zone">
      <Dialpad
        numberValue={dialedNumber}
        mode={dialpadMode}
        isCalling={isCalling}
        callDisabledReason={callDisabledReason}
        onNumberChange={setDialedNumber}
        onDelete={deleteLastDialedDigit}
        onClear={clearDialedNumber}
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
