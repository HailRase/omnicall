import { describe, expect, it, vi } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { ReregisterSipUseCase } from "./ReregisterSipUseCase.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { createSipAccount, createSipAccountId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ReregisterSipUseCase", () => {
  const accountId = createSipAccountId("agent");
  const account = createSipAccount(accountId, {
    username: "agent",
    password: "secret",
    server: "sip.example.com",
    domain: "example.com",
  });

  async function connectMockTransport(gateway: MockTelephonyGateway): Promise<void> {
    await gateway.register({
      account,
      correlationId: createCorrelationId(),
    });
  }

  it("publishes registration requested and succeeds on gateway reregister", async () => {
    const correlationId = createCorrelationId();
    const events = new InMemoryDomainEventBus();
    const types: string[] = [];
    events.subscribe((event) => {
      types.push(event.type);
    });

    const gateway = new MockTelephonyGateway("success");
    await connectMockTransport(gateway);

    const useCase = new ReregisterSipUseCase(
      gateway,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ correlationId, accountId });
    expect(isErr(result)).toBe(false);
    expect(types).toEqual([
      "ManualSipReregisterRequested",
      "RegistrationRequested",
      "RegistrationSucceeded",
    ]);
  });

  it("publishes registration failed when gateway reregister fails", async () => {
    const correlationId = createCorrelationId();
    const events = new InMemoryDomainEventBus();
    let failureReason: string | undefined;

    events.subscribe((event) => {
      if (event.type === "RegistrationFailed") {
        failureReason = String(event["reason"]);
      }
    });

    const gateway = new MockTelephonyGateway("failure");
    await gateway.simulateTransportConnected({ correlationId: createCorrelationId() });

    const useCase = new ReregisterSipUseCase(
      gateway,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ correlationId, accountId });
    expect(isErr(result)).toBe(true);
    expect(failureReason).toBe("authentication_error");
  });

  it("logs structured failure when gateway throws", async () => {
    const correlationId = createCorrelationId();
    const events = new InMemoryDomainEventBus();
    const telephony = new MockTelephonyGateway("success");
    await connectMockTransport(telephony);
    vi.spyOn(telephony, "reregister").mockRejectedValue(new Error("network down"));

    const useCase = new ReregisterSipUseCase(telephony, events, createTestLogger());
    const result = await useCase.execute({ correlationId });

    expect(isErr(result)).toBe(true);
  });
});
