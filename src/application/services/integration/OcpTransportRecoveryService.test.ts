import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
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

    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    hub.bindActiveAttemptToCurrentSocket(attemptId);
    gateway.simulateAuthSuccess(5);
    expect(hub.getSessionProjection().isAuthenticated).toBe(true);
    expect(hub.getSessionProjection().serverState).toBe("connected");

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

  it("preserves attempt budget when recoverWithFreshToken disarms via cancelAll", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    let service: OcpTransportRecoveryService;
    const recover = vi.fn(async () => {
      // Mimic backedSignIn.execute → cancelTransportRecovery during recovery connect.
      service.cancelAll("sign_in_supersede");
      service.cancelAll("fresh_token_connect");
      return err(
        createPlatformError("operation_failed", "ocp_http_auth_failed", {
          reason: "ocp_http_auth_failed",
        }),
      );
    });

    service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 100,
      maxReconnectAttempts: 3,
    });

    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    hub.bindActiveAttemptToCurrentSocket(attemptId);
    gateway.simulateAuthSuccess(5);
    gateway.simulateDisconnect();
    expect(hub.getSessionProjection().serverState).toBe("reconnecting");

    await vi.advanceTimersByTimeAsync(100);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(hub.getSessionProjection().authorizationProgress.uiSurface).toBe(
      "silent",
    );

    await vi.advanceTimersByTimeAsync(100);
    expect(recover).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(recover).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(500);
    expect(recover).toHaveBeenCalledTimes(3);
    expect(hub.getSessionProjection().serverState).toBe("failed");

    service.dispose();
    hub.dispose();
  });

  it("seeds silent progress during scheduled recovery", async () => {
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

    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    hub.bindActiveAttemptToCurrentSocket(attemptId);
    gateway.simulateAuthSuccess(5);
    gateway.simulateDisconnect();

    expect(hub.getSessionProjection().serverState).toBe("reconnecting");
    expect(hub.getSessionProjection().transportRecoveryActive).toBe(true);
    expect(hub.getSessionProjection().authorizationProgress.uiSurface).toBe(
      "silent",
    );

    await vi.advanceTimersByTimeAsync(1000);
    expect(recover).toHaveBeenCalledTimes(1);

    service.dispose();
    hub.dispose();
  });

  it("keeps recovery presentation across intentional disconnect during recover", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    let service: OcpTransportRecoveryService;
    const recover = vi.fn(async () => {
      service.cancelAll("fresh_token_connect");
      gateway.disconnect("logout");
      expect(hub.getSessionProjection().transportRecoveryActive).toBe(true);
      expect(hub.getSessionProjection().serverState).toBe("reconnecting");
      return err(
        createPlatformError("operation_failed", "ocp_http_auth_failed", {
          reason: "ocp_http_auth_failed",
        }),
      );
    });

    service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 50,
      maxReconnectAttempts: 2,
    });

    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    hub.bindActiveAttemptToCurrentSocket(attemptId);
    gateway.simulateAuthSuccess(5);
    gateway.simulateDisconnect();
    expect(hub.getSessionProjection().transportRecoveryActive).toBe(true);

    await vi.advanceTimersByTimeAsync(50);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(hub.getSessionProjection().transportRecoveryActive).toBe(true);
    expect(hub.getSessionProjection().transportRecoveryAttempt).toBeGreaterThanOrEqual(
      1,
    );

    service.dispose();
    hub.dispose();
  });

  it("keeps recovery banner ownership across brief WS connected during recover", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    let service: OcpTransportRecoveryService;
    const recover = vi.fn(async () => {
      service.cancelAll("fresh_token_connect");
      gateway.disconnect("logout");
      gateway.connect({ domain: "ocp.example.com", authToken: "t2" });
      expect(hub.getSessionProjection().transportRecoveryActive).toBe(true);
      expect(hub.getSessionProjection().transportRecoveryAttempt).toBe(1);
      return err(
        createPlatformError("operation_failed", "ocp_http_auth_failed", {
          reason: "ocp_http_auth_failed",
        }),
      );
    });

    service = new OcpTransportRecoveryService({
      ocpGateway: gateway,
      projectionHub: hub,
      recoverWithFreshToken: recover,
      logger: createTestLogger(),
      reconnectDelayMs: 50,
      maxReconnectAttempts: 3,
    });

    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    gateway.connect({ domain: "ocp.example.com", authToken: "t1" });
    hub.bindActiveAttemptToCurrentSocket(attemptId);
    gateway.simulateAuthSuccess(5);
    gateway.simulateDisconnect();

    await vi.advanceTimersByTimeAsync(50);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(hub.getSessionProjection().transportRecoveryActive).toBe(true);
    expect(hub.getSessionProjection().transportRecoveryAttempt).toBeGreaterThanOrEqual(
      1,
    );

    service.dispose();
    hub.dispose();
  });
});
