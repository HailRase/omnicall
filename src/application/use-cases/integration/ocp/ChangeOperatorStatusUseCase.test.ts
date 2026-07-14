import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createOperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../../../events/InMemoryDomainEventBus.js";
import { ChangeOperatorStatusUseCase } from "./ChangeOperatorStatusUseCase.js";
import {
  createBusyOperatorProfile,
  createReadyOperatorProfile,
  MockDndReadModel,
  MockOcpOperatorReadModel,
} from "./ocpUseCaseTestDoubles.js";

describe("ChangeOperatorStatusUseCase", () => {
  function createUseCase(options?: Readonly<{
    profile?: ReturnType<typeof createReadyOperatorProfile>;
    dndEnabled?: boolean;
  }>) {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const bus = new InMemoryDomainEventBus();
    const published: string[] = [];
    bus.subscribe((event) => {
      published.push(event.type);
    });
    const setReservedStatus = vi.fn();
    return {
      gateway,
      published,
      setReservedStatus,
      useCase: new ChangeOperatorStatusUseCase({
        ocpGateway: gateway,
        operatorReadModel: new MockOcpOperatorReadModel(
          options?.profile ?? createReadyOperatorProfile(),
        ),
        dndReadModel: new MockDndReadModel(options?.dndEnabled ?? false),
        logger: createTestLogger(),
        eventPublisher: bus,
        reservedStatusWriter: { setReservedStatus },
      }),
    };
  }

  it("routes idle operator to change_status_to_break", async () => {
    const { gateway, useCase } = createUseCase();

    const result = await useCase.execute({
      targetStatus: "break",
      reasonId: 7,
      callType: "internal",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        kind: "applied",
        targetStatus: "break",
        reasonId: 7,
      });
    }
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_break",
      operatorId: 42,
      reasonId: 7,
      callType: "internal",
    });
  });

  it("allows break-to-break reason change when idle", async () => {
    const { gateway, useCase } = createUseCase({
      profile: createOperatorProfile({
        operatorId: 42,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        statusSince: new Date("2026-07-13T12:00:00.000Z"),
      }),
    });

    const result = await useCase.execute({
      targetStatus: "break",
      reasonId: 11,
      callType: "internal",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()?.kind).toBe("change_status_to_break");
  });

  it("allows preparing-to-work to ready", async () => {
    const { gateway, useCase } = createUseCase({
      profile: createOperatorProfile({
        operatorId: 42,
        status: OperatorStatus.PREPARING_TO_WORK,
        reasonId: 0,
        statusSince: new Date("2026-07-13T12:00:00.000Z"),
      }),
    });

    const result = await useCase.execute({
      targetStatus: "ready",
      reasonId: 1,
      callType: "internal",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()?.kind).toBe("change_status_to_ready");
  });

  it("routes busy operator to update_post_call_status and publishes reservation", async () => {
    const { gateway, useCase, published, setReservedStatus } = createUseCase({
      profile: createBusyOperatorProfile(OperatorStatus.TALKING),
    });

    const result = await useCase.execute({
      targetStatus: "ready",
      reasonId: 1,
      callType: "external",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("reserved");
    }
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "update_post_call_status",
      operatorId: 42,
      reasonId: 1,
      reservedStatus: OperatorStatus.READY,
    });
    expect(published).toContain("OperatorStatusReservationSet");
    expect(setReservedStatus).toHaveBeenCalledWith(OperatorStatus.READY, 1);
  });

  it("blocks ready when DND is enabled", async () => {
    const { gateway, useCase } = createUseCase({ dndEnabled: true });

    const result = await useCase.execute({
      targetStatus: "ready",
      reasonId: 1,
      callType: "internal",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("dnd_blocks_ready");
    }
    expect(gateway.getSentCommands()).toHaveLength(0);
  });

  it("auto-routes post-call processing to reserve (host/DND compatible)", async () => {
    const { gateway, useCase } = createUseCase({
      profile: createBusyOperatorProfile(OperatorStatus.POST_CALL_PROCESSING),
    });

    const result = await useCase.execute({
      targetStatus: "ready",
      reasonId: 1,
      callType: "internal",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()?.kind).toBe("update_post_call_status");
  });

  it("applies direct ready from post-call when intent is apply", async () => {
    const { gateway, useCase, published } = createUseCase({
      profile: createBusyOperatorProfile(OperatorStatus.POST_CALL_PROCESSING),
    });

    const result = await useCase.execute({
      targetStatus: "ready",
      reasonId: 1,
      callType: "internal",
      intent: "apply",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("applied");
    }
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_ready",
      operatorId: 42,
      reasonId: 1,
      callType: "internal",
    });
    expect(published).not.toContain("OperatorStatusReservationSet");
  });

  it("reserves when intent is reserve even from idle", async () => {
    const { gateway, useCase } = createUseCase();

    const result = await useCase.execute({
      targetStatus: "break",
      reasonId: 7,
      callType: "internal",
      intent: "reserve",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()?.kind).toBe("update_post_call_status");
  });

  it("rejects FSM-invalid idle transition", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const useCase = new ChangeOperatorStatusUseCase({
      ocpGateway: gateway,
      operatorReadModel: new MockOcpOperatorReadModel(
        createOperatorProfile({
          operatorId: 42,
          status: OperatorStatus.LOGOUT,
          reasonId: 9,
          statusSince: new Date("2026-07-13T12:00:00.000Z"),
        }),
      ),
      dndReadModel: new MockDndReadModel(false),
      logger: createTestLogger(),
      eventPublisher: new InMemoryDomainEventBus(),
      reservedStatusWriter: { setReservedStatus: vi.fn() },
    });

    const result = await useCase.execute({
      targetStatus: "break",
      reasonId: 7,
      callType: "internal",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("transition_not_allowed");
    }
    expect(gateway.getSentCommands()).toHaveLength(0);
  });
});
