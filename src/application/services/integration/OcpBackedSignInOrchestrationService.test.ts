import { describe, expect, it, vi } from "vitest";
import { createSipAccount, createSipAccountId } from "@domain/index.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { MockOcpProxyAuthenticatePort } from "@adapters/mock/MockOcpProxyAuthenticatePort.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { ConnectOcpUseCase } from "../../use-cases/integration/ocp/ConnectOcpUseCase.js";
import { DisconnectOcpUseCase } from "../../use-cases/integration/ocp/DisconnectOcpUseCase.js";
import { OcpAuthenticateAndConnectService } from "./OcpAuthenticateAndConnectService.js";
import { OcpBackedSignInOrchestrationService } from "./OcpBackedSignInOrchestrationService.js";
import { OcpSipCredentialService } from "./OcpSipCredentialService.js";
import { initialAuthorizationProgressProjection } from "../../projections/settings/authorizationProgressProjection.js";
import {
  createAuthorizeSipAccountStub,
  createPromoteAuthorizedSipSessionStub,
  createRegisterAccountStub,
} from "../../testing/sipUseCaseTestDoubles.js";

describe("OcpBackedSignInOrchestrationService", () => {
  function createHarness(options?: {
    registerFails?: boolean;
    identityMismatch?: boolean;
    sessionTimeoutMs?: number;
  }): Readonly<{
    gateway: MockOcpGateway;
    hub: OcpProjectionHub;
    service: OcpBackedSignInOrchestrationService;
    dispose: () => void;
  }> {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({ kind: "token", token: "tok-orch" });
    const logger = createTestLogger();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const authorizeSipAccount = createAuthorizeSipAccountStub(
      vi.fn(() => Promise.resolve(ok(account))),
    );
    const registerAccount = createRegisterAccountStub(
      vi.fn(() =>
        options?.registerFails === true
          ? Promise.resolve(
              err(createPlatformError("operation_failed", "register_failed")),
            )
          : Promise.resolve(ok(undefined)),
      ),
    );

    const sipCredentialService = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount,
      registerAccount,
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => options?.identityMismatch === true,
      getActiveSipIdentity: () =>
        Promise.resolve(
          options?.identityMismatch === true
            ? {
                username: "9999",
                domain: "pbx.example",
                server: "sip:pbx.example",
              }
            : null,
        ),
      credentialsTimeoutMs: 2_000,
      onRegisteringPhone: (correlationId) => {
        hub.setAuthorizationProgress({
          ...initialAuthorizationProgressProjection(),
          stage: "registering_phone",
          retryAvailable: false,
          correlationId,
        });
      },
    });

    const authenticateAndConnect = new OcpAuthenticateAndConnectService({
      proxyAuthenticate: proxy,
      connectOcp: new ConnectOcpUseCase(gateway, logger),
      disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
      ocpGateway: gateway,
      projectionHub: hub,
      logger,
      sessionTimeoutMs: options?.sessionTimeoutMs ?? 2_000,
    });

    const service = new OcpBackedSignInOrchestrationService({
      authenticateAndConnect,
      sipCredentialService,
      projectionHub: hub,
      logger,
    });

    return {
      gateway,
      hub,
      service,
      dispose: () => {
        sipCredentialService.dispose();
        hub.dispose();
      },
    };
  }

  it("returns sip_ready only after credentials authorize and register", async () => {
    const { gateway, hub, service, dispose } = createHarness();
    const correlationId = createCorrelationId();

    const pending = service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
      correlationId,
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe(
      "connecting_ocp",
    );

    gateway.simulateAuthSuccessWithCredentials(10, {
      username: "1001",
      password: "secret-password",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.phase).toBe("sip_ready");
      if (result.value.phase === "sip_ready") {
        expect(result.value.correlationId).toBe(correlationId);
      }
    }
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe("ready");
    expect(
      JSON.stringify(hub.getSessionProjection()),
    ).not.toContain("secret-password");
    dispose();
  });

  it("retries authorization on the active socket and waits until SIP-ready", async () => {
    const { gateway, hub, service, dispose } = createHarness({
      sessionTimeoutMs: 25,
    });
    const initialAttemptId = createCorrelationId();
    const first = await service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
      correlationId: initialAttemptId,
    });
    expect(first.ok).toBe(false);
    const socketGeneration = gateway.getSocketGeneration();

    const retry = service.retryAuthorization({
      operationCorrelationId: createCorrelationId(),
      targetAttemptId: initialAttemptId,
    });
    await vi.waitFor(() => {
      expect(gateway.getSentCommands().filter((command) => command.kind === "auth")).toHaveLength(
        2,
      );
    });
    gateway.simulateAuthSuccessWithCredentials(8, {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await retry;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.phase).toBe("sip_ready");
    }
    expect(gateway.getSocketGeneration()).toBe(socketGeneration);
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe("ready");
    dispose();
  });

  it("returns ocp_authenticated_sip_failed when SIP register fails", async () => {
    const { gateway, hub, service, dispose } = createHarness({
      registerFails: true,
    });

    const pending = service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(11, {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.phase).toBe("ocp_authenticated_sip_failed");
      if (result.value.phase === "ocp_authenticated_sip_failed") {
        expect(result.value.stage).toBe("sip_registration_failed");
      }
    }
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe(
      "sip_registration_failed",
    );
    expect(hub.getSessionProjection().authorizationProgress.retryAvailable).toBe(
      true,
    );
    expect(hub.getSessionProjection().authFeedback?.reason).toBe(
      "SIP_REGISTRATION_FAILED",
    );
    dispose();
  });

  it("maps identity mismatch without sip_ready", async () => {
    const { gateway, hub, service, dispose } = createHarness({
      identityMismatch: true,
    });

    const pending = service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
    });

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(13, {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.phase).toBe("ocp_authenticated_sip_failed");
      if (result.value.phase === "ocp_authenticated_sip_failed") {
        expect(result.value.stage).toBe("ocp_connected_sip_failed");
      }
    }
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe(
      "ocp_connected_sip_failed",
    );
    expect(hub.getSessionProjection().authorizationProgress.retryAvailable).toBe(
      true,
    );
    dispose();
  });

  it("rejects concurrent sign-in attempts", async () => {
    const { gateway, service, dispose } = createHarness();

    const first = service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
    });
    const second = await service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
    });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.message).toBe("ocp_sign_in_in_flight");
    }

    await vi.waitFor(() => {
      expect(gateway.getConnectionState()).toBe("connected");
    });
    gateway.simulateAuthSuccessWithCredentials(12, {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    await first;
    dispose();
  });

  it("maps SESSION_EXIST without sip_ready", async () => {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({ kind: "session_exist" });
    const logger = createTestLogger();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const sipCredentialService = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: createAuthorizeSipAccountStub(vi.fn()),
      registerAccount: createRegisterAccountStub(vi.fn()),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => false,
      getActiveSipIdentity: () => Promise.resolve(null),
      credentialsTimeoutMs: 50,
    });
    const service = new OcpBackedSignInOrchestrationService({
      authenticateAndConnect: new OcpAuthenticateAndConnectService({
        proxyAuthenticate: proxy,
        connectOcp: new ConnectOcpUseCase(gateway, logger),
        disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
        ocpGateway: gateway,
        projectionHub: hub,
        logger,
      }),
      sipCredentialService,
      projectionHub: hub,
      logger,
    });

    const result = await service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe(
      "ocp_session_exist",
    );
    expect(hub.getSessionProjection().authorizationProgress.retryAvailable).toBe(
      true,
    );
    sipCredentialService.dispose();
    hub.dispose();
  });

  it("maps OCP unavailable when HTTP authenticate fails", async () => {
    const gateway = new MockOcpGateway();
    const proxy = new MockOcpProxyAuthenticatePort();
    proxy.setBehavior({
      kind: "error",
      error: createPlatformError("operation_failed", "ocp_unavailable", {
        reason: "ocp_unavailable",
      }),
    });
    const logger = createTestLogger();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const sipCredentialService = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: createAuthorizeSipAccountStub(vi.fn()),
      registerAccount: createRegisterAccountStub(vi.fn()),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => false,
      getActiveSipIdentity: () => Promise.resolve(null),
      credentialsTimeoutMs: 50,
    });
    const service = new OcpBackedSignInOrchestrationService({
      authenticateAndConnect: new OcpAuthenticateAndConnectService({
        proxyAuthenticate: proxy,
        connectOcp: new ConnectOcpUseCase(gateway, logger),
        disconnectOcp: new DisconnectOcpUseCase(gateway, logger),
        ocpGateway: gateway,
        projectionHub: hub,
        logger,
      }),
      sipCredentialService,
      projectionHub: hub,
      logger,
    });

    const result = await service.execute({
      domain: "ocp.example.com",
      login: "1001",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    expect(hub.getSessionProjection().authorizationProgress.stage).toBe(
      "ocp_unavailable",
    );
    expect(hub.getSessionProjection().authorizationProgress.retryAvailable).toBe(
      true,
    );
    sipCredentialService.dispose();
    hub.dispose();
  });
});
