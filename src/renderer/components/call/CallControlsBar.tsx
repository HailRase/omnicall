import clsx from "clsx";
import type { JSX, MouseEvent } from "react";
import type {
  ActiveCallControlOperationError,
  CallLineCardViewModel,
} from "@application/index.js";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "../../helpers/mapActiveCallControlLabels.js";
import { mapTransferDisabledReason } from "../../helpers/mapTransferDisabledReason.js";
import { AppIcon } from "../icons/AppIcon.js";
import type { IconSemanticId } from "../icons/iconCatalog.js";
import { IconControlButton } from "../icons/IconControlButton.js";
import styles from "./CallControlsBar.module.css";

export type CallControlsBarProps = Readonly<{
  line: CallLineCardViewModel | null;
  lastOperationError: ActiveCallControlOperationError | null;
  registrationDisabledReason?: string | null;
  onHold: (callId: string) => void;
  onResume: (callId: string) => void;
  onMute: (callId: string) => void;
  onUnmute: (callId: string) => void;
  onHangup: (callId: string) => void;
  onTransfer: (callId: string) => void;
  onShowDtmf: () => void;
  onRetryOperation: () => void;
}>;

type LabeledControlProps = Readonly<{
  iconId: IconSemanticId;
  label: string;
  ariaLabel: string;
  testId: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  danger?: boolean;
  disabledReason?: string | null;
}>;

/**
 * - Purpose: labeled call control row matching reference CallControls layout.
 * - Inputs: active/held line view-model, operation error, action callbacks.
 * - Outputs: mute, hold/resume, transfer, DTMF, hangup with visible captions.
 * @uiMeta lf=LF-022,LF-023 f=F-004,F-016 smoke=R7-*
 */
export function CallControlsBar({
  line,
  lastOperationError,
  registrationDisabledReason = null,
  onHold,
  onResume,
  onMute,
  onUnmute,
  onHangup,
  onTransfer,
  onShowDtmf,
  onRetryOperation,
}: CallControlsBarProps): JSX.Element | null {
  if (line === null || (line.state !== "Active" && line.state !== "Held")) {
    return null;
  }

  const isHeld = line.state === "Held";
  const canControl = line.state === "Active" || isHeld;
  const showError = line.isActiveUnheld && lastOperationError !== null;

  return (
    <section
      className={styles["panel"]}
      data-testid="call-controls-bar"
      aria-label="Управление звонком"
    >
      <div className={styles["actions"]}>
        <LabeledControl
          iconId={line.muted ? "call.unmute" : "call.mute"}
          label={line.muted ? "Вкл. микрофон" : "Выкл. микрофон"}
          ariaLabel={line.muted ? "Включить микрофон" : "Отключить микрофон"}
          testId={line.muted ? `control-unmute-line-${line.callId}` : `control-mute-line-${line.callId}`}
          active={line.muted}
          disabledReason={withRegistrationGate(
            mapControlReason(
              line.muted ? line.unmuteDisabledReason : line.muteDisabledReason,
              canControl ? null : "Нет актив. звонка",
            ),
            registrationDisabledReason,
          )}
          onClick={() => {
            if (line.muted) {
              onUnmute(line.callId);
            } else {
              onMute(line.callId);
            }
          }}
        />
        <LabeledControl
          iconId={isHeld ? "call.resume" : "call.hold"}
          label={isHeld ? "Продолжить" : "Удержание"}
          ariaLabel={isHeld ? "Возобновить звонок" : "Удержать звонок"}
          testId={isHeld ? `control-resume-line-${line.callId}` : `control-hold-line-${line.callId}`}
          active={isHeld}
          disabledReason={withRegistrationGate(
            mapControlReason(
              isHeld ? line.resumeDisabledReason : line.holdDisabledReason,
              canControl ? null : "Нет актив. звонка",
            ),
            registrationDisabledReason,
          )}
          onClick={() => {
            if (isHeld) {
              onResume(line.callId);
            } else {
              onHold(line.callId);
            }
          }}
        />
        <LabeledControl
          iconId="call.transfer"
          label="Перевод"
          ariaLabel="Перевести звонок"
          testId={`control-transfer-line-${line.callId}`}
          disabledReason={withRegistrationGate(
            !line.isActiveUnheld
              ? "Нет актив. звонка"
              : line.transferDisabledReason === null
                ? null
                : mapTransferDisabledReason(line.transferDisabledReason),
            registrationDisabledReason,
          )}
          onClick={() => {
            onTransfer(line.callId);
          }}
        />
        <LabeledControl
          iconId="dial.dtmf"
          label="Тоновый набор"
          ariaLabel="Открыть тоновый набор"
          testId="control-show-dtmf"
          disabledReason={withRegistrationGate(
            line.isActiveUnheld ? null : "Нет актив. звонка",
            registrationDisabledReason,
          )}
          onClick={onShowDtmf}
        />
        <LabeledControl
          iconId="call.hangup"
          label="Завершить"
          ariaLabel={`Завершить звонок ${line.displayName}`}
          testId={`control-hangup-line-${line.callId}`}
          danger
          disabledReason={
            line.hangupDisabledReason === null
              ? null
              : mapActiveCallControlDisabledReason(line.hangupDisabledReason)
          }
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
            className={styles["retryButton"]}
            onClick={onRetryOperation}
          />
        </div>
      ) : null}
    </section>
  );
}

function LabeledControl({
  iconId,
  label,
  ariaLabel,
  testId,
  onClick,
  active = false,
  danger = false,
  disabledReason = null,
}: LabeledControlProps): JSX.Element {
  const isDisabled = disabledReason !== null;

  return (
    <div className={styles["control"]}>
      <button
        type="button"
        className={clsx(
          styles["button"],
          active && styles["buttonActive"],
          danger && styles["buttonDanger"],
          isDisabled && styles["buttonDisabled"],
        )}
        data-testid={testId}
        aria-label={ariaLabel}
        disabled={isDisabled}
        title={isDisabled && disabledReason ? disabledReason : label}
        onClick={onClick}
      >
        <AppIcon id={iconId} size={18} decorative />
      </button>
      <span className={clsx(styles["caption"], isDisabled && styles["captionDisabled"])}>
        {label}
      </span>
      {isDisabled && disabledReason ? (
        <span className={styles["reason"]} role="status">
          {disabledReason}
        </span>
      ) : null}
    </div>
  );
}

function mapControlReason(
  projectionReason: string | null,
  fallback: string | null,
): string | null {
  if (projectionReason !== null) {
    return mapActiveCallControlDisabledReason(projectionReason);
  }
  return fallback;
}

function withRegistrationGate(
  reason: string | null,
  registrationDisabledReason: string | null,
): string | null {
  if (registrationDisabledReason !== null) {
    return registrationDisabledReason;
  }
  return reason;
}
