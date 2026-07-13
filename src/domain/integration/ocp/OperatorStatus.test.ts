import { describe, expect, it } from "vitest";

import { OperatorStatus, parseOperatorStatus } from "./OperatorStatus.js";

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
});
