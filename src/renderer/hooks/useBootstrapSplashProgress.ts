import { useEffect, useState } from "react";

type BootstrapStatus = "loading" | "ready" | "error";

const SETTLE_MS = 700;
const TICK_MS = 80;

export type BootstrapSplashProgress = Readonly<{
  /** Visual 0–100 progress for the splash bar. */
  progress: number;
  /** Keep splash mounted while settling after ready. */
  showSplash: boolean;
}>;

/**
 * Visual-only bootstrap progress: eases toward ~88% while loading,
 * then snaps to 100% and holds the splash briefly so the ball can settle.
 */
export function useBootstrapSplashProgress(status: BootstrapStatus): BootstrapSplashProgress {
  const [progress, setProgress] = useState(6);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (status === "error") {
      setShowSplash(true);
      return;
    }

    if (status === "loading") {
      setShowSplash(true);
      const startedAt = performance.now();
      const timerId = window.setInterval(() => {
        const elapsedSec = (performance.now() - startedAt) / 1000;
        // Asymptotic approach — never claims full completion until ready.
        const next = Math.min(88, 6 + 82 * (1 - Math.exp(-elapsedSec / 1.85)));
        setProgress(next);
      }, TICK_MS);

      return () => {
        window.clearInterval(timerId);
      };
    }

    setProgress(100);
    setShowSplash(true);
    const hideTimerId = window.setTimeout(() => {
      setShowSplash(false);
    }, SETTLE_MS);

    return () => {
      window.clearTimeout(hideTimerId);
    };
  }, [status]);

  return { progress, showSplash };
}
