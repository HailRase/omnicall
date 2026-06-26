import type {
  ApplyShellWindowLayoutCommand,
  ShellWindowGateway,
} from "@ports/platform/ShellWindowGateway.js";

export type MockShellWindowGatewayState = Readonly<{
  lastCommand: ApplyShellWindowLayoutCommand | null;
  callCount: number;
}>;

/**
 * - Purpose: in-memory ShellWindowGateway for application tests (F-016).
 * - Inputs: applyLayout commands.
 * - Outputs: records last command for assertions.
 */
export class MockShellWindowGateway implements ShellWindowGateway {
  private state: MockShellWindowGatewayState = {
    lastCommand: null,
    callCount: 0,
  };

  applyLayout(command: ApplyShellWindowLayoutCommand): Promise<void> {
    this.state = {
      lastCommand: command,
      callCount: this.state.callCount + 1,
    };
    return Promise.resolve();
  }

  getState(): MockShellWindowGatewayState {
    return this.state;
  }
}
