import clsx from "clsx";
import type { AvatarRecoveryOverlayMode } from "@application/index.js";
import type { JSX, ReactNode } from "react";
import { IconControlButton } from "../icons/index.js";
import styles from "./AvatarRecoveryRing.module.css";

export type AvatarRecoveryRingTone = "failed";

export type AvatarRecoveryRingProps = Readonly<{
  visible: boolean;
  tone: AvatarRecoveryRingTone | null;
  overlayMode: AvatarRecoveryOverlayMode;
  countdownSeconds: number | null;
  reloadDisabledReason?: string | null;
  onReload?: () => void;
  children: ReactNode;
}>;

/**
 * - Purpose: compact SIP registration recovery UI on header avatar (LF-009).
 * - Inputs: visibility, tone, overlay mode, countdown, reload handler, avatar children.
 * - Outputs: blurred avatar overlay with countdown or reload; no attempt labels.
 * @uiMeta lf=LF-009,LF-011 f=F-016 smoke=R7-*
 */
export function AvatarRecoveryRing({
  visible,
  tone,
  overlayMode,
  countdownSeconds,
  reloadDisabledReason = null,
  onReload,
  children,
}: AvatarRecoveryRingProps): JSX.Element {
  const showCountdown =
    visible && overlayMode === "countdown" && countdownSeconds !== null && countdownSeconds > 0;
  const showReload = visible && overlayMode === "reload";
  const showBlur = showCountdown || showReload;
  const showPulse = visible && overlayMode === "in_progress";
  const showRing = visible && tone !== null;
  const ariaLabel = resolveAriaLabel(showCountdown, countdownSeconds, showPulse, showRing, showReload);

  return (
    <div
      className={clsx(styles["host"], visible && styles["hostVisible"])}
      data-testid="avatar-recovery-ring"
      data-visible={visible ? "true" : "false"}
      data-tone={tone ?? "none"}
      data-overlay={overlayMode ?? "none"}
    >
      <div className={styles["avatarWrap"]} aria-label={ariaLabel}>
        <div
          className={clsx(
            styles["ring"],
            showRing && tone === "failed" && styles["ringFailed"],
            showPulse && styles["ringPulse"],
          )}
          aria-hidden="true"
        />
        <div className={styles["content"]}>
          <div className={clsx(styles["avatarContent"], showBlur && styles["avatarContentBlurred"])}>
            {children}
          </div>
          {showBlur ? (
            <div className={styles["overlayScrim"]} aria-hidden="true" />
          ) : null}
          {showCountdown && countdownSeconds !== null ? (
            <span
              className={styles["countdownOverlay"]}
              data-testid="avatar-recovery-countdown"
              aria-live="polite"
            >
              {formatCountdownSeconds(countdownSeconds)}
            </span>
          ) : null}
          {showReload ? (
            <IconControlButton
              iconId="sip.reregister"
              ariaLabel="Перерегистрация SIP"
              testId="avatar-recovery-reload"
              className={styles["reloadButton"]}
              disabledReason={reloadDisabledReason}
              onClick={() => {
                onReload?.();
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatCountdownSeconds(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }
  return String(seconds);
}

function resolveAriaLabel(
  showCountdown: boolean,
  countdownSeconds: number | null,
  showPulse: boolean,
  showRing: boolean,
  showReload: boolean,
): string | undefined {
  if (showCountdown && countdownSeconds !== null) {
    return `Перерегистрация, осталось ${countdownSeconds} секунд`;
  }
  if (showReload) {
    return "Ошибка регистрации SIP. Нажмите для перерегистрации";
  }
  if (showPulse) {
    return "Перерегистрация выполняется";
  }
  if (showRing) {
    return "Ошибка регистрации SIP";
  }
  return undefined;
}
