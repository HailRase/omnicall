import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { MockOcpProxyAuthenticatePort } from "@adapters/mock/MockOcpProxyAuthenticatePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { ConnectOcpUseCase } from "../../use-cases/integration/ocp/ConnectOcpUseCase.js";
import { DisconnectOcpUseCase } from "../../use-cases/integration/ocp/DisconnectOcpUseCase.js";
import { OcpAuthenticateAndConnectService } from "./OcpAuthenticateAndConnectService.js";
import { createTestLogger } from "@infrastructure/logging/index.js";

function createService(options?: Readonly<{ sessionTimeoutMs?: number }>): {
  gateway: MockOcpGateway;
  proxy: MockOcpProxyAuthenticatePort;
  hub: OcpProjectionHub;
  service: OcpAuthenticateAndConnectService;
} {
  const gateway = new MockOcpGateway();
  const proxy = new MockOcpProxyAuthenticatePort();
  const logger = createTestLogger();
  const hub = new OcpProjectionHub({ ocpGateway: gateway });
  const service = new OcpAuthenticateAndConnectService({
    proxyAuthenticate: proxy,
    connectOcp: new ConnectOcpUseCase(gateway, logger),
    disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
    ocpGateway: gateway,
    projectionHub: hub,
    logger,
    sessionTimeoutMs: options?.sessionTimeoutMs ?? 5_000,
  });
  return { gateway, proxy, hub, service };
}

describe("OcpAuthenticateAndConnectService", () => {
  it("acquires fresh HTTP token, connects one socket, sends auth, waits for authorized", async () => {
    const { gateway, proxy, hub, service } = createService();
    proxy.setBehavior({ kind: "token", token: "tok-1" });

    const pending = service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
      expect(gateway.getSentCommands().some((c) => c.kind === "auth")).toBe(true);
    });
    gateway.simulateAuthSuccess(42);

    const result = await pending;
    expect(result.ok).toBe(true);
    expect(proxy.calls).toHaveLength(1);
    expect(gateway.getSocketGeneration()).toBe(1);
    expect(hub.getSessionProjection().domain).toBe("ocp.example.com");
    expect(hub.getSessionProjection().authenticatedLogin).toBe("agent1");
  });

  it("surfaces SESSION_EXIST from HTTP without opening a socket", async () => {
    const { gateway, proxy, hub, service } = createService();
    proxy.setBehavior({ kind: "session_exist" });

    const result = await service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("ocp_session_exist");
    }
    expect(hub.getSessionProjection().authFeedback?.reason).toBe("SESSION_EXIST");
    expect(gateway.getConnectionState()).toBe("disconnected");
    expect(gateway.getSocketGeneration()).toBe(0);
  });

  it("times out when authorized never arrives and keeps socket for auth retry", async () => {
    const { gateway, proxy, hub, service } = createService({ sessionTimeoutMs: 20 });
    proxy.setBehavior({ kind: "token", token: "tok-timeout" });

    const result = await service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("timeout");
      expect(result.error.message).toBe("ocp_auth_timeout");
    }
    expect(hub.getSessionProjection().authFeedback?.reason).toBe("AUTH_TIMEOUT");
    expect(gateway.getConnectionState()).toBe("connected");
  });

  it("retryAuthorization resends auth on same socket without new HTTP or socket", async () => {
    const { gateway, proxy, hub, service } = createService({ sessionTimeoutMs: 20 });
    proxy.setBehavior({ kind: "token", token: "tok-retry" });

    const first = service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });
    await expect(first).resolves.toMatchObject({ ok: false });

    const genAfterTimeout = gateway.getSocketGeneration();
    const authCommandsBefore = gateway
      .getSentCommands()
      .filter((c) => c.kind === "auth").length;

    const retryPending = service.retryAuthorization();
    await vi.waitFor(() => {
      expect(
        gateway.getSentCommands().filter((c) => c.kind === "auth").length,
      ).toBe(authCommandsBefore + 1);
    });
    gateway.simulateAuthSuccess(7);
    const retryResult = await retryPending;

    expect(retryResult.ok).toBe(true);
    expect(proxy.calls).toHaveLength(1);
    expect(gateway.getSocketGeneration()).toBe(genAfterTimeout);
    expect(hub.getSessionProjection().isAuthenticated).toBe(true);
  });

  it("retryServer acquires a new HTTP token and opens a new socket", async () => {
    const { gateway, proxy, service } = createService();
    proxy.setBehavior({ kind: "token", token: "tok-a" });

    const firstPending = service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });
    await vi.waitFor(() => {
      expect(gateway.getSentCommands().some((c) => c.kind === "auth")).toBe(true);
    });
    gateway.simulateAuthSuccess(1);
    await firstPending;

    const genAfterFirst = gateway.getSocketGeneration();
    proxy.setBehavior({ kind: "token", token: "tok-b" });

    const retryPending = service.retryServer({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });
    await vi.waitFor(() => {
      expect(gateway.getSocketGeneration()).toBeGreaterThan(genAfterFirst);
      expect(gateway.getLastSentCommand()?.kind).toBe("auth");
    });
    gateway.simulateAuthSuccess(2);
    const retryResult = await retryPending;

    expect(retryResult.ok).toBe(true);
    expect(proxy.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("maps HTTP failures to auth feedback", async () => {
    const { proxy, hub, service } = createService();
    proxy.setBehavior({
      kind: "error",
      error: createPlatformError("operation_failed", "ocp_proxy_authenticate_http_failed"),
    });

    const result = await service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    expect(hub.getSessionProjection().authFeedback?.reason).toBe("HTTP_AUTH_FAILED");
  });

  it("ignores superseded attempt events after a newer beginAttempt", async () => {
    const { gateway, proxy, hub, service } = createService({ sessionTimeoutMs: 50 });
    proxy.setBehavior({ kind: "token", token: "tok-stale" });
    const staleAttemptId = createCorrelationId();
    const freshAttemptId = createCorrelationId();

    const stale = service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
      correlationId: staleAttemptId,
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });

    hub.beginAttempt(freshAttemptId);
    gateway.simulateAuthSuccess(99);

    const staleResult = await stale;
    expect(staleResult.ok).toBe(false);
    if (!staleResult.ok) {
      expect(staleResult.error.message).toBe("ocp_attempt_superseded");
    }
  });
});
