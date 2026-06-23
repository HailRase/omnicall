import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createDlgStopRequestedEvent, createDlgStopSentEvent } from "./dlgStopEvents.js";

describe("dlgStopEvents", () => {
  const correlationId = createCorrelationId();
  const callId = createCallId("call-dlg-1");
  const mainAcallId = createMainAcallId("acall-dlg-1");

  it("creates DlgStopRequested with trigger", () => {
    const event = createDlgStopRequestedEvent(correlationId, {
      callId,
      mainAcallId,
      trigger: "call_ended",
    });

    expect(event.type).toBe("DlgStopRequested");
    expect(event.callId).toBe("call-dlg-1");
    expect(event.mainAcallId).toBe("acall-dlg-1");
    expect(event.trigger).toBe("call_ended");
  });

  it("creates DlgStopSent after gateway confirm", () => {
    const event = createDlgStopSentEvent(correlationId, {
      callId,
      mainAcallId,
      trigger: "call_failed",
    });

    expect(event.type).toBe("DlgStopSent");
    expect(event.trigger).toBe("call_failed");
  });
});
