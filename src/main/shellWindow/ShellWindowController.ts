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

/**
 * - Purpose: own compact snapshot and apply settings-driven window layout in main (F-016).
 * - Inputs: BrowserWindow, display work area, layout commands.
 * - Outputs: animated or instant bounds transitions.
 */
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

    if (mode === "settings" && this.activeMode !== "settings") {
      this.compactDimensions = {
        width: currentBounds.width,
        height: currentBounds.height,
      };
    }

    if (mode === "compact") {
      this.applyResizePolicy("compact");
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
      mode === "settings" ? "settings-open" : "settings-close";

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

    this.activeMode = mode;

    if (mode === "settings") {
      this.applyResizePolicy("settings");
    }
  }

  private applyResizePolicy(mode: ShellWindowLayoutMode): void {
    this.window.setResizable(resolveShellWindowResizable(mode));
  }
}
