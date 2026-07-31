import { useEffect, useRef, useState } from "react";
import { BOOTSTRAP_SPLASH_MIN_VISIBLE_MS } from "@shared/platform/startupSplashColors.js";

type BootstrapStatus = "loading" | "ready" | "error";

/** Hold after progress hits 100% so the ball can settle before exit crossfade. */
export const BOOT_SPLASH_PROGRESS_SETTLE_MS = 700;
/** Visual bar only — keep below bounce jank; CSS indicator already eases ~180ms. */
const TICK_MS = 160;
/** Cap while waiting for ready and/or min dwell — never claim completion early. */
const PROGRESS_CAP_UNTIL_SETTLE = 88;

export type BootstrapSplashProgress = Readonly<{
  /** Visual 0–100 progress for the splash bar. */
  progress: number;
  /** Keep splash mounted while settling after ready (+ min dwell). */
  showSplash: boolean;
}>;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function nextAsymptoticProgress(startedAtMs: number, nowMs: number): number {
  const elapsedSec = (nowMs - startedAtMs) / 1000;
  return Math.min(
    PROGRESS_CAP_UNTIL_SETTLE,
    Math.round(6 + 82 * (1 - Math.exp(-elapsedSec / 1.85))),
  );
}

/**
 * Visual-only bootstrap progress: eases toward ~88% while loading (and during
 * min dwell after ready), then snaps to 100% and holds so the ball can settle.
 * Does not gate or delay account bootstrap — only splash hide timing.
 */
export function useBootstrapSplashProgress(status: BootstrapStatus): BootstrapSplashProgress {
  const [progress, setProgress] = useState(6);
  const [showSplash, setShowSplash] = useState(true);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now();
    }
    const startedAt = startedAtRef.current;

    if (status === "error") {
      setShowSplash(true);
      return;
    }

    const startAsymptoteTicks = (): number =>
      window.setInterval(() => {
        const next = nextAsymptoticProgress(startedAt, performance.now());
        setProgress((prev) => (prev === next ? prev : next));
      }, TICK_MS);

    if (status === "loading") {
      setShowSplash(true);
      const timerId = startAsymptoteTicks();
      return () => {
        window.clearInterval(timerId);
      };
    }

    // status === "ready" — wait out remaining min dwell, then settle to 100%.
    setShowSplash(true);
    const minVisibleMs = prefersReducedMotion() ? 0 : BOOTSTRAP_SPLASH_MIN_VISIBLE_MS;
    const remainingMs = Math.max(0, minVisibleMs - (performance.now() - startedAt));

    let tickId: number | undefined;
    let dwellId: number | undefined;
    let settleId: number | undefined;

    const beginSettle = (): void => {
      setProgress(100);
      settleId = window.setTimeout(() => {
        setShowSplash(false);
      }, BOOT_SPLASH_PROGRESS_SETTLE_MS);
    };

    if (remainingMs > 0) {
      tickId = startAsymptoteTicks();
      dwellId = window.setTimeout(() => {
        if (tickId !== undefined) {
          window.clearInterval(tickId);
          tickId = undefined;
        }
        beginSettle();
      }, remainingMs);
    } else {
      beginSettle();
    }

    return () => {
      if (tickId !== undefined) {
        window.clearInterval(tickId);
      }
      if (dwellId !== undefined) {
        window.clearTimeout(dwellId);
      }
      if (settleId !== undefined) {
        window.clearTimeout(settleId);
      }
    };
  }, [status]);

  return { progress, showSplash };
}
