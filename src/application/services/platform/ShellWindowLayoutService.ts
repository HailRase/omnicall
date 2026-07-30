/**
 * - Purpose: orchestrate shell window layout for settings and video fullscreen (F-016/F-027).
 * - Inputs: settings open flag, video fullscreen flag, reduced-motion preference.
 * - Outputs: invokes ShellWindowGateway with layout mode and instant bounds timing.
 */

import type {
  ApplyShellWindowLayoutCommand,
  ShellWindowGateway,
} from "@ports/platform/ShellWindowGateway.js";
import type { ShellWindowLayoutMode } from "@domain/platform/ShellWindowLayout.js";

export type ShellWindowLayoutServiceInput = Readonly<{
  settingsOpen: boolean;
  videoFullscreen: boolean;
  reducedMotion: boolean;
}>;

export class ShellWindowLayoutService {
  constructor(private readonly gateway: ShellWindowGateway) {}

  async syncLayout(input: ShellWindowLayoutServiceInput): Promise<void> {
    const mode = resolveShellWindowLayoutMode(input);
    const command: ApplyShellWindowLayoutCommand = {
      mode,
      // Layout transitions are instant on all platforms; OS maximize is never used.
      animationDurationMs: 0,
      reducedMotion: input.reducedMotion,
    };

    await this.gateway.applyLayout(command);
  }
}

/**
 * - Purpose: pick shell layout mode with settings taking priority over video fullscreen.
 * - Inputs: settings and video fullscreen flags.
 * - Outputs: compact | settings | video-fullscreen.
 */
export function resolveShellWindowLayoutMode(
  input: Readonly<{ settingsOpen: boolean; videoFullscreen: boolean }>,
): ShellWindowLayoutMode {
  if (input.settingsOpen) {
    return "settings";
  }
  if (input.videoFullscreen) {
    return "video-fullscreen";
  }
  return "compact";
}
