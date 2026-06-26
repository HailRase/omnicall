import type { ShellWindowLayoutMode } from "@domain/platform/ShellWindowLayout.js";

export type ApplyShellWindowLayoutCommand = Readonly<{
  mode: ShellWindowLayoutMode;
  animationDurationMs: number;
  reducedMotion: boolean;
}>;

/**
 * - Purpose: port for Electron shell window resize and anchor orchestration (F-016).
 * - Inputs: layout mode and animation options.
 * - Outputs: resolved when main-process bounds transition completes.
 */
export interface ShellWindowGateway {
  applyLayout(command: ApplyShellWindowLayoutCommand): Promise<void>;
}
