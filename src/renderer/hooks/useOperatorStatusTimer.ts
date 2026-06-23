import { useEffect, useState } from "react";
import { deriveStatusDurationSeconds } from "@application/index.js";

type UseOperatorStatusTimerInput = Readonly<{
  statusChangedAt: string | null;
  timerRunning: boolean;
}>;

type UseOperatorStatusTimerResult = Readonly<{
  durationSeconds: number | null;
  formattedDuration: string | null;
}>;

/**
 * - Purpose: tick status duration for operator status timer UI (LF-046).
 * - Inputs: statusChangedAt and timerRunning from operator status projection.
 * - Outputs: elapsed seconds and formatted mm:ss or hh:mm:ss display string.
 */
export function useOperatorStatusTimer(
  input: UseOperatorStatusTimerInput,
): UseOperatorStatusTimerResult {
  const { statusChangedAt, timerRunning } = input;
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!timerRunning || statusChangedAt === null) {
      setDurationSeconds(null);
      return;
    }

    const tick = (): void => {
      setDurationSeconds(
        deriveStatusDurationSeconds(statusChangedAt, new Date().toISOString()),
      );
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [statusChangedAt, timerRunning]);

  return {
    durationSeconds,
    formattedDuration:
      durationSeconds === null ? null : formatDuration(durationSeconds),
  };
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
