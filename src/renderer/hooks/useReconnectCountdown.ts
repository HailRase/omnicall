import { useEffect, useState } from "react";
import type { ConnectionState } from "@application/index.js";

/**
 * - Purpose: one-shot countdown tick for reconnect overlay (LF-057).
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

    const remainingMs = targetMs - Date.now();
    if (remainingMs <= 0) {
      setTickMs(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      setTickMs(Date.now());
    }, remainingMs);

    return () => {
      clearTimeout(timer);
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
  return Math.max(0, remainingSeconds);
}
