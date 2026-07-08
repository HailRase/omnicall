import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { InMemoryAgentStatusReadModel } from "../../read-models/InMemoryAgentStatusReadModel.js";
import { LogoutOperatorUseCase } from "./LogoutOperatorUseCase.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createBreakReason } from "@domain/index.js";
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

describe("LogoutOperatorUseCase", () => {
  it("publishes AgentLogoutRequested and calls gateway on success", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryAgentStatusReadModel(events);
    seedOcpReady(events);
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new LogoutOperatorUseCase(
      readModel,
      new MockOperatorPlatformGateway(),
      new InMemorySettingsRepository({
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      events,
      createTestLogger(),
    );

    published.length = 0;
    const result = await useCase.execute({ reason: "end_of_shift" });

    expect(result.ok).toBe(true);
    expect(published).toEqual(["AgentLogoutRequested"]);
  });

  it("rejects when OCP unavailable", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new LogoutOperatorUseCase(
      new InMemoryAgentStatusReadModel(events),
      new MockOperatorPlatformGateway(),
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ reason: "end_of_shift" });

    expect(isErr(result)).toBe(true);
    expect(published).toHaveLength(0);
  });

  it("validates logout reason when break reasons configured", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryAgentStatusReadModel(events);
    seedOcpReady(events);
    const settings = new InMemorySettingsRepository({
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        autoAnswerDuringActiveSessionEnabled: false,
        rejectReasonRequired: true,
        allowedBreakReasons: [createBreakReason("meeting")],
      },
    });
    const useCase = new LogoutOperatorUseCase(
      readModel,
      new MockOperatorPlatformGateway(),
      settings,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({ reason: "invalid" });

    expect(isErr(result)).toBe(true);
  });

  it("returns gateway failure without additional events", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryAgentStatusReadModel(events);
    seedOcpReady(events);
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const gateway = new MockOperatorPlatformGateway({ logoutScenario: "rejected" });
    const useCase = new LogoutOperatorUseCase(
      readModel,
      gateway,
      new InMemorySettingsRepository({
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      events,
      createTestLogger(),
    );

    published.length = 0;
    const result = await useCase.execute({ reason: "end_of_shift" });

    expect(isErr(result)).toBe(true);
    expect(published).toEqual(["AgentLogoutRequested"]);
  });
});
