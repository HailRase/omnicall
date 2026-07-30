export type ShellWindowLayoutMode = "compact" | "settings" | "video-fullscreen";

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

export type ShellWindowCompactDimensions = Readonly<{
  width: number;
  height: number;
}>;

export const SHELL_WINDOW_LAYOUT = {
  compactDefaultWidth: 420,
  compactDefaultHeight: 625,
  compactMinWidth: 360,
  compactMinHeight: 560,
  settingsWidth: 1000,
  settingsMinWidth: 1000,
  settingsMinHeight: 560,
  animationDurationMs: 280,
  screenMargin: 16,
} as const;

export type ShellWindowLayoutEasing = "settings-open" | "settings-close";

export type ShellWindowMinimumSize = Readonly<{
  width: number;
  height: number;
}>;

/**
 * - Purpose: resolve whether the shell window accepts user resize for a layout mode (F-016).
 * - Inputs: compact, settings, or video-fullscreen layout mode.
 * - Outputs: true only in settings mode.
 */
export function resolveShellWindowResizable(mode: ShellWindowLayoutMode): boolean {
  return mode === "settings";
}

/**
 * - Purpose: resolve whether maximize is allowed for a layout mode (F-016).
 * - Inputs: compact, settings, or video-fullscreen layout mode.
 * - Outputs: true only in settings mode.
 */
export function resolveShellWindowMaximizable(mode: ShellWindowLayoutMode): boolean {
  return mode === "settings";
}

/**
 * - Purpose: resolve BrowserWindow minimum size for a layout mode (F-016).
 * - Inputs: compact, settings, or video-fullscreen layout mode.
 * - Outputs: minimum width/height for the active mode.
 */
export function resolveShellWindowMinimumSize(
  mode: ShellWindowLayoutMode,
): ShellWindowMinimumSize {
  if (mode === "settings") {
    return {
      width: SHELL_WINDOW_LAYOUT.settingsMinWidth,
      height: SHELL_WINDOW_LAYOUT.settingsMinHeight,
    };
  }

  return {
    width: SHELL_WINDOW_LAYOUT.compactMinWidth,
    height: SHELL_WINDOW_LAYOUT.compactMinHeight,
  };
}

/**
 * - Purpose: derive target BrowserWindow bounds for shell layout modes (F-016 / F-027).
 * - Inputs: layout mode, work area, saved compact dimensions, settings-session height.
 * - Outputs: target rectangle in screen coordinates.
 */
export function resolveShellWindowTargetBounds(
  mode: ShellWindowLayoutMode,
  workArea: ShellWindowWorkArea,
  compactDimensions: ShellWindowCompactDimensions,
  settingsSessionHeight: number,
): ShellWindowRectangle {
  if (mode === "video-fullscreen") {
    return {
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
    };
  }

  if (mode === "settings") {
    return computeCenteredBounds(
      workArea,
      SHELL_WINDOW_LAYOUT.settingsWidth,
      settingsSessionHeight,
    );
  }

  return computeBottomRightBounds(
    workArea,
    compactDimensions.width,
    compactDimensions.height,
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
 * - Purpose: map animation elapsed time to eased progress for BrowserWindow layout (F-016).
 * - Inputs: elapsed ms, duration ms, easing kind (open vs close).
 * - Outputs: progress in 0..1 (settings overlay close hold uses the same duration).
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
