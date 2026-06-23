import { describe, expect, it } from "vitest";
import {
  createCorrelationId,
  isCorrelationId,
} from "./createCorrelationId.js";

describe("createCorrelationId", () => {
  it("creates a branded correlation id with expected prefix", () => {
    const id = createCorrelationId();
    expect(id.startsWith("corr_")).toBe(true);
    expect(isCorrelationId(id)).toBe(true);
  });

  it("creates unique ids", () => {
    const first = createCorrelationId();
    const second = createCorrelationId();
    expect(first).not.toBe(second);
  });
});

describe("isCorrelationId", () => {
  it("rejects non-correlation strings", () => {
    expect(isCorrelationId("not-a-correlation-id")).toBe(false);
  });
});
