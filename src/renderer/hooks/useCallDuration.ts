import { useEffect, useState } from "react";

/**
 * - Purpose: format elapsed call duration for line row display.
 * - Inputs: active-since timestamp in milliseconds or null.
 * - Outputs: mm:ss or h:mm:ss label updated every second.
 */
export function useCallDuration(startedAtMs: number | null): string {
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

  return formatDuration(Math.max(0, nowMs - startedAtMs));
}

function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
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
