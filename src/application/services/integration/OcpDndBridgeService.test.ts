import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPhoneStatusChangedEvent } from "@domain/index.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createOcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import {
  createBusyOperatorProfile,
  createReadyOperatorProfile,
  MockOcpOperatorReadModel,
} from "../../use-cases/integration/ocp/ocpUseCaseTestDoubles.js";
import { ChangeOperatorStatusUseCase } from "../../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import { ReservePostCallStatusUseCase } from "../../use-cases/integration/ocp/ReservePostCallStatusUseCase.js";
import { MockDndReadModel } from "../../use-cases/integration/ocp/ocpUseCaseTestDoubles.js";
import { OcpDndBridgeService } from "./OcpDndBridgeService.js";

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("OcpDndBridgeService", () => {
  it("changes to break when DND enables on idle operator", async () => {
    const gateway = new MockOcpGateway();
    const config = createOcpConnectionConfig({
      domain: "ocp.example",
      authToken: "token",
    });
    expect(config.ok).toBe(true);
    if (!config.ok) {
      return;
    }
    gateway.connect(config.value);

    const operatorReadModel = new MockOcpOperatorReadModel(createReadyOperatorProfile());
    const bus = new InMemoryDomainEventBus();
    const logger = createTestLogger({ featureId: "F-028", boundedContext: "Integration" });
    const changeOperatorStatus = new ChangeOperatorStatusUseCase({
      ocpGateway: gateway,
      operatorReadModel,
      dndReadModel: new MockDndReadModel(false),
      logger,
      eventPublisher: bus,
      reservedStatusWriter: { setReservedStatus: () => undefined },
    });
    const reservePostCallStatus = new ReservePostCallStatusUseCase({
      ocpGateway: gateway,
      eventPublisher: bus,
      logger,
      reservedStatusWriter: { setReservedStatus: () => undefined },
    });

    const bridge = new OcpDndBridgeService({
      eventPublisher: bus,
      operatorReadModel,
      isOcpAuthenticated: () => true,
      changeOperatorStatus,
      reservePostCallStatus,
      logger,
    });

    bus.publish(
      createPhoneStatusChangedEvent(createCorrelationId(), {
        previousStatus: "online",
        nextStatus: "dnd",
      }),
    );
    await flushMicrotasks();

    expect(gateway.getLastSentCommand()?.kind).toBe("change_status_to_break");
    bridge.dispose();
  });

  it("reserves break when DND enables on busy operator", async () => {
    const gateway = new MockOcpGateway();
    const config = createOcpConnectionConfig({
      domain: "ocp.example",
      authToken: "token",
    });
    expect(config.ok).toBe(true);
    if (!config.ok) {
      return;
    }
    gateway.connect(config.value);

    const operatorReadModel = new MockOcpOperatorReadModel(
      createBusyOperatorProfile(OperatorStatus.TALKING),
    );
    const bus = new InMemoryDomainEventBus();
    const logger = createTestLogger({ featureId: "F-028", boundedContext: "Integration" });
    const changeOperatorStatus = new ChangeOperatorStatusUseCase({
      ocpGateway: gateway,
      operatorReadModel,
      dndReadModel: new MockDndReadModel(false),
      logger,
      eventPublisher: bus,
      reservedStatusWriter: { setReservedStatus: () => undefined },
    });
    const reservePostCallStatus = new ReservePostCallStatusUseCase({
      ocpGateway: gateway,
      eventPublisher: bus,
      logger,
      reservedStatusWriter: { setReservedStatus: () => undefined },
    });

    const bridge = new OcpDndBridgeService({
      eventPublisher: bus,
      operatorReadModel,
      isOcpAuthenticated: () => true,
      changeOperatorStatus,
      reservePostCallStatus,
      logger,
    });

    bus.publish(
      createPhoneStatusChangedEvent(createCorrelationId(), {
        previousStatus: "online",
        nextStatus: "dnd",
      }),
    );
    await flushMicrotasks();

    expect(gateway.getLastSentCommand()).toMatchObject({
      kind: "update_post_call_status",
      reservedStatus: OperatorStatus.BREAK,
    });
    bridge.dispose();
  });
});
