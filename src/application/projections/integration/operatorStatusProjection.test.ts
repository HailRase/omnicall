import { describe, expect, it } from "vitest";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import {
  applyOperatorReservedStatus,
  initialOperatorStatusProjection,
  normalizeReasonId,
  reduceOperatorStatusFromUsers,
  selectIsCallButtonBlocked,
  selectOperatorIsBusy,
  selectOperatorStatus,
  toOperatorProfile,
} from "./operatorStatusProjection.js";

describe("operatorStatusProjection", () => {
  it("updates from users payload and resolves omitted reason_id to status", () => {
    const projection = reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
      operatorId: 7,
      status: OperatorStatus.READY,
      reasonId: Number.NaN,
      statusSince: "2026-07-14T10:00:00.000Z",
    });

    expect(projection.operatorId).toBe(7);
    expect(selectOperatorStatus(projection)).toBe(OperatorStatus.READY);
    expect(projection.reasonId).toBe(OperatorStatus.READY);
    expect(normalizeReasonId(undefined)).toBe(0);
    expect(selectOperatorIsBusy(projection)).toBe(false);
    expect(toOperatorProfile(projection)?.operatorId).toBe(7);
  });

  it("keeps explicit break reason_id from users payload", () => {
    const projection = reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
      operatorId: 7,
      status: OperatorStatus.BREAK,
      reasonId: 42,
      statusSince: "2026-07-14T10:00:00.000Z",
    });

    expect(projection.status).toBe(OperatorStatus.BREAK);
    expect(projection.reasonId).toBe(42);
  });

  it("marks busy talking and blocks call button on RESERVED_TO_CALL", () => {
    const talking = reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
      operatorId: 1,
      status: OperatorStatus.TALKING,
      reasonId: 2,
      statusSince: "2026-07-14T10:00:00.000Z",
    });
    expect(selectOperatorIsBusy(talking)).toBe(true);

    const reserved = reduceOperatorStatusFromUsers(talking, {
      operatorId: 1,
      status: OperatorStatus.RESERVED_TO_CALL,
      reasonId: 0,
      statusSince: "2026-07-14T10:01:00.000Z",
    });
    expect(selectIsCallButtonBlocked(reserved)).toBe(true);
  });

  it("stores reserved status for OcpOperatorReadModel", () => {
    const projection = applyOperatorReservedStatus(
      initialOperatorStatusProjection(),
      OperatorStatus.BREAK,
      7,
    );
    expect(projection.reservedStatus).toBe(OperatorStatus.BREAK);
    expect(projection.reservedReasonId).toBe(7);
  });

  it("clears reserved status when operator returns to idle", () => {
    const reserved = applyOperatorReservedStatus(
      reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
        operatorId: 1,
        status: OperatorStatus.POST_CALL_PROCESSING,
        reasonId: 5,
        statusSince: "2026-07-14T10:00:00.000Z",
      }),
      OperatorStatus.BREAK,
      7,
    );
    expect(reserved.reservedStatus).toBe(OperatorStatus.BREAK);

    const idle = reduceOperatorStatusFromUsers(reserved, {
      operatorId: 1,
      status: OperatorStatus.READY,
      reasonId: 1,
      statusSince: "2026-07-14T10:02:00.000Z",
    });
    expect(idle.status).toBe(OperatorStatus.READY);
    expect(idle.reservedStatus).toBeNull();
    expect(idle.reservedReasonId).toBeNull();
  });

  it("keeps reserved status while staying busy through post-call", () => {
    const talking = reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
      operatorId: 1,
      status: OperatorStatus.TALKING,
      reasonId: 4,
      statusSince: "2026-07-14T10:00:00.000Z",
    });
    const reserved = applyOperatorReservedStatus(talking, OperatorStatus.BREAK, 7);
    const postCall = reduceOperatorStatusFromUsers(reserved, {
      operatorId: 1,
      status: OperatorStatus.POST_CALL_PROCESSING,
      reasonId: 5,
      statusSince: "2026-07-14T10:01:00.000Z",
    });
    expect(postCall.reservedStatus).toBe(OperatorStatus.BREAK);
    expect(postCall.reservedReasonId).toBe(7);
  });
});
