import { describe, expect, it } from "vitest";
import { CallEngine } from "@application/services/CallEngine.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { HandleIncomingCallUseCase } from "./HandleIncomingCallUseCase.js";

describe("HandleIncomingCallUseCase", () => {
  it("handles incoming call through call engine", async () => {
    const callEngine = new CallEngine(
      new MockTelephonyGateway(),
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    const useCase = new HandleIncomingCallUseCase(callEngine);
    const result = await useCase.execute({
      notification: {
        callId: createCallId("incoming-handle-1"),
        remoteNumber: "+12025550170",
        correlationId: createCorrelationId(),
      },
    });
    expect(result.ok).toBe(true);
  });
});
