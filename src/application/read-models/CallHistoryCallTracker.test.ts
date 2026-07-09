import {
  createCallAnsweredEvent,
  createCallEndedEvent,
  createCallFailedEvent,
  createCallHangupRequestedEvent,
  createCallId,
  createCallRejectedEvent,
  createIncomingCallEndedBeforeAnswerEvent,
  createIncomingCallReceivedEvent,
  createOutgoingCallRequestedEvent,
  createPhoneNumber,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { describe, expect, it } from "vitest";
import { CallHistoryCallTracker } from "./CallHistoryCallTracker.js";

describe("CallHistoryCallTracker", () => {
  it("tracks outgoing unanswered remote end without local hangup", () => {
    const tracker = new CallHistoryCallTracker();
    const callId = createCallId("out-1");
    const correlationId = createCorrelationId();

    expect(
      tracker.consume(
        createOutgoingCallRequestedEvent(correlationId, {
          callId,
          phoneNumber: createPhoneNumber("+12025550100"),
        }),
      ),
    ).toBeNull();

    const snapshot = tracker.consume(createCallEndedEvent(correlationId, { callId }));
    expect(snapshot).toMatchObject({
      callId,
      direction: "outgoing",
      remoteNumber: "+12025550100",
      answeredAt: null,
      wasAnswered: false,
      failed: false,
      localHangup: false,
      remoteCancelBeforeAnswer: false,
    });
  });

  it("tracks local hangup and answeredAt for completed call", () => {
    const tracker = new CallHistoryCallTracker();
    const callId = createCallId("out-2");
    const correlationId = createCorrelationId();

    tracker.consume(
      createOutgoingCallRequestedEvent(correlationId, {
        callId,
        phoneNumber: createPhoneNumber("+12025550101"),
      }),
    );
    const answered = createCallAnsweredEvent(correlationId, { callId });
    tracker.consume(answered);
    tracker.consume(createCallHangupRequestedEvent(correlationId, { callId }));
    const snapshot = tracker.consume(createCallEndedEvent(correlationId, { callId }));

    expect(snapshot?.wasAnswered).toBe(true);
    expect(snapshot?.answeredAt).toBe(answered.occurredAt);
    expect(snapshot?.localHangup).toBe(true);
  });

  it("marks incoming remote cancel before answer", () => {
    const tracker = new CallHistoryCallTracker();
    const callId = createCallId("in-1");
    const correlationId = createCorrelationId();

    tracker.consume(
      createIncomingCallReceivedEvent(correlationId, {
        callId,
        phoneNumber: createPhoneNumber("+12025550102"),
        direction: "incoming",
      }),
    );
    const snapshot = tracker.consume(
      createIncomingCallEndedBeforeAnswerEvent(correlationId, { callId }),
    );

    expect(snapshot?.direction).toBe("incoming");
    expect(snapshot?.wasAnswered).toBe(false);
    expect(snapshot?.localHangup).toBe(false);
    expect(snapshot?.remoteCancelBeforeAnswer).toBe(true);
  });

  it("finalizes local reject as local hangup", () => {
    const tracker = new CallHistoryCallTracker();
    const callId = createCallId("in-2");
    const correlationId = createCorrelationId();

    tracker.consume(
      createIncomingCallReceivedEvent(correlationId, {
        callId,
        phoneNumber: createPhoneNumber("+12025550104"),
        direction: "incoming",
      }),
    );
    const snapshot = tracker.consume(
      createCallRejectedEvent(correlationId, {
        callId,
        reason: null,
      }),
    );

    expect(snapshot?.localHangup).toBe(true);
    expect(snapshot?.wasAnswered).toBe(false);
    expect(snapshot?.remoteCancelBeforeAnswer).toBe(false);
  });

  it("marks failed calls without local hangup", () => {
    const tracker = new CallHistoryCallTracker();
    const callId = createCallId("out-3");
    const correlationId = createCorrelationId();

    tracker.consume(
      createOutgoingCallRequestedEvent(correlationId, {
        callId,
        phoneNumber: createPhoneNumber("+12025550103"),
      }),
    );
    const snapshot = tracker.consume(
      createCallFailedEvent(correlationId, {
        callId,
        reason: "busy",
        details: "486",
      }),
    );

    expect(snapshot?.failed).toBe(true);
    expect(snapshot?.localHangup).toBe(false);
  });
});
