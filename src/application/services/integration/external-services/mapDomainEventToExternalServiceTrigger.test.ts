import { describe, expect, it } from "vitest";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createSettingsAccountKey } from "@domain/settings/SettingsAccountKey.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ExternalServicesCallContextTracker } from "./ExternalServicesCallContextTracker.js";
import { mapDomainEventToExternalServiceTrigger } from "./mapDomainEventToExternalServiceTrigger.js";

const profileKey = createSettingsAccountKey("agent@example.test");
const correlationId = "test-correlation" as CorrelationId;

function event(type: string, payload: Readonly<Record<string, unknown>> = {}): DomainEvent {
  return {
    type,
    correlationId,
    occurredAt: "2026-07-29T19:00:00.000Z",
    ...payload,
  };
}

function context(
  tracker: ExternalServicesCallContextTracker,
  focusedCallId: string | null,
) {
  return { profileKey, userLogin: "agent", focusedCallId, tracker };
}

describe("mapDomainEventToExternalServiceTrigger", () => {
  it("maps every stable call code and keeps unsupported facts inert", () => {
    const scenarios: ReadonlyArray<
      Readonly<{ type: string; expected: string; reason?: string }>
    > = [
      { type: "IncomingCallRingingStarted", expected: "incoming_ringing" },
      { type: "CallAnswered", expected: "call_answered" },
      { type: "CallEnded", expected: "call_ended" },
      { type: "CallRejected", expected: "call_rejected", reason: "busy" },
      { type: "CallRejectedByDnd", expected: "call_rejected" },
      { type: "IncomingCallEndedBeforeAnswer", expected: "call_missed" },
    ];
    for (const scenario of scenarios) {
      const tracker = new ExternalServicesCallContextTracker();
      mapDomainEventToExternalServiceTrigger(
        event("IncomingCallReceived", { callId: "call-a", phoneNumber: "100" }),
        context(tracker, "call-a"),
      );
      expect(
        mapDomainEventToExternalServiceTrigger(
          event(scenario.type, {
            callId: "call-a",
            ...(scenario.reason !== undefined ? { reason: scenario.reason } : {}),
          }),
          context(tracker, "call-a"),
        ),
      ).toMatchObject({ trigger: { eventType: scenario.expected } });
    }
    const tracker = new ExternalServicesCallContextTracker();
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("OutgoingCallRequested", { callId: "call-b", phoneNumber: "200" }),
        context(tracker, "call-b"),
      ),
    ).toMatchObject({ trigger: { eventType: "outgoing_connecting" } });
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("CallHeld", { callId: "call-b" }),
        context(tracker, "call-b"),
      ),
    ).toBeNull();
  });

  it("tracks incoming calls and maps only the focused ringing fact", () => {
    const tracker = new ExternalServicesCallContextTracker();
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("IncomingCallReceived", { callId: "call-a", phoneNumber: "100" }),
        context(tracker, "call-a"),
      ),
    ).toBeNull();
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("IncomingCallRingingStarted", { callId: "call-a" }),
        context(tracker, "call-a"),
      ),
    ).toMatchObject({
      focusedAtEvent: true,
      trigger: {
        eventType: "incoming_ringing",
        callerId: "100",
        calledId: "agent",
        callDirection: "inbound",
      },
    });
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("IncomingCallRingingStarted", { callId: "call-a" }),
        context(tracker, "other-call"),
      ),
    ).toMatchObject({ focusedAtEvent: false });
  });

  it("keeps missed and rejected distinct while preserving terminal reason for ended", () => {
    const tracker = new ExternalServicesCallContextTracker();
    mapDomainEventToExternalServiceTrigger(
      event("IncomingCallReceived", { callId: "call-a", phoneNumber: "100" }),
      context(tracker, "call-a"),
    );
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("IncomingCallEndedBeforeAnswer", { callId: "call-a" }),
        context(tracker, "call-a"),
      ),
    ).toMatchObject({
      trigger: { eventType: "call_missed", hangupReason: "missed" },
    });
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("CallEnded", { callId: "call-a" }),
        context(tracker, "call-a"),
      ),
    ).toMatchObject({
      trigger: { eventType: "call_ended", hangupReason: "missed" },
    });
  });

  it("joins campaign clears and excludes unsupported campaign reasons", () => {
    const tracker = new ExternalServicesCallContextTracker();
    const offer = event("OperatorCampaignOffered", {
      campaignId: "campaign-1",
      progressive: true,
      clientPhone: "100",
      companyTitle: "Company",
      strategyTitle: "Strategy",
      selectionTitle: "Selection",
      queueTitle: "Queue",
    });
    expect(mapDomainEventToExternalServiceTrigger(offer, context(tracker, null))).toMatchObject({
      trigger: { eventType: "campaign_offered", campaign: { campaign_id: "campaign-1" } },
    });
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("OperatorCampaignCleared", { campaignId: "campaign-1", reasonCode: "accepted" }),
        context(tracker, null),
      ),
    ).toMatchObject({
      trigger: { eventType: "campaign_accepted", campaign: { campaign_company: "Company" } },
    });
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("OperatorCampaignCleared", { campaignId: "campaign-2", reasonCode: "call_ended" }),
        context(tracker, null),
      ),
    ).toBeNull();
  });

  it("maps safe ACD fields once and ignores unrelated domain facts", () => {
    const tracker = new ExternalServicesCallContextTracker();
    const acd = event("CallOcpContextResolved", {
      callId: "call-a",
      direction: "incoming",
      queueName: "Queue",
      phase: "progress",
      localPartyLabel: "agent",
      ocp: {
        mainAcallId: "must-not-leak",
        acallId: "must-not-leak",
        event: "queued",
        callerId: "100",
        calledId: "agent",
        queue: "Queue",
      },
    });
    expect(mapDomainEventToExternalServiceTrigger(acd, context(tracker, "call-a"))).toMatchObject({
      trigger: {
        eventType: "acd_context_appeared",
        acd: { queue_name: "Queue", acd_phase: "progress", acd_event: "queued" },
      },
    });
    expect(mapDomainEventToExternalServiceTrigger(acd, context(tracker, "call-a"))).toBeNull();
    expect(
      mapDomainEventToExternalServiceTrigger(event("CallHeld", { callId: "call-a" }), context(tracker, "call-a")),
    ).toBeNull();
  });

  it("maps only the transition into POST_CALL_PROCESSING as an operator-level trigger", () => {
    const tracker = new ExternalServicesCallContextTracker();
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("OperatorStatusChanged", {
          operatorId: 5,
          prevStatus: OperatorStatus.TALKING,
          newStatus: OperatorStatus.POST_CALL_PROCESSING,
          reasonId: OperatorStatus.POST_CALL_PROCESSING,
        }),
        context(tracker, null),
      ),
    ).toMatchObject({
      focusedAtEvent: true,
      trigger: {
        eventType: "post_call_processing",
        userLogin: "agent",
      },
    });
    expect(
      mapDomainEventToExternalServiceTrigger(
        event("OperatorStatusChanged", {
          operatorId: 5,
          prevStatus: OperatorStatus.READY,
          newStatus: OperatorStatus.BREAK,
          reasonId: 7,
        }),
        context(tracker, null),
      ),
    ).toBeNull();
  });
});
