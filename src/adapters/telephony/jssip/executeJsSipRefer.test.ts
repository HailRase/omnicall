import { describe, expect, it } from "vitest";
import { executeJsSipRefer } from "./executeJsSipRefer.js";
import type {
  JsSipReferCommandOptions,
  JsSipRtcSessionEventName,
  JsSipRtcSessionListener,
  JsSipRtcSessionPort,
} from "./JsSipRtcSessionPort.js";

class TestReferSession implements JsSipRtcSessionPort {
  private readonly listeners = new Map<JsSipRtcSessionEventName, Set<JsSipRtcSessionListener>>();
  readonly id = "refer-session";
  referInvocations: Array<{ target: string; options?: JsSipReferCommandOptions }> = [];
  scenario: "accepted" | "session_ended_after_202" | "ended_before_202" | "notify_failed" =
    "accepted";

  on(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    const bucket = this.listeners.get(event) ?? new Set<JsSipRtcSessionListener>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
  }

  off(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: JsSipRtcSessionEventName): void {
    const bucket = this.listeners.get(event);
    if (bucket === undefined) {
      return;
    }
    for (const listener of bucket) {
      listener();
    }
  }

  refer(target: string, options?: JsSipReferCommandOptions): unknown {
    if (options !== undefined) {
      this.referInvocations.push({ target, options });
    } else {
      this.referInvocations.push({ target });
    }
    const handlers = options?.eventHandlers;
    queueMicrotask(() => {
      if (this.scenario === "ended_before_202") {
        this.emit("ended");
        return;
      }
      handlers?.["requestSucceeded"]?.({ response: { status_code: 202 } });
      if (this.scenario === "session_ended_after_202") {
        this.emit("ended");
        return;
      }
      if (this.scenario === "notify_failed") {
        handlers?.["failed"]?.({ status_line: { status_code: 487, reason_phrase: "Request Terminated" } });
        return;
      }
      handlers?.["accepted"]?.({ status_line: { status_code: 200, reason_phrase: "OK" } });
    });
    return { id: "refer-subscriber" };
  }

  answer(): void {}
  terminate(): void {}
  hold(): boolean {
    return true;
  }
  unhold(): boolean {
    return true;
  }
  sendDtmf(): void {}
  getConnection(): unknown {
    return null;
  }
  getRemoteIdentityHeader(): string {
    return '"Peer" <sip:100@pbx.example>';
  }
}

describe("executeJsSipRefer", () => {
  it("succeeds on NOTIFY accepted", async () => {
    const session = new TestReferSession();
    const result = await executeJsSipRefer(session, "sip:401@pbx.example");
    expect(result.ok).toBe(true);
  });

  it("succeeds when dialog ends after REFER 202 without NOTIFY", async () => {
    const session = new TestReferSession();
    session.scenario = "session_ended_after_202";
    const result = await executeJsSipRefer(session, "sip:80336647132@pbx.example");
    expect(result.ok).toBe(true);
  });

  it("fails when session ends before REFER 202", async () => {
    const session = new TestReferSession();
    session.scenario = "ended_before_202";
    const result = await executeJsSipRefer(session, "sip:80336647132@pbx.example");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("SIP session ended before REFER completed");
    }
  });

  it("fails on NOTIFY failure before session end", async () => {
    const session = new TestReferSession();
    session.scenario = "notify_failed";
    const result = await executeJsSipRefer(session, "sip:401@pbx.example");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Transfer target canceled");
    }
  });

  it("maps synchronous REFER throws to operation_failed", async () => {
    const session: JsSipRtcSessionPort = {
      id: "throwing-session",
      on: () => undefined,
      off: () => undefined,
      answer: () => undefined,
      terminate: () => undefined,
      hold: () => true,
      unhold: () => true,
      refer: () => {
        throw new TypeError("Cannot read properties of undefined (reading 'call_id')");
      },
      sendDtmf: () => undefined,
      getConnection: () => null,
      getRemoteIdentityHeader: () => '"Peer" <sip:100@pbx.example>',
    };

    const result = await executeJsSipRefer(session, "sip:401@pbx.example", {
      replacesRawSession: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("call_id");
    }
  });
});
