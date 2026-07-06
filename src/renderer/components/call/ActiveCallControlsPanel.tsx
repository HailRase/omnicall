import type { JSX } from "react";
import {
  mapActiveCallControlDisabledReason,
} from "../../helpers/mapActiveCallControlLabels.js";
import { useI18n } from "../../i18n/index.js";
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
  onHold: () => void;
  onResume: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onHangup: () => void;
  onTransfer: () => void;
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
  onHold,
  onResume,
  onMute,
  onUnmute,
  onHangup,
  onTransfer,
}: ActiveCallControlsPanelProps): JSX.Element | null {
  const { t } = useI18n();
  if (!visible) {
    return null;
  }

  return (
    <section
      className={styles.panel}
      data-testid="active-call-controls"
      aria-label={t("activeCall.panel.ariaLabel")}
    >
      <h2 className={styles.title}>{t("activeCall.panel.title")}</h2>
      <p data-testid="active-call-mute-indicator">
        <strong>{t("activeCall.panel.micLabel")}:</strong>{" "}
        {muted ? t("activeCall.panel.micOff") : t("activeCall.panel.micOn")}
      </p>
      <div className={styles.actions}>
        <IconControlButton
          iconId="call.hold"
          ariaLabel={t("call.controls.holdAria")}
          testId="control-hold"
          className={styles.iconButton}
          disabledReason={mapDisabledReason(holdDisabledReason)}
          onClick={onHold}
        />
        <IconControlButton
          iconId="call.resume"
          ariaLabel={t("call.controls.resumeAria")}
          testId="control-resume"
          className={styles.iconButton}
          disabledReason={mapDisabledReason(resumeDisabledReason)}
          onClick={onResume}
        />
        <IconControlButton
          iconId="call.mute"
          ariaLabel={t("icons.call.mute")}
          testId="control-mute"
          className={styles.iconButton}
          disabledReason={mapDisabledReason(muteDisabledReason)}
          onClick={onMute}
        />
        <IconControlButton
          iconId="call.unmute"
          ariaLabel={t("icons.call.unmute")}
          testId="control-unmute"
          className={styles.iconButton}
          disabledReason={mapDisabledReason(unmuteDisabledReason)}
          onClick={onUnmute}
        />
        <IconControlButton
          iconId="call.hangup"
          ariaLabel={t("icons.call.hangup")}
          testId="control-hangup"
          className={styles.iconButton}
          disabledReason={mapDisabledReason(hangupDisabledReason)}
          onClick={onHangup}
        />
        <IconControlButton
          iconId="call.transfer"
          ariaLabel={t("icons.call.transfer")}
          testId="control-transfer"
          className={styles.iconButton}
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
