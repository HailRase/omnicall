import { useEffect, useState } from "react";

export type CallDurationFormat = "compact" | "hh:mm:ss";

/**
 * - Purpose: format elapsed duration for call lines or OCP status timer.
 * - Inputs: active-since timestamp in milliseconds or null; optional display format.
 * - Outputs: compact mm:ss / h:mm:ss, or always-padded hh:mm:ss, updated every second.
 */
export function useCallDuration(
  startedAtMs: number | null,
  format: CallDurationFormat = "compact",
): string {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (startedAtMs === null) {
      return;
    }
    setNowMs(Date.now());
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [startedAtMs]);

  if (startedAtMs === null) {
    return "";
  }

  return formatDuration(Math.max(0, nowMs - startedAtMs), format);
}

function formatDuration(elapsedMs: number, format: CallDurationFormat): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (format === "hh:mm:ss") {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
