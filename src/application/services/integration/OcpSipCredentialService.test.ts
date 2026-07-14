import { describe, expect, it, vi } from "vitest";
import { createSipAccount, createSipAccountId } from "@domain/index.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { OcpSipCredentialService } from "./OcpSipCredentialService.js";
import type { AuthorizeSipAccountUseCase } from "../../use-cases/settings/AuthorizeSipAccountUseCase.js";
import type { RegisterAccountUseCase } from "../../use-cases/settings/RegisterAccountUseCase.js";

function createLoggerSpy(): ReturnType<typeof createTestLogger> & {
  info: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
} {
  const base = createTestLogger({ featureId: "F-028", boundedContext: "Integration" });
  return {
    ...base,
    info: vi.fn(base.info.bind(base)),
    debug: vi.fn(base.debug.bind(base)),
    error: vi.fn(base.error.bind(base)),
  };
}

describe("OcpSipCredentialService", () => {
  it("authorizes and registers when autoSipAuth and unregistered", async () => {
    const gateway = new MockOcpGateway();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "secret",
      domain: "pbx.example",
      server: "sip:pbx.example",
    });
    const authorizeExecute = vi.fn(() => Promise.resolve(ok(account)));
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const authorizeSipAccount = {
      execute: authorizeExecute,
    } as unknown as AuthorizeSipAccountUseCase;
    const registerAccount = {
      execute: registerExecute,
    } as unknown as RegisterAccountUseCase;
    const logger = createLoggerSpy();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount,
      registerAccount,
      isAutoSipAuthEnabled: () => true,
      isSipRegistered: () => false,
    });

    gateway.simulateMessage({
      entity: "creds",
      data: {
        username: "1001",
        password: "secret-password",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
    });

    await vi.waitFor(() => {
      expect(authorizeExecute).toHaveBeenCalledTimes(1);
    });

    expect(authorizeExecute).toHaveBeenCalledWith({
      account: {
        username: "1001",
        password: "secret-password",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
      source: "ocp",
    });
    expect(registerExecute).toHaveBeenCalledWith({ account });

    const serialized = JSON.stringify(logger.info.mock.calls);
    expect(serialized).not.toContain("secret-password");

    service.dispose();
  });

  it("skips when autoSipAuth is disabled", async () => {
    const gateway = new MockOcpGateway();
    const authorizeExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger: createLoggerSpy(),
      authorizeSipAccount: {
        execute: authorizeExecute,
      } as unknown as AuthorizeSipAccountUseCase,
      registerAccount: {
        execute: registerExecute,
      } as unknown as RegisterAccountUseCase,
      isAutoSipAuthEnabled: () => false,
      isSipRegistered: () => false,
    });

    gateway.simulateMessage({
      entity: "creds",
      data: {
        username: "1001",
        password: "secret",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
    });

    await Promise.resolve();
    expect(authorizeExecute).not.toHaveBeenCalled();
    expect(registerExecute).not.toHaveBeenCalled();
    service.dispose();
  });

  it("skips when SIP already registered", async () => {
    const gateway = new MockOcpGateway();
    const authorizeExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const logger = createLoggerSpy();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: {
        execute: authorizeExecute,
      } as unknown as AuthorizeSipAccountUseCase,
      registerAccount: {
        execute: registerExecute,
      } as unknown as RegisterAccountUseCase,
      isAutoSipAuthEnabled: () => true,
      isSipRegistered: () => true,
    });

    gateway.simulateMessage({
      entity: "creds",
      data: {
        username: "1001",
        password: "secret",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
    });

    await Promise.resolve();
    expect(authorizeExecute).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalled();
    service.dispose();
  });

  it("logs error and does not throw when authorize fails", async () => {
    const gateway = new MockOcpGateway();
    const authorizeExecute = vi.fn(() =>
      Promise.resolve(err(createPlatformError("validation_failed", "bad creds"))),
    );
    const registerExecute = vi.fn(() => Promise.resolve(ok(undefined)));
    const logger = createLoggerSpy();

    const service = new OcpSipCredentialService({
      ocpGateway: gateway,
      logger,
      authorizeSipAccount: {
        execute: authorizeExecute,
      } as unknown as AuthorizeSipAccountUseCase,
      registerAccount: {
        execute: registerExecute,
      } as unknown as RegisterAccountUseCase,
      isAutoSipAuthEnabled: () => true,
      isSipRegistered: () => false,
    });

    gateway.simulateMessage({
      entity: "creds",
      data: {
        username: "1001",
        password: "secret",
        domain: "pbx.example",
        server: "sip:pbx.example",
      },
    });

    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalled();
    });
    expect(registerExecute).not.toHaveBeenCalled();
    service.dispose();
  });
});
