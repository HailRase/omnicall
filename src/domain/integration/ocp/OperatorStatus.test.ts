import { describe, expect, it } from "vitest";

import {
  OperatorStatus,
  parseOperatorStatus,
  resolveOperatorReasonId,
} from "./OperatorStatus.js";

describe("OperatorStatus", () => {
  it("exposes canonical numeric values 1-15", () => {
    expect(OperatorStatus.READY).toBe(1);
    expect(OperatorStatus.CONNECTION).toBe(15);
  });

  it("parses known status values and rejects unknown", () => {
    expect(parseOperatorStatus(OperatorStatus.TALKING)).toBe(OperatorStatus.TALKING);
    expect(parseOperatorStatus(99)).toBeNull();
    expect(parseOperatorStatus("1")).toBeNull();
  });

  it("resolves omitted wire reason_id to the system status value", () => {
    expect(resolveOperatorReasonId(OperatorStatus.READY, null)).toBe(
      OperatorStatus.READY,
    );
    expect(resolveOperatorReasonId(OperatorStatus.RINGING, undefined)).toBe(
      OperatorStatus.RINGING,
    );
    expect(resolveOperatorReasonId(OperatorStatus.TALKING, Number.NaN)).toBe(
      OperatorStatus.TALKING,
    );
    expect(resolveOperatorReasonId(OperatorStatus.BREAK, 42)).toBe(42);
    expect(resolveOperatorReasonId(OperatorStatus.READY, 0)).toBe(0);
  });
});
