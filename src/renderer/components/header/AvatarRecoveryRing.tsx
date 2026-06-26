import clsx from "clsx";
import type { JSX, ReactNode } from "react";
import styles from "./AvatarRecoveryRing.module.css";

export type AvatarRecoveryRingProps = Readonly<{
  visible: boolean;
  countdownSeconds: number | null;
  inProgress: boolean;
  children: ReactNode;
}>;

/**
 * - Purpose: compact SIP re-registration countdown around header avatar (LF-009).
 * - Inputs: visibility flag, countdown seconds, in-progress without countdown.
 * - Outputs: minimal animated ring with optional timer, no visible labels.
 * @uiMeta lf=LF-009,LF-011 f=F-016 smoke=R7-*
 */
export function AvatarRecoveryRing({
  visible,
  countdownSeconds,
  inProgress,
  children,
}: AvatarRecoveryRingProps): JSX.Element {
  const showCountdown = visible && countdownSeconds !== null && countdownSeconds > 0;
  const showPulse = visible && inProgress && !showCountdown;
  const ariaLabel = resolveAriaLabel(showCountdown, countdownSeconds, showPulse);

  return (
    <div
      className={clsx(styles["host"], visible && styles["hostVisible"])}
      data-testid="avatar-recovery-ring"
      data-visible={visible ? "true" : "false"}
    >
      <div
        className={clsx(
          styles["ring"],
          showCountdown && styles["ringCountdown"],
          showPulse && styles["ringPulse"],
        )}
        aria-hidden="true"
      />
      {showCountdown && countdownSeconds !== null ? (
        <span
          className={styles["countdown"]}
          data-testid="avatar-recovery-countdown"
          aria-live="polite"
        >
          {formatCountdownSeconds(countdownSeconds)}
        </span>
      ) : null}
      <div className={styles["content"]} aria-label={ariaLabel}>
        {children}
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
): string | undefined {
  if (showCountdown && countdownSeconds !== null) {
    return `Перерегистрация, осталось ${countdownSeconds} секунд`;
  }
  if (showPulse) {
    return "Перерегистрация выполняется";
  }
  return undefined;
}
