import {
  SHELL_WINDOW_LAYOUT,
  type ShellWindowLayoutMode,
} from "@domain/platform/ShellWindowLayout.js";
import type {
  ApplyShellWindowLayoutCommand,
  ShellWindowGateway,
} from "@ports/platform/ShellWindowGateway.js";

export type ShellWindowLayoutServiceInput = Readonly<{
  settingsOpen: boolean;
  reducedMotion: boolean;
}>;

/**
 * - Purpose: orchestrate shell window layout when settings overlay opens or closes (F-016).
 * - Inputs: settings open flag and reduced-motion preference.
 * - Outputs: invokes ShellWindowGateway with layout mode and animation timing.
 */
export class ShellWindowLayoutService {
  constructor(private readonly gateway: ShellWindowGateway) {}

  async syncForSettingsOverlay(input: ShellWindowLayoutServiceInput): Promise<void> {
    const mode: ShellWindowLayoutMode = input.settingsOpen ? "settings" : "compact";
    const command: ApplyShellWindowLayoutCommand = {
      mode,
      animationDurationMs: SHELL_WINDOW_LAYOUT.animationDurationMs,
      reducedMotion: input.reducedMotion,
    };

    await this.gateway.applyLayout(command);
  }
}
