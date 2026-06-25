import type { JSX } from "react";
import type { ActiveCallControlOperationError } from "@application/index.js";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "../../helpers/mapActiveCallControlLabels.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./ActiveCallControlsPanel.module.css";

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
      className={styles["panel"]}
      data-testid="active-call-controls"
      aria-label="Active call controls"
    >
      <h2 className={styles["title"]}>Active Call Controls</h2>
      <p data-testid="active-call-mute-indicator">
        <strong>Microphone:</strong> {muted ? "Muted" : "Unmuted"}
      </p>
      {lastOperationError !== null && (
        <div
          className={styles["error"]}
          data-testid="active-call-control-error"
          role="alert"
        >
          <p className={styles["errorMessage"]}>
            {mapActiveCallControlOperationError(lastOperationError)}
          </p>
          <IconControlButton
            iconId="action.retry"
            ariaLabel={`Retry ${lastOperationError.operation}`}
            tooltipLabel="Retry"
            testId="control-retry"
            className={styles["iconButton"]}
            onClick={onRetry}
          />
        </div>
      )}
      <div className={styles["actions"]}>
        <IconControlButton
          iconId="call.hold"
          ariaLabel="Hold call"
          testId="control-hold"
          className={styles["iconButton"]}
          disabledReason={mapDisabledReason(holdDisabledReason)}
          onClick={onHold}
        />
        <IconControlButton
          iconId="call.resume"
          ariaLabel="Resume call"
          testId="control-resume"
          className={styles["iconButton"]}
          disabledReason={mapDisabledReason(resumeDisabledReason)}
          onClick={onResume}
        />
        <IconControlButton
          iconId="call.mute"
          ariaLabel="Mute microphone"
          testId="control-mute"
          className={styles["iconButton"]}
          disabledReason={mapDisabledReason(muteDisabledReason)}
          onClick={onMute}
        />
        <IconControlButton
          iconId="call.unmute"
          ariaLabel="Unmute microphone"
          testId="control-unmute"
          className={styles["iconButton"]}
          disabledReason={mapDisabledReason(unmuteDisabledReason)}
          onClick={onUnmute}
        />
        <IconControlButton
          iconId="call.hangup"
          ariaLabel="Hang up call"
          testId="control-hangup"
          className={styles["iconButton"]}
          disabledReason={mapDisabledReason(hangupDisabledReason)}
          onClick={onHangup}
        />
        <IconControlButton
          iconId="call.transfer"
          ariaLabel="Transfer call"
          testId="control-transfer"
          className={styles["iconButton"]}
          disabledReason={mapDisabledReason(transferDisabledReason)}
          onClick={onTransfer}
        />
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

function mapDisabledReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  return mapActiveCallControlDisabledReason(reason);
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
