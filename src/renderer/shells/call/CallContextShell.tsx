import type { JSX } from "react";
import { IncomingCallSessionCard } from "../../components/call/IncomingCallSessionCard.js";
import { MultiCallHoldAllIndicator } from "../../components/call/MultiCallHoldAllIndicator.js";
import { CallIdleEmptyState } from "../../components/call/CallIdleEmptyState.js";
import { CallVideoSurface } from "../../components/call/CallVideoSurface.js";
import { DtmfKeypadPanel } from "../../components/call/DtmfKeypadPanel.js";
import { CallSessionCard } from "../../components/call/CallSessionCard.js";
import { CallSessionStack } from "../../components/call/CallSessionStack.js";
import { OutgoingCallCard } from "../../components/call/OutgoingCallCard.js";
import { TransferPanel } from "../../components/call/TransferPanel.js";
import { TransferSuccessOverlay } from "../../components/call/TransferSuccessOverlay.js";
import { useAutoAnswerCountdown } from "../../hooks/useAutoAnswerCountdown.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import type { UseOcpRejectWithBreakResult } from "../../hooks/useOcpRejectWithBreak.js";
import styles from "./CallContextShell.module.css";

type CallContextShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
  ocpRejectWithBreak: UseOcpRejectWithBreakResult;
}>;

/**
 * - Purpose: render call context zone (sessions, outgoing card, idle state).
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: context zone markup; stays mounted when settings overlay opens.
 */
