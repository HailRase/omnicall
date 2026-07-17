import { describe, expect, it, vi } from "vitest";
import { createSipAccount, createSipAccountId } from "@domain/index.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { OcpSipCredentialService } from "./OcpSipCredentialService.js";
import {
  createAuthorizeSipAccountStub,
  createPromoteAuthorizedSipSessionStub,
  createRegisterAccountStub,
} from "../../testing/sipUseCaseTestDoubles.js";

function createLoggerSpy(): ReturnType<typeof createTestLogger> & {
  info: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
} {
  const base = createTestLogger({ featureId: "F-028", boundedContext: "Integration" });
  return {
    ...base,
    info: vi.fn(base.info.bind(base)),
    debug: vi.fn(base.debug.bind(base)),
    error: vi.fn(base.error.bind(base)),
    warn: vi.fn(base.warn.bind(base)),
  };
}

describe("OcpSipCredentialService", () => {
  it("authorizes and registers when unregistered", async () => {
    const gateway = new MockOcpGateway();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const authorizeExecute = vi.fn(() => Promise.resolve(ok(account)));
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const authorizeSipAccount = createAuthorizeSipAccountStub(authorizeExecute);
    const registerAccount = createRegisterAccountStub(registerExecute);
    const logger = createLoggerSpy();
    const correlationId = createCorrelationId();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount,
      registerAccount,
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => false,
      getActiveSipIdentity: () => Promise.resolve(null),
    });

    const pending = service.waitAndApplyNext(correlationId);
    gateway.simulateSipCredentials({
      username: "1001",
      password: "secret-password",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("applied");
    }

    expect(authorizeExecute).toHaveBeenCalledWith({
      account: {
        username: "1001",
        password: "secret-password",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
      source: "ocp",
      correlationId,
      promoteActiveSession: false,
    });
    expect(registerExecute).toHaveBeenCalledWith({ account, correlationId });

    const serialized = JSON.stringify(logger.info.mock.calls);
    expect(serialized).not.toContain("secret-password");

    service.dispose();
  });

  it("returns already_matching when SIP registered with same identity", async () => {
    const gateway = new MockOcpGateway();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const authorizeExecute = vi.fn(() => Promise.resolve(ok(account)));
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const logger = createLoggerSpy();
    const correlationId = createCorrelationId();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: createAuthorizeSipAccountStub(authorizeExecute),
      registerAccount: createRegisterAccountStub(registerExecute),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => true,
      getActiveSipIdentity: () =>
        Promise.resolve({
          username: "1001",
          domain: "pbx.example",
          server: "sip:pbx.example",
        }),
    });

    const pending = service.waitAndApplyNext(correlationId);
    gateway.simulateSipCredentials({
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("already_matching");
    }
    expect(authorizeExecute).not.toHaveBeenCalled();
    service.dispose();
  });

  it("returns identity_mismatch when SIP registered with different account", async () => {
    const gateway = new MockOcpGateway();
    const authorizeExecute = vi.fn();
    const logger = createLoggerSpy();
    const correlationId = createCorrelationId();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: createAuthorizeSipAccountStub(authorizeExecute),
      registerAccount: createRegisterAccountStub(vi.fn()),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => true,
      getActiveSipIdentity: () =>
        Promise.resolve({
          username: "2002",
          domain: "pbx.example",
          server: "sip:pbx.example",
        }),
    });

    const pending = service.waitAndApplyNext(correlationId);
    gateway.simulateSipCredentials({
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("identity_mismatch");
    }
    expect(authorizeExecute).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    service.dispose();
  });

  it("logs error and returns authorize_failed when authorize fails", async () => {
    const gateway = new MockOcpGateway();
    const authorizeExecute = vi.fn(() =>
      Promise.resolve(err(createPlatformError("validation_failed", "bad creds"))),
    );
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const logger = createLoggerSpy();
    const correlationId = createCorrelationId();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: createAuthorizeSipAccountStub(authorizeExecute),
      registerAccount: createRegisterAccountStub(registerExecute),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => false,
      getActiveSipIdentity: () => Promise.resolve(null),
    });

    const pending = service.waitAndApplyNext(correlationId);
    gateway.simulateSipCredentials({
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });

    const result = await pending;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("authorize_failed");
    }
    expect(registerExecute).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    service.dispose();
  });

  it("times out when credentials never arrive", async () => {
    const gateway = new MockOcpGateway();
    const logger = createLoggerSpy();
    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: createAuthorizeSipAccountStub(vi.fn()),
      registerAccount: createRegisterAccountStub(vi.fn()),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(),
      isSipRegistered: () => false,
      getActiveSipIdentity: () => Promise.resolve(null),
      credentialsTimeoutMs: 20,
    });

    const result = await service.waitAndApplyNext(createCorrelationId());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("ocp_credentials_timeout");
    }
    service.dispose();
  });
});
