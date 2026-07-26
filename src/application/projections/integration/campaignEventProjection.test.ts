import { describe, expect, it } from "vitest";
import {
  clearCampaignEvent,
  reduceCampaignEventFromPayload,
} from "./campaignEventProjection.js";
import type { OcpCampaignEventPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

const base: OcpCampaignEventPayload = {
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
  it("routes non-progressive to activeCampaign modal slot", () => {
    const projection = reduceCampaignEventFromPayload(base);
    expect(projection.activeCampaign?.id).toBe("c1");
    expect(projection.progressiveContext).toBeNull();
  });

  it("routes progressive to progressiveContext without modal slot", () => {
    const projection = reduceCampaignEventFromPayload({
      ...base,
      progressive: true,
    });
    expect(projection.activeCampaign).toBeNull();
    expect(projection.progressiveContext?.id).toBe("c1");
  });

  it("clears both slots", () => {
    let projection = reduceCampaignEventFromPayload(base);
    projection = clearCampaignEvent();
    expect(projection.activeCampaign).toBeNull();
    expect(projection.progressiveContext).toBeNull();
  });
});
