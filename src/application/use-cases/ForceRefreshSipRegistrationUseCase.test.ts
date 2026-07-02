import { describe, expect, it } from "vitest";
import { ForceRefreshSipRegistrationUseCase } from "./ForceRefreshSipRegistrationUseCase.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { createSipAccount, createSipAccountId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ForceRefreshSipRegistrationUseCase", () => {
  const accountId = createSipAccountId("agent");
  const account = createSipAccount(accountId, {
    username: "agent",
    password: "secret",
    server: "sip.example.com",
    domain: "example.com",
  });

  it("publishes registration requested and succeeds on force refresh", async () => {
    const correlationId = createCorrelationId();
    const events = new InMemoryDomainEventBus();
    const types: string[] = [];
    events.subscribe((event) => {
      types.push(event.type);
    });

    const gateway = new MockTelephonyGateway("success");
    await gateway.register({ account, correlationId: createCorrelationId() });

    const useCase = new ForceRefreshSipRegistrationUseCase(
      gateway,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ correlationId, accountId });
    expect(isErr(result)).toBe(false);
    expect(types).toEqual(["RegistrationRequested", "RegistrationSucceeded"]);
    expect(gateway.getForceRefreshInvocations()).toContain(correlationId);
  });
});
