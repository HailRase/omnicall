import { describe, expect, it } from "vitest";
import { deriveCallLineStatusLabel } from "./deriveCallLineStatusLabel.js";

describe("deriveCallLineStatusLabel", () => {
  it("maps active state to on line", () => {
    expect(deriveCallLineStatusLabel({ state: "Active" })).toBe("On line");
  });

  it("maps held state to on hold", () => {
    expect(deriveCallLineStatusLabel({ state: "Held" })).toBe("On hold");
  });

  it("prefers remote hold label over held state", () => {
    expect(deriveCallLineStatusLabel({ state: "Held", isRemoteHold: true })).toBe(
      "On remote hold",
    );
  });

  it("maps connecting and ringing states", () => {
    expect(deriveCallLineStatusLabel({ state: "Connecting" })).toBe("Connecting");
    expect(deriveCallLineStatusLabel({ state: "Ringing" })).toBe("Ringing");
  });

  it("maps transfer and terminal states", () => {
    expect(deriveCallLineStatusLabel({ state: "Transferring" })).toBe("Transferring");
    expect(deriveCallLineStatusLabel({ state: "Ending" })).toBe("Ending");
    expect(deriveCallLineStatusLabel({ state: "Failed" })).toBe("Failed");
  });
});
