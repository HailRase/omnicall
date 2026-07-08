import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createCallId } from "@domain/index.js";
import { createCampaignEventReceivedEvent } from "@domain/operator/events/campaignEvents.js";
import {
  initialCampaignProjection,
  reduceCampaignProjection,
  deriveCampaignContextState,
} from "./campaignProjection.js";

describe("campaignProjection", () => {
  const correlationId = createCorrelationId();

  it("stores campaign context on CampaignEventReceived", () => {
    let projection = reduceCampaignProjection(initialCampaignProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "s-1",
      agentId: "a-1",
    });
    projection = reduceCampaignProjection(
      projection,
      createCampaignEventReceivedEvent(correlationId, {
        campaignId: "camp-1",
        title: "Outbound",
        mainAcallId: null,
        progressive: false,
        callId: createCallId("call-1"),
      }),
    );

    expect(projection.campaignByCallId.get("call-1")?.title).toBe("Outbound");
    expect(deriveCampaignContextState(projection, "call-1")).toBe("context_ready");
  });
});
