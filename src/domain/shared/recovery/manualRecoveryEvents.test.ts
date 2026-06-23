import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createManualReconnectRequestedEvent } from "./manualRecoveryEvents.js";

describe("manualRecoveryEvents", () => {
  it("creates ManualReconnectRequested with channel", () => {
    const correlationId = createCorrelationId();
    const event = createManualReconnectRequestedEvent(correlationId, { channel: "sip" });

    expect(event.type).toBe("ManualReconnectRequested");
    expect(event.correlationId).toBe(correlationId);
    expect(event["channel"]).toBe("sip");
  });
});
