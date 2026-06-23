import type { JSX } from "react";
import { useState } from "react";
import { deriveStartTransferDisabledReason } from "@application/index.js";
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
import { CampaignEventModal } from "./components/call/CampaignEventModal.js";
import { MultiCallHoldAllIndicator } from "./components/call/MultiCallHoldAllIndicator.js";
import { TransferPanel } from "./components/call/TransferPanel.js";
import { useTransferActions, useTransferPanelShell } from "./hooks/useTransferActions.js";
import { useIncomingCallShell } from "./hooks/useIncomingCallShell.js";
import { useCampaignActions } from "./hooks/useCampaignActions.js";
import { StatusSelector } from "./components/status/StatusSelector.js";
import { StatusTimer } from "./components/status/StatusTimer.js";
import { LogoutReasonModal } from "./components/status/LogoutReasonModal.js";
import { useOperatorStatusActions } from "./hooks/useOperatorStatusActions.js";

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
  const queueInfoProjection = useAccountBootstrapStore(
    (state) => state.queueInfoProjection,
  );
  const campaignProjection = useAccountBootstrapStore(
    (state) => state.campaignProjection,
  );
  const multiCallProjection = useAccountBootstrapStore(
    (state) => state.multiCallProjection,
  );
  const transferProjection = useAccountBootstrapStore((state) => state.transferProjection);
  const multiLineCallProjection = useAccountBootstrapStore(
    (state) => state.multiLineCallProjection,
  );
  const operatorStatusProjection = useAccountBootstrapStore(
    (state) => state.operatorStatusProjection,
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

  const incomingCallShell = useIncomingCallShell({
    isOcpMode: projection.isOcpMode,
    incomingCallProjection,
    queueInfoProjection,
  });

  const campaignActions = useCampaignActions({
    facade,
    isOcpMode: projection.isOcpMode,
    incomingCallProjection,
    campaignProjection,
  });

  const transferPanelShell = useTransferPanelShell({
    transferProjection,
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection,
  });

  const transferActions = useTransferActions({
    facade,
    sourceCallId: transferPanelShell.sourceCallId,
    consultationCallId: transferPanelShell.consultationCallId,
    targetNumber: transferPanelShell.targetNumber,
    blindTransferDisabledReason: transferPanelShell.blindTransferDisabledReason,
    startConsultationDisabledReason: transferPanelShell.startConsultationDisabledReason,
    attendedTransferDisabledReason: transferPanelShell.attendedTransferDisabledReason,
    cancelTransferDisabledReason: transferPanelShell.cancelTransferDisabledReason,
    activeCallControlsProjection,
  });

  const transferDisabledReason = deriveStartTransferDisabledReason({
    activeCallId: activeCallControlsProjection.callId,
    activeCallState: activeCallControlsProjection.callState,
    transferModeActive: transferProjection.transferModeActive,
  });

  const [logoutSelectedReason, setLogoutSelectedReason] = useState<string | null>(null);

  const operatorStatusActions = useOperatorStatusActions({
    facade,
    operatorStatusProjection,
    accountProjection: projection,
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

          <StatusSelector
            visible={operatorStatusActions.visible}
            currentStatus={operatorStatusActions.currentStatus}
            pendingStatus={operatorStatusActions.pendingStatus}
            statusChangeInProgress={operatorStatusActions.statusChangeInProgress}
            readyDisabledReason={operatorStatusActions.readyDisabledReason}
            breakDisabledReason={operatorStatusActions.breakDisabledReason}
            rejectionBanner={operatorStatusActions.rejectionBanner}
            breakReasonPickerVisible={operatorStatusActions.breakReasonPickerVisible}
            breakReasons={operatorStatusActions.breakReasons}
            selectedBreakReason={operatorStatusActions.selectedBreakReason}
            onReady={operatorStatusActions.handleReady}
            onBreak={operatorStatusActions.handleBreak}
            onSelectBreakReason={operatorStatusActions.handleSelectBreakReason}
            onConfirmBreak={operatorStatusActions.handleConfirmBreak}
            onOpenLogout={operatorStatusActions.handleOpenLogout}
          />

          <StatusTimer
            statusChangedAt={operatorStatusProjection.statusChangedAt}
            timerRunning={operatorStatusProjection.timerRunning}
            currentStatus={operatorStatusProjection.currentStatus}
          />

          <LogoutReasonModal
            open={operatorStatusActions.logoutModalOpen}
            reasons={operatorStatusActions.breakReasons}
            reasonRequired={operatorStatusProjection.allowedBreakReasonsCount > 0}
            selectedReason={logoutSelectedReason}
            onSelectReason={setLogoutSelectedReason}
            onSubmit={() => {
              operatorStatusActions.handleLogoutSubmit(logoutSelectedReason ?? "");
              setLogoutSelectedReason(null);
            }}
            onClose={() => {
              operatorStatusActions.handleCloseLogout();
              setLogoutSelectedReason(null);
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
                transferDisabledReason={transferDisabledReason}
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
                startConsultationDisabledReason={
                  transferPanelShell.startConsultationDisabledReason
                }
                attendedTransferDisabledReason={
                  transferPanelShell.attendedTransferDisabledReason
                }
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

              <IncomingCallModal
                visible={incomingCallProjection.visible}
                callerNumber={incomingCallProjection.callerNumber}
                displayName={incomingCallProjection.displayName}
                queueLabelState={incomingCallShell.queueLabelState}
                queueName={incomingCallShell.queueName}
                campaignContextTitle={campaignActions.campaignContextTitle}
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

              <CampaignEventModal
                open={campaignActions.modalOpen}
                title={campaignActions.modalTitle}
                progressive={campaignActions.progressive}
                acceptDisabledReason={campaignActions.acceptDisabledReason}
                rejectDisabledReason={campaignActions.rejectDisabledReason}
                responseError={campaignActions.responseError}
                onAccept={campaignActions.handleAccept}
                onReject={campaignActions.handleReject}
                onClose={campaignActions.handleCloseModal}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
