import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOcpSyncGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
  createSampleOcpQueueInfoRawMessage,
} from "@adapters/index.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
} from "@application/projections/telephony/incomingCallProjection.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isOk } from "@shared/result/index.js";

describe("OcpQueueInfoSync integration", () => {
  it("maps OCP auth → incoming correlation → queue_info → incomingCallProjection.queueInfo", async () => {
    const telephony = new MockTelephonyGateway();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ phoneStatus: "online" }),
      ocpSyncGateway: new MockOcpSyncGateway(),
      logger: createTestLogger(),
    });

    let incomingProjection = initialIncomingCallProjection();
    const eventTypes: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      eventTypes.push(event.type);
      incomingProjection = reduceIncomingCallProjection(incomingProjection, event);
    });

    const correlationId = createCorrelationId();
    const callId = createCallId("ocp-in-1");
    const mainAcallId = createMainAcallId("acall-sync-1");

    facade.eventPublisher.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });

    await telephony.simulateIncomingCall({
      callId,
      remoteNumber: "+12025550199",
      remoteDisplayNameRaw: "Queue Caller",
      mainAcallId,
      correlationId,
    });

    const processResult = facade.processOcpInboundMessageRaw(
      createSampleOcpQueueInfoRawMessage("acall-sync-1", "VIP Queue"),
      correlationId,
    );

    expect(isOk(processResult)).toBe(true);
    if (!isOk(processResult)) {
      return;
    }
    expect(processResult.value).toEqual({
      action: "queue_info_published",
      callId: "ocp-in-1",
    });
    expect(eventTypes).toContain("OcpCallCorrelationRegistered");
    expect(eventTypes).toContain("QueueInfoReceived");
    expect(incomingProjection.queueInfo).toBe("VIP Queue");
    expect(incomingProjection.uiState).toBe("callerIdentityResolved");
  });

  it("rejects substring mismatch without QueueInfoReceived", async () => {
    const telephony = new MockTelephonyGateway();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ phoneStatus: "online" }),
      logger: createTestLogger(),
    });

    const published: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    facade.eventPublisher.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });

    const correlationId = createCorrelationId();
    await telephony.simulateIncomingCall({
      callId: createCallId("ocp-in-2"),
      remoteNumber: "+12025550200",
      mainAcallId: createMainAcallId("acall-full-length"),
      correlationId,
    });

    published.length = 0;
    const processResult = facade.processOcpInboundMessageRaw(
      createSampleOcpQueueInfoRawMessage("acall-full", "Sales"),
      correlationId,
    );

    expect(isOk(processResult)).toBe(true);
    if (!isOk(processResult)) {
      return;
    }
    expect(processResult.value).toEqual({
      action: "queue_rejected",
      reason: "main_acallid_mismatch",
    });
    expect(published).not.toContain("QueueInfoReceived");
  });
});
