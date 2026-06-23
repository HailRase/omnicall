import type { JSX } from "react";
import { useAccountBootstrapStore } from "./stores/useAccountBootstrapStore.js";
import { useAccountBootstrap } from "./hooks/useAccountBootstrap.js";
import { useAuthShellFlags } from "./hooks/useAuthShellFlags.js";
import { useDialpadShell } from "./hooks/useDialpadShell.js";
import { useSoftphoneCallActions } from "./hooks/useSoftphoneCallActions.js";
import { useIncomingCallActions } from "./hooks/useIncomingCallActions.js";
import { registrationLabel } from "./helpers/registrationLabel.js";
import { AuthStateView } from "./components/auth/AuthStateView.js";
import { AccountPanel } from "./components/account/AccountPanel.js";
import { PhoneStatusBadge } from "./components/status/PhoneStatusBadge.js";
import { Dialpad } from "./components/dialpad/Dialpad.js";
import { OutgoingCallCard } from "./components/call/OutgoingCallCard.js";
import { ActiveCallControlsPanel } from "./components/call/ActiveCallControlsPanel.js";
import { IncomingCallModal } from "./components/call/IncomingCallModal.js";
import { MultiCallHoldAllIndicator } from "./components/call/MultiCallHoldAllIndicator.js";

export function App(): JSX.Element {
  const { facade, status, errorMessage } = useAccountBootstrap();
  const projection = useAccountBootstrapStore((state) => state.projection);
  const callProjection = useAccountBootstrapStore((state) => state.callProjection);
  const activeCallControlsProjection = useAccountBootstrapStore(
    (state) => state.activeCallControlsProjection,
  );
  const incomingCallProjection = useAccountBootstrapStore(
    (state) => state.incomingCallProjection,
  );
  const multiCallProjection = useAccountBootstrapStore(
    (state) => state.multiCallProjection,
  );
  const setCallMode = useAccountBootstrapStore((state) => state.setCallMode);
  const setIncomingUiState = useAccountBootstrapStore((state) => state.setIncomingUiState);
  const setIncomingBreakReason = useAccountBootstrapStore(
    (state) => state.setIncomingBreakReason,
  );
  const setIncomingRejectReasonRequired = useAccountBootstrapStore(
    (state) => state.setIncomingRejectReasonRequired,
  );

  const { showAccountPanel, blockingAuthState } = useAuthShellFlags();
  const {
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
  } = useDialpadShell(projection, callProjection, multiCallProjection);

  const callActions = useSoftphoneCallActions({
    facade,
    callProjection,
    activeCallControlsProjection,
    dialedNumber,
    callDisabledReason,
  });

  const incomingCallActions = useIncomingCallActions({
    facade,
    incomingCallProjection,
    multiCallProjection,
    isOcpMode: projection.isOcpMode,
    setIncomingUiState,
    setIncomingRejectReasonRequired,
  });

  return (
    <main className="shell" data-testid="softphone-shell">
      <header className="shell__header">
        <h1 className="shell__title">Enterprise Softphone</h1>
        <p className="shell__subtitle">Authorization &amp; Account Bootstrap</p>
      </header>

      {status === "loading" && (
        <p data-testid="bootstrap-loading">Booting application…</p>
      )}

      {status === "error" && (
        <p className="shell__error" data-testid="bootstrap-error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && facade !== null && (
        <>
          <AuthStateView
            state={projection.authUiState}
            lastError={projection.lastError}
          />

          <PhoneStatusBadge
            status={projection.phoneStatus}
            registrationLabel={registrationLabel(
              projection.registrationState,
              projection.authUiState,
            )}
            disabled={blockingAuthState}
            onChange={(nextStatus) => {
              void facade.setPhoneStatus(nextStatus);
            }}
          />

          {showAccountPanel && !blockingAuthState && (
            <AccountPanel facade={facade} />
          )}

          {projection.authUiState === "sip_registered" && (
            <div className="shell__content">
              <p className="shell__hint" data-testid="sip-registered-hint">
                SIP account is registered via mock gateway (P01-P02 foundation).
              </p>

              <MultiCallHoldAllIndicator
                visible={multiCallProjection.holdAllInProgress}
              />

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

              <OutgoingCallCard
                callId={callProjection.activeCallId}
                callState={callProjection.state}
                numberValue={dialedNumber}
                lastError={callProjection.lastError}
                lastDtmfTone={callProjection.lastDtmfTone}
                uiState={callProjection.uiState}
                toneIndicator={callProjection.toneIndicator}
              />
              <ActiveCallControlsPanel
                visible={activeCallControlsProjection.callId !== null}
                muted={activeCallControlsProjection.muted}
                holdDisabledReason={activeCallControlsProjection.holdDisabledReason}
                resumeDisabledReason={activeCallControlsProjection.resumeDisabledReason}
                muteDisabledReason={activeCallControlsProjection.muteDisabledReason}
                unmuteDisabledReason={activeCallControlsProjection.unmuteDisabledReason}
                hangupDisabledReason={activeCallControlsProjection.hangupDisabledReason}
                lastOperationError={activeCallControlsProjection.lastOperationError}
                onHold={callActions.handleHoldCall}
                onResume={callActions.handleResumeCall}
                onMute={callActions.handleMuteCall}
                onUnmute={callActions.handleUnmuteCall}
                onHangup={callActions.handleHangupCall}
                onRetry={callActions.handleRetryLastOperation}
              />
              <audio
                data-testid="remote-audio-mount"
                aria-label="Remote audio mount point"
                hidden={!callProjection.remoteAudioAttached}
              />

              <IncomingCallModal
                visible={incomingCallProjection.visible}
                callerNumber={incomingCallProjection.callerNumber}
                displayName={incomingCallProjection.displayName}
                queueInfo={incomingCallProjection.queueInfo}
                ringingState={incomingCallProjection.ringingIndicator}
                autoAnswerSecondsRemaining={
                  incomingCallProjection.autoAnswerSecondsRemaining
                }
                uiState={incomingCallProjection.uiState}
                rejectReasonRequired={projection.isOcpMode}
                rejectReasons={["break", "meeting", "training"]}
                selectedBreakReason={incomingCallProjection.selectedBreakReason}
                answerDisabledReason={incomingCallActions.answerDisabledReason}
                rejectDisabledReason={incomingCallActions.rejectDisabledReason}
                onAnswer={incomingCallActions.handleAnswerIncoming}
                onReject={incomingCallActions.handleRejectIncoming}
                onSelectBreakReason={(reason) => {
                  setIncomingBreakReason(reason);
                }}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
