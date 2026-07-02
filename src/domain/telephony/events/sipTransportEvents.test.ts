import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createManualSipReregisterRequestedEvent,
  createManualSipTransportReconnectRequestedEvent,
  createSipRegistrationClearedEvent,
  createSipSessionActivatedEvent,
  createSipSessionResetEvent,
  createSipTransportConnectedEvent,
  createSipTransportDisconnectedEvent,
  createSipTransportReconnectScheduledEvent,
} from "./sipTransportEvents.js";

describe("sipTransportEvents", () => {
  const correlationId = createCorrelationId();

  it("creates SipSessionActivated", () => {
    const event = createSipSessionActivatedEvent(correlationId);
    expect(event.type).toBe("SipSessionActivated");
  });

  it("creates SipSessionReset", () => {
    const event = createSipSessionResetEvent(correlationId);
    expect(event.type).toBe("SipSessionReset");
  });

  it("creates SipTransportConnected", () => {
    const event = createSipTransportConnectedEvent(correlationId);
    expect(event.type).toBe("SipTransportConnected");
  });

  it("creates SipTransportDisconnected with reason", () => {
    const event = createSipTransportDisconnectedEvent(correlationId, {
      reason: "connection_error",
    });
    expect(event.type).toBe("SipTransportDisconnected");
    expect(event.reason).toBe("connection_error");
  });

  it("creates SipRegistrationCleared on transport loss", () => {
    const event = createSipRegistrationClearedEvent(correlationId, {
      reason: "transport_disconnected",
    });
    expect(event.type).toBe("SipRegistrationCleared");
    expect(event.reason).toBe("transport_disconnected");
  });

  it("creates SipTransportReconnectScheduled", () => {
    const event = createSipTransportReconnectScheduledEvent(correlationId, {
      attemptNumber: 2,
      delayMs: 5000,
    });
    expect(event.type).toBe("SipTransportReconnectScheduled");
    expect(event.attemptNumber).toBe(2);
    expect(event.delayMs).toBe(5000);
  });

  it("creates manual action events", () => {
    expect(createManualSipTransportReconnectRequestedEvent(correlationId).type).toBe(
      "ManualSipTransportReconnectRequested",
    );
    expect(createManualSipReregisterRequestedEvent(correlationId).type).toBe(
      "ManualSipReregisterRequested",
    );
  });
});
