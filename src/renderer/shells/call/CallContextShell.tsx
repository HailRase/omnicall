import type { JSX } from "react";
import { MultiCallHoldAllIndicator } from "../../components/call/MultiCallHoldAllIndicator.js";
import { CallIdleEmptyState } from "../../components/call/CallIdleEmptyState.js";
import { DtmfKeypadPanel } from "../../components/call/DtmfKeypadPanel.js";
import { CallSessionCard } from "../../components/call/CallSessionCard.js";
import { CallSessionStack } from "../../components/call/CallSessionStack.js";
import { OutgoingCallCard } from "../../components/call/OutgoingCallCard.js";
import { TransferPanel } from "../../components/call/TransferPanel.js";
import { mapDtmfErrorMessage } from "../../helpers/mapDtmfErrorMessage.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import styles from "./CallContextShell.module.css";

type CallContextShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render call context zone (sessions, outgoing card, idle state).
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: context zone markup; stays mounted when settings overlay opens.
 */
export function CallContextShell({ bindings }: CallContextShellProps): JSX.Element {
  const {
    callProjection,
    multiCallProjection,
    multiLineCallProjection,
    callLinesShell,
    callLinesActions,
    dialpadMode,
    transferPanelShell,
    transferActions,
    setCallMode,
    controlTargetLine,
    selectCallLine,
  } = bindings;

  const controlTargetCallId = controlTargetLine?.callId ?? null;

  const hasLineForActiveCall =
    callProjection.activeCallId !== null &&
    callLinesShell.lines.some((line) => line.callId === callProjection.activeCallId);

  const showOutgoingCard =
    (callProjection.state === "Connecting" || callProjection.state === "Failed") &&
    !hasLineForActiveCall;

  const isTransferMode = transferPanelShell.visible;
  const isDtmfMode = dialpadMode === "dtmf" && callProjection.dtmfPanelCallId !== null;
  const isNumberEntryOverlay = bindings.numberEntryOverlayOpen;
  const dtmfLine =
    multiLineCallProjection.lines.find(
      (line) => line.callId === callProjection.dtmfPanelCallId,
    ) ?? null;

  const showIdleState =
    !isTransferMode &&
    !isDtmfMode &&
    !isNumberEntryOverlay &&
    !showOutgoingCard &&
    !callLinesShell.visible;

  const singleLine =
    callLinesShell.lines.length === 1 ? (callLinesShell.lines[0] ?? null) : null;

  return (
    <div className={styles["zone"]} data-testid="call-context-zone">
      <MultiCallHoldAllIndicator visible={multiCallProjection.holdAllInProgress} />

      {isTransferMode ? (
        <TransferPanel
          visible={transferPanelShell.visible}
          targetNumber={transferPanelShell.targetNumber}
          blindTransferDisabledReason={transferPanelShell.blindTransferDisabledReason}
          startConsultationDisabledReason={transferPanelShell.startConsultationDisabledReason}
          attendedTransferDisabledReason={transferPanelShell.attendedTransferDisabledReason}
          cancelTransferDisabledReason={transferPanelShell.cancelTransferDisabledReason}
          transferInProgress={transferPanelShell.transferInProgress}
          failureTitle={transferPanelShell.failureTitle}
          failureMessage={transferPanelShell.failureMessage}
          lines={multiLineCallProjection.lines}
          onTargetChange={transferPanelShell.setTargetNumber}
          onBlindTransfer={transferActions.handleBlindTransfer}
          onStartConsultation={transferActions.handleStartConsultation}
          onAttendedTransfer={transferActions.handleAttendedTransfer}
          onCancelTransfer={transferActions.handleCancelTransfer}
        />
      ) : null}

      {!isTransferMode && isDtmfMode && dtmfLine !== null ? (
        <DtmfKeypadPanel
          displayName={dtmfLine.displayLabel ?? dtmfLine.callId}
          toneHistory={dtmfLine.dtmfHistory}
          lastTone={dtmfLine.lastDtmfTone}
          errorMessage={mapDtmfErrorMessage(callProjection.lastDtmfError)}
          onTone={bindings.callActions.handleSendDtmf}
          onClose={() => {
            setCallMode("number");
          }}
        />
      ) : null}

      {!isTransferMode && !isDtmfMode && !isNumberEntryOverlay ? (
        <CallSessionStack
          shell={callLinesShell}
          activeCallId={controlTargetCallId}
          onSelectLine={selectCallLine}
          onHangupLine={callLinesActions.handleHangupLine}
        />
      ) : null}

      {!isTransferMode && !isDtmfMode && !isNumberEntryOverlay && singleLine !== null ? (
        <div className={styles["singleCard"]}>
          <CallSessionCard
            line={singleLine}
            isActive={singleLine.callId === controlTargetCallId}
          />
        </div>
      ) : null}

      {showIdleState ? <CallIdleEmptyState /> : null}

      {showOutgoingCard && !isTransferMode && !isDtmfMode && !isNumberEntryOverlay ? (
        <OutgoingCallCard
          callId={callProjection.activeCallId}
          callState={callProjection.state}
          numberValue={bindings.dialedNumber}
          lastError={callProjection.lastError}
          lastDtmfTone={callProjection.lastDtmfTone}
          uiState={callProjection.uiState}
          toneIndicator={callProjection.toneIndicator}
        />
      ) : null}
    </div>
  );
}
