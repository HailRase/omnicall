import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createCampaignEventReceivedEvent, createCampaignEventAnsweredEvent } from "./campaignEvents.js";

describe("campaignEvents", () => {
  const correlationId = createCorrelationId();

  it("creates CampaignEventReceived with typed payload", () => {
    const event = createCampaignEventReceivedEvent(correlationId, {
      campaignId: "camp-1",
      title: "Sales Campaign",
      mainAcallId: createMainAcallId("acall-1"),
      progressive: false,
      callId: createCallId("call-1"),
    });

    expect(event.type).toBe("CampaignEventReceived");
    expect(event.campaignId).toBe("camp-1");
    expect(event.title).toBe("Sales Campaign");
    expect(event.progressive).toBe(false);
  });

  it("creates CampaignEventAnswered with decision payload", () => {
    const event = createCampaignEventAnsweredEvent(correlationId, {
      campaignId: "camp-1",
      decision: "reject",
      callId: createCallId("call-1"),
    });

    expect(event.type).toBe("CampaignEventAnswered");
    expect(event.decision).toBe("reject");
    expect(event.campaignId).toBe("camp-1");
  });
});
