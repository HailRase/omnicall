import { useMemo, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveActiveCallControlsShell,
  type AccountBootstrapProjection,
  type ActiveCallControlsProjection,
  type CallProjection,
  type CampaignProjection,
  type IncomingCallProjection,
  type MultiCallProjection,
  type MultiLineCallProjection,
  type OperatorStatusProjection,
  type QueueInfoProjection,
  type TransferProjection,
} from "@application/index.js";
import { Dialpad } from "../components/dialpad/Dialpad.js";
import { OutgoingCallCard } from "../components/call/OutgoingCallCard.js";
import { ActiveCallControlsPanel } from "../components/call/ActiveCallControlsPanel.js";
import { IncomingCallModal } from "../components/call/IncomingCallModal.js";
import { CampaignEventModal } from "../components/call/CampaignEventModal.js";
import { MultiCallHoldAllIndicator } from "../components/call/MultiCallHoldAllIndicator.js";
import { TransferPanel } from "../components/call/TransferPanel.js";
import { useTransferActions, useTransferPanelShell } from "../hooks/useTransferActions.js";
import { useIncomingCallShell } from "../hooks/useIncomingCallShell.js";
import { useCampaignActions } from "../hooks/useCampaignActions.js";
import { useDialpadShell } from "../hooks/useDialpadShell.js";
import { useSoftphoneCallActions } from "../hooks/useSoftphoneCallActions.js";
import { useIncomingCallActions } from "../hooks/useIncomingCallActions.js";
import type { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type CallFeatureShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  projection: AccountBootstrapProjection;
  callProjection: CallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  incomingCallProjection: IncomingCallProjection;
  queueInfoProjection: QueueInfoProjection;
  campaignProjection: CampaignProjection;
  multiCallProjection: MultiCallProjection;
  transferProjection: TransferProjection;
  multiLineCallProjection: MultiLineCallProjection;
  operatorStatusProjection: OperatorStatusProjection;
  setCallMode: ReturnType<typeof useAccountBootstrapStore.getState>["setCallMode"];
  setIncomingUiState: ReturnType<typeof useAccountBootstrapStore.getState>["setIncomingUiState"];
  setIncomingBreakReason: ReturnType<typeof useAccountBootstrapStore.getState>["setIncomingBreakReason"];
  setIncomingRejectReasonRequired: ReturnType<
    typeof useAccountBootstrapStore.getState
  >["setIncomingRejectReasonRequired"];
}>;

/**
 * - Purpose: compose registered-SIP telephony UI (dialpad, calls, transfer, incoming).
 * - Inputs: facade, projections, and store setters for call/incoming UI state.
 * - Outputs: call feature panel when SIP is registered.
 */
export function CallFeatureShell({
  facade,
  projection,
  callProjection,
  activeCallControlsProjection,
  incomingCallProjection,
  queueInfoProjection,
  campaignProjection,
  multiCallProjection,
  transferProjection,
  multiLineCallProjection,
  operatorStatusProjection,
  setCallMode,
  setIncomingUiState,
  setIncomingBreakReason,
  setIncomingRejectReasonRequired,
}: CallFeatureShellProps): JSX.Element | null {
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

  const activeCallControlsShell = useMemo(
    () => deriveActiveCallControlsShell(activeCallControlsProjection, transferProjection),
    [activeCallControlsProjection, transferProjection],
  );

  const incomingRejectReasons = projection.isOcpMode
    ? operatorStatusProjection.allowedBreakReasons
    : [];

  if (projection.authUiState !== "sip_registered") {
    return null;
  }

  return (
    <div className="shell__content">
      <p className="shell__hint" data-testid="sip-registered-hint">
        SIP account is registered via mock gateway (P01-P02 foundation).
      </p>

      <MultiCallHoldAllIndicator visible={multiCallProjection.holdAllInProgress} />

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

      <IncomingCallModal
        visible={incomingCallProjection.visible}
        callerNumber={incomingCallProjection.callerNumber}
        displayName={incomingCallProjection.displayName}
        queueLabelState={incomingCallShell.queueLabelState}
        queueName={incomingCallShell.queueName}
        campaignContextTitle={campaignActions.campaignContextTitle}
        ringingState={incomingCallProjection.ringingIndicator}
        autoAnswerSecondsRemaining={incomingCallProjection.autoAnswerSecondsRemaining}
        uiState={incomingCallProjection.uiState}
        rejectReasonRequired={projection.isOcpMode}
        rejectReasons={incomingRejectReasons}
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
  );
}
