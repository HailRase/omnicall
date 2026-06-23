import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { InMemoryOcpCallCorrelationRegistry } from "./InMemoryOcpCallCorrelationRegistry.js";
import { createCallId, createMainAcallId, createOcpCallCorrelation } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("InMemoryOcpCallCorrelationRegistry", () => {
  it("registers and retrieves by callId and mainAcallId", () => {
    const registry = new InMemoryOcpCallCorrelationRegistry();
    const correlation = createOcpCallCorrelation(
      createCallId("call-1"),
      createMainAcallId("acall-1"),
    );

    registry.register(correlation);

    expect(registry.getByCallId(createCallId("call-1"))).toEqual(correlation);
    expect(registry.getByMainAcallId(createMainAcallId("acall-1"))).toEqual(correlation);
    expect(registry.listAll()).toHaveLength(1);
  });

  it("removes correlation on CallEnded event", () => {
    const events = new InMemoryDomainEventBus();
    const registry = new InMemoryOcpCallCorrelationRegistry(events);
    registry.register(
      createOcpCallCorrelation(createCallId("call-2"), createMainAcallId("acall-2")),
    );

    events.publish({
      type: "CallEnded",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-2",
    });

    expect(registry.getByCallId(createCallId("call-2"))).toBeNull();
  });

  it("clears all correlations on OcpAuthenticationFailed", () => {
    const events = new InMemoryDomainEventBus();
    const registry = new InMemoryOcpCallCorrelationRegistry(events);
    registry.register(
      createOcpCallCorrelation(createCallId("call-3"), createMainAcallId("acall-3")),
    );

    events.publish({
      type: "OcpAuthenticationFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      reason: "invalid_token",
    });

    expect(registry.listAll()).toHaveLength(0);
  });
});