export function CallContextShell({
  bindings,
  ocpRejectWithBreak,
}: CallContextShellProps): JSX.Element {
  const {
    callProjection,
    multiCallProjection,
    multiLineCallProjection,
    callLinesShell,
    nonIncomingLinesShell,
    incomingCallProjection,
    incomingCallActions,
    incomingCallShell,
    dialpadMode,
    transferPanelShell,
    transferActions,
    transferSuccessCelebration,
    setCallMode,
    controlTargetLine,
    selectCallLine,
    selectIncomingCall,
    incomingCallId,
    isIncomingSelected,
    incomingSessionCardVisible,
    controlTargetVideoState,
    videoCallActions,
  } = bindings;

  const controlTargetCallId = controlTargetLine?.callId ?? null;

  const hasLineForActiveCall =
    callProjection.activeCallId !== null &&
    callLinesShell.lines.some((line) => line.callId === callProjection.activeCallId);

  const showOutgoingCard =
    (callProjection.state === "Connecting" || callProjection.state === "Failed") &&
    !hasLineForActiveCall;

  const isTransferMode = transferPanelShell.visible;
  const isTransferSuccessCelebration = transferSuccessCelebration.visible;
  const isDtmfMode = dialpadMode === "dtmf" && callProjection.dtmfPanelCallId !== null;
  const isNumberEntryOverlay = bindings.numberEntryOverlayOpen;
  const dtmfLine =
    multiLineCallProjection.lines.find(
      (line) => line.callId === callProjection.dtmfPanelCallId,
    ) ?? null;

  const hasIncomingCall = incomingCallId !== null;
  const autoAnswerSecondsRemaining = useAutoAnswerCountdown(
    incomingCallProjection.autoAnswerExpiresAt,
    incomingCallProjection.uiState === "autoAnswerCountdown",
  );
  const singleNonIncomingLine =
    nonIncomingLinesShell.lines.length === 1
      ? (nonIncomingLinesShell.lines[0] ?? null)
      : null;

  const showIdleState =
    !isTransferMode &&
    !isTransferSuccessCelebration &&
    !isDtmfMode &&
    !isNumberEntryOverlay &&
    !showOutgoingCard &&
    !hasIncomingCall &&
    !nonIncomingLinesShell.visible;

  const showVideoSurface =
    !isTransferMode &&
    !isTransferSuccessCelebration &&
    !isDtmfMode &&
    !isNumberEntryOverlay &&
    controlTargetCallId !== null &&
    controlTargetVideoState !== null &&
    controlTargetVideoState.mediaMode === "video" &&
    controlTargetVideoState.sessionView === "expanded";
  const isVideoFullscreen = controlTargetVideoState?.sessionView === "fullscreen";
  const unifiedSessionCard =
    showVideoSurface &&
    singleNonIncomingLine !== null &&
    singleNonIncomingLine.callId === controlTargetCallId
      ? singleNonIncomingLine
      : null;
  const showSeparateSessionCards = !isVideoFullscreen && unifiedSessionCard === null;

  return (
    <div
      className={`${styles.zone}${isVideoFullscreen ? ` ${styles.zoneVideoFullscreen}` : ""}`}
      data-testid="call-context-zone"
      data-video-fullscreen={isVideoFullscreen ? "true" : "false"}
    >
      <MultiCallHoldAllIndicator visible={multiCallProjection.holdAllInProgress} />

      {isTransferSuccessCelebration ? (
        <TransferSuccessOverlay
          visible={transferSuccessCelebration.visible}
          exiting={transferSuccessCelebration.exiting}
        />
      ) : null}

      {isTransferMode ? (
        <TransferPanel
          visible={transferPanelShell.visible}
          targetNumber={transferPanelShell.targetNumber}
          blindTransferDisabledReason={transferPanelShell.blindTransferDisabledReason}
          startConsultationDisabledReason={transferPanelShell.startConsultationDisabledReason}
          attendedTransferDisabledReason={transferPanelShell.attendedTransferDisabledReason}
          cancelTransferDisabledReason={transferPanelShell.cancelTransferDisabledReason}
          transferInProgress={transferPanelShell.transferInProgress}
          lines={multiLineCallProjection.lines}
          onTargetChange={transferPanelShell.setTargetNumber}
          onBlindTransfer={transferActions.handleBlindTransfer}
          onStartConsultation={transferActions.handleStartConsultation}
          onAttendedTransfer={transferActions.handleAttendedTransfer}
          onCancelTransfer={transferActions.handleCancelTransfer}
        />
      ) : null}

      {!isTransferMode && !isTransferSuccessCelebration && isDtmfMode && dtmfLine !== null ? (
        <DtmfKeypadPanel
          displayName={dtmfLine.displayLabel ?? dtmfLine.callId}
          toneHistory={dtmfLine.dtmfHistory}
          lastTone={dtmfLine.lastDtmfTone}
          onTone={bindings.callActions.handleSendDtmf}
          onClose={() => {
            setCallMode("number");
          }}
        />
      ) : null}

      {!isTransferMode && !isTransferSuccessCelebration && !isDtmfMode && !isNumberEntryOverlay ? (
        <>
          {showVideoSurface &&
          controlTargetCallId !== null &&
          controlTargetVideoState !== null ? (
            <div className={styles.sessionBlock} data-testid="call-session-block">
              <CallVideoSurface
                callId={controlTargetCallId}
                videoState={controlTargetVideoState}
                onBindSurfaces={videoCallActions.bindVideoSurfaces}
              />
              {unifiedSessionCard !== null ? (
                <div className={styles.sessionBlockCard}>
                  <CallSessionCard
                    line={unifiedSessionCard}
                    isActive={
                      hasIncomingCall &&
                      unifiedSessionCard.callId === controlTargetCallId
                    }
                    {...(hasIncomingCall
                      ? {
                          showSelectionChrome: true,
                          onClick: () => {
                            selectCallLine(unifiedSessionCard.callId);
                          },
                        }
                      : {})}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {incomingSessionCardVisible &&
          incomingCallId !== null &&
          !isVideoFullscreen ? (
            <IncomingCallSessionCard
              callId={incomingCallId}
              callerNumber={incomingCallShell.identity.callerNumber}
              displayName={incomingCallShell.identity.displayName}
              autoAnswerSecondsRemaining={autoAnswerSecondsRemaining}
              autoAnswerTimeoutSec={incomingCallProjection.autoAnswerTimeoutSec}
              uiState={incomingCallProjection.uiState}
              isSelected={isIncomingSelected}
              answerDisabledReason={incomingCallActions.answerDisabledReason}
              videoAnswerDisabledReason={incomingCallActions.videoAnswerDisabledReason}
              rejectDisabledReason={incomingCallActions.rejectDisabledReason}
              rejectChoiceEnabled={ocpRejectWithBreak.rejectChoiceEnabled}
              onSelect={selectIncomingCall}
              onAnswer={incomingCallActions.handleAnswerIncoming}
              onAnswerWithVideo={
                incomingCallActions.canAnswerWithVideo
                  ? incomingCallActions.handleAnswerIncomingWithVideo
                  : undefined
              }
              onReject={incomingCallActions.handleRejectIncoming}
              onRejectWithoutBreak={ocpRejectWithBreak.handleRejectWithoutBreak}
              onRejectWithBreak={ocpRejectWithBreak.handleRequestRejectWithBreak}
            />
          ) : null}

          {showSeparateSessionCards ? (
            <>
              <CallSessionStack
                shell={nonIncomingLinesShell}
                activeCallId={controlTargetCallId}
                onSelectLine={selectCallLine}
              />

              {singleNonIncomingLine !== null ? (
                <div className={styles.singleCard}>
                  <CallSessionCard
                    line={singleNonIncomingLine}
                    isActive={
                      hasIncomingCall &&
                      singleNonIncomingLine.callId === controlTargetCallId
                    }
                    {...(hasIncomingCall
                      ? {
                          showSelectionChrome: true,
                          onClick: () => {
                            selectCallLine(singleNonIncomingLine.callId);
                          },
                        }
                      : {})}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {showIdleState && !isVideoFullscreen ? <CallIdleEmptyState /> : null}

      {showOutgoingCard &&
      !isTransferMode &&
      !isTransferSuccessCelebration &&
      !isDtmfMode &&
      !isNumberEntryOverlay ? (
        <OutgoingCallCard
          callId={callProjection.activeCallId}
          callState={callProjection.state}
          numberValue={bindings.dialedNumber}
          displayName={bindings.outgoingDisplayName}
          lastError={callProjection.lastError}
          lastDtmfTone={callProjection.lastDtmfTone}
          uiState={callProjection.uiState}
          toneIndicator={callProjection.toneIndicator}
        />
      ) : null}
    </div>
  );
}
