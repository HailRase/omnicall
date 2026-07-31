import { describe, expect, it } from "vitest";
import {
  clearCampaignEvent,
  initialCampaignEventProjection,
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
  it("starts idle and routes non-progressive to preview_offered", () => {
    const { projection, outcome } = reduceCampaignEventFromPayload(
      initialCampaignEventProjection(),
      base,
    );
    expect(projection.phase).toBe("preview_offered");
    expect(projection.activeCampaign?.id).toBe("c1");
    expect(projection.progressiveContext).toBeNull();
    expect(projection.pendingPreview).toBeNull();
    expect(outcome.kind).toBe("offered");
  });

  it("routes progressive to progressive_offered without modal slot", () => {
    const { projection, outcome } = reduceCampaignEventFromPayload(
      initialCampaignEventProjection(),
      { ...base, progressive: true },
    );
    expect(projection.phase).toBe("progressive_offered");
    expect(projection.activeCampaign).toBeNull();
    expect(projection.progressiveContext?.id).toBe("c1");
    expect(outcome).toMatchObject({ kind: "progressive", emitOffered: true });
  });

  it("holds a second preview until clear promotes it", () => {
    const first = reduceCampaignEventFromPayload(
      initialCampaignEventProjection(),
      base,
    ).projection;
    const held = reduceCampaignEventFromPayload(first, {
      ...base,
      id: "c2",
    });
    expect(held.outcome.kind).toBe("held");
    expect(held.projection.activeCampaign?.id).toBe("c1");
    expect(held.projection.pendingPreview?.id).toBe("c2");
    expect(held.projection.phase).toBe("preview_offered");

    const cleared = clearCampaignEvent(held.projection);
    expect(cleared.clearedId).toBe("c1");
    expect(cleared.promoted?.id).toBe("c2");
    expect(cleared.projection.activeCampaign?.id).toBe("c2");
    expect(cleared.projection.pendingPreview).toBeNull();
    expect(cleared.projection.phase).toBe("preview_offered");
  });

  it("keeps preview modal when progressive arrives (no dual wipe)", () => {
    const preview = reduceCampaignEventFromPayload(
      initialCampaignEventProjection(),
      base,
    ).projection;
    const withProgressive = reduceCampaignEventFromPayload(preview, {
      ...base,
      id: "c-prog",
      progressive: true,
    });
    expect(withProgressive.projection.activeCampaign?.id).toBe("c1");
    expect(withProgressive.projection.progressiveContext?.id).toBe("c-prog");
    expect(withProgressive.outcome).toMatchObject({
      kind: "progressive",
      emitOffered: false,
    });
  });

  it("clears to idle when no pending", () => {
    const offered = reduceCampaignEventFromPayload(
      initialCampaignEventProjection(),
      base,
    ).projection;
    const cleared = clearCampaignEvent(offered);
    expect(cleared.clearedId).toBe("c1");
    expect(cleared.promoted).toBeNull();
    expect(cleared.projection.phase).toBe("idle");
  });
});
