import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { LogoutOperatorUseCase } from "./LogoutOperatorUseCase.js";
import { createReadyOperatorProfile, MockOcpOperatorReadModel } from "./ocpUseCaseTestDoubles.js";

describe("LogoutOperatorUseCase", () => {
  it("sends logout command and disconnects gateway", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new LogoutOperatorUseCase({
      ocpGateway: gateway,
      operatorReadModel: new MockOcpOperatorReadModel(createReadyOperatorProfile()),
      eventPublisher: events,
      logger: createTestLogger(),
    });

    const result = await useCase.execute({
      reasonId: 9,
      callType: "internal",
      cascadeSipLogout: false,
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_logout",
      operatorId: 42,
      reasonId: 9,
      callType: "internal",
    });
    expect(gateway.getConnectionState()).toBe("disconnected");
    expect(published).toEqual(["OperatorSessionEnded"]);
  });

  it("publishes OperatorLoggedOut when cascadeSipLogout is true", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new LogoutOperatorUseCase({
      ocpGateway: gateway,
      operatorReadModel: new MockOcpOperatorReadModel(createReadyOperatorProfile()),
      eventPublisher: events,
      logger: createTestLogger(),
    });

    const result = await useCase.execute({
      reasonId: 9,
      callType: "external",
      cascadeSipLogout: true,
    });

    expect(result.ok).toBe(true);
    expect(published).toContain("OperatorSessionEnded");
    expect(published).toContain("OperatorLoggedOut");
  });
});
