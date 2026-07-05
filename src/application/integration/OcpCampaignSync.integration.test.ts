import { describe, expect, it } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOcpSyncGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
  createSampleOcpCampaignEventRawMessage,
} from "@adapters/index.js";
import {
  initialCampaignProjection,
  reduceCampaignProjection,
} from "@application/projections/campaignProjection.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isOk } from "@shared/result/index.js";

describe("OcpCampaignSync integration", () => {
  it("maps campaign_event inbound → accept → gateway → CampaignEventAnswered", async () => {
    const telephony = new MockTelephonyGateway();
    const ocpSyncGateway = new MockOcpSyncGateway();
    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({ phoneStatus: "online" }),
      ocpSyncGateway,
      logger: createTestLogger(),
    });

    let campaignProjection = initialCampaignProjection();
    const eventTypes: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      eventTypes.push(event.type);
      campaignProjection = reduceCampaignProjection(campaignProjection, event);
    });

    const correlationId = createCorrelationId();
    const callId = createCallId("camp-call-1");
    const mainAcallId = createMainAcallId("acall-camp-1");

    facade.eventPublisher.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });

    await telephony.simulateIncomingCall({
      callId,
      remoteNumber: "+12025550300",
      remoteDisplayNameRaw: "Campaign Caller",
      mainAcallId,
      correlationId,
    });

    eventTypes.length = 0;
    const processResult = facade.processOcpInboundMessageRaw(
      createSampleOcpCampaignEventRawMessage("camp-sync-1", "Sales Push", "acall-camp-1"),
      correlationId,
    );

    expect(isOk(processResult)).toBe(true);
    if (!isOk(processResult)) {
      return;
    }
    expect(processResult.value).toEqual({
      action: "campaign_published",
      callId: "camp-call-1",
    });
    expect(eventTypes).toContain("CampaignEventReceived");
    expect(campaignProjection.campaignByCallId.get("camp-call-1")?.title).toBe(
      "Sales Push",
    );

    eventTypes.length = 0;
    const respondResult = await facade.respondToCampaignById(
      "camp-sync-1",
      "accept",
      "camp-call-1",
      correlationId,
    );

    expect(isOk(respondResult)).toBe(true);
    expect(eventTypes).toContain("CampaignEventAnswered");
    expect(ocpSyncGateway.getLastCampaignRespondCommand()).toEqual({
      campaignId: "camp-sync-1",
      decision: "accept",
      correlationId,
    });
    expect(campaignProjection.campaignByCallId.has("camp-call-1")).toBe(false);
  });
});
