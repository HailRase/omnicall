import type { JSX } from "react";
import { Dialpad } from "../../components/dialpad/Dialpad.js";
import { ActiveCallControlsPanel } from "../../components/call/ActiveCallControlsPanel.js";
import { TransferPanel } from "../../components/call/TransferPanel.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";

type CallControlsShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render dialpad and active-call controls in the controls zone.
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: controls zone markup for registered SIP telephony.
 */
export function CallControlsShell({ bindings }: CallControlsShellProps): JSX.Element | null {
  if (!bindings.sipRegistered) {
    return null;
  }

  const {
    callProjection,
    activeCallControlsProjection,
    multiLineCallProjection,
    dialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    callActions,
    transferPanelShell,
    transferActions,
    activeCallControlsShell,
    combinedResumeDisabledReason,
    setCallMode,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
  } = bindings;

  return (
    <div className="call-controls-zone" data-testid="call-controls-zone">
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

      <ActiveCallControlsPanel
        visible={activeCallControlsProjection.callId !== null}
        muted={activeCallControlsProjection.muted}
        holdDisabledReason={activeCallControlsProjection.holdDisabledReason}
        resumeDisabledReason={combinedResumeDisabledReason}
        muteDisabledReason={activeCallControlsProjection.muteDisabledReason}
        unmuteDisabledReason={activeCallControlsProjection.unmuteDisabledReason}
        hangupDisabledReason={activeCallControlsProjection.hangupDisabledReason}
        transferDisabledReason={activeCallControlsShell.transferDisabledReason}
        lastOperationError={activeCallControlsProjection.lastOperationError}
        onHold={callActions.handleHoldCall}
        onResume={callActions.handleResumeCall}
        onMute={callActions.handleMuteCall}
        onUnmute={callActions.handleUnmuteCall}
        onHangup={callActions.handleHangupCall}
        onTransfer={transferActions.handleStartTransfer}
        onRetry={callActions.handleRetryLastOperation}
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
