import { useEffect, useState } from "react";
import type { SipSessionHealthProjection } from "@application/index.js";

const TICK_INTERVAL_MS = 1000;

/**
 * - Purpose: per-second clock tick for SIP recovery countdown suffixes in UI.
 * - Inputs: session health read model with optional nextRetryAt timestamp.
 * - Outputs: current epoch milliseconds for projection derivations.
 */
export function useSipRecoveryCountdownTick(health: SipSessionHealthProjection): number {
  const [tickMs, setTickMs] = useState(() => Date.now());
  const nextRetryAt = health.recovery.nextRetryAt;

  useEffect(() => {
    setTickMs(Date.now());

    if (nextRetryAt === null) {
      return;
    }

    const interval = setInterval(() => {
      setTickMs(Date.now());
    }, TICK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [nextRetryAt]);

  return tickMs;
}
