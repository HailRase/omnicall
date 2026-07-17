import { describe, expect, it } from "vitest";
import { deriveOcpSystemStateShell } from "./deriveOcpSystemStateShell.js";

describe("deriveOcpSystemStateShell", () => {
  it("disables OCP tab when module is off", () => {
    const shell = deriveOcpSystemStateShell({
      ocpModuleEnabled: false,
      dualFsm: {
        serverState: "disconnected",
        authorizationState: { phase: "idle" },
        terminalSessionClosed: false,
      },
    });

    expect(shell.tabDisabledReasonKey).toBe(
      "settings.systemState.ocp.tab.disabled.moduleOff",
    );
    expect(shell.ocpModuleEnabled).toBe(false);
  });

  it("maps server/authorization label keys and recovery actions when module on", () => {
    const shell = deriveOcpSystemStateShell({
      ocpModuleEnabled: true,
      dualFsm: {
        serverState: "failed",
        authorizationState: { phase: "idle" },
        terminalSessionClosed: false,
      },
    });

    expect(shell.tabDisabledReasonKey).toBeNull();
    expect(shell.serverStateLabelKey).toBe("settings.systemState.ocp.server.failed");
    expect(shell.authorizationStateLabelKey).toBe(
      "settings.systemState.ocp.authorization.idle",
    );
    expect(shell.primaryRecoveryAction).toBe("retry_server");
    expect(shell.allowedRecoveryActions).toContain("retry_server");
  });

  it("exposes auth-only retry when server connected and authorization timed out", () => {
    const shell = deriveOcpSystemStateShell({
      ocpModuleEnabled: true,
      dualFsm: {
        serverState: "connected",
        authorizationState: { phase: "timeout" },
        terminalSessionClosed: false,
      },
    });

    expect(shell.primaryRecoveryAction).toBe("retry_authorization");
    expect(shell.allowedRecoveryActions).toContain("retry_authorization");
    expect(shell.recoveryActionLabelKeys.retry_authorization).toBe(
      "settings.systemState.ocp.action.retryAuthorization",
    );
  });
});
