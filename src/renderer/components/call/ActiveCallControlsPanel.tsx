import type { JSX } from "react";
import type { ActiveCallControlOperationError } from "@application/index.js";

export type ActiveCallControlsPanelProps = Readonly<{
  visible: boolean;
  muted: boolean;
  holdDisabledReason: string | null;
  resumeDisabledReason: string | null;
  muteDisabledReason: string | null;
  unmuteDisabledReason: string | null;
  hangupDisabledReason: string | null;
  lastOperationError: ActiveCallControlOperationError | null;
  onHold: () => void;
  onResume: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onHangup: () => void;
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
  lastOperationError,
  onHold,
  onResume,
  onMute,
  onUnmute,
  onHangup,
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
          <p>{mapOperationError(lastOperationError)}</p>
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
      </div>
      {renderDisabledReason(
        holdDisabledReason,
        resumeDisabledReason,
        muteDisabledReason,
        unmuteDisabledReason,
        hangupDisabledReason,
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
): JSX.Element | null {
  const reason =
    holdDisabledReason ??
    resumeDisabledReason ??
    muteDisabledReason ??
    unmuteDisabledReason ??
    hangupDisabledReason;

  if (reason === null) {
    return null;
  }

  return (
    <p data-testid="control-disabled-reason" role="status">
      {mapControlReason(reason)}
    </p>
  );
}

function mapOperationError(error: ActiveCallControlOperationError): string {
  const label = mapOperationLabel(error.operation);
  return `${label} failed: ${error.message}`;
}

function mapOperationLabel(operation: ActiveCallControlOperationError["operation"]): string {
  switch (operation) {
    case "hold":
      return "Hold";
    case "resume":
      return "Resume";
    case "mute":
      return "Mute";
    case "unmute":
      return "Unmute";
    case "hangup":
      return "Hang up";
  }
}

function mapControlReason(reason: string): string {
  switch (reason) {
    case "no_active_call":
      return "No active call";
    case "call_ending":
      return "Call ending";
    case "hold_requires_active":
      return "Hold requires active call";
    case "resume_requires_held":
      return "Resume requires held call";
    case "mute_requires_active_or_held":
      return "Mute requires active or held call";
    case "already_muted":
      return "Call already muted";
    case "not_muted":
      return "Call is not muted";
    case "hangup_not_allowed":
      return "Hang up is not allowed";
    default:
      return "Action unavailable";
  }
}
