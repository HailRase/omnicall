import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createBreakReason, createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { RejectCallUseCase } from "./RejectCallUseCase.js";

describe("RejectCallUseCase", () => {
  it("validates reject reason when required", async () => {
    const settings = new InMemorySettingsRepository({
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        autoAnswerDuringActiveSessionEnabled: false,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("break")],
      },
    });
    const engine = new CallEngine(
      new MockTelephonyGateway(),
      new MockMediaGateway(),
      settings,
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    const useCase = new RejectCallUseCase(engine, settings, createTestLogger());
    const result = await useCase.execute({
      callId: createCallId("incoming-reject-1"),
      breakReason: "meeting",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects incoming call with valid reason", async () => {
    const telephony = new MockTelephonyGateway();
    const callId = createCallId("incoming-reject-2");
    const settings = new InMemorySettingsRepository({
      phoneStatus: "online",
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        autoAnswerDuringActiveSessionEnabled: false,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("break")],
      },
    });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      settings,
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.handleIncomingReceived({
      notification: {
        callId,
        remoteNumber: "+12025550142",
        correlationId: createCorrelationId(),
      },
    });

    const useCase = new RejectCallUseCase(engine, settings, createTestLogger());
    const result = await useCase.execute({
      callId,
      breakReason: "break",
    });
    expect(result.ok).toBe(true);
    expect(telephony.getRejectedCalls()[0]?.reason).toBe("break");
  });
});
