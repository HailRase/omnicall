import { describe, expect, it, vi } from "vitest";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { AccountLogoutOrchestrationService } from "./AccountLogoutOrchestrationService.js";

describe("AccountLogoutOrchestrationService", () => {
  it("logs out OCP and ends SIP exactly once", async () => {
    const logoutOperator = vi.fn(() => Promise.resolve(ok(undefined)));
    const disconnectOcp = vi.fn(() => Promise.resolve(ok(undefined)));
    const endUserSession = vi.fn(() => Promise.resolve(ok(undefined)));
    const disarmOcpTransportRecovery = vi.fn();
    const resetOcpProjectionsToIdle = vi.fn();
    const service = new AccountLogoutOrchestrationService({
      readOcpSession: () => ({
        isAuthenticated: true,
        isLive: true,
        hasOperatorSnapshot: true,
      }),
      logoutOperator,
      disconnectOcp,
      endUserSession,
      disarmOcpTransportRecovery,
      resetOcpProjectionsToIdle,
    });

    const result = await service.execute({ reasonId: 4 });

    expect(result).toEqual({
      ok: true,
      value: {
        ocpStep: "operator_logout",
        sipSessionEnded: true,
        operatorSnapshotMissing: false,
      },
    });
    expect(disarmOcpTransportRecovery).toHaveBeenCalledOnce();
    expect(logoutOperator).toHaveBeenCalledOnce();
    expect(resetOcpProjectionsToIdle).toHaveBeenCalledOnce();
    expect(disconnectOcp).not.toHaveBeenCalled();
    expect(endUserSession).toHaveBeenCalledOnce();
    expect(disarmOcpTransportRecovery.mock.invocationCallOrder[0]).toBeLessThan(
      logoutOperator.mock.invocationCallOrder[0]!,
    );
    expect(logoutOperator.mock.invocationCallOrder[0]).toBeLessThan(
      resetOcpProjectionsToIdle.mock.invocationCallOrder[0]!,
    );
  });

  it("falls back to disconnect when authenticated snapshot is missing", async () => {
    const disconnectOcp = vi.fn(() => Promise.resolve(ok(undefined)));
    const endUserSession = vi.fn(() => Promise.resolve(ok(undefined)));
    const disarmOcpTransportRecovery = vi.fn();
    const resetOcpProjectionsToIdle = vi.fn();
    const service = new AccountLogoutOrchestrationService({
      readOcpSession: () => ({
        isAuthenticated: true,
        isLive: true,
        hasOperatorSnapshot: false,
      }),
      logoutOperator: vi.fn(() => Promise.resolve(ok(undefined))),
      disconnectOcp,
      endUserSession,
      disarmOcpTransportRecovery,
      resetOcpProjectionsToIdle,
    });

    const result = await service.execute({ reasonId: 4 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.operatorSnapshotMissing).toBe(true);
      expect(result.value.ocpStep).toBe("disconnect");
    }
    expect(disarmOcpTransportRecovery).toHaveBeenCalledOnce();
    expect(disconnectOcp).toHaveBeenCalledOnce();
    expect(resetOcpProjectionsToIdle).toHaveBeenCalledOnce();
    expect(endUserSession).toHaveBeenCalledOnce();
  });

  it("disarms recovery and resets projections even when OCP was not connected", async () => {
    const disarmOcpTransportRecovery = vi.fn();
    const resetOcpProjectionsToIdle = vi.fn();
    const endUserSession = vi.fn(() => Promise.resolve(ok(undefined)));
    const service = new AccountLogoutOrchestrationService({
      readOcpSession: () => ({
        isAuthenticated: false,
        isLive: false,
        hasOperatorSnapshot: false,
      }),
      logoutOperator: vi.fn(() => Promise.resolve(ok(undefined))),
      disconnectOcp: vi.fn(() => Promise.resolve(ok(undefined))),
      endUserSession,
      disarmOcpTransportRecovery,
      resetOcpProjectionsToIdle,
    });

    const result = await service.execute();

    expect(result.ok).toBe(true);
    expect(disarmOcpTransportRecovery).toHaveBeenCalledOnce();
    expect(resetOcpProjectionsToIdle).toHaveBeenCalledOnce();
    expect(endUserSession).toHaveBeenCalledOnce();
  });

  it("restores recovery tracking when OCP logout fails before disconnect", async () => {
    const restoreOcpTransportRecoveryTracking = vi.fn();
    const resetOcpProjectionsToIdle = vi.fn();
    const service = new AccountLogoutOrchestrationService({
      readOcpSession: () => ({
        isAuthenticated: true,
        isLive: true,
        hasOperatorSnapshot: true,
      }),
      logoutOperator: vi.fn(() =>
        Promise.resolve(
          err(createPlatformError("operation_failed", "ocp_logout_send_failed")),
        ),
      ),
      disconnectOcp: vi.fn(() => Promise.resolve(ok(undefined))),
      endUserSession: vi.fn(() => Promise.resolve(ok(undefined))),
      disarmOcpTransportRecovery: vi.fn(),
      resetOcpProjectionsToIdle,
      restoreOcpTransportRecoveryTracking,
    });

    const result = await service.execute({ reasonId: 4 });

    expect(result.ok).toBe(false);
    expect(restoreOcpTransportRecoveryTracking).toHaveBeenCalledOnce();
    expect(resetOcpProjectionsToIdle).not.toHaveBeenCalled();
  });
});
