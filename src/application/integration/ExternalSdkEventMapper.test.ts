import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createIncomingCallReceivedEvent } from "@domain/telephony/events/callEvents.js";
import { createCallId } from "@domain/telephony/CallId.js";
import { createPhoneNumber } from "@domain/telephony/PhoneNumber.js";

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
});
