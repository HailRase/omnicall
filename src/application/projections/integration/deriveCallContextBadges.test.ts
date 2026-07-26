import { describe, expect, it } from "vitest";
import type { OcpCampaignEventPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import { deriveCallContextBadges } from "./deriveCallContextBadges.js";
import type { CallOcpContextEntry } from "./callOcpContextProjection.js";

const progressive: OcpCampaignEventPayload = {
  id: "cmp-1",
  callId: "ocp-call",
  queueId: "q1",
  abonentId: "a1",
  companyId: "co1",
  queueTitle: "Campaign Queue",
  selectionId: "s1",
  isAnswered: false,
  progressive: true,
  clientPhone: "+100",
  companyTitle: "Acme",
  strategyTitle: "Strat",
  selectionTitle: "Sel",
  strategyCallId: "sc1",
};

function entry(
  overrides: Partial<CallOcpContextEntry> & Pick<CallOcpContextEntry, "callId">,
): CallOcpContextEntry {
  return {
    direction: "incoming",
    acallId: null,
    queueName: null,
    resolveState: "pending",
    ...overrides,
  };
}

describe("deriveCallContextBadges", () => {
  it("hides all badges when OCP is not authenticated", () => {
    const badges = deriveCallContextBadges({
      callId: "c1",
      remotePhone: "+100",
      ocpAuthenticated: false,
      entry: entry({ callId: "c1", resolveState: "resolved", queueName: "Q" }),
      campaign: { activeCampaign: null, progressiveContext: progressive },
    });
    expect(badges).toEqual([]);
  });

  it("shows pending then resolved queue for incoming; hides empty queue", () => {
    expect(
      deriveCallContextBadges({
        callId: "c1",
        remotePhone: "+1",
        ocpAuthenticated: true,
        entry: entry({ callId: "c1", resolveState: "pending" }),
        campaign: { activeCampaign: null, progressiveContext: null },
      }).map((b) => b.kind),
    ).toEqual(["queuePending"]);

    expect(
      deriveCallContextBadges({
        callId: "c1",
        remotePhone: "+1",
        ocpAuthenticated: true,
        entry: entry({
          callId: "c1",
          resolveState: "resolved",
          queueName: "Support",
        }),
        campaign: { activeCampaign: null, progressiveContext: null },
      }),
    ).toEqual([{ kind: "queue", value: "Support" }]);

    expect(
      deriveCallContextBadges({
        callId: "c1",
        remotePhone: "+1",
        ocpAuthenticated: true,
        entry: entry({
          callId: "c1",
          resolveState: "resolved",
          queueName: null,
        }),
        campaign: { activeCampaign: null, progressiveContext: null },
      }),
    ).toEqual([]);
  });

  it("prefers OCP queue over campaign queueTitle and adds campaign badges", () => {
    const badges = deriveCallContextBadges({
      callId: "c1",
      remotePhone: "+100",
      ocpAuthenticated: true,
      entry: entry({
        callId: "c1",
        resolveState: "resolved",
        queueName: "ACD",
      }),
      campaign: { activeCampaign: null, progressiveContext: progressive },
    });
    expect(badges).toEqual([
      { kind: "queue", value: "ACD" },
      { kind: "progressive" },
      { kind: "company", value: "Acme" },
      { kind: "selection", value: "Sel" },
    ]);
  });

  it("does not show queue for outgoing without campaign phone match", () => {
    const badges = deriveCallContextBadges({
      callId: "c1",
      remotePhone: "+999",
      ocpAuthenticated: true,
      entry: entry({
        callId: "c1",
        direction: "outgoing",
        resolveState: "resolved",
        queueName: "ShouldHide",
      }),
      campaign: { activeCampaign: null, progressiveContext: null },
    });
    expect(badges).toEqual([]);
  });
});
