import { describe, expect, it } from "vitest";
import { deriveCallLineStatusLabel } from "./deriveCallLineStatusLabel.js";

describe("deriveCallLineStatusLabel", () => {
  it("maps active state to on line", () => {
    expect(deriveCallLineStatusLabel({ state: "Active" })).toBe("call.line.status.active");
  });

  it("maps held state to on hold", () => {
    expect(deriveCallLineStatusLabel({ state: "Held" })).toBe("call.line.status.held");
  });

  it("prefers held state label when both local and remote hold are active", () => {
    expect(deriveCallLineStatusLabel({ state: "Held" })).toBe("call.line.status.held");
  });

  it("keeps active label when only remote hold is active", () => {
    expect(deriveCallLineStatusLabel({ state: "Active" })).toBe("call.line.status.active");
  });

  it("maps connecting and ringing states", () => {
    expect(deriveCallLineStatusLabel({ state: "Connecting" })).toBe(
      "call.line.status.connecting",
    );
    expect(deriveCallLineStatusLabel({ state: "Ringing" })).toBe("call.line.status.ringing");
  });

  it("maps transfer and terminal states", () => {
    expect(deriveCallLineStatusLabel({ state: "Transferring" })).toBe(
      "call.line.status.transferring",
    );
    expect(deriveCallLineStatusLabel({ state: "Ending" })).toBe("call.line.status.ending");
    expect(deriveCallLineStatusLabel({ state: "Failed" })).toBe("call.line.status.failed");
  });
});
