import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ServerTerminateCleanup integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hangs up active calls and unregisters SIP on server terminate (LF-048)", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      makeCallScenario: "answered",
    });
    const operatorGateway = new MockOperatorPlatformGateway({ scenario: "success" });

    const facade = new AccountBootstrapFacade({
      operatorGateway,
      telephonyGateway,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {
          mode: "ocp",
          ocpToken: "token",
          ocpDomain: "ocp.example",
        },
      }),
      logger: createTestLogger(),
    });

    await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
      correlationId,
    });

    await facade.authorizeManualAccount(
      {
        uri: "sip:agent@pbx",
        username: "agent",
        password: "secret",
        displayName: "Agent",
        registrar: "sip:pbx",
      },
      correlationId,
    );

    const callResult = await facade.makeCall("1001", createCallId("call-terminate-1"));
    expect(isErr(callResult)).toBe(false);

    facade.simulateServerTerminate(correlationId, "session_revoked", "agent-001");

    await vi.runAllTimersAsync();

    expect(telephonyGateway.getHangupCalls()).toContain("call-terminate-1");
    expect(telephonyGateway.getUnregisterInvocations()).toContain(correlationId);
    expect(operatorGateway.getLogoutInvocations().length).toBeGreaterThan(0);
  });
});
