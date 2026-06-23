import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("CallEngine blind transfer", () => {
  it("completes blind transfer happy path", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      blindTransferScenario: "success",
    });
    const engine = createEngine(telephony);
    await engine.makeCall({
      callId: createCallId("xfer-1"),
      phoneNumber: createPhoneNumber("+12025550300"),
    });

    const result = await engine.blindTransfer({
      callId: createCallId("xfer-1"),
      targetNumber: "+12025550301",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.state).toBe("Ended");
    expect(telephony.getBlindTransferCalls()).toHaveLength(1);
  });

  it("restores non-transferring state on failure", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      blindTransferScenario: "failure",
    });
    const events = new InMemoryDomainEventBus();
    const engine = createEngine(telephony, events);
    await engine.makeCall({
      callId: createCallId("xfer-2"),
      phoneNumber: createPhoneNumber("+12025550302"),
    });

    const transferResult = await engine.blindTransfer({
      callId: createCallId("xfer-2"),
      targetNumber: "+12025550303",
    });
    expect(transferResult.ok).toBe(false);

    const holdResult = await engine.holdCall({ callId: createCallId("xfer-2") });
    expect(holdResult.ok).toBe(true);
    if (!holdResult.ok) {
      return;
    }
    expect(holdResult.value.state).toBe("Held");
  });

  it("rejects blind transfer for invalid target", async () => {
    const engine = createEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
    );
    await engine.makeCall({
      callId: createCallId("xfer-3"),
      phoneNumber: createPhoneNumber("+12025550304"),
    });

    const result = await engine.blindTransfer({
      callId: createCallId("xfer-3"),
      targetNumber: "invalid",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe("invalid_target");
  });

  it("completes blind transfer from held call", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      blindTransferScenario: "success",
    });
    const engine = createEngine(telephony);
    const callId = createCallId("xfer-held-1");
    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550310"),
    });
    const holdResult = await engine.holdCall({ callId });
    expect(holdResult.ok).toBe(true);

    const result = await engine.blindTransfer({
      callId,
      targetNumber: "+12025550311",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.state).toBe("Ended");
    expect(telephony.getBlindTransferCalls()).toEqual([
      { callId: "xfer-held-1", targetNumber: "+12025550311" },
    ]);
  });
});

function createEngine(
  telephony: MockTelephonyGateway,
  events: InMemoryDomainEventBus = new InMemoryDomainEventBus(),
): CallEngine {
  return new CallEngine(
    telephony,
    new MockMediaGateway(),
    new InMemorySettingsRepository(),
    events,
    createTestLogger(),
  );
}
