import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createOperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
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
    return {
      gateway,
      useCase: new ChangeOperatorStatusUseCase({
        ocpGateway: gateway,
        operatorReadModel: new MockOcpOperatorReadModel(
          options?.profile ?? createReadyOperatorProfile(),
        ),
        dndReadModel: new MockDndReadModel(options?.dndEnabled ?? false),
        logger: createTestLogger(),
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
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_break",
      operatorId: 42,
      reasonId: 7,
      callType: "internal",
    });
  });

  it("routes busy operator to update_post_call_status", async () => {
    const { gateway, useCase } = createUseCase({
      profile: createBusyOperatorProfile(OperatorStatus.TALKING),
    });

    const result = await useCase.execute({
      targetStatus: "ready",
      reasonId: 1,
      callType: "external",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "update_post_call_status",
      operatorId: 42,
      reasonId: 1,
      reservedStatus: OperatorStatus.READY,
    });
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

  it("routes post-call processing via direct ready command when idle FSM allows", async () => {
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
