export type ShellWindowLayoutMode = "compact" | "settings";

export type ShellWindowRectangle = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type ShellWindowWorkArea = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export const SHELL_WINDOW_LAYOUT = {
  compactDefaultWidth: 420,
  settingsWidth: 1000,
  animationDurationMs: 280,
  screenMargin: 16,
} as const;

export type ShellWindowLayoutEasing = "settings-open" | "settings-close";

/**
 * - Purpose: derive target BrowserWindow bounds for compact or settings shell layout (F-016).
 * - Inputs: layout mode, work area, window height, optional saved compact width.
 * - Outputs: target rectangle in screen coordinates.
 */
export function resolveShellWindowTargetBounds(
  mode: ShellWindowLayoutMode,
  workArea: ShellWindowWorkArea,
  height: number,
  compactWidth: number,
): ShellWindowRectangle {
  const width =
    mode === "settings" ? SHELL_WINDOW_LAYOUT.settingsWidth : compactWidth;

  if (mode === "settings") {
    return computeCenteredBounds(workArea, width, height);
  }

  return computeBottomRightBounds(
    workArea,
    width,
    height,
    SHELL_WINDOW_LAYOUT.screenMargin,
  );
}

/**
 * - Purpose: interpolate window bounds for animated resize (F-016).
 * - Inputs: start and end rectangles, normalized progress 0..1.
 * - Outputs: interpolated rectangle.
 */
export function interpolateShellWindowBounds(
  from: ShellWindowRectangle,
  to: ShellWindowRectangle,
  progress: number,
): ShellWindowRectangle {
  const t = clamp01(progress);

  return {
    x: Math.round(from.x + (to.x - from.x) * t),
    y: Math.round(from.y + (to.y - from.y) * t),
    width: Math.round(from.width + (to.width - from.width) * t),
    height: Math.round(from.height + (to.height - from.height) * t),
  };
}

/**
 * - Purpose: map animation elapsed time to eased progress matching settings overlay CSS.
 * - Inputs: elapsed ms, duration ms, easing kind.
 * - Outputs: progress in 0..1.
 */
export function resolveShellWindowAnimationProgress(
  elapsedMs: number,
  durationMs: number,
  easing: ShellWindowLayoutEasing,
): number {
  if (durationMs <= 0) {
    return 1;
  }

  const linear = clamp01(elapsedMs / durationMs);

  if (easing === "settings-open") {
    return easeOutCubic(linear);
  }

  return easeInCubic(linear);
}

export function computeBottomRightBounds(
  workArea: ShellWindowWorkArea,
  width: number,
  height: number,
  margin: number,
): ShellWindowRectangle {
  return {
    x: workArea.x + workArea.width - width - margin,
    y: workArea.y + workArea.height - height - margin,
    width,
    height,
  };
}

export function computeCenteredBounds(
  workArea: ShellWindowWorkArea,
  width: number,
  height: number,
): ShellWindowRectangle {
  return {
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    width,
    height,
  };
}

function clamp01(value: number): number {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeInCubic(t: number): number {
  return t ** 3;
}
