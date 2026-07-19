import { describe, expect, it, vi } from "vitest";
import { createSipAccount, createSipAccountId } from "@domain/index.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { ok, err, type Result } from "@shared/result/index.js";
import { createPlatformError, type PlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { SipAccount } from "@domain/index.js";
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

  it("cancelWait resolves waiter and skips promote/register after authorize settles", async () => {
    const gateway = new MockOcpGateway();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    let resolveAuthorize!: (value: Result<SipAccount, PlatformError>) => void;
    const authorizeExecute = vi.fn(
      () =>
        new Promise<Result<SipAccount, PlatformError>>((resolve) => {
          resolveAuthorize = resolve;
        }),
    );
    const promoteExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const correlationId = createCorrelationId();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger: createLoggerSpy(),
      authorizeSipAccount: createAuthorizeSipAccountStub(authorizeExecute),
      registerAccount: createRegisterAccountStub(registerExecute),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(promoteExecute),
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

    await vi.waitFor(() => {
      expect(authorizeExecute).toHaveBeenCalledOnce();
    });

    service.cancelWait(
      correlationId,
      createPlatformError("operation_failed", "ocp_attempt_cancelled", {
        reason: "ocp_attempt_cancelled",
      }),
    );

    const cancelResult = await pending;
    expect(cancelResult.ok).toBe(false);
    if (!cancelResult.ok) {
      expect(cancelResult.error.message).toBe("ocp_attempt_cancelled");
    }

    resolveAuthorize(ok(account));
    await vi.waitFor(() => {
      expect(promoteExecute).not.toHaveBeenCalled();
      expect(registerExecute).not.toHaveBeenCalled();
    });

    service.dispose();
  });

  it("cancel after promote but before register skips register", async () => {
    const gateway = new MockOcpGateway();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    let resolvePromote!: (value: Result<void, PlatformError>) => void;
    const authorizeExecute = vi.fn(() => Promise.resolve(ok(account)));
    const promoteExecute = vi.fn(
      () =>
        new Promise<Result<void, PlatformError>>((resolve) => {
          resolvePromote = resolve;
        }),
    );
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const correlationId = createCorrelationId();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger: createLoggerSpy(),
      authorizeSipAccount: createAuthorizeSipAccountStub(authorizeExecute),
      registerAccount: createRegisterAccountStub(registerExecute),
      promoteAuthorizedSipSession: createPromoteAuthorizedSipSessionStub(promoteExecute),
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

    await vi.waitFor(() => {
      expect(promoteExecute).toHaveBeenCalledOnce();
    });

    service.cancelWait(
      correlationId,
      createPlatformError("operation_failed", "ocp_attempt_cancelled", {
        reason: "ocp_attempt_cancelled",
      }),
    );
    await pending;

    resolvePromote(ok(undefined));
    await vi.waitFor(() => {
      expect(registerExecute).not.toHaveBeenCalled();
    });

    service.dispose();
  });
});
