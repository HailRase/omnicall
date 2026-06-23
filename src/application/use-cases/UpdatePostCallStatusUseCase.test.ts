import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { InMemoryAgentStatusReadModel } from "../read-models/InMemoryAgentStatusReadModel.js";
import { UpdatePostCallStatusUseCase } from "./UpdatePostCallStatusUseCase.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId, createBreakReason } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";

function seedOcpReady(events: InMemoryDomainEventBus): void {
  events.publish({
    type: "OcpAuthenticationSucceeded",
    correlationId: createCorrelationId(),
    occurredAt: new Date().toISOString(),
    sessionId: "session-1",
    agentId: "agent-001",
  });
}

describe("UpdatePostCallStatusUseCase", () => {
  it("publishes PostCallStatusUpdated and AgentStatusChanged after gateway success", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryAgentStatusReadModel(events);
    seedOcpReady(events);
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const settings = new InMemorySettingsRepository({
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("meeting")],
      },
    });
    const useCase = new UpdatePostCallStatusUseCase(
      readModel,
      new MockOperatorPlatformGateway(),
      settings,
      events,
      createTestLogger(),
    );

    published.length = 0;
    const result = await useCase.execute({
      callId: createCallId("call-1"),
      breakReason: "meeting",
    });

    expect(result.ok).toBe(true);
    expect(published).toEqual(["PostCallStatusUpdated", "AgentStatusChanged"]);
  });

  it("no-ops when OCP unavailable", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new UpdatePostCallStatusUseCase(
      new InMemoryAgentStatusReadModel(events),
      new MockOperatorPlatformGateway(),
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      callId: createCallId("call-2"),
      breakReason: "meeting",
    });

    expect(result.ok).toBe(true);
    expect(published).toHaveLength(0);
  });

  it("returns validation error for invalid break reason", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryAgentStatusReadModel(events);
    seedOcpReady(events);
    const settings = new InMemorySettingsRepository({
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("meeting")],
      },
    });
    const useCase = new UpdatePostCallStatusUseCase(
      readModel,
      new MockOperatorPlatformGateway(),
      settings,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      callId: createCallId("call-3"),
      breakReason: "invalid",
    });

    expect(isErr(result)).toBe(true);
  });
});
