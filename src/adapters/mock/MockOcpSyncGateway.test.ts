import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createSampleOcpQueueInfoRawMessage,
  MockOcpSyncGateway,
  SAMPLE_OCP_QUEUE_INFO_MESSAGE,
} from "./MockOcpSyncGateway.js";

describe("MockOcpSyncGateway", () => {
  const gateway = new MockOcpSyncGateway();

  it("parses sample queue info fixture", () => {
    const raw = createSampleOcpQueueInfoRawMessage("acall-1", "Sales");
    expect(gateway.parseInboundMessage(raw)).toEqual({
      kind: "queue_info",
      mainAcallId: "acall-1",
      queueName: "Sales",
    });
  });

  it("returns null for invalid payload", () => {
    expect(gateway.parseInboundMessage({ event: "unknown" })).toBeNull();
  });

  it("honors return_null scenario", () => {
    gateway.setScenario({ type: "return_null" });
    const raw = createSampleOcpQueueInfoRawMessage("acall-1", "Sales");
    expect(gateway.parseInboundMessage(raw)).toBeNull();
    gateway.setScenario(null);
  });

  it("honors fixture scenario", () => {
    gateway.setScenario({
      type: "fixture",
      message: SAMPLE_OCP_QUEUE_INFO_MESSAGE,
    });
    expect(gateway.parseInboundMessage({})).toEqual(SAMPLE_OCP_QUEUE_INFO_MESSAGE);
    gateway.setScenario(null);
  });

  it("responds to campaign accept", async () => {
    const correlationId = createCorrelationId();
    const result = await gateway.respondToCampaign({
      campaignId: "camp-1",
      decision: "accept",
      correlationId,
    });
    expect(result).toEqual({ status: "succeeded" });
    expect(gateway.getLastCampaignRespondCommand()?.decision).toBe("accept");
  });

  it("exports typed sample message constant", () => {
    expect(SAMPLE_OCP_QUEUE_INFO_MESSAGE.kind).toBe("queue_info");
  });
});
