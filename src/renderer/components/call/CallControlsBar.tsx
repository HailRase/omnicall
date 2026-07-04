import clsx from "clsx";
import type { JSX, MouseEvent } from "react";
import type {
  ActiveCallControlOperationError,
  CallLineCardViewModel,
} from "@application/index.js";
import {
  mapActiveCallControlOperationError,
} from "../../helpers/mapActiveCallControlLabels.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import type { IconSemanticId } from "../icons/iconCatalog.js";
import { IconControlButton } from "../icons/IconControlButton.js";
import { IconTooltip } from "../icons/IconTooltip.js";
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
  onShowNumberEntry: () => void;
  onRetryOperation: () => void;
}>;

type LabeledControlProps = Readonly<{
  iconId: IconSemanticId;
  label: string;
  ariaLabel: string;
  testId: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  resume?: boolean;
  danger?: boolean;
  muted?: boolean;
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
  onShowNumberEntry,
  onRetryOperation,
}: CallControlsBarProps): JSX.Element | null {
  const { t } = useI18n();
  const controllableStates = new Set(["Active", "Held", "Connecting", "Ringing"]);
  if (line === null || !controllableStates.has(line.state)) {
    return null;
  }

  const isPreConnect = line.state === "Connecting" || line.state === "Ringing";
  const isHeld = line.state === "Held";
  const showError = line.isActiveUnheld && lastOperationError !== null;
  const registrationBlocked = registrationDisabledReason !== null;

  const muteBlocked =
    isPreConnect ||
    registrationBlocked ||
    (line.muted ? line.unmuteDisabledReason : line.muteDisabledReason) !== null;
  const holdBlocked =
    isPreConnect ||
    registrationBlocked ||
    (isHeld ? line.resumeDisabledReason : line.holdDisabledReason) !== null;
  const transferBlocked =
    isPreConnect ||
    registrationBlocked ||
    !line.isActiveUnheld ||
    line.transferDisabledReason !== null;
  const dialBlocked = isPreConnect || registrationBlocked;
  const hangupBlocked =
    registrationBlocked || line.hangupDisabledReason !== null;

  return (
    <section
      className={styles.panel}
      data-testid="call-controls-bar"
      aria-label={t("call.controls.groupAria")}
    >
      <div className={styles.actions}>
        <LabeledControl
          iconId={line.muted ? "call.mute" : "call.unmute"}
          label={line.muted ? t("call.controls.label.muted") : t("call.controls.label.mic")}
          ariaLabel={line.muted ? t("icons.call.unmute") : t("icons.call.mute")}
          testId={line.muted ? `control-unmute-line-${line.callId}` : `control-mute-line-${line.callId}`}
          muted={line.muted}
          disabled={muteBlocked}
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
          label={isHeld ? t("call.controls.label.resume") : t("call.controls.label.hold")}
          ariaLabel={isHeld ? t("call.controls.resumeAria") : t("call.controls.holdAria")}
          testId={isHeld ? `control-resume-line-${line.callId}` : `control-hold-line-${line.callId}`}
          resume={isHeld}
          disabled={holdBlocked}
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
          label={t("call.controls.label.transfer")}
          ariaLabel={t("icons.call.transfer")}
          testId={`control-transfer-line-${line.callId}`}
          disabled={transferBlocked}
          onClick={() => {
            onTransfer(line.callId);
          }}
        />
        {line.isActiveUnheld ? (
          <LabeledControl
            iconId="dial.dtmf"
            label={t("call.controls.label.dtmf")}
            ariaLabel={t("call.controls.openDtmfAria")}
            testId="control-show-dtmf"
            disabled={dialBlocked}
            onClick={onShowDtmf}
          />
        ) : (
          <LabeledControl
            iconId="dial.dtmf"
            label={t("call.controls.label.numberEntry")}
            ariaLabel={t("call.controls.openNumberEntryAria")}
            testId="control-show-number-entry"
            disabled={dialBlocked}
            onClick={onShowNumberEntry}
          />
        )}
        <LabeledControl
          iconId="call.hangup"
          label={t("call.controls.label.hangup")}
          ariaLabel={t("call.controls.hangupLineAria", { displayName: line.displayName })}
          testId={`control-hangup-line-${line.callId}`}
          danger
          disabled={hangupBlocked}
          onClick={() => {
            onHangup(line.callId);
          }}
        />
      </div>
      {showError ? (
        <div
          className={styles.error}
          data-testid={`call-line-error-${line.callId}`}
          role="alert"
        >
          <p>{mapActiveCallControlOperationError(lastOperationError)}</p>
          <IconControlButton
            iconId="action.retry"
            ariaLabel={t("call.controls.retryOperationAria", {
              operation: lastOperationError.operation,
            })}
            tooltipLabel={t("common.retry")}
            testId={`control-retry-line-${line.callId}`}
            className={styles.retryButton}
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
  disabled = false,
  resume = false,
  danger = false,
  muted = false,
}: LabeledControlProps): JSX.Element {
  return (
    <div className={styles.control}>
      <IconTooltip label={label}>
        <button
          type="button"
          className={clsx(
            styles.button,
            resume && styles.buttonResume,
            muted && styles.buttonMuted,
            danger && styles.buttonDanger,
            disabled && styles.buttonDisabled,
          )}
          data-testid={testId}
          aria-label={ariaLabel}
          aria-pressed={resume || muted ? true : undefined}
          disabled={disabled}
          onClick={onClick}
        >
          <AppIcon id={iconId} size={18} decorative />
        </button>
      </IconTooltip>
      <span className={clsx(styles.caption, disabled && styles.captionDisabled)}>
        {label}
      </span>
    </div>
  );
}
