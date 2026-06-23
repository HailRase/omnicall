import { describe, expect, it } from "vitest";
import { validateBreakReason } from "./BreakReason.js";

describe("BreakReason", () => {
  const allowedReasons = ["break", "meeting", "training"];

  it("validates required reason", () => {
    expect(validateBreakReason(" ", allowedReasons)).toEqual([
      "break_reason_required",
    ]);
  });

  it("validates allowed reason", () => {
    expect(validateBreakReason("lunch", allowedReasons)).toEqual([
      "break_reason_not_allowed",
    ]);
  });

  it("accepts allowed value", () => {
    expect(validateBreakReason("meeting", allowedReasons)).toEqual([]);
  });
});
