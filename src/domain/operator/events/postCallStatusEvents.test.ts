import { describe, expect, it } from "vitest";
import { createCallId } from "../../telephony/CallId.js";
import { createBreakReason } from "../BreakReason.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPostCallStatusUpdatedEvent } from "./postCallStatusEvents.js";

describe("postCallStatusEvents", () => {
  it("creates PostCallStatusUpdated with typed payload", () => {
    const correlationId = createCorrelationId();
    const updatedAt = new Date().toISOString();
    const event = createPostCallStatusUpdatedEvent(correlationId, {
      callId: createCallId("call-1"),
      postCallStatus: "post_call",
      reason: createBreakReason("meeting"),
      updatedAt,
    });

    expect(event.type).toBe("PostCallStatusUpdated");
    expect(event.postCallStatus).toBe("post_call");
    expect(event.reason).toBe("meeting");
    expect(event.updatedAt).toBe(updatedAt);
  });
});
