import type { JSX } from "react";
import { useOperatorStatusTimer } from "../../hooks/useOperatorStatusTimer.js";
import styles from "./StatusTimer.module.css";

export type StatusTimerProps = Readonly<{
  statusChangedAt: string | null;
  timerRunning: boolean;
  currentStatus: string | null;
}>;

/**
 * - Purpose: display duration in current operator status (LF-046).
 * - Inputs: timer projection fields and current status for visibility.
 * - Outputs: formatted duration label or hidden when no active status.
 */
export function StatusTimer({
  statusChangedAt,
  timerRunning,
  currentStatus,
}: StatusTimerProps): JSX.Element | null {
  const { formattedDuration } = useOperatorStatusTimer({
    statusChangedAt,
    timerRunning,
  });

  if (currentStatus === null || formattedDuration === null) {
    return null;
  }

  return (
    <p
      className={styles["timer"]}
      data-testid="status-timer"
      role="status"
      aria-live="off"
      aria-label={`Время в статусе: ${formattedDuration}`}
    >
      В статусе: <strong>{formattedDuration}</strong>
    </p>
  );
}
