import type { JSX } from "react";
import { MultiCallHoldAllIndicator } from "../../components/call/MultiCallHoldAllIndicator.js";
import { CallLinesShell } from "../../components/call/CallLinesShell.js";
import { OutgoingCallCard } from "../../components/call/OutgoingCallCard.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";

type CallContextShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render call context zone (lines, outgoing card, policy indicators).
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: context zone markup; stays mounted when settings overlay opens.
 */
export function CallContextShell({ bindings }: CallContextShellProps): JSX.Element | null {
  if (!bindings.sipRegistered) {
    return null;
  }

  const {
    callProjection,
    multiCallProjection,
    activeCallControlsProjection,
    callLinesShell,
    callLinesActions,
    callActions,
    handleTransferLine,
  } = bindings;

  const hasLineForActiveCall =
    callProjection.activeCallId !== null &&
    callLinesShell.lines.some((line) => line.callId === callProjection.activeCallId);

  const showOutgoingCard =
    callProjection.lastError !== null ||
    ((callProjection.state === "Connecting" || callProjection.state === "Failed") &&
      !hasLineForActiveCall);

  return (
    <div className="call-context-zone" data-testid="call-context-zone">
      {import.meta.env.DEV && (
        <p className="shell__hint" data-testid="sip-registered-hint">
          SIP account is registered via mock gateway (P01-P02 foundation).
        </p>
      )}

      <MultiCallHoldAllIndicator visible={multiCallProjection.holdAllInProgress} />

      <CallLinesShell
        shell={callLinesShell}
        lastOperationError={activeCallControlsProjection.lastOperationError}
        onResumeLine={callLinesActions.handleResumeLine}
        onHangupLine={callLinesActions.handleHangupLine}
        onHoldLine={callLinesActions.handleHoldLine}
        onMuteLine={callLinesActions.handleMuteLine}
        onUnmuteLine={callLinesActions.handleUnmuteLine}
        onTransferLine={handleTransferLine}
        onAnswerLine={callLinesActions.handleAnswerLine}
        onRetryOperation={callActions.handleRetryLastOperation}
      />

      {showOutgoingCard ? (
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
