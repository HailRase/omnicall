import { describe, expect, it } from "vitest";
import {
  isReadyBlockedByDnd,
  mapDndToAgentBreakRequest,
} from "./DndAgentStatusPolicy.js";

describe("DndAgentStatusPolicy", () => {
  it("maps phone DND to break request when OCP available (LF-018)", () => {
    expect(
      mapDndToAgentBreakRequest("dnd", "ready", true),
    ).toEqual({ action: "request_break", trigger: "phone_dnd" });
  });

  it("does not map when already on break", () => {
    expect(mapDndToAgentBreakRequest("dnd", "break", true)).toEqual({
      action: "none",
    });
  });

  it("does not map when OCP unavailable (SIP-only)", () => {
    expect(mapDndToAgentBreakRequest("dnd", "ready", false)).toEqual({
      action: "none",
    });
  });

  it("does not map when phone is online", () => {
    expect(mapDndToAgentBreakRequest("online", "ready", true)).toEqual({
      action: "none",
    });
  });

  it("reports ready blocked by DND (LF-019)", () => {
    expect(isReadyBlockedByDnd("dnd")).toBe(true);
    expect(isReadyBlockedByDnd("online")).toBe(false);
    expect(isReadyBlockedByDnd("offline")).toBe(false);
  });
});
