import type { BrowserWindow } from "electron";
import {
  interpolateShellWindowBounds,
  resolveShellWindowAnimationProgress,
  type ShellWindowLayoutEasing,
  type ShellWindowRectangle,
} from "@domain/platform/ShellWindowLayout.js";

const TARGET_FRAME_MS = 1000 / 60;

export type AnimateWindowBoundsInput = Readonly<{
  window: BrowserWindow;
  from: ShellWindowRectangle;
  to: ShellWindowRectangle;
  durationMs: number;
  easing: ShellWindowLayoutEasing;
}>;

export type AnimateWindowBoundsHandle = Readonly<{
  promise: Promise<void>;
  cancel: () => void;
}>;

function applyBoundsIfChanged(
  window: BrowserWindow,
  next: ShellWindowRectangle,
  previous: ShellWindowRectangle | null,
): ShellWindowRectangle | null {
  if (
    previous !== null &&
    previous.x === next.x &&
    previous.y === next.y &&
    previous.width === next.width &&
    previous.height === next.height
  ) {
    return previous;
  }

  const partial: Partial<Electron.Rectangle> = {};

  if (previous === null || previous.x !== next.x) {
    partial.x = next.x;
  }

  if (previous === null || previous.y !== next.y) {
    partial.y = next.y;
  }

  if (previous === null || previous.width !== next.width) {
    partial.width = next.width;
  }

  if (previous === null || previous.height !== next.height) {
    partial.height = next.height;
  }

  window.setBounds(partial);
  return next;
}

/**
 * - Purpose: animate BrowserWindow bounds with wall-clock progress (F-016).
 * - Inputs: window, start/end bounds, duration, easing.
 * - Outputs: cancellable promise resolved when animation completes.
 */
export function animateWindowBounds(input: AnimateWindowBoundsInput): AnimateWindowBoundsHandle {
  const { window, from, to, durationMs, easing } = input;

  if (durationMs <= 0) {
    window.setBounds(to);
    return {
      promise: Promise.resolve(),
      cancel: () => undefined,
    };
  }

  if (process.platform === "darwin") {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;
    let resolvePromise: (() => void) | null = null;

    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;

      window.setBounds(to, true);
      timer = setTimeout(() => {
        timer = null;
        if (!cancelled) {
          window.setBounds(to);
        }
        resolvePromise?.();
        resolvePromise = null;
      }, durationMs);
    });

    return {
      promise,
      cancel: () => {
        cancelled = true;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        resolvePromise?.();
        resolvePromise = null;
      },
    };
  }

  let cancelled = false;
  let timeoutId: NodeJS.Timeout | null = null;
  let immediateId: NodeJS.Immediate | null = null;
  let previousBounds: ShellWindowRectangle | null = null;

  const clearScheduled = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (immediateId !== null) {
      clearImmediate(immediateId);
      immediateId = null;
    }
  };

  const cancel = (): void => {
    cancelled = true;
    clearScheduled();
  };

  const promise = new Promise<void>((resolve) => {
    const startedAt = performance.now();
    let nextFrameIndex = 1;

    const finish = (): void => {
      clearScheduled();
      resolve();
    };

    const tick = (): void => {
      if (cancelled) {
        finish();
        return;
      }

      const elapsed = performance.now() - startedAt;
      const progress = resolveShellWindowAnimationProgress(elapsed, durationMs, easing);
      const next = interpolateShellWindowBounds(from, to, progress);
      previousBounds = applyBoundsIfChanged(window, next, previousBounds);

      if (progress >= 1) {
        previousBounds = applyBoundsIfChanged(window, to, previousBounds);
        finish();
        return;
      }

      const nextDeadline = startedAt + nextFrameIndex * TARGET_FRAME_MS;
      nextFrameIndex += 1;
      const waitMs = nextDeadline - performance.now();

      if (waitMs <= 0) {
        immediateId = setImmediate(tick);
      } else {
        timeoutId = setTimeout(tick, waitMs);
      }
    };

    tick();
  });

  return { promise, cancel };
}
