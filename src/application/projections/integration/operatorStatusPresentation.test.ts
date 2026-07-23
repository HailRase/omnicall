import { describe, expect, it } from "vitest";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import {
  resolveOperatorStatusOptionIsCurrent,
  resolvePostCallFinishAppealProjection,
} from "./operatorStatusPresentation.js";

describe("resolveOperatorStatusOptionIsCurrent", () => {
  it("matches idle Ready / Break by applied reasonId", () => {
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "ready",
        optionReasonId: 1,
        status: OperatorStatus.READY,
        reasonId: 1,
        reservedStatus: null,
        reservedReasonId: null,
      }),
    ).toBe(true);
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "break",
        optionReasonId: 7,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        reservedStatus: null,
        reservedReasonId: null,
      }),
    ).toBe(true);
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "break",
        optionReasonId: 8,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        reservedStatus: null,
        reservedReasonId: null,
      }),
    ).toBe(false);
  });

  it("does not mark Preparing or unmatched busy without booking", () => {
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "ready",
        optionReasonId: 1,
        status: OperatorStatus.PREPARING_TO_WORK,
        reasonId: 0,
        reservedStatus: null,
        reservedReasonId: null,
      }),
    ).toBe(false);
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "break",
        optionReasonId: 7,
        status: OperatorStatus.RINGING,
        reasonId: 0,
        reservedStatus: null,
        reservedReasonId: null,
      }),
    ).toBe(false);
  });

  it("marks reserved break during post-call processing", () => {
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "break",
        optionReasonId: 7,
        status: OperatorStatus.POST_CALL_PROCESSING,
        reasonId: 5,
        reservedStatus: OperatorStatus.BREAK,
        reservedReasonId: 7,
      }),
    ).toBe(true);
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "break",
        optionReasonId: 8,
        status: OperatorStatus.POST_CALL_PROCESSING,
        reasonId: 5,
        reservedStatus: OperatorStatus.BREAK,
        reservedReasonId: 7,
      }),
    ).toBe(false);
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "ready",
        optionReasonId: 1,
        status: OperatorStatus.POST_CALL_PROCESSING,
        reasonId: 5,
        reservedStatus: OperatorStatus.BREAK,
        reservedReasonId: 7,
      }),
    ).toBe(false);
  });

  it("marks reserved ready during talking", () => {
    expect(
      resolveOperatorStatusOptionIsCurrent({
        optionTarget: "ready",
        optionReasonId: 1,
        status: OperatorStatus.TALKING,
        reasonId: 4,
        reservedStatus: OperatorStatus.READY,
        reservedReasonId: 1,
      }),
    ).toBe(true);
  });
});

describe("resolvePostCallFinishAppealProjection", () => {
  it("surfaces reserved break target for finish footer", () => {
    const projection = resolvePostCallFinishAppealProjection(
      OperatorStatus.POST_CALL_PROCESSING,
      OperatorStatus.BREAK,
      7,
    );
    expect(projection).toEqual({
      visible: true,
      targetStatus: "break",
      reasonId: 7,
      usedReservation: true,
    });
  });

  it("defaults finish target to Ready when booking is absent", () => {
    const projection = resolvePostCallFinishAppealProjection(
      OperatorStatus.POST_CALL_PROCESSING,
      null,
      null,
    );
    expect(projection.usedReservation).toBe(false);
    expect(projection.targetStatus).toBe("ready");
    expect(projection.reasonId).toBe(OperatorStatus.READY);
  });
});
