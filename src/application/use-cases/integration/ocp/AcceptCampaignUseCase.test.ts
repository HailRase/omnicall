import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { AcceptCampaignUseCase } from "./AcceptCampaignUseCase.js";
import { RejectCampaignUseCase } from "./RejectCampaignUseCase.js";

describe("AcceptCampaignUseCase", () => {
  it("sends campaign_accept command", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const useCase = new AcceptCampaignUseCase(gateway, createTestLogger());

    const result = await useCase.execute({
      operatorId: 3,
      campaignEventId: "cmp-100",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "campaign_accept",
      operatorId: 3,
      campaignEventId: "cmp-100",
    });
  });
});

describe("RejectCampaignUseCase", () => {
  it("sends campaign_reject command", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const useCase = new RejectCampaignUseCase(gateway, createTestLogger());

    const result = await useCase.execute({
      operatorId: 3,
      campaignEventId: "cmp-200",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "campaign_reject",
      operatorId: 3,
      campaignEventId: "cmp-200",
    });
  });
});
