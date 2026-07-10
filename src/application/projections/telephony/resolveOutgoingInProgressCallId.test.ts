import { describe, expect, it } from "vitest";
import { resolveOutgoingInProgressCallId } from "./resolveOutgoingInProgressCallId.js";

describe("resolveOutgoingInProgressCallId", () => {
  it("returns Connecting call over other lines", () => {
    expect(
      resolveOutgoingInProgressCallId({
        lines: [
          { callId: "held-1", state: "Held" },
          { callId: "out-1", state: "Connecting" },
        ],
        incomingCallId: null,
      }),
    ).toBe("out-1");
  });

  it("returns outbound Ringing when not the waiting incoming", () => {
    expect(
      resolveOutgoingInProgressCallId({
        lines: [
          { callId: "out-1", state: "Ringing" },
          { callId: "in-1", state: "Ringing" },
        ],
        incomingCallId: "in-1",
      }),
    ).toBe("out-1");
  });

  it("ignores incoming Ringing when it is the waiting incoming", () => {
    expect(
      resolveOutgoingInProgressCallId({
        lines: [{ callId: "in-1", state: "Ringing" }],
        incomingCallId: "in-1",
      }),
    ).toBeNull();
  });

  it("returns null when no outbound progress exists", () => {
    expect(
      resolveOutgoingInProgressCallId({
        lines: [
          { callId: "active-1", state: "Active" },
          { callId: "held-1", state: "Held" },
        ],
        incomingCallId: null,
      }),
    ).toBeNull();
  });
});
