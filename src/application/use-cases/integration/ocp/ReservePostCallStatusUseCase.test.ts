import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../../../events/InMemoryDomainEventBus.js";
import { ReservePostCallStatusUseCase } from "./ReservePostCallStatusUseCase.js";

describe("ReservePostCallStatusUseCase", () => {
  it("always sends update_post_call_status and publishes reservation event", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const bus = new InMemoryDomainEventBus();
    const published: string[] = [];
    bus.subscribe((event) => {
      published.push(event.type);
    });
    const setReservedStatus = vi.fn();
    const useCase = new ReservePostCallStatusUseCase({
      ocpGateway: gateway,
      eventPublisher: bus,
      logger: createTestLogger(),
      reservedStatusWriter: { setReservedStatus },
    });

    const result = await useCase.execute({
      operatorId: 7,
      targetStatus: "break",
      reasonId: 7,
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "update_post_call_status",
      operatorId: 7,
      reasonId: 7,
      reservedStatus: OperatorStatus.BREAK,
    });
    expect(setReservedStatus).toHaveBeenCalledWith(OperatorStatus.BREAK, 7);
    expect(published).toContain("OperatorStatusReservationSet");
  });
});
