import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { MockOcpProxyAuthenticatePort } from "@adapters/mock/MockOcpProxyAuthenticatePort.js";
import { createPlatformError } from "@shared/errors/index.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { ConnectOcpUseCase } from "../../use-cases/integration/ocp/ConnectOcpUseCase.js";
import { DisconnectOcpUseCase } from "../../use-cases/integration/ocp/DisconnectOcpUseCase.js";
import { OcpAuthenticateAndConnectService } from "./OcpAuthenticateAndConnectService.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
describe("OcpAuthenticateAndConnectService", () => {
  it("connects after HTTP token and waits for authenticated", async () => {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({ kind: "token", token: "tok-1" });
    const logger = createTestLogger();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const service = new OcpAuthenticateAndConnectService({
      proxyAuthenticate: proxy,
      connectOcp: new ConnectOcpUseCase(gateway, logger),
      disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
      ocpGateway: gateway,
      projectionHub: hub,
      logger,
      sessionTimeoutMs: 5_000,
    });

    const pending = service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccess(42);

    const result = await pending;
    expect(result.ok).toBe(true);
    expect(proxy.calls[0]?.login).toBe("agent1");
  });

  it("surfaces SESSION_EXIST without blocking reconnect semantics", async () => {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({ kind: "session_exist" });
    const logger = createTestLogger();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const service = new OcpAuthenticateAndConnectService({
      proxyAuthenticate: proxy,
      connectOcp: new ConnectOcpUseCase(gateway, logger),
      disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
      ocpGateway: gateway,
      projectionHub: hub,
      logger,
    });

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
  });

  it("times out when authenticated never arrives", async () => {
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
      sessionTimeoutMs: 20,
    });

    // Prevent auto-auth completion from mock if any
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
  });

  it("maps HTTP failures to auth feedback", async () => {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({
      kind: "error",
      error: createPlatformError("operation_failed", "ocp_proxy_authenticate_http_failed"),
    });
    const logger = createTestLogger();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const service = new OcpAuthenticateAndConnectService({
      proxyAuthenticate: proxy,
      connectOcp: new ConnectOcpUseCase(gateway, logger),
      disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
      ocpGateway: gateway,
      projectionHub: hub,
      logger,
    });

    const result = await service.execute({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    expect(hub.getSessionProjection().authFeedback?.reason).toBe("HTTP_AUTH_FAILED");
  });
});
