import { describe, expect, it } from "vitest";
import { createBreakReason } from "./BreakReason.js";
import { isAgentBreakReasonRequired } from "./AgentBreakReasonPolicy.js";

describe("AgentBreakReasonPolicy", () => {
  const reasons = [createBreakReason("meeting")];

  it("requires reason for user break when reasons configured", () => {
    expect(isAgentBreakReasonRequired("break", reasons, "user")).toBe(true);
  });

  it("skips reason for phone_dnd system trigger", () => {
    expect(isAgentBreakReasonRequired("break", reasons, "phone_dnd")).toBe(false);
  });

  it("does not require reason when list is empty", () => {
    expect(isAgentBreakReasonRequired("break", [], "user")).toBe(false);
  });
});
