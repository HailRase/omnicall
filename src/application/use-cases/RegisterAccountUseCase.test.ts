import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { RegisterAccountUseCase } from "./RegisterAccountUseCase.js";
import {
  createSipAccount,
  createSipAccountId,
} from "@domain/index.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("RegisterAccountUseCase", () => {
  const account = createSipAccount(createSipAccountId("agent"), {
    uri: "sip:agent@pbx",
    username: "agent",
    password: "secret",
    displayName: "Agent",
    registrar: "sip:pbx",
  });

  it("publishes registration success events", async () => {
    const events = new InMemoryDomainEventBus();
    const types: string[] = [];
    events.subscribe((event) => {
      types.push(event.type);
    });

    const useCase = new RegisterAccountUseCase(
      new MockTelephonyGateway("success"),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ account });
    expect(result.ok).toBe(true);
    expect(types).toEqual([
      "RegistrationRequested",
      "RegistrationSucceeded",
    ]);
  });

  it("publishes registration failure events", async () => {
    const events = new InMemoryDomainEventBus();
    let failureReason: string | undefined;

    events.subscribe((event) => {
      if (event.type === "RegistrationFailed") {
        failureReason = String(event["reason"]);
      }
    });

    const useCase = new RegisterAccountUseCase(
      new MockTelephonyGateway("failure"),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ account });
    expect(result.ok).toBe(false);
    expect(failureReason).toContain("SIP registration failed");
  });
});
