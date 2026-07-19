import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../../../events/InMemoryDomainEventBus.js";
import { ChangeOperatorStatusUseCase } from "./ChangeOperatorStatusUseCase.js";
import { FinishPostCallAppealUseCase } from "./FinishPostCallAppealUseCase.js";
import {
  createBusyOperatorProfile,
  createReadyOperatorProfile,
  MockDndReadModel,
  MockOcpOperatorReadModel,
} from "./ocpUseCaseTestDoubles.js";

function createFinishUseCase(input: {
  profile?: ReturnType<typeof createBusyOperatorProfile> | null;
  reservedStatus?: typeof OperatorStatus.BREAK | typeof OperatorStatus.READY | null;
  reservedReasonId?: number | null;
  dndEnabled?: boolean;
}): Readonly<{
  gateway: MockOcpGateway;
  useCase: FinishPostCallAppealUseCase;
}> {
  const gateway = new MockOcpGateway();
  gateway.connect({ domain: "ocp.example.com", authToken: "token" });
  const readModel = new MockOcpOperatorReadModel(
    input.profile === undefined
      ? createBusyOperatorProfile(OperatorStatus.POST_CALL_PROCESSING)
      : input.profile,
    input.reservedStatus ?? null,
    input.reservedReasonId ?? null,
  );
  const changeOperatorStatus = new ChangeOperatorStatusUseCase({
    ocpGateway: gateway,
    operatorReadModel: readModel,
    dndReadModel: new MockDndReadModel(input.dndEnabled ?? false),
    logger: createTestLogger(),
    eventPublisher: new InMemoryDomainEventBus(),
    reservedStatusWriter: { setReservedStatus: vi.fn() },
  });
  const useCase = new FinishPostCallAppealUseCase({
    operatorReadModel: readModel,
    changeOperatorStatus,
    logger: createTestLogger(),
  });
  return { gateway, useCase };
}

describe("FinishPostCallAppealUseCase", () => {
  it("applies ready when no reservation exists", async () => {
    const { gateway, useCase } = createFinishUseCase({});

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_ready",
      operatorId: 42,
      reasonId: OperatorStatus.READY,
      callType: "internal",
    });
  });

  it("applies reserved break when reservation exists", async () => {
    const { gateway, useCase } = createFinishUseCase({
      reservedStatus: OperatorStatus.BREAK,
      reservedReasonId: 7,
    });

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "change_status_to_break",
      operatorId: 42,
      reasonId: 7,
      callType: "internal",
    });
  });

  it("rejects finish outside post-call processing", async () => {
    const { gateway, useCase } = createFinishUseCase({
      profile: createReadyOperatorProfile(),
    });

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("not_in_post_call_processing");
    }
    expect(gateway.getSentCommands()).toHaveLength(0);
  });

  it("blocks ready finish when DND is enabled and no break reservation", async () => {
    const { gateway, useCase } = createFinishUseCase({
      dndEnabled: true,
    });

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("dnd_blocks_ready");
    }
    expect(gateway.getSentCommands()).toHaveLength(0);
  });
});
