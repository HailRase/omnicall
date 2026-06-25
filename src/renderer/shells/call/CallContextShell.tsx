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

  const { callProjection, multiCallProjection, callLinesShell, callLinesActions } = bindings;

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
        onResumeLine={callLinesActions.handleResumeLine}
        onHangupLine={callLinesActions.handleHangupLine}
      />

      <OutgoingCallCard
        callId={callProjection.activeCallId}
        callState={callProjection.state}
        numberValue={bindings.dialedNumber}
        lastError={callProjection.lastError}
        lastDtmfTone={callProjection.lastDtmfTone}
        uiState={callProjection.uiState}
        toneIndicator={callProjection.toneIndicator}
      />
    </div>
  );
}
