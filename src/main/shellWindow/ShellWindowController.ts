/**
 * - Purpose: own compact snapshot and apply settings-driven window layout in main (F-016).
 * - Inputs: BrowserWindow, display work area, layout commands.
 * - Outputs: animated or instant bounds transitions.
 */

import type { BrowserWindow } from "electron";
import {
  resolveShellWindowResizable,
  resolveShellWindowTargetBounds,
  SHELL_WINDOW_LAYOUT,
  type ShellWindowCompactDimensions,
  type ShellWindowLayoutEasing,
  type ShellWindowLayoutMode,
  type ShellWindowWorkArea,
} from "@domain/platform/ShellWindowLayout.js";
import { animateWindowBounds } from "./animateWindowBounds.js";

export type ShellWindowControllerState = Readonly<{
  compactDimensions: {
    width: number;
    height: number;
  };
  activeMode: ShellWindowLayoutMode | null;
}>;

export class ShellWindowController {
  private compactDimensions: ShellWindowCompactDimensions = {
    width: SHELL_WINDOW_LAYOUT.compactDefaultWidth,
    height: SHELL_WINDOW_LAYOUT.compactDefaultHeight,
  };
  private activeMode: ShellWindowLayoutMode | null = null;
  private animationGeneration = 0;
  private cancelActiveAnimation: (() => void) | null = null;

  constructor(
    private readonly window: BrowserWindow,
    private readonly getWorkArea: () => ShellWindowWorkArea,
  ) {}

  getState(): ShellWindowControllerState {
    return {
      compactDimensions: { ...this.compactDimensions },
      activeMode: this.activeMode,
    };
  }

  placeCompactAtStartup(): void {
    this.cancelActiveAnimation?.();
    this.cancelActiveAnimation = null;

    const bounds = this.window.getBounds();
    this.compactDimensions = {
      width: bounds.width,
      height: bounds.height,
    };
    const target = resolveShellWindowTargetBounds(
      "compact",
      this.getWorkArea(),
      this.compactDimensions,
      bounds.height,
    );
    this.window.setBounds(target);
    this.activeMode = "compact";
    this.applyResizePolicy("compact");
  }

  async applyLayout(
    mode: ShellWindowLayoutMode,
    animationDurationMs: number,
    reducedMotion: boolean,
  ): Promise<void> {
    this.cancelActiveAnimation?.();
    this.cancelActiveAnimation = null;

    const currentBounds = this.window.getBounds();
    const workArea = this.getWorkArea();

    if (mode !== "compact" && this.activeMode === "compact") {
      this.compactDimensions = {
        width: currentBounds.width,
        height: currentBounds.height,
      };
    }

    // Commit mode before animation so re-entrant applyLayout during transition
    // does not re-snapshot compact dimensions from mid/fullscreen bounds.
    this.activeMode = mode;

    if (mode === "compact") {
      this.applyResizePolicy("compact");
      this.compactDimensions = sanitizeCompactDimensions(
        this.compactDimensions,
        workArea,
      );
    }

    const target = resolveShellWindowTargetBounds(
      mode,
      workArea,
      this.compactDimensions,
      currentBounds.height,
    );

    const generation = ++this.animationGeneration;
    const duration = reducedMotion ? 0 : animationDurationMs;
    const easing: ShellWindowLayoutEasing =
      mode === "compact" ? "settings-close" : "settings-open";

    const animation = animateWindowBounds({
      window: this.window,
      from: currentBounds,
      to: target,
      durationMs: duration,
      easing,
    });

    this.cancelActiveAnimation = animation.cancel;

    await animation.promise;

    this.cancelActiveAnimation = null;

    if (generation !== this.animationGeneration) {
      return;
    }

    if (mode === "settings") {
      this.applyResizePolicy("settings");
    }
  }

  private applyResizePolicy(mode: ShellWindowLayoutMode): void {
    this.window.setResizable(resolveShellWindowResizable(mode));
  }
}

/**
 * - Purpose: prevent restoring "compact" to work-area size after a corrupted snapshot.
 * - Inputs: saved compact dims and current work area.
 * - Outputs: safe compact dimensions (defaults when snapshot looks fullscreen-sized).
 */
export function sanitizeCompactDimensions(
  compact: ShellWindowCompactDimensions,
  workArea: ShellWindowWorkArea,
): ShellWindowCompactDimensions {
  const margin = SHELL_WINDOW_LAYOUT.screenMargin * 2;
  const looksLikeWorkArea =
    compact.width >= workArea.width - margin &&
    compact.height >= workArea.height - margin;
  if (!looksLikeWorkArea) {
    return compact;
  }
  return {
    width: SHELL_WINDOW_LAYOUT.compactDefaultWidth,
    height: SHELL_WINDOW_LAYOUT.compactDefaultHeight,
  };
}
