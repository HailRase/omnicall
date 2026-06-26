import type {
  ApplyShellWindowLayoutCommand,
  ShellWindowGateway,
} from "@ports/platform/ShellWindowGateway.js";
import type { ShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";

/**
 * - Purpose: renderer adapter invoking shell layout IPC via preload API (F-016).
 * - Inputs: applyLayout commands from application layer.
 * - Outputs: IPC invoke to main-process ShellWindowController.
 */
export class PreloadShellWindowGateway implements ShellWindowGateway {
  async applyLayout(command: ApplyShellWindowLayoutCommand): Promise<void> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return;
    }

    const payload: ShellWindowLayoutPayload = {
      mode: command.mode,
      animationDurationMs: command.animationDurationMs,
      reducedMotion: command.reducedMotion,
    };

    await softphone.applyShellWindowLayout(payload);
  }
}
