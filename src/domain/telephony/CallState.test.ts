import { describe, expect, it } from "vitest";
import { isTerminalCallState } from "./CallState.js";

describe("isTerminalCallState", () => {
  it("returns true for Ended and Failed", () => {
    expect(isTerminalCallState("Ended")).toBe(true);
    expect(isTerminalCallState("Failed")).toBe(true);
  });

  it("returns false for live call states", () => {
    expect(isTerminalCallState("Active")).toBe(false);
    expect(isTerminalCallState("Held")).toBe(false);
    expect(isTerminalCallState("Transferring")).toBe(false);
  });
});
