import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { SipConnectionJournal } from "./SipConnectionJournal.js";
import { createSipTransportDisconnectedEvent } from "@domain/telephony/events/sipTransportEvents.js";

describe("SipConnectionJournal", () => {
  it("records transport and registration events in ring buffer order", () => {
    const journal = new SipConnectionJournal(2);
    const correlationId = createCorrelationId();

    journal.recordDomainEvent(
      createSipTransportDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );
    journal.record({
      correlationId,
      category: "registration",
      eventType: "RegistrationFailed",
      detail: "service_unavailable",
    });
    journal.record({
      correlationId,
      category: "transport",
      eventType: "SipTransportReconnectScheduled",
      detail: null,
    });

    const entries = journal.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.eventType).toBe("RegistrationFailed");
    expect(entries[1]?.eventType).toBe("SipTransportReconnectScheduled");
  });

  it("clears journal entries", () => {
    const journal = new SipConnectionJournal();
    journal.record({
      correlationId: createCorrelationId(),
      category: "transport",
      eventType: "SipTransportConnected",
      detail: null,
    });
    journal.clear();
    expect(journal.getEntries()).toHaveLength(0);
  });
});
