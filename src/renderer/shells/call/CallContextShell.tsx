import type { JSX } from "react";
import { MultiCallHoldAllIndicator } from "../../components/call/MultiCallHoldAllIndicator.js";
import { CallIdleEmptyState } from "../../components/call/CallIdleEmptyState.js";
import { DtmfKeypadPanel } from "../../components/call/DtmfKeypadPanel.js";
import { CallSessionCard } from "../../components/call/CallSessionCard.js";
import { CallSessionStack } from "../../components/call/CallSessionStack.js";
import { OutgoingCallCard } from "../../components/call/OutgoingCallCard.js";
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
    callLinesShell,
    callLinesActions,
    dialpadMode,
    setCallMode,
  } = bindings;

  const hasLineForActiveCall =
    callProjection.activeCallId !== null &&
    callLinesShell.lines.some((line) => line.callId === callProjection.activeCallId);

  const showOutgoingCard =
    callProjection.lastError !== null ||
    ((callProjection.state === "Connecting" || callProjection.state === "Failed") &&
      !hasLineForActiveCall);

  const isDtmfMode = dialpadMode === "dtmf";
  const dtmfLine =
    callLinesShell.lines.find((line) => line.isActiveUnheld) ??
    callLinesShell.lines.find((line) => line.state === "Active") ??
    null;

  const showIdleState = !isDtmfMode && !showOutgoingCard && !callLinesShell.visible;

  const singleLine =
    callLinesShell.lines.length === 1 ? (callLinesShell.lines[0] ?? null) : null;

  const handleSelectLine = (callId: string): void => {
    const line = callLinesShell.lines.find((entry) => entry.callId === callId);
    if (line === undefined) {
      return;
    }
    if (line.state === "Held") {
      callLinesActions.handleResumeLine(callId);
      return;
    }
    if (line.primaryAction === "answer") {
      callLinesActions.handleAnswerLine(callId);
    }
  };

  return (
    <div className={styles["zone"]} data-testid="call-context-zone">
      <MultiCallHoldAllIndicator visible={multiCallProjection.holdAllInProgress} />

      {isDtmfMode && dtmfLine !== null ? (
        <DtmfKeypadPanel
          displayName={dtmfLine.displayName}
          lastTone={callProjection.lastDtmfTone}
          onTone={bindings.callActions.handleSendDtmf}
          onClose={() => {
            setCallMode("number");
          }}
        />
      ) : null}

      {!isDtmfMode ? (
        <CallSessionStack
          shell={callLinesShell}
          onSelectLine={handleSelectLine}
          onHangupLine={callLinesActions.handleHangupLine}
        />
      ) : null}

      {!isDtmfMode && singleLine !== null ? (
        <div className={styles["singleCard"]}>
          <CallSessionCard line={singleLine} isActive />
        </div>
      ) : null}

      {showIdleState ? <CallIdleEmptyState /> : null}

      {showOutgoingCard && !isDtmfMode ? (
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
