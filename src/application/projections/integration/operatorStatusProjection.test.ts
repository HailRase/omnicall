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
  it("updates from users payload and normalizes reason_id", () => {
    const projection = reduceOperatorStatusFromUsers(initialOperatorStatusProjection(), {
      operatorId: 7,
      status: OperatorStatus.READY,
      reasonId: Number.NaN,
      statusSince: "2026-07-14T10:00:00.000Z",
    });

    expect(projection.operatorId).toBe(7);
    expect(selectOperatorStatus(projection)).toBe(OperatorStatus.READY);
    expect(projection.reasonId).toBe(0);
    expect(normalizeReasonId(undefined)).toBe(0);
    expect(selectOperatorIsBusy(projection)).toBe(false);
    expect(toOperatorProfile(projection)?.operatorId).toBe(7);
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
});
