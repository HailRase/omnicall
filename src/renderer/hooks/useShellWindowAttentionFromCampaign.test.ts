// @vitest-environment jsdom
/**
 * Unit tests for OCP preview campaign → shell raise edge hook.
 */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  initialCampaignEventProjection,
  type CampaignEventProjection,
} from "@application/index.js";
import { useShellWindowAttentionFromCampaign } from "./useShellWindowAttentionFromCampaign.js";

type CampaignPayload = NonNullable<CampaignEventProjection["activeCampaign"]>;

function previewCampaign(
  overrides: Partial<CampaignPayload> = {},
): CampaignPayload {
  return {
    id: "camp_1",
    callId: "call_1",
    queueId: "q1",
    abonentId: "a1",
    companyId: "c1",
    queueTitle: "Support",
    selectionId: "s1",
    isAnswered: false,
    progressive: false,
    clientPhone: "+15551237890",
    companyTitle: "Acme",
    strategyTitle: "Strat",
    selectionTitle: "Sel",
    strategyCallId: "sc1",
    ...overrides,
  };
}

describe("useShellWindowAttentionFromCampaign", () => {
  it("raises once per preview campaign id", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const withOffer: CampaignEventProjection = {
      phase: "preview_offered",
      activeCampaign: previewCampaign({ id: "camp_offer_1" }),
      progressiveContext: null,
      pendingPreview: null,
    };

    const { rerender } = renderHook(
      (props: { campaignEventProjection: CampaignEventProjection }) =>
        useShellWindowAttentionFromCampaign({
          ...props,
          raiseWindow,
        }),
      {
        initialProps: { campaignEventProjection: withOffer },
      },
    );

    expect(raiseWindow).toHaveBeenCalledTimes(1);
    expect(raiseWindow).toHaveBeenCalledWith({
      reason: "ocp_campaign_offer",
      dedupeKey: "camp_offer_1",
    });

    rerender({ campaignEventProjection: { ...withOffer } });
    expect(raiseWindow).toHaveBeenCalledTimes(1);
  });

  it("does not raise for progressive-only campaign context", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const progressiveOnly: CampaignEventProjection = {
      phase: "progressive_offered",
      activeCampaign: null,
      progressiveContext: previewCampaign({
        id: "camp_prog_1",
        progressive: true,
      }),
      pendingPreview: null,
    };

    renderHook(() =>
      useShellWindowAttentionFromCampaign({
        campaignEventProjection: progressiveOnly,
        raiseWindow,
      }),
    );

    expect(raiseWindow).not.toHaveBeenCalled();
  });

  it("raises again after clear when a new preview campaign arrives", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const first: CampaignEventProjection = {
      phase: "preview_offered",
      activeCampaign: previewCampaign({ id: "camp_a" }),
      progressiveContext: null,
      pendingPreview: null,
    };

    const { rerender } = renderHook(
      (props: { campaignEventProjection: CampaignEventProjection }) =>
        useShellWindowAttentionFromCampaign({
          ...props,
          raiseWindow,
        }),
      {
        initialProps: { campaignEventProjection: first },
      },
    );

    rerender({
      campaignEventProjection: initialCampaignEventProjection(),
    });
    rerender({
      campaignEventProjection: {
        phase: "preview_offered",
        activeCampaign: previewCampaign({ id: "camp_b" }),
        progressiveContext: null,
        pendingPreview: null,
      },
    });

    expect(raiseWindow).toHaveBeenCalledTimes(2);
    expect(raiseWindow).toHaveBeenLastCalledWith({
      reason: "ocp_campaign_offer",
      dedupeKey: "camp_b",
    });
  });
});
