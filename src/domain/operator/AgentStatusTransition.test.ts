import { describe, expect, it } from "vitest";
import {
  getAllowedAgentStatusTransitions,
  validateAgentStatusTransition,
} from "./AgentStatusTransition.js";
import { createStatusReason } from "./StatusReason.js";

describe("AgentStatusTransition", () => {
  const baseContext = {
    phoneStatus: "online" as const,
    breakReasonRequired: false,
    reason: null,
  };

  it("lists allowed transitions from ready", () => {
    expect(getAllowedAgentStatusTransitions("ready")).toEqual(["break"]);
  });

  it("lists allowed transitions from break", () => {
    expect(getAllowedAgentStatusTransitions("break")).toEqual([
      "ready",
      "post_call",
    ]);
  });

  it("lists allowed transitions from post_call", () => {
    expect(getAllowedAgentStatusTransitions("post_call")).toEqual([
      "ready",
      "break",
    ]);
  });

  it("allows ready to break", () => {
    const result = validateAgentStatusTransition("ready", "break", baseContext);
    expect(result).toEqual({ ok: true, targetStatus: "break" });
  });

  it("allows break to ready when not DND", () => {
    const result = validateAgentStatusTransition("break", "ready", baseContext);
    expect(result).toEqual({ ok: true, targetStatus: "ready" });
  });

  it("allows post_call to ready when not DND", () => {
    const result = validateAgentStatusTransition(
      "post_call",
      "ready",
      baseContext,
    );
    expect(result).toEqual({ ok: true, targetStatus: "ready" });
  });

  it("allows post_call to break", () => {
    const result = validateAgentStatusTransition(
      "post_call",
      "break",
      { ...baseContext, reason: createStatusReason("meeting") },
    );
    expect(result).toEqual({ ok: true, targetStatus: "break" });
  });

  it("rejects same status with already_in_status", () => {
    const result = validateAgentStatusTransition("ready", "ready", baseContext);
    expect(result).toEqual({
      ok: false,
      reason: "already_in_status",
      currentStatus: "ready",
    });
  });

  it("rejects ready to post_call as invalid_transition", () => {
    const result = validateAgentStatusTransition(
      "ready",
      "post_call",
      baseContext,
    );
    expect(result).toEqual({
      ok: false,
      reason: "invalid_transition",
      currentStatus: "ready",
    });
  });

  it("rejects break to ready when DND active (LF-019)", () => {
    const result = validateAgentStatusTransition("break", "ready", {
      ...baseContext,
      phoneStatus: "dnd",
    });
    expect(result).toEqual({
      ok: false,
      reason: "dnd_blocks_ready",
      currentStatus: "break",
    });
  });

  it("rejects post_call to ready when DND active (LF-019)", () => {
    const result = validateAgentStatusTransition("post_call", "ready", {
      ...baseContext,
      phoneStatus: "dnd",
    });
    expect(result).toEqual({
      ok: false,
      reason: "dnd_blocks_ready",
      currentStatus: "post_call",
    });
  });

  it("allows ready to break while DND (LF-019 does not block break)", () => {
    const result = validateAgentStatusTransition("ready", "break", {
      ...baseContext,
      phoneStatus: "dnd",
      reason: createStatusReason("dnd"),
    });
    expect(result).toEqual({ ok: true, targetStatus: "break" });
  });

  it("rejects break without reason when required (LF-043 contract)", () => {
    const result = validateAgentStatusTransition("ready", "break", {
      ...baseContext,
      breakReasonRequired: true,
      reason: null,
    });
    expect(result).toEqual({
      ok: false,
      reason: "break_reason_required",
      currentStatus: "ready",
    });
  });

  it("allows break with reason when required", () => {
    const result = validateAgentStatusTransition("ready", "break", {
      ...baseContext,
      breakReasonRequired: true,
      reason: createStatusReason("meeting"),
    });
    expect(result).toEqual({ ok: true, targetStatus: "break" });
  });
});
