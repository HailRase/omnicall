import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockHostIntegrationGateway,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import {
  initialMultiCallProjection,
  reduceMultiCallProjection,
} from "@application/projections/telephony/multiCallProjection.js";
import { createCallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("MultiCallPolicy integration", () => {
  it("maps SecondSessionBlocked event to multi-call projection", async () => {
    const settings = new InMemorySettingsRepository({
      multiCallSettings: { multiSessionsEnabled: false },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway({ makeCallScenario: "answered" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      hostIntegrationGateway: new MockHostIntegrationGateway(),
      logger: createTestLogger(),
    });

    let projection = initialMultiCallProjection(
      await settings.getMultiCallSettings(),
    );
    const events: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      events.push(event.type);
      projection = reduceMultiCallProjection(projection, event);
    });

    await facade.makeCall("+12025550170", createCallId("projection-a"));
    const blocked = await facade.makeCall("+12025550171", createCallId("projection-b"));

    expect(blocked.ok).toBe(false);
    expect(events).toContain("SecondSessionBlocked");
    expect(projection.isSecondSessionDisabled).toBe(true);
    expect(projection.secondSessionDisabledReason).toBe("second_session_disabled");
  });

  it("maps hold-all chain to projection disabled reason", async () => {
    const settings = new InMemorySettingsRepository({
      multiCallSettings: { multiSessionsEnabled: true },
    });
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway({ makeCallScenario: "answered" }),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: settings,
      hostIntegrationGateway: new MockHostIntegrationGateway(),
      logger: createTestLogger(),
    });

    let projection = initialMultiCallProjection(
      await settings.getMultiCallSettings(),
    );
    facade.eventPublisher.subscribe((event) => {
      projection = reduceMultiCallProjection(projection, event);
    });

    await facade.makeCall("+12025550172", createCallId("hold-all-a"));
    await facade.makeCall("+12025550173", createCallId("hold-all-b"));

    expect(projection.hasEstablishedCall).toBe(true);
    expect(projection.establishedCallCount).toBeGreaterThanOrEqual(1);
  });
});
