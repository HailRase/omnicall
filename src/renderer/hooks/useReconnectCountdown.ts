import { useEffect, useState } from "react";
import type { ConnectionState } from "@application/index.js";

const TICK_INTERVAL_MS = 1000;

/**
 * - Purpose: per-second countdown tick for reconnect overlay (LF-057).
 * - Inputs: nextRetryAt ISO timestamp, connection state.
 * - Outputs: seconds remaining until next retry, or null when inactive.
 */
export function useReconnectCountdown(
  nextRetryAt: string | null,
  connectionState: ConnectionState,
): number | null {
  const [tickMs, setTickMs] = useState(() => Date.now());

  useEffect(() => {
    setTickMs(Date.now());

    if (connectionState !== "reconnecting" || nextRetryAt === null) {
      return;
    }

    const targetMs = Date.parse(nextRetryAt);
    if (Number.isNaN(targetMs)) {
      return;
    }

    const interval = setInterval(() => {
      setTickMs(Date.now());
    }, TICK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [connectionState, nextRetryAt]);

  if (connectionState !== "reconnecting" || nextRetryAt === null) {
    return null;
  }

  const targetMs = Date.parse(nextRetryAt);
  if (Number.isNaN(targetMs)) {
    return null;
  }

  const remainingSeconds = Math.ceil((targetMs - tickMs) / 1000);
  if (remainingSeconds <= 0) {
    return null;
  }
  return remainingSeconds;
}
