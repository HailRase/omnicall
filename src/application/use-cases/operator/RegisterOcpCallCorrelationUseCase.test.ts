import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { RegisterOcpCallCorrelationUseCase } from "./RegisterOcpCallCorrelationUseCase.js";
import { InMemoryOcpCallCorrelationRegistry } from "../../read-models/InMemoryOcpCallCorrelationRegistry.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("RegisterOcpCallCorrelationUseCase", () => {
  it("registers correlation and publishes event", () => {
    const events = new InMemoryDomainEventBus();
    const registry = new InMemoryOcpCallCorrelationRegistry(events);
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new RegisterOcpCallCorrelationUseCase(
      registry,
      events,
      createTestLogger(),
    );

    const result = useCase.execute({
      callId: createCallId("call-1"),
      mainAcallId: createMainAcallId("acall-1"),
    });

    expect(result.ok).toBe(true);
    expect(published).toContain("OcpCallCorrelationRegistered");
    expect(registry.getByCallId(createCallId("call-1"))?.mainAcallId).toBe("acall-1");
  });

  it("rejects invalid callId", () => {
    const events = new InMemoryDomainEventBus();
    const useCase = new RegisterOcpCallCorrelationUseCase(
      new InMemoryOcpCallCorrelationRegistry(),
      events,
      createTestLogger(),
    );

    const result = useCase.execute({
      callId: "",
      mainAcallId: createMainAcallId("acall-1"),
    });

    expect(isErr(result)).toBe(true);
  });
});
