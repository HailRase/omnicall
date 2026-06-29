import clsx from "clsx";
import type { JSX } from "react";
import type {
  ActiveCallControlOperationError,
  CallLineCardViewModel,
} from "@application/index.js";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "../../helpers/mapActiveCallControlLabels.js";
import { mapTransferDisabledReason } from "../../helpers/mapTransferDisabledReason.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./ActiveCallQuickBar.module.css";

export type ActiveCallQuickBarProps = Readonly<{
  line: CallLineCardViewModel | null;
  lastOperationError: ActiveCallControlOperationError | null;
  onHold: (callId: string) => void;
  onMute: (callId: string) => void;
  onUnmute: (callId: string) => void;
  onHangup: (callId: string) => void;
  onTransfer: (callId: string) => void;
  onRetryOperation: () => void;
}>;

/**
 * - Purpose: compact icon toolbar for the active unheld call line.
 * - Inputs: active line view-model, operation error, and action callbacks.
 * - Outputs: minimal hold/mute/transfer/hangup controls or null.
 * @uiMeta lf=LF-022,LF-023 f=F-004,F-016 smoke=R7-*
 */
export function ActiveCallQuickBar({
  line,
  lastOperationError,
  onHold,
  onMute,
  onUnmute,
  onHangup,
  onTransfer,
  onRetryOperation,
}: ActiveCallQuickBarProps): JSX.Element | null {
  if (line === null || !line.isActiveUnheld || !line.showIconRow) {
    return null;
  }

  const showError = lastOperationError !== null;

  return (
    <div className={styles["bar"]} data-testid="active-call-quick-bar" aria-label="Управление звонком">
      <div className={styles["actions"]}>
        <IconControlButton
          iconId="call.hold"
          ariaLabel="Удержать звонок"
          testId={`control-hold-line-${line.callId}`}
          className={styles["iconButton"]}
          disabledReason={mapControlReason(line.holdDisabledReason)}
          onClick={() => {
            onHold(line.callId);
          }}
        />
        <IconControlButton
          iconId={line.muted ? "call.mute" : "call.unmute"}
          ariaLabel={line.muted ? "Включить микрофон" : "Отключить микрофон"}
          testId={
            line.muted
              ? `control-unmute-line-${line.callId}`
              : `control-mute-line-${line.callId}`
          }
          className={styles["iconButton"]}
          disabledReason={mapControlReason(
            line.muted ? line.unmuteDisabledReason : line.muteDisabledReason,
          )}
          onClick={() => {
            if (line.muted) {
              onUnmute(line.callId);
            } else {
              onMute(line.callId);
            }
          }}
        />
        <IconControlButton
          iconId="call.transfer"
          ariaLabel="Перевести звонок"
          testId={`control-transfer-line-${line.callId}`}
          className={styles["iconButton"]}
          disabledReason={
            line.transferDisabledReason === null
              ? null
              : mapTransferDisabledReason(line.transferDisabledReason)
          }
          onClick={() => {
            onTransfer(line.callId);
          }}
        />
        <IconControlButton
          iconId="call.hangup"
          ariaLabel={`Завершить звонок ${line.displayName}`}
          testId={`control-hangup-line-${line.callId}`}
          className={clsx(styles["iconButton"], styles["hangupButton"])}
          disabledReason={line.hangupDisabledReason}
          onClick={() => {
            onHangup(line.callId);
          }}
        />
      </div>
      {showError ? (
        <div
          className={styles["error"]}
          data-testid={`call-line-error-${line.callId}`}
          role="alert"
        >
          <p>{mapActiveCallControlOperationError(lastOperationError)}</p>
          <IconControlButton
            iconId="action.retry"
            ariaLabel={`Повторить ${lastOperationError.operation}`}
            tooltipLabel="Повторить"
            testId={`control-retry-line-${line.callId}`}
            className={styles["iconButton"]}
            onClick={onRetryOperation}
          />
        </div>
      ) : null}
    </div>
  );
}

function mapControlReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  return mapActiveCallControlDisabledReason(reason);
}
