import { describe, expect, it } from "vitest";
import type {
  JsSipRtcSessionEventName,
  JsSipRtcSessionListener,
  JsSipRtcSessionPort,
} from "./JsSipRtcSessionPort.js";
import { executeJsSipHoldResume } from "./executeJsSipHoldResume.js";

class TestRtcSession implements JsSipRtcSessionPort {
  private readonly listeners = new Map<
    JsSipRtcSessionEventName,
    Set<JsSipRtcSessionListener>
  >();
  readonly id = "test-session";
  holdCalls = 0;
  holdShouldStart = true;
  holdShouldSucceed = true;

  on(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    const bucket = this.listeners.get(event) ?? new Set<JsSipRtcSessionListener>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
  }

  off(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: JsSipRtcSessionEventName, payload?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload);
    }
  }

  answer(): void {}

  terminate(): void {}

  hold(_options?: Readonly<Record<string, unknown>>, done?: () => void): boolean {
    if (!this.holdShouldStart) {
      return false;
    }
    this.holdCalls += 1;
    queueMicrotask(() => {
      if (this.holdShouldSucceed && done !== undefined) {
        done();
        return;
      }
      this.emit("failed", { cause: "Hold Failed" });
    });
    return true;
  }

  unhold(_options?: Readonly<Record<string, unknown>>, done?: () => void): boolean {
    return this.hold(_options, done);
  }

  refer(): unknown {
    return false;
  }

  sendDtmf(): void {}

  getConnection(): unknown {
    return null;
  }

  getRemoteIdentityHeader(): string {
    return '"Peer" <sip:peer@example.com>';
  }
}

describe("executeJsSipHoldResume", () => {
  it("resolves when hold re-INVITE succeeds", async () => {
    const session = new TestRtcSession();
    const result = await executeJsSipHoldResume(session, "hold");
    expect(result.ok).toBe(true);
    expect(session.holdCalls).toBe(1);
  });

  it("maps unavailable hold to operation_failed", async () => {
    const session = new TestRtcSession();
    session.holdShouldStart = false;
    const result = await executeJsSipHoldResume(session, "hold");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("not available");
    }
  });

  it("maps hold failure event to operation_failed", async () => {
    const session = new TestRtcSession();
    session.holdShouldSucceed = false;
    const result = await executeJsSipHoldResume(session, "unhold");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("unhold failed");
    }
  });
});
