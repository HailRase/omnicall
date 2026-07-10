import { describe, expect, it } from "vitest";
import {
  buildDialpadHistoryNumbers,
  resolveDialpadCallIntent,
  resolveHistoryWalkStep,
} from "./dialpadHistoryRecall.js";

describe("buildDialpadHistoryNumbers", () => {
  it("keeps newest-first unique numbers", () => {
    expect(buildDialpadHistoryNumbers(["100", "200", "100", " 300 ", ""])).toEqual([
      "100",
      "200",
      "300",
    ]);
  });
});

describe("resolveHistoryWalkStep", () => {
  const numbers = ["100", "200", "300"] as const;

  it("starts at newest on first step from null", () => {
    expect(resolveHistoryWalkStep(numbers, null, "newer")).toEqual({
      index: 0,
      number: "100",
    });
    expect(resolveHistoryWalkStep(numbers, null, "older")).toEqual({
      index: 0,
      number: "100",
    });
  });

  it("moves toward older and newer with clamps", () => {
    expect(resolveHistoryWalkStep(numbers, 0, "older")).toEqual({
      index: 1,
      number: "200",
    });
    expect(resolveHistoryWalkStep(numbers, 1, "newer")).toEqual({
      index: 0,
      number: "100",
    });
    expect(resolveHistoryWalkStep(numbers, 0, "newer")).toEqual({
      index: 0,
      number: "100",
    });
    expect(resolveHistoryWalkStep(numbers, 2, "older")).toEqual({
      index: 2,
      number: "300",
    });
  });

  it("returns null for empty history", () => {
    expect(resolveHistoryWalkStep([], null, "newer")).toBeNull();
  });
});

describe("resolveDialpadCallIntent", () => {
  it("fills last history number when input is empty", () => {
    expect(resolveDialpadCallIntent("", "555")).toEqual({ type: "fill", number: "555" });
  });

  it("dials trimmed input when present", () => {
    expect(resolveDialpadCallIntent(" 42 ", "555")).toEqual({ type: "dial", number: "42" });
  });

  it("noops when empty and no history", () => {
    expect(resolveDialpadCallIntent("", null)).toEqual({ type: "noop" });
  });
});
