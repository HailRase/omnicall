import type { BrowserWindow } from "electron";
import {
  resolveShellWindowTargetBounds,
  SHELL_WINDOW_LAYOUT,
  type ShellWindowLayoutEasing,
  type ShellWindowLayoutMode,
  type ShellWindowWorkArea,
} from "@domain/platform/ShellWindowLayout.js";
import { animateWindowBounds } from "./animateWindowBounds.js";

export type ShellWindowControllerState = Readonly<{
  compactWidth: number;
  activeMode: ShellWindowLayoutMode | null;
}>;

/**
 * - Purpose: own compact snapshot and apply settings-driven window layout in main (F-016).
 * - Inputs: BrowserWindow, display work area, layout commands.
 * - Outputs: animated or instant bounds transitions.
 */
export class ShellWindowController {
  private compactWidth: number = SHELL_WINDOW_LAYOUT.compactDefaultWidth;
  private activeMode: ShellWindowLayoutMode | null = null;
  private animationGeneration = 0;
  private cancelActiveAnimation: (() => void) | null = null;

  constructor(
    private readonly window: BrowserWindow,
    private readonly getWorkArea: () => ShellWindowWorkArea,
  ) {}

  getState(): ShellWindowControllerState {
    return {
      compactWidth: this.compactWidth,
      activeMode: this.activeMode,
    };
  }

  placeCompactAtStartup(): void {
    this.cancelActiveAnimation?.();
    this.cancelActiveAnimation = null;

    const bounds = this.window.getBounds();
    this.compactWidth = bounds.width;
    const target = resolveShellWindowTargetBounds(
      "compact",
      this.getWorkArea(),
      bounds.height,
      this.compactWidth,
    );
    this.window.setBounds(target);
    this.activeMode = "compact";
  }

  async applyLayout(
    mode: ShellWindowLayoutMode,
    animationDurationMs: number,
    reducedMotion: boolean,
  ): Promise<void> {
    this.cancelActiveAnimation?.();
    this.cancelActiveAnimation = null;

    const currentBounds = this.window.getBounds();
    const height = currentBounds.height;
    const workArea = this.getWorkArea();

    if (mode === "settings" && this.activeMode !== "settings") {
      this.compactWidth = currentBounds.width;
    }

    const target = resolveShellWindowTargetBounds(
      mode,
      workArea,
      height,
      this.compactWidth,
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
  }
}
