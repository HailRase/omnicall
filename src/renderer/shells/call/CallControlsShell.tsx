import type { JSX } from "react";
import { CallControlsBar } from "../../components/call/CallControlsBar.js";
import { Dialpad } from "../../components/dialpad/Dialpad.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import styles from "./CallControlsShell.module.css";

type CallControlsShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render bottom controls zone for active controls and dialpad.
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: controls zone markup hidden for transfer and DTMF modes.
 */
export function CallControlsShell({ bindings }: CallControlsShellProps): JSX.Element {
  const {
    callProjection,
    activeCallControlsProjection,
    dialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    inputDisabledReason,
    callActions,
    callLinesActions,
    handleTransferLine,
    setCallMode,
    setDialedNumber,
    deleteLastDialedDigit,
    hasEstablishedCall,
    hasCallInProgress,
    controlTargetLine,
    numberEntryOverlayOpen,
    openNumberEntryOverlay,
    closeNumberEntryOverlay,
    clearDialedNumber,
    handleDialpadCall,
  } = bindings;

  const hideCallControls =
    dialpadMode === "dtmf" ||
    bindings.transferPanelShell.visible ||
    bindings.transferSuccessCelebration.visible ||
    numberEntryOverlayOpen;

  const showDialpad =
    (numberEntryOverlayOpen || !hasCallInProgress) && !bindings.transferSuccessCelebration.visible;

  return (
    <div className={styles["zone"]} data-testid="call-controls-zone">
      {!hideCallControls ? (
        <CallControlsBar
          line={controlTargetLine}
          lastOperationError={activeCallControlsProjection.lastOperationError}
          registrationDisabledReason={inputDisabledReason}
          onHold={callLinesActions.handleHoldLine}
          onResume={callLinesActions.handleResumeLine}
          onMute={callLinesActions.handleMuteLine}
          onUnmute={callLinesActions.handleUnmuteLine}
          onHangup={callLinesActions.handleHangupLine}
          onTransfer={handleTransferLine}
          onShowDtmf={() => {
            setCallMode("dtmf", controlTargetLine?.callId ?? null);
          }}
          onShowNumberEntry={openNumberEntryOverlay}
          onRetryOperation={callActions.handleRetryLastOperation}
        />
      ) : null}

      {showDialpad ? (
        <Dialpad
          numberValue={dialedNumber}
          mode={dialpadMode}
          isCalling={isCalling}
          callDisabledReason={callDisabledReason}
          inputDisabledReason={inputDisabledReason}
          hasEstablishedCall={hasEstablishedCall}
          overlayMode={numberEntryOverlayOpen}
          onNumberChange={setDialedNumber}
          onDelete={deleteLastDialedDigit}
          onClear={clearDialedNumber}
          onCall={handleDialpadCall}
          onSendDtmf={callActions.handleSendDtmf}
          onModeChange={setCallMode}
          {...(numberEntryOverlayOpen
            ? { onClose: closeNumberEntryOverlay }
            : {})}
        />
      ) : null}

      <audio
        data-testid="remote-audio-mount"
        aria-label="Remote audio mount point"
        hidden={!callProjection.remoteAudioAttached}
      />
    </div>
  );
}
