import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { UnregisterAccountUseCase } from "./UnregisterAccountUseCase.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("UnregisterAccountUseCase", () => {
  it("publishes unregistration success events", async () => {
    const events = new InMemoryDomainEventBus();
    const types: string[] = [];
    events.subscribe((event) => {
      types.push(event.type);
    });

    const useCase = new UnregisterAccountUseCase(
      new MockTelephonyGateway({ registrationScenario: "success" }),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({});
    expect(result.ok).toBe(true);
    expect(types).toEqual(["UnregistrationRequested", "UnregistrationSucceeded"]);
  });
});
