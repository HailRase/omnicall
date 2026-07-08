import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { InMemoryOcpSyncReadModel } from "../../read-models/InMemoryOcpSyncReadModel.js";
import { RespondToCampaignUseCase } from "./RespondToCampaignUseCase.js";
import { MockOcpSyncGateway } from "@adapters/mock/MockOcpSyncGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isErr, isOk } from "@shared/result/index.js";

function seedOcpReady(events: InMemoryDomainEventBus): void {
  events.publish({
    type: "OcpAuthenticationSucceeded",
    correlationId: createCorrelationId(),
    occurredAt: new Date().toISOString(),
    sessionId: "session-1",
    agentId: "agent-001",
  });
}

describe("RespondToCampaignUseCase", () => {
  it("publishes CampaignEventAnswered only after gateway success", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryOcpSyncReadModel(events);
    seedOcpReady(events);
    const gateway = new MockOcpSyncGateway();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new RespondToCampaignUseCase(
      gateway,
      readModel,
      events,
      createTestLogger(),
    );

    published.length = 0;
    const result = await useCase.execute({
      campaignId: "camp-1",
      decision: "accept",
      callId: createCallId("call-1"),
    });

    expect(isOk(result)).toBe(true);
    expect(published).toEqual(["CampaignEventAnswered"]);
    expect(gateway.getLastCampaignRespondCommand()?.decision).toBe("accept");
  });

  it("does not publish event when gateway rejects", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryOcpSyncReadModel(events);
    seedOcpReady(events);
    const gateway = new MockOcpSyncGateway();
    gateway.setCampaignRespondScenario("failed");
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new RespondToCampaignUseCase(
      gateway,
      readModel,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      campaignId: "camp-2",
      decision: "reject",
    });

    expect(isErr(result)).toBe(true);
    expect(published).toHaveLength(0);
  });

  it("returns error when OCP sync unavailable", async () => {
    const events = new InMemoryDomainEventBus();
    const readModel = new InMemoryOcpSyncReadModel(events);
    const gateway = new MockOcpSyncGateway();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const useCase = new RespondToCampaignUseCase(
      gateway,
      readModel,
      events,
      createTestLogger(),
    );

    const result = await useCase.execute({
      campaignId: "camp-3",
      decision: "accept",
    });

    expect(isErr(result)).toBe(true);
    expect(published).toHaveLength(0);
    if (isErr(result)) {
      expect(result.error.message).toContain("unavailable");
    }
  });
});
