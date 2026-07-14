import { describe, expect, it } from "vitest";
import {
  clearCampaignEvent,
  reduceCampaignEventFromPayload,
} from "./campaignEventProjection.js";
import type { OcpCampaignEventPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

const campaign: OcpCampaignEventPayload = {
  id: "c1",
  callId: "call-1",
  queueId: "q1",
  abonentId: "a1",
  companyId: "co1",
  queueTitle: "Queue",
  selectionId: "s1",
  isAnswered: false,
  progressive: false,
  clientPhone: "+100",
  companyTitle: "Co",
  strategyTitle: "Strat",
  selectionTitle: "Sel",
  strategyCallId: "sc1",
};

describe("campaignEventProjection", () => {
  it("sets and clears active campaign", () => {
    let projection = reduceCampaignEventFromPayload(campaign);
    expect(projection.activeCampaign?.id).toBe("c1");
    projection = clearCampaignEvent();
    expect(projection.activeCampaign).toBeNull();
  });
});
