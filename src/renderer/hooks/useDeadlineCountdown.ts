import { useEffect, useState } from "react";
import { deriveSecondsRemainingUntil } from "@shared/integration/formatMmSsCountdown.js";

const TICK_INTERVAL_MS = 1000;

/**
 * Per-second countdown until an ISO deadline for operator modal headers.
 * Returns null when inactive / no deadline; never negative.
 */
export function useDeadlineCountdown(
  expiresAt: string | null | undefined,
  active = true,
): number | null {
  const [tickMs, setTickMs] = useState(() => Date.now());

  useEffect(() => {
    setTickMs(Date.now());
    if (!active || expiresAt === undefined || expiresAt === null) {
      return;
    }
    const interval = setInterval(() => {
      setTickMs(Date.now());
    }, TICK_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, [active, expiresAt]);

  if (!active || expiresAt === undefined || expiresAt === null) {
    return null;
  }

  return deriveSecondsRemainingUntil(expiresAt, tickMs);
}
