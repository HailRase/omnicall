import { describe, expect, it } from "vitest";

import { buildOcpCommandPayload } from "./buildOcpCommandPayload.js";

describe("buildOcpCommandPayload", () => {
  it("maps callType sdk to function_call_type external on status commands", () => {
    for (const kind of [
      "change_status_to_ready",
      "change_status_to_break",
      "change_status_to_logout",
    ] as const) {
      const result = buildOcpCommandPayload({
        kind,
        operatorId: 42,
        reasonId: 28,
        callType: "sdk",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.value.payload).toEqual({
        operator_id: 42,
        reason_id: 28,
        function_call_type: "external",
      });
    }
  });

  it("preserves internal and external on the wire", () => {
    const internal = buildOcpCommandPayload({
      kind: "change_status_to_break",
      operatorId: 1,
      reasonId: 7,
      callType: "internal",
    });
    expect(internal.ok).toBe(true);
    if (internal.ok) {
      expect(internal.value.payload).toMatchObject({
        function_call_type: "internal",
      });
    }

    const external = buildOcpCommandPayload({
      kind: "change_status_to_ready",
      operatorId: 1,
      reasonId: 1,
      callType: "external",
    });
    expect(external.ok).toBe(true);
    if (external.ok) {
      expect(external.value.payload).toMatchObject({
        function_call_type: "external",
      });
    }
  });

  it("maps get_main_acallid SIP callId to wire acallid + parties + user_login + event", () => {
    const result = buildOcpCommandPayload({
      kind: "get_main_acallid",
      callId: "sip-session-1",
      userLogin: "yura.supervisor",
      callerId: "37500932367",
      calledId: "yura.supervisor",
      lifecycleEvent: "incomingCallProgress",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toEqual({
      command: "get_main_acallid",
      entity: "calls",
      type: "get_main_acallid_calls",
      payload: {
        acallid: "sip-session-1",
        user_login: "yura.supervisor",
        caller_id: "37500932367",
        called_id: "yura.supervisor",
        event: "incomingCallProgress",
      },
    });
    expect(result.value.payload).not.toHaveProperty("call_id");
  });
});
