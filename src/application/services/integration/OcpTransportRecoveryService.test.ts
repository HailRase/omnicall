import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { ok } from "@shared/result/index.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { OcpTransportRecoveryService } from "./OcpTransportRecoveryService.js";

describe("OcpTransportRecoveryService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules fresh-token recovery after unexpected drop when authorized", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const recover = vi.fn(() => Promise.resolve(ok(undefined)));

    const service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 1000,
      maxReconnectAttempts: 3,
    });

    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    gateway.simulateAuthSuccess(5);
    expect(hub.getSessionProjection().isAuthenticated).toBe(true);

    gateway.simulateDisconnect();
    // Recovery marks reconnecting immediately, then invokes fresh-token callback after delay.
    expect(hub.getSessionProjection().serverState).toBe("reconnecting");

    await vi.advanceTimersByTimeAsync(1000);
    expect(recover).toHaveBeenCalledTimes(1);

    service.dispose();
    hub.dispose();
  });

  it("does not recover after terminate terminal state", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const recover = vi.fn(() => Promise.resolve(ok(undefined)));

    const service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 500,
    });

    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    gateway.simulateAuthSuccess(5);
    gateway.simulateMessage({ entity: "terminate" });
    gateway.simulateDisconnect();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(recover).not.toHaveBeenCalled();

    service.dispose();
    hub.dispose();
  });

  it("cancelAll stops pending recovery", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const recover = vi.fn(() => Promise.resolve(ok(undefined)));

    const service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 2000,
    });

    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    gateway.simulateAuthSuccess(5);
    gateway.simulateDisconnect();
    service.cancelAll("test");

    await vi.advanceTimersByTimeAsync(5_000);
    expect(recover).not.toHaveBeenCalled();

    service.dispose();
    hub.dispose();
  });

  it("cancelAll before intentional logout disconnect does not schedule recovery", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const recover = vi.fn(() => Promise.resolve(ok(undefined)));

    const service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 1000,
    });

    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    gateway.simulateAuthSuccess(5);
    expect(hub.getSessionProjection().isAuthenticated).toBe(true);

    // Avatar logout must disarm recovery before gateway.disconnect("logout").
    service.cancelAll("user_logout");
    gateway.disconnect("logout");

    expect(hub.getSessionProjection().serverState).toBe("disconnected");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(recover).not.toHaveBeenCalled();

    service.dispose();
    hub.dispose();
  });

  it("ignores async close after cancel even when hub still reports authorized", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const recover = vi.fn(() => Promise.resolve(ok(undefined)));

    const service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 1000,
    });

    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    gateway.simulateAuthSuccess(5);
    expect(hub.getSessionProjection().isAuthenticated).toBe(true);

    // Manual Reconnect: cancel, then progress notify while auth is still authorized
    // (real WS close is async and can arrive after this notify).
    service.cancelAll("fresh_token_connect");
    hub.setAuthorizationProgress(hub.getSessionProjection().authorizationProgress);
    expect(hub.getSessionProjection().authorizationState.phase).toBe("authorized");

    gateway.disconnect("logout");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(recover).not.toHaveBeenCalled();

    service.dispose();
    hub.dispose();
  });
});
