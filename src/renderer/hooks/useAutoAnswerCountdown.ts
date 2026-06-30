import { useEffect, useState } from "react";
import { deriveAutoAnswerSecondsRemaining } from "@application/index.js";

const TICK_INTERVAL_MS = 1000;

/**
 * - Purpose: per-second auto-answer countdown tick for incoming call UI.
 * - Inputs: expiry ISO timestamp and active countdown flag from projection.
 * - Outputs: seconds remaining until auto-answer, or null when inactive.
 */
export function useAutoAnswerCountdown(
  expiresAt: string | null,
  active: boolean,
): number | null {
  const [tickMs, setTickMs] = useState(() => Date.now());

  useEffect(() => {
    setTickMs(Date.now());

    if (!active || expiresAt === null) {
      return;
    }

    const interval = setInterval(() => {
      setTickMs(Date.now());
    }, TICK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [active, expiresAt]);

  if (!active || expiresAt === null) {
    return null;
  }

  return deriveAutoAnswerSecondsRemaining(expiresAt, tickMs);
}
