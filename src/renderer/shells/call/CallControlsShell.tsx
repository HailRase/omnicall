import { useMemo, type JSX } from "react";
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
    callLinesShell,
    callLinesActions,
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

  const hideControls = dialpadMode === "dtmf" || bindings.transferPanelShell.visible;

  return (
    <div className={styles["zone"]} data-testid="call-controls-zone">
      {!hideControls ? (
        <CallControlsBar
          line={controlLine}
          lastOperationError={activeCallControlsProjection.lastOperationError}
          registrationDisabledReason={inputDisabledReason}
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

      {!hideControls ? (
        <Dialpad
          numberValue={dialedNumber}
          mode={dialpadMode}
          isCalling={isCalling}
          callDisabledReason={callDisabledReason}
          inputDisabledReason={inputDisabledReason}
          hasEstablishedCall={hasEstablishedCall}
          onNumberChange={setDialedNumber}
          onDelete={deleteLastDialedDigit}
          onCall={callActions.handleDialpadCall}
          onSendDtmf={callActions.handleSendDtmf}
          onModeChange={setCallMode}
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
