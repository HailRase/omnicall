import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOcpSyncGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
  createSampleOcpNotificationRawMessage,
} from "@adapters/index.js";
import {
  initialOcpNotificationProjection,
  reduceOcpNotificationProjection,
} from "@application/projections/operator/ocpNotificationProjection.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isOk } from "@shared/result/index.js";

describe("OcpNotificationSync integration", () => {
  it("maps notification inbound to projection toast item", () => {
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: new MockTelephonyGateway(),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ phoneStatus: "online" }),
      ocpSyncGateway: new MockOcpSyncGateway(),
      logger: createTestLogger(),
    });

    let notificationProjection = initialOcpNotificationProjection();
    const eventTypes: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      eventTypes.push(event.type);
      notificationProjection = reduceOcpNotificationProjection(
        notificationProjection,
        event,
      );
    });

    const correlationId = createCorrelationId();
    facade.eventPublisher.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });

    const processResult = facade.processOcpInboundMessageRaw(
      createSampleOcpNotificationRawMessage("Queue sync complete", "info", "notif-int-1"),
      correlationId,
    );

    expect(isOk(processResult)).toBe(true);
    if (!isOk(processResult)) {
      return;
    }
    expect(processResult.value).toEqual({
      action: "notification_published",
      notificationId: "notif-int-1",
    });
    expect(eventTypes).toContain("OcpNotificationReceived");
    expect(notificationProjection.toasts[0]?.message).toBe("Queue sync complete");
  });
});
