import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createIncomingCallReceivedEvent } from "@domain/telephony/events/callEvents.js";
import { createCallId } from "@domain/telephony/CallId.js";
import { createPhoneNumber } from "@domain/telephony/PhoneNumber.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createOperatorStatusChangedEvent } from "@domain/integration/ocp/events/OperatorStatusChanged.js";
import { createOperatorSessionStartedEvent } from "@domain/integration/ocp/events/OperatorSessionStarted.js";
import { createOperatorSessionEndedEvent } from "@domain/integration/ocp/events/OperatorSessionEnded.js";
import { createOperatorLoggedOutEvent } from "@domain/integration/ocp/events/OperatorLoggedOut.js";

import { mapDomainEventToSdkPublicDraft } from "./ExternalSdkEventMapper.js";

describe("ExternalSdkEventMapper", () => {
  it("maps incoming call with redacted phone and omits campaign events", () => {
    const event = createIncomingCallReceivedEvent(createCorrelationId(), {
      callId: createCallId("call_map_001"),
      phoneNumber: createPhoneNumber("+15551237890"),
      direction: "incoming",
    });
    const draft = mapDomainEventToSdkPublicDraft(event);
    expect(draft).toMatchObject({
      type: "call:incoming",
      payload: {
        callId: "call_map_001",
        remoteNumber: "+*******7890",
        direction: "inbound",
      },
    });
    expect(
      mapDomainEventToSdkPublicDraft({
        type: "CampaignOffered",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
    ).toBeNull();
  });

  it("maps OperatorStatusChanged to coarse public status without OCP ids", () => {
    const draft = mapDomainEventToSdkPublicDraft(
      createOperatorStatusChangedEvent(createCorrelationId(), {
        operatorId: 42,
        prevStatus: OperatorStatus.READY,
        newStatus: OperatorStatus.BREAK,
        reasonId: 7,
        timestamp: Date.now(),
      }),
    );
    expect(draft).toEqual({
      type: "operator:status-changed",
      payload: {
        status: "break",
        reasonId: 7,
        reasonLabelKey: "ocp.operatorStatus.break",
      },
    });
    expect(JSON.stringify(draft)).not.toContain("operatorId");
    expect(JSON.stringify(draft)).not.toContain("42");
  });

  it("maps mid-call OperatorStatus to unknown", () => {
    const draft = mapDomainEventToSdkPublicDraft(
      createOperatorStatusChangedEvent(createCorrelationId(), {
        operatorId: 1,
        prevStatus: OperatorStatus.READY,
        newStatus: OperatorStatus.TALKING,
        reasonId: OperatorStatus.TALKING,
        timestamp: Date.now(),
      }),
    );
    expect(draft).toMatchObject({
      type: "operator:status-changed",
      payload: { status: "unknown" },
    });
  });

  it("maps OperatorSessionStarted and OperatorSessionEnded", () => {
    expect(
      mapDomainEventToSdkPublicDraft(
        createOperatorSessionStartedEvent(createCorrelationId(), {
          operatorId: 9,
          domain: "ocp.example.com",
          timestamp: Date.now(),
        }),
      ),
    ).toEqual({
      type: "operator:session-changed",
      payload: { connected: true },
    });
    expect(
      mapDomainEventToSdkPublicDraft(
        createOperatorSessionEndedEvent(createCorrelationId(), {
          operatorId: 9,
          reason: "logout",
          timestamp: Date.now(),
        }),
      ),
    ).toEqual({
      type: "operator:session-changed",
      payload: { connected: false },
    });
  });

  it("omits OperatorLoggedOut to avoid double disconnect fan-out", () => {
    expect(
      mapDomainEventToSdkPublicDraft(
        createOperatorLoggedOutEvent(createCorrelationId(), {
          operatorId: 9,
          reasonId: 3,
          timestamp: Date.now(),
        }),
      ),
    ).toBeNull();
  });
});
