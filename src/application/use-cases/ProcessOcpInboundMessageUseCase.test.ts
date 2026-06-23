import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { ProcessOcpInboundMessageUseCase } from "./ProcessOcpInboundMessageUseCase.js";
import { InMemoryOcpCallCorrelationRegistry } from "../read-models/InMemoryOcpCallCorrelationRegistry.js";
import { InMemoryOcpSyncReadModel } from "../read-models/InMemoryOcpSyncReadModel.js";
import {
  MockOcpSyncGateway,
  createSampleOcpQueueInfoRawMessage,
} from "@adapters/mock/MockOcpSyncGateway.js";
import {
  createCallId,
  createMainAcallId,
  createOcpCallCorrelation,
} from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

function seedOcpReady(events: InMemoryDomainEventBus): void {
  events.publish({
    type: "OcpAuthenticationSucceeded",
    correlationId: createCorrelationId(),
    occurredAt: new Date().toISOString(),
    sessionId: "session-1",
    agentId: "agent-001",
  });
}

describe("ProcessOcpInboundMessageUseCase", () => {
  it("publishes QueueInfoReceived on exact main_acallid match", () => {
    const events = new InMemoryDomainEventBus();
    const ocpSyncReadModel = new InMemoryOcpSyncReadModel(events);
    seedOcpReady(events);
    const registry = new InMemoryOcpCallCorrelationRegistry(events);
    registry.register(
      createOcpCallCorrelation(createCallId("call-1"), createMainAcallId("acall-exact")),
    );
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const gateway = new MockOcpSyncGateway();
    const useCase = new ProcessOcpInboundMessageUseCase(
      gateway,
      registry,
      ocpSyncReadModel,
      events,
      createTestLogger(),
    );

    published.length = 0;
    const result = useCase.execute({
      raw: createSampleOcpQueueInfoRawMessage("acall-exact", "Support"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toEqual({ action: "queue_info_published", callId: "call-1" });
    expect(published).toContain("QueueInfoReceived");
  });

  it("rejects substring mismatch without publishing event", () => {
    const events = new InMemoryDomainEventBus();
    const ocpSyncReadModel = new InMemoryOcpSyncReadModel(events);
    seedOcpReady(events);
    const registry = new InMemoryOcpCallCorrelationRegistry(events);
    registry.register(
      createOcpCallCorrelation(createCallId("call-1"), createMainAcallId("acall-full-id")),
    );
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new ProcessOcpInboundMessageUseCase(
      new MockOcpSyncGateway(),
      registry,
      ocpSyncReadModel,
      events,
      createTestLogger(),
    );

    const result = useCase.execute({
      raw: createSampleOcpQueueInfoRawMessage("acall-full", "Support"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toEqual({
      action: "queue_rejected",
      reason: "main_acallid_mismatch",
    });
    expect(published).not.toContain("QueueInfoReceived");
  });

  it("no-ops in SIP-only mode", () => {
    const events = new InMemoryDomainEventBus();
    const registry = new InMemoryOcpCallCorrelationRegistry(events);
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new ProcessOcpInboundMessageUseCase(
      new MockOcpSyncGateway(),
      registry,
      new InMemoryOcpSyncReadModel(events),
      events,
      createTestLogger(),
    );

    const result = useCase.execute({
      raw: createSampleOcpQueueInfoRawMessage("acall-1", "Support"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toEqual({ action: "noop", reason: "sip_only" });
    expect(published).toHaveLength(0);
  });
});
