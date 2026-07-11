import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
} from "./incomingCallProjection.js";

describe("incomingCallProjection", () => {
  it("maps incoming call to ringing projection", () => {
    const correlationId = createCorrelationId();
    const received = reduceIncomingCallProjection(initialIncomingCallProjection(), {
      type: "IncomingCallReceived",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-1",
      phoneNumber: "+12025550100",
      direction: "incoming",
    });
    const ringing = reduceIncomingCallProjection(received, {
      type: "IncomingCallRingingStarted",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-1",
      autoAnswerTimeoutSec: 5,
      autoAnswerExpiresAt: new Date(Date.now() + 5000).toISOString(),
    });

    expect(ringing.visible).toBe(true);
    expect(ringing.uiState).toBe("autoAnswerCountdown");
    expect(ringing.autoAnswerTimeoutSec).toBe(5);
    expect(ringing.autoAnswerExpiresAt).not.toBeNull();
    expect(ringing.incomingRemoteVideoOffered).toBeNull();
  });

  it("maps incoming remote video offered for ringing call", () => {
    const correlationId = createCorrelationId();
    const received = reduceIncomingCallProjection(initialIncomingCallProjection(), {
      type: "IncomingCallReceived",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-1",
      phoneNumber: "+12025550100",
      direction: "incoming",
    });
    const withOffer = reduceIncomingCallProjection(received, {
      type: "IncomingRemoteVideoOfferedChanged",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-1",
      offered: false,
    });
    expect(withOffer.incomingRemoteVideoOffered).toBe(false);
  });

  it("preserves early video-offered flag across IncomingCallReceived", () => {
    const correlationId = createCorrelationId();
    const early = reduceIncomingCallProjection(initialIncomingCallProjection(), {
      type: "IncomingRemoteVideoOfferedChanged",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-2",
      offered: true,
    });
    expect(early.incomingRemoteVideoOffered).toBe(true);

    const received = reduceIncomingCallProjection(early, {
      type: "IncomingCallReceived",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-2",
      phoneNumber: "+12025550111",
      direction: "incoming",
    });
    expect(received.callId).toBe("in-2");
    expect(received.incomingRemoteVideoOffered).toBe(true);
  });
});
