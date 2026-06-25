import { describe, expect, it } from "vitest";
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

describe("SessionTeardown integration", () => {
  it("hangs up active call, releases media, unregisters SIP, and publishes UserSessionEnded", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      makeCallScenario: "answered",
    });
    const mediaGateway = new MockMediaGateway();

    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway,
      mediaGateway,
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    await facade.authorizeManualAccount(
      {
        username: "u",
        password: "p",
        domain: "d.example",
        server: "sip.example",
      },
      correlationId,
    );

    await facade.makeCall("1001", createCallId("active-call"));

    const published: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const result = await facade.endUserSessionCommand(correlationId);

    expect(isErr(result)).toBe(false);
    expect(telephonyGateway.getHangupCalls().length).toBeGreaterThan(0);
    expect(mediaGateway.getReleaseAllInvocations()).toBe(1);
    expect(telephonyGateway.getUnregisterInvocations()).toContain(correlationId);
    expect(published).toContain("UserSessionEnded");
    expect(published).toContain("UnregistrationSucceeded");
    expect(facade.getReconnectScheduler().getPendingCount()).toBe(0);
  });

  it("allows end session again after re-registration", async () => {
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
      telephonyGateway,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    const account = {
      username: "u",
      password: "p",
      domain: "d.example",
      server: "sip.example",
    };

    await facade.authorizeManualAccount(account);
    await facade.endUserSessionCommand();
    await facade.authorizeManualAccount(account);

    const secondLogout = await facade.endUserSessionCommand();

    expect(isErr(secondLogout)).toBe(false);
    expect(telephonyGateway.getUnregisterInvocations().length).toBeGreaterThanOrEqual(2);
  });
});
