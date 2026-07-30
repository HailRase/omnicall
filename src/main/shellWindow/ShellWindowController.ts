/**
 * - Purpose: own compact snapshot and apply settings-driven window layout in main (F-016).
 * - Inputs: BrowserWindow, display work area, layout commands.
 * - Outputs: animated or instant bounds transitions; settings-only maximize.
 */

import type { BrowserWindow } from "electron";
import {
  computeCenteredBounds,
  resolveShellWindowMaximizable,
  resolveShellWindowMinimumSize,
  resolveShellWindowResizable,
  resolveShellWindowTargetBounds,
  SHELL_WINDOW_LAYOUT,
  type ShellWindowCompactDimensions,
  type ShellWindowLayoutEasing,
  type ShellWindowLayoutMode,
  type ShellWindowRectangle,
  type ShellWindowWorkArea,
} from "@domain/platform/ShellWindowLayout.js";
import { animateWindowBounds } from "./animateWindowBounds.js";

export type ShellWindowControllerState = Readonly<{
  compactDimensions: {
    width: number;
    height: number;
  };
  activeMode: ShellWindowLayoutMode | null;
  settingsSessionHeight: number;
}>;

export type ShellWindowMaximizedChangeHandler = (maximized: boolean) => void;

export class ShellWindowController {
  private compactDimensions: ShellWindowCompactDimensions = {
    width: SHELL_WINDOW_LAYOUT.compactDefaultWidth,
    height: SHELL_WINDOW_LAYOUT.compactDefaultHeight,
  };
  private activeMode: ShellWindowLayoutMode | null = null;
  private settingsSessionHeight: number = SHELL_WINDOW_LAYOUT.compactDefaultHeight;
  private animationGeneration = 0;
  private cancelActiveAnimation: (() => void) | null = null;
  private maximizedChangeHandler: ShellWindowMaximizedChangeHandler | null = null;
  /** When true, unmaximize must not snap to settings-min bounds (layout transition owns from-bounds). */
  private suppressSettingsUnmaximizeSnap = false;

  constructor(
    private readonly window: BrowserWindow,
    private readonly getWorkArea: () => ShellWindowWorkArea,
  ) {
    this.window.on("maximize", () => {
      this.maximizedChangeHandler?.(true);
    });
    this.window.on("unmaximize", () => {
      this.handleUnmaximize();
    });
    this.window.on("resized", () => {
      this.captureSettingsSessionHeight();
    });
  }

  onMaximizedChange(handler: ShellWindowMaximizedChangeHandler): void {
    this.maximizedChangeHandler = handler;
  }

  getState(): ShellWindowControllerState {
    return {
      compactDimensions: { ...this.compactDimensions },
      activeMode: this.activeMode,
      settingsSessionHeight: this.settingsSessionHeight,
    };
  }

  isMaximized(): boolean {
    return this.window.isMaximized();
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
    this.applyWindowChromePolicy("compact");
  }

  async applyLayout(
    mode: ShellWindowLayoutMode,
    animationDurationMs: number,
    reducedMotion: boolean,
  ): Promise<void> {
    this.cancelActiveAnimation?.();
    this.cancelActiveAnimation = null;

    // Animate from the on-screen maximized rectangle; do not snap via settings restore.
    const animationFrom = this.exitMaximizedForLayoutTransition();
    const workArea = this.getWorkArea();

    if (mode !== "compact" && this.activeMode === "compact") {
      this.compactDimensions = {
        width: animationFrom.width,
        height: animationFrom.height,
      };
    }

    if (mode === "settings") {
      this.settingsSessionHeight = Math.max(
        animationFrom.height,
        SHELL_WINDOW_LAYOUT.settingsMinHeight,
      );
    }

    // Commit mode before animation so re-entrant applyLayout during transition
    // does not re-snapshot compact dimensions from mid/fullscreen bounds.
    this.activeMode = mode;

    if (mode === "compact") {
      this.applyWindowChromePolicy("compact");
      this.compactDimensions = sanitizeCompactDimensions(
        this.compactDimensions,
        workArea,
      );
    }

    const target = resolveShellWindowTargetBounds(
      mode,
      workArea,
      this.compactDimensions,
      mode === "settings" ? this.settingsSessionHeight : animationFrom.height,
    );

    const generation = ++this.animationGeneration;
    const duration = reducedMotion ? 0 : animationDurationMs;
    const easing: ShellWindowLayoutEasing =
      mode === "compact" ? "settings-close" : "settings-open";

    const animation = animateWindowBounds({
      window: this.window,
      from: animationFrom,
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
      this.applyWindowChromePolicy("settings");
    }
  }

  toggleMaximize(): Readonly<{ ok: true } | { ok: false; reason: string }> {
    if (this.activeMode !== "settings") {
      return { ok: false, reason: "not_settings_mode" };
    }

    if (this.window.isMaximized()) {
      this.window.unmaximize();
      return { ok: true };
    }

    this.window.maximize();
    return { ok: true };
  }

  private handleUnmaximize(): void {
    if (this.activeMode === "settings" && !this.suppressSettingsUnmaximizeSnap) {
      this.applySettingsMinimumBounds();
    }
    this.maximizedChangeHandler?.(false);
  }

  /**
   * Leave maximized state for a layout animation without the settings restore snap.
   * Electron restores pre-maximize bounds on unmaximize; pin back to the captured
   * maximized rectangle so the next bounds animation starts from what the user saw.
   */
  private exitMaximizedForLayoutTransition(): ShellWindowRectangle {
    if (!this.window.isMaximized()) {
      return this.toShellRectangle(this.window.getBounds());
    }

    const maximizedBounds = this.toShellRectangle(this.window.getBounds());
    this.suppressSettingsUnmaximizeSnap = true;
    try {
      this.window.unmaximize();
    } finally {
      this.suppressSettingsUnmaximizeSnap = false;
    }
    this.window.setBounds(maximizedBounds);
    return maximizedBounds;
  }

  private toShellRectangle(bounds: Electron.Rectangle): ShellWindowRectangle {
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  private captureSettingsSessionHeight(): void {
    if (this.activeMode !== "settings" || this.window.isMaximized()) {
      return;
    }
    const bounds = this.window.getBounds();
    const workArea = this.getWorkArea();
    const margin = SHELL_WINDOW_LAYOUT.screenMargin * 2;
    const looksLikeWorkArea =
      bounds.width >= workArea.width - margin &&
      bounds.height >= workArea.height - margin;
    if (looksLikeWorkArea) {
      return;
    }
    this.settingsSessionHeight = Math.max(
      bounds.height,
      SHELL_WINDOW_LAYOUT.settingsMinHeight,
    );
  }

  private applySettingsMinimumBounds(): void {
    const target = this.resolveSettingsMinimumBounds(this.getWorkArea());
    this.window.setBounds(target);
    this.settingsSessionHeight = target.height;
  }

  private resolveSettingsMinimumBounds(
    workArea: ShellWindowWorkArea,
  ): ShellWindowRectangle {
    const height = Math.max(
      this.settingsSessionHeight,
      SHELL_WINDOW_LAYOUT.settingsMinHeight,
    );
    return computeCenteredBounds(
      workArea,
      SHELL_WINDOW_LAYOUT.settingsMinWidth,
      height,
    );
  }

  private applyWindowChromePolicy(mode: ShellWindowLayoutMode): void {
    const minimum = resolveShellWindowMinimumSize(mode);
    this.window.setMinimumSize(minimum.width, minimum.height);
    this.window.setResizable(resolveShellWindowResizable(mode));
    this.window.setMaximizable(resolveShellWindowMaximizable(mode));
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
