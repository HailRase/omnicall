import type { JSX } from "react";
import type { ActiveCallControlOperationError } from "@application/index.js";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "../../helpers/mapActiveCallControlLabels.js";

export type ActiveCallControlsPanelProps = Readonly<{
  visible: boolean;
  muted: boolean;
  holdDisabledReason: string | null;
  resumeDisabledReason: string | null;
  muteDisabledReason: string | null;
  unmuteDisabledReason: string | null;
  hangupDisabledReason: string | null;
  transferDisabledReason: string | null;
  lastOperationError: ActiveCallControlOperationError | null;
  onHold: () => void;
  onResume: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onHangup: () => void;
  onTransfer: () => void;
  onRetry: () => void;
}>;

/**
 * - Purpose: render presentational active call controls and disabled reasons.
 * - Inputs: projection flags, disabled reasons, and action callbacks.
 * - Outputs: accessible control panel UI without business logic.
 */
export function ActiveCallControlsPanel({
  visible,
  muted,
  holdDisabledReason,
  resumeDisabledReason,
  muteDisabledReason,
  unmuteDisabledReason,
  hangupDisabledReason,
  transferDisabledReason,
  lastOperationError,
  onHold,
  onResume,
  onMute,
  onUnmute,
  onHangup,
  onTransfer,
  onRetry,
}: ActiveCallControlsPanelProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <section
      className="active-call-controls"
      data-testid="active-call-controls"
      aria-label="Active call controls"
    >
      <h2>Active Call Controls</h2>
      <p data-testid="active-call-mute-indicator">
        <strong>Microphone:</strong> {muted ? "Muted" : "Unmuted"}
      </p>
      {lastOperationError !== null && (
        <div
          className="active-call-controls__error"
          data-testid="active-call-control-error"
          role="alert"
        >
          <p>{mapActiveCallControlOperationError(lastOperationError)}</p>
          <button
            type="button"
            data-testid="control-retry"
            aria-label={`Retry ${lastOperationError.operation}`}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}
      <div className="active-call-controls__actions">
        <button
          type="button"
          data-testid="control-hold"
          aria-label="Hold call"
          disabled={holdDisabledReason !== null}
          onClick={onHold}
        >
          Hold
        </button>
        <button
          type="button"
          data-testid="control-resume"
          aria-label="Resume call"
          disabled={resumeDisabledReason !== null}
          onClick={onResume}
        >
          Resume
        </button>
        <button
          type="button"
          data-testid="control-mute"
          aria-label="Mute microphone"
          disabled={muteDisabledReason !== null}
          onClick={onMute}
        >
          Mute
        </button>
        <button
          type="button"
          data-testid="control-unmute"
          aria-label="Unmute microphone"
          disabled={unmuteDisabledReason !== null}
          onClick={onUnmute}
        >
          Unmute
        </button>
        <button
          type="button"
          data-testid="control-hangup"
          aria-label="Hang up call"
          disabled={hangupDisabledReason !== null}
          onClick={onHangup}
        >
          Hang up
        </button>
        <button
          type="button"
          data-testid="control-transfer"
          aria-label="Transfer call"
          disabled={transferDisabledReason !== null}
          onClick={onTransfer}
        >
          Transfer
        </button>
      </div>
      {renderDisabledReason(
        holdDisabledReason,
        resumeDisabledReason,
        muteDisabledReason,
        unmuteDisabledReason,
        hangupDisabledReason,
        transferDisabledReason,
      )}
    </section>
  );
}

function renderDisabledReason(
  holdDisabledReason: string | null,
  resumeDisabledReason: string | null,
  muteDisabledReason: string | null,
  unmuteDisabledReason: string | null,
  hangupDisabledReason: string | null,
  transferDisabledReason: string | null,
): JSX.Element | null {
  const reason =
    holdDisabledReason ??
    resumeDisabledReason ??
    muteDisabledReason ??
    unmuteDisabledReason ??
    hangupDisabledReason ??
    transferDisabledReason;

  if (reason === null) {
    return null;
  }

  return (
    <p data-testid="control-disabled-reason" role="status">
      {mapActiveCallControlDisabledReason(reason)}
    </p>
  );
}

