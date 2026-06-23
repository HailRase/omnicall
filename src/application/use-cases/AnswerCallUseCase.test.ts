import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { AnswerCallUseCase } from "./AnswerCallUseCase.js";

describe("AnswerCallUseCase", () => {
  it("answers incoming call through CallEngine", async () => {
    const telephony = new MockTelephonyGateway();
    const callId = createCallId("incoming-answer-1");
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    await engine.handleIncomingReceived({
      notification: {
        callId,
        remoteNumber: "+12025550141",
        correlationId: createCorrelationId(),
      },
    });

    const useCase = new AnswerCallUseCase(engine, createTestLogger());
    const result = await useCase.execute({ callId });
    expect(result.ok).toBe(true);
    expect(telephony.getAnsweredCalls()).toEqual(["incoming-answer-1"]);
  });
});
